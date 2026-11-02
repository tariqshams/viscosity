import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 163: the line-based reducer of engine/rust/scripts/fuzz.mjs
// (`reduce`), run by hand on an eight-line program whose failure needs
// lines L2 and L5. Chunks of 4, then 2, then 1; a deletion is kept when
// the failure is still there, and a pass is repeated until nothing
// changes. The sequence of tries below is exactly what the algorithm
// does for this `fails`: 14 calls in all.
type S = { lines: number[]; trying: number[]; kept?: boolean; chunk: number; calls: number; note: string };

const ALL = [0, 1, 2, 3, 4, 5, 6, 7];
const STATES: S[] = [
  { lines: ALL, trying: [], chunk: 4, calls: 0, note: 'Eight lines fail. Only L2 and L5 matter, but the reducer does not know that: it can only delete lines and ask fails() again. It starts with chunks of half the lines, 4.' },
  { lines: ALL, trying: [0, 1, 2, 3], kept: false, chunk: 4, calls: 1, note: 'Delete L0 to L3. Without L2 the program passes, so this deletion is undone and the reducer moves on by one chunk.' },
  { lines: ALL, trying: [4, 5, 6, 7], kept: false, chunk: 4, calls: 2, note: 'Delete L4 to L7: L5 is gone, so it passes too. Nothing changed in this pass, so the chunk is halved to 2.' },
  { lines: [2, 3, 4, 5, 6, 7], trying: [0, 1], kept: true, chunk: 2, calls: 3, note: 'Delete L0 and L1: it still fails. Keep the deletion, and do not move on: the next lines have slid into place, so the next try starts at the same spot.' },
  { lines: [2, 3, 4, 5], trying: [6, 7], kept: true, chunk: 2, calls: 6, note: 'L2, L3 and L4, L5 each fail to go (each takes a needed line), then L6, L7 goes. The pass changed something, so it runs again: two more calls, no change.' },
  { lines: [2, 4, 5], trying: [3], kept: true, chunk: 1, calls: 10, note: 'Chunks of 1. Deleting L2 makes it pass (call 9), so L2 stays; deleting L3 keeps the failure (call 10), so L3 goes.' },
  { lines: [2, 5], trying: [4], kept: true, chunk: 1, calls: 11, note: 'L4 goes too (call 11), and L5 must stay (call 12). A last pass over L2 and L5 changes nothing (calls 13 and 14), and at chunk 1 the reducer stops: two lines, and removing either one makes the failure go away.' },
];

export default function ReduceSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Delete, ask, keep or undo" steps={s} note={st.note}>
      <Svg w={400} h={226} title="A reducer deleting chunks of lines from a failing program while the failure remains">
        <T x={10} y={16} size={12} weight={700} fill={tok('muted')}>chunk {st.chunk}</T>
        <T x={390} y={16} size={12} anchor="end" fill={tok('muted')}>calls to fails(): {st.calls}</T>
        {ALL.map((l) => {
          const x = 10 + l * 48;
          const present = st.lines.includes(l) || st.trying.includes(l);
          const trying = st.trying.includes(l);
          const need = l === 2 || l === 5;
          const fill = trying ? (st.kept ? tok('safe', 0.18) : tok('danger', 0.15)) : present ? tok('panel') : tok('ink', 0.04);
          const stroke = trying ? (st.kept ? tok('safe') : tok('danger')) : present ? (need ? tok('brand') : tok('line')) : tok('line', 0.5);
          return (
            <Box key={l} x={x} y={34} w={42} h={34} r={4} fill={fill} stroke={stroke} dash={!present}>
              <T x={x + 21} y={51} size={13} mono anchor="middle" opacity={present ? 1 : 0.35}>{`L${l}`}</T>
            </Box>
          );
        })}
        {st.trying.length > 0 && (
          <T x={200} y={92} size={12} anchor="middle" fill={st.kept ? tok('safe') : tok('danger')}>
            {st.kept ? 'still fails: keep the deletion' : 'passes now: undo, move on'}
          </T>
        )}
        <T x={10} y={124} size={12} fill={tok('muted')}>the program now:</T>
        {st.lines.map((l, k) => (
          <Box key={l} x={10 + k * 48} y={136} w={42} h={30} r={4} fill={l === 2 || l === 5 ? tok('brand', 0.15) : tok('panel')} stroke={l === 2 || l === 5 ? tok('brand') : tok('line')}>
            <T x={31 + k * 48} y={151} size={13} mono anchor="middle">{`L${l}`}</T>
          </Box>
        ))}
        <T x={200} y={196} size={12} anchor="middle" fill={tok('muted')}>orange border: the two lines the failure needs</T>
        <T x={200} y={214} size={12} anchor="middle" fill={tok('muted')}>{st.lines.length} of 8 lines left</T>
      </Svg>
    </StepFrame>
  );
}
