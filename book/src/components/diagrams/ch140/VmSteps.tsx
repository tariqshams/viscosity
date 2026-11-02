// Chapter 140: the VM running the real chunk for
//   print 1 + 2 * 3;
// (bytes 0 0 0 0 0 1 0 0 2 22 20 33 1 49, constants [1, 2, 3], checked
// with disassembleFunction). Slot 0 holds the running script itself, as
// in companion/ts/src/vm/vm.ts. The loop shown beside it is a simplified
// sketch of VM.run(); the chapter "The dispatch loop" reads the real one.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const LOOP = `for (;;) {  // simplified
  const op = code[ip++];
  switch (op) {
    case Op.Const:
      push(constants[readShort()]); break;
    case Op.Add: {
      const b = pop(), a = pop();
      push(a + b); break;
    }
    case Op.Mul: {
      const b = pop(), a = pop();
      push(a * b); break;
    }
    case Op.Print: print(pop()); break;
    case Op.None: push(null); break;
    case Op.Return: return;
  }
}`;

const CODE = [0, 0, 0, 0, 0, 1, 0, 0, 2, 22, 20, 33, 1, 49];

type S = { ip: number; read: [number, number] | null; stack: string[]; out: string[]; line: number | null; popped?: string[]; note: string };

const STATES: S[] = [
  { ip: 0, read: null, stack: ['script'], out: [], line: null, note: 'Before the loop starts: the instruction pointer (ip) is 0, the first byte. The stack already holds one thing, the script being run, in slot 0, so sp (the next free slot) is 1.' },
  { ip: 3, read: [0, 3], stack: ['script', '1'], out: [], line: 4, note: 'code[ip++] reads opcode 0, const, and moves ip to 1. readShort() reads the two operand bytes and moves ip on by two more, to 3, giving constant number 0, which is 1. It is pushed into slot 1.' },
  { ip: 6, read: [3, 6], stack: ['script', '1', '2'], out: [], line: 4, note: 'Same instruction, same case: constant number 1 is the value 2. ip moves by three again, past both operand bytes.' },
  { ip: 9, read: [6, 9], stack: ['script', '1', '2', '3'], out: [], line: 4, note: 'Push 3. Three values are waiting, and nothing has been calculated yet.' },
  { ip: 10, read: [9, 10], stack: ['script', '1', '6'], out: [], line: 11, popped: ['3', '2'], note: 'mul, one byte (22). It pops b = 3 first, then a = 2, and pushes 2 * 3 = 6. The two newest values became one.' },
  { ip: 11, read: [10, 11], stack: ['script', '7'], out: [], line: 7, popped: ['6', '1'], note: 'add (20) pops b = 6 and a = 1 and pushes 7. Order matters for - and /: the left operand is underneath, so it is popped second.' },
  { ip: 12, read: [11, 12], stack: ['script'], out: ['7'], line: 13, popped: ['7'], note: 'print (33) pops the 7 and prints it. The statement is done, and the stack is back where it started.' },
  { ip: 13, read: [12, 13], stack: ['script', 'none'], out: ['7'], line: 14, note: 'The compiler ends every script with none then return. none pushes none, the script’s return value.' },
  { ip: 14, read: [13, 14], stack: [], out: ['7'], line: 15, note: 'return (49). The real VM pops the result and the script, and the loop ends. Eight instructions, one loop, no recursion.' },
];

const BW = 25;
const bx = (k: number) => 8 + k * 27.5;

export default function VmSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const slotH = 24;
  const base = 196;
  return (
    <StepFrame title="Running print 1 + 2 * 3;" steps={s} note={st.note}>
      <Svg w={400} h={208} title="The VM runs the bytes 0 0 0 0 0 1 0 0 2 22 20 33 1 49. The instruction pointer moves along the bytes; the stack grows to 1, 2, 3, then becomes 1, 6, then 7, which is printed.">
        <T x={8} y={8} size={11} weight={700} fill={tok('muted')}>code</T>
        {CODE.map((b, k) => {
          const read = st.read && k >= st.read[0] && k < st.read[1];
          const past = k < st.ip && !read;
          return (
            <g key={k}>
              <T x={bx(k) + BW / 2} y={22} size={11} mono anchor="middle" fill={tok('muted')}>{k}</T>
              <Box x={bx(k)} y={30} w={BW} h={24} r={3}
                fill={read ? tok('brand', 0.25) : past ? tok('panel', 0.5) : tok('panel')}
                stroke={read ? tok('brand') : tok('line')} opacity={past ? 0.55 : 1} />
              <T x={bx(k) + BW / 2} y={43} size={12} mono anchor="middle">{b}</T>
            </g>
          );
        })}
        {st.ip >= CODE.length && (
          <T x={392} y={72} size={11} mono anchor="end" weight={700} fill={tok('accent')}>ip = 14, past the end</T>
        )}
        {st.ip < CODE.length && (
          <g>
            <polygon points={`${bx(st.ip) + BW / 2},58 ${bx(st.ip) + BW / 2 - 6},68 ${bx(st.ip) + BW / 2 + 6},68`} fill={tok('accent')} />
            <T x={bx(st.ip) + BW / 2} y={76} size={11} mono anchor="middle" weight={700} fill={tok('accent')}>ip</T>
          </g>
        )}
        <T x={8} y={96} size={11} weight={700} fill={tok('muted')}>stack (top is newest)</T>
        {st.stack.map((v, k) => {
          const y = base - (k + 1) * slotH;
          const script = v === 'script';
          return (
            <g key={k}>
              <Box x={8} y={y} w={120} h={slotH - 3} r={3}
                fill={script ? tok('panel') : tok('safe', 0.14)} stroke={script ? tok('line') : tok('safe')} />
              <T x={14} y={y + 11} size={11} mono fill={tok('muted')}>{k}</T>
              <T x={74} y={y + 11} size={13} mono anchor="middle" fill={script ? tok('muted') : tok('ink')}>{script ? 'script' : v}</T>
            </g>
          );
        })}
        <line x1={4} x2={132} y1={base} y2={base} stroke={tok('ink', 0.5)} strokeWidth={1.5} />
        <T x={136} y={base - st.stack.length * slotH - 10} size={11} mono fill={tok('accent')}>{`← sp = ${st.stack.length}`}</T>
        {st.popped && (
          <T x={200} y={110} size={12} fill={tok('muted')}>{`popped: ${st.popped.join(', ')}`}</T>
        )}
        <T x={200} y={140} size={11} weight={700} fill={tok('muted')}>output</T>
        <Box x={200} y={150} w={192} h={40} r={4} fill={tok('paper')} stroke={tok('line')} />
        <T x={210} y={170} size={14} mono>{st.out.join(' ')}</T>
      </Svg>
      <CodeTrace code={LOOP} line={st.line} />
    </StepFrame>
  );
}
