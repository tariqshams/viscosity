// Chapter 141: a + b inside a function, two ways. Left: Drip's real
// bytecode (load.local 1, load.local 2, add; checked with
// disassembleFunction). Right: a sketch of a register machine with an
// accumulator, the style of V8's Ignition as its team describes it
// (v8-ignition), written in words rather than as Ignition's real bytecode.
import { Box, Svg, T, tok } from '../../viz/svg';

const LEFT = [
  { i: 'load.local 1', s: 'stack: a' },
  { i: 'load.local 2', s: 'stack: a b' },
  { i: 'add', s: 'stack: a+b' },
];
const RIGHT = [
  { i: 'acc = register b', s: 'acc: b' },
  { i: 'acc = register a + acc', s: 'acc: a+b' },
];

export default function StackVsRegister() {
  return (
    <Svg w={400} h={196} title="a plus b two ways. Drip's stack machine uses three instructions: load.local 1, load.local 2, add, with values passing through the stack. A register machine with an accumulator, sketched in words, uses two: put register b in the accumulator, then add register a to it.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>STACK MACHINE (DRIP)</T>
      <T x={206} y={12} size={11} weight={700} fill={tok('muted')}>REGISTERS + ACCUMULATOR</T>
      {LEFT.map((r, k) => (
        <g key={k}>
          <Box x={8} y={26 + k * 46} w={186} h={38} r={4} fill={tok('brand', 0.08)} stroke={tok('brand', 0.6)} />
          <T x={16} y={39 + k * 46} size={12} mono weight={700}>{r.i}</T>
          <T x={16} y={55 + k * 46} size={11} mono fill={tok('muted')}>{r.s}</T>
        </g>
      ))}
      {RIGHT.map((r, k) => (
        <g key={k}>
          <Box x={206} y={26 + k * 46} w={186} h={38} r={4} fill={tok('accent', 0.08)} stroke={tok('accent', 0.6)} />
          <T x={214} y={39 + k * 46} size={12} mono weight={700}>{r.i}</T>
          <T x={214} y={55 + k * 46} size={11} mono fill={tok('muted')}>{r.s}</T>
        </g>
      ))}
      <T x={8} y={176} size={11} fill={tok('muted')}>3 instructions via the stack</T>
      <T x={206} y={150} size={11} fill={tok('muted')}>2 instructions; operands name</T>
      <T x={206} y={164} size={11} fill={tok('muted')}>registers (a sketch, not</T>
      <T x={206} y={178} size={11} fill={tok('muted')}>Ignition's real bytecode)</T>
    </Svg>
  );
}
