// Chapter 247: the price of a faster schedule.
// Lifetime bars of the two loaded values in the original order and in the
// list schedule: the faster schedule keeps both alive at once.
import { Box, Svg, T, tok } from '../../viz/svg';

const CW = 24;
const X0 = 52;
type Bar = { name: string; from: number; to: number; color: string };

function Panel({ y, title, bars, cycles }: { y: number; title: string; bars: Bar[]; cycles: number }) {
  return (
    <g>
      <T x={8} y={y} size={11} weight={700} fill={tok('muted')}>{title}</T>
      {Array.from({ length: 14 }, (_, c) => (
        <T key={c} x={X0 + c * CW + CW / 2} y={y + 16} size={11} mono anchor="middle" fill={c < cycles ? tok('ink', 0.7) : tok('muted', 0.4)}>{c}</T>
      ))}
      {bars.map((b, k) => (
        <g key={k}>
          <T x={8} y={y + 36 + k * 24} size={12} mono>{b.name}</T>
          <Box x={X0 + b.from * CW + 2} y={y + 27 + k * 24} w={(b.to - b.from + 1) * CW - 4} h={18} r={4} fill={b.color} stroke={b.color} />
        </g>
      ))}
    </g>
  );
}

export default function PressureFigure() {
  const f3 = tok('f1', 0.55);
  const f4 = tok('f2', 0.55);
  return (
    <Svg w={400} h={200} title="Two timelines. In the original order the two squared values are alive one after the other, so one register would do. In the list schedule they are alive at the same time from cycle 1 to cycle 6, so two registers are needed.">
      <Panel y={12} title="ORIGINAL ORDER: 14 CYCLES, AT MOST 1 ALIVE" cycles={14}
        bars={[{ name: 'x0', from: 0, to: 6, color: f3 }, { name: 'x1', from: 7, to: 13, color: f4 }]} />
      <Panel y={106} title="LIST SCHEDULE: 8 CYCLES, UP TO 2 ALIVE" cycles={8}
        bars={[{ name: 'x0', from: 0, to: 6, color: f3 }, { name: 'x1', from: 1, to: 7, color: f4 }]} />
    </Svg>
  );
}
