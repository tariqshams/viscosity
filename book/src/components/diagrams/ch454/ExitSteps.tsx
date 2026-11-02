import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 454: main() in engine/rust/crates/cli/src/main.rs, on six
// command lines. Every message and status is real: the author ran the
// release build (cargo build --release -p viscosity-cli, rustc 1.97) on
// p.js (a 1000-element particles loop), bad.js ("let a = ;") and a
// missing gone.js, and printed $? after each.
type Arm = 'early' | 'ok' | 'okf' | 'usage' | 'other';
type S = { cmd: string; arm: Arm; out: string; err: string[]; code: number; note: string };

const STATES: S[] = [
  { cmd: 'viscosity --version', arm: 'early', out: 'viscosity 0.0.1', err: [], code: 0, note: 'main looks at the first word before anything else. --version (and --help, -h, or no words at all) is answered at once, on stdout, with status 0; run() is never called.' },
  { cmd: 'viscosity explain p.js', arm: 'ok', out: 'ps (line 1) {x, vx} → struct …', err: [], code: 0, note: 'A normal run. run() parses the words, compiles p.js and writes the report to stdout. It returns Ok(true), and main turns that into ExitCode::SUCCESS, status 0.' },
  { cmd: 'viscosity explain p.js bad.js', arm: 'okf', out: '== p.js ==  ps (line 1) …', err: ['viscosity: bad.js: Unexpected', '  token (1:8)'], code: 1, note: 'Two files, one broken. p.js is still reported; bad.js gets one line on stderr. The run itself worked, so run() returns Ok(false): no help, but status 1, so a script can tell.' },
  { cmd: 'viscosity explain p.js --mode fast', arm: 'usage', out: '', err: ['viscosity: --mode must be auto', '  or opt-in', '(blank line, then the help)'], code: 1, note: 'The command line itself is wrong. parse_args returns Err(Usage(...)), and main prints the message, a blank line and the 27-line help, all on stderr, with status 1. Nothing was compiled.' },
  { cmd: 'viscosity explain gone.js', arm: 'other', out: '', err: ['viscosity: cannot read gone.js:', '  No such file or directory', '  (os error 2)'], code: 1, note: 'The words were fine; the file is missing. That is Err(Other(...)): one line on stderr and status 1, with no help, because the help would bury the line that matters.' },
  { cmd: 'viscosity explain bad.js', arm: 'other', out: '', err: ['viscosity: Unexpected token (1:8)'], code: 1, note: 'One file with a syntax error. With a single file, the error ends the run as Other: the message and its position (line 1, column 8), status 1, no help.' },
];

const ARMS: { k: Arm; label: string; x: number }[] = [
  { k: 'early', label: '--version', x: 8 },
  { k: 'ok', label: 'Ok(true)', x: 86 },
  { k: 'okf', label: 'Ok(false)', x: 164 },
  { k: 'usage', label: 'Usage', x: 242 },
  { k: 'other', label: 'Other', x: 320 },
];

export default function ExitSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="How main ends a run" steps={s} note={st.note}>
      <Svg w={400} h={262} title="main matching on the result of run: success, a failed file, a usage error or another error, each with its outputs and exit status">
        <T x={8} y={12} size={12} mono weight={700}>{`$ ${st.cmd}`}</T>
        <Box x={8} y={26} w={384} h={30} r={5} fill={tok('panel')} stroke={tok('ink', 0.5)}>
          <T x={200} y={41} size={12} mono anchor="middle">match run(&amp;argv, ...)</T>
        </Box>
        {ARMS.map((a) => {
          const on = a.k === st.arm;
          const c = a.k === 'early' || a.k === 'ok' ? 'safe' : a.k === 'okf' ? 'warn' : 'danger';
          return (
            <g key={a.k}>
              <Arrow x1={a.x + 36} y1={58} x2={a.x + 36} y2={78} color={on ? tok(c) : tok('line')} />
              <Box x={a.x} y={80} w={72} h={28} r={4} fill={on ? tok(c, 0.18) : tok('panel')} stroke={on ? tok(c) : tok('line')}>
                <T x={a.x + 36} y={94} size={11} mono anchor="middle" weight={on ? 700 : undefined} fill={on ? undefined : tok('muted')}>{a.label}</T>
              </Box>
            </g>
          );
        })}
        <T x={8} y={128} size={11} weight={700} fill={tok('brand')}>stdout</T>
        <T x={70} y={128} size={11} mono>{st.out || '(nothing)'}</T>
        <T x={8} y={150} size={11} weight={700} fill={tok('danger')}>stderr</T>
        {st.err.length === 0 && <T x={70} y={150} size={11} mono>(nothing)</T>}
        {st.err.map((l, k) => (
          <T key={k} x={70} y={150 + k * 17} size={11} mono>{l}</T>
        ))}
        <Box x={8} y={214} w={384} h={40} r={5} fill={tok(st.code === 0 ? 'safe' : 'danger', 0.1)} stroke={tok(st.code === 0 ? 'safe' : 'danger')}>
          <T x={20} y={234} size={13} weight={700}>{`exit status ${st.code}`}</T>
          <T x={380} y={234} size={11} anchor="end" fill={tok('muted')}>{st.code === 0 ? 'ExitCode::SUCCESS' : 'ExitCode::FAILURE'}</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
