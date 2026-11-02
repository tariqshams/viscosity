import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 305: sum(3, 0) with a new frame per call, then with tail-call
// optimisation reusing one frame.
const CODE = `function sum(n, acc) {
  if (n === 0) return acc;
  return sum(n - 1, acc + n);
}
sum(3, 0);`;

type F = [number, number];
type S = { mode: 'plain' | 'tco'; frames: F[]; line: number; ret?: string; note: string };

const STATES: S[] = [
  { mode: 'plain', frames: [[3, 0]], line: 4, note: 'Without the optimisation. The script calls sum(3, 0): one frame on the stack, holding n and acc and the return address.' },
  { mode: 'plain', frames: [[3, 0], [2, 3]], line: 2, note: 'sum(3, 0) makes a tail call, sum(2, 3). It pushes a second frame, although the first has nothing left to do but pass the answer on.' },
  { mode: 'plain', frames: [[3, 0], [2, 3], [1, 5]], line: 2, note: 'And a third. The stack grows by one frame per call: for sum(100000, 0) it would need 100,001 frames, and JavaScript gives up long before that.' },
  { mode: 'plain', frames: [[3, 0], [2, 3], [1, 5], [0, 6]], line: 1, ret: 'returns 6', note: 'n is 0, so the innermost call returns 6.' },
  { mode: 'plain', frames: [[3, 0]], line: 2, ret: '6, 6, 6', note: 'Each waiting frame receives 6 and returns it unchanged. Three frames were kept alive only to do that.' },
  { mode: 'tco', frames: [[3, 0]], line: 4, note: 'Now with tail-call optimisation. The script calls sum(3, 0): one frame, as before.' },
  { mode: 'tco', frames: [[2, 3]], line: 2, note: 'The tail call overwrites n and acc in the same frame with 2 and 3, and jumps to the start of sum. The return address is left alone: it still points back into the script.' },
  { mode: 'tco', frames: [[1, 5]], line: 2, note: 'Same again: n = 1, acc = 5, same frame. The stack never grows; the recursion has become a loop.' },
  { mode: 'tco', frames: [[0, 6]], line: 1, ret: 'returns 6', note: 'return acc goes straight back to the script, which asked for sum(3, 0) and gets 6. Nobody was waiting in between.' },
];

export default function FrameSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Tail calls, with and without a new frame" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={170} title="The call stack: one frame per call without the optimisation, one reused frame with it">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>{st.mode === 'plain' ? 'CALL STACK (a new frame per call)' : 'CALL STACK (tail calls reuse the frame)'}</T>
        <Box x={8} y={138} w={150} h={26} fill={tok('panel')} stroke={tok('ink', 0.4)}>
          <T x={83} y={151} size={12} mono anchor="middle">script</T>
        </Box>
        {st.frames.map(([n, acc], k) => (
          <Box key={k} x={8} y={108 - k * 30} w={150} h={26} fill={st.mode === 'tco' ? tok('f3', 0.15) : tok('brand', 0.1)} stroke={st.mode === 'tco' ? tok('f3') : tok('brand')}>
            <T x={83} y={121 - k * 30} size={12} mono anchor="middle">{`sum n=${n} acc=${acc}`}</T>
          </Box>
        ))}
        <T x={180} y={60} size={13} mono>{`frames: ${st.frames.length + 1}`}</T>
        {st.ret && <T x={180} y={90} size={13} mono fill={tok('brand')}>{st.ret}</T>}
      </Svg>
    </StepFrame>
  );
}
