import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Two branded ids: different types while checking, the same plain
// number once the types are erased. Blue marks NodeId, teal marks
// SlotId; the red cross is the call the checker rejects.
export default function BrandErasure() {
  return (
    <Svg w={400} h={210} title="Branded ids: NodeId and SlotId are different types to the checker, but both are the plain number 3 at run time">
      <T x={10} y={14} size={11} weight={700} fill={tok('muted')}>WHILE CHECKING</T>
      <Box x={10} y={26} w={170} h={44} fill={tok('accent', 0.18)} stroke={tok('accent')}>
        <T x={95} y={41} size={12} mono weight={700} anchor="middle">n: NodeId</T>
        <T x={95} y={58} size={11} mono anchor="middle">number &amp; brand NodeId</T>
      </Box>
      <Box x={220} y={26} w={170} h={44} fill={tok('f3', 0.18)} stroke={tok('f3')}>
        <T x={305} y={41} size={12} mono weight={700} anchor="middle">slotOf(s: SlotId)</T>
        <T x={305} y={58} size={11} mono anchor="middle">number &amp; brand SlotId</T>
      </Box>
      <Arrow x1={180} y1={48} x2={218} y2={48} color={tok('danger')} dash />
      <T x={199} y={84} size={11} anchor="middle" fill={tok('danger')} weight={700}>slotOf(n) is an error</T>
      <line x1={10} y1={104} x2={390} y2={104} stroke={tok('line')} strokeDasharray="4 4" />
      <T x={200} y={118} size={11} anchor="middle" fill={tok('muted')}>types erased</T>
      <T x={10} y={140} size={11} weight={700} fill={tok('muted')}>AT RUN TIME</T>
      <Box x={10} y={152} w={170} h={40} fill={tok('muted', 0.12)}>
        <T x={95} y={172} size={13} mono weight={700} anchor="middle">n = 3</T>
      </Box>
      <Box x={220} y={152} w={170} h={40} fill={tok('muted', 0.12)}>
        <T x={305} y={172} size={13} mono weight={700} anchor="middle">s = 3</T>
      </Box>
      <T x={200} y={204} size={11} anchor="middle" fill={tok('muted')}>two plain numbers: no tag, no cost</T>
    </Svg>
  );
}
