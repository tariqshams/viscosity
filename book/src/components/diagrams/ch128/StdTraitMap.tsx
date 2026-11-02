import { Box, Svg, T, tok } from '../../viz/svg';

// The standard traits used most: what each unlocks, and whether
// #[derive] can write it. Static.

const ROWS: [string, string, boolean][] = [
  ['Display', '{} and .to_string()', false],
  ['Debug', '{:?}, assert_eq! messages', true],
  ['Default', 'T::default(), ..Default::default()', true],
  ['Clone', '.clone()', true],
  ['Copy', 'copy instead of move', true],
  ['PartialEq', '== and !=', true],
  ['PartialOrd', '<, <=, >, >=', true],
  ['Hash', 'a key in a HashMap', true],
  ['From<T>', 'T::from(x), x.into(), and ?', false],
  ['Iterator', 'for loops, map, filter, sum', false],
];

export default function StdTraitMap() {
  const rowH = 24;
  return (
    <Svg w={400} h={44 + ROWS.length * rowH} title="Standard traits, what each unlocks, and whether derive can write it">
      <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>TRAIT</T>
      <T x={104} y={14} size={11} weight={700} fill={tok('muted')}>UNLOCKS</T>
      <T x={392} y={14} size={11} weight={700} anchor="end" fill={tok('muted')}>DERIVE?</T>
      {ROWS.map(([name, what, d], i) => {
        const y = 26 + i * rowH;
        return (
          <g key={name}>
            <Box x={8} y={y} w={90} h={rowH - 4} r={3} fill={tok('brand', 0.12)} stroke={tok('brand')}>
              <T x={14} y={y + (rowH - 4) / 2} size={11} mono weight={700}>{name}</T>
            </Box>
            <T x={104} y={y + (rowH - 4) / 2} size={11} mono>{what}</T>
            <T x={392} y={y + (rowH - 4) / 2} size={13} weight={700} anchor="end" fill={tok(d ? 'safe' : 'muted')}>{d ? '✓' : 'write it'}</T>
          </g>
        );
      })}
    </Svg>
  );
}
