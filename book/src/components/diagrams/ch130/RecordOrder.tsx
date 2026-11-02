// Record types ordered by subtyping: more fields is lower (more
// specific), and an arrow S → T means S <: T.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const N = [
  { x: 200, y: 24, t: '{ }' },
  { x: 110, y: 84, t: '{ x }' },
  { x: 290, y: 84, t: '{ y }' },
  { x: 200, y: 144, t: '{ x, y }' },
  { x: 200, y: 204, t: '{ x, y, colour }' },
];
const E: [number, number][] = [[1, 0], [2, 0], [3, 1], [3, 2], [4, 3]];

export default function RecordOrder() {
  return (
    <Svg w={400} h={236} title="Five record types in a diagram. At the top the empty record. Below it, records with only x and with only y. Below both, the record with x and y, and at the bottom the record with x, y and colour. Arrows point upwards, from each record to the ones it is a subtype of.">
      {E.map(([a, b], k) => (
        <Arrow key={k} x1={N[a].x + (N[b].x - N[a].x) * 0.18} y1={N[a].y - 14} x2={N[b].x - (N[b].x - N[a].x) * 0.18} y2={N[b].y + 15} color={tok('brand', 0.8)} />
      ))}
      {N.map((n, k) => (
        <Box key={k} x={n.x - 66} y={n.y - 13} w={132} h={26} fill={k === 4 ? tok('accent', 0.12) : tok('panel')} stroke={k === 4 ? tok('accent') : tok('line')}>
          <T x={n.x} y={n.y} size={12} mono anchor="middle">{n.t}</T>
        </Box>
      ))}
      <T x={14} y={24} size={11} fill={tok('muted')}>fewer fields:</T>
      <T x={14} y={38} size={11} fill={tok('muted')}>more general</T>
      <T x={14} y={196} size={11} fill={tok('muted')}>more fields:</T>
      <T x={14} y={210} size={11} fill={tok('muted')}>more specific</T>
      <T x={386} y={150} size={11} anchor="end" fill={tok('brand')}>arrow: &lt;:</T>
    </Svg>
  );
}
