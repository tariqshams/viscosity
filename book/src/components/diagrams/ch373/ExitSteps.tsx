// Chapter 373: one error enum, matched in one place to choose an exit
// code. The codes are drip-rs's (book/companion/rust/src/main.rs and
// vm.rs): 64 bad usage, 66 unreadable file, 65 compile error, 70 runtime
// error. DripError itself is a design for the chapter, not drip-rs code.
// The last step's message is rustc 1.97.0's E0004, trimmed.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `match err {
    DripError::Usage => 64,
    DripError::Io(_) => 66,
    DripError::Compile(_) => 65,
    DripError::Runtime(_) => 70,
}`;

type S = { line: number | null; err: string; code: string; bad?: boolean; note: string };

const STATES: S[] = [
  { line: 0, err: '', code: '', note: 'Every function in the crate returns Result<T, DripError>, so whatever went wrong arrives at main as one value of one type. One match turns it into an exit code.' },
  { line: 1, err: 'Usage', code: '64', note: 'drip-rs was called with no file. The variant carries nothing: the kind is the whole story. Exit code 64, as drip-rs uses.' },
  { line: 2, err: 'Io(No such file…)', code: '66', note: 'The file could not be read. The variant holds the io::Error, so main can still print its message, but it chose the exit code from the kind alone, without reading any text.' },
  { line: 3, err: 'Compile([3 messages])', code: '65', note: 'The compiler found three errors and kept them all, in a Vec<String>. A test, an editor and a shell script can each do something different with this variant.' },
  { line: 4, err: 'Runtime(cannot add…)', code: '70', note: 'The program started and then failed: exit code 70. A test that expects a runtime error can now refuse a compile error by matching, not by searching the message.' },
  { line: null, err: 'Timeout (new variant)', code: 'E0004', bad: true, note: 'Add a fifth variant and this match stops compiling: “non-exhaustive patterns: DripError::Timeout not covered”. With String errors, nothing would tell you which code forgot the new case.' },
];

export default function ExitSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="One enum, one match, one exit code" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={84} title="The error value arriving at main, and the exit code the match picks for it">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>err</T>
        <Box x={8} y={24} w={236} h={36} r={4} fill={st.err ? tok(st.bad ? 'danger' : 'f2', 0.15) : 'transparent'} stroke={st.err ? tok(st.bad ? 'danger' : 'f2') : tok('line')} dash={!st.err}>
          <T x={18} y={42} size={12} mono fill={tok('ink')}>{st.err ? `DripError::${st.err}` : '…'}</T>
        </Box>
        <T x={300} y={14} size={11} weight={700} fill={tok('muted')}>exit code</T>
        <Box x={300} y={24} w={92} h={36} r={4} fill={st.code ? tok(st.bad ? 'danger' : 'safe', 0.15) : 'transparent'} stroke={st.code ? tok(st.bad ? 'danger' : 'safe') : tok('line')} dash={!st.code}>
          <T x={346} y={42} size={14} mono weight={700} anchor="middle" fill={tok('ink')}>{st.code || '?'}</T>
        </Box>
        <T x={272} y={42} size={14} anchor="middle" fill={tok('muted')}>→</T>
        <T x={8} y={76} size={11} fill={tok('muted')}>codes as drip-rs uses them; the enum is a design</T>
      </Svg>
    </StepFrame>
  );
}
