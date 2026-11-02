// Chapter 340 cards. Keys are stable ids: never rename them.

const MED_DOC = `// The median of a sample, the way
// matrix.ts computes it.
`;
const TOT_DOC = `// ts[p], rs[p]: the timings of program
// p. The matrix's total: the sum of the
// medians, TS over Rust.
`;

export const prompts = {
  'ctp-what': {
    q: 'What is **compile-time performance**?',
    a: 'How fast the compiler itself runs: the time from source in to code out, as opposed to how fast the compiled program runs.',
  },
  'two-clocks': {
    q: 'What are the two ways this chapter times a compiler?',
    a: 'A whole process per compile (what a CLI user waits for, start-up included), and `compile()` called in a warm, long-lived process (the engine alone).',
  },
  'cli-total': {
    q: 'In the matrix, how much faster is the Rust CLI than the TS CLI over the corpus?',
    a: '10.9×, as the sum of per-program medians (40 programs, one fresh process per compile).',
  },
  'inproc-total': {
    q: 'In one warm Node process, how much faster is the Rust engine as WebAssembly than the TS engine?',
    a: '5.26×, as the sum of per-program medians over the same 40 programs.',
  },
  'why-bigger': {
    q: 'Why is the CLI ratio bigger than the in-process ratio?',
    a: 'The CLI run is mostly start-up: starting Node and loading a 1 MB bundle, against a native binary that starts in a few milliseconds.',
  },
  'share': {
    q: 'What share of a TS CLI run is warm compiling, per the matrix?',
    a: 'Under 1% for every program. Warm `compile()` takes at most about a millisecond; a CLI run takes about a hundred.',
  },
  'fragile': {
    q: 'Why should you distrust a CLI ratio’s second digit here?',
    a: 'Its denominator is a few milliseconds, and on a shared VM the Rust CLI’s median moved between about 3 and 15 ms from run to run.',
  },
  'first-call': {
    q: 'How did the TS engine’s first `compile()` in a fresh process compare with a warm one?',
    a: 'About 25× slower (22 ms for `boids`): the code hasn’t been optimized by the JIT yet.',
  },
  'bundle-vs-source': {
    q: 'An earlier run had TS CLI medians near 200 ms; the matrix has them near 100. What changed?',
    a: 'The earlier one ran `cli.ts` from source, which Node type-strips and loads module by module. The matrix ran the esbuild bundle.',
  },
  'batch': {
    q: 'How does compiling 40 files in one process change the comparison?',
    a: 'Start-up is paid once, so per-file cost takes over. In the author’s runs TS added about 1 to 1.5 ms per extra file and Rust under 0.1 ms: still more than ten times apart.',
  },
  'rust-profile': {
    q: 'Where does the native Rust engine spend its time on one file?',
    a: 'Spread out: parsing about 10–17 µs, resolving and lowering about 80, analysis about 35, plan and emit about 25. Small allocations and hashing are the biggest costs.',
  },
  'parallel-hint': {
    q: 'What did 4 threads give on 396 files, writing to tmpfs and to disk?',
    a: '2.95× on tmpfs, but only 1.24× on the VM’s disk, where creating files is serialized.',
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
        start_ms: 90.0,
        per_file_ms: 1.2,
    };
    let rs = Cli {
        start_ms: 3.5,
        per_file_ms: 0.08,
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
    lang: 'rust',
    title: 'Sum of medians',
    prompt:
      'The matrix summarizes many noisy timings in two steps. Write `median`: sort a copy (use `total_cmp` for `f64`), take the middle value, or the mean of the two middle values for an even count. Then write `total_speedup`: the sum of the TS programs’ medians divided by the sum of the Rust programs’ medians. (Not the mean of per-program ratios: a slow program should count for more.)',
    starter: `${MED_DOC}fn median(xs: &[f64]) -> f64 {
    todo!()
}

${TOT_DOC}fn total_speedup(
    ts: &[Vec<f64>],
    rs: &[Vec<f64>],
) -> f64 {
    todo!()
}`,
    solution: `${MED_DOC}fn median(xs: &[f64]) -> f64 {
    let mut s = xs.to_vec();
    s.sort_by(|a, b| a.total_cmp(b));
    let n = s.len();
    if n % 2 == 1 {
        s[n / 2]
    } else {
        (s[n / 2 - 1] + s[n / 2]) / 2.0
    }
}

${TOT_DOC}fn total_speedup(
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
    walkthrough: `This is how \`engine/ts/packages/bench/src/matrix.ts\` reduces section (b): \`median\` sorts a copy and averages the middle pair for even counts, each program’s row stores its median, and the headline is \`sum(TS medians) / sum(Rust medians)\`.

- **Why medians.** A shared VM produces outliers: another tenant’s job lands in the middle of one run. The median of five runs ignores up to two of them; a mean would carry every spike.
- **Why a ratio of sums.** It answers “how long does the whole corpus take?”, so a 100 ms program matters more than a 1 ms one. The mean of per-program ratios answers a different question, the typical program’s speed-up, and gives every program the same vote. In the test, 101/11 ≈ 9.2× against (10 + 1)/2 = 5.5×.
- **Why \`total_cmp\`.** \`f64\` implements only \`PartialOrd\`, because NaN is unordered, so \`sort\` refuses it. \`total_cmp\` defines an order for every value, NaN included.`,
    wrong: [
      {
        code: `${MED_DOC}fn median(xs: &[f64]) -> f64 {
    let mut s = xs.to_vec();
    s.sort_by(|a, b| a.total_cmp(b));
    let n = s.len();
    if n % 2 == 1 {
        s[n / 2]
    } else {
        (s[n / 2 - 1] + s[n / 2]) / 2.0
    }
}

${TOT_DOC}fn total_speedup(
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
        code: `${MED_DOC}fn median(xs: &[f64]) -> f64 {
    xs[xs.len() / 2]
}

${TOT_DOC}fn total_speedup(
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
        why: 'The middle of an unsorted list is just whichever run happened to be in the middle, outliers included.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A user runs `viscosity build app.js` once from a terminal. Which number predicts their wait?',
    options: [
      { t: 'The in-process ratio, because it measures the engine', why: 'The user also waits for the process to start and load, which the in-process number leaves out.' },
      { t: 'The whole-process (CLI) time', correct: true, why: 'One fresh process per compile is exactly what the CLI rows measure.' },
      { t: 'The end-to-end benchmark of the compiled program', why: 'That measures the output’s speed, not the compiler’s.' },
    ],
  },
  {
    q: 'Over the corpus, the CLI ratio is 10.9× but the in-process ratio 5.26×. What explains most of the difference?',
    options: [
      { t: 'WebAssembly is slower than native code', why: 'Partly true, but small next to the other cause: the in-process TS engine is warm, and the CLI runs are mostly start-up.' },
      { t: 'The CLI compiles different programs', why: 'Both use the same 40 corpus programs.' },
      { t: 'Start-up: Node plus a 1 MB bundle against a native binary', correct: true, why: 'Warm compiling is under 1% of a TS CLI run. The rest is starting and loading, where the native binary needs a few milliseconds.' },
    ],
  },
  {
    q: 'The Rust CLI’s median was 7–15 ms per program in the matrix, and 3–4 ms in the author’s later runs of the same binary. What does that tell you?',
    options: [
      { t: 'The binary got faster', why: 'It was the same commit and the same release build.' },
      { t: 'Ratios with a few-millisecond denominator move a lot with the machine’s load', correct: true, why: 'On a shared 4-vCPU VM, a busy neighbour can triple a 3 ms process. Read the CLI ratio as “about ten times or more”, not 10.9 exactly.' },
      { t: 'The matrix measured it wrongly', why: 'Both are honest measurements under different loads. That is why the file states the load average.' },
    ],
  },
  {
    q: 'Why is the in-process figure for the TS engine taken after 50 warm-up calls?',
    options: [
      { t: 'To measure the engine once the JIT has optimized it, as in a long-running process', correct: true, why: 'A fresh process’s first call was about 25× slower. Warm-up measures the steady state an editor or playground would see.' },
      { t: 'To fill the file cache', why: 'In-process compiles read no files: the source is already a string.' },
      { t: 'Because the first 50 results are wrong', why: 'Every call gives the same output; only the time differs.' },
    ],
  },
  {
    q: 'A build compiles 10,000 files. Which matters most?',
    options: [
      { t: 'Process start-up', why: 'Paid once per process; spread over 10,000 files it nearly vanishes.' },
      { t: 'The cost per file, and how many cores share the work', correct: true, why: 'Start-up amortizes, so per-file speed dominates, and threads divide it (2.95× on 4 vCPUs to tmpfs).' },
      { t: 'The size of the `.wasm`', why: 'A CLI build doesn’t load the WebAssembly at all.' },
    ],
  },
  {
    q: 'Writing to the VM’s disk, 4 threads gave only 1.24×. Why?',
    options: [
      { t: 'The compiler has a global lock', why: 'On tmpfs the same build reached 2.95×, so compiling scales.' },
      { t: 'Creating the 396 output files cost about 65 ms whatever the thread count', correct: true, why: 'The virtual disk serializes file creation, so that part doesn’t shrink with threads.' },
      { t: 'Rust threads don’t run in parallel', why: 'They do: `std::thread::scope` threads are OS threads.' },
    ],
  },
];
