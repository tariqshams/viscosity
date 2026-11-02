// Chapter 38 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'cond-what': {
    q: 'What is `T extends string ? \'yes\' : \'no\'` when `T` is `42`?',
    a: '`\'no\'`: `42` is not assignable to `string`, so the second branch is chosen.',
  },
  'cond-distribute': {
    q: 'A conditional type on a bare type parameter `T` is given the union `A | B`. How is it worked out?',
    a: 'Once for `A` and once for `B`, and the two answers are joined into a union (it distributes).',
  },
  'cond-never': {
    q: 'Why does `Exclude<\'num\' | \'add\', \'num\'>` come out as just `\'add\'`?',
    a: '`\'num\'` becomes `never`, and a union with `never` in it is the same union without it.',
  },
  'cond-infer': {
    q: 'What does `infer E` do in `T extends (infer E)[] ? E : never`?',
    a: 'It names the element type of the array, so the true branch can answer with it.',
  },
  'tmpl-what': {
    q: 'What is `` `get${\'X\' | \'Y\'}` ``?',
    a: 'The union `\'getX\' | \'getY\'`.',
  },
  'tmpl-cross': {
    q: 'How many string types are in `` `${A}-${B}` `` when `A` has 3 members and `B` has 4?',
    a: '12: every combination of the two unions.',
  },
  'tmpl-cap': {
    q: 'What is `Capitalize<\'vx\'>`?',
    a: '`\'Vx\'`: only the first letter changes.',
  },
  'util-partial': {
    q: 'What does `Partial<Particle>` allow?',
    a: 'Any object with some, all or none of `Particle`’s properties, each with its usual type.',
  },
  'util-omit': {
    q: 'How is `Omit<T, K>` defined from other utility types?',
    a: '`Pick<T, Exclude<keyof T, K>>`: keep every key of `T` except those in `K`.',
  },
  'util-written': {
    q: 'Are utility types such as `Partial` and `Omit` built into the TypeScript checker?',
    a: 'No. They are ordinary mapped and conditional types written in TypeScript (in `lib.es5.d.ts`). Only a few, such as `Uppercase` and `Capitalize`, are `intrinsic`, built into the checker.',
  },
};

export const examples = {
  update: {
    title: 'A partial update',
    lang: 'ts',
    code: `interface Particle {
  x: number; y: number;
  vx: number; vy: number;
}

function update(
  p: Particle,
  patch: Partial<Particle>,
): Particle {
  return { ...p, ...patch };
}

const p = { x: 0, y: 0, vx: 1, vy: 2 };
console.log(update(p, { x: 3 }));
console.log(update(p, {}));
console.log(p); // unchanged

// tsc rejects { mass: 2 } as a patch;
// the runner does not check types.`,
  },
};

export const exercises = {
  omit: {
    lang: 'ts',
    title: 'Leave some keys out',
    prompt: 'Write `omit(o, ks)` that **returns** a new object with every property of `o` except the keys listed in the array `ks`. The original object must not change. Its type is `omit<T, K extends keyof T>(o: T, ks: K[]): Omit<T, K>`.',
    starter: `function omit<T, K extends keyof T>(
  o: T,
  ks: K[],
): Omit<T, K> {
  // your code here
}

const p = { x: 1, y: 2, vx: 3, vy: 4 };
console.log(omit(p, ['vx', 'vy']));`,
    solution: `function omit<T, K extends keyof T>(
  o: T,
  ks: K[],
): Omit<T, K> {
  const out: any = { ...o };
  for (const k of ks) {
    delete out[k];
  }
  return out;
}`,
    tests: `const p = { x: 1, y: 2, vx: 3, vy: 4 };
test('drops the listed keys', () => {
  expect(omit(p, ['vx', 'vy']))
    .toEqual({ x: 1, y: 2 });
});
test('one key', () => {
  expect(omit(p, ['x']))
    .toEqual({ y: 2, vx: 3, vy: 4 });
});
test('no keys gives a copy', () => {
  const q = omit(p, []);
  expect(q).toEqual(p);
  expect(q === p).toBe(false);
});
test('the original is unchanged', () => {
  omit(p, ['x', 'y']);
  expect(p).toEqual({ x: 1, y: 2, vx: 3, vy: 4 });
});`,
    hints: [
      'The original must not change, so start from a copy. Which syntax makes a shallow copy of an object?',
      'Copy with `{ ...o }`, then remove each listed key from the copy. JavaScript removes a property with the `delete` operator: `delete obj[k]`.',
      'Write `const out: any = { ...o };`, then `for (const k of ks) { delete out[k]; }`, then `return out;`.',
    ],
    walkthrough: `**How to think about it.** At run time, \`omit\` is "copy, then remove". The copy matters because the tests check the original is unchanged (objects are shared by reference, so deleting from \`o\` itself would change the caller's object). The type \`Omit<T, K>\` describes the result precisely: every key of \`T\` except \`K\`. Inside the body the checker does not follow \`delete\` changing a type step by step (an unlabelled \`{ ...o }\` would keep the type \`T\` all the way through, which stops being true after the first \`delete\`), so the object being built is labelled \`any\`, saying plainly that the inside is unchecked; the signature is what callers rely on.

**The solution, line by line.**

- \`function omit<T, K extends keyof T>(\` two blanks: the object's type, and the keys to drop, constrained to real keys of \`T\`, so \`omit(p, ['mass'])\` is rejected by \`tsc\`.
- \`  o: T,\` and \`  ks: K[],\` the object and the list of keys.
- \`): Omit<T, K> {\` the result type: \`T\` without the keys \`K\`. For \`omit(p, ['vx', 'vy'])\` that is \`{ x: number; y: number }\`, and reading \`.vx\` on it is an error.
- \`  const out: any = { ...o };\` a new object with the same properties (the spread copy), so the original is safe.
- \`  for (const k of ks) {\` each key to drop...
- \`    delete out[k];\` ...is removed from the copy. \`delete\` removes a property entirely, so it no longer appears in \`Object.keys\` or in \`toEqual\`.
- \`  }\` and \`  return out;\` hand back the copy.

**Common wrong attempts.**

- Deleting from \`o\` directly: the result looks right, but the caller's object has lost its properties too, and the "unchanged" test fails.
- Setting \`out[k] = undefined\` instead of deleting: the key is still there, holding \`undefined\`, so \`toEqual({ x: 1, y: 2 })\` fails because the copy still has four keys.`,
    wrong: [
      {
        code: `function omit(o, ks) {
  for (const k of ks) {
    delete o[k];
  }
  return o;
}`,
        why: 'This deletes from the caller’s object, so the original changes and `omit(p, [])` is not a copy.',
      },
      {
        code: `function omit(o, ks) {
  const out = { ...o };
  for (const k of ks) {
    out[k] = undefined;
  }
  return out;
}`,
        why: 'The keys are still present, holding `undefined`, so the result has the wrong set of keys.',
      },
    ],
  },
  makeGetters: {
    optional: true,
    lang: 'ts',
    title: 'Getters from keys',
    prompt: 'Write `makeGetters(o)` that **returns** an object with one function per key of `o`: key `x` gives `getX`, key `vx` gives `getVx` (the first letter made upper case). Each function returns the **current** value of that property of `o`, read when it is called. Its type is `Getters<T>` from the chapter.',
    starter: `type Getters<T> = {
  [K in keyof T as K extends string
    ? \`get\${Capitalize<K>}\`
    : never]: () => T[K];
};

function makeGetters<T extends object>(
  o: T,
): Getters<T> {
  // your code here
}

const p = { x: 1, vx: 2 };
const g = makeGetters(p);
console.log(g.getX(), g.getVx());`,
    solution: `type Getters<T> = {
  [K in keyof T as K extends string
    ? \`get\${Capitalize<K>}\`
    : never]: () => T[K];
};

function makeGetters<T extends object>(
  o: T,
): Getters<T> {
  const out: any = {};
  for (const k of Object.keys(o)) {
    const name =
      'get' + k[0].toUpperCase() +
      k.slice(1);
    out[name] = () => (o as any)[k];
  }
  return out;
}`,
    tests: `test('names are capitalised', () => {
  const g = makeGetters({ x: 1, vx: 2 });
  expect(Object.keys(g)).toEqual(['getX', 'getVx']);
});
test('each getter reads its key', () => {
  const g = makeGetters({ x: 1, vx: 2 });
  expect(g.getX()).toBe(1);
  expect(g.getVx()).toBe(2);
});
test('getters read the current value', () => {
  const p = { x: 1 };
  const g = makeGetters(p);
  p.x = 5;
  expect(g.getX()).toBe(5);
});
test('an empty object gives no getters', () => {
  expect(makeGetters({})).toEqual({});
});`,
    hints: [
      'Loop over `Object.keys(o)`. For each key you need two things: the new name, and a function to store under it.',
      'The new name is `\'get\'` plus the key with its first letter upper-cased: `k[0].toUpperCase() + k.slice(1)`.',
      'Store `() => o[k]`, not `o[k]` itself, so the value is read when the getter is called. The arrow function is a closure over `o` and `k`.',
    ],
    walkthrough: `**How to think about it.** The type \`Getters<T>\` already spells out the plan: for each string key, a new name made with \`Capitalize\`, holding a function that returns \`T[K]\`. At run time you do the same thing with ordinary string methods, since types are erased: \`Capitalize<K>\` has a run-time twin in \`k[0].toUpperCase() + k.slice(1)\`. Each getter must read the property when *called*, so it has to be a function that closes over \`o\` and \`k\` (a closure), not a copy of the value.

**The solution, line by line.**

- The \`type Getters<T>\` lines are the mapped type with key remapping from the chapter.
- \`function makeGetters<T extends object>(o: T): Getters<T> {\` takes any object and promises a \`Getters<T>\`.
- \`  const out: any = {};\` the object being built; the checker cannot follow string-built names into \`Getters<T>\`, so the inside is unchecked.
- \`  for (const k of Object.keys(o)) {\` each key, in order.
- \`    const name = 'get' + k[0].toUpperCase() + k.slice(1);\` the first character upper-cased, then the rest of the key unchanged: \`'vx'\` gives \`'getVx'\`.
- \`    out[name] = () => (o as any)[k];\` stores a function that reads \`o[k]\` each time it runs. Because \`const k\` is fresh on every turn of the loop, each closure remembers its own key.
- \`  }\` and \`  return out;\` finish.

**Common wrong attempts.**

- \`out[name] = o[k];\` stores the value, not a function, so \`g.getX()\` throws "g.getX is not a function".
- \`'get' + k.toUpperCase()\` upper-cases the whole key, giving \`getVX\` instead of \`getVx\`; that matches \`Uppercase\`, not \`Capitalize\`.`,
    wrong: [
      {
        code: `function makeGetters(o) {
  const out = {};
  for (const k of Object.keys(o)) {
    const name =
      'get' + k[0].toUpperCase() +
      k.slice(1);
    out[name] = o[k];
  }
  return out;
}`,
        why: 'The values are stored instead of functions, so calling `g.getX()` throws a TypeError.',
      },
      {
        code: `function makeGetters(o) {
  const out = {};
  for (const k of Object.keys(o)) {
    const name =
      'get' + k.toUpperCase();
    out[name] = () => o[k];
  }
  return out;
}`,
        why: 'The whole key is upper-cased, so `vx` gives `getVX` rather than `getVx`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What is `IsStr<string | number>`, with `type IsStr<T> = T extends string ? \'yes\' : \'no\'`?',
    options: [
      {
        t: '`\'no\'`',
        why: 'That would be the answer without distribution, with the union tested as a whole (as `[T] extends [string]` does).',
      },
      {
        t: '`\'yes\' | \'no\'`',
        correct: true,
        why: 'It distributes: `string` gives `\'yes\'`, `number` gives `\'no\'`, joined into a union.',
      },
      {
        t: '`\'yes\'`',
        why: '`number` is a member of the union too, and it does not fit `string`.',
      },
    ],
  },
  {
    q: 'What is `Exclude<\'a\' | \'b\' | \'c\', \'a\' | \'c\'>`?',
    options: [
      {
        t: '`\'a\' | \'c\'`',
        why: 'That is `Extract`, which keeps the members that fit.',
      },
      {
        t: '`never`',
        why: '`\'b\'` does not fit `\'a\' | \'c\'`, so it survives.',
      },
      {
        t: '`\'b\'`',
        correct: true,
        why: '`\'a\'` and `\'c\'` fit and become `never`; only `\'b\'` is left.',
      },
    ],
  },
  {
    q: 'How many members does `` `${\'x\' | \'y\'}${\'1\' | \'2\' | \'3\'}` `` have?',
    options: [
      {
        t: '6',
        correct: true,
        why: 'Every combination: 2 × 3, from `\'x1\'` to `\'y3\'`.',
      },
      {
        t: '5',
        why: 'Template literal types multiply the choices, they do not add them.',
      },
      {
        t: '2',
        why: 'Each union inside the pattern is expanded, not only the first.',
      },
    ],
  },
  {
    q: 'Which object fits `Pick<Particle, \'x\' | \'y\'>`, for `interface Particle { x: number; y: number; vx: number; vy: number }`?',
    options: [
      {
        t: '`{ x: 1 }`',
        why: '`Pick` keeps the properties as they were, required, so `y` is missing.',
      },
      {
        t: '`{ x: 1, y: 2 }`',
        correct: true,
        why: 'Exactly the two picked keys, each a number.',
      },
      {
        t: '`{ x: 1, y: 2, vx: 3 }` (written directly as the value)',
        why: 'An object literal with an extra property is rejected: “\'vx\' does not exist in type \'Pick<Particle, "x" | "y">\'”.',
      },
    ],
  },
  {
    q: '`makeGetters<T extends object>(o: T): Getters<T>`, where `Getters<T>` is a mapped type, starts with `const out = {}`, adds one property per key in a loop, then returns `out`. Why does `tsc` reject the `return`?',
    options: [
      {
        t: 'Because a function may not return a mapped type',
        why: 'Mapped types are ordinary types and can be returned like any other.',
      },
      {
        t: 'Because adding properties to an object is not allowed in TypeScript',
        why: 'Adding properties is ordinary JavaScript; the issue is following a type through the loop.',
      },
      {
        t: 'The checker types `out` as `{}` and does not follow the properties the loop adds, so `{}` is not assignable to `Getters<T>`',
        correct: true,
        why: 'The usual answer is to label the object being built `any` (or to assert its type), leaving the inside unchecked while the signature stays exact.',
      },
    ],
  },
];
