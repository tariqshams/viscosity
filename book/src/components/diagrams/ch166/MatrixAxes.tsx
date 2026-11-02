import { Box, Svg, T, tok } from '../../viz/svg';
import m from '../../../../../engine/ts/packages/bench/results/matrix-2026-10-31.json';

// Chapter 166: the axes of the three sections of the benchmark matrix, and
// how many cells each has. Every count is read from
// engine/ts/packages/bench/results/matrix-2026-10-31.json.
const e2e = m.e2e.rows.length;
const corpus = m.compileSpeed.programs;
const drip = m.drip.rows.length;

const SECTIONS = [
  { t: '(a) end to end', axes: [`${e2e} programs`, '2 engines (Node, Bun)', 'original or compiled'], cells: e2e * 2 * 2, c: 'brand' },
  { t: '(b) compile speed', axes: [`${corpus} corpus programs`, '2 compilers (TS, Rust)', 'CLI or in-process'], cells: corpus * 2 * 2, c: 'accent' },
  { t: '(c) Drip', axes: [`${drip} programs`, '3 implementations', '(copied, not re-run)'], cells: drip * 3, c: 'safe' },
];

export default function MatrixAxes() {
  return (
    <Svg w={400} h={246} title="The three sections of the benchmark matrix, each with its axes and its number of cells">
      {SECTIONS.map((s, i) => {
        const y = 6 + i * 76;
        return (
          <Box key={s.t} x={8} y={y} w={384} h={68} r={6} fill={tok(s.c, 0.08)} stroke={tok(s.c)}>
            <T x={20} y={y + 16} size={12} weight={700}>{s.t}</T>
            {s.axes.map((a, k) => (
              <T key={a} x={20} y={y + 34 + k * 14} size={11} fill={k === 2 && i === 2 ? tok('muted') : undefined}>{`${k === 0 ? '' : '× '}${a}`}</T>
            ))}
            <T x={380} y={y + 34} size={22} weight={700} anchor="end" mono>{String(s.cells)}</T>
            <T x={380} y={y + 54} size={11} anchor="end" fill={tok('muted')}>cells</T>
          </Box>
        );
      })}
      <T x={8} y={238} size={11} fill={tok('muted')}>One script, one machine, one evening: any two cells compare.</T>
    </Svg>
  );
}
