// Chapter 292 cards. Keys are stable ids: never rename them.

export const prompts = {
  'pkg-what': {
    q: 'What is an npm package?',
    a: 'A folder described by a `package.json`, packed into a tarball and published to a registry so others can install it by name.',
  },
  'pkg-identity': {
    q: 'Which two `package.json` fields together identify a published package?',
    a: '`name` and `version`.',
  },
  'pkg-scope': {
    q: 'What is the `@viscosity/` in `@viscosity/cli`?',
    a: 'A scope: a namespace owned by an npm user or organization.',
  },
  'pkg-ts': {
    q: 'Why did the first installed CLI fail with ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING?',
    a: 'Node strips TypeScript types by default, but deliberately refuses to for files under `node_modules`. Packages must ship JavaScript.',
  },
  'pkg-deps': {
    q: 'Why did installing the CLI tarball install only one package?',
    a: 'The CLI imports the core by a relative path into the repo and declared no dependencies, so npm didn’t know it needed anything else. The bundle now inlines everything.',
  },
  'pkg-main': {
    q: 'Why did the bundled CLI print nothing when run through `npx`?',
    a: 'It only called `main()` when `import.meta.url` matched `process.argv[1]`, and through npm’s bin link `argv[1]` is the link’s path, not the file’s.',
  },
  'pkg-order': {
    q: 'Why were the six Rust crates published in a fixed order (vir, core, the front ends, cli, wasm)?',
    a: 'Each crate depends on the ones before it, and cargo will not publish a crate whose dependencies are not on crates.io yet.',
  },

  'pkg-files': {
    q: 'What does the `files` field in `package.json` do?',
    a: 'It limits the tarball to the listed files and folders (package.json is always included).',
  },
  'pkg-dryrun': {
    q: 'How do you see exactly which files a package would contain, without publishing anything?',
    a: '`npm pack --dry-run`.',
  },

};

export const exercises = {
  packList: {
    title: 'What goes in the tarball?',
    prompt:
      'Write `packList(paths, files)`, a simplified version of how npm decides what to pack. `paths` lists every file in the package folder, and `files` is the `files` field of `package.json` (or `undefined` if there is none). Return, sorted, the paths that are packed: `package.json` always; with no `files` field, everything; otherwise every path that equals an entry of `files` or lies inside a folder named by one (`dist` covers `dist/viscosity.mjs`, but not `distant.txt`).',
    starter: `function packList(paths, files) {
  return paths;
}`,
    solution: `function packList(paths, files) {
  const keep = (p) =>
    p === 'package.json' ||
    !files ||
    files.some((f) =>
      p === f || p.startsWith(f + '/'));
  return paths.filter(keep).sort();
}`,
    tests: `const paths = ['package.json', 'build.mjs', 'src/cli.ts', 'src/profile.ts', 'bin/viscosity.mjs', 'dist/viscosity.mjs', 'LICENSE', 'THIRD_PARTY_LICENSES.txt'];
const files = ['bin', 'dist', 'LICENSE', 'THIRD_PARTY_LICENSES.txt'];
test('the real CLI packs five files', () => {
  expect(packList(paths, files)).toEqual(['LICENSE', 'THIRD_PARTY_LICENSES.txt', 'bin/viscosity.mjs', 'dist/viscosity.mjs', 'package.json']);
});
test('a folder name is not a prefix of other names', () => {
  expect(packList(['dist/a.js', 'distant.txt', 'package.json'], ['dist'])).toEqual(['dist/a.js', 'package.json']);
});
test('package.json is always packed', () => {
  expect(packList(['package.json', 'a.js'], ['a.js'])).toEqual(['a.js', 'package.json']);
});
test('no files field packs everything', () => {
  expect(packList(['src/cli.ts', 'package.json'])).toEqual(['package.json', 'src/cli.ts']);
});`,
    hints: [
      'Write one test, `keep(p)`, that says whether a single path is packed, then `filter` and `sort`.',
      'Three reasons to keep a path: it is `package.json`; there is no `files` field at all; or some entry of `files` matches it.',
      'An entry `f` matches a path that equals `f`, or that starts with `f + \'/\'` (the slash stops `dist` from matching `distant.txt`).',
    ],
    walkthrough: `**How to think about it.** Work the first test by hand. The folder has eight files, and \`files\` names two folders and two single files. \`bin/viscosity.mjs\` is inside \`bin\`, so it is packed; \`dist/viscosity.mjs\` is inside \`dist\`; the two licence files are named directly; \`package.json\` is always packed; and \`build.mjs\` and the two \`src\` files are left out. That is five files, the same five the real \`@viscosity/cli\` tarball holds. So the job splits into a yes-or-no question about one path, asked of every path, followed by a sort.

**The solution, line by line.**

- \`function packList(paths, files) {\` takes the folder's paths and the optional \`files\` list.
- \`  const keep = (p) =>\` defines the question for one path \`p\`.
- \`    p === 'package.json' ||\` keeps the manifest no matter what.
- \`    !files ||\` keeps everything when there is no \`files\` field (\`undefined\` is falsy, so \`!files\` is \`true\`).
- \`    files.some((f) =>\` asks whether any entry matches;
- \`      p === f || p.startsWith(f + '/'));\` an entry matches the file it names exactly, or anything inside the folder it names. Adding the \`'/'\` is what stops \`dist\` from matching \`distant.txt\`.
- \`  return paths.filter(keep).sort();\` keeps the matching paths and sorts them (capital letters sort before small ones, which is why \`LICENSE\` comes first).

The real npm also always includes a README and a licence file, and ignores some folders by default; this exercise keeps only the rule that bit the CLI.

**Common wrong attempts.**

- \`p.startsWith(f)\` without the slash: \`distant.txt\` is packed because it begins with \`dist\`.
- Forgetting \`package.json\`: a tarball without its manifest cannot be installed at all.
- Forgetting the no-\`files\` case: \`files.some\` on \`undefined\` throws, although a package without a \`files\` field is perfectly normal (it packs everything, which is exactly how the first CLI tarball ended up holding raw TypeScript).`,
    wrong: [
      {
        code: `function packList(paths, files) {
  const keep = (p) =>
    p === 'package.json' ||
    !files ||
    files.some((f) =>
      p.startsWith(f));
  return paths.filter(keep).sort();
}`,
        why: 'Without the slash, `dist` matches `distant.txt` too. A folder entry should match only paths inside that folder.',
      },
      {
        code: `function packList(paths, files) {
  if (!files) return paths.sort();
  return paths.filter((p) =>
    files.some((f) => p === f ||
      p.startsWith(f + '/'))).sort();
}`,
        why: '`package.json` is left out whenever `files` does not list it, and a package without its manifest cannot be installed.',
      },
    ],
  },
  releaseOrder: {
    optional: true,
    title: 'Publish in dependency order',
    prompt:
      'Write `releaseOrder(deps)`. `deps` maps each crate name to the list of crates it depends on (all of them in `deps`). Return an array of every crate in an order where each crate comes after all of its dependencies. When several crates are ready at once, take them in alphabetical order. If no crate is ready but some are left (a cycle), throw an `Error` with message `\'cycle\'`.',
    starter: `function releaseOrder(deps) {
  return Object.keys(deps).sort();
}`,
    solution: `function releaseOrder(deps) {
  const done = [];
  const names =
    Object.keys(deps).sort();
  while (done.length < names.length) {
    const next = names.find((n) =>
      !done.includes(n) &&
      deps[n].every((d) =>
        done.includes(d)));
    if (!next) throw new Error('cycle');
    done.push(next);
  }
  return done;
}`,
    tests: `const v = 'viscosity-';
const real = {
  [v + 'cli']: [v + 'core', v + 'frontend-js', v + 'frontend-python', v + 'vir'],
  [v + 'core']: [v + 'vir'],
  [v + 'frontend-js']: [v + 'core', v + 'vir'],
  [v + 'frontend-python']: [v + 'core', v + 'vir'],
  [v + 'vir']: [],
  [v + 'wasm']: [v + 'core', v + 'frontend-js', v + 'frontend-python', v + 'vir'],
};
test('the six Viscosity crates', () => {
  expect(releaseOrder(real).map((n) => n.slice(v.length))).toEqual(['vir', 'core', 'frontend-js', 'frontend-python', 'cli', 'wasm']);
});
test('a chain', () => {
  expect(releaseOrder({ a: ['b'], b: ['c', 'd'], c: [], d: [] })).toEqual(['c', 'd', 'b', 'a']);
});
test('independent crates in alphabetical order', () => {
  expect(releaseOrder({ z: [], m: [], a: [] })).toEqual(['a', 'm', 'z']);
});
test('a cycle cannot be published', () => {
  let msg = 'no error';
  try { releaseOrder({ a: ['b'], b: ['a'] }); } catch (e) { msg = e.message; }
  expect(msg).toBe('cycle');
});`,
    hints: [
      'A crate is ready when every crate it depends on has already been published.',
      'Keep a list `done`. Over and over, find the first name (in alphabetical order) that is not done and is ready, and add it.',
      'If no name is ready but some are left, they depend on each other in a circle: throw.',
    ],
    walkthrough: `**How to think about it.** This is the order \`scripts/release.sh\` follows, and the order cargo enforces: a crate can only go up once everything it depends on is already on crates.io. Do the real case by hand. At the start only \`vir\` depends on nothing, so it goes first. Then \`core\` is ready (it needs only \`vir\`). Then both front ends are ready, and alphabetical order puts \`frontend-js\` first, then \`frontend-python\`. Then \`cli\` and \`wasm\` are both ready, and \`cli\` comes first. So the method is: repeatedly pick the first ready crate, alphabetically, until none are left. (This is a *topological sort*, the same ordering a build tool uses for its targets.)

**The solution, line by line.**

- \`function releaseOrder(deps) {\` takes the dependency map.
- \`  const done = [];\` is the publishing order so far.
- \`  const names =
    Object.keys(deps).sort();\` lists every crate alphabetically, so that \`find\` below always prefers the alphabetically first ready crate.
- \`  while (done.length < names.length) {\` repeats until every crate is placed.
- \`    const next = names.find((n) =>\` looks for the first crate that is
- \`      !done.includes(n) &&\` not yet published, and
- \`      deps[n].every((d) =>\` and \`        done.includes(d)));\` whose dependencies are all published already.
- \`    if (!next) throw new Error('cycle');\` handles the case where crates remain but none is ready: they wait on each other forever.
- \`    done.push(next);\` publishes it.
- \`  return done;\` returns the order.

**Common wrong attempts.**

- Sorting the names alphabetically and stopping there: \`cli\` would go before \`core\` and \`vir\`, and cargo would refuse to publish it.
- Sorting by how many dependencies each crate has: it happens to work for the six real crates, but in the chain test \`a\` has fewer dependencies than \`b\` while depending on it, and a cycle is never detected.`,
    wrong: [
      {
        code: `function releaseOrder(deps) {
  return Object.keys(deps).sort();
}`,
        why: 'Alphabetical order ignores dependencies: cli would be published before core and vir.',
      },
      {
        code: `function releaseOrder(deps) {
  return Object.keys(deps).sort(
    (a, b) => deps[a].length -
      deps[b].length ||
      (a < b ? -1 : 1));
}`,
        why: 'Fewer dependencies does not mean earlier: in `{ a: [\'b\'], b: [\'c\', \'d\'], ... }`, `a` comes before `b`, which it needs. And a cycle is never reported.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What happens today if someone runs `npm install viscosity`?',
    options: [
      { t: 'They get this book’s compiler, version 0.0.1', why: 'The name belongs to someone else; the compiler is `@viscosity/cli`.' },
      { t: 'npm refuses, because the package doesn’t exist', why: 'A package with that name does exist; it just isn’t this one.' },
      { t: 'They get an unrelated Sass library that owns the name', correct: true, why: '`npm view viscosity` shows version 0.3.0, “a sass library for fluid containers…”.' },
      { t: 'They get `@viscosity/cli`, because npm adds the scope', why: 'npm never adds a scope by itself; you have to ask for `@viscosity/cli` by name.' },
    ],
  },
  {
    q: 'Why couldn’t the CLI be published as it first was, with `bin` pointing at `src/cli.ts`?',
    options: [
      { t: 'npm doesn’t accept `.ts` files in a tarball', why: 'npm packs them happily; `npm pack --dry-run` listed both.' },
      { t: 'Node refuses to strip types under `node_modules`, and the core isn’t a declared dependency', correct: true, why: 'Both showed up when the packed tarball was installed in a scratch folder.' },
      { t: 'The MIT licence forbids it', why: 'MIT allows publishing; bundled code must keep its notices.' },
      { t: 'Scoped packages can’t have a `bin`', why: 'Scoped packages can install commands like any other.' },
    ],
  },
  {
    q: 'After bundling, `npx viscosity explain a.js` printed nothing and exited 0. Why?',
    options: [
      { t: 'The bundle was empty', why: 'It was about 1 MB of code, and the fixed entry used the same bundle.' },
      { t: 'npx swallows output', why: 'npx shows output; the fixed version printed the report.' },
      { t: 'The file had no `#!/usr/bin/env node` line', why: 'Then it wouldn’t have been run by Node at all; it was run, and exited 0.' },
      { t: 'The main check compares the module URL with `argv[1]`, which is npm’s link, not the real file', correct: true, why: 'So `main()` is never called. A bin entry that calls `main()` unconditionally fixes it.' },
    ],
  },
  {
    q: 'The CLI’s `files` field is `["bin", "dist", "LICENSE", "THIRD_PARTY_LICENSES.txt"]`. Which file is *not* in the published tarball?',
    options: [
      { t: '`package.json`', why: 'It is always packed, whatever `files` says.' },
      { t: '`src/cli.ts`', correct: true, why: 'The TypeScript sources are compiled into `dist/viscosity.mjs`; `src` is not listed, so it stays out.' },
      { t: '`dist/viscosity.mjs`', why: 'It is inside the listed folder `dist`.' },
      { t: '`THIRD_PARTY_LICENSES.txt`', why: 'It is listed by name: a bundle contains other people’s code, so their licences ship with it.' },
    ],
  },
  {
    q: 'crates.io answered the sixth crate, `viscosity-wasm`, with HTTP 429. What happened next?',
    options: [
      { t: 'All six crates had to be published again under 0.0.2', why: 'The first five were fine; and a re-run skips crates already on crates.io.' },
      { t: 'A re-run about ten minutes later skipped the five already published and published the sixth', correct: true, why: 'The limit was on creating many *new* crates in a short time, so waiting was enough.' },
      { t: 'The wasm crate was renamed', why: 'Nothing was wrong with its name; 429 means “too many requests”.' },
    ],
  },
];
