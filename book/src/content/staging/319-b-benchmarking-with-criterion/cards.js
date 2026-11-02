// Chapter 319-b cards (Benchmarking with criterion, split from chapter
// 319). Keys are stable ids: never rename them. Criterion output quoted
// here is from cargo bench (cargo 1.97, criterion 0.5.1) on the book's
// shared cloud VM, 2026-11-02.

const STARTER = `// Quartiles by nearest rank: sort, then
// take the values at n/4 and 3n/4.
fn quartiles(xs: &[f64]) -> (f64, f64) {
    let mut s = xs.to_vec();
    s.sort_by(f64::total_cmp);
    let n = s.len();
    (s[n / 4], s[3 * n / 4])
}

fn fences(xs: &[f64], k: f64)
    -> (f64, f64) {
    todo!()
}

// (mild, severe), as criterion counts.
fn outliers(xs: &[f64])
    -> (usize, usize) {
    todo!()
}`;

const WRONG1 = `// Quartiles by nearest rank: sort, then
// take the values at n/4 and 3n/4.
fn quartiles(xs: &[f64]) -> (f64, f64) {
    let mut s = xs.to_vec();
    s.sort_by(f64::total_cmp);
    let n = s.len();
    (s[n / 4], s[3 * n / 4])
}

fn fences(xs: &[f64], k: f64)
    -> (f64, f64) {
    let (q1, q3) = quartiles(xs);
    let iqr = q3 - q1;
    (q1 - k * iqr, q3 + k * iqr)
}

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
}`;

const WRONG2 = `// Quartiles by nearest rank: sort, then
// take the values at n/4 and 3n/4.
fn quartiles(xs: &[f64]) -> (f64, f64) {
    let mut s = xs.to_vec();
    s.sort_by(f64::total_cmp);
    let n = s.len();
    (s[n / 4], s[3 * n / 4])
}

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
}`;

const SOLUTION = `// Quartiles by nearest rank: sort, then
// take the values at n/4 and 3n/4.
fn quartiles(xs: &[f64]) -> (f64, f64) {
    let mut s = xs.to_vec();
    s.sort_by(f64::total_cmp);
    let n = s.len();
    (s[n / 4], s[3 * n / 4])
}

fn fences(xs: &[f64], k: f64)
    -> (f64, f64) {
    let (q1, q3) = quartiles(xs);
    let iqr = q3 - q1;
    (q1 - k * iqr, q3 + k * iqr)
}

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
}`;

const TESTS = `#[test]
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
}`;

const BOOT = `// A bootstrap by hand: how sure can we
// be of the mean of 12 noisy timings?
const A: u64 = 6364136223846793005;

fn mean(xs: &[f64]) -> f64 {
    let s: f64 = xs.iter().sum();
    s / xs.len() as f64
}

fn main() {
    let ts = [
        665.0, 671.0, 659.0, 702.0,
        668.0, 663.0, 690.0, 661.0,
        667.0, 735.0, 664.0, 670.0,
    ];
    let n = ts.len();
    // A tiny random number generator
    // (same numbers on every run).
    let mut seed: u64 = 42;
    let mut rand = move |k: usize| {
        seed = seed.wrapping_mul(A)
            .wrapping_add(1);
        (seed >> 33) as usize % k
    };
    let mut means = Vec::new();
    for _ in 0..10_000 {
        // n timings, with repeats
        let pick: Vec<f64> = (0..n)
            .map(|_| ts[rand(n)])
            .collect();
        means.push(mean(&pick));
    }
    means.sort_by(f64::total_cmp);
    let lo = means[250];
    let hi = means[9750];
    let m = mean(&ts);
    println!("mean {m:.1} ns");
    println!("95%: [{lo:.1}, {hi:.1}]");
}`;

export const prompts = {
  'crit-what': {
    q: 'What is criterion, and why do stable-Rust projects use it?',
    a: 'A statistical benchmarking crate run by `cargo bench`. The built-in `#[bench]` attribute is nightly-only, so the Cargo book points to crates like it.',
  },
  'crit-harness': {
    q: 'Why does a criterion benchmark need `harness = false` in `Cargo.toml`?',
    a: 'It tells Cargo the bench file brings its own `main` (written by `criterion_main!`) instead of using the built-in test harness.',
  },
  'crit-nightly': {
    q: 'Which profile does `cargo bench` build with?',
    a: '`bench`, which inherits from `release`: optimized, with overflow checks off.',
  },
  'crit-slope': {
    q: 'Criterion runs samples of d, 2d, 3d … iterations. What does it take as the time per iteration, and why not time one call?',
    a: 'The slope of the line fitted through (iterations, total time). One short call is below what the clock can measure well.',
  },
  'crit-ci': {
    q: 'How does criterion get the interval it prints, such as `[658.64 ns 665.74 ns 672.99 ns]`?',
    a: 'By bootstrapping: resample the samples with repeats many times, fit a line to each, and keep the middle 95 percent of the slopes. The middle number is the estimate.',
  },
  tukey: {
    q: 'When does criterion call a sample a severe outlier?',
    a: 'When it lies more than 3 interquartile ranges below the first quartile or above the third (1.5 makes it mild). It is reported, not dropped.',
  },
  'crit-change': {
    q: 'Criterion says “Performance has improved” (p = 0.00) but you changed nothing. Why?',
    a: 'The machine was quieter on that run. The test detects any real difference in the timings, including one caused by other programs.',
  },
  'crit-noise': {
    q: 'What two conditions must hold before criterion reports a change, by default?',
    a: 'The test must say the difference is unlikely to be chance (p < 0.05), and it must be bigger than the noise threshold, 1 percent.',
  },
};

export const examples = {
  bootstrap: {
    lang: 'rust',
    title: 'A bootstrap by hand',
    code: BOOT,
  },
};

export const exercises = {
  tukey: {
    lang: 'rust',
    title: 'Outliers the way criterion counts them',
    prompt:
      '`quartiles` is given. Write `fences(xs, k)`, which returns `(q1 - k·iqr, q3 + k·iqr)` where `iqr = q3 - q1`. Then write `outliers(xs)`, which returns `(mild, severe)`: a sample is **severe** if it lies outside the `k = 3.0` fences, and **mild** if it lies outside the `k = 1.5` fences but not outside the `3.0` ones. Count both low and high samples.',
    starter: STARTER,
    solution: SOLUTION,
    tests: TESTS,
    hints: [
      'Start with `fences`. It is three lines: get `(q1, q3)` from `quartiles`, compute `iqr = q3 - q1`, and return the pair of fences.',
      'In `outliers`, compute both pairs of fences once, before the loop: `fences(xs, 1.5)` and `fences(xs, 3.0)`. Then visit every sample with `for &x in xs`.',
      'Test the severe fences first, and use `else if` for the mild ones, so a severe sample is not counted twice.',
    ],
    walkthrough: `**How to think about it.** This is the first step of criterion's analysis: Tukey's method, with an extra, wider pair of fences for severe outliers. Draw the figure from the chapter: the middle half of the data is the box from Q1 to Q3, its width is the IQR, and the fences sit 1.5 and 3 box-widths outside it. So \`fences\` is arithmetic on the two quartiles, and \`outliers\` puts each sample into one of three buckets (inside, mild, severe) by comparing it with the fences. The one trap is that the buckets overlap: anything outside the 3.0 fences is also outside the 1.5 ones.

**The solution, line by line.**

- \`fn fences(xs: &[f64], k: f64) -> (f64, f64) {\` takes the samples and how many IQRs wide the fence should be.
- \`    let (q1, q3) = quartiles(xs);\` gets the first and third quartiles (the given function sorts a copy and picks the values a quarter and three quarters of the way along).
- \`    let iqr = q3 - q1;\` is the width of the middle half. For the first test's samples, 11 and 14, so 3.
- \`    (q1 - k * iqr, q3 + k * iqr)\` places the fences: for \`k = 1.5\`, 11 − 4.5 = 6.5 and 14 + 4.5 = 18.5.
- \`fn outliers(xs: &[f64]) -> (usize, usize) {\` returns two counts.
- \`    let (lo, hi) = fences(xs, 1.5);\` and \`    let (vlo, vhi) = fences(xs, 3.0);\` compute both pairs once, outside the loop (each call sorts a copy, so doing it per sample would be wasteful).
- \`    let mut mild = 0;\` and \`    let mut severe = 0;\` start the counts.
- \`    for &x in xs {\` visits every sample, copying each \`f64\` out of the slice.
- \`        if x < vlo || x > vhi { severe += 1; }\` checks the wide fences first, low side and high side.
- \`        else if x < lo || x > hi { mild += 1; }\` only runs for samples inside the wide fences, so a sample lands in at most one bucket.
- \`    (mild, severe)\` returns both counts.

Two details match criterion's own output. Outliers are only counted, not removed: criterion keeps every sample and warns that the benchmark may be less reliable. And they come in low and high kinds; on a shared machine they are nearly always high, because other programs can only make yours slower. The interquartile range is used, rather than a mean and standard deviation, because it is not pulled about by the very outliers it is looking for.

**Common wrong attempts.**

- Two separate \`if\`s count a severe outlier as mild too: \`one_mild_one_severe\` then gets \`(2, 1)\`.
- \`q1 - k * q1\` measures the fence in multiples of the quartile itself instead of the IQR; the fences end up far too wide and nothing is flagged.
- Only checking the high side (\`x > hi\`) misses the low outlier in the last test.`,
    wrong: [
      { code: WRONG1, why: 'A severe outlier is also outside the 1.5 fences, so this counts it as mild too: `one_mild_one_severe` gets `(2, 1)`. Check severe first, then `else if` mild.' },
      { code: WRONG2, why: 'The fences are measured in interquartile ranges, `q3 - q1`, not in multiples of the quartiles themselves. These fences are far too wide.' },
    ],
  },
};

export const quiz = [
  {
    q: 'Criterion reported `time: [658.64 ns 665.74 ns 672.99 ns]`. What are the three numbers?',
    options: [
      { t: 'Fastest, median and slowest sample', why: 'They come from bootstrapping the fitted slope, not from single samples.' },
      { t: 'The low end, the estimate and the high end of a confidence interval for the time per iteration', correct: true, why: 'Criterion fits a line to the samples, then resamples them many times to see how much the slope could vary.' },
      { t: 'Three separate runs', why: 'It is one run of 100 samples.' },
    ],
  },
  {
    q: 'Can the book’s Run button run a criterion benchmark?',
    options: [
      { t: 'No: examples are single files built in debug mode, with no crates, so you need `cargo bench` on your own machine', correct: true, why: 'This chapter’s criterion runs used cargo 1.97, which fetched criterion 0.5.1.' },
      { t: 'Yes, any crate works', why: 'Criterion needs Cargo to fetch it and `cargo bench` to build it.' },
      { t: 'Only in release mode', why: 'The runner always builds in debug mode, and has no crates either way.' },
    ],
  },
  {
    q: 'Why does criterion time samples of many iterations instead of single calls?',
    options: [
      { t: 'To warm up the JIT', why: 'Rust has no JIT; warm-up is a separate phase, for caches and the CPU.' },
      { t: 'Because one call is too short to time accurately; the slope through many samples gives the time per call', correct: true, why: 'A sum of a thousand numbers took well under a microsecond here.' },
      { t: 'To make the benchmark take exactly 5 seconds', why: 'The 5 seconds is a budget for collecting samples, not the goal.' },
    ],
  },
  {
    q: 'Of 100 samples, 8 were “high mild” and 2 “high severe”. What did criterion do with them?',
    options: [
      { t: 'Dropped them before computing the estimate', why: 'Criterion reports outliers and keeps every sample.' },
      { t: 'Re-ran just those samples', why: 'It does not re-run samples.' },
      { t: 'Reported them; they stay in the analysis', correct: true, why: 'They are a warning that the run was noisy, nearly always from other programs slowing yours.' },
    ],
  },
  {
    q: 'Run 6 said “Performance has improved” by about 3 percent, run 8 “has regressed” by about 4, and the code never changed. What is the right reading?',
    options: [
      { t: 'The compiler made different code each time', why: 'The same build was reused; nothing was recompiled between runs.' },
      { t: 'Criterion is broken', why: 'Its test correctly found that the timings differed; the cause was outside the code.' },
      { t: 'The machine’s load changed between runs; on a shared VM, differences of a few percent need repeated, alternating comparisons before you believe them', correct: true, why: 'The default 1 percent noise threshold is too small for this machine.' },
    ],
  },
];
