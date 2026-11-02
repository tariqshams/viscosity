// Chapter 122 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 122, 122.

export const prompts = {
  'enum-vs-union': {
    q: 'Which TypeScript feature is a Rust enum with data closest to?',
    a: 'A discriminated union: the variant is the tag, and its data is the payload.',
  },
  'match-exhaustive': {
    q: 'What happens if a `match` doesn’t cover every possible value?',
    a: 'It doesn’t compile (E0004), and the error names a value that isn’t covered.',
  },
  'match-expr': {
    q: 'Can a `match` produce a value, like `let n = match v { ... };`, and what must be true of its arms?',
    a: 'Yes, it is an expression; every arm must produce the same type (or E0308).',
  },
  'pattern-guard': {
    q: 'What does `if n < 0.0` add to the arm `Value::Number(n) if n < 0.0 => ...`?',
    a: 'A match guard: the arm runs only if the pattern fits *and* the condition is true.',
  },
  refutable: {
    q: 'Why does `let Value::Number(n) = v;` fail to compile?',
    a: 'The pattern is refutable (`v` might be another variant), and a plain `let` needs an irrefutable one (E0005).',
  },
  'pattern-wild': {
    q: 'What does `_` match, and what does it cost you?',
    a: 'Anything, without binding it. It also stops the compiler from telling you about cases you forgot, including variants added later.',
  },
  'pattern-bind': {
    q: 'With `let limit = 3;`, what does the arm `limit => ...` match?',
    a: 'Anything: `limit` in a pattern is a new variable, not a comparison. Use a guard, `x if x == limit`.',
  },
};

export const examples = {
  values: {
    lang: 'rust',
    title: 'Drip values as an enum',
    code: `enum Value {
    None,
    Bool(bool),
    Number(f64),
}

fn show(v: &Value) -> String {
    match v {
        Value::None => {
            String::from("none")
        }
        Value::Bool(b) => b.to_string(),
        Value::Number(n) => {
            n.to_string()
        }
    }
}

fn truthy(v: &Value) -> bool {
    match v {
        Value::None => false,
        Value::Bool(b) => *b,
        Value::Number(_) => true,
    }
}

fn main() {
    let vs = [
        Value::None,
        Value::Bool(false),
        Value::Number(2.5),
    ];
    for v in &vs {
        let t = truthy(v);
        println!("{} {}", show(v), t);
    }
}`,
  },
  patterns: {
    lang: 'rust',
    title: 'Ranges, alternatives and guards',
    code: `fn kind(c: u8) -> &'static str {
    match c {
        b'0'..=b'9' => "digit",
        b'a'..=b'z'
        | b'A'..=b'Z'
        | b'_' => "letter",
        b' ' | b'\\n' => "space",
        _ => "other",
    }
}

fn sign(n: f64) -> &'static str {
    match n {
        x if x < 0.0 => "negative",
        x if x == 0.0 => "zero",
        _ => "positive",
    }
}

fn main() {
    for c in "x1 +".bytes() {
        println!("{}", kind(c));
    }
    let (a, b) = (-2.0, 0.0);
    println!("{} {}", sign(a), sign(b));
}`,
  },
};

export const exercises = {
  miniVm: {
    lang: 'rust',
    title: 'A five-instruction VM',
    prompt: 'Finish `eval`, a tiny stack VM in the style of the Rust Drip VM’s `run` loop (`while` and indexing work as in TypeScript). `Push(v)` pushes `v`. `Add`, `Sub` and `Mul` pop the top two values and push the result, with the **lower** value on the left (`Push(10.0), Push(4.0), Sub` gives 6). `Neg` replaces the top value with its negation. Return the value on top at the end. Replace the `_ => todo!()` arm with real arms, and don’t keep a `_` arm.',
    starter: `enum Op {
    Push(f64),
    Add,
    Sub,
    Mul,
    Neg,
}

fn eval(code: &[Op]) -> f64 {
    let mut st = [0.0; 16];
    let mut top = 0;
    let mut i = 0;
    while i < code.len() {
        match code[i] {
            Op::Push(v) => {
                st[top] = v;
                top += 1;
            }
            _ => todo!(),
        }
        i += 1;
    }
    st[top - 1]
}`,
    solution: `enum Op {
    Push(f64),
    Add,
    Sub,
    Mul,
    Neg,
}

fn eval(code: &[Op]) -> f64 {
    let mut st = [0.0; 16];
    let mut top = 0;
    let mut i = 0;
    while i < code.len() {
        match code[i] {
            Op::Push(v) => {
                st[top] = v;
                top += 1;
            }
            Op::Add => {
                top -= 1;
                st[top - 1] += st[top];
            }
            Op::Sub => {
                top -= 1;
                st[top - 1] -= st[top];
            }
            Op::Mul => {
                top -= 1;
                st[top - 1] *= st[top];
            }
            Op::Neg => {
                st[top - 1] *= -1.0;
            }
        }
        i += 1;
    }
    st[top - 1]
}`,
    tests: `#[test]
fn push_leaves_the_value() {
    assert_eq!(eval(&[Op::Push(7.0)]), 7.0);
}
#[test]
fn adds() {
    let code = [
        Op::Push(2.0),
        Op::Push(3.0),
        Op::Add,
    ];
    assert_eq!(eval(&code), 5.0);
}
#[test]
fn subtracts_in_the_right_order() {
    let code = [
        Op::Push(10.0),
        Op::Push(4.0),
        Op::Sub,
    ];
    assert_eq!(eval(&code), 6.0);
}
#[test]
fn negates() {
    let code = [Op::Push(5.0), Op::Neg];
    assert_eq!(eval(&code), -5.0);
}
#[test]
fn runs_a_longer_program() {
    // -(2 * 3 - 1)
    let code = [
        Op::Push(2.0),
        Op::Push(3.0),
        Op::Mul,
        Op::Push(1.0),
        Op::Sub,
        Op::Neg,
    ];
    assert_eq!(eval(&code), -5.0);
}`,
    hints: [
      'Write one arm per variant: `Op::Add => { ... }`, and so on. Once all five are there, the `_` arm has nothing left to catch, so delete it.',
      'For a binary operator, step `top` down first. Then the right operand is `st[top]` and the left one is `st[top - 1]`, which is also where the result goes.',
      '`Op::Sub` is `st[top - 1] -= st[top];` after `top -= 1;`. `Op::Neg` doesn’t change `top`: `st[top - 1] *= -1.0;` flips the sign in place.',
    ],
    walkthrough: `**How to think about it.** This is the companion VM's \`run\` in miniature: a loop over the instructions, one \`match\` on each, one arm per opcode. Before writing arms, run a program by hand on paper. For \`Push(10.0), Push(4.0), Sub\`: after the two pushes, slot 0 holds 10 and slot 1 holds 4, and \`top\` is 2 (the number of values, which is also the first free slot). \`Sub\` must leave one value, \`10 - 4 = 6\`, in slot 0, with \`top\` back at 1. The left operand is the one *lower* on the stack, because it was pushed first.

**The solution, arm by arm.**

- \`Op::Push(v) => { st[top] = v; top += 1; }\` was given. The pattern \`Op::Push(v)\` fits any \`Push\` and names its payload \`v\` (an \`f64\` is copied out, so nothing is moved out of \`code\`).
- \`Op::Add => {\` handles addition.
- \`top -= 1;\` pops the right operand: it is now at \`st[top]\`, the first free slot again.
- \`st[top - 1] += st[top];\` adds it into the left operand, which sits just below and also receives the result.
- \`Op::Sub\` and \`Op::Mul\` are the same two lines with \`-=\` and \`*=\`. For \`Sub\`, \`st[top - 1] -= st[top]\` is \`a - b\` with \`a\` the lower value, just like \`pop_numbers\` in the Rust VM, which reads \`peek(1)\` as \`a\` and \`peek(0)\` as \`b\`.
- \`Op::Neg => { st[top - 1] *= -1.0; }\` flips the sign of the top value in place, leaving \`top\` unchanged.
- With all five variants written, the \`_ => todo!()\` arm is deleted: the match is exhaustive on its own.

**Why no \`_\` arm.** Add a sixth variant, \`Div\`, to \`Op\`, and this function stops compiling with E0004 until you write its arm. With a \`_ => {}\` arm it would compile and quietly do nothing for \`Div\`, which is exactly the bug the second wrong attempt below has.

**Common wrong attempts.**

- Computing \`b - a\` (the top value minus the one under it): \`10 4 Sub\` gives -6. Operand order is the classic stack-machine slip.
- Keeping \`_ => {}\` to make the error go away: \`Neg\` is silently ignored, and the compiler can no longer help, because \`_\` counts as covering every variant.`,
    wrong: [
      {
        code: `enum Op {
    Push(f64),
    Add,
    Sub,
    Mul,
    Neg,
}

fn eval(code: &[Op]) -> f64 {
    let mut st = [0.0; 16];
    let mut top = 0;
    let mut i = 0;
    while i < code.len() {
        match code[i] {
            Op::Push(v) => {
                st[top] = v;
                top += 1;
            }
            Op::Add => {
                top -= 1;
                st[top - 1] += st[top];
            }
            Op::Sub => {
                top -= 1;
                let b = st[top];
                let a = st[top - 1];
                st[top - 1] = b - a;
            }
            Op::Mul => {
                top -= 1;
                st[top - 1] *= st[top];
            }
            Op::Neg => {
                st[top - 1] *= -1.0;
            }
        }
        i += 1;
    }
    st[top - 1]
}`,
        why: 'This computes `b - a`: the top value minus the one under it. `10 4 Sub` gives -6. The left operand is the one lower on the stack.',
      },
      {
        code: `enum Op {
    Push(f64),
    Add,
    Sub,
    Mul,
    Neg,
}

fn eval(code: &[Op]) -> f64 {
    let mut st = [0.0; 16];
    let mut top = 0;
    let mut i = 0;
    while i < code.len() {
        match code[i] {
            Op::Push(v) => {
                st[top] = v;
                top += 1;
            }
            Op::Add => {
                top -= 1;
                st[top - 1] += st[top];
            }
            Op::Sub => {
                top -= 1;
                st[top - 1] -= st[top];
            }
            Op::Mul => {
                top -= 1;
                st[top - 1] *= st[top];
            }
            _ => {}
        }
        i += 1;
    }
    st[top - 1]
}`,
        why: 'The `_ => {}` arm swallows `Neg`, so negation silently does nothing, and the compiler can’t warn you, because `_` counts as covering it. Write the `Op::Neg` arm and drop the wildcard.',
      },
    ],
  },
  valuesEqual: {
    optional: true,
    lang: 'rust',
    title: 'Drip’s ==, variant first',
    prompt: 'Write `equal(a, b)` with Drip’s rules for `==`: values of different variants are never equal (`none == false` is false, and so is `0 == false`); two `none`s are equal; two booleans, or two numbers, are equal when their payloads are equal (`==` on the payloads). Match on the pair `(a, b)`.',
    starter: `#[derive(Clone, Copy)]
enum Value {
    None,
    Bool(bool),
    Number(f64),
}

fn equal(a: Value, b: Value) -> bool {
    false
}`,
    solution: `#[derive(Clone, Copy)]
enum Value {
    None,
    Bool(bool),
    Number(f64),
}

fn equal(a: Value, b: Value) -> bool {
    match (a, b) {
        (Value::None, Value::None) => {
            true
        }
        (
            Value::Bool(x),
            Value::Bool(y),
        ) => x == y,
        (
            Value::Number(x),
            Value::Number(y),
        ) => x == y,
        _ => false,
    }
}`,
    tests: `#[test]
fn none_equals_none() {
    assert!(equal(Value::None, Value::None));
}
#[test]
fn same_variant_compares_payloads() {
    let one = Value::Number(1.0);
    let two = Value::Number(2.0);
    assert!(equal(one, one));
    assert!(!equal(one, two));
    let t = Value::Bool(true);
    assert!(!equal(t, Value::Bool(false)));
}
#[test]
fn different_variants_are_never_equal() {
    let f = Value::Bool(false);
    assert!(!equal(Value::None, f));
    assert!(!equal(Value::Number(0.0), f));
}`,
    hints: [
      'There are three “same variant” cases and one “anything else” case. Matching on the pair `(a, b)` lets one arm look at both values at once.',
      'Write an arm for each same-variant pair: `(Value::None, Value::None) => true`, then the `Bool` pair and the `Number` pair, each binding both payloads.',
      'For the pairs with data, `(Value::Number(x), Value::Number(y)) => x == y`. Every other pair has different variants, so a final `_ => false` is exactly right here.',
    ],
    walkthrough: `**How to think about it.** Write out the table of pairs: the first value can be any of three variants and so can the second, so there are nine combinations. Three of them have the same variant on both sides (none and none, bool and bool, number and number), and the rule says those compare their payloads. The other six all have the same answer, \`false\`. That shape, "a few cases that each need their own answer, and the rest that share one", is exactly what a tuple pattern plus a wildcard expresses.

**The solution, line by line.**

- \`match (a, b) {\` builds a tuple of the two values and matches on it, so each arm can describe both at once. (\`Value\` derives \`Copy\`, so the values are copied into the tuple and nothing is moved.)
- \`(Value::None, Value::None) => { true }\` fits only when both are \`none\`, which are always equal.
- \`(Value::Bool(x), Value::Bool(y),) => x == y,\` fits when both are booleans, binding the two payloads as \`x\` and \`y\` and comparing them.
- \`(Value::Number(x), Value::Number(y),) => x == y,\` does the same for numbers. The names \`x\` and \`y\` are new in each arm, so reusing them is fine. (Because \`==\` on \`f64\` follows IEEE floating point, \`NaN == NaN\` is false, which is also what Drip does.)
- \`_ => false,\` catches the six mixed pairs. Here the wildcard is the honest choice, since every remaining case really has one answer.

**Why not \`a == b\`?** \`Value\` does not implement \`PartialEq\` here (the chapter *Traits, trait objects and derive* explains what that means), so \`==\` on two \`Value\`s does not compile. The real companion VM derives it, and its comment says the derived \`==\` is Drip's \`==\`: exactly these rules.

**Common wrong attempts.**

- Comparing only the variants and ignoring the payloads (\`(Value::Number(_), Value::Number(_)) => true\`) makes \`1 == 2\` true.
- Leaving out the \`(Value::None, Value::None)\` arm sends that pair to \`_\` and returns \`false\`, so \`none == none\` is false.`,
    wrong: [
      {
        code: `#[derive(Clone, Copy)]
enum Value {
    None,
    Bool(bool),
    Number(f64),
}

fn equal(a: Value, b: Value) -> bool {
    match (a, b) {
        (Value::None, Value::None) => {
            true
        }
        (
            Value::Bool(_),
            Value::Bool(_),
        ) => true,
        (
            Value::Number(_),
            Value::Number(_),
        ) => true,
        _ => false,
    }
}`,
        why: 'Same variant isn’t enough: the payloads must be equal too. This says `1 == 2`.',
      },
      {
        code: `#[derive(Clone, Copy)]
enum Value {
    None,
    Bool(bool),
    Number(f64),
}

fn equal(a: Value, b: Value) -> bool {
    match (a, b) {
        (
            Value::Bool(x),
            Value::Bool(y),
        ) => x == y,
        (
            Value::Number(x),
            Value::Number(y),
        ) => x == y,
        _ => false,
    }
}`,
        why: 'The pair `(None, None)` falls through to `_`, so `none == none` comes out false.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Your `enum Op` gets a new variant, `Div`. What happens to a `match op` that lists every other variant and has no catch-all arm?',
    options: [
      {
        t: 'It runs, and does nothing for `Div`',
        why: 'That is what a `_ => {}` arm would do. Without one, the match no longer covers every value.',
      },
      {
        t: 'It panics when it first sees `Div`',
        why: 'The problem is caught long before the program runs.',
      },
      {
        t: 'It stops compiling: non-exhaustive patterns, `Op::Div` not covered',
        correct: true,
        why: 'Exhaustiveness is checked at compile time, for every possible value.',
      },
    ],
  },
  {
    q: 'Which TypeScript type is closest to `enum Value { None, Bool(bool), Number(f64) }`?',
    options: [
      {
        t: '`{ none: null; bool: boolean; num: number }`',
        why: 'That object has all three at once. An enum value is exactly one variant.',
      },
      {
        t: '`{ tag: \'none\' } | { tag: \'bool\'; as: boolean } | { tag: \'num\'; as: number }`',
        correct: true,
        why: 'A discriminated union: a tag that picks the case, plus that case’s payload.',
      },
      {
        t: '`null | boolean | number`',
        why: 'Close in spirit, but there is no named tag; a Rust enum’s variants are named and can hold any data.',
      },
    ],
  },
  {
    q: 'In the arm `Value::Number(x) => x * 2.0`, what is `x`?',
    options: [
      {
        t: 'A new variable holding the number inside the `Number` variant, for this arm only',
        correct: true,
        why: 'That is how an arm gets at the payload.',
      },
      {
        t: 'A variable `x` defined before the `match`',
        why: 'A name in a pattern makes a new variable, even if an older `x` exists.',
      },
      {
        t: 'The whole value `v`',
        why: 'It is only the payload, the `f64` inside.',
      },
    ],
  },
  {
    q: `Which arm handles the byte \`b'_'\`?
\`\`\`
match c {
    b'0'..=b'9' => 1,
    b'a'..=b'z' | b'_' => 2,
    _ => 3,
}
\`\`\``,
    options: [
      {
        t: 'The first: `_` is between `0` and `9`',
        why: '`_` is byte 95, well outside 48 to 57.',
      },
      {
        t: 'The third, because `_` in the pattern means “anything”',
        why: 'The byte literal `b\'_\'` is a specific byte; only the bare `_` is a wildcard.',
      },
      {
        t: 'The second: one of its alternatives is exactly `b\'_\'`',
        correct: true,
        why: 'An or-pattern fits when any alternative fits.',
      },
    ],
  },
  {
    q: 'Which line compiles?',
    options: [
      {
        t: '`let Value::Number(n) = v;`',
        why: 'The pattern is refutable, so a plain `let` rejects it with E0005.',
      },
      {
        t: '`let (x, y) = (1, 2);`',
        correct: true,
        why: 'A tuple pattern of names always fits a pair: it is irrefutable.',
      },
      {
        t: '`let Value::None | Value::Bool(_) = v;`',
        why: 'Still refutable (`v` might be a number), and an or-pattern at the top of a `let` must be wrapped in brackets anyway.',
      },
    ],
  },
];
