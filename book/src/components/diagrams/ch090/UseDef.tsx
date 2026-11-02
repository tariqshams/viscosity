// Chapter 90: before SSA, a use of x could mean any of several
// assignments, and finding the right one means searching; after SSA, the
// name of the use leads to exactly one definition.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const BEFORE = ['x = a + 1', 'x = x * 2', 'y = x + 3', 'x = 0'];
const AFTER = ['x1 = a0 + 1', 'x2 = x1 * 2', 'y1 = x2 + 3', 'x3 = 0'];

function Col({ x, lines, title, color }: { x: number; lines: string[]; title: string; color: string }) {
  return (
    <g>
      <T x={x} y={12} size={11} weight={700} fill={color}>{title}</T>
      {lines.map((l, k) => (
        <Box key={k} x={x} y={28 + k * 40} w={150} h={26} fill={k === 2 ? tok('panel') : tok('paper')} stroke={tok('line')}>
          <T x={x + 10} y={41 + k * 40} size={13} mono>{l}</T>
        </Box>
      ))}
    </g>
  );
}

export default function UseDef() {
  return (
    <Svg w={400} h={230} title="Before SSA, the x read by y = x + 3 has three candidate assignments; after SSA, y1 = x2 + 3 points to the single line defining x2.">
      <Col x={24} lines={BEFORE} title="before: which x?" color={tok('accent')} />
      <Arrow x1={24} y1={121} x2={24} y2={41} color={tok('accent')} bend={-0.9} dash />
      <Arrow x1={24} y1={121} x2={24} y2={81} color={tok('accent')} bend={-0.9} dash />
      <Arrow x1={90} y1={134} x2={90} y2={147} color={tok('accent')} dash />
      <T x={6} y={196} size={11} fill={tok('muted')}>any assignment could be</T>
      <T x={6} y={212} size={11} fill={tok('muted')}>the one: search to find out</T>

      <Col x={232} lines={AFTER} title="after: one name, one line" color={tok('brand')} />
      <Arrow x1={300} y1={109} x2={300} y2={95} color={tok('brand')} width={2.5} />
      <T x={232} y={196} size={11} fill={tok('muted')}>x2 has exactly one</T>
      <T x={232} y={212} size={11} fill={tok('muted')}>definition: no search</T>
    </Svg>
  );
}
