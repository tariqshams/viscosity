// Chapter 289 cards. Keys are stable ids: never rename them.

const EDIT = `use std::cmp::Reverse;

// Replace bytes start..end with text.
#[derive(Clone, Debug)]
struct Edit {
    start: usize,
    end: usize,
    text: String,
}
`;

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
  'utf8-offsets': {
    q: 'oxc spans count UTF-8 bytes, acorn’s count UTF-16 units. Why do both engines still cut at the same characters?',
    a: 'Each engine slices its own string with its own unit. A byte offset into the Rust `String` and a UTF-16 offset into the JS string name the same character.',
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
};

export const exercises = {
  splice: {
    lang: 'rust',
    title: 'Apply the edits',
    prompt:
      'Write `apply`, the heart of `emit_js`: return `src` with every edit applied. Offsets are byte offsets into the original `src`. Edits may come in any order; apply them from the largest `start` down. Two edits may touch (one ends where the next starts), but if one overlaps an edit already applied, return `Err` instead.',
    starter: `${EDIT}
fn apply(src: &str, edits: &[Edit])
    -> Result<String, String> {
    todo!()
}`,
    solution: `${EDIT}
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
    walkthrough: `This is the loop at the end of \`emit_js\` in \`engine/rust/crates/frontend-js/src/emit.rs\`, with \`usize\` offsets, a \`String\` error, and only the first part of its sort key (the real one also orders edits that start at the same byte).

- **Sort backwards.** \`Reverse(e.start)\` makes the largest start come first. Each replacement moves only the text after it, and every edit still to come is before it, so its offsets still describe the original text exactly.
- **Replace in place.** \`replace_range\` works on bytes, like oxc’s spans, so \`offsets_are_bytes\` passes without any conversion: \`find\` also returns a byte offset. A range that cut through \`é\` would panic, which is a loud way to find an offset bug.
- **Overlaps.** After applying an edit that starts at \`last\`, any later edit must end at or before \`last\`. \`e.end > last\` means it reaches into text that has already been replaced, and those bytes no longer mean what the edit thinks.

The sort is stable, so edits with equal keys keep their order. The real emitter relies on that to match the TypeScript engine, whose \`Array.prototype.sort\` is stable too.`,
    wrong: [
      {
        code: `${EDIT}
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
        code: `${EDIT}
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
      { t: 'VIR can’t represent all of JavaScript', why: 'True for unmodelled code, but that isn’t why. Even modelled code is copied as written.' },
      { t: 'Printing would lose the programmer’s comments and formatting; range edits keep every byte outside the rewritten parts', correct: true, why: 'That is the first paragraph of `emit.rs`.' },
      { t: 'Rust has no string formatting', why: 'It has `format!` and `fmt::Write`.' },
    ],
  },
  {
    q: 'Three edits start at bytes 11, 23 and 39. In which order does `emit_js` apply them?',
    options: [
      { t: '11, 23, 39', why: 'Then the first edit would shift the text under the other two.' },
      { t: 'In the order they were collected', why: 'They are sorted first.' },
      { t: '39, 23, 11', correct: true, why: 'Back to front, so earlier offsets stay valid.' },
      { t: 'Any order: offsets are adjusted after each edit', why: 'Nothing is adjusted; the order makes adjusting unnecessary.' },
    ],
  },
  {
    q: 'The source starts with `// é` and then the code to rewrite. oxc gives the code’s offset in bytes; acorn gives it in UTF-16 units. What does the port do?',
    options: [
      { t: 'Converts every span to UTF-16 before splicing', why: 'It doesn’t need to. `lines::utf16_offset` exists, but only for handing spans to JavaScript tools.' },
      { t: 'Splices the Rust `String` at byte offsets, which cut at the same characters', correct: true, why: '`tests/extra/unicode_offsets.js` checks this with accents, emoji and U+2028.' },
      { t: 'Rejects non-ASCII source', why: 'Non-ASCII source compiles, byte-identically to the TS engine.' },
    ],
  },
  {
    q: 'Which line makes `write!(s, "class {cls} {{")` compile when `s` is a `String`?',
    options: [
      { t: '`use std::io::Write;`', why: 'That trait is for byte streams, and `String` doesn’t implement it.' },
      { t: '`let mut s = String::with_capacity(64);`', why: 'Capacity isn’t the problem; the trait isn’t in scope.' },
      { t: '`use std::fmt::Write;`', correct: true, why: '`String` implements `fmt::Write`; the method is usable once the trait is in scope.' },
      { t: 'None: `write!` only works on files', why: 'It works on anything with a `write_fmt` method, including `String` through `fmt::Write`.' },
    ],
  },
  {
    q: 'What does the `{{` in `"class {cls} {{"` produce?',
    options: [
      { t: 'A literal `{`', correct: true, why: 'Braces are doubled to escape them in format strings.' },
      { t: 'An empty placeholder', why: 'That would be `{}`.' },
      { t: 'A compile error', why: 'It is the standard escape.' },
    ],
  },
  {
    q: 'What did the TS bug with `push({ y: (a, b) })` do, and how is it fixed?',
    options: [
      { t: 'It crashed the emitter; now sequences are refused', why: 'It didn’t crash, and sequences are still compiled.' },
      { t: 'The value was spliced as `a, b`, so `y` received `a`; now a sequence value is put back in parentheses', correct: true, why: 'A sequence expression’s span excludes its parentheses, so the comma split the arguments.' },
      { t: 'It only affected the Rust port', why: 'It was a bug in the reference, found by the port and fixed in both.' },
    ],
  },
];
