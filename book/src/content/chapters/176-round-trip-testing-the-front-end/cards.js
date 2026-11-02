// Chapter 176 cards. Keys are stable ids: never rename them.

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
    q: 'What did 16 of the 36 corpus files show about the identity property?',
    a: 'Every collection in them stays an array of objects, and their compiled code is byte-identical to the source.',
  },
  'scale-free': {
    q: 'Why does the identity check scale to any pile of real code?',
    a: 'It needs no expected output: for a file with nothing to transform, the file itself is the answer.',
  },
  'found-crash': {
    q: 'What did the first round trip over 514 third-party files find?',
    a: 'No file was changed, but 17 crashed the compiler, all on `export default class`, which the resolver didn’t declare. Since fixed, all 514 round-trip byte-identical.',
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
    walkthrough: `This is \`runIsolated\` and the \`toEqual\` comparison from Viscosity’s differential test, at toy size.

- **Errors are part of the outcome.** A transform that turns a \`throw\` into a \`log\` might print the same first lines, but the program ends differently. So \`outcome\` catches the error and records its name and message, and keeps the lines printed before it.
- **Compare everything.** Same number of lines, same lines in order, same error. Comparing only output misses the lost error; comparing only errors misses the changed sum.
- **Return the index.** The failing program is what you need to debug, and it becomes a new corpus test.
- **Isolation.** \`new Function\` gives each program its own local scope, but not its own globals: a program that wrote \`globalThis.x\` would leak into the next one. The real test uses a fresh \`vm\` context per run for exactly that reason.`,
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
    walkthrough: `A byte-for-byte test should fail with a location, not just “expected … to be …”, especially when the difference is invisible, like a missing final newline.

- **Scan.** The loop stops at the first index where the characters differ, or where \`a\` ends. Because \`a[i] === b[i]\` is false when \`b\` has ended (\`undefined\`), it also stops at the end of a shorter \`b\`.
- **Offsets to lines.** Splitting the text before the offset on \`\\n\` gives one piece per line; the number of pieces is the line number, and the last piece’s length is how far into that line you are.
- **What the tests model.** A dropped trailing newline (what a printer often does) and a prelude added where none was needed (an emitter that forgot to check \`prelude.length === 0\`) are exactly the bugs Viscosity’s round trip guards against.`,
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
      { t: 'No, analysis only runs on loops', why: 'It looks at every array-initialized binding.' },
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
    q: 'What did the first round trip over 514 third-party files show?',
    options: [
      { t: 'Viscosity reformatted most of them', why: 'None was changed.' },
      { t: 'Every file passed', why: '17 crashed the compiler.' },
      { t: 'No file changed, but 17 crashed on `export default class`', correct: true, why: 'The resolver didn’t declare that class’s name, so lowering found no binding. Since fixed, all 514 pass.' },
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
