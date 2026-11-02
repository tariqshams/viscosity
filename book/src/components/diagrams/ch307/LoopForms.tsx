import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// The three ways to loop over a Vec, as the three receivers again: lend
// each element to read, lend it to change, or hand the elements over and
// use the Vec up.

const ROWS = [
  { code: 'for x in &v', x: 'x: &f64', after: 'v unchanged, still yours', c: 'safe' },
  { code: 'for x in &mut v', x: 'x: &mut f64', after: '*x += 1.0 changes v', c: 'warn' },
  { code: 'for x in v', x: 'x: f64', after: 'v is used up (moved)', c: 'brand' },
];

export default function LoopForms() {
  return (
    <Svg w={400} h={200} title="Three loops over a Vec: borrowing each element, borrowing it mutably, or taking it">
      <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>YOU WRITE</T>
      <T x={170} y={12} size={11} weight={700} fill={tok('muted')}>EACH x IS</T>
      <T x={270} y={12} size={11} weight={700} fill={tok('muted')}>AFTERWARDS</T>
      {ROWS.map((r, i) => {
        const y = 26 + i * 58;
        return (
          <g key={r.code}>
            <Box x={4} y={y} w={140} h={34} r={4} fill={tok(r.c, 0.12)} stroke={tok(r.c)}>
              <T x={12} y={y + 17} size={12} mono weight={700}>{r.code}</T>
            </Box>
            <Arrow x1={148} y1={y + 17} x2={166} y2={y + 17} color={tok(r.c)} />
            <T x={170} y={y + 17} size={12} mono>{r.x}</T>
            <T x={270} y={y + 10} size={11}>{r.after.split(', ')[0]}</T>
            {r.after.includes(', ') && <T x={270} y={y + 26} size={11} fill={tok('muted')}>{r.after.split(', ')[1]}</T>}
          </g>
        );
      })}
    </Svg>
  );
}
