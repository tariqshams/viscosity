import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// A toy: an array that spans 6 cache lines, and a cache that holds only
// 2 of them, throwing out the one used longest ago. Two passes over the
// array fetch every line twice; one fused pass fetches each line once.
const CODE = `// two passes
for (const v of xs) a += v;
for (const v of xs) b += v * v;
// one fused pass
for (const v of xs) { a += v; b += v * v; }`;

type S = { line: number | null; at: number | null; cache: number[]; fetches: number; mode: string; note: string };

const STATES: S[] = [
  { line: null, at: null, cache: [], fetches: 0, mode: '', note: 'xs spans 6 cache lines. This toy cache holds only 2 lines; when it is full, it throws out the line used longest ago. (Real caches hold far more, but real arrays are far bigger too.)' },
  { line: 1, at: 2, cache: [1, 2], fetches: 3, mode: 'two passes: pass 1', note: 'The first pass reads lines 0, 1, 2 in order. Each is a miss and a fetch; line 0 has already been thrown out to make room for line 2.' },
  { line: 1, at: 5, cache: [4, 5], fetches: 6, mode: 'two passes: pass 1', note: 'End of the first pass: 6 fetches, one per line, and the cache now holds only the last two lines, 4 and 5.' },
  { line: 2, at: 0, cache: [5, 0], fetches: 7, mode: 'two passes: pass 2', note: 'The second pass starts again at line 0, which was thrown out long ago: another fetch. The data was used before, but not soon enough.' },
  { line: 2, at: 5, cache: [4, 5], fetches: 12, mode: 'two passes: pass 2', note: 'End of the second pass: every line was fetched again. 12 fetches in all for 6 lines of data.' },
  { line: 4, at: 5, cache: [4, 5], fetches: 6, mode: 'one fused pass', note: 'Fused into one loop, each value is used for both sums while its line is still in the cache: 6 fetches, half as many, for the same two answers.' },
];

const X0 = 14;
const LW = 60;

export default function FuseSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Using data again while it is cached" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={176} title="Six cache lines of an array, a cache that holds two of them, and a count of how many lines have been fetched">
        <T x={X0} y={12} size={11} weight={700} fill={tok('muted')}>THE ARRAY xs, LINE BY LINE</T>
        {Array.from({ length: 6 }, (_, k) => {
          const now = st.at === k;
          const held = st.cache.includes(k);
          return (
            <g key={k}>
              <rect x={X0 + k * LW} y={22} width={LW - 6} height={30} rx={4}
                fill={held ? tok('brand', 0.22) : tok('paper')} stroke={now ? tok('ink') : tok('brand', 0.6)} strokeWidth={now ? 2.2 : 1.2} />
              <T x={X0 + k * LW + (LW - 6) / 2} y={37} size={12} mono anchor="middle">line {k}</T>
            </g>
          );
        })}
        <T x={X0} y={74} size={11} weight={700} fill={tok('muted')}>THE CACHE (2 LINES)</T>
        {[0, 1].map((k) => (
          <Box key={k} x={X0 + k * 70} y={84} w={62} h={30} r={4} stroke={tok('safe')} fill={tok('safe', 0.08)}>
            <T x={X0 + k * 70 + 31} y={99} size={12} mono anchor="middle">{st.cache[k] === undefined ? '–' : `line ${st.cache[k]}`}</T>
          </Box>
        ))}
        <T x={180} y={92} size={12} weight={700}>{st.mode}</T>
        <T x={180} y={110} size={12} mono>fetches: <tspan fontWeight={700} fill={tok('danger')}>{st.fetches}</tspan></T>
        {s.atEnd && (
          <g>
            <rect x={X0} y={134} width={372} height={30} rx={5} fill={tok('panel')} stroke={tok('line')} />
            <T x={X0 + 10} y={149} size={12}>two passes: 12 fetches · one fused pass: 6</T>
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
