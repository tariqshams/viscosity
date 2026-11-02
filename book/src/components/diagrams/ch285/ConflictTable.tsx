import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 285: the whole rule of the borrow checker as one table. A row
// is what the ledger already says about a name; a column is what the
// current line wants to do to it.
const COLS = ['read', '&mut', 'move', 'assign'];
const ROWS: { label: string; cells: string[] }[] = [
  { label: 'nothing', cells: ['ok', 'ok', 'ok', 'ok'] },
  { label: '& loan', cells: ['ok', 'E0502', 'E0505', 'E0506'] },
  { label: '&mut loan', cells: ['E0502', 'E0499', 'E0505', 'E0506'] },
  { label: 'moved', cells: ['E0382', 'E0382', 'E0382', 'ok'] },
];

export default function ConflictTable() {
  const x0 = 96;
  const cw = 74;
  return (
    <Svg w={400} h={200} title="A table: rows are what is already true of a name (nothing, a shared loan, a mutable loan, moved); columns are the action (read, mutable borrow, move, assign); each cell is ok or a rustc error code">
      <T x={x0 + (cw * 4) / 2} y={12} size={11} weight={700} anchor="middle" fill={tok('muted')}>THIS LINE WANTS TO...</T>
      {COLS.map((c, j) => (
        <T key={c} x={x0 + j * cw + cw / 2} y={32} size={12} mono weight={700} anchor="middle">{c}</T>
      ))}
      <T x={8} y={32} size={11} weight={700} fill={tok('muted')}>LEDGER SAYS</T>
      {ROWS.map((r, i) => {
        const y = 44 + i * 36;
        return (
          <g key={r.label}>
            <T x={8} y={y + 15} size={12} mono>{r.label}</T>
            {r.cells.map((c, j) => {
              const ok = c === 'ok';
              return (
                <Box key={j} x={x0 + j * cw + 3} y={y} w={cw - 6} h={30} fill={ok ? tok('safe', 0.12) : tok('danger', 0.12)} stroke={ok ? tok('safe') : tok('danger')}>
                  <T x={x0 + j * cw + cw / 2} y={y + 15} size={12} mono anchor="middle">{c}</T>
                </Box>
              );
            })}
          </g>
        );
      })}
      <T x={8} y={192} size={11} fill={tok('muted')}>Only read beside a shared loan is allowed to overlap.</T>
    </Svg>
  );
}
