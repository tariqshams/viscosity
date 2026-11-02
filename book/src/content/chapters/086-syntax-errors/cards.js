// Chapter 86 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'syntax-error-what': {
    q: 'What is a **syntax error**?',
    a: 'Source that breaks the grammar: the parser needs one kind of token and finds another.',
  },
  'where-noticed': {
    q: 'A `;` is missing at the end of line 1, and line 2 starts with `print`. Where does Drip report the error?',
    a: 'On line 1: a missing `;` is reported on the line of the token before it, where the `;` belongs. The message still names the token found: `expected \';\' after the value, found \'print\'`.',
  },
  'at-end': {
    q: 'When does a Drip syntax error say `found end of file` instead of naming a token?',
    a: 'When the parser ran out of tokens: the token it was looking at is the end-of-file token.',
  },
  'recovery-goals': {
    q: 'What are the two goals of **error recovery**?',
    a: 'Report as many real errors as possible in one run, and report no cascading (fake) errors.',
  },
  'cascade-what': {
    q: 'What is a **cascading** error?',
    a: 'A reported error that is only an echo of an earlier one, caused by the parser being lost, not by a second real mistake.',
  },
  'panic-what': {
    q: 'What does a parser do in **panic mode**?',
    a: 'It abandons the current statement and skips tokens until a synchronization point, then resumes normal parsing.',
  },
  'sync-points': {
    q: 'Where does Drip’s `synchronize()` stop skipping?',
    a: 'Just after a `;`, just before a keyword that starts a statement (`class`, `fn`, `let`, `for`, `if`, `while`, `print`, `return`, `break`, `continue`), at the `}` that closes the block it is in, or at the end of input.',
  },
  'skip-first': {
    q: 'Why can Drip’s parser never get stuck, failing on the same token for ever?',
    a: 'Every statement takes at least one token before `synchronize()` runs, so each round moves forward. (The exercise’s `sync`, which starts at the bad token, gets the same guarantee by skipping that token first.)',
  },
  'no-throw-target': {
    q: 'For `a + b = 3;`, Drip reports `cannot assign to this expression`, yet skips nothing. Why?',
    a: 'The parser is not lost: it carries on and takes the `;`, so when `synchronize()` runs, the previous token is already a `;` and it stops at once.',
  },
  'exit-65': {
    q: 'A Drip program has one syntax error on its last line. How many of its statements run?',
    a: 'None. If any error was reported, Drip stops before running anything and exits with code 65.',
  },
};

export const examples = {
  'three-typos': {
    title: 'Three errors, one run',
    lang: 'drip',
    expectError: true,
    code: `print 1 +;
print (2;
let = 3;`,
  },
};

export const exercises = {
  sync: {
    title: 'Write synchronize',
    prompt:
      'Write `sync(ts, i)`. `ts` is an array of lexemes, and `i` is the index of the token where a syntax error was found. Return the index where parsing should resume: skip the bad token first, then stop as soon as the **previous** token is `;`, or the **current** token is in `STARTS`. If you run off the end, return `ts.length`.',
    starter: `const STARTS = new Set(['class', 'fn',
  'let', 'for', 'if', 'while', 'print',
  'return', 'break', 'continue']);

function sync(ts, i) {
  // your code here
  return i;
}`,
    solution: `const STARTS = new Set(['class', 'fn',
  'let', 'for', 'if', 'while', 'print',
  'return', 'break', 'continue']);

function sync(ts, i) {
  i++; // always skip the bad token
  while (i < ts.length) {
    if (ts[i - 1] === ';') return i;
    if (STARTS.has(ts[i])) return i;
    i++;
  }
  return ts.length;
}`,
    tests: `const t = (s) => s.split(' ');
test('skips the rest of the statement', () => {
  const ts = t('let x = 1 print x ; print 3 ;');
  expect(sync(ts, 4)).toBe(7);
});
test('a bad ; resumes right after it', () => {
  const ts = t('print 1 + ; print 2 ;');
  expect(sync(ts, 3)).toBe(4);
});
test('stops before a statement keyword', () => {
  const ts = t('print ) print 2 ;');
  expect(sync(ts, 1)).toBe(2);
});
test('no safe point: the end', () => {
  expect(sync(t('a b c'), 0)).toBe(3);
});`,
    hints: [
      'The very first thing to do is `i++`, whatever the bad token is.',
      'Then loop while `i < ts.length`. Inside, check the token before `i` for `;`, and the token at `i` for a statement keyword.',
      'If neither check returns, skip one more token with `i++`. After the loop, return `ts.length`.',
    ],
    walkthrough: `This is a simplified \`synchronize()\` over an array of lexemes. One difference from the companion: here \`i\` is the bad token, not yet taken, so \`sync\` must skip it first to make progress. (The companion's parser has always taken at least one token of the statement by the time it synchronizes, so it can check straight away. It also stops at a \`}\` that closes the current block, which this version leaves out.)

- **Skip first.** The error happened *at* \`ts[i]\`. Skipping it unconditionally means \`sync\` always moves forward, even if that token is \`print\`. In the first test, \`print\` (index 4) is where \`;\` was expected. Without the skip you would return 4, the parser would fail on the same token again, and you would loop forever.
- **After a \`;\`.** \`ts[i - 1] === ';'\` means the token we just passed ended a statement, so \`ts[i]\` is a fresh start. In the second test the bad token *is* the \`;\`, so we stop right after it.
- **Before a keyword.** \`STARTS.has(ts[i])\` catches the case where a \`;\` is missing but the next statement begins with a keyword, as in the third test.
- **The end.** If no safe point comes, there is nothing left to parse: return \`ts.length\`.`,
    wrong: [
      {
        code: `const STARTS = new Set(['class', 'fn',
  'let', 'for', 'if', 'while', 'print',
  'return', 'break', 'continue']);

function sync(ts, i) {
  while (i < ts.length) {
    if (ts[i - 1] === ';') return i;
    if (STARTS.has(ts[i])) return i;
    i++;
  }
  return ts.length;
}`,
        why: 'It never skips the bad token. When the error is at a `print`, it returns the same index, and a real parser would fail on that token again forever.',
      },
      {
        code: `const STARTS = new Set(['class', 'fn',
  'let', 'for', 'if', 'while', 'print',
  'return', 'break', 'continue']);

function sync(ts, i) {
  i++;
  while (i < ts.length) {
    if (ts[i - 1] === ';') return i;
    i++;
  }
  return ts.length;
}`,
        why: 'It only stops after a `;`. In `print ) print 2 ;` it skips the good statement `print 2 ;` too, so that statement is never checked.',
      },
    ],
  },
  'fix-drip': {
    optional: true,
    lang: 'drip',
    title: 'Repair a broken program',
    prompt:
      'This program should print `Hello, Drip` and then `10`, but it has syntax errors. Run it first and read **all** the errors Drip reports. Then fix the program without changing what it means.',
    starter: `let name = "Drip"
print "Hello, " + name;
let n = (2 + 3;
print n * 2;`,
    solution: `let name = "Drip";
print "Hello, " + name;
let n = (2 + 3);
print n * 2;`,
    tests: `Hello, Drip
10`,
    hints: [
      'Drip reports two errors in one run, thanks to panic mode. The first is on line 1, and it names the token the parser found instead (`print`, on line 2).',
      'The second error says a `)` was expected. Where should the group close?',
    ],
    walkthrough: `Running the starter gives:

\`\`\`
line 1: expected ';' after the variable
declaration, found 'print'
line 3: expected ')' after the expression,
found ';'
\`\`\`

(Each error is one line; they are split here to fit.)

- **The first error** is on line 1: the parser was still inside the \`let\`, wanting a \`;\`, and found \`print\` (on line 2) instead. Drip reports a missing \`;\` on the line where it belongs. The fix is a \`;\` at the end of line 1.
- **The second error** is real and separate. After the first, \`synchronize()\` stopped at once, because \`print\` starts a statement, so line 2 was parsed normally; then on line 3, \`(2 + 3\` is never closed. Add the \`)\`.

Notice that both errors came from one run, and neither was a fake. That is error recovery doing its job. Notice too that nothing printed: with any syntax error, Drip runs no statements.`,
    wrong: [
      {
        code: `let name = "Drip";
print "Hello, " + name;
let n = (2 + 3;
print n * 2;`,
        why: 'Only the first error is fixed. The group on line 3 still never closes, so the program still fails to parse, and nothing prints.',
      },
      {
        code: `let name = "Drip"
print "Hello, " + name;
let n = (2 + 3);
print n * 2;`,
        why: 'Line 3 is fixed, but line 1 still lacks its `;`. The message says `found \'print\'`, which is easy to misread as a problem with the `print` on line 2.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which error does Drip report for this program?\n```\nlet x = 1\nprint x;\n```',
    options: [
      { t: '`line 2: expected \';\' after the variable declaration, found \'print\'`', why: 'The parser noticed at `print`, on line 2, but a missing `;` is reported on the line of the token before it, where the `;` belongs.' },
      { t: '`line 1: expected \';\' after the variable declaration, found \'print\'`', correct: true, why: 'The parser wanted a `;` and found `print`. The message names that token, and the line is the one where the `;` belongs.' },
      { t: '`line 2: expected an expression, found \'x\'`', why: 'Nothing is wrong with `print x;`: after the first error the parser resumes at `print` and parses it normally.' },
      { t: 'No error: the newline ends the statement', why: 'Drip ignores newlines. Only `;` ends a statement.' },
    ],
  },
  {
    q: 'What is a **cascading** error?',
    options: [
      { t: 'An error inside a nested expression', why: 'Depth has nothing to do with it.' },
      { t: 'An error that stops the parser completely', why: 'That would be a parser with no recovery. Cascading errors happen when a parser recovers badly.' },
      { t: 'An error message that only exists because the parser got lost after an earlier one', correct: true, why: 'Panic mode exists to avoid them, by skipping to a point where the parser is sure where it is.' },
      { t: 'A runtime error caused by a syntax error', why: 'A program with a syntax error never runs.' },
    ],
  },
  {
    q: 'In panic mode, `synchronize()` is skipping tokens. Which situation makes it stop?',
    options: [
      { t: 'The next token is a number', why: 'A number is not a statement keyword, so it keeps skipping, even though an expression statement could start with one. Only keywords are trusted as starts.' },
      { t: 'The next token is `)`', why: 'A `)` is in the middle of something. Not a safe point.' },
      { t: 'The previous token is `+`', why: 'After a `+` the parser is mid-expression. Not a safe point.' },
      { t: 'The next token is `while`', correct: true, why: '`while` starts a statement, so it is a synchronization point.' },
    ],
  },
  {
    q: 'Why does panic mode sometimes skip a perfectly good statement without checking it?',
    options: [
      { t: 'It has a bug', why: 'It is a deliberate trade-off.' },
      { t: 'Because the good statement was swallowed while looking for a safe point, as when a missing `;` makes it skip through the next `;`', correct: true, why: 'Skipping a little too much costs at worst one more run. Inventing errors costs confusion.' },
      { t: 'To save time', why: 'Speed is not the reason. The reason is to avoid cascading errors.' },
      { t: 'Because statements after an error can never be parsed', why: 'They can: the parser resumes after the safe point and parses the rest normally.' },
    ],
  },
  {
    q: 'A Drip program prints three lines, but line 40 has a syntax error. What does running it print?',
    options: [
      { t: 'The three lines, then the error', why: 'The parse finishes before anything runs, and with an error nothing runs at all.' },
      { t: 'Only the error, with exit code 65', correct: true, why: '`run` checks `reporter.errors` after parsing and returns before interpreting.' },
      { t: 'The lines before line 40, then the error', why: 'Drip does not interleave parsing and running. The whole program is parsed first.' },
      { t: 'Only the error, with exit code 70', why: '70 is for runtime errors. Syntax errors are static errors: 65.' },
    ],
  },
  {
    q: 'For `a + b = 3;`, Drip reports `cannot assign to this expression`, but no token is skipped. Why?',
    options: [
      { t: 'The parser is not confused: it carries on, takes the `;`, and `synchronize()` stops at once', correct: true, why: 'The flag is set, but the previous token is already a `;` when it synchronizes, so it is at a safe place.' },
      { t: 'Because it is a runtime error, not a syntax error', why: 'It is found while parsing, before anything runs, and gives exit code 65.' },
      { t: 'Because the statement is fine and it is only a warning', why: 'It is a real error: the program will not run.' },
      { t: 'Because `=` is a synchronization point', why: 'The safe points are just after a `;`, before a statement keyword, and at a closing `}`.' },
    ],
  },
];
