// Chapter 102 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'codegen-what': {
    q: 'What is code generation?',
    a: 'The compiler step that turns its internal form back into output text: machine code, bytecode, or (for Viscosity) source code.',
  },
  'splice-why': {
    q: 'Why does Viscosity splice edits into the source instead of printing the tree?',
    a: 'Everything it doesn’t change, comments and formatting included, is copied byte for byte.',
  },
  'back-to-front': {
    q: 'Why does a splicing emitter whose edits all use offsets into the original text apply them from the highest start offset down?',
    a: 'An edit changes the length of the text after it. Going backwards, every edit still to apply lies before the change, so its offsets stay valid.',
  },
  'overlap-bug': {
    q: 'Why does Viscosity’s emitter throw on two overlapping edits instead of picking one?',
    a: 'Two edits for the same characters means two parts of the emitter disagree: no order is right, so it refuses rather than emit broken code.',
  },
  'identity-what': {
    q: 'What is an identity transform?',
    a: 'A compile that must change nothing: for an input with nothing to transform, the output equals the input.',
  },
  'bytes-not-trees': {
    q: 'Why can Viscosity’s round trip compare bytes, where a printer’s round trip compares trees?',
    a: 'A printer chooses its own layout, so only the tree can match. Viscosity splices edits into the original text, so with no edits the text itself must match.',
  },
  'fresh-context': {
    q: 'Why does Viscosity’s differential test run the original and the compiled program each in a fresh Node `vm` context?',
    a: 'Each gets its own global object, so neither version can see globals or state the other left behind.',
  },
};

export const examples = {
  splice: {
    title: 'Three edits, back to front',
    code: `const src = 'ps.push({ x: i, vx: 1 });';
// the push's three real edits
const edits = [
  { start: 8, end: 13, text: '' },
  { start: 14, end: 20, text: ', ' },
  { start: 21, end: 23, text: '' },
];
const back = [...edits].sort(
  (a, b) => b.start - a.start);
let out = src;
for (const e of back) {
  out = out.slice(0, e.start)
    + e.text + out.slice(e.end);
  console.log(out);
}`,
  },
};

export const exercises = {
  applyEdits: {
    title: 'Apply range edits back to front',
    prompt: 'Write `applyEdits(src, edits)`. Each edit is `{ start, end, text }`: replace `src.slice(start, end)` with `text`. All offsets refer to the **original** `src`, and the edits arrive in any order. Apply them so the result is right, and **throw an `Error`** if two edits overlap (edits that only touch, like `[2, 4)` and `[4, 6)`, are fine). Don’t change the `edits` array you were given.',
    starter: `function applyEdits(src, edits) {
  let out = src;
  for (const e of edits) {
    out = out.slice(0, e.start)
      + e.text + out.slice(e.end);
  }
  return out;
}

const es = [
  { start: 4, end: 5, text: 'xs' },
  { start: 8, end: 10, text: 'C' },
];
const src = 'let a = [];';
console.log(applyEdits(src, es));`,
    solution: `function applyEdits(src, edits) {
  const es = [...edits].sort(
    (a, b) => b.start - a.start);
  let out = src;
  let last = Infinity;
  for (const e of es) {
    if (e.end > last) {
      throw new Error('overlap');
    }
    out = out.slice(0, e.start)
      + e.text + out.slice(e.end);
    last = e.start;
  }
  return out;
}`,
    tests: `test('edits in source order', () => {
  expect(applyEdits('let a = [];', [
    { start: 4, end: 5, text: 'xs' },
    { start: 8, end: 10, text: 'new C()' },
  ])).toBe('let xs = new C();');
});
test('edits in any order', () => {
  expect(applyEdits('p.x + p.y', [
    { start: 0, end: 3, text: 'ps.x[p]' },
    { start: 6, end: 9, text: 'ps.y[p]' },
  ].reverse())).toBe('ps.x[p] + ps.y[p]');
});
test('touching edits are fine', () => {
  expect(applyEdits('abcdef', [
    { start: 2, end: 4, text: 'X' },
    { start: 4, end: 6, text: 'Y' },
  ])).toBe('abXY');
});
test('overlaps throw', () => {
  expect(() => applyEdits('abcdef', [
    { start: 1, end: 4, text: 'X' },
    { start: 3, end: 5, text: 'Y' },
  ])).toThrow();
  expect(() => applyEdits('p.x += 1', [
    { start: 0, end: 3, text: 'a' },
    { start: 0, end: 3, text: 'b' },
  ])).toThrow();
});
test('the input array is untouched', () => {
  const es = [{ start: 0, end: 1, text: 'A' }, { start: 2, end: 3, text: 'C' }];
  applyEdits('abc', es);
  expect(es[0].start).toBe(0);
});`,
    hints: [
      'Applying front to back breaks as soon as one replacement has a different length. Sort a copy, highest `start` first.',
      'Remember the `start` of the edit you just applied. The next edit (further left) must end at or before it.',
      'Use `[...edits].sort(...)` so the caller’s array keeps its order.',
    ],
    walkthrough: `**How to think about it.** Try the naive way on paper first. Replace \`[0, 2)\` of \`'abcdef'\` with \`'XYZW'\` (two characters become four), and the text is now two characters longer, so an edit that was meant for \`[4, 6)\` of the *original* now lands on the wrong characters. The fix is to apply edits from the end of the text towards the start: an edit only ever shifts text to its right, and everything to its right has already been done. Overlap is the other case to think about: if two edits claim the same characters, no order can be right, so the function must refuse.

**The solution, line by line.**

- \`function applyEdits(src, edits) {\` takes the original text and the edits, in any order.
- \`  const es = [...edits].sort(\` / \`    (a, b) => b.start - a.start);\` copies the list (\`[...edits]\`, so the caller's array is not reordered) and sorts it by \`start\`, largest first: \`b.start - a.start\` is positive when \`b\` starts later, which puts \`b\` first.
- \`  let out = src;\` starts from the original text.
- \`  let last = Infinity;\` remembers the \`start\` of the edit applied last; nothing has been applied yet, so any first edit is fine.
- \`  for (const e of es) {\` walks the edits from right to left.
- \`    if (e.end > last) {\` / \`      throw new Error('overlap');\` checks that this edit (further left) ends at or before the start of the one just applied. Edits that only touch, like \`[2, 4)\` and \`[4, 6)\`, pass, because \`4 > 4\` is false.
- \`    out = out.slice(0, e.start)\` / \`      + e.text + out.slice(e.end);\` keeps everything before the range, puts the new text in, and keeps everything after. The offsets \`e.start\` and \`e.end\` are still right, because every change so far happened to their right.
- \`    last = e.start;\` records where this edit began.
- \`  return out;\` returns the finished text.

**Common wrong attempts.**

- Applying the edits in the order given (or sorted front to back) works only while every replacement has the same length as what it replaces; the first longer one shifts all later offsets.
- Sorting \`edits\` in place (\`edits.sort(...)\`) gives the right answer but reorders the caller's array, which the last test checks.
- Checking overlap with \`e.end >= last\` rejects edits that merely touch, which are perfectly fine.

This is the loop at the end of Viscosity's \`emitJs\`; the real sort also orders edits that start at the same place, so that an insertion and a replacement there come out in the right order.`,
    wrong: [
      {
        code: `function applyEdits(src, edits) {
  const es = [...edits].sort(
    (a, b) => a.start - b.start);
  let out = src;
  let last = -1;
  for (const e of es) {
    if (e.start < last) {
      throw new Error('overlap');
    }
    out = out.slice(0, e.start)
      + e.text + out.slice(e.end);
    last = e.end;
  }
  return out;
}`,
        why: 'Sorted front to back, the overlap check is right, but each replacement that changes length shifts the text under every later edit, so later offsets hit the wrong characters.',
      },
      {
        code: `function applyEdits(src, edits) {
  const es = [...edits].sort(
    (a, b) => b.start - a.start);
  let out = src;
  for (const e of es) {
    out = out.slice(0, e.start)
      + e.text + out.slice(e.end);
  }
  return out;
}`,
        why: 'The result is right for good input, but overlapping edits are applied silently, producing garbage instead of an error.',
      },
    ],
  },
  dedupe: {
    optional: true,
    title: 'One edit per range',
    prompt: 'Field edits come with a flag: `{ start, end, text, write }`. Write `dedupe(edits)`, returning a list with **one edit per `start`/`end` range**: the first one seen for that range, unless the kept one has `write: true` and a later one for the same range doesn’t, in which case the read replaces it. Keep ranges in the order they first appear.',
    starter: `function dedupe(edits) {
  return edits;
}`,
    solution: `function dedupe(edits) {
  const m = new Map();
  for (const e of edits) {
    const k = e.start + ':' + e.end;
    const prev = m.get(k);
    if (!prev
      || (!e.write && prev.write)) {
      m.set(k, e);
    }
  }
  return [...m.values()];
}`,
    tests: `const r = (start, end, text, write) => ({ start, end, text, write });
test('different ranges all kept', () => {
  const es = [r(0, 3, 'a', false), r(5, 8, 'b', true)];
  expect(dedupe(es).map((e) => e.text)).toEqual(['a', 'b']);
});
test('the read wins', () => {
  const es = [r(0, 3, 'write', true), r(0, 3, 'read', false)];
  expect(dedupe(es).map((e) => e.text)).toEqual(['read']);
});
test('a later write does not replace a read', () => {
  const es = [r(0, 3, 'read', false), r(0, 3, 'write', true)];
  expect(dedupe(es).map((e) => e.text)).toEqual(['read']);
});
test('order of first appearance', () => {
  const es = [r(9, 12, 'z', true), r(0, 3, 'a', false), r(9, 12, 'Z', false)];
  expect(dedupe(es).map((e) => e.text)).toEqual(['Z', 'a']);
});`,
    hints: [
      'Key a `Map` by `start + \':\' + end`.',
      'Replace the stored edit only if there is none yet, or the old one writes and the new one doesn’t.',
      'A `Map` keeps keys in insertion order, and `set` on an existing key keeps its position.',
    ],
    walkthrough: `**How to think about it.** Ask why two edits could share a range at all: in \`p.x += 1\`, lowering made a \`field.get\` and a \`field.set\`, and both point at the characters \`p.x\`, so each produces an edit there. Two edits on one range are an overlap, and the edit loop would (rightly) throw, so one must go. Which one? They differ only in the flag they pass to the bounds check, which chooses the error message, and JavaScript evaluates \`p.x += 1\` by reading \`p.x\` first; so out of bounds the message must be the read's, "Cannot read properties of undefined (reading 'x')". Hence: keep one edit per range, and let a read replace a write.

**The solution, line by line.**

- \`function dedupe(edits) {\` takes the field edits, each with a \`write\` flag.
- \`  const m = new Map();\` maps a range to the edit kept for it.
- \`  for (const e of edits) {\` visits the edits in order.
- \`    const k = e.start + ':' + e.end;\` makes one key per range, such as \`'93:96'\`.
- \`    const prev = m.get(k);\` looks up the edit already kept for this range, if any.
- \`    if (!prev\` / \`      || (!e.write && prev.write)) {\` keeps \`e\` when the range is new, or when \`e\` is a read and the kept one is a write.
- \`      m.set(k, e);\` stores it. Setting a key that already exists keeps the key's original position in the map, so ranges stay in the order they first appeared.
- \`  return [...m.values()];\` returns one edit per range.

**Common wrong attempts.**

- Keeping the last edit for each range lets a write replace a read, and the compiled code would then say "Cannot set properties of undefined" where the original says "Cannot read".
- Deleting and re-adding the key (to replace an edit) moves the range to the end of the map and breaks the order test.

The real \`fieldEdit\` in \`emit.ts\` ranks three kinds, write 0, read 1 and late 2, and keeps the highest; a late store (for an assignment whose right side may run code) covers the read as well.`,
    wrong: [
      {
        code: `function dedupe(edits) {
  const m = new Map();
  for (const e of edits) {
    m.set(e.start + ':' + e.end, e);
  }
  return [...m.values()];
}`,
        why: 'Last one wins, so a write that comes after the read replaces it.',
      },
    ],
  },
  diffRun: {
    optional: true,
    title: 'A differential tester for programs',
    prompt: 'Programs are strings of JavaScript that print with `log(...)`. Write `outcome(code)`, which runs `code` with `new Function(\'log\', code)`, and returns `{ out, error }`: `out` is the list of printed lines (arguments joined with a space), and `error` is `null`, or `name + \': \' + message` of the uncaught error. Then write `diffRun(progs, transform)`: return the index of the first program whose outcome differs from the outcome of `transform(program)`, comparing every line and the error, or `-1` if all agree.',
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
};

export const quiz = [
  {
    q: 'What does Viscosity do with a comment on a line it rewrites, such as `ps.push({ x: i }); // spawn`?',
    options: [
      {
        t: 'Drops it, because comments are not in the AST',
        why: 'Viscosity never reprints from the AST, so nothing it doesn’t edit can be lost.',
      },
      {
        t: 'Moves it to the top of the file',
        why: 'Only the prelude goes at the top.',
      },
      {
        t: 'Keeps it exactly where it was: only the object literal’s range is replaced',
        correct: true,
        why: 'The push edit covers `{ x: i }` alone; everything else is copied.',
      },
      {
        t: 'Reformats it with the rest of the line',
        why: 'There is no formatter: untouched text is copied byte for byte.',
      },
    ],
  },
  {
    q: 'A splicing emitter has two edits, both given as offsets into the original text: 11–13 (2 characters replaced by 14) and 55–60. In which order must it apply them, and why?',
    options: [
      {
        t: '11–13 first, because it comes first in the file',
        why: 'That would shift 55–60 by 12 characters, breaking its offsets.',
      },
      {
        t: 'In any order: offsets are recomputed after each edit',
        why: 'They are not recomputed; that is why the order matters.',
      },
      {
        t: 'Both at once, with a regular expression',
        why: 'Each is a separate slice-and-join.',
      },
      {
        t: '55–60 first: applying later edits first leaves earlier offsets valid',
        correct: true,
        why: 'Sorted by start, descending.',
      },
    ],
  },
  {
    q: 'Which statement about pretty-printing is true?',
    options: [
      {
        t: 'Viscosity pretty-prints the whole output',
        why: 'It only splices edits; even the prelude is template text.',
      },
      {
        t: 'It needs only the tree, so it keeps the original layout',
        why: 'The tree doesn’t record the original layout; that is what gets lost.',
      },
      {
        t: 'It is the same as splicing',
        why: 'Splicing copies the original text; printing regenerates it.',
      },
      {
        t: 'It prints code from a tree in a chosen style, discarding the original formatting',
        correct: true,
        why: 'Which is why Viscosity avoids it.',
      },
    ],
  },
  {
    q: 'For a source-to-source compiler that splices edits into the original text, why is “a file with nothing to transform comes back unchanged” a stronger check than parse → print → parse?',
    options: [
      {
        t: 'It compares bytes, not trees, which only a splicing emitter can promise',
        correct: true,
        why: 'A printer can produce a different text for the same tree; splicing can’t.',
      },
      {
        t: 'It runs the program',
        why: 'The round trip doesn’t run anything; the differential test does.',
      },
      {
        t: 'It uses two parsers',
        why: 'That is the parser-equivalence test.',
      },
      {
        t: 'It is not stronger',
        why: 'Byte equality implies tree equality, but not the other way round.',
      },
    ],
  },
  {
    q: 'A front end has three tests: a byte-identity round trip for files with nothing to transform, a differential test comparing printed lines and uncaught errors, and a check that two parsers agree. A buggy transform turns `ps[100].x` (which throws) into code that prints `0`. Which test catches it?',
    options: [
      {
        t: 'The round trip',
        why: 'The file has something to transform, so the round trip doesn’t apply.',
      },
      {
        t: 'Parser equivalence',
        why: 'Both parsers would produce the same wrong code.',
      },
      {
        t: 'None of them',
        why: 'The differential test compares errors as well as output.',
      },
      {
        t: 'The differential test: the original ends with a TypeError, the compiled one doesn’t',
        correct: true,
        why: 'Outcomes include the uncaught error.',
      },
    ],
  },
];
