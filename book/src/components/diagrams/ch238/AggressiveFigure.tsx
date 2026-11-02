// Chapter 238: aggressive coalescing can hurt. With k = 2, the graph on
// the left colours; merging the copy pair a, b makes a triangle.
import { Svg, T, tok } from '../../viz/svg';

type N = { id: string; x: number; y: number; r?: string };
function G({ nodes, edges, copy }: { nodes: N[]; edges: [string, string][]; copy?: [string, string] }) {
  const at = (id: string) => nodes.find((n) => n.id === id)!;
  return (
    <g>
      {copy && <line x1={at(copy[0]).x} y1={at(copy[0]).y} x2={at(copy[1]).x} y2={at(copy[1]).y} stroke={tok('safe')} strokeWidth={2} strokeDasharray="5 4" />}
      {edges.map(([p, q]) => <line key={p + q} x1={at(p).x} y1={at(p).y} x2={at(q).x} y2={at(q).y} stroke={tok('ink', 0.55)} strokeWidth={1.5} />)}
      {nodes.map((n) => (
        <g key={n.id}>
          <circle cx={n.x} cy={n.y} r={17} fill={n.r === 'r1' ? tok('f1', 0.35) : n.r === 'r2' ? tok('f2', 0.35) : tok('panel')} stroke={n.r === '?' ? tok('danger') : tok('ink', 0.6)} strokeWidth={1.5} />
          <T x={n.x} y={n.y + 1} size={12.5} mono anchor="middle" weight={700}>{n.id}</T>
          {n.r && <T x={n.x + 20} y={n.y - 16} size={11.5} mono weight={700} fill={n.r === '?' ? tok('danger') : undefined}>{n.r}</T>}
        </g>
      ))}
    </g>
  );
}

export default function AggressiveFigure() {
  return (
    <Svg w={400} h={214} title="Before merging, two registers suffice; after merging a and b, the three nodes form a triangle.">
      <T x={95} y={12} size={11} weight={700} anchor="middle" fill={tok('muted')}>k = 2: COLOURS</T>
      <T x={300} y={12} size={11} weight={700} anchor="middle" fill={tok('muted')}>a, b MERGED: NEEDS 3</T>
      <G nodes={[{ id: 'a', x: 40, y: 50, r: 'r2' }, { id: 'b', x: 150, y: 50, r: 'r1' }, { id: 'x', x: 40, y: 150, r: 'r1' }, { id: 'y', x: 150, y: 150, r: 'r2' }]} edges={[['a', 'x'], ['b', 'y'], ['x', 'y']]} copy={['a', 'b']} />
      <G nodes={[{ id: 'ab', x: 300, y: 50, r: '?' }, { id: 'x', x: 245, y: 150, r: 'r1' }, { id: 'y', x: 355, y: 150, r: 'r2' }]} edges={[['ab', 'x'], ['ab', 'y'], ['x', 'y']]} />
      <T x={8} y={190} size={12} fill={tok('muted')}>Briggs: ab would have 2 neighbours of degree ≥ 2,</T>
      <T x={8} y={206} size={12} fill={tok('muted')}>which is not fewer than k = 2. Keep the copy.</T>
    </Svg>
  );
}
