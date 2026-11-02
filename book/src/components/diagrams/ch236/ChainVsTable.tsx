// Three ways to lower a switch, by how many tests reach case k = 4 of
// cases 0..7: a chain of compares, a binary search, and a jump table.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function ChainVsTable() {
  const chain = ['k == 0?', 'k == 1?', 'k == 2?', 'k == 3?', 'k == 4?'];
  const search = ['k < 4?', 'k < 6?', 'k == 4?'];
  return (
    <Svg w={400} h={226} title="Reaching case 4 of eight cases: a chain of compares makes five tests, a binary search three, and a jump table one bounds check and one indexed jump">
      <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>CHAIN</T>
      {chain.map((c, k) => (
        <g key={c}>
          <Box x={8} y={24 + k * 34} w={96} h={24} fill={tok('f1', k === 4 ? 0.4 : 0.15)} stroke={tok('f1')}>
            <T x={56} y={36 + k * 34} size={11.5} mono anchor="middle">{c}</T>
          </Box>
          {k < 4 && <Arrow x1={56} y1={49 + k * 34} x2={56} y2={57 + k * 34} />}
        </g>
      ))}
      <T x={56} y={204} size={12} anchor="middle" weight={700}>5 tests</T>
      <T x={56} y={219} size={11} anchor="middle" fill={tok('muted')}>grows with n</T>

      <T x={140} y={14} size={11} weight={700} fill={tok('muted')}>BINARY SEARCH</T>
      {search.map((c, k) => (
        <g key={c}>
          <Box x={140} y={24 + k * 34} w={100} h={24} fill={tok('f2', k === 2 ? 0.4 : 0.15)} stroke={tok('f2')}>
            <T x={190} y={36 + k * 34} size={11.5} mono anchor="middle">{c}</T>
          </Box>
          {k < 2 && <Arrow x1={190} y1={49 + k * 34} x2={190} y2={57 + k * 34} />}
        </g>
      ))}
      <T x={190} y={204} size={12} anchor="middle" weight={700}>3 tests</T>
      <T x={190} y={219} size={11} anchor="middle" fill={tok('muted')}>grows with log n</T>

      <T x={276} y={14} size={11} weight={700} fill={tok('muted')}>JUMP TABLE</T>
      <Box x={276} y={24} w={116} h={24} fill={tok('f3', 0.15)} stroke={tok('f3')}>
        <T x={334} y={36} size={11.5} mono anchor="middle">k ≤ 7? (bltu)</T>
      </Box>
      <Arrow x1={334} y1={49} x2={334} y2={57} />
      <Box x={276} y={58} w={116} h={24} fill={tok('f3', 0.4)} stroke={tok('f3')}>
        <T x={334} y={70} size={11.5} mono anchor="middle">jr table[k]</T>
      </Box>
      <T x={334} y={204} size={12} anchor="middle" weight={700}>1 test + 1 jump</T>
      <T x={334} y={219} size={11} anchor="middle" fill={tok('muted')}>same for any n</T>
    </Svg>
  );
}
