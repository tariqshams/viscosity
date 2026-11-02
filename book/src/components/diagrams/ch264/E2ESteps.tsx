import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';
import results from '../../../../../engine/ts/packages/bench/results/matrix-2026-10-31.json';

// The benchmark matrix's end-to-end harness (engine/ts/packages/bench/src/
// matrix.ts) on one program, particles.js, on Node. Every number is read
// from the committed results file: the nine timed runs of each version, the
// checksum, and the best and median times.
type Times = { best: number; median: number; all: number[] };
type Row = { program: string; node: { check: string; originalMs: Times; viscosityMs: Times; speedupBest: number; speedupMedian: number } };

const row = (results.e2e.rows as Row[]).find((r) => r.program === 'particles')!;
const A = row.node.originalMs;
const B = row.node.viscosityMs;
const N = A.all.length;

type S = { shown: number; note: string };
const STATES: S[] = [
  { shown: 0, note: 'One whole program, particles.js: it builds 200,000 particles, runs 200 frames, and times only the frames itself, with performance.now(). Its last line prints JSON: a checksum of the final positions, and the milliseconds.' },
  { shown: 1, note: 'Compile it as a user would: the TypeScript engine, default options, no annotations. The harness also compiles it with the Rust CLI and checks the output is byte-identical (it was).' },
  { shown: 2, note: 'Run each version once and throw the result away: that first run warms the file cache and the runtime’s on-disk caches, which no later run should pay for.' },
  { shown: 3, note: `Now ${N} timed runs, each in a fresh Node process, original and compiled taking turns, so that a slow minute on this shared machine hits both versions alike. Here are the original’s ${N} times.` },
  { shown: 4, note: `And the compiled version’s ${N} times. They spread from ${Math.min(...B.all)} to ${Math.max(...B.all)} ms: the same code, on the same machine, minutes apart.` },
  { shown: 5, note: `Every run’s checksum must be identical, all ${2 * N} of them (${row.node.check}). If one differed, the harness would throw, and no speed-up would be reported for a program that computes something else.` },
  { shown: 6, note: `Summarise each side by its best run and its median: best ${A.best} → ${B.best} ms (${row.node.speedupBest}×), median ${A.median} → ${B.median} ms (${row.node.speedupMedian}×). The best is the most stable figure on a noisy machine; the median shows the spread.` },
];

export default function E2ESteps() {
  const s = useSteps(STATES);
  const n = s.state.shown;
  const runs = (t: Times, x: number, show: boolean, label: string, c: string) => (
    <Box x={x} y={104} w={188} h={174} fill={show ? tok(c, 0.08) : 'transparent'} stroke={show ? tok(c) : tok('line')} dash={!show}>
      <T x={x + 10} y={118} size={11} weight={700} fill={tok('muted')}>{label}</T>
      {t.all.map((v, k) => {
        const best = n >= 6 && v === t.best;
        const med = n >= 6 && v === t.median;
        return (
          <g key={k}>
            <T x={x + 12} y={136 + k * 15} size={11} mono fill={tok('muted')}>{`run ${k + 1}`}</T>
            <T x={x + 116} y={136 + k * 15} size={11} mono anchor="end" weight={best || med ? 700 : undefined} fill={!show ? tok('line') : best || med ? tok(c) : undefined}>{show ? `${v} ms` : '…'}</T>
            {(best || med) && <T x={x + 124} y={136 + k * 15} size={11} fill={tok(c)}>{best ? 'best' : 'median'}</T>}
          </g>
        );
      })}
    </Box>
  );
  return (
    <StepFrame title="Benchmarking one whole program" steps={s} note={s.state.note}>
      <Svg w={400} h={356} title="The end-to-end harness on particles.js: compile, a discarded warm-up run, nine alternating fresh-process runs of each version, a checksum check, then best and median">
        <Box x={6} y={6} w={170} h={44} fill={n === 0 ? tok('brand', 0.14) : 'transparent'} stroke={tok('ink', 0.5)}>
          <T x={16} y={22} size={12} mono>particles.js</T>
          <T x={16} y={38} size={11} fill={tok('muted')}>{'prints {check, ms}'}</T>
        </Box>
        <Arrow x1={176} y1={28} x2={218} y2={28} color={n >= 1 ? tok('ink', 0.7) : tok('line')} />
        <Box x={220} y={6} w={174} h={44} fill={n === 1 ? tok('brand', 0.14) : 'transparent'} stroke={n >= 1 ? tok('ink', 0.5) : tok('line')} dash={n < 1}>
          <T x={230} y={22} size={12} mono>particles.vsc.js</T>
          <T x={230} y={38} size={11} fill={tok('muted')}>ps → struct of arrays</T>
        </Box>
        <Box x={60} y={60} w={280} h={32} fill={n === 2 ? tok('brand', 0.14) : 'transparent'} stroke={n >= 2 ? tok('ink', 0.5) : tok('line')} dash={n < 2}>
          <T x={200} y={76} size={11} anchor="middle" fill={n >= 2 ? undefined : tok('muted')}>one discarded run of each (warm-up)</T>
        </Box>
        {runs(A, 6, n >= 3, 'ORIGINAL (Node)', 'accent')}
        {runs(B, 206, n >= 4, 'VISCOSITY (Node)', 'brand')}
        <Box x={40} y={288} w={320} h={26} fill={n === 5 ? tok('safe', 0.12) : 'transparent'} stroke={n >= 5 ? tok('safe') : tok('line')} dash={n < 5}>
          <T x={200} y={301} size={11} anchor="middle" fill={n >= 5 ? tok('safe') : tok('muted')}>{n >= 5 ? `all ${2 * N} checksums equal ✓ (else: throw)` : 'compare checksums'}</T>
        </Box>
        <Box x={40} y={320} w={320} h={30} fill={n === 6 ? tok('brand', 0.14) : 'transparent'} stroke={n >= 6 ? tok('brand') : tok('line')} dash={n < 6}>
          <T x={200} y={335} size={12} anchor="middle" mono weight={700} fill={n >= 6 ? undefined : tok('muted')}>{n >= 6 ? `best ${row.node.speedupBest}×  median ${row.node.speedupMedian}×` : 'speed-up = original / Viscosity'}</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
