// Chapter 17 cards. Keys are stable ids: never rename them.

export const prompts = {
  'memory-what': {
    q: 'What is a good one-line picture of a computer’s memory (RAM)?',
    a: 'One enormous array of bytes.',
  },
  'address-what': {
    q: 'What is an **address**?',
    a: 'The index of a byte in memory: its position in that giant array.',
  },
  'contig-what': {
    q: 'What does it mean for values to be **contiguous**?',
    a: 'They are stored side by side in memory, with no gaps between them.',
  },
  'f64-addr': {
    q: 'A `Float64Array` starts at address 1000. At what address does element 3 start?',
    a: '1000 + 3 × 8 = 1024, because each element takes 8 bytes.',
  },
  'pointer-what': {
    q: 'What is a **pointer**?',
    a: 'A stored address: a number that says where something else lives in memory.',
  },
  'alias-memory': {
    q: 'In memory terms, what does `const q = p;` copy when `p` refers to an object?',
    a: 'The address stored in `p`. Both now hold the same number, so they point at the same object.',
  },
  'pointer-size': {
    q: 'How many bytes does a full pointer take on a 64-bit machine, and why?',
    a: '8 bytes, because an address there is 64 bits long.',
  },
  'stack-heap': {
    q: 'What lives on the call stack, and what lives on the heap?',
    a: 'The stack holds one frame per active call (its local variables); the heap holds objects.',
  },
  'heap-lifetime': {
    q: 'A function creates an object, returns it, and finishes. Why does the object survive?',
    a: 'Objects live on the heap, which outlasts call frames: it stays while something can still reach it.',
  },
  'aos-is-pointers': {
    q: 'What does an array of objects actually hold in its slots?',
    a: 'Pointers: each slot holds the address of an object that lives elsewhere on the heap.',
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
      'Keep a variable `p` for “the address I am at now”. Start it at `head`.',
      'While `p` is not `0`: add `mem[p]` to a running total, then move on by setting `p = mem[p + 1]`.',
      'Return the total after the loop. An empty list (`head` is 0) never enters the loop, so it returns 0.',
    ],
    walkthrough: `This is exactly what an engine does when it walks a chain of objects, minus the safety checks.

- **\`p\` is a pointer.** It holds an address, not a value. \`mem[p]\` reads the value stored there.
- **Following the pointer** means reading the next address out of memory, \`mem[p + 1]\`, and making it the new \`p\`. The values never move. Only \`p\` does.
- **\`0\` is the end.** It plays the role of \`null\`. Real systems keep address 0 unused for exactly this reason.
- **Order in memory doesn’t matter.** In the third test the nodes sit at 6, 2 and 4: the list order comes from the pointers, not from the addresses.

Notice that you cannot know the *next* address until you have read the current node. Keep that in mind: chapter 20 shows why hardware hates it.`,
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
    ],
  },
  fieldAddr: {
    optional: true,
    title: 'Address of a field in a packed buffer',
    prompt:
      'Particles are packed into one `Float64Array` that starts at address `base`. Each particle has 6 fields (`x, y, vx, vy, mass, health`, numbered 0 to 5), stored one particle after another, 8 bytes per field. Write `fieldAddr(base, i, f)` that returns the address of field `f` of particle `i`.',
    starter: `function fieldAddr(base, i, f) {
  // your code here
}

// mass (field 4) of particle 2:
console.log(fieldAddr(0, 2, 4)); // 128`,
    solution: `function fieldAddr(base, i, f) {
  return base + (i * 6 + f) * 8;
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
      'First find the element index: particle `i` starts at element `i * 6`, and field `f` is `f` elements further on.',
      'Then turn the element index into bytes (× 8) and add the start address.',
    ],
    walkthrough: `Two steps, the same two an engine uses for a typed array.

- **Element index.** Each particle takes 6 elements, so particle \`i\` starts at element \`i * 6\`, and its field \`f\` is element \`i * 6 + f\`.
- **Bytes.** Every element is 8 bytes, so that element starts \`(i * 6 + f) * 8\` bytes after the beginning.
- **Address.** Add \`base\`.

This layout is the benchmark’s \`aos-packed\`: AoS order, but no objects and no pointers. You will meet it again in chapter 19.`,
    wrong: [
      {
        code: `function fieldAddr(base, i, f) {
  return base + i * 6 + f;
}`,
        why: 'This is the element index plus the base, but addresses count *bytes*. Each element is 8 bytes, so multiply `(i * 6 + f)` by 8.',
      },
      {
        code: `function fieldAddr(base, i, f) {
  return (base + i * 6 + f) * 8;
}`,
        why: 'The base is already a byte address, so it must not be multiplied by 8. Only the element index is.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A `Float64Array` starts at address 200. Where does element 5 start?',
    options: [
      { t: '205', why: 'That steps one byte per element, but each element of a Float64Array takes 8 bytes.' },
      { t: '240', correct: true, why: '200 + 5 × 8 = 240. Contiguous 8-byte elements make this a multiply and an add.' },
      { t: '1000', why: 'That multiplies the start address too. Only the index is scaled by 8.' },
      { t: 'You can’t know without searching the array', why: 'Typed array elements are contiguous, so the position can be computed directly.' },
    ],
  },
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
      { t: 'The numbers 1 and 2, side by side', why: 'That would be a typed array of x values. An array of objects stores the objects separately.' },
      { t: 'Two pointers to objects stored elsewhere on the heap', correct: true, why: 'Each slot holds an address; each object lives somewhere else.' },
      { t: 'Two complete objects, packed inside the array', why: 'The objects are not inside the array; the array only refers to them.' },
      { t: 'Two stack frames', why: 'Stack frames belong to function calls, not to arrays.' },
    ],
  },
  {
    q: 'Why does an object created inside a function survive after the function returns?',
    options: [
      { t: 'Its frame stays on the stack forever', why: 'Frames are popped when their call returns.' },
      { t: 'It is copied into the caller’s frame', why: 'Only the pointer is returned; the object itself is not copied.' },
      { t: 'It is turned into a typed array', why: 'Nothing changes its type; it just stays where it is.' },
      { t: 'Objects live on the heap, which outlasts call frames', correct: true, why: 'The heap keeps an object as long as something can still reach it.' },
    ],
  },
  {
    q: 'Which word describes how a Float64Array’s elements are stored?',
    options: [
      { t: 'Contiguous', correct: true, why: 'The elements sit side by side in one block, with no gaps.' },
      { t: 'Scattered', why: 'That describes the objects behind an array of objects, not a typed array.' },
      { t: 'Aliased', why: 'Aliasing is about two names for one object, not about layout.' },
      { t: 'On the call stack', why: 'Its bytes live in an ArrayBuffer on the heap.' },
    ],
  },
  {
    q: 'To read `ps[i].x` for every particle in an array of objects, what must the machine do each time?',
    options: [
      { t: 'Read x straight out of the array’s own slot', why: 'The slot holds an address, not the x value.' },
      { t: 'Search the heap for an object with the right index', why: 'No searching: the pointer says exactly where to go.' },
      { t: 'Read the pointer in slot i, then jump to that address and read x there', correct: true, why: 'Two steps per element: load the pointer, then load from where it points.' },
      { t: 'Copy the object onto the stack first', why: 'Reading a property follows the pointer; no copy is made.' },
    ],
  },
];
