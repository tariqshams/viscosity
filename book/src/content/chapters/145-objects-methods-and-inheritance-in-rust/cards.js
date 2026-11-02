// Chapter 77 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 145, 145, 145.

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
  'bm-fields': {
    q: 'What two fields does drip-rs’s `ObjBoundMethod` have, and what are their types?',
    a: '`receiver: Value` and `method: Gc<ObjClosure>`.',
  },
  'bm-receiver-root': {
    q: 'Why does the `get.prop` arm overwrite the receiver with the bound method only after allocating it?',
    a: '`alloc` may start a collection. While the receiver is on the stack it is a root, so it cannot be freed before the bound method holds it.',
  },
  'bm-as-closure': {
    q: 'What does `as_closure(method)` do in the `get.prop` arm, and what did TypeScript write instead?',
    a: 'It opens the `Value::Closure` from the methods table with a `match`, and calls `unreachable!` for anything else. TypeScript wrote the unchecked cast `method as ObjClosure`.',
  },
  'bm-destructure': {
    q: 'Why does `let ObjBoundMethod { receiver, method } = self.heap[bound];` compile when `let b = self.heap[bound];` does not?',
    a: 'Indexing gives a place. The pattern copies each field, which is fine because `Value` and `Gc` are `Copy`. Binding the whole struct would move it out of the arena: E0507.',
  },
  'bm-slot0': {
    q: 'What does calling a bound method do with its receiver?',
    a: 'Writes it over the callee’s stack slot with `set_peek(arg_count, receiver)`. That slot becomes the method’s slot 0, which is where `self` lives.',
  },
  'init-string': {
    q: 'Where does the VM’s `init_string` come from, and why must the collector know about it?',
    a: 'It is `"init"`, interned once in `Vm::new`. It is in `VmRoots`, because a string nothing marks would be freed, and the lookups of `init` would break.',
  },
  'init-match': {
    q: '`new C(args)`: what are the three arms of the `match` on `methods.get(self.init_string)`?',
    a: '`Some(init)`: call it. `None if arg_count != 0`: “C has no init, so it takes no arguments, but got N”. `None`: done, the instance is the result.',
  },
  'init-kind': {
    q: 'How does drip-rs make every return from `init` produce the instance?',
    a: '`method()` gives `init` the kind `FunctionKind::Initializer`, and `emit_return` then emits `load.local 0` instead of `none` before `return`.',
  },
  'cd-what': {
    q: 'What does drip-rs’s `inherit` instruction do to the subclass?',
    a: 'Copies every entry of the superclass’s methods table into the subclass’s methods table, then pops the subclass.',
  },
  'cd-order': {
    q: 'Why does an overriding method win over the copied one?',
    a: '`inherit` runs before the subclass’s own `method` instructions, so the subclass’s method overwrites the copied entry.',
  },
  'cd-e0502': {
    q: 'Why can’t drip-rs write `self.heap[sub].methods.add_all(&self.heap[sup].methods)`?',
    a: 'Both index expressions borrow the whole heap. A mutable borrow while a shared one is alive is E0502; the compiler cannot know the two handles differ.',
  },
  'cd-clone': {
    q: 'How does drip-rs’s `Inherit` arm get around that borrow conflict?',
    a: 'It clones the superclass’s `Table` into a local first, so the shared borrow ends at the semicolon, then calls `add_all(&methods)` on the subclass.',
  },
  'cd-check': {
    q: 'What does `Inherit` check at run time, and how does it treat the subclass?',
    a: 'That `peek(1)` is a `Value::Class`, else the runtime error “a class can only extend a class, not …”. The subclass is opened with `as_class`, which is `unreachable!` for anything else, because the compiler put it there.',
  },
  'cd-no-gc': {
    q: 'Why can’t the `clone()` in `Inherit` start a garbage collection?',
    a: 'It allocates ordinary Rust memory (a count and two `Vec`s), not a Drip object, so it never goes through `Heap::alloc`.',
  },
  'sup-classes': {
    q: 'How does drip-rs’s compiler track the class it is inside, and what did the TypeScript compiler use?',
    a: 'A `Vec<ClassState>` used as a stack, each with `has_superclass`. TypeScript linked `{ enclosing, hasSuperclass }` records and held the current one in `cc`.',
  },
  'sup-static': {
    q: 'Why can `add_local("super", ...)` pass a string literal where a `&\'src str` is expected?',
    a: 'A literal is a `&\'static str`, and `\'static` lives at least as long as `\'src`, so it is accepted.',
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
  cup: {
    title: 'init, a method, and a bound method passed around',
    lang: 'drip-vm',
    code: `class Cup {
  init(n) { self.n = n; }
  sip() { print self.n; }
}
let s = new Cup("tea").sip;
s();
let c = new Cup("milk");
print c.n;
print s;`,
  },
  shapes: {
    title: 'super.init and an inherited method',
    lang: 'drip-vm',
    code: `class Shape {
  init(name) { self.name = name; }
  describe() {
    let a = str(self.area());
    return self.name + " " + a;
  }
}
class Rect extends Shape {
  init(w, h) {
    super.init("rect");
    self.w = w;
    self.h = h;
  }
  area() { return self.w * self.h; }
}
let r = new Rect(3, 4);
print r.describe();
print r;`,
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
  callValue: {
    lang: 'rust',
    title: 'Calling bound methods, and new',
    prompt: `This small VM is shaped like drip-rs: values are a \`Copy\` enum of handles, and objects live in \`Vec\`s. \`call(f, argc)\` records a call and its slot 0, and \`call_value\` is written. Write two helpers:

- **\`call_bound(b, argc)\`**: copy the receiver and method out of \`self.bounds[b]\`, write the receiver over the callee's slot (\`set_peek(argc, ..)\`), and call the method.
- **\`new_instance(argc)\`**: the class is \`argc\` slots below the top; if it isn't a class, return \`Err\` with \`'new' needs a class\`. Push the class's index onto \`instances\` (the new instance's index is the last one) and write \`Instance(index)\` over the class's slot. Then call \`init\` if the class has one; else, with arguments, return \`Err(no_init(name, argc))\`; else return \`Ok(())\`.

\`BoundObj\` is deliberately not \`Copy\`, like drip-rs's \`ObjBoundMethod\`.`,
    starter: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    Num(f64),
    Class(usize),
    Instance(usize),
    Bound(usize),
    Closure(usize),
}

// Not Copy, like drip-rs's
// ObjBoundMethod.
struct BoundObj {
    receiver: Value,
    method: usize,
}

struct ClassObj {
    name: &'static str,
    init: Option<usize>,
}

struct Vm {
    stack: Vec<Value>,
    bounds: Vec<BoundObj>,
    classes: Vec<ClassObj>,
    // The class of each instance.
    instances: Vec<usize>,
    // Each call: (closure, slot 0).
    calls: Vec<(usize, usize)>,
}

type Run = Result<(), String>;

const NO_CLASS: &str =
    "'new' needs a class";
const NOT_CALLABLE: &str =
    "cannot call that";

fn no_init(n: &str, k: usize)
    -> String {
    let m = "has no init, so it takes";
    let a = "no arguments, but got";
    format!("{n} {m} {a} {k}")
}

impl Vm {
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

    // Record the call and its slot 0.
    fn call(
        &mut self,
        f: usize,
        argc: usize,
    ) -> Run {
        let n = self.stack.len();
        let base = n - argc - 1;
        self.calls.push((f, base));
        Ok(())
    }

    // The callee is argc slots below
    // the top of the stack.
    fn call_value(
        &mut self,
        callee: Value,
        argc: usize,
    ) -> Run {
        match callee {
            Value::Bound(b) => {
                self.call_bound(b, argc)
            }
            Value::Closure(f) => {
                self.call(f, argc)
            }
            _ => {
                Err(NOT_CALLABLE.into())
            }
        }
    }

    fn call_bound(
        &mut self,
        b: usize,
        argc: usize,
    ) -> Run {
        todo!()
    }

    // new C(args): the class is argc
    // slots below the top.
    fn new_instance(
        &mut self,
        argc: usize,
    ) -> Run {
        todo!()
    }
}`,
    solution: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    Num(f64),
    Class(usize),
    Instance(usize),
    Bound(usize),
    Closure(usize),
}

// Not Copy, like drip-rs's
// ObjBoundMethod.
struct BoundObj {
    receiver: Value,
    method: usize,
}

struct ClassObj {
    name: &'static str,
    init: Option<usize>,
}

struct Vm {
    stack: Vec<Value>,
    bounds: Vec<BoundObj>,
    classes: Vec<ClassObj>,
    // The class of each instance.
    instances: Vec<usize>,
    // Each call: (closure, slot 0).
    calls: Vec<(usize, usize)>,
}

type Run = Result<(), String>;

const NO_CLASS: &str =
    "'new' needs a class";
const NOT_CALLABLE: &str =
    "cannot call that";

fn no_init(n: &str, k: usize)
    -> String {
    let m = "has no init, so it takes";
    let a = "no arguments, but got";
    format!("{n} {m} {a} {k}")
}

impl Vm {
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

    // Record the call and its slot 0.
    fn call(
        &mut self,
        f: usize,
        argc: usize,
    ) -> Run {
        let n = self.stack.len();
        let base = n - argc - 1;
        self.calls.push((f, base));
        Ok(())
    }

    // The callee is argc slots below
    // the top of the stack.
    fn call_value(
        &mut self,
        callee: Value,
        argc: usize,
    ) -> Run {
        match callee {
            Value::Bound(b) => {
                self.call_bound(b, argc)
            }
            Value::Closure(f) => {
                self.call(f, argc)
            }
            _ => {
                Err(NOT_CALLABLE.into())
            }
        }
    }

    fn call_bound(
        &mut self,
        b: usize,
        argc: usize,
    ) -> Run {
        let BoundObj {
            receiver,
            method,
        } = self.bounds[b];
        self.set_peek(argc, receiver);
        self.call(method, argc)
    }

    // new C(args): the class is argc
    // slots below the top.
    fn new_instance(
        &mut self,
        argc: usize,
    ) -> Run {
        let v = self.peek(argc);
        let Value::Class(c) = v else {
            return Err(NO_CLASS.into());
        };
        self.instances.push(c);
        let n = self.instances.len();
        let i = Value::Instance(n - 1);
        self.set_peek(argc, i);
        let k = &self.classes[c];
        match k.init {
            Some(f) => {
                self.call(f, argc)
            }
            None if argc != 0 => {
                let n = k.name;
                Err(no_init(n, argc))
            }
            None => Ok(()),
        }
    }
}`,
    tests: `use Value::*;

// Class 0, Cup, has init (closure 5);
// class 1, Mug, has none. Instance 0
// already exists.
fn vm() -> Vm {
    Vm {
        stack: Vec::new(),
        bounds: Vec::new(),
        classes: vec![
            ClassObj { name: "Cup",
                init: Some(5) },
            ClassObj { name: "Mug",
                init: None },
        ],
        instances: vec![0],
        calls: Vec::new(),
    }
}

#[test]
fn a_bound_method_puts_its_receiver_in_slot_0() {
    let mut v = vm();
    v.bounds.push(BoundObj {
        receiver: Instance(0),
        method: 9,
    });
    v.stack = vec![Num(0.0), Bound(0),
        Num(7.0)];
    v.call_value(Bound(0), 1).unwrap();
    assert_eq!(v.stack[1], Instance(0));
    assert_eq!(v.stack.len(), 3);
    assert_eq!(v.calls, [(9, 1)]);
}

#[test]
fn new_with_init_calls_it_on_a_new_instance() {
    let mut v = vm();
    v.stack = vec![Class(0), Num(1.0),
        Num(2.0)];
    v.new_instance(2).unwrap();
    assert_eq!(v.instances, [0, 0]);
    assert_eq!(v.stack[0], Instance(1));
    assert_eq!(v.stack.len(), 3);
    assert_eq!(v.calls, [(5, 0)]);
}

#[test]
fn new_without_init_just_makes_an_instance() {
    let mut v = vm();
    v.stack = vec![Num(0.0), Class(1)];
    v.new_instance(0).unwrap();
    assert_eq!(v.stack,
        [Num(0.0), Instance(1)]);
    assert_eq!(v.instances, [0, 1]);
    assert!(v.calls.is_empty());
}

#[test]
fn arguments_without_init_are_an_error() {
    let mut v = vm();
    v.stack = vec![Class(1), Num(1.0)];
    let e = v.new_instance(1);
    let m = "Mug has no init, so it takes \\
        no arguments, but got 1";
    assert_eq!(e, Err(m.to_string()));
}

#[test]
fn new_needs_a_class() {
    let mut v = vm();
    v.stack = vec![Num(3.0)];
    let e = v.new_instance(0);
    assert_eq!(e, Err(NO_CLASS.into()));
}

#[test]
fn closures_still_work() {
    let mut v = vm();
    v.stack = vec![Closure(3)];
    v.call_value(Closure(3), 0).unwrap();
    assert_eq!(v.calls, [(3, 0)]);
}`,
    hints: [
      'Both helpers end the same way: write something over the callee’s slot with `set_peek(argc, ..)` (so it becomes slot 0 of the new frame), then call.',
      'For `call_bound`, copy the two fields out with a destructuring pattern, `let BoundObj { receiver, method } = self.bounds[b];`. Binding the whole struct would try to move it out of the `Vec`.',
      'For `new_instance`: `let Value::Class(c) = self.peek(argc) else { ... };`, push `c` onto `instances`, `set_peek(argc, Instance(len - 1))`, then `match self.classes[c].init { Some(f) => self.call(f, argc), None if argc != 0 => Err(..), None => Ok(()) }`.',
    ],
    walkthrough: `**How to think about it.** Every call in this VM ends with a frame whose slot 0 is the callee's slot, so the whole trick of methods is to put the right value in that slot before calling: for a bound method, the receiver it remembered; for \`new\`, the brand-new instance. Draw the stack: \`[.., callee, arg1, .., argN]\`. The callee is \`argc\` places below the top, which is exactly what \`set_peek(argc, ..)\` overwrites. The other Rust question is how to read a non-\`Copy\` object out of a \`Vec\` without moving it.

**\`call_bound\`, line by line.**

- \`let BoundObj { receiver, method } = self.bounds[b];\` is a destructuring pattern on the place \`self.bounds[b]\`. Each field is bound by value, and both are \`Copy\` (\`Value\` and \`usize\`), so they are copied and the object stays in the \`Vec\`.
- \`self.set_peek(argc, receiver);\` writes the receiver over the bound method's own slot. In the first test the stack \`[Num(0), Bound(0), Num(7)]\` becomes \`[Num(0), Instance(0), Num(7)]\`.
- \`self.call(method, argc)\` calls the method, whose slot 0 is now the receiver: \`(9, 1)\` is recorded.

**\`new_instance\`, line by line.**

- \`let v = self.peek(argc);\` reads the value under the arguments, and \`let Value::Class(c) = v else { return Err(NO_CLASS.into()); };\` returns \`'new' needs a class\` if it is anything else.
- \`self.instances.push(c);\` makes the instance (here it is just a record of its class).
- \`let n = self.instances.len();\` and \`let i = Value::Instance(n - 1);\` make its handle: the last index.
- \`self.set_peek(argc, i);\` writes the instance over the class's slot, where \`init\` will find it as \`self\`.
- \`let k = &self.classes[c];\` borrows the class, and \`match k.init {\` looks for an initialiser. \`Option<usize>\` is \`Copy\`, so \`Some(f)\` copies the closure's index.
- \`Some(f) => { self.call(f, argc) }\` runs \`init\` with all the arguments. \`k\` is not used in this arm, so its borrow has ended and \`self.call\` may borrow \`self\` mutably.
- \`None if argc != 0 => { let n = k.name; Err(no_init(n, argc)) }\` is the guard: no \`init\` but arguments given is drip-rs's error, \`Mug has no init, so it takes no arguments, but got 1\`.
- \`None => Ok(()),\` is the plain case: the instance in the slot is the result of \`new\`.

**Common wrong attempts.**

- \`let bm = self.bounds[b];\` tries to move a \`BoundObj\` out of the \`Vec\`. It is not \`Copy\`, so rustc rejects it with E0507.
- Checking \`argc != 0\` before looking for \`init\`: \`new Cup(1, 2)\` then fails even though \`Cup\` has an \`init\`. The error belongs only to classes without one.
- Pushing the receiver or instance instead of writing it over the callee's slot: the stack grows by one, slot 0 of the new frame still holds the bound method or class, and \`self\` is wrong.`,
    wrong: [
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    Num(f64),
    Class(usize),
    Instance(usize),
    Bound(usize),
    Closure(usize),
}

// Not Copy, like drip-rs's
// ObjBoundMethod.
struct BoundObj {
    receiver: Value,
    method: usize,
}

struct ClassObj {
    name: &'static str,
    init: Option<usize>,
}

struct Vm {
    stack: Vec<Value>,
    bounds: Vec<BoundObj>,
    classes: Vec<ClassObj>,
    // The class of each instance.
    instances: Vec<usize>,
    // Each call: (closure, slot 0).
    calls: Vec<(usize, usize)>,
}

type Run = Result<(), String>;

const NO_CLASS: &str =
    "'new' needs a class";
const NOT_CALLABLE: &str =
    "cannot call that";

fn no_init(n: &str, k: usize)
    -> String {
    let m = "has no init, so it takes";
    let a = "no arguments, but got";
    format!("{n} {m} {a} {k}")
}

impl Vm {
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

    // Record the call and its slot 0.
    fn call(
        &mut self,
        f: usize,
        argc: usize,
    ) -> Run {
        let n = self.stack.len();
        let base = n - argc - 1;
        self.calls.push((f, base));
        Ok(())
    }

    // The callee is argc slots below
    // the top of the stack.
    fn call_value(
        &mut self,
        callee: Value,
        argc: usize,
    ) -> Run {
        match callee {
            Value::Bound(b) => {
                self.call_bound(b, argc)
            }
            Value::Closure(f) => {
                self.call(f, argc)
            }
            _ => {
                Err(NOT_CALLABLE.into())
            }
        }
    }

    fn call_bound(
        &mut self,
        b: usize,
        argc: usize,
    ) -> Run {
        let bm = self.bounds[b];
        let r = bm.receiver;
        self.set_peek(argc, r);
        self.call(bm.method, argc)
    }

    // new C(args): the class is argc
    // slots below the top.
    fn new_instance(
        &mut self,
        argc: usize,
    ) -> Run {
        let v = self.peek(argc);
        let Value::Class(c) = v else {
            return Err(NO_CLASS.into());
        };
        self.instances.push(c);
        let n = self.instances.len();
        let i = Value::Instance(n - 1);
        self.set_peek(argc, i);
        let k = &self.classes[c];
        match k.init {
            Some(f) => {
                self.call(f, argc)
            }
            None if argc != 0 => {
                let n = k.name;
                Err(no_init(n, argc))
            }
            None => Ok(()),
        }
    }
}`,
        why: '`let bm = self.bounds[b];` tries to move a `BoundObj` out of the `Vec`. It isn’t `Copy`, so this is E0507. Destructure the two fields instead.',
      },
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    Num(f64),
    Class(usize),
    Instance(usize),
    Bound(usize),
    Closure(usize),
}

// Not Copy, like drip-rs's
// ObjBoundMethod.
struct BoundObj {
    receiver: Value,
    method: usize,
}

struct ClassObj {
    name: &'static str,
    init: Option<usize>,
}

struct Vm {
    stack: Vec<Value>,
    bounds: Vec<BoundObj>,
    classes: Vec<ClassObj>,
    // The class of each instance.
    instances: Vec<usize>,
    // Each call: (closure, slot 0).
    calls: Vec<(usize, usize)>,
}

type Run = Result<(), String>;

const NO_CLASS: &str =
    "'new' needs a class";
const NOT_CALLABLE: &str =
    "cannot call that";

fn no_init(n: &str, k: usize)
    -> String {
    let m = "has no init, so it takes";
    let a = "no arguments, but got";
    format!("{n} {m} {a} {k}")
}

impl Vm {
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

    // Record the call and its slot 0.
    fn call(
        &mut self,
        f: usize,
        argc: usize,
    ) -> Run {
        let n = self.stack.len();
        let base = n - argc - 1;
        self.calls.push((f, base));
        Ok(())
    }

    // The callee is argc slots below
    // the top of the stack.
    fn call_value(
        &mut self,
        callee: Value,
        argc: usize,
    ) -> Run {
        match callee {
            Value::Bound(b) => {
                self.call_bound(b, argc)
            }
            Value::Closure(f) => {
                self.call(f, argc)
            }
            _ => {
                Err(NOT_CALLABLE.into())
            }
        }
    }

    fn call_bound(
        &mut self,
        b: usize,
        argc: usize,
    ) -> Run {
        let BoundObj {
            receiver,
            method,
        } = self.bounds[b];
        self.set_peek(argc, receiver);
        self.call(method, argc)
    }

    // new C(args): the class is argc
    // slots below the top.
    fn new_instance(
        &mut self,
        argc: usize,
    ) -> Run {
        let v = self.peek(argc);
        let Value::Class(c) = v else {
            return Err(NO_CLASS.into());
        };
        let k = &self.classes[c];
        if argc != 0 {
            let n = k.name;
            let e = no_init(n, argc);
            return Err(e);
        }
        self.instances.push(c);
        let n = self.instances.len();
        let i = Value::Instance(n - 1);
        self.set_peek(argc, i);
        match self.classes[c].init {
            Some(f) => {
                self.call(f, argc)
            }
            None => Ok(()),
        }
    }
}`,
        why: 'It checks the argument count before looking for `init`, so `new Cup(1, 2)` fails even though `Cup` has an `init`. The error belongs only to classes without one.',
      },
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    Num(f64),
    Class(usize),
    Instance(usize),
    Bound(usize),
    Closure(usize),
}

// Not Copy, like drip-rs's
// ObjBoundMethod.
struct BoundObj {
    receiver: Value,
    method: usize,
}

struct ClassObj {
    name: &'static str,
    init: Option<usize>,
}

struct Vm {
    stack: Vec<Value>,
    bounds: Vec<BoundObj>,
    classes: Vec<ClassObj>,
    // The class of each instance.
    instances: Vec<usize>,
    // Each call: (closure, slot 0).
    calls: Vec<(usize, usize)>,
}

type Run = Result<(), String>;

const NO_CLASS: &str =
    "'new' needs a class";
const NOT_CALLABLE: &str =
    "cannot call that";

fn no_init(n: &str, k: usize)
    -> String {
    let m = "has no init, so it takes";
    let a = "no arguments, but got";
    format!("{n} {m} {a} {k}")
}

impl Vm {
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

    // Record the call and its slot 0.
    fn call(
        &mut self,
        f: usize,
        argc: usize,
    ) -> Run {
        let n = self.stack.len();
        let base = n - argc - 1;
        self.calls.push((f, base));
        Ok(())
    }

    // The callee is argc slots below
    // the top of the stack.
    fn call_value(
        &mut self,
        callee: Value,
        argc: usize,
    ) -> Run {
        match callee {
            Value::Bound(b) => {
                self.call_bound(b, argc)
            }
            Value::Closure(f) => {
                self.call(f, argc)
            }
            _ => {
                Err(NOT_CALLABLE.into())
            }
        }
    }

    fn call_bound(
        &mut self,
        b: usize,
        argc: usize,
    ) -> Run {
        let BoundObj {
            receiver,
            method,
        } = self.bounds[b];
        self.stack.push(receiver);
        self.call(method, argc)
    }

    // new C(args): the class is argc
    // slots below the top.
    fn new_instance(
        &mut self,
        argc: usize,
    ) -> Run {
        let v = self.peek(argc);
        let Value::Class(c) = v else {
            return Err(NO_CLASS.into());
        };
        self.instances.push(c);
        let n = self.instances.len();
        let i = Value::Instance(n - 1);
        self.set_peek(argc, i);
        let k = &self.classes[c];
        match k.init {
            Some(f) => {
                self.call(f, argc)
            }
            None if argc != 0 => {
                let n = k.name;
                Err(no_init(n, argc))
            }
            None => Ok(()),
        }
    }
}`,
        why: 'It pushes the receiver instead of writing it over the callee’s slot. The stack grows by one, the frame’s slot 0 still holds the bound method, and `self` is wrong.',
      },
    ],
  },
  inherit: {
    lang: 'rust',
    title: 'The inherit instruction',
    prompt: `Write \`inherit\`, this small VM's version of drip-rs's \`inherit\` instruction. The classes live in one \`Vec\`, as drip-rs's live in one arena, and a \`Value::Class\` holds an index into it.

1. The superclass is \`peek(1)\`. If it isn't a \`Value::Class\`, return \`Err\` with the message in \`BAD\` (the only non-class value here is a number).
2. The subclass is \`peek(0)\`; it is always a class.
3. Copy every method of the superclass into the subclass. The superclass must keep its own.
4. Pop the subclass.

The TypeScript one-liner, writing \`self.classes[sub]\` while borrowing \`self.classes[sup]\`, will not compile.`,
    starter: `use std::collections::HashMap;

#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    Num(f64),
    Class(usize), // a handle
}

type Methods =
    HashMap<&'static str, usize>;

struct ClassObj {
    methods: Methods,
}

struct Vm {
    stack: Vec<Value>,
    // The class arena.
    classes: Vec<ClassObj>,
}

type Run = Result<(), String>;

const BAD: &str =
    "a class can only extend a class, \\
     not a number";

impl Vm {
    fn peek(&self, d: usize) -> Value {
        let n = self.stack.len();
        self.stack[n - 1 - d]
    }

    // method: add or overwrite.
    fn method(
        &mut self,
        c: usize,
        name: &'static str,
        f: usize,
    ) {
        let cl = &mut self.classes[c];
        cl.methods.insert(name, f);
    }

    // inherit: the superclass is at
    // peek(1), the subclass at peek(0).
    fn inherit(&mut self) -> Run {
        todo!()
    }
}`,
    solution: `use std::collections::HashMap;

#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    Num(f64),
    Class(usize), // a handle
}

type Methods =
    HashMap<&'static str, usize>;

struct ClassObj {
    methods: Methods,
}

struct Vm {
    stack: Vec<Value>,
    // The class arena.
    classes: Vec<ClassObj>,
}

type Run = Result<(), String>;

const BAD: &str =
    "a class can only extend a class, \\
     not a number";

impl Vm {
    fn peek(&self, d: usize) -> Value {
        let n = self.stack.len();
        self.stack[n - 1 - d]
    }

    // method: add or overwrite.
    fn method(
        &mut self,
        c: usize,
        name: &'static str,
        f: usize,
    ) {
        let cl = &mut self.classes[c];
        cl.methods.insert(name, f);
    }

    // inherit: the superclass is at
    // peek(1), the subclass at peek(0).
    fn inherit(&mut self) -> Run {
        let Value::Class(sup) =
            self.peek(1)
        else {
            return Err(BAD.into());
        };
        let Value::Class(sub) =
            self.peek(0)
        else {
            unreachable!("not a class");
        };
        let ms = self.classes[sup]
            .methods
            .clone();
        let to = &mut self.classes[sub];
        to.methods.extend(ms);
        self.stack.pop();
        Ok(())
    }
}`,
    tests: `use Value::*;

// Class 0, A: hi -> 1, me -> 2.
// Class 1, B: empty. Stack: A, B.
fn vm() -> Vm {
    let mut a = HashMap::new();
    a.insert("hi", 1);
    a.insert("me", 2);
    let b = HashMap::new();
    Vm {
        stack: vec![Class(0), Class(1)],
        classes: vec![
            ClassObj { methods: a },
            ClassObj { methods: b },
        ],
    }
}

#[test]
fn copies_every_method_and_pops_the_subclass() {
    let mut v = vm();
    v.inherit().unwrap();
    let b = &v.classes[1].methods;
    assert_eq!(b.len(), 2);
    assert_eq!(b["hi"], 1);
    assert_eq!(b["me"], 2);
    assert_eq!(v.stack, [Class(0)]);
}

#[test]
fn the_superclass_keeps_its_methods() {
    let mut v = vm();
    v.inherit().unwrap();
    assert_eq!(v.classes[0].methods.len(), 2);
}

#[test]
fn an_override_after_inherit_wins() {
    let mut v = vm();
    v.inherit().unwrap();
    v.method(1, "hi", 3);
    assert_eq!(v.classes[1].methods["hi"], 3);
    assert_eq!(v.classes[0].methods["hi"], 1);
}

#[test]
fn it_is_a_copy_not_a_link() {
    let mut v = vm();
    v.inherit().unwrap();
    v.method(0, "late", 4);
    let b = &v.classes[1].methods;
    assert!(!b.contains_key("late"));
}

#[test]
fn a_number_is_not_a_superclass() {
    let mut v = vm();
    v.stack[0] = Num(1.0);
    let m = "a class can only extend a \\
             class, not a number";
    assert_eq!(v.inherit(), Err(m.into()));
    assert_eq!(v.stack.len(), 2);
}`,
    hints: [
      'Start with the checks. `let Value::Class(sup) = self.peek(1) else { return Err(BAD.into()); };` opens the superclass, and the subclass is opened the same way with `unreachable!` in its `else`.',
      'The obvious copy, `self.classes[sub].methods.extend(&self.classes[sup].methods)`, is E0502: both index expressions borrow the whole `Vec`. Make the shared borrow end before the mutable one starts.',
      'Clone first: `let ms = self.classes[sup].methods.clone();`, then `self.classes[sub].methods.extend(ms);`, then `self.stack.pop();` and `Ok(())`.',
    ],
    walkthrough: `**How to think about it.** The job is easy to say: "B's table gets everything in A's table". The difficulty is only Rust's, and it is the same one drip-rs has. \`self.classes[sub]\` on the left of a write calls \`IndexMut\` on the whole \`Vec\`, and \`self.classes[sup]\` calls \`Index\` on the whole \`Vec\` too. Rust cannot see that \`sub != sup\`, so a write through one while a reference from the other is alive is E0502. So the plan is: read everything you need out of A into something you own, let go of A, then write into B.

**The solution, line by line.**

- \`let Value::Class(sup) = self.peek(1) else { return Err(BAD.into()); };\` copies the value under the top out of the stack (\`Value\` is \`Copy\`) and opens it as a class. Anything else is the program's mistake (it wrote \`class B extends 1\`, in effect), so it becomes an \`Err\` with the exact message, and nothing on the stack is changed.
- \`let Value::Class(sub) = self.peek(0) else { unreachable!("not a class"); };\` opens the top. The compiler put a class there a moment ago, so anything else would be a bug in the VM; \`unreachable!\` says so and panics, just as drip-rs's \`as_class\` does.
- \`let ms = self.classes[sup].methods.clone();\` makes an owned copy of A's table. The shared borrow of \`self.classes\` lasts only for this statement, so it is over at the semicolon.
- \`let to = &mut self.classes[sub];\` now borrows the \`Vec\` mutably, which is allowed because nothing else borrows it.
- \`to.methods.extend(ms);\` moves the copied entries into B's table, overwriting any key B already had (here it has none). drip-rs does the same with \`Table::clone\` and \`add_all\`.
- \`self.stack.pop();\` removes B, leaving A (the hidden \`super\` local, in drip-rs), and \`Ok(())\` reports success.

**Common wrong attempts.**

- The TypeScript shape, holding \`&mut self.classes[sub]\` and \`&self.classes[sup]\` at once, is E0502, as above.
- Taking A's table with \`std::mem::take\` dodges the borrow checker, because the take ends before B is borrowed, but it *moves* the methods: A is left with an empty table, and \`new A().hi()\` would fail. Copy-down means copy.
- Panicking on a bad superclass treats the program's mistake as the VM's. It must be a runtime error the program reports, with Drip's message, not a crash.`,
    wrong: [
      {
        code: `use std::collections::HashMap;

#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    Num(f64),
    Class(usize), // a handle
}

type Methods =
    HashMap<&'static str, usize>;

struct ClassObj {
    methods: Methods,
}

struct Vm {
    stack: Vec<Value>,
    // The class arena.
    classes: Vec<ClassObj>,
}

type Run = Result<(), String>;

const BAD: &str =
    "a class can only extend a class, \\
     not a number";

impl Vm {
    fn peek(&self, d: usize) -> Value {
        let n = self.stack.len();
        self.stack[n - 1 - d]
    }

    // method: add or overwrite.
    fn method(
        &mut self,
        c: usize,
        name: &'static str,
        f: usize,
    ) {
        let cl = &mut self.classes[c];
        cl.methods.insert(name, f);
    }

    // inherit: the superclass is at
    // peek(1), the subclass at peek(0).
    fn inherit(&mut self) -> Run {
        let Value::Class(sup) =
            self.peek(1)
        else {
            return Err(BAD.into());
        };
        let Value::Class(sub) =
            self.peek(0)
        else {
            unreachable!("not a class");
        };
        let to = &mut self.classes[sub];
        let f = &self.classes[sup];
        to.methods.extend(&f.methods);
        self.stack.pop();
        Ok(())
    }
}`,
        why: 'The TypeScript shape. `self.classes[sub]` borrows the `Vec` mutably while `&self.classes[sup]` borrows it immutably: E0502.',
      },
      {
        code: `use std::collections::HashMap;

#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    Num(f64),
    Class(usize), // a handle
}

type Methods =
    HashMap<&'static str, usize>;

struct ClassObj {
    methods: Methods,
}

struct Vm {
    stack: Vec<Value>,
    // The class arena.
    classes: Vec<ClassObj>,
}

type Run = Result<(), String>;

const BAD: &str =
    "a class can only extend a class, \\
     not a number";

impl Vm {
    fn peek(&self, d: usize) -> Value {
        let n = self.stack.len();
        self.stack[n - 1 - d]
    }

    // method: add or overwrite.
    fn method(
        &mut self,
        c: usize,
        name: &'static str,
        f: usize,
    ) {
        let cl = &mut self.classes[c];
        cl.methods.insert(name, f);
    }

    // inherit: the superclass is at
    // peek(1), the subclass at peek(0).
    fn inherit(&mut self) -> Run {
        let Value::Class(sup) =
            self.peek(1)
        else {
            return Err(BAD.into());
        };
        let Value::Class(sub) =
            self.peek(0)
        else {
            unreachable!("not a class");
        };
        let f = &mut self.classes[sup];
        let ms = std::mem::take(
            &mut f.methods,
        );
        let to = &mut self.classes[sub];
        to.methods.extend(ms);
        self.stack.pop();
        Ok(())
    }
}`,
        why: 'Compiles, but moves the methods out of the superclass instead of copying them, so A is left with an empty table.',
      },
      {
        code: `use std::collections::HashMap;

#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    Num(f64),
    Class(usize), // a handle
}

type Methods =
    HashMap<&'static str, usize>;

struct ClassObj {
    methods: Methods,
}

struct Vm {
    stack: Vec<Value>,
    // The class arena.
    classes: Vec<ClassObj>,
}

type Run = Result<(), String>;

const BAD: &str =
    "a class can only extend a class, \\
     not a number";

impl Vm {
    fn peek(&self, d: usize) -> Value {
        let n = self.stack.len();
        self.stack[n - 1 - d]
    }

    // method: add or overwrite.
    fn method(
        &mut self,
        c: usize,
        name: &'static str,
        f: usize,
    ) {
        let cl = &mut self.classes[c];
        cl.methods.insert(name, f);
    }

    // inherit: the superclass is at
    // peek(1), the subclass at peek(0).
    fn inherit(&mut self) -> Run {
        let Value::Class(sup) =
            self.peek(1)
        else {
            panic!("not a class");
        };
        let Value::Class(sub) =
            self.peek(0)
        else {
            unreachable!("not a class");
        };
        let ms = self.classes[sup]
            .methods
            .clone();
        let to = &mut self.classes[sub];
        to.methods.extend(ms);
        self.stack.pop();
        Ok(())
    }
}`,
        why: 'A bad superclass is the program’s mistake, not the VM’s. It must be a runtime error the program reports, not a panic that crashes the VM.',
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
        why: 'Drip prints an instance with its fields.',
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
        t: '`undefined variable \'x\'`',
        why: 'That is for globals, not properties.',
      },
      {
        t: '`cannot set \'x\' on a number`',
        correct: true,
        why: '`set.prop` checks `peek(1)` first, and only instances have properties.',
      },
      {
        t: '`Number has no property \'x\'`',
        why: 'That form names a class, which a number does not have.',
      },
      {
        t: 'Nothing: the assignment is ignored',
        why: 'Drip never ignores a failed assignment; it is a runtime error, exit code 70.',
      },
    ],
  },
  {
    q: 'What does `let t = c.taste;` compile to, and what does it allocate?',
    options: [
      {
        t: '`invoke`, and nothing',
        why: '`invoke` is for `c.taste()`, a call straight away.',
      },
      {
        t: '`get.prop`, which allocates an `ObjBoundMethod` holding `c` and the `taste` closure',
        correct: true,
        why: '`c` has no field `taste`, so the arm finds the method and binds it.',
      },
      {
        t: '`get.prop`, which copies the closure into `t`',
        why: 'The closure alone would lose `c`; a bound method carries both.',
      },
      {
        t: '`load.global`, and a new closure',
        why: 'Reading a property is `get.prop`; closures are only made by `closure`.',
      },
    ],
  },
  {
    q: 'Why does the `get.prop` arm call `self.alloc(ObjBoundMethod { .. })` before `self.set_peek(0, ...)`?',
    options: [
      {
        t: '`set_peek` needs the handle that `alloc` returns, and until then the receiver must stay on the stack as a root',
        correct: true,
        why: 'If the allocation collects, the receiver on the stack survives; afterwards the bound method holds it.',
      },
      {
        t: '`alloc` pops the receiver itself',
        why: '`alloc` never touches the stack.',
      },
      {
        t: 'The order does not matter',
        why: 'It does: a receiver taken off the stack first could be freed by the collection.',
      },
      {
        t: 'Bound methods must be allocated before instances',
        why: 'Each kind of object has its own arena; there is no such rule.',
      },
    ],
  },
  {
    q: 'Why does `let ObjBoundMethod { receiver, method } = self.heap[bound];` compile, when `let b = self.heap[bound];` does not?',
    options: [
      {
        t: 'The pattern borrows the object',
        why: 'It copies the two fields; nothing stays borrowed.',
      },
      {
        t: '`ObjBoundMethod` is `Copy`',
        why: 'It is not, which is why the second line fails.',
      },
      {
        t: 'Indexing gives a place; the pattern copies each `Copy` field out, while binding the whole struct would move it out of the arena (E0507)',
        correct: true,
        why: '`Value` and `Gc<T>` are both `Copy`, so the fields can be copied and the object stays put.',
      },
      {
        t: 'The heap’s `Index` returns a clone',
        why: '`Index::index` returns a reference; nothing is cloned.',
      },
    ],
  },
  {
    q: 'What does `new Mug(1)` report when `Mug` has no `init`?',
    options: [
      {
        t: '`Mug() takes 0 arguments but got 1`',
        why: 'That form is for functions; a class without `init` has its own message.',
      },
      {
        t: '`cannot call a class: use \'new Mug(...)\'`',
        why: 'That is for calling a class without `new`.',
      },
      {
        t: 'Nothing: the argument is ignored',
        why: 'Drip reports it; arguments are never silently dropped.',
      },
      {
        t: '`Mug has no init, so it takes no arguments, but got 1`',
        correct: true,
        why: 'The `None if arg_count != 0` arm of `new_instance`.',
      },
    ],
  },
  {
    q: 'How does drip-rs make `new` always produce the instance, even when `init` ends with a bare `return;`?',
    options: [
      {
        t: 'The VM throws away whatever `init` returns',
        why: 'The VM does no such thing; the compiler makes `init` return the right value.',
      },
      {
        t: '`FunctionKind::Initializer` makes `emit_return` emit `load.local 0` before `return`, and slot 0 holds the instance',
        correct: true,
        why: 'And `return value;` in `init` is the static error `\'init\' cannot return a value`.',
      },
      {
        t: '`init` is a native function',
        why: 'It is an ordinary method compiled from Drip.',
      },
      {
        t: 'The instance is pushed again after the call',
        why: 'The call’s result replaces the callee’s slot; it is the instance because `init` returns slot 0.',
      },
    ],
  },
  {
    q: 'When does drip-rs copy a superclass’s methods into a subclass?',
    options: [
      {
        t: 'On every method lookup that misses in the subclass',
        why: 'That is walking the chain, which copy-down avoids.',
      },
      {
        t: 'Lazily, the first time a method is called',
        why: 'There is no cache to fill. The copy is complete before the class body runs.',
      },
      {
        t: 'Once, in `inherit`, when the class is declared',
        correct: true,
        why: 'Before the subclass’s own `method` instructions.',
      },
      {
        t: 'During garbage collection',
        why: 'The collector only marks and frees.',
      },
    ],
  },
  {
    q: 'What does rustc 1.97 report for `h[sub].methods.extend(from)` while `let from = &h[sup].methods;` is still in use?',
    options: [
      {
        t: 'E0502: a mutable borrow of `*h` while it is also borrowed as immutable',
        correct: true,
        why: 'Both index expressions borrow the whole heap.',
      },
      {
        t: 'Nothing: different handles are different borrows',
        why: 'The borrow checker does not know handle values; it sees two borrows of `h`.',
      },
      {
        t: 'A runtime panic when `sub == sup`',
        why: 'It never gets to run. The error is at compile time.',
      },
    ],
  },
  {
    q: 'Why is the `clone()` in the `Inherit` arm safe with respect to the garbage collector?',
    options: [
      {
        t: 'The collector is paused during inheritance',
        why: 'There is no pause flag. Nothing here could start a collection.',
      },
      {
        t: 'The copied table is registered as a root',
        why: 'It is never registered, and it does not need to be.',
      },
      {
        t: 'It allocates Rust memory, not a Drip object, so `Heap::alloc` never runs',
        correct: true,
        why: 'Collections only start inside the VM’s own allocation calls.',
      },
    ],
  },
  {
    q: '`class B extends A` overrides `hi`. Why does `new B().hi()` call B’s version?',
    options: [
      {
        t: '`invoke` searches the subclass before the superclass',
        why: 'It searches one table, B’s. There is no second one to search.',
      },
      {
        t: '`add_all` skips keys that already exist',
        why: 'It overwrites; and B’s table is empty when it runs.',
      },
      {
        t: 'B’s `method` instruction for `hi` runs after `inherit` and overwrites the copied entry',
        correct: true,
        why: 'Order is the whole mechanism.',
      },
    ],
  },
  {
    q: 'drip-rs’s compiler sets the flag with `self.classes.last_mut().expect("a class").has_superclass = true;`. Why not keep a `&mut ClassState` from the start, as TypeScript keeps `cc`?',
    options: [
      {
        t: '`Vec` has no `last_mut`',
        why: 'It does; that is what the line uses.',
      },
      {
        t: 'A `&mut` into `self.classes` could not live across the calls in between, which need `&mut self`',
        correct: true,
        why: 'Holding it would make every `self.emit…` call a second mutable borrow of `self`.',
      },
      {
        t: '`ClassState` is `Copy`',
        why: 'It is not, and copying it would not update the stack.',
      },
    ],
  },
];
