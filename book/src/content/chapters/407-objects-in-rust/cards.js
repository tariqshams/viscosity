// Chapter 407 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'ri-shape': {
    q: 'What three fields does drip-rs’s `ObjInstance` have?',
    a: '`class: Gc<ObjClass>`, a handle to its class; `fields: Table`, its field table; and `field_order: Vec<StrRef>`, the field names in the order they were first set.',
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
    q: 'In `new_instance`, why can drip-rs allocate the instance before putting it anywhere?',
    a: 'The instance’s only reference is its class, which is still on the stack (under the arguments), so a collection during `alloc` keeps the class alive.',
  },
  'ri-slot': {
    q: 'Where does a new instance go once it is allocated?',
    a: 'Into the class’s stack slot, with `set_peek(arg_count, Value::Instance(instance))`. An `init` finds it there as `self`, in slot 0.',
  },
  'ri-copy': {
    q: 'Why can `get.prop` call `self.set_peek(0, value)` right after `self.heap[instance].fields.get(name)`?',
    a: '`get` returns `Option<Value>`, a copy, so the shared borrow of the heap has already ended.',
  },
  'ri-shadow': {
    q: 'An instance has a field and its class a method, both named `go`. What does `obj.go` give?',
    a: 'The field: `get.prop` (and `invoke`) check the fields first and only fall back to the class’s methods.',
  },
  'ri-e0499': {
    q: 'Why is a one-liner like `self.heap[i].fields.set(self.read_string(), v)` rejected?',
    a: 'The table is borrowed mutably as the receiver, then the argument needs `&mut self` to move `ip` on: E0499. Read the name into a local first.',
  },
};

export const examples = {
  particles: {
    lang: 'drip-vm',
    title: 'A list of records, updated in a loop',
    code: `class Point {}
let ps = [];
for i in 0..3 {
  let p = new Point();
  p.x = i;
  p.vx = 1;
  push(ps, p);
}
for p in ps {
  p.x += p.vx;
}
print ps[2];
print ps[0].x;`,
  },
};

export const exercises = {
  properties: {
    lang: 'rust',
    title: 'get.prop and set.prop',
    prompt: `This VM has drip-rs's shape in small: values hold handles, \`heap\` is the instance arena, and each \`Instance\` owns a field table (a \`HashMap\` here, drip-rs's \`Table\` there) and \`order\`, the names in the order they were first set. Write the two property instructions:

1. \`get_prop(name)\`. The receiver is on top of the stack. If it isn't an instance, return \`Err\` with \`cannot read 'foo' of a number\` (use \`what\`). If the instance has the field, replace the receiver with the field's value. If not, return \`Err\` with \`Point has no property 'x'\`, using the instance's class name (drip-rs would try the class's methods first; there are none here).
2. \`set_prop(name)\`. The stack ends with the receiver and then the value. If the receiver isn't an instance, return \`Err\` with \`cannot set 'x' on a number\`. Otherwise add or overwrite the field, push the name onto \`order\` only if it is new, and leave just the value on the stack.

Check the receiver before you change anything.`,
    starter: `use std::collections::HashMap;

#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    // Drip's none (named so that it is
    // not confused with Option's None)
    Empty,
    Num(f64),
    Inst(usize), // a handle
}
use Value::*;

type Name = &'static str;

struct Instance {
    class: Name,
    fields: HashMap<Name, Value>,
    // names in the order first set
    order: Vec<Name>,
}

// How errors name a value.
fn what(v: Value) -> &'static str {
    match v {
        Empty => "none",
        Num(_) => "a number",
        Inst(_) => "an instance",
    }
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

    fn set_peek(
        &mut self,
        d: usize,
        v: Value,
    ) {
        let n = self.stack.len();
        self.stack[n - 1 - d] = v;
    }

    // What new C() makes.
    fn new_inst(&mut self, c: Name)
        -> Value {
        self.heap.push(Instance {
            class: c,
            fields: HashMap::new(),
            order: Vec::new(),
        });
        Inst(self.heap.len() - 1)
    }

    // get.prop: [.., inst] becomes
    // [.., value].
    fn get_prop(
        &mut self,
        name: Name,
    ) -> Result<(), String> {
        todo!()
    }

    // set.prop: [.., inst, value]
    // becomes [.., value].
    fn set_prop(
        &mut self,
        name: Name,
    ) -> Result<(), String> {
        todo!()
    }
}`,
    solution: `use std::collections::HashMap;

#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    // Drip's none (named so that it is
    // not confused with Option's None)
    Empty,
    Num(f64),
    Inst(usize), // a handle
}
use Value::*;

type Name = &'static str;

struct Instance {
    class: Name,
    fields: HashMap<Name, Value>,
    // names in the order first set
    order: Vec<Name>,
}

// How errors name a value.
fn what(v: Value) -> &'static str {
    match v {
        Empty => "none",
        Num(_) => "a number",
        Inst(_) => "an instance",
    }
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

    fn set_peek(
        &mut self,
        d: usize,
        v: Value,
    ) {
        let n = self.stack.len();
        self.stack[n - 1 - d] = v;
    }

    // What new C() makes.
    fn new_inst(&mut self, c: Name)
        -> Value {
        self.heap.push(Instance {
            class: c,
            fields: HashMap::new(),
            order: Vec::new(),
        });
        Inst(self.heap.len() - 1)
    }

    // get.prop: [.., inst] becomes
    // [.., value].
    fn get_prop(
        &mut self,
        name: Name,
    ) -> Result<(), String> {
        let r = self.peek(0);
        let Inst(i) = r else {
            let w = what(r);
            let s = "cannot read";
            return Err(format!(
                "{s} '{name}' of {w}"));
        };
        let fs = &self.heap[i].fields;
        let c = self.heap[i].class;
        let Some(&v) = fs.get(name)
        else {
            let p = "has no property";
            return Err(format!(
                "{c} {p} '{name}'"));
        };
        self.set_peek(0, v);
        Ok(())
    }

    // set.prop: [.., inst, value]
    // becomes [.., value].
    fn set_prop(
        &mut self,
        name: Name,
    ) -> Result<(), String> {
        let r = self.peek(1);
        let Inst(i) = r else {
            let w = what(r);
            let s = "cannot set";
            return Err(format!(
                "{s} '{name}' on {w}"));
        };
        let v = self.peek(0);
        let o = &mut self.heap[i];
        let f = &mut o.fields;
        if f.insert(name, v).is_none() {
            o.order.push(name);
        }
        self.pop();
        self.set_peek(0, v);
        Ok(())
    }
}`,
    tests: `// p.x = v, leaving the value on the stack
fn set_x(vm: &mut Vm, p: Value, v: f64) {
    vm.push(p);
    vm.push(Num(v));
    vm.set_prop("x").unwrap();
}

#[test]
fn set_leaves_the_value() {
    let mut vm = Vm::new();
    let p = vm.new_inst("Point");
    set_x(&mut vm, p, 3.0);
    assert_eq!(vm.stack, [Num(3.0)]);
    let f = vm.heap[0].fields["x"];
    assert_eq!(f, Num(3.0));
}

#[test]
fn get_reads_the_field() {
    let mut vm = Vm::new();
    let p = vm.new_inst("Point");
    set_x(&mut vm, p, 3.0);
    vm.pop();
    vm.push(p);
    vm.get_prop("x").unwrap();
    assert_eq!(vm.stack, [Num(3.0)]);
}

#[test]
fn overwriting_keeps_the_order() {
    let mut vm = Vm::new();
    let p = vm.new_inst("Point");
    set_x(&mut vm, p, 3.0);
    vm.push(p);
    vm.push(Num(4.0));
    vm.set_prop("y").unwrap();
    set_x(&mut vm, p, 5.0);
    assert_eq!(vm.heap[0].order, ["x", "y"]);
    vm.push(p);
    vm.get_prop("x").unwrap();
    assert_eq!(vm.peek(0), Num(5.0));
}

#[test]
fn instances_have_their_own_fields() {
    let mut vm = Vm::new();
    let p = vm.new_inst("Point");
    let q = vm.new_inst("Point");
    set_x(&mut vm, p, 1.0);
    vm.push(q);
    let m = "Point has no property 'x'";
    let r = vm.get_prop("x");
    assert_eq!(r, Err(m.to_string()));
}

#[test]
fn a_none_field_is_still_a_field() {
    let mut vm = Vm::new();
    let p = vm.new_inst("Point");
    vm.push(p);
    vm.push(Empty);
    vm.set_prop("y").unwrap();
    vm.push(p);
    vm.get_prop("y").unwrap();
    assert_eq!(vm.stack, [Empty, Empty]);
}

#[test]
fn reading_a_number_is_an_error() {
    let mut vm = Vm::new();
    vm.push(Num(123.0));
    let m = "cannot read 'foo' of a number";
    let r = vm.get_prop("foo");
    assert_eq!(r, Err(m.to_string()));
}

#[test]
fn setting_on_a_number_is_an_error() {
    let mut vm = Vm::new();
    vm.push(Num(1.0));
    vm.push(Num(2.0));
    let m = "cannot set 'x' on a number";
    let r = vm.set_prop("x");
    assert_eq!(r, Err(m.to_string()));
    assert_eq!(vm.stack.len(), 2);
}`,
    hints: [
      'Both instructions start the same way: look at the receiver without popping it (`peek(0)` for get, `peek(1)` for set) and open it with `let Inst(i) = r else { ... };`, returning the error in the `else`.',
      'For get, `let Some(&v) = self.heap[i].fields.get(name) else { ... };` copies the value out or reports `Point has no property ...` (the class name is `self.heap[i].class`); then `self.set_peek(0, v)`.',
      'For set, read `let v = self.peek(0);` first, then borrow `let o = &mut self.heap[i];`. `HashMap::insert` returns the old value, so `if o.fields.insert(name, v).is_none() { o.order.push(name); }` adds the name only once. Finish with `self.pop(); self.set_peek(0, v);`.',
    ],
    walkthrough: `**How to think about it.** Both instructions are three steps: check the receiver, do one table operation, and leave the right thing on the stack. Look at the stack shapes first. Before \`get.prop\` it ends \`[.., inst]\` and after it \`[.., value]\`; before \`set.prop\` it ends \`[.., inst, value]\` and after it \`[.., value]\`, because an assignment is an expression whose value is the value assigned. Nothing should change before the receiver has been checked, so an error leaves the stack exactly as it was.

**\`get_prop\`, line by line.**

- \`let r = self.peek(0);\` looks at the receiver without popping it.
- \`let Inst(i) = r else { ... };\` opens it. If it is not an instance, the \`else\` block builds drip-rs's message, \`cannot read 'foo' of a number\`, with \`what\` naming the value, and returns.
- \`let fs = &self.heap[i].fields;\` borrows the instance's table, shared, and \`let c = self.heap[i].class;\` copies its class name for the error message.
- \`let Some(&v) = fs.get(name) else { ... };\` looks the field up. \`get\` gives an \`Option<&Value>\`, and the pattern \`Some(&v)\` copies the value out, which is fine because \`Value\` is \`Copy\`. With no such field, the \`else\` block returns \`Point has no property 'x'\`. A field that holds \`Empty\` is \`Some(&Empty)\`, so it is still a field (the test \`a_none_field_is_still_a_field\`).
- \`self.set_peek(0, v);\` replaces the receiver with the field's value. This needs \`&mut self\`, and it is allowed because \`fs\` is not used again, so its borrow has ended.
- \`Ok(())\` reports success.

**\`set_prop\`, line by line.**

- \`let r = self.peek(1);\` and \`let Inst(i) = r else { ... };\` check the receiver, which is one below the value, and report \`cannot set 'x' on a number\` otherwise.
- \`let v = self.peek(0);\` reads the value into a local *before* any mutable borrow: the read-first habit.
- \`let o = &mut self.heap[i];\` borrows the one instance mutably, and \`let f = &mut o.fields;\` its table.
- \`if f.insert(name, v).is_none() {\` adds or overwrites the field. \`insert\` returns the old value, so \`None\` means the name is new, and only then does \`o.order.push(name);\` record it (like drip-rs's \`if object.fields.set(name, value) { object.field_order.push(name); }\`).
- \`self.pop();\` drops the value, and \`self.set_peek(0, v);\` puts it where the instance was, leaving \`[.., value]\`.
- \`Ok(())\` reports success.

**Common wrong attempts.**

- Popping the value and stopping there: the instance is left on the stack, so \`p.x = 3\` evaluates to \`p\`, and the compiler's \`pop\` after it drops the wrong thing.
- Pushing the name onto \`order\` on every set: overwriting \`x\` then lists it twice, and the instance would print \`x\` twice.
- Returning \`Empty\` for a missing field, as JavaScript gives \`undefined\`: Drip reports \`Point has no property 'x'\`, and a field holding \`none\` must stay different from no field at all.`,
    wrong: [
      {
        code: `use std::collections::HashMap;

#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    // Drip's none (named so that it is
    // not confused with Option's None)
    Empty,
    Num(f64),
    Inst(usize), // a handle
}
use Value::*;

type Name = &'static str;

struct Instance {
    class: Name,
    fields: HashMap<Name, Value>,
    // names in the order first set
    order: Vec<Name>,
}

// How errors name a value.
fn what(v: Value) -> &'static str {
    match v {
        Empty => "none",
        Num(_) => "a number",
        Inst(_) => "an instance",
    }
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

    fn set_peek(
        &mut self,
        d: usize,
        v: Value,
    ) {
        let n = self.stack.len();
        self.stack[n - 1 - d] = v;
    }

    // What new C() makes.
    fn new_inst(&mut self, c: Name)
        -> Value {
        self.heap.push(Instance {
            class: c,
            fields: HashMap::new(),
            order: Vec::new(),
        });
        Inst(self.heap.len() - 1)
    }

    // get.prop: [.., inst] becomes
    // [.., value].
    fn get_prop(
        &mut self,
        name: Name,
    ) -> Result<(), String> {
        let r = self.peek(0);
        let Inst(i) = r else {
            let w = what(r);
            let s = "cannot read";
            return Err(format!(
                "{s} '{name}' of {w}"));
        };
        let fs = &self.heap[i].fields;
        let c = self.heap[i].class;
        let Some(&v) = fs.get(name)
        else {
            let p = "has no property";
            return Err(format!(
                "{c} {p} '{name}'"));
        };
        self.set_peek(0, v);
        Ok(())
    }

    // set.prop: [.., inst, value]
    // becomes [.., value].
    fn set_prop(
        &mut self,
        name: Name,
    ) -> Result<(), String> {
        let r = self.peek(1);
        let Inst(i) = r else {
            let w = what(r);
            let s = "cannot set";
            return Err(format!(
                "{s} '{name}' on {w}"));
        };
        let v = self.pop();
        let o = &mut self.heap[i];
        let f = &mut o.fields;
        if f.insert(name, v).is_none() {
            o.order.push(name);
        }
        Ok(())
    }
}`,
        why: 'This leaves the instance on the stack instead of the value. `p.x = 3` must evaluate to 3, and the compiler’s `pop` after it would drop the wrong thing.',
      },
      {
        code: `use std::collections::HashMap;

#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    // Drip's none (named so that it is
    // not confused with Option's None)
    Empty,
    Num(f64),
    Inst(usize), // a handle
}
use Value::*;

type Name = &'static str;

struct Instance {
    class: Name,
    fields: HashMap<Name, Value>,
    // names in the order first set
    order: Vec<Name>,
}

// How errors name a value.
fn what(v: Value) -> &'static str {
    match v {
        Empty => "none",
        Num(_) => "a number",
        Inst(_) => "an instance",
    }
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

    fn set_peek(
        &mut self,
        d: usize,
        v: Value,
    ) {
        let n = self.stack.len();
        self.stack[n - 1 - d] = v;
    }

    // What new C() makes.
    fn new_inst(&mut self, c: Name)
        -> Value {
        self.heap.push(Instance {
            class: c,
            fields: HashMap::new(),
            order: Vec::new(),
        });
        Inst(self.heap.len() - 1)
    }

    // get.prop: [.., inst] becomes
    // [.., value].
    fn get_prop(
        &mut self,
        name: Name,
    ) -> Result<(), String> {
        let r = self.peek(0);
        let Inst(i) = r else {
            let w = what(r);
            let s = "cannot read";
            return Err(format!(
                "{s} '{name}' of {w}"));
        };
        let fs = &self.heap[i].fields;
        let c = self.heap[i].class;
        let Some(&v) = fs.get(name)
        else {
            let p = "has no property";
            return Err(format!(
                "{c} {p} '{name}'"));
        };
        self.set_peek(0, v);
        Ok(())
    }

    // set.prop: [.., inst, value]
    // becomes [.., value].
    fn set_prop(
        &mut self,
        name: Name,
    ) -> Result<(), String> {
        let r = self.peek(1);
        let Inst(i) = r else {
            let w = what(r);
            let s = "cannot set";
            return Err(format!(
                "{s} '{name}' on {w}"));
        };
        let v = self.peek(0);
        let o = &mut self.heap[i];
        o.fields.insert(name, v);
        o.order.push(name);
        self.pop();
        self.set_peek(0, v);
        Ok(())
    }
}`,
        why: 'It records the name every time, so overwriting `x` lists it twice in `order`, and the instance would print `x` twice.',
      },
      {
        code: `use std::collections::HashMap;

#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    // Drip's none (named so that it is
    // not confused with Option's None)
    Empty,
    Num(f64),
    Inst(usize), // a handle
}
use Value::*;

type Name = &'static str;

struct Instance {
    class: Name,
    fields: HashMap<Name, Value>,
    // names in the order first set
    order: Vec<Name>,
}

// How errors name a value.
fn what(v: Value) -> &'static str {
    match v {
        Empty => "none",
        Num(_) => "a number",
        Inst(_) => "an instance",
    }
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

    fn set_peek(
        &mut self,
        d: usize,
        v: Value,
    ) {
        let n = self.stack.len();
        self.stack[n - 1 - d] = v;
    }

    // What new C() makes.
    fn new_inst(&mut self, c: Name)
        -> Value {
        self.heap.push(Instance {
            class: c,
            fields: HashMap::new(),
            order: Vec::new(),
        });
        Inst(self.heap.len() - 1)
    }

    // get.prop: [.., inst] becomes
    // [.., value].
    fn get_prop(
        &mut self,
        name: Name,
    ) -> Result<(), String> {
        let r = self.peek(0);
        let Inst(i) = r else {
            let w = what(r);
            let s = "cannot read";
            return Err(format!(
                "{s} '{name}' of {w}"));
        };
        let fs = &self.heap[i].fields;
        let v = fs.get(name).copied();
        let v = v.unwrap_or(Empty);
        self.set_peek(0, v);
        Ok(())
    }

    // set.prop: [.., inst, value]
    // becomes [.., value].
    fn set_prop(
        &mut self,
        name: Name,
    ) -> Result<(), String> {
        let r = self.peek(1);
        let Inst(i) = r else {
            let w = what(r);
            let s = "cannot set";
            return Err(format!(
                "{s} '{name}' on {w}"));
        };
        let v = self.peek(0);
        let o = &mut self.heap[i];
        let f = &mut o.fields;
        if f.insert(name, v).is_none() {
            o.order.push(name);
        }
        self.pop();
        self.set_peek(0, v);
        Ok(())
    }
}`,
        why: 'This is JavaScript’s habit, where a missing property reads as `undefined`. Drip reports `Point has no property ...`, and a field that holds `none` must stay different from no field at all.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does `print p;` show after `p.x = 3; p.y = 4; p.x = 5;` on a new `Point`?',
    options: [
      {
        t: '`Point { x: 5, y: 4 }`',
        correct: true,
        why: 'Overwriting `x` does not add it to `field_order` again, so it keeps its first place.',
      },
      {
        t: '`Point { y: 4, x: 5 }`',
        why: 'That would mean the last write decides the order; `field_order` records the first.',
      },
      {
        t: '`Point instance`',
        why: 'New Drip prints an instance with its fields.',
      },
      {
        t: 'The fields in hash-table order',
        why: 'That is what `field_order` exists to avoid.',
      },
    ],
  },
  {
    q: 'In `new_instance`, why is it safe to call `self.alloc(ObjInstance { class, .. })` before the instance is on the stack?',
    options: [
      {
        t: 'Allocating never collects',
        why: '`Vm::alloc` may collect first.',
      },
      {
        t: 'Instances are never collected',
        why: 'They are, once nothing reaches them.',
      },
      {
        t: 'The instance’s only reference, the class, is still on the stack, so a collection keeps it; the new instance itself refers to nothing else yet',
        correct: true,
        why: 'That is the rule from the collector chapter: what a new object refers to must already be reachable.',
      },
      {
        t: 'The class is a global',
        why: 'It may well be a local class; the reason is that it is on the stack.',
      },
    ],
  },
  {
    q: 'An instance has a field `go` and its class a method `go`. What does `obj.go` give?',
    options: [
      {
        t: 'A bound method for the class’s `go`',
        why: 'Methods are only tried when no field matches.',
      },
      {
        t: 'A runtime error: the name is ambiguous',
        why: 'Drip has a fixed rule, so nothing is ambiguous.',
      },
      {
        t: 'Whichever was defined last',
        why: 'The order of definition does not matter.',
      },
      {
        t: 'The field’s value',
        correct: true,
        why: '`get.prop` looks in the fields first; fields shadow methods.',
      },
    ],
  },
  {
    q: 'Why does drip-rs’s `set.prop` arm read the name and the value into locals before `let object = &mut self.heap[instance];`?',
    options: [
      {
        t: 'To make the arm faster',
        why: 'The reason is borrowing, not speed.',
      },
      {
        t: 'Reading the name needs `&mut self` (it moves `ip` on), which cannot happen while the instance is mutably borrowed',
        correct: true,
        why: 'Done the other way round, as one expression, it is error E0499.',
      },
      {
        t: 'Because `Table::set` takes ownership of its arguments',
        why: '`StrRef` and `Value` are `Copy`; ownership is not the issue.',
      },
      {
        t: 'The TypeScript VM does it the same way, so the port copies it',
        why: 'The TypeScript arm can read operands in the middle of the call; Rust forbids that here.',
      },
    ],
  },
  {
    q: 'What does `n.x = 2;` report when `n` is the number 1?',
    options: [
      {
        t: `\`undefined variable 'x'\``,
        why: 'That is for globals, not properties.',
      },
      {
        t: `\`cannot set 'x' on a number\``,
        correct: true,
        why: '`set.prop` checks `peek(1)` first, and only instances have properties.',
      },
      {
        t: `\`Number has no property 'x'\``,
        why: 'That form names a class, which a number does not have.',
      },
      {
        t: 'Nothing: the assignment is ignored',
        why: 'Drip never ignores a failed assignment; it is a runtime error, exit code 70.',
      },
    ],
  },
];
