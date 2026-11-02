// Cards for “Packages and bundlers” (split from chapter 40).
// Keys are stable ids: never rename them.

export const prompts = {
  'pkg-what': {
    q: 'What are the four kinds of thing a typical `package.json` says?',
    a: 'Who the package is (`name`, `version`), how its `.js` files load (`type`), its commands (`scripts`), and what it needs (`dependencies`, `devDependencies`).',
  },
  'dev-deps': {
    q: 'Why is TypeScript usually a `devDependency`, not a `dependency`?',
    a: 'It is needed to work on the project (to check and compile it), not by the finished JavaScript when it runs.',
  },
  caret: {
    q: 'Which versions does the range `^5.9.3` accept?',
    a: '5.9.3 and anything later with major version 5: for example 5.9.10 or 5.12.0, but not 5.9.2 or 6.0.0.',
  },
  lockfile: {
    q: 'Why do you commit `package-lock.json`?',
    a: 'It records the exact version of every package npm installed, so teammates and test servers install the identical set.',
  },
  'local-tsc': {
    q: 'TypeScript 6 is installed on your computer and 5.9.3 in the project. Which one does `npm run check` (`tsc --noEmit`) use?',
    a: 'The project’s 5.9.3: while a script runs, npm puts `node_modules/.bin` on the path ahead of other tools. `npx tsc` does the same.',
  },
  'bundler-what': {
    q: 'In one sentence: what does a bundler do?',
    a: 'Starting from an entry module, it follows every import and writes the modules the program needs into one file (or a few), each after the ones it imports.',
  },
  'tree-shaking': {
    q: 'What is **tree shaking**?',
    a: 'Leaving out of the bundle any code that nothing in the program can reach, such as an exported function that is never imported.',
  },
  'bundler-no-check': {
    q: 'esbuild bundles a `.ts` file containing a type error. What happens?',
    a: 'It bundles it without complaint: it erases types but never checks them. Run `tsc --noEmit` first.',
  },
};

export const examples = {
  'npm-run': {
    title: 'A small model of npm run',
    code: `const pkg = {
  name: 'drip',
  version: '0.1.0',
  scripts: {
    check: 'tsc --noEmit',
    test: 'vitest run',
  },
};

function npmRun(name) {
  const cmd = pkg.scripts[name];
  if (cmd === undefined) {
    console.log('npm error Missing',
      'script: "' + name + '"');
    return;
  }
  const id = pkg.name + '@' +
    pkg.version;
  console.log('>', id, name);
  console.log('>', cmd);
}

npmRun('check');
npmRun('buld');`,
  },
};

export const exercises = {
  bundle: {
    title: 'A tiny bundler',
    prompt: `Write \`bundle(mods, entry)\`. \`mods\` maps each module's name to \`{ imports, code }\`: the names it imports (in order) and its code. Return the bundle as one string: for each module the program needs, a line \`// name\` followed by its code, joined with \`'\\n'\`.

- Only modules reachable from \`entry\` by following imports go in (that is module-level tree shaking).
- Each module comes **after** every module it imports, and imports are followed in the order they are listed.
- A module imported by several others appears **once**.

For example, if \`main\` imports \`math\`, the result is \`'// math\\n' + mathCode + '\\n// main\\n' + mainCode\`.`,
    starter: `function bundle(mods, entry) {
  const parts = [];
  for (const name in mods) {
    parts.push('// ' + name);
    parts.push(mods[name].code);
  }
  return parts.join('\\n');
}`,
    solution: `function bundle(mods, entry) {
  const done = new Set();
  const parts = [];
  function visit(name) {
    if (done.has(name)) return;
    done.add(name);
    const m = mods[name];
    for (const d of m.imports) visit(d);
    parts.push('// ' + name);
    parts.push(m.code);
  }
  visit(entry);
  return parts.join('\\n');
}`,
    tests: `test('one module on its own', () => {
  const m = { main: { imports: [], code: 'go();' } };
  expect(bundle(m, 'main')).toBe('// main\\ngo();');
});
test('an import comes first', () => {
  const m = {
    main: { imports: ['math'], code: 'M' },
    math: { imports: [], code: 'X' },
  };
  expect(bundle(m, 'main')).toBe('// math\\nX\\n// main\\nM');
});
test('unreachable modules are left out', () => {
  const m = {
    main: { imports: [], code: 'M' },
    old: { imports: [], code: 'O' },
  };
  expect(bundle(m, 'main')).toBe('// main\\nM');
});
test('a shared module appears once', () => {
  const m = {
    main: { imports: ['parse', 'scan'], code: 'M' },
    parse: { imports: ['scan'], code: 'P' },
    scan: { imports: [], code: 'S' },
  };
  expect(bundle(m, 'main'))
    .toBe('// scan\\nS\\n// parse\\nP\\n// main\\nM');
});
test('imports are followed in order', () => {
  const m = {
    main: { imports: ['b', 'a'], code: 'M' },
    a: { imports: [], code: 'A' },
    b: { imports: [], code: 'B' },
  };
  expect(bundle(m, 'main'))
    .toBe('// b\\nB\\n// a\\nA\\n// main\\nM');
});`,
    hints: [
      'This is the load-order walk from the program-structure chapter, started from the entry module: "to add a module, first add everything it imports, then add it".',
      'Write a recursive `visit(name)`: visit each name in `mods[name].imports`, then push `// name` and the code. Start it with `visit(entry)`, so unreachable modules are never visited.',
      'Keep a `Set` of modules already visited, and return straight away from `visit` when `name` is in it; add the name to the set *before* visiting its imports.',
    ],
    walkthrough: `**How to think about it.** A bundler's job has two halves: find the modules the program needs, and put them in an order where nothing is used before it is defined. Both fall out of one walk. Start at the entry module; before writing a module, write every module it imports (recursively); and remember which ones you have already written, so a shared module is written once. Modules the walk never reaches are never written, which is tree shaking at the level of whole modules. It is the same post-order walk as the load order of modules, which is no accident: a bundle has to run its modules in the order Node or the browser would have.

**The solution, line by line.**

- \`const done = new Set();\` remembers the modules already visited.
- \`const parts = [];\` collects the bundle's lines, in order.
- \`function visit(name) {\` adds one module, after everything it needs.
- \`if (done.has(name)) return;\` is the base case for a module seen before: it is already in the bundle (or on its way in), so do nothing. This is what keeps a shared module from appearing twice.
- \`done.add(name);\` marks it as visited *before* following its imports, so that even a cycle of imports cannot send the walk round for ever.
- \`const m = mods[name];\` looks the module up once.
- \`for (const d of m.imports) visit(d);\` adds every imported module first, in the order the imports are listed.
- \`parts.push('// ' + name);\` and \`parts.push(m.code);\` write this module, now that everything it imports is already above it.
- \`visit(entry);\` starts the walk at the entry module; nothing else is ever visited, so unreachable modules are left out.
- \`return parts.join('\\n');\` joins the lines into one string, one per line.

For the shared-module test: \`visit('main')\` visits \`parse\`, which visits \`scan\` (written first), then writes \`parse\`; back in \`main\`, the second import \`scan\` is already done, so it is skipped; then \`main\` is written. Result: scan, parse, main.

**Common wrong attempts.**

- Writing a module *before* visiting its imports (pre-order): \`main\` comes out first, before the code it depends on.
- Forgetting the \`Set\`: a module imported twice is written twice, and in a real program its top-level code would run twice.
- Looping over every key of \`mods\` (the starter): it includes unreachable modules and ignores import order.`,
    wrong: [
      {
        code: `function bundle(mods, entry) {
  const done = new Set();
  const parts = [];
  function visit(name) {
    if (done.has(name)) return;
    done.add(name);
    const m = mods[name];
    parts.push('// ' + name);
    parts.push(m.code);
    for (const d of m.imports) visit(d);
  }
  visit(entry);
  return parts.join('\\n');
}`,
        why: 'Each module is written before its imports (pre-order), so `main` comes first and uses code that is not defined yet.',
      },
      {
        code: `function bundle(mods, entry) {
  const parts = [];
  function visit(name) {
    const m = mods[name];
    for (const d of m.imports) visit(d);
    parts.push('// ' + name);
    parts.push(m.code);
  }
  visit(entry);
  return parts.join('\\n');
}`,
        why: 'Without a record of visited modules, `scan` (imported by both `main` and `parse`) is written twice.',
      },
    ],
  },
  caret: {
    optional: true,
    title: 'Does this version fit the range?',
    prompt: 'Write `fits(v, r)` for versions with a major number of 1 or more. `v` is a version like `\'5.12.0\'` and `r` a range like `\'^5.9.3\'`. Return `true` if `v` is at least the range\'s version and has the same major number. Compare the parts as **numbers**: `5.9.10` is later than `5.9.3`.',
    starter: `function fits(v, r) {
  return v >= r.slice(1);
}`,
    solution: `function parse(s) {
  return s.split('.').map(Number);
}

function fits(v, r) {
  const [a, b, c] = parse(v);
  const [x, y, z] = parse(r.slice(1));
  if (a !== x) return false;
  if (b !== y) return b > y;
  return c >= z;
}`,
    tests: `test('the exact version fits', () => {
  expect(fits('5.9.3', '^5.9.3')).toBe(true);
});
test('a later minor version fits', () => {
  expect(fits('5.12.0', '^5.9.3')).toBe(true);
});
test('numbers, not text: 5.9.10 > 5.9.3', () => {
  expect(fits('5.9.10', '^5.9.3')).toBe(true);
});
test('an earlier version does not fit', () => {
  expect(fits('5.9.2', '^5.9.3')).toBe(false);
  expect(fits('5.8.9', '^5.9.3')).toBe(false);
});
test('the next major version does not fit', () => {
  expect(fits('6.0.0', '^5.9.3')).toBe(false);
});`,
    hints: [
      'Split each version into its three numbers. `r.slice(1)` drops the `^`.',
      '`s.split(\'.\')` gives an array of strings; `.map(Number)` turns each into a number. Then the majors must be equal.',
      'With equal majors: if the minors differ, the version fits exactly when its minor is bigger; if they are equal, it fits when its patch is at least the range\'s.',
    ],
    walkthrough: `**How to think about it.** The rule from the chapter's Formal box is "at least M.m.p, and below (M+1).0.0". "Below the next major" is the same as "the same major", since a version cannot be at least M.m.p and have a smaller major. "At least" is a comparison of three numbers, most important first, like comparing dates written year, month, day: the first part that differs decides.

**The solution, line by line.**

- \`function parse(s) {\` and \`return s.split('.').map(Number);\` turn \`'5.9.10'\` into \`[5, 9, 10]\`: \`split\` cuts the text at each dot, and \`map(Number)\` calls \`Number\` on each piece, turning \`'10'\` into the number \`10\`.
- \`const [a, b, c] = parse(v);\` unpacks the version's major, minor and patch.
- \`const [x, y, z] = parse(r.slice(1));\` does the same for the range, after \`slice(1)\` drops the \`^\`.
- \`if (a !== x) return false;\` rejects a different major version: both older (4.x) and newer (6.x) are out.
- \`if (b !== y) return b > y;\` lets the minor decide when it differs: 5.12 is after 5.9, and 5.8 is before it.
- \`return c >= z;\` decides by the patch when majors and minors are equal; equal counts as fitting.

**Common wrong attempts.**

- Comparing the strings (the starter): text is compared character by character, so \`'5.9.10' >= '5.9.3'\` is \`false\` (the character \`1\` comes before \`3\`), and \`'6.0.0'\` would pass.
- Checking each part on its own (\`b >= y && c >= z\`): \`5.12.0\` then fails, because its patch \`0\` is smaller than \`3\`, although 5.12.0 is later than 5.9.3. Only when the minors are *equal* does the patch matter.`,
    wrong: [
      {
        code: `function fits(v, r) {
  const p = v.split('.').map(Number);
  const q = r.slice(1).split('.')
    .map(Number);
  return p[0] === q[0] && p[1] >= q[1]
    && p[2] >= q[2];
}`,
        why: '`5.12.0` fails because its patch 0 is below 3, though it is a later version. The patch only matters when the minors are equal.',
      },
    ],
  },
};

export const quiz = [
  {
    q: '`package.json` asks for `"typescript": "^5.9.3"`. Which of these could `npm install` choose?',
    options: [
      { t: '`6.0.2`', why: 'A caret range keeps the major number: 6.x is outside `^5.9.3`.' },
      { t: '`5.12.0`', correct: true, why: 'It is later than 5.9.3 and has the same major number, 5.' },
      { t: '`5.9.2`', why: 'That is older than 5.9.3, the lowest version the range accepts.' },
    ],
  },
  {
    q: 'A teammate runs `npm install` in your project a month later. What makes them get exactly the versions you had?',
    options: [
      { t: 'The ranges in `package.json`', why: 'A range allows newer versions; a month later, npm could choose different ones.' },
      { t: 'Nothing: they will always get the newest versions', why: 'Not if the lock file is committed: npm installs what it records.' },
      { t: 'The committed `package-lock.json`, which records the exact versions installed', correct: true, why: 'It describes the exact tree, so later installs make the identical one.' },
    ],
  },
  {
    q: 'Why does `npm run check` (with `"check": "tsc --noEmit"`) use the project’s TypeScript rather than one installed elsewhere on the computer?',
    options: [
      { t: 'npm adds the project’s `node_modules/.bin` to the path while the script runs', correct: true, why: 'So `tsc` means the project’s own copy, at the version in its lock file.' },
      { t: 'It downloads TypeScript again every time', why: 'npm runs what is already installed in `node_modules`.' },
      { t: 'It does not: it uses whichever `tsc` was installed last', why: 'Inside a script, the project’s tools come first.' },
    ],
  },
  {
    q: '`math.ts` exports `double` and `unused`; `main.ts` imports only `double`. What is in the bundle esbuild makes from `main.ts`?',
    options: [
      { t: 'Both functions, since `math.ts` exports both', why: 'Tree shaking leaves out what nothing can reach, and nothing imports `unused`.' },
      { t: '`double` and the code of `main.ts`, with types erased', correct: true, why: 'The bundler follows the import, keeps what is used, and drops `unused`.' },
      { t: 'Only `main.ts`: imported modules are loaded separately', why: 'Packing the imported modules into the same file is the point of bundling.' },
    ],
  },
  {
    q: '`main.ts` contains `const n: number = \'five\';`. What does `esbuild --bundle` do?',
    options: [
      { t: 'Refuses, with a type error', why: 'esbuild erases types without checking them; that is tsc’s job.' },
      { t: 'Fixes the type for you', why: 'No tool changes your code to match its labels.' },
      { t: 'Bundles it without complaint', correct: true, why: 'Which is why a build script runs `tsc --noEmit` first, and bundles only if that passes.' },
    ],
  },
];
