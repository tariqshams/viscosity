// Chapter 154-b: the same instruction, load.local 1, reads a different
// stack cell in each call of fib, because each frame's slots (its frame
// pointer) is different. The stack is the real one inside fib(2) -> fib(1).
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const STACK = ['script', 'fn fib', '2', 'fn fib', '1'];
const CW = 74;
const cx = (i: number) => 14 + i * CW;

export default function WindowFigure() {
  return (
    <Svg w={400} h={232} title="One stack of five cells: script, fn fib, 2, fn fib, 1. The frame of fib(2) has slots 1, so its window starts at cell 1 and its load.local 1 reads cell 2, the value 2. The frame of fib(1) has slots 3, so its window starts at cell 3 and the same load.local 1 reads cell 4, the value 1.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>ONE VALUE STACK (index above)</T>
      {STACK.map((v, i) => (
        <g key={i}>
          <T x={cx(i) + (CW - 6) / 2} y={30} size={11} mono anchor="middle" fill={tok('muted')}>{i}</T>
          <Box x={cx(i)} y={40} w={CW - 6} h={32}>
            <T x={cx(i) + (CW - 6) / 2} y={56} size={12} mono anchor="middle">{v}</T>
          </Box>
        </g>
      ))}
      <Box x={cx(1) - 4} y={84} w={cx(5) - cx(1)} h={26} fill={tok('panel')} stroke={tok('ink', 0.4)}>
        <T x={cx(1) + 4} y={97} size={11.5} mono>fib(2): slots = 1</T>
      </Box>
      <Box x={cx(3) - 4} y={118} w={cx(5) - cx(3)} h={26} fill={tok('brand', 0.14)} stroke={tok('brand')}>
        <T x={cx(3) + 4} y={131} size={11.5} mono weight={700}>fib(1): slots = 3</T>
      </Box>
      <T x={8} y={168} size={12} mono>load.local 1 in fib(2): 1 + 1 = 2</T>
      <T x={8} y={188} size={12} mono fill={tok('brand')}>load.local 1 in fib(1): 3 + 1 = 4</T>
      <Arrow x1={cx(2) + 34} y1={160} x2={cx(2) + 34} y2={74} color={tok('ink', 0.6)} />
      <Arrow x1={cx(4) + 34} y1={180} x2={cx(4) + 34} y2={74} color={tok('brand')} />
      <T x={8} y={218} size={11} fill={tok('muted')}>Same instruction, same bytes: a different cell per call.</T>
    </Svg>
  );
}
