// Chapter 237: the same tree covered by two tile sets. Left: base RV64IM
// (three tiles). Right: with the Zba extension, sh3add swallows the shift
// and the add (two tiles). Both are real clang -O2 output.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type Node = { id: string; label: string; x: number; y: number };
const BASE: Node[] = [
  { id: 'ld', label: 'LOAD', x: 98, y: 34 },
  { id: 'add1', label: 'ADD', x: 98, y: 76 },
  { id: 'add2', label: 'ADD', x: 62, y: 118 },
  { id: 'k8', label: '8', x: 150, y: 118 },
  { id: 'a0', label: 'a0', x: 28, y: 160 },
  { id: 'shl', label: 'SHL', x: 98, y: 160 },
  { id: 'a1', label: 'a1', x: 74, y: 202 },
  { id: 'k3', label: '3', x: 124, y: 202 },
];
const EDGES: [string, string][] = [
  ['ld', 'add1'], ['add1', 'add2'], ['add1', 'k8'], ['add2', 'a0'],
  ['add2', 'shl'], ['shl', 'a1'], ['shl', 'k3'],
];
const LEFT: Record<string, string> = { ld: 'brand', add1: 'brand', k8: 'brand', add2: 'accent', shl: 'safe', k3: 'safe' };
const RIGHT: Record<string, string> = { ld: 'brand', add1: 'brand', k8: 'brand', add2: 'f3', shl: 'f3', k3: 'f3' };

function Tree({ dx, colours }: { dx: number; colours: Record<string, string> }) {
  const at = (id: string) => BASE.find((n) => n.id === id)!;
  return (
    <g transform={`translate(${dx},0)`}>
      {EDGES.map(([a, b]) => {
        const p = at(a); const q = at(b);
        return <Arrow key={a + b} x1={p.x} y1={p.y + 10} x2={q.x} y2={q.y - 10} color={tok('ink', 0.45)} width={1.5} />;
      })}
      {BASE.map((n) => {
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

export default function TwoTilings() {
  return (
    <Svg w={400} h={290} title="Two tilings of the tree for a[i+1]: three tiles on base RV64IM, two with Zba's sh3add.">
      <T x={98} y={10} size={11} weight={700} anchor="middle" fill={tok('muted')}>RV64IM</T>
      <T x={298} y={10} size={11} weight={700} anchor="middle" fill={tok('muted')}>RV64IM + Zba</T>
      <Tree dx={0} colours={LEFT} />
      <Tree dx={200} colours={RIGHT} />
      <T x={8} y={234} size={12} mono fill={tok('safe')}>slli a1, a1, 3</T>
      <T x={8} y={252} size={12} mono fill={tok('accent')}>add  a0, a0, a1</T>
      <T x={8} y={270} size={12} mono fill={tok('brand')}>ld   a0, 8(a0)</T>
      <T x={208} y={234} size={12} mono fill={tok('f3')}>sh3add a0, a1, a0</T>
      <T x={208} y={252} size={12} mono fill={tok('brand')}>ld     a0, 8(a0)</T>
    </Svg>
  );
}
