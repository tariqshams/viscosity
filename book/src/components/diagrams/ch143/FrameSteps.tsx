// Chapter 143: the frame stack and the registers while drip-rs runs
//   fn add(a, b) {
//     return a + b;
//   }
//   print add(1, 2);
// The instruction offsets are the real `drip-rs --disassemble` listing
// for that program (rustc 1.97, 2026-11-02): call is at 0015, so the
// caller's saved ip is 17; add's return is at 0005. The register and
// frame values follow Vm::call, Vm::pop_frame and the Return arm of
// Vm::run in book/companion/rust/src/vm.rs.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type Frame = { fn: string; ip: string; slots: number; stale?: boolean };
type S = {
  op: string;
  stack: string[];
  frames: Frame[];
  reg: { ip: string; chunk: string; slots: number } | null;
  changed: ('ip' | 'chunk' | 'slots' | 'saved')[];
  note: string;
};

const STATES: S[] = [
  {
    op: 'interpret: call(script, 0)',
    stack: ['fn script'],
    frames: [{ fn: 'script', ip: '0', slots: 0, stale: true }],
    reg: { ip: '0', chunk: 'script', slots: 0 },
    changed: ['ip', 'chunk', 'slots'],
    note: 'The script itself is the first call. call pushes a CallFrame for it and loads the three registers: ip 0, the script’s Rc<Chunk>, and stack slot 0 as the frame’s base.',
  },
  {
    op: 'script: 0015 call 2',
    stack: ['fn script', 'fn add', '1', '2'],
    frames: [{ fn: 'script', ip: '0', slots: 0, stale: true }],
    reg: { ip: '17', chunk: 'script', slots: 0 },
    changed: ['ip'],
    note: 'The script has pushed add and its two arguments, and read the call’s operand, so the register ip is now 17. The ip field in the script’s own frame still says 0: nobody reads it while the script is running.',
  },
  {
    op: 'call(add, 2)',
    stack: ['fn script', 'fn add', '1', '2'],
    frames: [{ fn: 'script', ip: '17', slots: 0 }, { fn: 'add', ip: '0', slots: 1, stale: true }],
    reg: { ip: '0', chunk: 'add', slots: 1 },
    changed: ['saved', 'ip', 'chunk', 'slots'],
    note: 'The arity, 2, matches, and 1 frame is under FRAMES_MAX (256). call writes the register ip, 17, into the caller’s frame, pushes add’s frame with slots = 4 − 2 − 1 = 1, and loads add’s registers. The Call arm needs no reload.',
  },
  {
    op: 'add: 0005 return',
    stack: ['fn script', 'fn add', '1', '2', '3'],
    frames: [{ fn: 'script', ip: '17', slots: 0 }, { fn: 'add', ip: '0', slots: 1, stale: true }],
    reg: { ip: '6', chunk: 'add', slots: 1 },
    changed: ['ip'],
    note: 'load.local 1 and load.local 2 read stack slots 1 + 1 and 1 + 2, the arguments, and add leaves 3. Only the register ip moved, from 0 to 6.',
  },
  {
    op: 'Return: pop_frame()',
    stack: ['fn script', 'fn add', '1', '2'],
    frames: [{ fn: 'script', ip: '17', slots: 0, stale: true }],
    reg: { ip: '17', chunk: 'script', slots: 0 },
    changed: ['ip', 'chunk', 'slots'],
    note: 'The Return arm pops the result, 3, and closes upvalues (none here). pop_frame moves add’s CallFrame out of the Vec and loads the caller’s ip, chunk and slots back into the registers.',
  },
  {
    op: 'truncate(1); push(3)',
    stack: ['fn script', '3'],
    frames: [{ fn: 'script', ip: '17', slots: 0, stale: true }],
    reg: { ip: '17', chunk: 'script', slots: 0 },
    changed: [],
    note: 'The popped frame says its slots start at 1, so stack.truncate(1) drops add and both arguments in one go, and the result goes where add used to be. The script carries on at byte 17: print.',
  },
  {
    op: 'script: 0019 return',
    stack: [],
    frames: [],
    reg: null,
    changed: [],
    note: 'At the end, pop_frame pops the script’s frame and finds no caller, so it returns None. The Return arm clears the stack and run returns Ok(()).',
  },
];

const SW = 92;
const slotY = (i: number) => 214 - i * 30;

export default function FrameSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const has = (k: S['changed'][number]) => st.changed.includes(k);
  return (
    <StepFrame title="A call and a return: frames and registers" steps={s} note={st.note}>
      <Svg w={400} h={290} title="The value stack, the frames Vec and the VM's registers during one call">
        <Box x={8} y={6} w={384} h={28} r={4} fill={tok('panel')} stroke={tok('line')}>
          <T x={16} y={20} size={12} mono weight={700}>{st.op}</T>
        </Box>

        <T x={8} y={52} size={11} mono weight={700} fill={tok('muted')}>stack: Vec&lt;Value&gt;</T>
        {[0, 1, 2, 3, 4].map((i) => {
          const v = st.stack[i];
          const base = st.reg && i === st.reg.slots && v !== undefined;
          return (
            <g key={i}>
              <Box x={30} y={slotY(i)} w={SW} h={26} r={3}
                fill={v === undefined ? tok('paper') : base ? tok('brand', 0.14) : tok('panel')}
                stroke={base ? tok('brand') : tok('line')} dash={v === undefined}>
                {v !== undefined && <T x={30 + SW / 2} y={slotY(i) + 13} size={11} mono anchor="middle" fill={tok('ink')}>{v}</T>}
              </Box>
              <T x={22} y={slotY(i) + 13} size={11} mono anchor="end" fill={tok('muted')}>{i}</T>
            </g>
          );
        })}

        <T x={140} y={52} size={11} mono weight={700} fill={tok('muted')}>frames: Vec&lt;CallFrame&gt;</T>
        {st.frames.map((f, k) => {
          const y = 184 - k * 66;
          const top = k === st.frames.length - 1;
          return (
            <Box key={k} x={140} y={y} w={120} h={56} r={4}
              fill={top ? tok('brand', 0.08) : tok('panel')} stroke={top ? tok('brand') : tok('line')}>
              <T x={148} y={y + 13} size={11} mono weight={700} fill={tok('ink')}>{f.fn}</T>
              <T x={148} y={y + 29} size={11} mono fill={f.stale ? tok('muted') : has('saved') && k === 0 ? tok('safe') : tok('ink')}
                opacity={f.stale ? 0.6 : 1}>ip: {f.ip}{f.stale ? ' (stale)' : ''}</T>
              <T x={148} y={y + 44} size={11} mono fill={tok('ink')}>slots: {f.slots}</T>
            </Box>
          );
        })}
        {st.frames.length === 0 && <T x={200} y={210} size={11} mono anchor="middle" fill={tok('muted')}>(empty)</T>}

        <T x={276} y={52} size={11} mono weight={700} fill={tok('muted')}>registers (Vm)</T>
        <Box x={276} y={62} w={116} h={92} r={4} fill={tok('panel')} stroke={tok('accent')}>
          {st.reg ? (
            <>
              <T x={284} y={80} size={11} mono fill={has('ip') ? tok('accent') : tok('ink')} weight={has('ip') ? 700 : undefined}>ip: {st.reg.ip}</T>
              <T x={284} y={104} size={11} mono fill={has('chunk') ? tok('accent') : tok('ink')} weight={has('chunk') ? 700 : undefined}>chunk: {st.reg.chunk}</T>
              <T x={284} y={128} size={11} mono fill={has('slots') ? tok('accent') : tok('ink')} weight={has('slots') ? 700 : undefined}>slots: {st.reg.slots}</T>
            </>
          ) : (
            <T x={334} y={108} size={11} mono anchor="middle" fill={tok('muted')}>run returned</T>
          )}
        </Box>
        {st.reg && st.frames.length > 0 && (
          <Arrow x1={276} y1={130} x2={262} y2={184 - (st.frames.length - 1) * 66 + 40} color={tok('accent')} dash />
        )}
        {has('saved') && (
          <Arrow x1={300} y1={156} x2={262} y2={210} color={tok('safe')} bend={-0.3} />
        )}
        <T x={8} y={250} size={11} fill={tok('muted')}>Shaded stack slot: the running frame’s slot 0 (the slots register).</T>
        <T x={8} y={266} size={11} fill={tok('muted')}>Dashed arrow: the registers belong to the top frame.</T>
        <T x={8} y={282} size={11} fill={tok('muted')}>“stale”: the field is only written when this frame makes a call.</T>
      </Svg>
    </StepFrame>
  );
}
