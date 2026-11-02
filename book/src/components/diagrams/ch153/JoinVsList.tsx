import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 153: why comparing shapes by joined names was bug 3 in
// engine/rust/README.md. ["a,b"] and ["a", "b"] join (with ",", as
// Array.prototype.join does by default) to the same string, so the old
// TypeScript check saw one shape. set_shape in analysis.rs compares the
// Vec<String>s, length first and then name by name; the fixed TypeScript
// compares JSON.stringify of both, which quotes each name.
function Cells({ x, y, names, col }: { x: number; y: number; names: string[]; col: string }) {
  let cx = x;
  return (
    <g>
      {names.map((n) => {
        const w = 18 + n.length * 8;
        const el = (
          <Box key={cx} x={cx} y={y} w={w} h={26} fill={tok(col, 0.12)} stroke={tok(col)}>
            <T x={cx + w / 2} y={y + 13} size={12} mono anchor="middle">{n}</T>
          </Box>
        );
        cx += w + 6;
        return el;
      })}
    </g>
  );
}

export default function JoinVsList() {
  return (
    <Svg w={400} h={230} title="Two field lists that join to the same text but are different lists">
      <T x={10} y={16} size={11} weight={700} fill={tok('muted')}>THE TWO RECORDS' FIELDS</T>
      <T x={10} y={44} size={12} mono>{"{ 'a,b': i }"}</T>
      <Cells x={150} y={31} names={['a,b']} col="f1" />
      <T x={10} y={80} size={12} mono>{'{ a: i, b: 2 }'}</T>
      <Cells x={150} y={67} names={['a', 'b']} col="f2" />

      <T x={10} y={118} size={11} weight={700} fill={tok('muted')}>OLD CHECK: JOIN, THEN COMPARE</T>
      <T x={10} y={142} size={12} mono>"a,b"  ==  "a,b"</T>
      <T x={250} y={142} size={12} fill={tok('danger')}>same (wrong)</T>

      <T x={10} y={174} size={11} weight={700} fill={tok('muted')}>set_shape: COMPARE THE LISTS</T>
      <T x={10} y={198} size={12} mono>len 1  !=  len 2</T>
      <T x={250} y={198} size={12} fill={tok('safe')}>different</T>
      <T x={10} y={220} size={11} fill={tok('muted')}>(fixed TypeScript: ["a,b"] vs ["a","b"])</T>
    </Svg>
  );
}
