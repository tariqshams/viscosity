// Chapter 272 cards. Keys are stable ids: never rename them.

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
  'pkg-dryrun': {
    q: 'How do you see exactly which files a package would contain, without publishing?',
    a: '`npm pack --dry-run`.',
  },
  'sv-rules': {
    q: 'In semver, which part do you bump for a backward compatible new feature, and what happens to the part after it?',
    a: 'MINOR; PATCH resets to 0.',
  },
  'sv-zero': {
    q: 'What does semver promise for versions 0.y.z?',
    a: 'Nothing: major version zero is for initial development, and anything may change at any time.',
  },
  'sv-caret': {
    q: 'Which versions does the range `^0.1.0` accept?',
    a: 'Only 0.1.x (at least 0.1.0, below 0.2.0): in 0.x the minor number is treated as breaking.',
  },
  'sv-numeric': {
    q: 'Is `1.10.0` newer than `1.9.0`? What does the string comparison `\'1.10.0\' > \'1.9.0\'` say?',
    a: 'Yes, because the parts compare as numbers (10 > 9). The string comparison says `false`, because it compares characters.',
  },
  'sv-api': {
    q: 'Name two things besides the CLI options that are part of Viscosity’s public API.',
    a: 'Any two of: the plugin API, the explain report’s text, and its layout decisions.',
  },
};

export const examples = {
  'semver-compare': {
    title: 'Versions are numbers, not strings',
    code: `const a = '1.10.0';
const b = '1.9.0';
// strings: character by character
console.log(a > b);

function parse(v) {
  return v.split('.').map(Number);
}
console.log(parse(a), parse(b));
// numbers compare by value
console.log(parse(a)[1] > parse(b)[1]);`,
  },
};

export const exercises = {
  bump: {
    title: 'Bump a version',
    prompt:
      'Write `bump(v, kind)`. `v` is a version like `\'1.4.2\'` and `kind` is `\'major\'`, `\'minor\'` or `\'patch\'`. Return the next version as a string, following semver: add 1 to that part and reset every part to its right to 0.',
    starter: `function bump(v, kind) {
  return v + '.1';
}`,
    solution: `function bump(v, kind) {
  const p = v.split('.').map(Number);
  if (kind === 'major') {
    return \`\${p[0] + 1}.0.0\`;
  }
  if (kind === 'minor') {
    return \`\${p[0]}.\${p[1] + 1}.0\`;
  }
  return \`\${p[0]}.\${p[1]}.\${p[2] + 1}\`;
}`,
    tests: `test('a patch release', () => {
  expect(bump('0.1.0', 'patch')).toBe('0.1.1');
});
test('minor resets patch', () => {
  expect(bump('0.1.9', 'minor')).toBe('0.2.0');
});
test('major resets minor and patch', () => {
  expect(bump('1.4.2', 'major')).toBe('2.0.0');
});
test('9 + 1 is 10, not 91', () => {
  expect(bump('1.9.0', 'minor')).toBe('1.10.0');
});
test('leaves 0.x alone when patching', () => {
  expect(bump('0.9.9', 'patch')).toBe('0.9.10');
});`,
    hints: [
      '`v.split(\'.\')` gives three strings. Turn them into numbers before adding.',
      'Handle the three kinds separately; each one builds the result from the parts.',
      'Everything to the right of the bumped part becomes 0.',
    ],
    walkthrough: `Semver’s rules, as code.

- **Parse as numbers.** \`v.split('.').map(Number)\` gives \`[1, 9, 0]\`. Without \`Number\`, \`'9' + 1\` is the string \`'91'\`.
- **Major** adds 1 to the first part and resets the other two: \`1.4.2\` becomes \`2.0.0\`.
- **Minor** keeps the major, adds 1 to the minor, and resets the patch: \`0.1.9\` becomes \`0.2.0\`.
- **Patch** only adds 1 to the last part.

Note that nothing special happens in 0.x: bumping is the same arithmetic. What changes in 0.x is what the numbers *promise*, and how caret ranges read them.`,
    wrong: [
      {
        code: `function bump(v, kind) {
  const p = v.split('.');
  if (kind === 'major') {
    return \`\${p[0] + 1}.0.0\`;
  }
  if (kind === 'minor') {
    return \`\${p[0]}.\${p[1] + 1}.0\`;
  }
  return \`\${p[0]}.\${p[1]}.\${p[2] + 1}\`;
}`,
        why: 'The parts are still strings, so `\'9\' + 1` is `\'91\'` and `1.9.0` becomes `1.91.0`. Convert with `Number` first.',
      },
      {
        code: `function bump(v, kind) {
  const p = v.split('.').map(Number);
  if (kind === 'major') p[0]++;
  if (kind === 'minor') p[1]++;
  if (kind === 'patch') p[2]++;
  return p.join('.');
}`,
        why: 'Nothing is reset, so `0.1.9` bumped by minor becomes `0.2.9`. Semver resets the parts to the right of the one you bump.',
      },
    ],
  },
  newer: {
    optional: true,
    title: 'Which version is newer?',
    prompt:
      'Write `newer(a, b)` for plain versions like `\'1.10.0\'` (no pre-release tags). Return `true` if `a` is newer than `b`, otherwise `false`. Compare major, then minor, then patch, as numbers; the first part that differs decides.',
    starter: `function newer(a, b) {
  return a > b;
}`,
    solution: `function newer(a, b) {
  const x = a.split('.').map(Number);
  const y = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (x[i] !== y[i]) {
      return x[i] > y[i];
    }
  }
  return false;
}`,
    tests: `test('minor 10 beats minor 9', () => {
  expect(newer('1.10.0', '1.9.0')).toBe(true);
});
test('major decides first', () => {
  expect(newer('2.0.0', '1.99.99')).toBe(true);
  expect(newer('1.99.99', '2.0.0')).toBe(false);
});
test('equal is not newer', () => {
  expect(newer('1.2.3', '1.2.3')).toBe(false);
});
test('patch decides last', () => {
  expect(newer('0.1.0', '0.1.1')).toBe(false);
  expect(newer('0.1.12', '0.1.2')).toBe(true);
});`,
    hints: [
      'Split both versions and convert the parts to numbers.',
      'Walk the three positions in order. The first position where they differ decides.',
      'If all three are equal, `a` is not newer.',
    ],
    walkthrough: `This is semver precedence for plain versions.

- **Numbers, not strings.** As strings, \`'1.10.0' > '1.9.0'\` is \`false\`, because the character \`'1'\` sorts before \`'9'\`.
- **First difference wins.** Compare major; if equal, minor; if equal, patch. \`2.0.0\` beats \`1.99.99\` at the first part, and the rest never matters.
- **Equal versions** fall out of the loop and return \`false\`.

The full rules also order pre-releases (\`1.0.0-alpha\` comes before \`1.0.0\`) and ignore build metadata after a \`+\`. Libraries such as node-semver implement all of it.`,
    wrong: [
      {
        code: `function newer(a, b) {
  const x = a.split('.');
  const y = b.split('.');
  for (let i = 0; i < 3; i++) {
    if (x[i] !== y[i]) {
      return x[i] > y[i];
    }
  }
  return false;
}`,
        why: 'Comparing the parts as strings still fails: `\'10\' > \'9\'` is `false`. Convert to numbers.',
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
    q: 'A release fixes a bug without changing the public API. The current version is 1.9.3. What is the next?',
    options: [
      { t: '1.9.4', correct: true, why: 'A backward compatible bug fix bumps PATCH.' },
      { t: '1.10.0', why: 'That’s for a backward compatible new feature.' },
      { t: '2.0.0', why: 'That’s for an incompatible API change.' },
      { t: '1.9.3, re-published with the fix', why: 'A released version must never change, and npm forbids reusing a name and version.' },
    ],
  },
  {
    q: 'A project depends on `^0.1.0`. Which release will npm install for it?',
    options: [
      { t: '1.0.0', why: 'Far outside: caret never crosses the left-most non-zero part.' },
      { t: '0.2.0', why: 'In 0.x the minor number is the breaking one, so `^0.1.0` stops below 0.2.0.' },
      { t: '0.1.7', correct: true, why: '`^0.1.0` means at least 0.1.0 and below 0.2.0.' },
      { t: 'Only exactly 0.1.0', why: 'That would be the range `0.1.0` with no caret.' },
    ],
  },
  {
    q: 'A new Viscosity release keeps a collection it used to transform. Output is identical, but the program is slower. What does the chapter conclude?',
    options: [
      { t: 'It must be a major release by semver’s rules', why: 'Semver’s rules are about the declared API. Identical output fits a fix or a feature.' },
      { t: 'It can’t happen, because the differential tests would fail', why: 'Those tests check output and layouts in the corpus, not your program’s speed.' },
      { t: 'Semver says nothing until the project declares whether decisions are part of its public API', correct: true, why: 'The numbers only mean something relative to a declared API; deciding that is part of shipping.' },
      { t: 'It should be a patch, because speed never matters', why: 'For an optimizer, speed is the whole point; that’s why it needs deciding.' },
    ],
  },
];
