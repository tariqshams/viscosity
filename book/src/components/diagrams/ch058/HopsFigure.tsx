// Chapter 58: at runtime, a recorded distance is a number of parent hops.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const ENVS = [
  { label: 'inner() call', row: '(no names)', d: 0 },
  { label: 'block', row: 'b = 2, inner', d: 1 },
  { label: 'outer() call', row: 'a = 1', d: 2 },
  { label: 'globals', row: 'outer', d: null },
];

export default function HopsFigure() {
  return (
    <Svg w={400} h={232} title="Four environments in a chain: the inner call, the block, the outer call, and the globals. a is two hops up from the inner call, b is one hop up.">
      {ENVS.map((e, k) => {
        const y = 8 + k * 56;
        const hot = e.d === 1 || e.d === 2;
        return (
          <g key={e.label}>
            <Box x={6} y={y} w={190} h={42} fill={hot ? tok('brand', 0.1) : tok('panel')} stroke={hot ? tok('brand') : tok('line')}>
              <T x={14} y={y + 13} size={11} weight={700} fill={tok('muted')}>{e.label}</T>
              <T x={14} y={y + 30} size={13} mono>{e.row}</T>
            </Box>
            {k < ENVS.length - 1 && <Arrow x1={100} y1={y + 42} x2={100} y2={y + 56} />}
            {e.d !== null && (
              <T x={206} y={y + 21} size={13} mono fill={hot ? tok('brand') : tok('muted')}>
                ancestor({e.d}){e.d === 1 ? ' has b' : e.d === 2 ? ' has a' : ''}
              </T>
            )}
          </g>
        );
      })}
    </Svg>
  );
}
