// Chapter 152: how one jump is encoded. The first twelve bytes of the real
// bytecode for
//   if true { print 1; } else { print 2; }
// are [2, 35, 0, 7, 0, 0, 0, 33, 34, 0, 4, 2...]; byte 1 is jump.unless
// (opcode 35) and bytes 2 and 3 are its distance, 0 * 256 + 7 = 7, counted
// from offset 4, the byte just after the operand. So it lands at 11.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

/** [byte value, what it is] */
const BYTES: [string, string][] = [
  ['2', 'true'],
  ['35', 'jump.unless'],
  ['0', 'hi'],
  ['7', 'lo'],
  ['0', 'const'],
  ['0', 'k hi'],
  ['0', 'k lo'],
  ['33', 'print'],
  ['34', 'jump'],
  ['0', 'hi'],
  ['4', 'lo'],
  ['0', 'const'],
];

const CW = 32;
const x = (i: number) => 8 + i * CW;

export default function JumpBytes() {
  return (
    <Svg w={400} h={200} title="Twelve bytes in a row. Byte 1 is the opcode jump.unless, bytes 2 and 3 its two-byte distance, 0 and 7. The distance is counted from byte 4, just after the operand, so the jump lands on byte 11.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>OFFSET</T>
      {BYTES.map(([v, what], i) => {
        const jump = i >= 1 && i <= 3;
        return (
          <g key={i}>
            <T x={x(i) + CW / 2 - 1} y={30} size={11} mono anchor="middle" fill={tok('muted')}>{i}</T>
            <Box x={x(i)} y={40} w={CW - 3} h={30} fill={jump ? tok('brand', 0.16) : i === 11 ? tok('accent', 0.16) : tok('panel')} stroke={jump ? tok('brand') : i === 11 ? tok('accent') : tok('line')}>
              <T x={x(i) + CW / 2 - 1} y={55} size={12} mono weight={700} anchor="middle">{v}</T>
            </Box>
          </g>
        );
      })}
      <T x={x(1)} y={84} size={11} mono fill={tok('brand')}>jump.unless</T>
      <T x={x(2) + CW - 2} y={98} size={11} mono anchor="middle" fill={tok('brand')}>distance</T>
      <T x={x(4)} y={84} size={11} mono fill={tok('muted')}>const 0</T>
      <T x={x(7) + 2} y={98} size={11} mono fill={tok('muted')}>print</T>
      <T x={x(8)} y={84} size={11} mono fill={tok('muted')}>jump 4</T>
      <Arrow x1={x(4) + CW / 2} y1={110} x2={x(11) + CW / 2 - 1} y2={74} bend={-0.5} color={tok('accent')} />
      <T x={x(4) - 6} y={124} size={11} mono fill={tok('ink')}>ip is here after reading</T>
      <T x={8} y={150} size={12} mono>distance = 0 × 256 + 7 = 7</T>
      <T x={8} y={168} size={12} mono>target = 4 + 7 = 11</T>
      <T x={8} y={188} size={11} fill={tok('muted')}>The distance counts from the byte after the operand.</T>
    </Svg>
  );
}
