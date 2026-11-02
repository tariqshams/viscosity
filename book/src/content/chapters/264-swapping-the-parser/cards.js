// Chapter 263b cards (split from 245). Keys are stable ids: never rename them.

export const prompts = {
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
  toEstree: {
    title: 'An adapter for a foreign tree',
    prompt:
      'A different parser returns its trees as arrays: `[\'num\', 3]`, `[\'name\', \'x\']`, `[\'bin\', \'+\', left, right]`, `[\'dot\', obj, \'x\']` for `obj.x`, and `[\'idx\', obj, e]` for `obj[e]`. Write the adapter `toEstree(n)` that turns any such tree into ESTree: `Literal` (`value`), `Identifier` (`name`), `BinaryExpression` (`operator`, `left`, `right`) and `MemberExpression` (`object`, `property`, `computed`). For `dot`, the property is an `Identifier` and `computed` is `false`; for `idx`, the property is the converted `e` and `computed` is `true`. Throw an `Error` for any other tag.',
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
    q: 'Viscosity compiles a `.ts` file. Why does the explanation still give the right line numbers, after the types are stripped?',
    options: [
      { t: 'acorn understands TypeScript directly', why: 'It does not: sucrase strips the types first.' },
      { t: 'The plugin adds the missing lines back afterwards', why: 'Nothing needs adding: no lines are removed in the first place.' },
      { t: 'sucrase removes types but keeps every line, leaving blank lines where declarations like `interface` were', correct: true, why: 'So line n of the JavaScript is line n of your TypeScript.' },
      { t: 'Explain counts lines in the original file separately', why: 'It uses the lines acorn reports for the stripped JavaScript.' },
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
