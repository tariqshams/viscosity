// Chapter 150: running the real disassembly of a two-block program, one
// instruction at a time, with the stack drawn as numbered slots.
// The listing is the companion disassembler's output for:
//   { let a = 1; { let b = a + 2; print b; } a = 5; print a; }
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const LISTING = `0000    2 const               0 '1'
0003    4 load.local          1
0005    | const               1 '2'
0008    | add
0009    5 load.local          2
0011    | print
0012    6 pop
0013    7 const               2 '5'
0016    | store.local         1
0018    | pop
0019    8 load.local          1
0021    | print
0022    9 pop
0023    | none
0024    | return`;

/** One stack cell: its value and, if it is a local's slot, the local's name. */
type C = [string, string?];
type S = { line: number; stack: C[]; hot?: number; out?: string; note: string };

const SC: C = ['script'];

const STATES: S[] = [
  { line: -1, stack: [SC], note: 'The program is { let a = 1; { let b = a + 2; print b; } a = 5; print a; }. Before it runs, the stack holds one value: the script itself, in slot 0 (the chapter on frames explains why).' },
  { line: 0, stack: [SC, ['1', 'a']], hot: 1, note: 'const pushes 1, and it lands in slot 1. That slot IS the variable a from now on. No instruction "defines" a: the value is already where a lives.' },
  { line: 1, stack: [SC, ['1', 'a'], ['1']], hot: 2, note: 'Now b’s initialiser, a + 2. load.local 1 pushes a copy of slot 1. The copy is a temporary on top of the stack; a itself is untouched.' },
  { line: 2, stack: [SC, ['1', 'a'], ['1'], ['2']], hot: 3, note: 'const pushes 2.' },
  { line: 3, stack: [SC, ['1', 'a'], ['3', 'b']], hot: 2, note: 'add pops two values and pushes 3. It lands in slot 2, so slot 2 is b. Once again, no define instruction was needed.' },
  { line: 4, stack: [SC, ['1', 'a'], ['3', 'b'], ['3']], hot: 3, note: 'print b: load.local 2 pushes a copy of slot 2.' },
  { line: 5, stack: [SC, ['1', 'a'], ['3', 'b']], out: '3', note: 'print pops the copy and prints 3.' },
  { line: 6, stack: [SC, ['1', 'a']], out: '3', note: 'Line 6 is the inner block’s closing brace. b’s life is over, so the compiler emitted a pop, and slot 2 is free again.' },
  { line: 7, stack: [SC, ['1', 'a'], ['5']], hot: 2, out: '3', note: 'a = 5 starts by pushing 5. It sits in slot 2’s position, but no local lives there now: it is only a temporary.' },
  { line: 8, stack: [SC, ['5', 'a'], ['5']], hot: 1, out: '3', note: 'store.local 1 copies the top of the stack into slot 1. It does not pop: an assignment is an expression whose value is the assigned value.' },
  { line: 9, stack: [SC, ['5', 'a']], out: '3', note: 'The statement a = 5; is finished, and nobody wants its value, so a pop drops the leftover 5.' },
  { line: 10, stack: [SC, ['5', 'a'], ['5']], hot: 2, out: '3', note: 'print a: load.local 1 again. It costs one addition and one array read, every time: no name, no hashing.' },
  { line: 11, stack: [SC, ['5', 'a']], out: '3 5', note: 'print pops and prints 5.' },
  { line: 12, stack: [SC], out: '3 5', note: 'The outer closing brace ends a’s life with one more pop. The stack is back to just the script.' },
  { line: 14, stack: [SC], out: '3 5', note: 'none and return end the script, as they end every program. Not one instruction mentioned a name: a was 1 and b was 2 from start to finish.' },
];

const RH = 26;

export default function SlotRunSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Running locals by slot number" steps={s} note={st.note}>
      <CodeTrace code={LISTING} line={st.line} />
      <Svg w={400} h={150} title="The VM's stack, slot 0 at the bottom. Each cell shows its value, and the local that lives there, if any.">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>VM STACK (slot on the left)</T>
        {[0, 1, 2, 3].map((k) => {
          const y = 120 - k * (RH + 4);
          const c = st.stack[k];
          const hot = st.hot === k;
          return (
            <g key={k}>
              <T x={24} y={y + RH / 2} size={11} mono anchor="middle" fill={tok('muted')}>{k}</T>
              {c && (
                <Box x={44} y={y} w={200} h={RH} fill={hot ? tok('brand', 0.14) : tok('panel')} stroke={hot ? tok('brand') : tok('line')}>
                  <T x={60} y={y + RH / 2} size={12.5} mono>{c[0]}</T>
                  <T x={234} y={y + RH / 2} size={11.5} mono anchor="end" fill={c[1] ? tok('brand') : tok('muted')}>
                    {c[1] ? `local ${c[1]}` : k > 0 ? 'temporary' : ''}
                  </T>
                </Box>
              )}
            </g>
          );
        })}
        <T x={260} y={40} size={11} weight={700} fill={tok('muted')}>OUTPUT</T>
        <T x={260} y={60} size={13} mono>{st.out ?? ''}</T>
      </Svg>
    </StepFrame>
  );
}
