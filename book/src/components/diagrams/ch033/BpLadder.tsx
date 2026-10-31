import { Box, Svg, T, tok } from '../../viz/svg';

const ROWS: [string, number][] = [
  ['or', 1],
  ['and', 2],
  ['==  !=', 3],
  ['<  <=  >  >=', 4],
  ['+  -', 5],
  ['*  /', 6],
  ['-x  !x  (prefix)', 7],
  ['f(…)  a.b', 8],
];

/** Drip's binding powers as bars: longer bars hold their operands tighter. */
export default function BpLadder() {
  const RH = 26;
  return (
    <Svg w={400} h={ROWS.length * RH + 34} title="Drip's binding powers as a bar chart. or 1, and 2, equality 3, comparison 4, plus and minus 5, times and divide 6, prefix minus and not 7, call and dot 8.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>OPERATOR</T>
      <T x={392} y={12} size={11} weight={700} anchor="end" fill={tok('muted')}>BINDING POWER (tighter →)</T>
      {ROWS.map(([ops, bp], k) => {
        const y = 26 + k * RH;
        const w = bp * 26;
        const unary = bp === 7;
        return (
          <g key={k}>
            <T x={8} y={y + RH / 2 - 2} size={13} mono>{ops}</T>
            <Box x={170} y={y + 3} w={w} h={RH - 10} r={3} fill={unary ? tok('accent', 0.25) : tok('brand', 0.12 + bp * 0.07)} stroke={unary ? tok('accent') : tok('brand')} />
            <T x={176 + w} y={y + RH / 2 - 2} size={12} mono weight={700} fill={unary ? tok('accent') : tok('brand')}>{bp}</T>
          </g>
        );
      })}
    </Svg>
  );
}
