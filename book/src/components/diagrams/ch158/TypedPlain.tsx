import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 158b: the container the Rust emitter writes for the corpus program
// mixed_columns.js (engine/ts/packages/frontend-js/test/corpus), whose
// records are { id, hp, x, tag }. Explain (rustc 1.97 release build) says
// "typed Float64Array columns for hp, x; plain array columns for id, tag
// (may hold non-numbers)", and that the busiest loop (line 5, three
// rounds over 300 elements) touches hp, tag and x. The constructor creates
// this.hp and this.x as Float64Array(cap), and this.id and this.tag as [].
// The sample values are elements 0 to 2 after the program's loops have run.
type Col = { name: string; typed: boolean; hot: boolean; sample: string[] };
const COLS: Col[] = [
  { name: 'hp', typed: true, hot: true, sample: ['70', '100', '100'] },
  { name: 'x', typed: true, hot: true, sample: ['3', '4', '5'] },
  { name: 'id', typed: false, hot: false, sample: ["'e0'", "'e1'", "'e2'"] },
  { name: 'tag', typed: false, hot: true, sample: ['{boss}', 'null', 'null'] },
];

export default function TypedPlain() {
  return (
    <Svg w={400} h={226} title="Four columns: two typed Float64Array columns and two plain arrays, chosen by type, not by how hot the field is">
      {COLS.map((c, k) => {
        const x = 6 + k * 98;
        const col = c.typed ? tok('safe') : tok('accent');
        return (
          <g key={c.name}>
            <T x={x + 45} y={14} size={13} mono weight={700} anchor="middle">{c.name}</T>
            <T x={x + 45} y={32} size={11} anchor="middle" fill={col}>{c.typed ? 'Float64Array' : 'plain array'}</T>
            {c.sample.map((v, j) => (
              <Box key={j} x={x} y={42 + j * 28} w={90} h={24} fill={c.typed ? tok('safe', 0.1) : tok('accent', 0.1)} stroke={col}>
                <T x={x + 45} y={54 + j * 28} size={11} mono anchor="middle">{v}</T>
              </Box>
            ))}
            <T x={x + 45} y={142} size={11} anchor="middle" fill={tok('muted')}>…</T>
            <Box x={x} y={156} w={90} h={22} fill={c.hot ? tok('warn', 0.16) : 'transparent'} stroke={c.hot ? tok('warn') : tok('line')} dash={!c.hot}>
              <T x={x + 45} y={167} size={11} anchor="middle">{c.hot ? 'hot loop' : 'not in it'}</T>
            </Box>
          </g>
        );
      })}
      <T x={6} y={198} size={11} fill={tok('muted')}>the column kind follows the type proof, not the heat:</T>
      <T x={6} y={216} size={11} fill={tok('muted')}>tag is read in the hottest loop and still gets a plain array</T>
    </Svg>
  );
}
