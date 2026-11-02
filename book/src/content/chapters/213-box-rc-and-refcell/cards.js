// Chapter 213 cards. Keys are stable ids: never rename them.

const UP = `use std::cell::RefCell;
use std::rc::Rc;

// One captured variable, shared.
type Up = Rc<RefCell<f64>>;

struct Closure {
    up: Up,
}
`;

const EXPR = `enum Expr {
    Num(f64),
    Add(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
}
`;

export const prompts = {
  'box-what': {
    q: 'What is a `Box<T>`?',
    a: 'A pointer to a `T` on the heap, with exactly one owner. When the box is dropped, so is the `T`.',
  },
  'box-recursive': {
    q: 'Why does `enum Expr { Num(f64), Add(Expr, Expr) }` fail to compile, and how does `Box` fix it?',
    a: 'An `Expr` would contain two `Expr`s, so its size would be infinite (E0072). `Box<Expr>` is one pointer of fixed size.',
  },
  'rc-what': {
    q: 'What does `Rc::clone(&r)` copy?',
    a: 'Only the pointer. It adds 1 to the strong count; the value is not copied, and is dropped when the count falls to 0.',
  },
  'rc-immutable': {
    q: 'Why can’t you assign to a field through an `Rc<T>`?',
    a: 'An `Rc` hands out only shared access (`&T`): other owners may be reading. Mutating needs a `RefCell` (or `Cell`) inside.',
  },
  'refcell-what': {
    q: 'What does `RefCell<T>` check, and when?',
    a: 'The borrowing rules (many readers or one writer), at run time, each time you call `borrow` or `borrow_mut`.',
  },
  'refcell-panic': {
    q: 'What happens if you call `borrow()` on a `RefCell` while a `borrow_mut()` of it is still alive?',
    a: 'The program panics: “RefCell already mutably borrowed”.',
  },
  'refcell-vm': {
    q: 'Why is a `RefCell` double borrow a real risk in a VM built from `Rc<RefCell<..>>`?',
    a: 'The program decides which objects alias. Drip code like `a.heal(a)` makes the same object both sides of an operation, so a held borrow meets another at run time.',
  },
  'cycle-leak': {
    q: 'Two objects behind `Rc` point at each other, and nothing else points at them. What happens?',
    a: 'Each strong count stays at 1, so neither is ever dropped: the memory leaks.',
  },
  'weak-what': {
    q: 'What is `Weak` for, and why doesn’t it solve the VM’s problem?',
    a: 'A pointer that doesn’t own, used for back edges such as child-to-parent. A Drip program can make any edge a cycle, so the VM can’t know which ones to weaken.',
  },
  'drip-rc': {
    q: 'Where does drip-rs use `Rc`, and why is it safe there?',
    a: 'For each compiled `Chunk`, shared by the function object and the VM. A chunk is frozen and never points back at an `Rc`, so there is no mutation and no cycle.',
  },
};

export const examples = {
  'rc-share': {
    lang: 'rust',
    title: 'Two closures, one upvalue',
    code: `use std::cell::RefCell;
use std::rc::Rc;

// A captured variable, shared by
// two closures (chapter 84).
struct Upvalue {
    value: f64,
}

struct Closure {
    name: &'static str,
    up: Rc<RefCell<Upvalue>>,
}

fn main() {
    let up = Rc::new(RefCell::new(
        Upvalue { value: 0.0 },
    ));
    let inc = Closure {
        name: "inc",
        up: Rc::clone(&up),
    };
    let get = Closure {
        name: "get",
        up: Rc::clone(&up),
    };
    println!("owners: {}",
        Rc::strong_count(&up));
    inc.up.borrow_mut().value += 1.0;
    inc.up.borrow_mut().value += 1.0;
    let v = get.up.borrow().value;
    println!("{} sees {}", get.name, v);
    drop(inc);
    drop(get);
    println!("owners: {}",
        Rc::strong_count(&up));
}`,
  },
};

export const exercises = {
  sharedUpvalue: {
    lang: 'rust',
    title: 'Capture, don’t copy',
    prompt:
      'A closure captures a variable by sharing it (chapter 84): two closures that capture the same variable see each other’s changes. Write `capture`, which makes a `Closure` that shares `up`, and the methods `bump` (add 1 to the variable) and `read`.',
    starter: `${UP}
// Share \`up\`; don't copy it.
fn capture(up: &Up) -> Closure {
    todo!()
}

impl Closure {
    // Add 1 to the captured variable.
    fn bump(&self) {
        todo!()
    }

    fn read(&self) -> f64 {
        todo!()
    }
}`,
    solution: `${UP}
// Share \`up\`; don't copy it.
fn capture(up: &Up) -> Closure {
    Closure { up: Rc::clone(up) }
}

impl Closure {
    // Add 1 to the captured variable.
    fn bump(&self) {
        *self.up.borrow_mut() += 1.0;
    }

    fn read(&self) -> f64 {
        *self.up.borrow()
    }
}`,
    tests: `#[test]
fn one_closure_counts() {
    let up = Rc::new(RefCell::new(0.0));
    let c = capture(&up);
    c.bump();
    c.bump();
    assert_eq!(c.read(), 2.0);
}

#[test]
fn two_closures_share_one_variable() {
    let up = Rc::new(RefCell::new(10.0));
    let inc = capture(&up);
    let get = capture(&up);
    inc.bump();
    assert_eq!(get.read(), 11.0);
    assert_eq!(*up.borrow(), 11.0);
}

#[test]
fn each_capture_is_an_owner() {
    let up = Rc::new(RefCell::new(0.0));
    let a = capture(&up);
    let b = capture(&up);
    assert_eq!(Rc::strong_count(&up), 3);
    drop(a);
    drop(b);
    assert_eq!(Rc::strong_count(&up), 1);
}`,
    hints: [
      'Sharing an `Rc` means making another pointer to the same allocation: `Rc::clone(up)`.',
      '`self.up.borrow_mut()` gives a guard you can write through with `*`: `*guard += 1.0`.',
      '`read` borrows for reading and copies the `f64` out: `*self.up.borrow()`.',
    ],
    walkthrough: `Three small pieces, each one of the chapter’s tools.

- **\`capture\`** must not make a new variable. \`Rc::clone(up)\` gives a second pointer to the *same* \`RefCell<f64>\` and raises the strong count, which is exactly what the third test checks: the original plus two closures make 3 owners, and dropping the closures brings it back to 1.
- **\`bump\`** takes \`&self\`, not \`&mut self\`: other closures share the variable, so nobody has unique access. \`borrow_mut()\` checks at run time that no one else is borrowing, and hands back a guard. \`*guard += 1.0\` writes through it. The guard is a temporary, so the borrow ends at the semicolon.
- **\`read\`** takes a shared borrow and copies the number out. Returning the \`f64\` (not a reference) means no borrow outlives the call.

This is how a TypeScript closure behaves for free. In Rust you had to say “shared” (\`Rc\`) and “mutable through sharing” (\`RefCell\`) out loud.`,
    wrong: [
      {
        code: `${UP}
fn capture(up: &Up) -> Closure {
    let v = *up.borrow();
    Closure {
        up: Rc::new(RefCell::new(v)),
    }
}

impl Closure {
    fn bump(&self) {
        *self.up.borrow_mut() += 1.0;
    }

    fn read(&self) -> f64 {
        *self.up.borrow()
    }
}`,
        why: 'This captures by copying: each closure gets its own new `RefCell` holding the current value. `inc.bump()` then changes only `inc`’s copy, and `get` still sees 10.',
      },
      {
        code: `${UP}
fn capture(up: &Up) -> Closure {
    Closure { up: Rc::clone(up) }
}

impl Closure {
    fn bump(&self) {
        let mut v = *self.up.borrow();
        v += 1.0;
    }

    fn read(&self) -> f64 {
        *self.up.borrow()
    }
}`,
        why: '`*self.up.borrow()` copies the `f64` into a local `v`, and the addition changes only that local. Write through a `borrow_mut()` guard instead.',
      },
    ],
  },
  boxExpr: {
    lang: 'rust',
    optional: true,
    title: 'A boxed expression tree',
    prompt:
      'A syntax tree (chapter 42) is the shape `Box` was made for: each node has one parent. Write `add` and `mul`, which build a node from two subtrees, and `eval`, which computes the tree’s value.',
    starter: `${EXPR}
fn add(a: Expr, b: Expr) -> Expr {
    todo!()
}

fn mul(a: Expr, b: Expr) -> Expr {
    todo!()
}

fn eval(e: &Expr) -> f64 {
    todo!()
}`,
    solution: `${EXPR}
fn add(a: Expr, b: Expr) -> Expr {
    Expr::Add(Box::new(a), Box::new(b))
}

fn mul(a: Expr, b: Expr) -> Expr {
    Expr::Mul(Box::new(a), Box::new(b))
}

fn eval(e: &Expr) -> f64 {
    match e {
        Expr::Num(n) => *n,
        Expr::Add(a, b) =>
            eval(a) + eval(b),
        Expr::Mul(a, b) =>
            eval(a) * eval(b),
    }
}`,
    tests: `use Expr::Num;

#[test]
fn a_number() {
    assert_eq!(eval(&Num(4.0)), 4.0);
}

#[test]
fn one_operator() {
    assert_eq!(eval(&add(Num(1.0), Num(2.0))), 3.0);
    assert_eq!(eval(&mul(Num(3.0), Num(2.0))), 6.0);
}

#[test]
fn nested() {
    // (1 + 2) * (3 + 4)
    let e = mul(
        add(Num(1.0), Num(2.0)),
        add(Num(3.0), Num(4.0)),
    );
    assert_eq!(eval(&e), 21.0);
}`,
    hints: [
      '`Box::new(a)` moves `a` onto the heap and gives you the box.',
      'In `eval`, match on `e`. The `Num` arm gets `n: &f64`, so return `*n`.',
      'In the `Add` arm, `a` is a `&Box<Expr>`; you can pass it straight to `eval`, which wants `&Expr`, because Rust looks through the box for you.',
    ],
    walkthrough: `\`add\` and \`mul\` take their subtrees by value, so they own them, then move each into a \`Box\`: \`Expr::Add(Box::new(a), Box::new(b))\`. The node now owns its children, and dropping the root drops the whole tree, children first, with no counting at all.

\`eval\` borrows the tree and matches. In \`Expr::Add(a, b)\` the bindings are \`&Box<Expr>\`. Passing them to \`eval(a)\` works because a \`Box<Expr>\` can be used where an \`Expr\` is borrowed: Rust follows the pointer for you (it implements \`Deref\`).

Every node has exactly one owner, its parent. That is why a tree is easy and the VM’s object graph is not.`,
    wrong: [
      {
        code: `${EXPR}
fn add(a: Expr, b: Expr) -> Expr {
    Expr::Add(Box::new(a), Box::new(b))
}

fn mul(a: Expr, b: Expr) -> Expr {
    Expr::Add(Box::new(a), Box::new(b))
}

fn eval(e: &Expr) -> f64 {
    match e {
        Expr::Num(n) => *n,
        Expr::Add(a, b) =>
            eval(a) + eval(b),
        Expr::Mul(a, b) =>
            eval(a) * eval(b),
    }
}`,
        why: '`mul` builds an `Add` node, so `3 * 2` evaluates to 5. Copy-paste is the classic tree-building bug.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which of these is a good fit for plain `Box<T>`?',
    options: [
      { t: 'Upvalues shared by several closures', why: 'Several owners need `Rc`; a `Box` has exactly one.' },
      { t: 'The children of a syntax-tree node', correct: true, why: 'Each child has exactly one parent, which owns it. Dropping the root drops the tree.' },
      { t: 'Two instances whose fields point at each other', why: 'Neither can be the single owner of the other.' },
    ],
  },
  {
    q: 'After `let a = Rc::new(5); let b = Rc::clone(&a); drop(a);`, what is `Rc::strong_count(&b)`?',
    options: [
      { t: '0, and the 5 is freed', why: '`b` still points at it, so it can’t be freed.' },
      { t: '2', why: 'Dropping `a` took one off the count.' },
      { t: '1', correct: true, why: 'The clone made it 2; dropping `a` brought it back to 1. The 5 lives until `b` is dropped.' },
    ],
  },
  {
    q: 'You write `a.borrow_mut()` and, while that guard is alive, call `a.borrow()`. When do you find out?',
    options: [
      { t: 'At compile time, with E0502', why: 'That is what plain references give you. A `RefCell` moves the check to run time.' },
      { t: 'Never: `RefCell` allows it', why: 'It enforces the same rules as `&` and `&mut`, just later.' },
      { t: 'When that line runs: the program panics with “RefCell already mutably borrowed”', correct: true, why: 'This is the panic the chapter showed, from rustc 1.97.' },
      { t: 'Only in release builds', why: 'The check runs in every build.' },
    ],
  },
  {
    q: 'Why does a cycle of `Rc` pointers leak?',
    options: [
      { t: 'Each object in the cycle is owned by the other, so neither strong count reaches 0', correct: true, why: 'Reference counting only notices a count hitting 0; it never asks whether anything outside can reach the objects.' },
      { t: 'Rust forgets to run `drop` at the end of `main`', why: 'Variables are dropped normally. The objects simply still have an owner each.' },
      { t: '`RefCell` disables the counting', why: 'The leak happens with or without a `RefCell`; it needs one to build the cycle, but the counting is `Rc`’s.' },
    ],
  },
  {
    q: 'Which Drip program makes a cycle of objects?',
    options: [
      { t: '`let a = Node(); let b = Node(); a.next = b;`', why: 'A chain: `b` has no field pointing back.' },
      { t: '`print 1 + 2;`', why: 'Numbers are not heap objects at all.' },
      { t: '`let a = Node(); a.me = a;`', correct: true, why: 'An instance whose field holds itself. With `Rc` its count could never reach 0.' },
    ],
  },
  {
    q: 'What does drip-rs use instead of `Rc<RefCell<..>>` for its objects?',
    options: [
      { t: 'Raw pointers in `unsafe` code, like clox', why: 'drip-rs has `#![forbid(unsafe_code)]`.' },
      { t: '`Box` for every object', why: 'A box has one owner, but Drip objects are shared.' },
      { t: 'One heap that owns every object, with its own mark-and-sweep collector deciding when they die', correct: true, why: 'Objects are referred to by small handles. Chapter 214 shows how.' },
    ],
  },
];
