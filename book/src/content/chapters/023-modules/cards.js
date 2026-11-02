// Chapter 23 cards. Keys are stable ids: never rename them.

export const prompts = {
  'module-what': {
    q: 'In JavaScript, what is a module?',
    a: 'A file with its own scope: its top-level names are private unless it exports them.',
  },
  'export-why': {
    q: 'Why is it useful that a module’s non-exported names are invisible to other files?',
    a: 'The module can change, rename or delete them freely without breaking any other file.',
  },
  'not-global': {
    q: '`count.js` declares `let count = 0;` at its top level. Can `main.js` use `count` without importing it?',
    a: 'No. Top-level names in a module are not globals; without an import, `count` does not exist in `main.js` (a `ReferenceError`).',
  },
  'import-syntax': {
    q: 'Write the line that brings the exported function `scan` from `scanner.js` (in the same folder) into another module.',
    a: '`import { scan } from \'./scanner.js\';`',
  },
  'import-readonly': {
    q: 'Can a file assign a new value to a name it imported?',
    a: 'No. Imported names are read-only links, like `const` (`TypeError: Assignment to constant variable.`), though an imported object can still be changed.',
  },
  'missing-export': {
    q: 'What happens if a module imports a name the other file never exported?',
    a: 'A `SyntaxError` (“does not provide an export named …”) before any code in the program runs.',
  },
  'module-pattern': {
    q: 'What is the **module pattern**?',
    a: 'A function that keeps its variables private and returns an object holding only the functions it wants to share.',
  },
  'pattern-private': {
    q: 'In the module pattern, what keeps the private variables alive after the outer function returns?',
    a: 'Closures: the returned functions captured them.',
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
  makeReader: {
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
      'Think of `makeReader` as a module: what is its private state, and what is on its menu? The state is one number, the position.',
      'Inside `makeReader`, declare `let pos = 0;`. It is local to this call, so nothing outside can see it, and each call gets its own. Then define `peek`, `next` and `done` as nested functions; they can read and change `pos` through their closure.',
      '`peek` returns `src[pos]`; `next` saves `src[pos]`, adds one to `pos`, and returns what it saved; `done` returns `pos >= src.length`. Finish with `return { peek, next, done };`.',
    ],
    walkthrough: `**How to think about it.** Ask the two questions you would ask of any module. What is private? The position in the text, because no other code should be able to move it. What is exported? The three things a scanner needs to do with text: look at the next character, take it, and ask whether the text has run out. The module pattern turns those answers into code: a local variable for the private part, nested functions for the exports, and a returned object as the menu.

**The solution, line by line.**

- \`function makeReader(src) {\` takes the text to read. \`src\` is a parameter, so it is private to this call too.
- \`  let pos = 0;\` is the private state: the index of the next character to read. Because it is declared inside the function, every call to \`makeReader\` makes a fresh \`pos\`, which is why two readers never interfere.
- \`  function peek() {\` starts the first export.
- \`    return src[pos];\` returns the character at the current position and changes nothing, so calling \`peek\` twice gives the same answer.
- \`  }\` ends \`peek\`.
- \`  function next() {\` starts the second export.
- \`    const c = src[pos];\` saves the current character before we move.
- \`    pos++;\` moves one step on; this changes the shared private \`pos\`, so \`peek\` sees the new position afterwards.
- \`    return c;\` returns the character we saved (not the new one).
- \`  }\` ends \`next\`.
- \`  function done() {\` starts the third export.
- \`    return pos >= src.length;\` is \`true\` once \`pos\` has moved past the last index.
- \`  }\` ends \`done\`.
- \`  return { peek, next, done };\` is the menu: an object with three properties, each holding one of the functions (shorthand for \`{ peek: peek, next: next, done: done }\`). \`pos\` is not in it, so \`reader.pos\` is \`undefined\`.
- \`}\` closes \`makeReader\`.

All three functions close over the same \`pos\` of the same call, which is what keeps them in step. Your Drip scanner will be built around exactly this trio; in Part III it will be a class rather than a closure, but the idea of keeping the position private is the same.

**Common wrong attempts.**

- Storing the position on the returned object (\`{ pos: 0, ... }\`): it works, but anyone can now read or change \`reader.pos\`, so the border is gone.
- Declaring \`let pos = 0;\` outside \`makeReader\`: then every reader shares one position, and reading from one moves them all.
- In \`next\`, moving \`pos\` on first and then returning \`src[pos]\`: that returns the character one ahead, so \`'abc'\` reads as \`'b'\`, \`'c'\`.`,
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
  exportedNames: {
    optional: true,
    title: 'Read the menu without running the kitchen',
    prompt: `Tools find a module's exports by reading its text, not by running it. Write \`exportedNames(lines)\`: given the lines of a file (an array of strings), return the names it exports, in order. Only two forms appear: \`export function NAME(...\` and \`export const NAME = ...\`. Lines that do not start with \`export \` are ignored.

For example, \`exportedNames(['function isDigit(c) {', 'export function scan(src) {', 'export const VERSION = 1;'])\` is \`['scan', 'VERSION']\`.`,
    starter: `function exportedNames(lines) {
  // your code here
}

const f = [
  'function isDigit(c) {',
  'export function scan(src) {',
];
console.log(exportedNames(f));`,
    solution: `function exportedNames(lines) {
  const names = [];
  for (const line of lines) {
    if (!line.startsWith('export ')) {
      continue;
    }
    const word = line.split(' ')[2];
    names.push(word.split('(')[0]);
  }
  return names;
}`,
    tests: `test('no exports', () => {
  const f = ['function a() {', '}'];
  expect(exportedNames(f)).toEqual([]);
});
test('an exported function', () => {
  const f = ['export function scan(src) {'];
  expect(exportedNames(f)).toEqual(['scan']);
});
test('an exported const', () => {
  const f = ['export const VERSION = 1;'];
  expect(exportedNames(f)).toEqual(['VERSION']);
});
test('private names are skipped', () => {
  const f = [
    'function isDigit(c) {',
    'export function scan(src) {',
    'const pos = 0;',
    'export const VERSION = 1;',
  ];
  expect(exportedNames(f))
    .toEqual(['scan', 'VERSION']);
});`,
    hints: [
      'Loop over the lines and skip every line that does not start with `\'export \'` (chapter 20’s `startsWith`).',
      'Split an export line on spaces: `\'export function scan(src) {\'.split(\' \')` is `[\'export\', \'function\', \'scan(src)\', \'{\']`. Which index holds the name?',
      'Index 2 holds `\'scan(src)\'` or `\'VERSION\'`. Cutting it at `(` with `.split(\'(\')[0]` gives the bare name in both cases (a word with no `(` comes back whole).',
    ],
    walkthrough: `**How to think about it.** Look at the two forms side by side: \`export function scan(src) {\` and \`export const VERSION = 1;\`. In both, the name is the third word. For a function, that word has the parameter list glued on (\`scan(src)\`), so it needs one more cut at the \`(\`; for a const it is already clean. And every line that does not begin with \`export \` is private, so it is skipped. That is the whole job, and notice that nothing here runs the module's code: we only read its text, which is exactly why tools can find exports safely.

**The solution, line by line.**

- \`function exportedNames(lines) {\` takes the file as an array of lines.
- \`  const names = [];\` starts the result.
- \`  for (const line of lines) {\` visits each line in order.
- \`    if (!line.startsWith('export ')) {\` asks whether this line is *not* an export (the space after \`export\` stops a name like \`exporter\` from matching).
- \`      continue;\` skips straight to the next line.
- \`    }\` ends the skip.
- \`    const word = line.split(' ')[2];\` splits the line into words at each space and takes the third (index 2): \`'scan(src)'\` or \`'VERSION'\`.
- \`    names.push(word.split('(')[0]);\` cuts the word at the first \`(\` and keeps the part before it; for \`'VERSION'\`, which has no \`(\`, \`split\` returns \`['VERSION']\`, so index 0 is the whole word.
- \`  }\` ends the loop.
- \`  return names;\` returns the menu.
- \`}\` closes the function.

**Common wrong attempts.**

- Taking index 1 of the split: that is the word \`function\` or \`const\`, not the name.
- Forgetting to cut at \`(\`: the function's name comes back as \`'scan(src)'\`.
- Checking \`line.includes('export')\` instead of \`startsWith\`: a private line such as \`const exportCount = 0;\` would be counted.`,
    wrong: [
      {
        code: `function exportedNames(lines) {
  const names = [];
  for (const line of lines) {
    if (!line.startsWith('export ')) {
      continue;
    }
    names.push(line.split(' ')[2]);
  }
  return names;
}`,
        why: 'For a function the third word still has its parameters attached, so this returns `\'scan(src)\'`. Cut the word at `(`.',
      },
      {
        code: `function exportedNames(lines) {
  const names = [];
  for (const line of lines) {
    const word = line.split(' ')[2];
    names.push(word.split('(')[0]);
  }
  return names;
}`,
        why: 'This never skips private lines, so it reports names that are not exported (and crashes on a line with fewer than three words). Check `startsWith(\'export \')` first.',
      },
    ],
  },
};

export const quiz = [
  {
    q: '`scanner.js` contains `function isDigit(c) { ... }` with no `export`. What happens if `parser.js` tries to `import { isDigit } from \'./scanner.js\'`?',
    options: [
      { t: 'It works: every function in a file can be imported', why: 'Only exported names can be imported. Everything else is private to the file.' },
      { t: 'It fails with a SyntaxError, because `isDigit` is not exported', correct: true, why: 'A module’s names are private unless it exports them, and the import is checked before anything runs.' },
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
    q: 'After `import { scan as tokenize } from \'./scanner.js\';`, which name can this file use?',
    options: [
      { t: '`tokenize`, which is the exported `scan` under a new name', correct: true, why: '`as` renames an import on the way in; the exporting file still calls it `scan`.' },
      { t: '`scan` only', why: 'In this file the import is called `tokenize`; `scan` is not declared here.' },
      { t: 'Both `scan` and `tokenize`', why: 'Only the new name is brought in.' },
    ],
  },
  {
    q: 'In the module pattern, what plays the role of `export`?',
    options: [
      { t: 'The `let` variables inside the function', why: 'Those are the private parts: nothing outside can see them.' },
      { t: 'The function’s parameters', why: 'Parameters are inputs, and they are private to the call too.' },
      { t: 'The object of functions that the outer function returns', correct: true, why: 'Only what you put in the returned object can be reached from outside.' },
      { t: 'Nothing: the module pattern can’t hide anything', why: 'It hides everything that isn’t returned, thanks to closures.' },
    ],
  },
  {
    q: 'In Python, `scanner.py` defines `_is_digit`. Can `parser.py` still import it?',
    options: [
      { t: 'No, the underscore makes it private', why: 'Python does not enforce it; the underscore is only a convention.' },
      { t: 'Yes: every top-level Python name can be imported, and the underscore only means “please don’t”', correct: true, why: 'That is a real difference from JavaScript, where nothing leaves a module without `export`.' },
      { t: 'Only if `scanner.py` is in another folder', why: 'Folders have nothing to do with it.' },
    ],
  },
];
