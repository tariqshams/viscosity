// The subset construction on the "if or a name" NFA (alphabet i, f, x,
// where x stands for every other letter): each DFA state is a set of NFA
// states, discovered one transition at a time.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';
import { Fsm, type Ed, type St } from './Fsm';

const STS: St[] = [
  { id: '0', x: 34, y: 66 },
  { id: '1', x: 104, y: 34 },
  { id: '2', x: 184, y: 34 },
  { id: '3', x: 264, y: 34, accept: true },
  { id: '4', x: 104, y: 100 },
  { id: '5', x: 210, y: 100, accept: true },
];
const EDS: Ed[] = [
  { from: '0', to: '1', label: 'ε' },
  { from: '0', to: '4', label: 'ε' },
  { from: '1', to: '2', label: 'i' },
  { from: '2', to: '3', label: 'f' },
  { from: '4', to: '5', label: 'i,f,x' },
  { from: '5', to: '5', label: 'i,f,x', loop: 'down', dx: 42, dy: -16 },
];

type Row = [string, string, string, string, string];
type S = { rows: Row[]; lit: string[]; at?: [number, number]; acc?: boolean; note: string };
const A: Row = ['A', '{0,1,4}', '', '', ''];
const r = (rows: Row[], k: number, col: number, v: string): Row[] => rows.map((x, j) => (j === k ? (x.map((c, i) => (i === col ? v : c)) as Row) : x));

const s0: Row[] = [A];
const s1 = [...r(s0, 0, 2, 'B'), ['B', '{2,5}', '', '', ''] as Row];
const s2 = [...r(s1, 0, 3, 'C'), ['C', '{5}', '', '', ''] as Row];
const s3 = r(s2, 0, 4, 'C');
const s4 = r(s3, 1, 2, 'C');
const s5 = [...r(s4, 1, 3, 'D'), ['D', '{3,5}', '', '', ''] as Row];
const s6 = r(s5, 1, 4, 'C');
const s7 = r(r(r(s6, 2, 2, 'C'), 2, 3, 'C'), 2, 4, 'C');
const s8 = r(r(r(s7, 3, 2, 'C'), 3, 3, 'C'), 3, 4, 'C');

const STATES: S[] = [
  { rows: s0, lit: ['0', '1', '4'], note: 'Start with the ε-closure of the NFA’s start state: {0, 1, 4}. That whole set becomes ONE state of the DFA; call it A.' },
  { rows: s1, lit: ['2', '5'], at: [0, 2], note: 'From A, read i: 1 goes to 2 and 4 goes to 5, and the closure adds nothing. {2, 5} is a set we have not seen, so it becomes a new DFA state, B.' },
  { rows: s2, lit: ['5'], at: [0, 3], note: 'From A, read f: only 4 has an arrow for f, to 5. {5} is new: C.' },
  { rows: s3, lit: ['5'], at: [0, 4], note: 'From A, read x: again {5}. That set already has a name, C, so we only draw the arrow; no new state.' },
  { rows: s4, lit: ['5'], at: [1, 2], note: 'Now B = {2, 5}. Read i: 2 has no i arrow, 5 loops: {5}, which is C.' },
  { rows: s5, lit: ['3', '5'], at: [1, 3], note: 'B on f: 2 goes to 3 and 5 loops to 5. {3, 5} is new: D. This is the state for “just read if”.' },
  { rows: s6, lit: ['5'], at: [1, 4], note: 'B on x: {5}, which is C.' },
  { rows: s7, lit: ['5'], at: [2, 2], note: 'C = {5} on i, f or x: always {5}, back to C. C means “a name that can no longer be the keyword”.' },
  { rows: s8, lit: ['5'], at: [3, 2], note: 'D = {3, 5}: state 3 has no arrows, 5 loops, so every letter leads to {5}, C. No unfinished rows are left.' },
  { rows: s8, lit: [], acc: true, note: 'Done: four DFA states. A DFA state accepts if its set holds an accepting NFA state, so B, C and D accept; D holds both 3 (keyword) and 5 (name).' },
];

const COLS = [26, 92, 170, 220, 270, 330];

export default function SubsetSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="The subset construction" steps={s} note={st.note}>
      <Svg w={400} h={292} title="An NFA for if or a name, and the table of DFA states being built from sets of its states">
        <Fsm states={STS} edges={EDS} start="0" on={st.lit} />
        <T x={300} y={34} size={10} fill={tok('muted')}>keyword if</T>
        <T x={236} y={100} size={10} fill={tok('muted')}>name</T>
        <g transform="translate(0,160)">
          {['DFA', 'NFA set', 'i', 'f', 'x', 'accepts'].map((h, k) => (
            <T key={h} x={COLS[k]} y={0} size={11} weight={700} anchor="middle" fill={tok('muted')}>{h}</T>
          ))}
          {st.rows.map((row, k) => {
            const y = 22 + k * 24;
            const acc = /[35]/.test(row[1]);
            return (
              <g key={row[0]}>
                {st.at && st.at[0] === k && <rect x={6} y={y - 10} width={300} height={20} rx={3} fill={tok('brand', 0.1)} />}
                {row.map((c, j) => (
                  <T key={j} x={COLS[j]} y={y} size={12} mono anchor="middle"
                    weight={st.at && st.at[0] === k && st.at[1] === j ? 700 : j === 0 ? 700 : 400}
                    fill={st.at && st.at[0] === k && st.at[1] === j ? tok('brand') : undefined}>{c}</T>
                ))}
                {st.acc && <T x={COLS[5]} y={y} size={12} anchor="middle" weight={700} fill={acc ? tok('safe') : tok('muted')}>{acc ? 'yes' : 'no'}</T>}
              </g>
            );
          })}
        </g>
      </Svg>
    </StepFrame>
  );
}
