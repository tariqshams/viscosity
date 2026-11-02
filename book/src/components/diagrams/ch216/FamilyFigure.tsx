// Chapter 215-b: one basic induction variable and three members of its
// family, with the fixed step of each row marked.
import { Box, Svg, T, tok } from '../../viz/svg';

const ROWS = [
  { label: 'i', c: 1, d: 0, col: 'brand' },
  { label: '2·i + 1', c: 2, d: 1, col: 'accent' },
  { label: '8·i + 16', c: 8, d: 16, col: 'accent' },
  { label: '3·i + 5', c: 3, d: 5, col: 'accent' },
];

export default function FamilyFigure() {
  return (
    <Svg w={400} h={200} title="A table of i and three family members on trips 0 to 4, each with its fixed step">
      <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>TRIP</T>
      {[0, 1, 2, 3, 4].map((k) => (
        <T key={k} x={128 + k * 50} y={14} size={12} mono weight={700} anchor="middle" fill={tok('muted')}>{k}</T>
      ))}
      <T x={392} y={14} size={11} weight={700} anchor="end" fill={tok('muted')}>STEP</T>
      {ROWS.map((r, ri) => {
        const y = 44 + ri * 40;
        return (
          <g key={r.label}>
            <T x={8} y={y} size={12} mono weight={700}>{r.label}</T>
            {[0, 1, 2, 3, 4].map((k) => (
              <Box key={k} x={128 + k * 50 - 20} y={y - 13} w={40} h={26} r={5} fill={tok(r.col, 0.12)} stroke={tok(r.col)}>
                <T x={128 + k * 50} y={y} size={13} mono anchor="middle">{String(r.c * k + r.d)}</T>
              </Box>
            ))}
            <T x={392} y={y} size={13} mono weight={700} anchor="end" fill={tok(r.col)}>+{r.c}</T>
          </g>
        );
      })}
    </Svg>
  );
}
