// Chapter 337-b: the borrowing rule as a table. Rows: a borrow that is
// still alive (it will be used again later). Columns: what the program
// tries to do next. Only reading alongside readers is allowed; every other
// overlap is a compile error, with the code rustc 1.97 reports.
import { Box, Svg, T, tok } from '../../viz/svg';

const COLS = ['read: &s', 'write: &mut s', 'move or assign'];
const ROWS: { label: string; cells: { ok: boolean; code: string }[] }[] = [
  { label: 'a live &s', cells: [{ ok: true, code: 'fine' }, { ok: false, code: 'E0502' }, { ok: false, code: 'E0505/E0506' }] },
  { label: 'a live &mut s', cells: [{ ok: false, code: 'E0502' }, { ok: false, code: 'E0499' }, { ok: false, code: 'E0505/E0506' }] },
];

export default function ConflictGrid() {
  const x0 = 116;
  const cw = 94;
  return (
    <Svg w={400} h={190} title="Which new access is allowed while a borrow is alive">
      <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>WHILE THERE IS…</T>
      <T x={x0 + (cw * 3) / 2} y={14} size={11} weight={700} anchor="middle" fill={tok('muted')}>…THE PROGRAM TRIES</T>
      {COLS.map((c, k) => (
        <T key={c} x={x0 + k * cw + cw / 2} y={34} size={11} mono anchor="middle">{c}</T>
      ))}
      {ROWS.map((r, i) => {
        const y = 46 + i * 52;
        return (
          <g key={r.label}>
            <T x={8} y={y + 22} size={12} mono weight={700}>{r.label}</T>
            {r.cells.map((c, k) => (
              <Box key={k} x={x0 + k * cw + 3} y={y} w={cw - 6} h={44} fill={c.ok ? tok('safe', 0.15) : tok('danger', 0.1)} stroke={c.ok ? tok('safe') : tok('danger')}>
                <T x={x0 + k * cw + cw / 2} y={y + 16} size={15} weight={700} anchor="middle" fill={c.ok ? tok('safe') : tok('danger')}>{c.ok ? '✓' : '✕'}</T>
                <T x={x0 + k * cw + cw / 2} y={y + 34} size={11} mono anchor="middle">{c.code}</T>
              </Box>
            ))}
          </g>
        );
      })}
      <T x={8} y={164} size={11} fill={tok('muted')}>Once a borrow has been used for the last time it is</T>
      <T x={8} y={180} size={11} fill={tok('muted')}>no longer live, and every cell becomes fine.</T>
    </Svg>
  );
}
