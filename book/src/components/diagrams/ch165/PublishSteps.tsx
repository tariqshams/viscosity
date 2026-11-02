import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 165: the real 0.0.1 publication on 2026-11-02, as recorded in
// book/STATUS.md and engine/rust/README.md ("Releasing"): one
// --npm-only run, then two --crates-only runs of scripts/release.sh. The
// order of the crates is CRATES=(...) in scripts/release.sh; the 429 text
// is crates.io's answer as STATUS.md records it.
type St = 'wait' | 'up' | 'skip' | 'fail' | 'done';
const ITEMS = ['@viscosity/cli', '@viscosity/wasm', 'viscosity-vir', 'viscosity-core', 'viscosity-frontend-js', 'viscosity-frontend-python', 'viscosity-cli', 'viscosity-wasm'];
type S = { run: string; st: St[]; note: string };

const W: St = 'wait';
const STATES: S[] = [
  { run: 'before', st: [W, W, W, W, W, W, W, W], note: 'Eight packages, none published: two for npm and six crates for crates.io, in the dependency order the script checks against cargo metadata (viscosity-vir first, because every other crate needs it).' },
  { run: 'release.sh --npm-only', st: ['up', 'up', W, W, W, W, W, W], note: 'First run, with only the npm token. The script checks versions and runs both test suites, skips crates.io, publishes @viscosity/cli (built by its prepack) and then @viscosity/wasm (built by build.mjs first). Both were then installed from the public registry.' },
  { run: 'release.sh --crates-only', st: ['done', 'done', 'up', 'up', 'up', 'up', 'up', W], note: 'Second run, with only the crates.io token. For each crate: is this version on crates.io already? No, so cargo publish -p, then wait until the sparse index lists it, so the next crate can depend on it. Five go out in order.' },
  { run: 'release.sh --crates-only', st: ['done', 'done', 'done', 'done', 'done', 'done', 'done', 'fail'], note: 'The sixth, viscosity-wasm, is refused with HTTP 429: "published too many new crates in a short period". crates.io limits how fast one account creates new crate names, and a first release creates six at once. set -e stops the script.' },
  { run: 'release.sh --crates-only (again)', st: ['done', 'done', 'skip', 'skip', 'skip', 'skip', 'skip', 'up'], note: 'About ten minutes later, the same command again. crate_published answers 200 for the first five, so each is skipped; viscosity-wasm goes up. Nothing was undone and nothing was uploaded twice: the script is safe to repeat.' },
  { run: 'after', st: ['done', 'done', 'done', 'done', 'done', 'done', 'done', 'done'], note: 'Everything is on its registry at 0.0.1. npm install -g @viscosity/cli and cargo install viscosity-cli both give a viscosity whose --version prints viscosity 0.0.1.' },
];

const LOOK: Record<St, { c: string; t: string }> = {
  wait: { c: 'line', t: 'not yet' },
  up: { c: 'brand', t: 'published now' },
  skip: { c: 'accent', t: 'already there: skipped' },
  fail: { c: 'danger', t: 'HTTP 429' },
  done: { c: 'safe', t: 'published' },
};

export default function PublishSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Publishing 0.0.1, run by run" steps={s} note={st.note}>
      <Svg w={400} h={262} title="Eight packages and their state after each run of the release script">
        <T x={8} y={12} size={12} mono weight={700}>{`$ ${st.run}`}</T>
        {ITEMS.map((name, k) => {
          const y = 28 + k * 28;
          const l = LOOK[st.st[k]];
          return (
            <g key={name}>
              {k === 2 && <line x1={8} x2={392} y1={y - 3} y2={y - 3} stroke={tok('line')} strokeDasharray="3 3" />}
              <T x={8} y={y + 11} size={11} fill={tok('muted')}>{k < 2 ? 'npm' : 'crates.io'}</T>
              <T x={74} y={y + 11} size={12} mono>{name}</T>
              <Box x={262} y={y} w={130} h={22} r={4} fill={tok(l.c, st.st[k] === 'wait' ? 0 : 0.18)} stroke={tok(l.c)}>
                <T x={327} y={y + 11} size={11} anchor="middle">{l.t}</T>
              </Box>
            </g>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
