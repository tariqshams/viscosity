import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 390: index_parallel with two workers and three files, as in
// the chapter's solution: a job channel filled and closed, workers
// sharing its receiver through Arc<Mutex<_>>, a results channel, and
// the calling thread merging. Channels close when every sender is
// dropped (The Rust Programming Language, ch16-02). Which worker takes
// which file is illustrative: the real order varies from run to run.
type W = { job: string; state: string };
type S = { queue: string[]; closed: boolean; w: [W, W]; conveyor: string[]; merged: string[]; note: string };

const STATES: S[] = [
  { queue: ['a.txt', 'b.txt', 'c.txt'], closed: false, w: [{ job: '', state: 'not started' }, { job: '', state: 'not started' }], conveyor: [], merged: [], note: 'find_files gave three paths. Every one is sent into the job channel before any worker starts.' },
  { queue: ['a.txt', 'b.txt', 'c.txt'], closed: true, w: [{ job: '', state: 'waiting' }, { job: '', state: 'waiting' }], conveyor: [], merged: [], note: 'drop(tx) closes the job channel: once it is empty, recv will return Err. Two workers start, each with an Arc clone of the receiver and its own results sender.' },
  { queue: ['c.txt'], closed: true, w: [{ job: 'a.txt', state: 'reading' }, { job: 'b.txt', state: 'reading' }], conveyor: [], merged: [], note: 'Each worker locks the receiver just long enough to take one path (a plain let, so the lock is released at once), then reads and indexes its file. Both work at the same time.' },
  { queue: [], closed: true, w: [{ job: 'c.txt', state: 'reading' }, { job: '', state: 'waiting' }], conveyor: ['a', 'b'], merged: [], note: 'Their partial indexes go onto the results channel. Worker 1 takes the last path; worker 2 asks again and finds the channel empty and closed, so its loop breaks and it drops its sender.' },
  { queue: [], closed: true, w: [{ job: '', state: 'finished' }, { job: '', state: 'finished' }], conveyor: ['c'], merged: ['a', 'b'], note: 'Meanwhile the calling thread merges parts in whatever order they come. Worker 1 finishes too. The calling thread dropped its own sender (drop(out)) right after starting the workers.' },
  { queue: [], closed: true, w: [{ job: '', state: 'finished' }, { job: '', state: 'finished' }], conveyor: [], merged: ['a', 'b', 'c'], note: 'Every sender is gone, so the merge loop ends: one index, equal to what a simple loop would build.' },
];

export default function PipelineSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Two workers, three files" steps={s} note={st.note}>
      <Svg w={400} h={236} title="A job queue feeding two workers, whose results flow on a second channel to a merging thread">
        <Box x={8} y={8} w={118} h={110} fill={tok('panel')} stroke={st.closed ? tok('muted') : tok('line')} dash={st.closed}>
          <T x={16} y={24} size={11} weight={700}>jobs</T>
          <T x={118} y={24} size={11} anchor="end" fill={tok('muted')}>{st.closed ? 'closed' : 'open'}</T>
          {st.queue.map((q, k) => (
            <Box key={q} x={16} y={34 + k * 26} w={102} h={22} r={3} fill={tok('f1', 0.12)} stroke={tok('f1')}>
              <T x={67} y={45 + k * 26} size={11} mono anchor="middle">{q}</T>
            </Box>
          ))}
        </Box>
        {st.w.map((w, k) => (
          <g key={k}>
            <Box x={150} y={8 + k * 58} w={120} h={50} fill={w.state === 'reading' ? tok('safe', 0.14) : tok('panel')} stroke={w.state === 'reading' ? tok('safe') : tok('line')}>
              <T x={160} y={24 + k * 58} size={11} weight={700}>worker {k + 1}</T>
              <T x={160} y={42 + k * 58} size={11} mono fill={tok('muted')}>{w.job || w.state}</T>
            </Box>
            <Arrow x1={126} y1={33 + k * 58} x2={150} y2={33 + k * 58} color={tok('ink', 0.4)} />
          </g>
        ))}
        <Box x={292} y={8} w={100} h={110} fill={tok('panel')} stroke={tok('line')}>
          <T x={300} y={24} size={11} weight={700}>results</T>
          {st.conveyor.map((c, k) => (
            <Box key={c} x={300} y={34 + k * 26} w={84} h={22} r={3} fill={tok('f2', 0.14)} stroke={tok('f2')}>
              <T x={342} y={45 + k * 26} size={11} mono anchor="middle">index {c}</T>
            </Box>
          ))}
        </Box>
        <Arrow x1={270} y1={33} x2={292} y2={50} color={tok('ink', 0.4)} />
        <Arrow x1={270} y1={91} x2={292} y2={80} color={tok('ink', 0.4)} />
        <Arrow x1={342} y1={118} x2={342} y2={146} color={tok('ink', 0.4)} />
        <Box x={8} y={148} w={384} h={80} fill={tok('brand', 0.06)} stroke={tok('brand')}>
          <T x={16} y={166} size={11} weight={700} fill={tok('brand')}>calling thread: merge</T>
          <T x={16} y={190} size={12} mono>{st.merged.length ? `merged: ${st.merged.map((m) => m + '.txt').join(', ')}` : 'waiting for parts'}</T>
          <T x={16} y={212} size={11} fill={tok('muted')}>{s.i === STATES.length - 1 ? 'loop ended: all senders dropped' : 'for part in parts { merge(..) }'}</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
