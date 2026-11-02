// Chapter 318-b: the promises a reference carries and a raw pointer does
// not. From the Rust Reference ("Raw pointers": raw pointers have no
// safety or liveness guarantees, may be null, dangling or unaligned) and
// the E0133 note printed by rustc 1.97.0 ("raw pointers may be null,
// dangling or unaligned; they can violate aliasing rules and cause data
// races"). Both are one address, 8 bytes on x86-64 (size_of).
import { Box, Svg, T, tok } from '../../viz/svg';

const ROWS: [string, boolean, boolean][] = [
  ['never null', true, false],
  ['points at a live value', true, false],
  ['correctly aligned', true, false],
  ['borrow rules (one &mut, or many &)', true, false],
  ['has a lifetime the compiler checks', true, false],
  ['making one is safe', true, true],
  ['reading through it is safe', true, false],
];

export default function RefVsRaw() {
  const rh = 26;
  return (
    <Svg w={400} h={ROWS.length * rh + 54} title="A table of promises: a reference keeps all of them, a raw pointer keeps only that making one is safe">
      <T x={250} y={14} size={12} weight={700} anchor="middle" fill={tok('safe')}>&amp;T</T>
      <T x={340} y={14} size={12} weight={700} anchor="middle" fill={tok('warn')}>*const T</T>
      {ROWS.map(([label, r, p], k) => {
        const y = 26 + k * rh;
        return (
          <g key={label}>
            <Box x={6} y={y} w={388} h={rh - 4} r={3} fill={k % 2 ? 'transparent' : tok('panel')} stroke="transparent">
              <T x={14} y={y + (rh - 4) / 2} size={11} fill={tok('ink')}>{label}</T>
              <T x={250} y={y + (rh - 4) / 2} size={13} anchor="middle" fill={r ? tok('safe') : tok('danger')}>{r ? '✓' : '✗'}</T>
              <T x={340} y={y + (rh - 4) / 2} size={13} anchor="middle" fill={p ? tok('safe') : tok('danger')}>{p ? '✓' : '✗'}</T>
            </Box>
          </g>
        );
      })}
      <T x={14} y={ROWS.length * rh + 40} size={11} fill={tok('muted')}>Both are one address: size_of is 8 for each here.</T>
    </Svg>
  );
}
