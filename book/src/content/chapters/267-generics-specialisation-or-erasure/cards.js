// Generics: specialisation or erasure: cards.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'spec-what': {
    q: 'What does generic specialisation (monomorphisation) do?',
    a: 'Compiles a separate copy of a generic function for each type it is used with, with the type filled in.',
  },
  'spec-cost': {
    q: 'What does specialisation cost, according to the Rust compiler’s own guide?',
    a: 'Compile time and binary size: every copy has to be compiled and stored.',
  },
  'spec-inline': {
    q: 'Why can rustc inline a trait method called inside the monomorphised copy `gen::<Sq>`, but not the same call made through `&dyn Area`?',
    a: 'In the copy for `Sq` the type is known, so the call has one target; through a vtable the target is only known at run time.',
  },
  'erase-what': {
    q: 'What does generic erasure do?',
    a: 'Compiles one copy for all types, by making every value one uniform word and discarding the type arguments after checking.',
  },
  'erase-cast': {
    q: 'Why does javac insert `checkcast String` after `List.get` when `T` is `String`?',
    a: 'The erased `get` returns `Object`; the cast checks at run time that it is a `String` before it is used as one.',
  },
  'box-what': {
    q: 'What is boxing?',
    a: 'Putting a raw value, such as an int, in a heap object, and passing a pointer to it so it fits a uniform slot.',
  },
  'box-cost': {
    q: 'Name two costs of boxing.',
    a: 'An allocation per box, and an extra load (pointer chasing) on every use; also the object header’s memory.',
  },
  gcshape: {
    q: 'In Go 1.24’s implementation of generics, which type arguments share one compiled copy?',
    a: 'Types with the same gcshape: the same underlying type, or any pointer types; a dictionary tells the copy the real type.',
  },
};

export const examples = {
  'boxed-vs-flat': {
    title: 'Boxes versus a row of doubles',
    code: `// erased: every element is a box
const boxed = [];
for (let i = 0; i < 4; i++) {
  boxed.push({ v: i * 0.5 });
}
// specialised: raw doubles in a row
const flat = new Float64Array(4);
for (let i = 0; i < 4; i++) {
  flat[i] = i * 0.5;
}
let a = 0;
let b = 0;
for (const x of boxed) a += x.v;
for (const x of flat) b += x;
console.log(a, b);`,
  },
};

export const exercises = {
  'shape-cache': {
    title: 'One copy per shape',
    prompt: `Build Go’s middle road. Types are strings such as \`'int'\`, \`'float64'\`, \`'*A'\` (a pointer type starts with \`*\`). \`gen(shape)\` compiles the generic function for one shape and returns its code (any value). Write:

- \`shapeOf(t)\`: \`'ptr'\` for any pointer type, otherwise \`t\` itself.
- \`instantiate(cache, gen, t)\`: returns \`{ code, dict }\`, where \`code\` is the compiled copy for \`t\`’s shape and \`dict\` is \`{ type: t }\`. Call \`gen\` only when \`cache\` (a plain object keyed by shape) has no copy for that shape yet, and store the new copy in \`cache\`.`,
    starter: `function shapeOf(t) {
  return t;
}
function instantiate(cache, gen, t) {
  return { code: gen(t), dict: {} };
}`,
    solution: `function shapeOf(t) {
  return t.startsWith('*') ? 'ptr' : t;
}
function instantiate(cache, gen, t) {
  const s = shapeOf(t);
  if (!(s in cache)) cache[s] = gen(s);
  return { code: cache[s],
    dict: { type: t } };
}`,
    tests: `function counter() {
  const made = [];
  const gen = (s) => {
    made.push(s);
    return { body: 'First[' + s + ']' };
  };
  return { gen, made };
}
test('shapes', () => {
  expect(shapeOf('int')).toBe('int');
  expect(shapeOf('*A')).toBe('ptr');
  expect(shapeOf('*B')).toBe('ptr');
});
test('the same type twice: one copy', () => {
  const { gen, made } = counter();
  const c = {};
  const x = instantiate(c, gen, 'int');
  const y = instantiate(c, gen, 'int');
  expect(made).toEqual(['int']);
  expect(x.code === y.code).toBe(true);
});
test('two pointer types share a copy', () => {
  const { gen, made } = counter();
  const c = {};
  const a = instantiate(c, gen, '*A');
  const b = instantiate(c, gen, '*B');
  expect(made).toEqual(['ptr']);
  expect(a.code === b.code).toBe(true);
  expect(a.dict).toEqual({ type: '*A' });
  expect(b.dict).toEqual({ type: '*B' });
});
test('int and float64 get their own', () => {
  const { gen, made } = counter();
  const c = {};
  for (const t of ['int', 'float64',
    '*A', '*B', 'int']) {
    instantiate(c, gen, t);
  }
  expect(made)
    .toEqual(['int', 'float64', 'ptr']);
});`,
    hints: [
      'Two separate jobs: deciding which shape a type has, and remembering copies already made. Which one decides the cache key?',
      'The key is the shape, not the type: `\'*A\'` and `\'*B\'` must find the same entry. The dictionary, on the other hand, must name the real type.',
      '`const s = shapeOf(t); if (!(s in cache)) cache[s] = gen(s); return { code: cache[s], dict: { type: t } };`',
    ],
    walkthrough: `**How to think about it.** The chapter showed three strategies by how many copies they make. Pure specialisation keys its copies by the full type, so \`*A\` and \`*B\` get two; erasure has one key for everything. Go keys by **shape**, and that is the only difference between the three: the cache and the "compile on first use" logic are the same. So first decide the key (\`shapeOf\`), then write a small memo table around \`gen\`. The copy loses track of the real type, which is why each call also gets a dictionary saying what \`T\` really is.

**The solution, line by line.**

- \`function shapeOf(t) {\` takes a type name.
- \`return t.startsWith('*') ? 'ptr' : t;\` puts every pointer type in one shape, \`'ptr'\` (Go's real name for it was \`go.shape.*uint8\`), and leaves every other type as its own shape, so \`int\` and \`float64\` stay apart (they need different registers and instructions).
- \`function instantiate(cache, gen, t) {\` takes the table of copies made so far, the compiler for one shape, and the type of this call.
- \`const s = shapeOf(t);\` works out the key.
- \`if (!(s in cache)) cache[s] = gen(s);\` compiles a copy only the first time a shape is seen, and remembers it. (\`in\` asks whether the key exists at all.)
- \`return { code: cache[s], dict: { type: t } };\` (split over two lines) hands back the shared copy and a dictionary naming the real type, so \`*A\` and \`*B\` get the same \`code\` but different \`dict\`s.

Run through the last test: \`int\` makes a copy, \`float64\` makes one, \`*A\` makes the \`ptr\` copy, \`*B\` finds it, and the second \`int\` finds its copy; three calls to \`gen\`, in that order.

**Common wrong attempts.**

- Keying the cache by \`t\` instead of the shape is pure specialisation: \`*A\` and \`*B\` each get a copy.
- Keying everything by one name, such as \`'any'\`, is erasure: \`int\` and \`float64\` would share a copy, which on real hardware would put a float in an integer register.`,
    wrong: [
      {
        code: `function shapeOf(t) {
  return t.startsWith('*') ? 'ptr' : t;
}
function instantiate(cache, gen, t) {
  if (!(t in cache)) cache[t] = gen(t);
  return { code: cache[t],
    dict: { type: t } };
}`,
        why: 'Keyed by the type, not the shape: `*A` and `*B` each get their own copy.',
      },
      {
        code: `function shapeOf(t) {
  return 'any';
}
function instantiate(cache, gen, t) {
  const s = shapeOf(t);
  if (!(s in cache)) cache[s] = gen(s);
  return { code: cache[s],
    dict: { type: t } };
}`,
        why: 'Every type gets the same shape, so `int` and `float64` share a copy, which is erasure, not Go’s shapes.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why can a compiler that emits machine code not use one body for `first<T>` without help?',
    options: [
      {
        t: 'Because generic functions cannot be compiled at all',
        why: 'They can: by copying them per type, or by making values uniform.',
      },
      {
        t: 'Because loading and returning a value depends on its size and kind (integer, float, struct)',
        correct: true,
        why: 'A 4-byte int, an 8-byte float and a 24-byte struct need different instructions and registers.',
      },
      {
        t: 'Because the types are erased before compiling',
        why: 'That is TypeScript’s choice, which works only because every JavaScript value fits one slot.',
      },
    ],
  },
  {
    q: 'A Rust program calls a generic `gen<T>` with 3 different types. How many copies does rustc make?',
    options: [
      {
        t: '1',
        why: 'That would be erasure; Rust specialises.',
      },
      {
        t: '2: one for pointers, one for the rest',
        why: 'That resembles Go’s shapes; rustc copies per type.',
      },
      {
        t: 'It depends on how many times it is called',
        why: 'The number of calls does not matter; the number of distinct types does.',
      },
      {
        t: '3',
        correct: true,
        why: 'Monomorphisation makes one copy per set of type arguments used.',
      },
    ],
  },
  {
    q: 'What does `javap -c` show for `xs.get(0)` when `xs` is a `List<String>`?',
    options: [
      {
        t: '`invokeinterface List.get` returning `Object`, then `checkcast String`',
        correct: true,
        why: 'The erased `get` returns `Object`; the cast restores the type the source promised.',
      },
      {
        t: 'A call to a special `List<String>.get` that returns a `String`',
        why: 'There is only one `get`, erased to return `Object`.',
      },
      {
        t: 'No call at all: `get` is inlined by javac',
        why: 'javac does not inline; it emits the interface call.',
      },
      {
        t: 'A call to `String.valueOf`',
        why: 'That converts values to strings; here the element already is a `String` and only needs a cast.',
      },
    ],
  },
  {
    q: 'Why does `List<Integer>` cost more than `int[]` for a million numbers?',
    options: [
      {
        t: 'Integers in a list are stored as strings',
        why: 'They are stored as `Integer` objects, not strings.',
      },
      {
        t: 'The list keeps two copies of each number',
        why: 'It keeps one, but inside a separate object.',
      },
      {
        t: 'Each number is a separate heap object with a header, reached through a pointer',
        correct: true,
        why: 'Boxing adds an allocation, header memory and a pointer chase per element; `int[]` holds the raw numbers in a row.',
      },
    ],
  },
  {
    q: 'Go compiles `First[T]` for `int`, `float64`, `*A` and `*B`. How many bodies did Go 1.24 produce?',
    options: [
      {
        t: '1, like Java',
        why: 'Go does not erase everything; `int` and `float64` have different shapes.',
      },
      {
        t: '4, like Rust',
        why: 'Go shares a body between types of the same shape.',
      },
      {
        t: '3: `int`, `float64`, and one shared by both pointer types',
        correct: true,
        why: 'All pointer types have one gcshape; a dictionary tells the shared copy the real type.',
      },
      {
        t: '2: one for numbers and one for pointers',
        why: '`int` and `float64` need different instructions, so they are different shapes.',
      },
    ],
  },
];
