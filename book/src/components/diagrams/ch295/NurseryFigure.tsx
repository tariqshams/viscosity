// Chapter 295: a generational heap with a nursery (eden), survivor space
// and old generation, in HotSpot's terms: objects age by one at each young
// collection they survive and are promoted at the tenuring threshold (15 by
// default). The dots are a picture, not a measurement.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const EDEN = Array.from({ length: 24 }, (_, k) => ({ x: 22 + (k % 6) * 17, y: 66 + Math.floor(k / 6) * 17, live: k % 7 === 2 }));

export default function NurseryFigure() {
  return (
    <Svg w={400} h={226} title="New objects are allocated in the nursery, where most die. A young collection copies survivors into a survivor space, adding one to their age; at the tenuring threshold they are promoted to the old generation.">
      <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>YOUNG GENERATION</T>
      <Box x={8} y={24} w={122} h={140} fill={tok('brand', 0.06)} stroke={tok('brand')}>
        <T x={69} y={42} size={13} weight={700} anchor="middle">nursery</T>
        <T x={69} y={56} size={11} anchor="middle" fill={tok('muted')}>(eden) new objects</T>
        {EDEN.map((d, k) => (
          <circle key={k} cx={d.x} cy={d.y + 6} r={5} fill={d.live ? tok('safe', 0.5) : 'transparent'} stroke={d.live ? tok('safe') : tok('danger', 0.6)} strokeDasharray={d.live ? undefined : '2 2'} />
        ))}
        <T x={69} y={150} size={11} anchor="middle" fill={tok('danger')}>most die here</T>
      </Box>
      <Arrow x1={132} y1={94} x2={156} y2={94} />
      <Box x={158} y={24} w={108} h={140} fill={tok('brand', 0.06)} stroke={tok('brand')}>
        <T x={212} y={42} size={13} weight={700} anchor="middle">survivor</T>
        <T x={212} y={56} size={11} anchor="middle" fill={tok('muted')}>age = minor GCs lived</T>
        {[1, 2, 3].map((a, k) => (
          <g key={a}>
            <circle cx={180} cy={82 + k * 24} r={5} fill={tok('safe', 0.5)} stroke={tok('safe')} />
            <T x={192} y={82 + k * 24} size={11} mono>{`age ${a}`}</T>
          </g>
        ))}
        <T x={212} y={150} size={11} anchor="middle" fill={tok('muted')}>copied each time</T>
      </Box>
      <Arrow x1={268} y1={94} x2={292} y2={94} />
      <Box x={294} y={24} w={98} h={140} fill={tok('panel')} stroke={tok('ink', 0.6)}>
        <T x={343} y={42} size={13} weight={700} anchor="middle">old</T>
        <T x={343} y={56} size={11} anchor="middle" fill={tok('muted')}>promoted</T>
        {[0, 1, 2, 3].map((k) => (
          <circle key={k} cx={318 + (k % 2) * 46} cy={88 + Math.floor(k / 2) * 26} r={5} fill={tok('safe', 0.5)} stroke={tok('safe')} />
        ))}
        <T x={343} y={150} size={11} anchor="middle" fill={tok('muted')}>collected rarely</T>
      </Box>
      <T x={144} y={180} size={11} anchor="middle" fill={tok('muted')}>minor GC</T>
      <T x={280} y={180} size={11} anchor="middle" fill={tok('muted')}>at threshold</T>
      <T x={8} y={204} size={12}>Old-to-young pointers are found through the</T>
      <T x={8} y={220} size={12}>remembered set or card table, never by a search.</T>
    </Svg>
  );
}
