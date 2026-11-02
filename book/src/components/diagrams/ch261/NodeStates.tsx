// Chapter 261: the states of a self-specializing "+" node, as in the
// chapter's exercise (modelled on GraalJS's JSAddNode: an int
// specialization that rewrites on overflow, a double one, and a generic
// case that replaces the others). Arrows only go one way.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const NODES = [
  { x: 6, label: 'uninitialised', sub: 'seen nothing', c: tok('muted') },
  { x: 106, label: 'int', sub: 'int32 + int32', c: tok('f2') },
  { x: 206, label: 'double', sub: 'any numbers', c: tok('f3') },
  { x: 306, label: 'generic', sub: 'full JS +', c: tok('brand') },
];

export default function NodeStates() {
  return (
    <Svg w={400} h={150} title="A plus node moves from uninitialised to int, double and generic, and never back">
      {NODES.map((n) => (
        <Box key={n.label} x={n.x} y={40} w={88} h={46} stroke={n.c}>
          <T x={n.x + 44} y={56} size={12} weight={700} anchor="middle">{n.label}</T>
          <T x={n.x + 44} y={74} size={11} anchor="middle" fill={tok('muted')}>{n.sub}</T>
        </Box>
      ))}
      <Arrow x1={94} y1={63} x2={106} y2={63} />
      <Arrow x1={194} y1={63} x2={206} y2={63} />
      <Arrow x1={294} y1={63} x2={306} y2={63} />
      <T x={100} y={24} size={11} anchor="middle">ints</T>
      <T x={200} y={24} size={11} anchor="middle">overflow or</T>
      <T x={200} y={34} size={11} anchor="middle">a double</T>
      <T x={300} y={24} size={11} anchor="middle">a string,</T>
      <T x={300} y={34} size={11} anchor="middle">an object…</T>
      <Arrow x1={50} y1={88} x2={350} y2={88} bend={0.3} dash color={tok('ink', 0.4)} />
      <T x={200} y={128} size={11} anchor="middle" fill={tok('muted')}>strings first: straight to generic</T>
    </Svg>
  );
}
