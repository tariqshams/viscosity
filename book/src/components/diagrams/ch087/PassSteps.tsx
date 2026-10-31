import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// A pass manager running four passes over one function, with a cache of
// three analyses. Each pass asks for analyses (hit or miss), may change
// the IR, and says which analyses it preserved; the rest are thrown away.
const PASSES = ['constprop', 'simplify-cfg', 'licm', 'layout'];
const ANALYSES = ['uses', 'dominators', 'loops'];

type C = 'empty' | 'fresh' | 'hit' | 'cached' | 'dropped';
type S = { pass: number; cache: C[]; computed: number; note: string };

const STATES: S[] = [
  { pass: -1, cache: ['empty', 'empty', 'empty'], computed: 0, note: 'Four passes will run in order over one function. The analysis cache on the right starts empty. The counter below counts how many times an analysis is actually computed.' },
  { pass: 0, cache: ['fresh', 'empty', 'empty'], computed: 1, note: 'constprop asks for uses. Not cached: a miss, so the manager computes it and keeps the result.' },
  { pass: 0, cache: ['dropped', 'empty', 'empty'], computed: 1, note: 'constprop replaces values with constants. It changed instructions but no blocks or edges, so it reports “CFG analyses preserved”. uses is not in that set, so it is invalidated.' },
  { pass: 1, cache: ['fresh', 'fresh', 'empty'], computed: 3, note: 'simplify-cfg asks for uses (a miss again, recomputed) and dominators (a first miss).' },
  { pass: 1, cache: ['dropped', 'dropped', 'empty'], computed: 3, note: 'It deletes an unreachable block. The CFG itself changed, so it preserves nothing, and every cached result is thrown away.' },
  { pass: 2, cache: ['empty', 'fresh', 'fresh'], computed: 5, note: 'licm, loop-invariant code motion, needs dominators and loops: two misses. It hoists instructions out of a loop, keeping the blocks as they were and keeping the def-use lists up to date as it moves them.' },
  { pass: 2, cache: ['empty', 'cached', 'cached'], computed: 5, note: 'So licm reports “everything preserved”. Nothing is invalidated: dominators and loops stay in the cache.' },
  { pass: 3, cache: ['fresh', 'hit', 'hit'], computed: 6, note: 'layout asks for all three. dominators and loops are hits: free. Only uses is computed. Six computations instead of eight without a cache, and every answer is still correct for the current IR.' },
];

const FILL: Record<C, string> = { empty: 'transparent', fresh: tok('brand', 0.15), hit: tok('safe', 0.18), cached: tok('panel'), dropped: tok('danger', 0.12) };
const STROKE: Record<C, string> = { empty: tok('line'), fresh: tok('brand'), hit: tok('safe'), cached: tok('ink', 0.5), dropped: tok('danger') };
const WORD: Record<C, string> = { empty: 'empty', fresh: 'computed', hit: 'hit', cached: 'cached', dropped: 'invalidated' };

export default function PassSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Caching and invalidating analyses" steps={s} note={st.note}>
      <Svg w={400} h={210} title="Four passes in order on the left, and the analysis cache on the right">
        <T x={10} y={12} size={11} weight={700} fill={tok('muted')}>PASSES</T>
        {PASSES.map((p, k) => {
          const on = k === st.pass;
          const done = k < st.pass;
          return (
            <Box key={p} x={6} y={24 + k * 40} w={170} h={32} fill={on ? tok('brand', 0.15) : 'transparent'} stroke={on ? tok('brand') : tok('line')} dash={!on && !done}>
              <T x={18} y={40 + k * 40} size={13} mono weight={on ? 700 : 400} fill={done ? tok('muted') : undefined}>{p}</T>
              <T x={166} y={40 + k * 40} size={13} anchor="end" fill={tok('safe')}>{done ? '✓' : ''}</T>
            </Box>
          );
        })}
        <T x={212} y={12} size={11} weight={700} fill={tok('muted')}>ANALYSIS CACHE</T>
        {ANALYSES.map((a, k) => {
          const c = st.cache[k];
          return (
            <Box key={a} x={206} y={24 + k * 40} w={188} h={32} fill={FILL[c]} stroke={STROKE[c]} dash={c === 'empty' || c === 'dropped'}>
              <T x={218} y={40 + k * 40} size={13} mono>{a}</T>
              <T x={384} y={40 + k * 40} size={11} weight={700} anchor="end" fill={STROKE[c]}>{WORD[c]}</T>
            </Box>
          );
        })}
        <T x={206} y={160} size={12} fill={tok('muted')}>analyses computed</T>
        <T x={394} y={160} size={18} weight={700} anchor="end" mono>{st.computed}</T>
        <T x={200} y={196} size={11} anchor="middle" fill={tok('muted')}>A pass asks; the manager computes only on a miss.</T>
      </Svg>
    </StepFrame>
  );
}
