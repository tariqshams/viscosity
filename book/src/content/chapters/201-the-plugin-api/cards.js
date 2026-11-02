// Chapter 201 cards. Keys are stable ids: never rename them.

const CORE = `// The shared core: language-neutral.
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
`;

export const prompts = {
  'lp-what': {
    q: 'What does a Viscosity `LanguagePlugin` provide?',
    a: 'An `id`, the file `extensions` it handles, and two functions: `lower` (source → VIR) and `emit` (source + plan → new source).',
  },
  'lp-no-parse': {
    q: 'Why is there no `parse` function in the plugin interface?',
    a: 'Parsing happens inside `lower`. Which parser a language uses is the plugin’s business; the core only receives VIR.',
  },
  'lp-annotations': {
    q: 'Why does `lower` return the `@viscosity` annotations, rather than the core finding them?',
    a: 'They live in comments, and each language writes comments differently. Only the plugin can read them.',
  },
  'lp-private': {
    q: 'How does the JavaScript plugin get its ESTree tree back in `emit`?',
    a: 'It returns a bigger object from `lower` (tree, scopes, JS text). The core passes it unread to `emit`.',
  },
  'lp-why-split': {
    q: 'Why is analysis written once, on VIR, instead of once per language?',
    a: 'Its questions are about data (fields, loops, escapes), not spelling. One implementation serves every language, and one fix fixes all.',
  },
  'lp-dataclass': {
    q: 'How does the Python plugin know that `P(x, 1.0)` creates a record?',
    a: 'It saw `@dataclass class P` with fields x and vx, so it lowers the call to `record.new`.',
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

export const exercises = {
  eqPlugin: {
    title: 'A plugin for a toy language',
    prompt:
      'The toy language has one statement per line. A line `NAME = A + B`, where A and B are whole numbers, is an addition; every other line is something the plugin doesn’t model. The core is written for you: `fold` turns every `add` instruction into a plan entry (line → sum), and `compile` runs the pipeline. Write the plugin `eq`, with `lower(src)` returning `{ module: { insts } }` (one instruction per line: `{ op: \'add\', name, a, b, line }` or `{ op: \'opaque\', line }`, where `line` counts from 0), and `emit(src, low, plan)` replacing each planned line with `NAME = SUM` and leaving the others exactly as they were.',
    starter: CORE + `
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
    solution: CORE + `
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
    walkthrough: `You have just written both halves of a language plugin, and nothing in \`fold\` or \`compile\` had to change for it.

- **lower knows the syntax.** Only \`lower\` knows that \`=\` and \`+\` mean an addition. It turns each line into a language-neutral instruction. The core’s \`fold\` reads \`op\`, \`a\` and \`b\`; it never sees an equals sign.
- **Opaque keeps it sound.** A line the plugin doesn’t understand becomes \`opaque\`, which the core never touches. That is Viscosity’s rule too: what isn’t modelled is left alone.
- **emit edits text.** It rewrites only the lines the plan names, and copies every other line byte for byte (\`print  x\` keeps its two spaces). Viscosity’s emitters work the same way, with source ranges instead of whole lines.
- **Private data travels through.** \`emit\` reads the name from \`low.module.insts\`, data it produced itself in \`lower\`. The real JavaScript plugin carries its ESTree tree through the core the same way.`,
    wrong: [
      {
        code: CORE + `
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
        code: CORE + `
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
    prompt:
      'Prove the architecture: write a plugin `lisp` for lines like `(set x (+ 1 2))`, using the **same** `fold` and `compile`. An addition line becomes `(set x 3)`; any other line is opaque and stays exactly as it was.',
    starter: CORE + `
const lisp = {
  id: 'lisp',
  lower(src) {
    // return { module: { insts } }
  },
  emit(src, low, plan) {
    return src;
  },
};`,
    solution: CORE + `
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
    walkthrough: `Only the two syntax-facing pieces changed: the pattern that recognises an addition, and the text emit writes back. \`fold\` and \`compile\` are untouched, and they produce the same plan for \`(set x (+ 1 2))\` as for \`x = 1 + 2\`, because after lowering the two programs are the same instruction.

That is the claim of Viscosity’s architecture in small: the Python plugin was added in the same way, and every analysis it uses was already written for JavaScript.`,
    wrong: [
      {
        code: CORE + `
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
    q: 'Which of these is part of Viscosity’s `LanguagePlugin` interface?',
    options: [
      { t: '`parse(source)`', why: 'There is no separate parse step in the interface; parsing happens inside `lower`.' },
      { t: '`analyze(module)`', why: 'Analysis belongs to the core and is shared by every language.' },
      { t: '`emit(source, lowered, plan)`', correct: true, why: 'Along with `lower`, `id` and `extensions`, it is the whole interface.' },
      { t: '`run(code)`', why: 'Viscosity never runs the program; it writes a new source file.' },
    ],
  },
  {
    q: 'Why must emit be written separately for each language?',
    options: [
      { t: 'It has to write correct syntax for that language, from that language’s source', correct: true, why: 'Python needs indentation and `append`; JavaScript needs braces and `push`. Only the plugin knows them.' },
      { t: 'Because VIR differs per language', why: 'All plugins lower to the same VIR.' },
      { t: 'Because the plan differs per language', why: 'The plan has the same shape for every language: a layout per collection.' },
      { t: 'It doesn’t: one emitter serves all languages', why: 'Each plugin has its own: `emit.ts` in `frontend-js` and in `frontend-python`.' },
    ],
  },
  {
    q: 'The JavaScript plugin needs its ESTree tree in `emit`. How does it get it?',
    options: [
      { t: 'It parses the source again', why: 'It doesn’t need to. The tree from `lower` is kept.' },
      { t: 'The tree is stored inside VIR', why: 'VIR instructions point at nodes, but the whole tree isn’t part of the module.' },
      { t: 'A global variable', why: 'Nothing global: two compiles at once would clash.' },
      { t: '`lower` returns a bigger object holding it, and the core passes that object to `emit` unread', correct: true, why: 'The core sees only the `LoweredModule` part; the plugin gets its private data back.' },
    ],
  },
  {
    q: 'A Python list of dataclass objects is updated in a loop. What does Viscosity do by default, and why?',
    options: [
      { t: 'Struct of arrays, because loops always win with columns', why: 'In CPython they didn’t: the update loop measured slower with `array(\'d\')` columns.' },
      { t: 'Keeps the objects: in CPython, columns were measured slower per element (the gain was memory)', correct: true, why: 'Reading from `array(\'d\')` creates a float object each time. You can opt in with `# @viscosity soa`.' },
      { t: 'Refuses to compile Python without annotations', why: 'It compiles it, and explains why it kept the objects.' },
      { t: 'AoSoA, because Python has no typed arrays', why: 'Python has `array(\'d\')`, and the Python emitter doesn’t support AoSoA.' },
    ],
  },
  {
    q: 'The Python parser meets syntax it doesn’t support. What does the plugin do?',
    options: [
      { t: 'Crashes the compiler', why: 'It catches its own syntax error.' },
      { t: 'Guesses at a layout anyway', why: 'Guessing would be unsafe.' },
      { t: 'Returns an empty module, and emit returns the source unchanged', correct: true, why: 'Unsupported means untouched: the file comes out exactly as it went in.' },
      { t: 'Hands the file to the JavaScript plugin', why: 'Plugins don’t pass work to each other.' },
    ],
  },
  {
    q: 'What is true of Viscosity’s layout strategies today?',
    options: [
      { t: 'New ones load at run time like language plugins', why: '`STRATEGIES` is a list of names and descriptions; the planner and emitters implement each one in code.' },
      { t: 'There are three, `aos`, `soa` and `aosoa`, and each emitter implements the ones it supports', correct: true, why: 'The JavaScript emitter writes all three; the Python emitter supports `aos` and `soa`.' },
      { t: 'They are chosen by the language plugin', why: 'The core’s planner chooses; the plugin only writes the choice.' },
      { t: 'There is only `soa`', why: '`aos` (leave it alone) and `aosoa` (blocked) are strategies too.' },
    ],
  },
];
