// Chapter 121 cards. Keys are stable ids: never rename them.

export const prompts = {
  'single-pass-what': {
    q: 'What makes Drip’s bytecode compiler **single-pass**?',
    a: 'It reads the source once and emits bytecode while parsing, without building a syntax tree first.',
  },
  'two-tokens': {
    q: 'Which tokens does the compiler hold at any moment?',
    a: 'Two: `previous` (just consumed) and `current` (the lookahead). The scanner makes each one on demand.',
  },
  'what-lost': {
    q: 'What does a single-pass compiler give up compared with one that builds a tree first?',
    a: 'It can only use what it has already read; it can’t look over the whole program before deciding what to emit.',
  },
  'emit-what': {
    q: 'What does it mean to **emit** an instruction?',
    a: 'To append its bytes to the end of the chunk being compiled.',
  },
  'emit-line': {
    q: 'Which source line does `emit` tag each byte with?',
    a: 'The line of `previous`, the token most recently consumed.',
  },
  'emit-after': {
    q: 'Why does `binary` emit its opcode *after* calling `parsePrecedence`?',
    a: 'The right operand’s code must come first, so both values are on the stack when the operator runs.',
  },
  'grouping-emits': {
    q: 'What bytes does the `grouping` rule emit for `(...)` itself?',
    a: 'None. Parentheses only change the order in which the inside is compiled.',
  },
  'prec-plus-one': {
    q: 'Why does `binary` compile its right operand at `getRule(op).prec + 1`?',
    a: 'So an operator of the same precedence on the right is not absorbed, which makes operators group to the left.',
  },
  'ge-two-ops': {
    q: 'What does the compiler emit for `a >= b`?',
    a: 'The operands, then `OP_LESS` and `OP_NOT`: “not (a < b)”.',
  },
  'nan-catch': {
    q: 'What does Drip’s VM print for `print 0 / 0 >= 1;`, and why is that a problem?',
    a: '`true`, because `NaN < 1` is false and `NOT` flips it. Every comparison with NaN should be false, and the tree-walker prints `false`.',
  },
  'expr-stmt-pop': {
    q: 'Why does an expression statement like `1 + 2;` end with `OP_POP`?',
    a: 'Its value is never used, so it is popped to keep the stack from growing.',
  },
};

export const examples = {
  'exprs-vm': {
    title: 'Expressions on the VM',
    lang: 'drip-vm',
    code: `print 1 + 2 * 3 - 4;
print -(1 + 2) * 3;
print !(2 >= 3);
print "a" + "b" == "ab";
1 + 2; // compiled, then popped`,
  },
};

const head = `const OP = {
  CONST: 0, ADD: 1, SUB: 2, MUL: 3,
};
const PREC = { '+': 1, '-': 1, '*': 2 };
const OPCODE = {
  '+': OP.ADD, '-': OP.SUB, '*': OP.MUL,
};

function compile(tokens) {
  const code = [];
  const consts = [];
  let i = 0;
  const emit = (b) => code.push(...b);
  function parse(min) {
    consts.push(tokens[i++]);
    emit([OP.CONST, consts.length - 1]);
    while (PREC[tokens[i]] >= min) {
      const op = tokens[i++];`;

const foot = `    }
  }
  parse(1);
  return { code, consts };
}`;

export const exercises = {
  'mini-compile': {
    title: 'A single-pass compiler in miniature',
    prompt:
      '`compile(tokens)` takes tokens like `[1, "+", 2, "*", 3]` and emits bytecode straight away, Pratt-style, with no tree. Numbers are done: each becomes `OP.CONST` plus its index in `consts`. Here `emit` takes an array of bytes. Finish the loop body: after taking an operator, compile its right operand, then emit the operator’s opcode. `*` binds tighter than `+` and `-`, and all three group to the left.',
    starter: `${head}
      // right operand, then the opcode
${foot}`,
    solution: `${head}
      parse(PREC[op] + 1);
      emit([OPCODE[op]]);
${foot}`,
    tests: `function run({ code, consts }) {
  const st = [];
  let ip = 0;
  while (ip < code.length) {
    const op = code[ip++];
    if (op === 0) {
      st.push(consts[code[ip++]]);
      continue;
    }
    const b = st.pop(), a = st.pop();
    st.push(op === 1 ? a + b
      : op === 2 ? a - b : a * b);
  }
  return st.pop();
}
test('a lone number', () => {
  const r = compile([5]);
  expect(r.code).toEqual([0, 0]);
  expect(r.consts).toEqual([5]);
});
test('1 + 2 * 3: tighter operator first', () => {
  expect(compile([1, '+', 2, '*', 3]).code)
    .toEqual([0, 0, 0, 1, 0, 2, 3, 1]);
});
test('2 * 3 + 1', () => {
  expect(compile([2, '*', 3, '+', 1]).code)
    .toEqual([0, 0, 0, 1, 3, 0, 2, 1]);
});
test('8 - 3 - 1 groups to the left', () => {
  const r = compile([8, '-', 3, '-', 1]);
  expect(r.code)
    .toEqual([0, 0, 0, 1, 2, 0, 2, 2]);
  expect(run(r)).toBe(4);
});
test('the bytes compute the answer', () => {
  const t = [1, '+', 2, '*', 3, '-', 4];
  expect(run(compile(t))).toBe(3);
});`,
    hints: [
      'The right operand of an operator is itself an expression: compile it with a recursive `parse` call.',
      'Pass `PREC[op] + 1` so that an operator of the same strength on the right is left for this loop to take next. That gives left grouping.',
      'Two lines: `parse(PREC[op] + 1);` then `emit([OPCODE[op]]);`.',
    ],
    walkthrough: `The loop body is the same two lines as Drip’s \`binary\`:

\`\`\`js
parse(PREC[op] + 1);
emit([OPCODE[op]]);
\`\`\`

- **Operand, then opcode.** \`emit\` only appends, so whatever is emitted first runs first. Compiling the right operand before emitting the operator means both values are on the stack when the operator runs. That’s why \`1 + 2 * 3\` produces \`MUL\` before \`ADD\`, even though \`+\` was read first.
- **\`+ 1\` for left grouping.** In \`8 - 3 - 1\`, the first \`-\` compiles its right operand with \`min\` = 2. The second \`-\` has precedence 1, so that inner call stops after \`3\`, and the outer loop takes the second \`-\`: \`(8 - 3) - 1 = 4\`. Passing \`PREC[op]\` instead would let the inner call grab it, giving \`8 - (3 - 1) = 6\`.
- **No tree.** At no point is there an object for “the \`+\` node”. The call stack holds the half-finished operators for exactly as long as they’re needed, then they’re emitted and gone.`,
    wrong: [
      {
        code: `${head}
      emit([OPCODE[op]]);
      parse(PREC[op] + 1);
${foot}`,
        why: 'This emits the operator before its right operand, so the VM would reach `ADD` with only one value on the stack. Emit after compiling the operand.',
      },
      {
        code: `${head}
      parse(PREC[op]);
      emit([OPCODE[op]]);
${foot}`,
        why: 'With `PREC[op]` the inner call also takes the next operator of the same strength, so `8 - 3 - 1` becomes `8 - (3 - 1)`. Use `PREC[op] + 1` for left grouping.',
      },
    ],
  },
  'at-least': {
    optional: true,
    title: 'Greater or equal, NaN-proof',
    lang: 'drip-vm',
    prompt:
      'On this VM, `a >= b` compiles to “not (a < b)”, which is wrong when either side is `NaN`. Rewrite `atLeast` so it gives the right answer on the VM for all four calls, still without using `>=` or `<=`. The expected output is `true`, `true`, `false`, `false`.',
    starter: `fn atLeast(a, b) {
  return a >= b;
}

let nan = 0 / 0;
print atLeast(2, 1);
print atLeast(1, 1);
print atLeast(0, 1);
print atLeast(nan, 1);`,
    solution: `fn atLeast(a, b) {
  return a > b or a == b;
}

let nan = 0 / 0;
print atLeast(2, 1);
print atLeast(1, 1);
print atLeast(0, 1);
print atLeast(nan, 1);`,
    tests: `true
true
false
false`,
    hints: [
      '`>` and `==` each compile to a single instruction (`OP_GREATER`, `OP_EQUAL`), and each is false when a `NaN` is involved.',
      '“At least” means “greater, or equal”.',
      'Return `a > b or a == b`.',
    ],
    walkthrough: `\`a >= b\` becomes \`OP_LESS, OP_NOT\`. For \`NaN\`, \`NaN < 1\` is false, and \`NOT\` turns it into true. The rewrite avoids any \`NOT\`:

\`\`\`
return a > b or a == b;
\`\`\`

\`OP_GREATER\` uses JavaScript’s \`>\`, which is false for \`NaN\`, and \`OP_EQUAL\` uses \`===\`, also false for \`NaN\`. So the result is false, as IEEE 754 intends.

The cost is two comparisons and a short-circuit jump instead of one comparison. The real fix belongs in the VM: separate \`OP_GREATER_EQUAL\` and \`OP_LESS_EQUAL\` instructions, one more line each in the dispatch loop. That’s the trade-off the compiler made: fewer opcodes, at the price of a corner case.`,
    wrong: [
      {
        code: `fn atLeast(a, b) {
  return !(a < b);
}

let nan = 0 / 0;
print atLeast(2, 1);
print atLeast(1, 1);
print atLeast(0, 1);
print atLeast(nan, 1);`,
        why: 'This is exactly what `>=` already compiles to: `LESS` then `NOT`, which turns NaN’s false into true.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does the compiler emit for `print 2 * 3 + 1;`, in order (ignoring the final NIL and RETURN)?',
    options: [
      { t: 'CONSTANT 2, CONSTANT 3, MULTIPLY, CONSTANT 1, ADD, PRINT', correct: true, why: '`*` is compiled as the left operand of `+`, so its code comes first, and each opcode follows its operands.' },
      { t: 'CONSTANT 2, CONSTANT 3, CONSTANT 1, ADD, MULTIPLY, PRINT', why: 'That computes `2 * (3 + 1)`. `*` is tighter, so it finishes before the `+` is read.' },
      { t: 'MULTIPLY, ADD, CONSTANT 2, CONSTANT 3, CONSTANT 1, PRINT', why: 'Opcodes are emitted after their operands, never before.' },
      { t: 'PRINT, CONSTANT 2, CONSTANT 3, MULTIPLY, CONSTANT 1, ADD', why: '`OP_PRINT` is emitted after the expression has been compiled.' },
    ],
  },
  {
    q: 'What does “single-pass” mean for Drip’s bytecode compiler?',
    options: [
      { t: 'It can compile only one statement', why: 'It compiles whole programs; “pass” is about how many times it reads the source.' },
      { t: 'Each instruction runs only once', why: 'That’s about running, not compiling. Loops will run instructions many times.' },
      { t: 'It reads the source once and emits code as it parses, with no tree', correct: true, why: 'Parsing and code generation happen in the same read.' },
      { t: 'It scans all tokens in one pass before parsing', why: 'It does the opposite: the scanner produces tokens one at a time, on demand.' },
    ],
  },
  {
    q: 'In `binary`, what goes wrong if you swap the two lines, emitting the opcode before calling `parsePrecedence`?',
    options: [
      { t: 'Nothing: the VM reorders instructions', why: 'The VM runs bytes exactly in the order they were emitted.' },
      { t: 'Operators would group to the right', why: 'Grouping is decided by the precedence passed, not by when the opcode is emitted.' },
      { t: 'The compiler would report a syntax error', why: 'Parsing is unchanged; only the bytes come out in the wrong order.' },
      { t: 'The operator would run before its right operand is on the stack', correct: true, why: 'Emission order is execution order, so the opcode must follow both operands.' },
    ],
  },
  {
    q: 'Which line does the compiler tag a byte with?',
    options: [
      { t: 'The line of `previous`, the token just consumed', correct: true, why: '`emit` passes `previous.line` to `chunk.write`.' },
      { t: 'The line of `current`, the lookahead', why: 'The lookahead may already be on the next line. The byte belongs to what was just read.' },
      { t: 'The line where the statement started', why: 'A statement can span several lines, and each byte gets the line it came from.' },
      { t: 'Always line 1 for expressions', why: 'Chapter 119’s error on line 3 shows otherwise.' },
    ],
  },
  {
    q: 'Why does `print 0 / 0 >= 1;` print `true` on Drip’s VM?',
    options: [
      { t: '`0 / 0` is a runtime error that the VM ignores', why: 'Dividing zero by zero gives `NaN`, a perfectly good number value, with no error.' },
      { t: '`>=` compiles to LESS then NOT, and `NaN < 1` is false, so NOT makes it true', correct: true, why: 'Under IEEE 754 every comparison with NaN is false, so “not less” isn’t the same as “greater or equal”.' },
      { t: 'The VM compares the values as strings', why: 'Both operands are numbers, and `OP_LESS` compares numbers.' },
      { t: 'Precedence makes it `0 / (0 >= 1)`', why: '`/` is tighter than `>=`, so it’s `(0 / 0) >= 1`.' },
    ],
  },
  {
    q: 'Why is `1 + 2;` compiled with an `OP_POP` at the end?',
    options: [
      { t: 'To print the value', why: 'Only `print` prints. An expression statement’s value is thrown away.' },
      { t: 'To undo the addition', why: 'The addition has happened; POP only discards its result.' },
      { t: 'The value is never used, and leaving it would make the stack grow', correct: true, why: 'Every statement should leave the stack as it found it.' },
      { t: 'POP marks the end of a statement for the disassembler', why: 'The disassembler doesn’t know about statements at all.' },
    ],
  },
];
