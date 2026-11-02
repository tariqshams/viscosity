// Chapter 241: the interference graph of sumsq after leaving SSA. Solid lines
// are interference edges; dashed lines join the two sides of a copy, which do
// not interfere (the next chapters try to merge them).
import { Svg, T, tok } from '../../viz/svg';

export const POS: Record<string, [number, number]> = {
  n: [200, 128], s0: [62, 40], i0: [62, 128], s1: [200, 30], i1: [338, 128],
  t: [290, 52], s2: [290, 214], i2: [110, 214],
};
export const EDGES = 'i0-n i0-s0 i0-s1 i1-n i1-s1 i1-s2 i1-t i2-n i2-s1 i2-s2 n-s0 n-s1 n-s2 n-t s1-t'.split(' ').map((e) => e.split('-'));
export const COPIES = [['s0', 's1'], ['i0', 'i1'], ['s1', 's2'], ['i1', 'i2']];

export default function InterferenceFigure() {
  return (
    <Svg w={400} h={246} title="The interference graph of sumsq: eight values, fifteen edges, and four copy pairs drawn dashed.">
      {COPIES.map(([a, b]) => {
        const [x1, y1] = POS[a]; const [x2, y2] = POS[b];
        return <line key={a + b} x1={x1} y1={y1} x2={x2} y2={y2} stroke={tok('safe')} strokeWidth={2} strokeDasharray="5 4" />;
      })}
      {EDGES.map(([a, b]) => {
        const [x1, y1] = POS[a]; const [x2, y2] = POS[b];
        return <line key={a + b} x1={x1} y1={y1} x2={x2} y2={y2} stroke={tok('ink', 0.55)} strokeWidth={1.5} />;
      })}
      {Object.entries(POS).map(([v, [x, y]]) => (
        <g key={v}>
          <circle cx={x} cy={y} r={17} fill={v === 'n' ? tok('brand', 0.2) : tok('panel')} stroke={v === 'n' ? tok('brand') : tok('ink', 0.6)} strokeWidth={1.5} />
          <T x={x} y={y + 1} size={13} mono anchor="middle" weight={700}>{v}</T>
        </g>
      ))}
      <T x={396} y={240} size={11} anchor="end" fill={tok('muted')}>dashed: a copy, no edge</T>
    </Svg>
  );
}
