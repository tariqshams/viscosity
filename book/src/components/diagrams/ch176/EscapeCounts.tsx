// Chapter 176: scavenges needed for 50 million temporary objects, one
// loop variant per row. Counted on this book's machine with
//   node --trace-gc file.js | grep -c Scavenge
// on Node v22.23.4 (V8 12.4.254.21), one run each (a second run gave the
// same counts). Each loop runs 50 times over a million elements.
import { Box, Svg, T, tok } from '../../viz/svg';

const ROWS: { label: string; code: string; n: number }[] = [
  { label: 'fields read only', code: 't += p.x + p.y', n: 3 },
  { label: 'returned by make(i)', code: 'p = make(i)', n: 3 },
  { label: 'passed to len2(p)', code: 'len2({ x, y })', n: 3 },
  { label: 'len2, escape analysis off', code: '--no-turbo-escape', n: 1747 },
  { label: 'stored outside the loop', code: 'sink = p', n: 1942 },
  { label: 'stored on a path never taken', code: 'if (i === -1) sink = p', n: 1748 },
];

const MAX = 2000;
const X0 = 8;
const BAR_X = 8;
const BAR_W = 300;

export default function EscapeCounts() {
  return (
    <Svg w={400} h={300} title="Scavenges per loop variant: about 3 when the object only has its fields read, about 1750 to 1950 when it escapes or escape analysis is off.">
      <T x={X0} y={12} size={11} weight={700} fill={tok('muted')}>SCAVENGES (FEWER = FEWER OBJECTS MADE)</T>
      {ROWS.map((r, k) => {
        const y = 30 + k * 44;
        const escaped = r.n > 100;
        const c = escaped ? 'danger' : 'safe';
        const w = Math.max(3, (r.n / MAX) * BAR_W);
        return (
          <g key={k}>
            <T x={X0} y={y} size={12} weight={600}>{r.label}</T>
            <T x={392} y={y} size={11} mono anchor="end" fill={tok('muted')}>{r.code}</T>
            <Box x={BAR_X} y={y + 9} w={w} h={16} r={2} fill={tok(c, 0.25)} stroke={tok(c)} />
            <T x={BAR_X + w + 6} y={y + 17} size={12} mono weight={700} fill={tok(c)}>{r.n}</T>
          </g>
        );
      })}
    </Svg>
  );
}
