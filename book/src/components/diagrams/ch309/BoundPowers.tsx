import { Box, Svg, T, tok } from '../../viz/svg';

// What a generic body may do with a T depends only on its bounds. With
// none, it can move, borrow and store a T; each bound adds the operations
// of its trait.

const ROWS = [
  { b: '<T>', can: 'move, borrow, store in a Vec', c: 'line' },
  { b: '<T: PartialOrd>', can: '+ compare with < and >', c: 'f1' },
  { b: '<T: Display>', can: '+ print with {}', c: 'f2' },
  { b: '<T: Clone>', can: '+ make copies with .clone()', c: 'f3' },
  { b: '<T: Eq + Hash>', can: '+ be a HashMap key', c: 'f4' },
];

export default function BoundPowers() {
  return (
    <Svg w={400} h={30 + ROWS.length * 40} title="A table of trait bounds and what each one lets a generic function body do with T">
      <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>BOUND ON T</T>
      <T x={160} y={12} size={11} weight={700} fill={tok('muted')}>THE BODY MAY</T>
      {ROWS.map((r, i) => {
        const y = 24 + i * 40;
        return (
          <g key={r.b}>
            <Box x={4} y={y} w={146} h={30} r={4} fill={tok(r.c === 'line' ? 'panel' : r.c, 0.15)} stroke={r.c === 'line' ? tok('line') : tok(r.c)}>
              <T x={12} y={y + 15} size={12} mono weight={700}>{r.b}</T>
            </Box>
            <T x={160} y={y + 15} size={12}>{r.can}</T>
          </g>
        );
      })}
    </Svg>
  );
}
