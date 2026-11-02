// Chapter 63 cards. Keys are stable ids: never rename them.

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
  'stop-early': {
    q: 'A Drip program prints on line 1 and has a syntax error on line 3. Why is nothing printed?',
    a: 'The pipeline runs stage by stage: parsing finds the error and `run` stops before the interpreter ever starts.',
  },
  'ir-why': {
    q: 'What does a shared tree or IR in the middle of a pipeline let you do?',
    a: 'Mix and match: one front end can feed several back ends, and several front ends one back end.',
  },
  'why-stages': {
    q: 'Why split a language implementation into stages instead of one big function?',
    a: 'Each stage has one job, so it can be understood, tested and changed on its own.',
  },
  'front-end': {
    q: 'Which half of a language implementation must change if you switch to a different source language?',
    a: 'The front end (scanner and parser): it depends on the source language.',
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
};

const STARTER_SCAN = `function scan(src) {
  return src.split(' ');
}
`;

const RUN = `
function run(src) {
  return evaluate(scan(src));
}`;


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

Notice that \`evaluate\` *does* the work as it reads; that is what makes it an interpreter. In the next chapter, the same loop writes instructions instead.

**Common wrong attempts.**

- Leaving out \`Number\`: \`'1' + '2'\` joins the strings into \`'12'\`, so \`run('1 + 2')\` gives \`'12'\` instead of \`3\`.
- Adding every number and ignoring the operators: \`1 + 2 - 4\` then gives \`7\`, because the \`-\` never subtracts anything.
- Stepping \`i\` by 1 instead of 2: on the second round \`ts[i]\` is a number, not \`'+'\`, so the code subtracts \`Number(ts[i + 1])\`, which is \`Number('-')\`, that is \`NaN\`, and the whole answer becomes \`NaN\`.`,
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
};

export const quiz = [
  {
    q: 'In Drip’s tree-walker, which stage turns `print 1 + 2;` from a string into a list like `print`, `1`, `+`, `2`, `;`?',
    options: [
      { t: 'The parser', why: 'The parser starts from tokens and builds a tree. Something has to make the tokens first.' },
      { t: 'The scanner', correct: true, why: 'The scanner reads characters and groups them into tokens; it is the first stage of the pipeline.' },
      { t: 'The interpreter', why: 'The interpreter works on the tree, at the very end of the pipeline.' },
      { t: 'The resolver', why: 'The resolver checks the tree after parsing; it never sees raw characters.' },
    ],
  },
  {
    q: 'Why does the tree for `1 + 2 * 3` have `*` below `+`?',
    options: [
      { t: 'Because `*` comes later in the line', why: 'Order in the line is not the rule: in `2 * 3 + 1`, `*` would still sit below `+`.' },
      { t: 'Because `2 * 3` must be worked out first, and the tree is evaluated from the bottom up', correct: true, why: 'Lower nodes are computed first and feed their parents, so the tree records that `*` binds tighter.' },
      { t: 'Because the scanner sorts the tokens', why: 'The scanner keeps tokens in source order. Arranging them is the parser’s job.' },
      { t: 'It does not matter: either shape gives 7', why: 'With `+` below `*`, you would compute `(1 + 2) * 3`, which is 9.' },
    ],
  },
  {
    q: 'You want Drip programs to run on a new kind of processor. Which part of the implementation must you write?',
    options: [
      { t: 'A new scanner', why: 'The scanner depends on Drip’s spelling, which has not changed.' },
      { t: 'A new parser', why: 'Drip’s grammar is the same, so the parser and its tree can stay.' },
      { t: 'A new back end', correct: true, why: 'The back end depends on the target. The front end can be reused as it is.' },
      { t: 'Everything, from scratch', why: 'That is the point of the front-end/back-end split: only the half that depends on the target changes.' },
    ],
  },
  {
    q: 'Four source languages must each run on five targets. With one shared IR in the middle, how many front ends and back ends do you write?',
    options: [
      { t: '20', why: 'That is 4 × 5: one translator for every pair, which is what you write *without* a shared IR.' },
      { t: '9', correct: true, why: 'One front end per language (4) plus one back end per target (5): M + N.' },
      { t: '5', why: 'The five back ends are needed, but so is a front end for each of the four languages.' },
      { t: '1', why: 'The IR is shared, but each language still needs its own front end and each target its own back end.' },
    ],
  },
  {
    q: 'What does Viscosity, the compiler this book builds towards, output?',
    options: [
      { t: 'Machine code', why: 'Viscosity leaves machine code to the JavaScript engine.' },
      { t: 'The value your program computes', why: 'That would mean running your program. Viscosity only rewrites it.' },
      { t: 'JavaScript, with arrays of objects stored as typed-array columns where that is safe', correct: true, why: 'It is a source-to-source compiler: JavaScript in, JavaScript out, with a different data layout.' },
      { t: 'Bytecode for Drip’s VM', why: 'Drip is the teaching language. Viscosity works on JavaScript (and a subset of Python).' },
    ],
  },
];
