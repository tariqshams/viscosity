import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 382b: one wait through block_on, as printed by the chapter's
// park-trace example (rustc 1.97.0): task: start, poll: pending, park,
// timer: wake, waker: unpark, poll: ready, task: end. Park and unpark
// as documented in std::thread (an early unpark is remembered).
const CODE = `loop {
    match f.as_mut().poll(&mut cx) {
        Poll::Ready(v) => return v,
        Poll::Pending => thread::park(),
    }
}`;

type Th = 'run' | 'sleep' | 'off';
type S = { line: number; main: Th; helper: Th; arrow: '' | 'wake'; out: string; note: string };

const STATES: S[] = [
  { line: 1, main: 'run', helper: 'off', arrow: '', out: 'task: start\npoll: pending', note: 'Poll 1. The task starts and awaits the timer. The timer clones the waker from the Context, starts a helper thread that will sleep 100 ms, and answers Pending.' },
  { line: 3, main: 'sleep', helper: 'sleep', arrow: '', out: 'park', note: 'Pending, so the executor parks: the main thread sleeps and uses no CPU at all. Nothing polls while nothing has changed.' },
  { line: 3, main: 'sleep', helper: 'run', arrow: 'wake', out: 'timer: wake\nwaker: unpark', note: '100 ms later the helper sets the done flag and calls wake on its waker clone. ThreadWaker::wake unparks the main thread.' },
  { line: 1, main: 'run', helper: 'off', arrow: '', out: 'poll: ready\ntask: end', note: 'The loop comes round and polls again. The flag is set, so the timer answers Ready, the task runs to its end, and the whole future is Ready.' },
  { line: 2, main: 'off', helper: 'off', arrow: '', out: '', note: 'block_on returns the value. Two polls for a 100 ms wait, where the spinning driver made 58 million.' },
];

const fillFor = (t: Th) => (t === 'run' ? tok('safe', 0.16) : t === 'sleep' ? tok('muted', 0.12) : tok('panel'));
const label = (t: Th) => (t === 'run' ? 'running' : t === 'sleep' ? 'parked / sleeping' : 'finished');

export default function ExecutorSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="block_on waits for a timer" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={160} title="The executor thread and the timer's helper thread, and the wake that passes between them">
        <Box x={8} y={10} w={180} h={56} fill={fillFor(st.main)} stroke={st.main === 'run' ? tok('safe') : tok('line')}>
          <T x={20} y={30} size={12} weight={700}>main thread</T>
          <T x={20} y={50} size={11} fill={tok('muted')}>{label(st.main)}</T>
        </Box>
        <Box x={212} y={10} w={180} h={56} fill={fillFor(st.helper)} stroke={st.helper === 'run' ? tok('safe') : tok('line')}>
          <T x={224} y={30} size={12} weight={700}>timer helper</T>
          <T x={224} y={50} size={11} fill={tok('muted')}>{st.helper === 'off' && s.i === 0 ? 'about to start' : label(st.helper)}</T>
        </Box>
        {st.arrow === 'wake' && (
          <g>
            <Arrow x1={212} y1={52} x2={190} y2={52} color={tok('brand')} width={2.5} />
            <T x={300} y={84} size={11} anchor="middle" fill={tok('brand')}>wake → unpark</T>
          </g>
        )}
        <Box x={8} y={96} w={384} h={56} fill={tok('panel')} stroke={tok('line')} dash>
          <T x={16} y={110} size={11} fill={tok('muted')}>printed this step</T>
          {st.out.split('\n').map((l, k) => (
            <T key={k} x={16} y={128 + k * 16} size={11} mono>{l}</T>
          ))}
        </Box>
      </Svg>
    </StepFrame>
  );
}
