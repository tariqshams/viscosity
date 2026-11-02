// Chapter 161: copy-down inheritance. `inherit` copies the superclass's
// method table into the new class (Table.addAll), and the subclass's own
// `method` instructions then add to it, overwriting any inherited entry
// with the same name. Follows the Inherit and Method cases in
// companion/ts/src/vm/vm.ts.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type Row = [string, string, boolean?];

function Table({ x, title, rows }: { x: number; title: string; rows: Row[] }) {
  return (
    <>
      <T x={x} y={18} size={11} weight={700}>{title}</T>
      {rows.map(([k, v, hot], i) => (
        <g key={k}>
          <Box x={x} y={30 + i * 28} w={110} h={24} r={3} fill={hot ? tok('accent', 0.14) : tok('panel')} stroke={hot ? tok('accent') : tok('line')}>
            <T x={x + 8} y={42 + i * 28} size={11} mono>{k}: {v}</T>
          </Box>
        </g>
      ))}
    </>
  );
}

export default function CopyDownFigure() {
  return (
    <Svg w={400} h={128} title="Three method tables side by side: A's table with m and init; B's table after inherit, a copy of A's; and B's table after its own method m overwrites the copied m.">
      <Table x={4} title="A.methods" rows={[['m', 'A.m'], ['init', 'A.init']]} />
      <Arrow x1={116} y1={56} x2={140} y2={56} color={tok('ink', 0.6)} />
      <Table x={144} title="B, after inherit" rows={[['m', 'A.m'], ['init', 'A.init']]} />
      <Arrow x1={256} y1={56} x2={280} y2={56} color={tok('ink', 0.6)} />
      <Table x={284} title="B, after method" rows={[['m', 'B.m', true], ['init', 'A.init']]} />
      <T x={4} y={110} size={11} fill={tok('muted')}>addAll copies once; B’s own m then replaces the copy</T>
    </Svg>
  );
}
