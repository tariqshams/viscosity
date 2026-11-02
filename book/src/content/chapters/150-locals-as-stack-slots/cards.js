// Chapter 150 cards. Keys are stable ids: never rename them.

export const prompts = {
  'why-stack': {
    q: 'Why can local variables live on the VM’s value stack?',
    a: 'Blocks nest, so locals are created and destroyed in last-in, first-out order: the order of a stack.',
  },
  'no-define': {
    q: 'Why does `let a = 1;` inside a block emit no instruction of its own?',
    a: 'The initialiser leaves 1 on top of the stack, and that slot becomes `a`: the value is already where the variable lives.',
  },
  'slot-what': {
    q: 'What is a **stack slot**?',
    a: 'A fixed position in the VM’s stack, counted from where the current function’s slots begin, holding one local variable.',
  },
  'load-local-cost': {
    q: 'What does `load.local 2` cost the VM at run time?',
    a: 'One addition (`frame.slots + 2`) and an array read, then a push: no name and no hashing.',
  },
  'store-keeps': {
    q: 'Why does `store.local` leave the value on the stack instead of popping it?',
    a: 'In Drip an assignment is an expression whose value is the assigned value; when it is a statement on its own, the compiler adds a `pop`.',
  },
  'slot-zero': {
    q: 'Why does the first local in the script get slot 1, not slot 0?',
    a: 'Slot 0 already holds the running function (the script itself, at the top level).',
  },
  'block-end-pops': {
    q: 'A block declared three locals. What does the compiler emit at its closing brace?',
    a: 'Three `pop`s, one per local, which free their slots at run time.',
  },
  'after-block': {
    q: 'What does `{ let a = 1; } print a;` do in Drip?',
    a: 'Outside the block `a` is not a local, so it compiles to `load.global`, and the program stops with `undefined variable \'a\'`.',
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
};

const HEAD = `// stack: the VM's value stack
// base: where this frame's slots begin
// ins: ['load.local', i],
//      ['store.local', i] or ['pop']
function step(stack, base, ins) {`;

const OK = `
  const [op, i] = ins;
  if (op === 'load.local') {
    stack.push(stack[base + i]);
  } else if (op === 'store.local') {
    stack[base + i] = stack.at(-1);
  } else if (op === 'pop') {
    stack.pop();
  }
}`;

export const exercises = {
  'slot-step': {
    title: 'Three instructions on a stack',
    prompt: `Write \`step(stack, base, ins)\`, which runs one instruction on the array \`stack\` (its last element is the top). \`base\` is where the current function's slots begin. \`ins\` is one of:

- \`['load.local', i]\`: push a copy of slot \`i\`;
- \`['store.local', i]\`: write the top value into slot \`i\`, **leaving it on the stack**;
- \`['pop']\`: remove the top value.

Slot \`i\` is the stack index \`base + i\`. \`step\` changes \`stack\` in place and returns nothing.`,
    starter: `${HEAD}
  // your code here
}`,
    solution: `${HEAD}${OK}`,
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
        code: `${HEAD}
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
        code: `${HEAD}
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
  swap: {
    optional: true,
    lang: 'drip-vm',
    title: 'Swap two locals',
    prompt:
      'Inside the block, swap the values of `a` and `b`, so the program prints `2` and then `1`. Use a third local to hold one value while you move the other.',
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
    q: `Which slot does \`b\` get?
\`\`\`
{
  let a = 1;
  let b = 2;
}
\`\`\``,
    options: [
      { t: 'Slot 1', why: 'Slot 1 goes to `a`, the first local; slot 0 already holds the running script.' },
      { t: 'Slot 2', correct: true, why: 'Slot 0 holds the script, `a`’s initialiser lands in slot 1, so `b`’s lands in slot 2.' },
      { t: 'Slot 0', why: 'Slot 0 holds the running function, here the script itself.' },
      { t: 'No slot: it is a global', why: 'It is declared inside a block, so it is a local.' },
    ],
  },
  {
    q: 'What does the compiler emit at the closing brace of a block that declared two locals?',
    options: [
      { t: 'Nothing: the VM forgets the locals by itself', why: 'The values are on the stack, and something has to remove them.' },
      { t: 'Two `pop`s', correct: true, why: 'One `pop` per local, freeing each slot at run time.' },
      { t: 'One `pop`, because a block is one scope', why: 'Each local has its own slot, so each needs its own `pop`.' },
      { t: 'An `end.scope` instruction', why: 'There is no such instruction: scopes exist only in the compiler.' },
    ],
  },
  {
    q: 'Why is `store.local` followed by a `pop` when you write `a = 5;` on its own?',
    options: [
      { t: '`store.local` leaves the value on the stack, and the statement does not need it', correct: true, why: 'An assignment is an expression with a value; a statement throws that value away.' },
      { t: 'The `pop` frees `a`’s slot', why: 'That only happens at the end of `a`’s block.' },
      { t: 'The VM needs it to finish the instruction', why: '`store.local` is complete on its own; the `pop` is a separate instruction.' },
      { t: 'It is a mistake in the compiler', why: 'It is on purpose: `print a = 5;` style uses need the value.' },
    ],
  },
  {
    q: `What happens here?
\`\`\`
{
  let a = 1;
}
print a;
\`\`\``,
    options: [
      { t: 'It prints 1', why: '`a` died at the closing brace.' },
      { t: 'A compile error', why: 'The compiler does not complain: it treats `a` as a global.' },
      { t: 'A runtime error: `undefined variable \'a\'`', correct: true, why: 'The name compiles to `load.global`, and there is no global called `a`.' },
      { t: 'It prints `none`', why: 'Nothing gives `a` the value none; the global lookup fails.' },
    ],
  },
  {
    q: `Which slot does \`c\` get?
\`\`\`
{
  let a = 1;
  { let b = 2; }
  let c = 3;
}
\`\`\``,
    options: [
      { t: 'Slot 3', why: 'b’s slot was freed at its block’s closing brace, so it can be used again.' },
      { t: 'Slot 1', why: 'Slot 1 is still `a`, which is alive.' },
      { t: 'Slot 2, the one b used', correct: true, why: 'b has gone, so c’s initialiser lands in the next free slot, 2.' },
      { t: 'It depends on the run', why: 'Slots are fixed by the compiler, the same on every run.' },
    ],
  },
];
