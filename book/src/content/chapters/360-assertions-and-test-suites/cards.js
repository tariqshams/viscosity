// Chapter 359-b cards. Keys are stable ids: never rename them.

const CHECK = `fn check_columns(xs: &[f64],
    vxs: &[f64]) {
    assert_eq!(xs.len(), vxs.len(),
        "columns differ");
}`;

const MEAN = `fn mean(xs: &[f64]) -> f64 {
    assert!(!xs.is_empty(),
        "mean of nothing");
    let total: f64 = xs.iter().sum();
    total / xs.len() as f64
}`;

export const prompts = {
  'assert-three': {
    q: 'Name the three assert macros and what makes each one panic.',
    a: '`assert!(c)` panics if `c` is false; `assert_eq!(a, b)` if `a != b`; `assert_ne!(a, b)` if `a == b`.',
  },
  'assert-eq': {
    q: 'What does a failing `assert_eq!(a, b)` print that `assert!(a == b)` doesn’t?',
    a: 'Both values, as `left:` and `right:`.',
  },
  'assert-traits': {
    q: 'Which two traits must a type implement to be used in `assert_eq!`?',
    a: '`PartialEq` (to compare) and `Debug` (to print the values when they differ). `#[derive(Debug, PartialEq)]` gives both.',
  },
  'assert-msg': {
    q: 'How do you add your own explanation to an assertion?',
    a: 'Pass it after the checks, formatted like `println!`: `assert!(n > 0, "n = {n} must be positive")`.',
  },
  'should-panic': {
    q: 'What does `#[should_panic]` on a test do?',
    a: 'Flips the contract: the test passes only if its body panics, and fails if it returns normally.',
  },
  'should-panic-expected': {
    q: 'Why add `expected = "use after free"` to `#[should_panic]`?',
    a: 'So the test passes only if the panic message contains that text; a panic for some other reason then fails it.',
  },
  'test-result': {
    q: 'What does it mean for a test to return `Result<(), String>`?',
    a: '`Ok(())` passes and `Err(..)` fails, and the test body may use `?` to stop early on an error.',
  },
  'harness-false': {
    q: 'What does `harness = false` on a `[[test]]` target mean?',
    a: 'The file is not run by the standard test harness: it supplies its own `main`, and cargo judges it by its exit code.',
  },
};

export const examples = {
  'asserts-play': {
    lang: 'rust',
    expectError: true,
    title: 'An assert that trips',
    code: `// AoS: element i, field f, nf fields.
fn slot(i: usize, f: usize, nf: usize)
    -> usize {
    f * nf + i // bug: i * nf + f
}

fn main() {
    assert_eq!(slot(0, 0, 2), 0);
    assert_ne!(slot(1, 0, 2), 0);
    println!("first two checks pass");
    assert_eq!(slot(3, 1, 2), 7,
        "element 3, field 1");
    println!("never printed");
}`,
  },
};

export const exercises = {
  checkColumns: {
    lang: 'rust',
    title: 'Two guards that explain themselves',
    prompt:
      'Write two guards with assert macros. `check_columns` must panic, using `assert_eq!` with the message `"columns differ"`, if two struct-of-arrays columns have different lengths, and do nothing otherwise. `mean` returns the average of a non-empty slice, and must panic with a message containing `"mean of nothing"` when the slice is empty. Two of the tests check the panic message, exactly as `#[should_panic(expected = ...)]` would, so the messages matter.',
    starter: `fn check_columns(xs: &[f64],
    vxs: &[f64]) {
    todo!()
}

fn mean(xs: &[f64]) -> f64 {
    todo!()
}`,
    solution: `${CHECK}

${MEAN}`,
    tests: `// What #[should_panic(expected = ...)]
// does: run the code, catch the panic,
// and check its message.
fn panic_message(f: impl FnOnce()) -> String {
    let r = std::panic::catch_unwind(std::panic::AssertUnwindSafe(f));
    let e = r.expect_err("it should panic");
    if let Some(s) = e.downcast_ref::<String>() {
        s.clone()
    } else if let Some(s) = e.downcast_ref::<&str>() {
        s.to_string()
    } else {
        String::new()
    }
}

#[test]
fn equal_columns_pass() {
    check_columns(&[1.0, 2.0], &[0.5, 0.5]);
    check_columns(&[], &[]);
}

#[test]
fn unequal_columns_panic() {
    let m = panic_message(|| check_columns(&[1.0, 2.0], &[0.5]));
    assert!(m.contains("columns differ"), "message was {m:?}");
}

#[test]
fn mean_of_some_numbers() {
    assert_eq!(mean(&[1.0, 2.0, 6.0]), 3.0);
    assert_eq!(mean(&[4.5]), 4.5);
}

#[test]
fn mean_of_nothing_panics() {
    let m = panic_message(|| {
        mean(&[]);
    });
    assert!(m.contains("mean of nothing"), "message was {m:?}");
}`,
    hints: [
      'Each function starts with one assertion that states its promise, and both assertions need a message, because two tests look for particular words in the panic message.',
      '`check_columns` is a single line: `assert_eq!(xs.len(), vxs.len(), "columns differ");`. For `mean`, check `!xs.is_empty()` with `assert!` and the message `"mean of nothing"`.',
      'After the assertion, `mean` adds up with `let total: f64 = xs.iter().sum();` and divides by `xs.len() as f64` (a `usize` must be turned into an `f64` before dividing).',
    ],
    walkthrough: `**How to think about it.** Each function has a promise it relies on: two columns of a struct of arrays must be the same length, and an average needs at least one number. An assertion states that promise in code, at the top, so that breaking it stops the program with a clear message instead of producing nonsense later (columns silently skipped by a \`zip\`, or a \`NaN\` from dividing by zero). The tests check the messages, so think about what a person reading the failure would want to see.

**The solution, line by line.**

- \`fn check_columns(xs: &[f64], vxs: &[f64]) {\` borrows the two columns and returns nothing; it exists only to check.
- \`assert_eq!(xs.len(), vxs.len(), "columns differ");\` compares the lengths. Equal: nothing happens. Different: it panics with \`assertion \\\`left == right\\\` failed: columns differ\` followed by both lengths, which contains the text the panic test looks for.
- \`fn mean(xs: &[f64]) -> f64 {\` returns the average.
- \`assert!(!xs.is_empty(), "mean of nothing");\` guards the division below: \`!\` means "not", so this reads "assert the slice is not empty". On an empty slice the panic message is exactly \`mean of nothing\`.
- \`let total: f64 = xs.iter().sum();\` adds the numbers up. \`sum\` can build several kinds of number, so the \`: f64\` tells it which.
- \`total / xs.len() as f64\` divides by the count; \`as f64\` converts the \`usize\` length into a float, because Rust never mixes number types silently.

**Common wrong attempts.**

- \`assert!(xs.len() == vxs.len());\` with no message: it panics at the right time, but its message is \`assertion failed: xs.len() == vxs.len()\`, which does not contain "columns differ", so the panic test fails (as a \`should_panic(expected = ...)\` test would). (And on a failure in real use, it would not show the two lengths.)
- Leaving out the assertion in \`mean\`: an empty slice gives \`0.0 / 0.0\`, which is \`NaN\`, and no panic at all, so \`mean_of_nothing_panics\` fails: there was no panic to catch (a \`should_panic\` test would say "test did not panic as expected").
- Writing \`assert!(xs.is_empty(), ...)\` without the \`!\`: now every non-empty slice panics and only the empty one passes, the exact opposite of the promise.`,
    wrong: [
      {
        code: `fn check_columns(xs: &[f64],
    vxs: &[f64]) {
    assert!(xs.len() == vxs.len());
}

${MEAN}`,
        why: 'It panics at the right time, but its message is `assertion failed: xs.len() == vxs.len()`, which doesn’t contain “columns differ”, so the panic-message test fails.',
      },
      {
        code: `${CHECK}

fn mean(xs: &[f64]) -> f64 {
    let total: f64 = xs.iter().sum();
    total / xs.len() as f64
}`,
        why: 'Without the guard, an empty slice gives `0.0 / 0.0 = NaN` and no panic, so the test that expects a panic fails.',
      },
    ],
  },
};

export const quiz = [
  {
    q: '`assert_eq!(p, q)` on your own struct fails to compile. What is the likely fix?',
    options: [
      { t: 'Use `assert!(p == q)` instead, which needs no traits', why: '`==` still needs `PartialEq`.' },
      { t: 'Add `#[derive(Debug, PartialEq)]` to the struct', correct: true, why: '`assert_eq!` compares with `PartialEq` and prints with `Debug` (E0369 and E0277 otherwise).' },
      { t: 'Make the struct’s fields `pub`', why: 'Visibility has nothing to do with comparing or printing.' },
    ],
  },
  {
    q: 'Why prefer `assert_eq!(count, 3)` to `assert!(count == 3)`?',
    options: [
      { t: 'It is faster', why: 'Both do one comparison.' },
      { t: 'It checks more carefully', why: 'Both use `==`; they fail in exactly the same cases.' },
      { t: 'On failure it prints both values, so you see what `count` actually was', correct: true, why: '`assert!` can only print the expression it checked.' },
    ],
  },
  {
    q: 'A `#[should_panic(expected = "use after free")]` test panics with `index out of bounds`. What happens?',
    options: [
      { t: 'It fails: the panic message doesn’t contain the expected text', correct: true, why: 'The harness says “panic did not contain expected string” and shows both.' },
      { t: 'It passes, because it panicked', why: 'That is plain `#[should_panic]`; `expected` also checks the text.' },
      { t: 'It is skipped', why: 'Nothing is skipped; it is reported as FAILED.' },
    ],
  },
  {
    q: 'Why is drip-rs’s corpus suite declared with `harness = false`?',
    options: [
      { t: 'It runs faster without a harness', why: 'Speed isn’t the reason; reporting is.' },
      { t: 'So its own `main` can run every corpus program and print one line per program', correct: true, why: 'A single `#[test]` would give one result for hundreds of programs; the exit code tells cargo whether all passed.' },
      { t: 'Cargo can’t run more than 100 `#[test]` functions', why: 'There is no such limit.' },
    ],
  },
  {
    q: 'engine/rust’s parity test collects every mismatch in a `Vec` and asserts once at the end. Why not `assert_eq!` on each program?',
    options: [
      { t: '`assert_eq!` can’t compare strings', why: 'It can.' },
      { t: 'To make the test pass more often', why: 'It fails whenever any program differs.' },
      { t: 'Because tests may not panic', why: 'Panicking is exactly how a test fails; the single `assert!` panics too.' },
      { t: 'The first failing `assert_eq!` would panic and hide every later difference', correct: true, why: 'Collecting first reports all of them, with the first differing line of each.' },
    ],
  },
];
