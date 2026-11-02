// Cards for "Linkers and loaders": recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'link-three': {
    q: 'What three things does a static linker do, in order?',
    a: 'Resolve every symbol, lay out the sections at final addresses, then apply every relocation.',
  },
  'undef-error': {
    q: 'Linking an executable, when does ld.lld report "undefined symbol: sumsq"?',
    a: 'When some file uses the global sumsq and no input file defines it.',
  },
  'dup-error': {
    q: 'When does lld report "duplicate symbol: sumsq"?',
    a: 'When two input files both define a global (non-weak) symbol called sumsq.',
  },
  'locals-ok': {
    q: 'Two object files each have a label called `loop`. Is that a duplicate symbol?',
    a: 'No: labels like that are local symbols, private to their own file, so they never clash.',
  },
  'archive-pull': {
    q: 'What does a traditional Unix linker take from a static library (`.a` file)?',
    a: 'Only the member object files that define a symbol still undefined at that point.',
  },
  'loader-what': {
    q: 'What does a **loader** do with a statically linked ELF executable?',
    a: 'Maps each LOAD segment into memory at its address with its permissions, zero-fills what the file does not hold, sets up the stack and jumps to the entry point.',
  },
  'entry-point': {
    q: 'What is an executable\'s **entry point**?',
    a: 'The address of the first instruction to run, recorded in the ELF header (often the address of `_start`).',
  },
  'memsz-filesz': {
    q: 'An ELF LOAD segment has FileSiz 0x20 and MemSiz 0x1020. What is in the extra 0x1000 bytes once it is loaded?',
    a: 'Zeros: the ELF standard says the bytes beyond the file\'s part hold 0. It is the .bss, which takes no space in the file.',
  },
  'perm-why': {
    q: 'In a typical ELF executable, why does the code segment get `R E` and the data segment `RW`?',
    a: 'Code needs to be read and run but not changed; data needs to be read and written but never run.',
  },
};

export const examples = {
  header: {
    title: 'Reading an ELF header',
    code: `// the first 20 bytes of prog
const b = [0x7f, 0x45, 0x4c, 0x46, 2, 1,
  1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  2, 0, 0xf3, 0];
const elf = String.fromCharCode(
  b[1], b[2], b[3]);
console.log(b[0] === 0x7f, elf);
const bits = b[4] === 2 ? 64 : 32;
console.log(bits + '-bit');
const le = b[5] === 1;
console.log(le ? 'little' : 'big');
const type = b[16] | (b[17] << 8);
console.log(['NONE', 'REL', 'EXEC',
  'DYN'][type]);
const mach = b[18] | (b[19] << 8);
console.log(mach, mach === 243);`,
  },
};

export const exercises = {
  link: {
    title: 'Resolve and lay out',
    prompt: 'Write `link(files, base)`. Each file is `{ size, defs, uses }`: its size in bytes, an object mapping each global symbol it defines to its offset inside the file, and a list of global symbols it uses. Place the files one after another starting at address `base`, and return an object mapping every defined symbol to its final address. If a symbol is defined twice, call `fail(\'duplicate\', name)`; if a symbol is used but defined nowhere, call `fail(\'undefined\', name)` (`fail` throws, with lld\'s wording). A file may use a symbol that a **later** file defines.',
    starter: `function fail(kind, x) {
  const m = kind + ' symbol: ' + x;
  throw new Error(m);
}

function link(files, base) {
  const addr = {};
  // your code here
  return addr;
}`,
    solution: `function fail(kind, x) {
  const m = kind + ' symbol: ' + x;
  throw new Error(m);
}

function link(files, base) {
  const addr = {};
  let at = base;
  for (const f of files) {
    const defs = Object.entries(f.defs);
    for (const [x, off] of defs) {
      if (x in addr) {
        fail('duplicate', x);
      }
      addr[x] = at + off;
    }
    at += f.size;
  }
  for (const f of files) {
    for (const x of f.uses) {
      if (!(x in addr)) {
        fail('undefined', x);
      }
    }
  }
  return addr;
}`,
    tests: `const main = { size: 24,
  defs: { _start: 0 }, uses: ['sumsq'] };
const loop = { size: 40,
  defs: { sumsq: 0 }, uses: [] };
function msg(f) {
  try {
    f();
  } catch (e) {
    return e.message;
  }
  return 'no error';
}
test('the chapter\\'s link', () => {
  expect(link([main, loop], 0x11158))
    .toEqual({ _start: 0x11158,
      sumsq: 0x11170 });
});
test('order decides the layout', () => {
  expect(link([loop, main], 0x1000))
    .toEqual({ sumsq: 0x1000,
      _start: 0x1028 });
});
test('a missing definition', () => {
  expect(msg(() => link([main], 0)))
    .toBe('undefined symbol: sumsq');
});
test('two definitions', () => {
  expect(msg(() => link([main, loop, loop],
    0))).toBe('duplicate symbol: sumsq');
});`,
    hints: [
      'Two jobs: give every definition an address, then check every use. Can you check a use before you have seen every file?',
      'First loop: keep a running address `at`, starting at `base`. For each file, give each of its defs the address `at + off` (calling `fail(\'duplicate\', x)` if it already has one), then add the file\'s size to `at`.',
      'Second loop, after the first has finished: for every file and every name in its `uses`, call `fail(\'undefined\', x)` if `!(x in addr)`. Then return `addr`.',
    ],
    walkthrough: `**How to think about it.** A linker answers two questions: where does everything go, and does every name have exactly one home? The first is arithmetic: files are laid end to end, so each file starts where the last one ended, and a symbol's address is its file's start plus its offset in the file. The second needs care about order: \`main.o\` uses \`sumsq\` before we have seen \`loop.o\`, so a use can only be judged undefined once *all* the definitions are known. That means two loops, much like the assembler's two passes: the first collects every definition, the second checks every use.

**The solution, line by line.**

- \`const addr = {};\` will map each symbol to its final address.
- \`let at = base;\` is where the next file will start.
- \`for (const f of files) {\` lays the files out in the order given, which is why the second test, with the files swapped, gives different addresses.
- \`const defs = Object.entries(f.defs);\` turns \`{ sumsq: 0 }\` into \`[['sumsq', 0]]\`, so each definition can be unpacked into a name and an offset.
- \`if (x in addr) { fail('duplicate', x); }\` a second definition of the same global is an error, exactly as the ELF standard and lld say.
- \`addr[x] = at + off;\` the symbol's address is its file's start plus its offset inside the file.
- \`at += f.size;\` moves the start past this file: \`main.o\` is 24 bytes, so \`loop.o\` starts at 0x11158 + 24 = 0x11170.
- The second double loop looks at every use in every file and calls \`fail('undefined', x)\` for a name that no file defined.
- \`return addr;\` hands back the symbol table with final addresses, ready for the relocations.

**Common wrong attempts.**

- Checking uses inside the first loop, while laying out. \`main.o\` comes first and uses \`sumsq\`, which is not defined until \`loop.o\` is reached, so the very first test fails with "undefined symbol: sumsq" for a perfectly good link. This is the same trap as a one-pass assembler meeting a forward branch.
- Forgetting \`at += f.size\`. Every file then starts at \`base\`, so \`sumsq\` gets the same address as \`_start\`, and every call lands in the wrong function.`,
    wrong: [
      {
        code: `function fail(kind, x) {
  const m = kind + ' symbol: ' + x;
  throw new Error(m);
}

function link(files, base) {
  const addr = {};
  let at = base;
  for (const f of files) {
    for (const x of f.uses) {
      if (!(x in addr)) {
        fail('undefined', x);
      }
    }
    const defs = Object.entries(f.defs);
    for (const [x, off] of defs) {
      if (x in addr) {
        fail('duplicate', x);
      }
      addr[x] = at + off;
    }
    at += f.size;
  }
  return addr;
}`,
        why: 'Uses are checked before later files are seen, so main.o\'s use of sumsq is reported as undefined.',
      },
      {
        code: `function fail(kind, x) {
  const m = kind + ' symbol: ' + x;
  throw new Error(m);
}

function link(files, base) {
  const addr = {};
  for (const f of files) {
    const defs = Object.entries(f.defs);
    for (const [x, off] of defs) {
      if (x in addr) {
        fail('duplicate', x);
      }
      addr[x] = base + off;
    }
  }
  for (const f of files) {
    for (const x of f.uses) {
      if (!(x in addr)) {
        fail('undefined', x);
      }
    }
  }
  return addr;
}`,
        why: 'Every file is placed at `base`, so sumsq lands on top of _start (0x11158 instead of 0x11170).',
      },
    ],
  },
  hilo: {
    optional: true,
    title: 'Apply the relocations',
    prompt: 'Write `patch(relocs, addr)`. Each relocation is `{ type, P, sym }`: its type (`\'HI20\'`, `\'LO12_I\'` or `\'CALL_PLT\'`), the final address `P` of the instruction it patches, and the symbol it names; `addr` maps symbols to final addresses (the addend is 0 here). Return the list of values to write, using the psABI formulas: HI20 is `(S + 0x800) >> 12`; LO12_I is the low 12 bits of `S` read as a **signed** number (from -2048 to 2047); CALL_PLT is `S - P`.',
    starter: `function patch(relocs, addr) {
  // your code here
  return [];
}`,
    solution: `function lo12(v) {
  return ((v & 0xfff) << 20) >> 20;
}

function patch(relocs, addr) {
  return relocs.map((r) => {
    const S = addr[r.sym];
    if (r.type === 'HI20') {
      return (S + 0x800) >> 12;
    }
    if (r.type === 'LO12_I') {
      return lo12(S);
    }
    return S - r.P;
  });
}`,
    tests: `const rs = [
  { type: 'HI20', P: 0x11158, sym: 'table' },
  { type: 'LO12_I', P: 0x1115c,
    sym: 'table' },
  { type: 'CALL_PLT', P: 0x11164,
    sym: 'sumsq' },
];
test('the chapter\\'s three holes', () => {
  expect(patch(rs, { table: 0x12198,
    sumsq: 0x11170 }))
    .toEqual([0x12, 0x198, 12]);
});
test('a low part that is negative', () => {
  expect(patch(rs, { table: 0x12898,
    sumsq: 0x11170 }))
    .toEqual([0x13, -0x768, 12]);
});
test('a call backwards', () => {
  expect(patch([rs[2]], { sumsq: 0x11000 }))
    .toEqual([-0x164]);
});`,
    hints: [
      'Use `relocs.map(...)`: one value per relocation, in the same order. Look up `S = addr[r.sym]` first.',
      'CALL_PLT is the distance from the instruction to the symbol, `S - P`, which is negative for a call backwards. HI20 adds 0x800 before shifting right by 12.',
      'For LO12_I, keep the low 12 bits with `v & 0xfff`, then sign-extend them: shift left by 20 so bit 11 lands in bit 31, then shift right by 20 with `>>`, which copies the sign bit back down.',
    ],
    walkthrough: `**How to think about it.** Each relocation type is a small formula from the RISC-V psABI, in terms of S (the symbol's final address), A (the addend, 0 here) and P (where the instruction now sits). The two halves of an absolute address must add back up to it: \`lui\` contributes \`hi << 12\` and \`addi\` adds \`lo\`, *as a signed number*. When the low 12 bits are 0x800 or more, \`addi\` reads them as negative, so the high part must be one bigger to compensate; adding 0x800 before shifting does exactly that.

**The solution, line by line.**

- \`function lo12(v)\` sign-extends the low 12 bits: \`v & 0xfff\` keeps them, \`<< 20\` moves bit 11 up to bit 31 (JavaScript's bit operators work on 32-bit signed integers), and \`>> 20\` moves them back, copying the sign bit, so 0x898 comes back as -0x768.
- \`relocs.map((r) => {\` produces one value per relocation \`r\`, in the same order.
- \`const S = addr[r.sym];\` is the symbol's final address.
- \`if (r.type === 'HI20') { return (S + 0x800) >> 12; }\` is the lui's 20 bits: for 0x12198 that is 0x12, for 0x12898 it is 0x13.
- \`if (r.type === 'LO12_I') { return lo12(S); }\` is the addi's 12 bits: 0x198, or -0x768. Check: 0x13000 - 0x768 = 0x12898.
- \`return S - r.P;\` is the call's distance: 0x11170 - 0x11164 = 12, the 0xc that lld put in the jalr.

**Common wrong attempts.**

- Shifting without adding 0x800 first. For 0x12198 it happens to give the right answer, but for 0x12898 the lui gets 0x12 while the addi adds -0x768, and the address comes out as 0x11898, 4 KiB too low.
- Taking \`S & 0xfff\` as the low part without sign-extending it. The second test then gets 0x898 instead of -0x768; the instruction cannot even hold that number as a positive value.`,
    wrong: [
      {
        code: `function patch(relocs, addr) {
  return relocs.map((r) => {
    const S = addr[r.sym];
    if (r.type === 'HI20') {
      return S >> 12;
    }
    if (r.type === 'LO12_I') {
      return ((S & 0xfff) << 20) >> 20;
    }
    return S - r.P;
  });
}`,
        why: 'Without the + 0x800, a negative low part leaves the address 4 KiB too low: the second test gets 0x12 instead of 0x13.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'You link `main.o` alone into a static executable with ld.lld, and it calls `sumsq`, which is defined only in `loop.o`. What happens?',
    options: [
      {
        t: 'The call is left as a jump to address 0',
        why: 'A static linker refuses to produce an executable with an unresolved reference.',
      },
      {
        t: 'The link fails with "undefined symbol: sumsq"',
        correct: true,
        why: 'main.o uses the global sumsq, and no input file defines it.',
      },
      {
        t: 'The loader finds sumsq when the program runs',
        why: 'In a static link nothing is looked up at run time; only a dynamic linker resolves symbols as the program starts.',
      },
    ],
  },
  {
    q: 'main.o\'s .text is 24 bytes and is placed at 0x11158, followed with no padding by loop.o\'s. sumsq is at offset 0 in loop.o. Where does sumsq end up?',
    options: [
      {
        t: '0x11158',
        why: 'That is where main.o starts; loop.o comes after it.',
      },
      {
        t: '0x11188',
        why: 'That adds 0x30 (48), not 24 (0x18).',
      },
      {
        t: '0x11170',
        correct: true,
        why: '0x11158 + 0x18 = 0x11170.',
      },
    ],
  },
  {
    q: 'Two object files each contain a label `loop:` inside a function. What does the linker do?',
    options: [
      {
        t: 'Nothing special: they are local symbols, private to each file',
        correct: true,
        why: 'Only global symbols are matched across files; locals never meet.',
      },
      {
        t: 'Reports a duplicate symbol',
        why: 'That happens only for two definitions of the same global symbol.',
      },
      {
        t: 'Renames one of them',
        why: 'No renaming is needed, because local names are never visible outside their file.',
      },
    ],
  },
  {
    q: 'What does the loader do with a LOAD segment whose MemSiz is larger than its FileSiz?',
    options: [
      {
        t: 'Refuses to load the program, because the file is truncated',
        why: 'This is normal: it is how .bss is stored without taking space in the file.',
      },
      {
        t: 'Reads the extra bytes from the next segment in the file',
        why: 'Segments do not borrow bytes from each other.',
      },
      {
        t: 'Maps the file\'s bytes and fills the rest of the segment with zeros',
        correct: true,
        why: 'The ELF standard defines the extra bytes to hold 0.',
      },
    ],
  },
  {
    q: 'In which of these does a dynamic linker take part?',
    options: [
      {
        t: 'Every program, including a statically linked one',
        why: 'A static executable has no PT_INTERP header, so the system runs it directly.',
      },
      {
        t: 'A program with a PT_INTERP header, which uses shared libraries',
        correct: true,
        why: 'PT_INTERP names the interpreter the system runs first, which loads the shared objects and resolves their symbols.',
      },
      {
        t: 'Only object files, before they are linked',
        why: 'Object files are input to the static linker; dynamic linking happens when a program starts.',
      },
    ],
  },
];
