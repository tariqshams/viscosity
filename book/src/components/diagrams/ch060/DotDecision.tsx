import { Box, Svg, T, tok } from '../../viz/svg';

const CASES: { src: string; take: number; verdict: string; ok: boolean }[] = [
  { src: '4.25;', take: 4, verdict: 'digit after the dot: take it, 4.25', ok: true },
  { src: '4.;', take: 1, verdict: 'no digit after the dot: stop, 4', ok: false },
  { src: '4.x', take: 1, verdict: 'a letter after the dot: stop, 4', ok: false },
];
const CW = 30;

/** The number scanner has read the 4; peek() is the dot. peekNext() decides. */
export default function DotDecision() {
  return (
    <Svg w={400} h={214} title="Three sources, each starting with 4 and a dot. In 4.25 a digit follows the dot, so the dot and the digits join the number. In 4.; and 4.x no digit follows, so the number is just 4.">
      <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>AFTER THE 4: peek() IS THE DOT, peekNext() DECIDES</T>
      {CASES.map((c, i) => {
        const y = 26 + i * 62;
        return (
          <g key={c.src}>
            {[...c.src].map((ch, k) => {
              const inNum = k < c.take;
              const isPeek = k === 1;
              const isNext = k === 2;
              return (
                <g key={k}>
                  <Box x={6 + k * CW} y={y} w={CW - 3} h={30} r={3} fill={inNum ? tok('brand', 0.2) : tok('panel')} stroke={inNum ? tok('brand') : isPeek || isNext ? tok('warn') : tok('ink', 0.35)} dash={!inNum && (isPeek || isNext)}>
                    <T x={6 + k * CW + (CW - 3) / 2} y={y + 15} size={15} mono anchor="middle">{ch}</T>
                  </Box>
                  {isPeek && <T x={6 + k * CW + 13} y={y + 42} size={11} mono anchor="middle" fill={tok('warn')}>peek</T>}
                  {isNext && <T x={6 + k * CW + 20} y={y + 42} size={11} mono anchor="middle" fill={tok('warn')}>next</T>}
                </g>
              );
            })}
            <T x={170} y={y + 15} size={12} weight={700} fill={c.ok ? tok('safe') : tok('accent')}>{c.verdict}</T>
          </g>
        );
      })}
    </Svg>
  );
}
