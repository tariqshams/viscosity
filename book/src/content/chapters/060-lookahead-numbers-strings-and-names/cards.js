// Chapter 60 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'peek-vs-advance': {
    q: 'In a hand-written scanner, what is the difference between the helpers `peek()` and `advance()`?',
    a: '`advance` returns the next character and moves `current` past it. `peek` returns it without moving.',
  },
  'match-what': {
    q: 'In a hand-written scanner, what does the helper `match(\'=\')` do?',
    a: 'If the next character is `=`, it consumes it and returns true. Otherwise it changes nothing and returns false.',
  },
  'munch-what': {
    q: 'What is maximal munch?',
    a: 'Always taking the longest run of characters that forms a valid token.',
  },
  'a-plus': {
    q: 'In JavaScript, how is `a+++b` cut into tokens?',
    a: '`a`, `++`, `+`, `b`: maximal munch takes `++` first, so it means `a++ + b`.',
  },
  'dot-peeknext': {
    q: 'A Drip scanner has read the digit `4` and the next character is `.`. Why must it also look at the character after the dot before taking it?',
    a: 'The dot belongs to the number only if a digit follows it; in `4.` or `p.x` it is a token of its own.',
  },
  'lexeme-vs-value': {
    q: 'For the Drip source `4.250`, what are the token’s lexeme and its literal value?',
    a: 'The lexeme is the text `\'4.250\'`. The literal value is the number `4.25`.',
  },
  'string-value': {
    q: 'For the Drip source `"hi"`, what is the lexeme, and what is the literal value?',
    a: 'The lexeme is `"hi"`, quotes included (4 characters). The value is `hi`, without the quotes.',
  },
  'whole-word-first': {
    q: 'Why does a scanner read a whole word before looking it up in its keyword table?',
    a: 'Maximal munch: in `iffy` it must not stop at `if`. Only the complete word is looked up.',
  },
  'let-if': {
    q: 'Why is `let if = 3;` an error in Drip?',
    a: '`if` is a reserved keyword, so the scanner makes an `if` token, not an identifier, and the parser needs a name there.',
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
print "say \\"hi\\"\\tand bye";`,
  },
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

# Try: let if = 3;
# Try: print 2x;`,
  },
};

export const exercises = {
  'scan-ops': {
    optional: true,
    title: 'Maximal munch for comparisons',
    prompt: `Write \`scanOps(src)\`. The source contains only the characters \`<\`, \`>\`, \`=\`, \`!\` and spaces. Return the operator tokens, using maximal munch: \`<=\`, \`>=\`, \`==\` and \`!=\` are single tokens, and spaces are skipped.

\`scanOps('<=<')\` is \`['<=', '<']\` and \`scanOps('!===')\` is \`['!=', '==']\`.`,
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
      'Use the usual scanning loop: `start = cur`, then read `src[cur++]`.',
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
  scanNumber: {
    title: 'Scan a number',
    prompt: 'Write `scanNumber(s, i)`. A number starts at index `i` of the string `s`. Return `{ value, end }`: `value` is the number, and `end` is the index just after its last character. A number is digits, optionally followed by a `.` and more digits. Take the dot only if a digit comes right after it. (`s[j]` past the end is `undefined`, and `isDigit(undefined)` is `false`.)',
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
    prompt: 'Write `scanString(s, i)`. The character `s[i]` is an opening `"`. Find the closing `"` and return `{ value, end }`: `value` is the text between the quotes, and `end` is the index just after the closing quote. If the string runs out first, **throw** an `Error` with the message `unterminated string`. (Leave escapes out here: assume the string contains no backslash.)',
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
    const msg = 'unterminated string';
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
- \`const msg = 'unterminated string';\` and \`throw new Error(msg);\` ...so report it rather than invent a closing quote (the message is in a variable only to keep the line short).
- \`return { value: s.slice(i + 1, j), end: j + 1 };\` otherwise \`s[j]\` is the closing quote: the value is the slice between the quotes, and the next token starts just after it. (With no escapes, this slice is exactly the value the real scanner builds character by character; escapes are why it builds it instead of slicing.)

**Common wrong attempts.**

- \`s.slice(i, j + 1)\` as the value: that is the lexeme, quotes included.
- Forgetting the end test: \`while (s[j] !== '"')\` never stops when there is no closing quote: past the end \`s[j]\` is \`undefined\`, and \`undefined !== '"'\` is always true, so the loop runs for ever and the page hangs.
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
    const msg = 'unterminated string';
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
  scanWord: {
    optional: true,
    title: 'Scan a word, then look it up',
    prompt: 'Write `scanWord(s, i)`. A word starts at index `i` (its first character is a letter or `_`). Take letters, digits and underscores, then return `{ type, lexeme }`. The type comes from the `KEYWORDS` table, or is `\'identifier\'` if the word isn’t in it.',
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
    q: 'How many tokens (not counting `eof`) does Drip’s scanner make for `a <= b`?',
    options: [
      {
        t: '4: `a`, `<`, `=`, `b`',
        why: 'After `<`, `match(\'=\')` sees the `=` and takes it, so the two characters become one token.',
      },
      {
        t: '3: `a`, `<=`, `b`',
        correct: true,
        why: 'Maximal munch: `<=` is one token. Spaces make none.',
      },
      {
        t: '5, counting the spaces',
        why: 'The space case makes no token.',
      },
      {
        t: '6, one per character',
        why: 'Tokens are words, not characters.',
      },
    ],
  },
  {
    q: 'In JavaScript, `let a = 1, b = 2;` then `a+++b` evaluates to what?',
    options: [
      {
        t: 'A syntax error',
        why: 'It is valid: maximal munch reads `++` first, giving `a++ + b`.',
      },
      {
        t: '`4`, because it means `a + ++b`',
        why: 'That would need the scanner to take a shorter `+` first. It always takes the longest token, `++`.',
      },
      {
        t: '`3`, because it means `a++ + b`',
        correct: true,
        why: 'The scanner takes `++`, then `+`. `a++` gives 1 (and makes `a` 2), and 1 + 2 is 3.',
      },
      {
        t: '`NaN`',
        why: 'All the values involved are numbers.',
      },
    ],
  },
  {
    q: 'Drip’s scanner reads the source `7.foo`. What does it make of the first two characters?',
    options: [
      {
        t: 'The number `7.`, because a dot after digits always belongs to the number',
        why: 'The dot is taken only when a digit follows it. Here `f` follows.',
      },
      {
        t: 'The number `7`, then a `.` token, because the character after the dot is not a digit',
        correct: true,
        why: 'peekNext sees `f`, so the number stops before the dot.',
      },
      {
        t: 'An error, because a number can’t touch a dot',
        why: 'The scanner is happy: it just ends the number before the dot. (The parser may complain later.)',
      },
      {
        t: 'An identifier `7.foo`',
        why: 'A digit always starts a number, and identifiers can’t contain dots.',
      },
    ],
  },
  {
    q: 'What are the lexeme and the literal value of the Drip token for `"ok"`?',
    options: [
      {
        t: 'Both are `ok`',
        why: 'The lexeme is the exact source text, which includes the quotes.',
      },
      {
        t: 'Lexeme `ok`, value `"ok"`',
        why: 'This is the wrong way round.',
      },
      {
        t: 'Both are `"ok"`',
        why: 'The value leaves the quotes out: they only mark where the string starts and ends.',
      },
      {
        t: 'Lexeme `"ok"` (with quotes), value `ok` (without)',
        correct: true,
        why: 'The value is built from the characters between the quotes; the quotes only mark where it starts and ends.',
      },
    ],
  },
  {
    q: 'A Drip scanner checked for keywords as soon as their letters appeared, before reading the whole word. What would go wrong with `let format = 1;`?',
    options: [
      {
        t: '`format` would start with the keyword `for`, leaving a stray `mat`',
        correct: true,
        why: 'That is why the scanner reads the whole word first and looks it up afterwards (maximal munch).',
      },
      {
        t: 'Nothing: `format` isn’t a keyword',
        why: 'It isn’t, but it *starts* with one, which is enough to break an early check.',
      },
      {
        t: '`let` would be read as an identifier',
        why: '`let` is a whole keyword either way.',
      },
      {
        t: 'The number `1` would be lost',
        why: 'Numbers are scanned by a different loop.',
      },
    ],
  },
];
