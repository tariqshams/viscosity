// Chapter 357: how the parity test is wired. scripts/gen_expected.mjs runs
// the TypeScript engine over every test program and writes tests/expected;
// crates/cli/tests/parity.rs compiles the same programs with the Rust
// engine and compares strings. Counts from `cargo test -p viscosity-cli
// --test parity -- --nocapture` (cargo 1.97, at 0.0.1): "parity: 190/190
// (54 Python)", that is 95 programs (68 JavaScript, 27 Python) in two
// bounds modes.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function ParityLoop() {
  return (
    <Svg w={400} h={250} title="The parity test: the TypeScript engine writes the expected files, the Rust engine is compared with them byte for byte">
      <Box x={120} y={8} w={160} h={44} fill={tok('panel')} stroke={tok('ink', 0.5)}>
        <T x={200} y={24} size={12} weight={700} anchor="middle">95 test programs</T>
        <T x={200} y={41} size={11} anchor="middle" fill={tok('muted')}>68 .js · 27 .py</T>
      </Box>
      <Arrow x1={150} y1={54} x2={90} y2={86} />
      <Arrow x1={250} y1={54} x2={310} y2={86} />
      <Box x={10} y={88} w={160} h={44} fill={tok('accent', 0.14)} stroke={tok('accent')}>
        <T x={90} y={104} size={12} weight={700} anchor="middle">TypeScript engine</T>
        <T x={90} y={121} size={11} mono anchor="middle">gen_expected.mjs</T>
      </Box>
      <Box x={230} y={88} w={160} h={44} fill={tok('brand', 0.14)} stroke={tok('brand')}>
        <T x={310} y={104} size={12} weight={700} anchor="middle">Rust engine</T>
        <T x={310} y={121} size={11} mono anchor="middle">parity.rs</T>
      </Box>
      <Arrow x1={90} y1={134} x2={90} y2={160} color={tok('accent')} />
      <Box x={10} y={162} w={160} h={44} fill={tok('panel')} stroke={tok('accent')} dash>
        <T x={90} y={178} size={11} mono anchor="middle">tests/expected</T>
        <T x={90} y={195} size={11} anchor="middle" fill={tok('muted')}>code + explain</T>
      </Box>
      <Arrow x1={172} y1={184} x2={226} y2={184} color={tok('safe')} />
      <Arrow x1={310} y1={134} x2={310} y2={160} color={tok('brand')} />
      <Box x={230} y={162} w={160} h={44} fill={tok('safe', 0.14)} stroke={tok('safe')}>
        <T x={310} y={178} size={12} weight={700} anchor="middle">same bytes?</T>
        <T x={310} y={195} size={11} mono anchor="middle">190/190 pairs</T>
      </Box>
      <T x={200} y={228} size={11} anchor="middle" fill={tok('muted')}>each program twice: default bounds, and --bounds assume</T>
    </Svg>
  );
}
