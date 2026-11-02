// Chapter 250 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'cd-what': {
    q: 'What does `OP_INHERIT` do to the subclass?',
    a: 'Copies every entry of the superclass’s methods table into the subclass’s methods table, then pops the subclass.',
  },
  'cd-e0502': {
    q: 'Why can’t drip-rs write `self.heap[sub].methods.add_all(&self.heap[sup].methods)`?',
    a: 'Both index expressions borrow the whole heap. A mutable borrow while a shared one is alive is E0502; the compiler can’t know the two handles differ.',
  },
  'cd-clone': {
    q: 'How does drip-rs’s `Inherit` arm get around that borrow conflict?',
    a: 'It clones the superclass’s `Table` into a local first, so the shared borrow ends, then calls `add_all(&methods)` on the subclass.',
  },
  'cd-no-gc': {
    q: 'Why can’t the `clone()` in `Inherit` trigger a garbage collection?',
    a: 'It allocates ordinary Rust memory (two `Vec`s), not a Drip object, so it never goes through `Heap::alloc`.',
  },
  'cd-order': {
    q: 'Why does an overriding method win over the copied one?',
    a: '`OP_INHERIT` runs before the subclass’s `OP_METHOD`s, so the subclass’s own method overwrites the copied entry.',
  },
  'cd-check': {
    q: 'What does `Inherit` check at run time, and how does it treat the subclass?',
    a: 'That `peek(1)` is a `Value::Class`, else “Superclass must be a class.”. The subclass is opened with `as_class`, which is `unreachable!` for anything else.',
  },
  'sup-classes': {
    q: 'How does drip-rs’s compiler track the class it is inside, and what did the TypeScript compiler use?',
    a: 'A `Vec<ClassState>` used as a stack, each with `has_superclass`. TypeScript linked `ClassCompiler`s with an `enclosing` field.',
  },
  'sup-synthetic': {
    q: 'Why can `add_local("super")` store a string literal where a `&\'src str` is expected?',
    a: 'A literal is `&\'static str`, and `\'static` outlives `\'src`, so it coerces.',
  },
  'sup-runtime': {
    q: 'What does `OP_GET_SUPER` do in drip-rs?',
    a: 'Pops the superclass and calls `bind_method(superclass, name)`, with `this` on top of the stack as the receiver.',
  },
};

export const examples = {
  reassign: {
    title: 'super is fixed when the class is declared',
    lang: 'drip-vm',
    code: `class Base {
  m() { print "Base.m"; }
}
class Derived < Base {
  m() { super.m(); }
}
class Other {
  m() { print "Other.m"; }
}
let d = Derived();
d.m();
Base = Other;
d.m();
let g = Derived().m;
g();`,
  },
};

const head = `use std::collections::HashMap;

#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    Num(f64),
    Class(usize),
}

type Methods =
    HashMap<&'static str, usize>;

struct ClassObj {
    methods: Methods,
}

struct Vm {
    stack: Vec<Value>,
    classes: Vec<ClassObj>,
}

type Run = Result<(), String>;

const BAD_SUPER: &str =
    "Superclass must be a class.";

impl Vm {
    fn peek(&self, d: usize) -> Value {
        let n = self.stack.len();
        self.stack[n - 1 - d]
    }

    // OP_METHOD: add or overwrite.
    fn method(
        &mut self,
        c: usize,
        name: &'static str,
        f: usize,
    ) {
        let cl = &mut self.classes[c];
        cl.methods.insert(name, f);
    }

    // OP_INHERIT: the superclass is at
    // peek(1), the subclass at peek(0).
    fn inherit(&mut self) -> Run {`;

const check = `
        let sup = self.peek(1);
        let Value::Class(sup) = sup
        else {
            return Err(
                BAD_SUPER.into());
        };
        let sub = self.peek(0);
        let Value::Class(sub) = sub
        else {
            unreachable!("not a class");
        };`;

const solution = `${head}${check}
        let ms = self.classes[sup]
            .methods
            .clone();
        let to = &mut self.classes[sub];
        to.methods.extend(ms);
        self.stack.pop();
        Ok(())
    }
}`;

export const exercises = {
  inherit: {
    lang: 'rust',
    title: 'OP_INHERIT',
    prompt: `Write \`inherit\`, this small VM's \`OP_INHERIT\`. The classes live in one \`Vec\`, as drip-rs's live in one arena.

1. The superclass is \`peek(1)\`. If it isn't a \`Value::Class\`, return \`Err("Superclass must be a class.")\`.
2. The subclass is \`peek(0)\` (always a class).
3. Copy every method of the superclass into the subclass. The superclass must keep its own.
4. Pop the subclass.

The TypeScript one-liner, writing \`self.classes[sub]\` while borrowing \`self.classes[sup]\`, won't compile.`,
    starter: `${head}
        todo!()
    }
}`,
    solution,
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
    let m = "Superclass must be a class.";
    assert_eq!(v.inherit(), Err(m.into()));
    assert_eq!(m, BAD_SUPER);
}`,
    hints: [
      'Open the superclass with `let Value::Class(sup) = self.peek(1) else { return Err(...); };`, and the subclass the same way with `unreachable!` in the `else`.',
      '`self.classes[sub].methods.extend(&self.classes[sup].methods)` is E0502: both indexes borrow the whole `Vec`. End the shared borrow first.',
      '`let ms = self.classes[sup].methods.clone();` then `self.classes[sub].methods.extend(ms);` and `self.stack.pop();`.',
    ],
    walkthrough: `**One \`Vec\`, one borrow at a time.** \`self.classes[sub]\` calls \`IndexMut\` on the whole \`Vec\`, and \`self.classes[sup]\` calls \`Index\` on it too. Rust can't see that \`sub != sup\`, so a write through one while a reference from the other is alive is E0502. That is drip-rs's problem exactly, with the heap in place of the \`Vec\`.

**Clone, then write.** \`let ms = self.classes[sup].methods.clone();\` makes an owned copy, and the shared borrow ends at the semicolon. \`extend(ms)\` then moves the copied entries into the subclass's table. drip-rs does the same with \`Table::clone\` and \`add_all\`.

**Copy, don't move.** Taking the superclass's table with \`std::mem::take\` would also dodge the borrow checker, but it would leave \`A\` with no methods, and \`A().hi()\` would fail. And because it is a copy, a method added to \`A\` later is not seen by \`B\`. Drip can't add methods to a declared class, which is why copy-down is safe.

**Check the superclass, trust the subclass.** A program can put any value after \`<\`, so that is a runtime error with drip-rs's exact message. The subclass was made by the compiler a few instructions earlier, so drip-rs treats anything else as a bug in the VM: \`unreachable!\`.`,
    wrong: [
      {
        code: `${head}${check}
        let to = &mut self.classes[sub];
        let f = &self.classes[sup];
        to.methods.extend(&f.methods);
        self.stack.pop();
        Ok(())
    }
}`,
        why: 'The TypeScript shape. `self.classes[sub]` borrows the `Vec` mutably while `&self.classes[sup].methods` borrows it immutably: E0502.',
      },
      {
        code: `${head}${check}
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
        why: 'Compiles, but moves the methods out of the superclass instead of copying them. `A` is left with an empty table.',
      },
      {
        code: `${head}
        let sup = self.peek(1);
        let Value::Class(sup) = sup
        else {
            panic!("not a class");
        };
        let sub = self.peek(0);
        let Value::Class(sub) = sub
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
    q: 'When does drip-rs copy a superclass’s methods into a subclass?',
    options: [
      { t: 'On every method lookup that misses in the subclass', why: 'That is walking the chain, which copy-down avoids.' },
      { t: 'Lazily, the first time a method is called', why: 'There is no cache to fill. The copy is complete before the class body runs.' },
      { t: 'Once, in `OP_INHERIT`, when the class is declared', correct: true, why: 'Before the subclass’s own `OP_METHOD`s.' },
      { t: 'During garbage collection', why: 'The collector only marks and frees.' },
    ],
  },
  {
    q: 'What does rustc 1.97 report for `h[sub].methods.extend(...)` while `let from = &h[sup].methods;` is still used?',
    options: [
      { t: 'E0502: a mutable borrow of `*h` while it is also borrowed as immutable', correct: true, why: 'Both index expressions borrow the whole heap.' },
      { t: 'E0507: cannot move out of index', why: 'Nothing is moved. That is the error from chapter 249’s `let b = self.heap[bound];`.' },
      { t: 'Nothing: different handles are different borrows', why: 'The borrow checker doesn’t know handle values; it sees two borrows of `h`.' },
      { t: 'A runtime panic when `sub == sup`', why: 'It never gets to run. The error is at compile time.' },
    ],
  },
  {
    q: 'Why is the `clone()` in the `Inherit` arm safe with respect to the garbage collector?',
    options: [
      { t: 'The collector is paused during inheritance', why: 'There is no pause flag. Nothing here could start a collection.' },
      { t: 'The copied table is a GC root', why: 'It is never registered as one, and it doesn’t need to be.' },
      { t: 'Both classes are on the stack', why: 'True, but that isn’t the reason. Even if they weren’t, nothing allocates a Drip object here.' },
      { t: 'It allocates Rust memory, not a Drip object, so `Heap::alloc` never runs', correct: true, why: 'Collections only start inside the VM’s own allocation calls.' },
    ],
  },
  {
    q: '`class B < A` overrides `hi`. Why does `B().hi()` call B’s version?',
    options: [
      { t: '`Invoke` searches the subclass before the superclass', why: 'It searches one table: B’s. There is no second one to search.' },
      { t: 'B’s `OP_METHOD` for `hi` runs after `OP_INHERIT` and overwrites the copied entry', correct: true, why: 'Order is the whole mechanism.' },
      { t: '`add_all` skips keys that already exist', why: 'It overwrites; and B’s table is empty when it runs.' },
      { t: 'The compiler renames A’s `hi`', why: 'Names are never changed.' },
    ],
  },
  {
    q: 'drip-rs’s compiler sets `has_superclass` with `self.classes.last_mut().expect("in a class").has_superclass = true;`. Why not keep a `&mut ClassState` from the start, as TypeScript keeps `cc`?',
    options: [
      { t: 'A `&mut` into `self.classes` couldn’t live across the calls that need `&mut self` in between', correct: true, why: 'The same reason `end_scope` re-borrows in chapter 243.' },
      { t: '`ClassState` is `Copy`', why: 'It isn’t, and copying it wouldn’t update the stack.' },
      { t: '`Vec` doesn’t have `last_mut`', why: 'It does; that is what the line uses.' },
      { t: 'To support classes nested inside functions', why: 'The `Vec` supports nesting either way.' },
    ],
  },
  {
    q: 'In the reassign example, `Base = Other;` and then `d.m()` still prints `Base.m`. Why?',
    options: [
      { t: 'Globals can’t be reassigned', why: 'They can; `Base` now names `Other`.' },
      { t: 'The bound method was cached', why: 'Nothing is cached. `d.m()` is a fresh `Invoke`.' },
      { t: '`super` is a local captured when `Derived` was declared, and it still holds the old class', correct: true, why: 'Methods reach `super` through an upvalue, not the global name.' },
      { t: 'Copy-down copied `Base.m` into `Other`', why: 'Copy-down copies into the subclass, `Derived`, and never touches `Other`.' },
    ],
  },
];
