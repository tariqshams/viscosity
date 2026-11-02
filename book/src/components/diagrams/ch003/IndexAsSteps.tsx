import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

/** The index counts steps from the start of the array, which is why it begins at 0. */
export default function IndexAsSteps() {
  const values = [90, 72, 85, 64];
  return (
    <Svg w={400} h={160} title="Four slots in a row. Slot 0 starts right at the start of the array, slot 1 is one step along, slot 2 two steps, slot 3 three steps.">
      <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>THE ARRAY STARTS HERE</T>
      <Arrow x1={20} y1={22} x2={20} y2={38} color={tok('brand')} />
      {values.map((v, i) => {
        const x = 12 + i * 94;
        return (
          <g key={i}>
            <Box x={x} y={42} w={86} h={44} fill={tok('panel')} stroke={tok('ink', 0.45)}>
              <T x={x + 43} y={64} size={18} mono anchor="middle">{v}</T>
            </Box>
            <T x={x + 43} y={100} size={12} mono anchor="middle" fill={tok('brand')} weight={700}>[{i}]</T>
            {i > 0 && <Arrow x1={x - 94 + 8} y1={120} x2={x + 8} y2={120} bend={-0.6} color={tok('f2')} width={1.5} />}
          </g>
        );
      })}
      <T x={20} y={142} size={11} anchor="middle" fill={tok('muted')}>0 steps</T>
      <T x={114} y={142} size={11} anchor="middle" fill={tok('muted')}>1 step</T>
      <T x={208} y={142} size={11} anchor="middle" fill={tok('muted')}>2 steps</T>
      <T x={302} y={142} size={11} anchor="middle" fill={tok('muted')}>3 steps</T>
    </Svg>
  );
}
