// Chapter 350 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
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

const head = `use std::collections::HashMap;

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
    fn inherit(&mut self) -> Run {`;

const check = `
        let Value::Class(sup) =
            self.peek(1)
        else {
            return Err(BAD.into());
        };
        let Value::Class(sub) =
            self.peek(0)
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
    title: 'The inherit instruction',
    prompt: `Write \`inherit\`, this small VM's version of drip-rs's \`inherit\` instruction. The classes live in one \`Vec\`, as drip-rs's live in one arena, and a \`Value::Class\` holds an index into it.

1. The superclass is \`peek(1)\`. If it isn't a \`Value::Class\`, return \`Err\` with the message in \`BAD\` (the only non-class value here is a number).
2. The subclass is \`peek(0)\`; it is always a class.
3. Copy every method of the superclass into the subclass. The superclass must keep its own.
4. Pop the subclass.

The TypeScript one-liner, writing \`self.classes[sub]\` while borrowing \`self.classes[sup]\`, will not compile.`,
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
        code: `${head}${check}
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
        why: 'Compiles, but moves the methods out of the superclass instead of copying them, so A is left with an empty table.',
      },
      {
        code: `${head}
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
    q: 'When does drip-rs copy a superclass’s methods into a subclass?',
    options: [
      { t: 'On every method lookup that misses in the subclass', why: 'That is walking the chain, which copy-down avoids.' },
      { t: 'Lazily, the first time a method is called', why: 'There is no cache to fill. The copy is complete before the class body runs.' },
      { t: 'Once, in `inherit`, when the class is declared', correct: true, why: 'Before the subclass’s own `method` instructions.' },
      { t: 'During garbage collection', why: 'The collector only marks and frees.' },
    ],
  },
  {
    q: 'What does rustc 1.97 report for `h[sub].methods.extend(from)` while `let from = &h[sup].methods;` is still in use?',
    options: [
      { t: 'E0502: a mutable borrow of `*h` while it is also borrowed as immutable', correct: true, why: 'Both index expressions borrow the whole heap.' },
      { t: 'Nothing: different handles are different borrows', why: 'The borrow checker does not know handle values; it sees two borrows of `h`.' },
      { t: 'A runtime panic when `sub == sup`', why: 'It never gets to run. The error is at compile time.' },
    ],
  },
  {
    q: 'Why is the `clone()` in the `Inherit` arm safe with respect to the garbage collector?',
    options: [
      { t: 'The collector is paused during inheritance', why: 'There is no pause flag. Nothing here could start a collection.' },
      { t: 'The copied table is registered as a root', why: 'It is never registered, and it does not need to be.' },
      { t: 'It allocates Rust memory, not a Drip object, so `Heap::alloc` never runs', correct: true, why: 'Collections only start inside the VM’s own allocation calls.' },
    ],
  },
  {
    q: '`class B extends A` overrides `hi`. Why does `new B().hi()` call B’s version?',
    options: [
      { t: '`invoke` searches the subclass before the superclass', why: 'It searches one table, B’s. There is no second one to search.' },
      { t: '`add_all` skips keys that already exist', why: 'It overwrites; and B’s table is empty when it runs.' },
      { t: 'B’s `method` instruction for `hi` runs after `inherit` and overwrites the copied entry', correct: true, why: 'Order is the whole mechanism.' },
    ],
  },
  {
    q: 'drip-rs’s compiler sets the flag with `self.classes.last_mut().expect("a class").has_superclass = true;`. Why not keep a `&mut ClassState` from the start, as TypeScript keeps `cc`?',
    options: [
      { t: '`Vec` has no `last_mut`', why: 'It does; that is what the line uses.' },
      { t: 'A `&mut` into `self.classes` could not live across the calls in between, which need `&mut self`', correct: true, why: 'Holding it would make every `self.emit…` call a second mutable borrow of `self`.' },
      { t: '`ClassState` is `Copy`', why: 'It is not, and copying it would not update the stack.' },
    ],
  },
];
