// Cards for "Pointers, the stack and the heap" (split from chapter 48).
// Keys are stable ids: never rename them.

export const prompts = {
  'pointer-what': {
    q: 'What is a **pointer**?',
    a: 'A stored address: a number that says where something else lives in memory.',
  },
  'alias-memory': {
    q: 'In memory terms, what does `const q = p;` copy when `p` refers to an object?',
    a: 'The address stored in `p`. Both now hold the same number, so they point at the same object.',
  },
  deref: {
    q: 'What three things does the engine do to run `p.x`?',
    a: 'Read the address stored in `p`, add the offset of `x` inside the object, and read the bytes there.',
  },
  'pointer-size': {
    q: 'How many bytes does a full pointer take on a 64-bit machine, and why?',
    a: '8 bytes, because an address there is 64 bits long.',
  },
  'stack-heap': {
    q: 'What lives on the call stack, and what lives on the heap?',
    a: 'The stack holds one frame per active call (its parameters and local variables); the heap holds objects.',
  },
  'heap-lifetime': {
    q: 'A function creates an object, returns it, and finishes. Why does the object survive?',
    a: 'Objects live on the heap, which outlasts call frames: it stays while something can still reach it.',
  },
  'stack-overflow': {
    q: 'Why does a recursion that never stops end in “Maximum call stack size exceeded”?',
    a: 'Every call pushes a frame, and the stack has a limited size; eventually there is no room for another frame.',
  },
  'aos-is-pointers': {
    q: 'What does an array of objects actually hold in its slots?',
    a: 'Pointers: each slot holds the address of an object that lives elsewhere on the heap.',
  },
  'null-zero': {
    q: 'In the toy memory, why can address `0` mean “no next node”?',
    a: 'No node is ever stored at address 0, so it can never be a real node’s address; it plays the part of `null`.',
  },
};

export const examples = {
  'mem-list': {
    title: 'A linked list in a toy memory',
    code: `// mem is memory; indexes are addresses.
// A node: [value, address of next node]
const mem = [0, 0, 10, 5, 0, 20, 0];

let p = 2; // address of the first node
while (p !== 0) {
  console.log('at', p, 'value', mem[p]);
  p = mem[p + 1]; // follow the pointer
}`,
  },
};

export const exercises = {
  sumList: {
    title: 'Follow the pointers',
    prompt:
      'Memory is modelled as an array `mem`. Each list node takes two slots: `mem[p]` is its value and `mem[p + 1]` is the address of the next node, with `0` meaning “no next node”. Write `sumList(mem, head)` that starts at address `head` and returns the sum of every value in the list. If `head` is `0`, the list is empty.',
    starter: `function sumList(mem, head) {
  // your code here
}

const mem = [0, 0, 10, 5, 0, 20, 0];
console.log(sumList(mem, 2)); // 30`,
    solution: `function sumList(mem, head) {
  let sum = 0;
  let p = head;
  while (p !== 0) {
    sum += mem[p];
    p = mem[p + 1];
  }
  return sum;
}`,
    tests: `test('two nodes', () => {
  const mem = [0, 0, 10, 5, 0, 20, 0];
  expect(sumList(mem, 2)).toBe(30);
});
test('empty list', () => {
  expect(sumList([0, 0], 0)).toBe(0);
});
test('nodes out of order in memory', () => {
  // 6 -> 2 -> 4 -> end
  const mem = [0, 0, 1, 4, 2, 0, 3, 2];
  expect(sumList(mem, 6)).toBe(6);
});
test('start in the middle of a list', () => {
  const mem = [0, 0, 1, 4, 2, 0, 3, 2];
  expect(sumList(mem, 2)).toBe(3);
});`,
    hints: [
      'Keep a variable `p` for “the address I am at now”, and start it at `head`. It is your pointer.',
      'You do not know how many nodes there are, so use a `while` loop that keeps going until `p` is `0`.',
      'Inside the loop, add `mem[p]` to a running total, then move on with `p = mem[p + 1]`. Return the total after the loop.',
    ],
    walkthrough: `**How to think about it.** Do it by hand first with the starter's memory, \`[0, 0, 10, 5, 0, 20, 0]\`, starting at address 2. The value at 2 is 10, and the slot after it, \`mem[3]\`, says the next node is at 5. The value at 5 is 20, and \`mem[6]\` is 0, so that was the last node. The total is 30. Notice what you kept track of: one number, "where am I now", which you replaced each time by reading the next address out of memory. That number is a pointer, and the loop is exactly what an engine does when it walks a chain of objects (minus the safety checks).

You cannot use a \`for\` loop over indexes here, because the nodes are not in address order: in the third test they sit at 6, then 2, then 4. The order of the list comes from the pointers, not from where the nodes happen to be.

**The solution, line by line.**

- \`function sumList(mem, head) {\` takes the memory and the address of the first node.
- \`  let sum = 0;\` is the running total, starting at nothing.
- \`  let p = head;\` is the pointer: the address of the node we are at. It starts at the head.
- \`  while (p !== 0) {\` keeps going until we reach the "no next node" address. For an empty list (\`head\` 0) the loop never runs.
- \`    sum += mem[p];\` reads this node's value, the first of its two slots, and adds it.
- \`    p = mem[p + 1];\` follows the pointer: the second slot holds the next node's address, and it becomes our new \`p\`. The values never move; only \`p\` does.
- \`  }\` closes the loop.
- \`  return sum;\` hands back the total.
- \`}\` closes the function.

**Common wrong attempts.**

- Walking memory in address order (\`for (let i = head; i < mem.length; i++)\`) adds the pointer slots as if they were values and ignores where the list actually goes next.
- Starting at \`mem[head + 1]\` jumps to the second node before adding the first value.
- Writing \`p = p + 2\` instead of \`p = mem[p + 1]\` assumes the next node sits right after this one; it only works when the nodes happen to be stored in order.

Hold on to one detail: you cannot know the *next* address until you have read the current node. A later chapter shows why the hardware finds that so hard to speed up.`,
    wrong: [
      {
        code: `function sumList(mem, head) {
  let sum = 0;
  const n = mem.length;
  for (let i = head; i < n; i++) {
    sum += mem[i];
  }
  return sum;
}`,
        why: 'This walks memory in address order, adding every slot after `head`, instead of following the pointers. It adds the pointer slots as if they were values, and it ignores where the list actually goes next.',
      },
      {
        code: `function sumList(mem, head) {
  let sum = 0;
  let p = mem[head + 1];
  while (p !== 0) {
    sum += mem[p];
    p = mem[p + 1];
  }
  return sum;
}`,
        why: 'This follows the pointers correctly but starts one node too late: it jumps to the second node before adding the first value. Start with `p = head`.',
      },
      {
        code: `function sumList(mem, head) {
  let sum = 0;
  let p = head;
  while (p !== 0 && p < mem.length) {
    sum += mem[p];
    p = p + 2;
  }
  return sum;
}`,
        why: 'Stepping by 2 assumes the next node is stored right after this one. The next node is wherever the pointer says: read it with `mem[p + 1]`.',
      },
    ],
  },
  reverseList: {
    optional: true,
    title: 'Reverse a list without moving a value',
    prompt:
      'Using the same toy memory, write `reverseList(mem, head)` that reverses the list **in place**, by changing only the pointer slots (`mem[p + 1]`), and returns the address of the new first node. The values must stay where they are. An empty list (`head` is `0`) stays empty and returns `0`.',
    starter: `function reverseList(mem, head) {
  // your code here
}

const mem = [0, 0, 10, 5, 0, 20, 0];
const h = reverseList(mem, 2);
console.log(h); // 5
console.log(mem); // [0,0,10,0,0,20,2]`,
    solution: `function reverseList(mem, head) {
  let prev = 0;
  let p = head;
  while (p !== 0) {
    const next = mem[p + 1];
    mem[p + 1] = prev;
    prev = p;
    p = next;
  }
  return prev;
}`,
    tests: `function vals(mem, h) {
  const out = [];
  for (let p = h; p !== 0; p = mem[p + 1]) {
    out.push(mem[p]);
  }
  return out;
}
test('two nodes', () => {
  const mem = [0, 0, 10, 5, 0, 20, 0];
  const h = reverseList(mem, 2);
  expect(h).toBe(5);
  expect(vals(mem, h)).toEqual([20, 10]);
});
test('the values do not move', () => {
  const mem = [0, 0, 10, 5, 0, 20, 0];
  reverseList(mem, 2);
  expect(mem[2]).toBe(10);
  expect(mem[5]).toBe(20);
});
test('three nodes out of order', () => {
  // 6 -> 2 -> 4 -> end, values 3, 1, 2
  const mem = [0, 0, 1, 4, 2, 0, 3, 2];
  const h = reverseList(mem, 6);
  expect(vals(mem, h)).toEqual([2, 1, 3]);
});
test('one node', () => {
  const mem = [0, 0, 7, 0];
  expect(reverseList(mem, 2)).toBe(2);
  expect(mem[3]).toBe(0);
});
test('empty list', () => {
  expect(reverseList([0, 0], 0)).toBe(0);
});`,
    hints: [
      'Walk the list as in `sumList`, but at each node make its pointer slot point *backwards*, at the node you were at before.',
      'Keep two pointers: `prev` (the node behind you, starting at `0`) and `p` (the node you are at). Before you overwrite `mem[p + 1]`, save it: it is the only way to reach the rest of the list.',
      'In the loop: `const next = mem[p + 1]; mem[p + 1] = prev; prev = p; p = next;`. When `p` reaches 0, `prev` is the old last node, which is the new head.',
    ],
    walkthrough: `**How to think about it.** Reversing a list does not mean moving values; it means turning every arrow round. In the starter, node 2 points at node 5, and node 5 points at nothing. Reversed, node 5 should point at node 2, node 2 should point at nothing, and the list should now start at 5. So at every node we visit, we want to overwrite its pointer slot with the address of the node *before* it. That needs two pointers as we walk: where we are (\`p\`), and where we just were (\`prev\`). There is one trap: once we overwrite \`mem[p + 1]\`, we have lost the address of the rest of the list, so we must read it into a third variable first.

**The solution, line by line.**

- \`function reverseList(mem, head) {\` takes the memory and the first node's address.
- \`  let prev = 0;\` is the node behind us. At the start there is none, and \`0\` is exactly what the old first node's pointer should become, since it will be the new last node.
- \`  let p = head;\` is the node we are at.
- \`  while (p !== 0) {\` visits every node; an empty list skips the loop.
- \`    const next = mem[p + 1];\` saves the address of the rest of the list before we overwrite it.
- \`    mem[p + 1] = prev;\` turns this node's arrow round, to point at the node behind it.
- \`    prev = p;\` moves "behind us" up to this node.
- \`    p = next;\` moves on, using the address we saved.
- \`  }\` closes the loop. When it ends, \`p\` is 0 and \`prev\` is the old last node.
- \`  return prev;\` returns it as the new head.
- \`}\` closes the function.

Trace the starter: at node 2, \`next\` is 5, \`mem[3]\` becomes 0, \`prev\` becomes 2, \`p\` becomes 5. At node 5, \`next\` is 0, \`mem[6]\` becomes 2, \`prev\` becomes 5, \`p\` becomes 0. The loop stops, and the function returns 5: the list now reads 20, then 10.

**Common wrong attempts.**

- Overwriting \`mem[p + 1]\` and then writing \`p = mem[p + 1]\` follows the arrow you just turned round, which now points at the node behind (0 for the first node), so the walk stops after one node instead of carrying on.
- Returning \`head\` returns the old first node, which is now the *last* node.
- Swapping the values (\`mem[p]\`) instead of the pointers gives the right order when read, but breaks the rule that values must not move, and it is much harder to get right for a list whose length you do not know.`,
    wrong: [
      {
        code: `function reverseList(mem, head) {
  let prev = 0;
  let p = head;
  while (p !== 0) {
    mem[p + 1] = prev;
    prev = p;
    p = mem[p + 1];
  }
  return prev;
}`,
        why: 'After `mem[p + 1] = prev`, reading `mem[p + 1]` gives back `prev`, not the next node, so the walk stops after one node. Save the next address before overwriting it.',
      },
      {
        code: `function reverseList(mem, head) {
  let prev = 0;
  let p = head;
  while (p !== 0) {
    const next = mem[p + 1];
    mem[p + 1] = prev;
    prev = p;
    p = next;
  }
  return head;
}`,
        why: 'The pointers are reversed correctly, but `head` is now the last node. The new first node is `prev`, the last one visited.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In memory, what is a JavaScript reference to an object?',
    options: [
      { t: 'A full copy of the object’s fields', why: 'Copies would break aliasing: changes through one name wouldn’t show through the other.' },
      { t: 'The object’s name as a string', why: 'Objects don’t have names; variables do. The machine finds objects by address.' },
      { t: 'A pointer: the address where the object’s bytes start', correct: true, why: 'The engine stores the address, and follows it whenever you write `p.x`.' },
      { t: 'Nothing: references take no memory', why: 'A pointer is a number stored in bytes: 8 for a full pointer on a 64-bit machine.' },
    ],
  },
  {
    q: '`const ps = [{ x: 1 }, { x: 2 }];` What do the two slots of `ps` hold?',
    options: [
      { t: 'Two pointers to objects stored elsewhere on the heap', correct: true, why: 'Each slot holds an address; each object lives somewhere else.' },
      { t: 'The numbers 1 and 2, side by side', why: 'That would be a typed array of x values. An array of objects stores the objects separately.' },
      { t: 'Two complete objects, packed inside the array', why: 'The objects are not inside the array; the array only refers to them.' },
      { t: 'Two stack frames', why: 'Stack frames belong to function calls, not to arrays.' },
    ],
  },
  {
    q: 'Why does an object created inside a function survive after the function returns?',
    options: [
      { t: 'Its frame stays on the stack forever', why: 'Frames are released when their call returns.' },
      { t: 'It is copied into the caller’s frame', why: 'Only the pointer is returned; the object itself is not copied.' },
      { t: 'It is turned into a typed array', why: 'Nothing changes its type; it stays where it is.' },
      { t: 'Objects live on the heap, which outlasts call frames', correct: true, why: 'The heap keeps an object as long as something can still reach it.' },
    ],
  },
  {
    q: 'To read `ps[i].x` for every particle in an array of objects, what must the machine do each time?',
    options: [
      { t: 'Read x straight out of the array’s own slot', why: 'The slot holds an address, not the x value.' },
      { t: 'Search the heap for an object with the right index', why: 'No searching: the pointer says exactly where to go.' },
      { t: 'Read the pointer in slot i, then go to that address plus the offset of x and read there', correct: true, why: 'Two steps per element: load the pointer, then load from where it points.' },
      { t: 'Copy the object onto the stack first', why: 'Reading a property follows the pointer; no copy is made.' },
    ],
  },
  {
    q: '`const p = { x: 1 }; const r = { ...p }; r.x = 5;` What is `p.x`?',
    options: [
      { t: '5, because `r` points at the same object', why: 'The spread builds a new object at a new address, so `r` and `p` lead to different objects.' },
      { t: '1, because `r` is a new object with its own copy of the values', correct: true, why: 'Only `const r = p` would copy the address and share the object.' },
      { t: 'An error, because `p` is `const`', why: '`const` stops the name `p` being reassigned; nothing here reassigns it.' },
      { t: '`undefined`', why: 'Nothing removed `x` from `p`.' },
    ],
  },
];
