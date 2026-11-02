// Chapter 347: one collection in drip-rs's Heap, step by step.
// The heap is built by hand, like the unit test in src/gc.rs: intern
// "Point" and "tmp", allocate a class named Point and two instances a and
// b of it, then heap.collect(&[&a]). Running exactly that against the
// library (a scratch example in a copy of book/companion/rust) gave the
// handles shown here, freed 2 objects (string 1 and instance 1), and the
// next instance went into slot 1, or slot 2 with poison_freed set. The
// steps follow Heap::collect, Heap::blacken, Marks::mark and Heap::sweep.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type Row = { name: string; slots: (string | null)[]; marks: boolean[]; free: number[] };
type S = { op: string; rows: Row[]; gray: string[]; hot: [number, number][]; table: string; note: string };

const cap = (slots: (string | null)[], marks: boolean[], free: number[] = []) => ({ slots, marks, free });
const rows = (s: ReturnType<typeof cap>, c: ReturnType<typeof cap>, i: ReturnType<typeof cap>): Row[] => [
  { name: 'strings', ...s },
  { name: 'classes', ...c },
  { name: 'instances', ...i },
];
const STR = ['"Point"', '"tmp"'];
const CLS = ['Point'];
const INS = ['a', 'b'];

const STATES: S[] = [
  {
    op: 'marks.reset(self)',
    rows: rows(cap(STR, [false, false]), cap(CLS, [false]), cap(INS, [false, false])),
    gray: [], hot: [], table: '"Point", "tmp"',
    note: 'The bitmap was taken out of the heap with mem::take, then reset: one false per slot, sized to each arena as it is now. Objects carry no mark bit of their own. The only root is a, instance 0.',
  },
  {
    op: '1. root.trace(&mut marks)',
    rows: rows(cap(STR, [false, false]), cap(CLS, [false]), cap(INS, [true, false])),
    gray: ['Instance(Gc(0))'], hot: [[2, 0]], table: '"Point", "tmp"',
    note: 'Tracing the root calls marks.mark(a): its bit goes true, and because an instance can refer to other objects, Gray::Instance(a) goes on the gray stack.',
  },
  {
    op: '2. blacken(Instance(Gc(0)))',
    rows: rows(cap(STR, [false, false]), cap(CLS, [true]), cap(INS, [true, false])),
    gray: ['Class(Gc(0))'], hot: [[1, 0]], table: '"Point", "tmp"',
    note: 'Popped and blackened: blacken reads heap[a] (a shared borrow of the heap) and traces its class and fields into marks (a separate &mut). The class is marked and goes gray. a’s fields table is empty.',
  },
  {
    op: '2. blacken(Class(Gc(0)))',
    rows: rows(cap(STR, [true, false]), cap(CLS, [true]), cap(INS, [true, false])),
    gray: [], hot: [[0, 0]], table: '"Point", "tmp"',
    note: 'The class’s name, "Point", is marked. Strings refer to nothing, so Gray has no variant for them: marking one makes it black at once. The gray stack is empty, so marking is done.',
  },
  {
    op: '3. interned.retain_keys(..)',
    rows: rows(cap(STR, [true, false]), cap(CLS, [true]), cap(INS, [true, false])),
    gray: [], hot: [[0, 1]], table: '"Point"',
    note: 'The string table holds its strings weakly: it keeps only keys whose mark bit is set. "tmp" is unmarked, so its entry goes, before sweep frees the string itself.',
  },
  {
    op: '4. sweep(&marks)',
    rows: rows(cap(['"Point"', null], [true, false], [1]), cap(CLS, [true]), cap(['a', null], [true, false], [1])),
    gray: [], hot: [[0, 1], [2, 1]], table: '"Point"',
    note: 'Every live slot with a false bit is removed: string 1 and instance b. Each slot becomes None, and its index goes on that arena’s free list. heap.freed is 2. Nothing has to be unmarked: the next collection resets the bitmap.',
  },
  {
    op: 'alloc(ObjInstance { .. })',
    rows: rows(cap(['"Point"', null], [true, false], [1]), cap(CLS, [true]), cap(['a', 'new'], [true, false])),
    gray: [], hot: [[2, 1]], table: '"Point"',
    note: 'The next instance pops 1 off the free list and reuses the slot. With poison_freed set, as in the debug and stress modes, the index never goes on the free list, the new instance gets slot 2, and an old handle to slot 1 panics with “use after free”.',
  },
];

const SX = 92;
const SW = 76;
const rowY = (r: number) => 58 + r * 62;

export default function GcSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const isHot = (r: number, k: number) => st.hot.some(([a, b]) => a === r && b === k);
  return (
    <StepFrame title="One collection: bitmap, gray stack, free lists" steps={s} note={st.note}>
      <Svg w={400} h={300} title="Three arenas with their mark bits and free lists, the gray stack and the string table">
        <Box x={8} y={6} w={384} h={28} r={4} fill={tok('panel')} stroke={tok('line')}>
          <T x={16} y={20} size={12} mono weight={700}>{st.op}</T>
        </Box>
        {st.rows.map((row, r) => (
          <g key={row.name}>
            <T x={8} y={rowY(r) + 12} size={11} mono weight={700}>{row.name}</T>
            <T x={8} y={rowY(r) + 26} size={11} mono fill={tok('muted')}>free: [{row.free.join(', ')}]</T>
            {row.slots.map((v, k) => {
              const hot = isHot(r, k);
              const x = SX + k * (SW + 6);
              return (
                <g key={k}>
                  <Box x={x} y={rowY(r)} w={SW} h={26} r={3} dash={v === null}
                    fill={v === null ? tok('paper') : hot ? tok('brand', 0.16) : tok('panel')}
                    stroke={hot ? tok('brand') : tok('line')}>
                    <T x={x + SW / 2} y={rowY(r) + 14} size={11} mono anchor="middle" fill={v === null ? tok('muted') : tok('ink')}>{k}: {v ?? 'None'}</T>
                  </Box>
                  <Box x={x + SW / 2 - 11} y={rowY(r) + 30} w={22} h={17} r={2}
                    fill={row.marks[k] ? tok('safe', 0.25) : tok('paper')} stroke={row.marks[k] ? tok('safe') : tok('line')}>
                    <T x={x + SW / 2} y={rowY(r) + 38.5} size={11} mono anchor="middle" fill={tok('ink')}>{row.marks[k] ? '1' : '0'}</T>
                  </Box>
                </g>
              );
            })}
          </g>
        ))}
        <T x={260} y={52} size={11} mono weight={700} fill={tok('muted')}>gray: Vec&lt;Gray&gt;</T>
        <Box x={260} y={60} w={132} h={64} r={4} fill={tok('panel')} stroke={st.gray.length ? tok('accent') : tok('line')}>
          {st.gray.length === 0 && <T x={326} y={92} size={11} mono anchor="middle" fill={tok('muted')}>(empty)</T>}
          {st.gray.map((g, k) => (
            <T key={k} x={268} y={78 + k * 16} size={11} mono fill={tok('ink')}>{g}</T>
          ))}
        </Box>
        <T x={260} y={142} size={11} mono weight={700} fill={tok('muted')}>interned (weak)</T>
        <Box x={260} y={150} w={132} h={30} r={4} fill={tok('panel')} stroke={tok('line')}>
          <T x={268} y={165} size={11} mono fill={tok('ink')}>{st.table}</T>
        </Box>
        <T x={8} y={262} size={11} fill={tok('muted')}>Small boxes under the slots: the Marks bitmap, one bool per slot.</T>
        <T x={8} y={278} size={11} fill={tok('muted')}>roots: [&amp;a], where a is instances slot 0.</T>
        <T x={8} y={294} size={11} fill={tok('muted')}>Dashed slot: freed (None).</T>
      </Svg>
    </StepFrame>
  );
}
