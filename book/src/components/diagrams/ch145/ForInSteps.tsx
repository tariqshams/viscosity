import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// The real bytecode for this program, as the companion disassembler prints it:
//   let xs = [3, 4];
//   for x in xs {
//     print x;
//   }
// Slot 0 holds the script itself; the loop adds two hidden locals (the list
// in slot 1, the index in slot 2) and the loop variable x in slot 3.
const CODE = `0000    1 const               0 '3'
0003    | const               1 '4'
0006    | list                2
0008    | define.global       2 'xs'
0011    2 load.global         3 'xs'
0014    | iter.list
0015    | const               4 '0'
0018    | load.local          2
0020    | load.local          1
0022    | list.len
0023    | lt
0024    | jump.unless        24 -> 41
0027    | load.local          1
0029    | load.local          2
0031    | index.get
0032    3 load.local          3
0034    | print
0035    4 pop
0036    2 inc.local           2
0038    4 loop               38 -> 18
0041    | pop
0042    | pop
0043    | none
0044    | return`;

type S = { line: number; slots: (string | null)[]; temp: string[]; out?: string[]; note: string };
const NAMES = ['script', 'the list', 'index', 'x'];

const STATES: S[] = [
  { line: 3, slots: ['<script>'], temp: [], note: 'Line 1 has built the list [3, 4] and stored it in the global xs, as in the last diagram. Slot 0 of the stack holds the running script itself.' },
  { line: 4, slots: ['<script>', 'L'], temp: [], note: 'The loop evaluates xs once and leaves the reference on the stack. The compiler treats that slot as a hidden local variable (slot 1), with a name no Drip program can write.' },
  { line: 5, slots: ['<script>', 'L'], temp: [], note: 'iter.list checks, once, that slot 1 really holds a list. With a number here it would stop with “cannot loop over a number”.' },
  { line: 6, slots: ['<script>', 'L', '0'], temp: [], note: 'const 0 starts a second hidden local, the index, in slot 2.' },
  { line: 9, slots: ['<script>', 'L', '0'], temp: ['0', '2'], note: 'The test, done before every round: push the index, push the list, and replace the list by its length with list.len. The length is read again each time round, so a body that pushes onto the list makes the loop longer.' },
  { line: 11, slots: ['<script>', 'L', '0'], temp: [], note: 'lt leaves true (0 < 2), and jump.unless pops it. Since it is true, there is no jump: the body runs.' },
  { line: 14, slots: ['<script>', 'L', '0', '3'], temp: [], note: 'load.local 1, load.local 2, index.get: element 0 of the list, 3, lands on the stack, and that slot becomes x (slot 3), a brand-new variable for this round.' },
  { line: 16, slots: ['<script>', 'L', '0', '3'], temp: [], out: ['3'], note: 'The body: load.local 3 pushes x, and print prints 3.' },
  { line: 17, slots: ['<script>', 'L', '0'], temp: [], out: ['3'], note: 'The round ends: pop removes x. Next time a fresh x is made, which is why closures made in the body each keep their own.' },
  { line: 18, slots: ['<script>', 'L', '1'], temp: [], out: ['3'], note: 'inc.local 2 adds 1 to the index in place, with no pushing or popping.' },
  { line: 19, slots: ['<script>', 'L', '1'], temp: [], out: ['3'], note: 'loop jumps back to offset 18, the start of the test, not to the start of the loop: the list was evaluated once and is never evaluated again.' },
  { line: 16, slots: ['<script>', 'L', '1', '4'], temp: [], out: ['3', '4'], note: 'Second round: 1 < 2, so index.get reads element 1 into a fresh x, and the body prints 4. Then pop, inc.local (the index becomes 2) and loop.' },
  { line: 11, slots: ['<script>', 'L', '2'], temp: [], out: ['3', '4'], note: 'Third test: 2 < 2 is false, so jump.unless jumps forward to offset 41, past the body.' },
  { line: 21, slots: ['<script>'], temp: [], out: ['3', '4'], note: 'Two pops remove the hidden locals, the index and the list, and the stack is as it was before the loop. none and return end the script.' },
];

export default function ForInSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="for x in xs, one instruction at a time" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={170} title="The stack slots used by the loop: the script, the hidden list and index, and the loop variable x, with any temporary values above them">
        <T x={10} y={12} size={11} weight={700} fill={tok('muted')}>STACK SLOTS</T>
        {NAMES.map((name, k) => {
          const v = st.slots[k];
          const x = 10 + k * 96;
          const live = v !== undefined && v !== null;
          const hidden = k === 1 || k === 2;
          return (
            <g key={k}>
              <Box x={x} y={26} w={90} h={34} r={4} fill={live ? (v === 'L' ? tok('brand', 0.2) : tok('panel')) : tok('panel')} stroke={live ? tok('ink', 0.5) : tok('line')} dash={!live}>
                <T x={x + 45} y={43} size={13} mono anchor="middle" fill={live ? tok('ink') : tok('muted')}>{live ? v : ''}</T>
              </Box>
              <T x={x + 45} y={72} size={11} anchor="middle" fill={hidden ? tok('accent') : tok('muted')}>{k}: {name}</T>
            </g>
          );
        })}
        <T x={10} y={98} size={11} weight={700} fill={tok('muted')}>TEMPORARIES ABOVE THEM</T>
        {st.temp.map((v, k) => (
          <Box key={k} x={10 + k * 60} y={108} w={54} h={28} r={4} stroke={tok('ink', 0.5)}>
            <T x={37 + k * 60} y={122} size={13} mono anchor="middle">{v}</T>
          </Box>
        ))}
        {st.temp.length === 0 && <T x={10} y={122} size={12} fill={tok('muted')}>(none)</T>}
        {st.out && <T x={10} y={156} size={14} mono>printed: {st.out.join(', ')}</T>}
      </Svg>
    </StepFrame>
  );
}
