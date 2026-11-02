import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 312: parse_args and main in engine/rust/crates/cli/src/main.rs,
// one argument at a time, on
//   viscosity build a.js b.js -o out/ --mode fast
// The messages are the CLI's own (run by the author with the release
// build on 2026-10-31): "--mode must be auto or opt-in", then a blank
// line and the help text, on stderr, exit status 1.
const ARGV = ['build', 'a.js', 'b.js', '-o', 'out/', '--mode', 'fast'];

type Fields = { cmd?: string; files: string[]; out?: string; mode?: string };
type S = { at: number[]; arm: string; f: Fields; err?: boolean; exit?: boolean; note: string };

const STATES: S[] = [
  { at: [], arm: '', f: { files: [] }, note: 'The shell splits the command line into words. std::env::args_os() hands them over as OsStrings (a file name need not be UTF-8), the program’s own name first, and main skips that: argv is these seven strings.' },
  { at: [0], arm: 'cmd = argv[0]', f: { cmd: 'build', files: [] }, note: 'The first word is the command. parse_args stores it without checking it: run() checks it later and reports “unknown command” as a usage error.' },
  { at: [1], arm: '_ if !a.starts_with(\'-\')', f: { cmd: 'build', files: ['a.js'] }, note: 'Anything that does not start with a dash is a file. The match has no arm for it by name, so the guard arm near the end catches it.' },
  { at: [2], arm: '_ if !a.starts_with(\'-\')', f: { cmd: 'build', files: ['a.js', 'b.js'] }, note: 'A second file. Flags and files can come in any order, because each word is looked at on its own.' },
  { at: [3, 4], arm: '"-o" | "--out" => next()?', f: { cmd: 'build', files: ['a.js', 'b.js'], out: 'out/' }, note: 'A flag that takes a value. The closure next() moves i on by one and returns that word, or a usage error “-o needs a value” if the line ended.' },
  { at: [5, 6], arm: '"--mode" => match next()?', f: { cmd: 'build', files: ['a.js', 'b.js'], out: 'out/' }, err: true, note: '--mode takes a value too, and only two are allowed. “fast” is neither, so parse_args returns Err(CliError::Usage("--mode must be auto or opt-in")) and stops.' },
  { at: [5, 6], arm: 'Err(CliError::Usage(e))', f: { cmd: 'build', files: ['a.js', 'b.js'], out: 'out/' }, err: true, exit: true, note: 'main matches on the error. A usage error prints “viscosity: ” and the message, a blank line and the help, all on stderr, and the process exits with status 1. Nothing was compiled.' },
];

const CW = [44, 36, 36, 22, 36, 52, 38];
const X0 = 8;
const xs = CW.map((_, k) => X0 + CW.slice(0, k).reduce((a, w) => a + w + 4, 0));

export default function ArgvSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const row = (y: number, k: string, v: string, on: boolean) => (
    <g>
      <T x={24} y={y} size={11} mono fill={tok('muted')}>{k}</T>
      <T x={92} y={y} size={11} mono fill={on ? tok('brand') : tok('ink')}>{v}</T>
    </g>
  );
  const f = st.f;
  return (
    <StepFrame title="Parsing one command line" steps={s} note={st.note}>
      <Svg w={400} h={252} title="parse_args walking the words of a command line and filling in Args, ending in a usage error">
        <T x={X0} y={12} size={10} fill={tok('muted')}>argv</T>
        {ARGV.map((a, k) => {
          const on = st.at.includes(k);
          const bad = on && st.err && k === 6;
          return (
            <Box key={a} x={xs[k]} y={22} w={CW[k]} h={24} r={3}
              fill={bad ? tok('danger', 0.15) : on ? tok('brand', 0.15) : tok('panel')}
              stroke={bad ? tok('danger') : on ? tok('brand') : tok('line')}>
              <T x={xs[k] + CW[k] / 2} y={34} size={10} mono anchor="middle">{a}</T>
            </Box>
          );
        })}
        <T x={X0} y={64} size={10} fill={tok('muted')}>match arm</T>
        <T x={X0} y={80} size={11} mono fill={st.err ? tok('danger') : tok('brand')}>{st.arm || '(not started)'}</T>
        <Box x={X0} y={96} w={384} h={st.exit ? 72 : 100} r={5}>
          <T x={16} y={110} size={10} weight={700} fill={tok('muted')}>Args</T>
          {row(128, 'cmd', f.cmd ? `"${f.cmd}"` : '""', st.at.includes(0))}
          {row(146, 'files', `[${f.files.map((x) => `"${x}"`).join(', ')}]`, st.at.includes(1) || st.at.includes(2))}
          {row(164, 'out', f.out ? `"${f.out}"` : '""', st.at.includes(4) && !st.err)}
          {!st.exit && row(182, 'opts.mode', 'Mode::Auto (default)', false)}
        </Box>
        {st.exit && (
          <Box x={X0} y={176} w={384} h={68} r={5} fill={tok('danger', 0.08)} stroke={tok('danger')}>
            <T x={16} y={190} size={10} weight={700} fill={tok('danger')}>stderr · exit status 1</T>
            <T x={16} y={208} size={10} mono>viscosity: --mode must be auto or opt-in</T>
            <T x={16} y={224} size={10} mono fill={tok('muted')}>(blank line)</T>
            <T x={16} y={238} size={10} mono fill={tok('muted')}>viscosity: rewrites arrays of objects …</T>
          </Box>
        )}
      </Svg>
    </StepFrame>
  );
}
