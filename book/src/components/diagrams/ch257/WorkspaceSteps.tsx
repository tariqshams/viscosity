// Chapter 257: how the TypeScript engine's packages (engine/ts/packages)
// map onto the crates of the Rust workspace (engine/rust/crates), and what
// each crate pulls in. The pairing follows engine/rust/README.md ("Each
// Rust module corresponds to one TypeScript file"); the package counts come
// from `cargo tree -p <crate> -e normal --prefix none | sort -u`, run with
// cargo 1.97 when the chapter was written (each count includes the crate
// itself).
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const ROWS = [
  { ts: 'core/src/vir.ts', rs: 'vir' },
  { ts: 'core/src/*.ts', rs: 'core' },
  { ts: 'frontend-js', rs: 'frontend-js' },
  { ts: 'frontend-python', rs: 'frontend-python' },
  { ts: 'cli', rs: 'cli' },
  { ts: 'playground', rs: 'wasm' },
  { ts: 'bench/e2e/*.js', rs: 'tests (inputs)' },
] as const;

type S = { hi: number[]; tag?: string; parity?: boolean; note: string };

const STATES: S[] = [
  { hi: [], note: 'Left: the packages of the TypeScript engine you built in Part VIII. Right: the crates of engine/rust, one Cargo.toml each, built together as one workspace. Most rows are one-to-one, and inside them each Rust module ports one TypeScript file.' },
  { hi: [0, 1], tag: 'vir: 1 package · core: 6', note: 'The TypeScript core package holds the IR in vir.ts. The port gives the IR a crate of its own that depends on nothing at all. core adds the SSA builder, the CFG, the analyses, the planner and the plugin trait, and pulls in only indexmap and rustc-hash.' },
  { hi: [2], tag: 'frontend-js: 82 packages', note: 'The JavaScript plugin swaps acorn for oxc 0.156. That one choice is most of the dependency tree: cargo tree lists 82 packages for this crate, almost all of them oxc and what oxc needs.' },
  { hi: [3], tag: 'frontend-python: 7 packages', note: 'The Python plugin has its own tokenizer and parser, as the TypeScript one does, so it needs nothing beyond vir, core and indexmap.' },
  { hi: [4, 5], tag: 'cli: + serde_json · wasm: + wasm-bindgen', note: 'Two thin front doors. cli builds the viscosity binary (cli.ts and profile.ts) and reads profiles with serde_json. wasm wraps compile for the browser with wasm-bindgen (chapter 277).' },
  { hi: [6], tag: 'programs, not code', note: 'Some of the TypeScript tree is not ported at all but reused: the corpus programs and the end-to-end benchmarks are inputs to the Rust tests, next to programs written for the port in tests/extra.' },
  { hi: [0, 1, 2, 3, 4, 5, 6], parity: true, note: 'And the TypeScript engine itself is the test oracle. scripts/gen_expected.mjs runs it on every program and writes tests/expected; crates/cli/tests/parity.rs runs the Rust engine on the same programs and compares the bytes.' },
];

export default function WorkspaceSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const y0 = 34;
  const rh = 27;
  const yEnd = y0 + ROWS.length * rh;
  return (
    <StepFrame title="From engine/ts to engine/rust" steps={s} note={st.note}>
      <Svg w={400} h={268} title="The TypeScript engine's packages paired with the Rust workspace's crates">
        <T x={14} y={16} size={11} weight={700} fill={tok('accent')}>engine/ts/packages</T>
        <T x={230} y={16} size={11} weight={700} fill={tok('brand')}>engine/rust/crates</T>
        {ROWS.map((r, k) => {
          const y = y0 + k * rh;
          const on = st.hi.includes(k);
          return (
            <g key={r.ts}>
              <Box x={8} y={y} w={146} h={21} r={3} fill={on ? tok('accent', 0.15) : tok('panel')} stroke={on ? tok('accent') : tok('line')}>
                <T x={16} y={y + 10.5} size={10.5} mono>{r.ts}</T>
              </Box>
              <Arrow x1={156} y1={y + 10.5} x2={222} y2={y + 10.5} color={on ? tok('brand') : tok('ink', 0.25)} width={on ? 2 : 1.2} />
              <Box x={226} y={y} w={166} h={21} r={3} fill={on ? tok('brand', 0.18) : tok('panel')} stroke={on ? tok('brand') : tok('line')}>
                <T x={236} y={y + 10.5} size={10.5} mono>{r.rs}</T>
              </Box>
            </g>
          );
        })}
        {st.tag && !st.parity && (
          <T x={200} y={yEnd + 14} size={11} mono anchor="middle" fill={tok('brand')}>{st.tag}</T>
        )}
        {st.parity && (
          <Box x={8} y={yEnd + 2} w={384} h={30} r={4} fill={tok('safe', 0.12)} stroke={tok('safe')}>
            <T x={200} y={yEnd + 17} size={10.5} anchor="middle">TS output → tests/expected ← parity.rs: same bytes</T>
          </Box>
        )}
      </Svg>
    </StepFrame>
  );
}
