// Chapter 69: functions made in a Drip `for` loop each capture that pass's
// own loop variable, because the interpreter makes a fresh environment for
// the variable on every pass. A `while` loop's counter lives outside the
// loop, in one environment, so functions made in it all share it.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

function Fn({ x, label }: { x: number; label: string }) {
  return (
    <Box x={x} y={26} w={84} h={30} stroke={tok('brand')} fill={tok('brand', 0.08)}>
      <T x={x + 10} y={41} size={12.5} mono>{label}</T>
    </Box>
  );
}

function Env({ x, y, w, title, row }: { x: number; y: number; w: number; title: string; row?: string }) {
  return (
    <Box x={x} y={y} w={w} h={row ? 46 : 30} stroke={tok('safe')} fill={tok('safe', 0.1)}>
      <T x={x + 8} y={y + 14} size={11} weight={700} fill={tok('safe')}>{title}</T>
      {row && <T x={x + 8} y={y + 34} size={13} mono>{row}</T>}
    </Box>
  );
}

export default function SharedLoopEnv() {
  return (
    <Svg w={400} h={224} title="Left: two functions made in a for loop each point at their own body environment, whose parent is that pass's own loop environment, holding i = 1 and i = 2. Right: two functions made in a while loop each point at their own body environment, but both have the same parent, which holds the only j, now 3.">
      <T x={6} y={10} size={11} weight={700} fill={tok('muted')}>for i in 1..3</T>
      <T x={214} y={10} size={11} weight={700} fill={tok('muted')}>while j &lt; 3</T>
      <Fn x={6} label="fn #1" />
      <Fn x={102} label="fn #2" />
      <Env x={6} y={78} w={84} title="pass 1 body" />
      <Env x={102} y={78} w={84} title="pass 2 body" />
      <Env x={6} y={136} w={84} title="pass 1 loop" row="i = 1" />
      <Env x={102} y={136} w={84} title="pass 2 loop" row="i = 2" />
      <Arrow x1={48} y1={56} x2={48} y2={76} color={tok('brand')} />
      <Arrow x1={144} y1={56} x2={144} y2={76} color={tok('brand')} />
      <Arrow x1={48} y1={108} x2={48} y2={134} />
      <Arrow x1={144} y1={108} x2={144} y2={134} />
      <line x1={200} y1={18} x2={200} y2={210} stroke={tok('line')} />
      <Fn x={214} label="fn #1" />
      <Fn x={308} label="fn #2" />
      <Env x={214} y={78} w={84} title="pass 1 body" />
      <Env x={308} y={78} w={84} title="pass 2 body" />
      <Env x={244} y={136} w={120} title="outside the loop" row="j = 3" />
      <Arrow x1={256} y1={56} x2={256} y2={76} color={tok('brand')} />
      <Arrow x1={350} y1={56} x2={350} y2={76} color={tok('brand')} />
      <Arrow x1={256} y1={108} x2={274} y2={134} />
      <Arrow x1={350} y1={108} x2={332} y2={134} />
      <T x={6} y={210} size={12} fill={tok('muted')}>prints 1, then 2</T>
      <T x={214} y={210} size={12} fill={tok('muted')}>prints 3, then 3</T>
    </Svg>
  );
}
