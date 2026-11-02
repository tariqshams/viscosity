import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 450b: Amdahl's law against engine/rust/results/
// parallel-build-2026-10-31.md (396 files, best of 11, ms). For each
// target the serial part is estimated from the 1- and 4-thread runs,
// s = (4 * t4 - t1) / 3, and the rest is assumed to shrink with the
// thread count: predicted(N) = s + (t1 - s) / N. The measured bests are
// drawn as a tick next to each predicted bar.
type Row = { label: string; t: number[] };
const ROWS: Row[] = [
  { label: 'build, output on tmpfs', t: [40.0, 23.4, 16.5, 13.5] },
  { label: 'build, output on disk', t: [105.3, 95.8, 97.8, 85.1] },
];
const serial = (r: Row) => (4 * r.t[3] - r.t[0]) / 3;

type S = { row: number; n: number; note: string };
const STATES: S[] = [
  { row: 0, n: 1, note: 'tmpfs, 1 thread: 40.0 ms. From the 1- and 4-thread times, the serial part (process start, arguments, the output folder, printing) comes out at about 4.7 ms; the other 35.3 ms is compiling and writing, which threads can share.' },
  { row: 0, n: 2, note: '2 threads: the shared part halves. Predicted 4.7 + 35.3 / 2 = 22.3 ms; measured 23.4 ms.' },
  { row: 0, n: 4, note: '4 threads: predicted 4.7 + 35.3 / 4 = 13.5 ms, measured 13.5 ms (it is the point the estimate was made from), a speed-up of 2.95. Even infinitely many threads could not beat 4.7 ms: at most 8.6 times.' },
  { row: 1, n: 1, note: 'Now to the VM’s disk. 1 thread: 105.3 ms. The same estimate gives a serial part of about 78 ms: creating 396 files, which the virtual disk does one at a time, whatever the thread count.' },
  { row: 1, n: 4, note: '4 threads shrink only the other 27 ms: predicted 78.4 + 26.9 / 4 = 85.1 ms, measured 85.1 ms. A speed-up of 1.24; no number of threads could beat 105.3 / 78.4, about 1.34.' },
];

const SCALE = 3; // px per ms
export default function AmdahlSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const r = ROWS[st.row];
  const sm = serial(r);
  const par = (r.t[0] - sm) / st.n;
  const meas = r.t[st.n - 1];
  const X = 10;
  return (
    <StepFrame title="The part threads cannot share" steps={s} note={st.note}>
      <Svg w={400} h={180} title="A run split into a serial part and a part shared by the threads, for one to four threads">
        <T x={X} y={16} size={13} weight={700}>{r.label}</T>
        <T x={390} y={16} size={13} mono anchor="end">{st.n} thread{st.n > 1 ? 's' : ''}</T>
        <T x={X} y={46} size={12} fill={tok('muted')}>predicted</T>
        <Box x={X} y={56} w={sm * SCALE} h={28} r={2} fill={tok('ink', 0.18)} stroke={tok('ink', 0.5)} />
        <Box x={X + sm * SCALE} y={56} w={Math.max(2, par * SCALE)} h={28} r={2} fill={tok('brand', 0.3)} stroke={tok('brand')} />
        <T x={X + (sm + par) * SCALE + 6} y={70} size={12} mono>{(sm + par).toFixed(1)} ms</T>
        <T x={X} y={106} size={12} fill={tok('muted')}>measured (best of 11)</T>
        <Box x={X} y={116} w={meas * SCALE} h={20} r={2} fill={tok('accent', 0.2)} stroke={tok('accent')} />
        <T x={X + meas * SCALE + 6} y={126} size={12} mono>{meas.toFixed(1)} ms</T>
        <Box x={X} y={152} w={14} h={12} r={2} fill={tok('ink', 0.18)} stroke={tok('ink', 0.5)} />
        <T x={X + 20} y={158} size={12} fill={tok('muted')}>serial ≈ {sm.toFixed(1)} ms</T>
        <Box x={X + 160} y={152} w={14} h={12} r={2} fill={tok('brand', 0.3)} stroke={tok('brand')} />
        <T x={X + 180} y={158} size={12} fill={tok('muted')}>shared by the threads</T>
      </Svg>
    </StepFrame>
  );
}
