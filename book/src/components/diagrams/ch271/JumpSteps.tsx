// Chapter 271: drip-rs compiling `while (i < 3) { print i; i = i + 1; }`
// (after `let i = 0;`). Offsets and operand bytes are the real
// `drip-rs --disassemble` output: JUMP_IF_FALSE at 9 -> 27 (operand
// 0x00 0x0f = 15) and LOOP at 24 -> 4 (operand 0x00 0x17 = 23). The steps
// follow while_statement, emit_jump, emit_loop and patch_jump in
// book/companion/rust/src/compiler.rs.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type Row = { off: string; text: string; bytes?: string; hole?: boolean };
type S = { rows: Row[]; vars: string[]; fresh: number; arrows: ('exit' | 'loop')[]; note: string };

const head: Row[] = [{ off: '0000', text: '… let i = 0;' }];
const cond: Row[] = [
  { off: '0004', text: "GET_GLOBAL 'i'" },
  { off: '0006', text: "CONSTANT '3'" },
  { off: '0008', text: 'LESS' },
];
const jifHole: Row = { off: '0009', text: 'JUMP_IF_FALSE', bytes: 'ff ff', hole: true };
const jifDone: Row = { off: '0009', text: 'JUMP_IF_FALSE', bytes: '00 0f' };
const body: Row[] = [
  { off: '0012', text: 'POP' },
  { off: '0013', text: '… print i; i = i + 1; …' },
];
const loop: Row = { off: '0024', text: 'LOOP', bytes: '00 17' };
const tail: Row = { off: '0027', text: 'POP' };

const STATES: S[] = [
  { rows: [...head], vars: ['loop_start = 4'], fresh: 0, arrows: [], note: 'while_statement first records where the loop begins: let loop_start = self.chunk().code.len(); which is 4. A usize, copied out: no borrow of the chunk is kept.' },
  { rows: [...head, ...cond], vars: ['loop_start = 4'], fresh: 3, arrows: [], note: 'The condition i < 3 is compiled as usual. Its result will be on top of the stack.' },
  { rows: [...head, ...cond, jifHole], vars: ['loop_start = 4', 'exit_jump = 10'], fresh: 1, arrows: [], note: 'emit_jump(JumpIfFalse) writes the opcode at 9 and two placeholder bytes, ff ff, then returns code.len() - 2 = 10: where the hole is. The exit isn’t known yet.' },
  { rows: [...head, ...cond, jifHole, ...body], vars: ['loop_start = 4', 'exit_jump = 10'], fresh: 2, arrows: [], note: 'POP discards the condition, then the whole body is compiled, bytes 13 to 23. All this time exit_jump is a plain number, so the compiler can borrow the chunk as often as it likes.' },
  { rows: [...head, ...cond, jifHole, ...body, loop], vars: ['loop_start = 4', 'exit_jump = 10'], fresh: 1, arrows: ['loop'], note: 'emit_loop(4): after the LOOP opcode, len is 25, so offset = 25 - 4 + 2 = 23, written high byte first: 00 17. At run time ip is 27 after the operand, and 27 - 23 = 4.' },
  { rows: [...head, ...cond, jifDone, ...body, loop], vars: ['loop_start = 4', 'exit_jump = 10', 'jump = 27 - 10 - 2 = 15'], fresh: 0, arrows: ['loop', 'exit'], note: 'patch_jump(10): len is 27, jump = 27 - 10 - 2 = 15. It fits in a u16, so no error. Only now is the code borrowed, to write 00 0f over the hole. From 12, the end of the operand, 15 bytes on is 27.' },
  { rows: [...head, ...cond, jifDone, ...body, loop, tail], vars: ['loop_start = 4', 'exit_jump = 10'], fresh: 1, arrows: ['loop', 'exit'], note: 'The POP at 27 is where the exit lands. JUMP_IF_FALSE leaves the condition on the stack, so the loop pops it at 12 and the exit pops it here.' },
];

const Y0 = 22;
const RH = 22;

export default function JumpSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const yOf = (off: string) => {
    const k = st.rows.findIndex((r) => r.off === off);
    return Y0 + k * RH + RH / 2;
  };
  return (
    <StepFrame title="Backpatching a while loop" steps={s} note={st.note}>
      <Svg w={400} h={262} title="The while loop's bytecode as it is emitted, with the jump operands and where they point">
        <T x={8} y={10} size={10} mono weight={700} fill={tok('muted')}>chunk.code</T>
        {st.rows.map((r, k) => {
          const isNew = k >= st.rows.length - st.fresh;
          const y = Y0 + k * RH;
          return (
            <g key={r.off}>
              <T x={50} y={y + RH / 2} size={10} mono fill={tok('muted')}>{r.off}</T>
              <T x={86} y={y + RH / 2} size={11} mono weight={isNew ? 700 : undefined} fill={isNew ? tok('safe') : tok('ink')}>{r.text}</T>
              {r.bytes && (
                <Box x={196} y={y + 2} w={48} h={RH - 4} r={3}
                  fill={r.hole ? tok('danger', 0.12) : tok('brand', 0.14)} stroke={r.hole ? tok('danger') : tok('brand')} dash={r.hole}>
                  <T x={220} y={y + RH / 2} size={10} mono anchor="middle" fill={r.hole ? tok('danger') : tok('ink')}>{r.bytes}</T>
                </Box>
              )}
            </g>
          );
        })}
        {st.arrows.includes('loop') && (
          <Arrow x1={44} y1={yOf('0024')} x2={44} y2={yOf('0004')} color={tok('accent')} bend={-0.5} />
        )}
        {st.arrows.includes('exit') && st.rows.some((r) => r.off === '0027') && (
          <Arrow x1={248} y1={yOf('0009')} x2={248} y2={yOf('0027')} color={tok('brand')} bend={-0.4} />
        )}
        {st.arrows.includes('exit') && !st.rows.some((r) => r.off === '0027') && (
          <Arrow x1={248} y1={yOf('0009')} x2={248} y2={yOf('0024') + RH} color={tok('brand')} bend={-0.4} dash />
        )}
        <T x={8} y={246} size={9} mono fill={tok('brand')}>{st.vars.join('    ')}</T>
      </Svg>
    </StepFrame>
  );
}
