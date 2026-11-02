// The lattices chapter: iterating a monotone function from the top of the
// lattice of subsets of {a, b, c}. F(X) = {a} ∪ {b if c ∈ X}: a is always
// in, b only if c was, c never. The iterates form a descending chain
// {a,b,c} ⊒ {a,b} ⊒ {a}, which stops at the greatest fixpoint.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';
import { Cube, label } from './cube';

type St = { x: string; path: string[]; fx?: string; note: string };
const STATES: St[] = [
  { x: 'abc', path: ['abc'], note: 'The rule: F(X) always contains a, contains b only if X contains c, and never contains c. It is monotone: a bigger X can only add b, never remove anything. Start at the top, X₀ = {a, b, c}.' },
  { x: 'abc', path: ['abc'], fx: 'ab', note: 'Apply F: a is always in; c is in X₀, so b is in; c is never in. F(X₀) = {a, b}. The new point is below the old one.' },
  { x: 'ab', path: ['abc', 'ab'], fx: 'a', note: 'X₁ = {a, b}. Apply F again: a is in; c is NOT in X₁, so b drops out. F(X₁) = {a}. Down again.' },
  { x: 'a', path: ['abc', 'ab', 'a'], fx: 'a', note: 'X₂ = {a}. F(X₂) = {a}: the same point. This is a fixpoint, and the iteration stops.' },
  { x: 'a', path: ['abc', 'ab', 'a'], note: 'Why it had to stop: each step went down (monotone F, started at the top), and this lattice has height 3, so at most 3 steps down are possible. Why it is the BEST answer: any fixpoint Y is below the top, so F(Y) = Y is below F(top), and so on down the chain. Every fixpoint sits below {a}.' },
];

export default function ChainSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Iterating down to a fixpoint" steps={s} note={st.note}>
      <Svg w={400} h={246} title="The lattice of subsets of a, b and c. The iteration starts at the top and moves down through {a, b} to {a}, where F gives back the same set.">
        <Cube hot={st.x} path={st.path} mark={st.fx ? [st.fx] : []} />
        <T x={252} y={30} size={11} weight={700} fill={tok('muted')}>NOW</T>
        <T x={252} y={52} size={13} mono weight={700}>{`X = ${label(st.x)}`}</T>
        <T x={252} y={84} size={11} weight={700} fill={tok('muted')}>F(X)</T>
        <T x={252} y={106} size={13} mono>{st.fx !== undefined ? label(st.fx) : '·'}</T>
        <T x={252} y={140} size={11} fill={tok('muted')}>orange: X</T>
        <T x={252} y={156} size={11} fill={tok('muted')}>blue: F(X)</T>
        <T x={252} y={172} size={11} fill={tok('muted')}>bold line: steps so far</T>
      </Svg>
    </StepFrame>
  );
}
