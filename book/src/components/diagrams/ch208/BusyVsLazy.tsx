// Chapter 207-b (staged split of 190): the same function with a + b placed
// as early as possible (left) and as late as possible (right). The bar
// beside each shows where the temporary t is alive.
import { Box, Svg, T, tok } from '../../viz/svg';

const ROWS = ['b0', 'b1', 'b2', 'b3', 'b4'];

function Column({ x, title, code, live }: { x: number; title: string; code: string[]; live: [number, number][] }) {
  return (
    <g>
      <T x={x + 80} y={10} size={11} weight={700} anchor="middle" fill={tok('muted')}>{title}</T>
      {ROWS.map((r, k) => (
        <Box key={k} x={x} y={22 + k * 38} w={150} h={30} fill={code[k].startsWith('t =') ? tok('safe', 0.12) : tok('panel')} stroke={code[k].startsWith('t =') ? tok('safe') : tok('line')}>
          <T x={x + 8} y={37 + k * 38} size={10} weight={700} fill={tok('muted')}>{r}</T>
          <T x={x + 30} y={37 + k * 38} size={11} mono>{code[k]}</T>
        </Box>
      ))}
      {live.map(([a, b], j) => (
        <rect key={j} x={x + 156 + j * 8} y={22 + a * 38 + 4} width={5} height={(b - a) * 38 + 22} rx={2} fill={tok('accent')} />
      ))}
    </g>
  );
}

export default function BusyVsLazy() {
  return (
    <Svg w={400} h={222} title="Two columns of five blocks. Left, as early as possible: t = a + b in b0, and a bar showing t alive from b0 to b4. Right, as late as possible: t = a + b in b2 and in b3, each alive only until b4.">
      <Column x={4} title="AS EARLY AS POSSIBLE" code={['t = a + b', 'condbr', 'x = t', '', 'y = t']} live={[[0, 4]]} />
      <Column x={210} title="AS LATE AS POSSIBLE" code={['', 'condbr', 't = a + b; x = t', 't = a + b', 'y = t']} live={[[2, 4], [3, 4]]} />
    </Svg>
  );
}
