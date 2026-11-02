// Chapter 305 cards. Keys are stable ids: never rename them.

const OP = `enum Op {
    Push(f64),
    Add,
    Sub,
    Mul,
    Neg,
}`;

export const prompts = {
  'enum-what': {
    q: 'What is a Rust `enum`?',
    a: 'A type whose values are each exactly one of a fixed list of variants.',
  },
  'variant-data': {
    q: 'How do you make a `Value` that is the `Number` variant holding 2.5?',
    a: '`Value::Number(2.5)`',
  },
  'enum-vs-union': {
    q: 'Which TypeScript feature is a Rust enum with data closest to?',
    a: 'A discriminated union: the variant is the tag, and its data is the payload.',
  },
  'enum-sum': {
    q: 'A struct multiplies the numbers of values of its fields. What does an enum do with its variants?',
    a: 'It adds them: `enum V { A, B(bool) }` has 1 + 2 = 3 possible values.',
  },
  'match-arms': {
    q: 'In what order does `match` try its arms, and which one runs?',
    a: 'Top to bottom. The first arm whose pattern fits runs, and no other.',
  },
  'match-exhaustive': {
    q: 'What happens if a `match` doesn’t cover every possible value?',
    a: 'It doesn’t compile (E0004), and the error names a value that isn’t covered.',
  },
  'match-expr': {
    q: 'Can a `match` produce a value, like `let n = match v { ... };`, and what must be true of its arms?',
    a: 'Yes, it is an expression; every arm must produce the same type (or E0308).',
  },
  'discriminant': {
    q: 'How does a running program know which variant an enum value holds?',
    a: 'Each value carries a discriminant: an integer saying which variant it is, like a tag.',
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
};

export const exercises = {
  miniVm: {
    lang: 'rust',
    title: 'A five-instruction VM',
    prompt:
      'Finish `eval`, a tiny stack VM in the style of the Rust Drip VM’s `run` loop (`while` and indexing work as in TypeScript). `Push(v)` pushes `v`. `Add`, `Sub` and `Mul` pop the top two values and push the result, with the **lower** value on the left (`Push(10.0), Push(4.0), Sub` gives 6). `Neg` replaces the top value with its negation. Return the value on top at the end. Replace the `_ => todo!()` arm with real arms, and don’t keep a `_` arm.',
    starter: `${OP}

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
    solution: `${OP}

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
        code: `${OP}

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
        code: `${OP}

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
};

export const quiz = [
  {
    q: `What does this print?
\`\`\`
let v = Value::Bool(false);
let n = match v {
    Value::Bool(true) => 1,
    Value::Bool(false) => 2,
    Value::None => 3,
    Value::Number(_) => 4,
};
println!("{n}");
\`\`\``,
    options: [
      { t: '`1`', why: 'The variant fits, but the payload `true` doesn’t match `false`.' },
      { t: '`2`', correct: true, why: '`Bool(false)` is the first arm that fits, and only that arm runs.' },
      { t: '`2` and then `3`', why: 'Rust arms never fall through like a `switch` without `break`.' },
    ],
  },
  {
    q: 'Your `enum Op` gets a new variant, `Div`. What happens to a `match op` that lists every other variant and has no catch-all arm?',
    options: [
      { t: 'It runs, and does nothing for `Div`', why: 'That is what a `_ => {}` arm would do. Without one, the match no longer covers every value.' },
      { t: 'It panics when it first sees `Div`', why: 'The problem is caught long before the program runs.' },
      { t: 'It stops compiling: non-exhaustive patterns, `Op::Div` not covered', correct: true, why: 'Exhaustiveness is checked at compile time, for every possible value.' },
    ],
  },
  {
    q: 'Which TypeScript type is closest to `enum Value { None, Bool(bool), Number(f64) }`?',
    options: [
      { t: '`{ none: null; bool: boolean; num: number }`', why: 'That object has all three at once. An enum value is exactly one variant.' },
      { t: "`{ tag: 'none' } | { tag: 'bool'; as: boolean } | { tag: 'num'; as: number }`", correct: true, why: 'A discriminated union: a tag that picks the case, plus that case’s payload.' },
      { t: '`null | boolean | number`', why: 'Close in spirit, but there is no named tag; a Rust enum’s variants are named and can hold any data.' },
    ],
  },
  {
    q: 'In the arm `Value::Number(x) => x * 2.0`, what is `x`?',
    options: [
      { t: 'A new variable holding the number inside the `Number` variant, for this arm only', correct: true, why: 'That is how an arm gets at the payload.' },
      { t: 'A variable `x` defined before the `match`', why: 'A name in a pattern makes a new variable, even if an older `x` exists.' },
      { t: 'The whole value `v`', why: 'It is only the payload, the `f64` inside.' },
    ],
  },
  {
    q: 'The Rust VM has `enum ObjUpvalue { Open(usize), Closed(Value) }`. What does this rule out?',
    options: [
      { t: 'An upvalue ever changing from open to closed', why: 'The VM replaces an `Open` value with a `Closed` one when a frame returns.' },
      { t: 'Upvalues that hold numbers', why: '`Closed(Value)` can hold any Drip value, numbers included.' },
      { t: 'An upvalue that is closed but still has a stack slot', correct: true, why: 'A value is exactly one variant, and only `Open` carries a slot. Bad combinations can’t be built.' },
    ],
  },
];
