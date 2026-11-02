// Chapter 232 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'abi-names': {
    q: 'Which registers do the names `a0`, `t0` and `s0` stand for, and what kind of value does each kind hold?',
    a: '`a0` is x10 (arguments and results), `t0` is x5 (temporary scratch), `s0` is x8 (saved: keeps its value across calls).',
  },
  'load-store-what': {
    q: 'What makes RISC-V a **load-store architecture**?',
    a: 'Only load and store instructions access memory; arithmetic works on registers only.',
  },
  'add-from-memory': {
    q: 'How does RISC-V do `p.x += p.vx` when both fields are in memory?',
    a: 'Load both fields into registers, add the registers, and store the result back: four instructions.',
  },
  'sign-extend': {
    q: 'A 4-byte value in memory is 0xffffffff. What do `lw` and `lwu` put in a 64-bit register?',
    a: '`lw` sign-extends it, giving -1; `lwu` zero-extends it, giving 4294967295.',
  },
  'base-offset': {
    q: 'What address does `ld a0, 16(sp)` read?',
    a: 'The value in `sp` plus 16 (base register plus offset, RISC-V’s only addressing mode).',
  },
  'offset-range': {
    q: 'What range can a load or store offset have, and why?',
    a: '-2048 to 2047: it is a 12-bit signed immediate inside the 32-bit instruction.',
  },
  'stack-grows': {
    q: 'Which way does the RISC-V stack grow, and how does a function claim 32 bytes?',
    a: 'Downwards, towards lower addresses: `addi sp, sp, -32` claims them and `addi sp, sp, 32` releases them.',
  },
  'sp-align': {
    q: 'What alignment must `sp` have in the standard RISC-V ABI?',
    a: 'A multiple of 16 bytes (128 bits) on entry to every function, and it must stay aligned.',
  },
};

export const examples = {
  bytes: {
    title: 'Little-endian bytes, and lw versus lwu',
    code: `const buf = new ArrayBuffer(8);
const m = new DataView(buf);
// like sd: 8 bytes, lowest first
m.setBigInt64(0,
  0x0102030405060708n, true);
console.log(new Uint8Array(buf));
// four bytes of all ones
m.setInt32(0, -1, true);
console.log(m.getInt32(0, true));
console.log(m.getUint32(0, true));`,
  },
};

const MACHINE = `function machine() {
  const x = new Array(32).fill(0);
  x[2] = 64; // sp
  const mem = new DataView(
    new ArrayBuffer(64));
  return { x, mem };
}
`;

export const exercises = {
  'mini-machine': {
    title: 'A machine with memory',
    prompt: `Finish \`step(m, i)\`, which runs one instruction on a machine \`m = { x, mem }\`: \`x\` is an array of 32 registers and \`mem\` is a \`DataView\` over the memory. (This is a 32-bit machine, like RV32, so registers hold 32-bit numbers.) Instructions are objects:

- \`{ op: 'addi', rd, rs1, imm }\` (already done in the starter),
- \`{ op: 'add', rd, rs1, rs2 }\`,
- \`{ op: 'lw', rd, rs1, imm }\`: load the 4 bytes at \`x[rs1] + imm\`, little-endian, signed,
- \`{ op: 'sw', rs2, rs1, imm }\`: store \`x[rs2]\` as 4 bytes at \`x[rs1] + imm\`, little-endian.

Keep the x0 rule: writes to register 0 are ignored. \`machine()\` is provided by the tests: it makes 32 zeroed registers with \`sp\` (register 2) set to 64, and 64 bytes of memory.`,
    starter: `function step(m, i) {
  const x = m.x;
  let v;
  if (i.op === 'addi') {
    v = x[i.rs1] + i.imm;
  }
  // add, lw and sw go here
  if (i.rd !== 0) x[i.rd] = v | 0;
}`,
    solution: `function step(m, i) {
  const x = m.x;
  const ea = x[i.rs1] + i.imm;
  if (i.op === 'sw') {
    m.mem.setInt32(ea, x[i.rs2], true);
    return;
  }
  let v;
  if (i.op === 'addi') {
    v = x[i.rs1] + i.imm;
  } else if (i.op === 'add') {
    v = x[i.rs1] + x[i.rs2];
  } else if (i.op === 'lw') {
    v = m.mem.getInt32(ea, true);
  }
  if (i.rd !== 0) x[i.rd] = v | 0;
}`,
    tests: `${MACHINE}const run = (m, prog) => {
  for (const i of prog) step(m, i);
  return m;
};
const ADDI = (rd, rs1, imm) =>
  ({ op: 'addi', rd, rs1, imm });
const LW = (rd, rs1, imm) =>
  ({ op: 'lw', rd, rs1, imm });
const SW = (rs2, rs1, imm) =>
  ({ op: 'sw', rs2, rs1, imm });
test('add two registers', () => {
  const m = run(machine(), [ADDI(10, 0, 5),
    ADDI(11, 0, 6),
    { op: 'add', rd: 12, rs1: 10, rs2: 11 }]);
  expect(m.x[12]).toBe(11);
});
test('push, then load back', () => {
  const m = run(machine(), [
    ADDI(10, 0, 1234),
    ADDI(2, 2, -16),
    SW(10, 2, 12),
    LW(11, 2, 12)]);
  expect(m.x[2]).toBe(48);
  expect(m.x[11]).toBe(1234);
  expect(m.mem.getInt32(60, true)).toBe(1234);
});
test('stores are little-endian', () => {
  const m = machine();
  m.x[10] = 0x01020304;
  step(m, SW(10, 2, -4));
  expect(m.mem.getUint8(60)).toBe(4);
  expect(m.mem.getUint8(63)).toBe(1);
});
test('lw sign-extends', () => {
  const m = run(machine(), [
    ADDI(10, 0, -1), SW(10, 0, 8),
    LW(11, 0, 8)]);
  expect(m.x[11]).toBe(-1);
});
test('loads into x0 are thrown away', () => {
  const m = run(machine(), [
    ADDI(10, 0, 9), SW(10, 0, 0),
    LW(0, 0, 0)]);
  expect(m.x[0]).toBe(0);
});`,
    hints: [
      'Both lw and sw use the same effective address: the base register plus the offset, `x[i.rs1] + i.imm`.',
      'A `DataView` has `getInt32(addr, true)` and `setInt32(addr, value, true)`; the `true` means little-endian.',
      'A store writes no register, so handle `sw` first and `return` before the final "write rd" line (an sw object has no `rd`).',
    ],
    walkthrough: `**How to think about it.** Every instruction here is "work out a value, then put it somewhere". For addi, add and lw the somewhere is register \`rd\`; for sw it is memory. Loads and stores share the one RISC-V addressing mode, so compute the effective address once.

**The solution, line by line.**

- \`const ea = x[i.rs1] + i.imm;\`: base plus offset, the effective address of the chapter's Formal box. (For addi and add it is computed and not used, which is harmless.)
- \`if (i.op === 'sw') { m.mem.setInt32(ea, x[i.rs2], true); return; }\`: a store copies register \`rs2\` into four bytes of memory, lowest byte first because of \`true\`. It must \`return\` before the last line, because a store has no destination register.
- \`v = x[i.rs1] + i.imm\` and \`v = x[i.rs1] + x[i.rs2]\`: the two arithmetic instructions, register-only, as in a load-store machine.
- \`v = m.mem.getInt32(ea, true)\`: a load. \`getInt32\` reads the four bytes as a *signed* number, which is exactly lw's sign extension: four bytes of 0xff come back as -1.
- \`if (i.rd !== 0) x[i.rd] = v | 0;\`: the x0 rule, and \`| 0\` keeps the register a 32-bit integer, like RV32.

In the "push, then load back" test, \`addi sp, sp, -16\` moves sp from 64 to 48, \`sw a0, 12(sp)\` writes 1234 at address 60, and \`lw a1, 12(sp)\` reads it back: the same frame shape as the chapter's StackSteps diagram.

**Common wrong attempts.**

- Forgetting the \`true\`: DataView defaults to big-endian, so the store test finds 1 at address 60 instead of 4.
- Forgetting the offset (using \`x[i.rs1]\` as the address): every \`12(sp)\` becomes \`0(sp)\`, and the value lands in the wrong slot.
- Falling through to the last line for sw: \`i.rd\` is \`undefined\`, and \`x[undefined] = ...\` quietly adds junk to the array; worse, a real machine has no such slot.`,
    wrong: [
      {
        code: `function step(m, i) {
  const x = m.x;
  const ea = x[i.rs1] + i.imm;
  if (i.op === 'sw') {
    m.mem.setInt32(ea, x[i.rs2]);
    return;
  }
  let v;
  if (i.op === 'addi') {
    v = x[i.rs1] + i.imm;
  } else if (i.op === 'add') {
    v = x[i.rs1] + x[i.rs2];
  } else if (i.op === 'lw') {
    v = m.mem.getInt32(ea);
  }
  if (i.rd !== 0) x[i.rd] = v | 0;
}`,
        why: 'Without the `true` flag DataView is big-endian, so the bytes land in the wrong order.',
      },
      {
        code: `function step(m, i) {
  const x = m.x;
  const ea = x[i.rs1];
  if (i.op === 'sw') {
    m.mem.setInt32(ea, x[i.rs2], true);
    return;
  }
  let v;
  if (i.op === 'addi') {
    v = x[i.rs1] + i.imm;
  } else if (i.op === 'add') {
    v = x[i.rs1] + x[i.rs2];
  } else if (i.op === 'lw') {
    v = m.mem.getInt32(ea, true);
  }
  if (i.rd !== 0) x[i.rd] = v | 0;
}`,
        why: 'The offset is ignored, so `12(sp)` reads and writes at `sp` itself.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which instruction is NOT allowed on RISC-V?',
    options: [
      { t: '`ld t0, 8(a0)`', why: 'A load from base plus offset: the normal way to read memory.' },
      { t: '`add a0, a0, 8(a1)`', correct: true, why: 'add takes registers only; llvm-mc says "invalid operand for instruction". Load into a register first.' },
      { t: '`sd t0, -16(sp)`', why: 'Negative offsets are fine: the 12-bit offset is signed.' },
    ],
  },
  {
    q: 'A function needs 24 bytes of stack. What should it subtract from `sp`?',
    options: [
      { t: '24', why: 'sp must stay a multiple of 16, and 24 would break that.' },
      { t: '32', correct: true, why: 'Round up to the next multiple of 16; the extra 8 bytes are padding.' },
      { t: 'Nothing: it should add 24, because stacks grow upwards', why: 'The RISC-V stack grows downwards, towards lower addresses.' },
    ],
  },
  {
    q: 'Why does `sumsq` compiled with `-O0` contain so many `sd` and `ld` instructions, when the `-O2` version has none?',
    options: [
      { t: 'Without optimisation every variable lives in a stack slot, loaded and stored around each use', correct: true, why: 'The unoptimised compiler gives n, s and i slots at -24, -32 and -40 from s0; the optimiser keeps them in registers.' },
      { t: 'RISC-V requires all variables to be in memory', why: 'The -O2 version keeps everything in registers, which is allowed and faster.' },
      { t: '-O0 uses a different instruction set', why: 'Both use RV64IM; only the choices differ.' },
    ],
  },
  {
    q: 'What does `lui a0, %hi(g)` followed by `ld a0, %lo(g)(a0)` do?',
    options: [
      { t: 'Loads the address of g into a0', why: 'The second instruction is a load, so it reads the value stored at g.' },
      { t: 'Calls a function named g', why: 'Calls use jal/jalr (or call); these are a lui and a load.' },
      { t: 'Loads the value of the global g, building its address from an upper part and an offset', correct: true, why: 'lui supplies the upper 20 bits of the address, and the load’s 12-bit offset the rest.' },
    ],
  },
  {
    q: 'Which RISC-V register is the stack pointer?',
    options: [
      { t: 'x0', why: 'x0 always reads zero.' },
      { t: 'x2', correct: true, why: 'By the calling convention, x2 is sp.' },
      { t: 'x10', why: 'x10 is a0, the first argument and result register.' },
    ],
  },
];
