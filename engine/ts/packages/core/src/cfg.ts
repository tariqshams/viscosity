// Control-flow graph utilities (book chapters 75, 76, 83): reverse
// postorder, dominators, and natural loops.
//
// Dominators use the iterative algorithm of Cooper, Harvey and Kennedy
// ("A Simple, Fast Dominance Algorithm"), which is short and fast in practice.
import type { BlockId, Func } from './vir.ts';

export function successors(f: Func, b: BlockId): BlockId[] {
  const t = f.blocks[b].term;
  return t.kind === 'br' ? [t.target] : t.kind === 'condbr' ? [t.then, t.else] : [];
}

export function reversePostorder(f: Func): BlockId[] {
  const seen = new Set<BlockId>();
  const order: BlockId[] = [];
  const visit = (b: BlockId) => {
    seen.add(b);
    for (const s of successors(f, b)) if (!seen.has(s)) visit(s);
    order.push(b);
  };
  visit(f.entry);
  return order.reverse();
}

/** idom[b] = immediate dominator of b (entry's idom is itself). Unreachable blocks are absent. */
export function dominators(f: Func): Map<BlockId, BlockId> {
  const rpo = reversePostorder(f);
  const index = new Map(rpo.map((b, i) => [b, i]));
  const idom = new Map<BlockId, BlockId>([[f.entry, f.entry]]);
  const intersect = (a: BlockId, b: BlockId) => {
    while (a !== b) {
      while (index.get(a)! > index.get(b)!) a = idom.get(a)!;
      while (index.get(b)! > index.get(a)!) b = idom.get(b)!;
    }
    return a;
  };
  let changed = true;
  while (changed) {
    changed = false;
    for (const b of rpo) {
      if (b === f.entry) continue;
      const preds = f.blocks[b].preds.filter((p) => idom.has(p));
      if (preds.length === 0) continue;
      let d = preds[0];
      for (const p of preds.slice(1)) d = intersect(p, d);
      if (idom.get(b) !== d) {
        idom.set(b, d);
        changed = true;
      }
    }
  }
  return idom;
}

export function dominates(idom: Map<BlockId, BlockId>, a: BlockId, b: BlockId): boolean {
  if (!idom.has(b)) return false;
  for (let x = b; ; x = idom.get(x)!) {
    if (x === a) return true;
    if (idom.get(x) === x) return false;
  }
}

export interface Loop {
  header: BlockId;
  /** blocks in the loop, header included */
  body: Set<BlockId>;
  /** nesting depth: 1 for an outermost loop */
  depth: number;
}

/** Natural loops: for each back edge t→h where h dominates t (chapter 83). */
export function naturalLoops(f: Func, idom = dominators(f)): Loop[] {
  const byHeader = new Map<BlockId, Set<BlockId>>();
  for (const b of f.blocks) {
    if (!idom.has(b.id)) continue;
    for (const s of successors(f, b.id)) {
      if (dominates(idom, s, b.id)) {
        let body = byHeader.get(s);
        if (!body) byHeader.set(s, (body = new Set([s])));
        const stack = [b.id];
        while (stack.length) {
          const x = stack.pop()!;
          if (body.has(x)) continue;
          body.add(x);
          for (const p of f.blocks[x].preds) stack.push(p);
        }
      }
    }
  }
  const loops: Loop[] = [...byHeader].map(([header, body]) => ({ header, body, depth: 1 }));
  for (const l of loops) {
    l.depth = loops.filter((o) => o !== l && o.body.has(l.header) && o.body.size > l.body.size).length + 1;
  }
  return loops;
}

/** The innermost loop containing block b, if any. */
export function loopOf(loops: Loop[], b: BlockId): Loop | null {
  let best: Loop | null = null;
  for (const l of loops) if (l.body.has(b) && (!best || l.body.size < best.body.size)) best = l;
  return best;
}
