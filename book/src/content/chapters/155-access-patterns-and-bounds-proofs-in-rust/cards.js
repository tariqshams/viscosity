// Chapter 155 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'acc-key': {
    q: 'What is the key of the `IndexMap` that groups a collection’s field accesses into loop tables?',
    a: '`(FuncId, Option<BlockId>)`: the function, and the header of the innermost loop around the access.',
  },
  'acc-order': {
    q: 'Why does explain list the fields of `ps[i].x += ps[i].vx; ps[i].y += ps[i].vy;` as `(vy, y, vx, x)`?',
    a: 'Fields are kept in visit order, and the uses pass pops the loads of `ps` from a worklist, last one first; reads are listed before writes. The reference does the same, so both engines agree.',
  },
  'bp-four': {
    q: 'Which four questions does the Rust bounds proof ask of an element read `c[i]`?',
    a: 'Is `i` the phi of a loop header around the read? Is it a counting phi (non-negative integer start, `+ 1` step)? Does that header test `i < c.length`? Does the test’s true edge dominate the read?',
  },
    'bp-le': {
    q: 'Why is `ps[i]` in `for (let i = 0; i <= ps.length; i++)` not proven in bounds?',
    a: 'The guard must be `<`, and here it is `<=`. Rightly so: on the last trip `i` is `ps.length`, and the read throws.',
  },
  'acc-both-orders': {
    q: 'Why does `is_counting_phi` try the phi’s operands in both orders?',
    a: 'A phi’s operands are in predecessor order, so the start may be either one. The step is the one that is the phi plus 1.',
  },
  'acc-seen': {
    q: 'In `non_neg_int`, what happens when a value is reached a second time?',
    a: '`seen.insert` returns `false`, and the function answers `true`: the value is assumed fine, which ends the cycle through the phi.',
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
  sizeEstimate: {
    optional: true,
    lang: 'rust',
    title: 'The size estimate',
    prompt: 'Write `estimate(literals, pushes)`, which returns `(size, is_max)` the way `bounds_loops_and_sizes` does. Start the size at the number of literal elements. For each push, add the **product** of its `trips`; if any trip count is `None`, the size is unknown. A push that is not `in_main` also makes the size unknown. If any push is not `every_path`, the size is a maximum, but only a **known** size can be a maximum. Return `(Some(size), is_max)` when the size is known, and `(None, false)` when it isn’t.',
    starter: `// One push: the trip count of each loop
// around it (None: not a constant
// loop), whether it runs on every path,
// and whether it is in the top-level
// code (not inside a function).
struct Push {
    trips: Vec<Option<f64>>,
    every_path: bool,
    in_main: bool,
}

fn estimate(
    literals: usize,
    pushes: &[Push],
) -> (Option<f64>, bool) {
    todo!()
}`,
    solution: `// One push: the trip count of each loop
// around it (None: not a constant
// loop), whether it runs on every path,
// and whether it is in the top-level
// code (not inside a function).
struct Push {
    trips: Vec<Option<f64>>,
    every_path: bool,
    in_main: bool,
}

fn estimate(
    literals: usize,
    pushes: &[Push],
) -> (Option<f64>, bool) {
    let mut size = literals as f64;
    let mut known = true;
    let mut upper = false;
    for p in pushes {
        if !p.every_path {
            upper = true;
        }
        let mut mult = 1.0;
        for t in &p.trips {
            match t {
                Some(t) => mult *= t,
                None => {
                    known = false;
                    break;
                }
            }
        }
        if !p.in_main {
            known = false;
        }
        size += mult;
    }
    let max = known && upper;
    (known.then_some(size), max)
}`,
    tests: `fn push(
    trips: Vec<Option<f64>>,
    every_path: bool,
) -> Push {
    Push {
        trips,
        every_path,
        in_main: true,
    }
}

#[test]
fn literals_only() {
    let r = estimate(3, &[]);
    assert_eq!(r, (Some(3.0), false));
}

#[test]
fn nested_loops_multiply() {
    let p = push(
        vec![Some(40.0), Some(5.0)],
        true,
    );
    let r = estimate(0, &[p]);
    assert_eq!(r, (Some(200.0), false));
}

#[test]
fn a_push_outside_loops_counts_once() {
    let p = push(vec![], true);
    let r = estimate(2, &[p]);
    assert_eq!(r, (Some(3.0), false));
}

#[test]
fn if_else_gives_a_maximum() {
    let a = push(vec![Some(100.0)], false);
    let b = push(vec![Some(100.0)], false);
    let r = estimate(2, &[a, b]);
    assert_eq!(r, (Some(202.0), true));
}

#[test]
fn a_non_constant_loop_is_unknown() {
    let p = push(
        vec![Some(10.0), None],
        true,
    );
    assert_eq!(estimate(0, &[p]), (None, false));
}

#[test]
fn a_push_in_a_function_is_unknown() {
    let mut p = push(vec![Some(50.0)], true);
    p.in_main = false;
    assert_eq!(estimate(0, &[p]), (None, false));
}

#[test]
fn unknown_is_never_a_maximum() {
    let a = push(vec![None], false);
    assert_eq!(estimate(0, &[a]), (None, false));
}
`,
    hints: [
      'Keep three variables, as the real code does: the running `size` (start it at `literals as f64`), `known` (start `true`) and `upper` (start `false`).',
      'For each push, start a multiplier at `1.0` and multiply in each trip count; a `None` sets `known = false` (you can `break` out of the inner loop). Add the multiplier to `size` at the end. A push that is not `every_path` sets `upper`; one that is not `in_main` clears `known`.',
      'Finish with `let max = known && upper;` and `(known.then_some(size), max)`. `then_some` turns the `bool` into an `Option`, and `known &&` stops an unknown size from being reported as a maximum.',
    ],
    walkthrough: `**How to think about it.** Before writing code, do the three programs from the chapter by hand. Nested loops of 40 and 5 around one push: that push runs 40 × 5 = 200 times, so the size is 0 + 200. Two literal elements and an \`if\`/\`else\` with a push on each side of a loop of 100: count both pushes every trip, 2 + 100 + 100 = 202, and mark it as a maximum because neither push is sure to run. A push in a function: the analysis has no idea how often the function runs, so the answer is "unknown". The code is that arithmetic, plus two flags that remember what went wrong along the way. It is the size part of \`bounds_loops_and_sizes\` in \`engine/rust/crates/core/src/analysis.rs\`, with the dominator test already done for you (\`every_path\`).

**The solution, line by line.**

- \`let mut size = literals as f64;\` starts the count at the number of elements written in the array literal. The real code uses \`f64\` because it mirrors a JavaScript number, and \`as f64\` converts the \`usize\`.
- \`let mut known = true;\` and \`let mut upper = false;\` are the two flags: is the number trustworthy at all, and is it only a maximum.
- \`for p in pushes {\` visits each push. \`pushes\` is a slice, so \`p\` is a \`&Push\`.
- \`if !p.every_path { upper = true; }\`: a push that may be skipped still counts, but the total becomes a maximum.
- \`let mut mult = 1.0;\` starts the product at 1, the number that leaves a product unchanged (so a push outside every loop counts once).
- \`for t in &p.trips {\` with \`match t\`: \`Some(t) => mult *= t\` multiplies in a known trip count (the pattern binds \`t\` to a \`&f64\`, and \`*=\` accepts it); \`None\` sets \`known = false\` and \`break\`s, since one unknown loop makes the whole push unknown.
- \`if !p.in_main { known = false; }\` is the real code's \`if f != m.main\`: a push inside a function runs once per call, and calls aren't counted.
- \`size += mult;\` adds this push's contribution, known or not (the result is thrown away when \`known\` is false).
- \`let max = known && upper;\` and \`(known.then_some(size), max)\` build the answer. \`then_some\` gives \`Some(size)\` when \`known\` is true and \`None\` otherwise; \`known && upper\` makes sure an unknown size is never also a maximum.

**Common wrong attempts.**

- Returning \`(known.then_some(size), upper)\`: for a skipped push in an unknown loop it says "unknown, and a maximum", which is meaningless, and \`unknown_is_never_a_maximum\` fails. The real code writes \`c.size_is_upper_bound = known && upper;\` for exactly this reason.
- Adding the trip counts instead of multiplying them: nested loops of 40 and 5 then give 45, not 200. Each trip of the outer loop runs the whole inner loop, so the counts multiply.
- Forgetting \`in_main\`: the function's push then counts 50 (or 1), as if the analysis knew how often it was called.`,
    wrong: [
      {
        code: `// One push: the trip count of each loop
// around it (None: not a constant
// loop), whether it runs on every path,
// and whether it is in the top-level
// code (not inside a function).
struct Push {
    trips: Vec<Option<f64>>,
    every_path: bool,
    in_main: bool,
}

fn estimate(
    literals: usize,
    pushes: &[Push],
) -> (Option<f64>, bool) {
    let mut size = literals as f64;
    let mut known = true;
    let mut upper = false;
    for p in pushes {
        if !p.every_path {
            upper = true;
        }
        let mut mult = 1.0;
        for t in &p.trips {
            match t {
                Some(t) => mult *= t,
                None => known = false,
            }
        }
        if !p.in_main {
            known = false;
        }
        size += mult;
    }
    (known.then_some(size), upper)
}`,
        why: 'An unknown size can’t be a maximum. With a skipped push in a non-constant loop this returns `(None, true)`; the flag must be `known && upper`.',
      },
      {
        code: `// One push: the trip count of each loop
// around it (None: not a constant
// loop), whether it runs on every path,
// and whether it is in the top-level
// code (not inside a function).
struct Push {
    trips: Vec<Option<f64>>,
    every_path: bool,
    in_main: bool,
}

fn estimate(
    literals: usize,
    pushes: &[Push],
) -> (Option<f64>, bool) {
    let mut size = literals as f64;
    let mut known = true;
    let mut upper = false;
    for p in pushes {
        if !p.every_path {
            upper = true;
        }
        for t in &p.trips {
            match t {
                Some(t) => size += t,
                None => known = false,
            }
        }
        if !p.in_main {
            known = false;
        }
    }
    let max = known && upper;
    (known.then_some(size), max)
}`,
        why: 'Trip counts of nested loops multiply, they don’t add: 40 and 5 give 45 here instead of 200, and a push outside every loop adds nothing instead of 1.',
      },
      {
        code: `// One push: the trip count of each loop
// around it (None: not a constant
// loop), whether it runs on every path,
// and whether it is in the top-level
// code (not inside a function).
struct Push {
    trips: Vec<Option<f64>>,
    every_path: bool,
    in_main: bool,
}

fn estimate(
    literals: usize,
    pushes: &[Push],
) -> (Option<f64>, bool) {
    let mut size = literals as f64;
    let mut known = true;
    let mut upper = false;
    for p in pushes {
        if !p.every_path {
            upper = true;
        }
        let mut mult = 1.0;
        for t in &p.trips {
            match t {
                Some(t) => mult *= t,
                None => known = false,
            }
        }
        size += mult;
    }
    let max = known && upper;
    (known.then_some(size), max)
}`,
        why: 'It ignores `in_main`, so a push inside a function counts as if the analysis knew how often the function is called: `a_push_in_a_function_is_unknown` gets `Some(50.0)`.',
      },
    ],
  },
  countingPhi: {
    lang: 'rust',
    title: 'Counting phis',
    prompt: 'Write the two proofs of the bounds check over a small arena `o`. `non_neg(o, v, seen)`: if `v` is already in `seen`, return `true`; otherwise insert it, then accept a finite whole `Num` that is at least 0, an `Add` whose two operands both are, or a `Phi` whose operands all are. Anything else is `false`. `counting(o, v)`: `v` is a `Phi` with exactly two operands, and in one of the two orders, the second operand is `Add(v, one)` where `one` is `Num(1.0)`, and the first is a non-negative integer (with a fresh `seen`).',
    starter: `use std::collections::HashSet;

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
    solution: `use std::collections::HashSet;

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
        code: `use std::collections::HashSet;

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
        code: `use std::collections::HashSet;

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
        code: `use std::collections::HashSet;

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
      {
        t: 'Both: the inner and the outer loop’s',
        why: '`loop_of` returns one loop, the innermost, so each access goes in exactly one table.',
      },
      {
        t: 'The inner loop’s, keyed by its header',
        correct: true,
        why: 'The key is `(function, Some(innermost header))`; the nesting is recorded in `depth` instead.',
      },
      {
        t: 'The outer loop’s, since it decides how often the inner one runs',
        why: 'How often the loops run goes into `trips`; the table belongs to the innermost loop.',
      },
    ],
  },
  {
    q: '`for (let j = i + 1; j < ps.length; j++) ps[j].x = 0;` sits inside a counting loop over `i`. Is `ps[j]` proven?',
    options: [
      {
        t: 'No: only loops that start at 0 count',
        why: 'That is the trip-count test (`zero_start: true`), not the bounds test.',
      },
      {
        t: 'Yes: `j` is a counting phi with a non-negative start, guarded by `j < ps.length`',
        correct: true,
        why: 'Bounds use `non_neg_int` for the start, which accepts `i + 1`.',
      },
      {
        t: 'No: `j` could be negative',
        why: '`i` is a non-negative integer, so `i + 1` is too.',
      },
    ],
  },
  {
    q: '`non_neg_int` reaches the same value twice in one query. What does it return for it, and why?',
    options: [
      {
        t: '`false`, to be safe',
        why: 'Then no start that mentions a loop variable could be proven, such as `i + 1`.',
      },
      {
        t: 'It recurses again and overflows the stack',
        why: 'The `seen` set prevents exactly that.',
      },
      {
        t: '`true`: the value is assumed fine, and the rest of the cycle decides',
        correct: true,
        why: 'An optimistic assumption, as in the reference, made possible by `seen.insert` returning `false`.',
      },
    ],
  },
  {
    q: 'Which loop gets `ps.x[i]` with no check?',
    options: [
      {
        t: '`for (let i = 0; i <= ps.length; i++) ps[i].x++`',
        why: 'The guard must be `<`; this one really reads past the end on its last trip.',
      },
      {
        t: '`for (let i = 0; i < 100; i++) ps[i].x++`',
        why: 'The guard must read `ps.length`, not a constant.',
      },
      {
        t: '`for (let i = 0; i < ps.length; i += 2) ps[i].x++`',
        why: 'The step must be `+ 1`, so this cautious proof gives up, although the reads are in range.',
      },
      {
        t: '`for (let i = 0; i < ps.length; i++) ps[i].x++`',
        correct: true,
        why: 'A counting phi from 0, guarded by `i < ps.length`, whose true edge dominates the body.',
      },
    ],
  },
];
