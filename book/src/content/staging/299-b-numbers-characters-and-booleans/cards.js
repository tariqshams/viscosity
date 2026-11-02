// Chapter 299-b cards (the second half of chapter 299): recall prompts,
// examples, exercises and quiz. Keys are stable ids: renaming one would
// orphan readers' review history.

export const prompts = {
  'vr-default': {
    q: 'What types does Rust infer for `let n = 5;` and `let f = 2.5;`?',
    a: '`i32` and `f64`.',
  },
  'vr-range': {
    q: 'What range of values can an `i8` hold, and a `u8`?',
    a: '`i8`: −128 to 127. `u8`: 0 to 255. Both have 256 values, because both have 8 bits.',
  },
  'vr-usize': {
    q: 'Which integer type does Rust use for indexes and lengths?',
    a: '`usize`: unsigned, and as wide as an address on the machine.',
  },
  'vr-char': {
    q: 'How many bytes is a Rust `char`, and what does it hold?',
    a: 'Four bytes, holding one Unicode scalar value. It is written in single quotes, like `\'é\'`.',
  },
  'vr-int-div': {
    q: 'What is `7 / 2` in Rust, with no type annotations? And `-7 / 2`?',
    a: '`3` and `-3`. Both are `i32`, and integer division cuts toward zero.',
  },
  'vr-as': {
    q: 'How do you add an `i32` called `a` to an `f64` called `b`?',
    a: 'Convert explicitly: `a as f64 + b`. Rust never converts between number types silently.',
  },
  'vr-overflow': {
    q: 'A `u8` holding 255 gets `+ 1`. What happens in a debug build, and in a release build?',
    a: 'Debug: the program panics (“attempt to add with overflow”). Release: by default it wraps to 0. Either way it is a bug, unless you used `wrapping_add`.',
  },
  'vr-wrapping': {
    q: 'How do you add 1 to a `u8` so that 255 becomes 0 in every kind of build?',
    a: '`x.wrapping_add(1)`.',
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
    println!("{}", 3.9_f64 as i32);

    let r: u8 = 255;
    println!("{}", r.wrapping_add(1));
    println!("{:?}", r.checked_add(1));
    println!("{}", u8::MAX);
    println!("{}", i32::MAX);
    println!("{}", 'é' as u32);
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
      '`as f64` converts a value. Where you put it matters: before the division, or after?',
      'If you divide first, `7 / 2` is already `3` before any conversion. Convert both numbers, then divide: `total as f64 / count as f64`.',
    ],
    walkthrough: `**How to think about it.** Two rules from this chapter meet here. First, no silent conversions: \`total / count\` is an \`i32\`, the function promises an \`f64\`, and Rust will not turn one into the other for you, so \`as f64\` must appear somewhere. Second, integer division cuts off the fraction: if the division happens while the numbers are still \`i32\`s, the half is gone before any \`as\` can save it. So the question is only *where* the conversion goes, and the answer is “before the division”.

**The solution, line by line.**

- \`fn mean(total: i32, count: i32) -> f64 {\` takes two whole numbers and promises a float back.
- \`return total as f64 / count as f64;\` converts \`total\` to an \`f64\` (7 becomes 7.0), converts \`count\` (2 becomes 2.0), and divides one float by the other, which keeps the fraction: 7.0 / 2.0 is 3.5. \`as\` binds more tightly than \`/\`, so this reads as \`(total as f64) / (count as f64)\` without any brackets.
- \`}\` closes the body.

In the third test, \`(m - 0.333333).abs() < 1e-5\` checks that the answer is *close to* a third, because one third cannot be stored exactly in an \`f64\` (as *How JavaScript stores numbers and objects* showed for JavaScript’s numbers, which are the same type).

**Common wrong attempts.**

- \`return (total / count) as f64;\` compiles, but by the time \`as\` runs, \`7 / 2\` has already become \`3\`, so \`mean(7, 2)\` is \`3.0\`.
- \`return total / count;\` does not compile: \`total / count\` is an \`i32\`, the function must return an \`f64\`, and rustc says “mismatched types: expected \`f64\`, found \`i32\`”.
- Converting only one side, \`total as f64 / count\`, does not compile either: that divides an \`f64\` by an \`i32\`, and rustc says “cannot divide \`f64\` by \`i32\`”. Both sides must be the same type.`,
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
        why: 'This does not compile: `total / count` is an `i32`, and the function must return an `f64`. Rust will not convert for you.',
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
      'Tests are debug builds, and debug builds check every addition for overflow.',
      'Integers have methods that wrap on purpose: `x.wrapping_add(1)`.',
    ],
    walkthrough: `**How to think about it.** \`x + 1\` is right for 0 to 254 and wrong for 255, because 256 does not fit in a byte. Tests run as debug builds, and debug builds check every addition, so \`next(255)\` with plain \`+\` stops the test with “attempt to add with overflow”. The exercise asks for the wrap on purpose, so the code should say so.

**The solution, line by line.**

- \`fn next(x: u8) -> u8 {\` takes a byte and returns a byte.
- \`return x.wrapping_add(1);\` adds 1 and, if the result does not fit, wraps round: 255 becomes 0, in every kind of build. Methods are called with a dot, as in TypeScript; \`wrapping_add\` belongs to every integer type.
- \`}\` closes the body.

**Common wrong attempts.**

- \`return x + 1;\` passes \`counts_up\` and panics in \`wraps_at_255\`.
- \`return (x as u16 + 1) as u8;\` passes too, because \`as u8\` keeps the low eight bits of 256, which are 0; but it hides the intent behind two conversions. Say what you mean with \`wrapping_add\`.`,
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
    q: 'Which type would you use for an index into a `Vec`?',
    options: [
      { t: '`i32`', why: 'Indexes cannot be negative, and Rust indexes with `usize` (an `i32` index is error E0277).' },
      { t: '`f64`', why: 'An index is a whole number; Rust will not index with a float.' },
      { t: '`u8`', why: 'That only reaches 255.' },
      { t: '`usize`', correct: true, why: 'Unsigned and as wide as an address: big enough for any index the machine can reach.' },
    ],
  },
  {
    q: 'What is `-7 / 2` in Rust (both `i32`)?',
    options: [
      { t: '`-3.5`', why: 'That is TypeScript’s answer. Integer division gives an integer.' },
      { t: '`-4`', why: 'That is Python’s `//`, which rounds down. Rust cuts toward zero.' },
      { t: '`-3`', correct: true, why: 'Integer division truncates toward zero.' },
      { t: 'A compile error', why: 'Dividing two `i32`s is fine.' },
    ],
  },
  {
    q: 'A `u8` variable holds 255 and your code adds 1. You run the tests (a debug build). What happens?',
    options: [
      { t: 'It becomes 256', why: 'A `u8` cannot hold 256.' },
      { t: 'The program panics: attempt to add with overflow', correct: true, why: 'Debug builds check integer arithmetic. A release build would, by default, wrap to 0.' },
      { t: 'It becomes 0 silently', why: 'That is what a release build does by default. Debug builds check.' },
      { t: 'The compiler always rejects it', why: 'Only when it can see the overflow at compile time. Usually the value comes from elsewhere, so the check happens at run time.' },
    ],
  },
  {
    q: 'Why does `let a: i32 = 1; let b: f64 = 2.5; a + b` not compile?',
    options: [
      { t: 'Rust cannot add numbers of two different types without an explicit `as`', correct: true, why: 'rustc says “cannot add `f64` to `i32`” (E0277). Write `a as f64 + b`.' },
      { t: '`2.5` is not a valid `f64`', why: '`2.5` is a perfectly good `f64`.' },
      { t: '`i32` cannot be added at all', why: '`i32 + i32` is fine.' },
      { t: 'Variables need `mut` to be added', why: 'Reading a variable never needs `mut`; only changing it does.' },
    ],
  },
  {
    q: 'What does `300_i32 as u8` give?',
    options: [
      { t: '`255`, the largest `u8`', why: 'That is what a float would do (float-to-integer casts saturate). Integer-to-integer casts keep the low bits.' },
      { t: '`44`', correct: true, why: 'Only the low eight bits are kept: 300 is 256 + 44.' },
      { t: 'A panic', why: '`as` never panics; it quietly loses what does not fit.' },
      { t: 'A compile error', why: 'It compiles: `as` is allowed between any two integer types.' },
    ],
  },
];
