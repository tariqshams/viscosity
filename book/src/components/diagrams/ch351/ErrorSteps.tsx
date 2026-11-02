// Chapter 351: the journey of one runtime error in drip-rs, for the oven
// program of the chapter (heat does n * none, called from bake, from go,
// from the script). The ips are from the real `drip-rs --disassemble`
// listing (rustc 1.97, 2026-11-02): the script's call is at 0031 (saved
// ip 33, lines[32] = 8), go's invoke 'bake' at 0008 (saved ip 12,
// lines[11] = 6), bake's invoke 'heat' at 0004 (saved ip 8, lines[7] =
// 2), and heat's mul at 0003 (register ip 4, lines[3] = 3; heat's own
// frame.ip is still 0). The steps follow Vm::runtime_error,
// Vm::interpret and main.rs; the stderr lines are the program's real
// output, which the TypeScript VM prints byte for byte.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type Fr = { name: string; ip: string; line: string };
type S = {
  op: string;
  frames: Fr[];
  reg: string;
  hot?: number;
  useReg?: boolean;
  err: string[];
  exit?: string;
  note: string;
};

const FRAMES: Fr[] = [
  { name: 'script', ip: 'frame.ip 33', line: 'lines[32] = 8' },
  { name: 'fn go', ip: 'frame.ip 12', line: 'lines[11] = 6' },
  { name: 'fn bake', ip: 'frame.ip 8', line: 'lines[7] = 2' },
  { name: 'fn heat', ip: 'frame.ip 0 (stale)', line: 'lines[3] = 3' },
];

const MSG = "runtime error: cannot use '*' on a number and none";
const L3 = '  at line 3 in fn heat';
const L2 = '  at line 2 in fn bake';
const L6 = '  at line 6 in fn go';
const L8 = '  at line 8 in script';

const STATES: S[] = [
  {
    op: 'heat: 0003 mul',
    frames: FRAMES,
    reg: 'self.ip = 4',
    err: [],
    note: 'Four frames are running. pop_numbers finds a number and none, and its let ... else takes the else branch. Nothing has been printed yet.',
  },
  {
    op: 'runtime_error(message)',
    frames: FRAMES,
    reg: 'self.ip = 4',
    err: [MSG],
    note: 'The message goes into self.stderr, a Vec<String>, first, with “runtime error: ” in front. The trace follows, innermost frame first.',
  },
  {
    op: 'the top frame: use the register',
    frames: FRAMES,
    reg: 'self.ip = 4',
    hot: 3,
    useReg: true,
    err: [MSG, L3],
    note: 'heat’s own ip field is 0: it has made no call, so nothing saved it. The top frame reads the register self.ip instead. ip is already past mul, so the line is lines[ip − 1] = lines[3] = 3.',
  },
  {
    op: 'the next frame: its saved ip',
    frames: FRAMES,
    reg: 'self.ip = 4',
    hot: 2,
    err: [MSG, L3, L2],
    note: 'bake’s ip was saved by call when it invoked heat: 8, just past the 4-byte invoke. lines[7] is 2, the line of the call.',
  },
  {
    op: 'the outer frames',
    frames: FRAMES,
    reg: 'self.ip = 4',
    hot: 0,
    err: [MSG, L3, L2, L6, L8],
    note: 'go gives line 6. The script’s function has no name and is_script set, so its line says “in script”. Five lines, all in the VM’s own buffer.',
  },
  {
    op: 'Err(RuntimeError) up through ?',
    frames: [],
    reg: 'stack, frames cleared',
    err: [MSG, L3, L2, L6, L8],
    exit: 'exit_code: 70',
    note: 'runtime_error returns the unit struct RuntimeError, the ? operators carry it out of run, and interpret clears the stack, the frames, the chunk register and the open upvalues, so the VM can run another program.',
  },
  {
    op: 'main: print, then exit',
    frames: [],
    reg: 'stdout, then stderr',
    err: [MSG, L3, L2, L6, L8],
    exit: 'ExitCode::from(70)',
    note: 'main writes the Outcome’s stdout lines (none here), then each stderr line with eprintln!, and returns ExitCode::from(70). The TypeScript VM writes the same bytes and exits with 70 too.',
  },
];

export default function ErrorSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A runtime error, from the failing instruction to the exit code" steps={s} note={st.note}>
      <Svg w={400} h={330} title="The call frames above and the VM's stderr lines below, as a runtime error is reported">
        <Box x={4} y={2} w={392} h={26} r={4} fill={tok('panel')} stroke={tok('line')}>
          <T x={12} y={15} size={12} mono weight={700}>{st.op}</T>
        </Box>
        <T x={4} y={42} size={11} mono weight={700} fill={tok('muted')}>frames (innermost on top)</T>
        {st.frames.length === 0 && (
          <Box x={4} y={52} w={392} h={28} r={3} fill={tok('panel')} stroke={tok('line')} dash>
            <T x={200} y={66} size={11} anchor="middle" fill={tok('muted')}>empty</T>
          </Box>
        )}
        {[...st.frames].reverse().map((f, j) => {
          const i = st.frames.length - 1 - j;
          const y = 52 + j * 30;
          const hot = st.hot === i;
          const stale = f.ip.includes('stale');
          return (
            <Box key={i} x={4} y={y} w={392} h={26} r={3} fill={hot ? tok('brand', 0.16) : tok('panel')} stroke={hot ? tok('brand') : tok('line')}>
              <T x={12} y={y + 13} size={12} mono weight={700} fill={tok('ink')}>{f.name}</T>
              <T x={96} y={y + 13} size={11} mono fill={stale ? tok('danger') : tok('muted')}>{f.ip}</T>
              <T x={388} y={y + 13} size={11} mono anchor="end" fill={hot ? tok('brand') : tok('muted')}>
                {hot && st.useReg ? 'register: lines[3] = 3' : f.line}
              </T>
            </Box>
          );
        })}
        <Box x={4} y={176} w={392} h={24} r={3} fill={tok('accent', 0.1)} stroke={tok('accent')}>
          <T x={12} y={188} size={11} mono fill={tok('ink')}>{st.reg}</T>
        </Box>
        <T x={4} y={214} size={11} mono weight={700} fill={tok('muted')}>self.stderr</T>
        <Box x={4} y={224} w={392} h={100} r={4} fill={tok('panel')} stroke={tok('line')}>
          {st.err.map((l, i) => (
            <T key={i} x={10} y={238 + i * 18} size={11} mono weight={i === st.err.length - 1 ? 700 : undefined} fill={i === st.err.length - 1 ? tok('safe') : tok('ink')}>
              {l.replace(/^ {2}/, '  ')}
            </T>
          ))}
          {st.exit && (
            <T x={388} y={312} size={12} mono weight={700} anchor="end" fill={tok('safe')}>{st.exit}</T>
          )}
        </Box>
      </Svg>
    </StepFrame>
  );
}
