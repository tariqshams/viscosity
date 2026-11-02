// Chapter 268 cards. Keys are stable ids: never rename them.

// Shared by the exercise: a cut-down Collection and PlanOptions.
const SCAF = `#[derive(Debug, PartialEq)]
enum Layout {
    Aos,
    Soa,
}

struct Coll {
    bailouts: Vec<String>,
    // fields proven numeric
    numeric: usize,
    // loops of depth > 0 touching it
    loops: usize,
    estimate: Option<f64>,
    // the estimate is a maximum
    upper: bool,
}

struct Opts {
    min_size: f64,
    // from a profile, if any
    measured: Option<f64>,
}

const M: &str = " (measured)";
const P: &str =
    " (measured by profiling)";
`;

const SOL = `${SCAF}
fn plan(
    c: &Coll,
    o: &Opts,
) -> (Layout, Vec<String>) {
    use Layout::*;
    if !c.bailouts.is_empty() {
        let r = c.bailouts.iter().map(
            |b| format!("unsafe: {b}"),
        );
        return (Aos, r.collect());
    }
    if c.numeric == 0 {
        let r = "no numeric field";
        return (Aos, vec![r.into()]);
    }
    if c.loops == 0 {
        let r = "no loop";
        return (Aos, vec![r.into()]);
    }
    let m = o.measured.is_some();
    let est = c.estimate;
    let size = o.measured.or(est);
    let word = if !m && c.upper {
        "at most"
    } else {
        "about"
    };
    let min = o.min_size;
    let small =
        size.filter(|&s| s < min);
    if let Some(s) = small {
        let t = if m { M } else { "" };
        let r = format!(
            "{word} {s} elements{t}: \\
             below {min}"
        );
        return (Aos, vec![r]);
    }
    let Some(s) = size else {
        let r = "size unknown";
        return (Soa, vec![r.into()]);
    };
    let t = if m { P } else { "" };
    let r =
        format!("{word} {s} elements");
    (Soa, vec![r + t])
}`;

export const prompts = {
  'cm-rs-return': {
    q: 'The TypeScript `plan()` refuses with `out.push(keep(...)); continue;`. What does the Rust port do instead?',
    a: 'It moves the loop body into `plan_one`, and each refusal is an early `return keep(...)`.',
  },
  'cm-rs-keep': {
    q: 'What is `keep` in `plan_one`?',
    a: 'A closure that borrows the collection and builds a `CollectionPlan` with layout `Aos`, block size 0 and the given reasons.',
  },
  'cm-rs-one-per-bailout': {
    q: 'Why does a collection with bailouts get exactly one reason per bailout?',
    a: '`explain --frames` pairs the k-th reason with the k-th bailout’s source position to print a code frame under it.',
  },
  'cm-rs-pow2': {
    q: 'Why does the block-size test say `b >= 2 && b.is_power_of_two()`, not just `is_power_of_two()`?',
    a: '1 is 2⁰, so `1.is_power_of_two()` is true, but a block of one element is not AoSoA.',
  },
  'cm-rs-or': {
    q: 'What does `measured.or(c.size_estimate)` give when a profile has the collection?',
    a: 'The measured size. `Option::or` keeps the first value when there is one.',
  },
  'cm-rs-unknown': {
    q: 'What does the size rung do when the size is unknown (`None`)?',
    a: 'Nothing: `if let Some(size)` doesn’t match, so no refusal. The planner assumes a collection it can’t count may be large.',
  },
  'cm-rs-max': {
    q: 'A collection is “at most 100 elements” and really holds 25. With the default threshold of 64, what happens, and why?',
    a: 'It becomes SoA: the maximum is compared as if it were the size. Only a profile (measured 25) makes the planner keep it.',
  },
  'cm-rs-nan': {
    q: 'Why would a `min_size` of `NaN` turn the threshold off, in both engines?',
    a: '`size < NaN` is always false, so nothing is refused for its size. That is why both CLIs now refuse `--min-size abc`.',
  },
  'cm-rs-bug': {
    q: 'Why did the 186 parity fixtures miss that the two engines once worded the “measured” threshold message differently?',
    a: 'They compiled with default options and with `--bounds assume`, never with `--profile`, and the fuzzer passed no profile either.',
  },
};

export const examples = {
  'size-rung': {
    lang: 'rust',
    title: 'Measured, estimated, unknown, NaN',
    code: `// The size rung of plan_one, alone:
// true means "keep: too small".
fn too_small(
    measured: Option<f64>,
    estimate: Option<f64>,
    min: f64,
) -> bool {
    match measured.or(estimate) {
        Some(s) => s < min,
        // Unknown: it may be big.
        None => false,
    }
}

fn main() {
    let cases = [
        (None, Some(100.0), 64.0),
        (None, Some(100.0), 200.0),
        (Some(25.0), Some(100.0), 64.0),
        (None, None, 64.0),
        // NaN: the CLIs now refuse it
        (None, Some(2.0), f64::NAN),
    ];
    for (m, e, min) in cases {
        let k = too_small(m, e, min);
        let v = if k { "keep" } else {
            "soa"
        };
        println!(
            "{m:?} {e:?} {min}: {v}"
        );
    }
}
`,
  },
};

export const exercises = {
  planBottom: {
    lang: 'rust',
    title: 'The bottom of the ladder',
    prompt:
      'Write `plan`, a cut-down `plan_one`, in this order. Bailouts: `Aos`, with one reason `unsafe: {b}` per bailout. No numeric field: `Aos`, `"no numeric field"`. No loop: `Aos`, `"no loop"`. Then the size is the measured one if there is one, else the estimate. The word is `"at most"` only when nothing was measured and the estimate is an upper bound, else `"about"`. If the size is known and below `min_size`: `Aos`, `"{word} {s} elements: below {min}"`, with ` (measured)` right after `elements` when measured (the reference’s order). Otherwise `Soa`, with one reason: `"size unknown"`, or `"{word} {s} elements"`, plus ` (measured by profiling)` when measured.',
    starter: `${SCAF}
fn plan(
    c: &Coll,
    o: &Opts,
) -> (Layout, Vec<String>) {
    todo!()
}`,
    solution: SOL,
    tests: `fn coll(estimate: Option<f64>) -> Coll {
    Coll {
        bailouts: vec![],
        numeric: 1,
        loops: 1,
        estimate,
        upper: false,
    }
}

fn opts(measured: Option<f64>) -> Opts {
    Opts { min_size: 64.0, measured }
}

fn one(s: &str) -> Vec<String> {
    vec![s.to_string()]
}

#[test]
fn one_reason_per_bailout() {
    let mut c = coll(Some(500.0));
    c.bailouts = vec!["a".into(), "b".into()];
    c.numeric = 0;
    let (l, r) = plan(&c, &opts(None));
    assert_eq!(l, Layout::Aos);
    assert_eq!(r, vec!["unsafe: a", "unsafe: b"]);
}

#[test]
fn numeric_before_size() {
    let mut c = coll(Some(2.0));
    c.numeric = 0;
    let got = plan(&c, &opts(None));
    assert_eq!(got.1, one("no numeric field"));
}

#[test]
fn loops_before_size() {
    let mut c = coll(Some(2.0));
    c.loops = 0;
    let got = plan(&c, &opts(None));
    assert_eq!(got.1, one("no loop"));
}

#[test]
fn small_estimates_are_kept() {
    let got = plan(&coll(Some(2.0)), &opts(None));
    assert_eq!(got.0, Layout::Aos);
    assert_eq!(got.1,
        one("about 2 elements: below 64"));
}

#[test]
fn a_small_maximum_says_at_most() {
    let mut c = coll(Some(40.0));
    c.upper = true;
    let got = plan(&c, &opts(None));
    assert_eq!(got.1,
        one("at most 40 elements: below 64"));
}

#[test]
fn a_large_maximum_passes() {
    let mut c = coll(Some(100.0));
    c.upper = true;
    let got = plan(&c, &opts(None));
    assert_eq!(got.0, Layout::Soa);
    assert_eq!(got.1, one("at most 100 elements"));
}

#[test]
fn a_measurement_wins_with_the_reference_wording() {
    let mut c = coll(Some(100.0));
    c.upper = true;
    let got = plan(&c, &opts(Some(25.0)));
    assert_eq!(got.0, Layout::Aos);
    assert_eq!(got.1, one(
        "about 25 elements (measured): below 64"));
}

#[test]
fn a_large_measurement() {
    let got = plan(&coll(None), &opts(Some(5000.0)));
    assert_eq!(got.0, Layout::Soa);
    assert_eq!(got.1, one(
        "about 5000 elements (measured by profiling)"));
}

#[test]
fn an_unknown_size_passes() {
    let got = plan(&coll(None), &opts(None));
    assert_eq!(got.0, Layout::Soa);
    assert_eq!(got.1, one("size unknown"));
}
`,
    hints: [
      'Start with `if !c.bailouts.is_empty() { ... return (Aos, r); }`, mapping each bailout through `format!("unsafe: {b}")` and collecting into a `Vec<String>`.',
      'The size is `o.measured.or(c.estimate)`. Compute `let m = o.measured.is_some();` once: it decides both “at most” and the “(measured)” text.',
      'Only refuse inside `if let Some(s) = size { if s < o.min_size { ... } }`. A `None` falls through to `Soa` with `"size unknown"`. Rust prints `25.0_f64` as `25` with `{}`.',
    ],
    walkthrough: `This is the bottom of \`plan_one\` in \`engine/rust/crates/core/src/plan.rs\` (the annotation, opt-in and Python rungs left out), with the reference’s wording for the measured threshold message.

- **Why the order.** Each rung is an early return, so the first test that fires decides. Safety first: \`one_reason_per_bailout\` has no numeric field either, and the answer must still be the bailouts. Size last: a tiny collection with no numeric field is refused for the field, which is the more useful thing to tell the programmer.
- **Why \`or\`.** A measurement is a fact about a run; an estimate is a guess, and maybe only a maximum. \`measured.or(estimate)\` prefers the fact.
- **Why “about” after a measurement.** \`size_is_upper_bound\` describes the *estimate*. A measured 25 is not a maximum of anything, so the word is “about”.
- **Why \`None\` passes.** The planner can’t refuse on a size it doesn’t have, and a collection it can’t count (pushes in a function, a \`while\` loop) may well be large.
- **The wording.** The port once wrote \`"{} {}{} elements: below …"\`, which put “ (measured)” before “elements”. The reference, this exercise and today’s port put it after. The test \`a_measurement_wins_with_the_reference_wording\` is the kind of test the fixtures lacked until profile fixtures were added.`,
    wrong: [
      {
        code: SOL.replace(`    if c.numeric == 0 {
        let r = "no numeric field";
        return (Aos, vec![r.into()]);
    }
    if c.loops == 0 {
        let r = "no loop";
        return (Aos, vec![r.into()]);
    }
    let m`, `    let m`).replace(`    let Some(s) = size else {`, `    if c.numeric == 0 {
        let r = "no numeric field";
        return (Aos, vec![r.into()]);
    }
    if c.loops == 0 {
        let r = "no loop";
        return (Aos, vec![r.into()]);
    }
    let Some(s) = size else {`),
        why: 'It checks the size before the field and loop rules. A two-element collection with no numeric field is then refused for its size, not for the reason that matters.',
      },
      {
        code: SOL.replace('let size = o.measured.or(est);', 'let size = est.or(o.measured);'),
        why: '`est.or(o.measured)` prefers the guess. With an estimate of 100 and a measured 25, it says “at most 100” and transforms a 25-element collection.',
      },
      {
        code: SOL.replace('{s} elements{t}:', '{s}{t} elements:'),
        why: 'This was the port’s wording until it was fixed: “about 25 (measured) elements”. The reference says “about 25 elements (measured)”, so the engines’ explain texts differed.',
      },
      {
        code: SOL.replace('let size = o.measured.or(est);', 'let size = o.measured.or(est)\n        .or(Some(0.0));'),
        why: 'Treating an unknown size as 0 refuses every collection the analysis can’t count, including large ones built by a function or a `while` loop.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A collection has a bailout *and* a `// @viscosity soa` annotation. What does `plan_one` do?',
    options: [
      { t: 'Transforms it: the annotation is the programmer overruling the analysis', why: 'Annotations overrule the cost model, not safety.' },
      { t: 'Keeps it, with one `unsafe: …` reason per bailout', correct: true, why: 'The bailout test is the first rung, before the annotation is even looked at.' },
      { t: 'Fails to compile the program', why: 'Refusing is never an error; it is a reason in explain.' },
    ],
  },
  {
    q: '`// @viscosity aosoa(1)` on a numeric collection. What does explain say?',
    options: [
      { t: '`AoSoA, blocks of 1`', why: '`1.is_power_of_two()` is true, but the test also requires `b >= 2`.' },
      { t: '`struct of arrays`, since a block of 1 is just SoA', why: 'The planner doesn’t reinterpret annotations; it refuses them.' },
      { t: 'It is kept: `annotated aosoa(1), but the block size must be a power of two (2, 4, 8, 16, ...)`', correct: true, why: 'The message lists 2 as the smallest allowed size.' },
    ],
  },
  {
    q: 'A collection’s size is unknown statically, and there is no profile. Which is true?',
    options: [
      { t: 'The size rung keeps it, to be safe', why: 'Refusing is not what “safe” means here: the change is already proven safe.' },
      { t: 'The size rung doesn’t fire, and explain lists “size unknown statically” among the reasons', correct: true, why: '`if let Some(size) = size` doesn’t match `None`.' },
      { t: 'The planner runs the program to find out', why: 'Only `viscosity profile` runs the program, and only when you ask.' },
    ],
  },
  {
    q: 'The estimate is “at most 100”, a profile measured 25, and `min_size` is 64. What is the outcome?',
    options: [
      { t: 'SoA, because 100 ≥ 64', why: 'The measurement wins: `measured.or(estimate)`.' },
      { t: 'SoA, because profiles only raise sizes', why: 'A profile replaces the size, in either direction.' },
      { t: 'Kept: 25 < 64, worded “about”, not “at most”', correct: true, why: 'The upper-bound flag is about the estimate, which wasn’t used.' },
    ],
  },
  {
    q: 'What does `--min-size abc` do today?',
    options: [
      { t: 'The CLI rejects it as a usage error: “--min-size must be a non-negative number”', correct: true, why: 'Both CLIs check it now, because a `NaN` threshold would make `size < min_size` never true.' },
      { t: 'It becomes `NaN`, so no collection is refused for its size', why: 'That is what both CLIs once did, parsing it like `Number("abc")`; now they check first.' },
      { t: 'It falls back to 64', why: 'There is no fallback.' },
    ],
  },
  {
    q: 'The Rust and TypeScript engines once worded the measured threshold message differently. Why did 186/186 fixtures still pass?',
    options: [
      { t: 'The fixtures never used `--profile`, so that message never appeared in them', correct: true, why: 'Parity was checked for default options and `--bounds assume` only; profile fixtures came with the fix.' },
      { t: 'The parity test ignores explain text', why: 'It compares explain byte for byte.' },
      { t: 'The difference was only in whitespace', why: 'Words were in a different order.' },
      { t: 'The fixtures were generated by the Rust engine', why: 'They are generated by the TypeScript reference.' },
    ],
  },
];
