import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// The static size estimate from engine/ts/packages/core/src/analysis.ts
// (section 5): literal elements, plus each push times the trip counts of
// the constant counting loops around it. A push that may not run on every
// path makes the count a maximum; a push in a function, or a loop with a
// bound that is not a constant, makes it unknown. The explain wording in
// each step is the real output of `viscosity explain` on that program.

type S = {
  code: string;
  line: number | null;
  sum: string[];
  result: string;
  verdict: 'kept' | 'soa' | null;
  note: string;
};

const STATES: S[] = [
  {
    code: `const pts = [{ x: 1, y: 2 },
  { x: 3, y: 4 }];`,
    line: 0,
    sum: ['literal elements: 2'],
    result: 'about 2 elements',
    verdict: 'kept',
    note: 'Start with the literal elements: two records written out in the array literal. No push, so the estimate is 2, and 2 is below 64: kept.',
  },
  {
    code: `const ps = [];
for (let i = 0; i < 1000; i++)
  ps.push({ x: i });`,
    line: 2,
    sum: ['literal elements: 0', 'push × 1000 trips'],
    result: 'about 1000 elements',
    verdict: 'soa',
    note: 'A push inside a counting loop with a constant bound, i < 1000, counts once per trip: 0 + 1000. Well above 64, so the size rule lets it through.',
  },
  {
    code: `const cs = [];
for (let r = 0; r < 20; r++)
  for (let c = 0; c < 30; c++)
    cs.push({ v: r * c });`,
    line: 3,
    sum: ['literal elements: 0', 'push × 20 × 30 trips'],
    result: 'about 600 elements',
    verdict: 'soa',
    note: 'Nested loops multiply: the push runs 30 times for each of the 20 outer trips, so 20 × 30 = 600.',
  },
  {
    code: `const ps = [];
for (let i = 0; i < 40; i++)
  if (i % 2) ps.push({ x: i });`,
    line: 2,
    sum: ['literal elements: 0', 'push × 40 trips (maybe)'],
    result: 'at most 40 elements',
    verdict: 'kept',
    note: 'This push sits under an if, so it may not run on every trip. Counting it every time gives a maximum, not an estimate, and explain says “at most 40”. (It really runs 20 times.) Below 64: kept.',
  },
  {
    code: `const ps = [];
function spawn(k) {
  for (let i = 0; i < k; i++)
    ps.push({ x: i, v: 1 });
}
spawn(10);`,
    line: 3,
    sum: ['push in a function', 'loop bound k: not a constant'],
    result: 'size unknown statically',
    verdict: 'soa',
    note: 'Two reasons to give up: the bound k is not a constant, and the push is inside a function, which may be called any number of times. Unknown passes the size rule, so ps is transformed, although it holds only ten points.',
  },
  {
    code: `$ viscosity profile spawn.js \\
    -o prof.json
{ "ps": { "maxLength": 10 } }`,
    line: 2,
    sum: ['measured by a profiling run', 'maxLength: 10'],
    result: 'about 10 elements (measured)',
    verdict: 'kept',
    note: 'A profile replaces the guess. Running the original program once, with counting added, finds that ps never grew past 10. With --profile prof.json the measured 10 is below 64: kept.',
  },
];

export default function SizeSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const vColor = st.verdict === 'kept' ? tok('danger') : tok('safe');
  return (
    <StepFrame title="Estimating a collection’s size" steps={s} note={st.note}>
      <CodeTrace code={st.code} line={st.line} />
      <Svg w={400} h={128} title="How the estimate is added up, what explain prints, and what the size rule decides">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>THE COUNT</T>
        {st.sum.map((t, k) => (
          <T key={k} x={14} y={32 + k * 20} size={12} mono>{(k > 0 ? '+ ' : '  ') + t}</T>
        ))}
        <Box x={6} y={76} w={250} h={44} fill={tok('brand', 0.1)} stroke={tok('brand')}>
          <T x={16} y={89} size={11} weight={700} fill={tok('muted')}>EXPLAIN SAYS</T>
          <T x={16} y={107} size={12} mono>{st.result}</T>
        </Box>
        <T x={270} y={12} size={11} weight={700} fill={tok('muted')}>SIZE RULE (64)</T>
        {st.verdict && (
          <Box x={270} y={76} w={124} h={44} fill={st.verdict === 'kept' ? tok('danger', 0.12) : tok('safe', 0.12)} stroke={vColor}>
            <T x={332} y={92} size={12} anchor="middle" weight={700} fill={vColor}>{st.verdict === 'kept' ? 'kept as' : 'passes:'}</T>
            <T x={332} y={108} size={12} anchor="middle" mono>{st.verdict === 'kept' ? 'objects' : 'soa'}</T>
          </Box>
        )}
      </Svg>
    </StepFrame>
  );
}
