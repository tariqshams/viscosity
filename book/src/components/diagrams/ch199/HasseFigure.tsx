// The lattices chapter: two lattices side by side. Left, the subsets of
// {a, b, c} (height 3; {a, b} and {b, c} are not comparable). Right, the
// constant-propagation lattice: infinitely wide but only height 2.
import { Box, Svg, T, tok } from '../../viz/svg';
import { Cube } from './cube';

function N({ x, y, text, w = 40 }: { x: number; y: number; text: string; w?: number }) {
  return (
    <Box x={x - w / 2} y={y - 12} w={w} h={24}>
      <T x={x} y={y} size={11.5} mono anchor="middle">{text}</T>
    </Box>
  );
}
const L = ({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={tok('ink', 0.4)} strokeWidth={1.4} />
);

export default function HasseFigure() {
  const mids = [276, 316, 356];
  return (
    <Svg w={400} h={262} title="Left: the subsets of a, b and c, eight sets in four rows, ordered by containment, with the full set at the top and the empty set at the bottom. Right: the constant lattice: ‘no info yet’ at the top, every number in the middle row, ‘varies’ at the bottom.">
      <Cube mark={['ab', 'bc']} />
      <T x={130} y={244} size={11} anchor="middle" fill={tok('muted')}>{'{a, b}, {b, c}: not comparable'}</T>
      <line x1={244} y1={10} x2={244} y2={232} stroke={tok('line')} strokeWidth={1} strokeDasharray="4 4" />
      {mids.map((x) => <L key={x} x1={330} y1={48} x2={x} y2={108} />)}
      {mids.map((x) => <L key={'b' + x} x1={x} y1={132} x2={330} y2={192} />)}
      <N x={330} y={36} text="no info" w={70} />
      {['1', '2', '3'].map((t, k) => <N key={t} x={mids[k]} y={120} text={t} w={34} />)}
      <T x={388} y={120} size={12} fill={tok('muted')}>…</T>
      <T x={256} y={120} size={12} anchor="end" fill={tok('muted')}>…</T>
      <N x={330} y={204} text="varies" w={70} />
      <T x={330} y={244} size={11} anchor="middle" fill={tok('muted')}>height 2</T>
    </Svg>
  );
}
