// Chapter 85 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'bp-what': {
    q: 'What is an operator’s **binding power**?',
    a: 'A number saying how strongly the operator holds the operands beside it. Higher numbers bind tighter.',
  },
  'bp-compete': {
    q: 'In `1 + 2 * 3`, two operators compete for the `2`. Which one gets it, and why?',
    a: 'The `*`, because its binding power (6) is higher than the `+`’s (5).',
  },
  'pratt-vs-ladder': {
    q: 'What does a Pratt parser use in place of one function per precedence level?',
    a: 'A table of binding powers and a single loop that compares them.',
  },
  'minbp-meaning': {
    q: 'What promise does the `minBp` argument of `pratt(minBp)` stand for?',
    a: '“Only take operators stronger than this.” It is the binding power of the operator whose right operand is being parsed.',
  },
  'top-level-zero': {
    q: 'Why does the parser start with `pratt(0)`?',
    a: 'At the top there is no operator waiting for an operand, so every operator is strong enough to be taken.',
  },
  'no-bp-stops': {
    q: 'How does the Pratt loop know that an expression has ended, say at a `;` or a `)`?',
    a: 'The next token has no binding power (it is not in the table), so the loop’s test fails and it stops.',
  },
  'equal-stops': {
    q: 'In the loop’s test `bp <= minBp`, what would change if it were `bp < minBp`?',
    a: 'Equal-power operators would nest to the right: `1 - 2 - 3` would parse as `1 - (2 - 3)`, giving 2 instead of -4.',
  },
  'tie-left': {
    q: 'Two operators with the same binding power compete for the operand between them. Which one gets it?',
    a: 'The one on the left. That is why `1 - 2 - 3` means `(1 - 2) - 3`.',
  },
};

export const examples = {
  groupings: {
    title: 'How these group',
    lang: 'drip',
    code: `print 1 + 2 * 3 - 4;
print 1 - 2 - 3;
print -2 * 3;
print (1 + 2) * 3;
print 2 * 3 == 6;
print 8 / 4 / 2;`,
  },
};

export const exercises = {
  'mini-pratt': {
    title: 'A Pratt parser in twenty lines',
    prompt:
      'Finish `parse(ts)`. The tokens are strings like `[\'1\', \'+\', \'2\']`. Return a tree where a number is its string and an operator node is an array `[op, left, right]`. So `1 + 2 * 3` gives `[\'+\', \'1\', [\'*\', \'2\', \'3\']]`. Use the binding powers in `BP`, and make every operator left-associative.',
    starter: `const BP = { '+': 5, '-': 5,
  '*': 6, '/': 6 };

function parse(ts) {
  let i = 0;
  function pratt(minBp) {
    let left = ts[i++];
    // your loop here
    return left;
  }
  return pratt(0);
}`,
    solution: `const BP = { '+': 5, '-': 5,
  '*': 6, '/': 6 };

function parse(ts) {
  let i = 0;
  function pratt(minBp) {
    let left = ts[i++];
    for (;;) {
      const bp = BP[ts[i]];
      if (!bp || bp <= minBp) break;
      const op = ts[i++];
      left = [op, left, pratt(bp)];
    }
    return left;
  }
  return pratt(0);
}`,
    tests: `const t = (s) => s.split(' ');
test('a lone number', () => {
  expect(parse(['7'])).toBe('7');
});
test('* binds tighter than + (right)', () => {
  expect(parse(t('1 + 2 * 3')))
    .toEqual(['+', '1', ['*', '2', '3']]);
});
test('* binds tighter than + (left)', () => {
  expect(parse(t('2 * 3 + 4')))
    .toEqual(['+', ['*', '2', '3'], '4']);
});
test('- is left-associative', () => {
  expect(parse(t('1 - 2 - 3')))
    .toEqual(['-', ['-', '1', '2'], '3']);
});
test('the chapter example', () => {
  expect(parse(t('1 + 2 * 3 - 4'))).toEqual(
    ['-', ['+', '1', ['*', '2', '3']], '4']);
});`,
    hints: [
      'The loop goes where the comment is. Each time round it has one question to answer: should this call take the next token as an operator?',
      'Look at `ts[i]` without moving `i`, and find its binding power in `BP`. A number, or running off the end of the array, gives `undefined`. Stop (`break`) when there is no binding power, or when it is not bigger than `minBp`.',
      'Otherwise take the operator with `ts[i++]`, parse its right side with `pratt(bp)`, and make `[op, left, right]` the new `left`: `left = [op, left, pratt(bp)];`.',
    ],
    walkthrough: `**How to think about it.** Everything outside the loop is already written: \`i\` points at the next token, and \`pratt\` reads one operand with \`ts[i++]\` (every operand here is a single number, so that is all "read a prefix" needs to do). What is missing is the part of the chapter's loop that decides, again and again, whether this call should take the next operator. Say the rule aloud first: "while the next token is an operator stronger than my promise, take it, parse its right side with a promise of its own power, and wrap everything so far as the left side." Then write that sentence as code.

**The solution, line by line.**

- \`const BP = { '+': 5, '-': 5, '*': 6, '/': 6 };\` is the table of binding powers, given in the starter. Any string not in it, such as \`'7'\`, has no entry, so looking it up gives \`undefined\`.
- \`let i = 0;\` is the position of the next token. Both \`pratt\` and the loop share it, because \`pratt\` is a nested function and can see \`i\`.
- \`let left = ts[i++];\` reads the first operand and moves past it.
- \`for (;;) {\` starts a loop with no condition of its own; the only way out is the \`break\` below.
- \`const bp = BP[ts[i]];\` peeks at the next token (no \`++\`, so it is not taken) and looks up its power. For a number, and for \`ts[i]\` past the end of the array (which is \`undefined\`, and \`BP[undefined]\` is \`undefined\` too), this is \`undefined\`.
- \`if (!bp || bp <= minBp) break;\` is the whole contest. \`!bp\` is true when there is no power, so the expression has ended; \`bp <= minBp\` is true when the operator is not strictly stronger than this call's promise, so it belongs to a caller. The \`<=\`, rather than \`<\`, is what makes \`1 - 2 - 3\` lean left.
- \`const op = ts[i++];\` takes the operator.
- \`left = [op, left, pratt(bp)];\` parses the right operand with a promise of \`bp\` (so it may only contain tighter operators), and builds a new node with everything so far on the left. The loop then goes round, to see whether something even weaker wants the whole thing.
- \`return left;\` hands the finished tree back to whoever called: the outer loop, or \`parse\`.
- \`return pratt(0);\` starts with a promise of 0, so the top call takes every operator.

Trace \`2 * 3 + 4\`: the top loop reads \`'2'\`, peeks \`*\` (6 > 0) and takes it; \`pratt(6)\` reads \`'3'\`, peeks \`+\` (5 is not above 6) and returns \`'3'\`; so \`left\` becomes \`['*', '2', '3']\`. The top loop then peeks \`+\` (5 > 0), takes it, and \`pratt(5)\` returns \`'4'\` at the end of the array, giving \`['+', ['*', '2', '3'], '4']\`.

**Common wrong attempts.**

- Writing \`bp < minBp\`: an operator of equal power is then taken by the inner call, so \`1 - 2 - 3\` comes out as \`['-', '1', ['-', '2', '3']]\`, which leans right and is \`2\` instead of \`-4\`.
- Recursing with \`pratt(0)\`: the right side forgets the promise and swallows every operator after it, so \`2 * 3 + 4\` becomes \`2 * (3 + 4)\`.
- Forgetting \`!bp\`: \`undefined <= minBp\` is \`false\` in JavaScript, so the loop would try to take a number or the end of the array as an operator.`,
    wrong: [
      {
        code: `const BP = { '+': 5, '-': 5,
  '*': 6, '/': 6 };

function parse(ts) {
  let i = 0;
  function pratt(minBp) {
    let left = ts[i++];
    for (;;) {
      const bp = BP[ts[i]];
      if (!bp || bp < minBp) break;
      const op = ts[i++];
      left = [op, left, pratt(bp)];
    }
    return left;
  }
  return pratt(0);
}`,
        why: 'With `<`, an operator of equal power is still taken by the inner call, so `1 - 2 - 3` becomes `[\'-\', \'1\', [\'-\', \'2\', \'3\']]`: right-associative, and wrong for subtraction.',
      },
      {
        code: `const BP = { '+': 5, '-': 5,
  '*': 6, '/': 6 };

function parse(ts) {
  let i = 0;
  function pratt(minBp) {
    let left = ts[i++];
    for (;;) {
      const bp = BP[ts[i]];
      if (!bp || bp <= minBp) break;
      const op = ts[i++];
      left = [op, left, pratt(0)];
    }
    return left;
  }
  return pratt(0);
}`,
        why: 'Recursing with `pratt(0)` drops the promise: the right side swallows every operator after it. `2 * 3 + 4` becomes `2 * (3 + 4)`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Using Drip’s binding powers, how does `1 * 2 + 3 * 4` group?',
    options: [
      { t: '`((1 * 2) + 3) * 4`', why: 'That would need `+` to bind tighter than the second `*`. It doesn’t: 5 is less than 6.' },
      { t: '`(1 * 2) + (3 * 4)`', correct: true, why: 'Each `*` (6) wins its operands from the `+` (5), and the `+` joins the two products.' },
      { t: '`1 * (2 + (3 * 4))`', why: 'The first `*` takes `2` before the `+` gets a chance, because 6 > 5.' },
      { t: '`1 * ((2 + 3) * 4)`', why: 'Only parentheses in the source could put `2 + 3` together here.' },
    ],
  },
  {
    q: 'The loop is inside `pratt(5)` (parsing the right side of a `+`) and peeks at a `-`. What happens?',
    options: [
      { t: 'It takes the `-`, because `-` has binding power 5', why: 'Taking needs a power strictly greater than `minBp`. 5 is not greater than 5.' },
      { t: 'It reports a syntax error', why: 'Nothing is wrong. The `-` is simply left for a caller to take.' },
      { t: 'It skips the `-` and carries on', why: 'The loop never skips tokens; it either takes the operator or stops and leaves it where it is.' },
      { t: 'It returns what it has, leaving the `-` for the caller', correct: true, why: '`5 <= 5`, so it breaks. The outer loop will take the `-`, which makes `+` and `-` group to the left.' },
    ],
  },
  {
    q: 'With Drip’s powers (`<` is 4, `==` is 3), how does `a < b == c < d` group?',
    options: [
      { t: '`(a < b) == (c < d)`', correct: true, why: 'Each `<` (4) beats the `==` (3) for the operand between them, so both comparisons are finished before `==` joins them.' },
      { t: '`a < (b == c) < d`', why: 'That would need `==` to win `b` and `c`, but its power is lower than both `<`s.' },
      { t: '`((a < b) == c) < d`', why: 'The `c` is contested by `==` (3) and the second `<` (4); the `<` wins it.' },
      { t: 'It is a syntax error without brackets', why: 'The binding powers settle every contest, so no brackets are needed.' },
    ],
  },
  {
    q: 'What does Drip report for `print 1 2;`, and why?',
    options: [
      { t: '`expected an expression, found \'2\'`', why: 'The parser never tries to start an operand at the `2`; the loop only peeks at it.' },
      { t: '`expected \';\' after the value, found \'2\'`', correct: true, why: 'The `2` has no binding power, so the loop stops after `1`, and the `print` statement then wants its `;`.' },
      { t: 'Nothing: it prints `1` and then `2`', why: 'A `print` statement takes one expression and then a `;`; two operands side by side do not fit the grammar.' },
      { t: '`expected an operator, found \'2\'`', why: 'Drip has no such message; the expression simply ends where the loop stops.' },
    ],
  },
  {
    q: 'You change the loop’s test from `bp <= minBp` to `bp < minBp`. What does `8 / 4 / 2` now evaluate to?',
    options: [
      { t: '`1`, as before', why: 'That is the left grouping, which the original `<=` gives.' },
      { t: '`4`', correct: true, why: 'Equal operators are now taken by the inner call, so it groups as `8 / (4 / 2)`, which is `8 / 2`.' },
      { t: '`0.25`', why: 'That would be `(4 / 2) / 8`; the operands never change order.' },
      { t: 'It loops for ever', why: 'Every call still takes at least one token, so it finishes; only the grouping changes.' },
    ],
  },
];
