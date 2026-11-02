// Chapter 151 cards (the second half of a split chapter). Keys are stable ids: never rename them.

export const prompts = {
  'index-is-slot': {
    q: 'In the compiler’s `locals` array, what does a local’s index tell you?',
    a: 'Its stack slot: entry `i` is what will sit in slot `i` at run time.',
  },
  'begin-scope-cost': {
    q: 'What does `beginScope` emit?',
    a: 'Nothing. It only adds 1 to the compiler’s `scopeDepth`.',
  },
  'end-scope-pops': {
    q: 'A block declared three locals. What does `endScope` do at its closing brace?',
    a: 'It lowers `scopeDepth`, then emits three `pop`s (one per local deeper than the new depth) and removes those entries from `locals`.',
  },
  'compile-scope-what': {
    q: 'What is **compile-time scope**?',
    a: 'The compiler’s record of which locals exist at each point (the `locals` array with each entry’s depth, plus `scopeDepth`), mirroring the run-time stack.',
  },
  'depth-zero': {
    q: 'At `scopeDepth` 0, what does `let x = 1;` make?',
    a: 'A global, with `define.global`. Only declarations inside a block or a function become locals.',
  },
  'search-backwards': {
    q: 'Why does `resolveLocal` search the `locals` array from the end?',
    a: 'The innermost declaration of a name was added last, so searching backwards finds it first: that is shadowing.',
  },
  'depth-minus-one': {
    q: 'What does a depth of `-1` mean for an entry in `locals`?',
    a: 'Declared but not ready: its initialiser is still being compiled. Finding it in a search is the error `cannot read \'x\' in its own initialiser`.',
  },
  'redeclare-vs-shadow': {
    q: 'When is a second `let x` an error, and when is it shadowing?',
    a: 'In the same block it is `\'x\' is already declared in this scope`; in an inner block it shadows the outer `x`. (At the top level it replaces the global.)',
  },
};

export const examples = {
  shadow: {
    title: 'Shadowing, slot by slot',
    lang: 'drip-vm',
    code: `let x = "global";
{
  let x = "outer";
  {
    let y = 2;
    let x = "inner";
    print x;
  }
  print x;
}
print x;`,
  },
};

const R_HEAD = `// locals: [{ name, depth }, ...]
// Return the slot of name, or -1.
function resolve(locals, name) {`;

const ERR = `const own = (n) => "cannot read '" +
  n + "' in its own initialiser";
`;

const ES_HEAD = `// c = { locals: [{ name, depth }],
//       scopeDepth: number }
// Leave one block. Return how many
// pops the compiler should emit.
function endScope(c) {`;

export const exercises = {
  resolve: {
    title: 'resolveLocal',
    prompt: `Write \`resolve(locals, name)\`, the compiler's \`resolveLocal\`. \`locals\` is the compile-time array: each entry has a \`name\` (a string) and a \`depth\`. Return the **index** of the matching local, which is its stack slot, or \`-1\` if the name isn't a local. When a name appears more than once, the innermost declaration wins. If the local found has depth \`-1\`, \`throw new Error(own(name))\`.`,
    starter: `${ERR}
${R_HEAD}
  // your code here
}`,
    solution: `${ERR}
${R_HEAD}
  for (let i = locals.length - 1;
       i >= 0; i--) {
    if (locals[i].name === name) {
      if (locals[i].depth === -1) {
        throw new Error(own(name));
      }
      return i;
    }
  }
  return -1;
}`,
    tests: `const L = (name, depth) =>
  ({ name, depth });
const base = [L('', 0), L('a', 1),
  L('b', 2)];
test('finds a slot', () => {
  expect(resolve(base, 'b')).toBe(2);
  expect(resolve(base, 'a')).toBe(1);
});
test('not a local', () => {
  expect(resolve(base, 'zz')).toBe(-1);
});
test('innermost wins', () => {
  const ls = [L('', 0), L('a', 1),
    L('x', 2), L('a', 2)];
  expect(resolve(ls, 'a')).toBe(3);
});
test('own initialiser', () => {
  const ls = [L('', 0), L('a', 1),
    L('a', -1)];
  expect(() => resolve(ls, 'a'))
    .toThrow();
});
test('a ready outer, unready other', () => {
  const ls = [L('', 0), L('a', 1),
    L('b', -1)];
  expect(resolve(ls, 'a')).toBe(1);
});`,
    hints: [
      'Which declaration should win when a name appears twice: the earlier one or the later one? That tells you which end of the array to start from.',
      'Loop with `i` from `locals.length - 1` down to `0`. At the first entry whose `name` matches, stop.',
      'At that first match, check `depth === -1` (throw if so), otherwise `return i`. If the loop ends with no match, `return -1`.',
    ],
    walkthrough: `**How to think about it.** The array is in declaration order, and an inner \`a\` is always declared after an outer one, so the declaration you want is the *last* one with that name. That means searching from the end and stopping at the first match. Only then do you look at the match's depth.

**The solution, line by line.**

- \`for (let i = locals.length - 1;\` starts at the last entry, the most recent declaration...
- \`     i >= 0; i--) {\` ...and walks back to entry 0.
- \`if (locals[i].name === name) {\` is true at the first (innermost) declaration of the name.
- \`if (locals[i].depth === -1) {\` asks whether this local is still unready, which means we are inside its own initialiser, as in \`let a = a;\`.
- \`throw new Error(own(name));\` reports that. The real compiler records the same message, \`cannot read 'a' in its own initialiser\`, as a compile error.
- \`return i;\` otherwise: the index is the slot, and the compiler emits \`load.local i\`.
- \`return -1;\` after the loop means no local has this name; the caller then tries upvalues and, finally, a global.

In the last test \`b\` is unready, but nobody asked for \`b\`, so \`a\` resolves normally: the depth is only checked on the entry that matched.

**Common wrong attempts.**

- \`findIndex\` searches from the front, so it finds the outermost \`a\` and breaks shadowing.
- Skipping unready locals (\`&& depth !== -1\`) makes \`let a = a;\` quietly read the *outer* \`a\`. That looks helpful, but it hides a likely mistake, and Drip's rule is that it is an error.`,
    wrong: [
      {
        code: `${ERR}
${R_HEAD}
  return locals.findIndex(
    (l) => l.name === name);
}`,
        why: '`findIndex` searches from the *front*, so it finds the outermost `a` and breaks shadowing. It also never checks for depth `-1`.',
      },
      {
        code: `${ERR}
${R_HEAD}
  for (let i = locals.length - 1;
       i >= 0; i--) {
    const l = locals[i];
    if (l.name === name &&
        l.depth !== -1) {
      return i;
    }
  }
  return -1;
}`,
        why: 'Skipping the unready local makes `let a = a;` read the *outer* `a`. The innermost match must be reported as an error.',
      },
    ],
  },
  'end-scope': {
    optional: true,
    title: 'endScope',
    prompt: `Write \`endScope(c)\`. \`c.locals\` is the compile-time array (entries have a \`name\` and a \`depth\`), and \`c.scopeDepth\` is the current depth. Leave one block: lower \`scopeDepth\` by 1, then remove from the end of \`locals\` every entry whose depth is greater than the new \`scopeDepth\`. Return how many you removed: that is how many \`pop\`s the compiler emits.`,
    starter: `${ES_HEAD}
  // your code here
}`,
    solution: `${ES_HEAD}
  c.scopeDepth--;
  const last = () => c.locals.at(-1);
  let pops = 0;
  while (c.locals.length > 0 &&
         last().depth > c.scopeDepth) {
    c.locals.pop();
    pops++;
  }
  return pops;
}`,
    tests: `const L = (name, depth) =>
  ({ name, depth });
const mk = () => ({ scopeDepth: 2,
  locals: [L('', 0), L('a', 1),
    L('b', 2), L('c', 2)] });
test('inner block: two pops', () => {
  const c = mk();
  expect(endScope(c)).toBe(2);
  expect(c.scopeDepth).toBe(1);
  expect(c.locals.length).toBe(2);
});
test('then the outer block', () => {
  const c = mk();
  endScope(c);
  expect(endScope(c)).toBe(1);
  expect(c.locals.length).toBe(1);
});
test('an empty block', () => {
  const c = { scopeDepth: 1,
    locals: [L('', 0)] };
  expect(endScope(c)).toBe(0);
  expect(c.locals.length).toBe(1);
});`,
    hints: [
      'Lower `c.scopeDepth` first: the comparison is against the depth you are going back to.',
      'Loop while the last entry exists and its depth is greater than `c.scopeDepth`, popping it and counting.',
    ],
    walkthrough: `**How to think about it.** After \`c.scopeDepth--\`, everything declared inside the block we are leaving has a depth greater than the new value, and everything outside has a depth less than or equal to it. Because the array is in declaration order, the entries to remove are all at the end, so popping from the end until the condition fails removes exactly the block's locals.

**The solution, line by line.**

- \`c.scopeDepth--;\` goes back out one level.
- \`const last = () => c.locals.at(-1);\` is a small helper for the last entry.
- \`let pops = 0;\` counts the removals.
- \`while (c.locals.length > 0 &&\` guards against an empty array...
- \`last().depth > c.scopeDepth) {\` ...and stops at the first entry that belongs to an outer block.
- \`c.locals.pop(); pops++;\` forgets the local and counts one \`pop\` to emit.
- \`return pops;\`

Slot 0 has depth 0, so it is never removed (\`0 > 0\` is false).

**Common wrong attempts.**

- Forgetting \`c.scopeDepth--\` and comparing with \`>=\` removes the right entries, but the compiler still thinks it is inside the block, so the next \`let\` gets the wrong depth and the next brace removes too much.`,
    wrong: [
      {
        code: `${ES_HEAD}
  const last = () => c.locals.at(-1);
  let pops = 0;
  while (c.locals.length > 0 &&
         last().depth >= c.scopeDepth) {
    c.locals.pop();
    pops++;
  }
  return pops;
}`,
        why: 'The right locals are removed, but `scopeDepth` is never lowered, so the compiler still thinks it is inside the block. Decrement first, then compare with `>`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'The `locals` array is `["", "a", "b"]` (with depths 0, 1, 2). Which slot does `b` live in at run time?',
    options: [
      { t: 'Slot 1', why: 'Slot 1 is `a`; the index in the array is the slot.' },
      { t: 'It depends on the run', why: 'The slot is fixed by the compiler, before anything runs.' },
      { t: 'Slot 2', correct: true, why: 'A local’s index in the array is its stack slot.' },
      { t: 'Slot 0', why: 'Slot 0 holds the running function.' },
    ],
  },
  {
    q: 'What does `beginScope` do?',
    options: [
      { t: 'Adds 1 to `scopeDepth`, and nothing else', correct: true, why: 'Entering a block is free at run time.' },
      { t: 'Emits an instruction that reserves slots', why: 'Slots are filled by the initialisers’ values; nothing is reserved.' },
      { t: 'Creates a new environment', why: 'That was the tree-walker. The VM has no environments for locals.' },
      { t: 'Clears the `locals` array', why: 'The outer locals are still in scope inside the block.' },
    ],
  },
  {
    q: 'In `{ let x = 1; { let x = 2; print x; } }`, what does `print x` compile to?',
    options: [
      { t: '`load.local 1`', why: 'Slot 1 is the outer `x`; the search from the end finds the inner one first.' },
      { t: '`load.global x`', why: 'Both `x`s are locals.' },
      { t: 'A compile error: `x` is declared twice', why: 'They are in different blocks; only two in the same block is an error.' },
      { t: '`load.local 2`', correct: true, why: 'The inner `x` is the last entry in `locals`, at index 2.' },
    ],
  },
  {
    q: 'Why is `let a = a + 1;` inside a block (with an outer `a`) a compile error?',
    options: [
      { t: 'Locals cannot have the same name as an outer variable', why: 'They can: that is shadowing.' },
      { t: 'The new `a` is already in `locals` with depth -1, and the search finds it first', correct: true, why: 'Its initialiser cannot read it, because its slot holds nothing yet.' },
      { t: 'The VM would read an empty slot and crash', why: 'The compiler stops it before anything runs.' },
      { t: 'It is not an error: `a` means the outer variable', why: 'That might seem friendlier, but Drip reports `cannot read \'a\' in its own initialiser`.' },
    ],
  },
  {
    q: 'Which of these is a compile error?',
    options: [
      { t: '`let a = 1; let a = 2;` at the top level', why: 'At the top level a second `let` replaces the global.' },
      { t: '`{ let a = 1; { let a = 2; } }`', why: 'The second `a` is in an inner block: shadowing.' },
      { t: '`{ let a = 1; let b = a; }`', why: 'This is fine: `b`’s initialiser reads the ready `a`.' },
      { t: '`{ let a = 1; let a = 2; }`', correct: true, why: 'Two in the same block: `\'a\' is already declared in this scope`.' },
    ],
  },
];
