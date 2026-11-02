// Chapter 154-b cards (split from 148). Keys are stable ids.

export const prompts = {
  'no-copy': {
    q: 'Why does a VM call not need to copy its arguments anywhere?',
    a: 'The caller pushed the callee and then the arguments, which is exactly the layout of the callee’s slots 0, 1, 2...; the new frame’s window simply starts at the callee.',
  },
  'fp-what': {
    q: 'What is a frame’s **frame pointer**?',
    a: 'The stack index of its slot 0 (`slots` in Drip’s VM); slot `i` of that call is at `stack[slots + i]`.',
  },
  'fp-formula': {
    q: 'At `call n`, what is the new frame’s `slots`?',
    a: '`sp - n - 1`: the stack top, minus the arguments, minus one more for the callee.',
  },
  'same-bytes': {
    q: 'How can one `load.local 1` in `fib` read a different `n` in every call?',
    a: 'Each call reads it through its own frame pointer: stack index `slots + 1` is different for each frame.',
  },
  'return-sp': {
    q: 'How does `return` remove the callee, its arguments and its locals?',
    a: 'It sets `sp` back to the frame’s `slots` in one assignment, then pushes the result there, where the callee was.',
  },
  'slot-zero-method': {
    q: 'What is in slot 0 when a method runs?',
    a: 'The receiver, which the compiler calls `self`; the VM puts it there in place of the callee before pushing the frame.',
  },
  'stack-size': {
    q: 'How big is the VM’s value stack, and why that size?',
    a: '`FRAMES_MAX * 256`: 256 frames of at most 256 slots each, the limits set by the depth check and the one-byte slot operands.',
  },
  'bench-honest': {
    q: 'In this book’s benchmark run, did the VM make every program faster than the tree-walker?',
    a: 'No: call-heavy programs gained up to about 1.3 times, while allocation-heavy ones (instantiation, trees) were slower.',
  },
};

export const examples = {
  windows: {
    title: 'Windows onto one stack',
    lang: 'drip-vm',
    code: `fn fact(n) {
  if n <= 1 { return 1; }
  return n * fact(n - 1);
}
print fact(5);
class P {
  init(x) { self.x = x; }
}
print new P(4).x;`,
  },
};

const HEAD = `// vm = { stack: [...], frames: [...] }
// callee: { kind: 'fn', arity }
//   or { kind: 'bound', receiver,
//        method }
// Push a frame for the call.
function callValue(vm, callee, argc) {`;
const LOCAL = `
// Read slot i of the newest frame.
function local(vm, i) {`;

const CALL_OK = `
  const slots =
    vm.stack.length - argc - 1;
  let fn = callee;
  if (callee.kind === 'bound') {
    vm.stack[slots] = callee.receiver;
    fn = callee.method;
  }
  vm.frames.push({ fn, ip: 0, slots });
}`;
const LOCAL_OK = `
  const f = vm.frames.at(-1);
  return vm.stack[f.slots + i];
}`;
const TODO = `
  // your code here
}`;

export const exercises = {
  window: {
    title: 'A window for every call',
    prompt: `Write two pieces of the VM's frame-pointer work. The callee and \`argc\` arguments are on top of \`vm.stack\` (its \`length\` is \`sp\`).

- \`callValue(vm, callee, argc)\` pushes \`{ fn, ip: 0, slots }\` onto \`vm.frames\`, where \`slots\` is the callee's stack index. If the callee is a bound method (\`kind: 'bound'\`), first put its \`receiver\` into slot 0 (in place of the callee), and use its \`method\` as \`fn\`; otherwise \`fn\` is the callee itself.
- \`local(vm, i)\` returns the value of slot \`i\` of the newest frame.`,
    starter: `${HEAD}${TODO}
${LOCAL}${TODO}`,
    solution: `${HEAD}${CALL_OK}
${LOCAL}${LOCAL_OK}`,
    tests: `const f = { kind: 'fn', arity: 1 };
const start = () => ({
  stack: ['script'],
  frames: [{ fn: null, ip: 0,
    slots: 0 }],
});
test('the window starts at the callee', () => {
  const vm = start();
  vm.stack.push(f, 7);
  callValue(vm, f, 1);
  expect(vm.frames[1].slots).toBe(1);
  expect(local(vm, 0)).toBe(f);
  expect(local(vm, 1)).toBe(7);
});
test('a call inside a call', () => {
  const vm = start();
  vm.stack.push(f, 7);
  callValue(vm, f, 1);
  vm.stack.push(f, 9);
  callValue(vm, f, 1);
  expect(vm.frames[2].slots).toBe(3);
  expect(local(vm, 1)).toBe(9);
});
test('a bound method gets self', () => {
  const vm = start();
  const me = { name: 'p' };
  const b = { kind: 'bound',
    receiver: me, method: f };
  vm.stack.push(b, 5);
  callValue(vm, b, 1);
  expect(local(vm, 0)).toBe(me);
  expect(vm.frames[1].fn).toBe(f);
});`,
    hints: [
      'Start with `slots`: count back from the top past the arguments, and one more for the callee.',
      '`slots` is `vm.stack.length - argc - 1`. For a bound method, overwrite `vm.stack[slots]` with the receiver and remember the method as the function to run.',
      '`local` is the frame pointer at work: take the newest frame, `vm.frames.at(-1)`, and return `vm.stack[f.slots + i]`.',
    ],
    walkthrough: `**How to think about it.** Nothing about the arguments has to change: the only decision a call makes is where the new window starts, and that is wherever the callee is. A bound method is the one twist: its window must hold the receiver in slot 0, because the method's code reads \`self\` as \`load.local 0\`.

**The solution, line by line.**

- \`const slots = vm.stack.length - argc - 1;\` finds the callee. With \`['script', f, 7]\` and one argument, that is \`3 - 1 - 1 = 1\`.
- \`let fn = callee;\` assumes a plain function for now.
- \`if (callee.kind === 'bound') {\` handles a method that was read off an instance, like \`let g = p.get;\` followed by \`g()\`.
- \`vm.stack[slots] = callee.receiver;\` puts the instance where the callee was, so it becomes slot 0, \`self\`. This is the VM's \`this.stack[this.sp - argCount - 1] = callee.receiver;\`.
- \`fn = callee.method;\` runs the method itself.
- \`vm.frames.push({ fn, ip: 0, slots });\` opens the window.
- In \`local\`: \`const f = vm.frames.at(-1);\` takes the newest frame, the only one that runs...
- \`return vm.stack[f.slots + i];\` ...and adds its frame pointer to the slot number, exactly as \`load.local\` does.

In the second test the inner call's window starts at 3, so its slot 1 is index 4, the \`9\`, while the outer call's slot 1 is still the \`7\` at index 2.

**Common wrong attempts.**

- \`vm.stack.length - argc\` starts the window at the first argument, so slot 1 is the second argument (or nothing at all), and slot 0 is no longer the callee.
- \`vm.stack[i]\` in \`local\` ignores the frame pointer: it reads the script's slots, whichever call is running.
- Forgetting to put the receiver in slot 0 leaves the bound-method object there, so \`self\` would be the wrong value.`,
    wrong: [
      {
        code: `${HEAD}
  const slots = vm.stack.length - argc;
  let fn = callee;
  if (callee.kind === 'bound') {
    vm.stack[slots] = callee.receiver;
    fn = callee.method;
  }
  vm.frames.push({ fn, ip: 0, slots });
}
${LOCAL}${LOCAL_OK}`,
        why: 'The window starts one cell too high, at the first argument, so every slot number reads the wrong value.',
      },
      {
        code: `${HEAD}${CALL_OK}
${LOCAL}
  return vm.stack[i];
}`,
        why: 'This ignores the frame pointer and always reads the script’s slots, whatever call is running.',
      },
      {
        code: `${HEAD}
  const slots =
    vm.stack.length - argc - 1;
  const fn = callee.kind === 'bound'
    ? callee.method : callee;
  vm.frames.push({ fn, ip: 0, slots });
}
${LOCAL}${LOCAL_OK}`,
        why: 'The method runs, but slot 0 still holds the bound-method object instead of the receiver, so `self` is wrong.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'The stack is `script, fn f, 10, 20` when `call 2` runs. What is the new frame’s `slots`?',
    options: [
      { t: '2', why: 'Index 2 holds the first argument; the window starts at the callee.' },
      { t: '1', correct: true, why: '4 − 2 − 1 = 1, the index of `fn f`.' },
      { t: '0', why: 'Index 0 is the script’s slot 0.' },
      { t: '4', why: 'That is the stack top, past both arguments.' },
    ],
  },
  {
    q: 'A frame has `slots` 5. Which stack index does `load.local 2` read in it?',
    options: [
      { t: '2', why: 'That ignores the frame pointer; it is only right for the script.' },
      { t: '3', why: 'The slot number is added to the frame pointer, not subtracted.' },
      { t: '7', correct: true, why: '5 + 2 = 7.' },
      { t: 'It depends on how many arguments there were', why: 'The arguments decided `slots` at the call; after that the address is always `slots + 2`.' },
    ],
  },
  {
    q: 'A frame with `slots` 3 returns the value 9. What does the stack look like afterwards?',
    options: [
      { t: 'Indexes 0 to 2 as before, and 9 at index 3', correct: true, why: '`sp` is set back to 3, then the result is pushed there, where the callee was.' },
      { t: 'Unchanged, with 9 on top', why: 'The callee, its arguments and its locals are removed.' },
      { t: 'Only 9, at index 0', why: 'Only the finished call’s part of the stack is removed; the caller’s values stay.' },
      { t: 'Indexes 0 to 3 as before, and 9 at index 4', why: 'Index 3 was the callee, which is removed; the result takes its place.' },
    ],
  },
  {
    q: 'Inside a method, what does `load.local 0` push?',
    options: [
      { t: 'The method itself', why: 'For a plain function slot 0 holds the function, but for a method the VM puts the receiver there.' },
      { t: 'The class', why: 'The class is not on the method’s stack window.' },
      { t: '`none`', why: 'Slot 0 is always filled before the frame starts.' },
      { t: 'The receiver, `self`', correct: true, why: 'The compiler names slot 0 `self` in methods, and the VM stores the receiver there.' },
    ],
  },
  {
    q: 'In this book’s benchmark run, how did the VM do on `instantiation`, a program that creates many objects?',
    options: [
      { t: 'Much faster, because calls are cheaper', why: 'Cheaper calls did not make up for the extra cost of each object.' },
      { t: 'Slower than the tree-walker', correct: true, why: 'Its speed-up was below 1×: the VM runs its own heap and garbage collector on top of JavaScript’s, so each object costs more.' },
      { t: 'Exactly the same speed', why: 'It was measurably slower.' },
      { t: 'It was not measured', why: 'It is one of the ten programs in the committed results.' },
    ],
  },
];
