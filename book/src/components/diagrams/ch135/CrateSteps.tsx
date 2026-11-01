import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 135: the crates of engine/rust and how they depend on each
// other, from engine/rust/Cargo.toml and each crate's Cargo.toml
// (checked with `cargo tree --workspace --depth 1`). Arrows point from a
// crate to the crate it uses.
type Id = 'vir' | 'core' | 'fe' | 'cli' | 'wasm';
type S = { on: Id[]; edges: [Id, Id][]; dev?: boolean; show?: string; note: string };

const POS: Record<Id, { x: number; y: number; name: string }> = {
  vir: { x: 143, y: 206, name: 'viscosity-vir' },
  core: { x: 30, y: 128, name: 'viscosity-core' },
  fe: { x: 256, y: 128, name: 'viscosity-frontend-js' },
  cli: { x: 30, y: 40, name: 'viscosity-cli' },
  wasm: { x: 256, y: 40, name: 'viscosity-wasm' },
};
const W = 126;
const H = 34;

const ALL: [Id, Id][] = [['core', 'vir'], ['fe', 'vir'], ['fe', 'core'], ['cli', 'core'], ['cli', 'fe'], ['wasm', 'core'], ['wasm', 'fe']];

const STATES: S[] = [
  { on: ['vir', 'core', 'fe', 'cli', 'wasm'], edges: [], note: 'One workspace, listed in engine/rust/Cargo.toml as members: five of its six crates are drawn (the sixth, frontend-python, is chapter 187’s Python plugin). They share one Cargo.lock and one target/ folder, and cargo test --workspace builds and tests them all.' },
  { on: ['vir'], edges: [], show: 'vir', note: 'viscosity-vir is the IR. It depends on nothing. Everything other crates may use is marked pub; the rest is private to it.' },
  { on: ['vir', 'core'], edges: [['core', 'vir']], show: 'core', note: 'viscosity-core uses vir: the analyses, the planner, the LanguagePlugin trait and compile. It also re-exports the IR with pub use viscosity_vir as vir.' },
  { on: ['vir', 'core', 'fe'], edges: [['core', 'vir'], ['fe', 'vir'], ['fe', 'core']], show: 'fe', note: 'viscosity-frontend-js implements core’s LanguagePlugin for JavaScript, on top of oxc. It can only use what vir and core made pub.' },
  { on: ['vir', 'core', 'fe', 'cli', 'wasm'], edges: ALL, show: 'wasm', note: 'Two thin front doors use core and frontend-js: the cli crate builds the viscosity binary, the wasm crate the WebAssembly build for the playground. Nothing depends on them.' },
  { on: ['vir', 'core', 'fe', 'cli', 'wasm'], edges: ALL, dev: true, note: 'core’s own tests need a real plugin, so core lists frontend-js under [dev-dependencies]: used only to build core’s tests. As a normal dependency it would be a cycle, and cargo refuses cycles (“cyclic package dependency”).' },
];

function mid(a: Id, b: Id) {
  const p = POS[a];
  const q = POS[b];
  if (p.y === q.y) {
    // side by side: join the facing edges, a little above the middle
    const right = q.x > p.x;
    const y = p.y + H / 2 - 6;
    return { x1: right ? p.x + W : p.x, y1: y, x2: right ? q.x : q.x + W, y2: y };
  }
  const down = q.y > p.y;
  return { x1: p.x + W / 2, y1: down ? p.y + H : p.y, x2: q.x + W / 2, y2: down ? q.y : q.y + H };
}

export default function CrateSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="The crates of engine/rust" steps={s} note={st.note}>
      <Svg w={400} h={250} title="Five of the six crates in a workspace, with arrows from each crate to the crates it depends on">
        <rect x={20} y={22} width={372} height={226} rx={8} fill="none" stroke={tok('line')} strokeDasharray="5 4" />
        <T x={28} y={14} size={10} weight={700} fill={tok('muted')}>workspace engine/rust · one Cargo.lock · one target/</T>
        {st.edges.map(([a, b]) => {
          const m = mid(a, b);
          return <Arrow key={a + b} {...m} color={tok('ink', 0.55)} width={1.5} />;
        })}
        {st.dev && (() => {
          const m = mid('core', 'fe');
          return (
            <g>
              <Arrow x1={POS.core.x + W} y1={POS.core.y + H / 2 + 6} x2={POS.fe.x} y2={POS.fe.y + H / 2 + 6} color={tok('warn')} dash width={1.5} />
              <T x={(m.x1 + m.x2) / 2} y={POS.core.y + H / 2 + 18} size={9} anchor="middle" fill={tok('warn')}>dev only</T>
            </g>
          );
        })()}
        {(Object.keys(POS) as Id[]).map((id) => {
          const p = POS[id];
          const on = st.on.includes(id);
          const lit = st.show === id;
          return (
            <Box key={id} x={p.x} y={p.y} w={W} h={H} r={4} fill={lit ? tok('brand', 0.2) : tok('panel')} stroke={lit ? tok('brand') : tok('line')} opacity={on ? 1 : 0.45}>
              <T x={p.x + W / 2} y={p.y + H / 2} size={9} mono anchor="middle">{p.name}</T>
            </Box>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
