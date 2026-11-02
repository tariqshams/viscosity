// Chapter 72 cards. Keys are stable ids: never rename them.
//
// The parsers here use tokens as plain strings, made with
// '1 + 2 * 3'.split(' '), so brackets need spaces: '( 1 + 2 ) * 3'.
// Trees print in the same format as the companion’s printExpr.

export const prompts = {
  'parser-what': {
    q: 'What does a parser do?',
    a: 'It turns a list of tokens into a syntax tree, following a grammar.',
  },
  'precedence-what': {
    q: 'What does it mean that `*` has higher precedence than `+`?',
    a: '`*` binds tighter: in `1 + 2 * 3`, the product `2 * 3` becomes one operand of `+`.',
  },
  'lower-tighter': {
    q: 'In a grammar with one rule per precedence level, which operators do the lowest rules (just above primary) handle?',
    a: 'The tightest-binding ones. Each rule builds its operands from the rule below it.',
  },
  'brackets-restart': {
    q: 'Why can brackets override precedence in `(1 + 2) * 3`?',
    a: '`primary` parses a bracketed group by starting again from the top rule, so the whole sum becomes one operand of `*`.',
  },
  'rd-what': {
    q: 'What is recursive descent?',
    a: 'Writing a parser with one function per grammar rule, the functions calling each other as the rules refer to each other.',
  },
  'rd-star': {
    q: 'In recursive descent, what does a `*` (“zero or more”) in a rule become in code?',
    a: 'A `while` loop.',
  },
  'factor-sees-plus': {
    q: 'While parsing `1 + 2 * 3`, `factor` has read `1` and sees `+`. What does it do?',
    a: 'It returns `1`. `+` is not one of its operators, so it leaves the token for `term`.',
  },
  'unary-self': {
    q: 'Why does the `unary` function call itself?',
    a: 'Its rule is `( "!" | "-" ) unary`, so prefix operators can stack, as in `- - 1` or `!!x`.',
  },
  'assoc-what': {
    q: 'What does associativity decide?',
    a: 'How a chain of operators on the same precedence level groups, e.g. whether `a - b - c` is `(a - b) - c` or `a - (b - c)`.',
  },
  'loop-left': {
    q: 'Why does the `while` loop in `term` make `-` left-associative?',
    a: 'Each pass builds a new node with the whole tree so far as its left child.',
  },
  'left-recursion': {
    q: 'Why can’t you code `term → term "-" factor` directly as a recursive descent function?',
    a: '`term()` would first call `term()` with the same token next, forever, until the stack overflows.',
  },
  'companion-split': {
    q: 'In the companion’s parser, which parts use recursive descent, and which use Pratt parsing?',
    a: 'Statements use recursive descent; expressions use Pratt parsing (chapter 73). Both build the same kind of tree.',
  },
};

export const examples = {
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
    while (at('*', '/')) {
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
        throw new Error("Expect ')'");
      }
      return { kind: 'group', e };
    }
    if (t === 'true') return lit(true);
    if (t === 'false') {
      return lit(false);
    }
    if (t === 'nil') return lit(null);
    if (/^[0-9]/.test(t)) {
      return lit(Number(t));
    }
    throw new Error('Expect expr');
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
        ? 'nil' : String(e.value);
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
  termFactor: {
    title: 'Parse 1 + 2 * 3',
    prompt:
      'Finish the parser by writing `term` and `factor`. Their rules are in the comments: a `term` is factors joined by `+` or `-`, and a `factor` is primaries joined by `*` or `/`. Build each operator into a binary node with `bin(left, op, right)`. Both levels must be left-associative.',
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
    walkthrough: `Each function is its grammar rule, read left to right.

\`\`\`js
function term() {
  let left = factor();
  while (at('+', '-')) {
    const op = next();
    const right = factor();
    left = bin(left, op, right);
  }
  return left;
}
\`\`\`

- **\`factor ...\`**: a term always begins with a factor, so call \`factor()\`.
- **\`( ("+" | "-") factor )*\`**: zero or more times, so a \`while\` loop. \`at\` peeks without taking; \`next\` takes the operator once we know it is ours.
- **Left associativity** comes from \`left = bin(left, op, right)\`: each new node holds everything built so far on its left. For \`1 - 2 - 3\`, \`left\` is first \`1\`, then \`(- 1 2)\`, then \`(- (- 1 2) 3)\`.
- **Precedence** comes from who calls whom. \`term\`’s operands are factors, and a factor swallows every \`*\` and \`/\` before returning. So by the time \`term\` sees a \`+\`, the products on both sides are already complete nodes.

\`factor\` is identical with \`*\`, \`/\` and \`primary\`. And notice that \`primary\` calls \`term\` for brackets: that loop back to the top is what makes \`( 1 + 2 ) * 3\` work.`,
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
    prompt:
      'Add the rule `comparison → term ( ( "<" | "<=" | ">" | ">=" ) term )*` to a finished parser. `parse` and the bracket case in `primary` already start from `comparison`; write its body.',
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
    walkthrough: `A new precedence level is one more function with the same shape, inserted above the levels that bind tighter:

\`\`\`js
function comparison() {
  let left = term();
  while (at('<', '<=', '>', '>=')) {
    const op = next();
    const right = term();
    left = bin(left, op, right);
  }
  return left;
}
\`\`\`

Because its operands are terms, every \`+\` and \`-\` is finished before a comparison is built, so \`1 + 2 < 4\` compares the sum. The companion’s grammar adds \`equality\` above this in exactly the same way. (Drip happily parses \`1 < 2 < 3\`; it is the evaluator, later, that will reject comparing \`true\` with \`3\`.)`,
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
    q: 'A grammar lists `term` (for `+` `-`) above `factor` (for `*` `/`), each built from the rule below. What tree does it give `2 * 3 + 4`?',
    options: [
      { t: '`(* 2 (+ 3 4))`', why: 'That would need `+` to bind tighter than `*`.' },
      { t: '`(+ (* 2 3) 4)`', correct: true, why: '`factor` finishes `2 * 3` first, and `term` adds 4 to it.' },
      { t: '`(+ 2 (* 3 4))`', why: 'The tokens are in the order 2 * 3 + 4; the `*` is between 2 and 3.' },
      { t: 'It depends on the order of the tokens only', why: 'Precedence is about operators, wherever they appear.' },
    ],
  },
  {
    q: 'In recursive descent, what does the grammar rule `factor → unary ( ( "*" | "/" ) unary )*` become?',
    options: [
      { t: 'A table of operators and their priorities', why: 'That is closer to Pratt parsing (next chapter).' },
      { t: 'A `factor` function that calls `factor()` first', why: 'The rule starts with `unary`, not `factor`.' },
      { t: 'A function that calls `unary()`, then loops while the next token is `*` or `/`, calling `unary()` again each time', correct: true, why: 'Nonterminals become calls; `*` becomes a loop.' },
      { t: 'A separate pass over the tokens for each operator', why: 'One pass is enough: the functions consume tokens as they go.' },
    ],
  },
  {
    q: 'How does Drip group `10 - 4 - 3`, and what is its value?',
    options: [
      { t: '`10 - (4 - 3)`, which is 9', why: 'That is right-associative grouping. Drip’s `-` is left-associative.' },
      { t: 'It is a syntax error', why: 'Chains of the same operator are fine.' },
      { t: '`(10 - 4) - 3`, which is 3', correct: true, why: 'The loop wraps the tree so far, so the first subtraction is deeper and runs first.' },
      { t: 'It depends on the spaces', why: 'Spaces are dropped by the scanner.' },
    ],
  },
  {
    q: 'You code the rule `term → term "-" factor` as `function term() { const l = term(); ... }`. What happens?',
    options: [
      { t: 'It recurses forever, without using a token, until the stack overflows', correct: true, why: 'Left recursion can’t be coded directly; use `factor ( "-" factor )*` and a loop.' },
      { t: 'It works, and gives right associativity', why: 'It never gets as far as building anything.' },
      { t: 'It works, and gives left associativity', why: 'In a grammar the rule means left-associative, but this code never returns.' },
      { t: 'JavaScript rejects the function as a syntax error', why: 'The code is valid JavaScript; the problem only shows when it runs.' },
    ],
  },
  {
    q: 'In this chapter’s parser, why does `primary` call `expression()` (the top rule) for `(`?',
    options: [
      { t: 'To skip the brackets', why: 'The brackets are consumed, but the reason for calling the top rule is what goes inside them.' },
      { t: 'Because brackets have the lowest precedence', why: 'Brackets aren’t an operator with a precedence; they contain a full expression.' },
      { t: 'To make the parser faster', why: 'Speed isn’t the point.' },
      { t: 'So that any expression, even a loose one like `1 + 2`, can sit inside the brackets and act as a single operand', correct: true, why: 'Starting over at the top is how brackets override precedence.' },
    ],
  },
  {
    q: 'Which statement about the companion’s parser (`companion/ts/src/parser.ts`) is true?',
    options: [
      { t: 'It uses recursive descent for everything', why: 'Expressions use Pratt parsing.' },
      { t: 'It uses recursive descent for statements and Pratt parsing for expressions, and the trees match this chapter’s parser', correct: true, why: 'Both approaches give the same precedence and associativity.' },
      { t: 'It uses Pratt parsing for statements', why: 'Statements such as `if` and `while` are parsed one function per rule.' },
      { t: 'It builds a parse tree with a node for every rule', why: 'It builds an AST of `Expr` and `Stmt` nodes.' },
    ],
  },
];
