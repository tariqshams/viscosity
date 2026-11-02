// Chapter 137 cards (the second half of a split chapter). Keys are stable ids: never rename them.

export const prompts = {
  'no-recursion': {
    q: 'The tiny VM computes `1 + 2 * 3` without something the tree-walker needed for the same expression. What?',
    a: 'Recursion: it is one loop over a flat array, with no call per node and no node kind to switch on.',
  },
  'why-virtual': {
    q: 'Why is a bytecode interpreter called a *virtual* machine?',
    a: 'It works like a processor running machine code (fetch, decode, execute), but the processor and its instruction set are made of software.',
  },
  'vm-what': {
    q: 'What does a **virtual machine** do, in one sentence?',
    a: 'It runs bytecode: a loop that fetches the next instruction, decodes its opcode, and executes it.',
  },
  'decode-what': {
    q: 'What does *decoding* an instruction tell the VM?',
    a: 'Which instruction it is, and so how many operand bytes follow it.',
  },
  'sub-pops': {
    q: 'In the tiny VM’s `SUB`, why is the first value popped stored in `b`, the right operand?',
    a: 'The right operand was pushed last, so it is on top. Popping it into `a` would compute `4 - 10` for `10 - 4`.',
  },
  'for-ever': {
    q: 'Drip’s VM loops with `for (;;)`. What ends the loop?',
    a: 'Nothing in the loop header: the `return` instruction at the end of the script returns from it (or a runtime error stops it).',
  },
  'vm-faster-by': {
    q: 'In this book’s benchmark run, how much faster was the VM than the tree-walker at best, and on how many of the ten programs was it slower?',
    a: 'At most about 1.3 times faster (`method_calls`), and slower on four programs.',
  },
  'slower-lesson': {
    q: 'Both Drip engines run on V8. Why does that shrink the VM’s advantage?',
    a: 'V8 already compiles the tree-walker’s hot code to machine code and gives it fast built-in objects and Maps, which the VM rebuilds in TypeScript.',
  },
};

export const examples = {
  'tiny-vm': {
    title: 'A whole VM, three opcodes',
    code: `const PUSH = 0, ADD = 1, MUL = 2;
// 1 + 2 * 3, flattened:
const code = [
  PUSH, 1, PUSH, 2, PUSH, 3, MUL, ADD,
];

const st = [];
let ip = 0;
while (ip < code.length) {
  const op = code[ip++];
  if (op === PUSH) {
    st.push(code[ip++]);
  } else {
    const b = st.pop();
    const a = st.pop();
    st.push(op === ADD ? a + b : a * b);
  }
}
console.log(st.pop()); // 7`,
  },
  'tiny-vm-sub': {
    title: 'Adding SUB: the order of the pops',
    code: `const PUSH = 0, ADD = 1, SUB = 2;
// 10 - 4, flattened:
const code = [PUSH, 10, PUSH, 4, SUB];

const st = [];
let ip = 0;
while (ip < code.length) {
  const op = code[ip++];
  if (op === PUSH) {
    st.push(code[ip++]);
  } else {
    const b = st.pop(); // 4: the top
    const a = st.pop(); // 10
    st.push(op === ADD ? a + b : a - b);
  }
}
console.log(st.pop()); // 6`,
  },
  'fib-vm': {
    title: 'Drip on the bytecode VM',
    lang: 'drip-vm',
    code: `fn fib(n) {
  if n < 2 { return n; }
  return fib(n - 1) + fib(n - 2);
}

print fib(20);
print "same Drip, new engine";`,
  },
};

const TINY = (negCase) => `const PUSH = 0, ADD = 1, MUL = 2;
const NEG = 3;

function run(code) {
  const st = [];
  let ip = 0;
  while (ip < code.length) {
    const op = code[ip++];
    if (op === PUSH) {
      st.push(code[ip++]);
${negCase}    } else {
      const b = st.pop();
      const a = st.pop();
      st.push(op === ADD
        ? a + b : a * b);
    }
  }
  return st.pop();
}`;

export const exercises = {
  countInstrs: {
    title: 'Counting instructions, not bytes',
    prompt:
      'In this bytecode, as in Drip’s real VM, opcode `0` (CONST) is followed by **two** operand bytes, and every other opcode (`20` = ADD, `22` = MUL, `33` = PRINT) has none. Write `countInstrs(code)`, which returns how many *instructions* the array holds. `[0, 0, 1, 0, 0, 2, 20]` is three instructions in seven bytes.',
    starter: `function countInstrs(code) {
  return code.length;
}`,
    solution: `function countInstrs(code) {
  let n = 0;
  let ip = 0;
  while (ip < code.length) {
    const op = code[ip];
    ip += op === 0 ? 3 : 1;
    n++;
  }
  return n;
}`,
    tests: `test('no code', () => {
  expect(countInstrs([])).toBe(0);
});
test('1 + 2', () => {
  expect(countInstrs([0, 0, 1, 0, 0, 2, 20]))
    .toBe(3);
});
test('operands that look like opcodes', () => {
  // const 20, const 22, mul: the operand
  // bytes 0, 20 and 22 are not opcodes
  expect(countInstrs([0, 0, 20, 0, 0, 22, 22]))
    .toBe(3);
});
test('print 7', () => {
  expect(countInstrs([0, 0, 0, 33])).toBe(2);
});`,
    hints: [
      'You cannot count bytes, or count the zeros: an operand byte can hold any number, including 0 or 20.',
      'Walk the array with an index, the way the VM does. At each instruction, the opcode tells you how far it is to the next one.',
      'Use `ip += op === 0 ? 3 : 1;` and count one instruction per step of the loop.',
    ],
    walkthrough: `**How to think about it.** Instructions have different lengths, so the only safe way through the array is the way the machine itself goes: start at the first byte, which is certainly an opcode, decide from it how long this instruction is, and jump to the next one. Nothing in a byte says whether it is an opcode or an operand; only its position in that walk does.

**The solution, line by line.**

- \`let n = 0;\` counts instructions; \`let ip = 0;\` is our position, starting at the first opcode.
- \`while (ip < code.length) {\` keeps going until we step off the end.
- \`const op = code[ip];\` reads the byte at our position, which the walk guarantees is an opcode.
- \`ip += op === 0 ? 3 : 1;\` moves past the whole instruction: three bytes for a CONST (the opcode and its two operand bytes), one for anything else.
- \`n++;\` counts the instruction we just stepped over, and \`return n;\` gives the total.

For \`[0, 0, 20, 0, 0, 22, 22]\`: at 0 we find CONST and jump to 3; at 3, CONST again, jump to 6; at 6, MUL, jump to 7, the end. Three instructions, and the bytes 20 and 22 inside the operands were never mistaken for ADD or MUL.

**Common wrong attempts.**

- Counting the non-zero bytes, or the zeros, fails at once, because an operand can be any value.
- Jumping by 2 after a CONST is the old one-byte layout: it lands on the second operand byte and reads it as an opcode.

Drip’s real VM never needs to count like this, because it decodes as it runs; however, a disassembler (the chapter *Reading bytecode back*) has exactly this problem, and solves it the same way.`,
    wrong: [
      {
        code: `function countInstrs(code) {
  return code.filter((b) => b !== 0)
    .length;
}`,
        why: 'This decides by value what each byte is. Operands can be any value, so bytes must be decoded from the start, instruction by instruction.',
      },
      {
        code: `function countInstrs(code) {
  let n = 0;
  let ip = 0;
  while (ip < code.length) {
    ip += code[ip] === 0 ? 2 : 1;
    n++;
  }
  return n;
}`,
        why: 'A CONST here is three bytes, not two: stepping by 2 lands on the second operand byte and counts it as an instruction.',
      },
    ],
  },
  tinyNeg: {
    optional: true,
    title: 'A one-value instruction',
    prompt:
      'Extend the tiny VM’s `run(code)` with a fourth opcode, `NEG` (3), which takes the newest value off the stack and pushes its negation. `PUSH`, `ADD` and `MUL` work already; at the moment `NEG` falls into the `else` branch and is treated as a multiplication.',
    starter: TINY(''),
    solution: TINY(`    } else if (op === NEG) {
      st.push(-st.pop());
`),
    tests: `test('-5', () => {
  expect(run([0, 5, 3])).toBe(-5);
});
test('-(1 + 2)', () => {
  expect(run([0, 1, 0, 2, 1, 3])).toBe(-3);
});
test('-2 * 3', () => {
  expect(run([0, 2, 3, 0, 3, 2])).toBe(-6);
});
test('an operand of 3 is not a NEG', () => {
  expect(run([0, 3, 3])).toBe(-3);
});`,
    hints: [
      'NEG needs one value, not two. Which value is it, and where is it?',
      'Add a branch before the `else`: `else if (op === NEG) { ... }`. Inside it, pop one value and push its negation.',
      'The whole branch is `st.push(-st.pop());`.',
    ],
    walkthrough: `**How to think about it.** Every instruction in a stack machine has a fixed effect on the stack: \`PUSH\` adds one value; \`ADD\` and \`MUL\` take two and give back one; a negation takes one and gives back one. So \`NEG\` must pop exactly one value (the newest, which is the operand that was just computed) and push one result. It must also be checked *before* the \`else\`, because the \`else\` catches every opcode it does not recognise and treats it as two-value arithmetic.

**The solution, line by line.**

- \`} else if (op === NEG) {\` adds a branch for opcode 3, placed after the \`PUSH\` case and before the catch-all \`else\`.
- \`st.push(-st.pop());\` pops the top value, negates it with unary minus, and pushes the result. The stack ends up the same height as before, which is the right effect for a one-value instruction.

For \`[0, 2, 3, 0, 3, 2]\` (that is \`-2 * 3\`): \`PUSH 2\`, then \`NEG\` turns it into -2, \`PUSH 3\`, \`MUL\` gives -6. In the last test, \`[0, 3, 3]\`, the first 3 is \`PUSH\`'s operand and is read by \`code[ip++]\` inside the \`PUSH\` branch, so only the second 3 is run as \`NEG\`.

**Common wrong attempts.**

- Popping two values for \`NEG\` takes away a value that belongs to an outer expression (or, here, pops \`undefined\` from an empty stack).
- Adding the branch after the \`else\` is impossible, and adding the check inside the \`else\` after the two pops is too late: by then two values are gone.`,
    wrong: [
      {
        code: TINY(`    } else if (op === NEG) {
      st.pop();
      st.push(-st.pop());
`),
        why: 'This pops two values for a one-value instruction, so the operand is thrown away and the value under it (or `undefined`) is negated.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'The tiny VM reads opcode `PUSH` at offset 2. Where is `ip` when the next turn of the loop begins?',
    options: [
      { t: '3', why: 'That is where `PUSH`’s operand is. The `PUSH` branch reads it with `code[ip++]`, which moves `ip` past it.' },
      { t: '4', correct: true, why: 'One byte for the opcode, one for the operand: the next opcode is at 4.' },
      { t: '2', why: '`code[ip++]` moved `ip` on as soon as the opcode was read.' },
      { t: 'It depends on the value pushed', why: 'Only the opcode decides how long an instruction is, never the value in its operand.' },
    ],
  },
  {
    q: 'Why is a bytecode interpreter called a *virtual* machine?',
    options: [
      { t: 'It only runs inside a browser', why: 'Drip’s VM runs in Node too. The name is not about where it runs.' },
      { t: 'It runs on a cloud virtual machine', why: 'A different meaning of the word. The benchmarks happened to run on one, but that is not the reason for the name.' },
      { t: 'It fetches, decodes and executes instructions like a processor, but it is a program', correct: true, why: 'A pretend processor, with an instruction set designed for the language.' },
      { t: 'It compiles to machine code first', why: 'That would be a compiler to machine code, like V8’s Sparkplug. A VM interprets bytecode.' },
    ],
  },
  {
    q: 'With `PUSH = 0, ADD = 1, SUB = 2`, what does the tiny VM leave on its stack for the code `[0, 9, 0, 2, 2]`?',
    options: [
      { t: '`7`', correct: true, why: 'Push 9, push 2, then SUB pops b = 2 and a = 9 and pushes 9 - 2.' },
      { t: '`-7`', why: 'That would be `2 - 9`: popping the top value into `a` instead of `b`.' },
      { t: '`11`', why: 'Opcode 2 is SUB here, not ADD.' },
      { t: '`2`', why: 'The last byte is the opcode SUB, not a value: it is never pushed.' },
    ],
  },
  {
    q: 'Drip’s real VM loops with `for (;;)`. How does a program stop?',
    options: [
      { t: 'The loop checks `ip < code.length` each time', why: 'That is the tiny VM. `for (;;)` has no test at all.' },
      { t: 'It runs a fixed number of instructions', why: '`instructionsExecuted` only counts them; it never stops the loop.' },
      { t: 'The `return` instruction at the end of the script leaves the loop', correct: true, why: 'Every script ends with `none, return`, and returning from the last call returns from `run` (a runtime error also ends it, by throwing).' },
      { t: 'The garbage collector stops it', why: 'The collector frees memory; it has nothing to do with when the program ends.' },
    ],
  },
  {
    q: 'In this book’s benchmark run the VM was slower than the tree-walker on four programs. What is the fair conclusion?',
    options: [
      { t: 'Bytecode is slower than walking a tree', why: 'The same VM was faster on the other six programs.' },
      { t: 'A better design is not faster at everything; one run points at suspects, such as the VM’s own objects and tables in TypeScript', correct: true, why: 'The losers are the object-heavy programs, which fits the suspicion that the VM rebuilds what V8 gives the tree-walker for free; a later chapter tests it.' },
      { t: 'The measurement must be broken', why: 'Nothing suggests that. It is a real result that needs explaining.' },
      { t: 'The tree-walker caches its results', why: 'It does no such thing: it walks the tree every time.' },
    ],
  },
];
