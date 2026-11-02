// Chapter 106: the interpreter methods running when a return (or break) is
// reached inside an if inside a while loop, drawn as nested boxes. A RETURN
// code climbs every level to callFunction; a BREAK code stops at the loop.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const LEVELS = [
  { label: 'callFunction', note: 'takes returnValue' },
  { label: 'executeBlock (body)', note: 'passes the code up' },
  { label: 'execute (while)', note: 'BREAK ends the loop' },
  { label: 'executeBlock (loop body)', note: 'passes the code up' },
  { label: 'execute (if) and its block', note: 'passes the code up' },
  { label: 'execute (return/break)', note: 'returns the code' },
];

export default function UnwindFigure() {
  const inset = 12;
  const top = 8;
  const rowH = 34;
  const W = 300;
  const innerBottom = top + (LEVELS.length - 1) * rowH + 34;
  const H = innerBottom + (LEVELS.length - 1) * 5 + 4;
  return (
    <Svg w={400} h={H} title="Six nested interpreter methods, from callFunction on the outside to execute of the return or break statement on the inside. The RETURN code is passed up through every level to callFunction. The BREAK code is passed up only as far as the while loop, which stops.">
      {LEVELS.map((l, i) => {
        const x = 4 + i * inset;
        const y = top + i * rowH;
        const w = W - 2 * i * inset;
        const h = innerBottom + (LEVELS.length - 1 - i) * 5 - y;
        const inner = i === LEVELS.length - 1;
        return (
          <Box key={l.label} x={x} y={y} w={w} h={h} fill={inner ? tok('danger', 0.08) : i === 2 ? tok('accent', 0.06) : 'transparent'} stroke={i === 0 ? tok('safe') : i === 2 ? tok('accent') : inner ? tok('danger') : tok('ink', 0.35)}>
            <T x={x + 8} y={y + 12} size={11.5} mono weight={700}>{l.label}</T>
            <T x={x + 8} y={y + 26} size={11} fill={tok('muted')}>{l.note}</T>
          </Box>
        );
      })}
      <Arrow x1={314} y1={innerBottom - 6} x2={314} y2={top + 10} color={tok('danger')} width={2.5} />
      <T x={322} y={top + 14} size={12} mono weight={700} fill={tok('danger')}>RETURN</T>
      <T x={322} y={top + 30} size={11} fill={tok('muted')}>all the way up</T>
      <Arrow x1={390} y1={innerBottom - 6} x2={390} y2={top + 2 * rowH + 14} color={tok('accent')} width={2.5} dash />
      <T x={384} y={top + 2 * rowH + 4} size={12} mono weight={700} anchor="end" fill={tok('accent')}>BREAK</T>
      <T x={384} y={top + 2 * rowH + 18} size={11} anchor="end" fill={tok('muted')}>to the loop</T>
    </Svg>
  );
}
