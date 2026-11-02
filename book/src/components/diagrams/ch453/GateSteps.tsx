import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 453: which gate of .github/workflows/ci.yml catches which
// mistake. Jobs and steps as committed; the failure texts are real
// (rustfmt 1.9.0 --check, the parity.rs fixture assertion, a
// check_chapters message from this book's own CI, the smoke test's
// line from the run of 1 November 2026) or the gate's own message.
type J = 'engine-ts' | 'engine-rust' | 'drip' | 'book' | 'website';
const JOBS: J[] = ['engine-ts', 'engine-rust', 'drip', 'book', 'website'];
type S = { job: J; gate: string; mistake: string; says: string; note: string };

const STATES: S[] = [
  { job: 'engine-rust', gate: 'Format', mistake: 'a Rust file left unformatted', says: 'cargo fmt --check: exit 1', note: 'The first gate of the Rust job. rustfmt --check prints the diff it would make and exits with 1, so the job stops before the slow steps.' },
  { job: 'engine-rust', gate: 'Test: parity', mistake: 'Rust emits other code than TS', says: 'rust_output_equals_…: FAILED', note: 'cargo test --workspace runs parity.rs, which compares the Rust output with the TypeScript output committed in tests/expected, byte for byte.' },
  { job: 'engine-rust', gate: 'Test: differential, fuzz', mistake: 'a compiled program prints otherwise', says: 'compiled_programs_behave_…', note: 'The same command runs the original and compiled programs under node and python3, and 200 fuzz programs: wrong behaviour fails here even when both engines agree.' },
  { job: 'engine-rust', gate: 'Clippy', mistake: 'v.len() == 0 where is_empty() would do', says: 'error: length comparison to zero', note: 'With -D warnings every lint warning is an error, so code that compiles but that Clippy would warn about cannot be merged quietly.' },
  { job: 'book', gate: 'Check chapters', mistake: 'a chapter cites an uncommitted source', says: 'not in the bibliography', note: 'check_chapters checks every chapter’s rules: citations, the time budget, prompts and quiz, line widths, and every exercise’s solution against its tests.' },
  { job: 'book', gate: 'Smoke test', mistake: 'a page wider than a phone', says: '✗ … no horizontal overflow at 440px', note: 'After the build, Playwright opens the site at 440 by 956 pixels and tries the runner, quiz, steppers and both Playground engines.' },
  { job: 'engine-ts', gate: 'Pack the CLI', mistake: 'the npm package misses a file', says: 'viscosity --version fails', note: 'The TS job packs @viscosity/cli as npm would publish it, installs the tarball in an empty folder, and runs it: what a user would get, not what the repository has.' },
];

export default function GateSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Which gate catches it" steps={s} note={st.note}>
      <Svg w={400} h={226} title="A mistake, and the job and gate of the CI workflow that catches it">
        <T x={10} y={14} size={12} weight={700} fill={tok('muted')}>the mistake</T>
        <Box x={10} y={24} w={380} h={28} r={4} fill={tok('warn', 0.15)} stroke={tok('warn')}>
          <T x={20} y={38} size={13}>{st.mistake}</T>
        </Box>
        <T x={10} y={72} size={12} weight={700} fill={tok('muted')}>job</T>
        {JOBS.map((j, k) => {
          const on = j === st.job;
          const y = 82 + k * 26;
          return (
            <Box key={j} x={10} y={y} w={112} h={22} r={3} fill={on ? tok('danger', 0.15) : tok('panel')} stroke={on ? tok('danger') : tok('line')}>
              <T x={66} y={y + 11} size={12} mono anchor="middle">{j}</T>
            </Box>
          );
        })}
        <T x={140} y={72} size={12} weight={700} fill={tok('muted')}>gate</T>
        <Box x={140} y={82} w={250} h={28} r={4} fill={tok('danger', 0.12)} stroke={tok('danger')}>
          <T x={150} y={96} size={13} weight={700}>{st.gate}</T>
        </Box>
        <T x={140} y={130} size={12} weight={700} fill={tok('muted')}>what it says</T>
        <Box x={140} y={140} w={250} h={28} r={4} fill={tok('panel')} stroke={tok('line')}>
          <T x={150} y={154} size={11} mono>{st.says}</T>
        </Box>
        <T x={140} y={196} size={12} fill={tok('muted')}>later steps of the job are skipped;</T>
        <T x={140} y={214} size={12} fill={tok('muted')}>the other four jobs carry on</T>
      </Svg>
    </StepFrame>
  );
}
