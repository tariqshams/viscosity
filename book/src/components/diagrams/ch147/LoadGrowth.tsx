import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Growing the 8-slot table of ProbeSteps to 16 slots. The slots are real:
// FNV-1a hash & 7 before, & 15 after (vm/table.ts re-inserts every live key
// in old-slot order; health's hash, 1805184399, ends in binary 1111).
const FIELD: Record<string, string> = { x: 'f1', y: 'f2', vx: 'f3', vy: 'f4', mass: 'f5', health: 'f6' };
const BEFORE: (string | null)[] = ['vy', 'mass', 'health', 'vx', 'y', null, null, 'x'];
const AFTER: (string | null)[] = ['vy', 'mass', null, 'vx', 'y', null, null, 'x', null, null, null, null, null, null, null, 'health'];
const W = 46;

function Row({ keys, y, first }: { keys: (string | null)[]; y: number; first: number }) {
  return (
    <g>
      {keys.map((k, j) => {
        const x = 24 + j * W;
        return (
          <g key={j}>
            <T x={x + W / 2 - 2} y={y - 8} size={11} mono anchor="middle" fill={tok('muted')}>{first + j}</T>
            <Box x={x} y={y} w={W - 4} h={30} r={3} fill={k ? tok(FIELD[k], 0.2) : tok('panel')} stroke={k === 'health' ? tok('brand') : tok('line')}>
              <T x={x + W / 2 - 2} y={y + 15} size={k && k.length > 4 ? 11 : 12} mono anchor="middle" weight={700}>{k ?? ''}</T>
            </Box>
          </g>
        );
      })}
    </g>
  );
}

export default function LoadGrowth() {
  return (
    <Svg w={400} h={250} title="Before: an 8-slot table holding six keys, with health pushed to slot 2 by a collision. After: a 16-slot table where every key is re-inserted with and 15, and health lands in slot 15 on its own.">
      <T x={8} y={14} size={12} weight={700} fill={tok('muted')}>8 SLOTS · 6 KEYS · LOAD 0.75 · hash &amp; 7</T>
      <Row keys={BEFORE} y={36} first={0} />
      <Arrow x1={200} y1={76} x2={200} y2={104} />
      <T x={210} y={90} size={11} fill={tok('muted')}>a 7th key: grow and re-insert</T>
      <T x={8} y={122} size={12} weight={700} fill={tok('muted')}>16 SLOTS · 6 KEYS · LOAD 0.375 · hash &amp; 15</T>
      <Row keys={AFTER.slice(0, 8)} y={144} first={0} />
      <Row keys={AFTER.slice(8)} y={200} first={8} />
    </Svg>
  );
}
