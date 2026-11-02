// Chapter 267 cards. Keys are stable ids: never rename them.

export const prompts = {
  'identity-what': {
    q: 'What is an identity transform?',
    a: 'A compile that must change nothing: for an input with nothing to transform, the output equals the input.',
  },
  'bytes-not-trees': {
    q: 'Why can Viscosity’s round trip compare bytes, where a printer’s round trip compares trees?',
    a: 'A printer chooses its own layout, so only the tree can match. Viscosity splices edits into the original text, so with no edits the text itself must match.',
  },
  'identity-pipeline': {
    q: 'The round-trip snippet has nothing to transform. Which parts of Viscosity does it still exercise?',
    a: 'All of them: parsing, scope resolution, lowering, the analyses, the planner and the emitter.',
  },
  'identity-snippet': {
    q: 'Why does the round-trip snippet contain an array, a comment and a trailing newline?',
    a: 'The array makes the collection analysis run; the comment and the final newline are exactly what a printer would lose.',
  },
  'identity-ts': {
    q: 'What does Viscosity output for a TypeScript file with nothing to transform?',
    a: 'The same code with its types stripped: the plugin removes types before parsing, and emits JavaScript.',
  },
  'fresh-context': {
    q: 'Why does the differential test give each run a fresh `vm` context?',
    a: 'Each gets its own global object, so neither version can see globals or state the other left behind.',
  },
  'three-tests': {
    q: 'What does each of the front-end’s three test kinds guard?',
    a: 'Round trip: untouched code stays byte-identical. Differential: compiled code behaves the same. Parser equivalence: acorn and mini give the same output.',
  },
  'header-aos': {
    q: 'Of the 40 differential-corpus files, 16 keep every collection as an array of objects. What does that show about the identity property?',
    a: 'All 16 come back byte-identical, so the identity property holds inside the differential suite too, even though nothing there checks it.',
  },
  'scale-free': {
    q: 'Why does the identity check scale to any pile of real code?',
    a: 'It needs no expected output: for a file with nothing to transform, the file itself is the answer.',
  },
  'found-crash': {
    q: 'What did the first round trip over 515 third-party files find?',
    a: 'No file was changed, but 17 crashed the compiler, all on `export default class`, which the resolver didn’t declare. Since fixed, all 515 round-trip byte-identical.',
  },
};

export const examples = {};

export const exercises = {
  diffRun: {
    title: 'A differential tester for programs',
    prompt:
      'Programs are strings of JavaScript that print with `log(...)`. Write `outcome(code)`, which runs `code` with `new Function(\'log\', code)`, and returns `{ out, error }`: `out` is the list of printed lines (arguments joined with a space), and `error` is `null`, or `name + \': \' + message` of the uncaught error. Then write `diffRun(progs, transform)`: return the index of the first program whose outcome differs from the outcome of `transform(program)`, comparing every line and the error, or `-1` if all agree.',
    starter: `function outcome(code) {
  const out = [];
  const log = (...a) =>
    out.push(a.join(' '));
  new Function('log', code)(log);
  return { out, error: null };
}

function diffRun(ps, transform) {
  // your code here
  return -1;
}`,
    solution: `function outcome(code) {
  const out = [];
  const log = (...a) =>
    out.push(a.join(' '));
  try {
    new Function('log', code)(log);
    return { out, error: null };
  } catch (e) {
    const error = e.name + ': '
      + e.message;
    return { out, error };
  }
}

function same(a, b) {
  return a.error === b.error
    && a.out.length === b.out.length
    && a.out.every((l, i) =>
      l === b.out[i]);
}

function diffRun(ps, transform) {
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i];
    const a = outcome(p);
    const b = outcome(transform(p));
    if (!same(a, b)) return i;
  }
  return -1;
}`,
    tests: `const progs = [
  'log(1 + 1)',
  'let s = 0; for (let i = 0; i < 4; i++) s += i; log(s)',
  'log("a", 2); throw new TypeError("boom")',
];
test('outcome records lines and errors', () => {
  expect(outcome(progs[2])).toEqual({ out: ['a 2'], error: 'TypeError: boom' });
  expect(outcome('log(3)')).toEqual({ out: ['3'], error: null });
});
test('the identity transform agrees', () => {
  expect(diffRun(progs, (p) => p)).toBe(-1);
});
test('a changed result is found', () => {
  expect(diffRun(progs, (p) => p.replace('i < 4', 'i < 3'))).toBe(1);
});
test('a lost error is found', () => {
  expect(diffRun(progs, (p) => p.replace('throw', 'log'))).toBe(2);
});
test('a different message is found', () => {
  expect(diffRun(progs, (p) => p.replace('boom', 'bang'))).toBe(2);
});
test('a missing line is found', () => {
  const two = ['log(1); log(2)'];
  expect(diffRun(two, (p) => 'log(1)')).toBe(0);
});`,
    hints: [
      'Wrap the call in `try`/`catch`, and keep the lines printed before the error: they are part of the outcome.',
      'Two outcomes agree when the errors are `===` and the line lists have the same length and the same lines.',
      'Loop over the programs with their index, and return the first index where the outcomes disagree.',
    ],
    walkthrough: `**How to think about it.** This is Viscosity's \`runIsolated\` plus the \`toEqual\` comparison from its differential test, at toy size. Before writing anything, decide what "behaves the same" means. Two programs that print the same lines but where one throws and the other does not are *not* the same, so the outcome of a run has two parts: the list of lines printed, and the error it ended with (or \`null\`). Once \`outcome\` captures both, \`diffRun\` is a loop that compares two outcomes per program.

**The solution, line by line.**

- \`function outcome(code) {\` takes the program text.
- \`const out = [];\` is the list of printed lines; it is filled as the program runs, so lines printed *before* an error are kept.
- \`const log = (...a) => out.push(a.join(' '));\` is the program's print function: \`...a\` gathers every argument into an array, and \`join(' ')\` turns \`log("a", 2)\` into the single line \`"a 2"\`.
- \`try { new Function('log', code)(log); return { out, error: null }; }\` builds a function whose one parameter is called \`log\` and whose body is the program, calls it with our \`log\`, and, if it finishes, reports no error.
- \`catch (e) { const error = e.name + ': ' + e.message; return { out, error }; }\` runs when the program throws. \`e.name\` is the error's kind (\`TypeError\`) and \`e.message\` its text (\`boom\`), so the error becomes \`"TypeError: boom"\`; \`out\` still holds the lines printed before the throw.
- \`function same(a, b) {\` compares two outcomes: \`a.error === b.error\` checks the errors (two \`null\`s are equal), \`a.out.length === b.out.length\` checks that the same number of lines was printed, and \`a.out.every((l, i) => l === b.out[i])\` checks each line against the line at the same position.
- \`function diffRun(ps, transform) {\` loops over the programs with their index \`i\`.
- \`const a = outcome(p); const b = outcome(transform(p));\` runs the original and the transformed version.
- \`if (!same(a, b)) return i;\` returns the first program that disagrees, and \`return -1;\` after the loop says that all of them agreed.

**Why each test passes.** The identity transform \`(p) => p\` gives equal outcomes everywhere, so \`-1\`. Changing \`i < 4\` to \`i < 3\` makes program 1 print \`3\` instead of \`6\`. Changing \`throw\` to \`log\` makes program 2 finish with no error. Changing \`boom\` to \`bang\` keeps an error but changes its message. Dropping \`log(2)\` makes the line lists different lengths.

**Common wrong attempts.**

- Swallowing the error (\`catch (e) {}\`) and comparing only the printed lines: the original's \`TypeError\` and the transformed program's normal finish then look identical, so a transform that silently stops a program failing passes.
- Recording every error as the same word, such as \`'error'\`: a different message, or a different kind of error, then passes. Viscosity's bounds checks exist precisely so that an out-of-range access throws the *same* error as before, so the message matters.
- Comparing \`out.join()\` strings: \`["a,b"]\` and \`["a", "b"]\` both join to \`"a,b"\`, so two different outputs can look equal. Compare line by line instead.
- Using \`new Function\` and believing the runs are isolated: each program gets its own local scope, but not its own globals, so a program that sets \`globalThis.x\` leaks into the next one. The real test uses a fresh \`vm\` context per run for exactly that reason.`,
    wrong: [
      {
        code: `function outcome(code) {
  const out = [];
  const log = (...a) =>
    out.push(a.join(' '));
  try {
    new Function('log', code)(log);
  } catch (e) {}
  return { out, error: null };
}

function diffRun(ps, transform) {
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i];
    const a = outcome(p).out.join();
    const b = outcome(transform(p))
      .out.join();
    if (a !== b) return i;
  }
  return -1;
}`,
        why: 'Swallowing the error makes a lost or changed throw invisible: the original’s TypeError and the transformed program’s normal finish look the same.',
      },
      {
        code: `function outcome(code) {
  const out = [];
  const log = (...a) =>
    out.push(a.join(' '));
  try {
    new Function('log', code)(log);
    return { out, error: null };
  } catch (e) {
    return { out, error: 'error' };
  }
}

function diffRun(ps, transform) {
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i];
    const a = JSON.stringify(
      outcome(p));
    const b = JSON.stringify(
      outcome(transform(p)));
    if (a !== b) return i;
  }
  return -1;
}`,
        why: 'Every error looks alike, so a different message (or a different error type) passes. Viscosity’s bounds check exists precisely to throw the same message.',
      },
    ],
  },
  preserved: {
    optional: true,
    title: 'Where did the round trip break?',
    prompt:
      'When an identity test fails, “not equal” is not much help. Write `firstDiff(a, b)`: return `null` if the strings are identical, otherwise `{ offset, line, col }` for the first position where they differ (lines and columns count from 1). If one string is a prefix of the other, they differ at the end of the shorter one.',
    starter: `function firstDiff(a, b) {
  if (a === b) return null;
  return { offset: 0, line: 1, col: 1 };
}`,
    solution: `function firstDiff(a, b) {
  if (a === b) return null;
  let i = 0;
  const n = a.length;
  while (i < n && a[i] === b[i]) i++;
  const before = a.slice(0, i);
  const lines = before.split('\\n');
  return {
    offset: i,
    line: lines.length,
    col: lines.at(-1).length + 1,
  };
}`,
    tests: `test('identical', () => {
  expect(firstDiff('a\\nb\\n', 'a\\nb\\n')).toBe(null);
});
test('a change on line 2', () => {
  expect(firstDiff('let a;\\nlet bc;', 'let a;\\nlet bd;'))
    .toEqual({ offset: 12, line: 2, col: 6 });
});
test('a dropped trailing newline', () => {
  expect(firstDiff('x;\\n', 'x;'))
    .toEqual({ offset: 2, line: 1, col: 3 });
});
test('a prelude added at the top', () => {
  expect(firstDiff('x;', '// gen\\nx;'))
    .toEqual({ offset: 0, line: 1, col: 1 });
});`,
    hints: [
      'Walk an index forward while both strings have the same character there.',
      'Stop at the end of `a`: if `b` is longer, `b[i]` exists but `a[i]` doesn’t, so that is the difference.',
      'The line is one more than the number of newlines before the offset; the column is the distance from the last newline, plus one.',
    ],
    walkthrough: `**How to think about it.** A byte-for-byte test should fail with a *place*, not only with "expected ... to be ...", especially when the difference cannot be seen, like a missing final newline. So there are two jobs: find the first offset where the strings differ, then turn that offset into a line and a column a person can look up.

**The solution, line by line.**

- \`if (a === b) return null;\` handles the passing case first.
- \`let i = 0; const n = a.length;\` starts at the first character.
- \`while (i < n && a[i] === b[i]) i++;\` walks forward while the characters match. It stops at the first difference, or at the end of \`a\`. If \`b\` is the shorter one, \`b[i]\` becomes \`undefined\` at its end, which is not equal to a character of \`a\`, so the loop stops there too.
- \`const before = a.slice(0, i);\` is all the text before the difference.
- \`const lines = before.split('\\n');\` cuts it at each newline: if there were two newlines before the difference, there are three pieces, and the difference is on line 3.
- \`line: lines.length\` is therefore the line number, counting from 1.
- \`col: lines.at(-1).length + 1\` is the length of the last piece (how far into the current line the difference is) plus one, because columns also count from 1.

**What the tests model.** A dropped trailing newline (what a printer often does) and a prelude added where none was needed (an emitter that forgot to check that its prelude is empty) are exactly the bugs Viscosity's round trip guards against; here they are reported as line 1, column 3 and line 1, column 1.

**Common wrong attempts.**

- Counting the lines of the whole string, \`a.split('\\n').length\`, instead of the lines *before* the difference: a change on line 2 of a 10-line file would be reported on line 10.
- Using the offset itself as the column: that is only right on line 1.`,
    wrong: [
      {
        code: `function firstDiff(a, b) {
  if (a === b) return null;
  let i = 0;
  while (a[i] === b[i]) i++;
  const lines = a.split('\\n');
  return {
    offset: i,
    line: lines.length,
    col: i + 1,
  };
}`,
        why: 'It counts the lines of the whole string, not the lines before the difference, and uses the offset as the column, which is only right on line 1.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which output passes Viscosity’s round-trip test for `const a = [1, 2, 3];\\n// a comment\\nconsole.log(a.length);\\n`?',
    options: [
      { t: 'The same code with the comment removed', why: 'The test compares every byte; the comment must survive.' },
      { t: 'The same code reformatted by a pretty-printer', why: 'Different bytes fail toBe, even if the tree is the same.' },
      { t: 'Exactly the input, byte for byte', correct: true, why: 'With nothing to transform, the input is the expected output.' },
      { t: 'The input with an empty prelude line at the top', why: 'One extra newline is a different string.' },
    ],
  },
  {
    q: 'Why is the round trip a stronger check for Viscosity than parse → print → parse?',
    options: [
      { t: 'It compares bytes, not trees, which only a splicing emitter can promise', correct: true, why: 'A printer can produce a different text for the same tree; splicing can’t.' },
      { t: 'It runs the program', why: 'The round trip doesn’t run anything; the differential test does.' },
      { t: 'It uses two parsers', why: 'That is the parser-equivalence test.' },
      { t: 'It is not stronger', why: 'Byte equality implies tree equality, but not the other way round.' },
    ],
  },
  {
    q: 'The snippet has no array of objects. Does the collection analysis still run on it?',
    options: [
      { t: 'No, the compiler stops after parsing', why: 'compile always runs the whole pipeline.' },
      { t: 'No, analysis only runs on loops', why: 'It looks at every array-initialised binding.' },
      { t: 'Only in opt-in mode', why: 'The mode affects decisions, not whether analysis runs.' },
      { t: 'Yes: `a` is a candidate, and it is rejected because its elements are not object literals', correct: true, why: 'Then nothing is planned and the emitter returns the source.' },
    ],
  },
  {
    q: 'What does a fresh `vm` context per run give the differential test?',
    options: [
      { t: 'A security sandbox for untrusted code', why: 'Node says vm is not a security mechanism.' },
      { t: 'Each run its own global object, so state can’t leak between the original and compiled runs', correct: true, why: 'Each outcome depends only on its own code.' },
      { t: 'Faster execution', why: 'Speed is not the point.' },
      { t: 'Support for TypeScript', why: 'Types are stripped before compiling, not by vm.' },
    ],
  },
  {
    q: 'What did the first round trip over 515 third-party files show?',
    options: [
      { t: 'Viscosity reformatted most of them', why: 'None was changed.' },
      { t: 'Every file passed', why: '17 crashed the compiler.' },
      { t: 'No file changed, but 17 crashed on `export default class`', correct: true, why: 'The resolver didn’t declare that class’s name, so lowering found no binding. Since fixed, all 515 pass.' },
      { t: 'The mini parser rejected them', why: 'The experiment used acorn, the default parser.' },
    ],
  },
  {
    q: 'A transform turns `ps[100].x` (which throws) into code that prints `0`. Which test catches it?',
    options: [
      { t: 'The round trip', why: 'The file has something to transform, so the round trip doesn’t apply.' },
      { t: 'Parser equivalence', why: 'Both parsers would produce the same wrong code.' },
      { t: 'None of them', why: 'The differential test compares errors as well as output.' },
      { t: 'The differential test: the original ends with a TypeError, the compiled one doesn’t', correct: true, why: 'Outcomes include the uncaught error.' },
    ],
  },
];
