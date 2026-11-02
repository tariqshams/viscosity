// Chapter 361 cards. Keys are stable ids: never rename them.

const EXPR = `enum Expr {
    Num(f64),
    Add(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
}
`;

const BUILD = `fn add(a: Expr, b: Expr) -> Expr {
    Expr::Add(Box::new(a), Box::new(b))
}

fn mul(a: Expr, b: Expr) -> Expr {
    Expr::Mul(Box::new(a), Box::new(b))
}`;

const EVAL = `fn eval(e: &Expr) -> f64 {
    match e {
        Expr::Num(n) => *n,
        Expr::Add(a, b) =>
            eval(a) + eval(b),
        Expr::Mul(a, b) =>
            eval(a) * eval(b),
    }
}`;

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
};

export const exercises = {
  boxExpr: {
    lang: 'rust',
    title: 'A boxed expression tree',
    prompt:
      'A syntax tree is the shape `Box` was made for: each node has exactly one parent. Write `add` and `mul`, which build a node from two subtrees, and `eval`, which computes the value of a tree.',
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
${BUILD}

${EVAL}`,
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
        code: `${EXPR}
fn add(a: Expr, b: Expr) -> Expr {
    Expr::Add(Box::new(a), Box::new(b))
}

fn mul(a: Expr, b: Expr) -> Expr {
    Expr::Add(Box::new(a), Box::new(b))
}

${EVAL}`,
        why: '`mul` builds an `Add` node, so `3 * 2` evaluates to 5. Copy-paste is the classic tree-building bug.',
      },
      {
        code: `${EXPR}
fn add(a: Expr, b: Expr) -> Expr {
    Expr::Add(a, b)
}

fn mul(a: Expr, b: Expr) -> Expr {
    Expr::Mul(a, b)
}

${EVAL}`,
        why: 'The variants hold `Box<Expr>`, not `Expr`: E0308, “arguments to this enum variant are incorrect”. Wrap each child with `Box::new`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which of these is a good fit for plain `Box<T>`?',
    options: [
      { t: 'Bytecode shared by several call frames', why: 'Several owners need `Rc`; a `Box` has exactly one.' },
      { t: 'The children of a syntax-tree node', correct: true, why: 'Each child has exactly one parent, which owns it. Dropping the root drops the tree.' },
      { t: 'A value two closures both need to keep alive', why: 'Neither can be the single owner; that is `Rc`’s job.' },
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
    q: 'What does `Rc::clone(&chunk)` do to the `Chunk` itself?',
    options: [
      { t: 'Nothing: it copies the pointer and adds 1 to the count', correct: true, why: 'That is why sharing bytecode with `Rc` costs no copying.' },
      { t: 'Makes a deep copy, like cloning a `Vec`', why: '`Rc::clone` never copies the value.' },
      { t: 'Moves it to a new place on the heap', why: 'The value stays where `Rc::new` put it.' },
      { t: 'Locks it so only the new owner can read it', why: 'All owners can read it, at any time.' },
    ],
  },
  {
    q: 'Why does `enum Expr { Num(f64), Add(Expr, Expr) }` fail with E0072?',
    options: [
      { t: 'Enums can’t refer to themselves at all', why: 'They can, through a pointer such as `Box<Expr>`.' },
      { t: 'An `Expr` would contain `Expr`s directly, so it would have infinite size', correct: true, why: 'A `Box` adds the indirection rustc asks for: a fixed-size pointer.' },
      { t: '`f64` cannot be stored in an enum', why: '`Num(f64)` is fine.' },
    ],
  },
  {
    q: 'You hold two `Rc<Upvalue>` to one upvalue and write `a.value += 1.0`. What happens?',
    options: [
      { t: 'Both owners see the new value', why: 'It does not compile.' },
      { t: 'Only `a`’s copy changes', why: 'There is only one value; `Rc::clone` made no copy.' },
      { t: 'It panics at run time', why: 'The compiler stops it first.' },
      { t: 'E0594: cannot assign to data in an `Rc`', correct: true, why: 'An `Rc` gives only shared access; mutation needs a `RefCell` inside.' },
    ],
  },
];
