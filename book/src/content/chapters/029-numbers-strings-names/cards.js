// Chapter 29 cards. Keys are stable ids: never rename them.

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
  'identifier-rule': {
    q: 'In Drip, what may an identifier start with, and what may follow?',
    a: 'It starts with a letter or `_`, followed by any letters, digits or `_`.',
  },
  'digit-first': {
    q: 'What tokens does Drip’s scanner make from `2x`?',
    a: 'The number `2`, then the identifier `x`. A digit always starts a number.',
  },
  'keyword-what': {
    q: 'What is a keyword?',
    a: 'A word with a fixed meaning in the language, such as `if` or `while`. In Drip, keywords can’t be used as names.',
  },
  'whole-word-first': {
    q: 'Why does the scanner read a whole word before checking the keyword table?',
    a: 'Maximal munch: in `iffy` it must not stop at `if`. Only the complete word is looked up.',
  },
  'true-is-keyword': {
    q: 'What token type does Drip’s scanner give the word `true`?',
    a: 'The keyword type `true`. The parser later turns it into the literal value true.',
  },
  'let-if': {
    q: 'Why is `let if = 3;` an error in Drip?',
    a: '`if` is a reserved keyword, so the scanner makes an `if` token, not an identifier, and the parser needs a name there.',
  },
};

export const examples = {
  literals: {
    title: 'Literals, names and keywords in Drip',
    lang: 'drip',
    code: `print 42;
print 4.250;
print "Drip strings
can span lines";
let iffy = "a name, not if";
print iffy;
let _count2 = 7;
print _count2;
print true;
print nil;

// Try: let if = 3;
// Try: print 2x;`,
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
    walkthrough: `This is the companion scanner’s number loop, written as a function of its own.

- **Digits first.** \`j\` starts at \`i\` and moves while it sees digits. Past the end of the string, \`s[j]\` is \`undefined\`, and \`undefined >= '0'\` is \`false\`, so the loop stops safely.
- **Two characters of lookahead for the dot.** \`s[j]\` is the next character (\`peek\`), and \`s[j + 1]\` is the one after (\`peekNext\`). The dot is only part of the number when a digit follows. That is why \`'7.'\` ends at index 1: the dot is left for whoever reads the next token.
- **At most one dot.** After the fraction’s digits there is no second check, so in \`'1.2.3'\` the number is \`1.2\` and the scan stops at the second dot.
- **The value.** \`s.slice(i, j)\` is the lexeme. \`Number\` converts it to a JavaScript number, exactly as the companion does.`,
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
  scanWord: {
    optional: true,
    title: 'Scan a word, then look it up',
    prompt:
      'Write `scanWord(s, i)`. A word starts at index `i` (its first character is a letter or `_`). Take letters, digits and underscores, then return `{ type, lexeme }`. The type comes from the `KEYWORDS` table, or is `\'identifier\'` if the word isn’t in it.',
    starter: `const KEYWORDS = new Map([
  ['fn', 'fn'], ['if', 'if'],
  ['let', 'let'], ['while', 'while'],
]);
const isAlpha = (c) =>
  (c >= 'a' && c <= 'z') ||
  (c >= 'A' && c <= 'Z') || c === '_';
const isDigit = (c) =>
  c >= '0' && c <= '9';

function scanWord(s, i) {
  // your code here
}

console.log(scanWord('iffy = 1', 0));`,
    solution: `const KEYWORDS = new Map([
  ['fn', 'fn'], ['if', 'if'],
  ['let', 'let'], ['while', 'while'],
]);
const isAlpha = (c) =>
  (c >= 'a' && c <= 'z') ||
  (c >= 'A' && c <= 'Z') || c === '_';
const isDigit = (c) =>
  c >= '0' && c <= '9';

function scanWord(s, i) {
  let j = i;
  while (isAlpha(s[j]) ||
         isDigit(s[j])) j++;
  const lexeme = s.slice(i, j);
  const type = KEYWORDS.get(lexeme)
    ?? 'identifier';
  return { type, lexeme };
}`,
    tests: `test('a keyword', () => {
  expect(scanWord('if (x)', 0)).toEqual({ type: 'if', lexeme: 'if' });
});
test('a name that starts like a keyword', () => {
  expect(scanWord('iffy = 1', 0)).toEqual({ type: 'identifier', lexeme: 'iffy' });
});
test('digits and underscores inside a name', () => {
  expect(scanWord('x = _a1b+2', 4)).toEqual({ type: 'identifier', lexeme: '_a1b' });
});
test('a keyword right before a bracket', () => {
  expect(scanWord('fn(', 0)).toEqual({ type: 'fn', lexeme: 'fn' });
});
test('a word at the very end', () => {
  expect(scanWord('let', 0)).toEqual({ type: 'let', lexeme: 'let' });
});`,
    hints: [
      'Move an index `j` forward from `i` while `s[j]` is a letter, a digit or `_`.',
      'The word is `s.slice(i, j)`. Only now look it up: `KEYWORDS.get(word)`.',
      '`get` gives `undefined` for a missing key, so `KEYWORDS.get(w) ?? \'identifier\'` gives the type.',
    ],
    walkthrough: `Scan first, decide second.

- **The loop** takes letters, digits and underscores. Digits are allowed *after* the first character, so \`_a1b\` is one word. (The first character was already checked by whoever called \`scanWord\`.)
- **The lookup** happens once, on the complete word. \`iffy\` is not in the table, so it is an identifier, even though it begins with \`if\`. That is maximal munch.
- **\`??\`** picks the right-hand side only when the left is \`null\` or \`undefined\`, which is exactly what \`Map.get\` returns for a missing key.

The companion scanner does the same in one line: \`add(KEYWORDS.get(text) ?? 'identifier')\`.`,
    wrong: [
      {
        code: `const KEYWORDS = new Map([
  ['fn', 'fn'], ['if', 'if'],
  ['let', 'let'], ['while', 'while'],
]);
const isAlpha = (c) =>
  (c >= 'a' && c <= 'z') ||
  (c >= 'A' && c <= 'Z') || c === '_';
const isDigit = (c) =>
  c >= '0' && c <= '9';

function scanWord(s, i) {
  for (const [k, t] of KEYWORDS) {
    if (s.startsWith(k, i)) {
      return { type: t, lexeme: k };
    }
  }
  let j = i;
  while (isAlpha(s[j]) ||
         isDigit(s[j])) j++;
  const lexeme = s.slice(i, j);
  return { type: 'identifier', lexeme };
}`,
        why: 'This checks for keywords before reading the whole word, so `iffy` comes out as the keyword `if`. Scan the full word first, then look it up.',
      },
      {
        code: `const KEYWORDS = new Map([
  ['fn', 'fn'], ['if', 'if'],
  ['let', 'let'], ['while', 'while'],
]);
const isAlpha = (c) =>
  (c >= 'a' && c <= 'z') ||
  (c >= 'A' && c <= 'Z') || c === '_';
const isDigit = (c) =>
  c >= '0' && c <= '9';

function scanWord(s, i) {
  let j = i;
  while (isAlpha(s[j])) j++;
  const lexeme = s.slice(i, j);
  const type = KEYWORDS.get(lexeme)
    ?? 'identifier';
  return { type, lexeme };
}`,
        why: 'Digits are allowed after the first character. This stops `_a1b` at `_a`.',
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
    q: 'A Drip scanner checked for keywords as soon as their letters appeared, before reading the whole word. What would go wrong with `let format = 1;`?',
    options: [
      { t: '`format` would start with the keyword `for`, leaving a stray `mat`', correct: true, why: 'That is why the scanner reads the whole word first and looks it up afterwards (maximal munch).' },
      { t: 'Nothing: `format` isn’t a keyword', why: 'It isn’t, but it *starts* with one, which is enough to break an early check.' },
      { t: '`let` would be read as an identifier', why: '`let` is a whole keyword either way.' },
      { t: 'The number `1` would be lost', why: 'Numbers are scanned by a different loop.' },
    ],
  },
  {
    q: 'In Drip’s scanner, what happens to a word that is not in the `KEYWORDS` table?',
    options: [
      { t: 'The scanner reports an unknown word', why: 'Any word not in the table is just a name.' },
      { t: 'It becomes an `identifier` token, because `get` returns `undefined` and `??` supplies the fallback', correct: true, why: '`KEYWORDS.get(text) ?? \'identifier\'`.' },
      { t: 'It is added to the table', why: 'The table is fixed: it lists the language’s keywords.' },
      { t: 'It becomes a `string` token', why: 'Strings start with a quote.' },
    ],
  },
  {
    q: 'JavaScript lets you write `let async = 1`, but Drip rejects `let fn = 1;`. Why the difference?',
    options: [
      { t: 'Drip has more keywords than JavaScript', why: 'The number of keywords doesn’t matter; whether they are reserved does.' },
      { t: 'JavaScript doesn’t have a scanner', why: 'Every JavaScript engine scans source into tokens.' },
      { t: '`fn` contains no vowels', why: 'Spelling has nothing to do with it.' },
      { t: 'Every Drip keyword is reserved, but some JavaScript keywords, like `async`, are not', correct: true, why: 'JavaScript’s specification keeps keywords and reserved words separate; Drip makes every keyword reserved.' },
    ],
  },
];
