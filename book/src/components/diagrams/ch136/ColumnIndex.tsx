// Chapter 136: a hand-written struct of arrays. Each row is one Vec<f64>
// column; particle i is index i of every column. A push appends one value
// to every column, so the lengths stay equal (the invariant). Field
// colours are the book's permanent ones: x f1, y f2, vx f3, vy f4,
// mass f5, health f6. Values are illustrative.
import { Box, Svg, T, tok } from '../../viz/svg';

const COLS: { name: string; c: string; vals: string[] }[] = [
  { name: 'x', c: 'f1', vals: ['0.0', '1.0', '2.0', '3.0', '4.0'] },
  { name: 'y', c: 'f2', vals: ['5.0', '5.0', '5.0', '5.0', '5.0'] },
  { name: 'vx', c: 'f3', vals: ['1.0', '1.0', '0.5', '2.0', '1.0'] },
  { name: 'vy', c: 'f4', vals: ['0.0', '0.5', '0.5', '0.0', '1.0'] },
  { name: 'mass', c: 'f5', vals: ['1.0', '2.0', '1.0', '1.0', '3.0'] },
  { name: 'health', c: 'f6', vals: ['9', '7', '8', '9', '6'] },
];

export default function ColumnIndex() {
  const cw = 44;
  const x0 = 62;
  const rh = 26;
  const pick = 2;
  return (
    <Svg w={400} h={COLS.length * rh + 52} title="Six columns of five numbers each; index 2 is highlighted in every column as particle 2, and a pushed sixth value is drawn dashed at the end of every column">
      {Array.from({ length: 6 }, (_, i) => (
        <T key={i} x={x0 + i * cw + cw / 2} y={10} size={11} mono anchor="middle" fill={i === pick ? tok('brand') : tok('muted')}>{i}</T>
      ))}
      {COLS.map((col, r) => {
        const y = 20 + r * rh;
        return (
          <g key={col.name}>
            <T x={x0 - 6} y={y + 10} size={11} mono anchor="end" fill={tok('ink')}>{col.name}</T>
            {col.vals.map((v, i) => (
              <Box key={i} x={x0 + i * cw + 1} y={y} w={cw - 2} h={20} r={2}
                fill={tok(col.c, i === pick ? 0.45 : 0.16)} stroke={i === pick ? tok('brand') : tok(col.c)}>
                <T x={x0 + i * cw + cw / 2} y={y + 10} size={11} mono anchor="middle" fill={tok('ink')}>{v}</T>
              </Box>
            ))}
            <Box x={x0 + 5 * cw + 1} y={y} w={cw - 2} h={20} r={2} fill="transparent" stroke={tok(col.c)} dash>
              <T x={x0 + 5 * cw + cw / 2} y={y + 10} size={11} mono anchor="middle" fill={tok('muted')}>new</T>
            </Box>
          </g>
        );
      })}
      <rect x={x0 + pick * cw - 1} y={16} width={cw + 2} height={COLS.length * rh} rx={4} fill="none" stroke={tok('brand')} strokeWidth={2} />
      <T x={x0 + pick * cw + cw / 2} y={COLS.length * rh + 30} size={11} anchor="middle" fill={tok('brand')}>particle 2</T>
      <T x={x0 + 5 * cw + cw / 2} y={COLS.length * rh + 30} size={11} anchor="middle" fill={tok('muted')}>push</T>
      <T x={x0 + 5 * cw + cw / 2} y={COLS.length * rh + 44} size={11} anchor="middle" fill={tok('muted')}>writes all six</T>
    </Svg>
  );
}
