import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 370-b (Benchmarking with criterion): what criterion does with one benchmark, following its
// "Analysis Process" page (criterion.rs book) and the defaults in
// criterion 0.5.1's source (3 s warm-up, 100 samples over 5 s, 100,000
// bootstrap resamples, 1% noise threshold, 0.05 significance). The dots
// are illustrative; the printed lines are from real runs of `cargo bench`
// on the book's shared VM (cargo 1.97, criterion 0.5.1, 2026-11-02): the
// interval and outliers from the 7th run, the change from the 6th, both
// on unchanged code.
type Phase = 'warm' | 'samples' | 'slope' | 'ci' | 'outliers' | 'compare';
type S = { phase: Phase; note: string };

const STATES: S[] = [
  { phase: 'warm', note: 'Warm-up: run the routine once, then twice, then four times… until 3 seconds have passed. That fills the caches and gives a rough time per iteration.' },
  { phase: 'samples', note: 'Measure 100 samples. Sample k runs k × d iterations, with d chosen so all of them take about 5 seconds. Each dot is one sample: its iteration count and its total time.' },
  { phase: 'slope', note: 'A good benchmark’s dots lie near a line. Its slope is the time per iteration. One iteration is never timed on its own: the clock is too coarse.' },
  { phase: 'ci', note: 'Resample the 100 dots with replacement, 100,000 times, and fit a line to each. The spread of those slopes gives the interval criterion prints: low, estimate, high.' },
  { phase: 'outliers', note: 'Samples far from the rest are flagged with Tukey’s fences: beyond 1.5 interquartile ranges is mild, beyond 3 is severe. They are reported, not thrown away.' },
  { phase: 'compare', note: 'Run it again and criterion compares with the saved samples. Here nothing changed in the code, yet it reported a 3% “improvement” with p = 0.00: the shared VM was just quieter.' },
];

// Illustrative samples: iterations k*d, time = slope*k + noise.
const PTS = Array.from({ length: 24 }, (_, k) => {
  const n = k + 1;
  const wob = [0, 3, -2, 4, -3, 1, -1, 2, 0, -4, 3, 1, -2, 2, 0, -1, 4, -3, 1, 0, 2, -2, 1, 0][k];
  const spike = k === 7 ? 26 : k === 15 ? 44 : 0;
  return { x: 40 + n * 13, y: 160 - n * 5.2 - wob - spike, spike: spike > 0, severe: spike > 30 };
});

export default function CriterionSteps() {
  const s = useSteps(STATES);
  const p = s.state.phase;
  const showPts = p !== 'warm';
  return (
    <StepFrame title="One benchmark, as criterion measures it" steps={s} note={s.state.note}>
      <Svg w={400} h={230} title="Criterion's samples, fitted line, confidence interval and outliers">
        {p === 'warm' ? (
          <g>
            <T x={10} y={20} size={11} weight={700} fill={tok('brand')}>warm-up: 1, 2, 4, 8, … iterations</T>
            {[1, 2, 4, 8, 16, 32].map((n, k) => (
              <Box key={n} x={10 + k * 62} y={44} w={Math.min(56, 12 + n * 1.4)} h={24} r={2} fill={tok('f1', 0.25)} stroke={tok('f1')}>
                <T x={10 + k * 62 + Math.min(56, 12 + n * 1.4) / 2} y={56} size={11} mono anchor="middle">{n}</T>
              </Box>
            ))}
            <T x={10} y={100} size={11}>until 3 s have passed, then:</T>
            <T x={10} y={120} size={11} mono>pick d so d + 2d + … + 100d iterations ≈ 5 s</T>
          </g>
        ) : (
          <g>
            <line x1={40} y1={168} x2={370} y2={168} stroke={tok('line')} strokeWidth={1.5} />
            <line x1={40} y1={20} x2={40} y2={168} stroke={tok('line')} strokeWidth={1.5} />
            <T x={370} y={182} size={11} anchor="end" fill={tok('muted')}>iterations in the sample (d, 2d, 3d …)</T>
            <T x={44} y={14} size={11} fill={tok('muted')}>total time</T>
            {(p === 'slope' || p === 'ci' || p === 'outliers' || p === 'compare') && (
              <line x1={40} y1={160} x2={365} y2={160 - 25 * 5.2} stroke={tok('brand')} strokeWidth={2} />
            )}
            {(p === 'ci' || p === 'compare') && (
              <g>
                <line x1={40} y1={160} x2={365} y2={160 - 25 * 5.6} stroke={tok('brand', 0.45)} strokeWidth={1.5} strokeDasharray="4 3" />
                <line x1={40} y1={160} x2={365} y2={160 - 25 * 4.8} stroke={tok('brand', 0.45)} strokeWidth={1.5} strokeDasharray="4 3" />
              </g>
            )}
            {showPts && PTS.map((d, k) => {
              const flag = p === 'outliers' && d.spike;
              const col = flag ? (d.severe ? 'danger' : 'warn') : 'f1';
              return <circle key={k} cx={d.x} cy={d.y} r={flag ? 5 : 3.5} fill={tok(col, flag ? 0.9 : 0.7)} />;
            })}
          </g>
        )}
        {p === 'slope' && <T x={10} y={210} size={11}>slope = time per iteration</T>}
        {p === 'ci' && <T x={10} y={210} size={11} mono>sum 1000  time: [685.77 ns 697.58 ns 708.85 ns]</T>}
        {p === 'outliers' && (
          <g>
            <T x={10} y={204} size={11} mono>Found 10 outliers among 100 measurements</T>
            <T x={10} y={222} size={11} mono>  8 high mild, 2 high severe</T>
          </g>
        )}
        {p === 'compare' && (
          <g>
            <T x={10} y={204} size={11} mono>change: [-4.93% -3.24% -1.49%] (p = 0.00)</T>
            <T x={10} y={222} size={11} mono fill={tok('danger')}>Performance has improved. (same code!)</T>
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
