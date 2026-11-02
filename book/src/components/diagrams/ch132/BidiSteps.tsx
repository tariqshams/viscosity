// Bidirectional checking of (λx. x + 1 : number → number) 2, one rule at
// a time: ⇐ checks a term against a type it is given, ⇒ synthesises one.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';

const PROG = '(λx. x + 1 : number → number) 2';
type S = { from: number; to: number; mode: '⇒' | '⇐'; judg: string; rule: string; env: string; note: string; ok?: boolean };
const STATES: S[] = [
  { from: 0, to: 31, mode: '⇒', judg: 'whole ⇒ ?', rule: 'App⇒', env: '{ }', note: 'Nobody tells us what type the whole program should have, so we synthesise (⇒). It is an application, and App⇒ starts by synthesising the type of the function part.' },
  { from: 0, to: 29, mode: '⇒', judg: '(… : number → number) ⇒ ?', rule: 'Anno⇒', env: '{ }', note: 'The function part is an annotation. Anno⇒ says its type is the annotated one, number → number, provided the λ inside really checks against it. So we switch to checking mode.' },
  { from: 1, to: 10, mode: '⇐', judg: 'λx. x + 1 ⇐ number → number', rule: 'Lam⇐', env: '{ }', note: 'Checking a λ against an arrow is easy: the arrow tells us the parameter’s type. x gets number, with no guessing, and the body must check against number.' },
  { from: 5, to: 10, mode: '⇐', judg: 'x + 1 ⇐ number', rule: 'Sub⇐', env: '{ x : number }', note: 'There is no special checking rule for +, so Sub⇐ synthesises its type instead (x ⇒ number from the environment, 1 ⇒ number, so x + 1 ⇒ number) and compares it with the expected number. They match.', ok: true },
  { from: 30, to: 31, mode: '⇐', judg: '2 ⇐ number', rule: 'App⇒, then Sub⇐', env: '{ }', note: 'Back in App⇒: the function has type number → number, so the argument is checked against number. 2 synthesises number, which matches.', ok: true },
  { from: 0, to: 31, mode: '⇒', judg: 'whole ⇒ number', rule: 'App⇒', env: '{ }', note: 'The application synthesises the function’s result type: number. Types flowed down into the λ (⇐) and up out of the pieces (⇒), and the only annotation needed was on the λ.', ok: true },
];

export default function BidiSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const CW = 7.6;
  const x0 = 200 - (PROG.length * CW) / 2;
  const colour = st.mode === '⇐' ? tok('accent') : tok('brand');
  return (
    <StepFrame title="Checking down, synthesising up" steps={s} note={st.note}>
      <Svg w={400} h={150} title="The program with the part being typed highlighted, the current judgement with its mode, the rule used and the environment">
        <rect x={x0 + st.from * CW - 2} y={10} width={(st.to - st.from) * CW + 4} height={24} rx={4} fill={st.mode === '⇐' ? tok('accent', 0.14) : tok('brand', 0.14)} stroke={colour} />
        <T x={x0} y={22} size={13} mono>{PROG.replace(/ /g, ' ')}</T>
        <T x={12} y={58} size={11} weight={700} fill={tok('muted')}>mode</T>
        <T x={92} y={58} size={12} weight={700} fill={colour}>{st.mode === '⇐' ? '⇐ check against a given type' : '⇒ synthesise a type'}</T>
        <T x={12} y={84} size={11} weight={700} fill={tok('muted')}>judgement</T>
        <T x={92} y={84} size={12} mono fill={st.ok ? tok('safe') : tok('ink')}>{st.judg}</T>
        <T x={12} y={110} size={11} weight={700} fill={tok('muted')}>rule, Γ</T>
        <T x={92} y={110} size={12} mono>{`${st.rule}    Γ = ${st.env}`}</T>
        <T x={200} y={138} size={11} anchor="middle" fill={tok('muted')}>step {s.i + 1} of {s.n}</T>
      </Svg>
    </StepFrame>
  );
}
