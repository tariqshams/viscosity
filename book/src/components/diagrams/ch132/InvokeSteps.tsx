// Chapter 132: a method call with OP_INVOKE leaves the receiver where it
// already is, in the slot that becomes the method's slot 0 (`this`), and
// allocates nothing. Reading the method first (OP_GET_PROPERTY) allocates a
// bound method, which OP_CALL then unpacks. Follows invoke, invokeFromClass,
// bindMethod and callValue in companion/ts/src/vm/vm.ts.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `class Acc {
  init() { this.n = 0; }
  add(k) { this.n = this.n + k; }
}
let c = Acc();
c.add(2);
let f = c.add;
f(3);`;

type S = {
  line: number;
  op: string;
  stack: string[];
  /** first slot of the new frame, if one was just pushed */
  base?: number;
  allocs: string[];
  hot?: number;
  note: string;
};

const STATES: S[] = [
  { line: 5, op: 'GET_GLOBAL c', stack: ['<script>', 'c'], allocs: [], hot: 1, note: 'c.add(2) compiles to three instructions. First the receiver: GET_GLOBAL pushes the instance c.' },
  { line: 5, op: 'CONSTANT 2', stack: ['<script>', 'c', '2'], allocs: [], hot: 2, note: 'Then the argument. The receiver sits just below its arguments, exactly where a callee would sit for a plain call.' },
  { line: 5, op: 'INVOKE add (1 arg)', stack: ['<script>', 'c', '2'], base: 1, allocs: [], note: 'INVOKE looks at peek(1), the receiver. It has no field named add, so the VM finds add in c’s class and calls it directly. The new frame starts at c’s slot, so slot 0 is this. Nothing was allocated.' },
  { line: 6, op: 'GET_PROPERTY add', stack: ['<script>', '<bound add>'], allocs: ['bound method {receiver: c, add}'], hot: 1, note: 'Back in the script. let f = c.add reads the method as a value, with no call. That needs an object to carry both c and add: bindMethod allocates a bound method and replaces c with it.' },
  { line: 7, op: 'CALL 1', stack: ['<script>', '<bound add>', '3'], allocs: ['bound method {receiver: c, add}'], hot: 1, note: 'f(3): the bound method is the callee, below its argument.' },
  { line: 7, op: 'CALL 1 (bound)', stack: ['<script>', 'c', '3'], base: 1, allocs: ['bound method {receiver: c, add}'], hot: 1, note: 'callValue sees a bound method, writes its receiver over the callee slot, and calls add. Same frame as INVOKE built, but it cost an allocation. INVOKE skips that step for the common case.' },
];

export default function InvokeSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const CW = 92;
  const X0 = 8;
  return (
    <StepFrame title="A method call, with and without a bound method" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={176} title="The value stack as a row of slots, the new frame under it, and a list of heap allocations">
        <T x={X0} y={14} size={11} weight={700} fill={tok('muted')}>VALUE STACK</T>
        <T x={392} y={14} size={12} mono anchor="end" fill={tok('brand')}>{st.op}</T>
        {[0, 1, 2, 3].map((i) => {
          const v = st.stack[i];
          const live = v !== undefined;
          return (
            <g key={i}>
              <Box x={X0 + i * (CW + 4)} y={26} w={CW} h={32} r={3}
                fill={i === st.hot ? tok('brand', 0.14) : live ? tok('panel') : tok('line', 0.15)}
                stroke={i === st.hot ? tok('brand') : tok('line')} dash={!live}>
                <T x={X0 + i * (CW + 4) + CW / 2} y={42} size={12} mono anchor="middle" opacity={live ? 1 : 0.5}>{live ? v : ''}</T>
              </Box>
              <T x={X0 + i * (CW + 4) + CW / 2} y={68} size={10} mono anchor="middle" fill={tok('muted')}>{i}</T>
            </g>
          );
        })}
        {st.base !== undefined && (
          <>
            <rect x={X0 + st.base * (CW + 4)} y={78} width={(st.stack.length - st.base) * (CW + 4) - 4} height={22} rx={4} fill={tok('accent', 0.14)} stroke={tok('accent')} strokeWidth={1.5} />
            <T x={X0 + st.base * (CW + 4) + 8} y={89} size={11} fill={tok('accent')} weight={700}>frame of add: slot 0 = this, slot 1 = k</T>
          </>
        )}
        <T x={X0} y={122} size={11} weight={700} fill={tok('muted')}>HEAP ALLOCATIONS FOR THESE CALLS</T>
        {st.allocs.length === 0
          ? <T x={X0} y={144} size={12} mono fill={tok('safe')}>none</T>
          : st.allocs.map((a, k) => <T key={a} x={X0} y={144 + k * 18} size={12} mono fill={tok('warn')}>+ {a}</T>)}
      </Svg>
    </StepFrame>
  );
}
