// Chapter 165: placing phis for the variable n of the Collatz loop with
// the worklist of Cytron et al.: start from the blocks that assign n, put a
// phi in each block of their dominance frontiers, and treat every new phi
// as one more assignment. The phis land in b7 and b1, exactly where VIR has
// %12 and %1.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';
import { BLOCKS, BlockBox, Edge, SUCC } from '../ch159/collatz';

const DF: Record<number, number[]> = { 0: [], 1: [1], 2: [1], 3: [1], 4: [], 5: [7], 6: [7], 7: [1] };
const DEFS = [0, 5, 6];
const LABEL: Record<number, string> = { 0: 'n = param', 5: 'n = 3n+1', 6: 'n = n/2' };

type St = { phis: number[]; work: number[]; taken?: number; note: string };

const STATES: St[] = [
  { phis: [], work: [0, 5, 6], note: 'n is assigned in three blocks: b0 (the parameter), b5 and b6. They go on the worklist. The dominance frontiers are the ones from The dominator tree: DF(b5) = DF(b6) = {b7}, DF(b7) = DF(b1) = {b1}.' },
  { phis: [], work: [5, 6], taken: 0, note: 'Take b0. Its frontier is empty: the entry dominates everything, so its value of n can never meet a rival at a join. Nothing to place.' },
  { phis: [7], work: [6, 7], taken: 5, note: 'Take b5. DF(b5) = {b7}, so b7 gets a phi for n. A phi is itself a new assignment of n, so b7 joins the worklist.' },
  { phis: [7], work: [7], taken: 6, note: 'Take b6. DF(b6) = {b7}, which already has its phi. Nothing new.' },
  { phis: [7, 1], work: [1], taken: 7, note: 'Take b7, there because of its phi. DF(b7) = {b1}: b1 gets a phi, and joins the worklist. This is the “iterated” part: a phi can cause another phi.' },
  { phis: [7, 1], work: [], taken: 1, note: 'Take b1. DF(b1) = {b1}, which already has its phi. The worklist is empty, so we are done.' },
  { phis: [7, 1], work: [], note: 'Two phis, in b7 (where the branches meet) and b1 (where the loop’s way in meets the back edge). Viscosity’s VIR for this function has exactly these: %12 in b7 and %1 in b1.' },
];

export default function PlaceSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Placing phis at iterated dominance frontiers" steps={s} note={st.note}>
      <Svg w={400} h={392} title="The Collatz CFG; the blocks assigning n are b0, b5 and b6, and the phis for n end up in b7 and b1.">
        {Object.entries(SUCC).flatMap(([f, ts]) => ts.map((t) => (
          <Edge key={`${f}-${t}`} from={Number(f)} to={t} />
        )))}
        {BLOCKS.map((b) => {
          const phi = st.phis.includes(b.id);
          const def = DEFS.includes(b.id);
          const taken = st.taken === b.id;
          return (
            <BlockBox key={b.id} id={b.id}
              sub={phi ? 'n = φ(…)' : def ? LABEL[b.id] : undefined}
              fill={taken ? tok('brand', 0.3) : phi ? tok('brand', 0.14) : def ? tok('accent', 0.14) : undefined}
              stroke={phi || taken ? tok('brand') : def ? tok('accent') : undefined} />
          );
        })}
        <T x={8} y={376} size={12} mono>{`worklist: [${st.work.map((b) => 'b' + b).join(', ')}]`}</T>
      </Svg>
    </StepFrame>
  );
}
