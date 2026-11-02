// Chapter 158b: sweep walks the object list once, keeping marked objects
// (and resetting them to white) and unlinking unmarked ones, with `prev`
// trailing one step behind `o`. Follows step 4 of Heap.collect in
// companion/ts/src/vm/heap.ts.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `while (o) {
  if (o.isMarked) {
    o.isMarked = false;
    prev = o;
    o = o.next;
  } else {
    const dead = o;
    o = o.next;
    if (prev) prev.next = o;
    else this.objects = o;
    this.bytesAllocated -= SIZE[dead.type];
    this.freed++;
    if (this.poisonFreed) poison(dead);
  }
}`;

const IDS = ['F', 'D', 'C', 'E', 'B', 'A'];
const MARKED = new Set(['F', 'C', 'B', 'A']);

type S = { line: number | null; o: number; prev: number | null; done: number; freed: string[]; note: string };

const STATES: S[] = [
  { line: null, o: 0, prev: null, done: 0, freed: [], note: 'Marking is over: F, C, B and A are marked (black, shown dark); D and E are not. o starts at the head of the object list, prev at null.' },
  { line: 4, o: 1, prev: 0, done: 1, freed: [], note: 'F is marked: reset it to white for the next collection, and move on. prev now trails at F.' },
  { line: 8, o: 2, prev: 0, done: 2, freed: ['D'], note: 'D is not marked: step o past it, then make prev (F) point at what comes after D. D is no longer on the list.' },
  { line: 4, o: 3, prev: 2, done: 3, freed: ['D'], note: 'C is marked: reset and keep it; prev moves to C.' },
  { line: 8, o: 4, prev: 2, done: 4, freed: ['D', 'E'], note: 'E is not marked: C’s next now skips over it to B.' },
  { line: 4, o: 6, prev: 5, done: 6, freed: ['D', 'E'], note: 'B and A are marked and kept. o falls off the end, and the loop stops: one walk, every object visited once.' },
];

const BW = 44;
const GAP = 20;
const X0 = 16;
const Y = 54;

export default function SweepSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const bx = (i: number) => X0 + i * (BW + GAP);
  const kept = IDS.map((id, i) => ({ id, i })).filter(({ id }) => !st.freed.includes(id));
  return (
    <StepFrame title="Sweep: one walk down the object list" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={150} title="The object list as a row of boxes; unlinked objects drop below the row">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>OBJECT LIST</T>
        {kept.slice(0, -1).map(({ i }, k) => (
          <Arrow key={i} x1={bx(i) + BW} y1={Y} x2={bx(kept[k + 1].i) - 2} y2={Y} color={tok('ink', 0.55)} />
        ))}
        {IDS.map((id, i) => {
          const freed = st.freed.includes(id);
          const marked = MARKED.has(id) && i >= st.done;
          const y = freed ? Y + 50 : Y;
          return (
            <Box key={id} x={bx(i)} y={y - 14} w={BW} h={28} r={4} opacity={freed ? 0.5 : 1}
              fill={marked ? tok('ink') : tok('panel')} stroke={freed ? tok('danger') : tok('ink', 0.6)} dash={freed}>
              <T x={bx(i) + BW / 2} y={y} size={13} weight={700} anchor="middle" fill={marked ? tok('paper') : tok('ink')}>{id}</T>
            </Box>
          );
        })}
        {st.o < IDS.length ? (
          <T x={bx(st.o) + BW / 2} y={Y - 26} size={12} mono anchor="middle" fill={tok('brand')} weight={700}>o</T>
        ) : (
          <T x={392} y={Y - 26} size={12} mono anchor="end" fill={tok('brand')} weight={700}>o = null</T>
        )}
        {st.prev !== null && <T x={bx(st.prev) + BW / 2} y={Y + 26} size={12} mono anchor="middle" fill={tok('muted')} weight={700}>prev</T>}
        <T x={8} y={140} size={11} fill={tok('muted')}>dark = still marked; dashed = unlinked (freed)</T>
      </Svg>
    </StepFrame>
  );
}
