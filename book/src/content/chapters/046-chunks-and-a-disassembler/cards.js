// Chapter 46 cards. Keys are stable ids: never rename them.

export const prompts = {
  'chunk-three': {
    q: 'What three arrays make up a Drip `Chunk`?',
    a: '`code` (the bytes), `lines` (the source line of each byte) and `constants` (the constant pool).',
  },
  'lines-parallel': {
    q: 'Why do `code` and `lines` always have the same length?',
    a: '`write` pushes to both at once: one line number for every byte.',
  },
  'lines-why': {
    q: 'What is the `lines` array for?',
    a: 'Error messages: when an instruction fails, the VM looks up the source line of that byte.',
  },
  'pool-why': {
    q: 'Why does `1.5` go in the constant pool instead of straight into `code`?',
    a: 'A byte only holds 0–255, but `1.5` is an 8-byte float. The code holds its one-byte index instead.',
  },
  'pool-limit': {
    q: 'Where does the 256-constant limit per chunk come from?',
    a: '`OP_CONSTANT`’s operand, the constant’s index, is a single byte.',
  },
  'no-dedupe': {
    q: 'How many constants does `print 7; print 7;` add to the pool, and why?',
    a: 'Two. `addConstant` always appends; it never looks for an existing copy.',
  },
  'offset-what': {
    q: 'In the disassembler’s output, what is the first column (`0000`, `0002`, …)?',
    a: 'The offset: the index in `code` of the instruction’s opcode.',
  },
  'pipe-what': {
    q: 'What does a `|` in the disassembler’s line column mean?',
    a: 'This byte came from the same source line as the previous instruction.',
  },
  'decode-in-order': {
    q: 'Why can’t a disassembler start reading at an arbitrary byte?',
    a: 'It can’t tell an opcode from an operand. Only decoding from the start, stepping over each instruction’s operands, finds where instructions begin.',
  },
  'vm-knows-offset': {
    q: 'When a runtime error happens, what does the VM know, and how does it turn that into a line number?',
    a: 'It knows the offset of the failing instruction, and reads `lines` at that offset.',
  },
};

export const examples = {};

const NAMES = `const NAMES = ['CONSTANT', 'ADD',
  'PRINT'];`;

export const exercises = {
  disassemble: {
    title: 'A disassembler for three opcodes',
    prompt:
      'A chunk is `{ code, constants }`. Opcode `0` is CONSTANT and is followed by one operand byte, a constant index; `1` is ADD and `2` is PRINT, with no operands. Write `disassemble(chunk)`, returning one string per instruction: the offset as four digits, a space, the name, and for CONSTANT also the index and the quoted value, like `0000 CONSTANT 0 \'1.5\'`. The starter treats every byte as an instruction. Fix it.',
    starter: `${NAMES}

function disassemble(chunk) {
  const out = [];
  let off = 0;
  while (off < chunk.code.length) {
    const op = chunk.code[off];
    const at = \`000\${off}\`.slice(-4);
    out.push(\`\${at} \${NAMES[op]}\`);
    off += 1;
  }
  return out;
}`,
    solution: `${NAMES}

function disassemble(chunk) {
  const out = [];
  let off = 0;
  while (off < chunk.code.length) {
    const op = chunk.code[off];
    const at = \`000\${off}\`.slice(-4);
    if (op === 0) {
      const c = chunk.code[off + 1];
      const v = chunk.constants[c];
      out.push(\`\${at} CONSTANT \` +
        \`\${c} '\${v}'\`);
      off += 2;
    } else {
      out.push(\`\${at} \${NAMES[op]}\`);
      off += 1;
    }
  }
  return out;
}`,
    tests: `test('one instruction without operands', () => {
  const c = { code: [2], constants: [] };
  expect(disassemble(c)).toEqual(['0000 PRINT']);
});
test('a constant shows its index and value', () => {
  const c = { code: [0, 0], constants: [1.5] };
  expect(disassemble(c))
    .toEqual(["0000 CONSTANT 0 '1.5'"]);
});
test('print 1.5 + 2', () => {
  const c = {
    code: [0, 0, 0, 1, 1, 2],
    constants: [1.5, 2],
  };
  expect(disassemble(c)).toEqual([
    "0000 CONSTANT 0 '1.5'",
    "0002 CONSTANT 1 '2'",
    '0004 ADD',
    '0005 PRINT',
  ]);
});
test('an operand of 2 is not a PRINT', () => {
  const c = { code: [0, 2, 2],
    constants: ['a', 'b', 'c'] };
  expect(disassemble(c)).toEqual([
    "0000 CONSTANT 2 'c'", '0002 PRINT',
  ]);
});`,
    hints: [
      'A CONSTANT instruction is two bytes long. After printing it, the next instruction starts at `off + 2`, not `off + 1`.',
      'Inside the loop, check `if (op === 0)`. Read the index from `chunk.code[off + 1]` and the value from `chunk.constants` at that index.',
      'Build the line as `` `${at} CONSTANT ${c} \'${v}\'` ``, push it, then do `off += 2`. Keep the old code for the other opcodes.',
    ],
    walkthrough: `The heart of a disassembler is knowing how long each instruction is:

\`\`\`js
if (op === 0) {
  const c = chunk.code[off + 1];
  const v = chunk.constants[c];
  out.push(\`\${at} CONSTANT \${c} '\${v}'\`);
  off += 2;
} else {
  out.push(\`\${at} \${NAMES[op]}\`);
  off += 1;
}
\`\`\`

- **Two reads for a constant.** The operand byte is an index, so the value takes a second lookup: \`chunk.constants[c]\`. That is exactly what the VM will do when it runs \`OP_CONSTANT\`.
- **Skip the operand.** Moving on by 2 means the operand is never mistaken for an opcode. The starter moved by 1, so in \`[0, 2, 2]\` it read the operand \`2\` as a PRINT.
- **Offsets come for free.** Because \`off\` only ever lands on opcodes, printing it gives each instruction’s offset, which is how you’ll later read jump targets.

The real \`disassembleInstruction\` does the same thing with a \`switch\` over opcodes, returning the text and the next offset together.`,
    wrong: [
      {
        code: `${NAMES}

function disassemble(chunk) {
  const out = [];
  let off = 0;
  while (off < chunk.code.length) {
    const op = chunk.code[off];
    const at = \`000\${off}\`.slice(-4);
    if (op === 0) {
      const c = chunk.code[off + 1];
      out.push(\`\${at} CONSTANT \` +
        \`\${c} '\${c}'\`);
      off += 2;
    } else {
      out.push(\`\${at} \${NAMES[op]}\`);
      off += 1;
    }
  }
  return out;
}`,
        why: 'This prints the index as if it were the value. The operand is a position in the pool; the value is `chunk.constants[c]`.',
      },
      {
        code: `${NAMES}

function disassemble(chunk) {
  const out = [];
  let off = 0;
  while (off < chunk.code.length) {
    const op = chunk.code[off];
    const at = \`000\${off}\`.slice(-4);
    if (op === 0) {
      const c = chunk.code[off + 1];
      const v = chunk.constants[c];
      out.push(\`\${at} CONSTANT \` +
        \`\${c} '\${v}'\`);
    } else {
      out.push(\`\${at} \${NAMES[op]}\`);
    }
    off += 1;
  }
  return out;
}`,
        why: 'It always moves on by one byte, so after a CONSTANT it decodes the operand as if it were an opcode. A CONSTANT is two bytes long.',
      },
    ],
  },
  dedupe: {
    optional: true,
    title: 'A pool without duplicates',
    prompt:
      'Write `addConstant(chunk, v)` that returns the index of `v` in `chunk.constants`. If an equal value (`===`) is already there, return its index instead of adding a copy. If adding would need an index above 255, throw an `Error` with the message `Too many constants in one chunk.`',
    starter: `function addConstant(chunk, v) {
  chunk.constants.push(v);
  return chunk.constants.length - 1;
}`,
    solution: `function addConstant(chunk, v) {
  const i = chunk.constants.indexOf(v);
  if (i !== -1) return i;
  const n = chunk.constants.length;
  if (n > 255) throw new Error(
    'Too many constants in one chunk.');
  chunk.constants.push(v);
  return n;
}`,
    tests: `test('new values get new indexes', () => {
  const c = { constants: [] };
  expect(addConstant(c, 7)).toBe(0);
  expect(addConstant(c, 'hi')).toBe(1);
});
test('a repeated value reuses its index', () => {
  const c = { constants: [] };
  addConstant(c, 7);
  addConstant(c, 8);
  expect(addConstant(c, 7)).toBe(0);
  expect(c.constants.length).toBe(2);
});
test('repeats never hit the limit', () => {
  const c = { constants: [] };
  for (let i = 0; i < 1000; i++) {
    addConstant(c, i % 8);
  }
  expect(c.constants.length).toBe(8);
});
test('the 257th distinct value throws', () => {
  const c = { constants: [] };
  for (let i = 0; i < 256; i++) {
    addConstant(c, i);
  }
  expect(() => addConstant(c, 999)).toThrow();
});`,
    hints: [
      '`array.indexOf(v)` finds the first index holding a value `===` to `v`, or returns -1.',
      'Check for an existing copy first. Only a genuinely new value can hit the limit.',
      'The new value’s index will be `chunk.constants.length`. If that is above 255, throw before pushing.',
    ],
    walkthrough: `Three cases, in this order:

\`\`\`js
const i = chunk.constants.indexOf(v);
if (i !== -1) return i;
const n = chunk.constants.length;
if (n > 255) throw new Error(/* … */);
chunk.constants.push(v);
return n;
\`\`\`

- **Reuse first.** A repeated value never grows the pool, so the eight names in \`string_equality\` would need eight slots, not hundreds. The third test checks exactly that.
- **Limit second.** Index 255 is the last one a byte can hold, so the 257th distinct value (index 256) is the first to fail.
- **The cost.** \`indexOf\` scans the whole pool on every call, which is slow for big chunks. A \`Map\` from value to index would be faster. And comparing with \`===\` works for strings here, but in the real VM strings are heap objects, where \`===\` means “the same object”. Chapter 52’s string interning makes equal strings the same object, which is what makes this kind of reuse safe there.`,
    wrong: [
      {
        code: `function addConstant(chunk, v) {
  const n = chunk.constants.length;
  if (n > 255) throw new Error(
    'Too many constants in one chunk.');
  chunk.constants.push(v);
  return n;
}`,
        why: 'This adds the limit but not the reuse: repeating a value still grows the pool, so the program with eight repeated values runs out of room.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In a Drip chunk, `lines[5]` is 2. What does that tell you?',
    options: [
      { t: 'The fifth instruction is on line 2', why: '`lines` has one entry per byte, not per instruction. Instructions can be several bytes long.' },
      { t: 'The byte at `code[5]` was compiled from source line 2', correct: true, why: '`code` and `lines` are parallel arrays, written together by `write`.' },
      { t: 'Constant number 5 is the value 2', why: 'Constants live in `constants`, not `lines`.' },
      { t: 'Line 2 has 5 bytes of code', why: 'Each entry is a line number for one byte, not a count.' },
    ],
  },
  {
    q: 'Why does `OP_CONSTANT` carry an index into the pool, rather than the value itself?',
    options: [
      { t: 'So that values can be changed while the program runs', why: 'Constants don’t change. The reason is size.' },
      { t: 'Because the VM can only add small integers', why: 'The VM handles any Drip value. The constraint is the one-byte operand.' },
      { t: 'Values like `1.5` or `"hi"` don’t fit in one byte; the index does', correct: true, why: 'A float is 8 bytes, and strings can be any length. The bytecode stays compact and every instruction stays simple.' },
      { t: 'To make the disassembler’s job easier', why: 'It’s the other way round: the disassembler has to do an extra lookup because of the pool.' },
    ],
  },
  {
    q: 'A script refers to the global variable `a1` three hundred times, and has no other constants. What happens when Drip’s VM compiles it?',
    options: [
      { t: 'It compiles fine: there is only one name', why: 'The compiler adds the name to the pool again on every mention; it never reuses an existing entry.' },
      { t: 'It fails at runtime with `Undefined variable`', why: 'It never gets to run: the problem is found while compiling.' },
      { t: 'It compiles, but runs slowly', why: 'The compiler stops with an error first.' },
      { t: 'Compiling fails with `Too many constants in one chunk.`', correct: true, why: 'Three hundred mentions make three hundred pool entries, more than a one-byte index can name. That’s what happened to `string_equality`.' },
    ],
  },
  {
    q: 'In this disassembly, why is the second offset `0002` and not `0001`?\n\n```text\n0000    1 OP_CONSTANT         0 \'1.5\'\n0002    | OP_CONSTANT         1 \'2\'\n```',
    options: [
      { t: 'Byte 1 is the first instruction’s operand', correct: true, why: '`OP_CONSTANT` is two bytes: the opcode at 0, the index at 1. The next opcode is at 2.' },
      { t: 'Offsets count in steps of two', why: '`OP_ADD` right after would be at 0004 and the next at 0005: steps depend on instruction length.' },
      { t: 'Byte 1 holds the line number', why: 'Lines live in a separate array, not in `code`.' },
      { t: 'The disassembler skipped a blank instruction', why: 'There are no blank instructions; every byte is either an opcode or an operand.' },
    ],
  },
  {
    q: 'What does the `|` in the second column of a disassembly line mean?',
    options: [
      { t: 'The instruction has no operands', why: 'Operands appear after the name. The `|` is in the line-number column.' },
      { t: 'The instruction was added by the compiler, not written by you', why: '`OP_NIL` and `OP_RETURN` at the end have `|` too, but so does ordinary code. It is only about lines.' },
      { t: 'Same source line as the instruction before', correct: true, why: 'The disassembler prints a line number only when it changes, so new lines stand out.' },
      { t: 'The end of a statement', why: 'Several statements can share a line, and one statement can span several.' },
    ],
  },
  {
    q: 'You point a disassembler at offset 1 of `[0, 2, 24]` (CONSTANT 2, PRINT). What goes wrong?',
    options: [
      { t: 'Nothing: any byte can be the start of an instruction', why: 'Byte 1 is an operand. Decoding must start at an opcode.' },
      { t: 'It reads the operand `2` as opcode 2, `OP_TRUE`', correct: true, why: 'Bytes don’t say whether they are opcodes or operands. Only decoding from the start, instruction by instruction, keeps them apart.' },
      { t: 'It prints the constant twice', why: 'It never sees the CONSTANT opcode at offset 0 at all.' },
      { t: 'It throws an error, because 2 is not a valid opcode', why: '2 is a valid opcode (`OP_TRUE`), which is exactly why the mistake is silent.' },
    ],
  },
];
