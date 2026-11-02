import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Polymorphic against megamorphic. A polymorphic site keeps its own short
// list of (map, handler) entries, up to four in Node 22
// (--max-valid-polymorphic-map-count=4); a megamorphic site keeps none and
// looks up (map, name) in the stub cache, one table shared by every
// megamorphic load (V8 12.4 source: src/ic/stub-cache.h).
export default function StubTable() {
  return (
    <Svg w={400} h={210} title="Left: a polymorphic site with its own list of four entries, map A to D, each with a handler. Right: two megamorphic sites, n.type and o.x, both pointing at one shared stub cache table whose rows are keyed by map and name.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>POLYMORPHIC: ITS OWN LIST</T>
      <Box x={8} y={22} w={160} h={30} fill={tok('panel')} stroke={tok('ink', 0.5)}>
        <T x={18} y={37} size={13} mono weight={700}>shape.area</T>
      </Box>
      {['A', 'B', 'C', 'D'].map((m, k) => (
        <Box key={m} x={20} y={60 + k * 30} w={148} h={24} r={3} fill={tok('brand', 0.1)} stroke={tok('brand')}>
          <T x={28} y={72 + k * 30} size={11} mono>map {m} → field {k % 2}</T>
        </Box>
      ))}
      <T x={8} y={196} size={11} fill={tok('muted')}>at most 4 entries in Node 22</T>

      <T x={210} y={12} size={11} weight={700} fill={tok('muted')}>MEGAMORPHIC: SHARED TABLE</T>
      <Box x={210} y={22} w={84} h={30} fill={tok('panel')} stroke={tok('ink', 0.5)}>
        <T x={220} y={37} size={13} mono weight={700}>n.type</T>
      </Box>
      <Box x={308} y={22} w={84} h={30} fill={tok('panel')} stroke={tok('ink', 0.5)}>
        <T x={318} y={37} size={13} mono weight={700}>o.x</T>
      </Box>
      <Arrow x1={252} y1={54} x2={280} y2={76} color={tok('danger', 0.7)} />
      <Arrow x1={350} y1={54} x2={322} y2={76} color={tok('danger', 0.7)} />
      <Box x={210} y={80} w={182} h={110} fill={tok('danger', 0.06)} stroke={tok('danger')}>
        <T x={220} y={96} size={11} weight={700}>stub cache</T>
        <T x={220} y={116} size={11} mono>(Num map, type) → …</T>
        <T x={220} y={134} size={11} mono>(Add map, type) → …</T>
        <T x={220} y={152} size={11} mono>(map E, x) → …</T>
        <T x={220} y={172} size={11} fill={tok('muted')}>keyed by map and name</T>
      </Box>
    </Svg>
  );
}
