// Chapter 432b cards. Keys are stable ids: never rename them.

// Shared by the exercise: RhsEffect, as in analysis.rs.
const SCAF = `// What the right-hand side of a field
// write can do, from least to worst.
#[derive(Copy, Clone, PartialEq, Eq,
    PartialOrd, Ord, Debug)]
enum Effect {
    Inert,
    MayThrow,
    Effects,
}
use Effect::*;
`;

const SIG = `// The worst of what the instructions of
// a right-hand side can do.
fn worst(xs: &[Effect]) -> Effect {`;

const SIG2 = `// op: "=", "+=", "||=", ...
// ok: proven in bounds (or assumed)
// typed: a Float64Array column
fn store_late(
    op: &str,
    ok: bool,
    typed: bool,
    rhs: Effect,
) -> bool {`;

const WORST = `${SIG}
    let mut w = Inert;
    for &x in xs {
        w = w.max(x);
    }
    w
}`;

const LATE = `${SIG2}
    let plain_eq = op == "="
        && !ok
        && rhs != Inert;
    let grows = typed && rhs == Effects;
    plain_eq || grows
}`;

export const prompts = {
  'cg-spec-order': {
    q: 'In what order does JavaScript evaluate `ps[i].x = rhs`?',
    a: 'The left-hand side to a reference (base `ps[i]`, name `x`), then `rhs`, then the store (`PutValue`), which is what throws on an `undefined` base.',
  },
  'cg-col-fetch': {
    q: 'Why could `ps.x[3] = (more(), 77)` lose the write when `more()` pushes?',
    a: 'Evaluating the left-hand side fetches the column first. If the push grows the container, `grow()` replaces `this.x`, and the store goes into the old column.',
  },
  'cg-rust-borrow': {
    q: 'What does rustc say about holding `&mut ps.x`, calling `ps.push(...)`, then storing through the first reference?',
    a: 'Error E0499: cannot borrow `ps` as mutable more than once at a time.',
  },
  'cg-ord-derive': {
    q: 'What does `#[derive(PartialOrd, Ord)]` on `RhsEffect` give the analysis?',
    a: 'An order that follows the variants as written, `Inert < MayThrow < Effects`, so the worst of several effects is `max`.',
  },
  'cg-rhs-effect': {
    q: 'What are the three values of `RhsEffect`, and what decides between them?',
    a: '`Inert`, `MayThrow` and `Effects`: the worst thing any instruction evaluated within the assignment (besides the element itself, and the old value of a compound write) can do.',
  },
  'cg-bk-nan': {
    q: 'Why does `__vsc_bk` return `NaN` out of bounds instead of throwing?',
    a: 'So the check is decided before the right-hand side but the error comes after it: `__vsc_set` throws when it sees `i !== i`, as the original’s store would.',
  },
  'cg-plain-cheap': {
    q: 'A proven write to a plain (non-typed) column has a right side that calls a function. Is it stored late?',
    a: 'No. A plain column is an ordinary array that is never replaced, and a proven index can’t fail, so the order can’t be observed.',
  },
  'cg-k-scratch': {
    q: 'In the late form of `ps[4].x += rhs`, why is the checked index saved in `__vsc_k`?',
    a: 'The old value is read with that index first and the late store needs the same index after the right side, so it is computed once and kept.',
  },
};

export const examples = {
  'grow-borrow': {
    lang: 'rust',
    title: 'Hold a column, grow, store',
    expectError: true,
    code: `struct Soa {
    x: Vec<f64>,
}

impl Soa {
    // May move x to a bigger buffer.
    fn push(&mut self, v: f64) {
        self.x.push(v);
    }
}

fn main() {
    let x = vec![4.0; 4];
    let mut ps = Soa { x };
    // The old emitter's order for
    // ps[3].x = (more(), 77): take the
    // column, run the rhs, then store.
    let col = &mut ps.x;
    ps.push(0.0);
    col[3] = 77.0;
    println!("{}", ps.x[3]);
}
`,
  },
};

export const exercises = {
  storeLate: {
    lang: 'rust',
    title: 'When to store late',
    prompt:
      'Write the two pieces of the late-store decision. `worst(xs)` returns the worst `Effect` in `xs` (`Inert` for an empty slice), using the derived order `Inert < MayThrow < Effects`. `store_late(op, ok, typed, rhs)` returns `true` exactly when the emitter must store late: either `op` is `"="`, the index is not `ok`, and `rhs` is not `Inert`; or the column is `typed` and `rhs` is `Effects`.',
    starter: `${SCAF}
${SIG}
    todo!()
}

${SIG2}
    todo!()
}`,
    solution: `${SCAF}
${WORST}

${LATE}`,
    tests: `#[test]
fn worst_of_nothing_is_inert() {
    assert_eq!(worst(&[]), Inert);
}

#[test]
fn worst_takes_the_maximum() {
    let xs = [MayThrow, Inert, MayThrow];
    assert_eq!(worst(&xs), MayThrow);
    let ys = [Inert, Effects, MayThrow];
    assert_eq!(worst(&ys), Effects);
}

#[test]
fn proven_typed_late_only_for_effects() {
    assert!(!store_late("=", true, true,
        MayThrow));
    assert!(store_late("=", true, true,
        Effects));
}

#[test]
fn proven_plain_is_never_late() {
    for e in [Inert, MayThrow, Effects] {
        assert!(!store_late("=", true,
            false, e));
    }
}

#[test]
fn unproven_assignment_with_a_live_rhs() {
    assert!(!store_late("=", false,
        false, Inert));
    assert!(store_late("=", false,
        false, MayThrow));
    assert!(store_late("=", false,
        false, Effects));
}

#[test]
fn compound_writes_read_first() {
    assert!(!store_late("+=", false,
        false, MayThrow));
    assert!(!store_late("+=", false,
        false, Effects));
    assert!(store_late("+=", false,
        true, Effects));
}
`,
    hints: [
      '`worst` is a running maximum: start at `Inert` (the least) and replace it with `w.max(x)` for each `x`. `max` exists because the enum derives `Ord`.',
      '`store_late` is the condition from `emit.rs` with the leading `write &&` dropped. It has two parts joined by `||`; write each as its own `let` with a name.',
      'Part one: `op == "=" && !ok && rhs != Inert`. Part two: `typed && rhs == Effects`. Return `plain_eq || grows`.',
    ],
    walkthrough: `**How to think about it.** Ask, for each kind of write, "could a program tell the difference between checking and storing early and doing it in JavaScript's order?" Two things can give the order away. A check that throws: that only matters for a plain \`=\` (a compound \`+=\` reads the element first in the original too, so its error comes first either way), only when the index isn't proven, and only when the right side can do something before the store, even if it is only throw its own error. And a column that is replaced: only a typed column (or AoSoA's \`data\`) is ever replaced, by \`grow()\`, and only a right side that runs code can make it grow. Those two sentences are the two halves of the condition in \`engine/rust/crates/frontend-js/src/emit.rs\`; \`worst\` is how the analysis in \`analysis.rs\` reduces a whole right-hand side to one \`RhsEffect\`.

**The solution, line by line.**

- \`let mut w = Inert;\` starts at the least effect, so an empty right side (nothing to evaluate) is \`Inert\`.
- \`for &x in xs { w = w.max(x); }\`: \`&x\` copies each \`Effect\` out of the slice (it derives \`Copy\`), and \`max\` keeps the larger of two values in the derived order. The real code writes \`worst = worst.max(effect(x))\`.
- \`w\` is returned.
- \`let plain_eq = op == "=" && !ok && rhs != Inert;\` is the first reason to store late: an unproven plain assignment whose right side could act or throw before the store. \`op == "="\` compares a \`&str\` with a string literal, which Rust allows directly.
- \`let grows = typed && rhs == Effects;\` is the second: a typed column that the right side could replace by pushing.
- \`plain_eq || grows\` is the answer.

**Common wrong attempts.**

- Storing late whenever \`!ok\`: an inert right side can't reveal the order, so \`ps.x[__vsc_bc(...)] = 5\` is fine and cheaper, and \`unproven_assignment_with_a_live_rhs\` fails.
- Forgetting \`op == "="\`: a compound write would then store late for a right side that only may throw, although its own read of the old value throws first in both versions; \`compound_writes_read_first\` fails.
- Writing \`typed && rhs != Inert\`: a right side that may only throw can't push, so it can't replace the column; \`proven_typed_late_only_for_effects\` fails.`,
    wrong: [
      {
        code: `${SCAF}
${WORST}

${SIG2}
    let plain_eq = op == "=" && !ok;
    let grows = typed && rhs == Effects;
    plain_eq || grows
}`,
        why: 'An unproven write with an inert right side can keep the cheap checked form: nothing on the right can reveal when the check ran.',
      },
      {
        code: `${SCAF}
${WORST}

${SIG2}
    let plain_eq = !ok && rhs != Inert;
    let grows = typed && rhs == Effects;
    plain_eq || grows
}`,
        why: 'A compound write such as `+=` reads the element first in the original too, so a right side that may throw doesn’t need a late store; only `=` does.',
      },
      {
        code: `${SCAF}
${WORST}

${SIG2}
    let plain_eq = op == "="
        && !ok
        && rhs != Inert;
    let grows = typed && rhs != Inert;
    plain_eq || grows
}`,
        why: 'A right side that may only throw can’t push, so it can’t make `grow()` replace the column. Only `Effects` can.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Out of bounds, the original `ps[100].x = (t = 5)` throws. When?',
    options: [
      { t: 'Before `t = 5`, when `ps[100]` turns out to be `undefined`', why: 'Reading `ps[100]` gives `undefined` without throwing. The left side is just a reference.' },
      { t: 'It never throws: it creates the element', why: 'Setting a property of `undefined` always throws a `TypeError`.' },
      { t: 'After `t = 5`, when the store tries to set `x` on `undefined`', correct: true, why: '`PutValue` runs after the right-hand side and throws there, so `t` is 5 in the `catch`.' },
    ],
  },
  {
    q: 'Why did the old output `ps.x[__vsc_bc(ps, 100, \'x\', true)] = (t = 5)` print `t` as 0?',
    options: [
      { t: 'The left-hand side, including the check, is evaluated before the right-hand side', correct: true, why: 'So `__vsc_bc` threw before `t = 5` ran.' },
      { t: '`__vsc_bc` resets `t`', why: 'It doesn’t touch anything but its arguments.' },
      { t: 'The typed column stored 5 as 0', why: 'Nothing was stored at all.' },
    ],
  },
  {
    q: 'A right-hand side calls a function that pushes onto `ps`. Why can the cheap `ps.x[i] = rhs` lose the write?',
    options: [
      { t: 'The push shifts every element up by one', why: 'A push appends; indices don’t move.' },
      { t: '`ps.x` was fetched before `rhs`; if the push grows the container, `grow()` replaces `this.x`, and the store goes into the old array', correct: true, why: 'This was bug 12 in the README, also for `+=`, `||=` and AoSoA’s `data`.' },
      { t: 'Float64Array is read-only while a push runs', why: 'Typed arrays can always be written.' },
    ],
  },
  {
    q: 'A write to a **plain** (non-typed) column, with a proven index and a right-hand side that calls a function. Which form does the emitter use?',
    options: [
      { t: '`__vsc_set`, because the right side runs code', why: 'Only typed columns are replaced by `grow()`, and a proven index can’t fail.' },
      { t: '`__vsc_bk` and `__vsc_set`, for safety', why: 'The order can’t be observed here, so the cheap form is kept.' },
      { t: 'The cheap `ps.col[i] = rhs`', correct: true, why: 'A plain column is an ordinary array that is never replaced, so fetching it early is fine.' },
    ],
  },
  {
    q: 'In `__vsc_set(c, col, i, v, f)`, what does the test `i !== i` check?',
    options: [
      { t: 'Whether `__vsc_bk` returned `NaN`, i.e. the index was out of bounds', correct: true, why: '`NaN` is the only value not equal to itself. The throw then happens after the right-hand side ran, as in the original.' },
      { t: 'Whether `i` is a string', why: 'A string equals itself.' },
      { t: 'Nothing: it is always false', why: 'It is true for `NaN`.' },
    ],
  },
];
