// Chapter 63 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'parser-what': {
    q: 'What does a parser do?',
    a: 'It reads a row of tokens, checks it against a grammar, and builds a syntax tree (or reports a syntax error).',
  },
  'rd-what': {
    q: 'What is recursive descent?',
    a: 'Writing a parser with one function per grammar rule, the functions calling each other as the rules mention each other.',
  },
  'rd-star': {
    q: 'In recursive descent, what does a `*` (“zero or more”) in a rule become in code?',
    a: 'A `while` loop that runs as long as the next token can start one more repeat.',
  },
  'peek-not-next': {
    q: 'In a recursive descent parser, why must a function that chooses between alternatives (such as `statement → printStmt | block`) look with `peek()` rather than take with `next()`?',
    a: '`next()` takes the token while looking at it, so the chosen function (such as `block`) would no longer find its own first token.',
  },
  'precedence-what': {
    q: 'What does it mean that `*` has higher precedence than `+`?',
    a: '`*` binds tighter: in `1 + 2 * 3`, the product `2 * 3` becomes one operand of `+`.',
  },
  'factor-sees-plus': {
    q: 'In a recursive descent parser with one function per precedence level, `factor` (for `*` and `/`) has read `1` in `1 + 2 * 3` and sees `+`. What does it do?',
    a: 'It returns `1`. `+` is not one of its operators, so it leaves the token for `term`.',
  },
  'assoc-what': {
    q: 'What does associativity decide?',
    a: 'How a chain of operators on the same precedence level groups, e.g. whether `a - b - c` is `(a - b) - c` or `a - (b - c)`.',
  },
  'loop-left': {
    q: 'In a recursive descent parser, why does a level written as `left = factor(); while (at(\'+\', \'-\')) { ... left = bin(left, op, factor()); }` make `-` left-associative?',
    a: 'Each pass builds a new node with the whole tree so far as its left child.',
  },
  'left-recursion': {
    q: 'Why can’t you code `term → term "-" factor` directly as a recursive descent function?',
    a: '`term()` would first call `term()` with the same token next, forever, until the stack overflows.',
  },
};

export const examples = {
  statements: {
    title: 'A parser for blocks of print statements',
    code: `function parse(ts) {
  let i = 0;
  const peek = () => ts[i];
  const next = () => ts[i++];
  function consume(t) {
    if (next() !== t) {
      throw new Error('expected ' + t);
    }
  }
  function statement() {
    if (peek() === '{') {
      return block();
    }
    return printStmt();
  }
  function block() {
    consume('{');
    const body = [];
    while (peek() !== '}') {
      body.push(statement());
    }
    consume('}');
    return { kind: 'block', body };
  }
  function printStmt() {
    consume('print');
    const e = expr();
    consume(';');
    return { kind: 'print', e };
  }
  function expr() {
    const t = next();
    if (t === '(') {
      const e = expr();
      consume(')');
      return { kind: 'group', e };
    }
    if (t === undefined) {
      throw new Error('expected expr');
    }
    return { kind: 'name', t };
  }
  const tree = statement();
  if (i < ts.length) {
    throw new Error('Extra ' + ts[i]);
  }
  return tree;
}

function show(n) {
  switch (n.kind) {
    case 'name': return n.t;
    case 'group':
      return \`(group \${show(n.e)})\`;
    case 'print':
      return \`(print \${show(n.e)})\`;
    case 'block':
      return '(block' + n.body
        .map((s) => ' ' + show(s))
        .join('') + ')';
    case 'if':
      return '(if ' + [n.c, n.then,
        n.else].filter((x) => x)
        .map(show).join(' ') + ')';
  }
}

const run = (src) => console.log(
  show(parse(src.split(' '))));

run('print 7 ;');
run('{ print 1 ; print x ; }');
run('{ print 1 ; { print ( x ) ; } }');

// Try a mistake: '{ print 1 }'
// or '{ print 1 ;' (no closing }).`,
  },
  fullParser: {
    title: 'A complete expression parser',
    code: `function parse(ts) {
  let i = 0;
  const at = (...ops) =>
    ops.includes(ts[i]);
  const next = () => ts[i++];
  const bin = (left, op, right) => ({
    kind: 'binary', left, op, right,
  });

  function equality() {
    let left = comparison();
    while (at('==', '!=')) {
      const op = next();
      const right = comparison();
      left = bin(left, op, right);
    }
    return left;
  }
  function comparison() {
    let left = term();
    while (at('<', '<=', '>', '>=')) {
      const op = next();
      const right = term();
      left = bin(left, op, right);
    }
    return left;
  }
  function term() {
    let left = factor();
    while (at('+', '-')) {
      const op = next();
      const right = factor();
      left = bin(left, op, right);
    }
    return left;
  }
  function factor() {
    let left = unary();
    while (at('*', '/', '%')) {
      const op = next();
      const right = unary();
      left = bin(left, op, right);
    }
    return left;
  }
  function unary() {
    if (at('!', '-')) {
      const op = next();
      const right = unary();
      return {
        kind: 'unary', op, right,
      };
    }
    return primary();
  }
  function primary() {
    const t = next();
    if (t === '(') {
      const e = equality();
      if (next() !== ')') {
        throw new Error("expected ')'");
      }
      return { kind: 'group', e };
    }
    if (t === 'true') return lit(true);
    if (t === 'false') {
      return lit(false);
    }
    if (t === 'none') return lit(null);
    if (/^[0-9]/.test(t)) {
      return lit(Number(t));
    }
    throw new Error('expected expr');
  }
  const lit = (value) =>
    ({ kind: 'literal', value });

  const tree = equality();
  if (i < ts.length) {
    throw new Error('Extra ' + ts[i]);
  }
  return tree;
}

function show(e) {
  switch (e.kind) {
    case 'literal':
      return e.value === null
        ? 'none' : String(e.value);
    case 'group':
      return \`(group \${show(e.e)})\`;
    case 'unary':
      return \`(\${e.op} \` +
        \`\${show(e.right)})\`;
    case 'binary':
      return \`(\${e.op} \` +
        \`\${show(e.left)} \` +
        \`\${show(e.right)})\`;
  }
}

const src = '1 + 2 * 3 == 7';
const tree = parse(src.split(' '));
console.log(show(tree));
console.log(show(parse(
  '1 - 2 - 3'.split(' '))));
console.log(show(parse(
  '- ( 1 + 2 ) * 3 < 4'.split(' '))));

// Try: '8 / 2 / 2', '! true == false'
// Try a mistake: '1 + * 2'`,
  },
};

export const exercises = {
  blockParser: {
    optional: true,
    title: 'Parse blocks that nest',
    prompt: 'The helpers, `printStmt` and `expr` are written. Write `statement` and `block` for the rules `statement → printStmt | block` and `block → "{" statement* "}"`. `statement` must choose by peeking; `block` returns `{ kind: \'block\', body }`, where `body` is the array of statement nodes.',
    starter: `function parse(ts) {
  let i = 0;
  const peek = () => ts[i];
  const next = () => ts[i++];
  function consume(t) {
    if (next() !== t) {
      throw new Error('expected ' + t);
    }
  }
  // statement → printStmt | block
  function statement() {
    // your code here
    return printStmt();
  }
  // block → "{" statement* "}"
  function block() {
    // your code here
  }
  function printStmt() {
    consume('print');
    const e = expr();
    consume(';');
    return { kind: 'print', e };
  }
  function expr() {
    const t = next();
    if (t === '(') {
      const e = expr();
      consume(')');
      return { kind: 'group', e };
    }
    if (t === undefined) {
      throw new Error('expected expr');
    }
    return { kind: 'name', t };
  }
  const tree = statement();
  if (i < ts.length) {
    throw new Error('Extra ' + ts[i]);
  }
  return tree;
}

function show(n) {
  switch (n.kind) {
    case 'name': return n.t;
    case 'group':
      return \`(group \${show(n.e)})\`;
    case 'print':
      return \`(print \${show(n.e)})\`;
    case 'block':
      return '(block' + n.body
        .map((s) => ' ' + show(s))
        .join('') + ')';
    case 'if':
      return '(if ' + [n.c, n.then,
        n.else].filter((x) => x)
        .map(show).join(' ') + ')';
  }
}

console.log(show(parse(
  '{ print 1 ; print x ; }'
    .split(' '))));`,
    solution: `function parse(ts) {
  let i = 0;
  const peek = () => ts[i];
  const next = () => ts[i++];
  function consume(t) {
    if (next() !== t) {
      throw new Error('expected ' + t);
    }
  }
  function statement() {
    if (peek() === '{') {
      return block();
    }
    return printStmt();
  }
  function block() {
    consume('{');
    const body = [];
    while (peek() !== '}') {
      body.push(statement());
    }
    consume('}');
    return { kind: 'block', body };
  }
  function printStmt() {
    consume('print');
    const e = expr();
    consume(';');
    return { kind: 'print', e };
  }
  function expr() {
    const t = next();
    if (t === '(') {
      const e = expr();
      consume(')');
      return { kind: 'group', e };
    }
    if (t === undefined) {
      throw new Error('expected expr');
    }
    return { kind: 'name', t };
  }
  const tree = statement();
  if (i < ts.length) {
    throw new Error('Extra ' + ts[i]);
  }
  return tree;
}

function show(n) {
  switch (n.kind) {
    case 'name': return n.t;
    case 'group':
      return \`(group \${show(n.e)})\`;
    case 'print':
      return \`(print \${show(n.e)})\`;
    case 'block':
      return '(block' + n.body
        .map((s) => ' ' + show(s))
        .join('') + ')';
    case 'if':
      return '(if ' + [n.c, n.then,
        n.else].filter((x) => x)
        .map(show).join(' ') + ')';
  }
}
`,
    tests: `const shape = (s) => show(parse(s.split(' ')));
test('one print statement', () => {
  expect(shape('print 7 ;')).toBe('(print 7)');
});
test('a block of two', () => {
  expect(shape('{ print 1 ; print x ; }')).toBe('(block (print 1) (print x))');
});
test('an empty block', () => {
  expect(shape('{ }')).toBe('(block)');
});
test('blocks nest', () => {
  expect(shape('{ { print 1 ; } print 2 ; }')).toBe('(block (block (print 1)) (print 2))');
});
test('a block with no } is an error', () => {
  expect(() => shape('{ print 1 ;')).toThrow();
});`,
    hints: [
      'Read `statement`’s rule: it is a choice between two alternatives that start with different tokens. Which token starts a block?',
      '`statement`: `if (peek() === \'{\') return block();` and otherwise `return printStmt();`. Use `peek`, not `next`: `block` needs to take the `{` itself.',
      '`block`: `consume(\'{\')`, then `const body = []`, then `while (peek() !== \'}\') body.push(statement());`, then `consume(\'}\')` and return the node.',
    ],
    walkthrough: `**How to think about it.** Each function is its rule read aloud, left to right. \`statement → printStmt | block\` is a choice, so \`statement\` must decide which alternative it is looking at before taking any token; the two alternatives start with different tokens (a block always starts with \`{\`, a print statement with \`print\`), so one peek decides. \`block → "{" statement* "}"\` is a row of three pieces: a terminal (a check), a starred nonterminal (a loop of calls) and another terminal (a check). The loop needs a condition: "can another statement start here?" The simplest honest test is "the next token is not \`}\`", because \`}\` is the only thing that may follow the statements.

**The solution, line by line.**

- \`  function statement() {\` is the rule for a statement.
- \`    if (peek() === '{') {\` looks at the next token *without taking it*.
- \`      return block();\`: a \`{\` means a block, so hand over to \`block\`, which will take the \`{\` itself, and return whatever node it builds.
- \`    }\` closes the \`if\`.
- \`    return printStmt();\`: anything else must be a print statement (if it is not, \`printStmt\`'s \`consume('print')\` reports the error).
- \`  }\` closes \`statement\`.
- \`  function block() {\` is the rule for a block.
- \`    consume('{');\` is the first terminal: take the \`{\`, or throw.
- \`    const body = [];\` will hold the statements' nodes.
- \`    while (peek() !== '}') {\` is \`statement*\`: keep going while the next token is not the closing bracket.
- \`      body.push(statement());\` parses one whole statement, which may itself be a block (recursion), and keeps its node.
- \`    }\` closes the loop; zero times round is fine, which gives the empty block \`{ }\`.
- \`    consume('}');\` is the last terminal.
- \`    return { kind: 'block', body };\` returns the block node.
- \`  }\` closes \`block\`.

For \`{ { print 1 ; } print 2 ; }\`: the outer \`block\` takes \`{\`, peeks \`{\`, and calls \`statement\`, which calls \`block\` again; the inner one takes \`{\`, parses \`print 1 ;\`, sees \`}\`, takes it and returns. The outer loop goes round, parses \`print 2 ;\`, sees \`}\` and finishes: \`(block (block (print 1)) (print 2))\`.

What if the \`}\` is missing, as in \`{ print 1 ;\`? After the print statement, \`peek()\` is \`undefined\`, which is not \`}\`, so the loop calls \`statement\` again, which calls \`printStmt\`, whose \`consume('print')\` meets no token and throws. The loop cannot spin for ever, because every time round it either takes tokens or throws.

**Common wrong attempts.**

- Choosing with \`next()\`: the \`{\` is used up by the choice, so \`block\`'s \`consume('{')\` throws on good input.
- Writing \`block\` with an \`if\` instead of a \`while\`: it parses at most one statement, so \`{ print 1 ; print x ; }\` fails at the second \`print\`, where it expected \`}\`.`,
    wrong: [
      {
        code: `function parse(ts) {
  let i = 0;
  const peek = () => ts[i];
  const next = () => ts[i++];
  function consume(t) {
    if (next() !== t) {
      throw new Error('expected ' + t);
    }
  }
  function statement() {
    if (next() === '{') {
      return block();
    }
    return printStmt();
  }
  function block() {
    consume('{');
    const body = [];
    while (peek() !== '}') {
      body.push(statement());
    }
    consume('}');
    return { kind: 'block', body };
  }
  function printStmt() {
    consume('print');
    const e = expr();
    consume(';');
    return { kind: 'print', e };
  }
  function expr() {
    const t = next();
    if (t === '(') {
      const e = expr();
      consume(')');
      return { kind: 'group', e };
    }
    if (t === undefined) {
      throw new Error('expected expr');
    }
    return { kind: 'name', t };
  }
  const tree = statement();
  if (i < ts.length) {
    throw new Error('Extra ' + ts[i]);
  }
  return tree;
}

function show(n) {
  switch (n.kind) {
    case 'name': return n.t;
    case 'group':
      return \`(group \${show(n.e)})\`;
    case 'print':
      return \`(print \${show(n.e)})\`;
    case 'block':
      return '(block' + n.body
        .map((s) => ' ' + show(s))
        .join('') + ')';
    case 'if':
      return '(if ' + [n.c, n.then,
        n.else].filter((x) => x)
        .map(show).join(' ') + ')';
  }
}
`,
        why: '`next()` takes the token while choosing, so `block` cannot find its `{` (and `printStmt` cannot find its `print`): every input throws `expected {` or `expected print`.',
      },
      {
        code: `function parse(ts) {
  let i = 0;
  const peek = () => ts[i];
  const next = () => ts[i++];
  function consume(t) {
    if (next() !== t) {
      throw new Error('expected ' + t);
    }
  }
  function statement() {
    if (peek() === '{') {
      return block();
    }
    return printStmt();
  }
  function block() {
    consume('{');
    const body = [];
    if (peek() !== '}') {
      body.push(statement());
    }
    consume('}');
    return { kind: 'block', body };
  }
  function printStmt() {
    consume('print');
    const e = expr();
    consume(';');
    return { kind: 'print', e };
  }
  function expr() {
    const t = next();
    if (t === '(') {
      const e = expr();
      consume(')');
      return { kind: 'group', e };
    }
    if (t === undefined) {
      throw new Error('expected expr');
    }
    return { kind: 'name', t };
  }
  const tree = statement();
  if (i < ts.length) {
    throw new Error('Extra ' + ts[i]);
  }
  return tree;
}

function show(n) {
  switch (n.kind) {
    case 'name': return n.t;
    case 'group':
      return \`(group \${show(n.e)})\`;
    case 'print':
      return \`(print \${show(n.e)})\`;
    case 'block':
      return '(block' + n.body
        .map((s) => ' ' + show(s))
        .join('') + ')';
    case 'if':
      return '(if ' + [n.c, n.then,
        n.else].filter((x) => x)
        .map(show).join(' ') + ')';
  }
}
`,
        why: 'An `if` allows at most one statement, but `*` means zero or more: `{ print 1 ; print x ; }` throws `expected }` at the second `print`.',
      },
    ],
  },
  ifParser: {
    optional: true,
    title: 'Add an if statement',
    prompt: 'Add Drip’s rule `ifStmt → "if" expr block ( "else" ( ifStmt | block ) )?`. `statement` already sends `if` to `ifStmt`; write `ifStmt`, returning `{ kind: \'if\', c, then, else }`, with `else` set to `null` when there is no else part.',
    starter: `function parse(ts) {
  let i = 0;
  const peek = () => ts[i];
  const next = () => ts[i++];
  function consume(t) {
    if (next() !== t) {
      throw new Error('expected ' + t);
    }
  }
  function statement() {
    const t = peek();
    if (t === 'if') return ifStmt();
    if (t === '{') return block();
    return printStmt();
  }
  function ifStmt() {
    // your code here
  }
  function block() {
    consume('{');
    const body = [];
    while (peek() !== '}') {
      body.push(statement());
    }
    consume('}');
    return { kind: 'block', body };
  }
  function printStmt() {
    consume('print');
    const e = expr();
    consume(';');
    return { kind: 'print', e };
  }
  function expr() {
    const t = next();
    if (t === '(') {
      const e = expr();
      consume(')');
      return { kind: 'group', e };
    }
    if (t === undefined) {
      throw new Error('expected expr');
    }
    return { kind: 'name', t };
  }
  const tree = statement();
  if (i < ts.length) {
    throw new Error('Extra ' + ts[i]);
  }
  return tree;
}

function show(n) {
  switch (n.kind) {
    case 'name': return n.t;
    case 'group':
      return \`(group \${show(n.e)})\`;
    case 'print':
      return \`(print \${show(n.e)})\`;
    case 'block':
      return '(block' + n.body
        .map((s) => ' ' + show(s))
        .join('') + ')';
    case 'if':
      return '(if ' + [n.c, n.then,
        n.else].filter((x) => x)
        .map(show).join(' ') + ')';
  }
}
`,
    solution: `function parse(ts) {
  let i = 0;
  const peek = () => ts[i];
  const next = () => ts[i++];
  function consume(t) {
    if (next() !== t) {
      throw new Error('expected ' + t);
    }
  }
  function statement() {
    const t = peek();
    if (t === 'if') return ifStmt();
    if (t === '{') return block();
    return printStmt();
  }
  function ifStmt() {
    consume('if');
    const c = expr();
    const then = block();
    let other = null;
    if (peek() === 'else') {
      next();
      other = peek() === 'if'
        ? ifStmt() : block();
    }
    return { kind: 'if', c, then,
             else: other };
  }
  function block() {
    consume('{');
    const body = [];
    while (peek() !== '}') {
      body.push(statement());
    }
    consume('}');
    return { kind: 'block', body };
  }
  function printStmt() {
    consume('print');
    const e = expr();
    consume(';');
    return { kind: 'print', e };
  }
  function expr() {
    const t = next();
    if (t === '(') {
      const e = expr();
      consume(')');
      return { kind: 'group', e };
    }
    if (t === undefined) {
      throw new Error('expected expr');
    }
    return { kind: 'name', t };
  }
  const tree = statement();
  if (i < ts.length) {
    throw new Error('Extra ' + ts[i]);
  }
  return tree;
}

function show(n) {
  switch (n.kind) {
    case 'name': return n.t;
    case 'group':
      return \`(group \${show(n.e)})\`;
    case 'print':
      return \`(print \${show(n.e)})\`;
    case 'block':
      return '(block' + n.body
        .map((s) => ' ' + show(s))
        .join('') + ')';
    case 'if':
      return '(if ' + [n.c, n.then,
        n.else].filter((x) => x)
        .map(show).join(' ') + ')';
  }
}
`,
    tests: `const shape = (s) => show(parse(s.split(' ')));
test('if without else', () => {
  expect(shape('if x { print 1 ; }')).toBe('(if x (block (print 1)))');
});
test('if with else', () => {
  expect(shape('if x { print 1 ; } else { print 2 ; }')).toBe('(if x (block (print 1)) (block (print 2)))');
});
test('else if needs no rule of its own', () => {
  expect(shape('if a { print 1 ; } else if b { print 2 ; }')).toBe('(if a (block (print 1)) (if b (block (print 2))))');
});
test('the else field is null when missing', () => {
  expect(parse('if x { print 1 ; }'.split(' ')).else).toBe(null);
});
test('brackets round the condition are only a grouping', () => {
  expect(shape('if ( x ) { print 1 ; }')).toBe('(if (group x) (block (print 1)))');
});
test('a body without braces is an error', () => {
  expect(() => shape('if x print 1 ;')).toThrow();
});
test('an else body without braces is an error', () => {
  expect(() => shape('if x { print 1 ; } else print 2 ;')).toThrow();
});`,
    hints: [
      'Read the rule left to right: a terminal, a nonterminal, a nonterminal, then an optional group. There are no brackets to take: Drip’s condition has none.',
      'The fixed part is `consume(\'if\')`, `const c = expr()`, `const then = block()`. Calling `block` (not `statement`) is what makes the braces required.',
      'The `?` becomes an `if`: `let other = null; if (peek() === \'else\') { next(); other = peek() === \'if\' ? ifStmt() : block(); }`. Return `{ kind: \'if\', c, then, else: other }`.',
    ],
    walkthrough: `**How to think about it.** The rule is a row of pieces, and there are two new things in it. The first is the \`?\` at the end. "Optional" means: look at the next token; if it can start the group, parse the group, otherwise skip it. The group starts with the terminal \`else\`, so the test is \`peek() === 'else'\`. The second is the choice inside the group, \`( ifStmt | block )\`: after \`else\` comes either another \`if\` or a block, and those start with different tokens (\`if\` and \`{\`), so one peek decides it, exactly as in \`statement\`. Notice also what is *not* in the rule: no \`"("\` and \`")"\` round the condition, and no plain \`statement\` as a body. Drip's bodies are always blocks, so the code calls \`block\`, and \`block\`'s own \`consume('{')\` is what reports a missing brace.

**The solution, line by line.**

- \`    consume('if');\` takes the keyword (\`statement\` only peeked at it).
- \`    const c = expr();\` parses the condition, straight after the keyword. (If someone writes \`( x )\`, \`expr\` reads it as a grouping, which is harmless.)
- \`    const then = block();\` parses the body; it must start with \`{\`, or \`block\` throws.
- \`    let other = null;\` starts with "no else part".
- \`    if (peek() === 'else') {\` is the \`?\`: is the optional group there?
- \`      next();\` takes the \`else\` (we already know what it is, so a plain \`next\` is enough).
- \`      other = peek() === 'if'\` peeks again, to choose between the two alternatives...
- \`        ? ifStmt() : block();\` ...another whole if statement (which takes its own \`if\`), or a block.
- \`    }\` closes the \`if\`.
- \`    return { kind: 'if', c, then,\` and \`             else: other };\` build the node; \`else\` is a reserved word in JavaScript, so it is written out as a property name rather than as a variable.

Because \`ifStmt\` calls itself after \`else\`, \`else if b { ... }\` needs no rule of its own: it is an if statement whose else branch is another if statement. This is exactly how the companion's \`ifStatement\` does it, with \`match('if') ? ifStatement() : bracedBody(...)\`.

**Common wrong attempts.**

- Making the else part required (calling \`consume('else')\` unconditionally): every \`if\` without an \`else\` then throws \`expected else\`.
- Parsing each body with \`statement()\` instead of \`block()\`: it works on good input, but it also accepts \`if x print 1 ;\`, which Drip rejects; the tests check that a body without braces is an error.
- Keeping the old \`consume('(')\` and \`consume(')')\`: then \`if x { ... }\` throws \`expected (\`, because Drip's conditions have no brackets.`,
    wrong: [
      {
        code: `function parse(ts) {
  let i = 0;
  const peek = () => ts[i];
  const next = () => ts[i++];
  function consume(t) {
    if (next() !== t) {
      throw new Error('expected ' + t);
    }
  }
  function statement() {
    const t = peek();
    if (t === 'if') return ifStmt();
    if (t === '{') return block();
    return printStmt();
  }
  function ifStmt() {
    consume('if');
    const c = expr();
    const then = block();
    consume('else');
    const other = peek() === 'if'
      ? ifStmt() : block();
    return { kind: 'if', c, then,
             else: other };
  }
  function block() {
    consume('{');
    const body = [];
    while (peek() !== '}') {
      body.push(statement());
    }
    consume('}');
    return { kind: 'block', body };
  }
  function printStmt() {
    consume('print');
    const e = expr();
    consume(';');
    return { kind: 'print', e };
  }
  function expr() {
    const t = next();
    if (t === '(') {
      const e = expr();
      consume(')');
      return { kind: 'group', e };
    }
    if (t === undefined) {
      throw new Error('expected expr');
    }
    return { kind: 'name', t };
  }
  const tree = statement();
  if (i < ts.length) {
    throw new Error('Extra ' + ts[i]);
  }
  return tree;
}

function show(n) {
  switch (n.kind) {
    case 'name': return n.t;
    case 'group':
      return \`(group \${show(n.e)})\`;
    case 'print':
      return \`(print \${show(n.e)})\`;
    case 'block':
      return '(block' + n.body
        .map((s) => ' ' + show(s))
        .join('') + ')';
    case 'if':
      return '(if ' + [n.c, n.then,
        n.else].filter((x) => x)
        .map(show).join(' ') + ')';
  }
}
`,
        why: 'The else part is optional (`?`), but this always demands it, so `if x { print 1 ; }` throws `expected else`.',
      },
      {
        code: `function parse(ts) {
  let i = 0;
  const peek = () => ts[i];
  const next = () => ts[i++];
  function consume(t) {
    if (next() !== t) {
      throw new Error('expected ' + t);
    }
  }
  function statement() {
    const t = peek();
    if (t === 'if') return ifStmt();
    if (t === '{') return block();
    return printStmt();
  }
  function ifStmt() {
    consume('if');
    const c = expr();
    const then = statement();
    let other = null;
    if (peek() === 'else') {
      next();
      other = statement();
    }
    return { kind: 'if', c, then,
             else: other };
  }
  function block() {
    consume('{');
    const body = [];
    while (peek() !== '}') {
      body.push(statement());
    }
    consume('}');
    return { kind: 'block', body };
  }
  function printStmt() {
    consume('print');
    const e = expr();
    consume(';');
    return { kind: 'print', e };
  }
  function expr() {
    const t = next();
    if (t === '(') {
      const e = expr();
      consume(')');
      return { kind: 'group', e };
    }
    if (t === undefined) {
      throw new Error('expected expr');
    }
    return { kind: 'name', t };
  }
  const tree = statement();
  if (i < ts.length) {
    throw new Error('Extra ' + ts[i]);
  }
  return tree;
}

function show(n) {
  switch (n.kind) {
    case 'name': return n.t;
    case 'group':
      return \`(group \${show(n.e)})\`;
    case 'print':
      return \`(print \${show(n.e)})\`;
    case 'block':
      return '(block' + n.body
        .map((s) => ' ' + show(s))
        .join('') + ')';
    case 'if':
      return '(if ' + [n.c, n.then,
        n.else].filter((x) => x)
        .map(show).join(' ') + ')';
  }
}
`,
        why: 'Each body is any `statement`, so this also accepts `if x print 1 ;`. Drip’s bodies are always blocks: call `block()`, so a missing `{` is an error.',
      },
    ],
  },
  termFactor: {
    title: 'Parse 1 + 2 * 3',
    prompt: 'Finish the parser by writing `term` and `factor`. Their rules are in the comments: a `term` is factors joined by `+` or `-`, and a `factor` is primaries joined by `*` or `/`. Build each operator into a binary node with `bin(left, op, right)`. Both levels must be left-associative.',
    starter: `function parse(ts) {
  let i = 0;
  const at = (...ops) =>
    ops.includes(ts[i]);
  const next = () => ts[i++];
  const bin = (left, op, right) => ({
    kind: 'binary', left, op, right,
  });

  // term → factor (("+" | "-") factor)*
  function term() {
    // your code here
    return factor();
  }
  // factor → primary
  //          (("*" | "/") primary)*
  function factor() {
    // your code here
    return primary();
  }
  function primary() {
    const t = next();
    if (t === '(') {
      const e = term();
      next(); // the ')'
      return { kind: 'group', e };
    }
    return {
      kind: 'literal', value: Number(t),
    };
  }
  return term();
}

function show(e) {
  if (e.kind === 'literal') {
    return String(e.value);
  }
  if (e.kind === 'group') {
    return \`(group \${show(e.e)})\`;
  }
  return \`(\${e.op} \${show(e.left)} \` +
    \`\${show(e.right)})\`;
}

const ts = '1 + 2 * 3'.split(' ');
console.log(show(parse(ts)));`,
    solution: `function parse(ts) {
  let i = 0;
  const at = (...ops) =>
    ops.includes(ts[i]);
  const next = () => ts[i++];
  const bin = (left, op, right) => ({
    kind: 'binary', left, op, right,
  });

  function term() {
    let left = factor();
    while (at('+', '-')) {
      const op = next();
      const right = factor();
      left = bin(left, op, right);
    }
    return left;
  }
  function factor() {
    let left = primary();
    while (at('*', '/')) {
      const op = next();
      const right = primary();
      left = bin(left, op, right);
    }
    return left;
  }
  function primary() {
    const t = next();
    if (t === '(') {
      const e = term();
      next(); // the ')'
      return { kind: 'group', e };
    }
    return {
      kind: 'literal', value: Number(t),
    };
  }
  return term();
}

function show(e) {
  if (e.kind === 'literal') {
    return String(e.value);
  }
  if (e.kind === 'group') {
    return \`(group \${show(e.e)})\`;
  }
  return \`(\${e.op} \${show(e.left)} \` +
    \`\${show(e.right)})\`;
}
`,
    tests: `const shape = (s) => show(parse(s.split(' ')));
test('a single number', () => {
  expect(shape('7')).toBe('7');
});
test('1 + 2', () => {
  expect(shape('1 + 2')).toBe('(+ 1 2)');
});
test('* binds tighter than +', () => {
  expect(shape('1 + 2 * 3')).toBe('(+ 1 (* 2 3))');
  expect(shape('2 * 3 + 1')).toBe('(+ (* 2 3) 1)');
});
test('- groups to the left', () => {
  expect(shape('1 - 2 - 3')).toBe('(- (- 1 2) 3)');
});
test('/ groups to the left', () => {
  expect(shape('8 / 2 / 2')).toBe('(/ (/ 8 2) 2)');
});
test('brackets override precedence', () => {
  expect(shape('( 1 + 2 ) * 3')).toBe('(* (group (+ 1 2)) 3)');
});`,
    hints: [
      'Follow the rule. A `term` starts with one `factor`: `let left = factor();`.',
      'Then loop: `while (at(\'+\', \'-\'))`, take the operator with `next()`, parse the right side with `factor()`, and replace `left` with `bin(left, op, right)`.',
      '`factor` is the same function one level down: it loops on `*` and `/`, and its operands come from `primary()`.',
    ],
    walkthrough: `**How to think about it.** Each function is its grammar rule, read left to right. \`term → factor ( ("+" | "-") factor )*\` says: one factor, then zero or more pairs of an operator and another factor. "One factor" is a call; "zero or more" is a \`while\` loop whose condition is "is the next token one of my operators?"; and inside the loop we take the operator and get the next factor. The one decision that needs thought is what to do with the pieces: each time round, the node built so far becomes the *left* child of a new node, which is what makes the chain lean left. \`factor\` is the same function one level down.

**The solution, line by line.**

- \`  function term() {\` is the rule for a term.
- \`    let left = factor();\` gets the first operand. It is \`let\`, not \`const\`, because it will be replaced as the chain grows. By the time this returns, \`factor\` has swallowed every \`*\` and \`/\` in its stretch, so \`left\` is a finished product (or a single number).
- \`    while (at('+', '-')) {\` peeks: is the next token one of this level's operators? If not (a \`*\` would never be here; it could be \`)\` or the end), the loop does not run.
- \`      const op = next();\` takes the operator, now that we know it is ours.
- \`      const right = factor();\` gets the right operand, again a whole factor.
- \`      left = bin(left, op, right);\` builds a new node with everything so far on its left. For \`1 - 2 - 3\`, \`left\` is first \`1\`, then \`(- 1 2)\`, then \`(- (- 1 2) 3)\`.
- \`    }\` closes the loop.
- \`    return left;\` hands back the tree for this whole stretch.
- \`  }\` closes \`term\`.
- \`  function factor() {\` is identical, with \`primary()\` for the operands and \`at('*', '/')\` for the loop.

**Precedence** comes from who calls whom: \`term\`'s operands are factors, and a factor finishes every \`*\` and \`/\` before returning, so when \`term\` sees a \`+\`, the products on both sides are already complete nodes. And \`primary\` calls \`term\` for \`(\`: that loop back to the top is what makes \`( 1 + 2 ) * 3\` work.

**Common wrong attempts.**

- Recursing on the right, \`return bin(left, op, term())\`, with an \`if\` instead of a loop: precedence is still right, but \`1 - 2 - 3\` becomes \`(- 1 (- 2 3))\`, which is \`2\` instead of \`-4\`.
- Swapping the levels, so \`term\` handles \`*\` and \`factor\` handles \`+\`: the loosest operators must be at the top, or \`1 + 2 * 3\` comes out as \`(* (+ 1 2) 3)\`.`,
    wrong: [
      {
        code: `function parse(ts) {
  let i = 0;
  const at = (...ops) =>
    ops.includes(ts[i]);
  const next = () => ts[i++];
  const bin = (left, op, right) => ({
    kind: 'binary', left, op, right,
  });

  function term() {
    const left = factor();
    if (at('+', '-')) {
      const op = next();
      return bin(left, op, term());
    }
    return left;
  }
  function factor() {
    const left = primary();
    if (at('*', '/')) {
      const op = next();
      return bin(left, op, factor());
    }
    return left;
  }
  function primary() {
    const t = next();
    if (t === '(') {
      const e = term();
      next(); // the ')'
      return { kind: 'group', e };
    }
    return {
      kind: 'literal', value: Number(t),
    };
  }
  return term();
}

function show(e) {
  if (e.kind === 'literal') {
    return String(e.value);
  }
  if (e.kind === 'group') {
    return \`(group \${show(e.e)})\`;
  }
  return \`(\${e.op} \${show(e.left)} \` +
    \`\${show(e.right)})\`;
}
`,
        why: 'This recurses on the right (`bin(left, op, term())`), so `1 - 2 - 3` becomes `(- 1 (- 2 3))`, which is 2 instead of -4. Precedence is right, but associativity is wrong. Use a loop that keeps wrapping `left`.',
      },
      {
        code: `function parse(ts) {
  let i = 0;
  const at = (...ops) =>
    ops.includes(ts[i]);
  const next = () => ts[i++];
  const bin = (left, op, right) => ({
    kind: 'binary', left, op, right,
  });

  function term() {
    let left = factor();
    while (at('*', '/')) {
      const op = next();
      const right = factor();
      left = bin(left, op, right);
    }
    return left;
  }
  function factor() {
    let left = primary();
    while (at('+', '-')) {
      const op = next();
      const right = primary();
      left = bin(left, op, right);
    }
    return left;
  }
  function primary() {
    const t = next();
    if (t === '(') {
      const e = term();
      next(); // the ')'
      return { kind: 'group', e };
    }
    return {
      kind: 'literal', value: Number(t),
    };
  }
  return term();
}

function show(e) {
  if (e.kind === 'literal') {
    return String(e.value);
  }
  if (e.kind === 'group') {
    return \`(group \${show(e.e)})\`;
  }
  return \`(\${e.op} \${show(e.left)} \` +
    \`\${show(e.right)})\`;
}
`,
        why: 'The levels are swapped: `term` handles `*` and `factor` handles `+`. The loosest operators must be at the top, so `1 + 2 * 3` comes out as `(* (+ 1 2) 3)`.',
      },
    ],
  },
  comparison: {
    optional: true,
    title: 'Add a comparison level',
    prompt: 'Add the rule `comparison → term ( ( "<" | "<=" | ">" | ">=" ) term )*` to a finished parser. `parse` and the bracket case in `primary` already start from `comparison`; write its body.',
    starter: `function parse(ts) {
  let i = 0;
  const at = (...ops) =>
    ops.includes(ts[i]);
  const next = () => ts[i++];
  const bin = (left, op, right) => ({
    kind: 'binary', left, op, right,
  });

  // comparison → term
  //   (("<" | "<=" | ">" | ">=") term)*
  function comparison() {
    // your code here
    return term();
  }
  function term() {
    let left = factor();
    while (at('+', '-')) {
      const op = next();
      const right = factor();
      left = bin(left, op, right);
    }
    return left;
  }
  function factor() {
    let left = primary();
    while (at('*', '/')) {
      const op = next();
      const right = primary();
      left = bin(left, op, right);
    }
    return left;
  }
  function primary() {
    const t = next();
    if (t === '(') {
      const e = comparison();
      next(); // the ')'
      return { kind: 'group', e };
    }
    return {
      kind: 'literal', value: Number(t),
    };
  }
  return comparison();
}

function show(e) {
  if (e.kind === 'literal') {
    return String(e.value);
  }
  if (e.kind === 'group') {
    return \`(group \${show(e.e)})\`;
  }
  return \`(\${e.op} \${show(e.left)} \` +
    \`\${show(e.right)})\`;
}


const ts = '1 + 2 < 4'.split(' ');
console.log(show(parse(ts)));`,
    solution: `function parse(ts) {
  let i = 0;
  const at = (...ops) =>
    ops.includes(ts[i]);
  const next = () => ts[i++];
  const bin = (left, op, right) => ({
    kind: 'binary', left, op, right,
  });

  function comparison() {
    let left = term();
    while (at('<', '<=', '>', '>=')) {
      const op = next();
      const right = term();
      left = bin(left, op, right);
    }
    return left;
  }
  function term() {
    let left = factor();
    while (at('+', '-')) {
      const op = next();
      const right = factor();
      left = bin(left, op, right);
    }
    return left;
  }
  function factor() {
    let left = primary();
    while (at('*', '/')) {
      const op = next();
      const right = primary();
      left = bin(left, op, right);
    }
    return left;
  }
  function primary() {
    const t = next();
    if (t === '(') {
      const e = comparison();
      next(); // the ')'
      return { kind: 'group', e };
    }
    return {
      kind: 'literal', value: Number(t),
    };
  }
  return comparison();
}

function show(e) {
  if (e.kind === 'literal') {
    return String(e.value);
  }
  if (e.kind === 'group') {
    return \`(group \${show(e.e)})\`;
  }
  return \`(\${e.op} \${show(e.left)} \` +
    \`\${show(e.right)})\`;
}
`,
    tests: `const shape = (s) => show(parse(s.split(' ')));
test('+ binds tighter than <', () => {
  expect(shape('1 + 2 < 4')).toBe('(< (+ 1 2) 4)');
  expect(shape('1 < 2 + 3')).toBe('(< 1 (+ 2 3))');
});
test('all four comparisons', () => {
  expect(shape('1 <= 2')).toBe('(<= 1 2)');
  expect(shape('1 >= 2')).toBe('(>= 1 2)');
  expect(shape('2 * 3 > 5')).toBe('(> (* 2 3) 5)');
});
test('comparisons group to the left', () => {
  expect(shape('1 < 2 < 3')).toBe('(< (< 1 2) 3)');
});
test('in brackets', () => {
  expect(shape('( 1 < 2 )')).toBe('(group (< 1 2))');
});`,
    hints: [
      'It has exactly the shape of `term`, one level up.',
      'Its operands come from `term()`, and its loop checks `at(\'<\', \'<=\', \'>\', \'>=\')`.',
    ],
    walkthrough: `**How to think about it.** A new precedence level is one more function with the same shape, slotted in above the levels that bind tighter. Comparisons bind more loosely than \`+\` and \`-\` (in \`1 + 2 < 4\` you compare the sum), so \`comparison\` sits above \`term\` and gets its operands from \`term()\`. Everything that used to start from the top (\`parse\` itself, and the bracket case in \`primary\`) already starts from \`comparison\`.

**The solution, line by line.**

- \`  function comparison() {\` is the new rule.
- \`    let left = term();\` gets the first operand: a whole term, so any \`+\` or \`-\` (and anything tighter) is finished first.
- \`    while (at('<', '<=', '>', '>=')) {\` loops while the next token is one of the four comparisons. The scanner made \`<=\` one token, so \`at\` compares whole tokens.
- \`      const op = next();\` takes the operator.
- \`      const right = term();\` gets the right operand, another whole term.
- \`      left = bin(left, op, right);\` wraps everything so far, so comparisons lean left too.
- \`    }\` and \`    return left;\` finish, as in every level.
- \`  }\` closes the function.

Drip happily parses \`1 < 2 < 3\` as \`(< (< 1 2) 3)\`; it is the evaluator, later, that will refuse to compare \`true\` with \`3\`. The companion's grammar adds \`equality\` above this level in exactly the same way.

**Common wrong attempt.** Taking the operands from \`factor()\` instead of \`term()\`, skipping a level: \`1 + 2 < 4\` then stops after \`1\`, because \`+\` belongs to no function that is still running, so the rest of the tokens are never read.`,
    wrong: [
      {
        code: `function parse(ts) {
  let i = 0;
  const at = (...ops) =>
    ops.includes(ts[i]);
  const next = () => ts[i++];
  const bin = (left, op, right) => ({
    kind: 'binary', left, op, right,
  });

  function comparison() {
    let left = factor();
    while (at('<', '<=', '>', '>=')) {
      const op = next();
      const right = factor();
      left = bin(left, op, right);
    }
    return left;
  }
  function term() {
    let left = factor();
    while (at('+', '-')) {
      const op = next();
      const right = factor();
      left = bin(left, op, right);
    }
    return left;
  }
  function factor() {
    let left = primary();
    while (at('*', '/')) {
      const op = next();
      const right = primary();
      left = bin(left, op, right);
    }
    return left;
  }
  function primary() {
    const t = next();
    if (t === '(') {
      const e = comparison();
      next(); // the ')'
      return { kind: 'group', e };
    }
    return {
      kind: 'literal', value: Number(t),
    };
  }
  return comparison();
}

function show(e) {
  if (e.kind === 'literal') {
    return String(e.value);
  }
  if (e.kind === 'group') {
    return \`(group \${show(e.e)})\`;
  }
  return \`(\${e.op} \${show(e.left)} \` +
    \`\${show(e.right)})\`;
}
`,
        why: 'The operands come from `factor()`, skipping the `term` level. Then `1 + 2 < 4` stops after `1`: `+` belongs to no function that is still running, so the rest of the tokens are never read.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In recursive descent, what does the rule `block → "{" statement* "}"` become?',
    options: [
      {
        t: 'A table of tokens and the rules they start',
        why: 'That is a different, table-driven kind of parser; recursive descent writes the rule as code.',
      },
      {
        t: 'A function that takes `{`, loops calling `statement()` while the next token is not `}`, then takes `}`',
        correct: true,
        why: 'Terminals become checks, the starred nonterminal becomes a loop of calls.',
      },
      {
        t: 'A function that calls `block()` first',
        why: 'The rule starts with the terminal `{`, not with block.',
      },
      {
        t: 'A separate pass over the tokens for each kind of statement',
        why: 'One pass is enough: the functions take tokens as they go.',
      },
    ],
  },
  {
    q: '`statement → printStmt | block`. How does the `statement` function decide which to parse?',
    options: [
      {
        t: 'It tries printStmt, and if that fails, starts again with block',
        why: 'That would work but is slow and wasteful; here the next token alone settles it.',
      },
      {
        t: 'It peeks at the next token: `{` means block, otherwise printStmt',
        correct: true,
        why: 'The two alternatives start with different tokens, so one token of lookahead is enough.',
      },
      {
        t: 'It takes the next token with `next()` and checks it',
        why: 'Then the chosen function cannot find its own first token.',
      },
    ],
  },
  {
    q: 'A grammar has `term → factor ( ( "+" | "-" ) factor )*` and `factor → NUMBER ( ( "*" | "/" ) NUMBER )*`, with `term` as the start symbol. What tree does it give `2 * 3 + 4`?',
    options: [
      {
        t: '`(* 2 (+ 3 4))`',
        why: 'That would need `+` to bind tighter than `*`.',
      },
      {
        t: '`(+ (* 2 3) 4)`',
        correct: true,
        why: '`factor` finishes `2 * 3` first, and `term` adds 4 to it.',
      },
      {
        t: '`(+ 2 (* 3 4))`',
        why: 'The tokens are in the order 2 * 3 + 4; the `*` is between 2 and 3.',
      },
      {
        t: 'It depends on the order of the tokens only',
        why: 'Precedence is about operators, wherever they appear.',
      },
    ],
  },
  {
    q: 'How does Drip group `10 - 4 - 3`, and what is its value?',
    options: [
      {
        t: '`10 - (4 - 3)`, which is 9',
        why: 'That is right-associative grouping. Drip’s `-` is left-associative.',
      },
      {
        t: 'It is a syntax error',
        why: 'Chains of the same operator are fine.',
      },
      {
        t: '`(10 - 4) - 3`, which is 3',
        correct: true,
        why: 'The loop wraps the tree so far, so the first subtraction is deeper and runs first.',
      },
      {
        t: 'It depends on the spaces',
        why: 'Spaces are dropped by the scanner.',
      },
    ],
  },
  {
    q: 'You code the rule `term → term "-" factor` as `function term() { const l = term(); ... }`. What happens?',
    options: [
      {
        t: 'It recurses forever, without using a token, until the stack overflows',
        correct: true,
        why: 'Left recursion can’t be coded directly; use `factor ( "-" factor )*` and a loop.',
      },
      {
        t: 'It works, and gives right associativity',
        why: 'It never gets as far as building anything.',
      },
      {
        t: 'It works, and gives left associativity',
        why: 'In a grammar the rule means left-associative, but this code never returns.',
      },
      {
        t: 'JavaScript rejects the function as a syntax error',
        why: 'The code is valid JavaScript; the problem only shows when it runs.',
      },
    ],
  },
];
