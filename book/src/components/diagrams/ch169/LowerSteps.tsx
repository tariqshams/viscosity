import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 169: lowering a Python program to VIR. The VIR lines are the real
// output of core/src/vir.ts printFunc for this program (after a dataclass
// P with fields x and vx), trimmed. The JavaScript comparison lines are
// printFunc output for the same loop written in JavaScript.
const CODE = `ps = []
for i in range(1000):
    ps.append(P(float(i), 1.0))
for p in ps:
    p.x += p.vx`;

type S = { line: number | null; vir: string[]; js?: string[]; note: string };

const STATES: S[] = [
  { line: null, vir: [], note: 'A Python program you know by now. Each step shows the VIR the Python plugin produces for one line. VIR is the same IR the JavaScript plugin produces, so the meaning has to be settled here.' },
  { line: 0, vir: ['%2 = array.empty', 'store ps, %2'], note: 'An empty list becomes array.empty. ps is stored in a binding (not an SSA value), because it is bound to a list: a candidate collection the analyses will follow.' },
  { line: 1, vir: ['%4 = const 0', '%5 = const 1000', 'br b1', 'b1: %6 = phi %4, %14', '%7 = binop < %6, %5'], js: ['b1: %3 = phi %2, %12', '%4 = const 1000', '%5 = binop < %3, %4'], note: 'range(1000) is evaluated once, before the loop: the bound %5 lives in b0. In the JavaScript loop the bound is re-read in the header b1 on every pass. The phi %6 is a hidden counter, not the variable i.' },
  { line: 2, vir: ['%8 = load ps', '%9 = float(%6)', '%10 = const 1', '%11 = record {x, vx} %9, %10', '%12 = push %8, %11'], note: 'P(...) is a dataclass call, so it becomes record.new with fields in declaration order. float(i) is a known intrinsic. append is push. The printer shows 1.0 as “const 1”: the float-ness is a note on the const.' },
  { line: 3, vir: ['b5: %17 = phi %16, %26', '%18 = field.get %15 .length', '%19 = binop < %17, %18', '%20 = index.get %15, %17'], note: 'for p in ps is an element loop: an index from 0, a length read in the header on every pass, and index.get for the element. Re-reading the length each pass matches Python’s list iteration when the list grows inside the loop.' },
  { line: 4, vir: ['%21 = field.get %20 .x', '%22 = field.get %20 .vx', '%23 = binop + %21, %22', 'field.set %20, %23 .x'], note: 'p.x += p.vx is two reads, an add and a write, all on the element %20. These are exactly the instructions the JavaScript version produces, so every analysis from Part VIII applies.' },
];

export default function LowerSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const rows = st.vir.length + (st.js ? st.js.length + 1 : 0);
  return (
    <StepFrame title="Python lines, VIR instructions" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={Math.max(80, 30 + rows * 20)} title="The VIR instructions produced for the highlighted Python line">
        <T x={10} y={12} size={10} weight={700} fill={tok('muted')}>VIR</T>
        {st.vir.length === 0 && <T x={10} y={40} size={12} fill={tok('muted')}>step through to see the IR</T>}
        {st.vir.map((l, k) => (
          <Box key={k} x={8} y={22 + k * 20} w={384} h={18} fill={tok('f4', 0.12)} stroke={tok('f4')} r={3}>
            <T x={16} y={31 + k * 20} size={11} mono>{l}</T>
          </Box>
        ))}
        {st.js && (
          <g>
            <T x={10} y={32 + st.vir.length * 20} size={10} weight={700} fill={tok('muted')}>THE SAME LOOP IN JAVASCRIPT</T>
            {st.js.map((l, k) => (
              <Box key={k} x={8} y={42 + (st.vir.length + k) * 20} w={384} h={18} fill={tok('f3', 0.12)} stroke={tok('f3')} r={3}>
                <T x={16} y={51 + (st.vir.length + k) * 20} size={11} mono>{l}</T>
              </Box>
            ))}
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
