// Chapter 146: tests/common/mod.rs checking one corpus program,
// errors/call_spanning_lines.drip. Its expectation comments are the
// file's real lines 1, 6 and 7, and the outcome is what drip-rs really
// prints for it (rustc 1.97, 2026-11-02): no stdout, the message and a
// two-line trace on stderr, exit code 70. The steps follow
// parse_expectations and check in that file: exit code, the runtime
// error's message, the pinned trace, then stdout line by line.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type Row = { label: string; value: string; hot?: boolean };
type S = { phase: string; expect: Row[]; outcome: boolean; checks: Row[]; result?: string; note: string };

const E_RT: Row = { label: 'runtime', value: 'cannot add a …, line 1' };
const E_EXIT: Row = { label: 'exit', value: '70' };
const E_TR: Row = { label: 'trace', value: '2 lines' };

const STATES: S[] = [
  {
    phase: 'line 1: # expect runtime error: …',
    expect: [{ ...E_RT, hot: true }, { ...E_EXIT, hot: true }],
    outcome: false,
    checks: [],
    note: 'parse_expectations reads the source line by line. A runtime-error comment records the message and the line it sits on (1), and sets the expected exit code to 70.',
  },
  {
    phase: 'lines 6 and 7: # expect trace: …',
    expect: [E_RT, E_EXIT, { ...E_TR, hot: true }],
    outcome: false,
    checks: [],
    note: 'Two trace comments pin the whole stack trace: at line 1 in fn f, then at line 2 in script. Line 2 is where the call’s ( is, although its arguments run on to line 5.',
  },
  {
    phase: 'drip::run(&source, options)',
    expect: [E_RT, E_EXIT, E_TR],
    outcome: true,
    checks: [],
    note: 'The program runs in a fresh VM with debug_gc set, so freed heap slots are never reused. The Outcome holds stdout and stderr as lines, and the exit code; no process is started.',
  },
  {
    phase: 'check: the exit code and message',
    expect: [E_RT, E_EXIT, E_TR],
    outcome: true,
    checks: [
      { label: 'exit 70 == 70', value: 'ok', hot: true },
      { label: 'stderr[0]', value: 'ok', hot: true },
    ],
    note: 'First the exit code; then, since a runtime error is expected, the first stderr line must be exactly “runtime error: ” and the message.',
  },
  {
    phase: 'check: the trace, then stdout',
    expect: [E_RT, E_EXIT, E_TR],
    outcome: true,
    checks: [
      { label: 'exit 70 == 70', value: 'ok' },
      { label: 'stderr[0]', value: 'ok' },
      { label: 'stderr[1..] == trace', value: 'ok', hot: true },
      { label: 'stdout: none', value: 'ok', hot: true },
    ],
    result: 'test errors/call_spanning_lines.drip ... ok',
    note: 'The trace is pinned, so stderr[1..] must equal it line for line. (Unpinned, only the first at line would be checked against line 1.) No output is expected and none came. No failures: one ok line.',
  },
];

export default function CheckSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Checking one corpus program" steps={s} note={st.note}>
      <Svg w={400} h={300} title="Expectations parsed from a corpus program's comments, drip-rs's outcome, and the checks between them">
        <Box x={4} y={2} w={392} h={26} r={4} fill={tok('panel')} stroke={tok('line')}>
          <T x={12} y={15} size={12} mono weight={700}>{st.phase}</T>
        </Box>
        <T x={4} y={42} size={11} mono weight={700} fill={tok('muted')}>expectations</T>
        <Box x={4} y={52} w={392} h={64} r={4} fill={tok('panel')} stroke={tok('line')}>
          {st.expect.map((r, i) => (
            <g key={i}>
              <T x={12} y={66 + i * 18} size={11} mono fill={tok('muted')}>{r.label}</T>
              <T x={84} y={66 + i * 18} size={11} mono weight={r.hot ? 700 : undefined} fill={r.hot ? tok('safe') : tok('ink')}>{r.value}</T>
            </g>
          ))}
        </Box>
        <T x={4} y={130} size={11} mono weight={700} fill={tok('muted')}>outcome</T>
        <Box x={4} y={140} w={392} h={76} r={4} fill={st.outcome ? tok('panel') : tok('panel', 0.4)} stroke={tok('line')} dash={!st.outcome}>
          {st.outcome ? (
            <g>
              <T x={12} y={154} size={11} mono fill={tok('muted')}>stdout: (nothing)</T>
              <T x={12} y={170} size={11} mono fill={tok('muted')}>stderr: runtime error: cannot add …</T>
              <T x={12} y={186} size={11} mono fill={tok('muted')}>{'  '}at line 1 in fn f · at line 2 in script</T>
              <T x={12} y={204} size={11} mono fill={tok('muted')}>exit_code: 70</T>
            </g>
          ) : (
            <T x={200} y={178} size={11} anchor="middle" fill={tok('muted')}>not run yet</T>
          )}
        </Box>
        <T x={4} y={230} size={11} mono weight={700} fill={tok('muted')}>check()</T>
        <Box x={4} y={240} w={392} h={56} r={4} fill={tok('panel')} stroke={tok('line')}>
          {st.checks.length === 0 && !st.result && <T x={200} y={268} size={11} anchor="middle" fill={tok('muted')}>no failures collected</T>}
          {st.checks.map((c, i) => (
            <T key={i} x={12 + (i % 2) * 196} y={254 + Math.floor(i / 2) * 18} size={11} mono weight={c.hot ? 700 : undefined} fill={tok('safe')}>
              {c.label}: {c.value}
            </T>
          ))}
          {st.result && <T x={200} y={286} size={11} mono weight={700} anchor="middle" fill={tok('safe')}>{st.result}</T>}
        </Box>
      </Svg>
    </StepFrame>
  );
}
