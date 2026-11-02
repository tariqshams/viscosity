// Chapter 103: facts belong to SSA values, so one variable can have a
// different fact at each point (flow-sensitive), and a phi joins the facts
// of its inputs (a union). Viscosity's own lattice is coarser: a union that
// is not all numbers becomes "maybe not".
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const block = (x: number, y: number, w: number, code: string, fact: string, c: string) => (
  <Box x={x} y={y} w={w} h={44} fill={tok(c, 0.1)} stroke={tok(c)}>
    <T x={x + w / 2} y={y + 15} size={12.5} mono anchor="middle">{code}</T>
    <T x={x + w / 2} y={y + 32} size={11.5} weight={700} anchor="middle" fill={tok(c)}>{fact}</T>
  </Box>
);

export default function UnionMerge() {
  return (
    <Svg w={400} h={250} title="A diamond: x1 = 1 is a number, x2 = 'one' is a string, and x3 = phi(x1, x2) is number or string; Viscosity records maybe not a number">
      {block(130, 6, 140, 'x1 = 1', 'number', 'safe')}
      <T x={200} y={66} size={11} anchor="middle" fill={tok('muted')}>if (c)</T>
      <Arrow x1={170} y1={52} x2={100} y2={92} />
      <Arrow x1={230} y1={52} x2={300} y2={92} />
      {block(30, 94, 140, "x2 = 'one'", 'string', 'warn')}
      <Box x={230} y={94} w={140} h={44} fill="transparent" stroke={tok('line')} dash>
        <T x={300} y={116} size={11.5} anchor="middle" fill={tok('muted')}>(x not assigned)</T>
      </Box>
      <Arrow x1={100} y1={140} x2={170} y2={178} />
      <Arrow x1={300} y1={140} x2={230} y2={178} />
      {block(110, 180, 180, 'x3 = phi(x2, x1)', 'number | string', 'accent')}
      <T x={200} y={240} size={11} anchor="middle" fill={tok('danger')}>Viscosity's two-level lattice: x3 is “maybe not”</T>
    </Svg>
  );
}
