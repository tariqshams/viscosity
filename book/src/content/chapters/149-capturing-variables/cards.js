// Chapter 149 cards. Keys are stable ids: never rename them.

export const prompts = {
  'slot-dies': {
    q: 'Why can’t a VM closure simply remember the stack slot number of a variable it captured?',
    a: 'When the function returns, its slots are freed and the next call reuses them, so the slot would hold someone else’s value.',
  },
  'upvalue-def': {
    q: 'What is an upvalue?',
    a: 'A closure’s handle on a variable declared in an enclosing function; the closure reaches the variable only through it.',
  },
  'is-local-pair': {
    q: 'After `OP_CLOSURE`, what does the pair `local 1` mean, and what does `upvalue 0` mean?',
    a: '`local 1`: capture slot 1 of the frame that is running now. `upvalue 0`: reuse upvalue 0 of the closure that is running now.',
  },
  'three-levels': {
    q: '`inner` uses `x` from `outer`, and is declared inside `middle`. Why does `middle` get an upvalue for `x` even though it never uses `x`?',
    a: 'So `inner` has something to copy. By the time `inner` is created, `outer`’s frame may be gone, but `middle`’s closure still holds the upvalue.',
  },
  'open-def': {
    q: 'Where is the value of an open upvalue stored?',
    a: 'In its stack slot. The upvalue only records the slot’s index.',
  },
  'shared-upvalue': {
    q: 'Two closures made in one call both capture the local `n`. How many upvalue objects are there for `n`?',
    a: 'One. `captureUpvalue` finds the open upvalue for that slot and returns it, so both closures share it.',
  },
  'sorted-list': {
    q: 'Why does the VM keep the open-upvalue list sorted by slot?',
    a: 'Closing walks from the highest slot down and can stop at the first one below the boundary; searching can stop early too.',
  },
  'close-when': {
    q: 'At which two moments does the VM close upvalues?',
    a: 'At `OP_RETURN` (every slot of the returning frame), and at `OP_CLOSE_UPVALUE` when a captured local leaves a block.',
  },
  'closed-def': {
    q: 'After an upvalue is closed, where does its value live, and what is its `slot`?',
    a: 'In its own `closed` field, on the heap. `slot` is `-1`.',
  },
  'is-captured': {
    q: 'What would go wrong if `endScope` emitted `OP_POP` for a captured block local?',
    a: 'The upvalue would stay open, pointing at a slot that later code reuses, so the closure would read the wrong value.',
  },
};

export const examples = {};

export const exercises = {
  captureClose: {
    title: 'Capture and close',
    prompt:
      'A tiny model of the VM’s upvalues. `vm.stack` is an array of values and `vm.open` is an array of open upvalues, each `{ slot, closed }` (unsorted here, to keep it short). Write `capture(vm, slot)`: return the open upvalue for `slot` if there is one, otherwise make `{ slot, closed: null }`, add it to `vm.open` and return it. Write `closeFrom(vm, last)`: close every open upvalue whose slot is `>= last` (copy the value, set `slot` to `-1`) and remove it from `vm.open`. `read` is given.',
    starter: `function capture(vm, slot) {
  // reuse an open upvalue for slot,
  // or make and remember a new one
}

function closeFrom(vm, last) {
  // close upvalues with slot >= last
}

function read(vm, u) {
  return u.slot === -1
    ? u.closed
    : vm.stack[u.slot];
}`,
    solution: `function capture(vm, slot) {
  for (const u of vm.open) {
    if (u.slot === slot) return u;
  }
  const u = { slot, closed: null };
  vm.open.push(u);
  return u;
}

function closeFrom(vm, last) {
  for (const u of vm.open) {
    if (u.slot >= last) {
      u.closed = vm.stack[u.slot];
      u.slot = -1;
    }
  }
  vm.open = vm.open.filter(
    (u) => u.slot !== -1,
  );
}

function read(vm, u) {
  return u.slot === -1
    ? u.closed
    : vm.stack[u.slot];
}`,
    tests: `const fresh = () => ({
  stack: [10, 20, 30],
  open: [],
});
test('an open upvalue reads the stack', () => {
  const vm = fresh();
  const u = capture(vm, 1);
  expect(read(vm, u)).toBe(20);
  vm.stack[1] = 21;
  expect(read(vm, u)).toBe(21);
  expect(vm.open.length).toBe(1);
});
test('one slot, one shared upvalue', () => {
  const vm = fresh();
  const a = capture(vm, 2);
  const b = capture(vm, 2);
  expect(a === b).toBe(true);
  expect(vm.open.length).toBe(1);
});
test('closing keeps the value', () => {
  const vm = fresh();
  const u = capture(vm, 1);
  closeFrom(vm, 1);
  vm.stack[1] = 'reused';
  expect(read(vm, u)).toBe(20);
  expect(u.slot).toBe(-1);
  expect(vm.open.length).toBe(0);
});
test('slots below last stay open', () => {
  const vm = fresh();
  const lo = capture(vm, 0);
  const hi = capture(vm, 2);
  closeFrom(vm, 1);
  expect(lo.slot).toBe(0);
  expect(hi.slot).toBe(-1);
  expect(vm.open.length).toBe(1);
  expect(vm.open[0] === lo).toBe(true);
});
test('a closed slot gets a new upvalue', () => {
  const vm = fresh();
  const u = capture(vm, 1);
  closeFrom(vm, 1);
  const v = capture(vm, 1);
  expect(v === u).toBe(false);
  expect(v.slot).toBe(1);
});`,
    hints: [
      '`capture`: loop over `vm.open` and return any upvalue whose `slot` equals the one asked for. Only if none matches, create one and push it.',
      '`closeFrom`: for each open upvalue with `u.slot >= last`, first copy `vm.stack[u.slot]` into `u.closed`, *then* set `u.slot = -1`. The order matters.',
      'Finish `closeFrom` by keeping only the upvalues that are still open: `vm.open = vm.open.filter((u) => u.slot !== -1);`.',
    ],
    walkthrough: `This is \`captureUpvalue\` and \`closeUpvalues\` from the companion VM, with a plain array instead of a sorted list.

\`\`\`js
function capture(vm, slot) {
  for (const u of vm.open) {
    if (u.slot === slot) return u;
  }
  const u = { slot, closed: null };
  vm.open.push(u);
  return u;
}
\`\`\`

- **Reuse before you create.** Two closures that capture the same variable must share it, so if an upvalue for that slot is already open, return *that* object. The second test checks this.

\`\`\`js
function closeFrom(vm, last) {
  for (const u of vm.open) {
    if (u.slot >= last) {
      u.closed = vm.stack[u.slot];
      u.slot = -1;
    }
  }
  vm.open = vm.open.filter(
    (u) => u.slot !== -1,
  );
}
\`\`\`

- **Copy, then mark.** Once \`slot\` is \`-1\` you can no longer find the stack value, so the copy must come first.
- **Only \`>= last\`.** A returning frame owns the slots from its base upwards. Upvalues below that belong to frames that are still running and must stay open (the fourth test).
- **Remove closed ones from the open list.** Otherwise a later \`capture\` of the same slot would hand out a closed upvalue, and a new variable in that slot would be wrongly tied to the old value (the last test).

The real VM keeps the list sorted by slot, highest first, so \`closeUpvalues\` can stop at the first upvalue below \`last\` instead of checking them all.`,
    wrong: [
      {
        code: `function capture(vm, slot) {
  for (const u of vm.open) {
    if (u.slot === slot) return u;
  }
  const u = { slot, closed: null };
  vm.open.push(u);
  return u;
}

function closeFrom(vm, last) {
  for (const u of vm.open) {
    if (u.slot >= last) u.slot = -1;
  }
  vm.open = vm.open.filter(
    (u) => u.slot !== -1,
  );
}

function read(vm, u) {
  return u.slot === -1
    ? u.closed
    : vm.stack[u.slot];
}`,
        why: 'It marks the upvalues closed but never copies the value, so reading one afterwards gives `null`. Closing means moving the value off the stack.',
      },
      {
        code: `function capture(vm, slot) {
  const u = { slot, closed: null };
  vm.open.push(u);
  return u;
}

function closeFrom(vm, last) {
  for (const u of vm.open) {
    if (u.slot >= last) {
      u.closed = vm.stack[u.slot];
      u.slot = -1;
    }
  }
  vm.open = vm.open.filter(
    (u) => u.slot !== -1,
  );
}

function read(vm, u) {
  return u.slot === -1
    ? u.closed
    : vm.stack[u.slot];
}`,
        why: 'Every capture makes a new upvalue, so two closures over the same variable get two upvalues. After closing, each holds its own copy, and a write through one is invisible to the other.',
      },
    ],
  },
  perPass: {
    optional: true,
    title: 'A closed upvalue per pass',
    lang: 'drip-vm',
    prompt:
      'On the VM, this loop saves three closures, and every one prints `4`. Fix it **without** adding a function: change only the loop body so that `f1()`, `f2()` and `f3()` print `1`, `2` and `3`.',
    starter: `let f1;
let f2;
let f3;
let i = 1;
while i <= 3 {
  fn show() { print i; }
  if i == 1 { f1 = show; }
  if i == 2 { f2 = show; }
  if i == 3 { f3 = show; }
  i = i + 1;
}
f1();
f2();
f3();`,
    solution: `let f1;
let f2;
let f3;
for i in 1..4 {
  let j = i;
  fn show() { print j; }
  if i == 1 { f1 = show; }
  if i == 2 { f2 = show; }
  if i == 3 { f3 = show; }
}
f1();
f2();
f3();`,
    tests: `1
2
3`,
    hints: [
      'All three closures captured the same slot: the one `i` the `for` declares. That upvalue is closed only once, when the loop’s scope ends, and by then `i` is 4.',
      'A local declared *inside* the body leaves scope at the end of every pass, so the compiler emits `OP_CLOSE_UPVALUE` for it each time.',
      'Add `let j = i;` as the first line of the body and print `j` instead of `i`.',
    ],
    walkthrough: `In the starter, every \`show\` captures \`i\`. There is one \`i\`, in one stack slot, so \`captureUpvalue\` hands all three closures the *same* open upvalue. It is closed only when the \`for\` scope ends, after the loop, and the last value written to that slot was 4.

\`\`\`
for (let i = 1; i <= 3; i = i + 1) {
  let j = i;
  fn show() { print j; }
  ...
}
\`\`\`

Now each \`show\` captures \`j\`. \`j\` is a local of the body block, and \`resolveUpvalue\` marked it \`isCaptured\`, so at the body's closing brace the compiler emitted \`OP_CLOSE_UPVALUE\` instead of \`OP_POP\`. Every pass therefore closes its upvalue, copying that pass's \`j\` into the heap, and the next pass's \`captureUpvalue\` finds no open upvalue for the slot and makes a fresh one. Three passes, three closed upvalues, three values.`,
    wrong: [
      {
        code: `let f1;
let f2;
let f3;
let j;
for i in 1..4 {
  j = i;
  fn show() { print j; }
  if i == 1 { f1 = show; }
  if i == 2 { f2 = show; }
  if i == 3 { f3 = show; }
}
f1();
f2();
f3();`,
        why: 'This `j` is a global, not a local, so no upvalue is involved at all: every `show` reads the one global `j`, which ends at 3. The copy must be a local declared inside the body.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In the VM, why doesn’t `n` survive on its own after `makeCounter` returns?',
    options: [
      { t: 'It lives in a stack slot, and returning frees the frame’s slots for reuse', correct: true, why: '`OP_RETURN` sets the stack top back to the frame’s base, so the next call writes over the slot.' },
      { t: 'The garbage collector frees it immediately', why: '`n` is a number in a stack slot, not a heap object. The problem is slot reuse, not collection.' },
      { t: 'The compiler deletes unused locals', why: '`n` is used, by `count`. The compiler keeps it and marks it captured.' },
      { t: 'Numbers can’t be captured, only objects', why: 'Any value can be captured. The upvalue copies whatever is in the slot.' },
    ],
  },
  {
    q: 'A closure is created with the pairs `local 1` and `upvalue 0`. What does it get?',
    options: [
      { t: 'Two new upvalues, both for slot 1', why: 'Only the `local` pair captures a slot. The other pair reuses an existing upvalue.' },
      { t: 'Upvalue 0 captures slot 1 of the running frame; upvalue 1 is the running closure’s upvalue 0', correct: true, why: 'Pairs are read in order. `isLocal` captures a frame slot; otherwise the enclosing closure’s upvalue is shared.' },
      { t: 'Copies of the values in slot 1 and upvalue 0', why: 'It gets upvalue *objects*, not copies. That is what lets closures share variables.' },
      { t: 'Global variables named 1 and 0', why: 'Globals go through the global table by name, not through upvalues.' },
    ],
  },
  {
    q: 'Two closures made in the same call capture the same local, and one of them changes it. What does the other see?',
    options: [
      { t: 'The old value, because each has its own copy', why: '`captureUpvalue` reuses the open upvalue, so there is only one.' },
      { t: 'It depends on whether the call has returned', why: 'Open or closed, both closures hold the same upvalue object, so they always agree.' },
      { t: 'A runtime error', why: 'Writing through an upvalue is ordinary `OP_SET_UPVALUE`.' },
      { t: 'The new value', correct: true, why: 'They share one upvalue: while open it points at the same slot, and once closed it is the same `closed` field.' },
    ],
  },
  {
    q: 'What does `closeUpvalues(last)` do to each open upvalue whose slot is at least `last`?',
    options: [
      { t: 'Frees it', why: 'The closure still needs it. Closing keeps the upvalue and moves the value into it.' },
      { t: 'Copies `stack[slot]` into `closed`, sets `slot` to −1, and unlinks it from the open list', correct: true, why: 'That is the whole of closing: the value moves to the heap, and the upvalue stops pointing at the stack.' },
      { t: 'Copies the value into a new stack slot', why: 'The stack is exactly what is going away. The value moves into the upvalue object.' },
      { t: 'Moves it to the end of the open list', why: 'A closed upvalue leaves the open list for good.' },
    ],
  },
  {
    q: 'Where does the compiler emit `OP_CLOSE_UPVALUE`?',
    options: [
      { t: 'After every `OP_CLOSURE`', why: 'Creating a closure opens upvalues; it doesn’t close any.' },
      { t: 'Before every `OP_RETURN`', why: '`OP_RETURN` closes the frame’s upvalues itself, so no extra instruction is needed there.' },
      { t: 'When a block ends, for each local in it that a closure captured', correct: true, why: '`endScope` emits `OP_CLOSE_UPVALUE` instead of `OP_POP` for locals marked `isCaptured`.' },
      { t: 'At the end of the whole program', why: 'By then it would be far too late: the slots would already have been reused.' },
    ],
  },
  {
    q: 'Why is the open-upvalue list sorted by stack slot?',
    options: [
      { t: 'So the garbage collector can find it', why: 'The collector marks every open upvalue whatever the order.' },
      { t: 'So printing closures is deterministic', why: 'Printing a closure shows its function name; upvalues aren’t involved.' },
      { t: 'Because slots are always captured in increasing order', why: 'They aren’t: a closure can capture a high slot and then a low one. `captureUpvalue` inserts each in the right place.' },
      { t: 'So closing can stop at the first upvalue below the boundary, and searching can stop early', correct: true, why: 'A returning frame owns the top of the stack, so its upvalues are exactly the first ones on a highest-first list.' },
    ],
  },
];
