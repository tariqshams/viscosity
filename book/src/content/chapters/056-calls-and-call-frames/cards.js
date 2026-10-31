// Chapter 56 cards. Keys are stable ids: never rename them.

export const prompts = {
  'own-chunk': {
    q: 'Where does the bytecode of a Drip function’s body go?',
    a: 'Into the function’s own chunk, made by a fresh compiler (`initCompiler`) that has its own `locals` array.',
  },
  'params-slots': {
    q: 'In `fn add(a, b)`, which slots do `a` and `b` get, and why not 0?',
    a: 'Slots 1 and 2. Slot 0 is reserved for the function itself.',
  },
  'fn-is-constant': {
    q: 'After a function is compiled, where is the finished function object kept?',
    a: 'In the enclosing chunk’s constant pool. A `CLOSURE` instruction pushes it at run time.',
  },
  'frame-three': {
    q: 'What three things does a **call frame** record?',
    a: 'The function (closure) being run, its own instruction pointer, and `slots`: where its slot 0 is on the stack.',
  },
  'frame-pointer-what': {
    q: 'A frame’s `slots` is 5. Where is its local slot 2?',
    a: 'At `stack[7]`: the frame pointer plus the slot number.',
  },
  'no-copy': {
    q: 'Why does `CALL` not need to copy the arguments anywhere?',
    a: 'The caller pushed the callee and then the arguments, which is exactly the layout of the callee’s slots 0, 1, 2…. The new frame just starts at the callee.',
  },
  'return-sp': {
    q: 'What does `RETURN` do to `sp`, and what does that achieve?',
    a: 'It sets `sp` to the frame’s `slots`, discarding the callee, its arguments and its locals at once. Then it pushes the result there.',
  },
  'reload-why': {
    q: 'Why does the dispatch loop call `reload()` after `CALL` and `RETURN`?',
    a: 'It caches the current frame, its code and its constants in local variables. A call or return changes which frame is on top.',
  },
  'native-no-frame': {
    q: 'Does calling a native function like `clock` push a call frame?',
    a: 'No. `callValue` runs the host function directly, removes the callee and arguments, and pushes the result.',
  },
  'trace-ip': {
    q: 'In the stack trace, why does the VM read the line of `ip - 1`?',
    a: 'Each frame’s `ip` has already moved past the instruction it was running. `ip - 1` is inside that instruction.',
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

const PRELUDE = `const FRAMES_MAX = 64;
const arityMsg = (want, got) =>
  \`Expected \${want} arguments \` +
  \`but got \${got}.\`;

// vm = { stack: [...], frames: [...] }
// fn = { name, arity }
`;

const CALL_HEAD = `// The callee and its argc args are on
// top of the stack. Push a frame.
function call(vm, fn, argc) {`;
const RET_HEAD = `// The result is on top. Pop it and the
// frame, drop the frame's slots, then
// push the result.
function ret(vm) {`;
const ADDR_HEAD = `// Stack index of local slot i of the
// current (top) frame.
function slotAddr(vm, i) {`;

const CALL_OK = `
  if (argc !== fn.arity) {
    throw new Error(
      arityMsg(fn.arity, argc));
  }
  if (vm.frames.length === FRAMES_MAX) {
    throw new Error('Stack overflow.');
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
const ADDR_OK = `
  return vm.frames.at(-1).slots + i;
}`;

const build = (c, r, a) => `${PRELUDE}
${CALL_HEAD}${c}

${RET_HEAD}${r}

${ADDR_HEAD}${a}`;
const TODO = `
  // your code here
}`;

export const exercises = {
  frames: {
    title: 'A frame stack',
    prompt: `Here is the VM's call machinery without the bytecode. \`vm.stack\` is the value stack (its \`length\` is \`sp\`) and \`vm.frames\` the frame array. Write:

- \`call(vm, fn, argc)\`: the callee and \`argc\` arguments are already on top of the stack. If \`argc\` isn't \`fn.arity\`, throw \`new Error(arityMsg(fn.arity, argc))\`. If there are already \`FRAMES_MAX\` frames, throw \`new Error('Stack overflow.')\`. Otherwise push \`{ fn, ip: 0, slots }\`, where \`slots\` is the stack index of the callee.
- \`ret(vm)\`: pop the result and the top frame, cut the stack back to that frame's \`slots\`, and push the result.
- \`slotAddr(vm, i)\`: the stack index of local slot \`i\` of the top frame.`,
    starter: build(TODO, TODO, TODO),
    solution: build(CALL_OK, RET_OK, ADDR_OK),
    tests: `const add = { name: 'add', arity: 2 };
const one = { name: 'f', arity: 1 };
const start = () => ({
  stack: ['<script>'],
  frames: [{ fn: null, ip: 0,
    slots: 0 }],
});
test('slots start at the callee', () => {
  const vm = start();
  vm.stack.push(add, 1, 2);
  call(vm, add, 2);
  expect(vm.frames.length).toBe(2);
  expect(vm.frames[1].slots).toBe(1);
});
test('slotAddr finds a parameter', () => {
  const vm = start();
  vm.stack.push(9, add, 1, 2);
  call(vm, add, 2);
  expect(slotAddr(vm, 0)).toBe(2);
  expect(vm.stack[slotAddr(vm, 2)])
    .toBe(2);
});
test('ret leaves only the result', () => {
  const vm = start();
  vm.stack.push(add, 1, 2);
  call(vm, add, 2);
  vm.stack.push('tmp', 3);
  ret(vm);
  expect(vm.stack).toEqual(
    ['<script>', 3]);
  expect(vm.frames.length).toBe(1);
});
test('arity is checked', () => {
  const vm = start();
  vm.stack.push(add, 1);
  expect(() => call(vm, add, 1))
    .toThrow();
  expect(vm.frames.length).toBe(1);
});
test('64 frames at most', () => {
  const vm = start();
  for (let k = 1; k < 64; k++) {
    vm.stack.push(one, k);
    call(vm, one, 1);
  }
  expect(vm.frames.length).toBe(64);
  vm.stack.push(one, 0);
  expect(() => call(vm, one, 1))
    .toThrow();
});`,
    hints: [
      'Before the call, the stack ends with: callee, arg 1, …, arg argc. So the callee is at `vm.stack.length - argc - 1`.',
      'In `ret`, pop the result *before* cutting the stack, then set `vm.stack.length = f.slots` and push the result.',
      '`slotAddr` is the top frame’s `slots` plus `i`: `vm.frames.at(-1).slots + i`.',
    ],
    walkthrough: `These are \`call\`, the \`RETURN\` case and \`GET_LOCAL\`'s address arithmetic from \`vm.ts\`.

- **\`slots\`.** The caller pushed the callee, then \`argc\` arguments. Counting back \`argc\` from the top, and one more, lands on the callee. That becomes the new frame's slot 0, the first argument its slot 1, and so on. Nothing moves.
- **The checks come first**, before the frame is pushed, so a failed call leaves the frame array untouched (the arity test checks this). The depth check compares with \`FRAMES_MAX\` using \`===\`: with 64 frames already, a 65th is refused.
- **\`ret\`** must take the result off *before* truncating, because the result sits above \`slots\`. Setting \`length\` to \`slots\` discards the callee, the arguments and every temporary in one go, and the result lands where the callee was.
- **\`slotAddr\`** is the frame pointer at work: the same slot number means a different stack index in each frame.

\`\`\`js
const slots =
  vm.stack.length - argc - 1;
vm.frames.push({ fn, ip: 0, slots });
\`\`\``,
    wrong: [
      {
        code: build(`
  if (argc !== fn.arity) {
    throw new Error(
      arityMsg(fn.arity, argc));
  }
  if (vm.frames.length === FRAMES_MAX) {
    throw new Error('Stack overflow.');
  }
  const slots = vm.stack.length - argc;
  vm.frames.push({ fn, ip: 0, slots });
}`, RET_OK, ADDR_OK),
        why: 'This points slot 0 at the first argument and forgets the callee. Every parameter would be off by one, and `RETURN` would leave the callee behind on the stack.',
      },
      {
        code: build(CALL_OK, `
  const f = vm.frames.pop();
  vm.stack.length = f.slots;
  vm.stack.push(vm.stack.pop());
}`, ADDR_OK),
        why: 'The stack is cut *before* the result is taken off, so the result is thrown away with the callee’s slots. Pop the result first.',
      },
      {
        code: build(`
  if (argc !== fn.arity) {
    throw new Error(
      arityMsg(fn.arity, argc));
  }
  if (vm.frames.length > FRAMES_MAX) {
    throw new Error('Stack overflow.');
  }
  const slots =
    vm.stack.length - argc - 1;
  vm.frames.push({ fn, ip: 0, slots });
}`, RET_OK, ADDR_OK),
        why: 'With `>`, a 65th frame is still allowed. The VM must refuse a new frame once it already has `FRAMES_MAX`.',
      },
    ],
  },
  'deep-sum': {
    optional: true,
    lang: 'drip-vm',
    title: 'Too deep for 64 frames',
    prompt:
      'The starter adds up 1 to `n` recursively. It works for 10, but `sum(1000)` needs a thousand frames and the VM stops with `Stack overflow.` Rewrite `sum` with a `while` loop so the program prints `55` and then `500500`.',
    starter: `fn sum(n) {
  if (n == 0) return 0;
  return n + sum(n - 1);
}

print sum(10);
print sum(1000);`,
    solution: `fn sum(n) {
  let t = 0;
  while (n > 0) {
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
      'Keep a running total in a local: `let t = 0;`.',
      'Loop while `n > 0`, adding `n` to `t` and counting `n` down. Parameters are ordinary locals, so you may assign to `n`.',
    ],
    walkthrough: `The recursive version pushes one frame per level, and the VM allows 64 frames in all, so \`sum(1000)\` can never finish. The loop version runs in a single frame: \`n\` is slot 1, \`t\` is slot 2, and the \`while\` is a \`JUMP_IF_FALSE\` and a \`LOOP\` inside \`sum\`'s chunk. However large \`n\` is, the stack never grows past a few values. (Some languages turn certain recursive calls into jumps automatically; Drip doesn't.)`,
    wrong: [
      {
        code: `fn sum(n) {
  let t = 0;
  while (n > 0) {
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
    q: 'Just before `CALL 2` runs, what is on top of the stack?',
    options: [
      { t: 'The two arguments only; the callee is in a register', why: 'The VM has no registers. The callee is on the stack too.' },
      { t: 'The callee, then the first argument, then the second', correct: true, why: 'They become the new frame’s slots 0, 1 and 2 without being moved.' },
      { t: 'The return address', why: 'The return position is the caller frame’s own `ip`, kept in the frame record.' },
      { t: 'A new environment', why: 'The VM has no environments for calls.' },
    ],
  },
  {
    q: 'A frame has `slots = 3`. Which stack index does `GET_LOCAL 1` read?',
    options: [
      { t: '1', why: 'That would be the script’s slot 1. Slot numbers are relative to the frame.' },
      { t: '3', why: 'Index 3 is this frame’s slot 0: the function itself.' },
      { t: '4', correct: true, why: '`stack[frame.slots + 1]`.' },
      { t: 'It depends on the variable’s name', why: 'No names exist at run time: just the frame pointer and the slot number.' },
    ],
  },
  {
    q: 'What does `RETURN` do with the callee’s arguments and locals?',
    options: [
      { t: 'Pops them one by one with `POP`s the compiler emitted', why: 'No `POP`s are needed: one assignment to `sp` drops them all.' },
      { t: 'Leaves them for the garbage collector', why: 'They are simply overwritten as the stack is reused.' },
      { t: 'Copies them back to the caller', why: 'Only the result goes back.' },
      { t: 'Discards them all by setting `sp` to the frame’s `slots`, then pushes the result', correct: true, why: 'That cuts away the callee, its arguments and its locals in one move.' },
    ],
  },
  {
    q: 'Why can the VM report `Stack overflow.` at exactly 64 frames?',
    options: [
      { t: 'Its frames are its own array, so it decides the limit (`FRAMES_MAX`)', correct: true, why: '`call` refuses a new frame when there are already 64.' },
      { t: 'JavaScript’s host stack holds exactly 64 calls', why: 'The VM doesn’t use host calls for Drip calls at all.' },
      { t: 'The bytecode can only address 64 functions', why: 'Functions are constants; that limit is 256 per chunk, and unrelated.' },
      { t: 'Each frame uses 64 bytes', why: 'The limit is a count of frames, not a size.' },
    ],
  },
  {
    q: `Which line of the trace is printed first?
\`\`\`
fn a() { b(); }
fn b() { 1(); }
a();
\`\`\``,
    options: [
      { t: '`[line 3] in script`', why: 'The trace starts from the newest frame, so the script comes last.' },
      { t: '`[line 2] in b()`, right after the message', correct: true, why: '`runtimeError` walks the frames from the top: `b`, then `a`, then the script.' },
      { t: '`[line 1] in a()`', why: '`a` is waiting for `b`, so it comes second.' },
      { t: 'There is no trace, only the message', why: 'The VM prints one line per frame.' },
    ],
  },
  {
    q: 'Compared with the tree-walker, what does one Drip call cost the VM?',
    options: [
      { t: 'The same: an environment and several host frames', why: 'That was the tree-walker’s cost. The VM uses neither.' },
      { t: 'Copying every argument into a new array', why: 'The arguments stay where they are.' },
      { t: 'One frame record pushed onto an array, plus checks for arity and depth', correct: true, why: 'That is all `call` does; the loop then carries on in the callee’s chunk.' },
      { t: 'A thrown exception for the return', why: '`RETURN` is an ordinary instruction.' },
    ],
  },
];
