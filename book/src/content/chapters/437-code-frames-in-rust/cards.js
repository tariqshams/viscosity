// Chapter 437 cards. Keys are stable ids: never rename them.

export const prompts = {
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
};

export const quiz = [
  {
    q: 'A refused reason has a recorded site, but you ran plain `viscosity explain`. Is a frame printed?',
    options: [
      { t: 'Yes, because the site is known', why: 'A frame also needs a source to quote, and plain explain passes `None`.' },
      { t: 'No: `frames` is `None`, so `frames.zip(at)` is `None`', correct: true, why: '`zip` is `Some` only when both sides are.' },
      { t: 'Only for the first reason', why: 'Without `--frames` no reason gets one.' },
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
  {
    q: 'An escaping element is written as `ps[\n  i]`, across two lines. What does its frame show?',
    options: [
      { t: 'Both lines, with carets under each part', why: 'A frame always shows one line: the one the span starts on.' },
      { t: 'The first line, with carets from `ps[` to the end of that line’s text', correct: true, why: '`min(e)` cuts the span at the end of its first line, and the width never runs past the trimmed text.' },
      { t: 'Nothing: a span over two lines has no frame', why: 'It still gets a frame, clipped to its first line.' },
    ],
  },
];
