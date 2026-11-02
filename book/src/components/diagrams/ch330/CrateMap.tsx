// Chapter 329-b: one package, two crates. drip-rs's Cargo.toml (in
// companion/rust) declares a library crate `drip` (src/lib.rs: scanner,
// compiler, VM, collector) and a binary crate `drip-rs` (src/main.rs,
// a short main). The binary uses the library; tests use it too.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function CrateMap() {
  return (
    <Svg w={400} h={224} title="The drip-rs package: a library crate drip and a binary crate drip-rs that uses it">
      <Box x={4} y={4} w={392} h={216} fill={tok('panel')} stroke={tok('ink', 0.4)} dash>
        <T x={14} y={20} size={12} weight={700}>package drip-rs</T>
        <T x={386} y={20} size={11} anchor="end" mono fill={tok('muted')}>one Cargo.toml</T>
      </Box>
      <Box x={16} y={34} w={176} h={150} fill={tok('brand', 0.1)} stroke={tok('brand')}>
        <T x={26} y={52} size={12} weight={700} fill={tok('brand')}>library crate</T>
        <T x={26} y={70} size={12} mono>drip</T>
        <T x={26} y={86} size={11} mono fill={tok('muted')}>root: src/lib.rs</T>
        {['scanner.rs', 'compiler.rs', 'vm.rs', 'gc.rs', '...'].map((m, k) => (
          <T key={m} x={36} y={106 + k * 15} size={11} mono>{m}</T>
        ))}
      </Box>
      <Box x={224} y={34} w={160} h={70} fill={tok('accent', 0.12)} stroke={tok('accent')}>
        <T x={234} y={52} size={12} weight={700} fill={tok('accent')}>binary crate</T>
        <T x={234} y={70} size={12} mono>drip-rs</T>
        <T x={234} y={86} size={11} mono fill={tok('muted')}>root: src/main.rs</T>
      </Box>
      <Arrow x1={224} y1={80} x2={196} y2={90} color={tok('ink', 0.7)} />
      <T x={304} y={118} size={11} anchor="middle" fill={tok('muted')}>has main: becomes</T>
      <T x={304} y={132} size={11} anchor="middle" fill={tok('muted')}>a program you run</T>
      <Box x={224} y={146} w={160} h={38} fill={tok('ink', 0.05)} stroke={tok('line')}>
        <T x={234} y={165} size={11} mono>tests/corpus.rs ...</T>
      </Box>
      <Arrow x1={224} y1={165} x2={196} y2={150} color={tok('ink', 0.5)} />
      <T x={104} y={204} size={11} anchor="middle" fill={tok('muted')}>no main: other crates use it</T>
      <T x={304} y={204} size={11} anchor="middle" fill={tok('muted')}>arrows: “uses”</T>
    </Svg>
  );
}
