import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Column storage: the same three records {x, vx}, first as separate
// objects (each with its own header), then as one Float64Array per field,
// where element i is index i of every column. Field colours: x = f1,
// vx = f3 (AUTHORING.md).
const XS = [0, 1, 2];
const VXS = [1, 1, 1];

export default function Columns() {
  return (
    <Svg w={400} h={232} title="Three particle objects become two columns, x and vx, lined up by index">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>BEFORE: ONE OBJECT PER ELEMENT</T>
      {XS.map((x, k) => {
        const bx = 8 + k * 130;
        return (
          <Box key={k} x={bx} y={22} w={120} h={66}>
            <T x={bx + 8} y={36} size={11} fill={tok('muted')}>ps[{k}]: header</T>
            <T x={bx + 8} y={56} size={13} mono fill={tok('f1')}>x: {x}</T>
            <T x={bx + 8} y={76} size={13} mono fill={tok('f3')}>vx: {VXS[k]}</T>
          </Box>
        );
      })}
      <Arrow x1={200} y1={94} x2={200} y2={118} />
      <T x={210} y={106} size={11} fill={tok('muted')}>Viscosity, plan = soa</T>
      <T x={8} y={130} size={11} weight={700} fill={tok('muted')}>AFTER: ONE FLOAT64ARRAY PER FIELD</T>
      {[{ name: 'ps.x', vals: XS, c: 'f1', y: 142 }, { name: 'ps.vx', vals: VXS, c: 'f3', y: 178 }].map((col) => (
        <g key={col.name}>
          <T x={60} y={col.y + 14} size={13} mono weight={700} anchor="end" fill={tok(col.c)}>{col.name}</T>
          {col.vals.map((v, k) => (
            <Box key={k} x={70 + k * 50} y={col.y} w={46} h={28} fill={tok(col.c, 0.14)} stroke={tok(col.c)}>
              <T x={93 + k * 50} y={col.y + 14} size={13} mono anchor="middle">{v}</T>
            </Box>
          ))}
          <T x={226} y={col.y + 14} size={12} mono fill={tok('muted')}>… spare</T>
        </g>
      ))}
      {XS.map((k) => (
        <T key={k} x={93 + k * 50} y={222} size={11} anchor="middle" fill={tok('muted')}>i = {k}</T>
      ))}
      <T x={290} y={222} size={11} fill={tok('muted')}>same i, same element</T>
    </Svg>
  );
}
