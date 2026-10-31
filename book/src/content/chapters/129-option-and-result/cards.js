// Chapter 129 cards. Keys are stable ids: never rename them.

const VALUE = `enum Value {
    Num(f64),
    Bool(bool),
}

fn as_num(v: &Value)
    -> Result<f64, String> {
    match v {
        Value::Num(n) => Ok(*n),
        _ => Err(String::from(
            "Operands must be numbers."
        )),
    }
}
`;

export const prompts = {
  'opt-what': {
    q: 'What are the two variants of `Option<T>`?',
    a: '`Some(value)`, holding a `T`, and `None`, holding nothing.',
  },
  'opt-vs-undefined': {
    q: 'Why can’t you add 1 to the `Option<usize>` that a search returns?',
    a: '`Option<usize>` is a different type from `usize`. You must first check for `Some` and take the number out.',
  },
  'opt-minus-one': {
    q: 'What is wrong with returning `-1` for “not found”, as `indexOf` does?',
    a: '`-1` is an ordinary number, so nothing forces the caller to check for it. `None` can’t be mistaken for an index.',
  },
  'if-let': {
    q: 'What does `if let Some(i) = opt { ... }` do?',
    a: 'Runs the block only if `opt` is `Some`, with `i` bound to the value inside: a `match` with one arm.',
  },
  'unwrap-panics': {
    q: 'What does `unwrap()` do on `None`, and when is it reasonable?',
    a: 'It panics and stops the program. Use it only where `None` would be a bug, for example in tests.',
  },
  'res-what': {
    q: 'What do the two variants of `Result<T, E>` carry?',
    a: '`Ok` carries the successful value, a `T`; `Err` carries an error of type `E` saying what went wrong.',
  },
  'res-vs-throw': {
    q: 'A TypeScript function can throw without its type saying so. What changes when a Rust function returns `Result`?',
    a: 'The possible failure is in its return type, and callers must deal with the `Err` before they can use the value.',
  },
  'q-does': {
    q: 'What does `let x = as_num(a)?;` do when `as_num(a)` is `Err(e)`?',
    a: 'It returns `Err(e)` from the enclosing function immediately. Nothing after it runs.',
  },
  'q-where': {
    q: 'Where may you use the `?` operator?',
    a: 'Only inside a function whose return type can hold the early return: a `Result` (for `?` on a `Result`) or an `Option` (for `?` on an `Option`).',
  },
  'q-option': {
    q: 'What does `?` do after an `Option`?',
    a: 'It unwraps `Some(v)` to `v`, and on `None` returns `None` from the enclosing function.',
  },
  npo: {
    q: 'Why is `Option<&T>` the same size as `&T`?',
    a: 'A reference is never null, so `None` can be stored as the null bit pattern; the standard library guarantees it.',
  },
};

export const examples = {
  'opt-play': {
    lang: 'rust',
    title: 'Four ways to open an Option',
    code: `fn find(xs: &[i32], t: i32)
    -> Option<usize> {
    for i in 0..xs.len() {
        if xs[i] == t {
            return Some(i);
        }
    }
    None
}

fn main() {
    let xs = [4, 5, 6];
    match find(&xs, 5) {
        Some(i) => println!("at {}", i),
        None => println!("absent"),
    }
    if let Some(i) = find(&xs, 6) {
        println!("6 is at {}", i);
    }
    let i = find(&xs, 9).unwrap_or(99);
    println!("{}", i);
    println!("{:?}", find(&xs, 4));
    // Try: find(&xs, 9).unwrap()
}`,
  },
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
    let one = Value::Num(1.0);
    let t = Value::Bool(true);
    println!("{:?}", sub(&one, &one));
    println!("{:?}", sub(&one, &t));
    match sub(&t, &one) {
        Ok(n) => println!("{}", n),
        Err(e) => println!("{}", e),
    }
}`,
  },
};

export const exercises = {
  addTop: {
    lang: 'rust',
    title: 'Add the top two values',
    prompt:
      'A toy VM stack is a slice of `Value`s, with the top at the end. Write `add_top(st)`, which returns the sum of the top two values. If there are fewer than two values, return `Err("Stack underflow.")`. If either is not a number, return the error from `as_num`. Use `?` for that.',
    starter: `${VALUE}
fn add_top(st: &[Value])
    -> Result<f64, String> {
    todo!()
}`,
    solution: `${VALUE}
fn add_top(st: &[Value])
    -> Result<f64, String> {
    let n = st.len();
    if n < 2 {
        return Err(String::from(
            "Stack underflow."));
    }
    let a = as_num(&st[n - 2])?;
    let b = as_num(&st[n - 1])?;
    Ok(a + b)
}`,
    tests: `fn s(m: &str) -> Result<f64, String> {
    Err(m.to_string())
}

#[test]
fn adds_two_numbers() {
    let st = [Value::Num(1.0), Value::Num(2.5)];
    assert_eq!(add_top(&st), Ok(3.5));
}

#[test]
fn uses_only_the_top_two() {
    let st = [
        Value::Bool(true),
        Value::Num(1.0),
        Value::Num(2.0),
    ];
    assert_eq!(add_top(&st), Ok(3.0));
}

#[test]
fn too_few_values() {
    assert_eq!(add_top(&[Value::Num(1.0)]),
        s("Stack underflow."));
    assert_eq!(add_top(&[]), s("Stack underflow."));
}

#[test]
fn top_is_not_a_number() {
    let st = [Value::Num(1.0), Value::Bool(false)];
    assert_eq!(add_top(&st),
        s("Operands must be numbers."));
}

#[test]
fn second_is_not_a_number() {
    let st = [Value::Bool(false), Value::Num(1.0)];
    assert_eq!(add_top(&st),
        s("Operands must be numbers."));
}`,
    hints: [
      'Check `st.len()` first: with fewer than two values, return the underflow error straight away.',
      'The top value is `st[n - 1]` and the one below it is `st[n - 2]`. Pass references: `as_num(&st[n - 1])`.',
      'Write `let a = as_num(&st[n - 2])?;` and the same for `b`, then `Ok(a + b)`.',
    ],
    walkthrough: `There are three outcomes, and the return type names all of them: \`Ok(sum)\`, or one of two \`Err\` messages.

- **Check the length first.** \`st.len()\` is a \`usize\`. If you skipped the check and wrote \`st[n - 2]\` on a one-value stack, \`n - 2\` would underflow, and in a debug build Rust panics on that subtraction. Returning \`Err\` is the polite version.
- **Let \`as_num\` decide.** \`as_num(&st[n - 2])?\` either gives you an \`f64\` or returns its \`Err\` from \`add_top\` at once. You don’t have to write the type-error message again, and you can’t forget to check the second operand: each \`?\` is its own check.
- **Wrap the answer.** The last expression is \`Ok(a + b)\`, because the function returns a \`Result\`, not a bare \`f64\`.

This is the shape of drip-rs’s \`pop_numbers\`: check, then \`?\` on each step that can fail.`,
    wrong: [
      {
        code: `${VALUE}
fn add_top(st: &[Value])
    -> Result<f64, String> {
    let n = st.len();
    let a = as_num(&st[n - 2])?;
    let b = as_num(&st[n - 1])?;
    Ok(a + b)
}`,
        why: 'Without the length check, a stack of one value makes `n - 2` underflow, which panics, so the test expecting `Err("Stack underflow.")` fails.',
      },
      {
        code: `${VALUE}
fn add_top(st: &[Value])
    -> Result<f64, String> {
    let n = st.len();
    if n < 2 {
        return Err(String::from(
            "Stack underflow."));
    }
    let b = as_num(&st[n - 1])?;
    match &st[n - 2] {
        Value::Num(a) => Ok(a + b),
        _ => Ok(b),
    }
}`,
        why: 'It quietly treats a non-number below the top as zero instead of reporting it. Swallowing an error like this is exactly what `?` is there to prevent.',
      },
    ],
  },
  topTwo: {
    lang: 'rust',
    optional: true,
    title: 'Peek at the top two, with ? on an Option',
    prompt:
      'Write `top_two(st)`, which returns `Some((below, top))` for the last two numbers of the slice, or `None` if there are fewer than two. Use `st.len().checked_sub(2)`, which gives `None` instead of underflowing, together with `?`.',
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
    assert_eq!(top_two(&[1.0, 2.0]), Some((1.0, 2.0)));
}

#[test]
fn takes_the_last_two() {
    assert_eq!(top_two(&[7.0, 1.0, 2.0]),
        Some((1.0, 2.0)));
}

#[test]
fn too_short() {
    assert_eq!(top_two(&[1.0]), None);
    assert_eq!(top_two(&[]), None);
}`,
    hints: [
      '`checked_sub(2)` returns `Some(len - 2)` when that fits in a `usize`, and `None` otherwise.',
      'Put `?` after it: `let i = st.len().checked_sub(2)?;`. On `None`, the function returns `None` there.',
      'Then the answer is `Some((st[i], st[i + 1]))`.',
    ],
    walkthrough: `\`checked_sub\` is a small example of the standard library returning \`Option\` instead of a magic value: \`3usize.checked_sub(2)\` is \`Some(1)\`, and \`1usize.checked_sub(2)\` is \`None\`.

Because \`top_two\` itself returns an \`Option\`, \`?\` is allowed: it turns the \`None\` into an early \`return None\`. After that line, \`i\` is a plain \`usize\` and both indexes are in range, so the slice reads can’t panic.`,
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
    q: 'A Rust function might have no answer. What should it return?',
    options: [
      { t: '`null`', why: 'Rust has no `null`.' },
      { t: '`Option<T>`: `Some(answer)` or `None`', correct: true, why: 'Absence is a variant of an enum, so the caller has to check for it.' },
      { t: 'A magic value such as `-1`', why: 'That is what `indexOf` does, and nothing makes the caller check for it.' },
      { t: 'It should panic', why: 'Panicking stops the program; “no answer” is a normal outcome, not a bug.' },
    ],
  },
  {
    q: 'What happens at `let y = as_num(b)?;` when `as_num(b)` returns `Err(e)`?',
    options: [
      { t: '`y` is set to `e`', why: '`y` would have to be an `f64`; the error never becomes `y`.' },
      { t: 'The program panics', why: 'That is `unwrap()`. `?` returns instead.' },
      { t: 'The function containing that line returns `Err(e)` at once', correct: true, why: 'The rest of the function, here `Ok(x - y)`, doesn’t run.' },
      { t: 'Execution continues with `y` set to `0.0`', why: 'Rust never invents a default value for you.' },
    ],
  },
  {
    q: 'You write `?` inside `fn half(n: i32) -> i32`. What happens?',
    options: [
      { t: 'It compiles, and the error is converted to 0', why: 'There is no such conversion.' },
      { t: 'It compiles, but panics at run time on an error', why: 'The problem is caught at compile time.' },
      { t: 'It is a compile error: E0277, `?` can only be used in a function that returns `Result` or `Option`', correct: true, why: 'An early return needs somewhere to go, and an `i32` can’t hold an `Err`.' },
    ],
  },
  {
    q: 'Which TypeScript idea is closest to `Option<T>`?',
    options: [
      { t: 'A discriminated union like `{ kind: "some", value: T } | { kind: "none" }`', correct: true, why: 'Both are “one of these variants”, and `match` is the checked version of narrowing on `kind`.' },
      { t: 'An interface', why: 'An interface describes the shape of an object, not a choice between variants.' },
      { t: '`try`/`catch`', why: 'That is about failures being thrown; `Option` is about a value being absent, and nothing is thrown.' },
      { t: '`any`', why: '`any` turns checking off. `Option` makes the compiler check more.' },
    ],
  },
  {
    q: 'How does drip-rs report `1 - true` compared with the TypeScript VM?',
    options: [
      { t: 'Both throw an exception', why: 'Rust has no exceptions.' },
      { t: 'drip-rs panics', why: 'A Drip runtime error is an expected outcome, not a bug in the VM, so it is returned as a value.' },
      { t: 'drip-rs ignores it and pushes nil', why: 'It reports “Operands must be numbers.”, exactly like the TypeScript VM.' },
      { t: 'The TypeScript VM throws `VmRuntimeError`; drip-rs returns `Err(RuntimeError)` and passes it up with `?`', correct: true, why: 'Same message and stack trace, but in Rust the failure travels as a return value.' },
    ],
  },
];
