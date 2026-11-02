// Chapter 370 cards. Keys are stable ids: never rename them.
// Timings quoted here were measured with rustc 1.97.0 on the book's shared
// cloud VM while the chapter was written; engine/rust numbers are from its
// committed results/compile-speed-2026-10-31.md.

const SUM_HEAD = `// (min, median, p95) of the samples.
// median: the value at index n / 2 of
// the sorted samples; p95: the value at
// index n * 95 / 100.
fn summary(xs: &[f64])
    -> (f64, f64, f64) {`;

const SUM = `${SUM_HEAD}
    let mut s = xs.to_vec();
    s.sort_by(f64::total_cmp);
    let n = s.len();
    (s[0], s[n / 2], s[n * 95 / 100])
}`;

const MEASURE = `use std::hint::black_box;
use std::time::Instant;

// Call f \`runs\` times; return each
// call's time in microseconds.
fn measure<T>(
    runs: usize,
    mut f: impl FnMut() -> T,
) -> Vec<f64> {
    let mut us = Vec::new();
    for _ in 0..runs {
        let t = Instant::now();
        black_box(f());
        let d = t.elapsed();
        us.push(d.as_secs_f64() * 1e6);
    }
    us
}`;

export const prompts = {
  'debug-default': {
    q: 'Which profile does a plain `cargo build` or `cargo run` use, and at what `opt-level`?',
    a: 'The `dev` profile, with `opt-level = 0`: no optimisation.',
  },
  'release-what': {
    q: 'What does `--release` change, by default?',
    a: '`opt-level = 3`, and debug assertions and integer overflow checks turned off.',
  },
  'overflow-modes': {
    q: 'What does adding 1 to a `u8` holding 255 do in a debug build, and in a release build?',
    a: 'Debug: panics with “attempt to add with overflow”. Release: wraps around to 0.',
  },
  'runner-mode': {
    q: 'Which build mode does this book’s Run button use for Rust?',
    a: 'Debug, on the Rust Playground. Open the code in the Playground to switch to Release.',
  },
  'bb-why': {
    q: 'Why did a release-mode loop summing a million numbers 100 times “take” under 200 ns?',
    a: 'Its result was never used, so the optimiser deleted the work. Nothing was measured.',
  },
  'bb-what': {
    q: 'What does `std::hint::black_box(x)` do?',
    a: 'Returns `x` unchanged, while the compiler must assume the value is used in unknown ways, so it cannot delete or precompute the work around it.',
  },
  'bb-limit': {
    q: 'Name two limits of `black_box`.',
    a: 'It is best-effort (never rely on it for correctness), and it does not stop the optimiser rewriting the code between the hidden values, e.g. a loop into a formula.',
  },
  'whole-program': {
    q: 'Why does drip-rs’s `bench.sh` not need `black_box`?',
    a: 'It times whole programs in fresh processes, and each program prints its results: printing is a side effect the optimiser must keep.',
  },
};

export const examples = {
  'bb-play': {
    lang: 'rust',
    title: 'Plain and black-boxed timing',
    code: `use std::hint::black_box;
use std::time::Instant;

fn sum(xs: &[f64]) -> f64 {
    let mut s = 0.0;
    for x in xs {
        s += x;
    }
    s
}

fn main() {
    let xs: Vec<f64> = (0..1_000_000)
        .map(|i| i as f64)
        .collect();

    let t = Instant::now();
    for _ in 0..100 {
        sum(&xs);
    }
    let d = t.elapsed();
    println!("plain: {d:?}");

    let t = Instant::now();
    for _ in 0..100 {
        black_box(sum(black_box(&xs)));
    }
    let d = t.elapsed();
    println!("boxed: {d:?}");
}`,
  },
  'overflow-play': {
    lang: 'rust',
    title: 'Overflow in a debug build',
    expectError: true,
    code: `use std::hint::black_box;

fn main() {
    // black_box hides the 255, so the
    // check happens at run time.
    let x: u8 = black_box(255);
    let y = x + 1;
    println!("255 + 1 = {y}");
}`,
  },
};

export const exercises = {
  summary: {
    lang: 'rust',
    title: 'Summarise the samples',
    prompt:
      'A timing harness collects one time per run, in any order. Write `summary(xs)`, which returns `(min, median, p95)`, taking the minimum and median the way engine/rust’s `compile_speed` does and adding a p95: sort a copy of the samples, then take the value at index `0`, at index `n / 2`, and at index `n * 95 / 100`. Do not change the caller’s slice. You may assume `xs` is not empty.',
    starter: `${SUM_HEAD}
    todo!()
}`,
    solution: SUM,
    tests: `#[test]
fn one_sample() {
    assert_eq!(summary(&[5.0]), (5.0, 5.0, 5.0));
}

#[test]
fn order_does_not_matter() {
    let xs = [3.0, 1.0, 2.0];
    assert_eq!(summary(&xs), (1.0, 2.0, 3.0));
}

#[test]
fn p95_of_a_hundred() {
    let xs: Vec<f64> =
        (1..=100).rev().map(|i| i as f64).collect();
    assert_eq!(summary(&xs), (1.0, 51.0, 96.0));
}

#[test]
fn one_slow_run_moves_only_the_tail() {
    let mut xs = vec![10.0; 99];
    xs.push(500.0);
    let (min, med, p95) = summary(&xs);
    assert_eq!((min, med, p95), (10.0, 10.0, 10.0));
    assert_eq!(xs[99], 500.0);
}`,
    hints: [
      'All three answers are positions in the *sorted* samples. You may not sort `xs` itself (it is borrowed, not yours), so make a copy with `to_vec()`.',
      '`f64` has no ordinary `sort()`, because NaN breaks ordering. Use `s.sort_by(f64::total_cmp)`, as `compile_speed` does.',
      'Then return `(s[0], s[n / 2], s[n * 95 / 100])`, where `n = s.len()`. Integer division rounds down, which keeps every index below `n`.',
    ],
    walkthrough: `**How to think about it.** *Noisy numbers: the median, p95 and a fresh process* explained why one timing is not enough and why the median and p95 describe a noisy set of samples better than the mean. Every one of those statistics is "the value at some position once the samples are sorted", so the work is: sort a copy, then index it three times. The only questions are which positions, and how to sort floating-point numbers in Rust.

**The solution, line by line.**

- \`fn summary(xs: &[f64]) -> (f64, f64, f64) {\` borrows the samples and returns three numbers as a tuple.
- \`    let mut s = xs.to_vec();\` copies them into a \`Vec\` this function owns, so it may reorder it; the caller's slice is untouched, which the last test checks.
- \`    s.sort_by(f64::total_cmp);\` sorts ascending. \`f64\` only has a partial order (NaN is not less than, equal to or greater than anything), so \`sort()\` does not exist for it; \`total_cmp\` is a total order that puts NaN at the end, and passing the function itself as the comparator is the same trick engine/rust uses.
- \`    let n = s.len();\` names the count.
- \`    (s[0], s[n / 2], s[n * 95 / 100])\` picks the smallest, the middle and the 95th-percentile sample. With 100 samples sorted 1 to 100 those indices are 0, 50 and 95, so the values are 1, 51 and 96. With one sample every index is 0. Integer division rounds down, so \`n * 95 / 100\` is always below \`n\` and the indexing can never panic for a non-empty slice.

The last test is the point of reporting more than one number: one slow run in a hundred (a hiccup on a shared VM) changes neither the minimum nor the median nor, here, the p95; only a mean would be dragged up by it.

**Common wrong attempts.**

- \`xs.sort()\` fails twice: \`xs\` is a shared borrow, so it cannot be sorted in place, and \`[f64]\` has no \`sort\` at all (\`f64\` is not \`Ord\`).
- Forgetting to sort returns positions in the order the samples arrived: the "minimum" of \`[3.0, 1.0, 2.0]\` would be 3.
- \`s[n * 95 / 100 - 1]\` (an off-by-one "fix") gives 95 instead of 96 for the hundred samples, and panics for one sample.`,
    wrong: [
      {
        code: `${SUM_HEAD}
    let n = xs.len();
    (xs[0], xs[n / 2], xs[n * 95 / 100])
}`,
        why: 'Without sorting, positions mean nothing: `[3.0, 1.0, 2.0]` gives a “minimum” of 3.',
      },
      {
        code: `${SUM_HEAD}
    let mut s = xs.to_vec();
    s.sort_by(f64::total_cmp);
    let n = s.len();
    (s[0], s[n / 2], s[n - 1])
}`,
        why: 'The last element is the maximum, not the p95: the one slow run (500) becomes the reported tail.',
      },
    ],
  },
  measure: {
    lang: 'rust',
    optional: true,
    title: 'A timing loop that keeps its work',
    prompt:
      'Write `measure(runs, f)`, which calls the closure `f` exactly `runs` times, timing each call with `Instant`, and returns the times in microseconds. Pass each result of `f` through `black_box`, so an optimised build cannot delete the calls.',
    starter: `use std::hint::black_box;
use std::time::Instant;

// Call f \`runs\` times; return each
// call's time in microseconds.
fn measure<T>(
    runs: usize,
    mut f: impl FnMut() -> T,
) -> Vec<f64> {
    todo!()
}`,
    solution: MEASURE,
    tests: `#[test]
fn one_time_per_run() {
    let ts = measure(7, || 1 + 1);
    assert_eq!(ts.len(), 7);
}

#[test]
fn calls_f_exactly_runs_times() {
    let mut calls = 0;
    measure(5, || calls += 1);
    assert_eq!(calls, 5);
}

#[test]
fn times_are_not_negative() {
    let ts = measure(3, || {
        (0..1000).sum::<u64>()
    });
    assert!(ts.iter().all(|&t| t >= 0.0));
}`,
    hints: [
      'Start an empty `Vec<f64>`, and loop `for _ in 0..runs`.',
      'Inside: `let t = Instant::now();`, call `f()`, then `t.elapsed()` gives a `Duration`.',
      'Write the call as `black_box(f());`, and push `t.elapsed().as_secs_f64() * 1e6`.',
    ],
    walkthrough: `**How to think about it.** This is the core of engine/rust's \`compile_speed\` example, without the warm-up: a loop that times one call at a time and keeps the result alive. Two details matter: \`f\` is \`FnMut\`, so it may change things it captured (the second test counts calls that way), and the result must flow into \`black_box\` or a release build may skip the call.

**The solution, line by line.**

- \`fn measure<T>(runs: usize, mut f: impl FnMut() -> T) -> Vec<f64> {\` accepts any closure returning any type \`T\`. \`mut f\` because calling an \`FnMut\` needs mutable access to it.
- \`    let mut us = Vec::new();\` collects microseconds.
- \`    for _ in 0..runs {\` runs exactly \`runs\` times.
- \`        let t = Instant::now();\` starts a clock just before the call.
- \`        black_box(f());\` calls the closure and hands its result to \`black_box\`, so the compiler must assume it is used.
- \`        let d = t.elapsed();\` reads the elapsed time as a \`Duration\`.
- \`        us.push(d.as_secs_f64() * 1e6);\` turns it into seconds as an \`f64\`, then microseconds, and stores it.
- \`    us\` returns the samples, ready for \`summary\`.

**Common wrong attempts.**

- Timing the whole loop once and dividing by \`runs\` gives an average, not samples; you lose the spread that the median and p95 describe, and the test expecting \`runs\` values fails.
- Calling \`f()\` without \`black_box\` passes these tests (they run in debug), but in a release build the calls may vanish, which is exactly the trap in the chapter.`,
    wrong: [
      {
        code: `use std::hint::black_box;
use std::time::Instant;

fn measure<T>(
    runs: usize,
    mut f: impl FnMut() -> T,
) -> Vec<f64> {
    let t = Instant::now();
    for _ in 0..runs {
        black_box(f());
    }
    let d = t.elapsed().as_secs_f64();
    vec![d * 1e6 / runs as f64]
}`,
        why: 'One averaged number, not one sample per run: the spread is lost, and the length test fails.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'You time a function with `cargo run` and get 300 ms. What should you do before believing it?',
    options: [
      { t: 'Nothing: Rust is compiled, so it is already fast', why: 'A plain `cargo run` builds the `dev` profile, `opt-level = 0`.' },
      { t: 'Rebuild with `--release`, and make sure the result is used', correct: true, why: 'In this chapter, the same loop took 317–513 ms in debug, 75–78 ms in release, and almost nothing in release when its result was unused.' },
      { t: 'Run it twice more and take the average', why: 'More runs do not fix an unoptimised build.' },
    ],
  },
  {
    q: 'In a release build, a loop summing a million `f64`s 100 times reports 157 ns. What is the best explanation?',
    options: [
      { t: 'SIMD made it that fast', why: 'That would be hundreds of additions per nanosecond on one core. Vector units are fast, not that fast.' },
      { t: 'The clock is broken in release mode', why: '`Instant` works the same in both builds.' },
      { t: 'The values were cached after the first iteration', why: 'Caches make memory faster; they do not make additions disappear.' },
      { t: 'The sum was never used, so the compiler removed the loop', correct: true, why: 'Dead code elimination. With `black_box` on the input and result, the real work came back: about 75 ms here.' },
    ],
  },
  {
    q: 'What does `black_box(sum(black_box(&xs)))` achieve?',
    options: [
      { t: 'It turns off all optimisation inside `sum`', why: '`sum` is still optimised. Only what flows in and out is hidden.' },
      { t: 'The inner call hides `xs` from the optimiser, and the outer one keeps the result “used”', correct: true, why: 'So the compiler can neither precompute the sum nor throw it away.' },
      { t: 'It guarantees the benchmark measures exactly what production does', why: 'It is best-effort, and production code may be optimised differently anyway.' },
    ],
  },
  {
    q: 'A `u8` holding 255 has 1 added to it. What happens?',
    options: [
      { t: 'It becomes 256 in both builds', why: 'A `u8` cannot hold 256.' },
      { t: 'Debug build: a panic, “attempt to add with overflow”; release build: it wraps to 0', correct: true, why: 'overflow-checks is on in `dev` and off in `release`; both outcomes were observed with rustc 1.97.' },
      { t: 'A compile error in both builds', why: 'With the 255 hidden behind `black_box`, the compiler cannot see the overflow coming.' },
    ],
  },
  {
    q: 'engine/rust’s compile-speed file gives each figure as “median / min” over three rounds. Why report both?',
    options: [
      { t: 'The median is always the true time', why: 'On a noisy machine the median moves with the other tenants’ load.' },
      { t: 'The minimum includes JIT warm-up', why: 'Rust has no JIT. The TypeScript engine was warmed up before timing.' },
      { t: 'The minimum is the most stable on a shared VM; the median shows how much the runs spread', correct: true, why: 'That is what its notes say; even so, one round can shift: `ledger`’s Rust minimum was 74, 73, then 109 µs.' },
    ],
  },
];
