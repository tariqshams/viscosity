// Chapter 157: the same three closures made by a while loop over one
// local, and by a for loop with its fresh loop variable per pass. The
// while loop's closures share one upvalue; the for loop's get one each.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

function Closures({ x, label }: { x: number; label: string }) {
  return (
    <>
      <T x={x} y={22} size={12} weight={700}>{label}</T>
      {[0, 1, 2].map((k) => (
        <Box key={k} x={x} y={38 + k * 34} w={70} h={24} r={3} fill={tok('brand', 0.08)} stroke={tok('brand')}>
          <T x={x + 35} y={50 + k * 34} size={11} mono anchor="middle">closure {k + 1}</T>
        </Box>
      ))}
    </>
  );
}

export default function LoopVarsFigure() {
  const L = 8;
  const R = 208;
  return (
    <Svg w={400} h={170} title="Left: a while loop's three closures all point at one upvalue holding 3. Right: a for loop's three closures point at three upvalues holding 0, 1 and 2.">
      <Closures x={L} label="while, one i" />
      <Box x={L + 112} y={72} w={72} h={30} fill={tok('safe', 0.12)} stroke={tok('safe')}>
        <T x={L + 148} y={87} size={12} mono anchor="middle">i: 3</T>
      </Box>
      {[0, 1, 2].map((k) => (
        <Arrow key={k} x1={L + 72} y1={50 + k * 34} x2={L + 110} y2={87} color={tok('ink', 0.55)} />
      ))}
      <Closures x={R} label="for i in 0..3" />
      {[0, 1, 2].map((k) => (
        <g key={k}>
          <Box x={R + 112} y={38 + k * 34} w={72} h={24} r={3} fill={tok('safe', 0.12)} stroke={tok('safe')}>
            <T x={R + 148} y={50 + k * 34} size={12} mono anchor="middle">i: {k}</T>
          </Box>
          <Arrow x1={R + 72} y1={50 + k * 34} x2={R + 110} y2={50 + k * 34} color={tok('ink', 0.55)} />
        </g>
      ))}
      <T x={L} y={152} size={11} fill={tok('muted')}>prints 3, 3, 3</T>
      <T x={R} y={152} size={11} fill={tok('muted')}>prints 0, 1, 2</T>
    </Svg>
  );
}
