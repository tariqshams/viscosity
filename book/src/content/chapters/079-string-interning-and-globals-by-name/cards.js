// Chapter 79 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'intern-what': {
    q: 'What is string interning?',
    a: 'Keeping exactly one object for each distinct string, shared by everyone who needs it.',
  },
  'concat-no-alloc': {
    q: 'In a VM that interns every string, the string `"hi"` already exists. Does `"h" + "i"` allocate a new string object?',
    a: 'No. The joined characters are hashed and found in the intern table, and the existing `"hi"` is returned.',
  },
  'equal-identity': {
    q: 'In a VM that interns every string, how can `==` compare two strings?',
    a: 'With `===` on the references: one comparison, however long the strings are.',
  },
  'hash-first': {
    q: 'When an interning table looks a string up by its characters, why does it compare the stored hash before the characters?',
    a: 'Comparing two numbers is cheap, and different hashes rule out almost every wrong string without touching characters.',
  },
  'weak-table': {
    q: 'Why must a VM’s intern table hold its strings weakly?',
    a: 'Otherwise every string would stay reachable through it and none could ever be freed.',
  },
  'name-in-pool': {
    q: 'A bytecode instruction such as `load.global` can carry only bytes after its opcode. How can it say *which* global variable it means?',
    a: 'The variable’s name is stored as a string in the constant pool, and the operand is that constant’s index.',
  },
  'global-table-what': {
    q: 'In the companion Drip VM, what is the **global table**?',
    a: 'One hash table (`vm.globals`) mapping interned name strings to values, shared by the whole program.',
  },
  'set-returns-new': {
    q: 'In the companion Drip VM, `store.global` calls `globals.set(...)`, which returns `true` when the key was new. What does `true` mean there?',
    a: 'The key was new: the variable was never defined, so the assignment is an error.',
  },
};

export const examples = {
  'intern-vm': {
    title: 'Built strings meet literals',
    lang: 'drip-vm',
    code: `let a = "ab";
let b = "a" + "b";
print a == b;

let s = "";
for i in 0..3 {
  s = s + "na";
}
print s;
print s == "nanana";
print "na" + "na" == "nana";`,
  },
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

export const exercises = {
  'globals-vm': {
    title: 'Three global instructions',
    prompt: `\`run(code, k, g)\` is a tiny VM. \`code\` is an array of bytes, \`k\` is the constant pool, and \`g\` is a globals \`Table\` whose \`set\` returns \`true\` when the key was new, just like the real one. \`CONST\`, \`POP\`, \`PRINT\` and \`ADD\` work already. Each of \`DEF\`, \`GET\` and \`SET\` has one operand byte (the real VM uses two, but one keeps this small): the index in \`k\` of the variable's name. Fill them in:

- \`DEF\` stores the top of the stack under the name, then pops it.
- \`GET\` pushes the name's value, or calls \`undef(name)\` if there is none.
- \`SET\` stores the top of the stack under an *existing* name and leaves it on the stack. If the name was new, remove it again and call \`undef(name)\`.`,
    starter: `// Opcodes of a tiny VM.
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
      // your code here
    } else if (op === GET) {
      // your code here
    } else if (op === SET) {
      // your code here
    }
  }
  return { out, left: stack.length };
}`,
    solution: `// Opcodes of a tiny VM.
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
  }
  return { out, left: stack.length };
}`,
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
        code: `// Opcodes of a tiny VM.
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
      const n = k[code[ip++]];
      g.set(n, top());
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
  }
  return { out, left: stack.length };
}`,
        why: '`DEF` forgets to pop. The value is now both in the table and on the stack, and every `let` leaves one more stray value behind.',
      },
      {
        code: `// Opcodes of a tiny VM.
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
      if (g.set(n, stack.pop())) {
        g.delete(n);
        undef(n);
      }
    }
  }
  return { out, left: stack.length };
}`,
        why: '`SET` pops the value. Then `print a = 5;` has nothing left to print. An assignment is an expression, so its value must stay on the stack.',
      },
      {
        code: `// Opcodes of a tiny VM.
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
        undef(n);
      }
    }
  }
  return { out, left: stack.length };
}`,
        why: 'The error is reported, but the name stays in the table. A program that caught the error would find a variable that was never defined. Delete it first.',
      },
    ],
  },
  interner: {
    optional: true,
    title: 'An interner',
    prompt: 'Write `intern(chars)`. It returns a string object `{ chars }`, and it must return **the same object** every time it is asked for the same characters. Count each object you actually create in `this.made`. Use `this.table`, a `Map` from characters to the object.',
    starter: `class Interner {
  constructor() {
    this.table = new Map();
    this.made = 0;
  }
  intern(chars) {
    this.made++;
    return { chars };
  }
}`,
    solution: `class Interner {
  constructor() {
    this.table = new Map();
    this.made = 0;
  }
  intern(chars) {
    const old = this.table.get(chars);
    if (old !== undefined) return old;
    const s = { chars };
    this.made++;
    this.table.set(chars, s);
    return s;
  }
}`,
    tests: `test('an object with the characters', () => {
  const it = new Interner();
  expect(it.intern('hi').chars).toBe('hi');
});
test('same characters, same object', () => {
  const it = new Interner();
  const a = it.intern('hi');
  const b = it.intern('h' + 'i');
  expect(a === b).toBe(true);
});
test('different characters, different objects', () => {
  const it = new Interner();
  expect(it.intern('x') === it.intern('y'))
    .toBe(false);
});
test('only new strings are made', () => {
  const it = new Interner();
  for (const c of ['a', 'b', 'a', 'a', 'b']) {
    it.intern(c);
  }
  expect(it.made).toBe(2);
});`,
    hints: [
      'Before making an object, look the characters up in `this.table`.',
      'If you find one, return it straight away, without counting.',
      'Otherwise make `{ chars }`, count it, store it in the table under `chars`, and return it.',
    ],
    walkthrough: `**How to think about it.** Interning is a promise: "for the same characters, you always get the same object". The only way to keep it is to remember every object you have handed out, keyed by its characters, and to look there *before* making anything. So the method has two paths: a found path (return what you made before, and make nothing) and a new path (make it, remember it, return it). \`this.made\` only goes up on the new path, which is how the tests check you are not making extra objects.

**The solution, line by line.**

\`\`\`js
intern(chars) {
  const old = this.table.get(chars);
  if (old !== undefined) return old;
  const s = { chars };
  this.made++;
  this.table.set(chars, s);
  return s;
}
\`\`\`

- \`const old = this.table.get(chars);\` asks the \`Map\` whether these characters have been interned before. A \`Map\` gives \`undefined\` for a key it does not have.
- \`if (old !== undefined) return old;\` is the found path: hand back the very object made earlier, so two calls with \`"hi"\` and \`"h" + "i"\` give the same object.
- \`const s = { chars };\` is the new path: make the one and only object for these characters (\`{ chars }\` is short for \`{ chars: chars }\`).
- \`this.made++;\` counts it.
- \`this.table.set(chars, s);\` remembers it, so the next request takes the found path.
- \`return s;\` hands it out.

The JavaScript \`Map\` does the hard part here: it hashes \`chars\` and compares characters for you. The companion VM cannot key a table by raw characters, since its \`Table\` compares keys by identity, so it uses \`findString\`, which hashes and compares characters itself; the extra exercise builds that.

**Common wrong attempts.**

- Looking up but never storing: the lookup always misses, so every call makes a new object, and \`made\` keeps growing.
- Making the object first and storing it every time: the table is overwritten on each call, so two requests for \`"hi"\` return two different objects. The look-up must come before anything is made.`,
    wrong: [
      {
        code: `class Interner {
  constructor() {
    this.table = new Map();
    this.made = 0;
  }
  intern(chars) {
    const old = this.table.get(chars);
    if (old !== undefined) return old;
    this.made++;
    return { chars };
  }
}`,
        why: 'Nothing is ever stored in the table, so the lookup always misses and every call makes a new object.',
      },
      {
        code: `class Interner {
  constructor() {
    this.table = new Map();
    this.made = 0;
  }
  intern(chars) {
    const s = { chars };
    this.made++;
    this.table.set(chars, s);
    return this.table.get(chars);
  }
}`,
        why: 'This replaces the stored object on every call, so two requests for `"hi"` get two different objects. Look up before you make anything.',
      },
    ],
  },
  findStr: {
    optional: true,
    title: 'findString: hash first, then characters',
    prompt: 'An 8-slot intern table is two arrays: `ks` holds string objects `{ chars, hash }` or `null`, and `vs` holds `null`, or `TOMB` for a tombstone. Write `findString(ks, vs, chars, h)`: probe from `h & 7`, step over tombstones, stop with `null` at a truly empty slot, and return the object whose `hash` equals `h` **and** whose `chars` equal `chars`.',
    starter: `const TOMB = true;

function findString(ks, vs, chars, h) {
  return null;
}`,
    solution: `const TOMB = true;

function findString(ks, vs, chars, h) {
  const mask = ks.length - 1;
  let i = h & mask;
  for (;;) {
    const k = ks[i];
    if (k === null) {
      if (vs[i] === null) return null;
    } else if (k.hash === h &&
        k.chars === chars) {
      return k;
    }
    i = (i + 1) & mask;
  }
}`,
    tests: `const str = (chars, hash) => ({ chars, hash });
const empty = () => [
  new Array(8).fill(null),
  new Array(8).fill(null),
];
test('finds the object itself', () => {
  const [ks, vs] = empty();
  const hi = str('hi', 10);
  ks[2] = hi;
  expect(findString(ks, vs, 'hi', 10)).toBe(hi);
});
test('a missing string gives null', () => {
  const [ks, vs] = empty();
  ks[2] = str('hi', 10);
  expect(findString(ks, vs, 'ho', 11)).toBe(null);
});
test('probes past collisions, wrapping', () => {
  const [ks, vs] = empty();
  ks[7] = str('x', 7);
  const h = str('health', 15);
  ks[0] = h;
  expect(findString(ks, vs, 'health', 15))
    .toBe(h);
});
test('steps over a tombstone', () => {
  const [ks, vs] = empty();
  vs[3] = TOMB;
  const s = str('vx', 3);
  ks[4] = s;
  expect(findString(ks, vs, 'vx', 3)).toBe(s);
});
test('same hash, other chars: keep going', () => {
  const [ks, vs] = empty();
  ks[5] = str('imposter', 5);
  const s = str('real', 5);
  ks[6] = s;
  expect(findString(ks, vs, 'real', 5)).toBe(s);
});`,
    hints: [
      'The probe loop is the one in `Table.find`: start at `h & mask`, step with `i = (i + 1) & mask`.',
      'A `null` key with a `null` value means “not here”: return `null`. A `null` key with `TOMB` means keep going.',
      'A matching hash isn’t enough: two different strings can share a hash. Check `k.chars === chars` too.',
    ],
    walkthrough: `**How to think about it.** This is the probe loop of \`Table.find\` with a different question at each slot. \`find\` holds a key object and asks "is this the same object?"; \`findString\` holds only characters and a hash, so it asks "is this a string with my hash *and* my characters?". Everything else stays: start at \`h & mask\`, step with wrap-around, stop with "absent" at a truly empty slot, and step over tombstones.

**The solution, line by line.**

\`\`\`js
function findString(ks, vs, chars, h) {
  const mask = ks.length - 1;
  let i = h & mask;
  for (;;) {
    const k = ks[i];
    if (k === null) {
      if (vs[i] === null) return null;
    } else if (k.hash === h &&
        k.chars === chars) {
      return k;
    }
    i = (i + 1) & mask;
  }
}
\`\`\`

- \`const mask = ks.length - 1;\` is 7 for the 8-slot tables in the tests.
- \`let i = h & mask;\` starts where a string with this hash would have been put.
- \`for (;;) {\` loops until a \`return\`; it always ends because the table always has an empty slot.
- \`const k = ks[i];\` reads the string object in this slot, or \`null\`.
- \`if (k === null) {\` means no string here. \`if (vs[i] === null) return null;\` is a truly empty slot: no string with these characters exists. If the value is \`TOMB\`, the \`if\` does nothing and the loop steps on.
- \`} else if (k.hash === h &&\` compares two numbers first; for a different string this is almost always false, and the characters are never read.
- \`k.chars === chars) {\` only runs when the hashes agree, and settles it, because different strings can share a hash.
- \`return k;\` returns the existing object itself, so the caller can use it instead of making a new one.
- \`i = (i + 1) & mask;\` steps on, wrapping from 7 to 0.

**Common wrong attempts.**

- Matching on the hash alone: the "imposter" test has a different string with the same hash, and it is returned by mistake. Hashes narrow the search; characters decide.
- Returning \`null\` at any slot with no key: a tombstone then looks like the end of the path, and a string stored beyond a deleted slot is never found.`,
    wrong: [
      {
        code: `const TOMB = true;

function findString(ks, vs, chars, h) {
  const mask = ks.length - 1;
  let i = h & mask;
  for (;;) {
    const k = ks[i];
    if (k === null) {
      if (vs[i] === null) return null;
    } else if (k.hash === h) {
      return k;
    }
    i = (i + 1) & mask;
  }
}`,
        why: 'Matching on the hash alone returns the imposter: a different string that happens to share the hash. Compare the characters too.',
      },
      {
        code: `const TOMB = true;

function findString(ks, vs, chars, h) {
  const mask = ks.length - 1;
  let i = h & mask;
  for (;;) {
    const k = ks[i];
    if (k === null) return null;
    if (k.hash === h &&
      k.chars === chars) return k;
    i = (i + 1) & mask;
  }
}`,
        why: 'This stops at a tombstone as if it were empty, so a string stored beyond a deleted slot is never found.',
      },
    ],
  },
  tick: {
    optional: true,
    lang: 'drip-vm',
    title: 'A counter in a global',
    prompt: 'Write the body of `tick()` so that it adds 1 to the global `count` and prints the new value. Notice that `count` is defined *after* `tick`. The program should print `1`, `2`, `3` and then `3`.',
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

- \`let count = count + 1;\` inside the function: \`let\` in a function makes a new *local*, and its initialiser then reads that same new local, so the compiler stops with \`line 2: cannot read 'count' in its own initialiser\` (*Locals as stack slots* explains locals).
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
    q: 'In the companion Drip VM, `eq` is just `===`. Why does `print "ab" == "a" + "b";` print `true`?',
    options: [
      {
        t: '`eq` secretly compares characters for strings',
        why: 'It does not: `valuesEqual` is `a === b`, nothing more.',
      },
      {
        t: 'The compiler joins `"a" + "b"` into `"ab"` before running',
        why: 'This compiler emits `add`; the join happens while the program runs.',
      },
      {
        t: '`copyString` finds the existing `"ab"` in the intern table and returns it, so both sides are the same object',
        correct: true,
        why: 'Interning makes equal strings identical, so `===` is enough.',
      },
      {
        t: 'JavaScript strings are always compared by value',
        why: 'The operands are `ObjString` objects, compared by reference.',
      },
    ],
  },
  {
    q: 'In a VM that interns every string, when does making a string allocate a new object?',
    options: [
      {
        t: 'Every time it is called',
        why: 'That was the pre-interning story. It now looks first.',
      },
      {
        t: 'Only when no string with those characters is in the intern table',
        correct: true,
        why: 'Otherwise it returns the existing object.',
      },
      {
        t: 'Only for string literals',
        why: 'Literals that already exist are found too, and new concatenations are allocated.',
      },
      {
        t: 'Only during garbage collection',
        why: 'The collector frees strings; it never makes them.',
      },
    ],
  },
  {
    q: 'What would go wrong if a VM’s intern table held its strings strongly?',
    options: [
      {
        t: 'Equal strings would stop being identical',
        why: 'Interning would still work; memory is the problem.',
      },
      {
        t: 'Lookups would become slower',
        why: 'Lookup speed isn’t affected by how strings are held.',
      },
      {
        t: 'No string could ever be freed, because the table itself would keep every one reachable',
        correct: true,
        why: 'So `removeWhite` drops unmarked strings before the sweep.',
      },
      {
        t: 'The table could no longer use tombstones',
        why: '`removeWhite` relies on tombstones; strength is a separate question.',
      },
    ],
  },
  {
    q: 'In the companion Drip VM, the program is just `b = 5;`, and `b` was never defined. What does the VM do?',
    options: [
      {
        t: 'Creates `b`, as sloppy-mode JavaScript would',
        why: 'Drip requires a `let`. The new key is deleted again.',
      },
      {
        t: 'Stores `b`, sees `set` return true, deletes `b`, and reports `undefined variable \'b\'`',
        correct: true,
        why: 'That is the set-then-undo trick: one table operation in the normal case.',
      },
      {
        t: 'The compiler rejects it',
        why: 'The compiler cannot know which globals will exist; this is found at run time.',
      },
      {
        t: 'Ignores the assignment',
        why: 'It reports a runtime error and stops.',
      },
    ],
  },
  {
    q: `In Drip, where globals are looked up by name when the instruction runs, what does this print?
\`\`\`
fn f() { print x; }
let x = 1;
f();
x = 2;
f();
\`\`\``,
    options: [
      {
        t: '`1` then `2`',
        correct: true,
        why: 'Each call runs `load.global x` at that moment, so it sees the current value.',
      },
      {
        t: 'A compile error: `x` is used before it is declared',
        why: 'The compiler does not check globals; it only stores the name.',
      },
      {
        t: '`1` then `1`',
        why: 'Nothing copies the value into `f`. Each `load.global` reads the table afresh.',
      },
      {
        t: 'A runtime error at the first `f()`',
        why: 'By then `let x = 1;` has run, so `x` is in the table.',
      },
    ],
  },
];
