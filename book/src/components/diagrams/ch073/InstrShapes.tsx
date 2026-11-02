// Chapter 73: the operand shapes of Drip's instructions, as listed in
// the comments of companion/ts/src/vm/chunk.ts (k, s, j) and decoded by
// disassembleInstruction in companion/ts/src/vm/debug.ts.
import { Box, Svg, T, tok } from '../../viz/svg';

type Cell = 'op' | 'k' | 's' | 'j' | 'u';
const ROWS: { name: string; cells: Cell[]; len: string; note: string }[] = [
  { name: 'add', cells: ['op'], len: '1', note: 'no operand' },
  { name: 'load.local', cells: ['op', 's'], len: '2', note: 'a slot or a count' },
  { name: 'const', cells: ['op', 'k', 'k'], len: '3', note: 'a constant number' },
  { name: 'jump.unless', cells: ['op', 'j', 'j'], len: '3', note: 'how far to jump' },
  { name: 'invoke', cells: ['op', 'k', 'k', 's'], len: '4', note: 'name, then count' },
  { name: 'closure', cells: ['op', 'k', 'k', 'u', 'u'], len: '3+', note: '2 more per capture' },
];

const FILL: Record<Cell, string> = { op: 'brand', k: 'accent', s: 'safe', j: 'f3', u: 'muted' };
const X0 = 104;
const CW = 24;

export default function InstrShapes() {
  return (
    <Svg w={400} h={252} title="Drip's operand shapes. add is one byte. load.local is the opcode and a one-byte slot. const is the opcode and a two-byte constant number. jump.unless is the opcode and a two-byte jump distance. invoke is the opcode, a two-byte constant and a one-byte count. closure is the opcode, a two-byte constant, then two more bytes for each captured variable.">
      <T x={8} y={10} size={11} weight={700} fill={tok('muted')}>OPCODE</T>
      <T x={X0} y={10} size={11} weight={700} fill={tok('muted')}>BYTES</T>
      <T x={252} y={10} size={11} weight={700} fill={tok('muted')}>THE OPERAND IS</T>
      {ROWS.map((r, i) => {
        const y = 24 + i * 36;
        return (
          <g key={r.name}>
            <T x={8} y={y + 12} size={12} mono weight={700}>{r.name}</T>
            {r.cells.map((c, k) => (
              <g key={k}>
                <Box x={X0 + k * (CW + 2)} y={y} w={CW} h={24} r={3}
                  fill={tok(FILL[c], c === 'op' ? 0.25 : 0.14)} stroke={tok(FILL[c])} dash={c === 'u'} />
                <T x={X0 + k * (CW + 2) + CW / 2} y={y + 12} size={11} mono anchor="middle">{c === 'u' ? '·' : c}</T>
              </g>
            ))}
            <T x={X0 + 5 * (CW + 2) + 4} y={y + 12} size={11} mono fill={tok('muted')}>{r.len}</T>
            <T x={252} y={y + 12} size={11} fill={tok('ink')}>{r.note}</T>
          </g>
        );
      })}
      <T x={8} y={242} size={11} fill={tok('muted')}>op: the opcode · k, j: two bytes, high first · s: one byte</T>
    </Svg>
  );
}
