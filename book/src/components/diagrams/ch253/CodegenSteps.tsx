// sumsq's loop body through LLVM 18's RISC-V code generator. Each listing
// is the real loop block from llc 18.1.3 -mtriple=riscv64 -mattr=+m -O2 run
// on clang's -O2 IR (with -mllvm -replexitval=never so the loop survives),
// using -stop-after=finalize-isel, register-coalescer, machine-scheduler
// and virtregrewriter,1, then the final assembly. (The control flow
// optimizer, branch-folder, is the pass that turns BEQ + PseudoBR into BNE.)
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const STAGES = ['IR', 'isel', 'coalesce', 'schedule', 'regalloc', 'asm'];

type S = { k: number; code: string; note: string };

const STATES: S[] = [
  { k: 0, code: `for.body:
  %i.07 = phi i64 [ %inc, ... ], [ 0, ... ]
  %s.06 = phi i64 [ %add, ... ], [ 0, ... ]
  %mul = mul nsw i64 %i.07, %i.07
  %add = add nuw nsw i64 %mul, %s.06
  %inc = add nuw nsw i64 %i.07, 1
  %exitcond.not = icmp eq i64 %inc, %n
  br i1 %exitcond.not, ...`, note: 'The input is the optimised LLVM IR of the loop: rotated, so the test is at the bottom, and comparing i + 1 with n for equality, a form earlier passes set up.' },
  { k: 1, code: `bb.3.for.body:
  %1:gpr = PHI %8, %bb.1, %4, %bb.3
  %2:gpr = PHI %8, %bb.1, %3, %bb.3
  %10:gpr = nsw MUL %1, %1
  %3:gpr = nuw nsw ADD killed %10, %2
  %4:gpr = nuw nsw ADDI %1, 1
  BEQ %5, %4, %bb.2
  PseudoBR %bb.3`, note: 'After instruction selection the instructions are RISC-V\'s own (MUL, ADD, ADDI, BEQ), but the registers are still virtual (%1, %2, ... in the class gpr) and still in SSA form, PHIs included. This is LLVM\'s Machine IR, MIR; the icmp and br became one BEQ, a tile.' },
  { k: 2, code: `bb.4.for.body:
  %10:gpr = nsw MUL %12, %12
  %13:gpr = nuw nsw ADD %10, %13
  %12:gpr = nuw nsw ADDI %12, 1
  BEQ %5, %12, %bb.3
  PseudoBR %bb.4`, note: 'PHI elimination replaced each PHI with copies (Leaving SSA), and the register coalescer merged copies away (Coalescing): i is now %12 and s is %13 throughout, written in place. The code has left SSA.' },
  { k: 3, code: `bb.4.for.body:
  %10:gpr = nsw MUL %12, %12
  %12:gpr = nuw nsw ADDI %12, 1
  %13:gpr = nuw nsw ADD %10, %13
  BEQ %5, %12, %bb.3
  PseudoBR %bb.4`, note: 'The machine scheduler (Instruction scheduling) has moved the ADDI up, between the multiply and the add that uses the product. The ADDI and the add do not depend on each other, so either order is correct, and the scheduler picks the one its model of the processor prefers. (The real listing also marks registers renamable; that word is left out here.)' },
  { k: 4, code: `bb.4.for.body:
  $x13 = nsw MUL $x12, $x12
  $x12 = nuw nsw ADDI killed $x12, 1
  $x11 = nuw nsw ADD killed $x13,
                     killed $x11
  BEQ $x10, $x12, %bb.3
  PseudoBR %bb.4`, note: 'The greedy register allocator gave every virtual register a physical one, and the rewriter put them in: n stays in x10 (a0), s is x11 (a1), i is x12 (a2), i * i is x13 (a3). All caller-saved, so no frame is needed.' },
  { k: 5, code: `.LBB0_2:
  mul  a3, a2, a2
  addi a2, a2, 1
  add  a1, a3, a1
  bne  a0, a2, .LBB0_2`, note: 'Finally, the control-flow optimiser turned "BEQ out, else branch back" into a single bne back to the top, and the assembly printer wrote ABI names. Four instructions per trip, against our compiler\'s five.' },
];

export default function CodegenSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="sumsq's loop through llc" steps={s} note={st.note}>
      <Svg w={400} h={36} title="The code generator's stages, with the current one highlighted">
        {STAGES.map((n, k) => (
          <Box key={n} x={2 + k * 66} y={4} w={62} h={28} r={4} fill={k === st.k ? tok('brand', 0.22) : k < st.k ? tok('safe', 0.12) : tok('paper')} stroke={k === st.k ? tok('brand') : tok('line')}>
            <T x={33 + k * 66} y={18} size={11} anchor="middle" weight={k === st.k ? 700 : 400}>{n}</T>
          </Box>
        ))}
      </Svg>
      <CodeTrace code={st.code} line={null} />
    </StepFrame>
  );
}
