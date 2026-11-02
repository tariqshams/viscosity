import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 384: .github/workflows/ci.yml as committed (five jobs, on push
// and pull_request, one concurrency group per workflow and ref with
// cancel-in-progress). The two red steps are real reproductions run
// locally, not GitHub runs: `npm ci` on engine/ts at cff36bb^ (npm
// 10.9.9, EUSAGE "Missing: @viscosity/cli@0.1.0 from lock file"), and
// `cargo test -p viscosity-cli` at c68daec with engine/ts/node_modules
// removed (fuzz.rs and multi_file.rs fail: Cannot find package 'acorn').
// The workflow has run `npm ci` in engine/ts before cargo test since 1be50ca.
type J = 'engine-ts' | 'engine-rust' | 'drip' | 'book' | 'website';
type S = { push: boolean; old?: boolean; jobs: J[]; cache?: boolean; red?: J; steps?: string[]; note: string };

const JOBS: J[] = ['engine-ts', 'engine-rust', 'drip', 'book', 'website'];

const STATES: S[] = [
  { push: true, jobs: [], note: 'A push (or a pull request) starts the workflow. Every job starts from a fresh runner: a clean checkout, and nothing from your machine.' },
  { push: true, old: true, jobs: [], note: 'concurrency: one group per workflow and branch, with cancel-in-progress. A newer push to the same branch cancels the run it supersedes, so only the latest commit is tested.' },
  { push: true, jobs: JOBS, note: 'Five jobs run side by side. None depends on another, so one red job doesn’t stop the others, and you see every failure from one push.' },
  { push: true, jobs: JOBS, cache: true, note: 'Caches: setup-node keeps npm’s download cache, keyed by the hash of each package-lock.json; rust-cache keeps ~/.cargo and the compiled dependencies, keyed by the rustc version and more.' },
  { push: true, jobs: JOBS, red: 'engine-ts', steps: ['npm ci', '  EUSAGE: not in sync', '  Missing: @viscosity/cli', '  from lock file'], note: 'Reproduced locally at the commit before cff36bb: npm ci refuses a lockfile that doesn’t match package.json. On a dev machine, npm install had quietly papered over it.' },
  { push: true, jobs: JOBS, red: 'engine-rust', steps: ['cargo test --workspace', '  fuzz.rs: FAILED', '  Cannot find package', "  'acorn'"], note: 'Reproduced locally by removing engine/ts/node_modules: the engine-rust job as first committed never ran npm ci in engine/ts, but two tests load the TS engine. The job now installs it first.' },
];

export default function CiSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const grey = tok('ink', 0.4);
  return (
    <StepFrame title="One push, five jobs" steps={s} note={st.note}>
      <Svg w={400} h={262} title="A push starts five parallel CI jobs; older runs on the same branch are cancelled">
        <Box x={10} y={10} w={110} h={28} r={4} fill={tok('brand', 0.15)} stroke={tok('brand')}>
          <T x={65} y={24} size={11} mono anchor="middle">git push</T>
        </Box>
        {st.old && (
          <Box x={150} y={10} w={240} h={28} r={4} fill={tok('danger', 0.1)} stroke={tok('danger')} dash>
            <T x={270} y={24} size={10.5} mono anchor="middle">older run, same branch: cancelled</T>
          </Box>
        )}
        <Arrow x1={65} y1={38} x2={65} y2={58} color={grey} width={1.5} />
        {JOBS.map((j, k) => {
          const on = st.jobs.includes(j);
          const red = st.red === j;
          const y = 62 + k * 30;
          return (
            <Box key={j} x={10} y={y} w={110} h={24} r={4}
              fill={red ? tok('danger', 0.15) : on ? tok('safe', 0.12) : tok('panel')}
              stroke={red ? tok('danger') : on ? tok('safe') : tok('line')}>
              <T x={65} y={y + 12} size={10.5} mono anchor="middle">{j}</T>
            </Box>
          );
        })}
        {st.cache && (
          <g>
            <Box x={150} y={62} w={240} h={52} r={4} fill={tok('accent', 0.1)} stroke={tok('accent')}>
              <T x={160} y={78} size={10} mono>npm cache: key = hash(package-lock)</T>
              <T x={160} y={98} size={10} mono>rust-cache: ~/.cargo, target deps</T>
            </Box>
          </g>
        )}
        {st.steps && (
          <Box x={150} y={62} w={240} h={140} r={4} fill={tok('danger', 0.06)} stroke={tok('danger')}>
            {st.steps.map((l, k) => (
              <T key={k} x={162} y={82 + k * 22} size={10.5} mono fill={k === 0 ? undefined : tok('danger')}>{l.replace(/ /g, ' ')}</T>
            ))}
          </Box>
        )}
        <T x={200} y={228} size={10.5} anchor="middle" fill={tok('muted')}>each job: a fresh runner, ubuntu-latest</T>
        <T x={200} y={246} size={10.5} anchor="middle" fill={tok('muted')}>red steps: reproduced locally, not GitHub runs</T>
      </Svg>
    </StepFrame>
  );
}
