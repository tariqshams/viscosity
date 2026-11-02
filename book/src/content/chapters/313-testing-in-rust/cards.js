// Chapter 313 cards. Keys are stable ids: never rename them.

const FIRST = `fn first_diff(want: &[&str],
    got: &[&str]) -> Option<usize> {
    let n = want.len().max(got.len());
    for i in 0..n {
        if want.get(i) != got.get(i) {
            return Some(i + 1);
        }
    }
    None
}`;

export const prompts = {
  'test-pass': {
    q: 'When does a `#[test]` function pass, and when does it fail?',
    a: 'It passes if it returns normally and fails if it panics (an assert macro, `todo!()`, an out-of-bounds index…).',
  },
  'test-attr': {
    q: 'What is `#[test]`, grammatically, and what does it tell the compiler?',
    a: 'An attribute, a note written `#[...]` above an item. It marks the function below as a test for the harness to run.',
  },
  'test-cfg': {
    q: 'What does `#[cfg(test)]` on `mod tests` do?',
    a: 'Compiles the module only when building tests, so normal builds don’t include test code.',
  },
  'test-private': {
    q: 'Why can a unit test in `mod tests` call a private function of the module above it?',
    a: '`tests` is a child module, and private items are visible to their module’s descendants. `use super::*` brings them in.',
  },
  'test-filter': {
    q: 'What does `cargo test letters` run?',
    a: 'Only the tests whose full name (module path included) contains `letters`; the rest are counted as “filtered out”.',
  },
  'integ-what': {
    q: 'How do integration tests in `tests/` differ from unit tests?',
    a: 'Each file is a separate crate that depends on yours, so it sees only your `pub` API, as a user would.',
  },
  'integ-common': {
    q: 'Why do shared test helpers go in `tests/common/mod.rs` rather than `tests/common.rs`?',
    a: 'Every `.rs` file directly in `tests/` is compiled as its own test crate. A folder with `mod.rs` is just a module the test files include.',
  },
  'test-zero': {
    q: 'Your run says `running 0 tests ... test result: ok`, but you wrote a test function. What is the likely mistake?',
    a: 'The function is missing `#[test]`, so the harness never sees it: a “pass” that checked nothing.',
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
};

export const exercises = {
  firstDiff: {
    lang: 'rust',
    title: 'Where do two outputs differ?',
    prompt:
      'A test runner for Drip programs compares the lines a program printed with the lines it was expected to print. Write `first_diff`, which returns the **1-based** number of the first line that differs, or `None` if the two are the same. A missing or extra line counts as a difference: `["a", "b"]` against `["a"]` differs at line 2.',
    starter: `fn first_diff(want: &[&str],
    got: &[&str]) -> Option<usize> {
    todo!()
}`,
    solution: FIRST,
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
};

export const quiz = [
  {
    q: 'A test calls a function that still contains `todo!()`. What does `cargo test` report?',
    options: [
      { t: 'The test passes, since nothing was asserted', why: '`todo!()` panics, and a panic fails the test.' },
      { t: 'The test fails: `todo!()` panics with “not yet implemented”', correct: true, why: 'That is why every exercise starter failed its tests.' },
      { t: 'It doesn’t compile', why: '`todo!()` type-checks as any type, so it compiles.' },
    ],
  },
  {
    q: 'Why can `mod tests` inside `scanner.rs` call the private `is_alpha`?',
    options: [
      { t: 'Because `#[cfg(test)]` turns off privacy', why: '`cfg(test)` only decides whether the module is compiled.' },
      { t: 'It can’t; only `pub` functions can be tested', why: 'Unit tests can test private functions. Integration tests can’t.' },
      { t: 'Because `tests` is a child module, and private items are visible to descendants', correct: true, why: 'The privacy rule, plus `use super::*`.' },
    ],
  },
  {
    q: 'One of five tests panics. What does the harness do?',
    options: [
      { t: 'Stops at once and reports one failure', why: 'Each test runs on its own thread; the others still run.' },
      { t: 'Runs all five, marks that one FAILED, and the run as a whole fails', correct: true, why: 'You get the full list, then `test result: FAILED. 4 passed; 1 failed`.' },
      { t: 'Retries the failing test until it passes', why: 'There is no retrying.' },
    ],
  },
  {
    q: 'Which code can `tests/vm.rs` in drip-rs use?',
    options: [
      { t: 'Everything in the `drip` crate, private items too', why: 'Each file in `tests/` is a separate crate.' },
      { t: 'Only `main.rs`', why: 'It depends on the library crate, not the binary.' },
      { t: 'Only what `drip` makes `pub`, such as `drip::Vm`', correct: true, why: 'It uses the library exactly as a user would.' },
      { t: 'Nothing; integration tests can only run the binary', why: 'They can call the library’s public API directly.' },
    ],
  },
  {
    q: 'You remove `use super::*;` from a `tests` module. What happens?',
    options: [
      { t: 'The tests still compile; `super` is implied', why: 'A `use` is never implied; each module has its own names.' },
      { t: 'The tests run but are skipped', why: 'Nothing is skipped; it does not compile.' },
      { t: 'E0425: the parent’s functions are not in scope', correct: true, why: 'rustc suggests importing them, e.g. `use crate::is_alpha;`.' },
    ],
  },
];
