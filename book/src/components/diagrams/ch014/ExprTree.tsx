import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type N = { x: number; y: number; kind: string; extra?: string };

const NODES: N[] = [
  { x: 150, y: 14, kind: 'mul' },
  { x: 50, y: 92, kind: 'add' },
  { x: 250, y: 92, kind: 'num', extra: 'value: 4' },
  { x: 4, y: 170, kind: 'num', extra: 'value: 1' },
  { x: 132, y: 170, kind: 'num', extra: 'value: 2' },
];
const EDGES: [number, number, string][] = [[0, 1, 'left'], [0, 2, 'right'], [1, 3, 'left'], [1, 4, 'right']];
const W = 112;
const H = 48;

/** (1 + 2) * 4 as a tree of tagged objects. */
export default function ExprTree() {
  return (
    <Svg w={400} h={226} title="The expression (1 + 2) * 4 as a tree. The top node has kind mul. Its left child has kind add, whose children are num nodes with values 1 and 2. Its right child is a num node with value 4.">
      {EDGES.map(([a, b, label]) => {
        const p = NODES[a];
        const c = NODES[b];
        return (
          <g key={`${a}-${b}`}>
            <Arrow x1={p.x + W / 2} y1={p.y + H} x2={c.x + W / 2} y2={c.y - 2} width={1.5} />
            <T x={(p.x + c.x) / 2 + W / 2 + (c.x < p.x ? -26 : 26)} y={(p.y + H + c.y) / 2} size={11} mono anchor="middle" fill={tok('muted')}>{label}</T>
          </g>
        );
      })}
      {NODES.map((n, k) => {
        const leaf = n.kind === 'num';
        return (
          <Box key={k} x={n.x} y={n.y} w={W} h={H} r={8} fill={leaf ? tok('panel') : tok('brand', 0.12)} stroke={leaf ? tok('ink', 0.45) : tok('brand')}>
            <T x={n.x + 10} y={n.y + (n.extra ? 16 : 24)} size={13} mono>
              kind: <tspan fontWeight={700} fill={leaf ? tok('accent') : tok('brand')}>&apos;{n.kind}&apos;</tspan>
            </T>
            {n.extra && <T x={n.x + 10} y={n.y + 34} size={13} mono fill={tok('muted')}>{n.extra}</T>}
          </Box>
        );
      })}
    </Svg>
  );
}
