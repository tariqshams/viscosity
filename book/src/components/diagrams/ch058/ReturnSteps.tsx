import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `fn fib(n) {
  if (n < 2) return n;
  return fib(n - 1) + fib(n - 2);
}
print fib(3);`;

/** The host (TypeScript) frames one Drip call puts on the stack. */
const CHIPS = ['call', 'body: catch', 'block: finally', 'statement'];
const CW = [44, 82, 100, 100];

/** One Drip call. `sig` is the host frame the ReturnSignal has reached. */
type Row = { n: number; status: string; stmt: string; sig?: 1 | 2 | 3; v?: number };
type S = { line: number; rows: Row[]; host?: number; out?: string; note: string };

const wait3 = (s: string): Row => ({ n: 3, status: s, stmt: 'return' });
const wait2 = (s: string): Row => ({ n: 2, status: s, stmt: 'return' });

const STATES: S[] = [
  { line: 4, rows: [], host: 3, note: 'The top level evaluates the call fib(3). Already three interpreter methods are running on the host stack: interpret, execute (the print) and evaluate (the call).' },
  { line: 1, rows: [{ n: 3, status: 'is 3 < 2? no', stmt: 'if' }], host: 7, note: 'Calling fib(3) adds four more host frames: DripFunction.call, executeFunctionBody (which has a catch), executeBlock (which has a finally), and execute for the current statement.' },
  { line: 2, rows: [wait3('waiting: ? + fib(1)'), { n: 2, status: 'is 2 < 2? no', stmt: 'if' }], host: 13, note: 'fib(3) reaches its last line and starts evaluating fib(2) + fib(1). While it waits for the left side, fib(2) runs on top of it.' },
  { line: 1, rows: [wait3('waiting: ? + fib(1)'), wait2('waiting: ? + fib(0)'), { n: 1, status: 'is 1 < 2? yes', stmt: 'return' }], host: 20, note: 'fib(2) does the same and calls fib(1). For fib(1) the condition is true, so execute runs return n. Three Drip calls, twenty interpreter frames.' },
  { line: 1, rows: [wait3('waiting: ? + fib(1)'), wait2('waiting: ? + fib(0)'), { n: 1, status: 'throws ReturnSignal(1)', stmt: 'return', sig: 3, v: 1 }], note: 'The return statement evaluates n, gets 1, and THROWS a ReturnSignal holding it. execute has no catch, so its frames are abandoned at once.' },
  { line: 1, rows: [wait3('waiting: ? + fib(1)'), wait2('waiting: ? + fib(0)'), { n: 1, status: 'finally restores env', stmt: 'return', sig: 2, v: 1 }], note: 'The signal passes executeBlock. Its finally runs on the way through and switches the current environment back to fib(2)’s.' },
  { line: 1, rows: [wait3('waiting: ? + fib(1)'), wait2('waiting: ? + fib(0)'), { n: 1, status: 'caught: value 1', stmt: 'return', sig: 1, v: 1 }], note: 'executeFunctionBody catches it, takes out the 1 and returns it normally. The unwinding stops here, at the edge of the call.' },
  { line: 2, rows: [wait3('waiting: ? + fib(1)'), wait2('left is 1: now fib(0)'), { n: 0, status: 'caught: value 0', stmt: 'return', sig: 1, v: 0 }], note: 'fib(1) is popped and 1 lands in fib(2)’s addition. Then fib(0) is called and returns 0 in exactly the same way.' },
  { line: 2, rows: [wait3('waiting: ? + fib(1)'), { n: 2, status: '1 + 0: caught 1', stmt: 'return', sig: 1, v: 1 }], note: 'fib(2) adds 1 + 0, and its own return throws ReturnSignal(1). Only fib(2)’s catch sees it; fib(3) never knows a throw happened.' },
  { line: 2, rows: [wait3('left is 1: now fib(1)'), { n: 1, status: 'caught: value 1', stmt: 'return', sig: 1, v: 1 }], note: 'Back in fib(3), the left side is 1. The right side, fib(1), is one more short call that returns 1.' },
  { line: 2, rows: [{ n: 3, status: '1 + 1: caught 2', stmt: 'return', sig: 1, v: 2 }], note: 'fib(3) adds 1 + 1 and returns 2 by throwing ReturnSignal(2), caught by its own executeFunctionBody.' },
  { line: 4, rows: [], host: 3, out: '2', note: 'The call expression in the top level gets 2, and print shows it. Every host frame the calls pushed has been popped.' },
];

const H = 44;

export default function ReturnSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const base = 222;
  return (
    <StepFrame title="return as a thrown signal, in fib(3)" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={244} title="Drip calls stacked newest on top. Each holds four host frames: call, executeFunctionBody, executeBlock and execute. A ReturnSignal travels down through them until it is caught.">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>DRIP CALLS AND THEIR HOST FRAMES (newest on top)</T>
        <Box x={8} y={base - 30} w={384} h={26} stroke={tok('ink', 0.4)}>
          <T x={18} y={base - 17} size={11.5} mono fill={tok('muted')}>top level: interpret · execute · evaluate</T>
        </Box>
        {st.rows.map((r, k) => {
          const y = base - 34 - (k + 1) * (H + 4);
          const top = k === st.rows.length - 1;
          let cx = 16;
          return (
            <Box key={k} x={8} y={y} w={384} h={H} fill={top ? tok('brand', 0.1) : tok('panel')} stroke={top ? tok('brand') : tok('ink', 0.4)}>
              <T x={18} y={y + 12} size={12.5} mono weight={700}>fib n = {r.n}</T>
              <T x={384} y={y + 12} size={11.5} mono anchor="end" fill={r.sig ? tok('danger') : tok('muted')}>{r.status}</T>
              {CHIPS.map((c, j) => {
                const x = cx;
                cx += CW[j] + 6;
                const here = r.sig === j;
                const passed = r.sig !== undefined && j > r.sig;
                const label = j === 3 ? `execute ${r.stmt}` : c;
                return (
                  <g key={c} opacity={passed ? 0.35 : 1}>
                    <rect x={x} y={y + 22} width={CW[j]} height={17} rx={3} fill={here ? tok('danger', 0.18) : 'transparent'} stroke={here ? tok('danger') : tok('ink', 0.3)} strokeDasharray={passed ? '3 3' : undefined} />
                    <T x={x + CW[j] / 2} y={y + 31} size={10} mono anchor="middle">{label}</T>
                  </g>
                );
              })}
            </Box>
          );
        })}
        <T x={8} y={236} size={12} fill={tok('muted')}>
          {st.host !== undefined ? `interpreter frames on the host stack: ${st.host}` : ''}
          {st.out ? `   prints ${st.out}` : ''}
        </T>
      </Svg>
    </StepFrame>
  );
}
