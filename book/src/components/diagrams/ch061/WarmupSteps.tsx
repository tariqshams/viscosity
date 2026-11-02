import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';

// How long successive calls of one function take as V8 warms it up, then
// what a deoptimization does. Bar heights are ILLUSTRATIVE (no units, not
// measured): they show the shape of warm-up, not real values.
const CODE = `function len(p) {
  return Math.hypot(p.x, p.y);
}
for (let i = 0; i < 1e6; i++) {
  total += len(ps[i]);
}
total += len({ y: 1, x: 2 });`;

const BARS = [9, 8.8, 8.6, 6, 5.8, 5.7, 3, 2.9, 2.2, 2.1, 2.1, 2, 2, 2, 8.4, 2.9, 2.2, 2.1];
type S = { line: number; upto: number; tier: string; note: string };

const STATES: S[] = [
  { line: 0, upto: 0, tier: 'not run yet', note: 'Each bar will be the time one batch of calls to len takes. The heights are illustrative, not measured: what matters is their shape.' },
  { line: 4, upto: 3, tier: 'Ignition', note: 'The first calls run as bytecode in the interpreter. It is the slowest tier, but it records feedback: every p so far has had the same shape, with x first.' },
  { line: 4, upto: 6, tier: 'Sparkplug', note: 'len is getting hot, so V8 compiles it to plain machine code quickly. Faster, though it makes no guesses yet.' },
  { line: 4, upto: 14, tier: 'Maglev, then TurboFan', note: 'The optimizing compilers use the feedback and guess that p always has that one shape. Code built on the guess is much faster, and the times settle: this is the warm, steady state a benchmark wants.' },
  { line: 6, upto: 15, tier: 'deoptimized', note: 'An object with a different shape arrives ({ y, x } has its properties in the other order). The guess is broken, so V8 throws the optimized code away and falls back: one slow batch.' },
  { line: 6, upto: 18, tier: 'optimized again', note: 'With the new feedback, V8 optimizes again and the times settle. A stopwatch around the first few calls, or around this hiccup, would measure the engine, not your code.' },
];

export default function WarmupSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const base = 120;
  return (
    <StepFrame title="A function warming up" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={150} title="Bars for successive batches of calls: tall at first, getting shorter as V8 moves the function up its tiers, one tall bar at a deoptimization, then short again. Heights are illustrative.">
        <line x1={8} x2={392} y1={base} y2={base} stroke={tok('line')} />
        {BARS.slice(0, st.upto).map((v, k) => (
          <rect key={k} x={12 + k * 21} y={base - v * 11} width={16} height={v * 11} rx={2}
            fill={k === 14 ? tok('danger', 0.75) : k < 6 ? tok('muted', 0.5) : tok('brand', 0.75)} />
        ))}
        <T x={8} y={138} size={11} fill={tok('muted')}>time per batch → (heights illustrative)</T>
        <T x={392} y={10} size={12} mono weight={700} anchor="end">tier: {st.tier}</T>
      </Svg>
    </StepFrame>
  );
}
