// Chapter 189: computing dominator sets iteratively over the real VIR CFG
// of the Collatz loop (chapter 187), visiting blocks in reverse postorder
// 0 1 4 2 6 5 7 3, as Viscosity's dominators() does.
//   Dom(entry) = {entry}
//   Dom(b) = {b} ∪ (intersection of Dom(p) over b's predecessors)
import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';
import { BLOCKS, BlockBox, Edge, SUCC } from '../ch187/collatz';

const ALL = 'all';
type Sets = Record<number, string>;
const INIT: Sets = { 0: '{0}', 1: ALL, 2: ALL, 3: ALL, 4: ALL, 5: ALL, 6: ALL, 7: ALL };
const with_ = (s: Sets, b: number, v: string): Sets => ({ ...s, [b]: v });
const S1 = with_(INIT, 1, '{0,1}');
const S4 = with_(S1, 4, '{0,1,4}');
const S2 = with_(S4, 2, '{0,1,2}');
const S6 = with_(with_(S2, 6, '{0,1,2,6}'), 5, '{0,1,2,5}');
const S7 = with_(S6, 7, '{0,1,2,7}');
const S3 = with_(S7, 3, '{0,1,2,3,7}');

type St = { sets: Sets; hot?: number[]; from?: number[]; pass: number; note: string };

const STATES: St[] = [
  { sets: INIT, pass: 0, note: 'Start optimistic. The entry is dominated only by itself. Every other block starts with “all blocks”, and each pass can only remove blocks from a set, never add them.' },
  { sets: S1, hot: [1], from: [0, 3], pass: 1, note: 'Pass 1, b1. Its predecessors are b0 ({0}) and b3 (still “all”). The intersection is {0}; add b1 itself: {0,1}. The back edge from b3 didn’t get in the way, because “all” intersects to nothing new.' },
  { sets: S4, hot: [4], from: [1], pass: 1, note: 'b4 has one predecessor, b1. One predecessor means: everything that dominates it, plus b4 itself. {0,1,4}.' },
  { sets: S2, hot: [2], from: [1], pass: 1, note: 'b2, the parity test, also hangs off b1 alone: {0,1,2}.' },
  { sets: S6, hot: [6, 5], from: [2], pass: 1, note: 'b6 and b5 each have the single predecessor b2: {0,1,2,6} and {0,1,2,5}.' },
  { sets: S7, hot: [7], from: [5, 6], pass: 1, note: 'b7, the join, is the interesting one. Its predecessors are b5 {0,1,2,5} and b6 {0,1,2,6}. The intersection drops 5 and 6: you can reach b7 without passing b5, and without passing b6. {0,1,2,7}.' },
  { sets: S3, hot: [3], from: [7], pass: 1, note: 'b3 follows b7: {0,1,2,3,7}. Pass 1 changed something, so the algorithm must go round again.' },
  { sets: S3, pass: 2, note: 'Pass 2 recomputes every block, b1 now with b3’s real set. {0} ∩ {0,1,2,3,7} is still {0}. Nothing changes anywhere, so the sets are final. Visiting the blocks in the opposite order would have needed six passes: five that change something, then one to confirm.' },
  { sets: S3, hot: [7], pass: 2, note: 'Read the answer: Dom(b7) = {0,1,2,7}. To reach the join you must have gone through the entry, the loop test and the parity test, whichever branch you took.' },
];

export default function DomSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Dominator sets, until nothing changes" steps={s} note={st.note}>
      <div className="mb-1 text-xs font-semibold text-muted">{st.pass === 0 ? 'initial sets' : `pass ${st.pass}`}</div>
      <Svg w={400} h={360} title="The Collatz CFG with each block’s dominator set: b0 {0}, b1 {0,1}, b4 {0,1,4}, b2 {0,1,2}, b5 {0,1,2,5}, b6 {0,1,2,6}, b7 {0,1,2,7}, b3 {0,1,2,3,7}.">
        {Object.entries(SUCC).flatMap(([f, ts]) => ts.map((t) => {
          const on = st.hot?.includes(t) && st.from?.includes(Number(f));
          return <Edge key={`${f}-${t}`} from={Number(f)} to={t} color={on ? tok('brand') : undefined} width={on ? 3 : 2} />;
        }))}
        {BLOCKS.map((b) => {
          const hot = st.hot?.includes(b.id);
          const from = st.from?.includes(b.id);
          return (
            <BlockBox key={b.id} id={b.id} sub={st.sets[b.id]}
              fill={hot ? tok('brand', 0.22) : from ? tok('accent', 0.14) : undefined}
              stroke={hot ? tok('brand') : from ? tok('accent') : undefined} />
          );
        })}
        <T x={392} y={300} size={11} anchor="end" fill={tok('muted')}>orange: updated · blue: its predecessors</T>
      </Svg>
    </StepFrame>
  );
}
