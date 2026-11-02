// Chapter 300-b cards (the second half of chapter 300): recall prompts,
// examples, exercises and quiz. Keys are stable ids: renaming one would
// orphan readers' review history.

export const prompts = {
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
      { t: 'A compile error: blocks cannot be assigned', why: 'Blocks are expressions in Rust, so they can be.' },
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
      { t: 'It needs `return`', why: '`return` is optional; the real problem is the semicolon.' },
      { t: '`n` must be declared `mut`', why: '`n` is only read, never changed.' },
      { t: 'The semicolon makes the body end in a statement, so it returns `()`, not an `i32`', correct: true, why: 'rustc says “expected `i32`, found `()`” and suggests removing the semicolon.' },
      { t: 'Function names cannot contain the word `double`', why: '`double` is not a Rust keyword.' },
    ],
  },
  {
    q: 'Which line is a correct Rust version of TypeScript’s `const m = a > b ? a : b;`?',
    options: [
      { t: '`let m = a > b ? a : b;`', why: 'Rust has no `? :` ternary; rustc says so in those words.' },
      { t: '`let m = if a > b { a; } else { b; };`', why: 'The semicolons make both branches `()`.' },
      { t: '`let m = if (a > b) a else b;`', why: 'Rust requires braces round each branch.' },
      { t: '`let m = if a > b { a } else { b };`', correct: true, why: '`if` is an expression; each branch’s block produces its value.' },
    ],
  },
  {
    q: 'What does `let s = if ok { 1 };` (no `else`) do?',
    options: [
      { t: 'A compile error: `if` may be missing an `else` clause', correct: true, why: 'Without `else`, the `if` produces `()` when `ok` is false, which does not match the integer branch (E0317).' },
      { t: '`s` is 1 or `undefined`', why: 'Rust has no `undefined`.' },
      { t: '`s` is 1 or 0', why: 'Rust never invents a default value for a missing branch.' },
      { t: 'It compiles, and `s` is always 1', why: 'The `if` only produces 1 when `ok` is true.' },
    ],
  },
  {
    q: 'Your Drip VM compiles `a || b` with a jump that leaves one value on the stack. What would a Drip `if` expression need beyond the `if` statement’s jumps?',
    options: [
      { t: 'A new kind of jump instruction', why: 'The same `JumpUnless` and `Jump` work.' },
      { t: 'A garbage collector pass', why: 'Collection has nothing to do with it.' },
      { t: 'A second stack', why: 'One value on the one stack is all an expression leaves.' },
      { t: 'Each branch compiles an expression whose value stays on the stack', correct: true, why: 'Same jumps, but the branches leave their value instead of being statements.' },
    ],
  },
];
