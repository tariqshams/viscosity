// Chapter 221: naive against semi-naive evaluation of the two path rules
// on a chain of five nodes. Both reach the same ten Path facts in the same
// rounds; semi-naive only joins with the facts that are new, so it makes
// each derivation once. Counts from running both (scratch script, n = 5).
import { Box, Svg, T, tok } from '../../viz/svg';
import { StepFrame, useSteps } from '../../viz/stepper';

const ROWS = [
  ['1>2', '2>3', '3>4', '4>5'],
  ['1>3', '2>4', '3>5'],
  ['1>4', '2>5'],
  ['1>5'],
];

type S = { round: number; naive: number; naiveTotal: number; semi: number; semiTotal: number; note: string };

const STATES: S[] = [
  { round: 0, naive: 0, naiveTotal: 0, semi: 0, semiTotal: 0, note: 'Facts Edge(1, 2), Edge(2, 3), Edge(3, 4), Edge(4, 5), and the rules Path(x, y) :- Edge(x, y) and Path(x, z) :- Edge(x, y), Path(y, z). Both strategies will find the same ten Path facts; the question is how many rule matches each one makes on the way.' },
  { round: 1, naive: 4, naiveTotal: 4, semi: 4, semiTotal: 4, note: 'Round 1. Every input fact is new, so both strategies match the first rule against the four edges and derive the four one-step paths (outlined in orange). The second rule finds no Path facts yet.' },
  { round: 2, naive: 7, naiveTotal: 11, semi: 3, semiTotal: 7, note: 'Round 2. Naive evaluation matches everything again: the four edges once more, plus every edge against every known path, 7 matches for 3 new facts. Semi-naive joins the edges only with the 4 paths that were new last round: 3 matches, each giving a new two-step path.' },
  { round: 3, naive: 9, naiveTotal: 20, semi: 2, semiTotal: 9, note: 'Round 3. Naive re-derives all seven old facts and finds 2 new ones; semi-naive uses only the 3 paths new in round 2, and makes exactly the 2 matches that matter.' },
  { round: 4, naive: 10, naiveTotal: 30, semi: 1, semiTotal: 10, note: 'Round 4. One new fact, Path(1, 5). Naive needed 10 matches to find it; semi-naive needed 1.' },
  { round: 5, naive: 10, naiveTotal: 40, semi: 0, semiTotal: 10, note: 'Round 5. Nothing was new last round, so semi-naive has nothing to join and stops at once; naive makes 10 more matches to learn that nothing changed. Totals: 40 matches against 10, and on a chain of 100 nodes, 333,300 against 4,950.' },
];

export default function SemiNaiveSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Naive and semi-naive rounds on a chain" steps={s} note={st.note}>
      <Svg w={420} h={236} title="Path facts by length, those derived in this round outlined; below, how many rule matches naive and semi-naive evaluation made this round and in total">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>{st.round ? `ROUND ${st.round}` : 'START'}</T>
        <T x={412} y={12} size={11} weight={700} anchor="end" fill={tok('muted')}>Path FACTS, BY LENGTH</T>
        {ROWS.map((row, r) => row.map((f, k) => {
          const known = r + 1 <= st.round;
          const fresh = r + 1 === st.round;
          const x = 8 + k * 102;
          const y = 26 + r * 34;
          return (
            <Box key={f} x={x} y={y} w={94} h={26} fill={fresh ? tok('brand', 0.14) : tok('panel')} stroke={fresh ? tok('brand') : tok('line')} opacity={known ? 1 : 0.3}>
              <T x={x + 47} y={y + 13} size={12} mono anchor="middle">Path({f.replace('>', ', ')})</T>
            </Box>
          );
        }))}
        <T x={8} y={178} size={12} weight={700}>naive</T>
        <T x={110} y={178} size={12} mono>{st.naive} this round, {st.naiveTotal} in all</T>
        <T x={8} y={202} size={12} weight={700} fill={tok('accent')}>semi-naive</T>
        <T x={110} y={202} size={12} mono fill={tok('accent')}>{st.semi} this round, {st.semiTotal} in all</T>
        {st.round === 5 && <T x={210} y={226} size={12} weight={700} anchor="middle" fill={tok('safe')}>nothing new: fixpoint</T>}
      </Svg>
    </StepFrame>
  );
}
