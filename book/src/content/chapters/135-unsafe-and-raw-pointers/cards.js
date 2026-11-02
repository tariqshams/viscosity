// Chapter 135 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from the two old unsafe chapters.

export const prompts = {
  'safety-comment': {
    q: 'What goes in a `// SAFETY:` comment?',
    a: 'The promise the unsafe operation needs, and why it holds at this spot (for example: “i < xs.len(), checked above”).',
  },
  'unsafe-not': {
    q: 'Does an `unsafe` block turn off the borrow checker?',
    a: 'No. Types and borrows are checked inside it as usual; it only allows the five extra operations.',
  },
  'ub-what': {
    q: 'What happens when unsafe code breaks its promise, say by reading past the end of an array?',
    a: 'Undefined behaviour: not a panic. The compiler assumes it never happens, so anything may follow: garbage values, a crash, or a missing read.',
  },
  'safe-wrapper': {
    q: 'What is the usual shape of code that needs `unsafe`?',
    a: 'A small safe function whose own checks make the unsafe operation’s promise true, around a short `unsafe` block, so no caller can misuse it.',
  },
  forbid: {
    q: 'What does `#![forbid(unsafe_code)]` do, and how is it stronger than `deny`?',
    a: 'Any `unsafe` block in the crate is an error, and no `#[allow(unsafe_code)]` further down can undo it (E0453).',
  },
  'raw-make': {
    q: 'Write two ways to make a raw pointer to a local variable `n`.',
    a: '`&raw const n` gives a `*const` pointer; `&raw mut n` gives a `*mut` pointer. (`xs.as_ptr()` makes one from a slice.)',
  },
  'raw-vs-ref': {
    q: 'Name three promises a reference `&T` keeps that a raw pointer does not.',
    a: 'Never null; points at a live, correctly aligned `T`; obeys the borrowing rules (and has a checked lifetime).',
  },
  'one-past': {
    q: 'For a pointer to the start of `len` elements, may you compute `p.add(len)`? May you read `*p.add(len)`?',
    a: 'You may compute it (one past the end is allowed, e.g. to compare), but reading through it is undefined behaviour.',
  },
};

export const examples = {
  'safe-get': {
    lang: 'rust',
    title: 'An unsafe fn inside a safe one',
    code: `/// # Safety
/// The caller must make sure that
/// \`i < xs.len()\`.
unsafe fn at_unchecked(
    xs: &[f64],
    i: usize,
) -> f64 {
    // SAFETY: the caller promised it.
    unsafe { *xs.get_unchecked(i) }
}

fn at(xs: &[f64], i: usize)
    -> Option<f64> {
    if i >= xs.len() {
        return None;
    }
    // SAFETY: i < xs.len(), checked
    // just above.
    Some(unsafe { at_unchecked(xs, i) })
}

fn main() {
    let xs = [1.5, 2.5, 4.0];
    println!("{:?}", at(&xs, 2));
    println!("{:?}", at(&xs, 3));
    println!("{:?}", at(&[], 0));
}`,
  },
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
  at: {
    lang: 'rust',
    title: 'A sound unchecked read',
    prompt: 'Write `at(xs, i)`, which returns `Some(xs[i])` when `i` is in bounds and `None` otherwise, without indexing (`xs[i]`) or `get`. Use the unsafe method `get_unchecked` instead, check the bounds *before* the `unsafe` block, and write a `// SAFETY:` comment saying why the call is fine. (The tests run in a debug build, where the standard library checks `get_unchecked`’s promise and stops the program if you break it.)',
    starter: `fn at(xs: &[f64], i: usize)
    -> Option<f64> {
    todo!()
}`,
    solution: `fn at(xs: &[f64], i: usize)
    -> Option<f64> {
    if i >= xs.len() {
        return None;
    }
    // SAFETY: i < xs.len(), checked
    // just above.
    let x = unsafe {
        *xs.get_unchecked(i)
    };
    Some(x)
}`,
    tests: `#[test]
fn reads_in_bounds() {
    let xs = [1.5, 2.5, 4.0];
    assert_eq!(at(&xs, 0), Some(1.5));
    assert_eq!(at(&xs, 2), Some(4.0));
}

#[test]
fn none_at_the_length() {
    let xs = [1.5, 2.5, 4.0];
    assert_eq!(at(&xs, 3), None);
}

#[test]
fn none_far_out_and_when_empty() {
    assert_eq!(at(&[1.0], usize::MAX), None);
    assert_eq!(at(&[], 0), None);
}

#[test]
fn agrees_with_get() {
    let xs: Vec<f64> =
        (0..10).map(|i| i as f64).collect();
    for i in 0..12 {
        let want = xs.get(i).copied();
        assert_eq!(at(&xs, i), want);
    }
}`,
    hints: [
      'Two cases: `i` is a valid index, or it is not. Which one should return early?',
      'Indices of a slice go from 0 to `xs.len() - 1`, so `i` is out of bounds when `i >= xs.len()`. Return `None` then.',
      'After that check, `unsafe { *xs.get_unchecked(i) }` reads the element; the `*` copies the `f64` out of the reference. Wrap it in `Some(...)`, with `// SAFETY: i < xs.len()` above it.',
    ],
    walkthrough: `**How to think about it.** \`get_unchecked\` makes one promise you must keep: the index is less than the length. So the job is to *prove* that before calling it, in safe code, and to hand back \`None\` whenever you cannot. Think of the figure in the chapter: the check is the safe shell, the unchecked read is the small core. Write the check first, then the read, then say in the comment why the read is fine.

**The solution, line by line.**

- \`fn at(xs: &[f64], i: usize) -> Option<f64> {\` is an ordinary safe function: no \`unsafe\` in its signature, so any caller may pass any \`i\`.
- \`    if i >= xs.len() {\` asks whether \`i\` is out of bounds. For a slice of length 3 the valid indices are 0, 1 and 2, so 3 and above are out; for an empty slice, every \`i\` is out.
- \`        return None;\` answers "no element" and leaves, so the read below never runs for a bad index.
- \`    // SAFETY: i < xs.len(), checked just above.\` records the argument a reviewer needs: past the \`if\`, \`i\` must be less than the length.
- \`    let x = unsafe { *xs.get_unchecked(i) };\` (split over three lines to fit) calls the unsafe method inside an \`unsafe\` block and copies the \`f64\` out of the reference it returns with \`*\`. In a release build this compiles to a plain load, with no comparison.
- \`    Some(x)\` wraps the value as the answer.

The last test checks \`at\` against the safe \`get\` for every index from 0 to 11 on a ten-element vector, including the two out-of-bounds ones.

**Common wrong attempts.**

- \`if i > xs.len()\` is off by one the dangerous way: \`at(&xs, 3)\` on a three-element slice passes the check and reads past the end. That is undefined behaviour. In a debug build the standard library's optional check stops the whole program with "unsafe precondition(s) violated" (it aborts, so not even the test runner gets to report the failure); in a release build nothing would stop it. This is the Rustonomicon's point about soundness: the bug is in safe code, yet the unsafe block is what misbehaves.
- \`if i + 1 >= xs.len()\` is off by one the other way: sound, but it refuses the last element.
- Writing \`xs.get_unchecked(i)\` without \`unsafe { }\` is error E0133.
- Leaving out the \`*\` gives a \`&f64\`, not an \`f64\`: a type error, since the function returns \`Option<f64>\`.`,
    wrong: [
      {
        code: `fn at(xs: &[f64], i: usize)
    -> Option<f64> {
    if i + 1 >= xs.len() {
        return None;
    }
    let x = unsafe {
        *xs.get_unchecked(i)
    };
    Some(x)
}`,
        why: 'Too cautious: the last element (index `len - 1`) is refused, so `at(&xs, 2)` is `None` instead of `Some(4.0)`. Sound, but wrong.',
      },
      {
        code: `fn at(xs: &[f64], i: usize)
    -> Option<f64> {
    if i >= xs.len() {
        return None;
    }
    let x = unsafe {
        xs.get_unchecked(i)
    };
    Some(x)
}`,
        why: 'Without the `*`, `x` is a `&f64`, so `Some(x)` is an `Option<&f64>`: a type error (E0308), since the function returns `Option<f64>`.',
      },
    ],
  },
  columnSum: {
    optional: true,
    lang: 'rust',
    title: 'One field, by stride',
    prompt: '`data` holds records of `width` numbers each, back to back (an array of structs, flattened: particle 0’s six fields, then particle 1’s, and so on). Write `column_sum(data, width, col)`, which adds up field `col` of every whole record, by walking a raw pointer from `data.as_ptr()` with `add`. Ignore a partial record at the end. If `col >= width` (which includes `width == 0`), return `0.0`. Put a `// SAFETY:` comment on the read.',
    starter: `fn column_sum(
    data: &[f64],
    width: usize,
    col: usize,
) -> f64 {
    todo!()
}`,
    solution: `fn column_sum(
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
}`,
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
    walkthrough: `**How to think about it.** This is the slow loop of an array of structs: summing one field of an array of structs means jumping \`width\` elements at a time, a **stride**. Before touching \`unsafe\`, decide which indices you will read and prove each one is in bounds; the code then only has to read exactly those. Record \`r\` starts at element \`r * width\`, and its field \`col\` is \`r * width + col\`. The largest \`r\` is \`rows - 1\`, where \`rows = len / width\`, so the largest index is \`(rows - 1) * width + col\`, which is less than \`rows * width\` as long as \`col < width\`, and \`rows * width\` is at most \`len\`. That inequality is the SAFETY comment.

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
        code: `fn column_sum(
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
        total += unsafe {
            *p.add(r + col)
        };
    }
    total
}`,
        why: 'The stride is missing: `r + col` steps one element per record, so it reads fields of record 0 (9 instead of 18 for the mass column).',
      },
      {
        code: `fn column_sum(
    data: &[f64],
    width: usize,
    col: usize,
) -> f64 {
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
    prompt: 'Write `read(xs, i)`, which returns `Some(xs[i])` when `i` is in bounds and `None` otherwise, without indexing or `get`. Read through the raw pointer `xs.as_ptr()` with `add` instead, check the bounds *before* the `unsafe` block, and write a `// SAFETY:` comment.',
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
    walkthrough: `**How to think about it.** The same shape as the sound \`at\` of *unsafe and raw pointers*, with a raw pointer instead of \`get_unchecked\`: prove \`i < xs.len()\` in safe code, then read.

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
    q: 'Inside an `unsafe` block, you take `&v[0]`, then `v.push(4)`, then use the reference. What happens?',
    options: [
      {
        t: 'It compiles: `unsafe` turns the borrow checker off',
        why: '`unsafe` turns nothing off; the borrow is checked as usual.',
      },
      {
        t: 'It compiles but is undefined behaviour',
        why: 'It never gets that far: rustc rejects it.',
      },
      {
        t: 'Error E0502, plus a warning that the `unsafe` block is unnecessary',
        correct: true,
        why: 'Exactly what rustc 1.97 printed: the borrow rules still apply, and nothing in the block needed `unsafe`.',
      },
    ],
  },
  {
    q: 'What does undefined behaviour mean?',
    options: [
      {
        t: 'The program panics with a message',
        why: 'A panic is defined behaviour. UB promises nothing at all.',
      },
      {
        t: 'The program broke a rule the compiler assumes is never broken, so anything may follow',
        correct: true,
        why: 'Here, one release build printed garbage and another died with “Illegal instruction” for the same kind of read.',
      },
      {
        t: 'The result is a random number',
        why: 'Sometimes it looks like that, but the compiler may also delete code or crash; nothing is promised.',
      },
      {
        t: 'The behaviour depends on the operating system',
        why: 'It is worse than that: it may differ between builds of the same program on the same machine.',
      },
    ],
  },
  {
    q: 'You run your crate’s tests under Miri and it reports nothing. What do you know?',
    options: [
      {
        t: 'The crate has no undefined behaviour',
        why: 'Miri checks only the runs it executes; untested paths may still be wrong.',
      },
      {
        t: 'The tests you ran did not hit undefined behaviour that Miri can detect',
        correct: true,
        why: 'As the Rust book puts it: if Miri finds a problem you have a bug, but a clean run does not mean there is none.',
      },
      {
        t: 'The crate has no `unsafe` code',
        why: 'Miri runs code with or without `unsafe`; a clean run says nothing about how much there is.',
      },
    ],
  },
  {
    q: 'Why can you have a `*const i32` and a `*mut i32` to the same variable at once, when you could not have `&n` and `&mut n`?',
    options: [
      {
        t: 'Raw pointers are copies of the value',
        why: 'They are addresses, not copies; writing through the `*mut` changes `n`.',
      },
      {
        t: 'Raw pointers do not follow the borrowing rules; keeping reads and writes correct is your job inside `unsafe`',
        correct: true,
        why: 'That is one of the promises a raw pointer drops.',
      },
      {
        t: 'The compiler checks raw pointers more strictly',
        why: 'It checks them less: only dereferencing is restricted, to `unsafe`.',
      },
    ],
  },
  {
    q: '`p` points at the first of 4 `f64`s. Which is fine?',
    options: [
      {
        t: 'Reading `*p.add(4)`',
        why: 'One past the end may be computed, but not read: undefined behaviour.',
      },
      {
        t: 'Computing `p.add(4)` to compare with another pointer',
        correct: true,
        why: 'A pointer one past the end is allowed; it just must not be read.',
      },
      {
        t: 'Computing `p.add(5)`',
        why: 'Beyond one past the end, even computing it is undefined behaviour for `add`.',
      },
    ],
  },
];
