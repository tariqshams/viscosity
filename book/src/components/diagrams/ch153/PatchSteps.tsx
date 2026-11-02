// Chapter 152-b: backpatching the two jumps of an if with an else,
// over the real bytes the companion compiler emits.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `if true {
  print 1;
} else {
  print 2;
}`;

/** One byte of the bytecode: its value and what it is. */
type B = [string, string];
const OP = (name: string, v: number): B => [String(v), name];
const HI: B = ['ff', 'hi'];
const LO: B = ['ff', 'lo'];
const K = (n: number): B[] => [['0', 'k hi'], [String(n), 'k lo']];

// The real bytes, from the companion's compile():
// [2,35,0,7,0,0,0,33,34,0,4,0,0,1,33,1,49]
// true=2, jump.unless=35, const=0 (two-byte constant index), print=33,
// jump=34, none=1, return=49.
const P0: B[] = [OP('true', 2)];
const P1: B[] = [...P0, OP('unless', 35), HI, LO];
const P2: B[] = [...P1, OP('const', 0), ...K(0), OP('print', 33)];
const P3: B[] = [...P2, OP('jump', 34), HI, LO];
const patchThen = (bs: B[]): B[] => bs.map((b, i) => (i === 2 ? ['0', 'hi'] : i === 3 ? ['7', 'lo'] : b));
const P4 = patchThen(P3);
const P5: B[] = [...P4, OP('const', 0), ...K(1), OP('print', 33)];
const patchElse = (bs: B[]): B[] => bs.map((b, i) => (i === 9 ? ['0', 'hi'] : i === 10 ? ['4', 'lo'] : b));
const P6 = patchElse(P5);
const P7: B[] = [...P6, OP('none', 1), OP('return', 49)];

type S = { line: number; bytes: B[]; hot?: number[]; arrow?: [number, number]; ip?: number; note: string };

const STATES: S[] = [
  { line: 0, bytes: P0, hot: [0], note: 'ifStatement compiles the condition first. true is one byte, at offset 0; at run time it will leave true on the stack.' },
  { line: 0, bytes: P1, hot: [1, 2, 3], note: 'emitJump(Op.JumpUnless) writes the opcode and two PLACEHOLDER bytes, 0xff 0xff. How far to jump? Nobody knows yet: the then-branch has not been compiled. emitJump returns 2, where the placeholder starts.' },
  { line: 1, bytes: P2, hot: [4, 5, 6, 7], note: 'The then-branch, print 1: const with its two-byte constant index, then print. The code grows past the unfinished jump.' },
  { line: 2, bytes: P3, hot: [8, 9, 10], note: 'There is an else, so emitJump(Op.Jump) adds a second jump with its own placeholder, at 9. It will skip whatever the else-branch turns out to be.' },
  { line: 2, bytes: P4, hot: [2, 3], arrow: [1, 11], note: 'Now the false-path target is known: the next byte to be written, offset 11. patchJump(2) computes 11 − 2 − 2 = 7 and writes it into the placeholder, high byte then low byte. That is backpatching.' },
  { line: 3, bytes: P5, hot: [11, 12, 13, 14], arrow: [1, 11], note: 'The else-branch, print 2, is compiled at 11, exactly where the first jump will land.' },
  { line: 4, bytes: P6, hot: [9, 10], arrow: [8, 15], note: 'At the end of the else-branch, patchJump(9) fills in the second jump: 15 − 9 − 2 = 4. The then-branch will skip exactly the four bytes of the else-branch.' },
  { line: 4, bytes: P7, hot: [15, 16], note: 'The script ends with none and return. These 17 bytes are exactly what the companion compiler produces.' },
  { line: 0, bytes: P7, ip: 4, arrow: [1, 11], note: 'Running it: true is pushed. jump.unless reads its distance, 7, and pops the condition; it is true, so nothing happens and ip is 4, the then-branch.' },
  { line: 2, bytes: P7, ip: 15, arrow: [8, 15], note: 'After print 1, jump reads 4 and adds it to ip, which already points at 11 (just past the operand): ip becomes 15, skipping the else-branch.' },
];

const CW = 43;
const pos = (i: number) => ({ x: 8 + (i % 9) * CW, y: 34 + Math.floor(i / 9) * 84 });

export default function PatchSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Backpatching an if" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={210} title="The function's bytes, nine per row, with each byte's offset above it. Jump operands start as placeholders 0xff 0xff and are filled in later.">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>THE BYTECODE (offset above)</T>
        {st.bytes.map((b, i) => {
          const { x, y } = pos(i);
          const hot = st.hot?.includes(i);
          const ph = b[0] === 'ff';
          const isIp = st.ip === i;
          return (
            <g key={i}>
              <T x={x + CW / 2 - 2} y={y} size={11} mono anchor="middle" fill={isIp ? tok('brand') : tok('muted')}>{isIp ? `ip→${i}` : i}</T>
              <Box x={x} y={y + 8} w={CW - 4} h={44} fill={hot ? tok('brand', 0.14) : tok('panel')} stroke={isIp ? tok('brand') : ph ? tok('danger') : hot ? tok('brand') : tok('line')} dash={ph}>
                <T x={x + CW / 2 - 2} y={y + 23} size={13} mono weight={700} anchor="middle" fill={ph ? tok('danger') : undefined}>{b[0]}</T>
                <T x={x + CW / 2 - 2} y={y + 41} size={11} mono anchor="middle" fill={tok('muted')}>{b[1]}</T>
              </Box>
            </g>
          );
        })}
        {st.arrow && (() => {
          const a = pos(st.arrow[0]);
          const b = pos(st.arrow[1]);
          return <Arrow x1={a.x + CW / 2} y1={a.y + 54} x2={b.x + CW / 2 - 2} y2={b.y + 6} color={tok('brand')} bend={st.arrow[1] - st.arrow[0] > 8 ? -0.6 : 0.6} />;
        })()}
        <T x={8} y={202} size={11} fill={tok('muted')}>dashed red = placeholder · k hi, k lo = constant index</T>
      </Svg>
    </StepFrame>
  );
}
