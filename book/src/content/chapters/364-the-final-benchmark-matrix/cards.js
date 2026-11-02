// Chapter 364 cards. Keys are stable ids: never rename them.

const PRE = `// One program in two implementations:
// milliseconds, or None if it failed.
struct Row {
    old: Option<f64>,
    new: Option<f64>,
    // runs for a fixed time: no speed
    fixed: bool,
}
`;

export const prompts = {
  'matrix-what': {
    q: 'What is a benchmark matrix?',
    a: 'Every combination along a few axes (program × engine × original/compiled, and so on), measured with one method on one machine, with the versions and the noise recorded beside the numbers.',
  },
  'matrix-why': {
    q: 'Why re-run comparisons in one matrix instead of collecting old results?',
    a: 'Results from different days and methods can’t be compared cell by cell. One run, one method, one machine makes any two cells comparable.',
  },
  'best-of': {
    q: 'Why does the matrix report the best of 9 runs as its main figure?',
    a: 'On a shared, noisy VM the minimum is the most stable figure: noise only ever adds time. The median is shown beside it for the spread.',
  },
  interleave: {
    q: 'Why are the original and compiled runs interleaved?',
    a: 'So that a slow patch on the shared machine hits both versions alike, instead of making one of them look slower.',
  },
  'heat-two': {
    q: 'What does Viscosity do for `heat` on Node, and on Bun?',
    a: 'A large gain on Node (V8), one of the biggest in the matrix; none on Bun (JavaScriptCore), within the noise.',
  },
  originals: {
    q: 'Where is the difference between V8 and JSC on `heat`: in the original or the compiled program?',
    a: 'In the original. Bun runs the array-of-objects version much faster than Node; compiled, the two are close.',
  },
  hypothesis: {
    q: 'What is FINDINGS.md’s likely explanation for heat, and how sure is it?',
    a: 'V8 keeps a double field in a separate heap box (one more pointer per read); JSC stores the double in the value. SoA fixes storage and locality on V8, only locality on JSC. A hypothesis: not yet confirmed with engine traces.',
  },
  'explain-claim': {
    q: 'Why does `explain` say why a collection was transformed, but not how much faster it will be?',
    a: 'Because the gain depends on the engine that runs the code, which the compiler never sees: the same compiled heat gained a lot on V8 and nothing on JSC.',
  },
  'old-file': {
    q: 'Why shouldn’t `e2e-node-2026-10-31` be compared cell by cell with the matrix?',
    a: 'It predates the late-store fix (heat’s compiled code changed since), and it used a different method: Node only, median of 3.',
  },
  startup: {
    q: 'Run once per file, the Rust CLI beats the TS CLI by a much bigger ratio than the in-process comparison shows. Why?',
    a: 'Start-up: each TS CLI run starts Node and loads a 1 MB bundle, which takes far longer than compiling. In one warm process, only the engines are compared.',
  },
};

export const exercises = {
  geomean: {
    lang: 'rust',
    title: 'A geometric mean with gaps',
    prompt:
      'Write `geomean`: the geometric mean of `old / new` over the rows that have a speed-up. Skip rows where either time is missing (the program failed) and rows marked `fixed` (they run for a fixed time, so their time is not a speed). Return `None` if no row is left. The geometric mean of n numbers is the n-th root of their product: compute it as `exp` of the mean of the `ln`s.',
    starter: `${PRE}
// The geometric mean of old / new over
// the rows that have a speed-up at all.
fn geomean(rs: &[Row]) -> Option<f64> {
    todo!()
}`,
    solution: `${PRE}
// The geometric mean of old / new over
// the rows that have a speed-up at all.
fn geomean(rs: &[Row]) -> Option<f64> {
    let mut logs = 0.0;
    let mut n = 0;
    for r in rs {
        if r.fixed {
            continue;
        }
        if let (Some(a), Some(b)) =
            (r.old, r.new)
        {
            logs += (a / b).ln();
            n += 1;
        }
    }
    if n == 0 {
        return None;
    }
    Some((logs / n as f64).exp())
}`,
    tests: `fn row(a: f64, b: f64) -> Row {
    Row {
        old: Some(a),
        new: Some(b),
        fixed: false,
    }
}

fn close(x: Option<f64>, y: f64) -> bool {
    x.is_some_and(|x| (x - y).abs() < 1e-9)
}

#[test]
fn a_four_and_a_one_make_two() {
    let rs = [row(8.0, 2.0), row(5.0, 5.0)];
    assert!(close(geomean(&rs), 2.0));
}

#[test]
fn a_loss_cancels_a_win() {
    let rs = [row(10.0, 5.0), row(5.0, 10.0)];
    assert!(close(geomean(&rs), 1.0));
}

#[test]
fn failed_runs_are_skipped() {
    let bad = Row {
        old: Some(13.0),
        new: None,
        fixed: false,
    };
    let rs = [row(9.0, 1.0), bad];
    assert!(close(geomean(&rs), 9.0));
}

#[test]
fn fixed_time_rows_are_skipped() {
    let z = Row { fixed: true, ..row(10.0, 1.0) };
    let rs = [row(3.0, 1.0), z];
    assert!(close(geomean(&rs), 3.0));
}

#[test]
fn nothing_to_average_is_none() {
    assert_eq!(geomean(&[]), None);
    let z = Row { new: None, ..row(1.0, 1.0) };
    assert_eq!(geomean(&[z]), None);
}
`,
    hints: [
      'Loop over the rows, `continue` past the fixed ones, and use `if let (Some(a), Some(b)) = (r.old, r.new)` to take only rows with both times.',
      'Add up `(a / b).ln()` and count the rows you used. Adding logarithms is multiplying the ratios, without the product overflowing.',
      'At the end, no rows means `None`. Otherwise `Some((sum / n as f64).exp())`.',
    ],
    walkthrough: `This is \`geo\` in \`engine/ts/packages/bench/src/matrix.ts\`, in Rust, together with the filtering the matrix does before calling it.

- **Why geometric.** Speed-ups are ratios. A program 2× faster and another 2× slower should average to “no change”, 1×. The arithmetic mean of 2 and 0.5 is 1.25; the geometric mean is 1. (The test \`a_loss_cancels_a_win\` checks exactly that.)
- **Why logarithms.** \`ln(a·b) = ln a + ln b\`, so the mean of the logs is the log of the n-th root of the product. Summing logs also avoids a huge or tiny product.
- **Why skip, not substitute.** A failed run has no time. Replacing it with 1.0 invents a 1× (or worse) result and drags the mean. The matrix shows such rows in a footnote and leaves them out of the mean.
- **Why fixed-time rows go.** \`zoo_batch\` runs for ten seconds on every implementation; what differs is how much it gets done. Its time ratio is always about 1, which says nothing about speed.`,
    wrong: [
      {
        code: `${PRE}
// The geometric mean of old / new over
// the rows that have a speed-up at all.
fn geomean(rs: &[Row]) -> Option<f64> {
    let mut sum = 0.0;
    let mut n = 0;
    for r in rs {
        if r.fixed {
            continue;
        }
        if let (Some(a), Some(b)) =
            (r.old, r.new)
        {
            sum += a / b;
            n += 1;
        }
    }
    if n == 0 {
        return None;
    }
    Some(sum / n as f64)
}`,
        why: 'That is the arithmetic mean of the ratios. A 2× win and a 2× loss average to 1.25×, not 1×.',
      },
      {
        code: `${PRE}
// The geometric mean of old / new over
// the rows that have a speed-up at all.
fn geomean(rs: &[Row]) -> Option<f64> {
    let mut logs = 0.0;
    let mut n = 0;
    for r in rs {
        if r.fixed {
            continue;
        }
        let a = r.old.unwrap_or(1.0);
        let b = r.new.unwrap_or(1.0);
        logs += (a / b).ln();
        n += 1;
    }
    if n == 0 {
        return None;
    }
    Some((logs / n as f64).exp())
}`,
        why: 'Treating a missing time as 1.0 invents a speed-up for a program that failed, and never returns `None`.',
      },
      {
        code: `${PRE}
// The geometric mean of old / new over
// the rows that have a speed-up at all.
fn geomean(rs: &[Row]) -> Option<f64> {
    let mut logs = 0.0;
    let mut n = 0;
    for r in rs {
        if let (Some(a), Some(b)) =
            (r.old, r.new)
        {
            logs += (a / b).ln();
            n += 1;
        }
    }
    if n == 0 {
        return None;
    }
    Some((logs / n as f64).exp())
}`,
        why: 'This forgets the fixed-time rows, so a program that runs for ten seconds on every implementation counts as a speed.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'On which program did Viscosity gain on Node but not on Bun?',
    options: [
      { t: 'particles', why: 'particles gained on both engines.' },
      { t: 'ledger', why: 'ledger gained on both, more on Node.' },
      { t: 'heat', correct: true, why: 'A large gain on V8 and about 1× on JSC, within the noise.' },
      { t: 'boids', why: 'boids gained more on Bun than on Node.' },
    ],
  },
  {
    q: 'What is the status of the “heap number” explanation for heat?',
    options: [
      { t: 'Confirmed by V8 traces', why: 'FINDINGS.md says it is not yet confirmed with engine traces.' },
      { t: 'A hypothesis that rests on documented engine facts', correct: true, why: 'V8’s boxed double fields and JSC’s inline doubles are documented; that they cause heat’s gap is the unconfirmed part.' },
      { t: 'Ruled out by section 5 of FINDINGS.md', why: 'Section 5 fits it: packed typed storage alone recovered much of the gain on V8.' },
    ],
  },
  {
    q: 'Why does the matrix interleave original and compiled runs?',
    options: [
      { t: 'To warm up the JIT', why: 'Each run is a fresh process, so nothing is shared between runs; there is one discarded run of each for that.' },
      { t: 'So that noise on the shared machine falls on both versions alike', correct: true, why: 'A busy minute on the VM then slows an original and a compiled run, not five of one kind.' },
      { t: 'Because Bun requires it', why: 'Nothing about Bun needs it. It is a measurement choice.' },
    ],
  },
  {
    q: 'The CLI comparison gives Rust a much larger lead than the in-process comparison. Which statement is right?',
    options: [
      { t: 'One of the two measurements is wrong', why: 'Both are right; they measure different things.' },
      { t: 'The CLI ratio includes starting Node and loading the bundle for every file; the in-process one compares warm engines', correct: true, why: 'Inside one warm process the TS engine compiles a corpus program in well under a millisecond, so most of each TS CLI run is start-up.' },
      { t: 'The in-process run used the native Rust binary', why: 'It used `@viscosity/wasm`, the Rust engine as WebAssembly, inside the same Node.' },
    ],
  },
  {
    q: 'Why does the drip geometric mean leave out `string_equality`?',
    options: [
      { t: 'It was too slow to measure', why: 'The tree-walker ran it. The two VMs refuse it.' },
      { t: 'Both VMs stop with “Too many constants in one chunk”, so there is no ratio', correct: true, why: 'A failed cell has no speed-up; the matrix footnotes it and skips it.' },
      { t: 'It runs for a fixed time', why: 'That is zoo_batch.' },
    ],
  },
  {
    q: 'What can Viscosity’s cost model honestly claim about a transformed collection?',
    options: [
      { t: 'A predicted speed-up, such as “2× faster”', why: 'The same code gained much less on JSC than on V8, and heat nothing. A figure would be a guess about an engine the compiler never sees.' },
      { t: 'Nothing: the matrix shows layouts don’t matter', why: 'Every program gained on V8, and most on JSC too.' },
      { t: 'Why it chose the layout: size, the loops and fields, the proofs', correct: true, why: 'Those are facts about the program. How much faster it gets depends on the engine that runs it.' },
    ],
  },
];
