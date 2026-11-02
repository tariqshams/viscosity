// Chapter 117 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 117, 117, 117, 117.

export const prompts = {
  'vr-let-const': {
    q: 'Which TypeScript keyword behaves like Rust’s plain `let`?',
    a: '`const`: the variable cannot be assigned again.',
  },
  'vr-deep': {
    q: 'In TypeScript you can `push` onto a `const` array. Can you push onto a Rust `Vec` bound with plain `let`?',
    a: 'No. Rust’s immutability covers the value itself, so you need `let mut` (rustc reports E0596).',
  },
  'vr-int-div': {
    q: 'What is `7 / 2` in Rust, with no type annotations? And `-7 / 2`?',
    a: '`3` and `-3`. Both are `i32`, and integer division cuts toward zero.',
  },
  'vr-overflow': {
    q: 'A `u8` holding 255 gets `+ 1`. What happens in a debug build, and in a release build?',
    a: 'Debug: the program panics (“attempt to add with overflow”). Release: by default it wraps to 0. Either way it is a bug, unless you used `wrapping_add`.',
  },
  'fn-param-types': {
    q: 'Can Rust infer the types of a function’s parameters, as TypeScript sometimes does?',
    a: 'No. Every parameter of a `fn` must be written with its type.',
  },
  'fn-no-arrow': {
    q: 'What does a function with no `-> Type` return?',
    a: 'The unit value `()`.',
  },
  'ex-semicolon': {
    q: 'What does adding `;` after an expression do?',
    a: 'It turns the expression into a statement and throws its value away; a block ending that way is worth `()`.',
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
  mean: {
    optional: true,
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

In the third test, \`(m - 0.333333).abs() < 1e-5\` checks that the answer is *close to* a third, because one third cannot be stored exactly in an \`f64\` (as *How JavaScript stores numbers, objects and fields* showed for JavaScript’s numbers, which are the same type).

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
  'scanner-helpers': {
    lang: 'rust',
    title: 'Three small scanner helpers',
    prompt: `A scanner asks the same questions about bytes all day. Write three functions:

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
    optional: true,
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
};

export const quiz = [
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
];
