// Chapter 294: V8's heap by age, as "Trash talk" (2019) and "Orinoco:
// young generation garbage collection" (2017) describe it. Objects are
// allocated in the nursery; one that survives a scavenge becomes
// intermediate; one that survives a second is promoted to the old
// generation. Most objects die in the nursery. The dots are a picture,
// not a measurement.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const DOTS = Array.from({ length: 18 }, (_, k) => ({ x: 22 + (k % 6) * 16, y: 76 + Math.floor(k / 6) * 16, dead: k % 5 !== 0 }));

export default function Generations() {
  return (
    <Svg w={400} h={232} title="Objects start in the nursery, where most die. Survivors of one scavenge move to the intermediate part; survivors of a second are promoted to the old generation, which Mark-Compact collects.">
      <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>YOUNG GENERATION (SCAVENGER)</T>
      <Box x={8} y={26} w={124} h={128} fill={tok('brand', 0.06)} stroke={tok('brand')}>
        <T x={70} y={44} size={13} weight={700} anchor="middle">nursery</T>
        <T x={70} y={60} size={11} anchor="middle" fill={tok('muted')}>new objects</T>
        {DOTS.map((d, k) => (
          <g key={k}>
            <circle cx={d.x + 6} cy={d.y + 6} r={5} fill={d.dead ? 'transparent' : tok('safe', 0.5)} stroke={d.dead ? tok('danger', 0.6) : tok('safe')} strokeDasharray={d.dead ? '2 2' : undefined} />
          </g>
        ))}
        <T x={70} y={140} size={11} anchor="middle" fill={tok('danger')}>most die here</T>
      </Box>
      <Arrow x1={134} y1={90} x2={160} y2={90} />
      <Box x={162} y={26} w={100} h={128} fill={tok('brand', 0.06)} stroke={tok('brand')}>
        <T x={212} y={44} size={13} weight={700} anchor="middle">intermediate</T>
        <T x={212} y={60} size={11} anchor="middle" fill={tok('muted')}>survived one</T>
        {[0, 1, 2].map((k) => (
          <circle key={k} cx={190 + k * 22} cy={96} r={5} fill={tok('safe', 0.5)} stroke={tok('safe')} />
        ))}
      </Box>
      <Arrow x1={264} y1={90} x2={290} y2={90} />
      <Box x={292} y={26} w={100} h={128} fill={tok('panel')} stroke={tok('ink', 0.6)}>
        <T x={342} y={44} size={13} weight={700} anchor="middle">old</T>
        <T x={342} y={60} size={11} anchor="middle" fill={tok('muted')}>survived two</T>
        {[0, 1].map((k) => (
          <circle key={k} cx={330 + k * 24} cy={96} r={5} fill={tok('safe', 0.5)} stroke={tok('safe')} />
        ))}
      </Box>
      <T x={147} y={172} size={11} anchor="middle" fill={tok('muted')}>scavenge</T>
      <T x={277} y={172} size={11} anchor="middle" fill={tok('muted')}>scavenge</T>
      <T x={8} y={200} size={12}>Young space is small and emptied often, by copying.</T>
      <T x={8} y={220} size={12}>Old space is big and collected rarely, by marking.</T>
    </Svg>
  );
}
