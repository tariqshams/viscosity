// Chapter 449 cards. Keys are stable ids: never rename them.

const SOL = `// acorn's position of byte offset \`at\`:
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
}`;

export const prompts = {
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
  acornLineCol: {
    lang: 'rust',
    title: 'acorn’s line and column',
    prompt:
      'The Rust CLI prints `Unexpected token (1:12)` as the TypeScript one does, by turning oxc’s byte offset into acorn’s position. Write `line_col(src, at)`: the line (from 1) and column (from 0) of byte offset `at`. Lines break at `\\n`, `\\r`, `\\r\\n` (one break), U+2028 and U+2029. Columns count UTF-16 units. Every expected value in the tests is what acorn printed.',
    starter: `fn line_col(
    src: &str,
    at: usize,
) -> (usize, usize) {
    todo!()
}`,
    solution: SOL,
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
        code: SOL.replace('_ => col += c.len_utf16(),', '_ => col += c.len_utf8(),'),
        why: 'That counts bytes. é and 🎉 are 2 and 4 bytes but 1 and 2 UTF-16 units, so the columns come out too big.',
      },
      {
        code: SOL.replace('_ => col += c.len_utf16(),', '_ => col += 1,'),
        why: 'That counts code points, like the frames do. acorn counts UTF-16 units, so 🎉 counts as 2.',
      },
      {
        code: SOL.replace("            // the \\n of \\r\\n: counted\n            '\\n' if after_cr => {}\n", ''),
        why: '`\\r\\n` is one line break, not two: every CRLF line would be counted twice.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In `"let é = [;"`, the `;` is at byte 10. Which column does acorn report?',
    options: [
      { t: '10', why: 'That is the byte offset; é is 2 bytes.' },
      { t: '8', why: 'That would count é as zero units.' },
      { t: '9', correct: true, why: 'é is one UTF-16 unit, so `(1:9)`.' },
    ],
  },
  {
    q: 'A file uses Windows line endings (`\\r\\n`). An error is on the third line. What would a line counter that treats `\\r` and `\\n` as separate breaks report?',
    options: [
      { t: 'Line 3', why: 'Only if it counted `\\r\\n` once.' },
      { t: 'Line 5', correct: true, why: 'Two breaks per line ending: two line endings become four breaks, so 1 + 4 = 5.' },
      { t: 'Line 6', why: 'There are only two line endings before the third line.' },
    ],
  },
  {
    q: 'Which statement about oxc and the old Rust syntax errors is accurate?',
    options: [
      { t: 'oxc did not know where the error was', why: 'It did: the label holds the span.' },
      { t: 'oxc reports line and column numbers, and the plugin ignored them', why: 'oxc reports byte offsets; the plugin turns them into line and column.' },
      { t: 'The span was in a label that `Display` does not print, so `format!("{e}")` lost it', correct: true, why: 'The fix reads `e.labels.first()` and appends `(line:column)`.' },
    ],
  },
  {
    q: 'Why must the Rust CLI count columns in UTF-16 units, when Rust strings are UTF-8?',
    options: [
      { t: 'Because terminals draw UTF-16', why: 'Terminals draw characters; the unit is about matching acorn.' },
      { t: 'Because it must print what the TypeScript CLI prints, and acorn counts JavaScript string units', correct: true, why: 'The same error, the same `(line:column)`, in both engines.' },
      { t: 'Because UTF-8 has no columns', why: 'Any unit can count a column; the question is which one the other engine uses.' },
    ],
  },
  {
    q: 'A source file has 10,000 lines. About how many comparisons does `partition_point` make to find the line of an offset?',
    options: [
      { t: 'About 14', correct: true, why: 'A binary search halves the list each step, and 2 to the 14th is just over 10,000.' },
      { t: 'About 5,000 on average', why: 'That is a search from the start; the starts are sorted, so it can halve.' },
      { t: 'Exactly 1, because it is a lookup table', why: 'It is a sorted list searched by halving, not a table indexed by offset.' },
    ],
  },
];
