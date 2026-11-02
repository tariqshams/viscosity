// Chapter 403: drip-rs compiling
//   let i = 0;
//   while i < 3 {
//     print i;
//     i += 1;
//   }
// Offsets and operand bytes are the real `drip-rs --disassemble` output
// (rustc 1.97, 2026-11-02): jump.unless at 13 -> 34 (operand 0x00 0x12 =
// 18) and loop at 31 -> 6 (operand 0x00 0x1c = 28). The steps follow
// while_statement, emit_jump, emit_loop and patch_jump in
// book/companion/rust/src/compiler.rs.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type Row = { off: string; text: string; bytes?: string; hole?: boolean };
type S = { rows: Row[]; vars: string[]; fresh: number; arrows: ('exit' | 'loop')[]; note: string };

const head: Row[] = [{ off: '0000', text: '… let i = 0;' }];
const cond: Row[] = [
  { off: '0006', text: "load.global 'i'" },
  { off: '0009', text: "const '3'" },
  { off: '0012', text: 'lt' },
];
const holeRow: Row = { off: '0013', text: 'jump.unless', bytes: 'ff ff', hole: true };
const doneRow: Row = { off: '0013', text: 'jump.unless', bytes: '00 12' };
const body: Row[] = [
  { off: '0016', text: "load.global 'i'" },
  { off: '0019', text: '… print; i += 1 …' },
];
const loop: Row = { off: '0031', text: 'loop', bytes: '00 1c' };
const tail: Row = { off: '0034', text: 'none, return' };

const STATES: S[] = [
  { rows: [...head], vars: ['loop_start = 6'], fresh: 0, arrows: [], note: 'while_statement starts by writing down where the loop begins: let loop_start = self.chunk().code.len(); which is 6. It is a usize copied out of the Vec’s length, so nothing stays borrowed.' },
  { rows: [...head, ...cond], vars: ['loop_start = 6'], fresh: 3, arrows: [], note: 'self.expression() compiles the condition i < 3. When it runs, its true or false will be on top of the stack.' },
  { rows: [...head, ...cond, holeRow], vars: ['loop_start = 6', 'exit_jump = 14'], fresh: 1, arrows: [], note: 'emit_jump(OpCode::JumpUnless) writes the opcode at 13 and the placeholder ff ff at 14 and 15, then returns code.len() - 2, which is 14: the address of the hole. Nobody knows yet where the loop ends.' },
  { rows: [...head, ...cond, holeRow, ...body], vars: ['loop_start = 6', 'exit_jump = 14'], fresh: 2, arrows: [], note: 'braced_block compiles the body, bytes 16 to 30. The whole time, exit_jump is a plain number in a local, so the compiler can push to the chunk as often as it likes.' },
  { rows: [...head, ...cond, holeRow, ...body, loop], vars: ['loop_start = 6', 'exit_jump = 14'], fresh: 1, arrows: ['loop'], note: 'emit_loop(6) writes the loop opcode at 31. The length is now 32, so offset = 32 - 6 + 2 = 28, written high byte first as 00 1c. At run time ip will be 34 after the operand, and 34 - 28 = 6.' },
  { rows: [...head, ...cond, doneRow, ...body, loop], vars: ['exit_jump = 14', 'jump = 34 - 14 - 2 = 18'], fresh: 0, arrows: ['loop', 'exit'], note: 'patch_jump(14): the length is 34, so jump = 34 - 14 - 2 = 18. It fits in a u16, so there is nothing to report; only then does it borrow the code and write 00 12 over the hole. From 16, just past the operand, 18 bytes on is 34.' },
  { rows: [...head, ...cond, doneRow, ...body, loop, tail], vars: ['exit_jump = 14'], fresh: 1, arrows: ['loop', 'exit'], note: 'The exit lands on whatever comes next: here the end of the script. jump.unless popped the condition itself, so neither path needs a pop. Any break jumps in this loop were patched to this same spot.' },
];

const Y0 = 22;
const RH = 24;

export default function JumpSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const yOf = (off: string) => {
    const k = st.rows.findIndex((r) => r.off === off);
    return Y0 + k * RH + RH / 2;
  };
  const hasTail = st.rows.some((r) => r.off === '0034');
  return (
    <StepFrame title="Backpatching a while loop" steps={s} note={st.note}>
      <Svg w={400} h={262} title="The while loop's bytecode as drip-rs emits it, with the jump operands and where they point">
        <T x={8} y={10} size={11} mono weight={700} fill={tok('muted')}>chunk.code</T>
        {st.rows.map((r, k) => {
          const isNew = k >= st.rows.length - st.fresh;
          const y = Y0 + k * RH;
          return (
            <g key={r.off}>
              <T x={50} y={y + RH / 2} size={11} mono fill={tok('muted')}>{r.off}</T>
              <T x={92} y={y + RH / 2} size={12} mono weight={isNew ? 700 : undefined} fill={isNew ? tok('safe') : tok('ink')}>{r.text}</T>
              {r.bytes && (
                <Box x={250} y={y + 2} w={54} h={RH - 4} r={3}
                  fill={r.hole ? tok('danger', 0.12) : tok('brand', 0.14)} stroke={r.hole ? tok('danger') : tok('brand')} dash={r.hole}>
                  <T x={277} y={y + RH / 2} size={11} mono anchor="middle" fill={r.hole ? tok('danger') : tok('ink')}>{r.bytes}</T>
                </Box>
              )}
            </g>
          );
        })}
        {st.arrows.includes('loop') && (
          <Arrow x1={44} y1={yOf('0031')} x2={44} y2={yOf('0006')} color={tok('accent')} bend={-0.5} />
        )}
        {st.arrows.includes('exit') && (
          <Arrow x1={310} y1={yOf('0013')} x2={310} y2={hasTail ? yOf('0034') : yOf('0031') + RH} color={tok('brand')} bend={-0.4} dash={!hasTail} />
        )}
        <T x={8} y={248} size={11} mono fill={tok('brand')}>{st.vars.join('   ')}</T>
      </Svg>
    </StepFrame>
  );
}
