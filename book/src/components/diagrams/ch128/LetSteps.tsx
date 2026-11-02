// Inferring `let id = λx. x in if id true then id 1 else 2`, one step at
// a time: infer the definition, generalise it, instantiate it afresh at
// each use, and (last) what goes wrong without generalisation.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';

const PROG = 'let id = λx. x in if id true then id 1 else 2';
type S = { from: number; to: number; env: string; work: string; result: string; bad?: boolean; note: string };
const STATES: S[] = [
  { from: 9, to: 14, env: 'Γ = { }', work: 'x : α, so the body x : α', result: 'λx. x : α → α', note: 'First the definition, on its own. The parameter x gets a fresh type variable α, the body is x itself, so the function has type α → α: exactly what the inference of the chapter Inferring types, and the occurs check would say.' },
  { from: 4, to: 6, env: 'Γ = { }', work: 'α is in the type, not in Γ', result: 'id : ∀α. α → α', note: 'Generalise. α appears in the type but nowhere in the environment, so nothing else depends on it: we may write ∀α in front. id is stored as a scheme, a type with a blank.' },
  { from: 21, to: 28, env: 'Γ = { id : ∀α. α → α }', work: 'fresh copy β → β; β = bool', result: 'id true : bool', note: 'The first use. Instantiate: copy the scheme with a fresh variable β in place of α. Unifying β → β with the argument true fixes β = bool, so this call is a bool: fine as the condition of an if.' },
  { from: 34, to: 38, env: 'Γ = { id : ∀α. α → α }', work: 'fresh copy γ → γ; γ = number', result: 'id 1 : number', note: 'The second use gets its own copy, γ → γ. The argument 1 fixes γ = number. β was already settled as bool, but γ is a different variable, so there is no clash.' },
  { from: 18, to: 45, env: 'Γ = { id : ∀α. α → α }', work: 'both branches : number', result: 'the program : number', note: 'The if needs a bool condition (it is) and two branches of the same type: id 1 and 2 are both numbers. The whole program has type number.' },
  { from: 21, to: 38, env: 'Γ = { id : α → α }  (no ∀)', work: 'α = bool, then α = number', result: 'type error: bool ≠ number', bad: true, note: 'Without generalisation, id has the single type α → α. The first use sets α = bool for good; the second asks for α = number, and unification fails. That is the inference of the chapter Inferring types, and the occurs check, and why it is not enough.' },
];

const CW = 7.1;

export default function LetSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const x0 = 200 - (PROG.length * CW) / 2;
  const colour = st.bad ? tok('danger') : tok('brand');
  return (
    <StepFrame title="Generalise once, instantiate at every use" steps={s} note={st.note}>
      <Svg w={400} h={150} title="The program, with the part being inferred highlighted, the environment, the work done at this step and its result">
        <rect x={x0 + st.from * CW - 2} y={12} width={(st.to - st.from) * CW + 4} height={22} rx={4} fill={st.bad ? tok('danger', 0.14) : tok('brand', 0.14)} stroke={colour} />
        <T x={x0} y={23} size={12} mono>{PROG.replace(/ /g, ' ')}</T>
        <T x={12} y={58} size={11} weight={700} fill={tok('muted')}>environment</T>
        <T x={110} y={58} size={12} mono>{st.env}</T>
        <T x={12} y={84} size={11} weight={700} fill={tok('muted')}>this step</T>
        <T x={110} y={84} size={12} mono>{st.work}</T>
        <T x={12} y={114} size={11} weight={700} fill={tok('muted')}>result</T>
        <T x={110} y={114} size={13} mono weight={700} fill={st.bad ? tok('danger') : tok('safe')}>{st.result}</T>
        <T x={200} y={140} size={11} anchor="middle" fill={tok('muted')}>step {s.i + 1} of {s.n}</T>
      </Svg>
    </StepFrame>
  );
}
