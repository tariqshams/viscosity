// Chapter 87 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'syntax-error-what': {
    q: 'What is a **syntax error**?',
    a: 'Source that breaks the grammar: the parser needs one kind of token and finds another.',
  },
  'where-noticed': {
    q: 'A `;` is missing at the end of line 1, and line 2 starts with `print`. Where does Drip report the error?',
    a: 'On line 1: a missing `;` is reported on the line of the token before it, where the `;` belongs. The message still names the token found: `found \'print\'`.',
  },
  'at-end': {
    q: 'When does a Drip syntax error say `found end of file` instead of naming a token?',
    a: 'When the parser ran out of tokens: the token it was looking at is the end-of-file token.',
  },
  'found-names': {
    q: 'How does a Drip syntax error name the token it found, for `print`, for a string, and for a `;`?',
    a: '`\'print\'` and `\';\'` (the token’s text in quotes), but `a string` for any string.',
  },
  'exit-65': {
    q: 'A Drip program has one syntax error on its last line. How many of its statements run?',
    a: 'None. If any error was reported, Drip stops before running anything and exits with code 65.',
  },
  'consume-no-throw': {
    q: 'What does Drip’s `consume` do when the token it needs is not there?',
    a: 'It reports `expected …, found …` to the reporter and returns without taking a token; it does not throw, so parsing carries on.',
  },
  'recovery-goals': {
    q: 'What are the two goals of **error recovery**?',
    a: 'Report as many real errors as possible in one run, and report no cascading (fake) errors.',
  },
  'cascade-what': {
    q: 'What is a **cascading** error?',
    a: 'A reported error that is only an echo of an earlier one, caused by the parser being lost, not by a second real mistake.',
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
  message: {
    title: 'Word the error like Drip',
    prompt:
      'Write `message(ts, i, need, what)`. `ts` is an array of tokens, each `{ t, line }`, where `t` is the token’s text (a string token’s text starts with `"`, and the last token is `{ t: \'eof\', line }`). The parser needed a token `need` at index `i`, and found `ts[i]` instead; `what` is the description, such as `"\';\' after the value"`. Return Drip’s message: `line N: expected WHAT, found FOUND`. FOUND is `end of file` for `eof`, `a string` for a string, and otherwise the text in single quotes. N is the line of `ts[i]`, except that when `need` is `\';\'` it is the line of the token before, `ts[i - 1]`. A helper `name(t)` is a good start.',
    starter: `function name(t) {
  // your code here
}

function message(ts, i, need, what) {
  // your code here
  return '';
}`,
    solution: `function name(t) {
  if (t === 'eof') return 'end of file';
  if (t[0] === '"') return 'a string';
  return "'" + t + "'";
}

function message(ts, i, need, what) {
  const at = need === ';'
    ? ts[i - 1] : ts[i];
  return 'line ' + at.line +
    ': expected ' + what +
    ', found ' + name(ts[i].t);
}`,
    tests: `const tk = (t, line) => ({ t, line });
test('a missing ; goes on the line before', () => {
  const ts = [tk('let', 1), tk('x', 1),
    tk('=', 1), tk('1', 1),
    tk('print', 2)];
  expect(message(ts, 4, ';',
    "';' after the variable declaration"))
    .toBe("line 1: expected ';' after the" +
      " variable declaration, found 'print'");
});
test('other tokens: the line where noticed', () => {
  const ts = [tk('print', 1), tk('(', 1),
    tk('2', 1), tk(';', 2)];
  expect(message(ts, 3, ')',
    "')' after the expression"))
    .toBe("line 2: expected ')' after the" +
      " expression, found ';'");
});
test('a string is named by its kind', () => {
  const ts = [tk('print', 1), tk('"hi"', 1),
    tk('"there"', 1)];
  expect(message(ts, 2, ';',
    "';' after the value"))
    .toBe("line 1: expected ';' after the" +
      " value, found a string");
});
test('running out of tokens', () => {
  const ts = [tk('{', 1), tk('print', 2),
    tk('1', 2), tk(';', 2), tk('eof', 3)];
  expect(message(ts, 4, '}',
    "'}' to close the block"))
    .toBe("line 3: expected '}' to close" +
      " the block, found end of file");
});`,
    hints: [
      'Split the job in two: naming the found token (`name`), and choosing the line and gluing the message together (`message`).',
      '`name(t)` has three cases: `t === \'eof\'`, a string (its first character, `t[0]`, is `"`), and everything else, which gets single quotes round it.',
      'For the line, pick the token first: `const at = need === \';\' ? ts[i - 1] : ts[i];`. Then join `\'line \'`, `at.line`, `\': expected \'`, `what`, `\', found \'` and `name(ts[i].t)`.',
    ],
    walkthrough: `**How to think about it.** A Drip syntax error has three parts (where, what was needed, what was found), and each part comes from a different place. *What was needed* is handed to you as \`what\`. *What was found* is always the token at \`i\`, the one the parser was looking at, but it is named in one of three ways depending on its kind. *Where* is the line of that same token, with one exception: a missing \`;\` belongs at the end of the line before, so its line comes from the token before. Write the naming as a small helper first, then build the message.

**The solution, line by line.**

- \`function name(t) {\` names a found token from its text.
- \`if (t === 'eof') return 'end of file';\` covers running out of tokens: there is no text to quote, so Drip says what happened instead.
- \`if (t[0] === '"') return 'a string';\` checks the first character. A string's text could be long, or contain quotes and new lines, so Drip names its kind rather than quoting it.
- \`return "'" + t + "'";\` covers every other token: its text in single quotes, as in \`'print'\` or \`';'\`.
- \`function message(ts, i, need, what) {\` builds the whole message.
- \`const at = need === ';' ? ts[i - 1] : ts[i];\` chooses the token whose line is reported. This is the same choice as the companion's \`t === ';' ? previous : current\`: for a missing \`;\`, the token before the one found, otherwise the one found.
- \`return 'line ' + at.line + ': expected ' + what + ', found ' + name(ts[i].t);\` glues the parts together. Notice that the *found* part always uses \`ts[i]\`, even when the line comes from \`ts[i - 1]\`: in the first test the line is 1 but the token named is \`'print'\`, from line 2.

**Common wrong attempts.**

- Always using \`ts[i].line\`: the first test then says \`line 2\`, pointing at a line that has nothing wrong with it.
- Naming the token before as well, \`name(ts[i - 1].t)\`: the message for a missing \`;\` then says \`found '1'\`, which is the last token of the statement, not the one the parser found.
- Quoting every token: a string then comes out as \`'"there"'\` instead of \`a string\`, and the end as \`'eof'\`.`,
    wrong: [
      {
        code: `function name(t) {
  if (t === 'eof') return 'end of file';
  if (t[0] === '"') return 'a string';
  return "'" + t + "'";
}

function message(ts, i, need, what) {
  return 'line ' + ts[i].line +
    ': expected ' + what +
    ', found ' + name(ts[i].t);
}`,
        why: 'It always reports the line of the token found, so a missing `;` at the end of line 1 is reported on line 2.',
      },
      {
        code: `function name(t) {
  return "'" + t + "'";
}

function message(ts, i, need, what) {
  const at = need === ';'
    ? ts[i - 1] : ts[i];
  return 'line ' + at.line +
    ': expected ' + what +
    ', found ' + name(ts[i].t);
}`,
        why: 'Every token is quoted, so a string comes out as `\'"there"\'` and the end of the input as `\'eof\'`, instead of `a string` and `end of file`.',
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
      'Drip reports two errors in one run, thanks to error recovery. The first is on line 1, and it names the token the parser found instead (`print`, on line 2).',
      'A missing `;` is reported on the line where it belongs, so the first fix goes at the end of line 1.',
      'The second error says a `)` was expected and a `;` was found. Where should the group that starts with `(` close?',
    ],
    walkthrough: `**How to think about it.** Do not start editing until you have read every message: error recovery means one run has already told you about both mistakes. For each message, ask two questions: which token did the parser find, and on which line does the fix belong?

Running the starter gives:

\`\`\`
line 1: expected ';' after the variable
declaration, found 'print'
line 3: expected ')' after the expression,
found ';'
\`\`\`

(Each error is one line; they are split here to fit.)

**The fix, line by line.**

- \`let name = "Drip";\` gets the missing \`;\`. The first message names line 1, because a missing \`;\` is reported where it belongs, but it says \`found 'print'\`: the parser was still inside the \`let\`, wanted a \`;\`, and the next token was the \`print\` on line 2.
- \`print "Hello, " + name;\` was fine all along. After the first error, the parser picked up again at this \`print\` and parsed it normally, which is how it went on to find the second error.
- \`let n = (2 + 3);\` gets the missing \`)\`. Inside the brackets the parser read \`2 + 3\`, then needed a \`)\` to close the group and found the \`;\`.
- \`print n * 2;\` was fine too, and now prints \`10\`.

Notice that both errors came from one run, and neither was a fake: that is error recovery doing its job. Notice too that nothing printed from the broken version, not even \`Hello, Drip\`: with any syntax error, Drip runs no statements.

**Common wrong attempts.**

- Fixing only the first error and running again: it works, but it wastes a run, because Drip had already told you about the second.
- Reading \`found 'print'\` as a problem with the \`print\` on line 2, and changing that line: the \`print\` is only where the parser noticed; the fix is the \`;\` before it.`,
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
      { t: '`line 2: expected an expression, found \'x\'`', why: 'Nothing is wrong with `print x;`.' },
      { t: 'No error: the newline ends the statement', why: 'Drip ignores newlines. Only `;` ends a statement.' },
    ],
  },
  {
    q: 'Which error does Drip report for this program?\n```\nprint 1 +\nprint 2;\n```',
    options: [
      { t: '`line 1: expected an expression, found \'print\'`', why: 'Only a missing `;` is moved to the line before. This error is reported where the parser noticed.' },
      { t: '`line 1: expected \';\' after the value, found \'print\'`', why: 'The value is not finished: the `+` still needs a right operand.' },
      { t: '`line 2: expected an expression, found \'print\'`', correct: true, why: 'The `+` needs an operand, and the next token, `print` on line 2, cannot start one.' },
      { t: 'It prints `1` and then `2`', why: 'A program with a syntax error runs nothing.' },
    ],
  },
  {
    q: 'What is a **cascading** error?',
    options: [
      { t: 'An error inside a nested expression', why: 'Depth has nothing to do with it.' },
      { t: 'An error that stops the parser completely', why: 'That would be a parser with no recovery. Cascading errors happen when a parser recovers badly.' },
      { t: 'An error message that only exists because the parser got lost after an earlier one', correct: true, why: 'Error recovery aims to report none of them.' },
      { t: 'A runtime error caused by a syntax error', why: 'A program with a syntax error never runs.' },
    ],
  },
  {
    q: 'A Drip program prints three lines, but line 40 has a syntax error. What does running it print?',
    options: [
      { t: 'The three lines, then the error', why: 'The parse finishes before anything runs, and with an error nothing runs at all.' },
      { t: 'The lines before line 40, then the error', why: 'Drip does not interleave parsing and running. The whole program is parsed first.' },
      { t: 'Only the error, with exit code 70', why: '70 is for runtime errors. Syntax errors give 65.' },
      { t: 'Only the error, with exit code 65', correct: true, why: '`run` checks `reporter.errors` after parsing and returns before anything is run.' },
    ],
  },
  {
    q: 'Drip sometimes skips a statement after an error without checking it, so a second mistake there is only found on the next run. Why is that an acceptable price?',
    options: [
      { t: 'Because statements after an error are never checked', why: 'They are: the parser picks up again and checks the rest normally. Only a little is skipped.' },
      { t: 'Because a missed error costs one more run, while a made-up error costs confusion', correct: true, why: 'Error recovery puts “no echoes” first and “find as many as possible” second.' },
      { t: 'Because it makes the parser faster', why: 'Speed is not the reason; the aim is to avoid cascading errors.' },
      { t: 'Because Drip only ever reports one error', why: 'Drip reports one error per statement, and can report many in one run.' },
    ],
  },
];
