// Chapter 458 cards. Keys are stable ids: never rename them.

const PRE = `// A collection as the analyses saw it
// (simplified from core::Collection).
struct Loop {
    line: u32,
    func: &'static str,
    // the fields it reads or writes
    touches: Vec<&'static str>,
}

struct Coll {
    fields: Vec<&'static str>,
    numeric: bool, // every field
    loops: Vec<Loop>,
    size: f64,
    bailouts: Vec<&'static str>,
}

#[derive(Debug, PartialEq)]
enum Layout {
    Aos,
    Soa,
}

const NO_NUM: &str = "no field is \\
    provably numeric, so there are no \\
    typed columns to gain";
const NO_LOOP: &str = "no loop reads \\
    or writes its fields, so a new \\
    layout cannot pay off";
`;

export const prompts = {
  'm-three-drips': {
    q: 'What are the three implementations of Drip in this book?',
    a: 'A tree-walking interpreter in TypeScript (Part III), a bytecode VM in TypeScript (Part IV), and drip-rs, the same VM design in Rust (Part XII).',
  },
  'm-checks': {
    q: 'How is each Rust implementation checked against the TypeScript one?',
    a: 'drip-rs runs the shared Drip corpus; the Rust engine must reproduce every stored TypeScript output byte for byte, and the fuzzer compares the two on generated programs.',
  },
  'm-stages': {
    q: 'Name the stages one program passes through in the Rust engine, in order.',
    a: 'Parse (oxc), lower to VIR in SSA form, analyze (collections, shapes, escapes, access patterns, sizes and bounds), plan (the cost model), emit, explain.',
  },
  'm-qs': {
    q: 'In the chapter’s program, why is `qs` kept as an array of objects?',
    a: '`qs[0]` is passed to `console.log`, a method call, so an element escapes and the analysis records a bailout: “unsafe: line 14: an element is passed to a method call”.',
  },
  'm-try': {
    q: 'In the chapter’s program, the first loop runs to 10 instead of 1000. What happens to `ps`?',
    a: 'It is kept as objects: “about 10 elements: below the 64-element threshold, where the benefit is too small”.',
  },
  'm-open': {
    q: 'Name three things about Viscosity that are unfinished or open.',
    a: 'Any three of: no changelog yet; the port rejects TypeScript input; syntax errors worded by oxc, not acorn; the cost model is engine-blind (heat on JSC); many programs refused; no WebAssembly output.',
  },
  'm-chore': {
    q: 'Which is research, and which a chore: running the wasm smoke test in CI, or knowing how much a layout will gain on an engine?',
    a: 'The smoke test in CI is a chore. Predicting the gain needs a model of engines the compiler never sees: research.',
  },
  'm-mastery': {
    q: 'What does mastery mean in this book?',
    a: 'Being able to build the thing again yourself, from an empty folder, knowing why each piece is there and how you would check it works.',
  },
};

export const exercises = {
  plan: {
    lang: 'rust',
    title: 'The planner, from memory',
    prompt:
      'Write `plan`, a simplified `plan_one` from `engine/rust/crates/core/src/plan.rs`. Ask its questions in its order, and stop at the first that refuses. Any bailouts: `Aos`, with one reason per bailout, `unsafe: <bailout>`. Not numeric: `Aos`, `NO_NUM`. No loops: `Aos`, `NO_LOOP`. Size below `min`: `Aos`, `about <size> elements: below the <min>-element threshold, where the benefit is too small`. Otherwise `Soa`, with one reason per loop, `loop at line <line> in <func>() touches <k> of <n> fields (<names>)`, then `typed Float64Array columns for all <n> fields`, then `about <size> elements`.',
    starter: `${PRE}
fn plan(
    c: &Coll,
    min: f64,
) -> (Layout, Vec<String>) {
    todo!()
}`,
    solution: `${PRE}
fn plan(
    c: &Coll,
    min: f64,
) -> (Layout, Vec<String>) {
    use Layout::*;
    if !c.bailouts.is_empty() {
        let r = c.bailouts.iter();
        let r = r.map(|b| {
            format!("unsafe: {b}")
        });
        return (Aos, r.collect());
    }
    if !c.numeric {
        let r = vec![NO_NUM.into()];
        return (Aos, r);
    }
    if c.loops.is_empty() {
        let r = vec![NO_LOOP.into()];
        return (Aos, r);
    }
    let n = c.fields.len();
    if c.size < min {
        let r = format!(
            "about {} elements: below \\
             the {min}-element \\
             threshold, where the \\
             benefit is too small",
            c.size
        );
        return (Aos, vec![r]);
    }
    let mut r = Vec::new();
    for l in &c.loops {
        r.push(format!(
            "loop at line {} in {}() \\
             touches {} of {n} \\
             fields ({})",
            l.line,
            l.func,
            l.touches.len(),
            l.touches.join(", ")
        ));
    }
    r.push(format!(
        "typed Float64Array columns \\
         for all {n} fields"
    ));
    r.push(format!(
        "about {} elements",
        c.size
    ));
    (Soa, r)
}`,
    tests: `fn ps() -> Coll {
    Coll {
        fields: vec!["x", "vx", "hp"],
        numeric: true,
        loops: vec![
            Loop {
                line: 6,
                func: "<module>",
                touches: vec!["x", "vx"],
            },
            Loop {
                line: 13,
                func: "<module>",
                touches: vec!["x"],
            },
        ],
        size: 1000.0,
        bailouts: vec![],
    }
}

#[test]
fn the_chapters_ps_becomes_soa() {
    let (l, r) = plan(&ps(), 64.0);
    assert_eq!(l, Layout::Soa);
    assert_eq!(r, [
        "loop at line 6 in <module>() \\
         touches 2 of 3 fields (x, vx)",
        "loop at line 13 in <module>() \\
         touches 1 of 3 fields (x)",
        "typed Float64Array columns for \\
         all 3 fields",
        "about 1000 elements",
    ]);
}

#[test]
fn every_bailout_is_a_reason() {
    let mut c = ps();
    c.bailouts = vec!["line 14: a", "b"];
    let (l, r) = plan(&c, 64.0);
    assert_eq!(l, Layout::Aos);
    assert_eq!(r, [
        "unsafe: line 14: a",
        "unsafe: b",
    ]);
}

#[test]
fn bailouts_come_before_size() {
    let mut c = ps();
    c.size = 3.0;
    c.bailouts = vec!["x"];
    let (_, r) = plan(&c, 64.0);
    assert_eq!(r, ["unsafe: x"]);
}

#[test]
fn small_collections_stay() {
    let mut c = ps();
    c.size = 10.0;
    let (l, r) = plan(&c, 64.0);
    assert_eq!(l, Layout::Aos);
    assert_eq!(r, [
        "about 10 elements: below the \\
         64-element threshold, where \\
         the benefit is too small",
    ]);
}

#[test]
fn no_numbers_or_no_loops_stay() {
    let mut c = ps();
    c.numeric = false;
    assert_eq!(plan(&c, 64.0).1, [NO_NUM]);
    let mut c = ps();
    c.loops.clear();
    assert_eq!(plan(&c, 64.0).1, [NO_LOOP]);
}
`,
    hints: [
      'Four early returns, in this order: bailouts, numeric, loops, size. Each returns `(Layout::Aos, reasons)`.',
      'For the bailouts, `c.bailouts.iter().map(|b| format!("unsafe: {b}")).collect()` builds the whole list.',
      'A `f64` prints without a fraction when it is whole (`1000.0` prints as `1000`), so `format!("about {} elements", c.size)` matches the real text. Use `l.touches.join(", ")` for the field names.',
    ],
    walkthrough: `**How to think about it.** This is the decision at the centre of *The cost model in Rust*, \`plan_one\` in \`engine/rust/crates/core/src/plan.rs\`, cut down to the cases this chapter's program meets (the real one also handles annotations, opt-in mode, Python, AoSoA block sizes, measured profile sizes and plain columns). Before writing it, say the questions out loud in order, and for each one ask "if the answer is no, can anything later change the verdict?". Safety first: an unsafe collection is never transformed, however big, so bailouts come before everything (the test \`bailouts_come_before_size\` holds you to that). Then the two questions that make the gain zero: no numeric fields means no typed columns to gain, and no loops means nothing to speed up. Only then the cost question, the size. Each "no" is an early \`return\` with \`Layout::Aos\` and its reason; if every question passes, the answer is \`Soa\` with one reason per fact.

**The solution, line by line.**

- \`fn plan(c: &Coll, min: f64) -> (Layout, Vec<String>) {\` borrows the collection's facts and returns the layout with its reasons, in the order \`explain\` prints them.
- \`use Layout::*;\` lets the body write \`Aos\` and \`Soa\`.
- \`if !c.bailouts.is_empty() {\` is the safety rung. \`c.bailouts.iter().map(|b| format!("unsafe: {b}"))\` turns every bailout into a reason, and \`return (Aos, r.collect());\` gathers them into a \`Vec<String>\` and stops. Every bailout is listed, not only the first, so a user who fixes one sees the next.
- \`if !c.numeric { return (Aos, vec![NO_NUM.into()]); }\` and \`if c.loops.is_empty() { return (Aos, vec![NO_LOOP.into()]); }\` are the zero-gain rungs; \`.into()\` turns the \`&str\` constants into \`String\`s.
- \`let n = c.fields.len();\` keeps the number of fields for the messages below.
- \`if c.size < min {\` is the cost rung. The \`format!\` builds "about 10 elements: below the 64-element threshold, where the benefit is too small"; the backslashes at the ends of the lines continue the string literal without adding spaces or newlines.
- \`let mut r = Vec::new();\` starts the list of reasons for a transformed collection.
- \`for l in &c.loops { r.push(format!(...)); }\` adds one "loop at line 6 in <module>() touches 2 of 3 fields (x, vx)" per loop, with \`l.touches.len()\` for the count and \`l.touches.join(", ")\` for the names.
- \`r.push(format!("typed Float64Array columns for all {n} fields"));\` and \`r.push(format!("about {} elements", c.size));\` add the last two facts. An \`f64\` that holds a whole number prints without a fraction in Rust, so \`1000.0\` prints as \`1000\`, exactly as JavaScript would print it.
- \`(Soa, r)\` is the verdict.

The exact words matter because \`explain\` is part of Viscosity's public face, and the Rust engine's text must match the TypeScript engine's byte for byte; rebuilding the planner means rebuilding its sentences too.

**Common wrong attempts.**

- Checking the size first. A small collection with a bailout would then be reported as "below the threshold", hiding the real reason, which is that it is unsafe.
- Returning only the first bailout. It looks tidier, but the user then fixes one problem, runs again and meets the next; the real planner reports them all.
- Writing the reasons from memory with small differences ("fields" against "field", a missing "in"). The tests compare whole strings, as the parity fixtures do.`,
    wrong: [
      {
        code: `${PRE}
fn plan(
    c: &Coll,
    min: f64,
) -> (Layout, Vec<String>) {
    use Layout::*;
    if !c.numeric {
        let r = vec![NO_NUM.into()];
        return (Aos, r);
    }
    if c.loops.is_empty() {
        let r = vec![NO_LOOP.into()];
        return (Aos, r);
    }
    let n = c.fields.len();
    if c.size < min {
        let r = format!(
            "about {} elements: below \\
             the {min}-element \\
             threshold, where the \\
             benefit is too small",
            c.size
        );
        return (Aos, vec![r]);
    }
    if !c.bailouts.is_empty() {
        let r = c.bailouts.iter();
        let r = r.map(|b| {
            format!("unsafe: {b}")
        });
        return (Aos, r.collect());
    }
    let mut r = Vec::new();
    for l in &c.loops {
        r.push(format!(
            "loop at line {} in {}() \\
             touches {} of {n} \\
             fields ({})",
            l.line,
            l.func,
            l.touches.len(),
            l.touches.join(", ")
        ));
    }
    r.push(format!(
        "typed Float64Array columns \\
         for all {n} fields"
    ));
    r.push(format!(
        "about {} elements",
        c.size
    ));
    (Soa, r)
}`,
        why: 'This checks the size before the bailouts, so an unsafe collection that is also small is reported as small. Safety must be the first question.',
      },
      {
        code: `${PRE}
fn plan(
    c: &Coll,
    min: f64,
) -> (Layout, Vec<String>) {
    use Layout::*;
    if !c.bailouts.is_empty() {
        let r = c.bailouts.iter();
        let r = r.map(|b| {
            format!("unsafe: {b}")
        });
        return (Aos, r.collect());
    }
    if !c.numeric {
        let r = vec![NO_NUM.into()];
        return (Aos, r);
    }
    if c.loops.is_empty() {
        let r = vec![NO_LOOP.into()];
        return (Aos, r);
    }
    let n = c.fields.len();
    if c.size < min {
        let r = format!(
            "about {} elements: below \\
             the {min}-element \\
             threshold, where the \\
             benefit is too small",
            c.size
        );
        return (Aos, vec![r]);
    }
    let mut r = Vec::new();
    for l in &c.loops {
        r.push(format!(
            "loop at line {} in {}() \\
             touches {} of {n} \\
             fields ({})",
            l.line,
            l.func,
            n,
            l.touches.join(", ")
        ));
    }
    r.push(format!(
        "typed Float64Array columns \\
         for all {n} fields"
    ));
    r.push(format!(
        "about {} elements",
        c.size
    ));
    (Soa, r)
}`,
        why: 'Each loop reports the number of fields it touches, not the record’s total: “touches 2 of 3 fields”, not “3 of 3”.',
      },
      {
        code: `${PRE}
fn plan(
    c: &Coll,
    min: f64,
) -> (Layout, Vec<String>) {
    use Layout::*;
    if !c.bailouts.is_empty() {
        let b = c.bailouts[0];
        let r = format!("unsafe: {b}");
        return (Aos, vec![r]);
    }
    if !c.numeric {
        let r = vec![NO_NUM.into()];
        return (Aos, r);
    }
    if c.loops.is_empty() {
        let r = vec![NO_LOOP.into()];
        return (Aos, r);
    }
    let n = c.fields.len();
    if c.size < min {
        let r = format!(
            "about {} elements: below \\
             the {min}-element \\
             threshold, where the \\
             benefit is too small",
            c.size
        );
        return (Aos, vec![r]);
    }
    let mut r = Vec::new();
    for l in &c.loops {
        r.push(format!(
            "loop at line {} in {}() \\
             touches {} of {n} \\
             fields ({})",
            l.line,
            l.func,
            l.touches.len(),
            l.touches.join(", ")
        ));
    }
    r.push(format!(
        "typed Float64Array columns \\
         for all {n} fields"
    ));
    r.push(format!(
        "about {} elements",
        c.size
    ));
    (Soa, r)
}`,
        why: 'Only the first bailout is reported. The real planner gives one reason per bailout.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In the chapter’s program, which stage first notices that `qs` can’t be transformed?',
    options: [
      { t: 'The parser', why: 'oxc parses `console.log(s, qs[0])` without complaint. It is valid JavaScript.' },
      { t: 'The escape analysis, working on VIR', correct: true, why: 'It sees an element of `qs` passed to a method call and records a bailout; the planner turns that into “unsafe: …”.' },
      { t: 'The emitter', why: 'The emitter only follows the plan. By then `qs` is already marked to stay as objects.' },
      { t: 'The cost model, because 100 elements is too few', why: '100 is above the 64-element threshold, and the bailout is checked first anyway.' },
    ],
  },
  {
    q: 'What does the TypeScript CLI print for `explain --frames` on the chapter’s program?',
    options: [
      { t: 'The same bytes as the Rust CLI', correct: true, why: 'That is the parity guarantee, frames included.' },
      { t: 'The same decisions in different words', why: 'The words are the same too: the explain text is compared byte for byte.' },
      { t: 'Nothing: frames are a Rust-only feature', why: 'Both CLIs have `--frames`, and the parity tests hold `--frames` fixtures that check they agree.' },
    ],
  },
  {
    q: 'Which of these is still open?',
    options: [
      { t: 'The Rust engine can’t compile Python', why: 'It can: the Python plugin was ported (*The Python plugin in Rust*).' },
      { t: 'The Rust engine can’t run in a browser', why: 'It runs in this page’s Playground, as WebAssembly.' },
      { t: 'The cost model can’t tell how much a layout will gain on a given engine', correct: true, why: 'Heat gained a lot on V8 and nothing on JSC with the same code, and the cause is still a hypothesis.' },
      { t: 'The two engines sometimes disagree on decisions', why: 'Every stored fixture matches byte for byte, and the fuzzer checks thousands more programs.' },
    ],
  },
  {
    q: 'Until 2026-11-02, nothing was published. Why does the book treat that as a decision rather than a bug?',
    options: [
      { t: 'Because publishing is permanent and claims names, so it is the author’s call', correct: true, why: 'A published version can never be reused or deleted, on crates.io or npm.' },
      { t: 'Because the packages don’t build', why: 'Everything built: both npm packages packed and every crate packaged. All of them are published now.' },
      { t: 'Because npm doesn’t accept WebAssembly', why: 'npm accepts any files; `@viscosity/wasm` is on npm now.' },
    ],
  },
  {
    q: 'What does the WebAssembly in this book do?',
    options: [
      { t: 'It is the output of Viscosity: compiled programs run as WebAssembly', why: 'Every version of Viscosity emits JavaScript or Python. There is no WebAssembly back end.' },
      { t: 'It is the Rust engine, compiled to WebAssembly, running the compiler in the page', correct: true, why: 'The Playground’s Rust engine is `crates/wasm`, built by `packages/wasm/build.mjs`.' },
      { t: 'It runs drip-rs', why: 'drip-rs is a native program; the book’s Drip examples run the TypeScript implementations.' },
    ],
  },
  {
    q: 'By this book’s definition, which shows mastery of Viscosity best?',
    options: [
      { t: 'Remembering every line of `plan.rs`', why: 'Lines can be looked up. Mastery is about why they are there.' },
      { t: 'Having read every chapter', why: 'Reading is the start. The test is building.' },
      { t: 'Rebuilding a stage from an empty file, and knowing which test would show it is right', correct: true, why: 'That is “being able to build it again yourself”: the pieces, their reasons, and how to check them.' },
    ],
  },
];
