// Chapter 317 cards. Keys are stable ids: never rename them.

export const prompts = {
  'oxc-what': {
    q: 'What is oxc?',
    a: 'The Oxidation Compiler: a set of JavaScript and TypeScript tools written in Rust (parser, linter, formatter, transformer, minifier). The port uses its parser and AST.',
  },
  'oxc-inputs': {
    q: 'What three things does oxc’s `Parser::new` take?',
    a: 'An `Allocator` (the memory arena), the source text, and a `SourceType` (the port uses `SourceType::mjs()`, acorn’s `sourceType: \'module\'`).',
  },
  'oxc-errors': {
    q: 'How does oxc report a syntax error, compared with acorn?',
    a: 'As data: `ret.diagnostics` lists the errors and parsing still returns. acorn throws. The port turns the first error into a `CompileError`.',
  },
  'oxc-arena': {
    q: 'Where do oxc’s AST nodes live, and what is the `Box` in `Box<\'a, BinaryExpression<\'a>>`?',
    a: 'In the `Allocator`, a bump arena. That `Box` is oxc’s arena box: a pointer into the arena, not std’s heap `Box`.',
  },
  'oxc-nodrop': {
    q: 'What happens to individual nodes when an oxc allocator is dropped?',
    a: 'Nothing: they are never dropped one by one. The arena’s memory is released in bulk, which is why types that implement `Drop` are refused at compile time.',
  },
  'oxc-lifetime': {
    q: 'Why can’t the port store oxc’s `Program<\'a>` in the VIR `Module`?',
    a: '`\'a` borrows the allocator, a local of `lower`, so the tree can’t outlive `lower`. The port keeps spans and a side table of node facts instead.',
  },
  'oxc-units': {
    q: 'What do acorn’s offsets count, and what do oxc’s spans count?',
    a: 'acorn: UTF-16 code units (JavaScript string indices). oxc: UTF-8 bytes (Rust string indices).',
  },
  'oxc-same-cut': {
    q: 'acorn says 266 and oxc says 286 for the same statement. Why do both engines still splice at the same characters?',
    a: 'Each slices its own string in its own unit: the TS emitter a JavaScript string by code units, the Rust emitter a `String` by bytes.',
  },
  'oxc-lines': {
    q: 'oxc reports no line numbers. Which line breaks does the port count, and why those?',
    a: '`\\n`, `\\r\\n`, a lone `\\r`, U+2028 and U+2029: the ECMAScript line breaks that acorn counts, so `explain` names the same lines.',
  },
  'oxc-semantic': {
    q: 'oxc’s parser alone accepts `let a = 1; let a = 2;`. What makes the Rust engine reject it, as acorn does?',
    a: 'A second pass: oxc’s `SemanticBuilder` with `with_check_syntax_error(true)`, which reports the early errors the parser leaves out.',
  },
};

export const examples = {
  'three-lengths': {
    lang: 'rust',
    title: 'Bytes, chars and UTF-16 code units',
    code: `fn main() {
    let s = "é😀x = 1";
    println!("bytes:  {}", s.len());
    let n = s.chars().count();
    println!("chars:  {n}");
    let u = s.encode_utf16().count();
    println!("UTF-16: {u}");
    let x = s.find('x').unwrap();
    let ux =
        s[..x].encode_utf16().count();
    println!("x: byte {x}, unit {ux}");
    println!("{:?}", &s[x..]);
    // byte 3 is inside the 😀:
    let ok = s.is_char_boundary(3);
    println!("{ok}");
    // so &s[3..] would panic
}`,
  },
};

const DOC = `// The byte offset in src of the
// character at UTF-16 offset off (what
// acorn and JavaScript's slice count).
// off is never inside a character; off
// at the end gives src.len().`;

const SIG = `fn byte_offset(src: &str, off: usize)
    -> usize {`;

export const exercises = {
  byteOffset: {
    lang: 'rust',
    title: 'From acorn offsets to Rust offsets',
    prompt:
      'A JavaScript tool hands you offsets in UTF-16 code units, as acorn reports them. Write `byte_offset`, which turns one into the UTF-8 byte offset of the same character in a Rust `&str`, so that `&src[byte_offset(src, off)..]` starts where JavaScript’s `src.slice(off)` does. `c.len_utf16()` tells you how many code units a `char` takes (1 or 2), and `src.char_indices()` gives each character with its byte offset.',
    starter: `${DOC}
${SIG}
    todo!()
}`,
    solution: `${DOC}
${SIG}
    let mut units = 0;
    for (b, c) in src.char_indices() {
        if units == off {
            return b;
        }
        units += c.len_utf16();
    }
    src.len()
}`,
    tests: `#[test]
fn ascii_offsets_are_the_same() {
    assert_eq!(byte_offset("let x", 4), 4);
}

#[test]
fn accents_take_two_bytes() {
    // é: 1 UTF-16 unit, 2 bytes
    assert_eq!(byte_offset("é = 1", 2), 3);
}

#[test]
fn emoji_take_two_units_and_four_bytes() {
    let s = "é😀x";
    assert_eq!(byte_offset(s, 1), 2);
    assert_eq!(byte_offset(s, 3), 6);
}

#[test]
fn the_end_maps_to_len() {
    assert_eq!(byte_offset("é😀", 3), 6);
    assert_eq!(byte_offset("", 0), 0);
}

#[test]
fn slices_where_acorn_points() {
    let s = "// Ünïcödé 😀\\nconst ps = [];";
    let at = s.find("const").unwrap();
    let u = s[..at].encode_utf16().count();
    let b = byte_offset(s, u);
    assert!(s[b..].starts_with("const"));
}`,
    hints: [
      'Walk the characters with `src.char_indices()`, which gives `(byte_offset, char)` pairs, and keep a running count of UTF-16 units.',
      'Before adding a character’s units, check whether the count has reached `off`: if so, this character’s byte offset is the answer.',
      'If the loop ends, `off` is the end of the string, so return `src.len()`. A 😀 adds 2 to the count (`len_utf16()`), an `é` adds 1.',
    ],
    walkthrough: `Two counters move together: the byte offset, which \`char_indices\` hands you, and the UTF-16 offset, which you add up yourself.

- **ASCII** characters are one byte and one code unit, so the two counters agree. That is why most code never notices the difference.
- **é** (U+00E9) is two bytes in UTF-8 but one code unit in UTF-16: after it, the byte counter is one ahead.
- **😀** (U+1F600) is outside the Basic Multilingual Plane: four bytes in UTF-8, and two code units (a surrogate pair) in UTF-16. \`len_utf16()\` returns 2 for it.

Checking \`units == off\` *before* adding the current character's units means you return the byte offset where that character starts. If no character starts there, the offset is the end of the string, \`src.len()\`.

The port has the opposite function, \`lines::utf16_offset\`, which counts \`source[..offset].encode_utf16()\`. Inside the engine neither is needed: each engine slices its own string in its own unit. Conversions matter only at the border, when offsets cross from one language to the other.`,
    wrong: [
      {
        code: `${DOC}
${SIG}
    match src.char_indices().nth(off) {
        Some((b, _)) => b,
        None => src.len(),
    }
}`,
        why: 'This treats the offset as a count of `char`s. That works for `é`, but a 😀 is one `char` and two UTF-16 code units, so every offset after an emoji lands one character too far.',
      },
      {
        code: `${DOC}
${SIG}
    off.min(src.len())
}`,
        why: 'UTF-16 offsets are not byte offsets. They agree only while the text is ASCII; after `é` the byte offset is already one larger.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'For `const ps = [];` in `unicode_offsets.js`, acorn reports 266 and oxc 286. Which is right?',
    options: [
      { t: 'acorn: oxc miscounts non-ASCII text', why: 'oxc counts bytes correctly; `&src[286..300]` is exactly `const ps = [];`.' },
      { t: 'Both: acorn counts UTF-16 code units, oxc counts UTF-8 bytes', correct: true, why: 'The accented letters, emoji and line-separator characters before it take more bytes than code units.' },
      { t: 'oxc: acorn skips comments when counting', why: 'acorn counts every code unit, comments included.' },
      { t: 'Neither: offsets should count characters', why: 'Neither language indexes strings by characters; each uses its own unit.' },
    ],
  },
  {
    q: 'What happens if the Rust emitter slices its `String` with acorn’s offsets 266..280?',
    options: [
      { t: 'It gets the same text, because Rust converts offsets automatically', why: 'Rust indexes `str` by bytes and never converts.' },
      { t: 'It gets `"9, and a line "`, the wrong text, and an offset inside a character would panic', correct: true, why: 'Byte 266 is twenty bytes before the statement. A slice must start and end on a character boundary.' },
      { t: 'It fails to compile', why: 'The offsets are run-time numbers; the compiler can’t check them.' },
    ],
  },
  {
    q: 'Why does the Rust port keep no oxc AST after `lower` returns?',
    options: [
      { t: 'The tree is `Program<\'a>`, borrowing an allocator that is a local of `lower`, so it can’t outlive `lower`', correct: true, why: 'The port keeps spans (plain `u32` pairs) and a side table of node facts instead.' },
      { t: 'oxc deletes the tree as soon as parsing finishes', why: 'The tree lives as long as the allocator; the port drops the allocator when `lower` ends.' },
      { t: 'The emitter re-parses the source', why: 'It doesn’t need to: it splices byte ranges it already has.' },
    ],
  },
  {
    q: 'What does oxc’s `Allocator` do when it is dropped?',
    options: [
      { t: 'Runs `Drop` for every node, in reverse order', why: 'Nodes in the arena are never dropped individually.' },
      { t: 'Moves the nodes to the normal heap', why: 'Nothing is moved; the memory is simply returned.' },
      { t: 'Nothing until the program exits', why: 'Its chunks are returned when it is dropped.' },
      { t: 'Releases its memory in bulk without dropping individual nodes', correct: true, why: 'That is why it refuses `Drop` types at compile time: their own allocations would leak.' },
    ],
  },
  {
    q: 'oxc reports no line numbers. How does `explain` still say "loop at line 6"?',
    options: [
      { t: 'It counts `\\n` characters only', why: 'acorn also counts `\\r`, `\\r\\n`, U+2028 and U+2029, and the port must match it.' },
      { t: 'The plugin counts them with `LineIndex`, at every ECMAScript line break, as acorn does', correct: true, why: '`LineIndex` records where each line starts and maps a byte offset to its line.' },
      { t: 'It calls acorn through Node to get them', why: 'The Rust engine doesn’t run JavaScript to compile.' },
    ],
  },
  {
    q: 'Which statement about early errors in the port is true?',
    options: [
      { t: 'oxc’s parser alone reports every early error acorn reports', why: 'Of the twelve early-error programs tried, acorn rejected eleven and oxc’s parser alone only one.' },
      { t: 'Both engines report every early error at the same line and column', why: 'oxc anchors some on a different token: for `let a = 1; let a = 2;` Rust says (1:4) and acorn (1:15).' },
      { t: 'After parsing, the port runs oxc’s semantic syntax checks, so a redeclared `let` is rejected by both engines', correct: true, why: 'That pass was added after this chapter was first written; before it, the Rust engine compiled the file.' },
    ],
  },
];
