import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 153: how the Analyzer in engine/rust/crates/core/src/analysis.rs
// refers to collections. collection_of_load and element_of map a ValueId to
// a usize, the collection's position in self.collections; nothing holds a
// reference into the Vec, so the pass can push to it and change its entries
// freely. Value numbers are from the real VIR of the chapter's step()
// program (print_func): %23, %31, %35 load ps, %0 is step's parameter,
// %37 is ps[3].
const MAP: [string, string][] = [
  ['%23', '0'],
  ['%31', '0'],
  ['%35', '0'],
  ['%0', '0'],
];

export default function ByIndex() {
  return (
    <Svg w={400} h={220} title="Maps from values to a collection's index, and the Vec of collections they index into">
      <T x={10} y={14} size={11} weight={700} fill={tok('muted')}>collection_of_load</T>
      {MAP.map(([v, i], k) => (
        <g key={v}>
          <Box x={10} y={26 + k * 30} w={52} h={24}>
            <T x={36} y={38 + k * 30} size={12} mono anchor="middle">{v}</T>
          </Box>
          <T x={70} y={38 + k * 30} size={12} mono>→ {i}</T>
          <Arrow x1={96} y1={38 + k * 30} x2={236} y2={70} color={tok('ink', 0.25)} width={1.2} />
        </g>
      ))}
      <T x={10} y={160} size={11} weight={700} fill={tok('muted')}>element_of</T>
      <Box x={10} y={172} w={52} h={24}>
        <T x={36} y={184} size={12} mono anchor="middle">%37</T>
      </Box>
      <T x={70} y={184} size={12} mono>→ 0</T>
      <Arrow x1={96} y1={184} x2={236} y2={80} color={tok('ink', 0.25)} width={1.2} />

      <T x={240} y={14} size={11} weight={700} fill={tok('muted')}>self.collections</T>
      <Box x={240} y={26} w={150} h={84} fill={tok('brand', 0.1)} stroke={tok('brand')}>
        <T x={250} y={42} size={12} mono weight={700}>[0] ps</T>
        <T x={250} y={62} size={11} mono>fields: [x, y]</T>
        <T x={250} y={80} size={11} mono>index_gets: 3</T>
        <T x={250} y={98} size={11} mono>bailouts: []</T>
      </Box>
      <Box x={240} y={118} w={150} h={30} dash>
        <T x={250} y={133} size={11} mono fill={tok('muted')}>[1] (room to grow)</T>
      </Box>
      <T x={315} y={172} size={11} anchor="middle" fill={tok('muted')}>numbers, not references:</T>
      <T x={315} y={188} size={11} anchor="middle" fill={tok('muted')}>the Vec can still change</T>
    </Svg>
  );
}
