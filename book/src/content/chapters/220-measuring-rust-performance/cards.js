// Chapter 220 cards. Keys are stable ids: never rename them.

const QUARTILES = `// Quartiles by nearest rank: sort, then
// take the values at n/4 and 3n/4.
fn quartiles(xs: &[f64]) -> (f64, f64) {
    let mut s = xs.to_vec();
    s.sort_by(f64::total_cmp);
    let n = s.len();
    (s[n / 4], s[3 * n / 4])
}
`;

const FENCES = `fn fences(xs: &[f64], k: f64)
    -> (f64, f64) {
    let (q1, q3) = quartiles(xs);
    let iqr = q3 - q1;
    (q1 - k * iqr, q3 + k * iqr)
}
`;

export const prompts = {
  'debug-default': {
    q: 'Which profile does a plain `cargo build` or `cargo run` use, and at what `opt-level`?',
    a: 'The `dev` profile, with `opt-level = 0`: no optimization.',
  },
  'release-what': {
    q: 'What does `--release` change, by default?',
    a: '`opt-level = 3`, and debug assertions and integer overflow checks turned off.',
  },
  'overflow-modes': {
    q: 'What does `255u8 + 1` do in a debug build, and in a release build?',
    a: 'Debug: panics with “attempt to add with overflow”. Release: wraps around to 0.',
  },
  'debug-numbers': {
    q: 'Why is a timing from a debug build nearly useless?',
    a: 'Unoptimized code can be ten times slower, or more. drip-rs ran fib in about 16 s debug and 1.4–1.6 s release.',
  },
  'runner-mode': {
    q: 'Which build mode does this book’s Run button use for Rust?',
    a: 'Debug, on the Rust Playground. Open the code in the Playground to switch to Release.',
  },
  'bb-why': {
    q: 'Why did a release-mode loop summing a million numbers 100 times “take” about 200 ns?',
    a: 'Its result was never used, so the optimizer deleted the work. Nothing was measured.',
  },
  'bb-what': {
    q: 'What does `std::hint::black_box(x)` do?',
    a: 'Returns `x` unchanged, while hinting the compiler to assume the value is used in unknown ways, so it can’t delete or precompute it.',
  },
  'bb-limit': {
    q: 'Can you rely on `black_box` for correctness or security?',
    a: 'No. It is best-effort only; the docs say it must not be relied on for critical behaviour.',
  },
  'crit-slope': {
    q: 'Criterion runs samples of d, 2d, 3d … iterations. What does it take as the time per iteration?',
    a: 'The slope of the line fitted through (iterations, total time), with a bootstrap confidence interval.',
  },
  'crit-change': {
    q: 'Criterion says “Performance has improved” (p = 0.00) but you changed nothing. Why?',
    a: 'The machine was quieter on the second run. The test detects any real difference in the timings, including one caused by noise.',
  },
  'tukey': {
    q: 'When does criterion call a sample a severe outlier?',
    a: 'When it lies more than 3 interquartile ranges below the 25th or above the 75th percentile (1.5 IQR makes it mild).',
  },
  'whole-program': {
    q: 'Why does drip-rs’s `bench.sh` time fresh processes with the shell, instead of using criterion?',
    a: 'Each benchmark is a whole program taking 0.3–5 s, compared with the TypeScript VMs run the same way. And drip-rs depends on nothing but `std`.',
  },
};

export const examples = {
  'bb-play': {
    lang: 'rust',
    title: 'The loop that vanishes',
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
    expectError: true,
    title: 'Overflow: a panic in debug, a wrap in release',
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
  tukey: {
    lang: 'rust',
    title: 'Outliers the way criterion counts them',
    prompt:
      '`quartiles` is given. Write `fences(xs, k)`, which returns `(q1 - k·iqr, q3 + k·iqr)` where `iqr = q3 - q1`. Then write `outliers(xs)`, which returns `(mild, severe)`: a sample is **severe** if it lies outside the `k = 3.0` fences, and **mild** if it lies outside the `k = 1.5` fences but not outside the `3.0` ones. Count both low and high samples.',
    starter: `${QUARTILES}
fn fences(xs: &[f64], k: f64)
    -> (f64, f64) {
    todo!()
}

// (mild, severe), as criterion counts.
fn outliers(xs: &[f64])
    -> (usize, usize) {
    todo!()
}`,
    solution: `${QUARTILES}
${FENCES}
// (mild, severe), as criterion counts.
fn outliers(xs: &[f64])
    -> (usize, usize) {
    let (lo, hi) = fences(xs, 1.5);
    let (vlo, vhi) = fences(xs, 3.0);
    let mut mild = 0;
    let mut severe = 0;
    for &x in xs {
        if x < vlo || x > vhi {
            severe += 1;
        } else if x < lo || x > hi {
            mild += 1;
        }
    }
    (mild, severe)
}`,
    tests: `#[test]
fn fences_from_quartiles() {
    // sorted: 10 10 11 12 12 13 14 14
    let xs = [10.0, 14.0, 12.0, 11.0, 13.0, 10.0, 14.0, 12.0];
    assert_eq!(quartiles(&xs), (11.0, 14.0));
    assert_eq!(fences(&xs, 1.5), (6.5, 18.5));
    assert_eq!(fences(&xs, 3.0), (2.0, 23.0));
}

#[test]
fn quiet_samples_have_no_outliers() {
    let xs = [600.0, 601.0, 598.0, 603.0, 599.0, 602.0, 600.0, 597.0];
    assert_eq!(outliers(&xs), (0, 0));
}

#[test]
fn one_mild_one_severe() {
    // q1 = 101, q3 = 104, iqr = 3
    let xs = [100.0, 101.0, 102.0, 103.0, 104.0, 100.0, 102.0, 104.0, 112.0, 130.0];
    assert_eq!(fences(&xs, 1.5), (96.5, 108.5));
    assert_eq!(outliers(&xs), (1, 1));
}

#[test]
fn low_outliers_count_too() {
    let xs = [50.0, 51.0, 52.0, 53.0, 50.0, 51.0, 52.0, 53.0, 1.0];
    assert_eq!(outliers(&xs), (0, 1));
}`,
    hints: [
      '`fences` is three lines: get `(q1, q3)` from `quartiles`, compute `iqr = q3 - q1`, return the two fences.',
      'In `outliers`, compute both pairs of fences once, before the loop: `fences(xs, 1.5)` and `fences(xs, 3.0)`.',
      'Test the severe fences first, and use `else if` for the mild ones, so a severe sample isn’t counted twice.',
    ],
    walkthrough: `This is the first step of criterion’s analysis, Tukey’s method with an extra pair of fences.

\`\`\`rust
let (lo, hi) = fences(xs, 1.5);
let (vlo, vhi) = fences(xs, 3.0);
for &x in xs {
    if x < vlo || x > vhi {
        severe += 1;
    } else if x < lo || x > hi {
        mild += 1;
    }
}
\`\`\`

The interquartile range is the width of the middle half of the samples, so it isn’t pulled about by the very outliers it is looking for, as a mean or a standard deviation would be. The 3.0 fences lie outside the 1.5 ones, so checking severe first and then \`else if\` mild puts each sample in at most one bucket.

Two details match criterion’s own output. Outliers are only counted, not removed: criterion warns that the benchmark may be less reliable and keeps every sample. And they come in “low” and “high” kinds; on a shared machine they are nearly always high, because other tenants can only make your code slower.`,
    wrong: [
      {
        code: `${QUARTILES}
${FENCES}
fn outliers(xs: &[f64])
    -> (usize, usize) {
    let (lo, hi) = fences(xs, 1.5);
    let (vlo, vhi) = fences(xs, 3.0);
    let mut mild = 0;
    let mut severe = 0;
    for &x in xs {
        if x < lo || x > hi {
            mild += 1;
        }
        if x < vlo || x > vhi {
            severe += 1;
        }
    }
    (mild, severe)
}`,
        why: 'A severe outlier is also outside the 1.5 fences, so this counts it as mild too: `one_mild_one_severe` gets `(2, 1)`. Use `else if` after checking severe first.',
      },
      {
        code: `${QUARTILES}
fn fences(xs: &[f64], k: f64)
    -> (f64, f64) {
    let (q1, q3) = quartiles(xs);
    (q1 - k * q1, q3 + k * q3)
}

fn outliers(xs: &[f64])
    -> (usize, usize) {
    let (lo, hi) = fences(xs, 1.5);
    let (vlo, vhi) = fences(xs, 3.0);
    let mut mild = 0;
    let mut severe = 0;
    for &x in xs {
        if x < vlo || x > vhi {
            severe += 1;
        } else if x < lo || x > hi {
            mild += 1;
        }
    }
    (mild, severe)
}`,
        why: 'The fences are measured in interquartile ranges, `q3 - q1`, not in multiples of the quartiles themselves. These fences are far too wide.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'You time a function with `cargo run` and get 300 ms. What should you do before believing it?',
    options: [
      { t: 'Nothing: Rust is compiled, so it is already fast', why: 'A plain `cargo run` builds the `dev` profile, `opt-level = 0`.' },
      { t: 'Run it twice more and take the average', why: 'More runs don’t fix an unoptimized build.' },
      { t: 'Rebuild with `--release`, and make sure the result is used', correct: true, why: 'In this chapter’s run, the same loop took about 300 ms in debug, 65–69 ms in release, and almost nothing when its result was unused.' },
    ],
  },
  {
    q: 'In a release build, a loop summing a million `f64`s 100 times reports 190 ns. What is the best explanation?',
    options: [
      { t: 'SIMD made it that fast', why: 'That would be about two millionths of a nanosecond per number. Vector units are fast, not that fast.' },
      { t: 'The sum was never used, so the compiler removed the loop', correct: true, why: 'Dead code elimination. Wrapping the input and result in `black_box` brought back the real work, about 65–69 ms here.' },
      { t: 'The clock is broken in release mode', why: '`Instant` works the same in both builds.' },
      { t: 'The values were cached after the first iteration', why: 'Caches make memory faster; they don’t make adds disappear.' },
    ],
  },
  {
    q: 'What does `black_box(sum(black_box(&xs)))` achieve?',
    options: [
      { t: 'The inner call hides `xs` from the optimizer, and the outer one keeps the result “used”', correct: true, why: 'So the compiler can neither precompute the sum nor throw it away.' },
      { t: 'It turns off all optimization inside `sum`', why: '`sum` is still optimized. Only what flows in and out is hidden.' },
      { t: 'It guarantees the benchmark measures exactly what production does', why: 'It is best-effort, and production code may be optimized differently anyway.' },
    ],
  },
  {
    q: 'Criterion reported `time: [585.95 ns 600.57 ns 617.36 ns]`. What are the three numbers?',
    options: [
      { t: 'Fastest, median and slowest sample', why: 'They come from bootstrapping the fitted slope, not from single samples.' },
      { t: 'Three separate runs', why: 'It is one run of 100 samples.' },
      { t: 'The low end, the estimate and the high end of a confidence interval for the time per iteration', correct: true, why: 'Criterion fits a line to the samples, then resamples them many times to see how much the slope could vary.' },
    ],
  },
  {
    q: 'Can the book’s Run button run a criterion benchmark?',
    options: [
      { t: 'Yes, any crate works', why: 'The book’s checker compiles each example with bare `rustc`, which has no crates, and criterion needs `cargo bench`.' },
      { t: 'No: examples are single files built in debug mode, so you need `cargo bench` on your own machine', correct: true, why: 'This chapter’s criterion numbers were measured locally with cargo 1.97, which fetched criterion 0.5.1.' },
      { t: 'Only in release mode', why: 'The runner always builds in debug mode.' },
    ],
  },
  {
    q: 'engine/rust’s compile-speed file gives each figure as “median / min” over three rounds. Why report both?',
    options: [
      { t: 'The minimum is the most stable on a shared VM; the median shows how much the runs spread', correct: true, why: 'Its rounds varied by up to about 2×: `ledger`’s Rust minimum was 74, 73, then 109 µs.' },
      { t: 'The median is always the true time', why: 'On a noisy machine the median moves with the other tenants’ load.' },
      { t: 'The minimum includes JIT warm-up', why: 'Rust has no JIT. The TypeScript engine was warmed up before timing.' },
      { t: 'It is a criterion convention', why: 'That file’s Rust numbers come from a hand-written timing loop, not criterion.' },
    ],
  },
];
