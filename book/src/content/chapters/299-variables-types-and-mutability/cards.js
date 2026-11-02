// Chapter 299 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'vr-let-const': {
    q: 'Which TypeScript keyword behaves like Rust’s plain `let`?',
    a: '`const`: the variable cannot be assigned again.',
  },
  'vr-mut-let': {
    q: 'How do you write TypeScript’s `let count = 0;` in Rust, if `count` will change?',
    a: '`let mut count = 0;`',
  },
  'vr-deep': {
    q: 'In TypeScript you can `push` onto a `const` array. Can you push onto a Rust `Vec` bound with plain `let`?',
    a: 'No. Rust’s immutability covers the value itself, so you need `let mut` (rustc reports E0596).',
  },
  'vr-unused-mut': {
    q: 'You write `let mut x = 5;` and never change `x`. What does rustc do?',
    a: 'It compiles, with a warning: “variable does not need to be mutable”.',
  },
  'vr-shadow': {
    q: 'What does `let x = x * 10;` do when `x` already exists?',
    a: 'It shadows `x`: it makes a new variable called `x` from the old value. The old variable is not changed.',
  },
  'vr-shadow-type': {
    q: 'Why may a shadowing `let` change a name’s type, when assigning to a `mut` variable may not?',
    a: 'Shadowing makes a new variable, which can have any type. Assignment puts a new value into the same variable, whose type is fixed.',
  },
  'vr-shadow-scope': {
    q: 'An inner block does `let x = x * 10;`. After the block’s `}`, what does `x` mean?',
    a: 'The outer `x` again, with its old value: the shadow lasts only until the end of its block.',
  },
  'vr-const': {
    q: 'Name two ways a Rust `const` differs from an immutable `let`.',
    a: 'Any two of: its type must be written; its value must be known at compile time; it can never be `mut`; it may be declared outside every function.',
  },
};

export const examples = {};

export const exercises = {
  'sum-to': {
    lang: 'rust',
    title: 'Make the counter count',
    prompt: `This function should add up the whole numbers from 1 to \`n\` (so \`sum_to(4)\` is 1 + 2 + 3 + 4 = 10), but it does not compile. Read what rustc would say, and fix it by changing **only** how the variables are declared.`,
    starter: `fn sum_to(n: i64) -> i64 {
    let total = 0;
    let i = 1;
    while i <= n {
        total += i;
        i += 1;
    }
    return total;
}`,
    solution: `fn sum_to(n: i64) -> i64 {
    let mut total = 0;
    let mut i = 1;
    while i <= n {
        total += i;
        i += 1;
    }
    return total;
}`,
    tests: `#[test]
fn one_to_four_is_ten() {
    assert_eq!(sum_to(4), 10);
}

#[test]
fn zero_is_zero() {
    assert_eq!(sum_to(0), 0);
}

#[test]
fn one_to_a_hundred() {
    assert_eq!(sum_to(100), 5050);
}`,
    hints: [
      'Which variables does the loop change? Look for `+=`.',
      'Both `total` and `i` are changed inside the loop, and Rust’s plain `let` is like TypeScript’s `const`.',
      'Declare both with `let mut`: `let mut total = 0;` and `let mut i = 1;`. `n` is only read, so it needs nothing.',
    ],
    walkthrough: `**How to think about it.** Start from the compiler’s point of view: which names are given a new value after their \`let\`? In this function that is any variable on the left of a \`+=\`. rustc would report E0384, “cannot assign twice to immutable variable”, for each of them, with a \`help:\` line pointing at the \`let\` to change. The loop itself (\`while i <= n\`, no brackets round the condition, braces always) is already right.

**The solution, line by line.**

- \`fn sum_to(n: i64) -> i64 {\` takes a whole number \`n\` and returns one. \`n\` is only read, so it stays immutable.
- \`let mut total = 0;\` starts the running sum at 0. It changes on every pass, so it needs \`mut\`. Its type is worked out from how it is used: it is added to \`i\` and returned as an \`i64\`, so it is an \`i64\`.
- \`let mut i = 1;\` is the counter, also changed on every pass.
- \`while i <= n {\` repeats while the counter has not passed \`n\`. For \`n = 0\` the condition is false at once, the body never runs, and the answer is 0.
- \`total += i;\` adds the counter to the sum. This is the line that needs \`total\` to be \`mut\`.
- \`i += 1;\` moves the counter on. Forget it and the loop never ends.
- \`return total;\` sends the sum back: 10 for \`n = 4\`, 5050 for \`n = 100\`.

**Common wrong attempts.**

- Making only \`total\` mutable: \`i += 1\` is then still an assignment to an immutable variable, and the program still does not compile. Every variable that changes needs its own \`mut\`.
- “Fixing” it with shadowing, \`let total = total + i;\` inside the loop. That compiles (once \`i\` is \`mut\`), but it makes a *new* \`total\` inside the loop body each time round, which disappears at the loop’s \`}\`. The outer \`total\` is never changed, so the function returns 0. rustc even warns that the inner \`total\` is never used.`,
    wrong: [
      {
        code: `fn sum_to(n: i64) -> i64 {
    let mut total = 0;
    let i = 1;
    while i <= n {
        total += i;
        i += 1;
    }
    return total;
}`,
        why: '`i` changes too (`i += 1`), so it also needs `mut`. This still fails with E0384.',
      },
      {
        code: `fn sum_to(n: i64) -> i64 {
    let total = 0;
    let mut i = 1;
    while i <= n {
        let total = total + i;
        i += 1;
    }
    return total;
}`,
        why: 'The inner `let total` shadows the outer one only until the loop body’s `}`, so the outer `total` stays 0 and every call returns 0.',
      },
    ],
  },
};

export const quiz = [
  {
    q: `Does this compile?
\`\`\`rust
let total = 0;
total += 5;
\`\`\``,
    options: [
      { t: 'Yes, `total` becomes 5', why: 'In TypeScript `let` would allow this, but Rust’s `let` is like `const`.' },
      { t: 'Yes, but it prints a warning', why: 'It is an error, not a warning: E0384, “cannot assign twice to immutable variable”.' },
      { t: 'No; it needs `let mut total = 0;`', correct: true, why: 'Without `mut`, the binding cannot be changed.' },
      { t: 'No; Rust has no `+=`', why: 'Rust has `+=`. The problem is the missing `mut`.' },
    ],
  },
  {
    q: `What does this print?
\`\`\`rust
let x = 4;
let x = x + 1;
let x = x * 2;
println!("{x}");
\`\`\``,
    options: [
      { t: '`10`', correct: true, why: 'Each `let` makes a new `x` from the previous one: 4, then 5, then 10. Shadowing, not mutation.' },
      { t: '`4`', why: 'The later `let`s make new variables, and the name `x` refers to the newest one.' },
      { t: 'A compile error: `x` is immutable', why: 'No variable is assigned twice. Each line declares a fresh `x`.' },
      { t: '`8`', why: 'The `+ 1` happens first: (4 + 1) × 2.' },
    ],
  },
  {
    q: `Why does this fail, when the shadowing version would not?
\`\`\`rust
let mut n = "5";
n = 5;
\`\`\``,
    options: [
      { t: '`n` needs to be declared without `mut`', why: 'Without `mut` the assignment would fail for a different reason (E0384).' },
      { t: 'Assignment keeps the variable’s type, and `n` holds text, not a number', correct: true, why: 'rustc reports E0308, “expected `&str`, found integer”. A second `let n = 5;` would make a new variable instead.' },
      { t: 'Numbers can never be assigned in Rust', why: 'They can, to a `mut` variable of a number type.' },
      { t: 'It compiles, and `n` becomes 5', why: 'Rust never changes a variable’s type behind your back.' },
    ],
  },
  {
    q: `What does this print?
\`\`\`rust
let x = 1;
{
    let x = 2;
}
println!("{x}");
\`\`\``,
    options: [
      { t: '`2`', why: 'The inner `x` is a different variable, and it ended at the `}`.' },
      { t: 'A compile error: `x` declared twice', why: 'Shadowing is allowed, inside a block or not.' },
      { t: 'Nothing: `x` was dropped', why: 'The outer `x` lives until the end of the outer block.' },
      { t: '`1`', correct: true, why: 'The shadow lasted only until the end of its block; the outer `x` was never changed.' },
    ],
  },
  {
    q: 'Which line is a valid Rust constant?',
    options: [
      { t: '`const max = 256;`', why: 'A `const` must have its type written out.' },
      { t: '`const mut MAX: usize = 256;`', why: 'A `const` can never be `mut`.' },
      { t: '`const MAX_SLOTS: usize = 256;`', correct: true, why: 'Type written, value known at compile time, name in capitals by habit. This one is from the Rust Drip compiler.' },
      { t: '`let const MAX = 256;`', why: '`const` replaces `let`; it is not added to it.' },
    ],
  },
];
