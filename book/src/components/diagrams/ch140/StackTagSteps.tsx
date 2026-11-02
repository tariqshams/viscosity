import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';
import { TAG_COLOUR } from './ValueBoxes';

// The real bytecode for `print -(1 + 2) == none;`, exactly as the companion
// disassembler (companion/ts/src/vm/debug.ts) prints it, with the value
// stack drawn as tagged slots.
const CODE = `0000    1 const               0 '1'
0003    | const               1 '2'
0006    | add
0007    | neg
0008    | none
0009    | eq
0010    | print
0011    | none
0012    | return`;

type V = { tag: 'none' | 'bool' | 'num'; p: string };
type S = { line: number; stack: V[]; check?: string; out?: string; note: string };

const n = (p: string): V => ({ tag: 'num', p });

const STATES: S[] = [
  { line: 0, stack: [n('1')], note: 'const copies constant 0 onto the stack. The slot gets a tag, num, as well as the payload 1, so from now on anyone can ask this slot what it holds.' },
  { line: 1, stack: [n('1'), n('2')], note: 'A second number goes on top: two slots, the same size, both tagged num.' },
  { line: 2, stack: [n('3')], check: 'num? num? yes: add', note: 'add must not add blindly. It reads both tags first; both say num, so it adds the payloads and leaves 3, tagged num. (Two strings would be joined instead; anything else is an error.)' },
  { line: 3, stack: [n('-3')], check: 'num? yes', note: 'neg checks one tag. If it said anything but num, the VM would stop with “cannot negate a string” (or none, or a list), naming the kind it found.' },
  { line: 4, stack: [n('-3'), { tag: 'none', p: '' }], note: 'none pushes Drip’s none. Its payload is empty: the tag alone says everything there is to know.' },
  { line: 5, stack: [{ tag: 'bool', p: 'false' }], check: 'num vs none: differ', note: 'eq looks at the tags first. num and none differ, so the answer is false without looking at any payload. Mixed kinds are never an error for ==; they are simply unequal.' },
  { line: 6, stack: [], out: 'false', note: 'print pops the value and uses its tag to choose how to show it: a bool prints as true or false.' },
  { line: 8, stack: [], out: 'false', note: 'none and return end every script: the script, like a function, hands back none when it finishes. Every value that passed through the stack carried its tag the whole way.' },
];

export default function StackTagSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Every slot knows its kind" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={150} title="The value stack, bottom on the left, each slot drawn with its tag and payload">
        <T x={10} y={12} size={11} weight={700} fill={tok('muted')}>VALUE STACK (bottom → top)</T>
        {st.stack.map((v, k) => {
          const x = 10 + k * 128;
          const c = TAG_COLOUR[v.tag];
          return (
            <g key={k}>
              <Box x={x} y={28} w={52} h={40} r={4} fill={tok(c, 0.2)} stroke={tok(c)}>
                <T x={x + 26} y={48} size={13} mono weight={700} anchor="middle">{v.tag}</T>
              </Box>
              <Box x={x + 54} y={28} w={66} h={40} r={4} stroke={tok('ink', 0.5)}>
                <T x={x + 87} y={48} size={15} mono anchor="middle">{v.p}</T>
              </Box>
            </g>
          );
        })}
        {st.stack.length === 0 && <T x={10} y={48} size={13} fill={tok('muted')}>(empty)</T>}
        {st.check && (
          <Box x={10} y={86} w={260} h={28} r={4} fill={tok('warn', 0.12)} stroke={tok('warn')}>
            <T x={20} y={100} size={13} mono>tag check: {st.check}</T>
          </Box>
        )}
        {st.out && <T x={10} y={136} size={14} mono>prints: {st.out}</T>}
      </Svg>
    </StepFrame>
  );
}
