import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `console.log('A');
setTimeout(() => console.log('D'));
Promise.resolve()
  .then(() => console.log('C'));
console.log('B');`;

type S = { line: number | null; running: string | null; tasks: string[]; micros: string[]; out: string[]; note: string };

const STATES: S[] = [
  { line: 0, running: 'the file (a task)', tasks: [], micros: [], out: ['A'], note: 'Running the file is the first task. Its first line prints A.' },
  { line: 1, running: 'the file (a task)', tasks: ['print D'], micros: [], out: ['A'], note: 'setTimeout with no delay: the timer is due at once, so its callback is queued as a task, in the ordinary queue.' },
  { line: 3, running: 'the file (a task)', tasks: ['print D'], micros: ['print C'], out: ['A'], note: 'The promise is already fulfilled, so its then callback is queued at once; but promise callbacks go in the microtask queue.' },
  { line: 4, running: 'the file (a task)', tasks: ['print D'], micros: ['print C'], out: ['A', 'B'], note: 'The file carries on and prints B. Neither queued callback has run: the file must finish first.' },
  { line: 3, running: 'a microtask', tasks: ['print D'], micros: [], out: ['A', 'B', 'C'], note: 'The task is over. Before taking another task, the loop runs every microtask waiting, so C prints now, ahead of D.' },
  { line: 1, running: 'the timer task', tasks: [], micros: [], out: ['A', 'B', 'C', 'D'], note: 'The microtask queue is empty, so the loop takes the next task, the timer callback, and D prints last.' },
  { line: null, running: null, tasks: [], micros: [], out: ['A', 'B', 'C', 'D'], note: 'Both queues are empty and no timer is pending, so the program ends. The order was A, B, C, D.' },
];

function Queue({ y, label, items, colour }: { y: number; label: string; items: string[]; colour: string }) {
  return (
    <g>
      <T x={8} y={y} size={11} weight={700} fill={tok('muted')}>{label}</T>
      <Box x={4} y={y + 10} w={392} h={28} dash={!items.length} fill={items.length ? tok(colour, 0.12) : 'transparent'} stroke={items.length ? tok(colour) : tok('line')}>
        <T x={14} y={y + 24.5} size={12} mono fill={items.length ? tok('ink') : tok('muted')}>{items.length ? items.join(', ') : 'empty'}</T>
      </Box>
    </g>
  );
}

export default function QueueSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Two queues: tasks and microtasks" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={196} title="What is running, the task queue, the microtask queue, and what has been printed">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>RUNNING NOW</T>
        <Box x={4} y={22} w={190} h={28} dash={!st.running} fill={st.running ? tok('brand', 0.12) : 'transparent'} stroke={st.running ? tok('brand') : tok('line')}>
          <T x={14} y={36.5} size={12} mono fill={st.running ? tok('ink') : tok('muted')}>{st.running ?? 'nothing'}</T>
        </Box>
        <T x={212} y={12} size={11} weight={700} fill={tok('muted')}>PRINTED</T>
        {st.out.map((o, i) => (
          <T key={o} x={214 + i * 26} y={36.5} size={15} mono weight={700}>{o}</T>
        ))}
        <Queue y={70} label="MICROTASK QUEUE (RUN FIRST, ALL OF THEM)" items={st.micros} colour="accent" />
        <Queue y={124} label="TASK QUEUE (ONE PER TURN)" items={st.tasks} colour="warn" />
        <T x={8} y={186} size={11} fill={tok('muted')}>After every task, the microtask queue is emptied.</T>
      </Svg>
    </StepFrame>
  );
}
