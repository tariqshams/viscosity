// Chapter 106: how `return` leaves a Drip call in the companion's
// tree-walker. execute returns a completion code; a `return` parks its value
// in the interpreter and hands RETURN back up, and every method on the way
// passes it on until callFunction, at the edge of the call, takes the value.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `fn fib(n) {
  if n < 2 {
    return n;
  }
  return fib(n - 1) + fib(n - 2);
}
print fib(3);`;

/** The interpreter methods running inside one Drip call, outermost first. */
const DEEP = ['call', 'block', 'if', 'block', 'return'];
const SHALLOW = ['call', 'block', 'return'];

/** One Drip call. `at` is the method now holding the RETURN code. */
type Row = { n: number; status: string; chain?: string[]; at?: number };
type S = { line: number; rows: Row[]; host?: number; parked?: string; out?: string; note: string };

const w3 = (s: string): Row => ({ n: 3, status: s });
const w2 = (s: string): Row => ({ n: 2, status: s });

const STATES: S[] = [
  { line: 6, rows: [], host: 4, note: 'The top level evaluates the call fib(3). Four interpreter methods are already running on the host stack: interpret, execute (for the print), evaluate (for the call) and call.' },
  { line: 1, rows: [{ n: 3, status: 'is 3 < 2? no', chain: ['call', 'block', 'if'] }], host: 7, note: 'callFunction makes fib(3)’s environment and runs its body with executeBlock, which runs the if. Each of these is a TypeScript method call, stacked on the host stack.' },
  { line: 4, rows: [w3('waiting: ? + fib(1)'), { n: 2, status: 'is 2 < 2? no', chain: ['call', 'block', 'if'] }], host: 13, note: 'fib(3) reaches its last line and starts on fib(n - 1) + fib(n - 2). While it waits for the left side, fib(2) runs on top of it.' },
  { line: 2, rows: [w3('waiting: ? + fib(1)'), w2('waiting: ? + fib(0)'), { n: 1, status: 'is 1 < 2? yes', chain: DEEP }], host: 22, note: 'fib(2) calls fib(1). This time the condition is true, so the if runs its block, and the block runs return n. Three Drip calls, 22 interpreter methods deep.' },
  { line: 2, rows: [w3('waiting: ? + fib(1)'), w2('waiting: ? + fib(0)'), { n: 1, status: 'gives back RETURN', chain: DEEP, at: 4 }], parked: '1', note: 'execute(return) evaluates n, parks the 1 in the interpreter’s returnValue field, and returns the code RETURN instead of NORMAL. Nothing is thrown.' },
  { line: 2, rows: [w3('waiting: ? + fib(1)'), w2('waiting: ? + fib(0)'), { n: 1, status: 'block passes it on', chain: DEEP, at: 3 }], parked: '1', note: 'The block’s executeBlock sees a code that is not NORMAL, so it stops running statements and returns the same code. Its finally switches the environment back on the way out.' },
  { line: 1, rows: [w3('waiting: ? + fib(1)'), w2('waiting: ? + fib(0)'), { n: 1, status: 'if passes it on', chain: DEEP, at: 2 }], parked: '1', note: 'The if returns whatever its block returned: RETURN again. The body’s executeBlock does the same, one level further up.' },
  { line: 0, rows: [w3('waiting: ? + fib(1)'), w2('waiting: ? + fib(0)'), { n: 1, status: 'takes the 1', chain: DEEP, at: 0 }], parked: '1', note: 'callFunction, at the edge of the call, sees RETURN, takes the parked 1, clears the field, and returns 1 as an ordinary TypeScript value. The code stops travelling here.' },
  { line: 4, rows: [w3('waiting: ? + fib(1)'), w2('left is 1: now fib(0)'), { n: 0, status: 'returns 0', chain: DEEP, at: 0 }], note: 'The 1 lands in fib(2)’s addition. Then fib(0) is called and hands back 0 in exactly the same way.' },
  { line: 4, rows: [w3('waiting: ? + fib(1)'), { n: 2, status: '1 + 0: returns 1', chain: SHALLOW, at: 0 }], note: 'fib(2) adds 1 + 0, and its last-line return parks 1 and gives RETURN to its own callFunction. fib(3) only ever sees the value 1.' },
  { line: 4, rows: [w3('left is 1: now fib(1)'), { n: 1, status: 'returns 1', chain: DEEP, at: 0 }], note: 'Back in fib(3), the left side is 1. The right side, fib(1), is one more short call that returns 1.' },
  { line: 4, rows: [{ n: 3, status: '1 + 1: returns 2', chain: SHALLOW, at: 0 }], note: 'fib(3) adds 1 + 1, parks 2, and its callFunction turns the RETURN code back into the value 2.' },
  { line: 6, rows: [], host: 4, out: '2', note: 'The call expression at the top level gets 2, and print shows it. Every method the calls stacked up has returned.' },
];

const H = 44;
const CHIP = 62;

export default function ReturnSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const base = 222;
  return (
    <StepFrame title="return as a completion code, in fib(3)" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={262} title="Drip calls stacked newest on top. The newest shows the interpreter methods running inside it: call is callFunction, block is executeBlock, if and return are execute. The RETURN code travels from return back up to call.">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>DRIP CALLS (newest on top)</T>
        <Box x={8} y={base - 30} w={384} h={26} stroke={tok('ink', 0.4)}>
          <T x={18} y={base - 17} size={11.5} mono fill={tok('muted')}>top level: interpret · execute · evaluate · call</T>
        </Box>
        {st.rows.map((r, k) => {
          const y = base - 34 - (k + 1) * (H + 4);
          const top = k === st.rows.length - 1;
          return (
            <Box key={k} x={8} y={y} w={384} h={H} fill={top ? tok('brand', 0.1) : tok('panel')} stroke={top ? tok('brand') : tok('ink', 0.4)}>
              <T x={18} y={y + 12} size={12.5} mono weight={700}>fib n = {r.n}</T>
              <T x={384} y={y + 12} size={11.5} mono anchor="end" fill={r.at !== undefined ? tok('danger') : tok('muted')}>{r.status}</T>
              {r.chain?.map((c, j) => {
                const x = 16 + j * (CHIP + 6);
                const here = r.at === j;
                const done = r.at !== undefined && j > r.at;
                return (
                  <g key={j} opacity={done ? 0.35 : 1}>
                    <rect x={x} y={y + 22} width={CHIP} height={18} rx={3} fill={here ? tok('danger', 0.18) : 'transparent'} stroke={here ? tok('danger') : tok('ink', 0.3)} strokeDasharray={done ? '3 3' : undefined} />
                    <T x={x + CHIP / 2} y={y + 31.5} size={11} mono anchor="middle">{here ? 'RETURN' : c}</T>
                  </g>
                );
              })}
              {!r.chain && <T x={18} y={y + 31} size={11} fill={tok('muted')}>6 interpreter methods, paused mid-addition</T>}
            </Box>
          );
        })}
        <T x={8} y={234} size={12} fill={tok('muted')}>
          {st.host !== undefined ? `interpreter methods on the host stack: ${st.host}` : ''}
          {st.out ? `   prints ${st.out}` : ''}
        </T>
        <T x={8} y={252} size={12} mono fill={st.parked ? tok('danger') : tok('muted')}>{`returnValue: ${st.parked ?? 'none'}`}</T>
      </Svg>
    </StepFrame>
  );
}
