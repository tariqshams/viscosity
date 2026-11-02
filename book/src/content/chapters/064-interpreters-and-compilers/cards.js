// Interpreters and compilers (split from chapter 63). Keys are stable ids.

export const prompts = {
  'interp-def': {
    q: 'What does an interpreter do with a program?',
    a: 'It runs it directly and produces its output.',
  },
  'compiler-def': {
    q: 'Does a compiler run the program it compiles?',
    a: 'No. It translates the program into another form; something else runs the result.',
  },
  'compiler-input': {
    q: 'An interpreter is given a program and its input. What is a compiler given?',
    a: 'Only the program. It never sees the input; the program it writes will read the input later.',
  },
  'compile-once': {
    q: 'Why does compiling pay off for a program that runs a million times?',
    a: 'The translation is done once; every run after that skips reading the source or walking the tree.',
  },
  'why-interp': {
    q: 'Name one strength of interpreting over compiling.',
    a: 'It starts at once (no translation step), it is simpler to write, and its errors point straight at the source.',
  },
  'vm-both': {
    q: 'Drip’s bytecode VM: is it an interpreter or a compiler?',
    a: 'Both. A compiler turns source into bytecode, then an interpreter loop runs the bytecode.',
  },
  'v8-both': {
    q: 'What does V8 do with a function that runs very often?',
    a: 'It compiles it again, with an optimizing compiler, into machine code (after first running it as bytecode in Ignition).',
  },
  'source-to-source': {
    q: 'What is a source-to-source compiler? Give an example.',
    a: 'A compiler whose output is source code in a programming language, such as tsc (TypeScript to JavaScript) or Viscosity (JavaScript to JavaScript).',
  },
};

export const examples = {
  'same-line-vm': {
    title: 'The same program on the bytecode VM',
    lang: 'drip-vm',
    code: `print 1 + 2 * 3;
print (1 + 2) * 3;`,
  },
};

const EXEC = `function exec(code) {
  const st = [];
  for (const ins of code) {
    const [op, arg] = ins.split(' ');
    if (op === 'push') {
      st.push(Number(arg));
    } else {
      const b = st.pop();
      const a = st.pop();
      if (op === 'add') st.push(a + b);
      else st.push(a - b);
    }
  }
  return st.pop();
}
`;

export const exercises = {
  'mini-compile': {
    title: 'The same language, compiled',
    prompt:
      'Last chapter’s tiny language has whole numbers, `+` and `-`, with tokens like `[\'1\', \'+\', \'2\']`. Now make a **compiler** for it. Write `compile(ts)`: it does not compute anything. It returns a list of instructions for a little stack machine. `push N` pushes a number; `add` and `sub` pop two numbers and push the result.\n\n`compile([\'1\', \'+\', \'2\', \'-\', \'4\'])` should return `[\'push 1\', \'push 2\', \'add\', \'push 4\', \'sub\']`. The machine, `exec`, is written for you.',
    starter: `${EXEC}
function compile(ts) {
  // your code here
}

const code = compile(['1', '+', '2']);
console.log(code, exec(code));`,
    solution: `${EXEC}
function compile(ts) {
  const out = ['push ' + ts[0]];
  let i = 1;
  while (i < ts.length) {
    out.push('push ' + ts[i + 1]);
    if (ts[i] === '+') out.push('add');
    else out.push('sub');
    i += 2;
  }
  return out;
}`,
    tests: `test('one number', () => {
  expect(compile(['7'])).toEqual(['push 7']);
});
test('1 + 2 - 4', () => {
  const ts = ['1', '+', '2', '-', '4'];
  expect(compile(ts)).toEqual([
    'push 1', 'push 2', 'add',
    'push 4', 'sub',
  ]);
});
test('running the compiled code', () => {
  const ts = ['5', '-', '3', '-', '1'];
  expect(exec(compile(ts))).toBe(1);
});`,
    hints: [
      'The loop has the same shape as `evaluate` from the last chapter: the first number, then pairs of operator and number.',
      'Instead of updating a total, push strings onto an output array.',
      'The machine needs both numbers on the stack before it can add them, so emit `push` for the right-hand number *before* the `add` or `sub`.',
    ],
    walkthrough: `**How to think about it.** Put \`compile\` next to \`evaluate\` from the last chapter's exercise: the loop is identical, because the shape of the token list has not changed (a number, then pairs of operator and number). What changes is what happens at each step. \`evaluate\` *does* the operation (\`total += n\`); \`compile\` *writes it down* (\`out.push('add')\`). The only new question is the order of the instructions. A stack machine works on whatever is on top of its stack, so before it can add it needs both numbers there: "push 1, push 2, add". Operands first, then the operator.

**The solution, line by line.**

- \`const out = ['push ' + ts[0]];\` starts the program with an instruction that pushes the first number. Here the token can stay a string, because the instruction is text.
- \`let i = 1;\` points at the first operator, as before.
- \`while (i < ts.length) {\` visits each operator in turn.
- \`out.push('push ' + ts[i + 1]);\` first pushes the number to the operator's right, so both operands are now on the stack.
- \`if (ts[i] === '+') out.push('add');\` then writes the operation itself, \`add\` for \`+\`...
- \`else out.push('sub');\` ...and \`sub\` for \`-\`.
- \`i += 2;\` moves on to the next operator, and after the loop \`return out;\` hands back the whole list of instructions.

For \`1 + 2 - 4\` that gives \`push 1, push 2, add, push 4, sub\`. Running it: the stack holds 1, then 1 and 2, then (after \`add\`) 3, then 3 and 4, then (after \`sub\`) -1. Look back at the instructions in this chapter's step-through diagram, \`push 1, push 2, push 3, mul, add\`: the same idea. And once you have the instructions, \`exec\` can run them as many times as you like without scanning again, which is one reason real systems compile.

**Common wrong attempts.**

- Writing the operator before its right-hand number (\`add\`, then \`push 2\`): \`add\` runs with only one number on the stack, pops \`undefined\` for the missing one, and the answer is \`NaN\`.
- Computing the answer inside \`compile\` and returning it: that is \`evaluate\` again. A compiler's output is a program, not a value.`,
    wrong: [
      {
        code: `${EXEC}
function compile(ts) {
  const out = ['push ' + ts[0]];
  let i = 1;
  while (i < ts.length) {
    if (ts[i] === '+') out.push('add');
    else out.push('sub');
    out.push('push ' + ts[i + 1]);
    i += 2;
  }
  return out;
}`,
        why: 'The operator comes before its right-hand number, so `add` runs with only one number on the stack. Push both operands first.',
      },
    ],
  },
  'mini-exec': {
    optional: true,
    title: 'The machine that runs it',
    prompt:
      'Write `exec(code)`, the stack machine that runs the compiler’s output. `code` is an array of instructions: `push N` pushes the number N onto a stack; `add` pops two numbers and pushes their sum; `sub` pops two numbers and pushes the first minus the second (so `push 5, push 3, sub` leaves `2`). At the end, return the number on top of the stack.',
    starter: `function exec(code) {
  // your code here
}

console.log(exec(['push 5', 'push 3',
  'sub']));`,
    solution: `function exec(code) {
  const st = [];
  for (const ins of code) {
    const [op, arg] = ins.split(' ');
    if (op === 'push') {
      st.push(Number(arg));
    } else {
      const b = st.pop();
      const a = st.pop();
      if (op === 'add') st.push(a + b);
      else st.push(a - b);
    }
  }
  return st.pop();
}`,
    tests: `test('one push', () => {
  expect(exec(['push 7'])).toBe(7);
});
test('5 - 3 keeps its order', () => {
  expect(exec(['push 5', 'push 3', 'sub']))
    .toBe(2);
});
test('1 + 2 - 4', () => {
  expect(exec(['push 1', 'push 2', 'add',
    'push 4', 'sub'])).toBe(-1);
});
test('numbers, not strings', () => {
  expect(exec(['push 1', 'push 2', 'add']))
    .toBe(3);
});`,
    hints: [
      'Keep an array as the stack. `push` and `pop` on an array work at its end, which is exactly what a stack needs.',
      'Split each instruction on the space: `\'push 5\'.split(\' \')` gives `[\'push\', \'5\']`. For `push`, turn the second part into a number.',
      'For `add` and `sub`, pop twice. The *first* pop gives the right-hand number (it was pushed last), so pop `b` first, then `a`, and push `a - b`.',
    ],
    walkthrough: `**How to think about it.** A stack is a pile: you can only put things on top and take things off the top. The compiler from the core exercise wrote its instructions so that both numbers are on the pile before the operator that needs them, so the machine never has to look ahead or backwards; it only reads one instruction at a time and does what it says. The one subtle point is order: for \`5 - 3\` the pile has 5 at the bottom and 3 on top, so the first number you take off is the *right*-hand side.

**The solution, line by line.**

- \`const st = [];\` makes the empty stack.
- \`for (const ins of code) {\` visits each instruction in order.
- \`const [op, arg] = ins.split(' ');\` cuts \`'push 5'\` into the operation \`'push'\` and its argument \`'5'\`; for \`'add'\` there is no second part, so \`arg\` is \`undefined\`, which is fine because it is not used.
- \`if (op === 'push') {\` handles the only instruction with an argument...
- \`st.push(Number(arg));\` ...by pushing it as a number, so that \`add\` adds rather than joining strings.
- \`} else {\` covers \`add\` and \`sub\`.
- \`const b = st.pop();\` takes the top value, the right-hand number, and \`const a = st.pop();\` takes the one under it, the left-hand number.
- \`if (op === 'add') st.push(a + b);\` pushes the sum, \`else st.push(a - b);\` the difference, left minus right.
- After the loop, \`return st.pop();\` hands back the value left on top.

Put it next to \`evaluate\` from the last chapter: both are interpreters, one for the sums language and one for the compiler's instructions. Together with \`compile\`, this is a bytecode VM in miniature: compile once, then interpret the instructions.

**Common wrong attempts.**

- Popping in the wrong order (\`const a = st.pop(); const b = st.pop();\`): addition does not care, but \`push 5, push 3, sub\` gives \`3 - 5\`, which is \`-2\`.
- Pushing \`arg\` without \`Number\`: the stack holds strings, so \`add\` gives \`'12'\` for 1 and 2.`,
    wrong: [
      {
        code: `function exec(code) {
  const st = [];
  for (const ins of code) {
    const [op, arg] = ins.split(' ');
    if (op === 'push') {
      st.push(Number(arg));
    } else {
      const a = st.pop();
      const b = st.pop();
      if (op === 'add') st.push(a + b);
      else st.push(a - b);
    }
  }
  return st.pop();
}`,
        why: 'The first pop is the right-hand number. Popping into `a` first turns `5 - 3` into `3 - 5`.',
      },
      {
        code: `function exec(code) {
  const st = [];
  for (const ins of code) {
    const [op, arg] = ins.split(' ');
    if (op === 'push') {
      st.push(arg);
    } else {
      const b = st.pop();
      const a = st.pop();
      if (op === 'add') st.push(a + b);
      else st.push(a - b);
    }
  }
  return st.pop();
}`,
        why: 'The stack holds strings, so `add` joins them: 1 and 2 give `\'12\'`. Push `Number(arg)`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A program reads a Python file and writes out an equivalent JavaScript file. It never runs either one. What is it?',
    options: [
      { t: 'An interpreter', why: 'An interpreter runs the program. This one only translates it.' },
      { t: 'A scanner', why: 'A scanner is only the first stage, producing tokens.' },
      { t: 'Not a compiler, because the output is source code', why: 'Output in another source language still counts: that is a source-to-source compiler, like Viscosity.' },
      { t: 'A compiler', correct: true, why: 'It translates a program into another form without running it.' },
    ],
  },
  {
    q: 'A compiler turns a program that reads a number and doubles it into machine code. When it does so, what does it know about the number?',
    options: [
      { t: 'Nothing: the number is input, and the compiler only sees the program', correct: true, why: 'The compiled program reads the number later, each time it runs.' },
      { t: 'It asks the user for the number', why: 'A compiler does not run the program, so it never reads its input.' },
      { t: 'It guesses the number and checks later', why: 'A correct compiler must work for every possible input, so it cannot depend on one.' },
      { t: 'It needs the number to finish compiling', why: 'Then you could not compile the program once and run it on many inputs.' },
    ],
  },
  {
    q: 'Drip’s VM turns source into bytecode and then runs a loop over the bytecode. What is it?',
    options: [
      { t: 'Only a compiler', why: 'It also runs the bytecode, which is interpreting.' },
      { t: 'Only an interpreter', why: 'Before running anything it translates the whole program into bytecode, which is compiling.' },
      { t: 'Neither: it is a virtual machine', why: 'A virtual machine is the interpreter half; Drip’s VM also has the compiler half.' },
      { t: 'Both: a compiler, then an interpreter for the compiler’s output', correct: true, why: 'That is what a bytecode VM is.' },
    ],
  },
  {
    q: 'A compiled program and the interpreter give different outputs for the same program and input. What follows?',
    options: [
      { t: 'Nothing: compiled programs are allowed to differ', why: 'A correct compiler keeps the meaning for every input: run(P′, input) = interp(P, input).' },
      { t: 'At least one of them has a bug', correct: true, why: 'Both claim to carry out the same program, so they must agree. (Which one is wrong is a question for the language’s specification, coming up soon.)' },
      { t: 'The interpreter is always the one that is wrong', why: 'Either can have a bug; an interpreter is simpler, but not perfect.' },
      { t: 'The input must have been different', why: 'The question says the input was the same.' },
    ],
  },
  {
    q: 'Which statement about V8, the engine in Chrome and Node, is right?',
    options: [
      { t: 'It only interprets: it never makes machine code', why: 'Frequently run code is compiled again by an optimizing compiler into machine code.' },
      { t: 'It turns JavaScript into machine code before the page starts, like a C compiler', why: 'V8 starts with bytecode and an interpreter, and compiles more while the program runs.' },
      { t: 'It walks the syntax tree, like Part III’s Drip', why: 'V8 runs bytecode, not the tree. That is closer to Drip’s VM in Part IV.' },
      { t: 'It compiles functions to bytecode, interprets that, and compiles hot code again to machine code', correct: true, why: 'Ignition runs the bytecode, and an optimizing compiler takes over for code that runs often: both kinds of program in one engine.' },
    ],
  },
];
