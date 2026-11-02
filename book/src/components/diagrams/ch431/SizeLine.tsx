import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 430b: how the size rung of plan_one (engine/rust/crates/core/src/
// plan.rs) treats four kinds of size against the default min_size of 64.
// The verdicts are real `viscosity explain` output (rustc 1.97 release
// build) for this chapter's l1.js (at most 100; measured 25 with
// --profile) and tests/extra/upper_bound.js (small: at most 40), and for
// s3.js from the previous chapter (size unknown statically).
const X0 = 20;
const X1 = 330; // the value 120 sits here
const x = (v: number) => X0 + ((X1 - X0) * v) / 120;

type Row = { label: string; kind: 'max' | 'point' | 'unknown'; v: number; verdict: string; keep: boolean };
const ROWS: Row[] = [
  { label: 'at most 100 (estimate)', kind: 'max', v: 100, verdict: 'soa', keep: false },
  { label: 'about 25 (measured)', kind: 'point', v: 25, verdict: 'kept', keep: true },
  { label: 'at most 40 (estimate)', kind: 'max', v: 40, verdict: 'kept', keep: true },
  { label: 'size unknown', kind: 'unknown', v: 120, verdict: 'soa', keep: false },
];

export default function SizeLine() {
  const thr = x(64);
  return (
    <Svg w={400} h={250} title="Four sizes against a threshold of 64: a maximum above it passes, a measurement or maximum below it is kept, and an unknown size passes">
      <line x1={thr} y1={10} x2={thr} y2={214} stroke={tok('danger')} strokeWidth={2} strokeDasharray="5 4" />
      <T x={thr} y={228} size={11} anchor="middle" weight={700} fill={tok('danger')}>min_size 64</T>
      <line x1={X0} y1={214} x2={X1 + 10} y2={214} stroke={tok('ink', 0.5)} strokeWidth={1.5} />
      {[0, 25, 40, 100].map((v) => (
        <T key={v} x={x(v)} y={242} size={11} anchor="middle" fill={tok('muted')}>{v}</T>
      ))}
      {ROWS.map((r, k) => {
        const y = 20 + k * 50;
        const col = r.keep ? tok('warn') : tok('safe');
        return (
          <g key={r.label}>
            <T x={X0} y={y} size={11}>{r.label}</T>
            {r.kind === 'max' && <Box x={X0} y={y + 10} w={x(r.v) - X0} h={14} r={3} fill={tok('brand', 0.15)} stroke={tok('brand')} />}
            {r.kind === 'point' && <circle cx={x(r.v)} cy={y + 17} r={6} fill={tok('brand')} />}
            {r.kind === 'unknown' && <Arrow x1={X0} y1={y + 17} x2={X1 + 10} y2={y + 17} color={tok('brand')} dash />}
            <Box x={350} y={y + 4} w={46} h={24} fill={tok(r.keep ? 'warn' : 'safe', 0.15)} stroke={col}>
              <T x={373} y={y + 16} size={11} weight={700} anchor="middle">{r.verdict}</T>
            </Box>
          </g>
        );
      })}
    </Svg>
  );
}
