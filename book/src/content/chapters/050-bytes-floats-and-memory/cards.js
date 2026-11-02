// Chapter 50 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'address-what': {
    q: 'In the model of memory as one long array of bytes, what is an **address**?',
    a: 'The index of a byte in that array: a plain whole number saying where the byte is.',
  },
  'byte-holds': {
    q: 'How many different values can one byte hold, and what range is that as an unsigned number?',
    a: '256 values (8 bits): the whole numbers 0 to 255. Bigger values take several neighbouring bytes.',
  },
  'f64-addr': {
    q: 'A `Float64Array` starts at address 1000. At what address does element 3 start?',
    a: '1000 + 3 × 8 = 1024, because each element takes 8 bytes.',
  },
  'locate-any-elem': {
    q: 'Why does working out where element 999,999 of a `Float64Array` is take no more steps than for element 0?',
    a: 'The elements are contiguous and equal in size, so the address is base + i × 8: one multiply and one add, with no searching.',
  },
  'alias-memory': {
    q: 'In memory terms, what does `const q = p;` copy when `p` refers to an object?',
    a: 'The address stored in `p`. Both now hold the same number, so they point at the same object.',
  },
  deref: {
    q: 'For an object that keeps its field `x` at a fixed offset, what three steps does reading `p.x` take?',
    a: 'Read the address stored in `p`, add the offset of `x` inside the object, and read the bytes there.',
  },
  'pointer-size': {
    q: 'How many bytes does a full, uncompressed pointer take on a 64-bit machine, and why?',
    a: '8 bytes, because an address there is 64 bits long.',
  },
  'heap-lifetime': {
    q: 'A JavaScript function creates an object, returns it, and finishes. Why does the object survive the call?',
    a: 'Objects live on the heap, not in the call’s frame; an object stays while something can still reach it.',
  },
  'aos-is-pointers': {
    q: 'What does each slot of a JavaScript array of objects hold?',
    a: 'A reference (a pointer) to an object that lives elsewhere on the heap, not the object’s fields.',
  },
};

export const examples = {
  'columns-in-one-buffer': {
    title: 'Two columns in one buffer',
    code: `const n = 3;
const buf = new ArrayBuffer(2 * n * 8);
// x uses bytes 0..23, vx bytes 24..47
const x = new Float64Array(buf, 0, n);
const vx = new Float64Array(buf, 24, n);

function where(col, i) {
  const s = col.BYTES_PER_ELEMENT;
  return col.byteOffset + i * s;
}

for (let i = 0; i < n; i++) {
  console.log('x', i, where(x, i));
}
for (let i = 0; i < n; i++) {
  console.log('vx', i, where(vx, i));
}`,
  },
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
  fieldAddr: {
    title: 'Address of a field in a packed buffer',
    prompt: 'Particles are packed into one `Float64Array` that starts at address `base`. Each particle has 6 fields (`x, y, vx, vy, mass, health`, numbered 0 to 5), stored one particle after another, 8 bytes per field. Write `fieldAddr(base, i, f)` that returns the address of field `f` of particle `i`.',
    starter: `function fieldAddr(base, i, f) {
  // your code here
}

// mass (field 4) of particle 2:
console.log(fieldAddr(0, 2, 4)); // 128`,
    solution: `function fieldAddr(base, i, f) {
  const k = i * 6 + f;
  return base + k * 8;
}`,
    tests: `test('first field of the first particle', () => {
  expect(fieldAddr(1000, 0, 0)).toBe(1000);
});
test('y of particle 0', () => {
  expect(fieldAddr(0, 0, 1)).toBe(8);
});
test('x of particle 1 comes after 6 fields', () => {
  expect(fieldAddr(0, 1, 0)).toBe(48);
});
test('mass of particle 2', () => {
  expect(fieldAddr(0, 2, 4)).toBe(128);
});
test('base is added once', () => {
  expect(fieldAddr(64, 3, 5)).toBe(64 + 23 * 8);
});`,
    hints: [
      'Do it in two steps: first find which *element* of the array you want, then turn that into a byte address.',
      'Particle `i` starts at element `i * 6`, because every particle before it took 6 elements; field `f` is `f` elements further on.',
      'Multiply that element number by 8 (bytes per element), then add `base` once, at the end.',
    ],
    walkthrough: `**How to think about it.** Picture the array as a long row of 8-byte elements, and count before you calculate. Particle 0 takes elements 0 to 5, particle 1 takes 6 to 11, particle 2 takes 12 to 17, so particle \`i\` starts at element \`i * 6\`. Inside a particle the fields come in order, so field \`f\` is \`f\` elements past the particle's start. That gives an *element number*; the question asks for an *address*, which counts bytes, so finish with the formula from the chapter: base plus element number times element size.

**The solution, line by line.**

- \`function fieldAddr(base, i, f) {\` takes the start address, the particle number and the field number.
- \`  const k = i * 6 + f;\` is the element number. For particle 2's mass (field 4) it is \`2 * 6 + 4 = 16\`: twelve elements for the two particles before it, then four more.
- \`  return base + k * 8;\` turns elements into bytes (16 × 8 = 128) and adds where the array starts. With \`base\` 0 that is 128, the answer the starter prints.
- \`}\` closes the function.

Check the last test by hand: particle 3, field 5 is element \`3 * 6 + 5 = 23\`, so its address is \`64 + 23 * 8\`, which is what the test expects.

This layout has a name in the book's benchmark, \`aos-packed\`: the same order as an array of objects, but with no objects and no arrows, only numbers in a row. You will meet it again when we count which bytes a loop really fetches.

**Common wrong attempts.**

- \`base + i * 6 + f\` forgets that addresses count bytes: it is the element number plus the base, eight times too small (particle 1's \`x\` comes out as 6 instead of 48).
- \`(base + i * 6 + f) * 8\` multiplies the base too. The base is already a byte address, so only the element number is scaled; with \`base\` 1000 this gives 8000 for the very first field.
- \`base + (i + f) * 8\` adds the field to the particle number as if each particle took one element; it ignores that every particle is 6 elements long.`,
    wrong: [
      {
        code: `function fieldAddr(base, i, f) {
  return base + i * 6 + f;
}`,
        why: 'This is the element number plus the base, but addresses count *bytes*. Each element is 8 bytes, so multiply `(i * 6 + f)` by 8.',
      },
      {
        code: `function fieldAddr(base, i, f) {
  return (base + i * 6 + f) * 8;
}`,
        why: 'The base is already a byte address, so it must not be multiplied by 8. Only the element number is.',
      },
      {
        code: `function fieldAddr(base, i, f) {
  return base + (i + f) * 8;
}`,
        why: 'Each particle is 6 elements long, not 1, so particle `i` starts at element `i * 6`.',
      },
    ],
  },
  sumList: {
    optional: true,
    title: 'Follow the pointers',
    prompt: 'Memory is modelled as an array `mem`. Each list node takes two slots: `mem[p]` is its value and `mem[p + 1]` is the address of the next node, with `0` meaning “no next node”. Write `sumList(mem, head)` that starts at address `head` and returns the sum of every value in the list. If `head` is `0`, the list is empty.',
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

Hold on to one detail: you cannot know the *next* address until you have read the current node. *Prefetching, pointer chasing, branches and SIMD* shows why the hardware finds that so hard to speed up.`,
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
    prompt: 'Using the same toy memory, write `reverseList(mem, head)` that reverses the list **in place**, by changing only the pointer slots (`mem[p + 1]`), and returns the address of the new first node. The values must stay where they are. An empty list (`head` is `0`) stays empty and returns `0`.',
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
    q: 'A `Float64Array` starts at address 200. Where does element 5 start?',
    options: [
      {
        t: '205',
        why: 'That steps one byte per element, but each element of a Float64Array takes 8 bytes.',
      },
      {
        t: '240',
        correct: true,
        why: '200 + 5 × 8 = 240. Contiguous 8-byte elements make this a multiply and an add.',
      },
      {
        t: '1640',
        why: 'That is (200 + 5) × 8: it multiplies the start address too. Only the index is scaled by the element size.',
      },
      {
        t: 'You can’t know without searching the array',
        why: 'Typed array elements are contiguous, so the position can be computed directly.',
      },
    ],
  },
  {
    q: 'In memory, what is a JavaScript reference to an object?',
    options: [
      {
        t: 'A full copy of the object’s fields',
        why: 'Copies would break aliasing: changes through one name wouldn’t show through the other.',
      },
      {
        t: 'The object’s name as a string',
        why: 'Objects don’t have names; variables do. The machine finds objects by address.',
      },
      {
        t: 'A pointer: the address where the object’s bytes start',
        correct: true,
        why: 'The engine stores the address, and follows it whenever you write `p.x`.',
      },
      {
        t: 'Nothing: references take no memory',
        why: 'A pointer is a number stored in bytes: 8 for a full pointer on a 64-bit machine.',
      },
    ],
  },
  {
    q: '`const ps = [{ x: 1 }, { x: 2 }];` What do the two slots of `ps` hold?',
    options: [
      {
        t: 'Two pointers to objects stored elsewhere on the heap',
        correct: true,
        why: 'Each slot holds an address; each object lives somewhere else.',
      },
      {
        t: 'The numbers 1 and 2, side by side',
        why: 'That would be a typed array of x values. An array of objects stores the objects separately.',
      },
      {
        t: 'Two complete objects, packed inside the array',
        why: 'The objects are not inside the array; the array only refers to them.',
      },
      {
        t: 'Two stack frames',
        why: 'Stack frames belong to function calls, not to arrays.',
      },
    ],
  },
  {
    q: 'Why does an object created inside a function survive after the function returns?',
    options: [
      {
        t: 'Its frame stays on the stack forever',
        why: 'Frames are released when their call returns.',
      },
      {
        t: 'It is copied into the caller’s frame',
        why: 'Only the pointer is returned; the object itself is not copied.',
      },
      {
        t: 'It is turned into a typed array',
        why: 'Nothing changes its type; it stays where it is.',
      },
      {
        t: 'Objects live on the heap, which outlasts call frames',
        correct: true,
        why: 'The heap keeps an object as long as something can still reach it.',
      },
    ],
  },
  {
    q: '`const p = { x: 1 }; const r = { ...p }; r.x = 5;` What is `p.x`?',
    options: [
      {
        t: '5, because `r` points at the same object',
        why: 'The spread builds a new object at a new address, so `r` and `p` lead to different objects.',
      },
      {
        t: '1, because `r` is a new object with its own copy of the values',
        correct: true,
        why: 'Only `const r = p` would copy the address and share the object.',
      },
      {
        t: 'An error, because `p` is `const`',
        why: '`const` stops the name `p` being reassigned; nothing here reassigns it.',
      },
      {
        t: '`undefined`',
        why: 'Nothing removed `x` from `p`.',
      },
    ],
  },
];
