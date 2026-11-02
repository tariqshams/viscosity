import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// One inline cache at `o.x` going 0 → 1 → P → N, following V8's
// InlineCacheState and UpdatePolymorphicIC (V8 12.4 source) and the real
// --log-ic run shown in 'Polymorphic and megamorphic sites'.
type Shape = 'A' | 'B' | 'C' | 'D' | 'E';
const SHAPE_KEYS: Record<Shape, string> = { A: '{x}', B: '{x, a}', C: '{x, b}', D: '{x, c}', E: '{x, d}' };
const COLORS: Record<Shape, string> = { A: 'brand', B: 'accent', C: 'warn', D: 'safe', E: 'danger' };

type S = {
  incoming: Shape | null;
  result: 'hit' | 'miss' | 'mega' | null;
  state: '0' | '1' | 'P' | 'N';
  entries: Shape[];
  note: string;
};

const STATE_NAME = { '0': 'uninitialized', '1': 'monomorphic', P: 'polymorphic', N: 'megamorphic' };

const STATES: S[] = [
  { incoming: null, result: null, state: '0', entries: [], note: 'getX’s bytecode has one property load, o.x, with its own feedback slot. Nothing has run yet, so its inline cache is empty: state 0, uninitialized.' },
  { incoming: 'A', result: 'miss', state: '1', entries: ['A'], note: 'An object of shape A arrives. The cache has nothing, so V8 does the slow lookup: search A’s descriptors for x, find slot 0. Then it writes down “shape A: load slot 0”. One shape seen: monomorphic.' },
  { incoming: 'A', result: 'hit', state: '1', entries: ['A'], note: 'Another A. Now the access is one comparison (is the shape A?) and one load from slot 0. No search at all. This is the fast path every access hopes for.' },
  { incoming: 'B', result: 'miss', state: 'P', entries: ['A', 'B'], note: 'Shape B. The check fails, so V8 looks x up again and adds a second entry. Two shapes seen: polymorphic. Each access must now find which of its shapes it has.' },
  { incoming: 'D', result: 'miss', state: 'P', entries: ['A', 'B', 'C', 'D'], note: 'After C and D, the list holds four entries. In the V8 inside Node 22, four is the limit: the flag max_valid_polymorphic_map_count defaults to 4.' },
  { incoming: 'E', result: 'mega', state: 'N', entries: [], note: 'A fifth shape. The list is full, so V8 gives up on it: megamorphic. The site stops keeping its own entries and uses the stub cache, one table shared by all megamorphic loads.' },
  { incoming: 'C', result: 'mega', state: 'N', entries: [], note: 'From now on every o.x here looks up (shape, name) in the shared table. This is the slow path, and it gives an optimizing compiler no single shape to build on.' },
];

export default function ICSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const badge = st.state === '0' ? 'muted' : st.state === '1' ? 'safe' : st.state === 'P' ? 'warn' : 'danger';
  return (
    <StepFrame title="One inline cache, four states" steps={s} note={st.note}>
      <Svg w={400} h={236} title="An object arrives at the property access o.x. The inline cache beside it lists up to four shapes, each with where x lives. Its state letter goes from 0 to 1 to P to N.">
        {/* incoming object */}
        <T x={10} y={12} size={11} weight={700} fill={tok('muted')}>OBJECT</T>
        {st.incoming ? (
          <Box x={10} y={22} w={84} h={44} r={6} fill={tok(COLORS[st.incoming], 0.16)} stroke={tok(COLORS[st.incoming])}>
            <T x={52} y={36} size={11} anchor="middle" weight={700}>shape {st.incoming}</T>
            <T x={52} y={54} size={11} mono anchor="middle">{SHAPE_KEYS[st.incoming]}</T>
          </Box>
        ) : (
          <Box x={10} y={22} w={84} h={44} r={6} dash>
            <T x={52} y={44} size={11} anchor="middle" fill={tok('muted')}>none yet</T>
          </Box>
        )}
        <Arrow x1={96} y1={44} x2={130} y2={44} />
        {/* access site */}
        <T x={134} y={12} size={11} weight={700} fill={tok('muted')}>ACCESS SITE</T>
        <Box x={134} y={22} w={110} h={44} r={6} fill={tok('panel')} stroke={tok('ink', 0.5)}>
          <T x={146} y={38} size={14} mono weight={700}>o.<tspan fill={tok('f1')}>x</tspan></T>
          <T x={146} y={56} size={11} fill={tok('muted')}>getX, feedback [0]</T>
        </Box>
        <Box x={254} y={22} w={136} h={44} r={6} fill={tok(badge, 0.16)} stroke={tok(badge)}>
          <T x={266} y={38} size={18} mono weight={700} fill={tok(badge)}>{st.state}</T>
          <T x={290} y={38} size={11} weight={700}>{STATE_NAME[st.state]}</T>
          <T x={266} y={56} size={11} fill={st.result === 'hit' ? tok('safe') : st.result === 'miss' ? tok('warn') : st.result === 'mega' ? tok('danger') : tok('muted')}>
            {st.result === 'hit' ? 'hit: fast load' : st.result === 'miss' ? 'miss: slow lookup' : st.result === 'mega' ? 'shared table lookup' : 'never run'}
          </T>
        </Box>
        {/* the cache */}
        <T x={10} y={88} size={11} weight={700} fill={tok('muted')}>{st.state === 'N' ? 'THIS SITE’S ENTRIES: given up' : 'THIS SITE’S ENTRIES (max 4)'}</T>
        {[0, 1, 2, 3].map((k) => {
          const e = st.entries[k];
          return (
            <Box key={k} x={10} y={98 + k * 32} w={180} h={26} r={4} fill={e ? tok(COLORS[e], 0.12) : tok('panel')} stroke={e ? tok(COLORS[e]) : tok('line')} dash={!e}>
              {e && <T x={20} y={111 + k * 32} size={12} mono>shape {e} → load slot 0</T>}
            </Box>
          );
        })}
        <Box x={210} y={98} w={180} h={122} r={6} fill={st.state === 'N' ? tok('danger', 0.08) : tok('panel')} stroke={st.state === 'N' ? tok('danger') : tok('line')} dash={st.state !== 'N'}>
          <T x={220} y={114} size={11} weight={700} fill={st.state === 'N' ? tok('ink') : tok('muted')}>stub cache (shared)</T>
          <T x={220} y={134} size={11} fill={tok('muted')}>one table for all</T>
          <T x={220} y={148} size={11} fill={tok('muted')}>megamorphic loads:</T>
          <T x={220} y={170} size={11} mono fill={st.state === 'N' ? tok('ink') : tok('muted')}>(shape, name)</T>
          <T x={220} y={188} size={11} mono fill={st.state === 'N' ? tok('ink') : tok('muted')}>  → handler</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
