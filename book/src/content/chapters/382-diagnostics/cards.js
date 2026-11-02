// Chapter 382 cards. Keys are stable ids: never rename them.

const SOL = `// The caret line under a span, as
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
}`;

export const prompts = {
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
};

export const examples = {
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
};

export const exercises = {
  caretLine: {
    lang: 'rust',
    title: 'The caret line',
    prompt:
      'Write `underline(before, width)`, the second line of a code frame. `before` is the text of the source line from its start up to the span, and `width` is how many characters the span covers. Return a pad, then `width` carets (`^`), and at least one caret even when `width` is 0. In the pad, every tab of `before` stays a tab, and every other character, whatever it is, becomes one space.',
    starter: `fn underline(
    before: &str,
    width: usize,
) -> String {
    todo!()
}`,
    solution: SOL,
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
        code: SOL.replace("            '\\t' => '\\t',\n", ''),
        why: 'Every tab becomes a space, so in a terminal that draws tabs wider the carets slide left of the code.',
      },
      {
        code: SOL.replace('width.max(1)', 'width'),
        why: 'An empty span gets no caret at all, so the frame points at nothing.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which of these is a diagnostic in this chapter’s sense?',
    options: [
      { t: '`viscosity: SyntaxError: Unexpected token`, as the CLI once printed it', why: 'It has a message but no position.' },
      { t: 'An `unsafe:` reason with its code frame', correct: true, why: 'A message plus a span, drawn as a line number, the code and carets.' },
      { t: '`viscosity: No such file or directory (os error 2)`, as it once was', why: 'It did not even name the file.' },
    ],
  },
  {
    q: 'Where does the “line 6” in “line 6: an element is used by push” come from?',
    options: [
      { t: 'From oxc, which reports line numbers', why: 'oxc reports byte offsets only; `LineIndex` works out lines.' },
      { t: 'From counting line breaks again when explain runs', why: 'The line is worked out once, when the SourceRef is made.' },
      { t: 'From the `SourceRef` that lowering put on the `ps[i]` instruction', correct: true, why: 'The same SourceRef gives the frame its span.' },
    ],
  },
  {
    q: 'Which parts does rustc’s E0308 message have that a Viscosity code frame does not?',
    options: [
      { t: 'A level, a code, a file name and a column', correct: true, why: 'The frame has the message, a line number, the code and the carets.' },
      { t: 'A line number and carets', why: 'The frame has both.' },
      { t: 'A message that stands on its own', why: 'Viscosity’s reasons do: “an element is used by push”.' },
    ],
  },
  {
    q: 'A refusal about `for (const p of ps) keep.push(p);` is underlined from the first character to the last. Why?',
    options: [
      { t: 'The frame code cannot underline part of a line', why: 'It underlines `ps[i]` alone in the indexed loop.' },
      { t: 'The element’s SourceRef is the span of the `for...of` statement that made it', correct: true, why: 'A frame is only as precise as its span.' },
      { t: 'oxc gives `for...of` statements no span', why: 'It does: the whole statement, which is the trouble.' },
      { t: 'The line holds a tab', why: 'It holds none; a tab only changes the pad.' },
    ],
  },
  {
    q: 'In `underline`, why are characters counted with `chars()` rather than `len()`?',
    options: [
      { t: 'Because `len()` would include the tabs', why: 'Both count tabs; the difference is bytes against characters.' },
      { t: 'Because `len()` counts bytes, and a character like 🎉 is four bytes but one character', correct: true, why: 'One space per character is what lines up.' },
      { t: 'Because `chars()` is faster', why: 'It is slower, if anything; correctness is the reason.' },
    ],
  },
];
