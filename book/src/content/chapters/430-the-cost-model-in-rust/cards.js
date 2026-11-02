// Chapter 430 cards. Keys are stable ids: never rename them.

// Shared by the exercise: a cut-down Collection, Mode and Plan.
const SCAF = `#[derive(Debug, PartialEq)]
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
`;

const head = `fn plan_one(
    c: &Coll,
    mode: &Mode,
) -> Plan {`;

const SOL = `${SCAF}
${head}
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
}`;

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
};

export const exercises = {
  planTop: {
    lang: 'rust',
    title: 'The top of the ladder',
    prompt:
      'Write `plan_one`, a cut-down version of the real one, with early returns in this order. **Bailouts:** `Aos`, with one reason `unsafe: {b}` per bailout, in order. **Opt-in mode:** `Aos`, with the one reason `OPT_IN`. **No numeric field** (`numeric == 0`): `Aos`, `NO_NUM`. **No loop of depth 1 or more** (a depth of 0 means “outside every loop”): `Aos`, `NO_LOOP`. Otherwise `Soa`, with no reasons. (Annotations and the size rung are left out.)',
    starter: `${SCAF}
${head}
    todo!()
}`,
    solution: SOL,
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
        code: `${SCAF}
${head}
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
        code: `${SCAF}
${head}
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
        code: `${SCAF}
${head}
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
};

export const quiz = [
  {
    q: 'A collection has a bailout *and* a `// @viscosity soa` annotation. What does `plan_one` do?',
    options: [
      { t: 'Transforms it: the annotation is the programmer overruling the analysis', why: 'Annotations overrule the cost model, never safety.' },
      { t: 'Keeps it, with one `unsafe: …` reason per bailout', correct: true, why: 'The bailout test is the first rung, before the annotation is even looked at.' },
      { t: 'Fails to compile the program', why: 'Refusing is never an error; it is a reason in explain.' },
    ],
  },
  {
    q: 'A safe, numeric collection with a hot loop is annotated `// @viscosity soa`, and you compile with `--min-size 1000`. It holds about 100 elements. What happens?',
    options: [
      { t: 'Kept: 100 is below the threshold', why: 'The annotation returns before the size rung is reached.' },
      { t: 'A usage error: annotations and `--min-size` can’t be combined', why: 'They combine fine; the annotation simply wins.' },
      { t: 'Transformed, with the reason `annotated @viscosity soa at line 1` first', correct: true, why: 'An annotation skips the cost rungs; that is the point of writing one.' },
    ],
  },
  {
    q: 'Which line is the Rust shape of the reference’s `out.push(keep(...)); continue;`?',
    options: [
      { t: '`return keep(...);` inside `plan_one`', correct: true, why: 'The loop body became a function, so ending one collection’s turn is a return.' },
      { t: '`break keep(...);`', why: '`break` would leave the loop over all collections, not just this one.' },
      { t: '`out.push(keep(...)); continue;`, unchanged', why: 'That works in Rust too, but the port moved the body into `plan_one` and returns instead.' },
    ],
  },
  {
    q: 'A collection’s fields are all strings, it has a hot loop, and there are no bailouts. Which reason does explain give?',
    options: [
      { t: '“no loop reads or writes its fields, so a new layout cannot pay off”', why: 'There is a loop; the numeric rung comes first and refuses.' },
      { t: '“opt-in mode: not annotated”', why: 'Only in `--mode opt-in`.' },
      { t: '“unsafe: …”', why: 'There are no bailouts.' },
      { t: '“no field is provably numeric, so there are no typed columns to gain”', correct: true, why: 'Every column would be a plain array, so there is nothing to gain.' },
    ],
  },
  {
    q: 'Why does a Rust `CollectionPlan` hold `c.clone()` rather than a reference to the analysis’s collection?',
    options: [
      { t: 'Because closures can’t capture references', why: 'They can: `keep` borrows `c` to clone it.' },
      { t: 'So the plan can live on its own, without a lifetime tying it to the `Analysis`', correct: true, why: 'A borrowing plan would need a lifetime parameter; a copy avoids it, at the cost of one copy per collection.' },
      { t: 'Because the planner changes the collection', why: 'It doesn’t; it only reads it.' },
    ],
  },
];
