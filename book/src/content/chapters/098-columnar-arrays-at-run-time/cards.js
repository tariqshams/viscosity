// Chapter 98 cards. Keys are stable ids: never rename them.

export const prompts = {
  'columnar-what': {
    q: 'What is **columnar storage**?',
    a: 'Each field of a collection of records kept in its own contiguous array (a column): struct-of-arrays by its database name.',
  },
  'columnar-db': {
    q: 'What kind of work does columnar storage speed up?',
    a: 'Read-heavy work that reads a few fields (columns) of many records.',
  },
  'rtt-what': {
    q: 'What is a **run-time transformation** of data layout?',
    a: 'Changing how the data is stored while the program runs, using what the engine observes to decide when it pays.',
  },
  'amortize': {
    q: 'Converting an array to columns mid-run costs time. How can it still be a win?',
    a: 'The cost is paid once and amortized over the many faster accesses that follow, so it only pays for arrays used enough.',
  },
  'duplication-why': {
    q: 'Why does a run-time columnar transformation need duplicated loops?',
    a: 'Compiled code can’t assume the array is columnar, so a check picks a copy optimized for columns, with the original loop as the slow path.',
  },
  'small-workloads': {
    q: 'What weaknesses of the first run-time approach does the 2023 follow-up name?',
    a: 'Performance issues on smaller workloads and on more complex, nested data structures.',
  },
  'aot-safety': {
    q: 'An engine can guess about an array and deoptimize if wrong. What must Viscosity do instead?',
    a: 'Prove from the source that every use of the array can be rewritten; otherwise bail out and leave it alone.',
  },
  'no-deopt': {
    q: 'Why does Viscosity’s generated loop need no “is it columnar?” check?',
    a: 'The array is columnar from its first push and can never change layout, so the loop only ever sees one layout.',
  },
  'bail-out-result': {
    q: 'One line of the program adds a new property to one element. What does Viscosity do with that array?',
    a: 'It keeps it as an array of objects, and `explain` gives that line as the reason.',
  },
};

export const examples = {};

const HOT = `const HOT = 3;

class HotArray {
  constructor(objs) {
    this.rows = objs;
    this.cols = null;
    this.n = objs.length;
    this.uses = 0;
  }
  get mode() {
    return this.cols
      ? 'columns' : 'rows';
  }
  // rows -> one Float64Array per field,
  // only if every row has the same
  // numeric fields
  columnarize() {
    const rs = this.rows;
    const ks = Object.keys(rs[0]);
    const m = ks.length, n = rs.length;
    const ok = rs.every((r) =>
      Object.keys(r).length === m &&
      ks.every((k) =>
        typeof r[k] === 'number'));
    if (!ok) return;
    this.cols = {};
    for (const k of ks) {
      const c = new Float64Array(n);
      for (let i = 0; i < n; i++) {
        c[i] = rs[i][k];
      }
      this.cols[k] = c;
    }
    this.rows = null;
  }
  // columns -> objects again
  rowify() {
    const ks = Object.keys(this.cols);
    this.rows = [];
    for (let i = 0; i < this.n; i++) {
      const r = {};
      for (const k of ks) {
        r[k] = this.cols[k][i];
      }
      this.rows.push(r);
    }
    this.cols = null;
  }
  get(i, k) {
    return this.cols
      ? this.cols[k][i]
      : this.rows[i][k];
  }`;

export const exercises = {
  hotArray: {
    title: 'Columnarize when hot',
    prompt:
      'A toy run-time transformation (not the papers’ design). `HotArray` starts as rows of objects and can `columnarize()` and `rowify()`. Write `sum(k)`: count one use; when there are no columns yet and uses have reached `HOT`, call `columnarize()`; then return the sum of field `k`. Write `set(i, k, v)`: in columns mode, if `k` has a column and `v` is a number, write it into the column; otherwise the guard has failed, so `rowify()` first. In rows mode, just set `rows[i][k] = v`.',
    starter: `${HOT}
  sum(k) {
    return 0;
  }
  set(i, k, v) {
    this.rows[i][k] = v;
  }
}`,
    solution: `${HOT}
  sum(k) {
    this.uses++;
    if (!this.cols &&
        this.uses >= HOT) {
      this.columnarize();
    }
    let s = 0;
    for (let i = 0; i < this.n; i++) {
      s += this.get(i, k);
    }
    return s;
  }
  set(i, k, v) {
    if (this.cols) {
      const c = this.cols[k];
      if (c && typeof v === 'number') {
        c[i] = v;
        return;
      }
      this.rowify(); // guard failed
    }
    this.rows[i][k] = v;
  }
}`,
    tests: `const make = () => new HotArray([
  { x: 1, vx: 10 },
  { x: 2, vx: 20 },
  { x: 3, vx: 30 },
]);
test('rows until it is hot', () => {
  const a = make();
  expect(a.sum('x')).toBe(6);
  expect(a.sum('x')).toBe(6);
  expect(a.mode).toBe('rows');
  expect(a.sum('vx')).toBe(60);
  expect(a.mode).toBe('columns');
  expect(a.sum('x')).toBe(6);
});
test('numbers stay in the columns', () => {
  const a = make();
  a.sum('x'); a.sum('x'); a.sum('x');
  a.set(0, 'x', 1.5);
  expect(a.mode).toBe('columns');
  expect(a.sum('x')).toBe(6.5);
});
test('a string falls back to rows', () => {
  const a = make();
  a.sum('x'); a.sum('x'); a.sum('x');
  a.set(1, 'x', 'two');
  expect(a.mode).toBe('rows');
  expect(a.get(1, 'x')).toBe('two');
  expect(a.get(2, 'vx')).toBe(30);
});
test('a new field falls back, for good', () => {
  const a = make();
  a.sum('x'); a.sum('x'); a.sum('x');
  a.set(2, 'tag', 'odd');
  expect(a.mode).toBe('rows');
  expect(a.get(2, 'tag')).toBe('odd');
  expect(a.sum('x')).toBe(6);
  expect(a.mode).toBe('rows');
});`,
    hints: [
      'In `sum`, increment `this.uses` first, then columnarize only when `!this.cols && this.uses >= HOT`. `get(i, k)` already reads from whichever storage is current.',
      'In `set`, the guard is `this.cols[k] && typeof v === \'number\'`. If it holds, write into the column and return.',
      'If the guard fails, call `this.rowify()` and then fall through to the ordinary `this.rows[i][k] = v`.',
    ],
    walkthrough: `\`\`\`js
set(i, k, v) {
  if (this.cols) {
    const c = this.cols[k];
    if (c && typeof v === 'number') {
      c[i] = v;
      return;
    }
    this.rowify(); // guard failed
  }
  this.rows[i][k] = v;
}
\`\`\`

- **The guard.** A \`Float64Array\` can only hold numbers, and only for the fields it has. A string would silently become \`NaN\`, and a new field has no column at all. So check both before writing.
- **The fallback.** When the guard fails, the toy turns the columns back into objects and does the write the ordinary way. The answer stays correct; only the speed changes. That is the promise every speculating engine makes.
- **It settles.** After a string or an extra field, \`columnarize\` refuses (not every row has the same numeric fields), so the array doesn't flip back and forth. Real systems must avoid such cycles too, just as Truffle nodes only widen.
- **What a real engine does differently.** It decides with real profiles rather than a fixed \`HOT\`, works on its own internal storage rather than a wrapper class, and its compiled loops check the array's state with guards and duplicated loop copies. Viscosity avoids all of this by proving, before the program runs, that no such write can happen.`,
    wrong: [
      {
        code: `${HOT}
  sum(k) {
    this.uses++;
    if (!this.cols &&
        this.uses >= HOT) {
      this.columnarize();
    }
    let s = 0;
    for (let i = 0; i < this.n; i++) {
      s += this.get(i, k);
    }
    return s;
  }
  set(i, k, v) {
    if (this.cols) {
      this.cols[k][i] = v;
      return;
    }
    this.rows[i][k] = v;
  }
}`,
        why: 'No guard. Writing `\'two\'` into a `Float64Array` stores `NaN`, and a new field has no column, so `this.cols[k]` is `undefined` and the write throws. Check before writing, and fall back with `rowify()`.',
      },
      {
        code: `${HOT}
  sum(k) {
    this.uses++;
    if (!this.cols &&
        this.uses > HOT) {
      this.columnarize();
    }
    let s = 0;
    for (let i = 0; i < this.n; i++) {
      s += this.get(i, k);
    }
    return s;
  }
  set(i, k, v) {
    if (this.cols) {
      const c = this.cols[k];
      if (c && typeof v === 'number') {
        c[i] = v;
        return;
      }
      this.rowify();
    }
    this.rows[i][k] = v;
  }
}`,
        why: 'Off by one: with `>`, the array only becomes columnar on the fourth use. It should switch when the uses reach `HOT`.',
      },
    ],
  },
  twoCopies: {
    optional: true,
    title: 'Duplicate the loop by hand',
    prompt:
      'An array `a` is either `{ n, cols }` (columns: an object of `Float64Array`s) or `{ n, rows }` (an array of objects); the other property is `null`. Write `scale(a, k, f)`, which multiplies field `k` of every element by `f`, with **two copies** of the loop: one that uses only `a.cols[k]`, and one that uses only `a.rows`. Check which storage `a` has once, before the loop.',
    starter: `function scale(a, k, f) {
  for (let i = 0; i < a.n; i++) {
    a.rows[i][k] *= f;
  }
}`,
    solution: `function scale(a, k, f) {
  if (a.cols) {
    const c = a.cols[k];
    for (let i = 0; i < a.n; i++) {
      c[i] *= f;
    }
  } else {
    const rs = a.rows;
    for (let i = 0; i < a.n; i++) {
      rs[i][k] *= f;
    }
  }
}`,
    tests: `test('rows are scaled', () => {
  const a = { n: 2, cols: null,
    rows: [{ x: 1 }, { x: 2 }] };
  scale(a, 'x', 10);
  expect(a.rows[1].x).toBe(20);
});
test('columns are scaled', () => {
  const a = { n: 2, rows: null,
    cols: { x: new Float64Array([1, 2]) } };
  scale(a, 'x', 3);
  expect([...a.cols.x]).toEqual([3, 6]);
});
test('other fields are untouched', () => {
  const a = { n: 1, rows: null, cols: {
    x: new Float64Array([1]),
    y: new Float64Array([5]) } };
  scale(a, 'x', 2);
  expect(a.cols.y[0]).toBe(5);
});`,
    hints: [
      'Test `a.cols` once, before any loop.',
      'In the columns copy, take `const c = a.cols[k]` outside the loop, so the loop body is just `c[i] *= f`.',
    ],
    walkthrough: `\`\`\`js
if (a.cols) {
  const c = a.cols[k];
  for (let i = 0; i < a.n; i++) {
    c[i] *= f;
  }
} else {
  // the original loop over objects
}
\`\`\`

- **One check, two loops.** The layout test runs once, not once per element. Each copy can then be optimized for exactly one layout: the columns copy is a plain loop over one typed array.
- **This is the shape of control-flow duplication.** In the 2023 paper the Graal compiler does this to compiled code automatically, and the original loop must still cope with both kinds of storage, because the array may change layout inside it. Here, nothing changes the layout during the loop, so each copy handles only one.`,
    wrong: [
      {
        code: `function scale(a, k, f) {
  for (let i = 0; i < a.n; i++) {
    if (a.cols) {
      a.cols[k][i] *= f;
    }
    a.rows[i][k] *= f;
  }
}`,
        why: 'It checks inside the loop and then always touches `a.rows`, which is `null` for columnar arrays. Decide once, before the loop, and use only one storage in each copy.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What is columnar storage?',
    options: [
      { t: 'Storing each record’s fields together, one object per element', why: 'That is the row layout: an array of objects.' },
      { t: 'Each field of the records in its own contiguous array', correct: true, why: 'It is struct-of-arrays, the name databases use.' },
      { t: 'Storing an array in a database', why: 'It is a layout, wherever the data lives.' },
      { t: 'Sorting an array by one field', why: 'Order doesn’t change; only where each field’s values are kept.' },
    ],
  },
  {
    q: 'Where did Makor et al. implement their columnar transformation?',
    options: [
      { t: 'In V8, as a TurboFan pass', why: 'The work was done in GraalJS, on Truffle and the Graal compiler.' },
      { t: 'In a source-to-source compiler', why: 'That is Viscosity’s approach. Theirs runs inside the engine, at run time.' },
      { t: 'In the GraalJS engine, while the program runs', correct: true, why: 'They transform arrays of objects to columnar arrays automatically at run time, amortizing the cost.' },
      { t: 'In the CPU’s cache hardware', why: 'It is a software transformation of how the engine stores arrays.' },
    ],
  },
  {
    q: 'Why does the 2023 follow-up duplicate loops?',
    options: [
      { t: 'To unroll them for speed', why: 'Duplication here is about array layout, not unrolling.' },
      { t: 'So a check can pick a copy optimized for columnar arrays, with the original loop as the slow path', correct: true, why: 'Compiled code can’t assume the array’s state, so each copy is specialized for one.' },
      { t: 'To run them on two threads', why: 'Nothing here is parallel.' },
      { t: 'Because JavaScript requires two passes over every array', why: 'There is no such rule.' },
    ],
  },
  {
    q: 'Viscosity can’t prove an array is safe to transform. What happens?',
    options: [
      { t: 'It transforms it anyway and deoptimizes if something goes wrong', why: 'Viscosity has no deoptimization: its output is ordinary JavaScript.' },
      { t: 'It inserts a run-time check and converts the array back if needed', why: 'It never converts back; there is nothing to convert.' },
      { t: 'The build fails', why: 'An unsafe array isn’t an error. It is simply left alone.' },
      { t: 'It bails out: that array stays an array of objects, and `explain` says why', correct: true, why: 'Anything it can’t prove is left unchanged.' },
    ],
  },
  {
    q: 'What can a run-time transformation know that Viscosity can’t?',
    options: [
      { t: 'The real sizes and values of the arrays in this run', correct: true, why: 'Viscosity must estimate sizes from the source, or use a recorded profile.' },
      { t: 'Which fields a loop reads', why: 'Viscosity finds that from the source too.' },
      { t: 'Whether the program is written in JavaScript', why: 'Both know that.' },
      { t: 'The order of statements', why: 'Both see the program’s structure.' },
    ],
  },
  {
    q: 'In this book’s end-to-end run, why might `nbody` gain much less than `ledger`?',
    options: [
      { t: 'Because Viscosity failed to transform it', why: 'Its layout column says `bs=soa`: it was transformed.' },
      { t: 'Because nbody uses strings', why: 'Its fields are numbers.' },
      { t: 'It has only 1,500 bodies and each step reads every field of the others, so there is less to gain from columns', correct: true, why: 'Columns pay most on large arrays where a loop reads a few fields; small collections and whole-record access gain less, as the microbenchmarks showed too.' },
      { t: 'Because the run-time research doesn’t support it', why: 'The two systems are unrelated in this measurement.' },
    ],
  },
];
