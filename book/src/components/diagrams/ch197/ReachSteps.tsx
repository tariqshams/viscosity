// Chapter 197: reaching definitions on the loop from "Fixpoints and
// worklists", solved in rounds (every block in order, until a round
// changes nothing). OUT = gen ∪ (IN − kill); IN = union of preds' OUT.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';
import { BackEdge, CfgBlock, CfgEdge, Chip, type Block } from '../ch195/kit';

const B: Block[] = [
  { id: 'b0', x: 140, y: 32, lines: ['d1: i = 0', 'd2: x = 0'], w: 112 },
  { id: 'b1', x: 140, y: 104, lines: ['if i < 3'], w: 112 },
  { id: 'b2', x: 270, y: 184, lines: ['d3: y = i * 2', 'd4: x = x + y', 'd5: i = i + 1'], w: 128 },
  { id: 'b3', x: 72, y: 178, lines: ['print x', 'print y'], w: 92 },
];
const at = (id: string) => B.find((b) => b.id === id)!;
const EDGES: [string, string][] = [['b0', 'b1'], ['b1', 'b2'], ['b1', 'b3']];

type Row = [string, string];
type St = { rows: Record<string, Row>; round: number; hot?: string; from?: string[]; changed?: boolean; note: string };
const E = '∅';
const ALL = 'd1 d2 d3 d4 d5';
const R0: Record<string, Row> = { b0: ['', E], b1: ['', E], b2: ['', E], b3: ['', E] };
const A1 = { ...R0, b0: [E, 'd1 d2'] as Row };
const A2 = { ...A1, b1: ['d1 d2', 'd1 d2'] as Row };
const A3 = { ...A2, b2: ['d1 d2', 'd3 d4 d5'] as Row };
const A4 = { ...A3, b3: ['d1 d2', 'd1 d2'] as Row };
const C2 = { ...A4, b1: [ALL, ALL] as Row };
const C3 = { ...C2, b2: [ALL, 'd3 d4 d5'] as Row };
const C4 = { ...C3, b3: [ALL, ALL] as Row };

const STATES: St[] = [
  { rows: R0, round: 0, note: 'Five definitions, d1 to d5. b0 generates d1 and d2 and kills d4 and d5 (the other definitions of i and x); b2 generates d3, d4, d5 and kills d1, d2. This is a MAY question, so the meet is union and every OUT starts at ∅, the fact union leaves alone.' },
  { rows: A1, round: 1, hot: 'b0', changed: true, note: 'Round 1, b0. Nothing reaches the entry, so IN = ∅, and OUT = gen ∪ (IN − kill) = {d1, d2}.' },
  { rows: A2, round: 1, hot: 'b1', from: ['b0', 'b2'], changed: true, note: 'b1 joins b0 and the back edge from b2: {d1, d2} ∪ ∅ (b2 has not been computed yet). b1 defines nothing, so OUT = IN.' },
  { rows: A3, round: 1, hot: 'b2', from: ['b1'], changed: true, note: 'b2: IN = {d1, d2}. Its kill set removes both (b2 assigns x and i again), and its gen set adds d3, d4, d5. OUT[b2] = {d3, d4, d5}.' },
  { rows: A4, round: 1, hot: 'b3', from: ['b1'], changed: true, note: 'b3: IN = OUT[b1] = {d1, d2}. Something changed this round, so we must go round again.' },
  { rows: C2, round: 2, hot: 'b1', from: ['b0', 'b2'], changed: true, note: 'Round 2, b1. Now the back edge brings b2’s real OUT: {d1, d2} ∪ {d3, d4, d5} is all five. Both x = 0 (d2) and x = x + y (d4) can reach the loop test.' },
  { rows: C3, round: 2, hot: 'b2', from: ['b1'], note: 'b2: IN is all five, but kill removes d1 and d2 and gen adds d3, d4, d5, so OUT is {d3, d4, d5} again: unchanged.' },
  { rows: C4, round: 2, hot: 'b3', from: ['b1'], changed: true, note: 'b3 now sees all five. Round 3 (not shown) changes nothing, so this is the fixpoint.' },
  { rows: C4, round: 2, hot: 'b3', note: 'Read the answer at print x: d2 or d4 may have set x, so x is not one known constant. For i, d1 and d5 both reach b1: exactly where SSA puts a phi for i.' },
];

const TX = [24, 150, 296];
export default function ReachSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const hi = (id: string) => st.hot === id;
  return (
    <StepFrame title="Reaching definitions, round by round" steps={s} note={st.note}>
      <div className="mb-1 text-xs font-semibold text-muted">{st.round === 0 ? 'before round 1' : `round ${st.round}`}</div>
      <Svg w={400} h={346} title="The loop CFG with definitions d1 to d5, and a table of the definitions reaching the start (IN) and end (OUT) of each block. At the fixpoint, all five reach b1 and b3, and b2’s OUT is d3, d4, d5.">
        {EDGES.map(([a, b]) => {
          const on = hi(b) && st.from?.includes(a);
          return <CfgEdge key={a + b} a={at(a)} b={at(b)} color={on ? tok('brand') : undefined} width={on ? 3 : 2} />;
        })}
        <BackEdge a={at('b2')} b={at('b1')} out={26}
          color={hi('b1') && st.from?.includes('b2') ? tok('brand') : undefined}
          width={hi('b1') && st.from?.includes('b2') ? 3 : 2} />
        {B.map((b) => (
          <CfgBlock key={b.id} b={b}
            fill={hi(b.id) ? tok('brand', 0.18) : st.from?.includes(b.id) ? tok('accent', 0.12) : undefined}
            stroke={hi(b.id) ? tok('brand') : st.from?.includes(b.id) ? tok('accent') : undefined} />
        ))}
        <T x={TX[0]} y={240} size={11} weight={700} fill={tok('muted')}>BLOCK</T>
        <T x={TX[1]} y={240} size={11} weight={700} fill={tok('muted')} anchor="middle">IN</T>
        <T x={TX[2]} y={240} size={11} weight={700} fill={tok('muted')} anchor="middle">OUT</T>
        {B.map((b, k) => {
          const y = 262 + k * 22;
          const [i, o] = st.rows[b.id];
          const h = hi(b.id);
          return (
            <g key={b.id}>
              <T x={TX[0]} y={y} size={12} mono weight={h ? 700 : 400}>{b.id}</T>
              {i && <Chip x={TX[1]} y={y} w={130} text={i} />}
              <Chip x={TX[2]} y={y} w={130} text={o} bold={h && st.changed}
                fill={h ? tok('brand', 0.14) : undefined} stroke={h ? tok('brand') : undefined} />
            </g>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
