// Chapter 69 (second half): an environment lives as long as something
// refers to it. The makeCounter call's environment is referred to first by
// the running call, then only by the closure, and finally by nothing, at
// which point the host's garbage collector may reclaim it.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `fn makeCounter() {
  let n = 0;
  return fn () {
    n += 1;
    return n;
  };
}
let a = makeCounter();
print a();
a = none;`;

type S = {
  line: number;
  a: string;
  e?: string;
  running?: boolean;
  fnv?: boolean;
  call?: 'running' | 'done';
  dead?: boolean;
  refs: string[];
  note: string;
};

const STATES: S[] = [
  { line: 7, a: '(not yet)', e: 'n = 0', running: true, refs: ['the running call'], note: 'makeCounter() runs. callFunction makes its environment with new, so it is an object on the heap; the running call (a TypeScript variable in callFunction) refers to it.' },
  { line: 2, a: '(not yet)', e: 'n = 0', running: true, fnv: true, refs: ['the running call', 'the function’s closure'], note: 'The anonymous fn is evaluated: a new function value whose closure field refers to the same environment. Now two things refer to it.' },
  { line: 7, a: 'fn', e: 'n = 0', fnv: true, refs: ['the function’s closure'], note: 'makeCounter returns the function, and a holds it. The call is over: its TypeScript methods have returned and their variables are gone. Only the closure still refers to the environment, so it stays.' },
  { line: 3, a: 'fn', e: 'n = 1', fnv: true, call: 'running', refs: ['the function’s closure', 'a() call’s parent link'], note: 'a() makes a new environment for its own call, whose parent is the kept environment. n is found one step up and becomes 1.' },
  { line: 8, a: 'fn', e: 'n = 1', fnv: true, call: 'done', refs: ['the function’s closure'], note: 'a() returns 1, which is printed. Nothing refers to that call’s environment any more, so it can be reclaimed. The kept one is still referred to by the closure.' },
  { line: 9, a: 'none', e: 'n = 1', fnv: true, dead: true, refs: [], note: 'a = none drops the only reference to the function, and with it the only path to the environment. Neither can be reached, so the garbage collector is free to reclaim both.' },
];

export default function LifetimeSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const dim = st.dead ? 0.35 : 1;
  return (
    <StepFrame title="How long an environment lives" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={232} title="The global a, the function value, the makeCounter call's environment holding n, and the a() call's environment, with arrows for every reference. A list on the right says what refers to the kept environment.">
        <Box x={6} y={8} w={150} h={34} stroke={tok('ink', 0.4)}>
          <T x={16} y={25} size={12.5} mono>{`a = ${st.a}`}</T>
        </Box>
        {st.fnv && (
          <g opacity={dim}>
            <Box x={6} y={70} w={150} h={34} fill={tok('brand', 0.08)} stroke={tok('brand')} dash={st.dead}>
              <T x={16} y={87} size={12.5} mono>fn (closure ●)</T>
            </Box>
            {st.a === 'fn' && <Arrow x1={60} y1={42} x2={60} y2={68} color={tok('brand')} />}
            <Arrow x1={120} y1={104} x2={120} y2={130} color={tok('brand')} />
          </g>
        )}
        {st.e && (
          <g opacity={dim}>
            <Box x={6} y={132} w={150} h={40} fill={st.running ? tok('accent', 0.1) : tok('safe', 0.1)} stroke={st.running ? tok('accent') : tok('safe')} dash={st.dead}>
              <T x={16} y={145} size={11} weight={700} fill={st.running ? tok('accent') : tok('safe')}>makeCounter call env</T>
              <T x={16} y={162} size={12.5} mono>{st.e}</T>
            </Box>
          </g>
        )}
        {st.call && (
          <g opacity={st.call === 'done' ? 0.35 : 1}>
            <Box x={6} y={192} w={150} h={32} fill={tok('accent', 0.1)} stroke={tok('accent')} dash={st.call === 'done'}>
              <T x={16} y={208} size={11} weight={700} fill={tok('accent')}>{st.call === 'done' ? 'a() call env (done)' : 'a() call env'}</T>
            </Box>
            <Arrow x1={40} y1={192} x2={40} y2={174} />
          </g>
        )}
        <T x={180} y={20} size={11} weight={700} fill={tok('muted')}>WHAT REFERS TO THE n ENVIRONMENT</T>
        {st.refs.length === 0 ? (
          <T x={180} y={44} size={12.5} fill={tok('danger')}>nothing: it can be reclaimed</T>
        ) : (
          st.refs.map((r, j) => <T key={r} x={180} y={44 + j * 20} size={12.5}>{`• ${r}`}</T>)
        )}
      </Svg>
    </StepFrame>
  );
}
