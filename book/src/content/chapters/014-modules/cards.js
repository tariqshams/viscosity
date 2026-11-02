// Chapter 14 cards. Keys are stable ids: never rename them.

export const prompts = {
  'module-what': {
    q: 'In JavaScript, what is a module?',
    a: 'A file with its own scope: its top-level names are private unless it exports them.',
  },
  'export-why': {
    q: 'Why is it useful that a module’s non-exported names are invisible to other files?',
    a: 'The module can change, rename or delete them freely without breaking any other file.',
  },
  'import-readonly': {
    q: 'Can a file assign a new value to a name it imported?',
    a: 'No. Imported names are read-only, like `const` (though an imported object can still be changed).',
  },
  'module-pattern': {
    q: 'What is the **module pattern**?',
    a: 'A function that keeps its variables private and returns an object holding only the functions it wants to share.',
  },
  'pattern-private': {
    q: 'In the module pattern, what keeps the private variables alive after the outer function returns?',
    a: 'Closures: the returned functions captured them.',
  },
  'run-once': {
    q: 'Three files import `errors.js`. How many times does `errors.js` run?',
    a: 'Once. A module runs only once, however many files import it.',
  },
  'load-order': {
    q: '`main.js` imports `parser.js`, which imports `scanner.js`. In what order do they run?',
    a: '`scanner.js`, then `parser.js`, then `main.js`: each runs after everything it imports.',
  },
  'cycle-fix': {
    q: 'Modules A and B import each other, and it causes trouble. What is the usual fix?',
    a: 'Move the code they share into a third module that both import, so the cycle disappears.',
  },
  'one-job': {
    q: 'Name two signs of a well-structured set of modules.',
    a: 'Each module has one clear job, and imports point one way (from high-level to low-level), with no cycles.',
  },
};

export const examples = {
  'module-pattern': {
    title: 'A module in one snippet',
    code: `function makeCounter() {
  let count = 0;
  function next() {
    count++;
    return count;
  }
  function reset() {
    count = 0;
  }
  return { next, reset };
}

const a = makeCounter();
const b = makeCounter();
a.next();
a.next();
console.log(a.next(), b.next());
console.log(a.count);`,
  },
};

export const exercises = {
  loadOrder: {
    title: 'Which module runs first?',
    prompt: `A program's imports are given as an object: each module name maps to the array of names it imports, in the order its \`import\` lines appear.

\`\`\`
const deps = {
  main: ['parser', 'errors'],
  parser: ['scanner', 'errors'],
  scanner: ['errors'],
  errors: [],
};
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
      'This is recursion on a graph. Write a helper `visit(name)` inside `loadOrder` that gets one module ready.',
      'Getting a module ready means: visit each of its imports first, then `push` the module itself onto the result.',
      'To run each module once (and survive cycles), keep an object `seen`. At the start of `visit`, return if `seen[name]` is already true; otherwise set it to true *before* visiting the imports.',
    ],
    walkthrough: `Say the rule out loud: *to get a module ready, get each of its imports ready, then run it.* That sentence is a recursive function.

- **A helper.** \`visit(name)\` is a nested function, so it can see \`deps\`, \`order\` and \`seen\` from \`loadOrder\` through its closure.
- **Imports first.** \`for (const d of deps[name]) visit(d);\`, then \`order.push(name)\`. Pushing *after* the loop is what puts every module behind its imports. Pushing before it would list \`main\` first.
- **Only once.** \`seen\` remembers every module we've started on. If \`visit\` is asked about one again, it returns straight away. That's a second base case, next to "no imports".
- **Cycles.** Mark \`seen[name] = true\` *before* visiting the imports. In the cycle \`a → b → a\`, the inner \`visit('a')\` sees the mark and stops. Mark it after the loop instead and \`a\` and \`b\` call each other until the stack overflows.

This is a **depth-first traversal**, and the order it produces is called a *post-order*: each node comes after its children. The same shape turns up whenever a compiler walks a graph, such as the control-flow graphs of Part VI.`,
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
  makeReader: {
    optional: true,
    title: 'A reader module',
    prompt:
      'Use the module pattern to write `makeReader(src)`. It returns an object with three functions: `peek()` returns the current character without moving on; `next()` returns the current character and moves one step on; `done()` returns `true` once every character has been read. The position must be **private**: `reader.pos` must be `undefined`. Each reader keeps its own position. (This is the start of a real scanner.)',
    starter: `function makeReader(src) {
  // your code here
}

const r = makeReader('ab');
console.log(r.next(), r.peek());`,
    solution: `function makeReader(src) {
  let pos = 0;
  function peek() {
    return src[pos];
  }
  function next() {
    const c = src[pos];
    pos++;
    return c;
  }
  function done() {
    return pos >= src.length;
  }
  return { peek, next, done };
}`,
    tests: `test('next reads in order', () => {
  const r = makeReader('abc');
  expect(r.next()).toBe('a');
  expect(r.next()).toBe('b');
});
test('peek does not move', () => {
  const r = makeReader('xy');
  expect(r.peek()).toBe('x');
  expect(r.peek()).toBe('x');
  r.next();
  expect(r.peek()).toBe('y');
});
test('done after the last character', () => {
  const r = makeReader('a');
  expect(r.done()).toBe(false);
  r.next();
  expect(r.done()).toBe(true);
});
test('the position is private', () => {
  const r = makeReader('abc');
  r.next();
  expect(r.pos).toBe(undefined);
});
test('each reader has its own position', () => {
  const a = makeReader('12');
  const b = makeReader('34');
  a.next();
  expect(b.next()).toBe('3');
  expect(a.next()).toBe('2');
});`,
    hints: [
      'Inside `makeReader`, declare `let pos = 0;`. It is local to this call, so nothing outside can see it.',
      'Define `peek`, `next` and `done` as nested functions. They can read and change `pos` through their closure.',
      'Return `{ peek, next, done }`: only these three are “exported”.',
    ],
    walkthrough: `This is a module with one private variable and three exported functions.

- **The private state.** \`let pos = 0;\` lives in the call to \`makeReader\`. Each call makes a fresh \`pos\`, so two readers never interfere.
- **The exports.** \`peek\` reads \`src[pos]\`. \`next\` reads it and then moves \`pos\` on. \`done\` compares \`pos\` with \`src.length\`. All three close over the same \`pos\`.
- **The menu.** Returning \`{ peek, next, done }\` hands out the three functions and nothing else, so \`reader.pos\` is \`undefined\`.

Your Drip scanner will be built around exactly this trio: look at the next character, consume it, and check for the end of the input. In Part III it will be a class instead of a closure, but the idea of keeping the position private is the same.`,
    wrong: [
      {
        code: `function makeReader(src) {
  const r = { pos: 0 };
  r.peek = () => src[r.pos];
  r.next = () => src[r.pos++];
  r.done = () => r.pos >= src.length;
  return r;
}`,
        why: 'This works, but `pos` is a property of the returned object, so anyone can read or change `reader.pos`. The point of a module is to keep it private: use a local variable.',
      },
      {
        code: `let pos = 0;
function makeReader(src) {
  function peek() {
    return src[pos];
  }
  function next() {
    const c = src[pos];
    pos++;
    return c;
  }
  function done() {
    return pos >= src.length;
  }
  return { peek, next, done };
}`,
        why: '`pos` is declared outside, so every reader shares one position: reading from one reader moves all of them. Declare it inside `makeReader`, so each call gets its own.',
      },
    ],
  },
};

export const quiz = [
  {
    q: '`scanner.js` contains `function isDigit(c) { ... }` with no `export`. What happens if `parser.js` tries to `import { isDigit } from \'./scanner.js\'`?',
    options: [
      { t: 'It works: every function in a file can be imported', why: 'Only exported names can be imported. Everything else is private to the file.' },
      { t: 'It fails, because `isDigit` is not exported', correct: true, why: 'A module’s names are private unless it exports them.' },
      { t: 'It imports `undefined` silently', why: 'Asking for a name a module doesn’t export is an error, not a silent `undefined`.' },
      { t: 'It copies the whole file into `parser.js`', why: 'Imports bring in names, never file contents.' },
    ],
  },
  {
    q: 'Which line imports the default export of `parser.js`?',
    options: [
      { t: '`import { parse } from \'./parser.js\';`', why: 'Braces import a named export called `parse`, not the default.' },
      { t: '`export default parse;`', why: 'That is how `parser.js` would *create* its default export.' },
      { t: '`const parse = parser.js;`', why: 'That isn’t import syntax at all.' },
      { t: '`import parse from \'./parser.js\';`', correct: true, why: 'With no braces, `import` gets the default export and lets you name it.' },
    ],
  },
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
    q: 'In the module pattern, what plays the role of `export`?',
    options: [
      { t: 'The `let` variables inside the function', why: 'Those are the private parts: nothing outside can see them.' },
      { t: 'The object of functions that the outer function returns', correct: true, why: 'Only what you put in the returned object can be reached from outside.' },
      { t: 'The function’s parameters', why: 'Parameters are inputs, and they are private to the call too.' },
      { t: 'Nothing: the module pattern can’t hide anything', why: 'It hides everything that isn’t returned, thanks to closures.' },
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
    q: 'Why do exports matter to Viscosity’s safety checks?',
    options: [
      { t: 'Exported arrays are automatically copied', why: 'Exporting shares a reference; nothing is copied.' },
      { t: 'Exports make code run more slowly', why: 'Speed isn’t the issue here.' },
      { t: 'Exported functions can’t contain loops', why: 'They can contain anything.' },
      { t: 'An exported object can be reached and changed from other files, so the compiler must account for every importer', correct: true, why: 'An export is a way out of the module: another alias, in chapter 6’s terms.' },
    ],
  },
];
