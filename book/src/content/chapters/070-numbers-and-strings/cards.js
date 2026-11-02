// Chapter 70 cards. Keys are stable ids: never rename them.

export const prompts = {
  'literal-what': {
    q: 'What is a literal?',
    a: 'A value written directly in the source, such as `4.25` or `"hi"`.',
  },
  'dot-peeknext': {
    q: 'The number scanner has read `4` and `peek()` is `.`. Why must it also look at `peekNext()`?',
    a: 'The dot belongs to the number only if a digit follows it. In `4.` or `point.x` it is something else.',
  },
  'lexeme-vs-value': {
    q: 'For the Drip source `4.250`, what are the token’s lexeme and its literal value?',
    a: 'The lexeme is the text `\'4.250\'`. The literal value is the number `4.25`.',
  },
  'string-value': {
    q: 'For the Drip source `"hi"`, what is the lexeme, and what is the literal value?',
    a: 'The lexeme is `"hi"`, quotes included (4 characters). The value is `hi`, without the quotes.',
  },
  'string-newline': {
    q: 'Why does the string loop do `line++` when it passes a newline?',
    a: 'Drip strings may span lines. Counting them keeps the line numbers of later tokens right.',
  },
  'unterminated': {
    q: 'What does Drip’s scanner do if the file ends before a string’s closing quote?',
    a: 'It reports the error `Unterminated string.` and makes no string token.',
  },
  'number-host': {
    q: 'How does Drip’s scanner turn the lexeme `\'4.25\'` into a number?',
    a: 'It hands it to JavaScript’s own `Number`, which gives the 64-bit float 4.25.',
  },
  'no-escapes': {
    q: 'Can a Drip string contain a `"` character?',
    a: 'No: Drip strings have no escapes like `\\"`, so the first `"` after the opening one always ends the string.',
  },
};

export const examples = {
  numbers: {
    title: 'Number and string literals in Drip',
    lang: 'drip',
    code: `print 42;
print 007;
print 4.250;
print 1.5 + 2.5;
print "Drip strings
can span lines";
print "";
print "say 'hi'";`,
  },
};

export const exercises = {
  scanNumber: {
    title: 'Scan a number',
    prompt:
      'Write `scanNumber(s, i)`. A number starts at index `i` of the string `s`. Return `{ value, end }`: `value` is the number, and `end` is the index just after its last character. A number is digits, optionally followed by a `.` and more digits. Take the dot only if a digit comes right after it. (`s[j]` past the end is `undefined`, and `isDigit(undefined)` is `false`.)',
    starter: `const isDigit = (c) =>
  c >= '0' && c <= '9';

function scanNumber(s, i) {
  // your code here
}

console.log(scanNumber('4.25;', 0));
console.log(scanNumber('7.x', 0));`,
    solution: `const isDigit = (c) =>
  c >= '0' && c <= '9';

function scanNumber(s, i) {
  let j = i;
  while (isDigit(s[j])) j++;
  if (s[j] === '.' &&
      isDigit(s[j + 1])) {
    j++;
    while (isDigit(s[j])) j++;
  }
  return {
    value: Number(s.slice(i, j)),
    end: j,
  };
}`,
    tests: `test('a whole number', () => {
  expect(scanNumber('42', 0)).toEqual({ value: 42, end: 2 });
});
test('a fraction', () => {
  expect(scanNumber('3.25+1', 0)).toEqual({ value: 3.25, end: 4 });
});
test('a dot with no digit after it is left alone', () => {
  expect(scanNumber('7.', 0)).toEqual({ value: 7, end: 1 });
  expect(scanNumber('4.x', 0)).toEqual({ value: 4, end: 1 });
});
test('starting in the middle', () => {
  expect(scanNumber('x = 12;', 4)).toEqual({ value: 12, end: 6 });
});
test('only one dot', () => {
  expect(scanNumber('1.2.3', 0)).toEqual({ value: 1.2, end: 3 });
});`,
    hints: [
      'Use a second index `j`, starting at `i`. Move it forward while `s[j]` is a digit.',
      'Then check two characters: `s[j] === \'.\'` and `isDigit(s[j + 1])`. Only if both hold, step past the dot and take more digits.',
      'The lexeme is `s.slice(i, j)`. Return `{ value: Number(...), end: j }`.',
    ],
    walkthrough: `**How to think about it.** This is the companion scanner's number loop, written as a function of its own, with an index \`j\` playing the part of \`current\`. Say the rule out loud: digits; then, *if* there is a dot *and* a digit right after it, the dot and more digits. The "and a digit right after it" is the part people forget, and it needs two characters of lookahead: \`s[j]\` is the next character (\`peek\`) and \`s[j + 1]\` the one after (\`peekNext\`). Try \`'7.'\` by hand: after the \`7\`, the next character is a dot but nothing follows it, so the number is just \`7\` and ends at index 1.

**The solution, line by line.**

- \`let j = i;\` starts the second index where the number starts.
- \`while (isDigit(s[j])) j++;\` takes every digit. Past the end of the string \`s[j]\` is \`undefined\`, and \`isDigit(undefined)\` is \`false\`, so the loop stops safely.
- \`if (s[j] === '.' && isDigit(s[j + 1])) {\` asks both questions at once: is the next character a dot, and is the one after it a digit?
- \`j++;\` takes the dot...
- \`while (isDigit(s[j])) j++;\` ...and the digits after it. There is no second dot check, so in \`'1.2.3'\` the number is \`1.2\` and the scan stops at the second dot.
- \`}\` ends the fraction case.
- \`return { value: Number(s.slice(i, j)), end: j };\` cuts out the lexeme, turns it into a JavaScript number exactly as the companion does, and reports where the number ended, so the caller knows where the next token starts.

**Common wrong attempts.**

- \`if (s[j] === '.')\` with no digit check: \`'7.'\` ends at index 2, and \`'4.x'\` swallows the dot that should start \`.x\`.
- No fraction case at all: whole numbers work, but \`3.25\` comes out as \`3\`.
- Returning \`s.slice(i, j)\` as the value: that is the lexeme, a string; \`'42'\` is not the number \`42\`, and \`toEqual\` tells them apart.`,
    wrong: [
      {
        code: `const isDigit = (c) =>
  c >= '0' && c <= '9';

function scanNumber(s, i) {
  let j = i;
  while (isDigit(s[j])) j++;
  if (s[j] === '.') {
    j++;
    while (isDigit(s[j])) j++;
  }
  return {
    value: Number(s.slice(i, j)),
    end: j,
  };
}`,
        why: 'This takes any dot, so `\'7.\'` ends at index 2 and `\'4.x\'` swallows the dot that should start `.x`. Check that a digit follows before taking the dot.',
      },
      {
        code: `const isDigit = (c) =>
  c >= '0' && c <= '9';

function scanNumber(s, i) {
  let j = i;
  while (isDigit(s[j])) j++;
  return {
    value: Number(s.slice(i, j)),
    end: j,
  };
}`,
        why: 'Whole numbers work, but `3.25` comes out as `3`. A fraction part is allowed after the dot.',
      },
    ],
  },
  scanString: {
    optional: true,
    title: 'Scan a string',
    prompt:
      'Write `scanString(s, i)`. The character `s[i]` is an opening `"`. Find the closing `"` and return `{ value, end }`: `value` is the text between the quotes, and `end` is the index just after the closing quote. If the string runs out first, **throw** an `Error` with the message `Unterminated string.`',
    starter: `function scanString(s, i) {
  // your code here
}

console.log(scanString('"hi";', 0));`,
    solution: `function scanString(s, i) {
  let j = i + 1;
  while (j < s.length && s[j] !== '"') {
    j++;
  }
  if (j >= s.length) {
    const msg = 'Unterminated string.';
    throw new Error(msg);
  }
  return {
    value: s.slice(i + 1, j),
    end: j + 1,
  };
}`,
    tests: `test('a short string', () => {
  expect(scanString('"hi";', 0))
    .toEqual({ value: 'hi', end: 4 });
});
test('the empty string', () => {
  expect(scanString('""', 0))
    .toEqual({ value: '', end: 2 });
});
test('starting in the middle', () => {
  expect(scanString('x = "ab" + y', 4))
    .toEqual({ value: 'ab', end: 8 });
});
test('a newline inside', () => {
  expect(scanString('"a\\nb"', 0))
    .toEqual({ value: 'a\\nb', end: 5 });
});
test('no closing quote', () => {
  expect(() => scanString('"oops', 0)).toThrow();
});`,
    hints: [
      'Start a second index `j` just after the opening quote, at `i + 1`.',
      'Move `j` forward while it is still inside the string and `s[j]` is not `"`. When the loop stops, either `s[j]` is the closing quote or `j` has run off the end.',
      'If `j >= s.length`, throw. Otherwise the value is `s.slice(i + 1, j)` (both quotes left out) and the string ends at `j + 1`.',
    ],
    walkthrough: `**How to think about it.** A string is "everything up to the next quote mark", so the loop's only question is "is this a quote?". But there are two ways for the loop to stop: it finds the closing quote, or it runs out of string, and the second is the unterminated error. So test for the end *inside* the loop condition, and after the loop ask which way it stopped. Then slice carefully: the value leaves out both quotes, while \`end\` must step past the closing one.

**The solution, line by line.**

- \`let j = i + 1;\` starts just after the opening quote.
- \`while (j < s.length && s[j] !== '"') {\` keeps going while there is text left and the character is not a quote...
- \`j++;\` ...taking it into the string. A newline is taken like any other character, which is why Drip strings may span lines (the real scanner also adds one to \`line\` here).
- \`if (j >= s.length) {\` means the loop ran off the end without finding a quote...
- \`const msg = 'Unterminated string.';\` and \`throw new Error(msg);\` ...so report it rather than invent a closing quote (the message is in a variable only to keep the line short).
- \`return { value: s.slice(i + 1, j), end: j + 1 };\` otherwise \`s[j]\` is the closing quote: the value is the slice between the quotes, and the next token starts just after it. (The real scanner's \`slice(start + 1, current - 1)\` is the same slice, measured after \`current\` has passed the closing quote.)

**Common wrong attempts.**

- \`s.slice(i, j + 1)\` as the value: that is the lexeme, quotes included.
- Forgetting the end test: \`while (s[j] !== '"')\` never stops on its own when there is no closing quote, because \`undefined !== '"'\` is always true; it only stops when \`j\` grows huge, and the value is then the rest of the source.
- Returning \`end: j\`: the closing quote would be read again as the start of a new string.`,
    wrong: [
      {
        code: `function scanString(s, i) {
  let j = i + 1;
  while (j < s.length && s[j] !== '"') {
    j++;
  }
  return {
    value: s.slice(i, j + 1),
    end: j + 1,
  };
}`,
        why: 'The value includes both quote marks (that is the lexeme), and a string with no closing quote does not throw.',
      },
      {
        code: `function scanString(s, i) {
  let j = i + 1;
  while (j < s.length && s[j] !== '"') {
    j++;
  }
  if (j >= s.length) {
    const msg = 'Unterminated string.';
    throw new Error(msg);
  }
  return {
    value: s.slice(i + 1, j),
    end: j,
  };
}`,
        why: '`end` points at the closing quote, so the scanner would read it again as the opening quote of another string.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which of these is a literal in the Drip line `let total = 4.25;`?',
    options: [
      { t: '`total`', why: '`total` is an identifier: a name that refers to a value, not a value itself.' },
      { t: '`let`', why: '`let` is a keyword.' },
      { t: '`4.25`', correct: true, why: 'It is a value written directly in the source.' },
      { t: '`=`', why: '`=` is an operator token.' },
    ],
  },
  {
    q: 'Drip’s scanner reads the source `7.foo`. What does it make of the first two characters?',
    options: [
      { t: 'The number `7.`, because a dot after digits always belongs to the number', why: 'The dot is taken only when a digit follows it. Here `f` follows.' },
      { t: 'The number `7`, then a `.` token, because the character after the dot is not a digit', correct: true, why: 'peekNext sees `f`, so the number stops before the dot.' },
      { t: 'An error, because a number can’t touch a dot', why: 'The scanner is happy: it just ends the number before the dot. (The parser may complain later.)' },
      { t: 'An identifier `7.foo`', why: 'A digit always starts a number, and identifiers can’t contain dots.' },
    ],
  },
  {
    q: 'What are the lexeme and the literal value of the Drip token for `"ok"`?',
    options: [
      { t: 'Both are `ok`', why: 'The lexeme is the exact source text, which includes the quotes.' },
      { t: 'Lexeme `ok`, value `"ok"`', why: 'This is the wrong way round.' },
      { t: 'Both are `"ok"`', why: 'The value leaves the quotes out: they only mark where the string starts and ends.' },
      { t: 'Lexeme `"ok"` (with quotes), value `ok` (without)', correct: true, why: 'The scanner slices from `start + 1` to `current - 1` to drop the quotes.' },
    ],
  },
  {
    q: 'What does `print 4.250;` show in Drip?',
    options: [
      { t: '`4.250`', why: 'That is the lexeme. `print` shows the value, and `Number` drops the trailing zero.' },
      { t: '`4.25`', correct: true, why: 'The token’s literal is the number 4.25; the lexeme `4.250` is only how it was written.' },
      { t: '`4`', why: 'A digit follows the dot, so the fraction is part of the number.' },
      { t: 'An error', why: 'Trailing zeros are allowed: they are still digits.' },
    ],
  },
  {
    q: 'The file ends while Drip’s scanner is still inside a string. What happens?',
    options: [
      { t: 'The scanner adds the missing quote and carries on', why: 'It never invents characters; that would hide a real mistake.' },
      { t: 'The rest of the file is printed', why: 'Nothing runs once the scanner has reported an error.' },
      { t: 'The string is silently dropped', why: 'It is reported, so the programmer knows.' },
      { t: 'It reports `Unterminated string.` and makes no string token', correct: true, why: 'The loop stops at the end of the source, `atEnd()` is true, and the error is reported.' },
    ],
  },
];
