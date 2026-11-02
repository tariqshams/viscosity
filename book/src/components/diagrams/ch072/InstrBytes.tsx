// Chapter 72: three real Drip instructions and their bytes, one for each
// operand size: none (add), one byte (load.local's slot) and two bytes
// (const's constant number, high byte first). Opcode numbers are from
// companion/ts/src/vm/chunk.ts: Add 20, LoadLocal 8, Const 0.
import { Box, Svg, T, tok } from '../../viz/svg';

type Cell = { v: number; label: string; op?: boolean };
const ROWS: { text: string; cells: Cell[]; note?: string }[] = [
  { text: 'add', cells: [{ v: 20, label: 'opcode', op: true }], note: 'no operand' },
  { text: 'load.local 1', cells: [{ v: 8, label: 'opcode', op: true }, { v: 1, label: 'slot' }], note: 'one-byte operand' },
  { text: 'const 300', cells: [{ v: 0, label: 'opcode', op: true }, { v: 1, label: 'high' }, { v: 44, label: 'low' }], note: '1 × 256 + 44 = 300' },
];

const X0 = 116;
const CW = 46;

export default function InstrBytes() {
  return (
    <Svg w={400} h={218} title="Three Drip instructions as bytes. add is the single byte 20. load.local 1 is two bytes, the opcode 8 and the slot 1. const 300 is three bytes: the opcode 0, then 1 and 44, because 1 times 256 plus 44 is 300.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>INSTRUCTION</T>
      <T x={X0} y={12} size={11} weight={700} fill={tok('muted')}>BYTES IN THE CODE ARRAY</T>
      {ROWS.map((r, i) => {
        const y = 30 + i * 64;
        return (
          <g key={r.text}>
            <T x={8} y={y + 15} size={13} mono weight={700}>{r.text}</T>
            {r.cells.map((c, k) => (
              <g key={k}>
                <Box x={X0 + k * (CW + 4)} y={y} w={CW} h={30} r={4}
                  fill={c.op ? tok('brand', 0.18) : tok('accent', 0.12)} stroke={c.op ? tok('brand') : tok('accent')} />
                <T x={X0 + k * (CW + 4) + CW / 2} y={y + 15} size={14} mono anchor="middle" weight={c.op ? 700 : 400}>{c.v}</T>
                <T x={X0 + k * (CW + 4) + CW / 2} y={y + 42} size={11} anchor="middle" fill={tok('muted')}>{c.label}</T>
              </g>
            ))}
            {r.note && <T x={X0 + r.cells.length * (CW + 4) + 6} y={y + 15} size={11} fill={tok('muted')}>{r.note}</T>}
          </g>
        );
      })}
    </Svg>
  );
}
