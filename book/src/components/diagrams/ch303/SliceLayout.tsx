// Chapter 303: what a slice value is made of. A plain reference &i32 is
// one address (8 bytes); a slice &[i32] is an address AND a length (16
// bytes, from std::mem::size_of with rustc 1.97 on x86-64), pointing into
// storage that someone else owns. Nothing is copied.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const ARR = [10, 20, 30, 40, 50, 60];

export default function SliceLayout() {
  const x0 = 120;
  const cw = 44;
  return (
    <Svg w={400} h={200} title="A slice is a pointer and a length into an array someone else owns">
      <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>OWNER</T>
      <T x={8} y={44} size={12} mono weight={700}>a: [i32; 6]</T>
      {ARR.map((v, k) => {
        const inside = k >= 1 && k < 4;
        return (
          <g key={k}>
            <Box x={x0 + k * 44} y={30} w={40} h={28} r={3} fill={inside ? tok('safe', 0.2) : tok('panel')} stroke={inside ? tok('safe') : tok('line')}>
              <T x={x0 + k * cw + 20} y={44} size={13} mono anchor="middle">{v}</T>
            </Box>
            <T x={x0 + k * cw + 20} y={70} size={11} mono anchor="middle" fill={tok('muted')}>{k}</T>
          </g>
        );
      })}
      <T x={8} y={102} size={11} weight={700} fill={tok('muted')}>SLICE (16 bytes)</T>
      <T x={8} y={130} size={12} mono weight={700}>mid: &amp;[i32]</T>
      <Box x={120} y={114} w={80} h={30} fill={tok('safe', 0.12)} stroke={tok('safe')}>
        <T x={160} y={129} size={12} mono anchor="middle">ptr</T>
      </Box>
      <Box x={204} y={114} w={80} h={30} fill={tok('safe', 0.12)} stroke={tok('safe')}>
        <T x={244} y={129} size={12} mono anchor="middle">len = 3</T>
      </Box>
      <Arrow x1={160} y1={114} x2={x0 + cw + 20} y2={60} color={tok('safe')} width={2.5} />
      <T x={8} y={168} size={12} mono>let mid = &amp;a[1..4];</T>
      <T x={8} y={186} size={11} fill={tok('muted')}>A plain &amp;i32 is only the pointer (8 bytes); a slice adds a length.</T>
    </Svg>
  );
}
