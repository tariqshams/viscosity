// Chapter 84 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 159, 159, 159, 159.

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
  'rx-zip': {
    q: 'What does `frames.zip(at)` give, and why is it used there?',
    a: '`Some((src, at))` only when both are `Some`: a frame needs a source to quote and a position for this reason.',
  },
  'rx-flatten': {
    q: 'Why does the frame code call `.copied().flatten()` on `bailout_sites.get(...)`?',
    a: '`get` gives `Option<&Option<SourceRef>>` (no entry, or an entry that is itself `None`); `copied().flatten()` makes it one `Option<SourceRef>`.',
  },
  'rx-tabs': {
    q: 'Why does the caret line keep the tabs that come before the code?',
    a: 'A tab is drawn at different widths by different editors. Copying it means the carets move exactly as far as the code does.',
  },
  'rx-clip': {
    q: 'An element is written across two lines. What does its frame show?',
    a: 'Only its first line, with carets from the start of the span to the end of that line’s text.',
  },
  'rx-line-start': {
    q: 'Why does `code_frame` add `char::len_utf8` of the line break, not just 1, to find where the line starts?',
    a: 'A line break can be U+2028 or U+2029, which are three bytes in UTF-8; adding 1 would land inside the character.',
  },
  'rx-bytes': {
    q: 'Rust spans are UTF-8 byte offsets and TypeScript spans UTF-16 offsets. How do the two frames still match?',
    a: 'Each engine slices in its own units but counts columns in code points (`chars()` in Rust, `Array.from` in TS).',
  },
  'rx-fixtures': {
    q: 'What checks that `--frames` output matches across the engines?',
    a: '14 `.frames.txt` fixtures written by `gen_expected.mjs` (checked by `parity.rs`), and the fuzzer on every program it generates.',
  },
  'rx-display': {
    q: 'What does a code frame still get wrong, in both engines?',
    a: 'A code point is not a screen column: after an emoji drawn two columns wide, the carets start too early.',
  },
  'dg-missing': {
    q: 'When this chapter was first written, what did `viscosity explain bad.js` (holding `const ps = [;`) leave out?',
    a: 'The position: it printed `SyntaxError: Unexpected token` with no line or column. It now prints `Unexpected token (1:12)`.',
  },
  'dg-why-place': {
    q: 'Why is “where” as important as “what” in a compiler message?',
    a: 'Without a place you have to search the file (or ten files) for the problem; with a span you go straight to the characters the compiler was reading.',
  },
  'dg-parts': {
    q: 'Which parts of a diagnostic does rustc’s guide list?',
    a: 'A level (error, warning), an optional code (such as E0308), a message that stands on its own, and a window with the file, line and column of the primary span, the code, and labels under the spans.',
  },
  'dg-span': {
    q: 'What is a span?',
    a: 'A stretch of the source, given by where it starts and where it ends; in oxc and Viscosity, as byte offsets.',
  },
  'dg-once': {
    q: 'When is a `SourceRef`’s line number worked out?',
    a: 'Once, during lowering (`Lowerer::src`), from oxc’s span start with `LineIndex`. It then rides along on the VIR instruction; no later pass changes it.',
  },
  'dg-same-line': {
    q: 'Why can the “line 6” in an `unsafe:` reason never disagree with the frame under it?',
    a: 'Both come from the same `SourceRef`: the line from its `line`, the frame from its `start` and `end`.',
  },
  'dg-forof': {
    q: 'Why does a refusal about the element of `for (const p of ps)` underline the whole line?',
    a: 'The element was made by the `for...of` statement, so its SourceRef is the span of the whole statement. The frame is only as precise as its span.',
  },
  'dg-tab': {
    q: 'Why does the caret line copy the tabs that come before the span?',
    a: 'A terminal may draw a tab as 2, 4 or 8 columns. A tab in the caret line moves exactly as far as the tab above it, so the carets stay under the code.',
  },
  'lc-units': {
    q: 'Name the three units a position in text can be counted in.',
    a: 'Bytes (UTF-8), characters (Unicode code points, Rust’s `char`) and UTF-16 units (what JavaScript strings count).',
  },
  'lc-who': {
    q: 'Which unit does each count: oxc’s spans, the code frames, acorn’s columns?',
    a: 'oxc’s spans count bytes; the code frames count characters; acorn’s columns count UTF-16 units.',
  },
  'lc-emoji': {
    q: 'How big is 🎉 in each unit?',
    a: '4 bytes in UTF-8, 1 character, and 2 UTF-16 units (a surrogate pair).',
  },
  'lc-crlf': {
    q: 'How many line breaks is `\\r\\n`, and how does `LineIndex::new` make sure of that?',
    a: 'One. A `\\r` starts a new line only when the next byte is not `\\n`; otherwise the `\\n` does.',
  },
  'lc-partition': {
    q: 'How does `LineIndex::line` find the line of a byte offset?',
    a: 'It binary-searches the sorted list of line starts (`partition_point`) for how many starts are at or before the offset; that count is the 1-based line.',
  },
  'lc-label': {
    q: 'Where does oxc keep the position of a syntax error?',
    a: 'In the diagnostic’s labels: each label is a span marking the bad code.',
  },
  'lc-display': {
    q: 'Why did `format!("SyntaxError: {e}")` drop the position?',
    a: '`OxcDiagnostic`’s `Display` prints only its message; the labels, which hold the span, are not printed.',
  },
  'lc-frames': {
    q: 'The code frames count characters but acorn counts UTF-16 units. Why does that not make the two disagree?',
    a: 'The frames never print a column: they draw a caret line, one space per character. Only the syntax error prints a column, and it uses UTF-16 units.',
  },
};

export const examples = {
  offsets: {
    lang: 'rust',
    title: 'Three ways to count the same column',
    code: `fn main() {
    let line = "naïve 🎉 ps[0]";
    let b = line.find("ps").unwrap();
    let before = &line[..b];
    let cps = before.chars().count();
    let u16s =
        before.encode_utf16().count();
    println!("UTF-8 bytes:  {b}");
    println!("UTF-16 units: {u16s}");
    println!("code points:  {cps}");
    // Can we cut at byte 3, inside ï?
    let ok = line.is_char_boundary(3);
    println!("cut at byte 3: {ok}");
}`,
  },
  'render-diag': {
    lang: 'rust',
    title: 'A diagnostic, laid out',
    code: `// A diagnostic: a level, a code, a
// message and a span (byte offsets),
// laid out the way rustc lays one out.
struct Diag {
    level: &'static str,
    code: &'static str,
    msg: &'static str,
    span: (usize, usize),
}

fn render(file: &str, src: &str,
          d: &Diag) -> String {
    let (s, e) = d.span;
    // where the span's line starts
    let ls = src[..s].rfind('\\n')
        .map_or(0, |i| i + 1);
    let le = src[s..].find('\\n')
        .map_or(src.len(), |i| s + i);
    let line = src[..s]
        .matches('\\n').count() + 1;
    let col = s - ls + 1;
    let pad = " ".repeat(s - ls);
    let hat = "^".repeat(e - s);
    format!(
        "{}[{}]: {}\\n --> {file}:\\
         {line}:{col}\\n{line} | {}\\n  \\
         | {pad}{hat}",
        d.level, d.code, d.msg,
        &src[ls..le],
    )
}

fn main() {
    let src = "let ps = [];\\n\\
               keep.push(ps[1]);\\n";
    let d = Diag {
        level: "error",
        code: "V001", // made up
        msg: "an element is used by \\
              push",
        span: (23, 28),
    };
    let out = render("k.js", src, &d);
    println!("{out}");
}
`,
  },
  'three-counts': {
    lang: 'rust',
    title: 'One place, three counts',
    code: `fn main() {
    let s = "const s = \\"🎉\\"; [;";
    // the byte offset of the last ;
    let at = s.rfind(';').unwrap();
    let b = &s[..at];
    println!("bytes:  {}", b.len());
    println!("chars:  {}",
        b.chars().count());
    println!("utf-16: {}",
        b.encode_utf16().count());
    for c in ['a', 'é', '🎉'] {
        let n8 = c.len_utf8();
        let n16 = c.len_utf16();
        println!("{c}: {n8} byte(s), \\
            {n16} unit(s)");
    }
}
`,
  },
};

export const exercises = {
  reportText: {
    lang: 'rust',
    title: 'The plain report',
    prompt: 'Write `report(ps)`, the plain `explain` text. For each plan, in order, a header `{name} (line {line}) {fields} → {verdict}` (the fields joined with `", "` inside braces; the verdict is `kept as array of objects`, `struct of arrays` or `AoSoA, blocks of {b}`), then one line `  · {reason}` (two spaces, a middle dot, a space) per reason. Join all the lines with `\\n`, with no line break at the end. Helper functions are welcome.',
    starter: `enum Layout {
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

fn report(ps: &[Plan]) -> String {
    todo!()
}`,
    solution: `enum Layout {
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

fn verdict(l: &Layout) -> String {
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
}

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
}`,
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
        code: `enum Layout {
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

fn verdict(l: &Layout) -> String {
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
}

fn header(p: &Plan) -> String {
    let v = verdict(&p.layout);
    let fs = p.fields.join(", ");
    format!(
        "{} (line {}) {fs} → {v}",
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
}`,
        why: 'Without doubled braces the field list loses its `{` and `}`: `ps (line 1) x, vx → struct of arrays`.',
      },
      {
        code: `enum Layout {
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

fn verdict(l: &Layout) -> String {
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
}

fn header(p: &Plan) -> String {
    let v = verdict(&p.layout);
    let fs = p.fields.join(", ");
    format!(
        "{} (line {}) {{{fs}}} → {v}",
        p.name, p.line
    )
}

fn report(ps: &[Plan]) -> String {
    let mut out = String::new();
    for p in ps {
        out += &header(p);
        out += "\\n";
        for r in &p.reasons {
            out += "  · ";
            out += r;
            out += "\\n";
        }
    }
    out
}`,
        why: 'Every line ends with a line break, so the report has one at the end; the real report joins its lines and leaves the last break to the CLI.',
      },
      {
        code: `enum Layout {
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

fn verdict(l: &Layout) -> String {
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
}

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
            let l = format!("· {r}");
            lines.push(l);
        }
    }
    lines.join("\\n")
}`,
        why: 'Each reason line starts with two spaces before the middle dot; without them the text differs from both engines’ reports.',
      },
    ],
  },
  codeFrame: {
    lang: 'rust',
    title: 'A code frame from byte offsets',
    prompt: 'Write `code_frame(src, start, end, line)`, a simpler `plan::code_frame`. `start..end` are byte offsets into `src`, and only `\\n` breaks lines. Return two lines with no final newline: `"{line} | {text}"`, where `text` is the line containing `start` with trailing whitespace trimmed; then a gutter of spaces as wide as the line number, `" | "`, a pad, and carets. The pad has one character per code point before `start` on that line: a tab stays a tab, anything else becomes a space. The carets run from `start` to `end`, clipped to the trimmed text, and there is at least one.',
    starter: `fn code_frame(
    src: &str,
    start: usize,
    end: usize,
    line: u32,
) -> String {
    todo!()
}`,
    solution: `fn code_frame(
    src: &str,
    start: usize,
    end: usize,
    line: u32,
) -> String {
    let s = src[..start]
        .rfind('\\n')
        .map_or(0, |i| i + 1);
    let e = src[start..]
        .find('\\n')
        .map_or(src.len(), |i| {
            start + i
        });
    let text = src[s..e].trim_end();
    let before = &src[s..start];
    let col = before.chars().count();
    let end = end.max(start).min(e);
    let up_to =
        src[s..end].chars().count();
    let width = up_to
        .min(text.chars().count())
        .saturating_sub(col)
        .max(1);
    let pad: String = before
        .chars()
        .map(|c| match c {
            '\\t' => c,
            _ => ' ',
        })
        .collect();
    let num = line.to_string();
    let gap = " ".repeat(num.len());
    let car = "^".repeat(width);
    format!(
        "{num} | {text}\\n{gap} | {}",
        pad + &car
    )
}`,
    tests: `#[test]
fn points_at_the_span() {
    let src = "let a = ps[0];";
    assert_eq!(
        code_frame(src, 8, 13, 1),
        "1 | let a = ps[0];\\n  |         ^^^^^"
    );
}

#[test]
fn quotes_only_the_spans_line() {
    let src = "a();\\nf(ps[1]);\\nb();";
    let at = src.find("ps").unwrap();
    assert_eq!(
        code_frame(src, at, at + 5, 2),
        "2 | f(ps[1]);\\n  |   ^^^^^"
    );
}

#[test]
fn counts_columns_in_code_points() {
    let src = "s = \\"é🎉\\"; g(ps[0]);";
    let at = src.find("ps").unwrap();
    assert_eq!(
        code_frame(src, at, at + 5, 9),
        "9 | s = \\"é🎉\\"; g(ps[0]);\\n  |             ^^^^^"
    );
}

#[test]
fn keeps_tabs_in_the_pad() {
    let src = "{\\n\\t\\tf(ps[3]);\\n}";
    let at = src.find("ps").unwrap();
    assert_eq!(
        code_frame(src, at, at + 5, 12),
        "12 | \\t\\tf(ps[3]);\\n   | \\t\\t  ^^^^^"
    );
}

#[test]
fn clips_a_span_to_its_first_line() {
    let src = "f(ps[\\n  4]);   ";
    assert_eq!(
        code_frame(src, 2, 10, 3),
        "3 | f(ps[\\n  |   ^^^"
    );
}

#[test]
fn trims_blanks_and_never_runs_past() {
    let src = "q.push(ps[i]);  \\t";
    let at = src.find("ps").unwrap();
    assert_eq!(
        code_frame(src, at, src.len(), 7),
        "7 | q.push(ps[i]);\\n  |        ^^^^^^^"
    );
}`,
    hints: [
      'Find the line first. `src[..start].rfind(\'\\n\')` is the break before the span (`None`: the line starts at 0, otherwise it starts one byte after the break); `src[start..].find(\'\\n\')` is the next break, counted from `start`.',
      'Count columns with `.chars().count()`, never with byte lengths: `é` is two bytes and `🎉` four, but each is one column here. The pad maps each char of the text before the span to itself if it is a tab, else to a space.',
      'For the width, count code points from the line start to `end.max(start).min(e)`, take the smaller of that and the trimmed text’s length, then `.saturating_sub(col).max(1)`.',
    ],
    walkthrough: `**How to think about it.** This is the core of \`code_frame\` in \`engine/rust/crates/core/src/plan.rs\`, without the indent and with only \`\\n\` as a line break (the real one also breaks at \`\\r\`, U+2028 and U+2029, and steps past a break by its length in bytes). Do the first test by hand: \`let a = ps[0];\` with the span at bytes 8 to 13. The line is the whole string; eight characters come before the span, so the pad is eight spaces; the span covers \`ps[0]\`, five characters, so five carets. The only subtle parts are which units to count in (bytes to slice, code points to measure) and the three ways the width is kept sensible.

**The solution, line by line.**

- \`let s = src[..start].rfind('\\n').map_or(0, |i| i + 1);\` searches backwards from the span for a line break; the line starts one byte after it (\`\\n\` is one byte), or at 0 when there is none.
- \`let e = src[start..].find('\\n').map_or(src.len(), |i| start + i);\` searches forwards; \`find\` counts from \`start\`, so \`start + i\` turns it back into an offset in \`src\`; with no break, the line runs to the end.
- \`let text = src[s..e].trim_end();\` is the line without trailing blanks. Slicing by bytes is safe here, because \`s\`, \`e\` and \`start\` are all at character boundaries (a span's start, or a \`\\n\`).
- \`let before = &src[s..start];\` and \`let col = before.chars().count();\` give the column in code points, which is what the TypeScript engine gets from \`Array.from\`.
- \`let end = end.max(start).min(e);\`: a span can't end before it starts, and it is cut at the end of its line.
- \`let up_to = src[s..end].chars().count();\` counts code points from the line start to the (cut) end.
- \`let width = up_to.min(text.chars().count()).saturating_sub(col).max(1);\`: never past the trimmed text, never below zero (\`saturating_sub\` stops at 0 instead of overflowing), and at least one caret.
- \`let pad: String = before.chars().map(|c| match c { '\\t' => c, _ => ' ' }).collect();\` keeps tabs and turns everything else into a space, one per code point.
- \`let num = line.to_string();\`, \`let gap = " ".repeat(num.len());\` and \`let car = "^".repeat(width);\` prepare the line number, a gutter as wide as it, and the carets.
- \`format!("{num} | {text}\\n{gap} | {}", pad + &car)\` writes the two lines, with no line break at the end. \`pad + &car\` adds a \`&str\` to a \`String\`.

**Common wrong attempts.**

- \`let col = before.len();\`: that counts bytes. After \`"é🎉"\` (six bytes, two code points) the carets start four columns too far right, and the width comes out wrong too.
- \`let pad = " ".repeat(col);\`: all spaces. Before tab-indented code, the code moves by a tab's width but the carets by one space per tab, so they miss.`,
    wrong: [
      {
        code: `fn code_frame(
    src: &str,
    start: usize,
    end: usize,
    line: u32,
) -> String {
    let s = src[..start]
        .rfind('\\n')
        .map_or(0, |i| i + 1);
    let e = src[start..]
        .find('\\n')
        .map_or(src.len(), |i| {
            start + i
        });
    let text = src[s..e].trim_end();
    let before = &src[s..start];
    let col = before.len();
    let end = end.max(start).min(e);
    let up_to =
        src[s..end].chars().count();
    let width = up_to
        .min(text.chars().count())
        .saturating_sub(col)
        .max(1);
    let pad: String = before
        .chars()
        .map(|c| match c {
            '\\t' => c,
            _ => ' ',
        })
        .collect();
    let num = line.to_string();
    let gap = " ".repeat(num.len());
    let car = "^".repeat(width);
    format!(
        "{num} | {text}\\n{gap} | {}",
        pad + &car
    )
}`,
        why: 'The column is `before.len()`, a count of bytes. After `"é🎉"` (six bytes, two code points) the carets start four columns too far right, and the width comes out wrong too.',
      },
      {
        code: `fn code_frame(
    src: &str,
    start: usize,
    end: usize,
    line: u32,
) -> String {
    let s = src[..start]
        .rfind('\\n')
        .map_or(0, |i| i + 1);
    let e = src[start..]
        .find('\\n')
        .map_or(src.len(), |i| {
            start + i
        });
    let text = src[s..e].trim_end();
    let before = &src[s..start];
    let col = before.chars().count();
    let end = end.max(start).min(e);
    let up_to =
        src[s..end].chars().count();
    let width = up_to
        .min(text.chars().count())
        .saturating_sub(col)
        .max(1);
    let pad = " ".repeat(col);
    let num = line.to_string();
    let gap = " ".repeat(num.len());
    let car = "^".repeat(width);
    format!(
        "{num} | {text}\\n{gap} | {}",
        pad + &car
    )
}`,
        why: 'The pad is all spaces. Before tab-indented code, the code moves by a tab’s width but the carets move by one space each.',
      },
    ],
  },
  caretLine: {
    lang: 'rust',
    title: 'The caret line',
    prompt: 'Write `underline(before, width)`, the second line of a code frame. `before` is the text of the source line from its start up to the span, and `width` is how many characters the span covers. Return a pad, then `width` carets (`^`), and at least one caret even when `width` is 0. In the pad, every tab of `before` stays a tab, and every other character, whatever it is, becomes one space.',
    starter: `fn underline(
    before: &str,
    width: usize,
) -> String {
    todo!()
}`,
    solution: `// The caret line under a span, as
// code_frame draws it. \`before\` is the
// text of the line before the span.
// Tabs are copied, so the carets line
// up however a terminal draws a tab;
// every other character is one space.
fn underline(
    before: &str,
    width: usize,
) -> String {
    let pad: String = before
        .chars()
        .map(|c| match c {
            '\\t' => '\\t',
            _ => ' ',
        })
        .collect();
    pad + &"^".repeat(width.max(1))
}`,
    tests: `#[test]
fn plain_text_becomes_spaces() {
    assert_eq!(underline("let a = ", 3), "        ^^^");
}

#[test]
fn a_span_at_the_start_has_no_pad() {
    assert_eq!(underline("", 2), "^^");
}

#[test]
fn tabs_are_copied() {
    assert_eq!(
        underline("\\tif (", 5),
        "\\t    ^^^^^"
    );
}

#[test]
fn an_emoji_is_one_space() {
    // 🎉 is 4 bytes but one character
    assert_eq!(underline("s = \\"🎉\\"; ", 2), "         ^^");
}

#[test]
fn an_empty_span_still_gets_a_caret() {
    assert_eq!(underline("ab", 0), "  ^");
}
`,
    hints: [
      'There are two parts to build: the pad, from `before`, and the carets, from `width`. Join them at the end.',
      'Walk `before.chars()` (characters, not bytes) and turn each into either a tab or a space; `collect()` the result into a `String`.',
      'For the carets, `"^".repeat(n)` makes a string of n carets; use `width.max(1)` so that a width of 0 still gives one.',
    ],
    walkthrough: `**How to think about it.** Look at a frame from the chapter: the line of code, and under it a line that is blank up to the span and then carets. The blank part must take up exactly the same room on screen as the code above it. For ordinary characters one space per character does that (in a terminal that draws each character one column wide). A tab is the exception: a terminal may draw it as 2, 4 or 8 columns, so the only way to match it is to put a tab in the same place. That gives the rule: tab stays tab, anything else becomes a space. Then come the carets, as many as the span is wide, and at least one, so an empty span still shows where it is.

**The solution, line by line.**

- \`fn underline(before: &str, width: usize) -> String {\` borrows the text before the span and returns a new string we build.
- \`let pad: String = before\` starts the pad, built from \`before\`.
- \`.chars()\` walks it character by character. This matters: \`before.len()\` would count bytes, and 🎉 is four bytes but one character.
- \`.map(|c| match c { '\\t' => '\\t', _ => ' ' })\` turns each character into the character the pad needs at that spot: a tab for a tab, a space for anything else.
- \`.collect();\` gathers those characters into the \`String\` (the type annotation on \`pad\` tells \`collect\` what to build).
- \`pad + &"^".repeat(width.max(1))\` makes the carets (\`max(1)\` turns a width of 0 into 1) and appends them; \`+\` on a \`String\` takes the left side by value and a \`&str\` on the right, hence the \`&\`.

This is what \`code_frame\` in \`crates/core/src/plan.rs\` does for the pad, \`before.chars().map(|c| if c == '\\t' { '\\t' } else { ' ' }).collect()\`, and its width is also at least 1.

**Common wrong attempts.**

- **Counting bytes.** \`" ".repeat(before.len())\` works for plain ASCII and puts the carets three columns too far right after an emoji, because \`len\` counts the emoji's four bytes.
- **Turning tabs into spaces.** A single space for a tab looks right only in a terminal that draws tabs one column wide; everywhere else the carets slide left of the code.
- **Forgetting the minimum.** \`"^".repeat(width)\` gives no caret at all for an empty span, and the frame then points at nothing.`,
    wrong: [
      {
        code: `fn underline(
    before: &str,
    width: usize,
) -> String {
    " ".repeat(before.len())
        + &"^".repeat(width.max(1))
}`,
        why: 'That counts bytes, and replaces tabs with spaces: the emoji adds three spaces too many, and the tab test fails.',
      },
      {
        code: `// The caret line under a span, as
// code_frame draws it. \`before\` is the
// text of the line before the span.
// Tabs are copied, so the carets line
// up however a terminal draws a tab;
// every other character is one space.
fn underline(
    before: &str,
    width: usize,
) -> String {
    let pad: String = before
        .chars()
        .map(|c| match c {
            _ => ' ',
        })
        .collect();
    pad + &"^".repeat(width.max(1))
}`,
        why: 'Every tab becomes a space, so in a terminal that draws tabs wider the carets slide left of the code.',
      },
      {
        code: `// The caret line under a span, as
// code_frame draws it. \`before\` is the
// text of the line before the span.
// Tabs are copied, so the carets line
// up however a terminal draws a tab;
// every other character is one space.
fn underline(
    before: &str,
    width: usize,
) -> String {
    let pad: String = before
        .chars()
        .map(|c| match c {
            '\\t' => '\\t',
            _ => ' ',
        })
        .collect();
    pad + &"^".repeat(width)
}`,
        why: 'An empty span gets no caret at all, so the frame points at nothing.',
      },
    ],
  },
  acornLineCol: {
    lang: 'rust',
    title: 'acorn’s line and column',
    prompt: 'The Rust CLI prints `Unexpected token (1:12)` as the TypeScript one does, by turning oxc’s byte offset into acorn’s position. Write `line_col(src, at)`: the line (from 1) and column (from 0) of byte offset `at`. Lines break at `\\n`, `\\r`, `\\r\\n` (one break), U+2028 and U+2029. Columns count UTF-16 units. Every expected value in the tests is what acorn printed.',
    starter: `fn line_col(
    src: &str,
    at: usize,
) -> (usize, usize) {
    todo!()
}`,
    solution: `// acorn's position of byte offset \`at\`:
// (line from 1, column from 0). Lines
// end at \\n, \\r, \\r\\n, U+2028, U+2029.
// Columns count UTF-16 units, as
// JavaScript strings do.
fn line_col(
    src: &str,
    at: usize,
) -> (usize, usize) {
    let (mut line, mut col) = (1, 0);
    let mut after_cr = false;
    for (i, c) in src.char_indices() {
        if i >= at {
            break;
        }
        match c {
            // the \\n of \\r\\n: counted
            '\\n' if after_cr => {}
            '\\n' | '\\r' | '\\u{2028}'
            | '\\u{2029}' => {
                line += 1;
                col = 0;
            }
            _ => col += c.len_utf16(),
        }
        after_cr = c == '\\r';
    }
    (line, col)
}`,
    tests: `#[test]
fn ascii_on_one_line() {
    let s = "const ps = [;";
    assert_eq!(line_col(s, 12), (1, 12));
}

#[test]
fn an_emoji_is_two_units() {
    // the ; after [ is byte 19
    let s = "const s = \\"🎉\\"; [;";
    assert_eq!(line_col(s, 19), (1, 17));
}

#[test]
fn an_accent_is_one_unit() {
    // é is two bytes, one UTF-16 unit
    let s = "let é = [;";
    assert_eq!(line_col(s, 10), (1, 9));
}

#[test]
fn crlf_is_one_line_break() {
    let s = "let a;\\r\\nlet b = ;";
    assert_eq!(line_col(s, 16), (2, 8));
}

#[test]
fn a_lone_cr_is_a_line_break() {
    let s = "let a;\\rlet b = ;";
    assert_eq!(line_col(s, 15), (2, 8));
}

#[test]
fn u2028_is_a_line_break() {
    let s = "let a; \\u{2028} let b = ;";
    assert_eq!(line_col(s, 19), (2, 9));
}

#[test]
fn the_start_is_line_one_column_zero() {
    assert_eq!(line_col("x", 0), (1, 0));
}
`,
    hints: [
      'Walk `src.char_indices()` and stop at the first `i >= at`. Everything before it decides the answer.',
      'A line break adds 1 to the line and sets the column to 0. Anything else adds `c.len_utf16()` to the column.',
      'For `\\r\\n`, remember whether the previous char was `\\r`, and then ignore the `\\n`.',
    ],
    walkthrough: `**How to think about it.** Three units meet in this function, which is why it is easy to get almost right. The input \`at\` is a byte offset, because that is what oxc's spans count, and \`char_indices\` hands you each character together with its byte offset, so you can stop at the right place. The output column is in UTF-16 units, because that is what acorn counts, and \`c.len_utf16()\` tells you how many units each character takes (1 for é, 2 for 🎉). The line follows JavaScript's line breaks, with \`\\r\\n\` counted once. Do the emoji test by hand first: 11 ASCII characters (11 units), 🎉 (2 units), then \`"; [\` (4 units) gives 17.

**The solution, line by line.**

- \`fn line_col(src: &str, at: usize) -> (usize, usize) {\` takes the text and a byte offset and returns a pair, the line and the column.
- \`let (mut line, mut col) = (1, 0);\` starts where acorn starts counting: line 1, column 0.
- \`let mut after_cr = false;\` remembers whether the previous character was \`\\r\`, so that the \`\\n\` of a \`\\r\\n\` can be skipped.
- \`for (i, c) in src.char_indices() {\` walks the characters with their byte offsets.
- \`if i >= at { break; }\` stops at the character the offset points at: only what comes before it counts.
- \`'\\n' if after_cr => {}\` is the second half of a \`\\r\\n\`: the \`\\r\` already started the new line, so this \`\\n\` does nothing.
- \`'\\n' | '\\r' | '\\u{2028}' | '\\u{2029}' => { line += 1; col = 0; }\` is every other line break: a new line, and the column starts again.
- \`_ => col += c.len_utf16(),\` is any other character: it moves the column on by its size in UTF-16 units.
- \`after_cr = c == '\\r';\` updates the memory for the next character.
- \`(line, col)\` after the loop is the answer.

The port does the same work in two steps: \`LineIndex::new\` records the line starts once per file, and \`line_column\` finds the line by binary search and counts \`encode_utf16()\` from its start. One pass, as here, is simpler; the index is faster when there are many positions to convert.

**Common wrong attempts.**

- **Counting bytes.** \`col += c.len_utf8()\` gives the byte distance from the line start: é counts 2 and 🎉 counts 4, so the columns come out too big.
- **Counting characters.** \`col += 1\` is what the code frames count, and it is right for é, but 🎉 is 2 UTF-16 units, so the emoji line gives 16 instead of 17.
- **Two breaks for \`\\r\\n\`.** Without the \`after_cr\` arm, a Windows file has every line counted twice, and every error after the first line is reported on the wrong line.`,
    wrong: [
      {
        code: `// acorn's position of byte offset \`at\`:
// (line from 1, column from 0). Lines
// end at \\n, \\r, \\r\\n, U+2028, U+2029.
// Columns count UTF-16 units, as
// JavaScript strings do.
fn line_col(
    src: &str,
    at: usize,
) -> (usize, usize) {
    let (mut line, mut col) = (1, 0);
    let mut after_cr = false;
    for (i, c) in src.char_indices() {
        if i >= at {
            break;
        }
        match c {
            // the \\n of \\r\\n: counted
            '\\n' if after_cr => {}
            '\\n' | '\\r' | '\\u{2028}'
            | '\\u{2029}' => {
                line += 1;
                col = 0;
            }
            _ => col += c.len_utf8(),
        }
        after_cr = c == '\\r';
    }
    (line, col)
}`,
        why: 'That counts bytes. é and 🎉 are 2 and 4 bytes but 1 and 2 UTF-16 units, so the columns come out too big.',
      },
      {
        code: `// acorn's position of byte offset \`at\`:
// (line from 1, column from 0). Lines
// end at \\n, \\r, \\r\\n, U+2028, U+2029.
// Columns count UTF-16 units, as
// JavaScript strings do.
fn line_col(
    src: &str,
    at: usize,
) -> (usize, usize) {
    let (mut line, mut col) = (1, 0);
    let mut after_cr = false;
    for (i, c) in src.char_indices() {
        if i >= at {
            break;
        }
        match c {
            // the \\n of \\r\\n: counted
            '\\n' if after_cr => {}
            '\\n' | '\\r' | '\\u{2028}'
            | '\\u{2029}' => {
                line += 1;
                col = 0;
            }
            _ => col += 1,
        }
        after_cr = c == '\\r';
    }
    (line, col)
}`,
        why: 'That counts code points, like the frames do. acorn counts UTF-16 units, so 🎉 counts as 2.',
      },
      {
        code: `// acorn's position of byte offset \`at\`:
// (line from 1, column from 0). Lines
// end at \\n, \\r, \\r\\n, U+2028, U+2029.
// Columns count UTF-16 units, as
// JavaScript strings do.
fn line_col(
    src: &str,
    at: usize,
) -> (usize, usize) {
    let (mut line, mut col) = (1, 0);
    let mut after_cr = false;
    for (i, c) in src.char_indices() {
        if i >= at {
            break;
        }
        match c {
            '\\n' | '\\r' | '\\u{2028}'
            | '\\u{2029}' => {
                line += 1;
                col = 0;
            }
            _ => col += c.len_utf16(),
        }
        after_cr = c == '\\r';
    }
    (line, col)
}`,
        why: '`\\r\\n` is one line break, not two: every CRLF line would be counted twice.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'You run `viscosity explain prog.js` without `--frames`. What does `explain_text` receive as `frames`?',
    options: [
      {
        t: '`Some("")`',
        why: 'An empty source would still be `Some`, and frames would be attempted.',
      },
      {
        t: '`None`, so no frame is ever built and the report is the plain one',
        correct: true,
        why: '`explain(p)` is `explain_text(p, None)`.',
      },
      {
        t: 'The source, but frames are filtered out afterwards',
        why: 'Nothing is filtered: the frame is never built.',
      },
    ],
  },
  {
    q: 'What header does a collection `ps` on line 3 with fields `x` and `vx`, planned as SoA, get?',
    options: [
      {
        t: '`ps (line 3) {x, vx} → struct of arrays`',
        correct: true,
        why: 'Name, line in brackets, fields in braces joined by “, ”, an arrow, the verdict.',
      },
      {
        t: '`ps (line 3) x, vx → struct of arrays`',
        why: 'The braces are part of the header; in the format string they are written `{{` and `}}`.',
      },
      {
        t: '`ps: struct of arrays (x, vx)`',
        why: 'Both engines use one fixed form, `name (line n) {fields} → verdict`.',
      },
    ],
  },
  {
    q: 'A collection bails out with the message “line 7: an element is used by push” at two different places. What is recorded?',
    options: [
      {
        t: 'Both sites, and two reasons',
        why: 'The messages are deduplicated, so there is one reason, with one site.',
      },
      {
        t: 'One reason, and the site of the first place it was found',
        correct: true,
        why: '`entry(msg).or_insert(at)` writes only a new key, and the `IndexSet` keeps the first copy of the message.',
      },
      {
        t: 'One reason, and the site of the last place it was found',
        why: '`or_insert` never overwrites an existing entry.',
      },
    ],
  },
  {
    q: 'Which reasons can get a code frame?',
    options: [
      {
        t: 'Every reason of every collection',
        why: '“typed Float64Array columns for all 8 fields” has no single place in the source.',
      },
      {
        t: 'Only reasons of transformed collections',
        why: 'The other way round: frames explain refusals.',
      },
      {
        t: 'Only the first reason',
        why: 'Each bailout reason gets its own frame.',
      },
      {
        t: 'The `unsafe: ...` reasons of a kept collection whose reasons are exactly its bailouts, when a site was recorded',
        correct: true,
        why: 'Then reason `k` is bailout `k`, and `bailout_sites` maps its message to an `Option<SourceRef>`.',
      },
    ],
  },
  {
    q: 'In `string_index.js`, why does the frame for “line 6: indexes the array with something that may not be a number” show line 4?',
    options: [
      {
        t: 'A bug in the line counter',
        why: 'Both engines agree, and the line is right for the instruction recorded.',
      },
      {
        t: 'The bailout is about the index value, which in SSA is the constant `\'5\'` written on line 4',
        correct: true,
        why: 'The site is the span of the instruction the bailout is about.',
      },
      {
        t: 'Frames always show the line of the collection’s declaration',
        why: 'The declaration is on line 2; the frame shows the site.',
      },
    ],
  },
  {
    q: 'A refused reason has a recorded site, but you ran plain `viscosity explain`. Is a frame printed?',
    options: [
      {
        t: 'Yes, because the site is known',
        why: 'A frame also needs a source to quote, and plain explain passes `None`.',
      },
      {
        t: 'No: `frames` is `None`, so `frames.zip(at)` is `None`',
        correct: true,
        why: '`zip` is `Some` only when both sides are.',
      },
      {
        t: 'Only for the first reason',
        why: 'Without `--frames` no reason gets one.',
      },
    ],
  },
  {
    q: 'A line is `naïve 🎉 ps[0]`. Where does `ps` start in each unit?',
    options: [
      {
        t: 'Byte 12, UTF-16 unit 9, code point 8',
        correct: true,
        why: '`ï` is 2 bytes but 1 unit; `🎉` is 4 bytes, 2 units (a surrogate pair), 1 code point. The Run example prints these numbers.',
      },
      {
        t: '8 in all three',
        why: 'Only ASCII text has the same offsets in every unit.',
      },
      {
        t: 'Byte 8, UTF-16 unit 9, code point 12',
        why: 'Bytes are the biggest count here, code points the smallest.',
      },
    ],
  },
  {
    q: 'Why does `code_frame` count `chars()` rather than use the byte offsets directly?',
    options: [
      {
        t: 'Byte offsets can’t be used to slice a Rust string',
        why: 'They can, at character boundaries; the function slices with them.',
      },
      {
        t: 'Counting chars is faster',
        why: 'It is slower: the bytes must be decoded.',
      },
      {
        t: 'So that the column means the same as in the TypeScript engine, which counts code points',
        correct: true,
        why: 'Bytes (Rust) and UTF-16 units (TS) differ after non-ASCII text; code points agree.',
      },
      {
        t: 'Because oxc reports columns in chars',
        why: 'oxc reports byte spans and no columns at all.',
      },
    ],
  },
  {
    q: 'Both engines print the same frame, but in your terminal the carets after an emoji start one column early. What is going on?',
    options: [
      {
        t: 'A parity bug in the Rust engine',
        why: 'The TypeScript engine prints the same bytes.',
      },
      {
        t: 'The fixtures are stale',
        why: 'They match; the bytes are as intended.',
      },
      {
        t: 'Both count columns in code points, and the emoji is one code point drawn two columns wide',
        correct: true,
        why: 'Parity can’t catch a mistake both engines share. Fixing it would need a table of character widths.',
      },
    ],
  },
  {
    q: `An escaping element is written as \`ps[
  i]\`, across two lines. What does its frame show?`,
    options: [
      {
        t: 'Both lines, with carets under each part',
        why: 'A frame always shows one line: the one the span starts on.',
      },
      {
        t: 'The first line, with carets from `ps[` to the end of that line’s text',
        correct: true,
        why: '`min(e)` cuts the span at the end of its first line, and the width never runs past the trimmed text.',
      },
      {
        t: 'Nothing: a span over two lines has no frame',
        why: 'It still gets a frame, clipped to its first line.',
      },
    ],
  },
  {
    q: 'Which of these is a diagnostic in this chapter’s sense?',
    options: [
      {
        t: '`viscosity: SyntaxError: Unexpected token`, as the CLI once printed it',
        why: 'It has a message but no position.',
      },
      {
        t: 'An `unsafe:` reason with its code frame',
        correct: true,
        why: 'A message plus a span, drawn as a line number, the code and carets.',
      },
      {
        t: '`viscosity: No such file or directory (os error 2)`, as it once was',
        why: 'It did not even name the file.',
      },
    ],
  },
  {
    q: 'Where does the “line 6” in “line 6: an element is used by push” come from?',
    options: [
      {
        t: 'From oxc, which reports line numbers',
        why: 'oxc reports byte offsets only; `LineIndex` works out lines.',
      },
      {
        t: 'From counting line breaks again when explain runs',
        why: 'The line is worked out once, when the SourceRef is made.',
      },
      {
        t: 'From the `SourceRef` that lowering put on the `ps[i]` instruction',
        correct: true,
        why: 'The same SourceRef gives the frame its span.',
      },
    ],
  },
  {
    q: 'Which parts does rustc’s E0308 message have that a Viscosity code frame does not?',
    options: [
      {
        t: 'A level, a code, a file name and a column',
        correct: true,
        why: 'The frame has the message, a line number, the code and the carets.',
      },
      {
        t: 'A line number and carets',
        why: 'The frame has both.',
      },
      {
        t: 'A message that stands on its own',
        why: 'Viscosity’s reasons do: “an element is used by push”.',
      },
    ],
  },
  {
    q: 'A refusal about `for (const p of ps) keep.push(p);` is underlined from the first character to the last. Why?',
    options: [
      {
        t: 'The frame code cannot underline part of a line',
        why: 'It underlines `ps[i]` alone in the indexed loop.',
      },
      {
        t: 'The element’s SourceRef is the span of the `for...of` statement that made it',
        correct: true,
        why: 'A frame is only as precise as its span.',
      },
      {
        t: 'oxc gives `for...of` statements no span',
        why: 'It does: the whole statement, which is the trouble.',
      },
      {
        t: 'The line holds a tab',
        why: 'It holds none; a tab only changes the pad.',
      },
    ],
  },
  {
    q: 'In `underline`, why are characters counted with `chars()` rather than `len()`?',
    options: [
      {
        t: 'Because `len()` would include the tabs',
        why: 'Both count tabs; the difference is bytes against characters.',
      },
      {
        t: 'Because `len()` counts bytes, and a character like 🎉 is four bytes but one character',
        correct: true,
        why: 'One space per character is what lines up.',
      },
      {
        t: 'Because `chars()` is faster',
        why: 'It is slower, if anything; correctness is the reason.',
      },
    ],
  },
  {
    q: 'In `"let é = [;"`, the `;` is at byte 10. Which column does acorn report?',
    options: [
      {
        t: '10',
        why: 'That is the byte offset; é is 2 bytes.',
      },
      {
        t: '8',
        why: 'That would count é as zero units.',
      },
      {
        t: '9',
        correct: true,
        why: 'é is one UTF-16 unit, so `(1:9)`.',
      },
    ],
  },
  {
    q: 'A file uses Windows line endings (`\\r\\n`). An error is on the third line. What would a line counter that treats `\\r` and `\\n` as separate breaks report?',
    options: [
      {
        t: 'Line 3',
        why: 'Only if it counted `\\r\\n` once.',
      },
      {
        t: 'Line 5',
        correct: true,
        why: 'Two breaks per line ending: two line endings become four breaks, so 1 + 4 = 5.',
      },
      {
        t: 'Line 6',
        why: 'There are only two line endings before the third line.',
      },
    ],
  },
  {
    q: 'Which statement about oxc and the old Rust syntax errors is accurate?',
    options: [
      {
        t: 'oxc did not know where the error was',
        why: 'It did: the label holds the span.',
      },
      {
        t: 'oxc reports line and column numbers, and the plugin ignored them',
        why: 'oxc reports byte offsets; the plugin turns them into line and column.',
      },
      {
        t: 'The span was in a label that `Display` does not print, so `format!("{e}")` lost it',
        correct: true,
        why: 'The fix reads `e.labels.first()` and appends `(line:column)`.',
      },
    ],
  },
  {
    q: 'Why must the Rust CLI count columns in UTF-16 units, when Rust strings are UTF-8?',
    options: [
      {
        t: 'Because terminals draw UTF-16',
        why: 'Terminals draw characters; the unit is about matching acorn.',
      },
      {
        t: 'Because it must print what the TypeScript CLI prints, and acorn counts JavaScript string units',
        correct: true,
        why: 'The same error, the same `(line:column)`, in both engines.',
      },
      {
        t: 'Because UTF-8 has no columns',
        why: 'Any unit can count a column; the question is which one the other engine uses.',
      },
    ],
  },
  {
    q: 'A source file has 10,000 lines. About how many comparisons does `partition_point` make to find the line of an offset?',
    options: [
      {
        t: 'About 14',
        correct: true,
        why: 'A binary search halves the list each step, and 2 to the 14th is just over 10,000.',
      },
      {
        t: 'About 5,000 on average',
        why: 'That is a search from the start; the starts are sorted, so it can halve.',
      },
      {
        t: 'Exactly 1, because it is a lookup table',
        why: 'It is a sorted list searched by halving, not a table indexed by offset.',
      },
    ],
  },
];
