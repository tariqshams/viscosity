import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `fn fib(n) {
  if (n < 2) return n;
  return fib(n - 1) + fib(n - 2);
}
print fib(2);`;

/** A call frame: which function, and where its slot 0 is. */
type F = { name: string; slots: number };
type S = { line: number; stack: string[]; frames: F[]; out?: string; note: string };

const SCRIPT: F = { name: 'script', slots: 0 };
const FIB2: F = { name: 'fib(2)', slots: 1 };

const STATES: S[] = [
  { line: 4, stack: ['<script>'], frames: [SCRIPT], note: 'One frame is running: the script, whose slots begin at stack index 0. Slot 0 holds the script’s own function.' },
  { line: 4, stack: ['<script>', '<fn fib>', '2'], frames: [SCRIPT], note: 'To call fib(2), the script pushes the callee (GET_GLOBAL fib) and then the argument. Then comes CALL 1: one argument.' },
  { line: 0, stack: ['<script>', '<fn fib>', '2'], frames: [SCRIPT, FIB2], note: 'CALL pushes a new frame with slots = sp − 1 − 1 = 1. Nothing is copied: the callee is already in the new frame’s slot 0 and the argument in slot 1, which is where the compiler put n.' },
  { line: 2, stack: ['<script>', '<fn fib>', '2', '<fn fib>', '1'], frames: [SCRIPT, FIB2], note: 'n < 2 is false. fib(2) evaluates fib(n − 1): it pushes fib, then reads n with GET_LOCAL 1, which means stack index 1 + 1 = 2, and subtracts.' },
  { line: 1, stack: ['<script>', '<fn fib>', '2', '<fn fib>', '1'], frames: [SCRIPT, FIB2, { name: 'fib(1)', slots: 3 }], note: 'CALL 1 again: a third frame whose window starts at index 3. Its GET_LOCAL 1 now means index 4. Same bytecode, different window.' },
  { line: 1, stack: ['<script>', '<fn fib>', '2', '1'], frames: [SCRIPT, FIB2], note: 'In fib(1), n < 2 is true, so it pushes n and RETURNs. RETURN pops the result, pops the frame, sets sp back to that frame’s slots (3), and pushes the result. Callee and argument are gone in one move.' },
  { line: 2, stack: ['<script>', '<fn fib>', '2', '1', '<fn fib>', '0'], frames: [SCRIPT, FIB2], note: 'fib(2) carries on where its ip left off. The 1 waits on the stack while it prepares fib(n − 2): fib and 0.' },
  { line: 1, stack: ['<script>', '<fn fib>', '2', '1', '<fn fib>', '0'], frames: [SCRIPT, FIB2, { name: 'fib(0)', slots: 4 }], note: 'This call’s window starts at index 4, overlapping the space fib(1) used before. Frames reuse the stack as they come and go.' },
  { line: 2, stack: ['<script>', '<fn fib>', '2', '1', '0'], frames: [SCRIPT, FIB2], note: 'fib(0) returns 0 the same way. Now fib(2) has both operands on top of its part of the stack.' },
  { line: 2, stack: ['<script>', '<fn fib>', '2', '1'], frames: [SCRIPT, FIB2], note: 'ADD leaves 1 + 0 = 1.' },
  { line: 4, stack: ['<script>', '1'], frames: [SCRIPT], note: 'fib(2) RETURNs: sp drops to its slots, 1, wiping its function and its n, and the result 1 is pushed where the callee used to be. To the script, the whole call became one value.' },
  { line: 4, stack: ['<script>'], frames: [SCRIPT], out: '1', note: 'PRINT pops and prints 1. At its deepest the program had three frames, yet the VM made no host-language calls at all: just records in an array.' },
];

const CW = 54;
const cx = (i: number) => 8 + i * CW;

export default function FrameSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const fs = st.frames;
  return (
    <StepFrame title="Call frames over one stack, in fib(2)" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={214} title="The value stack as a row of cells. Below it, each call frame is a bar starting at its slots index; the newest frame is on top.">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>VALUE STACK (index above)</T>
        {st.stack.map((v, i) => (
          <g key={i}>
            <T x={cx(i) + CW / 2 - 2} y={30} size={10} mono anchor="middle" fill={tok('muted')}>{i}</T>
            <Box x={cx(i)} y={38} w={CW - 4} h={30}>
              <T x={cx(i) + CW / 2 - 2} y={53} size={v.length > 6 ? 9.5 : 12} mono anchor="middle">{v}</T>
            </Box>
          </g>
        ))}
        <T x={8} y={90} size={11} weight={700} fill={tok('muted')}>CALL FRAMES (newest on top)</T>
        {fs.map((f, k) => {
          const next = fs[k + 1];
          const end = next ? next.slots + 1 : st.stack.length - 1;
          const row = fs.length - 1 - k;
          const y = 100 + row * 30;
          const top = k === fs.length - 1;
          const x = cx(f.slots);
          const w = cx(end) + CW - 4 - x;
          return (
            <Box key={k} x={x} y={y} w={w} h={24} fill={top ? tok('brand', 0.14) : tok('panel')} stroke={top ? tok('brand') : tok('ink', 0.35)}>
              <T x={w >= 96 ? x + 6 : x + w + 6} y={y + 12} size={10} mono weight={top ? 700 : 400}>{f.name} slots {f.slots}</T>
            </Box>
          );
        })}
        <T x={8} y={206} size={12} mono>{st.out ? `output: ${st.out}` : ''}</T>
      </Svg>
    </StepFrame>
  );
}
