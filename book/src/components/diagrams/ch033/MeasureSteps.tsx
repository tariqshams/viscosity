import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';

// A simplified version of measure() from engine/ts/packages/bench/src/
// harness.ts. Bar heights are ILLUSTRATIVE (no units): they show the shape
// of warm-up and noise, not measured values.
const CODE = `function measure(run) {
  let sink = 0;
  const end = now() + 300; // warm up
  while (now() < end) sink += run();
  const ts = [];
  for (let s = 0; s < 30; s++) {
    const t0 = now();
    sink += run();
    ts.push(now() - t0);
  }
  ts.sort((a, b) => a - b);
  return { median: q(ts, 0.5),
    p95: q(ts, 0.95), sink };
}`;

const WARM = [9, 8.4, 7.6, 6.9, 4.2, 3.8, 3.5, 2.4, 2.1, 2.0, 2.1, 2.0];
const SAMPLES = [2.1, 2.0, 2.2, 2.0, 8.5, 2.1, 2.3, 2.0, 2.1, 2.6, 2.0, 2.2, 2.1, 2.0, 3.4];

type Phase = 'start' | 'warm' | 'samples' | 'sink' | 'sorted' | 'stats';
type S = { line: number; phase: Phase; note: string };

const STATES: S[] = [
  { line: 1, phase: 'start', note: 'measure() gets the work to time as a function, run. Every run returns a number, which goes into sink. Hold that thought.' },
  { line: 3, phase: 'warm', note: 'Warm-up: call run() over and over for 300 ms WITHOUT recording anything. Early calls are slow because V8 starts by interpreting bytecode; as the function gets hot, faster tiers compile it.' },
  { line: 7, phase: 'samples', note: 'Now the real samples. Each one is timed separately (the real harness repeats run() until a sample lasts at least 10 ms). Most agree. One is huge: maybe a garbage-collection pause, maybe another program on the machine.' },
  { line: 7, phase: 'sink', note: 'sink += run() keeps every result. Because sink is printed at the end, the compiler can’t prove the work is unused, so it can’t delete it.' },
  { line: 10, phase: 'sorted', note: 'Sort the samples from fastest to slowest. The outlier ends up at the far end, where it can’t drag the middle around.' },
  { line: 11, phase: 'stats', note: 'The median is the middle sample: the typical run. p95 is near the slow end: how bad it gets. The mean would have been pulled up by the one outlier.' },
];

export default function MeasureSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const showWarm = st.phase !== 'start';
  const showSamples = ['samples', 'sink', 'sorted', 'stats'].includes(st.phase);
  const samples = st.phase === 'sorted' || st.phase === 'stats' ? [...SAMPLES].sort((a, b) => a - b) : SAMPLES;
  const H = 120;
  const base = 128;
  const scale = (v: number) => (v / 9) * (H - 20);
  const midIdx = 7;
  const p95Idx = 13;
  return (
    <StepFrame title="Inside the harness’s measure()" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={160} title="Bar heights show how long each run took (illustrative, not measured): warm-up runs on the left get faster, samples on the right are mostly equal with one slow outlier.">
        <T x={10} y={10} size={11} weight={700} fill={tok('muted')}>WARM-UP (not recorded)</T>
        <T x={188} y={10} size={11} weight={700} fill={tok('muted')}>SAMPLES</T>
        <line x1={6} x2={394} y1={base} y2={base} stroke={tok('line')} />
        {showWarm && WARM.map((v, k) => (
          <rect key={k} x={10 + k * 13} y={base - scale(v)} width={10} height={scale(v)} rx={2} fill={tok('muted', 0.45)} />
        ))}
        {showSamples && samples.map((v, k) => {
          const hl = st.phase === 'stats' && (k === midIdx || k === p95Idx);
          const out = v > 8;
          return (
            <rect key={k} x={188 + k * 13.5} y={base - scale(v)} width={10.5} height={scale(v)} rx={2}
              fill={hl ? tok('brand') : out ? tok('danger', 0.7) : tok('accent', 0.6)} />
          );
        })}
        {st.phase === 'stats' && (
          <g>
            <T x={188 + midIdx * 13.5 + 5} y={base + 12} size={11} mono anchor="middle" weight={700} fill={tok('brand')}>median</T>
            <T x={188 + p95Idx * 13.5 + 5} y={base + 26} size={11} mono anchor="middle" weight={700} fill={tok('brand')}>p95</T>
          </g>
        )}
        {st.phase === 'sink' && <T x={392} y={30} size={12} mono anchor="end" fill={tok('safe')} weight={700}>sink += result ✓</T>}
        <T x={10} y={150} size={10} fill={tok('muted')}>{showWarm ? 'interpreted → optimized' : ''}</T>
        <T x={392} y={10} size={10} anchor="end" fill={tok('muted')}>heights illustrative</T>
      </Svg>
    </StepFrame>
  );
}
