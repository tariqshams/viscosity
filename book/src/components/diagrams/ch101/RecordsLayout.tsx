import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const PS: [number, number][] = [[0, 1], [5, -1], [9, 2]];

export default function RecordsLayout() {
  return (
    <Svg w={400} h={200} title="Left: ps, a list of three references, each pointing to a small list holding an x and a vx. Right: the same numbers as two lists, xs holding every x and vxs holding every vx.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>A LIST OF RECORDS</T>
      <T x={8} y={34} size={13} mono weight={700}>ps</T>
      {PS.map(([x, vx], k) => {
        const sy = 22 + k * 28;
        const ry = 58 + k * 46;
        return (
          <g key={k}>
            <Box x={36} y={sy} w={26} h={24} fill={tok('panel')} stroke={tok('ink', 0.45)}>
              <circle cx={49} cy={sy + 12} r={3} fill={tok('ink', 0.7)} />
            </Box>
            <Arrow x1={62} y1={sy + 12} x2={96} y2={ry + 12} color={tok('ink', 0.55)} />
            <Box x={100} y={ry} w={40} h={24} fill={tok('f1', 0.15)} stroke={tok('f1')}>
              <T x={120} y={ry + 12} size={13} mono anchor="middle">{x}</T>
            </Box>
            <Box x={142} y={ry} w={40} h={24} fill={tok('f3', 0.15)} stroke={tok('f3')}>
              <T x={162} y={ry + 12} size={13} mono anchor="middle">{vx}</T>
            </Box>
          </g>
        );
      })}
      <line x1={200} y1={20} x2={200} y2={192} stroke={tok('line')} strokeDasharray="4 4" />
      <T x={214} y={12} size={11} weight={700} fill={tok('muted')}>A LIST PER FIELD</T>
      <T x={214} y={52} size={13} mono weight={700}>xs</T>
      {PS.map(([x], k) => (
        <Box key={k} x={252 + k * 44} y={40} w={40} h={24} fill={tok('f1', 0.15)} stroke={tok('f1')}>
          <T x={272 + k * 44} y={52} size={13} mono anchor="middle">{x}</T>
        </Box>
      ))}
      <T x={214} y={104} size={13} mono weight={700}>vxs</T>
      {PS.map(([, vx], k) => (
        <Box key={k} x={252 + k * 44} y={92} w={40} h={24} fill={tok('f3', 0.15)} stroke={tok('f3')}>
          <T x={272 + k * 44} y={104} size={13} mono anchor="middle">{vx}</T>
        </Box>
      ))}
      <T x={214} y={146} size={11} fill={tok('muted')}>position k in each list</T>
      <T x={214} y={160} size={11} fill={tok('muted')}>belongs to particle k</T>
      <T x={8} y={196} size={11} fill={tok('muted')}>each record is a separate small list</T>
    </Svg>
  );
}
