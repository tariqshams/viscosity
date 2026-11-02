import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Field affinity for a small game entity: count how often each field is
// used (hotness) and how often each pair is used in the same loop
// (affinity), weighted by how many times each loop runs.
const FIELDS = ['x', 'y', 'vx', 'vy', 'health', 'name'];
const COL: Record<string, string> = { x: 'f1', y: 'f2', vx: 'f3', vy: 'f4', health: 'f6', name: 'muted' };
const LOOPS = [
  { name: 'move', runs: 1000, fields: ['x', 'y', 'vx', 'vy'] },
  { name: 'damage', runs: 100, fields: ['x', 'health'] },
  { name: 'report', runs: 1, fields: ['health', 'name'] },
];
const PAIRS: [string, string][] = [['x', 'vx'], ['y', 'vy'], ['x', 'y'], ['x', 'health'], ['health', 'name'], ['vx', 'name']];

type S = { loops: number; hot: boolean; pairs: boolean; groups?: 'split' | 'viscosity'; note: string };

const STATES: S[] = [
  { loops: 0, hot: false, pairs: false, note: 'An entity with six fields, and three loops. move runs every frame (1000 times in our run), damage 100 times, report once. Which fields belong together?' },
  { loops: 1, hot: true, pairs: false, note: 'Hotness first: add each loop’s run count to every field it touches. After move, x, y, vx and vy each have 1000.' },
  { loops: 3, hot: true, pairs: false, note: 'After all three loops: x 1100, y, vx and vy 1000, health 101, name 1. Hot and cold are already obvious, but hotness alone doesn’t say which fields to keep side by side.' },
  { loops: 3, hot: true, pairs: true, note: 'Affinity: for each pair of fields, add the runs of every loop that uses both. x and vx score 1000 (move); x and health 100 (damage); health and name 1 (report). vx and name are never used together: 0.' },
  { loops: 3, hot: true, pairs: true, groups: 'split', note: 'A classic hot/cold split groups fields with high affinity and high hotness: {x, y, vx, vy} hot, health warm, name cold. Each group becomes its own array, all indexed by the same i.' },
  { loops: 3, hot: true, pairs: true, groups: 'viscosity', note: 'Viscosity goes further and gives every field its own column, so each loop loads exactly the fields it touches. What it decides per field is the representation: Float64Array if proven numeric, a plain array otherwise.' },
];

export default function AffinitySteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const used = LOOPS.slice(0, st.loops);
  const hot = (f: string) => used.reduce((a, l) => a + (l.fields.includes(f) ? l.runs : 0), 0);
  const aff = (a: string, b: string) => LOOPS.reduce((n, l) => n + (l.fields.includes(a) && l.fields.includes(b) ? l.runs : 0), 0);
  const groupOf = (f: string) => (['x', 'y', 'vx', 'vy'].includes(f) ? 0 : f === 'health' ? 1 : 2);
  return (
    <StepFrame title="Hotness and field affinity" steps={s} note={st.note}>
      <Svg w={400} h={300} title="Per-field access counts, pairwise affinity scores, and the resulting groups">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>LOOPS</T>
        {LOOPS.map((l, k) => (
          <g key={l.name} opacity={k < st.loops || st.loops === 0 ? 1 : 0.35}>
            <T x={8} y={30 + k * 18} size={11} mono>{l.name} ×{l.runs}: {l.fields.join(', ')}</T>
          </g>
        ))}
        <T x={8} y={96} size={11} weight={700} fill={tok('muted')}>HOTNESS</T>
        {FIELDS.map((f, k) => {
          const v = hot(f);
          const w = st.hot ? Math.max(2, (v / 1100) * 120) : 0;
          return (
            <g key={f}>
              <T x={8} y={114 + k * 18} size={11} mono>{f}</T>
              <rect x={60} y={107 + k * 18} width={w} height={13} rx={2} fill={tok(COL[f], 0.85)} />
              {st.hot && <T x={64 + w} y={114 + k * 18} size={11} mono fill={tok('muted')}>{v}</T>}
            </g>
          );
        })}
        <T x={222} y={96} size={11} weight={700} fill={tok('muted')}>AFFINITY</T>
        {st.pairs && PAIRS.map(([a, b], k) => {
          const v = aff(a, b);
          return (
            <g key={a + b}>
              <T x={222} y={114 + k * 18} size={11} mono>{a}+{b}</T>
              <rect x={318} y={107 + k * 18} width={Math.max(1, (v / 1000) * 50)} height={13} rx={2} fill={tok('brand', v ? 0.7 : 0.2)} />
              <T x={392} y={114 + k * 18} size={11} mono anchor="end" fill={tok('muted')}>{v}</T>
            </g>
          );
        })}
        {st.groups && (
          <g>
            <T x={8} y={236} size={11} weight={700} fill={tok('muted')}>{st.groups === 'split' ? 'HOT/COLD SPLIT' : 'VISCOSITY: ONE COLUMN PER FIELD'}</T>
            {st.groups === 'split'
              ? [0, 1, 2].map((g) => {
                  const fs = FIELDS.filter((f) => groupOf(f) === g);
                  const x = [8, 236, 316][g];
                  const w = [220, 72, 76][g];
                  return (
                    <Box key={g} x={x} y={248} w={w} h={40} fill={tok(g === 0 ? 'brand' : 'panel', g === 0 ? 0.12 : 1)} stroke={g === 0 ? tok('brand') : tok('line')}>
                      <T x={x + w / 2} y={262} size={11} anchor="middle" fill={tok('muted')}>{['hot', 'warm', 'cold'][g]}</T>
                      <T x={x + w / 2} y={278} size={11} mono anchor="middle">{fs.join(' ')}</T>
                    </Box>
                  );
                })
              : FIELDS.map((f, k) => (
                  <Box key={f} x={8 + k * 65} y={248} w={60} h={40} fill={tok(COL[f], 0.15)} stroke={tok(COL[f])}>
                    <T x={38 + k * 65} y={262} size={11} mono anchor="middle">{f}</T>
                    <T x={38 + k * 65} y={278} size={11} mono anchor="middle" fill={tok('muted')}>{f === 'name' ? 'plain []' : 'Float64'}</T>
                  </Box>
                ))}
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
