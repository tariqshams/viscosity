// Chapter 191 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 123, 123.

export const prompts = {
  'opt-what': {
    q: 'What are the two variants of `Option<T>`?',
    a: '`Some(value)`, holding a `T`, and `None`, holding nothing.',
  },
  'opt-vs-undefined': {
    q: 'Why can’t you add 1 to an `Option<usize>`?',
    a: 'It is a different type from `usize` (E0369). You must first check whether it is `Some` and take the number out.',
  },
  'opt-minus-one': {
    q: 'What is wrong with returning `-1` for “not found”, as `indexOf` does?',
    a: '`-1` is still a number, so nothing stops the caller from using it as if it were a real answer.',
  },
  'opt-open': {
    q: 'A `match` on an `Option` has a `Some(i)` arm only. What happens?',
    a: 'It doesn’t compile: E0004, non-exhaustive patterns, `None` not covered.',
  },
  'opt-if-let': {
    q: 'What does `if let Some(i) = find(&xs, 6) { ... }` do when `find` returns `None`?',
    a: 'Nothing: the block is skipped. It runs only for `Some`, with `i` bound.',
  },
  'unwrap-panics': {
    q: 'What does `.unwrap()` do on `None`, and when is it acceptable?',
    a: 'It panics, stopping the program. Use it only where `None` would be a bug, as in a test.',
  },
  'unwrap-or': {
    q: 'What is `find(&xs, 9).unwrap_or(0)` when 9 is not in `xs`?',
    a: '`0`: the default given to `unwrap_or`, since there was no value.',
  },
  npo: {
    q: 'Why is `Option<&T>` the same size as `&T`, while `Option<i32>` is bigger than `i32`?',
    a: 'A reference is never null, so `None` can use the null pattern. Every `i32` pattern is a real number, so a tag is needed.',
  },
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
        Some(i) => println!("at {i}"),
        None => println!("absent"),
    }
    if let Some(i) = find(&xs, 6) {
        println!("6 is at {i}");
    }
    let i = find(&xs, 9).unwrap_or(0);
    println!("{i}");
    println!("{:?}", find(&xs, 4));
    println!("{:?}", xs.get(9));
    // Try: find(&xs, 9).unwrap()
}`,
  },
  'question-play': {
    lang: 'rust',
    title: 'Errors passed up with ?',
    code: `#[derive(Debug, PartialEq)]
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

export const exercises = {
  resolve: {
    lang: 'rust',
    title: 'Which slot is that local in?',
    prompt: 'When Drip’s compiler meets a variable name inside a function, it looks for it among the locals declared so far: `locals[i]` is the name in stack slot `i`. A name can be declared twice (an inner block’s `let x` hides an outer `x`), and the **most recent** declaration wins, so search from the end. Write `resolve(locals, name)`, returning `Some(slot)` of the last local with that name, or `None` if there is none (then the name must be a global). This is `resolve_local` from `companion/rust/src/compiler.rs`, simplified. Use a `while` loop counting down.',
    starter: `fn resolve(locals: &[&str], name: &str)
    -> Option<usize> {
    None
}`,
    solution: `fn resolve(locals: &[&str], name: &str)
    -> Option<usize> {
    let mut i = locals.len();
    while i > 0 {
        i -= 1;
        if locals[i] == name {
            return Some(i);
        }
    }
    None
}`,
    tests: `#[test]
fn finds_a_single_local() {
    let ls = ["a", "b"];
    assert_eq!(resolve(&ls, "b"), Some(1));
}
#[test]
fn the_latest_declaration_wins() {
    let ls = ["x", "y", "x"];
    assert_eq!(resolve(&ls, "x"), Some(2));
}
#[test]
fn slot_zero_is_a_real_slot() {
    let ls = ["n", "m"];
    assert_eq!(resolve(&ls, "n"), Some(0));
}
#[test]
fn unknown_names_are_none() {
    assert_eq!(resolve(&["a"], "z"), None);
    assert_eq!(resolve(&[], "a"), None);
}`,
    hints: [
      'Two answers are possible: a slot number, or “not a local”. That is exactly `Option<usize>`: `Some(slot)` or `None`.',
      'Start one past the end, `let mut i = locals.len();`, and loop `while i > 0`. Take one off `i` *before* reading `locals[i]`, so the first slot you read is the last one.',
      'Inside the loop: `i -= 1; if locals[i] == name { return Some(i); }`. If the loop finishes without returning, the last line of the function is `None`.',
    ],
    walkthrough: `**How to think about it.** Picture the locals as a stack of name cards, newest on top: for \`["x", "y", "x"]\` the top card is the inner \`x\` in slot 2, and it hides the outer \`x\` in slot 0. Looking a name up means reading from the top down and stopping at the first match. There are two kinds of answer, "slot 2" and "not here at all", and the second is not a number, so the return type is \`Option<usize>\` rather than a \`usize\` with a magic value. (Using \`-1\` would not even type-check: \`usize\` cannot be negative.)

**The solution, line by line.**

- \`let mut i = locals.len();\` starts one past the last slot. With three locals, \`i\` is 3.
- \`while i > 0 {\` keeps going while there is a slot below \`i\` left to read. Counting down with \`usize\` needs care: \`i\` can never go below 0, so the test is \`i > 0\`, and the step comes first.
- \`i -= 1;\` moves to the slot to read now: 2, then 1, then 0.
- \`if locals[i] == name {\` compares two string slices; \`==\` on \`&str\` compares their text.
- \`return Some(i);\` leaves at once with the slot, wrapped in \`Some\`, so the caller has to read the slip before using it.
- \`None\` (the last line, after the loop) is reached only when no slot matched: the name is not a local.

For \`resolve(&["x", "y", "x"], "x")\`: \`i\` goes 3 to 2, \`locals[2]\` is \`"x"\`, so the answer is \`Some(2)\`, the inner declaration. For an empty list the loop never runs and the answer is \`None\`.

**How the real compiler writes it.** \`resolve_local\` in the companion does the same search in one line, with iterators (a later chapter): \`locals.iter().enumerate().rev().find(...)?\`, and that \`?\` on an \`Option\` is the subject of the next chapter.

**Common wrong attempts.**

- Searching from the start finds the *outer* \`x\`, slot 0, so an inner variable could never hide an outer one.
- \`while i > 0 { if locals[i - 1] == name { return Some(i); } i -= 1; }\` checks the right slot but returns \`i\`, one too many: the classic off-by-one, which the test for slot 0 catches.
- \`let mut i = locals.len() - 1;\` looks natural, but for an empty list \`0 - 1\` on a \`usize\` panics with "attempt to subtract with overflow".`,
    wrong: [
      {
        code: `fn resolve(locals: &[&str], name: &str)
    -> Option<usize> {
    let mut i = 0;
    while i < locals.len() {
        if locals[i] == name {
            return Some(i);
        }
        i += 1;
    }
    None
}`,
        why: 'Searching from the start finds the oldest declaration, so `["x", "y", "x"]` gives `Some(0)` instead of `Some(2)`.',
      },
      {
        code: `fn resolve(locals: &[&str], name: &str)
    -> Option<usize> {
    let mut i = locals.len();
    while i > 0 {
        if locals[i - 1] == name {
            return Some(i);
        }
        i -= 1;
    }
    None
}`,
        why: 'It compares slot `i - 1` but returns `i`, one too many.',
      },
    ],
  },
  addTop: {
    lang: 'rust',
    title: 'Add the top two values',
    prompt: 'A toy VM stack is a slice of `Value`s, with the top at the end. Write `add_top(st)`, which returns `Ok` with the sum of the top two values. With fewer than two values, return `Err("stack underflow")` (as a `String`). If either value is not a number, return the error that `as_num` gives, using `?` rather than writing that message again.',
    starter: `#[derive(Debug, PartialEq)]
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

fn add_top(st: &[Value])
    -> Result<f64, String> {
    todo!()
}`,
    solution: `#[derive(Debug, PartialEq)]
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

fn add_top(st: &[Value])
    -> Result<f64, String> {
    let n = st.len();
    if n < 2 {
        return Err(String::from(
            "stack underflow",
        ));
    }
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
        code: `#[derive(Debug, PartialEq)]
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

fn add_top(st: &[Value])
    -> Result<f64, String> {
    let n = st.len();
    let a = as_num(&st[n - 2])?;
    let b = as_num(&st[n - 1])?;
    Ok(a + b)
}`,
        why: 'Without the length check, a stack of one value makes `n - 2` underflow, which panics, so the test expecting the underflow error fails.',
      },
      {
        code: `#[derive(Debug, PartialEq)]
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

fn add_top(st: &[Value])
    -> Result<f64, String> {
    let n = st.len();
    if n < 2 {
        return Err(String::from(
            "stack underflow",
        ));
    }
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
    prompt: 'Write `top_two(st)`, which returns `Some((below, top))` for the last two numbers of the slice, or `None` if there are fewer than two. Use `st.len().checked_sub(2)`, which gives `None` instead of going below zero, together with `?`.',
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
    q: 'What does `[4, 5, 6].get(9)` return?',
    options: [
      {
        t: '`undefined`',
        why: 'Rust has no `undefined`.',
      },
      {
        t: '`None`',
        correct: true,
        why: '`get` asks politely and answers with an `Option`; there is no slot 9.',
      },
      {
        t: 'It panics: index out of bounds',
        why: 'That is what `xs[9]` does. `get` returns `None` instead.',
      },
    ],
  },
  {
    q: `Does this compile?
\`\`\`
match find(&xs, 5) {
    Some(i) => println!("{i}"),
}
\`\`\``,
    options: [
      {
        t: 'Yes, and it prints nothing when 5 is missing',
        why: 'A `match` with an uncovered variant does not compile.',
      },
      {
        t: 'Yes, but it panics when 5 is missing',
        why: 'The compiler catches it before the program runs.',
      },
      {
        t: 'No: E0004, `None` not covered',
        correct: true,
        why: '`match` must be exhaustive; add `None => ...`, or use `if let`.',
      },
    ],
  },
  {
    q: 'Where is `.unwrap()` on an `Option` a reasonable choice?',
    options: [
      {
        t: 'In a test, or where `None` would mean your own program has a bug',
        correct: true,
        why: 'A panic there points straight at the bug. For input that can really be missing, handle `None`.',
      },
      {
        t: 'On user input, to keep the code short',
        why: 'One bad input then stops the whole program.',
      },
      {
        t: 'Nowhere: it does not compile on `None`',
        why: 'It compiles; it panics at run time if the value is `None`.',
      },
    ],
  },
  {
    q: 'Which TypeScript type is closest to `Option<number>`?',
    options: [
      {
        t: '`number`, with `-1` meaning missing',
        why: 'That is the magic-value habit `Option` replaces: `-1` is still a number.',
      },
      {
        t: '`number | undefined`, under `strictNullChecks`',
        correct: true,
        why: 'Both make you check before use; `Option` is an ordinary enum, so the check never depends on compiler settings.',
      },
      {
        t: '`number[]`',
        why: 'An array can hold many values; an `Option` holds at most one.',
      },
    ],
  },
  {
    q: 'On this machine `&i32` is 8 bytes. How big is `Option<&i32>`?',
    options: [
      {
        t: '16 bytes: the reference plus a tag',
        why: 'No tag is needed: a reference is never null, so `None` uses the null pattern.',
      },
      {
        t: '9 bytes',
        why: 'Sizes are rounded up to the alignment anyway; and here no tag byte is needed at all.',
      },
      {
        t: '8 bytes, the same as `&i32`',
        correct: true,
        why: 'The null pointer optimization, which the standard library guarantees for references and `Box`.',
      },
    ],
  },
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
      {
        t: '`Ok(1.0)`: the failing operand is skipped',
        why: 'Nothing is skipped: the `?` on `as_num(b)` returns the `Err` at once.',
      },
      {
        t: '`Err("not a number")`',
        correct: true,
        why: 'The first `?` unwraps `Ok(1.0)`; the second sees an `Err` and returns it from `sub`. `Ok(x - y)` never runs.',
      },
      {
        t: 'It panics',
        why: '`?` never panics. It returns the error as an ordinary value.',
      },
    ],
  },
  {
    q: 'You call `as_num(&t);` on a line of its own and ignore the answer. What happens?',
    options: [
      {
        t: 'It does not compile',
        why: 'It compiles, with a warning.',
      },
      {
        t: 'rustc warns: unused `Result` that must be used',
        correct: true,
        why: 'An ignored `Result` might be an ignored `Err`, so the compiler points it out.',
      },
      {
        t: 'The program panics if it was an `Err`',
        why: 'Nothing happens to an ignored `Err` at run time; that is why the warning exists.',
      },
    ],
  },
  {
    q: 'Where may you write `?` after a `Result`?',
    options: [
      {
        t: 'Anywhere: it turns errors into panics',
        why: 'That is `unwrap`. `?` returns the error to the caller.',
      },
      {
        t: 'Only inside `main`',
        why: '`main` is allowed if it returns a `Result`, but so is any function that does.',
      },
      {
        t: 'In a function whose return type can hold the early return, such as a `Result`',
        correct: true,
        why: 'Elsewhere it is E0277: the `?` operator can only be used in a function that returns `Result` or `Option`.',
      },
    ],
  },
  {
    q: 'What is the TypeScript Drip VM’s way of stopping on a runtime error, and drip-rs’s?',
    options: [
      {
        t: 'Both throw an exception',
        why: 'Rust has no exceptions for ordinary errors; drip-rs returns `Err`.',
      },
      {
        t: 'TypeScript throws and `interpret` catches; drip-rs returns `Err` up every frame with `?`',
        correct: true,
        why: 'Same bookkeeping (message and trace), different way of getting back to `interpret`.',
      },
      {
        t: 'Both return an error value',
        why: 'The TypeScript VM’s `runtimeError` ends with `throw new VmRuntimeError(message)`.',
      },
    ],
  },
  {
    q: '`self.frames.last()` gives an `Option<&CallFrame>`. In a function returning `Option`, what does `self.frames.last()?` do when there are no frames?',
    options: [
      {
        t: 'Returns `None` from the function',
        correct: true,
        why: '`?` after an `Option` turns `None` into an early `return None`.',
      },
      {
        t: 'Panics with “called unwrap on None”',
        why: 'That is `unwrap()`, not `?`.',
      },
      {
        t: 'Gives a default frame',
        why: 'There is no default; the function returns early.',
      },
    ],
  },
];
