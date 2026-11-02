// Chapter 333 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
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
};

export const examples = {};

export const exercises = {
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
};

export const quiz = [
  {
    q: 'What does a Rust function declared with no `->` return?',
    options: [
      { t: 'Whatever its last line works out to', why: 'Without `->`, its return type is `()`, and returning anything else is an error.' },
      { t: '`undefined`', why: 'That is JavaScript. Rust’s “nothing” is `()`.' },
      { t: '`()`, the unit value', correct: true, why: 'Leaving out `-> Type` means the function returns unit.' },
      { t: 'Nothing; such functions cannot be called in expressions', why: 'They can. The call’s value is just `()`.' },
    ],
  },
  {
    q: '`fn area(w: i32, h: i32) -> i32` is called as `area(3, 2.5)`. What happens?',
    options: [
      { t: '`2.5` is cut to `2` and the answer is 6', why: 'Rust never converts a float to an integer without `as`.' },
      { t: 'A compile error: expected `i32`, found floating-point number', correct: true, why: 'E0308. The call does not fit the signature, so the program is never built.' },
      { t: 'A crash when the line runs', why: 'Types are checked before the program runs, not while it runs.' },
      { t: 'The answer is 7.5', why: 'That would need `f64` parameters; these are `i32`.' },
    ],
  },
  {
    q: 'Why does `fn area(w, h) -> i32 { return w * h; }` not compile?',
    options: [
      { t: '`w` and `h` must be declared with `let`', why: 'Parameters are declared in the signature, never with `let`.' },
      { t: 'It needs `return` written twice', why: 'One `return` is fine.' },
      { t: 'The return type must come first', why: 'The return type goes after the arrow, as written.' },
      { t: 'Every parameter needs a type, and these have none', correct: true, why: 'rustc stops at the comma: “expected one of `:`, `@`, or `|`”, and suggests giving the parameter a type.' },
    ],
  },
  {
    q: 'Which of these can a TypeScript function do that a Rust function cannot?',
    options: [
      { t: 'Return early with `return`', why: 'Rust has `return` too, and it ends the call at once.' },
      { t: 'Give a parameter a default value', correct: true, why: 'Rust reports “parameter defaults are not supported”. Each call passes every argument.' },
      { t: 'Call another function', why: 'Rust functions call each other freely.' },
      { t: 'Be called before it is defined in the file', why: 'Rust allows that too: functions can be in any order.' },
    ],
  },
  {
    q: '`main` calls `helper()`, which is defined further down the same file. What happens?',
    options: [
      { t: 'It works: function order does not matter in Rust', correct: true, why: 'rustc reads the whole file before checking calls, so functions can be in any order.' },
      { t: 'A compile error: `helper` is not defined yet', why: 'That is how C behaves without a declaration; Rust does not need one.' },
      { t: 'It works only if `helper` is marked `pub`', why: '`pub` is about other crates using it, not about order.' },
      { t: 'It compiles, but crashes when `main` runs', why: 'Nothing about order is checked at run time.' },
    ],
  },
];
