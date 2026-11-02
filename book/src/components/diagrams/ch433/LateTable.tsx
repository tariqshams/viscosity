import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 432b: when emit.rs (engine/rust/crates/frontend-js/src/emit.rs)
// stores a field write late, from its condition
//   write && ((op == "=" && !ok && a.rhs != RhsEffect::Inert)
//             || (typed && a.rhs == RhsEffect::Effects))
// for a plain `=` write. `ok` is "proven in bounds, or --bounds assume";
// `typed` is "a Float64Array column, or AoSoA's data". A compound write
// (`+=`, `||=`, ...) stores late only in the last column of the typed rows.
const COLS = ['Inert', 'MayThrow', 'Effects'];
type Cell = 'cheap' | 'check' | 'late';
const ROWS: { label: string; sub: string; cells: Cell[] }[] = [
  { label: 'proven, typed', sub: 'ps.x[i] = …', cells: ['cheap', 'cheap', 'late'] },
  { label: 'proven, plain', sub: 'ps.tag[i] = …', cells: ['cheap', 'cheap', 'cheap'] },
  { label: 'unproven, typed', sub: 'ps.x[bc(i)] = …', cells: ['check', 'late', 'late'] },
  { label: 'unproven, plain', sub: 'ps.tag[bc(i)] = …', cells: ['check', 'late', 'late'] },
];
const TEXT: Record<Cell, string> = { cheap: 'col[i] = v', check: '__vsc_bc', late: '__vsc_set' };

export default function LateTable() {
  const x0 = 150;
  const cw = 82;
  return (
    <Svg w={400} h={232} title="Which plain field writes the Rust emitter stores late, by bounds proof, column kind and what the right-hand side can do">
      <T x={6} y={14} size={11} weight={700} fill={tok('muted')}>the write ↓ / its right side →</T>
      {COLS.map((c, k) => (
        <T key={c} x={x0 + k * cw + cw / 2} y={36} size={11} mono anchor="middle" weight={700}>{c}</T>
      ))}
      {ROWS.map((r, j) => {
        const y = 50 + j * 44;
        return (
          <g key={r.label}>
            <T x={6} y={y + 14} size={11} weight={700}>{r.label}</T>
            <T x={6} y={y + 30} size={11} mono fill={tok('muted')}>{r.sub}</T>
            {r.cells.map((c, k) => (
              <Box key={k} x={x0 + k * cw + 2} y={y + 2} w={cw - 4} h={38} fill={c === 'late' ? tok('warn', 0.18) : c === 'check' ? tok('brand', 0.1) : tok('safe', 0.1)} stroke={c === 'late' ? tok('warn') : c === 'check' ? tok('brand') : tok('safe')}>
                <T x={x0 + k * cw + cw / 2} y={y + 21} size={11} mono anchor="middle">{TEXT[c]}</T>
              </Box>
            ))}
          </g>
        );
      })}
      <T x={6} y={228} size={11} fill={tok('muted')}>__vsc_set: check before the right side, store after it</T>
    </Svg>
  );
}
