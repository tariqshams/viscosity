import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const PLACES = [128, 64, 32, 16, 8, 4, 2, 1];

type S = { v: number; code: string; note: string; shifted?: boolean };

const STATES: S[] = [
  { v: 0, code: '0', note: 'Eight switches. Each one is worth double the switch to its right: 1, 2, 4, 8, up to 128. All off is 0.' },
  { v: 1, code: '0b1', note: 'Turn on the rightmost switch, worth 1. The number is 1.' },
  { v: 2, code: '0b10', note: 'There is no digit “2” in binary. To make 2, turn the 1 off and the 2 on. So 10 in binary means two.' },
  { v: 5, code: '0b101', note: '4 + 1 = 5. Read it from the left: one 4, no 2, one 1. That is 101.' },
  { v: 13, code: '0b1101', note: '8 + 4 + 1 = 13, written 1101. In JavaScript, (13).toString(2) gives \'1101\', and 0b1101 is 13.' },
  { v: 255, code: '0b11111111', note: 'All eight on: 128 + 64 + … + 1 = 255. Eight bits make one byte, so a byte holds 256 patterns: 0 to 255.' },
  { v: 26, code: '13 << 1', shifted: true, note: '13 << 1 slides every bit of 1101 one place left, to 11010. Each bit is now worth double, so the number doubles: 26.' },
  { v: 6, code: '13 >> 1', shifted: true, note: '13 >> 1 slides right instead. The rightmost 1 falls off the end, giving 110 = 6: half of 13, rounded down.' },
];

export default function BitSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const parts = PLACES.filter((p) => st.v & p);
  return (
    <StepFrame title="Counting with switches" steps={s} note={st.note}>
      <Svg w={400} h={150} title={`Eight bits with place values 128 down to 1, showing the number ${st.v}`}>
        {PLACES.map((p, k) => {
          const on = (st.v & p) !== 0;
          const x = 8 + k * 48;
          return (
            <g key={p}>
              <T x={x + 22} y={14} size={12} mono anchor="middle" fill={tok('muted')}>{p}</T>
              <Box x={x} y={26} w={44} h={50} fill={on ? tok('brand', 0.85) : tok('panel')} stroke={on ? tok('brand') : tok('ink', 0.35)}>
                <T x={x + 22} y={52} size={22} mono weight={700} anchor="middle" fill={on ? tok('brand-ink') : tok('muted')}>{on ? 1 : 0}</T>
              </Box>
            </g>
          );
        })}
        <T x={8} y={102} size={15} mono>
          <tspan fontWeight={700}>{st.code}</tspan>
          <tspan fill={tok('muted')}>{' = '}{parts.length > 1 && parts.length < 5 ? `${parts.join(' + ')} = ` : ''}</tspan>
          <tspan fontWeight={700} fill={tok('brand')}>{st.v}</tspan>
        </T>
        <T x={8} y={132} size={12} fill={tok('muted')}>
          {st.shifted ? 'A shift moves every bit at once.' : `binary ${st.v.toString(2)}  ·  decimal ${st.v}`}
        </T>
      </Svg>
    </StepFrame>
  );
}
