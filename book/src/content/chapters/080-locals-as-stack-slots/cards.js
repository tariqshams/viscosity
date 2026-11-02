// Chapter 80 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'why-stack': {
    q: 'Why can a language with block-scoped locals keep them on the VM’s value stack?',
    a: 'Blocks nest, so locals are created and destroyed in last-in, first-out order: the order of a stack.',
  },
  'no-define': {
    q: 'In a stack-based VM that keeps locals in stack slots, why does `let a = 1;` inside a block need no instruction of its own?',
    a: 'The initialiser leaves 1 on top of the stack, and that slot becomes `a`: the value is already where the variable lives.',
  },
  'store-keeps': {
    q: 'In the companion Drip VM, why does `store.local` leave the value on the stack instead of popping it?',
    a: 'In Drip an assignment is an expression whose value is the assigned value; when it is a statement on its own, the compiler adds a `pop`.',
  },
  'after-block': {
    q: 'What does `{ let a = 1; } print a;` do in Drip?',
    a: 'Outside the block `a` is not a local, so it compiles to `load.global`, and the program stops with `undefined variable \'a\'`.',
  },
  'index-is-slot': {
    q: 'In a single-pass compiler that keeps locals in a `locals` array in declaration order, what does a local’s index tell you?',
    a: 'Its stack slot: entry `i` is what will sit in slot `i` at run time.',
  },
  'end-scope-pops': {
    q: 'In the companion Drip compiler, a block declared three locals, none captured. What does `endScope` do at its closing brace?',
    a: 'It lowers `scopeDepth`, then emits three `pop`s (one per local deeper than the new depth) and removes those entries from `locals`.',
  },
  'search-backwards': {
    q: 'Why does a compiler resolving locals search its `locals` array from the end?',
    a: 'The innermost declaration of a name was added last, so searching backwards finds it first: that is shadowing.',
  },
  'depth-minus-one': {
    q: 'In the companion Drip compiler, what does a depth of `-1` mean for an entry in `locals`?',
    a: 'Declared but not ready: its initialiser is still being compiled. Finding it in a search is the error `cannot read \'x\' in its own initialiser`.',
  },
};

export const examples = {
  slots: {
    title: 'Locals in slots',
    lang: 'drip-vm',
    code: `{
  let x = 2;
  let vx = 3;
  x += vx * 0.5;
  print x;
  {
    let y = x * 2;
    print y;
  }
  let z = 1;
  print z;
}`,
  },
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

export const exercises = {
  resolve: {
    title: 'resolveLocal',
    prompt: 'Write `resolve(locals, name)`, the compiler\'s `resolveLocal`. `locals` is the compile-time array: each entry has a `name` (a string) and a `depth`. Return the **index** of the matching local, which is its stack slot, or `-1` if the name isn\'t a local. When a name appears more than once, the innermost declaration wins. If the local found has depth `-1`, `throw new Error(own(name))`.',
    starter: `const own = (n) => "cannot read '" +
  n + "' in its own initialiser";

// locals: [{ name, depth }, ...]
// Return the slot of name, or -1.
function resolve(locals, name) {
  // your code here
}`,
    solution: `const own = (n) => "cannot read '" +
  n + "' in its own initialiser";

// locals: [{ name, depth }, ...]
// Return the slot of name, or -1.
function resolve(locals, name) {
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
        code: `const own = (n) => "cannot read '" +
  n + "' in its own initialiser";

// locals: [{ name, depth }, ...]
// Return the slot of name, or -1.
function resolve(locals, name) {
  return locals.findIndex(
    (l) => l.name === name);
}`,
        why: '`findIndex` searches from the *front*, so it finds the outermost `a` and breaks shadowing. It also never checks for depth `-1`.',
      },
      {
        code: `const own = (n) => "cannot read '" +
  n + "' in its own initialiser";

// locals: [{ name, depth }, ...]
// Return the slot of name, or -1.
function resolve(locals, name) {
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
  'slot-step': {
    optional: true,
    title: 'Three instructions on a stack',
    prompt: `Write \`step(stack, base, ins)\`, which runs one instruction on the array \`stack\` (its last element is the top). \`base\` is where the current function's slots begin. \`ins\` is one of:

- \`['load.local', i]\`: push a copy of slot \`i\`;
- \`['store.local', i]\`: write the top value into slot \`i\`, **leaving it on the stack**;
- \`['pop']\`: remove the top value.

Slot \`i\` is the stack index \`base + i\`. \`step\` changes \`stack\` in place and returns nothing.`,
    starter: `// stack: the VM's value stack
// base: where this frame's slots begin
// ins: ['load.local', i],
//      ['store.local', i] or ['pop']
function step(stack, base, ins) {
  // your code here
}`,
    solution: `// stack: the VM's value stack
// base: where this frame's slots begin
// ins: ['load.local', i],
//      ['store.local', i] or ['pop']
function step(stack, base, ins) {
  const [op, i] = ins;
  if (op === 'load.local') {
    stack.push(stack[base + i]);
  } else if (op === 'store.local') {
    stack[base + i] = stack.at(-1);
  } else if (op === 'pop') {
    stack.pop();
  }
}`,
    tests: `test('load.local pushes a copy', () => {
  const s = ['script', 1, 2];
  step(s, 0, ['load.local', 1]);
  expect(s).toEqual(
    ['script', 1, 2, 1]);
});
test('slots count from base', () => {
  const s = ['script', 'f', 7, 8];
  step(s, 1, ['load.local', 2]);
  expect(s.at(-1)).toBe(8);
});
test('store.local keeps the value', () => {
  const s = ['script', 1, 5];
  step(s, 0, ['store.local', 1]);
  expect(s).toEqual(['script', 5, 5]);
});
test('pop drops the top', () => {
  const s = ['script', 1, 9];
  step(s, 0, ['pop']);
  expect(s).toEqual(['script', 1]);
});
test('a = 5; then read a', () => {
  const s = ['script', 1, 5];
  step(s, 0, ['store.local', 1]);
  step(s, 0, ['pop']);
  step(s, 0, ['load.local', 1]);
  expect(s).toEqual(['script', 5, 5]);
});`,
    hints: [
      'Start by pulling the instruction apart: `const [op, i] = ins;`. Then handle each of the three names with an `if`.',
      'Every slot access is at index `base + i`, never at plain `i`. For `load.local`, push `stack[base + i]`.',
      'For `store.local`, read the top without removing it, `stack.at(-1)`, and assign it to `stack[base + i]`. For `pop`, call `stack.pop()`.',
    ],
    walkthrough: `**How to think about it.** These are the three instructions that make locals work, and each one is a single line once you know which stack index a slot is. The chapter's formal box says it: slot \`i\` of the current function is at \`base + i\`. So the whole exercise is "work out \`base + i\`, then read, write or pop".

**The solution, line by line.**

- \`const [op, i] = ins;\` splits the instruction into its name and its operand. For \`['pop']\` the operand is \`undefined\`, which is fine, because \`pop\` never uses it.
- \`if (op === 'load.local') {\` handles the read.
- \`stack.push(stack[base + i]);\` reads the value in slot \`i\` and pushes a *copy* on top. The slot itself keeps its value, which is what lets \`print a\` and \`a + 1\` read \`a\` without destroying it.
- \`} else if (op === 'store.local') {\` handles the write.
- \`stack[base + i] = stack.at(-1);\` copies the top value into the slot. \`stack.at(-1)\` is the last element, read without removing it, exactly like the VM's \`peek(0)\`. The value stays on top because an assignment in Drip is an expression with a value.
- \`} else if (op === 'pop') {\` and \`stack.pop();\` drop the top value, which is how a block's closing brace frees a local's slot and how a statement throws away a value nobody wants.

The last test runs \`a = 5;\` and then \`load.local 1\`, the same three instructions as offsets 16, 18 and 19 of the chapter's step-through.

**Common wrong attempts.**

- Using \`stack[i]\` instead of \`stack[base + i]\` works for the script, whose base is 0, and breaks as soon as a function's slots start further up the stack: the second test reads the wrong value.
- Writing \`stack[base + i] = stack.pop();\` pops the value as it stores it. The slot gets the right value, but the stack is one value short, and the \`pop\` the compiler emits after an assignment statement would then throw away something else.`,
    wrong: [
      {
        code: `// stack: the VM's value stack
// base: where this frame's slots begin
// ins: ['load.local', i],
//      ['store.local', i] or ['pop']
function step(stack, base, ins) {
  const [op, i] = ins;
  if (op === 'load.local') {
    stack.push(stack[i]);
  } else if (op === 'store.local') {
    stack[i] = stack.at(-1);
  } else if (op === 'pop') {
    stack.pop();
  }
}`,
        why: 'This ignores `base`, so it only works for the script, whose slots start at 0. In a function, slot 2 is at `base + 2`.',
      },
      {
        code: `// stack: the VM's value stack
// base: where this frame's slots begin
// ins: ['load.local', i],
//      ['store.local', i] or ['pop']
function step(stack, base, ins) {
  const [op, i] = ins;
  if (op === 'load.local') {
    stack.push(stack[base + i]);
  } else if (op === 'store.local') {
    stack[base + i] = stack.pop();
  } else if (op === 'pop') {
    stack.pop();
  }
}`,
        why: '`store.local` must leave the value on the stack (an assignment has a value). Popping it here leaves the stack one value short.',
      },
    ],
  },
  'end-scope': {
    optional: true,
    title: 'endScope',
    prompt: 'Write `endScope(c)`. `c.locals` is the compile-time array (entries have a `name` and a `depth`), and `c.scopeDepth` is the current depth. Leave one block: lower `scopeDepth` by 1, then remove from the end of `locals` every entry whose depth is greater than the new `scopeDepth`. Return how many you removed: that is how many `pop`s the compiler emits.',
    starter: `// c = { locals: [{ name, depth }],
//       scopeDepth: number }
// Leave one block. Return how many
// pops the compiler should emit.
function endScope(c) {
  // your code here
}`,
    solution: `// c = { locals: [{ name, depth }],
//       scopeDepth: number }
// Leave one block. Return how many
// pops the compiler should emit.
function endScope(c) {
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
        code: `// c = { locals: [{ name, depth }],
//       scopeDepth: number }
// Leave one block. Return how many
// pops the compiler should emit.
function endScope(c) {
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
  swap: {
    optional: true,
    lang: 'drip-vm',
    title: 'Swap two locals',
    prompt: 'Inside the block, swap the values of `a` and `b`, so the program prints `2` and then `1`. Use a third local to hold one value while you move the other.',
    starter: `{
  let a = 1;
  let b = 2;
  # swap a and b here
  print a;
  print b;
}`,
    solution: `{
  let a = 1;
  let b = 2;
  let t = a;
  a = b;
  b = t;
  print a;
  print b;
}`,
    tests: `2
1`,
    hints: [
      'If you write `a = b;` first, the old value of `a` is lost. Save it somewhere before you overwrite it.',
      'Declare `let t = a;` (it gets slot 3), then `a = b;`, then `b = t;`.',
    ],
    walkthrough: `**How to think about it.** Each local is one slot, and a slot holds one value; writing a new value into a slot destroys the old one. So to swap, one value has to be parked in a third slot first.

**The solution, line by line.**

- \`let a = 1;\` and \`let b = 2;\` put 1 in slot 1 and 2 in slot 2.
- \`let t = a;\` compiles to \`load.local 1\`: the copy of \`a\` lands in slot 3, which becomes \`t\`, with no other instruction.
- \`a = b;\` is \`load.local 2\`, \`store.local 1\`, \`pop\`: slot 1 now holds 2.
- \`b = t;\` is \`load.local 3\`, \`store.local 2\`, \`pop\`: slot 2 now holds 1.
- The two \`print\`s read slots 1 and 2 and print \`2\` and \`1\`; at the closing brace the compiler emits three \`pop\`s, one for each of \`a\`, \`b\` and \`t\`.

**Common wrong attempts.**

- \`a = b; b = a;\` prints \`2\` and \`2\`: by the time \`b = a\` runs, slot 1 already holds 2, and the 1 is gone for good.`,
    wrong: [
      {
        code: `{
  let a = 1;
  let b = 2;
  a = b;
  b = a;
  print a;
  print b;
}`,
        why: 'After `a = b;` the old value of `a` has been overwritten, so `b = a;` copies 2 back into `b`, and the program prints 2 twice.',
      },
    ],
  },
};

export const quiz = [
  {
    q: `The companion Drip compiler keeps the running function in slot 0. Which slot does \`b\` get?
\`\`\`
{
  let a = 1;
  let b = 2;
}
\`\`\``,
    options: [
      {
        t: 'Slot 1',
        why: 'Slot 1 goes to `a`, the first local; slot 0 already holds the running script.',
      },
      {
        t: 'Slot 2',
        correct: true,
        why: 'Slot 0 holds the script, `a`’s initialiser lands in slot 1, so `b`’s lands in slot 2.',
      },
      {
        t: 'Slot 0',
        why: 'Slot 0 holds the running function, here the script itself.',
      },
      {
        t: 'No slot: it is a global',
        why: 'It is declared inside a block, so it is a local.',
      },
    ],
  },
  {
    q: 'In the companion Drip compiler, what is emitted at the closing brace of a block that declared two locals, neither captured?',
    options: [
      {
        t: 'Nothing: the VM forgets the locals by itself',
        why: 'The values are on the stack, and something has to remove them.',
      },
      {
        t: 'Two `pop`s',
        correct: true,
        why: 'One `pop` per local, freeing each slot at run time.',
      },
      {
        t: 'One `pop`, because a block is one scope',
        why: 'Each local has its own slot, so each needs its own `pop`.',
      },
      {
        t: 'An `end.scope` instruction',
        why: 'There is no such instruction: scopes exist only in the compiler.',
      },
    ],
  },
  {
    q: `The companion Drip compiler keeps the running function in slot 0. Which slot does \`c\` get?
\`\`\`
{
  let a = 1;
  { let b = 2; }
  let c = 3;
}
\`\`\``,
    options: [
      {
        t: 'Slot 3',
        why: 'b’s slot was freed at its block’s closing brace, so it can be used again.',
      },
      {
        t: 'Slot 1',
        why: 'Slot 1 is still `a`, which is alive.',
      },
      {
        t: 'Slot 2, the one b used',
        correct: true,
        why: 'b has gone, so c’s initialiser lands in the next free slot, 2.',
      },
      {
        t: 'It depends on the run',
        why: 'Slots are fixed by the compiler, the same on every run.',
      },
    ],
  },
  {
    q: 'The companion Drip compiler keeps the running function in slot 0. In `{ let x = 1; { let x = 2; print x; } }`, what does `print x` compile to?',
    options: [
      {
        t: '`load.local 1`',
        why: 'Slot 1 is the outer `x`; the search from the end finds the inner one first.',
      },
      {
        t: '`load.global x`',
        why: 'Both `x`s are locals.',
      },
      {
        t: 'A compile error: `x` is declared twice',
        why: 'They are in different blocks; only two in the same block is an error.',
      },
      {
        t: '`load.local 2`',
        correct: true,
        why: 'The inner `x` is the last entry in `locals`, at index 2.',
      },
    ],
  },
  {
    q: 'In Drip, why is `let a = a + 1;` inside a block (with an outer `a`) a compile error?',
    options: [
      {
        t: 'Locals cannot have the same name as an outer variable',
        why: 'They can: that is shadowing.',
      },
      {
        t: 'The new `a` is already in `locals` with depth -1, and the search finds it first',
        correct: true,
        why: 'Its initialiser cannot read it, because its slot holds nothing yet.',
      },
      {
        t: 'The VM would read an empty slot and crash',
        why: 'The compiler stops it before anything runs.',
      },
      {
        t: 'It is not an error: `a` means the outer variable',
        why: 'That might seem friendlier, but Drip reports `cannot read \'a\' in its own initialiser`.',
      },
    ],
  },
];
