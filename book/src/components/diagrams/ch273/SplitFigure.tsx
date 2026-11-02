import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 273: an async function cut at each await into three pieces.
// Each piece is the continuation of the await above it.
const PIECES = [
  { y: 30, label: 'state 0', lines: ["get('a')"], c: 'f1' },
  { y: 94, label: 'state 1', lines: ['a = (value)', "get('b')"], c: 'f2' },
  { y: 172, label: 'state 2', lines: ['b = (value)', 'return a + b'], c: 'f3' },
];

export default function SplitFigure() {
  return (
    <Svg w={400} h={250} title="The function total cut at its two awaits into three pieces, state 0, 1 and 2; each piece starts with the value its await was waiting for">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>ONE ASYNC FUNCTION, CUT AT EACH AWAIT</T>
      {PIECES.map((p) => (
        <g key={p.label}>
          <Box x={8} y={p.y} w={220} h={p.lines.length * 20 + 16} fill={tok(p.c, 0.1)} stroke={tok(p.c)}>
            {p.lines.map((l, k) => (
              <T key={l} x={18} y={p.y + 18 + k * 20} size={12} mono>{l}</T>
            ))}
          </Box>
          <T x={236} y={p.y + 14} size={12} weight={700} fill={tok(p.c)}>{p.label}</T>
        </g>
      ))}
      <T x={236} y={52} size={11} fill={tok('muted')}>then return to</T>
      <T x={236} y={66} size={11} fill={tok('muted')}>the event loop</T>
      <T x={236} y={130} size={11} fill={tok('muted')}>then return again</T>
      <Arrow x1={120} y1={64} x2={120} y2={92} color={tok('f1')} />
      <T x={128} y={80} size={11} fill={tok('muted')}>when get('a') settles</T>
      <Arrow x1={120} y1={146} x2={120} y2={170} color={tok('f2')} />
      <T x={128} y={160} size={11} fill={tok('muted')}>when get('b') settles</T>
      <T x={8} y={238} size={11} fill={tok('muted')}>a and b must outlive each piece, so they move off the stack.</T>
    </Svg>
  );
}
