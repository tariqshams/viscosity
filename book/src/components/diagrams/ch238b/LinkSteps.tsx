// Chapter 238-b (staged split of 238): ld.lld linking main.o and loop.o.
// Resolution, layout, then each relocation patched. Every address and byte
// is from the real link in this book's session (LLD 18.1.3).
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type S = { stage: number; patched: number; note: string };
const STATES: S[] = [
  { stage: 0, patched: 0, note: 'Two object files. main.o defines _start and uses sumsq (undefined there); loop.o defines sumsq. Neither has real addresses yet: both think their code starts at 0.' },
  { stage: 1, patched: 0, note: 'Resolution: every undefined global must match exactly one definition. main.o\'s sumsq is matched to the one in loop.o. Local names such as loop and stop never meet across files.' },
  { stage: 2, patched: 0, note: 'Layout: the .text sections are placed one after the other (main.o\'s, then loop.o\'s), and .data on a later page. Now every symbol has a final address.' },
  { stage: 2, patched: 1, note: 'Patch 1, R_RISCV_HI20 at _start + 0: table is at 0x12198, so (0x12198 + 0x800) >> 12 = 0x12 goes into the lui.' },
  { stage: 2, patched: 2, note: 'Patch 2, R_RISCV_LO12_I at _start + 4: the low 12 bits, 0x198, go into the addi. lui and addi together now build 0x12198.' },
  { stage: 2, patched: 3, note: 'Patch 3, R_RISCV_CALL_PLT at 0x11164: S − P = 0x11170 − 0x11164 = 12. The high part is 0, so auipc is unchanged; jalr gets 12.' },
  { stage: 3, patched: 3, note: 'Every hole is filled. The linker writes an executable whose header says: start running at _start, 0x11158.' },
];

const ROWS = [
  { at: '0x11158', before: '37 05 00 00', after: '37 25 01 00', asm: 'lui  a0, 0x12' },
  { at: '0x1115c', before: '13 05 05 00', after: '13 05 85 19', asm: 'addi a0, a0, 0x198' },
  { at: '0x11168', before: 'e7 80 00 00', after: 'e7 80 c0 00', asm: 'jalr 0xc(ra)' },
];

export default function LinkSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const placed = st.stage >= 2;
  return (
    <StepFrame title="What the linker does" steps={s} note={st.note}>
      <Svg w={400} h={260} title="The two object files placed into one address space, the symbol table with final addresses, and the three instructions whose bytes the relocations change.">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>{placed ? 'OUTPUT LAYOUT' : 'INPUT FILES'}</T>
        <Box x={8} y={22} w={180} h={34} fill={tok('brand', 0.12)} stroke={tok('brand')}>
          <T x={16} y={33} size={11} weight={700}>main.o .text (24 B)</T>
          <T x={16} y={48} size={11} mono fill={tok('muted')}>{placed ? '0x11158 _start' : '0x0 _start, uses sumsq'}</T>
        </Box>
        <Box x={8} y={60} w={180} h={34} fill={tok('f3', 0.14)} stroke={tok('f3')}>
          <T x={16} y={71} size={11} weight={700}>loop.o .text (40 B)</T>
          <T x={16} y={86} size={11} mono fill={tok('muted')}>{placed ? '0x11170 sumsq' : '0x0 sumsq'}</T>
        </Box>
        <Box x={8} y={98} w={180} h={34} fill={tok('f2', 0.14)} stroke={tok('f2')}>
          <T x={16} y={109} size={11} weight={700}>main.o .data (32 B)</T>
          <T x={16} y={124} size={11} mono fill={tok('muted')}>{placed ? '0x12198 table' : '0x0 table'}</T>
        </Box>
        <T x={204} y={12} size={11} weight={700} fill={tok('muted')}>SYMBOLS</T>
        {st.stage >= 1 && (
          <g>
            <T x={204} y={32} size={12} mono>{`_start  ${placed ? '0x11158' : 'main.o'}`}</T>
            <T x={204} y={50} size={12} mono fill={tok('brand')}>{`sumsq   ${placed ? '0x11170' : 'loop.o ✓'}`}</T>
            <T x={204} y={68} size={12} mono>{`table   ${placed ? '0x12198' : 'main.o (local)'}`}</T>
          </g>
        )}
        {st.stage === 3 && <T x={204} y={104} size={12} weight={700} fill={tok('safe')}>entry point: 0x11158</T>}
        <T x={8} y={152} size={11} weight={700} fill={tok('muted')}>THE THREE HOLES</T>
        {ROWS.map((r, k) => {
          const y = 162 + k * 30;
          const done = st.patched > k;
          const now = st.patched === k + 1 && st.stage === 2;
          return (
            <Box key={k} x={4} y={y} w={392} h={26} fill={now ? tok('accent', 0.14) : tok('panel')} stroke={now ? tok('accent') : tok('line')}>
              <T x={12} y={y + 13} size={11} mono fill={tok('muted')}>{placed ? r.at : ''}</T>
              <T x={80} y={y + 13} size={12} mono fill={done ? tok('safe') : tok('danger')}>{done ? r.after : r.before}</T>
              <T x={176} y={y + 13} size={12} mono>{done ? r.asm : 'hole'}</T>
            </Box>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
