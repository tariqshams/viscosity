import { Svg, T, tok } from '../../viz/svg';

// Chapter 452b: what each job of .github/workflows/ci.yml protects, from
// the steps as committed. A full dot: the job checks that thing
// directly. A ring: it relies on it (engine-rust's parity reads the
// TypeScript engine's committed output and runs the TS engine for fuzz
// and multi-file; the book's smoke test runs both engines in the
// Playground and requires identical output).
const COLS = ['TS engine', 'Rust engine', 'Drip', 'chapters', 'book site', 'docs site'];
type M = 0 | 1 | 2; // none, relies on, checks
const ROWS: { job: string; m: M[] }[] = [
  { job: 'engine-ts', m: [2, 0, 0, 0, 0, 0] },
  { job: 'engine-rust', m: [1, 2, 0, 0, 0, 0] },
  { job: 'drip', m: [0, 0, 2, 0, 0, 0] },
  { job: 'book', m: [1, 1, 1, 2, 2, 0] },
  { job: 'website', m: [0, 0, 0, 0, 0, 2] },
];

export default function GateMap() {
  const X0 = 112;
  const DX = 47;
  return (
    <Svg w={400} h={222} title="A table of the five CI jobs against the parts of the repository each one checks">
      {COLS.map((c, k) => (
        <T key={c} x={X0 + k * DX} y={34} size={11} anchor="middle" fill={tok('muted')}>
          {c.split(' ').map((w, i) => (
            <tspan key={i} x={X0 + k * DX} dy={i === 0 ? -6 : 13}>{w}</tspan>
          ))}
        </T>
      ))}
      {ROWS.map((r, ri) => {
        const y = 66 + ri * 28;
        return (
          <g key={r.job}>
            <T x={10} y={y} size={12} mono>{r.job}</T>
            {r.m.map((v, k) => (v === 0 ? null : (
              <circle key={k} cx={X0 + k * DX} cy={y} r={7}
                fill={v === 2 ? tok('brand') : 'none'} stroke={tok('brand')} strokeWidth={2} />
            )))}
          </g>
        );
      })}
      <circle cx={16} cy={206} r={6} fill={tok('brand')} />
      <T x={28} y={206} size={12} fill={tok('muted')}>checks it</T>
      <circle cx={120} cy={206} r={6} fill="none" stroke={tok('brand')} strokeWidth={2} />
      <T x={132} y={206} size={12} fill={tok('muted')}>relies on it (uses its output or runs it)</T>
    </Svg>
  );
}
