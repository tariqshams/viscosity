import { Box, Svg, T, tok } from '../../viz/svg';

// Generic parameter or dyn: the same trait, two ways to reach its methods,
// side by side.

const ROWS: [string, string, string][] = [
  ['copies of the code', 'one per type used', 'one'],
  ['each call to a method', 'direct, known target', 'through the vtable'],
  ['can it be inlined?', 'yes', 'no'],
  ['one Vec of mixed types?', 'no', 'yes'],
  ['type chosen', 'when compiling', 'while running'],
];

export default function TwoWays() {
  return (
    <Svg w={400} h={40 + ROWS.length * 34} title="A comparison table of generic functions and dyn trait objects">
      <Box x={150} y={4} w={118} h={26} r={4} fill={tok('f3', 0.15)} stroke={tok('f3')}>
        <T x={209} y={17} size={12} mono weight={700} anchor="middle">&lt;L: Layout&gt;</T>
      </Box>
      <Box x={276} y={4} w={118} h={26} r={4} fill={tok('f5', 0.15)} stroke={tok('f5')}>
        <T x={335} y={17} size={12} mono weight={700} anchor="middle">&amp;dyn Layout</T>
      </Box>
      {ROWS.map(([q, g, d], i) => {
        const y = 38 + i * 34;
        return (
          <g key={q}>
            <Box x={2} y={y} w={396} h={30} r={3} fill={i % 2 ? 'transparent' : tok('brand', 0.05)} stroke="transparent" />
            <T x={6} y={y + 15} size={11} weight={700}>{q}</T>
            <T x={156} y={y + 15} size={11}>{g}</T>
            <T x={282} y={y + 15} size={11}>{d}</T>
          </g>
        );
      })}
    </Svg>
  );
}
