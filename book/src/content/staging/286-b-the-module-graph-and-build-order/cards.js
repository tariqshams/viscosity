// Chapter 286b cards. Keys are stable ids: never rename them.

export const prompts = {
  'mg-what': {
    q: 'What is a program’s module graph?',
    a: 'One node per module, and an arrow from each module to every module it imports.',
  },
  'mg-edge': {
    q: 'In this chapter’s module graph, which way does the arrow for `import { c } from "./c"` inside `a` point?',
    a: 'From `a` to `c`: from the importing module to the module it imports.',
  },
  'mg-topo': {
    q: 'What makes an order of modules a build order (a topological order)?',
    a: 'Every module comes after all the modules it imports.',
  },
  'mg-dfs': {
    q: 'In a depth-first walk, why does the order in which modules *finish* put each one after its imports?',
    a: 'A module finishes only after the walk has finished every module it imports.',
  },
  'mg-cycle': {
    q: 'During the depth-first walk, what tells you the graph has a cycle?',
    a: 'An import leads back to a module that is still in progress (still on the walk’s stack).',
  },
  'mg-js-cycle': {
    q: 'Go rejects an import cycle. What does JavaScript do with one?',
    a: 'It runs the modules anyway, one of them first, so that module can read a `const` of the other before it is set: a ReferenceError ("Cannot access ... before initialization").',
  },
  'mg-rebuild': {
    q: 'Module `c`’s interface changes. Which modules may need compiling again?',
    a: '`c` and every module that can reach `c` by following import arrows (its importers, their importers, and so on).',
  },
  'mg-body': {
    q: 'If only the body of a function in `c` changes, not its interface, why may the modules that import `c` be reused?',
    a: 'They were compiled against `c`’s interface, which is unchanged, so their compiled code is still right; only `c` is compiled again before linking.',
  },
};

export const examples = {
  'rebuild-set': {
    title: 'What to rebuild after an edit',
    code: `const graph = {
  main: ['a', 'b'], a: ['c'],
  b: ['c', 'd'], c: [], d: [],
};
// who imports m? flip every arrow
function importers(g) {
  const back = {};
  for (const m in g) back[m] = [];
  for (const m in g) {
    for (const n of g[m]) {
      back[n].push(m);
    }
  }
  return back;
}
function rebuild(g, changed) {
  const back = importers(g);
  const todo = [changed];
  const out = new Set();
  while (todo.length > 0) {
    const m = todo.pop();
    if (out.has(m)) continue;
    out.add(m);
    todo.push(...back[m]);
  }
  return [...out].sort();
}
console.log(rebuild(graph, 'c'));
console.log(rebuild(graph, 'd'));
console.log(rebuild(graph, 'main'));`,
  },
};

export const exercises = {
  'build-order': {
    title: 'A build order, with cycle detection',
    prompt:
      'Write `buildOrder(graph, entry)`. `graph` maps each module name to the array of modules it imports (a module missing from `graph` imports nothing). Return the modules reachable from `entry` in a build order: each module after every module it imports, each module once. Walk depth-first, trying imports in the order they are listed, and add a module when it finishes, so the answers are exactly the ones in the tests. If the walk finds a cycle, throw an `Error` whose message is `import cycle: ` followed by the loop, for example `import cycle: a -> c -> a`.',
    starter: `function buildOrder(graph, entry) {
  return [entry];
}`,
    solution: `function buildOrder(graph, entry) {
  const order = [];
  const done = new Set();
  const stack = [];
  function visit(m) {
    if (done.has(m)) return;
    const i = stack.indexOf(m);
    if (i >= 0) {
      const loop = stack.slice(i);
      loop.push(m);
      throw new Error('import cycle: '
        + loop.join(' -> '));
    }
    stack.push(m);
    for (const n of graph[m] ?? []) {
      visit(n);
    }
    stack.pop();
    done.add(m);
    order.push(m);
  }
  visit(entry);
  return order;
}`,
    tests: `const g = {
  main: ['a', 'b'], a: ['c'],
  b: ['c', 'd'], c: [], d: [],
};
const msg = (f) => {
  try { f(); return 'no error'; }
  catch (e) { return e.message; }
};
test('one module', () => {
  expect(buildOrder({}, 'm')).toEqual(['m']);
});
test('a chain', () => {
  const ch = { x: ['y'], y: ['z'] };
  expect(buildOrder(ch, 'x'))
    .toEqual(['z', 'y', 'x']);
});
test('the chapter\\'s graph', () => {
  expect(buildOrder(g, 'main'))
    .toEqual(['c', 'a', 'd', 'b', 'main']);
});
test('a shared import is not a cycle', () => {
  const dia = { t: ['l', 'r'],
    l: ['s'], r: ['s'] };
  expect(buildOrder(dia, 't'))
    .toEqual(['s', 'l', 'r', 't']);
});
test('only reachable modules', () => {
  expect(buildOrder(g, 'b'))
    .toEqual(['c', 'd', 'b']);
});
test('a cycle is reported', () => {
  const cy = { main: ['a'], a: ['c'],
    c: ['a'] };
  expect(msg(() => buildOrder(cy, 'main')))
    .toBe('import cycle: a -> c -> a');
});
test('a module importing itself', () => {
  expect(msg(() => buildOrder({ a: ['a'] }, 'a')))
    .toBe('import cycle: a -> a');
});`,
    hints: [
      'Write a recursive `visit(m)` that first visits everything `m` imports, and only then adds `m` to the answer.',
      'Keep two records: a `Set` of finished modules (visit each once, which handles shared imports) and an array used as a stack of modules still in progress (push on entry, pop when finished).',
      'At the start of `visit(m)`: if `m` is finished, return; if `m` is on the stack at index `i`, the loop is `stack.slice(i)` with `m` pushed on the end, so throw `new Error(\'import cycle: \' + loop.join(\' -> \'))`. Use `graph[m] ?? []` for a module with no entry.',
    ],
    walkthrough: `**How to think about it.** A module can be compiled once everything it imports has been, so the natural recursion is "first deal with my imports, then me". That is a depth-first walk that adds each module *after* its recursive calls return: the post-order you stepped through. Two complications remain. A module can be reached twice through different paths (\`s\` in the diamond), which is perfectly fine and must not be added twice; and a module can be reached *while it is still being worked on*, which is a cycle. Those are different situations, so they need two different records: a set of finished modules and a stack of modules in progress.

**The solution, line by line.**

- \`const order = [];\` collects the answer.
- \`const done = new Set();\` holds every finished module.
- \`const stack = [];\` holds the modules in progress, in the order the walk entered them, which is also the path from \`entry\` to the current module.
- \`function visit(m) {\` is the walk.
- \`if (done.has(m)) return;\` a module already finished is skipped: this is what makes the diamond \`t → l → s\`, \`t → r → s\` list \`s\` once and report no cycle.
- \`const i = stack.indexOf(m);\` asks whether \`m\` is in progress.
- \`if (i >= 0) { ... }\`: it is, so we have come back round to it. The modules from \`m\`'s position on the stack to the top are the loop, and pushing \`m\` once more closes it: for \`main → a → c → a\` the stack is \`['main', 'a', 'c']\`, \`i\` is 1, and the loop is \`['a', 'c', 'a']\`. \`main\` is not part of the cycle, which is why we slice from \`i\`.
- \`throw new Error('import cycle: ' + loop.join(' -> '));\` reports it in the required form.
- \`stack.push(m);\` marks \`m\` in progress.
- \`for (const n of graph[m] ?? []) { visit(n); }\` visits each import in listed order; \`?? []\` treats a module missing from the map as having no imports.
- \`stack.pop();\` \`m\` is no longer in progress (it is always the top, because every visit it started has returned).
- \`done.add(m); order.push(m);\` \`m\` is finished, after all its imports.
- \`visit(entry); return order;\` starts the walk and returns the order.

On the chapter's graph this produces \`c, a, d, b, main\`, the same order as the diagram, and Go's \`go list -deps\` prints its packages in the same kind of order.

**Common wrong attempts.**

- Using one \`seen\` set for both jobs: the second time the walk reaches \`s\` (or \`c\` in the chapter's graph) it looks like a cycle, so a perfectly good diamond is rejected.
- Pushing \`m\` before visiting its imports gives a pre-order (\`main\` first), the opposite of what a build needs.
- No cycle check at all: on a cycle the recursion never ends and JavaScript stops with \`RangeError: Maximum call stack size exceeded\`.`,
    wrong: [
      {
        code: `function buildOrder(graph, entry) {
  const order = [];
  const seen = new Set();
  function visit(m) {
    if (seen.has(m)) {
      throw new Error('import cycle');
    }
    seen.add(m);
    for (const n of graph[m] ?? []) {
      visit(n);
    }
    order.push(m);
  }
  visit(entry);
  return order;
}`,
        why: 'One set cannot tell "finished" from "in progress", so a module reached twice (the shared `c`) is reported as a cycle.',
      },
      {
        code: `function buildOrder(graph, entry) {
  const order = [];
  const done = new Set();
  function visit(m) {
    if (done.has(m)) return;
    done.add(m);
    order.push(m);
    for (const n of graph[m] ?? []) {
      visit(n);
    }
  }
  visit(entry);
  return order;
}`,
        why: 'It adds a module before its imports (pre-order), so `main` comes first; and it never reports a cycle.',
      },
    ],
  },
};

export const quiz = [
  {
    q: '`main` imports `a` and `b`; `a` and `b` both import `c`. Which is a valid build order?',
    options: [
      { t: '`main, a, b, c`', why: 'That is backwards: `main` needs everything else first.' },
      { t: '`c, a, b, main`', correct: true, why: 'Each module comes after all of its imports; `c, b, a, main` would be valid too.' },
      { t: '`a, c, b, main`', why: '`a` imports `c`, so `c` must come before `a`.' },
    ],
  },
  {
    q: 'In the depth-first walk, when is a module added to the build order?',
    options: [
      { t: 'When the walk first reaches it', why: 'That is pre-order, which puts a module before its imports.' },
      { t: 'When it has no imports left in the graph at all', why: 'Most modules have imports; they are added once those are finished.' },
      { t: 'When every module it imports has been finished', correct: true, why: 'Adding it on finishing (post-order) is what puts it after its imports.' },
      { t: 'In alphabetical order', why: 'Alphabetical order ignores the arrows entirely.' },
    ],
  },
  {
    q: 'The walk reaches `c` a second time, from `b`, after `c` was finished via `a`. What does that mean?',
    options: [
      { t: 'A shared import: skip it, it is already in the order', correct: true, why: 'Only reaching a module that is still *in progress* means a cycle.' },
      { t: 'An import cycle', why: '`c` is finished, not in progress, so there is no loop back.' },
      { t: '`c` must be compiled twice', why: 'Each module is compiled once; the build order lists it once.' },
    ],
  },
  {
    q: 'What does Go do if package `a` imports `b` and `b` imports `a`?',
    options: [
      { t: 'It compiles them in alphabetical order', why: 'No order puts each before the other; Go refuses.' },
      { t: 'It runs them and may read a variable before it is set', why: 'That is JavaScript’s behaviour with a cycle.' },
      { t: 'It stops with "import cycle not allowed", listing the loop', correct: true, why: 'The Go specification makes importing a package from itself, directly or indirectly, illegal.' },
      { t: 'It merges `a` and `b` into one package', why: 'Go never merges packages; the program must be restructured.' },
    ],
  },
  {
    q: 'In the chapter’s graph (main → a, b; a → c; b → c, d), module `d`’s interface changes. Which modules are rebuilt?',
    options: [
      { t: 'All five', why: '`a` and `c` cannot reach `d`, so they are unaffected.' },
      { t: '`d`, `b` and `main`', correct: true, why: 'They are `d` and the modules that reach it by following arrows.' },
      { t: 'Only `d`', why: '`b` was compiled against `d`’s old interface, and `main` against `b`’s.' },
      { t: '`d` and `c`', why: '`c` does not import `d`; arrows, not neighbours, decide.' },
    ],
  },
];
