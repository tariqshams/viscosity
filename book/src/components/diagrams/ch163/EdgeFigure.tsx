import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 163: why AFL counts edges rather than blocks
// (google/AFL docs/technical_details.txt, section 1: edge tuples tell
// A -> B -> C -> D apart from A -> C -> B -> D). Two runs visit the same
// four blocks; their edges differ, so the second run is "new" to an edge
// counter and "old" to a block counter.
const NODES = ['A', 'B', 'C', 'D'];
const RUNS: { y: number; order: string[]; label: string }[] = [
  { y: 46, order: ['A', 'B', 'C', 'D'], label: 'run 1' },
  { y: 150, order: ['A', 'C', 'B', 'D'], label: 'run 2' },
];

export default function EdgeFigure() {
  const x = (k: number) => 70 + k * 84;
  const grey = tok('ink', 0.55);
  return (
    <Svg w={400} h={262} title="Two runs that visit the same blocks along different edges">
      {RUNS.map((r, ri) => (
        <g key={r.label}>
          <T x={8} y={r.y + 14} size={12} weight={700} fill={tok('muted')}>{r.label}</T>
          {r.order.map((n, k) => (
            <Box key={n} x={x(k)} y={r.y} w={40} h={28} r={14}
              fill={ri === 1 && (n === 'B' || n === 'C') ? tok('brand', 0.15) : tok('panel')}
              stroke={ri === 1 && (n === 'B' || n === 'C') ? tok('brand') : tok('line')}>
              <T x={x(k) + 20} y={r.y + 14} size={13} mono anchor="middle">{n}</T>
            </Box>
          ))}
          {[0, 1, 2].map((k) => (
            <Arrow key={k} x1={x(k) + 40} y1={r.y + 14} x2={x(k + 1) - 2} y2={r.y + 14} color={ri === 1 ? tok('brand') : grey} width={1.5} />
          ))}
          <T x={70} y={r.y + 48} size={12} mono fill={ri === 1 ? tok('brand') : undefined}>
            {r.order.slice(0, 3).map((n, k) => `${n}→${r.order[k + 1]}`).join('  ')}
          </T>
        </g>
      ))}
      <T x={200} y={226} size={12} anchor="middle" fill={tok('muted')}>blocks visited: {NODES.join(', ')} in both runs</T>
      <T x={200} y={246} size={12} anchor="middle" fill={tok('muted')}>edges: run 2 adds A→C, C→B and B→D</T>
    </Svg>
  );
}
