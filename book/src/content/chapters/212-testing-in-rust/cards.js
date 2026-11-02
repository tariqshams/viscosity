// Chapter 212 cards. Keys are stable ids: never rename them.

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

const CHECK = `fn check_columns(xs: &[f64],
    vxs: &[f64]) {
    assert_eq!(xs.len(), vxs.len(),
        "columns differ");
}`;

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
    q: 'Why can a unit test in `mod tests` call a private function of the module above it?',
    a: '`tests` is a child module, and private items are visible to their module’s descendants. `use super::*` brings them in.',
  },
  'assert-eq': {
    q: 'What does a failing `assert_eq!(a, b)` print that `assert!(a == b)` doesn’t?',
    a: 'Both values, as `left:` and `right:`.',
  },
  'assert-traits': {
    q: 'Which two traits must a type implement to be used in `assert_eq!`?',
    a: '`PartialEq` (to compare) and `Debug` (to print the values when they differ). `#[derive(Debug, PartialEq)]` gives both.',
  },
  'should-panic': {
    q: 'What does `#[should_panic(expected = "use after free")]` do?',
    a: 'Makes the test pass only if its body panics with a message containing “use after free”.',
  },
  'integ-what': {
    q: 'How do integration tests in `tests/` differ from unit tests?',
    a: 'Each file is a separate crate that depends on yours, so it sees only your `pub` API, as a user would.',
  },
  'integ-common': {
    q: 'Why do shared test helpers go in `tests/common/mod.rs` rather than `tests/common.rs`?',
    a: 'Every `.rs` file directly in `tests/` is compiled as its own test crate. A folder with `mod.rs` is just a module the test files include.',
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
  firstDiff: {
    lang: 'rust',
    title: 'Two pieces of a test harness',
    prompt:
      'Write the two helpers a corpus runner needs. `first_diff` compares expected and actual output lines and returns the 1-based number of the first line that differs, or `None` if they are the same; a missing or extra line counts as a difference. `check_columns` must panic, using `assert_eq!` with the message `"columns differ"`, if two SoA columns have different lengths. The last test checks the panic and its message, as `#[should_panic(expected = ...)]` would.',
    starter: `fn first_diff(want: &[&str],
    got: &[&str]) -> Option<usize> {
    todo!()
}

fn check_columns(xs: &[f64],
    vxs: &[f64]) {
    todo!()
}`,
    solution: `${FIRST}

${CHECK}`,
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
}

#[test]
fn equal_columns_pass() {
    check_columns(&[1.0, 2.0], &[0.5, 0.5]);
    check_columns(&[], &[]);
}

#[test]
fn unequal_columns_panic() {
    // like #[should_panic(expected = ...)]
    let r = std::panic::catch_unwind(|| {
        check_columns(&[1.0, 2.0], &[0.5]);
    });
    let e = r.expect_err("it should panic");
    let msg = e.downcast_ref::<String>();
    assert!(msg.is_some_and(|m| m.contains("columns differ")));
}`,
    hints: [
      'Loop `i` from 0 to the *longer* length, `want.len().max(got.len())`. `want.get(i)` is `None` past the end, so comparing two `Option`s handles missing lines for free.',
      'Return `Some(i + 1)` at the first `i` where `want.get(i) != got.get(i)`: the tests count lines from 1.',
      'For `check_columns`: `assert_eq!(xs.len(), vxs.len(), "columns differ");`.',
    ],
    walkthrough: `**\`first_diff\`** is the heart of drip-rs’s \`check\`, which compares stdout line by line up to the longer of the two lengths. The trick is \`get\`: \`want.get(i)\` is \`Some(&line)\` inside the slice and \`None\` past its end. Comparing two \`Option<&&str>\` values with \`!=\` then catches both a changed line (\`Some("b")\` vs \`Some("x")\`) and a missing one (\`Some("b")\` vs \`None\`). A \`zip\` would be shorter but stops at the shorter slice, so it would call \`["a", "b"]\` and \`["a"]\` equal: engine/rust’s parity test has a separate “lengths differ” case for exactly that reason.

**\`check_columns\`** is an assertion in ordinary code. \`assert_eq!\` with a message panics with \`assertion \\\`left == right\\\` failed: columns differ\` followed by both lengths, and the last test passes because that text is in the message. Without the message the panic still happens, but its text is only \`assertion \\\`left == right\\\` failed\` (or, for a bare \`assert!(xs.len() == vxs.len())\`, \`assertion failed: ...\`), so a \`#[should_panic(expected = "columns differ")]\` test would fail, and so does this one. (The test catches the panic itself with \`std::panic::catch_unwind\`, which runs a closure and returns \`Err\` with the panic’s message if it panicked; that is roughly what \`#[should_panic]\` does for you.)`,
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
}

${CHECK}`,
        why: '`zip` stops at the shorter slice, so a missing or extra last line is never seen: `["a", "b"]` vs `["a"]` gives `None`.',
      },
      {
        code: `${FIRST}

fn check_columns(xs: &[f64],
    vxs: &[f64]) {
    assert!(xs.len() == vxs.len());
}`,
        why: 'It panics at the right time, but its message is `assertion failed: xs.len() == vxs.len()`, which doesn’t contain “columns differ”, so the panic test fails, as `should_panic(expected = ...)` would. Pass the message.',
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
}

${CHECK}`,
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
      { t: 'Because tests run in a special unsafe mode', why: 'There is no such mode.' },
      { t: 'It can’t; only `pub` functions can be tested', why: 'Unit tests can test private functions. Integration tests can’t.' },
      { t: 'Because `tests` is a child module, and private items are visible to descendants', correct: true, why: 'Chapter 211’s rule, plus `use super::*`.' },
    ],
  },
  {
    q: '`assert_eq!(p, q)` on your own struct fails to compile. What is the likely fix?',
    options: [
      { t: 'Add `#[derive(Debug, PartialEq)]` to the struct', correct: true, why: '`assert_eq!` compares with `PartialEq` and prints with `Debug`.' },
      { t: 'Use `assert!(p == q)` instead, which needs no traits', why: '`==` still needs `PartialEq`.' },
      { t: 'Make the struct’s fields `pub`', why: 'Visibility has nothing to do with comparing or printing.' },
    ],
  },
  {
    q: 'Which code can `tests/vm.rs` in drip-rs use?',
    options: [
      { t: 'Everything in the `drip` crate, private items too', why: 'Each file in `tests/` is a separate crate.' },
      { t: 'Only what `drip` makes `pub`, such as `drip::Vm`', correct: true, why: 'It uses the library exactly as a user would.' },
      { t: 'Only `main.rs`', why: 'It depends on the library crate, not the binary.' },
      { t: 'Nothing; integration tests can only run the binary', why: 'They can call the library’s public API directly.' },
    ],
  },
  {
    q: 'Why is drip-rs’s corpus suite declared with `harness = false`?',
    options: [
      { t: 'It runs faster without a harness', why: 'Speed isn’t the reason given; reporting is.' },
      { t: 'Cargo can’t run more than 100 `#[test]` functions', why: 'There is no such limit.' },
      { t: 'So its own `main` can run every corpus program and print one line per program, like the TypeScript runner', correct: true, why: 'The Cargo.toml comment says so; the exit code tells cargo whether it passed.' },
    ],
  },
  {
    q: 'engine/rust’s parity test collects every mismatch in a `Vec` and asserts once at the end. Why not `assert_eq!` on each program?',
    options: [
      { t: '`assert_eq!` can’t compare strings', why: 'It can.' },
      { t: 'The first failing `assert_eq!` would panic and hide every later difference', correct: true, why: 'Collecting first reports all of them, with the first differing line of each.' },
      { t: 'To make the test pass more often', why: 'It fails whenever any program differs.' },
      { t: 'Because tests may not panic', why: 'Panicking is exactly how a test fails; the single `assert!` panics too.' },
    ],
  },
];
