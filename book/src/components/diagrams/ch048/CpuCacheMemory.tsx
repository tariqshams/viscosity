import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

/** Where values can be: in a register inside the CPU, in a small cache
 *  next to it holding copies of recently used memory, or out in main
 *  memory, which holds everything but is far slower to reach. */
export default function CpuCacheMemory() {
  return (
    <Svg w={400} h={192} title="The CPU with four registers inside it, a small cache beside it holding copies of a few memory values, and a large main memory further away holding everything">
      <Box x={6} y={20} w={112} h={120} r={8} stroke={tok('brand')} fill={tok('brand', 0.06)}>
        <T x={62} y={36} size={12} weight={700} anchor="middle" fill={tok('brand')}>CPU</T>
        {['r0', 'r1', 'r2', 'r3'].map((r, k) => (
          <g key={r}>
            <rect x={16 + (k % 2) * 48} y={50 + Math.floor(k / 2) * 40} width={44} height={32} rx={4} fill={tok('paper')} stroke={tok('ink', 0.45)} />
            <T x={38 + (k % 2) * 48} y={66 + Math.floor(k / 2) * 40} size={12} mono anchor="middle">{r}</T>
          </g>
        ))}
      </Box>
      <T x={62} y={156} size={11} anchor="middle" fill={tok('muted')}>registers:</T>
      <T x={62} y={170} size={11} anchor="middle" fill={tok('muted')}>a few values,</T>
      <T x={62} y={184} size={11} anchor="middle" fill={tok('muted')}>almost free</T>

      <Box x={150} y={40} w={80} h={80} r={6} stroke={tok('safe')} fill={tok('safe', 0.08)}>
        <T x={190} y={56} size={12} weight={700} anchor="middle">cache</T>
        {['16: 2.5', '24: 4'].map((v, k) => (
          <T key={v} x={190} y={80 + k * 20} size={11} mono anchor="middle">{v}</T>
        ))}
      </Box>
      <T x={190} y={156} size={11} anchor="middle" fill={tok('muted')}>copies of</T>
      <T x={190} y={170} size={11} anchor="middle" fill={tok('muted')}>recent data,</T>
      <T x={190} y={184} size={11} anchor="middle" fill={tok('muted')}>small, close</T>

      <Box x={268} y={8} w={126} h={144} r={6} stroke={tok('ink', 0.5)} fill={tok('muted', 0.1)}>
        <T x={331} y={24} size={12} weight={700} anchor="middle">main memory</T>
        {['16: 2.5', '24: 4', '32: 1.5', '…', 'everything'].map((v, k) => (
          <T key={k} x={331} y={48 + k * 20} size={11} mono anchor="middle">{v}</T>
        ))}
      </Box>
      <T x={331} y={170} size={11} anchor="middle" fill={tok('muted')}>huge, far,</T>
      <T x={331} y={184} size={11} anchor="middle" fill={tok('muted')}>slow to reach</T>

      <Arrow x1={148} y1={80} x2={120} y2={80} color={tok('safe')} />
      <Arrow x1={266} y1={80} x2={232} y2={80} color={tok('danger')} dash />
      <T x={134} y={96} size={11} anchor="middle" fill={tok('safe')}>quick</T>
      <T x={249} y={96} size={11} anchor="middle" fill={tok('danger')}>slow</T>
    </Svg>
  );
}
