// Chapter 10 cards. Keys are stable ids: never rename them.

export const prompts = {
  'str-index': {
    q: 'What is `\'cat 42\'[4]`, and what type is it?',
    a: '`\'4\'`: a one-character string, not the number 4.',
  },
  'str-immutable': {
    q: 'After `let t = \'cat\'; t[0] = \'b\';`, what is `t`, and why?',
    a: '`\'cat\'`. Strings are immutable: you can’t change one in place, only make a new string.',
  },
  'char-code-what': {
    q: 'What does `str.charCodeAt(i)` return?',
    a: 'The number (char code) that stores the character at index `i`, e.g. `\'A\'.charCodeAt(0)` is 65.',
  },
  'digit-range': {
    q: 'The char codes of `\'0\'` to `\'9\'` are 48 to 57. How can a scanner test whether code `c` is a digit?',
    a: '`c >= 48 && c <= 57`.',
  },
  'digit-value': {
    q: 'How do you get the number 7 from the char code of the character `\'7\'`?',
    a: 'Subtract 48, the code of `\'0\'`: `\'7\'.charCodeAt(0) - 48` is 7.',
  },
  'slice-end': {
    q: 'What is `\'scanner\'.slice(1, 4)`?',
    a: '`\'can\'`: indexes 1, 2 and 3. The end index is not included.',
  },
  'split-join': {
    q: 'What do `split` and `join` do?',
    a: '`str.split(sep)` cuts a string into an array of pieces; `arr.join(sep)` glues an array’s pieces back into one string.',
  },
  'methods-new': {
    q: 'You call `s.slice(0, 2)` and ignore the result. Has `s` changed?',
    a: 'No. String methods return new strings; the original is never changed.',
  },
  'template-what': {
    q: 'What is `` `${2 + 3} cats` ``?',
    a: 'The string `\'5 cats\'`: `${...}` is replaced by the value of the expression inside.',
  },
  'plus-equals': {
    q: 'If strings are immutable, how can `out += \'#\'` work?',
    a: 'It makes a new, longer string and points the variable `out` at it. The old string is unchanged.',
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
  toNumber: {
    title: 'Digits into a number',
    prompt: `Write \`toNumber(s)\` that turns a string of digits, like \`'472'\`, into the number \`472\`. **Don't** use \`Number\` or \`parseInt\`: work it out from the char codes, the way a scanner does. You may assume \`s\` contains only the digits \`0\` to \`9\`. The empty string gives \`0\`.`,
    starter: `function toNumber(s) {
  // your code here
}

console.log(toNumber('472'));`,
    solution: `function toNumber(s) {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const d = s.charCodeAt(i) - 48;
    n = n * 10 + d;
  }
  return n;
}`,
    tests: `test('a single digit', () => {
  expect(toNumber('7')).toBe(7);
});
test('two digits', () => {
  expect(toNumber('42')).toBe(42);
});
test('zeros in the middle and end', () => {
  expect(toNumber('1000')).toBe(1000);
  expect(toNumber('305')).toBe(305);
});
test('leading zeros', () => {
  expect(toNumber('007')).toBe(7);
});
test('the empty string is 0', () => {
  expect(toNumber('')).toBe(0);
});
test('returns a number, not a string', () => {
  expect(typeof toNumber('12')).toBe('number');
});`,
    hints: [
      'One digit first: `s.charCodeAt(i) - 48` is the value of the digit at index `i`.',
      'Read left to right. Each new digit shifts everything before it one place left: `472` is `47 * 10 + 2`, and `47` is `4 * 10 + 7`.',
      'Keep a running number `n`, starting at 0. For each digit `d`: `n = n * 10 + d`.',
    ],
    walkthrough: `Think about how you'd read \`472\` out loud if you could only see one digit at a time.

- **See 4.** So far the number is 4.
- **See 7.** Whatever you had is now worth ten times as much (the 4 becomes 40), plus 7: 47.
- **See 2.** Again: \`47 * 10 + 2\` is 472.

That's the whole loop: \`n = n * 10 + d\`, starting from \`n = 0\`. Each digit's value \`d\` comes from its char code: \`charCodeAt(i) - 48\`, because the digits' codes run from 48 (\`'0'\`) to 57 (\`'9'\`).

The edge cases fall out for free. Leading zeros just multiply 0 by 10. The empty string never enters the loop, so it returns the starting value, 0.

The scanner you'll write in Part III turns number tokens into values in exactly this way (with a bit more work for decimal points).`,
    wrong: [
      {
        code: `function toNumber(s) {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    n = n * 10 + s[i];
  }
  return n;
}`,
        why: '`s[i]` is a *string*, so `+` glues instead of adding: `0 * 10 + \'4\'` is the string `\'04\'`. Convert each character to its value with `s.charCodeAt(i) - 48` first.',
      },
      {
        code: `function toNumber(s) {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    n = n + (s.charCodeAt(i) - 48);
  }
  return n;
}`,
        why: 'This adds the digits up, so `\'42\'` gives 6. Each new digit must shift the earlier ones one place left: multiply by 10 before adding.',
      },
      {
        code: `function toNumber(s) {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    n = n * 10 + s.charCodeAt(i);
  }
  return n;
}`,
        why: 'This uses the raw char code, so `\'7\'` gives 55. Subtract 48 (the code of `\'0\'`) to get the digit’s value.',
      },
    ],
  },
  shift: {
    optional: true,
    title: 'A secret code',
    prompt:
      'Write `shift(s, k)` that moves every lowercase letter `k` places along the alphabet, wrapping around from `z` back to `a`. Everything that isn’t a lowercase letter stays as it is. So `shift(\'abc\', 1)` is `\'bcd\'` and `shift(\'xyz\', 3)` is `\'abc\'`. `k` is between 0 and 25.',
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
    walkthrough: `This uses every idea from the chapter at once.

- **Read each character's code** with \`charCodeAt(i)\`.
- **Is it a lowercase letter?** Codes 97 (\`a\`) to 122 (\`z\`) are consecutive, so a range test answers that.
- **Shift with wrap-around.** \`c - 97\` turns the code into a position 0–25. Adding \`k\` might go past 25, and \`% 26\` (the remainder after dividing by 26) brings it back round: \`(23 + 3) % 26\` is 0, which is \`a\`.
- **Back to a character.** \`String.fromCharCode(97 + p)\`. The solution puts these two steps in a small helper, \`rot\`, so the loop stays easy to read.
- **Anything else** is copied unchanged with \`s[i]\`.
- **Build the result** with \`out +=\`, because you can't change \`s\` itself: strings are immutable.

This is the Caesar cipher, one of the oldest secret codes. More usefully for us, "map each character code to a new code" is the same loop a scanner uses, with a different body.`,
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
};

export const quiz = [
  {
    q: 'What is `\'hello\'.length` and what is `\'hello\'[5]`?',
    options: [
      { t: '`5` and `\'o\'`', why: 'Indexes start at 0, so `\'o\'` is at index 4.' },
      { t: '`5` and `undefined`', correct: true, why: 'Five characters at indexes 0 to 4. Index 5 is past the end.' },
      { t: '`4` and `\'o\'`', why: '`length` counts the characters: there are 5.' },
      { t: '`6` and `\'\'`', why: 'There is no hidden extra character, and a missing index gives `undefined`.' },
    ],
  },
  {
    q: '`\'a\'.charCodeAt(0)` is 97. What is `String.fromCharCode(99)`?',
    options: [
      { t: '`\'99\'`', why: '`fromCharCode` makes the character with that code, not the digits of the number.' },
      { t: '`\'b\'`', why: '`\'b\'` is 98, one after 97.' },
      { t: '`\'c\'`', correct: true, why: 'Letters are consecutive: 97 is `a`, 98 `b`, 99 `c`.' },
      { t: '`\'C\'`', why: 'Uppercase letters have different codes (65 to 90).' },
    ],
  },
  {
    q: 'What is `\'let x = 1\'.slice(4, 5)`?',
    options: [
      { t: '`\'x \'`', why: '`slice` stops just before the end index, so only index 4 is included.' },
      { t: '`\'t\'`', why: 'Index 4 is the fifth character: `l e t ␣ x`.' },
      { t: '`\' x\'`', why: 'Index 3 is the space; this slice starts at 4.' },
      { t: '`\'x\'`', correct: true, why: 'Index 4 is `x`, and the end index 5 is not included.' },
    ],
  },
  {
    q: 'What does this print?\n```\nconst s = \'abc\';\ns.toUpperCase();\nconsole.log(s);\n```',
    options: [
      { t: '`abc`', correct: true, why: 'String methods return a new string. The result was thrown away, and `s` never changes.' },
      { t: '`ABC`', why: 'That is what `toUpperCase` *returns*, but nothing stored it.' },
      { t: '`undefined`', why: '`s` still holds `\'abc\'`.' },
      { t: 'An error, because `s` is `const`', why: 'Calling a method on a `const` string is fine. Nothing is reassigned.' },
    ],
  },
  {
    q: 'What is `\'a,b,c\'.split(\',\').join(\' + \')`?',
    options: [
      { t: '`[\'a\', \'b\', \'c\']`', why: '`split` makes that array, but then `join` turns it back into a string.' },
      { t: '`\'a + b + c\'`', correct: true, why: 'Cut at each comma, then glue the pieces with `\' + \'` between them.' },
      { t: '`\'a,b,c\'`', why: 'The separator changed from `,` to `\' + \'`.' },
      { t: '`\'abc\'`', why: '`join` puts its separator between the pieces.' },
    ],
  },
  {
    q: 'A scanner holds `c = src.charCodeAt(i)`. Which test is true exactly when that character is a digit?',
    options: [
      { t: '`c >= 0 && c <= 9`', why: 'Those are the digit *values*. The digit characters’ *codes* are 48 to 57.' },
      { t: '`c === \'0\'`', why: '`c` is a number, and this would only match one digit anyway.' },
      { t: '`c >= 48 && c <= 57`', correct: true, why: '`\'0\'` is 48 and `\'9\'` is 57, and the digits in between are consecutive.' },
      { t: '`c > 48 && c < 57`', why: 'This leaves out `\'0\'` (48) and `\'9\'` (57).' },
    ],
  },
];
