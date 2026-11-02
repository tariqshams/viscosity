// Chapter 260 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'ex-block-value': {
    q: 'What is the value of a block `{ ... }` in Rust?',
    a: 'The value of its final expression, the last line written without a semicolon.',
  },
  'ex-semicolon': {
    q: 'What does adding `;` after an expression do?',
    a: 'It turns the expression into a statement and throws its value away.',
  },
  'ex-unit': {
    q: 'What is `()` in Rust?',
    a: 'The unit value: Rust’s “nothing”. A block that ends in a statement has the value `()`.',
  },
  'ex-if-types': {
    q: 'Why doesn’t `let s = if b { 1 } else { "no" };` compile?',
    a: 'An `if` expression has one type, so both branches must produce the same type. Here one is an integer and one is text.',
  },
  'ex-let-stmt': {
    q: 'Why is `let x = let y = 6;` an error in Rust?',
    a: '`let` is a statement, so it has no value to assign.',
  },
  'fn-param-types': {
    q: 'Can Rust infer the types of a function’s parameters, as TypeScript sometimes does?',
    a: 'No. Every parameter of a `fn` must be written with its type.',
  },
  'fn-tail': {
    q: 'In `fn add(a: i32, b: i32) -> i32 { a + b }`, what makes `a + b` the return value?',
    a: 'It is the body block’s final expression, with no semicolon. No `return` is needed.',
  },
  'fn-no-arrow': {
    q: 'What does a function with no `-> Type` return?',
    a: 'The unit value `()`.',
  },
  'ex-found-unit': {
    q: 'rustc says “expected `i32`, found `()`” about a function body. What is the usual cause?',
    a: 'A semicolon after the final expression, which turned the return value into a statement.',
  },
};

export const examples = {
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
  grade: {
    lang: 'rust',
    title: 'A letter grade, as one expression',
    prompt: `Write \`grade(score)\`, which returns a \`char\`: \`'A'\` for 90 and up, \`'B'\` for 80 to 89, \`'C'\` for 70 to 79, and \`'F'\` below 70. Use an \`if\` / \`else if\` / \`else\` **expression** as the body, without \`return\`.`,
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
      'Test the highest band first: `if score >= 90 { ... }`.',
      'Each branch is a block whose last line is the `char`, like `\'A\'`, with no semicolon.',
      'The whole `if` chain is the function body’s final expression, so it is the return value. Don’t put a semicolon after the final `}` either.',
    ],
    walkthrough: `Think of the body as one value with four possible answers.

- **Order the tests from the top.** Once \`score >= 90\` has failed, you know the score is below 90, so the next test only needs \`score >= 80\`.
- **Each branch is a block with a value.** \`{ 'A' }\` has the value \`'A'\` because \`'A'\` is its final expression. A \`char\` goes in single quotes.
- **The if is the function's value.** It is the last thing in the body, with no semicolon after it, so whatever branch ran is what \`grade\` returns.

Compare chapter 1's \`clamp\`, with a \`return\` in every branch. The Rust version says the same thing with less ceremony, and the compiler checks that every branch produces a \`char\`.`,
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
    prompt: `Start with a number \`n\`. If it is even, halve it; if it is odd, make it \`3 * n + 1\`. Repeat until it reaches 1. Write \`steps(n)\`, which returns how many steps that takes (\`steps(1)\` is 0, \`steps(6)\` is 8). Use a \`while\` loop, and an \`if\` expression for the next value.`,
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
    walkthrough: `Three ideas from this chapter and the last.

- **Shadowing to get a mutable copy.** The parameter \`n\` is immutable, so \`let mut n = n;\` makes a mutable variable with the same name.
- **\`if\` as a value.** The next number is either \`n / 2\` or \`3 * n + 1\`, so it is one \`if\` expression assigned to \`n\`. The \`;\` at the end belongs to the assignment statement, not to either branch.
- **The tail expression.** After the loop, \`count\` on its own is the function's value.

\`while n != 1\` reads like TypeScript without the parentheses. \`count\` is inferred as \`u32\` because it is returned as one.`,
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
        why: 'This doesn’t compile: the parameter `n` is immutable, so `n = ...` is “cannot assign to immutable argument”. Shadow it with `let mut n = n;` first.',
      },
    ],
  },
};

export const quiz = [
  {
    q: `What is \`y\`?
\`\`\`rust
let y = {
    let a = 2;
    a * 5
};
\`\`\``,
    options: [
      { t: '`()`', why: 'The last line, `a * 5`, has no semicolon, so it is the block’s value.' },
      { t: '`10`', correct: true, why: 'The block’s value is its final expression: 2 × 5.' },
      { t: '`2`', why: '`let a = 2;` is a statement inside the block; the value comes from the last line.' },
      { t: 'A compile error: blocks can’t be assigned', why: 'Blocks are expressions in Rust, so they can be.' },
    ],
  },
  {
    q: `Why doesn’t this compile?
\`\`\`rust
fn double(n: i32) -> i32 {
    n * 2;
}
\`\`\``,
    options: [
      { t: 'It needs `return`', why: '`return` is optional; the real problem is the semicolon.' },
      { t: 'The semicolon makes the body end in a statement, so it returns `()`, not an `i32`', correct: true, why: 'rustc says “expected `i32`, found `()`” and suggests removing the semicolon.' },
      { t: '`n` must be declared `mut`', why: '`n` is only read, never changed.' },
      { t: 'Function names can’t contain the word `double`', why: '`double` is not a Rust keyword.' },
    ],
  },
  {
    q: 'Which line is a correct Rust version of TypeScript’s `const m = a > b ? a : b;`?',
    options: [
      { t: '`let m = a > b ? a : b;`', why: 'Rust has no `? :` ternary.' },
      { t: '`let m = if a > b { a; } else { b; };`', why: 'The semicolons make both branches `()`.' },
      { t: '`let m = if (a > b) a else b;`', why: 'Rust requires braces around each branch.' },
      { t: '`let m = if a > b { a } else { b };`', correct: true, why: '`if` is an expression; each branch’s block produces its value.' },
    ],
  },
  {
    q: 'What does `let s = if ok { 1 };` (no `else`) do?',
    options: [
      { t: 'A compile error: `if` may be missing an `else` clause', correct: true, why: 'Without `else`, the `if` produces `()` when `ok` is false, which doesn’t match the integer branch (E0317).' },
      { t: '`s` is 1 or `undefined`', why: 'Rust has no `undefined`.' },
      { t: '`s` is 1 or 0', why: 'Rust never invents a default value for a missing branch.' },
      { t: 'It compiles, and `s` is always 1', why: 'The `if` only produces 1 when `ok` is true.' },
    ],
  },
  {
    q: 'What does a Rust function declared with no `->` return?',
    options: [
      { t: 'Whatever its last line evaluates to', why: 'Without `->`, its return type is `()`, and a last expression of another type is an error.' },
      { t: '`undefined`', why: 'That’s JavaScript. Rust’s “nothing” is `()`.' },
      { t: '`()`, the unit value', correct: true, why: 'Leaving out `-> Type` means the function returns unit.' },
      { t: 'Nothing; such functions can’t be called in expressions', why: 'They can. The call’s value is just `()`.' },
    ],
  },
  {
    q: 'Your Drip VM compiles `a or b` with jumps that leave one value on the stack. What would a Drip `if` expression need beyond the `if` statement’s jumps?',
    options: [
      { t: 'A new kind of jump instruction', why: 'The same `JUMP_IF_FALSE` and `JUMP` work.' },
      { t: 'A garbage collector pass', why: 'Collection has nothing to do with it.' },
      { t: 'A second stack', why: 'One value on the one stack is all an expression leaves.' },
      { t: 'Each branch compiles an expression whose value stays on the stack', correct: true, why: 'Same jumps, but the branches leave their value instead of being statements.' },
    ],
  },
];
