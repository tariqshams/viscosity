// Chapter 94b: Andersen's inclusion-based analysis, one statement at a
// time. The statements are deliberately out of order (the analysis ignores
// order), so one pass is not enough and the rounds repeat until nothing
// grows. Copy edges are drawn as arrows from source to destination.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `d = c;
c = a;
a = {};   // site o1
c = b;
b = {};   // site o2`;

type V = 'a' | 'b' | 'c' | 'd';
type S = { line: number | null; round: number; pts: Record<V, string[]>; grew?: V; edges: string[]; note: string };

const E0 = { a: [], b: [], c: [], d: [] } as Record<V, string[]>;
const R1 = { a: ['o1'], b: ['o2'], c: [], d: [] } as Record<V, string[]>;
const R2a = { a: ['o1'], b: ['o2'], c: ['o1'], d: [] } as Record<V, string[]>;
const R2b = { a: ['o1'], b: ['o2'], c: ['o1', 'o2'], d: [] } as Record<V, string[]>;
const R3 = { a: ['o1'], b: ['o2'], c: ['o1', 'o2'], d: ['o1', 'o2'] } as Record<V, string[]>;
const ALL = ['cd', 'ac', 'bc'];

const STATES: S[] = [
  { line: null, round: 0, pts: E0, edges: ALL, note: 'Five statements, in a scrambled order. Each variable gets a set, empty to begin with. Each copy x = y becomes an arrow y → x meaning “everything y may point at, x may point at too”.' },
  { line: 0, round: 1, pts: E0, edges: ALL, note: 'Round 1. d = c: copy c’s set into d’s. But c’s set is still empty, so nothing happens yet.' },
  { line: 1, round: 1, pts: E0, edges: ALL, note: 'c = a: a’s set is empty too. Nothing grows.' },
  { line: 2, round: 1, pts: { ...E0, a: ['o1'] }, grew: 'a', edges: ALL, note: 'a = {} creates an object at site o1, so o1 goes into a’s set. This is the only kind of statement that adds a brand-new object.' },
  { line: 3, round: 1, pts: { ...E0, a: ['o1'] }, edges: ALL, note: 'c = b: b’s set is empty, so nothing grows.' },
  { line: 4, round: 1, pts: R1, grew: 'b', edges: ALL, note: 'b = {} puts o2 into b’s set. End of round 1: two sets grew, so we must go round again.' },
  { line: 1, round: 2, pts: R2a, grew: 'c', edges: ALL, note: 'Round 2. d = c still copies nothing (c is empty at that moment), then c = a copies o1 along the arrow a → c.' },
  { line: 3, round: 2, pts: R2b, grew: 'c', edges: ALL, note: 'c = b copies o2 along b → c. Now c may point at either object, which is exactly right: c holds a on one path through the real program and b on another.' },
  { line: 0, round: 3, pts: R3, grew: 'd', edges: ALL, note: 'Round 3. d = c now has something to copy: d gets o1 and o2. The rest of the round adds nothing.' },
  { line: null, round: 4, pts: R3, edges: ALL, note: 'Round 4 changes nothing: a fixpoint. Read off the answers: a and b never alias (their sets share nothing); c and d may alias a, b and each other.' },
];

const POS: Record<V, [number, number]> = { a: [60, 40], b: [60, 130], c: [200, 85], d: [330, 85] };

export default function AndersenSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Andersen: sets that only grow" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={180} title="Variables a, b, c and d with their points-to sets; arrows a to c, b to c and c to d show where sets flow">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>{st.round ? `ROUND ${st.round}` : 'BEFORE'}</T>
        <Arrow x1={98} y1={48} x2={160} y2={78} color={tok('ink', 0.5)} />
        <Arrow x1={98} y1={124} x2={160} y2={94} color={tok('ink', 0.5)} />
        <Arrow x1={240} y1={86} x2={290} y2={86} color={tok('ink', 0.5)} />
        {(Object.keys(POS) as V[]).map((v) => {
          const [x, y] = POS[v];
          const grew = st.grew === v;
          return (
            <Box key={v} x={x - 40} y={y - 22} w={80} h={44} fill={grew ? tok('brand', 0.14) : tok('panel')} stroke={grew ? tok('brand') : tok('line')}>
              <T x={x} y={y - 9} size={13} mono weight={700} anchor="middle">{v}</T>
              <T x={x} y={y + 10} size={12} mono anchor="middle" fill={st.pts[v].length ? tok('ink') : tok('muted')}>
                {'{' + st.pts[v].join(', ') + '}'}
              </T>
            </Box>
          );
        })}
        <T x={200} y={170} size={11} anchor="middle" fill={tok('muted')}>arrow y → x: x’s set includes y’s set</T>
      </Svg>
    </StepFrame>
  );
}
