// Chapter 321 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'em-edits': {
    q: 'Does Viscosity’s Python emitter regenerate the program from VIR?',
    a: 'No. It collects edits to source ranges and applies them, leaving every other character as it was.',
  },
  'em-index': {
    q: 'In Viscosity’s Python output for a list stored as columns, what is `p` in `for p in _vsc_iter(ps):`?',
    a: 'An int index into the columns, not a record object.',
  },
  'em-ix': {
    q: 'Which indexes does Viscosity’s generated Python bounds check `_vsc_ix(c, i)` accept?',
    a: 'Exactly `-c.n <= i < c.n`, like a list. Anything else raises `IndexError(\'list index out of range\')`.',
  },
  'em-slots': {
    q: 'A Python class declares `__slots__ = (\'x\', \'vx\')` and its `__init__` does `self.n = 0`. What happens, and why?',
    a: 'AttributeError: with `__slots__` (and no base class providing a `__dict__`) instances have no per-instance dictionary, so only the listed attributes can be assigned.',
  },
  'pa-what': {
    q: 'What does `array(\'d\')` store?',
    a: 'C doubles, packed one after another: Python floats, 8 bytes each.',
  },
  'pa-int': {
    q: 'What comes back from `array(\'d\', [1])[0]`?',
    a: 'The float `1.0`: the int was converted when it was stored.',
  },
  'pa-slow': {
    q: 'In CPython, why is reading a float from an `array(\'d\')` slower than reading a float attribute `p.x` of an object?',
    a: 'Each read creates a new float object (`PyFloat_FromDouble`); a dataclass field already holds one.',
  },
  'pa-bytes': {
    q: 'On 64-bit CPython, about how many bytes per value does a list of distinct floats take, against an `array(\'d\')`?',
    a: 'About 32 against 8: the list holds an 8-byte pointer to a separate 24-byte float object per value, while the array stores each 8-byte double directly.',
  },
  'pa-js': {
    q: 'Same plan, same safety proofs: why does Viscosity give JavaScript lists columns by default but not Python lists?',
    a: 'Measurement: V8’s optimising compiler reads Float64Array elements as raw doubles, while CPython boxes every read. The cost model follows the data.',
  },
};

export const examples = {};

export const exercises = {
  containerClass: {
    title: 'Generate the container class',
    prompt: `Write \`container(name, fs, fl)\`, the first part of the Python emitter’s \`containerClass\`. \`fs\` is the list of fields in order, and \`fl\` lists the fields proven to hold floats. Return the Python source as one string, lines joined with \`\\n\`, indented with 4 spaces per level, exactly like this for \`container('ps', ['x', 'tag'], ['x'])\`:

\`\`\`
class _Vsc_ps:
    __slots__ = ('n', 'x', 'tag')
    def __init__(self):
        self.n = 0
        self.x = _vsc_array('d')
        self.tag = []
    def append(self, v0, v1):
        self.x.append(v0)
        self.tag.append(v1)
        self.n += 1
\`\`\``,
    starter: `function container(name, fs, fl) {
  return 'class _Vsc_' + name + ':';
}`,
    solution: `function container(name, fs, fl) {
  const s = '    ';
  const q = fs.map((f) => \`'\${f}'\`);
  const vs = fs.map((f, k) => 'v' + k);
  const out = [];
  out.push('class _Vsc_' + name + ':');
  out.push(s + '__slots__ = (' +
    ["'n'", ...q].join(', ') + ')');
  out.push(s + 'def __init__(self):');
  out.push(s + s + 'self.n = 0');
  for (const f of fs) {
    const c = fl.includes(f)
      ? "_vsc_array('d')" : '[]';
    out.push(s + s + 'self.' + f +
      ' = ' + c);
  }
  out.push(s + 'def append(self, ' +
    vs.join(', ') + '):');
  fs.forEach((f, k) => {
    out.push(s + s + 'self.' + f +
      '.append(v' + k + ')');
  });
  out.push(s + s + 'self.n += 1');
  return out.join('\\n');
}`,
    tests: `const want = [
  'class _Vsc_ps:',
  "    __slots__ = ('n', 'x', 'tag')",
  '    def __init__(self):',
  '        self.n = 0',
  "        self.x = _vsc_array('d')",
  '        self.tag = []',
  '    def append(self, v0, v1):',
  '        self.x.append(v0)',
  '        self.tag.append(v1)',
  '        self.n += 1',
].join('\\n');
test('the example from the prompt', () => {
  expect(container('ps', ['x', 'tag'], ['x'])).toBe(want);
});
test('slots list n first, then every field', () => {
  const lines = container('gs', ['a', 'b', 'c'], ['a', 'b', 'c']).split('\\n');
  expect(lines[1]).toBe("    __slots__ = ('n', 'a', 'b', 'c')");
});
test('only float fields get array(d)', () => {
  const lines = container('cs', ['count', 'weight'], ['weight']).split('\\n');
  expect(lines[4]).toBe('        self.count = []');
  expect(lines[5]).toBe("        self.weight = _vsc_array('d')");
});
test('append takes one value per column, in field order', () => {
  const lines = container('bs', ['x', 'y', 'm'], []).split('\\n');
  expect(lines[7]).toBe('    def append(self, v0, v1, v2):');
  expect(lines[10]).toBe('        self.m.append(v2)');
  expect(lines[11]).toBe('        self.n += 1');
});`,
    hints: [
      'Build an array of lines and `join(\'\\n\')` at the end. Keep the indentation in a variable, `s = \'    \'`, and use `s + s` for the second level.',
      'The slots tuple is `\'n\'` followed by every field in quotes: build the quoted names with `map`, then `join(\', \')`.',
      'For each field, the `__init__` line uses `_vsc_array(\'d\')` if the field is in `fl`, and `[]` otherwise. The parameters of `append` are `v0, v1, ...`, one per field, in order.',
    ],
    walkthrough: `**How to think about it.** This is the top half of \`containerClass\` in \`frontend-python/src/emit.ts\`, so the target text is fixed: compare your output with the example line by line, not by eye. Notice the three repeating patterns before writing anything: the slots tuple is \`'n'\` followed by every field in quotes; \`__init__\` has one line per field, whose right-hand side depends on whether the field is proven to be a float; and \`append\` has one parameter and one line per field, matched by position. Everything else is fixed text. The easiest way to get indentation and line breaks exactly right is to collect lines in an array and join them with \`'\\n'\` once at the end.

**The solution, line by line.**

- \`function container(name, fs, fl) {\` takes the collection's name, its fields in order, and the fields proven to be floats.
- \`  const s = '    ';\` is one level of indentation (four spaces); \`s + s\` is two.
- \`  const q = fs.map((f) => \\\`'\${f}'\\\`);\` wraps each field name in single quotes, ready for the tuple.
- \`  const vs = fs.map((f, k) => 'v' + k);\` makes the parameter names \`v0\`, \`v1\`, ..., one per field.
- \`  const out = [];\` will hold the lines.
- \`  out.push('class _Vsc_' + name + ':');\` is the class header.
- The \`__slots__\` line puts \`"'n'"\` in front of the quoted fields and joins them with \`', '\`, so \`n\` is always first.
- \`  out.push(s + 'def __init__(self):');\` and \`  out.push(s + s + 'self.n = 0');\` start the constructor and the count.
- \`  for (const f of fs) {\` makes one column per field: \`fl.includes(f)\` chooses \`_vsc_array('d')\` for a proven float and \`[]\` otherwise, and the line \`self.<field> = <column>\` is pushed at two levels of indentation.
- The \`def append(self, ...)\` line joins the \`v\` names with \`', '\`.
- \`  fs.forEach((f, k) => {\` pushes \`self.<field>.append(v<k>)\` for each field, so value number \`k\` goes to field number \`k\`.
- \`  out.push(s + s + 'self.n += 1');\` keeps the count in step.
- \`  return out.join('\\n');\` turns the lines into one string.

**Common wrong attempts.**

- Leaving \`'n'\` out of \`__slots__\`: the output looks plausible, but in Python \`self.n = 0\` would raise \`AttributeError\`, because a class with slots has nowhere else to put an attribute.
- Giving every field \`_vsc_array('d')\`: a string field would raise \`TypeError\` on the first append, and an int field would come back as floats and print as \`3.0\`. The emitter must follow the plan's list of float fields, not guess.`,
    wrong: [
      {
        code: `function container(name, fs, fl) {
  const s = '    ';
  const q = fs.map((f) => \`'\${f}'\`);
  const vs = fs.map((f, k) => 'v' + k);
  const out = [];
  out.push('class _Vsc_' + name + ':');
  out.push(s + '__slots__ = (' +
    q.join(', ') + ')');
  out.push(s + 'def __init__(self):');
  out.push(s + s + 'self.n = 0');
  for (const f of fs) {
    const c = fl.includes(f)
      ? "_vsc_array('d')" : '[]';
    out.push(s + s + 'self.' + f +
      ' = ' + c);
  }
  out.push(s + 'def append(self, ' +
    vs.join(', ') + '):');
  fs.forEach((f, k) => {
    out.push(s + s + 'self.' + f +
      '.append(v' + k + ')');
  });
  out.push(s + s + 'self.n += 1');
  return out.join('\\n');
}`,
        why: '`n` is missing from `__slots__`. In Python, `self.n = 0` would then raise AttributeError, because a class with slots has nowhere else to put it.',
      },
      {
        code: `function container(name, fs, fl) {
  const s = '    ';
  const q = fs.map((f) => \`'\${f}'\`);
  const vs = fs.map((f, k) => 'v' + k);
  const out = [];
  out.push('class _Vsc_' + name + ':');
  out.push(s + '__slots__ = (' +
    ["'n'", ...q].join(', ') + ')');
  out.push(s + 'def __init__(self):');
  out.push(s + s + 'self.n = 0');
  for (const f of fs) {
    out.push(s + s + 'self.' + f +
      " = _vsc_array('d')");
  }
  out.push(s + 'def append(self, ' +
    vs.join(', ') + '):');
  fs.forEach((f, k) => {
    out.push(s + s + 'self.' + f +
      '.append(v' + k + ')');
  });
  out.push(s + s + 'self.n += 1');
  return out.join('\\n');
}`,
        why: 'Every field gets `array(\'d\')`. A string field would raise TypeError on the first append, and an int field would come back as floats and print as `3.0`.',
      },
    ],
  },
  colName: {
    optional: true,
    title: 'Names that would clash',
    prompt: 'A field becomes an attribute of the container, so some names would collide with the container’s own: `n`, `append`, `_of`, `__len__`, `__init__`, `__slots__`, and any name starting with `__`. Write `colName(f, i)`: return the field name `f` unchanged, unless it would clash, in which case return `\'f\' + i + \'_\'` (`i` is the field’s position).',
    starter: `function colName(f, i) {
  return f;
}`,
    solution: `const RESERVED = new Set([
  'n', 'append', '_of', '__len__',
  '__init__', '__slots__',
]);

function colName(f, i) {
  if (RESERVED.has(f) ||
      f.startsWith('__')) {
    return 'f' + i + '_';
  }
  return f;
}`,
    tests: `test('ordinary names are kept', () => {
  expect(colName('x', 0)).toBe('x');
  expect(colName('vx', 3)).toBe('vx');
});
test('the count and the method are renamed', () => {
  expect(colName('n', 0)).toBe('f0_');
  expect(colName('append', 2)).toBe('f2_');
});
test('any dunder name is renamed', () => {
  expect(colName('__len__', 1)).toBe('f1_');
  expect(colName('__weird', 4)).toBe('f4_');
});
test('one underscore is fine', () => {
  expect(colName('_tmp', 1)).toBe('_tmp');
});`,
    hints: [
      'Keep the reserved names in a `Set` and check `has(f)`.',
      'Names starting with two underscores are renamed too: `f.startsWith(\'__\')`.',
      'The new name is built from the position, so two renamed fields can never collide with each other.',
    ],
    walkthrough: `**How to think about it.** A field becomes an attribute of the container, so ask which attribute names the container already uses for itself: \`n\` (the count), \`append\`, \`_of\`, and the special methods \`__len__\`, \`__init__\` and \`__slots__\`. A field with one of those names would overwrite part of the container (a field called \`append\` would replace the method every \`ps.append(...)\` relies on). Names starting with two underscores are special in Python classes in other ways too, so the simple, safe rule is to rename all of them. The new name only has to be impossible to clash with, and the field's position gives that for free.

**The solution, line by line.**

- \`const RESERVED = new Set([\` lists the container's own names, \`'n', 'append', '_of', '__len__',\` and \`'__init__', '__slots__',\`, in a \`Set\` so that checking membership is one call.
- \`function colName(f, i) {\` takes the field name and its position.
- \`  if (RESERVED.has(f) ||\` catches the listed names;
- \`      f.startsWith('__')) {\` catches every name beginning with two underscores;
- \`    return 'f' + i + '_';\` builds a new name from the position (\`f0_\`, \`f2_\`), so two renamed fields can never collide with each other.
- \`  return f;\` keeps every other name exactly as written, which keeps the generated code readable.

The access rewriting uses the same function, so \`p.n\` becomes \`ps.f0_[p]\` everywhere it appears.

**Common wrong attempts.**

- Renaming only \`n\` and \`append\`: a field called \`__len__\` would then replace the container's own \`__len__\`, and \`len(ps)\` would break.
- Renaming every name that starts with one underscore: safe, but too eager; \`_tmp\` clashes with nothing and should stay as it is. The JavaScript container in *Generating SoA storage* meets the same problem with its own list of names.`,
    wrong: [
      {
        code: `function colName(f, i) {
  if (f === 'n' || f === 'append') {
    return 'f' + i + '_';
  }
  return f;
}`,
        why: 'It misses `_of` and every dunder name: a field called `__len__` would replace the container’s own `__len__` method.',
      },
      {
        code: `function colName(f, i) {
  if (f.startsWith('_') ||
      f === 'n' || f === 'append') {
    return 'f' + i + '_';
  }
  return f;
}`,
        why: 'Too eager: a field like `_tmp` is harmless, yet it gets renamed. Only names that would actually clash need to change.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'When Viscosity stores the list `ps` of dataclass `P(x, vx)` as columns, what does `ps.append(P(float(i), 1.0))` become?',
    options: [
      {
        t: '`ps.append(P(float(i), 1.0))`, unchanged',
        why: 'The record must not be built: the container takes the field values directly.',
      },
      {
        t: '`ps.x.append(float(i)); ps.vx.append(1.0)`',
        why: 'The emitter only replaces the record call; the container’s own `append` updates every column and the count.',
      },
      {
        t: '`ps.append(float(i), 1.0)`',
        correct: true,
        why: 'The call `P(...)` is replaced by its arguments in field order, and the generated `append` takes one value per column.',
      },
      {
        t: '`ps = _Vsc_ps(float(i), 1.0)`',
        why: 'The container is created once, where the list was.',
      },
    ],
  },
  {
    q: 'A Python program reads `ps[-1].x`, which Viscosity can’t prove in bounds. What does the compiled program do when `ps` has 100 elements?',
    options: [
      {
        t: 'Reads the last element, as the original does',
        correct: true,
        why: '`_vsc_ix` accepts `-n <= i < n`, and `array` itself understands negative indexes.',
      },
      {
        t: 'Raises IndexError, because -1 is negative',
        why: 'That would be a JavaScript-style check, and would change the program’s behaviour.',
      },
      {
        t: 'Reads element 0',
        why: 'Nothing clamps the index.',
      },
      {
        t: 'The list is kept as objects',
        why: 'An unproven index gets a check; it doesn’t block the transform.',
      },
    ],
  },
  {
    q: 'What does declaring `__slots__` on a Python class do?',
    options: [
      {
        t: 'It makes the `array(\'d\')` columns stored in those attributes faster',
        why: 'Slots affect how the instance stores its own attributes, not the objects held in them.',
      },
      {
        t: 'It turns the class into a dataclass',
        why: 'That is the `@dataclass` decorator; slots are an independent feature.',
      },
      {
        t: 'It makes the instances immutable',
        why: 'Listed attributes can still be reassigned; only unlisted ones cannot be created.',
      },
      {
        t: 'It declares the instance attributes up front, so instances have no per-instance dictionary',
        correct: true,
        why: 'Python’s data model: slots reserve space for the listed names and prevent a `__dict__`.',
      },
    ],
  },
  {
    q: 'Viscosity stores a Python list as columns, and its field `count` always holds ints. What column does `count` get, and why?',
    options: [
      {
        t: 'A plain list, because `array(\'d\')` would turn its ints into floats',
        correct: true,
        why: 'Printing a count would show `3.0` instead of `3`: the output would change.',
      },
      {
        t: '`array(\'d\')`, because ints are numbers',
        why: 'That is the JavaScript rule; in Python it changes what the program prints.',
      },
      {
        t: '`array(\'q\')`',
        why: 'Python ints are unbounded; a 64-bit column could overflow. Viscosity doesn’t use it.',
      },
      {
        t: 'None: the whole list is kept as objects',
        why: 'Mixed columns are fine; only that field gets a plain list.',
      },
    ],
  },
  {
    q: 'In a CPython 3.13 measurement of the loop `x += vx * 0.016` over 100,000 records, which ordering of time per element is right (fastest first)?',
    options: [
      {
        t: '`array(\'d\')` columns, list columns, objects',
        why: 'That is the JavaScript intuition. CPython measured the opposite.',
      },
      {
        t: 'Objects, list columns, `array(\'d\')` columns',
        correct: true,
        why: '26.7, 43.3 and 72.7 ns per element: every read of an `array(\'d\')` builds a new float object.',
      },
      {
        t: 'List columns, objects, `array(\'d\')` columns',
        why: 'Objects were fastest.',
      },
      {
        t: 'All three were within noise',
        why: '`array(\'d\')` took nearly three times as long as objects.',
      },
    ],
  },
  {
    q: 'What does CPython do when you read `xs[i]` from an `array(\'d\')`?',
    options: [
      {
        t: 'Returns a pointer into the array',
        why: 'Python code never sees raw pointers.',
      },
      {
        t: 'Returns the same float object each time',
        why: 'No float objects are stored, so there is nothing to return twice.',
      },
      {
        t: 'Creates a new float object from the stored double',
        correct: true,
        why: '`d_getitem` calls `PyFloat_FromDouble`, which is why the compact layout costs time.',
      },
      {
        t: 'Copies the whole array',
        why: 'Only one item is read.',
      },
    ],
  },
];
