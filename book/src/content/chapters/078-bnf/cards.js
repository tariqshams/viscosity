// Chapter 77b cards (split from chapter 77). Keys are stable ids.
//
// Exercises use token types as plain strings, as Drip’s scanner names
// them: 'number', 'identifier', '+', '(' and so on.

export const prompts = {
  'bnf-what': {
    q: 'What is BNF?',
    a: 'The standard notation for writing grammars: each rule is a head, an arrow (or `::=`), and a body of terminals and nonterminals.',
  },
  'bar-means': {
    q: 'In BNF, what does `item → NUMBER | "(" expr ")"` mean?',
    a: 'An item is a NUMBER, or an expr in brackets. `|` means “or”: it is two rules written on one line.',
  },
  'star-means': {
    q: 'In BNF, what does `expr → item ( "+" item )*` mean?',
    a: 'An item, followed by zero or more `+ item` pairs.',
  },
  'question-means': {
    q: 'In `letDecl → "let" IDENT ( "=" expression )? ";"`, what does `?` mean?',
    a: 'The group is optional: once, or not at all. So `let x;` and `let x = 1;` both fit.',
  },
  'star-binds': {
    q: 'In `args → expr "," expr*`, what does the star repeat?',
    a: 'Only the `expr` just before it. To repeat a comma and an expr together, group them: `( "," expr )*`.',
  },
  'epsilon-what': {
    q: 'What does ε mean in a rule such as `R → ε`?',
    a: 'The empty row of symbols: R may stand for nothing at all. It is how an unfolded star stops repeating.',
  },
  'nest-how': {
    q: 'Which loop of rules lets a Drip block contain another block?',
    a: 'A block holds declarations, a declaration can be a statement, and a statement can be a block.',
  },
  'regex-limit': {
    q: 'What can a grammar describe that a regular expression over tokens cannot?',
    a: 'Nesting to any depth, such as brackets inside brackets or calls inside calls. It needs rules that mention themselves.',
  },
};

export const examples = {
  callRegex: {
    title: 'A rule as a regular expression',
    code: `// One letter per token type:
// n = NUMBER, i = IDENT
// args → NUMBER ( "," NUMBER )*
const args = 'n(,n)*';
// call → IDENT "(" args? ")"
const call = new RegExp(
  '^i\\\\((' + args + ')?\\\\)$');

const rows = ['i()', 'i(n)', 'i(n,n,n)',
  'i(n,)', 'i(,)', 'i(n'];
for (const r of rows) {
  console.log(r, call.test(r));
}

// Try: allow names as arguments too,
// with args = '[ni](,[ni])*'.`,
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
      'Read the rule from left to right and do one check for each piece. The first piece is `NUMBER`: what must be true of `ts[0]`?',
      'The `( "+" NUMBER )*` part is “zero or more”, which is a loop: keep an index `i`, and while `ts[i]` is `+`, the token after it must be a `number`.',
      'Inside the loop, move past both tokens with `i += 2`. When the loop stops, every token must have been used, so return `i === ts.length`.',
    ],
    walkthrough: `**How to think about it.** A rule is read left to right, and each piece of it becomes one piece of code. The rule \`sum → NUMBER ( "+" NUMBER )*\` has two pieces: one \`NUMBER\`, which is a single check, and a starred group, which is "zero or more times", the natural job of a \`while\` loop. Then there is one more thing the rule says without writing it: the whole array must be a sum, so nothing may be left over at the end. Try a few rows on paper first: \`number\` fits (zero repeats), \`number + number + number\` fits (two repeats), and \`number +\` does not, because the group always brings a \`number\` with its \`+\`.

**The solution, line by line.**

- \`function isSum(ts) {\` takes the array of token types.
- \`  if (ts[0] !== 'number') return false;\` is the first piece of the rule, \`NUMBER\`. If the first token is anything else, the row cannot be a sum. An empty array lands here too, because \`ts[0]\` is \`undefined\`, which is not \`'number'\`.
- \`  let i = 1;\` keeps our place: the index of the next token we have not checked yet.
- \`  while (ts[i] === '+') {\` is the starred group. Each time round, the next token is a \`+\`, so we are at the start of one more \`"+" NUMBER\` pair. If the next token is not \`+\`, the group repeats no more, and the loop stops (possibly without running at all).
- \`    if (ts[i + 1] !== 'number') {\` checks the second half of the pair: a \`+\` must be followed by a number.
- \`      return false;\` rejects rows like \`number +\` (where \`ts[i + 1]\` is \`undefined\`) and \`number + +\`.
- \`    }\` closes the check.
- \`    i += 2;\` moves past the whole pair, the \`+\` and its number.
- \`  }\` closes the loop.
- \`  return i === ts.length;\` is the "nothing left over" check. The loop stopped at the first token that is not \`+\`; if that is the end of the array, \`i\` equals the length and the row is a sum. If not, something the rule does not allow is sitting there, such as a second number with no \`+\` before it.
- \`}\` closes the function.

For \`['number', '+', 'number']\`: \`ts[0]\` is a number, \`i\` is 1, \`ts[1]\` is \`+\` and \`ts[2]\` is a number, so \`i\` becomes 3; \`ts[3]\` is \`undefined\`, so the loop stops, and \`3 === 3\` is \`true\`.

**Common wrong attempts.**

- Forgetting the last check and returning \`true\` after the loop: \`['number', 'number']\` then passes, because the loop stops at the second number and nobody looks at it.
- Checking that numbers and \`+\` simply alternate, with \`every\`: close, but the empty array passes (\`every\` on no items is \`true\`), and so does \`['number', '+']\`, which ends with a \`+\`.

This shape, *a loop for every star*, is exactly how you will write a parser in the chapter "Recursive descent parsing"; a parser does the same walk, but builds something as it goes.`,
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
      'Write `isCall(ts)` for this grammar: `call → IDENT "(" args? ")"` and `args → NUMBER ( "," NUMBER )*`. So `f()`, `f(1)` and `f(1, 2, 3)` are calls; `f(1,)` and `f(,)` are not. The input is an array of token types, such as `[\'identifier\', \'(\', \')\']`.',
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
      'Check the fixed parts of `call` first: an `identifier` at index 0 and `(` at index 1.',
      '`args?` means the arguments may be missing, which is an `if`. Every list of arguments starts with a number, so if `ts[2]` is a `number`, read the arguments; otherwise skip straight to the `)` check.',
      'Inside the arguments, loop while you see `,` followed by a `number`, moving `i` on by 2 each time. At the end, `ts[i]` must be `)` and it must be the last token: `i === ts.length - 1`.',
    ],
    walkthrough: `**How to think about it.** Two rules, but one walk: wherever \`call\` says \`args\`, we do what \`args\` says, right there. Read \`call\` left to right: two fixed tokens, an optional group, a fixed token, and nothing after it. "Optional" is the job of an \`if\`; "zero or more" is the job of a \`while\`; a fixed token is one check. The one question is how to know whether the optional \`args\` is there; the answer is to look at the next token, because every \`args\` begins with a \`NUMBER\`, and \`)\` (the only other thing that may come next) is not a number.

**The solution, line by line.**

- \`function isCall(ts) {\` takes the token types.
- \`  if (ts[0] !== 'identifier') {\` checks the first symbol of \`call\`, \`IDENT\`: the function's name.
- \`    return false;\` rejects rows with no name, such as \`( )\`.
- \`  }\` closes it.
- \`  if (ts[1] !== '(') return false;\` checks the second symbol, the opening bracket.
- \`  let i = 2;\` is our place: the first token after the bracket.
- \`  if (ts[i] === 'number') {\` is \`args?\`: the arguments are there exactly when the next token is a number.
- \`    i++;\` moves past that first number, which is the \`NUMBER\` at the start of \`args\`.
- \`    while (ts[i] === ',' &&\` and \`           ts[i + 1] === 'number') {\` are the starred group \`( "," NUMBER )*\`: one more pair, a comma and a number, each time round.
- \`      i += 2;\` moves past the pair.
- \`    }\` and \`  }\` close the loop and the \`if\`.
- \`  return ts[i] === ')' &&\` checks the closing bracket, which must be wherever we have got to.
- \`    i === ts.length - 1;\` checks that the bracket is the last token, so nothing follows the call.
- \`}\` closes the function.

Try \`f(1,)\`: after the \`1\`, \`ts[i]\` is \`,\` but \`ts[i + 1]\` is \`)\`, so the loop does not run; \`ts[i]\` is then the comma, not \`)\`, and the answer is \`false\`, exactly as the grammar demands (a comma must be followed by a number).

**Common wrong attempts.**

- A loop that skips any mixture of numbers and commas: it accepts \`f(1,)\` and \`f(,)\`, because it never checks that a comma is followed by a number. The grammar fixes the order inside the group, so the code must too.
- Checking only that the last token is \`)\`: \`f())\` then passes, because the first \`)\` is never compared with the end of the array.

Optional means \`if\`, repetition means \`while\`, and a row of symbols means one check after another: that is most of what you need to turn a grammar into code.`,
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
    q: 'Which rule says the same as `args → NUMBER ( "," NUMBER )*`?',
    options: [
      { t: '`args → NUMBER "," NUMBER`', why: 'This allows exactly two numbers, not one or many.' },
      { t: '`args → NUMBER | args "," NUMBER`', correct: true, why: 'One number, or a shorter args followed by one more `, NUMBER`. Recursion and `*` describe the same lists.' },
      { t: '`args → ( NUMBER "," )*`', why: 'This allows an empty list and forces a trailing comma.' },
      { t: '`args → NUMBER?`', why: 'This allows at most one number.' },
    ],
  },
  {
    q: 'In `ifStmt → "if" expression block ( "else" block )?`, what does the `?` allow?',
    options: [
      { t: 'Any number of `else` parts', why: 'That would be `*`.' },
      { t: 'The condition to be left out', why: 'The `?` applies only to the group just before it, the `else` part.' },
      { t: 'An `if` with or without one `else` part', correct: true, why: '`?` means once, or not at all; unfolded, it is two rules, one with the else part and one without.' },
      { t: 'The `else` to come before the `if`', why: 'A rule is read in order; `?` doesn’t move anything.' },
    ],
  },
  {
    q: 'Unfolding the shorthand in `list → "[" ( NUMBER )* "]"` into plain rules needs what?',
    options: [
      { t: 'Nothing: a star is already a plain rule', why: 'Plain BNF has no star; that is why it is called a shorthand.' },
      { t: 'A rule for every possible length of list', why: 'That would be endlessly many rules. One helper that mentions itself covers every length.' },
      { t: 'A new helper nonterminal R, with `R → NUMBER R` and `R → ε`, and `list → "[" R "]"`', correct: true, why: 'R repeats by mentioning itself, and ε is its way out.' },
    ],
  },
  {
    q: 'Which of these does the rule `call → IDENT "(" ( NUMBER ( "," NUMBER )* )? ")"` allow?',
    options: [
      { t: '`f(1, 2)`', correct: true, why: 'A name, a bracket, the optional group present (one number, then one `, NUMBER` pair) and a bracket.' },
      { t: '`f(1,)`', why: 'Each comma must bring a number with it.' },
      { t: '`f 1`', why: 'The brackets are terminals outside the optional group, so they are required.' },
      { t: '`f(,)`', why: 'The optional group, when present, must start with a number.' },
    ],
  },
  {
    q: 'Why can a rule that uses only `|`, `( )`, `?` and `*` over tokens (and no nonterminals) be written as a regular expression?',
    options: [
      { t: 'Because those are exactly the operators regular expressions have, and nothing in such a rule can nest', correct: true, why: 'What a regular expression cannot do is check nesting to any depth, which needs a rule that mentions itself.' },
      { t: 'Because every grammar can be written as a regular expression', why: 'Not so: no regular expression can check that brackets are balanced at any depth.' },
      { t: 'Because regular expressions understand tokens', why: 'They match characters; the example works by writing one letter per token type.' },
    ],
  },
];
