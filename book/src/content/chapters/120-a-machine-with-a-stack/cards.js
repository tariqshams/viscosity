// Chapter 120 cards. Keys are stable ids: never rename them.

export const prompts = {
  'stack-machine-what': {
    q: 'What is a **stack machine**?',
    a: 'A VM whose instructions pop their inputs from a value stack and push their results back onto it.',
  },
  'sp-means': {
    q: 'In Drip’s VM, what does `sp` hold?',
    a: 'The index of the next free slot in the stack array, which is also the number of values on it.',
  },
  'why-no-operands': {
    q: 'Why does `OP_ADD` need no operand bytes in a stack machine?',
    a: 'Its inputs are always the top two values on the stack, so there is nothing to name.',
  },
  'peek-vs-pop': {
    q: 'What is the difference between `peek(0)` and `pop()`?',
    a: 'Both give the top value, but `peek` leaves it on the stack; `pop` removes it.',
  },
  'ip-what': {
    q: 'What does the **instruction pointer** hold?',
    a: 'The index in the code of the next byte to read.',
  },
  'ip-after-constant': {
    q: 'An `OP_CONSTANT` starts at offset 4. Where is `ip` when it finishes?',
    a: 'At 6: one byte for the opcode, one for the operand.',
  },
  'pop-order': {
    q: 'In `SUBTRACT`, why is `b` popped before `a`?',
    a: 'The right operand was pushed last, so it is on top. Popping in the other order would compute `b - a`.',
  },
  'check-before-pop': {
    q: 'Why does `numbers()` check operand types with `peek` instead of popping first?',
    a: 'If the check fails, the stack is left as it was. And values still on the stack stay visible to the garbage collector.',
  },
  'dispatch-what': {
    q: 'What is the **dispatch loop**?',
    a: 'The VM’s main loop: read the opcode at `ip`, switch to the code for that instruction, run it, repeat.',
  },
  'ignition-register': {
    q: 'How do V8’s Ignition instructions find their inputs, compared with Drip’s?',
    a: 'Ignition is a register machine: instructions name registers, with an implicit accumulator. Drip’s take inputs from the top of a stack.',
  },
};

export const examples = {
  'arith-vm': {
    title: 'Arithmetic on the stack machine',
    lang: 'drip-vm',
    code: `print 10 - 4 - 3;
print (1 + 2) * -3;
print 7 / 2;
print "con" + "cat";`,
  },
};

const OPS = `const OP = {
  CONST: 0, ADD: 1, SUB: 2, MUL: 3,
  NEG: 4, RETURN: 5,
};`;

const head = `${OPS}

function run(chunk) {
  const { code, constants } = chunk;
  const st = [];
  let ip = 0;
  for (;;) {
    const op = code[ip++];`;

const binary = `    } else if (op >= 1 && op <= 3) {
      // ADD, SUB or MUL
      const b = st.pop();
      const a = st.pop();
      st.push(op === OP.ADD ? a + b
        : op === OP.SUB ? a - b
        : a * b);`;

const tail = `    } else {
      throw new Error('bad op ' + op);
    }
  }
}`;

export const exercises = {
  'stack-run': {
    title: 'A small stack machine',
    prompt:
      'Finish `run(chunk)`. `CONST` (0) has one operand byte, an index into `chunk.constants`; push that constant. `ADD`, `SUB` and `MUL` (1, 2, 3) pop two values and push the result. `NEG` (4) pops one value and pushes its negation. `RETURN` (5) pops and returns the top value. `CONST` and `RETURN` are done.',
    starter: `${head}
    if (op === OP.CONST) {
      st.push(constants[code[ip++]]);
    } else if (op === OP.RETURN) {
      return st.pop();
${tail}`,
    solution: `${head}
    if (op === OP.CONST) {
      st.push(constants[code[ip++]]);
    } else if (op === OP.NEG) {
      st.push(-st.pop());
    } else if (op === OP.RETURN) {
      return st.pop();
${binary}
${tail}`,
    tests: `test('a lone constant', () => {
  const ch = { code: [0, 0, 5],
    constants: [4.5] };
  expect(run(ch)).toBe(4.5);
});
test('1 + 2 * 3', () => {
  const ch = {
    code: [0, 0, 0, 1, 0, 2, 3, 1, 5],
    constants: [1, 2, 3],
  };
  expect(run(ch)).toBe(7);
});
test('10 - 4 pops in the right order', () => {
  const ch = { code: [0, 0, 0, 1, 2, 5],
    constants: [10, 4] };
  expect(run(ch)).toBe(6);
});
test('-(2 + 3) * 2', () => {
  const ch = {
    code: [0, 0, 0, 1, 1, 4, 0, 2, 3, 5],
    constants: [2, 3, 2],
  };
  expect(run(ch)).toBe(-10);
});
test('an operand of 5 is not RETURN', () => {
  const ch = { code: [0, 5, 4, 5],
    constants: [0, 0, 0, 0, 0, 42] };
  expect(run(ch)).toBe(-42);
});`,
    hints: [
      'For `NEG`, pop one value and push its negation: `st.push(-st.pop())`.',
      'For the three binary operators, pop **twice**. The first pop is the right operand, because it was pushed last.',
      'Pop `b` first, then `a`, and push `a + b`, `a - b` or `a * b` depending on `op`.',
    ],
    walkthrough: `Two new branches:

\`\`\`js
} else if (op === OP.NEG) {
  st.push(-st.pop());
} else if (op >= 1 && op <= 3) {
  const b = st.pop();
  const a = st.pop();
  st.push(op === OP.ADD ? a + b
    : op === OP.SUB ? a - b
    : a * b);
}
\`\`\`

- **Right operand first.** For \`10 - 4\` the code pushes 10, then 4, so 4 is on top. The first pop must be \`b\`. Swap them and you get \`4 - 10 = -6\`; addition and multiplication would hide the mistake, which is why the tests use a subtraction.
- **\`NEG\` works in place.** It takes one value and gives one back, so the stack depth doesn’t change.
- **The operand is skipped by \`ip++\`.** In the last test the constant index is 5, the same number as \`RETURN\`. Because \`CONST\` reads its operand with \`code[ip++]\`, the loop never sees that 5 as an opcode.

This is the same shape as Drip’s real loop: one read of the opcode, one branch per instruction, values on a stack.`,
    wrong: [
      {
        code: `${head}
    if (op === OP.CONST) {
      st.push(constants[code[ip++]]);
    } else if (op === OP.NEG) {
      st.push(-st.pop());
    } else if (op === OP.RETURN) {
      return st.pop();
    } else if (op >= 1 && op <= 3) {
      const a = st.pop();
      const b = st.pop();
      st.push(op === OP.ADD ? a + b
        : op === OP.SUB ? a - b
        : a * b);
${tail}`,
        why: 'The first pop gives the value pushed last, the right operand. Calling it `a` makes `10 - 4` come out as `-6`.',
      },
      {
        code: `${head}
    if (op === OP.CONST) {
      st.push(constants[code[ip]]);
    } else if (op === OP.NEG) {
      st.push(-st.pop());
    } else if (op === OP.RETURN) {
      return st.pop();
${binary}
${tail}`,
        why: '`code[ip]` reads the operand but doesn’t move past it, so the loop then runs the operand as an opcode. Use `code[ip++]`.',
      },
    ],
  },
  maxDepth: {
    optional: true,
    title: 'How deep does the stack get?',
    prompt:
      'Using the same opcodes (`CONST` 0 with one operand, `ADD`/`SUB`/`MUL` 1–3, `NEG` 4, `RETURN` 5), write `maxDepth(code)`: the largest number of values that will ever be on the stack while the code runs. You don’t need the constants, only each instruction’s effect on the depth.',
    starter: `function maxDepth(code) {
  return 0;
}`,
    solution: `function maxDepth(code) {
  let depth = 0;
  let max = 0;
  let ip = 0;
  while (ip < code.length) {
    const op = code[ip++];
    if (op === 0) {
      ip++;
      depth++;
    } else if (op >= 1 && op <= 3) {
      depth--;
    } else if (op === 5) {
      depth--;
    }
    max = Math.max(max, depth);
  }
  return max;
}`,
    tests: `test('one constant', () => {
  expect(maxDepth([0, 0, 5])).toBe(1);
});
test('1 + 2 * 3 holds three values', () => {
  expect(maxDepth([0, 0, 0, 1, 0, 2, 3, 1, 5]))
    .toBe(3);
});
test('(1 + 2) * 3 only needs two', () => {
  expect(maxDepth([0, 0, 0, 1, 1, 0, 2, 3, 5]))
    .toBe(2);
});
test('operands are not opcodes', () => {
  // CONST 1, CONST 1, ADD, RETURN
  expect(maxDepth([0, 1, 0, 1, 1, 5])).toBe(2);
});`,
    hints: [
      'Each instruction changes the depth by a fixed amount: `CONST` +1, the binary operators −1 (pop two, push one), `NEG` 0, `RETURN` −1.',
      'Walk the code like the VM does, skipping each `CONST`’s operand byte.',
      'After each instruction, update `max = Math.max(max, depth)`.',
    ],
    walkthrough: `You never need the values, only each instruction’s **stack effect**:

\`\`\`js
if (op === 0) { ip++; depth++; }
else if (op >= 1 && op <= 3) depth--;
else if (op === 5) depth--;
max = Math.max(max, depth);
\`\`\`

Compare the two expression tests. \`1 + 2 * 3\` pushes all three numbers before it can multiply, so it needs three slots. \`(1 + 2) * 3\` adds as soon as it has two values, so two slots are enough. The shape of the expression decides the depth.

Compilers do this calculation for real. Because every instruction’s effect is fixed, the deepest point can be known before the code runs, so a VM can reserve exactly enough stack for each function. Drip’s VM takes the simpler route of one big preallocated array.`,
    wrong: [
      {
        code: `function maxDepth(code) {
  let depth = 0;
  let max = 0;
  for (const op of code) {
    if (op === 0) depth++;
    else if (op >= 1 && op <= 3) {
      depth--;
    }
    max = Math.max(max, depth);
  }
  return max;
}`,
        why: 'Looping over every byte treats operands as opcodes: in `[0, 1, 0, 1, 1, 5]` the operand 1s are counted as ADDs. Step over each `CONST`’s operand.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'The stack holds `[script, 10, 4]` (top on the right) and the next instruction is `OP_SUBTRACT`. What is on the stack afterwards?',
    options: [
      { t: '`[script, -6]`', why: 'That is `4 - 10`. The left operand, 10, is underneath, so it is popped second and used as `a`.' },
      { t: '`[script, 10, 4, 6]`', why: 'Instructions consume their operands: both are popped before the result is pushed.' },
      { t: '`[script, 6]`', correct: true, why: '`b = 4` is popped first, then `a = 10`, and `a - b = 6` is pushed.' },
      { t: '`[6]`', why: 'Only two values are popped. The script in slot 0 stays.' },
    ],
  },
  {
    q: 'What does the instruction pointer hold?',
    options: [
      { t: 'The index of the next byte the VM will read', correct: true, why: 'Every `readByte()` returns `code[ip]` and moves `ip` on.' },
      { t: 'The index of the top of the stack', why: 'That’s `sp`, the stack pointer.' },
      { t: 'The current source line', why: 'Lines are looked up in the chunk’s `lines` array, using `ip`.' },
      { t: 'The number of instructions run so far', why: 'Instructions vary in length, and jumps will move `ip` backwards, so it isn’t a count.' },
    ],
  },
  {
    q: 'Why do most instructions in a stack machine have no operands?',
    options: [
      { t: 'Operands are stored in the constant pool instead', why: 'Only constants live there. ADD’s inputs aren’t constants.' },
      { t: 'The VM guesses them from the source line', why: 'The VM never looks at source.' },
      { t: 'Every instruction works on exactly one value', why: 'ADD works on two.' },
      { t: 'Their inputs are always the values on top of the stack', correct: true, why: 'There is nothing to name: “the top two” is implied by the design.' },
    ],
  },
  {
    q: '`OP_CONSTANT` starts at offset 0 and `OP_ADD` is at offset 4. Which offsets does `ip` hold at the start of each loop iteration for the chunk `0, 0, 0, 1, 18`?',
    options: [
      { t: '0, 1, 2, 3, 4', why: 'That would run each operand as an opcode. `readConstant` moves `ip` past the operand.' },
      { t: '0, 2, 4', correct: true, why: 'Each constant takes two bytes; the ADD is one.' },
      { t: '0, 4', why: 'There are two CONSTANT instructions before the ADD, at 0 and 2.' },
      { t: '4, 2, 0', why: 'The VM runs forward from offset 0.' },
    ],
  },
  {
    q: 'Why does the VM check operand types with `peek` before popping?',
    options: [
      { t: '`pop` can’t return numbers', why: 'It returns any value.' },
      { t: 'If the check fails, the stack is unchanged, and stacked values stay visible to the garbage collector', correct: true, why: 'Nothing is lost mid-instruction, and values on the stack are roots for the collector later.' },
      { t: 'Peeking is how the VM moves `ip`', why: '`peek` only reads the stack. `ip` moves through `readByte`.' },
      { t: 'It makes the error message shorter', why: 'The message is the same either way.' },
    ],
  },
  {
    q: 'Which cost does every bytecode interpreter pay, however well it is written?',
    options: [
      { t: 'Re-parsing the source for each instruction', why: 'Parsing happens once, at compile time.' },
      { t: 'A Map lookup for every operand', why: 'Drip’s VM reads operands straight from the code array.' },
      { t: 'Decoding each instruction and dispatching to the code for it', correct: true, why: 'The V8 team calls these inherent interpreter overheads; removing them means compiling to machine code.' },
      { t: 'Allocating a new array per value', why: 'The stack is one preallocated array; pushing allocates nothing.' },
    ],
  },
];
