// Chapter 176 cards. Keys are stable ids: never rename them.

export const prompts = {
  'ann-what': {
    q: 'What is an annotation, in a compiler?',
    a: 'A comment or marker that gives the compiler extra instructions without changing what the program means.',
  },
  'ann-forms': {
    q: 'What are Viscosity’s three annotations?',
    a: '`// @viscosity aos`, `// @viscosity soa` and `// @viscosity aosoa(N)`.',
  },
  'ann-b': {
    q: 'Why does the annotation pattern have `\\b` after the layout name?',
    a: 'So a longer word, like `@viscosity soap`, is not read as `soa`.',
  },
  'ann-comment-why': {
    q: 'Why is a Viscosity annotation a comment rather than new syntax?',
    a: 'The program stays ordinary JavaScript, and runs the same with or without Viscosity.',
  },
  'ann-where': {
    q: 'Which declarations does a matching `@viscosity` comment apply to?',
    a: 'Alone on its line: every declaration on the next line. After code on a line (trailing): only declarations on that same line.',
  },
  'ann-case': {
    q: 'What does Viscosity do with `// @viscosity SoA`?',
    a: 'Nothing: the pattern is case-sensitive, so it is an ordinary comment, with no warning.',
  },
  'ann-aos': {
    q: 'How do you stop Viscosity from transforming one collection?',
    a: 'Put `// @viscosity aos` on the line above its declaration (or at the end of that line).',
  },
  'ann-soa-skips': {
    q: 'Which planner rules does `@viscosity soa` skip?',
    a: 'All the cost rules: numeric fields, a loop touching fields, and the size threshold.',
  },
  'ann-aosoa': {
    q: 'What does `@viscosity aosoa(N)` require?',
    a: 'Every field provably numeric, and N a power of two, at most 65536 (8 if omitted).',
  },
  'ann-unsafe': {
    q: 'Can an annotation make Viscosity transform a collection with a bailout?',
    a: 'No. Safety is checked before annotations; the collection is kept with an “unsafe” reason.',
  },
  'ann-optin': {
    q: 'What does `--mode opt-in` change?',
    a: 'Only annotated collections are transformed; the rest are kept with “opt-in mode: not annotated”.',
  },
};

export const examples = {
  pattern: {
    title: 'The annotation pattern',
    code: `// The pattern from frontend-js.
const ANN = new RegExp(
  '@viscosity\\\\s+(aosoa|soa|aos)\\\\b'
  + '(?:\\\\(([^)]*)\\\\))?');

const tests = [
  ' @viscosity soa',
  ' @viscosity aosoa(4)',
  ' @viscosity aosoa(x)',
  ' @viscosity aosoa',
  ' @viscosity SoA',
  ' @viscosity soap',
  ' keep this one @viscosity aos!',
];
for (const t of tests) {
  const m = ANN.exec(t);
  console.log(JSON.stringify(t), '->',
    m ? m[1] + ' ' + (m[2] ?? '-')
      : 'no match');
}`,
  },
};

export const exercises = {
  findAnnotations: {
    title: 'Attach annotations to declarations',
    prompt:
      'Write `findAnnotations(src)`. Split `src` into lines (line 1 is the first). A line holds a comment if it contains `//`; the comment is the text after it. If the comment matches `/@viscosity\\s+(aosoa|soa|aos)\\b(?:\\((\\d+)\\))?/`, it applies to declarations on one line: if nothing but spaces comes before the `//`, the next line; otherwise (a trailing comment) its own line only. A declaration is a line matching `/^\\s*(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)/`. Return an object mapping each annotated name to its layout: `\'aos\'`, `\'soa\'`, or `\'aosoa(N)\'` with N defaulting to 8.',
    starter: `function findAnnotations(src) {
  const out = {};
  return out;
}`,
    solution: `const ANN = new RegExp(
  '@viscosity\\\\s+(aosoa|soa|aos)\\\\b'
  + '(?:\\\\((\\\\d+)\\\\))?');
const DECL = new RegExp(
  '^\\\\s*(?:const|let|var)\\\\s+'
  + '([A-Za-z_$][\\\\w$]*)');

function findAnnotations(src) {
  const lines = src.split('\\n');
  const out = {};
  lines.forEach((line, i) => {
    const at = line.indexOf('//');
    if (at < 0) return;
    const m = ANN.exec(line.slice(at));
    if (!m) return;
    let lay = m[1];
    if (lay === 'aosoa') {
      lay += '(' + (m[2] ?? 8) + ')';
    }
    const own =
      line.slice(0, at).trim() === '';
    const j = own ? i + 1 : i;
    const d = DECL.exec(lines[j] ?? '');
    if (d) out[d[1]] = lay;
  });
  return out;
}`,
    tests: `test('the line above', () => {
  const s = '// @viscosity aos\\nconst ps = [];';
  expect(findAnnotations(s))
    .toEqual({ ps: 'aos' });
});
test('a trailing comment', () => {
  const s = 'let qs = []; // @viscosity soa';
  expect(findAnnotations(s))
    .toEqual({ qs: 'soa' });
});
test('aosoa with and without a size', () => {
  const s = '// @viscosity aosoa(4)\\n'
    + 'const a = [];\\n'
    + '// @viscosity aosoa\\n'
    + 'const b = [];';
  expect(findAnnotations(s))
    .toEqual({ a: 'aosoa(4)', b: 'aosoa(8)' });
});
test('wrong case is ignored', () => {
  const s = '// @viscosity SoA\\nconst ps = [];';
  expect(findAnnotations(s)).toEqual({});
});
test('a blank line breaks it', () => {
  const s = '// @viscosity soa\\n\\nconst ps = [];';
  expect(findAnnotations(s)).toEqual({});
});
test('soap is not soa', () => {
  const s = '// @viscosity soap\\nconst ps = [];';
  expect(findAnnotations(s)).toEqual({});
});
test('a trailing comment stays on its line', () => {
  const s = 'const a = []; // @viscosity aos\\n'
    + 'const b = [];';
  expect(findAnnotations(s))
    .toEqual({ a: 'aos' });
});
test('an indented comment is alone', () => {
  const s = '  // @viscosity soa\\n'
    + '  let b = [];';
  expect(findAnnotations(s))
    .toEqual({ b: 'soa' });
});`,
    hints: [
      'Use `line.indexOf(\'//\')` to find the comment, and run the pattern on the text from there.',
      'The comment is alone on its line when `line.slice(0, at).trim()` is empty. Then look at line `i + 1`; otherwise at line `i`.',
      'For `aosoa`, `m[2]` is `undefined` when there is no size: use `m[2] ?? 8`.',
    ],
    walkthrough: `The real plugin gets comments and declarations from the parser, so it never confuses \`//\` inside a string with a comment. With plain lines, \`indexOf('//')\` is a good-enough stand-in.

The core is the rule from \`frontend-js/src/index.ts\`: a comment alone on its line annotates the next line, and a trailing comment annotates only its own line. Whether anything but spaces comes before the \`//\` decides which single line to look at, so a trailing comment on line 1 never reaches a declaration on line 2. (An older version of the plugin checked both lines for every comment, and so did reach it: a corpus test now guards the stricter rule.)

Everything else falls out of the pattern. It is case-sensitive, so \`SoA\` doesn't match. The \`\\b\` rejects \`soap\`. And a blank line means the declaration is two lines away, out of reach. In every case the result is simply no annotation, and no error, which is why the chapter tells you to check with \`viscosity explain\`.`,
    wrong: [
      {
        code: `const ANN = new RegExp(
  '@viscosity\\\\s+(aosoa|soa|aos)\\\\b'
  + '(?:\\\\((\\\\d+)\\\\))?', 'i');
const DECL = new RegExp(
  '^\\\\s*(?:const|let|var)\\\\s+'
  + '([A-Za-z_$][\\\\w$]*)');

function findAnnotations(src) {
  const lines = src.split('\\n');
  const out = {};
  lines.forEach((line, i) => {
    const at = line.indexOf('//');
    if (at < 0) return;
    const m = ANN.exec(line.slice(at));
    if (!m) return;
    let lay = m[1];
    if (lay === 'aosoa') {
      lay += '(' + (m[2] ?? 8) + ')';
    }
    const own =
      line.slice(0, at).trim() === '';
    const j = own ? i + 1 : i;
    const d = DECL.exec(lines[j] ?? '');
    if (d) out[d[1]] = lay;
  });
  return out;
}`,
        why: 'The `i` flag makes the match case-insensitive, so `@viscosity SoA` is accepted (as `SoA`, which is not a layout). The real pattern is case-sensitive.',
      },
      {
        code: `const ANN = new RegExp(
  '@viscosity\\\\s+(aosoa|soa|aos)\\\\b'
  + '(?:\\\\((\\\\d+)\\\\))?');
const DECL = new RegExp(
  '^\\\\s*(?:const|let|var)\\\\s+'
  + '([A-Za-z_$][\\\\w$]*)');

function findAnnotations(src) {
  const lines = src.split('\\n');
  const out = {};
  lines.forEach((line, i) => {
    const at = line.indexOf('//');
    if (at < 0) return;
    const m = ANN.exec(line.slice(at));
    if (!m) return;
    let lay = m[1];
    if (lay === 'aosoa') {
      lay += '(' + (m[2] ?? 8) + ')';
    }
    const next = lines[i + 1] || '';
    const d = DECL.exec(next);
    if (d) out[d[1]] = lay;
  });
  return out;
}`,
        why: 'Only the next line is checked, so a trailing comment misses the declaration on its own line and wrongly annotates the line below.',
      },
    ],
  },
  checkAnn: {
    optional: true,
    title: 'Refuse a bad AoSoA annotation',
    prompt:
      'Write `checkAnn(ann, fields, num)`. `ann` is `{ layout, block }` (block may be `undefined`), `fields` lists the field names, and `num` is a `Set` of the provably numeric ones. Return `null` if the annotation is usable. For `aosoa`, return `\'fields id, tag may hold non-numbers\'` (the non-numeric fields in order, joined by `, `) if any field isn’t numeric, or else `\'block size must be a power of two\'` if the block (default 8) isn’t one.',
    starter: `function checkAnn(ann, fields, num) {
  return null;
}`,
    solution: `function checkAnn(ann, fields, num) {
  if (ann.layout !== 'aosoa') {
    return null;
  }
  const bad = fields.filter(
    (f) => !num.has(f));
  if (bad.length > 0) {
    return 'fields ' + bad.join(', ')
      + ' may hold non-numbers';
  }
  const b = ann.block ?? 8;
  if (!Number.isInteger(Math.log2(b))) {
    return 'block size must be a '
      + 'power of two';
  }
  return null;
}`,
    tests: `const num = new Set(['x', 'y']);
test('soa is always usable here', () => {
  const a = { layout: 'soa' };
  expect(checkAnn(a, ['x', 'id'], num))
    .toBe(null);
});
test('aosoa with numbers only', () => {
  const a = { layout: 'aosoa', block: 4 };
  expect(checkAnn(a, ['x', 'y'], num))
    .toBe(null);
});
test('aosoa with a string field', () => {
  const a = { layout: 'aosoa' };
  const f = ['x', 'id', 'tag'];
  expect(checkAnn(a, f, num))
    .toBe('fields id, tag may hold non-numbers');
});
test('block 6 is refused', () => {
  const a = { layout: 'aosoa', block: 6 };
  expect(checkAnn(a, ['x'], num))
    .toBe('block size must be a power of two');
});
test('the default block is 8', () => {
  const a = { layout: 'aosoa' };
  expect(checkAnn(a, ['y'], num)).toBe(null);
});`,
    hints: [
      'Only `aosoa` has conditions; return `null` at once for anything else.',
      '`Math.log2(b)` is a whole number exactly when `b` is a power of two.',
    ],
    walkthrough: `These are the two conditions from the chapter. The numeric check mirrors the planner in \`core/src/plan.ts\`, which refuses an AoSoA annotation with “annotated aosoa, but fields … may hold non-numbers”: an AoSoA block is a single \`Float64Array\`, so a string has nowhere to go. The power-of-two check is needed because the generated index arithmetic uses shifts and masks, as chapter 181 shows. The planner makes it too (before the numeric one), and keeps the collection with “annotated aosoa(6), but the block size must be a power of two (2, 4, 8, 16, ...)”, just as this function returns a message instead of failing.`,
    wrong: [
      {
        code: `function checkAnn(ann, fields, num) {
  if (ann.layout !== 'aosoa') {
    return null;
  }
  const bad = fields.filter(
    (f) => !num.has(f));
  if (bad.length > 0) {
    return 'fields ' + bad.join(', ')
      + ' may hold non-numbers';
  }
  if (ann.block % 2 !== 0) {
    return 'block size must be a '
      + 'power of two';
  }
  return null;
}`,
        why: 'Even is not the same as a power of two: 6 passes. And an omitted block (`undefined % 2` is `NaN`) is refused instead of defaulting to 8.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Where must `// @viscosity soa` go to annotate `const ps = [];` on line 10?',
    options: [
      { t: 'Anywhere above line 10 in the same function.', why: 'A comment alone on its line reaches only the next line. Further away, it attaches to nothing.' },
      { t: 'On line 9 or at the end of line 10.', correct: true, why: 'Right: alone on line 9 it annotates line 10, and a trailing comment on line 10 annotates its own line.' },
      { t: 'Only on line 9.', why: 'A trailing comment on line 10 works too: it is on the declaration’s own line.' },
      { t: 'On line 11, just after it.', why: 'A comment alone on its line applies to the next line, and a trailing one to its own line: never the line before.' },
    ],
  },
  {
    q: 'A collection is passed to `console.log` and annotated `// @viscosity soa`. What does explain say?',
    options: [
      { t: '“annotated @viscosity soa at line N”, and it becomes SoA.', why: 'Annotations come after the safety rung. They can’t make an observable change safe.' },
      { t: 'An error: annotations can’t be used on logged arrays.', why: 'There is no error. The collection is simply kept, with a reason.' },
      { t: '“unsafe: the array is passed to a method call…”, and it is kept.', correct: true, why: 'Yes. Safety is checked first, and nothing overrides it.' },
    ],
  },
  {
    q: 'What does `// @viscosity SoA` do?',
    options: [
      { t: 'Nothing: it doesn’t match, and there is no warning.', correct: true, why: 'The pattern is case-sensitive. Check with viscosity explain that annotations landed.' },
      { t: 'The same as `// @viscosity soa`.', why: 'The layout names are matched exactly, in lower case.' },
      { t: 'A compile error naming the bad layout.', why: 'Viscosity never sees it as an annotation, so there is nothing to report.' },
    ],
  },
  {
    q: 'An annotated `@viscosity soa` collection has 3 elements. What does the size rule do?',
    options: [
      { t: 'Keeps it: 3 is below the 64-element threshold.', why: 'The size rule is a cost rule, and an annotation skips every cost rule.' },
      { t: 'Asks for a profile to confirm the size.', why: 'Nothing is asked. The size is only reported, as “about 3 elements”.' },
      { t: 'Chooses AoSoA instead, as a compromise.', why: 'The annotation names the layout; the planner uses it.' },
      { t: 'Nothing: the annotation skips it, and the size is only reported.', correct: true, why: 'Right, as in literal_init.js: three points, struct of arrays.' },
    ],
  },
  {
    q: 'Which annotation is refused for `{ x, id }`, where `id` is a string?',
    options: [
      { t: '`@viscosity soa`', why: 'SoA gives `id` a plain-array column, so it works.' },
      { t: '`@viscosity aosoa(8)`', correct: true, why: 'Yes: an AoSoA block is one Float64Array, so every field must be numeric.' },
      { t: '`@viscosity aos`', why: 'Keeping objects is always possible.' },
    ],
  },
  {
    q: 'With `--mode opt-in`, what happens to an unannotated collection that would win easily as SoA?',
    options: [
      { t: 'It becomes SoA, because the cost model says so.', why: 'In opt-in mode the cost model never sees unannotated collections.' },
      { t: 'It is kept, with “opt-in mode: not annotated”.', correct: true, why: 'Right: opt-in mode only transforms what you mark.' },
      { t: 'Viscosity prints a suggestion to annotate it.', why: 'It records a reason in explain, but suggests nothing.' },
    ],
  },
];
