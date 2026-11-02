import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `function sumTo(n) {
  if (n === 0) {
    return 0;
  }
  return n + sumTo(n - 1);
}

console.log(sumTo(3));`;

/** One frame on the stack: its n, and what it is doing right now. */
type F = { n: number; doing: string };
type S = { line: number; frames: F[]; out?: string; note: string };

const STATES: S[] = [
  { line: 7, frames: [], note: 'The top-level code calls sumTo(3). Only the top-level code is running so far: its frame sits at the bottom of the stack.' },
  { line: 1, frames: [{ n: 3, doing: 'is n 0? no' }], note: 'The call gets a fresh frame holding n = 3. It is pushed on top of the stack. Is n 0? No.' },
  { line: 4, frames: [{ n: 3, doing: 'waiting: 3 + ?' }, { n: 2, doing: 'is n 0? no' }], note: 'To finish 3 + sumTo(2), frame n = 3 must wait. A NEW frame for sumTo(2) goes on top, with its own n = 2.' },
  { line: 4, frames: [{ n: 3, doing: 'waiting: 3 + ?' }, { n: 2, doing: 'waiting: 2 + ?' }, { n: 1, doing: 'is n 0? no' }], note: 'Same again: frame n = 2 pauses, and sumTo(1) is pushed. Three frames, three separate variables called n.' },
  { line: 2, frames: [{ n: 3, doing: 'waiting: 3 + ?' }, { n: 2, doing: 'waiting: 2 + ?' }, { n: 1, doing: 'waiting: 1 + ?' }, { n: 0, doing: 'return 0' }], note: 'sumTo(0) is the base case. It answers directly, with no further call. The stack has stopped growing.' },
  { line: 4, frames: [{ n: 3, doing: 'waiting: 3 + ?' }, { n: 2, doing: 'waiting: 2 + ?' }, { n: 1, doing: 'return 1 + 0 = 1' }], note: 'Frame n = 0 is popped. Its answer, 0, lands in the frame below, which can now finish: 1 + 0 = 1.' },
  { line: 4, frames: [{ n: 3, doing: 'waiting: 3 + ?' }, { n: 2, doing: 'return 2 + 1 = 3' }], note: 'Pop again. Frame n = 2 gets 1 back and returns 2 + 1 = 3. The stack is shrinking in the reverse order it grew.' },
  { line: 4, frames: [{ n: 3, doing: 'return 3 + 3 = 6' }], note: 'Frame n = 3 gets 3 back and returns 3 + 3 = 6.' },
  { line: 7, frames: [], out: '6', note: 'The last sumTo frame is popped. 6 arrives back in the top-level code, which prints it. Every frame that was pushed has been popped.' },
];

export default function StackSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const all: (F | null)[] = [null, ...st.frames];
  const H = 30;
  const base = 186;
  return (
    <StepFrame title="The call stack during sumTo(3)" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={200} title="The call stack: one frame per active call, newest on top">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>THE CALL STACK (newest on top)</T>
        {all.map((f, k) => {
          const y = base - (k + 1) * (H + 4);
          const top = k === all.length - 1;
          return (
            <Box key={k} x={8} y={y} w={300} h={H} fill={top ? tok('brand', 0.14) : tok('panel')} stroke={top ? tok('brand') : tok('ink', 0.4)}>
              {f === null ? (
                <T x={20} y={y + H / 2} size={13} mono fill={tok('muted')}>top-level code</T>
              ) : (
                <>
                  <T x={20} y={y + H / 2} size={13} mono weight={700}>sumTo n = {f.n}</T>
                  <T x={150} y={y + H / 2} size={12} mono fill={top ? tok('ink') : tok('muted')}>{f.doing}</T>
                </>
              )}
            </Box>
          );
        })}
        <T x={322} y={base - 20} size={12} fill={tok('muted')}>frames: {all.length}</T>
        {st.out && <T x={322} y={base - 50} size={13} mono fill={tok('brand')} weight={700}>prints {st.out}</T>}
      </Svg>
    </StepFrame>
  );
}
