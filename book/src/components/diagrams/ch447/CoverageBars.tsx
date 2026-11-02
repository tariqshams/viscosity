import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 447: line coverage of the TypeScript engine (core and
// frontend-js, without the two unused parsers), measured with c8 10.1.3
// and NODE_V8_COVERAGE at commit c68daec when this chapter was first
// written: lines run, of 2,614. Bars start at zero, so the plateau is
// visible as it really is.
const ROWS: { label: string; n: number; hi?: boolean }[] = [
  { label: '66 hand-written programs', n: 2503 },
  { label: 'fuzzer, 300 programs', n: 2430, hi: true },
  { label: 'fuzzer, 3,000 programs', n: 2433, hi: true },
];
const TOTAL = 2614;
const W = 300;

export default function CoverageBars() {
  return (
    <Svg w={400} h={208} title="Lines of the TypeScript engine run by the hand-written programs and by two fuzzing runs">
      {ROWS.map((r, k) => {
        const y = 14 + k * 56;
        const w = (r.n / TOTAL) * W;
        return (
          <g key={r.label}>
            <T x={10} y={y + 6} size={12} fill={tok('muted')}>{r.label}</T>
            <Box x={10} y={y + 16} w={W} h={20} r={2} fill={tok('ink', 0.05)} stroke={tok('line')} />
            <Box x={10} y={y + 16} w={w} h={20} r={2} fill={r.hi ? tok('brand', 0.35) : tok('ink', 0.25)} stroke={r.hi ? tok('brand') : tok('ink', 0.5)} />
            <T x={W + 18} y={y + 26} size={12} mono>{r.n.toLocaleString('en-GB')}</T>
          </g>
        );
      })}
      <T x={10} y={188} size={12} fill={tok('muted')}>whole bar: all 2,614 lines</T>
      <T x={10} y={204} size={12} fill={tok('muted')}>ten times the programs: 3 more lines</T>
    </Svg>
  );
}
