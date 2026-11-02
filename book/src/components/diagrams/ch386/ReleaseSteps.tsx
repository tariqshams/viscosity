import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 386: the three things a Viscosity release would ship, and how
// far each gets today. Checked by the author on the repository at the
// time of writing:
//   versions:  engine/rust/Cargo.toml [workspace.package] version,
//              engine/ts/packages/cli/package.json,
//              engine/rust/packages/wasm/package.json (all 0.0.1)
//   build:     `cargo package --workspace` packages and verifies all six
//              crates (at first it stopped: "all dependencies must have a
//              version requirement specified when packaging");
//              packages/cli/build.mjs (esbuild) and packages/wasm/build.mjs
//   licences:  each crate has a LICENSE (vir's was missing at first);
//              THIRD_PARTY_LICENSES.txt in each npm package
//   checks:    .github/workflows/ci.yml packs and installs @viscosity/cli,
//              and runs cargo test and cargo package --workspace;
//              packages/wasm/smoke.mjs is run by hand
//   publish:   nothing was published when the chapter was first written;
//              on 2026-11-02 scripts/release.sh --npm-only published both
//              npm packages at 0.0.1, and --crates-only the six crates
//              (book/STATUS.md, engine/rust/README.md "Releasing").
type Cell = { t: string; ok: 'yes' | 'no' | 'part' };
type Row = { name: string; sub: string; cells: Cell[] };

const ROWS: Row[] = [
  {
    name: 'Rust crates', sub: 'crates.io',
    cells: [
      { t: 'Cargo.toml 0.0.1', ok: 'yes' },
      { t: 'cargo package works', ok: 'yes' },
      { t: 'LICENSE in each', ok: 'yes' },
      { t: 'test + package, CI', ok: 'yes' },
      { t: 'six crates, 0.0.1', ok: 'yes' },
    ],
  },
  {
    name: '@viscosity/cli', sub: 'npm, TS engine',
    cells: [
      { t: 'package.json 0.0.1', ok: 'yes' },
      { t: 'esbuild bundle', ok: 'yes' },
      { t: 'LICENSE + 3 notices', ok: 'yes' },
      { t: 'CI packs, installs', ok: 'yes' },
      { t: '0.0.1 on npm', ok: 'yes' },
    ],
  },
  {
    name: '@viscosity/wasm', sub: 'npm, Rust engine',
    cells: [
      { t: 'package.json 0.0.1', ok: 'yes' },
      { t: 'cargo + bindgen', ok: 'yes' },
      { t: 'LICENSE + 71 crates', ok: 'yes' },
      { t: 'smoke.mjs, by hand', ok: 'part' },
      { t: '0.0.1 on npm', ok: 'yes' },
    ],
  },
];

const COLS = ['version', 'build', 'licences', 'checked', 'published'];

const STATES: { upto: number; note: string }[] = [
  { upto: 0, note: 'Three numbers, all 0.0.1: one in the workspace Cargo.toml, which six crates inherit, and one in each npm package. They are set by hand; scripts/release.sh refuses to run if they differ, and CI checks that the packed CLI’s --version matches its own package.json.' },
  { upto: 1, note: 'Building a package. Both npm packages have a build.mjs that npm runs as prepack. For the crates, cargo package --workspace packages all six. At first it stopped at once: the workspace’s own crates depended on each other by path only, and crates.io needs a version too.' },
  { upto: 2, note: 'Licences. Each npm package ships LICENSE and a THIRD_PARTY_LICENSES.txt with the full text of everything bundled into it. A packaged crate carries only the files in its own folder, so each crate folder now has a LICENSE (crates/vir had none at first).' },
  { upto: 3, note: 'Checks before a release. Every push packs @viscosity/cli, installs the tarball in an empty folder and runs it. CI also tests and packages the crates. @viscosity/wasm has the same kind of test in smoke.mjs, but CI doesn’t run it.' },
  { upto: 4, note: 'Publishing. A crates.io version is permanent and an npm version can never be reused, so the first publish is a decision, and it was Tariq’s to make. On 2026-11-02 scripts/release.sh --npm-only published both npm packages at 0.0.1, and --crates-only then published the six crates, the last one on a second run.' },
];

const mark = (ok: Cell['ok']) => (ok === 'yes' ? '✓' : ok === 'no' ? '✗' : '~');
const col = (ok: Cell['ok']) => (ok === 'yes' ? 'safe' : ok === 'no' ? 'danger' : 'warn');

export default function ReleaseSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const L = 8;
  const top = 30;
  const rowH = 96;
  return (
    <StepFrame title="Three things to ship" steps={s} note={st.note}>
      <Svg w={400} h={top + ROWS.length * rowH} title="The Rust crates, @viscosity/cli and @viscosity/wasm, checked stage by stage for a release">
        {COLS.map((c, k) => (
          <T key={c} x={L + 132 + k * 52} y={12} size={11} anchor="middle" weight={700}
            fill={k === st.upto ? tok('brand') : tok('muted')}>{c}</T>
        ))}
        {ROWS.map((r, i) => {
          const y = top + i * rowH;
          const cur = r.cells[st.upto];
          return (
            <g key={r.name}>
              <T x={L} y={y + 8} size={11} weight={700} mono>{r.name}</T>
              <T x={L} y={y + 24} size={11} fill={tok('muted')}>{r.sub}</T>
              {r.cells.map((c, k) => {
                const on = k <= st.upto;
                return (
                  <Box key={k} x={L + 132 + k * 52 - 23} y={y} w={46} h={30} r={4}
                    fill={on ? tok(col(c.ok), 0.15) : tok('panel')}
                    stroke={k === st.upto ? tok(col(c.ok)) : tok('line')}>
                    <T x={L + 132 + k * 52} y={y + 15} size={14} anchor="middle"
                      fill={on ? tok(col(c.ok)) : tok('muted', 0.4)}>{on ? mark(c.ok) : '·'}</T>
                  </Box>
                );
              })}
              <Box x={L} y={y + 40} w={384} h={40} r={4} fill={tok(col(cur.ok), 0.08)} stroke={tok(col(cur.ok), 0.6)}>
                <T x={L + 10} y={y + 60} size={11} mono>{`${COLS[st.upto]}: ${cur.t}`}</T>
              </Box>
            </g>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
