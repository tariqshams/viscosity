// Chapter 83b cards (split from chapter 83). Keys are stable ids.
//
// The parsers here use tokens as plain strings, made with
// '1 + 2 * 3'.split(' '), so brackets need spaces: '( 1 + 2 ) * 3'.
// Trees print in the same format as the companion’s printExpr.

export const prompts = {
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
];
