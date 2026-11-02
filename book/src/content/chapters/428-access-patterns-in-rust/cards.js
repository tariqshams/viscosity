// Chapter 428 cards. Keys are stable ids: never rename them.

// Shared by the exercise: one push, as the size estimate sees it.
const PUSH = `// One push: the trip count of each loop
// around it (None: not a constant
// loop), whether it runs on every path,
// and whether it is in the top-level
// code (not inside a function).
struct Push {
    trips: Vec<Option<f64>>,
    every_path: bool,
    in_main: bool,
}
`;

export const prompts = {
  'acc-what': {
    q: 'Besides bounds proofs, which two facts does `bounds_loops_and_sizes` record for each collection?',
    a: 'A `LoopAccess` table per loop (which fields it reads and writes), and a size estimate with a flag saying whether it is only a maximum.',
  },
  'acc-key': {
    q: 'What is the key of the `IndexMap` that groups a collection’s field accesses into loop tables?',
    a: '`(FuncId, Option<BlockId>)`: the function, and the header of the innermost loop around the access.',
  },
  'acc-none': {
    q: 'In that key, what does `None` mean, and does explain print that table?',
    a: 'The access is outside every loop. It gets its own table, with depth 0 and `trips: Some(1.0)`, which explain doesn’t print.',
  },
  'acc-order': {
    q: 'Why does explain list the fields of `ps[i].x += ps[i].vx; ps[i].y += ps[i].vy;` as `(vy, y, vx, x)`?',
    a: 'Fields are kept in visit order, and the uses pass pops the loads of `ps` from a worklist, last one first; reads are listed before writes. The reference does the same, so both engines agree.',
  },
  'acc-tuple-key': {
    q: 'The TypeScript reference keys its loop tables by a string like `` `${f.id}:${l.header}` ``. Why can the Rust port use a tuple instead?',
    a: 'A JavaScript `Map` compares object keys by identity, so two equal arrays would be different keys; a Rust tuple is hashed and compared by value.',
  },
  'acc-product': {
    q: 'A push sits inside `for (i = 0; i < 40; i++)` and, inside that, `for (j = 0; j < 5; j++)`. What does it add to the size estimate?',
    a: '200: the product of the trip counts of the loops around it, 40 × 5.',
  },
  'acc-at-most': {
    q: 'When does explain say “at most N elements” instead of “about N”?',
    a: 'When some push may not run on every trip (one inside an `if`, say): it doesn’t dominate every exit of its region, so counting it every time gives a maximum.',
  },
  'acc-fn-unknown': {
    q: 'A push is inside a function `add`, which is called from a constant loop of 50. What size does the analysis record, and why?',
    a: '`None` (“size unknown statically”): how often a function runs depends on its calls, which the analysis doesn’t count, so `f != m.main` makes the size unknown.',
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
    lang: 'rust',
    title: 'The size estimate',
    prompt:
      'Write `estimate(literals, pushes)`, which returns `(size, is_max)` the way `bounds_loops_and_sizes` does. Start the size at the number of literal elements. For each push, add the **product** of its `trips`; if any trip count is `None`, the size is unknown. A push that is not `in_main` also makes the size unknown. If any push is not `every_path`, the size is a maximum, but only a **known** size can be a maximum. Return `(Some(size), is_max)` when the size is known, and `(None, false)` when it isn’t.',
    starter: `${PUSH}
fn estimate(
    literals: usize,
    pushes: &[Push],
) -> (Option<f64>, bool) {
    todo!()
}`,
    solution: `${PUSH}
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
        code: `${PUSH}
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
        code: `${PUSH}
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
        code: `${PUSH}
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
};

export const quiz = [
  {
    q: 'An access sits in the inner loop of two nested loops. Which table is it filed under?',
    options: [
      { t: 'Both: the inner and the outer loop’s', why: '`loop_of` returns one loop, the innermost, so each access goes in exactly one table.' },
      { t: 'The inner loop’s, keyed by its header', correct: true, why: 'The key is `(function, Some(innermost header))`; the nesting is recorded in `depth` instead.' },
      { t: 'The outer loop’s, since it decides how often the inner one runs', why: 'How often the loops run goes into `trips`; the table belongs to the innermost loop.' },
    ],
  },
  {
    q: 'Why does the port use `IndexMap` and `IndexSet` here rather than std’s `HashMap` and `HashSet`?',
    options: [
      { t: 'They are faster', why: 'Speed isn’t the reason; order is.' },
      { t: 'Their order is insertion order, which reaches explain and must match the TypeScript `Map` and `Set`', correct: true, why: 'A `HashMap` iterates in an order that depends on hashing, so the explain text would differ from the reference’s.' },
      { t: 'They allow duplicate keys', why: 'They don’t: a set keeps each field once, which is what explain wants.' },
    ],
  },
  {
    q: 'A push sits in `for (let i = 0; i < 10; i++)` inside `for (let j = 0; j < 3; j++)`, and the array literal has 2 elements. What size is recorded?',
    options: [
      { t: '`Some(15.0)`', why: 'That adds the trip counts. Nested loops multiply.' },
      { t: '`None`', why: 'Both loops have constant bounds and the push is in the top-level code, so the size is known.' },
      { t: '`Some(30.0)`', why: 'Close: that is the push’s 10 × 3, but the 2 literal elements count too.' },
      { t: '`Some(32.0)`', correct: true, why: '2 literal elements plus 10 × 3 = 30 pushes.' },
    ],
  },
  {
    q: '`for (let i = 0; i < 100; i++) if (i % 3 === 0) ps.push({ x: i });` What does explain say about the size?',
    options: [
      { t: '`about 34 elements`', why: 'The analysis doesn’t evaluate `i % 3`. It only knows the push may be skipped.' },
      { t: '`size unknown statically`', why: 'The loop has a constant bound and the push is in the top-level code, so the size is known, as a maximum.' },
      { t: '`at most 100 elements`', correct: true, why: 'The push doesn’t dominate the loop’s latch, so `size_is_upper_bound` is set.' },
      { t: '`about 100 elements`', why: 'That would claim the push runs on every trip.' },
    ],
  },
  {
    q: 'Pushes happen in a function `add`, called in a constant loop of 50. What size does the analysis record?',
    options: [
      { t: '`None`: a push inside a function depends on how often it is called', correct: true, why: '`if f != m.main { known = false; }`, and explain says “size unknown statically”.' },
      { t: '`Some(50.0)`', why: 'The analysis doesn’t count calls, so it can’t know that `add` runs 50 times.' },
      { t: '`Some(1.0)`, one push', why: 'A push in a function makes the size unknown instead of counting it once.' },
    ],
  },
];
