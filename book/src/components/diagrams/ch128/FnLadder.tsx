import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 128: the three closure traits as nested sets. Every Fn closure
// is also FnMut, and every FnMut closure is also FnOnce (The Rust
// Programming Language, chapter 13.1; the Rust Reference, closure types).
export default function FnLadder() {
  return (
    <Svg w={400} h={220} title="Fn inside FnMut inside FnOnce, with an example closure in each">
      <Box x={4} y={4} w={392} h={212} r={10} fill={tok('f3', 0.08)} stroke={tok('f3')}>
        <T x={16} y={22} size={13} mono weight={700} fill={tok('f3')}>FnOnce</T>
        <T x={86} y={22} size={11} fill={tok('muted')}>can be called at least once</T>
        <T x={16} y={196} size={12} mono>move || name</T>
        <T x={130} y={196} size={11} fill={tok('muted')}>moves name out: once only</T>
      </Box>
      <Box x={20} y={36} w={360} h={140} r={10} fill={tok('f2', 0.08)} stroke={tok('f2')}>
        <T x={32} y={54} size={13} mono weight={700} fill={tok('f2')}>FnMut</T>
        <T x={92} y={54} size={11} fill={tok('muted')}>many calls; may change its captures</T>
        <T x={32} y={158} size={12} mono>|| count += 1</T>
        <T x={140} y={158} size={11} fill={tok('muted')}>holds &amp;mut count</T>
      </Box>
      <Box x={36} y={68} w={328} h={68} r={10} fill={tok('f1', 0.1)} stroke={tok('f1')}>
        <T x={48} y={86} size={13} mono weight={700} fill={tok('f1')}>Fn</T>
        <T x={78} y={86} size={11} fill={tok('muted')}>many calls; only reads its captures</T>
        <T x={48} y={114} size={12} mono>|p| p.x &gt; limit</T>
        <T x={180} y={114} size={11} fill={tok('muted')}>holds &amp;limit</T>
      </Box>
    </Svg>
  );
}
