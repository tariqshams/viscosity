// Chapter 68 cards. Keys are stable ids: never rename them.

export const prompts = {
  'scanner-what': {
    q: 'What does a scanner take in, and what does it produce?',
    a: 'It takes source text (characters) and produces a list of tokens.',
  },
  'start-current': {
    q: 'In Drip’s scanner, what do `start` and `current` point at?',
    a: '`start`: the first character of the token being built. `current`: the next character to read.',
  },
  'advance-moves': {
    q: 'What two things does `advance()` do?',
    a: 'It returns the character at `current`, and moves `current` one place on.',
  },
  'slice-lexeme': {
    q: 'How does `add` get a token’s lexeme?',
    a: '`source.slice(start, current)`: from `start` up to, but not including, `current`.',
  },
  'newline-case': {
    q: 'What does the scanner do when it reads `\'\\n\'`?',
    a: 'It adds 1 to `line` and makes no token.',
  },
  'eof-push': {
    q: 'When does the scanner push the `eof` token?',
    a: 'Once, after the main loop ends because every character has been read.',
  },
  'keep-going': {
    q: 'Drip’s scanner meets a character it does not know, such as `@`. What does it do?',
    a: 'It reports `Unexpected character.` with the line, and carries on scanning, so one run can report every bad character.',
  },
  'one-at-a-time': {
    q: 'How does the scanner of Drip’s VM differ from the tree-walker’s?',
    a: 'It hands out one token at a time, when the compiler asks, instead of building the whole list first.',
  },
};

export const examples = {
  'mini-scan': {
    title: 'A scanner for brackets and semicolons',
    code: `function scan(src) {
  const out = [];
  let line = 1;
  let cur = 0;
  while (cur < src.length) {
    const start = cur;
    const c = src[cur++];
    if (c === ' ') continue;
    if (c === '\\n') {
      line++;
      continue;
    }
    const lex = src.slice(start, cur);
    if ('(){};'.includes(c)) {
      out.push(lex + ' line ' + line);
    } else {
      out.push('error line ' + line);
    }
  }
  out.push('eof line ' + line);
  return out;
}

console.log(scan('( )'));
console.log(scan('{\\n}'));
console.log(scan('{ @ };'));`,
  },
};

const SCAN_OK = `function scan(src) {
  const out = [];
  let cur = 0;
  while (cur < src.length) {
    const start = cur;
    const c = src[cur++];
    if (c === ' ') continue;
    if (isDigit(c)) {
      while (isDigit(src[cur])) cur++;
    }
    out.push(src.slice(start, cur));
  }
  return out;
}`;

const ISDIGIT_OK = `function isDigit(c) {
  return c >= '0' && c <= '9';
}`;

export const exercises = {
  'scan-arith': {
    title: 'A scanner for arithmetic',
    prompt:
      'Write two functions.\n\n1. `isDigit(c)`: true when the one-character string `c` is `\'0\'` to `\'9\'`, false otherwise.\n2. `scan(src)`: returns the lexemes of an arithmetic expression as an array of strings. A number is a run of digits; every other character (`+ - * / ( )`) is a token on its own; spaces are skipped.\n\n`scan(\'1+23*4\')` should return `[\'1\', \'+\', \'23\', \'*\', \'4\']`.',
    starter: `function isDigit(c) {
  // your code here
}

function scan(src) {
  const out = [];
  // your code here
  return out;
}

console.log(scan('1+23*4'));`,
    solution: `${ISDIGIT_OK}

${SCAN_OK}`,
    tests: `test('isDigit: the digits', () => {
  expect(isDigit('0')).toBe(true);
  expect(isDigit('7')).toBe(true);
  expect(isDigit('9')).toBe(true);
});
test('isDigit: not digits', () => {
  expect(isDigit('a')).toBe(false);
  expect(isDigit('/')).toBe(false);
  expect(isDigit(':')).toBe(false);
  expect(isDigit(' ')).toBe(false);
});
test('1+23*4', () => {
  expect(scan('1+23*4'))
    .toEqual(['1', '+', '23', '*', '4']);
});
test('spaces and brackets', () => {
  expect(scan('12 * (3 - 45)')).toEqual(
    ['12', '*', '(', '3', '-', '45', ')']);
});
test('nothing to scan', () => {
  expect(scan('')).toEqual([]);
  expect(scan('   ')).toEqual([]);
});`,
    hints: [
      'Strings compare character by character, so `c >= \'0\' && c <= \'9\'` is true exactly for the ten digit characters.',
      'In `scan`, keep an index `cur`. Each round: remember `start = cur`, read `src[cur++]`, and decide what it begins.',
      'If it was a digit, keep moving `cur` while `src[cur]` is a digit (maximal munch). Then push `src.slice(start, cur)`. If it was a space, push nothing.',
    ],
    walkthrough: `**How to think about it.** Split the job in two. \`isDigit\` is a question about one character, and it has a neat answer because the ten digit characters sit next to each other in character-code order, \`'0'\` to \`'9'\` (from *Strings up close*), so "is \`c\` between \`'0'\` and \`'9'\`?" is exactly "is \`c\` a digit?". \`scan\` is Drip's loop in miniature: each round remembers where a token starts, reads one character, and decides what it begins. A space begins nothing. Any of \`+ - * / ( )\` is a whole token by itself. A digit begins a number, and a number keeps going while the *next* character is also a digit, so \`23\` becomes one token and not two.

**The solution, line by line.**

- \`function isDigit(c) {\` and \`return c >= '0' && c <= '9';\` compare strings with strings, which compares their character codes: true for exactly the ten digits.
- \`function scan(src) {\` and \`const out = [];\` start the list of lexemes.
- \`let cur = 0;\` is the right finger, the next character to read.
- \`while (cur < src.length) {\` runs until every character has been read.
- \`const start = cur;\` puts the left finger where this token begins.
- \`const c = src[cur++];\` reads one character and moves past it.
- \`if (c === ' ') continue;\` skips a space: \`continue\` jumps to the next round without pushing anything.
- \`if (isDigit(c)) {\` handles a number...
- \`while (isDigit(src[cur])) cur++;\` ...by moving the right finger over every further digit. At the end of the string \`src[cur]\` is \`undefined\`, and \`undefined >= '0'\` is false, so the loop stops safely.
- \`}\` ends the number case; every other character is one long, which \`cur\` already covers.
- \`out.push(src.slice(start, cur));\` cuts out everything between the fingers.
- \`}\` ends the loop and \`return out;\` hands back the list.

For \`'1+23*4'\`: round one cuts \`1\`; round two \`+\`; round three reads \`2\`, sees \`3\` and takes it, and cuts \`23\`; then \`*\` and \`4\`. That is the same \`start\`/\`current\` dance as \`scanner.ts\`, without the token types.

**Common wrong attempts.**

- \`return c >= 0 && c <= 9;\` compares with the *numbers* 0 and 9, so JavaScript converts \`c\` to a number first, and a space converts to \`0\`: a space would count as a digit.
- Pushing every non-space character on its own: \`23\` comes out as \`'2'\`, \`'3'\`, because nothing makes a number take the rest of its digits.
- Using \`if\` instead of \`while\` for the digits: \`23\` works, but \`123\` comes out as \`12\` and \`3\`.`,
    wrong: [
      {
        code: `function isDigit(c) {
  return c >= 0 && c <= 9;
}

${SCAN_OK}`,
        why: 'Comparing with the *numbers* 0 and 9 converts `c` to a number first, and JavaScript converts `\' \'` to 0. So a space counts as a digit. Compare with the strings `\'0\'` and `\'9\'`.',
      },
      {
        code: `${ISDIGIT_OK}

function scan(src) {
  const out = [];
  for (const c of src) {
    if (c !== ' ') out.push(c);
  }
  return out;
}`,
        why: 'Every character becomes its own token, so `23` comes out as `\'2\'`, `\'3\'`. A number must munch every digit in the run.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'The scanner is building a token for `12` in `x = 12;`. When `add` is called, `start` is 4. What is `current`?',
    options: [
      { t: '4', why: 'Then `slice(4, 4)` would be the empty string.' },
      { t: '5', why: '`slice(4, 5)` would be just `1`. The digit loop moved past the `2` too.' },
      { t: '7', why: 'That would include the `;` at index 6.' },
      { t: '6', correct: true, why: '`slice(4, 6)` is `12`: the end index is not included, and index 6 holds the `;`.' },
    ],
  },
  {
    q: 'The source is `(`, then two newlines, then `)`. On which line is the `)` token recorded?',
    options: [
      { t: '1', why: 'Each newline the scanner passes adds 1 to `line`.' },
      { t: '3', correct: true, why: 'Two newlines are passed before the `)`, so `line` has gone from 1 to 3.' },
      { t: '2', why: 'There are two newlines, not one, before the `)`.' },
      { t: 'It has no line: only the first token gets one', why: 'Every token records the line it came from.' },
    ],
  },
  {
    q: 'What happens when Drip scans `print 1 @ 2;`?',
    options: [
      { t: 'The scanner reports `Unexpected character.` and carries on, then the parser also complains, and nothing runs', correct: true, why: 'The `@` is reported and dropped, which leaves `print 1 2;`, a syntax error too; the pipeline stops before the interpreter.' },
      { t: 'The scanner stops at the `@`, and the program prints `1`', why: 'Nothing runs once any error has been reported, and the scanner does not stop.' },
      { t: 'The `@` becomes an `identifier` token', why: 'An identifier must start with a letter or `_`.' },
      { t: 'It prints `1 @ 2`', why: 'There is no string here; `@` is not a Drip character at all.' },
    ],
  },
  {
    q: 'In `const c = advance();`, what has changed after the call?',
    options: [
      { t: 'Nothing: `advance` only looks', why: 'That is `peek`. `advance` moves on.' },
      { t: '`start` has moved on by one', why: '`start` only moves at the beginning of each round, with `start = current`.' },
      { t: '`c` holds the character that was at `current`, and `current` is one bigger', correct: true, why: '`source[current++]` reads with the old value, then adds one.' },
      { t: 'A token has been added', why: 'Only `add` pushes tokens; `advance` reads one character.' },
    ],
  },
  {
    q: 'Why does the whitespace case in the `switch` contain nothing but `break`?',
    options: [
      { t: 'Because whitespace is an error', why: 'Spaces are fine; they separate tokens.' },
      { t: 'Because spaces are added to the next token’s lexeme', why: 'The next round sets `start = current` first, so the space is outside every lexeme.' },
      { t: 'Because the scanner has not been finished yet', why: 'It is deliberate, and it is the whole of the space case in the real scanner.' },
      { t: 'Because whitespace only separates tokens and never becomes one', correct: true, why: 'Reading it is enough: the next round starts a fresh token after it.' },
    ],
  },
];
