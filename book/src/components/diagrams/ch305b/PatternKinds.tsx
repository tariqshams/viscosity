import { Box, Svg, T, tok } from '../../viz/svg';

// The kinds of pattern, as a table: what each one fits, and which names
// (if any) it binds for the arm.

const ROWS: [string, string, string][] = [
  ["b'('", 'exactly that byte', '-'],
  ["b'0'..=b'9'", 'any byte from 0 to 9', '-'],
  ['x', 'anything', 'x'],
  ['_', 'anything', '-'],
  ['p | q', 'whatever p or q fits', 'both bind the same'],
  ['(p, q)', 'a pair, part by part', 'names in p and q'],
  ['Value::Number(n)', 'that variant', 'n = its payload'],
  ['Particle { x, .. }', 'any Particle', 'x = its x field'],
];

export default function PatternKinds() {
  const rh = 24;
  return (
    <Svg w={400} h={40 + ROWS.length * rh} title="A table of pattern kinds: the pattern, what it fits and what it binds">
      <T x={6} y={14} size={11} weight={700} fill={tok('muted')}>PATTERN</T>
      <T x={150} y={14} size={11} weight={700} fill={tok('muted')}>FITS</T>
      <T x={290} y={14} size={11} weight={700} fill={tok('muted')}>BINDS</T>
      {ROWS.map(([p, fits, binds], i) => {
        const y = 26 + i * rh;
        return (
          <g key={p}>
            <Box x={2} y={y} w={396} h={rh - 2} r={3} fill={i % 2 ? 'transparent' : tok('brand', 0.06)} stroke="transparent" />
            <T x={6} y={y + rh / 2 - 1} size={11} mono weight={700}>{p}</T>
            <T x={150} y={y + rh / 2 - 1} size={11}>{fits}</T>
            <T x={290} y={y + rh / 2 - 1} size={11} mono={binds !== '-' && binds.length < 12} fill={binds === '-' ? tok('muted') : undefined}>{binds === '-' ? 'nothing' : binds}</T>
          </g>
        );
      })}
    </Svg>
  );
}
