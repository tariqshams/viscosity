//! The bytecode virtual machine (book chapters 47 and 53 to 60).

use std::rc::Rc;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::chunk::{Chunk, OpCode};
use crate::compiler::compile;
use crate::gc::{Heap, HeapObject, Marks, Trace};
use crate::object::{
    Gc, NativeFn, ObjBoundMethod, ObjClass, ObjClosure, ObjInstance, ObjNative,
    ObjUpvalue, StrRef,
};
use crate::table::Table;
use crate::value::Value;

/// The deepest the call stack may go before "Stack overflow.".
pub const FRAMES_MAX: usize = 64;
/// Room for every frame to use all 256 of its slots.
const STACK_MAX: usize = FRAMES_MAX * 256;

/// The exit codes of the `sysexits.h` convention, as clox uses them.
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
struct RuntimeError;

type Run<T = ()> = Result<T, RuntimeError>;

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
            stdout: Vec::new(),
            stderr: Vec::new(),
        };
        vm.define_native("clock", 0, clock);
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

    fn define_native(&mut self, name: &str, arity: usize, function: NativeFn) {
        // Both stay on the stack, so a collection mid-way can't free them.
        self.collect_if_needed();
        let name = self.heap.intern(name);
        self.push(Value::String(name));
        let native = self.alloc(ObjNative { arity, function });
        self.push(Value::Native(native));
        self.globals.set(name, Value::Native(native));
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

    // ---- errors -----------------------------------------------------------

    /// Report a runtime error with a stack trace, innermost call first.
    fn runtime_error(&mut self, message: impl Into<String>) -> RuntimeError {
        self.stderr.push(message.into());
        let top = self.frames.len().saturating_sub(1);
        for (depth, frame) in self.frames.iter().enumerate().rev() {
            let ip = if depth == top { self.ip } else { frame.ip };
            // `ip` is already past the failing instruction.
            let line = frame.chunk.lines[ip - 1];
            let function = &self.heap[self.heap[frame.closure].function];
            let place = match function.name {
                Some(name) => format!("{}()", self.heap.str(name)),
                None => "script".to_string(),
            };
            self.stderr.push(format!("[line {line}] in {place}"));
        }
        RuntimeError
    }

    // ---- calls ------------------------------------------------------------

    fn call(&mut self, closure: Gc<ObjClosure>, arg_count: usize) -> Run {
        let function = self.heap[closure].function;
        let arity = self.heap[function].arity;
        if arg_count != arity {
            let message = format!("Expected {arity} arguments but got {arg_count}.");
            return Err(self.runtime_error(message));
        }
        if self.frames.len() == FRAMES_MAX {
            return Err(self.runtime_error("Stack overflow."));
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
            Value::BoundMethod(bound) => {
                let ObjBoundMethod { receiver, method } = self.heap[bound];
                // The receiver goes in slot 0, where the method finds `this`.
                self.set_peek(arg_count, receiver);
                self.call(method, arg_count)
            }
            Value::Class(class) => {
                let instance = self.alloc(ObjInstance { class, fields: Table::new() });
                self.set_peek(arg_count, Value::Instance(instance));
                match self.heap[class].methods.get(self.init_string) {
                    Some(init) => self.call(as_closure(init), arg_count),
                    None if arg_count != 0 => {
                        let message =
                            format!("Expected 0 arguments but got {arg_count}.");
                        Err(self.runtime_error(message))
                    }
                    None => Ok(()),
                }
            }
            Value::Closure(closure) => self.call(closure, arg_count),
            Value::Native(native) => {
                let ObjNative { arity, function } = self.heap[native];
                if arg_count != arity {
                    let message =
                        format!("Expected {arity} arguments but got {arg_count}.");
                    return Err(self.runtime_error(message));
                }
                let args_start = self.stack.len() - arg_count;
                let result = function(&self.stack[args_start..]);
                // Pop the arguments and the native itself.
                self.stack.truncate(args_start - 1);
                self.push(result);
                Ok(())
            }
            _ => Err(self.runtime_error("Can only call functions and classes.")),
        }
    }

    fn invoke_from_class(
        &mut self,
        class: Gc<ObjClass>,
        name: StrRef,
        arg_count: usize,
    ) -> Run {
        match self.heap[class].methods.get(name) {
            Some(method) => self.call(as_closure(method), arg_count),
            None => Err(self.undefined_property(name)),
        }
    }

    /// `receiver.name(args)`, without making a bound method on the way.
    fn invoke(&mut self, name: StrRef, arg_count: usize) -> Run {
        let Value::Instance(instance) = self.peek(arg_count) else {
            return Err(self.runtime_error("Only instances have methods."));
        };
        // A field holding a function shadows a method of the same name.
        if let Some(field) = self.heap[instance].fields.get(name) {
            self.set_peek(arg_count, field);
            return self.call_value(field, arg_count);
        }
        let class = self.heap[instance].class;
        self.invoke_from_class(class, name, arg_count)
    }

    /// Replace the instance on top of the stack with its method `name`,
    /// bound to it.
    fn bind_method(&mut self, class: Gc<ObjClass>, name: StrRef) -> Run {
        let Some(method) = self.heap[class].methods.get(name) else {
            return Err(self.undefined_property(name));
        };
        let receiver = self.peek(0);
        let bound = self.alloc(ObjBoundMethod { receiver, method: as_closure(method) });
        self.pop();
        self.push(Value::BoundMethod(bound));
        Ok(())
    }

    fn undefined_property(&mut self, name: StrRef) -> RuntimeError {
        let message = format!("Undefined property '{}'.", self.heap.str(name));
        self.runtime_error(message)
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
        let index = self.read_byte() as usize;
        self.chunk.constants[index]
    }

    fn read_string(&mut self) -> StrRef {
        match self.read_constant() {
            Value::String(s) => s,
            _ => unreachable!("the compiler emits a string constant here"),
        }
    }

    /// Pop two numbers for an arithmetic or comparison instruction.
    fn pop_numbers(&mut self) -> Run<(f64, f64)> {
        let (Value::Number(a), Value::Number(b)) = (self.peek(1), self.peek(0)) else {
            return Err(self.runtime_error("Operands must be numbers."));
        };
        self.stack.truncate(self.stack.len() - 2);
        Ok((a, b))
    }

    fn run(&mut self) -> Run {
        loop {
            let byte = self.read_byte();
            let op = OpCode::from_byte(byte).expect("the compiler emits valid opcodes");
            match op {
                OpCode::Constant => {
                    let value = self.read_constant();
                    self.push(value);
                }
                OpCode::Nil => self.push(Value::Nil),
                OpCode::True => self.push(Value::Bool(true)),
                OpCode::False => self.push(Value::Bool(false)),
                OpCode::Pop => {
                    self.pop();
                }
                OpCode::GetLocal => {
                    let slot = self.slots + self.read_byte() as usize;
                    self.push(self.stack[slot]);
                }
                OpCode::SetLocal => {
                    let slot = self.slots + self.read_byte() as usize;
                    self.stack[slot] = self.peek(0);
                }
                OpCode::GetGlobal => {
                    let name = self.read_string();
                    let Some(value) = self.globals.get(name) else {
                        let message =
                            format!("Undefined variable '{}'.", self.heap.str(name));
                        return Err(self.runtime_error(message));
                    };
                    self.push(value);
                }
                OpCode::DefineGlobal => {
                    let name = self.read_string();
                    self.globals.set(name, self.peek(0));
                    self.pop();
                }
                OpCode::SetGlobal => {
                    let name = self.read_string();
                    // Assigning never creates a global: undo and complain.
                    if self.globals.set(name, self.peek(0)) {
                        self.globals.delete(name);
                        let message =
                            format!("Undefined variable '{}'.", self.heap.str(name));
                        return Err(self.runtime_error(message));
                    }
                }
                OpCode::GetUpvalue => {
                    let index = self.read_byte() as usize;
                    let upvalue = self.heap[self.closure_register()].upvalues[index];
                    let value = match self.heap[upvalue] {
                        ObjUpvalue::Open(slot) => self.stack[slot],
                        ObjUpvalue::Closed(value) => value,
                    };
                    self.push(value);
                }
                OpCode::SetUpvalue => {
                    let index = self.read_byte() as usize;
                    let upvalue = self.heap[self.closure_register()].upvalues[index];
                    let value = self.peek(0);
                    match &mut self.heap[upvalue] {
                        ObjUpvalue::Open(slot) => self.stack[*slot] = value,
                        ObjUpvalue::Closed(closed) => *closed = value,
                    }
                }
                OpCode::GetProperty => {
                    let Value::Instance(instance) = self.peek(0) else {
                        return Err(self.runtime_error("Only instances have properties."));
                    };
                    let name = self.read_string();
                    // Fields shadow methods.
                    if let Some(value) = self.heap[instance].fields.get(name) {
                        self.pop();
                        self.push(value);
                    } else {
                        let class = self.heap[instance].class;
                        self.bind_method(class, name)?;
                    }
                }
                OpCode::SetProperty => {
                    let Value::Instance(instance) = self.peek(1) else {
                        return Err(self.runtime_error("Only instances have fields."));
                    };
                    let name = self.read_string();
                    let value = self.peek(0);
                    self.heap[instance].fields.set(name, value);
                    // Leave the value as the assignment's result.
                    self.pop();
                    self.pop();
                    self.push(value);
                }
                OpCode::GetSuper => {
                    let name = self.read_string();
                    let superclass = as_class(self.pop());
                    self.bind_method(superclass, name)?;
                }
                OpCode::Equal => {
                    let b = self.pop();
                    let a = self.pop();
                    self.push(Value::Bool(a == b));
                }
                OpCode::Greater => {
                    let (a, b) = self.pop_numbers()?;
                    self.push(Value::Bool(a > b));
                }
                OpCode::Less => {
                    let (a, b) = self.pop_numbers()?;
                    self.push(Value::Bool(a < b));
                }
                OpCode::Add => self.add()?,
                OpCode::Subtract => {
                    let (a, b) = self.pop_numbers()?;
                    self.push(Value::Number(a - b));
                }
                OpCode::Multiply => {
                    let (a, b) = self.pop_numbers()?;
                    self.push(Value::Number(a * b));
                }
                OpCode::Divide => {
                    let (a, b) = self.pop_numbers()?;
                    self.push(Value::Number(a / b));
                }
                OpCode::Not => {
                    let value = self.pop();
                    self.push(Value::Bool(value.is_falsey()));
                }
                OpCode::Negate => {
                    let Value::Number(n) = self.peek(0) else {
                        return Err(self.runtime_error("Operand must be a number."));
                    };
                    self.set_peek(0, Value::Number(-n));
                }
                OpCode::Print => {
                    let value = self.pop();
                    let text = value.display(&self.heap).to_string();
                    self.stdout.push(text);
                }
                OpCode::Jump => {
                    let offset = self.read_short();
                    self.ip += offset;
                }
                OpCode::JumpIfFalse => {
                    let offset = self.read_short();
                    if self.peek(0).is_falsey() {
                        self.ip += offset;
                    }
                }
                OpCode::Loop => {
                    let offset = self.read_short();
                    self.ip -= offset;
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
                OpCode::SuperInvoke => {
                    let name = self.read_string();
                    let arg_count = self.read_byte() as usize;
                    let superclass = as_class(self.pop());
                    self.invoke_from_class(superclass, name, arg_count)?;
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
                        self.pop(); // the script's own closure
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
                        return Err(self.runtime_error("Superclass must be a class."));
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

    /// `+` adds two numbers or concatenates two strings.
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
            _ => {
                let message = "Operands must be two numbers or two strings.";
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

/// The `clock()` native: seconds since the Unix epoch.
fn clock(_args: &[Value]) -> Value {
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default();
    Value::Number(now.as_secs_f64())
}
