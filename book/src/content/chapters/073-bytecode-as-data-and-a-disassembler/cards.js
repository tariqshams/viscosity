// Chapter 169 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 73, 73.

export const prompts = {
  'chunk-three': {
    q: 'What three arrays make up a Drip `Chunk`?',
    a: '`code` (the bytes), `lines` (the source line of each byte) and `constants` (the constant pool).',
  },
  'lines-parallel': {
    q: 'Why do `code` and `lines` always have the same length?',
    a: '`write` pushes onto both at once: one line number for every byte.',
  },
  'chunk-per-fn': {
    q: 'A Drip program defines two functions. How many chunks does it compile to?',
    a: 'Three: one for each function and one for the script, which is compiled as a function too.',
  },
  'pool-why': {
    q: 'Why does `1.5` go in the constant pool rather than straight into `code`?',
    a: 'A byte holds only 0 to 255, but `1.5` is an 8-byte float. The code holds its small index instead.',
  },
  'pool-limit': {
    q: 'Where does the limit of 65,536 constants per function come from?',
    a: 'The constant’s index is a two-byte operand, and two bytes can hold the numbers 0 to 65,535.',
  },
  'hex-ffff': {
    q: 'What number is `0xffff`, and why does `makeConstant` compare with it?',
    a: '65,535, the largest number two bytes can hold: an index above it cannot be written as a `const` operand.',
  },
  'no-dedupe': {
    q: 'How many constants does `print 7; print 7;` add to the pool, and why?',
    a: 'Two. `addConstant` always appends; it never looks for an existing copy.',
  },
  'closure-constant': {
    q: 'What does the script’s constant pool hold for a function `fn add(a, b) { ... }` defined in it?',
    a: 'The compiled function itself (its own chunk inside), which the `closure` instruction turns into a value.',
  },
  'offset-what': {
    q: 'In the disassembler’s output, what is the first column (`0000`, `0003`, ...)?',
    a: 'The offset: the index in `code` of the instruction’s opcode.',
  },
  'pipe-what': {
    q: 'What does a `|` in the disassembler’s line column mean?',
    a: 'This instruction came from the same source line as the byte before it.',
  },
  'gap-is-length': {
    q: 'One instruction is at offset `0003` and the next at `0005`. What does that tell you?',
    a: 'The instruction at 3 is two bytes long: an opcode and a one-byte operand.',
  },
  'decode-in-order': {
    q: 'Why can a disassembler not start reading at an arbitrary byte?',
    a: 'A byte does not say whether it is an opcode or an operand. Only decoding from offset 0, stepping over each instruction’s operands, finds where instructions begin.',
  },
  'invoke-length': {
    q: 'How many bytes long is an `invoke` instruction, and why?',
    a: 'Four: the opcode, a two-byte constant (the method’s name) and a one-byte argument count.',
  },
  'jump-target': {
    q: '`jump.unless` sits at offset 13 and its two operand bytes are `0, 4`. Where does it land?',
    a: 'At 20: the offset after the instruction (13 + 3 = 16) plus the distance 4.',
  },
  'vm-knows-offset': {
    q: 'When a runtime error happens, why does the VM read `lines[ip - 1]` rather than `lines[ip]`?',
    a: '`ip` has already moved past the failing instruction’s opcode, so `ip - 1` is a byte of that instruction.',
  },
  'add-line-2': {
    q: 'In `print 2 +` (line 2) followed by `-"a";` (line 3), which line is the `add` instruction tagged with, and why does that help?',
    a: 'Line 2, the line of the `+`: an error in the addition then points at the line where the `+` is written.',
  },
};

export const examples = {
  'tiny-chunk': {
    title: 'A chunk of your own',
    code: `class Chunk {
  code = [];
  lines = [];
  constants = [];
  write(byte, line) {
    this.code.push(byte);
    this.lines.push(line);
  }
  addConstant(v) {
    this.constants.push(v);
    return this.constants.length - 1;
  }
}

// print 1.5 + 2; on line 1
const c = new Chunk();
const k = c.addConstant(1.5);
c.write(0, 1); // const
c.write(k >> 8, 1);
c.write(k & 255, 1);
const k2 = c.addConstant(2);
c.write(0, 1);
c.write(k2 >> 8, 1);
c.write(k2 & 255, 1);
c.write(20, 1); // add
c.write(33, 1); // print
console.log(c.code.join(', '));
console.log(c.lines.join(', '));
console.log(c.constants);`,
  },
};

export const exercises = {
  dedupe: {
    title: 'A pool without duplicates',
    prompt: 'Write `addConstant(chunk, v)`, which returns the index of `v` in `chunk.constants`. If an equal value (`===`) is already there, return its index instead of adding a copy. If adding a new value would need an index above 65,535 (`0xffff`), throw an `Error` with the message `too many constants in one function`.',
    starter: `function addConstant(chunk, v) {
  chunk.constants.push(v);
  return chunk.constants.length - 1;
}`,
    solution: `function addConstant(chunk, v) {
  const i = chunk.constants.indexOf(v);
  if (i !== -1) return i;
  const n = chunk.constants.length;
  if (n > 0xffff) throw new Error(
    'too many constants in one ' +
    'function');
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
test('repeated names do not grow the pool', () => {
  const c = { constants: [] };
  for (let i = 0; i < 1000; i++) {
    addConstant(c, 'x' + (i % 8));
  }
  expect(c.constants.length).toBe(8);
});
test('index 65535 is fine, 65536 throws', () => {
  const c = { constants: [] };
  c.constants.length = 65535;
  c.constants.fill(null);
  expect(addConstant(c, 'last')).toBe(65535);
  expect(() => addConstant(c, 'one more'))
    .toThrow();
});`,
    hints: [
      'There are three situations: the value is already in the pool, the pool is full, or the value is new. Which must you check first?',
      'Check for an existing copy first: a repeat never grows the pool, so it can never hit the limit. `array.indexOf(v)` finds the first index holding a value `===` to `v`, or gives -1.',
      'A new value’s index will be `chunk.constants.length`. If that is above `0xffff`, throw before pushing; otherwise push and return it.',
    ],
    walkthrough: `**How to think about it.** Picture the pool as the cloakroom from the chapter. When someone arrives with a coat that is already hanging there (the same value), you could hand them the old ticket rather than use up a new hook. Only a genuinely new value needs a new hook, and only then can the cloakroom be full. So the order of the checks is: is it already here? If not, is there room? If so, add it.

**The solution, line by line.**

- \`const i = chunk.constants.indexOf(v);\` searches the pool for a value \`===\` to \`v\`. \`indexOf\` gives the first matching index, or -1 if there is none.
- \`if (i !== -1) return i;\` reuses the existing entry: the caller gets the old index and the pool does not grow.
- \`const n = chunk.constants.length;\` is the index the new value will get, because \`push\` adds at the end.
- \`if (n > 0xffff) throw new Error(...)\` refuses an index that two bytes cannot hold. Index 65,535 is the last one allowed, so the 65,537th distinct value (index 65,536) is the first to fail, which the last test checks.
- \`chunk.constants.push(v);\` adds the value, and \`return n;\` hands back its index.

**Why it is not the default.** \`indexOf\` scans the whole pool on every call, so compiling a function with many constants gets slower and slower; a \`Map\` from value to index would fix that. And \`===\` is right for numbers and plain JavaScript strings, but in Drip’s VM a string is an object on the VM’s heap, where \`===\` asks “the same object?”. The chapter *String interning* makes equal strings the same object, which is what would make this kind of reuse safe there.

**Common wrong attempts.**

- Checking the limit first and the reuse second gives the wrong answer for a full pool: a value that is already there should still get its index back, not an error.
- Adding the limit but no reuse (the first wrong attempt below) still grows the pool on every repeat, so a name used a thousand times takes a thousand entries.`,
    wrong: [
      {
        code: `function addConstant(chunk, v) {
  const n = chunk.constants.length;
  if (n > 0xffff) throw new Error(
    'too many constants in one ' +
    'function');
  chunk.constants.push(v);
  return n;
}`,
        why: 'This adds the limit but not the reuse: every repeated value still takes a new entry.',
      },
      {
        code: `function addConstant(chunk, v) {
  const i = chunk.constants.indexOf(v);
  if (i !== -1) return i;
  chunk.constants.push(v);
  return chunk.constants.length - 1;
}`,
        why: 'This reuses entries but has no limit, so it happily returns 65,536, an index that two operand bytes cannot hold.',
      },
    ],
  },
  disassemble: {
    title: 'A disassembler for three opcodes',
    prompt: 'A chunk is `{ code, constants }`. Opcode `0` is `const` and is followed by **two** operand bytes, the constant’s number, high byte first; `20` is `add` and `33` is `print`, with no operands. Write `disassemble(chunk)`, which returns one string per instruction: the offset as four digits, a space, the name, and for `const` a space, the number and the quoted value, like `0000 const 0 \'1.5\'`. The starter treats every byte as an instruction. Fix it.',
    starter: `const NAMES = { 0: 'const', 20: 'add',
  33: 'print' };

function disassemble(chunk) {
  const out = [];
  let off = 0;
  while (off < chunk.code.length) {
    const op = chunk.code[off];
    const at = String(off)
      .padStart(4, '0');
    out.push(at + ' ' + NAMES[op]);
    off += 1;
  }
  return out;
}`,
    solution: `const NAMES = { 0: 'const', 20: 'add',
  33: 'print' };

function disassemble(chunk) {
  const out = [];
  let off = 0;
  while (off < chunk.code.length) {
    const op = chunk.code[off];
    const at = String(off)
      .padStart(4, '0');
    if (op === 0) {
      const hi = chunk.code[off + 1];
      const lo = chunk.code[off + 2];
      const k = hi * 256 + lo;
      const v = chunk.constants[k];
      out.push(\`\${at} const \${k} \` +
        \`'\${v}'\`);
      off += 3;
    } else {
      out.push(at + ' ' + NAMES[op]);
      off += 1;
    }
  }
  return out;
}`,
    tests: `test('one instruction without operands', () => {
  const c = { code: [33], constants: [] };
  expect(disassemble(c)).toEqual(['0000 print']);
});
test('a constant shows its number and value', () => {
  const c = { code: [0, 0, 0], constants: [1.5] };
  expect(disassemble(c))
    .toEqual(["0000 const 0 '1.5'"]);
});
test('print 1.5 + 2', () => {
  const c = {
    code: [0, 0, 0, 0, 0, 1, 20, 33],
    constants: [1.5, 2],
  };
  expect(disassemble(c)).toEqual([
    "0000 const 0 '1.5'",
    "0003 const 1 '2'",
    '0006 add',
    '0007 print',
  ]);
});
test('operand bytes are not opcodes', () => {
  const c = { code: [0, 0, 33, 33],
    constants: [] };
  c.constants[33] = 'hi';
  expect(disassemble(c)).toEqual([
    "0000 const 33 'hi'", '0003 print',
  ]);
});
test('a two-byte constant number', () => {
  const c = { code: [0, 1, 44], constants: [] };
  c.constants[300] = 'x';
  expect(disassemble(c))
    .toEqual(["0000 const 300 'x'"]);
});`,
    hints: [
      'How long is a `const` instruction? After printing it, where does the next instruction start?',
      'Inside the loop, check `if (op === 0)`. The constant’s number is in the next two bytes: `chunk.code[off + 1]` is the high byte and `chunk.code[off + 2]` the low one, so the number is `hi * 256 + lo`. The value is `chunk.constants` at that number.',
      'Push `` `${at} const ${k} \'${v}\'` ``, then `off += 3`. Keep the starter’s two lines (push the name, `off += 1`) in an `else` for the other opcodes.',
    ],
    walkthrough: `**How to think about it.** The starter has the right loop but the wrong step: it moves on by one byte every time, so after a \`const\` it treats the operand bytes as opcodes. The fix is the one idea of the chapter: decode the instruction at \`off\`, which tells you how long it is, and move \`off\` by that length. Only two lengths exist here: three bytes for \`const\` (the opcode and a two-byte number) and one byte for everything else.

**The solution, line by line.**

- \`const at = String(off).padStart(4, '0');\` turns the offset into four digits, so 3 becomes \`0003\`. (\`padStart\` adds characters at the front until the string is long enough.)
- \`if (op === 0) {\` picks out \`const\`, the only opcode here with operands.
- \`const hi = chunk.code[off + 1];\` and \`const lo = chunk.code[off + 2];\` read the two operand bytes, high first.
- \`const k = hi * 256 + lo;\` rebuilds the constant’s number, as in the chapter’s formula; \`[0, 1, 44]\` gives 300.
- \`const v = chunk.constants[k];\` looks the value up in the pool. The operand is a position; the value is what is stored there.
- \`out.push(...)\` builds the line from two template literals joined with \`+\` (split only to keep the lines short): the offset, the name, the number, and the value in quotes.
- \`off += 3;\` steps over the whole instruction, so the next turn of the loop lands on the next opcode.
- \`} else {\` handles the one-byte instructions exactly as the starter did: print the name, and \`off += 1\`.

In the fourth test, \`[0, 0, 33, 33]\`, the first 33 is the low byte of the constant number and the second is a real \`print\`. The starter prints \`print\` twice; the solution reads the first 33 as part of \`const 33\` and only the second as an opcode.

**Common wrong attempts.**

- Reading only one operand byte (\`chunk.code[off + 1]\`) and stepping by 2 is the layout of a VM with one-byte constant numbers; here it reads the high byte as the whole number and then decodes the low byte as an opcode.
- Printing the index in place of the value (\`'\${k}'\`) forgets the pool lookup: the operand says *where* the value is, not what it is.`,
    wrong: [
      {
        code: `const NAMES = { 0: 'const', 20: 'add',
  33: 'print' };

function disassemble(chunk) {
  const out = [];
  let off = 0;
  while (off < chunk.code.length) {
    const op = chunk.code[off];
    const at = String(off)
      .padStart(4, '0');
    if (op === 0) {
      const k = chunk.code[off + 1];
      const v = chunk.constants[k];
      out.push(\`\${at} const \${k} \` +
        \`'\${v}'\`);
      off += 2;
    } else {
      out.push(at + ' ' + NAMES[op]);
      off += 1;
    }
  }
  return out;
}`,
        why: 'This reads a one-byte constant number and steps by 2, so it takes the high byte as the number and then decodes the low byte as an opcode. A `const` is three bytes here.',
      },
      {
        code: `const NAMES = { 0: 'const', 20: 'add',
  33: 'print' };

function disassemble(chunk) {
  const out = [];
  let off = 0;
  while (off < chunk.code.length) {
    const op = chunk.code[off];
    const at = String(off)
      .padStart(4, '0');
    if (op === 0) {
      const k =
        chunk.code[off + 1] * 256 +
        chunk.code[off + 2];
      out.push(\`\${at} const \${k} \` +
        \`'\${k}'\`);
      off += 3;
    } else {
      out.push(at + ' ' + NAMES[op]);
      off += 1;
    }
  }
  return out;
}`,
        why: 'The stepping is right, but it prints the index where the value should be. The value is `chunk.constants[k]`.',
      },
    ],
  },
  runLines: {
    optional: true,
    title: 'A smaller lines array',
    prompt: 'Most neighbours in `lines` repeat, so store it as *runs*: `[line, count]` pairs. Write `compress(lines)`, which turns `[1, 1, 1, 2, 2]` into `[[1, 3], [2, 2]]`, and `lineAt(runs, offset)`, which gives the line of byte `offset` from the runs (for the runs above, `lineAt(runs, 3)` is `2`).',
    starter: `function compress(lines) {
  return [];
}

function lineAt(runs, offset) {
  return 0;
}`,
    solution: `function compress(lines) {
  const runs = [];
  for (const line of lines) {
    const last = runs[runs.length - 1];
    if (last && last[0] === line) {
      last[1]++;
    } else {
      runs.push([line, 1]);
    }
  }
  return runs;
}

function lineAt(runs, offset) {
  for (const [line, count] of runs) {
    if (offset < count) return line;
    offset -= count;
  }
  return -1;
}`,
    tests: `test('one run', () => {
  expect(compress([4, 4, 4])).toEqual([[4, 3]]);
});
test('the error example', () => {
  const lines = [1, 1, 1, 1, 2, 2, 2,
    3, 3, 3, 3, 2, 3, 3, 3];
  expect(compress(lines)).toEqual(
    [[1, 4], [2, 3], [3, 4], [2, 1], [3, 3]]);
});
test('lineAt finds every byte', () => {
  const lines = [1, 1, 2, 2, 2, 5];
  const runs = compress(lines);
  for (let i = 0; i < lines.length; i++) {
    expect(lineAt(runs, i)).toBe(lines[i]);
  }
});`,
    hints: [
      'Walk `lines` once. For each line number, either it continues the run you are building, or it starts a new one.',
      'Look at the last run in your output: if its line equals the current one, add 1 to its count; otherwise push `[line, 1]`.',
      'For `lineAt`, go through the runs in order, subtracting each count from `offset` until `offset` is smaller than the current run’s count.',
    ],
    walkthrough: `**How to think about it.** In the chapter’s error example, \`lines\` is \`1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 2, 3, 3, 3\`: fifteen numbers, but only five stretches of one repeated line. Writing each stretch once, with how long it lasts, is called *run-length encoding*. Note that a line can come back (the \`2\` for the \`add\`), so a run is “this line, for this many bytes”, not “everything on this line”.

**\`compress\`, line by line.**

- \`const runs = [];\` will hold \`[line, count]\` pairs.
- \`for (const line of lines) {\` visits each byte’s line in order.
- \`const last = runs[runs.length - 1];\` is the run being built (\`undefined\` at the very start).
- \`if (last && last[0] === line) { last[1]++; }\` extends that run when the line has not changed.
- \`else { runs.push([line, 1]); }\` starts a new run of length 1 when it has.

**\`lineAt\`, line by line.** \`for (const [line, count] of runs)\` walks the runs from the start; \`if (offset < count) return line;\` answers when the byte falls inside this run; otherwise \`offset -= count;\` skips the run’s bytes and moves on. For \`lineAt(runs, 3)\` with runs \`[[1, 3], [2, 2]]\`: 3 is not less than 3, so subtract to get 0; 0 is less than 2, so the answer is 2.

**The trade-off.** The array is much smaller, but looking a line up now takes a walk instead of one index. That is a good trade here, because the VM only looks lines up when an error happens, which is rare.

**Common wrong attempts.** Grouping by line number (one run per distinct line) loses the order, and gets the \`add\` on line 2 wrong. Returning \`runs[offset][0]\` treats runs as if each were one byte long.`,
    wrong: [
      {
        code: `function compress(lines) {
  const runs = [];
  for (const line of lines) {
    const last = runs[runs.length - 1];
    if (last && last[0] === line) {
      last[1]++;
    } else {
      runs.push([line, 1]);
    }
  }
  return runs;
}

function lineAt(runs, offset) {
  return runs[offset][0];
}`,
        why: '`compress` is right, but `lineAt` treats each run as one byte long. A run covers `count` bytes, so you have to skip whole runs.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why can one Drip function hold at most 65,536 constants?',
    options: [
      {
        t: 'The VM’s memory runs out after that',
        why: 'Memory is not the limit; the size of the operand is.',
      },
      {
        t: 'A constant’s index is written in two bytes, which hold 0 to 65,535',
        correct: true,
        why: '`makeConstant` reports “too many constants in one function” when an index goes above `0xffff`.',
      },
      {
        t: 'JavaScript arrays cannot be longer than that',
        why: 'They can be far longer. The limit comes from the bytecode format.',
      },
      {
        t: 'Each constant takes one byte of code',
        why: 'A constant takes one entry in the pool; the code holds a two-byte index to it.',
      },
    ],
  },
  {
    q: 'In a Drip chunk, `lines[5]` is 2. What does that tell you?',
    options: [
      {
        t: 'The fifth instruction is on line 2',
        why: '`lines` has one entry per byte, not per instruction, and instructions can be up to several bytes long.',
      },
      {
        t: 'Constant number 5 is the value 2',
        why: 'Constants live in `constants`, not `lines`.',
      },
      {
        t: 'The byte at `code[5]` was compiled from source line 2',
        correct: true,
        why: '`code` and `lines` are parallel arrays, written together by `write`.',
      },
      {
        t: 'Line 2 has 5 bytes of code',
        why: 'Each entry is a line number for one byte, not a count.',
      },
    ],
  },
  {
    q: 'Why does `const` carry an index into the pool, rather than the value itself?',
    options: [
      {
        t: 'Values like `1.5` or `"hi"` do not fit in a byte or two; an index does',
        correct: true,
        why: 'A float is 8 bytes and a string can be any length, so the code stays small and every instruction stays simple.',
      },
      {
        t: 'So that values can be changed while the program runs',
        why: 'Constants do not change. The reason is size.',
      },
      {
        t: 'Because the VM can only add small whole numbers',
        why: 'The VM handles any Drip value. The constraint is the size of an operand.',
      },
      {
        t: 'To make the disassembler’s job easier',
        why: 'It is the other way round: the disassembler has to look the value up because of the pool.',
      },
    ],
  },
  {
    q: 'A Drip function reads the global `count` three hundred times. How many pool entries does the name `count` take in that function’s chunk?',
    options: [
      {
        t: 'One: the compiler reuses it',
        why: '`addConstant` never looks for an existing copy, so every mention adds a new entry.',
      },
      {
        t: 'None: globals are not constants',
        why: 'A global is looked up by its name, and the name is a string constant in the pool.',
      },
      {
        t: 'Three hundred, and it compiles fine',
        correct: true,
        why: 'One entry per mention; with room for 65,536 constants per function, that is wasteful but harmless.',
      },
      {
        t: 'It fails with “too many constants in one function”',
        why: 'Three hundred is far below the limit of 65,536.',
      },
    ],
  },
  {
    q: 'A script defines `fn area(w, h) { ... }`. Where are `area`’s instructions?',
    options: [
      {
        t: 'In the script’s chunk, right after the `closure` instruction',
        why: 'The script’s chunk only holds the compiled function as a constant; `closure` makes a value from it.',
      },
      {
        t: 'In `area`’s own chunk, held as a constant in the script’s pool',
        correct: true,
        why: 'Every function has its own chunk, with its own code, lines and constants, starting at offset 0.',
      },
      {
        t: 'Nowhere until the function is called',
        why: 'Drip compiles every function once, before the program runs.',
      },
      {
        t: 'In a separate chunk shared by all functions',
        why: 'Each function gets a chunk of its own.',
      },
    ],
  },
  {
    q: `In this disassembly, why is the second offset \`0003\` and not \`0001\`?

\`\`\`text
0000    1 const               0 '1.5'
0003    | const               1 '2'
\`\`\``,
    options: [
      {
        t: 'Offsets always count in steps of three',
        why: 'An `add` straight after would be at 0006 and the next instruction at 0007: the steps depend on each instruction’s length.',
      },
      {
        t: 'Bytes 1 and 2 are the first instruction’s operand',
        correct: true,
        why: '`const` is three bytes: the opcode at 0, then the two bytes of the constant number. The next opcode is at 3.',
      },
      {
        t: 'Bytes 1 and 2 hold the line number',
        why: 'Lines live in a separate array, `lines`, not in `code`.',
      },
      {
        t: 'The disassembler skipped two empty bytes',
        why: 'There are no empty bytes; every byte is an opcode or an operand.',
      },
    ],
  },
  {
    q: 'What does the `|` in the second column of a disassembly line mean?',
    options: [
      {
        t: 'The instruction has no operands',
        why: 'Operands appear after the name. The `|` is in the line column.',
      },
      {
        t: 'The compiler added the instruction itself',
        why: '`none` and `return` at the end often show `|`, but so does ordinary code. It is only about lines.',
      },
      {
        t: 'The end of a statement',
        why: 'Several statements can share a line, and one statement can span several.',
      },
      {
        t: 'Same source line as the byte before',
        correct: true,
        why: 'A line number is printed only when it changes, so the start of each new source line stands out.',
      },
    ],
  },
  {
    q: 'The chunk is `0, 0, 0, 8, 1, ...` (`const 0`, then `load.local 1`). What goes wrong if you start disassembling at offset 4?',
    options: [
      {
        t: 'Nothing: any byte can start an instruction',
        why: 'Byte 4 is `load.local`’s operand. Decoding must start at an opcode.',
      },
      {
        t: 'It throws, because 1 is not an opcode',
        why: '1 is a real opcode, `none`, which is exactly why the mistake is silent.',
      },
      {
        t: 'It reads the operand 1 as the opcode `none`',
        correct: true,
        why: 'Bytes do not say whether they are opcodes or operands; only decoding from offset 0 keeps them apart.',
      },
      {
        t: 'It prints the constant twice',
        why: 'It never sees the `const` at offset 0 at all.',
      },
    ],
  },
  {
    q: 'A disassembly shows `0013    | jump.unless        13 -> 20`. What are the instruction’s two operand bytes?',
    options: [
      {
        t: '`0, 20`',
        why: 'The operand is a distance, not the target: the target is worked out from it.',
      },
      {
        t: '`0, 7`',
        why: 'That would be 20 − 13, but the distance is counted from the end of the jump instruction, offset 16.',
      },
      {
        t: '`20, 0`',
        why: 'The high byte comes first, and the distance is not 20.',
      },
      {
        t: '`0, 4`',
        correct: true,
        why: 'The jump is 3 bytes long, so it measures from 16, and 16 + 4 = 20.',
      },
    ],
  },
  {
    q: 'Why does each byte of a chunk carry its own line number?',
    options: [
      {
        t: 'When an instruction fails, the VM knows only its offset, and `lines` turns that into a source line',
        correct: true,
        why: 'The VM reads `lines[ip - 1]` to report `at line 3 in script`.',
      },
      {
        t: 'The VM needs lines to know which instruction to run next',
        why: 'The next instruction is found with `ip`; lines play no part in running.',
      },
      {
        t: 'The disassembler cannot find instruction boundaries without them',
        why: 'Boundaries come from the opcodes’ lengths; lines only fill the second column.',
      },
      {
        t: 'Each line of source compiles to exactly one byte',
        why: 'A line usually compiles to many bytes, which is why the numbers repeat.',
      },
    ],
  },
];
