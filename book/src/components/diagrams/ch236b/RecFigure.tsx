// Chapter 236-b (staged split of 236): two recurrences. A loop-carried
// edge (drawn as a loop back) has a delay and a distance; a cycle of them
// forces II >= total delay / total distance.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

function Node({ x, y, text, hot }: { x: number; y: number; text: string; hot?: boolean }) {
  return (
    <Box x={x} y={y} w={120} h={28} fill={hot ? tok('accent', 0.14) : tok('panel')} stroke={hot ? tok('accent') : tok('line')}>
      <T x={x + 60} y={y + 14} size={12} mono anchor="middle">{text}</T>
    </Box>
  );
}

export default function RecFigure() {
  const loop = (x: number, y: number, label: string) => (
    <g>
      <Arrow x1={x + 120} y1={y + 6} x2={x + 120} y2={y + 22} bend={-5} color={tok('accent')} />
      <T x={x + 150} y={y + 14} size={11} fill={tok('accent')} weight={700}>{label}</T>
    </g>
  );
  return (
    <Svg w={400} h={200} title="Left: the sum-of-squares loop, where add feeds itself with delay 1 and distance 1, so the recurrence needs II of at least 1. Right: a loop computing x = x times c, where mul feeds itself with delay 3 and distance 1, so II must be at least 3.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>s = s + x[i] * x[i]</T>
      <Node x={8} y={26} text="ld a3, 0(a0)" />
      <Arrow x1={68} y1={54} x2={68} y2={74} />
      <T x={74} y={64} size={11}>3</T>
      <Node x={8} y={76} text="mul a3, a3, a3" />
      <Arrow x1={68} y1={104} x2={68} y2={124} />
      <T x={74} y={114} size={11}>3</T>
      <Node x={8} y={126} text="add a2, a2, a3" hot />
      {loop(8, 126, '1, d=1')}
      <T x={8} y={178} size={12} weight={700} fill={tok('accent')}>RecMII = ⌈1 / 1⌉ = 1</T>

      <T x={214} y={12} size={11} weight={700} fill={tok('muted')}>x = x * c</T>
      <Node x={214} y={76} text="mul a3, a3, a4" hot />
      <Arrow x1={334} y1={82} x2={334} y2={98} bend={-5} color={tok('accent')} />
      <T x={280} y={120} size={11} fill={tok('accent')} weight={700}>3, d=1</T>
      <T x={214} y={178} size={12} weight={700} fill={tok('accent')}>RecMII = ⌈3 / 1⌉ = 3</T>
    </Svg>
  );
}
