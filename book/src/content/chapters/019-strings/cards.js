// Chapter 19 cards. Keys are stable ids: never rename them.

export const prompts = {
  'str-index': {
    q: 'What is `\'cat 42\'[4]`, and what type is it?',
    a: '`\'4\'`: a one-character string, not the number 4.',
  },
  'last-char': {
    q: 'How do you read the last character of a string `s`, whatever its length?',
    a: '`s[s.length - 1]`, the same habit as for arrays.',
  },
  'str-immutable': {
    q: 'After `let t = \'cat\'; t[0] = \'b\';`, what is `t`, and why?',
    a: '`\'cat\'`. Strings are immutable: you cannot change one in place, only make a new string.',
  },
  'char-code-what': {
    q: 'What does `str.charCodeAt(i)` return?',
    a: 'The number (char code) that stores the character at index `i`; for example `\'A\'.charCodeAt(0)` is 65.',
  },
  'from-char-code': {
    q: 'What does `String.fromCharCode(97)` give?',
    a: '`\'a\'`: the character whose code is 97.',
  },
  'digit-range': {
    q: 'The char codes of `\'0\'` to `\'9\'` are 48 to 57. How can a scanner test whether code `c` is a digit?',
    a: '`c >= 48 && c <= 57`.',
  },
  'digit-value': {
    q: 'How do you get the number 7 from the char code of the character `\'7\'`?',
    a: 'Subtract 48, the code of `\'0\'`: `\'7\'.charCodeAt(0) - 48` is 7.',
  },
  'char-plus': {
    q: 'Why is `\'7\' + 1` the string `\'71\'` rather than 8?',
    a: '`\'7\'` is a string, and `+` with a string on one side glues instead of adding.',
  },
};

export const examples = {
  'char-codes': {
    title: 'Characters and their codes',
    code: `const s = 'x = 42;';
console.log(s.length, s[4]);

for (let i = 0; i < s.length; i++) {
  console.log(i, s[i], s.charCodeAt(i));
}

const hi = String.fromCharCode(72, 105);
console.log(hi);
console.log('7'.charCodeAt(0) - 48);`,
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
      'Start with one digit: how do you turn the character `\'7\'` into the number 7? (The chapter showed a subtraction.)',
      '`s.charCodeAt(i) - 48` is the value of the digit at index `i`.',
      'Read left to right. Each new digit shifts everything before it one place left: `472` is `47 * 10 + 2`, and `47` is `4 * 10 + 7`.',
      'Keep a running number `n`, starting at 0. For each digit `d`: `n = n * 10 + d`.',
    ],
    walkthrough: `**How to think about it.** Think about how you would read \`472\` aloud if you could see only one digit at a time. You see 4: so far the number is 4. You see 7: whatever you had is now worth ten times as much (the 4 becomes 40), plus 7, so 47. You see 2: again, \`47 * 10 + 2\`, which is 472. So one rule, repeated for each digit, builds the whole number: multiply what you have by 10, then add the new digit. The only other thing you need is each digit's value, and the chapter gave you that: its char code minus 48.

**The solution, line by line.**

- \`function toNumber(s) {\` takes the string of digits.
- \`  let n = 0;\` is the number built so far: before reading anything, 0. It is \`let\` because it changes on every pass.
- \`  for (let i = 0; i < s.length; i++) {\` visits each character from left to right.
- \`    const d = s.charCodeAt(i) - 48;\` turns the character at index \`i\` into its value: \`'4'\` has code 52, and \`52 - 48\` is 4.
- \`    n = n * 10 + d;\` shifts the digits read so far one place left and adds the new one: 0 becomes 4, 4 becomes 47, 47 becomes 472.
- \`  }\` ends the loop.
- \`  return n;\` hands back the number.
- \`}\` ends the function.

The edge cases fall out for free. Leading zeros multiply 0 by 10, which is still 0, so \`'007'\` is 7. The empty string never enters the loop, so it returns the starting value, 0. The scanner you will write in Part III turns number tokens into values in exactly this way (with a bit more work for decimal points).

**Common wrong attempts.**

- Using \`s[i]\` instead of the code: \`s[i]\` is a *string*, so \`+\` glues rather than adds, and \`0 * 10 + '4'\` is the string \`'04'\`.
- Adding the digits without multiplying: \`'42'\` gives \`4 + 2\`, which is 6.
- Using the raw code without subtracting 48: \`'7'\` gives 55.`,
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
  countLetters: {
    optional: true,
    title: 'Count the letters',
    prompt:
      'Write `countLetters(s)` that returns how many characters of `s` are letters, capital (`A` to `Z`, codes 65 to 90) or small (`a` to `z`, codes 97 to 122). Digits, spaces and symbols do not count. For example `countLetters(\'x = 42;\')` is `1`.',
    starter: `function countLetters(s) {
  // your code here
}

console.log(countLetters('Hi, Ada!'));`,
    solution: `function isLetter(c) {
  const big = c >= 65 && c <= 90;
  const small = c >= 97 && c <= 122;
  return big || small;
}

function countLetters(s) {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    if (isLetter(s.charCodeAt(i))) {
      n = n + 1;
    }
  }
  return n;
}`,
    tests: `test('only letters count', () => {
  expect(countLetters('x = 42;')).toBe(1);
});
test('capitals and small letters', () => {
  expect(countLetters('Hi, Ada!')).toBe(5);
});
test('no letters at all', () => {
  expect(countLetters('123 + 4')).toBe(0);
  expect(countLetters('')).toBe(0);
});
test('the edges of the ranges', () => {
  expect(countLetters('AZaz')).toBe(4);
  expect(countLetters('@[\`{')).toBe(0);
});`,
    hints: [
      'Visit every character with a loop, and keep a running count.',
      'For each index, get the code with `s.charCodeAt(i)`. A letter is in one of two ranges.',
      'Test `(c >= 65 && c <= 90) || (c >= 97 && c <= 122)`; `||` means "or". A small helper `isLetter(c)` keeps the loop readable.',
    ],
    walkthrough: `**How to think about it.** Counting things in a string is the same shape as counting things in an array: a counter that starts at 0, a loop over every index, and a test that decides whether to add one. The only new part is the test, and the chapter's house-number picture gives it: capital letters live at 65 to 90 and small letters at 97 to 122, so a character is a letter when its code is in either stretch.

**The solution, line by line.**

- \`function isLetter(c) {\` is a small helper that takes a char code.
- \`  const big = c >= 65 && c <= 90;\` is \`true\` for \`A\` to \`Z\`.
- \`  const small = c >= 97 && c <= 122;\` is \`true\` for \`a\` to \`z\`.
- \`  return big || small;\` is \`true\` if either is (\`||\` reads "or").
- \`}\` ends the helper.
- \`function countLetters(s) {\` takes the string.
- \`  let n = 0;\` is the count so far.
- \`  for (let i = 0; i < s.length; i++) {\` visits each index.
- \`    if (isLetter(s.charCodeAt(i))) {\` reads the code at \`i\` and asks the helper about it.
- \`      n = n + 1;\` counts a letter.
- \`    }\` and \`  }\` close the \`if\` and the loop, and \`  return n;\` hands back the count.

The last test checks the characters just outside each range: \`@\` is 64, just before \`A\`; \`[\` is 91, just after \`Z\`; the backtick is 96 and \`{\` is 123. Off-by-one mistakes in ranges show up exactly there.

**Common wrong attempts.**

- One big range, \`c >= 65 && c <= 122\`, also counts the six symbols that sit between \`Z\` and \`a\` (such as \`[\` and the backtick).
- \`<\` instead of \`<=\` leaves out \`Z\` and \`z\`, the last letter of each range.`,
    wrong: [
      {
        code: `function countLetters(s) {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c >= 65 && c <= 122) {
      n = n + 1;
    }
  }
  return n;
}`,
        why: 'One big range also counts the symbols between `Z` (90) and `a` (97), such as `[` and the backtick.',
      },
      {
        code: `function countLetters(s) {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    const big = c >= 65 && c < 90;
    const small = c >= 97 && c < 122;
    if (big || small) {
      n = n + 1;
    }
  }
  return n;
}`,
        why: '`< 90` and `< 122` leave out `Z` and `z`. The ends of the ranges are letters too: use `<=`.',
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
      { t: '`\'C\'`', why: 'Capital letters have different codes (65 to 90).' },
      { t: '`\'c\'`', correct: true, why: 'Letters are consecutive: 97 is `a`, 98 `b`, 99 `c`.' },
    ],
  },
  {
    q: 'A scanner holds `c = src.charCodeAt(i)`. Which test is true exactly when that character is a digit?',
    options: [
      { t: '`c >= 0 && c <= 9`', why: 'Those are the digit *values*. The digit characters’ *codes* are 48 to 57.' },
      { t: '`c >= 48 && c <= 57`', correct: true, why: '`\'0\'` is 48 and `\'9\'` is 57, and the digits in between are consecutive.' },
      { t: '`c === \'0\'`', why: '`c` is a number, and this would only match one digit anyway.' },
      { t: '`c > 48 && c < 57`', why: 'This leaves out `\'0\'` (48) and `\'9\'` (57).' },
    ],
  },
  {
    q: 'What does this print?\n```\nlet t = \'dog\';\nt[0] = \'f\';\nconsole.log(t);\n```',
    options: [
      { t: '`dog`', correct: true, why: 'Strings are immutable, so writing to `t[0]` changes nothing (or, in strict mode, throws a TypeError).' },
      { t: '`fog`', why: 'That would need a new string: `t = \'fog\'`.' },
      { t: '`f`', why: '`t` still holds the whole string.' },
      { t: '`undefined`', why: '`t` still holds `\'dog\'`.' },
    ],
  },
  {
    q: 'What is `\'4\' + 2`, and what is `\'4\'.charCodeAt(0) - 48 + 2`?',
    options: [
      { t: '`6` and `6`', why: 'The first glues, because `\'4\'` is a string.' },
      { t: '`\'42\'` and `\'42\'`', why: 'The second works on numbers: the code of `\'4\'` is 52, and `52 - 48 + 2` is 6.' },
      { t: '`\'42\'` and `6`', correct: true, why: '`+` with a string glues; turning the character into its value first gives real arithmetic.' },
      { t: '`6` and `54`', why: 'The first is a string, `\'42\'`; the second subtracts 48 first.' },
    ],
  },
];
