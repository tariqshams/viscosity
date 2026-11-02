// Chapter 138: four instructions naming constants by index, for
//   let x = 1.5;
//   print x + 2;
// The instructions, operands and pool are the real ones the companion
// compiler makes (checked with disassembleFunction): the name x is added
// to the pool twice, once per mention.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const INSTRS = [
  { text: 'const', bytes: '0 0 0', k: 0 },
  { text: 'define.global', bytes: '11 0 1', k: 1 },
  { text: 'load.global', bytes: '10 0 2', k: 2 },
  { text: 'const', bytes: '0 0 3', k: 3 },
];
const POOL = ['1.5', "'x'", "'x'", '2'];

export default function PoolLookup() {
  const rowY = (i: number) => 26 + i * 40;
  const poolX = 286;
  return (
    <Svg w={400} h={198} title="Four instructions with constant operands. const 0 0 0 names pool index 0, the number 1.5. define.global 11 0 1 names index 1, the string x. load.global 10 0 2 names index 2, another copy of x. const 0 0 3 names index 3, the number 2.">
      <T x={8} y={10} size={11} weight={700} fill={tok('muted')}>INSTRUCTION (BYTES)</T>
      <T x={poolX} y={10} size={11} weight={700} fill={tok('muted')}>CONSTANTS</T>
      {INSTRS.map((ins, i) => (
        <g key={i}>
          <Box x={8} y={rowY(i)} w={200} h={30} r={4} fill={tok('brand', 0.08)} stroke={tok('brand', 0.6)} />
          <T x={16} y={rowY(i) + 15} size={12} mono weight={700}>{ins.text}</T>
          <T x={200} y={rowY(i) + 15} size={12} mono anchor="end" fill={tok('muted')}>{ins.bytes}</T>
          <Arrow x1={210} y1={rowY(i) + 15} x2={poolX - 4} y2={rowY(ins.k) + 15} color={tok('accent')} />
        </g>
      ))}
      {POOL.map((v, k) => (
        <g key={k}>
          <Box x={poolX} y={rowY(k)} w={106} h={30} r={4} fill={tok('accent', 0.1)} stroke={tok('accent')} />
          <T x={poolX + 8} y={rowY(k) + 15} size={11} mono fill={tok('muted')}>{`[${k}]`}</T>
          <T x={poolX + 70} y={rowY(k) + 15} size={14} mono anchor="middle">{v}</T>
        </g>
      ))}
      <T x={8} y={186} size={11} fill={tok('muted')}>The last two bytes are the index; 'x' is stored twice.</T>
    </Svg>
  );
}
