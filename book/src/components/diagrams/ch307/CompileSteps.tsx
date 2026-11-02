import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';
import matrix from '../../../../../engine/ts/packages/bench/results/matrix-2026-10-31.json';

// Chapter 307: section (b) of the benchmark matrix, compile speed, every
// number read from engine/ts/packages/bench/results/matrix-2026-10-31.json.
// cli.rows: one fresh process per compile, 5 runs, median ms.
// inProcess.rows: compile() in one warm Node process, 200 runs, median µs
// (TS: the reference engine; Rust: @viscosity/wasm's nodejs build).
type Stat = { best: number; median: number };
type CliRow = { program: string; lines: number; tsMs: Stat; rustMs: Stat };
type InRow = { program: string; tsUs: Stat; wasmUs: Stat };
const cs = matrix.compileSpeed;
const cli = cs.cli.rows as unknown as CliRow[];
const inp = cs.inProcess.rows as unknown as InRow[];
const rows = cli
  .map((c) => ({ ...c, ip: inp.find((r) => r.program === c.program) as InRow }))
  .sort((a, b) => b.tsMs.median - a.tsMs.median);

const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); const n = s.length; return n % 2 ? s[n >> 1] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const f1 = (x: number) => x.toFixed(1);
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const cliRatio = rows.map((r) => r.tsMs.median / r.rustMs.median);
const inRatio = rows.map((r) => r.ip.tsUs.median / r.ip.wasmUs.median);
const tsShare = rows.map((r) => r.ip.tsUs.median / 1000 / r.tsMs.median);
const rsShare = rows.map((r) => r.ip.wasmUs.median / 1000 / r.rustMs.median);

type Kind = 'cli' | 'inproc' | 'share' | 'totals';
const STATES: { kind: Kind; note: string }[] = [
  { kind: 'cli', note: `${rows.length} corpus programs, one fresh process per compile, the way a user runs viscosity build. Median of ${matrix.meta.settings.cliRuns} runs. TS CLI ${f1(Math.min(...rows.map((r) => r.tsMs.median)))} to ${f1(Math.max(...rows.map((r) => r.tsMs.median)))} ms, Rust CLI ${f1(Math.min(...rows.map((r) => r.rustMs.median)))} to ${f1(Math.max(...rows.map((r) => r.rustMs.median)))} ms. Per program, ${f1(Math.min(...cliRatio))}× to ${f1(Math.max(...cliRatio))}× (median ${f1(median(cliRatio))}×).` },
  { kind: 'inproc', note: `Now only compile(), called ${matrix.meta.settings.inProcessRuns} times in one warm Node process after ${matrix.meta.settings.inProcessWarmup} warm-up calls. Note the unit: microseconds. The Rust engine runs as WebAssembly in the same Node. Per program ${f1(Math.min(...inRatio))}× to ${f1(Math.max(...inRatio))}× (median ${f1(median(inRatio))}×).` },
  { kind: 'share', note: `How much of a CLI run is warm compiling? Divide each in-process median by the CLI median. TS: at most ${pct(Math.max(...tsShare))}. Rust: at most ${pct(Math.max(...rsShare))}. The rest is starting the process, loading code, and running it cold.` },
  { kind: 'totals', note: `The file’s own summary: sums of the medians over all ${rows.length} programs. The CLI ratio is bigger than the engine ratio because it mostly compares start-up: Node’s against a native binary’s.` },
];

const COL = { ts: 'accent', rust: 'brand' } as const;

export default function CompileSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const L = 14;
  const W = 330;
  const top = 34;
  const rh = 8;
  const H = st.kind === 'totals' ? 250 : top + rows.length * rh + 30;
  const legend = (a: string, b: string) => (
    <g>
      <rect x={L} y={6} width={10} height={10} rx={2} fill={tok(COL.ts)} />
      <T x={L + 14} y={11} size={10}>{a}</T>
      <rect x={L + 150} y={6} width={10} height={10} rx={2} fill={tok(COL.rust)} />
      <T x={L + 164} y={11} size={10}>{b}</T>
    </g>
  );
  const axis = (max: number, ticks: number[], unit: string) => (
    <g>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={L + (v / max) * W} x2={L + (v / max) * W} y1={top - 4} y2={top + rows.length * rh} stroke={tok('line')} strokeDasharray="3 3" />
          <T x={L + (v / max) * W} y={top + rows.length * rh + 10} size={9} anchor="middle" fill={tok('muted')}>{`${v} ${unit}`}</T>
        </g>
      ))}
    </g>
  );
  const pairs = (a: (r: (typeof rows)[0]) => number, b: (r: (typeof rows)[0]) => number, max: number, unit: string) =>
    rows.map((r, i) => {
      const y = top + i * rh;
      return (
        <g key={r.program}>
          <title>{`${r.program}: ${a(r)} ${unit} vs ${b(r)} ${unit}`}</title>
          <rect x={L} y={y} width={Math.max(1, (a(r) / max) * W)} height={3.4} fill={tok(COL.ts)} />
          <rect x={L} y={y + 3.6} width={Math.max(1, (b(r) / max) * W)} height={3.4} fill={tok(COL.rust)} />
        </g>
      );
    });
  return (
    <StepFrame title="How fast is the compiler?" steps={s} note={st.note}>
      <Svg w={400} h={H} title="Compile times of the TypeScript and Rust engines over the corpus, as whole processes and in-process">
        {st.kind === 'cli' && (
          <g>
            {legend('TS CLI (node)', 'Rust CLI (native)')}
            {axis(160, [50, 100, 150], 'ms')}
            {pairs((r) => r.tsMs.median, (r) => r.rustMs.median, 160, 'ms')}
          </g>
        )}
        {st.kind === 'inproc' && (
          <g>
            {legend('TS engine', 'Rust engine (wasm)')}
            {axis(1100, [250, 500, 750, 1000], 'µs')}
            {pairs((r) => r.ip.tsUs.median, (r) => r.ip.wasmUs.median, 1100, 'µs')}
          </g>
        )}
        {st.kind === 'share' && (
          <g>
            <T x={L} y={11} size={10}>each row: one CLI run = 100%</T>
            <rect x={L + 170} y={6} width={10} height={10} rx={2} fill={tok('brand')} />
            <T x={L + 184} y={11} size={10}>warm compile()</T>
            {rows.map((r, i) => {
              const y = top + i * rh;
              const half = W / 2 - 6;
              return (
                <g key={r.program}>
                  <title>{`${r.program}: TS ${pct(tsShare[i])}, Rust ${pct(rsShare[i])} of the CLI run`}</title>
                  <rect x={L} y={y} width={half} height={6} fill={tok('muted', 0.3)} />
                  <rect x={L} y={y} width={Math.max(1, tsShare[i] * half)} height={6} fill={tok('brand')} />
                  <rect x={L + half + 12} y={y} width={half} height={6} fill={tok('muted', 0.3)} />
                  <rect x={L + half + 12} y={y} width={Math.max(1, rsShare[i] * half)} height={6} fill={tok('brand')} />
                </g>
              );
            })}
            <T x={L} y={top + rows.length * rh + 10} size={10} mono>TS CLI</T>
            <T x={L + W / 2 + 6} y={top + rows.length * rh + 10} size={10} mono>Rust CLI</T>
          </g>
        )}
        {st.kind === 'totals' && (() => {
          const BW = 270;
          const bar = (y: number, label: string, v: number, max: number, unit: string, col: string) => (
            <g>
              <T x={L} y={y} size={10}>{label}</T>
              <rect x={L} y={y + 8} width={Math.max(2, (v / max) * BW)} height={14} rx={2} fill={tok(col)} />
              <T x={L + Math.max(2, (v / max) * BW) + 4} y={y + 15} size={10} mono>{`${v.toLocaleString('en-US')} ${unit}`}</T>
            </g>
          );
          const c = cs.cli.totalMedianMs;
          const p = cs.inProcess.totalMedianUs;
          return (
            <g>
              <T x={L} y={12} size={11} weight={700}>{`whole processes: ${cs.cli.totalSpeedup}× faster`}</T>
              {bar(30, 'TS CLI', c.ts, c.ts, 'ms', COL.ts)}
              {bar(62, 'Rust CLI', c.rust, c.ts, 'ms', COL.rust)}
              <T x={L} y={124} size={11} weight={700}>{`compile() only: ${cs.inProcess.totalSpeedup}× faster`}</T>
              {bar(142, 'TS engine', p.ts, p.ts, 'µs', COL.ts)}
              {bar(174, 'Rust engine as wasm', p.wasm as number, p.ts, 'µs', COL.rust)}
              <T x={L} y={228} size={10} fill={tok('muted')}>{`compiled code identical: CLI ${cs.cli.allIdentical ? 'yes' : 'no'}, in-process ${cs.inProcess.allIdentical ? 'yes' : 'no'}`}</T>
            </g>
          );
        })()}
      </Svg>
    </StepFrame>
  );
}
