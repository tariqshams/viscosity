// Chapter 161: one path is enough to rule a block out. On the real VIR CFG
// of the Collatz loop, the path b0 → b1 → b2 → b6 → b7 reaches the join
// without passing b5, so b5 does not dominate b7; b2 is on every path to
// b7, so it does.
import { Svg, T, tok } from '../../viz/svg';
import { BLOCKS, BlockBox, Edge, SUCC } from '../ch159/collatz';

const PATH = new Set(['0-1', '1-2', '2-6', '6-7']);

export default function AvoidingPath() {
  return (
    <Svg w={400} h={370} title="The Collatz CFG with the path b0, b1, b2, b6, b7 highlighted. b5 is faded: the path reaches b7 without it. b2 is outlined: every path to b7 passes through it.">
      {Object.entries(SUCC).flatMap(([f, ts]) => ts.map((t) => {
        const on = PATH.has(`${f}-${t}`);
        return <Edge key={`${f}-${t}`} from={Number(f)} to={t} color={on ? tok('brand') : tok('ink', 0.3)} width={on ? 3 : 1.5} />;
      }))}
      {BLOCKS.map((b) => (
        <BlockBox key={b.id} id={b.id} dim={b.id === 5}
          fill={b.id === 7 ? tok('brand', 0.22) : b.id === 2 ? tok('accent', 0.16) : undefined}
          stroke={b.id === 7 ? tok('brand') : b.id === 2 ? tok('accent') : undefined} />
      ))}
      <T x={300} y={226} size={11} fill={tok('brand')}>this path</T>
      <T x={300} y={242} size={11} fill={tok('brand')}>skips b5, so</T>
      <T x={300} y={258} size={11} fill={tok('brand')}>b5 does not</T>
      <T x={300} y={274} size={11} fill={tok('brand')}>dominate b7</T>
      <T x={240} y={306} size={11} fill={tok('accent')}>b2 is on every path</T>
      <T x={240} y={322} size={11} fill={tok('accent')}>to b7: it dominates it</T>
    </Svg>
  );
}
