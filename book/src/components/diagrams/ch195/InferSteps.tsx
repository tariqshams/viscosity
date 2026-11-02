// Inferring fn (f, x) { return f(f(x)); }: fresh variables for the
// parameters, one unification per call, then the substitution applied.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';

const CODE = `fn (f, x) {
  return f(f(x));
}`;
type S = { line: number; gamma: string; eq: string; subst: string[]; hi: number[]; type: string; note: string };
const STATES: S[] = [
  { line: 0, gamma: "f : 'a,  x : 'b", eq: '(none yet)', subst: [], hi: [], type: "fn('a, 'b) -> ?", note: "Step 1: each parameter gets a fresh type variable, f : 'a and x : 'b, and both go into Γ. We know nothing else yet." },
  { line: 1, gamma: "f : 'a,  x : 'b", eq: "'a = fn('b) -> 'c", subst: ["'a ↦ fn('b) -> 'c"], hi: [0], type: "f(x) : 'c", note: "The inner call f(x) first. Its result gets a fresh variable 'c, and the callee's type 'a must be a function from x's type to 'c: unify 'a with fn('b) -> 'c, which binds 'a." },
  { line: 1, gamma: "f : 'a,  x : 'b", eq: "fn('b) -> 'c = fn('c) -> 'd", subst: ["'a ↦ fn('b) -> 'c", "'b ↦ 'c", "'c ↦ 'd"], hi: [1, 2], type: "f(f(x)) : 'd", note: "The outer call: its argument f(x) has type 'c, and its result gets a fresh 'd. f's type, looked through its binding, is fn('b) -> 'c; unifying it with fn('c) -> 'd binds 'b ↦ 'c, then 'c ↦ 'd." },
  { line: 1, gamma: "f : 'a,  x : 'b", eq: '(done)', subst: ["'a ↦ fn('b) -> 'c", "'b ↦ 'c", "'c ↦ 'd"], hi: [], type: "fn(fn('d) -> 'd, 'd) -> 'd", note: "Step 3: apply the substitution to fn('a, 'b) -> 'd. 'a becomes fn('b) -> 'c, and following the chains 'b and 'c both become 'd. Renamed for printing, that is fn(fn('a) -> 'a, 'a) -> 'a." },
];

export default function InferSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Inferring the type of f(f(x))" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={166} title={`Γ: ${st.gamma}. Equation: ${st.eq}. Substitution: ${st.subst.join(', ') || 'empty'}. Type so far: ${st.type}.`}>
        <T x={8} y={16} size={11} fill={tok('muted')}>Γ</T>
        <T x={90} y={16} size={13} mono>{st.gamma}</T>
        <T x={8} y={42} size={11} fill={tok('muted')}>unify</T>
        <T x={90} y={42} size={13} mono fill={tok('brand')}>{st.eq}</T>
        <T x={8} y={68} size={11} fill={tok('muted')}>substitution</T>
        {st.subst.length === 0 && <T x={90} y={68} size={13} mono fill={tok('muted')}>(empty)</T>}
        {st.subst.map((b, i) => (
          <T key={b} x={90} y={68 + i * 20} size={13} mono weight={st.hi.includes(i) ? 700 : 400} fill={st.hi.includes(i) ? tok('safe') : tok('ink')}>{b}</T>
        ))}
        <T x={8} y={150} size={11} fill={tok('muted')}>type</T>
        <T x={90} y={150} size={13} mono weight={700} fill={tok('accent')}>{st.type}</T>
      </Svg>
    </StepFrame>
  );
}
