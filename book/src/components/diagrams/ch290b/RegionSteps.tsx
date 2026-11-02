import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 290-b: region inference as a fixpoint. Each reference's region
// starts as the points where it is live; each copy adds an outlives
// constraint, and the sets grow until nothing changes.
const CODE = `let x = new
let a = &x
let b = a
let c = b
x = new
use c`;

type S = { line: number | null; a: number[]; b: number[]; c: number[]; hot?: 'a' | 'b'; note: string };

const STATES: S[] = [
  { line: null, a: [3], b: [4], c: [5, 6], note: 'Liveness first. a is used on line 3 (copied into b), so it is live at 3; b is live at 4; c is used on line 6, so it is live at 5 and 6. These are the starting regions.' },
  { line: 2, a: [3, 4], b: [4], c: [5, 6], hot: 'a', note: 'Constraint 1, from line 3 (let b = a): a must cover every point of b from line 3 on. b holds 4, so a grows to {3, 4}.' },
  { line: 3, a: [3, 4], b: [4, 5, 6], c: [5, 6], hot: 'b', note: 'Constraint 2, from line 4 (let c = b): b must cover c from line 4 on, so b grows to {4, 5, 6}. Something changed, so we go round again.' },
  { line: 2, a: [3, 4, 5, 6], b: [4, 5, 6], c: [5, 6], hot: 'a', note: 'Second pass, constraint 1: b has grown, so a grows again, to {3, 4, 5, 6}. A single pass would have missed this.' },
  { line: 3, a: [3, 4, 5, 6], b: [4, 5, 6], c: [5, 6], note: 'Constraint 2 adds nothing new, and a third pass would change nothing: this is the fixpoint, the smallest regions that satisfy every constraint.' },
  { line: 4, a: [3, 4, 5, 6], b: [4, 5, 6], c: [5, 6], hot: 'a', note: 'Now the check. The loan made on line 2 belongs to a, and a\'s region holds line 5, so x = new meets a live loan: E0506, exactly as rustc reports for the same program.' },
];

const ROWS: ('a' | 'b' | 'c')[] = ['a', 'b', 'c'];

export default function RegionSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const x0 = 60;
  const cw = 54;
  return (
    <StepFrame title="Solving region constraints to a fixpoint" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={140} title="A grid of three regions, a, b and c, over program points 1 to 6; filled cells are the points in each region">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>REGIONS (points where each loan must hold)</T>
        {[1, 2, 3, 4, 5, 6].map((p) => (
          <T key={p} x={x0 + (p - 1) * cw + cw / 2} y={30} size={11} mono anchor="middle" fill={tok('muted')}>{p}</T>
        ))}
        {ROWS.map((r, i) => {
          const y = 40 + i * 32;
          const pts = st[r];
          return (
            <g key={r}>
              <T x={16} y={y + 13} size={13} mono weight={st.hot === r ? 700 : 400}>{r}</T>
              {[1, 2, 3, 4, 5, 6].map((p) => {
                const on = pts.includes(p);
                const danger = on && r === 'a' && p === 5 && s.i === STATES.length - 1;
                return (
                  <Box key={p} x={x0 + (p - 1) * cw + 3} y={y} w={cw - 6} h={26} fill={danger ? tok('danger', 0.25) : on ? tok('f2', 0.2) : 'transparent'} stroke={danger ? tok('danger') : on ? tok('f2') : tok('line')} dash={!on} />
                );
              })}
            </g>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
