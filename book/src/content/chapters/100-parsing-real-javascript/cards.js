// Chapter 100 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 100, 100.

export const prompts = {
  'es-what': {
    q: 'What is ESTree?',
    a: 'The standard format for JavaScript syntax trees, shared by parsers such as acorn and the tools that read their output.',
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
  'es-why': {
    q: 'Why does Viscosity’s JavaScript plugin depend on ESTree rather than on acorn itself?',
    a: 'Then any parser that produces ESTree (with offsets and lines) can replace acorn, and nothing after the parser changes.',
  },
  'pa-what': {
    q: 'What is a parser adapter?',
    a: 'Code that wraps a third-party parser behind your own interface, so the rest of the system depends only on the format it hands over.',
  },
  'pa-comments': {
    q: 'Why does the acorn adapter pass an `onComment` callback?',
    a: 'acorn reports comments through it, not in the tree, and `@viscosity` annotations live in comments.',
  },
  'mp-test': {
    q: 'What exactly does `mini-parser.test.ts` require of the two parsers?',
    a: 'For every corpus and benchmark program, the compiled code and the explanation must be byte-identical.',
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
  'pratt-bp': {
    title: 'Binding powers decide the shape',
    code: `const BIN = { '+': 10, '-': 10,
  '*': 11, '/': 11, '**': 12 };

function parse(src) {
  const ts = src.split(' ');
  let p = 0;
  function binary(minBp) {
    let left = ts[p++];
    for (;;) {
      const op = ts[p];
      const bp = BIN[op];
      if (bp === undefined ||
          bp <= minBp) break;
      p++;
      const right = binary(
        op === '**' ? bp - 1 : bp);
      left = '(' + left + ' ' + op +
        ' ' + right + ')';
    }
    return left;
  }
  return binary(0);
}

console.log(parse('1 - 2 * 3'));
console.log(parse('1 - 2 - 3'));
console.log(parse('2 ** 3 ** 2'));`,
  },
};

export const exercises = {
  parseLet: {
    optional: true,
    title: 'Parse a declaration into ESTree',
    prompt: 'Write `parseLet(src)` by recursive descent for the statement `let NAME = EXPR;` (or `const`; the `;` is optional). `EXPR` is terms joined by `+` or `-`, left to right; a term is a whole number or a name. Return ESTree: a `VariableDeclaration` with `kind` and one `VariableDeclarator` (`id`, `init`). Numbers are `{ type: \'Literal\', value }`, names `{ type: \'Identifier\', name }`, and `a + b` is `{ type: \'BinaryExpression\', operator, left, right }`. Throw a `SyntaxError` if the input doesn’t fit: no `let`/`const`, a target that isn’t a name, a missing `=`, or tokens left over. The tokeniser and `peek`/`next` are written for you.',
    starter: `function parseLet(src) {
  const ts = src.match(/\\d+|\\w+|\\S/g);
  let p = 0;
  const peek = () => ts[p];
  const next = () => ts[p++];
  // your code here
}

console.log(parseLet('let x = 1;'));`,
    solution: `function parseLet(src) {
  const ts = src.match(/\\d+|\\w+|\\S/g);
  let p = 0;
  const peek = () => ts[p];
  const next = () => ts[p++];
  const bad = (m) => {
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
        code: `function parseLet(src) {
  const ts = src.match(/\\d+|\\w+|\\S/g);
  let p = 0;
  const peek = () => ts[p];
  const next = () => ts[p++];
  function term() {
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
  toEstree: {
    title: 'An adapter for a foreign tree',
    prompt: 'A different parser returns its trees as arrays: `[\'num\', 3]`, `[\'name\', \'x\']`, `[\'bin\', \'+\', left, right]`, `[\'dot\', obj, \'x\']` for `obj.x`, and `[\'idx\', obj, e]` for `obj[e]`. Write the adapter `toEstree(n)` that turns any such tree into ESTree: `Literal` (`value`), `Identifier` (`name`), `BinaryExpression` (`operator`, `left`, `right`) and `MemberExpression` (`object`, `property`, `computed`). For `dot`, the property is an `Identifier` and `computed` is `false`; for `idx`, the property is the converted `e` and `computed` is `true`. Throw an `Error` for any other tag.',
    starter: `function toEstree(n) {
  // your code here
}

console.log(toEstree(['name', 'x']));`,
    solution: `function toEstree(n) {
  const [tag, a, b, c] = n;
  switch (tag) {
    case 'num':
      return { type: 'Literal',
        value: a };
    case 'name':
      return { type: 'Identifier',
        name: a };
    case 'bin':
      return {
        type: 'BinaryExpression',
        operator: a,
        left: toEstree(b),
        right: toEstree(c) };
    case 'dot':
      return {
        type: 'MemberExpression',
        object: toEstree(a),
        property: { type: 'Identifier',
          name: b },
        computed: false };
    case 'idx':
      return {
        type: 'MemberExpression',
        object: toEstree(a),
        property: toEstree(b),
        computed: true };
    default:
      throw new Error('unknown ' + tag);
  }
}`,
    tests: `test('leaves', () => {
  expect(toEstree(['num', 3])).toEqual({ type: 'Literal', value: 3 });
  expect(toEstree(['name', 'p'])).toEqual({ type: 'Identifier', name: 'p' });
});
test('p.x is not computed', () => {
  expect(toEstree(['dot', ['name', 'p'], 'x'])).toEqual({
    type: 'MemberExpression',
    object: { type: 'Identifier', name: 'p' },
    property: { type: 'Identifier', name: 'x' },
    computed: false,
  });
});
test('ps[i].x nests, the inner one computed', () => {
  const t = toEstree(['dot', ['idx', ['name', 'ps'], ['name', 'i']], 'x']);
  expect(t.computed).toBe(false);
  expect(t.object.computed).toBe(true);
  expect(t.object.property).toEqual({ type: 'Identifier', name: 'i' });
});
test('binary expressions convert both sides', () => {
  expect(toEstree(['bin', '*', ['num', 2], ['name', 'k']])).toEqual({
    type: 'BinaryExpression', operator: '*',
    left: { type: 'Literal', value: 2 },
    right: { type: 'Identifier', name: 'k' },
  });
});
test('unknown tags are refused', () => {
  expect(() => toEstree(['call', 'f'])).toThrow();
});`,
    hints: [
      'One `case` per tag. Destructure the array first: `const [tag, a, b, c] = n;`.',
      'The children are foreign trees too, so convert them with `toEstree` itself (recursion). The one exception is the field name in `dot`: it is a plain string, which becomes a new `Identifier`.',
      'For `dot`, `computed: false` and `property: { type: \'Identifier\', name: b }`; for `idx`, `computed: true` and `property: toEstree(b)`. End with `default: throw new Error(...)`.',
    ],
    walkthrough: `**How to think about it.** An adapter's job is to make a foreign format look exactly like the one the rest of the system expects, and to refuse anything it cannot translate faithfully. Make a table first: each foreign tag on the left, the ESTree node on the right, and for each field, whether it is a value to copy, a child tree to convert, or something new to make. The one subtle row is \`dot\`: its field name is a plain string, but ESTree wants an \`Identifier\` node there, with \`computed: false\`, while \`idx\` has a whole child tree as its property, with \`computed: true\`.

**The solution, line by line.**

- \`function toEstree(n) {\` takes one foreign node.
- \`  const [tag, a, b, c] = n;\` unpacks the array, so each case can name its parts (unused ones are \`undefined\`).
- \`  switch (tag) {\` picks the translation by tag.
- \`    case 'num':\` / \`      return { type: 'Literal',\` / \`        value: a };\` copies the number into a \`Literal\`.
- \`    case 'name':\` / \`      return { type: 'Identifier',\` / \`        name: a };\` copies the name into an \`Identifier\`.
- \`    case 'bin':\` builds a \`BinaryExpression\` with \`operator: a\` copied and \`left: toEstree(b)\`, \`right: toEstree(c)\` converted, because the operands are foreign trees themselves.
- \`    case 'dot':\` builds a \`MemberExpression\` whose \`object: toEstree(a)\` is converted, whose \`property\` is a *new* \`Identifier\` made from the string \`b\`, and whose \`computed\` is \`false\`.
- \`    case 'idx':\` is the same node with \`property: toEstree(b)\` converted and \`computed: true\`.
- \`    default:\` / \`      throw new Error('unknown ' + tag);\` refuses anything else.

Trace the third test, \`['dot', ['idx', ['name', 'ps'], ['name', 'i']], 'x']\`: the outer \`dot\` converts its object, an \`idx\`, which converts \`ps\` and \`i\` into \`Identifier\`s and sets \`computed: true\`; back in \`dot\`, the property becomes \`Identifier x\` with \`computed: false\`. That is exactly the tree acorn builds for \`ps[i].x\`.

**Common wrong attempts.**

- Copying \`b\` as the property in \`dot\` (\`property: b\`) leaves a string where ESTree promises a node; code that reads \`property.name\` gets \`undefined\`.
- Forgetting to recurse (\`left: b\`) leaves foreign arrays inside an ESTree tree, which is worse than an error: the rest of the plugin would trip over it later, far from the cause.
- Returning \`null\` for unknown tags instead of throwing lets a half-translated tree through. An adapter must be faithful or fail loudly.`,
    wrong: [
      {
        code: `function toEstree(n) {
  const [tag, a, b, c] = n;
  if (tag === 'num')
    return { type: 'Literal',
      value: a };
  if (tag === 'name')
    return { type: 'Identifier',
      name: a };
  if (tag === 'bin')
    return { type: 'BinaryExpression',
      operator: a, left: toEstree(b),
      right: toEstree(c) };
  return { type: 'MemberExpression',
    object: toEstree(a),
    property: tag === 'dot' ? b
      : toEstree(b),
    computed: tag === 'idx' };
}`,
        why: 'For `dot` the property is left as a string instead of an `Identifier` node, and an unknown tag such as `call` is quietly turned into a `MemberExpression` instead of being refused.',
      },
    ],
  },
  prattBinary: {
    optional: true,
    title: 'Pratt with logical operators',
    prompt: 'Write `parseExpr(src)` for space-separated tokens using binding powers: `||` 2, `&&` 3, `<` 8, `+` and `-` 10, `*` 11, `**` 12 (right-associative). Numbers become `Literal`s, names `Identifier`s. `&&` and `||` build `LogicalExpression`s, every other operator a `BinaryExpression`, each `{ type, operator, left, right }`.',
    starter: `function parseExpr(src) {
  // your code here
}`,
    solution: `const BP = { '||': 2, '&&': 3, '<': 8,
  '+': 10, '-': 10, '*': 11, '**': 12 };
const LOG = ['&&', '||'];
function parseExpr(src) {
  const ts = src.split(' ');
  let p = 0;
  const leaf = (t) => /^\\d+$/.test(t)
    ? { type: 'Literal', value: +t }
    : { type: 'Identifier', name: t };
  function binary(minBp) {
    let left = leaf(ts[p++]);
    for (;;) {
      const op = ts[p];
      const bp = BP[op];
      if (bp === undefined ||
          bp <= minBp) break;
      p++;
      const right = binary(
        op === '**' ? bp - 1 : bp);
      const type = LOG.includes(op)
        ? 'LogicalExpression'
        : 'BinaryExpression';
      left = { type, operator: op,
        left, right };
    }
    return left;
  }
  return binary(0);
}`,
    tests: `const L = (value) => ({ type: 'Literal', value });
const I = (name) => ({ type: 'Identifier', name });
const B = (operator, left, right) =>
  ({ type: 'BinaryExpression', operator, left, right });
test('* binds tighter than -', () => {
  expect(parseExpr('1 - 2 * 3')).toEqual(B('-', L(1), B('*', L(2), L(3))));
});
test('** is right-associative', () => {
  expect(parseExpr('2 ** 3 ** 2')).toEqual(B('**', L(2), B('**', L(3), L(2))));
});
test('logical operators', () => {
  expect(parseExpr('a < 1 || b && c')).toEqual({
    type: 'LogicalExpression', operator: '||',
    left: B('<', I('a'), L(1)),
    right: { type: 'LogicalExpression', operator: '&&',
      left: I('b'), right: I('c') },
  });
});`,
    hints: [
      'Start from the example above: the loop in `binary` is the same. Only the leaves and the node you build change.',
      'Choose the node type from the operator: `LogicalExpression` for `&&` and `||`, `BinaryExpression` otherwise. ESTree separates them because `&&` and `||` short-circuit.',
    ],
    walkthrough: `**How to think about it.** The loop is the one from the example: parse a leaf, then keep taking operators whose binding power is *greater* than the minimum you were called with, parsing each right side with a call to \`binary\` at that operator's power. Only two things are new: the table now has \`||\`, \`&&\` and \`<\`, and the node you build depends on the operator, because ESTree gives \`&&\` and \`||\` their own type.

**The solution, line by line.**

- \`const BP = { '||': 2, '&&': 3, '<': 8,\` / \`  '+': 10, '-': 10, '*': 11, '**': 12 };\` is the whole precedence table: a higher number binds tighter.
- \`const LOG = ['&&', '||'];\` lists the operators that become \`LogicalExpression\`s.
- \`  const ts = src.split(' ');\` / \`  let p = 0;\` makes the token list and a position.
- \`  const leaf = (t) => /^\\d+$/.test(t)\` / \`    ? { type: 'Literal', value: +t }\` / \`    : { type: 'Identifier', name: t };\` turns one token into a leaf node.
- \`  function binary(minBp) {\` / \`    let left = leaf(ts[p++]);\` reads the first leaf.
- \`      const op = ts[p];\` / \`      const bp = BP[op];\` looks at the next token's power (\`undefined\` at the end).
- \`      if (bp === undefined ||\` / \`          bp <= minBp) break;\` stops when there is no operator, or it binds no tighter than the caller's.
- \`      p++;\` takes the operator.
- \`      const right = binary(\` / \`        op === '**' ? bp - 1 : bp);\` parses the right side; for \`**\`, one lower, so another \`**\` is still taken there (right-associative).
- \`      const type = LOG.includes(op)\` / \`        ? 'LogicalExpression'\` / \`        : 'BinaryExpression';\` picks the node type.
- \`      left = { type, operator: op,\` / \`        left, right };\` wraps what we have as the new left.
- \`  return binary(0);\` starts with the lowest minimum, so any operator can be taken.

Trace \`a < 1 || b && c\`: \`binary(0)\` reads \`a\`, takes \`<\` (8 > 0), and its right side \`binary(8)\` reads \`1\` and stops at \`||\` (2 ≤ 8). Back at the top, \`||\` (2 > 0) is taken, and its right side \`binary(2)\` reads \`b\`, takes \`&&\` (3 > 2) with right side \`c\`. So \`||\` ends up at the root with \`a < 1\` on its left and \`b && c\` on its right.

**Common wrong attempts.**

- Building a \`BinaryExpression\` for every operator gives the right shape but the wrong type for \`&&\` and \`||\`. ESTree separates them because they may skip their right side, and a tool that lowers them, like Viscosity's, needs to know that from the node type alone.
- Using \`bp < minBp\` instead of \`<=\` makes \`1 - 2 - 3\` group to the right, as \`1 - (2 - 3)\`, which is a different number.`,
    wrong: [
      {
        code: `const BP = { '||': 2, '&&': 3, '<': 8,
  '+': 10, '-': 10, '*': 11, '**': 12 };
function parseExpr(src) {
  const ts = src.split(' ');
  let p = 0;
  const leaf = (t) => /^\\d+$/.test(t)
    ? { type: 'Literal', value: +t }
    : { type: 'Identifier', name: t };
  function binary(minBp) {
    let left = leaf(ts[p++]);
    for (;;) {
      const op = ts[p];
      const bp = BP[op];
      if (bp === undefined ||
          bp <= minBp) break;
      p++;
      const right = binary(bp);
      left = { type: 'BinaryExpression',
        operator: op, left, right };
    }
    return left;
  }
  return binary(0);
}`,
        why: 'This makes `**` left-associative (`(2 ** 3) ** 2`) and builds `BinaryExpression` for `&&` and `||`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In ESTree, `ps[i].x` is a `MemberExpression` whose `object` is…',
    options: [
      {
        t: 'an `Identifier` named `ps`',
        why: 'That is the innermost object. The outer node’s object is `ps[i]`.',
      },
      {
        t: 'a `Literal`',
        why: 'There is no literal in `ps[i].x`.',
      },
      {
        t: 'another `MemberExpression`, for `ps[i]`, with `computed: true`',
        correct: true,
        why: '`.x` is not computed; `[i]` is. Two nested member expressions.',
      },
      {
        t: 'a `CallExpression`',
        why: 'Nothing is called here.',
      },
    ],
  },
  {
    q: 'In `p.x += p.vx;`, the right side `p.vx` has `start: 7` and `end: 11`. What is `source.slice(7, 11)`?',
    options: [
      {
        t: '`p.vx;`',
        why: 'The semicolon is at offset 11, and `end` is one past the last character, so it is not included.',
      },
      {
        t: '`.vx`',
        why: 'The range starts at 7, which is the `p`.',
      },
      {
        t: '`p.vx`',
        correct: true,
        why: 'A node’s text is exactly the slice from `start` up to, not including, `end`.',
      },
      {
        t: '`+= p.vx`',
        why: 'That belongs to the assignment, which starts earlier.',
      },
    ],
  },
  {
    q: 'Which of these would let Viscosity replace acorn with another parser without changing anything else?',
    options: [
      {
        t: 'The other parser is written in TypeScript',
        why: 'The language it is written in does not matter.',
      },
      {
        t: 'The other parser is faster',
        why: 'Speed is nice, but it does not make the trees fit.',
      },
      {
        t: 'The other parser can parse TypeScript',
        why: 'Viscosity strips types before parsing anyway.',
      },
      {
        t: 'The other parser produces the same ESTree slice, with offsets and lines',
        correct: true,
        why: 'Everything after the parser reads only that slice, as `estree.ts` describes it.',
      },
    ],
  },
  {
    q: 'Why does the acorn adapter collect comments itself?',
    options: [
      {
        t: '`@viscosity` annotations live in comments, and acorn reports comments only through its callback',
        correct: true,
        why: 'The plugin then matches each annotation to the declaration on the next line.',
      },
      {
        t: 'To delete them from the output',
        why: 'Comments are kept: emit copies untouched text exactly.',
      },
      {
        t: 'Because ESTree forbids comments',
        why: 'ESTree tools commonly attach comments; acorn just doesn’t put them in the tree.',
      },
      {
        t: 'To count lines for explain',
        why: '`locations: true` gives line numbers.',
      },
    ],
  },
  {
    q: 'How does the mini parser decide that `1 - 2 * 3` means `1 - (2 * 3)`?',
    options: [
      {
        t: 'It tries both trees and picks the smaller one',
        why: 'It never backtracks over expressions; one pass decides.',
      },
      {
        t: 'A grammar rule per precedence level',
        why: 'That is another valid technique, but the mini parser uses a binding-power table.',
      },
      {
        t: 'acorn tells it',
        why: 'The mini parser doesn’t use acorn at all.',
      },
      {
        t: '`*` has binding power 11, more than `-`’s 10, so `binary(10)` takes it into the right side of `-`',
        correct: true,
        why: 'That is Pratt parsing: the loop continues while the next operator binds tighter than the minimum.',
      },
    ],
  },
];
