import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `if (true) print 1;
print 2;`;

/** One byte of the chunk: its value and what it is. */
type B = [string, string];
const OP = (name: string, v: number): B => [String(v), name];
const HI: B = ['ff', 'hi'];
const LO: B = ['ff', 'lo'];

// The real bytes, from compile(): TRUE=2, JUMP_IF_FALSE=26, POP=4,
// CONSTANT=0, PRINT=24, JUMP=25, NIL=1, RETURN=33.
const P0: B[] = [OP('TRUE', 2)];
const P1: B[] = [...P0, OP('JIF', 26), HI, LO];
const P2: B[] = [...P1, OP('POP', 4), OP('CONST', 0), ['0', 'k#'], OP('PRINT', 24)];
const P3: B[] = [...P2, OP('JUMP', 25), HI, LO];
const patchThen = (bs: B[]): B[] => bs.map((b, i) => (i === 2 ? ['0', 'hi'] : i === 3 ? ['7', 'lo'] : b));
const P4 = patchThen(P3);
const P5: B[] = [...P4, OP('POP', 4)];
const patchElse = (bs: B[]): B[] => bs.map((b, i) => (i === 9 ? ['0', 'hi'] : i === 10 ? ['1', 'lo'] : b));
const P6 = patchElse(P5);
const P7: B[] = [...P6, OP('CONST', 0), ['1', 'k#'], OP('PRINT', 24), OP('NIL', 1), OP('RET', 33)];

type S = { line: number; bytes: B[]; hot?: number[]; arrow?: [number, number]; ip?: number; note: string };

const STATES: S[] = [
  { line: 0, bytes: P0, hot: [0], note: 'ifStatement compiles the condition first. true is one byte, OP_TRUE, at offset 0. At run time it will leave true on the stack.' },
  { line: 0, bytes: P1, hot: [1, 2, 3], note: 'emitJump(JUMP_IF_FALSE) writes the opcode and two PLACEHOLDER bytes, 0xff 0xff. How far to jump? Nobody knows yet: the then-branch hasn’t been compiled. emitJump returns 2, where the placeholder starts.' },
  { line: 0, bytes: P2, hot: [4, 5, 6, 7], note: 'Then a POP (to drop the condition on the then-path) and the then-branch, print 1: CONSTANT and PRINT. The code is growing past the unfinished jump.' },
  { line: 0, bytes: P3, hot: [8, 9, 10], note: 'At the end of the then-branch, emitJump(JUMP) adds a second jump with its own placeholder at offset 9. It will skip whatever the else part turns out to be.' },
  { line: 0, bytes: P4, hot: [2, 3], arrow: [1, 11], note: 'Now the false-path target is known: the next byte to be written, offset 11. patchJump(2) computes 11 − 2 − 2 = 7 and writes it into the placeholder, high byte then low byte. That is backpatching.' },
  { line: 0, bytes: P5, hot: [11], arrow: [1, 11], note: 'The false path starts with its own POP, for the condition. There’s no else, so that’s all the else part contains.' },
  { line: 0, bytes: P6, hot: [9, 10], arrow: [8, 12], note: 'patchJump(9) fills in the second jump: 12 − 9 − 2 = 1. Taking the then-branch skips exactly one byte: the false path’s POP.' },
  { line: 1, bytes: P7, hot: [12, 13, 14, 15, 16], note: 'The rest of the program follows: print 2, then the script’s NIL and RETURN. These 17 bytes are exactly what the real compiler produces.' },
  { line: 0, bytes: P7, ip: 4, arrow: [1, 11], note: 'Running it: TRUE pushes true. JUMP_IF_FALSE reads its offset, 7, but the value is truthy, so it does nothing and ip moves on to 4. The condition stays on the stack, and POP drops it.' },
  { line: 0, bytes: P7, ip: 12, arrow: [8, 12], note: 'After printing 1, JUMP reads 1 and adds it to ip, which already points at 11 (just past the operand). So ip becomes 12, skipping the false path’s POP. Next is print 2.' },
];

const CW = 43;
const pos = (i: number) => ({ x: 8 + (i % 9) * CW, y: 34 + Math.floor(i / 9) * 84 });

export default function PatchSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Backpatching an if" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={210} title="The chunk's bytes, nine per row, with each byte's offset above it. Jump operands start as placeholders 0xff 0xff and are filled in later.">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>THE CHUNK’S BYTES (offset above)</T>
        {st.bytes.map((b, i) => {
          const { x, y } = pos(i);
          const hot = st.hot?.includes(i);
          const ph = b[0] === 'ff';
          const isIp = st.ip === i;
          return (
            <g key={i}>
              <T x={x + CW / 2 - 2} y={y} size={10} mono anchor="middle" fill={isIp ? tok('brand') : tok('muted')}>{isIp ? `ip→${i}` : i}</T>
              <Box x={x} y={y + 8} w={CW - 4} h={44} fill={hot ? tok('brand', 0.14) : tok('panel')} stroke={isIp ? tok('brand') : ph ? tok('danger') : hot ? tok('brand') : tok('line')} dash={ph}>
                <T x={x + CW / 2 - 2} y={y + 23} size={13} mono weight={700} anchor="middle" fill={ph ? tok('danger') : undefined}>{b[0]}</T>
                <T x={x + CW / 2 - 2} y={y + 41} size={9} mono anchor="middle" fill={tok('muted')}>{b[1]}</T>
              </Box>
            </g>
          );
        })}
        {st.arrow && (() => {
          const a = pos(st.arrow[0]);
          const b = pos(st.arrow[1]);
          return <Arrow x1={a.x + CW / 2} y1={a.y + 54} x2={b.x + CW / 2 - 2} y2={b.y + 6} color={tok('brand')} bend={st.arrow[1] - st.arrow[0] > 8 ? -0.6 : 0.6} />;
        })()}
        <T x={8} y={202} size={11} fill={tok('muted')}>dashed red = placeholder · k# = constant index</T>
      </Svg>
    </StepFrame>
  );
}
