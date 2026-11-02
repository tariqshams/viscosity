// Names and keywords (split from chapter 70). Keys are stable ids.

export const prompts = {
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
  'case-matters': {
    q: 'Are `Total` and `total` the same identifier in Drip?',
    a: 'No: letters are compared exactly, so they are two different names.',
  },
  'nullish-fallback': {
    q: 'In `KEYWORDS.get(text) ?? \'identifier\'`, when is `\'identifier\'` used?',
    a: 'When the word is not in the table: `get` returns `undefined`, and `??` then takes its right-hand side.',
  },
};

export const examples = {
  names: {
    title: 'Names, and a name that starts like a keyword',
    lang: 'drip',
    code: `let iffy = "a name, not if";
print iffy;
let _count2 = 7;
print _count2;
let Total = 1;
let total = 2;
print Total + total;

// Try: let if = 3;
// Try: print 2x;`,
  },
};

export const exercises = {
  scanWord: {
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
    walkthrough: `**How to think about it.** Scan first, decide second. The loop does not need to know anything about keywords: it takes every letter, digit and underscore, so that the word is complete. Only then is there one question to ask, "is this whole word in the table?", and \`Map.get\` answers it. Try \`'iffy = 1'\` by hand: the loop takes \`i\`, \`f\`, \`f\`, \`y\` and stops at the space; \`iffy\` is not in the table, so it is an identifier, even though it begins with \`if\`.

**The solution, line by line.**

- \`let j = i;\` starts a second index at the word's first character (which the caller has already checked is a letter or \`_\`).
- \`while (isAlpha(s[j]) || isDigit(s[j])) j++;\` takes letters, digits and underscores; digits are allowed *after* the first character, so \`_a1b\` is one word. Past the end, \`s[j]\` is \`undefined\` and both checks are false, so the loop stops.
- \`const lexeme = s.slice(i, j);\` cuts out the complete word.
- \`const type = KEYWORDS.get(lexeme) ?? 'identifier';\` looks the whole word up once; \`get\` gives \`undefined\` for a missing key, and \`??\` then supplies \`'identifier'\`.
- \`return { type, lexeme };\` hands back both (short for \`{ type: type, lexeme: lexeme }\`).

The companion scanner does the same in one line: \`add(KEYWORDS.get(text) ?? 'identifier')\`.

**Common wrong attempts.**

- Checking for keywords before reading the whole word (for instance with \`s.startsWith(k, i)\` for each keyword): \`iffy\` comes out as the keyword \`if\`.
- Taking only letters in the loop: \`_a1b\` stops at \`_a\`, because digits inside names are allowed.
- Using \`||\` instead of \`??\`: it happens to work here, because no keyword type is an empty string, but \`??\` says exactly what is meant, "only when nothing was found".`,
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
  {
    q: 'Which of these is a valid Drip identifier?',
    options: [
      { t: '`2nd`', why: 'A digit always starts a number, so this is the number `2` and then the name `nd`.' },
      { t: '`_2nd`', correct: true, why: 'It starts with `_` and continues with digits and letters, which is allowed.' },
      { t: '`my-name`', why: '`-` is not allowed in a name; this is `my` minus `name`.' },
      { t: '`while`', why: 'It has the right shape, but it is a reserved keyword.' },
    ],
  },
  {
    q: 'What token type does Drip’s scanner give the word `true`?',
    options: [
      { t: '`\'identifier\'`', why: '`true` is in the keyword table, so it is not an ordinary name.' },
      { t: '`\'true\'`, a keyword type; the parser later turns it into the boolean value', correct: true, why: 'The scanner only labels words; making values out of keywords is the parser’s job.' },
      { t: '`\'string\'`', why: 'It has no quote marks; `"true"` would be a string.' },
      { t: '`\'boolean\'`', why: 'There is no `boolean` token type; there is one type per keyword.' },
    ],
  },
];
