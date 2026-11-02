// Chapter 343-b cards. Keys are stable ids: never rename them.

const VAL = `#[derive(Clone, Copy)]
enum Value {
    None,
    Bool(bool),
    Number(f64),
}`;

export const prompts = {
  'pattern-what': {
    q: 'What is a pattern?',
    a: 'A shape a value is compared with, which can also bind names to parts of the value.',
  },
  'pattern-range': {
    q: "Which bytes does the pattern `b'0'..=b'9'` fit?",
    a: 'Every byte from `0` to `9`, both ends included.',
  },
  'pattern-or': {
    q: 'What does the pattern `Value::None | Value::Bool(false)` fit?',
    a: 'Either of the two: `none`, or the boolean `false`. It is Drip’s “falsey”.',
  },
  'pattern-tuple': {
    q: 'How do you match on two values at once, such as both operands of `+`?',
    a: 'Match on a tuple, `match (a, b)`, with tuple patterns like `(Value::Number(x), Value::Number(y))`.',
  },
  'pattern-guard': {
    q: 'What does `if n < 0.0` add to the arm `Value::Number(n) if n < 0.0 => ...`?',
    a: 'A match guard: the arm runs only if the pattern fits *and* the condition is true.',
  },
  refutable: {
    q: 'Why does `let Value::Number(n) = v;` fail to compile?',
    a: 'The pattern is refutable (`v` might be another variant), and a plain `let` needs an irrefutable one (E0005).',
  },
  'if-let': {
    q: 'What is `if let Value::Number(n) = v { ... }`?',
    a: 'A one-arm match: the block runs only when `v` fits the pattern, with `n` bound.',
  },
  'let-destructure': {
    q: 'What does `let Particle { vx, vy, .. } = p;` do?',
    a: 'Binds `vx` and `vy` to those fields of `p`; `..` ignores the other fields.',
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

const EQ = (body) => `${VAL}

fn equal(a: Value, b: Value) -> bool {
${body}
}`;

export const exercises = {
  valuesEqual: {
    lang: 'rust',
    title: 'Drip’s ==, variant first',
    prompt:
      'Write `equal(a, b)` with Drip’s rules for `==`: values of different variants are never equal (`none == false` is false, and so is `0 == false`); two `none`s are equal; two booleans, or two numbers, are equal when their payloads are equal (`==` on the payloads). Match on the pair `(a, b)`.',
    starter: EQ('    false'),
    solution: EQ(`    match (a, b) {
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
    }`),
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

**Why not \`a == b\`?** \`Value\` does not implement \`PartialEq\` here (the chapter *Traits* explains what that means), so \`==\` on two \`Value\`s does not compile. The real companion VM derives it, and its comment says the derived \`==\` is Drip's \`==\`: exactly these rules.

**Common wrong attempts.**

- Comparing only the variants and ignoring the payloads (\`(Value::Number(_), Value::Number(_)) => true\`) makes \`1 == 2\` true.
- Leaving out the \`(Value::None, Value::None)\` arm sends that pair to \`_\` and returns \`false\`, so \`none == none\` is false.`,
    wrong: [
      {
        code: EQ(`    match (a, b) {
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
    }`),
        why: 'Same variant isn’t enough: the payloads must be equal too. This says `1 == 2`.',
      },
      {
        code: EQ(`    match (a, b) {
        (
            Value::Bool(x),
            Value::Bool(y),
        ) => x == y,
        (
            Value::Number(x),
            Value::Number(y),
        ) => x == y,
        _ => false,
    }`),
        why: 'The pair `(None, None)` falls through to `_`, so `none == none` comes out false.',
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
      { t: '`3`', why: '`_` would fit, but an earlier arm already did; only the first match runs.' },
    ],
  },
  {
    q: "Which arm handles the byte `b'_'`?\n```\nmatch c {\n    b'0'..=b'9' => 1,\n    b'a'..=b'z' | b'_' => 2,\n    _ => 3,\n}\n```",
    options: [
      { t: 'The first: `_` is between `0` and `9`', why: '`_` is byte 95, well outside 48 to 57.' },
      { t: 'The third, because `_` in the pattern means “anything”', why: 'The byte literal `b\'_\'` is a specific byte; only the bare `_` is a wildcard.' },
      { t: 'The second: one of its alternatives is exactly `b\'_\'`', correct: true, why: 'An or-pattern fits when any alternative fits.' },
    ],
  },
  {
    q: 'Why is a `match` ending in `_ => {}` riskier than one listing every variant?',
    options: [
      { t: 'A new variant silently goes to `_`, so the compiler never points out the missing case', correct: true, why: 'Listing every variant turns “I forgot one” into a compile error.' },
      { t: '`_` makes the match slower', why: 'It isn’t about speed; it is about what the compiler can check for you.' },
      { t: '`_` can only be used with numbers', why: '`_` works with any type.' },
    ],
  },
  {
    q: 'Which line compiles?',
    options: [
      { t: '`let Value::Number(n) = v;`', why: 'The pattern is refutable, so a plain `let` rejects it with E0005.' },
      { t: '`let (x, y) = (1, 2);`', correct: true, why: 'A tuple pattern of names always fits a pair: it is irrefutable.' },
      { t: '`let Value::None | Value::Bool(_) = v;`', why: 'Still refutable (`v` might be a number), and or-patterns are not allowed at the top of a `let` anyway.' },
    ],
  },
  {
    q: 'With `let limit = 3;` and `n = 7`, what does `match n { limit => "hit", _ => "miss" }` give?',
    options: [
      { t: '`"miss"`, because 7 is not 3', why: 'That would need a comparison. A name in a pattern binds instead.' },
      { t: 'A compile error: `limit` is already defined', why: 'It compiles, with a warning that the `_` arm is unreachable.' },
      { t: '`"hit"`: the pattern `limit` is a new variable that fits anything', correct: true, why: 'Compare with a guard instead: `x if x == limit`.' },
    ],
  },
];
