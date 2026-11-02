// Chapter 320: how engine/rust/packages/wasm/build.mjs turns the Rust
// crate engine/rust/crates/wasm into the npm package @viscosity/wasm and
// the book's Playground engine. Sizes are from dist/sizes.json of the
// committed build (wasm-bindgen 0.2.106, wasm-opt 132): cargo 1,844,592
// bytes; after wasm-bindgen 1,759,823 (web); after wasm-opt -O3
// 1,373,422 (498,049 gzipped). @viscosity/wasm 0.0.1 is on npm; --book
// copies the web build to book/public/wasm and book/src/vendor.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const STEPS: { title: string; sub: string; c: string }[] = [
  { title: 'crates/wasm (Rust)', sub: '#[wasm_bindgen] on compile, Output', c: 'f1' },
  { title: 'cargo build --target wasm32', sub: 'viscosity_wasm.wasm, 1.84 MB', c: 'f3' },
  { title: 'wasm-bindgen --target nodejs / web', sub: 'glue .js + .d.ts; .wasm 1.76 MB', c: 'f4' },
  { title: 'wasm-opt -O3', sub: '1.37 MB (0.50 MB gzipped)', c: 'f5' },
];

export default function WasmPipeline() {
  const bw = 300;
  const x0 = 50;
  const bh = 40;
  const gap = 18;
  const yEnd = 8 + STEPS.length * (bh + gap);
  return (
    <Svg w={400} h={yEnd + 64} title="Four build steps from the Rust crate to an optimized WebAssembly module, which then goes to the npm package and to the book's Playground">
      {STEPS.map((s, k) => {
        const y = 8 + k * (bh + gap);
        return (
          <g key={s.title}>
            <Box x={x0} y={y} w={bw} h={bh} r={5} fill={tok(s.c, 0.15)} stroke={tok(s.c)}>
              <T x={x0 + 10} y={y + 13} size={12} mono weight={700} fill={tok('ink')}>{s.title}</T>
              <T x={x0 + 10} y={y + 29} size={11} fill={tok('muted')}>{s.sub}</T>
            </Box>
            <Arrow x1={x0 + bw / 2} y1={y + bh} x2={x0 + bw / 2} y2={y + bh + gap - 1} color={tok('ink', 0.5)} />
          </g>
        );
      })}
      <Box x={8} y={yEnd} w={186} h={52} r={5} fill={tok('safe', 0.12)} stroke={tok('safe')}>
        <T x={18} y={yEnd + 16} size={12} weight={700} fill={tok('ink')}>npm: @viscosity/wasm</T>
        <T x={18} y={yEnd + 34} size={11} fill={tok('muted')}>0.0.1; Node and browsers</T>
      </Box>
      <Box x={206} y={yEnd} w={186} h={52} r={5} fill={tok('brand', 0.12)} stroke={tok('brand')}>
        <T x={216} y={yEnd + 16} size={12} weight={700} fill={tok('ink')}>this book's Playground</T>
        <T x={216} y={yEnd + 34} size={11} fill={tok('muted')}>Rust engine, in a worker</T>
      </Box>
    </Svg>
  );
}
