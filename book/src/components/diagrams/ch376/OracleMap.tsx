import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// The chapter TypeScript vs Rust: differential tests. The three things a
// test of engine/rust can trust (an oracle) and the comparisons between
// them: parity.rs and the wasm check compare the Rust engine with the TS
// engine's fixtures; differential.rs compares the compiled program's
// behaviour with the original's; scripts/fuzz.mjs does both on generated
// programs. A bug shared by both engines lies on the bottom edge, which no
// comparison between the two engines can see.
export default function OracleMap() {
  return (
    <Svg w={400} h={238} title="Three oracles: the original program, the TypeScript engine and the Rust engine, and which tests compare which">
      <Box x={130} y={8} w={140} h={44} fill={tok('f2', 0.14)} stroke={tok('f2')}>
        <T x={200} y={24} size={12} weight={700} anchor="middle">the original</T>
        <T x={200} y={40} size={11} anchor="middle" fill={tok('muted')}>run with node / python3</T>
      </Box>
      <Box x={8} y={168} w={130} h={44} fill={tok('f1', 0.14)} stroke={tok('f1')}>
        <T x={73} y={184} size={12} weight={700} anchor="middle">TS engine</T>
        <T x={73} y={200} size={11} anchor="middle" fill={tok('muted')}>the reference</T>
      </Box>
      <Box x={262} y={168} w={130} h={44} fill={tok('f3', 0.14)} stroke={tok('f3')}>
        <T x={327} y={184} size={12} weight={700} anchor="middle">Rust engine</T>
        <T x={327} y={200} size={11} anchor="middle" fill={tok('muted')}>native and wasm</T>
      </Box>
      <Arrow x1={92} y1={166} x2={160} y2={54} color={tok('ink', 0.55)} />
      <T x={58} y={108} size={11} weight={600}>fuzzer</T>
      <T x={58} y={122} size={11} fill={tok('muted')}>behaviour</T>
      <Arrow x1={308} y1={166} x2={240} y2={54} color={tok('ink', 0.55)} />
      <T x={290} y={108} size={11} weight={600}>node, python3</T>
      <T x={290} y={122} size={11} fill={tok('muted')}>differentials</T>
      <Arrow x1={260} y1={182} x2={140} y2={182} color={tok('brand')} />
      <T x={200} y={162} size={11} weight={600} anchor="middle" fill={tok('brand')}>parity, wasm,</T>
      <T x={200} y={174} size={11} weight={600} anchor="middle" fill={tok('brand')}>fuzzer</T>
      <T x={200} y={230} size={11} anchor="middle" fill={tok('danger')}>a bug in both engines: this edge sees nothing</T>
    </Svg>
  );
}
