// Running a well-typed term: at every step a rule applies (progress) and
// the type stays the same (preservation). Then an ill-typed one, which
// gets stuck and was never given a type.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';

type S = { term: string; type: string; progress: string; preservation: string; bad?: boolean; done?: boolean; note: string };
const STATES: S[] = [
  { term: 'if 1 < 2 then 3 + 4 else 0', type: 'number', progress: 'If steps the condition', preservation: '(start)', note: 'The term has type number: the condition 1 < 2 is a bool, and both branches, 3 + 4 and 0, are numbers (T-If). It is not a value, so progress promises some rule applies; here it is If, stepping the condition.' },
  { term: 'if true then 3 + 4 else 0', type: 'number', progress: 'IfT applies', preservation: 'still number', note: 'After one step the type is still number: preservation. The condition is now a value of type bool, and the canonical forms lemma says such a value is true or false, so IfT or IfF must apply.' },
  { term: '3 + 4', type: 'number', progress: 'Add applies', preservation: 'still number', note: 'IfT kept the then branch, which T-If already said was a number. Both sides are values of type number, so they are numbers, and Add applies.' },
  { term: '7', type: 'number', progress: 'a value: done', preservation: 'still number', done: true, note: 'A value of the type we started with. At no point was the term stuck: that is soundness, built from progress (always a next step, until a value) and preservation (the type never changes).' },
  { term: 'if 1 then 2 else 3', type: 'no type', progress: 'no rule applies: stuck', preservation: '', bad: true, note: 'An ill-typed term: T-If needs the condition to be a bool, and 1 is a number, so the term has no type. It is also stuck. Soundness only speaks about typed terms, and this is exactly the kind of term the type checker exists to reject.' },
];

export default function SoundSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const colour = st.bad ? tok('danger') : st.done ? tok('safe') : tok('brand');
  return (
    <StepFrame title="Progress and preservation, one step at a time" steps={s} note={st.note}>
      <Svg w={400} h={150} title="The current term, its type, which rule applies (progress) and whether the type is unchanged (preservation)">
        <rect x={20} y={10} width={360} height={30} rx={5} fill={st.bad ? tok('danger', 0.12) : tok('brand', 0.1)} stroke={colour} />
        <T x={200} y={25} size={14} mono anchor="middle" weight={st.done ? 700 : 400}>{st.term.replace(/ /g, ' ')}</T>
        <T x={20} y={64} size={11} weight={700} fill={tok('muted')}>type</T>
        <T x={120} y={64} size={13} mono weight={700} fill={st.bad ? tok('danger') : tok('ink')}>{st.type}</T>
        <T x={20} y={90} size={11} weight={700} fill={tok('muted')}>progress</T>
        <T x={120} y={90} size={12} fill={st.bad ? tok('danger') : tok('safe')}>{st.progress}</T>
        <T x={20} y={116} size={11} weight={700} fill={tok('muted')}>preservation</T>
        <T x={120} y={116} size={12} fill={tok('safe')}>{st.preservation}</T>
        <T x={200} y={140} size={11} anchor="middle" fill={tok('muted')}>step {s.i + 1} of {s.n}</T>
      </Svg>
    </StepFrame>
  );
}
