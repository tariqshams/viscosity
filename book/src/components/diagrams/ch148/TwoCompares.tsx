import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Comparing two equal strings: character by character when there are two
// copies, one reference check when interning has made them one object.
const WORD = 'particles';
const CW = 24;

function Chars({ x, y }: { x: number; y: number }) {
  return (
    <g>
      {[...WORD].map((c, k) => (
        <Box key={k} x={x + k * CW} y={y} w={CW - 3} h={24} r={3} fill={tok('panel')}>
          <T x={x + k * CW + (CW - 3) / 2} y={y + 12} size={13} mono anchor="middle">{c}</T>
        </Box>
      ))}
    </g>
  );
}

export default function TwoCompares() {
  const x0 = 120;
  return (
    <Svg w={400} h={250} title="Top: two separate copies of the string particles, compared one character at a time, nine checks. Bottom: two references to one interned object, compared with a single identity check.">
      <T x={8} y={14} size={12} weight={700} fill={tok('muted')}>TWO COPIES: COMPARE THE CHARACTERS</T>
      <Box x={8} y={30} w={44} h={24} r={4}><T x={30} y={42} size={13} mono anchor="middle" weight={700}>s</T></Box>
      <Box x={8} y={84} w={44} h={24} r={4}><T x={30} y={96} size={13} mono anchor="middle" weight={700}>t</T></Box>
      <Arrow x1={52} y1={42} x2={x0 - 4} y2={42} />
      <Arrow x1={52} y1={96} x2={x0 - 4} y2={96} />
      <Chars x={x0} y={30} />
      <Chars x={x0} y={84} />
      {[...WORD].map((_, k) => (
        <T key={k} x={x0 + k * CW + (CW - 3) / 2} y={70} size={11} mono anchor="middle" fill={tok('warn')}>=</T>
      ))}
      <T x={8} y={126} size={12} fill={tok('muted')}>9 checks, and more for a longer string</T>
      <T x={8} y={152} size={12} weight={700} fill={tok('muted')}>INTERNED: COMPARE THE REFERENCES</T>
      <Box x={8} y={168} w={44} h={24} r={4} stroke={tok('safe')}><T x={30} y={180} size={13} mono anchor="middle" weight={700}>s</T></Box>
      <Box x={8} y={212} w={44} h={24} r={4} stroke={tok('safe')}><T x={30} y={192 + 32} size={13} mono anchor="middle" weight={700}>t</T></Box>
      <Arrow x1={52} y1={180} x2={x0 - 4} y2={196} />
      <Arrow x1={52} y1={224} x2={x0 - 4} y2={204} />
      <Chars x={x0} y={188} />
      <T x={x0} y={234} size={12} mono fill={tok('safe')}>s === t: 1 check, any length</T>
    </Svg>
  );
}
