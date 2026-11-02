// Chapter 394: the 256 values of a byte, and which of them are opcodes.
// drip-rs's OpCode (book/companion/rust/src/chunk.rs) has 53 variants,
// numbered 0 to 52 in declaration order (Const = 0, Add = 20,
// Print = 33, Return = 49, Method = 52), the same numbers as the Op
// table in book/companion/ts/src/vm/chunk.ts. `op as u8` maps a variant
// to its byte; OpCode::from_byte maps 0..=52 back and every other byte
// to None. size_of::<Option<OpCode>>() is 1 (measured with rustc 1.97).
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const MARKS = [
  { n: 0, name: 'Const' },
  { n: 20, name: 'Add' },
  { n: 33, name: 'Print' },
  { n: 52, name: 'Method' },
];

export default function ByteSpace() {
  // 256 values drawn as a strip, 1.5 units each.
  const x0 = 8;
  const u = 1.5;
  const y = 92;
  return (
    <Svg w={400} h={200} title="A byte has 256 values; 0 to 52 decode to opcodes, 53 to 255 decode to None">
      <T x={x0} y={14} size={11} weight={700} fill={tok('brand')}>enum OpCode (53 variants)</T>
      {MARKS.map((m, i) => (
        <g key={m.n}>
          <Box x={x0 + i * 62} y={26} w={56} h={24} r={3} fill={tok('brand', 0.14)} stroke={tok('brand')}>
            <T x={x0 + i * 62 + 28} y={38} size={11} mono anchor="middle">{m.name}</T>
          </Box>
          <Arrow x1={x0 + i * 62 + 28} y1={52} x2={x0 + m.n * u + 1} y2={y - 2} color={tok('brand', 0.7)} width={1.4} />
        </g>
      ))}
      <T x={262} y={38} size={11} mono fill={tok('brand')}>op as u8</T>
      <Box x={x0} y={y} w={53 * u} h={26} r={2} fill={tok('brand', 0.3)} stroke={tok('brand')} />
      <Box x={x0 + 53 * u} y={y} w={203 * u} h={26} r={2} fill={tok('panel')} stroke={tok('line')} dash />
      <T x={x0} y={y + 38} size={11} mono fill={tok('muted')}>0</T>
      <T x={x0 + 53 * u} y={y + 38} size={11} mono fill={tok('muted')}>53</T>
      <T x={x0 + 256 * u} y={y + 38} size={11} mono anchor="end" fill={tok('muted')}>255</T>
      <T x={x0 + 53 * u + 8} y={y + 13} size={11} fill={tok('muted')}>no variant: from_byte gives None</T>
      <T x={x0} y={y + 62} size={11} fill={tok('ink')}>from_byte(b) = ALL.get(b as usize).copied()</T>
      <T x={x0} y={y + 82} size={11} fill={tok('muted')}>Option&lt;OpCode&gt; uses a spare value for None: still 1 byte</T>
    </Svg>
  );
}
