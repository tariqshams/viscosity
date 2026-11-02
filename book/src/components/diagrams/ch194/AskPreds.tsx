// Reading x at the join of
//   function f(c) { let x; if (c) { x = 1; } else { x = 2; } return x * 10; }
// with VIR's builder: each block has a table of the variables it wrote. b3's
// table has no x, so it asks its predecessors, gets two different answers,
// and makes the phi %4 (the real VIR value), recording it in its own table.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

function Blk({ x, y, name, row, hot }: { x: number; y: number; name: string; row: string; hot?: boolean }) {
  return (
    <Box x={x} y={y} w={150} h={52} fill={hot ? tok('brand', 0.12) : tok('panel')} stroke={hot ? tok('brand') : tok('line')}>
      <T x={x + 8} y={y + 13} size={11} weight={700} fill={tok('accent')}>{name}</T>
      <T x={x + 8} y={y + 36} size={12} mono>{row}</T>
    </Box>
  );
}

export default function AskPreds() {
  return (
    <Svg w={400} h={300} title="Blocks b0 to b3 with their tables. b3 has no entry for x, asks b1 and b2, which answer %2 and %3, so b3 makes the phi %4 and records x as %4.">
      <Blk x={125} y={6} name="b0" row="x → %1 (undefined)" />
      <Blk x={20} y={96} name="b1 (x = 1)" row="x → %2" />
      <Blk x={230} y={96} name="b2 (x = 2)" row="x → %3" />
      <Blk x={125} y={200} name="b3 (read x)" row="x → %4 = φ(%2, %3)" hot />
      <Arrow x1={170} y1={58} x2={95} y2={94} />
      <Arrow x1={230} y1={58} x2={305} y2={94} />
      <Arrow x1={95} y1={148} x2={170} y2={198} />
      <Arrow x1={305} y1={148} x2={230} y2={198} />
      <Arrow x1={140} y1={198} x2={70} y2={150} color={tok('brand')} dash bend={0.5} />
      <Arrow x1={260} y1={198} x2={330} y2={150} color={tok('brand')} dash bend={-0.5} />
      <T x={6} y={190} size={11} fill={tok('brand')}>“what is x?”</T>
      <T x={394} y={190} size={11} anchor="end" fill={tok('brand')}>“what is x?”</T>
      <T x={6} y={276} size={11} fill={tok('muted')}>no entry in b3, two predecessors that disagree:</T>
      <T x={6} y={292} size={11} fill={tok('muted')}>make a phi, and remember it in b3’s table</T>
    </Svg>
  );
}
