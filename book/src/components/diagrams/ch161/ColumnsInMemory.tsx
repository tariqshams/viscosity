import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 161 (a design, not built): two SoA columns, x and vx, placed one
// after the other in a single WebAssembly linear memory, capacity 4.
// Each f64 takes 8 bytes; column k starts at byte k * cap * 8.
const CAP = 4;
const X0 = 16;
const CW = 46;

export default function ColumnsInMemory() {
  const cells = Array.from({ length: CAP * 2 }, (_, k) => k);
  return (
    <Svg w={400} h={196} title="Linear memory as one row of bytes. The x column fills bytes 0 to 31 and the vx column bytes 32 to 63. Element 2 has x at byte 16 and vx at byte 48. WebAssembly reads them with f64.load at those addresses; JavaScript sees each column through a Float64Array view of the same bytes.">
      <T x={X0 + 2 * CW + 21} y={12} size={11} mono anchor="middle" fill={tok('brand')}>f64.load 16</T>
      <T x={X0 + 6 * CW + 21} y={12} size={11} mono anchor="middle" fill={tok('brand')}>f64.load 48</T>
      <Arrow x1={X0 + 2 * CW + 21} y1={20} x2={X0 + 2 * CW + 21} y2={44} color={tok('brand')} />
      <Arrow x1={X0 + 6 * CW + 21} y1={20} x2={X0 + 6 * CW + 21} y2={44} color={tok('brand')} />
      {cells.map((k) => {
        const field = k < CAP ? 'x' : 'vx';
        const f = k < CAP ? 'f1' : 'f3';
        const i = k % CAP;
        const on = i === 2;
        return (
          <g key={k}>
            <Box x={X0 + k * CW} y={48} w={CW - 4} h={40} r={3} fill={tok(f, on ? 0.35 : 0.14)} stroke={tok(f)}>
              <T x={X0 + k * CW + (CW - 4) / 2} y={63} size={11} mono anchor="middle">{field}[{i}]</T>
              <T x={X0 + k * CW + (CW - 4) / 2} y={79} size={11} anchor="middle" fill={tok('muted')}>8 B</T>
            </Box>
            <T x={X0 + k * CW} y={100} size={11} mono fill={tok('muted')}>{k * 8}</T>
          </g>
        );
      })}
      <Box x={X0} y={114} w={CAP * CW - 4} h={30} fill={tok('f1', 0.08)} stroke={tok('f1')} dash>
        <T x={X0 + 8} y={129} size={11} mono>Float64Array(buf, 0, 4)</T>
      </Box>
      <Box x={X0 + CAP * CW} y={114} w={CAP * CW - 4} h={30} fill={tok('f3', 0.08)} stroke={tok('f3')} dash>
        <T x={X0 + CAP * CW + 8} y={129} size={11} mono>Float64Array(buf, 32, 4)</T>
      </Box>
      <T x={200} y={164} size={11} anchor="middle" fill={tok('muted')}>byte addresses under each slot · capacity 4</T>
      <T x={200} y={184} size={11} anchor="middle" fill={tok('muted')}>column k starts at byte k × capacity × 8</T>
    </Svg>
  );
}
