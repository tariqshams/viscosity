// Chapter 69 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 109, 109.

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
  'pgo-why-here': {
    q: 'Why can’t Viscosity estimate the size of `ps` when the push is inside a function `spawn` called from a loop?',
    a: 'The estimate counts pushes in top-level loops with constant trip counts. A push inside a function depends on how often it is called, so the size is unknown.',
  },
  'pgo-what': {
    q: 'What is profile-guided optimisation (PGO)?',
    a: 'Compiling with measurements from real runs of the program (a profile), not only with what the source reveals.',
  },
  'inst-what': {
    q: 'What is instrumentation?',
    a: 'Code added to a program to record what it does while it runs, without changing what it does.',
  },
  'track-return': {
    q: 'Why must `__vsc_track(name, arr)` return `arr` itself, not a copy?',
    a: 'So the instrumented program behaves exactly like the original. With a copy, pushes and `===` would change, and the profile would describe a different program.',
  },
  'exit-hook': {
    q: 'When does the instrumented program read the lengths of the tracked arrays?',
    a: 'Once, in a `process.on(\'exit\')` hook, which writes them to the profile file.',
  },
  'profile-safety': {
    q: 'Can a profile make Viscosity transform a collection that failed a safety check?',
    a: 'No. The profile is read only at the size threshold, after every safety check has passed.',
  },
  'profile-input': {
    q: 'You profile with a 20-element test input, but production uses a million elements. What happens?',
    a: 'Viscosity keeps the collection as objects (measured 20 < 64), so production loses the speed-up. It is still correct.',
  },
  'profile-correct': {
    q: 'Why can a wrong profile cost Viscosity speed but never correctness?',
    a: 'It only chooses between two layouts that are already proven to behave identically.',
  },
  'jit-pgo': {
    q: 'How does V8’s use of profiles differ from Viscosity’s?',
    a: 'V8 profiles during the same run and speculates on the feedback, so it needs guards and deoptimisation. Viscosity profiles ahead of time and only picks a size threshold.',
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
  track: {
    title: 'Instrumentation by hand',
    code: `// The tracker from the prelude.
const seen = [];
function track(name, arr) {
  seen.push([name, arr]);
  return arr; // the same array
}
function report() {
  const p = {};
  for (const [n, a] of seen) {
    const old = p[n]
      ? p[n].maxLength : 0;
    const len = a.length;
    p[n] = {
      maxLength: Math.max(old, len),
    };
  }
  return p;
}

// The program, instrumented:
const ps = track('ps', []);
function spawn(x) {
  ps.push({ x, vx: 1 });
}
const waves = 20; // try 5000
for (let i = 0; i < waves; i++) {
  spawn(i);
}
for (let i = 0; i < ps.length; i++) {
  ps[i].x += ps[i].vx;
}
console.log(ps[0].x);

// What the exit hook would write:
const prof = report();
console.log(JSON.stringify(prof));
const n = prof.ps.maxLength;
console.log(n < 64
  ? 'kept as objects (measured)'
  : 'struct of arrays (measured)');`,
  },
};

export const exercises = {
  findAnnotations: {
    title: 'Attach annotations to declarations',
    prompt: 'Write `findAnnotations(src)`. Split `src` into lines (line 1 is the first). A line holds a comment if it contains `//`; the comment is the text after it. If the comment matches `/@viscosity\\s+(aosoa|soa|aos)\\b(?:\\((\\d+)\\))?/`, it applies to declarations on one line: if nothing but spaces comes before the `//`, the next line; otherwise (a trailing comment) its own line only. A declaration is a line matching `/^\\s*(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)/`. Return an object mapping each annotated name to its layout: `\'aos\'`, `\'soa\'`, or `\'aosoa(N)\'` with N defaulting to 8.',
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
    prompt: 'Write `checkAnn(ann, fields, num)`. `ann` is `{ layout, block }` (block may be `undefined`), `fields` lists the field names, and `num` is a `Set` of the provably numeric ones. Return `null` if the annotation is usable. For `aosoa`, check in the planner’s order: first return `\'block size must be a power of two\'` if the block (default 8) isn’t one; then return `\'fields id, tag may hold non-numbers\'` (the non-numeric fields in order, joined by `, `) if any field isn’t numeric.',
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
  maxTracker: {
    title: 'Instrument an array factory',
    prompt: 'Write `makeTracker()`. It returns an object with two methods. `track(name, arr)` remembers `arr` under `name` and returns **the same array**. `profile()` returns an object mapping each name to `{ maxLength }`: the largest `.length`, **read when `profile()` is called**, among all arrays tracked under that name.',
    starter: `function makeTracker() {
  const seen = [];
  return {
    track(name, arr) {
      // your code here
      return arr;
    },
    profile() {
      return {};
    },
  };
}`,
    solution: `function makeTracker() {
  const seen = [];
  return {
    track(name, arr) {
      seen.push([name, arr]);
      return arr;
    },
    profile() {
      const p = {};
      for (const [n, a] of seen) {
        const old = p[n]
          ? p[n].maxLength : 0;
        const len = a.length;
        p[n] = {
          maxLength: Math.max(old, len),
        };
      }
      return p;
    },
  };
}`,
    tests: `test('returns the very same array', () => {
  const t = makeTracker();
  const a = [];
  expect(t.track('a', a) === a).toBe(true);
});
test('reads lengths when profile() is called', () => {
  const t = makeTracker();
  const a = t.track('a', []);
  a.push(1, 2, 3);
  expect(t.profile()).toEqual({ a: { maxLength: 3 } });
});
test('max over arrays with one name, any order', () => {
  const t = makeTracker();
  t.track('ps', [1, 2, 3, 4, 5]);
  t.track('ps', [1, 2]);
  const u = makeTracker();
  u.track('ps', [1, 2]);
  u.track('ps', [1, 2, 3, 4, 5]);
  expect(t.profile().ps.maxLength).toBe(5);
  expect(u.profile().ps.maxLength).toBe(5);
});
test('separate names', () => {
  const t = makeTracker();
  t.track('a', [1]);
  t.track('b', []);
  expect(t.profile()).toEqual({ a: { maxLength: 1 }, b: { maxLength: 0 } });
});
test('trackers are independent', () => {
  const t = makeTracker();
  const u = makeTracker();
  t.track('a', [1, 2]);
  expect(u.profile()).toEqual({});
});`,
    hints: [
      'In `track`, push the pair `[name, arr]` onto `seen` and return `arr` unchanged.',
      'In `profile`, loop over `seen` and read `a.length` now, not when the array was tracked.',
      'Keep the maximum per name: start from 0 when a name is new, then `Math.max(old, a.length)`.',
    ],
    walkthrough: `**How to think about it.** This is the prelude that \`viscosity profile\` puts in front of your program, turned into a reusable object. Two facts decide the design. First, the tracked array is usually empty when it is tracked (\`const ps = __vsc_track("ps", [])\`), and its interesting length exists only later; so \`track\` must remember the *array*, and \`profile\` must read its length at the moment it is called. Second, instrumentation must not change the program, so \`track\` must hand back the very array it was given.

**The solution, line by line.**

- \`const seen = [];\` inside \`makeTracker\` is private to this tracker: the returned methods close over it (a closure), so two trackers never share state.
- \`track(name, arr) {\` takes the collection's name and the array.
- \`seen.push([name, arr]);\` remembers the pair: the name, and a reference to the array itself, not a copy and not its length.
- \`return arr;\` hands back the same array, so \`track('a', a) === a\` and every later \`push\` lands in the array the program is using.
- \`profile() {\` builds the result when asked.
- \`const p = {};\` maps names to \`{ maxLength }\`.
- \`for (const [n, a] of seen) {\` visits each tracked pair, unpacking the name and the array.
- \`const old = p[n] ? p[n].maxLength : 0;\` is the largest length seen so far under this name, or 0 for a new name.
- \`const len = a.length;\` reads the length now, which is the point.
- \`p[n] = { maxLength: Math.max(old, len) };\` keeps the larger, so the order in which arrays were tracked does not matter.
- \`return p;\` after the loop.

**Common wrong attempts.**

- Recording \`arr.length\` inside \`track\` stores 0 for an array that was just created; the real hook reads lengths at exit for exactly this reason.
- Writing \`p[n] = { maxLength: a.length }\` lets the last array under a name win, even if an earlier one was longer. Code that runs \`const ps = []\` in a function called twice tracks two arrays under one name.
- Returning a copy (\`[...arr]\`) changes the program: \`===\` is false, and the program's pushes go into an array the tracker never sees.

The real hook finally writes \`p\` with \`JSON.stringify\` to the file named by the \`VSC_PROFILE_OUT\` environment variable.`,
    wrong: [
      {
        code: `function makeTracker() {
  const seen = [];
  return {
    track(name, arr) {
      seen.push([name, arr.length]);
      return arr;
    },
    profile() {
      const p = {};
      for (const [n, len] of seen) {
        const old = p[n]
          ? p[n].maxLength : 0;
        p[n] = {
          maxLength: Math.max(old, len),
        };
      }
      return p;
    },
  };
}`,
        why: 'It records the length at the moment the array is tracked, which is usually 0 because the array was just created. The real hook reads lengths at exit.',
      },
      {
        code: `function makeTracker() {
  const seen = [];
  return {
    track(name, arr) {
      seen.push([name, arr]);
      return arr;
    },
    profile() {
      const p = {};
      for (const [n, a] of seen) {
        p[n] = { maxLength: a.length };
      }
      return p;
    },
  };
}`,
        why: 'The last array tracked under a name wins, even if an earlier one was longer. Keep the maximum.',
      },
      {
        code: `function makeTracker() {
  const seen = [];
  return {
    track(name, arr) {
      const copy = [...arr];
      seen.push([name, copy]);
      return copy;
    },
    profile() {
      const p = {};
      for (const [n, a] of seen) {
        const old = p[n]
          ? p[n].maxLength : 0;
        const len = a.length;
        p[n] = {
          maxLength: Math.max(old, len),
        };
      }
      return p;
    },
  };
}`,
        why: 'Returning a copy changes the program: `track(\'a\', a) === a` is false. Instrumentation must hand back the very same array.',
      },
    ],
  },
  sizeLine: {
    optional: true,
    title: 'The size decision',
    prompt: 'Write `sizeLine(est, measured, min)`, the size step of the planner. `est` is the static estimate (a number, or `null` if unknown); `measured` is the profiled length, or `undefined` if there is no profile. Use the measurement if there is one. If the size is known and below `min`, return `{ keep: true, text }` with text `about N elements (measured): below the MIN-element threshold` (drop ` (measured)` if the size was estimated). Otherwise return `{ keep: false, text }` where text is `size unknown statically`, or `about N elements`, with ` (measured by profiling)` added if measured.',
    starter: `function sizeLine(est, measured, min) {
  return { keep: false, text: '' };
}`,
    solution: `function sizeLine(est, measured, min) {
  const m = measured !== undefined;
  const n = m ? measured : est;
  if (n !== null && n < min) {
    const tag = m ? ' (measured)' : '';
    return {
      keep: true,
      text: 'about ' + n + ' elements' +
        tag + ': below the ' + min +
        '-element threshold',
    };
  }
  if (n === null) {
    return {
      keep: false,
      text: 'size unknown statically',
    };
  }
  const tag = m
    ? ' (measured by profiling)' : '';
  return {
    keep: false,
    text: 'about ' + n +
      ' elements' + tag,
  };
}`,
    tests: `test('unknown, no profile: transform', () => {
  expect(sizeLine(null, undefined, 64)).toEqual({ keep: false, text: 'size unknown statically' });
});
test('measured small: keep', () => {
  expect(sizeLine(null, 20, 64)).toEqual({ keep: true, text: 'about 20 elements (measured): below the 64-element threshold' });
});
test('measured beats the estimate', () => {
  expect(sizeLine(1000, 20, 64).keep).toBe(true);
  expect(sizeLine(10, 5000, 64)).toEqual({ keep: false, text: 'about 5000 elements (measured by profiling)' });
});
test('estimated small: keep, no tag', () => {
  expect(sizeLine(2, undefined, 64)).toEqual({ keep: true, text: 'about 2 elements: below the 64-element threshold' });
});
test('a measured 0 is still a measurement', () => {
  expect(sizeLine(1000, 0, 64)).toEqual({ keep: true, text: 'about 0 elements (measured): below the 64-element threshold' });
});`,
    hints: [
      'Decide first whether there is a measurement: `measured !== undefined`.',
      'Pick the size: the measurement if there is one, else the estimate. `??` does exactly this; `||` does not, because 0 is falsy.',
      'Then three cases: known and small (keep), unknown, known and large.',
    ],
    walkthrough: `**How to think about it.** This mirrors the size step in \`core/src/plan.ts\` (\`measured ?? c.sizeEstimate\`) and the text \`describe()\` writes. First pick the number: a measurement, if there is one, beats a guess. Then there are three cases: the size is known and small (keep), the size is unknown (go ahead: the threshold cannot apply), and the size is known and large (go ahead, and say how big). Do one by hand: \`sizeLine(1000, 20, 64)\` has a measurement, 20, which is below 64, so the answer is keep, with "(measured)".

**The solution, line by line.**

- \`const m = measured !== undefined;\` records whether there is a measurement at all. A measured 0 is a measurement, so compare with \`undefined\` rather than testing truthiness.
- \`const n = m ? measured : est;\` picks the size: the measurement, else the estimate (which may be \`null\`).
- \`if (n !== null && n < min) {\` is the keep case: known, and below the threshold.
- \`const tag = m ? ' (measured)' : '';\` says where the number came from.
- The \`return\` builds \`'about ' + n + ' elements' + tag + ': below the ' + min + '-element threshold'\`, with \`keep: true\`.
- \`if (n === null)\` is the unknown case: return \`'size unknown statically'\` with \`keep: false\`.
- Otherwise the size is known and large: \`tag\` is \`' (measured by profiling)'\` or empty, and the text is \`'about ' + n + ' elements' + tag\`, with \`keep: false\`.

**Common wrong attempts.**

- \`measured || est\` treats a measured 0 as missing (0 is falsy) and falls back to the estimate; \`??\` or an explicit \`undefined\` check keeps it.
- \`est ?? measured\` gets the order backwards: the estimate wins whenever there is one, so a profile would only matter when the size is unknown.
- Forgetting the tag makes the report hide that the decision depends on one profiling run; a reader then cannot tell that a different input might change it.`,
    wrong: [
      {
        code: `function sizeLine(est, measured, min) {
  const m = measured !== undefined;
  const n = measured || est;
  if (n !== null && n < min) {
    const tag = m ? ' (measured)' : '';
    return {
      keep: true,
      text: 'about ' + n + ' elements' +
        tag + ': below the ' + min +
        '-element threshold',
    };
  }
  if (n === null) {
    return {
      keep: false,
      text: 'size unknown statically',
    };
  }
  const tag = m
    ? ' (measured by profiling)' : '';
  return {
    keep: false,
    text: 'about ' + n +
      ' elements' + tag,
  };
}`,
        why: '`measured || est` treats a measured 0 as missing and falls back to the estimate of 1000. Use `??` or an explicit `undefined` check.',
      },
      {
        code: `function sizeLine(est, measured, min) {
  const m = measured !== undefined;
  const n = est ?? measured;
  if (n !== null && n < min) {
    const tag = m ? ' (measured)' : '';
    return {
      keep: true,
      text: 'about ' + n + ' elements' +
        tag + ': below the ' + min +
        '-element threshold',
    };
  }
  if (n === null) {
    return {
      keep: false,
      text: 'size unknown statically',
    };
  }
  const tag = m
    ? ' (measured by profiling)' : '';
  return {
    keep: false,
    text: 'about ' + n +
      ' elements' + tag,
  };
}`,
        why: 'The estimate wins whenever there is one, so a profile only matters when the size is unknown. A measurement should override a guess.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Where must `// @viscosity soa` go to annotate `const ps = [];` on line 10?',
    options: [
      {
        t: 'Anywhere above line 10 in the same function.',
        why: 'A comment alone on its line reaches only the next line. Further away, it attaches to nothing.',
      },
      {
        t: 'On line 9 or at the end of line 10.',
        correct: true,
        why: 'Right: alone on line 9 it annotates line 10, and a trailing comment on line 10 annotates its own line.',
      },
      {
        t: 'Only on line 9.',
        why: 'A trailing comment on line 10 works too: it is on the declaration’s own line.',
      },
      {
        t: 'On line 11, just after it.',
        why: 'A comment alone on its line applies to the next line, and a trailing one to its own line: never the line before.',
      },
    ],
  },
  {
    q: 'A collection is passed to `console.log` and annotated `// @viscosity soa`. What does explain say?',
    options: [
      {
        t: '“annotated @viscosity soa at line N”, and it becomes SoA.',
        why: 'Annotations come after the safety rung. They can’t make an observable change safe.',
      },
      {
        t: 'An error: annotations can’t be used on logged arrays.',
        why: 'There is no error. The collection is kept, with a reason.',
      },
      {
        t: '“unsafe: the array is passed to a method call…”, and it is kept.',
        correct: true,
        why: 'Yes. Safety is checked first, and nothing overrides it.',
      },
    ],
  },
  {
    q: 'An annotated `@viscosity soa` collection has 3 elements. What does the size rule do?',
    options: [
      {
        t: 'Keeps it: 3 is below the 64-element threshold.',
        why: 'The size rule is a cost rule, and an annotation skips every cost rule.',
      },
      {
        t: 'Asks for a profile to confirm the size.',
        why: 'Nothing is asked. The size is only reported, as “about 3 elements”.',
      },
      {
        t: 'Chooses AoSoA instead, as a compromise.',
        why: 'The annotation names the layout; the planner uses it.',
      },
      {
        t: 'Nothing: the annotation skips it, and the size is only reported.',
        correct: true,
        why: 'Right, as in literal_init.js: three points, struct of arrays.',
      },
    ],
  },
  {
    q: 'Which annotation is refused for `{ x, id }`, where `id` is a string?',
    options: [
      {
        t: '`@viscosity soa`',
        why: 'SoA gives `id` a plain-array column, so it works.',
      },
      {
        t: '`@viscosity aosoa(8)`',
        correct: true,
        why: 'Yes: an AoSoA block is one Float64Array, so every field must be numeric.',
      },
      {
        t: '`@viscosity aos`',
        why: 'Keeping objects is always possible.',
      },
    ],
  },
  {
    q: 'With `--mode opt-in`, what happens to an unannotated collection that would win easily as SoA?',
    options: [
      {
        t: 'It becomes SoA, because the cost model says so.',
        why: 'In opt-in mode the cost model never sees unannotated collections.',
      },
      {
        t: 'It is kept, with “opt-in mode: not annotated”.',
        correct: true,
        why: 'Right: opt-in mode only transforms what you mark.',
      },
      {
        t: 'Viscosity prints a suggestion to annotate it.',
        why: 'It records a reason in explain, but suggests nothing.',
      },
    ],
  },
  {
    q: 'What does `viscosity profile` measure?',
    options: [
      {
        t: 'How long each loop takes',
        why: 'Nothing is timed. The profiling run only counts.',
      },
      {
        t: 'The length of each candidate collection, read when the program exits',
        correct: true,
        why: 'The exit hook writes `{ name: { maxLength } }` for every tracked array.',
      },
      {
        t: 'Which fields each loop reads',
        why: 'The profile type has room for field read counts, but nothing records them yet.',
      },
      {
        t: 'Which collections are safe to transform',
        why: 'Safety is proved by analysis, never measured.',
      },
    ],
  },
  {
    q: 'Which program does the profiling run execute?',
    options: [
      {
        t: 'The compiled, struct-of-arrays version',
        why: 'It runs the original, so the measurement doesn’t depend on a layout choice that hasn’t been made yet.',
      },
      {
        t: 'A version with every collection copied into a tracker',
        why: 'Nothing is copied: `__vsc_track` returns the same array.',
      },
      {
        t: 'The original program in the browser',
        why: 'It runs in a fresh Node process.',
      },
      {
        t: 'The original program, with each collection’s creation wrapped in `__vsc_track`',
        correct: true,
        why: 'Plus a prelude that defines the tracker and the exit hook.',
      },
    ],
  },
  {
    q: 'In spawn.js, `spawn` is called 20 times. What changes when you compile with the profile?',
    options: [
      {
        t: 'Nothing: `ps` is still a struct of arrays',
        why: 'The measured 20 is below the 64-element threshold.',
      },
      {
        t: '`ps` becomes AoSoA',
        why: 'AoSoA needs an annotation; the profile only changes the size.',
      },
      {
        t: '`ps` is kept as an array of objects, “about 20 elements (measured)”',
        correct: true,
        why: 'Without the profile the size was unknown and Viscosity transformed it.',
      },
      {
        t: 'Viscosity reports a bailout',
        why: 'Being small isn’t unsafe; it just isn’t worth it.',
      },
    ],
  },
  {
    q: 'A collection is passed to `console.log` (an escape). Its profile says it holds a million elements. What does Viscosity do?',
    options: [
      {
        t: 'Keeps it as objects: safety checks come before the profile is read',
        correct: true,
        why: 'Unsafe collections never reach the size step.',
      },
      {
        t: 'Transforms it, because a million elements is a big win',
        why: 'Speed never overrides safety.',
      },
      {
        t: 'Transforms it and inserts a guard',
        why: 'Viscosity doesn’t speculate; it either proves or leaves alone.',
      },
      {
        t: 'Asks for an annotation',
        why: 'Annotations can’t override a safety failure either.',
      },
    ],
  },
  {
    q: 'Why does V8 need deoptimisation while Viscosity’s PGO needs no guard?',
    options: [
      {
        t: 'V8’s profiles are less accurate',
        why: 'Accuracy isn’t the point: any profile can be wrong about the future.',
      },
      {
        t: 'Viscosity runs the program many times',
        why: 'It runs it once.',
      },
      {
        t: 'V8 doesn’t use profiles',
        why: 'It does: shape and type feedback drives its optimising compilers.',
      },
      {
        t: 'V8 specialises code on feedback that affects correctness; Viscosity’s profile only picks between two proven-equivalent layouts',
        correct: true,
        why: 'A wrong guess in V8 would compute wrong results unless guarded. A wrong guess in Viscosity is just slower.',
      },
    ],
  },
];
