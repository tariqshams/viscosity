import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';
import ts from '../../../../companion/ts/results/drip-bench-2026-10-31.json';
import rs from '../../../../companion/rust/results/drip-rs-bench-2026-10-31.json';

// Chapter 275: the corpus benchmark programs on three implementations,
// every number read from the two committed results files:
//   companion/ts/results/drip-bench-2026-10-31.json   (tree-walker, TS VM)
//   companion/rust/results/drip-rs-bench-2026-10-31.json (drip-rs)
// Nothing is typed in by hand. zoo_batch (fixed 10 s) and string_equality
// (refused by both VMs) are reported separately, not drawn as times.
type TsRow = { program: string; tree: number; vm: number | null; vmError?: string };
type RsRow = { program: string; rust: number | null; rustError?: string; stdout: string };

const FIXED = 'zoo_batch';
const tsRows = ts.rows as TsRow[];
const rsRows = rs.rows as RsRow[];
const joined = tsRows.map((t) => ({ ...t, rust: rsRows.find((r) => r.program === t.program)?.rust ?? null }));
const timed = joined
  .filter((r) => r.vm !== null && r.rust !== null && r.program !== FIXED)
  .sort((a, b) => b.tree - a.tree) as { program: string; tree: number; vm: number; rust: number }[];
const geo = (xs: number[]) => Math.exp(xs.reduce((a, x) => a + Math.log(x), 0) / xs.length);

type Series = { key: 'tree' | 'vm' | 'rust'; label: string; col: string };
const SERIES: Series[] = [
  { key: 'tree', label: 'TS tree-walker', col: 'muted' },
  { key: 'vm', label: 'TS VM', col: 'accent' },
  { key: 'rust', label: 'drip-rs', col: 'brand' },
];

type Ratio = { num: Series['key']; den: Series['key']; label: string };
type S = { kind: 'times' } | { kind: 'ratio'; r: Ratio } | { kind: 'odd' };

const RATIOS: Ratio[] = [
  { num: 'tree', den: 'vm', label: 'TS VM vs TS tree-walker' },
  { num: 'vm', den: 'rust', label: 'drip-rs vs TS VM' },
  { num: 'tree', den: 'rust', label: 'drip-rs vs TS tree-walker' },
];

const batches = (stdout: string) => stdout.split(' ')[1];
const zoo = rsRows.find((r) => r.program === FIXED) as RsRow;
const streq = rsRows.find((r) => r.rustError) as RsRow;
const streqTs = tsRows.find((r) => r.program === streq.program) as TsRow;

const ratiosOf = (r: Ratio) => timed.map((p) => p[r.num] / p[r.den]);
const range = (r: Ratio) => {
  const xs = ratiosOf(r);
  return `${Math.min(...xs).toFixed(2)}× to ${Math.max(...xs).toFixed(2)}×, geometric mean ${geo(xs).toFixed(2)}×`;
};

const STATES: (S & { note: string })[] = [
  { kind: 'times', note: `Seconds per program, on a log scale: the 1 s and 10 s lines are ten times apart, and a bar half as long is not half the time. ${timed.length} programs could be timed on all three. Compile time is included.` },
  { kind: 'ratio', r: RATIOS[0], note: `Part IV’s question: how many times faster is the TS VM than the tree-walker? ${range(RATIOS[0])}. Below 1× means slower: two programs got slower.` },
  { kind: 'ratio', r: RATIOS[1], note: `The same design, ported to Rust: ${range(RATIOS[1])}. Much less spread: the two VMs do the same work per instruction.` },
  { kind: 'ratio', r: RATIOS[2], note: `Both changes at once, a new design and a new language: ${range(RATIOS[2])}.` },
  { kind: 'odd', note: 'Two programs have no bar. zoo_batch runs for a fixed ten seconds on every implementation; what differs is how much it gets done. string_equality is refused by both VMs.' },
];

export default function ThreeWaySteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const L = 98;
  const W = 400 - L - 58;
  const top = 26;
  const rowH = 30;
  const H = top + timed.length * rowH + 22;
  return (
    <StepFrame title="Three implementations of Drip" steps={s} note={st.note}>
      <Svg w={400} h={H} title="Benchmark times and speed-ups for the TypeScript tree-walker, the TypeScript VM and drip-rs">
        {st.kind === 'times' && (() => {
          const lo = Math.log10(200);
          const hi = Math.log10(60000);
          const x = (ms: number) => L + ((Math.log10(ms) - lo) / (hi - lo)) * W;
          return (
            <g>
              {SERIES.map((se, k) => (
                <g key={se.key}>
                  <rect x={L + k * 92} y={6} width={10} height={10} rx={2} fill={tok(se.col)} />
                  <T x={L + k * 92 + 14} y={11} size={10}>{se.label}</T>
                </g>
              ))}
              {[1000, 10000].map((ms) => (
                <g key={ms}>
                  <line x1={x(ms)} x2={x(ms)} y1={top} y2={top + timed.length * rowH} stroke={tok('line')} strokeDasharray="3 3" />
                  <T x={x(ms)} y={top + timed.length * rowH + 8} size={9} anchor="middle" fill={tok('muted')}>{`${ms / 1000} s`}</T>
                </g>
              ))}
              {timed.map((p, i) => {
                const y = top + i * rowH;
                return (
                  <g key={p.program}>
                    <title>{`${p.program}: tree-walker ${p.tree} ms, TS VM ${p.vm} ms, drip-rs ${p.rust} ms`}</title>
                    <T x={L - 6} y={y + 13} size={10} mono anchor="end">{p.program}</T>
                    {SERIES.map((se, k) => (
                      <rect key={se.key} x={L} y={y + 2 + k * 8} width={Math.max(2, x(p[se.key]) - L)} height={7} rx={1.5} fill={tok(se.col)} />
                    ))}
                    <T x={x(p.tree) + 4} y={y + 6} size={8} mono fill={tok('muted')}>{`${(p.tree / 1000).toFixed(1)}`}</T>
                    <T x={x(p.rust) + 4} y={y + 22} size={8} mono fill={tok('brand')}>{`${(p.rust / 1000).toFixed(2)}`}</T>
                  </g>
                );
              })}
            </g>
          );
        })()}
        {st.kind === 'ratio' && (() => {
          const xs = timed.map((p) => ({ program: p.program, v: p[st.r.num] / p[st.r.den] }));
          const lo = Math.log10(0.5);
          const hi = Math.log10(20);
          const x = (v: number) => L + ((Math.log10(v) - lo) / (hi - lo)) * W;
          return (
            <g>
              <T x={8} y={11} size={11} weight={700} fill={tok('brand')}>{`${st.r.label}: times as fast (log scale)`}</T>
              <line x1={x(1)} x2={x(1)} y1={top - 4} y2={top + xs.length * rowH} stroke={tok('ink', 0.6)} strokeDasharray="3 3" />
              <T x={x(1)} y={top + xs.length * rowH + 8} size={9} anchor="middle" fill={tok('muted')}>1×</T>
              <T x={x(10)} y={top + xs.length * rowH + 8} size={9} anchor="middle" fill={tok('muted')}>10×</T>
              {xs.map((p, i) => {
                const y = top + i * rowH;
                const a = Math.min(x(1), x(p.v));
                const w = Math.max(2, Math.abs(x(p.v) - x(1)));
                return (
                  <g key={p.program}>
                    <T x={L - 6} y={y + 13} size={10} mono anchor="end">{p.program}</T>
                    <rect x={a} y={y + 6} width={w} height={14} rx={2} fill={tok(p.v >= 1 ? 'brand' : 'danger', 0.7)} />
                    <T x={Math.max(x(1), x(p.v)) + 4} y={y + 13} size={9} mono>{`${p.v.toFixed(2)}×`}</T>
                  </g>
                );
              })}
            </g>
          );
        })()}
        {st.kind === 'odd' && (
          <g>
            <T x={8} y={20} size={12} weight={700} mono>zoo_batch</T>
            <T x={8} y={38} size={10}>{`time: ${(joined.find((r) => r.program === FIXED)?.tree ?? 0) / 1000} s, ${(joined.find((r) => r.program === FIXED)?.vm ?? 0) / 1000} s, ${(zoo.rust ?? 0) / 1000} s: the clock stops it`}</T>
            <T x={8} y={56} size={10}>{`drip-rs’s stdout: “${zoo.stdout}”`}</T>
            <T x={8} y={72} size={10} fill={tok('brand')}>{`→ ${batches(zoo.stdout)} batches of 10,000 loop turns`}</T>
            <T x={8} y={88} size={10} fill={tok('muted')}>(the TypeScript files record no batch count)</T>
            <T x={8} y={124} size={12} weight={700} mono>{streq.program}</T>
            <T x={8} y={142} size={10}>{`tree-walker: ${streqTs.tree / 1000} s`}</T>
            <T x={8} y={160} size={10}>TS VM and drip-rs, the same compile error:</T>
            <T x={8} y={176} size={9.5} mono fill={tok('danger')}>{streq.rustError}</T>
            <T x={8} y={196} size={10} fill={tok('muted')}>{streqTs.vmError === streq.rustError ? 'The two results files record identical messages.' : 'The two files record different messages.'}</T>
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
