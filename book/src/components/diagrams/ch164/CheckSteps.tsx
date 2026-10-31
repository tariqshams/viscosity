// Chapter 164: tests/common/mod.rs checking one corpus program,
// super/extra_arguments.drip. The two expectation comments are the
// file's real lines 9 and 10, and the outcome is what drip-rs really
// prints for it (stdout "Derived.foo()", then the message and a two-line
// trace on stderr, exit code 70). The steps follow parse_expectations and
// check in that file: runtime error message, the first [line N] of the
// trace, the exit code, then stdout line by line.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type Row = { label: string; value: string; ok?: boolean; hot?: boolean };
type S = { phase: string; expect: Row[]; outcome: boolean; checks: Row[]; result?: string; note: string };

const E_OUT: Row = { label: 'output', value: '["Derived.foo()"]' };
const E_RT: Row = { label: 'runtime', value: '("Expected 2…", 10)' };
const E_EXIT: Row = { label: 'exit', value: '70' };

const STATES: S[] = [
  {
    phase: 'line 9: // expect: Derived.foo()',
    expect: [{ ...E_OUT, hot: true }],
    outcome: false,
    checks: [],
    note: 'parse_expectations reads the source line by line. expect_output finds “// expect:”, drops one optional space, and the rest of the line is one expected line of stdout.',
  },
  {
    phase: 'line 10: // expect runtime error: ...',
    expect: [E_OUT, { ...E_RT, hot: true }, { ...E_EXIT, hot: true }],
    outcome: false,
    checks: [],
    note: 'A runtime-error comment records the message and the line it sits on, 10, and sets the expected exit code to 70. Nothing else in the file is an expectation.',
  },
  {
    phase: 'drip::run(source, options)',
    expect: [E_OUT, E_RT, E_EXIT],
    outcome: true,
    checks: [],
    note: 'The program runs in a fresh VM with debug_gc: freed slots are never reused. The Outcome holds stdout and stderr as lines, and the exit code. No process is started.',
  },
  {
    phase: 'check: the message',
    expect: [E_OUT, E_RT, E_EXIT],
    outcome: true,
    checks: [{ label: 'stderr[0] == message', value: 'ok', ok: true, hot: true }],
    note: 'With a runtime error expected, stderr must have at least two lines, and the first must be the message, exactly.',
  },
  {
    phase: 'check: the line',
    expect: [E_OUT, E_RT, E_EXIT],
    outcome: true,
    checks: [
      { label: 'stderr[0] == message', value: 'ok', ok: true },
      { label: 'first [line N] == 10', value: 'ok', ok: true, hot: true },
    ],
    note: 'first_line_number finds the first “[line N]” in the trace: the innermost frame, line 10. The script’s line 14 is not checked. That is why the comment goes on the failing line.',
  },
  {
    phase: 'check: exit code and stdout',
    expect: [E_OUT, E_RT, E_EXIT],
    outcome: true,
    checks: [
      { label: 'stderr[0] == message', value: 'ok', ok: true },
      { label: 'first [line N] == 10', value: 'ok', ok: true },
      { label: 'exit code 70 == 70', value: 'ok', ok: true, hot: true },
      { label: 'stdout line 1', value: 'ok', ok: true, hot: true },
    ],
    result: 'test super/extra_arguments.drip ... ok',
    note: 'Then the exit code, then stdout line by line up to the longer of the two lists. No failures, so the suite prints one ok line, and moves on to the next file.',
  },
];

export default function CheckSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Checking one corpus program" steps={s} note={st.note}>
      <Svg w={400} h={252} title="Expectations parsed from a corpus program's comments, drip-rs's outcome, and the checks between them">
        <T x={8} y={12} size={11} mono weight={700}>{st.phase}</T>
        <T x={8} y={34} size={10} mono weight={700} fill={tok('muted')}>Expectations</T>
        <Box x={8} y={42} w={188} h={80} r={4} fill={tok('panel')} stroke={tok('line')}>
          {st.expect.map((r, i) => (
            <g key={i}>
              <T x={16} y={58 + i * 22} size={10} mono fill={tok('muted')}>{r.label}</T>
              <T x={70} y={58 + i * 22} size={10} mono weight={r.hot ? 700 : undefined} fill={r.hot ? tok('safe') : tok('ink')}>{r.value}</T>
            </g>
          ))}
        </Box>
        <T x={206} y={34} size={10} mono weight={700} fill={tok('muted')}>Outcome</T>
        <Box x={206} y={42} w={186} h={80} r={4} fill={st.outcome ? tok('panel') : tok('panel', 0.4)} stroke={tok('line')} dash={!st.outcome}>
          {st.outcome ? (
            <g>
              <T x={214} y={56} size={9} mono fill={tok('muted')}>stdout: Derived.foo()</T>
              <T x={214} y={72} size={9} mono fill={tok('muted')}>stderr: Expected 2 ... 4.</T>
              <T x={214} y={86} size={9} mono fill={tok('muted')}>        [line 10] in foo()</T>
              <T x={214} y={100} size={9} mono fill={tok('muted')}>        [line 14] in script</T>
              <T x={214} y={114} size={9} mono fill={tok('muted')}>exit_code: 70</T>
            </g>
          ) : (
            <T x={299} y={82} size={10} anchor="middle" fill={tok('muted')}>not run yet</T>
          )}
        </Box>
        <T x={8} y={140} size={10} mono weight={700} fill={tok('muted')}>check()</T>
        <Box x={8} y={148} w={384} h={70} r={4} fill={tok('panel')} stroke={tok('line')}>
          {st.checks.length === 0 && <T x={200} y={183} size={10} anchor="middle" fill={tok('muted')}>no failures collected</T>}
          {st.checks.map((c, i) => (
            <T key={i} x={16 + (i % 2) * 190} y={166 + Math.floor(i / 2) * 26} size={10} mono weight={c.hot ? 700 : undefined} fill={c.ok ? tok('safe') : tok('danger')}>
              {c.label}: {c.value}
            </T>
          ))}
        </Box>
        {st.result && (
          <Box x={8} y={226} w={384} h={22} r={3} fill={tok('safe', 0.12)} stroke={tok('safe')}>
            <T x={200} y={237} size={10} mono weight={700} anchor="middle" fill={tok('safe')}>{st.result}</T>
          </Box>
        )}
      </Svg>
    </StepFrame>
  );
}
