// Chapter 233: the two covers of ADD(SHL(i, 3), 8) side by side, under the
// made-up costs of the chapter (sh3add = 3 cycles, the rest 1).
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type Node = { id: string; label: string; x: number; y: number };
const NODES: Node[] = [
  { id: 'add', label: 'ADD', x: 96, y: 40 },
  { id: 'shl', label: 'SHL', x: 54, y: 92 },
  { id: 'k8', label: '8', x: 146, y: 92 },
  { id: 'i', label: 'i', x: 28, y: 144 },
  { id: 'k3', label: '3', x: 84, y: 144 },
];
const EDGES: [string, string][] = [['add', 'shl'], ['add', 'k8'], ['shl', 'i'], ['shl', 'k3']];

function Tree({ dx, colours }: { dx: number; colours: Record<string, string> }) {
  const at = (id: string) => NODES.find((n) => n.id === id)!;
  return (
    <g transform={`translate(${dx},0)`}>
      {EDGES.map(([a, b]) => {
        const p = at(a); const q = at(b);
        return <Arrow key={a + b} x1={p.x} y1={p.y + 10} x2={q.x} y2={q.y - 10} color={tok('ink', 0.45)} width={1.5} />;
      })}
      {NODES.map((n) => {
        const c = colours[n.id];
        return (
          <Box key={n.id} x={n.x - 22} y={n.y - 10} w={44} h={20} fill={c ? tok(c, 0.22) : tok('panel')} stroke={c ? tok(c) : tok('line')}>
            <T x={n.x} y={n.y + 1} size={11.5} mono anchor="middle" weight={700}>{n.label}</T>
          </Box>
        );
      })}
    </g>
  );
}

export default function MunchVsBest() {
  return (
    <Svg w={400} h={236} title="Maximal munch's cover costs 4; the cheapest cover costs 2.">
      <T x={96} y={12} size={11} weight={700} anchor="middle" fill={tok('muted')}>MAXIMAL MUNCH</T>
      <T x={300} y={12} size={11} weight={700} anchor="middle" fill={tok('muted')}>CHEAPEST</T>
      <Tree dx={0} colours={{ add: 'danger', shl: 'danger', k3: 'danger', k8: 'accent' }} />
      <Tree dx={204} colours={{ add: 'brand', k8: 'brand', shl: 'safe', k3: 'safe' }} />
      <T x={8} y={182} size={12} mono fill={tok('accent')}>li     v1, 8      1</T>
      <T x={8} y={200} size={12} mono fill={tok('danger')}>sh3add v2, i, v1  3</T>
      <T x={8} y={222} size={12} weight={700}>total 4</T>
      <T x={212} y={182} size={12} mono fill={tok('safe')}>slli v1, i, 3   1</T>
      <T x={212} y={200} size={12} mono fill={tok('brand')}>addi v2, v1, 8  1</T>
      <T x={212} y={222} size={12} weight={700}>total 2</T>
    </Svg>
  );
}
