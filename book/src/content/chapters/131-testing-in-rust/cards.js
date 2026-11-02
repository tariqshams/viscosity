// Chapter 131 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from the two old testing chapters.

export const prompts = {
  'test-pass': {
    q: 'When does a `#[test]` function pass, and when does it fail?',
    a: 'It passes if it returns normally and fails if it panics (an assert macro, `todo!()`, an out-of-bounds index…).',
  },
  'test-cfg': {
    q: 'What does `#[cfg(test)]` on `mod tests` do?',
    a: 'Compiles the module only when building tests, so normal builds don’t include test code.',
  },
  'test-private': {
    q: 'Why can a unit test in `mod tests` call a private function defined in its parent module?',
    a: '`tests` is a child module, and private items are visible to their module’s descendants. `use super::*` brings them in.',
  },
  'integ-what': {
    q: 'How do integration tests in `tests/` differ from unit tests?',
    a: 'Each file is a separate crate that depends on yours, so it sees only your `pub` API, as a user would.',
  },
  'assert-eq': {
    q: 'What does a failing `assert_eq!(a, b)` print that `assert!(a == b)` doesn’t?',
    a: 'Both values, as `left:` and `right:`.',
  },
  'assert-traits': {
    q: 'Which two traits must a type implement to be used in `assert_eq!`?',
    a: '`PartialEq` (to compare) and `Debug` (to print the values when they differ). `#[derive(Debug, PartialEq)]` gives both.',
  },
  'should-panic-expected': {
    q: 'Why add `expected = "use after free"` to `#[should_panic]`?',
    a: 'So the test passes only if the panic message contains that text; a panic for some other reason then fails it.',
  },
  'harness-false': {
    q: 'In Cargo.toml, what does `harness = false` on a `[[test]]` target mean?',
    a: 'The file is not run by the standard test harness: it supplies its own `main`, and cargo judges it by its exit code.',
  },
};

export const examples = {
  'mini-harness': {
    lang: 'rust',
    title: 'cargo test in miniature',
    code: `use std::panic::catch_unwind;

fn is_digit(c: char) -> bool {
    c.is_ascii_digit()
}

// Two "tests": plain functions that
// panic if something is wrong.
fn digits() {
    assert!(is_digit('7'));
}

fn letters() {
    assert!(is_digit('x')); // wrong!
}

fn main() {
    let tests: [(&str, fn()); 2] = [
        ("digits", digits),
        ("letters", letters),
    ];
    let mut failed = 0;
    for (name, test) in tests {
        // Run it; catch a panic.
        let r = catch_unwind(test);
        let mut word = "ok";
        if r.is_err() {
            word = "FAILED";
            failed += 1;
        }
        println!("{name} ... {word}");
    }
    println!("{failed} failed");
}`,
  },
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
  firstDiff: {
    lang: 'rust',
    title: 'Where do two outputs differ?',
    prompt: 'A test runner for Drip programs compares the lines a program printed with the lines it was expected to print. Write `first_diff`, which returns the **1-based** number of the first line that differs, or `None` if the two are the same. A missing or extra line counts as a difference: `["a", "b"]` against `["a"]` differs at line 2.',
    starter: `fn first_diff(want: &[&str],
    got: &[&str]) -> Option<usize> {
    todo!()
}`,
    solution: `fn first_diff(want: &[&str],
    got: &[&str]) -> Option<usize> {
    let n = want.len().max(got.len());
    for i in 0..n {
        if want.get(i) != got.get(i) {
            return Some(i + 1);
        }
    }
    None
}`,
    tests: `#[test]
fn equal_outputs() {
    assert_eq!(first_diff(&["1", "2"], &["1", "2"]), None);
    assert_eq!(first_diff(&[], &[]), None);
}

#[test]
fn a_changed_line() {
    let want = ["a", "b", "c"];
    assert_eq!(first_diff(&want, &["a", "x", "c"]), Some(2));
    assert_eq!(first_diff(&want, &["z", "b", "c"]), Some(1));
}

#[test]
fn a_missing_or_extra_line() {
    assert_eq!(first_diff(&["a", "b"], &["a"]), Some(2));
    assert_eq!(first_diff(&["a"], &["a", "b"]), Some(2));
    assert_eq!(first_diff(&[], &["x"]), Some(1));
}`,
    hints: [
      'You have to look at every line position up to the end of the *longer* of the two lists, or a missing last line would go unnoticed.',
      'Loop `i` over `0..n`, where `n` is `want.len().max(got.len())`. `want.get(i)` gives `Some(&line)` inside the slice and `None` past its end, so comparing two `get`s handles missing lines for you.',
      'At the first `i` where `want.get(i) != got.get(i)`, return `Some(i + 1)` (lines count from 1). After the loop, return `None`.',
    ],
    walkthrough: `**How to think about it.** Picture the two outputs side by side, one line per row, and run your finger down the rows. The first row where they disagree is the answer. Two things make it slightly tricky: the lists may have different lengths, and people count lines from 1, not 0. So walk as far as the *longer* list goes, and treat "no line here" as a value that can differ from a real line.

\`get\` does exactly that: \`want.get(i)\` is \`Some(&line)\` while \`i\` is inside the slice and \`None\` past its end. Comparing two such \`Option\`s with \`!=\` catches a changed line (\`Some("b")\` against \`Some("x")\`) and a missing one (\`Some("b")\` against \`None\`) with the same test. This is the heart of drip-rs's corpus check, which compares a program's output with the \`# expect:\` lines in its comments.

**The solution, line by line.**

- \`fn first_diff(want: &[&str], got: &[&str]) -> Option<usize> {\` borrows two slices of lines and returns a line number, or \`None\`.
- \`let n = want.len().max(got.len());\` is the length of the longer list: \`max\` on a number returns the bigger of the two.
- \`for i in 0..n {\` visits every row position, 0 up to \`n - 1\`.
- \`if want.get(i) != got.get(i) {\` compares the two rows, with \`None\` standing for "no line".
- \`return Some(i + 1);\` reports the first difference as a 1-based line number and stops.
- \`None\` after the loop: every row matched, so the outputs are the same. For two empty lists \`n\` is 0, the loop never runs, and the answer is \`None\` too.

**Common wrong attempts.**

- Using \`want.iter().zip(got)\`: shorter, but \`zip\` stops at the end of the shorter slice, so \`["a", "b"]\` against \`["a"]\` looks equal. (engine/rust's parity test has a separate "lengths differ" case for exactly this reason.)
- Returning \`Some(i)\`: off by one, because \`i\` counts from 0.
- Indexing with \`want[i]\` instead of \`get(i)\`: past the end of the shorter list it panics with "index out of bounds", which fails the test for the wrong reason.`,
    wrong: [
      {
        code: `fn first_diff(want: &[&str],
    got: &[&str]) -> Option<usize> {
    let ps = want.iter().zip(got);
    for (i, (w, g)) in ps.enumerate() {
        if w != g {
            return Some(i + 1);
        }
    }
    None
}`,
        why: '`zip` stops at the shorter slice, so a missing or extra last line is never seen: `["a", "b"]` vs `["a"]` gives `None`.',
      },
      {
        code: `fn first_diff(want: &[&str],
    got: &[&str]) -> Option<usize> {
    let n = want.len().max(got.len());
    for i in 0..n {
        if want.get(i) != got.get(i) {
            return Some(i);
        }
    }
    None
}`,
        why: 'Off by one: it returns the 0-based index. Line numbers in test output count from 1.',
      },
    ],
  },
  checkColumns: {
    optional: true,
    lang: 'rust',
    title: 'Two guards that explain themselves',
    prompt: 'Write two guards with assert macros. `check_columns` must panic, using `assert_eq!` with the message `"columns differ"`, if two struct-of-arrays columns have different lengths, and do nothing otherwise. `mean` returns the average of a non-empty slice, and must panic with a message containing `"mean of nothing"` when the slice is empty. Two of the tests check the panic message, exactly as `#[should_panic(expected = ...)]` would, so the messages matter.',
    starter: `fn check_columns(xs: &[f64],
    vxs: &[f64]) {
    todo!()
}

fn mean(xs: &[f64]) -> f64 {
    todo!()
}`,
    solution: `fn check_columns(xs: &[f64],
    vxs: &[f64]) {
    assert_eq!(xs.len(), vxs.len(),
        "columns differ");
}

fn mean(xs: &[f64]) -> f64 {
    assert!(!xs.is_empty(),
        "mean of nothing");
    let total: f64 = xs.iter().sum();
    total / xs.len() as f64
}`,
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

fn mean(xs: &[f64]) -> f64 {
    assert!(!xs.is_empty(),
        "mean of nothing");
    let total: f64 = xs.iter().sum();
    total / xs.len() as f64
}`,
        why: 'It panics at the right time, but its message is `assertion failed: xs.len() == vxs.len()`, which doesn’t contain “columns differ”, so the panic-message test fails.',
      },
      {
        code: `fn check_columns(xs: &[f64],
    vxs: &[f64]) {
    assert_eq!(xs.len(), vxs.len(),
        "columns differ");
}

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
    q: 'A test calls a function that still contains `todo!()`. What does `cargo test` report?',
    options: [
      {
        t: 'The test passes, since nothing was asserted',
        why: '`todo!()` panics, and a panic fails the test.',
      },
      {
        t: 'The test fails: `todo!()` panics with “not yet implemented”',
        correct: true,
        why: 'That is why every exercise starter failed its tests.',
      },
      {
        t: 'It doesn’t compile',
        why: '`todo!()` type-checks as any type, so it compiles.',
      },
    ],
  },
  {
    q: 'One of five tests panics. What does the harness do?',
    options: [
      {
        t: 'Stops at once and reports one failure',
        why: 'Each test runs on its own thread; the others still run.',
      },
      {
        t: 'Runs all five, marks that one FAILED, and the run as a whole fails',
        correct: true,
        why: 'You get the full list, then `test result: FAILED. 4 passed; 1 failed`.',
      },
      {
        t: 'Retries the failing test until it passes',
        why: 'There is no retrying.',
      },
    ],
  },
  {
    q: 'Which code can `tests/vm.rs` in drip-rs use?',
    options: [
      {
        t: 'Everything in the `drip` crate, private items too',
        why: 'Each file in `tests/` is a separate crate.',
      },
      {
        t: 'Only `main.rs`',
        why: 'It depends on the library crate, not the binary.',
      },
      {
        t: 'Only what `drip` makes `pub`, such as `drip::Vm`',
        correct: true,
        why: 'It uses the library exactly as a user would.',
      },
      {
        t: 'Nothing; integration tests can only run the binary',
        why: 'They can call the library’s public API directly.',
      },
    ],
  },
  {
    q: '`assert_eq!(p, q)` on your own struct fails to compile. What is the likely fix?',
    options: [
      {
        t: 'Use `assert!(p == q)` instead, which needs no traits',
        why: '`==` still needs `PartialEq`.',
      },
      {
        t: 'Add `#[derive(Debug, PartialEq)]` to the struct',
        correct: true,
        why: '`assert_eq!` compares with `PartialEq` and prints with `Debug` (E0369 and E0277 otherwise).',
      },
      {
        t: 'Make the struct’s fields `pub`',
        why: 'Visibility has nothing to do with comparing or printing.',
      },
    ],
  },
  {
    q: 'A `#[should_panic(expected = "use after free")]` test panics with `index out of bounds`. What happens?',
    options: [
      {
        t: 'It fails: the panic message doesn’t contain the expected text',
        correct: true,
        why: 'The harness says “panic did not contain expected string” and shows both.',
      },
      {
        t: 'It passes, because it panicked',
        why: 'That is plain `#[should_panic]`; `expected` also checks the text.',
      },
      {
        t: 'It is skipped',
        why: 'Nothing is skipped; it is reported as FAILED.',
      },
    ],
  },
];
