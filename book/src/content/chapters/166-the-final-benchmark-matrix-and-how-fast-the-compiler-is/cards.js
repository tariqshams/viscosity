// Chapter 166 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from the old chapters How fast is the compiler?, and The final benchmark matrix.

export const prompts = {
  'ctp-what': {
    q: 'What is **compile-time performance**?',
    a: 'How fast the compiler itself runs: the time from source in to code out, as opposed to how fast the compiled program runs.',
  },
  'why-bigger': {
    q: 'In Viscosity’s benchmark matrix, why is the Rust-over-TypeScript speed ratio for whole CLI runs bigger than the ratio for warm in-process compiles?',
    a: 'The CLI run is mostly start-up: starting Node and loading a 1 MB bundle, against a native binary that starts in a few milliseconds.',
  },
  'first-call': {
    q: 'In Viscosity’s compile-speed results, how did the TypeScript engine’s first `compile()` in a fresh process compare with a warm one?',
    a: 'About 25× slower (22 ms for `boids`): the code hasn’t been optimised by the JIT yet.',
  },
  'matrix-what': {
    q: 'What is a benchmark matrix?',
    a: 'Every combination along a few axes (program × engine × original/compiled, and so on), measured with one method on one machine, with the versions and the noise recorded beside the numbers.',
  },
  'matrix-why': {
    q: 'Why re-run comparisons in one matrix instead of collecting old results?',
    a: 'Results from different days and methods can’t be compared cell by cell. One run, one method, one machine makes any two cells comparable.',
  },
  'best-of': {
    q: 'Why does Viscosity’s benchmark matrix report the best of 9 fresh-process runs as its main figure?',
    a: 'On a shared, noisy VM the minimum is the most stable figure: noise only ever adds time. The median is shown beside it for the spread.',
  },
  'heat-two': {
    q: 'In Viscosity’s benchmark matrix of 2026-10-31, what does compiling `heat` gain on Node, and on Bun?',
    a: 'A large gain on Node (V8), one of the biggest in the matrix; none on Bun (JavaScriptCore), within the noise.',
  },
  'explain-claim': {
    q: 'Why does `viscosity explain` say why a collection was transformed, but not how much faster it will be?',
    a: 'Because the gain depends on the engine that runs the code, which the compiler never sees: the same compiled heat gained a lot on V8 and nothing on JSC.',
  },
};

export const examples = {
  amortize: {
    lang: 'rust',
    title: 'Paying for start-up once',
    code: `// A two-number model of a CLI run:
// start-up, plus a cost per file.
// Rounded from this chapter's runs
// of 1, 40 and 400 files (shared VM).
struct Cli {
    start_ms: f64,
    per_file_ms: f64,
}

impl Cli {
    fn run(&self, files: f64) -> f64 {
        self.start_ms
            + files * self.per_file_ms
    }
}

fn main() {
    let ts = Cli {
        start_ms: 120.0,
        per_file_ms: 1.8,
    };
    let rs = Cli {
        start_ms: 4.5,
        per_file_ms: 0.12,
    };
    for n in [1.0, 10.0, 100.0, 1e4] {
        let a = ts.run(n);
        let b = rs.run(n);
        println!(
            "{n:>6} files: {a:>8.1} ms \\
             vs {b:>6.1} ms = {:.0}x",
            a / b
        );
    }
}
`,
  },
};

export const exercises = {
  totals: {
    optional: true,
    lang: 'rust',
    title: 'Sum of medians',
    prompt: 'The matrix summarises many noisy timings in two steps. Write `median`: sort a copy (use `total_cmp` for `f64`), take the middle value, or the mean of the two middle values for an even count. Then write `total_speedup`: the sum of the TS programs’ medians divided by the sum of the Rust programs’ medians. (Not the mean of per-program ratios: a slow program should count for more.)',
    starter: `// The median of a sample, the way
// matrix.ts computes it.
fn median(xs: &[f64]) -> f64 {
    todo!()
}

// ts[p], rs[p]: the timings of program
// p. The matrix's total: the sum of the
// medians, TS over Rust.
fn total_speedup(
    ts: &[Vec<f64>],
    rs: &[Vec<f64>],
) -> f64 {
    todo!()
}`,
    solution: `// The median of a sample, the way
// matrix.ts computes it.
fn median(xs: &[f64]) -> f64 {
    let mut s = xs.to_vec();
    s.sort_by(|a, b| a.total_cmp(b));
    let n = s.len();
    if n % 2 == 1 {
        s[n / 2]
    } else {
        (s[n / 2 - 1] + s[n / 2]) / 2.0
    }
}

// ts[p], rs[p]: the timings of program
// p. The matrix's total: the sum of the
// medians, TS over Rust.
fn total_speedup(
    ts: &[Vec<f64>],
    rs: &[Vec<f64>],
) -> f64 {
    let sum = |ps: &[Vec<f64>]| -> f64 {
        ps.iter()
            .map(|p| median(p))
            .sum()
    };
    sum(ts) / sum(rs)
}`,
    tests: `fn close(a: f64, b: f64) -> bool {
    (a - b).abs() < 1e-9
}

#[test]
fn odd_counts_take_the_middle() {
    let m = median(&[9.0, 1.0, 5.0, 7.0, 3.0]);
    assert!(close(m, 5.0));
}

#[test]
fn even_counts_average_two() {
    let m = median(&[4.0, 1.0, 3.0, 2.0]);
    assert!(close(m, 2.5));
}

#[test]
fn one_outlier_barely_moves_it() {
    let m = median(&[8.0, 9.0, 7.0, 90.0, 8.5]);
    assert!(close(m, 8.5));
}

#[test]
fn slow_programs_weigh_more() {
    // 100 ms vs 10, and 1 ms vs 1.
    let ts = vec![vec![100.0], vec![1.0]];
    let rs = vec![vec![10.0], vec![1.0]];
    let x = total_speedup(&ts, &rs);
    assert!(close(x, 101.0 / 11.0));
}

#[test]
fn uses_each_programs_median() {
    let ts = vec![vec![50.0, 10.0, 12.0]];
    let rs = vec![vec![2.0, 1.0, 40.0]];
    let x = total_speedup(&ts, &rs);
    assert!(close(x, 6.0));
}
`,
    hints: [
      '`xs.to_vec()` gives a copy you may sort. `f64` has no total order (NaN), so `sort()` won’t compile: `sort_by(|a, b| a.total_cmp(b))` will.',
      'For an even `n`, the middle two are at `n / 2 - 1` and `n / 2`.',
      'In `total_speedup`, sum first and divide once. A small closure that maps each program to its median and sums keeps the two sides identical.',
    ],
    walkthrough: `**How to think about it.** This is how \`engine/ts/packages/bench/src/matrix.ts\` reduces section (b): each program's runs are reduced to one number, their median, and the headline is the sum of one engine's medians divided by the sum of the other's. So there are two small functions, and the second uses the first. For the median, work one out by hand first: for \`[5, 1, 3]\`, sort to \`[1, 3, 5]\` and take the middle, \`3\`; for \`[4, 1, 3, 2]\` there is no single middle, so take the mean of the two middle values, \`(2 + 3) / 2 = 2.5\`.

**The solution, line by line.**

- \`let mut s = xs.to_vec();\` copies the slice into a new vector we are allowed to change; sorting the caller's data in place would be a surprise.
- \`s.sort_by(|a, b| a.total_cmp(b));\` sorts it. \`f64\` implements only \`PartialOrd\` (NaN is not less than, equal to or greater than anything), so plain \`sort\` refuses to compile; \`total_cmp\` defines an order for every value, NaN included.
- \`let n = s.len();\` and \`if n % 2 == 1 { s[n / 2] }\`: for an odd count the middle index is \`n / 2\` (integer division, so 5 / 2 is 2).
- \`else { (s[n / 2 - 1] + s[n / 2]) / 2.0 }\`: for an even count, the mean of the two middle values. The whole \`if\` is the function's value, with no \`return\`.
- \`let sum = |ps: &[Vec<f64>]| -> f64 { ps.iter().map(|p| median(p)).sum() };\` is a small closure: for a list of programs (each a vector of timings), take each program's median and add them up. The \`-> f64\` tells \`sum()\` what to produce.
- \`sum(ts) / sum(rs)\` is the headline: total TypeScript time over total Rust time.

**Why medians and a ratio of sums.** A shared machine produces outliers, when another tenant's job lands in the middle of one run; the median of five runs ignores up to two of them, while a mean would carry every spike. A ratio of sums answers "how long does the whole corpus take?", so a 100 ms program counts for more than a 1 ms one; the mean of per-program ratios answers a different question, the typical program's speed-up, and gives every program the same vote. In the test, that is 101 / 11 ≈ 9.2 times against (10 + 1) / 2 = 5.5.

**Common wrong attempts.**

- *The mean of the ratios.* It compiles and gives a plausible number, but the wrong one for this question, as the test shows.
- *Forgetting to sort.* The middle of an unsorted list is whichever run happened to be in the middle, outliers included, so it is not a median at all. (Taking \`s[n / 2]\` for every count is a smaller slip: for an even list it gives the upper of the two middle values.)
- *\`s.sort()\`.* It does not compile for \`f64\`, because \`sort\` needs a total order (\`Ord\`), and NaN breaks it.`,
    wrong: [
      {
        code: `// The median of a sample, the way
// matrix.ts computes it.
fn median(xs: &[f64]) -> f64 {
    let mut s = xs.to_vec();
    s.sort_by(|a, b| a.total_cmp(b));
    let n = s.len();
    if n % 2 == 1 {
        s[n / 2]
    } else {
        (s[n / 2 - 1] + s[n / 2]) / 2.0
    }
}

// ts[p], rs[p]: the timings of program
// p. The matrix's total: the sum of the
// medians, TS over Rust.
fn total_speedup(
    ts: &[Vec<f64>],
    rs: &[Vec<f64>],
) -> f64 {
    let n = ts.len() as f64;
    let mut sum = 0.0;
    for (t, r) in ts.iter().zip(rs) {
        sum += median(t) / median(r);
    }
    sum / n
}`,
        why: 'This is the mean of per-program ratios: every program gets one vote, so a 1 ms program counts as much as a 100 ms one (5.5× instead of 9.2× in the test).',
      },
      {
        code: `// The median of a sample, the way
// matrix.ts computes it.
fn median(xs: &[f64]) -> f64 {
    xs[xs.len() / 2]
}

// ts[p], rs[p]: the timings of program
// p. The matrix's total: the sum of the
// medians, TS over Rust.
fn total_speedup(
    ts: &[Vec<f64>],
    rs: &[Vec<f64>],
) -> f64 {
    let sum = |ps: &[Vec<f64>]| -> f64 {
        ps.iter()
            .map(|p| median(p))
            .sum()
    };
    sum(ts) / sum(rs)
}`,
        why: 'The middle of an unsorted list is whichever run happened to be in the middle, outliers included.',
      },
    ],
  },
  geomean: {
    lang: 'rust',
    title: 'The Drip means, from the times',
    prompt: 'Write `geo`: the geometric mean of `f(row)` over all the rows, where `f` turns a row into one ratio (for example `|r| r.tree / r.vm`, the VM’s speed-up over the tree-walker). Return `None` if there are no rows. The geometric mean of n numbers is the n-th root of their product: compute it as `exp` of the mean of the `ln`s, from the ratio itself (do not round it first). The tests run it on the ten real rows of the matrix’s Drip section.',
    starter: `// One Drip program in the matrix:
// milliseconds on the tree-walker,
// the TypeScript VM and drip-rs.
struct Row {
    tree: f64,
    vm: f64,
    rust: f64,
}

// The geometric mean of f(row) over
// the rows, or None if there are none.
fn geo(
    xs: &[Row],
    f: fn(&Row) -> f64,
) -> Option<f64> {
    todo!()
}`,
    solution: `// One Drip program in the matrix:
// milliseconds on the tree-walker,
// the TypeScript VM and drip-rs.
struct Row {
    tree: f64,
    vm: f64,
    rust: f64,
}

// The geometric mean of f(row) over
// the rows, or None if there are none.
fn geo(
    xs: &[Row],
    f: fn(&Row) -> f64,
) -> Option<f64> {
    if xs.is_empty() {
        return None;
    }
    let mut logs = 0.0;
    for r in xs {
        logs += f(r).ln();
    }
    let n = xs.len() as f64;
    Some((logs / n).exp())
}`,
    tests: `fn r(tree: f64, vm: f64, rust: f64)
    -> Row {
    Row { tree, vm, rust }
}

// Part (c) of matrix-2026-10-31, copied
// from the Drip results of 2026-11-02.
fn matrix() -> Vec<Row> {
    vec![
        r(811.0, 655.0, 139.0),
        r(2365.0, 1906.0, 406.0),
        r(530.0, 712.0, 193.0),
        r(428.0, 623.0, 140.0),
        r(918.0, 704.0, 167.0),
        r(446.0, 380.0, 83.0),
        r(1317.0, 1216.0, 283.0),
        r(1394.0, 1224.0, 248.0),
        r(365.0, 383.0, 305.0),
        r(597.0, 749.0, 156.0),
    ]
}

fn r2(x: Option<f64>) -> f64 {
    (x.unwrap() * 100.0).round() / 100.0
}

#[test]
fn vm_vs_tree_is_1_01() {
    let m = matrix();
    let g = geo(&m, |r| r.tree / r.vm);
    assert_eq!(r2(g), 1.01);
}

#[test]
fn rust_vs_vm_is_3_94() {
    let m = matrix();
    let g = geo(&m, |r| r.vm / r.rust);
    assert_eq!(r2(g), 3.94);
}

#[test]
fn rust_vs_tree_from_times_is_3_98() {
    let m = matrix();
    let g = geo(&m, |r| r.tree / r.rust);
    assert_eq!(r2(g), 3.98);
}

#[test]
fn the_means_multiply() {
    let m = matrix();
    let a = geo(&m, |r| r.tree / r.vm);
    let b = geo(&m, |r| r.vm / r.rust);
    let c = geo(&m, |r| r.tree / r.rust);
    let ab = a.unwrap() * b.unwrap();
    assert!((c.unwrap() - ab).abs() < 1e-9);
}

#[test]
fn a_loss_cancels_a_win() {
    let m = [
        r(10.0, 5.0, 1.0),
        r(5.0, 10.0, 1.0),
    ];
    let g = geo(&m, |r| r.tree / r.vm);
    assert!((g.unwrap() - 1.0).abs() < 1e-9);
}

#[test]
fn no_rows_is_none() {
    assert_eq!(geo(&[], |r| r.tree), None);
}
`,
    hints: [
      'Deal with the empty slice first: `if xs.is_empty() { return None; }`. Then loop over the rows and call `f(r)` to get each one’s ratio.',
      'Add up `f(r).ln()` in a running total. Adding logarithms is multiplying the ratios, without ever forming a product that could grow huge.',
      'At the end, divide the total by `xs.len() as f64` and turn it back into a ratio with `.exp()`, wrapped in `Some`.',
    ],
    walkthrough: `**How to think about it.** This is \`geo\` from \`engine/ts/packages/bench/src/matrix.ts\`, in Rust, with one difference that matters here: \`matrix.ts\` takes the mean of each row's ratio after rounding it to two places (the ratios it prints in its table), while this \`geo\` takes it from the times. The tests feed it the ten real rows of the matrix's Drip section, so you can watch both ways of reading them. For the TypeScript VM against the tree-walker and for drip-rs against the TypeScript VM, the two ways agree to two places (1.01 and 3.94, the figures in the matrix); for drip-rs against the tree-walker the matrix prints 3.99, from its rounded column, while the times give 3.98, the figure *Profiling and optimising drip-rs, and three implementations compared* quotes. Neither is a mistake (the gap is far below the noise on that machine); however, only the mean from the times keeps an exact rule, which \`the_means_multiply\` checks: each row's \`tree / rust\` is its \`tree / vm\` times its \`vm / rust\`, and the geometric mean of products is the product of the geometric means, so the third mean is exactly the first two multiplied.

Why geometric at all? Speed-ups are ratios, and ratios multiply. A program that gets 2× faster and another that gets 2× slower should average to "no change", 1×; the ordinary mean of 2 and 0.5 is 1.25, which wrongly reports a gain, while the geometric mean is exactly 1 (\`a_loss_cancels_a_win\` checks this). And why logarithms? Because \`ln(a × b) = ln a + ln b\`: the mean of the logs is the log of the n-th root of the product, so \`exp\` of that mean is the geometric mean.

**The solution, line by line.**

- \`fn geo(xs: &[Row], f: fn(&Row) -> f64) -> Option<f64> {\` borrows a slice of rows and takes \`f\`, a plain function from a row to one number; a closure such as \`|r| r.tree / r.vm\` that uses nothing from around it can be passed where a \`fn\` is expected. It returns \`None\` when there is nothing to average, rather than inventing a number.
- \`if xs.is_empty() { return None; }\` handles the empty case first; without it the mean would be \`0.0 / 0.0\`, which is \`NaN\`, and the function would return \`Some(NaN)\`.
- \`let mut logs = 0.0;\` is the running sum of logarithms.
- \`for r in xs {\` visits each row by reference, so \`r\` is a \`&Row\`, exactly what \`f\` takes.
- \`logs += f(r).ln();\` computes this row's ratio from its times and adds its natural logarithm. Nothing is rounded here.
- \`let n = xs.len() as f64;\` converts the number of rows to a float, because Rust never mixes integers and floats silently.
- \`Some((logs / n).exp())\` is the mean of the logs, turned back into a ratio with \`exp\`.

**Common wrong attempts.**

- The ordinary average of the ratios. It is pulled up by big wins and barely moved by losses: on the real rows it gives about 1.04 for the VM against the tree-walker, although the VM loses on four of the ten programs.
- Rounding each ratio to two places before taking its logarithm. That reproduces the matrix's printed mean, 3.99, for drip-rs against the tree-walker, but it is the mean of the rounded column, not of the measurements, and the three means no longer multiply exactly.
- Leaving out the empty check. The loop does nothing, \`0.0 / 0.0\` is \`NaN\`, and the function returns \`Some(NaN)\`: a number that is not a number, where \`None\` would have said honestly that there was nothing to average.`,
    wrong: [
      {
        code: `// One Drip program in the matrix:
// milliseconds on the tree-walker,
// the TypeScript VM and drip-rs.
struct Row {
    tree: f64,
    vm: f64,
    rust: f64,
}

// The geometric mean of f(row) over
// the rows, or None if there are none.
fn geo(
    xs: &[Row],
    f: fn(&Row) -> f64,
) -> Option<f64> {
    if xs.is_empty() {
        return None;
    }
    let mut sum = 0.0;
    for r in xs {
        sum += f(r);
    }
    let n = xs.len() as f64;
    Some(sum / n)
}`,
        why: 'That is the arithmetic mean of the ratios. A 2× win and a 2× loss average to 1.25×, not 1×, and on the real rows the VM against the tree-walker comes to about 1.04, not 1.01.',
      },
      {
        code: `// One Drip program in the matrix:
// milliseconds on the tree-walker,
// the TypeScript VM and drip-rs.
struct Row {
    tree: f64,
    vm: f64,
    rust: f64,
}

// The geometric mean of f(row) over
// the rows, or None if there are none.
fn geo(
    xs: &[Row],
    f: fn(&Row) -> f64,
) -> Option<f64> {
    if xs.is_empty() {
        return None;
    }
    let mut logs = 0.0;
    for r in xs {
        let x = f(r);
        let x2 = (x * 100.0).round()
            / 100.0;
        logs += x2.ln();
    }
    let n = xs.len() as f64;
    Some((logs / n).exp())
}`,
        why: 'Rounding each ratio first gives the mean of the rounded column (3.99 for drip-rs against the tree-walker), not of the times (3.98), and the three means stop multiplying exactly.',
      },
      {
        code: `// One Drip program in the matrix:
// milliseconds on the tree-walker,
// the TypeScript VM and drip-rs.
struct Row {
    tree: f64,
    vm: f64,
    rust: f64,
}

// The geometric mean of f(row) over
// the rows, or None if there are none.
fn geo(
    xs: &[Row],
    f: fn(&Row) -> f64,
) -> Option<f64> {
    let mut logs = 0.0;
    for r in xs {
        logs += f(r).ln();
    }
    let n = xs.len() as f64;
    Some((logs / n).exp())
}`,
        why: 'With no rows, `logs / n` is `0.0 / 0.0`, which is `NaN`, so this returns `Some(NaN)` instead of `None`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A user runs `viscosity build app.js` once from a terminal. Which number predicts their wait?',
    options: [
      {
        t: 'The in-process ratio, because it measures the engine',
        why: 'The user also waits for the process to start and load, which the in-process number leaves out.',
      },
      {
        t: 'The whole-process (CLI) time',
        correct: true,
        why: 'One fresh process per compile is exactly what the CLI rows measure.',
      },
      {
        t: 'The end-to-end benchmark of the compiled program',
        why: 'That measures the output’s speed, not the compiler’s.',
      },
    ],
  },
  {
    q: 'In Viscosity’s benchmark matrix of 2026-10-31, on which program did the compiled code gain on Node but not on Bun?',
    options: [
      {
        t: 'particles',
        why: 'particles gained on both engines.',
      },
      {
        t: 'ledger',
        why: 'ledger gained on both, more on Node.',
      },
      {
        t: 'heat',
        correct: true,
        why: 'A large gain on V8 and about 1× on JSC, within the noise.',
      },
      {
        t: 'boids',
        why: 'boids gained more on Bun than on Node.',
      },
    ],
  },
  {
    q: 'What is the status of the explanation that V8’s boxed double fields (heap numbers) are why Viscosity gains on `heat` under V8 but not JavaScriptCore?',
    options: [
      {
        t: 'Confirmed by V8 traces',
        why: 'FINDINGS.md says it is not yet confirmed with engine traces.',
      },
      {
        t: 'A hypothesis that rests on documented engine facts',
        correct: true,
        why: 'V8’s boxed double fields and JSC’s inline doubles are documented; that they cause heat’s gap is the unconfirmed part.',
      },
      {
        t: 'Ruled out by section 5 of FINDINGS.md',
        why: 'Section 5 fits it: packed typed storage alone recovered much of the gain on V8.',
      },
    ],
  },
  {
    q: 'Why does a benchmark that compares an original and a compiled program interleave their runs?',
    options: [
      {
        t: 'To warm up the JIT',
        why: 'Each run is a fresh process, so nothing is shared between runs; there is one discarded run of each for that.',
      },
      {
        t: 'So that noise on the shared machine falls on both versions alike',
        correct: true,
        why: 'A busy minute on the VM then slows an original and a compiled run, not five of one kind.',
      },
      {
        t: 'Because Bun requires it',
        why: 'Nothing about Bun needs it. It is a measurement choice.',
      },
    ],
  },
  {
    q: 'What can Viscosity’s cost model honestly claim about a transformed collection?',
    options: [
      {
        t: 'A predicted speed-up, such as “2× faster”',
        why: 'The same code gained much less on JSC than on V8, and heat nothing. A figure would be a guess about an engine the compiler never sees.',
      },
      {
        t: 'Nothing: the matrix shows layouts don’t matter',
        why: 'Every program gained on V8, and most on JSC too.',
      },
      {
        t: 'Why it chose the layout: size, the loops and fields, the proofs',
        correct: true,
        why: 'Those are facts about the program. How much faster it gets depends on the engine that runs it.',
      },
    ],
  },
];
