import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Value tagging as described for V8 with pointer compression: a 32-bit slot
// whose lowest bit says "small integer (0)" or "pointer (1)".
const CODE = `let a = 42;
let b = 4.2;
b = b + 1;
let c = 2 ** 30;`;

type Heap = { v: string; dead?: boolean };
type S = { line: number; slots: { name: string; payload: string; tag: 0 | 1; to?: number }[]; heap: Heap[]; note: string };

const STATES: S[] = [
  { line: 0, slots: [{ name: 'a', payload: '42', tag: 0 }], heap: [], note: '42 is a small integer, so it is stored right inside the slot as a Smi. The lowest bit, 0, is the tag that says “this is a number, not an address”.' },
  { line: 1, slots: [{ name: 'a', payload: '42', tag: 0 }, { name: 'b', payload: 'address', tag: 1, to: 0 }], heap: [{ v: '4.2' }], note: '4.2 isn’t an integer, so it can’t be a Smi. V8 allocates a HeapNumber on the heap holding the full 64-bit double, and b’s slot holds its address. Tag bit 1 means “pointer”.' },
  { line: 2, slots: [{ name: 'a', payload: '42', tag: 0 }, { name: 'b', payload: 'address', tag: 1, to: 1 }], heap: [{ v: '4.2', dead: true }, { v: '5.2' }], note: 'HeapNumbers are immutable. b + 1 allocates a NEW HeapNumber holding 5.2 and re-aims b. The old box is garbage for the collector to clean up.' },
  { line: 3, slots: [{ name: 'a', payload: '42', tag: 0 }, { name: 'b', payload: 'address', tag: 1, to: 1 }, { name: 'c', payload: 'address', tag: 1, to: 2 }], heap: [{ v: '4.2', dead: true }, { v: '5.2' }, { v: '1073741824' }], note: '2 ** 30 is an integer, but too big: with pointer compression a Smi has only 31 bits including the sign, so it tops out at 2 ** 30 − 1. This one becomes a HeapNumber too.' },
];

export default function TagSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Smi or pointer? The tag bit decides" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={190} title="Variable slots on the left, each with a payload and a tag bit; HeapNumber boxes on the right">
        <T x={10} y={12} size={11} weight={700} fill={tok('muted')}>SLOTS (32 bits)</T>
        <T x={258} y={12} size={11} weight={700} fill={tok('muted')}>HEAP</T>
        {st.slots.map((sl, k) => {
          const y = 28 + k * 52;
          return (
            <g key={sl.name}>
              <T x={12} y={y + 17} size={15} mono weight={700}>{sl.name}</T>
              <Box x={30} y={y} w={130} h={34} r={4} stroke={tok('ink', 0.5)}>
                <T x={90} y={y + 17} size={14} mono anchor="middle" fill={sl.tag ? tok('muted') : tok('ink')}>{sl.payload}</T>
              </Box>
              <Box x={162} y={y} w={30} h={34} r={4} fill={sl.tag ? tok('accent', 0.2) : tok('safe', 0.2)} stroke={sl.tag ? tok('accent') : tok('safe')}>
                <T x={177} y={y + 17} size={15} mono weight={700} anchor="middle">{sl.tag}</T>
              </Box>
              {sl.to !== undefined && <Arrow x1={194} y1={y + 17} x2={256} y2={28 + sl.to * 52 + 17} />}
            </g>
          );
        })}
        {st.heap.map((h, k) => {
          const y = 28 + k * 52;
          return (
            <Box key={k} x={258} y={y} w={134} h={34} r={6} fill={tok('brand', h.dead ? 0.03 : 0.12)} stroke={h.dead ? tok('ink', 0.25) : tok('brand')} dash={h.dead}>
              <T x={266} y={y + 11} size={9} fill={tok('muted')}>HeapNumber{h.dead ? ' (garbage)' : ''}</T>
              <T x={266} y={y + 25} size={13} mono opacity={h.dead ? 0.4 : 1}>{h.v}</T>
            </Box>
          );
        })}
        <T x={30} y={182} size={11} fill={tok('muted')}>tag 0 = Smi (number inside)   tag 1 = pointer</T>
      </Svg>
    </StepFrame>
  );
}
