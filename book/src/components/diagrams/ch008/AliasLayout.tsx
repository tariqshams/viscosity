import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const XS = [0, 5, 9];

/** Why aliasing blocks a layout change: an outside name still expects an object. */
export default function AliasLayout() {
  return (
    <Svg w={400} h={236} title="Top: an array of three particle objects, with the variable first pointing at the object in slot 0. Bottom: the same x values moved into one array; first no longer has an object to point at, so first.x = 100 must be turned into a write to slot 0 of the x array.">
      <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>BEFORE: AN ARRAY OF OBJECTS</T>
      <Box x={6} y={22} w={60} h={78} r={6} stroke={tok('ink', 0.45)}>
        <T x={36} y={36} size={12} mono weight={700} anchor="middle">ps</T>
        {[0, 1, 2].map((k) => (
          <g key={k}>
            <T x={14} y={54 + k * 18} size={11} mono fill={tok('muted')}>[{k}]</T>
            <circle cx={52} cy={54 + k * 18} r={3.5} fill={tok('ink', 0.8)} />
            <Arrow x1={52} y1={54 + k * 18} x2={150} y2={36 + k * 30} />
          </g>
        ))}
      </Box>
      {XS.map((x, k) => (
        <Box key={k} x={152} y={24 + k * 30} w={92} h={24} fill={tok('f1', 0.12)} stroke={tok('f1')}>
          <T x={198} y={36.5 + k * 30} size={13} mono anchor="middle">{`{ x: ${x} }`}</T>
        </Box>
      ))}
      <Box x={318} y={20} w={72} h={30} stroke={tok('brand')}>
        <T x={330} y={35.5} size={14} mono weight={700} fill={tok('brand')}>first</T>
      </Box>
      <Arrow x1={318} y1={35} x2={246} y2={36} color={tok('brand')} />
      <T x={262} y={78} size={12} fill={tok('muted')}>first and ps[0]</T>
      <T x={262} y={94} size={12} fill={tok('muted')}>are aliases</T>

      <line x1={6} x2={394} y1={118} y2={118} stroke={tok('line')} strokeWidth={1.5} strokeDasharray="4 4" />

      <T x={6} y={136} size={11} weight={700} fill={tok('muted')}>AFTER: ONE ARRAY PER FIELD</T>
      <T x={6} y={164} size={13} mono weight={700} fill={tok('f1')}>x</T>
      {XS.map((x, k) => (
        <Box key={k} x={24 + k * 46} y={150} w={40} h={28} fill={tok('f1', 0.12)} stroke={tok('f1')}>
          <T x={44 + k * 46} y={164.5} size={14} mono anchor="middle">{x}</T>
        </Box>
      ))}
      <Box x={318} y={148} w={72} h={30} dash stroke={tok('danger')}>
        <T x={330} y={163.5} size={14} mono weight={700} fill={tok('danger')}>first</T>
      </Box>
      <Arrow x1={318} y1={163} x2={44} y2={180} color={tok('danger')} dash bend={-0.25} />
      <T x={6} y={204} size={12} fill={tok('ink')}>first.x = 100 must now become x[0] = 100,</T>
      <T x={6} y={222} size={12} fill={tok('ink')}>so Viscosity has to know every arrow like first.</T>
    </Svg>
  );
}
