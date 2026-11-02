import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// The safety decision as a flowchart: a candidate collection passes through
// every check; each failure adds a reason to the bailout list (and checking
// carries on). The example lines and messages are real viscosity explain
// output for small variations of one program.
const CHECKS = [
  { k: 'bind', label: 'bound to this array only once?' },
  { k: 'shape', label: 'literals unify, each used once?' },
  { k: 'array', label: 'every use of ps on the allow-list?' },
  { k: 'elem', label: 'every element use a field get/set?' },
  { k: 'index', label: 'every index provably a number?' },
];

type S = { at: number; fail: number[]; example?: string; msg?: string; done?: 'safe' | 'unsafe'; note: string };

const STATES: S[] = [
  { at: -1, fail: [], note: 'A candidate arrives from collection discovery: a const or let that is given an empty array or an array literal. Nothing about it is trusted yet.' },
  { at: 0, fail: [0], example: 'let ps = []; … ps = [];', msg: '"ps" is reassigned (line 5), so it may not always hold this array', note: 'If the name is assigned again, some later ps[i] may be reading a different array, one Viscosity never rewrote.' },
  { at: 1, fail: [1], example: 'push({x, y}) … push({y, x})', msg: 'records with different fields or field order', note: 'The shape must unify and stay stable (chapter 227): same fields in the same order, and no literal that is also held by another name.' },
  { at: 2, fail: [2], example: 'ps.reverse();', msg: 'uses .reverse on the array (only .length and .push are supported)', note: 'The array itself may only be used for .length, push of one fresh literal, ps[i], or as an argument to a known function. reverse() would expect real elements to move.' },
  { at: 3, fail: [3], example: 'console.log(ps[3]);', msg: 'an element is passed to a method call', note: 'Each ps[i] hands out an element, whose uses are checked in turn. Only reading or writing a field of the shape is allowed (chapter 198).' },
  { at: 4, fail: [4], example: 'const k = "3"; ps[k].x', msg: 'indexes the array with something that may not be a number', note: 'Last, the indexes. This uses the numeric fixpoint, so it runs after type inference. A string index might name a property instead of an element.' },
  { at: 4, fail: [2, 3], example: 'ps.reverse(); console.log(ps[3]);', msg: 'two reasons: .reverse, and an element passed to a call', note: 'A failure doesn’t stop the checks. Every reason is collected (and duplicates removed), so explain can list everything you would need to change.' },
  { at: 5, fail: [], done: 'safe', note: 'No reasons at all: the bailout list is empty, so the collection is safe. That doesn’t mean it will be transformed. The cost model (chapter 231) still decides whether it pays off.' },
  { at: 5, fail: [3], done: 'unsafe', example: 'console.log(ps[3]);', msg: 'unsafe: line 10: an element is passed to a method call', note: 'Any reason at all: the planner keeps the array of objects and prefixes each reason with “unsafe:”. No cost question is ever asked.' },
];

function wrap(text: string, n: number): string[] {
  const out: string[] = [];
  let cur = '';
  for (const w of text.split(' ')) {
    if (cur && (cur + ' ' + w).length > n) { out.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w;
  }
  if (cur) out.push(cur);
  return out;
}

export default function SafetySteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const top = 34;
  const gap = 40;
  return (
    <StepFrame title="From candidate to safe or unsafe" steps={s} note={st.note}>
      <Svg w={400} h={350} title="A flowchart of Viscosity's five safety checks">
        <Box x={110} y={4} w={180} h={24} fill={st.at === -1 ? tok('brand', 0.15) : tok('panel')} stroke={st.at === -1 ? tok('brand') : tok('line')}>
          <T x={200} y={16} size={12} weight={700} anchor="middle">candidate ps</T>
        </Box>
        {CHECKS.map((c, k) => {
          const y = top + k * gap;
          const failed = st.fail.includes(k);
          const active = st.at === k || (st.at >= k && failed);
          const passed = st.at > k && !failed;
          return (
            <g key={c.k}>
              <Arrow x1={200} y1={y - 6} x2={200} y2={y + 2} />
              <Box x={40} y={y + 4} w={250} h={28} fill={failed ? tok('danger', 0.12) : passed ? tok('safe', 0.08) : active ? tok('brand', 0.12) : tok('panel')} stroke={failed ? tok('danger') : passed ? tok('safe') : active ? tok('brand') : tok('line')}>
                <T x={52} y={y + 18} size={12}>{c.label}</T>
              </Box>
              {failed && <Arrow x1={290} y1={y + 18} x2={318} y2={y + 18} color={tok('danger')} />}
              {failed && <T x={322} y={y + 18} size={11} weight={700} fill={tok('danger')}>no → reason</T>}
            </g>
          );
        })}
        <Arrow x1={200} y1={top + 5 * gap - 6} x2={200} y2={top + 5 * gap + 2} />
        <Box x={40} y={top + 5 * gap + 4} w={250} h={28} fill={st.done === 'safe' ? tok('safe', 0.15) : st.done === 'unsafe' ? tok('danger', 0.15) : tok('panel')} stroke={st.done === 'safe' ? tok('safe') : st.done === 'unsafe' ? tok('danger') : tok('line')}>
          <T x={165} y={top + 5 * gap + 18} size={12} weight={700} anchor="middle">
            {st.done === 'safe' ? 'bailouts empty → safe' : st.done === 'unsafe' ? 'bailouts not empty → unsafe' : 'bailouts empty?'}
          </T>
        </Box>
        {st.example && (
          <g>
            <T x={8} y={290} size={11} weight={700} fill={tok('muted')}>EXAMPLE</T>
            <T x={70} y={290} size={12} mono>{st.example}</T>
          </g>
        )}
        {st.msg && wrap(st.msg, 56).map((l, k) => (
          <T key={k} x={8} y={312 + k * 16} size={11} mono fill={tok('danger')}>{l}</T>
        ))}
      </Svg>
    </StepFrame>
  );
}
