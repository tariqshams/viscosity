//! Control-flow graph utilities (the book's chapters “IR, three-address code and control-flow graphs” and “Dominators and natural loops”): reverse
//! postorder, dominators, and natural loops.
//!
//! Dominators use the iterative algorithm of Cooper, Harvey and Kennedy
//! ("A Simple, Fast Dominance Algorithm"), which is short and fast in
//! practice.

use std::collections::BTreeSet;

use indexmap::IndexMap;
use viscosity_vir::{BlockId, Func};

pub fn successors(f: &Func, b: BlockId) -> Vec<BlockId> {
    f.block(b).term.successors()
}

/// Blocks reachable from the entry, in reverse postorder of a depth-first
/// search that visits successors in order.
pub fn reverse_postorder(f: &Func) -> Vec<BlockId> {
    let mut seen = vec![false; f.blocks.len()];
    let mut order = Vec::with_capacity(f.blocks.len());
    // An explicit stack of (block, its successors, next successor to try),
    // equivalent to the recursive DFS of the reference.
    let mut stack: Vec<(BlockId, Vec<BlockId>, usize)> = Vec::new();
    seen[f.entry.index()] = true;
    stack.push((f.entry, successors(f, f.entry), 0));
    while let Some((b, succ, next)) = stack.last_mut() {
        if let Some(&s) = succ.get(*next) {
            *next += 1;
            if !seen[s.index()] {
                seen[s.index()] = true;
                let ss = successors(f, s);
                stack.push((s, ss, 0));
            }
        } else {
            order.push(*b);
            stack.pop();
        }
    }
    order.reverse();
    order
}

/// Immediate dominators. The entry is its own immediate dominator;
/// unreachable blocks have none.
#[derive(Clone, Debug)]
pub struct Dominators {
    idom: Vec<Option<BlockId>>,
}

impl Dominators {
    pub fn idom(&self, b: BlockId) -> Option<BlockId> {
        self.idom.get(b.index()).copied().flatten()
    }

    /// Is `b` reachable (does it have an immediate dominator)?
    pub fn contains(&self, b: BlockId) -> bool {
        self.idom(b).is_some()
    }

    /// Does `a` dominate `b`?
    pub fn dominates(&self, a: BlockId, b: BlockId) -> bool {
        if !self.contains(b) {
            return false;
        }
        let mut x = b;
        loop {
            if x == a {
                return true;
            }
            let up = self.idom(x).expect("reachable blocks have an idom");
            if up == x {
                return false;
            }
            x = up;
        }
    }
}

pub fn dominators(f: &Func) -> Dominators {
    let rpo = reverse_postorder(f);
    let mut index = vec![usize::MAX; f.blocks.len()];
    for (i, b) in rpo.iter().enumerate() {
        index[b.index()] = i;
    }
    let mut idom: Vec<Option<BlockId>> = vec![None; f.blocks.len()];
    idom[f.entry.index()] = Some(f.entry);
    let intersect = |idom: &[Option<BlockId>], mut a: BlockId, mut b: BlockId| {
        while a != b {
            while index[a.index()] > index[b.index()] {
                a = idom[a.index()].expect("processed");
            }
            while index[b.index()] > index[a.index()] {
                b = idom[b.index()].expect("processed");
            }
        }
        a
    };
    let mut changed = true;
    while changed {
        changed = false;
        for &b in &rpo {
            if b == f.entry {
                continue;
            }
            let preds: Vec<BlockId> = f.block(b).preds.iter().copied().filter(|p| idom[p.index()].is_some()).collect();
            let Some((&first, rest)) = preds.split_first() else {
                continue;
            };
            let mut d = first;
            for &p in rest {
                d = intersect(&idom, p, d);
            }
            if idom[b.index()] != Some(d) {
                idom[b.index()] = Some(d);
                changed = true;
            }
        }
    }
    Dominators { idom }
}

/// A natural loop.
#[derive(Clone, Debug)]
pub struct Loop {
    pub header: BlockId,
    /// Blocks in the loop, header included.
    pub body: BTreeSet<BlockId>,
    /// Nesting depth: 1 for an outermost loop.
    pub depth: u32,
}

/// Natural loops: one per header, the union of the loops of every back edge
/// `t → h` where `h` dominates `t` (chapter “Dominators and natural loops”). Loops are listed in the
/// order their headers are first found.
pub fn natural_loops(f: &Func, idom: &Dominators) -> Vec<Loop> {
    let mut by_header: IndexMap<BlockId, BTreeSet<BlockId>> = IndexMap::new();
    for b in &f.blocks {
        if !idom.contains(b.id) {
            continue;
        }
        for s in successors(f, b.id) {
            if idom.dominates(s, b.id) {
                let body = by_header.entry(s).or_insert_with(|| BTreeSet::from([s]));
                let mut stack = vec![b.id];
                while let Some(x) = stack.pop() {
                    if !body.insert(x) {
                        continue;
                    }
                    stack.extend(f.block(x).preds.iter().copied());
                }
            }
        }
    }
    let mut loops: Vec<Loop> = by_header.into_iter().map(|(header, body)| Loop { header, body, depth: 1 }).collect();
    let depths: Vec<u32> = loops
        .iter()
        .enumerate()
        .map(|(i, l)| {
            let enclosing = loops
                .iter()
                .enumerate()
                .filter(|(j, o)| *j != i && o.body.contains(&l.header) && o.body.len() > l.body.len())
                .count();
            enclosing as u32 + 1
        })
        .collect();
    for (l, d) in loops.iter_mut().zip(depths) {
        l.depth = d;
    }
    loops
}

/// The innermost loop containing block `b`, if any (the smallest; the first
/// one listed on ties).
pub fn loop_of(loops: &[Loop], b: BlockId) -> Option<&Loop> {
    let mut best: Option<&Loop> = None;
    for l in loops {
        if l.body.contains(&b) && best.is_none_or(|x| l.body.len() < x.body.len()) {
            best = Some(l);
        }
    }
    best
}

#[cfg(test)]
mod tests {
    use super::*;
    use viscosity_vir::{Block, Func, FuncId, Terminator, ValueId};

    /// A function whose blocks have the given terminators; preds are derived.
    fn func(terms: Vec<Terminator>) -> Func {
        let mut blocks: Vec<Block> = terms
            .into_iter()
            .enumerate()
            .map(|(i, term)| Block { id: BlockId(i as u32), insts: vec![], term, preds: vec![] })
            .collect();
        for i in 0..blocks.len() {
            for s in blocks[i].term.successors() {
                blocks[s.index()].preds.push(BlockId(i as u32));
            }
        }
        Func {
            id: FuncId(0),
            name: "t".into(),
            params: vec![],
            param_bindings: vec![],
            blocks,
            entry: BlockId(0),
            captures: Default::default(),
            declared_as: None,
            src: None,
        }
    }

    fn br(t: u32) -> Terminator {
        Terminator::Br { target: BlockId(t) }
    }

    fn cond(t: u32, e: u32) -> Terminator {
        Terminator::CondBr { cond: ValueId(0), then: BlockId(t), else_: BlockId(e), src: None }
    }

    fn ret() -> Terminator {
        Terminator::Return { value: None, src: None }
    }

    #[test]
    fn diamond_dominators() {
        // 0 -> 1, 2 -> 3
        let f = func(vec![cond(1, 2), br(3), br(3), ret()]);
        assert_eq!(reverse_postorder(&f), vec![BlockId(0), BlockId(2), BlockId(1), BlockId(3)]);
        let d = dominators(&f);
        assert_eq!(d.idom(BlockId(3)), Some(BlockId(0)));
        assert!(d.dominates(BlockId(0), BlockId(1)));
        assert!(!d.dominates(BlockId(1), BlockId(3)));
        assert!(natural_loops(&f, &d).is_empty());
    }

    #[test]
    fn nested_loops_and_unreachable_blocks() {
        // 0 -> 1 (outer header) -> 2 (inner header) -> 3 -> 2 ; 2 -> 4 -> 1 ; 1 -> 5 ; 6 unreachable -> 3
        let f = func(vec![br(1), cond(2, 5), cond(3, 4), br(2), br(1), ret(), br(3)]);
        let d = dominators(&f);
        assert!(!d.contains(BlockId(6)));
        assert!(!d.dominates(BlockId(0), BlockId(6)));
        let loops = natural_loops(&f, &d);
        assert_eq!(loops.len(), 2);
        let inner = loop_of(&loops, BlockId(3)).expect("in a loop");
        assert_eq!(inner.header, BlockId(2));
        assert_eq!(inner.depth, 2);
        // The unreachable predecessor is swept into the body, as in the reference.
        assert!(inner.body.contains(&BlockId(6)));
        assert_eq!(loop_of(&loops, BlockId(4)).map(|l| (l.header, l.depth)), Some((BlockId(1), 1)));
    }
}
