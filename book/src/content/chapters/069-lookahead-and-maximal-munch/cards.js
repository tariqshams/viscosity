// Lookahead and maximal munch (split from chapter 68). Keys are stable ids.

export const prompts = {
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
  'peek-end': {
    q: 'What does Drip’s `peek()` return at the end of the source, and why?',
    a: '`\'\\0\'`, a stand-in character that no check matches, so loops like “while the next is a digit” stop cleanly instead of meeting `undefined`.',
  },
  'bang-eq': {
    q: 'How does Drip’s scanner cut `!===`?',
    a: 'Into `!=` and then `==`: the longest valid token each time.',
  },
  'a-plus': {
    q: 'In JavaScript, how is `a+++b` cut into tokens?',
    a: '`a`, `++`, `+`, `b`: maximal munch takes `++` first, so it means `a++ + b`.',
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

export const exercises = {
  'scan-ops': {
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
    walkthrough: `**How to think about it.** Each of the four characters \`<\`, \`>\`, \`=\` and \`!\` can be a token on its own, and each can also be followed by \`=\` to make a two-character token. So every round has the same shape as the scanner's main loop: remember where the token starts, read one character, skip it if it is a space, and then *glance* at the next character. If the glance finds \`=\`, take it too, because maximal munch says the longer token wins; if it finds anything else, leave it alone for the next round. Do \`!===\` by hand: \`!\` sees \`=\`, so \`!=\`; the next round starts on the third character, \`=\`, sees \`=\`, so \`==\`.

**The solution, line by line.**

- \`const out = [];\` collects the tokens, and \`let cur = 0;\` is the next character to read.
- \`while (cur < src.length) {\` runs until the source is used up.
- \`const start = cur;\` marks where this token begins.
- \`const c = src[cur++];\` reads one character and moves past it (this is \`advance\`).
- \`if (c === ' ') continue;\` skips a space without making a token.
- \`if (src[cur] === '=') cur++;\` is \`match('=')\` written out: look at the next character, and only if it is \`=\`, step past it so that it joins this token. At the end of the string \`src[cur]\` is \`undefined\`, which is not \`'='\`, so this is safe.
- \`out.push(src.slice(start, cur));\` cuts out one or two characters, whichever the pointers now surround.
- After the loop, \`return out;\`.

"Longest" always means longest *valid* token. No Drip token is three characters long, so the code takes at most one extra \`=\`; that is why \`!==\` is \`!=\` followed by \`=\`, and \`====\` is \`==\` twice.

**Common wrong attempts.**

- Pushing every non-space character on its own: there is no lookahead, so \`<=\` comes out as \`'<'\`, \`'='\`.
- \`while (src[cur] === '=') cur++;\`: this munches *every* following \`=\`, so \`!===\` becomes the single string \`'!==='\`, which is not a token at all. Maximal munch is the longest *valid* token, not the longest run of characters.
- Looking at \`src[cur + 1]\` instead of \`src[cur]\`: after \`src[cur++]\`, \`cur\` already points at the next character, so this looks one too far.`,
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
