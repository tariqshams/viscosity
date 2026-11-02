// Chapter 92: two small lattices of facts, drawn with the "promises more"
// end at the top. Left: sets of definitely assigned variables, ordered by
// "contains", where the meet of two facts is their intersection. Right:
// Viscosity's two-point numeric lattice.
import { Box, Svg, T, tok } from '../../viz/svg';

function Node({ x, y, text, w = 64, hot }: { x: number; y: number; text: string; w?: number; hot?: boolean }) {
  return (
    <Box x={x - w / 2} y={y - 13} w={w} h={26} fill={hot ? tok('brand', 0.16) : tok('panel')} stroke={hot ? tok('brand') : tok('line')}>
      <T x={x} y={y} size={12.5} mono anchor="middle" weight={hot ? 700 : 400}>{text}</T>
    </Box>
  );
}
const L = ({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={tok('ink', 0.55)} strokeWidth={1.6} />
);

export default function FactLattice() {
  return (
    <Svg w={400} h={250} title="Left: the lattice of sets of variables drawn from x and y, with {x, y} at the top, {x} and {y} in the middle and the empty set at the bottom. The meet of {x, y} and {x} is {x}. Right: a two-point lattice, number above maybe-not.">
      <T x={130} y={12} size={11} weight={700} anchor="middle" fill={tok('muted')}>DEFINITELY ASSIGNED</T>
      <L x1={130} y1={62} x2={70} y2={110} />
      <L x1={130} y1={62} x2={190} y2={110} />
      <L x1={70} y1={136} x2={130} y2={184} />
      <L x1={190} y1={136} x2={130} y2={184} />
      <Node x={130} y={50} text="{x, y}" w={74} hot />
      <Node x={70} y={123} text="{x}" hot />
      <Node x={190} y={123} text="{y}" />
      <Node x={130} y={197} text="{ }" />
      <T x={130} y={226} size={11} anchor="middle" fill={tok('muted')}>{'meet: {x, y} ⊓ {x} = {x}'}</T>
      <T x={8} y={50} size={11} fill={tok('muted')}>more</T>
      <T x={8} y={197} size={11} fill={tok('muted')}>less</T>
      <line x1={330} y1={20} x2={330} y2={240} stroke={tok('line')} strokeWidth={1} strokeDasharray="4 4" />
      <T x={362} y={12} size={11} weight={700} anchor="middle" fill={tok('muted')}>NUMBER?</T>
      <L x1={362} y1={70} x2={362} y2={150} />
      <Node x={362} y={57} text="number" w={62} />
      <Node x={362} y={163} text="maybe" w={62} />
      <T x={362} y={184} size={11} anchor="middle" fill={tok('muted')}>(maybe-not)</T>
    </Svg>
  );
}
