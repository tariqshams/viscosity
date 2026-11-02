// Shared helpers for this chapter's parse-tree diagrams: a tiny tree type,
// a layout (leaves spread evenly, parents centred over their children) and
// a drawing function that can hide nodes not yet derived.
import type { ReactElement } from 'react';
import { Box, T, tok } from '../../viz/svg';

/** A parse-tree node. `term` marks a terminal (a leaf token). */
export type PT = { id: string; label: string; term?: boolean; lex?: string; kids?: PT[] };

export type Placed = { node: PT; x: number; y: number; depth: number; parent?: string };

/** Place every node: leaves evenly across [x0, x1], parents over kids. */
export function layout(root: PT, x0: number, x1: number, top: number, dy: number): Map<string, Placed> {
  const leaves: PT[] = [];
  const collect = (n: PT) => (n.kids?.length ? n.kids.forEach(collect) : leaves.push(n));
  collect(root);
  const step = (x1 - x0) / leaves.length;
  const out = new Map<string, Placed>();
  const place = (n: PT, depth: number, parent?: string): number => {
    let x: number;
    if (n.kids?.length) {
      const xs = n.kids.map((k) => place(k, depth + 1, n.id));
      x = (xs[0] + xs[xs.length - 1]) / 2;
    } else {
      x = x0 + step * (leaves.indexOf(n) + 0.5);
    }
    out.set(n.id, { node: n, x, y: top + depth * dy, depth, parent });
    return x;
  };
  place(root, 0);
  return out;
}

const textW = (s: string) => Math.max(26, s.length * 7.6 + 12);

/** Draw the placed tree. Nodes not in `shown` are left out; `hi` is ringed. */
export function drawTree(placed: Map<string, Placed>, shown?: Set<string>, hi?: string): ReactElement {
  const vis = (id: string) => !shown || shown.has(id);
  const edges: ReactElement[] = [];
  const nodes: ReactElement[] = [];
  for (const [id, p] of placed) {
    if (!vis(id)) continue;
    if (p.parent && vis(p.parent)) {
      const q = placed.get(p.parent)!;
      edges.push(<line key={'e' + id} x1={q.x} y1={q.y + 10} x2={p.x} y2={p.y - 10} stroke={tok('ink', 0.4)} strokeWidth={1.3} />);
    }
    const w = textW(p.node.label);
    const term = p.node.term;
    const ring = hi === id;
    nodes.push(
      <g key={'n' + id}>
        <Box x={p.x - w / 2} y={p.y - 10} w={w} h={20} r={term ? 3 : 10}
          fill={ring ? tok('brand', 0.3) : term ? tok('panel') : tok('brand', 0.1)}
          stroke={ring ? tok('brand') : term ? tok('ink', 0.45) : tok('brand', 0.7)}>
          <T x={p.x} y={p.y + 1} size={12} mono anchor="middle" weight={term ? 400 : 700}>{p.node.label}</T>
        </Box>
        {p.node.lex && <T x={p.x} y={p.y + 21} size={11} mono anchor="middle" fill={tok('muted')}>{p.node.lex}</T>}
      </g>,
    );
  }
  return <g>{edges}{nodes}</g>;
}

/** Ids of the nodes visible after expanding `done` (the root is always seen). */
export function shownAfter(root: PT, done: string[]): Set<string> {
  const s = new Set<string>([root.id]);
  const find = (n: PT, id: string): PT | undefined => (n.id === id ? n : n.kids?.map((k) => find(k, id)).find(Boolean));
  for (const id of done) find(root, id)?.kids?.forEach((k) => s.add(k.id));
  return s;
}

/** The sentential form after expanding `done`: the visible frontier. */
export function frontier(root: PT, done: string[]): PT[] {
  const open = new Set(done);
  const walk = (n: PT): PT[] => (open.has(n.id) && n.kids ? n.kids.flatMap(walk) : [n]);
  return walk(root);
}
