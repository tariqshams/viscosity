// Chapter 217: four lanes running together. Top: each lane reads only its
// own elements (safe). Bottom: each lane needs the element its left-hand
// neighbour is writing at the same moment (not safe).
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const X0 = 110;
const DX = 72;

function Cell({ x, y, label, col }: { x: number; y: number; label: string; col: string }) {
  return (
    <Box x={x - 31} y={y - 12} w={62} h={24} r={4} fill={tok(col, 0.12)} stroke={tok(col)}>
      <T x={x} y={y} size={11.5} mono anchor="middle">{label}</T>
    </Box>
  );
}

export default function LanesFigure() {
  const idx = ['i', 'i+1', 'i+2', 'i+3'];
  return (
    <Svg w={400} h={250} title="Four lanes: independent lanes on top, lanes that depend on each other below">
      <T x={8} y={14} size={11} weight={700} fill={tok('safe')}>SAFE: c[i] = a[i] + b[i]</T>
      <T x={8} y={46} size={11} mono fill={tok('muted')}>reads</T>
      <T x={8} y={98} size={11} mono fill={tok('muted')}>writes</T>
      {idx.map((s, k) => {
        const x = X0 + k * DX;
        return (
          <g key={s}>
            <Cell x={x} y={46} label={`a,b[${s}]`} col="accent" />
            <Arrow x1={x} y1={59} x2={x} y2={84} color={tok('safe')} width={1.8} />
            <Cell x={x} y={98} label={`c[${s}]`} col="safe" />
          </g>
        );
      })}
      <line x1={8} y1={124} x2={392} y2={124} stroke={tok('line')} strokeWidth={1} />
      <T x={8} y={140} size={11} weight={700} fill={tok('danger')}>NOT SAFE: x[i] = x[i - 1] + 1</T>
      <T x={8} y={172} size={11} mono fill={tok('muted')}>reads</T>
      <T x={8} y={226} size={11} mono fill={tok('muted')}>writes</T>
      {idx.map((s, k) => {
        const x = X0 + k * DX;
        const read = ['i-1', 'i', 'i+1', 'i+2'][k];
        return (
          <g key={s}>
            <Cell x={x} y={172} label={`x[${read}]`} col={k === 0 ? 'accent' : 'danger'} />
            <Arrow x1={x} y1={185} x2={x} y2={212} color={tok('ink', 0.5)} width={1.6} />
            <Cell x={x} y={226} label={`x[${s}]`} col="brand" />
            {k < 3 && <Arrow x1={x + 26} y1={213} x2={x + DX - 22} y2={185} color={tok('danger')} width={1.6} dash />}
          </g>
        );
      })}
      <T x={392} y={246} size={11} anchor="end" fill={tok('danger')}>dashed: a lane needs its neighbour's write</T>
    </Svg>
  );
}
