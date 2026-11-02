import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// The PGO loop of `viscosity profile` and `--profile`, on the chapter's
// spawn.js program. Every verdict and line of text is the real output of the
// CLI (engine/ts/packages/cli), run for chapter 161.
type Hi = 'src' | 'inst' | 'run' | 'prof' | 'plan' | null;
type S = { hi: Hi; shown: number; n: number; note: string };

const STATES: S[] = [
  { hi: 'src', shown: 0, n: 20, note: 'The program. ps grows inside spawn(), which a loop calls. The analysis cannot count calls through a function, so explain says “size unknown statically” and, with nothing to compare against the 64-element threshold, Viscosity transforms it.' },
  { hi: 'inst', shown: 1, n: 20, note: 'viscosity profile first instruments the ORIGINAL program: the expression that creates ps, [], becomes __vsc_track("ps", []). The function records the array and returns it unchanged, so the program behaves exactly as before.' },
  { hi: 'run', shown: 2, n: 20, note: 'Then it runs the instrumented copy once, in a fresh Node process. spawn() is called 20 times, so ps really holds 20 elements. Nothing is timed: this run only counts.' },
  { hi: 'prof', shown: 3, n: 20, note: 'When the process exits, an exit hook reads the length of every tracked array and writes the profile file: { "ps": { "maxLength": 20 } }.' },
  { hi: 'plan', shown: 4, n: 20, note: 'explain --profile p.json: the measured 20 replaces the unknown estimate. 20 is below 64, so ps is kept as an array of objects, and the report says the number was “(measured)”.' },
  { hi: 'plan', shown: 4, n: 5000, note: 'Change the loop to 5000 calls and profile again: maxLength is 5000, above the threshold, so ps becomes a struct of arrays, “about 5000 elements (measured by profiling)”. The profile changes a size, never a safety proof.' },
];

const ORDER: Hi[] = ['src', 'inst', 'run', 'prof', 'plan'];
const LABEL: Record<string, [string, string]> = {
  src: ['1  source', 'spawn.js'],
  inst: ['2  instrument', '__vsc_track("ps", [])'],
  run: ['3  run once', 'fresh node process'],
  prof: ['4  profile', 'p.json'],
  plan: ['5  compile', 'explain --profile p.json'],
};

export default function PgoSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const vis = (h: Hi) => ORDER.indexOf(h) <= st.shown;
  const on = (h: Hi) => st.hi === h;
  const big = st.n === 5000;
  const ys = [8, 70, 132, 194, 256];
  return (
    <StepFrame title="The profile-guided loop" steps={s} note={st.note}>
      <Svg w={400} h={330} title="Five stages: the source is instrumented, run once, its collection sizes are written to a profile, and the compiler reads the profile to decide the layout">
        {ORDER.map((h, k) => {
          const [a, b] = LABEL[h as string];
          return (
            <g key={h}>
              <Box x={6} y={ys[k]} w={190} h={48} fill={on(h) ? tok('brand', 0.14) : 'transparent'} stroke={!vis(h) ? tok('line') : on(h) ? tok('brand') : tok('ink', 0.5)} dash={!vis(h)}>
                <T x={16} y={ys[k] + 16} size={12} weight={700}>{a}</T>
                <T x={16} y={ys[k] + 34} size={10} mono fill={tok('muted')}>{b}</T>
              </Box>
              {k < 4 && <Arrow x1={100} y1={ys[k] + 48} x2={100} y2={ys[k + 1] - 2} />}
            </g>
          );
        })}
        <Arrow x1={196} y1={ys[0] + 24} x2={196} y2={ys[4] + 24} bend={-0.6} dash color={tok('muted')} />
        <T x={292} y={160} size={10} anchor="middle" fill={tok('muted')}>the same source,</T>
        <T x={292} y={174} size={10} anchor="middle" fill={tok('muted')}>compiled with the profile</T>

        <Box x={214} y={8} w={180} h={102} fill={tok('panel')}>
          <T x={224} y={24} size={10} weight={700} fill={tok('muted')}>ORIGINAL PROGRAM</T>
          <T x={224} y={44} size={10} mono>{'const ps = [];'}</T>
          <T x={224} y={60} size={10} mono>{'function spawn(x) {'}</T>
          <T x={224} y={74} size={10} mono>{'  ps.push({ x, vx: 1 }); }'}</T>
          <T x={224} y={92} size={10} mono fill={tok('brand')}>{`for (… < ${st.n} …) spawn(i);`}</T>
        </Box>

        {vis('prof') && (
          <Box x={214} y={194} w={180} h={48} fill={tok('safe', 0.08)} stroke={tok('safe')}>
            <T x={224} y={210} size={10} weight={700} fill={tok('muted')}>p.json</T>
            <T x={224} y={228} size={10} mono>{`{"ps": {"maxLength": ${st.n}}}`}</T>
          </Box>
        )}
        {vis('run') && !vis('prof') && (
          <T x={300} y={218} size={11} anchor="middle" fill={tok('muted')}>{`ps.length grows to ${st.n}`}</T>
        )}

        <Box x={6} y={312 - 2} w={388} h={20} r={3} fill="transparent" stroke="transparent">
          <T x={10} y={320} size={11} mono fill={vis('plan') ? (big ? tok('safe') : tok('warn')) : tok('muted')}>
            {!vis('plan')
              ? 'without a profile: ps → struct of arrays (size unknown)'
              : big
                ? 'ps → struct of arrays · about 5000 (measured)'
                : 'ps → kept as objects · about 20 elements (measured)'}
          </T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
