import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// The end-to-end harness (engine/ts/packages/bench/src/e2e.ts) on one
// program. The per-run times are a real rerun of particles.js with five
// runs per version, made for chapter 192 (not the committed results).
const A = [442, 379, 397, 393, 378];
const B = [92, 135, 89, 89, 91];

type S = { shown: number; note: string };
const STATES: S[] = [
  { shown: 0, note: 'One whole program, particles.js. It builds 200,000 particles, runs 200 frames, and times only the frames itself, with performance.now(). Its last line prints JSON: a checksum of the final positions, and the milliseconds.' },
  { shown: 1, note: 'Compile it with Viscosity, as a user would: the default options, no annotations. Both versions are written to a temporary folder.' },
  { shown: 2, note: 'Run the original in a fresh Node process, five times (RUNS=5; the committed results used 3). A fresh process means every run starts with a cold engine and no leftovers from the other version.' },
  { shown: 3, note: 'Run the compiled version the same way. Look at the second run: 135 ms. Something on this shared machine got in the way.' },
  { shown: 4, note: 'Compare the checksums. If the compiled program computed anything different, the harness throws and the benchmark stops. A speed-up is only reported for a program that gives the same answer.' },
  { shown: 5, note: 'Take the median of each: 393 ms and 91 ms. The slow 135 ms run is simply not in the middle. Speed-up = 393 / 91, about 4.3× (4.30 from the unrounded times).' },
];

export default function E2ESteps() {
  const s = useSteps(STATES);
  const n = s.state.shown;
  const med = (xs: number[]) => [...xs].sort((a, b) => a - b)[2];
  const runs = (xs: number[], x: number, show: boolean, label: string, c: string) => (
    <Box x={x} y={124} w={188} h={116} fill={show ? tok(c, 0.08) : 'transparent'} stroke={show ? tok(c) : tok('line')} dash={!show}>
      <T x={x + 10} y={140} size={10} weight={700} fill={tok('muted')}>{label}</T>
      {xs.map((v, k) => {
        const isMed = n >= 5 && v === med(xs);
        return (
          <g key={k}>
            <T x={x + 14} y={160 + k * 16} size={11} mono fill={tok('muted')}>{`run ${k + 1}`}</T>
            <T x={x + 120} y={160 + k * 16} size={11} mono anchor="end" weight={isMed ? 700 : undefined} fill={!show ? tok('line') : isMed ? tok(c) : undefined}>{show ? `${v} ms` : '…'}</T>
            {isMed && <T x={x + 128} y={160 + k * 16} size={10} fill={tok(c)}>median</T>}
          </g>
        );
      })}
    </Box>
  );
  return (
    <StepFrame title="Benchmarking one whole program" steps={s} note={s.state.note}>
      <Svg w={400} h={330} title="The end-to-end harness: compile a program, run both versions in fresh processes several times, check the checksums match, and divide the medians">
        <Box x={6} y={6} w={170} h={44} fill={n === 0 ? tok('brand', 0.14) : 'transparent'} stroke={tok('ink', 0.5)}>
          <T x={16} y={22} size={12} mono>particles.js</T>
          <T x={16} y={38} size={10} fill={tok('muted')}>{'prints {check, ms}'}</T>
        </Box>
        <Arrow x1={176} y1={28} x2={218} y2={28} color={n >= 1 ? tok('ink', 0.7) : tok('line')} />
        <T x={197} y={18} size={9} anchor="middle" fill={tok('muted')}>compile</T>
        <Box x={220} y={6} w={174} h={44} fill={n === 1 ? tok('brand', 0.14) : 'transparent'} stroke={n >= 1 ? tok('ink', 0.5) : tok('line')} dash={n < 1}>
          <T x={230} y={22} size={12} mono>particles.vsc.js</T>
          <T x={230} y={38} size={10} fill={tok('muted')}>ps → struct of arrays</T>
        </Box>
        <Arrow x1={90} y1={50} x2={100} y2={120} color={n >= 2 ? tok('ink', 0.7) : tok('line')} />
        <Arrow x1={306} y1={50} x2={300} y2={120} color={n >= 3 ? tok('ink', 0.7) : tok('line')} />
        <T x={200} y={86} size={10} anchor="middle" fill={tok('muted')}>each run: a fresh</T>
        <T x={200} y={100} size={10} anchor="middle" fill={tok('muted')}>node process</T>
        {runs(A, 6, n >= 2, 'ORIGINAL', 'accent')}
        {runs(B, 206, n >= 3, 'VISCOSITY', 'brand')}
        <Box x={60} y={252} w={280} h={30} fill={n === 4 ? tok('safe', 0.12) : 'transparent'} stroke={n >= 4 ? tok('safe') : tok('line')} dash={n < 4}>
          <T x={200} y={267} size={12} anchor="middle" fill={n >= 4 ? tok('safe') : tok('muted')}>{n >= 4 ? `checksums equal ✓ (else: throw)` : 'compare checksums'}</T>
        </Box>
        <Box x={60} y={292} w={280} h={32} fill={n === 5 ? tok('brand', 0.14) : 'transparent'} stroke={n >= 5 ? tok('brand') : tok('line')} dash={n < 5}>
          <T x={200} y={308} size={13} anchor="middle" mono weight={700} fill={n >= 5 ? undefined : tok('muted')}>{n >= 5 ? '393 / 91 ≈ 4.3×' : 'speed-up = median / median'}</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
