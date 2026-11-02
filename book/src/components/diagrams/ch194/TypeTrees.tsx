// fn('a, ['a]) -> 'b laid over fn(number, 'c) -> 'c: the two function
// types have the same shape at the top, so their parts line up in
// pairs, and each variable faces a piece of the other type.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const COLS = [80, 200, 320];
const TOP = ["'a", "['a]", "'b"];
const BOT = ['number', "'c", "'c"];
const HEAD = ['parameter 1', 'parameter 2', 'result'];
const BIND = ["'a ↦ number", "'c ↦ ['a]", "'b ↦ 'c"];

export default function TypeTrees() {
  return (
    <Svg w={400} h={236} title="Two function types, one above the other, lined up part by part. Parameter 1: 'a above number, so 'a is bound to number. Parameter 2: ['a] above 'c, so 'c is bound to ['a]. Result: 'b above 'c, so 'b is bound to 'c.">
      <T x={200} y={14} size={13} mono anchor="middle" fill={tok('brand')}>fn('a, ['a]) -&gt; 'b</T>
      <T x={200} y={222} size={13} mono anchor="middle" fill={tok('accent')}>fn(number, 'c) -&gt; 'c</T>
      {COLS.map((x, i) => (
        <g key={i}>
          <T x={x} y={36} size={11} anchor="middle" fill={tok('muted')}>{HEAD[i]}</T>
          <Box x={x - 46} y={48} w={92} h={30} stroke={tok('brand')} fill={tok('brand', 0.08)}>
            <T x={x} y={63} size={14} mono anchor="middle">{TOP[i]}</T>
          </Box>
          <Arrow x1={x} y1={80} x2={x} y2={150} color={tok('safe')} dash />
          <T x={x} y={116} size={12} mono anchor="middle" weight={700} fill={tok('safe')}>{BIND[i]}</T>
          <Box x={x - 46} y={154} w={92} h={30} stroke={tok('accent')} fill={tok('accent', 0.08)}>
            <T x={x} y={169} size={14} mono anchor="middle">{BOT[i]}</T>
          </Box>
        </g>
      ))}
    </Svg>
  );
}
