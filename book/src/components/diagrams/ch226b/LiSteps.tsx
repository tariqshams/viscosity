// How `li a0, 0x12345fff` becomes lui + addi (llvm-mc 18, -triple=riscv32:
// lui a0, 0x12346 then addi a0, a0, -1). The low 12 bits 0xfff read as
// -1 once addi sign-extends them, so the upper part is rounded up by one.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `li   a0, 0x12345fff   # what we write
lui  a0, 0x12346      # what it becomes
addi a0, a0, -1`;

type S = { line: number | null; a0: string; hi: string; lo: string; note: string };

const STATES: S[] = [
  { line: 0, a0: '?', hi: '', lo: '', note: 'We want the constant 0x12345fff in a0. An addi can only carry a 12-bit immediate, -2048 to 2047, and this number is far bigger. So the assembler builds it in two pieces.' },
  { line: null, a0: '?', hi: '0x12345', lo: '0xfff', note: 'Split it: the top 20 bits are 0x12345 and the low 12 bits are 0xfff. The plan is "put the top part in place, then add the low part".' },
  { line: null, a0: '?', hi: '0x12345', lo: '-1', note: 'The catch: addi sign-extends its immediate, so the 12 bits 0xfff mean -1, not 4095. Adding -1 would land one 4096 short.' },
  { line: null, a0: '?', hi: '0x12346', lo: '-1', note: 'So the top part is rounded up by one, to 0x12346: 0x12346000 - 1 is exactly 0x12345fff. (A low part of 0x800 or more always needs this extra one.)' },
  { line: 1, a0: '0x12346000', hi: '0x12346', lo: '-1', note: 'lui ("load upper immediate") puts its 20 bits into bits 31 to 12 of a0 and fills the low 12 bits with zeros.' },
  { line: 2, a0: '0x12345fff', hi: '0x12346', lo: '-1', note: 'addi adds -1. a0 now holds 0x12345fff: two real instructions for one li. Small constants need only the addi, from x0.' },
];

export default function LiSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Building a big constant" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={96} title="The upper 20-bit part and the lower 12-bit part of the constant, and the value of register a0">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>UPPER 20 BITS (lui)</T>
        <Box x={8} y={24} w={150} h={30} fill={st.hi ? tok('f1', 0.18) : 'transparent'} stroke={st.hi ? tok('f1') : tok('line')} dash={!st.hi}>
          <T x={83} y={39} size={14} mono anchor="middle">{st.hi}</T>
        </Box>
        <T x={176} y={14} size={11} weight={700} fill={tok('muted')}>LOW 12 (addi)</T>
        <Box x={176} y={24} w={96} h={30} fill={st.lo ? tok('f2', 0.18) : 'transparent'} stroke={st.lo ? tok('f2') : tok('line')} dash={!st.lo}>
          <T x={224} y={39} size={14} mono anchor="middle">{st.lo}</T>
        </Box>
        <T x={290} y={14} size={11} weight={700} fill={tok('muted')}>a0</T>
        <Box x={290} y={24} w={104} h={30} fill={tok('panel')} stroke={tok('ink', 0.5)}>
          <T x={342} y={39} size={13} mono anchor="middle">{st.a0}</T>
        </Box>
        <T x={8} y={80} size={12} fill={tok('muted')}>upper × 4096 + low = 0x12345fff</T>
      </Svg>
    </StepFrame>
  );
}
