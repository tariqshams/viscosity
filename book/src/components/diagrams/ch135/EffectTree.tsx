// Effects flow up the tree like types: a piece of code may do whatever
// any of its parts may do.
import { Box, Svg, T, tok } from '../../viz/svg';

type N = { x: number; y: number; w: number; t: string; eff: string; hot?: boolean };
const NODES: N[] = [
  { x: 200, y: 24, w: 260, t: 'fn (x) { print(x); return x + 1; }', eff: 'number →{io} number', hot: true },
  { x: 200, y: 90, w: 200, t: 'print(x); return x + 1;', eff: '! {io} ∪ { } = {io}' },
  { x: 100, y: 156, w: 140, t: 'print(x)', eff: '! {io}', hot: true },
  { x: 300, y: 156, w: 140, t: 'x + 1', eff: '! { }' },
];
const EDGES: [number, number][] = [[0, 1], [1, 2], [1, 3]];

export default function EffectTree() {
  return (
    <Svg w={400} h={196} title="A function whose body prints x and returns x + 1. The print has the effect io, the addition has no effect, the body has their union, io, and the function's type records it: number to number with effect io.">
      {EDGES.map(([a, b], k) => (
        <line key={k} x1={NODES[a].x} y1={NODES[a].y + 20} x2={NODES[b].x} y2={NODES[b].y - 20} stroke={tok('line')} strokeWidth={1.5} />
      ))}
      {NODES.map((n, k) => (
        <Box key={k} x={n.x - n.w / 2} y={n.y - 20} w={n.w} h={40} stroke={n.hot ? tok('accent') : tok('line')}>
          <T x={n.x} y={n.y - 8} size={11} mono anchor="middle">{n.t.replace(/ /g, ' ')}</T>
          <T x={n.x} y={n.y + 9} size={12} mono anchor="middle" weight={700} fill={n.hot ? tok('accent') : tok('brand')}>{n.eff}</T>
        </Box>
      ))}
      <T x={200} y={190} size={11} anchor="middle" fill={tok('muted')}>effects of the parts are joined (∪) on the way up</T>
    </Svg>
  );
}
