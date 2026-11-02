// Chapter 242 cards. Keys are stable ids: never rename them.

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
    a: 'Run time sees real values and can deoptimize if wrong. Viscosity’s output runs on any engine and can be read by a person.',
  },
  'arch-conservative': {
    q: 'What does Viscosity do with a collection when it cannot prove a new layout is safe?',
    a: 'Leaves it exactly as it is (an array of objects), and says why in `explain`.',
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
};

export const exercises = {
  rewriteAccess: {
    title: 'A toy emitter',
    prompt:
      'Emit is where a source-to-source compiler writes its output. Write `rewrite(src, name, fields)`, which turns every `name[INDEX].field` in `src` into `name.field[INDEX]`, but only when `field` is one of `fields`. `INDEX` is any text without a `]`. Leave everything else alone: other arrays (`qs[i].x`, `aps[i].x`), other fields, and longer field names (`ps[i].xs` when only `x` is listed).',
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
    prompt:
      'Write `compile(src, plugin, core)` the way `packages/core/src/index.ts` does. `plugin` has `lower(src)` and `emit(src, lowered, plan)`. `core` has `analyze(module)` and `plan(analysis)`, and `explain(plan)`. `lower` returns `{ module }`. Return `{ code, explain }`.',
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

- Passing \`low.module\` to \`emit\` loses the plugin's private data, so \`l.tag\` is \`undefined\` and the code reads \`'undefined:soa'\`. The real JavaScript plugin keeps its ESTree tree, its scope resolution and the JavaScript it analyzed in that object, and needs all three to rewrite the text.
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
};

export const quiz = [
  {
    q: 'Which step of Viscosity’s pipeline decides that `ps` should become a struct of arrays?',
    options: [
      { t: '`lower`', why: '`lower` only translates the program into VIR. It decides nothing about layouts.' },
      { t: '`plan`', correct: true, why: 'The planner takes the analyses’ facts and chooses a layout for each collection, recording its reasons.' },
      { t: '`emit`', why: '`emit` carries out a decision that has already been made.' },
      { t: 'The JavaScript engine, while running', why: 'Viscosity decides before the program runs. The engine just runs the output.' },
    ],
  },
  {
    q: 'Why does Viscosity’s output keep your comments and formatting?',
    options: [
      { t: 'Emit replaces only the source ranges the plan requires and copies the rest unchanged', correct: true, why: 'It edits the original text; it doesn’t regenerate the program from VIR.' },
      { t: 'VIR stores every comment', why: 'VIR has no comments. Instructions point back to source ranges instead.' },
      { t: 'A pretty-printer reformats the output to match', why: 'There is no reformatting: untouched text is copied byte for byte.' },
      { t: 'It doesn’t: comments are removed', why: 'They survive, which the identity test in the next chapters checks.' },
    ],
  },
  {
    q: 'What makes Viscosity a source-to-source compiler?',
    options: [
      { t: 'It is written in TypeScript', why: 'The language a compiler is written in doesn’t matter.' },
      { t: 'It uses an IR', why: 'Most compilers use an IR, whatever they output.' },
      { t: 'It runs inside the browser', why: 'It also runs from the command line; where it runs isn’t the point.' },
      { t: 'Its output is JavaScript (or Python) source, not machine code or bytecode', correct: true, why: 'Source in, source out. An ordinary engine runs the result.' },
    ],
  },
  {
    q: 'Compared with a run-time columnar transformation inside the engine, what does Viscosity give up?',
    options: [
      { t: 'The ability to run in more than one engine', why: 'It is the other way round: Viscosity’s output runs on any engine.' },
      { t: 'Seeing real values, and backing out with deoptimization if a guess is wrong', correct: true, why: 'Ahead of time, it has only the code. So it must prove every decision instead of guessing.' },
      { t: 'Readable output', why: 'Readable output is one of Viscosity’s advantages.' },
      { t: 'Typed arrays', why: 'Its output uses `Float64Array` columns.' },
    ],
  },
  {
    q: 'Viscosity can’t prove that a collection’s elements never escape. What happens?',
    options: [
      { t: 'It converts it anyway, and inserts a run-time check', why: 'There is no fallback for an escape at run time. Unsafe means unchanged.' },
      { t: 'Compilation fails with an error', why: 'The program is fine; Viscosity only leaves it unoptimized.' },
      { t: 'The collection stays an array of objects, and explain says why', correct: true, why: 'Doing nothing is always correct. The reason is printed so you can change the code if you want the speed.' },
      { t: 'It asks the engine to decide', why: 'The engine never hears about Viscosity: it just runs the output.' },
    ],
  },
];
