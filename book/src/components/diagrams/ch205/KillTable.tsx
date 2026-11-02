// Chapter 205: loads in local value numbering. A read of p.x enters the
// table; a later identical read finds it; a store to p.x removes the key,
// so the next read is a new value. Arithmetic keys are never removed.
import { Box, Svg, T, tok } from '../../viz/svg';

const ROWS = [
  { text: '%1 = field.get %0 .x', vn: 'VN 1 (new)', table: 'add (get, 0, x) → 1', c: 'ink' },
  { text: '%2 = binop * %1, %1', vn: 'VN 2 (new)', table: 'add (*, 1, 1) → 2', c: 'ink' },
  { text: '%4 = field.get %0 .x', vn: 'VN 1 (found)', table: 'no change', c: 'accent' },
  { text: 'field.set %0, %3 .x', vn: 'store', table: 'remove (get, 0, x)', c: 'danger' },
  { text: '%5 = field.get %0 .x', vn: 'VN 5 (new)', table: 'add (get, 0, x) → 5', c: 'ink' },
];

export default function KillTable() {
  const RH = 40;
  return (
    <Svg w={400} h={ROWS.length * RH + 30} title="Five instructions: two reads of p.x, a multiplication, a store to p.x and a third read, with each one's value number and the change it makes to the table.">
      <T x={8} y={10} size={11} weight={700} fill={tok('muted')}>INSTRUCTION</T>
      <T x={222} y={10} size={11} weight={700} fill={tok('muted')}>VN · TABLE CHANGE</T>
      {ROWS.map((r, k) => {
        const y = 22 + k * RH;
        const col = tok(r.c);
        return (
          <g key={k}>
            <Box x={6} y={y} w={206} h={RH - 8} fill={r.c === 'danger' ? tok('danger', 0.1) : r.c === 'accent' ? tok('accent', 0.1) : tok('panel')} stroke={r.c === 'ink' ? tok('line') : col}>
              <T x={14} y={y + (RH - 8) / 2} size={12} mono>{r.text}</T>
            </Box>
            <T x={222} y={y + 9} size={12} weight={700} fill={col}>{r.vn}</T>
            <T x={222} y={y + 25} size={11.5} mono fill={tok('muted')}>{r.table}</T>
          </g>
        );
      })}
    </Svg>
  );
}
