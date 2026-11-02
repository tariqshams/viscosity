// One small Drip program through every stage of the chapter's compiler.
// Every listing is the real output of the chapter's code (Node 22), and the
// bytes are llvm-mc 18.1.3's encoding of the final assembly
// (llvm-mc -triple=riscv64 -mattr=+m -filetype=obj; llvm-objdump -d).
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const STAGES = ['scan', 'parse', 'select', 'live', 'alloc', 'frame', 'bytes', 'run'];

type S = { stage: number; code: string; note: string };

const STATES: S[] = [
  { stage: -1, code: `fn sq(x) {
  return x * x;
}
print sq(7);`, note: 'The input is plain text: a function sq and one top-level statement. The compiler will turn the top-level statements into a function called main, so that the whole program is functions.' },
  { stage: 0, code: `fn  sq  (  x  )  {
return  x  *  x  ;
}
print  sq  (  7  )  ;`, note: 'Stage 1, scanning (chapter 68): one regular expression cuts the text into 18 tokens and drops the spaces and comments. Nothing knows yet what a function is.' },
  { stage: 1, code: `['fn', 'sq', ['x'], [
  ['return',
    ['*', ['var', 'x'],
          ['var', 'x']]]]]`, note: 'Stage 2, parsing (chapter 83): recursive descent builds a tree for each function. sq\'s body is one return statement whose value is the tree x * x.' },
  { stage: 2, code: `sq:
  mv   v0, a0      # x arrives in a0
  mul  v1, v0, v0
  mv   a0, v1      # result goes in a0
  j    .Lsq_ret`, note: 'Stage 3, instruction selection (chapter 237): each piece of the tree becomes RISC-V instructions, but over virtual registers v0, v1, ... of which there are as many as we like. The calling convention already shows: x arrives in a0 and the answer leaves in a0.' },
  { stage: 3, code: `v0  lives from line 0 to line 1
v1  lives from line 1 to line 2`, note: 'Stage 4, live intervals (chapters 241 and 245): for each virtual register, the first and last line that mention it. (A value used inside a loop is stretched to cover the whole loop.)' },
  { stage: 4, code: `v0 -> s1
v1 -> s2`, note: 'Stage 5, linear scan (chapter 245): walk the intervals in order of their start and hand each one a free register. Ours only hands out s1 to s11, the callee-saved registers, so values survive calls without any extra work.' },
  { stage: 5, code: `sq:
  addi sp, sp, -16
  sd   s1, 8(sp)
  sd   s2, 0(sp)
  mv   s1, a0
  mul  s2, s1, s1
  mv   a0, s2
.Lsq_ret:
  ld   s1, 8(sp)
  ld   s2, 0(sp)
  addi sp, sp, 16
  ret`, note: 'Stage 6, the frame (chapter 234): because sq uses s1 and s2, which belong to its caller, it saves them in a 16-byte frame and restores them before ret. A peephole pass (chapter 250) has deleted the jump to the very next line.' },
  { stage: 6, code: `13 01 01 ff   addi sp, sp, -16
23 34 91 00   sd   s1, 8(sp)
23 30 21 01   sd   s2, 0(sp)
93 04 05 00   mv   s1, a0
33 89 94 02   mul  s2, s1, s1
...           (40 bytes in all)`, note: 'Stage 7, assembling (chapter 251): LLVM\'s assembler, llvm-mc, turns the text into machine code, four bytes per instruction, and an object file whose call to print is left as a relocation for the linker.' },
  { stage: 7, code: `$ simulate(asm)
49`, note: 'Stage 8, running: the chapter\'s small RISC-V simulator executes the assembly, starting at main, and its print routine shows 49. The same text could be linked and run on a real RISC-V machine.' },
];

export default function PipelineSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="sq, through every stage" steps={s} note={st.note}>
      <Svg w={400} h={40} title="The eight stages of the compiler, with the current one highlighted">
        {STAGES.map((n, k) => (
          <Box key={n} x={2 + k * 49.5} y={6} w={46} h={28} r={4} fill={k === st.stage ? tok('brand', 0.22) : k < st.stage ? tok('safe', 0.12) : tok('paper')} stroke={k === st.stage ? tok('brand') : tok('line')}>
            <T x={25 + k * 49.5} y={20} size={11} anchor="middle" weight={k === st.stage ? 700 : 400}>{n}</T>
          </Box>
        ))}
      </Svg>
      <CodeTrace code={st.code} line={null} />
    </StepFrame>
  );
}
