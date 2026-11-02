// New references for chapter 240 and its staged second half, 240-b.
// Checked 2026-11-02. Chapters 240 and 240-b also rely on riscv-isa-unpriv,
// riscv-psabi and riscv-asm-manual (refs-new/226-machine-code-and-assembly.js);
// for the facts these chapters use from them, the following source files were
// re-read raw from GitHub in this session: riscv-isa-manual
// src/unpriv/rv32.adoc at commit 8fb3965fe4b501a6bfa00c34affffcdbdb2c552c
// (BEQ/BNE/BLT/BLTU/BGE/BGEU; “BGT, BGTU, BLE, and BLEU can be synthesized by
// reversing the operands to BLT, BLTU, BGE, and BGEU”; “Arithmetic overflow is
// ignored and the result is simply the low XLEN bits of the result”) and
// src/unpriv/m-st-ext.adoc (MUL places the lower XLEN bits in rd);
// riscv-elf-psabi-doc riscv-cc.adoc at commit
// 9b2767e2a8851709608c4e1452998ad232d6278b (s0-s11 callee-saved; “the stack
// pointer shall be aligned to a 128-bit boundary upon procedure entry”).
// Every listing in the chapters is the real output of the chapters’ own
// JavaScript (Node 22.23), assembled with llvm-mc 18.1.3
// (-triple=riscv64 -mattr=+m -filetype=obj) and disassembled with
// llvm-objdump 18.1.3; clang 18.1.3 (--target=riscv64 -march=rv64im -O2
// -mllvm -replexitval=never) produced the comparison listing. Every Drip
// program shown was also run with the book’s Drip interpreter.
export default [
  {
    id: 'riscv-psabi-relocations',
    authors: ['RISC-V International'],
    title: 'RISC-V ABIs Specification (psABI): ELF relocations and linker relaxation',
    venue: 'RISC-V International, riscv-non-isa/riscv-elf-psabi-doc, riscv-elf.adoc',
    year: null,
    doi: null,
    url: 'https://github.com/riscv-non-isa/riscv-elf-psabi-doc/blob/master/riscv-elf.adoc',
    accessed: '2026-11-02',
    checkedAgainst: 'riscv-elf.adoc at commit 9b2767e2a8851709608c4e1452998ad232d6278b, read raw: the relocation table (19 CALL_PLT, “32-bit PC-relative function call, macros call, tail (PIC)”; CALL is deprecated in its favour); “Unconditional jump (J-Type) instructions have a R_RISCV_JAL relocation” and “Branch (B-Type) instructions have a R_RISCV_BRANCH relocation that can represent an even signed 13-bit offset”; the Linker Relaxation section: relaxation “may delete bytes (and thus invalidate references that are commonly resolved at compile-time, such as intra-function jumps), code generators must in general ensure that relocations are always emitted when relaxation is enabled”, and function-call relaxation can turn AUIPC+JALR into JAL. Also observed: llvm-mc 18.1.3 resolves local branches and leaves R_RISCV_CALL_PLT on each call; clang 18.1.3 --target=riscv64 -c leaves R_RISCV_BRANCH and R_RISCV_JAL on local branches too, and with -mno-relax produces the same bytes as llvm-mc.',
    shaped: 'Chapter 240-b: what the relocations in the compiled Drip program mean, and why clang leaves even local branches to the linker.',
  },
];
