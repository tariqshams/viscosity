// Chapter 203-b (staged split of 188): liveness in one block, read from the
// bottom up. Each line shows the variables live just after it.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const ROWS = [
  { code: 'x = 1', after: '{ }', dead: true },
  { code: 'x = 2', after: '{ x }' },
  { code: 'y = x + 1', after: '{ y }' },
  { code: 'print y', after: '{ }' },
];

export default function BackwardBlock() {
  const RH = 40;
  return (
    <Svg w={400} h={ROWS.length * RH + 34} title="Four lines of code with the set of live variables after each; an arrow on the right points upwards, and the first line is marked as a dead store.">
      <T x={12} y={12} size={11} weight={700} fill={tok('muted')}>CODE</T>
      <T x={186} y={12} size={11} weight={700} fill={tok('muted')}>LIVE AFTER</T>
      {ROWS.map((r, k) => {
        const y = 24 + k * RH;
        return (
          <g key={k}>
            <Box x={8} y={y} w={164} h={RH - 10} fill={r.dead ? tok('danger', 0.1) : tok('panel')} stroke={r.dead ? tok('danger') : tok('line')}>
              <T x={18} y={y + (RH - 10) / 2} size={13} mono>{r.code}</T>
            </Box>
            <T x={186} y={y + (RH - 10) / 2} size={13} mono fill={tok('brand')} weight={700}>{r.after}</T>
            {r.dead && <T x={250} y={y + (RH - 10) / 2} size={12} weight={700} fill={tok('danger')}>dead store</T>}
          </g>
        );
      })}
      <Arrow x1={370} y1={ROWS.length * RH + 14} x2={370} y2={30} color={tok('accent')} />
      <T x={362} y={ROWS.length * RH + 26} size={11} anchor="end" fill={tok('accent')}>walk upwards</T>
    </Svg>
  );
}
