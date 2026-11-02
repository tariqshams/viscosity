// Chapter 368 cards. Keys are stable ids: never rename them.
// Every rustc message and timing quoted here was produced with rustc
// 1.97.0 on x86-64 Linux while the chapter was written.

const SOL = `fn at(xs: &[f64], i: usize)
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
}`;

export const prompts = {
  'safety-comment': {
    q: 'What goes in a `// SAFETY:` comment?',
    a: 'The promise the unsafe operation needs, and why it holds at this spot (for example: “i < xs.len(), checked above”).',
  },
  'unsafe-five': {
    q: 'Name the five operations that need `unsafe`, according to the Rust book.',
    a: 'Dereference a raw pointer; call an unsafe function or method; access or modify a mutable static; implement an unsafe trait; access fields of a union.',
  },
  'unsafe-not': {
    q: 'Does an `unsafe` block turn off the borrow checker?',
    a: 'No. Types and borrows are checked inside it as usual; it only allows the five extra operations.',
  },
  'ub-what': {
    q: 'What happens when unsafe code breaks its promise, say by reading past the end of an array?',
    a: 'Undefined behaviour: not a panic. The compiler assumes it never happens, so anything may follow: garbage values, a crash, or a missing read.',
  },
  'miri-what': {
    q: 'What is Miri, and what is its limit?',
    a: 'An interpreter (on nightly Rust) that runs your program or tests and reports undefined behaviour where it happens. It only checks the runs you give it, so a clean run proves nothing.',
  },
  'safe-wrapper': {
    q: 'What is the usual shape of code that needs `unsafe`?',
    a: 'A small safe function whose own checks make the unsafe operation’s promise true, around a short `unsafe` block, so no caller can misuse it.',
  },
  'sound-nonlocal': {
    q: 'A safe `at(xs, i)` checks `if i >= xs.len() { return None; }` before `get_unchecked(i)`. What happens if someone changes `>=` to `>`?',
    a: 'At `i == len` it reads past the end: undefined behaviour. Only safe code changed, which is why soundness is non-local.',
  },
  forbid: {
    q: 'What does `#![forbid(unsafe_code)]` do, and how is it stronger than `deny`?',
    a: 'Any `unsafe` block in the crate is an error, and no `#[allow(unsafe_code)]` further down can undo it (E0453).',
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
};

export const exercises = {
  at: {
    lang: 'rust',
    title: 'A sound unchecked read',
    prompt:
      'Write `at(xs, i)`, which returns `Some(xs[i])` when `i` is in bounds and `None` otherwise, without indexing (`xs[i]`) or `get`. Use the unsafe method `get_unchecked` instead, check the bounds *before* the `unsafe` block, and write a `// SAFETY:` comment saying why the call is fine. (The tests run in a debug build, where the standard library checks `get_unchecked`’s promise and stops the program if you break it.)',
    starter: `fn at(xs: &[f64], i: usize)
    -> Option<f64> {
    todo!()
}`,
    solution: SOL,
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
};

export const quiz = [
  {
    q: 'Which of these needs an `unsafe` block?',
    options: [
      { t: 'Calling `xs.get(i)`', why: '`get` checks the index and returns an `Option`: safe.' },
      { t: 'Calling `xs.get_unchecked(i)`', correct: true, why: 'It is an `unsafe fn`: the caller must promise `i < xs.len()`, so the call needs `unsafe` (E0133 otherwise).' },
      { t: 'Indexing `xs[i]`', why: 'Indexing checks and panics on a bad index: safe.' },
    ],
  },
  {
    q: 'Inside an `unsafe` block, you take `&v[0]`, then `v.push(4)`, then use the reference. What happens?',
    options: [
      { t: 'It compiles: `unsafe` turns the borrow checker off', why: '`unsafe` turns nothing off; the borrow is checked as usual.' },
      { t: 'It compiles but is undefined behaviour', why: 'It never gets that far: rustc rejects it.' },
      { t: 'Error E0502, plus a warning that the `unsafe` block is unnecessary', correct: true, why: 'Exactly what rustc 1.97 printed: the borrow rules still apply, and nothing in the block needed `unsafe`.' },
    ],
  },
  {
    q: 'What does undefined behaviour mean?',
    options: [
      { t: 'The program panics with a message', why: 'A panic is defined behaviour. UB promises nothing at all.' },
      { t: 'The program broke a rule the compiler assumes is never broken, so anything may follow', correct: true, why: 'Here, one release build printed garbage and another died with “Illegal instruction” for the same kind of read.' },
      { t: 'The result is a random number', why: 'Sometimes it looks like that, but the compiler may also delete code or crash; nothing is promised.' },
      { t: 'The behaviour depends on the operating system', why: 'It is worse than that: it may differ between builds of the same program on the same machine.' },
    ],
  },
  {
    q: 'You run your crate’s tests under Miri and it reports nothing. What do you know?',
    options: [
      { t: 'The crate has no undefined behaviour', why: 'Miri checks only the runs it executes; untested paths may still be wrong.' },
      { t: 'The tests you ran did not hit undefined behaviour that Miri can detect', correct: true, why: 'As the Rust book puts it: if Miri finds a problem you have a bug, but a clean run does not mean there is none.' },
      { t: 'The crate has no `unsafe` code', why: 'Miri runs code with or without `unsafe`; a clean run says nothing about how much there is.' },
    ],
  },
  {
    q: 'drip-rs has `#![forbid(unsafe_code)]`. What did that cost it, by this chapter’s measurement?',
    options: [
      { t: 'Nothing: the checks are free', why: 'The unchecked copy was 3 to 13 percent faster on the fastest runs.' },
      { t: 'About half its speed', why: 'Far less: checks that never fail are cheap because the branch predictor learns them.' },
      { t: 'A few percent of run time, in exchange for collector bugs that panic instead of corrupting memory', correct: true, why: 'Five checked reads, made unchecked, saved 3 to 13 percent; the checks turn a stale handle into a panic.' },
    ],
  },
];
