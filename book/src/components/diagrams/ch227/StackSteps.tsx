// Reserving, using and releasing 16 bytes of stack on RV64. The stack
// grows towards lower addresses and sp stays a multiple of 16 (psABI).
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `addi sp, sp, -16   # reserve 16 bytes
sd   ra, 8(sp)     # save ra
sd   s0, 0(sp)     # save s0
li   s0, 7         # use s0 freely
ld   s0, 0(sp)     # restore s0
ld   ra, 8(sp)     # restore ra
addi sp, sp, 16    # release`;

type S = { line: number | null; sp: number; c8: string; c0: string; s0: string; note: string };

const STATES: S[] = [
  { line: null, sp: 0x2000, c8: '', c0: '', s0: '42', note: 'sp holds 0x2000. Everything at 0x2000 and above belongs to whoever called us; the space below sp is free for us to claim. s0 holds 42, a value the caller expects to find there later.' },
  { line: 0, sp: 0x1ff0, c8: '', c0: '', s0: '42', note: 'Subtracting 16 from sp claims two 8-byte slots, 0x1ff0 and 0x1ff8. The stack grows downwards, towards lower addresses, and sp stays a multiple of 16.' },
  { line: 1, sp: 0x1ff0, c8: 'ra', c0: '', s0: '42', note: 'Slots are named by their offset from sp: 8(sp) is 0x1ff8. Save the return address there.' },
  { line: 2, sp: 0x1ff0, c8: 'ra', c0: '42', s0: '42', note: '0(sp) is 0x1ff0: save the caller’s s0 there, so that we may use the register ourselves.' },
  { line: 3, sp: 0x1ff0, c8: 'ra', c0: '42', s0: '7', note: 'The body uses s0 for its own work. The caller’s 42 is safe in memory.' },
  { line: 4, sp: 0x1ff0, c8: 'ra', c0: '42', s0: '42', note: 'Before leaving, load the saved value back. s0 is 42 again.' },
  { line: 5, sp: 0x1ff0, c8: 'ra', c0: '42', s0: '42', note: 'Restore ra the same way.' },
  { line: 6, sp: 0x2000, c8: 'ra', c0: '42', s0: '42', note: 'Adding 16 back releases the slots. Nothing is erased: the old values are still there, but they are now below sp, where the next call or interrupt may overwrite them at any time, so no code may rely on them.' },
];

export default function StackSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const cells = [
    { a: 0x2000, v: 'caller’s', mine: false },
    { a: 0x1ff8, v: st.c8, mine: st.sp <= 0x1ff8 },
    { a: 0x1ff0, v: st.c0, mine: st.sp <= 0x1ff0 },
  ];
  return (
    <StepFrame title="Claiming stack space with sp" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={150} title="Three 8-byte stack slots at addresses 0x2000, 0x1ff8 and 0x1ff0, the stack pointer, and register s0">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>MEMORY (higher addresses at the top)</T>
        {cells.map((c, k) => (
          <g key={c.a}>
            <T x={70} y={38 + k * 34} size={12} mono anchor="end" fill={tok('muted')}>{'0x' + c.a.toString(16)}</T>
            <Box x={78} y={24 + k * 34} w={130} h={30} fill={c.mine ? tok('f2', 0.2) : c.a === 0x2000 ? tok('line', 0.4) : 'transparent'} stroke={c.mine ? tok('f2') : tok('line')} dash={!c.mine && c.a !== 0x2000}>
              <T x={143} y={39 + k * 34} size={13} mono anchor="middle" opacity={c.mine || c.a === 0x2000 ? 1 : 0.45}>{c.v}</T>
            </Box>
            {st.sp === c.a && (
              <>
                <line x1={212} y1={39 + k * 34} x2={232} y2={39 + k * 34} stroke={tok('brand')} strokeWidth={2.5} />
                <T x={238} y={39 + k * 34} size={13} mono weight={700} fill={tok('brand')}>← sp</T>
              </>
            )}
          </g>
        ))}
        <T x={290} y={38} size={11} weight={700} fill={tok('muted')}>REGISTERS</T>
        <T x={290} y={66} size={13} mono>sp = {'0x' + st.sp.toString(16)}</T>
        <T x={290} y={92} size={13} mono>s0 = {st.s0}</T>
        <T x={8} y={136} size={11} fill={tok('muted')}>shaded: slots this function owns · dashed: below sp</T>
      </Svg>
    </StepFrame>
  );
}
