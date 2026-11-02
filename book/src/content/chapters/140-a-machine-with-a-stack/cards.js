// Chapter 140 cards. Keys are stable ids: never rename them.

export const prompts = {
  'stack-machine-what': {
    q: 'What is a **stack machine**?',
    a: 'A VM whose instructions pop their inputs from a value stack and push their results back onto it.',
  },
  'sp-means': {
    q: 'In Drip’s VM, what does `sp` hold?',
    a: 'The index of the next free slot in the stack array, which is also how many values are on it.',
  },
  'why-no-operands': {
    q: 'Why does `add` need no operand bytes in a stack machine?',
    a: 'Its inputs are always the top two values on the stack, so there is nothing to name.',
  },
  'peek-vs-pop': {
    q: 'What is the difference between `peek(0)` and `pop()`?',
    a: 'Both give the top value, but `peek` leaves it on the stack (and `sp` unchanged); `pop` removes it.',
  },
  'brackets-depth': {
    q: 'Why does `(1 + 2) * 3` need only two stack slots, when `1 + 2 * 3` needs three?',
    a: 'The sum is finished (two values become one) before the 3 is pushed; in `1 + 2 * 3` all three numbers must wait before `mul` can run.',
  },
  'ip-what': {
    q: 'What does the **instruction pointer** hold?',
    a: 'The index in the code of the next byte to read.',
  },
  'ip-after-constant': {
    q: 'A `const` starts at offset 4. Where is `ip` when it finishes?',
    a: 'At 7: one byte for the opcode and two for the constant number.',
  },
  'jump-moves-ip': {
    q: 'What does a jump instruction actually do?',
    a: 'It changes `ip` on purpose (adds or subtracts a distance), so the next instruction run is somewhere other than straight after it.',
  },
};

export const examples = {
  'arith-vm': {
    title: 'Arithmetic on the stack machine',
    lang: 'drip-vm',
    code: `print 10 - 4 - 3;
print (1 + 2) * -3;
print 1 + 2 * 3 * 4;
print "con" + "cat";`,
  },
};

const OPS = `// Drip's real opcode numbers
const CONST = 0, NONE = 1, POP = 4;
const ADD = 20, SUB = 21, MUL = 22;
const NEG = 32, PRINT = 33, RETURN = 49;`;

export const exercises = {
  maxDepth: {
    title: 'How deep does the stack get?',
    prompt:
      'Using Drip’s real opcodes (`CONST` 0, followed by two operand bytes; `NONE` 1; `POP` 4; `ADD`, `SUB`, `MUL` 20 to 22; `NEG` 32; `PRINT` 33; `RETURN` 49, none of these with operands), write `maxDepth(code)`: the largest number of values that will ever be on the stack while the code runs, starting from an empty stack. You do not need the constants, only each instruction’s effect on the depth.',
    starter: `${OPS}

function maxDepth(code) {
  return 0;
}`,
    solution: `${OPS}

function maxDepth(code) {
  let depth = 0;
  let max = 0;
  let ip = 0;
  while (ip < code.length) {
    const op = code[ip++];
    if (op === CONST) {
      ip += 2;
      depth++;
    } else if (op === NONE) {
      depth++;
    } else if (op === NEG) {
      // one value in, one out
    } else {
      depth--;
    }
    max = Math.max(max, depth);
  }
  return max;
}`,
    tests: `test('print 7', () => {
  expect(maxDepth([0, 0, 0, 33, 1, 49]))
    .toBe(1);
});
test('1 + 2 * 3 holds three values', () => {
  const c = [0, 0, 0, 0, 0, 1, 0, 0, 2,
    22, 20, 33, 1, 49];
  expect(maxDepth(c)).toBe(3);
});
test('(1 + 2) * 3 needs only two', () => {
  const c = [0, 0, 0, 0, 0, 1, 20,
    0, 0, 2, 22, 33, 1, 49];
  expect(maxDepth(c)).toBe(2);
});
test('operand bytes are not opcodes', () => {
  // const 20, const 1, add, pop
  const c = [0, 0, 20, 0, 0, 1, 20, 4];
  expect(maxDepth(c)).toBe(2);
});
test('-(2 * 3) keeps the depth', () => {
  const c = [0, 0, 0, 0, 0, 1, 22, 32, 4];
  expect(maxDepth(c)).toBe(2);
});`,
    hints: [
      'You never need the values: every instruction changes the depth by a fixed amount. Work out that amount for each opcode first.',
      '`CONST` and `NONE` add one; `NEG` takes one and gives one back, so no change; `ADD`, `SUB` and `MUL` take two and give one (minus one); `POP`, `PRINT` and `RETURN` take one (minus one). Walk the code like the VM, skipping each `CONST`’s two operand bytes.',
      'In the loop: read `op = code[ip++]`; if it is `CONST`, do `ip += 2` and `depth++`; adjust `depth` for the others; then `max = Math.max(max, depth)`.',
    ],
    walkthrough: `**How to think about it.** Running the code would need the constants, but the question is only about *how many* values are on the stack, and every instruction changes that number by the same amount every time it runs. That amount is called its **stack effect**. So write each opcode’s effect down first: \`CONST\` and \`NONE\` push one (+1); \`NEG\` pops one and pushes one (0); \`ADD\`, \`SUB\` and \`MUL\` pop two and push one (−1); \`POP\`, \`PRINT\` and \`RETURN\` pop one (−1). Then walk the code the way the VM does, keeping a running depth and remembering the largest it reaches.

**The solution, line by line.**

- \`let depth = 0; let max = 0; let ip = 0;\` start with an empty stack at the first byte.
- \`while (ip < code.length) {\` visits every instruction.
- \`const op = code[ip++];\` reads the opcode and moves past it, exactly like \`readByte\`.
- \`if (op === CONST) { ip += 2; depth++; }\` skips the two operand bytes (as \`readShort\` does) and counts the pushed value. Skipping is what keeps operand bytes from being read as opcodes.
- \`else if (op === NONE) { depth++; }\` counts the \`none\` that is pushed.
- \`else if (op === NEG) { }\` changes nothing: one value in, one out.
- \`else { depth--; }\` covers every other opcode in the list, which all lower the depth by one.
- \`max = Math.max(max, depth);\` remembers the deepest point after each instruction, and \`return max;\` hands it back.

Compare the two expression tests: \`1 + 2 * 3\` must push all three numbers before it can multiply, so it reaches 3; \`(1 + 2) * 3\` adds as soon as it has two values, so 2 is enough. The shape of the expression decides the depth.

**Why this matters.** Because every instruction’s effect is fixed, the deepest point of a function can be known before it runs, so a VM *could* reserve exactly enough stack for each function. Drip’s VM takes the simpler route of one big preallocated array.

**Common wrong attempts.**

- Looping over every byte (\`for (const op of code)\`) treats operand bytes as opcodes; in the fourth test the operand byte 20 looks like an \`ADD\`.
- Skipping only one operand byte after \`CONST\` is the layout of a VM with one-byte constant numbers; here it lands on the second operand byte.`,
    wrong: [
      {
        code: `${OPS}

function maxDepth(code) {
  let depth = 0;
  let max = 0;
  for (const op of code) {
    if (op === CONST || op === NONE) {
      depth++;
    } else if (op !== NEG) {
      depth--;
    }
    max = Math.max(max, depth);
  }
  return max;
}`,
        why: 'Looping over every byte treats operands as opcodes: the 0s inside a constant number count as extra pushes. Step over each `CONST`’s two operand bytes.',
      },
      {
        code: `${OPS}

function maxDepth(code) {
  let depth = 0;
  let max = 0;
  let ip = 0;
  while (ip < code.length) {
    const op = code[ip++];
    if (op === CONST) {
      ip += 1;
      depth++;
    } else if (op === NONE) {
      depth++;
    } else if (op !== NEG) {
      depth--;
    }
    max = Math.max(max, depth);
  }
  return max;
}`,
        why: 'A constant number here is two bytes, so skipping one lands on the low byte and decodes it as an opcode.',
      },
    ],
  },
  rpn: {
    optional: true,
    title: 'A calculator with an Enter key',
    prompt:
      'Write `rpn(text)`, which works out an expression written the stack-machine way, with each operator after its operands and spaces between everything: `rpn("1 2 3 * +")` is `7`, and `rpn("1 2 + 3 *")` is `9`. The operators are `+`, `-`, `*` and `/`; anything else is a number.',
    starter: `function rpn(text) {
  const st = [];
  for (const t of text.split(' ')) {
    st.push(Number(t));
  }
  return st.pop();
}`,
    solution: `function rpn(text) {
  const st = [];
  for (const t of text.split(' ')) {
    if ('+-*/'.includes(t)) {
      const b = st.pop();
      const a = st.pop();
      if (t === '+') st.push(a + b);
      if (t === '-') st.push(a - b);
      if (t === '*') st.push(a * b);
      if (t === '/') st.push(a / b);
    } else {
      st.push(Number(t));
    }
  }
  return st.pop();
}`,
    tests: `test('one number', () => {
  expect(rpn('42')).toBe(42);
});
test('1 2 3 * + is 7', () => {
  expect(rpn('1 2 3 * +')).toBe(7);
});
test('1 2 + 3 * is 9', () => {
  expect(rpn('1 2 + 3 *')).toBe(9);
});
test('order of the pops', () => {
  expect(rpn('10 4 -')).toBe(6);
  expect(rpn('8 2 /')).toBe(4);
});`,
    hints: [
      'Each piece of text is either a number or an operator. What does a stack machine do with each?',
      'A number is pushed. An operator pops two values, combines them and pushes the result. Which value does the first pop give you?',
      'Pop `b` first (the right operand, pushed last), then `a`, and push `a - b` for `-`. `"+-*/".includes(t)` tells you whether `t` is an operator.',
    ],
    walkthrough: `**How to think about it.** This notation (operators after their operands, often called *reverse Polish notation*) is exactly the order of bytecode: children first, operator last. So the evaluator is a stack machine whose instructions are words instead of bytes: a number is a \`const\`, and an operator is an \`add\` or a \`sub\`.

**The solution, line by line.**

- \`const st = [];\` is the value stack.
- \`for (const t of text.split(' ')) {\` takes the words one at a time, in order, like the VM taking instructions.
- \`if ('+-*/'.includes(t)) {\` checks whether the word is one of the four operators.
- \`const b = st.pop(); const a = st.pop();\` takes the right operand first, because it was pushed last, then the left.
- The four \`if\` lines push the result of the matching operator.
- \`} else { st.push(Number(t)); }\` turns any other word into a number and pushes it.
- \`return st.pop();\` gives the one value left at the end.

For \`"1 2 3 * +"\`: push 1, 2, 3; \`*\` pops 3 and 2 and pushes 6; \`+\` pops 6 and 1 and pushes 7.

**Common wrong attempts.** Popping into \`a\` first gives \`4 - 10\` for \`"10 4 -"\`; addition and multiplication hide the mistake, which is why the last test uses \`-\` and \`/\`.`,
    wrong: [
      {
        code: `function rpn(text) {
  const st = [];
  for (const t of text.split(' ')) {
    if ('+-*/'.includes(t)) {
      const a = st.pop();
      const b = st.pop();
      if (t === '+') st.push(a + b);
      if (t === '-') st.push(a - b);
      if (t === '*') st.push(a * b);
      if (t === '/') st.push(a / b);
    } else {
      st.push(Number(t));
    }
  }
  return st.pop();
}`,
        why: 'The first pop is the right operand, so calling it `a` computes `4 - 10` for `"10 4 -"`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'The stack holds `[script, 10, 4]` (top on the right) and the next instruction is `sub`. What is on the stack afterwards?',
    options: [
      { t: '`[script, -6]`', why: 'That is `4 - 10`. The left operand, 10, is underneath, so it is popped second.' },
      { t: '`[script, 10, 4, 6]`', why: 'Instructions consume their inputs: both are taken before the result is pushed.' },
      { t: '`[script, 6]`', correct: true, why: 'The right operand, 4, is on top; the result is `10 - 4`.' },
      { t: '`[6]`', why: 'Only two values are taken. The script in slot 0 stays.' },
    ],
  },
  {
    q: 'What does the instruction pointer hold?',
    options: [
      { t: 'The index of the top of the stack', why: 'That is `sp - 1`; `sp` is the stack pointer.' },
      { t: 'The index of the next byte the VM will read', correct: true, why: 'Every `readByte()` returns `code[ip]` and moves `ip` on.' },
      { t: 'The current source line', why: 'Lines are looked up in the chunk’s `lines` array, using `ip`.' },
      { t: 'The number of instructions run so far', why: 'Instructions vary in length and jumps move `ip` backwards, so it is not a count.' },
    ],
  },
  {
    q: 'Why do most instructions in a stack machine have no operands?',
    options: [
      { t: 'Their operands are kept in the constant pool instead', why: 'Only constants live there. `add`’s inputs are not constants.' },
      { t: 'The VM works them out from the source line', why: 'The VM never looks at the source.' },
      { t: 'Their inputs are always the values on top of the stack', correct: true, why: 'There is nothing to name: “the top two” is built into the design.' },
      { t: 'Every instruction works on exactly one value', why: '`add` works on two.' },
    ],
  },
  {
    q: 'For the chunk `0, 0, 0, 0, 0, 1, 20` (`const 0`, `const 1`, `add`), which values does `ip` hold at the start of each instruction?',
    options: [
      { t: '0, 1, 2, 3, 4, 5, 6', why: 'That would run each operand byte as an opcode. `readShort` moves `ip` past the two operand bytes.' },
      { t: '0, 2, 4', why: 'That is a VM with one-byte constant numbers. Here each `const` is three bytes.' },
      { t: '0, 6', why: 'There are two `const` instructions before the `add`, at 0 and 3.' },
      { t: '0, 3, 6', correct: true, why: 'Each `const` takes three bytes; the `add` is one.' },
    ],
  },
  {
    q: 'Why does pushing a value onto Drip’s stack never allocate memory?',
    options: [
      { t: 'The array was made at full size, filled with null, when the VM started; push only writes a slot and moves `sp`', correct: true, why: '`new Array(STACK_MAX).fill(null)` makes all 65,536 slots up front.' },
      { t: 'Values are stored in the constant pool instead', why: 'The pool holds the program’s literals; running values live on the stack.' },
      { t: 'JavaScript arrays never allocate', why: 'A growing array does allocate; this one never grows.' },
      { t: 'Each value is copied into the previous slot', why: 'Nothing is copied; `push` writes slot `sp`.' },
    ],
  },
];
