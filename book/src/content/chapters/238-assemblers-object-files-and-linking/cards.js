// Chapter 238 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'asm-what': {
    q: 'What four jobs does an **assembler** do besides encoding instructions one by one?',
    a: 'It expands pseudoinstructions, follows directives, resolves labels, and records what it cannot resolve as relocations.',
  },
  'forward-ref': {
    q: 'Why can\'t a one-pass assembler encode `blez a1, done` when `done:` comes later?',
    a: 'A branch stores the distance to its target, and the target\'s address is not known until the assembler reaches the label.',
  },
  'pseudo-size': {
    q: 'Why must pass 1 know the size of each line, not just count the lines?',
    a: 'Some pseudoinstructions expand to more than one instruction (`call` is auipc plus jalr, 8 bytes), and every later label\'s address depends on it.',
  },
  'fixup-what': {
    q: 'What is a **fixup** in LLVM\'s assembler?',
    a: 'A note of a place it could not finish encoding (such as a branch to a later label), patched once the value is known.',
  },
  'obj-what': {
    q: 'What does an **object file** contain?',
    a: 'Code and data in named sections, a symbol table of what it defines and uses, and relocations for the holes it could not fill.',
  },
  'und-symbol': {
    q: 'In `llvm-readelf -s main.o`, what does `UND` next to `sumsq` mean?',
    a: 'sumsq is used in this file but not defined in it; some other object file must define it.',
  },
  'reloc-what': {
    q: 'What does a **relocation** entry record?',
    a: 'An offset (where to patch), a type (which bits and which formula) and a symbol with an addend (what value to start from).',
  },
  'hi20-round': {
    q: 'Why does R_RISCV_HI20 compute `(S + A + 0x800) >> 12` rather than `(S + A) >> 12`?',
    a: 'The low 12 bits are added back as a signed number; when they are 0x800 or more they count as negative, so the high part must be one larger to make up for it.',
  },
};

export const examples = {
  patch: {
    title: 'The values the linker will write',
    code: `const hi = (v) => (v + 0x800) >> 12;
const lo = (v) =>
  ((v & 0xfff) << 20) >> 20;
const hex = (n) =>
  (n < 0 ? '-0x' : '0x') +
  Math.abs(n).toString(16);

const table = 0x12198;
const sumsq = 0x11170;
const P = 0x11164; // the auipc

console.log('lui  a0,', hex(hi(table)));
console.log('addi a0,', hex(lo(table)));
const d = sumsq - P;
console.log('auipc ra,', hex(hi(d)));
console.log('jalr  ra,', hex(lo(d)));`,
  },
};

const jumps = `const JUMPS = ['beq', 'bne', 'blez',
  'bnez', 'j', 'jal', 'call'];
const size = (op) =>
  (op === 'call' ? 8 : 4);
`;

export const exercises = {
  twopass: {
    title: 'A two-pass label resolver',
    prompt:
      'Write `assemble(lines)`. Each line is a string: a label such as `\'loop:\'`, or an instruction such as `\'bnez a1, loop\'`. Instructions take `size(op)` bytes (8 for `call`, 4 otherwise), starting at address 0; labels take none. Return `{ labels, fixes, relocs }`: `labels` maps each label name to its address; for every instruction whose operation is in `JUMPS`, its last operand names a target, and if that label is defined in this file you push `[address, label - address]` onto `fixes`, otherwise `[address, name]` onto `relocs` (a symbol from another file). Forward references must work, so you need two passes.',
    starter: jumps + `
function assemble(lines) {
  const labels = {};
  const fixes = [];
  const relocs = [];
  // your code here
  return { labels, fixes, relocs };
}`,
    solution: jumps + `
function assemble(lines) {
  const labels = {};
  let pc = 0;
  for (const l of lines) {
    if (l.endsWith(':')) {
      labels[l.slice(0, -1)] = pc;
    } else {
      pc += size(l.split(' ')[0]);
    }
  }
  const fixes = [];
  const relocs = [];
  pc = 0;
  for (const l of lines) {
    if (l.endsWith(':')) continue;
    const parts = l.split(/[\\s,]+/);
    const op = parts[0];
    if (JUMPS.includes(op)) {
      const name = parts.at(-1);
      if (name in labels) {
        const off = labels[name] - pc;
        fixes.push([pc, off]);
      } else {
        relocs.push([pc, name]);
      }
    }
    pc += size(op);
  }
  return { labels, fixes, relocs };
}`,
    tests: `const loop = ['sumsq:', 'li a2, 0',
  'blez a1, done', 'loop:', 'ld a3, 0(a0)',
  'mul a3, a3, a3', 'add a2, a2, a3',
  'addi a0, a0, 8', 'addi a1, a1, -1',
  'bnez a1, loop', 'done:', 'mv a0, a2',
  'ret'];
test('labels get their addresses', () => {
  expect(assemble(loop).labels).toEqual(
    { sumsq: 0, loop: 8, done: 32 });
});
test('forward and backward branches', () => {
  expect(assemble(loop).fixes)
    .toEqual([[4, 28], [28, -20]]);
  expect(assemble(loop).relocs).toEqual([]);
});
const main = ['_start:', 'li a1, 4',
  'call sumsq', 'stop:', 'j stop'];
test('call is 8 bytes; sumsq is a reloc', () => {
  const r = assemble(main);
  expect(r.labels).toEqual(
    { _start: 0, stop: 12 });
  expect(r.relocs).toEqual([[4, 'sumsq']]);
  expect(r.fixes).toEqual([[12, 0]]);
});`,
    hints: [
      'Do it in two loops over the lines. The first only needs a running address `pc`: a label records `pc`, an instruction adds its size.',
      'In the second loop, start `pc` at 0 again, skip labels, and split each instruction into words with `l.split(/[\\s,]+/)`. The first word is the operation; for a jump, the last word is the target name.',
      'If the target is in `labels` (`name in labels`), push `[pc, labels[name] - pc]` onto `fixes`; otherwise push `[pc, name]` onto `relocs`. Either way, add `size(op)` to `pc` at the end of the loop body.',
    ],
    walkthrough: `**How to think about it.** A branch needs the address of a label that may come later, so we cannot finish any line until we know every label. The way round it is the one in the chapter: walk the lines once doing nothing but arithmetic on addresses, writing down where each label falls; then walk them again, and now every local target is a lookup. Anything still not found after pass 1 is not in this file at all, so the assembler cannot fill it: that becomes a relocation for the linker. The only subtlety is size: \`call\` expands to two instructions, so it moves the address by 8, and getting that wrong shifts every label after it.

**The solution, line by line.**

- \`const labels = {};\` and \`let pc = 0;\` start pass 1 at address 0.
- \`if (l.endsWith(':')) { labels[l.slice(0, -1)] = pc; }\` records a label (without its colon) at the current address; a label takes no space, so \`pc\` does not move.
- \`else { pc += size(l.split(' ')[0]); }\` moves past an instruction: 8 bytes for \`call\`, 4 for the rest.
- \`pc = 0;\` starts pass 2 at the top again, with \`fixes\` and \`relocs\` empty.
- \`if (l.endsWith(':')) continue;\` skips labels: they produce no bytes.
- \`const parts = l.split(/[\\s,]+/);\` cuts \`'bnez a1, loop'\` into \`['bnez', 'a1', 'loop']\`, splitting on spaces and commas.
- \`if (JUMPS.includes(op)) {\` only branches, jumps and calls name a target.
- \`const name = parts.at(-1);\` takes the target, the last operand.
- \`if (name in labels) { const off = labels[name] - pc; fixes.push([pc, off]); }\` a local target: the distance from here to there, negative for a backward jump. For \`blez a1, done\` at 4 that is 32 − 4 = 28.
- \`else { relocs.push([pc, name]); }\` a target in another file: leave a note for the linker.
- \`pc += size(op);\` moves on, using the same sizes as pass 1, so the two passes agree on every address.

On \`main\`: \`li\` is at 0, \`call\` at 4 (and takes 8 bytes), so \`stop\` is at 12, and \`j stop\` at 12 jumps by 0, to itself; \`sumsq\` is not a label here, so it becomes the relocation \`[4, 'sumsq']\`.

**Common wrong attempts.**

- One pass, recording labels as they are met. A backward branch works, but \`blez a1, done\` is reached before \`done:\`, so it is wrongly treated as a symbol from another file and ends up in \`relocs\`.
- Counting every line as 4 bytes. Then \`call\` takes 4, \`stop\` lands at 8 instead of 12, and every address after a call is wrong, which is the bug that makes jumps land in the middle of the wrong instruction.`,
    wrong: [
      {
        code: jumps + `
function assemble(lines) {
  const labels = {};
  const fixes = [];
  const relocs = [];
  let pc = 0;
  for (const l of lines) {
    if (l.endsWith(':')) {
      labels[l.slice(0, -1)] = pc;
      continue;
    }
    const parts = l.split(/[\\s,]+/);
    const name = parts.at(-1);
    if (JUMPS.includes(parts[0])) {
      if (name in labels) {
        const off = labels[name] - pc;
        fixes.push([pc, off]);
      } else relocs.push([pc, name]);
    }
    pc += size(parts[0]);
  }
  return { labels, fixes, relocs };
}`,
        why: 'One pass: the forward branch to `done` is met before the label, so it lands in `relocs` instead of `fixes`.',
      },
      {
        code: jumps + `
function assemble(lines) {
  const labels = {};
  let pc = 0;
  for (const l of lines) {
    if (l.endsWith(':')) {
      labels[l.slice(0, -1)] = pc;
    } else pc += 4;
  }
  const fixes = [];
  const relocs = [];
  pc = 0;
  for (const l of lines) {
    if (l.endsWith(':')) continue;
    const parts = l.split(/[\\s,]+/);
    const name = parts.at(-1);
    if (JUMPS.includes(parts[0])) {
      if (name in labels) {
        const off = labels[name] - pc;
        fixes.push([pc, off]);
      } else relocs.push([pc, name]);
    }
    pc += 4;
  }
  return { labels, fixes, relocs };
}`,
        why: 'Every line counts as 4 bytes, but `call` is 8, so `stop` is placed at 8 instead of 12.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'An assembler meets `beq a0, a1, out` on line 3, and `out:` on line 9. What is the problem, and the usual fix?',
    options: [
      { t: 'The branch is too far; the fix is to use a jump', why: 'Six lines is well within a branch\'s reach; the problem is that the address of out is not yet known.' },
      { t: 'out is unknown when line 3 is reached; the fix is a first pass that records label addresses, or a fixup patched later', correct: true, why: 'A forward reference is the reason for two passes (or fixups, which amount to the same thing).' },
      { t: 'There is no problem: labels are resolved by the processor', why: 'The processor only sees a number, the offset; somebody has to work it out before then.' },
    ],
  },
  {
    q: 'In an object file\'s symbol table, `sumsq` is listed as GLOBAL with section `UND`. What does that tell the linker?',
    options: [
      { t: 'sumsq is defined in this file and may be used by others', why: 'A defined symbol has a real section index, such as 2 for .text.' },
      { t: 'sumsq is a local label that can be ignored', why: 'It is global, and undefined symbols are exactly what the linker must resolve.' },
      { t: 'This file uses sumsq but does not define it; another file must', correct: true, why: 'UND (undefined) plus GLOBAL means a reference waiting for a definition elsewhere.' },
    ],
  },
  {
    q: 'Which RISC-V relocation fills the auipc and jalr pair that `call sumsq` expands to?',
    options: [
      { t: 'R_RISCV_CALL_PLT, computed as S + A − P', correct: true, why: 'It is a PC-relative call: the distance from the call (P) to the function (S), plus the addend.' },
      { t: 'R_RISCV_HI20, computed as (S + A + 0x800) >> 12', why: 'HI20 is for an absolute address in a lui, not a PC-relative call.' },
      { t: 'R_RISCV_BRANCH', why: 'BRANCH is for conditional branches, which reach only about 4 KiB.' },
    ],
  },
  {
    q: 'The linker puts `table` at 0x12898. What do HI20 and LO12 give, and why?',
    options: [
      { t: 'hi = 0x12, lo = 0x898', why: 'addi reads 0x898 as a signed 12-bit number, which is negative (−0x768), so lui 0x12 plus it would be too small.' },
      { t: 'hi = 0x13, lo = −0x768', correct: true, why: 'Adding 0x800 before shifting rounds the high part up whenever the low part counts as negative: 0x13000 − 0x768 = 0x12898.' },
      { t: 'hi = 0x12898, lo = 0', why: 'lui holds only 20 bits, shifted up by 12; the low 12 bits must come from the addi.' },
    ],
  },
  {
    q: 'Which statement about ELF is true?',
    options: [
      { t: 'An object file can be run directly, without linking', why: 'A relocatable file still has holes (relocations) and undefined symbols; it is input to the linker.' },
      { t: 'ELF is only used for RISC-V', why: 'It is the generic System V format; the RISC-V psABI only adds RISC-V-specific details such as relocation types.' },
      { t: 'The same format describes relocatable files, executables and shared objects', correct: true, why: 'The gABI defines all three, told apart by the type in the ELF header.' },
    ],
  },
];
