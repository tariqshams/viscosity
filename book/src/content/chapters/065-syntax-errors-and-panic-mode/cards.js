// Chapter 58 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 65, 65.

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
  'panic-what': {
    q: 'What does a parser do in **panic mode**?',
    a: 'It reports the first error, keeps quiet about the rest of the statement, then skips tokens until a synchronisation point and resumes normal parsing.',
  },
  'quiet-flag': {
    q: 'In Drip’s `errorAt`, what happens to a second error in the same statement, and why?',
    a: 'It is dropped, because `panicMode` is already set: a second complaint before the statement ends is probably an echo of the first.',
  },
  'sync-points': {
    q: 'Where does Drip’s `synchronize()` stop skipping?',
    a: 'Just after a `;`, just before a keyword that starts a statement, at the `}` that closes the block it is in, or at the end of the file.',
  },
  'braces-whole': {
    q: 'While skipping, `synchronize()` meets a `{`. What does it do with the tokens up to the matching `}`?',
    a: 'It skips them all: inside braces it opened itself (`depth > 0`) nothing counts as a safe place.',
  },
  'skip-first': {
    q: 'Why can Drip’s parser never get stuck, failing on the same token for ever?',
    a: 'Every statement takes at least one token before `synchronize()` runs, so each round moves forward. (The exercise’s `sync`, which starts at the bad token, gets the same guarantee by skipping that token first.)',
  },
  'panic-price': {
    q: 'What does panic mode give up in exchange for reporting no cascading errors?',
    a: 'The tokens it skips are never checked, so a second mistake inside them is only found on the next run.',
  },
  'missing-brace': {
    q: 'In `if x > 1 print x;` the `{` is missing. What does the parser do with `print x;`?',
    a: 'It reports `expected \'{\' after the condition`, parses no body at all, and then checks `print x;` as an ordinary statement.',
  },
  'no-throw-target': {
    q: 'For `a + b = 3;`, Drip reports `cannot assign to this expression`. How much does `synchronize()` skip, and why so little?',
    a: 'Only the `3` and the `;`: the parser knows exactly where it is, so the skip stops right after the statement’s own `;`.',
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
  'three-stops': {
    title: 'Three mistakes, three safe points',
    lang: 'drip',
    expectError: true,
    code: `let x = 1
print x;
x = 2 3 + 4;
print x;
fn f() {
  let a = 1
}`,
  },
};

export const exercises = {
  message: {
    title: 'Word the error like Drip',
    prompt: 'Write `message(ts, i, need, what)`. `ts` is an array of tokens, each `{ t, line }`, where `t` is the token’s text (a string token’s text starts with `"`, and the last token is `{ t: \'eof\', line }`). The parser needed a token `need` at index `i`, and found `ts[i]` instead; `what` is the description, such as `"\';\' after the value"`. Return Drip’s message: `line N: expected WHAT, found FOUND`. FOUND is `end of file` for `eof`, `a string` for a string, and otherwise the text in single quotes. N is the line of `ts[i]`, except that when `need` is `\';\'` it is the line of the token before, `ts[i - 1]`. A helper `name(t)` is a good start.',
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
    prompt: 'This program should print `Hello, Drip` and then `10`, but it has syntax errors. Run it first and read **all** the errors Drip reports. Then fix the program without changing what it means.',
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
  sync: {
    title: 'Write synchronize',
    prompt: 'Write `sync(ts, i)`. `ts` is an array of lexemes, and `i` is the index of the token where a syntax error was found. Return the index where parsing should resume: skip the bad token first, then stop as soon as the **previous** token is `;`, or the **current** token is in `STARTS`. If you run off the end, return `ts.length`.',
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
  const ts = t('let x = 1 x = 2 ; print x ;');
  expect(sync(ts, 4)).toBe(8);
});
test('a bad ; resumes right after it', () => {
  const ts = t('print 1 + ; print 2 ;');
  expect(sync(ts, 3)).toBe(4);
});
test('stops before a statement keyword', () => {
  const ts = t('print ) print 2 ;');
  expect(sync(ts, 1)).toBe(2);
});
test('even when the bad token is one', () => {
  const ts = t('let x = 1 print x ; print 3 ;');
  expect(sync(ts, 4)).toBe(7);
});
test('no safe point: the end', () => {
  expect(sync(t('a b c'), 0)).toBe(3);
});`,
    hints: [
      'Picture the tokens as a row of boxes and `i` as your finger on the bad one. Which way does your finger move, and when does it stop?',
      'The very first thing to do is `i++`, whatever the bad token is. Then loop while `i < ts.length`, checking the token before `i` for `;` and the token at `i` for a statement keyword.',
      'Inside the loop: `if (ts[i - 1] === \';\') return i;`, then `if (STARTS.has(ts[i])) return i;`, then `i++`. After the loop, `return ts.length;`.',
    ],
    walkthrough: `**How to think about it.** This is the companion's \`synchronize()\` with the tokens as a plain array, the braces left out, and one difference that matters: here \`i\` points *at* the bad token, which nobody has taken yet. (In the companion, the statement has always taken at least one token by the time it synchronizes.) So the first job is to move past it; without that, a bad token that happens to be a keyword, such as \`print\`, would be returned as the place to resume, the parser would fail on it again, and it would go round for ever. After that, walk forward one token at a time and ask the chapter's two questions at each step: did a statement just end (is the token before me a \`;\`)? Does one start here (is this token a statement keyword)?

**The solution, line by line.**

- \`const STARTS = new Set([...]);\` is Drip's \`STATEMENT_STARTS\`: the keywords trusted to mean "a statement begins here". A \`Set\` answers "is this in it?" with \`has\`.
- \`function sync(ts, i) {\` takes the tokens and the index of the bad one.
- \`i++; // always skip the bad token\` moves past it unconditionally, which guarantees progress.
- \`while (i < ts.length) {\` keeps going until the tokens run out.
- \`if (ts[i - 1] === ';') return i;\` checks the token just passed. If it is a \`;\`, a statement has just ended, so \`ts[i]\` is a fresh start. In the second test the bad token *is* the \`;\` (index 3), so after the skip \`i\` is 4, the token before is that \`;\`, and the answer is 4.
- \`if (STARTS.has(ts[i])) return i;\` checks the current token. This catches a missing \`;\` followed by a keyword, as in the third test, where the \`)\` at index 1 is skipped and \`print\` at index 2 is the answer.
- \`i++;\` throws one more token away when neither check succeeded.
- \`}\` ends the loop.
- \`return ts.length;\` is reached when no safe point came before the end: there is nothing left to parse.

Trace the first test, \`let x = 1 x = 2 ; print x ;\` with the error at index 4 (the second \`x\`, where a \`;\` was expected). Skip it: \`i\` is 5 (\`=\`), not safe; 6 (\`2\`), not safe; 7 (\`;\`), not safe, because the check looks at the token *before*; 8 (\`print\`): the token before is \`;\`, so return 8. The statement \`x = 2 ;\` was skipped unchecked, exactly the price the chapter describes.

**Common wrong attempts.**

- Leaving out the first \`i++\`: in the fourth test the bad token is \`print\` (index 4), so \`sync\` returns 4 straight away, and a real parser would fail on that same token for ever.
- Checking only for \`;\`: in \`print ) print 2 ;\` the good statement \`print 2 ;\` is skipped too, so a mistake in it would go unreported.
- Checking \`ts[i] === ';'\` instead of \`ts[i - 1]\`: that stops *at* the \`;\`, so parsing would resume on a \`;\`, which cannot start a statement, and report a made-up error.`,
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
        why: 'It never skips the bad token. When the error is at a `print`, it returns the same index, and a real parser would fail on that token again for ever.',
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
  quiet: {
    optional: true,
    title: 'The quiet flag',
    prompt: 'A parser without a panic flag produced a list of errors, each `{ stmt, msg }`, where `stmt` is the number of the statement it was found in (errors come in the order found, so the numbers never go down). Write `quiet(errs)`: return the messages Drip would actually show, which is only the **first** error of each statement.',
    starter: `function quiet(errs) {
  const out = [];
  // your code here
  return out;
}`,
    solution: `function quiet(errs) {
  const out = [];
  let last = -1;
  for (const e of errs) {
    if (e.stmt === last) continue;
    last = e.stmt;
    out.push(e.msg);
  }
  return out;
}`,
    tests: `const e = (stmt, msg) => ({ stmt, msg });
test('one error per statement is kept', () => {
  expect(quiet([e(0, 'a'), e(1, 'b')]))
    .toEqual(['a', 'b']);
});
test('echoes in one statement go', () => {
  expect(quiet([e(0, 'a'), e(0, 'echo'),
    e(0, 'echo2')])).toEqual(['a']);
});
test('a mix', () => {
  expect(quiet([e(0, 'a'), e(0, 'x'),
    e(2, 'b'), e(3, 'c'), e(3, 'y')]))
    .toEqual(['a', 'b', 'c']);
});
test('no errors', () => {
  expect(quiet([])).toEqual([]);
});`,
    hints: [
      'You need to remember one thing as you go: which statement the last error you kept came from.',
      'Keep a variable `last`, starting at `-1` (no statement has that number). For each error, if its `stmt` equals `last`, skip it.',
      'Otherwise set `last = e.stmt;` and push `e.msg`. A `for (const e of errs)` loop with `continue` does it.',
    ],
    walkthrough: `**How to think about it.** This is \`panicMode\` seen from the outside. In the parser, the flag is set by the first error and cleared when the statement ends, so "is the flag set?" means "have I already reported an error in this statement?". Here, the statements are numbered, so the same question becomes "is this error from the statement I last reported?". One variable holding that number plays the part of the flag.

**The solution, line by line.**

- \`const out = [];\` is the list of messages to show.
- \`let last = -1;\` remembers the statement of the last error kept. \`-1\` matches no real statement, so the very first error is always kept.
- \`for (const e of errs) {\` goes through the errors in the order they were found.
- \`if (e.stmt === last) continue;\` is the quiet flag: an error from a statement that already has one is an echo, so \`continue\` skips to the next error without keeping it.
- \`last = e.stmt;\` records that this statement now has its error (setting the flag).
- \`out.push(e.msg);\` keeps the message.
- \`return out;\` hands back what Drip would print.

In the third test, \`a\` is kept (statement 0 is new), \`x\` is dropped (still 0), \`b\` is kept (2 is new), \`c\` is kept (3), and \`y\` is dropped. Because the numbers never go down, comparing with the last one is enough; there is no need to remember every statement seen.

**Common wrong attempts.**

- Keeping the *last* error of each statement instead of the first: the last one is the most likely to be an echo, which is the opposite of what you want.
- Starting \`last\` at \`0\`: the first error of statement 0 is then dropped as if it were an echo.`,
    wrong: [
      {
        code: `function quiet(errs) {
  const out = [];
  let last = 0;
  for (const e of errs) {
    if (e.stmt === last) continue;
    last = e.stmt;
    out.push(e.msg);
  }
  return out;
}`,
        why: 'Starting at `0` makes the first error of statement 0 look like an echo, so it is dropped.',
      },
      {
        code: `function quiet(errs) {
  return errs.map((e) => e.msg);
}`,
        why: 'This keeps every message, echoes included: it is the parser with no panic flag at all.',
      },
    ],
  },
};

export const quiz = [
  {
    q: `Which error does Drip report for this program?
\`\`\`
let x = 1
print x;
\`\`\``,
    options: [
      {
        t: '`line 2: expected \';\' after the variable declaration, found \'print\'`',
        why: 'The parser noticed at `print`, on line 2, but a missing `;` is reported on the line of the token before it, where the `;` belongs.',
      },
      {
        t: '`line 1: expected \';\' after the variable declaration, found \'print\'`',
        correct: true,
        why: 'The parser wanted a `;` and found `print`. The message names that token, and the line is the one where the `;` belongs.',
      },
      {
        t: '`line 2: expected an expression, found \'x\'`',
        why: 'Nothing is wrong with `print x;`.',
      },
      {
        t: 'No error: the newline ends the statement',
        why: 'Drip ignores newlines. Only `;` ends a statement.',
      },
    ],
  },
  {
    q: `Which error does Drip report for this program?
\`\`\`
print 1 +
print 2;
\`\`\``,
    options: [
      {
        t: '`line 1: expected an expression, found \'print\'`',
        why: 'Only a missing `;` is moved to the line before. This error is reported where the parser noticed.',
      },
      {
        t: '`line 1: expected \';\' after the value, found \'print\'`',
        why: 'The value is not finished: the `+` still needs a right operand.',
      },
      {
        t: '`line 2: expected an expression, found \'print\'`',
        correct: true,
        why: 'The `+` needs an operand, and the next token, `print` on line 2, cannot start one.',
      },
      {
        t: 'It prints `1` and then `2`',
        why: 'A program with a syntax error runs nothing.',
      },
    ],
  },
  {
    q: 'What is a **cascading** error?',
    options: [
      {
        t: 'An error inside a nested expression',
        why: 'Depth has nothing to do with it.',
      },
      {
        t: 'An error that stops the parser completely',
        why: 'That would be a parser with no recovery. Cascading errors happen when a parser recovers badly.',
      },
      {
        t: 'An error message that only exists because the parser got lost after an earlier one',
        correct: true,
        why: 'Error recovery aims to report none of them.',
      },
      {
        t: 'A runtime error caused by a syntax error',
        why: 'A program with a syntax error never runs.',
      },
    ],
  },
  {
    q: 'A Drip program prints three lines, but line 40 has a syntax error. What does running it print?',
    options: [
      {
        t: 'The three lines, then the error',
        why: 'The parse finishes before anything runs, and with an error nothing runs at all.',
      },
      {
        t: 'The lines before line 40, then the error',
        why: 'Drip does not interleave parsing and running. The whole program is parsed first.',
      },
      {
        t: 'Only the error, with exit code 70',
        why: '70 is for runtime errors. Syntax errors give 65.',
      },
      {
        t: 'Only the error, with exit code 65',
        correct: true,
        why: '`run` checks `reporter.errors` after parsing and returns before anything is run.',
      },
    ],
  },
  {
    q: 'Drip sometimes skips a statement after an error without checking it, so a second mistake there is only found on the next run. Why is that an acceptable price?',
    options: [
      {
        t: 'Because statements after an error are never checked',
        why: 'They are: the parser picks up again and checks the rest normally. Only a little is skipped.',
      },
      {
        t: 'Because a missed error costs one more run, while a made-up error costs confusion',
        correct: true,
        why: 'Error recovery puts “no echoes” first and “find as many as possible” second.',
      },
      {
        t: 'Because it makes the parser faster',
        why: 'Speed is not the reason; the aim is to avoid cascading errors.',
      },
      {
        t: 'Because Drip only ever reports one error',
        why: 'Drip reports one error per statement, and can report many in one run.',
      },
    ],
  },
  {
    q: 'In panic mode, `synchronize()` is skipping tokens (no braces are open). Which situation makes it stop?',
    options: [
      {
        t: 'The next token is a number',
        why: 'A number is not a statement keyword, so it keeps skipping, even though an expression statement could start with one. Only keywords are trusted as starts.',
      },
      {
        t: 'The next token is `)`',
        why: 'A `)` is in the middle of something. Not a safe point.',
      },
      {
        t: 'The next token is `while`',
        correct: true,
        why: '`while` starts a statement, so it is a synchronisation point.',
      },
      {
        t: 'The previous token is `+`',
        why: 'After a `+` the parser is mid-expression. Not a safe point.',
      },
    ],
  },
  {
    q: 'Why does panic mode sometimes skip a perfectly good statement without checking it?',
    options: [
      {
        t: 'Because the good statement was swallowed while looking for a safe point, as when a missing `;` makes it skip through the next `;`',
        correct: true,
        why: 'Skipping a little too much costs at worst one more run. Inventing errors costs confusion.',
      },
      {
        t: 'It has a bug',
        why: 'It is a deliberate trade-off.',
      },
      {
        t: 'To save time',
        why: 'Speed is not the reason. The reason is to avoid cascading errors.',
      },
      {
        t: 'Because statements after an error can never be parsed',
        why: 'They can: the parser resumes after the safe point and parses the rest normally.',
      },
    ],
  },
  {
    q: 'How many errors does Drip report for `print (1 + ;`?',
    options: [
      {
        t: 'Three: no expression, no `)`, no `;`',
        why: 'That is what a parser with no panic flag would say. The last two are echoes.',
      },
      {
        t: 'Two: no expression and no `)`',
        why: 'The missing `)` is an echo too: it is in the same statement as the first error.',
      },
      {
        t: 'None, because the `;` ends it',
        why: 'The `+` still needs a right operand.',
      },
      {
        t: 'One: `expected an expression, found \';\'`',
        correct: true,
        why: 'The first error sets `panicMode`, and the others in the same statement are dropped.',
      },
    ],
  },
  {
    q: 'In `if x > 1 print x;` the `{` is missing. What does Drip do?',
    options: [
      {
        t: 'Takes `print x;` as the body, as JavaScript would',
        why: 'Drip always needs braces; it does not guess that a single statement is the body.',
      },
      {
        t: 'Reports `expected \'{\' after the condition, found \'print\'`, parses no body, and checks `print x;` as its own statement',
        correct: true,
        why: 'What follows is more likely the next statement than a body, and `print` is a safe point.',
      },
      {
        t: 'Skips to the end of the file',
        why: '`print` is a statement keyword, so the skip stops there at once.',
      },
      {
        t: 'Reports two errors: no `{` and no `}`',
        why: 'Only one is reported; no body is parsed, so no `}` is expected.',
      },
    ],
  },
  {
    q: 'For `a + b = 3;`, Drip reports `cannot assign to this expression`. What happens next?',
    options: [
      {
        t: 'The parser stops: nothing after it is checked',
        why: 'Panic mode resumes after the statement, so later lines are still checked.',
      },
      {
        t: 'It also reports `expected \';\' after the expression, found \'3\'`',
        why: 'That complaint is in the same statement, so the panic flag drops it as an echo.',
      },
      {
        t: 'Only the `3` and the `;` are skipped, and the next statement is checked normally',
        correct: true,
        why: 'The statement wants its `;` and finds the `3`; `synchronize()` skips the `3` and the `;` and stops right after it.',
      },
      {
        t: 'It is a runtime error, so the program runs up to that line',
        why: 'It is found while parsing, before anything runs, and gives exit code 65.',
      },
    ],
  },
];
