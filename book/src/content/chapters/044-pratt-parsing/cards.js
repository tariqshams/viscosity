// Chapter 44 cards: recall prompts, examples, exercises and quiz.
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
  'prefix-vs-infix': {
    q: 'How does the parser know whether a token is in prefix or infix position?',
    a: 'By whether it already holds a finished left operand. With nothing on the left, the token starts an operand (prefix); after one, it joins operands (infix).',
  },
  'minus-two-ways': {
    q: 'What does `-` mean in prefix position, and what does it mean in infix position?',
    a: 'Prefix: negate (`-x`). Infix: subtract (`a - b`).',
  },
  'call-is-infix': {
    q: 'In Drip’s parser, what kind of operator is the `(` in `f(x)`, and what is its binding power?',
    a: 'An infix operator (it follows the operand `f`), with binding power 8, the strongest.',
  },
  'minbp-meaning': {
    q: 'What promise does the `minBp` argument of `pratt(minBp)` stand for?',
    a: '“Only take operators stronger than this.” It is the binding power of the operator whose right operand is being parsed.',
  },
  'top-level-zero': {
    q: 'Why does the parser start with `pratt(0)`?',
    a: 'At the top there is no operator waiting for an operand, so every operator is strong enough to be taken.',
  },
  'equal-stops': {
    q: 'In the loop’s test `bp <= minBp`, what would change if it were `bp < minBp`?',
    a: 'Equal-power operators would nest to the right: `1 - 2 - 3` would parse as `1 - (2 - 3)`, giving 2 instead of -4.',
  },
  'right-assoc-trick': {
    q: 'How do you make one operator right-associative in a Pratt parser?',
    a: 'Parse its right operand with `pratt(bp - 1)` instead of `pratt(bp)`, so an equal operator on the right is still strong enough to be taken.',
  },
  'assign-outside': {
    q: 'Why does Drip parse `=` outside the Pratt loop, in `assignment()`?',
    a: 'So it can recurse for right associativity (`a = b = 5`), and check the target after it is parsed (`a + b = 3` is not a valid target).',
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
      'Inside the loop: look at `ts[i]` without moving `i`, and find its binding power in `BP`. A number, or running off the end, gives `undefined`.',
      'Stop (break) when there is no binding power, or when it is not bigger than `minBp`.',
      'Otherwise take the operator (`ts[i++]`), parse its right side with `pratt(bp)`, and make `[op, left, right]` the new `left`.',
    ],
    walkthrough: `This is the loop from the chapter with the token helpers spelled out.

- **Prefix.** Every operand here is a single number, so “parse a prefix” is just \`ts[i++]\`.
- **Peek.** \`BP[ts[i]]\` is the binding power of the next token, or \`undefined\` for a number or for the end of the array (\`ts[i]\` is then \`undefined\`, and \`BP[undefined]\` is \`undefined\` too).
- **The test.** \`!bp || bp <= minBp\` stops for non-operators and for operators that are not stronger than the promise. The \`<=\` (not \`<\`) is what makes \`1 - 2 - 3\` group to the left.
- **Absorb.** Eat the operator, then recurse with \`pratt(bp)\`: the right operand may only contain operators stronger than this one. The new node becomes \`left\`, and the loop goes round to see whether something even weaker wants the whole thing.

Trace \`2 * 3 + 4\`: the top loop takes \`*\`, \`pratt(6)\` returns \`'3'\` when it sees \`+\` (5 is not above 6), so \`left\` becomes \`['*', '2', '3']\`. The top loop then takes \`+\` (5 > 0).`,
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
  'power-right': {
    optional: true,
    title: 'A right-associative power operator',
    prompt:
      'Add `^` (power) to the parser. It binds tighter than `*` (give it 7), and it groups to the **right**: `2 ^ 3 ^ 2` must be `[\'^\', \'2\', [\'^\', \'3\', \'2\']]`. Every other operator stays left-associative.',
    starter: `const BP = { '+': 5, '-': 5,
  '*': 6, '/': 6, '^': 7 };

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
    solution: `const BP = { '+': 5, '-': 5,
  '*': 6, '/': 6, '^': 7 };
const RIGHT = { '^': true };

function parse(ts) {
  let i = 0;
  function pratt(minBp) {
    let left = ts[i++];
    for (;;) {
      const bp = BP[ts[i]];
      if (!bp || bp <= minBp) break;
      const op = ts[i++];
      const r = RIGHT[op] ? bp - 1 : bp;
      left = [op, left, pratt(r)];
    }
    return left;
  }
  return pratt(0);
}`,
    tests: `const t = (s) => s.split(' ');
test('^ groups to the right', () => {
  expect(parse(t('2 ^ 3 ^ 2')))
    .toEqual(['^', '2', ['^', '3', '2']]);
});
test('^ binds tighter than *', () => {
  expect(parse(t('2 * 3 ^ 2')))
    .toEqual(['*', '2', ['^', '3', '2']]);
});
test('* after ^ still waits', () => {
  expect(parse(t('2 ^ 3 * 4')))
    .toEqual(['*', ['^', '2', '3'], '4']);
});
test('- is still left-associative', () => {
  expect(parse(t('1 - 2 - 3')))
    .toEqual(['-', ['-', '1', '2'], '3']);
});`,
    hints: [
      'The only change is the number passed to the recursive call for the right operand.',
      'If the right side is parsed with `pratt(bp - 1)`, is another `^` (bp 7) strong enough to be taken? Is a `*` (bp 6)?',
      'Keep a small table of which operators are right-associative, and pick `bp - 1` for those and `bp` for the rest.',
    ],
    walkthrough: `Right associativity is one subtraction.

- **Why \`bp - 1\`?** The right side of \`^\` is parsed with \`minBp = 6\`. The next \`^\` has power 7, and \`7 > 6\`, so the inner call takes it: the second \`^\` nests inside the first. That is grouping to the right.
- **Why not lower?** A \`*\` has power 6, and \`6 <= 6\` still stops it. So in \`2 ^ 3 * 4\` the \`^\` gets only \`3\`, and the \`*\` takes the whole \`2 ^ 3\`. If you used \`pratt(0)\`, the \`*\` would be swallowed too.
- **Everything else** keeps \`pratt(bp)\`, so subtraction still groups to the left.

Drip itself gets the same effect for \`=\` by calling \`assignment()\` again for the value.`,
    wrong: [
      {
        code: `const BP = { '+': 5, '-': 5,
  '*': 6, '/': 6, '^': 7 };

function parse(ts) {
  let i = 0;
  function pratt(minBp) {
    let left = ts[i++];
    for (;;) {
      const bp = BP[ts[i]];
      if (!bp || bp <= minBp) break;
      const op = ts[i++];
      left = [op, left, pratt(bp - 1)];
    }
    return left;
  }
  return pratt(0);
}`,
        why: 'This makes *every* operator right-associative, so `1 - 2 - 3` becomes `1 - (2 - 3)`. Only `^` should use `bp - 1`.',
      },
      {
        code: `const BP = { '+': 5, '-': 5,
  '*': 6, '/': 6, '^': 7 };
const RIGHT = { '^': true };

function parse(ts) {
  let i = 0;
  function pratt(minBp) {
    let left = ts[i++];
    for (;;) {
      const bp = BP[ts[i]];
      if (!bp || bp <= minBp) break;
      const op = ts[i++];
      const r = RIGHT[op] ? 0 : bp;
      left = [op, left, pratt(r)];
    }
    return left;
  }
  return pratt(0);
}`,
        why: 'With `pratt(0)` the right side of `^` swallows weaker operators too: `2 ^ 3 * 4` becomes `2 ^ (3 * 4)`.',
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
      { t: 'It takes the `-` as a unary minus', why: 'The loop already holds a left operand, so this `-` is in infix position.' },
      { t: 'It returns what it has, leaving the `-` for the caller', correct: true, why: '`5 <= 5`, so it breaks. The outer loop will take the `-`, which makes `+` and `-` group to the left.' },
    ],
  },
  {
    q: 'Why does `-2 * 3` parse as `(-2) * 3` in Drip?',
    options: [
      { t: 'Because the scanner reads `-2` as one number token', why: 'Drip’s scanner makes `-` its own token. The grouping is the parser’s doing.' },
      { t: 'Because unary minus parses its operand with `pratt(7)`, and `*` (6) is too weak to be taken', correct: true, why: 'The prefix handler’s promise is 7, so it stops before the `*` and returns just `2`.' },
      { t: 'Because `*` always comes last', why: 'There is no such rule. The binding powers decide.' },
      { t: 'Because operators are read right to left', why: 'The parser reads left to right. The comparison of powers decides the grouping.' },
    ],
  },
  {
    q: 'In Drip, what is the `(` in `f(1)`?',
    options: [
      { t: 'An infix operator with binding power 8', correct: true, why: 'It follows a finished operand (`f`), so it is infix. Power 8 makes calls bind tighter than anything else, so `-f(1)` negates the result of the call.' },
      { t: 'A prefix operator that starts a grouping', why: 'That is the meaning of a `(` with nothing on its left, as in `(1 + 2)`.' },
      { t: 'Part of the identifier `f(`', why: 'Names cannot contain `(`. The scanner makes it its own token.' },
      { t: 'Not an operator: calls are handled by the statement parser', why: 'Calls are expressions, and in Drip they go through `infix`.' },
    ],
  },
  {
    q: 'You want a new operator `@` to be **right**-associative with power 6. What do you pass when parsing its right operand?',
    options: [
      { t: '`pratt(6)`', why: 'That makes it left-associative, like `*`: an equal operator on the right stops the inner call.' },
      { t: '`pratt(0)`', why: 'That swallows every operator to the right, including weaker ones like `+`.' },
      { t: '`pratt(5)`', correct: true, why: 'With `bp - 1`, another `@` (6 > 5) is taken by the inner call and nests right, while `+` (5) is still left outside.' },
      { t: '`pratt(7)`', why: 'That stops even another `@` (6 is not above 7), so `@` would group to the left again.' },
    ],
  },
  {
    q: 'Why is assignment handled in `assignment()` instead of being another entry in the `BP` table?',
    options: [
      { t: 'Because `=` is a keyword', why: 'It is an ordinary single-character token.' },
      { t: 'Because assignment is a statement, not an expression', why: 'In Drip assignment is an expression: `print a = 3;` prints 3.' },
      { t: 'Because the table can only hold left-associative operators', why: 'The table holds powers. Associativity comes from what you pass when recursing, and that could be changed for one operator.' },
      { t: 'Because the target can only be checked after it has been parsed, and the value must nest to the right', correct: true, why: '`assignment()` parses the left side, sees `=`, recurses for the value, then checks the left side is a name or property.' },
    ],
  },
];
