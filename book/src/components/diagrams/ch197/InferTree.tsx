// The syntax tree of λf. λx. f (f x), every node labelled with the type
// W gives it once the substitution is applied.
import { Box, Svg, T, tok } from '../../viz/svg';

type N = { x: number; y: number; w: number; label: string; type: string };
const NODES: N[] = [
  { x: 200, y: 22, w: 200, label: 'λf', type: '(a → a) → a → a' },
  { x: 200, y: 74, w: 150, label: 'λx', type: 'a → a' },
  { x: 200, y: 126, w: 110, label: 'apply', type: 'a' },
  { x: 90, y: 178, w: 110, label: 'f', type: 'a → a' },
  { x: 300, y: 178, w: 110, label: 'apply', type: 'a' },
  { x: 230, y: 230, w: 100, label: 'f', type: 'a → a' },
  { x: 350, y: 230, w: 80, label: 'x', type: 'a' },
];
const EDGES: [number, number][] = [[0, 1], [1, 2], [2, 3], [2, 4], [4, 5], [4, 6]];

export default function InferTree() {
  return (
    <Svg w={400} h={256} title="A tree: lambda f at the root, then lambda x, then an application of f to another application, which applies f to x. Each node shows its type: the root (a to a) to a to a, lambda x a to a, both applications a, both uses of f a to a, and x a.">
      {EDGES.map(([a, b], k) => (
        <line key={k} x1={NODES[a].x} y1={NODES[a].y + 16} x2={NODES[b].x} y2={NODES[b].y - 16} stroke={tok('line')} strokeWidth={1.5} />
      ))}
      {NODES.map((n, k) => (
        <Box key={k} x={n.x - n.w / 2} y={n.y - 16} w={n.w} h={32} fill={tok('panel')} stroke={k === 0 ? tok('brand') : tok('line')}>
          <T x={n.x} y={n.y - 6} size={11} anchor="middle" weight={700} fill={tok('muted')}>{n.label}</T>
          <T x={n.x} y={n.y + 8} size={12} mono anchor="middle" fill={k === 0 ? tok('brand') : tok('ink')}>{n.type}</T>
        </Box>
      ))}
    </Svg>
  );
}
