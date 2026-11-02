// Drip to RISC-V, end to end: cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'pipeline-order': {
    q: 'Name the stages of a minimal native compiler, from source text to a program that runs, in order.',
    a: 'Scan, parse, (optionally optimise), select instructions over virtual registers, allocate registers with spilling, lay out each frame by the ABI, assemble, link.',
  },
  'why-virtual': {
    q: 'Why does instruction selection write into virtual registers rather than real ones?',
    a: 'So it can use as many as it likes and leave the hard job of fitting them into 32 real registers to the allocator.',
  },
  'why-no-div': {
    q: 'A compiler keeps Drip numbers as integers in RISC-V registers. Why must it refuse Drip’s `/` rather than emit `div`?',
    a: 'Drip’s `/` is float division (7 / 2 is 3.5) but RISC-V’s integer div gives 3; refusing is better than computing it wrongly.',
  },
  'test-as-branch': {
    q: 'When a comparison such as `a < b` is only the condition of an `if`, what does a RISC-V compiler turn it into, rather than a 0 or 1 value?',
    a: 'A single conditional branch (for `a < b`, `bge a, b, else`) that jumps to the false side when the test fails.',
  },
  'eight-params': {
    q: 'Why can a RISC-V compiler that never passes arguments on the stack accept at most eight integer parameters?',
    a: 'The RISC-V calling convention passes the first eight integer arguments in a0 to a7; more go on the stack.',
  },
  'tile-what': {
    q: 'What is a tile, in instruction selection?',
    a: 'A small tree pattern together with the instructions that compute it, such as “a + small constant” becoming one addi.',
  },
  'branch-on-fail': {
    q: 'A compiler branches out of a while loop when its test fails. Why does the signed test `i < n` become `bge`?',
    a: 'The branch must be taken when the test fails, and `i < n` fails exactly when `i >= n`.',
  },
  'swap-operands': {
    q: 'RISC-V has no `bgt` machine instruction (only an assembler pseudo-instruction). Which real branch jumps to `no` when `a > b` fails?',
    a: '`bge b, a, no`: swap the operands, because `a > b` fails exactly when `b >= a`.',
  },
  'addi-tile': {
    q: 'Which instruction does `i - 1` become, and why not `sub`?',
    a: '`addi d, i, -1`: the constant fits in addi’s 12-bit immediate, so no register is needed for it.',
  },
};

export const examples = {
  front: {
    title: 'Stages 1 to 3: scan, parse, select',
    code: `// Stage 1: scan. Drop comments, then
// cut the text into tokens.
function scan(src) {
  const re = /\\d+|\\w+|[<>=!+-]=|\\S/g;
  return src.replace(/#.*/g, '')
    .match(re) ?? [];
}

// Stage 2: parse (recursive descent).
const RELOPS = ['<', '<=', '>', '>=',
  '==', '!='];
function parse(src) {
  const t = scan(src);
  let p = 0;
  const peek = () => t[p];
  const fail = (what) => {
    const got = t[p] ?? 'end of file';
    throw new Error(\`expected \${what}\` +
      \`, found '\${got}'\`);
  };
  const eat = (x) => {
    if (x && t[p] !== x) fail(\`'\${x}'\`);
    return t[p++];
  };
  const fns = [], main = [];
  while (p < t.length) {
    if (peek() === 'fn')
      fns.push(fnDecl());
    else main.push(stmt());
  }
  fns.push(['fn', 'main', [], main]);
  return fns;

  function fnDecl() {
    eat('fn');
    const name = eat(), ps = [];
    eat('(');
    while (peek() !== ')') {
      ps.push(eat());
      if (peek() === ',') eat(',');
    }
    eat(')');
    return ['fn', name, ps, block()];
  }
  function block() {
    eat('{');
    const ss = [];
    while (peek() !== '}')
      ss.push(stmt());
    eat('}');
    return ss;
  }
  function stmt() {
    const k = peek();
    if (k === 'let') {
      eat(); const x = eat(); eat('=');
      const e = expr(); eat(';');
      return ['let', x, e];
    }
    if (k === 'if') {
      eat(); const c = cond();
      const th = block();
      let el = [];
      if (peek() === 'else') {
        eat();
        el = peek() === 'if'
          ? [stmt()] : block();
      }
      return ['if', c, th, el];
    }
    if (k === 'while') {
      eat(); const c = cond();
      return ['while', c, block()];
    }
    if (k === 'return' ||
        k === 'print') {
      eat(); const e = expr(); eat(';');
      return [k, e];
    }
    const op = t[p + 1];
    if (op === '=' || op === '+=' ||
        op === '-=') {
      const x = eat(); eat();
      let e = expr(); eat(';');
      if (op !== '=')
        e = [op[0], ['var', x], e];
      return ['set', x, e];
    }
    const e = expr(); eat(';');
    return ['expr', e];
  }
  function cond() {
    const a = expr();
    if (!RELOPS.includes(peek()))
      fail('a comparison');
    const op = eat();
    return [op, a, expr()];
  }
  function expr() {
    let e = term();
    while (peek() === '+' ||
           peek() === '-')
      e = [eat(), e, term()];
    return e;
  }
  function term() {
    let e = unary();
    while (peek() === '*')
      e = [eat(), e, unary()];
    return e;
  }
  function unary() {
    if (peek() !== '-')
      return primary();
    eat();
    return ['-', ['num', 0], unary()];
  }
  function primary() {
    const x = peek();
    if (/^\\d+$/.test(x)) {
      eat();
      return ['num', Number(x)];
    }
    if (x === '(') {
      eat(); const e = expr(); eat(')');
      return e;
    }
    if (!/^[A-Za-z_]\\w*$/.test(x ?? ''))
      fail('an expression');
    eat();
    if (peek() !== '(')
      return ['var', x];
    eat('(');
    const args = [];
    while (peek() !== ')') {
      args.push(expr());
      if (peek() === ',') eat(',');
    }
    eat(')');
    return ['call', x, args];
  }
}


// Stage 3: instruction selection, into
// virtual registers v0, v1, v2, ...
const ARITH = { '+': 'add', '-': 'sub',
  '*': 'mul' };
// jump to \`no\` when the test FAILS:
// [instruction, first, second operand]
const BR = {
  '<': ['bge', 0, 1],
  '<=': ['blt', 1, 0],
  '>': ['bge', 1, 0],
  '>=': ['blt', 0, 1],
  '==': ['bne', 0, 1],
  '!=': ['beq', 0, 1],
};
const fits12 = (k) =>
  k >= -2048 && k <= 2047;

function select([, name, ps, body]) {
  const code = [], vars = new Map();
  let nv = 0, nl = 0;
  const v = () => 'v' + nv++;
  const L = () => \`.L\${name}\${nl++}\`;
  const emit = (...i) => code.push(i);
  const look = (x) => {
    if (!vars.has(x)) throw new Error(
      \`undefined variable '\${x}'\`);
    return vars.get(x);
  };
  if (ps.length > 8) throw new Error(
    'at most 8 parameters');
  ps.forEach((x, k) => {
    vars.set(x, v());
    emit('mv', vars.get(x), 'a' + k);
  });
  body.forEach(stmt);
  if (body.at(-1)?.[0] !== 'return')
    emit('li', 'a0', 0);
  return { name, code };

  function stmt(s) {
    const k = s[0];
    if (k === 'let') {
      const d = v();
      expr(s[2], d);
      vars.set(s[1], d);
    } else if (k === 'set') {
      expr(s[2], look(s[1]));
    } else if (k === 'expr') {
      expr(s[1]);
    } else if (k === 'print') {
      emit('mv', 'a0', expr(s[1]));
      emit('call', 'print');
    } else if (k === 'return') {
      emit('mv', 'a0', expr(s[1]));
      emit('j', \`.L\${name}_ret\`);
    } else if (k === 'while') {
      const top = L(), end = L();
      emit('label', top);
      cond(s[1], end);
      s[2].forEach(stmt);
      emit('j', top);
      emit('label', end);
    } else if (k === 'if') {
      const no = L(), end = L();
      cond(s[1], no);
      s[2].forEach(stmt);
      if (s[3].length) emit('j', end);
      emit('label', no);
      s[3].forEach(stmt);
      if (s[3].length)
        emit('label', end);
    }
  }
  function cond([op, a, b], no) {
    const ra = expr(a);
    const zero = b[0] === 'num' &&
      b[1] === 0;
    const r = [ra,
      zero ? 'zero' : expr(b)];
    const [br, i, j] = BR[op];
    emit(br, r[i], r[j], no);
  }
  function expr(e, d) {
    const k = e[0];
    if (k === 'num') {
      d ??= v();
      emit('li', d, e[1]);
      return d;
    }
    if (k === 'var') {
      const r = look(e[1]);
      if (d && d !== r)
        emit('mv', d, r);
      return d ?? r;
    }
    if (k === 'call') {
      if (e[2].length > 8)
        throw new Error('at most 8');
      const rs = e[2].map(
        (a) => expr(a));
      rs.forEach((r, i) =>
        emit('mv', 'a' + i, r));
      emit('call', e[1]);
      d ??= v();
      emit('mv', d, 'a0');
      return d;
    }
    const [, a, b] = e;
    const imm =
      k === '-' ? -b[1] : b[1];
    if (k !== '*' && b[0] === 'num' &&
        fits12(imm)) {
      const ra = expr(a);
      d ??= v();
      emit('addi', d, ra, imm);
      return d;
    }
    const ra = expr(a), rb = expr(b);
    d ??= v();
    emit(ARITH[k], d, ra, rb);
    return d;
  }
}

function show(code) {
  return code.map(([op, ...xs]) =>
    op === 'label' ? xs[0] + ':'
      : ('  ' + op.padEnd(5) +
        xs.join(', ')).trimEnd())
    .join('\\n');
}


const src = \`
fn sumsq(n) {
  let s = 0;
  let i = 0;
  while i < n {
    s += i * i;
    i += 1;
  }
  return s;
}
fn fib(n) {
  if n < 2 {
    return n;
  }
  return fib(n - 1) + fib(n - 2);
}
print sumsq(4);
print fib(10);\`;

for (const f of parse(src)) {
  const { name, code } = select(f);
  console.log(name + ':');
  console.log(show(code));
}`,
  },
};

export const exercises = {
  'branch-if-false': {
    title: 'Pick the branch for a failed test',
    prompt: 'Write `branchIfFalse(op, a, b, no)`, which returns the one RISC-V instruction that jumps to label `no` exactly when the test `a op b` is **false**. `op` is one of `<`, `<=`, `>`, `>=`, `==`, `!=`; `a` and `b` are register names. You may only use `beq`, `bne`, `blt` and `bge`, so for some tests you must swap the operands. Return a string like `\'bge t1, a0, done\'`.',
    starter: `function branchIfFalse(op, a, b, no) {
  // one of beq, bne, blt, bge
  return \`blt \${a}, \${b}, \${no}\`;
}

console.log(branchIfFalse(
  '<', 't1', 'a0', 'done'));`,
    solution: `function branchIfFalse(op, a, b, no) {
  const T = {
    '<': ['bge', a, b],
    '<=': ['blt', b, a],
    '>': ['bge', b, a],
    '>=': ['blt', a, b],
    '==': ['bne', a, b],
    '!=': ['beq', a, b],
  };
  const [ins, x, y] = T[op];
  return \`\${ins} \${x}, \${y}, \${no}\`;
}`,
    tests: `const f = branchIfFalse;
test('the loop test i < n', () => {
  expect(f('<', 't1', 'a0', 'done'))
    .toBe('bge t1, a0, done');
});
test('== and != flip', () => {
  expect(f('==', 'a', 'b', 'L'))
    .toBe('bne a, b, L');
  expect(f('!=', 'a', 'b', 'L'))
    .toBe('beq a, b, L');
});
test('>= becomes blt', () => {
  expect(f('>=', 'a', 'b', 'L'))
    .toBe('blt a, b, L');
});
test('> and <= swap the operands', () => {
  expect(f('>', 'a', 'b', 'L'))
    .toBe('bge b, a, L');
  expect(f('<=', 'a', 'b', 'L'))
    .toBe('blt b, a, L');
});
test('it jumps exactly when false', () => {
  const take = {
    beq: (x, y) => x === y,
    bne: (x, y) => x !== y,
    blt: (x, y) => x < y,
    bge: (x, y) => x >= y,
  };
  const holds = {
    '<': (x, y) => x < y,
    '<=': (x, y) => x <= y,
    '>': (x, y) => x > y,
    '>=': (x, y) => x >= y,
    '==': (x, y) => x === y,
    '!=': (x, y) => x !== y,
  };
  for (const op in holds)
    for (const x of [-1, 0, 1, 2])
      for (const y of [-1, 0, 1, 2]) {
        const [i, r, s] =
          f(op, 'x', 'y', 'L')
            .split(/[ ,]+/);
        const v = { x, y };
        expect(take[i](v[r], v[s]))
          .toBe(!holds[op](x, y));
      }
});`,
    hints: [
      'The branch leaves (or skips the then-branch) when the test FAILS. So for each test, first write down its opposite: the opposite of `a < b` is `a >= b`.',
      'Four of the six opposites are instructions as they stand: `>=` is bge, `<` is blt, `==` is beq, `!=` is bne. The other two, `a > b` and `a <= b`, need the operands swapped: `a > b` is `b < a`.',
      'A table does it: `\'<\': [\'bge\', a, b]`, `\'<=\': [\'blt\', b, a]`, `\'>\': [\'bge\', b, a]`, `\'>=\': [\'blt\', a, b]`, `\'==\': [\'bne\', a, b]`, `\'!=\': [\'beq\', a, b]`; then build the string from the entry.',
    ],
    walkthrough: `**How to think about it.** Two separate facts meet here. First, the code shape (chapter 230): a \`while\` or an \`if\` tests its condition and jumps away when it is false, falling through into the body when it is true. So we need the branch for the **opposite** of the test. Second, RISC-V's branches only test four things: equal, not equal, less than and greater or equal (plus unsigned forms we do not need). So for each test, write its opposite, and if the opposite is not one of those four, turn it round: "b is less than a" is the same as "a is greater than b".

The six opposites: not \`a < b\` is \`a >= b\` (bge a, b); not \`a <= b\` is \`a > b\`, which is \`b < a\` (blt b, a); not \`a > b\` is \`a <= b\`, which is \`b >= a\` (bge b, a); not \`a >= b\` is \`a < b\` (blt a, b); not \`a == b\` is \`a != b\` (bne); and not \`a != b\` is \`a == b\` (beq).

**The solution, line by line.**

- \`const T = { ... };\` is a table from each test to the instruction and the order of its two operands. Building it inside the function lets each entry use \`a\` and \`b\` directly.
- \`'<': ['bge', a, b]\` jumps when \`a >= b\`, the failure of \`a < b\`.
- \`'<=': ['blt', b, a]\` jumps when \`b < a\`, which is \`a > b\`, the failure of \`a <= b\`.
- \`'>': ['bge', b, a]\` jumps when \`b >= a\`, which is \`a <= b\`.
- \`'>=': ['blt', a, b]\` jumps when \`a < b\`.
- \`'==': ['bne', a, b]\` and \`'!=': ['beq', a, b]\` are the plain opposites.
- \`const [ins, x, y] = T[op];\` picks the entry apart.
- The last line, the template string, writes the entry in assembly syntax: the instruction, the two registers and the label, separated as an assembler expects (\`bge t1, a0, done\`).

The last test checks every test on every pair of small numbers, including equal ones, which is where a wrong choice usually shows.

**Common wrong attempts.**

- Branching when the test **holds** (\`blt a, b\` for \`<\`) is natural if you think "branch to the body", but the body follows the branch; the jump goes to the exit.
- Reusing \`bge a, b\` for \`<=\` (instead of swapping to \`blt b, a\`) goes wrong when the two are equal: \`a <= b\` holds, so the code should fall into the body, but \`bge a, b\` jumps away. The operands must be swapped, not the instruction reused.`,
    wrong: [
      {
        code: `function branchIfFalse(op, a, b, no) {
  const T = {
    '<': ['blt', a, b],
    '<=': ['bge', b, a],
    '>': ['blt', b, a],
    '>=': ['bge', a, b],
    '==': ['beq', a, b],
    '!=': ['bne', a, b],
  };
  const [ins, x, y] = T[op];
  return \`\${ins} \${x}, \${y}, \${no}\`;
}`,
        why: 'Every branch is taken when the test holds, not when it fails, so loops would exit on their first good trip and run forever after the last.',
      },
      {
        code: `function branchIfFalse(op, a, b, no) {
  const T = {
    '<': ['bge', a, b],
    '<=': ['bge', a, b],
    '>': ['blt', a, b],
    '>=': ['blt', a, b],
    '==': ['bne', a, b],
    '!=': ['beq', a, b],
  };
  const [ins, x, y] = T[op];
  return \`\${ins} \${x}, \${y}, \${no}\`;
}`,
        why: '`<=` and `>` reuse the instructions without swapping: for `a <= b` with a equal to b the test holds, yet `bge a, b` jumps away.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In which order do the stages of a simple native compiler run?',
    options: [
      {
        t: 'Parse, scan, allocate registers, select instructions.',
        why: 'Parsing needs tokens, so scanning comes first; and allocation needs the instructions selection produces.',
      },
      {
        t: 'Scan, parse, select instructions, allocate registers, lay out frames, assemble.',
        correct: true,
        why: 'Right: each stage needs the previous one’s output.',
      },
      {
        t: 'Select instructions, scan, parse, assemble.',
        why: 'There is nothing to select from until the text has been scanned and parsed into trees.',
      },
    ],
  },
  {
    q: 'A Drip compiler keeps numbers as 64-bit integers. Why must it refuse `print 7 / 2;` rather than use RISC-V’s `div`?',
    options: [
      {
        t: 'RISC-V has no division instruction.',
        why: 'The M extension has div; the problem is what it computes.',
      },
      {
        t: 'Division is too slow.',
        why: 'Speed is not the reason; meaning is.',
      },
      {
        t: 'Drip’s `/` gives 3.5, integer `div` gives 3, and a compiler must not change what a program prints.',
        correct: true,
        why: 'Right: a compiler that uses whole numbers only must leave out anything whose meaning would change.',
      },
    ],
  },
  {
    q: 'A compiler branches to `.Lexit` when a loop test fails. What does it emit for the test of `while i < n`, with i in v2 and n in v0?',
    options: [
      {
        t: '`blt v2, v0, .Lexit`',
        why: 'That leaves the loop while i < n holds, so the body would never run for n > 0.',
      },
      {
        t: '`bge v2, v0, .Lexit`',
        correct: true,
        why: 'Right: jump out when the test fails, and i < n fails when i >= n.',
      },
      {
        t: '`bge v0, v2, .Lexit`',
        why: 'That jumps when n >= i, which is true on the very first trip (0 < n), so the body would never run.',
      },
    ],
  },
  {
    q: 'Which tile covers `i + 1`?',
    options: [
      {
        t: '`li d, 1` then `add d, i, d`',
        why: 'That works but uses two instructions and a register; a selector that picks the biggest matching tile avoids it.',
      },
      {
        t: '`addi d, i, 1`',
        correct: true,
        why: 'Right: 1 fits in addi’s 12-bit signed immediate (−2048 to 2047).',
      },
      {
        t: '`mv d, i` then `addi d, d, 1`',
        why: 'The mv is not needed: addi reads i and writes d in one go.',
      },
    ],
  },
  {
    q: 'A call `f(a, b)` is selected as `mv a0, va`, `mv a1, vb`, `call f`, `mv d, a0`. Why are both arguments computed into virtual registers before any `mv` into a0?',
    options: [
      {
        t: 'Computing the second argument might itself make a call, which would overwrite a0.',
        correct: true,
        why: 'Right: in f(g(x), y) the call to g uses a0, so a0 is only filled once every argument is ready.',
      },
      {
        t: 'RISC-V cannot move a value straight into a0.',
        why: 'It can: mv a0, x is an ordinary instruction.',
      },
      {
        t: 'The calling convention requires virtual registers.',
        why: 'The convention talks only about real registers (a0 to a7, ra and so on).',
      },
    ],
  },
  {
    q: 'Which single RISC-V instruction jumps to `no` when the test `x == 0` fails?',
    options: [
      {
        t: '`bne x, zero, no`',
        correct: true,
        why: 'Right: the test fails when x is not 0, and the zero register (x0) always reads 0, so no constant needs loading.',
      },
      {
        t: '`beq x, zero, no`',
        why: 'That jumps when the test holds, which is the wrong way round.',
      },
      {
        t: '`li t0, 0` then `bne x, t0, no`',
        why: 'Correct but two instructions; x0 already holds 0.',
      },
      {
        t: '`blt x, zero, no`',
        why: 'That jumps only when x is negative, so a positive x would wrongly fall into the true side.',
      },
    ],
  },
];
