// (Λα. λx:α. x) [number] 5 in System F: a type is passed as an argument,
// substituted into the body, and then erased before the program runs.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';

type S = { term: string; type: string; what: string; note: string; done?: boolean };
const STATES: S[] = [
  { term: 'Λα. λx:α. x', type: '∀α. α → α', what: 'type abstraction (TAbs)', note: 'Λα (a capital lambda) takes a type as its argument, the way λx takes a value. Its body is an ordinary function whose parameter has type α, so the whole thing has the type ∀α. α → α.' },
  { term: '(Λα. λx:α. x) [number]', type: 'number → number', what: 'type application (TApp)', note: 'Square brackets pass a type: [number]. TApp says the result has the ∀ type with α replaced by number. In HM this step was hidden inside instantiation; here it is written in the program.' },
  { term: 'λx:number. x', type: 'number → number', what: 'the type argument is substituted', note: 'Running a type application substitutes the type into the body, exactly like beta-reduction substitutes a value. What is left is an ordinary function on numbers.' },
  { term: '(λx:number. x) 5', type: 'number', what: 'ordinary application', note: 'Apply it to 5: the argument’s type, number, matches the parameter’s, so the call has type number.' },
  { term: '5', type: 'number', what: 'a value', done: true, note: 'The result, of the promised type. Notice that the type argument never affected what the program computed: erase every type and Λ, and (λx. x) 5 runs the same way. TypeScript’s generics are erased like this too (chapter 28).' },
];

export default function TypeAppSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Passing a type as an argument" steps={s} note={st.note}>
      <Svg w={400} h={130} title="The current System F term, its type, and what kind of step it is">
        <rect x={20} y={10} width={360} height={32} rx={5} fill={tok('brand', 0.1)} stroke={st.done ? tok('safe') : tok('brand')} />
        <T x={200} y={26} size={15} mono anchor="middle">{st.term.replace(/ /g, ' ')}</T>
        <T x={20} y={66} size={11} weight={700} fill={tok('muted')}>type</T>
        <T x={90} y={66} size={13} mono weight={700} fill={tok('accent')}>{st.type}</T>
        <T x={20} y={92} size={11} weight={700} fill={tok('muted')}>this step</T>
        <T x={90} y={92} size={12}>{st.what}</T>
        <T x={200} y={118} size={11} anchor="middle" fill={tok('muted')}>step {s.i + 1} of {s.n}</T>
      </Svg>
    </StepFrame>
  );
}
