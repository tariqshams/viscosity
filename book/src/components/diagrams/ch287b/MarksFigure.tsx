import { Svg, T, tok } from '../../viz/svg';

// Chapter 287b: rustc's own view of swap!(tmp, y), from
// rustc -Zunpretty=expanded,hygiene (rustc 1.97). Every identifier carries
// a syntax context after #: 0 for code the caller wrote, 7 for code the
// macro wrote. A name only refers to a binding with the same name AND the
// same context.
type Tok = [string, 'user' | 'macro' | 'plain'];
const LINES: Tok[][] = [
  [['let ', 'plain'], ['tmp#7', 'macro'], [' = ', 'plain'], ['tmp#0', 'user'], [';', 'plain']],
  [['tmp#0', 'user'], [' = ', 'plain'], ['y#0', 'user'], [';', 'plain']],
  [['y#0', 'user'], [' = ', 'plain'], ['tmp#7', 'macro'], [';', 'plain']],
];
const CW = 8.4; // width of one monospace character at size 14

export default function MarksFigure() {
  return (
    <Svg w={400} h={190} title="The expanded swap with each name marked by its origin: tmp#7 from the macro and tmp#0 from the caller are different variables">
      <T x={20} y={16} size={11} weight={700} fill={tok('muted')}>THE COMPILER'S VIEW OF THE EXPANSION</T>
      {LINES.map((line, i) => {
        let x = 30;
        return (
          <g key={i}>
            {line.map(([t, k], j) => {
              const el = (
                <T key={j} x={x} y={48 + i * 30} size={14} mono weight={k === 'plain' ? undefined : 700}
                  fill={k === 'user' ? tok('f1') : k === 'macro' ? tok('f3') : undefined}>{t}</T>
              );
              x += t.length * CW;
              return el;
            })}
          </g>
        );
      })}
      <path d={`M${30 + 4 * CW},58 l${5 * CW},0`} stroke={tok('f3')} strokeWidth={2} />
      <path d={`M${30 + 6 * CW},118 l${5 * CW},0`} stroke={tok('f3')} strokeWidth={2} />
      <T x={210} y={108} size={11} fill={tok('muted')}>← the same tmp</T>
      <T x={210} y={48} size={11} fill={tok('muted')}>← its declaration</T>
      <T x={20} y={146} size={12} fill={tok('f1')} weight={700}>#0</T>
      <T x={46} y={146} size={12}>written by the caller</T>
      <T x={20} y={168} size={12} fill={tok('f3')} weight={700}>#7</T>
      <T x={46} y={168} size={12}>written by the macro: a different tmp</T>
    </Svg>
  );
}
