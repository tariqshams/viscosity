// Chapter 250: a record shape is two lists, the fields in order and a
// column type per field. The collection is es from the corpus file
// mixed_columns.js, whose explain output says: typed Float64Array columns
// for hp, x; plain array columns for id, tag (may hold non-numbers).
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const FIELDS = [
  { f: 'id', typed: false, vals: ["'e0'", "'e1'", "'e2'"] },
  { f: 'hp', typed: true, vals: ['100', '100', '100'] },
  { f: 'x', typed: true, vals: ['0', '1', '2'] },
  { f: 'tag', typed: false, vals: ['{…}', 'null', 'null'] },
];
const ROWS = ["{ id: 'e0', hp: 100, x: 0, tag: {…} }", "{ id: 'e1', hp: 100, x: 1, tag: null }", "{ id: 'e2', hp: 100, x: 2, tag: null }"];

export default function ShapeColumns() {
  return (
    <Svg w={400} h={270} title="Three records of the collection es become four columns: hp and x, which only ever hold numbers, become Float64Array columns; id and tag, which hold strings, objects and null, become plain arrays.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>ARRAY OF OBJECTS: es</T>
      {ROWS.map((r, k) => (
        <T key={k} x={8} y={32 + k * 16} size={11} mono>{r}</T>
      ))}
      <Arrow x1={200} y1={80} x2={200} y2={104} />
      <T x={210} y={92} size={11} fill={tok('muted')}>shape {'{id, hp, x, tag}'}</T>
      {FIELDS.map((c, k) => {
        const x = 8 + k * 98;
        const col = c.typed ? tok('safe') : tok('ink', 0.5);
        return (
          <g key={c.f}>
            <T x={x + 45} y={120} size={12} mono weight={700} anchor="middle">{c.f}</T>
            <Box x={x} y={130} w={90} h={78} stroke={col} fill={c.typed ? tok('safe', 0.1) : tok('panel')}>
              {c.vals.map((v, j) => (
                <T key={j} x={x + 45} y={146 + j * 22} size={11} mono anchor="middle">{v}</T>
              ))}
            </Box>
            <T x={x + 45} y={222} size={11} anchor="middle" weight={700} fill={col}>{c.typed ? 'Float64Array' : 'plain array'}</T>
            <T x={x + 45} y={238} size={11} anchor="middle" fill={tok('muted')}>{c.typed ? 'numbers only' : 'may hold anything'}</T>
          </g>
        );
      })}
      <T x={200} y={262} size={11} anchor="middle" fill={tok('muted')}>fields in order, plus a column type per field</T>
    </Svg>
  );
}
