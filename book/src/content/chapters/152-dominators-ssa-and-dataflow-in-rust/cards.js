// Chapter 152 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'intersect-param': {
    q: 'Why does `intersect` in `cfg.rs` take `idom` as a parameter instead of capturing it?',
    a: 'The loop mutates `idom` while the closure is alive. A closure that captured it would hold a shared borrow, and the mutation would be error E0502.',
  },
  'builder-no-module': {
    q: 'Why doesn’t `FunctionBuilder` own the `Module`?',
    a: 'Every method takes `&mut Module`, so a front-end can keep one module and switch between builders for nested functions.',
  },
  'trivial-phi': {
    q: 'When is a phi trivial?',
    a: 'When, ignoring itself, all its operands are one value. It is replaced by that value everywhere.',
  },
  'throw-bug': {
    q: 'What went wrong when trivial-phi removal didn’t rewrite `throw` operands?',
    a: 'A thrown element still named the removed phi, so the escape analysis missed it. The compiled program threw an index instead of the object.',
  },
  'gd-no-framework': {
    q: 'Does engine/rust have a generic dataflow framework?',
    a: 'No. It has one fixpoint, the numeric-kind analysis in `analysis.rs`, written directly over its own state.',
  },
  'gd-clamp': {
    q: 'Why does the design solver store `transfer(..).meet(&old)` instead of the transfer’s result?',
    a: 'So each fact can only move down. With a lattice of finite height, the worklist must then empty, whatever the transfer does.',
  },
  'gd-fail-closed': {
    q: 'What happens if the numeric fixpoint has not converged after `MAX_ROUNDS` (1000) rounds?',
    a: 'It fails closed: every value, int and field fact is reset to false, so nothing is proven numeric.',
  },
};

export const examples = {
  'loops-play': {
    lang: 'rust',
    title: 'Back edges and natural loops',
    code: `use std::collections::BTreeSet;

// Does a dominate b? Climb b's idoms.
fn dominates(
    idom: &[usize],
    a: usize,
    mut b: usize,
) -> bool {
    loop {
        if b == a {
            return true;
        }
        if idom[b] == b {
            return false; // the entry
        }
        b = idom[b];
    }
}

// The body of the loop of back edge
// t -> h: h, plus everything that
// reaches t without passing h.
fn body(
    preds: &[Vec<usize>],
    h: usize,
    t: usize,
) -> BTreeSet<usize> {
    let mut body = BTreeSet::from([h]);
    let mut stack = vec![t];
    while let Some(x) = stack.pop() {
        if body.insert(x) {
            stack.extend(&preds[x]);
        }
    }
    body
}

fn main() {
    // 0 entry, 1 head, 2 body,
    // 3 throw, 4 exit, 5 latch
    let succ = vec![
        vec![1],
        vec![2, 4],
        vec![3, 5],
        vec![],
        vec![],
        vec![1],
    ];
    let mut preds = vec![vec![]; 6];
    for b in 0..6 {
        for &s in &succ[b] {
            preds[s].push(b);
        }
    }
    // From Cooper-Harvey-Kennedy.
    let idom = [0, 0, 1, 2, 1, 2];
    // A back edge goes to a dominator.
    let mut back = vec![];
    for t in 0..6 {
        for &h in &succ[t] {
            if dominates(&idom, h, t) {
                back.push((t, h));
            }
        }
    }
    for (t, h) in back {
        let b = body(&preds, h, t);
        println!("{t} -> {h}: {b:?}");
    }
    let d = dominates(&idom, 2, 3);
    println!("2 dominates 3: {d}");
}
`,
  },
  'rounds-play': {
    lang: 'rust',
    title: 'Rounds, a budget, and failing closed',
    code: `trait Lattice: Clone + PartialEq {
    fn top() -> Self;
    fn bottom() -> Self;
    fn meet(&self, o: &Self) -> Self;
}

trait Problem {
    type Fact: Lattice;
    fn len(&self) -> usize;
    fn transfer(
        &self,
        n: usize,
        f: &[Self::Fact],
    ) -> Self::Fact;
}

impl Lattice for bool {
    fn top() -> Self {
        true
    }
    fn bottom() -> Self {
        false
    }
    fn meet(&self, o: &Self) -> Self {
        *self && *o
    }
}

// Viscosity's strategy: whole rounds
// in id order, updating in place.
// Returns the facts and the number of
// the first round that changed nothing.
fn rounds<P: Problem>(
    p: &P,
    max_rounds: usize,
) -> Option<(Vec<P::Fact>, usize)> {
    let n = p.len();
    let mut f = vec![P::Fact::top(); n];
    for r in 1..=max_rounds {
        let mut changed = false;
        for v in 0..n {
            let new = p.transfer(v, &f);
            if new != f[v] {
                f[v] = new;
                changed = true;
            }
        }
        if !changed {
            return Some((f, r));
        }
    }
    None
}

// Fail closed: no fixpoint, no facts.
fn facts<P: Problem>(
    p: &P,
    max_rounds: usize,
) -> Vec<P::Fact> {
    match rounds(p, max_rounds) {
        Some((f, r)) => {
            println!("  quiet: {r}");
            f
        }
        None => {
            println!("  out of rounds");
            let b = P::Fact::bottom();
            vec![b; p.len()]
        }
    }
}

enum N {
    Num,
    Str,
    Add(usize, usize),
    Phi(usize, usize),
}

struct G(Vec<N>);

impl Problem for G {
    type Fact = bool;
    fn len(&self) -> usize {
        self.0.len()
    }
    fn transfer(
        &self,
        n: usize,
        f: &[bool],
    ) -> bool {
        match self.0[n] {
            N::Num => true,
            N::Str => false,
            N::Add(a, b) => {
                f[a] && f[b]
            }
            N::Phi(a, b) => {
                f[a].meet(&f[b])
            }
        }
    }
}

fn main() {
    // %0 = 0    %1 = phi %0, %3
    // %2 = "!"  %3 = %1 + %2
    let g = G(vec![
        N::Num,
        N::Phi(0, 3),
        N::Str,
        N::Add(1, 2),
    ]);
    for budget in [1000, 2, 0] {
        println!("budget {budget}:");
        let f = facts(&g, budget);
        println!("  {f:?}");
    }
}
`,
  },
};

export const exercises = {
  chk: {
    optional: true,
    lang: 'rust',
    title: 'Cooper–Harvey–Kennedy',
    prompt: 'Finish the dominator algorithm of `cfg.rs`. `intersect(a, b)`: while `a != b`, move whichever is later in reverse postorder (the larger `ix`) up to its idom. `pass`: for each block of `rpo` after the entry, intersect all predecessors that already have an idom (skip the others), and store the result if it differs. Return whether anything changed. `idoms` runs `pass` until it returns false.',
    starter: `struct Doms {
    // ix[b]: b's position in rpo.
    ix: Vec<usize>,
    // idom[b]: None until known.
    idom: Vec<Option<usize>>,
}

// preds[b]: predecessors of block b.
// rpo: reachable blocks, entry first.
fn idoms(
    preds: &[Vec<usize>],
    rpo: &[usize],
) -> Vec<Option<usize>> {
    let n = preds.len();
    let mut d = Doms {
        ix: vec![usize::MAX; n],
        idom: vec![None; n],
    };
    for i in 0..rpo.len() {
        d.ix[rpo[i]] = i;
    }
    d.idom[rpo[0]] = Some(rpo[0]);
    while pass(&mut d, preds, rpo) {}
    d.idom
}

impl Doms {
    // Climb from a and b, always moving
    // the one later in rpo, until they
    // meet.
    fn intersect(
        &self,
        mut a: usize,
        mut b: usize,
    ) -> usize {
        todo!()
    }
}

// One pass over rpo; true if any idom
// changed.
fn pass(
    d: &mut Doms,
    preds: &[Vec<usize>],
    rpo: &[usize],
) -> bool {
    todo!()
}`,
    solution: `struct Doms {
    // ix[b]: b's position in rpo.
    ix: Vec<usize>,
    // idom[b]: None until known.
    idom: Vec<Option<usize>>,
}

// preds[b]: predecessors of block b.
// rpo: reachable blocks, entry first.
fn idoms(
    preds: &[Vec<usize>],
    rpo: &[usize],
) -> Vec<Option<usize>> {
    let n = preds.len();
    let mut d = Doms {
        ix: vec![usize::MAX; n],
        idom: vec![None; n],
    };
    for i in 0..rpo.len() {
        d.ix[rpo[i]] = i;
    }
    d.idom[rpo[0]] = Some(rpo[0]);
    while pass(&mut d, preds, rpo) {}
    d.idom
}

impl Doms {
    // Climb from a and b, always moving
    // the one later in rpo, until they
    // meet.
    fn intersect(
        &self,
        mut a: usize,
        mut b: usize,
    ) -> usize {
        let ix = &self.ix;
        let id = &self.idom;
        while a != b {
            while ix[a] > ix[b] {
                a = id[a].unwrap();
            }
            while ix[b] > ix[a] {
                b = id[b].unwrap();
            }
        }
        a
    }
}

// One pass over rpo; true if any idom
// changed.
fn pass(
    d: &mut Doms,
    preds: &[Vec<usize>],
    rpo: &[usize],
) -> bool {
    let mut changed = false;
    for &b in &rpo[1..] {
        let mut new = None;
        for &p in &preds[b] {
            if d.idom[p].is_none() {
                continue;
            }
            let q = new.unwrap_or(p);
            let m = d.intersect(p, q);
            new = Some(m);
        }
        let Some(m) = new else {
            continue;
        };
        if d.idom[b] != Some(m) {
            d.idom[b] = Some(m);
            changed = true;
        }
    }
    changed
}`,
    tests: `fn s(v: &[usize]) -> Vec<Option<usize>> {
    v.iter().map(|&b| Some(b)).collect()
}

#[test]
fn a_diamond() {
    // 0 -> 1, 2 -> 3
    let preds = vec![
        vec![], vec![0], vec![0], vec![1, 2],
    ];
    let got = idoms(&preds, &[0, 2, 1, 3]);
    assert_eq!(got, s(&[0, 0, 0, 0]));
}

#[test]
fn a_loop_with_a_throw() {
    // 0 -> 1; 1 -> 2, 4; 2 -> 3, 5; 5 -> 1
    let preds = vec![
        vec![],
        vec![0, 5],
        vec![1],
        vec![2],
        vec![1],
        vec![2],
    ];
    let rpo = [0, 1, 4, 2, 5, 3];
    let got = idoms(&preds, &rpo);
    assert_eq!(got, s(&[0, 0, 1, 2, 1, 2]));
}

#[test]
fn two_ways_in_needs_intersect() {
    // 0 -> 1, 2; 1 -> 2; 2 -> 1
    let preds = vec![
        vec![],
        vec![0, 2],
        vec![1, 0],
    ];
    let got = idoms(&preds, &[0, 1, 2]);
    assert_eq!(got, s(&[0, 0, 0]));
}

#[test]
fn unreachable_blocks_have_none() {
    // 0 -> 1; 2 (unreachable) -> 1
    let preds = vec![
        vec![],
        vec![2, 0],
        vec![],
    ];
    let got = idoms(&preds, &[0, 1]);
    assert_eq!(got, vec![
        Some(0), Some(0), None,
    ]);
}
`,
    hints: [
      '`intersect` is two inner `while` loops inside `while a != b`. One sets `a = id[a].unwrap()` while `ix[a] > ix[b]`; the other does the same for `b`.',
      'In `pass`, start each block with `new = None`. The first processed predecessor `p` becomes the answer; after that, intersect. `new.unwrap_or(p)` does both in one line, since `intersect(p, p)` is `p`.',
      'A block whose predecessors are all unprocessed keeps `None` this pass. Only set `changed` when the stored idom really differs.',
    ],
    walkthrough: `**How to think about it.** Picture two fingers on the dominator tree, one on each block, and the entry at the top. Reverse postorder numbers every block so that a block's immediate dominator always has a smaller number than the block itself. So if one finger sits on a larger number than the other, that finger cannot be on the meeting point yet, and it is safe to move it up to its idom; repeat until both fingers are on the same block. That is \`intersect\`. \`pass\` then uses it: a block's idom is the meeting point of all its predecessors that already have an idom. Run passes until one changes nothing. This is \`dominators\` from \`engine/rust/crates/core/src/cfg.rs\`, with \`usize\` blocks and a small struct so that \`intersect\` can be a method.

**The solution, line by line.**

- \`let ix = &self.ix; let id = &self.idom;\` borrows the two tables once, so the loops below read short names. Both are shared borrows, which is all \`intersect\` needs (it only reads).
- \`while a != b {\` keeps going until the fingers meet.
- \`while ix[a] > ix[b] { a = id[a].unwrap(); }\` moves \`a\` up while it is later in rpo. The \`unwrap\` is safe because \`pass\` only calls \`intersect\` on blocks that already have an idom, and every block on the way up has one too.
- \`while ix[b] > ix[a] { b = id[b].unwrap(); }\` does the same for \`b\`. One of the two inner loops may run zero times; the outer loop repeats until they agree.
- \`a\` is returned: both fingers are on the same block, the nearest common dominator.
- In \`pass\`, \`let mut changed = false;\` remembers whether anything moved this pass.
- \`for &b in &rpo[1..] {\` visits every reachable block in reverse postorder, skipping the entry (\`rpo[0]\`), whose idom is itself.
- \`let mut new = None;\` will hold the answer for \`b\`, built up one predecessor at a time.
- \`for &p in &preds[b] { if d.idom[p].is_none() { continue; }\` skips predecessors that have no idom yet, such as a loop's latch in the first pass.
- \`let q = new.unwrap_or(p); let m = d.intersect(p, q); new = Some(m);\` handles the first processed predecessor and the rest in one go: for the first, \`new\` is \`None\`, so \`q\` is \`p\` and \`intersect(p, p)\` is \`p\`; after that, each new predecessor is intersected with the answer so far.
- \`let Some(m) = new else { continue; };\` leaves a block alone if none of its predecessors was ready (it will be seen next pass).
- \`if d.idom[b] != Some(m) { d.idom[b] = Some(m); changed = true; }\` stores the answer and reports a change only when it really differs, so the driver loop stops once a whole pass is quiet.

On the loop test, pass one gives every block an idom using only the entry side of the header; pass two finally includes the latch, intersects it with the entry, gets the entry again, and nothing changes, so \`idoms\` stops.

**Common wrong attempts.**

- Taking the first processed predecessor as the idom, without intersecting. That is right only when a block has one way in; in the diamond, block 3 is reached from 1 and from 2, and only the entry dominates it.
- Intersecting every predecessor, ready or not. In the first pass a loop header's latch has no idom yet, and \`intersect\` panics on \`unwrap()\` of \`None\`.
- Setting \`changed = true\` whenever a block is visited. The driver then never stops, because every pass "changes" something.

The real code collects the ready predecessors with \`filter\`, splits off the first with \`split_first\`, and folds the rest with \`intersect\`: the same computation, written as in the TypeScript.`,
    wrong: [
      {
        code: `struct Doms {
    // ix[b]: b's position in rpo.
    ix: Vec<usize>,
    // idom[b]: None until known.
    idom: Vec<Option<usize>>,
}

// preds[b]: predecessors of block b.
// rpo: reachable blocks, entry first.
fn idoms(
    preds: &[Vec<usize>],
    rpo: &[usize],
) -> Vec<Option<usize>> {
    let n = preds.len();
    let mut d = Doms {
        ix: vec![usize::MAX; n],
        idom: vec![None; n],
    };
    for i in 0..rpo.len() {
        d.ix[rpo[i]] = i;
    }
    d.idom[rpo[0]] = Some(rpo[0]);
    while pass(&mut d, preds, rpo) {}
    d.idom
}

impl Doms {
    // Climb from a and b, always moving
    // the one later in rpo, until they
    // meet.
    fn intersect(
        &self,
        mut a: usize,
        mut b: usize,
    ) -> usize {
        let ix = &self.ix;
        let id = &self.idom;
        while a != b {
            while ix[a] > ix[b] {
                a = id[a].unwrap();
            }
            while ix[b] > ix[a] {
                b = id[b].unwrap();
            }
        }
        a
    }
}

// One pass over rpo; true if any idom
// changed.
fn pass(
    d: &mut Doms,
    preds: &[Vec<usize>],
    rpo: &[usize],
) -> bool {
    let mut changed = false;
    for &b in &rpo[1..] {
        let mut new = None;
        for &p in &preds[b] {
            if d.idom[p].is_none() {
                continue;
            }
            if new.is_none() {
                new = Some(p);
            }
        }
        let Some(m) = new else {
            continue;
        };
        if d.idom[b] != Some(m) {
            d.idom[b] = Some(m);
            changed = true;
        }
    }
    changed
}`,
        why: 'Taking the first processed predecessor as the idom is right only when there is one way in. In the diamond, block 3 is reached from 1 and from 2, and only the entry dominates it.',
      },
      {
        code: `struct Doms {
    // ix[b]: b's position in rpo.
    ix: Vec<usize>,
    // idom[b]: None until known.
    idom: Vec<Option<usize>>,
}

// preds[b]: predecessors of block b.
// rpo: reachable blocks, entry first.
fn idoms(
    preds: &[Vec<usize>],
    rpo: &[usize],
) -> Vec<Option<usize>> {
    let n = preds.len();
    let mut d = Doms {
        ix: vec![usize::MAX; n],
        idom: vec![None; n],
    };
    for i in 0..rpo.len() {
        d.ix[rpo[i]] = i;
    }
    d.idom[rpo[0]] = Some(rpo[0]);
    while pass(&mut d, preds, rpo) {}
    d.idom
}

impl Doms {
    // Climb from a and b, always moving
    // the one later in rpo, until they
    // meet.
    fn intersect(
        &self,
        mut a: usize,
        mut b: usize,
    ) -> usize {
        let ix = &self.ix;
        let id = &self.idom;
        while a != b {
            while ix[a] > ix[b] {
                a = id[a].unwrap();
            }
            while ix[b] > ix[a] {
                b = id[b].unwrap();
            }
        }
        a
    }
}

// One pass over rpo; true if any idom
// changed.
fn pass(
    d: &mut Doms,
    preds: &[Vec<usize>],
    rpo: &[usize],
) -> bool {
    let mut changed = false;
    for &b in &rpo[1..] {
        let mut new = None;
        for &p in &preds[b] {
            let q = new.unwrap_or(p);
            let m = d.intersect(p, q);
            new = Some(m);
        }
        let Some(m) = new else {
            continue;
        };
        if d.idom[b] != Some(m) {
            d.idom[b] = Some(m);
            changed = true;
        }
    }
    changed
}`,
        why: 'It intersects predecessors that have no idom yet, such as a loop header’s latch in the first pass, and `intersect` panics unwrapping `None`.',
      },
    ],
  },
  solver: {
    lang: 'rust',
    title: 'A worklist solver, generic over the lattice',
    prompt: 'Finish `solve`, the design’s generic worklist solver. Every fact starts at `top()` and every node starts on the stack `work` (so `pop` takes node 0 first). Pop a node, mark it not queued, and compute `transfer(v, &f).meet(&f[v])`, so a fact can only go down. If that differs from `f[v]`, store it and push each user of `v` that isn’t already queued. Return the facts when the stack is empty. The tests run the same solver on two lattices: “is it a number?” and “which constant is it?”.',
    starter: `// Facts, ordered. top() is the
// optimistic start, bottom() claims
// nothing, and meet() is the highest
// fact below both.
pub trait Lattice: Clone + PartialEq {
    fn top() -> Self;
    fn bottom() -> Self;
    fn meet(&self, o: &Self) -> Self;
}

// A sparse problem: one fact per node.
pub trait Problem {
    type Fact: Lattice;
    fn len(&self) -> usize;
    // The nodes whose facts n reads.
    fn deps(&self, n: usize)
        -> Vec<usize>;
    // n's fact, from the facts so far.
    fn transfer(
        &self,
        n: usize,
        f: &[Self::Fact],
    ) -> Self::Fact;
}

// The users of each node: who reads it.
fn users<P: Problem>(
    p: &P,
) -> Vec<Vec<usize>> {
    let mut us = vec![vec![]; p.len()];
    for v in 0..p.len() {
        for d in p.deps(v) {
            us[d].push(v);
        }
    }
    us
}

pub fn solve<P: Problem>(
    p: &P,
) -> Vec<P::Fact> {
    let us = users(p);
    let n = p.len();
    let mut f = vec![P::Fact::top(); n];
    // A stack: pop takes node 0 first.
    let mut work: Vec<usize> =
        (0..n).rev().collect();
    let mut queued = vec![true; n];
    todo!()
}`,
    solution: `// Facts, ordered. top() is the
// optimistic start, bottom() claims
// nothing, and meet() is the highest
// fact below both.
pub trait Lattice: Clone + PartialEq {
    fn top() -> Self;
    fn bottom() -> Self;
    fn meet(&self, o: &Self) -> Self;
}

// A sparse problem: one fact per node.
pub trait Problem {
    type Fact: Lattice;
    fn len(&self) -> usize;
    // The nodes whose facts n reads.
    fn deps(&self, n: usize)
        -> Vec<usize>;
    // n's fact, from the facts so far.
    fn transfer(
        &self,
        n: usize,
        f: &[Self::Fact],
    ) -> Self::Fact;
}

// The users of each node: who reads it.
fn users<P: Problem>(
    p: &P,
) -> Vec<Vec<usize>> {
    let mut us = vec![vec![]; p.len()];
    for v in 0..p.len() {
        for d in p.deps(v) {
            us[d].push(v);
        }
    }
    us
}

pub fn solve<P: Problem>(
    p: &P,
) -> Vec<P::Fact> {
    let us = users(p);
    let n = p.len();
    let mut f = vec![P::Fact::top(); n];
    // A stack: pop takes node 0 first.
    let mut work: Vec<usize> =
        (0..n).rev().collect();
    let mut queued = vec![true; n];
    while let Some(v) = work.pop() {
        queued[v] = false;
        let t = p.transfer(v, &f);
        // Clamp: facts only go down.
        let new = t.meet(&f[v]);
        if new == f[v] {
            continue;
        }
        f[v] = new;
        for &u in &us[v] {
            if !queued[u] {
                queued[u] = true;
                work.push(u);
            }
        }
    }
    f
}`,
    tests: `impl Lattice for bool {
    fn top() -> Self {
        true
    }
    fn bottom() -> Self {
        false
    }
    fn meet(&self, o: &Self) -> Self {
        *self && *o
    }
}

// A tiny SSA graph.
enum N {
    Num(i64),
    Str,
    Add(usize, usize),
    Phi(Vec<usize>),
}

fn deps_of(n: &N) -> Vec<usize> {
    match n {
        N::Add(a, b) => vec![*a, *b],
        N::Phi(xs) => xs.clone(),
        _ => vec![],
    }
}

// "Is it a number?"
struct G(Vec<N>);

impl Problem for G {
    type Fact = bool;
    fn len(&self) -> usize {
        self.0.len()
    }
    fn deps(&self, n: usize)
        -> Vec<usize>
    {
        deps_of(&self.0[n])
    }
    fn transfer(
        &self,
        n: usize,
        f: &[bool],
    ) -> bool {
        match &self.0[n] {
            N::Num(_) => true,
            N::Str => false,
            N::Add(a, b) => {
                f[*a] && f[*b]
            }
            N::Phi(xs) => {
                xs.iter().all(|&x| f[x])
            }
        }
    }
}

#[test]
fn a_counting_loop_stays_numeric() {
    // %0 = 0; %1 = phi %0, %3
    // %2 = 1; %3 = %1 + %2
    let g = G(vec![
        N::Num(0),
        N::Phi(vec![0, 3]),
        N::Num(1),
        N::Add(1, 2),
    ]);
    let all = vec![true; 4];
    assert_eq!(solve(&g), all);
}

#[test]
fn doubt_travels_round_the_loop() {
    // %3 = %1 + "!": the phi %1 is
    // done first, so it must be redone.
    let g = G(vec![
        N::Num(0),
        N::Phi(vec![0, 3]),
        N::Str,
        N::Add(1, 2),
    ]);
    assert_eq!(
        solve(&g),
        vec![true, false, false, false]
    );
}

// "Which constant is it?"
#[derive(Clone, PartialEq, Debug)]
enum C {
    Top,
    K(i64),
    Varies,
}

impl Lattice for C {
    fn top() -> Self {
        C::Top
    }
    fn bottom() -> Self {
        C::Varies
    }
    fn meet(&self, o: &Self) -> Self {
        match (self, o) {
            (C::Top, x)
            | (x, C::Top) => x.clone(),
            (C::K(a), C::K(b))
                if a == b =>
            {
                C::K(*a)
            }
            _ => C::Varies,
        }
    }
}

fn add(a: &C, b: &C) -> C {
    match (a, b) {
        (C::K(x), C::K(y)) => {
            C::K(x + y)
        }
        (C::Top, _) | (_, C::Top) => {
            C::Top
        }
        _ => C::Varies,
    }
}

struct K(Vec<N>);

impl Problem for K {
    type Fact = C;
    fn len(&self) -> usize {
        self.0.len()
    }
    fn deps(&self, n: usize)
        -> Vec<usize>
    {
        deps_of(&self.0[n])
    }
    fn transfer(
        &self,
        n: usize,
        f: &[C],
    ) -> C {
        match &self.0[n] {
            N::Num(k) => C::K(*k),
            N::Str => C::Varies,
            N::Add(a, b) => {
                add(&f[*a], &f[*b])
            }
            N::Phi(xs) => xs
                .iter()
                .fold(C::Top, |m, &x| {
                    m.meet(&f[x])
                }),
        }
    }
}

#[test]
fn the_same_solver_folds_constants() {
    // %2 = %0 + %1 = 1 + 1
    let k = K(vec![
        N::Num(1),
        N::Num(1),
        N::Add(0, 1),
        N::Phi(vec![2, 2]),
    ]);
    assert_eq!(solve(&k)[3], C::K(2));
}

#[test]
fn a_loop_counter_varies() {
    let k = K(vec![
        N::Num(0),
        N::Phi(vec![0, 3]),
        N::Num(1),
        N::Add(1, 2),
    ]);
    assert_eq!(solve(&k)[1], C::Varies);
}`,
    hints: [
      'The loop is `while let Some(v) = work.pop() { ... }`, and the first line inside it is `queued[v] = false;`.',
      'Compute `let new = p.transfer(v, &f).meet(&f[v]);`. If `new == f[v]` nothing changed: `continue`.',
      'Otherwise store `f[v] = new` and, for each `u` in `us[v]` with `!queued[u]`, set `queued[u] = true` and `work.push(u)`.',
    ],
    walkthrough: `**How to think about it.** A worklist solver keeps one promise: a node is on the stack whenever its fact might be out of date. At the start every fact is a guess (top), so every node is on the stack. Popping a node brings it up to date; if its fact changed, every node that reads it might now be out of date, so those go back on the stack. When the stack is empty, nothing is out of date: that is the fixpoint. The solver never looks inside a fact; it only calls \`top\`, \`meet\`, \`==\` and \`transfer\`, which is why one copy works for \`bool\` and for the constant lattice \`C\`.

**The solution, line by line.**

- \`while let Some(v) = work.pop() {\` takes nodes off the end of the stack until it is empty; \`pop\` returns \`None\` then, which ends the loop. The stack was filled with \`(0..n).rev()\`, so node 0 comes off first.
- \`queued[v] = false;\` records that \`v\` is no longer on the stack, so that a later change to one of its inputs can put it back.
- \`let t = p.transfer(v, &f);\` asks the problem for \`v\`'s fact given the facts so far (the solver passes the whole slice; the rule reads only what it needs).
- \`let new = t.meet(&f[v]);\` clamps: the stored fact can only go down the lattice, never up. That is what makes the termination argument work whatever the rules do.
- \`if new == f[v] { continue; }\` skips the rest when nothing changed: nobody needs waking.
- \`f[v] = new;\` stores the lower fact.
- \`for &u in &us[v] { if !queued[u] { queued[u] = true; work.push(u); } }\` wakes every user of \`v\` that is not already waiting. The \`queued\` check keeps each node on the stack at most once, so the stack never holds more than \`n\` entries.
- \`f\` is returned after the loop: the fixpoint.

Trace \`a_loop_counter_varies\`: the phi first meets \`K(0)\` with \`Top\` and becomes \`K(0)\`; then the increment \`%3\` becomes \`K(1)\`, which wakes the phi, and \`K(0) ⊓ K(1)\` is \`Varies\`; that wakes \`%3\`, which becomes \`Varies\` too, and the stack empties. rustc makes a separate copy of \`solve\` for each problem type (monomorphization), so being generic costs nothing at run time.

**Common wrong attempts.**

- Never clearing \`queued[v]\`. Then a node popped once counts as queued forever, so when \`%3\` changes, the phi \`%1\` is not pushed again and keeps its stale "number".
- Visiting each node once, in order, and storing the result. That is a single round, not a fixpoint: the loop phi is computed before the doubt reaches it round the back edge.
- Storing \`t\` without the meet. On these tests it may still pass, but nothing then guarantees the loop stops on a problem whose rules can move a fact back up.`,
    wrong: [
      {
        code: `// Facts, ordered. top() is the
// optimistic start, bottom() claims
// nothing, and meet() is the highest
// fact below both.
pub trait Lattice: Clone + PartialEq {
    fn top() -> Self;
    fn bottom() -> Self;
    fn meet(&self, o: &Self) -> Self;
}

// A sparse problem: one fact per node.
pub trait Problem {
    type Fact: Lattice;
    fn len(&self) -> usize;
    // The nodes whose facts n reads.
    fn deps(&self, n: usize)
        -> Vec<usize>;
    // n's fact, from the facts so far.
    fn transfer(
        &self,
        n: usize,
        f: &[Self::Fact],
    ) -> Self::Fact;
}

// The users of each node: who reads it.
fn users<P: Problem>(
    p: &P,
) -> Vec<Vec<usize>> {
    let mut us = vec![vec![]; p.len()];
    for v in 0..p.len() {
        for d in p.deps(v) {
            us[d].push(v);
        }
    }
    us
}

pub fn solve<P: Problem>(
    p: &P,
) -> Vec<P::Fact> {
    let us = users(p);
    let n = p.len();
    let mut f = vec![P::Fact::top(); n];
    // A stack: pop takes node 0 first.
    let mut work: Vec<usize> =
        (0..n).rev().collect();
    let mut queued = vec![true; n];
    while let Some(v) = work.pop() {
        let t = p.transfer(v, &f);
        let new = t.meet(&f[v]);
        if new == f[v] {
            continue;
        }
        f[v] = new;
        for &u in &us[v] {
            if !queued[u] {
                queued[u] = true;
                work.push(u);
            }
        }
    }
    f
}`,
        why: '`queued[v]` is never cleared, so once a node has been popped it counts as queued forever. When `%3` changes, the phi `%1` is not pushed again and keeps “number”.',
      },
      {
        code: `// Facts, ordered. top() is the
// optimistic start, bottom() claims
// nothing, and meet() is the highest
// fact below both.
pub trait Lattice: Clone + PartialEq {
    fn top() -> Self;
    fn bottom() -> Self;
    fn meet(&self, o: &Self) -> Self;
}

// A sparse problem: one fact per node.
pub trait Problem {
    type Fact: Lattice;
    fn len(&self) -> usize;
    // The nodes whose facts n reads.
    fn deps(&self, n: usize)
        -> Vec<usize>;
    // n's fact, from the facts so far.
    fn transfer(
        &self,
        n: usize,
        f: &[Self::Fact],
    ) -> Self::Fact;
}

// The users of each node: who reads it.
fn users<P: Problem>(
    p: &P,
) -> Vec<Vec<usize>> {
    let mut us = vec![vec![]; p.len()];
    for v in 0..p.len() {
        for d in p.deps(v) {
            us[d].push(v);
        }
    }
    us
}

pub fn solve<P: Problem>(
    p: &P,
) -> Vec<P::Fact> {
    let us = users(p);
    let n = p.len();
    let mut f = vec![P::Fact::top(); n];
    // A stack: pop takes node 0 first.
    let mut work: Vec<usize> =
        (0..n).rev().collect();
    let mut queued = vec![true; n];
    while let Some(v) = work.pop() {
        queued[v] = false;
        let t = p.transfer(v, &f);
        f[v] = t.meet(&f[v]);
    }
    f
}`,
        why: 'One visit per node, in order, never revisits a node whose input changed later. That is one round, not a fixpoint: the loop phi is computed before the doubt reaches it.',
      },
    ],
  },
  product: {
    lang: 'rust',
    optional: true,
    title: 'A product lattice for Python',
    prompt: 'Python’s numeric fixpoint keeps two facts per value: “is a float” and “is an int”. Implement `Lattice` for any pair `(A, B)` of lattices, component by component: `top` is both tops, `bottom` both bottoms, and `meet` meets each side.',
    starter: `// Facts, ordered. top() is the
// optimistic start, bottom() claims
// nothing, and meet() is the highest
// fact below both.
pub trait Lattice: Clone + PartialEq {
    fn top() -> Self;
    fn bottom() -> Self;
    fn meet(&self, o: &Self) -> Self;
}

// A sparse problem: one fact per node.
pub trait Problem {
    type Fact: Lattice;
    fn len(&self) -> usize;
    // The nodes whose facts n reads.
    fn deps(&self, n: usize)
        -> Vec<usize>;
    // n's fact, from the facts so far.
    fn transfer(
        &self,
        n: usize,
        f: &[Self::Fact],
    ) -> Self::Fact;
}

impl<A: Lattice, B: Lattice> Lattice
    for (A, B)
{
    fn top() -> Self {
        todo!()
    }
    fn bottom() -> Self {
        todo!()
    }
    fn meet(&self, o: &Self) -> Self {
        todo!()
    }
}`,
    solution: `// Facts, ordered. top() is the
// optimistic start, bottom() claims
// nothing, and meet() is the highest
// fact below both.
pub trait Lattice: Clone + PartialEq {
    fn top() -> Self;
    fn bottom() -> Self;
    fn meet(&self, o: &Self) -> Self;
}

// A sparse problem: one fact per node.
pub trait Problem {
    type Fact: Lattice;
    fn len(&self) -> usize;
    // The nodes whose facts n reads.
    fn deps(&self, n: usize)
        -> Vec<usize>;
    // n's fact, from the facts so far.
    fn transfer(
        &self,
        n: usize,
        f: &[Self::Fact],
    ) -> Self::Fact;
}

impl<A: Lattice, B: Lattice> Lattice
    for (A, B)
{
    fn top() -> Self {
        (A::top(), B::top())
    }
    fn bottom() -> Self {
        (A::bottom(), B::bottom())
    }
    fn meet(&self, o: &Self) -> Self {
        (
            self.0.meet(&o.0),
            self.1.meet(&o.1),
        )
    }
}`,
    tests: `impl Lattice for bool {
    fn top() -> Self {
        true
    }
    fn bottom() -> Self {
        false
    }
    fn meet(&self, o: &Self) -> Self {
        *self && *o
    }
}

// (is a float, is an int)
type Py = (bool, bool);

#[test]
fn top_is_both_tops() {
    assert_eq!(Py::top(), (true, true));
}

#[test]
fn bottom_is_both_bottoms() {
    let b = Py::bottom();
    assert_eq!(b, (false, false));
}

#[test]
fn meet_is_per_side() {
    let float = (true, false);
    let int = (false, true);
    let m = float.meet(&int);
    assert_eq!(m, (false, false));
    let t = Py::top();
    assert_eq!(t.meet(&int), int);
}

#[test]
fn pairs_nest() {
    let a = ((true, true), false);
    let b = ((true, false), false);
    let m = a.meet(&b);
    let want = ((true, false), false);
    assert_eq!(m, want);
}`,
    hints: [
      'Inside the impl, `A::top()` and `B::top()` are the two tops.',
      '`self.0` and `self.1` are the two sides; meet each with the matching side of `o`.',
    ],
    walkthrough: `**How to think about it.** A product lattice orders pairs side by side: one pair is below another when *each* side is below (or equal to) the other's. So the most hopeful pair is the pair of most hopeful facts, the safest pair is the pair of safest facts, and the meet of two pairs is worked out on each side on its own, with no side ever looking at the other. Write that sentence as code, once, for any two lattices \`A\` and \`B\`.

**The solution, line by line.**

- \`impl<A: Lattice, B: Lattice> Lattice for (A, B) {\` is a generic impl: for any two types that are lattices, the tuple of them is a lattice. Rust allows it because \`Lattice\` is our own trait. \`Clone + PartialEq\` (the supertraits) already hold for a tuple whose parts have them.
- \`fn top() -> Self { (A::top(), B::top()) }\` calls each side's own \`top\`; \`A::top()\` names the function through the type, since there is no value yet.
- \`fn bottom() -> Self { (A::bottom(), B::bottom()) }\` is the same for the safe end.
- \`fn meet(&self, o: &Self) -> Self { (self.0.meet(&o.0), self.1.meet(&o.1)) }\` meets the first halves with each other and the second halves with each other; \`.0\` and \`.1\` are a tuple's fields.

Because the impl is generic, pairs nest for free: \`((bool, bool), bool)\` is a lattice too, as the last test checks. That is the shape of Python's fixpoint in \`analysis.rs\`: \`num\` and \`int\` are two \`Vec<bool>\`s, one per side of the pair, and every round updates both. A value can be neither (a string), a float or an int, but not both; the lattice itself does not know that, which is fine, because the rules never produce \`(true, true)\` after the optimistic start.

**Common wrong attempts.**

- Returning \`bottom\` whenever the two pairs differ. Pairs that differ are not always unrelated: top met with \`(false, true)\` is \`(false, true)\`, not bottom. Meet each side separately.
- Writing the impl for \`(bool, bool)\` only. It passes the first tests and fails the nested one, and it misses the point: the product of *any* two lattices is a lattice.`,
    wrong: [
      {
        code: `// Facts, ordered. top() is the
// optimistic start, bottom() claims
// nothing, and meet() is the highest
// fact below both.
pub trait Lattice: Clone + PartialEq {
    fn top() -> Self;
    fn bottom() -> Self;
    fn meet(&self, o: &Self) -> Self;
}

// A sparse problem: one fact per node.
pub trait Problem {
    type Fact: Lattice;
    fn len(&self) -> usize;
    // The nodes whose facts n reads.
    fn deps(&self, n: usize)
        -> Vec<usize>;
    // n's fact, from the facts so far.
    fn transfer(
        &self,
        n: usize,
        f: &[Self::Fact],
    ) -> Self::Fact;
}

impl<A: Lattice, B: Lattice> Lattice
    for (A, B)
{
    fn top() -> Self {
        (A::top(), B::top())
    }
    fn bottom() -> Self {
        (A::bottom(), B::bottom())
    }
    fn meet(&self, o: &Self) -> Self {
        if self == o {
            self.clone()
        } else {
            Self::bottom()
        }
    }
}`,
        why: 'Pairs that differ are not always unrelated: `top` met with `(false, true)` is `(false, true)`, not bottom. Meet each side separately.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A closure that captures `idom` is called inside a loop that also assigns `idom[b] = Some(d)`. What does rustc 1.97 say?',
    options: [
      {
        t: 'Nothing: closures copy what they capture',
        why: 'A non-`move` closure borrows `idom`.',
      },
      {
        t: 'E0382: use of moved value',
        why: 'Nothing is moved; it is borrowed.',
      },
      {
        t: 'E0502: cannot borrow `idom` as mutable because it is also borrowed as immutable',
        correct: true,
        why: 'The closure holds a shared borrow for as long as it is used. `cfg.rs` passes `idom` as a parameter instead.',
      },
      {
        t: 'A runtime panic',
        why: 'The borrow checker rejects it at compile time.',
      },
    ],
  },
  {
    q: 'Which uses does `try_remove_trivial_phi` rewrite?',
    options: [
      {
        t: 'Instruction operands only',
        why: 'Terminators use values too.',
      },
      {
        t: 'Instruction operands, `condbr`, `return` and `throw` values, and the builder’s current definitions',
        correct: true,
        why: 'All within the function being built: SSA values never cross functions.',
      },
      {
        t: 'Instruction operands and `condbr` conditions',
        why: 'Returned and thrown values too. Missing `throw` was the bug.',
      },
    ],
  },
  {
    q: 'What does engine/rust’s `analysis.rs` use to compute numeric kinds?',
    options: [
      {
        t: 'A generic `Problem` trait and a shared worklist solver',
        why: 'That is this chapter’s design. The port has no such trait.',
      },
      {
        t: 'An optimistic fixpoint, run in rounds over values, bindings and fields, capped at `MAX_ROUNDS` = 1000',
        correct: true,
        why: '`numeric_inference` in `analysis.rs`, a port of the same loop in `analysis.ts`.',
      },
      {
        t: 'A single pass in reverse postorder',
        why: 'One pass can’t settle facts that depend on themselves round a loop.',
      },
    ],
  },
  {
    q: 'Your design solver clamps: it stores `transfer(..).meet(&old)`. What does that guarantee?',
    options: [
      {
        t: 'Each fact only moves down, so with a lattice of finite height the worklist empties',
        correct: true,
        why: 'Each node can only step down, at most h times on a lattice of height h, and each change adds a bounded number of users.',
      },
      {
        t: 'The most precise answer for any transfer function',
        why: 'Clamping guarantees an end, not precision.',
      },
      {
        t: 'Nodes are visited in id order',
        why: 'Order is decided by the worklist, not by the clamp.',
      },
    ],
  },
];
