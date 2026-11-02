// Chapter 151 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'back-to-front': {
    q: 'Why are edits applied from the last start offset to the first?',
    a: 'An edit only shifts text after it. Going backwards, every edit still to come lies before the ones applied, so its offsets are still right.',
  },
  overlap: {
    q: 'How does `emit_js` detect two overlapping edits?',
    a: 'It remembers the previous edit’s start; an edit whose end is past it overlaps, and it returns an internal error.',
  },
  'fmt-write': {
    q: 'What is the one required method of `std::fmt::Write`?',
    a: '`write_str(&mut self, s: &str) -> fmt::Result`. `write_char` and `write_fmt` have defaults.',
  },
  'write-needs-use': {
    q: '`write!(s, "...")` on a `String` fails with E0599 “cannot write into `String`”. What is missing?',
    a: '`use std::fmt::Write;` The trait’s method `write_fmt` is only callable when the trait is in scope.',
  },
  'cross-what': {
    q: 'What is a **cross-implementation test**?',
    a: 'Running two implementations of the same thing on the same inputs and requiring the same outputs.',
  },
  'who-writes-fixtures': {
    q: 'Which engine writes the files in `engine/rust/tests/expected`, and with what?',
    a: 'The TypeScript engine, through `scripts/gen_expected.mjs`, run with Node.',
  },
  'agree-not-right': {
    q: 'Both engines produce the same bytes. What does that not prove?',
    a: 'That the output is correct: they could share a bug. The differential test runs the programs in node to check behaviour.',
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
];
