// Chapter 215 cards. Keys are stable ids: never rename them.

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
  'size-what': {
    q: 'What does `std::mem::size_of::<T>()` measure?',
    a: 'The bytes from one `T` to the next in an array, padding included. It is always a multiple of `T`’s alignment.',
  },
  'align-what': {
    q: 'An `f64` has alignment 8. What does that mean?',
    a: 'It may only be stored at an address that is a multiple of 8.',
  },
  'pad-what': {
    q: 'What is padding?',
    a: 'Unused bytes the compiler puts between or after fields so that every field, and the next array element, starts properly aligned.',
  },
  'tail-pad': {
    q: 'Why does `#[repr(C)] struct { a: u8, b: f64, c: u8 }` end with 7 bytes of padding?',
    a: 'Its size must be a multiple of its alignment, 8, so that in an array the next element’s `b` is aligned too: 17 rounds up to 24.',
  },
  reorder: {
    q: 'The same three fields without `#[repr(C)]` take 16 bytes. Why, and can you rely on it?',
    a: 'The default representation may reorder fields (rustc 1.97 put `b` first). The order and size are not guaranteed.',
  },
  'repr-c': {
    q: 'What does `#[repr(C)]` promise?',
    a: 'Fields in declaration order, laid out by C’s rules, so the layout is fixed and matches a C struct.',
  },
  'repr-u8': {
    q: 'Why is drip-rs’s `OpCode` enum marked `#[repr(u8)]`?',
    a: 'So each opcode is exactly the one byte that encodes it, and `op as u8` costs nothing.',
  },
  'value-16': {
    q: 'Why is drip-rs’s `Value` 16 bytes?',
    a: 'Its biggest payloads (an `f64`, or a `StrRef` of two `u32`s) take 8 bytes, the tag needs room, and the alignment is 8: 8 + tag, rounded up, is 16.',
  },
  'opt-value': {
    q: 'Why is `Option<Value>` still 16 bytes, but `Option<f64>` is 16 while `f64` is 8?',
    a: '`Value`’s tag byte has unused values, one of which can mean `None`. Every bit pattern of an `f64` is a valid number, so `None` needs its own tag.',
  },
  'line-values': {
    q: 'How many drip-rs `Value`s fit in one 64-byte cache line?',
    a: 'Four (16 bytes each), if the first starts at the start of the line.',
  },
};

export const examples = {
  sizes: {
    lang: 'rust',
    title: 'Measuring sizes and alignments',
    code: `use std::mem::{align_of, offset_of};
use std::mem::size_of;

fn show<T>(name: &str) {
    let s = size_of::<T>();
    let a = align_of::<T>();
    println!("{name:<12}{s:>3}{a:>4}");
}

// Like drip-rs's handles and Value.
#[derive(Clone, Copy)]
struct Gc(u32);
#[derive(Clone, Copy)]
struct StrRef {
    handle: Gc,
    hash: u32,
}
enum Value {
    Nil,
    Bool(bool),
    Number(f64),
    String(StrRef),
    Closure(Gc),
    Instance(Gc),
}

#[repr(C)]
struct C3 {
    a: u8,
    b: f64,
    c: u8,
}

struct R3 {
    a: u8,
    b: f64,
    c: u8,
}

fn main() {
    println!("type        size align");
    show::<u8>("u8");
    show::<u32>("u32");
    show::<f64>("f64");
    show::<char>("char");
    show::<&f64>("&f64");
    show::<Option<&f64>>("Opt<&f64>");
    show::<Option<f64>>("Opt<f64>");
    show::<Vec<f64>>("Vec<f64>");
    show::<(u8, u32)>("(u8, u32)");
    show::<C3>("C3");
    show::<R3>("R3");
    show::<Gc>("Gc");
    show::<StrRef>("StrRef");
    show::<Value>("Value");
    show::<Option<Value>>("Opt<Value>");
    println!("R3: a@{} b@{} c@{}",
        offset_of!(R3, a),
        offset_of!(R3, b),
        offset_of!(R3, c));
}`,
  },
};

export const exercises = {
  cLayout: {
    lang: 'rust',
    title: 'Lay out a repr(C) struct',
    prompt:
      'Write `c_layout`, which takes the fields of a `#[repr(C)]` struct as `(size, align)` pairs in declaration order, and returns the struct’s `(size, align)` using the Reference’s rules. Write the helper `round_up` too. The tests compare your answer with what `size_of` and `align_of` say about real structs.',
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
      '`round_up(n, a)`: add `a - 1`, then divide by `a` and multiply back. Integer division throws away the remainder.',
      'Walk the fields keeping a running offset. Before placing each field, round the offset up to that field’s alignment, then add its size.',
      'The struct’s alignment is the largest field alignment (1 if there are none).',
      'Finally round the offset up to the struct’s alignment: that is the size.',
    ],
    walkthrough: `This is the algorithm from the Rust Reference’s section on \`#[repr(C)]\` structs, step for step.

- **\`round_up\`**: \`(n + a - 1) / a * a\`. If \`n\` is already a multiple of \`a\`, adding \`a - 1\` doesn’t reach the next multiple, so you get \`n\` back; otherwise it pushes you just past it, and the division drops the excess.
- **Each field**: round \`off\` up to the field’s alignment (that gap is padding), then add the field’s size. Keep the largest alignment seen.
- **The end**: round up once more, to the struct’s alignment. That tail padding is why \`C3\` is 24, not 17: in an array, element 1 starts at offset 24, a multiple of 8, so its \`b\` is aligned.

For \`Mixed\` (\`u8, u16, u32, u8\`): \`a\` at 0, one byte of padding, \`b\` at 2, \`c\` at 4, \`d\` at 8, 9 bytes, rounded to 12. The tests check every one of these against the compiler.`,
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
        why: 'Without rounding before each field, `b` would start at offset 1, which isn’t a multiple of 8. `C3` comes out as 16 instead of 24.',
      },
    ],
  },
  tightLayout: {
    lang: 'rust',
    optional: true,
    title: 'Reorder to shrink',
    prompt:
      'Write `tight`, which returns the smallest `repr(C)` size you can get by reordering the fields: sort them by alignment, largest first, and lay them out with `c_layout` (given). The tests check it against `repr(C)` structs written in that order.',
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
      'Copy the fields into a `Vec` you own with `fields.to_vec()`, so you can sort it.',
      '`sort_by(|x, y| y.1.cmp(&x.1))` sorts by the second element, largest first.',
      'Then return `c_layout(&fs).0`.',
    ],
    walkthrough: `When every alignment is a power of two and the fields go from largest alignment to smallest, each field’s offset is already a multiple of its alignment, so no padding goes between fields; only the tail can need some. That is the sort of reordering the default representation is free to do, and why \`R3\` measured 16 bytes while \`C3\` was 24. With \`repr(C)\` you get the same saving only by writing the fields in that order yourself.`,
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
    q: 'What is `size_of::<(u8, u32)>()` on this machine?',
    options: [
      { t: '5', why: 'The `u32` needs a 4-byte-aligned offset, so there is padding.' },
      { t: '8', correct: true, why: 'The run in this chapter printed 8: one `u8`, three bytes of padding, one `u32`, with alignment 4.' },
      { t: '16', why: 'Nothing in the tuple needs 8-byte alignment.' },
    ],
  },
  {
    q: 'A struct has alignment 8. Which of these could be its size?',
    options: [
      { t: '20', why: '20 isn’t a multiple of 8. The Reference requires a size to be a multiple of the alignment.' },
      { t: '12', why: 'Not a multiple of 8.' },
      { t: '4', why: 'Smaller than one 8-aligned field, and not a multiple of 8.' },
      { t: '24', correct: true, why: 'A multiple of 8, like the `repr(C)` `C3`.' },
    ],
  },
  {
    q: 'Why would you write `#[repr(C)]` on a struct?',
    options: [
      { t: 'To make it smaller', why: 'It often makes it bigger: it forbids reordering. `C3` is 24 bytes with it and 16 without.' },
      { t: 'So its layout is fixed and matches C, for sharing memory with C, WebAssembly hosts or files', correct: true, why: 'Only `repr(C)` promises the field order and offsets.' },
      { t: 'To allow `unsafe` code', why: 'Unrelated: `repr` is about layout.' },
      { t: 'Rust requires it for structs with more than three fields', why: 'There is no such rule.' },
    ],
  },
  {
    q: 'A `Particle` has six `f64` fields. How big is it, and how does it sit in 64-byte cache lines?',
    options: [
      { t: '48 bytes, so a line holds one particle and a third of the next', correct: true, why: '6 × 8 with no padding needed. Many particles straddle two lines.' },
      { t: '64 bytes: Rust pads every struct to a cache line', why: 'Only `#[repr(align(64))]` would do that.' },
      { t: '96 bytes: each `f64` is padded to 16', why: 'An `f64` has size and alignment 8; six in a row need no padding.' },
    ],
  },
  {
    q: 'drip-rs’s `Value` is 16 bytes. What does `size_of::<Option<Value>>()` give?',
    options: [
      { t: '24: a tag for the `Option`, padded', why: 'Measured: 16. The enum’s tag has spare values.' },
      { t: '17', why: 'Sizes are multiples of the alignment, 8.' },
      { t: '16: `None` is stored as an unused tag value', correct: true, why: 'The same space-saving idea as `Option<&T>` being as small as `&T`.' },
    ],
  },
  {
    q: 'drip-rs’s hash table keeps keys (`Option<StrRef>`, 12 bytes) and values (`Value`, 16 bytes) in two `Vec`s. One `Vec` of `(Option<StrRef>, Value)` pairs would use how many bytes per entry?',
    options: [
      { t: '28', why: '28 isn’t a multiple of 8, the pair’s alignment. Measured: 32.' },
      { t: '32, of which 4 are padding', correct: true, why: 'Measured with rustc 1.97. The two `Vec`s use 28 bytes per entry, and a probe stepping past occupied slots reads only the 12-byte keys, back to back.' },
      { t: '24', why: 'The two parts alone are 28 bytes.' },
    ],
  },
];
