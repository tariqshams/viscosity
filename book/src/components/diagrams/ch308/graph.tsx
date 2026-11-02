import { Arrow, Box, T, tok } from '../../viz/svg';

// The module graph shared by chapter 308's diagrams: main imports a and
// b, a imports c, b imports c and d. An arrow points from a module to a
// module it imports.
export const NODES: Record<string, [number, number]> = {
  main: [200, 22],
  a: [110, 92],
  b: [290, 92],
  c: [110, 162],
  d: [290, 162],
};
export const EDGES: [string, string][] = [
  ['main', 'a'], ['main', 'b'], ['a', 'c'], ['b', 'c'], ['b', 'd'],
];

export function Node({ id, fill, stroke, label }: { id: string; fill: string; stroke: string; label?: string }) {
  const [x, y] = NODES[id];
  return (
    <Box x={x - 32} y={y - 14} w={64} h={28} fill={fill} stroke={stroke}>
      <T x={x} y={y} size={12} mono anchor="middle">{label ?? id}</T>
    </Box>
  );
}

export function Edge({ from, to, hot, bend = 0 }: { from: string; to: string; hot?: boolean; bend?: number }) {
  const [x1, y1] = NODES[from];
  const [x2, y2] = NODES[to];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  // start and stop at the edge of the boxes (roughly)
  const k1 = Math.min(32 / Math.abs(dx || 1e-9), 14 / Math.abs(dy || 1e-9)) * len;
  const s = Math.min(k1, len / 2.5) / len;
  return (
    <Arrow x1={x1 + dx * s} y1={y1 + dy * s} x2={x2 - dx * s} y2={y2 - dy * s} bend={bend}
      color={hot ? tok('brand') : tok('ink', 0.55)} width={hot ? 2.5 : 1.5} />
  );
}
