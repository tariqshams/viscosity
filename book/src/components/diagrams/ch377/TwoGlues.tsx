import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// The chapter Compiling the engine to WebAssembly: the two wasm-bindgen
// targets that engine/rust/packages/wasm/build.mjs produces from one
// cargo build. dist/node/viscosity_wasm.js (CommonJS) ends with
// readFileSync + new WebAssembly.Module + new WebAssembly.Instance;
// dist/web/viscosity_wasm.js (an ES module) exports a default init()
// that fetches the module. Sizes from the build of 2026-11-02.
export default function TwoGlues() {
  return (
    <Svg w={400} h={226} title="One cargo build, two wasm-bindgen glues: Node loads the module synchronously, the browser asynchronously">
      <Box x={120} y={6} w={160} h={36} fill={tok('brand', 0.12)} stroke={tok('brand')}>
        <T x={200} y={18} size={12} weight={700} anchor="middle">viscosity_wasm.wasm</T>
        <T x={200} y={33} size={11} anchor="middle" fill={tok('muted')}>one cargo build</T>
      </Box>
      <Arrow x1={170} y1={44} x2={100} y2={78} />
      <Arrow x1={230} y1={44} x2={300} y2={78} />
      <T x={110} y={58} size={11} anchor="end" mono>--target nodejs</T>
      <T x={290} y={58} size={11} mono>--target web</T>
      <Box x={6} y={80} w={188} h={138} fill={tok('f1', 0.08)} stroke={tok('f1')}>
        <T x={100} y={96} size={12} weight={700} anchor="middle">dist/node (CommonJS)</T>
        <T x={16} y={120} size={11} mono>require('@viscosity/wasm')</T>
        <T x={16} y={140} size={11} mono>→ readFileSync(.wasm)</T>
        <T x={16} y={160} size={11} mono>→ new Module, Instance</T>
        <T x={16} y={180} size={11} mono>→ compile() ready</T>
        <T x={16} y={204} size={11} fill={tok('muted')}>synchronous: no await</T>
      </Box>
      <Box x={206} y={80} w={188} h={138} fill={tok('f2', 0.08)} stroke={tok('f2')}>
        <T x={300} y={96} size={12} weight={700} anchor="middle">dist/web (ES module)</T>
        <T x={216} y={120} size={11} mono>import init, {'{ compile }'}</T>
        <T x={216} y={140} size={11} mono>await init()</T>
        <T x={216} y={160} size={11} mono>→ fetch(.wasm), stream</T>
        <T x={216} y={180} size={11} mono>→ compile() ready</T>
        <T x={216} y={204} size={11} fill={tok('muted')}>asynchronous: await first</T>
      </Box>
    </Svg>
  );
}
