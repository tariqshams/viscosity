// Chapter 53 cards. Keys are stable ids: never rename them.

export const prompts = {
  'name-in-pool': {
    q: 'A global instruction like `GET_GLOBAL` can only carry one-byte operands. How does it say *which* variable?',
    a: 'The variable’s name is stored as a string in the chunk’s constant pool, and the operand is that constant’s index.',
  },
  'many-constants': {
    q: 'Each mention of a global adds a new constant to the pool. Why doesn’t that store the name’s text many times?',
    a: 'The names are interned, so every entry points at the same string object.',
  },
  'let-no-init': {
    q: 'What does the compiler emit for the initializer of `let x;`, which has none?',
    a: '`OP_NIL`, so `DEFINE_GLOBAL` always finds a value on top of the stack.',
  },
  'global-table-what': {
    q: 'What is the VM’s **global table**?',
    a: 'One hash table (`vm.globals`) mapping interned name strings to values, shared by the whole program.',
  },
  'peek-then-pop': {
    q: 'Why does `DEFINE_GLOBAL` peek at the value, store it, and only then pop it?',
    a: 'So the value stays on the stack, where the garbage collector can see it, until it is safely in the table.',
  },
  'redefine': {
    q: 'What does `DEFINE_GLOBAL` do if the name is already in the table?',
    a: 'It overwrites it. A second top-level `let` of the same name is allowed.',
  },
  'set-returns-new': {
    q: 'In `SET_GLOBAL`, what does it mean when `globals.set(...)` returns `true`?',
    a: 'The key was new: the variable was never defined, so the assignment is an error.',
  },
  'why-delete': {
    q: 'Why does `SET_GLOBAL` call `globals.delete(name)` before reporting the error?',
    a: 'Its `set` has just created a variable that shouldn’t exist. Deleting undoes that.',
  },
  'set-no-pop': {
    q: 'Why doesn’t `SET_GLOBAL` pop the value it stores?',
    a: 'Assignment is an expression, so its value must stay on the stack (for `print a = 3;`). An expression statement pops it later.',
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
    \`Undefined variable '\${n}'.\`);
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
    prompt: `\`run(code, k, g)\` is a tiny VM. \`code\` is an array of bytes, \`k\` is the constant pool, and \`g\` is a globals \`Table\` whose \`set\` returns \`true\` when the key was new, just like the real one. \`CONST\`, \`POP\`, \`PRINT\` and \`ADD\` work already. Each of \`DEF\`, \`GET\` and \`SET\` has one operand: the index in \`k\` of the variable's name. Fill them in:

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
    walkthrough: `This is the VM's dispatch loop for globals, in miniature.

- **The operand.** All three instructions are two bytes long. Reading \`code[ip++]\` both fetches the name's index and moves \`ip\` past it. Forget it, and the next "instruction" is really the operand.
- **\`DEF\`** stores, then pops, like the real \`DEFINE_GLOBAL\`. It never checks whether the name exists: a second \`let\` simply replaces the first.
- **\`GET\`** treats \`undefined\` as "no such variable". That works because no Drip value is ever \`undefined\` (\`nil\` is \`null\`).
- **\`SET\`** is the trick. In a correct program \`set\` returns \`false\` and nothing else happens: one table operation. If it returns \`true\`, the assignment just *created* the variable, so delete it before reporting the error. And no pop: the assignment's value is still needed by whatever comes next, \`PRINT\` or \`POP\`.

\`\`\`js
} else if (op === SET) {
  const n = k[code[ip++]];
  if (g.set(n, top())) {
    g.delete(n);
    undef(n);
  }
}
\`\`\``,
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
  // your code here
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
    walkthrough: `Inside \`tick\`, \`count\` isn't a local, so the compiler emits \`GET_GLOBAL\` and \`SET_GLOBAL\` with the name \`"count"\` as their operand. When \`tick\` is compiled, no \`count\` exists, and that's fine: nothing is looked up until \`tick()\` runs, and by then \`let count = 0;\` has put it in the table. Each call reads, adds and writes the same global, so the last \`print count;\` sees 3.`,
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
        why: 'Inside a function, `let` makes a *local*, and its initializer then refers to that same new local. The compiler stops with "Can’t read local variable in its own initializer." (more on that next chapter). Assign to the global instead.',
      },
    ],
  },
};

export const quiz = [
  {
    q: `In this disassembly line, what is the \`0\`?
\`\`\`
0002    | OP_DEFINE_GLOBAL    0 'a'
\`\`\``,
    options: [
      { t: 'The value being stored', why: 'The value is on top of the stack, pushed by the instruction before.' },
      { t: 'The index of the constant holding the name "a"', correct: true, why: 'Global instructions take the constant-pool index of the name string.' },
      { t: 'The slot in the globals hash table', why: 'The table slot comes from the name’s hash at run time; the compiler doesn’t know it.' },
      { t: 'The line number', why: 'The line is the `|` column, meaning "same line as before".' },
    ],
  },
  {
    q: 'What does `print a = 3;` compile to, after the `CONSTANT` for 3?',
    options: [
      { t: '`SET_GLOBAL a`, then `POP`, then `PRINT`', why: 'With a `POP` in between, `PRINT` would have nothing to print.' },
      { t: '`DEFINE_GLOBAL a`, then `PRINT`', why: 'Assignment never defines. It would also pop the value.' },
      { t: '`SET_GLOBAL a`, then `PRINT`', correct: true, why: '`SET_GLOBAL` leaves the value on the stack, and `PRINT` pops it.' },
      { t: '`PRINT`, then `SET_GLOBAL a`', why: 'The assignment is evaluated first; print takes its value.' },
    ],
  },
  {
    q: 'The program is just `b = 5;`, and `b` was never defined. What does the VM do?',
    options: [
      { t: 'Creates `b`, as JavaScript does without strict mode', why: 'Drip requires a `let`. The new key is deleted again.' },
      { t: 'The compiler rejects it', why: 'The compiler can’t know which globals will exist; this is found at run time.' },
      { t: 'Ignores the assignment', why: 'It reports an error and stops.' },
      { t: 'Stores `b`, sees `set` return true, deletes `b`, and reports `Undefined variable \'b\'.`', correct: true, why: 'That’s the set-then-undo trick: one table operation in the normal case.' },
    ],
  },
  {
    q: 'Why does the trick in `SET_GLOBAL` make correct programs faster?',
    options: [
      { t: 'It skips hashing the name', why: 'The name is still hashed (well, its stored hash is used) for the one look-up.' },
      { t: 'A correct assignment needs one table operation instead of a check plus a store', correct: true, why: 'Checking with `get` first would be a second look-up on every assignment.' },
      { t: 'It caches the slot index in the bytecode', why: 'Nothing is written back into the bytecode.' },
      { t: 'It avoids pushing the value', why: 'The value is pushed either way, and stays on the stack.' },
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
      { t: '`1` then `2`', correct: true, why: 'Each call looks `x` up by name at that moment, so it sees the current value.' },
      { t: 'A compile error: `x` is used before it is declared', why: 'The compiler doesn’t check globals; it only stores the name.' },
      { t: '`1` then `1`', why: 'Nothing copies the value into `f`. Each `GET_GLOBAL` reads the table afresh.' },
      { t: 'A runtime error at the first `f()`', why: 'By then `let x = 1;` has run, so `x` is in the table.' },
    ],
  },
  {
    q: 'Which statement about the VM’s globals is true?',
    options: [
      { t: 'They live in stack slots', why: 'That is locals, next chapter. Globals live in a hash table.' },
      { t: 'They are found by comparing names character by character', why: 'Keys are interned, so the table compares string objects by identity.' },
      { t: 'They are stored in the chunk’s constant pool', why: 'Only the names are constants. The values are in `vm.globals`.' },
      { t: 'They are found by name at run time, in a hash table keyed by interned strings', correct: true, why: 'Every global instruction does a look-up in `vm.globals` while the program runs.' },
    ],
  },
];
