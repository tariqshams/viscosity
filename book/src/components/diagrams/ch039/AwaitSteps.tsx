import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `async function load() {
  console.log('1 start');
  await wait(10);
  console.log('3 resumed');
}
load();
console.log('2 caller');`;

type S = { line: number | null; fn: string; promise: string; out: string[]; note: string };

const STATES: S[] = [
  { line: 5, fn: 'not started', promise: 'none yet', out: [], note: 'The caller calls load(). (wait is the function from the last chapter: it returns a promise fulfilled after that many milliseconds.)' },
  { line: 1, fn: 'running', promise: 'none yet', out: ['1 start'], note: 'The body of an async function starts straight away, like any call, and runs up to its first await. It prints 1 start.' },
  { line: 2, fn: 'paused at await', promise: 'pending', out: ['1 start'], note: 'wait(10) returns a pending promise, and await pauses load right here, keeping its local variables. The call load() now returns, handing the caller a pending promise of its own.' },
  { line: 6, fn: 'paused at await', promise: 'pending', out: ['1 start', '2 caller'], note: 'The caller carries on with its next line and prints 2 caller. load is not running; it is waiting.' },
  { line: null, fn: 'paused at await', promise: 'pending', out: ['1 start', '2 caller'], note: 'The file has finished, so nothing is running. After 10 ms the timer fulfils wait’s promise, and “resume load” is queued.' },
  { line: 3, fn: 'running again', promise: 'pending', out: ['1 start', '2 caller', '3 resumed'], note: 'The event loop runs the queued resume: load carries on from just after the await, exactly where it stopped, and prints 3 resumed.' },
  { line: null, fn: 'finished', promise: 'fulfilled', out: ['1 start', '2 caller', '3 resumed'], note: 'load reaches its end, so the promise it handed out is fulfilled (with undefined, since it returns nothing). Anyone who awaited it now resumes too.' },
];

export default function AwaitSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const active = st.fn === 'running' || st.fn === 'running again';
  return (
    <StepFrame title="What await does to a call" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={132} title="The state of the async function load, the promise its call returned, and what has been printed">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>THE CALL load()</T>
        <Box x={4} y={22} w={190} h={30} fill={active ? tok('brand', 0.12) : st.fn === 'paused at await' ? tok('warn', 0.12) : 'transparent'} stroke={active ? tok('brand') : st.fn === 'paused at await' ? tok('warn') : tok('line')}>
          <T x={14} y={37.5} size={12} mono>{st.fn}</T>
        </Box>
        <T x={212} y={12} size={11} weight={700} fill={tok('muted')}>ITS PROMISE</T>
        <Box x={212} y={22} w={184} h={30} dash={st.promise === 'none yet'} fill={st.promise === 'fulfilled' ? tok('safe', 0.12) : st.promise === 'pending' ? tok('warn', 0.12) : 'transparent'} stroke={st.promise === 'fulfilled' ? tok('safe') : st.promise === 'pending' ? tok('warn') : tok('line')}>
          <T x={222} y={37.5} size={12} mono fill={st.promise === 'none yet' ? tok('muted') : tok('ink')}>{st.promise}</T>
        </Box>
        <T x={8} y={76} size={11} weight={700} fill={tok('muted')}>PRINTED</T>
        {st.out.length === 0 && <T x={8} y={100} size={12} fill={tok('muted')}>nothing yet</T>}
        {st.out.map((o, i) => (
          <T key={o} x={8 + i * 128} y={100} size={13} mono weight={700}>{o}</T>
        ))}
        <T x={8} y={124} size={11} fill={tok('muted')}>Printed 1, 2, 3, though line 4 is written before line 7.</T>
      </Svg>
    </StepFrame>
  );
}
