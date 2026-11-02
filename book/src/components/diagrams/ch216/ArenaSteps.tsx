// Chapter 216: drip-rs's Arena<T> (book/companion/rust/src/object.rs).
// The arena is a Vec<Option<T>> of slots plus a free list of slot
// numbers; a handle Gc<T> is just a slot number. insert() pops the free
// list before pushing; remove(i, reuse) empties the slot and, only when
// reuse is true, pushes i on the free list. Indexing a None slot panics
// with "use after free" (object.rs, use_after_free). The behaviour shown
// matches the arena's unit test arenas_reuse_freed_slots_only_when_asked.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `let a = arena.insert(A);
let b = arena.insert(B);
let c = arena.insert(C);
arena.remove(b.index(), reuse);
let d = arena.insert(D);
arena[b] // which object?`;

type H = 'a' | 'b' | 'c' | 'd';
type S = {
  line: number;
  slots: (string | null)[];
  free: number[];
  handles: Partial<Record<H, number>>;
  hl?: H;
  mode?: 'reuse' | 'poison';
  bad?: 'wrong' | 'panic';
  note: string;
};

const STATES: S[] = [
  { line: 0, slots: ['A'], free: [], handles: { a: 0 }, hl: 'a', note: 'insert pushes A into a new slot, 0, and returns the handle Gc(0). The arena owns A; a is just the number 0, typed as “an index into this arena”.' },
  { line: 1, slots: ['A', 'B'], free: [], handles: { a: 0, b: 1 }, hl: 'b', note: 'B goes into slot 1. Handles are 4 bytes and Copy: you can store b in a hundred places and nobody owns anything extra.' },
  { line: 2, slots: ['A', 'B', 'C'], free: [], handles: { a: 0, b: 1, c: 2 }, hl: 'c', note: 'C goes into slot 2. The objects sit side by side in one Vec.' },
  { line: 3, slots: ['A', null, 'C'], free: [1], handles: { a: 0, b: 1, c: 2 }, hl: 'b', mode: 'reuse', note: 'The collector frees B: the slot becomes None, and with reuse on, slot 1 goes on the free list. The handle b still says 1. Nothing can stop you keeping it.' },
  { line: 4, slots: ['A', 'D', 'C'], free: [], handles: { a: 0, b: 1, c: 2, d: 1 }, hl: 'd', mode: 'reuse', note: 'insert pops the free list first, so D moves into slot 1 and d is Gc(1). Reusing slots keeps the arena small.' },
  { line: 5, slots: ['A', 'D', 'C'], free: [], handles: { a: 0, b: 1, c: 2, d: 1 }, hl: 'b', mode: 'reuse', bad: 'wrong', note: 'arena[b] reads slot 1 and gets D. No crash and no undefined behaviour, but the wrong object: a stale handle. In a correct VM this never happens, because the collector only frees what no root can reach.' },
  { line: 3, slots: ['A', null, 'C'], free: [], handles: { a: 0, b: 1, c: 2 }, hl: 'b', mode: 'poison', note: 'Now replay with reuse off, as drip-rs’s debug and stress modes do. Slot 1 becomes None and does NOT go on the free list.' },
  { line: 4, slots: ['A', null, 'C', 'D'], free: [], handles: { a: 0, b: 1, c: 2, d: 3 }, hl: 'd', mode: 'poison', note: 'So D gets a fresh slot, 3. Slot 1 stays empty forever.' },
  { line: 5, slots: ['A', null, 'C', 'D'], free: [], handles: { a: 0, b: 1, c: 2, d: 3 }, hl: 'b', mode: 'poison', bad: 'panic', note: 'arena[b] finds None and panics: “use after free: a … was collected while still in use”. A missing root becomes a loud failure at the exact use, instead of a quiet wrong answer.' },
];

const HS: H[] = ['a', 'b', 'c', 'd'];

export default function ArenaSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const sx = (i: number) => 60 + i * 80;
  return (
    <StepFrame title="Slots, a free list and handles" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={210} title="An arena of four slots, its free list, and handles pointing at slots by number">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>slots: Vec&lt;Option&lt;T&gt;&gt;</T>
        {st.mode && (
          <T x={392} y={14} size={11} weight={700} anchor="end" fill={st.mode === 'poison' ? tok('warn') : tok('brand')}>
            {st.mode === 'poison' ? 'reuse = false' : 'reuse = true'}
          </T>
        )}
        {[0, 1, 2, 3].map((i) => {
          const v = st.slots[i];
          const exists = i < st.slots.length;
          const target = st.hl && st.handles[st.hl] === i;
          const col = st.bad === 'panic' && target ? tok('danger') : st.bad === 'wrong' && target ? tok('warn') : target ? tok('brand') : tok('line');
          return (
            <g key={i}>
              <T x={sx(i) + 30} y={32} size={10} mono anchor="middle" fill={tok('muted')}>{i}</T>
              <Box x={sx(i)} y={40} w={60} h={36} r={4} fill={target ? tok('brand', 0.12) : tok('panel')} stroke={exists ? col : tok('line')} dash={!exists} opacity={exists ? 1 : 0.4}>
                <T x={sx(i) + 30} y={58} size={13} mono anchor="middle" fill={v ? tok('ink') : tok('muted')}>
                  {exists ? (v ? `Some(${v})` : 'None') : ''}
                </T>
              </Box>
            </g>
          );
        })}
        <T x={8} y={98} size={11} weight={700} fill={tok('muted')}>free: [{st.free.join(', ')}]</T>
        <T x={8} y={128} size={11} weight={700} fill={tok('muted')}>handles</T>
        {HS.map((h, k) => {
          const i = st.handles[h];
          if (i === undefined) return null;
          const x = 60 + k * 80;
          const hl = st.hl === h;
          const col = hl ? (st.bad === 'panic' ? tok('danger') : st.bad === 'wrong' ? tok('warn') : tok('brand')) : tok('ink', 0.35);
          return (
            <g key={h}>
              <Box x={x - 3} y={150} w={66} h={28} r={4} stroke={hl ? col : tok('line')}>
                <T x={x + 30} y={164} size={11} mono anchor="middle">{h} = Gc({i})</T>
              </Box>
              <Arrow x1={x + 30} y1={150} x2={sx(i) + 30} y2={78} color={col} width={hl ? 2 : 1.2} />
            </g>
          );
        })}
        {st.bad === 'wrong' && <T x={200} y={200} size={11} weight={700} anchor="middle" fill={tok('warn')}>b now reads D: wrong object, no crash</T>}
        {st.bad === 'panic' && <T x={200} y={200} size={11} weight={700} anchor="middle" fill={tok('danger')}>panic: use after free</T>}
      </Svg>
    </StepFrame>
  );
}
