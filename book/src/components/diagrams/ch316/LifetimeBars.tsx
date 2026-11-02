import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 316: how long r's loan lasts, under the old lexical rule
// (to the end of r's block) and under non-lexical lifetimes (to the
// last use of r). Only the lexical bar overlaps the &mut on line 4.
const LINES = ['let v = new', 'let r = &v', 'use r', 'let m = &mut v', 'use m', '} (end of block)'];

export default function LifetimeBars() {
  const y0 = 30;
  const rh = 24;
  const bar = (x: number, from: number, to: number, c: string, label: string) => (
    <g>
      <Box x={x} y={y0 + from * rh + 3} w={26} h={(to - from + 1) * rh - 6} fill={tok(c, 0.18)} stroke={tok(c)} r={4} />
      <T x={x + 13} y={y0 + LINES.length * rh + 10} size={11} anchor="middle" fill={tok(c)}>{label}</T>
    </g>
  );
  return (
    <Svg w={400} h={200} title="A six-line program with three bars: the lexical loan of r runs from line 2 to the end of the block and overlaps the mutable borrow on line 4; the non-lexical loan of r stops at line 3; m's loan covers lines 4 and 5">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>HOW LONG DOES r BORROW v?</T>
      {LINES.map((l, i) => (
        <g key={i}>
          <T x={8} y={y0 + i * rh + rh / 2} size={11} mono fill={tok('muted')}>{i + 1}</T>
          <T x={24} y={y0 + i * rh + rh / 2} size={12} mono>{l}</T>
        </g>
      ))}
      <Box x={6} y={y0 + 3 * rh + 2} w={176} h={rh - 4} fill="transparent" stroke={tok('danger')} dash />
      {bar(214, 1, 5, 'danger', 'lexical')}
      {bar(274, 1, 2, 'safe', 'NLL r')}
      {bar(334, 3, 4, 'f2', 'm')}
      <T x={8} y={192} size={11} fill={tok('muted')}>Lexical: r's loan overlaps &amp;mut v. NLL: it ends at line 3.</T>
    </Svg>
  );
}
