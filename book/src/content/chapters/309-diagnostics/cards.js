// Chapter 309 cards. Keys are stable ids: never rename them.

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
  'dg-parts': {
    q: 'Which parts does rustc’s guide list for an error diagnostic?',
    a: 'A level, an optional error code, a message that stands on its own, and a window: file, line and column of the primary span, the code, and labelled spans.',
  },
  'dg-missing': {
    q: 'What does `viscosity explain --frames` print that a syntax error from the Rust CLI lacks?',
    a: 'A picture: the source line and carets under the span. The syntax error has a message and a `(line:col)`, nothing more.',
  },
  'dg-once': {
    q: 'Where is a refusal’s source position created in engine/rust?',
    a: 'Once, during lowering: `Lowerer::src` turns oxc’s span into a `SourceRef` (start, end, line) on the instruction. Later passes only carry it.',
  },
  'dg-same-line': {
    q: 'Why can the line in “line 6: an element is used by push” never disagree with the frame under it?',
    a: 'Both come from the same instruction’s `SourceRef`: its `line` goes into the message, and its start and end into the frame.',
  },
  'dg-forof': {
    q: 'Why does the frame for `for (const p of ps) keep.push(p);` underline the whole line?',
    a: 'The element `p` is made by the `for...of` statement, so its `SourceRef` is the whole statement. Both engines report that span.',
  },
  'dg-usage': {
    q: 'When does the CLI print its help text after an error?',
    a: 'Only for a usage error, when the command line itself was wrong (unknown option, missing file name, bad --jobs). Never for a problem in a file.',
  },
  'dg-exit': {
    q: 'What exit status does `viscosity explain bad.js` give for a syntax error, and what for an unknown option?',
    a: '1 for both (`ExitCode::FAILURE`). Only the help text tells them apart.',
  },
  'dg-multi': {
    q: 'With several files, what happens when one of them fails?',
    a: 'It is reported as `viscosity: <file>: <error>`, the others are still printed, and the exit status is 1 at the end.',
  },
  'dg-oxc-label': {
    q: 'oxc builds “Unexpected token” with `.with_label(span)`. Why did the Rust CLI once print no position?',
    a: '`OxcDiagnostic`’s `Display` prints only the message, and the plugin formatted it with `format!("SyntaxError: {e}")`, dropping the label. Now `syntax_error` adds the label’s `(line:col)`.',
  },
  'dg-acorn-col': {
    q: 'For `const s = "🎉"; [;`, why does acorn say column 17 when the `;` is byte 19?',
    a: 'acorn counts UTF-16 units. 🎉 is 4 bytes in UTF-8 but 2 UTF-16 units, so the column is 2 less than the byte offset.',
  },
};

export const examples = {
  'cli-errors': {
    lang: 'rust',
    title: 'Two kinds of failure, one exit code',
    code: `use std::process::ExitCode;

const HELP: &str = "Usage: ...";

enum CliError {
    Usage(String),
    Other(String),
}

// What main prints on stderr
fn report(e: &CliError) -> String {
    match e {
        CliError::Usage(m) => format!(
            "viscosity: {m}\\n\\n{HELP}"
        ),
        CliError::Other(m) => {
            format!("viscosity: {m}")
        }
    }
}

fn main() -> ExitCode {
    let fails = [
        CliError::Usage(
            "unknown option --colour"
                .into(),
        ),
        CliError::Other(
            "Unexpected token (1:12)"
                .into(),
        ),
    ];
    for e in &fails {
        println!("{}", report(e));
        println!("(exit status 1)\\n");
    }
    ExitCode::SUCCESS
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
    walkthrough: `Three units meet in this function, which is why it is easy to get almost right.

- **Bytes** are what oxc’s spans and Rust’s \`&str\` indexes count, so the input \`at\` is a byte offset, and \`char_indices\` gives the byte offset of each char.
- **UTF-16 units** are what JavaScript strings, and so acorn’s columns, count. \`c.len_utf16()\` is 1 for é and 2 for 🎉 (a surrogate pair). Using \`len_utf8()\` gets the emoji and the accent wrong; counting 1 per char (code points, as the frames do) gets only the emoji wrong.
- **Lines** follow ECMAScript’s line terminators, the same ones \`lines::LineIndex\` counts, with \`\\r\\n\` as one break. Forgetting that makes every CRLF file’s lines double.

The column restarts after each break, so only the units on the error’s own line matter. With a function like this (\`LineIndex::line_column\` in the port), the plugin prints acorn’s \`(line:column)\` from the start of oxc’s label span.`,
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
    q: 'Which of these is a diagnostic in this chapter’s sense?',
    options: [
      { t: '`viscosity: SyntaxError: Unexpected token`, as the CLI once printed it', why: 'It has a message but no position.' },
      { t: '`viscosity: No such file or directory (os error 2)`, as it once was', why: 'It doesn’t even name the file.' },
      { t: 'An `unsafe:` reason with its code frame', correct: true, why: 'A message plus a span, drawn as a line number, the code and carets.' },
    ],
  },
  {
    q: 'For `viscosity explain --colour a.js`, what does the Rust CLI do?',
    options: [
      { t: 'Prints “unknown option --colour”, then the help text, and exits with 1', correct: true, why: 'A usage error: the command line itself was wrong.' },
      { t: 'Ignores the option and explains a.js', why: 'Unknown options are errors.' },
      { t: 'Prints “unknown option --colour” and exits with 2', why: 'Every failure exits with 1 (`ExitCode::FAILURE`).' },
      { t: 'Prints only the help text', why: 'The message comes first, then the help.' },
    ],
  },
  {
    q: 'Why doesn’t a syntax error get the help text?',
    options: [
      { t: 'Because the help text is too long for stderr', why: 'Length isn’t the reason.' },
      { t: 'Because the problem is in the file, not the command line, and thirty lines of options would bury the message', correct: true, why: 'Only `CliError::Usage` prints `HELP`.' },
      { t: 'Because syntax errors exit with a different status', why: 'Both exit with 1.' },
    ],
  },
  {
    q: 'Where does the “line 6” in “line 6: an element is used by push” come from?',
    options: [
      { t: 'From counting line breaks again when explain runs', why: 'The line is computed once, when the SourceRef is made.' },
      { t: 'From the `SourceRef` that lowering put on the `ps[i]` instruction', correct: true, why: 'The same SourceRef gives the frame its span.' },
      { t: 'From oxc, which reports line numbers', why: 'oxc reports byte offsets only; `LineIndex` computes lines.' },
    ],
  },
  {
    q: 'Running `viscosity explain a.js bad.js b.js`, where bad.js has a syntax error: what happens?',
    options: [
      { t: 'Nothing is printed and the status is 1', why: 'The other files are still explained.' },
      { t: 'a.js and b.js are explained, `viscosity: bad.js: Unexpected token (1:12)` goes to stderr, and the status is 1', correct: true, why: 'Each failing file costs only itself; the status records that something failed.' },
      { t: 'a.js is explained, then the run stops', why: 'A failing file doesn’t stop the others.' },
    ],
  },
  {
    q: 'In `"let é = [;"`, the `;` is byte 10. Which column does acorn report?',
    options: [
      { t: '10', why: 'That is the byte offset; é is 2 bytes.' },
      { t: '9', correct: true, why: 'é is one UTF-16 unit, so `(1:9)`.' },
      { t: '8', why: 'That would count é as zero units.' },
    ],
  },
];
