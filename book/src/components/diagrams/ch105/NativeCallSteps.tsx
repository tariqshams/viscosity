// Chapter 104 (second half): a call to a native function. The natives are
// globals defined before the program starts; calling one checks the arity,
// then runs TypeScript code. No Drip environment is made for the call.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `let xs = [1, 2];
push(xs, 3);
print len(xs);`;

type S = {
  line: number | null;
  xs: number[] | null;
  checks: string[];
  ts?: string;
  hot?: 'push' | 'len';
  out?: string;
  note: string;
};

const STATES: S[] = [
  { line: null, xs: null, checks: [], note: 'Before the first line runs, the interpreter has already defined five globals: clock, len, push, pop and str. Each holds a NativeFunction: a name, an arity and a piece of TypeScript.' },
  { line: 0, xs: [1, 2], checks: [], note: 'let xs = [1, 2] is ordinary Drip: a global holding a list.' },
  { line: 1, xs: [1, 2], checks: ['callee: native fn push'], hot: 'push', note: 'push(xs, 3) is a call like any other. The callee push is looked up in the globals, and it holds a native function.' },
  { line: 1, xs: [1, 2], checks: ['callee: native fn push', 'args: [the list, 3]'], hot: 'push', note: 'The arguments are evaluated left to right: the list that xs holds, then 3.' },
  { line: 1, xs: [1, 2], checks: ['callee: native fn push', 'args: [the list, 3]', 'a NativeFunction? yes', 'arity 2, got 2: ok'], hot: 'push', note: 'The same arity check as for a Drip function. push takes 2, and it got 2.' },
  { line: 1, xs: [1, 2, 3], checks: [], hot: 'push', ts: 'xs.items.push(v);', note: 'Now TypeScript runs: it appends 3 to the list’s items and returns null, which is Drip’s none. No environment was made, and no Drip statement ran.' },
  { line: 2, xs: [1, 2, 3], checks: ['callee: native fn len', 'args: [the list]', 'arity 1, got 1: ok'], hot: 'len', note: 'len(xs) goes through the same steps: look up len, evaluate the argument, check the arity.' },
  { line: 2, xs: [1, 2, 3], checks: [], hot: 'len', ts: 'return x.items.length;', out: '3', note: 'The TypeScript for len returns the length of the list, 3, which becomes the value of the call; print shows it.' },
];

const NATIVES = ['clock', 'len', 'push', 'pop', 'str'];

export default function NativeCallSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Calling a native function" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={210} title="The globals, holding five native functions and the list xs; the checks the call makes; and the TypeScript code that runs">
        <Box x={6} y={8} w={170} h={150} stroke={tok('ink', 0.4)}>
          <T x={16} y={22} size={11} weight={700} fill={tok('muted')}>globals</T>
          {NATIVES.map((n, j) => (
            <T key={n} x={16} y={42 + j * 18} size={12} mono weight={st.hot === n ? 700 : 400} fill={st.hot === n ? tok('brand') : undefined}>{`${n} = native fn`}</T>
          ))}
          {st.xs && <T x={16} y={140} size={12} mono>{`xs = [${st.xs.join(', ')}]`}</T>}
        </Box>
        {st.checks.length > 0 && (
          <Box x={190} y={8} w={204} h={88} fill="transparent" stroke={tok('line')}>
            {st.checks.map((c, j) => (
              <T key={c} x={200} y={24 + j * 19} size={11.5} mono>{c}</T>
            ))}
          </Box>
        )}
        {st.ts && (
          <>
            <Arrow x1={150} y1={st.hot === 'push' ? 78 : 60} x2={188} y2={130} color={tok('brand')} />
            <Box x={190} y={108} w={204} h={50} fill={tok('brand', 0.08)} stroke={tok('brand')}>
              <T x={200} y={122} size={11} weight={700} fill={tok('brand')}>TypeScript runs</T>
              <T x={200} y={142} size={11} mono>{st.ts}</T>
            </Box>
          </>
        )}
        <T x={6} y={190} size={12.5} mono fill={tok('muted')}>output: <tspan fill={tok('ink')} fontWeight={700}>{st.out ?? ''}</tspan></T>
      </Svg>
    </StepFrame>
  );
}
