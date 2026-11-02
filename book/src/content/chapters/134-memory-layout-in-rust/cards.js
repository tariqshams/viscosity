// Chapter 202 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 134, 134.

export const prompts = {
  'size-what': {
    q: 'What does `std::mem::size_of::<T>()` measure?',
    a: 'The bytes from one `T` to the next in an array, including any unused bytes inside `T`. The compiler works it out, so it costs nothing at run time.',
  },
  'size-vec': {
    q: 'A `Vec<f64>` holds a million numbers. What is `size_of::<Vec<f64>>()` on a 64-bit machine, and why?',
    a: '24: an address, a capacity and a length. The million numbers live on the heap, not inside the `Vec` value.',
  },
  'size-opt': {
    q: 'Why is `Option<&f64>` 8 bytes but `Option<f64>` 16?',
    a: 'A reference is never address 0, so 0 can mean `None` (a niche). Every bit pattern of an `f64` is a number, so `None` needs a separate tag.',
  },
  'align-what': {
    q: 'An `f64` has alignment 8. What does that mean?',
    a: 'It may only be stored at an address that is a multiple of 8.',
  },
  'align-compound': {
    q: 'What is the alignment of a struct or tuple?',
    a: 'At least the largest alignment of its fields: `(u8, u32)` is aligned to 4, `Particle` (six `f64`s) to 8.',
  },
  'align-target': {
    q: 'Compiled for `wasm32-unknown-unknown`, what are `size_of::<&f64>()` and `align_of::<f64>()`?',
    a: '4 and 8: WebAssembly uses 32-bit addresses, but an `f64` is still aligned to 8. Sizes belong to the target.',
  },
  'value-line': {
    q: 'drip-rs’s `Value` is 16 bytes. How many fit in one 64-byte cache line?',
    a: 'Four (a NaN-boxed 8-byte value would fit eight).',
  },
  'per-line': {
    q: 'A `Particle` is 48 bytes. How many cache lines does a loop over 1,000 particles in a `Vec<Particle>` pull in?',
    a: '48,000 bytes / 64 = 750 lines, whichever fields the loop reads.',
  },
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

export const examples = {
  sizes: {
    lang: 'rust',
    title: 'Sizes and alignments',
    code: `use std::mem::{align_of, size_of};

fn show<T>(name: &str) {
    let s = size_of::<T>();
    let a = align_of::<T>();
    println!("{name:<12}{s:>4}{a:>6}");
}

struct Particle {
    x: f64, y: f64,
    vx: f64, vy: f64,
    mass: f64, health: f64,
}

fn main() {
    println!("type        size align");
    show::<u8>("u8");
    show::<u32>("u32");
    show::<f64>("f64");
    show::<char>("char");
    show::<&f64>("&f64");
    show::<&[f64]>("&[f64]");
    show::<Vec<f64>>("Vec<f64>");
    show::<Option<&f64>>("Opt<&f64>");
    show::<Option<f64>>("Opt<f64>");
    show::<(u8, u32)>("(u8, u32)");
    show::<Particle>("Particle");
    let n = 64 / size_of::<Particle>();
    println!("particles per line: {n}");
}`,
  },
};

export const exercises = {
  alignUp: {
    lang: 'rust',
    title: 'Aligned addresses',
    prompt: 'Write two helpers that every memory allocator needs. `is_aligned(addr, align)` says whether `addr` is a multiple of `align`. `align_up(addr, align)` returns the first address at or after `addr` that is a multiple of `align`: `align_up(9, 8)` is `16`, and `align_up(16, 8)` is `16`. You may assume `align` is a power of two.',
    starter: `// Is \`addr\` a multiple of \`align\`?
// (\`align\` is a power of two.)
fn is_aligned(addr: usize, align: usize)
    -> bool {
    todo!()
}

// The first address at or after \`addr\`
// that is a multiple of \`align\`.
fn align_up(addr: usize, align: usize)
    -> usize {
    todo!()
}`,
    solution: `// Is \`addr\` a multiple of \`align\`?
// (\`align\` is a power of two.)
fn is_aligned(addr: usize, align: usize)
    -> bool {
    addr % align == 0
}

// The first address at or after \`addr\`
// that is a multiple of \`align\`.
fn align_up(addr: usize, align: usize)
    -> usize {
    (addr + align - 1) / align * align
}`,
    tests: `#[test]
fn every_address_suits_a_u8() {
    assert!(is_aligned(13, 1));
    assert!(is_aligned(0, 1));
}

#[test]
fn f64_needs_a_multiple_of_8() {
    assert!(is_aligned(16, 8));
    assert!(!is_aligned(12, 8));
}

#[test]
fn aligned_addresses_stay_put() {
    assert_eq!(align_up(8, 8), 8);
    assert_eq!(align_up(0, 4), 0);
}

#[test]
fn rounds_up_to_the_next_start() {
    assert_eq!(align_up(1, 4), 4);
    assert_eq!(align_up(9, 8), 16);
    assert_eq!(align_up(13, 2), 14);
}

#[test]
fn agrees_with_the_standard_library() {
    for a in [1, 2, 4, 8, 16] {
        for n in 0..40usize {
            let want = n.next_multiple_of(a);
            assert_eq!(align_up(n, a), want);
            assert!(is_aligned(want, a));
        }
    }
}`,
    hints: [
      'Start with `is_aligned`: "a multiple of `align`" means dividing by `align` leaves no remainder. Which operator gives the remainder?',
      'For `align_up`, try integer division: `addr / align * align` rounds *down* to a multiple. How could you push `addr` far enough that rounding down lands on the right answer?',
      'Add `align - 1` first: `(addr + align - 1) / align * align`. If `addr` is already aligned, the extra `align - 1` is not enough to reach the next multiple, so you get `addr` back.',
    ],
    walkthrough: `**How to think about it.** Do one by hand on the number line from the diagram. Which addresses may an \`f64\` start at? 0, 8, 16, 24: the multiples of 8. So "is 12 aligned to 8?" asks whether 12 is on that list, and "align 9 up to 8" asks for the first number on the list that is at least 9, which is 16. Both questions are about remainders after dividing by the alignment, so reach for \`%\` and for integer division, which throws the remainder away.

**The solution, line by line.**

- \`fn is_aligned(addr: usize, align: usize) -> bool {\` takes two \`usize\`s (the type Rust uses for addresses and sizes, 8 bytes on this machine) and returns a \`bool\`.
- \`    addr % align == 0\` is the whole body, written as a tail expression with no semicolon, so its value is returned. \`%\` gives the remainder: \`16 % 8\` is \`0\`, so 16 is aligned; \`12 % 8\` is \`4\`, so 12 is not. Every number is a multiple of 1, which is why the first test passes for 13.
- \`fn align_up(addr: usize, align: usize) -> usize {\` returns an address.
- \`    (addr + align - 1) / align * align\` does three steps. Adding \`align - 1\` pushes \`addr\` just far enough: for 9 and 8 it gives 16, for 8 and 8 it gives 15. Dividing by \`align\` with integer division throws away the remainder, so 16 / 8 is 2 and 15 / 8 is 1. Multiplying back by \`align\` gives 16 and 8: the next multiple, or the address itself when it was already aligned. Division and multiplication run left to right, so no extra brackets are needed.

The last test compares your \`align_up\` with \`usize::next_multiple_of\`, which the standard library provides for exactly this, for every alignment from 1 to 16 and every address below 40, and checks that the answer really is aligned.

**Common wrong attempts.**

- \`addr / align * align\` rounds *down*: \`align_up(9, 8)\` gives 8, an address *before* 9, which would put the value on top of whatever was already there.
- \`addr + align - addr % align\` looks right for 9 (9 + 8 - 1 = 16) but moves an already aligned address on: \`align_up(8, 8)\` gives 16, wasting a whole slot every time.
- Writing \`is_aligned\` as \`addr % align != 0\` gets the question backwards; the tests for 16 and 12 catch it.`,
    wrong: [
      {
        code: `fn is_aligned(addr: usize, align: usize)
    -> bool {
    addr % align == 0
}

fn align_up(addr: usize, align: usize)
    -> usize {
    addr / align * align
}`,
        why: 'This rounds down: `align_up(9, 8)` is 8, before the address you started from.',
      },
      {
        code: `fn is_aligned(addr: usize, align: usize)
    -> bool {
    addr % align == 0
}

fn align_up(addr: usize, align: usize)
    -> usize {
    addr + align - addr % align
}`,
        why: 'Right for unaligned addresses, but an aligned one moves on: `align_up(8, 8)` gives 16 instead of 8.',
      },
    ],
  },
  perLine: {
    lang: 'rust',
    optional: true,
    title: 'Values per cache line',
    prompt: 'Write two generic functions with `size_of`. `per_line::<T>()` returns how many whole values of `T` fit in a 64-byte cache line. `bytes_for::<T>(n)` returns how many bytes `n` values of `T` take in a `Vec`’s buffer. (You may assume `T` is not zero-sized.)',
    starter: `use std::mem::size_of;

// How many whole T fit in 64 bytes?
fn per_line<T>() -> usize {
    todo!()
}

// Bytes for n values of T in a Vec.
fn bytes_for<T>(n: usize) -> usize {
    todo!()
}`,
    solution: `use std::mem::size_of;

// How many whole T fit in 64 bytes?
fn per_line<T>() -> usize {
    64 / size_of::<T>()
}

// Bytes for n values of T in a Vec.
fn bytes_for<T>(n: usize) -> usize {
    n * size_of::<T>()
}`,
    tests: `struct Particle {
    x: f64, y: f64,
    vx: f64, vy: f64,
    mass: f64, health: f64,
}

#[test]
fn bytes_and_doubles() {
    assert_eq!(per_line::<u8>(), 64);
    assert_eq!(per_line::<f64>(), 8);
}

#[test]
fn a_tuple_with_a_gap() {
    assert_eq!(per_line::<(u8, u32)>(), 8);
}

#[test]
fn one_particle_per_line() {
    assert_eq!(per_line::<Particle>(), 1);
}

#[test]
fn a_million_doubles() {
    let n = bytes_for::<f64>(1_000_000);
    assert_eq!(n, 8_000_000);
    assert_eq!(bytes_for::<Particle>(1000), 48_000);
}`,
    hints: [
      'Inside a generic function you can ask for the size of the type parameter itself: `size_of::<T>()`.',
      'Whole values per line: integer division of 64 by the size throws the leftover bytes away, which is what "whole" means.',
      'An array or `Vec` buffer puts values exactly `size_of::<T>()` apart, so `n` of them take `n * size_of::<T>()` bytes.',
    ],
    walkthrough: `**How to think about it.** Both questions are about the distance from one value to the next, which is exactly what \`size_of\` measures, padding included. So both answers are a single line of arithmetic with \`size_of::<T>()\`.

**The solution, line by line.**

- \`use std::mem::size_of;\` brings the function into scope.
- \`fn per_line<T>() -> usize {\` is generic over \`T\` and takes no arguments: the caller names the type, as in \`per_line::<f64>()\`.
- \`    64 / size_of::<T>()\` divides the line's 64 bytes by one value's size. Integer division throws away the remainder, so for a 48-byte \`Particle\` you get 1, not 1.33: only one *whole* particle fits, and the rest of the line holds part of the next.
- \`fn bytes_for<T>(n: usize) -> usize {\` and \`    n * size_of::<T>()\`: values in an array sit \`size_of\` apart with nothing between them, so n of them take n times the size. A million \`f64\`s are 8,000,000 bytes, about 7.6 MiB.

The tuple test is the interesting one: \`(u8, u32)\` holds five bytes of data but is 8 bytes long, so eight of them fit in a line, not twelve. The gap is the subject of the next chapter.

**Common wrong attempts.**

- \`64 / align_of::<T>()\` uses the alignment instead of the size. For \`f64\` they happen to agree, but \`(u8, u32)\` has alignment 4 and size 8, so this gives 16 instead of 8.
- Adding the fields' sizes by hand (1 + 4 for the tuple) forgets the gap; only \`size_of\` knows the real stride.`,
    wrong: [
      {
        code: `use std::mem::{align_of, size_of};

fn per_line<T>() -> usize {
    64 / align_of::<T>()
}

fn bytes_for<T>(n: usize) -> usize {
    n * size_of::<T>()
}`,
        why: 'Alignment is not size: `(u8, u32)` is aligned to 4 but 8 bytes long, so this says 16 fit instead of 8.',
      },
    ],
  },
  cLayout: {
    lang: 'rust',
    title: 'Lay out a repr(C) struct',
    prompt: 'Write `c_layout`, which takes the fields of a `#[repr(C)]` struct as `(size, align)` pairs in declaration order and returns the struct’s `(size, align)`, using the rule in this chapter’s formal box. Write the helper `round_up` too. The tests compare your answers with what `size_of` and `align_of` say about real structs.',
    starter: `// Each field is (size, align), in
// declaration order. Return the
// repr(C) struct's (size, align).
fn c_layout(fields: &[(usize, usize)])
    -> (usize, usize) {
    todo!()
}

// The next multiple of \`a\` at or
// after \`n\`.
fn round_up(n: usize, a: usize)
    -> usize {
    todo!()
}`,
    solution: `// Each field is (size, align), in
// declaration order. Return the
// repr(C) struct's (size, align).
fn c_layout(fields: &[(usize, usize)])
    -> (usize, usize) {
    let mut off = 0;
    let mut align = 1;
    for &(size, a) in fields {
        off = round_up(off, a);
        off += size;
        align = align.max(a);
    }
    (round_up(off, align), align)
}

// The next multiple of \`a\` at or
// after \`n\`.
fn round_up(n: usize, a: usize)
    -> usize {
    (n + a - 1) / a * a
}`,
    tests: `use std::mem::{align_of, size_of};

fn real<T>() -> (usize, usize) {
    (size_of::<T>(), align_of::<T>())
}

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
        code: `// Each field is (size, align), in
// declaration order. Return the
// repr(C) struct's (size, align).
fn c_layout(fields: &[(usize, usize)])
    -> (usize, usize) {
    let mut off = 0;
    let mut align = 1;
    for &(size, a) in fields {
        off = round_up(off, a);
        off += size;
        align = align.max(a);
    }
    (off, align)
}

// The next multiple of \`a\` at or
// after \`n\`.
fn round_up(n: usize, a: usize)
    -> usize {
    (n + a - 1) / a * a
}`,
        why: 'This forgets the tail padding: `C3` comes out as 17. A size must be a multiple of the alignment, or the second element of an array would be misaligned.',
      },
      {
        code: `// Each field is (size, align), in
// declaration order. Return the
// repr(C) struct's (size, align).
fn c_layout(fields: &[(usize, usize)])
    -> (usize, usize) {
    let mut off = 0;
    let mut align = 1;
    for &(size, a) in fields {
        off += size;
        align = align.max(a);
    }
    (round_up(off, align), align)
}

// The next multiple of \`a\` at or
// after \`n\`.
fn round_up(n: usize, a: usize)
    -> usize {
    (n + a - 1) / a * a
}`,
        why: 'Without rounding before each field, `b` would start at offset 1, which is not a multiple of 8. `C3` comes out as 16 instead of 24.',
      },
    ],
  },
  tightLayout: {
    lang: 'rust',
    optional: true,
    title: 'Reorder to shrink',
    prompt: 'Write `tight`, which returns the smallest `repr(C)` size you can get by reordering the fields: sort a copy of them by alignment, largest first, and lay that out with `c_layout` (given). The tests check it against `repr(C)` structs written in that order.',
    starter: `// Each field is (size, align), in
// declaration order. Return the
// repr(C) struct's (size, align).
fn c_layout(fields: &[(usize, usize)])
    -> (usize, usize) {
    let mut off = 0;
    let mut align = 1;
    for &(size, a) in fields {
        off = round_up(off, a);
        off += size;
        align = align.max(a);
    }
    (round_up(off, align), align)
}

// The next multiple of \`a\` at or
// after \`n\`.
fn round_up(n: usize, a: usize)
    -> usize {
    (n + a - 1) / a * a
}

fn tight(fields: &[(usize, usize)])
    -> usize {
    todo!()
}`,
    solution: `// Each field is (size, align), in
// declaration order. Return the
// repr(C) struct's (size, align).
fn c_layout(fields: &[(usize, usize)])
    -> (usize, usize) {
    let mut off = 0;
    let mut align = 1;
    for &(size, a) in fields {
        off = round_up(off, a);
        off += size;
        align = align.max(a);
    }
    (round_up(off, align), align)
}

// The next multiple of \`a\` at or
// after \`n\`.
fn round_up(n: usize, a: usize)
    -> usize {
    (n + a - 1) / a * a
}

fn tight(fields: &[(usize, usize)])
    -> usize {
    let mut fs = fields.to_vec();
    fs.sort_by(|x, y| y.1.cmp(&x.1));
    c_layout(&fs).0
}`,
    tests: `use std::mem::{align_of, size_of};

fn real<T>() -> (usize, usize) {
    (size_of::<T>(), align_of::<T>())
}

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
        code: `// Each field is (size, align), in
// declaration order. Return the
// repr(C) struct's (size, align).
fn c_layout(fields: &[(usize, usize)])
    -> (usize, usize) {
    let mut off = 0;
    let mut align = 1;
    for &(size, a) in fields {
        off = round_up(off, a);
        off += size;
        align = align.max(a);
    }
    (round_up(off, align), align)
}

// The next multiple of \`a\` at or
// after \`n\`.
fn round_up(n: usize, a: usize)
    -> usize {
    (n + a - 1) / a * a
}

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
    q: 'A `Vec<f64>` holds a million numbers. What does `size_of::<Vec<f64>>()` return on a 64-bit machine?',
    options: [
      {
        t: '8,000,000',
        why: 'That is the size of the heap buffer the `Vec` points at, not of the `Vec` value itself.',
      },
      {
        t: '24',
        correct: true,
        why: 'An address, a capacity and a length, 8 bytes each, whatever the `Vec` holds.',
      },
      {
        t: '8',
        why: 'That is a single reference; a `Vec` also carries its length and capacity.',
      },
    ],
  },
  {
    q: 'Which of these addresses may an `f64` start at on x86-64?',
    options: [
      {
        t: '12',
        why: '12 is a multiple of 4, which suits a `u32`, but not of 8.',
      },
      {
        t: '6',
        why: 'An even address suits a `u16`, but not an `f64`.',
      },
      {
        t: '24',
        correct: true,
        why: '24 is a multiple of 8, the alignment of an `f64` here.',
      },
      {
        t: '20',
        why: 'Not a multiple of 8.',
      },
    ],
  },
  {
    q: 'Why is `Option<&f64>` the same size as `&f64`, while `Option<f64>` is twice the size of `f64`?',
    options: [
      {
        t: 'References are smaller than numbers',
        why: 'Both are 8 bytes here. The difference is in which bit patterns are unused.',
      },
      {
        t: 'The compiler optimises `Option` only for references',
        why: 'It does it for any type with a spare bit pattern, such as `bool` or drip-rs’s `Value`.',
      },
      {
        t: 'A reference is never 0, so 0 can mean `None`; every `f64` bit pattern is a number, so `None` needs its own tag',
        correct: true,
        why: 'This is the niche of *Sum types in memory*: a spare pattern holds the tag for free.',
      },
    ],
  },
  {
    q: 'A loop reads only the `x` field of 1,000 particles in a `Vec<Particle>` (48 bytes each). About how many 64-byte cache lines does it pull in?',
    options: [
      {
        t: '125: only the x values, eight per line',
        why: 'That would be true for a column of `x`s alone; here each `x` sits inside its 48-byte particle.',
      },
      {
        t: '750: all 48,000 bytes, because lines carry whole neighbourhoods',
        correct: true,
        why: 'The `x`s are 48 bytes apart, so every line holds one or two of them and the loop fetches every line. *Struct of arrays in Rust by hand* changes that.',
      },
      {
        t: '1,000: one line per particle',
        why: 'Lines are 64 bytes and particles 48, so some lines hold parts of two particles; the total is 48,000 / 64.',
      },
    ],
  },
  {
    q: 'Compiled for `wasm32-unknown-unknown`, what does `size_of::<&f64>()` return?',
    options: [
      {
        t: '8, as on x86-64',
        why: 'The size of a reference follows the target’s address size, and WebAssembly’s linear memory uses 32-bit addresses.',
      },
      {
        t: '4',
        correct: true,
        why: 'Measured with rustc 1.97 for that target: references and `usize` are 4 bytes there, though `f64` is still aligned to 8.',
      },
      {
        t: 'It does not compile: references do not exist in WebAssembly',
        why: 'They compile to plain 32-bit addresses into linear memory.',
      },
    ],
  },
  {
    q: 'A struct has alignment 8. Which of these could be its size?',
    options: [
      {
        t: '20',
        why: 'Not a multiple of 8. A size is always a multiple of the alignment.',
      },
      {
        t: '24',
        correct: true,
        why: 'A multiple of 8, like the `repr(C)` `C3`.',
      },
      {
        t: '12',
        why: 'Not a multiple of 8.',
      },
      {
        t: '4',
        why: 'Smaller than one 8-aligned field, and not a multiple of 8.',
      },
    ],
  },
  {
    q: 'Why would you write `#[repr(C)]` on a struct?',
    options: [
      {
        t: 'To make it smaller',
        why: 'It often makes it bigger, since it forbids reordering: `C3` is 24 bytes with it and 16 without.',
      },
      {
        t: 'To allow `unsafe` code',
        why: 'Unrelated: `repr` is about layout.',
      },
      {
        t: 'So its layout is fixed and matches C, for sharing memory with C, WebAssembly hosts or files',
        correct: true,
        why: 'Only a fixed representation promises the field order and offsets.',
      },
    ],
  },
  {
    q: 'drip-rs’s `Value` is 16 bytes. What does `size_of::<Option<Value>>()` give?',
    options: [
      {
        t: '24: a tag for the `Option`, padded',
        why: 'Measured: 16. The enum’s tag byte has values no variant uses.',
      },
      {
        t: '17',
        why: 'Sizes are multiples of the alignment, 8.',
      },
      {
        t: '16: `None` is stored as an unused tag value',
        correct: true,
        why: 'A niche, the same idea that makes `Option<&T>` as small as `&T`.',
      },
    ],
  },
  {
    q: 'What does `#[repr(C, packed)]` do to `struct K3 { a: u8, b: f64, c: u8 }`?',
    options: [
      {
        t: 'Makes it 10 bytes with alignment 1, so `b` is misaligned and `&k.b` is refused',
        correct: true,
        why: 'Measured with rustc 1.97; the refusal is error E0793.',
      },
      {
        t: 'Makes it 16 bytes by reordering the fields',
        why: 'That is what the default representation did; `packed` removes padding instead.',
      },
      {
        t: 'Compresses the `f64` into fewer bytes',
        why: 'Fields keep their sizes; only the gaps between them go.',
      },
    ],
  },
  {
    q: 'drip-rs’s table keeps keys (`Option<StrRef>`, 12 bytes) and values (`Value`, 16 bytes) in two `Vec`s. How many bytes per slot would one `Vec<(Option<StrRef>, Value)>` use?',
    options: [
      {
        t: '28',
        why: '28 is not a multiple of 8, the pair’s alignment. Measured: 32.',
      },
      {
        t: '24',
        why: 'The two parts alone are 28 bytes.',
      },
      {
        t: '32, of which 4 are padding',
        correct: true,
        why: 'Measured with rustc 1.97. Two columns use 28 per slot, and a probe past occupied slots reads only the keys.',
      },
    ],
  },
];
