// Chapter 289 cards. Keys are stable ids: never rename them.

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
  'acc-key': {
    q: 'What is the key of the `IndexMap` that groups a collection’s field accesses into loop tables?',
    a: '`(FuncId, Option<BlockId>)`: the function, and the header of the innermost loop around the access.',
  },
  'acc-none': {
    q: 'In that key, what does `None` mean?',
    a: 'The access is outside every loop. It gets its own table with depth 0 and `trips: Some(1.0)`, which explain doesn’t print.',
  },
  'acc-order': {
    q: 'Why does explain list the fields of `ps[i].x += ps[i].vx; ps[i].y += ps[i].vy;` as `(vy, y, vx, x)`?',
    a: 'Fields are kept in visit order, and the uses pass pops element reads from a worklist, last load first. Reads come before writes. The reference does the same.',
  },
  'acc-both-orders': {
    q: 'Why does `is_counting_phi` try the phi’s operands in both orders?',
    a: 'A phi’s operands are in predecessor order, so the start may be either one. The step is the one that is the phi plus 1.',
  },
  'acc-seen': {
    q: 'In `non_neg_int`, what happens when a value is reached a second time?',
    a: '`seen.insert` returns `false`, and the function answers `true`: the value is assumed fine, which ends the cycle through the phi.',
  },
  'acc-k-plus-1': {
    q: 'Why is `ps[k + 1]` in `for (let k = -1; k < ps.length; k++)` not proven in bounds?',
    a: 'The index is an addition, not the loop’s phi. It is also really out of bounds on the last trip, where `k + 1` is `ps.length`.',
  },
  'acc-two-phases': {
    q: 'Why are bounds proofs collected into a `Vec<bool>` before being stored in `index_gets`?',
    a: 'The proving loop calls `&self` methods, which borrow all of `self`, so it can’t hold a mutable borrow of the collection at the same time.',
  },
  'acc-at-most': {
    q: 'When does explain say “at most N elements” instead of “about N”?',
    a: 'When a push doesn’t run on every path through the loops around it (one inside an `if`, say): the estimate counts it every time, so it is a maximum.',
  },
  'acc-what': {
    q: 'Which three facts does `bounds_loops_and_sizes` record for each collection?',
    a: 'Which `index.get`s are proven in bounds, a `LoopAccess` table per loop, and a size estimate (with an upper-bound flag).',
  },
};

export const examples = {
  'table-play': {
    lang: 'rust',
    title: 'Access tables, in visit order',
    code: `struct Table {
    line: u32,
    depth: u32,
    reads: Vec<&'static str>,
    writes: Vec<&'static str>,
}

// Insert once, keep first-seen order
// (what IndexSet does).
fn add(
    v: &mut Vec<&'static str>,
    f: &'static str,
) {
    if !v.contains(&f) {
        v.push(f);
    }
}

fn main() {
    // (loop line, depth, field, write?)
    // in the order the port visits
    // them in this chapter's program.
    let acc = [
        (11, 0, "y", false),
        (9, 1, "x", false),
        (4, 1, "vy", false),
        (4, 1, "y", false),
        (4, 1, "y", true),
        (4, 1, "vx", false),
        (4, 1, "x", false),
        (4, 1, "x", true),
    ];
    let mut ts: Vec<Table> = vec![];
    for (line, depth, f, w) in acc {
        // (The port keys by loop
        // header, not by line.)
        let i = ts
            .iter()
            .position(|t| {
                t.line == line
            });
        let i = match i {
            Some(i) => i,
            None => {
                ts.push(Table {
                    line,
                    depth,
                    reads: vec![],
                    writes: vec![],
                });
                ts.len() - 1
            }
        };
        let t = &mut ts[i];
        if w {
            add(&mut t.writes, f);
        } else {
            add(&mut t.reads, f);
        }
    }
    // Stable, like the port's sort.
    ts.sort_by_key(|t| t.line);
    for t in &ts {
        if t.depth == 0 {
            continue;
        }
        let mut all = t.reads.clone();
        for &f in &t.writes {
            add(&mut all, f);
        }
        println!(
            "line {}: {} of 4 ({})",
            t.line,
            all.len(),
            all.join(", ")
        );
    }
}
`,
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
      '`non_neg` starts with `if !seen.insert(v) { return true; }`, then `match &o[v]`.',
      'A whole number is one where `x.trunc() == *x`. Check `is_finite()` first: the truncation of infinity is infinity.',
      'In `counting`, use `let Op::Phi(xs) = &o[v] else { return false; };`, then loop over `[(0, 1), (1, 0)]`. The step is `Add(a, b)` with `a == v` and `o[b]` equal to `Num(1.0)`.',
    ],
    walkthrough: `This is \`is_counting_phi(phi, false)\` and \`non_neg_int\` (here \`non_neg\`) from \`engine/rust/crates/core/src/analysis.rs\`, on a smaller \`Op\` (no \`*\`, no unary \`+\`).

- **Why \`seen\` answers \`true\`.** In \`starts_at_i_plus_1\`, the start of \`j\` is \`i + 1\`. Checking it reaches the phi \`i\`, whose operands are \`0\` and \`i + 1\` again, which reaches \`i\` again. Without \`seen\` that never ends. Answering \`false\` the second time would reject every start that mentions a loop variable. Answering \`true\` is an optimistic assumption, checked by everything else on the cycle: here \`0\` and \`1\`.
- **Why a fresh set in \`counting\`.** The two orders are separate questions. A set left over from a failed first order would make the second answer \`true\` too early.
- **Why both orders.** \`either_operand_order\` has the latch’s value first. SSA keeps operands in predecessor order, which says nothing about which one is the start.
- **Why \`is_finite\`.** \`f64::INFINITY.trunc()\` is infinity, so without it an infinite start would pass as a whole number.

The real code takes \`&Inst\` and looks values up with \`self.inst(id)\`. The structure is the same.`,
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
    q: 'An access sits in the inner loop of two nested loops. Which table is it filed under?',
    options: [
      { t: 'Both: the inner and the outer loop’s', why: '`loop_of` returns one loop, the innermost.' },
      { t: 'The inner loop’s, keyed by its header', correct: true, why: 'The key is `(function, Some(innermost header))`, so each access goes in exactly one table.' },
      { t: 'The outer loop’s, since it decides how often the inner one runs', why: 'Depth records the nesting instead.' },
    ],
  },
  {
    q: 'Why does the port use `IndexMap` and `IndexSet` here rather than `HashMap` and `HashSet`?',
    options: [
      { t: 'They are faster', why: 'Speed isn’t the reason. Order is.' },
      { t: 'They allow duplicate keys', why: 'They don’t.' },
      { t: 'Their order is insertion order, which reaches explain, and must match the TypeScript `Map` and `Set`', correct: true, why: 'Iteration order of a `HashMap` depends on hashing; the explain text would then differ from the reference’s.' },
    ],
  },
  {
    q: '`for (let j = i + 1; j < ps.length; j++) ps[j].x = 0;` sits inside a counting loop over `i`. Is `ps[j]` proven?',
    options: [
      { t: 'Yes: `j` is a counting phi with a non-negative start, guarded by `j < ps.length`', correct: true, why: 'Bounds use `non_neg_int` for the start, which accepts `i + 1`.' },
      { t: 'No: only loops that start at 0 count', why: 'That is the trip-count test (`zero_start: true`), not the bounds test.' },
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
    q: '`for (let i = 0; i < 100; i++) if (i % 3 === 0) ps.push({ x: i });` What does explain say about the size?',
    options: [
      { t: '`about 34 elements`', why: 'The analysis doesn’t evaluate `i % 3`. It only knows the push may be skipped.' },
      { t: '`at most 100 elements`', correct: true, why: 'The push doesn’t dominate the loop’s latch, so `size_is_upper_bound` is set.' },
      { t: '`size unknown statically`', why: 'The loop has a constant bound, so the size is known, as a maximum.' },
      { t: '`about 100 elements`', why: 'That would claim the push runs on every trip.' },
    ],
  },
  {
    q: 'Pushes happen in a function `add`, called in a constant loop of 50. What size does the analysis record?',
    options: [
      { t: '`Some(50.0)`', why: 'The analysis doesn’t count calls.' },
      { t: '`Some(1.0)`, one push', why: 'A push in a function makes the size unknown instead.' },
      { t: '`None`: a push inside a function depends on how often it is called', correct: true, why: '`if f != m.main { known = false; }`, and explain says “size unknown statically”.' },
    ],
  },
];
