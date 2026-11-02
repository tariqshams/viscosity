// Chapter 423 cards. Keys are stable ids: never rename them.

// Shared by the exercise: the dominator state and the driver loop.
const SCAF = `struct Doms {
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
`;

export const prompts = {

  'idom-vec': {
    q: 'The TS `dominators` returns a `Map<BlockId, BlockId>`. What does the Rust one store?',
    a: 'A `Vec<Option<BlockId>>` indexed by block, with `None` for an unreachable block.',
  },
  'intersect-param': {
    q: 'Why does `intersect` in `cfg.rs` take `idom` as a parameter instead of capturing it?',
    a: 'The loop mutates `idom` while the closure is alive. A closure that captured it would hold a shared borrow, and the mutation would be error E0502.',
  },

  'chk-skip': {
    q: 'In a pass of Cooper–Harvey–Kennedy, which predecessors of a block are used?',
    a: 'Only those that already have an idom. The rest are skipped this pass.',
  },
  'loop-order': {
    q: 'Why is `natural_loops` keyed by an `IndexMap` and not a `HashMap`?',
    a: 'Loops must be listed in the order their headers are first found, as with the TS `Map`, and that order reaches the explain output.',
  },
  'builder-no-module': {
    q: 'Why doesn’t `FunctionBuilder` own the `Module`?',
    a: 'Every method takes `&mut Module`, so a front-end can keep one module and switch between builders for nested functions.',
  },

  'phi-front': {
    q: 'Why can a phi with a larger number appear above a smaller one in a listing?',
    a: '`new_phi` inserts at the front of the block (`insts.insert(0, id)`), so later phis go above earlier ones.',
  },
  'trivial-phi': {
    q: 'When is a phi trivial?',
    a: 'When, ignoring itself, all its operands are one value. It is replaced by that value everywhere.',
  },
  'throw-bug': {
    q: 'What went wrong when trivial-phi removal didn’t rewrite `throw` operands?',
    a: 'A thrown element still named the removed phi, so the escape analysis missed it. The compiled program threw an index instead of the object.',
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
};

export const exercises = {
  chk: {
    lang: 'rust',
    title: 'Cooper–Harvey–Kennedy',
    prompt:
      'Finish the dominator algorithm of `cfg.rs`. `intersect(a, b)`: while `a != b`, move whichever is later in reverse postorder (the larger `ix`) up to its idom. `pass`: for each block of `rpo` after the entry, intersect all predecessors that already have an idom (skip the others), and store the result if it differs. Return whether anything changed. `idoms` runs `pass` until it returns false.',
    starter: `${SCAF}
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
    solution: `${SCAF}
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
        code: `${SCAF}
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
        code: `${SCAF}
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
};

export const quiz = [
  {
    q: 'Which representation does `cfg.rs` use for immediate dominators?',
    options: [
      { t: 'A `HashMap<BlockId, BlockId>`, like the TS `Map`', why: 'The port uses a dense `Vec`, since block ids are small indices.' },
      { t: '`Vec<Option<BlockId>>` indexed by block id, where `None` means unreachable', correct: true, why: '`Dominators { idom }`, and `idom(b)` reads `self.idom.get(b.index())`.' },
      { t: 'A tree of `Box`ed nodes', why: 'Nothing is boxed; ids index into vectors.' },
    ],
  },
  {
    q: 'A closure that captures `idom` is called inside a loop that also assigns `idom[b] = Some(d)`. What does rustc 1.97 say?',
    options: [
      { t: 'Nothing: closures copy what they capture', why: 'A non-`move` closure borrows `idom`.' },
      { t: 'E0502: cannot borrow `idom` as mutable because it is also borrowed as immutable', correct: true, why: 'The closure holds a shared borrow for as long as it is used. `cfg.rs` passes `idom` as a parameter instead.' },
      { t: 'E0382: use of moved value', why: 'Nothing is moved; it is borrowed.' },
      { t: 'A runtime panic', why: 'The borrow checker rejects it at compile time.' },
    ],
  },
  {
    q: 'In the first pass, a loop header’s predecessors are the block before the loop and the latch. Why is the latch ignored?',
    options: [
      { t: 'Back edges never count for dominance', why: 'They count: the next pass intersects the latch too.' },
      { t: 'The latch is unreachable', why: 'It is reachable; it just hasn’t been processed yet.' },
      { t: 'The latch comes later in reverse postorder, so it has no idom yet', correct: true, why: 'The pass skips predecessors without an idom.' },
    ],
  },

  {
    q: 'A sealed loop header’s phi for `e` gets the operands `%14` (from the entry side) and itself (from the latch). What happens?',
    options: [
      { t: 'It stays: it has two operands', why: 'Operands equal to the phi itself are ignored.' },
      { t: 'It becomes `undefined`', why: 'That is only for a phi with no operand other than itself.' },
      { t: 'It is trivial: every use of it becomes `%14`, and it turns into an empty opaque', correct: true, why: '`try_remove_trivial_phi` then retries the phis that used it.' },
      { t: 'Lowering fails', why: 'This is the normal case for a variable the loop doesn’t change.' },
    ],
  },
  {
    q: 'Which uses does `try_remove_trivial_phi` rewrite?',
    options: [
      { t: 'Instruction operands only', why: 'Terminators use values too.' },
      { t: 'Instruction operands, `condbr`, `return` and `throw` values, and the builder’s current definitions', correct: true, why: 'All within the function being built: SSA values never cross functions.' },
      { t: 'Instruction operands and `condbr` conditions', why: 'Returned and thrown values too. Missing `throw` was the bug.' },
    ],
  },
];
