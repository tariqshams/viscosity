// Chapter 74 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'stack-machine-what': {
    q: 'What is a **stack machine**?',
    a: 'A VM whose instructions pop their inputs from a value stack and push their results back onto it.',
  },
  'why-no-operands': {
    q: 'Why does an `add` instruction need no operand bytes in a stack machine?',
    a: 'Its inputs are always the top two values on the stack, so there is nothing to name.',
  },
  'brackets-depth': {
    q: 'On a stack machine, why does `(1 + 2) * 3` need only two stack slots, when `1 + 2 * 3` needs three?',
    a: 'The sum is finished (two values become one) before the 3 is pushed; in `1 + 2 * 3` all three numbers must wait before the multiply can run.',
  },
  'ip-what': {
    q: 'What does a VM’s **instruction pointer** hold?',
    a: 'The index in the code of the next byte to read.',
  },
  'ip-after-constant': {
    q: 'An instruction made of an opcode and a two-byte operand starts at offset 4. Where is `ip` when it finishes?',
    a: 'At 7: one byte for the opcode and two for the operand.',
  },
  'dispatch-what': {
    q: 'What is a VM’s **dispatch loop**?',
    a: 'Its main loop: read the opcode at `ip`, jump to the code for that instruction (for example with a `switch`), run it, repeat.',
  },
  'pop-order': {
    q: 'In a stack machine’s subtract instruction, why is the first value popped the right operand?',
    a: 'The right operand was pushed last, so it is on top; using it as the left operand would compute `4 - 10` for `10 - 4`.',
  },
  'ignition-register': {
    q: 'How do V8’s Ignition bytecodes find their inputs, compared with a stack machine’s?',
    a: 'Ignition is a register machine: bytecodes name registers, with an accumulator as an unwritten input and output; a stack machine’s instructions take theirs from the top of a stack.',
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
  'errors-vm': {
    title: 'Which check stops the program?',
    lang: 'drip-vm',
    expectError: true,
    code: `print 10 - 4;
print "con" + "cat";
print 2 * 3 < 7;
print 10 - "a";
print "never printed";`,
  },
};

export const exercises = {
  maxDepth: {
    optional: true,
    title: 'How deep does the stack get?',
    prompt: 'Using Drip’s real opcodes (`CONST` 0, followed by two operand bytes; `NONE` 1; `POP` 4; `ADD`, `SUB`, `MUL` 20 to 22; `NEG` 32; `PRINT` 33; `RETURN` 49, none of these with operands), write `maxDepth(code)`: the largest number of values that will ever be on the stack while the code runs, starting from an empty stack. You do not need the constants, only each instruction’s effect on the depth.',
    starter: `// Drip's real opcode numbers
const CONST = 0, NONE = 1, POP = 4;
const ADD = 20, SUB = 21, MUL = 22;
const NEG = 32, PRINT = 33, RETURN = 49;

function maxDepth(code) {
  return 0;
}`,
    solution: `// Drip's real opcode numbers
const CONST = 0, NONE = 1, POP = 4;
const ADD = 20, SUB = 21, MUL = 22;
const NEG = 32, PRINT = 33, RETURN = 49;

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
        code: `// Drip's real opcode numbers
const CONST = 0, NONE = 1, POP = 4;
const ADD = 20, SUB = 21, MUL = 22;
const NEG = 32, PRINT = 33, RETURN = 49;

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
        code: `// Drip's real opcode numbers
const CONST = 0, NONE = 1, POP = 4;
const ADD = 20, SUB = 21, MUL = 22;
const NEG = 32, PRINT = 33, RETURN = 49;

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
    prompt: 'Write `rpn(text)`, which works out an expression written the stack-machine way, with each operator after its operands and spaces between everything: `rpn("1 2 3 * +")` is `7`, and `rpn("1 2 + 3 *")` is `9`. The operators are `+`, `-`, `*` and `/`; anything else is a number.',
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
  'stack-run': {
    title: 'A small dispatch loop',
    prompt: 'Finish `run(chunk)`, a dispatch loop with Drip’s real opcode numbers. `CONST` (0) has a two-byte operand, the constant’s number, which `readShort` reads; it pushes that constant. `ADD`, `SUB` and `MUL` (20, 21, 22) pop two values and push the result. `NEG` (32) pops one value and pushes its negation. `RETURN` (49) pops and returns the top value. `CONST` and `RETURN` are done; add the other cases to the `switch`.',
    starter: `// Drip's real opcode numbers
const CONST = 0, ADD = 20, SUB = 21;
const MUL = 22, NEG = 32, RETURN = 49;

function run(chunk) {
  const { code, constants } = chunk;
  const st = [];
  let ip = 0;
  const readShort = () => {
    ip += 2;
    return code[ip - 2] * 256
      + code[ip - 1];
  };
  for (;;) {
    const op = code[ip++];
    switch (op) {
      case CONST:
        st.push(constants[readShort()]);
        break;
      case RETURN:
        return st.pop();
      default:
        throw new Error('bad op ' + op);
    }
  }
}`,
    solution: `// Drip's real opcode numbers
const CONST = 0, ADD = 20, SUB = 21;
const MUL = 22, NEG = 32, RETURN = 49;

function run(chunk) {
  const { code, constants } = chunk;
  const st = [];
  let ip = 0;
  const readShort = () => {
    ip += 2;
    return code[ip - 2] * 256
      + code[ip - 1];
  };
  for (;;) {
    const op = code[ip++];
    switch (op) {
      case CONST:
        st.push(constants[readShort()]);
        break;
      case RETURN:
        return st.pop();
      case NEG:
        st.push(-st.pop());
        break;
      case ADD:
      case SUB:
      case MUL: {
        const b = st.pop();
        const a = st.pop();
        st.push(op === ADD ? a + b
          : op === SUB ? a - b
          : a * b);
        break;
      }
      default:
        throw new Error('bad op ' + op);
    }
  }
}`,
    tests: `test('a lone constant', () => {
  const ch = { code: [0, 0, 0, 49],
    constants: [4.5] };
  expect(run(ch)).toBe(4.5);
});
test('1 + 2 * 3', () => {
  const ch = {
    code: [0, 0, 0, 0, 0, 1, 0, 0, 2,
      22, 20, 49],
    constants: [1, 2, 3],
  };
  expect(run(ch)).toBe(7);
});
test('10 - 4 pops in the right order', () => {
  const ch = { code: [0, 0, 0, 0, 0, 1, 21, 49],
    constants: [10, 4] };
  expect(run(ch)).toBe(6);
});
test('-(2 + 3) * 2', () => {
  const ch = {
    code: [0, 0, 0, 0, 0, 1, 20, 32,
      0, 0, 2, 22, 49],
    constants: [2, 3, 2],
  };
  expect(run(ch)).toBe(-10);
});
test('an operand of 49 is not RETURN', () => {
  const ch = { code: [0, 0, 49, 32, 49],
    constants: [] };
  ch.constants[49] = 42;
  expect(run(ch)).toBe(-42);
});`,
    hints: [
      'Each new opcode gets its own `case` in the `switch`. What does each one take off the stack, and what does it put back?',
      '`NEG` pops one value and pushes its negation. The three arithmetic opcodes can share one block (`case ADD: case SUB: case MUL: { ... }`): pop **twice**, and remember which value comes off first.',
      'In the shared block, pop `b` first (the right operand), then `a`, and push `a + b`, `a - b` or `a * b` depending on `op`; end each case with `break`.',
    ],
    walkthrough: `**How to think about it.** A dispatch loop is a list of “if the opcode is this, do that”, so the job is to write down, for each opcode, what it does to the stack. \`NEG\` takes one value and gives one back. \`ADD\`, \`SUB\` and \`MUL\` each take two and give one back, and differ only in the arithmetic, so they can share one block of code. The only subtle point is the order of the two pops: the right operand was pushed last, so it comes off first.

**The solution, line by line.**

- \`case NEG:\` starts the code for opcode 32.
- \`st.push(-st.pop());\` pops the top value, negates it and pushes the result; the stack is the same height afterwards.
- \`break;\` leaves the \`switch\`, so the loop goes round for the next opcode. Without it, the code would *fall through* into the next case and run that too.
- \`case ADD: case SUB: case MUL: {\` lists three cases with no code between them, so all three opcodes run the block that follows. The braces give the block its own scope for \`a\` and \`b\`.
- \`const b = st.pop();\` takes the right operand, which is on top.
- \`const a = st.pop();\` takes the left operand from under it.
- \`st.push(op === ADD ? a + b : op === SUB ? a - b : a * b);\` picks the arithmetic with two \`? :\` tests and pushes the answer.
- \`break;\` and \`}\` end the shared block.

**Following a test.** For \`-(2 + 3) * 2\` the code is \`const 0, const 1, add, neg, const 2, mul, return\`: push 2 and 3, add to 5, negate to -5, push 2, multiply to -10, return it. In the last test the constant number is \`0, 49\`, and its low byte is 49, the same number as \`RETURN\`; because \`readShort\` moves \`ip\` past both operand bytes, the loop never sees that 49 as an opcode.

**Common wrong attempts.**

- Popping into \`a\` first computes \`b - a\`: \`10 - 4\` comes out as -6. Addition and multiplication hide the mistake, which is why the tests use a subtraction.
- Forgetting \`break\` after \`NEG\` falls through into the arithmetic block, which pops two more values.
- Reading the constant number with one byte (\`code[ip++]\`) is the layout of an older, one-byte format: it reads the high byte as the number and then runs the low byte as an opcode.`,
    wrong: [
      {
        code: `// Drip's real opcode numbers
const CONST = 0, ADD = 20, SUB = 21;
const MUL = 22, NEG = 32, RETURN = 49;

function run(chunk) {
  const { code, constants } = chunk;
  const st = [];
  let ip = 0;
  const readShort = () => {
    ip += 2;
    return code[ip - 2] * 256
      + code[ip - 1];
  };
  for (;;) {
    const op = code[ip++];
    switch (op) {
      case CONST:
        st.push(constants[readShort()]);
        break;
      case RETURN:
        return st.pop();
      case NEG:
        st.push(-st.pop());
        break;
      case ADD:
      case SUB:
      case MUL: {
        const a = st.pop();
        const b = st.pop();
        st.push(op === ADD ? a + b
          : op === SUB ? a - b
          : a * b);
        break;
      }
      default:
        throw new Error('bad op ' + op);
    }
  }
}`,
        why: 'The first pop gives the value pushed last, the right operand. Calling it `a` makes `10 - 4` come out as `-6`.',
      },
      {
        code: `// Drip's real opcode numbers
const CONST = 0, ADD = 20, SUB = 21;
const MUL = 22, NEG = 32, RETURN = 49;

function run(chunk) {
  const { code, constants } = chunk;
  const st = [];
  let ip = 0;
  const readShort = () => {
    ip += 2;
    return code[ip - 2] * 256
      + code[ip - 1];
  };
  for (;;) {
    const op = code[ip++];
    switch (op) {
      case CONST:
        st.push(constants[readShort()]);
        break;
      case RETURN:
        return st.pop();
      case NEG:
        st.push(-st.pop());
      case ADD:
      case SUB:
      case MUL: {
        const b = st.pop();
        const a = st.pop();
        st.push(op === ADD ? a + b
          : op === SUB ? a - b
          : a * b);
        break;
      }
      default:
        throw new Error('bad op ' + op);
    }
  }
}`,
        why: 'With no `break` after `NEG`, it falls through into the arithmetic block and pops two more values. Every case must end with `break` (or `return`).',
      },
    ],
  },
  'checked-sub': {
    optional: true,
    title: 'Check before you pop',
    prompt: 'Write `sub(st)`, the `sub` case on its own: `st` is the stack (an array, top at the end). If the top two values are both numbers, replace them with their difference (left minus right). If not, throw an `Error` whose message is `cannot use \'-\' here`, and leave `st` exactly as it was. Do it the VM’s way: look first, then change.',
    starter: `function sub(st) {
  const b = st.pop();
  const a = st.pop();
  st.push(a - b);
}`,
    solution: `function sub(st) {
  const a = st[st.length - 2];
  const b = st[st.length - 1];
  if (typeof a !== 'number' ||
      typeof b !== 'number') {
    throw new Error(
      "cannot use '-' here");
  }
  st.pop();
  st[st.length - 1] = a - b;
}`,
    tests: `test('10 - 4', () => {
  const st = ['script', 10, 4];
  sub(st);
  expect(st).toEqual(['script', 6]);
});
test('a string throws', () => {
  const st = ['script', 10, 'a'];
  expect(() => sub(st)).toThrow();
});
test('the stack is untouched after an error', () => {
  const st = ['script', 'a', 4];
  try { sub(st); } catch (e) {}
  expect(st).toEqual(['script', 'a', 4]);
});`,
    hints: [
      'Two jobs: decide whether the operation is allowed, then do it. Which order keeps the stack safe if it is not allowed?',
      'Read the two values without removing them: the top is `st[st.length - 1]`, the one under it `st[st.length - 2]`. Use `typeof` to check each.',
      'If either is not a number, throw. Otherwise `st.pop()` the right operand and overwrite the new top, `st[st.length - 1]`, with `a - b`.',
    ],
    walkthrough: `**How to think about it.** The starter pops first and asks questions never; if the values are wrong, it has already destroyed them. The VM’s rule is to *look* first (peek), decide, and only then change the stack. That way a failing instruction leaves everything as it found it, which makes error reports easier to trust and, in the real VM, keeps every value visible to the garbage collector.

**The solution, line by line.**

- \`const a = st[st.length - 2];\` peeks at the left operand, one below the top, without removing it (\`peek(1)\` in the VM).
- \`const b = st[st.length - 1];\` peeks at the right operand, the top (\`peek(0)\`).
- \`if (typeof a !== 'number' || typeof b !== 'number') {\` asks whether either one is not a number.
- \`throw new Error(...)\` stops with an error, and since nothing has been popped, \`st\` is unchanged.
- \`st.pop();\` removes the right operand only once we know the work is allowed.
- \`st[st.length - 1] = a - b;\` overwrites the left operand’s slot with the result, exactly as the real case does.

**Common wrong attempts.** Popping both values, checking, and throwing leaves the stack two values shorter: the third test catches that. Checking with \`typeof\` after the pops has the same problem, however correct the check itself is.`,
    wrong: [
      {
        code: `function sub(st) {
  const b = st.pop();
  const a = st.pop();
  if (typeof a !== 'number' ||
      typeof b !== 'number') {
    throw new Error(
      "cannot use '-' here");
  }
  st.push(a - b);
}`,
        why: 'The check is right but comes after the pops, so a failing call leaves the stack two values short. Peek first, pop after.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A stack VM’s stack holds `[script, 10, 4]` (top on the right) and the next instruction is `sub` (left operand minus right). What is on the stack afterwards?',
    options: [
      {
        t: '`[script, -6]`',
        why: 'That is `4 - 10`. The left operand, 10, is underneath, so it is popped second.',
      },
      {
        t: '`[script, 10, 4, 6]`',
        why: 'Instructions consume their inputs: both are taken before the result is pushed.',
      },
      {
        t: '`[script, 6]`',
        correct: true,
        why: 'The right operand, 4, is on top; the result is `10 - 4`.',
      },
      {
        t: '`[6]`',
        why: 'Only two values are taken. The script in slot 0 stays.',
      },
    ],
  },
  {
    q: 'For the Drip chunk `0, 0, 0, 0, 0, 1, 20` (`const 0`, `const 1`, `add`; const has a two-byte operand), which values does `ip` hold at the start of each instruction?',
    options: [
      {
        t: '0, 1, 2, 3, 4, 5, 6',
        why: 'That would run each operand byte as an opcode. `readShort` moves `ip` past the two operand bytes.',
      },
      {
        t: '0, 2, 4',
        why: 'That is a VM with one-byte constant numbers. Here each `const` is three bytes.',
      },
      {
        t: '0, 6',
        why: 'There are two `const` instructions before the `add`, at 0 and 3.',
      },
      {
        t: '0, 3, 6',
        correct: true,
        why: 'Each `const` takes three bytes; the `add` is one.',
      },
    ],
  },
  {
    q: 'What happens in one turn of Drip’s dispatch loop, in order?',
    options: [
      {
        t: 'Run the case, then read the opcode for it',
        why: 'The case cannot be chosen before the opcode is read.',
      },
      {
        t: 'Count the instruction, read the opcode at `ip` and move `ip` on, then jump to its `case` and run it',
        correct: true,
        why: 'Fetch, dispatch, execute, then `break` back to the top.',
      },
      {
        t: 'Look the opcode up in the constant pool, then run it',
        why: 'Opcodes are in `code`; the pool holds values.',
      },
      {
        t: 'Parse the next statement, then run it',
        why: 'Parsing happened once, at compile time. The VM only sees bytes.',
      },
    ],
  },
  {
    q: 'Why does a register machine like V8’s Ignition run fewer instructions than a stack machine for the same expression?',
    options: [
      {
        t: 'Its instructions have no operands at all',
        why: 'It is the other way round: its instructions name the registers they use.',
      },
      {
        t: 'It skips the dispatch step',
        why: 'Ignition dispatches every bytecode too.',
      },
      {
        t: 'Each instruction can name where its inputs are, and the accumulator keeps in-between results, so values need not be pushed and popped one by one',
        correct: true,
        why: 'Fewer, larger instructions mean fewer turns of the dispatch loop, at the cost of a compiler that assigns registers.',
      },
      {
        t: 'It runs on the real CPU’s registers',
        why: 'Ignition’s registers are virtual: slots in the interpreter’s stack frame.',
      },
    ],
  },
];
