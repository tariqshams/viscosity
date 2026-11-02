import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 297: the same three numbers stored specialised (an int[] in
// Java, a Float64Array in JavaScript) and erased (a list of boxes).
export default function BoxingFigure() {
  const vals = ['7', '8', '9'];
  return (
    <Svg w={400} h={210} title="Specialised: three numbers side by side in one block. Erased: three pointers, each to its own boxed object with a header.">
      <T x={4} y={12} size={11} weight={700} fill={tok('muted')}>SPECIALISED: int[] (values in a row)</T>
      {vals.map((v, k) => (
        <Box key={v} x={4 + k * 60} y={22} w={60} h={30} fill={tok('f1', 0.18)} stroke={tok('f1')}>
          <T x={34 + k * 60} y={37} size={13} mono anchor="middle">{v}</T>
        </Box>
      ))}
      <T x={4} y={82} size={11} weight={700} fill={tok('muted')}>ERASED: List&lt;Integer&gt; (a row of pointers)</T>
      {vals.map((v, k) => (
        <g key={v}>
          <Box x={4 + k * 60} y={92} w={60} h={30}>
            <T x={34 + k * 60} y={107} size={11} mono anchor="middle">ptr</T>
          </Box>
          <Arrow x1={34 + k * 60} y1={122} x2={60 + k * 120} y2={152} />
          <Box x={20 + k * 120} y={152} w={50} h={30} fill={tok('panel')} stroke={tok('ink', 0.4)}>
            <T x={45 + k * 120} y={167} size={11} mono anchor="middle" fill={tok('muted')}>header</T>
          </Box>
          <Box x={70 + k * 120} y={152} w={34} h={30} fill={tok('f1', 0.18)} stroke={tok('f1')}>
            <T x={87 + k * 120} y={167} size={13} mono anchor="middle">{v}</T>
          </Box>
        </g>
      ))}
      <T x={4} y={200} size={11} fill={tok('muted')}>Each box is its own allocation, somewhere on the heap.</T>
    </Svg>
  );
}
