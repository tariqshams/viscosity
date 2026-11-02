import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// The real bytecode for this program, as the companion disassembler
// (companion/ts/src/vm/debug.ts) prints it:
//   let xs = [10, 20];
//   print xs[1];
//   xs[0] = 7;
//   print xs;
const CODE = `0000    1 const               0 '10'
0003    | const               1 '20'
0006    | list                2
0008    | define.global       2 'xs'
0011    2 load.global         3 'xs'
0014    | const               4 '1'
0017    | index.get
0018    | print
0019    3 load.global         5 'xs'
0022    | const               6 '0'
0025    | const               7 '7'
0028    | index.set
0029    | pop
0030    4 load.global         8 'xs'
0033    | print`;

// 'L' on the stack is a reference to the list object.
type S = { line: number; stack: string[]; items: string[] | null; xs?: boolean; check?: string; out?: string; note: string };

const STATES: S[] = [
  { line: 0, stack: ['10'], items: null, note: 'const pushes 10. Nothing about a list exists yet: the elements are worked out first, one by one, onto the stack.' },
  { line: 1, stack: ['10', '20'], items: null, note: 'const pushes 20. The two elements now sit at the top of the stack, in source order.' },
  { line: 2, stack: ['L'], items: ['10', '20'], note: 'list 2 copies the top 2 values into a fresh array and makes a list object around it. The elements stay on the stack while the object is made, then the 2 slots are dropped and a single reference, L, is pushed in their place.' },
  { line: 3, stack: [], items: ['10', '20'], xs: true, note: 'define.global stores the reference under the name xs and pops it. The list lives on the heap; the global holds the way to find it.' },
  { line: 4, stack: ['L'], items: ['10', '20'], xs: true, note: 'Line 2 starts: load.global pushes the reference held in xs. Copying a reference copies no elements.' },
  { line: 5, stack: ['L', '1'], items: ['10', '20'], xs: true, note: 'const pushes the index, 1.' },
  { line: 6, stack: ['20'], items: ['10', '20'], xs: true, check: 'list? number? whole? 0 ≤ 1 < 2? yes', note: 'index.get pops the index and checks four things, in order: the value below is a list, the index is a number, it is whole, and it is in range. All pass, so the list reference is replaced by element 1, 20.' },
  { line: 7, stack: [], items: ['10', '20'], xs: true, out: '20', note: 'print pops 20 and prints it.' },
  { line: 10, stack: ['L', '0', '7'], items: ['10', '20'], xs: true, note: 'Line 3 pushes three things: the list, the index 0, and the new value 7 (load.global, const, const).' },
  { line: 11, stack: ['7'], items: ['7', '20'], xs: true, check: 'list? number? whole? 0 ≤ 0 < 2? yes', note: 'index.set pops the value and the index, runs the same four checks, writes 7 into element 0, and leaves 7 on the stack, because an assignment is an expression whose value is the value assigned.' },
  { line: 12, stack: [], items: ['7', '20'], xs: true, note: 'pop throws that value away: xs[0] = 7; was a statement, so nobody wanted it.' },
  { line: 14, stack: [], items: ['7', '20'], xs: true, out: '[7, 20]', note: 'Line 4 loads xs and prints it. The change made through one reference is visible through any other: there is only one list.' },
];

export default function BuildSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const cell = 56;
  return (
    <StepFrame title="Building, reading and writing a list" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={210} title="The value stack above, and the list object on the heap below, with the global xs referring to it">
        <T x={10} y={12} size={11} weight={700} fill={tok('muted')}>VALUE STACK (bottom → top)</T>
        {st.stack.map((v, k) => {
          const x = 10 + k * (cell + 4);
          const isRef = v === 'L';
          return (
            <Box key={k} x={x} y={24} w={cell} h={32} r={4} fill={isRef ? tok('brand', 0.2) : tok('panel')} stroke={isRef ? tok('brand') : tok('ink', 0.5)}>
              <T x={x + cell / 2} y={40} size={14} mono anchor="middle">{v}</T>
            </Box>
          );
        })}
        {st.stack.length === 0 && <T x={10} y={40} size={13} fill={tok('muted')}>(empty)</T>}
        {st.check && (
          <Box x={10} y={64} w={300} h={26} r={4} fill={tok('warn', 0.12)} stroke={tok('warn')}>
            <T x={18} y={77} size={12} mono>{st.check}</T>
          </Box>
        )}
        <T x={10} y={112} size={11} weight={700} fill={tok('muted')}>HEAP</T>
        <T x={300} y={112} size={11} weight={700} fill={tok('muted')}>GLOBALS</T>
        {st.items && (
          <g>
            <Box x={60} y={124} w={200} h={56} r={6} fill={tok('brand', 0.1)} stroke={tok('brand')}>
              <T x={70} y={136} size={11} fill={tok('muted')}>L: a list object, items</T>
              {st.items.map((v, k) => (
                <Box key={k} x={70 + k * 62} y={146} w={58} h={28} r={3} stroke={tok('ink', 0.5)}>
                  <T x={99 + k * 62} y={160} size={14} mono anchor="middle">{v}</T>
                </Box>
              ))}
            </Box>
            {st.stack.map((v, k) => (v === 'L' ? <Arrow key={k} x1={10 + k * (cell + 4) + cell / 2} y1={56} x2={90} y2={124} /> : null))}
          </g>
        )}
        {st.xs && (
          <g>
            <Box x={320} y={124} w={50} h={28} r={4} stroke={tok('ink', 0.5)}>
              <T x={345} y={138} size={13} mono weight={700} anchor="middle">xs</T>
            </Box>
            <Arrow x1={320} y1={138} x2={262} y2={150} />
          </g>
        )}
        {st.out && <T x={10} y={200} size={14} mono>prints: {st.out}</T>}
      </Svg>
    </StepFrame>
  );
}
