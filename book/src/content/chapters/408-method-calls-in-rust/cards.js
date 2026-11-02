// Chapter 408 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
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
};

export const examples = {
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
};

export const exercises = {
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
};

export const quiz = [
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
        t: `\`cannot call a class: use 'new Mug(...)'\``,
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
        why: `And \`return value;\` in \`init\` is the static error \`'init' cannot return a value\`.`,
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
];
