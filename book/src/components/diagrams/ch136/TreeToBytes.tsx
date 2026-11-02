// Chapter 136: flattening the tree for 1 + 2 * 3 into a list of
// instructions. Each node writes its instruction after its children have
// written theirs, so the list comes out in the order a machine can run it.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type Id = 'add' | 'n1' | 'mul' | 'n2' | 'n3';
const NODES: Record<Id, { x: number; y: number; label: string; kids?: Id[] }> = {
  add: { x: 200, y: 30, label: '+', kids: ['n1', 'mul'] },
  n1: { x: 110, y: 92, label: '1' },
  mul: { x: 290, y: 92, label: '*', kids: ['n2', 'n3'] },
  n2: { x: 240, y: 154, label: '2' },
  n3: { x: 340, y: 154, label: '3' },
};

// The real instructions and bytes from the companion compiler
// (companion/ts/src/vm, checked with disassembleFunction): const has a
// two-byte operand, the number of the value in the constant table.
const INSTR: Record<Id, { text: string; bytes: number[] }> = {
  n1: { text: "const 0 '1'", bytes: [0, 0, 0] },
  n2: { text: "const 1 '2'", bytes: [0, 0, 1] },
  n3: { text: "const 2 '3'", bytes: [0, 0, 2] },
  mul: { text: 'mul', bytes: [22] },
  add: { text: 'add', bytes: [20] },
};

type S = { active: Id | null; done: Id[]; bytes?: boolean; note: string };

const STATES: S[] = [
  { active: null, done: [], note: 'The tree for 1 + 2 * 3, as the parser built it in Part III. The goal: the same meaning, written as a flat list of steps instead of a web of nodes.' },
  { active: 'add', done: [], note: 'Start at the root. The + can’t write its step yet: an addition needs both operands ready first. So it visits its children first.' },
  { active: 'n1', done: ['n1'], note: 'A number has no children, so it can write its step at once: “const 0”, which means “push value number 0”, and value number 0 is the 1. That is the first entry in the list.' },
  { active: 'mul', done: ['n1'], note: 'Now the right child, the * node. Like the +, it has to wait for its own children.' },
  { active: 'n2', done: ['n1', 'n2'], note: 'Its left child writes “const 1”: push value number 1, which is the 2.' },
  { active: 'n3', done: ['n1', 'n2', 'n3'], note: 'Its right child writes “const 2”, the 3. Three values are now waiting, and nothing has been calculated yet.' },
  { active: 'mul', done: ['n1', 'n2', 'n3', 'mul'], note: 'Both operands of * now come earlier in the list, so * can write its step: mul, which means “multiply the two newest values”.' },
  { active: 'add', done: ['n1', 'n2', 'n3', 'mul', 'add'], note: 'Last, the root writes add. Children first, parent after: the order of the list is the order the work must happen in.' },
  { active: null, done: ['n1', 'n2', 'n3', 'mul', 'add'], bytes: true, note: 'Give each kind of step a number (const is 0, add is 20, mul is 22) and the list becomes plain bytes. A const also needs two more bytes saying which value to push. Five instructions, eleven bytes, one array: nothing to chase and nothing to recurse into.' },
];

const ORDER: Id[] = ['n1', 'n2', 'n3', 'mul', 'add'];

export default function TreeToBytes() {
  const s = useSteps(STATES);
  const st = s.state;
  const ids = Object.keys(NODES) as Id[];
  const emitted = ORDER.filter((id) => st.done.includes(id));
  const bytes = emitted.flatMap((id) => INSTR[id].bytes);
  return (
    <StepFrame title="Flattening 1 + 2 * 3" steps={s} note={st.note}>
      <Svg w={400} h={300} title="The tree for 1 + 2 * 3 is visited children first. Each node appends its instruction to a list after its children, giving const 0, const 1, const 2, mul, add, which is the byte array 0 0 0 0 0 1 0 0 2 22 20.">
        {ids.map((id) => (NODES[id].kids ?? []).map((c) => (
          <line key={`${id}-${c}`} x1={NODES[id].x} y1={NODES[id].y} x2={NODES[c].x} y2={NODES[c].y} stroke={tok('ink', 0.45)} strokeWidth={1.5} />
        )))}
        {ids.map((id) => {
          const n = NODES[id];
          const active = id === st.active;
          const done = st.done.includes(id);
          return (
            <g key={id}>
              <circle cx={n.x} cy={n.y} r={17} fill={tok('paper')} />
              <circle cx={n.x} cy={n.y} r={17}
                fill={active ? tok('brand', 0.25) : done ? tok('safe', 0.12) : tok('panel')}
                stroke={active ? tok('brand') : done ? tok('safe') : tok('ink', 0.45)} strokeWidth={active ? 2.5 : 1.5} />
              <T x={n.x} y={n.y + 1} size={16} mono anchor="middle" weight={n.kids ? 700 : 400} fill={n.kids ? tok('brand') : tok('ink')}>{n.label}</T>
            </g>
          );
        })}
        <T x={8} y={192} size={11} weight={700} fill={tok('muted')}>THE LIST SO FAR</T>
        {emitted.map((id, k) => (
          <g key={id}>
            <Box x={8 + (k % 3) * 128} y={202 + Math.floor(k / 3) * 28} w={122} h={22} fill={id === st.active ? tok('brand', 0.18) : tok('panel')} stroke={id === st.active ? tok('brand') : tok('line')} />
            <T x={14 + (k % 3) * 128} y={213 + Math.floor(k / 3) * 28} size={12} mono>{`${k + 1}. ${INSTR[id].text}`}</T>
          </g>
        ))}
        {st.bytes && (
          <g>
            <T x={8} y={266} size={11} weight={700} fill={tok('muted')}>AS BYTES</T>
            {bytes.map((b, k) => (
              <g key={k}>
                <Box x={8 + k * 35} y={276} w={32} h={22} r={3} fill={tok('accent', 0.12)} stroke={tok('accent')} />
                <T x={24 + k * 35} y={287} size={12} mono anchor="middle">{b}</T>
              </g>
            ))}
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
