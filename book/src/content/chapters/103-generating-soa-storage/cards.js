// Chapter 103 cards. Keys are stable ids: never rename them.

export const prompts = {
  'col-what': {
    q: 'What is column storage?',
    a: 'One array per field; element i’s fields are at index i of every column.',
  },
  'ctr-what': {
    q: 'What is Viscosity’s SoA container?',
    a: 'A generated class instance holding the columns, `length` and `cap`, with `push`, `grow` and `of`.',
  },
  'ctr-push-ret': {
    q: 'What does the generated `push` return, and why?',
    a: 'The new length, because `Array.prototype.push` does, and the program may use the result.',
  },
  'ctr-of': {
    q: 'What replaces an array literal like `[{ x: 1, y: 2 }, { x: 3, y: 4 }]`?',
    a: '`__Vsc_pts.of(1, 2, 3, 4)`: every field of every record, flattened, pushed in groups.',
  },
  'ctr-length': {
    q: 'In the container, what is the difference between `length` and `cap`?',
    a: '`length` counts the elements in use; `cap` is how many slots each column has.',
  },
  'ctr-grow': {
    q: 'What does the generated `grow()` do?',
    a: 'Doubles `cap`, and for each typed column makes a bigger Float64Array, copies the old values with `set`, and swaps it in.',
  },
  'col-typed-why': {
    q: 'Why can only provably numeric fields get a Float64Array column?',
    a: 'A Float64Array converts whatever is stored to a number: a string like `\'a\'` would come back as NaN.',
  },
  'ctr-plain': {
    q: 'Why doesn’t `grow()` touch plain-array columns?',
    a: 'A plain array lengthens by itself when you write past its end.',
  },
  'col-negzero': {
    q: 'Does a Float64Array column keep `-0` and `NaN`?',
    a: 'Yes: it holds any IEEE 754 double exactly.',
  },
  'col-reserved': {
    q: 'What column does Viscosity use for a field named `length`?',
    a: 'A renamed one, `f` + the field’s position + `_` (e.g. `f0_`, or `f0__` if a real field is already called `f0_`), so it can’t overwrite the container’s own `length`.',
  },
};

export const examples = {
  typedcol: {
    title: 'What a Float64Array stores',
    code: `const col = new Float64Array(4);
console.log(col); // zero-filled

col[0] = 2.5;
col[1] = -0;
col[2] = '7';   // converted
col[3] = 'abc'; // converted
console.log(col[0]);
console.log(Object.is(col[1], -0));
console.log(col[2], typeof col[2]);
console.log(col[3]);

// Writing past the end does nothing:
col[4] = 9;
console.log(col.length, col[4]);

// A plain array takes anything, and
// lengthens by itself:
const arr = [];
arr[0] = 'abc';
arr[3] = null;
console.log(arr.length, arr[0]);`,
  },
};

export const exercises = {
  soaContainer: {
    title: 'A tiny SoA container',
    prompt:
      'Write a class `Ps` for records `{ x, vx }`. `new Ps(cap)` (default `2`) sets `length` to `0`, `cap` to `cap`, and makes `x` and `vx` as `Float64Array`s of `cap` slots. `push(x, vx)` writes both into slot `length`, growing first if the columns are full, and returns the new length. `grow()` doubles `cap` and replaces each column with a bigger copy.',
    starter: `class Ps {
  constructor(cap = 2) {
    this.length = 0;
    this.cap = cap;
    this.x = new Float64Array(cap);
    this.vx = new Float64Array(cap);
  }
  push(x, vx) {
    const n = this.length;
    this.x[n] = x;
    this.vx[n] = vx;
    this.length = n + 1;
  }
}`,
    solution: `class Ps {
  constructor(cap = 2) {
    this.length = 0;
    this.cap = cap;
    this.x = new Float64Array(cap);
    this.vx = new Float64Array(cap);
  }
  push(x, vx) {
    const n = this.length;
    if (n === this.cap) this.grow();
    this.x[n] = x;
    this.vx[n] = vx;
    return (this.length = n + 1);
  }
  grow() {
    const cap = (this.cap *= 2);
    let t = new Float64Array(cap);
    t.set(this.x);
    this.x = t;
    t = new Float64Array(cap);
    t.set(this.vx);
    this.vx = t;
  }
}`,
    tests: `test('starts empty, with typed columns', () => {
  const p = new Ps();
  expect(p.length).toBe(0);
  expect(p.cap).toBe(2);
  expect(p.x instanceof Float64Array)
    .toBeTruthy();
});
test('push returns the new length', () => {
  const p = new Ps();
  expect(p.push(1, 2)).toBe(1);
  expect(p.push(3, 4)).toBe(2);
});
test('it grows by doubling', () => {
  const p = new Ps();
  for (let i = 0; i < 5; i++) p.push(i, 1);
  expect(p.cap).toBe(8);
  expect(p.x.length).toBe(8);
  expect(p.vx.length).toBe(8);
});
test('values survive growing', () => {
  const p = new Ps(1);
  for (let i = 0; i < 10; i++) {
    p.push(i * 10, -i);
  }
  expect(p.length).toBe(10);
  expect(p.x[1]).toBe(10);
  expect(p.vx[2]).toBe(-2);
  expect(p.x[9]).toBe(90);
  expect(p.vx[9]).toBe(-9);
});
test('columns stay typed after growing', () => {
  const p = new Ps();
  for (let i = 0; i < 3; i++) p.push(i, i);
  expect(p.vx instanceof Float64Array)
    .toBeTruthy();
});`,
    hints: [
      'In `push`, compare `this.length` with `this.cap` before writing. If they are equal, call `this.grow()`.',
      '`return (this.length = n + 1)` updates the length and returns it in one go.',
      'In `grow`, `t.set(this.x)` copies every old value into the start of the new array `t`.',
    ],
    walkthrough: `This is the class Viscosity generates, minus \`of\`, with a smaller starting size so the tests can see it grow.

The starter fails in two ways. Without the \`n === this.cap\` check, \`push\` writes past the end of a \`Float64Array\`, and a typed array silently ignores those writes, so the values just vanish: nothing throws. That is worth remembering, because a plain array would have grown and hidden the bug. And without a \`return\`, \`push\` gives \`undefined\`, which breaks any program that used the result of \`Array.prototype.push\`.

\`grow\` must replace every typed column, not only one, because all columns share one \`cap\`. And it must build a new \`Float64Array\`: a typed array’s length is fixed when it is made, so there is no way to lengthen the old one in place. \`set\` copies the old contents to the front of the new one, and the rest stays zero until pushes fill it.`,
    wrong: [
      {
        code: `class Ps {
  constructor(cap = 2) {
    this.length = 0;
    this.cap = cap;
    this.x = new Float64Array(cap);
    this.vx = new Float64Array(cap);
  }
  push(x, vx) {
    const n = this.length;
    if (n === this.cap) this.grow();
    this.x[n] = x;
    this.vx[n] = vx;
    return (this.length = n + 1);
  }
  grow() {
    const cap = (this.cap *= 2);
    const t = new Float64Array(cap);
    t.set(this.x);
    this.x = t;
  }
}`,
        why: 'Only `x` grows. `vx` keeps its old size, so writes past its end are silently dropped and `vx[9]` reads as `undefined`.',
      },
      {
        code: `class Ps {
  constructor(cap = 2) {
    this.length = 0;
    this.cap = cap;
    this.x = new Float64Array(cap);
    this.vx = new Float64Array(cap);
  }
  push(x, vx) {
    const n = this.length;
    if (n === this.cap) this.grow();
    this.x[n] = x;
    this.vx[n] = vx;
    return (this.length = n + 1);
  }
  grow() {
    const cap = (this.cap *= 2);
    this.x = new Float64Array(cap);
    this.vx = new Float64Array(cap);
  }
}`,
        why: 'The new columns are bigger but empty: without `set`, every value pushed so far is lost (reset to 0).',
      },
    ],
  },
  ofLiteral: {
    optional: true,
    title: 'Replacing an array literal',
    prompt:
      'Add `static of(...v)` to `Ps`. It receives the fields of every record flattened, `x0, vx0, x1, vx1, …`, and returns a new `Ps` holding those records, created with room for at least 16 (`Math.max(16, v.length / 2)`). Also include the class from the core exercise.',
    starter: `class Ps {
  constructor(cap = 2) {
    this.length = 0;
    this.cap = cap;
    this.x = new Float64Array(cap);
    this.vx = new Float64Array(cap);
  }
  static of(...v) {
    return new Ps();
  }
}`,
    solution: `class Ps {
  constructor(cap = 2) {
    this.length = 0;
    this.cap = cap;
    this.x = new Float64Array(cap);
    this.vx = new Float64Array(cap);
  }
  static of(...v) {
    const n = v.length / 2;
    const c = new Ps(Math.max(16, n));
    for (let i = 0; i < n; i++) {
      c.push(v[2 * i], v[2 * i + 1]);
    }
    return c;
  }
  push(x, vx) {
    const n = this.length;
    if (n === this.cap) this.grow();
    this.x[n] = x;
    this.vx[n] = vx;
    return (this.length = n + 1);
  }
  grow() {
    const cap = (this.cap *= 2);
    let t = new Float64Array(cap);
    t.set(this.x);
    this.x = t;
    t = new Float64Array(cap);
    t.set(this.vx);
    this.vx = t;
  }
}`,
    tests: `test('two records', () => {
  const p = Ps.of(1, 2, 3, 4);
  expect(p.length).toBe(2);
  expect(p.x[1]).toBe(3);
  expect(p.vx[1]).toBe(4);
  expect(p.cap).toBe(16);
});
test('-0 and NaN survive', () => {
  const p = Ps.of(-0, NaN);
  expect(Object.is(p.x[0], -0))
    .toBeTruthy();
  expect(Number.isNaN(p.vx[0]))
    .toBeTruthy();
});
test('a big literal gets room for all', () => {
  const v = [];
  for (let i = 0; i < 40; i++) v.push(i);
  const p = Ps.of(...v);
  expect(p.length).toBe(20);
  expect(p.cap).toBe(20);
  expect(p.x[19]).toBe(38);
});`,
    hints: [
      'Make the container with `new Ps(Math.max(16, v.length / 2))`.',
      'Walk `v` two at a time and call `push(v[i], v[i + 1])`.',
    ],
    walkthrough: `\`of\` is what Viscosity puts in place of an array literal of records: \`[{ x: 1, vx: 2 }, { x: 3, vx: 4 }]\` becomes \`__Vsc_ps.of(1, 2, 3, 4)\`. Flattening keeps the call simple, and the values are still evaluated in the order the programmer wrote them, which matters if one of them has a side effect.

Making the container with exactly as many slots as needed (but at least 16) means the pushes never trigger \`grow\`. Going through \`push\` rather than writing the columns directly keeps one code path for adding an element.`,
    wrong: [
      {
        code: `class Ps {
  constructor(cap = 2) {
    this.length = 0;
    this.cap = cap;
    this.x = new Float64Array(cap);
    this.vx = new Float64Array(cap);
  }
  static of(...v) {
    const c = new Ps(16);
    for (let i = 0; i < v.length; i++) {
      c.push(v[i], v[i + 1]);
    }
    return c;
  }
  push(x, vx) {
    const n = this.length;
    if (n === this.cap) this.grow();
    this.x[n] = x;
    this.vx[n] = vx;
    return (this.length = n + 1);
  }
  grow() {
    const cap = (this.cap *= 2);
    let t = new Float64Array(cap);
    t.set(this.x);
    this.x = t;
    t = new Float64Array(cap);
    t.set(this.vx);
    this.vx = t;
  }
}`,
        why: 'The loop steps by 1, not 2, so each value starts a record: four values make four records, the wrong ones.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does Viscosity put in place of `const ps = [];` for a collection planned as SoA?',
    options: [
      { t: '`const ps = new Float64Array(16);`', why: 'One typed array can’t hold several fields. Each field gets its own column inside a container.' },
      { t: '`const ps = new __Vsc_ps();`, an instance of a generated container class.', correct: true, why: 'Right. The class is emitted at the top of the file, and holds one column per field.' },
      { t: '`const ps = { x: [], vx: [] };`', why: 'Close in spirit, but the real container also has `length`, `cap`, `push`, `grow` and `of`, and uses Float64Array for numeric fields.' },
    ],
  },
  {
    q: 'The generated `push(v0, v1)` returns…',
    options: [
      { t: 'nothing, since the columns are updated in place.', why: 'The program may use the result of `push`, so it must match Array’s.' },
      { t: 'the container, so calls can be chained.', why: '`Array.prototype.push` doesn’t return the array, so neither does this.' },
      { t: 'the index of the new element.', why: 'Close: that would be the old length. It returns the new length.' },
      { t: 'the new length, like `Array.prototype.push`.', correct: true, why: 'Yes: `return (this.length = n + 1)`.' },
    ],
  },
  {
    q: 'A container has `cap` 16 and `length` 16. What does the next `push` do first?',
    options: [
      { t: 'Calls `grow()`, which doubles every typed column to 32 and copies the values.', correct: true, why: 'Right: `n === this.cap`, so it grows, then writes slot 16.' },
      { t: 'Writes slot 16, and the Float64Array lengthens.', why: 'A typed array’s length is fixed. A write past the end is silently ignored, which is why grow must come first.' },
      { t: 'Throws a RangeError.', why: 'Nothing throws: the container grows.' },
    ],
  },
  {
    q: 'Which records get only plain-array columns, no Float64Array at all?',
    options: [
      { t: '`{ x: i, y: 2 * i }`', why: 'Both fields are provably numbers: two Float64Array columns.' },
      { t: '`{ hp: 100, id: \'e\' + i }`', why: '`hp` is numeric and gets a typed column; only `id` is a plain array.' },
      { t: '`{ name: \'p\' + i, tag: null }`', correct: true, why: 'Yes: neither field is provably a number. (Without an annotation, the cost model would keep such a collection as objects.)' },
    ],
  },
  {
    q: 'Why doesn’t `grow()` copy plain-array columns?',
    options: [
      { t: 'They are copied lazily, on the next read.', why: 'They are never copied: they don’t need to be.' },
      { t: 'A plain array lengthens by itself when written past its end.', correct: true, why: 'Right. Only Float64Arrays have a fixed length.' },
      { t: 'Plain columns are never written after creation.', why: 'They are: `push` writes every column, and the program may assign their fields.' },
    ],
  },
  {
    q: 'A record has fields `{ length, x }`. What are the columns called?',
    options: [
      { t: '`length` and `x`', why: 'A `length` column would overwrite the container’s own element count.' },
      { t: '`_length` and `x`', why: 'The renaming uses the field’s position, not its name.' },
      { t: '`f0_` and `f1_`', why: 'Only clashing or non-identifier names are renamed; `x` keeps its name.' },
      { t: '`f0_` and `x`', correct: true, why: 'Yes: `length` is reserved, so field 0 becomes `f0_`; `x` is fine as it is.' },
    ],
  },
];
