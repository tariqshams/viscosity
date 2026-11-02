// Chapter 20 cards (cutting and building strings).
// Keys are stable ids: never rename them.

export const prompts = {
  'slice-end': {
    q: 'What is `\'scanner\'.slice(1, 4)`?',
    a: '`\'can\'`: indexes 1, 2 and 3. The end index is not included.',
  },
  'slice-length': {
    q: 'How many characters does `s.slice(a, b)` give (for `a` and `b` inside the string, `a` no bigger than `b`)?',
    a: '`b - a`.',
  },
  'split-join': {
    q: 'What do `split` and `join` do?',
    a: '`str.split(sep)` cuts a string into an array of pieces; `arr.join(sep)` glues an array’s pieces back into one string, with `sep` between them.',
  },
  'methods-new': {
    q: 'You call `s.slice(0, 2)` and ignore the result. Has `s` changed?',
    a: 'No. String methods return new strings; the original is never changed.',
  },
  'template-what': {
    q: 'What is `` `${2 + 3} cats` ``?',
    a: 'The string `\'5 cats\'`: `${...}` is replaced by the value of the expression inside.',
  },
  'template-quotes': {
    q: 'What is `\'Hi ${name}\'`, written in ordinary single quotes?',
    a: 'Exactly the characters `Hi ${name}`: only backticks fill in `${...}`.',
  },
  'plus-equals': {
    q: 'If strings are immutable, how can `out += \'#\'` work?',
    a: 'It makes a new, longer string and points the variable `out` at it. The old string is unchanged.',
  },
  'join-build': {
    q: 'Besides `+=`, what is the other common way to build a string from many pieces?',
    a: '`push` the pieces into an array, then call `join` once at the end.',
  },
};

export const examples = {
  'string-tools': {
    title: 'Cutting and gluing',
    code: `const s = 'let x = 42;';

console.log(s.length, s[4]);
console.log(s.charCodeAt(8));
console.log(s.slice(8, 10));
console.log(s.includes('42'));
console.log(s.startsWith('var'));

const words = s.split(' ');
console.log(words);
console.log(words.join('_'));`,
  },
};

export const exercises = {
  shift: {
    title: 'A secret code',
    prompt:
      'Write `shift(s, k)` that **returns a new string** in which every lowercase letter is moved `k` places along the alphabet, wrapping around from `z` back to `a`. Everything that isn’t a lowercase letter stays as it is. So `shift(\'abc\', 1)` is `\'bcd\'` and `shift(\'xyz\', 3)` is `\'abc\'`. `k` is between 0 and 25.',
    starter: `function shift(s, k) {
  // your code here
}

console.log(shift('hal', 1));`,
    solution: `function rot(c, k) {
  const p = (c - 97 + k) % 26;
  return String.fromCharCode(97 + p);
}

function shift(s, k) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c >= 97 && c <= 122) {
      out += rot(c, k);
    } else {
      out += s[i];
    }
  }
  return out;
}`,
    tests: `test('moves letters along', () => {
  expect(shift('abc', 1)).toBe('bcd');
});
test('wraps from z to a', () => {
  expect(shift('xyz', 3)).toBe('abc');
});
test('leaves other characters alone', () => {
  expect(shift('hi there!', 1)).toBe('ij uifsf!');
});
test('a shift of 0 changes nothing', () => {
  expect(shift('same', 0)).toBe('same');
});`,
    hints: [
      'Build the answer piece by piece: start with `out = \'\'` and add one character per loop step.',
      'For a lowercase letter (code 97 to 122), `c - 97` is its place in the alphabet, 0 to 25.',
      'Add `k`, then use `% 26` to wrap past `z`. Turn it back into a letter with `String.fromCharCode(97 + p)` and add it to `out`. A small helper function keeps the loop tidy.',
    ],
    walkthrough: `**How to think about it.** You cannot change \`s\` (strings are immutable), so the answer has to be a brand-new string, built one character at a time: start with \`''\` and, for each character of \`s\`, add either its shifted version or the character itself. That splits the problem in two. The loop and the building are this chapter's pattern; the shifting of one letter is last chapter's char codes. For one letter: \`c - 97\` turns its code into a position in the alphabet, 0 for \`a\` up to 25 for \`z\`; add \`k\`; if that goes past 25, wrap round to the start, which is what \`% 26\` (the remainder after dividing by 26) does; then add 97 back and turn the code into a character.

**The solution, line by line.**

- \`function rot(c, k) {\` is a helper that shifts one lowercase letter, given its code.
- \`  const p = (c - 97 + k) % 26;\` is the new position. For \`x\` (code 120) shifted by 3: \`120 - 97\` is 23, plus 3 is 26, and \`26 % 26\` is 0, which is \`a\`.
- \`  return String.fromCharCode(97 + p);\` turns the position back into a code (97 is \`a\`) and the code into a one-character string.
- \`}\` ends the helper.
- \`function shift(s, k) {\` is the function the tests call.
- \`  let out = '';\` starts the new string empty.
- \`  for (let i = 0; i < s.length; i++) {\` visits each character.
- \`    const c = s.charCodeAt(i);\` reads its code.
- \`    if (c >= 97 && c <= 122) {\` asks whether it is a lowercase letter.
- \`      out += rot(c, k);\` adds the shifted letter.
- \`    } else {\` handles everything else (spaces, punctuation, capitals).
- \`      out += s[i];\` copies the character unchanged.
- \`    }\` and \`  }\` close the \`if\` and the loop.
- \`  return out;\` hands back the new string; \`s\` itself is untouched.

This is the Caesar cipher, one of the oldest secret codes. More usefully for us, "read each character's code and build a new string from it" is the same loop a scanner uses, with a different body.

**Common wrong attempts.**

- Shifting every code, with no range test and no wrap: spaces and \`!\` are shifted too, and \`z\` shifted by 3 becomes \`}\`.
- Writing \`s[i] = rot(c, k)\` to change the string in place: strings are immutable, so nothing changes and the original comes back.`,
    wrong: [
      {
        code: `function shift(s, k) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i) + k;
    out += String.fromCharCode(c);
  }
  return out;
}`,
        why: 'This shifts everything, including spaces and `!`, and never wraps: `z` shifted by 3 becomes `}`. Only shift codes 97–122, and use `% 26` to wrap.',
      },
      {
        code: `function rot(c, k) {
  const p = (c - 97 + k) % 26;
  return String.fromCharCode(97 + p);
}

function shift(s, k) {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c >= 97 && c <= 122) {
      s[i] = rot(c, k);
    }
  }
  return s;
}`,
        why: 'Strings are immutable, so `s[i] = ...` does nothing and the original string comes back unchanged. Build a new string with `out +=` instead.',
      },
    ],
  },
  padLeft: {
    optional: true,
    title: 'Line up a column',
    prompt:
      'Write `padLeft(s, n)` that returns `s` with spaces added **in front** until it is `n` characters long. If `s` is already `n` characters or longer, return it unchanged. For example `padLeft(\'42\', 5)` is `\'   42\'` (three spaces), so numbers of different lengths line up on the right.',
    starter: `function padLeft(s, n) {
  // your code here
}

console.log(padLeft('42', 5));`,
    solution: `function padLeft(s, n) {
  let out = '';
  for (let i = s.length; i < n; i++) {
    out += ' ';
  }
  return out + s;
}`,
    tests: `test('pads to the width', () => {
  expect(padLeft('42', 5)).toBe('   42');
});
test('the result has length n', () => {
  expect(padLeft('7', 4).length).toBe(4);
});
test('already wide enough', () => {
  expect(padLeft('12345', 3)).toBe('12345');
  expect(padLeft('abc', 3)).toBe('abc');
});
test('the empty string', () => {
  expect(padLeft('', 2)).toBe('  ');
});`,
    hints: [
      'How many spaces are needed? Work it out for `\'42\'` and width 5.',
      'You need `n - s.length` spaces (or none, if that is 0 or less). Build them with a loop and `+=`.',
      'Count `i` from `s.length` up to `n`: each pass adds one space. Then return the spaces followed by `s`.',
    ],
    walkthrough: `**How to think about it.** Do one by hand: \`'42'\` is 2 characters and should be 5 wide, so it needs 3 spaces in front, which is \`5 - 2\`. In general it needs \`n - s.length\` spaces, and none at all when \`s\` is already wide enough. So build a string of that many spaces, then glue \`s\` on after it. (Strings have a built-in \`padStart\` that does this, but building it yourself is the point.)

**The solution, line by line.**

- \`function padLeft(s, n) {\` takes the string and the width.
- \`  let out = '';\` will hold the spaces.
- \`  for (let i = s.length; i < n; i++) {\` counts from the string's length up to the width, so it runs \`n - s.length\` times: for \`'42'\` and 5, with \`i\` at 2, 3 and 4. If \`s.length\` is already \`n\` or more, the condition fails at once and the loop never runs.
- \`    out += ' ';\` adds one space per pass.
- \`  }\` ends the loop.
- \`  return out + s;\` puts the spaces *in front* of \`s\` and returns the result.
- \`}\` ends the function.

**Common wrong attempts.**

- \`return s + out;\` puts the spaces after the text, which lines things up on the left rather than the right.
- Looping from \`0\` to \`n\` adds \`n\` spaces whatever the length of \`s\`, so the result is too wide.`,
    wrong: [
      {
        code: `function padLeft(s, n) {
  let out = '';
  for (let i = s.length; i < n; i++) {
    out += ' ';
  }
  return s + out;
}`,
        why: 'The spaces end up after `s`, so `\'42\'` becomes `\'42   \'`. Put them in front: `out + s`.',
      },
      {
        code: `function padLeft(s, n) {
  let out = '';
  for (let i = 0; i < n; i++) {
    out += ' ';
  }
  return out + s;
}`,
        why: 'This always adds `n` spaces, so the result is `n + s.length` wide. Count from `s.length` instead.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What is `\'let x = 1\'.slice(4, 5)`?',
    options: [
      { t: '`\'x \'`', why: '`slice` stops just before the end index, so only index 4 is included.' },
      { t: '`\'x\'`', correct: true, why: 'Index 4 is `x`, and the end index 5 is not included.' },
      { t: '`\'t\'`', why: 'Index 4 is the fifth character: `l e t ␣ x`.' },
      { t: '`\' x\'`', why: 'Index 3 is the space; this slice starts at 4.' },
    ],
  },
  {
    q: 'What does this print?\n```\nconst s = \'abc\';\ns.toUpperCase();\nconsole.log(s);\n```',
    options: [
      { t: '`ABC`', why: 'That is what `toUpperCase` *returns*, but nothing stored it.' },
      { t: '`undefined`', why: '`s` still holds `\'abc\'`.' },
      { t: '`abc`', correct: true, why: 'String methods return a new string. The result was thrown away, and `s` never changes.' },
      { t: 'An error, because `s` is `const`', why: 'Calling a method on a `const` string is fine. Nothing is reassigned.' },
    ],
  },
  {
    q: 'What is `\'a,b,c\'.split(\',\').join(\' + \')`?',
    options: [
      { t: '`[\'a\', \'b\', \'c\']`', why: '`split` makes that array, but then `join` turns it back into a string.' },
      { t: '`\'a,b,c\'`', why: 'The separator changed from `,` to `\' + \'`.' },
      { t: '`\'abc\'`', why: '`join` puts its separator between the pieces.' },
      { t: '`\'a + b + c\'`', correct: true, why: 'Cut at each comma, then glue the pieces with `\' + \'` between them.' },
    ],
  },
  {
    q: 'With `const n = 3;`, what is `` `n is ${n * 2}` ``?',
    options: [
      { t: '`\'n is 6\'`', correct: true, why: 'The expression inside `${...}` is worked out, and its value is dropped into the string.' },
      { t: '`\'n is ${n * 2}\'`', why: 'That is what ordinary quotes would give; backticks fill in the blank.' },
      { t: '`\'n is 3 * 2\'`', why: 'The expression is worked out, not copied as text.' },
      { t: '`\'6 is 6\'`', why: 'Only the part inside `${...}` is replaced; the `n` before it is plain text.' },
    ],
  },
  {
    q: '`let out = \'\'; for (let i = 0; i < 3; i++) { out += i; }` What is `out`?',
    options: [
      { t: '`3`', why: 'Adding a number to a string glues its digits on; nothing is summed.' },
      { t: '`\'012\'`', correct: true, why: '`out` starts as a string, so each `+=` glues: `\'0\'`, then `\'01\'`, then `\'012\'`.' },
      { t: '`\'123\'`', why: 'The loop counts 0, 1, 2.' },
      { t: '`\'\'`', why: 'Each `+=` makes a new, longer string and stores it in `out`.' },
    ],
  },
];
