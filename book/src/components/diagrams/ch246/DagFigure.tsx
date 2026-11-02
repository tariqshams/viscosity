// Chapter 246: the dependence DAG of the loop body. Solid edges are true
// dependences (a value flows), dashed ones keep an order without passing a
// value. Each edge carries the delay, in cycles, between the two starts.
// The critical path is drawn in the brand colour.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type N = { id: string; text: string; x: number; y: number; early: number; crit?: boolean };
const NODES: N[] = [
  { id: 'ld', text: 'ld a3, 0(a0)', x: 30, y: 20, early: 0, crit: true },
  { id: 'mul', text: 'mul a3, a3, a3', x: 30, y: 92, early: 3, crit: true },
  { id: 'addi', text: 'addi a0, a0, 8', x: 220, y: 92, early: 0 },
  { id: 'add', text: 'add a2, a3, a2', x: 30, y: 164, early: 6, crit: true },
  { id: 'bne', text: 'bne a0, a1, loop', x: 220, y: 200, early: 7, crit: true },
];
const W = 140;
const H = 30;
const at = (id: string) => NODES.find((n) => n.id === id)!;

export default function DagFigure() {
  const edge = (a: string, b: string, d: string, dashed: boolean, crit: boolean, lx: number, ly: number) => {
    const p = at(a);
    const q = at(b);
    const x1 = p.x + W / 2;
    const y1 = p.y + H;
    const x2 = q.x + W / 2;
    const y2 = q.y;
    const c = crit ? tok('brand') : tok('ink', 0.6);
    return (
      <g>
        <Arrow x1={x1} y1={y1} x2={x2} y2={y2} color={c} dash={dashed} />
        <T x={lx} y={ly} size={12} weight={700} fill={c}>{d}</T>
      </g>
    );
  };
  return (
    <Svg w={400} h={250} title="Five instruction boxes joined by arrows labelled with delays: ld to mul 3, mul to add 3, add to bne 1, ld to addi 0 (dashed), addi to bne 1. The path ld, mul, add, bne is highlighted as the critical path.">
      {edge('ld', 'mul', '3', false, true, 106, 76)}
      {edge('mul', 'add', '3', false, true, 106, 148)}
      {edge('ld', 'addi', '0 (anti)', true, false, 214, 50)}
      {edge('addi', 'bne', '1', false, false, 296, 168)}
      {edge('add', 'bne', '1 (order)', true, true, 150, 214)}
      {NODES.map((n) => (
        <g key={n.id}>
          <Box x={n.x} y={n.y} w={W} h={H} fill={n.crit ? tok('brand', 0.1) : tok('panel')} stroke={n.crit ? tok('brand') : tok('line')}>
            <T x={n.x + W / 2} y={n.y + H / 2} size={12} mono anchor="middle">{n.text}</T>
          </Box>
          <T x={n.x + W + 4} y={n.y + H / 2} size={11} fill={tok('muted')}>{`≥${n.early}`}</T>
        </g>
      ))}
      <T x={8} y={242} size={11} fill={tok('muted')}>≥ n: the earliest cycle it can start</T>
    </Svg>
  );
}
