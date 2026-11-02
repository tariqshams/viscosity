import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// A bound is checked twice: once against the body (may it use >?) and once
// at every call (does this T keep the promise?). Each call fills in T.

const CODE = `fn top<T: PartialOrd>(xs: &[T])
    -> Option<&T> { /* uses > */ }

top(&[3, 9, 4]);
top(&["b", "a"]);
top(&[P { x: 1.0 }]);`;

type S = { line: number; t?: string; ok?: boolean; body?: boolean; note: string };

const STATES: S[] = [
  { line: 0, body: true, note: 'First the body is checked, once, against the bound alone. It compares with >, and T: PartialOrd promises that any T can be compared, so the body is accepted without knowing what T will be.' },
  { line: 3, t: 'i32', ok: true, note: 'A call fills in T from the arguments: a slice of i32, so T = i32. Does i32 implement PartialOrd? Yes, so the call is accepted, and it returns Some(&9).' },
  { line: 4, t: '&str', ok: true, note: 'T = &str. String slices implement PartialOrd too (they compare like words in a dictionary), so this returns Some(&"b").' },
  { line: 5, t: 'P', ok: false, note: 'T = P, a struct with no PartialOrd impl. The promise cannot be kept, so the call is rejected: E0277, can’t compare `P` with `P`. The help suggests #[derive(PartialOrd)].' },
];

export default function BoundSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Checking a bound: the body, then every call" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={100} title="The type filled in for T at the current call, and whether it implements PartialOrd">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>T IS</T>
        <Box x={8} y={26} w={110} h={40} r={4} fill={st.t ? tok('accent', 0.15) : 'transparent'} stroke={st.t ? tok('accent') : tok('line')} dash={!st.t}>
          <T x={63} y={46} size={14} mono weight={700} anchor="middle">{st.t ?? (st.body ? 'any T' : '')}</T>
        </Box>
        <T x={140} y={14} size={11} weight={700} fill={tok('muted')}>T: PartialOrd ?</T>
        <Box x={140} y={26} w={250} h={40} r={4}
          fill={st.ok === undefined ? tok('brand', 0.08) : tok(st.ok ? 'safe' : 'danger', 0.14)}
          stroke={st.ok === undefined ? tok('brand') : tok(st.ok ? 'safe' : 'danger')}>
          <T x={265} y={46} size={12} anchor="middle" weight={700}
            fill={st.ok === undefined ? tok('brand') : tok(st.ok ? 'safe' : 'danger')}>
            {st.ok === undefined ? 'assumed: the body may use >' : st.ok ? `✓ ${st.t} implements it` : '✗ E0277: not implemented'}
          </T>
        </Box>
        <T x={8} y={88} size={11} fill={tok('muted')}>{st.body ? 'checking the body' : `checking a call: top::<${st.t}>`}</T>
      </Svg>
    </StepFrame>
  );
}
