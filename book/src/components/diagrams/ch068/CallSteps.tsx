import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `let k = 10;
fn add(a, b) {
  let s = a + b;
  print s + k;
}
add(1, 2);
add(3, 4);`;

type CallEnv = { label: string; vars: string[]; gone?: boolean };
type S = {
  line: number;
  fn: boolean; // the function value exists
  env?: CallEnv; // the environment made for the current call
  checks: string[]; // what the call expression has worked out so far
  look?: 'local' | 'parent';
  out: string[];
  note: string;
};

const STATES: S[] = [
  { line: 0, fn: false, checks: [], out: [], note: 'let k defines k in the globals, as before.' },
  { line: 1, fn: true, checks: [], out: [], note: 'Executing fn add(...) does not run the body. It makes a function VALUE holding the parameter names and the body, plus a link to the environment it was declared in, and defines add to point at it.' },
  { line: 5, fn: true, checks: ['callee: fn add'], out: [], note: 'add(1, 2) is a call expression. First, evaluate the callee: add is an ordinary variable lookup, and it gives the function value.' },
  { line: 5, fn: true, checks: ['callee: fn add', 'args: [1, 2]'], out: [], note: 'Next, evaluate the arguments, left to right, into a list of runtime values.' },
  { line: 5, fn: true, checks: ['callee: fn add', 'args: [1, 2]', 'a DripFunction? yes', 'arity 2, got 2: ok'], out: [], note: 'Two checks before the body runs: is the callee a Drip function (rather than a native, a class or a number), and does the argument count match its arity? Both pass.' },
  { line: 1, fn: true, env: { label: 'call env (1st call)', vars: ['a = 1', 'b = 2'] }, checks: ['callee: fn add', 'args: [1, 2]', 'a DripFunction? yes', 'arity 2, got 2: ok'], out: [], note: 'callFunction makes a fresh environment whose parent is the function’s stored environment (here, the globals), and defines each parameter in it with its argument.' },
  { line: 2, fn: true, env: { label: 'call env (1st call)', vars: ['a = 1', 'b = 2', 's = 3'] }, checks: [], out: [], note: 'The body’s statements run with that environment as the current one. let s defines s there: a local variable of this call.' },
  { line: 3, fn: true, env: { label: 'call env (1st call)', vars: ['a = 1', 'b = 2', 's = 3'] }, checks: [], look: 'parent', out: ['13'], note: 's is found in the call environment. k is not, so the lookup follows the parent arrow to the globals. 3 + 10 prints 13.' },
  { line: 5, fn: true, env: { label: 'call env (1st call)', vars: ['a = 1', 'b = 2', 's = 3'], gone: true }, checks: [], out: ['13'], note: 'The body ends. The interpreter switches back to the caller’s environment, and the call’s value is none. Nothing points at the call environment now.' },
  { line: 6, fn: true, env: { label: 'call env (2nd call)', vars: ['a = 3', 'b = 4'] }, checks: ['callee: fn add', 'args: [3, 4]', 'a DripFunction? yes', 'arity 2, got 2: ok'], out: ['13'], note: 'The second call does it all again, with a BRAND NEW environment. Nothing from the first call is left over: no s yet.' },
  { line: 3, fn: true, env: { label: 'call env (2nd call)', vars: ['a = 3', 'b = 4', 's = 7'] }, checks: [], look: 'parent', out: ['13', '17'], note: 's is 7 this time, k is still found in the globals, and it prints 17.' },
];

export default function CallSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const e = st.env;
  return (
    <StepFrame title="What add(1, 2) does" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={224} title="The globals, the function value, the environment made for a call, and the checks a call expression makes">
        <Box x={8} y={20} w={180} h={64} stroke={st.look === 'parent' ? tok('warn') : tok('ink', 0.4)}>
          <T x={18} y={33} size={11} weight={700} fill={tok('muted')}>globals</T>
          <T x={18} y={53} size={12.5} mono weight={st.look === 'parent' ? 700 : 400} fill={st.look === 'parent' ? tok('safe') : undefined}>k = 10</T>
          {st.fn && <T x={18} y={72} size={12.5} mono>add = fn add</T>}
        </Box>
        {st.fn && (
          <>
            <Arrow x1={150} y1={72} x2={212} y2={60} color={tok('brand')} />
            <Box x={214} y={20} w={178} h={64} fill={tok('brand', 0.08)} stroke={tok('brand')}>
              <T x={224} y={33} size={11} weight={700} fill={tok('brand')}>function value</T>
              <T x={224} y={53} size={12} mono>params: a, b</T>
              <T x={224} y={72} size={12} mono>closure: globals</T>
            </Box>
          </>
        )}
        {e && (
          <g opacity={e.gone ? 0.4 : 1}>
            <Arrow x1={40} y1={112} x2={40} y2={86} color={st.look === 'parent' ? tok('warn') : tok('ink', 0.5)} />
            <Box x={8} y={112} w={180} h={84} dash={e.gone} fill={e.gone ? tok('panel') : tok('accent', 0.1)} stroke={tok('accent')}>
              <T x={18} y={125} size={11} weight={700} fill={tok('accent')}>{e.label}{e.gone ? ' (done)' : ''}</T>
              {e.vars.map((v, j) => (
                <T key={v} x={18} y={146 + j * 18} size={12.5} mono>{v}</T>
              ))}
            </Box>
            <T x={48} y={100} size={11} fill={tok('muted')}>parent</T>
          </g>
        )}
        {st.checks.length > 0 && (
          <Box x={214} y={112} w={178} h={84} fill="transparent" stroke={tok('line')}>
            {st.checks.map((c, j) => (
              <T key={c} x={224} y={126 + j * 18} size={12} mono>{c}</T>
            ))}
          </Box>
        )}
        <T x={8} y={214} size={12.5} mono fill={tok('muted')}>output: <tspan fill={tok('ink')} fontWeight={700}>{st.out.join('  ')}</tspan></T>
      </Svg>
    </StepFrame>
  );
}
