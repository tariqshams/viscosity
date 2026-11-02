import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 382: an executor polling launch(2), which awaits Countdown(2).
// The sequence (Pending, Pending, Ready after three polls, two wakes)
// is what the chapter's exercise tests check, run with rustc 1.97.0.
const CODE = `async fn launch(n: u32) -> String {
    Countdown(n).await;
    format!("liftoff after {n}")
}`;

type S = { line: number | null; n: number | null; poll: number; ans: string; wake: boolean; state: string; note: string };

const STATES: S[] = [
  { line: 0, n: null, poll: 0, ans: '', wake: false, state: 'not started', note: 'Calling launch(2) builds the future and runs none of the body. It sits in memory holding n = 2 and the state “not started”.' },
  { line: 1, n: 2, poll: 1, ans: 'Pending', wake: true, state: 'paused at .await', note: 'Poll 1. The body starts, builds Countdown(2) and polls it. The count is not 0, so it drops to 1, calls wake_by_ref and answers Pending; launch answers Pending too and remembers where it stopped.' },
  { line: 1, n: 1, poll: 2, ans: 'Pending', wake: true, state: 'paused at .await', note: 'Poll 2, because of the wake. launch resumes at the same .await, which polls the countdown again: 1 becomes 0, another wake, another Pending.' },
  { line: 2, n: 0, poll: 3, ans: 'Ready', wake: false, state: 'done', note: 'Poll 3. The countdown is at 0 and answers Ready(()), so .await finishes and the body carries on to format! and returns.' },
  { line: null, n: 0, poll: 3, ans: 'Ready("liftoff after 2")', wake: false, state: 'done', note: 'launch answers Ready with its text. Three polls, two wakes: and nothing ran until the executor asked.' },
];

export default function PollSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const ready = st.ans.startsWith('Ready');
  return (
    <StepFrame title="Polling launch(2)" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={170} title="An executor polls the launch future, which polls a countdown inside it">
        <Box x={8} y={14} w={110} h={60} fill={tok('brand', 0.1)} stroke={tok('brand')}>
          <T x={63} y={34} size={12} weight={700} anchor="middle" fill={tok('brand')}>executor</T>
          <T x={63} y={56} size={11} mono anchor="middle">poll #{st.poll}</T>
        </Box>
        <Box x={150} y={8} w={242} h={124} fill={tok('panel')} stroke={tok('line')}>
          <T x={162} y={26} size={12} weight={700}>launch(2) future</T>
          <T x={162} y={46} size={11} mono fill={tok('muted')}>state: {st.state}</T>
          <Box x={162} y={60} w={140} h={56} fill={tok('f1', 0.12)} stroke={tok('f1')}>
            <T x={172} y={78} size={11} weight={700}>Countdown</T>
            <T x={172} y={100} size={13} mono>n = {st.n === null ? '(not made)' : st.n}</T>
          </Box>
        </Box>
        {st.poll > 0 && <Arrow x1={118} y1={34} x2={150} y2={34} color={tok('brand')} />}
        {st.ans && (
          <Box x={8} y={142} w={260} h={24} r={3} fill={tok(ready ? 'safe' : 'warn', 0.15)} stroke={tok(ready ? 'safe' : 'warn')}>
            <T x={16} y={154} size={11} mono>answer: {st.ans}</T>
          </Box>
        )}
        {st.wake && (
          <g>
            <Arrow x1={300} y1={120} x2={118} y2={66} color={tok('safe')} bend={-0.4} dash />
            <T x={392} y={154} size={11} anchor="end" fill={tok('safe')}>wake: poll me again</T>
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
