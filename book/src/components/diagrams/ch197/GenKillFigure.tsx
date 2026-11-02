// Chapter 197: the transfer function OUT = gen ∪ (IN − kill), applied to
// the loop body b2 (d3: y = i * 2, d4: x = x + y, d5: i = i + 1) when all
// five definitions reach its start.
import { Box, Svg, T, tok } from '../../viz/svg';

const DS = ['d1', 'd2', 'd3', 'd4', 'd5'];
const X0 = 150;
const DX = 50;

function D({ k, y, state }: { k: number; y: number; state: 'in' | 'dead' | 'gen' | 'kept' }) {
  const x = X0 + k * DX;
  const fill = state === 'gen' ? tok('safe', 0.16) : state === 'dead' ? tok('danger', 0.08) : tok('panel');
  const stroke = state === 'gen' ? tok('safe') : state === 'dead' ? tok('danger', 0.6) : tok('line');
  return (
    <g>
      <Box x={x - 19} y={y - 12} w={38} h={24} fill={fill} stroke={stroke} opacity={state === 'dead' ? 0.6 : 1}>
        <T x={x} y={y} size={12} mono anchor="middle">{DS[k]}</T>
      </Box>
      {state === 'dead' && <line x1={x - 16} y1={y + 9} x2={x + 16} y2={y - 9} stroke={tok('danger')} strokeWidth={2} />}
    </g>
  );
}

export default function GenKillFigure() {
  return (
    <Svg w={400} h={232} title="Block b2’s transfer function. IN is d1 to d5. Removing b2’s kill set crosses out d1 and d2. Adding its gen set brings d3, d4 and d5. OUT is d3, d4, d5.">
      <T x={8} y={30} size={12} weight={700}>IN</T>
      {DS.map((_, k) => <D key={k} k={k} y={30} state="in" />)}
      <T x={8} y={84} size={12} weight={700}>− kill</T>
      <T x={8} y={100} size={11} fill={tok('muted')}>other defs of</T>
      <T x={8} y={114} size={11} fill={tok('muted')}>x, y and i</T>
      {DS.map((_, k) => <D key={k} k={k} y={92} state={k < 2 ? 'dead' : 'kept'} />)}
      <T x={8} y={150} size={12} weight={700}>∪ gen</T>
      <T x={8} y={166} size={11} fill={tok('muted')}>b2’s own, last</T>
      <T x={8} y={180} size={11} fill={tok('muted')}>def of each</T>
      {[2, 3, 4].map((k) => <D key={k} k={k} y={158} state="gen" />)}
      <line x1={120} y1={196} x2={392} y2={196} stroke={tok('line')} strokeWidth={1.2} />
      <T x={8} y={216} size={12} weight={700}>OUT</T>
      {[2, 3, 4].map((k) => <D key={k} k={k} y={216} state="kept" />)}
    </Svg>
  );
}
