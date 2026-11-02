import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// What a method call really is: for each of the three receivers, the dot
// call on the left becomes an ordinary call of the associated function on
// the right, with the borrow (or the move) Rust adds for you.

const ROWS = [
  { call: 'p.speed()', full: 'Particle::speed(&p)', recv: '&self', need: 'any p; p is lent', c: 'safe' },
  { call: 'p.step(1.0)', full: 'Particle::step(&mut p, 1.0)', recv: '&mut self', need: 'let mut p; lent to change', c: 'warn' },
  { call: 'p.stopped()', full: 'Particle::stopped(p)', recv: 'self', need: 'p is moved in, gone after', c: 'brand' },
];

export default function CallSugar() {
  return (
    <Svg w={400} h={230} title="Three method calls and the ordinary function calls they stand for">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>YOU WRITE</T>
      <T x={170} y={12} size={11} weight={700} fill={tok('muted')}>RUST CALLS</T>
      {ROWS.map((r, i) => {
        const y = 26 + i * 68;
        return (
          <g key={r.call}>
            <Box x={6} y={y} w={120} h={30} r={4} fill={tok(r.c, 0.12)} stroke={tok(r.c)}>
              <T x={14} y={y + 15} size={12} mono weight={700}>{r.call}</T>
            </Box>
            <Arrow x1={130} y1={y + 15} x2={164} y2={y + 15} color={tok(r.c)} />
            <Box x={168} y={y} w={226} h={30} r={4} fill={tok('panel')} stroke={tok(r.c)}>
              <T x={176} y={y + 15} size={12} mono>{r.full}</T>
            </Box>
            <T x={14} y={y + 46} size={11} mono fill={tok(r.c)} weight={700}>{r.recv}</T>
            <T x={176} y={y + 46} size={11} fill={tok('muted')}>{r.need}</T>
          </g>
        );
      })}
    </Svg>
  );
}
