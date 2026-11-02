import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 292: the C++/Rust memory orderings from weakest to
// strongest, and what clang 18 emits for an atomic store and load of
// each on x86-64 and AArch64 (-O2, real output).
const ROWS = [
  { name: 'relaxed', what: 'atomic, no ordering', x86: 'mov / mov', arm: 'str / ldr', c: 'f3' },
  { name: 'release / acquire', what: 'orders one pair', x86: 'mov / mov', arm: 'stlr / ldar', c: 'f2' },
  { name: 'seq_cst', what: 'one total order', x86: 'xchg / mov', arm: 'stlr / ldar', c: 'f1' },
];

export default function OrderingLadder() {
  return (
    <Svg w={400} h={196} title="Three rungs: relaxed compiles to plain mov and str/ldr; release and acquire compile to plain mov on x86 and stlr/ldar on AArch64; seq_cst compiles to xchg for the store on x86 and stlr/ldar on AArch64">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>ORDERING</T>
      <T x={232} y={12} size={11} weight={700} fill={tok('muted')}>x86-64</T>
      <T x={318} y={12} size={11} weight={700} fill={tok('muted')}>AArch64</T>
      {ROWS.map((r, i) => {
        const y = 24 + i * 48;
        return (
          <g key={r.name}>
            <Box x={8} y={y} w={212} h={40} fill={tok(r.c, 0.1)} stroke={tok(r.c)}>
              <T x={16} y={y + 14} size={12} mono weight={700}>{r.name}</T>
              <T x={16} y={y + 30} size={11} fill={tok('muted')}>{r.what}</T>
            </Box>
            <T x={232} y={y + 20} size={11} mono>{r.x86}</T>
            <T x={318} y={y + 20} size={11} mono>{r.arm}</T>
          </g>
        );
      })}
      <T x={8} y={176} size={11} fill={tok('muted')}>store / load, clang 18 -O2. Stronger rungs</T>
      <T x={8} y={190} size={11} fill={tok('muted')}>forbid more reorderings and may cost more.</T>
    </Svg>
  );
}
