// Chapter 277 cards. Keys are stable ids: never rename them.

export const prompts = {
  'gc-cap-len': {
    q: 'What is the difference between a collection’s capacity and its length?',
    a: 'Capacity is how many slots are allocated; length is how many hold real elements.',
  },
  'gc-no-push': {
    q: 'Why can’t Viscosity’s container just call `push` on its `Float64Array` columns?',
    a: 'A typed array made with `new Float64Array(n)` has a fixed length and no `push`.',
  },
  'gc-spare-zero': {
    q: 'What does a spare slot of a fresh `Float64Array` column contain?',
    a: '0. New typed arrays are zero-filled.',
  },
  'gc-set': {
    q: 'What does `t.set(this.a)` do inside `grow()`?',
    a: 'Copies every value of the old column into the start of the new, bigger one.',
  },
  'gc-plain': {
    q: 'Why does `grow()` not copy the plain array columns?',
    a: 'Writing at index `length` appends to a plain array, and the engine grows it by itself.',
  },
  'gc-amortized': {
    q: 'With doubling, about how many values do n pushes copy in total?',
    a: 'Fewer than 2n, so a constant amount per push on average.',
  },
  'gc-add16': {
    q: 'What happens to the total copying if the capacity grows by 16 each time instead of doubling?',
    a: 'It grows with the square of the length (quadratic), because each grow copies everything so far.',
  },
  'gc-waste': {
    q: 'Right after a doubling grow, at most what fraction of the slots is spare?',
    a: 'Just under half: the old capacity is full, and an equal number of new slots is empty.',
  },
  'gc-bench': {
    q: 'Why doesn’t the `construct` benchmark measure the cost of doubling?',
    a: 'Its harness knows n in advance and creates the columns at the right size, so they never grow.',
  },
};

export const examples = {
  policies: {
    title: 'Doubling vs adding 16',
    code: `function copies(n, next) {
  let cap = 16, c = 0;
  for (let len = 0; len < n; len++) {
    if (len === cap) {
      c += len;
      cap = next(cap);
    }
  }
  return c;
}
const dbl = (c) => c * 2;
const add = (c) => c + 16;
for (const n of [1000, 10000, 100000])
  console.log(n, copies(n, dbl),
    copies(n, add));`,
  },
  count5000: {
    title: 'growth.js, counted',
    code: `let cap = 16, len = 0;
let grows = 0, copies = 0;
for (let k = 0; k < 5000; k++) {
  if (len === cap) {
    copies += len; // t.set(old)
    cap *= 2;
    grows++;
  }
  len++;
}
console.log(grows, copies, cap);
console.log((copies / len).toFixed(2));`,
  },
};

export const exercises = {
  doublingCol: {
    title: 'A column that grows',
    prompt:
      'Finish `push(v)` for a one-column container. It starts with capacity 4. When the column is full, grow it the way Viscosity does: a new `Float64Array` of twice the capacity, the old values copied in with `set`, and `copies` increased by the number of values copied. Then store `v` at index `len` and return the new length.',
    starter: `function makeCol() {
  return {
    len: 0, cap: 4, copies: 0,
    data: new Float64Array(4),
    push(v) {
      // your code here
    },
  };
}

const c = makeCol();
for (let i = 0; i < 5; i++) c.push(i);
console.log(c.len, c.cap, c.copies);`,
    solution: `function makeCol() {
  return {
    len: 0, cap: 4, copies: 0,
    data: new Float64Array(4),
    push(v) {
      if (this.len === this.cap) {
        const t = new Float64Array(
          this.cap * 2);
        t.set(this.data);
        this.copies += this.len;
        this.data = t;
        this.cap *= 2;
      }
      this.data[this.len] = v;
      return ++this.len;
    },
  };
}`,
    tests: `test('no grow while there is room', () => {
  const c = makeCol();
  for (let i = 0; i < 4; i++) c.push(i);
  expect([c.len, c.cap, c.copies]).toEqual([4, 4, 0]);
});
test('the fifth push doubles and copies 4', () => {
  const c = makeCol();
  for (let i = 0; i < 5; i++) c.push(i);
  expect([c.len, c.cap, c.copies]).toEqual([5, 8, 4]);
});
test('push returns the new length', () => {
  const c = makeCol();
  c.push(7);
  expect(c.push(8)).toBe(2);
});
test('100 pushes: capacity 128, 124 copies', () => {
  const c = makeCol();
  for (let i = 0; i < 100; i++) c.push(i);
  expect([c.cap, c.copies]).toEqual([128, 124]);
});
test('every value survives the grows', () => {
  const c = makeCol();
  for (let i = 0; i < 100; i++) c.push(i * 3);
  let ok = true;
  for (let i = 0; i < 100; i++) if (c.data[i] !== i * 3) ok = false;
  expect(ok).toBe(true);
});`,
    hints: [
      'Check `this.len === this.cap` at the start of `push`, before writing anything.',
      'To grow: `const t = new Float64Array(this.cap * 2); t.set(this.data);` then replace `this.data` and double `this.cap`.',
      'Count the copy before you forget it: `this.copies += this.len`. Then write `this.data[this.len] = v` and return `++this.len`.',
    ],
    walkthrough: `**How to think about it.** This is the generated \`push\` and \`grow\` from *Generating SoA storage*, folded into one method for one column. Before writing, decide the order of the three things a push does: make room if needed, write the value, update the length. Making room has to come first, because a write past the end of a typed array is silently ignored, so writing first would lose the value with no error. Making room means what Viscosity's \`grow()\` does: a new array twice the size, the old values copied in, and the new array swapped in.

**The solution, line by line.**

- \`push(v) {\` is a method on the object, so \`this\` is the column object.
- \`if (this.len === this.cap) {\` asks whether every slot is in use.
- \`const t = new Float64Array(this.cap * 2);\` makes a new, zero-filled column twice as big.
- \`t.set(this.data);\` copies every old value into the start of \`t\`.
- \`this.copies += this.len;\` counts the copy: the column was full, so exactly \`len\` values moved.
- \`this.data = t;\` swaps the new column in (the old one is now garbage), and \`this.cap *= 2;\` records the new size.
- \`this.data[this.len] = v;\` writes the value into the first unused slot, which now certainly exists.
- \`return ++this.len;\` adds one to the length and returns the new value (\`++\` before the name gives the value after adding), like \`Array.prototype.push\`.

Why the totals stay small: starting at 4, the copies are 4, 8, 16, 32 and 64, each grow copying 4 more than all the earlier ones together, so after 100 pushes the total is 124, less than the final capacity of 128. That is the amortised argument in miniature.

**Common wrong attempts.**

- Growing by a constant (\`this.cap + 4\`): it works, but after 100 pushes it has copied 1,200 values instead of 124, and the gap grows with the square of the length.
- Making the new array without \`set\`: every grow throws the earlier values away, and they read back as zeros.
- Writing before checking: when the column is full, \`data[len]\` is past the end, and the write is silently dropped.`,
    wrong: [
      {
        code: `function makeCol() {
  return {
    len: 0, cap: 4, copies: 0,
    data: new Float64Array(4),
    push(v) {
      if (this.len === this.cap) {
        const t = new Float64Array(
          this.cap + 4);
        t.set(this.data);
        this.copies += this.len;
        this.data = t;
        this.cap += 4;
      }
      this.data[this.len] = v;
      return ++this.len;
    },
  };
}`,
        why: 'This grows by a constant (4) instead of doubling. It works, but the copies add up quadratically: after 100 pushes it has copied 1,200 values instead of 124.',
      },
      {
        code: `function makeCol() {
  return {
    len: 0, cap: 4, copies: 0,
    data: new Float64Array(4),
    push(v) {
      if (this.len === this.cap) {
        this.data = new Float64Array(
          this.cap * 2);
        this.copies += this.len;
        this.cap *= 2;
      }
      this.data[this.len] = v;
      return ++this.len;
    },
  };
}`,
        why: 'The new array is never filled from the old one, so every grow throws the earlier values away (they become zeros). Copy with `set` before replacing `data`.',
      },
      {
        code: `function makeCol() {
  return {
    len: 0, cap: 4, copies: 0,
    data: new Float64Array(4),
    push(v) {
      this.data[this.len] = v;
      if (this.len === this.cap) {
        const t = new Float64Array(
          this.cap * 2);
        t.set(this.data);
        this.copies += this.len;
        this.data = t;
        this.cap *= 2;
      }
      return ++this.len;
    },
  };
}`,
        why: 'The write happens before the check. When the column is full, `data[len]` is past the end of the typed array, and the write is silently dropped.',
      },
    ],
  },
  copiesFor: {
    optional: true,
    title: 'Count the copies of any policy',
    prompt:
      'Write `copiesFor(n, next)`: start with capacity 16 and length 0, push `n` times, and whenever a push finds the collection full, add the current length to a copy count and set the capacity to `next(capacity)`. Return the total copies.',
    starter: `function copiesFor(n, next) {
  // your code here
  return 0;
}

const dbl = (c) => c * 2;
console.log(copiesFor(5000, dbl));`,
    solution: `function copiesFor(n, next) {
  let cap = 16, copies = 0;
  for (let len = 0; len < n; len++) {
    if (len === cap) {
      copies += len;
      cap = next(cap);
    }
  }
  return copies;
}`,
    tests: `test('growth.js: 5000 elements, doubling', () => {
  expect(copiesFor(5000, (c) => c * 2)).toBe(8176);
});
test('adding 16 each time', () => {
  expect(copiesFor(1000, (c) => c + 16)).toBe(31248);
});
test('no grows when it fits', () => {
  expect(copiesFor(16, (c) => c * 2)).toBe(0);
});
test('growing by half', () => {
  expect(copiesFor(100, (c) => c + c / 2)).toBe(211);
});`,
    hints: [
      'Loop `len` from 0 to `n - 1`; each iteration is one push.',
      'Before the push, `if (len === cap)`: add `len` to the count and set `cap = next(cap)`.',
    ],
    walkthrough: `**How to think about it.** You do not need any real storage to count copies: only the capacity, the length and the running total matter. So simulate the pushes with a loop, and at each one ask the container's question, "is it full?". Passing the growth rule in as a function, \`next\`, lets one simulator compare every policy.

**The solution, line by line.**

- \`let cap = 16, copies = 0;\` starts like Viscosity's container: room for 16, nothing copied.
- \`for (let len = 0; len < n; len++) {\` is one round per push; \`len\` is the length before this push.
- \`if (len === cap) {\` is the full check.
- \`copies += len;\` counts the old elements moved into the bigger storage (the new, empty slots are allocated, not copied).
- \`cap = next(cap);\` applies the policy: \`c * 2\` doubles, \`c + 16\` adds a fixed amount.
- \`return copies;\` after the loop.

Try a few policies. Doubling stays under 2 copies per element. Growing by half (\`c + c / 2\`) also stays linear, copying a little more but leaving less spare memory after each grow. Adding a constant is quadratic. Any policy that multiplies the capacity by a factor above 1 is amortised constant; the factor trades copying against wasted space.

**Common wrong attempts.**

- Counting the new capacity as copied: a grow copies the old elements only.
- Checking \`len > cap\` instead of \`===\`: the push that fills the last slot is fine, but the next one must grow; with \`>\`, it writes one past the end first.`,
    wrong: [
      {
        code: `function copiesFor(n, next) {
  let cap = 16, copies = 0;
  for (let len = 0; len < n; len++) {
    if (len === cap) {
      copies += cap;
      cap = next(cap);
      copies += cap;
    }
  }
  return copies;
}`,
        why: 'A grow copies the old elements only. The new, empty slots are allocated, not copied.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A container has `cap` 32 and `length` 20. What happens on the next push?',
    options: [
      { t: 'It grows to 64 first.', why: 'It only grows when length equals capacity. 20 < 32, so there is room.' },
      { t: 'It writes slot 20 and the length becomes 21.', correct: true, why: 'The common, cheap case: no allocation and no copying.' },
      { t: 'It writes slot 32.', why: 'Slots 20 to 31 are spare; the next element goes at index `length`, which is 20.' },
      { t: 'It grows by one slot.', why: 'Viscosity’s container never grows by one; it doubles, and only when full.' },
    ],
  },
  {
    q: 'Starting at capacity 16 and doubling, how many values are copied per column while pushing 5,000 elements?',
    options: [
      { t: '8,176', correct: true, why: '16 + 32 + … + 4,096 = 8,176, fewer than 2 per element.' },
      { t: '5,000', why: 'The copies are the old capacities at each grow, not the element count.' },
      { t: 'About 780,000', why: 'That is closer to what growing by 16 each time would copy.' },
      { t: '0, because set() is free', why: '`set` copies every value; it is just fast at it.' },
    ],
  },
  {
    q: 'Which statement about amortised growth is true?',
    options: [
      { t: 'Every push is cheap.', why: 'A push that triggers a grow copies every element. It is the average that is cheap.' },
      { t: 'Growing by a constant is better because it wastes less memory.', why: 'It wastes less space, but its total copying grows with n², which is far worse for large n.' },
      { t: 'With doubling, n pushes copy fewer than 2n values in total.', correct: true, why: 'Each grow copies a little more than all earlier grows together, so the sum stays below the final capacity.' },
      { t: 'It only works for typed arrays.', why: 'The argument is about counting copies; it applies to any growable storage.' },
    ],
  },
  {
    q: 'In the original program `ps.length` is 100 and `ps[100].a` throws. After the rewrite the column has 128 slots. What keeps the behaviour the same?',
    options: [
      { t: 'Float64Array throws on reads past the length.', why: 'Index 100 is inside the 128-slot array, and it holds 0. Even past the end, a typed array read gives undefined, not an error.' },
      { t: 'Nothing: the compiled program prints 0.', why: 'Viscosity must preserve behaviour, and it does.' },
      { t: 'A bounds check that compares the index with the container’s length and throws the same TypeError.', correct: true, why: 'Unproven indexes are wrapped in `__vsc_bc`, which checks against `length`, not the column size.' },
      { t: 'The container trims the columns to exactly 100 slots.', why: 'It keeps spare capacity for future pushes.' },
    ],
  },
  {
    q: 'The `construct` benchmark shows SoA building 100,000 particles much faster than an array of objects. What does that tell you?',
    options: [
      { t: 'Doubling is free.', why: 'The harness preallocates the right size, so no doubling happens in this run at all.' },
      { t: 'Filling columns with numbers is cheaper than allocating one object per element.', correct: true, why: 'That is what the suite measures: the same values, stored two ways, with known sizes.' },
      { t: 'SoA is faster for every loop.', why: 'One suite says nothing about others; the chapter When SoA loses showed SoA losing badly at `materialize`.' },
      { t: 'Viscosity should always use AoSoA.', why: 'AoSoA was slower than SoA in this suite.' },
    ],
  },
];
