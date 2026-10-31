// Chapter 92 cards. Keys are stable ids: never rename them.

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
  'es-offsets': {
    q: 'Why does Viscosity need each ESTree node’s `start` and `end` offsets?',
    a: 'VIR’s source references point at them, and emit replaces exactly those ranges of the text.',
  },
  'pa-what': {
    q: 'What is a parser adapter?',
    a: 'Code that wraps a third-party parser behind your own interface, so the rest of the system depends only on the format it hands over.',
  },
  'pa-comments': {
    q: 'Why does the acorn adapter pass an `onComment` callback?',
    a: 'acorn reports comments through it, not in the tree, and `@viscosity` annotations live in comments.',
  },
  'pa-ts': {
    q: 'How does Viscosity parse TypeScript?',
    a: 'It strips the types with sucrase first, then parses the resulting JavaScript.',
  },
  'mp-two': {
    q: 'Which two techniques does the mini parser combine?',
    a: 'Recursive descent for statements, and Pratt parsing (binding powers) for expressions.',
  },
  'mp-right': {
    q: 'How does the mini parser make `**` right-associative?',
    a: 'It parses the right side with `binary(bp - 1)`, so another `**` (same power) is still taken on the right.',
  },
  'mp-asi': {
    q: 'When does the mini parser accept a missing semicolon?',
    a: 'Before `}`, at the end of input, or when the next token starts a new line (automatic semicolon insertion).',
  },
  'mp-test': {
    q: 'What exactly does `mini-parser.test.ts` require of the two parsers?',
    a: 'For every corpus and benchmark program, the compiled code and the explanation must be byte-identical.',
  },
  'mp-why': {
    q: 'Why keep the hand-written parser if acorn handles all of JavaScript?',
    a: 'It is readable teaching code, and keeping it working forces the plugin to depend only on ESTree, so parsers stay swappable.',
  },
};

export const examples = {
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
    title: 'Parse a declaration into ESTree',
    prompt:
      'Write `parseLet(src)` by recursive descent for the statement `let NAME = EXPR;` (or `const`; the `;` is optional). `EXPR` is terms joined by `+` or `-`, left to right; a term is a whole number or a name. Return ESTree: a `VariableDeclaration` with `kind` and one `VariableDeclarator` (`id`, `init`). Numbers are `{ type: \'Literal\', value }`, names `{ type: \'Identifier\', name }`, and `a + b` is `{ type: \'BinaryExpression\', operator, left, right }`. Throw a `SyntaxError` if the input doesn’t fit: no `let`/`const`, a target that isn’t a name, a missing `=`, or tokens left over. The tokenizer and `peek`/`next` are written for you.',
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
    walkthrough: `This is the shape of the mini parser’s \`varDecl\` and \`binary\`, at toy size, and it produces real ESTree: acorn would give the same \`type\`s and fields for these inputs (plus positions).

- **One function per rule.** \`term\` and \`expr\` mirror the grammar. The declaration code is the top rule: \`kind\`, then a name, then \`=\`, then an expression.
- **Left-associative by looping.** Each pass wraps everything parsed so far as the \`left\` of a new node, so \`a + 1 - b\` becomes \`(a + 1) - b\`. A recursive \`expr\` on the right would have built \`a + (1 - b)\`, which is a different number.
- **Reject, don’t guess.** A parser that skips tokens it doesn’t expect will one day hand the compiler a tree that means something else. The mini parser’s rule, “anything outside the subset is a syntax error”, is what makes it safe to use in a compiler.
- **Leftovers matter.** Without the final check, \`let x = 1 2\` would quietly parse as \`let x = 1\`.`,
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
  prattBinary: {
    optional: true,
    title: 'Pratt with logical operators',
    prompt:
      'Write `parseExpr(src)` for space-separated tokens using binding powers: `||` 2, `&&` 3, `<` 8, `+` and `-` 10, `*` 11, `**` 12 (right-associative). Numbers become `Literal`s, names `Identifier`s. `&&` and `||` build `LogicalExpression`s, every other operator a `BinaryExpression`, each `{ type, operator, left, right }`.',
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
    walkthrough: `The whole precedence table lives in one object. \`||\` has the lowest power, so it is taken last and ends up at the top of the tree; \`<\` binds tighter than \`&&\`, so \`a < 1\` stays together. Adding an operator is one line in the table, which is why Pratt parsing suits JavaScript’s twenty-odd binary operators so well.

ESTree splits \`LogicalExpression\` from \`BinaryExpression\` because \`&&\`, \`||\` and \`??\` may skip evaluating their right side. A tool that lowers them, like Viscosity’s, needs to know that from the node type alone.`,
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
    q: 'Why does the acorn adapter collect comments itself?',
    options: [
      { t: '`@viscosity` annotations live in comments, and acorn reports comments only through its callback', correct: true, why: 'The plugin then matches each annotation to the declaration on the next line.' },
      { t: 'To delete them from the output', why: 'Comments are kept: emit copies untouched text exactly.' },
      { t: 'Because ESTree forbids comments', why: 'ESTree tools commonly attach comments; acorn just doesn’t put them in the tree.' },
      { t: 'To count lines for explain', why: '`locations: true` gives line numbers.' },
    ],
  },
  {
    q: 'How does the mini parser decide that `1 - 2 * 3` means `1 - (2 * 3)`?',
    options: [
      { t: 'It tries both trees and picks the smaller one', why: 'It never backtracks over expressions; one pass decides.' },
      { t: 'A grammar rule per precedence level', why: 'That is another valid technique, but the mini parser uses a binding-power table.' },
      { t: 'acorn tells it', why: 'The mini parser doesn’t use acorn at all.' },
      { t: '`*` has binding power 11, more than `-`’s 10, so `binary(10)` takes it into the right side of `-`', correct: true, why: 'That is Pratt parsing: the loop continues while the next operator binds tighter than the minimum.' },
    ],
  },
  {
    q: 'The mini parser meets `a?.b`. What happens?',
    options: [
      { t: 'It parses it as `a.b`', why: 'That would silently change the meaning: `a?.b` doesn’t throw when `a` is null.' },
      { t: 'It throws a syntax error naming optional chaining', correct: true, why: '“optional chaining is not supported by the mini parser”: outside the subset, it stops rather than guess.' },
      { t: 'It falls back to acorn', why: 'There is no automatic fallback; you choose the parser with `--parser`.' },
      { t: 'It turns it into an opaque instruction', why: 'Opaque is VIR, after parsing. A parser can’t lower what it couldn’t parse.' },
    ],
  },
  {
    q: 'How does the repository check that the mini parser is a drop-in replacement for acorn?',
    options: [
      { t: 'It compares the two trees as JSON', why: 'The trees differ in harmless details (key order, `loc`). The test compares what matters.' },
      { t: 'It doesn’t: the mini parser is untested', why: '`mini-parser.test.ts` exists, and also checks precedence and error messages.' },
      { t: 'It compiles every corpus and benchmark program with both and requires identical code and explanation', correct: true, why: 'A differential test: if the plugin can’t tell the parsers apart, they are interchangeable for Viscosity.' },
      { t: 'It runs test262 against both', why: 'The repository doesn’t run test262; the mini parser only claims a subset.' },
    ],
  },
];
