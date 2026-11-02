// Chapter 239 cards. Keys are stable ids: never rename them.

export const prompts = {
  'raw-make': {
    q: 'Do you need `unsafe` to *create* a raw pointer such as `&raw const x`?',
    a: 'No. Creating one is safe; only dereferencing it needs `unsafe`.',
  },
  'raw-types': {
    q: 'What are the two raw pointer types?',
    a: '`*const T` (read through it) and `*mut T` (read and write through it).',
  },
  'raw-vs-ref': {
    q: 'Name two things a `&T` guarantees that a `*const T` does not.',
    a: 'That it is non-null and points at a live, valid `T` (and that the borrowing rules hold).',
  },
  'unsafe-five': {
    q: 'What is the most common thing an `unsafe` block lets you do?',
    a: 'Dereference a raw pointer. (Also: call `unsafe` functions, use `static mut`, implement `unsafe` traits, read `union` fields.)',
  },
  'unsafe-not': {
    q: 'Does the borrow checker still run inside an `unsafe` block?',
    a: 'Yes. `unsafe` turns off no checks; it only unlocks a few extra operations.',
  },
  'ub-what': {
    q: 'What happens if code inside `unsafe` reads past the end of an array?',
    a: 'Undefined behaviour: the program may print junk, crash, or be optimized into something else. No panic is guaranteed.',
  },
  'safety-comment': {
    q: 'What does a `// SAFETY:` comment above an `unsafe` block say?',
    a: 'Why the operation is sound here: the promise the compiler can’t check, and how the code keeps it.',
  },
  'safe-wrapper': {
    q: 'Why wrap `unsafe` code in a safe function?',
    a: 'The checks live in one place, so callers can’t misuse it: the function itself rules out the bad inputs.',
  },
  forbid: {
    q: 'What does `#![forbid(unsafe_code)]` at the top of `lib.rs` do?',
    a: 'Makes any `unsafe` block, fn or impl in the crate a compile error, and stops any inner `#[allow]` from re-enabling it.',
  },
  'forbid-scope': {
    q: 'drip-rs forbids unsafe code. Does that mean no unsafe code runs?',
    a: 'No. The lint covers only drip-rs’s own source; `Vec` and the rest of `std` use `unsafe` internally.',
  },
  'forbid-paid': {
    q: 'What did removing five bounds and `Option` checks from drip-rs (with `unsafe`) buy in this chapter’s experiment?',
    a: 'About 1–16% on minimum times, in two noisy rounds on a shared VM. Not a different league.',
  },
};

export const examples = {
  'raw-play': {
    lang: 'rust',
    title: 'Raw pointers, made safely, read unsafely',
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
  'raw-no-unsafe': {
    lang: 'rust',
    expectError: true,
    title: 'Dereferencing outside unsafe',
    code: `fn main() {
    let x = 5;
    let p = &raw const x;
    // E0133: needs an unsafe block.
    println!("{}", *p);
}`,
  },
};

const SIG = `fn read(xs: &[f64], i: usize)
    -> Option<f64> {
    let p: *const f64 = xs.as_ptr();`;

export const exercises = {
  read: {
    lang: 'rust',
    title: 'A safe read on top of a raw pointer',
    prompt:
      'Write `read(xs, i)`, which returns `Some(xs[i])` when `i` is in bounds and `None` otherwise, without using indexing or `get`. Read through the raw pointer `p` instead: `p.add(i)` is a pointer to element `i`, and both `add` and the dereference need `unsafe`. Check the bounds *before* the `unsafe` block, and write a `// SAFETY:` comment saying why the read is fine.',
    starter: `${SIG}
    todo!()
}`,
    solution: `${SIG}
    if i >= xs.len() {
        return None;
    }
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
}

#[test]
fn agrees_with_get() {
    let xs: Vec<f64> = (0..10).map(|i| i as f64 * 0.5).collect();
    for i in 0..12 {
        assert_eq!(read(&xs, i), xs.get(i).copied());
    }
}`,
    hints: [
      'First rule out the bad case: if `i >= xs.len()`, return `None` before touching the pointer.',
      'Now `i < xs.len()`, so `p.add(i)` stays inside the slice. Dereference it with `*` inside `unsafe { ... }`.',
      'The whole read is one expression: `Some(unsafe { *p.add(i) })`. Put the SAFETY comment just above it.',
    ],
    walkthrough: `The shape is the one the standard library uses everywhere: **check, then do the unchecked thing**.

\`\`\`rust
if i >= xs.len() {
    return None;
}
// SAFETY: i < xs.len(), so p.add(i)
// points at an element of xs.
Some(unsafe { *p.add(i) })
\`\`\`

- \`xs.as_ptr()\` is safe: it only produces an address.
- \`p.add(i)\` is an \`unsafe fn\`: it moves the pointer \`i\` elements (\`i * 8\` bytes for \`f64\`), and it is undefined behaviour if the result leaves the slice. The \`if\` above makes sure it doesn’t.
- \`*\` on a raw pointer is the other unsafe operation. Because \`f64\` is \`Copy\`, \`*p.add(i)\` copies the value out.

Notice where the safety lives. The \`unsafe\` block is one line, and the reason it is fine is the \`if\` just above it. A caller of \`read\` can’t break anything, whatever \`i\` they pass, so \`read\` itself is an ordinary safe function. That is what \`slice::get\` does inside \`std\`, and it is why \`agrees_with_get\` passes.`,
    wrong: [
      {
        code: `${SIG}
    if i >= xs.len() {
        return None;
    }
    Some(*p.add(i))
}`,
        why: 'Both `p.add(i)` and `*` on a raw pointer are unsafe operations, so this is rejected with E0133. The `if` makes the read sound, but the compiler can’t see that: you have to say so with an `unsafe` block.',
      },
      {
        code: `${SIG}
    if i >= xs.len() {
        return None;
    }
    // SAFETY: the slice is not empty.
    Some(unsafe { *p })
}`,
        why: '`p` points at element 0, so this always returns the first element. Move the pointer with `p.add(i)` first.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which line needs an `unsafe` block?',
    options: [
      { t: '`let p = &raw const x;`', why: 'Creating a raw pointer is safe. Nothing is read yet.' },
      { t: '`let q = p;`', why: 'Copying a raw pointer is safe too: it is just an address.' },
      { t: '`let y = *p;`', correct: true, why: 'Dereferencing a raw pointer is the operation the compiler can’t check, so it needs `unsafe` (E0133 otherwise).' },
      { t: '`let b = p.is_null();`', why: '`is_null` only looks at the address, so it is a safe method.' },
    ],
  },
  {
    q: 'Inside `unsafe { ... }` you take `&v[0]` and then call `v.push(4)` while the reference is still used. What happens?',
    options: [
      { t: 'It compiles: `unsafe` turns off the borrow checker', why: 'It doesn’t. `unsafe` adds a few operations; every other check still runs.' },
      { t: 'It is rejected with E0502, as it would be outside `unsafe`', correct: true, why: 'Rust 1.97 reports the same borrow error, plus a warning that the `unsafe` block is unnecessary.' },
      { t: 'It compiles but panics at run time', why: 'The borrow checker works at compile time, inside `unsafe` too.' },
    ],
  },
  {
    q: 'What is true of a `*const f64`?',
    options: [
      { t: 'It is always non-null', why: 'That is a property of references. `std::ptr::null()` is a valid raw pointer value.' },
      { t: 'The borrow checker tracks how long it lives', why: 'Raw pointers have no lifetime; nothing stops one from outliving its data.' },
      { t: 'Dropping it frees the `f64`', why: 'Copying or dropping a raw pointer has no effect on the value it points at.' },
      { t: 'It may be null or dangling, and only an `unsafe` dereference reads through it', correct: true, why: 'Creating, copying and comparing it are safe; reading through it is up to you.' },
    ],
  },
  {
    q: 'drip-rs’s `lib.rs` has `#![forbid(unsafe_code)]` at the top. Someone adds `#[allow(unsafe_code)]` on one function. What happens?',
    options: [
      { t: 'That one function may now use `unsafe`', why: 'That is what `deny` would allow. `forbid` can’t be overridden lower down.' },
      { t: 'Compile error E0453: allow is incompatible with the earlier forbid', correct: true, why: 'Measured with rustc 1.97. `forbid` is the strictest lint level.' },
      { t: 'A warning, and the build continues', why: 'Both the `allow` and any `unsafe` block are errors.' },
    ],
  },
  {
    q: 'In this chapter’s experiment, replacing five checked reads in drip-rs with unchecked ones made it…',
    options: [
      { t: 'Several times faster', why: 'The minimum times improved by roughly 1–16%, and the medians moved about as much as the noise.' },
      { t: 'A few percent faster on minimum times, about as much as the run-to-run noise', correct: true, why: 'Two rounds of seven runs each on a shared VM. Bounds checks are cheap when the branch predictor always guesses “in bounds”.' },
      { t: 'Slower', why: 'Not in these runs: the unchecked build had the lower minimum on every program.' },
      { t: 'Crash on the benchmark programs', why: 'Its output matched the checked build. A crash would need an index that is really out of bounds.' },
    ],
  },
  {
    q: 'What is a “safe abstraction” over unsafe code?',
    options: [
      { t: 'A function whose own checks make every call sound, so callers need no `unsafe`', correct: true, why: 'Like `slice::get`: the bounds check happens inside, and the unchecked read can’t be reached with a bad index.' },
      { t: 'Any function containing an `unsafe` block', why: 'Only if the function rules out the inputs that would break the promise.' },
      { t: 'An `unsafe fn`', why: 'An `unsafe fn` is the opposite: it hands the promise to its callers.' },
    ],
  },
];
