// Chapter 57 cards. Keys are stable ids: never rename them.

export const prompts = {
  'scanner-what': {
    q: 'What does a scanner take in, and what does it produce?',
    a: 'It takes source text (characters) and produces a list of tokens.',
  },
  'start-current': {
    q: 'In Drip’s scanner, what do `start` and `current` point at?',
    a: '`start`: the first character of the token being built. `current`: the next character to read.',
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
  'peek-vs-advance': {
    q: 'What is the difference between `peek()` and `advance()`?',
    a: '`advance` returns the next character and moves `current` past it. `peek` returns it without moving.',
  },
  'match-what': {
    q: 'What does `match(\'=\')` do?',
    a: 'If the next character is `=`, it consumes it and returns true. Otherwise it changes nothing and returns false.',
  },
  'comment-peek': {
    q: 'Why does the comment loop stop with `peek() !== \'\\n\'` instead of consuming the newline?',
    a: 'So the newline is left for the `\'\\n\'` case, which adds 1 to `line`.',
  },
  'munch-what': {
    q: 'What is maximal munch?',
    a: 'Always taking the longest run of characters that forms a valid token.',
  },
  'orchid': {
    q: 'Why is `orchid` one identifier and not the keyword `or` plus `chid`?',
    a: 'Maximal munch: the scanner takes the whole run of letters, then checks whether that word is a keyword.',
  },
};

export const examples = {
  'pocket-scanner': {
    title: 'A pocket scanner with lookahead',
    code: `function scan(src) {
  const out = [];
  let start = 0;
  let cur = 0;
  const peek = () => src[cur] ?? '\\0';
  const match = (c) => {
    if (peek() !== c) return false;
    cur++;
    return true;
  };
  const isD = c => c >= '0' && c <= '9';
  while (cur < src.length) {
    start = cur;
    const c = src[cur++];
    if (c === ' ') continue;
    if ('<>=!'.includes(c)) match('=');
    else if (isD(c)) {
      while (isD(peek())) cur++;
    }
    out.push(src.slice(start, cur));
  }
  return out;
}

console.log(scan('!==='));
console.log(scan('n <= 12'));
console.log(scan('3 >= 30 != 4'));`,
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
    walkthrough: `**isDigit.** The ten digit characters sit next to each other in character-code order, \`'0'\` to \`'9'\` (chapter 19), so a range check does it: \`c >= '0' && c <= '9'\`. Compare with strings, not numbers (see the wrong attempts).

**scan** is Drip's loop in miniature:

- **One token per round.** \`const start = cur;\` marks the beginning, and \`src[cur++]\` reads one character and moves on.
- **Skip spaces.** \`continue\` jumps to the next round without pushing anything.
- **Numbers munch.** After a first digit, \`while (isDigit(src[cur])) cur++;\` eats the rest of the digits. When \`cur\` reaches the end, \`src[cur]\` is \`undefined\`, and \`undefined >= '0'\` is false, so the loop stops safely.
- **Everything else** is one character long, which \`cur\` already covers.
- **Cut out the lexeme** with \`src.slice(start, cur)\`.

That's the same \`start\`/\`current\` dance as \`scanner.ts\`, without the token types.`,
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
  'scan-ops': {
    optional: true,
    title: 'Maximal munch for comparisons',
    prompt:
      'Write `scanOps(src)`. The source contains only the characters `<`, `>`, `=`, `!` and spaces. Return the operator tokens, using maximal munch: `<=`, `>=`, `==` and `!=` are single tokens, and spaces are skipped.\n\n`scanOps(\'<=<\')` is `[\'<=\', \'<\']` and `scanOps(\'!===\')` is `[\'!=\', \'==\']`.',
    starter: `function scanOps(src) {
  const out = [];
  // your code here
  return out;
}

console.log(scanOps('!==='));`,
    solution: `function scanOps(src) {
  const out = [];
  let cur = 0;
  while (cur < src.length) {
    const start = cur;
    const c = src[cur++];
    if (c === ' ') continue;
    if (src[cur] === '=') cur++;
    out.push(src.slice(start, cur));
  }
  return out;
}`,
    tests: `test('<=<', () => {
  expect(scanOps('<=<')).toEqual(['<=', '<']);
});
test('!===', () => {
  expect(scanOps('!===')).toEqual(['!=', '==']);
});
test('====', () => {
  expect(scanOps('====')).toEqual(['==', '==']);
});
test('>>=', () => {
  expect(scanOps('>>=')).toEqual(['>', '>=']);
});
test('a space splits tokens', () => {
  expect(scanOps('= =')).toEqual(['=', '=']);
});`,
    hints: [
      'Use the same loop as the core exercise: `start = cur`, then read `src[cur++]`.',
      'Each of these four characters can be followed by `=` to make a longer token. Look at `src[cur]` before you finish the token.',
      'Take at most one extra `=`. `!==` is `!=` followed by `=`: there is no three-character token.',
    ],
    walkthrough: `This is \`match('=')\` from Drip's scanner, written out by hand.

- Read one character into \`c\`, and skip it if it is a space.
- **Look ahead one character.** If \`src[cur]\` is \`=\`, the longer token fits, so take it: \`cur++\`. That's maximal munch.
- Cut out \`src.slice(start, cur)\`: either one character or two.

Why does \`!===\` give \`!=\` then \`==\`? The first round takes \`!\`, sees \`=\`, and takes it too: \`!=\`. The next round starts at the third character, \`=\`, sees another \`=\`, and takes it: \`==\`.

“Longest” always means longest *valid* token. Since no Drip token is three characters long, a scanner must stop after one \`=\`.`,
    wrong: [
      {
        code: `function scanOps(src) {
  const out = [];
  for (const c of src) {
    if (c !== ' ') out.push(c);
  }
  return out;
}`,
        why: 'No lookahead at all: `<=` comes out as `\'<\'`, `\'=\'`. Maximal munch requires checking the next character.',
      },
      {
        code: `function scanOps(src) {
  const out = [];
  let cur = 0;
  while (cur < src.length) {
    const start = cur;
    const c = src[cur++];
    if (c === ' ') continue;
    while (src[cur] === '=') cur++;
    out.push(src.slice(start, cur));
  }
  return out;
}`,
        why: 'This munches *every* following `=`, so `!===` becomes the single string `\'!===\'`, which isn’t a token. Take at most one.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'How many tokens (not counting `eof`) does Drip’s scanner make for `a <= b`?',
    options: [
      { t: '4: `a`, `<`, `=`, `b`', why: 'After `<`, `match(\'=\')` sees the `=` and takes it, so the two characters become one token.' },
      { t: '3: `a`, `<=`, `b`', correct: true, why: 'Maximal munch: `<=` is one token. Spaces make none.' },
      { t: '5, counting the spaces', why: 'The space case makes no token.' },
      { t: '6, one per character', why: 'Tokens are words, not characters.' },
    ],
  },
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
    q: 'Why does the comment loop test `peek() !== \'\\n\'` rather than advancing past the newline?',
    options: [
      { t: 'So the newline is handled by the `\'\\n\'` case, which counts the line', correct: true, why: 'If the comment swallowed the newline, `line` would not go up, and every later error would report the wrong line.' },
      { t: 'Because `advance` can’t read a newline', why: '`advance` can read any character. The choice is about who handles the newline.' },
      { t: 'To make the comment a token', why: 'Comments never become tokens.' },
      { t: 'It makes no difference', why: 'It does: the line count would drift by one per comment.' },
    ],
  },
  {
    q: 'In JavaScript, `let a = 1, b = 2;` then `a+++b` evaluates to what?',
    options: [
      { t: 'A syntax error', why: 'It is valid: maximal munch reads `++` first, giving `a++ + b`.' },
      { t: '`4`, because it means `a + ++b`', why: 'That would need the scanner to take a shorter `+` first. It always takes the longest token, `++`.' },
      { t: '`3`, because it means `a++ + b`', correct: true, why: 'The scanner takes `++`, then `+`. `a++` gives 1 (and makes `a` 2), and 1 + 2 is 3.' },
      { t: '`NaN`', why: 'All the values involved are numbers.' },
    ],
  },
  {
    q: 'What does Drip’s `peek()` return when `current` has reached the end of the source?',
    options: [
      { t: '`undefined`', why: 'That’s what `source[current]` would give, but `peek` checks `atEnd()` first.' },
      { t: 'The last character again', why: 'It never goes backwards.' },
      { t: 'It throws an error', why: 'Reaching the end is normal. Loops simply stop there.' },
      { t: '`\'\\0\'`', correct: true, why: 'A stand-in character that no check matches, so loops like “while the next is a digit” stop cleanly.' },
    ],
  },
  {
    q: 'What is the difference between `match(\'=\')` and `peek() === \'=\'`?',
    options: [
      { t: 'None: both just look', why: '`match` also moves `current` forward when it succeeds.' },
      { t: '`match` consumes the `=` when it is there; `peek` never consumes anything', correct: true, why: 'That’s why `<` can use `match`: if the `=` is there, it becomes part of the same token.' },
      { t: '`peek` consumes; `match` only looks', why: 'It’s the other way round.' },
      { t: '`match` reads two characters ahead', why: 'That’s `peekNext`. `match` looks at exactly one character.' },
    ],
  },
];
