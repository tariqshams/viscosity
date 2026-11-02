import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 157: the object `new __Vsc_ps()` from container_class in
// engine/rust/crates/frontend-js/src/emit.rs, for g1.js ({x, vx}, 100
// pushes). The constructor starts at cap 16 and grow() doubles it, so after
// 100 pushes cap is 128 (16, 32, 64, 128). Field colours follow the book's
// rule: x is f1, vx is f3.
const CELLS = 12;

export default function ClassAnatomy() {
  const cw = 20;
  const x0 = 150;
  const row = (y: number, name: string, color: string) => (
    <g>
      <T x={x0 - 8} y={y + 10} size={12} mono anchor="end" fill={tok(color)} weight={700}>{name}</T>
      {Array.from({ length: CELLS }, (_, k) => (
        <rect key={k} x={x0 + k * cw} y={y} width={cw - 2} height={20} rx={2} fill={k < 8 ? tok(color, 0.25) : 'transparent'} stroke={tok(color)} strokeWidth={1} strokeDasharray={k < 8 ? undefined : '3 2'} />
      ))}
    </g>
  );
  return (
    <Svg w={400} h={250} title="A struct-of-arrays container: a length, a capacity, and one Float64Array column per field">
      <Box x={4} y={8} w={392} h={178} fill={tok('brand', 0.05)} stroke={tok('brand')}>
        <T x={12} y={24} size={12} mono weight={700}>ps = new __Vsc_ps()</T>
        <T x={12} y={48} size={11} mono>length</T>
        <T x={70} y={48} size={11} mono fill={tok('muted')}>100 (elements in use)</T>
        <T x={12} y={66} size={11} mono>cap</T>
        <T x={70} y={66} size={11} mono fill={tok('muted')}>128 (slots in each column)</T>
        {row(88, 'this.x', 'f1')}
        {row(120, 'this.vx', 'f3')}
        <T x={x0} y={156} size={11} fill={tok('muted')}>0  1  2  …</T>
        <T x={x0 + 8 * cw} y={156} size={11} fill={tok('muted')}>… unused slots</T>
        <T x={12} y={174} size={11} fill={tok('muted')}>one Float64Array per numeric field, all the same length</T>
      </Box>
      <T x={8} y={206} size={11} mono>push(v0, v1): this.x[n] = v0;</T>
      <T x={8} y={222} size={11} mono>{'              this.vx[n] = v1;'}</T>
      <T x={8} y={240} size={11} mono>grow(): new arrays of cap × 2, copy</T>
      <Arrow x1={x0 + 8 * cw + 9} y1={196} x2={x0 + 8 * cw + 9} y2={146} color={tok('ink', 0.5)} />
      <T x={x0 + 8 * cw + 18} y={204} size={11} fill={tok('muted')}>n = length</T>
    </Svg>
  );
}
