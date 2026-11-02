// Chapter 348 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'ri-shape': {
    q: 'What two fields does drip-rs’s `ObjInstance` have?',
    a: '`class: Gc<ObjClass>`, a handle to its class, and `fields: Table`, its field table.',
  },
  'ri-class-word': {
    q: 'Why is the TypeScript field `klass` but the drip-rs field `class`?',
    a: '`class` is a reserved word in JavaScript but not a keyword in Rust.',
  },
  'ri-table': {
    q: 'Why does looking up a field never visit the string arena?',
    a: 'Field names are `StrRef`s, interned handles that carry their hash, so the table can hash and compare keys without the characters.',
  },
  'ri-alloc-safe': {
    q: 'When a class is called, why can drip-rs allocate the instance before putting it anywhere?',
    a: 'The instance’s only reference is its class, which is still on the stack in the callee’s slot, so a collection during `alloc` keeps it.',
  },
  'ri-slot': {
    q: 'Where does the new instance go after a class is called?',
    a: 'Into the callee’s stack slot, with `set_peek(argc, ..)`, replacing the class. An initializer finds it there as `this`.',
  },
  'ri-copy': {
    q: 'Why can `GetProperty` call `self.pop()` right after `self.heap[inst].fields.get(name)`?',
    a: '`get` returns `Option<Value>`, a copy, so the shared borrow of the heap has already ended.',
  },
  'ri-shadow': {
    q: 'An instance has a field and its class a method, both named `go`. What does `obj.go` give?',
    a: 'The field: `GetProperty` checks the fields first and only falls back to the class’s methods.',
  },
  'ri-e0499': {
    q: 'Why is `self.heap[inst].fields.set(self.read_string(), v)` rejected?',
    a: 'The table is borrowed mutably as the receiver, then the argument needs `&mut self` to advance `ip`: E0499. Read the name into a local first.',
  },
  'ri-result': {
    q: 'What does `SetProperty` leave on the stack?',
    a: 'The assigned value, in place of the instance and the value: an assignment is an expression.',
  },
  'ri-errors': {
    q: 'What does drip-rs report for `n.x = 2;` when `n` is a number, and for `123.foo;`?',
    a: '“Only instances have fields.” and “Only instances have properties.”, both runtime errors (exit code 70).',
  },
};

export const examples = {
  'read-then-write': {
    title: 'Read the operands, then write',
    lang: 'rust',
    code: `use std::collections::HashMap;

struct Inst {
    fields: HashMap<u8, f64>,
}

struct Vm {
    insts: Vec<Inst>,
    code: Vec<u8>,
    ip: usize,
}

impl Vm {
    fn read_byte(&mut self) -> u8 {
        self.ip += 1;
        self.code[self.ip - 1]
    }

    fn set_property(
        &mut self,
        i: usize,
        v: f64,
    ) {
        // Read every operand first...
        let name = self.read_byte();
        // ...then borrow the table.
        let inst = &mut self.insts[i];
        inst.fields.insert(name, v);
        // Uncomment for E0499:
        // self.insts[i].fields.insert(
        //     self.read_byte(), v);
    }
}

fn main() {
    let new = || Inst {
        fields: HashMap::new(),
    };
    let mut vm = Vm {
        insts: vec![new(), new()],
        code: vec![7, 7],
        ip: 0,
    };
    vm.set_property(0, 3.0);
    vm.set_property(1, 4.0);
    // Same name, different tables.
    for (i, inst) in
        vm.insts.iter().enumerate()
    {
        println!("inst {i}: {:?}",
            inst.fields);
    }
}`,
  },
};

const propStarter = `use std::collections::HashMap;

#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    Nil,
    Num(f64),
    Inst(usize), // a handle
}
use Value::*;

type Name = &'static str;

struct Instance {
    fields: HashMap<Name, Value>,
}

const NO_GET: &str =
    "Only instances have properties.";
const NO_SET: &str =
    "Only instances have fields.";

fn undef(name: Name) -> String {
    let m = "Undefined property";
    format!("{m} '{name}'.")
}

struct Vm {
    stack: Vec<Value>,
    // The instance arena.
    heap: Vec<Instance>,
}

impl Vm {
    fn new() -> Vm {
        Vm {
            stack: Vec::new(),
            heap: Vec::new(),
        }
    }

    fn push(&mut self, v: Value) {
        self.stack.push(v);
    }

    fn pop(&mut self) -> Value {
        self.stack.pop().unwrap()
    }

    fn peek(&self, d: usize) -> Value {
        let n = self.stack.len();
        self.stack[n - 1 - d]
    }

    // What calling a class makes.
    fn new_inst(&mut self) -> Value {
        let fields = HashMap::new();
        let i = Instance { fields };
        self.heap.push(i);
        Inst(self.heap.len() - 1)
    }
`;

const getOk = `
    // GetProperty: [.., inst] becomes
    // [.., the field's value].
    fn get_property(
        &mut self,
        name: Name,
    ) -> Result<(), String> {
        let Inst(i) = self.peek(0)
        else {
            return Err(NO_GET.into());
        };
        let fs = &self.heap[i].fields;
        match fs.get(name).copied() {
            Some(v) => {
                self.pop();
                self.push(v);
                Ok(())
            }
            None => Err(undef(name)),
        }
    }
`;

const setOk = `
    // SetProperty: [.., inst, value]
    // becomes [.., value].
    fn set_property(
        &mut self,
        name: Name,
    ) -> Result<(), String> {
        let Inst(i) = self.peek(1)
        else {
            return Err(NO_SET.into());
        };
        let v = self.peek(0);
        let inst = &mut self.heap[i];
        inst.fields.insert(name, v);
        self.pop();
        self.pop();
        self.push(v);
        Ok(())
    }
}`;

export const exercises = {
  properties: {
    lang: 'rust',
    title: 'GetProperty and SetProperty',
    prompt: `This VM has drip-rs's shape in small: values hold handles, \`heap\` is the instance arena, and each \`Instance\` owns a field table (a \`HashMap\` here, drip-rs's \`Table\` there). Write the two property instructions:

1. \`get_property(name)\`. The receiver is on top of the stack. If it isn't an instance, return \`Err\` with \`NO_GET\`. If the instance has the field, replace the receiver with the field's value. If not, return \`Err(undef(name))\`, which reads \`Undefined property 'x'.\` (drip-rs would try the class's methods first; there are none here).
2. \`set_property(name)\`. The stack ends with the receiver and then the value. If the receiver isn't an instance, return \`Err\` with \`NO_SET\`. Otherwise add or overwrite the field, and leave just the value on the stack.

Check the receiver before you change anything.`,
    starter: propStarter + `
    fn get_property(
        &mut self,
        name: Name,
    ) -> Result<(), String> {
        todo!()
    }

    fn set_property(
        &mut self,
        name: Name,
    ) -> Result<(), String> {
        todo!()
    }
}`,
    solution: propStarter + getOk + setOk,
    tests: `// p.x = 3, leaving the value on the stack
fn set_x(vm: &mut Vm, p: Value, v: f64) {
    vm.push(p);
    vm.push(Num(v));
    vm.set_property("x").unwrap();
}

#[test]
fn set_leaves_the_value() {
    let mut vm = Vm::new();
    let p = vm.new_inst();
    set_x(&mut vm, p, 3.0);
    assert_eq!(vm.stack, [Num(3.0)]);
    let f = vm.heap[0].fields["x"];
    assert_eq!(f, Num(3.0));
}

#[test]
fn get_reads_the_field() {
    let mut vm = Vm::new();
    let p = vm.new_inst();
    set_x(&mut vm, p, 3.0);
    vm.pop();
    vm.push(p);
    vm.get_property("x").unwrap();
    assert_eq!(vm.stack, [Num(3.0)]);
}

#[test]
fn setting_again_overwrites() {
    let mut vm = Vm::new();
    let p = vm.new_inst();
    set_x(&mut vm, p, 3.0);
    set_x(&mut vm, p, 5.0);
    vm.push(p);
    vm.get_property("x").unwrap();
    assert_eq!(vm.peek(0), Num(5.0));
}

#[test]
fn instances_have_their_own_fields() {
    let mut vm = Vm::new();
    let p = vm.new_inst();
    let q = vm.new_inst();
    set_x(&mut vm, p, 1.0);
    vm.push(q);
    let m = "Undefined property 'x'.";
    let r = vm.get_property("x");
    assert_eq!(r, Err(m.to_string()));
}

#[test]
fn a_nil_field_is_still_a_field() {
    let mut vm = Vm::new();
    let p = vm.new_inst();
    vm.push(p);
    vm.push(Nil);
    vm.set_property("y").unwrap();
    vm.push(p);
    vm.get_property("y").unwrap();
    assert_eq!(vm.stack, [Nil, Nil]);
}

#[test]
fn only_instances_have_properties() {
    let mut vm = Vm::new();
    vm.push(Num(123.0));
    let r = vm.get_property("foo");
    assert_eq!(r, Err(NO_GET.into()));
}

#[test]
fn only_instances_have_fields() {
    let mut vm = Vm::new();
    vm.push(Num(1.0));
    vm.push(Num(2.0));
    let r = vm.set_property("x");
    assert_eq!(r, Err(NO_SET.into()));
    assert_eq!(vm.stack.len(), 2);
}`,
    hints: [
      '`let Inst(i) = self.peek(0) else { return Err(..) };` checks the receiver and names its handle in one step.',
      'For `set_property`, the receiver is `peek(1)` and the value `peek(0)`.',
      '`fields.get(name).copied()` gives an `Option<Value>` that owns its value, so you can `pop` and `push` afterwards.',
      'In `set_property`, read the value into a local before you borrow `self.heap[i]` mutably.',
    ],
    walkthrough: `**get_property.** The \`let ... else\` checks the type and gets the handle together, as drip-rs's arm does. Then one lookup. \`.copied()\` turns \`Option<&Value>\` into \`Option<Value>\`; \`Value\` is \`Copy\`, so nothing is borrowed from the heap once the \`match\` has its value, and the arms are free to \`pop\` and \`push\`. A missing field is an error here. In drip-rs it would fall through to \`bind_method\` on the class, and only become "Undefined property" if there were no method either.

**set_property.** The receiver is one below the value: the compiler emitted the object, then the right-hand side, then \`SET_PROPERTY\`. Check it first, so a failed set leaves the stack alone. Read the value into a local, then take \`&mut self.heap[i]\` and insert. The insert both adds new fields and overwrites old ones. Finally pop the value and the instance and push the value back: \`p.x = 3\` is an expression whose value is 3.

The nil test is there because a field holding \`nil\` is still a field. Code that treated a \`Nil\` result as "missing" would report an error for it.`,
    wrong: [
      {
        code: propStarter + getOk + `
    fn set_property(
        &mut self,
        name: Name,
    ) -> Result<(), String> {
        let Inst(i) = self.peek(1)
        else {
            return Err(NO_SET.into());
        };
        let v = self.pop();
        let inst = &mut self.heap[i];
        inst.fields.insert(name, v);
        Ok(())
    }
}`,
        why: 'This leaves the instance on the stack instead of the value. `p.x = 3` must evaluate to 3, and the compiler’s `POP` after it would drop the wrong thing.',
      },
      {
        code: propStarter + `
    fn get_property(
        &mut self,
        name: Name,
    ) -> Result<(), String> {
        let Inst(i) = self.peek(0)
        else {
            return Err(NO_GET.into());
        };
        let fs = &self.heap[i].fields;
        let v = fs.get(name).copied();
        self.pop();
        self.push(v.unwrap_or(Nil));
        Ok(())
    }
` + setOk,
        why: 'This is JavaScript’s habit, where a missing property reads as `undefined`. Drip reports “Undefined property”, and a field that holds `nil` must stay distinguishable from no field at all.',
      },
      {
        code: propStarter + getOk + `
    fn set_property(
        &mut self,
        name: Name,
    ) -> Result<(), String> {
        let Inst(i) = self.peek(0)
        else {
            return Err(NO_SET.into());
        };
        let v = self.peek(1);
        let inst = &mut self.heap[i];
        inst.fields.insert(name, v);
        self.pop();
        self.pop();
        self.push(v);
        Ok(())
    }
}`,
        why: 'The operands are the other way round: the receiver is pushed first, so it is `peek(1)`, and the value is on top.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does `Value::Instance` hold in drip-rs?',
    options: [
      { t: 'The instance’s fields, inline', why: 'A `Value` is 16 bytes; the fields are in a `Table` inside the heap object.' },
      { t: 'A `Gc<ObjInstance>` handle into the instance arena', correct: true, why: 'The object, with its class handle and field table, lives in the arena.' },
      { t: 'An `Rc<RefCell<ObjInstance>>`', why: 'drip-rs’s only `Rc` is `Rc<Chunk>`.' },
      { t: 'The class handle', why: 'That is `Value::Class`. The instance holds its class handle inside.' },
    ],
  },
  {
    q: 'When `Point()` runs, why is it safe to call `alloc` for the instance before anything holds it?',
    options: [
      { t: '`alloc` never collects', why: '`Vm::alloc` may collect first.' },
      { t: 'Instances are never collected', why: 'They are, once unreachable.' },
      { t: 'The instance is a root until `init` returns', why: 'Nothing makes it a root; it isn’t on the stack until `set_peek`.' },
      { t: 'The only object it refers to, its class, is still on the stack in the callee’s slot', correct: true, why: 'A collection inside `alloc` keeps the class. The new instance itself is created after.' },
    ],
  },
  {
    q: 'In `GetProperty`, an instance has a field `go` and its class has a method `go`. What happens?',
    options: [
      { t: 'The method is bound and returned', why: 'Only if no field is found.' },
      { t: 'A runtime error: the name is ambiguous', why: 'Drip doesn’t treat this as an error.' },
      { t: 'The field’s value replaces the instance on the stack', correct: true, why: 'Fields are checked first, so they shadow methods.' },
      { t: 'Both are pushed', why: 'One value replaces the receiver.' },
    ],
  },
  {
    q: 'Why does drip-rs read the name and value into locals before `self.heap[inst].fields.set(..)`?',
    options: [
      { t: 'Reading the name needs `&mut self` (it advances `ip`), which can’t overlap the mutable borrow of the table', correct: true, why: 'The one-line version is E0499.' },
      { t: 'To make the code faster', why: 'The locals are free either way; the order is forced by the borrow checker.' },
      { t: 'Because `Table::set` takes ownership of the heap', why: 'It takes `&mut self` on the table only.' },
      { t: 'So a collection can’t run in between', why: '`set` doesn’t allocate heap objects, so no collection can happen there.' },
    ],
  },
  {
    q: 'After `p.x = 3;` runs `SET_PROPERTY`, what is on top of the stack?',
    options: [
      { t: 'The instance `p`', why: 'The instance is popped.' },
      { t: '`3`, the assignment’s value, which the next `POP` drops', correct: true, why: 'Two pops and a push leave the value, as for any assignment expression.' },
      { t: 'Nothing new: both operands are popped', why: 'The value is pushed back.' },
      { t: '`nil`', why: 'An assignment evaluates to the assigned value.' },
    ],
  },
  {
    q: 'What does drip-rs count as an instance’s size when pacing collections?',
    options: [
      { t: 'The number of fields times 16 bytes', why: 'drip-rs doesn’t look inside the table.' },
      { t: 'Nothing: instances aren’t counted', why: '`alloc` adds every object’s `size()`.' },
      { t: 'A fixed 48 bytes', why: 'That is the TypeScript heap’s figure.' },
      { t: '`size_of::<ObjInstance>()`, which leaves out the field table’s buffers', correct: true, why: '64 bytes on x86-64 with rustc 1.97, however many fields it has.' },
    ],
  },
];
