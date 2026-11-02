// Chapter 428b cards. Keys are stable ids: never rename them.

// Shared by the exercise: a tiny arena of SSA values.
const SCAF = `use std::collections::HashSet;

// One SSA value. Operands are indexes
// into the same slice (typed ids, kept
// as usize here).
enum Op {
    Num(f64),
    // a + b
    Add(usize, usize),
    Phi(Vec<usize>),
    Other,
}
`;
export const prompts = {
  'bp-four': {
    q: 'Which four questions does the Rust bounds proof ask of an element read `c[i]`?',
    a: 'Is `i` the phi of a loop header around the read? Is it a counting phi (non-negative integer start, `+ 1` step)? Does that header test `i < c.length`? Does the test’s true edge dominate the read?',
  },
  'acc-both-orders': {
    q: 'Why does `is_counting_phi` try the phi’s operands in both orders?',
    a: 'A phi’s operands are in predecessor order, so the start may be either one. The step is the one that is the phi plus 1.',
  },
  'acc-seen': {
    q: 'In `non_neg_int`, what happens when a value is reached a second time?',
    a: '`seen.insert` returns `false`, and the function answers `true`: the value is assumed fine, which ends the cycle through the phi.',
  },
  'bp-finite': {
    q: 'Why does `non_neg_int` check `x.is_finite()` before `x.trunc() == *x`?',
    a: 'Because `f64::INFINITY.trunc()` is infinity, so an infinite constant would otherwise pass as a whole number.',
  },
  'bp-le': {
    q: 'Why is `ps[i]` in `for (let i = 0; i <= ps.length; i++)` not proven in bounds?',
    a: 'The guard must be `<`, and here it is `<=`. Rightly so: on the last trip `i` is `ps.length`, and the read throws.',
  },
  'acc-k-plus-1': {
    q: 'Why is `ps[k + 1]` in `for (let k = -1; k < ps.length; k++)` not proven in bounds?',
    a: 'The index is an addition, not the loop’s phi. It is also really out of bounds on the last trip, where `k + 1` is `ps.length`.',
  },
  'bp-const-bound': {
    q: '`ps` holds exactly 100 elements. Is `ps[i]` in `for (let i = 0; i < 100; i++)` proven in bounds?',
    a: 'No. The guard must read `ps.length`; the analysis doesn’t compare 100 with a size it only estimates.',
  },
  'acc-two-phases': {
    q: 'Why are bounds proofs collected into a `Vec<bool>` before being stored in `index_gets`?',
    a: 'The proving loop calls `&self` methods, which borrow all of `self`, so it can’t hold a mutable borrow of the collection at the same time.',
  },
};

export const exercises = {
  countingPhi: {
    lang: 'rust',
    title: 'Counting phis',
    prompt:
      'Write the two proofs of the bounds check over a small arena `o`. `non_neg(o, v, seen)`: if `v` is already in `seen`, return `true`; otherwise insert it, then accept a finite whole `Num` that is at least 0, an `Add` whose two operands both are, or a `Phi` whose operands all are. Anything else is `false`. `counting(o, v)`: `v` is a `Phi` with exactly two operands, and in one of the two orders, the second operand is `Add(v, one)` where `one` is `Num(1.0)`, and the first is a non-negative integer (with a fresh `seen`).',
    starter: `${SCAF}
fn non_neg(
    o: &[Op],
    v: usize,
    seen: &mut HashSet<usize>,
) -> bool {
    todo!()
}

fn counting(
    o: &[Op],
    v: usize,
) -> bool {
    todo!()
}`,
    solution: `${SCAF}
fn non_neg(
    o: &[Op],
    v: usize,
    seen: &mut HashSet<usize>,
) -> bool {
    if !seen.insert(v) {
        return true;
    }
    match &o[v] {
        Op::Num(x) => {
            x.is_finite()
                && x.trunc() == *x
                && *x >= 0.0
        }
        Op::Add(a, b) => {
            non_neg(o, *a, seen)
                && non_neg(o, *b, seen)
        }
        Op::Phi(xs) => {
            xs.iter().all(|&a| {
                non_neg(o, a, seen)
            })
        }
        Op::Other => false,
    }
}

fn counting(
    o: &[Op],
    v: usize,
) -> bool {
    let Op::Phi(xs) = &o[v] else {
        return false;
    };
    if xs.len() != 2 {
        return false;
    }
    for (s0, s1) in [(0, 1), (1, 0)] {
        let st = &o[xs[s1]];
        let &Op::Add(a, b) = st else {
            continue;
        };
        let one = matches!(
            o[b],
            Op::Num(n) if n == 1.0
        );
        if a != v || !one {
            continue;
        }
        let mut seen = HashSet::new();
        let s = xs[s0];
        if non_neg(o, s, &mut seen) {
            return true;
        }
    }
    false
}`,
    tests: `use Op::*;

// for (let i = 0; ...; i++)
fn simple() -> Vec<Op> {
    vec![Num(0.0), Phi(vec![0, 3]),
        Num(1.0), Add(1, 2)]
}

#[test]
fn counts_from_zero() {
    assert!(counting(&simple(), 1));
}

#[test]
fn either_operand_order() {
    let ops = vec![Num(0.0),
        Phi(vec![3, 0]), Num(1.0),
        Add(1, 2)];
    assert!(counting(&ops, 1));
}

#[test]
fn starts_at_i_plus_1() {
    // j = i + 1, then j++
    let mut ops = simple();
    ops.push(Add(1, 2)); // 4: i + 1
    ops.push(Phi(vec![4, 7])); // 5: j
    ops.push(Num(1.0)); // 6
    ops.push(Add(5, 6)); // 7: j + 1
    assert!(counting(&ops, 5));
}

#[test]
fn negative_or_fractional_starts() {
    for s in [-1.0, 0.5, f64::INFINITY] {
        let ops = vec![Num(s),
            Phi(vec![0, 3]), Num(1.0),
            Add(1, 2)];
        assert!(!counting(&ops, 1), "{s}");
    }
}

#[test]
fn steps_must_be_plus_one() {
    let ops = vec![Num(0.0),
        Phi(vec![0, 3]), Num(2.0),
        Add(1, 2)];
    assert!(!counting(&ops, 1));
}

#[test]
fn only_two_operand_phis() {
    let ops = vec![Num(0.0),
        Phi(vec![0, 3, 0]), Num(1.0),
        Add(1, 2)];
    assert!(!counting(&ops, 1));
    assert!(!counting(&ops, 0));
}

#[test]
fn unknown_values_are_not_proven() {
    let ops = vec![Other,
        Phi(vec![0, 3]), Num(1.0),
        Add(1, 2)];
    assert!(!counting(&ops, 1));
}
`,
    hints: [
      'Start with `non_neg`. Its first line is the same as the real `non_neg_int`: `if !seen.insert(v) { return true; }`. Then `match &o[v]` with one arm per kind of value.',
      'A whole, non-negative number is one where `x.is_finite() && x.trunc() == *x && *x >= 0.0` (check `is_finite` first: the truncation of infinity is infinity). `Add` and `Phi` pass when all their operands pass; `Other` never does.',
      'In `counting`, use `let Op::Phi(xs) = &o[v] else { return false; };` and check `xs.len() == 2`. Then loop over `[(0, 1), (1, 0)]`: the step is `xs[s1]`, which must be `Add(a, b)` with `a == v` and `o[b]` equal to `Num(1.0)`; the start `xs[s0]` must pass `non_neg` with a fresh `HashSet`.',
    ],
    walkthrough: `**How to think about it.** This is \`is_counting_phi(phi, false)\` and \`non_neg_int\` from \`engine/rust/crates/core/src/analysis.rs\`, on a smaller \`Op\` (no \`*\`, no unary \`+\`, and operands are plain \`usize\` indexes into the slice \`o\` instead of typed \`ValueId\`s). Draw the test \`simple()\` first: value 0 is \`Num(0.0)\`, value 1 is the phi \`i = φ(0, i + 1)\` (its operands are values 0 and 3), value 2 is \`Num(1.0)\`, and value 3 is \`Add(1, 2)\`, which is \`i + 1\`. A counting phi needs two things: one operand is "the phi plus 1" (the step), and the other is a non-negative whole number (the start). The start may be a loop variable of an outer loop, as in \`j = i + 1\`, so checking it means walking backwards through values, and that walk can come back to where it started; the \`seen\` set is what stops it.

**The solution, line by line.**

- \`fn non_neg(o: &[Op], v: usize, seen: &mut HashSet<usize>) -> bool {\` takes the arena, the value to check and a set that the whole query shares, borrowed mutably so that every recursive call adds to the same set.
- \`if !seen.insert(v) { return true; }\`: \`insert\` adds \`v\` and returns \`false\` if it was already there. A value met twice is assumed fine; the rest of the cycle decides.
- \`match &o[v] {\` looks at the value. \`Op::Num(x) => x.is_finite() && x.trunc() == *x && *x >= 0.0\` accepts 0, 1, 2, ... and rejects \`-1\`, \`0.5\` and infinity (\`x\` is a \`&f64\` here, hence \`*x\`).
- \`Op::Add(a, b) => non_neg(o, *a, seen) && non_neg(o, *b, seen)\`: a sum of two non-negative integers is one too. \`&&\` stops at the first \`false\`.
- \`Op::Phi(xs) => xs.iter().all(|&a| non_neg(o, a, seen))\`: a phi is one of its operands at run time, so all of them must pass. The closure pattern \`|&a|\` copies each \`usize\` out of the iterator's \`&usize\`.
- \`Op::Other => false\`: anything the proof doesn't understand fails, which is the safe answer.
- In \`counting\`, \`let Op::Phi(xs) = &o[v] else { return false; };\` keeps going only for a phi, binding its operand list to \`xs\`, and \`if xs.len() != 2 { return false; }\` rejects phis that merge more than two paths.
- \`for (s0, s1) in [(0, 1), (1, 0)] {\` tries "operand 0 is the start" and then "operand 1 is the start".
- \`let st = &o[xs[s1]];\` and \`let &Op::Add(a, b) = st else { continue; };\` take the would-be step, and move on to the other order unless it is an \`Add\` (the \`&\` in the pattern lets it copy \`a\` and \`b\` out of the reference).
- \`let one = matches!(o[b], Op::Num(n) if n == 1.0);\` checks the right side is the constant 1, and \`if a != v || !one { continue; }\` checks the left side is this very phi.
- \`let mut seen = HashSet::new();\` makes a **fresh** set for this order, and \`if non_neg(o, xs[s0], &mut seen) { return true; }\` accepts the phi if the start passes.
- \`false\` at the end: neither order worked.

**Common wrong attempts.**

- Answering \`false\` for a value seen again: the recursion still stops, but every start that mentions a loop variable fails. \`j = i + 1\` reaches \`i\`, then \`i + 1\`, then \`i\` again, so \`starts_at_i_plus_1\` fails.
- Accepting any \`*x >= 0.0\`: a start of \`0.5\` would count 0.5, 1.5, 2.5, and \`ps[0.5]\` is \`undefined\` in JavaScript; infinity would pass too.
- Assuming the start is the first operand: when the latch's value comes first, as in \`either_operand_order\`, a real counting loop is rejected.
- Sharing one \`seen\` across both orders: a set left over from a failed first order can make the second answer \`true\` too early. The real code passes \`&mut HashSet::default()\` each time for this reason.`,
    wrong: [
      {
        code: `${SCAF}
fn non_neg(
    o: &[Op],
    v: usize,
    seen: &mut HashSet<usize>,
) -> bool {
    if !seen.insert(v) {
        return false;
    }
    match &o[v] {
        Op::Num(x) => {
            x.is_finite()
                && x.trunc() == *x
                && *x >= 0.0
        }
        Op::Add(a, b) => {
            non_neg(o, *a, seen)
                && non_neg(o, *b, seen)
        }
        Op::Phi(xs) => {
            xs.iter().all(|&a| {
                non_neg(o, a, seen)
            })
        }
        Op::Other => false,
    }
}

fn counting(
    o: &[Op],
    v: usize,
) -> bool {
    let Op::Phi(xs) = &o[v] else {
        return false;
    };
    if xs.len() != 2 {
        return false;
    }
    for (s0, s1) in [(0, 1), (1, 0)] {
        let st = &o[xs[s1]];
        let &Op::Add(a, b) = st else {
            continue;
        };
        let one = matches!(
            o[b],
            Op::Num(n) if n == 1.0
        );
        if a != v || !one {
            continue;
        }
        let mut seen = HashSet::new();
        let s = xs[s0];
        if non_neg(o, s, &mut seen) {
            return true;
        }
    }
    false
}`,
        why: 'Answering `false` for a value seen again stops the recursion, but it rejects every start that goes round a cycle. `j = i + 1` reaches `i`, then `i + 1`, then `i` again, so `starts_at_i_plus_1` fails.',
      },
      {
        code: `${SCAF}
fn non_neg(
    o: &[Op],
    v: usize,
    seen: &mut HashSet<usize>,
) -> bool {
    if !seen.insert(v) {
        return true;
    }
    match &o[v] {
        Op::Num(x) => *x >= 0.0,
        Op::Add(a, b) => {
            non_neg(o, *a, seen)
                && non_neg(o, *b, seen)
        }
        Op::Phi(xs) => {
            xs.iter().all(|&a| {
                non_neg(o, a, seen)
            })
        }
        Op::Other => false,
    }
}

fn counting(
    o: &[Op],
    v: usize,
) -> bool {
    let Op::Phi(xs) = &o[v] else {
        return false;
    };
    if xs.len() != 2 {
        return false;
    }
    for (s0, s1) in [(0, 1), (1, 0)] {
        let st = &o[xs[s1]];
        let &Op::Add(a, b) = st else {
            continue;
        };
        let one = matches!(
            o[b],
            Op::Num(n) if n == 1.0
        );
        if a != v || !one {
            continue;
        }
        let mut seen = HashSet::new();
        let s = xs[s0];
        if non_neg(o, s, &mut seen) {
            return true;
        }
    }
    false
}`,
        why: 'Non-negative isn’t enough. A start of 0.5 counts 0.5, 1.5, 2.5, and `ps[0.5]` is `undefined` in JavaScript. Infinity passes too.',
      },
      {
        code: `${SCAF}
fn non_neg(
    o: &[Op],
    v: usize,
    seen: &mut HashSet<usize>,
) -> bool {
    if !seen.insert(v) {
        return true;
    }
    match &o[v] {
        Op::Num(x) => {
            x.is_finite()
                && x.trunc() == *x
                && *x >= 0.0
        }
        Op::Add(a, b) => {
            non_neg(o, *a, seen)
                && non_neg(o, *b, seen)
        }
        Op::Phi(xs) => {
            xs.iter().all(|&a| {
                non_neg(o, a, seen)
            })
        }
        Op::Other => false,
    }
}

fn counting(
    o: &[Op],
    v: usize,
) -> bool {
    let Op::Phi(xs) = &o[v] else {
        return false;
    };
    if xs.len() != 2 {
        return false;
    }
    let Op::Add(a, b) = o[xs[1]] else {
        return false;
    };
    let one = matches!(
        o[b],
        Op::Num(n) if n == 1.0
    );
    let mut seen = HashSet::new();
    a == v
        && one
        && non_neg(o, xs[0], &mut seen)
}`,
        why: 'It assumes the start is the first operand. When the latch’s value comes first, as in `either_operand_order`, a real counting loop is rejected.',
      },
    ],
  },
};

export const quiz = [
  {
    q: '`for (let j = i + 1; j < ps.length; j++) ps[j].x = 0;` sits inside a counting loop over `i`. Is `ps[j]` proven?',
    options: [
      { t: 'No: only loops that start at 0 count', why: 'That is the trip-count test (`zero_start: true`), not the bounds test.' },
      { t: 'Yes: `j` is a counting phi with a non-negative start, guarded by `j < ps.length`', correct: true, why: 'Bounds use `non_neg_int` for the start, which accepts `i + 1`.' },
      { t: 'No: `j` could be negative', why: '`i` is a non-negative integer, so `i + 1` is too.' },
    ],
  },
  {
    q: '`non_neg_int` reaches the same value twice in one query. What does it return for it, and why?',
    options: [
      { t: '`false`, to be safe', why: 'Then no start that mentions a loop variable could be proven, such as `i + 1`.' },
      { t: 'It recurses again and overflows the stack', why: 'The `seen` set prevents exactly that.' },
      { t: '`true`: the value is assumed fine, and the rest of the cycle decides', correct: true, why: 'An optimistic assumption, as in the reference, made possible by `seen.insert` returning `false`.' },
    ],
  },
  {
    q: 'Which loop gets `ps.x[i]` with no check?',
    options: [
      { t: '`for (let i = 0; i <= ps.length; i++) ps[i].x++`', why: 'The guard must be `<`; this one really reads past the end on its last trip.' },
      { t: '`for (let i = 0; i < 100; i++) ps[i].x++`', why: 'The guard must read `ps.length`, not a constant.' },
      { t: '`for (let i = 0; i < ps.length; i += 2) ps[i].x++`', why: 'The step must be `+ 1`, so this cautious proof gives up, although the reads are in range.' },
      { t: '`for (let i = 0; i < ps.length; i++) ps[i].x++`', correct: true, why: 'A counting phi from 0, guarded by `i < ps.length`, whose true edge dominates the body.' },
    ],
  },
  {
    q: 'Why does question 4 (the true edge dominates the read) matter?',
    options: [
      { t: 'It makes sure the read can only run after the guard said yes', correct: true, why: 'A read reachable without passing the true edge (after the loop, say) could see `i === ps.length`.' },
      { t: 'It makes the proof faster', why: 'It makes the proof correct; without it, a read after the loop would be wrongly trusted.' },
      { t: 'It is needed only for nested loops', why: 'It is needed for every read: the index must be checked on every path to it.' },
    ],
  },
  {
    q: 'Why does the port store its proofs in a second loop, `iter_mut().zip(proven)`, instead of setting `bounds_proven` in the first?',
    options: [
      { t: 'To keep the order of the reasons in explain', why: 'Order isn’t affected: the same reads get the same answers either way.' },
      { t: 'The first loop calls `&self` methods, so it can’t also hold a mutable borrow of the collection', correct: true, why: 'Read everything, then write: two phases keep the shared and mutable borrows apart.' },
      { t: 'Because `Vec<bool>` is faster than a field', why: 'Speed isn’t the reason; the borrow checker is.' },
    ],
  },
];
