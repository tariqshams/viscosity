import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 383: for_each_parallel in engine/rust/crates/cli/src/main.rs.
// Threads take the next index from an AtomicUsize (fetch_add), compile
// that file, and store the result in its own slot of a Mutex<Vec<Option>>.
// The main thread prints the slots in input order after the scope joins.
// The durations here are made up to show the scheduling; they are not
// measurements.
const FILES = ['a.js', 'b.js', 'c.js', 'bad.js', 'e.js', 'f.js'];
// [thread, file, start, end]
const RUNS: [number, number, number, number][] = [
  [0, 0, 0, 3], [1, 1, 0, 1], [2, 2, 0, 2],
  [1, 3, 1, 2], [2, 4, 2, 6], [1, 5, 2, 3],
];

type S = { t: number; next: number; done: number[]; printed?: boolean; note: string };

const STATES: S[] = [
  { t: 0, next: 3, done: [], note: 'Three threads start. Each calls next.fetch_add(1), which returns the old value and adds one in a single step: they get 0, 1 and 2, never the same number twice. next is now 3.' },
  { t: 1, next: 4, done: [1], note: 'Thread 2 finishes b.js, locks the mutex, stores the result in slot 1, and asks again: it gets 3, bad.js. No thread waits for another to choose.' },
  { t: 2, next: 6, done: [1, 2, 3], note: 'c.js and bad.js finish. bad.js failed: its slot holds an Err, like any other result. The two threads take 4 (e.js, a slow file) and 5.' },
  { t: 3, next: 8, done: [0, 1, 2, 3, 5], note: 'a.js and f.js finish. Their threads ask again and get 6 and 7. Both are ≥ 6 files, so they leave the loop. Results are in, out of order: slots 0, 1, 2, 3 and 5.' },
  { t: 6, next: 9, done: [0, 1, 2, 3, 4, 5], note: 'The slow e.js held up nobody: the other threads drained the queue meanwhile. Its thread gets 8 and stops. thread::scope returns only after every thread has finished.' },
  { t: 6, next: 9, done: [0, 1, 2, 3, 4, 5], printed: true, note: 'The main thread walks the slots in input order: a.js, b.js, c.js, then “viscosity: bad.js: …” on stderr, then e.js and f.js. Same order for any number of threads; exit status 1.' },
];

const X0 = 60;
const UNIT = 52;

export default function WorkSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Three threads, one counter" steps={s} note={st.note}>
      <Svg w={400} h={250} title="Threads take file indexes from a shared counter and fill result slots out of order; the results are printed in order">
        <Box x={250} y={6} w={140} h={26} r={4} fill={tok('brand', 0.12)} stroke={tok('brand')}>
          <T x={320} y={19} size={12} mono anchor="middle">next = {st.next}</T>
        </Box>
        <T x={10} y={19} size={11} fill={tok('muted')}>time →</T>
        {[0, 1, 2].map((th) => (
          <T key={th} x={10} y={58 + th * 34} size={11} mono>{`T${th + 1}`}</T>
        ))}
        {RUNS.map(([th, f, a, b]) => {
          if (a > st.t) return null;
          const end = Math.min(b, st.t === 0 ? 0.35 : st.t);
          const w = Math.max(14, (end - a) * UNIT - 2);
          const fin = st.done.includes(f);
          const bad = FILES[f] === 'bad.js';
          return (
            <Box key={f} x={X0 + a * UNIT} y={45 + th * 34} w={w} h={26} r={3}
              fill={fin ? (bad ? tok('danger', 0.18) : tok('safe', 0.18)) : tok('warn', 0.18)}
              stroke={fin ? (bad ? tok('danger') : tok('safe')) : tok('warn')} dash={!fin}>
              <T x={X0 + a * UNIT + 4} y={58 + th * 34} size={11} mono>{FILES[f]}</T>
            </Box>
          );
        })}
        <line x1={X0 + st.t * UNIT} y1={40} x2={X0 + st.t * UNIT} y2={146} stroke={tok('ink', 0.5)} strokeDasharray="3 3" />
        <T x={10} y={168} size={11} fill={tok('muted')}>slots (Mutex&lt;Vec&lt;Option&gt;&gt;), in input order</T>
        {FILES.map((f, k) => {
          const fin = st.done.includes(k);
          const bad = f === 'bad.js';
          return (
            <Box key={f} x={10 + k * 64} y={178} w={58} h={30} r={3}
              fill={fin ? (bad ? tok('danger', 0.15) : tok('safe', 0.15)) : tok('panel')}
              stroke={fin ? (bad ? tok('danger') : tok('safe')) : tok('line')} dash={!fin}>
              <T x={39 + k * 64} y={189} size={11} mono anchor="middle">{k}</T>
              <T x={39 + k * 64} y={201} size={11} mono anchor="middle">{fin ? (bad ? 'Err' : 'Ok') : 'None'}</T>
            </Box>
          );
        })}
        {st.printed && (
          <T x={200} y={234} size={11} mono anchor="middle">a b c (bad → stderr) e f · exit 1</T>
        )}
      </Svg>
    </StepFrame>
  );
}
