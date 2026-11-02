import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 312: the lowered form of a?.b?.c run twice, once with a whole
// chain and once with b missing. Each ?. becomes one test of a temporary;
// a nullish value ends the whole chain with undefined.
const CODE = `// a?.b?.c, lowered:
(_t0 = a) == null ? undefined
  : (_t1 = _t0.b) == null ? undefined
  : _t1.c`;

type S = { a: string; line: number | null; t0?: string; t1?: string; out?: string; note: string };

const STATES: S[] = [
  { a: '{ b: { c: 1 } }', line: 1, t0: '{ b: … }', note: 'First run, a = { b: { c: 1 } }. The first ?. stores a in a temporary, _t0, so that a is worked out only once, and tests it: not null or undefined.' },
  { a: '{ b: { c: 1 } }', line: 2, t0: '{ b: … }', t1: '{ c: 1 }', note: 'The second ?. reads _t0.b into _t1 and tests that: an object, so we go on.' },
  { a: '{ b: { c: 1 } }', line: 3, t0: '{ b: … }', t1: '{ c: 1 }', out: '1', note: 'Only now is .c read, from _t1. The result is 1, exactly what a.b.c would give.' },
  { a: '{}', line: 1, t0: '{}', note: 'Second run, a = {}. _t0 holds the empty object, which is not nullish.' },
  { a: '{}', line: 2, t0: '{}', t1: 'undefined', out: 'undefined', note: '_t0.b is undefined, so the test is true and the whole expression is undefined. .c is never read, so there is no TypeError, which is the point of ?.' },
];

export default function ChainSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const cell = (x: number, label: string, v?: string) => (
    <Box x={x} y={26} w={124} h={44} dash={!v} fill={v ? tok('f2', 0.12) : 'transparent'} stroke={v ? tok('f2') : tok('line')}>
      <T x={x + 8} y={40} size={11} weight={700} fill={tok('muted')}>{label}</T>
      <T x={x + 8} y={58} size={12} mono>{v ?? ''}</T>
    </Box>
  );
  return (
    <StepFrame title="Running the lowered a?.b?.c" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={104} title="The input a, the temporaries _t0 and _t1, and the result">
        <T x={6} y={12} size={12} mono>{`a = ${st.a}`}</T>
        {cell(6, '_t0', st.t0)}
        {cell(138, '_t1', st.t1)}
        <Box x={270} y={26} w={124} h={44} dash={!st.out} fill={st.out ? tok('f3', 0.14) : 'transparent'} stroke={st.out ? tok('f3') : tok('line')}>
          <T x={278} y={40} size={11} weight={700} fill={tok('muted')}>RESULT</T>
          <T x={278} y={58} size={12} mono>{st.out ?? ''}</T>
        </Box>
        <T x={6} y={92} size={11} fill={tok('muted')}>x == null is true only for null and undefined</T>
      </Svg>
    </StepFrame>
  );
}
