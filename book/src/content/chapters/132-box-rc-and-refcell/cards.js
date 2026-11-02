// Chapter 200 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 132, 132.

export const prompts = {
  'box-what': {
    q: 'What is a `Box<T>`?',
    a: 'A pointer to a `T` on the heap, with exactly one owner. When the box is dropped, so is the `T`.',
  },
  'box-recursive': {
    q: 'Why does `enum Expr { Num(f64), Add(Expr, Expr) }` fail to compile, and how does `Box` fix it?',
    a: 'An `Expr` would contain two `Expr`s, so its size would be infinite (E0072). `Box<Expr>` is one pointer of fixed size.',
  },
  'box-cost': {
    q: 'What does a `Box` cost while the program runs?',
    a: 'One heap allocation (and freeing it later). There is no count and no check when you use it.',
  },
  'box-move': {
    q: '`let b = Box::new(5); let c = b;` Can you still use `b`?',
    a: 'No: moving the box moved ownership of the value to `c` (E0382 if you use `b`). A box follows the ordinary ownership rules.',
  },
  'rc-what': {
    q: 'What does `Rc::clone(&r)` copy?',
    a: 'Only the pointer. It adds 1 to the strong count; the value is not copied, and is dropped when the count falls to 0.',
  },
  'rc-count': {
    q: '`let a = Rc::new(5); let b = Rc::clone(&a); let c = a.clone(); drop(b);` What is the strong count now?',
    a: '2: it went 1, 2, 3, then back to 2 when `b` was dropped.',
  },
  'rc-immutable': {
    q: 'Why can’t you assign to a field through an `Rc<T>`?',
    a: 'An `Rc` hands out only shared access (`&T`): other owners may be reading (E0594). Mutating needs a `RefCell` inside.',
  },
  'drip-rc': {
    q: 'Where does drip-rs use `Rc`, and why does read-only access suffice there?',
    a: 'For each compiled `Chunk`, shared by the function object, the call frames running it and the VM’s current-chunk register. A chunk is frozen once compiled.',
  },
  'refcell-what': {
    q: 'What does `RefCell<T>` check, and when?',
    a: 'The borrowing rules (many readers or one writer), at run time, each time you call `borrow` or `borrow_mut`.',
  },
  'refcell-guard': {
    q: 'What do `borrow()` and `borrow_mut()` return, and when is the borrow given back?',
    a: 'A guard (`Ref` or `RefMut`) that acts like a reference; the borrow ends when the guard is dropped.',
  },
  'refcell-interior': {
    q: 'What is **interior mutability**?',
    a: 'Changing a value through a shared `&` reference, because a type like `RefCell` checks the rules itself at run time.',
  },
  'refcell-panic': {
    q: 'What happens if you call `borrow()` on a `RefCell` while a `borrow_mut()` of it is still alive?',
    a: 'The program panics: “RefCell already mutably borrowed”.',
  },
  'refcell-vm': {
    q: 'Why is a `RefCell` double borrow a real risk in a VM built from `Rc<RefCell<..>>`?',
    a: 'The program decides which objects alias. Drip code like `a.heal(a)` makes one object both sides of an operation, so a held borrow meets another at run time.',
  },
  'cycle-leak': {
    q: 'Two objects behind `Rc` point at each other, and nothing else points at them. What happens?',
    a: 'Each strong count stays at 1, so neither is ever dropped: the memory leaks (safely: nothing dangles).',
  },
  'weak-what': {
    q: 'What is `Weak<T>`, and how do you use the value behind it?',
    a: 'A pointer that does not own, made with `Rc::downgrade`; `upgrade()` gives `Some(Rc)` while the value exists and `None` after.',
  },
  'cycle-vm': {
    q: 'Why can’t a VM fix `Rc` cycles with `Weak`?',
    a: 'The Drip program, not the VM’s author, decides which references form cycles, so the VM can’t know which edges to make weak.',
  },
};

export const examples = {
  'rc-counts': {
    lang: 'rust',
    title: 'Counting owners',
    code: `use std::rc::Rc;

// Like drip-rs's compiled code: one
// value with several owners.
struct Chunk {
    code: Vec<u8>,
}

fn main() {
    let c = Rc::new(Chunk {
        code: vec![1, 2, 3],
    });
    let n = Rc::strong_count(&c);
    println!("owners: {n}");
    let f = Rc::clone(&c);
    let g = c.clone();
    let n = Rc::strong_count(&c);
    println!("owners: {n}");
    drop(f);
    let n = Rc::strong_count(&c);
    println!("owners: {n}");
    // g and c share one Chunk:
    println!("{}", g.code.len());
    println!("{}", Rc::ptr_eq(&g, &c));
}`,
  },
  'rc-share': {
    lang: 'rust',
    title: 'Two closures, one upvalue',
    code: `use std::cell::RefCell;
use std::rc::Rc;

// A captured variable, shared by
// two closures.
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
  boxExpr: {
    lang: 'rust',
    title: 'A boxed expression tree',
    prompt: 'A syntax tree is the shape `Box` was made for: each node has exactly one parent. Write `add` and `mul`, which build a node from two subtrees, and `eval`, which computes the value of a tree.',
    starter: `enum Expr {
    Num(f64),
    Add(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
}

fn add(a: Expr, b: Expr) -> Expr {
    todo!()
}

fn mul(a: Expr, b: Expr) -> Expr {
    todo!()
}

fn eval(e: &Expr) -> f64 {
    todo!()
}`,
    solution: `enum Expr {
    Num(f64),
    Add(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
}

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
      'A node needs its children *behind pointers*. `Box::new(a)` moves `a` onto the heap and gives you the box to store.',
      '`add` is one line: `Expr::Add(Box::new(a), Box::new(b))`, and `mul` the same with `Mul`. For `eval`, `match e` with one arm per variant.',
      'The `Num` arm gets `n: &f64`, so return `*n`. In `Expr::Add(a, b)` the bindings are `&Box<Expr>`, and you can pass them straight to `eval`: `eval(a) + eval(b)`.',
    ],
    walkthrough: `**How to think about it.** There are two jobs: *building* a tree, which is about ownership, and *walking* it, which is about recursion. To build a node, the node must own its two children, and since an \`Expr\` cannot hold an \`Expr\` directly, it holds a \`Box<Expr>\` for each. To walk it, ask "what kind of node is this?": a number is its own value, and an operator node is its two children's values combined. Each child is a smaller tree, so the same function works on it (the recursion of *Syntax trees*).

**The solution, line by line.**

- \`fn add(a: Expr, b: Expr) -> Expr {\` takes both subtrees *by value*, so \`add\` owns them and may move them.
- \`Expr::Add(Box::new(a), Box::new(b))\` moves each subtree onto the heap and stores the two boxes in a new \`Add\` node. The node now owns its children; dropping the root later drops the whole tree, children first, with no counting at all.
- \`mul\` is the same with \`Expr::Mul\`.
- \`fn eval(e: &Expr) -> f64 {\` only *borrows* the tree, since working out its value changes nothing.
- \`match e {\` looks at which variant \`e\` is. Because \`e\` is a reference, the bindings in each arm are references too.
- \`Expr::Num(n) => *n,\`: \`n\` is a \`&f64\`, and \`*n\` reads the number.
- \`Expr::Add(a, b) => eval(a) + eval(b),\`: here \`a\` and \`b\` are \`&Box<Expr>\`. Passing them to \`eval\`, which wants \`&Expr\`, works because Rust follows the box for you (a \`Box\` implements \`Deref\`, so a reference to a box can be used as a reference to what is inside).
- \`Expr::Mul(a, b) => eval(a) * eval(b),\` is the same with \`*\`. The \`match\` has an arm for every variant, so it is exhaustive, as *Enums and match* requires.

**Common wrong attempts.**

- Copy-pasting \`add\` into \`mul\` and forgetting to change \`Add\` to \`Mul\`: \`mul(Num(3.0), Num(2.0))\` then evaluates to 5. It is the classic tree-building bug.
- Writing \`Expr::Add(a, b)\` without \`Box::new\`: the types do not match (\`expected Box<Expr>, found Expr\`), and rustc suggests \`Box::new(a)\`.
- Writing \`Expr::Num(n) => n,\`: \`n\` is a \`&f64\`, not an \`f64\`, so the arms disagree on their type; the \`*\` reads the number out.`,
    wrong: [
      {
        code: `enum Expr {
    Num(f64),
    Add(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
}

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
      {
        code: `enum Expr {
    Num(f64),
    Add(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
}

fn add(a: Expr, b: Expr) -> Expr {
    Expr::Add(a, b)
}

fn mul(a: Expr, b: Expr) -> Expr {
    Expr::Mul(a, b)
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
        why: 'The variants hold `Box<Expr>`, not `Expr`: E0308, “arguments to this enum variant are incorrect”. Wrap each child with `Box::new`.',
      },
    ],
  },
  sharedUpvalue: {
    lang: 'rust',
    title: 'Capture, don’t copy',
    prompt: 'A closure captures a variable by sharing it (*Capturing variables: upvalues*): two closures that capture the same variable see each other’s changes. Write `capture`, which makes a `Closure` that shares `up`, and the methods `bump` (add 1 to the variable) and `read`.',
    starter: `use std::cell::RefCell;
use std::rc::Rc;

// One captured variable, shared.
type Up = Rc<RefCell<f64>>;

struct Closure {
    up: Up,
}

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
    solution: `use std::cell::RefCell;
use std::rc::Rc;

// One captured variable, shared.
type Up = Rc<RefCell<f64>>;

struct Closure {
    up: Up,
}

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
    walkthrough: `**How to think about it.** A captured variable that two closures share must be *one* variable: when one closure changes it, the other must see the change. So \`capture\` must not copy the value; it must hand out another owner of the same cell. That cell is an \`Rc\` (several owners) around a \`RefCell\` (changeable through a shared pointer), the \`Up\` type the starter defines.

**The solution, line by line.**

- \`fn capture(up: &Up) -> Closure { Closure { up: Rc::clone(up) } }\`: \`Rc::clone\` makes a second pointer to the *same* \`RefCell<f64>\` and adds 1 to its strong count. The third test checks exactly that: the original plus two closures make 3 owners, and dropping the closures brings the count back to 1.
- \`fn bump(&self) {\` takes \`&self\`, not \`&mut self\`: other closures share the variable, so nobody has unique access, and the \`RefCell\` is what makes changing it possible anyway.
- \`*self.up.borrow_mut() += 1.0;\`: \`self.up\` is the \`Rc\`, and calling \`borrow_mut()\` on it reaches the \`RefCell\` inside (an \`Rc\` lets you call its value's methods directly). It checks that nobody else is borrowing and returns a writer guard; \`*\` writes through the guard. The guard is a temporary, so it is dropped, and the borrow given back, at the semicolon.
- \`fn read(&self) -> f64 { *self.up.borrow() }\`: a reader guard, and \`*\` copies the \`f64\` out. Returning the number, not a reference, means no borrow outlives the call.

This is what a TypeScript closure does for free. In Rust you say "shared" (\`Rc\`) and "mutable through sharing" (\`RefCell\`) out loud, and the count and the borrow checks happen while the program runs.

**Common wrong attempts.**

- Copying the value into a new cell in \`capture\` (\`Rc::new(RefCell::new(*up.borrow()))\`): every closure gets its own variable, so \`inc.bump()\` changes only \`inc\`'s copy and \`get\` still sees 10.
- In \`bump\`, writing \`let mut v = *self.up.borrow(); v += 1.0;\`: this copies the number into a local \`v\` and changes only that local.
- Holding a guard across a call, such as \`let g = self.up.borrow_mut(); self.read()\`: \`read\` asks for a reader while the writer is alive, and the program panics with "RefCell already mutably borrowed".`,
    wrong: [
      {
        code: `use std::cell::RefCell;
use std::rc::Rc;

// One captured variable, shared.
type Up = Rc<RefCell<f64>>;

struct Closure {
    up: Up,
}

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
        code: `use std::cell::RefCell;
use std::rc::Rc;

// One captured variable, shared.
type Up = Rc<RefCell<f64>>;

struct Closure {
    up: Up,
}

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
};

export const quiz = [
  {
    q: 'Which of these is a good fit for plain `Box<T>`?',
    options: [
      {
        t: 'Bytecode shared by several call frames',
        why: 'Several owners need `Rc`; a `Box` has exactly one.',
      },
      {
        t: 'The children of a syntax-tree node',
        correct: true,
        why: 'Each child has exactly one parent, which owns it. Dropping the root drops the tree.',
      },
      {
        t: 'A value two closures both need to keep alive',
        why: 'Neither can be the single owner; that is `Rc`’s job.',
      },
    ],
  },
  {
    q: 'After `let a = Rc::new(5); let b = Rc::clone(&a); drop(a);`, what is `Rc::strong_count(&b)`?',
    options: [
      {
        t: '0, and the 5 is freed',
        why: '`b` still points at it, so it can’t be freed.',
      },
      {
        t: '2',
        why: 'Dropping `a` took one off the count.',
      },
      {
        t: '1',
        correct: true,
        why: 'The clone made it 2; dropping `a` brought it back to 1. The 5 lives until `b` is dropped.',
      },
    ],
  },
  {
    q: 'What does `Rc::clone(&chunk)` do to the `Chunk` itself?',
    options: [
      {
        t: 'Nothing: it copies the pointer and adds 1 to the count',
        correct: true,
        why: 'That is why sharing bytecode with `Rc` costs no copying.',
      },
      {
        t: 'Makes a deep copy, like cloning a `Vec`',
        why: '`Rc::clone` never copies the value.',
      },
      {
        t: 'Moves it to a new place on the heap',
        why: 'The value stays where `Rc::new` put it.',
      },
      {
        t: 'Locks it so only the new owner can read it',
        why: 'All owners can read it, at any time.',
      },
    ],
  },
  {
    q: 'Why does `enum Expr { Num(f64), Add(Expr, Expr) }` fail with E0072?',
    options: [
      {
        t: 'Enums can’t refer to themselves at all',
        why: 'They can, through a pointer such as `Box<Expr>`.',
      },
      {
        t: 'An `Expr` would contain `Expr`s directly, so it would have infinite size',
        correct: true,
        why: 'A `Box` adds the indirection rustc asks for: a fixed-size pointer.',
      },
      {
        t: '`f64` cannot be stored in an enum',
        why: '`Num(f64)` is fine.',
      },
    ],
  },
  {
    q: 'You hold two `Rc<Upvalue>` to one upvalue and write `a.value += 1.0`. What happens?',
    options: [
      {
        t: 'Both owners see the new value',
        why: 'It does not compile.',
      },
      {
        t: 'Only `a`’s copy changes',
        why: 'There is only one value; `Rc::clone` made no copy.',
      },
      {
        t: 'It panics at run time',
        why: 'The compiler stops it first.',
      },
      {
        t: 'E0594: cannot assign to data in an `Rc`',
        correct: true,
        why: 'An `Rc` gives only shared access; mutation needs a `RefCell` inside.',
      },
    ],
  },
  {
    q: 'You write `a.borrow_mut()` and, while that guard is alive, call `a.borrow()`. When do you find out?',
    options: [
      {
        t: 'At compile time, with E0502',
        why: 'That is what plain references give you. A `RefCell` moves the check to run time.',
      },
      {
        t: 'When that line runs: the program panics with “RefCell already mutably borrowed”',
        correct: true,
        why: 'The real panic from rustc 1.97.',
      },
      {
        t: 'Never: `RefCell` allows it',
        why: 'It enforces the same rules as `&` and `&mut`, just later.',
      },
      {
        t: 'Only in release builds',
        why: 'The check runs in every build.',
      },
    ],
  },
  {
    q: 'Why does `*c.borrow_mut() += 1; println!("{}", c.borrow());` not panic?',
    options: [
      {
        t: 'The writer guard is a temporary, dropped at the end of its statement',
        correct: true,
        why: 'By the time `borrow()` runs, no writer is alive.',
      },
      {
        t: '`borrow` and `borrow_mut` never conflict',
        why: 'They do, while both guards are alive.',
      },
      {
        t: 'The compiler removes the check',
        why: 'The check always runs.',
      },
    ],
  },
  {
    q: 'Which type lets two closures share one variable and both change it?',
    options: [
      {
        t: '`Box<f64>`',
        why: 'A box has exactly one owner.',
      },
      {
        t: '`Rc<f64>`',
        why: 'Two owners, but an `Rc` gives only shared, read-only access.',
      },
      {
        t: '`RefCell<f64>` on its own',
        why: 'Changeable, but it still has only one owner.',
      },
      {
        t: '`Rc<RefCell<f64>>`',
        correct: true,
        why: '`Rc` gives several owners; `RefCell` lets them change the value through shared access.',
      },
    ],
  },
  {
    q: 'Objects `c` and `d` hold `Rc`s to each other, and the variables `c` and `d` go out of scope. What happens?',
    options: [
      {
        t: 'Both are freed, since no variable reaches them',
        why: 'Reference counting does not ask about reachability.',
      },
      {
        t: 'Each count falls to 1 and stays there, so neither is freed: a leak',
        correct: true,
        why: 'The program printed no `free c` or `free d`.',
      },
      {
        t: 'The program panics',
        why: 'A leak is memory safe; nothing panics.',
      },
    ],
  },
  {
    q: 'What does `back.upgrade()` return after the last `Rc` to the value is dropped?',
    options: [
      {
        t: 'The value, kept alive by the `Weak`',
        why: 'A `Weak` does not own, so it cannot keep the value alive.',
      },
      {
        t: 'A dangling pointer',
        why: 'Rust never hands out a dangling pointer here.',
      },
      {
        t: '`None`',
        correct: true,
        why: '`upgrade` returns `Some(Rc)` only while the value still exists.',
      },
    ],
  },
];
