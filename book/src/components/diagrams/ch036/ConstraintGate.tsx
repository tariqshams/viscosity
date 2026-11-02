import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Four candidate types arrive at the constraint T extends { length: number }.
// string and Particle[] have a numeric length and pass; number and
// Set<string> (which has size, not length) are turned away. A passing type keeps its own exact name on the far side.
const ROWS = [
  { t: 'string', ok: true, out: 'T = string' },
  { t: 'Particle[]', ok: true, out: 'T = Particle[]' },
  { t: 'number', ok: false, out: 'no length at all' },
  { t: 'Set<string>', ok: false, out: 'has size, not length' },
];

export default function ConstraintGate() {
  return (
    <Svg w={400} h={236} title="Types arriving at the constraint T extends { length: number }: string and Particle[] pass, number and Set are rejected">
      <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>ARGUMENT TYPE</T>
      <T x={392} y={14} size={11} weight={700} anchor="end" fill={tok('muted')}>WHAT T BECOMES</T>
      <Box x={150} y={28} w={100} h={196} fill={tok('brand', 0.08)} stroke={tok('brand')}>
        <T x={200} y={46} size={12} mono weight={700} anchor="middle" fill={tok('brand')}>T extends</T>
        <T x={200} y={62} size={12} mono weight={700} anchor="middle" fill={tok('brand')}>{'{ length:'}</T>
        <T x={200} y={78} size={12} mono weight={700} anchor="middle" fill={tok('brand')}>{'number }'}</T>
      </Box>
      {ROWS.map((r, i) => {
        const y = 102 + i * 34;
        const c = r.ok ? tok('safe') : tok('danger');
        return (
          <g key={r.t}>
            <Box x={4} y={y - 13} w={138} h={26} fill={tok('panel')} stroke={tok('ink', 0.4)}>
              <T x={73} y={y} size={11} mono anchor="middle">{r.t}</T>
            </Box>
            <Arrow x1={144} y1={y} x2={r.ok ? 258 : 196} y2={y} color={c} />
            {r.ok ? (
              <T x={262} y={y} size={11} mono fill={c}>✓ {r.out}</T>
            ) : (
              <>
                <T x={206} y={y} size={14} weight={700} fill={c}>✗</T>
                <T x={262} y={y} size={11} mono fill={c}>{r.out}</T>
              </>
            )}
          </g>
        );
      })}
    </Svg>
  );
}
