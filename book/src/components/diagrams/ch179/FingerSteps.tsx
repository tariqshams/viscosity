// Viscosity's dominators() on the Collatz CFG: blocks are visited in reverse
// postorder 0 1 4 2 6 5 7 3, each block's idom is the intersect() of its
// processed predecessors, and intersect() walks two fingers up the tree
// built so far, always moving the finger that is later in the order.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const POS: Record<number, [number, number]> = {
  0: [200, 30], 1: [200, 94], 2: [140, 158], 4: [290, 158],
  5: [60, 222], 6: [140, 222], 7: [220, 222], 3: [220, 286],
};
const RPO = [0, 1, 4, 2, 6, 5, 7, 3];
const IDX: Record<number, number> = Object.fromEntries(RPO.map((b, i) => [b, i]));

type St = { tree: [number, number][]; a?: number; b?: number; hot?: number; note: string };
const T1: [number, number][] = [[1, 0]];
const T2: [number, number][] = [...T1, [4, 1], [2, 1]];
const T3: [number, number][] = [...T2, [6, 2], [5, 2]];
const T4: [number, number][] = [...T3, [7, 2]];
const T5: [number, number][] = [...T4, [3, 7]];

const STATES: St[] = [
  { tree: [], hot: 0, note: 'Each block is labelled with its position in reverse postorder (#0 to #7). The entry is its own idom; no other block has one yet.' },
  { tree: T1, hot: 1, note: 'b1 has predecessors b0 and b3. Only b0 has an idom so far, so b3 is skipped for now, and idom(b1) = b0.' },
  { tree: T2, hot: 2, note: 'b4 and b2 each have one predecessor, b1, so b1 is the idom of both. With one predecessor there is nothing to intersect.' },
  { tree: T3, hot: 5, note: 'b6 and b5 hang off b2 the same way.' },
  { tree: T3, hot: 7, a: 6, b: 5, note: 'b7 has two predecessors, b6 and b5. Put a finger on each and ask where they meet. b5 is later in the order (#5 against #4), so its finger moves up.' },
  { tree: T3, hot: 7, a: 6, b: 2, note: 'That finger moves to idom(b5) = b2, at #3. Now b6 (#4) is the later one, so the other finger moves up.' },
  { tree: T4, hot: 7, a: 2, b: 2, note: 'idom(b6) = b2: the fingers meet at b2, the nearest block that dominates both branches. So idom(b7) = b2.' },
  { tree: T5, hot: 3, note: 'b3’s one predecessor is b7, so idom(b3) = b7. Pass 1 is done, and every block has a parent.' },
  { tree: T5, hot: 1, a: 3, b: 0, note: 'Pass 2. b1 can now use both predecessors. The finger on b3 (#7) climbs b7, b2, b1 and reaches b0, where the other finger waits. idom(b1) is still b0: nothing changed, so the tree is final.' },
];

export default function FingerSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Two fingers find the nearest common dominator" steps={s} note={st.note}>
      <Svg w={400} h={316} title="The dominator tree of the Collatz CFG being built in reverse postorder, with two fingers meeting at the nearest common dominator.">
        {st.tree.map(([b, d]) => {
          const [x1, y1] = POS[d], [x2, y2] = POS[b];
          return <Arrow key={b} x1={x1} y1={y1 + 15} x2={x2} y2={y2 - 15} color={tok('accent')} />;
        })}
        {Object.entries(POS).map(([k, [x, y]]) => {
          const b = Number(k);
          const fa = st.a === b, fb = st.b === b;
          const hot = st.hot === b;
          return (
            <g key={k}>
              <Box x={x - 30} y={y - 15} w={60} h={30} r={15}
                fill={fa || fb ? tok('brand', 0.25) : hot ? tok('accent', 0.18) : tok('panel')}
                stroke={fa || fb ? tok('brand') : hot ? tok('accent') : tok('line')}>
                <T x={x - 6} y={y} size={13} weight={700} anchor="middle">{`b${b}`}</T>
                <T x={x + 16} y={y} size={11} anchor="middle" fill={tok('muted')}>{`#${IDX[b]}`}</T>
              </Box>
              {(fa || fb) && <T x={x} y={y - 22} size={11} weight={700} anchor="middle" fill={tok('brand')}>{fa && fb ? 'both meet' : 'finger'}</T>}
            </g>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
