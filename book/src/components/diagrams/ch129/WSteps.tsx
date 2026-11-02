// Algorithm W on λf. λx. f (f x): each step names the case of W that
// runs, the equation it adds, and the substitution so far.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';

const PROG = 'λf. λx. f (f x)';
type S = { from: number; to: number; env: string; eq: string; subst: string; note: string; done?: boolean };
const STATES: S[] = [
  { from: 0, to: 15, env: 'f : α', eq: '(none yet)', subst: '{ }', note: 'Case λ: the parameter f gets a fresh variable α, with no ∀ (parameters are never generalised). Now infer the body with f : α in the environment.' },
  { from: 4, to: 15, env: 'f : α,  x : β', eq: '(none yet)', subst: '{ }', note: 'Case λ again: x gets a fresh β. The body is the application f (f x); W infers the function part, then the argument, which is itself an application.' },
  { from: 11, to: 14, env: 'f : α,  x : β', eq: 'α = β → γ', subst: '{ α ↦ β → γ }', note: 'Case application, inside: f x. f has type α and x has type β; make a fresh γ for the result and unify α with β → γ. α is a variable, so the substitution now says α is β → γ.' },
  { from: 8, to: 15, env: 'f : α,  x : β', eq: 'β → γ = γ → δ', subst: '{ α ↦ β → γ, β ↦ γ, γ ↦ δ }', note: 'Case application, outside: f (f x). f’s type, looked up through the substitution, is β → γ; the argument f x has type γ; a fresh δ is the result. Unifying β → γ with γ → δ gives β = γ and γ = δ.' },
  { from: 0, to: 15, env: '', eq: 'α → β → δ, resolved', subst: '(δ → δ) → δ → δ', done: true, note: 'Back out through both λs: the type is α → β → δ. Applying the substitution, α is β → γ, which is δ → δ, and β is δ. Renaming δ to a: (a → a) → a → a, the most general type of twice.' },
];

export default function WSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const CW = 9;
  const x0 = 200 - (PROG.length * CW) / 2;
  return (
    <StepFrame title="Algorithm W on λf. λx. f (f x)" steps={s} note={st.note}>
      <Svg w={400} h={150} title="The term, with the part W is working on highlighted, the environment, the equation added at this step, and the substitution so far">
        <rect x={x0 + st.from * CW - 2} y={10} width={(st.to - st.from) * CW + 4} height={24} rx={4} fill={tok('brand', 0.14)} stroke={tok('brand')} />
        <T x={x0} y={22} size={15} mono>{PROG.replace(/ /g, ' ')}</T>
        <T x={12} y={58} size={11} weight={700} fill={tok('muted')}>environment</T>
        <T x={104} y={58} size={12} mono>{st.env || '(empty again)'}</T>
        <T x={12} y={84} size={11} weight={700} fill={tok('muted')}>{st.done ? 'type' : 'equation'}</T>
        <T x={104} y={84} size={12} mono fill={tok('accent')}>{st.eq}</T>
        <T x={12} y={110} size={11} weight={700} fill={tok('muted')}>{st.done ? 'result' : 'substitution'}</T>
        <T x={104} y={110} size={st.subst.length > 30 ? 11 : 12} mono weight={st.done ? 700 : 400} fill={st.done ? tok('safe') : tok('ink')}>{st.subst}</T>
        <T x={200} y={138} size={11} anchor="middle" fill={tok('muted')}>step {s.i + 1} of {s.n}</T>
      </Svg>
    </StepFrame>
  );
}
