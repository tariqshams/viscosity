// Chapter 149 cards: recall prompts, examples, exercises and quiz.

export const prompts = {
  'name-in-pool': {
    q: 'An instruction like `load.global` can only carry bytes after its opcode. How does it say *which* variable?',
    a: 'The variable’s name is stored as a string in the constant pool, and the operand is that constant’s index.',
  },
  'two-bytes': {
    q: 'How many bytes is `define.global 1 \'a\'`, and why?',
    a: 'Three: the opcode, then the constant index in two bytes (high byte first), so a function can have 65,536 constants.',
  },
  'global-table-what': {
    q: 'What is the VM’s **global table**?',
    a: 'One hash table (`vm.globals`) mapping interned name strings to values, shared by the whole program.',
  },
  'peek-then-pop': {
    q: 'In what order does `define.global` handle the value on the stack?',
    a: 'It peeks at it, stores it in the table, and only then drops it, so the value is never in neither place.',
  },
  'set-returns-new': {
    q: 'In `store.global`, what does it mean when `globals.set(...)` returns `true`?',
    a: 'The key was new: the variable was never defined, so the assignment is an error.',
  },
  'why-delete': {
    q: 'Why does `store.global` call `globals.delete(name)` before reporting the error?',
    a: 'Its `set` has just created a variable that should not exist. Deleting undoes that.',
  },
  'set-no-pop': {
    q: 'Why does `store.global` not pop the value it stores?',
    a: 'An assignment is an expression, so its value must stay on the stack (for `print a = 3;`). An expression statement pops it later.',
  },
  'late-binding': {
    q: 'Why can a function body use a global that is only defined *after* the function?',
    a: 'Globals are looked up by name when the instruction runs, not when it is compiled. By the time the function is called, the name exists.',
  },
};

export const examples = {
  'late-global': {
    title: 'A global used before its let',
    lang: 'drip-vm',
    code: `fn show() {
  print greeting;
}

let greeting = "hello";
show();
greeting = "bye";
show();`,
  },
};

const PRELUDE = `// Opcodes of a tiny VM.
const CONST = 0, POP = 1, PRINT = 2;
const ADD = 3, DEF = 4, GET = 5;
const SET = 6;

// set() returns true if k was new.
class Table {
  constructor() { this.m = new Map(); }
  get(k) { return this.m.get(k); }
  set(k, v) {
    const isNew = !this.m.has(k);
    this.m.set(k, v);
    return isNew;
  }
  delete(k) { this.m.delete(k); }
}

const undef = (n) => {
  throw new Error(
    \`undefined variable '\${n}'\`);
};
`;

const vm = (def, get, set) => `${PRELUDE}
function run(code, k, g) {
  const stack = [];
  const out = [];
  const top = () => stack.at(-1);
  let ip = 0;
  while (ip < code.length) {
    const op = code[ip++];
    if (op === CONST) {
      stack.push(k[code[ip++]]);
    } else if (op === POP) {
      stack.pop();
    } else if (op === PRINT) {
      out.push(String(stack.pop()));
    } else if (op === ADD) {
      const b = stack.pop();
      stack.push(stack.pop() + b);
    } else if (op === DEF) {
${def}
    } else if (op === GET) {
${get}
    } else if (op === SET) {
${set}
    }
  }
  return { out, left: stack.length };
}`;

const TODO = '      // your code here';
const DEF_OK = `      const n = k[code[ip++]];
      g.set(n, top());
      stack.pop();`;
const GET_OK = `      const n = k[code[ip++]];
      const v = g.get(n);
      if (v === undefined) undef(n);
      stack.push(v);`;
const SET_OK = `      const n = k[code[ip++]];
      if (g.set(n, top())) {
        g.delete(n);
        undef(n);
      }`;

export const exercises = {
  'globals-vm': {
    title: 'Three global instructions',
    prompt: `\`run(code, k, g)\` is a tiny VM. \`code\` is an array of bytes, \`k\` is the constant pool, and \`g\` is a globals \`Table\` whose \`set\` returns \`true\` when the key was new, just like the real one. \`CONST\`, \`POP\`, \`PRINT\` and \`ADD\` work already. Each of \`DEF\`, \`GET\` and \`SET\` has one operand byte (the real VM uses two, but one keeps this small): the index in \`k\` of the variable's name. Fill them in:

- \`DEF\` stores the top of the stack under the name, then pops it.
- \`GET\` pushes the name's value, or calls \`undef(name)\` if there is none.
- \`SET\` stores the top of the stack under an *existing* name and leaves it on the stack. If the name was new, remove it again and call \`undef(name)\`.`,
    starter: vm(TODO, TODO, TODO),
    solution: vm(DEF_OK, GET_OK, SET_OK),
    tests: `const T = () => new Table();
test('let a = 1; print a;', () => {
  const r = run([CONST, 1, DEF, 0,
    GET, 0, PRINT], ['a', 1], T());
  expect(r.out).toEqual(['1']);
});
test('DEF pops the value', () => {
  const r = run([CONST, 1, DEF, 0],
    ['a', 1], T());
  expect(r.left).toBe(0);
});
test('a = a + 2', () => {
  const r = run([CONST, 1, DEF, 0,
    GET, 0, CONST, 2, ADD, SET, 0, POP,
    GET, 0, PRINT], ['a', 1, 2], T());
  expect(r.out).toEqual(['3']);
  expect(r.left).toBe(0);
});
test('print a = 5 (SET keeps it)', () => {
  const r = run([CONST, 1, DEF, 0,
    CONST, 2, SET, 0, PRINT,
    GET, 0, PRINT], ['a', 1, 5], T());
  expect(r.out).toEqual(['5', '5']);
});
test('a second DEF replaces', () => {
  const r = run([CONST, 1, DEF, 0,
    CONST, 2, DEF, 0, GET, 0, PRINT],
    ['a', 1, 2], T());
  expect(r.out).toEqual(['2']);
});
test('GET of an unknown name', () => {
  expect(() => run([GET, 0, PRINT],
    ['zz'], T())).toThrow();
});
test('SET of an unknown name', () => {
  const g = T();
  expect(() => run([CONST, 1, SET, 0,
    POP], ['b', 5], g)).toThrow();
  expect(g.get('b')).toBe(undefined);
});`,
    hints: [
      'Every one of the three starts the same way: read the operand byte with `code[ip++]`, and look the name up in `k`.',
      '`DEF`: `g.set(n, top())`, then `stack.pop()`. `GET`: `g.get(n)` returns `undefined` for a missing name.',
      '`SET`: `if (g.set(n, top())) { g.delete(n); undef(n); }`. No pop.',
    ],
    walkthrough: `**How to think about it.** All three instructions have the same shape: one operand byte, which is an index into the constant pool, where the variable's name is. So each starts by reading that byte (moving \`ip\` past it) and fetching the name. After that, each is a single table operation plus one decision about the stack: \`DEF\` consumes the value, \`GET\` produces one, and \`SET\` leaves the value where it is, because an assignment is an expression whose value something after it (\`PRINT\` or \`POP\`) still needs. The tests check exactly these stack effects, through \`out\` and \`left\`.

**The solution, line by line.**

\`\`\`js
} else if (op === DEF) {
  const n = k[code[ip++]];
  g.set(n, top());
  stack.pop();
} else if (op === GET) {
  const n = k[code[ip++]];
  const v = g.get(n);
  if (v === undefined) undef(n);
  stack.push(v);
} else if (op === SET) {
  const n = k[code[ip++]];
  if (g.set(n, top())) {
    g.delete(n);
    undef(n);
  }
}
\`\`\`

- \`const n = k[code[ip++]];\` (in all three) reads the operand byte, steps \`ip\` past it, and looks the name up in the constant pool. Forget the \`++\` and the operand is run as the next instruction.
- \`DEF\`: \`g.set(n, top());\` stores the value on top of the stack under the name, *then* \`stack.pop();\` drops it, the same order as the real \`define.global\`. It never checks whether the name exists, because a second \`let\` replaces the first.
- \`GET\`: \`const v = g.get(n);\` looks the name up; \`if (v === undefined) undef(n);\` reports a missing name (no Drip value is ever \`undefined\`, so it can only mean "absent"); \`stack.push(v);\` pushes the value.
- \`SET\`: \`if (g.set(n, top())) {\` stores the value and asks whether the name was new. In a correct program it was not, \`set\` returns \`false\`, and nothing more happens: one table operation. If it was new, the assignment has just created a variable, so \`g.delete(n);\` removes it and \`undef(n);\` reports the error. There is no pop.

**Common wrong attempts.**

- \`DEF\` that stores but never pops: every \`let\` leaves a stray value on the stack, and the test that checks \`left\` fails.
- \`SET\` that pops (\`g.set(n, stack.pop())\`): then \`print a = 5;\` has nothing left to print.
- \`SET\` that reports the error but forgets \`g.delete(n)\`: the variable that should never have existed stays in the table.`,
    wrong: [
      {
        code: vm(`      const n = k[code[ip++]];
      g.set(n, top());`, GET_OK, SET_OK),
        why: '`DEF` forgets to pop. The value is now both in the table and on the stack, and every `let` leaves one more stray value behind.',
      },
      {
        code: vm(DEF_OK, GET_OK, `      const n = k[code[ip++]];
      if (g.set(n, stack.pop())) {
        g.delete(n);
        undef(n);
      }`),
        why: '`SET` pops the value. Then `print a = 5;` has nothing left to print. An assignment is an expression, so its value must stay on the stack.',
      },
      {
        code: vm(DEF_OK, GET_OK, `      const n = k[code[ip++]];
      if (g.set(n, top())) {
        undef(n);
      }`),
        why: 'The error is reported, but the name stays in the table. A program that caught the error would find a variable that was never defined. Delete it first.',
      },
    ],
  },
  tick: {
    optional: true,
    lang: 'drip-vm',
    title: 'A counter in a global',
    prompt:
      'Write the body of `tick()` so that it adds 1 to the global `count` and prints the new value. Notice that `count` is defined *after* `tick`. The program should print `1`, `2`, `3` and then `3`.',
    starter: `fn tick() {
  # your code here
}

let count = 0;
tick();
tick();
tick();
print count;`,
    solution: `fn tick() {
  count = count + 1;
  print count;
}

let count = 0;
tick();
tick();
tick();
print count;`,
    tests: `1
2
3
3`,
    hints: [
      'Assign to the global: `count = count + 1;`. Don’t declare a new one.',
      'Then `print count;`.',
    ],
    walkthrough: `**How to think about it.** Inside \`tick\`, \`count\` is not declared, so it is not a local: the compiler treats it as a global and emits \`load.global\` and \`store.global\` with the name \`"count"\` as their constant. When \`tick\` is compiled, no \`count\` exists yet, and that is fine, because nothing is looked up until \`tick()\` runs, and by then \`let count = 0;\` has put the name in the table. So the body only has to read, add and write the global, then print it.

**The solution, line by line.**

\`\`\`text
fn tick() {
  count = count + 1;
  print count;
}
\`\`\`

- \`count = count + 1;\` compiles to \`load.global 'count'\`, \`const 1\`, \`add\`, \`store.global 'count'\` and \`pop\`. The \`store.global\` finds \`count\` already in the table (its \`set\` returns \`false\`), so the assignment simply replaces 0 with 1, then 2, then 3.
- \`print count;\` is another \`load.global\` and \`print\`, so each call prints the new value.
- The last line of the program, \`print count;\`, reads the same global, which the three calls left at 3.

**Common wrong attempts.**

- \`let count = count + 1;\` inside the function: \`let\` in a function makes a new *local*, and its initialiser then reads that same new local, so the compiler stops with \`line 2: cannot read 'count' in its own initialiser\` (the next chapter explains locals).
- Writing \`count + 1;\` without assigning: the sum is computed and thrown away, so every call prints 0.`,
    wrong: [
      {
        code: `fn tick() {
  let count = count + 1;
  print count;
}

let count = 0;
tick();
tick();
tick();
print count;`,
        why: 'Inside a function, `let` makes a *local*, and its initialiser then reads that same new local, so the compiler stops with `line 2: cannot read \'count\' in its own initialiser`. Assign to the global instead.',
      },
    ],
  },
};

export const quiz = [
  {
    q: `In this disassembly line, what is the \`1\`?
\`\`\`
0003    | define.global       1 'a'
\`\`\``,
    options: [
      { t: 'The value being stored', why: 'The value is on top of the stack, pushed by the instruction before.' },
      { t: 'The index of the constant holding the name "a"', correct: true, why: 'Global instructions take the constant-pool index of the name string, in two bytes.' },
      { t: 'The slot in the globals hash table', why: 'The table slot comes from the name’s hash at run time; the compiler does not know it.' },
      { t: 'The line number', why: 'The line is the `|` column, meaning “same line as before”.' },
    ],
  },
  {
    q: 'What does `print a = 3;` compile to, after the `const` for 3?',
    options: [
      { t: '`store.global a`, then `pop`, then `print`', why: 'With a `pop` in between, `print` would have nothing to print.' },
      { t: '`define.global a`, then `print`', why: 'Assignment never defines. It would also pop the value.' },
      { t: '`print`, then `store.global a`', why: 'The assignment is worked out first; `print` takes its value.' },
      { t: '`store.global a`, then `print`', correct: true, why: '`store.global` leaves the value on the stack, and `print` pops it.' },
    ],
  },
  {
    q: 'The program is just `b = 5;`, and `b` was never defined. What does the VM do?',
    options: [
      { t: 'Creates `b`, as sloppy-mode JavaScript would', why: 'Drip requires a `let`. The new key is deleted again.' },
      { t: 'Stores `b`, sees `set` return true, deletes `b`, and reports `undefined variable \'b\'`', correct: true, why: 'That is the set-then-undo trick: one table operation in the normal case.' },
      { t: 'The compiler rejects it', why: 'The compiler cannot know which globals will exist; this is found at run time.' },
      { t: 'Ignores the assignment', why: 'It reports a runtime error and stops.' },
    ],
  },
  {
    q: `What does this print on the VM?
\`\`\`
fn f() { print x; }
let x = 1;
f();
x = 2;
f();
\`\`\``,
    options: [
      { t: '`1` then `2`', correct: true, why: 'Each call runs `load.global x` at that moment, so it sees the current value.' },
      { t: 'A compile error: `x` is used before it is declared', why: 'The compiler does not check globals; it only stores the name.' },
      { t: '`1` then `1`', why: 'Nothing copies the value into `f`. Each `load.global` reads the table afresh.' },
      { t: 'A runtime error at the first `f()`', why: 'By then `let x = 1;` has run, so `x` is in the table.' },
    ],
  },
  {
    q: 'Which statement about the VM’s globals is true?',
    options: [
      { t: 'They live in stack slots', why: 'That is locals, in the next chapter. Globals live in a hash table.' },
      { t: 'They are found by comparing names character by character', why: 'Keys are interned, so the table compares string objects by identity.' },
      { t: 'They are found by name at run time, in a hash table keyed by interned strings', correct: true, why: 'Every global instruction does a lookup in `vm.globals` while the program runs.' },
      { t: 'They are stored in the constant pool', why: 'Only the names are constants. The values are in `vm.globals`.' },
    ],
  },
];
