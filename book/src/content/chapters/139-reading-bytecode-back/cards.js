// Chapter 139 cards (the second half of a split chapter). Keys are stable ids: never rename them.

export const prompts = {
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

export const examples = {};

const NAMES = `const NAMES = { 0: 'const', 20: 'add',
  33: 'print' };`;

export const exercises = {
  disassemble: {
    title: 'A disassembler for three opcodes',
    prompt:
      'A chunk is `{ code, constants }`. Opcode `0` is `const` and is followed by **two** operand bytes, the constant’s number, high byte first; `20` is `add` and `33` is `print`, with no operands. Write `disassemble(chunk)`, which returns one string per instruction: the offset as four digits, a space, the name, and for `const` a space, the number and the quoted value, like `0000 const 0 \'1.5\'`. The starter treats every byte as an instruction. Fix it.',
    starter: `${NAMES}

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
    solution: `${NAMES}

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
        code: `${NAMES}

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
        code: `${NAMES}

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
    prompt:
      'Most neighbours in `lines` repeat, so store it as *runs*: `[line, count]` pairs. Write `compress(lines)`, which turns `[1, 1, 1, 2, 2]` into `[[1, 3], [2, 2]]`, and `lineAt(runs, offset)`, which gives the line of byte `offset` from the runs (for the runs above, `lineAt(runs, 3)` is `2`).',
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
    q: 'In this disassembly, why is the second offset `0003` and not `0001`?\n\n```text\n0000    1 const               0 \'1.5\'\n0003    | const               1 \'2\'\n```',
    options: [
      { t: 'Offsets always count in steps of three', why: 'An `add` straight after would be at 0006 and the next instruction at 0007: the steps depend on each instruction’s length.' },
      { t: 'Bytes 1 and 2 are the first instruction’s operand', correct: true, why: '`const` is three bytes: the opcode at 0, then the two bytes of the constant number. The next opcode is at 3.' },
      { t: 'Bytes 1 and 2 hold the line number', why: 'Lines live in a separate array, `lines`, not in `code`.' },
      { t: 'The disassembler skipped two empty bytes', why: 'There are no empty bytes; every byte is an opcode or an operand.' },
    ],
  },
  {
    q: 'What does the `|` in the second column of a disassembly line mean?',
    options: [
      { t: 'The instruction has no operands', why: 'Operands appear after the name. The `|` is in the line column.' },
      { t: 'The compiler added the instruction itself', why: '`none` and `return` at the end often show `|`, but so does ordinary code. It is only about lines.' },
      { t: 'The end of a statement', why: 'Several statements can share a line, and one statement can span several.' },
      { t: 'Same source line as the byte before', correct: true, why: 'A line number is printed only when it changes, so the start of each new source line stands out.' },
    ],
  },
  {
    q: 'The chunk is `0, 0, 0, 8, 1, ...` (`const 0`, then `load.local 1`). What goes wrong if you start disassembling at offset 4?',
    options: [
      { t: 'Nothing: any byte can start an instruction', why: 'Byte 4 is `load.local`’s operand. Decoding must start at an opcode.' },
      { t: 'It throws, because 1 is not an opcode', why: '1 is a real opcode, `none`, which is exactly why the mistake is silent.' },
      { t: 'It reads the operand 1 as the opcode `none`', correct: true, why: 'Bytes do not say whether they are opcodes or operands; only decoding from offset 0 keeps them apart.' },
      { t: 'It prints the constant twice', why: 'It never sees the `const` at offset 0 at all.' },
    ],
  },
  {
    q: 'A disassembly shows `0013    | jump.unless        13 -> 20`. What are the instruction’s two operand bytes?',
    options: [
      { t: '`0, 20`', why: 'The operand is a distance, not the target: the target is worked out from it.' },
      { t: '`0, 7`', why: 'That would be 20 − 13, but the distance is counted from the end of the jump instruction, offset 16.' },
      { t: '`20, 0`', why: 'The high byte comes first, and the distance is not 20.' },
      { t: '`0, 4`', correct: true, why: 'The jump is 3 bytes long, so it measures from 16, and 16 + 4 = 20.' },
    ],
  },
  {
    q: 'Why does each byte of a chunk carry its own line number?',
    options: [
      { t: 'When an instruction fails, the VM knows only its offset, and `lines` turns that into a source line', correct: true, why: 'The VM reads `lines[ip - 1]` to report `at line 3 in script`.' },
      { t: 'The VM needs lines to know which instruction to run next', why: 'The next instruction is found with `ip`; lines play no part in running.' },
      { t: 'The disassembler cannot find instruction boundaries without them', why: 'Boundaries come from the opcodes’ lengths; lines only fill the second column.' },
      { t: 'Each line of source compiles to exactly one byte', why: 'A line usually compiles to many bytes, which is why the numbers repeat.' },
    ],
  },
];
