// Chapter 224: Viscosity's fixed pipeline (packages/core/src/index.ts):
// plugin.lower, analyze, plan, plugin.emit. Inside analyze, the numbered
// stages of packages/core/src/analysis.ts run in a hand-written order, and
// one of them (the index check) is written down early and done later.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const STAGES = [
  '1 candidate collections',
  '2 shapes and uses',
  '3 numeric inference',
  '4 element uses',
  '5 bounds, loops, sizes',
  '6 right-hand sides',
];

export default function ViscosityPipeline() {
  return (
    <Svg w={400} h={262} title="Viscosity's pipeline: lower, then analyze with six stages inside, then plan, then emit; nothing changes the IR after lowering">
      <Box x={8} y={8} w={86} h={30} fill={tok('brand', 0.12)} stroke={tok('brand')}>
        <T x={51} y={23} size={12.5} mono anchor="middle">lower</T>
      </Box>
      <Arrow x1={94} y1={23} x2={118} y2={23} />
      <Box x={120} y={8} w={164} h={226} fill={tok('panel')} stroke={tok('accent')}>
        <T x={202} y={23} size={12.5} mono anchor="middle" weight={700}>analyze</T>
      </Box>
      {STAGES.map((s, k) => (
        <Box key={s} x={130} y={40 + k * 31} w={144} h={25} fill={k === 2 ? tok('accent', 0.12) : 'transparent'} stroke={tok('line')}>
          <T x={138} y={52 + k * 31} size={11.5}>{s}</T>
        </Box>
      ))}
      <Arrow x1={276} y1={83} x2={276} y2={127} color={tok('warn')} bend={-0.8} dash />
      <T x={290} y={92} size={11} fill={tok('warn')}>index</T>
      <T x={290} y={106} size={11} fill={tok('warn')}>checks</T>
      <T x={290} y={120} size={11} fill={tok('warn')}>deferred</T>
      <Arrow x1={284} y1={23} x2={306} y2={23} />
      <Box x={308} y={8} w={84} h={30} fill={tok('brand', 0.12)} stroke={tok('brand')}>
        <T x={350} y={23} size={12.5} mono anchor="middle">plan</T>
      </Box>
      <Arrow x1={350} y1={38} x2={350} y2={140} />
      <Box x={308} y={142} w={84} h={30} fill={tok('brand', 0.12)} stroke={tok('brand')}>
        <T x={350} y={157} size={12.5} mono anchor="middle">emit</T>
      </Box>
      <T x={200} y={252} size={11} anchor="middle" fill={tok('muted')}>After lower, nothing changes the IR: every stage only reads it.</T>
    </Svg>
  );
}
