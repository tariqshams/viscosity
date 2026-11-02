// Chapter 83 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'slot-dies': {
    q: 'Why can’t a VM closure simply remember the stack slot number of a variable it captured?',
    a: 'When the function returns, its slots are cut off the stack and the next call reuses them, so the slot would hold someone else’s value.',
  },
  'upvalue-def': {
    q: 'What is an upvalue?',
    a: 'A closure’s handle on a variable declared in an enclosing function; the closure reaches the variable only through it.',
  },
  'is-local-pair': {
    q: 'In the companion Drip VM’s bytecode, what does the pair `local 1` after a `closure` instruction mean, and what does `upvalue 0` mean?',
    a: '`local 1`: capture slot 1 of the frame that is running now. `upvalue 0`: reuse upvalue 0 of the closure that is running now.',
  },
  'three-levels': {
    q: 'In a VM that captures variables with upvalues, `inner` uses `x` from `outer` and is declared inside `middle`. Why does `middle` get an upvalue for `x` even though it never uses `x`?',
    a: 'So `inner` has something to copy: by the time `inner` is made, `outer`’s frame may be gone, but `middle`’s closure still holds the upvalue.',
  },
  'shared-upvalue': {
    q: 'In the companion Drip VM, two closures made in one call both capture the local `n`. How many upvalue objects are there for `n`?',
    a: 'One. `captureUpvalue` finds the open upvalue for that slot and returns it, so both closures share it.',
  },
  'close-when': {
    q: 'At which two kinds of moment does the companion Drip VM close upvalues?',
    a: 'At `return` (every open upvalue at or above the leaving frame’s start), and at `close.upvalue`, when a captured local leaves a block.',
  },
  'fresh-pass': {
    q: 'How does the companion Drip compiler give each pass of a `for` loop a fresh loop variable?',
    a: 'It compiles the variable as a local in a scope of its own inside the loop, so the scope ends, and a captured variable is closed, at the end of every pass.',
  },
  'while-shares': {
    q: 'In Drip, three closures are made in a `while` loop over a local `i` declared before the loop. Why do they all see the same value?',
    a: 'They all capture the same slot, so `captureUpvalue` gives them one upvalue, which is closed only once, after the loop.',
  },
};

export const examples = {
  share: {
    title: 'Two closures, one variable',
    lang: 'drip-vm',
    code: `fn pair() {
  let v = 0;
  fn get() { return v; }
  fn set(x) { v = x; }
  return [get, set];
}
let p = pair();
p[1](7);
print p[0]();`,
  },
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
    prompt: 'A tiny model of the VM. `vm.stack` is an array of values, and `vm.open` is the array of open upvalues `{ slot, closed }`, sorted by `slot` with the **highest first**. Write `closeFrom(vm, last)`: close every open upvalue whose slot is `>= last` (copy the value from the stack into `closed`, then set `slot` to `-1`) and remove it from `vm.open`, stopping at the first one below `last`. `read` is given.',
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
  captureSorted: {
    optional: true,
    title: 'Capture, sorted',
    prompt: 'A tiny model of the VM’s open list. `vm.open` is an array of upvalues `{ slot, closed }`, kept sorted by `slot` with the **highest first**. Write `capture(vm, slot)`: if an upvalue for `slot` is already in `vm.open`, return it; otherwise make `{ slot, closed: null }`, insert it so the array stays sorted highest first, and return it. (`vm.open.splice(i, 0, u)` inserts `u` at position `i`.)',
    starter: `function capture(vm, slot) {
  // reuse, or insert in sorted place
}`,
    solution: `function capture(vm, slot) {
  let i = 0;
  while (i < vm.open.length &&
         vm.open[i].slot > slot) {
    i++;
  }
  const u = vm.open[i];
  if (u && u.slot === slot) return u;
  const made = { slot, closed: null };
  vm.open.splice(i, 0, made);
  return made;
}`,
    tests: `const fresh = () => ({ open: [] });
const slots = (vm) =>
  vm.open.map((u) => u.slot);
test('makes an upvalue', () => {
  const vm = fresh();
  const u = capture(vm, 2);
  expect(u.slot).toBe(2);
  expect(u.closed).toBe(null);
  expect(vm.open.length).toBe(1);
});
test('one slot, one shared upvalue', () => {
  const vm = fresh();
  const a = capture(vm, 2);
  const b = capture(vm, 2);
  expect(a === b).toBe(true);
  expect(vm.open.length).toBe(1);
});
test('stays sorted, highest first', () => {
  const vm = fresh();
  capture(vm, 3);
  capture(vm, 1);
  capture(vm, 2);
  expect(slots(vm)).toEqual([3, 2, 1]);
});
test('reuse in the middle', () => {
  const vm = fresh();
  capture(vm, 5);
  const mid = capture(vm, 3);
  capture(vm, 1);
  expect(capture(vm, 3) === mid).toBe(true);
  expect(slots(vm)).toEqual([5, 3, 1]);
});`,
    hints: [
      'There are two jobs: find the place where `slot` belongs, then either reuse what is there or insert a new upvalue there. Find the place first.',
      'Walk with an index `i` from 0 while `vm.open[i].slot > slot`. When the loop stops, `vm.open[i]` is either the upvalue for `slot`, a lower slot, or nothing at all.',
      'After the loop: `if (u && u.slot === slot) return u;` and otherwise `vm.open.splice(i, 0, made)` puts the new upvalue exactly at the sorted spot.',
    ],
    walkthrough: `**How to think about it.** This is the companion's \`captureUpvalue\`, with an array in place of the linked list. On a list sorted highest first, every upvalue for a *higher* slot comes before the one we want, and every *lower* one after; so if we walk from the front and stop at the first upvalue whose slot is not higher, we are standing exactly where our slot belongs. If the upvalue there is for our slot, we share it; if not, that is the spot to insert, and the array stays sorted without any sorting.

**The solution, line by line.**

- \`let i = 0;\` starts at the front, the highest slot.
- \`while (i < vm.open.length && vm.open[i].slot > slot) { i++; }\` steps past every upvalue for a higher slot. The first half of the condition stops it falling off the end; the second is the "keep going while it is higher" test, which is the same \`u.slot > slot\` the VM uses.
- \`const u = vm.open[i];\` is whatever sits at the stopping place: maybe the one we want, maybe a lower slot, maybe \`undefined\` if we walked off the end.
- \`if (u && u.slot === slot) return u;\` is the sharing rule. Two closures that capture one variable must get the same object, or a write through one would never be seen by the other (the second and fourth tests).
- \`const made = { slot, closed: null };\` makes a new, open upvalue. \`closed\` is unused while it is open; closing fills it in.
- \`vm.open.splice(i, 0, made);\` inserts it at position \`i\`, removing nothing (the \`0\`), so it lands between the higher slots and the lower ones.
- \`return made;\` hands it to the closure.

**Common wrong attempts.**

- Pushing every new upvalue onto the end with \`vm.open.push(made)\` works for sharing but breaks the order: capturing 3, then 1, then 2 gives \`[3, 1, 2]\`, and the real VM's closing loop would then stop too early and leave an upvalue open.
- Making a new upvalue every time, without the reuse check, gives two closures two upvalues for one variable; each then follows the slot separately, and once they are closed they hold separate copies.
- Using \`>=\` in the loop walks *past* the upvalue for our own slot, so it is never found and a duplicate is inserted after it.`,
    wrong: [
      {
        code: `function capture(vm, slot) {
  for (const u of vm.open) {
    if (u.slot === slot) return u;
  }
  const made = { slot, closed: null };
  vm.open.push(made);
  return made;
}`,
        why: 'Sharing works, but new upvalues go on the end, so capturing 3, 1, 2 leaves the list as [3, 1, 2] instead of [3, 2, 1].',
      },
      {
        code: `function capture(vm, slot) {
  let i = 0;
  while (i < vm.open.length &&
         vm.open[i].slot > slot) {
    i++;
  }
  const made = { slot, closed: null };
  vm.open.splice(i, 0, made);
  return made;
}`,
        why: 'It keeps the order but never reuses an upvalue, so two captures of one slot give two different objects.',
      },
    ],
  },
  sharedCount: {
    optional: true,
    title: 'A shared tally',
    lang: 'drip-vm',
    prompt: 'Write `fn tally()` so that it returns a list of two functions over one shared count: the first adds 1 to the count, the second returns it. The program should print `2`, then `0` (the second tally has its own count).',
    starter: `fn tally() {
  # make the count, then two
  # functions that share it
}
let t = tally();
let u = tally();
t[0]();
t[0]();
print t[1]();
print u[1]();`,
    solution: `fn tally() {
  let n = 0;
  fn add() { n += 1; }
  fn get() { return n; }
  return [add, get];
}
let t = tally();
let u = tally();
t[0]();
t[0]();
print t[1]();
print u[1]();`,
    tests: `2
0`,
    hints: [
      'The count must be a local of `tally`, so that each call of `tally` gets a count of its own.',
      'Declare `let n = 0;` first, then two named functions inside `tally` that both mention `n`. Both capture slot 1, and `captureUpvalue` gives them the same upvalue.',
      '`fn add() { n += 1; }`, `fn get() { return n; }`, and finally `return [add, get];`.',
    ],
    walkthrough: `**How to think about it.** We want two functions that agree about one number, and a second, separate number for the second call of \`tally\`. A local of \`tally\` gives exactly that: each call has its own frame, so its own slot for \`n\`, and the two inner functions made in that call both capture that slot.

**The solution, line by line.**

- \`let n = 0;\` puts the count in slot 1 of \`tally\`'s frame (slot 0 holds the function being called).
- \`fn add() { n += 1; }\` makes a closure with the pair \`local 1\`. There is no open upvalue for that slot yet, so \`captureUpvalue\` makes one. Its body is \`load.upvalue 0\`, \`const 1\`, \`add\`, \`store.upvalue 0\`.
- \`fn get() { return n; }\` also has the pair \`local 1\`, and this time \`captureUpvalue\` finds the open upvalue for slot 1 and returns it: one upvalue, two closures.
- \`return [add, get];\` builds a list of the two closures and returns it. (What happens to the upvalue when \`tally\` returns, the upvalue is closed, and it keeps working.)
- \`t[0](); t[0]();\` adds 1 twice through the shared upvalue, so \`print t[1]();\` prints \`2\`.
- \`u\` came from a second call of \`tally\`, with its own \`n\` and its own upvalue, so \`print u[1]();\` prints \`0\`.

**Common wrong attempts.**

- Declaring \`let n = 0;\` at the top level, outside \`tally\`, makes \`n\` a global: both tallies share it, so the program prints \`2\` and then \`2\`.
- Writing \`fn get() { let m = n; return m; }\` is fine, but \`fn add() { let n = 1; }\` declares a *new* local and leaves the shared one alone, so the count stays 0.`,
    wrong: [
      {
        code: `let n = 0;
fn tally() {
  fn add() { n += 1; }
  fn get() { return n; }
  return [add, get];
}
let t = tally();
let u = tally();
t[0]();
t[0]();
print t[1]();
print u[1]();`,
        why: 'Here `n` is a global, so every tally shares it and the second line prints 2, not 0.',
      },
    ],
  },
  perPass: {
    optional: true,
    title: 'A closed upvalue per pass',
    lang: 'drip-vm',
    prompt: 'Inside `main`, this `while` loop saves three closures, and every one prints `4`. Without changing the `while` line or the calls at the end, change the loop body so that the three closures print `1`, `2` and `3`.',
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
    q: 'In the companion Drip VM, a closure is made with the pairs `local 1` and `upvalue 0`, in that order. What does it get?',
    options: [
      {
        t: 'Its upvalue 0 captures slot 1 of the running frame; its upvalue 1 is the running closure’s upvalue 0',
        correct: true,
        why: 'Pairs are read in order. A local pair captures a frame slot; an upvalue pair shares the enclosing closure’s upvalue.',
      },
      {
        t: 'Two new upvalues, both for slot 1',
        why: 'Only the `local` pair captures a slot. The other pair reuses an existing upvalue.',
      },
      {
        t: 'Copies of the values in slot 1 and in upvalue 0',
        why: 'It gets upvalue *objects*, not copies; that is what lets closures share variables.',
      },
      {
        t: 'Global variables named 1 and 0',
        why: 'Globals are looked up by name in the global table, not through upvalues.',
      },
    ],
  },
  {
    q: 'In Drip, two closures made in the same call capture the same local, and one of them changes it. What does the other see?',
    options: [
      {
        t: 'The old value, because each has its own copy',
        why: '`captureUpvalue` reuses the open upvalue, so there is only one.',
      },
      {
        t: 'A runtime error',
        why: 'Writing through an upvalue is an ordinary `store.upvalue`.',
      },
      {
        t: 'The new value',
        correct: true,
        why: 'They hold the same upvalue object, which points at the same slot.',
      },
      {
        t: 'The new value only after the call returns',
        why: 'While the upvalue is open, both read the live slot, so they agree at once.',
      },
    ],
  },
  {
    q: 'In the companion Drip VM, what does `closeUpvalues(last)` do to each open upvalue whose slot is at least `last`?',
    options: [
      {
        t: 'Frees it',
        why: 'The closure still needs it. Closing keeps the upvalue and moves the value into it.',
      },
      {
        t: 'Copies the value into a new stack slot',
        why: 'The stack is exactly what is going away; the value moves into the upvalue object.',
      },
      {
        t: 'Copies `stack[slot]` into `closed`, sets `slot` to −1, and unlinks it from the open list',
        correct: true,
        why: 'That is the whole of closing: the value moves to the heap, and the upvalue stops pointing at the stack.',
      },
      {
        t: 'Moves it to the end of the open list',
        why: 'A closed upvalue leaves the open list for good.',
      },
    ],
  },
  {
    q: 'What does this print in Drip? `let fs = []; for i in 0..3 { push(fs, fn () { return i; }); } for f in fs { print f(); }`',
    options: [
      {
        t: '3, 3, 3',
        why: 'That is what a `while` loop over one local would print. Each pass of a `for` loop has a fresh `i`.',
      },
      {
        t: '2, 2, 2',
        why: 'Each closure has its own closed upvalue, so they do not all see the last value.',
      },
      {
        t: 'A runtime error, because `i` is gone after the loop',
        why: 'The values live in closed upvalues on the heap, which the closures still hold.',
      },
      {
        t: '0, 1, 2',
        correct: true,
        why: '`i` is a local in a scope inside the loop, closed by `close.upvalue` at the end of each pass, so each closure keeps that pass’s value.',
      },
    ],
  },
];
