// Chapter 64 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'bp-what': {
    q: 'What is an operator’s **binding power**?',
    a: 'A number saying how strongly the operator holds the operands beside it. Higher numbers bind tighter.',
  },
  'bp-compete': {
    q: 'In `1 + 2 * 3`, two operators compete for the `2`. Which one gets it, and why?',
    a: 'The `*`, because its binding power is higher than the `+`’s.',
  },
  'pratt-vs-ladder': {
    q: 'What does a Pratt parser use in place of one function per precedence level?',
    a: 'A table of binding powers and a single loop that compares them.',
  },
  'minbp-meaning': {
    q: 'In a Pratt parser, what promise does the `minBp` argument of `pratt(minBp)` stand for?',
    a: '“Only take operators stronger than this.” It is the binding power of the operator whose right operand is being parsed.',
  },
  'no-bp-stops': {
    q: 'How does the Pratt loop know that an expression has ended, say at a `;` or a `)`?',
    a: 'The next token has no binding power (it is not in the table), so the loop’s test fails and it stops.',
  },
  'tie-left': {
    q: 'Two operators with the same binding power compete for the operand between them. Which one gets it?',
    a: 'The one on the left. That is why `1 - 2 - 3` means `(1 - 2) - 3`.',
  },
  'prefix-vs-infix': {
    q: 'How does a Pratt parser know whether a token is in prefix or infix position?',
    a: 'By whether it already holds a finished operand. With nothing on the left, the token starts an operand (prefix); after one, it joins operands (infix).',
  },
  'minus-two-ways': {
    q: 'What does `-` mean in prefix position, and what does it mean in infix position?',
    a: 'Prefix: negate (`-x`). Infix: subtract (`a - b`).',
  },
  'unary-bp': {
    q: 'In Drip, why does `-2 * 3` parse as `(-2) * 3`?',
    a: 'Prefix minus parses its operand with the unary power, which is higher than `*`’s, so the `*` is too weak to get inside the minus.',
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
  'mini-pratt': {
    title: 'A Pratt parser in twenty lines',
    prompt: 'Finish `parse(ts)`. The tokens are strings like `[\'1\', \'+\', \'2\']`. Return a tree where a number is its string and an operator node is an array `[op, left, right]`. So `1 + 2 * 3` gives `[\'+\', \'1\', [\'*\', \'2\', \'3\']]`. Use the binding powers in `BP`, and make every operator left-associative.',
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
  'mini-prefix': {
    optional: true,
    title: 'Negation and brackets',
    prompt: 'This is the parser from “Pratt parsing”, with reading an operand moved into `prefix()`. Make `prefix()` handle two tokens in prefix position: `-` (negate) returns `[\'neg\', operand]`, where the operand is parsed with binding power 7; and `(` parses a whole expression, skips the `)` and returns the expression (no node for the brackets). Anything else is a number, as before.',
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
    prompt: 'Add `^` (power) to the parser from “Pratt parsing”. It binds tighter than `*` (give it 7), and it groups to the **right**: `2 ^ 3 ^ 2` must be `[\'^\', \'2\', [\'^\', \'3\', \'2\']]`. Every other operator stays left-associative.',
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
    q: 'Using Drip’s binding powers, how does `1 * 2 + 3 * 4` group?',
    options: [
      {
        t: '`((1 * 2) + 3) * 4`',
        why: 'That would need `+` to bind tighter than the second `*`. It doesn’t: 5 is less than 6.',
      },
      {
        t: '`(1 * 2) + (3 * 4)`',
        correct: true,
        why: 'Each `*` (6) wins its operands from the `+` (5), and the `+` joins the two products.',
      },
      {
        t: '`1 * (2 + (3 * 4))`',
        why: 'The first `*` takes `2` before the `+` gets a chance, because 6 > 5.',
      },
      {
        t: '`1 * ((2 + 3) * 4)`',
        why: 'Only parentheses in the source could put `2 + 3` together here.',
      },
    ],
  },
  {
    q: 'A Pratt parser’s loop is inside `pratt(5)` (parsing the right side of a `+`) and peeks at a `-`. What happens?',
    options: [
      {
        t: 'It takes the `-`, because `-` has binding power 5',
        why: 'Taking needs a power strictly greater than `minBp`. 5 is not greater than 5.',
      },
      {
        t: 'It reports a syntax error',
        why: 'Nothing is wrong. The `-` is simply left for a caller to take.',
      },
      {
        t: 'It skips the `-` and carries on',
        why: 'The loop never skips tokens; it either takes the operator or stops and leaves it where it is.',
      },
      {
        t: 'It returns what it has, leaving the `-` for the caller',
        correct: true,
        why: '`5 <= 5`, so it breaks. The outer loop will take the `-`, which makes `+` and `-` group to the left.',
      },
    ],
  },
  {
    q: 'With Drip’s powers (`<` is 4, `==` is 3), how does `a < b == c < d` group?',
    options: [
      {
        t: '`(a < b) == (c < d)`',
        correct: true,
        why: 'Each `<` (4) beats the `==` (3) for the operand between them, so both comparisons are finished before `==` joins them.',
      },
      {
        t: '`a < (b == c) < d`',
        why: 'That would need `==` to win `b` and `c`, but its power is lower than both `<`s.',
      },
      {
        t: '`((a < b) == c) < d`',
        why: 'The `c` is contested by `==` (3) and the second `<` (4); the `<` wins it.',
      },
      {
        t: 'It is a syntax error without brackets',
        why: 'The binding powers settle every contest, so no brackets are needed.',
      },
    ],
  },
  {
    q: 'Why does `-2 * 3` parse as `(-2) * 3` in Drip?',
    options: [
      {
        t: 'Because the scanner reads `-2` as one number token',
        why: 'Drip’s scanner makes `-` its own token. The grouping is the parser’s doing.',
      },
      {
        t: 'Because prefix minus parses its operand with the unary power, and `*` is too weak to be taken',
        correct: true,
        why: 'The prefix rule’s promise is higher than `*`’s power, so it stops before the `*` and returns just `2`.',
      },
      {
        t: 'Because `*` always comes last',
        why: 'There is no such rule. The binding powers decide.',
      },
      {
        t: 'Because operators are read right to left',
        why: 'The parser reads left to right. The comparison of powers decides the grouping.',
      },
    ],
  },
  {
    q: 'In Drip, what is the `(` in `f(1)`?',
    options: [
      {
        t: 'A prefix operator that starts a grouping',
        why: 'That is the job of a `(` with nothing on its left, as in `(1 + 2)`.',
      },
      {
        t: 'An infix operator with the highest binding power',
        correct: true,
        why: 'It follows a finished operand (`f`), so it is infix, and calls bind tighter than anything else, so `-f(1)` negates the result of the call.',
      },
      {
        t: 'Part of the identifier `f(`',
        why: 'Names cannot contain `(`. The scanner makes it its own token.',
      },
      {
        t: 'Not an operator: calls are handled by the statement parser',
        why: 'Calls are expressions, and in Drip they go through `infix`.',
      },
    ],
  },
];
