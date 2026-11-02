// Chapter 101 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'dd-what': {
    q: 'What is dynamic dispatch?',
    a: 'Choosing which body of a method to run at run time, from the class of the object it is called on.',
  },
  'why-runtime': {
    q: 'In `for o in shapes { o.area(); }`, why can the compiler not pick the body of `area` from the text of the call?',
    a: 'The text names only the method; which class `o` holds is known only when that line runs, and it can differ each time round.',
  },
  'vtable-what': {
    q: 'What is a vtable?',
    a: 'An array of method addresses, one per class, with one fixed slot number per virtual method.',
  },
  'slot-fixed': {
    q: 'Why does an overriding method keep its parent’s slot number?',
    a: 'So code compiled against the parent, which reads that slot, finds the override when given a subclass object.',
  },
  'new-slot': {
    q: 'Where does a method that a subclass adds (not overrides) go in its vtable?',
    a: 'In the next free slot, after all of the parent’s slots.',
  },
  'prefix-why': {
    q: 'Why does a subclass object put its new fields after all of its parent’s fields?',
    a: 'So every parent field keeps its offset, and code compiled for the parent reads a subclass object correctly.',
  },
  'two-loads': {
    q: 'What does a vtable call cost, in instructions, before the method starts?',
    a: 'Two loads (the vptr, then the slot) and one indirect jump or call.',
  },
  'js-no-vtable': {
    q: 'Why do JavaScript engines not compile method calls to fixed vtable slots?',
    a: 'A program can add methods or change prototypes at any time; engines use hidden classes and inline caches instead.',
  },
};

export const examples = {
  'tiny-objects': {
    title: 'Objects as [vtable, field]',
    code: `// slot numbers, fixed before running
const AREA = 0, NAME = 1;
const shapeVt = [null, () => 'shape'];
const sqVt = [
  (o) => o[1] * o[1],
  shapeVt[NAME],
];
const ciVt = [
  (o) => 3.14 * o[1] * o[1],
  () => 'circle',
];
// an object: [vtable, field]
const shapes = [[sqVt, 2], [ciVt, 1]];
for (const o of shapes) {
  const vt = o[0];
  console.log(vt[NAME](o), vt[AREA](o));
}`,
  },
};

export const exercises = {
  'build-vtable': {
    title: 'Build a vtable',
    prompt: 'A vtable here is an object `{ slots, fns }`: `slots` maps each method name to its slot number, and `fns` is the array of functions, so `fns[slots.area]` is the `area` method. Write `buildVtable(parent, methods)`, where `parent` is the parent class’s vtable (or `null` for a class with no parent) and `methods` is an object of the class’s own methods. Return a **new** vtable: the parent’s slots first, each override in its parent’s slot, and each new method in the next free slot, in the order `methods` lists them. Do not change `parent`.',
    starter: `function buildVtable(parent, methods) {
  // your code here
  return { slots: {}, fns: [] };
}`,
    solution: `function buildVtable(parent, methods) {
  const slots = parent
    ? { ...parent.slots } : {};
  const fns = parent
    ? [...parent.fns] : [];
  for (const m in methods) {
    if (!(m in slots)) {
      slots[m] = fns.length;
    }
    fns[slots[m]] = methods[m];
  }
  return { slots, fns };
}`,
    tests: `const A = (o) => o[1] * o[1];
const N = () => 'shape';
const base = buildVtable(null,
  { area: A, name: N });
test('a class with no parent', () => {
  expect(base.slots)
    .toEqual({ area: 0, name: 1 });
  expect(base.fns[0]).toBe(A);
  expect(base.fns[1]).toBe(N);
});
test('an override keeps its slot', () => {
  const A2 = () => 9;
  const vt = buildVtable(base, { area: A2 });
  expect(vt.slots.area).toBe(0);
  expect(vt.fns[0]).toBe(A2);
  expect(vt.fns[1]).toBe(N);
});
test('a new method goes last', () => {
  const G = () => 0;
  const vt = buildVtable(base, { grow: G });
  expect(vt.slots.grow).toBe(2);
  expect(vt.fns[2]).toBe(G);
  expect(vt.fns.length).toBe(3);
});
test('mixed: new and overridden', () => {
  const G = () => 0;
  const N2 = () => 'big';
  const vt = buildVtable(base,
    { grow: G, name: N2 });
  expect(vt.slots)
    .toEqual({ area: 0, name: 1, grow: 2 });
  expect(vt.fns[1]).toBe(N2);
});
test('the parent is not changed', () => {
  buildVtable(base, { area: () => 1 });
  expect(base.fns[0]).toBe(A);
  expect(base.fns.length).toBe(2);
});
test('dispatch through the table', () => {
  const o = [base, 3];
  const vt = o[0];
  expect(vt.fns[vt.slots.area](o)).toBe(9);
});`,
    hints: [
      'Start from a copy of the parent’s table (or an empty one), then go through the class’s own methods one at a time.',
      'For each method, ask one question: does the parent already have a slot with this name? If so, reuse that slot number; if not, the new slot is the current length of `fns`.',
      'Copy with `{ ...parent.slots }` and `[...parent.fns]` so the parent is untouched; then `if (!(m in slots)) slots[m] = fns.length;` and `fns[slots[m]] = methods[m];`.',
    ],
    walkthrough: `**How to think about it.** A vtable is a numbering plus an array, and building one for a subclass is the same three-step recipe the chapter used for \`Sq\` and \`Circle\`: copy the parent's table, overwrite the slots of overridden methods, append new methods. The one rule that matters is that a slot number, once given in the parent, never changes in a child, because code compiled against the parent has that number built into it. So for each method the only decision is "reuse an existing slot, or take a new one?", and the answer is in \`slots\`.

**The solution, line by line.**

- \`function buildVtable(parent, methods) {\` takes the parent's vtable (or \`null\`) and the class's own methods.
- \`const slots = parent ? { ...parent.slots } : {};\` (split over two lines) makes a fresh copy of the parent's name-to-slot map, or an empty map for a root class. The spread \`{ ... }\` copies the entries into a new object, so later changes do not reach the parent.
- \`const fns = parent ? [...parent.fns] : [];\` does the same for the array of functions. After these two lines the child's table is exactly its parent's: every inherited method is already in place, which is how \`Sq\` gets \`Shape.name\` for free.
- \`for (const m in methods) {\` walks the class's own method names, in the order they were written.
- \`if (!(m in slots)) {\` asks whether the parent already numbered this name. If it did, this is an override and we must keep that number.
- \`slots[m] = fns.length;\` runs only for a new method: the next free slot is one past the last used, which is the current length of the array. For a root class this numbers the methods 0, 1, 2 in order.
- \`fns[slots[m]] = methods[m];\` runs for both kinds: put this class's function in the method's slot, overwriting the parent's for an override, or filling the new slot for a new method.
- \`return { slots, fns };\` hands back the new table.

The last test shows the payoff: \`vt.fns[vt.slots.area](o)\` reads a slot and calls it with the object as its first argument, which is the whole of a virtual call. (A real compiler does the \`slots.area\` lookup once, at compile time, and leaves only the number in the code.)

**Common wrong attempts.**

- Always appending (\`slots[m] = fns.length; fns.push(methods[m]);\`) gives an override a new slot, 2, while code compiled for the parent still reads slot 0 and runs the parent's method.
- Using \`parent.slots\` and \`parent.fns\` directly, without copying, makes the child's override overwrite the parent's own table, so every \`Shape\` would suddenly run \`Sq\`'s \`area\`.`,
    wrong: [
      {
        code: `function buildVtable(parent, methods) {
  const slots = parent
    ? { ...parent.slots } : {};
  const fns = parent
    ? [...parent.fns] : [];
  for (const m in methods) {
    slots[m] = fns.length;
    fns.push(methods[m]);
  }
  return { slots, fns };
}`,
        why: 'Every method gets a new slot, so an override lands in slot 2 while the parent’s code still reads slot 0.',
      },
      {
        code: `function buildVtable(parent, methods) {
  const slots = parent
    ? parent.slots : {};
  const fns = parent ? parent.fns : [];
  for (const m in methods) {
    if (!(m in slots)) {
      slots[m] = fns.length;
    }
    fns[slots[m]] = methods[m];
  }
  return { slots, fns };
}`,
        why: 'It does not copy, so building a subclass’s table overwrites the parent’s own table.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Class `B extends A` overrides `A`’s method `f`, which is in slot 3 of `A`’s vtable. Which slot holds `f` in `B`’s vtable?',
    options: [
      {
        t: 'The next free slot after all of `A`’s',
        why: 'That is where a new method goes; an override must stay where the parent’s code will look.',
      },
      {
        t: 'Slot 3',
        correct: true,
        why: 'Code compiled for `A` reads slot 3; keeping the number is what makes it find `B`’s `f`.',
      },
      {
        t: 'Slot 0, because overrides go first',
        why: 'Slot order follows the parent’s numbering, not whether a method is overridden.',
      },
      {
        t: 'Any slot: the call looks `f` up by name',
        why: 'With a vtable no name is looked up at run time; only the number is in the code.',
      },
    ],
  },
  {
    q: 'What does `ld a5, 8(a1)` do in a C++ virtual call, where `a1` already holds the object’s vptr?',
    options: [
      {
        t: 'Reads the object’s field at offset 8',
        why: '`a1` holds the vtable’s address, not the object’s, so offset 8 is in the table.',
      },
      {
        t: 'Calls the method in slot 8',
        why: 'It only loads; the jump comes next. And slots are 8 bytes each, so offset 8 is slot 1.',
      },
      {
        t: 'Loads the address of the method in slot 1',
        correct: true,
        why: 'Each slot is one 8-byte address, so offset 8 is slot 1; `jr a5` then jumps there.',
      },
    ],
  },
  {
    q: 'Why does a subclass add its new fields after its parent’s fields?',
    options: [
      {
        t: 'To keep the parent’s offsets, so parent code works on subclass objects',
        correct: true,
        why: 'That is the prefix rule: a subclass object starts with a complete parent object.',
      },
      {
        t: 'Because memory must be filled in the order fields are declared',
        why: 'The compiler chooses the order; the prefix rule is a choice made for compatibility.',
      },
      {
        t: 'To make the object smaller',
        why: 'The size is the same whichever order the fields go in (ignoring padding).',
      },
      {
        t: 'So the vptr can go at the end',
        why: 'The vptr stays at offset 0; new fields go at the end.',
      },
    ],
  },
  {
    q: 'Why can a compiler not normally inline a virtual call?',
    options: [
      {
        t: 'Virtual methods are always too large',
        why: 'Size has nothing to do with it; a one-line virtual method has the same problem.',
      },
      {
        t: 'It does not know which body the call will reach until run time',
        correct: true,
        why: 'Unless it can prove the object’s class (devirtualisation), there is no single body to copy in.',
      },
      {
        t: 'The vtable is in read-only memory',
        why: 'Where the table lives does not stop the compiler copying a body; not knowing which body does.',
      },
    ],
  },
  {
    q: 'What plays the part of the vptr in a JavaScript engine such as V8?',
    options: [
      {
        t: 'The object’s hidden class (map)',
        correct: true,
        why: 'Every object points at its hidden class, and inline caches key on it to remember which method a call found.',
      },
      {
        t: 'The `prototype` property of every object',
        why: 'Ordinary objects have no `prototype` property; the hidden class is what each object points at.',
      },
      {
        t: 'Nothing: JavaScript has no dynamic dispatch',
        why: 'Method calls in JavaScript dispatch dynamically, as the first example showed.',
      },
      {
        t: 'A vtable built when the class is declared',
        why: 'Methods can be added later, so engines cannot fix the slots when the class is declared.',
      },
    ],
  },
];
