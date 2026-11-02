// Chapter 80 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 151, 151.

export const prompts = {
  'only-what-must': {
    q: 'What does the Viscosity emitter copy unchanged from the input?',
    a: 'Everything outside the edited ranges, byte for byte: comments, formatting and unrelated code.',
  },
  'back-to-front': {
    q: 'Why are edits applied from the last start offset to the first?',
    a: 'An edit only shifts text after it. Going backwards, every edit still to come lies before the ones applied, so its offsets are still right.',
  },
  overlap: {
    q: 'How does `emit_js` detect two overlapping edits?',
    a: 'It remembers the previous edit’s start; an edit whose end is past it overlaps, and it returns an internal error.',
  },
  'stable-sort': {
    q: 'Why does it matter that `sort_by_key` is stable?',
    a: 'Edits with equal sort keys keep the order they were added in, as with JavaScript’s sort, so both engines apply them identically.',
  },
  'char-boundary': {
    q: 'What happens if `replace_range` gets a byte offset in the middle of `é`?',
    a: 'It panics: the range must lie on `char` boundaries.',
  },
  'fmt-write': {
    q: 'What is the one required method of `std::fmt::Write`?',
    a: '`write_str(&mut self, s: &str) -> fmt::Result`. `write_char` and `write_fmt` have defaults.',
  },
  'write-needs-use': {
    q: '`write!(s, "...")` on a `String` fails with E0599 “cannot write into `String`”. What is missing?',
    a: '`use std::fmt::Write;` The trait’s method `write_fmt` is only callable when the trait is in scope.',
  },
  'format-is-write': {
    q: 'How does `format!` build its `String`?',
    a: 'It makes a `String` with a capacity estimate and calls `write_fmt` on it: `format!` is `write!` into a fresh string.',
  },
  'string-never-fails': {
    q: 'Why is `.unwrap()` on `write!(s, ...)` safe when `s` is a `String`?',
    a: '`String`’s `fmt::Write` impl just calls `push_str` and returns `Ok(())`.',
  },
  'prelude-position': {
    q: 'Where does the emitter insert the container classes?',
    a: 'After a leading shebang line and a leading `"use strict"` directive, if any: `prelude_position` hand-matches the TS regex for that.',
  },
  'cross-what': {
    q: 'What is a **cross-implementation test**?',
    a: 'Running two implementations of the same thing on the same inputs and requiring the same outputs.',
  },
  'who-writes-fixtures': {
    q: 'Which engine writes the files in `engine/rust/tests/expected`, and with what?',
    a: 'The TypeScript engine, through `scripts/gen_expected.mjs`, run with Node.',
  },
  'why-fixtures': {
    q: 'Why does the Rust test compare against committed files instead of running the TS engine itself?',
    a: '`cargo test` then needs no Node, and any change to the expected output shows up as a reviewable diff.',
  },
  stale: {
    q: 'What does `fixtures_match_the_programs_exactly` catch?',
    a: 'A program with no fixtures, or a fixture left over from a program that no longer exists.',
  },
  'agree-not-right': {
    q: 'Both engines produce the same bytes. What does that not prove?',
    a: 'That the output is correct: they could share a bug. The differential test runs the programs in node to check behaviour.',
  },
  'order-matters': {
    q: 'Why does the port use insertion-ordered maps (`IndexMap`) where the TS uses `Map`?',
    a: 'Iteration order decides the order of `explain` messages and edits. JS `Map` iterates in insertion order; a Rust `HashMap` doesn’t.',
  },
  'js-number': {
    q: 'Why does the port need `vir::js_number`?',
    a: 'Rust’s `{}` prints `1e21` as `1000000000000000000000`; JavaScript prints `1e+21`. Numbers in explain text and code must look like JavaScript’s.',
  },
  'found-bugs': {
    q: 'When the two engines disagree, which one is wrong?',
    a: 'Either, or both. The port turned up ten bugs in the TypeScript reference, including soundness bugs, and each was fixed in both engines.',
  },
};

export const examples = {
  'write-play': {
    lang: 'rust',
    title: 'A container class with fmt::Write',
    code: `use std::fmt::Write;

fn class(cls: &str, cols: &[&str])
    -> String {
    let t = "Float64Array";
    let mut s = String::new();
    writeln!(s, "class {cls} {{")
        .unwrap();
    s += "  constructor(cap) {\\n";
    for c in cols {
        s.push_str("    ");
        writeln!(
            s,
            "this.{c} = new {t}(cap);"
        )
        .unwrap();
    }
    s.push_str("  }\\n}");
    s
}

fn main() {
    let cols = ["x", "vx"];
    let c = class("__Vsc_ps", &cols);
    println!("{c}");
    println!("{} bytes", c.len());
}`,
  },
  'numbers-play': {
    lang: 'rust',
    title: 'A tiny cross-implementation test',
    code: `fn main() {
    // JavaScript's String(x), captured
    // once from Node.
    let x3 = 0.1 + 0.2;
    let fixtures = [
        (x3, "0.30000000000000004"),
        (100.0, "100"),
        (1e21, "1e+21"),
        (1e-7, "1e-7"),
        (-0.0, "0"),
    ];
    let mut bad = 0;
    for (x, want) in fixtures {
        let got = format!("{}", x);
        if got != want {
            bad += 1;
            println!("{want} vs {got}");
        }
    }
    let n = fixtures.len();
    let ok = n - bad;
    println!("{ok} of {n} match");
}`,
  },
};

export const exercises = {
  splice: {
    lang: 'rust',
    title: 'Apply the edits',
    prompt: 'Write `apply`, the heart of `emit_js`: return `src` with every edit applied. Offsets are byte offsets into the original `src`. Edits may come in any order; apply them from the largest `start` down. Two edits may touch (one ends where the next starts), but if one overlaps an edit already applied, return `Err` instead.',
    starter: `use std::cmp::Reverse;

// Replace bytes start..end with text.
#[derive(Clone, Debug)]
struct Edit {
    start: usize,
    end: usize,
    text: String,
}

fn apply(src: &str, edits: &[Edit])
    -> Result<String, String> {
    todo!()
}`,
    solution: `use std::cmp::Reverse;

// Replace bytes start..end with text.
#[derive(Clone, Debug)]
struct Edit {
    start: usize,
    end: usize,
    text: String,
}

fn apply(src: &str, edits: &[Edit])
    -> Result<String, String> {
    let mut es = edits.to_vec();
    es.sort_by_key(|e| {
        Reverse(e.start)
    });
    let mut out = src.to_string();
    let mut last = usize::MAX;
    for e in &es {
        if e.end > last {
            return Err(format!(
                "overlap at {}-{}",
                e.start, e.end
            ));
        }
        out.replace_range(
            e.start..e.end,
            &e.text,
        );
        last = e.start;
    }
    Ok(out)
}`,
    tests: `fn ed(src: &str, find: &str, to: &str)
    -> Edit {
    let start = src.find(find).unwrap();
    Edit {
        start,
        end: start + find.len(),
        text: to.to_string(),
    }
}

const SRC: &str =
    "const ps = [];\\nps.push({ x: 1 });";

#[test]
fn applies_edits_that_change_lengths() {
    let es = vec![
        ed(SRC, "[]", "new P()"),
        ed(SRC, "{ x: 1 }", "1"),
    ];
    assert_eq!(
        apply(SRC, &es).unwrap(),
        "const ps = new P();\\nps.push(1);"
    );
}

#[test]
fn order_of_the_list_does_not_matter() {
    let es = vec![
        ed(SRC, "{ x: 1 }", "1"),
        ed(SRC, "[]", "new P()"),
    ];
    assert_eq!(
        apply(SRC, &es).unwrap(),
        "const ps = new P();\\nps.push(1);"
    );
}

#[test]
fn offsets_are_bytes() {
    let s = "// é😀\\nps[i].x";
    let es = vec![ed(s, "ps[i].x", "ps.x[i]")];
    assert_eq!(
        apply(s, &es).unwrap(),
        "// é😀\\nps.x[i]"
    );
}

#[test]
fn touching_edits_are_fine() {
    let es = vec![
        ed("abcd", "ab", "X"),
        ed("abcd", "cd", "Y"),
    ];
    assert_eq!(apply("abcd", &es).unwrap(), "XY");
}

#[test]
fn overlapping_edits_are_an_error() {
    let es = vec![
        ed("abcd", "abc", "X"),
        ed("abcd", "cd", "Y"),
    ];
    assert!(apply("abcd", &es).is_err());
}`,
    hints: [
      'Copy the edits (`edits.to_vec()`) so you can sort them, and sort with `sort_by_key(|e| Reverse(e.start))`.',
      '`String::replace_range(start..end, &text)` replaces a byte range in place.',
      'Keep the start of the edit you applied last, beginning at `usize::MAX`. The next edit (which starts earlier) overlaps it if its `end` is greater than that start; equal is fine.',
    ],
    walkthrough: `**How to think about it.** Each edit's offsets describe the *original* text. Any edit you apply moves everything after it, so apply the edit furthest along first: then every edit still to come lies before the ones already applied, in text that has not moved. Overlaps are the one thing back-to-front cannot fix, so remember where the last applied edit started and refuse any edit that reaches past it.

**The solution, line by line.**

- \`let mut es = edits.to_vec();\` copies the edits, because the slice is borrowed and sorting needs to change the order.
- \`es.sort_by_key(|e| { Reverse(e.start) });\` sorts by start, largest first: \`Reverse\` flips the comparison. The sort is stable, so edits with the same start keep their order.
- \`let mut out = src.to_string();\` makes the one buffer every edit is applied to.
- \`let mut last = usize::MAX;\` is the start of the edit applied last; before any edit, nothing can overlap, so it starts at the largest number there is.
- \`for e in &es {\` visits the edits in sorted order.
- \`if e.end > last { return Err(...); }\`: this edit starts earlier than the last one, so it must also *end* at or before that start. Ending later means it reaches into text already replaced. Ending exactly at \`last\` is fine: the edits touch but share no byte.
- \`out.replace_range(e.start..e.end, &e.text);\` swaps the bytes in place. The offsets are bytes, as \`find\` in the tests returns, so text such as \`é😀\` before the edit needs no conversion.
- \`last = e.start;\` remembers this edit's start for the next check.
- \`Ok(out)\` returns the edited text.

**Common wrong attempts.**

- Sorting by \`e.start\` front to back: the first edit changes the length of the text, so every later offset points at the wrong place.
- Testing \`e.end >= last\` rejects edits that merely touch, such as replacing \`ab\` and \`cd\` in \`abcd\`.

This is the loop at the end of \`emit_js\` in \`crates/frontend-js/src/emit.rs\`, with \`usize\` offsets, a \`String\` error, and only the first part of its sort key (the real one also orders edits that start at the same byte, by end and then by rank).`,
    wrong: [
      {
        code: `use std::cmp::Reverse;

// Replace bytes start..end with text.
#[derive(Clone, Debug)]
struct Edit {
    start: usize,
    end: usize,
    text: String,
}

fn apply(src: &str, edits: &[Edit])
    -> Result<String, String> {
    let mut es = edits.to_vec();
    es.sort_by_key(|e| e.start);
    let mut out = src.to_string();
    for e in &es {
        out.replace_range(
            e.start..e.end,
            &e.text,
        );
    }
    Ok(out)
}`,
        why: 'Front to back: the first edit changes the length of the text, so every later offset points at the wrong place (and there is no overlap check).',
      },
      {
        code: `use std::cmp::Reverse;

// Replace bytes start..end with text.
#[derive(Clone, Debug)]
struct Edit {
    start: usize,
    end: usize,
    text: String,
}

fn apply(src: &str, edits: &[Edit])
    -> Result<String, String> {
    let mut es = edits.to_vec();
    es.sort_by_key(|e| {
        Reverse(e.start)
    });
    let mut out = src.to_string();
    let mut last = usize::MAX;
    for e in &es {
        if e.end >= last {
            return Err(
                "overlap".into(),
            );
        }
        out.replace_range(
            e.start..e.end,
            &e.text,
        );
        last = e.start;
    }
    Ok(out)
}`,
        why: '`>=` also rejects edits that merely touch. One ending exactly where the next begins is fine (`a` then `b` in `ab`).',
      },
    ],
  },
  firstDiff: {
    lang: 'rust',
    title: 'Where do they differ?',
    prompt: 'A parity failure should say *where* the outputs differ. Write `first_difference(want, got)`: `None` if the texts are equal. Otherwise compare them line by line (`.lines()`) and, at the first differing line, return `line_msg(n, w, g)` with the 1-based line number. If every line they share is equal, the texts differ in length (a missing line, or only a final newline): return `"lengths: A vs B bytes"`.',
    starter: `// The message for differing line n.
fn line_msg(n: usize, w: &str, g: &str)
    -> String {
    format!("line {n}: {w:?} vs {g:?}")
}

fn first_difference(
    want: &str,
    got: &str,
) -> Option<String> {
    todo!()
}`,
    solution: `// The message for differing line n.
fn line_msg(n: usize, w: &str, g: &str)
    -> String {
    format!("line {n}: {w:?} vs {g:?}")
}

fn first_difference(
    want: &str,
    got: &str,
) -> Option<String> {
    if want == got {
        return None;
    }
    let both = want
        .lines()
        .zip(got.lines())
        .enumerate();
    for (i, (w, g)) in both {
        if w != g {
            return Some(line_msg(
                i + 1,
                w,
                g,
            ));
        }
    }
    Some(format!(
        "lengths: {} vs {} bytes",
        want.len(),
        got.len()
    ))
}`,
    tests: `#[test]
fn equal_texts_have_no_difference() {
    assert_eq!(first_difference("a\\nb", "a\\nb"), None);
}

#[test]
fn names_the_first_differing_line() {
    let want = "ps (line 3) {x}\\n  · aos\\n  · x";
    let got = "ps (line 3) {x}\\n  · soa\\n  · y";
    assert_eq!(
        first_difference(want, got).unwrap(),
        "line 2: \\"  · aos\\" vs \\"  · soa\\""
    );
}

#[test]
fn a_missing_last_line_is_a_length() {
    assert_eq!(
        first_difference("a\\nb\\nc", "a\\nb").unwrap(),
        "lengths: 5 vs 3 bytes"
    );
}

#[test]
fn a_final_newline_counts() {
    assert_eq!(
        first_difference("a\\n", "a").unwrap(),
        "lengths: 2 vs 1 bytes"
    );
}

#[test]
fn trailing_spaces_are_a_difference() {
    let d = first_difference("x = 1", "x = 1 ");
    assert_eq!(
        d.unwrap(),
        "line 1: \\"x = 1\\" vs \\"x = 1 \\""
    );
}`,
    hints: [
      'Start with `if want == got { return None; }`: everything after that knows the texts differ.',
      '`want.lines().zip(got.lines()).enumerate()` gives `(i, (w, g))`, stopping at the shorter text. The line number is `i + 1`.',
      'If the loop finishes, all shared lines were equal, so the difference is in length: format the two `.len()` values.',
    ],
    walkthrough: `**How to think about it.** There are exactly three situations, and it helps to name them before writing anything: the texts are equal (say nothing), some line they share differs (say which, with both versions), or every shared line is equal but one text is longer (say so, with the byte lengths). The order matters: check equality first, then look for a differing line, and only if none is found fall back to the lengths. This is \`first_difference\` from \`engine/rust/crates/cli/tests/parity.rs\`, changed to return an \`Option\` so that it can also say "no difference".

**The solution, line by line.**

- \`fn first_difference(want: &str, got: &str) -> Option<String> {\` takes two borrowed string slices (the function only reads them) and returns either \`None\` or \`Some\` message.
- \`if want == got { return None; }\` handles the easy case first; comparing two \`&str\`s with \`==\` compares every byte. Everything after this line knows the texts differ somewhere.
- \`let both = want.lines().zip(got.lines()).enumerate();\` builds an iterator: \`.lines()\` splits each text at line breaks, \`.zip\` pairs the first line of \`want\` with the first of \`got\`, and so on, and \`.enumerate()\` adds a counter from 0, so each item is \`(i, (w, g))\`.
- \`for (i, (w, g)) in both {\` walks those pairs; the pattern unpacks the counter and both lines at once.
- \`if w != g { return Some(line_msg(i + 1, w, g)); }\` stops at the first pair that differs. \`i + 1\` turns the 0-based counter into a 1-based line number, the way editors count, and \`line_msg\` (given) formats it with \`{:?}\`, which puts quotes round each line so a trailing space is visible.
- After the loop, \`Some(format!("lengths: {} vs {} bytes", want.len(), got.len()))\` is reached only when every shared line was equal. Since the texts are not equal, one of them must have more: an extra line, or only a final newline (\`.lines()\` ignores a final newline, so \`"a\\n"\` and \`"a"\` have the same lines). \`.len()\` on a \`&str\` counts bytes.

**Common wrong attempts.**

- Returning \`None\` after the loop. \`zip\` stops at the shorter iterator, so a missing last line never shows up inside the loop, and the function then calls two different texts equal. The contract is byte for byte, so that would hide a real failure.
- Passing \`i\` instead of \`i + 1\`: the message points one line too early, and someone opening the fixture in an editor looks at the wrong line.
- Comparing with \`trim()\` "to be safe": trailing spaces and newlines are part of the output, and a fixture that differs only there is still a failure.

The real test collects one such message per differing file and fails once with all of them, as in \`4 of 190 differ:\` followed by the list.`,
    wrong: [
      {
        code: `// The message for differing line n.
fn line_msg(n: usize, w: &str, g: &str)
    -> String {
    format!("line {n}: {w:?} vs {g:?}")
}

fn first_difference(
    want: &str,
    got: &str,
) -> Option<String> {
    let both = want
        .lines()
        .zip(got.lines())
        .enumerate();
    for (i, (w, g)) in both {
        if w != g {
            return Some(line_msg(
                i + 1,
                w,
                g,
            ));
        }
    }
    None
}`,
        why: 'When every shared line is equal it returns `None`, so a missing line or a missing final newline passes as “equal”.',
      },
      {
        code: `// The message for differing line n.
fn line_msg(n: usize, w: &str, g: &str)
    -> String {
    format!("line {n}: {w:?} vs {g:?}")
}

fn first_difference(
    want: &str,
    got: &str,
) -> Option<String> {
    if want == got {
        return None;
    }
    let both = want
        .lines()
        .zip(got.lines())
        .enumerate();
    for (i, (w, g)) in both {
        if w != g {
            return Some(line_msg(
                i,
                w,
                g,
            ));
        }
    }
    Some(format!(
        "lengths: {} vs {} bytes",
        want.len(),
        got.len()
    ))
}`,
        why: '`enumerate` counts from 0, but line numbers (and editors) count from 1: the message points one line too early.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why doesn’t Viscosity print the whole program from its IR?',
    options: [
      {
        t: 'VIR can’t represent all of JavaScript',
        why: 'True for unmodelled code, but that isn’t why. Even modelled code is copied as written.',
      },
      {
        t: 'Printing would lose the programmer’s comments and formatting; range edits keep every byte outside the rewritten parts',
        correct: true,
        why: 'That is the first paragraph of `emit.rs`.',
      },
      {
        t: 'Rust has no string formatting',
        why: 'It has `format!` and `fmt::Write`.',
      },
    ],
  },
  {
    q: 'Three edits start at bytes 11, 23 and 39. In which order does `emit_js` apply them?',
    options: [
      {
        t: '11, 23, 39',
        why: 'Then the first edit would shift the text under the other two.',
      },
      {
        t: 'In the order they were collected',
        why: 'They are sorted first.',
      },
      {
        t: '39, 23, 11',
        correct: true,
        why: 'Back to front, so earlier offsets stay valid.',
      },
      {
        t: 'Any order: offsets are adjusted after each edit',
        why: 'Nothing is adjusted; the order makes adjusting unnecessary.',
      },
    ],
  },
  {
    q: 'The source starts with `// é` and then the code to rewrite. oxc gives the code’s offset in bytes; acorn gives it in UTF-16 units. What does the port do?',
    options: [
      {
        t: 'Converts every span to UTF-16 before splicing',
        why: 'It doesn’t need to. `lines::utf16_offset` exists, but only for handing spans to JavaScript tools.',
      },
      {
        t: 'Splices the Rust `String` at byte offsets, which cut at the same characters',
        correct: true,
        why: '`tests/extra/unicode_offsets.js` checks this with accents, emoji and U+2028.',
      },
      {
        t: 'Rejects non-ASCII source',
        why: 'Non-ASCII source compiles, byte-identically to the TS engine.',
      },
    ],
  },
  {
    q: 'Which line makes `write!(s, "class {cls} {{")` compile when `s` is a `String`?',
    options: [
      {
        t: '`use std::io::Write;`',
        why: 'That trait is for byte streams, and `String` doesn’t implement it.',
      },
      {
        t: '`let mut s = String::with_capacity(64);`',
        why: 'Capacity isn’t the problem; the trait isn’t in scope.',
      },
      {
        t: '`use std::fmt::Write;`',
        correct: true,
        why: '`String` implements `fmt::Write`; the method is usable once the trait is in scope.',
      },
      {
        t: 'None: `write!` only works on files',
        why: 'It works on anything with a `write_fmt` method, including `String` through `fmt::Write`.',
      },
    ],
  },
  {
    q: 'What does the `{{` in `"class {cls} {{"` produce?',
    options: [
      {
        t: 'A literal `{`',
        correct: true,
        why: 'Braces are doubled to escape them in format strings.',
      },
      {
        t: 'An empty placeholder',
        why: 'That would be `{}`.',
      },
      {
        t: 'A compile error',
        why: 'It is the standard escape.',
      },
    ],
  },
  {
    q: 'What did the TS bug with `push({ y: (a, b) })` do, and how is it fixed?',
    options: [
      {
        t: 'It crashed the emitter; now sequences are refused',
        why: 'It didn’t crash, and sequences are still compiled.',
      },
      {
        t: 'The value was spliced as `a, b`, so `y` received `a`; now a sequence value is put back in parentheses',
        correct: true,
        why: 'A sequence expression’s span excludes its parentheses, so the comma split the arguments.',
      },
      {
        t: 'It only affected the Rust port',
        why: 'It was a bug in the reference, found by the port and fixed in both.',
      },
    ],
  },
  {
    q: 'What exactly does `rust_output_equals_typescript_output` compare?',
    options: [
      {
        t: 'Whether both compiled programs print the same thing',
        why: 'That is the differential test.',
      },
      {
        t: 'The layout decision for each collection',
        why: 'Decisions are checked too, against corpus headers, but this test compares much more.',
      },
      {
        t: 'For every program and both bounds modes, the Rust engine’s code and explain text against the TS engine’s fixtures, byte for byte',
        correct: true,
        why: 'Two variants per program, two files per variant.',
      },
      {
        t: 'The VIR of both engines',
        why: 'VIR is internal; only the outputs are compared.',
      },
    ],
  },
  {
    q: 'Why are the fixtures generated by a Node script and committed, rather than produced by running the TS engine inside `cargo test`?',
    options: [
      {
        t: 'Cargo can’t run other programs',
        why: 'Cargo tests do run programs: the differential test runs `node`.',
      },
      {
        t: 'The parity test then doesn’t need Node, and every change to the expected output is a diff someone can review',
        correct: true,
        why: 'After the reference changes, you rerun `node scripts/gen_expected.mjs` and look at the diff.',
      },
      {
        t: 'The TS engine is too slow to run in tests',
        why: 'Once warm it takes about a millisecond per benchmark program (engine/rust/results/compile-speed-2026-10-31.md); speed is not the reason.',
      },
    ],
  },
  {
    q: 'One line was removed from the Rust builder (the `throw` case of trivial-phi removal). What did the tests report?',
    options: [
      {
        t: 'Nothing: the change was harmless',
        why: 'It changed a layout decision.',
      },
      {
        t: 'Only a compile error',
        why: 'It compiles fine; it is a logic change.',
      },
      {
        t: 'Parity failed on `corpus_throw_from_loop` (4 files), and the differential test showed the compiled program throwing a number',
        correct: true,
        why: 'The original printed `object 1`, the compiled one `number undefined`.',
      },
      {
        t: 'Every fixture failed',
        why: 'Only the one program with a `throw` inside a loop changed.',
      },
    ],
  },
  {
    q: 'Rust’s `format!("{}", 1e21)` gives `1000000000000000000000`. What does the port do about it?',
    options: [
      {
        t: 'Formats numbers with `vir::js_number`, which follows JavaScript’s Number-to-string algorithm',
        correct: true,
        why: 'Explain text and generated code interpolate numbers the way JS template literals do.',
      },
      {
        t: 'Avoids printing numbers',
        why: 'Sizes and block sizes appear in explain text and code.',
      },
      {
        t: 'Calls Node to format them',
        why: 'The port runs without Node, even in wasm.',
      },
    ],
  },
  {
    q: 'Why does the port keep the reference’s insertion-ordered maps, stable sorts and use lists with duplicates?',
    options: [
      {
        t: 'They are faster in Rust',
        why: 'Speed isn’t the reason; a `HashMap` would often be faster.',
      },
      {
        t: 'The Rust standard library has no other kinds',
        why: 'It has `HashMap`, `BTreeMap`, unstable sorts and more.',
      },
      {
        t: 'The order in which things are visited decides the order of explain messages and edits, so it must match exactly',
        correct: true,
        why: 'Same decisions in a different order would still fail byte-for-byte parity.',
      },
    ],
  },
];
