import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';
import { TAG_COLOUR } from './ValueBoxes';

// The real bytecode for `print -(1 + 2) == nil;` (from the companion
// disassembler), with the value stack drawn as tagged slots.
const CODE = `OP_CONSTANT  0 '1'
OP_CONSTANT  1 '2'
OP_ADD
OP_NEGATE
OP_NIL
OP_EQUAL
OP_PRINT`;

type V = { tag: 'nil' | 'bool' | 'num'; p: string };
type S = { line: number; stack: V[]; check?: string; out?: string; note: string };

const n = (p: string): V => ({ tag: 'num', p });

const STATES: S[] = [
  { line: 0, stack: [n('1')], note: 'OP_CONSTANT copies constant 0 onto the stack. The slot gets a tag, num, as well as the payload 1. From now on, anyone can ask this slot what it holds.' },
  { line: 1, stack: [n('1'), n('2')], note: 'A second number goes on top. Two slots, same size, both tagged num.' },
  { line: 2, stack: [n('3')], check: 'num? num? yes', note: 'OP_ADD must not add blindly. It reads both tags first. Both say num, so it adds the payloads and pushes 3, tagged num.' },
  { line: 3, stack: [n('-3')], check: 'num? yes', note: 'OP_NEGATE checks one tag. If it said anything but num, the VM would stop with “Operand must be a number.”' },
  { line: 4, stack: [n('-3'), { tag: 'nil', p: '' }], note: 'OP_NIL pushes nil. Its payload is empty: the tag alone says everything there is to know.' },
  { line: 5, stack: [{ tag: 'bool', p: 'false' }], check: 'num vs nil: differ', note: 'OP_EQUAL compares tags first. num and nil differ, so the answer is false without looking at any payload. Mixed types are never an error for ==, just unequal.' },
  { line: 6, stack: [], out: 'false', note: 'OP_PRINT pops the value and uses its tag to choose how to print it: a bool prints as true or false. In the companion VM these tags are JavaScript’s own types, read with typeof.' },
];

export default function StackTagSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Every slot knows its type" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={150} title="The value stack, bottom on the left, each slot drawn with its tag and payload">
        <T x={10} y={12} size={11} weight={700} fill={tok('muted')}>VALUE STACK (bottom → top)</T>
        {st.stack.map((v, k) => {
          const x = 10 + k * 128;
          const c = TAG_COLOUR[v.tag];
          return (
            <g key={k}>
              <Box x={x} y={28} w={44} h={40} r={4} fill={tok(c, 0.2)} stroke={tok(c)}>
                <T x={x + 22} y={48} size={13} mono weight={700} anchor="middle">{v.tag}</T>
              </Box>
              <Box x={x + 46} y={28} w={70} h={40} r={4} stroke={tok('ink', 0.5)}>
                <T x={x + 81} y={48} size={15} mono anchor="middle">{v.p}</T>
              </Box>
            </g>
          );
        })}
        {st.stack.length === 0 && <T x={10} y={48} size={13} fill={tok('muted')}>(empty)</T>}
        {st.check && (
          <Box x={10} y={86} w={250} h={28} r={4} fill={tok('warn', 0.12)} stroke={tok('warn')}>
            <T x={20} y={100} size={13} mono>tag check: {st.check}</T>
          </Box>
        )}
        {st.out && <T x={10} y={136} size={14} mono>prints: {st.out}</T>}
      </Svg>
    </StepFrame>
  );
}
