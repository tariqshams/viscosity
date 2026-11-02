// Chapter 57 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'pipeline-order': {
    q: 'Put the stages of a tree-walking interpreter’s pipeline in order: tree, source, output, tokens.',
    a: 'source → tokens → tree → output (scanner, then parser, then interpreter).',
  },
  'stop-early': {
    q: 'An implementation parses the whole program before running any of it. A program prints on line 1 and has a syntax error on line 3. Why is nothing printed?',
    a: 'The pipeline runs stage by stage: parsing finds the error, and the implementation stops before the interpreter ever starts.',
  },
  'ir-why': {
    q: 'What does a shared tree or IR in the middle of a pipeline let you do?',
    a: 'Mix and match: one front end can feed several back ends, and several front ends one back end.',
  },
  'front-end': {
    q: 'Which half of a language implementation must change if you switch to a different source language?',
    a: 'The front end (scanner and parser): it depends on the source language.',
  },
  'compiler-input': {
    q: 'An interpreter is given a program and its input. What is a compiler given?',
    a: 'Only the program. It never sees the input; the program it writes will read the input later.',
  },
  'compile-once': {
    q: 'Why does compiling pay off for a program that runs a million times?',
    a: 'The translation is done once; every run after that skips reading the source or walking the tree.',
  },
  'vm-both': {
    q: 'A bytecode VM compiles source into bytecode, then runs that bytecode in a loop. Is it an interpreter or a compiler?',
    a: 'Both. A compiler turns source into bytecode, then an interpreter loop runs the bytecode.',
  },
  'source-to-source': {
    q: 'What is a source-to-source compiler? Give an example.',
    a: 'A compiler whose output is source code in a programming language, such as tsc (TypeScript to JavaScript) or Viscosity (JavaScript to JavaScript).',
  },
};

export const examples = {
  'first-line': {
    title: 'A first Drip program (tree-walker)',
    lang: 'drip',
    code: `print 1 + 2 * 3;
print (1 + 2) * 3;`,
  },
  'same-line-vm': {
    title: 'The same program on the bytecode VM',
    lang: 'drip-vm',
    code: `print 1 + 2 * 3;
print (1 + 2) * 3;`,
  },
};

export const exercises = {
  'mini-interp': {
    optional: true,
    title: 'A complete tiny interpreter',
    prompt: `A tiny language has only whole numbers, \`+\` and \`-\`, with a space between every token: \`1 + 2 - 4\`. The scanner is done: \`scan\` splits the source into tokens such as \`['1', '+', '2', '-', '4']\`.

Write \`evaluate(ts)\`: it takes that token list and **returns** the value as a number, working left to right. \`run('1 + 2 - 4')\` should return \`-1\`.`,
    starter: `function scan(src) {
  return src.split(' ');
}

function evaluate(ts) {
  // your code here
}

function run(src) {
  return evaluate(scan(src));
}

console.log(run('1 + 2 - 4'));`,
    solution: `function scan(src) {
  return src.split(' ');
}

function evaluate(ts) {
  let total = Number(ts[0]);
  let i = 1;
  while (i < ts.length) {
    const n = Number(ts[i + 1]);
    if (ts[i] === '+') total += n;
    else total -= n;
    i += 2;
  }
  return total;
}

function run(src) {
  return evaluate(scan(src));
}`,
    tests: `test('a single number', () => {
  expect(run('10')).toBe(10);
});
test('1 + 2 - 4 is -1', () => {
  expect(run('1 + 2 - 4')).toBe(-1);
});
test('works left to right', () => {
  expect(run('5 - 3 - 1')).toBe(1);
});
test('adds numbers, not strings', () => {
  expect(run('1 + 2')).toBe(3);
});
test('longer sums', () => {
  expect(run('100 - 1 + 20 - 3')).toBe(116);
});`,
    hints: [
      'The tokens alternate: number, operator, number, operator, number. The operators sit at the odd indexes 1, 3, 5…',
      'Start `total` at the first number. Then step through the list two at a time: an operator at `i`, its number at `i + 1`.',
      'Tokens are strings. `\'1\' + \'2\'` is `\'12\'`, so turn each number token into a number with `Number(...)` first.',
    ],
    walkthrough: `**How to think about it.** This is a whole pipeline in miniature: \`scan\` is the front end, \`evaluate\` is the back end, and the token list is what one hands to the other. Before writing code, look at the shape of every possible token list: it always starts with a number, and after that the tokens come in pairs, an operator and then a number (\`1\`, then \`+ 2\`, then \`- 4\`). So the plan is: start a running total at the first number, then walk the pairs, letting each operator decide whether its number is added or taken away. Do one by hand: \`1 + 2 - 4\` is 1, then 1 + 2 = 3, then 3 - 4 = -1.

**The solution, line by line.**

- \`let total = Number(ts[0]);\` starts the running total at the first token. Tokens are strings, so \`Number\` turns \`'1'\` into the number \`1\`.
- \`let i = 1;\` points at the first operator, which always sits at index 1.
- \`while (i < ts.length) {\` keeps going while there is an operator left to read.
- \`const n = Number(ts[i + 1]);\` reads the number to the right of the operator, again converted from text.
- \`if (ts[i] === '+') total += n;\` adds it when the operator is \`+\`.
- \`else total -= n;\` otherwise the operator is \`-\`, so it subtracts.
- \`i += 2;\` jumps over the operator and its number, to the next operator (indexes 1, 3, 5 and so on).
- \`}\` ends the loop, and \`return total;\` hands back the answer. Because \`total\` is updated as the loop goes, \`5 - 3 - 1\` means \`(5 - 3) - 1\`, which is 1: left to right.

Notice that \`evaluate\` *does* the work as it reads; that is what makes it an interpreter. The same loop can write instructions instead, which is what a compiler does.

**Common wrong attempts.**

- Leaving out \`Number\`: \`'1' + '2'\` joins the strings into \`'12'\`, so \`run('1 + 2')\` gives \`'12'\` instead of \`3\`.
- Adding every number and ignoring the operators: \`1 + 2 - 4\` then gives \`7\`, because the \`-\` never subtracts anything.
- Stepping \`i\` by 1 instead of 2: on the second round \`ts[i]\` is a number, not \`'+'\`, so the code subtracts \`Number(ts[i + 1])\`, which is \`Number('-')\`, that is \`NaN\`, and the whole answer becomes \`NaN\`.`,
    wrong: [
      {
        code: `function scan(src) {
  return src.split(' ');
}

function evaluate(ts) {
  let total = ts[0];
  let i = 1;
  while (i < ts.length) {
    const n = ts[i + 1];
    if (ts[i] === '+') total += n;
    else total -= n;
    i += 2;
  }
  return total;
}

function run(src) {
  return evaluate(scan(src));
}`,
        why: 'The tokens are strings, so `\'1\' + \'2\'` glues them into `\'12\'`. Convert each token with `Number(...)`.',
      },
      {
        code: `function scan(src) {
  return src.split(' ');
}

function evaluate(ts) {
  let total = 0;
  for (const t of ts) {
    if (t !== '+' && t !== '-') {
      total += Number(t);
    }
  }
  return total;
}

function run(src) {
  return evaluate(scan(src));
}`,
        why: 'This adds every number and ignores the operators, so `1 + 2 - 4` gives `7`. The `-` must subtract the number after it.',
      },
    ],
  },
  'mini-compile': {
    title: 'The same language, compiled',
    prompt: `A tiny language has whole numbers, \`+\` and \`-\`, with tokens like \`['1', '+', '2']\`. Now make a **compiler** for it. Write \`compile(ts)\`: it does not compute anything. It returns a list of instructions for a little stack machine. \`push N\` pushes a number; \`add\` and \`sub\` pop two numbers and push the result.

\`compile(['1', '+', '2', '-', '4'])\` should return \`['push 1', 'push 2', 'add', 'push 4', 'sub']\`. The machine, \`exec\`, is written for you.`,
    starter: `function exec(code) {
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

function compile(ts) {
  // your code here
}

const code = compile(['1', '+', '2']);
console.log(code, exec(code));`,
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
}

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
      'The loop has the same shape as an evaluator for the language: the first number, then pairs of operator and number.',
      'Instead of updating a total, push strings onto an output array.',
      'The machine needs both numbers on the stack before it can add them, so emit `push` for the right-hand number *before* the `add` or `sub`.',
    ],
    walkthrough: `**How to think about it.** Put \`compile\` next to \`evaluate\`, the interpreter of the extra exercise *A complete tiny interpreter*: the loop is identical, because the shape of the token list has not changed (a number, then pairs of operator and number). What changes is what happens at each step. \`evaluate\` *does* the operation (\`total += n\`); \`compile\` *writes it down* (\`out.push('add')\`). The only new question is the order of the instructions. A stack machine works on whatever is on top of its stack, so before it can add it needs both numbers there: "push 1, push 2, add". Operands first, then the operator.

**The solution, line by line.**

- \`const out = ['push ' + ts[0]];\` starts the program with an instruction that pushes the first number. Here the token can stay a string, because the instruction is text.
- \`let i = 1;\` points at the first operator, as before.
- \`while (i < ts.length) {\` visits each operator in turn.
- \`out.push('push ' + ts[i + 1]);\` first pushes the number to the operator's right, so both operands are now on the stack.
- \`if (ts[i] === '+') out.push('add');\` then writes the operation itself, \`add\` for \`+\`...
- \`else out.push('sub');\` ...and \`sub\` for \`-\`.
- \`i += 2;\` moves on to the next operator, and after the loop \`return out;\` hands back the whole list of instructions.

For \`1 + 2 - 4\` that gives \`push 1, push 2, add, push 4, sub\`. Running it: the stack holds 1, then 1 and 2, then (after \`add\`) 3, then 3 and 4, then (after \`sub\`) -1. Look back at the instructions in the step-through diagram of the two roads, \`push 1, push 2, push 3, mul, add\`: the same idea. And once you have the instructions, \`exec\` can run them as many times as you like without scanning again, which is one reason real systems compile.

**Common wrong attempts.**

- Writing the operator before its right-hand number (\`add\`, then \`push 2\`): \`add\` runs with only one number on the stack, pops \`undefined\` for the missing one, and the answer is \`NaN\`.
- Computing the answer inside \`compile\` and returning it: that is \`evaluate\` again. A compiler's output is a program, not a value.`,
    wrong: [
      {
        code: `function exec(code) {
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
    prompt: 'Write `exec(code)`, the stack machine that runs the compiler’s output. `code` is an array of instructions: `push N` pushes the number N onto a stack; `add` pops two numbers and pushes their sum; `sub` pops two numbers and pushes the first minus the second (so `push 5, push 3, sub` leaves `2`). At the end, return the number on top of the stack.',
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

Put it next to \`evaluate\`, from the exercise *A complete tiny interpreter*: both are interpreters, one for the sums language and one for the compiler's instructions. Together with \`compile\`, this is a bytecode VM in miniature: compile once, then interpret the instructions.

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
    q: 'You want programs in an existing language to run on a new kind of processor. Which part of the language’s implementation must you write?',
    options: [
      {
        t: 'A new scanner',
        why: 'The scanner depends on the language’s spelling, which has not changed.',
      },
      {
        t: 'A new parser',
        why: 'The grammar is the same, so the parser and its tree can stay.',
      },
      {
        t: 'A new back end',
        correct: true,
        why: 'The back end depends on the target. The front end can be reused as it is.',
      },
      {
        t: 'Everything, from scratch',
        why: 'That is the point of the front-end/back-end split: only the half that depends on the target changes.',
      },
    ],
  },
  {
    q: 'Four source languages must each run on five targets. With one shared IR in the middle, how many front ends and back ends do you write?',
    options: [
      {
        t: '20',
        why: 'That is 4 × 5: one translator for every pair, which is what you write *without* a shared IR.',
      },
      {
        t: '9',
        correct: true,
        why: 'One front end per language (4) plus one back end per target (5): M + N.',
      },
      {
        t: '5',
        why: 'The five back ends are needed, but so is a front end for each of the four languages.',
      },
      {
        t: '1',
        why: 'The IR is shared, but each language still needs its own front end and each target its own back end.',
      },
    ],
  },
  {
    q: 'A compiler turns a program that reads a number and doubles it into machine code. When it does so, what does it know about the number?',
    options: [
      {
        t: 'Nothing: the number is input, and the compiler only sees the program',
        correct: true,
        why: 'The compiled program reads the number later, each time it runs.',
      },
      {
        t: 'It asks the user for the number',
        why: 'A compiler does not run the program, so it never reads its input.',
      },
      {
        t: 'It guesses the number and checks later',
        why: 'A correct compiler must work for every possible input, so it cannot depend on one.',
      },
      {
        t: 'It needs the number to finish compiling',
        why: 'Then you could not compile the program once and run it on many inputs.',
      },
    ],
  },
  {
    q: 'Which statement about V8, the engine in Chrome and Node, is right?',
    options: [
      {
        t: 'It only interprets: it never makes machine code',
        why: 'Frequently run code is compiled again by an optimising compiler into machine code.',
      },
      {
        t: 'It turns JavaScript into machine code before the page starts, like a C compiler',
        why: 'V8 starts with bytecode and an interpreter, and compiles more while the program runs.',
      },
      {
        t: 'It walks the syntax tree, like a tree-walking interpreter',
        why: 'V8 runs bytecode, not the tree, like a bytecode VM.',
      },
      {
        t: 'It compiles functions to bytecode, interprets that, and compiles hot code again to machine code',
        correct: true,
        why: 'Ignition runs the bytecode, and an optimising compiler takes over for code that runs often: both kinds of program in one engine.',
      },
    ],
  },
];
