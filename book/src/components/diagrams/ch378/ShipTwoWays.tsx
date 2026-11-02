import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// The chapter The npm package: two ways to ship a compiled program
// through npm. Left: esbuild 0.27.7 (as installed in book/node_modules)
// lists 26 platform packages as optionalDependencies, each declaring its
// os and cpu; npm installs the one that matches (here @esbuild/linux-x64,
// an 11,120,788-byte binary). Right: @viscosity/wasm ships one module
// (1,373,422 bytes in dist/web) that every platform's JS engine runs.
const PLATS = ['darwin-arm64', 'linux-x64', 'win32-x64', '… 23 more'];

export default function ShipTwoWays() {
  return (
    <Svg w={400} h={232} title="Native binaries, one per platform, against one WebAssembly file for every platform">
      <T x={100} y={12} size={12} weight={700} anchor="middle">native: one per platform</T>
      <Box x={30} y={24} w={140} h={28} fill={tok('panel')}>
        <T x={100} y={38} size={11} mono anchor="middle">esbuild (26 options)</T>
      </Box>
      {PLATS.map((p, k) => {
        const y = 78 + k * 32;
        const mine = p === 'linux-x64';
        return (
          <g key={p}>
            <Arrow x1={22} y1={y} x2={35} y2={y} width={1.2} color={tok('ink', 0.4)} />
            <Box x={36} y={y - 11} w={150} h={22} r={3}
              fill={mine ? tok('safe', 0.18) : tok('panel')} stroke={mine ? tok('safe') : tok('line')} dash={!mine}>
              <T x={44} y={y} size={11} mono fill={mine ? tok('ink') : tok('muted')}>{p}</T>
              {mine && <T x={180} y={y} size={11} anchor="end" fill={tok('safe')}>installed</T>}
            </Box>
          </g>
        );
      })}
      <path d="M100,52 V62 H22 V174" fill="none" stroke={tok('ink', 0.4)} strokeWidth={1.2} />
      <path d="M300,52 V62 H220 V174" fill="none" stroke={tok('brand', 0.6)} strokeWidth={1.2} />
      <T x={100} y={222} size={11} anchor="middle" fill={tok('muted')}>npm matches os and cpu</T>
      <T x={300} y={12} size={12} weight={700} anchor="middle">wasm: one for all</T>
      <Box x={230} y={24} w={140} h={28} fill={tok('brand', 0.12)} stroke={tok('brand')}>
        <T x={300} y={38} size={11} mono anchor="middle">@viscosity/wasm</T>
      </Box>
      {['macOS, ARM', 'Linux, x86-64', 'Windows', 'a browser tab'].map((p, k) => {
        const y = 78 + k * 32;
        return (
          <g key={p}>
            <Arrow x1={220} y1={y} x2={233} y2={y} width={1.2} color={tok('brand', 0.6)} />
            <Box x={234} y={y - 11} w={158} h={22} r={3} fill={tok('safe', 0.12)} stroke={tok('safe')}>
              <T x={242} y={y} size={11}>{p}</T>
            </Box>
          </g>
        );
      })}
      <T x={300} y={222} size={11} anchor="middle" fill={tok('muted')}>the JS engine runs the .wasm</T>
    </Svg>
  );
}
