// Chapter 113: self is an ordinary variable. The resolver
// wraps a class's methods in one scope declaring self; at run time, bind
// makes the matching environment, so the recorded distance (1) lands on it.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const LEFT = [
  { title: 'taste’s own scope', row: '(no parameters)' },
  { title: 'class scope', row: 'self' },
  { title: 'top level', row: '(globals: not tracked)' },
];
const RIGHT = [
  { title: 'taste() call env', row: '(no parameters)' },
  { title: 'bind env', row: 'self = c' },
  { title: 'globals', row: 'Cake, c' },
];

export default function SelfScopes() {
  const rowH = 62;
  return (
    <Svg w={400} h={3 * rowH + 34} title="Left, the resolver's scopes while it resolves the body of taste: taste's own scope, then the class scope holding self, then the top level. Right, the environments when c.taste() runs: the call's environment, the bind environment holding self, then the globals. self is one step out on both sides.">
      <T x={6} y={10} size={11} weight={700} fill={tok('muted')}>RESOLVER (before running)</T>
      <T x={214} y={10} size={11} weight={700} fill={tok('muted')}>INTERPRETER (c.taste())</T>
      {LEFT.map((l, i) => {
        const y = 22 + i * rowH;
        const hot = i === 1;
        return (
          <g key={l.title}>
            <Box x={6} y={y} w={180} h={44} fill={hot ? tok('brand', 0.1) : tok('panel')} stroke={hot ? tok('brand') : tok('line')} dash={i === 2}>
              <T x={16} y={y + 14} size={11} weight={700} fill={hot ? tok('brand') : tok('muted')}>{l.title}</T>
              <T x={16} y={y + 32} size={12.5} mono>{l.row}</T>
            </Box>
            {i < 2 && <Arrow x1={96} y1={y + 44} x2={96} y2={y + rowH} />}
            <Box x={214} y={y} w={180} h={44} fill={hot ? tok('brand', 0.1) : tok('panel')} stroke={hot ? tok('brand') : tok('line')}>
              <T x={224} y={y + 14} size={11} weight={700} fill={hot ? tok('brand') : tok('muted')}>{RIGHT[i].title}</T>
              <T x={224} y={y + 32} size={12.5} mono>{RIGHT[i].row}</T>
            </Box>
            {i < 2 && <Arrow x1={304} y1={y + 44} x2={304} y2={y + rowH} />}
            <line x1={188} x2={212} y1={y + 22} y2={y + 22} stroke={tok('ink', 0.35)} strokeDasharray="3 3" />
          </g>
        );
      })}
      <T x={6} y={3 * rowH + 26} size={12} fill={tok('muted')}>self: recorded as 1 step out, and 1 step out at run time</T>
    </Svg>
  );
}
