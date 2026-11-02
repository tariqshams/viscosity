// Chapter 54 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 59, 59.

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
    a: 'It adds an `error` token whose lexeme is the message, `unexpected character \'@\'`, and carries on scanning; the parser reports it in its place.',
  },
  'one-at-a-time': {
    q: 'How does the scanner of Drip’s VM differ from the tree-walker’s?',
    a: 'It hands out one token at a time, when the compiler asks, instead of building the whole list first.',
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

export const exercises = {
  locate: {
    title: 'From offset to line and column',
    prompt: `A scanner walks the source by **offset**: the index of a character in the whole string. Error messages want a **line** and **column** instead, both counted from 1.

Write \`locate(src, offset)\`, returning \`{ line, col }\`. In \`'ab\\ncd'\`, offset 0 (\`a\`) is line 1, column 1, and offset 4 (\`d\`) is line 2, column 2. A newline character belongs to the end of its line.`,
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
    prompt: `Write \`pointAt(src, line, col)\`. It returns two lines joined by \`\\n\`: the source line number \`line\`, and under it a caret \`^\` in column \`col\` (columns count from 1, so \`col - 1\` spaces come first).

For \`'let x = 1;\\nprint x +;'\` with line 2 and column 10 it returns \`'print x +;\\n         ^'\`.`,
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
  'scan-arith': {
    title: 'A scanner for arithmetic',
    prompt: `Write two functions.

1. \`isDigit(c)\`: true when the one-character string \`c\` is \`'0'\` to \`'9'\`, false otherwise.
2. \`scan(src)\`: returns the lexemes of an arithmetic expression as an array of strings. A number is a run of digits; every other character (\`+ - * / ( )\`) is a token on its own; spaces are skipped.

\`scan('1+23*4')\` should return \`['1', '+', '23', '*', '4']\`.`,
    starter: `function isDigit(c) {
  // your code here
}

function scan(src) {
  const out = [];
  // your code here
  return out;
}

console.log(scan('1+23*4'));`,
    solution: `function isDigit(c) {
  return c >= '0' && c <= '9';
}

function scan(src) {
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
}`,
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
      'If it was a digit, keep moving `cur` while `src[cur]` is a digit, so the number takes every digit in the run. Then push `src.slice(start, cur)`. If it was a space, push nothing.',
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

function scan(src) {
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
}`,
        why: 'Comparing with the *numbers* 0 and 9 converts `c` to a number first, and JavaScript converts `\' \'` to 0. So a space counts as a digit. Compare with the strings `\'0\'` and `\'9\'`.',
      },
      {
        code: `function isDigit(c) {
  return c >= '0' && c <= '9';
}

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
    q: 'How many tokens does Drip’s scanner make for `print x;`?',
    options: [
      {
        t: '3',
        why: 'Don’t forget the token the scanner always adds at the very end.',
      },
      {
        t: '8, one per character',
        why: 'Tokens are words, not characters, and spaces make none.',
      },
      {
        t: '4: `print`, `x`, `;` and `eof`',
        correct: true,
        why: 'Three words, plus the `eof` token that marks the end.',
      },
      {
        t: '5, counting the space',
        why: 'Spaces separate tokens but never become tokens.',
      },
    ],
  },
  {
    q: 'What is the **lexeme** of the token made from `12.5` in a Drip program?',
    options: [
      {
        t: 'The number 12.5',
        why: 'That is the literal: the value the characters stand for.',
      },
      {
        t: 'The string `"12.5"`',
        correct: true,
        why: 'The lexeme is always the exact characters from the source.',
      },
      {
        t: '`number`',
        why: 'That is the token’s type, its category.',
      },
      {
        t: '`12` and `5`, as two lexemes',
        why: 'The digits, the dot and the digits after it form one number token.',
      },
    ],
  },
  {
    q: 'Which pair of tokens has the **same type** but different lexemes?',
    options: [
      {
        t: '`speed` and `total`',
        correct: true,
        why: 'Both are names chosen by the programmer, so both have type `identifier`.',
      },
      {
        t: '`+` and `-`',
        why: 'Each operator has its own type: `\'+\'` and `\'-\'`.',
      },
      {
        t: '`let` and `fn`',
        why: 'Each keyword has its own type: `\'let\'` and `\'fn\'`.',
      },
      {
        t: '`=` and `==`',
        why: 'They are different types, `\'=\'` and `\'==\'`: one assigns, one compares.',
      },
    ],
  },
  {
    q: 'In Drip’s `TokenType`, the token for `while` has which type?',
    options: [
      {
        t: '`\'identifier\'`',
        why: '`while` is a reserved keyword, not a name the programmer chose.',
      },
      {
        t: '`\'keyword\'`',
        why: 'There is no single keyword type: each keyword has its own.',
      },
      {
        t: '`\'while\'`',
        correct: true,
        why: 'For keywords and punctuation, the type is the spelling itself.',
      },
      {
        t: '`\'string\'`',
        why: '`while` isn’t in quotes, so it isn’t a string literal.',
      },
    ],
  },
  {
    q: `This Drip program has a syntax error on line 2. What is printed?
\`\`\`
print "hello";
print 1 +;
\`\`\``,
    options: [
      {
        t: '`hello`, then an error for line 2',
        why: 'That is what happens with a *runtime* error. A syntax error is found before anything runs.',
      },
      {
        t: 'Only an error for line 2: `hello` is never printed',
        correct: true,
        why: 'The front end reads the whole program first, and a program with a syntax error never starts.',
      },
      {
        t: 'An error for line 1',
        why: 'Line 1 is fine. The `;` token on line 2 carries line 2.',
      },
      {
        t: '`hello` and `1`',
        why: '`1 +;` is missing its right-hand side, so it can’t be parsed.',
      },
    ],
  },
  {
    q: 'The scanner is building a token for `12` in `x = 12;`. When `add` is called, `start` is 4. What is `current`?',
    options: [
      {
        t: '4',
        why: 'Then `slice(4, 4)` would be the empty string.',
      },
      {
        t: '5',
        why: '`slice(4, 5)` would be just `1`. The digit loop moved past the `2` too.',
      },
      {
        t: '7',
        why: 'That would include the `;` at index 6.',
      },
      {
        t: '6',
        correct: true,
        why: '`slice(4, 6)` is `12`: the end index is not included, and index 6 holds the `;`.',
      },
    ],
  },
  {
    q: 'The source is `(`, then two newlines, then `)`. On which line is the `)` token recorded?',
    options: [
      {
        t: '1',
        why: 'Each newline the scanner passes adds 1 to `line`.',
      },
      {
        t: '3',
        correct: true,
        why: 'Two newlines are passed before the `)`, so `line` has gone from 1 to 3.',
      },
      {
        t: '2',
        why: 'There are two newlines, not one, before the `)`.',
      },
      {
        t: 'It has no line: only the first token gets one',
        why: 'Every token records the line it came from.',
      },
    ],
  },
  {
    q: 'What happens when Drip scans `print 1 @ 2;`?',
    options: [
      {
        t: 'The `@` becomes an error token, the parser reports `unexpected character \'@\'`, and nothing runs',
        correct: true,
        why: 'The scanner carries on past the `@`; the parser reports the error token (only the first error in the statement) and the pipeline stops before the interpreter.',
      },
      {
        t: 'The scanner stops at the `@`, and the program prints `1`',
        why: 'Nothing runs once any error has been reported, and the scanner does not stop.',
      },
      {
        t: 'The `@` becomes an `identifier` token',
        why: 'An identifier must start with a letter or `_`.',
      },
      {
        t: 'It prints `1 @ 2`',
        why: 'There is no string here; `@` is not a Drip character at all.',
      },
    ],
  },
  {
    q: 'In `const c = advance();`, what has changed after the call?',
    options: [
      {
        t: 'Nothing: `advance` only looks',
        why: 'That is `peek`. `advance` moves on.',
      },
      {
        t: '`start` has moved on by one',
        why: '`start` only moves at the beginning of each round, with `start = current`.',
      },
      {
        t: '`c` holds the character that was at `current`, and `current` is one bigger',
        correct: true,
        why: '`source[current++]` reads with the old value, then adds one.',
      },
      {
        t: 'A token has been added',
        why: 'Only `add` pushes tokens; `advance` reads one character.',
      },
    ],
  },
  {
    q: 'Why does the whitespace case in the `switch` contain nothing but `break`?',
    options: [
      {
        t: 'Because whitespace is an error',
        why: 'Spaces are fine; they separate tokens.',
      },
      {
        t: 'Because spaces are added to the next token’s lexeme',
        why: 'The next round sets `start = current` first, so the space is outside every lexeme.',
      },
      {
        t: 'Because the scanner has not been finished yet',
        why: 'It is deliberate, and it is the whole of the space case in the real scanner.',
      },
      {
        t: 'Because whitespace only separates tokens and never becomes one',
        correct: true,
        why: 'Reading it is enough: the next round starts a fresh token after it.',
      },
    ],
  },
];
