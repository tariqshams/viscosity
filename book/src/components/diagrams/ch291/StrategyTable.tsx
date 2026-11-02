import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 291: how many times the argument slow() runs under each
// evaluation strategy, when the function uses its argument zero times,
// once, or twice.
const COLS = ['unused', 'used once', 'used twice'];
const ROWS: { label: string; cells: number[]; c: string }[] = [
  { label: 'by value', cells: [1, 1, 1], c: 'f1' },
  { label: 'by name', cells: [0, 1, 2], c: 'f3' },
  { label: 'by need', cells: [0, 1, 1], c: 'safe' },
];

export default function StrategyTable() {
  const x0 = 104;
  const cw = 96;
  return (
    <Svg w={400} h={170} title="A table of how many times the argument is evaluated: by value always once; by name once per use (0, 1, 2); by need at most once (0, 1, 1)">
      <T x={x0 + (cw * 3) / 2} y={12} size={11} weight={700} anchor="middle" fill={tok('muted')}>HOW OFTEN DOES slow() RUN?</T>
      {COLS.map((c, j) => (
        <T key={c} x={x0 + j * cw + cw / 2} y={34} size={12} anchor="middle" weight={700}>{c}</T>
      ))}
      {ROWS.map((r, i) => {
        const y = 48 + i * 36;
        return (
          <g key={r.label}>
            <T x={8} y={y + 15} size={12} mono weight={700} fill={tok(r.c)}>{r.label}</T>
            {r.cells.map((n, j) => (
              <Box key={j} x={x0 + j * cw + 4} y={y} w={cw - 8} h={30} fill={tok(r.c, 0.12)} stroke={tok(r.c)}>
                <T x={x0 + j * cw + cw / 2} y={y + 15} size={14} mono anchor="middle">{n}</T>
              </Box>
            ))}
          </g>
        );
      })}
      <T x={8} y={162} size={11} fill={tok('muted')}>By need does the least work in every column.</T>
    </Svg>
  );
}
