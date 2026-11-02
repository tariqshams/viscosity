// sumsq (in C) through LLVM 18's -O2 pipeline, one changing pass at a time.
// Each listing is trimmed from the real output of
//   clang --target=riscv64 -march=rv64im -O0 -Xclang -disable-O0-optnone
//         -fno-discard-value-names -S -emit-llvm sumsq.c
//   opt -passes='default<O2>' -print-changed
// (Ubuntu LLVM 18.1.3).
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const PASSES = ['clang -O0', 'SROA', 'LoopRotate', 'IndVars', 'LoopDeletion'];

type S = { k: number; code: string; note: string };

const STATES: S[] = [
  { k: 0, code: `%s = alloca i64, align 8
store i64 0, ptr %s, align 8
...
for.body:
  %2 = load i64, ptr %i, align 8
  %3 = load i64, ptr %i, align 8
  %mul = mul nsw i64 %2, %3
  %4 = load i64, ptr %s, align 8
  %add = add nsw i64 %4, %mul
  store i64 %add, ptr %s, align 8`, note: 'clang\'s front end does the simplest thing: every local variable gets a stack slot (alloca), and every use is a load or a store. It is correct and easy to produce, and the optimiser is expected to clean it up.' },
  { k: 1, code: `for.cond:
  %s.0 = phi i64 [ 0, %entry ],
                 [ %add, %for.body ]
  %i.0 = phi i64 [ 0, %entry ],
                 [ %inc, %for.body ]
  %cmp = icmp slt i64 %i.0, %n
  br i1 %cmp, label %for.body,
              label %for.end
for.body:
  %mul = mul nsw i64 %i.0, %i.0
  %add = add nsw i64 %s.0, %mul
  %inc = add nsw i64 %i.0, 1`, note: 'SROA turns the stack slots into SSA values: the loads and stores are gone, and two phi nodes merge each variable\'s value from before the loop and from the last trip. This is the same SSA construction as in Dominance frontiers and classic SSA construction, and it looks almost exactly like our VIR for sumsq.' },
  { k: 2, code: `for.body:
  %i.07 = phi i64 [ 0, ... ],
                  [ %inc, %for.body ]
  %s.06 = phi i64 [ 0, ... ],
                  [ %add, %for.body ]
  %mul = mul nsw i64 %i.07, %i.07
  %add = add nuw nsw i64 %mul, %s.06
  %inc = add nuw nsw i64 %i.07, 1
  %cmp = icmp slt i64 %inc, %n
  br i1 %cmp, label %for.body, ...`, note: 'LoopRotate moves the test to the bottom of the loop (after one check before it, in the block that leads in), so each trip runs one branch instead of two. Earlier passes have also added nuw ("no unsigned wrap") where they could prove it.' },
  { k: 3, code: `for.body.preheader:
  %0 = add i64 %n, -1
  %1 = zext i64 %0 to i65
  ...
  %16 = add i64 %11, %15
for.body:
  ...
  br i1 false, label %for.body, ...`, note: 'IndVarSimplify asks scalar evolution what s will be when the loop ends, and gets a formula in n. It computes the formula before the loop (in 65-bit arithmetic, so the products cannot overflow) and uses it after the loop instead of s. Now nothing outside the loop needs the loop.' },
  { k: 4, code: `define i64 @sumsq(i64 %n) {
  %cmp = icmp sgt i64 %n, 0
  br i1 %cmp, label %pre, label %end
pre:
  ...                ; the formula
end:
  %r = phi i64 [ 0, %entry ],
               [ %20, %pre ]
  ret i64 %r
}`, note: 'LoopDeletion removes the loop, which no longer computes anything that is used. sumsq now takes the same time for n = 4 as for n = 4 billion. (Names here are shortened; the real listing is in the text.)' },
];

export default function PassSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="sumsq through LLVM's -O2" steps={s} note={st.note}>
      <Svg w={400} h={36} title="The passes that changed sumsq, with the current one highlighted">
        {PASSES.map((p, k) => (
          <Box key={p} x={2 + k * 79.5} y={4} w={76} h={28} r={4} fill={k === st.k ? tok('brand', 0.22) : k < st.k ? tok('safe', 0.12) : tok('paper')} stroke={k === st.k ? tok('brand') : tok('line')}>
            <T x={40 + k * 79.5} y={18} size={11} anchor="middle" weight={k === st.k ? 700 : 400}>{p}</T>
          </Box>
        ))}
      </Svg>
      <CodeTrace code={st.code} line={null} />
    </StepFrame>
  );
}
