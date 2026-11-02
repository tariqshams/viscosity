// Chapter 120: the dispatch loop running the real chunk for
//   print 1 + 2 * 3;
// (bytes 0 0 0 1 0 2 20 18 24 1 33, constants [1, 2, 3]). Slot 0 holds
// the running script itself, as in companion/ts/src/vm/vm.ts.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const LOOP = `for (;;) {
  const op = readByte();
  switch (op) {
    case OP.CONSTANT:
      push(readConstant()); break;
    case OP.ADD: {
      const b = pop(), a = pop();
      push(a + b); break;
    }
    case OP.MULTIPLY: {
      const b = pop(), a = pop();
      push(a * b); break;
    }
    case OP.PRINT:
      print(pop()); break;
    case OP.NIL: push(null); break;
    case OP.RETURN: return;
  }
}`;

const CODE = [0, 0, 0, 1, 0, 2, 20, 18, 24, 1, 33];

type S = { ip: number; read: [number, number] | null; stack: string[]; out: string[]; line: number | null; popped?: string[]; note: string };

const STATES: S[] = [
  { ip: 0, read: null, stack: ['script'], out: [], line: null, note: 'Before the loop starts: the instruction pointer (ip) is 0, the first byte. The stack already holds one thing, the script being run, in slot 0. Watch the ip and the stack.' },
  { ip: 2, read: [0, 2], stack: ['script', '1'], out: [], line: 4, note: 'readByte() reads opcode 0, CONSTANT, and moves ip to 1. readConstant() reads the operand (0) and moves ip to 2, then fetches constants[0], which is 1. It is pushed.' },
  { ip: 4, read: [2, 4], stack: ['script', '1', '2'], out: [], line: 4, note: 'Same instruction, same case: constant 1 is the value 2. ip jumps by two again, past the operand.' },
  { ip: 6, read: [4, 6], stack: ['script', '1', '2', '3'], out: [], line: 4, note: 'Push 3. Three values are waiting. Nothing has been calculated yet.' },
  { ip: 7, read: [6, 7], stack: ['script', '1', '6'], out: [], line: 11, popped: ['3', '2'], note: 'MULTIPLY, one byte. It pops b = 3 first, then a = 2, and pushes 2 * 3 = 6. The newest two values became one.' },
  { ip: 8, read: [7, 8], stack: ['script', '7'], out: [], line: 7, popped: ['6', '1'], note: 'ADD pops b = 6 and a = 1 and pushes 7. Order matters for - and /: the left operand is underneath, so it is popped second.' },
  { ip: 9, read: [8, 9], stack: ['script'], out: ['7'], line: 14, popped: ['7'], note: 'PRINT pops the 7 and prints it. The statement is done, and the stack is back where it started.' },
  { ip: 10, read: [9, 10], stack: ['script', 'nil'], out: ['7'], line: 15, note: 'The compiler ends every script with NIL then RETURN. NIL pushes nil, the script’s return value.' },
  { ip: 11, read: [10, 11], stack: [], out: ['7'], line: 16, note: 'RETURN. The real VM pops the result and the script, and the loop exits. Eight instructions, one loop, no recursion.' },
];

const BW = 32;
const bx = (k: number) => 8 + k * 35;

export default function VmSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const slotH = 24;
  const base = 196;
  return (
    <StepFrame title="Running print 1 + 2 * 3;" steps={s} note={st.note}>
      <Svg w={400} h={208} title="The VM runs the bytes 0 0 0 1 0 2 20 18 24 1 33. The instruction pointer moves along the bytes; the stack grows to 1, 2, 3, then becomes 1, 6, then 7, which is printed.">
        <T x={8} y={8} size={11} weight={700} fill={tok('muted')}>code</T>
        {CODE.map((b, k) => {
          const read = st.read && k >= st.read[0] && k < st.read[1];
          const past = k < st.ip && !read;
          return (
            <g key={k}>
              <T x={bx(k) + BW / 2} y={22} size={9} mono anchor="middle" fill={tok('muted')}>{k}</T>
              <Box x={bx(k)} y={30} w={BW} h={24} r={3}
                fill={read ? tok('brand', 0.25) : past ? tok('panel', 0.5) : tok('panel')}
                stroke={read ? tok('brand') : tok('line')} opacity={past ? 0.55 : 1} />
              <T x={bx(k) + BW / 2} y={43} size={12} mono anchor="middle">{b}</T>
            </g>
          );
        })}
        {st.ip >= CODE.length && (
          <T x={392} y={72} size={11} mono anchor="end" weight={700} fill={tok('accent')}>ip = 11, past the end</T>
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
              <T x={14} y={y + 11} size={10} mono fill={tok('muted')}>{k}</T>
              <T x={74} y={y + 11} size={13} mono anchor="middle" fill={script ? tok('muted') : tok('ink')}>{script ? '<script>' : v}</T>
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
