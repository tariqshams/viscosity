import { Svg, T, tok } from '../../viz/svg';

// The 64 bits of the number 1 as a float64: sign 0, exponent 01111111111, fraction all 0.
const BITS = ('0' + '01111111111' + '0'.repeat(52)).split('').map(Number);
const W = 6;
const X0 = 8;

const part = (k: number) => (k === 0 ? 'danger' : k <= 11 ? 'accent' : 'f1');

/** The 64 bits of a float64, split into sign, exponent and fraction. */
export default function Float64Bits() {
  return (
    <Svg w={400} h={118} title="The 64 bits of the number 1 stored as a float64: 1 sign bit, 11 exponent bits and 52 fraction bits.">
      {BITS.map((b, k) => (
        <rect key={k} x={X0 + k * W} y={30} width={W - 1} height={34} rx={1} fill={b ? tok(part(k), 0.9) : tok(part(k), 0.18)} stroke={tok(part(k), 0.6)} strokeWidth={0.5} />
      ))}
      <T x={X0} y={16} size={12} mono weight={700} fill={tok('danger')}>↓ sign: 1 bit</T>
      <T x={X0 + W * 38} y={16} size={12} mono weight={700} anchor="middle" fill={tok('f1')}>fraction: 52 bits</T>
      <T x={X0 + W} y={80} size={12} mono weight={700} fill={tok('accent')}>↑ exponent: 11 bits</T>
      <T x={X0} y={104} size={13} mono>the number 1: 0 01111111111 000…000</T>
    </Svg>
  );
}
