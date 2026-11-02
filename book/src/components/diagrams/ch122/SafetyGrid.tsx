// Two separate questions, after Cardelli's survey of type systems: when
// are types checked (columns), and can a mistake slip through unnoticed
// (rows)? Each language sits in one corner.
import { Box, Svg, T, tok } from '../../viz/svg';

const CELLS = [
  { x: 96, y: 54, title: 'Java, ML', sub: 'checked first;', sub2: 'errors always caught', c: 'safe' },
  { x: 248, y: 54, title: 'Drip, Python', sub: 'checked as it runs;', sub2: 'errors always caught', c: 'safe' },
  { x: 96, y: 150, title: 'C', sub: 'checked first, but', sub2: 'bad reads go unnoticed', c: 'danger' },
  { x: 248, y: 150, title: 'assembly', sub: 'no type checks;', sub2: 'anything goes', c: 'danger' },
];

export default function SafetyGrid() {
  return (
    <Svg w={400} h={250} title="A two by two grid. Columns: types checked before running, or while running. Rows: safe, where every mistake is trapped, or unsafe, where some slip through. Java and ML: before running, safe. Drip and Python: while running, safe. C: before running, unsafe. Assembly: no checks, unsafe.">
      <T x={172} y={18} size={12} anchor="middle" weight={700} fill={tok('brand')}>before running</T>
      <T x={324} y={18} size={12} anchor="middle" weight={700} fill={tok('brand')}>while running</T>
      <T x={172} y={34} size={11} anchor="middle" fill={tok('muted')}>(static)</T>
      <T x={324} y={34} size={11} anchor="middle" fill={tok('muted')}>(dynamic)</T>
      <T x={44} y={96} size={12} anchor="middle" weight={700} fill={tok('safe')}>safe</T>
      <T x={44} y={192} size={12} anchor="middle" weight={700} fill={tok('danger')}>unsafe</T>
      {CELLS.map((c) => (
        <Box key={c.title} x={c.x} y={c.y} w={148} h={88} stroke={tok(c.c)} fill={tok(c.c, 0.08)}>
          <T x={c.x + 74} y={c.y + 24} size={15} anchor="middle" weight={700}>{c.title}</T>
          <T x={c.x + 74} y={c.y + 50} size={11} anchor="middle" fill={tok('muted')}>{c.sub}</T>
          <T x={c.x + 74} y={c.y + 66} size={11} anchor="middle" fill={tok('muted')}>{c.sub2}</T>
        </Box>
      ))}
      <T x={200} y={244} size={11} anchor="middle" fill={tok('muted')}>“strong” and “weak” blur these two questions together</T>
    </Svg>
  );
}
