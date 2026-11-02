// The loop header of
//   function sum(n) { let s = 0;
//     for (let i = 0; i < n; i++) s = s + i; return s; }
// in real VIR. The phi for i takes %2 (the 0) when control arrives from b0,
// and %10 (i + 1, computed in b3) when it arrives along the back edge.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

function Blk({ x, y, w, h, title, lines, hot }: { x: number; y: number; w: number; h: number; title: string; lines: string[]; hot?: boolean }) {
  return (
    <Box x={x} y={y} w={w} h={h} fill={hot ? tok('brand', 0.12) : tok('panel')} stroke={hot ? tok('brand') : tok('line')}>
      <T x={x + 8} y={y + 12} size={11} weight={700} fill={tok('accent')}>{title}</T>
      {lines.map((l, k) => <T key={k} x={x + 8} y={y + 30 + k * 17} size={11.5} mono>{l}</T>)}
    </Box>
  );
}

export default function LoopPhi() {
  return (
    <Svg w={400} h={330} title="The loop header b1 of sum, with phis for s and i. The edge from b0 brings %1 and %2, the initial zeros; the back edge from b3 brings %7 and %10, the new s and i.">
      <Blk x={110} y={4} w={180} h={58} title="b0 (entry)" lines={['%1 = const 0  ; s', '%2 = const 0  ; i']} />
      <Arrow x1={200} y1={62} x2={200} y2={104} color={tok('f1')} width={2.5} />
      <T x={208} y={84} size={11} fill={tok('f1')}>1st operand: %1, %2</T>
      <Blk x={90} y={106} w={220} h={92} title="b1  ; preds b0 b3" hot lines={['%6 = phi %1, %7   ; s', '%3 = phi %2, %10  ; i', '%5 = binop < %3, %0', 'condbr %5, b2, b4']} />
      <Blk x={6} y={232} w={150} h={58} title="b2 (body)" lines={['%7 = binop + %6, %3', 'br b3']} />
      <Blk x={176} y={232} w={128} h={92} title="b3 (i++)" lines={['%8 = unop + %3', '%9 = const 1', '%10 = binop +', '  %8, %9']} />
      <Blk x={318} y={112} w={78} h={44} title="b4" lines={['return %6']} />
      <Arrow x1={140} y1={198} x2={90} y2={230} />
      <Arrow x1={156} y1={262} x2={174} y2={262} />
      <Arrow x1={310} y1={134} x2={316} y2={134} />
      <path d="M304,300 C392,300 392,185 318,185" fill="none" stroke={tok('f2')} strokeWidth={2.5} />
      <polygon points="311,185 321,180 321,190" fill={tok('f2')} />
      <T x={6} y={308} size={11} fill={tok('f2')}>back edge from b3:</T>
      <T x={6} y={324} size={11} fill={tok('f2')}>2nd operand: %7, %10</T>
    </Svg>
  );
}
