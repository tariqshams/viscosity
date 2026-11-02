import { Box, Svg, T, tok } from '../../viz/svg';
import { ACTION, GOTO } from './lr';

const TERMS = ['n', '+', '*', '$'];
const NTS = ['E', 'T', 'F'];

/** The ACTION and GOTO table for the expression grammar. */
export default function LRTable() {
  const x0 = 34;
  const cw = 46;
  const rh = 21;
  return (
    <Svg w={400} h={232} title="The LR table: nine states as rows; ACTION columns for n, plus, times and end of input, holding shift, reduce or accept; GOTO columns for E, T and F, holding state numbers.">
      <T x={x0 + 2 * cw} y={10} size={11} weight={700} anchor="middle" fill={tok('brand')}>ACTION</T>
      <T x={x0 + 4 * cw + 6 + 1.5 * cw} y={10} size={11} weight={700} anchor="middle" fill={tok('accent')}>GOTO</T>
      {[...TERMS, ...NTS].map((c, j) => (
        <T key={c} x={x0 + cw * j + (j >= 4 ? 6 : 0) + cw / 2} y={26} size={12} mono weight={700} anchor="middle">{c}</T>
      ))}
      {Array.from({ length: 9 }, (_, s) => {
        const y = 36 + s * rh;
        return (
          <g key={s}>
            <T x={8} y={y + rh / 2} size={12} mono weight={700} fill={tok('muted')}>{s}</T>
            {[...TERMS, ...NTS].map((c, j) => {
              const v = j < 4 ? ACTION[s][c] : GOTO[s]?.[c];
              const x = x0 + cw * j + (j >= 4 ? 6 : 0);
              const kind = typeof v === 'number' ? 'g' : v?.[0];
              const fill = kind === 's' ? tok('brand', 0.12) : kind === 'r' ? tok('warn', 0.16) : kind === 'a' ? tok('safe', 0.2) : kind === 'g' ? tok('accent', 0.12) : 'transparent';
              return (
                <Box key={c} x={x} y={y} w={cw - 2} h={rh - 2} r={2} fill={fill} stroke={tok('line')}>
                  <T x={x + (cw - 2) / 2} y={y + rh / 2} size={11.5} mono anchor="middle">{v === undefined ? '' : String(v)}</T>
                </Box>
              );
            })}
          </g>
        );
      })}
    </Svg>
  );
}
