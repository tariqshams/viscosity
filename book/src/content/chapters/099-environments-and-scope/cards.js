// Chapter 99 cards. Keys are stable ids: never rename them.

export const prompts = {
  'env-what': {
    q: 'What two things does a Drip environment hold?',
    a: 'A table (a `Map`) from names to values, and a reference to its enclosing (parent) environment.',
  },
  'env-parent': {
    q: 'Which environment has no parent?',
    a: 'The globals. Their `enclosing` is `null`.',
  },
  'define-current': {
    q: 'Where does `let x = 1;` put `x`?',
    a: 'In the current environment only. `define` never looks at parents.',
  },
  'lookup-order': {
    q: 'In what order does `get` look for a name?',
    a: 'The current environment first, then its parent, then that one’s parent, out to the globals. It stops at the first match.',
  },
  'undefined-end': {
    q: 'What happens when a lookup walks past the globals without finding the name?',
    a: 'It throws a runtime error: `runtime error: undefined variable \'name\'`',
  },
  'shadow-what': {
    q: 'What does it mean for an inner variable to *shadow* an outer one?',
    a: 'It has the same name, so lookups inside its block find it first and the outer one can’t be reached by name there.',
  },
  'assign-vs-let': {
    q: 'Inside a block, what is the difference between `n = 2;` and `let n = 2;` when an outer `n` exists?',
    a: '`n = 2;` walks out and changes the outer `n`. `let n = 2;` makes a new `n` in the block that shadows it.',
  },
  'block-new-env': {
    q: 'What is the parent of the environment a block statement creates?',
    a: 'Whatever environment was current when the block started.',
  },
  'finally-why': {
    q: 'Why does `executeBlock` restore the old environment in a `finally`?',
    a: 'So it is restored even when something is thrown out of the block, such as a runtime error.',
  },
};

export const examples = {
  shadow: {
    title: 'Assignment finds the nearest variable',
    lang: 'drip',
    code: `let x = "global";
{
  let x = "outer";
  {
    x = "changed";
    let y = x;
    print y;
  }
  print x;
}
print x;`,
  },
};

export const exercises = {
  environment: {
    title: 'An environment with a parent',
    prompt:
      'Finish the `Environment` class. `define(name, v)` stores a value in **this** environment. `get(name)` returns the value from the nearest environment that has the name, checking this one first and then each parent. `assign(name, v)` changes the value in the nearest environment that has the name. If no environment in the chain has the name, `get` and `assign` must throw an `Error` whose message is `undefined variable \'NAME\'` (with the real name).',
    starter: `class Environment {
  constructor(parent = null) {
    this.values = new Map();
    this.parent = parent;
  }
  define(name, v) {
    // your code here
  }
  get(name) {
    // your code here
  }
  assign(name, v) {
    // your code here
  }
}

const g = new Environment();
g.define('a', 1);
const inner = new Environment(g);
console.log(inner.get('a'));`,
    solution: `class Environment {
  constructor(parent = null) {
    this.values = new Map();
    this.parent = parent;
  }
  define(name, v) {
    this.values.set(name, v);
  }
  get(name) {
    if (this.values.has(name)) {
      return this.values.get(name);
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    throw new Error(
      \`undefined variable '\${name}'\`);
  }
  assign(name, v) {
    if (this.values.has(name)) {
      this.values.set(name, v);
      return;
    }
    if (this.parent) {
      this.parent.assign(name, v);
      return;
    }
    throw new Error(
      \`undefined variable '\${name}'\`);
  }
}`,
    tests: `test('define then get', () => {
  const g = new Environment();
  g.define('a', 1);
  expect(g.get('a')).toBe(1);
});
test('get looks through parents', () => {
  const g = new Environment();
  g.define('a', 1);
  const b1 = new Environment(g);
  const b2 = new Environment(b1);
  expect(b2.get('a')).toBe(1);
});
test('inner shadows outer', () => {
  const g = new Environment();
  g.define('a', 'outer');
  const b = new Environment(g);
  b.define('a', 'inner');
  expect(b.get('a')).toBe('inner');
  expect(g.get('a')).toBe('outer');
});
test('assign changes the owner', () => {
  const g = new Environment();
  g.define('n', 1);
  const b = new Environment(g);
  b.assign('n', 2);
  expect(g.get('n')).toBe(2);
  expect(b.values.has('n')).toBe(false);
});
test('none (null) values are found', () => {
  const g = new Environment();
  g.define('z', null);
  const b = new Environment(g);
  expect(b.get('z')).toBe(null);
});
test('unknown names throw', () => {
  const b = new Environment(
    new Environment());
  let m1 = '';
  let m2 = '';
  try { b.get('q'); } catch (e) {
    m1 = e.message;
  }
  try { b.assign('q', 1); } catch (e) {
    m2 = e.message;
  }
  expect(m1).toBe("undefined variable 'q'");
  expect(m2).toBe("undefined variable 'q'");
});`,
    hints: [
      'Sort the methods first: which one must look only at this table, and which two must walk outwards to the parent?',
      '`define` is one line: put the pair in `this.values`.',
      '`get`: if `this.values.has(name)`, return the value. Otherwise, if there is a parent, return `this.parent.get(name)`. Otherwise throw.',
      '`assign` has the same shape as `get`, but sets the value where it finds the name instead of returning it.',
    ],
    walkthrough: `**How to think about it.** Sort the three methods into two kinds before writing any code. \`define\` is "here only": it is what \`let\` calls, and if it ever looked at a parent, an inner \`let\` could not shadow anything. \`get\` and \`assign\` are "walk the chain": check this table, and on a miss hand the same question to the parent. The parent runs the very same method, so the walk continues outwards by recursion, and only an environment with no parent (the globals) can reach the error.

**The solution, line by line.**

- \`constructor(parent = null) { this.values = new Map(); this.parent = parent; }\` is given: a table, and an arrow to the parent (\`null\` for the globals).
- \`define(name, v) { this.values.set(name, v); }\` writes into this table only. A second \`define\` of the same name in the same table replaces the old value, which is what Drip does for globals.
- \`if (this.values.has(name)) { return this.values.get(name); }\` in \`get\` asks "is the name *here*?" with \`has\`, not by testing the value, because a variable may hold \`null\` (Drip's \`none\`) or \`false\`.
- \`if (this.parent) { return this.parent.get(name); }\` passes the question outwards, and returns whatever the rest of the chain answers.
- The \`throw new Error(...)\` line is reached only when there is no parent left to ask, and uses Drip's exact message, \`undefined variable 'q'\` for the name \`q\`.
- \`assign\` has the same three steps, with \`this.values.set(name, v); return;\` where \`get\` returned the value: it writes into the first table that *has* the name, and never makes a new entry (the test "assign changes the owner" checks that the inner table stays empty).

**Common wrong attempts.**

- Writing \`assign\` as \`this.values.set(name, v)\`: that is \`define\` under another name. It makes a new variable in the inner table, so the outer \`n\` stays 1, and unknown names are silently created instead of throwing.
- Testing \`const v = this.values.get(name); if (v) return v;\`: a variable holding \`null\`, \`false\` or \`0\` looks missing, so the walk carries on past it and ends in a wrong error, or finds an outer variable with the same name.
- Forgetting the \`return\` before \`this.parent.get(name)\`: the method then falls through to the \`throw\` even when the parent found the name.`,
    wrong: [
      {
        code: `class Environment {
  constructor(parent = null) {
    this.values = new Map();
    this.parent = parent;
  }
  define(name, v) {
    this.values.set(name, v);
  }
  get(name) {
    if (this.values.has(name)) {
      return this.values.get(name);
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    throw new Error(
      \`undefined variable '\${name}'\`);
  }
  assign(name, v) {
    this.values.set(name, v);
  }
}`,
        why: 'This `assign` is just `define`: it makes a new variable in the inner table instead of changing the outer one. The outer `n` stays 1, and unknown names are silently created instead of throwing.',
      },
      {
        code: `class Environment {
  constructor(parent = null) {
    this.values = new Map();
    this.parent = parent;
  }
  define(name, v) {
    this.values.set(name, v);
  }
  get(name) {
    const v = this.values.get(name);
    if (v) return v;
    if (this.parent) {
      return this.parent.get(name);
    }
    throw new Error(
      \`undefined variable '\${name}'\`);
  }
  assign(name, v) {
    if (this.values.has(name)) {
      this.values.set(name, v);
      return;
    }
    if (this.parent) {
      this.parent.assign(name, v);
      return;
    }
    throw new Error(
      \`undefined variable '\${name}'\`);
  }
}`,
        why: 'Testing `if (v)` treats a variable that holds `null` (or `false`, or `0`) as missing, so `get(\'z\')` throws. Use `this.values.has(name)` to ask whether the name exists.',
      },
    ],
  },
  shadowFix: {
    optional: true,
    lang: 'drip',
    title: 'Keep the outer variable',
    prompt:
      'This Drip program prints `inner` twice, because the block changes the outer `x`. Change **one line** so that the block gets its own `x`: the program should print `inner` and then `outer`.',
    starter: `let x = "outer";
{
  x = "inner";
  print x;
}
print x;`,
    solution: `let x = "outer";
{
  let x = "inner";
  print x;
}
print x;`,
    tests: `inner
outer`,
    hints: [
      'Which statement creates a new variable in the current environment, and which one walks outward?',
      'Turn the assignment inside the block into a declaration, so the block has its own `x`.',
      'Put `let` in front of `x = "inner";`.',
    ],
    walkthrough: `**How to think about it.** Read the block's first line and ask which method it calls. \`x = "inner";\` is an assignment, so the interpreter walks the chain from the block's (empty) environment, finds \`x\` in the globals and overwrites it; after the \`}\` the global already says \`"inner"\`. To leave the global alone, the block needs an \`x\` of its own, and only \`let\` makes one.

**The solution, line by line.**

- \`let x = "outer";\` defines the global \`x\`.
- \`{\` starts a block: a new environment whose parent is the globals.
- \`let x = "inner";\` defines a second \`x\` in the block's environment. It is legal because it is in a different scope from the first.
- \`print x;\` looks \`x\` up starting in the block's environment, finds the inner one first (shadowing) and prints \`inner\`.
- \`}\` ends the block, and the interpreter switches back to the globals.
- \`print x;\` now finds the untouched global and prints \`outer\`.

**Common wrong attempts.**

- Changing the first line to \`let x = "inner";\` gives one \`x\` again, which never holds \`"outer"\`, so both lines print \`inner\`.
- Adding \`let x = x;\` at the top of the block, to "copy" the outer value in, is a compile error: \`cannot read 'x' in its own initialiser\`, because the inner \`x\` already exists while its initialiser runs.`,
    wrong: [
      {
        code: `let x = "inner";
{
  x = "inner";
  print x;
}
print x;`,
        why: 'Now there is only one `x` again, and it never holds "outer". The block still assigns to the global, so both lines print `inner`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: `What does this Drip program print?
\`\`\`
let a = 1;
{
  let a = 2;
  print a;
}
print a;
\`\`\``,
    options: [
      { t: '`2` then `2`', why: 'That is what one global table would do. With environments, the inner `let` makes a separate `a`.' },
      { t: '`2` then `1`', correct: true, why: 'The inner `a` shadows the outer one inside the block and disappears at `}`.' },
      { t: '`1` then `1`', why: 'Inside the block, the lookup finds the inner `a` first, which is 2.' },
      { t: 'A compile error: `a` is declared twice', why: 'The two declarations are in different scopes, so there is no clash; only two `let a` in the same block are refused.' },
    ],
  },
  {
    q: `What does this print?
\`\`\`
let n = 1;
{
  n = n + 1;
}
print n;
\`\`\``,
    options: [
      { t: '`1`', why: 'There is no `let` in the block, so nothing new is defined there. The assignment changes the outer `n`.' },
      { t: 'A runtime error: `n` is not defined in the block', why: 'The lookup walks to the parent and finds the global `n`.' },
      { t: '`none`', why: '`n` holds a number the whole time.' },
      { t: '`2`', correct: true, why: '`assign` walks out of the block’s empty environment and updates the global `n`.' },
    ],
  },
  {
    q: 'Which environment does `define` write to?',
    options: [
      { t: 'The current environment, always', correct: true, why: '`define` never looks at parents. That is what lets an inner `let` shadow an outer variable.' },
      { t: 'The nearest environment that already has the name', why: 'That is `assign`.' },
      { t: 'The globals', why: 'Only when the globals are the current environment.' },
      { t: 'A new environment it creates', why: 'Environments are created by blocks (and later, calls), not by `define`.' },
    ],
  },
  {
    q: 'A lookup for `b` starts in block 2, whose parent is block 1, whose parent is the globals. Only the globals have `b`. How many tables are checked?',
    options: [
      { t: 'One', why: 'Block 2 doesn’t have `b`, so the walk must continue.' },
      { t: 'Two', why: 'Block 1 doesn’t have it either.' },
      { t: 'Three', correct: true, why: 'Block 2, block 1, then the globals, where it is found.' },
      { t: 'Every environment ever created', why: 'Only the chain of parents from the current one is searched. Discarded environments aren’t on it.' },
    ],
  },
  {
    q: 'Why does `executeBlock` use `try { ... } finally { this.env = previous; }`?',
    options: [
      { t: 'To catch runtime errors and print them', why: 'There is no catch. The error still travels on; `finally` only does clean-up on the way.' },
      { t: 'To make blocks run faster', why: '`finally` is about correctness, not speed.' },
      { t: 'Because JavaScript requires `try` around loops', why: 'It doesn’t.' },
      { t: 'So the previous environment is restored even if a statement throws', correct: true, why: 'Without it, a throw would leave `this.env` pointing at the inner block’s environment.' },
    ],
  },
  {
    q: 'In the program `{ let z = 1; } print z;` what happens?',
    options: [
      { t: 'It prints `1`', why: '`z` lived in the block’s environment, which is no longer on the chain.' },
      { t: 'It prints `none`', why: 'Drip does not make up a value for a missing name; it reports an error.' },
      { t: 'A runtime error: `undefined variable \'z\'`', correct: true, why: 'After the block, the current environment is the globals, and they have no `z`.' },
      { t: 'A compile error', why: 'The program parses and resolves fine: `z` outside the block is treated as a global. The problem only shows up when `print z` runs.' },
    ],
  },
];
