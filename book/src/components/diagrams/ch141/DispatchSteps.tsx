// Chapter 141: one opcode, sub, dispatched twice: in  print 10 - 4;
// (the check passes, b is popped and a's slot is overwritten in place)
// and in  print 10 - "a";  (the check fails before anything is popped).
// Both chunks are the real ones (bytes 0 0 0 0 0 1 21 33 1 49, checked
// with disassembleFunction); the code is the real Op.Sub case of
// companion/ts/src/vm/vm.ts, rewrapped, and numbers(), shortened.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `const instruction = code[frame.ip++];
switch (instruction) {
  // ... 21 cases before this one
  case Op.Sub: {
    this.numbers('-');
    const b = this.pop() as number;
    stack[this.sp - 1] =
      (stack[this.sp - 1] as number) - b;
    break;
  }
  // ...
}

numbers(op) {  // shortened
  const a = this.peek(1);
  const b = this.peek(0);
  if (typeof a === 'number' &&
      typeof b === 'number') return;
  this.runtimeError(...);
}`;

type S = { prog: string; stack: string[]; hl?: number[]; out: string; line: number; note: string };

const STATES: S[] = [
  { prog: 'print 10 - 4;', stack: ['script', '10', '4'], line: 0, out: '', note: 'The two consts have run, so 10 and 4 are waiting. The loop reads the next opcode, 21, and moves ip past it: this is the fetch.' },
  { prog: 'print 10 - 4;', stack: ['script', '10', '4'], line: 3, out: '', note: 'switch (instruction) sends control straight to case Op.Sub. Choosing the case is the dispatch: it is paid on every instruction, on top of the instruction’s own work.' },
  { prog: 'print 10 - 4;', stack: ['script', '10', '4'], hl: [1, 2], line: 16, out: '', note: 'Before touching the stack, numbers(\'-\') looks at the top two values with peek: a = 10 (one down) and b = 4 (the top). Both are numbers, so it returns quietly.' },
  { prog: 'print 10 - 4;', stack: ['script', '10'], line: 5, out: '', note: 'Now b = 4 is popped. The left operand, 10, stays where it is.' },
  { prog: 'print 10 - 4;', stack: ['script', '6'], hl: [1], line: 6, out: '', note: 'The result, 10 - 4 = 6, is written over the slot where 10 was. Same effect as popping both and pushing, with one less move of sp. Then break: back to the top of the loop for print.' },
  { prog: 'print 10 - "a";', stack: ['script', '10', '"a"'], line: 3, out: '', note: 'Same bytes, different constant: the second value is the string "a". The same case runs.' },
  { prog: 'print 10 - "a";', stack: ['script', '10', '"a"'], hl: [1, 2], line: 18, out: '', note: 'peek finds a string on top, so the check fails and runtimeError is called, before anything has been popped.' },
  { prog: 'print 10 - "a";', stack: ['script', '10', '"a"'], line: 18, out: "runtime error: cannot use '-' on a number and a string\n  at line 1 in script", note: 'The error is reported with its line, and the program stops. The stack is exactly as the instruction found it, which matters later: values still on the stack are safe from the garbage collector.' },
];

export default function DispatchSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const slotH = 24;
  const base = 110;
  return (
    <StepFrame title="Dispatching sub, twice" steps={s} note={st.note}>
      <Svg w={400} h={176} title="The VM dispatches the sub opcode. For 10 - 4 the check passes, 4 is popped and the 10 is overwritten with 6. For 10 - a the check fails before anything is popped, and a runtime error is reported.">
        <T x={8} y={10} size={12} mono weight={700}>{st.prog}</T>
        <T x={8} y={30} size={11} weight={700} fill={tok('muted')}>stack (top is newest)</T>
        {st.stack.map((v, k) => {
          const y = base - (k + 1) * slotH;
          const script = k === 0;
          const hl = st.hl?.includes(k);
          return (
            <g key={k}>
              <Box x={8} y={y} w={120} h={slotH - 3} r={3}
                fill={hl ? tok('brand', 0.22) : script ? tok('panel') : tok('safe', 0.14)}
                stroke={hl ? tok('brand') : script ? tok('line') : tok('safe')} />
              <T x={14} y={y + 11} size={11} mono fill={tok('muted')}>{k}</T>
              <T x={74} y={y + 11} size={13} mono anchor="middle" fill={script ? tok('muted') : tok('ink')}>{v}</T>
            </g>
          );
        })}
        <line x1={4} x2={132} y1={base} y2={base} stroke={tok('ink', 0.5)} strokeWidth={1.5} />
        <T x={146} y={base - st.stack.length * slotH + 10} size={11} mono fill={tok('accent')}>{`← sp = ${st.stack.length}`}</T>
        <T x={8} y={128} size={11} weight={700} fill={tok('muted')}>output</T>
        <Box x={8} y={136} w={384} h={36} r={4} fill={tok('paper')} stroke={tok('line')} />
        {st.out.split('\n').map((l, i) => (
          <T key={i} x={14} y={146 + i * 15} size={11} mono fill={tok('accent')}>{l}</T>
        ))}
      </Svg>
      <CodeTrace code={CODE} line={st.line} />
    </StepFrame>
  );
}
