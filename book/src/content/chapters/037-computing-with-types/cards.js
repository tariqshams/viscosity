// Chapter 37 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'keyof-what': {
    q: 'What is `keyof Particle`, for `interface Particle { x: number; y: number; vx: number; vy: number }`?',
    a: 'The union of its keys: `\'x\' | \'y\' | \'vx\' | \'vy\'`.',
  },
  'keyof-typo': {
    q: 'With `get<T, K extends keyof T>(o: T, k: K)`, what happens to `get(p, \'vX\')` when `p` is a `Particle`?',
    a: '`tsc` rejects it: `\'vX\'` is not one of `keyof Particle`, so the misspelt name is caught before the program runs.',
  },
  'keyof-runtime': {
    q: 'Why does TypeScript type `Object.keys(o)` as `string[]` rather than `(keyof T)[]`?',
    a: 'An object may have more properties at run time than its type lists (extra properties are allowed), so the keys found can be names `keyof` does not know.',
  },
  'index-what': {
    q: 'What is `Particle[\'x\']`?',
    a: 'An indexed access type: the type of the property `x` of `Particle`, here `number`.',
  },
  'index-union': {
    q: 'For `type Row = { id: number; name: string }`, what is `Row[keyof Row]`?',
    a: '`number | string`: indexing with a union of keys gives the union of their types.',
  },
  'index-tags': {
    q: 'How can you get the union of every `kind` in a discriminated union `Expr` without writing the kinds out again?',
    a: '`Expr[\'kind\']`: indexing the union by its tag gives the union of all the tags.',
  },
  'mapped-what': {
    q: 'In `{ [K in keyof T]: T[K][] }`, what does `[K in keyof T]` do?',
    a: 'It loops over the keys of `T`: one property named `K` is made for each key, with the type after the colon.',
  },
  'mapped-columns': {
    q: 'With `type Columns<T> = { [K in keyof T]: T[K][] }`, what is `Columns<{ id: number; name: string }>`?',
    a: '`{ id: number[]; name: string[] }`.',
  },
  'mapped-optional': {
    q: 'What does the `?` do in `{ [K in keyof T]?: T[K] }`?',
    a: 'It makes every property optional, so an object with any subset of the fields fits.',
  },
};

export const examples = {
  'keys-at-runtime': {
    title: 'keyof is about the type, not the object',
    lang: 'ts',
    code: `interface P { x: number; y: number }

const raw = { x: 1, y: 2, tag: 'a' };
// Allowed: raw has at least x and y.
const p: P = raw;

// keyof P is 'x' | 'y', but the
// object itself has three keys:
console.log(Object.keys(p));`,
  },
};

export const exercises = {
  pluck: {
    lang: 'ts',
    title: 'Pull out one column',
    prompt: 'Write `pluck(xs, k)` that **returns** a new array holding the value of property `k` from each record in `xs`, in order. Its type is `pluck<T, K extends keyof T>(xs: T[], k: K): T[K][]`, so `pluck(ps, \'x\')` is a `number[]` and `pluck(ps, \'vX\')` is rejected by `tsc`. (The runner erases types, so the tests check behaviour.)',
    starter: `function pluck<T, K extends keyof T>(
  xs: T[],
  k: K,
): T[K][] {
  // your code here
}

const ps = [
  { x: 1, vx: 2 },
  { x: 5, vx: -1 },
];
console.log(pluck(ps, 'x'));`,
    solution: `function pluck<T, K extends keyof T>(
  xs: T[],
  k: K,
): T[K][] {
  const out: T[K][] = [];
  for (const x of xs) {
    out.push(x[k]);
  }
  return out;
}`,
    tests: `const ps = [
  { x: 1, vx: 2 },
  { x: 5, vx: -1 },
];
test('the x column', () => {
  expect(pluck(ps, 'x')).toEqual([1, 5]);
});
test('the vx column', () => {
  expect(pluck(ps, 'vx')).toEqual([2, -1]);
});
test('strings work too', () => {
  const ns = [{ n: 'a' }, { n: 'b' }];
  expect(pluck(ns, 'n')).toEqual(['a', 'b']);
});
test('empty in, empty out', () => {
  expect(pluck([], 'x')).toEqual([]);
});
test('a new array each time', () => {
  expect(pluck(ps, 'x') === pluck(ps, 'x')).toBe(false);
});`,
    hints: [
      'The key is in a variable, `k`. Which kind of property access reads a property whose name is in a variable?',
      'Bracket access (from *Objects: things with named parts*): `x[k]` reads the property named by `k`. Make an empty array, and push `x[k]` for each record.',
      'Write `const out: T[K][] = [];`, then `for (const x of xs) { out.push(x[k]); }`, then `return out;`.',
    ],
    walkthrough: `**How to think about it.** This is the step at the heart of the whole book: turning an array of records into one column. At run time it is a plain loop that reads the same property from every record. Because the property's name arrives in a variable, the read must use brackets, \`x[k]\`, not a dot (\`x.k\` would read a property literally called \`k\`). The types say the rest: \`K extends keyof T\` accepts only real field names, and \`T[K][]\` says the column holds values of that field's type.

**The solution, line by line.**

- \`function pluck<T, K extends keyof T>(\` declares two blanks. \`T\` is the record type; \`K\` is constrained to be one of \`T\`'s keys, so a misspelt name is a type error.
- \`  xs: T[],\` the records; \`  k: K,\` the key to read.
- \`): T[K][] {\` the result is an array of whatever type the key \`K\` has in \`T\`. For \`pluck(ps, 'x')\`, inference makes \`T\` the record type and \`K\` the literal \`'x'\`, so the result is \`number[]\`.
- \`  const out: T[K][] = [];\` a new, empty column.
- \`  for (const x of xs) {\` visits each record in order.
- \`    out.push(x[k]);\` reads the property named by \`k\` and adds it to the end of the column. The checker knows \`x[k]\` has type \`T[K]\`, which is why the push is allowed.
- \`  }\` ends the loop, and \`  return out;\` hands back the column.

**Common wrong attempts.**

- \`out.push(x.k)\`: the dot reads a property named "k", which these records do not have, so every slot is \`undefined\`. (\`tsc\` would also say "Property 'k' does not exist on type 'T'".)
- Returning \`xs\` or writing into the records: the tests want a new array of values, not the records themselves.`,
    wrong: [
      {
        code: `function pluck(xs, k) {
  const out = [];
  for (const x of xs) {
    out.push(x.k);
  }
  return out;
}`,
        why: '`x.k` reads a property literally named `k`, which is missing, so the column is all `undefined`. Use `x[k]`.',
      },
      {
        code: `function pluck(xs, k) {
  const out = [];
  for (const x of xs) {
    out.push(x);
  }
  return out;
}`,
        why: 'This copies the records, not the values of `k`, so `pluck(ps, \'x\')` is not `[1, 5]`.',
      },
    ],
  },
  toColumns: {
    optional: true,
    lang: 'ts',
    title: 'Records to columns',
    prompt: 'Write `toColumns(xs)` that turns an array of records into an object of columns: one property per key of the **first** record, holding an array of that key’s values from every record, in order. For an empty array, return `{}`. Its type is `toColumns<T>(xs: T[]): Columns<T>`, with `Columns` from the chapter.',
    starter: `type Columns<T> = {
  [K in keyof T]: T[K][];
};

function toColumns<T extends object>(
  xs: T[],
): Columns<T> {
  // your code here
}

const ps = [
  { x: 1, vx: 2 },
  { x: 5, vx: -1 },
];
console.log(toColumns(ps));`,
    solution: `type Columns<T> = {
  [K in keyof T]: T[K][];
};

function toColumns<T extends object>(
  xs: T[],
): Columns<T> {
  const cols: any = {};
  if (xs.length === 0) return cols;
  for (const k of Object.keys(xs[0])) {
    cols[k] = [];
  }
  for (const x of xs) {
    for (const k of Object.keys(cols)) {
      cols[k].push((x as any)[k]);
    }
  }
  return cols;
}`,
    tests: `const ps = [
  { x: 1, vx: 2 },
  { x: 5, vx: -1 },
];
test('one column per key', () => {
  expect(toColumns(ps)).toEqual({
    x: [1, 5],
    vx: [2, -1],
  });
});
test('a single record', () => {
  expect(toColumns([{ a: 'z' }]))
    .toEqual({ a: ['z'] });
});
test('empty gives an empty object', () => {
  expect(toColumns([])).toEqual({});
});
test('keys come from the first record', () => {
  const rs = [{ a: 1 }, { a: 2, b: 3 }];
  expect(toColumns(rs)).toEqual({ a: [1, 2] });
});`,
    hints: [
      'Two passes: first make an empty array for each key of the first record, then visit every record and push into each column.',
      '`Object.keys(xs[0])` gives the first record’s keys as strings. Handle the empty array before you read `xs[0]`.',
      'Inside the type-erased body, the checker cannot follow a string key into `Columns<T>`, so the walkthrough uses `any` for the object being built; the signature still promises callers the exact `Columns<T>`.',
    ],
    walkthrough: `**How to think about it.** This is \`pluck\` for every key at once, which is exactly the array-of-records to columns rewrite. The keys come from the first record (\`Object.keys\`), and each becomes a column. One thing is new: inside the body, the keys are only \`string\`s at run time, and the checker cannot prove that \`cols[k]\` is the right column, so the body uses \`any\`, which switches checking off locally. The *signature* is still precise: callers get \`Columns<T>\`. This split (a carefully typed outside, a small unchecked inside) is common in real libraries, and it is honest about where the checker cannot help.

**The solution, line by line.**

- \`type Columns<T> = { [K in keyof T]: T[K][]; };\` the mapped type from the chapter.
- \`function toColumns<T extends object>(xs: T[]): Columns<T> {\` \`T extends object\` says the records are objects (so they have keys at all).
- \`  const cols: any = {};\` the object being built, unchecked inside the function.
- \`  if (xs.length === 0) return cols;\` with no records there is no first record to read keys from, so return the empty object.
- \`  for (const k of Object.keys(xs[0])) { cols[k] = []; }\` one empty column per key of the first record.
- \`  for (const x of xs) {\` then each record in order...
- \`    for (const k of Object.keys(cols)) {\` ...and each column...
- \`      cols[k].push((x as any)[k]);\` ...gets that record's value. \`x as any\` tells the checker to stop checking this one read (a *type assertion*, nothing to do with a test's assertions: you take responsibility).
- \`  return cols;\` the finished columns.

**Common wrong attempts.**

- Reading the keys of every record instead of the first: a record with an extra key creates a column the other records never fill, and the last test fails.
- Reading \`xs[0]\` before checking the length: \`Object.keys(undefined)\` throws a \`TypeError\`.`,
    wrong: [
      {
        code: `function toColumns(xs) {
  const cols = {};
  for (const k of Object.keys(xs[0])) {
    cols[k] = [];
  }
  for (const x of xs) {
    for (const k of Object.keys(cols)) {
      cols[k].push(x[k]);
    }
  }
  return cols;
}`,
        why: 'For an empty array, `xs[0]` is `undefined` and `Object.keys(undefined)` throws a TypeError.',
      },
      {
        code: `function toColumns(xs) {
  const cols = {};
  for (const x of xs) {
    for (const k of Object.keys(x)) {
      if (!cols[k]) cols[k] = [];
      cols[k].push(x[k]);
    }
  }
  return cols;
}`,
        why: 'Keys are taken from every record, so `{ a: 2, b: 3 }` adds a `b` column the first record never filled.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'For `type Row = { id: number; name: string }`, what is `keyof Row`?',
    options: [
      {
        t: '`number | string`',
        why: 'That is `Row[keyof Row]`, the types of the values, not the keys.',
      },
      {
        t: '`\'id\' | \'name\'`',
        correct: true,
        why: '`keyof` gives the union of the property names, each as an exact string type.',
      },
      {
        t: '`string[]`',
        why: 'That is what `Object.keys` returns at run time; `keyof` is a union type, not an array.',
      },
    ],
  },
  {
    q: `Which line does \`tsc\` reject?
\`\`\`ts
function get<T, K extends keyof T>(
  o: T, k: K): T[K] { return o[k]; }
const r = { id: 1, name: 'a' };
\`\`\``,
    options: [
      {
        t: '`get(r, \'id\')`',
        why: '`\'id\'` is one of `keyof` the record type, and the result is a `number`.',
      },
      {
        t: '`get(r, \'name\')`',
        why: '`\'name\'` is a key, so this is fine, and the result is a `string`.',
      },
      {
        t: '`get(r, \'size\')`',
        correct: true,
        why: '`\'size\'` is not assignable to `\'id\' | \'name\'`, so the constraint `K extends keyof T` fails.',
      },
    ],
  },
  {
    q: 'What is `Particle[][number]`?',
    options: [
      {
        t: '`Particle`',
        correct: true,
        why: 'Indexing an array type with `number` gives the type of its elements.',
      },
      {
        t: '`number`',
        why: 'The `number` is the index, not the answer: it asks for the type of an element.',
      },
      {
        t: 'An error: you cannot index a type with `number`',
        why: '`number` is a valid index for array types; it is the standard way to get the element type.',
      },
    ],
  },
  {
    q: 'What is `{ [K in keyof T]: boolean }` for `T = { a: string; b: number }`?',
    options: [
      {
        t: '`boolean`',
        why: 'A mapped type builds an object type, one property per key.',
      },
      {
        t: '`{ a: string; b: number }`',
        why: 'The type after the colon is `boolean`, not `T[K]`, so the old types are replaced.',
      },
      {
        t: '`{ a: boolean; b: boolean }`',
        correct: true,
        why: 'One property per key of `T`, each with the type written after the colon.',
      },
    ],
  },
  {
    q: 'A variable is labelled with `{ readonly [K in keyof T]: T[K] }`. Which is true?',
    options: [
      {
        t: 'The object is frozen at run time, so assignments throw',
        why: 'Types are erased: at run time it is an ordinary object. Only the checker refuses the assignment.',
      },
      {
        t: '`tsc` reports any assignment to its properties through that label',
        correct: true,
        why: '“Cannot assign to \'x\' because it is a read-only property.” It guards your code, not the data.',
      },
      {
        t: 'Only the first property is read-only',
        why: 'The modifier is applied to every key the mapped type visits.',
      },
    ],
  },
];
