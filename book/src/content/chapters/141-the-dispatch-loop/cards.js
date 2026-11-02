// Chapter 140b cards (staged split of chapter 140). Keys are stable ids.

export const prompts = {
  'dispatch-what': {
    q: 'What is the **dispatch loop**?',
    a: 'The VM’s main loop: read the opcode at `ip`, jump to the code for that instruction (here with a `switch`), run it, repeat.',
  },
  'locals-cached': {
    q: 'Why does `run` copy `frame`, `code` and `constants` into local variables before its loop?',
    a: 'Reading a local is cheaper than following `this.frames[...].closure.fn.chunk` on every instruction; they are reloaded only when a call or return changes the running function.',
  },
  'loop-ends': {
    q: 'Drip’s dispatch loop is `for (;;)`. What makes it stop?',
    a: 'A `return` from the outermost function (the script) leaves `run`; a runtime error stops it by throwing.',
  },
  'pop-order': {
    q: 'In the `sub` case, why is the popped value `b`, the right operand?',
    a: 'The right operand was pushed last, so it is on top. Using it as the left operand would compute `4 - 10` for `10 - 4`.',
  },
  'check-before-pop': {
    q: 'Why does `numbers()` check the operands with `peek` rather than popping them first?',
    a: 'If the check fails, the stack is left exactly as it was; and values still on the stack stay visible to the garbage collector.',
  },
  'overwrite-in-place': {
    q: 'The `sub` case pops only `b`. Where does the result go?',
    a: 'Over the left operand’s slot, `stack[this.sp - 1]`: the same effect as popping both and pushing, with one less change to `sp`.',
  },
  'branch-prediction-dispatch': {
    q: 'According to the V8 team, what does fast dispatch to the next bytecode depend on?',
    a: 'Successful branch prediction: the processor guessing correctly where the dispatch jump will land.',
  },
  'ignition-register': {
    q: 'How do V8’s Ignition bytecodes find their inputs, compared with Drip’s?',
    a: 'Ignition is a register machine: bytecodes name registers, with an accumulator as an unwritten input and output. Drip’s take their inputs from the top of a stack.',
  },
};

export const examples = {
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

const OPS = `// Drip's real opcode numbers
const CONST = 0, ADD = 20, SUB = 21;
const MUL = 22, NEG = 32, RETURN = 49;`;

const head = `${OPS}

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
        return st.pop();`;

const tail = `      default:
        throw new Error('bad op ' + op);
    }
  }
}`;

const cases = `      case NEG:
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
      }`;

export const exercises = {
  'stack-run': {
    title: 'A small dispatch loop',
    prompt:
      'Finish `run(chunk)`, a dispatch loop with Drip’s real opcode numbers. `CONST` (0) has a two-byte operand, the constant’s number, which `readShort` reads; it pushes that constant. `ADD`, `SUB` and `MUL` (20, 21, 22) pop two values and push the result. `NEG` (32) pops one value and pushes its negation. `RETURN` (49) pops and returns the top value. `CONST` and `RETURN` are done; add the other cases to the `switch`.',
    starter: `${head}
${tail}`,
    solution: `${head}
${cases}
${tail}`,
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
        code: `${head}
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
${tail}`,
        why: 'The first pop gives the value pushed last, the right operand. Calling it `a` makes `10 - 4` come out as `-6`.',
      },
      {
        code: `${head}
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
${tail}`,
        why: 'With no `break` after `NEG`, it falls through into the arithmetic block and pops two more values. Every case must end with `break` (or `return`).',
      },
    ],
  },
  'checked-sub': {
    optional: true,
    title: 'Check before you pop',
    prompt:
      'Write `sub(st)`, the `sub` case on its own: `st` is the stack (an array, top at the end). If the top two values are both numbers, replace them with their difference (left minus right). If not, throw an `Error` whose message is `cannot use \'-\' here`, and leave `st` exactly as it was. Do it the VM’s way: look first, then change.',
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
    q: 'What happens in one turn of Drip’s dispatch loop, in order?',
    options: [
      { t: 'Run the case, then read the opcode for it', why: 'The case cannot be chosen before the opcode is read.' },
      { t: 'Count the instruction, read the opcode at `ip` and move `ip` on, then jump to its `case` and run it', correct: true, why: 'Fetch, dispatch, execute, then `break` back to the top.' },
      { t: 'Look the opcode up in the constant pool, then run it', why: 'Opcodes are in `code`; the pool holds values.' },
      { t: 'Parse the next statement, then run it', why: 'Parsing happened once, at compile time. The VM only sees bytes.' },
    ],
  },
  {
    q: 'The stack holds `[script, 10, 4]` and `sub` runs. What is in the array slot that held 10 afterwards?',
    options: [
      { t: '`10`, untouched', why: 'The result is written into that slot.' },
      { t: '`-6`', why: 'That is `4 - 10`: the right operand is the one popped, and it is subtracted.' },
      { t: '`6`', correct: true, why: '`b = 4` is popped, and `stack[sp - 1]`, the slot that held 10, is overwritten with `10 - 4`.' },
      { t: 'The slot is now free and `6` is pushed above it', why: 'The left operand is not popped; its slot is reused.' },
    ],
  },
  {
    q: 'Why does `numbers()` use `peek` instead of `pop`?',
    options: [
      { t: '`pop` cannot return numbers', why: 'It returns any value.' },
      { t: 'Peeking is how the VM moves `ip`', why: '`peek` only reads the stack. `ip` moves through `readByte` and `readShort`.' },
      { t: 'It makes the error message shorter', why: 'The message is the same either way.' },
      { t: 'If the check fails, the stack is unchanged, and the values stay visible to the garbage collector', correct: true, why: 'Nothing is lost half-way through an instruction.' },
    ],
  },
  {
    q: 'Which cost does every bytecode interpreter pay, however well it is written?',
    options: [
      { t: 'Decoding each instruction and dispatching to the code for it', correct: true, why: 'The V8 team call these inherent interpreter overheads; removing them means compiling to machine code, as Sparkplug does.' },
      { t: 'Re-parsing the source for each instruction', why: 'Parsing happens once, at compile time.' },
      { t: 'A Map lookup for every operand', why: 'Drip’s VM reads operands straight from the code array.' },
      { t: 'Allocating a new array for every value', why: 'The stack is one array made up front; pushing allocates nothing.' },
    ],
  },
  {
    q: 'Why does a register machine like V8’s Ignition run fewer instructions than a stack machine for the same expression?',
    options: [
      { t: 'Its instructions have no operands at all', why: 'It is the other way round: its instructions name the registers they use.' },
      { t: 'It skips the dispatch step', why: 'Ignition dispatches every bytecode too.' },
      { t: 'Each instruction can name where its inputs are, and the accumulator keeps in-between results, so values need not be pushed and popped one by one', correct: true, why: 'Fewer, larger instructions mean fewer turns of the dispatch loop, at the cost of a compiler that assigns registers.' },
      { t: 'It runs on the real CPU’s registers', why: 'Ignition’s registers are virtual: slots in the interpreter’s stack frame.' },
    ],
  },
];
