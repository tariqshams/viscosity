import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Three particles built the same way share one map. Each object holds a
// pointer to the map and its own values; the names live once, in the
// map's descriptor array (V8 blog, "Fast properties in V8", 2017). The
// in-object layout matches %DebugPrint of { x, vx } in Node v22.23.4.
const OBJS = [
  { n: 'ps[0]', x: '0', vx: '1' },
  { n: 'ps[1]', x: '1', vx: '1' },
  { n: 'ps[2]', x: '2', vx: '1' },
];

export default function ShapeShare() {
  return (
    <Svg w={400} h={200} title="Three objects on the left, each a small box with a map pointer and two values. All three map pointers lead to one map on the right, whose descriptor array says x is field 0 and vx is field 1.">
      {OBJS.map((o, k) => {
        const y = 14 + k * 62;
        return (
          <g key={o.n}>
            <T x={8} y={y + 6} size={11} mono fill={tok('muted')}>{o.n}</T>
            <Box x={8} y={y + 14} w={60} h={32} fill={tok('panel')}>
              <T x={38} y={y + 30} size={11} anchor="middle" fill={tok('muted')}>map</T>
            </Box>
            <Box x={70} y={y + 14} w={50} h={32} fill={tok('f1', 0.18)} stroke={tok('f1')}>
              <T x={95} y={y + 30} size={13} mono anchor="middle">{o.x}</T>
            </Box>
            <Box x={122} y={y + 14} w={50} h={32} fill={tok('f3', 0.18)} stroke={tok('f3')}>
              <T x={147} y={y + 30} size={13} mono anchor="middle">{o.vx}</T>
            </Box>
            <Arrow x1={174} y1={y + 30} x2={244} y2={92} color={tok('ink', 0.5)} bend={0} width={1.5} />
          </g>
        );
      })}
      <Box x={246} y={40} w={146} h={120} fill={tok('brand', 0.08)} stroke={tok('brand')}>
        <T x={319} y={56} size={13} weight={700} anchor="middle" fill={tok('brand')}>one map</T>
        <T x={256} y={78} size={11} fill={tok('muted')}>descriptors:</T>
        <T x={256} y={98} size={12} mono fill={tok('f1')}>x  → field 0</T>
        <T x={256} y={116} size={12} mono fill={tok('f3')}>vx → field 1</T>
        <T x={256} y={140} size={11} fill={tok('muted')}>names stored once</T>
      </Box>
      <T x={8} y={196} size={11} fill={tok('muted')}>each object: a map pointer + its own values</T>
    </Svg>
  );
}
