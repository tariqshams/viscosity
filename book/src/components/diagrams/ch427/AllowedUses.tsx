import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 427: the only uses the escape checks of
// engine/rust/crates/core/src/analysis.rs accept. For the array
// (use_of_collection): .length, push of a fresh record, index.get, and a
// call to a known function that every caller passes it to (followed into
// the parameter). For an element (element_uses): field.get and field.set
// with the element as operand 0, on a field the records have. Anything
// else is a bailout whose words come from describe_use.
const ARRAY = ['ps.length', 'ps.push({ ... })', 'ps[i]', 'step(ps) (known)'];
const ELEM = ['ps[i].x', 'ps[i].x = v'];
const NO = ['box.k = ps[1]', 'bump(ps[0])', 'return qs[0]', 'p = ps[9] (phi)'];

function Col({ x, title, items, col }: { x: number; title: string; items: string[]; col: string }) {
  return (
    <g>
      <T x={x} y={16} size={11} weight={700} fill={tok('muted')}>{title}</T>
      {items.map((t, k) => (
        <Box key={t} x={x} y={28 + k * 34} w={124} h={26} fill={tok(col, 0.12)} stroke={tok(col)}>
          <T x={x + 8} y={41 + k * 34} size={11} mono>{t}</T>
        </Box>
      ))}
    </g>
  );
}

export default function AllowedUses() {
  return (
    <Svg w={400} h={200} title="The uses Viscosity accepts for an array and for an element, and examples of uses it refuses">
      <Col x={4} title="THE ARRAY MAY" items={ARRAY} col="safe" />
      <Col x={138} title="AN ELEMENT MAY" items={ELEM} col="safe" />
      <Col x={272} title="ANYTHING ELSE" items={NO} col="danger" />
      <T x={200} y={180} size={11} anchor="middle" fill={tok('muted')}>each refusal is one sentence from describe_use</T>
    </Svg>
  );
}
