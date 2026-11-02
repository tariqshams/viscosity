// sumsq's real prologue and epilogue (clang 18 -O2, rv64im, sq in another
// file): it keeps n, s and i in s0, s1 and s2 across `call sq`, so it saves
// the caller's s0-s2 and its own ra in a 32-byte frame.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `addi sp, sp, -32   # prologue
sd   ra, 24(sp)
sd   s0, 16(sp)
sd   s1, 8(sp)
sd   s2, 0(sp)
...                # body: call sq
ld   ra, 24(sp)    # epilogue
ld   s0, 16(sp)
ld   s1, 8(sp)
ld   s2, 0(sp)
addi sp, sp, 32
ret`;

type Regs = { sp: string; ra: string; s0: string; s1: string; s2: string };
type S = { line: number; r: Regs; slots: number; note: string };

const IN: Regs = { sp: '0x2000', ra: 'R', s0: 'A', s1: 'B', s2: 'C' };
const BODY: Regs = { sp: '0x1fe0', ra: 'in sumsq', s0: 'n', s1: 's', s2: 'i' };

const STATES: S[] = [
  { line: 0, r: { ...IN, sp: '0x1fe0' }, slots: 0, note: 'On entry, ra holds R, the address in the caller to return to, and s0, s1, s2 hold the caller’s values A, B, C. The first instruction claims a 32-byte frame (four 8-byte slots, a multiple of 16).' },
  { line: 1, r: { ...IN, sp: '0x1fe0' }, slots: 1, note: 'Save ra, because the call to sq inside the loop will overwrite it with an address inside sumsq. Without this copy, sumsq could never find its way back.' },
  { line: 4, r: { ...IN, sp: '0x1fe0' }, slots: 4, note: 'Save s0, s1 and s2. They are callee-saved: sumsq’s caller expects A, B and C to still be there when sumsq returns, so sumsq may use them only after putting the old values somewhere safe.' },
  { line: 5, r: BODY, slots: 4, note: 'The body keeps n, s and i in s0, s1, s2, precisely because sq promises not to change s registers; ra is overwritten by every call sq. The caller’s values wait in the frame.' },
  { line: 9, r: { ...IN, sp: '0x1fe0', s0: 'A', s1: 'B', s2: 'C', ra: 'R' }, slots: 4, note: 'The epilogue loads everything back: ra is R again and s0 to s2 are A, B, C, exactly as the caller left them. (s, the answer, was moved to a0 just before this.)' },
  { line: 10, r: IN, slots: 0, note: 'Release the frame: sp is back to 0x2000, the value it had on entry, which the convention also requires.' },
  { line: 11, r: IN, slots: 0, note: 'ret jumps to R. From the caller’s point of view nothing it cared about has changed, except a0, which now holds the result.' },
];

const SLOT = [{ off: 24, name: 'ra' }, { off: 16, name: 's0' }, { off: 8, name: 's1' }, { off: 0, name: 's2' }];
const SAVED: Record<string, string> = { ra: 'R', s0: 'A', s1: 'B', s2: 'C' };

export default function PrologueSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="sumsq's prologue and epilogue" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={168} title="The four slots of sumsq's frame, and the registers sp, ra, s0, s1 and s2">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>THE FRAME</T>
        {SLOT.map((sl, k) => {
          const on = k < st.slots;
          return (
            <g key={sl.name}>
              <T x={64} y={36 + k * 32} size={11} mono anchor="end" fill={tok('muted')}>{sl.off}(sp)</T>
              <Box x={70} y={22 + k * 32} w={110} h={28} fill={on ? tok('f2', 0.22) : 'transparent'} stroke={on ? tok('f2') : tok('line')} dash={!on}>
                <T x={125} y={36 + k * 32} size={12} mono anchor="middle">{on ? `${sl.name}: ${SAVED[sl.name]}` : ''}</T>
              </Box>
            </g>
          );
        })}
        <T x={8} y={160} size={11} fill={tok('muted')}>32 bytes, from sp up to the caller’s sp</T>
        <T x={214} y={12} size={11} weight={700} fill={tok('muted')}>REGISTERS</T>
        {(Object.keys(st.r) as (keyof Regs)[]).map((n, k) => (
          <g key={n}>
            <T x={214} y={36 + k * 26} size={12} mono fill={tok('muted')}>{n}</T>
            <Box x={244} y={24 + k * 26} w={110} h={23} fill={tok('paper')} stroke={tok('ink', 0.45)}>
              <T x={299} y={36 + k * 26} size={12} mono anchor="middle">{st.r[n]}</T>
            </Box>
          </g>
        ))}
      </Svg>
    </StepFrame>
  );
}
