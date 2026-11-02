import { Svg, T, tok } from '../../viz/svg';

// AoSoA with blocks of 8: block b holds 8 x values, then 8 y values, and so
// on for 6 fields (48 slots). Memory runs left to right along each row, then
// on to the next row, then on to the next block. Highlighted: particle 10,
// field 2 (vx), which is block 1, lane 2, slot 48 + 2*8 + 2 = 66.
const F = ['x', 'y', 'vx', 'vy', 'm', 'h'];
const COL = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'];
const CW = 20;
const RH = 20;

export default function AosoaBlocks() {
  const block = (b: number, x0: number) => (
    <g>
      <T x={x0} y={30} size={12} weight={700}>block {b}</T>
      <T x={x0 + 8 * CW - 2} y={30} size={10} mono anchor="end" fill={tok('muted')}>slots {b * 48}–{b * 48 + 47}</T>
      {F.map((f, r) => (
        <g key={f}>
          {Array.from({ length: 8 }, (_, lane) => {
            const hit = b === 1 && r === 2 && lane === 2;
            return (
              <g key={lane}>
                <rect x={x0 + lane * CW} y={42 + r * RH} width={CW - 2} height={RH - 3} rx={2}
                  fill={tok(COL[r], hit ? 0.95 : 0.3)} stroke={hit ? tok('ink') : 'none'} strokeWidth={2} />
                {r === 0 && <T x={x0 + lane * CW + 9} y={170} size={10} mono anchor="middle" fill={tok('muted')}>{b * 8 + lane}</T>}
              </g>
            );
          })}
        </g>
      ))}
    </g>
  );
  return (
    <Svg w={400} h={236} title="Two AoSoA blocks of 8 particles. Each block has six rows, one per field, of 8 values each. Particle 10's vx is in block 1, row vx, lane 2, which is slot 66.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>AoSoA, BLOCKS OF 8: ONE ROW PER FIELD INSIDE A BLOCK</T>
      {F.map((f, r) => (
        <T key={f} x={30} y={50 + r * RH} size={11} mono weight={700} anchor="end" fill={tok(COL[r])}>{f}</T>
      ))}
      {block(0, 36)}
      {block(1, 214)}
      <T x={36} y={184} size={10} fill={tok('muted')}>particle numbers (lanes) under each block</T>
      <T x={8} y={206} size={12} mono>particle 10, vx: block 1, lane 2</T>
      <T x={8} y={224} size={12} mono>slot = 1×48 + 2×8 + 2 = 66</T>
    </Svg>
  );
}
