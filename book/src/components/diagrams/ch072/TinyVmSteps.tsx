// Chapter 72: the tiny JavaScript VM from the chapter (cards.js example
// 'tiny-vm') running  PUSH 1, PUSH 2, PUSH 3, MUL, ADD  one loop turn at a
// time. The code array, ip, the value stack st and the line of the loop
// being run are all shown; every state is what the real program does.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const LOOP = `while (ip < code.length) {
  const op = code[ip++];
  if (op === PUSH) {
    st.push(code[ip++]);
  } else {
    const b = st.pop();
    const a = st.pop();
    st.push(op === ADD ? a + b : a * b);
  }
}`;

const CODE = ['PUSH', '1', 'PUSH', '2', 'PUSH', '3', 'MUL', 'ADD'];
const OPERAND = new Set([1, 3, 5]);

type S = { ip: number; read: [number, number] | null; st: number[]; line: number | null; note: string };

const STATES: S[] = [
  { ip: 0, read: null, st: [], line: 0, note: 'Before the first turn: ip is 0, so it points at the first byte, and the stack st is empty. The loop runs while ip is still inside the code.' },
  { ip: 1, read: [0, 1], st: [], line: 1, note: 'code[ip++] reads the byte at 0, which is PUSH, and moves ip to 1. That is the fetch: one array read and one addition.' },
  { ip: 2, read: [1, 2], st: [1], line: 3, note: 'The opcode is PUSH, so this instruction has one operand. code[ip++] again reads it (the 1) and moves ip past it, to 2. The 1 goes on the stack.' },
  { ip: 4, read: [2, 4], st: [1, 2], line: 3, note: 'Next turn: PUSH at 2, its operand at 3. ip moves by two per PUSH, so it always lands on an opcode, never on an operand.' },
  { ip: 6, read: [4, 6], st: [1, 2, 3], line: 3, note: 'PUSH 3. Three values are waiting, and nothing has been calculated yet.' },
  { ip: 7, read: [6, 7], st: [1, 6], line: 7, note: 'MUL, one byte. It is not a PUSH, so the else branch runs: b = 3 (the top), a = 2, and 2 * 3 = 6 is pushed. The two newest values became one.' },
  { ip: 8, read: [7, 8], st: [7], line: 7, note: 'ADD: b = 6, a = 1, and 1 + 6 = 7 is pushed. ip is now 8, the length of the code.' },
  { ip: 8, read: null, st: [7], line: 0, note: 'The test ip < code.length is false, so the loop ends. The answer, 7, is the only value left. Five turns of one loop, and not a single recursive call.' },
];

const BW = 44;
const bx = (k: number) => 8 + k * 48;

export default function TinyVmSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const base = 186;
  const slotH = 24;
  return (
    <StepFrame title="The tiny VM running 1 + 2 * 3" steps={s} note={st.note}>
      <Svg w={400} h={196} title="The tiny VM runs PUSH 1, PUSH 2, PUSH 3, MUL, ADD. The instruction pointer ip moves along the code; the stack grows to 1, 2, 3, then becomes 1, 6, then 7.">
        <T x={8} y={8} size={11} weight={700} fill={tok('muted')}>code</T>
        {CODE.map((b, k) => {
          const read = st.read && k >= st.read[0] && k < st.read[1];
          const past = k < st.ip && !read;
          const operand = OPERAND.has(k);
          return (
            <g key={k}>
              <T x={bx(k) + BW / 2} y={22} size={11} mono anchor="middle" fill={tok('muted')}>{k}</T>
              <Box x={bx(k)} y={30} w={BW} h={24} r={3}
                fill={read ? tok('brand', 0.25) : operand ? tok('accent', 0.1) : tok('panel')}
                stroke={read ? tok('brand') : operand ? tok('accent') : tok('line')} opacity={past ? 0.5 : 1} />
              <T x={bx(k) + BW / 2} y={43} size={operand ? 13 : 11} mono anchor="middle">{b}</T>
            </g>
          );
        })}
        {st.ip < CODE.length ? (
          <g>
            <polygon points={`${bx(st.ip) + BW / 2},58 ${bx(st.ip) + BW / 2 - 6},68 ${bx(st.ip) + BW / 2 + 6},68`} fill={tok('accent')} />
            <T x={bx(st.ip) + BW / 2} y={78} size={11} mono anchor="middle" weight={700} fill={tok('accent')}>{`ip = ${st.ip}`}</T>
          </g>
        ) : (
          <T x={392} y={72} size={11} mono anchor="end" weight={700} fill={tok('accent')}>ip = 8, past the end</T>
        )}
        <T x={8} y={96} size={11} weight={700} fill={tok('muted')}>st (top is newest)</T>
        {st.st.map((v, k) => {
          const y = base - (k + 1) * slotH;
          return (
            <g key={k}>
              <Box x={8} y={y} w={100} h={slotH - 3} r={3} fill={tok('safe', 0.14)} stroke={tok('safe')} />
              <T x={58} y={y + 11} size={13} mono anchor="middle">{v}</T>
            </g>
          );
        })}
        <line x1={4} x2={112} y1={base} y2={base} stroke={tok('ink', 0.5)} strokeWidth={1.5} />
        {st.st.length === 0 && <T x={58} y={base - 12} size={11} anchor="middle" fill={tok('muted')}>empty</T>}
        <T x={160} y={120} size={12} fill={tok('muted')}>{`values waiting: ${st.st.length}`}</T>
        <T x={160} y={144} size={12} fill={tok('muted')}>{st.read ? `bytes read this step: ${st.read[1] - st.read[0]}` : 'no byte read'}</T>
      </Svg>
      <CodeTrace code={LOOP} line={st.line} />
    </StepFrame>
  );
}
