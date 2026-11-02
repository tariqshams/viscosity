import { Box, Svg, T, tok } from '../../viz/svg';

// Slack tracking, from %DebugPrint in Node v22.23.4 (V8 12.4): the first
// `new P(1, 2)` had 10 in-object slots (2 used, 8 spare, 104 bytes); after
// eleven more constructions the map was trimmed to 2 slots (40 bytes).
// The "expected properties plus eight" rule is from the V8 blog post
// "Slack tracking in V8" (2020).
function Row({ y, label, size, used, spare }: { y: number; label: string; size: string; used: number; spare: number }) {
  const w = 28;
  return (
    <g>
      <T x={8} y={y} size={12} weight={700}>{label}</T>
      <T x={392} y={y} size={12} mono anchor="end" fill={tok('muted')}>{size}</T>
      <Box x={8} y={y + 10} w={44} h={28} fill={tok('panel')}>
        <T x={30} y={y + 24} size={11} anchor="middle" fill={tok('muted')}>header</T>
      </Box>
      {Array.from({ length: used + spare }, (_, k) => (
        <Box key={k} x={56 + k * (w + 4)} y={y + 10} w={w} h={28} r={3}
          fill={k < used ? tok(k === 0 ? 'f1' : 'f2', 0.2) : 'transparent'}
          stroke={k < used ? tok(k === 0 ? 'f1' : 'f2') : tok('line')} dash={k >= used}>
          <T x={56 + k * (w + 4) + w / 2} y={y + 24} size={12} mono anchor="middle">{k === 0 ? 'x' : k === 1 && k < used ? 'y' : ''}</T>
        </Box>
      ))}
    </g>
  );
}

export default function SlackBars() {
  return (
    <Svg w={400} h={130} title="Two rows of in-object slots. The first P object: a header, then x and y, then eight empty spare slots, 104 bytes. After slack tracking: a header, x and y, no spare slots, 40 bytes.">
      <Row y={12} label="first new P(1, 2)" size="104 bytes" used={2} spare={8} />
      <Row y={70} label="after slack tracking" size="40 bytes" used={2} spare={0} />
      <T x={8} y={124} size={11} fill={tok('muted')}>dashed: spare slots (2 expected + 8), later trimmed</T>
    </Svg>
  );
}
