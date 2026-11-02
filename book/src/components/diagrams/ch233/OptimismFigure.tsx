// Chapter 233: a square of four values with k = 2. Every node has degree 2,
// so simplify is stuck at once; pushing a node anyway (Briggs's optimism)
// still finds a two-colouring.
import { Svg, T, tok } from '../../viz/svg';

const POS: Record<string, [number, number]> = { a: [60, 40], b: [160, 40], c: [160, 140], d: [60, 140] };
const EDGES = [['a', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'a']];

function Square({ dx, colours }: { dx: number; colours?: Record<string, number> }) {
  return (
    <g transform={`translate(${dx},0)`}>
      {EDGES.map(([p, q]) => <line key={p + q} x1={POS[p][0]} y1={POS[p][1]} x2={POS[q][0]} y2={POS[q][1]} stroke={tok('ink', 0.55)} strokeWidth={1.5} />)}
      {Object.entries(POS).map(([v, [x, y]]) => {
        const c = colours?.[v];
        return (
          <g key={v}>
            <circle cx={x} cy={y} r={17} fill={c === undefined ? tok('panel') : tok(c ? 'f2' : 'f1', 0.35)} stroke={c === undefined ? tok('ink', 0.6) : tok(c ? 'f2' : 'f1')} strokeWidth={c === undefined ? 1.5 : 2.5} />
            <T x={x} y={y + 1} size={13} mono anchor="middle" weight={700}>{v}</T>
            <T x={x + 22} y={y - 16} size={11.5} mono weight={700}>{c === undefined ? '2' : `r${c + 1}`}</T>
          </g>
        );
      })}
    </g>
  );
}

export default function OptimismFigure() {
  return (
    <Svg w={400} h={210} title="A four-node cycle with two registers: every degree is 2, yet a two-colouring exists.">
      <T x={110} y={12} size={11} weight={700} anchor="middle" fill={tok('muted')}>STUCK: EVERY DEGREE IS 2</T>
      <T x={300} y={12} size={11} weight={700} anchor="middle" fill={tok('muted')}>PUSHED ANYWAY: IT FITS</T>
      <Square dx={0} />
      <Square dx={190} colours={{ a: 0, b: 1, c: 0, d: 1 }} />
      <T x={8} y={190} size={12} fill={tok('muted')}>Chaitin spills a value here; Briggs pushes one and tries.</T>
    </Svg>
  );
}
