// Prefix and infix operators (split from chapter 85): recall prompts,
// examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'prefix-vs-infix': {
    q: 'How does the parser know whether a token is in prefix or infix position?',
    a: 'By whether it already holds a finished operand. With nothing on the left, the token starts an operand (prefix); after one, it joins operands (infix).',
  },
  'minus-two-ways': {
    q: 'What does `-` mean in prefix position, and what does it mean in infix position?',
    a: 'Prefix: negate (`-x`). Infix: subtract (`a - b`).',
  },
  'paren-two-ways': {
    q: 'What does `(` do in prefix position, and what does it do in infix position?',
    a: 'Prefix: it groups an expression, as in `(1 + 2)`. Infix: it calls the operand before it, as in `f(2)`.',
  },
  'call-is-infix': {
    q: 'In Drip’s parser, what kind of operator is the `(` in `f(x)`, and what is its binding power?',
    a: 'An infix operator (it follows the operand `f`), with the highest binding power of all (8 in the chapter’s table, 9 in the companion).',
  },
  'no-prefix-rule': {
    q: 'What does Drip report when a token with no prefix rule, such as `*`, appears where an operand should start?',
    a: '`expected an expression, found \'*\'`: `prefixRule` returns `null` for it.',
  },
  'unary-bp': {
    q: 'Why does `-2 * 3` parse as `(-2) * 3`?',
    a: 'Prefix minus parses its operand with the unary power, which is higher than `*`’s, so the `*` is too weak to get inside the minus.',
  },
  'right-assoc-trick': {
    q: 'How do you make one operator right-associative in a Pratt parser?',
    a: 'Parse its right operand with `pratt(bp - 1)` instead of `pratt(bp)`, so an equal operator on the right is still strong enough to be taken.',
  },
  'assign-outside': {
    q: 'Why does the companion parse `=` in the prefix rule for a name (with a `canAssign` flag) instead of putting it in the binding-power table?',
    a: 'So the value is parsed by `expression()`, which nests `a = b = 5` to the right, and so a bad target is caught: in `a + 1 = 3` the `=` is left over and reported.',
  },
};

export const examples = {
  'two-jobs': {
    title: 'Prefix and infix on every line',
    lang: 'drip',
    code: `fn f(n) { return n * 10; }
let xs = [4, 5];
print -f(2) * 3;
print -xs[1] + 1;
print 10 - -2;
print !false == true;`,
  },
};

export const exercises = {
  'mini-prefix': {
    title: 'Negation and brackets',
    prompt:
      'This is the parser from “Pratt parsing”, with reading an operand moved into `prefix()`. Make `prefix()` handle two tokens in prefix position: `-` (negate) returns `[\'neg\', operand]`, where the operand is parsed with binding power 7; and `(` parses a whole expression, skips the `)` and returns the expression (no node for the brackets). Anything else is a number, as before.',
    starter: `const BP = { '+': 5, '-': 5,
  '*': 6, '/': 6 };

function parse(ts) {
  let i = 0;
  function prefix() {
    const t = ts[i++];
    // your code here
    return t;
  }
  function pratt(minBp) {
    let left = prefix();
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
  '*': 6, '/': 6 };

function parse(ts) {
  let i = 0;
  function prefix() {
    const t = ts[i++];
    if (t === '-') {
      return ['neg', pratt(7)];
    }
    if (t === '(') {
      const e = pratt(0);
      i++; // the ')'
      return e;
    }
    return t;
  }
  function pratt(minBp) {
    let left = prefix();
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
test('a prefix minus', () => {
  expect(parse(t('- 2')))
    .toEqual(['neg', '2']);
});
test('negation binds tighter than *', () => {
  expect(parse(t('- 2 * 3')))
    .toEqual(['*', ['neg', '2'], '3']);
});
test('a minus in each position', () => {
  expect(parse(t('1 - - 2')))
    .toEqual(['-', '1', ['neg', '2']]);
});
test('brackets group', () => {
  expect(parse(t('( 1 + 2 ) * 3')))
    .toEqual(['*', ['+', '1', '2'], '3']);
});
test('plain numbers still work', () => {
  expect(parse(t('1 + 2 * 3')))
    .toEqual(['+', '1', ['*', '2', '3']]);
});`,
    hints: [
      '`prefix()` has already taken one token, `t`. It only runs when the parser holds no operand, so whatever `t` is, it is in prefix position.',
      'If `t` is `-`, the operand comes next: parse it with `pratt(7)`, so that only operators stronger than 7 can get inside the minus, and wrap it as `[\'neg\', ...]`.',
      'If `t` is `(`, parse a whole expression with `pratt(0)` (inside brackets the promise starts again at 0). The loop stops at `)`, because `)` has no binding power; skip it with `i++` and return the expression.',
    ],
    walkthrough: `**How to think about it.** The loop in \`pratt\` never changes: it only ever deals with tokens in infix position. Everything new happens in \`prefix()\`, which runs exactly when the parser holds no operand yet, so the token it has just taken is in prefix position by definition. Ask, for each token that can start an operand, "what comes after it, and how strongly should it hold on?" A minus is followed by its operand, which it holds more tightly than any binary operator. A bracket is followed by a whole expression and then a \`)\`.

**The solution, line by line.**

- \`function prefix() {\` is the reader of operands, the prefix half of the parser.
- \`const t = ts[i++];\` takes the token that starts the operand.
- \`if (t === '-') {\` asks whether it is a minus. In prefix position that means negate, never subtract.
- \`return ['neg', pratt(7)];\` parses the operand with a promise of 7, higher than every binary operator in \`BP\`, so in \`- 2 * 3\` the call returns just \`'2'\` when it meets the \`*\` (6 is not above 7). The node is labelled \`'neg'\` so it cannot be confused with a subtraction node, which has three entries.
- \`if (t === '(') {\` asks whether it is an opening bracket. In prefix position that means grouping.
- \`const e = pratt(0);\` parses the inside with a promise of 0: brackets reset the contest, so everything inside belongs to the group. The loop inside stops at the \`)\`, because \`BP[')']\` is \`undefined\`.
- \`i++; // the ')'\` steps over the closing bracket, which \`pratt\` left in place.
- \`return e;\` hands back the inner tree itself; the brackets have done their job (deciding the grouping) and need no node of their own.
- \`return t;\` is reached for anything else: a number, which is a whole operand by itself.

The \`pratt\` function is unchanged except that it calls \`prefix()\`. Trace \`1 - - 2\`: \`prefix()\` returns \`'1'\`; the loop takes the first \`-\` (5 > 0) as an infix operator and calls \`pratt(5)\`; that call's \`prefix()\` takes the second \`-\`, which is in prefix position, and returns \`['neg', '2']\`; so the answer is \`['-', '1', ['neg', '2']]\`.

**Common wrong attempts.**

- \`['neg', pratt(0)]\`: the minus then swallows everything after it, so \`- 2 * 3\` becomes \`['neg', ['*', '2', '3']]\`. That happens to give the same number for \`*\`, but not for \`- 2 + 3\`, which would be \`-5\` instead of \`1\`.
- Forgetting \`i++\` for the \`)\`: \`pratt\` returns to the outer loop with the \`)\` still next; it has no binding power, so the outer loop stops too, and \`( 1 + 2 ) * 3\` comes out as just \`['+', '1', '2']\`, with the \`* 3\` never read.`,
    wrong: [
      {
        code: `const BP = { '+': 5, '-': 5,
  '*': 6, '/': 6 };

function parse(ts) {
  let i = 0;
  function prefix() {
    const t = ts[i++];
    if (t === '-') {
      return ['neg', pratt(0)];
    }
    if (t === '(') {
      const e = pratt(0);
      i++; // the ')'
      return e;
    }
    return t;
  }
  function pratt(minBp) {
    let left = prefix();
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
        why: 'With `pratt(0)` the minus swallows every operator after it: `- 2 * 3` becomes `[\'neg\', [\'*\', \'2\', \'3\']]` instead of `[\'*\', [\'neg\', \'2\'], \'3\']`.',
      },
      {
        code: `const BP = { '+': 5, '-': 5,
  '*': 6, '/': 6 };

function parse(ts) {
  let i = 0;
  function prefix() {
    const t = ts[i++];
    if (t === '-') {
      return ['neg', pratt(7)];
    }
    if (t === '(') {
      return pratt(0);
    }
    return t;
  }
  function pratt(minBp) {
    let left = prefix();
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
        why: 'The `)` is never skipped, so it stays next and stops every loop above it: `( 1 + 2 ) * 3` returns `[\'+\', \'1\', \'2\']` and the `* 3` is never read.',
      },
    ],
  },
  'power-right': {
    optional: true,
    title: 'A right-associative power operator',
    prompt:
      'Add `^` (power) to the parser from “Pratt parsing”. It binds tighter than `*` (give it 7), and it groups to the **right**: `2 ^ 3 ^ 2` must be `[\'^\', \'2\', [\'^\', \'3\', \'2\']]`. Every other operator stays left-associative.',
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
      'Keep a small table of which operators are right-associative, `const RIGHT = { \'^\': true };`, and pass `bp - 1` for those and `bp` for the rest.',
    ],
    walkthrough: `**How to think about it.** Associativity is decided by one thing only: what the inner call does when it meets an operator of the *same* power. With \`pratt(bp)\` the test \`7 <= 7\` stops it, so the outer call takes the second \`^\` and the chain leans left. You want the inner call to take it instead, so lower its promise by exactly one: low enough to let another \`^\` in, and no lower, so that weaker operators are still kept out.

**The solution, line by line.**

- \`const BP = { ..., '^': 7 };\` gives \`^\` the highest power, as in the starter.
- \`const RIGHT = { '^': true };\` records which operators lean right. Looking up any other operator gives \`undefined\`, which counts as false.
- The loop is unchanged up to \`const op = ts[i++];\`.
- \`const r = RIGHT[op] ? bp - 1 : bp;\` picks the promise for the right side: one less than the operator's power for \`^\`, the power itself for everything else.
- \`left = [op, left, pratt(r)];\` parses the right side with that promise.

Why it works for \`2 ^ 3 ^ 2\`: the right side of the first \`^\` is parsed with \`minBp = 6\`. The second \`^\` has power 7, and \`7 > 6\`, so the inner call takes it, and the second \`^\` nests inside the first. Why it is not too low: in \`2 ^ 3 * 4\`, the inner call meets \`*\` (6), and \`6 <= 6\` still stops it, so \`^\` gets only \`3\` and the \`*\` takes the whole \`2 ^ 3\`. Drip itself gets the same right-leaning effect for \`=\` in a different way, by parsing the value with \`expression()\`.

**Common wrong attempts.**

- Using \`pratt(bp - 1)\` for every operator: that makes \`-\` right-associative too, so \`1 - 2 - 3\` becomes \`1 - (2 - 3)\`.
- Using \`pratt(0)\` for \`^\`: the right side then swallows weaker operators as well, so \`2 ^ 3 * 4\` becomes \`2 ^ (3 * 4)\`.`,
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
    q: 'Why does `-2 * 3` parse as `(-2) * 3` in Drip?',
    options: [
      { t: 'Because the scanner reads `-2` as one number token', why: 'Drip’s scanner makes `-` its own token. The grouping is the parser’s doing.' },
      { t: 'Because prefix minus parses its operand with the unary power, and `*` is too weak to be taken', correct: true, why: 'The prefix rule’s promise is higher than `*`’s power, so it stops before the `*` and returns just `2`.' },
      { t: 'Because `*` always comes last', why: 'There is no such rule. The binding powers decide.' },
      { t: 'Because operators are read right to left', why: 'The parser reads left to right. The comparison of powers decides the grouping.' },
    ],
  },
  {
    q: 'In Drip, what is the `(` in `f(1)`?',
    options: [
      { t: 'A prefix operator that starts a grouping', why: 'That is the job of a `(` with nothing on its left, as in `(1 + 2)`.' },
      { t: 'An infix operator with the highest binding power', correct: true, why: 'It follows a finished operand (`f`), so it is infix, and calls bind tighter than anything else, so `-f(1)` negates the result of the call.' },
      { t: 'Part of the identifier `f(`', why: 'Names cannot contain `(`. The scanner makes it its own token.' },
      { t: 'Not an operator: calls are handled by the statement parser', why: 'Calls are expressions, and in Drip they go through `infix`.' },
    ],
  },
  {
    q: 'What does Drip report for `print * 2;`?',
    options: [
      { t: '`line 1: expected an expression, found \'*\'`', correct: true, why: 'The `*` is in prefix position, where it has no rule, so `prefixRule` returns `null`.' },
      { t: '`line 1: cannot assign to this expression`', why: 'Nothing is being assigned here.' },
      { t: 'It prints `2`', why: 'Drip has no prefix `*`; the parser does not skip it.' },
      { t: '`line 1: expected \';\' after the value, found \'*\'`', why: 'The parser fails earlier than that: it cannot even start the value.' },
    ],
  },
  {
    q: 'You want a new operator `@` to be **right**-associative with power 6. What do you pass when parsing its right operand?',
    options: [
      { t: '`pratt(6)`', why: 'That makes it left-associative, like `*`: an equal operator on the right stops the inner call.' },
      { t: '`pratt(0)`', why: 'That swallows every operator to the right, including weaker ones like `+`.' },
      { t: '`pratt(7)`', why: 'That stops even another `@` (6 is not above 7), so `@` would group to the left again.' },
      { t: '`pratt(5)`', correct: true, why: 'With `bp - 1`, another `@` (6 > 5) is taken by the inner call and nests right, while `+` (5) is still left outside.' },
    ],
  },
  {
    q: 'Why is assignment handled by the parser rules for its targets (a name, `.` and `[`) instead of being another entry in the binding-power table?',
    options: [
      { t: 'Because `=` is a keyword', why: 'It is an ordinary single-character token.' },
      { t: 'Because assignment is a statement, not an expression', why: 'In Drip assignment is an expression: `print a = 3;` prints 3.' },
      { t: 'Because only a name, a field or an element may be assigned to, and the value must nest to the right', correct: true, why: 'Those rules check for `=` themselves (when `canAssign` allows it) and parse the value with `expression()`; an `=` left over after anything else is reported as `cannot assign to this expression`.' },
      { t: 'Because the table can only hold left-associative operators', why: 'The table holds powers. Associativity comes from what you pass when recursing, and that could be changed for one operator.' },
    ],
  },
];
