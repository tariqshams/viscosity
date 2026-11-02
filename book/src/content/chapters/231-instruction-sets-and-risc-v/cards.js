// Chapter 230-b cards (staged split of chapter 230): recall prompts,
// examples, exercises and quiz. Keys are stable ids.
// The lui/addi pairs were checked with llvm-mc 18.1.3 (-triple=riscv32).

export const prompts = {
  'isa-what': {
    q: 'What does an **ISA** (instruction set architecture) specify?',
    a: 'The registers a program can see, the instructions, their encodings, and exactly what each does to registers and memory.',
  },
  'isa-not-speed': {
    q: 'Two chips implement the same ISA. Must they run a program equally fast?',
    a: 'No. The ISA fixes what each instruction does, not how or how fast a chip does it.',
  },
  'rv64im': {
    q: 'What do the parts of the name RV64IM mean?',
    a: 'RISC-V, 64-bit registers (XLEN = 64), the base Integer set, plus the M extension for multiply and divide.',
  },
  'base-small': {
    q: 'Roughly how many unique instructions does the RV32I base have?',
    a: '40, by the manual’s count: arithmetic, logic, shifts, compares, lui/auipc, branches, jumps, loads, stores and a few system ones.',
  },
  'x0-what': {
    q: 'What is special about RISC-V register `x0`?',
    a: 'It always reads as 0 and writes to it are discarded, so `li t0, 5` can be `addi t0, x0, 5`.',
  },
  'm-separate': {
    q: 'Why is multiplication an extension (M) rather than part of the base set?',
    a: 'To keep the smallest chips simple: a tiny core can leave out the multiplier, and software can do without it.',
  },
  'lui-what': {
    q: 'What does `lui a0, 0x12345` put in `a0` (on RV32)?',
    a: '0x12345000: the 20-bit immediate in bits 31 to 12, and zeros in the low 12 bits.',
  },
  'round-up': {
    q: 'Why is `li a0, 0x12345fff` built as `lui a0, 0x12346` and not `lui a0, 0x12345`?',
    a: 'addi sign-extends its 12 bits, so 0xfff means -1; the upper part must be one bigger to make up the difference.',
  },
};

export const examples = {
  split: {
    title: 'Splitting a constant for lui and addi',
    code: `function split(v) {
  const lo = (v << 20) >> 20;
  const hi =
    ((v - lo) >>> 12) & 0xfffff;
  return { hi: hi.toString(16), lo };
}
console.log(split(0x12345678));
console.log(split(0x12345fff));
console.log(split(0x00000800));`,
  },
};

export const exercises = {
  'li-parts': {
    title: 'Split a constant into lui and addi',
    prompt: `Write \`liParts(v)\` for a 32-bit integer \`v\`. Return \`{ hi, lo }\` where \`lo\` is a signed 12-bit number (-2048 to 2047) and \`hi\` is a 20-bit number (0 to 0xfffff), such that \`lui rd, hi\` followed by \`addi rd, rd, lo\` leaves \`v\` in a 32-bit register.

For example \`liParts(0x12345678)\` is \`{ hi: 0x12345, lo: 1656 }\` and \`liParts(0x12345fff)\` is \`{ hi: 0x12346, lo: -1 }\`, exactly what \`llvm-mc -triple=riscv32\` produces.`,
    starter: `function liParts(v) {
  const hi = v >>> 12;
  const lo = v & 0xfff;
  return { hi, lo };
}`,
    solution: `function liParts(v) {
  const lo = (v << 20) >> 20;
  const hi =
    ((v - lo) >>> 12) & 0xfffff;
  return { hi, lo };
}`,
    tests: `const back = ({ hi, lo }) => ((hi << 12) + lo) | 0;
test('0x12345678: no round up', () => {
  expect(liParts(0x12345678))
    .toEqual({ hi: 0x12345, lo: 1656 });
});
test('0x12345fff: round up', () => {
  expect(liParts(0x12345fff))
    .toEqual({ hi: 0x12346, lo: -1 });
});
test('0x800 splits as 1 and -2048', () => {
  expect(liParts(0x800))
    .toEqual({ hi: 1, lo: -2048 });
});
test('hi is a 20-bit field', () => {
  expect(liParts(0xabcdef12))
    .toEqual({ hi: 0xabcdf, lo: -238 });
  expect(liParts(-4096).hi).toBe(0xfffff);
});
test('lo always fits in 12 signed bits', () => {
  for (const v of [0x7ff, 0x800, 0xfff, 0xabcdef12]) {
    const { lo } = liParts(v);
    expect(lo >= -2048 && lo <= 2047).toBe(true);
  }
});
test('the pair rebuilds the constant', () => {
  for (const v of [5, -5, 0x12345fff, -1, 0x7ffff800]) {
    expect(back(liParts(v))).toBe(v | 0);
  }
});`,
    hints: [
      'The low part is the bottom 12 bits, but read the way addi reads them: as a signed number.',
      'To sign-extend the low 12 bits in JavaScript, shift them to the top of a 32-bit number and back down with the sign-copying shift: `(v << 20) >> 20`.',
      'Whatever is left, `v - lo`, has zeros in its low 12 bits; shift it down by 12 with `>>>` and keep 20 bits with `& 0xfffff`.',
    ],
    walkthrough: `**How to think about it.** Start from what the two instructions do. \`lui rd, hi\` makes \`hi × 4096\`; \`addi rd, rd, lo\` adds \`lo\`, *sign-extended* from 12 bits. So we need \`hi × 4096 + lo = v\` with \`lo\` between -2048 and 2047. Choose \`lo\` first, as the bottom 12 bits read the way addi will read them; then \`hi\` is forced.

**The solution, line by line.**

- \`const lo = (v << 20) >> 20;\`: \`v << 20\` moves the bottom 12 bits to the top of a 32-bit number (bits 31 to 20), and \`>> 20\` brings them back down while copying bit 31 into the vacated places. That is sign extension: for 0x678 we get 1656; for 0xfff, whose top bit is set, we get -1; for 0x800 we get -2048.
- \`const hi = ((v - lo) >>> 12) & 0xfffff;\` (split over two lines): subtracting \`lo\` leaves a number whose low 12 bits are zero (for 0x12345fff, subtracting -1 gives 0x12346000, which is where the "round up" comes from). \`>>> 12\` shifts it down without sign, and \`& 0xfffff\` keeps the 20 bits lui can hold, so that \`v = -4096\` gives \`hi = 0xfffff\` rather than -1.
- \`return { hi, lo };\`.

**Common wrong attempts.**

- The starter's \`v >>> 12\` and \`v & 0xfff\`: correct whenever bit 11 of \`v\` is 0, wrong otherwise, because addi would read 0xfff as -1 and the result would be 4096 too small. This is the classic bug in hand-written code generators.
- Rounding the upper part up with \`v + 0x800\` but forgetting the 20-bit mask: for negative constants \`hi\` comes out negative.`,
    wrong: [
      {
        code: `function liParts(v) {
  const lo = (v << 20) >> 20;
  const hi = (v - lo) >> 12;
  return { hi, lo };
}`,
        why: 'The signed shift keeps hi negative for negative constants (and for 0xabcdef12), so it is not a 20-bit field.',
      },
    ],
  },
  'x0-sim': {
    optional: true,
    title: 'A three-instruction machine with x0',
    prompt: `Write \`run(prog)\`: it starts with 32 registers set to 0, runs each instruction of \`prog\` in order, and returns the registers. Instructions are objects: \`{ op: 'addi', rd, rs1, imm }\`, \`{ op: 'add', rd, rs1, rs2 }\` and \`{ op: 'sub', rd, rs1, rs2 }\`. Keep RISC-V's rule: register 0 always reads 0, and writes to it are ignored. (Plain JavaScript numbers are fine; ignore overflow.)`,
    starter: `function run(prog) {
  const x = new Array(32).fill(0);
  for (const i of prog) {
    // your code here
  }
  return x;
}`,
    solution: `function run(prog) {
  const x = new Array(32).fill(0);
  for (const i of prog) {
    let v;
    if (i.op === 'addi') {
      v = x[i.rs1] + i.imm;
    } else if (i.op === 'add') {
      v = x[i.rs1] + x[i.rs2];
    } else if (i.op === 'sub') {
      v = x[i.rs1] - x[i.rs2];
    }
    if (i.rd !== 0) x[i.rd] = v;
  }
  return x;
}`,
    tests: `const A = (rd, rs1, imm) =>
  ({ op: 'addi', rd, rs1, imm });
const R = (op, rd, rs1, rs2) =>
  ({ op, rd, rs1, rs2 });
test('li a0, 5 is addi a0, x0, 5', () => {
  expect(run([A(10, 0, 5)])[10]).toBe(5);
});
test('add and sub', () => {
  const x = run([A(10, 0, 7), A(11, 0, 3),
    R('sub', 12, 10, 11), R('add', 13, 10, 11)]);
  expect(x[12]).toBe(4);
  expect(x[13]).toBe(10);
});
test('writes to x0 are thrown away', () => {
  const x = run([A(0, 0, 9), A(5, 0, 1)]);
  expect(x[0]).toBe(0);
  expect(x[5]).toBe(1);
});
test('mv is addi rd, rs, 0', () => {
  expect(run([A(5, 0, 4), A(10, 5, 0)])[10]).toBe(4);
});`,
    hints: [
      'Work out the value first, from the registers the instruction reads, and only then decide whether to store it.',
      'addi reads `x[i.rs1]` and adds `i.imm`; add and sub read `x[i.rs1]` and `x[i.rs2]`.',
      'The x0 rule is one line: store only `if (i.rd !== 0)`. Because x[0] is never written, every read of register 0 sees 0.',
    ],
    walkthrough: `**How to think about it.** Each instruction does two things: compute a value from registers (and maybe an immediate), then write it to \`rd\`. The x0 rule is about the write, and if writes to register 0 never happen, reads of it give 0 for free.

**The solution, line by line.** \`const x = new Array(32).fill(0)\` makes the register file. For each instruction, \`let v\` holds the result: \`x[i.rs1] + i.imm\` for addi, \`x[i.rs1] + x[i.rs2]\` for add and \`x[i.rs1] - x[i.rs2]\` for sub. \`if (i.rd !== 0) x[i.rd] = v;\` is the whole of RISC-V's x0 rule. The tests check that \`addi a0, x0, 5\` loads 5 (that is \`li\`), that \`addi x0, x0, 9\` changes nothing, and that \`addi a0, t0, 0\` copies (that is \`mv\`).

**Common wrong attempts.** Writing \`x[i.rd] = v\` unconditionally passes most tests and fails the x0 one: after \`addi x0, x0, 9\`, every later "zero" would be 9.`,
    wrong: [
      {
        code: `function run(prog) {
  const x = new Array(32).fill(0);
  for (const i of prog) {
    if (i.op === 'addi') {
      x[i.rd] = x[i.rs1] + i.imm;
    } else if (i.op === 'add') {
      x[i.rd] = x[i.rs1] + x[i.rs2];
    } else {
      x[i.rd] = x[i.rs1] - x[i.rs2];
    }
  }
  return x;
}`,
        why: 'It writes to register 0, so x0 stops being zero.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Two chips implement RV64IM. Which must be the same on both?',
    options: [
      { t: 'How many instructions they run per second', why: 'Speed is left to each implementation; the ISA says nothing about it.' },
      { t: 'What each instruction does to the registers and memory', correct: true, why: 'That is the contract, so the same machine code gives the same results on both.' },
      { t: 'The size of their caches', why: 'Caches are an implementation choice, invisible to the ISA.' },
    ],
  },
  {
    q: 'Assembling `mul t2, t1, t1` for plain RV64I fails. Why?',
    options: [
      { t: 'Multiplication is in the M extension, not the base set', correct: true, why: 'The base has no multiply; llvm-mc says the instruction requires M (or Zmmul).' },
      { t: 'mul needs three different registers', why: 'Repeating a register is fine; `mul t2, t1, t1` squares t1.' },
      { t: 't2 is not a real register', why: 't2 is the agreed name for x7.' },
    ],
  },
  {
    q: 'Which of these is NOT a real RV32I instruction?',
    options: [
      { t: '`slt`', why: 'slt (set if less than) is in the base: it writes 1 or 0.' },
      { t: '`lui`', why: 'lui is in the base: it loads a 20-bit upper immediate.' },
      { t: '`mv`', correct: true, why: 'mv is a pseudoinstruction for `addi rd, rs, 0`; the base needs no copy instruction because of x0 and addi.' },
    ],
  },
  {
    q: 'What does `li a0, 100` become?',
    options: [
      { t: '`lui a0, 100`', why: 'That would put 100 in the upper 20 bits, making 409600.' },
      { t: '`lui` followed by `addi`', why: 'Only needed for constants outside -2048 to 2047.' },
      { t: '`addi a0, x0, 100`', correct: true, why: '100 fits in 12 signed bits, so one addi from the zero register is enough.' },
    ],
  },
  {
    q: 'Which constant needs its lui part rounded up by one?',
    options: [
      { t: '0x00012345', why: 'Its low 12 bits are 0x345, whose top bit is 0, so addi reads it as positive.' },
      { t: '0x00012800', correct: true, why: 'The low 12 bits are 0x800, which addi reads as -2048, so hi must be 0x13, not 0x12.' },
      { t: '0x00012000', why: 'The low part is 0; lui alone does it.' },
    ],
  },
];
