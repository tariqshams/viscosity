import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 315: the same three Drip objects (two instances that point at
// each other, and their class) drawn two ways. Top: the TypeScript VM's
// heap, where fields hold references (pointers). Bottom: drip-rs's heap,
// one arena per kind of object, where fields hold slot numbers.
export default function GraphVsArena() {
  return (
    <Svg w={400} h={262} title="Objects linked by pointers, and the same objects in two arenas linked by slot numbers">
      <T x={8} y={14} size={12} weight={700} fill={tok('muted')}>TYPESCRIPT VM: fields hold references</T>
      <Box x={20} y={28} w={96} h={40} fill={tok('panel')} stroke={tok('f1')}>
        <T x={68} y={42} size={12} mono anchor="middle">Instance a</T>
        <T x={68} y={58} size={11} mono anchor="middle" fill={tok('muted')}>.other ●</T>
      </Box>
      <Box x={170} y={28} w={96} h={40} fill={tok('panel')} stroke={tok('f1')}>
        <T x={218} y={42} size={12} mono anchor="middle">Instance b</T>
        <T x={218} y={58} size={11} mono anchor="middle" fill={tok('muted')}>.other ●</T>
      </Box>
      <Box x={300} y={28} w={90} h={40} fill={tok('panel')} stroke={tok('f2')}>
        <T x={345} y={48} size={12} mono anchor="middle">Class Ship</T>
      </Box>
      <Arrow x1={100} y1={58} x2={168} y2={46} color={tok('brand')} />
      <Arrow x1={250} y1={60} x2={118} y2={62} color={tok('brand')} bend={-0.3} />
      <T x={8} y={102} size={11} fill={tok('muted')}>a cycle of pointers: who owns whom?</T>

      <line x1={4} y1={116} x2={396} y2={116} stroke={tok('line')} strokeWidth={1} />

      <T x={8} y={134} size={12} weight={700} fill={tok('muted')}>DRIP-RS: one arena per kind, fields hold numbers</T>
      <T x={8} y={173} size={11} mono fill={tok('f1')}>instances</T>
      {['a: other=1', 'b: other=0'].map((t, k) => (
        <g key={t}>
          <T x={132 + k * 112} y={150} size={11} mono anchor="middle" fill={tok('muted')}>{k}</T>
          <Box x={80 + k * 112} y={158} w={104} h={30} fill={tok('f1', 0.1)} stroke={tok('f1')}>
            <T x={132 + k * 112} y={173} size={12} mono anchor="middle">{t}</T>
          </Box>
        </g>
      ))}
      <T x={8} y={229} size={11} mono fill={tok('f2')}>classes</T>
      <T x={132} y={206} size={11} mono anchor="middle" fill={tok('muted')}>0</T>
      <Box x={80} y={214} w={104} h={30} fill={tok('f2', 0.1)} stroke={tok('f2')}>
        <T x={132} y={229} size={12} mono anchor="middle">Ship</T>
      </Box>
      <T x={200} y={226} size={11} fill={tok('muted')}>the heap owns every object;</T>
      <T x={200} y={242} size={11} fill={tok('muted')}>a cycle is two numbers</T>
    </Svg>
  );
}
