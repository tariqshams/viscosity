// Chapter 221b: three small functions, each analysed once and reduced to a
// one-line summary of what happens to its parameter; callers read the
// summary instead of the body.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const FNS = [
  { code: ['function len(p) {', '  return p.x + p.y;', '}'], tag: 'p: stays inside', c: 'safe' },
  { code: ['function first(p) {', '  return p;', '}'], tag: 'p: flows to result', c: 'warn' },
  { code: ['function keep(p) {', '  saved = p;', '}'], tag: 'p: escapes (global)', c: 'danger' },
];

export default function SummaryPic() {
  return (
    <Svg w={400} h={252} title="Three functions on the left, each with its summary on the right: len keeps p inside, first returns p, keep stores p in a global">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>BODY (READ ONCE)</T>
      <T x={392} y={12} size={11} weight={700} anchor="end" fill={tok('muted')}>SUMMARY (REUSED)</T>
      {FNS.map((f, k) => {
        const y = 24 + k * 74;
        return (
          <g key={k}>
            <Box x={4} y={y} w={190} h={62}>
              {f.code.map((l, j) => (
                <T key={j} x={12} y={y + 14 + j * 17} size={12} mono>{l}</T>
              ))}
            </Box>
            <Arrow x1={196} y1={y + 31} x2={240} y2={y + 31} color={tok(f.c)} />
            <Box x={242} y={y + 14} w={154} h={34} r={8} fill={tok(f.c, 0.12)} stroke={tok(f.c)}>
              <T x={319} y={y + 31} size={12} anchor="middle">{f.tag}</T>
            </Box>
          </g>
        );
      })}
      <T x={200} y={244} size={11} anchor="middle" fill={tok('muted')}>a call site reads the summary; it never re-reads the body</T>
    </Svg>
  );
}
