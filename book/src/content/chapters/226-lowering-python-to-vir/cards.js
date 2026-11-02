// Chapter 226 cards. Keys are stable ids: never rename them.

export const prompts = {
  'sd-what': {
    q: 'What is a semantic difference between two languages?',
    a: 'A place where code that looks the same means different things in each, such as loops, numbers or indexing.',
  },
  'sd-range': {
    q: 'In Python, `for i in range(3):` with `i += 5` in the body. How many times does the body run, and why?',
    a: 'Three times. `for` takes the next value from `range(3)` on each pass, whatever the body did to `i`.',
  },
  'sd-counter': {
    q: 'Why does the Python plugin lower `for i in range(n)` with a hidden counter instead of using `i` itself?',
    a: 'Because reassigning `i` in the body must not change the iteration. The counter carries the iteration; `i` just gets a copy each pass.',
  },
  'sd-proof': {
    q: 'What does the hidden counter give the bounds proofs?',
    a: 'A clean induction variable: an access through the counter’s value is proven even if the body reassigns the loop variable later.',
  },
  'sd-forin': {
    q: 'Why does the lowering of `for p in ps` read the length on every pass?',
    a: 'A Python list iterator sees elements appended during the loop, so the loop must re-check the length each step.',
  },
  'sd-int': {
    q: 'Why may an int never go into an `array(\'d\')` column?',
    a: 'The column stores C doubles, so the int comes back as a float and prints differently (`1` becomes `1.0`).',
  },
  'sd-div': {
    q: 'In Python, what types do `7 / 2` and `7 // 2` produce?',
    a: '`7 / 2` is the float `3.5`; `7 // 2` is the int `3`.',
  },
  'sd-index': {
    q: 'Besides typed columns, what else needs Python’s “is an int” fact?',
    a: 'Indexing: a list index must be an int, so a possibly non-int index makes Viscosity keep the list.',
  },
  'sd-dataclass': {
    q: 'Which Python classes does the plugin treat as records?',
    a: 'Module-level `@dataclass` classes whose bodies contain only annotated fields.',
  },
  'sd-kwargs': {
    q: 'Why is `P(y=1.0, x=v)` (keywords out of field order) not lowered to a record?',
    a: 'Python evaluates arguments left to right; reordering them into field order could change that, so the plugin refuses instead.',
  },
  'sd-default': {
    q: 'When does Python evaluate a dataclass field’s default expression?',
    a: 'Once, when the class is defined, not at each call.',
  },
};

export const exercises = {
  pyKind: {
    title: 'Int or float?',
    prompt:
      'Write `pyKind(e)`, Python’s number rule from the core’s numeric inference. A constant is `{ k: \'int\' }`, `{ k: \'float\' }` or `{ k: \'str\' }`. An operation is `{ op, a, b }` with `op` one of `+ - * / //`. Return `\'int\'`, `\'float\'` or `\'other\'`: a string is `other`, and so is any operation on an `other`. `/` of two numbers is always a float. The other operators give an int when both sides are ints, and a float when either side is a float.',
    starter: `function pyKind(e) {
  return 'float';
}`,
    solution: `function pyKind(e) {
  if (!e.op) {
    return e.k === 'str'
      ? 'other' : e.k;
  }
  const a = pyKind(e.a);
  const b = pyKind(e.b);
  if (a === 'other' ||
      b === 'other') {
    return 'other';
  }
  if (e.op === '/') return 'float';
  if (a === 'int' && b === 'int') {
    return 'int';
  }
  return 'float';
}`,
    tests: `const I = { k: 'int' };
const F = { k: 'float' };
const S = { k: 'str' };
test('constants', () => {
  expect(pyKind(I)).toBe('int');
  expect(pyKind(F)).toBe('float');
  expect(pyKind(S)).toBe('other');
});
test('int with int stays int, except /', () => {
  expect(pyKind({ op: '+', a: I, b: I })).toBe('int');
  expect(pyKind({ op: '//', a: I, b: I })).toBe('int');
  expect(pyKind({ op: '/', a: I, b: I })).toBe('float');
});
test('a float on either side gives a float', () => {
  expect(pyKind({ op: '*', a: F, b: I })).toBe('float');
  expect(pyKind({ op: '-', a: I, b: F })).toBe('float');
  expect(pyKind({ op: '//', a: F, b: I })).toBe('float');
});
test('strings poison the result', () => {
  expect(pyKind({ op: '+', a: S, b: I })).toBe('other');
});
test('nested', () => {
  const half = { op: '/', a: I, b: I };
  expect(pyKind({ op: '*', a: half, b: I })).toBe('float');
  const next = { op: '+', a: I, b: I };
  expect(pyKind({ op: '*', a: next, b: I })).toBe('int');
});`,
    hints: [
      'A constant has no `op`: return its `k`, except that `str` becomes `other`.',
      'For an operation, work out both sides first (recursively), and return `other` if either side is.',
      'Then: `/` is always `float`; otherwise two ints give `int`, and anything else gives `float`.',
    ],
    walkthrough: `This is the Python half of the numeric inference in \`core/src/analysis.ts\`, for a single expression tree instead of a whole program.

- **Two facts, not one.** JavaScript only needs “is a number”. Python needs to know *which* number, because only floats may go into an \`array('d')\` column and only ints may index a list. The core computes both, \`n\` (float) and \`I\` (int), for every value.
- **\`/\` is the odd one out.** \`7 / 2\` is \`3.5\` even though both sides are ints; \`7 // 2\` is the int \`3\`. The language reference spells this out, and the lowering must follow it.
- **Unknown poisons.** If either side might be a string (or anything not proven), the result is not proven to be a number, so the field gets a plain list column. Viscosity’s rule is the same: prove it, or don’t use a typed column.

In the real analysis this runs as a fixpoint over the whole program, because values flow through loops and fields. Here a tree only needs one recursive pass.`,
    wrong: [
      {
        code: `function pyKind(e) {
  if (!e.op) {
    return e.k === 'str'
      ? 'other' : 'float';
  }
  const a = pyKind(e.a);
  const b = pyKind(e.b);
  if (a === 'other' ||
      b === 'other') {
    return 'other';
  }
  return 'float';
}`,
        why: 'This is JavaScript’s rule: every number is a double. In Python `1 + 1` is an int, and storing it in a float column would make it print as `2.0`.',
      },
      {
        code: `function pyKind(e) {
  if (!e.op) {
    return e.k === 'str'
      ? 'other' : e.k;
  }
  const a = pyKind(e.a);
  const b = pyKind(e.b);
  if (a === 'other' ||
      b === 'other') {
    return 'other';
  }
  if (a === 'int' && b === 'int') {
    return 'int';
  }
  return 'float';
}`,
        why: 'It forgets that `/` always gives a float: `7 / 2` is `3.5`, not an int.',
      },
    ],
  },
  pyIndex: {
    optional: true,
    title: 'Index a list the Python way',
    prompt:
      'Write `pyIndex(xs, i)`, which reads `xs[i]` with Python’s rules, on a JavaScript array. A non-integer `i` throws a `TypeError` with message `\'list indices must be integers\'`. A negative `i` counts from the end (`-1` is the last element). Anything outside `-len ≤ i < len` throws an `Error` with message `\'list index out of range\'`. JavaScript would quietly return `undefined` in both cases.',
    starter: `function pyIndex(xs, i) {
  return xs[i];
}`,
    solution: `function pyIndex(xs, i) {
  if (!Number.isInteger(i)) {
    throw new TypeError(
      'list indices must be integers');
  }
  const n = xs.length;
  if (i < -n || i >= n) {
    throw new Error(
      'list index out of range');
  }
  return i < 0 ? xs[n + i] : xs[i];
}`,
    tests: `function message(f) {
  try { f(); } catch (e) { return e.message; }
  return 'no error';
}
const xs = [10, 20, 30];
test('ordinary indexes', () => {
  expect(pyIndex(xs, 0)).toBe(10);
  expect(pyIndex(xs, 2)).toBe(30);
});
test('negative indexes count from the end', () => {
  expect(pyIndex(xs, -1)).toBe(30);
  expect(pyIndex(xs, -3)).toBe(10);
});
test('past either end is an error', () => {
  expect(message(() => pyIndex(xs, 3))).toBe('list index out of range');
  expect(message(() => pyIndex(xs, -4))).toBe('list index out of range');
});
test('a float index is a TypeError', () => {
  expect(message(() => pyIndex(xs, 1.5))).toBe('list indices must be integers');
});`,
    hints: [
      '`Number.isInteger(i)` tells you whether `i` is a whole number.',
      'The valid range is `-n <= i < n`, where `n` is the length. Check it before reading.',
      'For a negative `i`, the element is at `n + i`.',
    ],
    walkthrough: `Indexing is a semantic difference Viscosity has to preserve exactly, because a transformed program must fail the same way the original does.

- **Negative indexes are legal.** Python’s built-in sequences add the length to a negative index, so \`xs[-1]\` is the last element. In JavaScript \`xs[-1]\` is \`undefined\`.
- **Out of range is an exception, not a value.** Python raises \`IndexError\`; JavaScript returns \`undefined\` and carries on. So the JavaScript plugin’s bounds checks throw a \`TypeError\` at the field read, while the Python plugin’s \`_vsc_ix\` helper (next chapter) accepts exactly \`-n <= i < n\` and raises \`IndexError('list index out of range')\` otherwise.
- **The index must be an int.** That is the second job of the int fact from this chapter: when Viscosity can’t prove an index is an int, it keeps the list.`,
    wrong: [
      {
        code: `function pyIndex(xs, i) {
  if (i < 0 || i >= xs.length) {
    throw new Error(
      'list index out of range');
  }
  return xs[i];
}`,
        why: 'This is a bounds check with JavaScript’s idea of a valid index: `-1` is rejected, though in Python it is the last element. A float index also slips through.',
      },
      {
        code: `function pyIndex(xs, i) {
  if (!Number.isInteger(i)) {
    throw new TypeError(
      'list indices must be integers');
  }
  return i < 0
    ? xs[xs.length + i] : xs[i];
}`,
        why: 'Negative indexes work, but `pyIndex(xs, 3)` returns `undefined` instead of raising: the original Python program would have stopped with an IndexError.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In VIR for `for i in range(1000):`, where is the bound 1000 computed?',
    options: [
      { t: 'In the loop header, on every pass', why: 'That is the JavaScript lowering of `i < 1000`, where the test expression is re-evaluated.' },
      { t: 'Once, before the loop', correct: true, why: 'Python evaluates `range(...)` once, so the plugin computes start and bound in the block before the loop.' },
      { t: 'Inside the body', why: 'The body only copies the counter into `i`.' },
      { t: 'Nowhere: the loop is unrolled', why: 'Viscosity never unrolls loops.' },
    ],
  },
  {
    q: 'A Python loop `for i in range(len(ps)):` reads `ps[i].x`, then does `i = 0`. What happens to the bounds proof for `ps[i]` at the top of the body?',
    options: [
      { t: 'It still holds: the access uses the hidden counter’s value for this pass', correct: true, why: 'The counter is a clean induction variable; reassigning `i` later in the body doesn’t touch it.' },
      { t: 'It fails, because `i` is reassigned', why: 'That would be true for a JavaScript `for`, where `i` is the counter.' },
      { t: 'The loop becomes infinite', why: 'In Python the next pass takes the next value from `range`, whatever `i` was set to.' },
      { t: 'The list is kept as objects', why: 'Reassigning a loop variable is perfectly safe.' },
    ],
  },
  {
    q: 'A field holds `i` for every element, where `i` comes from `range`. What column does it get?',
    options: [
      { t: '`array(\'d\')`, because ints are numbers', why: 'An int would come back from `array(\'d\')` as a float and print as `3.0`.' },
      { t: 'No column: the list is kept', why: 'An int field doesn’t block the transform; it just gets a plain column.' },
      { t: '`array(\'q\')` for 64-bit ints', why: 'Viscosity only uses `array(\'d\')`; Python ints are unbounded and could overflow a 64-bit column.' },
      { t: 'A plain list column', correct: true, why: '`typed array(\'d\') columns for weight; list columns for count (may hold non-floats)`, as in `ints_stay_ints.py`.' },
    ],
  },
  {
    q: 'Which expression does Python’s rule (as in the core) classify as a float?',
    options: [
      { t: '`i // 2` where `i` is an int', why: 'Floor division of two ints is an int.' },
      { t: '`i + 1` where `i` is an int', why: 'Two ints give an int.' },
      { t: '`i / 2` where `i` is an int', correct: true, why: '`/` always gives a float, even for two ints.' },
      { t: '`len(ps)`', why: 'A length is an int.' },
    ],
  },
  {
    q: 'What does `P(y=1.0, x=v)` lower to, for a dataclass with fields `x, y`?',
    options: [
      { t: 'record.new with `v, 1.0`', why: 'That would reorder the evaluation of the arguments, which Python does left to right.' },
      { t: 'An ordinary call, so the list holding it is kept as objects', correct: true, why: 'The plugin only builds records when keywords follow field order; otherwise it refuses rather than guess.' },
      { t: 'record.new with `1.0, v`', why: 'Fields must be in declaration order, so this would store y in x.' },
      { t: 'A syntax error', why: 'Keyword arguments are in the subset; only their order matters here.' },
    ],
  },
  {
    q: 'Why can’t the shared core catch a lowering that copies Python’s spelling but not its meaning?',
    options: [
      { t: 'The core does catch it, with the safety analysis', why: 'The safety analysis trusts the VIR it is given.' },
      { t: 'Because the core is written in TypeScript', why: 'The implementation language is irrelevant.' },
      { t: 'It can, if you pass `--python-auto`', why: 'That flag only changes the planner’s default verdict.' },
      { t: 'It only sees VIR, and the wrong VIR is a consistent program', correct: true, why: 'Only comparing real runs (the differential test with python3) can show the meaning was lost.' },
    ],
  },
];
