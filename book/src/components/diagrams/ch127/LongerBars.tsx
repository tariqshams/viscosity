import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 127-b: what fn longer<'a>(a: &'a str, b: &'a str) -> &'a str
// promises. One name for both inputs means 'a is a stretch during which
// both borrows are valid, so the result may only be used where the
// shorter-lived input is still alive.
function Bar({ y, label, x1, x2, col, sub }: { y: number; label: string; x1: number; x2: number; col: string; sub: string }) {
  return (
    <g>
      <T x={8} y={y + 9} size={12} mono weight={700} fill={tok(col)}>{label}</T>
      <Box x={x1} y={y} w={x2 - x1} h={18} r={4} fill={tok(col, 0.25)} stroke={tok(col)} />
      <T x={x1 + 6} y={y + 30} size={11} fill={tok('muted')}>{sub}</T>
    </g>
  );
}

export default function LongerBars() {
  return (
    <Svg w={400} h={196} title="The lifetimes of two inputs and of longer's result, which must fit inside both">
      <Bar y={8} label="a" x1={70} x2={390} col="accent" sub="lives to the end of main" />
      <Bar y={58} label="b" x1={110} x2={270} col="f3" sub="lives only inside the block" />
      <Bar y={108} label="'a" x1={150} x2={270} col="brand" sub="the result may be used here, and only here" />
      <line x1={270} y1={4} x2={270} y2={156} stroke={tok('danger')} strokeWidth={2} strokeDasharray="4 3" />
      <T x={274} y={170} size={11} fill={tok('danger')}>b dropped: a use of the</T>
      <T x={274} y={185} size={11} fill={tok('danger')}>result after here is E0597</T>
    </Svg>
  );
}
