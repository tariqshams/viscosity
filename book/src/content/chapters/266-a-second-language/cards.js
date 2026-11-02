// Chapter 266 cards. Keys are stable ids: never rename them.

export const prompts = {
  'ml-what': {
    q: 'What is a multi-language IR?',
    a: 'An intermediate representation that several source languages lower into, so analyses written against it serve all of them.',
  },
  'ml-cost': {
    q: 'With 3 languages and 6 analyses, how many analysis implementations do you need without a shared IR, and with one?',
    a: '18 without (3 × 6). With a shared IR: 6 analyses plus 3 plugins.',
  },
  'ml-compile': {
    q: 'Which step of Viscosity’s `compile` is language-specific before `lower` runs?',
    a: 'Only choosing the plugin, which the CLI does by file extension (`.py` gets the Python plugin).',
  },
  'ml-free': {
    q: 'Name three things the Python plugin reuses from the core without writing its own.',
    a: 'Any three of: collection discovery, the safety (escape) checks, numeric inference, bounds proofs, loop and access-pattern analysis, the planner, `explain`.',
  },
  'ml-step': {
    q: 'In `particles.py` the hot loops are inside `step(arr, dt)`. Why does the report still list them?',
    a: 'The shared core follows the list into the function call, exactly as it does for JavaScript.',
  },
  'ml-bugfix': {
    q: 'Why is one shared escape check better than one per language, beyond saving code?',
    a: 'A bug fixed in it is fixed for every language at once, and both languages are tested against the same logic.',
  },
  'ml-float': {
    q: 'Why does the core need to know a module is Python when deciding if a field is numeric?',
    a: 'In Python only a float may go in an `array(\'d\')` column; an int would come back as a float. In JavaScript any number fits a Float64Array.',
  },
  'ml-wording': {
    q: 'Why was “pushes something that is not a fresh object literal” a poor reason in a Python report?',
    a: 'The decision was right, but Python has no object literals. Python reports now say “appends something that is not a fresh dataclass instance”.',
  },
  'ml-profile': {
    q: 'What happens if you run `viscosity profile` on a `.py` file today?',
    a: 'The CLI refuses: profiling runs JavaScript programs only. (It used to run the file with Node, which failed with a SyntaxError.)',
  },
  'ml-llvm': {
    q: 'In LLVM, what plays the role of a Viscosity language plugin for C and C++?',
    a: 'Clang, the front-end that compiles them into LLVM’s IR.',
  },
};

export const exercises = {
  sharedCore: {
    title: 'Two plugins, one analysis',
    prompt:
      'The tests define two toy plugins, `js` and `py`. Each has `lower(src)`, which returns a list of IR ops such as `{ op: \'get\', field: \'x\' }`, `{ op: \'set\', field: \'x\' }` or `{ op: \'push\' }`, and `emit(src, fields)`, which writes a comment in its own language above the source. Write the **shared** analysis `fieldsTouched(ir)`: the names of all fields read or written, each once, sorted. Then write `compile(src, plugin)`: lower, analyse, and return what the plugin emits for those fields. Neither function may look at which language it is.',
    starter: `function fieldsTouched(ir) {
  return [];
}

function compile(src, plugin) {
  return src;
}`,
    solution: `function fieldsTouched(ir) {
  const fs = new Set();
  for (const op of ir) {
    if (op.op === 'get' ||
        op.op === 'set') {
      fs.add(op.field);
    }
  }
  return [...fs].sort();
}

function compile(src, plugin) {
  const ir = plugin.lower(src);
  const fs = fieldsTouched(ir);
  return plugin.emit(src, fs);
}`,
    tests: `function lowerWords(s, pushWord) {
  const ws = s.split(/\\s+/);
  const ir = [];
  ws.forEach((w, k) => {
    if (w.includes(pushWord)) { ir.push({ op: 'push' }); return; }
    const m = /^[a-z]+\\.([a-z]+);?$/.exec(w);
    if (m) ir.push({ op: /=$/.test(ws[k + 1] || '') ? 'set' : 'get', field: m[1] });
  });
  return ir;
}
const js = { id: 'javascript', lower: (s) => lowerWords(s, '.push('), emit: (s, fs) => '// fields: ' + fs.join(', ') + '\\n' + s };
const py = { id: 'python', lower: (s) => lowerWords(s, '.append('), emit: (s, fs) => '# fields: ' + fs.join(', ') + '\\n' + s };
const jsSrc = 'ps.push({ x: 0, vx: 1 });\\nfor (const p of ps) p.x += p.vx;';
const pySrc = 'ps.append(P(0.0, 1.0))\\nfor p in ps:\\n    p.x += p.vx';
test('reads and writes, each field once, sorted', () => {
  const ir = [{ op: 'get', field: 'vx' }, { op: 'set', field: 'x' }, { op: 'get', field: 'x' }, { op: 'push' }];
  expect(fieldsTouched(ir)).toEqual(['vx', 'x']);
});
test('no field accesses', () => {
  expect(fieldsTouched([{ op: 'push' }])).toEqual([]);
});
test('the JavaScript plugin', () => {
  expect(compile(jsSrc, js)).toBe('// fields: vx, x\\n' + jsSrc);
});
test('the Python plugin, same analysis', () => {
  expect(compile(pySrc, py)).toBe('# fields: vx, x\\n' + pySrc);
});
test('a third plugin needs no changes', () => {
  const lua = { id: 'lua', lower: js.lower, emit: (s, fs) => '-- fields: ' + fs.join(', ') + '\\n' + s };
  expect(compile(jsSrc, lua)).toBe('-- fields: vx, x\\n' + jsSrc);
});
test('both languages get the same answer', () => {
  expect(fieldsTouched(py.lower(pySrc))).toEqual(fieldsTouched(js.lower(jsSrc)));
});`,
    hints: [
      'In `fieldsTouched`, collect `op.field` for every op whose `op` is `get` or `set`. A `Set` keeps each name once.',
      'Turn the set into an array with `[...fs]` and call `.sort()` on it.',
      '`compile` is three lines: `plugin.lower(src)`, then `fieldsTouched(ir)`, then `plugin.emit(src, fs)`.',
    ],
    walkthrough: `This is Viscosity’s \`compile\` in miniature.

- **The analysis sees only IR.** \`fieldsTouched\` has no idea whether \`{ op: 'set', field: 'x' }\` came from \`p.x += ...\` in JavaScript or in Python. That is the point: written once, it serves both plugins, and the last test checks they agree.
- **A set, then sorted.** \`x\` is both written and read, but it is one field. Sorting makes the answer independent of the order the plugin lowered things in, so two languages that spell the loop differently still give the same list.
- **The plugin owns both ends.** Only the plugin knows that Python comments start with \`#\` and JavaScript ones with \`//\`, just as only the real plugins know how to parse and how to write their own syntax.

Adding a third language here means writing a third \`{ lower, emit }\` object. Neither function you wrote changes.`,
    wrong: [
      {
        code: `function fieldsTouched(ir) {
  const fs = [];
  for (const op of ir) {
    if (op.field) fs.push(op.field);
  }
  return fs;
}

function compile(src, plugin) {
  const ir = plugin.lower(src);
  const fs = fieldsTouched(ir);
  return plugin.emit(src, fs);
}`,
        why: '`x` appears twice (written, then read), and the order follows the source rather than being sorted, so the report reads `x, vx, x`.',
      },
      {
        code: `function fieldsTouched(ir) {
  const fs = new Set();
  for (const op of ir) {
    if (op.op === 'get' ||
        op.op === 'set') {
      fs.add(op.field);
    }
  }
  return [...fs].sort();
}

function compile(src, plugin) {
  const ir = plugin.lower(src);
  const fs = fieldsTouched(ir);
  const c = plugin.id === 'python'
    ? '# ' : '// ';
  return c + 'fields: ' +
    fs.join(', ') + '\\n' + src;
}`,
        why: 'It works for these two languages, but `compile` now knows Python’s comment syntax. A third plugin, say for Lua, gets JavaScript comments. Writing the output is the plugin’s job: call `plugin.emit`.',
      },
    ],
  },
  columnFor: {
    optional: true,
    title: 'A language fact in the core',
    prompt:
      'Write `columnFor(lang, kinds)`. `kinds` lists what one field can hold, as strings: `\'int\'`, `\'float\'` or `\'str\'`. Return `\'typed\'` if the field can use a typed column, or `\'plain\'` otherwise. In `\'javascript\'` any number fits a Float64Array, so ints and floats are both fine. In `\'python\'` only floats may go into `array(\'d\')`. A field with no kinds at all is `\'plain\'`.',
    starter: `function columnFor(lang, kinds) {
  return 'typed';
}`,
    solution: `function columnFor(lang, kinds) {
  if (kinds.length === 0) {
    return 'plain';
  }
  for (const k of kinds) {
    if (k === 'str') return 'plain';
    if (lang === 'python' &&
        k === 'int') return 'plain';
  }
  return 'typed';
}`,
    tests: `test('JavaScript: ints and floats are both numbers', () => {
  expect(columnFor('javascript', ['int', 'float'])).toBe('typed');
  expect(columnFor('javascript', ['int'])).toBe('typed');
});
test('Python: only floats', () => {
  expect(columnFor('python', ['float'])).toBe('typed');
  expect(columnFor('python', ['int'])).toBe('plain');
  expect(columnFor('python', ['float', 'int'])).toBe('plain');
});
test('strings are never typed', () => {
  expect(columnFor('javascript', ['float', 'str'])).toBe('plain');
  expect(columnFor('python', ['str'])).toBe('plain');
});
test('nothing known', () => {
  expect(columnFor('python', [])).toBe('plain');
});`,
    hints: [
      'Strings rule out a typed column in every language. Check for them first.',
      'The only language-specific rule: in Python, an `int` also rules it out.',
      'An empty list proves nothing, so it must be `plain`.',
    ],
    walkthrough: `This is the shape of the one place where the core’s numeric inference asks \`module.language\`.

- **Most of the rule is shared.** A string never fits a numeric column in either language. That part doesn’t depend on the language at all.
- **One line is a language fact.** Python keeps \`1\` and \`1.0\` apart. \`array('d')\` stores C doubles, so an int put in comes back as a float, and \`print\` would show \`1.0\` instead of \`1\`. The program’s output would change. In JavaScript \`1\` and \`1.0\` are the same value, so the same field is fine.
- **Unknown is not typed.** Viscosity only uses a typed column when it can prove every value fits. With nothing known, the safe answer is a plain column.

Keeping facts like this few and explicit is what keeps a multi-language core honest.`,
    wrong: [
      {
        code: `function columnFor(lang, kinds) {
  for (const k of kinds) {
    if (k === 'str') return 'plain';
  }
  return 'typed';
}`,
        why: 'It ignores the language: a Python int field gets an `array(\'d\')` column, so `1` would print as `1.0`. An empty list also comes out `typed`.',
      },
      {
        code: `function columnFor(lang, kinds) {
  if (kinds.length === 0) {
    return 'plain';
  }
  for (const k of kinds) {
    if (k !== 'float') return 'plain';
  }
  return 'typed';
}`,
        why: 'Applying Python’s rule everywhere is safe but too strict: a JavaScript field holding ints loses its Float64Array for no reason.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Viscosity has 6 analyses. Without a shared IR, roughly what does adding a third language cost?',
    options: [
      { t: 'One plugin', why: 'That is the cost with a shared IR.' },
      { t: 'Six more analysis implementations, plus its parser and emitter', correct: true, why: 'Without an IR every analysis is written against each language’s syntax: languages × analyses.' },
      { t: 'Nothing, analyses work on any syntax tree', why: 'Each language’s syntax tree is different; an analysis written for one can’t read another.' },
      { t: 'Eighteen plugins', why: '18 is the total number of analysis implementations for three languages, not plugins.' },
    ],
  },
  {
    q: 'Which of these did the Python plugin have to write itself?',
    options: [
      { t: 'The bounds proofs', why: 'Those run on VIR in the core.' },
      { t: 'The explain report', why: '`explain()` is shared; the reports come from the same planner.' },
      { t: 'The escape (safety) checks', why: 'Shared too: `escapes_print.py` is refused by the same check as JavaScript.' },
      { t: 'A tokenizer, parser, lowering and emitter', correct: true, why: 'Those depend on Python’s syntax, so they live in the 1,065-line plugin.' },
    ],
  },
  {
    q: 'Why does a VIR `const` carry a note saying `int` or `float`?',
    options: [
      { t: 'Python distinguishes them, and the core must know which values may go in `array(\'d\')`', correct: true, why: 'JavaScript never needed it, because every JS number is a double. The IR grew to say what Python means.' },
      { t: 'To make the printed VIR easier to read', why: 'The printer doesn’t even show the note.' },
      { t: 'JavaScript needs it for Float64Array', why: 'Any JavaScript number fits a Float64Array.' },
      { t: 'For constant folding', why: 'Viscosity doesn’t fold constants; the note is a type fact.' },
    ],
  },
  {
    q: 'Python lists are kept as objects by default, while the same JavaScript program gets struct of arrays. Where is that decided?',
    options: [
      { t: 'In the Python plugin’s emitter, which refuses to write columns', why: 'The emitter writes columns happily when the plan says so (with an annotation or `--python-auto`).' },
      { t: 'In the safety analysis', why: 'The program is equally safe in both languages.' },
      { t: 'In the shared planner, which reads `module.language` as a measured cost fact', correct: true, why: 'CPython measured slower with columns, so the planner keeps objects and says why.' },
      { t: 'In the CLI, by file extension', why: 'The CLI only picks the plugin.' },
    ],
  },
  {
    q: 'The first report for `not_dataclass.py` said “pushes something that is not a fresh object literal”. What did that show?',
    options: [
      { t: 'The decision is wrong', why: 'It is right: the class is not a dataclass, so Viscosity can’t see its fields.' },
      { t: 'Shared messages were written in one language’s terms', correct: true, why: 'Python has no object literals. The core now words it for Python: “appends something that is not a fresh dataclass instance”.' },
      { t: 'The Python plugin lowered the program as JavaScript', why: 'It lowered it as Python; the wording lives in the shared analysis.' },
      { t: 'Python does not support push', why: '`append` is lowered to the same VIR `push`.' },
    ],
  },
  {
    q: 'Which statement about LLVM is supported by its own README?',
    options: [
      { t: 'LLVM can only compile C', why: 'Clang alone handles C, C++, Objective-C and Objective-C++.' },
      { t: 'LLVM parses C++ itself, without a front-end', why: 'C-like languages use the Clang front-end.' },
      { t: 'LLVM is an interpreter framework', why: 'That describes Truffle, not LLVM.' },
      { t: 'Its core processes an IR, and Clang compiles C-like languages into it', correct: true, why: 'The same split as Viscosity: a front-end per language, a shared core.' },
    ],
  },
];
