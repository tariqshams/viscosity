// Chapter 138b: the disassembler decoding the real chunk for
//   {
//     let a = 2;
//     print a + 1;
//   }
// The bytes, lines and output lines are exactly what the companion's
// disassembleFunction (companion/ts/src/vm/debug.ts) prints for it. The
// last step shows what goes wrong when decoding starts at an operand.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = [0, 0, 0, 8, 1, 0, 0, 1, 20, 33, 4, 1, 49];
const LINES = [2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4];
const OUT = [
  "0000    2 const               0 '2'",
  '0003    3 load.local          1',
  "0005    | const               1 '1'",
  '0008    | add',
  '0009    | print',
  '0010    4 pop',
  '0011    | none',
  '0012    | return',
];

type S = { at: number; len: number; out: number; bad?: boolean; note: string };

const STATES: S[] = [
  { at: 0, len: 3, out: 1, note: 'Offset 0 is certainly an opcode: 0, const. Its shape is k, two operand bytes, so the disassembler reads 0 and 0 as the constant number 0, looks up constants[0] (the 2) and prints it in quotes. Line 2 is new, so its number is printed. The next instruction starts at 0 + 3 = 3.' },
  { at: 3, len: 2, out: 2, note: 'Offset 3: 8 is load.local, shape s, one operand byte: slot 1, the local a. The line changes to 3. The next instruction starts at 3 + 2 = 5.' },
  { at: 5, len: 3, out: 3, note: 'Offset 5: another const, constant number 1, the value 1. lines[5] is 3, the same as the byte before, so the line column shows | instead.' },
  { at: 8, len: 1, out: 4, note: 'Offset 8: 20 is add. No operands, so the next instruction is at 9.' },
  { at: 9, len: 1, out: 5, note: 'Offset 9: 33 is print, one byte.' },
  { at: 10, len: 1, out: 6, note: 'Offset 10: 4 is pop, on line 4, the closing brace: leaving the block throws away the local a.' },
  { at: 11, len: 2, out: 8, note: 'Offsets 11 and 12: none and return, the ending every script gets. Eight instructions in thirteen bytes, and every offset was found by adding the length of the instruction before it.' },
  { at: 4, len: 1, out: 0, bad: true, note: 'Now the trap. Start at offset 4 instead, and byte 4 is the 1 that is load.local’s operand; but 1 is also the opcode none, so it would print “none”, an instruction that is not in the program. Nothing in a byte says which it is: only decoding from offset 0 knows.' },
];

const BW = 26;
const bx = (k: number) => 8 + k * 29;

export default function DisasmSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Decoding thirteen bytes" steps={s} note={st.note}>
      <pre className="code-surface !my-0 !border-line font-mono">{'{\n  let a = 2;\n  print a + 1;\n}'}</pre>
      <Svg w={400} h={252} title="The disassembler walks the bytes 0 0 0 8 1 0 0 1 20 33 4 1 49 from offset 0, one instruction at a time, printing const 0, load.local 1, const 1, add, print, pop, none and return. Starting at offset 4 instead would misread an operand as the opcode none.">
        <T x={8} y={8} size={11} weight={700} fill={tok('muted')}>code (offset above, line below)</T>
        {CODE.map((b, k) => {
          const cur = k >= st.at && k < st.at + st.len;
          const decoded = !st.bad && k < st.at;
          return (
            <g key={k}>
              <T x={bx(k) + BW / 2} y={24} size={11} mono anchor="middle" fill={tok('muted')}>{k}</T>
              <Box x={bx(k)} y={32} w={BW} h={24} r={3}
                fill={cur ? (st.bad ? tok('accent', 0.25) : tok('brand', 0.25)) : decoded ? tok('safe', 0.1) : tok('panel')}
                stroke={cur ? (st.bad ? tok('accent') : tok('brand')) : tok('line')} />
              <T x={bx(k) + BW / 2} y={45} size={12} mono anchor="middle" weight={cur && k === st.at ? 700 : 400}>{b}</T>
              <T x={bx(k) + BW / 2} y={68} size={11} mono anchor="middle" fill={tok('muted')}>{LINES[k]}</T>
            </g>
          );
        })}
        <T x={8} y={92} size={11} weight={700} fill={tok('muted')}>{st.bad ? 'decoding from offset 4 (wrong)' : 'printed so far'}</T>
        <Box x={8} y={100} w={384} h={146} r={4} fill={tok('paper')} stroke={tok('line')} />
        {st.bad ? (
          <T x={16} y={118} size={11} mono fill={tok('accent')}>0004    | none</T>
        ) : (
          OUT.slice(0, st.out).map((l, i) => (
            <T key={i} x={16} y={116 + i * 17} size={11} mono weight={i === st.out - 1 ? 700 : 400}>{l}</T>
          ))
        )}
      </Svg>
    </StepFrame>
  );
}
