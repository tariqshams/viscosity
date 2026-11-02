// Chapter 162: one pass of `for i in 0..3 { s += i; }` on the VM, as the
// companion's disassembler prints it: 13 instructions, each a separate trip
// round the dispatch loop. inc.local is the superinstruction the compiler
// already uses for the hidden counter; without it the same step takes five
// instructions. Listing produced by companion/ts/src/vm/debug.ts.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `0013    | load.local          1
0015    | load.local          2
0017    | lt
0018    | jump.unless        18 -> 39
0021    | load.local          1
0023    3 load.global         4 's'
0026    | load.local          3
0028    | add
0029    | store.global        4 's'
0032    | pop
0033    4 pop
0034    2 inc.local           1
0036    4 loop               36 -> 13`;

type S = { line: number | null; done: number; label: string; note: string; alt?: boolean };

const STATES: S[] = [
  { line: 0, done: 1, label: 'test', note: 'Every pass starts with the loop test. load.local 1 pushes the hidden counter…' },
  { line: 2, done: 3, label: 'test', note: '…load.local 2 pushes the end, and lt compares them: three dispatches to ask “counter < end?”.' },
  { line: 3, done: 4, label: 'test', note: 'jump.unless pops the answer and leaves the loop if it is false. Four instructions so far, and the body has not started.' },
  { line: 4, done: 5, label: 'copy i', note: 'load.local 1 copies the counter into slot 3: that copy is this pass’s fresh i.' },
  { line: 9, done: 10, label: 's += i', note: 's += i is load.global, load.local, add, store.global, and a pop that drops the expression’s value: five dispatches for one line of Drip.' },
  { line: 10, done: 11, label: 'end of body', note: 'The body’s scope ends: pop drops i (it was not captured, so no close.upvalue is needed).' },
  { line: 11, done: 12, label: 'step', note: 'inc.local 1 adds one to the hidden counter in place. This is one instruction doing the work of five.' },
  { line: 12, done: 13, label: 'back', note: 'loop jumps back to offset 13. That is 13 dispatches per pass: the companion counts 39,000,015 instructions for three million passes.' },
  { line: 11, done: 13, label: 'without it', alt: true, note: 'Without inc.local, the step would be load.local 1, const 1, add, store.local 1, pop: 17 dispatches per pass and 51,000,015 instructions in all, which is what the copy of the VM without it counted.' },
];

export default function DispatchSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const total = st.alt ? 17 : 13;
  const W = 22;
  return (
    <StepFrame title="One pass of a for loop, one dispatch at a time" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={96} title="A row of boxes, one per instruction dispatched in this pass">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>DISPATCHES THIS PASS</T>
        <T x={392} y={14} size={12} mono anchor="end" fill={tok('brand')}>{st.label}</T>
        {Array.from({ length: total }, (_, i) => {
          const isStep = st.alt ? i >= 11 && i < 16 : i === 11;
          const on = i < (st.alt ? total : st.done);
          return (
            <Box key={i} x={8 + i * W} y={30} w={W - 4} h={28} r={3}
              fill={on ? (isStep ? tok('accent', 0.5) : tok('brand', 0.4)) : tok('line', 0.15)}
              stroke={on ? (isStep ? tok('accent') : tok('brand')) : tok('line')} dash={!on} />
          );
        })}
        <T x={8} y={80} size={12} mono>{st.alt ? 17 : st.done} of {total} instructions</T>
      </Svg>
    </StepFrame>
  );
}
