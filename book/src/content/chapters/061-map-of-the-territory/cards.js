// Chapter 61 cards. Keys are stable ids: never rename them.

export const prompts = {
  'pipeline-order': {
    q: 'Put Drip’s tree-walking pipeline in order: tree, source, output, tokens.',
    a: 'source → tokens → tree → output (scanner, then parser, then interpreter).',
  },
  'scanner-io': {
    q: 'What does the scanner take in, and what does it hand on?',
    a: 'It takes the source string (characters) and returns a list of tokens.',
  },
  'parser-io': {
    q: 'What does the parser take in, and what does it hand on?',
    a: 'It takes the list of tokens and returns a syntax tree.',
  },
  'why-stages': {
    q: 'Why split a language implementation into stages instead of one big function?',
    a: 'Each stage has one job, so it can be understood, tested and changed on its own.',
  },
  'interp-def': {
    q: 'What does an interpreter do with a program?',
    a: 'It runs it directly and produces its output.',
  },
  'compiler-def': {
    q: 'Does a compiler run the program it compiles?',
    a: 'No. It translates the program into another form; something else runs the result.',
  },
  'vm-both': {
    q: 'Drip’s bytecode VM: is it an interpreter or a compiler?',
    a: 'Both. A compiler turns source into bytecode, then an interpreter loop runs the bytecode.',
  },
  'front-end': {
    q: 'Which half of a language implementation must change if you switch to a different source language?',
    a: 'The front end (scanner and parser): it depends on the source language.',
  },
  'ir-why': {
    q: 'What does a shared tree or IR in the middle of a pipeline let you do?',
    a: 'Mix and match: one front end can feed several back ends (and the other way round).',
  },
  'viscosity-kind': {
    q: 'What goes into Viscosity, and what comes out?',
    a: 'JavaScript in, JavaScript out: a source-to-source compiler that rewrites data layout.',
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

const STARTER_SCAN = `function scan(src) {
  return src.split(' ');
}
`;

const RUN = `
function run(src) {
  return evaluate(scan(src));
}`;

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
  'mini-interp': {
    title: 'A complete tiny interpreter',
    prompt:
      'A tiny language has only whole numbers, `+` and `-`, with a space between every token: `1 + 2 - 4`. The scanner is done: `scan` splits the source into tokens such as `[\'1\', \'+\', \'2\', \'-\', \'4\']`.\n\nWrite `evaluate(ts)`: it takes that token list and **returns** the value as a number, working left to right. `run(\'1 + 2 - 4\')` should return `-1`.',
    starter: `${STARTER_SCAN}
function evaluate(ts) {
  // your code here
}
${RUN}

console.log(run('1 + 2 - 4'));`,
    solution: `${STARTER_SCAN}
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
${RUN}`,
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
    walkthrough: `This is a whole pipeline in miniature: \`scan\` is the front end, \`evaluate\` is the back end, and the token list is the hand-over between them.

- **Start with the first number.** \`let total = Number(ts[0]);\`. Every program in this language begins with a number.
- **Walk in pairs.** After the first number the tokens come in pairs: an operator, then a number. So \`i\` starts at 1 and goes up by 2 each time. \`ts[i]\` is the operator and \`ts[i + 1]\` is the number to its right.
- **Do what the operator says.** \`+\` adds to the running total, \`-\` subtracts. Because you update \`total\` as you go, \`5 - 3 - 1\` means \`(5 - 3) - 1\`, which is left to right.
- **Convert.** Tokens are text. Without \`Number\`, \`+\` would glue strings together.

Notice that \`evaluate\` *does* the work as it reads: that is what makes it an interpreter. In the extra exercise, the same loop writes instructions instead.`,
    wrong: [
      {
        code: `${STARTER_SCAN}
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
${RUN}`,
        why: 'The tokens are strings, so `\'1\' + \'2\'` glues them into `\'12\'`. Convert each token with `Number(...)`.',
      },
      {
        code: `${STARTER_SCAN}
function evaluate(ts) {
  let total = 0;
  for (const t of ts) {
    if (t !== '+' && t !== '-') {
      total += Number(t);
    }
  }
  return total;
}
${RUN}`,
        why: 'This adds every number and ignores the operators, so `1 + 2 - 4` gives `7`. The `-` must subtract the number after it.',
      },
    ],
  },
  'mini-compile': {
    optional: true,
    title: 'The same language, compiled',
    prompt:
      'Now make a **compiler** for the same language. Write `compile(ts)`: it does not compute anything. It returns a list of instructions for a little stack machine. `push N` pushes a number; `add` and `sub` pop two numbers and push the result.\n\n`compile([\'1\', \'+\', \'2\', \'-\', \'4\'])` should return `[\'push 1\', \'push 2\', \'add\', \'push 4\', \'sub\']`. The machine, `exec`, is written for you.',
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
      'The loop has the same shape as `evaluate`: the first number, then pairs of operator and number.',
      'Instead of updating a total, push strings onto an output array.',
      'The machine needs both numbers on the stack before it can add them, so emit `push` for the right-hand number *before* the `add` or `sub`.',
    ],
    walkthrough: `Compare this with \`evaluate\` from the core exercise. The loop is identical. The difference is what happens at each step.

- \`evaluate\` *does* the operation: \`total += n\`.
- \`compile\` *writes down* the operation: \`out.push('add')\`.

The order matters. A stack machine works on whatever is on top of its stack, so the instructions for \`1 + 2\` are "push 1, push 2, add": both operands first, then the operator. Look back at the bytecode in the step-through diagram: \`CONSTANT 1, CONSTANT 2, CONSTANT 3, MULTIPLY, ADD\`. Same idea.

Once you have \`compile\`, you can run the result as many times as you like with \`exec\` without scanning again. That is one reason real systems compile.`,
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
};

export const quiz = [
  {
    q: 'In Drip’s tree-walker, which stage turns `print 1 + 2;` from a string into a list like `print`, `1`, `+`, `2`, `;`?',
    options: [
      { t: 'The parser', why: 'The parser starts from tokens and builds a tree. Something has to make the tokens first.' },
      { t: 'The scanner', correct: true, why: 'The scanner reads characters and groups them into tokens.' },
      { t: 'The interpreter', why: 'The interpreter works on the tree, at the very end of the pipeline.' },
      { t: 'The resolver', why: 'The resolver checks the tree after parsing; it never sees raw characters.' },
    ],
  },
  {
    q: 'A program reads a Python file and writes out an equivalent JavaScript file. It never runs either one. What is it?',
    options: [
      { t: 'An interpreter', why: 'An interpreter runs the program. This one only translates it.' },
      { t: 'A scanner', why: 'A scanner is only the first stage, producing tokens.' },
      { t: 'Not a compiler, because the output is source code', why: 'Output in another source language still counts. That is a source-to-source compiler.' },
      { t: 'A compiler', correct: true, why: 'It translates a program into another form without running it.' },
    ],
  },
  {
    q: 'Why does the tree for `1 + 2 * 3` have `*` below `+`?',
    options: [
      { t: 'Because `2 * 3` must be worked out first, and the tree is evaluated from the bottom up', correct: true, why: 'Lower nodes are computed first and feed their parents, so the tree records that `*` binds tighter.' },
      { t: 'Because `*` comes later in the line', why: 'Order in the line isn’t the rule: in `2 * 3 + 1`, `*` would still sit below `+`.' },
      { t: 'Because the scanner sorts the tokens', why: 'The scanner keeps tokens in source order. Arranging them is the parser’s job.' },
      { t: 'It doesn’t matter: either shape gives 7', why: 'With `+` below `*`, you’d compute `(1 + 2) * 3`, which is 9.' },
    ],
  },
  {
    q: 'You want Drip programs to run on a new kind of processor. Which part of the implementation must you write?',
    options: [
      { t: 'A new scanner', why: 'The scanner depends on Drip’s spelling, which hasn’t changed.' },
      { t: 'A new parser', why: 'Drip’s grammar is the same, so the parser and its tree can stay.' },
      { t: 'A new back end', correct: true, why: 'The back end depends on the target. The front end can be reused as it is.' },
      { t: 'Everything, from scratch', why: 'That is the point of the front-end/back-end split: only the half that depends on the target changes.' },
    ],
  },
  {
    q: 'Which statement about V8, the engine in Chrome and Node, is right?',
    options: [
      { t: 'It only interprets: it never makes machine code', why: 'Frequently run code is compiled again by an optimizing compiler into machine code.' },
      { t: 'It compiles functions to bytecode, interprets that, and compiles hot code again to machine code', correct: true, why: 'Ignition runs the bytecode, and optimizing compilers take over for code that runs often.' },
      { t: 'It turns JavaScript into machine code before the page starts, like a C compiler', why: 'V8 starts with bytecode and an interpreter, and compiles more while the program runs.' },
      { t: 'It walks the syntax tree, like Part III’s Drip', why: 'V8 runs bytecode, not the tree. That’s closer to Drip’s VM in Part IV.' },
    ],
  },
  {
    q: 'What does Viscosity, the compiler this book builds towards, output?',
    options: [
      { t: 'Machine code', why: 'Viscosity leaves machine code to the JavaScript engine.' },
      { t: 'The value your program computes', why: 'That would make it an interpreter. Viscosity doesn’t run your program.' },
      { t: 'Bytecode for Drip’s VM', why: 'Drip is the teaching language. Viscosity works on JavaScript and TypeScript.' },
      { t: 'JavaScript, with arrays of objects stored as typed-array columns where that is safe', correct: true, why: 'It is a source-to-source compiler: JavaScript in, JavaScript out, with a different data layout.' },
    ],
  },
];
