// Chapter 217-b: the slots touched by a[2i] (even) and a[2i + 1] (odd)
// interleave without ever meeting: the picture behind the GCD test.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const X0 = 24;
const DX = 33;

export default function GcdFigure() {
  return (
    <Svg w={400} h={150} title="Array slots 0 to 10; writes land on even slots, reads on odd slots">
      <T x={8} y={16} size={11} weight={700} fill={tok('brand')}>writes a[2i]</T>
      <T x={8} y={136} size={11} weight={700} fill={tok('accent')}>reads a[2i + 1]</T>
      {Array.from({ length: 11 }, (_, k) => {
        const x = X0 + k * DX;
        const even = k % 2 === 0;
        return (
          <g key={k}>
            <Box x={x - 14} y={60} w={28} h={28} r={4}
              fill={even ? tok('brand', 0.18) : tok('accent', 0.18)}
              stroke={even ? tok('brand') : tok('accent')}>
              <T x={x} y={74} size={12} mono anchor="middle">{k}</T>
            </Box>
            {even
              ? <Arrow x1={x} y1={28} x2={x} y2={56} color={tok('brand')} width={1.6} />
              : <Arrow x1={x} y1={122} x2={x} y2={92} color={tok('accent')} width={1.6} />}
          </g>
        );
      })}
      <T x={392} y={16} size={11} anchor="end" fill={tok('muted')}>gcd(2, 2) = 2 does not divide 1</T>
    </Svg>
  );
}
