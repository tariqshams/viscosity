import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// A scoped thread borrowing half a vector, drawn as two lanes over time,
// then the same idea with thread::spawn, where the thread could outlive
// the vector (which is why spawn demands 'static).

const CODE = `let xs: Vec<u64> = (1..=10).collect();
let (a, b) = xs.split_at(5);
let t = thread::scope(|s| {
    let h = s.spawn(|| sum(a));
    let sb = sum(b);
    h.join().unwrap() + sb
});
drop(xs); // fine: no thread is left`;

type S = { line: number | null; t: number; worker: 'none' | 'run' | 'done' | 'spawned'; borrowA: boolean; borrowB: boolean; scope: 'none' | 'open' | 'closed'; xs: 'live' | 'dropped'; danger?: boolean; note: string };

const STATES: S[] = [
  { line: 1, t: 1, worker: 'none', borrowA: false, borrowB: false, scope: 'none', xs: 'live', note: 'xs lives in main’s stack frame (its numbers on the heap). split_at makes two slices, a and b: views of the first and second halves, no copying.' },
  { line: 3, t: 2, worker: 'run', borrowA: true, borrowB: false, scope: 'open', xs: 'live', note: 'Inside the scope, s.spawn starts a worker thread whose closure borrows a. This is allowed because the scope promises to join the worker before it returns, while xs is still alive.' },
  { line: 4, t: 3, worker: 'run', borrowA: true, borrowB: true, scope: 'open', xs: 'live', note: 'Main does not wait: it sums b at the same time as the worker sums a. Two threads read xs at once; both are shared borrows, so this is not a data race.' },
  { line: 5, t: 4, worker: 'done', borrowA: false, borrowB: false, scope: 'open', xs: 'live', note: 'join waits for the worker and returns Ok(15); main adds its own 40. Had the worker panicked, join would return Err instead.' },
  { line: 6, t: 5, worker: 'done', borrowA: false, borrowB: false, scope: 'closed', xs: 'live', note: 'The scope ends. Every thread spawned on s has been joined (any we forgot would be joined here, automatically), so the borrows of xs are over and scope returns 55.' },
  { line: 7, t: 6, worker: 'done', borrowA: false, borrowB: false, scope: 'closed', xs: 'dropped', note: 'Now xs can be dropped (or changed): no thread can still be reading it. The compiler knows this from the scope’s shape alone.' },
  { line: null, t: 6, worker: 'spawned', borrowA: true, borrowB: false, scope: 'none', xs: 'dropped', danger: true, note: 'With thread::spawn instead, nothing ties the thread to the function: it may still be running when xs is dropped, and its borrow of a would point at freed memory. That is why spawn requires a \'static closure (error E0373), and move.' },
];

const X0 = 70, DX = 52;

export default function ScopeSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const tx = X0 + st.t * DX;
  return (
    <StepFrame title="A scoped thread borrows, and is joined in time" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={170} title="Two lanes over time: the main thread and a worker, with the vector they borrow">
        <T x={8} y={30} size={11} weight={700} fill={tok('muted')}>main</T>
        <line x1={X0} y1={30} x2={Math.max(tx, X0 + DX)} y2={30} stroke={tok('ink', 0.7)} strokeWidth={3} />
        <T x={8} y={70} size={11} weight={700} fill={tok('muted')}>worker</T>
        {st.worker !== 'none' && (
          <line x1={X0 + 2 * DX} y1={70} x2={st.danger ? 392 : X0 + 4 * DX} y2={70}
            stroke={st.danger ? tok('danger') : tok('f2')} strokeWidth={3} strokeDasharray={st.danger ? '6 4' : undefined} />
        )}
        {st.worker !== 'none' && <Arrow x1={X0 + 2 * DX} y1={32} x2={X0 + 2 * DX} y2={66} color={tok('f2')} />}
        {(st.worker === 'done' && !st.danger) && <Arrow x1={X0 + 4 * DX} y1={68} x2={X0 + 4 * DX} y2={34} color={tok('f2')} />}
        {st.scope !== 'none' && (
          <Box x={X0 + 1.6 * DX} y={14} w={(st.scope === 'closed' ? 3.6 : Math.min(st.t, 5) - 1.4) * DX} h={68} r={6} fill="none" stroke={tok('brand')} dash />
        )}
        {st.scope !== 'none' && <T x={X0 + 1.7 * DX} y={10} size={11} fill={tok('brand')}>thread::scope</T>}
        {st.danger && <T x={392} y={88} size={11} anchor="end" fill={tok('danger')}>thread::spawn: may outlive xs</T>}

        <T x={8} y={118} size={11} weight={700} fill={tok('muted')}>xs</T>
        <Box x={X0} y={104} w={150} h={28} r={3} fill={st.xs === 'dropped' ? tok('panel') : tok('f1', 0.12)} stroke={st.xs === 'dropped' ? tok('line') : tok('f1')} dash={st.xs === 'dropped'}>
          <T x={X0 + 37} y={118} size={11} mono anchor="middle" fill={st.borrowA ? tok('f2') : undefined}>a: 1..5</T>
          <T x={X0 + 112} y={118} size={11} mono anchor="middle" fill={st.borrowB ? tok('ink') : undefined}>b: 6..10</T>
        </Box>
        <line x1={X0 + 75} y1={104} x2={X0 + 75} y2={132} stroke={tok('line')} />
        {st.xs === 'dropped' && <T x={X0 + 160} y={118} size={11} fill={tok('muted')}>dropped</T>}
        {st.borrowA && <Arrow x1={X0 + 2.5 * DX} y1={74} x2={X0 + 37} y2={102} color={st.danger ? tok('danger') : tok('f2')} />}
        {st.borrowB && <Arrow x1={X0 + 3 * DX} y1={34} x2={X0 + 112} y2={102} bend={0.2} color={tok('ink', 0.6)} />}
        <T x={8} y={156} size={11} fill={tok('muted')}>time →</T>
      </Svg>
    </StepFrame>
  );
}
