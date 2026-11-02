// Chapter 234: what llc -O0 (the fast allocator) does with sumsq's loop
// head: every value that crosses a block boundary goes through the stack.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function O0Figure() {
  return (
    <Svg w={400} h={190} title="At -O0, values travel between blocks through stack slots: stores at the end of one block, loads at the start of the next.">
      <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>REGISTERS</T>
      {['a0', 'a1', 'a2'].map((r, k) => (
        <Box key={r} x={8} y={26 + k * 34} w={70} h={26}><T x={43} y={40 + k * 34} size={13} mono anchor="middle">{r}</T></Box>
      ))}
      <T x={300} y={14} size={11} weight={700} fill={tok('muted')}>STACK FRAME</T>
      {['8(sp)', '16(sp)', '24(sp)', '32(sp)', '40(sp)'].map((m, k) => (
        <Box key={m} x={300} y={26 + k * 26} w={92} h={22} fill={tok('brand', 0.08)}><T x={346} y={38 + k * 26} size={12} mono anchor="middle">{m}</T></Box>
      ))}
      <Arrow x1={80} y1={40} x2={296} y2={50} color={tok('danger')} />
      <Arrow x1={296} y1={90} x2={80} y2={74} color={tok('accent')} />
      <T x={150} y={36} size={11.5} mono fill={tok('danger')}>sd: spill</T>
      <T x={150} y={98} size={11.5} mono fill={tok('accent')}>ld: reload</T>
      <T x={8} y={150} size={12} fill={tok('muted')}>Each trip round the loop: 5 loads and 4 stores</T>
      <T x={8} y={168} size={12} fill={tok('muted')}>for a body of mul, add and addi.</T>
    </Svg>
  );
}
