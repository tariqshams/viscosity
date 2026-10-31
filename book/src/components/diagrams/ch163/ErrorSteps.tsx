// Chapter 163: the journey of one runtime error in drip-rs, for the
// Oven program of the chapter (heat does n * nil, called from bake, from
// go, from the script). The ips are from the real `drip-rs --disassemble`
// listing: the script's CALL is at 0021 (saved ip 23, line 8), go's INVOKE
// 'bake' at 0006 (saved ip 9, line 6), bake's INVOKE 'heat' at 0004
// (saved ip 7, line 2), and heat's MULTIPLY at 0003 (register ip 4,
// line 3; heat's own frame.ip is still 0). The steps follow
// Vm::runtime_error, Vm::interpret and main.rs; the stderr lines are the
// program's real output, which the TypeScript VM prints byte for byte.
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
  { name: 'script', ip: 'ip 23', line: 'lines[22] = 8' },
  { name: 'go', ip: 'ip 9', line: 'lines[8] = 6' },
  { name: 'bake', ip: 'ip 7', line: 'lines[6] = 2' },
  { name: 'heat', ip: 'ip 0 (stale)', line: 'lines[3] = 3' },
];

const MSG = 'Operands must be numbers.';
const L3 = '[line 3] in heat()';
const L2 = '[line 2] in bake()';
const L6 = '[line 6] in go()';
const L8 = '[line 8] in script';

const STATES: S[] = [
  {
    op: 'heat: 0003 OP_MULTIPLY',
    frames: FRAMES,
    reg: 'self.ip = 4',
    err: [],
    note: 'Four frames are running. pop_numbers finds 3 and nil, and its let ... else takes the else branch. Nothing has been printed yet.',
  },
  {
    op: 'runtime_error(message)',
    frames: FRAMES,
    reg: 'self.ip = 4',
    err: [MSG],
    note: 'The message goes into self.stderr, a Vec<String>, first. The trace follows, innermost frame first.',
  },
  {
    op: 'frame 3 (top): use the register',
    frames: FRAMES,
    reg: 'self.ip = 4',
    hot: 3,
    useReg: true,
    err: [MSG, L3],
    note: 'heat’s own ip field is 0: it has never made a call, so nobody saved it. The top frame reads the register instead (chapter 157). ip is past MULTIPLY, so the line is lines[ip − 1].',
  },
  {
    op: 'frame 2: the saved ip',
    frames: FRAMES,
    reg: 'self.ip = 4',
    hot: 2,
    err: [MSG, L3, L2],
    note: 'bake’s ip was saved by call when it invoked heat: 7, just past the 3-byte INVOKE. lines[6] is 2.',
  },
  {
    op: 'frames 1 and 0',
    frames: FRAMES,
    reg: 'self.ip = 4',
    hot: 0,
    err: [MSG, L3, L2, L6, L8],
    note: 'go gives line 6. The script’s function has name None, so its line says “in script”. Five lines, all in the VM’s own buffer.',
  },
  {
    op: 'Err(RuntimeError) up through ?',
    frames: [],
    reg: 'stack, frames cleared',
    err: [MSG, L3, L2, L6, L8],
    exit: 'exit_code: 70',
    note: 'runtime_error returns the unit struct, the ? operators carry it out of run, and interpret clears the stack, frames, chunk register and open upvalues so the VM can run another program.',
  },
  {
    op: 'main: print, then exit',
    frames: [],
    reg: 'stdout, then stderr',
    err: [MSG, L3, L2, L6, L8],
    exit: 'ExitCode::from(70)',
    note: 'main writes the Outcome’s stdout lines (none here), then each stderr line with eprintln!, and returns ExitCode::from(70). The TypeScript CLI writes the same bytes and exits with 70 too.',
  },
];

export default function ErrorSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A runtime error, from the failing instruction to the exit code" steps={s} note={st.note}>
      <Svg w={400} h={250} title="The call frames on the left and the VM's stderr lines on the right, as a runtime error is reported">
        <T x={8} y={12} size={12} mono weight={700}>{st.op}</T>
        <T x={8} y={34} size={10} mono weight={700} fill={tok('muted')}>frames (innermost on top)</T>
        {st.frames.length === 0 && (
          <Box x={8} y={44} w={176} h={30} r={3} fill={tok('panel')} stroke={tok('line')} dash>
            <T x={96} y={59} size={10} anchor="middle" fill={tok('muted')}>empty</T>
          </Box>
        )}
        {[...st.frames].reverse().map((f, j) => {
          const i = st.frames.length - 1 - j;
          const y = 44 + j * 38;
          const hot = st.hot === i;
          const stale = f.ip.includes('stale');
          return (
            <Box key={i} x={8} y={y} w={176} h={32} r={3} fill={hot ? tok('brand', 0.16) : tok('panel')} stroke={hot ? tok('brand') : tok('line')}>
              <T x={16} y={y + 11} size={11} mono weight={700} fill={tok('ink')}>{f.name}</T>
              <T x={176} y={y + 11} size={10} mono anchor="end" fill={stale ? tok('danger') : tok('muted')}>{f.ip}</T>
              <T x={16} y={y + 24} size={9} mono fill={hot ? tok('brand') : tok('muted')}>{hot && st.useReg ? 'register: lines[3] = 3' : f.line}</T>
            </Box>
          );
        })}
        <Box x={8} y={204} w={176} h={26} r={3} fill={tok('accent', 0.1)} stroke={tok('accent')}>
          <T x={16} y={217} size={10} mono fill={tok('ink')}>{st.reg}</T>
        </Box>
        <T x={200} y={34} size={10} mono weight={700} fill={tok('muted')}>self.stderr</T>
        <Box x={200} y={44} w={192} h={136} r={4} fill={tok('panel')} stroke={tok('line')}>
          {st.err.map((l, i) => (
            <T key={i} x={208} y={60 + i * 22} size={10} mono weight={i === st.err.length - 1 ? 700 : undefined} fill={i === st.err.length - 1 ? tok('safe') : tok('ink')}>
              {l}
            </T>
          ))}
        </Box>
        {st.exit && (
          <Box x={200} y={192} w={192} h={38} r={4} fill={tok('safe', 0.12)} stroke={tok('safe')}>
            <T x={296} y={211} size={11} mono weight={700} anchor="middle" fill={tok('safe')}>{st.exit}</T>
          </Box>
        )}
        <T x={8} y={244} size={9} fill={tok('muted')}>Each line is lines[ip − 1]: ip is already past the failing instruction.</T>
      </Svg>
    </StepFrame>
  );
}
