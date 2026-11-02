import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 297: plan_one in engine/rust/crates/core/src/plan.rs, condensed
// (reason strings shortened), run on one program under three option sets.
// The program pushes inside `if (i % 4 === 0)` in a loop of 100, so the
// analysis says size_estimate = Some(100.0), size_is_upper_bound = true.
// The explain lines are real output of the release CLI (rustc 1.97):
//   viscosity explain l1.js
//   viscosity explain l1.js --min-size 200
//   viscosity profile l1.js -o p1.json   (maxLength 25)
//   viscosity explain l1.js --profile p1.json
// The last step is the TypeScript CLI on the same input (identical since
// 1be50ca fixed the Rust wording).
const CODE = `if !c.bailouts.is_empty() {
    return keep(unsafe_reasons);
}
if let Some(ann) = ann { /* … */ }
if opts.mode == Mode::OptIn {
    return keep("opt-in mode: …");
}
if py && !opts.python_auto { /* … */ }
if c.numeric_fields.is_empty() { … }
if !c.loops.iter().any(|l| l.depth > 0) {
    return keep("no loop reads …");
}
let measured = opts.profile.as_ref()
    .and_then(|p| p.get(&c.name))
    .copied();
let size = measured.or(c.size_estimate);
if let Some(size) = size {
    if size < opts.min_size {
        return keep(below(size));
    }
}
soa(describe(c, size, measured))`;

type S = { line: number | null; opts: string; size: string; out: string[]; kept?: boolean; ts?: boolean; note: string };

const STATES: S[] = [
  { line: null, opts: '(defaults)', size: 'Some(100.0), upper bound', out: [], note: 'One collection: ps, pushed inside if (i % 4 === 0) in a loop of 100. The analysis gives Some(100.0) and sets size_is_upper_bound. The program really pushes 25. Watch it go down plan_one three times.' },
  { line: 9, opts: '(defaults)', size: 'Some(100.0), upper bound', out: [], note: 'It is safe, not annotated, not in opt-in mode, JavaScript, numeric, and a loop touches x. Each of those rungs is an if that would return early with keep(…). None fires.' },
  { line: 15, opts: '(defaults)', size: 'Some(100.0), upper bound', out: [], note: 'No profile, so measured is None, and Option::or falls back to the estimate: 100. That is a maximum, but the rung below treats it as the size.' },
  { line: 21, opts: '(defaults)', size: 'Some(100.0), upper bound', out: ['ps (line 1) {x} → struct of arrays', '  · at most 100 elements'], note: '100 is not below 64, so the end: soa. describe() says “at most”, because the estimate is an upper bound and nothing was measured.' },
  { line: 18, opts: '--min-size 200', size: 'Some(100.0), upper bound', kept: true, out: ['ps (line 1) {x} → kept as array of objects', '  · at most 100 elements: below the', '    200-element threshold, where …'], note: 'With --min-size 200, the same maximum is below the threshold. A maximum below the threshold is a safe refusal: the real size can only be smaller.' },
  { line: 15, opts: '--profile p1.json', size: 'measured: 25', kept: true, out: ['ps (line 1) {x} → kept as array of objects', '  · about 25 elements (measured): below', '    the 64-element threshold, where …'], note: 'viscosity profile ran the original and recorded maxLength 25. measured is Some(25.0), which wins over the estimate, and 25 < 64 keeps it. “about”, never “at most”, for a measurement.' },
  { line: null, opts: '--profile p1.json', size: 'measured: 25', kept: true, ts: true, out: ['ps (line 1) {x} → kept as array of objects', '  · about 25 elements (measured): below', '    the 64-element threshold, where …'], note: 'The TypeScript CLI on the same input: the same lines, byte for byte. When this chapter was first written, plan.rs put “(measured)” before “elements”, and no fixture used --profile. Four profile pairs in the parity fixtures now check it.' },
];

export default function SizeRungSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="One collection, three option sets" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={112} title="The options, the size the planner sees, and the explain output">
        <T x={8} y={12} size={11} fill={tok('muted')}>options</T>
        <T x={80} y={12} size={11} mono>{st.opts}</T>
        <T x={8} y={30} size={11} fill={tok('muted')}>size</T>
        <T x={80} y={30} size={11} mono>{st.size}</T>
        <Box x={4} y={42} w={392} h={66} r={4} fill={st.out.length ? (st.kept ? tok('warn', 0.12) : tok('safe', 0.12)) : tok('panel')} stroke={st.ts ? tok('f3') : tok('line')}>
          {st.ts && <T x={390} y={52} size={9} anchor="end" weight={700} fill={tok('f3')}>TypeScript CLI</T>}
          {st.out.map((l, k) => (
            <T key={k} x={10} y={58 + k * 16} size={10.5} mono>{l}</T>
          ))}
        </Box>
      </Svg>
    </StepFrame>
  );
}
