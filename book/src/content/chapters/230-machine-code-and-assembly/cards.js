// Chapter 230 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Every encoding here was checked with llvm-mc 18.1.3 (-triple=riscv64).

export const prompts = {
  'mc-what': {
    q: 'What is **machine code**?',
    a: 'The bytes a processor runs directly: a sequence of instructions, each a fixed bit pattern (32 bits in base RISC-V) that the hardware decodes.',
  },
  'vm-vs-cpu': {
    q: 'Part IV’s VM ran bytecode with a dispatch loop. What runs machine code?',
    a: 'The processor itself: its fetch, decode and execute loop is hardware, with no interpreter program in between.',
  },
  'byte-order': {
    q: '`addi a0, a0, 1` is the word 0x00150513. Why do its bytes appear in memory as `13 05 15 00`?',
    a: 'RISC-V stores instructions little-endian: the lowest byte (0x13) comes first.',
  },
  'opcode-field': {
    q: 'Which bits of a RISC-V instruction hold the opcode, and what does it decide?',
    a: 'Bits 6 to 0 (the lowest seven). It names the kind of instruction and so which format the other bits follow.',
  },
  'asm-what': {
    q: 'What is **assembly language**, and what translates it?',
    a: 'Machine code written as text (operation names, registers, labels, comments); an assembler turns it into the bits.',
  },
  'label-what': {
    q: 'In `j loop`, what is `loop`?',
    a: 'A label: a name for the address of an instruction, which the assembler replaces with the right offset.',
  },
  'pseudo-what': {
    q: 'What is a **pseudoinstruction**? Give one.',
    a: 'A convenient spelling the assembler expands into real instructions, e.g. `mv a0, t0` is `addi a0, t0, 0`.',
  },
  'ret-is': {
    q: 'Which real instruction is the pseudoinstruction `ret`?',
    a: '`jalr x0, 0(ra)`: jump to the address in `ra`, discarding the link by writing it to `x0`.',
  },
};

export const examples = {
  decode: {
    title: 'Pulling the fields out of an instruction',
    code: `function fields(w) {
  return {
    op: (w & 0x7f).toString(2)
      .padStart(7, '0'),
    rd: (w >>> 7) & 0x1f,
    f3: (w >>> 12) & 0x7,
    rs1: (w >>> 15) & 0x1f,
    imm: w >> 20,
  };
}
// addi a0, a0, 1
console.log(fields(0x00150513));
// addi sp, sp, -16
console.log(fields(0xff010113 | 0));`,
  },
};

export const exercises = {
  'encode-addi': {
    title: 'Encode an addi',
    prompt: `Write \`addi(rd, rs1, imm)\` that returns the 32-bit machine word for the RISC-V instruction \`addi rd, rs1, imm\`, as a non-negative number (so \`addi(10, 10, 1)\` returns \`0x00150513\`). \`rd\` and \`rs1\` are register numbers 0 to 31.

The I-type layout is \`imm[11:0]\` in bits 31 to 20, \`rs1\` in bits 19 to 15, funct3 (\`0\` for addi) in bits 14 to 12, \`rd\` in bits 11 to 7, and the opcode \`0b0010011\` in bits 6 to 0. The immediate must fit in 12 signed bits, -2048 to 2047; if it does not, **throw** an error, as a real assembler does.`,
    starter: `function addi(rd, rs1, imm) {
  // your code here
}

console.log(addi(10, 10, 1)
  .toString(16));`,
    solution: `function addi(rd, rs1, imm) {
  if (imm < -2048 || imm > 2047) {
    throw new Error('imm out of range');
  }
  const op = 0b0010011;
  const w = ((imm & 0xfff) << 20) |
    (rs1 << 15) | (0 << 12) |
    (rd << 7) | op;
  return w >>> 0;
}`,
    tests: `test('addi a0, a0, 1', () => {
  expect(addi(10, 10, 1)).toBe(0x00150513);
});
test('li t0, 0 is addi t0, x0, 0', () => {
  expect(addi(5, 0, 0)).toBe(0x00000293);
});
test('mv a0, t0 is addi a0, t0, 0', () => {
  expect(addi(10, 5, 0)).toBe(0x00028513);
});
test('negative: addi sp, sp, -16', () => {
  expect(addi(2, 2, -16)).toBe(0xff010113);
});
test('the edges of the range', () => {
  expect(addi(10, 10, 2047)).toBe(0x7ff50513);
  expect(addi(10, 10, -2048)).toBe(0x80050513);
});
test('too big throws', () => {
  expect(() => addi(10, 10, 3000)).toThrow();
  expect(() => addi(10, 10, -2049)).toThrow();
});`,
    hints: [
      'Build the word by putting each field in its place with a left shift, then combine the pieces with `|`.',
      'The fields are: `imm << 20`, `rs1 << 15`, `0 << 12`, `rd << 7` and the opcode `0b0010011` in the lowest bits. Check the range first and `throw` if `imm` is outside -2048 to 2047.',
      'JavaScript’s `|` and `<<` give a *signed* 32-bit result, so a word with bit 31 set comes out negative. Finish with `>>> 0`, which reinterprets the same 32 bits as a non-negative number.',
    ],
    walkthrough: `**How to think about it.** An instruction is five small numbers packed side by side into one 32-bit number. Packing a field means shifting it left so that its lowest bit lands on the right bit position, and then OR-ing all the shifted pieces together (they never overlap, so OR just lays them next to each other). The two traps are the immediate, which can be negative, and JavaScript's habit of treating the result of bit operations as a signed 32-bit number.

**The solution, line by line.**

- \`if (imm < -2048 || imm > 2047) { throw ... }\`: twelve bits in two's complement hold -2048 up to 2047, and nothing else. \`llvm-mc\` rejects \`addi a0, a0, 3000\` with "an integer in the range [-2048, 2047]", and so do we.
- \`const op = 0b0010011;\`: the OP-IMM opcode, written in binary so it can be compared with the spec's table.
- \`((imm & 0xfff) << 20)\`: \`imm & 0xfff\` keeps the low 12 bits; for -16 that is \`0xff0\`, the two's complement pattern. Shifting left by 20 moves it to bits 31 to 20. (Because \`<<\` works on 32 bits, the extra sign bits of a negative \`imm\` would fall off the top anyway, but the mask makes the intent plain.)
- \`(rs1 << 15)\` puts the source register in bits 19 to 15, and \`(0 << 12)\` is funct3, zero for addi (written out so the layout matches the spec).
- \`(rd << 7) | op\`: the destination register in bits 11 to 7 and the opcode in the bottom seven bits.
- \`return w >>> 0;\`: for \`addi sp, sp, -16\` bit 31 is set, so \`w\` is the negative number -16711405; \`>>> 0\` (an unsigned shift by nothing) gives the same bits read as unsigned, \`0xff010113\`.

**Common wrong attempts.**

- Leaving off \`>>> 0\`: every test with a positive immediate passes, and \`addi(2, 2, -16)\` returns a negative number that \`toBe(0xff010113)\` rejects.
- Swapping \`rs1\` and \`rd\` (\`rd << 15\`, \`rs1 << 7\`): \`addi a0, a0, 1\` still passes, because both are 10, which hides the bug until \`mv a0, t0\`.
- Forgetting the range check: the word for 3000 silently becomes a different instruction (3000 does not fit, so its top bits are lost and the CPU would add -1096 instead).`,
    wrong: [
      {
        code: `function addi(rd, rs1, imm) {
  if (imm < -2048 || imm > 2047) {
    throw new Error('imm out of range');
  }
  return (imm << 20) | (rs1 << 15) |
    (rd << 7) | 0b0010011;
}`,
        why: 'No `>>> 0`, so a negative immediate makes bit 31 set and the result a negative number.',
      },
      {
        code: `function addi(rd, rs1, imm) {
  if (imm < -2048 || imm > 2047) {
    throw new Error('imm out of range');
  }
  return ((imm << 20) | (rd << 15) |
    (rs1 << 7) | 0b0010011) >>> 0;
}`,
        why: 'rd and rs1 are in each other’s places; it only looks right when they are the same register.',
      },
      {
        code: `function addi(rd, rs1, imm) {
  return (((imm & 0xfff) << 20) |
    (rs1 << 15) | (rd << 7) |
    0b0010011) >>> 0;
}`,
        why: 'No range check: an immediate like 3000 is silently cut to 12 bits instead of being rejected.',
      },
    ],
  },
  'decode-i': {
    optional: true,
    title: 'Decode an I-type instruction',
    prompt: `Write \`decodeI(w)\` that takes a 32-bit I-type word and returns \`{ op, rd, f3, rs1, imm }\`: the opcode (bits 6 to 0), \`rd\`, funct3, \`rs1\`, and the immediate as a **signed** number (so the word for \`addi sp, sp, -16\` gives \`imm: -16\`). The word may arrive as a non-negative number such as \`0xff010113\`.`,
    starter: `function decodeI(w) {
  // your code here
}`,
    solution: `function decodeI(w) {
  return {
    op: w & 0x7f,
    rd: (w >>> 7) & 0x1f,
    f3: (w >>> 12) & 0x7,
    rs1: (w >>> 15) & 0x1f,
    imm: w >> 20,
  };
}`,
    tests: `test('addi a0, a0, 1', () => {
  expect(decodeI(0x00150513)).toEqual(
    { op: 0x13, rd: 10, f3: 0, rs1: 10, imm: 1 });
});
test('addi sp, sp, -16', () => {
  expect(decodeI(0xff010113)).toEqual(
    { op: 0x13, rd: 2, f3: 0, rs1: 2, imm: -16 });
});
test('ld a0, 16(sp) is I-type too', () => {
  expect(decodeI(0x01013503)).toEqual(
    { op: 0x03, rd: 10, f3: 3, rs1: 2, imm: 16 });
});`,
    hints: [
      'Each field is "shift right until the field is at the bottom, then mask off the bits above it".',
      'The masks are `0x7f` (seven ones), `0x1f` (five) and `0x7` (three). The immediate is everything from bit 20 up.',
      'For the immediate use `>>` (which copies the sign bit in from the left) rather than `>>>`, so that a 1 in bit 31 gives a negative number: `w >> 20`.',
    ],
    walkthrough: `**How to think about it.** Decoding undoes encoding: instead of shifting fields up into place, shift each one down to the bottom and throw away everything above it with a mask. The immediate needs care, because it is signed.

**The solution, line by line.**

- \`op: w & 0x7f\` keeps the lowest seven bits, the opcode. For addi that is \`0x13\` (0010011); for a load it is \`0x03\`.
- \`rd: (w >>> 7) & 0x1f\` moves bits 11 to 7 to the bottom and keeps five of them.
- \`f3: (w >>> 12) & 0x7\` keeps the three bits of funct3; \`ld\` uses 3 (011), which is how the CPU tells a 64-bit load from \`lw\` (2).
- \`rs1: (w >>> 15) & 0x1f\` is the source register.
- \`imm: w >> 20\`: JavaScript turns \`w\` into a signed 32-bit number before shifting, and \`>>\` fills from the left with copies of bit 31, so \`0xff010113 >> 20\` is -16. This is the sign extension the RISC-V manual describes, done for free.

**Common wrong attempts.** Using \`w >>> 20\` for the immediate gives 4080 instead of -16: the unsigned shift fills with zeros. And masking the immediate with \`& 0xfff\` after a signed shift throws the sign away again.`,
    wrong: [
      {
        code: `function decodeI(w) {
  return {
    op: w & 0x7f,
    rd: (w >>> 7) & 0x1f,
    f3: (w >>> 12) & 0x7,
    rs1: (w >>> 15) & 0x1f,
    imm: w >>> 20,
  };
}`,
        why: 'The unsigned shift loses the sign: -16 comes back as 4080.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'How many bytes is one instruction in the RISC-V base instruction set?',
    options: [
      { t: '1 byte, like a bytecode opcode', why: 'Bytecode often uses one-byte opcodes; RISC-V base instructions are fixed at 32 bits.' },
      { t: '4 bytes', correct: true, why: 'Every base instruction is 32 bits, so the sumsq listing’s nine instructions are 36 bytes.' },
      { t: 'It depends on how many operands the instruction has', why: 'That is true of some instruction sets, but not of the RISC-V base: every format is 32 bits.' },
    ],
  },
  {
    q: 'In the word for `addi a0, a0, 1`, bits 11 to 7 are `01010`. What do they say?',
    options: [
      { t: 'The constant 10 is added', why: 'The constant is the immediate in bits 31 to 20; here it is 1.' },
      { t: 'The operation is addi', why: 'The opcode (bits 6 to 0) and funct3 say that.' },
      { t: 'The result goes in register x10, called a0', correct: true, why: 'Bits 11 to 7 are rd, the destination register; 01010 is 10.' },
    ],
  },
  {
    q: 'What is `li t0, 5` turned into by the assembler?',
    options: [
      { t: '`addi t0, x0, 5`', correct: true, why: 'x0 always reads 0, so adding 5 to it loads the constant; li is a pseudoinstruction.' },
      { t: 'A special load-immediate instruction in the base set', why: 'There is no such instruction; li is spelled with real ones (addi for small constants, lui and addi for big ones).' },
      { t: '`ld t0, 5`, a load from address 5', why: 'li loads a constant, not a value from memory.' },
    ],
  },
  {
    q: 'In the listing, what does the line `loop:` produce in the machine code?',
    options: [
      { t: 'One instruction that marks the start of the loop', why: 'A label is not an instruction; the processor never sees it.' },
      { t: 'Nothing: it names the address of the next instruction, which jumps can use', correct: true, why: 'The assembler records that loop is offset 8 and puts the right distance into `j loop` and nothing else.' },
      { t: 'A comment', why: 'Comments start with `#`; a label ends with a colon and does matter, because jumps refer to it.' },
    ],
  },
  {
    q: '`add a0, a0, a1` is `33 05 b5 00` and `sub a0, a0, a1` is `33 05 b5 40`. What does that tell you?',
    options: [
      { t: 'add and sub are the same R-type operation, told apart by one bit of funct7', correct: true, why: 'Only the top byte changes, from 00 to 40: bit 30, inside funct7, picks subtraction.' },
      { t: 'The registers are different in the two instructions', why: 'Both use a0, a0 and a1; the register fields (and the bytes holding them) are identical.' },
      { t: 'sub is a pseudoinstruction for add', why: 'sub is a real base instruction with its own funct7; neg, not sub, is the pseudoinstruction.' },
    ],
  },
];
