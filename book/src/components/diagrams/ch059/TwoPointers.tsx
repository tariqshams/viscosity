import { Box, Svg, T, tok } from '../../viz/svg';

const SRC = 'x = 12;';
const START = 4;
const CUR = 6;
const CW = 44;
const X0 = 30;

/** The lexeme is the slice from start up to, not including, current. */
export default function TwoPointers() {
  return (
    <Svg w={400} h={170} title="The characters x = 12; at offsets 0 to 6. start points at offset 4, the 1; current points at offset 6, the semicolon. The slice from 4 to 6 is the lexeme 12.">
      {[...SRC].map((c, k) => {
        const x = X0 + k * CW;
        const inTok = k >= START && k < CUR;
        const next = k === CUR;
        return (
          <g key={k}>
            <Box x={x} y={12} w={CW - 4} h={40} r={4} fill={inTok ? tok('brand', 0.2) : tok('panel')} stroke={inTok ? tok('brand') : next ? tok('accent') : tok('ink', 0.35)} dash={next}>
              <T x={x + (CW - 4) / 2} y={32} size={18} mono anchor="middle">{c === ' ' ? '·' : c}</T>
            </Box>
            <T x={x + (CW - 4) / 2} y={64} size={11} mono anchor="middle" fill={tok('muted')}>{k}</T>
          </g>
        );
      })}
      <T x={X0 + START * CW + 2} y={86} size={12} mono weight={700} fill={tok('brand')}>▲ start = 4</T>
      <T x={X0 + CUR * CW + CW - 6} y={106} size={12} mono weight={700} anchor="end" fill={tok('accent')}>current = 6 ▲</T>
      <Box x={20} y={122} w={360} h={36} r={6} fill={tok('brand', 0.08)} stroke={tok('brand')}>
        <T x={200} y={140} size={14} mono anchor="middle">source.slice(4, 6) → <tspan fontWeight={700}>'12'</tspan></T>
      </Box>
    </Svg>
  );
}
