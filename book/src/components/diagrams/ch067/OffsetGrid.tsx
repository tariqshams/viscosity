import { Box, Svg, T, tok } from '../../viz/svg';

// The source 'let x;\n\nprint x +;', laid out by line. ⏎ is a newline.
const LINES = ['let x;⏎', '⏎', 'print x +;'];
const HIT = 16; // the '+' on line 3
const CW = 30;
const X0 = 52;

/** Offsets (one number per character of the whole string) against line and column. */
export default function OffsetGrid() {
  let offset = 0;
  return (
    <Svg w={400} h={212} title="The source let x; newline newline print x +; laid out in three lines. Each character shows its offset in the whole string; the plus sign at offset 16 is on line 3, column 9.">
      <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>LINE</T>
      <T x={X0} y={12} size={11} weight={700} fill={tok('muted')}>COLUMNS 1, 2, 3 …   (small numbers: offsets)</T>
      {LINES.map((ln, li) => {
        const y = 26 + li * 52;
        return (
          <g key={li}>
            <T x={18} y={y + 16} size={14} mono weight={700} anchor="middle">{li + 1}</T>
            {[...ln].map((c, k) => {
              const o = offset++;
              const hit = o === HIT;
              const nl = c === '⏎';
              return (
                <g key={k}>
                  <Box x={X0 + k * CW} y={y} w={CW - 3} h={30} r={3} fill={hit ? tok('brand', 0.22) : tok('panel')} stroke={hit ? tok('brand') : tok('ink', nl ? 0.2 : 0.35)}>
                    <T x={X0 + k * CW + (CW - 3) / 2} y={y + 15} size={14} mono anchor="middle" fill={nl ? tok('muted') : undefined}>{c === ' ' ? '·' : c}</T>
                  </Box>
                  <T x={X0 + k * CW + (CW - 3) / 2} y={y + 41} size={11} mono anchor="middle" fill={hit ? tok('brand') : tok('muted')}>{o}</T>
                </g>
              );
            })}
          </g>
        );
      })}
      <T x={6} y={194} size={12}>
        offset <tspan fontWeight={700} fill={tok('brand')}>16</tspan> → line <tspan fontWeight={700}>3</tspan>, column <tspan fontWeight={700}>9</tspan>
      </T>
    </Svg>
  );
}
