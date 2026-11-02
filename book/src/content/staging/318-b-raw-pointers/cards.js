// Chapter 318-b cards (Raw pointers, split from chapter 318). Keys are
// stable ids: never rename them. Messages are rustc 1.97.0 and Miri on
// nightly 2026-11-01, x86-64 Linux.

const CS = `fn column_sum(
    data: &[f64],
    width: usize,
    col: usize,
) -> f64 {
    if col >= width {
        return 0.0;
    }
    let rows = data.len() / width;
    let p = data.as_ptr();
    let mut total = 0.0;
    for r in 0..rows {
        // SAFETY: r < rows and
        // col < width, so the
        // index is below len.
        total += unsafe {
            *p.add(r * width + col)
        };
    }
    total
}`;

const CS_HEAD = `fn column_sum(
    data: &[f64],
    width: usize,
    col: usize,
) -> f64 {`;

export const prompts = {
  'raw-make': {
    q: 'Write two ways to make a raw pointer to a local variable `n`.',
    a: '`&raw const n` gives a `*const` pointer; `&raw mut n` gives a `*mut` pointer. (`xs.as_ptr()` makes one from a slice.)',
  },
  'raw-types': {
    q: 'What is the difference between `*const T` and `*mut T`?',
    a: 'Through `*const T` you may only read; through `*mut T` you may also write. Both need `unsafe` to dereference.',
  },
  'raw-vs-ref': {
    q: 'Name three promises a reference `&T` keeps that a raw pointer does not.',
    a: 'Never null; points at a live, correctly aligned `T`; obeys the borrowing rules (and has a checked lifetime).',
  },
  'add-units': {
    q: 'On a `*const f64`, how far does `p.add(3)` move the address?',
    a: '24 bytes: `add` counts elements, so it moves 3 × `size_of::<f64>()`.',
  },
  'one-past': {
    q: 'For a pointer to the start of `len` elements, may you compute `p.add(len)`? May you read `*p.add(len)`?',
    a: 'You may compute it (one past the end is allowed, e.g. to compare), but reading through it is undefined behaviour.',
  },
  'miri-dangling': {
    q: 'What did Miri say about reading `*p` after `drop(v)`, where `p = v.as_ptr()`?',
    a: '“Undefined Behavior: memory access failed: … has been freed, so this pointer is dangling”, with where it was allocated and where freed.',
  },
  'debug-quiet': {
    q: 'In an ordinary debug build, what did reading one element past a 3-element array through `p.add(3)` do?',
    a: 'It quietly printed `0`: no panic, no message. Only Miri reported it.',
  },
  'vec-raw': {
    q: 'Why does drip-rs have no raw pointers, and what does it use instead?',
    a: '`#![forbid(unsafe_code)]` rules out reading through them; its objects refer to each other with typed indices into arenas.',
  },
};

export const examples = {
  'raw-play': {
    lang: 'rust',
    title: 'Making and using raw pointers',
    code: `use std::mem::size_of;

fn main() {
    let mut n = 41;
    // Making raw pointers is safe, even
    // a *const and a *mut to one place.
    let r = &raw const n;
    let w = &raw mut n;
    unsafe {
        println!("{} {}", *r, *w);
        *w += 1;
    }
    println!("{n}");

    let z = std::ptr::null::<i32>();
    println!("null? {}", z.is_null());
    let s = size_of::<*const i32>();
    println!("{s} bytes");

    let xs = [1.5, 2.5, 4.0];
    let p = xs.as_ptr();
    // SAFETY: 2 < xs.len(), so p.add(2)
    // stays inside xs.
    let x = unsafe { *p.add(2) };
    println!("{x}");
}`,
  },
};

export const exercises = {
  columnSum: {
    lang: 'rust',
    title: 'One field, by stride',
    prompt:
      '`data` holds records of `width` numbers each, back to back (an array of structs, flattened: particle 0’s six fields, then particle 1’s, and so on). Write `column_sum(data, width, col)`, which adds up field `col` of every whole record, by walking a raw pointer from `data.as_ptr()` with `add`. Ignore a partial record at the end. If `col >= width` (which includes `width == 0`), return `0.0`. Put a `// SAFETY:` comment on the read.',
    starter: `${CS_HEAD}
    todo!()
}`,
    solution: CS,
    tests: `// x, y, vx, vy, mass, health
const PS: [f64; 13] = [
    0.0, 1.0, 2.0, 3.0, 4.0, 5.0,
    10.0, 11.0, 12.0, 13.0, 14.0, 15.0,
    99.0,
];

fn safe(d: &[f64], w: usize, c: usize)
    -> f64 {
    d.chunks_exact(w).map(|r| r[c]).sum()
}

#[test]
fn sums_the_mass_column() {
    assert_eq!(column_sum(&PS, 6, 4), 18.0);
}

#[test]
fn first_and_last_fields() {
    assert_eq!(column_sum(&PS, 6, 0), 10.0);
    assert_eq!(column_sum(&PS, 6, 5), 20.0);
}

#[test]
fn agrees_with_safe_code() {
    for w in 1..5 {
        for c in 0..w {
            let want = safe(&PS, w, c);
            assert_eq!(column_sum(&PS, w, c), want);
        }
    }
}

#[test]
fn bad_columns_give_zero() {
    assert_eq!(column_sum(&PS, 6, 6), 0.0);
    assert_eq!(column_sum(&PS, 0, 0), 0.0);
    assert_eq!(column_sum(&[], 3, 1), 0.0);
}`,
    hints: [
      'Draw it: with `width` 6, field 4 of record 0 is element 4, of record 1 is element 10, of record 2 element 16. What is the pattern?',
      'Element number `r * width + col`. There are `data.len() / width` whole records (integer division drops the partial one), so loop `r` over `0..rows`.',
      'Check `col >= width` first and return `0.0` (that also avoids dividing by zero). Then `let p = data.as_ptr();` and add `unsafe { *p.add(r * width + col) }` to a running total.',
    ],
    walkthrough: `**How to think about it.** This is the loop *Struct of arrays in Rust by hand* complained about: summing one field of an array of structs means jumping \`width\` elements at a time, a **stride**. Before touching \`unsafe\`, decide which indices you will read and prove each one is in bounds; the code then only has to read exactly those. Record \`r\` starts at element \`r * width\`, and its field \`col\` is \`r * width + col\`. The largest \`r\` is \`rows - 1\`, where \`rows = len / width\`, so the largest index is \`(rows - 1) * width + col\`, which is less than \`rows * width\` as long as \`col < width\`, and \`rows * width\` is at most \`len\`. That inequality is the SAFETY comment.

**The solution, line by line.**

- \`fn column_sum(data: &[f64], width: usize, col: usize) -> f64 {\` is a safe function: callers may pass anything, so it must defend itself.
- \`    if col >= width { return 0.0; }\` refuses a field that does not exist. It also covers \`width == 0\` (then \`col >= 0\` is always true), so the division below can never divide by zero.
- \`    let rows = data.len() / width;\` counts whole records; with 13 numbers and width 6 it is 2, and the stray \`99.0\` is ignored.
- \`    let p = data.as_ptr();\` makes a \`*const f64\` to element 0. Safe: making a pointer promises nothing.
- \`    let mut total = 0.0;\` starts the sum.
- \`    for r in 0..rows {\` visits each whole record once.
- \`        // SAFETY: r < rows and col < width, so the index is below len.\` is the argument from above, written where the read happens.
- \`        total += unsafe { *p.add(r * width + col) };\` moves the pointer on by that many elements (\`add\` counts elements, so this is \`8 × index\` bytes) and reads the \`f64\` there.
- \`    total\` returns the sum. For the test data's mass column: 4 + 14 = 18.

The \`agrees_with_safe_code\` test compares every width from 1 to 4 and every valid column against \`chunks_exact\`, the safe standard-library way to walk whole records.

**Common wrong attempts.**

- \`p.add(r + col)\` steps one *element* per record instead of one *record*, so it reads neighbouring fields of record 0: for the mass column it adds elements 4 and 5, giving 9, not 18.
- \`let rows = data.len() / width - 1;\` skips the last whole record (and, for an empty slice, underflows and panics).
- Looping \`for r in 0..data.len()\` reads far past the end: undefined behaviour, which in a debug build may print a wrong total or nothing at all. Prove the bound before you write the loop.`,
    wrong: [
      {
        code: `${CS_HEAD}
    if col >= width {
        return 0.0;
    }
    let rows = data.len() / width;
    let p = data.as_ptr();
    let mut total = 0.0;
    for r in 0..rows {
        total += unsafe {
            *p.add(r + col)
        };
    }
    total
}`,
        why: 'The stride is missing: `r + col` steps one element per record, so it reads fields of record 0 (9 instead of 18 for the mass column).',
      },
      {
        code: `${CS_HEAD}
    if col >= width {
        return 0.0;
    }
    let rows = data.len() / width - 1;
    let p = data.as_ptr();
    let mut total = 0.0;
    for r in 0..rows {
        total += unsafe {
            *p.add(r * width + col)
        };
    }
    total
}`,
        why: 'Off by one: the last whole record is skipped (4 instead of 18), and an empty slice underflows `0 - 1`.',
      },
    ],
  },
  read: {
    lang: 'rust',
    optional: true,
    title: 'A checked read through a pointer',
    prompt:
      'Write `read(xs, i)`, which returns `Some(xs[i])` when `i` is in bounds and `None` otherwise, without indexing or `get`. Read through the raw pointer `xs.as_ptr()` with `add` instead, check the bounds *before* the `unsafe` block, and write a `// SAFETY:` comment.',
    starter: `fn read(xs: &[f64], i: usize)
    -> Option<f64> {
    todo!()
}`,
    solution: `fn read(xs: &[f64], i: usize)
    -> Option<f64> {
    if i >= xs.len() {
        return None;
    }
    let p = xs.as_ptr();
    // SAFETY: i < xs.len(), so p.add(i)
    // points at an element of xs.
    Some(unsafe { *p.add(i) })
}`,
    tests: `#[test]
fn reads_in_bounds() {
    let xs = [1.5, 2.5, 4.0];
    assert_eq!(read(&xs, 0), Some(1.5));
    assert_eq!(read(&xs, 2), Some(4.0));
}

#[test]
fn none_at_the_length() {
    let xs = [1.5, 2.5, 4.0];
    assert_eq!(read(&xs, 3), None);
}

#[test]
fn none_far_out_and_when_empty() {
    assert_eq!(read(&[1.0], usize::MAX), None);
    assert_eq!(read(&[], 0), None);
}`,
    hints: [
      'Return `None` first when `i >= xs.len()`.',
      'Then `let p = xs.as_ptr();` and read `unsafe { *p.add(i) }`.',
    ],
    walkthrough: `**How to think about it.** The same shape as *Unsafe Rust*'s \`at\`, with a raw pointer instead of \`get_unchecked\`: prove \`i < xs.len()\` in safe code, then read.

**The solution, line by line.**

- \`if i >= xs.len() { return None; }\` handles every out-of-bounds index, including any \`i\` at all for an empty slice and \`usize::MAX\`.
- \`let p = xs.as_ptr();\` makes a \`*const f64\` to element 0.
- \`// SAFETY: i < xs.len(), so p.add(i) points at an element of xs.\` records the proof.
- \`Some(unsafe { *p.add(i) })\` moves the pointer on by \`i\` elements, reads the \`f64\` and wraps it.

**Common wrong attempts.**

- \`if i > xs.len()\` lets \`i == len\` through: \`p.add(len)\` is a legal pointer (one past the end), but reading it is undefined behaviour.
- Reading before checking is the same bug in a different order: the check must come first.`,
    wrong: [
      {
        code: `fn read(xs: &[f64], i: usize)
    -> Option<f64> {
    if i + 1 >= xs.len() {
        return None;
    }
    let p = xs.as_ptr();
    Some(unsafe { *p.add(i) })
}`,
        why: 'Too strict: the last element is refused, so `read(&xs, 2)` is `None`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which of these lines needs `unsafe`?',
    options: [
      { t: '`let p = &raw const n;`', why: 'Making a raw pointer is safe; it promises nothing.' },
      { t: '`let v = *p;`', correct: true, why: 'Dereferencing a raw pointer is an unsafe operation (E0133 without `unsafe`).' },
      { t: '`let q = std::ptr::null::<i32>();`', why: 'Making a null pointer is safe; reading through it would not be.' },
      { t: '`p == q`', why: 'Comparing raw pointers compares addresses: safe.' },
    ],
  },
  {
    q: 'Why can you have a `*const i32` and a `*mut i32` to the same variable at once, when you could not have `&n` and `&mut n`?',
    options: [
      { t: 'Raw pointers are copies of the value', why: 'They are addresses, not copies; writing through the `*mut` changes `n`.' },
      { t: 'Raw pointers do not follow the borrowing rules; keeping reads and writes correct is your job inside `unsafe`', correct: true, why: 'That is one of the promises a raw pointer drops.' },
      { t: 'The compiler checks raw pointers more strictly', why: 'It checks them less: only dereferencing is restricted, to `unsafe`.' },
    ],
  },
  {
    q: '`p` points at the first of 4 `f64`s. Which is fine?',
    options: [
      { t: 'Reading `*p.add(4)`', why: 'One past the end may be computed, but not read: undefined behaviour.' },
      { t: 'Computing `p.add(4)` to compare with another pointer', correct: true, why: 'A pointer one past the end is allowed; it just must not be read.' },
      { t: 'Computing `p.add(5)`', why: 'Beyond one past the end, even computing it is undefined behaviour for `add`.' },
    ],
  },
  {
    q: 'You read through a pointer after the `Vec` it came from was dropped. In this chapter’s run, what did a normal debug build print?',
    options: [
      { t: 'A panic saying the pointer was dangling', why: 'That message came from Miri, not from the program.' },
      { t: 'A tiny number with about three hundred zeros after the point: whatever was in freed memory', correct: true, why: 'Undefined behaviour gave no warning at all; Miri reported “this pointer is dangling”.' },
      { t: 'A compile error', why: 'rustc cannot see through raw pointers; it compiles.' },
    ],
  },
  {
    q: 'What does `p.add(3)` do to a `*const f64`?',
    options: [
      { t: 'Adds 3 to the address', why: '`add` counts elements, not bytes.' },
      { t: 'Reads the value 3 elements on', why: '`add` only computes a pointer; reading needs `*`.' },
      { t: 'Moves the address on by 3 × 8 = 24 bytes', correct: true, why: '3 elements of `size_of::<f64>()` = 8 bytes each.' },
    ],
  },
];
