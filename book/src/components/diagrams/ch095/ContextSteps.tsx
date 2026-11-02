// Chapter 95: the identity function called from two call sites, analysed
// once without contexts (the answers smear together) and once with one
// call site of context (each call keeps its own answer).
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `function id(p) { return p; }
const a = id({ n: 1 });  // s1, o1
const b = id({ n: 2 });  // s2, o2`;

type Row = { name: string; v: string; hot?: boolean; bad?: boolean };
type S = { line: number | null; mode: 'none' | 'ctx'; rows: Row[]; note: string };

const STATES: S[] = [
  { line: 0, mode: 'none', rows: [{ name: 'p', v: '{}' }, { name: 'a', v: '{}' }, { name: 'b', v: '{}' }], note: 'First, without contexts: id is analysed once, so its parameter p has one points-to set for every call, like a single shared shelf.' },
  { line: 1, mode: 'none', rows: [{ name: 'p', v: '{o1}', hot: true }, { name: 'a', v: '{o1}', hot: true }, { name: 'b', v: '{}' }], note: 'Call s1 passes o1, so o1 flows into p; id returns p, so p’s set flows back out to a.' },
  { line: 2, mode: 'none', rows: [{ name: 'p', v: '{o1, o2}', hot: true }, { name: 'a', v: '{o1}' }, { name: 'b', v: '{o1, o2}', hot: true }], note: 'Call s2 passes o2. p now holds {o1, o2}, and the return copies all of it into b.' },
  { line: null, mode: 'none', rows: [{ name: 'p', v: '{o1, o2}' }, { name: 'a', v: '{o1, o2}', bad: true }, { name: 'b', v: '{o1, o2}', bad: true }], note: 'And because return flows into a too, a grows to {o1, o2} as well. Now a and b “may alias”, which is false: the analysis followed a path in at s2 and out at s1, which no real run can take.' },
  { line: 0, mode: 'ctx', rows: [{ name: 'p @ s1', v: '{}' }, { name: 'p @ s2', v: '{}' }, { name: 'a', v: '{}' }, { name: 'b', v: '{}' }], note: 'Now with one call site of context: id gets a separate copy of its facts for each call site that reaches it, labelled with that site.' },
  { line: 1, mode: 'ctx', rows: [{ name: 'p @ s1', v: '{o1}', hot: true }, { name: 'p @ s2', v: '{}' }, { name: 'a', v: '{o1}', hot: true }, { name: 'b', v: '{}' }], note: 'Call s1: o1 flows into p in context s1, and the return in context s1 goes back to s1 only, so into a.' },
  { line: 2, mode: 'ctx', rows: [{ name: 'p @ s1', v: '{o1}' }, { name: 'p @ s2', v: '{o2}', hot: true }, { name: 'a', v: '{o1}' }, { name: 'b', v: '{o2}', hot: true }], note: 'Call s2: o2 flows into p in context s2 and back to b. The two calls never meet, so a and b do not alias, which is the truth.' },
];

export default function ContextSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="One shelf, or one shelf per caller" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={190} title="The points-to sets of p, a and b, first without contexts, then with p split by call site">
        <T x={8} y={12} size={11} weight={700} fill={tok(st.mode === 'none' ? 'warn' : 'safe')}>
          {st.mode === 'none' ? 'CONTEXT-INSENSITIVE' : '1-CALL-SITE SENSITIVE'}
        </T>
        {st.rows.map((r, k) => {
          const y = 26 + k * 40;
          const c = r.bad ? 'danger' : r.hot ? 'brand' : 'line';
          return (
            <Box key={r.name} x={8} y={y} w={384} h={32} fill={r.bad ? tok('danger', 0.1) : r.hot ? tok('brand', 0.1) : tok('panel')} stroke={tok(c)}>
              <T x={20} y={y + 16} size={13} mono weight={700}>{r.name}</T>
              <T x={380} y={y + 16} size={13} mono anchor="end">{r.v}</T>
            </Box>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
