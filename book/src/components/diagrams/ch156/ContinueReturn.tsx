import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 156: the shape of plan() in engine/ts/packages/core/src/plan.ts
// next to plan() and plan_one() in engine/rust/crates/core/src/plan.rs,
// condensed (arguments and reason strings elided with …). Each TypeScript
// refusal is `out.push(keep(...)); continue;`; each Rust one is
// `return keep(...)`.
const TS = [
  'for (const c of a.collections) {',
  '  const keep = (...reasons) =>',
  '    ({ collection: c,',
  "       layout: 'aos', … });",
  '  if (c.bailouts.length) {',
  '    out.push(keep(…));',
  '    continue;',
  '  }',
  '  … more rungs …',
  "  out.push({ layout: 'soa', … });",
  '}',
];
const RS = [
  'for c in &a.collections {',
  '  out.push(plan_one(a, c, &opts));',
  '}',
  'fn plan_one(…) -> CollectionPlan {',
  '  let keep = |reasons| CollectionPlan',
  '    { collection: c.clone(),',
  '      layout: Layout::Aos, … };',
  '  if !c.bailouts.is_empty() {',
  '    return keep(…);',
  '  }',
  '  … more rungs …',
  '  CollectionPlan { layout: Soa, … }',
  '}',
];

export default function ContinueReturn() {
  return (
    <Svg w={400} h={410} title="The TypeScript planner refuses with push and continue; the Rust planner moves the loop body into plan_one and refuses with return">
      <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>TYPESCRIPT: plan()</T>
      <Box x={2} y={22} w={396} h={11 * 15 + 10} fill={tok('panel')}>
        {TS.map((l, k) => (
          <T key={k} x={10} y={36 + k * 15} size={11} mono fill={k === 6 ? tok('warn') : undefined} weight={k === 6 ? 700 : undefined}>{l}</T>
        ))}
      </Box>
      <T x={6} y={212} size={11} weight={700} fill={tok('muted')}>RUST: plan() and plan_one()</T>
      <Box x={2} y={222} w={396} h={13 * 13 + 8} fill={tok('panel')}>
        {RS.map((l, k) => (
          <T key={k} x={10} y={234 + k * 13} size={11} mono fill={k === 8 ? tok('warn') : undefined} weight={k === 8 ? 700 : undefined}>{l}</T>
        ))}
      </Box>
      <Arrow x1={110} y1={130} x2={150} y2={334} bend={-0.5} color={tok('warn')} dash />
      <T x={250} y={130} size={11} fill={tok('warn')}>next collection, or</T>
      <T x={250} y={145} size={11} fill={tok('warn')}>leave plan_one early</T>
    </Svg>
  );
}
