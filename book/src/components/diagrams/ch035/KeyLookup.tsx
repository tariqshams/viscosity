import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// The interface Particle drawn as a two-column table. The left column (the
// names) is what keyof collects into a union; following one name across
// the row to its type is an indexed access, Particle['vx'].
const ROWS: [string, string, string][] = [
  ['x', 'number', 'f1'],
  ['y', 'number', 'f2'],
  ['vx', 'number', 'f3'],
  ['vy', 'number', 'f4'],
];

export default function KeyLookup() {
  const top = 40;
  const rh = 30;
  return (
    <Svg w={400} h={250} title="keyof Particle collects the names column; Particle['vx'] follows one name across to its type">
      <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>interface Particle</T>
      <Box x={4} y={top - 14} w={196} h={rh * ROWS.length + 30} fill={tok('panel')} stroke={tok('ink', 0.4)} />
      <T x={20} y={top} size={11} weight={700} fill={tok('muted')}>NAME</T>
      <T x={112} y={top} size={11} weight={700} fill={tok('muted')}>TYPE</T>
      {ROWS.map(([k, t, f], i) => {
        const y = top + 22 + i * rh;
        const hot = k === 'vx';
        return (
          <g key={k}>
            <Box x={12} y={y - 11} w={72} h={22} r={11} fill={tok(f, 0.18)} stroke={tok(f)}>
              <T x={48} y={y} size={13} mono weight={700} anchor="middle">{`'${k}'`}</T>
            </Box>
            <T x={112} y={y} size={13} mono weight={hot ? 700 : undefined} fill={hot ? tok('brand') : undefined}>{t}</T>
            {hot && <Arrow x1={86} y1={y} x2={106} y2={y} color={tok('brand')} width={1.5} />}
          </g>
        );
      })}
      <T x={216} y={44} size={11} weight={700} fill={tok('muted')}>keyof Particle</T>
      <Box x={212} y={54} w={184} h={34} fill={tok('accent', 0.1)} stroke={tok('accent')}>
        <T x={304} y={71.5} size={12} mono anchor="middle">{"'x' | 'y' | 'vx' | 'vy'"}</T>
      </Box>
      <Arrow x1={86} y1={top + 4} x2={210} y2={66} color={tok('accent')} bend={-0.3} />
      <T x={216} y={120} size={11} weight={700} fill={tok('muted')}>{"Particle['vx']"}</T>
      <Box x={212} y={130} w={184} h={34} fill={tok('brand', 0.1)} stroke={tok('brand')}>
        <T x={304} y={147.5} size={12} mono anchor="middle">number</T>
      </Box>
      <Arrow x1={170} y1={top + 22 + 2 * rh} x2={210} y2={147} color={tok('brand')} />
      <T x={8} y={202} size={12}>keyof reads the whole NAME column, as one union.</T>
      <T x={8} y={222} size={12}>T[K] goes along one row, from a name to its type.</T>
    </Svg>
  );
}
