// The dominance frontier of b2 in the Collatz CFG. b2 dominates b2, b5, b6,
// b7 and b3 (shaded); the edge b3 → b1 leaves that region and lands on a
// block b2 does not strictly dominate, so DF(b2) = {b1}.
import { Svg, T, tok } from '../../viz/svg';
import { BLOCKS, BlockBox, Edge, SUCC } from '../ch187/collatz';

const REGION = new Set([2, 5, 6, 7, 3]);

export default function Frontier() {
  return (
    <Svg w={400} h={370} title="The Collatz CFG with the blocks b2 dominates shaded (b2, b5, b6, b7, b3). The back edge from b3 to b1 is highlighted; b1 is outlined as b2's dominance frontier.">
      {Object.entries(SUCC).flatMap(([f, ts]) => ts.map((t) => {
        const out = Number(f) === 3 && t === 1;
        return <Edge key={`${f}-${t}`} from={Number(f)} to={t} color={out ? tok('brand') : undefined} width={out ? 3 : 2} />;
      }))}
      {BLOCKS.map((b) => (
        <BlockBox key={b.id} id={b.id}
          fill={REGION.has(b.id) ? tok('accent', 0.16) : b.id === 1 ? tok('brand', 0.2) : undefined}
          stroke={REGION.has(b.id) ? tok('accent') : b.id === 1 ? tok('brand') : undefined} />
      ))}
      <T x={290} y={226} size={11} fill={tok('accent')}>shaded: the blocks</T>
      <T x={290} y={242} size={11} fill={tok('accent')}>b2 dominates</T>
      <T x={290} y={82} size={11} fill={tok('brand')}>DF(b2) = {'{'}b1{'}'}:</T>
      <T x={290} y={98} size={11} fill={tok('brand')}>the first block</T>
      <T x={290} y={114} size={11} fill={tok('brand')}>outside the region</T>
    </Svg>
  );
}
