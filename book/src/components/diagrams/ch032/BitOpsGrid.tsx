import { Box, Svg, T, tok } from '../../viz/svg';

const A = [1, 1, 0, 1]; // 13
const B = [0, 1, 1, 0]; // 6
const OPS: { op: string; f: (a: number, b: number) => number; word: string }[] = [
  { op: '&', f: (a, b) => a & b, word: 'both on' },
  { op: '|', f: (a, b) => a | b, word: 'either on' },
  { op: '^', f: (a, b) => a ^ b, word: 'exactly one on' },
];
const X0 = 96;
const CW = 34;

function Row({ y, bits, label, value, color }: { y: number; bits: number[]; label: string; value: number; color: string }) {
  return (
    <g>
      <T x={8} y={y + 14} size={13} mono weight={700}>{label}</T>
      {bits.map((b, k) => (
        <Box key={k} x={X0 + k * CW} y={y} w={CW - 4} h={28} fill={b ? tok(color, 0.2) : 'transparent'} stroke={b ? tok(color) : tok('line')}>
          <T x={X0 + k * CW + (CW - 4) / 2} y={y + 14.5} size={15} mono weight={700} anchor="middle" fill={b ? tok(color) : tok('muted')}>{b}</T>
        </Box>
      ))}
      <T x={X0 + 4 * CW + 10} y={y + 14} size={13} mono>= {value}</T>
    </g>
  );
}

/** 13 & 6, 13 | 6 and 13 ^ 6, worked column by column. */
export default function BitOpsGrid() {
  const val = (bits: number[]) => bits.reduce((n, b) => n * 2 + b, 0);
  return (
    <Svg w={400} h={222} title="13 is 1101 and 6 is 0110. Column by column: 13 and 6 is 0100, which is 4; 13 or 6 is 1111, which is 15; 13 xor 6 is 1011, which is 11.">
      {[8, 4, 2, 1].map((p, k) => (
        <T key={p} x={X0 + k * CW + (CW - 4) / 2} y={10} size={11} anchor="middle" fill={tok('muted')}>{p}</T>
      ))}
      <Row y={20} bits={A} label="13" value={13} color="accent" />
      <Row y={54} bits={B} label="6" value={6} color="ink" />
      <line x1={8} y1={90} x2={392} y2={90} stroke={tok('line')} />
      {OPS.map((o, k) => {
        const bits = A.map((a, j) => o.f(a, B[j]));
        const y = 98 + k * 40;
        return (
          <g key={o.op}>
            <Row y={y} bits={bits} label={`13 ${o.op} 6`} value={val(bits)} color="brand" />
            <T x={392} y={y + 14} size={11} anchor="end" fill={tok('muted')}>{o.word}</T>
          </g>
        );
      })}
    </Svg>
  );
}
