// Chapter 75 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'single-pass-what': {
    q: 'What makes Drip’s bytecode compiler **single-pass**?',
    a: 'It reads the source once and emits bytecode while parsing, without building a syntax tree first.',
  },
  'two-tokens': {
    q: 'Which tokens does Drip’s single-pass bytecode compiler hold at any moment?',
    a: 'Two: `previous` (just consumed) and `current` (the lookahead). The scanner makes each one when it is asked.',
  },
  'what-lost': {
    q: 'Name one thing a single-pass compiler gives up compared with one that builds a tree first.',
    a: 'It can only use what it has read so far, so it cannot look over a whole expression first; for example, Drip’s does not fold `1 + 2` into `3`.',
  },
  'emit-what': {
    q: 'What does it mean to **emit** an instruction?',
    a: 'To append its bytes to the end of the chunk being compiled, each tagged with a source line.',
  },
  'emit-at-op': {
    q: 'In Drip’s bytecode compiler, why is the `add` for `2 +` (line 2) followed by `-"a"` (line 3) tagged with line 2?',
    a: 'The binary-operator rule uses `emitAt(op.line, ...)`, the line of the `+` token, so an error in the addition points at the `+`.',
  },
  'emit-after': {
    q: 'In a single-pass Pratt compiler for a stack machine, why does the rule for a binary operator emit its opcode *after* compiling its right operand?',
    a: 'The right operand’s code must come first, so both values are on the stack when the operator runs.',
  },
  'prec-plus-one': {
    q: 'In a Pratt compiler, why does the rule for a left-associative binary operator compile its right operand at the operator’s precedence plus one?',
    a: 'So an operator of the same precedence on the right is not taken by the inner call, which makes operators group to the left.',
  },
  'ge-own-op': {
    q: 'Why does Drip’s VM have a `ge` instruction rather than compiling `a >= b` as “not `a < b`”?',
    a: 'With `NaN`, `NaN < 1` is false, so “not less” would be true, but `NaN >= 1` must be false.',
  },
};

export const examples = {
  'exprs-vm': {
    title: 'Expressions on the VM',
    lang: 'drip-vm',
    code: `print 1 + 2 * 3 - 4;
print -(1 + 2) * 3;
print !(2 >= 3);
print 0 / 0 >= 1;
print "a" + "b" == "ab";
1 + 2; # compiled, then popped`,
  },
};

export const exercises = {
  'mini-compile': {
    title: 'A single-pass compiler in miniature',
    prompt: '`compile(tokens)` takes tokens such as `[1, "+", 2, "*", 3]` and emits bytecode straight away, Pratt-style, with no tree, using Drip’s real opcode numbers. Numbers are done: each becomes `CONST` and its two-byte index in `consts`. Finish the loop body: after taking an operator, compile its right operand, then emit the operator’s opcode. `*` binds tighter than `+` and `-`, and all three group to the left.',
    starter: `// Drip's real opcode numbers
const CONST = 0, ADD = 20;
const SUB = 21, MUL = 22;
const PREC = { '+': 1, '-': 1, '*': 2 };
const OPCODE = {
  '+': ADD, '-': SUB, '*': MUL,
};

function compile(tokens) {
  const code = [];
  const consts = [];
  let i = 0;
  const emit = (...bytes) =>
    code.push(...bytes);
  function parse(min) {
    consts.push(tokens[i++]);
    const k = consts.length - 1;
    emit(CONST, k >> 8, k & 255);
    while (PREC[tokens[i]] >= min) {
      const op = tokens[i++];
      // right operand, then the opcode
    }
  }
  parse(1);
  return { code, consts };
}`,
    solution: `// Drip's real opcode numbers
const CONST = 0, ADD = 20;
const SUB = 21, MUL = 22;
const PREC = { '+': 1, '-': 1, '*': 2 };
const OPCODE = {
  '+': ADD, '-': SUB, '*': MUL,
};

function compile(tokens) {
  const code = [];
  const consts = [];
  let i = 0;
  const emit = (...bytes) =>
    code.push(...bytes);
  function parse(min) {
    consts.push(tokens[i++]);
    const k = consts.length - 1;
    emit(CONST, k >> 8, k & 255);
    while (PREC[tokens[i]] >= min) {
      const op = tokens[i++];
      parse(PREC[op] + 1);
      emit(OPCODE[op]);
    }
  }
  parse(1);
  return { code, consts };
}`,
    tests: `function run({ code, consts }) {
  const st = [];
  let ip = 0;
  while (ip < code.length) {
    const op = code[ip++];
    if (op === 0) {
      st.push(consts[code[ip] * 256 + code[ip + 1]]);
      ip += 2;
      continue;
    }
    const b = st.pop(), a = st.pop();
    st.push(op === 20 ? a + b
      : op === 21 ? a - b : a * b);
  }
  return st.pop();
}
test('a lone number', () => {
  const r = compile([5]);
  expect(r.code).toEqual([0, 0, 0]);
  expect(r.consts).toEqual([5]);
});
test('1 + 2 * 3: tighter operator first', () => {
  expect(compile([1, '+', 2, '*', 3]).code)
    .toEqual([0, 0, 0, 0, 0, 1, 0, 0, 2, 22, 20]);
});
test('2 * 3 + 1', () => {
  expect(compile([2, '*', 3, '+', 1]).code)
    .toEqual([0, 0, 0, 0, 0, 1, 22, 0, 0, 2, 20]);
});
test('8 - 3 - 1 groups to the left', () => {
  const r = compile([8, '-', 3, '-', 1]);
  expect(r.code)
    .toEqual([0, 0, 0, 0, 0, 1, 21, 0, 0, 2, 21]);
  expect(run(r)).toBe(4);
});
test('the bytes compute the answer', () => {
  const t = [1, '+', 2, '*', 3, '-', 4];
  expect(run(compile(t))).toBe(3);
});`,
    hints: [
      'The right operand of an operator is itself an expression, perhaps with tighter operators inside it. Which function already compiles an expression?',
      'Compile it with a recursive `parse` call. Pass `PREC[op] + 1`, so that an operator of the same strength on the right is left for this loop to take next: that gives left grouping.',
      'Two lines: `parse(PREC[op] + 1);` then `emit(OPCODE[op]);`.',
    ],
    walkthrough: `**How to think about it.** This is the chapter’s binary-operator rule in miniature. The loop has just taken an operator (\`+\`, say), and the left operand’s bytes are already in \`code\`. Two things are left: the bytes for the right operand, and the operator’s own byte. Emission order is execution order, so the right operand must come first, and the right operand is itself an expression, so compile it with \`parse\`. The only question is how much of what follows belongs to the right operand: everything tighter than this operator, and nothing as loose as it.

**The solution, line by line.**

- \`parse(PREC[op] + 1);\` compiles the right operand. The argument is the weakest operator the inner call may take: one more than our own precedence, so it takes \`*\` after a \`+\` (precedence 2 is at least 2) but leaves a second \`+\` or \`-\` (precedence 1 is less than 2) for our loop.
- \`emit(OPCODE[op]);\` appends the operator’s opcode, now that both operands come earlier in \`code\`.

**Following the tests.** For \`1 + 2 * 3\`: \`parse(1)\` emits \`CONST 0\` for 1, takes \`+\`, and calls \`parse(2)\`, which emits \`CONST 1\` for 2, takes \`*\` (2 is at least 2), and calls \`parse(3)\`, which emits \`CONST 2\` for 3 and stops (no operator). Back in \`parse(2)\`, \`MUL\` (22) is emitted; back in \`parse(1)\`, \`ADD\` (20). So \`MUL\` comes before \`ADD\`, although \`+\` was read first. For \`8 - 3 - 1\`: the first \`-\` calls \`parse(2)\`, which compiles only \`3\`, because the second \`-\` has precedence 1, less than 2; the outer loop then takes the second \`-\`, giving \`(8 - 3) - 1\`, which is 4.

**Common wrong attempts.**

- Emitting the opcode before calling \`parse\` puts \`ADD\` where only one value has been pushed, so the machine runs out of values.
- Passing \`PREC[op]\` without \`+ 1\` lets the inner call take the next operator of the same strength, so \`8 - 3 - 1\` becomes \`8 - (3 - 1)\`, which is 6.

There is no object for “the \`+\` node” anywhere: the half-finished operators wait on JavaScript’s call stack, as calls to \`parse\`, for exactly as long as they are needed, and then they are emitted and gone.`,
    wrong: [
      {
        code: `// Drip's real opcode numbers
const CONST = 0, ADD = 20;
const SUB = 21, MUL = 22;
const PREC = { '+': 1, '-': 1, '*': 2 };
const OPCODE = {
  '+': ADD, '-': SUB, '*': MUL,
};

function compile(tokens) {
  const code = [];
  const consts = [];
  let i = 0;
  const emit = (...bytes) =>
    code.push(...bytes);
  function parse(min) {
    consts.push(tokens[i++]);
    const k = consts.length - 1;
    emit(CONST, k >> 8, k & 255);
    while (PREC[tokens[i]] >= min) {
      const op = tokens[i++];
      emit(OPCODE[op]);
      parse(PREC[op] + 1);
    }
  }
  parse(1);
  return { code, consts };
}`,
        why: 'This emits the operator before its right operand, so the VM would reach `ADD` with only one value on the stack. Emit after compiling the operand.',
      },
      {
        code: `// Drip's real opcode numbers
const CONST = 0, ADD = 20;
const SUB = 21, MUL = 22;
const PREC = { '+': 1, '-': 1, '*': 2 };
const OPCODE = {
  '+': ADD, '-': SUB, '*': MUL,
};

function compile(tokens) {
  const code = [];
  const consts = [];
  let i = 0;
  const emit = (...bytes) =>
    code.push(...bytes);
  function parse(min) {
    consts.push(tokens[i++]);
    const k = consts.length - 1;
    emit(CONST, k >> 8, k & 255);
    while (PREC[tokens[i]] >= min) {
      const op = tokens[i++];
      parse(PREC[op]);
      emit(OPCODE[op]);
    }
  }
  parse(1);
  return { code, consts };
}`,
        why: 'With `PREC[op]` the inner call also takes the next operator of the same strength, so `8 - 3 - 1` becomes `8 - (3 - 1)`. Use `PREC[op] + 1` for left grouping.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does Drip’s bytecode compiler emit for `print 2 * 3 + 1;`, in order (leaving out the final `none` and `return`)?',
    options: [
      {
        t: '`const 2`, `const 3`, `mul`, `const 1`, `add`, `print`',
        correct: true,
        why: '`*` is the left operand of `+`, so its code comes first, and each opcode follows its operands.',
      },
      {
        t: '`const 2`, `const 3`, `const 1`, `add`, `mul`, `print`',
        why: 'That computes `2 * (3 + 1)`. `*` is tighter, so it is finished before the `+` is read.',
      },
      {
        t: '`mul`, `add`, `const 2`, `const 3`, `const 1`, `print`',
        why: 'Opcodes are emitted after their operands, never before.',
      },
      {
        t: '`print`, `const 2`, `const 3`, `mul`, `const 1`, `add`',
        why: '`print` is emitted after its expression has been compiled.',
      },
    ],
  },
  {
    q: 'What does “single-pass” mean for Drip’s bytecode compiler?',
    options: [
      {
        t: 'It can compile only one statement',
        why: 'It compiles whole programs; “pass” is about how many times it reads the source.',
      },
      {
        t: 'Each instruction runs only once',
        why: 'That is about running, not compiling. Loops run instructions many times.',
      },
      {
        t: 'It scans all tokens in one go before parsing',
        why: 'It does the opposite: the scanner produces tokens one at a time, when asked.',
      },
      {
        t: 'It reads the source once and emits code as it parses, with no tree',
        correct: true,
        why: 'Parsing and code generation happen in the same reading.',
      },
    ],
  },
  {
    q: 'In a single-pass Pratt compiler’s binary-operator rule, what goes wrong if you swap the two lines, emitting the opcode before calling `parsePrecedence`?',
    options: [
      {
        t: 'Nothing: the VM reorders instructions',
        why: 'The VM runs bytes exactly in the order they were emitted.',
      },
      {
        t: 'The operator runs before its right operand is on the stack',
        correct: true,
        why: 'Emission order is execution order, so the opcode must follow both operands.',
      },
      {
        t: 'Operators would group to the right',
        why: 'Grouping is decided by the precedence passed, not by when the opcode is emitted.',
      },
      {
        t: 'The compiler reports a syntax error',
        why: 'Parsing is unchanged; only the bytes come out in the wrong order.',
      },
    ],
  },
  {
    q: 'In Drip, `print 1 +;` has a syntax error on line 1, and line 2 is `print 2;`. What happens?',
    options: [
      {
        t: '`2` is printed, then the error',
        why: 'With any compile error, no code runs at all.',
      },
      {
        t: 'The error `line 1: expected an expression, found \';\'` is reported and nothing runs',
        correct: true,
        why: 'Bytes were already emitted for `print 1 +`, but the compiler throws the chunk away when there are errors.',
      },
      {
        t: 'The VM stops with a runtime error when it reaches the `+`',
        why: 'The problem is found while compiling, before anything runs.',
      },
      {
        t: 'The compiler silently skips the broken statement',
        why: 'It reports every error it finds, with the same wording as the tree-walker.',
      },
    ],
  },
  {
    q: 'Why does `print 0 / 0 >= 1;` print `false` on Drip’s VM?',
    options: [
      {
        t: '`0 / 0` is a runtime error that the VM ignores',
        why: 'Dividing zero by zero gives `NaN`, an ordinary number value, with no error.',
      },
      {
        t: 'Precedence makes it `0 / (0 >= 1)`',
        why: '`/` is tighter than `>=`, so it is `(0 / 0) >= 1`.',
      },
      {
        t: '`>=` has its own instruction, `ge`, and every `>=` with `NaN` is false',
        correct: true,
        why: 'If `>=` were compiled as “not `<`”, it would wrongly print `true`, because `NaN < 1` is false.',
      },
      {
        t: 'The VM compares the values as strings',
        why: 'Both are numbers, and `ge` compares numbers.',
      },
    ],
  },
];
