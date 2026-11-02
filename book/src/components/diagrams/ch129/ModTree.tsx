import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 129: how drip-rs's src/lib.rs pulls files into the crate. Each
// `pub mod name;` line names a file, name.rs, beside lib.rs; a file that no
// `mod` line names is never compiled. (notes.rs is imaginary, for contrast.)
const MODS = ['chunk', 'compiler', 'debug', 'gc', 'object', 'scanner', 'table', 'value', 'vm'];

export default function ModTree() {
  return (
    <Svg w={400} h={262} title="lib.rs with nine mod lines, each pointing at a file; one file nobody names is left out">
      <T x={8} y={12} size={12} weight={700} fill={tok('muted')}>src/lib.rs (the crate root)</T>
      <Box x={4} y={22} w={170} h={206} fill={tok('panel')} stroke={tok('ink', 0.5)}>
        {MODS.map((m, k) => (
          <T key={m} x={14} y={38 + k * 21} size={12} mono>pub mod {m};</T>
        ))}
      </Box>
      <T x={392} y={12} size={12} weight={700} anchor="end" fill={tok('muted')}>files in src/</T>
      {MODS.map((m, k) => (
        <g key={m}>
          <Arrow x1={150} y1={38 + k * 21} x2={262} y2={38 + k * 21} color={tok('brand', 0.7)} width={1.5} />
          <Box x={266} y={28 + k * 21} w={126} h={19} r={3} fill={tok('brand', 0.08)} stroke={tok('brand')}>
            <T x={276} y={38 + k * 21} size={11} mono>{m}.rs</T>
          </Box>
        </g>
      ))}
      <Box x={266} y={224} w={126} h={19} r={3} fill="transparent" stroke={tok('line')} dash>
        <T x={276} y={234} size={11} mono fill={tok('muted')}>notes.rs</T>
      </Box>
      <T x={258} y={254} size={11} anchor="end" fill={tok('muted')}>no mod line names it: not compiled</T>
    </Svg>
  );
}
