// Chapter 346 cards. Keys are stable ids: never rename them.

const VALUE = `#[derive(Debug, PartialEq)]
enum Value {
    Number(f64),
    Bool(bool),
}

fn as_num(v: &Value)
    -> Result<f64, String> {
    match v {
        Value::Number(n) => Ok(*n),
        _ => Err(String::from(
            "not a number",
        )),
    }
}
`;

export const prompts = {
  'res-what': {
    q: 'What are the two variants of `Result<T, E>`, and what does each carry?',
    a: '`Ok(value)` carries the answer, a `T`; `Err(error)` carries an `E` describing what went wrong.',
  },
  'res-vs-option': {
    q: 'When should a function return `Result` rather than `Option`?',
    a: 'When the caller needs to know *why* there is no answer: `Err` carries a reason, `None` carries nothing.',
  },
  'res-must-use': {
    q: 'What does rustc say if you call a function that returns a `Result` and ignore the value?',
    a: 'It warns: unused `Result` that must be used, since it may be an `Err`.',
  },
  'q-does': {
    q: 'What does `as_num(a)?` evaluate to on `Ok(n)`, and what does it do on `Err(e)`?',
    a: 'On `Ok(n)` it is `n`. On `Err(e)` it returns `Err(e)` (converted with `From`) from the enclosing function at once.',
  },
  'q-where': {
    q: 'Why can’t you use `?` inside a function that returns `f64`?',
    a: 'On an error `?` returns early with an `Err` (or `None`), and an `f64` return type has nowhere to put it (E0277).',
  },
  'q-option': {
    q: 'What does `?` do after an `Option`?',
    a: 'Unwraps `Some(v)` to `v`; on `None` it returns `None` from the function.',
  },
  'res-vs-throw': {
    q: 'How does drip-rs report a runtime error differently from the TypeScript VM?',
    a: 'It returns an `Err` up through each frame with `?`, instead of throwing an exception to a `catch`.',
  },
  'q-visible': {
    q: 'Reading a Rust function, how can you see every place it might fail and return early?',
    a: 'Each one is marked with a `?` (or an explicit `return Err`), and the signature says `Result`.',
  },
};

export const examples = {
  'question-play': {
    lang: 'rust',
    title: 'Errors passed up with ?',
    code: `${VALUE}
fn sub(a: &Value, b: &Value)
    -> Result<f64, String> {
    let x = as_num(a)?;
    let y = as_num(b)?;
    Ok(x - y)
}

fn main() {
    let one = Value::Number(1.0);
    let t = Value::Bool(true);
    println!("{:?}", sub(&one, &one));
    println!("{:?}", sub(&one, &t));
    match sub(&t, &one) {
        Ok(n) => println!("{n}"),
        Err(e) => println!("bad: {e}"),
    }
    let n = "42".parse::<i32>();
    println!("{:?}", n);
    let m = "4x".parse::<i32>();
    println!("{:?}", m);
}`,
  },
};

const SIG = `fn add_top(st: &[Value])
    -> Result<f64, String> {`;

const UNDER = `    let n = st.len();
    if n < 2 {
        return Err(String::from(
            "stack underflow",
        ));
    }`;

export const exercises = {
  addTop: {
    lang: 'rust',
    title: 'Add the top two values',
    prompt:
      'A toy VM stack is a slice of `Value`s, with the top at the end. Write `add_top(st)`, which returns `Ok` with the sum of the top two values. With fewer than two values, return `Err("stack underflow")` (as a `String`). If either value is not a number, return the error that `as_num` gives, using `?` rather than writing that message again.',
    starter: `${VALUE}
${SIG}
    todo!()
}`,
    solution: `${VALUE}
${SIG}
${UNDER}
    let a = as_num(&st[n - 2])?;
    let b = as_num(&st[n - 1])?;
    Ok(a + b)
}`,
    tests: `fn e(m: &str) -> Result<f64, String> {
    Err(m.to_string())
}
#[test]
fn adds_two_numbers() {
    let st = [
        Value::Number(1.0),
        Value::Number(2.5),
    ];
    assert_eq!(add_top(&st), Ok(3.5));
}
#[test]
fn uses_only_the_top_two() {
    let st = [
        Value::Bool(true),
        Value::Number(1.0),
        Value::Number(2.0),
    ];
    assert_eq!(add_top(&st), Ok(3.0));
}
#[test]
fn too_few_values() {
    let one = [Value::Number(1.0)];
    assert_eq!(add_top(&one), e("stack underflow"));
    assert_eq!(add_top(&[]), e("stack underflow"));
}
#[test]
fn top_is_not_a_number() {
    let st = [
        Value::Number(1.0),
        Value::Bool(false),
    ];
    assert_eq!(add_top(&st), e("not a number"));
}
#[test]
fn second_is_not_a_number() {
    let st = [
        Value::Bool(false),
        Value::Number(1.0),
    ];
    assert_eq!(add_top(&st), e("not a number"));
}`,
    hints: [
      'There are three outcomes: the sum, “stack underflow” and “not a number”. Check `st.len()` first, and return the underflow error straight away when it is below 2.',
      'The top value is `st[n - 1]` and the one below it is `st[n - 2]`. `as_num` wants a reference: `as_num(&st[n - 1])`.',
      'Write `let a = as_num(&st[n - 2])?;` and the same for `b`, then finish with `Ok(a + b)`: the function returns a `Result`, not a bare `f64`.',
    ],
    walkthrough: `**How to think about it.** List the outcomes before writing code, because the return type has to hold all of them: a sum (\`Ok\`), too few values (\`Err\`), or a value that is not a number (\`Err\` again). The second needs its own check, because \`as_num\` knows nothing about stack sizes; the third is \`as_num\`'s job already, so the right move is to let its \`Err\` pass straight through, which is exactly what \`?\` does.

**The solution, line by line.**

- \`let n = st.len();\` keeps the length, a \`usize\`.
- \`if n < 2 { return Err(String::from("stack underflow")); }\` deals with the short stack first. This must come before any indexing: on a one-value stack, \`n - 2\` would try to go below zero, and a \`usize\` cannot, so the subtraction itself would panic.
- \`let a = as_num(&st[n - 2])?;\` reads the value below the top (the left operand, pushed first), borrows it, and asks \`as_num\` for its number. On \`Ok(x)\` the \`?\` leaves \`a = x\`, a plain \`f64\`; on \`Err\`, \`add_top\` returns that \`Err\` right here, and nothing below runs.
- \`let b = as_num(&st[n - 1])?;\` does the same for the top value.
- \`Ok(a + b)\` wraps the sum, because the function promised a \`Result\`.

This is the shape of drip-rs's \`pop_numbers\`: check, then pass every failure up, with each place that can fail marked by \`?\`.

**Common wrong attempts.**

- Leaving out the length check: \`st[n - 2]\` on a one-value stack panics with "attempt to subtract with overflow" instead of returning the underflow error.
- Matching on the lower value and treating a non-number as 0 (\`_ => Ok(b)\`) swallows the error: the program carries on with a wrong answer, which is exactly what \`?\` exists to prevent.
- \`Ok(as_num(&st[n - 2]) + as_num(&st[n - 1]))\` without \`?\` does not compile: you cannot add two \`Result\`s (E0369, as with \`Option\`).`,
    wrong: [
      {
        code: `${VALUE}
${SIG}
    let n = st.len();
    let a = as_num(&st[n - 2])?;
    let b = as_num(&st[n - 1])?;
    Ok(a + b)
}`,
        why: 'Without the length check, a stack of one value makes `n - 2` underflow, which panics, so the test expecting the underflow error fails.',
      },
      {
        code: `${VALUE}
${SIG}
${UNDER}
    let b = as_num(&st[n - 1])?;
    match &st[n - 2] {
        Value::Number(a) => Ok(a + b),
        _ => Ok(b),
    }
}`,
        why: 'It quietly treats a non-number below the top as zero instead of reporting it. Swallowing an error like this is what `?` is there to prevent.',
      },
    ],
  },
  topTwo: {
    lang: 'rust',
    optional: true,
    title: 'Peek at the top two, with ? on an Option',
    prompt:
      'Write `top_two(st)`, which returns `Some((below, top))` for the last two numbers of the slice, or `None` if there are fewer than two. Use `st.len().checked_sub(2)`, which gives `None` instead of going below zero, together with `?`.',
    starter: `fn top_two(st: &[f64])
    -> Option<(f64, f64)> {
    todo!()
}`,
    solution: `fn top_two(st: &[f64])
    -> Option<(f64, f64)> {
    let i = st.len().checked_sub(2)?;
    Some((st[i], st[i + 1]))
}`,
    tests: `#[test]
fn two_values() {
    let r = top_two(&[1.0, 2.0]);
    assert_eq!(r, Some((1.0, 2.0)));
}
#[test]
fn takes_the_last_two() {
    let r = top_two(&[7.0, 1.0, 2.0]);
    assert_eq!(r, Some((1.0, 2.0)));
}
#[test]
fn too_short() {
    assert_eq!(top_two(&[1.0]), None);
    assert_eq!(top_two(&[]), None);
}`,
    hints: [
      '`checked_sub(2)` returns `Some(len - 2)` when that is not below zero, and `None` otherwise.',
      'Put `?` after it: `let i = st.len().checked_sub(2)?;`. On `None`, the function returns `None` right there. Then the answer is `Some((st[i], st[i + 1]))`.',
    ],
    walkthrough: `**How to think about it.** \`checked_sub\` is the standard library returning an \`Option\` instead of panicking: \`3usize.checked_sub(2)\` is \`Some(1)\`, and \`1usize.checked_sub(2)\` is \`None\`. Since \`top_two\` itself returns an \`Option\`, \`?\` may be used on it.

**The solution, line by line.**

- \`let i = st.len().checked_sub(2)?;\` is the index of the value below the top, or an early \`return None\` when there are fewer than two values.
- \`Some((st[i], st[i + 1]))\` pairs the two values (the inner brackets make a tuple) and wraps the pair. After the \`?\` line both indexes are known to be in range, so neither read can panic.

**Common wrong attempt.** \`let n = st.len(); Some((st[n - 2], st[n - 1]))\` works for long slices but panics on short ones, because \`n - 2\` underflows.`,
    wrong: [
      {
        code: `fn top_two(st: &[f64])
    -> Option<(f64, f64)> {
    let n = st.len();
    Some((st[n - 2], st[n - 1]))
}`,
        why: 'For a short slice `n - 2` underflows and the function panics instead of returning `None`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: `\`as_num(&t)\` returns \`Err("not a number")\`. What does \`sub(&one, &t)\` return?
\`\`\`
fn sub(a: &Value, b: &Value)
    -> Result<f64, String> {
    let x = as_num(a)?;
    let y = as_num(b)?;
    Ok(x - y)
}
\`\`\``,
    options: [
      { t: '`Ok(1.0)`: the failing operand is skipped', why: 'Nothing is skipped: the `?` on `as_num(b)` returns the `Err` at once.' },
      { t: '`Err("not a number")`', correct: true, why: 'The first `?` unwraps `Ok(1.0)`; the second sees an `Err` and returns it from `sub`. `Ok(x - y)` never runs.' },
      { t: 'It panics', why: '`?` never panics. It returns the error as an ordinary value.' },
    ],
  },
  {
    q: 'You call `as_num(&t);` on a line of its own and ignore the answer. What happens?',
    options: [
      { t: 'It does not compile', why: 'It compiles, with a warning.' },
      { t: 'rustc warns: unused `Result` that must be used', correct: true, why: 'An ignored `Result` might be an ignored `Err`, so the compiler points it out.' },
      { t: 'The program panics if it was an `Err`', why: 'Nothing happens to an ignored `Err` at run time; that is why the warning exists.' },
    ],
  },
  {
    q: 'Where may you write `?` after a `Result`?',
    options: [
      { t: 'Anywhere: it turns errors into panics', why: 'That is `unwrap`. `?` returns the error to the caller.' },
      { t: 'Only inside `main`', why: '`main` is allowed if it returns a `Result`, but so is any function that does.' },
      { t: 'In a function whose return type can hold the early return, such as a `Result`', correct: true, why: 'Elsewhere it is E0277: the `?` operator can only be used in a function that returns `Result` or `Option`.' },
    ],
  },
  {
    q: 'What is the TypeScript Drip VM’s way of stopping on a runtime error, and drip-rs’s?',
    options: [
      { t: 'Both throw an exception', why: 'Rust has no exceptions for ordinary errors; drip-rs returns `Err`.' },
      { t: 'TypeScript throws and `interpret` catches; drip-rs returns `Err` up every frame with `?`', correct: true, why: 'Same bookkeeping (message and trace), different way of getting back to `interpret`.' },
      { t: 'Both return an error value', why: 'The TypeScript VM’s `runtimeError` ends with `throw new VmRuntimeError(message)`.' },
    ],
  },
  {
    q: '`self.frames.last()` gives an `Option<&CallFrame>`. In a function returning `Option`, what does `self.frames.last()?` do when there are no frames?',
    options: [
      { t: 'Returns `None` from the function', correct: true, why: '`?` after an `Option` turns `None` into an early `return None`.' },
      { t: 'Panics with “called unwrap on None”', why: 'That is `unwrap()`, not `?`.' },
      { t: 'Gives a default frame', why: 'There is no default; the function returns early.' },
    ],
  },
];
