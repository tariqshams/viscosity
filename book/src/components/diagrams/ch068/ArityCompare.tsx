// Chapter 68 (second half): one function, three calls, two languages.
// Drip refuses any call whose argument count differs from the arity;
// JavaScript runs them all and fills the gaps with undefined.
import { Box, Svg, T, tok } from '../../viz/svg';

const ROWS: { call: string; drip: [string, string]; dripOk: boolean; js: [string, string] }[] = [
  { call: 'area(3)', drip: ['error: takes 2', 'arguments but got 1'], dripOk: false, js: ['runs, with', 'h = undefined'] },
  { call: 'area(3, 4)', drip: ['runs, with', 'w = 3, h = 4'], dripOk: true, js: ['runs, with', 'w = 3, h = 4'] },
  { call: 'area(3, 4, 5)', drip: ['error: takes 2', 'arguments but got 3'], dripOk: false, js: ['runs; the 5 is', 'kept aside, unused'] },
];

export default function ArityCompare() {
  const top = 56;
  const rowH = 50;
  return (
    <Svg w={400} h={top + ROWS.length * rowH + 4} title="The function area has two parameters, w and h. In Drip, calling it with one or three arguments is a runtime error and only the call with two runs. In JavaScript all three calls run: a missing argument becomes undefined and an extra one is ignored.">
      <T x={6} y={12} size={12.5} mono weight={700}>fn area(w, h) {'{'} ... {'}'}</T>
      <T x={6} y={40} size={11} weight={700} fill={tok('muted')}>THE CALL</T>
      <T x={118} y={40} size={11} weight={700} fill={tok('brand')}>DRIP</T>
      <T x={262} y={40} size={11} weight={700} fill={tok('muted')}>JAVASCRIPT</T>
      {ROWS.map((r, i) => {
        const y = top + i * rowH;
        const c = r.dripOk ? tok('safe') : tok('warn');
        return (
          <g key={r.call}>
            <T x={6} y={y + 21} size={12.5} mono weight={700}>{r.call}</T>
            <Box x={114} y={y} w={140} h={42} fill={r.dripOk ? tok('safe', 0.08) : tok('warn', 0.08)} stroke={c}>
              <T x={122} y={y + 14} size={11.5}>{r.drip[0]}</T>
              <T x={122} y={y + 30} size={11.5}>{r.drip[1]}</T>
            </Box>
            <Box x={258} y={y} w={138} h={42} stroke={tok('line')}>
              <T x={266} y={y + 14} size={11.5}>{r.js[0]}</T>
              <T x={266} y={y + 30} size={11.5}>{r.js[1]}</T>
            </Box>
          </g>
        );
      })}
    </Svg>
  );
}
