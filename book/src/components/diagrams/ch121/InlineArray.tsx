import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Top: a Rust array of three Particle structs, stored inline, 32 bytes
// each, so element n starts at n × 32. Bottom: a JavaScript array of
// three particle objects, which holds three references to objects that
// live elsewhere on the heap.

const FIELDS = ['x', 'y', 'vx', 'vy'];
const COLS = ['f1', 'f2', 'f3', 'f4'];

export default function InlineArray() {
  const cell = 30;
  return (
    <Svg w={400} h={250} title="A Rust array of structs stored inline, compared with a JavaScript array of references to separate objects">
      <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>RUST: [Particle; 3], ONE BLOCK OF 96 BYTES</T>
      {[0, 1, 2].map((n) => (
        <g key={n}>
          {FIELDS.map((f, i) => (
            <Box key={f} x={6 + n * 128 + i * cell + 1} y={26} w={cell - 2} h={34} r={2} fill={tok(COLS[i], 0.18)} stroke={tok(COLS[i])}>
              <T x={6 + n * 128 + i * cell + cell / 2} y={43} size={11} mono anchor="middle">{f}</T>
            </Box>
          ))}
          <T x={6 + n * 128 + 60} y={74} size={11} mono anchor="middle" fill={tok('muted')}>ps[{n}] at {n * 32}</T>
        </g>
      ))}
      <T x={6} y={98} size={12}>No pointers: element n starts n × 32 bytes in.</T>

      <T x={6} y={130} size={11} weight={700} fill={tok('muted')}>JAVASCRIPT: AN ARRAY OF THREE OBJECTS</T>
      {[0, 1, 2].map((n) => (
        <Box key={n} x={6 + n * 40} y={144} w={36} h={30} r={2} fill={tok('panel')} stroke={tok('ink', 0.5)}>
          <T x={24 + n * 40} y={159} size={11} mono anchor="middle">ref</T>
        </Box>
      ))}
      {[0, 1, 2].map((n) => {
        const ox = 160 + n * 80;
        const oy = n === 1 ? 196 : 150;
        return (
          <g key={n}>
            <Box x={ox} y={oy} w={72} h={40} r={4} fill={tok('accent', 0.1)} stroke={tok('accent')}>
              <T x={ox + 36} y={oy + 14} size={11} mono anchor="middle">{'{x, y,'}</T>
              <T x={ox + 36} y={oy + 28} size={11} mono anchor="middle">{' vx, vy}'}</T>
            </Box>
            <Arrow x1={24 + n * 40} y1={176} x2={ox + 4} y2={oy + 20} color={tok('ink', 0.5)} bend={n === 1 ? -0.2 : 0.25} width={1.5} />
          </g>
        );
      })}
      <T x={6} y={242} size={12}>Each object lives elsewhere; reading one follows a pointer.</T>
    </Svg>
  );
}
