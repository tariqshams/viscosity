// Chapter 396: drip-rs's match-based dispatch loop running the script
// `print 1 + 2 * 3;`. The bytes are the real compiled chunk, dumped from
// book/companion/rust with rustc 1.97 (both VMs print the same listing):
// 0 0 0 | 0 0 1 | 0 0 2 | 22 | 20 | 33 | 1 | 49, constants [1, 2, 3].
// Const takes a two-byte constant index. Each step is one turn of
// `loop` in Vm::run (vm.rs): read the byte at self.ip (the register),
// decode it with OpCode::from_byte, run one arm.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `loop {
    let byte = self.read_byte();
    let op = OpCode::from_byte(byte)
        .expect("...");
    match op {
        OpCode::Const => { .. }
        OpCode::Mul => { .. }
        OpCode::Add => self.add()?,
        OpCode::Print => { .. }
        OpCode::None =>
            self.push(Value::None),
        OpCode::Return => { .. }
        // ... 47 more arms
    }
}`;

const BYTES = [0, 0, 0, 0, 0, 1, 0, 0, 2, 22, 20, 33, 1, 49];
// Which bytes belong to which instruction (start, length).
const INSTR: [number, number][] = [[0, 3], [3, 3], [6, 3], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1]];

type S = { ip: number; at: number | null; arm: number | null; stack: string[]; out?: string; note: string };

const STATES: S[] = [
  { ip: 0, at: null, arm: null, stack: [], note: 'The chunk for `print 1 + 2 * 3;`, as the compiler left it. The register self.ip is 0, and self.chunk is an Rc pointing at this chunk. The stack is empty.' },
  { ip: 3, at: 0, arm: 5, stack: ['1'], note: 'read_byte reads code[0] = 0 and moves ip to 1. from_byte(0) is Some(OpCode::Const), so the Const arm runs: read_constant reads two operand bytes (0, 0), so ip is now 3, and pushes constant 0, the number 1.' },
  { ip: 6, at: 1, arm: 5, stack: ['1', '2'], note: 'The same arm again, with operand 0 1: push constant 1, the number 2. Each turn of the loop starts by reading whatever byte ip points at.' },
  { ip: 9, at: 2, arm: 5, stack: ['1', '2', '3'], note: 'And once more for the number 3. The multiplication comes next, because the compiler emitted the tighter operator first.' },
  { ip: 10, at: 3, arm: 6, stack: ['1', '6'], note: 'Byte 22 decodes to Mul. pop_numbers("*")? takes 2 and 3 off the stack; had either not been a number, the ? would have returned the runtime error out of run. 6 is pushed.' },
  { ip: 11, at: 4, arm: 7, stack: ['7'], note: 'Byte 20 is Add. Its arm calls self.add()?, which adds two numbers or joins two strings. 1 + 6 = 7.' },
  { ip: 12, at: 5, arm: 8, stack: [], out: '7', note: 'Byte 33 is Print: pop 7, format it (format_number gives "7") and append it to the output.' },
  { ip: 13, at: 6, arm: 9, stack: ['none'], out: '7', note: 'Every script ends with an implicit return of none: the None arm pushes it…' },
  { ip: 14, at: 7, arm: 11, stack: [], out: '7', note: '…and Return pops it. There is no caller frame, so run returns Ok(()). The match had an arm for every one of the 53 opcodes, and rustc checked that before any program ran.' },
];

export default function DispatchSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const cw = 26;
  const x0 = 16;
  return (
    <StepFrame title="One turn of the loop per instruction" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.arm} />
      <Svg w={400} h={176} title="The chunk's bytes with the ip register, and the value stack">
        <T x={x0} y={12} size={11} weight={700} fill={tok('muted')}>self.chunk.code</T>
        {BYTES.map((b, k) => {
          const cur = st.at !== null && k >= INSTR[st.at][0] && k < INSTR[st.at][0] + INSTR[st.at][1];
          return (
            <g key={k}>
              <Box x={x0 + k * cw} y={24} w={cw - 3} h={28} r={3}
                fill={cur ? tok('brand', 0.18) : tok('panel')} stroke={cur ? tok('brand') : tok('line')} />
              <T x={x0 + k * cw + (cw - 3) / 2} y={38} size={12} mono anchor="middle">{b}</T>
              <T x={x0 + k * cw + (cw - 3) / 2} y={62} size={11} mono anchor="middle" fill={tok('muted')}>{k}</T>
            </g>
          );
        })}
        <T x={Math.min(x0 + st.ip * cw + 2, 310)} y={82} size={12} mono weight={700} fill={tok('brand')}>▲ ip = {st.ip}</T>
        <T x={x0} y={108} size={11} weight={700} fill={tok('muted')}>stack</T>
        {st.stack.map((v, k) => (
          <Box key={k} x={x0 + 50 + k * 54} y={96} w={48} h={26} r={3} fill={tok('accent', 0.12)} stroke={tok('accent')}>
            <T x={x0 + 74 + k * 54} y={109} size={12} mono anchor="middle">{v}</T>
          </Box>
        ))}
        {st.stack.length === 0 && <T x={x0 + 50} y={109} size={12} fill={tok('muted')}>(empty)</T>}
        <T x={x0} y={144} size={11} weight={700} fill={tok('muted')}>stdout</T>
        <T x={x0 + 50} y={144} size={13} mono fill={tok('ink')}>{st.out ?? ''}</T>
        <T x={x0} y={166} size={11} fill={tok('muted')}>constants: [1, 2, 3]</T>
      </Svg>
    </StepFrame>
  );
}
