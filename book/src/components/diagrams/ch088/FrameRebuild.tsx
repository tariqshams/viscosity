import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// What the deoptimizer built for add('a', 'b'), from
// `node --trace-deopt-verbose` in Node v22.23.4 (V8 12.4): "translating
// interpreted frame add => bytecode_offset=2", with stack parameters "a"
// and "b" and the accumulator holding "b". Offset 2 is Add a0, [0] in
// add's bytecode from --print-bytecode.
const BC = [
  { off: '@ 0', op: 'Ldar a1', done: true },
  { off: '@ 2', op: 'Add a0, [0]', done: false },
  { off: '@ 5', op: 'Return', done: false },
];
const FRAME = [
  { k: 'a0 (a)', v: '"a"' },
  { k: 'a1 (b)', v: '"b"' },
  { k: 'accumulator', v: '"b"' },
  { k: 'bytecode offset', v: '2' },
];

export default function FrameRebuild() {
  return (
    <Svg w={400} h={200} title="Left: the interpreter frame the deoptimiser built for add: a0 holds the string a, a1 holds b, the accumulator holds b, and the bytecode offset is 2. Right: add's three bytecodes, with Ldar a1 already done and Add a0, [0] at offset 2 highlighted as the place Ignition resumes.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>REBUILT IGNITION FRAME</T>
      {FRAME.map((f, k) => (
        <g key={f.k}>
          <T x={8} y={38 + k * 34} size={11} mono fill={tok('muted')}>{f.k}</T>
          <Box x={112} y={24 + k * 34} w={70} h={28} r={3} fill={k === 2 ? tok('accent', 0.15) : tok('panel')} stroke={k === 2 ? tok('accent') : tok('ink', 0.5)}>
            <T x={147} y={38 + k * 34} size={12} mono anchor="middle">{f.v}</T>
          </Box>
        </g>
      ))}
      <T x={214} y={12} size={11} weight={700} fill={tok('muted')}>add’s BYTECODE</T>
      {BC.map((b, k) => (
        <Box key={b.off} x={214} y={24 + k * 40} w={178} h={30} r={3}
          fill={!b.done && k === 1 ? tok('brand', 0.18) : tok('panel')} stroke={k === 1 ? tok('brand') : tok('line')} opacity={b.done ? 0.6 : 1}>
          <T x={222} y={39 + k * 40} size={12} mono>{b.off}  {b.op}</T>
        </Box>
      ))}
      <Arrow x1={184} y1={140} x2={212} y2={78} color={tok('brand')} />
      <T x={214} y={146} size={11} fill={tok('muted')}>Ldar a1 had run, so the</T>
      <T x={214} y={160} size={11} fill={tok('muted')}>accumulator holds "b";</T>
      <T x={214} y={174} size={11} fill={tok('muted')}>Ignition resumes at</T>
      <T x={214} y={188} size={11} fill={tok('muted')}>offset 2, and adds.</T>
    </Svg>
  );
}
