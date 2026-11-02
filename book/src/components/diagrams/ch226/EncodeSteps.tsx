// Decoding one real RISC-V instruction, field by field.
// 0x00150513 is `addi a0, a0, 1` (checked with llvm-mc 18: bytes
// 13 05 15 00). I-type layout from the RISC-V unprivileged manual:
// imm[11:0] | rs1 | funct3 | rd | opcode.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type Field = { name: string; bits: string; hi: number; lo: number; w: number; meaning: string };

const FIELDS: Field[] = [
  { name: 'imm', bits: '000000000001', hi: 31, lo: 20, w: 130, meaning: '1' },
  { name: 'rs1', bits: '01010', hi: 19, lo: 15, w: 60, meaning: 'x10 = a0' },
  { name: 'funct3', bits: '000', hi: 14, lo: 12, w: 46, meaning: 'add' },
  { name: 'rd', bits: '01010', hi: 11, lo: 7, w: 60, meaning: 'x10 = a0' },
  { name: 'opcode', bits: '0010011', hi: 6, lo: 0, w: 80, meaning: 'OP-IMM' },
];

type S = { show: 'bytes' | 'bits' | number; note: string };

const STATES: S[] = [
  { show: 'bytes', note: 'In memory the instruction is four bytes, 13 05 15 00. RISC-V stores instructions little-endian: the lowest byte comes first, so read backwards they make the 32-bit number 0x00150513.' },
  { show: 'bits', note: 'The CPU sees 32 bits, bit 31 on the left and bit 0 on the right. On its own the pattern means nothing; the instruction format says how to cut it up.' },
  { show: 4, note: 'Bits 6 to 0 are the opcode, 0010011. That is OP-IMM: "do arithmetic with a constant stored inside the instruction". It also tells the CPU which format the rest uses (here I-type).' },
  { show: 3, note: 'Bits 11 to 7 are rd, the destination register: 01010 is 10, so register x10, which programmers call a0.' },
  { show: 2, note: 'Bits 14 to 12 are funct3, which picks the operation within OP-IMM: 000 means add (ADDI).' },
  { show: 1, note: 'Bits 19 to 15 are rs1, the source register: 01010 again, so x10 (a0).' },
  { show: 0, note: 'Bits 31 to 20 are the 12-bit immediate, the constant: 000000000001 is 1. Put together: addi a0, a0, 1, which means a0 = a0 + 1.' },
];

export default function EncodeSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  let x = 8;
  return (
    <StepFrame title="Reading one instruction's bits" steps={s} note={st.note}>
      <Svg w={400} h={170} title="The 32-bit word 0x00150513 split into the fields of an I-type instruction: immediate, rs1, funct3, rd and opcode">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>IN MEMORY (address order)</T>
        {['13', '05', '15', '00'].map((b, k) => (
          <Box key={k} x={8 + k * 44} y={24} w={40} h={26} fill={st.show === 'bytes' ? tok('brand', 0.15) : tok('panel')} stroke={st.show === 'bytes' ? tok('brand') : tok('line')}>
            <T x={28 + k * 44} y={37} size={13} mono anchor="middle">{b}</T>
          </Box>
        ))}
        <T x={196} y={37} size={13} mono>= 0x00150513</T>
        <T x={8} y={68} size={11} weight={700} fill={tok('muted')}>AS 32 BITS (bit 31 … bit 0)</T>
        {FIELDS.map((f, k) => {
          const fx = x;
          x += f.w + 2;
          const hot = st.show === k || st.show === 'bits';
          const seen = typeof st.show === 'number' && k >= st.show;
          return (
            <g key={f.name}>
              <T x={fx + f.w / 2} y={84} size={11} anchor="middle" fill={tok('muted')}>{`${f.hi}–${f.lo}`}</T>
              <Box x={fx} y={92} w={f.w} h={28} fill={hot ? tok('brand', st.show === k ? 0.22 : 0.08) : tok('panel')} stroke={st.show === k ? tok('brand') : tok('line')}>
                <T x={fx + f.w / 2} y={106} size={11} mono anchor="middle">{f.bits}</T>
              </Box>
              {typeof st.show === 'number' && (
                <T x={fx + f.w / 2} y={132} size={11} anchor="middle" weight={700} fill={seen ? tok('ink') : tok('muted', 0.4)}>{f.name}</T>
              )}
              {seen && <T x={fx + f.w / 2} y={150} size={11} anchor="middle" mono fill={tok('accent')}>{f.meaning}</T>}
            </g>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
