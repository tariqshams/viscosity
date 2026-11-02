// Building the typing derivation of (λx:Num. x + 1) 2 from the goal
// upwards, as a checker does: each step applies one rule to an open
// goal, adding its premises as new goals, until every branch closes.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';

type Status = 'open' | 'active' | 'done';
type Row = { d: number; text: string; rule: string; s: Status };
type S = { rows: Row[]; note: string };

const STATES: S[] = [
  { rows: [{ d: 0, text: '⊢ (λx:Num. x + 1) 2 : ?', rule: '', s: 'active' }],
    note: 'The goal: in the empty environment, what type does (λx:Num. x + 1) 2 have? We do not know yet, so write ? and look for a rule whose conclusion has this shape.' },
  { rows: [
    { d: 0, text: '⊢ (λx:Num. x + 1) 2 : ?', rule: 'App', s: 'open' },
    { d: 1, text: '⊢ λx:Num. x + 1 : T₁ → T₂', rule: '', s: 'active' },
    { d: 1, text: '⊢ 2 : T₁', rule: '', s: 'open' }],
    note: 'It is an application, so only T-App fits. Its two premises become new goals: the function must have some type T₁ → T₂, and the argument must have that same T₁. The answer will be T₂.' },
  { rows: [
    { d: 0, text: '⊢ (λx:Num. x + 1) 2 : ?', rule: 'App', s: 'open' },
    { d: 1, text: '⊢ λx:Num. x + 1 : Num → T₂', rule: 'Abs', s: 'open' },
    { d: 2, text: 'x:Num ⊢ x + 1 : T₂', rule: '', s: 'active' },
    { d: 1, text: '⊢ 2 : T₁', rule: '', s: 'open' }],
    note: 'The function is a λ, so T-Abs. The annotation says T₁ is Num. Its premise checks the body in Γ extended with x : Num, which is why x is now on the left of the ⊢.' },
  { rows: [
    { d: 0, text: '⊢ (λx:Num. x + 1) 2 : ?', rule: 'App', s: 'open' },
    { d: 1, text: '⊢ λx:Num. x + 1 : Num → T₂', rule: 'Abs', s: 'open' },
    { d: 2, text: 'x:Num ⊢ x + 1 : Num', rule: 'Plus', s: 'open' },
    { d: 3, text: 'x:Num ⊢ x : Num', rule: '', s: 'active' },
    { d: 3, text: 'x:Num ⊢ 1 : Num', rule: '', s: 'active' },
    { d: 1, text: '⊢ 2 : T₁', rule: '', s: 'open' }],
    note: 'The body is a +, so T-Plus: it gives Num, so T₂ is Num, but only if both sides are Num. Two new goals.' },
  { rows: [
    { d: 0, text: '⊢ (λx:Num. x + 1) 2 : ?', rule: 'App', s: 'open' },
    { d: 1, text: '⊢ λx:Num. x + 1 : Num → Num', rule: 'Abs', s: 'done' },
    { d: 2, text: 'x:Num ⊢ x + 1 : Num', rule: 'Plus', s: 'done' },
    { d: 3, text: 'x:Num ⊢ x : Num', rule: 'Var', s: 'done' },
    { d: 3, text: 'x:Num ⊢ 1 : Num', rule: 'Num', s: 'done' },
    { d: 1, text: '⊢ 2 : Num', rule: '', s: 'active' }],
    note: 'x : Num is in Γ, so T-Var closes the first goal; 1 is a number literal, so the axiom T-Num closes the second. The whole left branch is finished: the function has type Num → Num, so T₁ is Num.' },
  { rows: [
    { d: 0, text: '⊢ (λx:Num. x + 1) 2 : Num', rule: 'App', s: 'done' },
    { d: 1, text: '⊢ λx:Num. x + 1 : Num → Num', rule: 'Abs', s: 'done' },
    { d: 2, text: 'x:Num ⊢ x + 1 : Num', rule: 'Plus', s: 'done' },
    { d: 3, text: 'x:Num ⊢ x : Num', rule: 'Var', s: 'done' },
    { d: 3, text: 'x:Num ⊢ 1 : Num', rule: 'Num', s: 'done' },
    { d: 1, text: '⊢ 2 : Num', rule: 'Num', s: 'done' }],
    note: 'The argument 2 is a Num by T-Num, which is exactly the T₁ the function wants. Every branch ends in an axiom or a lookup, so this is a derivation: the whole term has type Num.' },
];

const COL: Record<Status, string> = { open: tok('muted'), active: tok('brand'), done: tok('safe') };

export default function DerivationSteps() {
  const s = useSteps(STATES);
  const rows = s.state.rows;
  return (
    <StepFrame title="A derivation, built from the goal upwards" steps={s} note={s.state.note}>
      <Svg w={400} h={30 + rows.length * 30} title={`The derivation so far, one goal per line: ${rows.map((r) => r.text + (r.rule ? ' by ' + r.rule : '')).join('; ')}`}>
        <T x={8} y={14} size={11} fill={tok('muted')}>goal (indented under the goal it serves)</T>
        <T x={392} y={14} size={11} anchor="end" fill={tok('muted')}>rule</T>
        {rows.map((r, i) => (
          <g key={i}>
            <T x={8 + r.d * 16} y={40 + i * 30} size={13} mono weight={r.s === 'active' ? 700 : 400} fill={COL[r.s]}>{r.text}</T>
            <T x={392} y={40 + i * 30} size={12} anchor="end" weight={700} fill={r.rule ? tok('accent') : tok('muted')}>{r.rule || (r.s === 'active' ? 'which?' : '')}</T>
          </g>
        ))}
      </Svg>
    </StepFrame>
  );
}
