import { Svg, T, tok } from '../../viz/svg';

// The 64 bits of the double 1.5: sign 0, exponent 1023 (01111111111),
// mantissa 1000...0 (the .5 after the implicit leading 1).
const BITS = '0' + '01111111111' + '1' + '0'.repeat(51);
const W = 5.4;
const X0 = 44;

/** The IEEE 754 double layout: 1 sign bit, 11 exponent bits, 52 mantissa bits. */
export default function Float64Bits() {
  const part = (i: number) => (i === 0 ? 'danger' : i < 12 ? 'accent' : 'brand');
  const bracket = (from: number, to: number, label: string, sub: string, color: string, end = false) => {
    const x1 = X0 + from * W;
    const x2 = X0 + (to + 1) * W - 1;
    return (
      <g>
        <path d={`M${x1},62 v6 H${x2} v-6`} fill="none" stroke={tok(color)} strokeWidth={1.5} />
        <T x={end ? x1 - 3 : (x1 + x2) / 2} y={82} size={12} weight={700} anchor={end ? 'end' : 'middle'} fill={tok(color)}>{label}</T>
        <T x={end ? x1 - 3 : (x1 + x2) / 2} y={98} size={11} mono anchor={end ? 'end' : 'middle'} fill={tok('muted')}>{sub}</T>
      </g>
    );
  };
  return (
    <Svg w={400} h={110} title="The 64 bits of the number 1.5: one sign bit (0), eleven exponent bits (01111111111, which is 1023), and fifty-two mantissa bits (a 1 followed by zeros).">
      <T x={4} y={12} size={13} mono weight={700}>1.5 as 64 bits</T>
      {[...BITS].map((b, i) => (
        <rect key={i} x={X0 + i * W} y={28} width={W - 1.2} height={30} rx={1}
          fill={b === '1' ? tok(part(i), 0.9) : tok(part(i), 0.12)} stroke={tok(part(i), 0.5)} strokeWidth={0.6} />
      ))}
      {bracket(0, 0, 'sign', '+', 'danger', true)}
      {bracket(1, 11, 'exponent', '1023 → 2⁰', 'accent')}
      {bracket(12, 63, 'mantissa (fraction)', '1.1 in binary = 1.5', 'brand')}
    </Svg>
  );
}
