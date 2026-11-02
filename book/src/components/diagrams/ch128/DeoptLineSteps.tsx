// Chapter 128: one real --trace-deopt line, read part by part. Produced by
// `node --trace-opt --trace-deopt opt.js` on Node v22.23.4
// (V8 12.4.254.21-node.57); the line is split only for the phone width.
// Kinds and reasons: src/common/globals.h, src/deoptimizer/deoptimize-reason.h.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';

const LINE = `[bailout (kind: deopt-eager,
 reason: not a Smi): begin.
 deoptimizing 0x207bb9a23eb1
 <JSFunction add
 (sfi = 0x1a9fac5db7e1)>,
 0x083907e81fa9 <Code TURBOFAN>,
 opt id 0,
 bytecode offset 2,
 deopt exit 0, FP to SP delta 32,
 caller SP 0x7ffffc8cc8d0,
 pc 0x7f12c0005d75]`;

const STATES = [
  { line: 0, note: 'kind: deopt-eager. In V8’s words, an eager deopt means a check failed in the optimized code and deoptimization happens immediately. (A lazy one is triggered later, when an assumption checked elsewhere breaks.)' },
  { line: 1, note: 'reason: not a Smi. The optimized add assumed both arguments were small integers, because that is all its feedback had seen. Then add(0.5, 1) arrived.' },
  { line: 3, note: '<JSFunction add …> names the function whose optimized code is being abandoned. The top-level script shows up as <JSFunction (sfi = …)>, with no name.' },
  { line: 5, note: '<Code TURBOFAN> and opt id 0: the code being thrown away came from TurboFan, and opt id identifies that compile. In this run, add was the first function optimized.' },
  { line: 7, note: 'bytecode offset 2: the bytecode at which the function carries on in the interpreter. In the --print-bytecode listing, offset 2 is Add a0, [0]: exactly the + whose guess failed.' },
  { line: 8, note: 'The rest is machine-level detail: which exit was taken, the frame’s size, stack and program-counter addresses. The addresses change on every run, so never compare them between runs.' },
];

export default function DeoptLineSteps() {
  const s = useSteps(STATES);
  return (
    <StepFrame title="Reading one --trace-deopt line" steps={s} note={s.state.note}>
      <div className="mb-2 font-sans text-xs text-muted">Node v22.23.4, V8 12.4.254.21 (split to fit)</div>
      <CodeTrace code={LINE} line={s.state.line} />
    </StepFrame>
  );
}
