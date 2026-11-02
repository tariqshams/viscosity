// Where SLR is too coarse: state 2 of the assignment grammar. FOLLOW(R)
// contains "=", because of *R = ..., so SLR puts a reduction under "="
// beside the shift, although R = can never start a statement.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function SlrFails() {
  return (
    <Svg w={400} h={214} title="State 2 of the assignment grammar: SLR reduces R → L under =, which clashes with the shift on =">
      <Box x={4} y={6} w={170} h={64}>
        <T x={12} y={20} size={12} weight={700} fill={tok('muted')}>state 2 (after an L)</T>
        <T x={14} y={40} size={12} mono>P → L · = R</T>
        <T x={14} y={58} size={12} mono weight={700} fill={tok('brand')}>R → L ·</T>
      </Box>
      {['=', '$'].map((c, k) => {
        const x = 214 + k * 60;
        const bad = k === 0;
        return (
          <g key={c}>
            <T x={x + 24} y={12} size={12} mono anchor="middle" weight={700} fill={tok('muted')}>{c}</T>
            <Box x={x} y={22} w={48} h={40} fill={bad ? tok('danger', 0.14) : tok('panel')} stroke={bad ? tok('danger') : tok('line')}>
              <T x={x + 24} y={bad ? 36 : 42} size={11} mono anchor="middle" weight={bad ? 700 : 400} fill={bad ? tok('danger') : undefined}>{bad ? 's6' : 'r5'}</T>
              {bad && <T x={x + 24} y={50} size={11} mono anchor="middle" weight={700} fill={tok('danger')}>r5</T>}
            </Box>
          </g>
        );
      })}
      <T x={4} y={92} size={12} weight={700}>Why is = in FOLLOW(R)?</T>
      <Box x={4} y={102} w={392} h={50} fill={tok('ink', 0.04)}>
        <T x={14} y={118} size={12} mono>P → L = R  and  L → * R</T>
        <T x={14} y={138} size={12} mono>so in  * R = R  an R is followed by =</T>
      </Box>
      <Arrow x1={200} y1={158} x2={200} y2={174} color={tok('ink', 0.5)} />
      <T x={200} y={188} size={12} anchor="middle">But in state 2 the L is at the start of a statement,</T>
      <T x={200} y={205} size={12} anchor="middle">and no statement starts with R =. The = is not possible here.</T>
    </Svg>
  );
}
