// Chapter 436 cards. Keys are stable ids: never rename them.

// Shared by the exercise: a cut-down CollectionPlan.
const SCAF = `enum Layout {
    Aos,
    Soa,
    Aosoa(u64),
}

struct Plan {
    name: String,
    line: u32,
    fields: Vec<String>,
    layout: Layout,
    reasons: Vec<String>,
}
`;

const VERDICT = `fn verdict(l: &Layout) -> String {
    match l {
        Layout::Aos => String::from(
            "kept as array of objects",
        ),
        Layout::Soa => String::from(
            "struct of arrays",
        ),
        Layout::Aosoa(b) => format!(
            "AoSoA, blocks of {b}"
        ),
    }
}`;

const SOL = `${SCAF}
${VERDICT}

fn header(p: &Plan) -> String {
    let v = verdict(&p.layout);
    let fs = p.fields.join(", ");
    format!(
        "{} (line {}) {{{fs}}} → {v}",
        p.name, p.line
    )
}

fn report(ps: &[Plan]) -> String {
    let mut lines = Vec::new();
    for p in ps {
        lines.push(header(p));
        for r in &p.reasons {
            let l = format!("  · {r}");
            lines.push(l);
        }
    }
    lines.join("\\n")
}`;

export const prompts = {
  'rx-one-fn': {
    q: 'How do `explain` and `explain_with_frames` in `plan.rs` share their code?',
    a: 'Both call `explain_text(p, frames)`. `None` gives the plain report; `Some(source)` adds frames.',
  },
  'rx-two-fns': {
    q: 'The reference has one `explain(p, { frames })`. Why does the port have two public functions instead?',
    a: 'So a caller who wants the plain report can’t pass a source by accident; each name says what it does, and `compile` calls `explain(&p)`.',
  },
  'rx-braces': {
    q: 'What does `format!("{{{}}}", "x, y")` produce, and why?',
    a: '`{x, y}`: in a format string `{{` and `}}` are a literal brace, and `{}` in between is the argument.',
  },
  'rx-refused': {
    q: 'Why does `explain_text` check that a collection has as many reasons as bailouts?',
    a: 'Then reason `k` is bailout `k`, so its message finds its site. Other reasons (annotations, size) get no frame.',
  },
  'rx-first-site': {
    q: 'A collection bails out with the same message at two places. Which one does `--frames` show?',
    a: 'The first: `bail` uses `entry(msg).or_insert(at)`, which only writes a new key.',
  },
  'rx-dedupe': {
    q: 'How does the analysis remove repeated bailout messages, and which copy does it keep?',
    a: 'It drains the vector into an `IndexSet` and back, which keeps the first of each message, in first-seen order.',
  },
  'rx-string-index': {
    q: 'In `string_index.js` the reason says line 6 but the frame shows line 4. Why?',
    a: 'The site is the index value’s instruction. In SSA, `k` is the constant `\'5\'`, written on line 4.',
  },
  'rx-none-site': {
    q: 'Why is a bailout site an `Option<SourceRef>`?',
    a: 'Some bailouts have no single place in the source, such as “no records are ever added”; they are recorded with `None`.',
  },
};

export const exercises = {
  reportText: {
    lang: 'rust',
    title: 'The plain report',
    prompt:
      'Write `report(ps)`, the plain `explain` text. For each plan, in order, a header `{name} (line {line}) {fields} → {verdict}` (the fields joined with `", "` inside braces; the verdict is `kept as array of objects`, `struct of arrays` or `AoSoA, blocks of {b}`), then one line `  · {reason}` (two spaces, a middle dot, a space) per reason. Join all the lines with `\\n`, with no line break at the end. Helper functions are welcome.',
    starter: `${SCAF}
fn report(ps: &[Plan]) -> String {
    todo!()
}`,
    solution: SOL,
    tests: `fn plan(
    name: &str,
    fields: &[&str],
    layout: Layout,
    reasons: &[&str],
) -> Plan {
    Plan {
        name: name.to_string(),
        line: 1,
        fields: fields
            .iter()
            .map(|f| f.to_string())
            .collect(),
        layout,
        reasons: reasons
            .iter()
            .map(|r| r.to_string())
            .collect(),
    }
}

#[test]
fn a_transformed_collection() {
    let p = plan("ps", &["x", "vx"],
        Layout::Soa, &["about 100 elements"]);
    assert_eq!(report(&[p]),
        "ps (line 1) {x, vx} → struct of \\
         arrays\\n  · about 100 elements");
}

#[test]
fn one_line_per_reason() {
    let p = plan("ps", &["x"], Layout::Aos,
        &["unsafe: a", "unsafe: b"]);
    let r = report(&[p]);
    let lines: Vec<&str> = r.lines().collect();
    assert_eq!(lines, vec![
        "ps (line 1) {x} → kept as array of \\
         objects",
        "  · unsafe: a",
        "  · unsafe: b",
    ]);
}

#[test]
fn aosoa_shows_its_block_size() {
    let p = plan("qs", &["a"],
        Layout::Aosoa(4), &[]);
    assert_eq!(report(&[p]),
        "qs (line 1) {a} → AoSoA, blocks of 4");
}

#[test]
fn no_fields_gives_empty_braces() {
    let p = plan("keep", &[], Layout::Aos,
        &[]);
    assert!(report(&[p]).contains("{} →"));
}

#[test]
fn collections_follow_each_other() {
    let a = plan("a", &["x"], Layout::Soa,
        &["r"]);
    let b = plan("b", &["y"], Layout::Soa,
        &[]);
    let r = report(&[a, b]);
    assert_eq!(r.lines().count(), 3);
    assert!(!r.ends_with('\\n'));
    assert!(r.lines().nth(2).unwrap()
        .starts_with("b (line 1)"));
}
`,
    hints: [
      'Collect the lines in a `Vec<String>` and finish with `lines.join("\\n")`: `join` puts the separator only between lines, never after the last.',
      'A small `fn verdict(l: &Layout) -> String` with a `match` keeps `report` short. For `Aosoa(b)`, `format!("AoSoA, blocks of {b}")` uses the number inside the variant.',
      'In a format string a literal brace is written twice: `format!("{} (line {}) {{{fs}}} → {v}", p.name, p.line)`, where `fs` is `p.fields.join(", ")`. Then push `format!("  · {r}")` for each reason (in a `let` first, if the line gets long).',
    ],
    walkthrough: `**How to think about it.** This is \`explain_text\` from \`engine/rust/crates/core/src/plan.rs\` with \`frames\` always \`None\`, on a cut-down plan. Write the expected text for one collection by hand first: \`ps (line 1) {x, vx} → struct of arrays\`, then \`  · about 100 elements\` on the next line. Two details decide whether a test passes: the braces around the fields, which \`format!\` treats specially, and the line breaks, which go *between* lines and never after the last one. Building a vector of lines and joining it at the end gets the second detail right for free, which is why the real function is written that way.

**The solution, line by line.**

- \`fn verdict(l: &Layout) -> String { match l { ... } }\` turns the layout into its words: \`String::from("kept as array of objects")\` for \`Aos\`, \`String::from("struct of arrays")\` for \`Soa\`, and \`format!("AoSoA, blocks of {b}")\` for \`Aosoa(b)\`, where the pattern binds the block size inside the variant to \`b\`. (The real code prints it with \`js_number\`, because there it is a number that must look the way JavaScript prints it.)
- \`fn header(p: &Plan) -> String {\` builds the first line. \`let v = verdict(&p.layout);\` and \`let fs = p.fields.join(", ");\` prepare the pieces; \`join\` gives \`"x, vx"\`, or \`""\` for no fields.
- \`format!("{} (line {}) {{{fs}}} → {v}", p.name, p.line)\`: the two \`{}\` take \`p.name\` and \`p.line\`; \`{{\` and \`}}\` print a literal \`{\` and \`}\`, with \`{fs}\` between them; \`{v}\` names a variable directly.
- \`fn report(ps: &[Plan]) -> String {\` and \`let mut lines = Vec::new();\` start the list of lines.
- \`for p in ps { lines.push(header(p));\` adds each collection's header, in the plan's order.
- \`for r in &p.reasons { let l = format!("  · {r}"); lines.push(l); }\` adds one line per reason: two spaces, a middle dot, a space, the reason.
- \`lines.join("\\n")\` joins everything with line breaks between the lines, and none at the end.

**Common wrong attempts.**

- \`format!("{} (line {}) {fs} → {v}", ...)\` without doubled braces: it compiles, but prints \`ps (line 1) x, vx → ...\`, and every header test fails.
- Pushing \`"\\n"\` after every line into one \`String\`: the report ends with a line break, which \`collections_follow_each_other\` rejects; the CLI adds that last line break itself when it prints.
- Writing reasons as \`format!("· {r}")\`: the two leading spaces are part of the format that both engines share, and \`one_line_per_reason\` fails.`,
    wrong: [
      {
        code: SOL.replace('"{} (line {}) {{{fs}}} → {v}",', '"{} (line {}) {fs} → {v}",'),
        why: 'Without doubled braces the field list loses its `{` and `}`: `ps (line 1) x, vx → struct of arrays`.',
      },
      {
        code: SOL.replace(`    let mut lines = Vec::new();
    for p in ps {
        lines.push(header(p));
        for r in &p.reasons {
            let l = format!("  · {r}");
            lines.push(l);
        }
    }
    lines.join("\\n")`, `    let mut out = String::new();
    for p in ps {
        out += &header(p);
        out += "\\n";
        for r in &p.reasons {
            out += "  · ";
            out += r;
            out += "\\n";
        }
    }
    out`),
        why: 'Every line ends with a line break, so the report has one at the end; the real report joins its lines and leaves the last break to the CLI.',
      },
      {
        code: SOL.replace('let l = format!("  · {r}");', 'let l = format!("· {r}");'),
        why: 'Each reason line starts with two spaces before the middle dot; without them the text differs from both engines’ reports.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'You run `viscosity explain prog.js` without `--frames`. What does `explain_text` receive as `frames`?',
    options: [
      { t: '`Some("")`', why: 'An empty source would still be `Some`, and frames would be attempted.' },
      { t: '`None`, so no frame is ever built and the report is the plain one', correct: true, why: '`explain(p)` is `explain_text(p, None)`.' },
      { t: 'The source, but frames are filtered out afterwards', why: 'Nothing is filtered: the frame is never built.' },
    ],
  },
  {
    q: 'What header does a collection `ps` on line 3 with fields `x` and `vx`, planned as SoA, get?',
    options: [
      { t: '`ps (line 3) {x, vx} → struct of arrays`', correct: true, why: 'Name, line in brackets, fields in braces joined by “, ”, an arrow, the verdict.' },
      { t: '`ps (line 3) x, vx → struct of arrays`', why: 'The braces are part of the header; in the format string they are written `{{` and `}}`.' },
      { t: '`ps: struct of arrays (x, vx)`', why: 'Both engines use one fixed form, `name (line n) {fields} → verdict`.' },
    ],
  },
  {
    q: 'A collection bails out with the message “line 7: an element is used by push” at two different places. What is recorded?',
    options: [
      { t: 'Both sites, and two reasons', why: 'The messages are deduplicated, so there is one reason, with one site.' },
      { t: 'One reason, and the site of the first place it was found', correct: true, why: '`entry(msg).or_insert(at)` writes only a new key, and the `IndexSet` keeps the first copy of the message.' },
      { t: 'One reason, and the site of the last place it was found', why: '`or_insert` never overwrites an existing entry.' },
    ],
  },
  {
    q: 'Which reasons can get a code frame?',
    options: [
      { t: 'Every reason of every collection', why: '“typed Float64Array columns for all 8 fields” has no single place in the source.' },
      { t: 'Only reasons of transformed collections', why: 'The other way round: frames explain refusals.' },
      { t: 'Only the first reason', why: 'Each bailout reason gets its own frame.' },
      { t: 'The `unsafe: ...` reasons of a kept collection whose reasons are exactly its bailouts, when a site was recorded', correct: true, why: 'Then reason `k` is bailout `k`, and `bailout_sites` maps its message to an `Option<SourceRef>`.' },
    ],
  },
  {
    q: 'In `string_index.js`, why does the frame for “line 6: indexes the array with something that may not be a number” show line 4?',
    options: [
      { t: 'A bug in the line counter', why: 'Both engines agree, and the line is right for the instruction recorded.' },
      { t: 'The bailout is about the index value, which in SSA is the constant `\'5\'` written on line 4', correct: true, why: 'The site is the span of the instruction the bailout is about.' },
      { t: 'Frames always show the line of the collection’s declaration', why: 'The declaration is on line 2; the frame shows the site.' },
    ],
  },
];
