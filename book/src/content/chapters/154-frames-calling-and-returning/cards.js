// Chapter 154 cards. Keys are stable ids: never rename them.

export const prompts = {
  'own-code': {
    q: 'Where does the compiler put the bytecode of a function body?',
    a: 'In the function’s own bytecode, compiled by a fresh nested function compiler; the finished function becomes a constant of the code around it.',
  },
  'params-slots': {
    q: 'In `fn add(a, b)`, which slots do `a` and `b` get?',
    a: 'Slots 1 and 2: parameters are declared as the function’s first locals, after the reserved slot 0.',
  },
  'frame-what': {
    q: 'What three things does a call frame record?',
    a: 'The function being run (`closure`), its own instruction pointer (`ip`), and where its slots begin on the stack (`slots`).',
  },
  'two-checks': {
    q: 'What two checks does `call` make before pushing a frame?',
    a: 'That the number of arguments equals the function’s arity, and that there are fewer than `FRAMES_MAX` (256) frames already.',
  },
  'reload-why': {
    q: 'Why does the dispatch loop call `reload()` after a call or a return?',
    a: 'It keeps the current frame, its code and its constants in local variables; they must be refreshed from the new top frame.',
  },
  'native-no-frame': {
    q: 'Does calling a native function like `len` push a frame?',
    a: 'No. `callValue` runs it directly and pushes its result in place of the callee and arguments.',
  },
  'trace-ip': {
    q: 'In a stack trace, why does the VM look up the line of `ip - 1`?',
    a: 'Each frame’s `ip` has already moved past the instruction it was running (for a caller, its `call`), so `ip - 1` is inside that instruction.',
  },
  'overflow-limit': {
    q: 'Who decides when the VM reports `stack overflow`?',
    a: 'The VM itself: `call` refuses a new frame once there are `FRAMES_MAX` (256) frames, the script included.',
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
};

const PRELUDE = `const FRAMES_MAX = 256;
const arity = (fn, got) => fn.name +
  '() takes ' + fn.arity +
  ' arguments but got ' + got;

// vm = { stack: [...], frames: [...] }
// fn = { name, arity }
`;

const CALL_HEAD = `// The callee and its argc args are on
// top of the stack. Push a frame.
function call(vm, fn, argc) {`;
const RET_HEAD = `// The result is on top. Pop it and the
// frame, drop the frame's values, then
// push the result.
function ret(vm) {`;

const CALL_OK = `
  if (argc !== fn.arity) {
    throw new Error(arity(fn, argc));
  }
  if (vm.frames.length === FRAMES_MAX) {
    throw new Error('stack overflow');
  }
  const slots =
    vm.stack.length - argc - 1;
  vm.frames.push({ fn, ip: 0, slots });
}`;
const RET_OK = `
  const result = vm.stack.pop();
  const f = vm.frames.pop();
  vm.stack.length = f.slots;
  vm.stack.push(result);
}`;

const build = (c, r) => `${PRELUDE}
${CALL_HEAD}${c}

${RET_HEAD}${r}`;
const TODO = `
  // your code here
}`;

export const exercises = {
  frames: {
    title: 'Call and return',
    prompt: `Here is the VM's call machinery without the bytecode. \`vm.stack\` is the value stack (its \`length\` is \`sp\`) and \`vm.frames\` the frame array. Write:

- \`call(vm, fn, argc)\`: the callee and \`argc\` arguments are already on top of the stack. If \`argc\` isn't \`fn.arity\`, throw \`new Error(arity(fn, argc))\`. If there are already \`FRAMES_MAX\` frames, throw \`new Error('stack overflow')\`. Otherwise push \`{ fn, ip: 0, slots }\`, where \`slots\` is the stack index of the callee.
- \`ret(vm)\`: pop the result and the top frame, cut the stack back to that frame's \`slots\`, and push the result.`,
    starter: build(TODO, TODO),
    solution: build(CALL_OK, RET_OK),
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
        code: build(`
  if (argc !== fn.arity) {
    throw new Error(arity(fn, argc));
  }
  if (vm.frames.length === FRAMES_MAX) {
    throw new Error('stack overflow');
  }
  const slots = vm.stack.length - argc;
  vm.frames.push({ fn, ip: 0, slots });
}`, RET_OK),
        why: 'This starts the frame at the first argument and forgets the callee, so `ret` leaves the callee behind on the stack.',
      },
      {
        code: build(CALL_OK, `
  const f = vm.frames.pop();
  vm.stack.length = f.slots;
  vm.stack.push(vm.stack.pop());
}`),
        why: 'The stack is cut *before* the result is taken off, so the result is thrown away with the call’s values. Pop the result first.',
      },
      {
        code: build(`
  if (argc !== fn.arity) {
    throw new Error(arity(fn, argc));
  }
  if (vm.frames.length > FRAMES_MAX) {
    throw new Error('stack overflow');
  }
  const slots =
    vm.stack.length - argc - 1;
  vm.frames.push({ fn, ip: 0, slots });
}`, RET_OK),
        why: 'With `>`, a 257th frame is still allowed. The VM must refuse a new frame once it already has `FRAMES_MAX`.',
      },
    ],
  },
  'deep-sum': {
    optional: true,
    lang: 'drip-vm',
    title: 'Too deep for 256 frames',
    prompt:
      'The starter adds up 1 to `n` recursively. It works for 10, but `sum(1000)` needs a thousand frames and the VM stops with `stack overflow`. Rewrite `sum` with a `while` loop so the program prints `55` and then `500500`.',
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
    q: 'Just before `call 2` runs, what are the top three values on the stack?',
    options: [
      { t: 'The two arguments and the result slot', why: 'There is no result slot; the result later goes where the callee was.' },
      { t: 'The callee, then the first argument, then the second', correct: true, why: 'The compiler pushes the callee first and the arguments after it, left to right.' },
      { t: 'The first argument, the callee, the second argument', why: 'The callee is pushed before any argument, so it is below both of them.' },
      { t: 'Only the arguments: the callee is in a register', why: 'The VM has no registers; the callee is on the stack.' },
    ],
  },
  {
    q: 'What does `call` do when the arity is right and there is room?',
    options: [
      { t: 'Runs the function body with a TypeScript call', why: 'The dispatch loop never calls itself; the next byte it reads is simply the callee’s.' },
      { t: 'Copies the arguments into a new environment', why: 'Nothing is copied, and there are no environments for locals in the VM.' },
      { t: 'Pushes a frame record with ip 0', correct: true, why: 'That and the two checks are the whole call; the loop then reloads from the new frame.' },
      { t: 'Pops the callee and the arguments', why: 'They stay where they are; return removes them later.' },
    ],
  },
  {
    q: 'What does `return` leave on the stack, in the caller’s part of it?',
    options: [
      { t: 'The callee, its arguments and the result', why: 'Return cuts the stack back to the frame’s slots, removing all of those.' },
      { t: 'Nothing: the result goes into a special register', why: 'The result is pushed on the stack.' },
      { t: 'The arguments, so the caller can reuse them', why: 'They belong to the finished call and are discarded.' },
      { t: 'Just the result, where the callee used to be', correct: true, why: 'To the caller the whole call has turned into one value.' },
    ],
  },
  {
    q: 'Which call pushes no frame?',
    options: [
      { t: '`len(xs)`', correct: true, why: 'A native function runs at once inside `callValue`, and its result is pushed directly.' },
      { t: '`f()` where `f` takes no parameters', why: 'Every Drip function call pushes a frame, even with no arguments.' },
      { t: 'A recursive call', why: 'Each recursive call pushes its own frame; that is why deep recursion overflows.' },
      { t: 'A call that returns `none`', why: 'The frame is pushed before anyone knows what it will return.' },
    ],
  },
  {
    q: 'A function calls itself with no base case. When does the VM stop it?',
    options: [
      { t: 'When the host’s (TypeScript’s) stack runs out', why: 'The VM does not use the host’s stack for Drip calls.' },
      { t: 'Never: the VM keeps going until memory runs out', why: '`call` checks the depth every time.' },
      { t: 'When a new call would make more than 256 frames', correct: true, why: '`call` throws `stack overflow` once there are already `FRAMES_MAX` frames.' },
      { t: 'After 64 calls', why: 'Drip’s limit is 256 frames, the script included.' },
    ],
  },
];
