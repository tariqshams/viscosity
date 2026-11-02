// Chapter 156 cards. Keys are stable ids: never rename them.

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
    q: 'After a `closure` instruction, what does the pair `local 1` mean, and what does `upvalue 0` mean?',
    a: '`local 1`: capture slot 1 of the frame that is running now. `upvalue 0`: reuse upvalue 0 of the closure that is running now.',
  },
  'three-levels': {
    q: '`inner` uses `x` from `outer`, and is declared inside `middle`. Why does `middle` get an upvalue for `x` even though it never uses `x`?',
    a: 'So `inner` has something to copy: by the time `inner` is made, `outer`’s frame may be gone, but `middle`’s closure still holds the upvalue.',
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
    q: 'In what order is the open-upvalue list kept, and what does that let `captureUpvalue` do?',
    a: 'Sorted by slot, highest first; the search can stop as soon as it passes the slot it wants, and insert a new upvalue right there.',
  },
  'copy-not': {
    q: 'What would go wrong if the `closure` instruction copied the variable’s current value into the closure instead of making an upvalue?',
    a: 'Changes made after the closure was made would be lost, and two closures could no longer share a variable: `x = 2` before `show()` would still print 1.',
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
};

export const exercises = {
  captureSorted: {
    title: 'Capture, sorted',
    prompt:
      'A tiny model of the VM’s open list. `vm.open` is an array of upvalues `{ slot, closed }`, kept sorted by `slot` with the **highest first**. Write `capture(vm, slot)`: if an upvalue for `slot` is already in `vm.open`, return it; otherwise make `{ slot, closed: null }`, insert it so the array stays sorted highest first, and return it. (`vm.open.splice(i, 0, u)` inserts `u` at position `i`.)',
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
- \`const made = { slot, closed: null };\` makes a new, open upvalue. \`closed\` is unused while it is open; the next chapter fills it in.
- \`vm.open.splice(i, 0, made);\` inserts it at position \`i\`, removing nothing (the \`0\`), so it lands between the higher slots and the lower ones.
- \`return made;\` hands it to the closure.

**Common wrong attempts.**

- Pushing every new upvalue onto the end with \`vm.open.push(made)\` works for sharing but breaks the order: capturing 3, then 1, then 2 gives \`[3, 1, 2]\`, and the real VM's closing loop (next chapter) would then stop too early and leave an upvalue open.
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
    prompt:
      'Write `fn tally()` so that it returns a list of two functions over one shared count: the first adds 1 to the count, the second returns it. The program should print `2`, then `0` (the second tally has its own count).',
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
- \`return [add, get];\` builds a list of the two closures and returns it. (What happens to the upvalue when \`tally\` returns is the next chapter's subject; it keeps working.)
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
};

export const quiz = [
  {
    q: 'In the VM, why doesn’t `n` survive on its own after `counter` returns?',
    options: [
      { t: 'It lives in a stack slot, and returning frees the frame’s slots for reuse', correct: true, why: '`return` cuts the stack back to the frame’s start, so the next call writes over the slot.' },
      { t: 'The garbage collector frees it immediately', why: '`n` is a number in a stack slot, not a heap object. The problem is slot reuse, not collection.' },
      { t: 'The compiler deletes unused locals', why: '`n` is used, by `count`, and the compiler marks it captured.' },
      { t: 'Numbers can’t be captured, only objects', why: 'Any value can be captured: the upvalue reaches whatever is in the slot.' },
    ],
  },
  {
    q: 'A closure is made with the pairs `local 1` and `upvalue 0`, in that order. What does it get?',
    options: [
      { t: 'Two new upvalues, both for slot 1', why: 'Only the `local` pair captures a slot. The other pair reuses an existing upvalue.' },
      { t: 'Copies of the values in slot 1 and in upvalue 0', why: 'It gets upvalue *objects*, not copies; that is what lets closures share variables.' },
      { t: 'Its upvalue 0 captures slot 1 of the running frame; its upvalue 1 is the running closure’s upvalue 0', correct: true, why: 'Pairs are read in order. A local pair captures a frame slot; an upvalue pair shares the enclosing closure’s upvalue.' },
      { t: 'Global variables named 1 and 0', why: 'Globals are looked up by name in the global table, not through upvalues.' },
    ],
  },
  {
    q: '`inner` uses `x` from `outer` and is declared inside `middle`, which never mentions `x`. What does the disassembly of `middle` show after its `closure fn inner`?',
    options: [
      { t: 'Nothing: `middle` does not use `x`', why: '`inner` needs `x`, and the only way to reach it is through `middle`, so `middle` must carry it.' },
      { t: '`upvalue 0`: `inner` copies `middle`’s own upvalue for `x`', correct: true, why: '`resolveUpvalue` recursed outward, gave `middle` an upvalue capturing `outer`’s local, and gave `inner` a pair that reuses it.' },
      { t: '`local 1`: `inner` captures slot 1 of `outer`', why: 'A local pair always refers to the frame running when the closure is made, which is `middle`’s, not `outer`’s.' },
      { t: '`global x`', why: '`x` is a local of `outer`, so it resolves as an upvalue, not a global.' },
    ],
  },
  {
    q: 'Two closures made in the same call capture the same local, and one of them changes it. What does the other see?',
    options: [
      { t: 'The old value, because each has its own copy', why: '`captureUpvalue` reuses the open upvalue, so there is only one.' },
      { t: 'A runtime error', why: 'Writing through an upvalue is an ordinary `store.upvalue`.' },
      { t: 'The new value', correct: true, why: 'They hold the same upvalue object, which points at the same slot.' },
      { t: 'The new value only after the call returns', why: 'While the upvalue is open, both read the live slot, so they agree at once.' },
    ],
  },
  {
    q: 'The open list holds upvalues for slots 7, 4 and 2. A closure captures slot 5. What does `captureUpvalue` do?',
    options: [
      { t: 'Walks past 7, stops at 4, makes a new upvalue for 5 and links it between 7 and 4', correct: true, why: 'The loop runs while `u.slot > slot`; it stops at 4, which is not 5, so a new upvalue goes in at that spot and the list stays 7, 5, 4, 2.' },
      { t: 'Returns the upvalue for slot 4, the nearest one', why: 'It only shares an upvalue for exactly the same slot.' },
      { t: 'Adds the new upvalue at the end of the list', why: 'That would break the order: the list must stay sorted highest first.' },
      { t: 'Re-sorts the whole list', why: 'No sorting is needed; inserting at the stopping point keeps it sorted.' },
    ],
  },
];
