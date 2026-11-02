// Chapter 234-b: sumsq's live intervals over its numbered instructions. The
// loop (lines 4 to 8) is shaded: anything used inside it is stretched to its
// end, because the jump back makes it live there too.
import { Box, Svg, T, tok } from '../../viz/svg';

const LINES = ['mv n, a0', 'li s, 0', 'li i, 0', 'bge i, n, done', 'mul t, i, i', 'add s, s, t', 'addi i, i, 1', 'j loop', 'mv a0, s', 'ret'];
const IV = [
  { v: 'n', start: 1, end: 8, f: 'f1' },
  { v: 's', start: 2, end: 9, f: 'f2' },
  { v: 'i', start: 3, end: 8, f: 'f3' },
  { v: 't', start: 5, end: 6, f: 'f4' },
];
const Y0 = 22; const H = 19;
const X0 = 150; const W = 50;

export default function IntervalsFigure() {
  return (
    <Svg w={400} h={226} title="Live intervals of n, s, i and t over the ten instructions of sumsq, with the loop shaded.">
      <rect x={4} y={Y0 + 3 * H - 2} width={392} height={5 * H} fill={tok('warn', 0.12)} />
      <T x={392} y={Y0 + 3 * H + 8} size={11} anchor="end" fill={tok('muted')}>loop</T>
      {LINES.map((l, k) => (
        <g key={k}>
          <T x={8} y={Y0 + k * H + 8} size={11} mono fill={tok('muted')}>{String(k + 1).padStart(2, ' ')}</T>
          <T x={28} y={Y0 + k * H + 8} size={11.5} mono>{l}</T>
        </g>
      ))}
      {IV.map((iv, j) => (
        <g key={iv.v}>
          <T x={X0 + j * W + 18} y={12} size={12} mono weight={700} anchor="middle">{iv.v}</T>
          <Box x={X0 + j * W + 8} y={Y0 + (iv.start - 1) * H} w={20} h={(iv.end - iv.start + 1) * H - 2} fill={tok(iv.f, 0.4)} stroke={tok(iv.f)} r={4} />
          <T x={X0 + j * W + 32} y={Y0 + (iv.start - 1) * H + 8} size={11} mono fill={tok('muted')}>{`[${iv.start},${iv.end}]`}</T>
        </g>
      ))}
    </Svg>
  );
}
