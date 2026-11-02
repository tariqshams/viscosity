// A small tree helper for this chapter's diagrams: leaves spread evenly,
// parents centred over their children, and an optional annotation (an
// attribute value) written beside any node.
import type { ReactElement } from 'react';
import { Box, T, tok } from '../../viz/svg';

/** A tree node. `term` marks a leaf token. */
export type N = { id: string; label: string; term?: boolean; kids?: N[] };
export type Placed = { node: N; x: number; y: number; parent?: string };

export function layout(root: N, x0: number, x1: number, top: number, dy: number): Map<string, Placed> {
  const leaves: N[] = [];
  const collect = (n: N) => (n.kids?.length ? n.kids.forEach(collect) : leaves.push(n));
  collect(root);
  const step = (x1 - x0) / leaves.length;
  const out = new Map<string, Placed>();
  const place = (n: N, depth: number, parent?: string): number => {
    let x: number;
    if (n.kids?.length) {
      const xs = n.kids.map((k) => place(k, depth + 1, n.id));
      x = (xs[0] + xs[xs.length - 1]) / 2;
    } else {
      x = x0 + step * (leaves.indexOf(n) + 0.5);
    }
    out.set(n.id, { node: n, x, y: top + depth * dy, parent });
    return x;
  };
  place(root, 0);
  return out;
}

const boxW = (s: string) => Math.max(24, s.length * 7.4 + 10);

/** Draw the tree; `ann` gives text to write beside a node, `hi` rings one. */
export function drawTree(placed: Map<string, Placed>, ann: Record<string, string> = {}, hi?: string, annSide: 'right' | 'below' = 'right'): ReactElement {
  const edges: ReactElement[] = [];
  const nodes: ReactElement[] = [];
  for (const [id, p] of placed) {
    if (p.parent) {
      const q = placed.get(p.parent)!;
      edges.push(<line key={'e' + id} x1={q.x} y1={q.y + 9} x2={p.x} y2={p.y - 9} stroke={tok('ink', 0.4)} strokeWidth={1.3} />);
    }
    const w = boxW(p.node.label);
    const term = p.node.term;
    const ring = hi === id;
    const a = ann[id];
    nodes.push(
      <g key={'n' + id}>
        <Box x={p.x - w / 2} y={p.y - 9} w={w} h={18} r={term ? 3 : 9}
          fill={ring ? tok('brand', 0.3) : term ? tok('panel') : tok('brand', 0.1)}
          stroke={ring ? tok('brand') : term ? tok('ink', 0.45) : tok('brand', 0.7)}>
          <T x={p.x} y={p.y + 1} size={12} mono anchor="middle" weight={term ? 400 : 700}>{p.node.label}</T>
        </Box>
        {a !== undefined && (annSide === 'right'
          ? <T x={p.x + w / 2 + 3} y={p.y + 1} size={11} mono weight={700} fill={tok('accent')}>{a}</T>
          : <T x={p.x} y={p.y + 18} size={11} mono weight={700} anchor="middle" fill={tok('accent')}>{a}</T>)}
      </g>,
    );
  }
  return <g>{edges}{nodes}</g>;
}
