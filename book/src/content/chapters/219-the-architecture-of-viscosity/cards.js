// Chapter 219 cards. Keys are stable ids: never rename them.

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
  'arch-srcref': {
    q: 'What lets emit know which source text a VIR instruction came from?',
    a: 'Each instruction can carry a source reference: the syntax node and its start and end offsets (and line).',
  },
  's2s-what': {
    q: 'What is a source-to-source compiler?',
    a: 'A compiler whose output is source code in a high-level language, often the same language it reads.',
  },
  's2s-check': {
    q: 'What does the Playground’s “Run both” check?',
    a: 'That the original program and the compiled program print the same thing.',
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
    walkthrough: `This is emit in miniature: find the text that the plan says must change, and replace exactly that range.

- **Capture the parts.** The pattern is \`\\bps\\[([^\\]]*)\\]\\.(\\w+)\`. Group 1 is the index text, group 2 is the field name. A replacement *function* gets both, so it can rebuild the access the other way round: \`ps.x[i]\`.
- **Capture the whole field name.** If the pattern ended in \`\\.x\`, then \`ps[i].xs\` would become \`ps.x[i]s\`. Capturing \`\\w+\` and then checking \`fields.includes(f)\` compares whole names.
- **Mind the left edge.** Without \`\\b\`, \`aps[0].x\` contains \`ps[0].x\` and would be rewritten. \`\\b\` demands a word boundary just before the name.
- **Unchanged means unchanged.** Returning \`m\` for an unlisted field leaves the original text exactly as it was.

Viscosity’s real emitter doesn’t use regular expressions, and this exercise shows why it shouldn’t: this one would also rewrite \`ps[i].x\` inside a string or a comment, and can’t handle \`ps[a[0]].x\`. The real one finds the ranges from syntax-tree nodes that VIR instructions point back to, so it only touches real code, and only the accesses the analyses approved.`,
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
    walkthrough: `The order is fixed: you can’t analyze before lowering, or plan before analyzing.

The one detail worth noticing is what each step receives. \`analyze\` is core code, so it gets only the language-neutral \`module\`. \`emit\` is plugin code, so it gets the whole \`lowered\` object back, including anything the plugin put there for itself. The real JavaScript plugin keeps its ESTree tree, its scope resolution and the JavaScript it actually analyzed in that object, and needs all three to rewrite the text. The core passes them along without looking inside.`,
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
    q: 'A new language plugin is added. Which parts must it provide?',
    options: [
      { t: 'Its own analyses and planner', why: 'Those are shared. They work on VIR, whatever language it came from.' },
      { t: 'Only a parser', why: 'A parser alone produces a syntax tree, not VIR, and can’t write the output.' },
      { t: 'A way to lower its source to VIR, and a way to emit its source from a plan', correct: true, why: 'That is exactly the plugin’s half of the pipeline: `lower` and `emit`.' },
      { t: 'A new VIR', why: 'Every plugin lowers to the same VIR; that is what lets the core be shared.' },
    ],
  },
  {
    q: 'Why does Viscosity’s output keep your comments and formatting?',
    options: [
      { t: 'Emit replaces only the source ranges the plan requires and copies the rest unchanged', correct: true, why: 'It edits the original text; it doesn’t regenerate the program from VIR.' },
      { t: 'VIR stores every comment', why: 'VIR has no comments. Instructions point back to source ranges instead.' },
      { t: 'A pretty-printer reformats the output to match', why: 'There is no reformatting: untouched text is copied byte for byte.' },
      { t: 'It doesn’t: comments are removed', why: 'They survive, which chapter 225’s identity test checks.' },
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
      { t: 'Compilation fails with an error', why: 'The program is fine; Viscosity simply doesn’t optimize it.' },
      { t: 'The collection stays an array of objects, and explain says why', correct: true, why: 'Doing nothing is always correct. The reason is printed so you can change the code if you want the speed.' },
      { t: 'It asks the engine to decide', why: 'The engine never hears about Viscosity: it just runs the output.' },
    ],
  },
];
