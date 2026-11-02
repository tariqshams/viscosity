import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const MADE = [
  { name: 'a', x: 0, vx: 2 },
  { name: 'b', x: 5, vx: 0 },
  { name: 'c', x: 2, vx: 3 },
];

/** One class, three instances: same properties, different values. */
export default function ClassFactory() {
  return (
    <Svg w={400} h={212} title="A class called Particle at the top, with a constructor that sets x and vx. Three arrows labelled new Particle lead down to three separate objects a, b and c. Each has the same two properties, x and vx, with its own values.">
      <Box x={100} y={6} w={200} h={58} r={8} fill={tok('accent', 0.1)} stroke={tok('accent')}>
        <T x={200} y={22} size={11} weight={700} anchor="middle" fill={tok('accent')}>THE BLUEPRINT (one)</T>
        <T x={200} y={42} size={14} mono weight={700} anchor="middle">class Particle</T>
        <T x={200} y={56} size={11} mono anchor="middle" fill={tok('muted')}>sets this.x, this.vx</T>
      </Box>
      {MADE.map((m, i) => {
        const cx = 66 + i * 134;
        return (
          <g key={m.name}>
            <Arrow x1={200} y1={66} x2={cx} y2={94} color={tok('ink', 0.55)} />
            <T x={cx} y={106} size={11} mono anchor="middle" fill={tok('muted')}>{`new Particle(${m.x}, ${m.vx})`}</T>
            <Box x={cx - 60} y={118} w={120} h={62} r={8} fill={tok('panel')} stroke={tok('ink', 0.5)}>
              <T x={cx - 50} y={132} size={12} mono weight={700}>{m.name}</T>
              <rect x={cx - 52} y={144} width={50} height={26} rx={3} fill={tok('f1', 0.85)} />
              <T x={cx - 47} y={157.5} size={12} mono weight={700} fill={tok('panel')}>x: {m.x}</T>
              <rect x={cx + 2} y={144} width={50} height={26} rx={3} fill={tok('f3', 0.85)} />
              <T x={cx + 6} y={157.5} size={12} mono weight={700} fill={tok('panel')}>vx: {m.vx}</T>
            </Box>
          </g>
        );
      })}
      <T x={200} y={200} size={12} anchor="middle" fill={tok('muted')}>three instances: same properties, same order, own values</T>
    </Svg>
  );
}
