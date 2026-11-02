// Chapter 23b cards (split from chapter 23). Keys are stable ids:
// never rename them.

export const prompts = {
  'run-once': {
    q: 'Three files import `errors.js`. How many times does `errors.js` run?',
    a: 'Once. A module runs only once, however many files import it.',
  },
  'load-order': {
    q: '`main.js` imports `parser.js`, which imports `scanner.js`. In what order do they run?',
    a: '`scanner.js`, then `parser.js`, then `main.js`: each runs after everything it imports.',
  },
  'post-order': {
    q: 'Why is the module load order called a **post-order**?',
    a: 'Each module is listed (run) *after* the modules it imports, the way a node comes after its children.',
  },
  'cycle-error': {
    q: 'In a cycle, `b.js` reads `a.js`’s `const x` before `a.js` has run. What happens?',
    a: 'A `ReferenceError`: “Cannot access \'x\' before initialization”. The name exists but has no value yet.',
  },
  'cycle-fix': {
    q: 'Modules A and B import each other, and it causes trouble. What is the usual fix?',
    a: 'Move the code they share into a third module that both import, so the cycle disappears.',
  },
  'one-job': {
    q: 'What is the first rule of thumb for splitting a program into modules?',
    a: 'Each module has one clear job that you can say in a sentence.',
  },
  'point-one-way': {
    q: 'Why should imports point one way, from high-level modules to low-level ones?',
    a: 'Then no module can depend on itself through others, so there are no cycles, and a change low down only affects what is above it.',
  },
  'bottom-layer': {
    q: 'In the interpreter’s layers, why does `errors.js` sit at the bottom?',
    a: 'Every other module uses it, and it imports nothing, so it can run first and never take part in a cycle.',
  },
};

export const examples = {
  wiring: {
    title: 'An interpreter wired bottom-up',
    code: `// errors "module": needs nothing
function makeErrors() {
  class ParseError extends Error {}
  return { ParseError };
}

// scanner "module": needs errors
function makeScanner(errors) {
  function scan(s) {
    const out = [];
    for (let i = 0; i < s.length; i++) {
      const d = s.charCodeAt(i) - 48;
      if (d < 0 || d > 9) {
        const m = 'bad digit ' + s[i];
        throw new errors.ParseError(m);
      }
      out.push(d);
    }
    return out;
  }
  return { scan };
}

// parser "module": needs scanner
function makeParser(scanner) {
  function sum(src) {
    let t = 0;
    for (const d of scanner.scan(src)) {
      t = t + d;
    }
    return t;
  }
  return { sum };
}

// main: build from the bottom up
const errors = makeErrors();
const scanner = makeScanner(errors);
const parser = makeParser(scanner);

console.log(parser.sum('123'));
try {
  parser.sum('1x');
} catch (e) {
  const ours = e instanceof
    errors.ParseError;
  console.log(ours, e.message);
}`,
  },
};

const loadDeps = `const deps = {
  main: ['parser', 'errors'],
  parser: ['scanner', 'errors'],
  scanner: ['errors'],
  errors: [],
};`;

export const exercises = {
  loadOrder: {
    title: 'Which module runs first?',
    prompt: `A program's imports are given as an object: each module name maps to the array of names it imports, in the order its \`import\` lines appear.

\`\`\`
${loadDeps}
\`\`\`

Write \`loadOrder(deps, entry)\` that returns the array of module names in the order they run, starting from \`entry\`: every module comes after all the modules it imports (taken in order), and each appears **once**. For the \`deps\` above, \`loadOrder(deps, 'main')\` is \`['errors', 'scanner', 'parser', 'main']\`. Modules that \`entry\` never reaches don't run. If there is a cycle, don't loop forever: a module that is already being loaded is skipped.`,
    starter: `function loadOrder(deps, entry) {
  // your code here
}

const deps = {
  main: ['util'],
  util: [],
};
console.log(loadOrder(deps, 'main'));`,
    solution: `function loadOrder(deps, entry) {
  const order = [];
  const seen = {};
  function visit(name) {
    if (seen[name]) {
      return;
    }
    seen[name] = true;
    for (const d of deps[name]) {
      visit(d);
    }
    order.push(name);
  }
  visit(entry);
  return order;
}`,
    tests: `test('a single module', () => {
  expect(loadOrder({ a: [] }, 'a')).toEqual(['a']);
});
test('imports run first', () => {
  const deps = { main: ['b'], b: ['c'], c: [] };
  expect(loadOrder(deps, 'main'))
    .toEqual(['c', 'b', 'main']);
});
test('the chapter example', () => {
  const deps = {
    main: ['parser', 'errors'],
    parser: ['scanner', 'errors'],
    scanner: ['errors'],
    errors: [],
  };
  expect(loadOrder(deps, 'main'))
    .toEqual(['errors', 'scanner', 'parser', 'main']);
});
test('imports are taken in order', () => {
  const deps = { m: ['x', 'y'], x: [], y: [] };
  expect(loadOrder(deps, 'm')).toEqual(['x', 'y', 'm']);
});
test('unreachable modules do not run', () => {
  const deps = { m: ['x'], x: [], lost: [] };
  expect(loadOrder(deps, 'm')).toEqual(['x', 'm']);
});
test('a cycle does not loop forever', () => {
  const deps = { a: ['b'], b: ['a'] };
  expect(loadOrder(deps, 'a')).toEqual(['b', 'a']);
});`,
    hints: [
      'Say the rule out loud: to get a module ready, get each of its imports ready, then run it. That sentence describes a recursive function. What should it be called, and what does it take?',
      'Write a helper `visit(name)` inside `loadOrder`. It visits each import of `name` first (`for (const d of deps[name]) visit(d);`), and *then* pushes `name` onto the result.',
      'To run each module once (and survive cycles), keep an object `seen`. At the start of `visit`, return if `seen[name]` is already true; otherwise set it to true *before* the loop over the imports.',
    ],
    walkthrough: `**How to think about it.** Do the chapter example by hand first, the way the step-through did: to run \`main\`, you must first run \`parser\`; to run \`parser\`, first \`scanner\`; to run \`scanner\`, first \`errors\`, which needs nothing, so \`errors\` goes on the list first. Then you climb back up: \`scanner\`, then \`parser\`'s other import \`errors\` (already done, so skip it), then \`parser\`, then \`main\`'s second import \`errors\` (skip), then \`main\`. Two things did the work there: a recursive "get this ready" step, and a memory of what is already done. The code is those two things.

**The solution, line by line.**

- \`function loadOrder(deps, entry) {\` takes the import table and the starting module.
- \`  const order = [];\` is the result, filled in run order.
- \`  const seen = {};\` remembers every module we have *started* on, as \`seen[name] = true\`.
- \`  function visit(name) {\` is a nested function, so through its closure it can use \`deps\`, \`order\` and \`seen\`. Its job: get the module \`name\` ready.
- \`    if (seen[name]) {\` asks whether we have already started this module (it has run, or it is being loaded higher up in a cycle).
- \`      return;\` stops at once: this is the "runs once" rule, and also the base case that ends a cycle.
- \`    }\` ends that check.
- \`    seen[name] = true;\` marks the module as started *before* looking at its imports; in the cycle \`a → b → a\`, the inner \`visit('a')\` then sees the mark and stops.
- \`    for (const d of deps[name]) {\` takes the imports in the order they were written.
- \`      visit(d);\` gets each one ready first, which may recurse further down.
- \`    }\` ends the loop. By now, everything \`name\` imports has been pushed.
- \`    order.push(name);\` runs the module itself, last: pushing *after* the loop is what puts each module behind its imports (a post-order).
- \`  }\` ends \`visit\`.
- \`  visit(entry);\` starts the walk at the entry module; modules it never reaches are never visited.
- \`  return order;\` returns the run order.
- \`}\` closes \`loadOrder\`.

A module with no imports (\`errors\`) is the natural base case: its loop does nothing and it is pushed straight away. The same depth-first shape turns up whenever a compiler walks a graph, such as the control-flow graphs of Part VI.

**Common wrong attempts.**

- Pushing \`name\` *before* the loop: the list comes out as \`main\` first, which is the order you *visit* modules, not the order they *run*.
- Leaving out \`seen\`: a module imported twice, like \`errors\`, is listed twice, and a cycle recurses until the stack overflows.
- Marking \`seen[name]\` only *after* the loop: that still lists each module once in the chapter example, but in a cycle, \`a\` visits \`b\`, which visits \`a\` again before \`a\` is marked, forever.`,
    wrong: [
      {
        code: `function loadOrder(deps, entry) {
  const order = [];
  const seen = {};
  function visit(name) {
    if (seen[name]) {
      return;
    }
    seen[name] = true;
    order.push(name);
    for (const d of deps[name]) {
      visit(d);
    }
  }
  visit(entry);
  return order;
}`,
        why: 'This pushes a module *before* its imports, so `main` comes first. A module can only run once its imports have run: push after the loop.',
      },
      {
        code: `function loadOrder(deps, entry) {
  const order = [];
  function visit(name) {
    for (const d of deps[name]) {
      visit(d);
    }
    order.push(name);
  }
  visit(entry);
  return order;
}`,
        why: 'Without `seen`, a module imported twice (like `errors`) is listed twice, and a cycle recurses until the stack overflows. Remember which modules you have started.',
      },
      {
        code: `function loadOrder(deps, entry) {
  const order = [];
  const seen = {};
  function visit(name) {
    if (seen[name]) {
      return;
    }
    for (const d of deps[name]) {
      visit(d);
    }
    seen[name] = true;
    order.push(name);
  }
  visit(entry);
  return order;
}`,
        why: 'Marking a module as seen only *after* its imports are done is too late for a cycle: `a` visits `b`, which visits `a` again before `a` is marked, forever. Mark it before the loop.',
      },
    ],
  },
  pointsDown: {
    optional: true,
    title: 'Do the imports point one way?',
    prompt:
      'Write `pointsDown(deps, layers)`. `deps` is an import table like the one in the core exercise, and `layers` is an array of every module name from the top layer to the bottom (for example `[\'main\', \'parser\', \'scanner\', \'errors\']`). Return `true` if every import goes to a module **later** in `layers` (further down), and `false` if any import goes to the same module or one above it.',
    starter: `function pointsDown(deps, layers) {
  // your code here
}

const deps = {
  main: ['util'],
  util: [],
};
const layers = ['main', 'util'];
console.log(pointsDown(deps, layers));`,
    solution: `function pointsDown(deps, layers) {
  for (const m of layers) {
    const here = layers.indexOf(m);
    for (const d of deps[m]) {
      if (layers.indexOf(d) <= here) {
        return false;
      }
    }
  }
  return true;
}`,
    tests: `const layers = ['main', 'parser', 'scanner', 'errors'];
test('the chapter layout points down', () => {
  const deps = {
    main: ['parser', 'errors'],
    parser: ['scanner', 'errors'],
    scanner: ['errors'],
    errors: [],
  };
  expect(pointsDown(deps, layers)).toBe(true);
});
test('an import that points up', () => {
  const deps = {
    main: ['parser'], parser: ['scanner'],
    scanner: ['parser'], errors: [],
  };
  expect(pointsDown(deps, layers)).toBe(false);
});
test('importing yourself is not down', () => {
  const deps = {
    main: [], parser: ['parser'],
    scanner: [], errors: [],
  };
  expect(pointsDown(deps, layers)).toBe(false);
});
test('no imports at all is fine', () => {
  const deps = {
    main: [], parser: [], scanner: [], errors: [],
  };
  expect(pointsDown(deps, layers)).toBe(true);
});`,
    hints: [
      'Give each module a number: its position in `layers`. "Points down" then means "goes to a bigger number".',
      '`layers.indexOf(name)` gives a module’s position. Loop over every module `m`, and over every import `d` of `m`.',
      'If `layers.indexOf(d) <= layers.indexOf(m)`, that import points sideways or up: return `false` at once. If both loops finish, return `true`.',
    ],
    walkthrough: `**How to think about it.** "Above" and "below" are positions in a list, so turn them into numbers: \`main\` is layer 0, \`parser\` 1, \`scanner\` 2, \`errors\` 3. An import from \`m\` to \`d\` points down exactly when \`d\`'s number is bigger than \`m\`'s. So check every import of every module, and the first one that fails the test settles the answer. (If the imports all point down, there can be no cycle, because following imports only ever makes the number bigger, and it can never come back.)

**The solution, line by line.**

- \`function pointsDown(deps, layers) {\` takes the import table and the layer order.
- \`  for (const m of layers) {\` visits every module.
- \`    const here = layers.indexOf(m);\` is \`m\`'s layer number (\`indexOf\` returns the position of a value in an array).
- \`    for (const d of deps[m]) {\` visits each module that \`m\` imports.
- \`      if (layers.indexOf(d) <= here) {\` is true when \`d\` is in the same layer (that is, \`m\` imports itself) or higher up.
- \`        return false;\` one bad import is enough.
- \`      }\`, \`    }\` and \`  }\` close the check and both loops.
- \`  return true;\` is only reached if every import pointed down.
- \`}\` closes the function.

**Common wrong attempts.**

- Using \`<\` instead of \`<=\`: a module that imports itself then passes, although that is the smallest cycle there is.
- Returning \`true\` inside the loop as soon as one import points down: the answer must wait until *every* import has been checked.`,
    wrong: [
      {
        code: `function pointsDown(deps, layers) {
  for (const m of layers) {
    const here = layers.indexOf(m);
    for (const d of deps[m]) {
      if (layers.indexOf(d) < here) {
        return false;
      }
    }
  }
  return true;
}`,
        why: 'With `<`, a module that imports itself (same layer) passes. Sideways is not down: use `<=`.',
      },
      {
        code: `function pointsDown(deps, layers) {
  for (const m of layers) {
    const here = layers.indexOf(m);
    for (const d of deps[m]) {
      if (layers.indexOf(d) > here) {
        return true;
      }
    }
  }
  return false;
}`,
        why: 'This answers after the first good import, without checking the rest, and says `false` for a program with no imports at all.',
      },
    ],
  },
};

export const quiz = [
  {
    q: '`a.js` imports `b.js` and `c.js` (in that order). `b.js` imports `c.js`. `c.js` imports nothing. In what order do they run?',
    options: [
      { t: '`c`, `b`, `a`', correct: true, why: '`a` needs `b`, which needs `c`, so `c` runs first, then `b`. `a`’s second import, `c`, has already run, and modules run once. Then `a`.' },
      { t: '`a`, `b`, `c`', why: 'A module runs only after everything it imports.' },
      { t: '`b`, `c`, `a`', why: '`b` imports `c`, so `c` must run before `b`.' },
      { t: '`c`, `b`, `c`, `a`', why: 'A module runs only once, however many files import it.' },
    ],
  },
  {
    q: '`scanner.js` imports `parser.js` to report errors, and `parser.js` imports `scanner.js` to get tokens. What is the best fix?',
    options: [
      { t: 'Merge every file of the program into one', why: 'That removes the cycle but throws away all the structure. Moving only the shared part is enough.' },
      { t: 'Import each file twice', why: 'Modules run once anyway, and this doesn’t break the cycle.' },
      { t: 'Move the error code into `errors.js`, imported by both', correct: true, why: 'The shared code moves down into a third module, and the imports point one way again.' },
      { t: 'Nothing: cycles are always fine', why: 'Cycles can fail with a ReferenceError when a name is read before its module has run.' },
    ],
  },
  {
    q: 'In a cycle, `b.js` runs first and reads `x`, a `const` exported by `a.js`. What does it get?',
    options: [
      { t: '`undefined`', why: 'A `const` that has not been given its value yet cannot be read at all.' },
      { t: 'A `ReferenceError`: Cannot access \'x\' before initialization', correct: true, why: '`a.js` has not run yet, so its `const x` exists but has no value.' },
      { t: 'The value `a.js` will give it later', why: 'JavaScript cannot see into the future: `a.js` runs after `b.js` here.' },
    ],
  },
  {
    q: 'Which set of modules is better structured?',
    options: [
      { t: 'One `everything.js` that holds the whole interpreter', why: 'Every name can see every other, so you can’t tell who uses what.' },
      { t: 'Modules with one job each, importing only modules below them', correct: true, why: 'Small borders, and imports that point one way, so there are no cycles.' },
      { t: 'Modules that each import all the others, just in case', why: 'That creates cycles everywhere, and hides which module really depends on which.' },
    ],
  },
  {
    q: 'Python and JavaScript both print `errors loaded` once for two imports of `errors`. How does C avoid pasting a header twice?',
    options: [
      { t: 'C remembers which modules have run', why: 'C has no modules that run; `#include` only pastes text.' },
      { t: 'It cannot: C always pastes it twice', why: 'It would, without help; the include guard is that help.' },
      { t: 'An include guard: `#ifndef` / `#define` / `#endif` makes the second paste empty', correct: true, why: 'The first paste defines `ERRORS_H`, so the second time the `#ifndef` test fails and the text is skipped.' },
    ],
  },
];
