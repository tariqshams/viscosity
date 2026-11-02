import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 267: three physical lines become two logical lines, because the
// tokenizer's bracket depth (frontend-python/src/tokens.ts) is above 0 at
// the end of the first one. Token output checked with tokenize() on this
// exact source.
const ROWS = [
  { text: 'ps.append(P(float(i),', depth: 2, nl: false },
  { text: '            1.0))', depth: 0, nl: true },
  { text: 'print(ps)', depth: 0, nl: true },
];

export default function BracketJoin() {
  return (
    <Svg w={400} h={250} title="Three physical lines. After the first, two brackets are still open, so its line end makes no NEWLINE and the next line's spaces are not measured. After the second, depth is back to 0 and a NEWLINE is emitted. The result is two logical lines: the whole append call, and print(ps).">
      <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>PHYSICAL LINES</T>
      <T x={300} y={12} size={11} weight={700} fill={tok('muted')}>DEPTH AFTER</T>
      {ROWS.map((r, k) => (
        <g key={k}>
          <Box x={6} y={22 + k * 34} w={280} h={28} fill={k < 2 ? tok('f1', 0.12) : tok('f3', 0.12)} stroke={k < 2 ? tok('f1') : tok('f3')}>
            <T x={14} y={36 + k * 34} size={12} mono>{r.text}</T>
          </Box>
          <Box x={300} y={22 + k * 34} w={30} h={28} fill={r.depth ? tok('f6', 0.2) : tok('panel')} stroke={r.depth ? tok('f6') : tok('line')}>
            <T x={315} y={36 + k * 34} size={13} mono anchor="middle" weight={700}>{r.depth}</T>
          </Box>
          <T x={338} y={36 + k * 34} size={11} mono fill={r.nl ? tok('ink') : tok('muted')}>{r.nl ? 'NEWLINE' : 'no NL'}</T>
        </g>
      ))}
      <Arrow x1={146} y1={124} x2={146} y2={146} />
      <T x={6} y={160} size={11} weight={700} fill={tok('muted')}>LOGICAL LINES (what the parser gets)</T>
      <Box x={6} y={170} w={388} h={28} fill={tok('f1', 0.12)} stroke={tok('f1')}>
        <T x={14} y={184} size={12} mono>ps.append(P(float(i), 1.0)) NEWLINE</T>
      </Box>
      <Box x={6} y={204} w={388} h={28} fill={tok('f3', 0.12)} stroke={tok('f3')}>
        <T x={14} y={218} size={12} mono>print(ps) NEWLINE</T>
      </Box>
      <T x={200} y={244} size={11} anchor="middle" fill={tok('muted')}>inside brackets, line ends and leading spaces mean nothing</T>
    </Svg>
  );
}
