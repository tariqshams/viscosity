// Chapter 57: functions made in one Drip for loop each get their own
// body environment, but both hang off the loop's single environment, where
// the one and only i lives. Calling a helper gives each its own v.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

function Fn({ x, label }: { x: number; label: string }) {
  return (
    <Box x={x} y={26} w={84} h={30} stroke={tok('brand')} fill={tok('brand', 0.08)}>
      <T x={x + 10} y={41} size={13} mono>{label}</T>
    </Box>
  );
}

function Env({ x, y, w, title, row }: { x: number; y: number; w: number; title: string; row?: string }) {
  return (
    <Box x={x} y={y} w={w} h={row ? 46 : 30} stroke={tok('safe')} fill={tok('safe', 0.1)}>
      <T x={x + 8} y={y + 14} size={11} weight={700} fill={tok('safe')}>{title}</T>
      {row && <T x={x + 8} y={y + 34} size={14} mono>{row}</T>}
    </Box>
  );
}

export default function SharedLoopEnv() {
  return (
    <Svg w={400} h={214} title="Left: two functions made in a for loop each point at their own body environment, but both body environments have the same parent, which holds the only i, now 3. Right: two functions made by calls to capture each point at their own call environment, holding v = 1 and v = 2.">
      <T x={6} y={10} size={11} weight={700} fill={tok('muted')}>MADE IN THE LOOP</T>
      <T x={214} y={10} size={11} weight={700} fill={tok('muted')}>MADE BY capture(i)</T>
      <Fn x={6} label="show #1" />
      <Fn x={102} label="show #2" />
      <Env x={6} y={86} w={84} title="pass 1 body" />
      <Env x={102} y={86} w={84} title="pass 2 body" />
      <Env x={36} y={144} w={120} title="loop’s environment" row="i = 3" />
      <Arrow x1={48} y1={56} x2={48} y2={84} color={tok('brand')} />
      <Arrow x1={144} y1={56} x2={144} y2={84} color={tok('brand')} />
      <Arrow x1={48} y1={116} x2={70} y2={142} />
      <Arrow x1={144} y1={116} x2={122} y2={142} />
      <line x1={200} y1={18} x2={200} y2={206} stroke={tok('line')} />
      <Fn x={214} label="show #1" />
      <Fn x={308} label="show #2" />
      <Env x={214} y={86} w={84} title="call 1" row="v = 1" />
      <Env x={308} y={86} w={84} title="call 2" row="v = 2" />
      <Arrow x1={256} y1={56} x2={256} y2={84} color={tok('brand')} />
      <Arrow x1={350} y1={56} x2={350} y2={84} color={tok('brand')} />
      <T x={6} y={204} size={12} fill={tok('muted')}>prints 3, then 3</T>
      <T x={214} y={204} size={12} fill={tok('muted')}>prints 1, then 2</T>
    </Svg>
  );
}
