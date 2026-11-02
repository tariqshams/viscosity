import { Svg, T, tok } from '../../viz/svg';

// The chapter How fast is the compiler?: where one CLI run's time goes.
// Medians of 21 fresh processes each, run for the book on 2026-11-02 on
// the shared 4-vCPU VM (load average about 2), one round of three:
// node -e 0 39.0 ms; TS CLI --version 92.1 ms; TS CLI build basic_soa.js
// 112.1 ms; Rust CLI --version 3.9 ms; Rust CLI build 4.1 ms. The pieces
// are differences of those medians, so they are approximate.
type Seg = { label: string; ms: number; col: string };
const TS: Seg[] = [
  { label: 'start Node', ms: 39.0, col: 'f4' },
  { label: 'load the bundle', ms: 92.1 - 39.0, col: 'f2' },
  { label: 'compile', ms: 112.1 - 92.1, col: 'brand' },
];
const RS: Seg[] = [
  { label: 'start', ms: 3.9, col: 'f4' },
  { label: 'compile', ms: 4.1 - 3.9, col: 'brand' },
];
const L = 10;
const W = 380;
const MAX = 115;
const x = (ms: number) => (ms / MAX) * W;

function Bar({ y, segs, name }: { y: number; segs: Seg[]; name: string }) {
  let acc = 0;
  const total = segs.reduce((s, g) => s + g.ms, 0);
  return (
    <g>
      <T x={L} y={y - 10} size={12} weight={700}>{`${name}: ${total.toFixed(1)} ms`}</T>
      {segs.map((g) => {
        const x0 = L + x(acc);
        acc += g.ms;
        return <rect key={g.label} x={x0} y={y} width={Math.max(1.5, x(g.ms))} height={22} fill={tok(g.col, 0.75)} stroke={tok('paper')} />;
      })}
    </g>
  );
}

export default function WhereTimeGoes() {
  const legend = [...TS];
  return (
    <Svg w={400} h={196} title="One CLI build, split into starting the runtime, loading the code and compiling, for the TypeScript and Rust CLIs">
      <Bar y={28} segs={TS} name="TS CLI build" />
      <Bar y={86} segs={RS} name="Rust CLI build" />
      {legend.map((g, k) => (
        <g key={g.label}>
          <rect x={L} y={124 + k * 16} width={10} height={10} rx={2} fill={tok(g.col, 0.75)} />
          <T x={L + 14} y={129 + k * 16} size={11}>{`${g.label} ≈ ${g.ms.toFixed(0)} ms`}</T>
        </g>
      ))}
      <T x={L} y={186} size={11} fill={tok('muted')}>Rust: start ≈ 3.9 ms, compile ≈ 0.2 ms (a sliver)</T>
    </Svg>
  );
}
