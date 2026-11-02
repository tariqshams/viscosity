import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 225-b: line-based delta debugging, as in the repository fuzzer's
// --reduce. Try removing a chunk of lines; keep the removal if the failure
// is still there; halve the chunk size when no chunk can go. Here the
// failure needs lines B and E together.
const LINES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
type S = { kept: string[]; trying: string[]; ok: boolean | null; chunk: number; note: string };

const STATES: S[] = [
  { kept: LINES, trying: [], ok: null, chunk: 4, note: 'A failing program of eight lines. (Secretly, the bug needs lines B and E together.) Start with chunks of half the program: four lines.' },
  { kept: LINES, trying: ['A', 'B', 'C', 'D'], ok: false, chunk: 4, note: 'Remove A to D. What is left, E to H, no longer fails (B is gone), so put them back.' },
  { kept: LINES, trying: ['E', 'F', 'G', 'H'], ok: false, chunk: 4, note: 'Remove E to H. A to D alone does not fail either. No chunk of four can go: halve the chunk size to two.' },
  { kept: LINES, trying: ['A', 'B'], ok: false, chunk: 2, note: 'Remove A and B: B is needed, so no.' },
  { kept: LINES, trying: ['C', 'D'], ok: true, chunk: 2, note: 'Remove C and D: still fails. Keep the smaller program; the next chunk now starts where C was.' },
  { kept: ['A', 'B', 'E', 'F', 'G', 'H'], trying: ['G', 'H'], ok: true, chunk: 2, note: 'E and F cannot go together (E is needed), but G and H can: removed.' },
  { kept: ['A', 'B', 'E', 'F'], trying: ['A'], ok: true, chunk: 1, note: 'No more pairs can go, so try single lines. A can go.' },
  { kept: ['B', 'E', 'F'], trying: ['F'], ok: true, chunk: 1, note: 'B and E are each needed; F can go.' },
  { kept: ['B', 'E'], trying: [], ok: null, chunk: 1, note: 'No single line can be removed: the result is 1-minimal. Two lines instead of eight, and still failing, which is what you hand to whoever fixes the bug.' },
];

export default function ReduceSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Shrinking a failing program" steps={s} note={st.note}>
      <Svg w={400} h={150} title="Eight lines of a failing program; chunks are removed while the failure stays">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>PROGRAM (chunk size {st.chunk})</T>
        {LINES.map((l, k) => {
          const kept = st.kept.includes(l);
          const trying = st.trying.includes(l);
          const c = trying ? (st.ok ? 'safe' : 'danger') : 'brand';
          return (
            <Box key={l} x={8 + k * 48} y={28} w={42} h={42} fill={kept ? tok(c, trying ? 0.2 : 0.08) : 'transparent'} stroke={kept ? tok(c) : tok('line')} dash={!kept}>
              <T x={29 + k * 48} y={49} size={15} mono weight={700} anchor="middle" fill={kept ? undefined : tok('muted')} opacity={kept ? 1 : 0.4}>{l}</T>
            </Box>
          );
        })}
        <T x={8} y={96} size={12} fill={tok('muted')}>{st.kept.length} lines kept</T>
        {st.ok !== null && (
          <T x={392} y={96} size={12} weight={700} anchor="end" fill={tok(st.ok ? 'safe' : 'danger')}>
            {st.ok ? 'still fails: remove' : 'stops failing: keep'}
          </T>
        )}
        <T x={8} y={130} size={11} fill={tok('muted')}>Green: removed for good. Red: needed, put back.</T>
      </Svg>
    </StepFrame>
  );
}
