// Chapter 167 cards. Keys are stable ids: never rename them.

const RES = `// What one benchmark run produced.
#[derive(Debug, Clone, PartialEq)]
enum Res {
    // Time to finish the work, in ms.
    Ms(f64),
    // Work done in a fixed time,
    // such as batches finished.
    Work(f64),
    // Didn't run: a compile error.
    Failed,
}
`;

const GEO = `fn geomean(xs: &[f64]) -> Option<f64> {
    if xs.is_empty() {
        return None;
    }
    let mut logs = 0.0;
    for x in xs {
        logs += x.ln();
    }
    Some((logs / xs.len() as f64).exp())
}
`;

const SUMMARY = `fn summary(old: &[Res], new: &[Res])
    -> Option<f64> {
    let mut xs = Vec::new();
    for (a, b) in old.iter().zip(new) {
        if let Some(s) = speedup(a, b) {
            xs.push(s);
        }
    }
    geomean(&xs)
}
`;

export const prompts = {
  'three-what': {
    q: 'Which three implementations of Drip does this book benchmark?',
    a: 'The TypeScript tree-walker (Part III), the TypeScript bytecode VM (Part IV) and drip-rs, the Rust port of that VM (Part X).',
  },
  'ts-method': {
    q: 'How were the TypeScript times in `drip-bench-2026-10-31.json` taken?',
    a: 'One run per program, each in a fresh Node process, timed with `performance.now()` around compiling and running the program.',
  },
  'rs-method': {
    q: 'How were drip-rs’s times taken?',
    a: 'Best of three runs, each a fresh process of the release build, timed by the shell from start to exit.',
  },
  'not-same-clock': {
    q: 'Name one way the TypeScript and Rust timings don’t measure exactly the same thing.',
    a: 'The TS timer starts after Node has started and loaded the VM’s code; the shell’s timer around drip-rs includes process start-up. Also one run versus best of three.',
  },
  'design-vs-lang': {
    q: 'Why do the drip-rs vs TS VM ratios vary less than the TS VM vs tree-walker ratios?',
    a: 'The two VMs are the same design doing the same work per instruction; only the language changed. The tree-walker is a different design, better or worse depending on the program.',
  },
  'zoo-batch-why': {
    q: 'Why does `zoo_batch` take about 10 seconds on all three implementations?',
    a: 'It loops until `clock()` says 10 seconds have passed. Its useful result is the number of batches it finished, not its time.',
  },
  'zoo-batch-ratio': {
    q: 'For a fixed-time benchmark, how do you compute a speed-up?',
    a: 'Work done by the new version divided by work done by the old one, such as batches finished: the inverse of a time ratio.',
  },
  'streq-why': {
    q: 'Why does `string_equality` fail on both VMs but run on the tree-walker?',
    a: 'Each use of a global adds its name to the chunk’s constants, and a one-byte operand allows only 256. The tree-walker has no constant table.',
  },
  'geomean': {
    q: 'Why summarize speed-ups with a geometric mean rather than an arithmetic one?',
    a: 'Ratios multiply. The geometric mean of a/b is exactly 1 over that of b/a, so the summary doesn’t depend on which side you call the baseline.',
  },
  'impl-comparison': {
    q: 'What is an **implementation comparison**, and what can’t it tell you?',
    a: 'Running the same programs, same inputs, same machine, on several implementations. It can’t say why one is faster, or whether a language is.',
  },
};

export const exercises = {
  summarize: {
    lang: 'rust',
    title: 'Speed-ups that know what was measured',
    prompt:
      'A benchmark result is a `Res`: a time (`Ms`), the work a fixed-time run got done, such as zoo_batch’s batch count (`Work`), or a failure. Write `speedup(old, new)`: for two times, `old / new`; for two `Work` counts, `new / old`, because more work is better; for anything else (a failure, or two different kinds), `None`. Write `geomean(xs)`, the geometric mean (`None` for no values). Then `summary(old, new)`: the geometric mean of the speed-ups of the pairs that have one. The tests use the committed results.',
    starter: `${RES}
fn speedup(old: &Res, new: &Res)
    -> Option<f64> {
    todo!()
}

fn geomean(xs: &[f64]) -> Option<f64> {
    todo!()
}

fn summary(old: &[Res], new: &[Res])
    -> Option<f64> {
    todo!()
}`,
    solution: `${RES}
fn speedup(old: &Res, new: &Res)
    -> Option<f64> {
    use Res::*;
    match (old, new) {
        (Ms(a), Ms(b)) => Some(a / b),
        (Work(a), Work(b)) => {
            Some(b / a)
        }
        _ => None,
    }
}

${GEO}
${SUMMARY}`,
    tests: `use Res::*;

fn close(a: f64, b: f64) -> bool {
    (a - b).abs() < 0.005
}

#[test]
fn times_divide_old_by_new() {
    // fib: TS VM 5685 ms, drip-rs 1460 ms.
    assert!(close(speedup(&Ms(5685.0), &Ms(1460.0)).unwrap(), 3.89));
}

#[test]
fn batches_divide_new_by_old() {
    // zoo_batch: TS VM 844 batches, drip-rs 3060 (hand count in the .md).
    assert!(close(speedup(&Work(844.0), &Work(3060.0)).unwrap(), 3.63));
}

#[test]
fn failures_and_mixed_kinds_have_no_speedup() {
    assert_eq!(speedup(&Failed, &Failed), None);
    assert_eq!(speedup(&Ms(13874.0), &Failed), None);
    assert_eq!(speedup(&Ms(10011.0), &Work(3060.0)), None);
}

#[test]
fn geometric_mean() {
    assert!(close(geomean(&[2.0, 8.0]).unwrap(), 4.0));
    assert_eq!(geomean(&[]), None);
    // Symmetric: the mean of the inverses is the inverse of the mean.
    let g = geomean(&[3.89, 0.77, 5.68]).unwrap();
    let h = geomean(&[1.0 / 3.89, 1.0 / 0.77, 1.0 / 5.68]).unwrap();
    assert!(close(g * h, 1.0));
}

#[test]
fn ts_vm_to_drip_rs_on_the_committed_run() {
    let ts = [Ms(13078.0), Ms(16501.0), Ms(5685.0), Ms(3570.0), Ms(2042.0), Ms(1085.0), Ms(2781.0), Failed, Ms(21327.0), Ms(1749.0)];
    let rs = [Ms(2672.0), Ms(4220.0), Ms(1460.0), Ms(628.0), Ms(577.0), Ms(316.0), Ms(795.0), Failed, Ms(4858.0), Ms(528.0)];
    assert!(close(summary(&ts, &rs).unwrap(), 4.00));
    assert_eq!(summary(&[Failed], &[Failed]), None);
}`,
    hints: [
      'Match on the pair: `match (old, new) { (Res::Ms(a), Res::Ms(b)) => ..., ... }`. A final `_ => None` covers failures and mixed kinds.',
      'The geometric mean is `exp` of the average of the `ln`s. Check for an empty slice first.',
      'In `summary`, zip the two slices, keep each `Some` speed-up in a `Vec`, and hand it to `geomean`.',
    ],
    walkthrough: `The type does the thinking. A result is one of three things, and \`speedup\` handles each pair explicitly:

\`\`\`rust
match (old, new) {
    (Res::Ms(a), Res::Ms(b)) => Some(a / b),
    (Res::Work(a), Res::Work(b)) => Some(b / a),
    _ => None,
}
\`\`\`

A time is “less is better” and a batch count is “more is better”, so the division flips. That is the zoo_batch lesson: its 10-second time says nothing, and its batch count, 3060 against 844, says drip-rs did 3.63 times the work. Putting a time next to a count, or anything next to a failure, gives \`None\` instead of a number that means nothing. That is why \`string_equality\` drops out of the summary instead of counting as zero or infinity.

The geometric mean multiplies the ratios and takes the nth root, computed with logarithms so large products don’t overflow. On the nine timed programs it gives 4.00 for drip-rs against the TS VM. The arithmetic mean of the same ratios is 4.06, and the arithmetic mean of the *inverse* ratios doesn’t come out as its inverse, which is why benchmark suites summarize ratios geometrically.`,
    wrong: [
      {
        code: `${RES}
fn speedup(old: &Res, new: &Res)
    -> Option<f64> {
    use Res::*;
    match (old, new) {
        (Ms(a), Ms(b)) => Some(a / b),
        (Work(a), Work(b)) => {
            Some(a / b)
        }
        _ => None,
    }
}

${GEO}
${SUMMARY}`,
        why: 'For a fixed-time run more batches is better, so the ratio is `new / old`. This reports drip-rs as 0.28× on zoo_batch.',
      },
      {
        code: `${RES}
fn speedup(old: &Res, new: &Res)
    -> Option<f64> {
    use Res::*;
    match (old, new) {
        (Ms(a), Ms(b)) => Some(a / b),
        (Work(a), Work(b)) => {
            Some(b / a)
        }
        _ => None,
    }
}

fn geomean(xs: &[f64]) -> Option<f64> {
    if xs.is_empty() {
        return None;
    }
    let s: f64 = xs.iter().sum();
    Some(s / xs.len() as f64)
}

${SUMMARY}`,
        why: 'That is the arithmetic mean: 5.0 for [2, 8] instead of 4.0, and not symmetric under inverting the ratios.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'On `instantiation`, the TS VM took 3570 ms and the tree-walker 2742 ms. What follows?',
    options: [
      { t: 'Bytecode VMs are slower than tree-walkers', why: 'On seven of the nine timed programs the TS VM was faster, up to 4.78×.' },
      { t: 'In this one run, this program was slower on the TS VM; the run alone can’t say why', correct: true, why: 'One run per program on a shared VM. A profile of each would be the next step.' },
      { t: 'The measurement is wrong', why: 'Nothing suggests that. A different design can lose on some programs.' },
    ],
  },
  {
    q: 'drip-rs ran 3.31× to 5.68× as fast as the TS VM. Which claim does that support?',
    options: [
      { t: 'Rust is about four times faster than JavaScript', why: 'This is one port of one program, with its own design choices, on one machine. A different JavaScript VM, or a different Rust one, would give other numbers.' },
      { t: 'This Rust port of this VM ran these programs 3.3–5.7× as fast as its TypeScript twin, in these runs', correct: true, why: 'That is exactly what was measured, with its scope attached.' },
      { t: 'The Rust VM uses a better algorithm', why: 'It is the same algorithm by design: the same compiler, opcodes and collector.' },
    ],
  },
  {
    q: 'What should a speed-up for `zoo_batch` be based on?',
    options: [
      { t: 'Its time, as for the other programs', why: 'Every implementation stops at 10 seconds by design, so the times are all about 10 s.' },
      { t: 'The batches each finished: drip-rs’s count divided by the other’s', correct: true, why: 'The committed files give drip-rs 3060 batches; the .md’s hand count gives the TS VM 844, so about 3.6×.' },
      { t: 'Nothing: fixed-time benchmarks can’t be compared', why: 'They compare work done instead of time taken.' },
    ],
  },
  {
    q: 'Why is `string_equality` missing from both VMs’ columns?',
    options: [
      { t: 'It is too slow to finish', why: 'It never starts: compiling fails, with exit code 65.' },
      { t: 'Its chunk needs more than 256 constants, the most a one-byte operand can address', correct: true, why: 'Every use of a global like `a1` adds another copy of its name to the constants. Both VMs print the same 1700 error lines.' },
      { t: 'The Rust VM has a bug the TypeScript VM shares by accident', why: 'It is the specified limit, kept on purpose in both, as in clox.' },
    ],
  },
  {
    q: 'The TS times are single runs and drip-rs’s are best of three. Which way does that tilt the comparison?',
    options: [
      { t: 'Slightly in drip-rs’s favour', correct: true, why: 'The best of three runs is never slower than a single one, so drip-rs got three chances at a quiet moment.' },
      { t: 'In TypeScript’s favour', why: 'Taking a minimum can only lower drip-rs’s numbers.' },
      { t: 'Not at all', why: 'On a noisy VM, best-of-three versus one run matters by a few to tens of percent.' },
    ],
  },
  {
    q: 'Why does the summary use a geometric mean of the speed-ups?',
    options: [
      { t: 'It is always larger, which looks better', why: 'It is never larger than the arithmetic mean.' },
      { t: 'It gives every program the same weight whichever side is the baseline: inverting all ratios inverts the mean', correct: true, why: 'With an arithmetic mean, “A vs B” and “B vs A” tell different stories.' },
      { t: 'It ignores the slowest program', why: 'Every program counts; failures are left out because they have no ratio.' },
    ],
  },
];
