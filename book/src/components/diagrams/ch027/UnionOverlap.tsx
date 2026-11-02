import { Box, Svg, T, tok } from '../../viz/svg';

/** What a number | string value may do before it is narrowed: only what
 *  both members can do (the overlap). */
export default function UnionOverlap() {
  return (
    <Svg w={400} h={184} title="Two overlapping boxes. The number box holds toFixed(2) and x * 2. The string box holds toUpperCase() and .length. The overlap, labelled allowed on number | string, holds toString(), === and console.log(x).">
      <Box x={6} y={30} w={236} h={130} r={12} fill={tok('accent', 0.1)} stroke={tok('accent')} />
      <Box x={158} y={30} w={236} h={130} r={12} fill={tok('brand', 0.1)} stroke={tok('brand')} />
      <T x={18} y={48} size={13} mono weight={700} fill={tok('accent')}>number</T>
      <T x={382} y={48} size={13} mono weight={700} anchor="end" fill={tok('brand')}>string</T>
      <T x={18} y={88} size={12} mono>toFixed(2)</T>
      <T x={18} y={112} size={12} mono>x * 2</T>
      <T x={382} y={88} size={12} mono anchor="end">toUpperCase()</T>
      <T x={382} y={112} size={12} mono anchor="end">.length</T>
      <T x={200} y={72} size={12} mono anchor="middle" weight={700}>toString()</T>
      <T x={200} y={96} size={12} mono anchor="middle" weight={700}>===</T>
      <T x={200} y={120} size={12} mono anchor="middle" weight={700}>console.log</T>
      <T x={200} y={14} size={11} weight={700} anchor="middle" fill={tok('muted')}>ALLOWED ON number | string: THE OVERLAP</T>
      <line x1={200} y1={22} x2={200} y2={36} stroke={tok('muted')} strokeWidth={1.5} />
      <T x={200} y={176} size={11} anchor="middle" fill={tok('muted')}>everything else needs a check first</T>
    </Svg>
  );
}
