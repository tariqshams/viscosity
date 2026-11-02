// Chapter 211: a natural loop (one way in) next to an irreducible cycle
// (two ways in), the case that shows why dominance, not listing order,
// decides what a back edge is.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const W = 46;
const H = 26;

function Node({ x, y, name, fill, stroke }: { x: number; y: number; name: string; fill?: string; stroke?: string }) {
  return (
    <Box x={x - W / 2} y={y - H / 2} w={W} h={H} r={5} fill={fill ?? tok('panel')} stroke={stroke ?? tok('line')}>
      <T x={x} y={y} size={13} mono weight={700} anchor="middle">{name}</T>
    </Box>
  );
}

export default function TwoEntrances() {
  const loopFill = tok('brand', 0.16);
  return (
    <Svg w={400} h={250} title="Left: a natural loop with one entrance. Right: a cycle with two entrances, which is not a natural loop.">
      <T x={100} y={14} size={12} weight={700} anchor="middle" fill={tok('muted')}>ONE WAY IN</T>
      <T x={300} y={14} size={12} weight={700} anchor="middle" fill={tok('muted')}>TWO WAYS IN</T>
      <line x1={200} y1={24} x2={200} y2={240} stroke={tok('line')} strokeWidth={1} />

      {/* left: e -> b1 -> b2 -> b1, b1 -> x */}
      <Arrow x1={100} y1={53} x2={100} y2={85} color={tok('ink', 0.55)} width={1.6} />
      <Arrow x1={100} y1={111} x2={100} y2={145} color={tok('ink', 0.55)} width={1.6} />
      <Arrow x1={77} y1={158} x2={77} y2={98} bend={-1.2} color={tok('danger')} width={2.6} />
      <Arrow x1={123} y1={98} x2={160} y2={190} color={tok('ink', 0.55)} width={1.6} />
      <Node x={100} y={40} name="e" />
      <Node x={100} y={98} name="b1" fill={loopFill} stroke={tok('brand')} />
      <Node x={100} y={158} name="b2" fill={loopFill} stroke={tok('brand')} />
      <Node x={160} y={203} name="x" />
      <T x={22} y={128} size={11} anchor="start" fill={tok('danger')}>back</T>
      <T x={22} y={142} size={11} anchor="start" fill={tok('danger')}>edge</T>
      <T x={100} y={236} size={11} anchor="middle" fill={tok('muted')}>b1 dominates b2</T>

      {/* right: e -> a, e -> b, a <-> b */}
      <Arrow x1={287} y1={53} x2={258} y2={110} color={tok('ink', 0.55)} width={1.6} />
      <Arrow x1={313} y1={53} x2={342} y2={110} color={tok('ink', 0.55)} width={1.6} />
      <Arrow x1={273} y1={118} x2={327} y2={118} bend={-0.8} color={tok('ink', 0.55)} width={1.6} />
      <Arrow x1={327} y1={130} x2={273} y2={130} bend={-0.8} color={tok('ink', 0.55)} width={1.6} />
      <Node x={300} y={40} name="e" />
      <Node x={250} y={124} name="a" />
      <Node x={350} y={124} name="b" />
      <T x={300} y={192} size={11} anchor="middle" fill={tok('muted')}>a cycle, but neither</T>
      <T x={300} y={208} size={11} anchor="middle" fill={tok('muted')}>block dominates the other:</T>
      <T x={300} y={224} size={11} anchor="middle" fill={tok('muted')}>no back edge, no loop</T>
    </Svg>
  );
}
