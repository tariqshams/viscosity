// Chapter 233 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// The rules come from the RISC-V psABI, riscv-cc.adoc (integer calling
// convention); the listings are clang 18.1.3 -O2 --target=riscv64.

export const prompts = {
  'args-where': {
    q: 'Where does RISC-V pass the first eight integer arguments?',
    a: 'In registers a0 to a7 (x10 to x17), in order.',
  },
  'result-where': {
    q: 'Where does a RISC-V function leave an integer result?',
    a: 'In a0 (and a1 as well, if the result needs two registers).',
  },
  'ra-what': {
    q: 'What does `call sq` do with `ra`, and how does `ret` use it?',
    a: '`call` stores the address of the next instruction in ra while jumping to sq; `ret` (jalr x0, 0(ra)) jumps back to that address.',
  },
  'ninth-arg': {
    q: 'Where does the callee find its ninth integer argument?',
    a: 'On the stack, at 0(sp) as sp is on entry; the tenth is at 8(sp), and so on.',
  },
  'abi-what': {
    q: 'What is an **ABI**?',
    a: 'The full set of rules compiled code agrees on to work together: calling convention, type sizes and layouts, how records are passed, stack alignment, object-file format.',
  },
  'abi-beyond-cc': {
    q: 'Name two things an ABI fixes that a calling convention alone does not.',
    a: 'For example: the size and alignment of each type (int 4 bytes, long 8 in LP64) and the object-file format (ELF).',
  },
  'lp64-sizes': {
    q: 'In RISC-V’s LP64 ABI, how big are `int`, `long` and a pointer?',
    a: '4, 8 and 8 bytes.',
  },
  'big-struct': {
    q: 'How is a 24-byte struct argument passed on RV64?',
    a: 'By reference: the caller copies it to memory and passes its address in an argument register.',
  },
  'abi-mismatch': {
    q: 'Two object files were compiled with `-mabi=lp64` and `-mabi=lp64d`. What happens when you link them with ld.lld?',
    a: 'The linker refuses: "cannot link object files with different floating-point ABI".',
  },
};

export const examples = {
  'by-hand': {
    title: 'The convention, played by hand',
    code: `// one register file, shared by both
const r = { a0: 0, ra: '' };
function sq() {
  r.a0 = r.a0 * r.a0; // a0 in, a0 out
  return r.ra;        // ret: go to ra
}
let s = 0;
for (let i = 0; i < 4; i++) {
  r.a0 = i;           // mv a0, i
  r.ra = 'after call';
  const back = sq();  // call sq
  s += r.a0;          // read result
  console.log(i, r.a0, back);
}
console.log('sumsq(4) =', s);`,
  },
};

export const exercises = {
  'assign-args': {
    title: 'Where does each argument go?',
    prompt: `Write \`assignArgs(sizes)\`. \`sizes\` lists the size in bytes of each argument of a call on RV64 (integers, pointers and records of whole 8-byte words only). Return one string per argument, following the psABI's integer rules:

- up to 8 bytes: the next free register \`a0\` ... \`a7\`; when those run out, the next stack slot, written \`sp0\`, \`sp8\`, \`sp16\`, ...;
- 9 to 16 bytes: two places, taken one after the other the same way, joined with \`+\` (\`'a1+a2'\`, or \`'a7+sp0'\` if only one register is left, or \`'sp0+sp8'\`);
- more than 16 bytes: passed by reference, so it takes one place for its address, written with \`&\` in front (\`'&a3'\`).

For example \`assignArgs([8, 16, 24])\` is \`['a0', 'a1+a2', '&a3']\`.`,
    starter: `function assignArgs(sizes) {
  return sizes.map((n, k) => 'a' + k);
}`,
    solution: `function assignArgs(sizes) {
  let reg = 0;
  let stack = 0;
  const next = () => {
    if (reg < 8) return 'a' + reg++;
    const at = 'sp' + stack;
    stack += 8;
    return at;
  };
  return sizes.map((n) => {
    if (n > 16) return '&' + next();
    if (n > 8) {
      const lo = next();
      return lo + '+' + next();
    }
    return next();
  });
}`,
    tests: `test('the example', () => {
  expect(assignArgs([8, 16, 24]))
    .toEqual(['a0', 'a1+a2', '&a3']);
});
test('nine longs: the ninth on the stack', () => {
  const r = assignArgs(Array(9).fill(8));
  expect(r[7]).toBe('a7');
  expect(r[8]).toBe('sp0');
});
test('a pair split between a7 and the stack', () => {
  const r = assignArgs([8, 8, 8, 8, 8, 8, 8, 16]);
  expect(r[7]).toBe('a7+sp0');
});
test('a pair entirely on the stack', () => {
  const r = assignArgs([...Array(8).fill(8), 16, 8]);
  expect(r[8]).toBe('sp0+sp8');
  expect(r[9]).toBe('sp16');
});
test('small sizes still take a whole register', () => {
  expect(assignArgs([1, 4, 8]))
    .toEqual(['a0', 'a1', 'a2']);
});`,
    hints: [
      'Keep two counters as you walk the arguments: the next free argument register, and the next free stack offset.',
      'Write a helper `next()` that hands out one place: `a0` to `a7` first, then `sp0`, `sp8`, ... (each stack slot is 8 bytes on RV64).',
      'Then each argument is `next()` (8 bytes or less), `next() + "+" + next()` (9 to 16), or `"&" + next()` (more than 16, by reference).',
    ],
    walkthrough: `**How to think about it.** The rule looks like three cases, but underneath there is only one resource being handed out: "the next place an 8-byte word can go". Registers \`a0\` to \`a7\` come first; after them, stack slots 8 bytes apart. An argument of up to 8 bytes takes one place, a two-word argument takes two places in a row (which is how "low half in a7, high half on the stack" falls out with no special code), and a big record takes one place for its address.

**The solution, line by line.**

- \`let reg = 0; let stack = 0;\`: the next free argument register number and the next free stack offset.
- \`const next = () => { ... }\`: if a register is left, return \`'a' + reg++\` (the name, then move the counter on). Otherwise return \`'sp' + stack\` and add 8, the size of one RV64 slot.
- \`if (n > 16) return '&' + next();\`: more than two words goes by reference: the caller copies the record somewhere and passes its address, which needs one place like any pointer.
- \`if (n > 8) { const lo = next(); return lo + '+' + next(); }\`: two words take two places, in order; taking \`lo\` first gives the low half the lower register.
- \`return next();\`: everything up to 8 bytes, even a 1-byte \`char\`, takes a whole register (the psABI widens small integers to XLEN bits).

**Common wrong attempts.**

- The starter's \`'a' + k\` uses the argument's position as the register number, which breaks as soon as one argument takes two registers (the 24-byte record would land in \`a2\` rather than \`a3\`) and never reaches the stack.
- Sending a whole pair to the stack when only \`a7\` is left: the psABI says the low half goes in \`a7\` and only the high half on the stack.
- Counting stack slots in 4-byte steps: that is the RV32 slot size.`,
    wrong: [
      {
        code: `function assignArgs(sizes) {
  let reg = 0;
  let stack = 0;
  const next = () => {
    if (reg < 8) return 'a' + reg++;
    const at = 'sp' + stack;
    stack += 8;
    return at;
  };
  return sizes.map((n) => {
    if (n > 8 && reg === 7) {
      reg = 8;
      const lo = next();
      return lo + '+' + next();
    }
    if (n > 16) return '&' + next();
    if (n > 8) {
      const lo = next();
      return lo + '+' + next();
    }
    return next();
  });
}`,
        why: 'It skips a7 and puts a pair that should be split (a7 and sp0) wholly on the stack.',
      },
      {
        code: `function assignArgs(sizes) {
  let reg = 0;
  let stack = 0;
  const next = () => {
    if (reg < 8) return 'a' + reg++;
    const at = 'sp' + stack;
    stack += 4;
    return at;
  };
  return sizes.map((n) => {
    if (n > 16) return '&' + next();
    if (n > 8) {
      const lo = next();
      return lo + '+' + next();
    }
    return next();
  });
}`,
        why: 'Stack slots are 8 bytes on RV64, not 4, so the second stack argument lands at sp4.',
      },
    ],
  },
};

export const quiz = [
  {
    q: '`long f(long a, long b, long c)` is called. In which register is `c`?',
    options: [
      { t: 'a3', why: 'Arguments start at a0, so the third is a2.' },
      { t: 'a2', correct: true, why: 'a0, a1, a2 in order: c is the third argument.' },
      { t: 'On the stack', why: 'Only the ninth and later integer arguments go on the stack.' },
    ],
  },
  {
    q: 'Why must the address to return to be passed in a register at all?',
    options: [
      { t: 'Because a function can be called from many places, and only the caller knows which one this is', correct: true, why: 'call writes the address after itself into ra, so the same sq can return to any caller.' },
      { t: 'Because ret always returns to the first instruction of main', why: 'ret jumps to whatever is in ra, which is different for every call site.' },
      { t: 'It does not: the processor remembers it automatically on a stack', why: 'RISC-V has no hidden return stack in the ISA; the convention uses ra.' },
    ],
  },
  {
    q: 'Which of these is part of the ABI but NOT of the calling convention alone?',
    options: [
      { t: 'The first argument goes in a0', why: 'That is the calling convention itself (which is part of the ABI too).' },
      { t: 'ra holds the return address', why: 'Also part of the calling convention.' },
      { t: 'A long is 8 bytes with 8-byte alignment in LP64', correct: true, why: 'Type sizes and alignment are data layout, a wider part of the ABI.' },
    ],
  },
  {
    q: 'A function returns `struct P { long x, vx; }` on RV64. Where is the result?',
    options: [
      { t: 'In memory, at an address passed by the caller', why: 'Only records bigger than 16 bytes are returned that way.' },
      { t: 'x in a0 and vx in a1', correct: true, why: 'A 16-byte record is returned in a register pair, first 8 bytes in the lower-numbered register.' },
      { t: 'Only x, in a0; vx is lost', why: 'Two registers (a0 and a1) are available for results.' },
    ],
  },
  {
    q: 'Two files compiled for different floating-point ABIs are linked with ld.lld. What happens?',
    options: [
      { t: 'They link, and run correctly', why: 'They disagree about where floating-point values travel, so the linker refuses.' },
      { t: 'They link, but floats are converted automatically', why: 'Nothing converts between ABIs; that is why the linker checks.' },
      { t: 'The link fails: "cannot link object files with different floating-point ABI"', correct: true, why: 'The ELF files record their ABI, and lld refuses to mix them.' },
    ],
  },
];
