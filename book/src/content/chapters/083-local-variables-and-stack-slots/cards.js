// Chapter 83 cards. Keys are stable ids: never rename them.

export const prompts = {
  'why-stack': {
    q: 'Why can local variables live on the VM’s value stack?',
    a: 'Blocks nest, so locals are created and destroyed in last-in, first-out order: the order of a stack.',
  },
  'no-define': {
    q: 'Why does `let a = 1;` inside a block emit no "define" instruction?',
    a: 'The initializer leaves 1 on top of the stack, and that slot simply becomes `a`.',
  },
  'slot-what': {
    q: 'What is a **stack slot**?',
    a: 'A fixed position in the VM’s stack, counted from where the current function’s slots begin, holding one local variable.',
  },
  'begin-scope-cost': {
    q: 'What does `beginScope` emit?',
    a: 'Nothing. It only adds 1 to the compiler’s `scopeDepth`.',
  },
  'end-scope-pops': {
    q: 'A block declared three locals. What does `endScope` emit at its `}`?',
    a: 'Three `POP`s (one per local deeper than the new scope depth), and it removes them from the `locals` array.',
  },
  'slot-zero': {
    q: 'Why does the first local of a block get slot 1, not slot 0?',
    a: 'The compiler reserves slot 0 for the function being run (or `this` in a method).',
  },
  'depth-zero': {
    q: 'At `scopeDepth` 0, what does `let x = 1;` make?',
    a: 'A global, with `DEFINE_GLOBAL`. Only declarations inside a block (or function) become locals.',
  },
  'search-backwards': {
    q: 'Why does `resolveLocal` search the `locals` array from the end?',
    a: 'The innermost declaration of a name was added last, so searching backwards finds it first: that is shadowing.',
  },
  'depth-minus-one': {
    q: 'What does a depth of `-1` mean for an entry in `locals`?',
    a: 'Declared but not initialized yet: its initializer is still being compiled. Reading it is a compile error.',
  },
  'get-local-cost': {
    q: 'What does `GET_LOCAL 2` cost the VM at run time?',
    a: 'One addition (`frame.slots + 2`) and an array read: no name, no hashing.',
  },
};

export const examples = {
  'own-init': {
    title: 'A local in its own initializer',
    lang: 'drip-vm',
    expectError: true,
    code: `let a = "outer";
{
  let a = a;
  print a;
}`,
  },
};

const R_HEAD = `// locals: [{ name, depth }, ...]
// Return the slot of name, or -1.
function resolve(locals, name) {`;

const ERR = `const SELF = "Can't read local " +
  'variable in its own initializer.';
`;

const ES_HEAD = `// c = { locals: [{ name, depth }],
//       scopeDepth: number }
// Leave one block. Return how many
// POPs the compiler should emit.
function endScope(c) {`;

export const exercises = {
  resolve: {
    title: 'resolveLocal',
    prompt: `Write \`resolve(locals, name)\`, the compiler's \`resolveLocal\`. \`locals\` is the compile-time array: each entry has a \`name\` (a string) and a \`depth\`. Return the **index** of the matching local, which is its stack slot, or \`-1\` if the name isn't a local. When a name appears more than once, the innermost declaration wins. If the local found has depth \`-1\`, \`throw new Error(SELF)\`.`,
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
        throw new Error(SELF);
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
test('own initializer', () => {
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
      'Loop with `i` from `locals.length - 1` down to `0`.',
      'At the first entry whose `name` matches, stop: check its `depth` for `-1`, then return `i`.',
      'If the loop ends with no match, return `-1`.',
    ],
    walkthrough: `This is \`resolveLocal\` from \`compiler.ts\`, with tokens replaced by strings.

- **Backwards**, because the locals array is in declaration order and an inner \`a\` is declared after an outer one. The first match from the end is the one in the innermost scope: shadowing, with no scope chain at all.
- **The index is the answer.** The compiler built \`locals\` so that entry \`i\` is exactly what will sit in stack slot \`i\` at run time. The compiler then emits \`GET_LOCAL i\`.
- **Depth \`-1\`** is only checked on the entry that matched. In the last test \`b\` is unready, but nobody asked for \`b\`, so \`a\` resolves normally. In the own-initializer test the unready inner \`a\` is found *first*, and it must be an error: reading the outer \`a\` instead would silently mean something the programmer probably didn't intend.
- **\`-1\`** tells the caller to try other options: an upvalue (chapter 86), and finally a global.

\`\`\`js
for (let i = locals.length - 1;
     i >= 0; i--) {
  if (locals[i].name === name) {
    if (locals[i].depth === -1) {
      throw new Error(SELF);
    }
    return i;
  }
}
return -1;
\`\`\``,
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
        why: 'Skipping the unready local makes `let a = a;` read the *outer* `a`. That looks helpful, but it hides a likely mistake. The innermost match must be reported as an error.',
      },
    ],
  },
  'end-scope': {
    optional: true,
    title: 'endScope',
    prompt: `Write \`endScope(c)\`. \`c.locals\` is the compile-time array (entries have a \`name\` and a \`depth\`), and \`c.scopeDepth\` is the current depth. Leave one block: lower \`scopeDepth\` by 1, then remove from the end of \`locals\` every entry whose depth is greater than the new \`scopeDepth\`. Return how many you removed: that's how many \`POP\`s the compiler emits.`,
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
      'Decrement `c.scopeDepth` first: the comparison is against the depth you are returning to.',
      'Loop while the last entry exists and its depth is greater than `c.scopeDepth`, popping and counting.',
    ],
    walkthrough: `The order matters. After \`c.scopeDepth--\`, everything declared *inside* the block we are leaving has a depth greater than the new value, and everything outside has a depth less than or equal to it. Because locals are in declaration order, the ones to remove are all at the end, so popping from the end until the condition fails removes exactly the block's locals.

Slot 0 has depth 0, so it is never removed: \`0 > 0\` is false. In the real compiler each removal also emits a \`POP\` (or \`CLOSE_UPVALUE\`), which at run time frees the matching stack slot.`,
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
        why: 'The right locals are removed, but `scopeDepth` is never lowered. The compiler still thinks it is inside the block, so the next `let` gets the wrong depth and the next `}` removes too much. Decrement first, then compare with `>`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: `Which slot does \`b\` get?
\`\`\`
{
  let a = 1;
  let b = 2;
}
\`\`\``,
    options: [
      { t: 'Slot 1', why: 'Slot 1 goes to `a`, the first local. Slot 0 is reserved.' },
      { t: 'Slot 2', correct: true, why: 'Slot 0 is reserved for the function, `a` is slot 1, so `b` is slot 2.' },
      { t: 'Slot 0', why: 'Slot 0 holds the running function.' },
      { t: 'No slot: it is a global', why: 'It’s inside a block, so it’s a local.' },
    ],
  },
  {
    q: 'What does the compiler emit when it reaches the `}` of a block that declared two locals?',
    options: [
      { t: 'Nothing: the VM forgets the locals by itself', why: 'The values are on the stack and must be removed.' },
      { t: 'One `POP`, because a block is one scope', why: 'One `POP` per local.' },
      { t: 'Two `POP`s', correct: true, why: '`endScope` emits a `POP` for each local deeper than the new scope depth.' },
      { t: 'An `END_SCOPE` instruction', why: 'No such instruction exists. Scope is a compile-time idea.' },
    ],
  },
  {
    q: 'In `{ let x = 1; { let x = 2; print x; } }`, what does `print x` compile to?',
    options: [
      { t: '`GET_GLOBAL x`', why: 'Both `x`s are locals.' },
      { t: '`GET_LOCAL 1`', why: 'Slot 1 is the outer `x`. Searching from the end finds the inner one first.' },
      { t: 'A compile error: `x` is declared twice', why: 'They are in different blocks; only two in the same block is an error.' },
      { t: '`GET_LOCAL 2`', correct: true, why: 'The inner `x` is the last entry in `locals`, at index 2.' },
    ],
  },
  {
    q: 'Why is `let a = a;` inside a block a compile error?',
    options: [
      { t: 'The new `a` is already in `locals` with depth -1, and `resolveLocal` finds it first', correct: true, why: 'Its initializer can’t read it, because it holds nothing yet.' },
      { t: 'Locals can’t have the same name as a global', why: 'They can: that is shadowing.' },
      { t: 'The VM would read an empty slot and crash', why: 'The compiler stops it before anything runs.' },
      { t: 'It isn’t: `a` is the outer variable', why: 'That might seem friendlier, but Drip reports it as an error.' },
    ],
  },
  {
    q: 'Which is true of `GET_LOCAL` compared with `GET_GLOBAL`?',
    options: [
      { t: 'Both hash the name, but `GET_LOCAL` uses a smaller table', why: 'Locals have no table and no name at run time.' },
      { t: '`GET_LOCAL`’s operand is a slot number; `GET_GLOBAL`’s is a constant holding a name', correct: true, why: 'Locals are resolved to slots at compile time; globals are looked up by name at run time.' },
      { t: '`GET_LOCAL` pops the value; `GET_GLOBAL` copies it', why: 'Both push a copy and leave the variable alone.' },
      { t: 'They are the same instruction with different flags', why: 'They are separate opcodes doing quite different work.' },
    ],
  },
  {
    q: 'What does `beginScope` do?',
    options: [
      { t: 'Emits an instruction that reserves slots', why: 'Slots are taken by the initializers’ values; nothing is reserved.' },
      { t: 'Creates a new environment', why: 'That was the tree-walker. The VM has no environments for locals.' },
      { t: 'Clears the `locals` array', why: 'The outer locals are still in scope.' },
      { t: 'Adds 1 to the compiler’s `scopeDepth`, and nothing else', correct: true, why: 'Entering a block is free at run time.' },
    ],
  },
];
