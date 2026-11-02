// Chapter 365-b cards (Padding and repr, split from chapter 365). Keys are
// stable ids: never rename them. Sizes and messages are rustc 1.97.0 on
// x86-64 Linux.

const ROUND = `
// The next multiple of \`a\` at or
// after \`n\`.
fn round_up(n: usize, a: usize)
    -> usize {
    (n + a - 1) / a * a
}`;

const HEAD = `// Each field is (size, align), in
// declaration order. Return the
// repr(C) struct's (size, align).
fn c_layout(fields: &[(usize, usize)])
    -> (usize, usize) {`;

const LAYOUT = `${HEAD}
    let mut off = 0;
    let mut align = 1;
    for &(size, a) in fields {
        off = round_up(off, a);
        off += size;
        align = align.max(a);
    }
    (round_up(off, align), align)
}
${ROUND}`;

const TESTS_HEAD = `use std::mem::{align_of, size_of};

fn real<T>() -> (usize, usize) {
    (size_of::<T>(), align_of::<T>())
}
`;

export const prompts = {
  'pad-what': {
    q: 'What is padding?',
    a: 'Unused bytes the compiler puts before a field (so it starts aligned) or at the end of a type (so the size is a multiple of the alignment).',
  },
  'tail-pad': {
    q: 'Why does `#[repr(C)] struct C3 { a: u8, b: f64, c: u8 }` end with 7 bytes of padding?',
    a: 'Its size must be a multiple of its alignment, 8, so that in an array the next element’s `b` is aligned too: 17 rounds up to 24.',
  },
  reorder: {
    q: 'The same three fields without `#[repr(C)]` took 16 bytes. Why, and can you rely on it?',
    a: 'The default representation may reorder fields (rustc 1.97 put `b` first, then `a` and `c`). No order or size is promised.',
  },
  'pad-value': {
    q: 'Where does a `Number`’s `f64` sit inside drip-rs’s 16-byte `Value`, and why there?',
    a: 'At offset 8, after the 1-byte tag and 7 bytes of padding, because an `f64` must start at a multiple of 8.',
  },
  'repr-c': {
    q: 'What does `#[repr(C)]` promise?',
    a: 'Fields in declaration order, laid out by C’s rule, so the offsets and size are fixed and match a C struct.',
  },
  'repr-u8': {
    q: 'Why is drip-rs’s `OpCode` enum marked `#[repr(u8)]`?',
    a: 'So each opcode is exactly the one byte that encodes it, and `op as u8` costs nothing.',
  },
  'packed-ref': {
    q: 'Why does rustc refuse `&k.b` when `k` is a `#[repr(C, packed)]` struct with an `f64` at offset 1?',
    a: 'A reference promises an aligned value, and creating a misaligned one is undefined behaviour (error E0793). Copying the field out, `let b = k.b;`, is allowed.',
  },
  'table-soa': {
    q: 'drip-rs’s table stores keys (12 bytes) and values (16 bytes) in two `Vec`s. What would one `Vec` of `(key, value)` pairs cost per slot?',
    a: '32 bytes: 28 rounded up to the pair’s alignment of 8. The two columns cost 28, and probing reads only the keys.',
  },
};

export const exercises = {
  cLayout: {
    lang: 'rust',
    title: 'Lay out a repr(C) struct',
    prompt:
      'Write `c_layout`, which takes the fields of a `#[repr(C)]` struct as `(size, align)` pairs in declaration order and returns the struct’s `(size, align)`, using the rule in this chapter’s formal box. Write the helper `round_up` too. The tests compare your answers with what `size_of` and `align_of` say about real structs.',
    starter: `${HEAD}
    todo!()
}

// The next multiple of \`a\` at or
// after \`n\`.
fn round_up(n: usize, a: usize)
    -> usize {
    todo!()
}`,
    solution: LAYOUT,
    tests: `${TESTS_HEAD}
#[repr(C)]
struct C3 { a: u8, b: f64, c: u8 }

#[repr(C)]
struct Mixed { a: u8, b: u16, c: u32, d: u8 }

#[repr(C)]
struct Pair { lo: u32, hi: u32 }

#[test]
fn rounding_up() {
    assert_eq!(round_up(1, 8), 8);
    assert_eq!(round_up(8, 8), 8);
    assert_eq!(round_up(17, 4), 20);
}

#[test]
fn no_padding_needed() {
    let fs = [(4, 4), (4, 4)];
    assert_eq!(c_layout(&fs), real::<Pair>());
}

#[test]
fn padding_between_fields() {
    let fs = [(1, 1), (2, 2), (4, 4), (1, 1)];
    assert_eq!(c_layout(&fs), real::<Mixed>());
}

#[test]
fn padding_at_the_end() {
    let fs = [(1, 1), (8, 8), (1, 1)];
    assert_eq!(c_layout(&fs), real::<C3>());
    assert_eq!(c_layout(&fs), (24, 8));
}

#[test]
fn empty_struct() {
    assert_eq!(c_layout(&[]), (0, 1));
}`,
    hints: [
      'Do `C3` on paper first, with the diagram: keep a running offset, starting at 0, and place one field at a time.',
      'Before placing each field, round the offset up to that field’s alignment (the gap is padding), then add the field’s size. `round_up` is the last chapter’s `align_up`.',
      'Keep the largest alignment you have seen, starting from 1. That is the struct’s alignment.',
      'At the end, round the offset up once more, to the struct’s alignment: that is the size. Return `(size, align)`.',
    ],
    walkthrough: `**How to think about it.** The Rust Reference describes \`repr(C)\` as a short procedure: walk the fields in order, pad before each one until the offset is a multiple of its alignment, place it, and at the end pad up to a multiple of the largest alignment. A procedure that walks a list while keeping a running total is a loop with two \`let mut\` variables, so start there. Try it on \`C3\` by hand: \`a\` at 0 (offset becomes 1), \`b\` needs a multiple of 8 so it goes at 8 (offset 16), \`c\` at 16 (offset 17), largest alignment 8, so the size is 17 rounded up to 24.

**The solution, line by line.**

- \`fn c_layout(fields: &[(usize, usize)]) -> (usize, usize) {\` borrows a slice of pairs and returns a pair: \`(size, align)\`.
- \`    let mut off = 0;\` is the running offset: where the next field would go.
- \`    let mut align = 1;\` is the largest alignment so far. It starts at 1, not 0, because every type has alignment at least 1; that is also why the empty struct's answer is \`(0, 1)\`.
- \`    for &(size, a) in fields {\` walks the fields in declaration order. The \`&(size, a)\` pattern copies the two numbers out of each borrowed pair.
- \`        off = round_up(off, a);\` adds the padding before the field: if \`off\` is already a multiple of \`a\` it stays put, otherwise it moves to the next multiple.
- \`        off += size;\` places the field; \`off\` is now just past it.
- \`        align = align.max(a);\` remembers the largest alignment.
- \`    (round_up(off, align), align)\` adds the tail padding and returns both numbers.
- \`round_up\`'s body, \`(n + a - 1) / a * a\`, adds just less than one step, then lets integer division throw away the remainder: \`round_up(17, 8)\` is \`24 / 8 * 8\`, which is 24, while \`round_up(8, 8)\` is \`15 / 8 * 8\`, which is 8.

For \`Mixed\` (\`u8, u16, u32, u8\`): \`a\` at 0, one byte of padding, \`b\` at 2, \`c\` at 4, \`d\` at 8, offset 9, rounded up to 12. The tests check every one of these against the compiler's own \`size_of\` and \`align_of\`.

**Common wrong attempts.**

- Forgetting the final \`round_up\` returns 17 for \`C3\`. A size that is not a multiple of the alignment would put the second element of an array at offset 17, and its \`b\` at 25, which is not a multiple of 8.
- Forgetting to round before each field puts \`b\` at offset 1 and gives 16 for \`C3\`. That happens to be the size of the *reordered* default layout, which is a coincidence, not a correct \`repr(C)\` layout.`,
    wrong: [
      {
        code: `${HEAD}
    let mut off = 0;
    let mut align = 1;
    for &(size, a) in fields {
        off = round_up(off, a);
        off += size;
        align = align.max(a);
    }
    (off, align)
}
${ROUND}`,
        why: 'This forgets the tail padding: `C3` comes out as 17. A size must be a multiple of the alignment, or the second element of an array would be misaligned.',
      },
      {
        code: `${HEAD}
    let mut off = 0;
    let mut align = 1;
    for &(size, a) in fields {
        off += size;
        align = align.max(a);
    }
    (round_up(off, align), align)
}
${ROUND}`,
        why: 'Without rounding before each field, `b` would start at offset 1, which is not a multiple of 8. `C3` comes out as 16 instead of 24.',
      },
    ],
  },
  tightLayout: {
    lang: 'rust',
    optional: true,
    title: 'Reorder to shrink',
    prompt:
      'Write `tight`, which returns the smallest `repr(C)` size you can get by reordering the fields: sort a copy of them by alignment, largest first, and lay that out with `c_layout` (given). The tests check it against `repr(C)` structs written in that order.',
    starter: `${LAYOUT}

fn tight(fields: &[(usize, usize)])
    -> usize {
    todo!()
}`,
    solution: `${LAYOUT}

fn tight(fields: &[(usize, usize)])
    -> usize {
    let mut fs = fields.to_vec();
    fs.sort_by(|x, y| y.1.cmp(&x.1));
    c_layout(&fs).0
}`,
    tests: `${TESTS_HEAD}
#[repr(C)]
struct C3Tight { b: f64, a: u8, c: u8 }

#[repr(C)]
struct MixedTight { c: u32, b: u16, a: u8, d: u8 }

#[test]
fn c3_shrinks_to_16() {
    let fs = [(1, 1), (8, 8), (1, 1)];
    assert_eq!(tight(&fs), 16);
    assert_eq!(tight(&fs), real::<C3Tight>().0);
}

#[test]
fn mixed_shrinks_to_8() {
    let fs = [(1, 1), (2, 2), (4, 4), (1, 1)];
    assert_eq!(tight(&fs), real::<MixedTight>().0);
}

#[test]
fn the_input_is_not_changed() {
    let fs = [(1, 1), (8, 8)];
    tight(&fs);
    assert_eq!(fs, [(1, 1), (8, 8)]);
}`,
    hints: [
      'You may not sort `fields` itself: it is a shared borrow. Make a `Vec` you own with `fields.to_vec()`.',
      'Sort by the second number of each pair, largest first: `sort_by(|x, y| y.1.cmp(&x.1))` compares `y` with `x`, which reverses the order.',
      'Then lay out the sorted copy and keep only the size: `c_layout(&fs).0`.',
    ],
    walkthrough: `**How to think about it.** Padding between fields appears when a field's offset is not yet a multiple of its alignment. If the fields go from the largest alignment to the smallest, and every alignment is a power of two, the offset after a field of alignment 8 is a multiple of 8, so it is also a multiple of 4, 2 and 1, and every later field fits with no gap. Only tail padding can remain. So: sort, then reuse \`c_layout\`.

**The solution, line by line.**

- \`let mut fs = fields.to_vec();\` copies the borrowed slice into a \`Vec\` this function owns, so it may change it; the caller's array stays as it was, which the third test checks.
- \`fs.sort_by(|x, y| y.1.cmp(&x.1));\` sorts with a closure that compares two pairs by their alignment (\`.1\`, the second element). Writing \`y\` first reverses the usual order, so the largest alignment comes first.
- \`c_layout(&fs).0\` lays out the sorted fields and returns only the size, the first element of the pair.

For \`C3\` the sorted order is \`b, a, c\`: \`b\` at 0, \`a\` at 8, \`c\` at 9, offset 10, rounded to 16. That is exactly the 16 bytes rustc's default representation chose, because sorting like this is the kind of reordering it is free to do; with \`repr(C)\` you only get it by writing the fields in that order yourself.

**Common wrong attempts.**

- Calling \`c_layout(fields)\` without sorting keeps the given order, so \`C3\` stays at 24.
- Sorting smallest first (\`x.1.cmp(&y.1)\`) also passes these tests: \`a, c, b\` packs into 16 as well, with the gap moved into the middle. It is not wrong for these structs, but largest first is the order with a simple guarantee (no padding between fields at all), which is why it is the one to remember.`,
    wrong: [
      {
        code: `${LAYOUT}

fn tight(fields: &[(usize, usize)])
    -> usize {
    c_layout(fields).0
}`,
        why: 'This keeps the order you were given, so `C3` stays 24 bytes. Reordering is the whole point: sort a copy first.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A struct has alignment 8. Which of these could be its size?',
    options: [
      { t: '20', why: 'Not a multiple of 8. A size is always a multiple of the alignment.' },
      { t: '24', correct: true, why: 'A multiple of 8, like the `repr(C)` `C3`.' },
      { t: '12', why: 'Not a multiple of 8.' },
      { t: '4', why: 'Smaller than one 8-aligned field, and not a multiple of 8.' },
    ],
  },
  {
    q: 'Why would you write `#[repr(C)]` on a struct?',
    options: [
      { t: 'To make it smaller', why: 'It often makes it bigger, since it forbids reordering: `C3` is 24 bytes with it and 16 without.' },
      { t: 'To allow `unsafe` code', why: 'Unrelated: `repr` is about layout.' },
      { t: 'So its layout is fixed and matches C, for sharing memory with C, WebAssembly hosts or files', correct: true, why: 'Only a fixed representation promises the field order and offsets.' },
    ],
  },
  {
    q: 'drip-rs’s `Value` is 16 bytes. What does `size_of::<Option<Value>>()` give?',
    options: [
      { t: '24: a tag for the `Option`, padded', why: 'Measured: 16. The enum’s tag byte has values no variant uses.' },
      { t: '17', why: 'Sizes are multiples of the alignment, 8.' },
      { t: '16: `None` is stored as an unused tag value', correct: true, why: 'A niche, the same idea that makes `Option<&T>` as small as `&T`.' },
    ],
  },
  {
    q: 'What does `#[repr(C, packed)]` do to `struct K3 { a: u8, b: f64, c: u8 }`?',
    options: [
      { t: 'Makes it 10 bytes with alignment 1, so `b` is misaligned and `&k.b` is refused', correct: true, why: 'Measured with rustc 1.97; the refusal is error E0793.' },
      { t: 'Makes it 16 bytes by reordering the fields', why: 'That is what the default representation did; `packed` removes padding instead.' },
      { t: 'Compresses the `f64` into fewer bytes', why: 'Fields keep their sizes; only the gaps between them go.' },
    ],
  },
  {
    q: 'drip-rs’s table keeps keys (`Option<StrRef>`, 12 bytes) and values (`Value`, 16 bytes) in two `Vec`s. How many bytes per slot would one `Vec<(Option<StrRef>, Value)>` use?',
    options: [
      { t: '28', why: '28 is not a multiple of 8, the pair’s alignment. Measured: 32.' },
      { t: '24', why: 'The two parts alone are 28 bytes.' },
      { t: '32, of which 4 are padding', correct: true, why: 'Measured with rustc 1.97. Two columns use 28 per slot, and a probe past occupied slots reads only the keys.' },
    ],
  },
];
