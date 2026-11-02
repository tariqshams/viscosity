// Chapter 185 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 117, 117, 117, 117.

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
  'fn-param-types': {
    q: 'Can Rust infer the types of a function’s parameters, as TypeScript sometimes does?',
    a: 'No. Every parameter of a `fn` must be written with its type.',
  },
  'fn-why-types': {
    q: 'Why does Rust insist on types in every signature?',
    a: 'With every signature complete, the compiler rarely needs annotations anywhere else, and its errors can point at the exact call that broke the contract.',
  },
  'fn-order': {
    q: 'Must a Rust function be defined above the code that calls it?',
    a: 'No. Functions may appear in any order; rustc reads the whole file before checking calls.',
  },
  'fn-arg-count': {
    q: 'You call `area(3)` where `area` takes two `i32`s. When do you find out, and what does rustc say?',
    a: 'While compiling: E0061, “this function takes 2 arguments but 1 argument was supplied”.',
  },
  'fn-no-arrow': {
    q: 'What does a function with no `-> Type` return?',
    a: 'The unit value `()`.',
  },
  'fn-unit': {
    q: 'What is `()` in Rust, and what plays its part in TypeScript?',
    a: 'The unit value: Rust’s “nothing to report”. It plays the part of `void`.',
  },
  'fn-no-defaults': {
    q: 'Can a Rust function give a parameter a default value, or be overloaded with a second signature?',
    a: 'Neither. Defaults are “not supported”, and a second function with the same name is E0428.',
  },
  'fn-early-return': {
    q: 'A function has two `return` statements. Which value does a call produce?',
    a: 'The value of the first `return` that runs; it ends the call at once.',
  },
  'ex-block-value': {
    q: 'What is the value of a block `{ ... }` in Rust?',
    a: 'The value of its final expression, the last line written without a semicolon.',
  },
  'ex-semicolon': {
    q: 'What does adding `;` after an expression do?',
    a: 'It turns the expression into a statement and throws its value away; a block ending that way is worth `()`.',
  },
  'ex-let-stmt': {
    q: 'Why is `let x = let y = 6;` an error in Rust?',
    a: '`let` is a statement, so it has no value to assign.',
  },
  'ex-if-types': {
    q: 'Why does `let s = if b { 1 } else { "no" };` not compile?',
    a: 'An `if` expression has one type, so both branches must produce the same type. Here one is an integer and one is text.',
  },
  'ex-if-else': {
    q: 'Why does `let s = if ok { 1 };` (no `else`) not compile?',
    a: 'When `ok` is false there is no value; an `if` without `else` is worth `()`, which does not match `1` (E0317).',
  },
  'ex-no-truthy': {
    q: 'Can an `if` condition in Rust be a number, as `if (n)` can in TypeScript?',
    a: 'No. The condition must be a `bool`; `if n` with a number is “expected `bool`, found integer”.',
  },
  'fn-tail': {
    q: 'In `fn add(a: i32, b: i32) -> i32 { a + b }`, what makes `a + b` the return value?',
    a: 'It is the body block’s final expression, with no semicolon. No `return` is needed.',
  },
  'ex-found-unit': {
    q: 'rustc says “expected `i32`, found `()`” about a function body. What is the usual cause?',
    a: 'A semicolon after the final expression, which turned the return value into a statement.',
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
  exprs: {
    title: 'Blocks and ifs with values',
    lang: 'rust',
    code: `fn clamp(x: i32, lo: i32, hi: i32)
    -> i32 {
    if x < lo {
        lo
    } else if x > hi {
        hi
    } else {
        x
    }
}

fn main() {
    let y = {
        let a = 3;
        a + 1
    };
    println!("{y}");
    println!("{}", clamp(15, 0, 10));

    let n = -2;
    let label = if n < 0 {
        "negative"
    } else {
        "not negative"
    };
    println!("{label}");
}`,
  },
};

export const exercises = {
  'sum-to': {
    lang: 'rust',
    title: 'Make the counter count',
    prompt: 'This function should add up the whole numbers from 1 to `n` (so `sum_to(4)` is 1 + 2 + 3 + 4 = 10), but it does not compile. Read what rustc would say, and fix it by changing **only** how the variables are declared.',
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
  mean: {
    lang: 'rust',
    title: 'The mean, without losing the half',
    prompt: 'A benchmark harness adds up its run times in whole milliseconds (an `i32`) and counts its runs (another `i32`). Write `mean(total, count)` so it returns the mean as an `f64`, **keeping the fraction**: `mean(7, 2)` is `3.5`.',
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
    prompt: 'Drip bytecode is a list of `u8`s. Write `next(x)`, which returns `x + 1` as a `u8`, except that `next(255)` must be `0` (wrap around, like a one-byte counter), in debug **and** release builds.',
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
  'scanner-helpers': {
    lang: 'rust',
    title: 'Three small scanner helpers',
    prompt: `A scanner asks the same questions about bytes all day. Write three functions, each with \`return\`:

- \`is_digit(c)\`: \`true\` when \`c\` is a byte from \`b'0'\` to \`b'9'\`.
- \`is_alpha(c)\`: \`true\` for an ASCII letter (\`b'a'\` to \`b'z'\` or \`b'A'\` to \`b'Z'\`) or \`b'_'\`.
- \`is_alnum(c)\`: \`true\` when either of the other two is; **call them** rather than repeating their tests.

A byte literal like \`b'0'\` is the \`u8\` value of that character, and bytes compare with \`>=\` and \`<=\` like any numbers.`,
    starter: `fn is_digit(c: u8) -> bool {
    todo!()
}

fn is_alpha(c: u8) -> bool {
    todo!()
}

fn is_alnum(c: u8) -> bool {
    todo!()
}`,
    solution: `fn is_digit(c: u8) -> bool {
    return c >= b'0' && c <= b'9';
}

fn is_alpha(c: u8) -> bool {
    return (c >= b'a' && c <= b'z')
        || (c >= b'A' && c <= b'Z')
        || c == b'_';
}

fn is_alnum(c: u8) -> bool {
    return is_digit(c) || is_alpha(c);
}`,
    tests: `#[test]
fn digits_are_digits() {
    assert!(is_digit(b'0'));
    assert!(is_digit(b'7'));
    assert!(is_digit(b'9'));
    assert!(!is_digit(b'a'));
    assert!(!is_digit(b'/'));
}

#[test]
fn letters_and_underscore_are_alpha() {
    assert!(is_alpha(b'x'));
    assert!(is_alpha(b'Q'));
    assert!(is_alpha(b'_'));
    assert!(!is_alpha(b'3'));
    assert!(!is_alpha(b' '));
}

#[test]
fn alnum_is_either() {
    assert!(is_alnum(b'z'));
    assert!(is_alnum(b'5'));
    assert!(is_alnum(b'_'));
    assert!(!is_alnum(b'+'));
}`,
    hints: [
      'Each function takes one `u8` and returns a `bool`, so each body can be a single `return` of a comparison.',
      'A digit is between `b\'0\'` and `b\'9\'`, both ends included: `c >= b\'0\' && c <= b\'9\'`. For letters there are two ranges, joined with `||`, plus `c == b\'_\'`.',
      '`is_alnum` is one line that calls the other two: `return is_digit(c) || is_alpha(c);`.',
    ],
    walkthrough: `**How to think about it.** In ASCII the digits \`0\` to \`9\` sit side by side, as the bytes 48 to 57, and so do the lowercase letters (97 to 122) and the uppercase ones (65 to 90). So “is this a digit?” is “is this byte between \`b'0'\` and \`b'9'\`?”, a pair of comparisons, and a byte literal lets you write the ends without remembering the numbers. Each function is one question with a yes or no answer, so each returns a \`bool\`. The third question is “either of the first two”, and the point of a function is that you can ask it again by name instead of copying its insides.

**The solution, line by line.**

- \`fn is_digit(c: u8) -> bool {\` takes one byte and promises a \`bool\`.
- \`return c >= b'0' && c <= b'9';\` is true only when both comparisons are: \`c\` is at least the byte for \`0\` and at most the byte for \`9\`. For \`b'7'\` (55) both hold; for \`b'/'\` (47, just below \`0\`) the first fails.
- \`fn is_alpha(c: u8) -> bool {\` has the same shape.
- \`return (c >= b'a' && c <= b'z')\` tests the lowercase range; the brackets are not required (\`&&\` binds tighter than \`||\`) but make the three cases easy to read.
- \`|| (c >= b'A' && c <= b'Z')\` adds the uppercase range; the line break is fine, because the statement only ends at the semicolon.
- \`|| c == b'_';\` adds the underscore, which Drip allows in names.
- \`fn is_alnum(c: u8) -> bool {\` asks “digit or letter?”...
- \`return is_digit(c) || is_alpha(c);\` ...by calling the other two. Each call is checked against its signature (one \`u8\` in, one \`bool\` out), and \`||\` stops early, so for \`b'5'\` \`is_alpha\` is never called.

**Common wrong attempts.**

- \`c > b'0' && c < b'9'\` leaves out both ends, so \`0\` and \`9\` are not digits.
- \`c >= '0'\` (a \`char\`, without the \`b\`) does not compile: it compares a \`u8\` with a \`char\`, and rustc reports “mismatched types: expected \`u8\`, found \`char\`”. Rust does not convert between them for you.
- Forgetting \`b'_'\` in \`is_alpha\`: names like \`my_var\` would stop at the underscore.`,
    wrong: [
      {
        code: `fn is_digit(c: u8) -> bool {
    return c > b'0' && c < b'9';
}

fn is_alpha(c: u8) -> bool {
    return (c >= b'a' && c <= b'z')
        || (c >= b'A' && c <= b'Z')
        || c == b'_';
}

fn is_alnum(c: u8) -> bool {
    return is_digit(c) || is_alpha(c);
}`,
        why: 'With `>` and `<` the ends are left out: `is_digit(b\'0\')` and `is_digit(b\'9\')` are false.',
      },
      {
        code: `fn is_digit(c: u8) -> bool {
    return c >= b'0' && c <= b'9';
}

fn is_alpha(c: u8) -> bool {
    return (c >= b'a' && c <= b'z')
        || (c >= b'A' && c <= b'Z');
}

fn is_alnum(c: u8) -> bool {
    return is_digit(c) || is_alpha(c);
}`,
        why: 'The underscore is missing, so `is_alpha(b\'_\')` is false and Drip names like `my_var` would be cut short.',
      },
    ],
  },
  grade: {
    lang: 'rust',
    title: 'A letter grade, as one expression',
    prompt: 'Write `grade(score)`, which returns a `char`: `\'A\'` for 90 and up, `\'B\'` for 80 to 89, `\'C\'` for 70 to 79, and `\'F\'` below 70. Use an `if` / `else if` / `else` **expression** as the body, without `return`.',
    starter: `fn grade(score: u32) -> char {
    todo!()
}`,
    solution: `fn grade(score: u32) -> char {
    if score >= 90 {
        'A'
    } else if score >= 80 {
        'B'
    } else if score >= 70 {
        'C'
    } else {
        'F'
    }
}`,
    tests: `#[test]
fn ninety_and_up_is_a() {
    assert_eq!(grade(95), 'A');
    assert_eq!(grade(90), 'A');
}

#[test]
fn eighties_are_b() {
    assert_eq!(grade(89), 'B');
    assert_eq!(grade(80), 'B');
}

#[test]
fn seventies_are_c() {
    assert_eq!(grade(70), 'C');
}

#[test]
fn below_seventy_is_f() {
    assert_eq!(grade(69), 'F');
    assert_eq!(grade(0), 'F');
}`,
    hints: [
      'Think of the body as one value with four possible answers. Test the highest band first: `if score >= 90 { ... }`.',
      'Each branch is a block whose last line is the `char`, like `\'A\'`, with no semicolon.',
      'The whole `if` chain is the function body’s final expression, so it is the return value. Do not put a semicolon after the final `}` either.',
    ],
    walkthrough: `**How to think about it.** The function has exactly one job: produce one \`char\`. That makes the whole body one value with four possible answers, which is what an \`if\` / \`else if\` / \`else\` expression is. Order the tests from the top band down: once \`score >= 90\` has failed, you know the score is below 90, so the next test only needs \`score >= 80\`, and so on, with no need for ranges like “80 to 89”.

**The solution, line by line.**

- \`fn grade(score: u32) -> char {\` takes a whole number that cannot be negative (\`u32\`) and promises a \`char\`.
- \`if score >= 90 {\` tests the top band first.
- \`'A'\` is the branch’s only line, with no semicolon, so it is the branch block’s value. A \`char\` goes in single quotes.
- \`} else if score >= 80 {\` is only reached when the score is below 90, so this branch covers 80 to 89...
- \`'B'\` ...and is worth \`'B'\`.
- \`} else if score >= 70 {\` and \`'C'\` cover 70 to 79 in the same way.
- \`} else {\` catches everything left, below 70...
- \`'F'\` ...and is worth \`'F'\`.
- \`}\` closes the \`if\`, with no semicolon after it: the \`if\` is the last expression in the body, so its value is what \`grade\` returns.
- \`}\` closes the function.

Compare the JavaScript \`clamp\` from *Functions: naming a piece of work*, with a \`return\` in every branch. The Rust version says the same thing with less ceremony, and the compiler checks that every branch produces a \`char\`.

**Common wrong attempts.**

- A semicolon after each letter, \`'A';\`, turns each branch into a statement, so every branch is worth \`()\`: rustc says “expected \`char\`, found \`()\`”.
- \`>\` instead of \`>=\` leaves out each boundary: \`grade(90)\` gives \`'B'\`.
- Leaving off the final \`else\`: then the \`if\` has no value when every test fails, and rustc reports E0317, “\`if\` may be missing an \`else\` clause”.`,
    wrong: [
      {
        code: `fn grade(score: u32) -> char {
    if score >= 90 {
        'A';
    } else if score >= 80 {
        'B';
    } else if score >= 70 {
        'C';
    } else {
        'F';
    }
}`,
        why: 'Each semicolon turns the `char` into a statement, so every branch has the value `()`. rustc: “expected `char`, found `()`”.',
      },
      {
        code: `fn grade(score: u32) -> char {
    if score > 90 {
        'A'
    } else if score > 80 {
        'B'
    } else if score > 70 {
        'C'
    } else {
        'F'
    }
}`,
        why: '`>` leaves out the boundary: `grade(90)` gives `\'B\'`. The bands start at 90, 80 and 70, so use `>=`.',
      },
    ],
  },
  collatz: {
    optional: true,
    lang: 'rust',
    title: 'Collatz steps',
    prompt: 'Start with a number `n`. If it is even, halve it; if it is odd, make it `3 * n + 1`. Repeat until it reaches 1. Write `steps(n)`, which returns how many steps that takes (`steps(1)` is 0, `steps(6)` is 8). Use a `while` loop, and an `if` expression for the next value.',
    starter: `fn steps(n: u64) -> u32 {
    todo!()
}`,
    solution: `fn steps(n: u64) -> u32 {
    let mut n = n;
    let mut count = 0;
    while n != 1 {
        n = if n % 2 == 0 {
            n / 2
        } else {
            3 * n + 1
        };
        count += 1;
    }
    count
}`,
    tests: `#[test]
fn one_takes_no_steps() {
    assert_eq!(steps(1), 0);
}

#[test]
fn six_takes_eight() {
    assert_eq!(steps(6), 8);
}

#[test]
fn twenty_seven_takes_111() {
    assert_eq!(steps(27), 111);
}`,
    hints: [
      'Parameters are immutable like any `let`. Shadow it: `let mut n = n;`.',
      'The new value is one expression: `n = if n % 2 == 0 { n / 2 } else { 3 * n + 1 };`. Note the `;` after the whole assignment.',
      'End the function with `count`, no semicolon, so it is returned.',
    ],
    walkthrough: `**How to think about it.** Three ideas from this part meet here: shadowing (to get a changeable copy of the parameter), an \`if\` whose value is the next number, and a tail expression for the answer. Work out \`steps(6)\` by hand first: 6, 3, 10, 5, 16, 8, 4, 2, 1 is eight steps.

**The solution, line by line.**

- \`fn steps(n: u64) -> u32 {\` takes the starting number (\`u64\`, because the sequence can climb high) and returns a count.
- \`let mut n = n;\` shadows the parameter with a mutable variable of the same name; the parameter itself is immutable.
- \`let mut count = 0;\` starts the count; its type, \`u32\`, comes from being returned as one.
- \`while n != 1 {\` repeats until the sequence reaches 1. For \`n = 1\` the body never runs and the answer is 0.
- \`n = if n % 2 == 0 {\` starts an \`if\` expression whose value becomes the new \`n\`; \`%\` is the remainder, so \`n % 2 == 0\` means “even”.
- \`n / 2\` is the even branch’s value...
- \`} else { 3 * n + 1 };\` ...and this the odd branch’s. The \`;\` at the very end belongs to the assignment statement, not to either branch.
- \`count += 1;\` counts the step.
- \`}\` closes the loop.
- \`count\` with no semicolon is the body’s last expression, so it is the return value.

**Common wrong attempts.**

- Always halving (\`n = n / 2;\`): \`steps(6)\` goes 6, 3, 1 and returns 2 instead of 8.
- Forgetting \`let mut n = n;\`: \`n = ...\` is then “cannot assign to immutable argument \`n\`”.`,
    wrong: [
      {
        code: `fn steps(n: u64) -> u32 {
    let mut n = n;
    let mut count = 0;
    while n != 1 {
        n = n / 2;
        count += 1;
    }
    count
}`,
        why: 'This always halves, ignoring the odd rule: `steps(6)` goes 6, 3, 1 and returns 2 instead of 8.',
      },
      {
        code: `fn steps(n: u64) -> u32 {
    let mut count = 0;
    while n != 1 {
        n = if n % 2 == 0 {
            n / 2
        } else {
            3 * n + 1
        };
        count += 1;
    }
    count
}`,
        why: 'This does not compile: the parameter `n` is immutable, so `n = ...` is “cannot assign to immutable argument”. Shadow it with `let mut n = n;` first.',
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
      {
        t: 'Yes, `total` becomes 5',
        why: 'In TypeScript `let` would allow this, but Rust’s `let` is like `const`.',
      },
      {
        t: 'Yes, but it prints a warning',
        why: 'It is an error, not a warning: E0384, “cannot assign twice to immutable variable”.',
      },
      {
        t: 'No; it needs `let mut total = 0;`',
        correct: true,
        why: 'Without `mut`, the binding cannot be changed.',
      },
      {
        t: 'No; Rust has no `+=`',
        why: 'Rust has `+=`. The problem is the missing `mut`.',
      },
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
      {
        t: '`10`',
        correct: true,
        why: 'Each `let` makes a new `x` from the previous one: 4, then 5, then 10. Shadowing, not mutation.',
      },
      {
        t: '`4`',
        why: 'The later `let`s make new variables, and the name `x` refers to the newest one.',
      },
      {
        t: 'A compile error: `x` is immutable',
        why: 'No variable is assigned twice. Each line declares a fresh `x`.',
      },
      {
        t: '`8`',
        why: 'The `+ 1` happens first: (4 + 1) × 2.',
      },
    ],
  },
  {
    q: `Why does this fail, when the shadowing version would not?
\`\`\`rust
let mut n = "5";
n = 5;
\`\`\``,
    options: [
      {
        t: '`n` needs to be declared without `mut`',
        why: 'Without `mut` the assignment would fail for a different reason (E0384).',
      },
      {
        t: 'Assignment keeps the variable’s type, and `n` holds text, not a number',
        correct: true,
        why: 'rustc reports E0308, “expected `&str`, found integer”. A second `let n = 5;` would make a new variable instead.',
      },
      {
        t: 'Numbers can never be assigned in Rust',
        why: 'They can, to a `mut` variable of a number type.',
      },
      {
        t: 'It compiles, and `n` becomes 5',
        why: 'Rust never changes a variable’s type behind your back.',
      },
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
      {
        t: '`2`',
        why: 'The inner `x` is a different variable, and it ended at the `}`.',
      },
      {
        t: 'A compile error: `x` declared twice',
        why: 'Shadowing is allowed, inside a block or not.',
      },
      {
        t: 'Nothing: `x` was dropped',
        why: 'The outer `x` lives until the end of the outer block.',
      },
      {
        t: '`1`',
        correct: true,
        why: 'The shadow lasted only until the end of its block; the outer `x` was never changed.',
      },
    ],
  },
  {
    q: 'Which line is a valid Rust constant?',
    options: [
      {
        t: '`const max = 256;`',
        why: 'A `const` must have its type written out.',
      },
      {
        t: '`const mut MAX: usize = 256;`',
        why: 'A `const` can never be `mut`.',
      },
      {
        t: '`const MAX_SLOTS: usize = 256;`',
        correct: true,
        why: 'Type written, value known at compile time, name in capitals by habit. This one is from the Rust Drip compiler.',
      },
      {
        t: '`let const MAX = 256;`',
        why: '`const` replaces `let`; it is not added to it.',
      },
    ],
  },
  {
    q: 'Which type would you use for an index into a `Vec`?',
    options: [
      {
        t: '`i32`',
        why: 'Indexes cannot be negative, and Rust indexes with `usize` (an `i32` index is error E0277).',
      },
      {
        t: '`f64`',
        why: 'An index is a whole number; Rust will not index with a float.',
      },
      {
        t: '`u8`',
        why: 'That only reaches 255.',
      },
      {
        t: '`usize`',
        correct: true,
        why: 'Unsigned and as wide as an address: big enough for any index the machine can reach.',
      },
    ],
  },
  {
    q: 'What is `-7 / 2` in Rust (both `i32`)?',
    options: [
      {
        t: '`-3.5`',
        why: 'That is TypeScript’s answer. Integer division gives an integer.',
      },
      {
        t: '`-4`',
        why: 'That is Python’s `//`, which rounds down. Rust cuts toward zero.',
      },
      {
        t: '`-3`',
        correct: true,
        why: 'Integer division truncates toward zero.',
      },
      {
        t: 'A compile error',
        why: 'Dividing two `i32`s is fine.',
      },
    ],
  },
  {
    q: 'A `u8` variable holds 255 and your code adds 1. You run the tests (a debug build). What happens?',
    options: [
      {
        t: 'It becomes 256',
        why: 'A `u8` cannot hold 256.',
      },
      {
        t: 'The program panics: attempt to add with overflow',
        correct: true,
        why: 'Debug builds check integer arithmetic. A release build would, by default, wrap to 0.',
      },
      {
        t: 'It becomes 0 silently',
        why: 'That is what a release build does by default. Debug builds check.',
      },
      {
        t: 'The compiler always rejects it',
        why: 'Only when it can see the overflow at compile time. Usually the value comes from elsewhere, so the check happens at run time.',
      },
    ],
  },
  {
    q: 'Why does `let a: i32 = 1; let b: f64 = 2.5; a + b` not compile?',
    options: [
      {
        t: 'Rust cannot add numbers of two different types without an explicit `as`',
        correct: true,
        why: 'rustc says “cannot add `f64` to `i32`” (E0277). Write `a as f64 + b`.',
      },
      {
        t: '`2.5` is not a valid `f64`',
        why: '`2.5` is a perfectly good `f64`.',
      },
      {
        t: '`i32` cannot be added at all',
        why: '`i32 + i32` is fine.',
      },
      {
        t: 'Variables need `mut` to be added',
        why: 'Reading a variable never needs `mut`; only changing it does.',
      },
    ],
  },
  {
    q: 'What does `300_i32 as u8` give?',
    options: [
      {
        t: '`255`, the largest `u8`',
        why: 'That is what a float would do (float-to-integer casts saturate). Integer-to-integer casts keep the low bits.',
      },
      {
        t: '`44`',
        correct: true,
        why: 'Only the low eight bits are kept: 300 is 256 + 44.',
      },
      {
        t: 'A panic',
        why: '`as` never panics; it quietly loses what does not fit.',
      },
      {
        t: 'A compile error',
        why: 'It compiles: `as` is allowed between any two integer types.',
      },
    ],
  },
  {
    q: 'What does a Rust function declared with no `->` return?',
    options: [
      {
        t: 'Whatever its last line works out to',
        why: 'Without `->`, its return type is `()`, and returning anything else is an error.',
      },
      {
        t: '`undefined`',
        why: 'That is JavaScript. Rust’s “nothing” is `()`.',
      },
      {
        t: '`()`, the unit value',
        correct: true,
        why: 'Leaving out `-> Type` means the function returns unit.',
      },
      {
        t: 'Nothing; such functions cannot be called in expressions',
        why: 'They can. The call’s value is just `()`.',
      },
    ],
  },
  {
    q: '`fn area(w: i32, h: i32) -> i32` is called as `area(3, 2.5)`. What happens?',
    options: [
      {
        t: '`2.5` is cut to `2` and the answer is 6',
        why: 'Rust never converts a float to an integer without `as`.',
      },
      {
        t: 'A compile error: expected `i32`, found floating-point number',
        correct: true,
        why: 'E0308. The call does not fit the signature, so the program is never built.',
      },
      {
        t: 'A crash when the line runs',
        why: 'Types are checked before the program runs, not while it runs.',
      },
      {
        t: 'The answer is 7.5',
        why: 'That would need `f64` parameters; these are `i32`.',
      },
    ],
  },
  {
    q: 'Why does `fn area(w, h) -> i32 { return w * h; }` not compile?',
    options: [
      {
        t: '`w` and `h` must be declared with `let`',
        why: 'Parameters are declared in the signature, never with `let`.',
      },
      {
        t: 'It needs `return` written twice',
        why: 'One `return` is fine.',
      },
      {
        t: 'The return type must come first',
        why: 'The return type goes after the arrow, as written.',
      },
      {
        t: 'Every parameter needs a type, and these have none',
        correct: true,
        why: 'rustc stops at the comma: “expected one of `:`, `@`, or `|`”, and suggests giving the parameter a type.',
      },
    ],
  },
  {
    q: 'Which of these can a TypeScript function do that a Rust function cannot?',
    options: [
      {
        t: 'Return early with `return`',
        why: 'Rust has `return` too, and it ends the call at once.',
      },
      {
        t: 'Give a parameter a default value',
        correct: true,
        why: 'Rust reports “parameter defaults are not supported”. Each call passes every argument.',
      },
      {
        t: 'Call another function',
        why: 'Rust functions call each other freely.',
      },
      {
        t: 'Be called before it is defined in the file',
        why: 'Rust allows that too: functions can be in any order.',
      },
    ],
  },
  {
    q: '`main` calls `helper()`, which is defined further down the same file. What happens?',
    options: [
      {
        t: 'It works: function order does not matter in Rust',
        correct: true,
        why: 'rustc reads the whole file before checking calls, so functions can be in any order.',
      },
      {
        t: 'A compile error: `helper` is not defined yet',
        why: 'That is how C behaves without a declaration; Rust does not need one.',
      },
      {
        t: 'It works only if `helper` is marked `pub`',
        why: '`pub` is about other crates using it, not about order.',
      },
      {
        t: 'It compiles, but crashes when `main` runs',
        why: 'Nothing about order is checked at run time.',
      },
    ],
  },
  {
    q: `What is \`y\`?
\`\`\`rust
let y = {
    let a = 2;
    a * 5
};
\`\`\``,
    options: [
      {
        t: '`()`',
        why: 'The last line, `a * 5`, has no semicolon, so it is the block’s value.',
      },
      {
        t: '`10`',
        correct: true,
        why: 'The block’s value is its final expression: 2 × 5.',
      },
      {
        t: '`2`',
        why: '`let a = 2;` is a statement inside the block; the value comes from the last line.',
      },
      {
        t: 'A compile error: blocks cannot be assigned',
        why: 'Blocks are expressions in Rust, so they can be.',
      },
    ],
  },
  {
    q: `Why does this not compile?
\`\`\`rust
fn double(n: i32) -> i32 {
    n * 2;
}
\`\`\``,
    options: [
      {
        t: 'It needs `return`',
        why: '`return` is optional; the real problem is the semicolon.',
      },
      {
        t: '`n` must be declared `mut`',
        why: '`n` is only read, never changed.',
      },
      {
        t: 'The semicolon makes the body end in a statement, so it returns `()`, not an `i32`',
        correct: true,
        why: 'rustc says “expected `i32`, found `()`” and suggests removing the semicolon.',
      },
      {
        t: 'Function names cannot contain the word `double`',
        why: '`double` is not a Rust keyword.',
      },
    ],
  },
  {
    q: 'Which line is a correct Rust version of TypeScript’s `const m = a > b ? a : b;`?',
    options: [
      {
        t: '`let m = a > b ? a : b;`',
        why: 'Rust has no `? :` ternary; rustc says so in those words.',
      },
      {
        t: '`let m = if a > b { a; } else { b; };`',
        why: 'The semicolons make both branches `()`.',
      },
      {
        t: '`let m = if (a > b) a else b;`',
        why: 'Rust requires braces round each branch.',
      },
      {
        t: '`let m = if a > b { a } else { b };`',
        correct: true,
        why: '`if` is an expression; each branch’s block produces its value.',
      },
    ],
  },
  {
    q: 'What does `let s = if ok { 1 };` (no `else`) do?',
    options: [
      {
        t: 'A compile error: `if` may be missing an `else` clause',
        correct: true,
        why: 'Without `else`, the `if` produces `()` when `ok` is false, which does not match the integer branch (E0317).',
      },
      {
        t: '`s` is 1 or `undefined`',
        why: 'Rust has no `undefined`.',
      },
      {
        t: '`s` is 1 or 0',
        why: 'Rust never invents a default value for a missing branch.',
      },
      {
        t: 'It compiles, and `s` is always 1',
        why: 'The `if` only produces 1 when `ok` is true.',
      },
    ],
  },
  {
    q: 'Your Drip VM compiles `a || b` with a jump that leaves one value on the stack. What would a Drip `if` expression need beyond the `if` statement’s jumps?',
    options: [
      {
        t: 'A new kind of jump instruction',
        why: 'The same `JumpUnless` and `Jump` work.',
      },
      {
        t: 'A garbage collector pass',
        why: 'Collection has nothing to do with it.',
      },
      {
        t: 'A second stack',
        why: 'One value on the one stack is all an expression leaves.',
      },
      {
        t: 'Each branch compiles an expression whose value stays on the stack',
        correct: true,
        why: 'Same jumps, but the branches leave their value instead of being statements.',
      },
    ],
  },
];
