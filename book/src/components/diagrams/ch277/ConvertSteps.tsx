import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 277: running adder(1)(2) after closure conversion. The frame
// of adder disappears; the environment record it built survives on the
// heap, because the closure pair points at it.
const CODE = `function addCode(env, x) {
  return x + env.n;
}
function adder(n) {
  const env = { n };
  return { code: addCode, env };
}
const add1 = adder(1);
add1.code(add1.env, 2);`;

type S = { line: number; frame: null | 'adder' | 'add'; env: boolean; clo: boolean; add1: boolean; out?: string; note: string };

const STATES: S[] = [
  { line: 7, frame: null, env: false, clo: false, add1: false, note: 'After conversion there are two ordinary top-level functions. addCode has no free variables any more: n arrives inside its first parameter, env.' },
  { line: 3, frame: 'adder', env: false, clo: false, add1: false, note: 'Calling adder(1) pushes a frame on the stack holding its parameter n = 1.' },
  { line: 4, frame: 'adder', env: true, clo: false, add1: false, note: 'adder copies the variable the inner function needs into an environment record, { n: 1 }, allocated on the heap.' },
  { line: 5, frame: 'adder', env: true, clo: true, add1: false, note: 'The function value is a pair: a pointer to the code (addCode) and a pointer to the environment.' },
  { line: 7, frame: null, env: true, clo: true, add1: true, note: 'adder returns and its frame is gone, n with it. The record survives, because the pair that add1 holds still points at it.' },
  { line: 8, frame: 'add', env: true, clo: true, add1: true, note: 'Calling add1 means calling its code with its environment as the first argument: addCode(env, 2).' },
  { line: 1, frame: 'add', env: true, clo: true, add1: true, out: '3', note: 'addCode reads env.n, which is 1, and returns 2 + 1 = 3. No frame of adder was needed.' },
];

export default function ConvertSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A closure after conversion: code plus a record" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={150} title="The stack frame, the closure pair and the environment record on the heap">
        <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>STACK</T>
        <Box x={6} y={22} w={130} h={56} dash={!st.frame} fill={st.frame ? tok('brand', 0.08) : 'transparent'} stroke={st.frame ? tok('brand') : tok('line')}>
          <T x={16} y={40} size={12} mono weight={700}>{st.frame === 'adder' ? 'adder' : st.frame === 'add' ? 'addCode' : 'no call'}</T>
          <T x={16} y={62} size={12} mono>{st.frame === 'adder' ? 'n = 1' : st.frame === 'add' ? 'env, x = 2' : ''}</T>
        </Box>
        <T x={6} y={100} size={11} weight={700} fill={tok('muted')}>VARIABLE</T>
        <Box x={6} y={110} w={130} h={30} dash={!st.add1} fill="transparent">
          <T x={16} y={125} size={12} mono>{st.add1 ? 'add1 = ●' : 'add1'}</T>
        </Box>
        <T x={170} y={12} size={11} weight={700} fill={tok('muted')}>HEAP</T>
        <Box x={170} y={22} w={110} h={56} dash={!st.clo} fill={st.clo ? tok('panel') : 'transparent'}>
          <T x={180} y={40} size={12} mono>{st.clo ? 'code: addCode' : ''}</T>
          <T x={180} y={62} size={12} mono>{st.clo ? 'env: ●' : ''}</T>
        </Box>
        <Box x={300} y={22} w={94} h={56} dash={!st.env} fill={st.env ? tok('f1', 0.15) : 'transparent'} stroke={st.env ? tok('f1') : tok('line')}>
          <T x={347} y={50} size={13} mono anchor="middle">{st.env ? '{ n: 1 }' : ''}</T>
        </Box>
        {st.clo && st.env && <Arrow x1={250} y1={62} x2={300} y2={56} />}
        {st.add1 && <Arrow x1={96} y1={125} x2={190} y2={78} bend={0.3} />}
        {st.out && <T x={170} y={125} size={13} mono>returns {st.out}</T>}
      </Svg>
    </StepFrame>
  );
}
