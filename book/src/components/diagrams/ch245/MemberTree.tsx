import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 245: the ESTree tree for `ps[i].x` (acorn's real output, with
// offsets): a non-computed MemberExpression whose object is a computed one.
const N = ({ x, y, w, title, sub, c }: { x: number; y: number; w: number; title: string; sub: string; c: string }) => (
  <Box x={x} y={y} w={w} h={44} fill={tok(c, 0.12)} stroke={tok(c)}>
    <T x={x + w / 2} y={y + 16} size={12} mono weight={700} anchor="middle">{title}</T>
    <T x={x + w / 2} y={y + 33} size={11} mono anchor="middle" fill={tok('muted')}>{sub}</T>
  </Box>
);

export default function MemberTree() {
  return (
    <Svg w={400} h={230} title="The ESTree tree of ps[i].x: an outer MemberExpression with computed false, whose object is an inner MemberExpression with computed true">
      <N x={100} y={8} w={200} title="MemberExpression" sub="computed: false · 0–7" c="brand" />
      <Arrow x1={160} y1={52} x2={110} y2={92} />
      <Arrow x1={240} y1={52} x2={300} y2={92} />
      <T x={92} y={70} size={11} fill={tok('muted')} anchor="end">object</T>
      <T x={290} y={70} size={11} fill={tok('muted')}>property</T>
      <N x={8} y={92} w={200} title="MemberExpression" sub="computed: true · 0–5" c="accent" />
      <N x={240} y={92} w={150} title="Identifier x" sub="6–7" c="f1" />
      <Arrow x1={60} y1={136} x2={60} y2={170} />
      <Arrow x1={160} y1={136} x2={180} y2={170} />
      <N x={8} y={170} w={110} title="Identifier ps" sub="0–2" c="line" />
      <N x={134} y={170} w={110} title="Identifier i" sub="3–4" c="line" />
      <T x={262} y={192} size={11} fill={tok('muted')}>computed: true means</T>
      <T x={262} y={208} size={11} fill={tok('muted')}>i is a value to look up</T>
    </Svg>
  );
}
