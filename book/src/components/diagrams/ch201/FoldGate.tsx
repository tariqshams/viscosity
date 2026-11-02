// Chapter 201: the four questions a folder asks before it folds an
// instruction. Any "no" means: leave the instruction alone.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const QS = [
  ['Is every operand a constant?', 'a param or a phi: no'],
  ['Does it do nothing but compute?', 'a call or a store: no'],
  ['Can it never throw?', 'xs[9] on a non-array: no'],
  ['Can we get the exact answer?', '-0, NaN, rounding must match'],
];

export default function FoldGate() {
  const H = 46;
  const G = 18;
  const top = 8;
  const end = top + QS.length * (H + G);
  return (
    <Svg w={400} h={end + 44} title="Four questions in a column, each with a yes arrow down to the next and a no arrow to the right saying leave it alone; after the last yes, fold.">
      {QS.map(([q, ex], k) => {
        const y = top + k * (H + G);
        return (
          <g key={k}>
            <Box x={6} y={y} w={262} h={H} fill={tok('panel')} stroke={tok('brand')}>
              <T x={16} y={y + 16} size={13} weight={700}>{`${k + 1}. ${q}`}</T>
              <T x={16} y={y + 34} size={11.5} fill={tok('muted')}>{ex}</T>
            </Box>
            <Arrow x1={268} y1={y + H / 2} x2={312} y2={y + H / 2} color={tok('danger')} />
            <T x={318} y={y + H / 2 - 7} size={12} weight={700} fill={tok('danger')}>no:</T>
            <T x={318} y={y + H / 2 + 9} size={12} fill={tok('danger')}>leave it</T>
            <Arrow x1={60} y1={y + H} x2={60} y2={y + H + G} color={tok('safe')} />
            <T x={68} y={y + H + G / 2} size={11} fill={tok('safe')}>yes</T>
          </g>
        );
      })}
      <Box x={6} y={end} w={262} h={34} fill={tok('safe', 0.14)} stroke={tok('safe')}>
        <T x={16} y={end + 17} size={13} weight={700} fill={tok('safe')}>Fold: replace it with a const</T>
      </Box>
    </Svg>
  );
}
