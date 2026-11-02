// Chapter 286 (second half) cards. Keys are stable ids: never rename them.

export const prompts = {
  'ps-what': {
    q: 'What is Viscosity’s Python subset?',
    a: 'The part of Python its parser accepts: functions, dataclasses, lists, for/while/if, assignment, arithmetic and calls.',
  },
  'ps-fail': {
    q: 'What does Viscosity do with a file that uses a list comprehension?',
    a: 'The parser refuses it, the plugin returns an empty module, and the file is emitted exactly as it was.',
  },
  'ps-chain': {
    q: 'Why does the parser refuse `a < b < c` instead of parsing it as two `<`?',
    a: 'In Python it means `a < b and b < c`. Parsing it like JavaScript’s `(a < b) < c` would build the wrong tree.',
  },
  'pp-block': {
    q: 'In Python’s block rule, which tokens play the part of `{` and `}`?',
    a: 'INDENT and DEDENT (after the `:` and a NEWLINE).',
  },
  'pp-elif': {
    q: 'How does Viscosity’s parser handle `elif`?',
    a: 'It rewrites the `elif` token to `if` and parses a nested `if` as the `else` branch.',
  },
  'ps-explain': {
    q: 'A file is refused by the parser. What does `viscosity explain` print for it today?',
    a: '“No arrays of objects found.” The reason is kept inside the plugin (`unsupported`) but not yet shown.',
  },
  'pp-notin': {
    q: 'How does the parser recognise the operator `not in`, which is two words?',
    a: 'When it sees `not` (or `is`), it looks one token ahead for `in` (or `not`) and treats the pair as one operator.',
  },
  'pp-power': {
    q: 'What is `-2 ** 2` in Python, and how does the parser get it?',
    a: '`-4`: `**` binds tighter than the unary minus on its left, so it parses as `-(2 ** 2)`.',
  },
};

export const exercises = {
  nest: {
    title: 'Parse blocks from INDENT and DEDENT',
    prompt:
      'Now the parser’s side. `toks` is a list of tokens: each line’s text (like `\'for p in ps:\'`), plus `\'INDENT\'` and `\'DEDENT\'`. Write `nest(toks)` that returns the block structure as nested arrays: a line that ends with `:` is followed by an array holding its block. For example `[\'if x:\', \'INDENT\', \'y = 1\', \'DEDENT\', \'z = 2\']` gives `[\'if x:\', [\'y = 1\'], \'z = 2\']`. Throw an `Error` with message `\'expected an indented block\'` if a `:` line is not followed by INDENT, and `\'unexpected indent\'` if an INDENT follows any other line.',
    starter: `function nest(toks) {
  return toks;
}`,
    solution: `function nest(toks) {
  let i = 0;
  function block() {
    const out = [];
    while (i < toks.length &&
           toks[i] !== 'DEDENT') {
      const t = toks[i++];
      if (t === 'INDENT') {
        throw new Error(
          'unexpected indent');
      }
      out.push(t);
      if (t.endsWith(':')) {
        if (toks[i] !== 'INDENT') {
          const m = 'expected an ' +
            'indented block';
          throw new Error(m);
        }
        i++;
        out.push(block());
        i++;
      }
    }
    return out;
  }
  return block();
}`,
    tests: `test('a flat program', () => {
  expect(nest(['a = 1', 'b = 2'])).toEqual(['a = 1', 'b = 2']);
});
test('one block', () => {
  expect(nest(['if x:', 'INDENT', 'y = 1', 'DEDENT', 'z = 2'])).toEqual(['if x:', ['y = 1'], 'z = 2']);
});
test('nested blocks closed by two DEDENTs', () => {
  const t = ['def f(ps):', 'INDENT', 'for p in ps:', 'INDENT', 'p.x += 1', 'DEDENT', 'DEDENT', 'f(qs)'];
  expect(nest(t)).toEqual(['def f(ps):', ['for p in ps:', ['p.x += 1']], 'f(qs)']);
});
test('a block that continues after an inner one', () => {
  const t = ['for p in ps:', 'INDENT', 'if p.x:', 'INDENT', 'n += 1', 'DEDENT', 'p.x = 0', 'DEDENT'];
  expect(nest(t)).toEqual(['for p in ps:', ['if p.x:', ['n += 1'], 'p.x = 0']]);
});
function message(f) {
  try { f(); } catch (e) { return e.message; }
  return 'no error';
}
test('a colon needs a block', () => {
  expect(message(() => nest(['if x:', 'y = 1']))).toBe('expected an indented block');
});
test('an indent needs a colon', () => {
  expect(message(() => nest(['a = 1', 'INDENT', 'b = 2', 'DEDENT']))).toBe('unexpected indent');
});`,
    hints: [
      'Use one index `i` shared by a recursive helper `block()`. `block()` reads lines until it sees `DEDENT` (or runs out) and returns them as an array.',
      'After pushing a line that ends with `:`, expect `INDENT`, skip it, and push the result of calling `block()` again for the inner block.',
      'When the inner `block()` returns, the current token is its `DEDENT`: skip it with `i++` so the outer block can carry on.',
    ],
    walkthrough: `**How to think about it.** This is \`block()\` from \`parser.ts\`, with whole lines in place of statements, so think of INDENT as \`{\` and DEDENT as \`}\`. Work the second test by hand: \`'if x:'\` ends with a colon, so a block must follow; the INDENT opens it; \`'y = 1'\` is inside; the DEDENT closes it; \`'z = 2'\` is back outside. The natural shape is a recursive helper, \`block()\`, that reads lines until it meets a DEDENT and returns them, calling itself whenever a line ends with a colon. The one subtle point is who skips the DEDENT: \`block()\` *stops* at it without consuming it, and the caller that opened the block skips it, exactly as the real parser does with its final \`p++\`.

**The solution, line by line.**

- \`function nest(toks) {\` takes the token list.
- \`  let i = 0;\` is the position in \`toks\`, shared by every call of the helper (it lives outside \`block\`, so an inner call moves it on for the outer one too).
- \`  function block() {\` reads one block's lines.
- \`    const out = [];\` collects them.
- \`    while (i < toks.length &&\` and \`           toks[i] !== 'DEDENT') {\` keep going until the end of the input or the DEDENT that closes this block, which is left in place.
- \`      const t = toks[i++];\` takes the next token and moves past it.
- \`      if (t === 'INDENT') {\` catches an INDENT that no colon asked for;
- \`        throw new Error(\` and \`          'unexpected indent');\` report it.
- \`      out.push(t);\` adds the line to this block.
- \`      if (t.endsWith(':')) {\` notices a header that promises a block.
- \`        if (toks[i] !== 'INDENT') {\` checks the promise is kept;
- \`          const m = 'expected an ' +\` and \`            'indented block';\` build the message (split to fit the width),
- \`          throw new Error(m);\` and report it if not.
- \`        i++;\` skips the INDENT.
- \`        out.push(block());\` parses the inner block recursively and adds it as a nested array, right after its header.
- \`        i++;\` skips the DEDENT that the inner call stopped at, so this block can carry on with the next line.
- \`    return out;\` returns this block's lines; \`  return block();\` starts with the top level.

For the nested test, the outer \`block()\` reads \`'def f(ps):'\`, calls \`block()\` for its body, which reads \`'for p in ps:'\` and calls \`block()\` again for \`'p.x += 1'\`; that call stops at the first DEDENT, the middle call skips it and stops at the second, the outer call skips that one and reads \`'f(qs)'\`.

**Common wrong attempts.**

- Forgetting the \`i++\` after the recursive call: the outer loop sees the inner block's DEDENT and stops too, so \`'z = 2'\` after an \`if\` is lost.
- Dropping INDENT and DEDENT altogether and returning a flat list: the structure, which is the entire point of those tokens, is thrown away, and nobody can tell which lines are inside the loop.
- Checking neither error: a missing block after a colon, and an indent nobody asked for, are both errors in Python, and the tests check the exact messages.`,
    wrong: [
      {
        code: `function nest(toks) {
  let i = 0;
  function block() {
    const out = [];
    while (i < toks.length &&
           toks[i] !== 'DEDENT') {
      const t = toks[i++];
      out.push(t);
      if (t.endsWith(':')) {
        i++;
        out.push(block());
      }
    }
    return out;
  }
  return block();
}`,
        why: 'It never skips the DEDENT that ends an inner block, so the outer block stops there too: `z = 2` after an `if` is lost. It also checks for neither error.',
      },
      {
        code: `function nest(toks) {
  const out = [];
  for (const t of toks) {
    if (t === 'INDENT' ||
        t === 'DEDENT') continue;
    out.push(t);
  }
  return out;
}`,
        why: 'Dropping INDENT and DEDENT throws away the structure: the parser can no longer tell which lines are inside the loop. That information is the whole point of the tokens.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A file uses `d = {}` once, far from any list. What does Viscosity output?',
    options: [
      { t: 'The file with the dict line removed', why: 'Viscosity never deletes code.' },
      { t: 'A transformed file, skipping that line', why: 'Partial transformation would be unsafe: the parser stopped, so nothing in the file was analysed.' },
      { t: 'An error, and no output', why: 'The plugin catches its own syntax error and carries on.' },
      { t: 'The file exactly as it was', correct: true, why: 'Dict literals are outside the subset; the plugin returns an empty module and `emit` returns the source unchanged.' },
    ],
  },
  {
    q: 'Python prints `False` for `1 < 3 < 2`. JavaScript prints `true`. Why?',
    options: [
      { t: 'JavaScript compares numbers as strings', why: 'Both compare numbers numerically.' },
      { t: 'Python chains comparisons: `1 < 3 and 3 < 2`. JavaScript computes `(1 < 3) < 2`, i.e. `true < 2`', correct: true, why: 'Same spelling, different meaning: which is why Viscosity refuses chained comparisons rather than parse them as JavaScript would.' },
      { t: 'Python evaluates right to left', why: 'It evaluates left to right; the difference is chaining.' },
      { t: 'It is a bug in one of them', why: 'Both behave exactly as their language definitions say.' },
    ],
  },
  {
    q: 'Which of these lines does Viscosity’s parser accept?',
    options: [
      { t: '`ok = 0 <= i < n`', why: 'A chained comparison: refused, because it means something different in Python and JavaScript.' },
      { t: '`ok = 0 <= i and i < n`', correct: true, why: 'Two separate comparisons joined by `and`: every piece is in the subset.' },
      { t: '`xs = [p.x for p in ps]`', why: 'A list comprehension: refused with “list comprehensions: not supported”.' },
      { t: '`ys = xs[1:3]`', why: 'A slice: refused with “slices: not supported”.' },
    ],
  },
  {
    q: 'In `block()`, what happens if the token after `if x:` and its NEWLINE is not INDENT?',
    options: [
      { t: 'The next line is quietly treated as the body', why: 'That would accept code Python itself rejects; the parser fails instead.' },
      { t: 'The tokenizer inserts an INDENT', why: 'The tokenizer only measures widths; it never invents tokens the source does not have.' },
      { t: 'The `if` gets an empty body', why: 'Python has no empty blocks; `pass` exists for that.' },
      { t: 'The parser stops with “expected an indented block”, and the file is left unchanged', correct: true, why: '`block()` insists on INDENT after a colon and a NEWLINE.' },
    ],
  },
  {
    q: 'How does Viscosity’s parser handle `elif b:` after an `if a:` block?',
    options: [
      { t: 'It rewrites the `elif` token to `if` and parses a nested `if` as the else branch', correct: true, why: 'So `if a: ... elif b: ...` becomes `if a: ... else: if b: ...`, which means the same.' },
      { t: 'It refuses it as outside the subset', why: '`elif` is in the subset.' },
      { t: 'It parses it as a second, independent `if`', why: 'That would run the `b` test even when `a` was true.' },
    ],
  },
];
