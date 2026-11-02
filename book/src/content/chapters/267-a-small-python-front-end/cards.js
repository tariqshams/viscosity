// Chapter 267 cards. Keys are stable ids: never rename them.

export const prompts = {
  'it-what': {
    q: 'What does Python’s tokenizer emit when a line is indented further than the open block?',
    a: 'One INDENT token (and it pushes the new width on the stack).',
  },
  'it-stack': {
    q: 'What is on the indentation stack before the first line is read?',
    a: 'A single 0, which is never popped.',
  },
  'it-two': {
    q: 'A line goes from width 8 back to width 0, with the stack `[0, 4, 8]`. How many DEDENT tokens?',
    a: 'Two: one for each width popped (8 and 4).',
  },
  'it-bad': {
    q: 'With the stack `[0, 4, 8]`, a line has width 2. What happens, and why?',
    a: '8 and 4 are popped, the top is 0, and 2 ≠ 0: no open block has width 2, so it is an inconsistent-indentation error.',
  },
  'it-brackets': {
    q: 'Why does a line end inside `( ... )` produce no NEWLINE token?',
    a: 'Inside brackets, lines join into one logical line, so the tokenizer tracks bracket depth and ignores line ends and indentation while it is above 0.',
  },
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
};

export const examples = {
  indents: {
    title: 'INDENT and DEDENT from a list of lines',
    code: `function indents(lines) {
  const stack = [0];
  const out = [];
  for (const line of lines) {
    let col = 0;
    while (line[col] === ' ') col++;
    if (col === line.length) continue;
    let top = stack[stack.length - 1];
    if (col > top) {
      stack.push(col);
      out.push('INDENT');
    } else {
      while (col < top) {
        stack.pop();
        out.push('DEDENT');
        top = stack[stack.length - 1];
      }
      if (col !== top) {
        throw new Error('inconsistent');
      }
    }
    out.push(line.trim());
  }
  while (stack.length > 1) {
    stack.pop();
    out.push('DEDENT');
  }
  return out;
}

const src = [
  'for p in ps:',
  '    p.x += 1',
  '    if p.x > 9:',
  '        p.x = 0',
  'print(ps)',
];
console.log(indents(src).join('\\n'));`,
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
    walkthrough: `This is \`block()\` from \`parser.ts\`, with lines in place of statements.

- **INDENT and DEDENT are braces.** \`block()\` is the body between them. It stops at \`DEDENT\` without consuming it, so whoever opened the block can check it closed and skip it. Two DEDENTs in a row close two blocks: each \`block()\` call returns, and its caller skips one.
- **The colon is a promise.** In Python every compound statement (\`if\`, \`for\`, \`def\`, ...) ends its header with \`:\` and must have a block. That is why a missing INDENT after \`:\` is an error, and an INDENT after anything else is too.
- **Which component finds which error.** The tokenizer (the Run example above) only knows widths, so it catches widths that match no open block. Whether an indent is *allowed* here is grammar, so the parser catches it. CPython divides the work the same way.

The real parser does the same with \`peek()\` and \`p++\`, and also accepts \`if x: y = 1\` on one line.`,
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
  logicalLines: {
    optional: true,
    title: 'Logical lines inside brackets',
    prompt:
      'Write `logicalLines(src)`. Split `src` into physical lines and join the ones that are inside brackets `( [ {` into one logical line. A continuation line is trimmed and added after a single space. Skip blank lines. A logical line keeps the indentation of its first physical line. (Ignore strings and comments: assume brackets only appear as brackets.) Make sure the line after a bracket that closes on a continuation line still starts a new logical line.',
    starter: `function logicalLines(src) {
  return src.split('\\n');
}`,
    solution: `function logicalLines(src) {
  const out = [];
  let cur = '';
  let depth = 0;
  for (const raw of src.split('\\n')) {
    const line = depth > 0
      ? raw.trim() : raw;
    if (!line.trim()) continue;
    cur += (cur ? ' ' : '') + line;
    for (const c of line) {
      if ('([{'.includes(c)) depth++;
      if (')]}'.includes(c)) depth--;
    }
    if (depth === 0) {
      out.push(cur);
      cur = '';
    }
  }
  return out;
}`,
    tests: `test('lines without brackets stay as they are', () => {
  expect(logicalLines('a = 1\\n    b = 2')).toEqual(['a = 1', '    b = 2']);
});
test('a call over two lines is one logical line', () => {
  const src = '    ps.append(P(1.0,\\n                2.0))';
  expect(logicalLines(src)).toEqual(['    ps.append(P(1.0, 2.0))']);
});
test('the line after the closing bracket is a new line', () => {
  const src = 'xs = [1,\\n      2]\\nprint(xs)';
  expect(logicalLines(src)).toEqual(['xs = [1, 2]', 'print(xs)']);
});
test('blank lines are skipped, even inside brackets', () => {
  expect(logicalLines('f(1,\\n\\n  2)\\n\\ng()')).toEqual(['f(1, 2)', 'g()']);
});
test('nested brackets', () => {
  expect(logicalLines('a = f([1,\\n  2],\\n  3)\\nb = 0')).toEqual(['a = f([1, 2], 3)', 'b = 0']);
});`,
    hints: [
      'Keep a `depth` counter for open brackets, and a string `cur` for the logical line being built.',
      'For each physical line, add it to `cur` (trimmed, after a space, if it is a continuation), then update `depth` from its characters.',
      'When `depth` is back to 0 at the end of a physical line, the logical line is complete: push `cur` and start a new one.',
    ],
    walkthrough: `This is the job of the tokenizer’s \`depth\` counter, done on whole lines.

- **Depth decides, not indentation.** While \`depth > 0\`, a line’s leading spaces mean nothing, so the continuation is trimmed. Only the first physical line’s indentation is kept, because that is the one the indentation stack will measure.
- **The end of a logical line is decided *after* reading a physical line.** Here a logical line ends exactly when a physical line ends with \`depth === 0\`. The bug described in the chapter (since fixed) came from deciding with a flag that was set while depth was still above 0: the closing \`]\` brought depth back to 0, but the flag said “we are at the start of a line”, so the real line end was taken for a blank line.
- **Blank lines** are ignored in both places: Python’s reference says blank logical lines produce no NEWLINE, and blank continuation lines are allowed inside brackets.`,
    wrong: [
      {
        code: `function logicalLines(src) {
  const out = [];
  let cur = '';
  let depth = 0;
  for (const line of src.split('\\n')) {
    if (!line.trim()) continue;
    cur += line;
    for (const c of line) {
      if ('([{'.includes(c)) depth++;
      if (')]}'.includes(c)) depth--;
    }
    if (depth === 0) {
      out.push(cur);
      cur = '';
    }
  }
  return out;
}`,
        why: 'Continuation lines are glued on untrimmed and without a space, so their indentation ends up in the middle of the logical line.',
      },
      {
        code: `function logicalLines(src) {
  const out = [];
  for (const l of src.split('\\n')) {
    if (l.trim()) out.push(l);
  }
  return out;
}`,
        why: 'This ignores brackets entirely: a call split over two lines becomes two half-statements, neither of which parses.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'The stack is `[0, 4]`. The next line has width 8. What does the tokenizer do?',
    options: [
      { t: 'Emits DEDENT', why: 'DEDENT is for a narrower line.' },
      { t: 'Pushes 8 and emits one INDENT', correct: true, why: 'Any width larger than the top opens one block, however much larger.' },
      { t: 'Emits two INDENTs, one per 4 spaces', why: 'There is one INDENT per push, and a push records the actual width, not steps of 4.' },
      { t: 'Reports inconsistent indentation', why: 'A wider line is always fine for the tokenizer; whether an indent is allowed there is the parser’s question.' },
    ],
  },
  {
    q: 'At the end of the file the stack is `[0, 4, 8]`. What comes before EOF?',
    options: [
      { t: 'Nothing: the file just ends', why: 'Then two blocks would never be closed, and the parser would be left inside them.' },
      { t: 'Three DEDENTs', why: 'The 0 is never popped.' },
      { t: 'Two DEDENTs', correct: true, why: 'One for every width above 0 still on the stack.' },
      { t: 'A syntax error', why: 'Ending inside blocks is normal: the last lines of a function are usually indented.' },
    ],
  },
  {
    q: 'Why produce INDENT/DEDENT tokens at all, instead of letting the parser count spaces?',
    options: [
      { t: 'So the parser can treat blocks like braces and stay an ordinary recursive descent parser', correct: true, why: 'All the whitespace logic lives in one place, and the grammar looks like any other language’s.' },
      { t: 'Because spaces cannot be stored in tokens', why: 'They could; it would just make the parser messy.' },
      { t: 'To make Python files smaller', why: 'Tokens never go back into the file.' },
      { t: 'Because Python ignores indentation', why: 'Python’s blocks are made of indentation.' },
    ],
  },
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
    q: 'Before it was fixed, the real tokenizer dropped a NEWLINE after a bracket that closed on a continuation line. What was the effect?',
    options: [
      { t: 'The program was mis-transformed and printed different output', why: 'The parser stopped with “expected end of line”, so the file was not transformed at all.' },
      { t: 'Python itself rejects such files', why: 'They are perfectly good Python.' },
      { t: 'The file was left untouched: safe, but a missed opportunity', correct: true, why: 'Failing closed protected correctness; the cost was that many real files were skipped. `multiline_call.py` now pins the fix.' },
      { t: 'Only the bracketed line was skipped', why: 'A syntax error stops the whole file.' },
    ],
  },
];
