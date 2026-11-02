import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';

// The chapter Compiling the engine to WebAssembly: the three stages of
// engine/rust/packages/wasm/build.mjs and what each does to the .wasm.
// Measured for the book on 2026-11-02 from the current tree, in an empty
// target directory: cargo 1.97 (release, thin LTO), wasm-bindgen 0.2.106
// --target web, wasm-opt 132 -O3 with build.mjs's feature flags, gzip from
// Node's zlib at level 9. Section sizes come from walking the module's
// section headers. The final file is byte-identical to
// book/public/wasm/viscosity_wasm_bg.wasm (1,373,422 bytes).
type Part = { label: string; bytes: number; col: string };
type Stage = { name: string; cmd: string; total: number; gzip: number; exports: number; parts: Part[] };

const code = (b: number): Part => ({ label: 'code', bytes: b, col: 'brand' });
const data = (b: number): Part => ({ label: 'data', bytes: b, col: 'accent' });
const names = (b: number): Part => ({ label: 'names', bytes: b, col: 'danger' });
const rest = (total: number, ps: Part[]): Part => ({ label: 'other', bytes: total - ps.reduce((s, p) => s + p.bytes, 0), col: 'muted' });

const mk = (name: string, cmd: string, total: number, gzip: number, exports: number, ps: Part[]): Stage =>
  ({ name, cmd, total, gzip, exports, parts: [...ps, rest(total, ps)] });

const STAGES: Stage[] = [
  mk('cargo', 'cargo build --release', 1844592, 537663, 75, [code(1452381), data(129015), names(248856)]),
  mk('wasm-bindgen', 'wasm-bindgen --target web', 1759823, 530798, 15, [code(1369943), data(129015), names(257305)]),
  mk('wasm-opt', 'wasm-opt -O3', 1373422, 498049, 15, [code(1248736), data(121906)]),
];

type S = { upto: number; gz?: boolean; note: string };
const STATES: S[] = [
  { upto: 0, note: 'Cargo compiles the crate, the engine and 71 third-party crates for wasm32-unknown-unknown. It has 75 exports, and 58 of them are __wbindgen_describe_ functions, which JavaScript will never call. A 7 KB custom section, __wasm_bindgen_unstable, is for the CLI too.' },
  { upto: 1, note: 'wasm-bindgen runs the describe functions in its own small interpreter, writes the JS glue from what they report, then deletes them and the custom section. 15 exports are left, and the code is 82 KB smaller.' },
  { upto: 2, note: 'wasm-opt -O3 optimises the code again (9% smaller) and drops the name section: 257 KB of function names, for stack traces and profilers. Together: 386 KB less.' },
  { upto: 2, gz: true, note: 'Now compress each stage with gzip, as a web server usually would. Names compress well, so over the wire wasm-opt saves only 33 KB of 531 KB, about 6%. The download is about 498 KB.' },
];

const kb = (b: number) => `${(b / 1000).toFixed(0)} KB`;

export default function PipelineSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const L = 12;
  const W = 376;
  const max = STAGES[0].total;
  const x = (b: number) => (b / max) * W;
  return (
    <StepFrame title="From cargo to a 1.4 MB .wasm" steps={s} note={st.note}>
      <Svg w={400} h={252} title="The size of the Rust engine's .wasm after cargo, wasm-bindgen and wasm-opt, by section, and gzipped">
        {[['code', 'brand'], ['data', 'accent'], ['names', 'danger'], ['other', 'muted']].map(([l, c], k) => (
          <g key={l}>
            <rect x={L + k * 80} y={6} width={10} height={10} rx={2} fill={tok(c)} />
            <T x={L + k * 80 + 14} y={11} size={11}>{l}</T>
          </g>
        ))}
        {STAGES.map((g, i) => {
          const y = 34 + i * 74;
          const on = i <= st.upto;
          let acc = 0;
          return (
            <g key={g.name} opacity={on ? 1 : 0.18}>
              <T x={L} y={y} size={11} weight={700} mono>{g.name}</T>
              <T x={L + W} y={y} size={11} mono anchor="end" fill={tok('muted')}>{`${g.exports} exports`}</T>
              {g.parts.map((p) => {
                const x0 = L + x(acc);
                acc += p.bytes;
                return p.bytes > 0 ? (
                  <rect key={p.label} x={x0} y={y + 10} width={Math.max(1, x(p.bytes) - 0.5)} height={18} fill={tok(p.col, st.gz ? 0.3 : 0.85)} />
                ) : null;
              })}
              {st.gz && (
                <g>
                  <rect x={L} y={y + 31} width={x(g.gzip)} height={6} fill={tok('safe')} />
                  <T x={L + x(g.gzip) + 4} y={y + 34} size={11} mono fill={tok('safe')}>{`gzipped: ${kb(g.gzip)}`}</T>
                </g>
              )}
              <T x={L} y={y + 48} size={11} mono>{`${g.total.toLocaleString('en-US')} B`}</T>
              <T x={L + W} y={y + 48} size={11} mono anchor="end" fill={tok('muted')}>{g.cmd}</T>
            </g>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
