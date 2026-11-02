// Chapter 365 cards. Keys are stable ids: never rename them.
// Every size, alignment and error quoted here was printed by rustc 1.97.0
// on x86-64 Linux (and, where it says so, for wasm32-unknown-unknown).

const ALIGN = `// Is \`addr\` a multiple of \`align\`?
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
}`;

const PER = `use std::mem::size_of;

// How many whole T fit in 64 bytes?
fn per_line<T>() -> usize {
    64 / size_of::<T>()
}

// Bytes for n values of T in a Vec.
fn bytes_for<T>(n: usize) -> usize {
    n * size_of::<T>()
}`;

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
    prompt:
      'Write two helpers that every memory allocator needs. `is_aligned(addr, align)` says whether `addr` is a multiple of `align`. `align_up(addr, align)` returns the first address at or after `addr` that is a multiple of `align`: `align_up(9, 8)` is `16`, and `align_up(16, 8)` is `16`. You may assume `align` is a power of two.',
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
    solution: ALIGN,
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
    prompt:
      'Write two generic functions with `size_of`. `per_line::<T>()` returns how many whole values of `T` fit in a 64-byte cache line. `bytes_for::<T>(n)` returns how many bytes `n` values of `T` take in a `Vec`’s buffer. (You may assume `T` is not zero-sized.)',
    starter: `use std::mem::size_of;

// How many whole T fit in 64 bytes?
fn per_line<T>() -> usize {
    todo!()
}

// Bytes for n values of T in a Vec.
fn bytes_for<T>(n: usize) -> usize {
    todo!()
}`,
    solution: PER,
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
};

export const quiz = [
  {
    q: 'A `Vec<f64>` holds a million numbers. What does `size_of::<Vec<f64>>()` return on a 64-bit machine?',
    options: [
      { t: '8,000,000', why: 'That is the size of the heap buffer the `Vec` points at, not of the `Vec` value itself.' },
      { t: '24', correct: true, why: 'An address, a capacity and a length, 8 bytes each, whatever the `Vec` holds.' },
      { t: '8', why: 'That is a single reference; a `Vec` also carries its length and capacity.' },
    ],
  },
  {
    q: 'Which of these addresses may an `f64` start at on x86-64?',
    options: [
      { t: '12', why: '12 is a multiple of 4, which suits a `u32`, but not of 8.' },
      { t: '6', why: 'An even address suits a `u16`, but not an `f64`.' },
      { t: '24', correct: true, why: '24 is a multiple of 8, the alignment of an `f64` here.' },
      { t: '20', why: 'Not a multiple of 8.' },
    ],
  },
  {
    q: 'Why is `Option<&f64>` the same size as `&f64`, while `Option<f64>` is twice the size of `f64`?',
    options: [
      { t: 'References are smaller than numbers', why: 'Both are 8 bytes here. The difference is in which bit patterns are unused.' },
      { t: 'The compiler optimizes `Option` only for references', why: 'It does it for any type with a spare bit pattern, such as `bool` or drip-rs’s `Value`.' },
      { t: 'A reference is never 0, so 0 can mean `None`; every `f64` bit pattern is a number, so `None` needs its own tag', correct: true, why: 'This is the niche of *Sum types in memory*: a spare pattern holds the tag for free.' },
    ],
  },
  {
    q: 'A loop reads only the `x` field of 1,000 particles in a `Vec<Particle>` (48 bytes each). About how many 64-byte cache lines does it pull in?',
    options: [
      { t: '125: only the x values, eight per line', why: 'That would be true for a column of `x`s alone; here each `x` sits inside its 48-byte particle.' },
      { t: '750: all 48,000 bytes, because lines carry whole neighbourhoods', correct: true, why: 'The `x`s are 48 bytes apart, so every line holds one or two of them and the loop fetches every line. The next chapter but one changes that.' },
      { t: '1,000: one line per particle', why: 'Lines are 64 bytes and particles 48, so some lines hold parts of two particles; the total is 48,000 / 64.' },
    ],
  },
  {
    q: 'Compiled for `wasm32-unknown-unknown`, what does `size_of::<&f64>()` return?',
    options: [
      { t: '8, as on x86-64', why: 'The size of a reference follows the target’s address size, and WebAssembly’s linear memory uses 32-bit addresses.' },
      { t: '4', correct: true, why: 'Measured with rustc 1.97 for that target: references and `usize` are 4 bytes there, though `f64` is still aligned to 8.' },
      { t: 'It does not compile: references do not exist in WebAssembly', why: 'They compile to plain 32-bit addresses into linear memory.' },
    ],
  },
];
