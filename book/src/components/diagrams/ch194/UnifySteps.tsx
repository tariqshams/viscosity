// unify(fn('a, ['a]) -> 'b, fn(number, 'c) -> 'c) one call at a time,
// with the substitution growing on the right.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type S = { left: string; right: string; rule: string; subst: string[]; fresh?: number; note: string };
const STATES: S[] = [
  { left: "fn('a, ['a]) -> 'b", right: "fn(number, 'c) -> 'c", rule: 'two function types', subst: [], note: 'Neither side is a variable, and both are function types with two parameters, so the pair is split: unify parameter 1 with parameter 1, then parameter 2 with parameter 2, then the results. The substitution starts empty.' },
  { left: "'a", right: 'number', rule: 'variable meets a type', subst: ["'a ↦ number"], fresh: 0, note: "Parameter 1: 'a is a variable with no binding yet, so bind it: 'a ↦ number. From now on, every 'a means number." },
  { left: "['a]", right: "'c", rule: 'type meets a variable', subst: ["'a ↦ number", "'c ↦ ['a]"], fresh: 1, note: "Parameter 2: the left side is a list, the right side the unbound variable 'c, so bind 'c ↦ ['a]. (Since 'a ↦ number, 'c really means [number]; applying the substitution will show that.)" },
  { left: "'b", right: "'c  =  ['a]", rule: 'look through the binding', subst: ["'a ↦ number", "'c ↦ ['a]", "'b ↦ ['a]"], fresh: 2, note: "The results: first look through any binding. 'b is unbound; 'c is bound, to ['a]. So this is 'b against ['a], and 'b is bound to ['a]. This is why each step must see the bindings made before it." },
  { left: "fn(number, [number]) -> [number]", right: "fn(number, [number]) -> [number]", rule: 'apply the substitution', subst: ["'a ↦ number", "'c ↦ ['a]", "'b ↦ ['a]"], note: 'Done. Applying the substitution to both original types (following every chain to the end) gives the same type twice. That is what it means for the substitution to unify them.' },
];

export default function UnifySteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Unifying two function types" steps={s} note={st.note}>
      <Svg w={400} h={200} title={`Unifying ${st.left} with ${st.right}: ${st.rule}. Substitution so far: ${st.subst.join(', ') || 'empty'}.`}>
        <T x={8} y={14} size={11} fill={tok('muted')}>now unifying</T>
        <Box x={8} y={24} w={384} h={30} stroke={tok('brand')} fill={tok('brand', 0.08)}>
          <T x={200} y={39} size={13} mono anchor="middle">{st.left}</T>
        </Box>
        <T x={200} y={66} size={11} anchor="middle" fill={tok('muted')}>with</T>
        <Box x={8} y={78} w={384} h={30} stroke={tok('accent')} fill={tok('accent', 0.08)}>
          <T x={200} y={93} size={13} mono anchor="middle">{st.right}</T>
        </Box>
        <T x={8} y={126} size={12} weight={700} fill={tok('ink')}>{st.rule}</T>
        <T x={8} y={150} size={11} fill={tok('muted')}>substitution</T>
        {st.subst.length === 0 && <T x={8} y={172} size={13} mono fill={tok('muted')}>(empty)</T>}
        {st.subst.map((b, i) => (
          <T key={b} x={8 + i * 128} y={172} size={13} mono weight={i === st.fresh ? 700 : 400} fill={i === st.fresh ? tok('safe') : tok('ink')}>{b}</T>
        ))}
      </Svg>
    </StepFrame>
  );
}
