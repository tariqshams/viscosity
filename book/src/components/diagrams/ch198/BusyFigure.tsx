// "Available and very busy expressions": very busy expressions flow
// BACKWARD. Each block's IN lists the expressions every path from there
// will compute before their operands change; a + b is very busy at the end
// of b0, so it can be computed once, there (hoisted).
//   b0: if c    b1: x = a + b; y = a * 2    b2: y = a + b; a = 0
//   b3: z = a * 2
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';
import { CfgBlock, CfgEdge, Chip, type Block } from '../ch195/kit';

const B: Block[] = [
  { id: 'b0', x: 200, y: 30, lines: ['if c'], w: 104 },
  { id: 'b1', x: 100, y: 112, lines: ['x = a + b', 'y = a * 2'], w: 112 },
  { id: 'b2', x: 300, y: 112, lines: ['y = a + b', 'a = 0'], w: 112 },
  { id: 'b3', x: 200, y: 194, lines: ['z = a * 2'], w: 112 },
];
const at = (id: string) => B.find((b) => b.id === id)!;
const ROWS: [string, string, string][] = [
  ['b0', 'a+b', 'a+b'],
  ['b1', 'a+b, a*2', 'a*2'],
  ['b2', 'a+b', 'a*2'],
  ['b3', 'a*2', '∅'],
];

export default function BusyFigure() {
  return (
    <Svg w={400} h={340} title="An if/else diamond. Both branches compute a + b before changing a, so a + b is very busy at the end of the test block b0 and can be computed there once. a * 2 is not very busy there, because b2 sets a = 0 first. A table gives each block’s very busy expressions at its start and end.">
      {[['b0', 'b1'], ['b0', 'b2'], ['b1', 'b3'], ['b2', 'b3']].map(([a, b]) => (
        <CfgEdge key={a + b} a={at(a)} b={at(b)} />
      ))}
      {B.map((b) => <CfgBlock key={b.id} b={b} fill={b.id === 'b0' ? tok('safe', 0.12) : undefined} stroke={b.id === 'b0' ? tok('safe') : undefined} />)}
      <Box x={268} y={14} w={124} h={32} fill={tok('safe', 0.1)} stroke={tok('safe')} dash>
        <T x={330} y={30} size={11.5} mono anchor="middle">t = a + b</T>
      </Box>
      <Arrow x1={268} y1={30} x2={256} y2={30} color={tok('safe')} />
      <T x={330} y={58} size={11} anchor="middle" fill={tok('muted')}>hoist here: both</T>
      <T x={330} y={72} size={11} anchor="middle" fill={tok('muted')}>paths compute it next</T>
      <T x={30} y={240} size={11} weight={700} fill={tok('muted')}>BLOCK</T>
      <T x={156} y={240} size={11} weight={700} fill={tok('muted')} anchor="middle">IN</T>
      <T x={290} y={240} size={11} weight={700} fill={tok('muted')} anchor="middle">OUT</T>
      {ROWS.map(([b, i, o], k) => {
        const y = 262 + k * 22;
        return (
          <g key={b}>
            <T x={30} y={y} size={12} mono>{b}</T>
            <Chip x={156} y={y} w={104} text={i} />
            <Chip x={290} y={y} w={104} text={o} fill={b === 'b0' ? tok('safe', 0.14) : undefined} stroke={b === 'b0' ? tok('safe') : undefined} />
          </g>
        );
      })}
      <T x={392} y={334} size={11} anchor="end" fill={tok('muted')}>facts flow upwards: OUT is the meet of successors’ IN</T>
    </Svg>
  );
}
