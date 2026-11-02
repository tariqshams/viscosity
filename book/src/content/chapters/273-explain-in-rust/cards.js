// Chapter 273 cards. Keys are stable ids: never rename them.

export const prompts = {
  'rx-one-fn': {
    q: 'How do `explain` and `explain_with_frames` in `plan.rs` share their code?',
    a: 'Both call `explain_text(p, frames)`. `None` gives the plain report; `Some(source)` adds frames.',
  },
  'rx-zip': {
    q: 'What does `frames.zip(at)` give, and why is it used there?',
    a: '`Some((src, at))` only when both are `Some`: a frame needs a source to quote and a position for this reason.',
  },
  'rx-first-site': {
    q: 'A collection bails out with the same message at two places. Which one does `--frames` show?',
    a: 'The first: `bail` uses `entry(msg).or_insert(at)`, which only writes a new key.',
  },
  'rx-refused': {
    q: 'Why does `explain_text` check that a collection has as many reasons as bailouts?',
    a: 'Then reason `k` is bailout `k`, so its message finds its site. Other reasons (annotations, size) get no frame.',
  },
  'rx-string-index': {
    q: 'In `string_index.js` the reason says line 6 but the frame shows line 4. Why?',
    a: 'The site is the index value’s instruction. In SSA, `k` is the constant `\'5\'`, written on line 4.',
  },
  'rx-tabs': {
    q: 'Why does the caret line keep the tabs that come before the code?',
    a: 'A tab is drawn at different widths by different editors. Copying it means the carets move exactly as far as the code does.',
  },
  'rx-clip': {
    q: 'An element is written across two lines. What does its frame show?',
    a: 'Only its first line, with carets from the start of the span to the end of that line’s text.',
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
};

export const exercises = {
  codeFrame: {
    lang: 'rust',
    title: 'A code frame from byte offsets',
    prompt:
      'Write `code_frame(src, start, end, line)`, a simpler `plan::code_frame`. `start..end` are byte offsets into `src`, and only `\\n` breaks lines. Return two lines with no final newline: `"{line} | {text}"`, where `text` is the line containing `start` with trailing whitespace trimmed; then a gutter of spaces as wide as the line number, `" | "`, a pad, and carets. The pad has one character per code point before `start` on that line: a tab stays a tab, anything else becomes a space. The carets run from `start` to `end`, clipped to the trimmed text, and there is at least one.',
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
      '`src[..start].rfind(\'\\n\')` is the break before the line (`None`: the line starts at 0). `src[start..].find(\'\\n\')` is the next one, relative to `start`.',
      'Count columns with `.chars().count()`, never with byte lengths: `é` is two bytes and `🎉` four, but each is one column here.',
      'For the width, count code points from the line start to `end.max(start).min(e)`, take the smaller of that and the text’s length, subtract the column, and use `.saturating_sub(col).max(1)`.',
    ],
    walkthrough: `This is the core of \`code_frame\` in \`engine/rust/crates/core/src/plan.rs\`, without the indent and with only \`\\n\` as a line break (the real one also breaks at \`\\r\`, U+2028 and U+2029, whose length in bytes it adds when it steps past one).

- **Slicing by bytes is safe here** because every offset is at a character boundary: \`start\` comes from a span, and \`rfind\`/\`find\` return the position of a \`\\n\`. Slicing in the middle of \`é\` would panic.
- **Columns are code points.** \`before.chars().count()\` is what the TypeScript engine gets from \`Array.from(...)\`. A byte count would push the carets right after any non-ASCII character, which is the first wrong attempt.
- **The width is clipped twice**: \`min(e)\` stops the span at the end of its line, and \`min(text.chars().count())\` keeps the carets off trimmed blanks. \`saturating_sub\` can't underflow, and \`max(1)\` gives an empty span one caret.
- **Tabs are copied**, which the second wrong attempt forgets: its carets are right in a terminal with 1-column tabs and wrong everywhere else.`,
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
};

export const quiz = [
  {
    q: 'You run `viscosity explain prog.js` without `--frames`. What does `explain_text` receive as `frames`?',
    options: [
      { t: '`Some("")`', why: 'An empty source would still be `Some`, and frames would be attempted.' },
      { t: '`None`, so `frames.zip(at)` is always `None` and no frame is printed', correct: true, why: 'The default report is byte-for-byte what it was before frames existed.' },
      { t: 'The source, but frames are filtered out afterwards', why: 'Nothing is filtered: the frame is never built.' },
    ],
  },
  {
    q: 'Which reasons can get a code frame?',
    options: [
      { t: 'Every reason of every collection', why: '“typed Float64Array columns for all 8 fields” has no single place in the source.' },
      { t: 'Only reasons of transformed collections', why: 'The other way round: frames explain refusals.' },
      { t: 'The `unsafe: ...` reasons of a kept collection whose reasons are exactly its bailouts, when a site was recorded', correct: true, why: 'Then reason `k` is bailout `k`, and `bailout_sites` maps its message to an `Option<SourceRef>`.' },
      { t: 'Only the first reason', why: 'Each bailout reason gets its own frame.' },
    ],
  },
  {
    q: 'A line is `naïve 🎉 ps[0]`. Where does `ps` start in each unit?',
    options: [
      { t: 'Byte 12, UTF-16 unit 9, code point 8', correct: true, why: '`ï` is 2 bytes but 1 unit; `🎉` is 4 bytes, 2 units (a surrogate pair), 1 code point. The Run example prints these numbers.' },
      { t: '8 in all three', why: 'Only ASCII text has the same offsets in every unit.' },
      { t: 'Byte 8, UTF-16 unit 9, code point 12', why: 'Bytes are the biggest count here, code points the smallest.' },
    ],
  },
  {
    q: 'Why does `code_frame` count `chars()` rather than use the byte offsets directly?',
    options: [
      { t: 'Byte offsets can’t be used to slice a Rust string', why: 'They can, at character boundaries; the function slices with them.' },
      { t: 'Counting chars is faster', why: 'It is slower: the bytes must be decoded.' },
      { t: 'So that the column means the same as in the TypeScript engine, which counts code points', correct: true, why: 'Bytes (Rust) and UTF-16 units (TS) differ after non-ASCII text; code points agree.' },
      { t: 'Because oxc reports columns in chars', why: 'oxc reports byte spans and no columns at all.' },
    ],
  },
  {
    q: 'Both engines print the same frame, but in your terminal the carets after an emoji start one column early. What is going on?',
    options: [
      { t: 'A parity bug in the Rust engine', why: 'The TypeScript engine prints the same bytes.' },
      { t: 'The fixtures are stale', why: 'They match; the bytes are as intended.' },
      { t: 'Both count columns in code points, and the emoji is one code point drawn two columns wide', correct: true, why: 'Parity can’t catch a mistake both engines share. Fixing it would need a table of character widths.' },
    ],
  },
];
