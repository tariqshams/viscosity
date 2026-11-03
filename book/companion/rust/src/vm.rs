//! The bytecode virtual machine (the book's chapters “A stack machine and its dispatch loop” and “String interning and globals by name” to 60). It runs
//! the same instructions as the TypeScript VM, with the same results and
//! the same error messages, to the byte.

use std::rc::Rc;
use std::time::Instant;

use crate::chunk::{Chunk, OpCode};
use crate::compiler::compile;
use crate::gc::{Heap, HeapObject, Marks, Trace};
use crate::object::{
    Gc, Native, ObjBoundMethod, ObjClass, ObjClosure, ObjFunction, ObjInstance, ObjList,
    ObjNative, ObjUpvalue, StrRef,
};
use crate::table::Table;
use crate::value::{Value, describe, format_number};

/// The deepest calls may nest before "stack overflow"; the TypeScript
/// implementations have the same limit.
pub const FRAMES_MAX: usize = 256;
/// Room for every frame to use all 256 of its slots.
const STACK_MAX: usize = FRAMES_MAX * 256;

/// The exit codes of the command-line tools.
pub const EXIT_COMPILE_ERROR: i32 = 65;
pub const EXIT_RUNTIME_ERROR: i32 = 70;

/// One function call in progress.
struct CallFrame {
    closure: Gc<ObjClosure>,
    /// The closure's function's bytecode.
    chunk: Rc<Chunk>,
    /// The instruction pointer: index of the next byte to run. For the
    /// running frame the live value is in `Vm::ip`; this copy is written
    /// back only when the frame makes a call.
    ip: usize,
    /// Where on the stack this frame's slot 0 is.
    slots: usize,
}

/// What running a program did: like a process, it has an exit code.
#[derive(Debug, Default)]
pub struct Outcome {
    pub stdout: Vec<String>,
    pub stderr: Vec<String>,
    /// 0, or [`EXIT_COMPILE_ERROR`], or [`EXIT_RUNTIME_ERROR`].
    pub exit_code: i32,
}

#[derive(Clone, Copy, Debug, Default)]
pub struct Options {
    /// Collect garbage before every allocation.
    pub stress_gc: bool,
    /// Never reuse freed heap slots, so a missed root panics on use.
    pub debug_gc: bool,
}

/// A runtime error. Its message and stack trace are already on stderr by
/// the time one of these exists, so it carries nothing.
pub struct RuntimeError;

type Run<T = ()> = Result<T, RuntimeError>;

fn plural(n: usize, word: &str) -> String {
    if n == 1 { format!("1 {word}") } else { format!("{n} {word}s") }
}

pub struct Vm {
    pub heap: Heap,
    stack: Vec<Value>,
    frames: Vec<CallFrame>,
    // The running frame's state, copied out of `frames.last()` into the
    // VM itself, like a CPU's registers: the interpreter loop reads them
    // on nearly every instruction, so they are kept one step away.
    /// The running frame's instruction pointer.
    ip: usize,
    /// The running frame's bytecode.
    chunk: Rc<Chunk>,
    /// The running frame's slot 0 on the stack.
    slots: usize,
    globals: Table,
    /// Upvalues still pointing into the stack, sorted by slot: closing
    /// them when a scope ends only has to look at the end of the list.
    open_upvalues: Vec<Gc<ObjUpvalue>>,
    /// The string "init", kept to look up initializers quickly.
    init_string: StrRef,
    /// When the VM started, for `clock()`.
    start: Instant,
    stdout: Vec<String>,
    stderr: Vec<String>,
}

/// Everything the VM itself can reach: the roots of a collection. Built
/// from the VM's fields one by one, so it can coexist with `&mut heap`.
struct VmRoots<'a> {
    stack: &'a [Value],
    frames: &'a [CallFrame],
    globals: &'a Table,
    open_upvalues: &'a [Gc<ObjUpvalue>],
    init_string: StrRef,
}

impl Trace for VmRoots<'_> {
    fn trace(&self, marks: &mut Marks) {
        self.stack.trace(marks);
        for frame in self.frames {
            frame.closure.trace(marks);
        }
        self.globals.trace(marks);
        self.open_upvalues.trace(marks);
        self.init_string.trace(marks);
    }
}

impl Default for Vm {
    fn default() -> Self {
        Self::new(Options::default())
    }
}

impl Vm {
    pub fn new(options: Options) -> Self {
        let mut heap = Heap::new();
        heap.stress = options.stress_gc;
        heap.poison_freed = options.stress_gc || options.debug_gc;
        let init_string = heap.intern("init");
        let mut vm = Vm {
            heap,
            stack: Vec::with_capacity(STACK_MAX),
            frames: Vec::with_capacity(FRAMES_MAX),
            ip: 0,
            chunk: Rc::default(),
            slots: 0,
            globals: Table::new(),
            open_upvalues: Vec::new(),
            init_string,
            start: Instant::now(),
            stdout: Vec::new(),
            stderr: Vec::new(),
        };
        vm.define_native("clock", 0, Native::Clock);
        vm.define_native("len", 1, Native::Len);
        vm.define_native("push", 2, Native::Push);
        vm.define_native("pop", 1, Native::Pop);
        vm.define_native("str", 1, Native::Str);
        vm
    }

    /// Compile and run a program. Globals persist from one call to the
    /// next, as in a REPL.
    pub fn interpret(&mut self, source: &str) -> Outcome {
        let mut errors = Vec::new();
        let roots = VmRoots {
            stack: &self.stack,
            frames: &self.frames,
            globals: &self.globals,
            open_upvalues: &self.open_upvalues,
            init_string: self.init_string,
        };
        let Some(function) = compile(source, &mut self.heap, &roots, &mut errors) else {
            return Outcome {
                stdout: vec![],
                stderr: errors,
                exit_code: EXIT_COMPILE_ERROR,
            };
        };

        // The function is on the stack while its closure is allocated.
        self.push(Value::Function(function));
        let closure = self.alloc(ObjClosure { function, upvalues: Vec::new() });
        self.pop();
        self.push(Value::Closure(closure));

        let result = self.call(closure, 0).and_then(|()| self.run());
        let exit_code = match result {
            Ok(()) => 0,
            Err(RuntimeError) => {
                self.stack.clear();
                self.frames.clear();
                self.chunk = Rc::default();
                self.open_upvalues.clear();
                EXIT_RUNTIME_ERROR
            }
        };
        Outcome {
            stdout: std::mem::take(&mut self.stdout),
            stderr: std::mem::take(&mut self.stderr),
            exit_code,
        }
    }

    // ---- the heap ---------------------------------------------------------

    /// Allocate an object, collecting garbage first if it's time. Anything
    /// `object` refers to must already be reachable from a root.
    fn alloc<T: HeapObject>(&mut self, object: T) -> Gc<T> {
        self.collect_if_needed();
        self.heap.alloc(object)
    }

    fn intern_owned(&mut self, chars: String) -> StrRef {
        self.collect_if_needed();
        self.heap.intern_owned(chars)
    }

    fn collect_if_needed(&mut self) {
        if self.heap.should_collect() {
            self.collect_garbage();
        }
    }

    /// Run a full collection now.
    pub fn collect_garbage(&mut self) {
        let roots = VmRoots {
            stack: &self.stack,
            frames: &self.frames,
            globals: &self.globals,
            open_upvalues: &self.open_upvalues,
            init_string: self.init_string,
        };
        self.heap.collect(&[&roots]);
    }

    fn define_native(&mut self, name: &'static str, arity: usize, native: Native) {
        // Both stay on the stack, so a collection mid-way can't free them.
        self.collect_if_needed();
        let interned = self.heap.intern(name);
        self.push(Value::String(interned));
        let object = self.alloc(ObjNative { native, name, arity });
        self.push(Value::Native(object));
        self.globals.set(interned, Value::Native(object));
        self.pop();
        self.pop();
    }

    // ---- the stack --------------------------------------------------------

    fn push(&mut self, value: Value) {
        self.stack.push(value);
    }

    fn pop(&mut self) -> Value {
        self.stack.pop().expect("stack underflow")
    }

    /// The value `distance` slots down from the top.
    fn peek(&self, distance: usize) -> Value {
        self.stack[self.stack.len() - 1 - distance]
    }

    /// Overwrite the value `distance` slots down from the top.
    fn set_peek(&mut self, distance: usize, value: Value) {
        let index = self.stack.len() - 1 - distance;
        self.stack[index] = value;
    }

    fn describe(&self, value: Value) -> String {
        describe(&self.heap, value)
    }

    // ---- errors -----------------------------------------------------------

    /// Report a runtime error with a stack trace, innermost call first.
    fn runtime_error(&mut self, message: impl Into<String>) -> RuntimeError {
        self.stderr.push(format!("runtime error: {}", message.into()));
        let top = self.frames.len().saturating_sub(1);
        for (depth, frame) in self.frames.iter().enumerate().rev() {
            let ip = if depth == top { self.ip } else { frame.ip };
            // `ip` is already past the failing instruction.
            let line = frame.chunk.lines[ip - 1];
            let function = &self.heap[self.heap[frame.closure].function];
            let place = match function.name {
                Some(name) => format!("fn {}", self.heap.str(name)),
                None if function.is_script => "script".to_string(),
                None => "anonymous fn".to_string(),
            };
            self.stderr.push(format!("  at line {line} in {place}"));
        }
        RuntimeError
    }

    // ---- calls ------------------------------------------------------------

    fn call(&mut self, closure: Gc<ObjClosure>, arg_count: usize) -> Run {
        let function = self.heap[closure].function;
        let arity = self.heap[function].arity;
        if arg_count != arity {
            let label = self.label(function);
            let message = format!(
                "{label} takes {} but got {arg_count}",
                plural(arity, "argument")
            );
            return Err(self.runtime_error(message));
        }
        if self.frames.len() == FRAMES_MAX {
            return Err(self.runtime_error("stack overflow"));
        }
        // Save the caller's ip, then load the callee into the registers.
        if let Some(caller) = self.frames.last_mut() {
            caller.ip = self.ip;
        }
        let chunk = Rc::clone(&self.heap[function].chunk);
        let slots = self.stack.len() - arg_count - 1;
        self.frames.push(CallFrame { closure, chunk: Rc::clone(&chunk), ip: 0, slots });
        self.ip = 0;
        self.chunk = chunk;
        self.slots = slots;
        Ok(())
    }

    /// How arity errors name a function: `area()`, or `anonymous fn`.
    fn label(&self, function: Gc<ObjFunction>) -> String {
        match self.heap[function].name {
            Some(name) => format!("{}()", self.heap.str(name)),
            None => "anonymous fn".to_string(),
        }
    }

    /// Return from the running frame to its caller, if it has one.
    fn pop_frame(&mut self) -> Option<CallFrame> {
        let frame = self.frames.pop().expect("a frame is running");
        let caller = self.frames.last()?;
        self.ip = caller.ip;
        self.chunk = Rc::clone(&caller.chunk);
        self.slots = caller.slots;
        Some(frame)
    }

    fn call_value(&mut self, callee: Value, arg_count: usize) -> Run {
        match callee {
            Value::Closure(closure) => self.call(closure, arg_count),
            Value::BoundMethod(bound) => {
                let ObjBoundMethod { receiver, method } = self.heap[bound];
                // The receiver goes in slot 0, where the method finds `self`.
                self.set_peek(arg_count, receiver);
                self.call(method, arg_count)
            }
            Value::Native(native) => {
                let ObjNative { native, name, arity } = self.heap[native];
                if arg_count != arity {
                    let message = format!(
                        "{name}() takes {} but got {arg_count}",
                        plural(arity, "argument")
                    );
                    return Err(self.runtime_error(message));
                }
                // The arguments stay on the stack while the native runs, so
                // a collection it causes can't free them.
                let result = self.call_native(native, arg_count)?;
                let args_start = self.stack.len() - arg_count;
                self.stack.truncate(args_start - 1);
                self.push(result);
                Ok(())
            }
            Value::Class(class) => {
                let name = self.heap.str(self.heap[class].name).to_string();
                Err(self
                    .runtime_error(format!("cannot call a class: use 'new {name}(...)'")))
            }
            other => {
                let message = format!("cannot call {}", self.describe(other));
                Err(self.runtime_error(message))
            }
        }
    }

    /// Run a native function on the top `arg_count` values.
    fn call_native(&mut self, native: Native, arg_count: usize) -> Run<Value> {
        let arg = |vm: &Vm, i: usize| vm.stack[vm.stack.len() - arg_count + i];
        match native {
            Native::Clock => Ok(Value::Number(self.start.elapsed().as_secs_f64())),
            Native::Len => match arg(self, 0) {
                Value::List(list) => {
                    Ok(Value::Number(self.heap[list].items.len() as f64))
                }
                Value::String(s) => {
                    Ok(Value::Number(self.heap.str(s).chars().count() as f64))
                }
                other => {
                    let message = format!(
                        "len() needs a list or a string, not {}",
                        self.describe(other)
                    );
                    Err(self.runtime_error(message))
                }
            },
            Native::Push => match arg(self, 0) {
                Value::List(list) => {
                    let value = arg(self, 1);
                    self.heap[list].items.push(value);
                    Ok(Value::None)
                }
                other => {
                    let message =
                        format!("push() needs a list, not {}", self.describe(other));
                    Err(self.runtime_error(message))
                }
            },
            Native::Pop => match arg(self, 0) {
                Value::List(list) => match self.heap[list].items.pop() {
                    Some(value) => Ok(value),
                    None => Err(self.runtime_error("cannot pop from an empty list")),
                },
                other => {
                    let message =
                        format!("pop() needs a list, not {}", self.describe(other));
                    Err(self.runtime_error(message))
                }
            },
            Native::Str => {
                let text = arg(self, 0).format(&self.heap);
                Ok(Value::String(self.intern_owned(text)))
            }
        }
    }

    /// `new C(args)`: the class is under the arguments on the stack.
    fn new_instance(&mut self, arg_count: usize) -> Run {
        let Value::Class(class) = self.peek(arg_count) else {
            let message = format!(
                "'new' needs a class, not {}",
                self.describe(self.peek(arg_count))
            );
            return Err(self.runtime_error(message));
        };
        let instance = self.alloc(ObjInstance {
            class,
            fields: Table::new(),
            field_order: Vec::new(),
        });
        self.set_peek(arg_count, Value::Instance(instance));
        match self.heap[class].methods.get(self.init_string) {
            Some(init) => self.call(as_closure(init), arg_count),
            None if arg_count != 0 => {
                let name = self.heap.str(self.heap[class].name);
                let message = format!(
                    "{name} has no init, so it takes no arguments, but got {arg_count}"
                );
                Err(self.runtime_error(message))
            }
            None => Ok(()),
        }
    }

    /// `receiver.name(args)`, without making a bound method on the way.
    fn invoke(&mut self, name: StrRef, arg_count: usize) -> Run {
        let Value::Instance(instance) = self.peek(arg_count) else {
            let receiver = self.describe(self.peek(arg_count));
            let message = format!("cannot read '{}' of {receiver}", self.heap.str(name));
            return Err(self.runtime_error(message));
        };
        // A field holding a function shadows a method of the same name.
        if let Some(field) = self.heap[instance].fields.get(name) {
            self.set_peek(arg_count, field);
            return self.call_value(field, arg_count);
        }
        let class = self.heap[instance].class;
        match self.heap[class].methods.get(name) {
            Some(method) => self.call(as_closure(method), arg_count),
            None => Err(self.no_property(class, name)),
        }
    }

    fn no_property(&mut self, class: Gc<ObjClass>, name: StrRef) -> RuntimeError {
        let class_name = self.heap.str(self.heap[class].name);
        let message = format!("{class_name} has no property '{}'", self.heap.str(name));
        self.runtime_error(message)
    }

    /// The superclass's method `name`.
    fn super_method(
        &mut self,
        superclass: Gc<ObjClass>,
        name: StrRef,
    ) -> Run<Gc<ObjClosure>> {
        match self.heap[superclass].methods.get(name) {
            Some(method) => Ok(as_closure(method)),
            None => {
                let class_name = self.heap.str(self.heap[superclass].name);
                let message =
                    format!("{class_name} has no method '{}'", self.heap.str(name));
                Err(self.runtime_error(message))
            }
        }
    }

    // ---- upvalues ---------------------------------------------------------

    /// The stack slot an open upvalue points to.
    fn open_slot(&self, upvalue: Gc<ObjUpvalue>) -> usize {
        match self.heap[upvalue] {
            ObjUpvalue::Open(slot) => slot,
            ObjUpvalue::Closed(_) => unreachable!("closed upvalue in the open list"),
        }
    }

    /// The upvalue for stack slot `slot`, shared if one already exists so
    /// that closures capturing the same variable see each other's writes.
    fn capture_upvalue(&mut self, slot: usize) -> Gc<ObjUpvalue> {
        let mut i = self.open_upvalues.len();
        while i > 0 {
            let existing = self.open_upvalues[i - 1];
            let existing_slot = self.open_slot(existing);
            if existing_slot == slot {
                return existing;
            }
            if existing_slot < slot {
                break;
            }
            i -= 1;
        }
        let created = self.alloc(ObjUpvalue::Open(slot));
        self.open_upvalues.insert(i, created);
        created
    }

    /// Close every open upvalue at or above stack slot `last`: copy the
    /// variable into the upvalue, because its slot is about to go.
    fn close_upvalues(&mut self, last: usize) {
        while let Some(&upvalue) = self.open_upvalues.last() {
            let slot = self.open_slot(upvalue);
            if slot < last {
                break;
            }
            self.heap[upvalue] = ObjUpvalue::Closed(self.stack[slot]);
            self.open_upvalues.pop();
        }
    }

    // ---- the interpreter loop ---------------------------------------------

    /// The running frame's closure.
    fn closure_register(&self) -> Gc<ObjClosure> {
        self.frames.last().expect("a frame is running").closure
    }

    fn read_byte(&mut self) -> u8 {
        let byte = self.chunk.code[self.ip];
        self.ip += 1;
        byte
    }

    fn read_short(&mut self) -> usize {
        let high = self.read_byte() as usize;
        let low = self.read_byte() as usize;
        (high << 8) | low
    }

    fn read_constant(&mut self) -> Value {
        let index = self.read_short();
        self.chunk.constants[index]
    }

    fn read_string(&mut self) -> StrRef {
        match self.read_constant() {
            Value::String(s) => s,
            _ => unreachable!("the compiler emits a string constant here"),
        }
    }

    /// The two numbers an arithmetic or comparison instruction needs, popped.
    fn pop_numbers(&mut self, op: &str) -> Run<(f64, f64)> {
        let (Value::Number(a), Value::Number(b)) = (self.peek(1), self.peek(0)) else {
            let (a, b) = (self.describe(self.peek(1)), self.describe(self.peek(0)));
            let message = if matches!(op, "<" | "<=" | ">" | ">=") {
                format!("cannot compare {a} and {b} with '{op}'")
            } else {
                format!("cannot use '{op}' on {a} and {b}")
            };
            return Err(self.runtime_error(message));
        };
        self.stack.truncate(self.stack.len() - 2);
        Ok((a, b))
    }

    /// The list and element index for `index.get` and `index.set`.
    fn check_index(&mut self, list: Value, index: Value) -> Run<(Gc<ObjList>, usize)> {
        let Value::List(list) = list else {
            let message = format!("cannot index {}", self.describe(list));
            return Err(self.runtime_error(message));
        };
        let Value::Number(i) = index else {
            let message =
                format!("a list index must be a number, not {}", self.describe(index));
            return Err(self.runtime_error(message));
        };
        if i.fract() != 0.0 || !i.is_finite() {
            let message = format!("index {} is not a whole number", format_number(i));
            return Err(self.runtime_error(message));
        }
        let len = self.heap[list].items.len();
        if i < 0.0 || i >= len as f64 {
            let message = format!(
                "index {} is out of range for a list of length {len}",
                format_number(i)
            );
            return Err(self.runtime_error(message));
        }
        Ok((list, i as usize))
    }

    fn run(&mut self) -> Run {
        loop {
            let byte = self.read_byte();
            let op = OpCode::from_byte(byte).expect("the compiler emits valid opcodes");
            match op {
                OpCode::Const => {
                    let value = self.read_constant();
                    self.push(value);
                }
                OpCode::None => self.push(Value::None),
                OpCode::True => self.push(Value::Bool(true)),
                OpCode::False => self.push(Value::Bool(false)),
                OpCode::Pop => {
                    self.pop();
                }
                OpCode::Dup => self.push(self.peek(0)),
                OpCode::Dup2 => {
                    let (a, b) = (self.peek(1), self.peek(0));
                    self.push(a);
                    self.push(b);
                }
                OpCode::List => {
                    let n = self.read_byte() as usize;
                    let start = self.stack.len() - n;
                    let items = self.stack[start..].to_vec();
                    // The elements stay on the stack while the list is allocated.
                    let list = self.alloc(ObjList { items });
                    self.stack.truncate(start);
                    self.push(Value::List(list));
                }
                OpCode::LoadLocal => {
                    let slot = self.slots + self.read_byte() as usize;
                    self.push(self.stack[slot]);
                }
                OpCode::StoreLocal => {
                    let slot = self.slots + self.read_byte() as usize;
                    self.stack[slot] = self.peek(0);
                }
                OpCode::LoadGlobal => {
                    let name = self.read_string();
                    let Some(value) = self.globals.get(name) else {
                        let message =
                            format!("undefined variable '{}'", self.heap.str(name));
                        return Err(self.runtime_error(message));
                    };
                    self.push(value);
                }
                OpCode::DefineGlobal => {
                    let name = self.read_string();
                    self.globals.set(name, self.peek(0));
                    self.pop();
                }
                OpCode::StoreGlobal => {
                    let name = self.read_string();
                    // Assigning never creates a global: undo and complain.
                    if self.globals.set(name, self.peek(0)) {
                        self.globals.delete(name);
                        let message =
                            format!("undefined variable '{}'", self.heap.str(name));
                        return Err(self.runtime_error(message));
                    }
                }
                OpCode::LoadUpvalue => {
                    let index = self.read_byte() as usize;
                    let upvalue = self.heap[self.closure_register()].upvalues[index];
                    let value = match self.heap[upvalue] {
                        ObjUpvalue::Open(slot) => self.stack[slot],
                        ObjUpvalue::Closed(value) => value,
                    };
                    self.push(value);
                }
                OpCode::StoreUpvalue => {
                    let index = self.read_byte() as usize;
                    let upvalue = self.heap[self.closure_register()].upvalues[index];
                    let value = self.peek(0);
                    match &mut self.heap[upvalue] {
                        ObjUpvalue::Open(slot) => self.stack[*slot] = value,
                        ObjUpvalue::Closed(closed) => *closed = value,
                    }
                }
                OpCode::GetProp => {
                    let name = self.read_string();
                    let Value::Instance(instance) = self.peek(0) else {
                        let what = self.describe(self.peek(0));
                        let message =
                            format!("cannot read '{}' of {what}", self.heap.str(name));
                        return Err(self.runtime_error(message));
                    };
                    // Fields shadow methods.
                    if let Some(value) = self.heap[instance].fields.get(name) {
                        self.set_peek(0, value);
                    } else {
                        let class = self.heap[instance].class;
                        let Some(method) = self.heap[class].methods.get(name) else {
                            return Err(self.no_property(class, name));
                        };
                        let receiver = self.peek(0);
                        let bound = self.alloc(ObjBoundMethod {
                            receiver,
                            method: as_closure(method),
                        });
                        self.set_peek(0, Value::BoundMethod(bound));
                    }
                }
                OpCode::SetProp => {
                    let name = self.read_string();
                    let Value::Instance(instance) = self.peek(1) else {
                        let what = self.describe(self.peek(1));
                        let message =
                            format!("cannot set '{}' on {what}", self.heap.str(name));
                        return Err(self.runtime_error(message));
                    };
                    let value = self.peek(0);
                    let object = &mut self.heap[instance];
                    if object.fields.set(name, value) {
                        object.field_order.push(name);
                    }
                    // Leave the value as the assignment's result.
                    self.pop();
                    self.set_peek(0, value);
                }
                OpCode::GetSuper => {
                    let name = self.read_string();
                    let superclass = as_class(self.pop());
                    let method = self.super_method(superclass, name)?;
                    let receiver = self.peek(0);
                    let bound = self.alloc(ObjBoundMethod { receiver, method });
                    self.set_peek(0, Value::BoundMethod(bound));
                }
                OpCode::IndexGet => {
                    let index = self.pop();
                    let (list, i) = self.check_index(self.peek(0), index)?;
                    let value = self.heap[list].items[i];
                    self.set_peek(0, value);
                }
                OpCode::IndexSet => {
                    let value = self.pop();
                    let index = self.pop();
                    let (list, i) = self.check_index(self.peek(0), index)?;
                    self.heap[list].items[i] = value;
                    self.set_peek(0, value);
                }
                OpCode::Add => self.add()?,
                OpCode::Sub => {
                    let (a, b) = self.pop_numbers("-")?;
                    self.push(Value::Number(a - b));
                }
                OpCode::Mul => {
                    let (a, b) = self.pop_numbers("*")?;
                    self.push(Value::Number(a * b));
                }
                OpCode::Div => {
                    let (a, b) = self.pop_numbers("/")?;
                    self.push(Value::Number(a / b));
                }
                OpCode::Rem => {
                    let (a, b) = self.pop_numbers("%")?;
                    self.push(Value::Number(a % b));
                }
                OpCode::Eq => {
                    let b = self.pop();
                    let a = self.pop();
                    self.push(Value::Bool(a == b));
                }
                OpCode::Ne => {
                    let b = self.pop();
                    let a = self.pop();
                    self.push(Value::Bool(a != b));
                }
                OpCode::Lt => {
                    let (a, b) = self.pop_numbers("<")?;
                    self.push(Value::Bool(a < b));
                }
                OpCode::Le => {
                    let (a, b) = self.pop_numbers("<=")?;
                    self.push(Value::Bool(a <= b));
                }
                OpCode::Gt => {
                    let (a, b) = self.pop_numbers(">")?;
                    self.push(Value::Bool(a > b));
                }
                OpCode::Ge => {
                    let (a, b) = self.pop_numbers(">=")?;
                    self.push(Value::Bool(a >= b));
                }
                OpCode::Not => {
                    let value = self.pop();
                    self.push(Value::Bool(value.is_falsey()));
                }
                OpCode::Neg => {
                    let Value::Number(n) = self.peek(0) else {
                        let message =
                            format!("cannot negate {}", self.describe(self.peek(0)));
                        return Err(self.runtime_error(message));
                    };
                    self.set_peek(0, Value::Number(-n));
                }
                OpCode::Print => {
                    let value = self.pop();
                    let text = value.format(&self.heap);
                    self.stdout.push(text);
                }
                OpCode::Jump => {
                    let offset = self.read_short();
                    self.ip += offset;
                }
                OpCode::JumpUnless => {
                    let offset = self.read_short();
                    if self.pop().is_falsey() {
                        self.ip += offset;
                    }
                }
                OpCode::JumpUnlessKeep => {
                    let offset = self.read_short();
                    if self.peek(0).is_falsey() {
                        self.ip += offset;
                    }
                }
                OpCode::JumpIfKeep => {
                    let offset = self.read_short();
                    if !self.peek(0).is_falsey() {
                        self.ip += offset;
                    }
                }
                OpCode::Loop => {
                    let offset = self.read_short();
                    self.ip -= offset;
                }
                OpCode::IterRange => {
                    for (distance, end) in [(1, "start"), (0, "end")] {
                        let value = self.peek(distance);
                        if !matches!(value, Value::Number(_)) {
                            let message = format!(
                                "a range must {end} with a number, not {}",
                                self.describe(value)
                            );
                            return Err(self.runtime_error(message));
                        }
                    }
                }
                OpCode::IterList => {
                    if !matches!(self.peek(0), Value::List(_)) {
                        let message =
                            format!("cannot loop over {}", self.describe(self.peek(0)));
                        return Err(self.runtime_error(message));
                    }
                }
                OpCode::ListLen => {
                    let Value::List(list) = self.peek(0) else {
                        unreachable!("iter.list checked it is a list")
                    };
                    let len = self.heap[list].items.len();
                    self.set_peek(0, Value::Number(len as f64));
                }
                OpCode::IncLocal => {
                    let slot = self.slots + self.read_byte() as usize;
                    if let Value::Number(n) = self.stack[slot] {
                        self.stack[slot] = Value::Number(n + 1.0);
                    }
                }
                OpCode::Call => {
                    let arg_count = self.read_byte() as usize;
                    self.call_value(self.peek(arg_count), arg_count)?;
                }
                OpCode::Invoke => {
                    let name = self.read_string();
                    let arg_count = self.read_byte() as usize;
                    self.invoke(name, arg_count)?;
                }
                OpCode::InvokeSuper => {
                    let name = self.read_string();
                    let arg_count = self.read_byte() as usize;
                    let superclass = as_class(self.pop());
                    let method = self.super_method(superclass, name)?;
                    self.call(method, arg_count)?;
                }
                OpCode::New => {
                    let arg_count = self.read_byte() as usize;
                    self.new_instance(arg_count)?;
                }
                OpCode::Closure => self.closure(),
                OpCode::CloseUpvalue => {
                    self.close_upvalues(self.stack.len() - 1);
                    self.pop();
                }
                OpCode::Return => {
                    let result = self.pop();
                    self.close_upvalues(self.slots);
                    let Some(frame) = self.pop_frame() else {
                        self.stack.clear();
                        return Ok(());
                    };
                    // Drop the callee's slots, then hand back its result.
                    self.stack.truncate(frame.slots);
                    self.push(result);
                }
                OpCode::Class => {
                    let name = self.read_string();
                    let class = self.alloc(ObjClass { name, methods: Table::new() });
                    self.push(Value::Class(class));
                }
                OpCode::Inherit => {
                    let Value::Class(superclass) = self.peek(1) else {
                        let message = format!(
                            "a class can only extend a class, not {}",
                            self.describe(self.peek(1))
                        );
                        return Err(self.runtime_error(message));
                    };
                    let subclass = as_class(self.peek(0));
                    // Copy-down inheritance: methods are copied once, now.
                    let methods = self.heap[superclass].methods.clone();
                    self.heap[subclass].methods.add_all(&methods);
                    self.pop();
                }
                OpCode::Method => {
                    let name = self.read_string();
                    let method = self.peek(0);
                    let class = as_class(self.peek(1));
                    self.heap[class].methods.set(name, method);
                    self.pop();
                }
            }
        }
    }

    /// `+` adds two numbers or joins two strings.
    fn add(&mut self) -> Run {
        match (self.peek(1), self.peek(0)) {
            (Value::Number(a), Value::Number(b)) => {
                self.stack.truncate(self.stack.len() - 2);
                self.push(Value::Number(a + b));
            }
            (Value::String(a), Value::String(b)) => {
                let joined = [self.heap.str(a), self.heap.str(b)].concat();
                // a and b stay on the stack until the result exists, so a
                // collection while interning it can't free them.
                let result = self.intern_owned(joined);
                self.stack.truncate(self.stack.len() - 2);
                self.push(Value::String(result));
            }
            (a, b) => {
                let message =
                    format!("cannot add {} and {}", self.describe(a), self.describe(b));
                return Err(self.runtime_error(message));
            }
        }
        Ok(())
    }

    /// Make a closure for the function constant that follows, capturing
    /// the variables its operands name.
    fn closure(&mut self) {
        let Value::Function(function) = self.read_constant() else {
            unreachable!("the compiler emits a function constant here");
        };
        let count = self.heap[function].upvalue_count;
        let mut upvalues = Vec::with_capacity(count);
        for _ in 0..count {
            let is_local = self.read_byte() == 1;
            let index = self.read_byte() as usize;
            upvalues.push(if is_local {
                self.capture_upvalue(self.slots + index)
            } else {
                self.heap[self.closure_register()].upvalues[index]
            });
        }
        // Each captured upvalue is reachable from the open list or from the
        // enclosing closure, so allocating the closure can't free them.
        let closure = self.alloc(ObjClosure { function, upvalues });
        self.push(Value::Closure(closure));
    }
}

/// Methods are always closures: the compiler only puts closures there.
fn as_closure(value: Value) -> Gc<ObjClosure> {
    match value {
        Value::Closure(closure) => closure,
        _ => unreachable!("a method that isn't a closure"),
    }
}

/// The operand of `super` and of class bodies is always a class.
fn as_class(value: Value) -> Gc<ObjClass> {
    match value {
        Value::Class(class) => class,
        _ => unreachable!("expected a class"),
    }
}
