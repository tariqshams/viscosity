// Chapter 86: a generational heap (a sketch; the companion VM's heap has
// one generation). New objects start young; a minor collection traces only
// the young generation, from the roots plus the remembered set, which the
// write barrier fills with old objects that point at young ones.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function GenerationsFigure() {
  return (
    <Svg w={400} h={190} title="Left: the young generation with several short-lived objects and one survivor. Right: the old generation, where one old object points at a young one; the write barrier recorded it in the remembered set.">
      <Box x={4} y={8} w={180} h={150} fill={tok('accent', 0.06)} stroke={tok('accent')}>
        <T x={14} y={24} size={12} weight={700}>young (collected often)</T>
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <Box key={k} x={14 + (k % 3) * 56} y={40 + Math.floor(k / 3) * 40} w={48} h={28} r={3}
            fill={k === 4 ? tok('panel') : tok('line', 0.15)} stroke={k === 4 ? tok('ink', 0.6) : tok('muted')} dash={k !== 4}>
            <T x={38 + (k % 3) * 56} y={54 + Math.floor(k / 3) * 40} size={11} mono anchor="middle">{k === 4 ? 'live' : 'dead'}</T>
          </Box>
        ))}
        <T x={14} y={136} size={11} fill={tok('muted')}>most die before the next minor GC</T>
      </Box>
      <Box x={216} y={8} w={180} h={150} fill={tok('brand', 0.06)} stroke={tok('brand')}>
        <T x={226} y={24} size={12} weight={700}>old (collected rarely)</T>
        <Box x={236} y={60} w={64} h={28} r={3} fill={tok('panel')} stroke={tok('ink', 0.6)}>
          <T x={268} y={74} size={11} mono anchor="middle">list</T>
        </Box>
        <Box x={316} y={60} w={64} h={28} r={3} fill={tok('panel')} stroke={tok('ink', 0.6)}>
          <T x={348} y={74} size={11} mono anchor="middle">class</T>
        </Box>
        <T x={226} y={124} size={11} fill={tok('muted')}>remembered set:</T>
        <T x={226} y={140} size={11} mono>[list]</T>
      </Box>
      <Arrow x1={236} y1={78} x2={121} y2={94} color={tok('warn')} />
      <T x={200} y={178} size={11} anchor="middle" fill={tok('muted')}>old → young: recorded by the write barrier</T>
    </Svg>
  );
}
