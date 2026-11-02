import { Box, Svg, T, tok } from '../../viz/svg';

// Sizes rustc 1.97 reported on this machine (x86-64). A reference is never
// null, so Option<&T> uses the null bit pattern for None and costs nothing;
// every i32 bit pattern is already a number, so Option<i32> needs a tag.

const ROWS = [
  { t: '&i32', a: 8, o: 8, why: 'None is the null address' },
  { t: 'Box<i32>', a: 8, o: 8, why: 'None is the null address' },
  { t: 'bool', a: 1, o: 1, why: 'None is a spare bit pattern' },
  { t: 'i32', a: 4, o: 8, why: 'no spare pattern: a tag is added' },
];

export default function OptionSizes() {
  const u = 14;
  return (
    <Svg w={400} h={44 + ROWS.length * 46} title="The size of T and of Option of T, in bytes, for four types">
      <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>TYPE T</T>
      <T x={96} y={12} size={11} weight={700} fill={tok('muted')}>T</T>
      <T x={232} y={12} size={11} weight={700} fill={tok('muted')}>Option&lt;T&gt;</T>
      {ROWS.map((r, i) => {
        const y = 24 + i * 46;
        return (
          <g key={r.t}>
            <T x={6} y={y + 11} size={12} mono weight={700}>{r.t}</T>
            <Box x={96} y={y} w={r.a * u} h={22} r={2} fill={tok('f1', 0.2)} stroke={tok('f1')} />
            <T x={96 + r.a * u + 4} y={y + 11} size={11} mono>{r.a}</T>
            <Box x={232} y={y} w={r.o * u} h={22} r={2} fill={tok(r.o > r.a ? 'warn' : 'f1', 0.2)} stroke={tok(r.o > r.a ? 'warn' : 'f1')} />
            <T x={232 + r.o * u + 4} y={y + 11} size={11} mono>{r.o}</T>
            <T x={96} y={y + 34} size={11} fill={tok('muted')}>{r.why}</T>
          </g>
        );
      })}
    </Svg>
  );
}
