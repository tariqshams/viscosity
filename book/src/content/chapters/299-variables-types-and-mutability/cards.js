// Chapter 299 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'vr-let-const': {
    q: 'Which TypeScript keyword behaves like Rust’s plain `let`?',
    a: '`const`: the variable can’t be assigned again.',
  },
  'vr-mut-let': {
    q: 'How do you write TypeScript’s `let count = 0;` in Rust, if `count` will change?',
    a: '`let mut count = 0;`',
  },
  'vr-deep': {
    q: 'In TypeScript you can `push` onto a `const` array. Can you push onto a Rust `Vec` bound with plain `let`?',
    a: 'No. Rust’s immutability covers the value itself, so you need `let mut`.',
  },
  'vr-shadow': {
    q: 'What does `let x = x * 10;` do when `x` already exists?',
    a: 'It shadows `x`: it makes a new variable called `x` from the old value. The old variable is not changed.',
  },
  'vr-default': {
    q: 'What types does Rust infer for `let n = 5;` and `let f = 2.5;`?',
    a: '`i32` and `f64`.',
  },
  'vr-usize': {
    q: 'Which integer type does Rust use for indexes and lengths?',
    a: '`usize`: unsigned, and as wide as an address on the machine.',
  },
  'vr-char': {
    q: 'How many bytes is a Rust `char`, and what does it hold?',
    a: 'Four bytes, holding one Unicode scalar value.',
  },
  'vr-int-div': {
    q: 'What is `7 / 2` in Rust, with no type annotations?',
    a: '`3`. Both are `i32`, and integer division cuts toward zero.',
  },
  'vr-as': {
    q: 'How do you add an `i32` called `a` to an `f64` called `b`?',
    a: 'Convert explicitly: `a as f64 + b`. Rust never converts between number types silently.',
  },
  'vr-overflow': {
    q: 'A `u8` holding 255 gets `+ 1`. What happens in a debug build, and in a release build?',
    a: 'Debug: the program panics (“attempt to add with overflow”). Release: it wraps to 0. Either way, it’s a bug unless you used `wrapping_add`.',
  },
};

export const examples = {
  types: {
    title: 'Numbers with types',
    lang: 'rust',
    code: `fn main() {
    let a: i32 = 7;
    let b: f64 = 2.0;
    println!("{}", a / 2);
    println!("{}", a as f64 / b);
    println!("{}", -7 / 2);

    let big: i32 = 300;
    println!("{}", big as u8);

    let r: u8 = 255;
    println!("{}", r.wrapping_add(1));
    println!("{}", u8::MAX);
    println!("{}", i32::MAX);

    let mut n = 0;
    n += 1;
    let n = n * 10;
    println!("{n}");
}`,
  },
};

export const exercises = {
  mean: {
    lang: 'rust',
    title: 'The mean, without losing the half',
    prompt: `A benchmark harness adds up its run times in whole milliseconds (an \`i32\`) and counts its runs (another \`i32\`). Write \`mean(total, count)\` so it returns the mean as an \`f64\`, **keeping the fraction**: \`mean(7, 2)\` is \`3.5\`.`,
    starter: `fn mean(total: i32, count: i32) -> f64 {
    todo!()
}`,
    solution: `fn mean(total: i32, count: i32) -> f64 {
    return total as f64 / count as f64;
}`,
    tests: `#[test]
fn seven_over_two_is_three_and_a_half() {
    assert_eq!(mean(7, 2), 3.5);
}

#[test]
fn exact_division() {
    assert_eq!(mean(9, 3), 3.0);
}

#[test]
fn a_third() {
    let m = mean(1, 3);
    assert!((m - 0.333333).abs() < 1e-5);
}`,
    hints: [
      'The answer must be an `f64`, but both inputs are `i32`. Something has to convert them.',
      '`as f64` converts a value. Where you put it matters.',
      'If you divide first, `7 / 2` is already `3` before any conversion. Convert both numbers, then divide.',
    ],
    walkthrough: `Two Rust rules meet here.

- **No silent conversions.** \`total / count\` is an \`i32\`, and the function promises an \`f64\`, so it doesn't compile. You have to write \`as f64\` somewhere.
- **Integer division truncates.** \`(total / count) as f64\` compiles, but by the time \`as\` runs, \`7 / 2\` has already become \`3\`, so you get \`3.0\`.

So convert *first*: \`total as f64 / count as f64\`. \`as\` binds tighter than \`/\`, so this reads as \`(total as f64) / (count as f64)\`: a float divided by a float, which keeps the half.

In TypeScript every number is already a float, so this bug can't happen there. In Rust it is one of the first you'll meet. The fix is always the same: decide where the conversion goes.`,
    wrong: [
      {
        code: `fn mean(total: i32, count: i32) -> f64 {
    return (total / count) as f64;
}`,
        why: 'This divides two integers first, so `mean(7, 2)` is `3.0`: the half is gone before `as` runs.',
      },
      {
        code: `fn mean(total: i32, count: i32) -> f64 {
    return total / count;
}`,
        why: 'This doesn’t compile: `total / count` is an `i32`, and the function must return an `f64`. Rust won’t convert for you.',
      },
    ],
  },
  'byte-counter': {
    optional: true,
    lang: 'rust',
    title: 'A counter that wraps like a byte',
    prompt: `Drip bytecode is a list of \`u8\`s. Write \`next(x)\`, which returns \`x + 1\` as a \`u8\`, except that \`next(255)\` must be \`0\` (wrap around, like a one-byte counter), in debug **and** release builds.`,
    starter: `fn next(x: u8) -> u8 {
    todo!()
}`,
    solution: `fn next(x: u8) -> u8 {
    return x.wrapping_add(1);
}`,
    tests: `#[test]
fn counts_up() {
    assert_eq!(next(0), 1);
    assert_eq!(next(41), 42);
}

#[test]
fn wraps_at_255() {
    assert_eq!(next(255), 0);
}`,
    hints: [
      'Try the obvious `x + 1` first, and look at which test fails and why.',
      'Tests are debug builds, and debug builds check for overflow.',
      'Integers have methods that wrap on purpose: `wrapping_add`.',
    ],
    walkthrough: `\`x + 1\` passes \`counts_up\` and fails \`wraps_at_255\`: the test panics with “attempt to add with overflow”, because tests run as debug builds, and debug builds check every addition.

\`x.wrapping_add(1)\` says what you mean: wrap around on overflow, in every kind of build. 255 plus one becomes 0.

That's the Rust habit to take away. If the wrap is a bug, debug builds catch it for you. If the wrap is the point, ask for it by name.`,
    wrong: [
      {
        code: `fn next(x: u8) -> u8 {
    return x + 1;
}`,
        why: 'Fine for 0 to 254, but `next(255)` overflows, and the debug build panics instead of wrapping.',
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
      { t: 'Yes, `total` becomes 5', why: 'In TypeScript, `let` would allow this, but Rust’s `let` is like `const`.' },
      { t: 'Yes, but it prints a warning', why: 'It’s an error, not a warning: E0384, “cannot assign twice to immutable variable”.' },
      { t: 'No; it needs `let mut total = 0;`', correct: true, why: 'Without `mut`, the binding can’t be changed.' },
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
    q: 'Which type would you use for an index into a `Vec`?',
    options: [
      { t: '`i32`', why: 'Indexes can’t be negative, and Rust indexes with `usize`.' },
      { t: '`f64`', why: 'An index is a whole number; Rust won’t index with a float.' },
      { t: '`u8`', why: 'That only reaches 255.' },
      { t: '`usize`', correct: true, why: 'Unsigned and as wide as an address: big enough for any index the machine can reach.' },
    ],
  },
  {
    q: 'What is `-7 / 2` in Rust (both `i32`)?',
    options: [
      { t: '`-3.5`', why: 'That’s TypeScript’s answer. Integer division gives an integer.' },
      { t: '`-4`', why: 'Rust cuts toward zero, not downward.' },
      { t: '`-3`', correct: true, why: 'Integer division truncates toward zero.' },
      { t: 'A compile error', why: 'Dividing two `i32`s is fine.' },
    ],
  },
  {
    q: 'A `u8` variable holds 255 and your code adds 1. You run the tests (a debug build). What happens?',
    options: [
      { t: 'It becomes 256', why: 'A `u8` can’t hold 256.' },
      { t: 'The program panics: attempt to add with overflow', correct: true, why: 'Debug builds check integer arithmetic. A release build would wrap to 0.' },
      { t: 'It becomes 0 silently', why: 'That’s what a release build does. Debug builds check.' },
      { t: 'The compiler always rejects it', why: 'Only when it can see the overflow at compile time. Usually the value comes from elsewhere, so the check happens at run time.' },
    ],
  },
  {
    q: 'Why doesn’t `let a: i32 = 1; let b: f64 = 2.5; a + b` compile?',
    options: [
      { t: 'Rust can’t add numbers of two different types without an explicit `as`', correct: true, why: 'rustc says “cannot add `f64` to `i32`”. Write `a as f64 + b`.' },
      { t: '`2.5` is not a valid `f64`', why: '`2.5` is a perfectly good `f64`.' },
      { t: '`i32` can’t be added at all', why: '`i32 + i32` is fine.' },
      { t: 'Variables need `mut` to be added', why: 'Reading a variable never needs `mut`; only changing it does.' },
    ],
  },
];
