// The JIT's code for one Drip statement, s += i * i, running on
// WebAssembly's operand stack. Locals: n = 0, s = 1, i = 2. Opcodes from
// the WebAssembly core spec (0x20 local.get, 0x21 local.set, 0xa2 f64.mul,
// 0xa0 f64.add); the bytes are exactly what the chapter's compile() emits
// for this statement (checked in Node 22).
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `20 01   local.get 1   ;; s
20 02   local.get 2   ;; i
20 02   local.get 2   ;; i
a2      f64.mul
a0      f64.add
21 01   local.set 1   ;; s =`;

type S = { line: number | null; stack: string[]; s: string; note: string };

const STATES: S[] = [
  { line: null, stack: [], s: '5', note: 'The tree for s += i * i is set s to (s + (i * i)). The compiler walks it children first, so the code reads like the expression written backwards: operands, then the operator. Here s is 5 and i is 3, a trip in the middle of sumsq(4).' },
  { line: 0, stack: ['5'], s: '5', note: 'The left operand of + is the variable s, which lives in local 1 (n is local 0, the parameter). local.get 1 pushes its value.' },
  { line: 1, stack: ['5', '3'], s: '5', note: 'The right operand of + is i * i, a tree of its own, so the compiler first emits code for its left operand: local.get 2 pushes i.' },
  { line: 2, stack: ['5', '3', '3'], s: '5', note: 'Then its right operand, i again.' },
  { line: 3, stack: ['5', '9'], s: '5', note: 'Both operands of * are on the stack, so now the operator: f64.mul pops two values and pushes their product, 9.' },
  { line: 4, stack: ['14'], s: '5', note: 'The same for +: f64.add pops 9 and 5 and pushes 14. Every value is a 64-bit float, the same kind of number Drip uses, so the arithmetic matches the interpreter exactly.' },
  { line: 5, stack: [], s: '14', note: 'Finally the assignment: local.set 1 pops the result into s. The stack is empty again, as it must be after a statement. Ten bytes for the whole statement, which the engine then compiles to machine code.' },
];

export default function StackSteps() {
  const st = useSteps(STATES);
  const s = st.state;
  return (
    <StepFrame title="s += i * i on the operand stack" steps={st} note={s.note}>
      <CodeTrace code={CODE} line={s.line} />
      <Svg w={400} h={150} title="WebAssembly's operand stack and the locals n, s and i while the statement runs">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>OPERAND STACK (top on the right)</T>
        {s.stack.length === 0 && <T x={8} y={40} size={12} fill={tok('muted')}>empty</T>}
        {s.stack.map((v, k) => (
          <Box key={k} x={8 + k * 60} y={24} w={52} h={30} fill={k === s.stack.length - 1 ? tok('brand', 0.18) : tok('paper')} stroke={k === s.stack.length - 1 ? tok('brand') : tok('line')}>
            <T x={34 + k * 60} y={39} size={14} mono anchor="middle">{v}</T>
          </Box>
        ))}
        <T x={8} y={80} size={11} weight={700} fill={tok('muted')}>LOCALS</T>
        {[['0: n', '4'], ['1: s', s.s], ['2: i', '3']].map(([n, v], k) => (
          <g key={n}>
            <T x={8 + k * 100} y={98} size={12} mono fill={tok('muted')}>{n}</T>
            <Box x={8 + k * 100} y={108} w={84} h={30} fill={k === 1 && s.line === 5 ? tok('safe', 0.25) : tok('paper')} stroke={tok('line')}>
              <T x={50 + k * 100} y={123} size={14} mono anchor="middle">{v}</T>
            </Box>
          </g>
        ))}
      </Svg>
    </StepFrame>
  );
}
