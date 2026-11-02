// Chapter 293 cards. Keys are stable ids: never rename them.

export const prompts = {
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
  'sv-immutable': {
    q: 'Can a published npm version be changed or reused after a mistake?',
    a: 'No. A name and version, once published, can never be used again, even after unpublishing: a fix needs a new version.',
  },
  'sv-prerelease': {
    q: 'Which comes first in version order, `1.0.0-beta.1` or `1.0.0`?',
    a: '`1.0.0-beta.1`: a pre-release sorts before the release it leads up to.',
  },
  'sv-cargo': {
    q: 'Why did Viscosity start at 0.0.1 rather than 0.1.0 or 1.0.0?',
    a: 'Under the caret rule (npm’s and Cargo’s), 0.0.1 is compatible with no other version, so no dependent picks up a newer release without asking.',
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
    walkthrough: `**How to think about it.** Semver's rule is short: add 1 to the part you were asked to bump, and reset every part to its right to 0. Try the tricky test by hand first: \`bump('1.9.0', 'minor')\` must be \`'1.10.0'\`, which only happens if the parts are treated as numbers, because the string \`'9'\` plus 1 is \`'91'\`. So the plan is: split the version at the dots, turn each piece into a number, then build the answer for each of the three kinds.

**The solution, line by line.**

- \`function bump(v, kind) {\` takes the version string and which part to bump.
- \`  const p = v.split('.').map(Number);\` splits \`'1.9.0'\` into \`['1', '9', '0']\` and turns each piece into a number, giving \`[1, 9, 0]\`.
- \`  if (kind === 'major') {\` handles a breaking change;
- \`    return \\\`\${p[0] + 1}.0.0\\\`;\` adds 1 to the major part and resets the other two, so \`1.4.2\` becomes \`2.0.0\`.
- \`  if (kind === 'minor') {\` handles a new feature;
- \`    return \\\`\${p[0]}.\${p[1] + 1}.0\\\`;\` keeps the major, adds 1 to the minor and resets the patch, so \`0.1.9\` becomes \`0.2.0\` and \`1.9.0\` becomes \`1.10.0\`.
- \`  return \\\`\${p[0]}.\${p[1]}.\${p[2] + 1}\\\`;\` is the only case left, a patch: only the last part changes, so \`0.9.9\` becomes \`0.9.10\`.

Notice that nothing special happens in 0.x: bumping is the same arithmetic. What changes in 0.x is what the numbers *promise*, and how caret ranges read them.

**Common wrong attempts.**

- Forgetting \`.map(Number)\`: the parts stay strings, \`'9' + 1\` is \`'91'\`, and \`1.9.0\` becomes \`1.91.0\`.
- Incrementing the part but not resetting the others (\`p[1]++\` then \`p.join('.')\`): \`0.1.9\` bumped by minor becomes \`0.2.9\`, which claims a patch that was never released.`,
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
    walkthrough: `**How to think about it.** Versions are ordered like words in a dictionary, except that each "letter" is a whole number: compare the majors; only if they are equal compare the minors; only if those are equal compare the patches. The first part that differs decides, and nothing after it matters (\`2.0.0\` beats \`1.99.99\` at the very first part). The trap is the same as in the chapter's runnable example: compared as strings, \`'10'\` comes before \`'9'\`, so the parts must become numbers first.

**The solution, line by line.**

- \`function newer(a, b) {\` takes two plain versions.
- \`  const x = a.split('.').map(Number);\` and \`  const y = b.split('.').map(Number);\` turn both into three numbers.
- \`  for (let i = 0; i < 3; i++) {\` walks major, minor, patch, in that order.
- \`    if (x[i] !== y[i]) {\` finds the first part that differs;
- \`      return x[i] > y[i];\` and lets it decide: \`a\` is newer exactly when its part is bigger.
- \`  return false;\` is reached only when all three parts are equal, and an equal version is not newer.

**Common wrong attempts.**

- Comparing the whole strings (\`a > b\`): \`'1.10.0' > '1.9.0'\` is \`false\`, because the character \`'1'\` sorts before \`'9'\`.
- Splitting but comparing the parts as strings: still \`'10' > '9'\` is \`false\`. Convert to numbers.
- Comparing all three parts with \`&&\` (every part at least as big): \`2.0.0\` against \`1.99.99\` fails, although the major alone decides. The full rules also order pre-releases (\`1.0.0-alpha\` comes before \`1.0.0\`), which libraries such as node-semver implement.`,
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
      { t: 'It should be a patch, because speed never matters', why: 'For an optimiser, speed is the whole point; that’s why it needs deciding.' },
    ],
  },
  {
    q: 'Version 1.9.4 gains a new option, and nothing old changes. What is the next version?',
    options: [
      { t: '`1.9.5`', why: 'A patch is for fixes; a new feature bumps the minor.' },
      { t: '`1.10.0`', correct: true, why: 'Minor + 1 (9 + 1 = 10, as a number) and the patch resets to 0.' },
      { t: '`1.91.0`', why: 'That is `\'9\' + 1` as strings. The parts are numbers.' },
      { t: '`2.0.0`', why: 'Nothing broke, so the major stays.' },
    ],
  },
  {
    q: 'A project depends on `"@viscosity/cli": "^0.0.1"`, and 0.0.2 is released. What does `npm install` give it?',
    options: [
      { t: '0.0.2, because a caret allows newer patches', why: 'That is true only from 1.0.0 on. In 0.0.x the caret accepts the exact version and nothing else.' },
      { t: '0.0.1', correct: true, why: '`^0.0.1` means at least 0.0.1 and below 0.0.2.' },
      { t: 'An error: the range is invalid', why: 'It is a valid range; it just matches only one version.' },
    ],
  },
];
