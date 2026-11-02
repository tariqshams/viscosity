// Three small programs run one small step at a time; the part about to
// change is highlighted and the rule that justifies the step is named.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';

type S = { prog: string; pre: string; hot: string; post: string; rule: string; note: string; end?: 'value' | 'stuck' };
const STATES: S[] = [
  { prog: 'A', pre: '', hot: '(1 + 2)', post: ' + (3 + 4)', rule: 'AddL, because 1 + 2 → 3 by Add', note: 'Both sides of the outer + are unfinished. AddL lets us step the left side first, and the step it takes there is Add: 1 + 2 → 3.' },
  { prog: 'A', pre: '3 + ', hot: '(3 + 4)', post: '', rule: 'AddR, because 3 + 4 → 7 by Add', note: 'The left side is now a value, 3. AddL no longer applies (a value cannot step), so AddR steps the right side.' },
  { prog: 'A', pre: '', hot: '3 + 7', post: '', rule: 'Add', note: 'Both sides are numbers: Add applies to the whole thing, with no premise to check.' },
  { prog: 'A', pre: '10', hot: '', post: '', rule: 'no rule: a value', end: 'value', note: 'A value: no rule applies, and none should. Three steps, each justified by one rule.' },
  { prog: 'B', pre: 'if ', hot: '1 < 2', post: ' then 3 + 4 else 0', rule: 'If, because 1 < 2 → true by Lt', note: 'The condition is not a value yet, so the If rule steps it. The two branches are left alone: nothing is computed in a branch that may never run.' },
  { prog: 'B', pre: '', hot: 'if true then 3 + 4 else 0', post: '', rule: 'IfT', note: 'Now the condition is true, and IfT replaces the whole if with its then branch, 3 + 4, still unevaluated.' },
  { prog: 'B', pre: '', hot: '3 + 4', post: '', rule: 'Add', note: 'And Add finishes it.' },
  { prog: 'B', pre: '7', hot: '', post: '', rule: 'no rule: a value', end: 'value', note: 'A value, after three steps.' },
  { prog: 'C', pre: '', hot: 'true + 1', post: '', rule: 'no rule applies', end: 'stuck', note: 'Not a value, yet no rule applies: Add needs two numbers, and AddL and AddR need a side that can step. The term is stuck. Stuck terms are what the rules say a runtime error is.' },
];

const CW = 8.4;

export default function SmallSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const all = st.pre + st.hot + st.post;
  const x0 = 200 - ([...all].length * CW) / 2;
  const hx = x0 + [...st.pre].length * CW;
  const hw = [...st.hot].length * CW;
  const color = st.end === 'stuck' ? tok('danger') : st.end === 'value' ? tok('safe') : tok('brand');
  return (
    <StepFrame title="Running one small step at a time" steps={s} note={st.note}>
      <Svg w={400} h={100} title="The current expression, with the part that steps highlighted, and the name of the rule used">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>program {st.prog}</T>
        {st.hot && <rect x={hx - 2} y={30} width={hw + 4} height={24} rx={4} fill={st.end === 'stuck' ? tok('danger', 0.15) : tok('brand', 0.15)} stroke={color} />}
        <T x={x0} y={43} size={14} mono weight={st.end ? 700 : 400} fill={st.end === 'value' ? tok('safe') : tok('ink')}>{all.replace(/ /g, ' ')}</T>
        <T x={200} y={78} size={12} anchor="middle" weight={700} fill={color}>{st.rule}</T>
      </Svg>
    </StepFrame>
  );
}
