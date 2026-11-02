import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';
import ts from '../../../../companion/ts/results/drip-bench-2026-11-02.json';
import rs from '../../../../companion/rust/results/drip-rs-bench-2026-11-02.json';

// Chapter 355: the ten corpus benchmark programs on three
// implementations, every number read from the two committed results
// files of 2026-11-02:
//   companion/ts/results/drip-bench-2026-11-02.json      (tree-walker, TS VM)
//   companion/rust/results/drip-rs-bench-2026-11-02.json (drip-rs)
// Nothing is typed in by hand. Each time is the best of 3 fresh
// processes, compile time included, on the same shared cloud VM.
type TsRow = { program: string; tree: number; vm: number };
type RsRow = { program: string; rust: number };

const tsRows = ts.rows as TsRow[];
const rsRows = rs.rows as RsRow[];
const timed = tsRows
  .map((t) => ({ ...t, rust: rsRows.find((r) => r.program === t.program)?.rust ?? 0 }))
  .filter((r) => r.rust > 0)
  .sort((a, b) => b.tree - a.tree);
const geo = (xs: number[]) => Math.exp(xs.reduce((a, x) => a + Math.log(x), 0) / xs.length);

type Series = { key: 'tree' | 'vm' | 'rust'; label: string; col: string };
const SERIES: Series[] = [
  { key: 'tree', label: 'tree-walker', col: 'muted' },
  { key: 'vm', label: 'TS VM', col: 'accent' },
  { key: 'rust', label: 'drip-rs', col: 'brand' },
];

type Ratio = { num: Series['key']; den: Series['key']; label: string };
type S = { kind: 'times' } | { kind: 'ratio'; r: Ratio };

const RATIOS: Ratio[] = [
  { num: 'tree', den: 'vm', label: 'TS VM vs tree-walker' },
  { num: 'vm', den: 'rust', label: 'drip-rs vs TS VM' },
  { num: 'tree', den: 'rust', label: 'drip-rs vs tree-walker' },
];

const ratiosOf = (r: Ratio) => timed.map((p) => p[r.num] / p[r.den]);
const range = (r: Ratio) => {
  const xs = ratiosOf(r);
  return `${Math.min(...xs).toFixed(2)}× to ${Math.max(...xs).toFixed(2)}×, geometric mean ${geo(xs).toFixed(2)}×`;
};
const slower = ratiosOf(RATIOS[0]).filter((v) => v < 1).length;

const STATES: (S & { note: string })[] = [
  { kind: 'times', note: `Milliseconds per program, best of three fresh processes, compile time included, on a log scale (each grid line is twice the last). ${timed.length} programs, sorted by the tree-walker’s time.` },
  { kind: 'ratio', r: RATIOS[0], note: `Part IV’s question: how many times as fast as the tree-walker is the TypeScript VM? ${range(RATIOS[0])}. Red bars are below 1×: on ${slower} of the ${timed.length} programs the VM is slower.` },
  { kind: 'ratio', r: RATIOS[1], note: `The same design and the same bytecode, ported to Rust: ${range(RATIOS[1])}. Little spread, except strings, where both VMs spend their time formatting numbers and building strings.` },
  { kind: 'ratio', r: RATIOS[2], note: `Both changes at once, a new design and a new language: ${range(RATIOS[2])}.` },
];

export default function ThreeWaySteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const L = 98;
  const W = 400 - L - 52;
  const top = 26;
  const rowH = 28;
  const H = top + timed.length * rowH + 22;
  return (
    <StepFrame title="Three implementations of Drip" steps={s} note={st.note}>
      <Svg w={400} h={H} title="Benchmark times and speed-ups for the TypeScript tree-walker, the TypeScript VM and drip-rs">
        {st.kind === 'times' && (() => {
          const lo = Math.log10(60);
          const hi = Math.log10(2500);
          const x = (ms: number) => L + ((Math.log10(ms) - lo) / (hi - lo)) * W;
          return (
            <g>
              {SERIES.map((se, k) => (
                <g key={se.key}>
                  <rect x={L + k * 96} y={6} width={10} height={10} rx={2} fill={tok(se.col)} />
                  <T x={L + k * 96 + 14} y={11} size={11}>{se.label}</T>
                </g>
              ))}
              {[100, 200, 400, 800, 1600].map((ms) => (
                <g key={ms}>
                  <line x1={x(ms)} x2={x(ms)} y1={top} y2={top + timed.length * rowH} stroke={tok('line')} strokeDasharray="3 3" />
                  <T x={x(ms)} y={top + timed.length * rowH + 10} size={11} anchor="middle" fill={tok('muted')}>{ms}</T>
                </g>
              ))}
              {timed.map((p, i) => {
                const y = top + i * rowH;
                return (
                  <g key={p.program}>
                    <title>{`${p.program}: tree-walker ${p.tree} ms, TS VM ${p.vm} ms, drip-rs ${p.rust} ms`}</title>
                    <T x={L - 6} y={y + 12} size={11} mono anchor="end">{p.program}</T>
                    {SERIES.map((se, k) => (
                      <rect key={se.key} x={L} y={y + 2 + k * 8} width={Math.max(2, x(p[se.key]) - L)} height={7} rx={1.5} fill={tok(se.col)} />
                    ))}
                    <T x={Math.max(x(p.tree), x(p.vm)) + 4} y={y + 8} size={11} mono fill={tok('muted')}>{p.tree}</T>
                  </g>
                );
              })}
            </g>
          );
        })()}
        {st.kind === 'ratio' && (() => {
          const xs = timed.map((p) => ({ program: p.program, v: p[st.r.num] / p[st.r.den] }));
          const lo = Math.log10(0.5);
          const hi = Math.log10(8);
          const x = (v: number) => L + ((Math.log10(v) - lo) / (hi - lo)) * W;
          return (
            <g>
              <T x={4} y={11} size={12} weight={700} fill={tok('brand')}>{`${st.r.label}: times as fast`}</T>
              <line x1={x(1)} x2={x(1)} y1={top - 4} y2={top + xs.length * rowH} stroke={tok('ink', 0.6)} strokeDasharray="3 3" />
              <T x={x(1)} y={top + xs.length * rowH + 10} size={11} anchor="middle" fill={tok('muted')}>1×</T>
              <T x={x(4)} y={top + xs.length * rowH + 10} size={11} anchor="middle" fill={tok('muted')}>4×</T>
              {xs.map((p, i) => {
                const y = top + i * rowH;
                const a = Math.min(x(1), x(p.v));
                const w = Math.max(2, Math.abs(x(p.v) - x(1)));
                return (
                  <g key={p.program}>
                    <T x={L - 6} y={y + 12} size={11} mono anchor="end">{p.program}</T>
                    <rect x={a} y={y + 5} width={w} height={14} rx={2} fill={tok(p.v >= 1 ? 'brand' : 'danger', 0.7)} />
                    <T x={Math.max(x(1), x(p.v)) + 4} y={y + 12} size={11} mono>{`${p.v.toFixed(2)}×`}</T>
                  </g>
                );
              })}
            </g>
          );
        })()}
      </Svg>
    </StepFrame>
  );
}
