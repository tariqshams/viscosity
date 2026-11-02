// Chapter 83 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 156, 156.

export const prompts = {
  'cm-rs-return': {
    q: 'The TypeScript `plan()` refuses with `out.push(keep(...)); continue;`. What does the Rust port do instead?',
    a: 'It moves the loop body into `plan_one`, called once per collection, and each refusal is an early `return keep(...)`.',
  },
  'cm-rs-keep': {
    q: 'What is `keep` in `plan_one`?',
    a: 'A closure that borrows the collection and builds a `CollectionPlan` with layout `Aos`, block size 0 and the reasons it is given.',
  },
  'cm-rs-clone': {
    q: 'The TypeScript plan holds `collection: c`; the Rust plan holds `c.clone()`. Why the copy?',
    a: 'A plan that borrowed from the `Analysis` would need a lifetime tying the two together; a copy lets the plan stand on its own.',
  },
  'cm-rs-one-per-bailout': {
    q: 'Why does a collection with bailouts get exactly one reason per bailout?',
    a: '`explain --frames` pairs the k-th reason with the k-th bailout’s source position, to print a code frame under it.',
  },
  'cm-rs-order': {
    q: 'Why is the bailout test the first rung of `plan_one`?',
    a: 'If the rewrite could change what the program does, nothing else matters: no annotation, size or loop can make an unsafe rewrite worth doing.',
  },
  'cm-rs-annot-skip': {
    q: 'A safe collection is annotated `// @viscosity soa` and has only 5 elements. Is it transformed?',
    a: 'Yes. The annotation returns before the cost rungs, size included: overruling the cost model is what an annotation is for.',
  },
  'cm-rs-depth': {
    q: 'A collection’s only loop table has depth 0. Which reason does `plan_one` give?',
    a: '“no loop reads or writes its fields, so a new layout cannot pay off”: depth 0 means the accesses are outside every loop.',
  },
  'cm-rs-opt-in': {
    q: 'In `--mode opt-in`, what happens to a safe, numeric, unannotated collection with a hot loop?',
    a: 'It is kept, with “opt-in mode: not annotated”. That rung comes before every cost rung.',
  },
  'cm-rs-measured': {
    q: 'What is `measured` in the size rung when there is a profile but it has no entry for this collection?',
    a: '`None`: `and_then(|p| p.get(&c.name))` finds nothing, so the estimate is used.',
  },
  'cm-rs-or': {
    q: 'What does `measured.or(c.size_estimate)` give when a profile has the collection?',
    a: 'The measured size. `Option::or` keeps the first value when there is one.',
  },
  'cm-rs-unknown': {
    q: 'What does the size rung do when the size is unknown (`None`)?',
    a: 'Nothing: `if let Some(size)` doesn’t match, so no refusal. The planner bets that a collection it can’t count may be large.',
  },
  'cm-rs-max': {
    q: 'A collection is “at most 100 elements” and really holds 25. With the default threshold of 64, what happens, and why?',
    a: 'It becomes SoA: the maximum is compared as if it were the size. Only a profile (measured 25) makes the planner keep it.',
  },
  'cm-rs-nan': {
    q: 'Why would a `min_size` of `NaN` turn the threshold off, in both engines?',
    a: '`size < NaN` is always false, so nothing is refused for its size. That is why both CLIs now refuse `--min-size abc`.',
  },
  'cm-rs-blank': {
    q: 'Why does the Rust CLI check for a blank `--min-size` value separately from `NaN`?',
    a: 'JavaScript’s `Number("")` is `0`, not `NaN`, so a blank value would silently mean “no threshold”. Both CLIs refuse it.',
  },
  'cm-rs-bug': {
    q: 'Why did the 186 parity fixtures miss that the two engines once worded the “measured” threshold message differently?',
    a: 'They compiled with default options and with `--bounds assume`, never with `--profile`, and the fuzzer passed no profile either.',
  },
  'cm-rs-about': {
    q: 'An estimate that is a maximum says “at most”. Why does a measured size always say “about”?',
    a: '`size_is_upper_bound` describes the estimate; a measurement from a real run is not a maximum of anything.',
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
  planTop: {
    lang: 'rust',
    title: 'The top of the ladder',
    prompt: 'Write `plan_one`, a cut-down version of the real one, with early returns in this order. **Bailouts:** `Aos`, with one reason `unsafe: {b}` per bailout, in order. **Opt-in mode:** `Aos`, with the one reason `OPT_IN`. **No numeric field** (`numeric == 0`): `Aos`, `NO_NUM`. **No loop of depth 1 or more** (a depth of 0 means “outside every loop”): `Aos`, `NO_LOOP`. Otherwise `Soa`, with no reasons. (Annotations and the size rung are left out.)',
    starter: `#[derive(Debug, PartialEq)]
enum Layout {
    Aos,
    Soa,
}

#[derive(PartialEq)]
enum Mode {
    Auto,
    OptIn,
}

struct Coll {
    bailouts: Vec<String>,
    // fields proven numeric
    numeric: usize,
    // the depth of each loop table
    depths: Vec<u32>,
}

#[derive(Debug, PartialEq)]
struct Plan {
    layout: Layout,
    reasons: Vec<String>,
}

const OPT_IN: &str =
    "opt-in mode: not annotated";
const NO_NUM: &str =
    "no field is provably numeric";
const NO_LOOP: &str =
    "no loop reads or writes a field";

fn plan_one(
    c: &Coll,
    mode: &Mode,
) -> Plan {
    todo!()
}`,
    solution: `#[derive(Debug, PartialEq)]
enum Layout {
    Aos,
    Soa,
}

#[derive(PartialEq)]
enum Mode {
    Auto,
    OptIn,
}

struct Coll {
    bailouts: Vec<String>,
    // fields proven numeric
    numeric: usize,
    // the depth of each loop table
    depths: Vec<u32>,
}

#[derive(Debug, PartialEq)]
struct Plan {
    layout: Layout,
    reasons: Vec<String>,
}

const OPT_IN: &str =
    "opt-in mode: not annotated";
const NO_NUM: &str =
    "no field is provably numeric";
const NO_LOOP: &str =
    "no loop reads or writes a field";

fn plan_one(
    c: &Coll,
    mode: &Mode,
) -> Plan {
    let keep = |reasons: Vec<String>| {
        Plan {
            layout: Layout::Aos,
            reasons,
        }
    };
    let one =
        |r: &str| keep(vec![r.into()]);
    if !c.bailouts.is_empty() {
        let rs = c.bailouts.iter().map(
            |b| format!("unsafe: {b}"),
        );
        return keep(rs.collect());
    }
    if *mode == Mode::OptIn {
        return one(OPT_IN);
    }
    if c.numeric == 0 {
        return one(NO_NUM);
    }
    let looped =
        c.depths.iter().any(|&d| d > 0);
    if !looped {
        return one(NO_LOOP);
    }
    Plan {
        layout: Layout::Soa,
        reasons: vec![],
    }
}`,
    tests: `fn coll(
    bailouts: &[&str],
    numeric: usize,
    depths: Vec<u32>,
) -> Coll {
    Coll {
        bailouts: bailouts
            .iter()
            .map(|b| b.to_string())
            .collect(),
        numeric,
        depths,
    }
}

fn kept(r: &str) -> Plan {
    Plan {
        layout: Layout::Aos,
        reasons: vec![r.to_string()],
    }
}

#[test]
fn a_good_collection_is_soa() {
    let c = coll(&[], 2, vec![0, 1]);
    let p = plan_one(&c, &Mode::Auto);
    assert_eq!(p.layout, Layout::Soa);
}

#[test]
fn one_reason_per_bailout() {
    let c = coll(&["a", "b"], 1, vec![1]);
    let p = plan_one(&c, &Mode::Auto);
    assert_eq!(p.layout, Layout::Aos);
    assert_eq!(
        p.reasons,
        vec!["unsafe: a", "unsafe: b"],
    );
}

#[test]
fn safety_comes_before_everything() {
    let c = coll(&["a"], 0, vec![]);
    let p = plan_one(&c, &Mode::OptIn);
    assert_eq!(p, kept("unsafe: a"));
}

#[test]
fn opt_in_refuses_before_cost() {
    let c = coll(&[], 0, vec![]);
    let p = plan_one(&c, &Mode::OptIn);
    assert_eq!(p, kept(OPT_IN));
}

#[test]
fn no_numeric_field() {
    let c = coll(&[], 0, vec![1]);
    let p = plan_one(&c, &Mode::Auto);
    assert_eq!(p, kept(NO_NUM));
}

#[test]
fn accesses_outside_loops_dont_count() {
    let c = coll(&[], 1, vec![0]);
    let p = plan_one(&c, &Mode::Auto);
    assert_eq!(p, kept(NO_LOOP));
}
`,
    hints: [
      'Each rung is an `if` that ends with `return`. Write them in the order of the prompt, and finish with the `Soa` plan as the function’s last expression (no `return` needed).',
      'A closure saves repeating yourself: `let keep = |reasons: Vec<String>| Plan { layout: Layout::Aos, reasons };`. For the bailouts, `c.bailouts.iter().map(|b| format!("unsafe: {b}")).collect()` builds the `Vec<String>`.',
      'The loop rung asks whether **some** depth is above 0: `let looped = c.depths.iter().any(|&d| d > 0);`, then `if !looped { ... }`. Checking `c.depths.is_empty()` instead would let a depth-0 table through.',
    ],
    walkthrough: `**How to think about it.** This is the top of \`plan_one\` in \`engine/rust/crates/core/src/plan.rs\`, without the annotation and Python rungs and without the size threshold. The whole function is a list of questions, and the first one that says "refuse" decides; so the only real design work is the **order**, which the tests pin down. \`safety_comes_before_everything\` has a bailout, no numeric field, no loops and opt-in mode all at once, and the answer must be the bailout; \`opt_in_refuses_before_cost\` has no numeric field either, and the answer must be the opt-in reason. Write the rungs top to bottom in that order, each as an early \`return\`, and the order takes care of itself.

**The solution, line by line.**

- \`fn plan_one(c: &Coll, mode: &Mode) -> Plan {\` borrows the collection and the mode; it only reads them.
- \`let keep = |reasons: Vec<String>| { Plan { layout: Layout::Aos, reasons } };\` is the real code's \`keep\`: a closure that builds a kept plan from a list of reasons. \`reasons\` on its own is shorthand for \`reasons: reasons\`.
- \`if !c.bailouts.is_empty() {\` is the safety rung. \`let rs = c.bailouts.iter().map(|b| format!("unsafe: {b}"));\` makes an iterator of one reason per bailout, in order, and \`return keep(rs.collect());\` gathers them (\`collect\` knows to build a \`Vec<String>\` because that is what \`keep\` takes) and ends the call.
- \`let one = |r: &str| keep(vec![r.into()]);\` is a second closure, for the rungs with a single reason: \`vec![r.into()]\` is a one-element \`Vec<String>\` (\`.into()\` turns the \`&str\` into a \`String\`), and it calls \`keep\`, which a closure may do. (The real code writes \`keep(vec!["...".into()])\` at each rung.)
- \`if *mode == Mode::OptIn { return one(OPT_IN); }\`: \`mode\` is a \`&Mode\`, so \`*mode\` compares the value (the scaffold derives \`PartialEq\` so that \`==\` works on \`Mode\`).
- \`if c.numeric == 0 { return one(NO_NUM); }\`: with no numeric field there would be no typed columns.
- \`let looped = c.depths.iter().any(|&d| d > 0);\` and \`if !looped { return one(NO_LOOP); }\`: \`any\` asks whether at least one loop table has depth 1 or more; \`|&d|\` copies each \`u32\` out of the iterator's \`&u32\`.
- \`Plan { layout: Layout::Soa, reasons: vec![] }\` is the last expression, so it is the return value when no rung refused. (The real code fills the reasons from \`describe\`.)

**Common wrong attempts.**

- Testing \`c.numeric == 0\` before the bailouts: \`safety_comes_before_everything\` gets "no field is provably numeric" instead of the bailout, which hides the more important problem from the programmer.
- Joining the bailouts into one reason (\`c.bailouts.join(", ")\`): explain would read the same to a person, but \`--frames\` pairs reason *k* with bailout *k*, and \`one_reason_per_bailout\` fails.
- Writing \`if c.depths.is_empty()\` for the loop rung: a collection whose only table is the depth-0 one (accesses outside every loop) gets through, and \`accesses_outside_loops_dont_count\` fails.`,
    wrong: [
      {
        code: `#[derive(Debug, PartialEq)]
enum Layout {
    Aos,
    Soa,
}

#[derive(PartialEq)]
enum Mode {
    Auto,
    OptIn,
}

struct Coll {
    bailouts: Vec<String>,
    // fields proven numeric
    numeric: usize,
    // the depth of each loop table
    depths: Vec<u32>,
}

#[derive(Debug, PartialEq)]
struct Plan {
    layout: Layout,
    reasons: Vec<String>,
}

const OPT_IN: &str =
    "opt-in mode: not annotated";
const NO_NUM: &str =
    "no field is provably numeric";
const NO_LOOP: &str =
    "no loop reads or writes a field";

fn plan_one(
    c: &Coll,
    mode: &Mode,
) -> Plan {
    let keep = |reasons: Vec<String>| {
        Plan {
            layout: Layout::Aos,
            reasons,
        }
    };
    let one =
        |r: &str| keep(vec![r.into()]);
    if c.numeric == 0 {
        return one(NO_NUM);
    }
    if !c.bailouts.is_empty() {
        let rs = c.bailouts.iter().map(
            |b| format!("unsafe: {b}"),
        );
        return keep(rs.collect());
    }
    if *mode == Mode::OptIn {
        return one(OPT_IN);
    }
    let looped =
        c.depths.iter().any(|&d| d > 0);
    if !looped {
        return one(NO_LOOP);
    }
    Plan {
        layout: Layout::Soa,
        reasons: vec![],
    }
}`,
        why: 'The rungs are in the wrong order: a collection with a bailout and no numeric field is refused for the field, hiding that the rewrite was unsafe.',
      },
      {
        code: `#[derive(Debug, PartialEq)]
enum Layout {
    Aos,
    Soa,
}

#[derive(PartialEq)]
enum Mode {
    Auto,
    OptIn,
}

struct Coll {
    bailouts: Vec<String>,
    // fields proven numeric
    numeric: usize,
    // the depth of each loop table
    depths: Vec<u32>,
}

#[derive(Debug, PartialEq)]
struct Plan {
    layout: Layout,
    reasons: Vec<String>,
}

const OPT_IN: &str =
    "opt-in mode: not annotated";
const NO_NUM: &str =
    "no field is provably numeric";
const NO_LOOP: &str =
    "no loop reads or writes a field";

fn plan_one(
    c: &Coll,
    mode: &Mode,
) -> Plan {
    let keep = |reasons: Vec<String>| {
        Plan {
            layout: Layout::Aos,
            reasons,
        }
    };
    let one =
        |r: &str| keep(vec![r.into()]);
    if !c.bailouts.is_empty() {
        let a = c.bailouts.join(", ");
        let r = format!("unsafe: {a}");
        return keep(vec![r]);
    }
    if *mode == Mode::OptIn {
        return one(OPT_IN);
    }
    if c.numeric == 0 {
        return one(NO_NUM);
    }
    let looped =
        c.depths.iter().any(|&d| d > 0);
    if !looped {
        return one(NO_LOOP);
    }
    Plan {
        layout: Layout::Soa,
        reasons: vec![],
    }
}`,
        why: 'One joined reason for all bailouts breaks the one-to-one match `--frames` relies on: reason k must be bailout k.',
      },
      {
        code: `#[derive(Debug, PartialEq)]
enum Layout {
    Aos,
    Soa,
}

#[derive(PartialEq)]
enum Mode {
    Auto,
    OptIn,
}

struct Coll {
    bailouts: Vec<String>,
    // fields proven numeric
    numeric: usize,
    // the depth of each loop table
    depths: Vec<u32>,
}

#[derive(Debug, PartialEq)]
struct Plan {
    layout: Layout,
    reasons: Vec<String>,
}

const OPT_IN: &str =
    "opt-in mode: not annotated";
const NO_NUM: &str =
    "no field is provably numeric";
const NO_LOOP: &str =
    "no loop reads or writes a field";

fn plan_one(
    c: &Coll,
    mode: &Mode,
) -> Plan {
    let keep = |reasons: Vec<String>| {
        Plan {
            layout: Layout::Aos,
            reasons,
        }
    };
    let one =
        |r: &str| keep(vec![r.into()]);
    if !c.bailouts.is_empty() {
        let rs = c.bailouts.iter().map(
            |b| format!("unsafe: {b}"),
        );
        return keep(rs.collect());
    }
    if *mode == Mode::OptIn {
        return one(OPT_IN);
    }
    if c.numeric == 0 {
        return one(NO_NUM);
    }
    if c.depths.is_empty() {
        return one(NO_LOOP);
    }
    Plan {
        layout: Layout::Soa,
        reasons: vec![],
    }
}`,
        why: 'A table of depth 0 holds accesses outside every loop. Checking for no tables at all lets a collection with no loop through.',
      },
    ],
  },
  planBottom: {
    lang: 'rust',
    title: 'The bottom of the ladder',
    prompt: 'Write `plan`, a cut-down `plan_one`, in this order. Bailouts: `Aos`, with one reason `unsafe: {b}` per bailout. No numeric field: `Aos`, `"no numeric field"`. No loop: `Aos`, `"no loop"`. Then the size is the measured one if there is one, else the estimate. The word is `"at most"` only when nothing was measured and the estimate is an upper bound, else `"about"`. If the size is known and below `min_size`: `Aos`, `"{word} {s} elements: below {min}"`, with ` (measured)` right after `elements` when measured (the reference’s order). Otherwise `Soa`, with one reason: `"size unknown"`, or `"{word} {s} elements"`, plus ` (measured by profiling)` when measured.',
    starter: `#[derive(Debug, PartialEq)]
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

fn plan(
    c: &Coll,
    o: &Opts,
) -> (Layout, Vec<String>) {
    todo!()
}`,
    solution: `#[derive(Debug, PartialEq)]
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
}`,
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
      'Copy the order of the real ladder: first the bailouts (`Aos`, one `unsafe: {b}` reason each), then `numeric == 0`, then `loops == 0`, each with an early `return`. Only then think about sizes.',
      'The size is `o.measured.or(c.estimate)`. Work out `let m = o.measured.is_some();` once: it decides both the word (“at most” only when `!m && c.upper`) and the “ (measured)” text.',
      'Refuse only when there is a size and it is small: `if let Some(s) = size.filter(|&s| s < o.min_size) { ... }`. A `None` falls through to `Soa` with `"size unknown"`. With `{}`, Rust prints `25.0_f64` as `25`, as JavaScript would.',
    ],
    walkthrough: `**How to think about it.** This is the bottom of \`plan_one\` in \`engine/rust/crates/core/src/plan.rs\`, with the annotation, opt-in and Python rungs left out and the messages shortened. Before writing code, sort out the four kinds of size, because the tests check each one: a measured size (use it, say "about", add " (measured)"); an estimate that is exact (use it, say "about"); an estimate that is a maximum (use it, say "at most"); and no size at all (never refuse). Then remember that the rungs above the size come first: a collection with bailouts, no numeric field or no loop is refused for that, whatever its size.

**The solution, line by line.**

- \`use Layout::*;\` lets the body write \`Aos\` and \`Soa\` without \`Layout::\` in front.
- \`if !c.bailouts.is_empty() { ... return (Aos, r.collect()); }\`: \`c.bailouts.iter().map(|b| format!("unsafe: {b}"))\` makes one reason per bailout, and \`collect\` builds the \`Vec<String>\`.
- \`if c.numeric == 0 { ... }\` and \`if c.loops == 0 { ... }\` are the two cost rungs above the size, each returning \`(Aos, vec![r.into()])\`, a one-element vector.
- \`let m = o.measured.is_some();\` remembers whether a profile measured this collection.
- \`let size = o.measured.or(est);\` takes the measurement if there is one, otherwise the estimate.
- \`let word = if !m && c.upper { "at most" } else { "about" };\`: only an unmeasured maximum says "at most".
- \`let small = size.filter(|&s| s < min);\`: \`filter\` keeps \`Some(s)\` only when the test holds, so \`small\` is \`Some\` exactly when there is a size and it is below the threshold (a \`None\` stays \`None\`).
- \`if let Some(s) = small { ... return (Aos, vec![r]); }\` builds \`"{word} {s} elements{t}: below {min}"\`, where \`t\` is " (measured)" or nothing; the note goes right after "elements", as in the reference. (The \`\\\` at the end of a line inside the string continues it on the next line without a line break.)
- \`let Some(s) = size else { ... return (Soa, ...) };\`: a \`let ... else\` that handles the unknown size, which passes with the reason "size unknown".
- \`(Soa, vec![r + t])\` is the end: \`r\` is \`"{word} {s} elements"\`, and \`+ t\` adds " (measured by profiling)" when the size was measured (\`String + &str\` gives a \`String\`).

**Common wrong attempts.**

- Testing the size before the numeric and loop rungs: a two-element collection with no numeric field is refused for its size, not for the reason that matters, and \`numeric_before_size\` fails.
- \`est.or(o.measured)\`: it prefers the guess, so an estimate of 100 hides a measured 25.
- \`"{word} {s}{t} elements: ..."\`: this was the port's real wording until it was fixed, "about 25 (measured) elements"; the reference says "about 25 elements (measured)", and \`a_measurement_wins_with_the_reference_wording\` is the kind of test the fixtures once lacked.
- Treating an unknown size as \`Some(0.0)\`: every collection the analysis can't count is then refused, including large ones built inside a function.`,
    wrong: [
      {
        code: `#[derive(Debug, PartialEq)]
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
    if c.numeric == 0 {
        let r = "no numeric field";
        return (Aos, vec![r.into()]);
    }
    if c.loops == 0 {
        let r = "no loop";
        return (Aos, vec![r.into()]);
    }
    let Some(s) = size else {
        let r = "size unknown";
        return (Soa, vec![r.into()]);
    };
    let t = if m { P } else { "" };
    let r =
        format!("{word} {s} elements");
    (Soa, vec![r + t])
}`,
        why: 'It checks the size before the field and loop rules. A two-element collection with no numeric field is then refused for its size, not for the reason that matters.',
      },
      {
        code: `#[derive(Debug, PartialEq)]
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
    let size = est.or(o.measured);
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
}`,
        why: '`est.or(o.measured)` prefers the guess. With an estimate of 100 and a measured 25, it says “at most 100” and transforms a 25-element collection.',
      },
      {
        code: `#[derive(Debug, PartialEq)]
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
            "{word} {s}{t} elements: \\
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
}`,
        why: 'This was the port’s wording until it was fixed: “about 25 (measured) elements”. The reference says “about 25 elements (measured)”, so the engines’ explain texts differed.',
      },
      {
        code: `#[derive(Debug, PartialEq)]
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
    let size = o.measured.or(est)
        .or(Some(0.0));
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
}`,
        why: 'Treating an unknown size as 0 refuses every collection the analysis can’t count, including large ones built by a function or a `while` loop.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A collection has a bailout *and* a `// @viscosity soa` annotation. What does `plan_one` do?',
    options: [
      {
        t: 'Transforms it: the annotation is the programmer overruling the analysis',
        why: 'Annotations overrule the cost model, never safety.',
      },
      {
        t: 'Keeps it, with one `unsafe: …` reason per bailout',
        correct: true,
        why: 'The bailout test is the first rung, before the annotation is even looked at.',
      },
      {
        t: 'Fails to compile the program',
        why: 'Refusing is never an error; it is a reason in explain.',
      },
    ],
  },
  {
    q: 'A safe, numeric collection with a hot loop is annotated `// @viscosity soa`, and you compile with `--min-size 1000`. It holds about 100 elements. What happens?',
    options: [
      {
        t: 'Kept: 100 is below the threshold',
        why: 'The annotation returns before the size rung is reached.',
      },
      {
        t: 'A usage error: annotations and `--min-size` can’t be combined',
        why: 'They combine fine; the annotation simply wins.',
      },
      {
        t: 'Transformed, with the reason `annotated @viscosity soa at line 1` first',
        correct: true,
        why: 'An annotation skips the cost rungs; that is the point of writing one.',
      },
    ],
  },
  {
    q: 'Which line is the Rust shape of the reference’s `out.push(keep(...)); continue;`?',
    options: [
      {
        t: '`return keep(...);` inside `plan_one`',
        correct: true,
        why: 'The loop body became a function, so ending one collection’s turn is a return.',
      },
      {
        t: '`break keep(...);`',
        why: '`break` would leave the loop over all collections, not just this one.',
      },
      {
        t: '`out.push(keep(...)); continue;`, unchanged',
        why: 'That works in Rust too, but the port moved the body into `plan_one` and returns instead.',
      },
    ],
  },
  {
    q: 'A collection’s fields are all strings, it has a hot loop, and there are no bailouts. Which reason does explain give?',
    options: [
      {
        t: '“no loop reads or writes its fields, so a new layout cannot pay off”',
        why: 'There is a loop; the numeric rung comes first and refuses.',
      },
      {
        t: '“opt-in mode: not annotated”',
        why: 'Only in `--mode opt-in`.',
      },
      {
        t: '“unsafe: …”',
        why: 'There are no bailouts.',
      },
      {
        t: '“no field is provably numeric, so there are no typed columns to gain”',
        correct: true,
        why: 'Every column would be a plain array, so there is nothing to gain.',
      },
    ],
  },
  {
    q: 'Why does a Rust `CollectionPlan` hold `c.clone()` rather than a reference to the analysis’s collection?',
    options: [
      {
        t: 'Because closures can’t capture references',
        why: 'They can: `keep` borrows `c` to clone it.',
      },
      {
        t: 'So the plan can live on its own, without a lifetime tying it to the `Analysis`',
        correct: true,
        why: 'A borrowing plan would need a lifetime parameter; a copy avoids it, at the cost of one copy per collection.',
      },
      {
        t: 'Because the planner changes the collection',
        why: 'It doesn’t; it only reads it.',
      },
    ],
  },
  {
    q: 'A collection’s size is unknown statically, and there is no profile. Which is true?',
    options: [
      {
        t: 'The size rung keeps it, to be safe',
        why: 'Refusing isn’t what “safe” means here: the change is already proven safe.',
      },
      {
        t: 'The planner runs the program to find out',
        why: 'Only `viscosity profile` runs the program, and only when you ask.',
      },
      {
        t: 'The size rung doesn’t fire, and explain lists “size unknown statically” among the reasons',
        correct: true,
        why: '`if let Some(size) = size` doesn’t match `None`.',
      },
    ],
  },
  {
    q: 'The estimate is “at most 100”, a profile measured 25, and `min_size` is 64. What is the outcome?',
    options: [
      {
        t: 'Kept: 25 < 64, worded “about”, not “at most”',
        correct: true,
        why: 'The measurement wins, and the upper-bound flag is about the estimate, which wasn’t used.',
      },
      {
        t: 'SoA, because 100 ≥ 64',
        why: 'The measurement wins: `measured.or(estimate)`.',
      },
      {
        t: 'SoA, because profiles only raise sizes',
        why: 'A profile replaces the size, in either direction.',
      },
    ],
  },
  {
    q: 'The estimate is “at most 40” with the default threshold of 64. Why is refusing it safe?',
    options: [
      {
        t: 'It isn’t: the collection might be larger',
        why: '“At most” is a real bound: the program can never hold more than 40.',
      },
      {
        t: 'Because the real size can only be smaller than the maximum, so it is below 64 too',
        correct: true,
        why: 'Only the low side of a maximum is uncertain.',
      },
      {
        t: 'Because maximums are always refused',
        why: 'A maximum above the threshold passes, as “at most 100” does.',
      },
    ],
  },
  {
    q: 'What does `--min-size abc` do today?',
    options: [
      {
        t: 'It becomes `NaN`, so no collection is refused for its size',
        why: 'That is what both CLIs once did, parsing it like `Number("abc")`; now they check first.',
      },
      {
        t: 'The CLI rejects it as a usage error: “--min-size must be a non-negative number”',
        correct: true,
        why: 'Both CLIs check it now, because a `NaN` threshold would make `size < min_size` never true.',
      },
      {
        t: 'It falls back to 64',
        why: 'There is no fallback.',
      },
    ],
  },
  {
    q: 'The Rust and TypeScript engines once worded the measured threshold message differently. Why did 186/186 fixtures still pass?',
    options: [
      {
        t: 'The parity test ignores explain text',
        why: 'It compares explain byte for byte.',
      },
      {
        t: 'The difference was only in whitespace',
        why: 'Words were in a different order.',
      },
      {
        t: 'The fixtures were generated by the Rust engine',
        why: 'They are generated by the TypeScript reference.',
      },
      {
        t: 'The fixtures never used `--profile`, so that message never appeared in them',
        correct: true,
        why: 'Parity was checked for default options and `--bounds assume` only; profile fixtures came with the fix.',
      },
    ],
  },
];
