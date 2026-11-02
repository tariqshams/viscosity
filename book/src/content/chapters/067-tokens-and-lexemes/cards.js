// Chapter 67 cards. Keys are stable ids: never rename them.

export const prompts = {
  'token-what': {
    q: 'What is a token?',
    a: 'One meaningful word of source code: a type, its lexeme, maybe a literal value, and where it came from.',
  },
  'lexeme-literal': {
    q: 'For the Drip source `"fast"`, what is the token’s lexeme, and what is its literal?',
    a: 'Lexeme: `"fast"`, quotes included (6 characters). Literal: the text `fast`.',
  },
  'not-tokens': {
    q: 'Name two things in source code that never become tokens.',
    a: 'Whitespace (spaces, tabs, newlines) and comments.',
  },
  'eof-why': {
    q: 'Why does the scanner end every token list with an `eof` token?',
    a: 'So the parser can always ask for the next token and get a clear “the program has ended”.',
  },
  'why-types': {
    q: 'Why does a token need a type when its lexeme already says what it is?',
    a: 'The parser’s rules are about categories (“any name”, “any number”), and many lexemes share one type.',
  },
  'punct-type': {
    q: 'In Drip’s `TokenType`, what is the type of the token for `<=`?',
    a: 'The string `\'<=\'` itself: for punctuation and keywords, the type is the spelling.',
  },
  'location-what': {
    q: 'What source location does a Drip token record?',
    a: 'Its line number (not its column).',
  },
  'front-end-first': {
    q: '`print "one";` is line 1 and line 3 has a syntax error. Why is `one` never printed?',
    a: 'Scanning and parsing check the whole program before any of it runs, and a syntax error stops it from running at all.',
  },
};

export const examples = {
  'error-lines': {
    title: 'An error knows its line',
    lang: 'drip',
    expectError: true,
    code: `print "one";
let x = 1;
print x +;`,
  },
};

export const exercises = {
  locate: {
    title: 'From offset to line and column',
    prompt:
      'A scanner walks the source by **offset**: the index of a character in the whole string. Error messages want a **line** and **column** instead, both counted from 1.\n\nWrite `locate(src, offset)`, returning `{ line, col }`. In `\'ab\\ncd\'`, offset 0 (`a`) is line 1, column 1, and offset 4 (`d`) is line 2, column 2. A newline character belongs to the end of its line.',
    starter: `function locate(src, offset) {
  // your code here
}

console.log(locate('ab\\ncd', 4));`,
    solution: `function locate(src, offset) {
  let line = 1;
  let col = 1;
  for (let i = 0; i < offset; i++) {
    if (src[i] === '\\n') {
      line++;
      col = 1;
    } else {
      col++;
    }
  }
  return { line, col };
}`,
    tests: `test('the very first character', () => {
  expect(locate('ab\\ncd', 0))
    .toEqual({ line: 1, col: 1 });
});
test('later on the first line', () => {
  expect(locate('ab\\ncd', 1))
    .toEqual({ line: 1, col: 2 });
});
test('a newline ends its own line', () => {
  expect(locate('ab\\ncd', 2))
    .toEqual({ line: 1, col: 3 });
});
test('the start of line 2', () => {
  expect(locate('ab\\ncd', 3))
    .toEqual({ line: 2, col: 1 });
});
test('three lines', () => {
  const src = 'let x;\\n\\nprint x +;';
  expect(locate(src, 16))
    .toEqual({ line: 3, col: 9 });
});`,
    hints: [
      'Walk from the start of the string up to (but not including) `offset`, keeping a `line` and a `col`, both starting at 1.',
      'Every character you pass moves you one column right…',
      '…except a newline `\\n`: passing one moves you to the next line and back to column 1.',
    ],
    walkthrough: `**How to think about it.** Picture a cursor moving through the text from the very first character, the way the scanner moves. It starts at line 1, column 1. Every ordinary character it steps over moves it one column to the right; stepping over a newline moves it to the start of the next line, column 1 again. So you do not need to find lines first: walk from offset 0 up to the target offset, and keep the two counters up to date as you go. When you arrive, the counters say where you are. Try it on \`'ab\\ncd'\` and offset 4: pass \`a\` (column 2), \`b\` (column 3), the newline (line 2, column 1) and \`c\` (column 2), and you stand on \`d\` at line 2, column 2.

**The solution, line by line.**

- \`let line = 1;\` and \`let col = 1;\` put the cursor where offset 0 is: people count lines and columns from 1.
- \`for (let i = 0; i < offset; i++) {\` steps over every character *before* the target; the target itself is never stepped over, because the cursor stops on it.
- \`if (src[i] === '\\n') {\` asks whether the character being passed is a newline...
- \`line++;\` and \`col = 1;\` ...in which case the cursor moves down a line and back to its start.
- \`} else {\` for any other character...
- \`col++;\` ...the cursor moves one column right.
- \`return { line, col };\` reports where the cursor stopped. (\`{ line, col }\` is short for \`{ line: line, col: col }\`.)

Notice that asking for the offset of a newline itself reports it at the *end* of its line (offset 2 in \`'ab\\ncd'\` is line 1, column 3), because the newline is the cursor's target and has not been passed yet. This is exactly what Drip's scanner does with its \`line\` counter, adding 1 every time it steps over a \`\\n\`; tracking \`col\` as well would take two more lines.

**Common wrong attempts.**

- Forgetting \`col = 1\` after a newline: the column keeps counting across lines, so offset 3 in \`'ab\\ncd'\` is reported as column 4 instead of 1.
- Starting both counters at 0: the arithmetic is consistent, but the first character becomes line 0, column 0, and every error message is one off from what an editor shows.
- Looping with \`i <= offset\`: the target character is passed as well, so every column comes out one too big.`,
    wrong: [
      {
        code: `function locate(src, offset) {
  let line = 1;
  let col = 1;
  for (let i = 0; i < offset; i++) {
    if (src[i] === '\\n') line++;
    col++;
  }
  return { line, col };
}`,
        why: 'After a newline the column must start again at 1. Here it keeps counting, so offset 3 in `\'ab\\ncd\'` is reported as column 4.',
      },
      {
        code: `function locate(src, offset) {
  let line = 0;
  let col = 0;
  for (let i = 0; i < offset; i++) {
    if (src[i] === '\\n') {
      line++;
      col = 0;
    } else {
      col++;
    }
  }
  return { line, col };
}`,
        why: 'This counts from 0, so the first character is line 0, column 0. People (and the tests) count lines and columns from 1.',
      },
    ],
  },
  'point-at': {
    optional: true,
    title: 'Point at the problem',
    prompt:
      'Write `pointAt(src, line, col)`. It returns two lines joined by `\\n`: the source line number `line`, and under it a caret `^` in column `col` (columns count from 1, so `col - 1` spaces come first).\n\nFor `\'let x = 1;\\nprint x +;\'` with line 2 and column 10 it returns `\'print x +;\\n         ^\'`.',
    starter: `function pointAt(src, line, col) {
  // your code here
}

const src = 'let x = 1;\\nprint x +;';
console.log(pointAt(src, 2, 10));`,
    solution: `function pointAt(src, line, col) {
  const lines = src.split('\\n');
  const text = lines[line - 1];
  const pad = ' '.repeat(col - 1);
  return text + '\\n' + pad + '^';
}`,
    tests: `const src = 'let x = 1;\\nprint x +;';
test('the end of line 2', () => {
  expect(pointAt(src, 2, 10))
    .toBe('print x +;\\n         ^');
});
test('column 1 needs no spaces', () => {
  expect(pointAt(src, 1, 1))
    .toBe('let x = 1;\\n^');
});
test('the middle of line 1', () => {
  expect(pointAt(src, 1, 5))
    .toBe('let x = 1;\\n    ^');
});`,
    hints: [
      '`src.split(\'\\n\')` gives an array of lines. Line numbers start at 1 but array indexes start at 0.',
      'The caret goes in column `col`, so it needs `col - 1` spaces in front. `\' \'.repeat(n)` makes `n` spaces.',
      'Glue them together: the line, a newline, the spaces, then `^`.',
    ],
    walkthrough: `**How to think about it.** The output is two lines stacked: the source line itself, and under it a line of spaces with a \`^\` at the end, lined up under column \`col\`. So there are two small jobs: find the right line of text, and build the right number of spaces. Both have a one-off trap: lines are counted from 1 while array indexes start at 0, and the caret in column 1 needs *no* spaces in front of it, so column \`col\` needs \`col - 1\`.

**The solution, line by line.**

- \`const lines = src.split('\\n');\` cuts the source into an array of lines, without the newline characters.
- \`const text = lines[line - 1];\` picks the line asked for; line 1 is index 0, hence the \`- 1\`.
- \`const pad = ' '.repeat(col - 1);\` builds the spaces that push the caret into column \`col\`.
- \`return text + '\\n' + pad + '^';\` glues the line, a newline, the spaces and the caret into one string of two lines.

Combine this with \`locate\` from the core exercise and you can turn any offset into a pointed error message. It works because every character here, the space included, takes one column on screen; tabs and some Unicode characters make real tools work harder (the grid-reference analogy's warning).

**Common wrong attempts.**

- \`lines[line]\`: that is the line *after* the one you want, because array indexes start at 0.
- \`' '.repeat(col)\`: one space too many, so the caret sits one column to the right of the problem.`,
    wrong: [
      {
        code: `function pointAt(src, line, col) {
  const lines = src.split('\\n');
  const text = lines[line];
  const pad = ' '.repeat(col - 1);
  return text + '\\n' + pad + '^';
}`,
        why: 'Lines count from 1 but array indexes from 0, so `[line]` takes the line *after* the one you want.',
      },
      {
        code: `function pointAt(src, line, col) {
  const lines = src.split('\\n');
  const text = lines[line - 1];
  const pad = ' '.repeat(col);
  return text + '\\n' + pad + '^';
}`,
        why: 'One space too many: column 1 should have the caret right at the start, with no spaces before it.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'How many tokens does Drip’s scanner make for `print x;`?',
    options: [
      { t: '3', why: 'Don’t forget the token the scanner always adds at the very end.' },
      { t: '8, one per character', why: 'Tokens are words, not characters, and spaces make none.' },
      { t: '4: `print`, `x`, `;` and `eof`', correct: true, why: 'Three words, plus the `eof` token that marks the end.' },
      { t: '5, counting the space', why: 'Spaces separate tokens but never become tokens.' },
    ],
  },
  {
    q: 'What is the **lexeme** of the token made from `12.5` in a Drip program?',
    options: [
      { t: 'The number 12.5', why: 'That is the literal: the value the characters stand for.' },
      { t: 'The string `"12.5"`', correct: true, why: 'The lexeme is always the exact characters from the source.' },
      { t: '`number`', why: 'That is the token’s type, its category.' },
      { t: '`12` and `5`, as two lexemes', why: 'The digits, the dot and the digits after it form one number token.' },
    ],
  },
  {
    q: 'Which pair of tokens has the **same type** but different lexemes?',
    options: [
      { t: '`speed` and `total`', correct: true, why: 'Both are names chosen by the programmer, so both have type `identifier`.' },
      { t: '`+` and `-`', why: 'Each operator has its own type: `\'+\'` and `\'-\'`.' },
      { t: '`let` and `fn`', why: 'Each keyword has its own type: `\'let\'` and `\'fn\'`.' },
      { t: '`=` and `==`', why: 'They are different types, `\'=\'` and `\'==\'`: one assigns, one compares.' },
    ],
  },
  {
    q: 'In Drip’s `TokenType`, the token for `while` has which type?',
    options: [
      { t: '`\'identifier\'`', why: '`while` is a reserved keyword, not a name the programmer chose.' },
      { t: '`\'keyword\'`', why: 'There is no single keyword type: each keyword has its own.' },
      { t: '`\'while\'`', correct: true, why: 'For keywords and punctuation, the type is the spelling itself.' },
      { t: '`\'string\'`', why: '`while` isn’t in quotes, so it isn’t a string literal.' },
    ],
  },
  {
    q: 'This Drip program has a syntax error on line 2. What is printed?\n```\nprint "hello";\nprint 1 +;\n```',
    options: [
      { t: '`hello`, then an error for line 2', why: 'That is what happens with a *runtime* error. A syntax error is found before anything runs.' },
      { t: 'Only an error for line 2: `hello` is never printed', correct: true, why: 'The front end reads the whole program first, and a program with a syntax error never starts.' },
      { t: 'An error for line 1', why: 'Line 1 is fine. The `;` token on line 2 carries line 2.' },
      { t: '`hello` and `1`', why: '`1 +;` is missing its right-hand side, so it can’t be parsed.' },
    ],
  },
];
