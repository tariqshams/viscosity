import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// The feedback slots of len(p) { return p.x * p.x + p.y * p.y; },
// from `node --print-bytecode` (Node v22.23.4, V8 12.4): both loads of
// p.x use slot [2], both loads of p.y use slot [5], the multiplies use
// [1] and [4], and the add uses [0].
const OPS = [
  { op: 'GetNamedProperty a0 x', slot: 2 },
  { op: 'GetNamedProperty a0 x', slot: 2 },
  { op: 'Mul r0', slot: 1 },
  { op: 'GetNamedProperty a0 y', slot: 5 },
  { op: 'GetNamedProperty a0 y', slot: 5 },
  { op: 'Mul r1', slot: 4 },
  { op: 'Add r0', slot: 0 },
];
const SLOTS = [
  { k: 0, what: 'Add: operand kinds' },
  { k: 1, what: 'Mul: operand kinds' },
  { k: 2, what: 'load x: maps seen' },
  { k: 4, what: 'Mul: operand kinds' },
  { k: 5, what: 'load y: maps seen' },
];

export default function SlotMap() {
  const sy = (k: number) => 24 + SLOTS.findIndex((s) => s.k === k) * 40 + 14;
  return (
    <Svg w={400} h={232} title="Seven bytecodes of len on the left, each with an arrow to a feedback slot on the right. The two loads of p.x share slot 2 and the two loads of p.y share slot 5; the multiplies and the add each have their own.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>BYTECODE OF len(p)</T>
      <T x={250} y={12} size={11} weight={700} fill={tok('muted')}>FEEDBACK VECTOR</T>
      {OPS.map((o, i) => (
        <g key={i}>
          <Box x={8} y={22 + i * 30} w={170} h={24} r={3} fill={tok('panel')}>
            <T x={14} y={34 + i * 30} size={11} mono>{o.op}</T>
          </Box>
          <Arrow x1={180} y1={34 + i * 30} x2={246} y2={sy(o.slot)} color={tok(o.op.startsWith('Get') ? 'brand' : 'muted', 0.7)} width={1.3} />
        </g>
      ))}
      {SLOTS.map((s, j) => (
        <Box key={s.k} x={250} y={24 + j * 40} w={142} h={28} r={4} fill={s.k === 2 || s.k === 5 ? tok('brand', 0.12) : tok('panel')} stroke={s.k === 2 || s.k === 5 ? tok('brand') : tok('line')}>
          <T x={258} y={38 + j * 40} size={11}><tspan fontWeight={700}>[{s.k}]</tspan> {s.what}</T>
        </Box>
      ))}
    </Svg>
  );
}
