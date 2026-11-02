// Chapter 156b cards (split from chapter 156). Keys are stable ids.

export const prompts = {
  'close-when': {
    q: 'At which two kinds of moment does the VM close upvalues?',
    a: 'At `return` (every open upvalue at or above the leaving frame’s start), and at `close.upvalue`, when a captured local leaves a block.',
  },
  'closed-def': {
    q: 'After an upvalue is closed, where does its value live, and what is its `slot`?',
    a: 'In its own `closed` field, on the heap; `slot` is `-1`.',
  },
  'copy-first': {
    q: 'Why must `closeUpvalues` copy `stack[u.slot]` into `u.closed` *before* it sets `u.slot = -1`?',
    a: 'Once `slot` is `-1`, the upvalue no longer says where the value was, so the copy would read the wrong place.',
  },
  'sorted-stop': {
    q: 'Why can `closeUpvalues(last)` stop at the first open upvalue whose slot is below `last`?',
    a: 'The list is sorted highest first, so every upvalue after that one is lower still and belongs to a frame that is still running.',
  },
  'is-captured': {
    q: 'What would go wrong if `endScope` emitted `pop` for a captured block local instead of `close.upvalue`?',
    a: 'The upvalue would stay open, pointing at a slot that later code reuses, so the closure would read a stranger’s value.',
  },
  'fresh-pass': {
    q: 'How does the compiler give each pass of a `for` loop a fresh loop variable?',
    a: 'It compiles the variable as a local in a scope of its own inside the loop, so the scope ends, and a captured variable is closed, at the end of every pass.',
  },
  'while-shares': {
    q: 'Three closures are made in a `while` loop over a local `i` declared before the loop. Why do they all see the same value?',
    a: 'They all capture the same slot, so `captureUpvalue` gives them one upvalue, which is closed only once, after the loop.',
  },
  'assign-i': {
    q: 'In `for i in 0..3 { i = 10; print i; }`, what is printed, and why does the loop still run three times?',
    a: '`10` three times: `i` is a copy of a hidden counter, and `inc.local` steps the counter, not `i`.',
  },
};

export const examples = {
  passes: {
    title: 'A while loop shares, a for loop does not',
    lang: 'drip-vm',
    code: `fn main() {
  let fs = [];
  let i = 0;
  while i < 3 {
    push(fs, fn () { return i; });
    i += 1;
  }
  for i in 0..3 {
    push(fs, fn () { return i; });
  }
  for f in fs { print f(); }
}
main();`,
  },
};

export const exercises = {
  closeFrom: {
    title: 'Close a frame’s upvalues',
    prompt:
      'A tiny model of the VM. `vm.stack` is an array of values, and `vm.open` is the array of open upvalues `{ slot, closed }`, sorted by `slot` with the **highest first**. Write `closeFrom(vm, last)`: close every open upvalue whose slot is `>= last` (copy the value from the stack into `closed`, then set `slot` to `-1`) and remove it from `vm.open`, stopping at the first one below `last`. `read` is given.',
    starter: `function closeFrom(vm, last) {
  // close upvalues with slot >= last
}

function read(vm, u) {
  return u.slot === -1
    ? u.closed
    : vm.stack[u.slot];
}`,
    solution: `function closeFrom(vm, last) {
  while (vm.open.length > 0 &&
         vm.open[0].slot >= last) {
    const u = vm.open.shift();
    u.closed = vm.stack[u.slot];
    u.slot = -1;
  }
}

function read(vm, u) {
  return u.slot === -1
    ? u.closed
    : vm.stack[u.slot];
}`,
    tests: `const up = (slot) => ({ slot, closed: null });
test('closing keeps the value', () => {
  const vm = { stack: [10, 20, 30], open: [] };
  const u = up(1);
  vm.open.push(u);
  closeFrom(vm, 1);
  vm.stack[1] = 'reused';
  expect(read(vm, u)).toBe(20);
  expect(u.slot).toBe(-1);
  expect(vm.open.length).toBe(0);
});
test('slots below last stay open', () => {
  const vm = { stack: [10, 20, 30], open: [] };
  const hi = up(2);
  const lo = up(0);
  vm.open.push(hi, lo);
  closeFrom(vm, 1);
  expect(hi.slot).toBe(-1);
  expect(hi.closed).toBe(30);
  expect(lo.slot).toBe(0);
  expect(vm.open.length).toBe(1);
  expect(vm.open[0] === lo).toBe(true);
});
test('closes every slot at or above', () => {
  const vm = { stack: [1, 2, 3, 4], open: [] };
  const a = up(3);
  const b = up(2);
  vm.open.push(a, b);
  closeFrom(vm, 2);
  expect(a.closed).toBe(4);
  expect(b.closed).toBe(3);
  expect(vm.open.length).toBe(0);
});
test('nothing to close', () => {
  const vm = { stack: [1, 2], open: [] };
  const u = up(0);
  vm.open.push(u);
  closeFrom(vm, 1);
  expect(u.slot).toBe(0);
  expect(vm.open.length).toBe(1);
});`,
    hints: [
      'Because the array is sorted highest first, the upvalues to close are all at the front. Keep looking at `vm.open[0]`.',
      'Loop while there is a first upvalue and its slot is `>= last`. Inside, take it off the front with `vm.open.shift()`.',
      'For each one: `u.closed = vm.stack[u.slot];` first, then `u.slot = -1;`. The order matters.',
    ],
    walkthrough: `**How to think about it.** This is the companion's \`closeUpvalues\`, with an array in place of the linked list. A returning frame owns every stack slot from its start upwards, so the upvalues that point into it are the ones whose slot is \`>= last\`; and because the open list is sorted highest first, those are exactly the ones at the *front*. So we never need to search: keep handling the front upvalue until it is one we must not touch, or until the list is empty.

**The solution, line by line.**

- \`while (vm.open.length > 0 && vm.open[0].slot >= last) {\` keeps going while there is a front upvalue and it points into the leaving frame. The first half stops the loop on an empty list; the second stops it at the first upvalue below \`last\`, which belongs to a frame that is still running (the second and fourth tests).
- \`const u = vm.open.shift();\` removes the front upvalue from the open list and gives it to us. A closed upvalue must leave the list, or a later capture of the same slot would be handed an upvalue that no longer follows the stack.
- \`u.closed = vm.stack[u.slot];\` is the move itself: the value is copied out of the stack slot, which is about to be reused, into the upvalue's own field.
- \`u.slot = -1;\` marks it closed, so \`read\` (and the VM's \`load.upvalue\`) now returns \`u.closed\` instead of looking at the stack.

**Common wrong attempts.**

- Setting \`u.slot = -1\` *before* copying makes \`vm.stack[u.slot]\` read \`vm.stack[-1]\`, which is \`undefined\`, so the closure loses its value.
- Marking upvalues closed without removing them leaves them on the open list; the model still reads correctly, but the third test sees a list that never empties, and in the real VM \`captureUpvalue\` would find and reuse a closed upvalue for a new variable.
- Looping over the whole array with \`>= last\` gives the right answer here, but it throws away the reason the list is sorted: the real VM stops after the frame's own upvalues instead of visiting every open upvalue in the program.`,
    wrong: [
      {
        code: `function closeFrom(vm, last) {
  while (vm.open.length > 0 &&
         vm.open[0].slot >= last) {
    const u = vm.open.shift();
    u.slot = -1;
    u.closed = vm.stack[u.slot];
  }
}

function read(vm, u) {
  return u.slot === -1
    ? u.closed
    : vm.stack[u.slot];
}`,
        why: 'It sets `slot` to -1 first, so the copy reads `vm.stack[-1]`, which is undefined: the value is lost.',
      },
      {
        code: `function closeFrom(vm, last) {
  for (const u of vm.open) {
    if (u.slot >= last) {
      u.closed = vm.stack[u.slot];
      u.slot = -1;
    }
  }
}

function read(vm, u) {
  return u.slot === -1
    ? u.closed
    : vm.stack[u.slot];
}`,
        why: 'The values are copied, but the closed upvalues stay on the open list, so `vm.open` never shrinks.',
      },
    ],
  },
  perPass: {
    optional: true,
    title: 'A closed upvalue per pass',
    lang: 'drip-vm',
    prompt:
      'Inside `main`, this `while` loop saves three closures, and every one prints `4`. Without changing the `while` line or the calls at the end, change the loop body so that the three closures print `1`, `2` and `3`.',
    starter: `fn main() {
  let fs = [];
  let i = 1;
  while i <= 3 {
    push(fs, fn () { print i; });
    i += 1;
  }
  return fs;
}
let fs = main();
fs[0]();
fs[1]();
fs[2]();`,
    solution: `fn main() {
  let fs = [];
  let i = 1;
  while i <= 3 {
    let j = i;
    push(fs, fn () { print j; });
    i += 1;
  }
  return fs;
}
let fs = main();
fs[0]();
fs[1]();
fs[2]();`,
    tests: `1
2
3`,
    hints: [
      'All three closures capture the same slot, `i`’s, so they share one upvalue. It is closed only when `main` returns, and by then `i` is 4.',
      'A local declared *inside* the loop body leaves scope at the body’s `}` on every pass. If a closure captured it, the compiler emits `close.upvalue` there.',
      'Add `let j = i;` as the first line of the body, and have the closure print `j`.',
    ],
    walkthrough: `**How to think about it.** Ask which slot each closure captures. In the starter, every closure names \`i\`, a local of \`main\` declared before the loop, so all three capture the same slot. \`captureUpvalue\` finds the open upvalue for that slot on the second and third passes and hands it out again, so the three closures share one upvalue, and it is closed only when \`main\` returns, after \`i += 1\` has made it 4. To get three values we need three upvalues, which means a variable that leaves scope on every pass.

**The solution, line by line.**

- \`let j = i;\` declares a new local in the loop body's own scope and copies the current \`i\` into it. Because the closure below mentions \`j\`, \`resolveUpvalue\` marks \`j\` as captured.
- \`push(fs, fn () { print j; });\` makes a closure with the pair \`local 3\` (j's slot), and \`captureUpvalue\` makes a fresh open upvalue for it.
- \`i += 1;\` steps the shared counter; nothing captured it now.
- The body's \`}\` runs \`endScope\`, which emits \`close.upvalue\` for \`j\` (not \`pop\`), so at the end of each pass that pass's upvalue copies \`j\` into itself and leaves the open list. The next pass's \`captureUpvalue\` finds nothing open for the slot and makes a new upvalue. Three passes, three closed upvalues holding 1, 2 and 3.

**Common wrong attempts.**

- Writing \`let j;\` before the loop and \`j = i;\` inside only moves the problem: \`j\` is one variable in one slot, shared by all three closures, which then print \`3\`.
- Rewriting the loop as \`for i in 1..4\` would also work (that is the point of the chapter), but the exercise asks you to keep the \`while\`, to see the mechanism the \`for\` loop uses for you.`,
    wrong: [
      {
        code: `fn main() {
  let fs = [];
  let i = 1;
  let j;
  while i <= 3 {
    j = i;
    push(fs, fn () { print j; });
    i += 1;
  }
  return fs;
}
let fs = main();
fs[0]();
fs[1]();
fs[2]();`,
        why: 'This `j` is declared once, before the loop, so all three closures share its one upvalue, and they print 3, 3, 3.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does `closeUpvalues(last)` do to each open upvalue whose slot is at least `last`?',
    options: [
      { t: 'Frees it', why: 'The closure still needs it. Closing keeps the upvalue and moves the value into it.' },
      { t: 'Copies the value into a new stack slot', why: 'The stack is exactly what is going away; the value moves into the upvalue object.' },
      { t: 'Copies `stack[slot]` into `closed`, sets `slot` to −1, and unlinks it from the open list', correct: true, why: 'That is the whole of closing: the value moves to the heap, and the upvalue stops pointing at the stack.' },
      { t: 'Moves it to the end of the open list', why: 'A closed upvalue leaves the open list for good.' },
    ],
  },
  {
    q: 'Where does the compiler emit `close.upvalue`?',
    options: [
      { t: 'When a scope ends, or a `break` or `continue` leaves one, for each local that a closure captured', correct: true, why: '`endScope` and `popLocalsDeeperThan` emit `close.upvalue` instead of `pop` for locals marked `isCaptured`.' },
      { t: 'After every `closure`', why: 'Making a closure opens upvalues; it does not close any.' },
      { t: 'Before every `return`', why: '`return` closes the frame’s upvalues itself, with `closeUpvalues(frame.slots)`.' },
      { t: 'At the end of the program only', why: 'That would be far too late: the slots would long since have been reused.' },
    ],
  },
  {
    q: 'What does this print on the VM? `let fs = []; for i in 0..3 { push(fs, fn () { return i; }); } for f in fs { print f(); }`',
    options: [
      { t: '3, 3, 3', why: 'That is what a `while` loop over one local would print. Each pass of a `for` loop has a fresh `i`.' },
      { t: '2, 2, 2', why: 'Each closure has its own closed upvalue, so they do not all see the last value.' },
      { t: '0, 1, 2', correct: true, why: '`i` is a local in a scope inside the loop, closed by `close.upvalue` at the end of each pass, so each closure keeps that pass’s value.' },
      { t: 'A runtime error, because `i` is gone after the loop', why: 'The values live in closed upvalues on the heap, which the closures still hold.' },
    ],
  },
  {
    q: 'Two closures shared one open upvalue, and then their function returned. What do they share now?',
    options: [
      { t: 'Nothing: each got its own copy when the upvalue closed', why: 'Closing changes the one upvalue object in place; both closures still hold it.' },
      { t: 'One closed upvalue, so a write through either is seen by the other', correct: true, why: 'Open or closed, it is the same object, so they keep agreeing.' },
      { t: 'The old stack slot', why: 'The slot has been given away; that is why the value was copied out.' },
      { t: 'A global variable', why: 'No global is involved; the value lives in the upvalue’s `closed` field.' },
    ],
  },
  {
    q: 'Why does `close.upvalue` run `this.closeUpvalues(this.sp - 1)`?',
    options: [
      { t: 'To close every upvalue in the program', why: 'It closes only upvalues at or above that slot, which is the one local leaving scope.' },
      { t: 'Because `sp - 1` is the frame’s slot 0', why: '`sp - 1` is the top of the stack, the slot of the local being popped.' },
      { t: 'To skip the top slot and close the one below it', why: 'The comparison is `>=`, so the top slot itself is included.' },
      { t: 'The local leaving scope is on top of the stack, so this closes its upvalue (and nothing lower) before the slot is popped', correct: true, why: 'Locals leave scope in reverse order, so the captured one is the top slot.' },
    ],
  },
];
