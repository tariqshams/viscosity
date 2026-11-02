// Chapter 172b: decoding %GetOptimizationStatus. The bit names come from
// enum class OptimizationStatus in src/runtime/runtime.h at V8 tag
// 12.4.254.21; the two numbers were printed (as binary) on Node v22.23.4
// for `add` before %OptimizeFunctionOnNextCall and after it.
import { Box, Svg, T, tok } from '../../viz/svg';

const BITS = [7, 6, 5, 4, 3, 0];
const ROWS: { label: string; bin: string; value: number }[] = [
  { label: 'before', bin: '10000001', value: 0b10000001 },
  { label: 'after', bin: '1010001', value: 0b1010001 },
];

export default function StatusBits() {
  const cw = 44;
  const x0 = 120;
  return (
    <Svg w={400} h={210} title="Two optimization statuses decoded: before optimizing, bits 0 and 7 are set (a function, interpreted); after, bits 0, 4 and 6 (a function, optimized, by TurboFan).">
      <T x={6} y={14} size={11} weight={700} fill={tok('muted')}>STATUS</T>
      <T x={x0 - 6} y={14} size={11} weight={700} anchor="end" fill={tok('muted')}>BIT</T>
      {BITS.map((b, k) => (
        <T key={b} x={x0 + k * cw + cw / 2} y={14} size={12} mono weight={700} anchor="middle">{b}</T>
      ))}
      {ROWS.map((r, j) => {
        const y = 28 + j * 48;
        return (
          <g key={r.label}>
            <T x={6} y={y + 11} size={12} weight={700}>{r.label}</T>
            <T x={6} y={y + 27} size={11} mono fill={tok('muted')}>{r.bin}</T>
            {BITS.map((b, k) => {
              const on = (r.value >> b) & 1;
              return (
                <Box key={b} x={x0 + k * cw + 4} y={y} w={cw - 8} h={36} r={4} fill={on ? tok('brand', 0.3) : 'transparent'} stroke={on ? tok('brand') : tok('line')} dash={!on}>
                  <T x={x0 + k * cw + cw / 2} y={y + 18} size={13} mono weight={700} anchor="middle" fill={on ? tok('ink') : tok('muted')}>{on}</T>
                </Box>
              );
            })}
          </g>
        );
      })}
      <T x={6} y={138} size={11} fill={tok('muted')}>bit 7 interpreted · 6 TurboFanned · 5 Maglevved</T>
      <T x={6} y={154} size={11} fill={tok('muted')}>bit 4 optimized · 3 maybe deopted · 0 is a function</T>
      <T x={6} y={180} size={12}>Before: a function, running in the interpreter.</T>
      <T x={6} y={198} size={12}>After: a function, optimized by TurboFan.</T>
    </Svg>
  );
}
