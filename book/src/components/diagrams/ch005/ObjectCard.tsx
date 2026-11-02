import { Box, Svg, T, tok } from '../../viz/svg';

const FIELDS: [string, string, number][] = [['x', 'f1', 3], ['y', 'f2', 4], ['vx', 'f3', 1], ['vy', 'f4', 2]];

/** An object as a card of labelled parts. The field colours used here are
 *  the book's permanent colour code for x, y, vx and vy. */
export default function ObjectCard() {
  return (
    <Svg w={400} h={210} title="The object p has four properties: x is 3, y is 4, vx is 1, vy is 2. Each property is a name (key) with a value.">
      <T x={20} y={16} size={14} mono weight={700}>p</T>
      <Box x={20} y={28} w={250} h={172} r={8} stroke={tok('ink', 0.5)}>
        {FIELDS.map(([k, c, v], i) => (
          <g key={k}>
            <rect x={34} y={42 + i * 38} width={8} height={28} rx={2} fill={tok(c)} />
            <T x={52} y={56 + i * 38} size={16} mono weight={700} fill={tok(c)}>{k}</T>
            <T x={110} y={56 + i * 38} size={14} fill={tok('muted')}>:</T>
            <Box x={130} y={42 + i * 38} w={120} h={28} fill={tok(c, 0.12)} stroke={tok(c)}>
              <T x={190} y={56.5 + i * 38} size={16} mono anchor="middle">{v}</T>
            </Box>
          </g>
        ))}
      </Box>
      <T x={286} y={60} size={12} weight={700} fill={tok('muted')}>KEY</T>
      <T x={286} y={78} size={12} fill={tok('muted')}>the name</T>
      <T x={286} y={118} size={12} weight={700} fill={tok('muted')}>VALUE</T>
      <T x={286} y={136} size={12} fill={tok('muted')}>what it holds</T>
      <T x={286} y={176} size={13} mono fill={tok('f3')} weight={700}>p.vx → 1</T>
    </Svg>
  );
}
