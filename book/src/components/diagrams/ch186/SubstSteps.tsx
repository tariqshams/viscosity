// [x ↦ y](λy. x y): the naive answer captures y; the careful one renames
// the bound y first, then substitutes.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';

type K = 'plain' | 'new' | 'target' | 'bad' | 'renamed';
type Tok = [string, K?];
type S = { line: Tok[]; rule: string; note: string };
const STATES: S[] = [
  { line: [['[x ↦ y] '], ['(λy. '], ['x', 'target'], [' y)']], rule: 'the task', note: 'Replace the free x in λy. x y with y. Here x is free in the body (no λx above it), and the y in the body is bound by λy. The y we are putting in is free: it means some y outside.' },
  { line: [['λy. '], ['y', 'bad'], [' y']], rule: 'naive: wrong', note: 'Replacing the text blindly gives λy. y y. But the new y now sits under λy, so it means the parameter, not the outside y: it has been captured. Before, the function applied the outside y to its argument; now it applies its argument to itself, a different function altogether.' },
  { line: [['[x ↦ y] '], ['(λ'], ['z', 'renamed'], ['. x '], ['z', 'renamed'], [')']], rule: 'rename first', note: 'The fix: λy binds a name that is free in what we are inserting, so rename the bound y first, to a name used nowhere else, say z. λy. x y and λz. x z are the same function (alpha-equivalent), so this changes nothing.' },
  { line: [['λz. '], ['[x ↦ y] (x z)']], rule: 'go under the λ', note: 'Now λz cannot capture anything (z is not free in y), so the substitution may go inside the body.' },
  { line: [['λz. '], ['([x ↦ y] x)'], [' '], ['([x ↦ y] z)']], rule: 'split the application', note: 'Substituting into an application means substituting into both parts.' },
  { line: [['λz. '], ['y', 'new'], [' '], ['z', 'renamed']], rule: 'variables', note: 'x is the variable being replaced, so it becomes y; z is a different variable, so it stays. The result, λz. y z, uses the outside y, as it should.' },
];

const COLOR: Record<K, string> = { plain: tok('ink'), new: tok('safe'), target: tok('brand'), bad: tok('danger'), renamed: tok('accent') };

export default function SubstSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  let x = 200 - (st.line.reduce((n, [t]) => n + [...t].length, 0) * 10.2) / 2;
  return (
    <StepFrame title="Substitution without capture" steps={s} note={st.note}>
      <Svg w={400} h={96} title="The term being worked on, with the replaced, captured and renamed variables coloured">
        <T x={200} y={18} size={12} anchor="middle" weight={700} fill={tok('muted')}>{st.rule}</T>
        {st.line.map(([t, k = 'plain'], i) => {
          const el = (
            <T key={i} x={x} y={54} size={17} mono weight={k === 'plain' ? 400 : 700} fill={COLOR[k]}>
              {t.replace(/ /g, ' ')}
            </T>
          );
          x += [...t].length * 10.2;
          return el;
        })}
        {st.line.some(([, k]) => k === 'bad') && <T x={200} y={84} size={12} anchor="middle" weight={700} fill={tok('danger')}>captured: this y now means the parameter</T>}
      </Svg>
    </StepFrame>
  );
}
