// New references for Part VII (chapters 230-235): the RISC-V specifications.
// Checked 2026-11-02 by cloning the official repositories from GitHub and
// reading the source files named in each checkedAgainst. Every encoding the
// chapters quote was also checked with LLVM's assembler (llvm-mc 18.1.3,
// -triple=riscv64), and every compiler listing comes from clang 18.1.3.
export default [
  {
    id: 'riscv-isa-unpriv',
    authors: ['RISC-V International'],
    title: 'The RISC-V Instruction Set Manual, Volume I: Unprivileged Architecture',
    venue: 'RISC-V International specification (RV32I and RV64I version 2.1; M extension version 2.0, all ratified)',
    year: null,
    doi: null,
    url: 'https://github.com/riscv/riscv-isa-manual',
    accessed: '2026-11-02',
    checkedAgainst: 'Source of the manual at commit 8fb3965fe4b501a6bfa00c34affffcdbdb2c552c (29 Oct 2026): src/unpriv/preface.adoc (ratified versions: RV32I 2.1, RV64I 2.1, M 2.0); intro.adoc (RISC-V ISA overview: base plus optional extensions, XLEN, two’s complement); rv32.adoc (programmers’ model: 32 x registers, x0 hardwired to 0, pc; the note that x1 is the return address and x2 the stack pointer only by the software calling convention; R/I/S/U formats and B/J variants with rs1, rs2 and rd in fixed positions and the sign bit always in bit 31; ADDI, MV as ADDI rd, rs1, 0; JAL, JALR, J and RET; conditional branches with a ±4 KiB range; load-store architecture with one addressing form, rs1 plus a sign-extended 12-bit offset); rv64.adoc (LD, SD, LW sign-extends and LWU zero-extends on RV64I); m-st-ext.adoc (MUL); rv-32-64g.adoc (opcode map and instruction listings, and G as IMAFDZicsr_Zifencei); the U-type LUI in rv32.adoc.',
    shaped: 'Part VII: every RISC-V register, instruction format, encoding and instruction meaning stated in chapters 230 to 235 (and their staged splits 226-b, 228-b and 229-b), including the RV32I instruction count (40) and the single-bltu bounds check noted in the conditional-branch section.',
  },
  {
    id: 'riscv-psabi',
    authors: ['RISC-V International'],
    title: 'RISC-V ABIs Specification (psABI), version 2.0-rc0 draft',
    venue: 'RISC-V International, riscv-non-isa/riscv-elf-psabi-doc',
    year: null,
    doi: null,
    url: 'https://github.com/riscv-non-isa/riscv-elf-psabi-doc',
    accessed: '2026-11-02',
    checkedAgainst: 'Source at commit 9b2767e2a8851709608c4e1452998ad232d6278b (27 Oct 2026): riscv-cc.adoc (integer register convention table: zero, ra, sp, gp, tp, t0-t6, s0-s11, a0-a7 and which are preserved across calls; optional frame pointer in s0; eight argument registers a0-a7, the first two also used for return values; values too wide for registers passed by reference; the stack grows downwards and sp is 128-bit aligned on procedure entry and must stay aligned; data below sp must not be relied on; s0-s11 preserved across calls); riscv-cc.adoc also: values returned like a first named argument; scalars and aggregates up to 2×XLEN in a register pair, split between a7 and the stack when only one register is left; aggregates larger than 2×XLEN passed by reference; the frame-pointer convention (optional, in s0); the named ABIs (ILP32, LP64, LP64D, ...) and the recommended default LP64D on RV64G; the LP64 C type sizes (char 1, int 4, long 8, void * 8 bytes). riscv-abi.adoc (the ABI document is made of the calling convention, ELF, DWARF, run-time ABI and atomics parts); riscv-elf.adoc (little-endian is the default data byte order, instructions are always stored little-endian, and the medlow code model addresses the lowest and highest 2 GiB); prelude.adoc (revnumber 2.0-rc0).',
    shaped: 'Chapters 230 to 235 and their staged splits: the stack pointer, the register roles, the calling convention, caller- and callee-saved registers and the shape of prologues and epilogues.',
  },
  {
    id: 'riscv-asm-manual',
    authors: ['RISC-V International (several contributors)'],
    title: 'RISC-V Assembly Programmer’s Manual',
    venue: 'RISC-V International, riscv-non-isa/riscv-asm-manual',
    year: null,
    doi: null,
    url: 'https://github.com/riscv-non-isa/riscv-asm-manual',
    accessed: '2026-11-02',
    checkedAgainst: 'Source at commit 167ad3d022afd7480b629ccda08c9f61cc8cfa5a (18 Oct 2026): src/asm-manual.adoc, the pseudoinstruction table (nop, li, mv, j, jr, ret as jalr x0, x1, 0, beqz, bnez, blez, bgt, ble, call as auipc plus jalr, tail) and the Function Calls section.',
    shaped: 'Chapters 230 to 235: assembly syntax, labels and the pseudoinstructions li, mv, j, ret, call and tail.',
  },
];
