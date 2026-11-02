// One real line of LLVM IR from sumsq (after SROA, LLVM 18.1.3), taken
// apart: result name, opcode, flag, type, operands. Meanings from the LLVM
// Language Reference (local identifiers start with %, nsw = "No Signed
// Wrap", the type comes before the operands).
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const PARTS: { text: string; x: number; w: number; label: string[]; color: string }[] = [
  { text: '%add', x: 8, w: 44, label: ['result: a new', 'SSA value'], color: 'f1' },
  { text: 'add', x: 74, w: 36, label: ['opcode'], color: 'f2' },
  { text: 'nsw', x: 116, w: 36, label: ['flag: no', 'signed wrap'], color: 'f3' },
  { text: 'i64', x: 158, w: 36, label: ['type: 64-bit', 'integer'], color: 'f4' },
  { text: '%s.0, %mul', x: 200, w: 96, label: ['operands: other', 'SSA values'], color: 'f5' },
];

export default function IrLineFigure() {
  return (
    <Svg w={400} h={170} title="The LLVM IR instruction %add = add nsw i64 %s.0, %mul, with each part labelled">
      {PARTS.map((p, k) => (
        <g key={k}>
          <Box x={p.x} y={20} w={p.w} h={30} fill={tok(p.color, 0.18)} stroke={tok(p.color)}>
            <T x={p.x + p.w / 2} y={35} size={13} mono anchor="middle">{p.text}</T>
          </Box>
          <Arrow x1={p.x + p.w / 2} y1={52} x2={p.x + p.w / 2} y2={k % 2 ? 108 : 70} color={tok(p.color)} width={1.5} />
          {p.label.map((l, j) => (
            <T key={j} x={Math.max(42, p.x + p.w / 2)} y={(k % 2 ? 120 : 82) + j * 14} size={11} anchor="middle">{l}</T>
          ))}
        </g>
      ))}
      <T x={61} y={35} size={13} mono anchor="middle">=</T>
      <T x={8} y={160} size={11} fill={tok('muted')}>Meaning: %add is %s.0 + %mul, as 64-bit integers.</T>
    </Svg>
  );
}
