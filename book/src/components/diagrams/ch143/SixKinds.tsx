import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// The six common elements kinds as a grid, from the V8 blog post
// "Elements kinds in V8" (2017): down means a more general base kind,
// right means holey; transitions only go down or right. Each example is
// what %DebugPrint reported for it in Node v22.23.4 (V8 12.4).
const BASES = ['SMI', 'DOUBLE', ''];
const EX = [
  ['[1, 2, 3]', '[0, , 2]'],
  ['[1.5, 2]', '[1.5, , 2]'],
  ["['a', 1]", 'y = []; y[3] = "x"'],
];

export default function SixKinds() {
  return (
    <Svg w={400} h={232} title="A grid of six kinds: three rows (SMI, DOUBLE, ELEMENTS) and two columns (PACKED, HOLEY), with an example array in each cell. Arrows point down and to the right only.">
      <T x={102} y={12} size={11} weight={700} anchor="middle" fill={tok('muted')}>PACKED</T>
      <T x={298} y={12} size={11} weight={700} anchor="middle" fill={tok('muted')}>HOLEY</T>
      {BASES.map((b, i) => (
        [0, 1].map((h) => {
          const x = 8 + h * 196;
          const y = 22 + i * 70;
          return (
            <Box key={`${i}${h}`} x={x} y={y} w={188} h={48} fill={tok(h ? 'warn' : 'brand', 0.06 + i * 0.04)} stroke={tok(h ? 'warn' : 'brand')}>
              <T x={x + 8} y={y + 15} size={11} mono weight={700}>{(h ? 'HOLEY_' : 'PACKED_') + (b ? b + '_' : '') + 'ELEMENTS'}</T>
              <T x={x + 8} y={y + 35} size={12} mono fill={tok('muted')}>{EX[i][h]}</T>
            </Box>
          );
        })
      ))}
      {[0, 1].map((i) => [0, 1].map((h) => (
        <Arrow key={`d${i}${h}`} x1={102 + h * 196} y1={72 + i * 70} x2={102 + h * 196} y2={90 + i * 70} color={tok('muted')} />
      )))}
      {[0, 1, 2].map((i) => (
        <Arrow key={`r${i}`} x1={197} y1={46 + i * 70} x2={203} y2={46 + i * 70} color={tok('warn')} />
      ))}
      <T x={8} y={228} size={11} fill={tok('muted')}>arrows go down (more general) or right (holey), never back</T>
    </Svg>
  );
}
