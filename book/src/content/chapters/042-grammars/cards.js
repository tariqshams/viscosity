// Chapter 42 cards. Keys are stable ids: never rename them.
//
// Exercises use token types as plain strings, as Drip’s scanner names
// them: 'number', 'identifier', '+', '(' and so on.

export const prompts = {
  'grammar-what': {
    q: 'What does a grammar describe?',
    a: 'Which sequences of tokens are valid in the language.',
  },
  'scanner-cant': {
    q: 'Why can’t the scanner reject `print + ; 3 (`?',
    a: 'Every token in it is spelled correctly. The problem is their order, and the scanner looks at one token at a time.',
  },
  'arrow-read': {
    q: 'How do you read the rule `stmt → "print" expr ";"` aloud?',
    a: '“A stmt can be made of the token print, then an expr, then a semicolon.”',
  },
  'terminal-what': {
    q: 'In a grammar, what is a terminal?',
    a: 'An actual token, such as `"print"` or `NUMBER`. Once it appears in a derivation it never changes.',
  },
  'nonterminal-what': {
    q: 'In a grammar, what is a nonterminal?',
    a: 'The name of a rule, such as `expr`: a blank that must still be replaced.',
  },
  'derivation-done': {
    q: 'When is a derivation finished?',
    a: 'When no nonterminals are left: only terminals (tokens).',
  },
  'recursive-rule': {
    q: 'How can five rules describe infinitely many programs?',
    a: 'Some rules mention themselves (like `expr → expr "+" item`), so they can be used again and again.',
  },
  'no-way-out': {
    q: 'What if the only rule for `expr` were `expr → expr "+" item`?',
    a: 'Every step would leave an `expr` behind, so no derivation could ever finish. A recursive rule needs a non-recursive alternative.',
  },
  'bar-means': {
    q: 'In BNF, what does `item → NUMBER | "(" expr ")"` mean?',
    a: 'An item is a NUMBER, or an expr in brackets. `|` means “or”.',
  },
  'star-means': {
    q: 'In BNF, what does `expr → item ( "+" item )*` mean?',
    a: 'An item, followed by zero or more `+ item` pairs.',
  },
  'question-means': {
    q: 'In `letDecl → "let" IDENTIFIER ( "=" expression )? ";"`, what does `?` mean?',
    a: 'The group is optional: it appears zero times or once. So `let x;` and `let x = 1;` are both valid.',
  },
};

export const exercises = {
  isSum: {
    title: 'Check tokens against a grammar',
    prompt:
      'The grammar is `sum → NUMBER ( "+" NUMBER )*`. Write `isSum(ts)`, which gets an array of token types (such as `[\'number\', \'+\', \'number\']`) and returns `true` if the whole array is a `sum`, and `false` otherwise.',
    starter: `function isSum(ts) {
  // your code here
}

console.log(isSum(['number', '+',
  'number']));  // true
console.log(isSum(['number', '+']));
// false`,
    solution: `function isSum(ts) {
  if (ts[0] !== 'number') return false;
  let i = 1;
  while (ts[i] === '+') {
    if (ts[i + 1] !== 'number') {
      return false;
    }
    i += 2;
  }
  return i === ts.length;
}`,
    tests: `test('one number', () => {
  expect(isSum(['number'])).toBe(true);
});
test('a longer sum', () => {
  expect(isSum(['number', '+', 'number', '+', 'number'])).toBe(true);
});
test('nothing at all', () => {
  expect(isSum([])).toBe(false);
});
test('starts with +', () => {
  expect(isSum(['+', 'number'])).toBe(false);
});
test('ends with +', () => {
  expect(isSum(['number', '+'])).toBe(false);
});
test('two numbers with no + between', () => {
  expect(isSum(['number', 'number'])).toBe(false);
});
test('two + in a row', () => {
  expect(isSum(['number', '+', '+', 'number'])).toBe(false);
});`,
    hints: [
      'Follow the grammar from left to right. First, there must be a `number` at index 0.',
      'The `( "+" NUMBER )*` part is a loop: while the next token is `+`, the one after it must be a `number`. Then skip both.',
      'When the loop stops, every token must have been used: check that your index equals `ts.length`.',
    ],
    walkthrough: `The function reads the grammar left to right, one piece at a time.

- **\`NUMBER\`**: the first token must be a number. If it isn’t (including when the array is empty, where \`ts[0]\` is \`undefined\`), the answer is \`false\`.
- **\`( "+" NUMBER )*\`**: “zero or more” becomes a \`while\` loop. Each time round, we have just seen a \`+\`, so a \`number\` must follow. Then we move past both.
- **Nothing left over.** The loop stops at the first token that isn’t \`+\`. If that is not the end of the array, there is something the grammar doesn’t allow, such as a second number with no \`+\` before it.

This shape, *a loop for every \`*\`*, is exactly how you’ll write a parser in chapter 45. A parser does the same walk, but builds something as it goes.`,
    wrong: [
      {
        code: `function isSum(ts) {
  if (ts[0] !== 'number') return false;
  let i = 1;
  while (ts[i] === '+') {
    if (ts[i + 1] !== 'number') {
      return false;
    }
    i += 2;
  }
  return true;
}`,
        why: 'This never checks that every token was used, so `[\'number\', \'number\']` passes: the loop stops at the second number and the leftover is ignored.',
      },
      {
        code: `function isSum(ts) {
  return ts.every((t, i) =>
    i % 2 === 0
      ? t === 'number'
      : t === '+');
}`,
        why: 'Checking that numbers and `+` alternate is close, but the empty array passes (`every` on nothing is `true`), and so does `[\'number\', \'+\']`, which ends with `+`.',
      },
    ],
  },
  isCall: {
    optional: true,
    title: 'A grammar with an optional part',
    prompt:
      'Write `isCall(ts)` for this grammar: `call → IDENTIFIER "(" args? ")"` and `args → NUMBER ( "," NUMBER )*`. So `f()`, `f(1)` and `f(1, 2, 3)` are calls; `f(1,)` and `f(,)` are not. The input is an array of token types, such as `[\'identifier\', \'(\', \')\']`.',
    starter: `function isCall(ts) {
  // your code here
}

console.log(isCall(['identifier', '(',
  'number', ')']));  // true`,
    solution: `function isCall(ts) {
  if (ts[0] !== 'identifier') {
    return false;
  }
  if (ts[1] !== '(') return false;
  let i = 2;
  if (ts[i] === 'number') {
    i++;
    while (ts[i] === ',' &&
           ts[i + 1] === 'number') {
      i += 2;
    }
  }
  return ts[i] === ')' &&
    i === ts.length - 1;
}`,
    tests: `const id = 'identifier';
test('no arguments', () => {
  expect(isCall([id, '(', ')'])).toBe(true);
});
test('one argument', () => {
  expect(isCall([id, '(', 'number', ')'])).toBe(true);
});
test('three arguments', () => {
  expect(isCall([id, '(', 'number', ',', 'number', ',', 'number', ')'])).toBe(true);
});
test('a trailing comma', () => {
  expect(isCall([id, '(', 'number', ',', ')'])).toBe(false);
});
test('a lone comma', () => {
  expect(isCall([id, '(', ',', ')'])).toBe(false);
});
test('missing )', () => {
  expect(isCall([id, '(', 'number'])).toBe(false);
});
test('something after the )', () => {
  expect(isCall([id, '(', ')', ')'])).toBe(false);
});
test('no name', () => {
  expect(isCall(['(', ')'])).toBe(false);
});`,
    hints: [
      'Check the fixed parts first: an `identifier` at index 0 and `(` at index 1.',
      '`args?` means the arguments may be missing. If the next token is a `number`, read the arguments; otherwise skip straight to the `)` check.',
      'Inside the arguments, loop while you see `,` followed by a `number`. At the end, the current token must be `)` and it must be the last one.',
    ],
    walkthrough: `Each piece of the grammar becomes one piece of code.

- **\`IDENTIFIER "("\`**: two fixed tokens, two checks.
- **\`args?\`**: “optional” becomes an \`if\`. A list of arguments always starts with a number, so if the next token is a \`number\`, there are arguments to read. If not, there are none.
- **\`( "," NUMBER )*\`**: a loop that moves past each comma and number pair. A comma *not* followed by a number stops the loop, and is then left where the \`)\` should be, so the call is rejected.
- **\`")"\`, and nothing after it.**

Optional means \`if\`, repetition means \`while\`, and a sequence means one check after another. That is most of what you need to turn a grammar into code.`,
    wrong: [
      {
        code: `function isCall(ts) {
  if (ts[0] !== 'identifier') {
    return false;
  }
  if (ts[1] !== '(') return false;
  let i = 2;
  while (ts[i] === 'number' ||
         ts[i] === ',') {
    i++;
  }
  return ts[i] === ')' &&
    i === ts.length - 1;
}`,
        why: 'This lets numbers and commas come in any order, so `f(1,)` and `f(,)` are accepted. The grammar says a comma must always be followed by a number.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which problem can a grammar catch that a scanner can’t?',
    options: [
      { t: 'A character that isn’t allowed anywhere, like `@`', why: 'That is a scanning error: no token starts with `@`.' },
      { t: 'A string with no closing quote', why: 'The scanner catches that, because it is inside one token.' },
      { t: 'Tokens in an order that makes no sense, like `print + ;`', correct: true, why: 'Each token is fine on its own. Only rules about order reject it.' },
      { t: 'A misspelled keyword, like `whlie`', why: '`whlie` is a perfectly good identifier. A grammar might reject where it appears, but nothing knows it was meant to be `while`.' },
    ],
  },
  {
    q: 'In `item → "(" expr ")"`, which symbols are terminals?',
    options: [
      { t: '`"("` and `")"`', correct: true, why: 'They are actual tokens. `item` and `expr` are names of rules.' },
      { t: '`item` and `expr`', why: 'Those are nonterminals: blanks to be replaced by their own rules.' },
      { t: 'All four', why: '`item` and `expr` still have to be replaced, so they are not terminals.' },
      { t: 'Only `expr`, because it is in the middle', why: 'Position doesn’t matter; what matters is whether it is a token or a rule name.' },
    ],
  },
  {
    q: `With this grammar, which of these can be derived from \`stmt\`?
\`\`\`
stmt → "print" expr ";"
expr → item ( "+" item )*
item → NUMBER | "(" expr ")"
\`\`\``,
    options: [
      { t: '`print 1 +;`', why: 'Every `+` must be followed by an item.' },
      { t: '`print;`', why: 'An expr must contain at least one item.' },
      { t: '`print (1 + 2;`', why: 'An opening bracket must be matched by `)`.' },
      { t: '`print (1) + 2;`', correct: true, why: 'stmt → print expr ;, expr → item + item, the first item → ( expr ) with expr → 1, the second item → 2.' },
    ],
  },
  {
    q: 'A grammar has `list → "x" list` and no other rule for `list`. What sentences does `list` describe?',
    options: [
      { t: 'One or more `x`', why: 'To stop at some number of `x`, there would need to be a rule without `list` on the right.' },
      { t: 'None at all: every step leaves another `list`, so no derivation can finish', correct: true, why: 'A recursive rule needs a non-recursive alternative, like a base case.' },
      { t: 'Infinitely many: x, xx, xxx, …', why: 'Each of those would need the derivation to stop, and it never can.' },
      { t: 'Just `x`', why: 'After one step you have `"x" list`, which still has a nonterminal in it.' },
    ],
  },
  {
    q: 'Which rule says the same as `args → NUMBER ( "," NUMBER )*`?',
    options: [
      { t: '`args → NUMBER "," NUMBER`', why: 'This allows exactly two numbers, not one or many.' },
      { t: '`args → NUMBER | args "," NUMBER`', correct: true, why: 'One number, or a shorter args followed by one more `, NUMBER`. Recursion and `*` describe the same lists.' },
      { t: '`args → ( NUMBER "," )*`', why: 'This allows an empty list and forces a trailing comma.' },
      { t: '`args → NUMBER?`', why: 'This allows at most one number.' },
    ],
  },
  {
    q: 'In `ifStmt → "if" "(" expression ")" statement ( "else" statement )?`, what does the `?` allow?',
    options: [
      { t: 'Any number of `else` parts', why: 'That would be `*`.' },
      { t: 'The condition to be left out', why: 'The `?` applies only to the group just before it, the `else` part.' },
      { t: 'An `if` with or without one `else` part', correct: true, why: '`?` means zero times or once.' },
      { t: 'The `else` to come before the `if`', why: 'BNF rules are read in order; `?` doesn’t move anything.' },
    ],
  },
];
