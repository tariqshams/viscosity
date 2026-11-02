// Chapter 104: the CFG Viscosity builds for the Collatz loop (static).
import { Svg, tok } from '../../viz/svg';
import { BLOCKS, BlockBox, Edge, SUCC } from './collatz';

export default function CollatzCfg() {
  return (
    <Svg w={400} h={360} title="The control-flow graph of g: b0 to b1; b1 to b2 and b4; b2 to b5 and b6; b5 and b6 to b7; b7 to b3; b3 back to b1. b4 returns.">
      {Object.entries(SUCC).flatMap(([f, ts]) => ts.map((t) => (
        <Edge key={`${f}-${t}`} from={Number(f)} to={t} color={Number(f) === 3 ? tok('brand') : undefined} />
      )))}
      {BLOCKS.map((b) => <BlockBox key={b.id} id={b.id} />)}
    </Svg>
  );
}
