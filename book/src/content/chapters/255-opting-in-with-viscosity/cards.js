// Chapter 255 cards. Keys are stable ids: never rename them.

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
  'ann-where': {
    q: 'Which declarations does a matching `@viscosity` comment apply to?',
    a: 'Alone on its line: every declaration on the next line. After code on a line (trailing): only declarations on that same line.',
  },
  'ann-case': {
    q: 'What does Viscosity do with `// @viscosity SoA`?',
    a: 'Nothing: the pattern is case-sensitive, so it is an ordinary comment, with no warning.',
  },
  'ann-soa-skips': {
    q: 'Which planner rules does `@viscosity soa` skip?',
    a: 'All the cost rules: numeric fields, a loop touching fields, and the size threshold.',
  },
  'ann-aosoa': {
    q: 'What does `@viscosity aosoa(N)` require?',
    a: 'N a power of two, at most 65536 (8 if omitted), and every field provably numeric.',
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
    walkthrough: `**How to think about it.** There are two separate jobs: deciding whether a line holds an annotation at all, and deciding which line it is about. Do them in that order. For the first, find the comment and run the pattern on it. For the second, the only question is whether anything but spaces comes before the \`//\`: if not, the comment is alone and the target is the next line; if so, it trails code and the target is its own line. Then a second pattern pulls the declared name out of the target line. The real plugin gets comments and declarations from the parser (so it never mistakes \`//\` inside a string for a comment); with plain lines, \`indexOf('//')\` is a good-enough stand-in.

**The solution, line by line.**

- \`const ANN = new RegExp(...)\` builds the annotation pattern from the chapter, with \`(\\d+)\` in the brackets so only digits are captured. It is written as a string, so every backslash is doubled.
- \`const DECL = new RegExp(...)\` matches a declaration: optional spaces, \`const\`, \`let\` or \`var\`, at least one space, and a name, captured as group 1.
- \`const lines = src.split('\\n');\` cuts the source into lines; index \`i\` holds line \`i + 1\`.
- \`const out = {};\` is the result, name to layout.
- \`lines.forEach((line, i) => {\` visits each line with its index.
- \`const at = line.indexOf('//');\` finds the comment; \`if (at < 0) return;\` skips lines with none (inside \`forEach\`, \`return\` moves on to the next line).
- \`const m = ANN.exec(line.slice(at));\` runs the pattern on the comment only; \`if (!m) return;\` skips comments that do not match, which is where \`SoA\` and \`soap\` fall out, silently.
- \`let lay = m[1];\` is the layout word, and \`if (lay === 'aosoa') lay += '(' + (m[2] ?? 8) + ')';\` adds the block size, using 8 when \`m[2]\` is \`undefined\`.
- \`const own = line.slice(0, at).trim() === '';\` is true when only spaces come before the comment.
- \`const j = own ? i + 1 : i;\` picks the one line to look at: the next, or this one.
- \`const d = DECL.exec(lines[j] ?? '');\` reads that line (\`?? ''\` covers a comment on the last line, where \`lines[j]\` does not exist), and \`if (d) out[d[1]] = lay;\` records the name.

A blank line between comment and declaration needs no code: line \`j\` is blank, \`DECL\` fails, and nothing is recorded, exactly as in the real plugin.

**Common wrong attempts.**

- Adding the \`i\` flag to the pattern makes it case-insensitive, so \`@viscosity SoA\` is accepted (with the layout \`SoA\`, which is not one); the real pattern is case-sensitive.
- Always looking at the next line misses a trailing comment's own declaration and annotates the line below instead.
- Looking at both lines for every comment lets a trailing comment on line 1 reach line 2 as well; an older version of the plugin did exactly this, and a corpus test (\`trailing_annotation.js\`) now pins the stricter rule.`,
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
      'Write `checkAnn(ann, fields, num)`. `ann` is `{ layout, block }` (block may be `undefined`), `fields` lists the field names, and `num` is a `Set` of the provably numeric ones. Return `null` if the annotation is usable. For `aosoa`, check in the planner’s order: first return `\'block size must be a power of two\'` if the block (default 8) isn’t one; then return `\'fields id, tag may hold non-numbers\'` (the non-numeric fields in order, joined by `, `) if any field isn’t numeric.',
    starter: `function checkAnn(ann, fields, num) {
  return null;
}`,
    solution: `function checkAnn(ann, fields, num) {
  if (ann.layout !== 'aosoa') {
    return null;
  }
  const b = ann.block ?? 8;
  const pow2 = b >= 2
    && Number.isInteger(Math.log2(b));
  if (!pow2) {
    return 'block size must be a '
      + 'power of two';
  }
  const bad = fields.filter(
    (f) => !num.has(f));
  if (bad.length > 0) {
    return 'fields ' + bad.join(', ')
      + ' may hold non-numbers';
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
    walkthrough: `**How to think about it.** Only \`aosoa\` has conditions, so deal with everything else first and get it out of the way. Then follow the planner's own order in \`core/src/plan.ts\`: the block size is judged before the fields (the real planner also checks that N is at most 65536 first; this exercise leaves that rung out). Each check returns its message at once, so the first failure is the one reported.

**The solution, line by line.**

- \`if (ann.layout !== 'aosoa') { return null; }\` accepts \`aos\` and \`soa\` straight away: \`soa\` can always give a non-number a plain-array column.
- \`const b = ann.block ?? 8;\` uses 8 when no size was written, as the planner does.
- \`const pow2 = b >= 2 && Number.isInteger(Math.log2(b));\` is the planner's power-of-two test: \`Math.log2(8)\` is \`3\`, a whole number, while \`Math.log2(6)\` is about \`2.585\`; and \`b >= 2\` rules out 1 (whose \`log2\` is \`0\`, a whole number, but a block of one element is no block at all).
- \`if (!pow2)\` returns the message at once.
- \`const bad = fields.filter((f) => !num.has(f));\` keeps, in order, the fields that are not provably numeric.
- \`if (bad.length > 0)\` returns \`'fields ' + bad.join(', ') + ' may hold non-numbers'\`, the same wording as the real reason "annotated aosoa, but fields id may hold non-numbers"; an AoSoA block is one \`Float64Array\`, so a string has nowhere to go.
- \`return null;\` means the annotation is usable.

**Common wrong attempts.**

- Testing \`ann.block % 2 !== 0\`: even is not the same as a power of two, so 6 passes; and a missing block gives \`undefined % 2\`, which is \`NaN\`, so the default 8 is wrongly refused.
- Leaving out \`b >= 2\` accepts a block of 1, since \`Math.log2(1)\` is \`0\`; the planner asks for at least 2.`,
    wrong: [
      {
        code: `function checkAnn(ann, fields, num) {
  if (ann.layout !== 'aosoa') {
    return null;
  }
  if (ann.block % 2 !== 0) {
    return 'block size must be a '
      + 'power of two';
  }
  const bad = fields.filter(
    (f) => !num.has(f));
  if (bad.length > 0) {
    return 'fields ' + bad.join(', ')
      + ' may hold non-numbers';
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
      { t: 'An error: annotations can’t be used on logged arrays.', why: 'There is no error. The collection is kept, with a reason.' },
      { t: '“unsafe: the array is passed to a method call…”, and it is kept.', correct: true, why: 'Yes. Safety is checked first, and nothing overrides it.' },
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
