import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `console.log('A');
setTimeout(() => {
  console.log('C');
}, 0);
console.log('B');`;

// running: what JavaScript is running now (null = nothing).
// waiting: a timer Node is keeping. queue: callbacks ready to run.
type S = { line: number | null; running: string | null; waiting: boolean; queue: boolean; out: string[]; note: string };

const STATES: S[] = [
  { line: null, running: 'the whole file', waiting: false, queue: false, out: [], note: 'Node starts by running the whole file as one job, top to bottom. Nothing is waiting yet, and the queue is empty.' },
  { line: 0, running: 'the whole file', waiting: false, queue: false, out: ['A'], note: "console.log('A') runs and prints A." },
  { line: 1, running: 'the whole file', waiting: true, queue: false, out: ['A'], note: 'setTimeout hands the callback and its delay to Node, which starts a timer, and then setTimeout returns at once. The callback has not run.' },
  { line: 4, running: 'the whole file', waiting: true, queue: false, out: ['A', 'B'], note: 'So the next line runs straight away and prints B.' },
  { line: null, running: null, waiting: false, queue: true, out: ['A', 'B'], note: 'The file has run to its end, so nothing is running. The timer was due after 0 ms, so Node puts its callback in the queue.' },
  { line: 2, running: 'the timer callback', waiting: false, queue: false, out: ['A', 'B'], note: 'The event loop sees that nothing is running, takes the oldest callback off the queue, and runs it.' },
  { line: 2, running: 'the timer callback', waiting: false, queue: false, out: ['A', 'B', 'C'], note: 'The callback prints C and returns.' },
  { line: null, running: null, waiting: false, queue: false, out: ['A', 'B', 'C'], note: 'Nothing is running, nothing is queued, and no timer is left, so the loop ends and Node exits. C was written second, yet printed last.' },
];

export default function EventLoopSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Who calls a setTimeout callback?" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={150} title="What is running now, the timer Node keeps, the queue of ready callbacks, and what has been printed">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>RUNNING NOW</T>
        <Box x={4} y={22} w={190} h={30} dash={!st.running} fill={st.running ? tok('brand', 0.1) : 'transparent'} stroke={st.running ? tok('brand') : tok('line')}>
          <T x={14} y={37.5} size={12} mono fill={st.running ? tok('ink') : tok('muted')}>{st.running ?? 'nothing'}</T>
        </Box>
        <T x={212} y={12} size={11} weight={700} fill={tok('muted')}>PRINTED</T>
        {st.out.length === 0 && <T x={212} y={37.5} size={12} fill={tok('muted')}>nothing yet</T>}
        {st.out.map((o, i) => (
          <T key={o} x={214 + i * 26} y={37.5} size={15} mono weight={700}>{o}</T>
        ))}
        <T x={8} y={80} size={11} weight={700} fill={tok('muted')}>WAITING (NODE KEEPS IT)</T>
        <Box x={4} y={90} w={170} h={30} dash={!st.waiting} fill={st.waiting ? tok('warn', 0.12) : 'transparent'} stroke={st.waiting ? tok('warn') : tok('line')}>
          <T x={14} y={105.5} size={12} mono fill={st.waiting ? tok('ink') : tok('muted')}>{st.waiting ? 'timer: 0 ms' : 'no timers'}</T>
        </Box>
        <Arrow x1={178} y1={105} x2={208} y2={105} color={tok('ink', 0.4)} width={1.5} />
        <T x={212} y={80} size={11} weight={700} fill={tok('muted')}>QUEUE (READY TO RUN)</T>
        <Box x={212} y={90} w={184} h={30} dash={!st.queue} fill={st.queue ? tok('accent', 0.12) : 'transparent'} stroke={st.queue ? tok('accent') : tok('line')}>
          <T x={222} y={105.5} size={12} mono fill={st.queue ? tok('ink') : tok('muted')}>{st.queue ? 'timer callback' : 'empty'}</T>
        </Box>
        <T x={8} y={140} size={11} fill={tok('muted')}>The loop only takes from the queue when nothing is running.</T>
      </Svg>
    </StepFrame>
  );
}
