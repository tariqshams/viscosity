// Chapter 183 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 98, 98.

export const prompts = {
  'arch-four': {
    q: 'What are the four steps of Viscosity’s `compile`, in order?',
    a: '`lower`, `analyze`, `plan`, `emit`.',
  },
  'arch-owners': {
    q: 'Which of the four steps belong to a language plugin?',
    a: '`lower` and `emit`. `analyze` and `plan` belong to the core.',
  },
  'arch-why-split': {
    q: 'Why do `analyze` and `plan` never see JavaScript syntax?',
    a: 'They work on VIR only, so the same analyses serve every language plugin, and a new language needs no change to them.',
  },
  'arch-emit-text': {
    q: 'Does Viscosity’s emit print the program back out of VIR?',
    a: 'No. It edits the original source text, replacing only the ranges the plan requires, and copies the rest through unchanged.',
  },
  's2s-what': {
    q: 'What is a source-to-source compiler?',
    a: 'A compiler whose output is source code in a high-level language, often the same language it reads.',
  },
  'aot-vs-rt': {
    q: 'Where did the columnar-array research of Makor and colleagues do its transformation?',
    a: 'At run time, inside a JavaScript engine built on Truffle and Graal.',
  },
  'aot-cost': {
    q: 'Name one advantage a run-time transformation has over Viscosity, and one Viscosity has over it.',
    a: 'Run time sees real values and can deoptimise if wrong. Viscosity’s output runs on any engine and can be read by a person.',
  },
  'arch-conservative': {
    q: 'What does Viscosity do with a collection when it cannot prove a new layout is safe?',
    a: 'Leaves it exactly as it is (an array of objects), and says why in `explain`.',
  },
  'lp-what': {
    q: 'What does a Viscosity `LanguagePlugin` provide?',
    a: 'An `id`, the file `extensions` it handles, and two functions: `lower` (source → VIR) and `emit` (source + plan → new source).',
  },
  'lp-no-parse': {
    q: 'Why is there no `parse` function in the plugin interface?',
    a: 'Parsing happens inside `lower`. Which parser a language uses is the plugin’s business; the core only receives VIR.',
  },
  'lp-private': {
    q: 'How does the JavaScript plugin get its ESTree tree back in `emit`?',
    a: 'It returns a bigger object from `lower` (tree, scopes, JS text). The core passes it unread to `emit`.',
  },
  'lp-why-split': {
    q: 'Why is analysis written once, on VIR, instead of once per language?',
    a: 'Its questions are about data (fields, loops, escapes), not spelling. One implementation serves every language, and one fix fixes all.',
  },
  'lp-python-default': {
    q: 'By default, what does Viscosity do with a Python list of dataclass objects?',
    a: 'Keeps it as objects, and explains that you can opt in with `# @viscosity soa` (or `--python-auto`).',
  },
  'lp-python-why': {
    q: 'Why were `array(\'d\')` columns slower per element than objects in CPython?',
    a: 'CPython is an interpreter: reading an `array(\'d\')` element creates a new float object every time.',
  },
  'ls-what': {
    q: 'What is a layout strategy?',
    a: 'One way of storing a collection: `aos`, `soa` or `aosoa`. The planner picks one per collection; emit writes it.',
  },
  'ls-today': {
    q: 'What would adding a fourth layout strategy take today?',
    a: 'A planner rule plus emitter code in each plugin. `STRATEGIES` is a registry of names, not a loader.',
  },
};

export const examples = {
  'before-after': {
    title: 'Before and after: same answer',
    code: `// Before: an array of objects.
const ps = [];
for (let i = 0; i < 4; i++)
  ps.push({ x: i, vx: 1 });
for (let i = 0; i < ps.length; i++)
  ps[i].x += ps[i].vx;
console.log(ps[3].x);

// After: what a source-to-source
// compiler could write instead.
const qs = { length: 0,
  x: new Float64Array(4),
  vx: new Float64Array(4) };
for (let i = 0; i < 4; i++) {
  qs.x[i] = i; qs.vx[i] = 1;
  qs.length++;
}
for (let i = 0; i < qs.length; i++)
  qs.x[i] += qs.vx[i];
console.log(qs.x[3]);`,
  },
  addresses: {
    title: 'Where an AoSoA field lives',
    code: `const F = 2; // fields: x, vx
const B = 8; // elements per block
function at(i, k) {
  const block = Math.floor(i / B);
  return block * F * B + k * B
    + (i % B);
}
console.log(at(0, 0)); // x of 0
console.log(at(0, 1)); // vx of 0
console.log(at(9, 0)); // x of 9
console.log(at(9, 1)); // vx of 9`,
  },
};

export const exercises = {
  rewriteAccess: {
    title: 'A toy emitter',
    prompt: 'Emit is where a source-to-source compiler writes its output. Write `rewrite(src, name, fields)`, which turns every `name[INDEX].field` in `src` into `name.field[INDEX]`, but only when `field` is one of `fields`. `INDEX` is any text without a `]`. Leave everything else alone: other arrays (`qs[i].x`, `aps[i].x`), other fields, and longer field names (`ps[i].xs` when only `x` is listed).',
    starter: `function rewrite(src, name, fields) {
  // your code here
  return src;
}

console.log(rewrite(
  'ps[i].x += ps[i].vx;',
  'ps', ['x', 'vx']));`,
    solution: `function rewrite(src, name, fields) {
  const re = new RegExp('\\\\b' + name +
    '\\\\[([^\\\\]]*)\\\\]\\\\.(\\\\w+)', 'g');
  return src.replace(re, (m, i, f) =>
    fields.includes(f)
      ? name + '.' + f + '[' + i + ']'
      : m);
}`,
    tests: `test('rewrites both accesses', () => {
  expect(rewrite('ps[i].x += ps[i].vx;', 'ps', ['x', 'vx']))
    .toBe('ps.x[i] += ps.vx[i];');
});
test('any index expression', () => {
  expect(rewrite('ps[i + 1].x', 'ps', ['x'])).toBe('ps.x[i + 1]');
});
test('other arrays are untouched', () => {
  expect(rewrite('qs[i].x + aps[0].x', 'ps', ['x']))
    .toBe('qs[i].x + aps[0].x');
});
test('unlisted and longer fields are untouched', () => {
  expect(rewrite('ps[i].name + ps[i].xs', 'ps', ['x']))
    .toBe('ps[i].name + ps[i].xs');
});`,
    hints: [
      'A regular expression with the global flag can find every `name[...]` followed by `.field`. Build it with `new RegExp(...)`, because `name` is a variable.',
      'Capture the index with `([^\\]]*)` and the whole field name with `(\\w+)`. Capturing the whole word is what keeps `xs` from matching `x`.',
      'Start the pattern with `\\b` so `aps[0]` doesn’t match `ps[0]`. In the replacement function, return the match unchanged when the field isn’t listed.',
    ],
    walkthrough: `**How to think about it.** This is emit in miniature: find exactly the text the plan says must change, and replace exactly that range, leaving every other character alone. Before writing code, list what a match looks like: the array's name, then \`[\`, then an index (any text without a \`]\`), then \`]\`, then a dot and a field name. You need the index and the field back, so you can write them in the other order, which is a job for a regular expression with two *capture groups* (the parts in round brackets, which the replacement can read back). The name is in a variable, so the pattern must be built with \`new RegExp(...)\` rather than written as \`/.../\`.

**The solution, line by line.**

- \`function rewrite(src, name, fields) {\` takes the source text, the collection's name and the list of fields the plan approved.
- \`  const re = new RegExp('\\\\b' + name +\` starts the pattern with \`\\b\`, a *word boundary*: the name must not be the tail of a longer word, so \`aps[0]\` is not mistaken for \`ps[0]\`. (In a string, the backslash itself must be doubled, which is why the code says \`'\\\\b'\`.)
- \`    '\\\\[([^\\\\]]*)\\\\]\\\\.(\\\\w+)', 'g');\` adds a literal \`[\`, then group 1, \`([^\\]]*)\`, "any run of characters that are not \`]\`" (the index), then a literal \`]\` and \`.\`, then group 2, \`(\\w+)\`, the *whole* field name. The \`'g'\` flag means "every match, not only the first".
- \`  return src.replace(re, (m, i, f) =>\` hands every match to a function: \`m\` is the whole matched text, \`i\` the index and \`f\` the field.
- \`    fields.includes(f)\` asks whether the plan approved this field.
- \`      ? name + '.' + f + '[' + i + ']'\` rebuilds the access as a column read, so \`ps[i + 1].x\` becomes \`ps.x[i + 1]\`.
- \`      : m);\` returns the match untouched otherwise, so unlisted fields come through byte for byte.
- \`}\` closes the function.

Trace the first test: \`ps[i].x += ps[i].vx;\` has two matches. The first gives \`i = 'i'\`, \`f = 'x'\`, listed, so it becomes \`ps.x[i]\`; the second gives \`f = 'vx'\`, also listed, so it becomes \`ps.vx[i]\`; the \` += \` and \`;\` between and after are never touched.

**Common wrong attempts.**

- Rewriting every match without checking \`fields\` turns \`ps[i].name\` into \`ps.name[i]\`, a column that does not exist.
- Matching a prefix (\`'.' + f\` with \`replaceAll\`) turns \`ps[i].xs\` into \`ps.x[i]s\`; capturing \`\\w+\` and comparing whole names avoids it.
- Leaving out \`\\b\` rewrites \`aps[0].x\`, which belongs to a different array.

Viscosity's real emitter does not use regular expressions, and this exercise shows why it should not: this one would also rewrite \`ps[i].x\` inside a string or a comment, and it cannot handle \`ps[a[0]].x\`. The real one finds its ranges from syntax-tree nodes that VIR instructions point back to, so it only touches real code, and only the accesses the analyses approved.`,
    wrong: [
      {
        code: `function rewrite(src, name, fields) {
  const re = new RegExp('\\\\b' + name +
    '\\\\[([^\\\\]]*)\\\\]\\\\.(\\\\w+)', 'g');
  return src.replace(re, (m, i, f) =>
    name + '.' + f + '[' + i + ']');
}`,
        why: 'This rewrites every field, including ones not in `fields`. `ps[i].name` would become `ps.name[i]`, a column that doesn’t exist.',
      },
      {
        code: `function rewrite(src, name, fields) {
  for (const f of fields) {
    src = src.replaceAll(
      name + '[i].' + f,
      name + '.' + f + '[i]');
  }
  return src;
}`,
        why: 'This only works when the index is literally `i`, and it rewrites `ps[i].xs` into `ps.x[i]s` because it matches a prefix of the field name.',
      },
    ],
  },
  miniCompile: {
    optional: true,
    title: 'Wire up the pipeline',
    prompt: 'Write `compile(src, plugin, core)` the way `packages/core/src/index.ts` does. `plugin` has `lower(src)` and `emit(src, lowered, plan)`. `core` has `analyze(module)` and `plan(analysis)`, and `explain(plan)`. `lower` returns `{ module }`. Return `{ code, explain }`.',
    starter: `function compile(src, plugin, core) {
  // your code here
  return { code: src, explain: '' };
}`,
    solution: `function compile(src, plugin, core) {
  const low = plugin.lower(src);
  const a = core.analyze(low.module);
  const p = core.plan(a);
  const code = plugin.emit(src, low, p);
  const explain = core.explain(p);
  return { code, explain };
}`,
    tests: `const plugin = {
  lower: (s) => ({ module: s.split(' '), tag: 'L' }),
  emit: (s, l, p) => l.tag + ':' + p.join(','),
};
const core = {
  analyze: (m) => m.length,
  plan: (n) => n > 2 ? ['soa'] : ['aos'],
  explain: (p) => 'chose ' + p[0],
};
test('passes lowered and plan to emit', () => {
  expect(compile('a b c', plugin, core).code).toBe('L:soa');
});
test('explains the plan', () => {
  expect(compile('a b', plugin, core).explain).toBe('chose aos');
});
test('analyze gets the module', () => {
  expect(compile('a b c d', plugin, core).explain).toBe('chose soa');
});`,
    hints: [
      'Call the four functions in pipeline order: lower, analyze, plan, emit.',
      '`analyze` takes `lowered.module`, but `emit` takes the whole `lowered` object (the plugin may have stored its own things in it, such as its syntax tree).',
    ],
    walkthrough: `**How to think about it.** The order is forced by what each step needs: you cannot analyze before there is VIR, plan before there are facts, or emit before there is a plan. The one thing to get right is *what* each step receives, and the rule is that core steps get core data while plugin steps get the plugin's own object back.

**The solution, line by line.**

- \`function compile(src, plugin, core) {\` takes the source and the two halves of the compiler.
- \`  const low = plugin.lower(src);\` lowers the source. \`low\` is the plugin's object: it has a \`module\`, and possibly private things the plugin put there for itself (in the tests, \`tag\`).
- \`  const a = core.analyze(low.module);\` gives the core only the language-neutral \`module\`, exactly as \`analyze(lowered.module)\` does in the real \`compile\`.
- \`  const p = core.plan(a);\` turns the facts into a plan.
- \`  const code = plugin.emit(src, low, p);\` hands the plugin its whole \`low\` object back, together with the original source and the plan.
- \`  const explain = core.explain(p);\` makes the readable explanation from the plan alone.
- \`  return { code, explain };\` returns both.

In the first test, \`lower('a b c')\` gives \`{ module: ['a', 'b', 'c'], tag: 'L' }\`; analyze counts 3; plan gives \`['soa']\`; emit writes \`'L:soa'\`, using the \`tag\` it stored itself.

**Common wrong attempts.**

- Passing \`low.module\` to \`emit\` loses the plugin's private data, so \`l.tag\` is \`undefined\` and the code reads \`'undefined:soa'\`. The real JavaScript plugin keeps its ESTree tree, its scope resolution and the JavaScript it analysed in that object, and needs all three to rewrite the text.
- Passing the whole \`low\` to \`analyze\` happens to work here, but it lets core code see plugin data, which is exactly the coupling the architecture forbids.`,
    wrong: [
      {
        code: `function compile(src, plugin, core) {
  const low = plugin.lower(src);
  const a = core.analyze(low.module);
  const p = core.plan(a);
  const code = plugin.emit(src,
    low.module, p);
  const explain = core.explain(p);
  return { code, explain };
}`,
        why: 'Emit needs the whole lowered object, not only the module: the plugin’s own data (here `tag`, in reality its syntax tree) is lost otherwise.',
      },
    ],
  },
  eqPlugin: {
    title: 'A plugin for a toy language',
    prompt: 'The toy language has one statement per line. A line `NAME = A + B`, where A and B are whole numbers, is an addition; every other line is something the plugin doesn’t model. The core is written for you: `fold` turns every `add` instruction into a plan entry (line → sum), and `compile` runs the pipeline. Write the plugin `eq`, with `lower(src)` returning `{ module: { insts } }` (one instruction per line: `{ op: \'add\', name, a, b, line }` or `{ op: \'opaque\', line }`, where `line` counts from 0), and `emit(src, low, plan)` replacing each planned line with `NAME = SUM` and leaving the others exactly as they were.',
    starter: `// The shared core: language-neutral.
function fold(mod) {
  const plan = new Map();
  for (const i of mod.insts) {
    if (i.op !== 'add') continue;
    plan.set(i.line, i.a + i.b);
  }
  return plan;
}
function compile(src, plugin) {
  const low = plugin.lower(src);
  const plan = fold(low.module);
  return plugin.emit(src, low, plan);
}

// Your plugin.
const eq = {
  id: 'eq',
  lower(src) {
    // return { module: { insts } }
  },
  emit(src, low, plan) {
    return src;
  },
};

console.log(compile('x = 1 + 2', eq));`,
    solution: `// The shared core: language-neutral.
function fold(mod) {
  const plan = new Map();
  for (const i of mod.insts) {
    if (i.op !== 'add') continue;
    plan.set(i.line, i.a + i.b);
  }
  return plan;
}
function compile(src, plugin) {
  const low = plugin.lower(src);
  const plan = fold(low.module);
  return plugin.emit(src, low, plan);
}

const RE = /^(\\w+) = (\\d+) \\+ (\\d+)$/;
function inst(l, line) {
  const m = RE.exec(l);
  if (!m) return { op: 'opaque', line };
  return { op: 'add', name: m[1],
    a: +m[2], b: +m[3], line };
}
const eq = {
  id: 'eq',
  lower(src) {
    const insts = src.split('\\n')
      .map(inst);
    return { module: { insts } };
  },
  emit(src, low, plan) {
    const is = low.module.insts;
    const out = (l, k) => plan.has(k)
      ? is[k].name + ' = '
        + plan.get(k)
      : l;
    return src.split('\\n').map(out)
      .join('\\n');
  },
};`,
    tests: `test('folds one line', () => {
  expect(compile('x = 1 + 2', eq)).toBe('x = 3');
});
test('leaves other lines exactly alone', () => {
  expect(compile('x = 1 + 2\\nprint  x\\ny = 10 + 5', eq))
    .toBe('x = 3\\nprint  x\\ny = 15');
});
test('names are not numbers', () => {
  expect(compile('x = a + 2', eq)).toBe('x = a + 2');
});
test('lower marks unknown lines opaque', () => {
  const m = eq.lower('print x\\nz = 4 + 4').module;
  expect(m.insts[0].op).toBe('opaque');
  expect(m.insts[1].op).toBe('add');
  expect(m.insts[1].line).toBe(1);
});`,
    hints: [
      '`lower`: split the source into lines and map each one to an instruction. A regular expression like `/^(\\w+) = (\\d+) \\+ (\\d+)$/` recognises an addition.',
      'Lines that don’t match must still produce an instruction, `{ op: \'opaque\', line }`, so the core knows they exist and leaves them alone.',
      '`emit`: map over the source lines again. If `plan.has(k)`, write the name (from `low.module.insts[k]`) and the planned value; otherwise return the original line untouched.',
    ],
    walkthrough: `**How to think about it.** Split the job the way Viscosity does. The core (\`fold\` and \`compile\`) is finished and knows nothing about equals signs; it reads instructions with \`op\`, \`a\`, \`b\` and \`line\`, and writes a plan, a \`Map\` from line number to sum. Your plugin must do the two language-facing jobs: \`lower\` turns each line of text into one such instruction, and \`emit\` turns the plan back into text. Before writing anything, decide what happens to a line you do not understand: it must still get an instruction (an \`opaque\` one), so that instruction \`k\` always belongs to line \`k\`.

**The solution, line by line.**

- \`const RE = /^(\\w+) = (\\d+) \\+ (\\d+)$/;\` recognises a whole line of the form \`NAME = A + B\`: \`^\` and \`$\` pin it to the start and end, \`(\\w+)\` captures the name, and the two \`(\\d+)\` capture the whole numbers (\`\\+\` is a literal plus).
- \`function inst(l, line) {\` turns one line \`l\` with number \`line\` into an instruction.
- \`  const m = RE.exec(l);\` tries the pattern; \`m\` is \`null\` if the line is not an addition.
- \`  if (!m) return { op: 'opaque', line };\` keeps a place for lines the plugin does not model, so the core leaves them alone.
- \`  return { op: 'add', name: m[1],\` and \`    a: +m[2], b: +m[3], line };\` build the addition; the \`+\` in front of \`m[2]\` turns the text \`'1'\` into the number \`1\`.
- \`  lower(src) {\` / \`    const insts = src.split('\\n')\` / \`      .map(inst);\` split the source into lines and map each one (\`map\` passes the line and its index, which become \`l\` and \`line\`).
- \`    return { module: { insts } };\` returns the shape the core expects.
- \`  emit(src, low, plan) {\` gets the source, its own \`low\` object back, and the plan.
- \`    const is = low.module.insts;\` reads the instructions it made itself.
- \`    const out = (l, k) => plan.has(k)\` asks, for line \`k\`, whether the plan changed it; if so, \`? is[k].name + ' = ' + plan.get(k)\` writes the name and the sum, and otherwise \`: l\` returns the line untouched.
- \`    return src.split('\\n').map(out)\` / \`      .join('\\n');\` rebuilds the text with the same line breaks.

Trace the second test: lines 0 and 2 are additions, line 1 (\`print  x\`) is opaque. The core plans \`{0 → 3, 2 → 15}\`; emit rewrites lines 0 and 2 and copies \`print  x\`, with its two spaces, exactly.

**Common wrong attempts.**

- Skipping unknown lines in \`lower\` makes \`insts[k]\` stop lining up with line \`k\`, so emit looks up the wrong name.
- Treating every line as an addition turns \`print x\` and \`x = a + 2\` into additions of \`NaN\`, and emit then rewrites lines it never understood. Unknown syntax must be opaque, and opaque lines must be copied unchanged: that is Viscosity's own rule.`,
    wrong: [
      {
        code: `// The shared core: language-neutral.
function fold(mod) {
  const plan = new Map();
  for (const i of mod.insts) {
    if (i.op !== 'add') continue;
    plan.set(i.line, i.a + i.b);
  }
  return plan;
}
function compile(src, plugin) {
  const low = plugin.lower(src);
  const plan = fold(low.module);
  return plugin.emit(src, low, plan);
}

const RE = /^(\\w+) = (\\d+) \\+ (\\d+)$/;
const eq = {
  id: 'eq',
  lower(src) {
    const insts = [];
    const ls = src.split('\\n');
    ls.forEach((l, line) => {
      const m = RE.exec(l);
      if (m) insts.push({ op: 'add',
        name: m[1], a: +m[2], b: +m[3],
        line });
    });
    return { module: { insts } };
  },
  emit(src, low, plan) {
    const is = low.module.insts;
    const out = (l, k) => plan.has(k)
      ? is[k].name + ' = '
        + plan.get(k)
      : l;
    return src.split('\\n').map(out)
      .join('\\n');
  },
};`,
        why: 'Skipping unknown lines makes `insts[k]` stop lining up with line `k`, so emit looks up the wrong instruction. Every line needs an instruction, even an opaque one.',
      },
      {
        code: `// The shared core: language-neutral.
function fold(mod) {
  const plan = new Map();
  for (const i of mod.insts) {
    if (i.op !== 'add') continue;
    plan.set(i.line, i.a + i.b);
  }
  return plan;
}
function compile(src, plugin) {
  const low = plugin.lower(src);
  const plan = fold(low.module);
  return plugin.emit(src, low, plan);
}

const eq = {
  id: 'eq',
  lower(src) {
    const insts = src.split('\\n').map(
      (l, line) => {
        const [name, , a, , b] =
          l.split(' ');
        return { op: 'add', name,
          a: +a, b: +b, line };
      });
    return { module: { insts } };
  },
  emit(src, low, plan) {
    const is = low.module.insts;
    return src.split('\\n').map((l, k) =>
      is[k].name + ' = ' + plan.get(k))
      .join('\\n');
  },
};`,
        why: 'This treats every line as an addition. `print x` and `x = a + 2` become additions of `NaN`, and emit rewrites lines it doesn’t understand. Unknown syntax must be opaque, and opaque lines must be copied unchanged.',
      },
    ],
  },
  lispPlugin: {
    optional: true,
    title: 'A second plugin, same core',
    prompt: 'Prove the architecture: write a plugin `lisp` for lines like `(set x (+ 1 2))`, using the **same** `fold` and `compile`. An addition line becomes `(set x 3)`; any other line is opaque and stays exactly as it was.',
    starter: `// The shared core: language-neutral.
function fold(mod) {
  const plan = new Map();
  for (const i of mod.insts) {
    if (i.op !== 'add') continue;
    plan.set(i.line, i.a + i.b);
  }
  return plan;
}
function compile(src, plugin) {
  const low = plugin.lower(src);
  const plan = fold(low.module);
  return plugin.emit(src, low, plan);
}

const lisp = {
  id: 'lisp',
  lower(src) {
    // return { module: { insts } }
  },
  emit(src, low, plan) {
    return src;
  },
};`,
    solution: `// The shared core: language-neutral.
function fold(mod) {
  const plan = new Map();
  for (const i of mod.insts) {
    if (i.op !== 'add') continue;
    plan.set(i.line, i.a + i.b);
  }
  return plan;
}
function compile(src, plugin) {
  const low = plugin.lower(src);
  const plan = fold(low.module);
  return plugin.emit(src, low, plan);
}

const RE =
  /^\\(set (\\w+) \\(\\+ (\\d+) (\\d+)\\)\\)$/;
function inst(l, line) {
  const m = RE.exec(l);
  if (!m) return { op: 'opaque', line };
  return { op: 'add', name: m[1],
    a: +m[2], b: +m[3], line };
}
const lisp = {
  id: 'lisp',
  lower(src) {
    const insts = src.split('\\n')
      .map(inst);
    return { module: { insts } };
  },
  emit(src, low, plan) {
    const is = low.module.insts;
    const out = (l, k) => plan.has(k)
      ? '(set ' + is[k].name + ' '
        + plan.get(k) + ')'
      : l;
    return src.split('\\n').map(out)
      .join('\\n');
  },
};`,
    tests: `test('folds a lisp line', () => {
  expect(compile('(set x (+ 1 2))', lisp)).toBe('(set x 3)');
});
test('other lines unchanged', () => {
  expect(compile('(print x)\\n(set y (+ 4 5))', lisp))
    .toBe('(print x)\\n(set y 9)');
});
test('names stay opaque', () => {
  expect(compile('(set y (+ a 5))', lisp)).toBe('(set y (+ a 5))');
});`,
    hints: [
      'Copy the shape of your `eq` plugin. Only the regular expression in `lower` and the text built in `emit` change.',
      'Parentheses and `+` are special in regular expressions, so escape them: `\\(`, `\\)`, `\\+`.',
    ],
    walkthrough: `**How to think about it.** Copy your \`eq\` plugin and ask which parts of it knew the language. Only two did: the pattern that recognises an addition, and the text \`emit\` writes back. Everything else (one instruction per line, opaque for the rest, look up the plan by line) carries over unchanged, and so do \`fold\` and \`compile\`.

**The solution, line by line.**

- \`const RE =\` / \`  /^\\(set (\\w+) \\(\\+ (\\d+) (\\d+)\\)\\)$/;\` matches \`(set NAME (+ A B))\`. Round brackets and \`+\` are special in regular expressions, so the literal ones are written \`\\(\`, \`\\)\` and \`\\+\`; the unescaped \`(\\w+)\` and \`(\\d+)\` are the capture groups.
- \`function inst(l, line) {\` … is the same as in \`eq\`: \`opaque\` for no match, otherwise \`{ op: 'add', name, a, b, line }\`.
- \`  lower(src) {\` is unchanged.
- \`    const out = (l, k) => plan.has(k)\` / \`      ? '(set ' + is[k].name + ' '\` / \`        + plan.get(k) + ')'\` writes the folded line back in Lisp syntax, \`(set x 3)\`; \`: l\` copies every other line.

After lowering, \`(set x (+ 1 2))\` and \`x = 1 + 2\` are the *same* instruction, so the core produces the same plan for both. That is the claim of Viscosity's architecture in small: the Python plugin was added the same way, and every analysis it uses was already written for JavaScript.

**Common wrong attempts.**

- Marking every line opaque is safe but folds nothing: a plugin must lower what it can.
- Forgetting to escape the brackets makes \`(+\` a group followed by a bare \`+\`, which is not even a valid pattern.`,
    wrong: [
      {
        code: `// The shared core: language-neutral.
function fold(mod) {
  const plan = new Map();
  for (const i of mod.insts) {
    if (i.op !== 'add') continue;
    plan.set(i.line, i.a + i.b);
  }
  return plan;
}
function compile(src, plugin) {
  const low = plugin.lower(src);
  const plan = fold(low.module);
  return plugin.emit(src, low, plan);
}

const lisp = {
  id: 'lisp',
  lower(src) {
    const insts = src.split('\\n').map(
      (l, line) => ({ op: 'opaque',
        line }));
    return { module: { insts } };
  },
  emit(src, low, plan) {
    return src;
  },
};`,
        why: 'Marking everything opaque is safe, but it never folds anything: `(set x (+ 1 2))` stays as it is. A plugin must lower what it can.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which step of Viscosity’s pipeline decides that `ps` should become a struct of arrays?',
    options: [
      {
        t: '`lower`',
        why: '`lower` only translates the program into VIR. It decides nothing about layouts.',
      },
      {
        t: '`plan`',
        correct: true,
        why: 'The planner takes the analyses’ facts and chooses a layout for each collection, recording its reasons.',
      },
      {
        t: '`emit`',
        why: '`emit` carries out a decision that has already been made.',
      },
      {
        t: 'The JavaScript engine, while running',
        why: 'Viscosity decides before the program runs. The engine just runs the output.',
      },
    ],
  },
  {
    q: 'Why does Viscosity’s output keep your comments and formatting?',
    options: [
      {
        t: 'Emit replaces only the source ranges the plan requires and copies the rest unchanged',
        correct: true,
        why: 'It edits the original text; it doesn’t regenerate the program from VIR.',
      },
      {
        t: 'VIR stores every comment',
        why: 'VIR has no comments. Instructions point back to source ranges instead.',
      },
      {
        t: 'A pretty-printer reformats the output to match',
        why: 'There is no reformatting: untouched text is copied byte for byte.',
      },
      {
        t: 'It doesn’t: comments are removed',
        why: 'They survive, which the identity test in the next chapters checks.',
      },
    ],
  },
  {
    q: 'What makes Viscosity a source-to-source compiler?',
    options: [
      {
        t: 'It is written in TypeScript',
        why: 'The language a compiler is written in doesn’t matter.',
      },
      {
        t: 'It uses an IR',
        why: 'Most compilers use an IR, whatever they output.',
      },
      {
        t: 'It runs inside the browser',
        why: 'It also runs from the command line; where it runs isn’t the point.',
      },
      {
        t: 'Its output is JavaScript (or Python) source, not machine code or bytecode',
        correct: true,
        why: 'Source in, source out. An ordinary engine runs the result.',
      },
    ],
  },
  {
    q: 'Compared with a run-time columnar transformation inside the engine, what does Viscosity give up?',
    options: [
      {
        t: 'The ability to run in more than one engine',
        why: 'It is the other way round: Viscosity’s output runs on any engine.',
      },
      {
        t: 'Seeing real values, and backing out with deoptimisation if a guess is wrong',
        correct: true,
        why: 'Ahead of time, it has only the code. So it must prove every decision instead of guessing.',
      },
      {
        t: 'Readable output',
        why: 'Readable output is one of Viscosity’s advantages.',
      },
      {
        t: 'Typed arrays',
        why: 'Its output uses `Float64Array` columns.',
      },
    ],
  },
  {
    q: 'Viscosity can’t prove that a collection’s elements never escape. What happens?',
    options: [
      {
        t: 'It converts it anyway, and inserts a run-time check',
        why: 'There is no fallback for an escape at run time. Unsafe means unchanged.',
      },
      {
        t: 'Compilation fails with an error',
        why: 'The program is fine; Viscosity only leaves it unoptimised.',
      },
      {
        t: 'The collection stays an array of objects, and explain says why',
        correct: true,
        why: 'Doing nothing is always correct. The reason is printed so you can change the code if you want the speed.',
      },
      {
        t: 'It asks the engine to decide',
        why: 'The engine never hears about Viscosity: it just runs the output.',
      },
    ],
  },
  {
    q: 'Which of these is part of Viscosity’s `LanguagePlugin` interface?',
    options: [
      {
        t: '`parse(source)`',
        why: 'There is no separate parse step in the interface; parsing happens inside `lower`.',
      },
      {
        t: '`analyze(module)`',
        why: 'Analysis belongs to the core and is shared by every language.',
      },
      {
        t: '`emit(source, lowered, plan)`',
        correct: true,
        why: 'Along with `lower`, `id` and `extensions`, it is the whole interface.',
      },
      {
        t: '`run(code)`',
        why: 'Viscosity never runs the program; it writes a new source file.',
      },
    ],
  },
  {
    q: 'The JavaScript plugin needs its ESTree tree in `emit`. How does it get it?',
    options: [
      {
        t: 'It parses the source again',
        why: 'It doesn’t need to. The tree from `lower` is kept.',
      },
      {
        t: 'The tree is stored inside VIR',
        why: 'VIR instructions point at nodes, but the whole tree isn’t part of the module.',
      },
      {
        t: 'A global variable',
        why: 'Nothing global: two compiles at once would clash.',
      },
      {
        t: '`lower` returns a bigger object holding it, and the core passes that object to `emit` unread',
        correct: true,
        why: 'The core sees only the `LoweredModule` part; the plugin gets its private data back.',
      },
    ],
  },
  {
    q: 'A Python list of dataclass objects is updated in a loop. What does Viscosity do by default, and why?',
    options: [
      {
        t: 'Struct of arrays, because loops always win with columns',
        why: 'In CPython they didn’t: the update loop measured slower with `array(\'d\')` columns.',
      },
      {
        t: 'Keeps the objects: in CPython, columns were measured slower per element (the gain was memory)',
        correct: true,
        why: 'Reading from `array(\'d\')` creates a float object each time. You can opt in with `# @viscosity soa`.',
      },
      {
        t: 'Refuses to compile Python without annotations',
        why: 'It compiles it, and explains why it kept the objects.',
      },
      {
        t: 'AoSoA, because Python has no typed arrays',
        why: 'Python has `array(\'d\')`, and the Python emitter doesn’t support AoSoA.',
      },
    ],
  },
  {
    q: 'The Python parser meets syntax it doesn’t support. What does the plugin do?',
    options: [
      {
        t: 'Crashes the compiler',
        why: 'It catches its own syntax error.',
      },
      {
        t: 'Guesses at a layout anyway',
        why: 'Guessing would be unsafe.',
      },
      {
        t: 'Returns an empty module, and emit returns the source unchanged',
        correct: true,
        why: 'Unsupported means untouched: the file comes out exactly as it went in.',
      },
      {
        t: 'Hands the file to the JavaScript plugin',
        why: 'Plugins don’t pass work to each other.',
      },
    ],
  },
  {
    q: 'What is true of Viscosity’s layout strategies today?',
    options: [
      {
        t: 'New ones load at run time like language plugins',
        why: '`STRATEGIES` is a list of names and descriptions; the planner and emitters implement each one in code.',
      },
      {
        t: 'There are three, `aos`, `soa` and `aosoa`, and each emitter implements the ones it supports',
        correct: true,
        why: 'The JavaScript emitter writes all three; the Python emitter supports `aos` and `soa`.',
      },
      {
        t: 'They are chosen by the language plugin',
        why: 'The core’s planner chooses; the plugin only writes the choice.',
      },
      {
        t: 'There is only `soa`',
        why: '`aos` (leave it alone) and `aosoa` (blocked) are strategies too.',
      },
    ],
  },
];
