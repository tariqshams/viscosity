import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 285: a rope for "hello, world!" built by two concatenations.
export default function RopeFigure() {
  const line = (x1: number, y1: number, x2: number, y2: number) => (
    <path d={`M${x1},${y1} L${x2},${y2}`} stroke={tok('ink', 0.5)} strokeWidth={1.5} fill="none" />
  );
  return (
    <Svg w={400} h={200} title="A rope: a concatenation node of length 13 whose left child is another node of length 12 over the leaves hello comma space and world, and whose right child is the leaf exclamation mark">
      {line(250, 40, 150, 84)}
      {line(250, 40, 330, 144)}
      {line(150, 108, 80, 144)}
      {line(150, 108, 220, 144)}
      <Box x={200} y={14} w={100} h={28} fill={tok('brand', 0.1)} stroke={tok('brand')}>
        <T x={250} y={28} size={12} mono anchor="middle">concat 13</T>
      </Box>
      <Box x={100} y={82} w={100} h={28} fill={tok('brand', 0.1)} stroke={tok('brand')}>
        <T x={150} y={96} size={12} mono anchor="middle">concat 12</T>
      </Box>
      <Box x={20} y={142} w={120} h={28}>
        <T x={80} y={156} size={12} mono anchor="middle">"hello, " 7</T>
      </Box>
      <Box x={160} y={142} w={120} h={28}>
        <T x={220} y={156} size={12} mono anchor="middle">"world" 5</T>
      </Box>
      <Box x={296} y={142} w={70} h={28}>
        <T x={331} y={156} size={12} mono anchor="middle">"!" 1</T>
      </Box>
      <T x={8} y={190} size={11} fill={tok('muted')}>Joining makes one small node; no characters are copied.</T>
    </Svg>
  );
}
