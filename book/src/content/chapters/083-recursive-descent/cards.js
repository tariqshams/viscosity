// Chapter 83 cards. Keys are stable ids: never rename them.
//
// The parsers here use tokens as plain strings, made with
// '{ print 1 ; }'.split(' '), so every token needs spaces round it.
// Trees print in the same bracketed, operator-first style as the
// companion’s printExpr.

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
  'rd-terminal': {
    q: 'In recursive descent, what does a terminal such as `";"` in a rule become in code?',
    a: 'A check that the next token is `;`, taking it if so and reporting an error if not: `consume(\';\')`.',
  },
  'block-twice': {
    q: 'While parsing `{ { print 1 ; } }`, how many calls to `block` are running at the deepest point?',
    a: 'Two: the outer block is waiting inside its loop while the inner block runs.',
  },
  'peek-not-next': {
    q: 'Why must `statement` choose with `peek()`, not `next()`?',
    a: '`next()` takes the token while looking at it, so the chosen function (such as `block`) would no longer find its own first token.',
  },
  'one-token': {
    q: 'Why is one token of lookahead enough for `statement → printStmt | block`?',
    a: 'The two alternatives start with different tokens (`print` and `{`), so the next token alone says which one it is.',
  },
  'companion-split': {
    q: 'In the companion’s parser, which parts use recursive descent, and which use Pratt parsing?',
    a: 'Statements use recursive descent; expressions with operators use Pratt parsing. Both build the same kind of tree.',
  },
};

const top = `function parse(ts) {
  let i = 0;
  const peek = () => ts[i];
  const next = () => ts[i++];
  function consume(t) {
    if (next() !== t) {
      throw new Error('Expect ' + t);
    }
  }
`;

const printAndExpr = `  function printStmt() {
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
      throw new Error('Expect expr');
    }
    return { kind: 'name', t };
  }
`;

const stmtBlock = `  function statement() {
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
`;

const bottom = `  const tree = statement();
  if (i < ts.length) {
    throw new Error('Extra ' + ts[i]);
  }
  return tree;
}
`;

const show = `function show(n) {
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
`;

export const examples = {
  statements: {
    title: 'A parser for blocks of print statements',
    code: `${top}${stmtBlock}${printAndExpr}${bottom}
${show}
const run = (src) => console.log(
  show(parse(src.split(' '))));

run('print 7 ;');
run('{ print 1 ; print x ; }');
run('{ print 1 ; { print ( x ) ; } }');

// Try a mistake: '{ print 1 }'
// or '{ print 1 ;' (no closing }).`,
  },
};

const tests = `const shape = (s) => show(parse(s.split(' ')));
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
});`;

export const exercises = {
  blockParser: {
    title: 'Parse blocks that nest',
    prompt:
      'The helpers, `printStmt` and `expr` are written. Write `statement` and `block` for the rules `statement → printStmt | block` and `block → "{" statement* "}"`. `statement` must choose by peeking; `block` returns `{ kind: \'block\', body }`, where `body` is the array of statement nodes.',
    starter: `${top}  // statement → printStmt | block
  function statement() {
    // your code here
    return printStmt();
  }
  // block → "{" statement* "}"
  function block() {
    // your code here
  }
${printAndExpr}${bottom}
${show}
console.log(show(parse(
  '{ print 1 ; print x ; }'
    .split(' '))));`,
    solution: `${top}${stmtBlock}${printAndExpr}${bottom}
${show}`,
    tests,
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
        code: `${top}  function statement() {
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
${printAndExpr}${bottom}
${show}`,
        why: '`next()` takes the token while choosing, so `block` cannot find its `{` (and `printStmt` cannot find its `print`): every input throws `Expect {` or `Expect print`.',
      },
      {
        code: `${top}  function statement() {
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
${printAndExpr}${bottom}
${show}`,
        why: 'An `if` allows at most one statement, but `*` means zero or more: `{ print 1 ; print x ; }` throws `Expect }` at the second `print`.',
      },
    ],
  },
  ifParser: {
    optional: true,
    title: 'Add an if statement',
    prompt:
      'Add the rule `ifStmt → "if" "(" expr ")" statement ( "else" statement )?`. `statement` already sends `if` to `ifStmt`; write `ifStmt`, returning `{ kind: \'if\', c, then, else }`, with `else` set to `null` when there is no else part.',
    starter: `${top}  function statement() {
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
${printAndExpr}${bottom}
${show}`,
    solution: `${top}  function statement() {
    const t = peek();
    if (t === 'if') return ifStmt();
    if (t === '{') return block();
    return printStmt();
  }
  function ifStmt() {
    consume('if');
    consume('(');
    const c = expr();
    consume(')');
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
${printAndExpr}${bottom}
${show}`,
    tests: `const shape = (s) => show(parse(s.split(' ')));
test('if without else', () => {
  expect(shape('if ( x ) print 1 ;')).toBe('(if x (print 1))');
});
test('if with else', () => {
  expect(shape('if ( x ) print 1 ; else print 2 ;')).toBe('(if x (print 1) (print 2))');
});
test('else if needs no rule of its own', () => {
  expect(shape('if ( a ) print 1 ; else if ( b ) print 2 ;')).toBe('(if a (print 1) (if b (print 2)))');
});
test('the else field is null when missing', () => {
  expect(parse('if ( x ) print 1 ;'.split(' ')).else).toBe(null);
});
test('a missing ) is an error', () => {
  expect(() => shape('if ( x print 1 ;')).toThrow();
});`,
    hints: [
      'Read the rule left to right: two terminals, a nonterminal, a terminal, a nonterminal, then an optional group.',
      'The fixed part is `consume(\'if\')`, `consume(\'(\')`, `const c = expr()`, `consume(\')\')`, `const then = statement()`.',
      'The `?` becomes an `if`: `let other = null; if (peek() === \'else\') { next(); other = statement(); }`. Return `{ kind: \'if\', c, then, else: other }`.',
    ],
    walkthrough: `**How to think about it.** The rule is a row of pieces, and the only new thing is the \`?\` at the end. "Optional" means: look at the next token; if it can start the group, parse the group, otherwise skip it. The group starts with the terminal \`else\`, so the test is \`peek() === 'else'\`.

**The solution, line by line.**

- \`    consume('if');\` takes the keyword (\`statement\` only peeked at it).
- \`    consume('(');\` takes the opening bracket.
- \`    const c = expr();\` parses the condition.
- \`    consume(')');\` takes the closing bracket.
- \`    const then = statement();\` parses the statement to run when the condition holds; it may be a block, or another \`if\`.
- \`    let other = null;\` starts with "no else part".
- \`    if (peek() === 'else') {\` is the \`?\`: is the optional group there?
- \`      next();\` takes the \`else\` (we already know what it is, so a plain \`next\` is enough).
- \`      other = statement();\` parses the else branch.
- \`    }\` closes the \`if\`.
- \`    return { kind: 'if', c, then,\` and \`             else: other };\` build the node; \`else\` is a reserved word in JavaScript, so it is written out as a property name rather than as a variable.

Because the else branch is a whole \`statement\`, \`else if ( b ) ...\` needs no rule of its own: the statement after \`else\` happens to be another \`if\`.

**Common wrong attempt.** Making the else part required (calling \`consume('else')\` unconditionally): every \`if\` without an \`else\` then throws \`Expect else\`.`,
    wrong: [
      {
        code: `${top}  function statement() {
    const t = peek();
    if (t === 'if') return ifStmt();
    if (t === '{') return block();
    return printStmt();
  }
  function ifStmt() {
    consume('if');
    consume('(');
    const c = expr();
    consume(')');
    const then = statement();
    consume('else');
    const other = statement();
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
${printAndExpr}${bottom}
${show}`,
        why: 'The else part is optional (`?`), but this always demands it, so `if ( x ) print 1 ;` throws `Expect else`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In recursive descent, what does the rule `block → "{" statement* "}"` become?',
    options: [
      { t: 'A table of tokens and the rules they start', why: 'That is a different, table-driven kind of parser; recursive descent writes the rule as code.' },
      { t: 'A function that takes `{`, loops calling `statement()` while the next token is not `}`, then takes `}`', correct: true, why: 'Terminals become checks, the starred nonterminal becomes a loop of calls.' },
      { t: 'A function that calls `block()` first', why: 'The rule starts with the terminal `{`, not with block.' },
      { t: 'A separate pass over the tokens for each kind of statement', why: 'One pass is enough: the functions take tokens as they go.' },
    ],
  },
  {
    q: '`statement → printStmt | block`. How does the `statement` function decide which to parse?',
    options: [
      { t: 'It tries printStmt, and if that fails, starts again with block', why: 'That would work but is slow and wasteful; here the next token alone settles it.' },
      { t: 'It peeks at the next token: `{` means block, otherwise printStmt', correct: true, why: 'The two alternatives start with different tokens, so one token of lookahead is enough.' },
      { t: 'It takes the next token with `next()` and checks it', why: 'Then the chosen function cannot find its own first token.' },
    ],
  },
  {
    q: 'While parsing `{ { print 1 ; } }`, what is on the call stack when `expr` takes the `1`?',
    options: [
      { t: 'Only `expr`', why: 'Every function that called on the way down is still waiting for its answer.' },
      { t: '`statement`, `block`, `statement`, `block`, `statement`, `printStmt`, `expr`', correct: true, why: 'Each block called statement, the inner statement called printStmt, which called expr: seven calls, one inside the other.' },
      { t: '`block` and `expr`', why: 'statement and printStmt calls are waiting too.' },
      { t: 'Nothing: recursive descent does not use the call stack', why: 'It relies on it entirely: each waiting call remembers its place in its rule.' },
    ],
  },
  {
    q: 'In the companion’s `ifStatement`, how does `( "else" statement )?` become code?',
    options: [
      { t: 'A `while` loop over `else` tokens', why: 'That would be `*`; `?` allows at most one.' },
      { t: '`consume(\'else\')`, which must succeed', why: 'consume demands the token; the else part is optional.' },
      { t: '`match(\'else\') ? statement() : null`, which takes `else` only if it is there', correct: true, why: 'An optional group becomes an if on the next token; `null` means there was no else branch.' },
    ],
  },
  {
    q: 'What does the parser in this chapter do with `{ print 1 ;` (no closing `}`)?',
    options: [
      { t: 'Loops for ever, waiting for a `}`', why: 'Each time round, the loop either takes tokens or throws, so it cannot spin.' },
      { t: 'Returns a block with one statement', why: 'The rule requires the closing `}`.' },
      { t: 'Throws an error: the loop calls statement again, and printStmt finds no `print`', correct: true, why: 'With no tokens left, `consume(\'print\')` fails. (The chapter on syntax errors makes the message clearer.)' },
    ],
  },
];
