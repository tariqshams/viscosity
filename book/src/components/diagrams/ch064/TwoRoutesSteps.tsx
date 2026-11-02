import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = ['push 1', 'push 2', 'push 3', 'mul', 'add', 'print'];

type S = {
  route: 'tree' | 'interpreter' | 'compiler' | 'machine';
  mul?: boolean; add?: boolean; hot?: 'mul' | 'add' | 'print';
  emitted: number; pc?: number; stack: number[]; out: string; note: string;
};

const STATES: S[] = [
  { route: 'tree', emitted: 0, stack: [], out: '', note: 'The parser has built the tree for print 1 + 2 * 3. It describes the work, but nothing has been computed. There are two ways to finish.' },
  { route: 'interpreter', hot: 'mul', mul: true, emitted: 0, stack: [], out: '', note: 'Route 1, an interpreter: walk the tree and do each node’s job. To work out +, it first needs its right child, so it visits *: 2 times 3 is 6.' },
  { route: 'interpreter', hot: 'add', mul: true, add: true, emitted: 0, stack: [], out: '', note: 'Back at +: 1 plus 6 is 7. The interpreter computes as it goes; each value exists only while it is needed.' },
  { route: 'interpreter', hot: 'print', mul: true, add: true, emitted: 0, stack: [], out: '7', note: 'The print node shows 7. Done: the interpreter produced the output itself, and nothing else was made.' },
  { route: 'compiler', emitted: 3, stack: [], out: '', note: 'Route 2, a compiler: walk the same tree, but write instructions instead of doing them. Each number becomes a push, left to right.' },
  { route: 'compiler', emitted: 6, stack: [], out: '', note: 'After the children of a node come the node’s own instruction: mul for *, then add for +, then print. Six instructions, and still nothing has been computed: the output is empty.' },
  { route: 'machine', emitted: 6, pc: 2, stack: [1, 2, 3], out: '', note: 'Later, a small machine runs the instructions, top to bottom. Three pushes put 1, 2 and 3 on its stack.' },
  { route: 'machine', emitted: 6, pc: 3, stack: [1, 6], out: '', note: 'mul pops the top two (2 and 3) and pushes 6. The machine needs no tree: the order of the list says everything.' },
  { route: 'machine', emitted: 6, pc: 5, stack: [], out: '7', note: 'add pops 1 and 6 and pushes 7; print pops it and shows it. Same answer, by a different road, and the list can be run again without the tree.' },
];

function Node({ x, y, label, value, hot }: { x: number; y: number; label: string; value?: string; hot?: boolean }) {
  const w = Math.max(40, label.length * 9 + 12);
  return (
    <g>
      <Box x={x - w / 2} y={y - 14} w={w} h={28} r={8} fill={hot ? tok('brand', 0.22) : tok('panel')} stroke={hot ? tok('brand') : tok('ink', 0.45)}>
        <T x={x} y={y} size={14} mono weight={700} anchor="middle">{label}</T>
      </Box>
      {value && <T x={x + w / 2 + 4} y={y - 12} size={13} mono weight={700} fill={tok('accent')}>{value}</T>}
    </g>
  );
}

export default function TwoRoutesSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const label = { tree: 'THE TREE', interpreter: 'INTERPRETING', compiler: 'COMPILING', machine: 'RUNNING THE INSTRUCTIONS' }[st.route];
  return (
    <StepFrame title="One tree, two ways to finish" steps={s} note={st.note}>
      <Svg w={400} h={236} title="The tree for print 1 + 2 * 3 on the left; on the right, the instructions a compiler writes for it and the stack of the machine that runs them.">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>{label}</T>
        <Arrow x1={80} y1={50} x2={80} y2={66} width={1.5} />
        <Arrow x1={70} y1={94} x2={42} y2={116} width={1.5} />
        <Arrow x1={90} y1={94} x2={118} y2={116} width={1.5} />
        <Arrow x1={112} y1={144} x2={94} y2={166} width={1.5} />
        <Arrow x1={132} y1={144} x2={150} y2={166} width={1.5} />
        <Node x={80} y={36} label="print" hot={st.hot === 'print'} />
        <Node x={80} y={80} label="+" value={st.add ? '7' : undefined} hot={st.hot === 'add'} />
        <Node x={36} y={130} label="1" />
        <Node x={124} y={130} label="*" value={st.mul ? '6' : undefined} hot={st.hot === 'mul'} />
        <Node x={88} y={180} label="2" />
        <Node x={156} y={180} label="3" />

        <T x={206} y={30} size={11} weight={700} fill={tok('muted')}>INSTRUCTIONS</T>
        {CODE.map((c, k) => {
          const shown = k < st.emitted;
          const ran = st.pc !== undefined && k <= st.pc;
          return (
            <g key={c}>
              <Box x={206} y={40 + k * 26} w={82} h={22} r={4} dash={!shown} fill={ran ? tok('brand', 0.14) : shown ? tok('panel') : 'transparent'} stroke={shown ? tok('ink', 0.45) : tok('line')}>
                {shown && <T x={214} y={51 + k * 26} size={12} mono>{c}</T>}
              </Box>
            </g>
          );
        })}

        <T x={304} y={30} size={11} weight={700} fill={tok('muted')}>STACK</T>
        <Box x={304} y={40} w={88} h={152} r={4} fill="transparent" stroke={tok('line')} dash />
        {st.stack.map((v, k) => (
          <Box key={k} x={312} y={160 - k * 32} w={72} h={26} r={4} fill={tok('accent', 0.14)} stroke={tok('accent')}>
            <T x={348} y={173 - k * 32} size={14} mono weight={700} anchor="middle">{v}</T>
          </Box>
        ))}

        <T x={8} y={222} size={13} mono weight={700} fill={st.out ? tok('accent') : tok('muted')}>output: {st.out || '(nothing yet)'}</T>
      </Svg>
    </StepFrame>
  );
}
