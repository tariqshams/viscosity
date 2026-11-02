// Chapter 105: the dominator tree of the Collatz CFG, from the idom map
// that Viscosity's dominators() returns:
//   1→0, 4→1, 2→1, 6→2, 5→2, 7→2, 3→7
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const POS: Record<number, [number, number]> = {
  0: [200, 24], 1: [200, 84], 2: [140, 144], 4: [290, 144],
  5: [60, 204], 6: [140, 204], 7: [220, 204], 3: [220, 264],
};
const IDOM: [number, number][] = [[1, 0], [4, 1], [2, 1], [6, 2], [5, 2], [7, 2], [3, 7]];

export default function DomTree() {
  return (
    <Svg w={400} h={290} title="The dominator tree: b0 is the root; b1 is its child; b2 and b4 are children of b1; b5, b6 and b7 are children of b2; b3 is a child of b7.">
      {IDOM.map(([b, d]) => {
        const [x1, y1] = POS[d], [x2, y2] = POS[b];
        return <Arrow key={b} x1={x1} y1={y1 + 14} x2={x2} y2={y2 - 14} color={tok('accent')} />;
      })}
      {Object.entries(POS).map(([b, [x, y]]) => (
        <Box key={b} x={x - 24} y={y - 14} w={48} h={28} r={14} fill={tok('panel')} stroke={tok('accent')}>
          <T x={x} y={y} size={13} weight={700} anchor="middle">{`b${b}`}</T>
        </Box>
      ))}
      <T x={290} y={200} size={11} fill={tok('muted')}>b7 hangs off b2,</T>
      <T x={290} y={216} size={11} fill={tok('muted')}>not b5 or b6:</T>
      <T x={290} y={232} size={11} fill={tok('muted')}>neither branch</T>
      <T x={290} y={248} size={11} fill={tok('muted')}>is required</T>
    </Svg>
  );
}
