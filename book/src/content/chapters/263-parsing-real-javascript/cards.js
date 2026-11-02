// Chapter 263 cards. Keys are stable ids: never rename them.

const HEAD = `function parseLet(src) {
  const ts = src.match(/\\d+|\\w+|\\S/g);
  let p = 0;
  const peek = () => ts[p];
  const next = () => ts[p++];
`;

export const prompts = {
  'es-what': {
    q: 'What is ESTree?',
    a: 'The standard format for JavaScript syntax trees, shared by parsers such as acorn and the tools that read their output.',
  },
  'es-type': {
    q: 'How does code tell which kind of ESTree node it has?',
    a: 'By its string `type` field (`Identifier`, `MemberExpression`, …): ESTree is a discriminated union.',
  },
  'es-computed': {
    q: 'In ESTree, how are `p.x` and `p[x]` told apart?',
    a: 'Both are `MemberExpression`s; `computed` is `false` for `p.x` and `true` for `p[x]`.',
  },
  'es-member': {
    q: 'In ESTree, `ps[i].x` is a `MemberExpression` whose `object` is what?',
    a: 'Another `MemberExpression`, with `computed: true`, for `ps[i]`.',
  },
  'es-offsets': {
    q: 'Why does Viscosity need each ESTree node’s `start` and `end` offsets?',
    a: 'VIR’s source references point at them, and emit replaces exactly those ranges of the text.',
  },
  'es-loc': {
    q: 'What does acorn add to each node when you pass `locations: true`?',
    a: 'A `loc` with the line and column where the node starts and ends (Viscosity uses the line for explain).',
  },
  'es-nest': {
    q: 'A node covers offsets 7 to 11. What can you say about the range of any of its children?',
    a: 'It lies inside 7 to 11: children start no earlier and end no later than their parent.',
  },
  'es-why': {
    q: 'Why does Viscosity’s JavaScript plugin depend on ESTree rather than on acorn itself?',
    a: 'Then any parser that produces ESTree (with offsets and lines) can replace acorn, and nothing after the parser changes.',
  },
};

export const examples = {
  slices: {
    title: 'A node’s text is a slice',
    code: `const src = 'p.x += p.vx;';
const tree = {
  type: 'AssignmentExpression',
  start: 0, end: 11,
  kids: [
    { type: 'MemberExpression',
      start: 0, end: 3, kids: [] },
    { type: 'MemberExpression',
      start: 7, end: 11, kids: [] },
  ],
};
function show(n, depth) {
  const pad = ' '.repeat(depth * 2);
  const text = src.slice(n.start,
    n.end);
  console.log(pad + n.type + ': '
    + text);
  for (const k of n.kids)
    show(k, depth + 1);
}
show(tree, 0);`,
  },
};

export const exercises = {
  parseLet: {
    title: 'Parse a declaration into ESTree',
    prompt:
      'Write `parseLet(src)` by recursive descent for the statement `let NAME = EXPR;` (or `const`; the `;` is optional). `EXPR` is terms joined by `+` or `-`, left to right; a term is a whole number or a name. Return ESTree: a `VariableDeclaration` with `kind` and one `VariableDeclarator` (`id`, `init`). Numbers are `{ type: \'Literal\', value }`, names `{ type: \'Identifier\', name }`, and `a + b` is `{ type: \'BinaryExpression\', operator, left, right }`. Throw a `SyntaxError` if the input doesn’t fit: no `let`/`const`, a target that isn’t a name, a missing `=`, or tokens left over. The tokeniser and `peek`/`next` are written for you.',
    starter: HEAD + `  // your code here
}

console.log(parseLet('let x = 1;'));`,
    solution: HEAD + `  const bad = (m) => {
    throw new SyntaxError(m);
  };
  function term() {
    const t = next() ?? bad('end');
    if (/^\\d+$/.test(t))
      return { type: 'Literal',
        value: Number(t) };
    if (/^\\w+$/.test(t))
      return { type: 'Identifier',
        name: t };
    return bad('unexpected ' + t);
  }
  function expr() {
    let left = term();
    while (peek() === '+' ||
           peek() === '-') {
      const operator = next();
      const right = term();
      left = { type: 'BinaryExpression',
        operator, left, right };
    }
    return left;
  }
  const kind = next();
  if (!['let', 'const'].includes(kind))
    bad('expected let or const');
  const id = term();
  if (id.type !== 'Identifier')
    bad('expected a name');
  if (next() !== '=') bad('expected =');
  const init = expr();
  if (peek() === ';') next();
  if (p < ts.length) bad('extra');
  return { type: 'VariableDeclaration',
    kind, declarations: [{
      type: 'VariableDeclarator',
      id, init }] };
}`,
    tests: `test('a single literal', () => {
  expect(parseLet('let x = 1;')).toEqual({
    type: 'VariableDeclaration', kind: 'let',
    declarations: [{ type: 'VariableDeclarator',
      id: { type: 'Identifier', name: 'x' },
      init: { type: 'Literal', value: 1 } }],
  });
});
test('left to right, no semicolon', () => {
  const d = parseLet('const y = a + 1 - b');
  expect(d.kind).toBe('const');
  expect(d.declarations[0].init).toEqual({
    type: 'BinaryExpression', operator: '-',
    left: { type: 'BinaryExpression', operator: '+',
      left: { type: 'Identifier', name: 'a' },
      right: { type: 'Literal', value: 1 } },
    right: { type: 'Identifier', name: 'b' },
  });
});
test('rejects bad input', () => {
  expect(() => parseLet('var x = 1')).toThrow();
  expect(() => parseLet('let 5 = 1')).toThrow();
  expect(() => parseLet('let x 1')).toThrow();
  expect(() => parseLet('let x = 1 2')).toThrow();
  expect(() => parseLet('let x =')).toThrow();
});`,
    hints: [
      'Write one function per grammar rule: `term()` for a number or a name, `expr()` for terms joined by `+`/`-`, and the declaration itself at the bottom.',
      '`expr()` is a loop: parse a term, then while the next token is `+` or `-`, take it, parse another term, and wrap both in a new `BinaryExpression` as the new `left`. That makes it left-associative.',
      'Check each fixed token as you go (`let`/`const`, a name, `=`), and at the end check that `p === ts.length`, so `let x = 1 2` is rejected.',
    ],
    walkthrough: `**How to think about it.** Write the grammar down first, one rule per line: a *declaration* is \`let\` or \`const\`, a name, \`=\`, an *expression*, and an optional \`;\`; an *expression* is a *term*, then any number of (\`+\` or \`-\`, *term*); a *term* is a number or a name. Recursive descent turns each rule into one function that reads tokens with \`peek\` (look) and \`next\` (take), and returns an ESTree node. Decide early what to do with input that does not fit: throw, never guess.

**The solution, line by line.**

- \`  const bad = (m) => {\` / \`    throw new SyntaxError(m);\` / \`  };\` is a helper for every error, so each check is one short line.
- \`  function term() {\` parses a term. \`    const t = next() ?? bad('end');\` takes a token; \`??\` calls \`bad\` when there is none left (\`next()\` gave \`undefined\`), so \`let x =\` fails cleanly.
- \`    if (/^\\d+$/.test(t))\` / \`      return { type: 'Literal',\` / \`        value: Number(t) };\` turns digits into a \`Literal\` holding the *number* (not the text).
- \`    if (/^\\w+$/.test(t))\` / \`      return { type: 'Identifier',\` / \`        name: t };\` turns a word into an \`Identifier\`.
- \`    return bad('unexpected ' + t);\` rejects anything else, such as \`=\` where a term should be.
- \`  function expr() {\` / \`    let left = term();\` parses the first term.
- \`    while (peek() === '+' ||\` / \`           peek() === '-') {\` loops while the next token is an operator.
- \`      const operator = next();\` / \`      const right = term();\` takes the operator and the next term.
- \`      left = { type: 'BinaryExpression',\` / \`        operator, left, right };\` wraps everything so far as the *left* of a new node, which makes \`a + 1 - b\` mean \`(a + 1) - b\`.
- \`    return left;\` returns the whole expression.
- \`  const kind = next();\` / \`  if (!['let', 'const'].includes(kind))\` / \`    bad('expected let or const');\` checks the keyword.
- \`  const id = term();\` / \`  if (id.type !== 'Identifier')\` / \`    bad('expected a name');\` reads the target and rejects \`let 5 = 1\`.
- \`  if (next() !== '=') bad('expected =');\` requires the equals sign.
- \`  const init = expr();\` parses the value.
- \`  if (peek() === ';') next();\` allows an optional semicolon.
- \`  if (p < ts.length) bad('extra');\` rejects leftovers, so \`let x = 1 2\` does not quietly become \`let x = 1\`.
- \`  return { type: 'VariableDeclaration',\` … builds the ESTree shape: the declaration holds \`kind\` and a list of declarators, each with \`id\` and \`init\`, exactly the fields acorn uses (acorn adds positions).

**Common wrong attempts.**

- Making \`expr\` recursive on the right (\`right: expr()\`) builds \`a + (1 - b)\`, which is a different number: right-associative is wrong for \`-\`.
- Skipping the checks makes \`var x = 1\` and \`let x 1\` parse. A parser that guesses will one day hand the compiler a tree that means something else; "anything outside the subset is a syntax error" is what makes a parser safe to build a compiler on.`,
    wrong: [
      {
        code: HEAD + `  function term() {
    const t = next();
    return /^\\d+$/.test(t)
      ? { type: 'Literal', value: +t }
      : { type: 'Identifier', name: t };
  }
  function expr() {
    const left = term();
    const op = peek();
    if (op !== '+' && op !== '-')
      return left;
    const operator = next();
    return { type: 'BinaryExpression',
      operator, left, right: expr() };
  }
  const kind = next();
  const id = term();
  next();
  return { type: 'VariableDeclaration',
    kind, declarations: [{
      type: 'VariableDeclarator',
      id, init: expr() }] };
}`,
        why: 'Recursing on the right makes `a + 1 - b` into `a + (1 - b)`: right-associative, which is wrong for `-`. It also never throws, so `var x = 1` and `let x 1` are accepted.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What makes ESTree useful to Viscosity?',
    options: [
      { t: 'It is faster to build than other trees', why: 'Speed isn’t the point; agreement is.' },
      { t: 'Any parser that produces it can feed the same lowering code', correct: true, why: 'The plugin depends on the format, not the parser, so acorn and the mini parser are interchangeable.' },
      { t: 'It includes VIR instructions', why: 'ESTree is a syntax tree. VIR is produced from it by lowering.' },
      { t: 'It contains the program’s comments', why: 'acorn reports comments separately, through `onComment`.' },
    ],
  },
  {
    q: 'In ESTree, `ps[i].x` is a `MemberExpression` whose `object` is…',
    options: [
      { t: 'an `Identifier` named `ps`', why: 'That is the innermost object. The outer node’s object is `ps[i]`.' },
      { t: 'a `Literal`', why: 'There is no literal in `ps[i].x`.' },
      { t: 'another `MemberExpression`, for `ps[i]`, with `computed: true`', correct: true, why: '`.x` is not computed; `[i]` is. Two nested member expressions.' },
      { t: 'a `CallExpression`', why: 'Nothing is called here.' },
    ],
  },
  {
    q: 'In `p.x += p.vx;`, the right side `p.vx` has `start: 7` and `end: 11`. What is `source.slice(7, 11)`?',
    options: [
      { t: '`p.vx;`', why: 'The semicolon is at offset 11, and `end` is one past the last character, so it is not included.' },
      { t: '`.vx`', why: 'The range starts at 7, which is the `p`.' },
      { t: '`p.vx`', correct: true, why: 'A node’s text is exactly the slice from `start` up to, not including, `end`.' },
      { t: '`+= p.vx`', why: 'That belongs to the assignment, which starts earlier.' },
    ],
  },
  {
    q: 'What does `computed: true` on a `MemberExpression` mean?',
    options: [
      { t: 'The property was written in square brackets, so its value picks the field', correct: true, why: '`p[x]` looks up whatever `x` holds; `p.x` always means the field named x.' },
      { t: 'The value has already been calculated', why: 'ESTree describes syntax; nothing has run yet.' },
      { t: 'The object is an array', why: 'ESTree does not know types: `p[x]` could be on any object.' },
      { t: 'The expression is a constant', why: '`computed` says nothing about constants.' },
    ],
  },
  {
    q: 'Which of these would let Viscosity replace acorn with another parser without changing anything else?',
    options: [
      { t: 'The other parser is written in TypeScript', why: 'The language it is written in does not matter.' },
      { t: 'The other parser is faster', why: 'Speed is nice, but it does not make the trees fit.' },
      { t: 'The other parser can parse TypeScript', why: 'Viscosity strips types before parsing anyway.' },
      { t: 'The other parser produces the same ESTree slice, with offsets and lines', correct: true, why: 'Everything after the parser reads only that slice, as `estree.ts` describes it.' },
    ],
  },
];
