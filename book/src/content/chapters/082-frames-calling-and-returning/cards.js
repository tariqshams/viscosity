// Chapter 82 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'params-slots': {
    q: 'In the companion Drip compiler, which reserves slot 0 of every function, which slots do the parameters `a` and `b` of `fn add(a, b)` get?',
    a: 'Slots 1 and 2: parameters are declared as the function’s first locals, after the reserved slot 0.',
  },
  'frame-what': {
    q: 'What three things does a call frame in the companion Drip VM record?',
    a: 'The function being run (`closure`), its own instruction pointer (`ip`), and where its slots begin on the stack (`slots`).',
  },
  'two-checks': {
    q: 'In the companion Drip VM, what two checks does `call` make before pushing a frame?',
    a: 'That the number of arguments equals the function’s arity, and that there are fewer than `FRAMES_MAX` (256) frames already.',
  },
  'native-no-frame': {
    q: 'In the companion Drip VM, does calling a native function such as `len` push a call frame?',
    a: 'No. `callValue` runs it directly and pushes its result in place of the callee and arguments.',
  },
  'no-copy': {
    q: 'In a stack VM whose frames are windows onto one value stack, why does a call not need to copy its arguments anywhere?',
    a: 'The caller pushed the callee and then the arguments, which is exactly the layout of the callee’s slots 0, 1, 2...; the new frame’s window simply starts at the callee.',
  },
  'fp-formula': {
    q: 'In the companion Drip VM, what is the new frame’s `slots` at `call n`?',
    a: '`sp - n - 1`: the stack top, minus the arguments, minus one more for the callee.',
  },
  'return-sp': {
    q: 'In the companion Drip VM, how does `return` remove the callee, its arguments and its locals from the stack?',
    a: 'It sets `sp` back to the frame’s `slots` in one assignment, then pushes the result there, where the callee was.',
  },
  'slot-zero-method': {
    q: 'In the companion Drip VM, what is in slot 0 when a method runs?',
    a: 'The receiver, which the compiler calls `self`; the VM puts it there in place of the callee before pushing the frame.',
  },
};

export const examples = {
  trace: {
    title: 'A runtime error three calls deep',
    lang: 'drip-vm',
    expectError: true,
    code: `fn a() { b(); }
fn b() { c(); }
fn c() {
  c("too", "many");
}
a();`,
  },
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

export const exercises = {
  frames: {
    title: 'Call and return',
    prompt: `Here is the VM's call machinery without the bytecode. \`vm.stack\` is the value stack (its \`length\` is \`sp\`) and \`vm.frames\` the frame array. Write:

- \`call(vm, fn, argc)\`: the callee and \`argc\` arguments are already on top of the stack. If \`argc\` isn't \`fn.arity\`, throw \`new Error(arity(fn, argc))\`. If there are already \`FRAMES_MAX\` frames, throw \`new Error('stack overflow')\`. Otherwise push \`{ fn, ip: 0, slots }\`, where \`slots\` is the stack index of the callee.
- \`ret(vm)\`: pop the result and the top frame, cut the stack back to that frame's \`slots\`, and push the result.`,
    starter: `const FRAMES_MAX = 256;
const arity = (fn, got) => fn.name +
  '() takes ' + fn.arity +
  ' arguments but got ' + got;

// vm = { stack: [...], frames: [...] }
// fn = { name, arity }

// The callee and its argc args are on
// top of the stack. Push a frame.
function call(vm, fn, argc) {
  // your code here
}

// The result is on top. Pop it and the
// frame, drop the frame's values, then
// push the result.
function ret(vm) {
  // your code here
}`,
    solution: `const FRAMES_MAX = 256;
const arity = (fn, got) => fn.name +
  '() takes ' + fn.arity +
  ' arguments but got ' + got;

// vm = { stack: [...], frames: [...] }
// fn = { name, arity }

// The callee and its argc args are on
// top of the stack. Push a frame.
function call(vm, fn, argc) {
  if (argc !== fn.arity) {
    throw new Error(arity(fn, argc));
  }
  if (vm.frames.length === FRAMES_MAX) {
    throw new Error('stack overflow');
  }
  const slots =
    vm.stack.length - argc - 1;
  vm.frames.push({ fn, ip: 0, slots });
}

// The result is on top. Pop it and the
// frame, drop the frame's values, then
// push the result.
function ret(vm) {
  const result = vm.stack.pop();
  const f = vm.frames.pop();
  vm.stack.length = f.slots;
  vm.stack.push(result);
}`,
    tests: `const add = { name: 'add', arity: 2 };
const one = { name: 'f', arity: 1 };
const start = () => ({
  stack: ['script'],
  frames: [{ fn: null, ip: 0,
    slots: 0 }],
});
test('a call pushes a frame', () => {
  const vm = start();
  vm.stack.push(add, 1, 2);
  call(vm, add, 2);
  expect(vm.frames.length).toBe(2);
  expect(vm.frames[1].ip).toBe(0);
  expect(vm.frames[1].slots).toBe(1);
});
test('ret leaves only the result', () => {
  const vm = start();
  vm.stack.push(add, 1, 2);
  call(vm, add, 2);
  vm.stack.push('tmp', 3);
  ret(vm);
  expect(vm.stack).toEqual(
    ['script', 3]);
  expect(vm.frames.length).toBe(1);
});
test('arity is checked first', () => {
  const vm = start();
  vm.stack.push(add, 1);
  expect(() => call(vm, add, 1))
    .toThrow();
  expect(vm.frames.length).toBe(1);
});
test('256 frames at most', () => {
  const vm = start();
  for (let k = 1; k < 256; k++) {
    vm.stack.push(one, k);
    call(vm, one, 1);
  }
  expect(vm.frames.length).toBe(256);
  vm.stack.push(one, 0);
  expect(() => call(vm, one, 1))
    .toThrow();
});`,
    hints: [
      'Draw the top of the stack just before the call: callee, then argument 1, ..., then argument argc. Which index is the callee at?',
      'The callee is at `vm.stack.length - argc - 1`; that is `slots`. Do both checks (arity, then `vm.frames.length === FRAMES_MAX`) before pushing anything.',
      'In `ret`, pop the result *before* cutting the stack: `const result = vm.stack.pop();`, then pop the frame, set `vm.stack.length = f.slots`, and push `result`.',
    ],
    walkthrough: `**How to think about it.** A call is "check, then push a record"; a return is "take the answer off, pop the record, tidy up, put the answer back". The only arithmetic is finding the callee: the caller pushed the callee and then \`argc\` arguments, so counting back \`argc\` from the top, and one more, lands on it.

**The solution, line by line.**

- \`if (argc !== fn.arity) {\` compares the arguments given with the parameters declared...
- \`throw new Error(arity(fn, argc));\` ...and fails with Drip's message, \`add() takes 2 arguments but got 1\`, before anything changes.
- \`if (vm.frames.length === FRAMES_MAX) {\` refuses a 257th frame: with 256 already (the script counts as one), there is no room.
- \`throw new Error('stack overflow');\`
- \`const slots = vm.stack.length - argc - 1;\` is the callee's index. With \`['script', add, 1, 2]\` and \`argc\` 2, it is \`4 - 2 - 1 = 1\`.
- \`vm.frames.push({ fn, ip: 0, slots });\` starts the call at the first byte of the function's bytecode.
- In \`ret\`: \`const result = vm.stack.pop();\` takes the answer off first, because it sits above \`slots\` and would otherwise be thrown away.
- \`const f = vm.frames.pop();\` ends the call.
- \`vm.stack.length = f.slots;\` discards the callee, its arguments and every temporary in one go.
- \`vm.stack.push(result);\` puts the answer where the callee was, so to the caller the whole call has become one value.

**Common wrong attempts.**

- \`slots = vm.stack.length - argc\` points at the first argument and forgets the callee, so \`ret\` leaves the callee behind on the stack.
- Cutting the stack before popping the result throws the result away.
- Checking \`vm.frames.length > FRAMES_MAX\` allows one frame too many.`,
    wrong: [
      {
        code: `const FRAMES_MAX = 256;
const arity = (fn, got) => fn.name +
  '() takes ' + fn.arity +
  ' arguments but got ' + got;

// vm = { stack: [...], frames: [...] }
// fn = { name, arity }

// The callee and its argc args are on
// top of the stack. Push a frame.
function call(vm, fn, argc) {
  if (argc !== fn.arity) {
    throw new Error(arity(fn, argc));
  }
  if (vm.frames.length === FRAMES_MAX) {
    throw new Error('stack overflow');
  }
  const slots = vm.stack.length - argc;
  vm.frames.push({ fn, ip: 0, slots });
}

// The result is on top. Pop it and the
// frame, drop the frame's values, then
// push the result.
function ret(vm) {
  const result = vm.stack.pop();
  const f = vm.frames.pop();
  vm.stack.length = f.slots;
  vm.stack.push(result);
}`,
        why: 'This starts the frame at the first argument and forgets the callee, so `ret` leaves the callee behind on the stack.',
      },
      {
        code: `const FRAMES_MAX = 256;
const arity = (fn, got) => fn.name +
  '() takes ' + fn.arity +
  ' arguments but got ' + got;

// vm = { stack: [...], frames: [...] }
// fn = { name, arity }

// The callee and its argc args are on
// top of the stack. Push a frame.
function call(vm, fn, argc) {
  if (argc !== fn.arity) {
    throw new Error(arity(fn, argc));
  }
  if (vm.frames.length === FRAMES_MAX) {
    throw new Error('stack overflow');
  }
  const slots =
    vm.stack.length - argc - 1;
  vm.frames.push({ fn, ip: 0, slots });
}

// The result is on top. Pop it and the
// frame, drop the frame's values, then
// push the result.
function ret(vm) {
  const f = vm.frames.pop();
  vm.stack.length = f.slots;
  vm.stack.push(vm.stack.pop());
}`,
        why: 'The stack is cut *before* the result is taken off, so the result is thrown away with the call’s values. Pop the result first.',
      },
      {
        code: `const FRAMES_MAX = 256;
const arity = (fn, got) => fn.name +
  '() takes ' + fn.arity +
  ' arguments but got ' + got;

// vm = { stack: [...], frames: [...] }
// fn = { name, arity }

// The callee and its argc args are on
// top of the stack. Push a frame.
function call(vm, fn, argc) {
  if (argc !== fn.arity) {
    throw new Error(arity(fn, argc));
  }
  if (vm.frames.length > FRAMES_MAX) {
    throw new Error('stack overflow');
  }
  const slots =
    vm.stack.length - argc - 1;
  vm.frames.push({ fn, ip: 0, slots });
}

// The result is on top. Pop it and the
// frame, drop the frame's values, then
// push the result.
function ret(vm) {
  const result = vm.stack.pop();
  const f = vm.frames.pop();
  vm.stack.length = f.slots;
  vm.stack.push(result);
}`,
        why: 'With `>`, a 257th frame is still allowed. The VM must refuse a new frame once it already has `FRAMES_MAX`.',
      },
    ],
  },
  window: {
    optional: true,
    title: 'A window for every call',
    prompt: `Write two pieces of the VM's frame-pointer work. The callee and \`argc\` arguments are on top of \`vm.stack\` (its \`length\` is \`sp\`).

- \`callValue(vm, callee, argc)\` pushes \`{ fn, ip: 0, slots }\` onto \`vm.frames\`, where \`slots\` is the callee's stack index. If the callee is a bound method (\`kind: 'bound'\`), first put its \`receiver\` into slot 0 (in place of the callee), and use its \`method\` as \`fn\`; otherwise \`fn\` is the callee itself.
- \`local(vm, i)\` returns the value of slot \`i\` of the newest frame.`,
    starter: `// vm = { stack: [...], frames: [...] }
// callee: { kind: 'fn', arity }
//   or { kind: 'bound', receiver,
//        method }
// Push a frame for the call.
function callValue(vm, callee, argc) {
  // your code here
}

// Read slot i of the newest frame.
function local(vm, i) {
  // your code here
}`,
    solution: `// vm = { stack: [...], frames: [...] }
// callee: { kind: 'fn', arity }
//   or { kind: 'bound', receiver,
//        method }
// Push a frame for the call.
function callValue(vm, callee, argc) {
  const slots =
    vm.stack.length - argc - 1;
  let fn = callee;
  if (callee.kind === 'bound') {
    vm.stack[slots] = callee.receiver;
    fn = callee.method;
  }
  vm.frames.push({ fn, ip: 0, slots });
}

// Read slot i of the newest frame.
function local(vm, i) {
  const f = vm.frames.at(-1);
  return vm.stack[f.slots + i];
}`,
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
        code: `// vm = { stack: [...], frames: [...] }
// callee: { kind: 'fn', arity }
//   or { kind: 'bound', receiver,
//        method }
// Push a frame for the call.
function callValue(vm, callee, argc) {
  const slots = vm.stack.length - argc;
  let fn = callee;
  if (callee.kind === 'bound') {
    vm.stack[slots] = callee.receiver;
    fn = callee.method;
  }
  vm.frames.push({ fn, ip: 0, slots });
}

// Read slot i of the newest frame.
function local(vm, i) {
  const f = vm.frames.at(-1);
  return vm.stack[f.slots + i];
}`,
        why: 'The window starts one cell too high, at the first argument, so every slot number reads the wrong value.',
      },
      {
        code: `// vm = { stack: [...], frames: [...] }
// callee: { kind: 'fn', arity }
//   or { kind: 'bound', receiver,
//        method }
// Push a frame for the call.
function callValue(vm, callee, argc) {
  const slots =
    vm.stack.length - argc - 1;
  let fn = callee;
  if (callee.kind === 'bound') {
    vm.stack[slots] = callee.receiver;
    fn = callee.method;
  }
  vm.frames.push({ fn, ip: 0, slots });
}

// Read slot i of the newest frame.
function local(vm, i) {
  return vm.stack[i];
}`,
        why: 'This ignores the frame pointer and always reads the script’s slots, whatever call is running.',
      },
      {
        code: `// vm = { stack: [...], frames: [...] }
// callee: { kind: 'fn', arity }
//   or { kind: 'bound', receiver,
//        method }
// Push a frame for the call.
function callValue(vm, callee, argc) {
  const slots =
    vm.stack.length - argc - 1;
  const fn = callee.kind === 'bound'
    ? callee.method : callee;
  vm.frames.push({ fn, ip: 0, slots });
}

// Read slot i of the newest frame.
function local(vm, i) {
  const f = vm.frames.at(-1);
  return vm.stack[f.slots + i];
}`,
        why: 'The method runs, but slot 0 still holds the bound-method object instead of the receiver, so `self` is wrong.',
      },
    ],
  },
  'deep-sum': {
    optional: true,
    lang: 'drip-vm',
    title: 'Too deep for 256 frames',
    prompt: 'The starter adds up 1 to `n` recursively. It works for 10, but `sum(1000)` needs a thousand frames and the VM stops with `stack overflow`. Rewrite `sum` with a `while` loop so the program prints `55` and then `500500`.',
    starter: `fn sum(n) {
  if n == 0 { return 0; }
  return n + sum(n - 1);
}

print sum(10);
print sum(1000);`,
    solution: `fn sum(n) {
  let t = 0;
  while n > 0 {
    t = t + n;
    n = n - 1;
  }
  return t;
}

print sum(10);
print sum(1000);`,
    tests: `55
500500`,
    hints: [
      'The recursion needs one frame per number. A loop inside one call needs only one frame, however big `n` is. Keep a running total in a local: `let t = 0;`.',
      'Loop while `n > 0`, adding `n` to `t` and then counting `n` down. Parameters are ordinary locals, so you may assign to `n`.',
    ],
    walkthrough: `**How to think about it.** Each recursive call pushes a frame, and the VM allows 256 in all, so \`sum(1000)\` can never finish. A loop does all its work inside one call, so it needs one frame whatever \`n\` is.

**The solution, line by line.**

- \`fn sum(n) {\` gives \`n\` slot 1.
- \`let t = 0;\` puts the running total in slot 2.
- \`while n > 0 {\` compiles to a test, a \`jump.unless\` out, the body and a \`loop\` back, all inside \`sum\`'s own bytecode.
- \`t = t + n;\` adds the current number: \`load.local 2\`, \`load.local 1\`, \`add\`, \`store.local 2\`, \`pop\`.
- \`n = n - 1;\` counts down. Assigning to a parameter is fine: it is just slot 1.
- \`return t;\` returns the total, and the frame is popped.

**Common wrong attempts.**

- Counting \`n\` down *before* adding it makes every term one too small, so \`sum(10)\` is \`45\`. (Some languages turn certain recursive calls into jumps so they need no new frame; Drip does not.)`,
    wrong: [
      {
        code: `fn sum(n) {
  let t = 0;
  while n > 0 {
    n = n - 1;
    t = t + n;
  }
  return t;
}

print sum(10);
print sum(1000);`,
        why: 'The order is swapped: `n` is counted down *before* it is added, so every term is one too small (`45` instead of `55`). Add first, then count down.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In the companion Drip VM, just before `call 2` runs, what are the top three values on the stack?',
    options: [
      {
        t: 'The two arguments and the result slot',
        why: 'There is no result slot; the result later goes where the callee was.',
      },
      {
        t: 'The callee, then the first argument, then the second',
        correct: true,
        why: 'The compiler pushes the callee first and the arguments after it, left to right.',
      },
      {
        t: 'The first argument, the callee, the second argument',
        why: 'The callee is pushed before any argument, so it is below both of them.',
      },
      {
        t: 'Only the arguments: the callee is in a register',
        why: 'The VM has no registers; the callee is on the stack.',
      },
    ],
  },
  {
    q: 'In the companion Drip VM, what does `call` do for a Drip function when the arity is right and there is room?',
    options: [
      {
        t: 'Runs the function body with a TypeScript call',
        why: 'The dispatch loop never calls itself; the next byte it reads is simply the callee’s.',
      },
      {
        t: 'Copies the arguments into a new environment',
        why: 'Nothing is copied, and there are no environments for locals in the VM.',
      },
      {
        t: 'Pushes a frame record with ip 0',
        correct: true,
        why: 'That and the two checks are the whole call; the loop then reloads from the new frame.',
      },
      {
        t: 'Pops the callee and the arguments',
        why: 'They stay where they are; return removes them later.',
      },
    ],
  },
  {
    q: 'In the companion Drip VM, the stack is `script, fn f, 10, 20` when `call 2` runs. What is the new frame’s `slots`?',
    options: [
      {
        t: '2',
        why: 'Index 2 holds the first argument; the window starts at the callee.',
      },
      {
        t: '1',
        correct: true,
        why: '4 − 2 − 1 = 1, the index of `fn f`.',
      },
      {
        t: '0',
        why: 'Index 0 is the script’s slot 0.',
      },
      {
        t: '4',
        why: 'That is the stack top, past both arguments.',
      },
    ],
  },
  {
    q: 'In the companion Drip VM, a frame has `slots` 5. Which stack index does `load.local 2` read in it?',
    options: [
      {
        t: '2',
        why: 'That ignores the frame pointer; it is only right for the script.',
      },
      {
        t: '3',
        why: 'The slot number is added to the frame pointer, not subtracted.',
      },
      {
        t: '7',
        correct: true,
        why: '5 + 2 = 7.',
      },
      {
        t: 'It depends on how many arguments there were',
        why: 'The arguments decided `slots` at the call; after that the address is always `slots + 2`.',
      },
    ],
  },
];
