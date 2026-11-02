// Chapter 204 cards. Keys are stable ids: never rename them.

const OP = `enum Op {
    Push(f64),
    Add,
    Sub,
    Mul,
    Neg,
}`;

const VAL = `#[derive(Clone, Copy)]
enum Value {
    Nil,
    Bool(bool),
    Number(f64),
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
  'match-arms': {
    q: 'In what order does `match` try its arms, and which one runs?',
    a: 'Top to bottom. The first arm whose pattern fits runs, and no other.',
  },
  'match-exhaustive': {
    q: 'What happens if a `match` doesn’t cover every possible value?',
    a: 'It doesn’t compile (E0004), and the error names a value that isn’t covered.',
  },
  'match-expr': {
    q: 'Can a `match` produce a value, like `let n = match v { ... };`?',
    a: 'Yes. It is an expression; every arm must produce the same type.',
  },
  'pattern-what': {
    q: 'What is a pattern?',
    a: 'A shape a value is compared with, which can also bind names to parts of the value.',
  },
  'pattern-bind': {
    q: 'In the arm `Value::Number(x) => x * 2.0`, what is `x`?',
    a: 'A new variable bound to the number inside the `Number` variant, for that arm only.',
  },
  'pattern-wild': {
    q: 'What does `_` match, and what does it cost you?',
    a: 'Anything, without binding it. It also stops the compiler from telling you about cases you forgot.',
  },
  'pattern-or': {
    q: 'What does the pattern `Value::Nil | Value::Bool(false)` match?',
    a: 'Either of the two: nil, or the boolean false. It is Drip’s “falsey”.',
  },
  'pattern-tuple': {
    q: 'How do you match on two values at once, such as both operands of `+`?',
    a: 'Match on a pair, `match (a, b)`, with pair patterns like `(Value::Number(x), Value::Number(y))`.',
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
    code: `${VAL}

fn is_falsey(v: Value) -> bool {
    match v {
        Value::Nil
        | Value::Bool(false) => true,
        _ => false,
    }
}

fn add(a: Value, b: Value) -> Value {
    match (a, b) {
        (
            Value::Number(x),
            Value::Number(y),
        ) => Value::Number(x + y),
        _ => Value::Nil,
    }
}

fn show(v: Value) -> String {
    match v {
        Value::Nil => {
            String::from("nil")
        }
        Value::Bool(b) => b.to_string(),
        Value::Number(n) => {
            n.to_string()
        }
    }
}

fn main() {
    let two = Value::Number(2.0);
    let t = Value::Bool(true);
    println!("{}", show(add(two, two)));
    println!("{}", show(add(two, t)));
    let nil = Value::Nil;
    println!("{}", is_falsey(nil));
    println!("{}", is_falsey(two));
}`,
  },
};

export const exercises = {
  miniVm: {
    lang: 'rust',
    title: 'A five-instruction VM',
    prompt:
      'Finish `eval`, a tiny stack VM in the style of the Rust Drip VM’s `run` loop. `Push(v)` pushes `v`. `Add`, `Sub` and `Mul` pop the top two values and push the result, with the **lower** value on the left (`Push(10.0), Push(4.0), Sub` gives 6). `Neg` replaces the top value with its negation. Return the value on top at the end. Replace the `_ => todo!()` arm with real arms, and don’t keep a `_` arm.',
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
    walkthrough: `This is the companion VM’s \`run\` in miniature: a loop, one \`match\` on the instruction, one arm per opcode.

- **One arm per variant.** With all five written, there is no \`_\` arm, so the match is exhaustive on its own terms. Add a sixth variant, \`Div\`, and this function stops compiling until you handle it. With a \`_\` arm it would compile and quietly do nothing.
- **Binary operators.** \`top -= 1;\` pops the right operand, which is now at \`st[top]\`. The left operand is at \`st[top - 1]\`, and the result overwrites it: \`st[top - 1] -= st[top];\`. That is \`a - b\` with \`a\` lower on the stack, just like \`pop_numbers\` in the Rust VM, which reads \`peek(1)\` as \`a\` and \`peek(0)\` as \`b\`.
- **Neg** works in place on the top slot, like the companion’s \`set_peek(0, Value::Number(-n))\`.

\`match code[i]\` binds \`v\` in \`Op::Push(v)\` by copying the \`f64\` out of the slice, so nothing is moved out of \`code\`.`,
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
  valuesEqual: {
    lang: 'rust',
    optional: true,
    title: 'Drip’s ==, types first',
    prompt:
      'Write `equal(a, b)` with Drip’s rules from chapter 76: values of different variants are never equal; two `Nil`s are equal; booleans and numbers compare their payloads with `==`. Match on the pair `(a, b)`.',
    starter: `${VAL}

fn equal(a: Value, b: Value) -> bool {
    false
}`,
    solution: `${VAL}

fn equal(a: Value, b: Value) -> bool {
    match (a, b) {
        (Value::Nil, Value::Nil) => {
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
fn nil_equals_nil() {
    assert!(equal(Value::Nil, Value::Nil));
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
fn different_variants_are_unequal() {
    let f = Value::Bool(false);
    assert!(!equal(Value::Nil, f));
    let z = Value::Number(0.0);
    assert!(!equal(z, f));
}`,
    hints: [
      '`match (a, b)` matches a pair. A pattern like `(Value::Nil, Value::Nil)` fits only when both are nil.',
      'For booleans: `(Value::Bool(x), Value::Bool(y)) => x == y`. Numbers are the same shape.',
      'Everything left over is a pair of different variants. A final `_ => false` covers them all.',
    ],
    walkthrough: `Matching on a pair lets one \`match\` look at both values at once.

- Three arms for the three same-variant cases. Each binds the payloads and compares them.
- Here a \`_\` arm is the right tool: every remaining combination, six of them, means “different variants”, and the answer is always \`false\`.

The \`#[derive(Clone, Copy)]\` line lets \`Value\` be copied like a number instead of moved, so the tests can use \`one\` twice. The Rust Drip VM’s \`Value\` has the same line, and chapter 207 explains it. That VM gets equality with one more derive, \`PartialEq\`, which writes this exact match for you.`,
    wrong: [
      {
        code: `${VAL}

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
        why: 'Two nils fall through to `_ => false`. The wildcard hides the missing `(Value::Nil, Value::Nil)` case.',
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
    Value::Bool(_) => 2,
    _ => 3,
};
println!("{n}");
\`\`\``,
    options: [
      { t: '`1`', why: 'The variant fits, but the payload `true` doesn’t match `false`.' },
      { t: '`2`', correct: true, why: '`Bool(_)` fits any boolean, and it is the first arm that fits.' },
      { t: '`3`', why: '`_` would match, but an earlier arm already did. Only the first match runs.' },
      { t: '`2` and then `3`', why: 'Rust arms never fall through like a `switch` without `break`.' },
    ],
  },
  {
    q: 'Your `enum Op` gets a new variant, `Div`. What happens to a `match op` that lists every other variant and has no `_` arm?',
    options: [
      { t: 'It runs, and does nothing for `Div`', why: 'That is what a `_ => {}` arm would do. Without one, the match no longer covers every value.' },
      { t: 'It panics when it first sees `Div`', why: 'The problem is caught long before the program runs.' },
      { t: 'It stops compiling: non-exhaustive patterns, `Op::Div` not covered', correct: true, why: 'Exhaustiveness is checked at compile time, which is why you leave out `_` when you can.' },
    ],
  },
  {
    q: 'Which TypeScript type is closest to `enum Value { Nil, Bool(bool), Number(f64) }`?',
    options: [
      { t: '`{ nil: null; bool: boolean; num: number }`', why: 'That object has all three at once. An enum value is exactly one variant.' },
      { t: '`null | boolean | number`', why: 'Close in spirit, but there is no named tag. A Rust enum’s variants are named and can hold any data.' },
      { t: '`{ tag: \'nil\' } | { tag: \'bool\'; as: boolean } | { tag: \'num\'; as: number }`', correct: true, why: 'A discriminated union: a tag that picks the case, plus that case’s payload.' },
    ],
  },
  {
    q: 'In `Value::Number(x) => x * 2.0`, what kind of pattern is `x`?',
    options: [
      { t: 'A literal: it matches only the number called `x`', why: 'Rust patterns treat a plain lowercase name as a new variable.' },
      { t: 'A binding: it matches any number and names it `x` for this arm', correct: true, why: 'That’s how an arm gets at the payload.' },
      { t: 'A wildcard that throws the number away', why: 'That is `_`. `x` keeps the value.' },
      { t: 'A reference to a variable `x` defined earlier', why: 'A name in a pattern makes a new variable, even if an older `x` exists.' },
    ],
  },
  {
    q: 'Why is a `match` with a `_ => {}` arm riskier than one listing every variant?',
    options: [
      { t: '`_` makes the match slower', why: 'It isn’t about speed. It’s about what the compiler can check.' },
      { t: '`_` can only be used with numbers', why: '`_` works with any type.' },
      { t: 'It isn’t; the two are always the same', why: 'They behave the same today. They differ when a variant is added.' },
      { t: 'A new variant silently goes to `_`, so the compiler never points out the missing case', correct: true, why: 'Listing every variant turns “I forgot one” into a compile error.' },
    ],
  },
  {
    q: 'The Rust VM has `enum ObjUpvalue { Open(usize), Closed(Value) }`. What does this rule out?',
    options: [
      { t: 'An upvalue that is closed but still has a stack slot', correct: true, why: 'A value is exactly one variant, and only `Open` carries a slot. Bad combinations can’t be built.' },
      { t: 'An upvalue ever changing from open to closed', why: 'The VM can replace an `Open` value with a `Closed` one. It does exactly that when a frame returns.' },
      { t: 'Upvalues that hold numbers', why: '`Closed(Value)` can hold any Drip value, numbers included.' },
    ],
  },
];
