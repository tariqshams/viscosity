// Chapter 276 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'bm-fields': {
    q: 'What two fields does drip-rs’s `ObjBoundMethod` have, and what are their types?',
    a: '`receiver: Value` and `method: Gc<ObjClosure>`.',
  },
  'bm-receiver-root': {
    q: 'Why does `bind_method` pop the receiver only after allocating the bound method?',
    a: '`alloc` may start a collection. While the receiver is on the stack it is a root, so it can’t be freed before the bound method holds it.',
  },
  'bm-as-closure': {
    q: 'What does `as_closure(method)` do in `bind_method`, and what did TypeScript write instead?',
    a: 'It opens the `Value::Closure` from the methods table with a `match`, and calls `unreachable!` for anything else. TypeScript wrote the unchecked cast `method as ObjClosure`.',
  },
  'bm-destructure': {
    q: 'Why does `let ObjBoundMethod { receiver, method } = self.heap[bound];` compile when `let b = self.heap[bound];` does not?',
    a: 'Indexing gives a place. The pattern copies each field, which is fine because `Value` and `Gc` are `Copy`. Binding the whole struct would move it out of the arena: E0507.',
  },
  'bm-slot0': {
    q: 'What does calling a bound method do with its receiver?',
    a: 'Writes it over the callee’s stack slot with `set_peek(arg_count, receiver)`. That slot becomes the method’s slot 0, which is `this`.',
  },
  'init-string': {
    q: 'Where does the VM’s `init_string` come from, and why must the collector know about it?',
    a: 'It is `"init"`, interned once in `Vm::new`. It is in `VmRoots`, because a string nothing marks would be freed and the lookups would break.',
  },
  'init-match': {
    q: 'Calling a class: what are the three arms of the `match` on `methods.get(self.init_string)`?',
    a: '`Some(init)`: call it. `None if arg_count != 0`: “Expected 0 arguments but got N.”. `None`: done, the instance is the result.',
  },
  'init-kind': {
    q: 'How does drip-rs make every return from `init` produce the instance?',
    a: '`method()` gives `init` the kind `FunctionKind::Initializer`, and `emit_return` then emits `GetLocal 0` instead of `Nil` before `Return`.',
  },
  'invoke-alloc': {
    q: 'How many bound methods does `c.taste()` allocate in drip-rs?',
    a: 'None. It compiles to `Invoke`, which calls the method with the receiver already in slot 0.',
  },
};

export const examples = {
  cup: {
    title: 'A bound method keeps its receiver, and init returns this',
    lang: 'drip-vm',
    code: `class Cup {
  init(n) { this.n = n; }
  sip() { print this.n; }
}
let s = Cup("tea").sip;
s();
let c = Cup("milk");
print c.init("oat") == c;
print c.n;
print s;`,
  },
};

const head = `#[derive(Clone, Copy, Debug, PartialEq)]
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

const NOT_CALLABLE: &str = concat!(
    "Can only call functions ",
    "and classes.",
);

impl Vm {
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
            Value::Class(c) => {
                self.call_class(c, argc)
            }
            Value::Closure(f) => {
                self.call(f, argc)
            }
            _ => {
                Err(NOT_CALLABLE.into())
            }
        }
    }
`;

const boundSig = `
    fn call_bound(
        &mut self,
        b: usize,
        argc: usize,
    ) -> Run {`;

const classSig = `
    fn call_class(
        &mut self,
        c: usize,
        argc: usize,
    ) -> Run {`;

const boundBody = `
        let BoundObj {
            receiver,
            method,
        } = self.bounds[b];
        self.set_peek(argc, receiver);
        self.call(method, argc)
    }
`;

const classBody = `
        self.instances.push(c);
        let n = self.instances.len();
        let i = Value::Instance(n - 1);
        self.set_peek(argc, i);
        match self.classes[c].init {
            Some(f) => {
                self.call(f, argc)
            }
            None if argc != 0 => {
                Err(format!(
                    "Expected 0 \\
                     arguments \\
                     but got {argc}."))
            }
            None => Ok(()),
        }
    }
}`;

const starter = `${head}${boundSig}
        todo!()
    }
${classSig}
        todo!()
    }
}`;

const solution = `${head}${boundSig}${boundBody}${classSig}${classBody}`;

export const exercises = {
  callValue: {
    lang: 'rust',
    title: 'Calling bound methods and classes',
    prompt: `This small VM is shaped like drip-rs: values are a \`Copy\` enum of handles, and objects live in \`Vec\`s. \`call(f, argc)\` records a call and its slot 0, and \`call_value\` is written. Write its two helpers:

- **\`call_bound(b, argc)\`**: copy the receiver and method out of \`self.bounds[b]\`, write the receiver over the callee's slot (\`set_peek(argc, ..)\`), and call the method.
- **\`call_class(c, argc)\`**: push \`c\` onto \`instances\` (the new instance's index is the last one), and write \`Instance(index)\` over the callee's slot. Then call \`init\` if the class has one; else, with arguments, return \`Err("Expected 0 arguments but got N.")\`; else return \`Ok(())\`.

\`BoundObj\` is deliberately not \`Copy\`, like drip-rs's \`ObjBoundMethod\`.`,
    starter,
    solution,
    tests: `use Value::*;

// Class 0 has init (closure 5), class 1
// has none. Instance 0 already exists.
fn vm() -> Vm {
    Vm {
        stack: Vec::new(),
        bounds: Vec::new(),
        classes: vec![
            ClassObj { init: Some(5) },
            ClassObj { init: None },
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
fn a_class_with_init_calls_it_on_a_new_instance() {
    let mut v = vm();
    v.stack = vec![Class(0), Num(1.0),
        Num(2.0)];
    v.call_value(Class(0), 2).unwrap();
    assert_eq!(v.instances, [0, 0]);
    assert_eq!(v.stack[0], Instance(1));
    assert_eq!(v.stack.len(), 3);
    assert_eq!(v.calls, [(5, 0)]);
}

#[test]
fn a_class_without_init_just_makes_an_instance() {
    let mut v = vm();
    v.stack = vec![Num(0.0), Class(1)];
    v.call_value(Class(1), 0).unwrap();
    assert_eq!(v.stack,
        [Num(0.0), Instance(1)]);
    assert_eq!(v.instances, [0, 1]);
    assert!(v.calls.is_empty());
}

#[test]
fn arguments_without_init_are_an_error() {
    let mut v = vm();
    v.stack = vec![Class(1), Num(1.0)];
    let e = v.call_value(Class(1), 1);
    let m = "Expected 0 arguments but got 1.";
    assert_eq!(e, Err(m.to_string()));
}

#[test]
fn closures_and_numbers_still_work() {
    let mut v = vm();
    v.stack = vec![Closure(3)];
    v.call_value(Closure(3), 0).unwrap();
    assert_eq!(v.calls, [(3, 0)]);
    let e = v.call_value(Num(1.0), 0);
    assert_eq!(e, Err(NOT_CALLABLE.into()));
}`,
    hints: [
      'In `call_bound`, `let bm = self.bounds[b];` is a move out of a `Vec` and won’t compile. Destructure instead: `let BoundObj { receiver, method } = self.bounds[b];` copies the two `Copy` fields.',
      'Then `self.set_peek(argc, receiver);` and `self.call(method, argc)`.',
      'In `call_class`, write the instance over the slot first, then `match self.classes[c].init` with three arms: `Some(f) => ...`, `None if argc != 0 => Err(...)`, and `None => Ok(())`.',
    ],
    walkthrough: `**Copy the fields, not the object.** \`self.bounds[b]\` is a place inside the \`Vec\`. \`let bm = self.bounds[b];\` would move the whole \`BoundObj\` out and leave a hole, so rustc rejects it (E0507). The pattern \`let BoundObj { receiver, method } = self.bounds[b];\` binds each field by value instead, and since \`Value\` and \`usize\` are \`Copy\`, each is copied. This is drip-rs's line exactly.

**The callee's slot becomes slot 0.** \`set_peek(argc, receiver)\` overwrites the bound method with its receiver. \`call\` then records \`stack.len() - argc - 1\`, that same slot, as the frame's base. So the method's \`this\` is the receiver. A class call does the same with the new instance.

**Three cases, one \`match\`.** Look for \`init\` first. Only when there is none do arguments become an error, so \`Some(f)\` comes before the guarded \`None\` arm, and the guard is what separates the error from the plain \`None\`.

**No push.** The instance replaces the class; it isn't pushed on top. With no \`init\`, the instance is left right where the call's result belongs.`,
    wrong: [
      {
        code: `${head}${boundSig}
        let bm = self.bounds[b];
        let r = bm.receiver;
        self.set_peek(argc, r);
        self.call(bm.method, argc)
    }
${classSig}${classBody}`,
        why: '`let bm = self.bounds[b];` tries to move a `BoundObj` out of the `Vec`. It isn’t `Copy`, so this is E0507. Destructure the two fields instead.',
      },
      {
        code: `${head}${boundSig}${boundBody}${classSig}
        if argc != 0 {
            return Err(format!(
                "Expected 0 arguments \\
                 but got {argc}."));
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
        why: 'Checks the argument count before looking for `init`, so `Cake("lemon")` fails even though `init(f)` takes one argument. The error belongs only to classes without `init`.',
      },
      {
        code: `${head}${boundSig}
        let BoundObj {
            receiver,
            method,
        } = self.bounds[b];
        self.stack.push(receiver);
        self.call(method, argc)
    }
${classSig}
        self.instances.push(c);
        let n = self.instances.len();
        let i = Value::Instance(n - 1);
        self.stack.push(i);
        match self.classes[c].init {
            Some(f) => {
                self.call(f, argc)
            }
            None if argc != 0 => {
                Err(format!(
                    "Expected 0 \\
                     arguments \\
                     but got {argc}."))
            }
            None => Ok(()),
        }
    }
}`,
        why: 'Pushes the receiver or instance instead of writing it over the callee’s slot. The stack grows by one, the frame’s slot 0 still holds the bound method or class, and `this` is wrong.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does drip-rs store in an `ObjBoundMethod`?',
    options: [
      { t: 'A copy of the instance and a copy of the closure', why: 'Objects are never copied into each other. It holds a `Value` and a handle.' },
      { t: 'A `receiver: Value` and a `method: Gc<ObjClosure>`', correct: true, why: 'Two `Copy` fields: a tagged value and a 4-byte arena index.' },
      { t: 'An `Rc<ObjInstance>` and an `Rc<ObjClosure>`', why: 'drip-rs’s objects live in arenas managed by its own collector, not behind `Rc`.' },
      { t: 'The method’s name, to look up again at call time', why: 'The method was already found by `bind_method`; it stores the closure handle.' },
    ],
  },
  {
    q: 'In `bind_method`, why is `self.pop()` called after `self.alloc(...)` and not before?',
    options: [
      { t: 'So the receiver is on the stack, a GC root, if the allocation runs a collection', correct: true, why: 'Popping first would leave the instance reachable from nowhere during the collection.' },
      { t: '`pop` would invalidate the handle returned by `alloc`', why: 'Handles are indices; popping the stack doesn’t touch the arena.' },
      { t: 'The borrow checker requires it', why: 'Either order compiles. The order is about the collector, which the compiler can’t see.' },
      { t: 'To keep the stack the same length as in TypeScript', why: 'The final stack is the same in either order. Only the collector cares.' },
    ],
  },
  {
    q: '`let b = self.heap[bound];` fails with E0507. Which line does drip-rs use instead?',
    options: [
      { t: '`let b = self.heap[bound].clone();`', why: '`ObjBoundMethod` doesn’t implement `Clone`, and copying the whole object isn’t needed.' },
      { t: '`let b = &mut self.heap[bound];`', why: 'That borrow would conflict with the `&mut self` calls that follow.' },
      { t: '`let b = std::mem::take(&mut self.heap[bound]);`', why: 'That would empty the object while the handle may still be in use, and the type has no `Default`.' },
      { t: '`let ObjBoundMethod { receiver, method } = self.heap[bound];`', correct: true, why: 'The pattern copies the two `Copy` fields and leaves the object where it is.' },
    ],
  },
  {
    q: 'A program calls `Point(1, 2)` and `Point` has no `init`. What happens?',
    options: [
      { t: 'The instance is created and the arguments are ignored', why: 'That would hide a bug. The `None if arg_count != 0` arm reports it.' },
      { t: 'A compile error', why: 'The compiler doesn’t know what `Point` will be at run time.' },
      { t: 'Runtime error “Expected 0 arguments but got 2.”, exit code 70', correct: true, why: 'The guarded `None` arm. Both VMs print the same message and trace.' },
      { t: 'It calls the superclass’s `init`', why: 'Point has no superclass here, and copied-down methods would already be in its table.' },
    ],
  },
  {
    q: 'Why does `emit_return` start with `if self.state().kind == FunctionKind::Initializer` and still compile, even though it then calls `self.emit_op_with(...)`?',
    options: [
      { t: '`state()` returns a shared reference', why: 'It returns `&mut FunctionState`. What matters is how long it is used.' },
      { t: 'The comparison reads a `Copy` value and the borrow ends before `emit_op_with` borrows `self` again', correct: true, why: 'Chapter 270’s habit: read what you need, then emit.' },
      { t: 'Because `emit_op_with` takes `&self`', why: 'It pushes bytes, so it takes `&mut self`.' },
      { t: 'The compiler state is cloned on every call to `state()`', why: 'Nothing is cloned; it is a borrow of the last `FunctionState`.' },
    ],
  },
  {
    q: 'Which source compiles to an instruction that allocates a bound method?',
    options: [
      { t: '`c.taste();`', why: 'That is `Invoke`: no bound method.' },
      { t: '`let t = c.taste;`', correct: true, why: '`GetProperty` finds no field and calls `bind_method`.' },
      { t: '`Cake("lemon");`', why: 'That allocates an instance and calls `init` directly.' },
      { t: '`this.f = f;`', why: 'A field write: `SetProperty`.' },
    ],
  },
];
