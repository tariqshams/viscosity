// Chapter 156: captureUpvalue walking the open-upvalue list, which is kept
// sorted by stack slot, highest first. Three closures' worth of captures:
// slot 3, slot 1, slot 2 (inserted between them), then slot 3 again (shared).
// Follows captureUpvalue in companion/ts/src/vm/vm.ts.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `let prev: ObjUpvalue | null = null;
let u = this.openUpvalues;
while (u && u.slot > slot) {
  prev = u;
  u = u.nextOpen;
}
if (u && u.slot === slot) return u;
const created =
  this.heap.newUpvalue(slot);
created.nextOpen = u;
if (prev) prev.nextOpen = created;
else this.openUpvalues = created;
return created;`;

type S = {
  line: number | null;
  want: number | null;
  list: number[];
  /** index in `list` that `u` points at (list.length = null) */
  u?: number;
  prev?: number;
  fresh?: number;
  shared?: number;
  note: string;
};

const STATES: S[] = [
  { line: null, want: null, list: [], note: 'The open list starts empty. A function’s locals a, b and c sit in its slots 1, 2 and 3, and g captures c, a and b, in that order. (The VM adds the frame’s start to each slot; only the order matters here.)' },
  { line: 1, want: 3, list: [], u: 0, note: 'capture slot 3: u starts at the head of the list, which is nothing yet, so the loop does not run and there is no match.' },
  { line: 11, want: 3, list: [3], fresh: 0, note: 'A new upvalue for slot 3 is made. prev is null, so it becomes the head of the list: openUpvalues now points at it.' },
  { line: 2, want: 1, list: [3], u: 0, note: 'capture slot 1: u starts at the upvalue for 3. Is 3 > 1? Yes, so the loop steps on.' },
  { line: 10, want: 1, list: [3, 1], prev: 0, fresh: 1, note: 'u is now null (the end), so a new upvalue for 1 is made and linked after prev, the upvalue for 3. The list reads 3, 1: still highest first.' },
  { line: 4, want: 2, list: [3, 1], prev: 0, u: 1, note: 'capture slot 2: the loop steps past 3 (3 > 2) and stops at 1, because 1 > 2 is false. u is the upvalue for 1, which is not slot 2.' },
  { line: 10, want: 2, list: [3, 2, 1], prev: 0, fresh: 1, note: 'So the new upvalue for 2 goes in right there: created.nextOpen = u (the 1), and prev (the 3) now points at it. Sorted, with no sorting.' },
  { line: 6, want: 3, list: [3, 2, 1], u: 0, shared: 0, note: 'A second closure captures slot 3. The loop stops at once (3 > 3 is false), u.slot === 3, so the existing upvalue is returned. Both closures now share one variable.' },
];

const X0 = 20;
const BW = 74;
const GAP = 40;
const Y = 70;

export default function CaptureSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const bx = (i: number) => X0 + 70 + i * (BW + GAP);
  return (
    <StepFrame title="captureUpvalue on a sorted list" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={150} title="The open-upvalue list as a row of linked boxes, highest slot first, with the u and prev pointers marked">
        <T x={8} y={16} size={11} weight={700} fill={tok('muted')}>OPEN LIST</T>
        {st.want !== null && <T x={392} y={16} size={12} mono anchor="end" fill={tok('brand')}>capture(slot {st.want})</T>}
        <Box x={X0 - 12} y={Y - 14} w={64} h={28} r={3} fill={tok('panel')} stroke={tok('line')}>
          <T x={X0 + 20} y={Y} size={10} mono anchor="middle">openUp…</T>
        </Box>
        {st.list.length === 0 ? (st.u === undefined &&
          <T x={bx(0) + 8} y={Y} size={12} mono fill={tok('muted')}>null</T>
        ) : (
          <Arrow x1={X0 + 52} y1={Y} x2={bx(0) - 2} y2={Y} color={tok('ink', 0.6)} />
        )}
        {st.list.map((slot, i) => {
          const isFresh = st.fresh === i;
          const isShared = st.shared === i;
          const stroke = isFresh ? tok('accent') : isShared ? tok('safe') : tok('line');
          const fill = isFresh ? tok('accent', 0.12) : isShared ? tok('safe', 0.14) : tok('panel');
          return (
            <g key={`${slot}-${i}`}>
              <Box x={bx(i)} y={Y - 18} w={BW} h={36} fill={fill} stroke={stroke}>
                <T x={bx(i) + BW / 2} y={Y - 5} size={11} mono anchor="middle">upvalue</T>
                <T x={bx(i) + BW / 2} y={Y + 9} size={12} mono anchor="middle" weight={700}>slot {slot}</T>
              </Box>
              {i < st.list.length - 1 && <Arrow x1={bx(i) + BW + 2} y1={Y} x2={bx(i + 1) - 2} y2={Y} color={tok('ink', 0.6)} />}
            </g>
          );
        })}
        {st.u !== undefined && (
          <>
            <T x={st.u < st.list.length ? bx(st.u) + BW / 2 : bx(st.list.length) + 14} y={Y + 44} size={12} mono anchor="middle" fill={tok('brand')} weight={700}>u</T>
            <Arrow x1={st.u < st.list.length ? bx(st.u) + BW / 2 : bx(st.list.length) + 14} y1={Y + 36} x2={st.u < st.list.length ? bx(st.u) + BW / 2 : bx(st.list.length) + 14} y2={Y + 22} color={tok('brand')} />
            {st.u >= st.list.length && <T x={bx(st.list.length) + 14} y={Y} size={11} mono anchor="middle" fill={tok('muted')}>null</T>}
          </>
        )}
        {st.prev !== undefined && (
          <>
            <T x={bx(st.prev) + BW / 2} y={Y - 42} size={12} mono anchor="middle" fill={tok('muted')} weight={700}>prev</T>
            <Arrow x1={bx(st.prev) + BW / 2} y1={Y - 34} x2={bx(st.prev) + BW / 2} y2={Y - 22} color={tok('muted')} />
          </>
        )}
        <T x={8} y={140} size={11} fill={tok('muted')}>highest slot first; new upvalues go where the walk stops</T>
      </Svg>
    </StepFrame>
  );
}
