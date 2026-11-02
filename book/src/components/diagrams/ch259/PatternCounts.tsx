// Scavenges for 50 million loop iterations, one pattern per row. Each
// file builds the loop body 50 times over a million elements and is run
// with  node --trace-gc file.js | grep -c Scavenge  on Node v22.23.4
// (V8 12.4.254.21); two runs each, which agreed to within a few counts
// (the first row gave 6 and 20). The reference row is the object literal
// with --no-turbo-escape (1710).
import { Box, Svg, T, tok } from '../../viz/svg';

const ROWS: { label: string; code: string; n: number }[] = [
  { label: 'object, fixed field names', code: 'p.x + p.y', n: 6 },
  { label: 'class instance, method call', code: 'new A(x, y).len()', n: 3 },
  { label: 'object destructured', code: 'const { x, y } = {…}', n: 6 },
  { label: 'array literal, constant indices', code: 'p[0] + p[1]', n: 127 },
  { label: 'array destructured', code: 'const [a, b] = […]', n: 253 },
  { label: 'for…of over an array literal', code: 'for (v of […])', n: 1615 },
  { label: 'reference: escape analysis off', code: '--no-turbo-escape', n: 1710 },
  { label: 'one of two objects, by a branch', code: 'c ? {…} : {…}', n: 3497 },
  { label: 'field read by a computed name', code: 'p[c ? "x" : "y"]', n: 4271 },
  { label: 'passed to a 554-byte function', code: 'big({…})', n: 4275 },
  { label: 'a closure made per iteration', code: '() => xs[i] + ys[i]', n: 4717 },
];

const MAX = 4800;
const BAR_W = 250;

export default function PatternCounts() {
  return (
    <Svg w={400} h={42 + ROWS.length * 34} title="Scavenge counts for eleven loop patterns. Green bars, near zero: an object with fixed field names, a class instance with a method call, and object destructuring. Amber bars, in the hundreds: an array literal read by constant indices, and array destructuring. Red bars, in the thousands: for-of over an array literal, the reference with escape analysis off at 1710, one of two objects chosen by a branch, a field read by a computed name, an object passed to a function too large to inline, and a closure made on every iteration.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>SCAVENGES PER 50 MILLION ITERATIONS</T>
      {ROWS.map((r, k) => {
        const y = 30 + k * 34;
        const c = r.n < 50 ? 'safe' : r.n < 1000 ? 'warn' : 'danger';
        const ref = r.code.startsWith('--');
        const w = Math.max(3, (r.n / MAX) * BAR_W);
        return (
          <g key={k}>
            <T x={8} y={y} size={11} weight={600} fill={ref ? tok('muted') : tok('ink')}>{r.label}</T>
            <T x={392} y={y} size={10} mono anchor="end" fill={tok('muted')}>{r.code}</T>
            <Box x={8} y={y + 7} w={w} h={12} r={2} fill={ref ? tok('muted', 0.2) : tok(c, 0.25)} stroke={ref ? tok('muted') : tok(c)} dash={ref} />
            <T x={8 + w + 6} y={y + 14} size={11} mono weight={700} fill={ref ? tok('muted') : tok(c)}>{r.n}</T>
          </g>
        );
      })}
    </Svg>
  );
}
