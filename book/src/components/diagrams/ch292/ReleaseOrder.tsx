import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 292: what scripts/release.sh published on 2026-11-02, from
// engine/rust/README.md (Releasing) and book/STATUS.md, re-checked against
// npm view and crates.io's API. Crates go up in dependency order: each one
// can only be published once the crates it depends on are on crates.io.
const CRATES = ['viscosity-vir', 'viscosity-core', 'viscosity-frontend-js', 'viscosity-frontend-python', 'viscosity-cli', 'viscosity-wasm'];

export default function ReleaseOrder() {
  return (
    <Svg w={400} h={284} title="Six Rust crates published to crates.io in order: vir, core, frontend-js, frontend-python, cli, wasm. The sixth was refused once with HTTP 429 for publishing too many new crates and went out on a re-run. Two npm packages, @viscosity/cli and @viscosity/wasm, published to npm. Everything is version 0.0.1.">
      <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>CRATES.IO, IN DEPENDENCY ORDER</T>
      {CRATES.map((c, k) => {
        const y = 22 + k * 32;
        const late = k === 5;
        return (
          <g key={c}>
            <Box x={6} y={y} w={230} h={26} fill={late ? tok('warn', 0.15) : tok('f3', 0.12)} stroke={late ? tok('warn') : tok('f3')}>
              <T x={16} y={y + 13} size={12} mono>{k + 1}. {c}</T>
            </Box>
            {k < 5 && <Arrow x1={40} y1={y + 26} x2={40} y2={y + 32} />}
          </g>
        );
      })}
      <T x={246} y={42} size={11} fill={tok('muted')}>first run: 1 to 5</T>
      <T x={246} y={186} size={11} fill={tok('warn')} weight={700}>HTTP 429: too many</T>
      <T x={246} y={202} size={11} fill={tok('warn')} weight={700}>new crates; re-run</T>
      <T x={246} y={218} size={11} fill={tok('warn')} weight={700}>10 minutes later</T>
      <T x={6} y={228} size={11} weight={700} fill={tok('muted')}>NPM</T>
      <Box x={6} y={238} w={190} h={26} fill={tok('f1', 0.12)} stroke={tok('f1')}>
        <T x={16} y={251} size={12} mono>@viscosity/cli</T>
      </Box>
      <Box x={204} y={238} w={190} h={26} fill={tok('f1', 0.12)} stroke={tok('f1')}>
        <T x={214} y={251} size={12} mono>@viscosity/wasm</T>
      </Box>
      <T x={200} y={278} size={11} anchor="middle" fill={tok('muted')}>all at 0.0.1, published 2026-11-02</T>
    </Svg>
  );
}
