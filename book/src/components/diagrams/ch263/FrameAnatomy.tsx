import { Box, Svg, T, tok } from '../../viz/svg';

// The parts of one refusal printed by `viscosity explain --frames`, on the
// corpus program escapes_log.js. The three text lines are the CLI's real
// output (engine/ts/packages/core/src/plan.ts, explain() and codeFrame()).
const ROWS = [
  { text: '· unsafe: line 5: an element is', more: '  passed to a method call', note: 'the reason, recorded by the planner', c: 'brand' },
  { text: '    5 | console.log(ps[3]);', more: '', note: 'the source line, with its number', c: 'accent' },
  { text: '      |             ^^^^^', more: '', note: 'carets under the code it is about', c: 'warn' },
];

export default function FrameAnatomy() {
  let y = 10;
  return (
    <Svg w={400} h={210} title="A refusal with a code frame: the reason line, the numbered source line, and carets under the element that escapes">
      <Box x={4} y={4} w={392} h={116} fill={tok("panel")} />
      {ROWS.map((r, k) => {
        const top = y;
        const lines = r.more ? 2 : 1;
        y += lines * 18 + 12;
        return (
          <g key={k}>
            <rect x={10} y={top + 4} width={380} height={lines * 18 + 4} rx={3} fill={tok(r.c, 0.12)} stroke={tok(r.c)} />
            <T x={16} y={top + 15} size={12} mono>{r.text}</T>
            {r.more && <T x={16} y={top + 33} size={12} mono>{r.more}</T>}
          </g>
        );
      })}
      {ROWS.map((r, k) => (
        <g key={`n${k}`}>
          <rect x={14} y={132 + k * 26} width={14} height={14} rx={3} fill={tok(r.c, 0.35)} stroke={tok(r.c)} />
          <T x={38} y={139 + k * 26} size={12}>{r.note}</T>
        </g>
      ))}
    </Svg>
  );
}
