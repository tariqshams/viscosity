// Chapter 318 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

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
  'it-eof': {
    q: 'At the end of the file the stack is `[0, 4, 8]`. What does the tokenizer emit before EOF?',
    a: 'Two DEDENTs, one for each width above 0, so every open block is closed.',
  },
  'it-cpython': {
    q: 'In CPython, which stage reports an *unexpected* indent (an INDENT where no block may start): the tokenizer or the parser?',
    a: 'The parser: the tokenizer only compares widths and emits the INDENT, and whether a block may start there is a question of grammar.',
  },
  'it-tab': {
    q: 'How wide is a tab in Viscosity’s tokenizer?',
    a: 'It moves the width on to the next multiple of 8 (so a tab after 3 spaces reaches 8).',
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
  logicalLines: {
    title: 'Logical lines inside brackets',
    prompt: 'Write `logicalLines(src)`. Split `src` into physical lines and join the ones that are inside brackets `( [ {` into one logical line. A continuation line is trimmed and added after a single space. Skip blank lines. A logical line keeps the indentation of its first physical line. (Ignore strings and comments: assume brackets only appear as brackets.) Make sure the line after a bracket that closes on a continuation line still starts a new logical line.',
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
    walkthrough: `**How to think about it.** Do the third test by hand first. The source is \`xs = [1,\` then \`      2]\` then \`print(xs)\`. After the first physical line one bracket is open, so the statement is not finished; after the second, the bracket is closed, so the logical line \`xs = [1, 2]\` is complete; the third line is a statement of its own. So the decision "is this logical line finished?" can only be made *after* reading a whole physical line and counting its brackets, and the thing that decides it is the bracket depth, never the line end. That gives the plan: keep a running \`depth\` and a string \`cur\` for the logical line being built; add each physical line to \`cur\`; update \`depth\`; and when \`depth\` is back to 0, the logical line is finished.

**The solution, line by line.**

- \`function logicalLines(src) {\` takes the whole source as one string.
- \`  const out = [];\` will hold the finished logical lines.
- \`  let cur = '';\` is the logical line being built.
- \`  let depth = 0;\` counts brackets that are open right now.
- \`  for (const raw of src.split('\\n')) {\` visits each physical line.
- \`    const line = depth > 0\` and \`      ? raw.trim() : raw;\` trim a line only if it is a continuation (a bracket is still open from before), because a continuation's leading spaces mean nothing; the first physical line keeps its indentation, which the indentation stack will measure.
- \`    if (!line.trim()) continue;\` skips blank lines, both between statements and inside brackets.
- \`    cur += (cur ? ' ' : '') + line;\` appends the line, with one space in front if something is already there.
- \`    for (const c of line) {\` walks the characters of this line;
- \`      if ('([{'.includes(c)) depth++;\` counts an opening bracket;
- \`      if (')]}'.includes(c)) depth--;\` counts a closing one.
- \`    if (depth === 0) {\` asks the only question that matters, after the whole physical line has been read.
- \`      out.push(cur);\` and \`      cur = '';\` finish the logical line and start a new one.
- \`  return out;\` returns them.

For the nested test, \`a = f([1,\` leaves depth 2, \`  2],\` brings it to 1, and \`  3)\` to 0, so the three physical lines become \`a = f([1, 2], 3)\`, and \`b = 0\` starts afresh.

**Common wrong attempts.**

- Gluing continuation lines on untrimmed and without a space: their indentation lands in the middle of the logical line.
- Splitting on line ends and ignoring brackets: a call over two lines becomes two half-statements, neither of which parses.
- Deciding "a new line starts here" with a flag set while a bracket was still open: that is exactly the bug the chapter describes, where the line end after a closing bracket was mistaken for a blank line.`,
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
      {
        t: 'Emits DEDENT',
        why: 'DEDENT is for a narrower line.',
      },
      {
        t: 'Pushes 8 and emits one INDENT',
        correct: true,
        why: 'Any width larger than the top opens one block, however much larger.',
      },
      {
        t: 'Emits two INDENTs, one per 4 spaces',
        why: 'There is one INDENT per push, and a push records the actual width, not steps of 4.',
      },
      {
        t: 'Reports inconsistent indentation',
        why: 'A wider line is always fine for the tokenizer; whether an indent is allowed there is the parser’s question.',
      },
    ],
  },
  {
    q: 'At the end of the file the stack is `[0, 4, 8]`. What comes before EOF?',
    options: [
      {
        t: 'Nothing: the file just ends',
        why: 'Then two blocks would never be closed, and the parser would be left inside them.',
      },
      {
        t: 'Three DEDENTs',
        why: 'The 0 is never popped.',
      },
      {
        t: 'Two DEDENTs',
        correct: true,
        why: 'One for every width above 0 still on the stack.',
      },
      {
        t: 'A syntax error',
        why: 'Ending inside blocks is normal: the last lines of a function are usually indented.',
      },
    ],
  },
  {
    q: 'Why produce INDENT/DEDENT tokens at all, instead of letting the parser count spaces?',
    options: [
      {
        t: 'So the parser can treat blocks like braces and stay an ordinary recursive descent parser',
        correct: true,
        why: 'All the whitespace logic lives in one place, and the grammar looks like any other language’s.',
      },
      {
        t: 'Because spaces cannot be stored in tokens',
        why: 'They could; it would just make the parser messy.',
      },
      {
        t: 'To make Python files smaller',
        why: 'Tokens never go back into the file.',
      },
      {
        t: 'Because Python ignores indentation',
        why: 'Python’s blocks are made of indentation.',
      },
    ],
  },
  {
    q: 'A Python file has three lines: `xs = [1,`, then `      2]`, then `print(xs)`. How many NEWLINE tokens does the tokenizer produce?',
    options: [
      {
        t: 'Three, one per physical line',
        why: 'The line end after `[1,` is inside an open bracket, so it does not end a statement.',
      },
      {
        t: 'Two, one per logical line',
        correct: true,
        why: 'The bracket joins the first two lines into one statement; NEWLINE marks the end of a logical line. (CPython’s `tokenize` module reports the inner line end as `NL`, a non-logical newline that the parser never sees.)',
      },
      {
        t: 'One, at the end of the file',
        why: '`print(xs)` is a statement of its own, so the first statement needs its own NEWLINE.',
      },
      {
        t: 'Two, plus an INDENT for the second line',
        why: 'Inside brackets the second line’s width is never measured, so no INDENT is made.',
      },
    ],
  },
  {
    q: 'With the stack `[0, 4]`, which of these lines is an inconsistent-indentation error?',
    options: [
      {
        t: 'A line with 8 spaces',
        why: 'Wider than the top: it pushes 8 and emits one INDENT.',
      },
      {
        t: 'A line with 0 spaces',
        why: 'Pop 4 (one DEDENT); the top is 0, which matches.',
      },
      {
        t: 'A line with 2 spaces',
        correct: true,
        why: 'Pop 4; the top is 0, and 2 matches no open block.',
      },
      {
        t: 'A line with 4 spaces',
        why: 'It matches the top exactly, so no token is emitted at all.',
      },
    ],
  },
];
