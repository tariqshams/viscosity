import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 365: the two lattices behind numeric_inference in
// engine/rust/crates/core/src/analysis.rs. Left: JavaScript's one fact per
// value, a bool (true = "provably a number", the optimistic start; false =
// "claims nothing"). Right: Python's pair, (is a float, is an int), the
// product of two such bools. Lines go down from a fact to the facts below
// it; meet moves down, never up.
function Node({ x, y, label, top, bottom }: { x: number; y: number; label: string; top?: boolean; bottom?: boolean }) {
  const w = 108;
  return (
    <Box x={x - w / 2} y={y - 14} w={w} h={28} r={14}
      fill={top ? tok('safe', 0.15) : bottom ? tok('danger', 0.1) : tok('panel')}
      stroke={top ? tok('safe') : bottom ? tok('danger') : tok('line')}>
      <T x={x} y={y} size={12} mono anchor="middle">{label}</T>
    </Box>
  );
}

export default function LatticeHasse() {
  const line = tok('ink', 0.4);
  return (
    <Svg w={400} h={230} title="Two lattices: a bool for JavaScript, and a pair of bools for Python's float and int facts">
      <T x={70} y={14} size={11} weight={700} anchor="middle" fill={tok('muted')}>JAVASCRIPT</T>
      <Node x={70} y={60} label="true" top />
      <Arrow x1={70} y1={75} x2={70} y2={150} color={line} width={1.5} />
      <Node x={70} y={165} label="false" bottom />
      <T x={70} y={200} size={11} anchor="middle" fill={tok('muted')}>{'meet = &&'}</T>

      <T x={275} y={14} size={11} weight={700} anchor="middle" fill={tok('muted')}>PYTHON (float, int)</T>
      <Node x={275} y={45} label="(true, true)" top />
      <Arrow x1={255} y1={60} x2={226} y2={96} color={line} width={1.5} />
      <Arrow x1={295} y1={60} x2={324} y2={96} color={line} width={1.5} />
      <Node x={218} y={110} label="(true, false)" />
      <Node x={332} y={110} label="(false, true)" />
      <Arrow x1={226} y1={125} x2={255} y2={161} color={line} width={1.5} />
      <Arrow x1={324} y1={125} x2={295} y2={161} color={line} width={1.5} />
      <Node x={275} y={175} label="(false, false)" bottom />
      <T x={275} y={210} size={11} anchor="middle" fill={tok('muted')}>{'meet = && on each half'}</T>
    </Svg>
  );
}
