// Chapter 292 cards. Keys are stable ids: never rename them.

export const prompts = {
  'rf-what': {
    q: 'What is **reflection**?',
    a: 'A program inspecting (and sometimes changing) its own structure while it runs: the types of values, their fields and methods.',
  },
  'rf-two': {
    q: 'What are the two halves of reflection called, and what does each do?',
    a: 'Introspection reads the program\'s structure (which fields does this object have?); intercession changes or intercepts it (set a field by name, catch every property read).',
  },
  'rf-js': {
    q: 'Name three JavaScript ways to look at a value\'s structure at run time.',
    a: 'For example `typeof v`, `Object.keys(v)` (or `Reflect.ownKeys`), and `Object.getPrototypeOf(v).constructor.name`.',
  },
  'rtti-what': {
    q: 'What is **runtime type information** (RTTI)?',
    a: 'Data the compiler keeps in the running program describing types (names, bases, fields), so the program can ask about types after compilation.',
  },
  'rtti-erasure': {
    q: 'Why does a statically typed language need extra work to support reflection?',
    a: 'Its compiler uses types to check the program and then, by default, throws them away; reflection needs some of that information kept in the binary.',
  },
  'rtti-cpp': {
    q: 'In clang\'s output, what does `_ZTI6Circle` hold for `struct Circle : Shape`?',
    a: 'Circle\'s typeinfo: a pointer for its kind (single-base class), a pointer to its name string `"6Circle"`, and a pointer to Shape\'s typeinfo.',
  },
  'rtti-norrti': {
    q: 'What does clang say if you use `dynamic_cast` with `-fno-rtti`?',
    a: '`error: use of dynamic_cast requires -frtti`: without the typeinfo records, the run-time check has nothing to read.',
  },
  'rtti-java': {
    q: 'Where does Java\'s `getDeclaredFields()` get field names from?',
    a: 'From the class file, which keeps every field\'s name and type as metadata (`javap -p` lists them).',
  },
  'rtti-rust': {
    q: 'What runtime type information does Rust offer by default?',
    a: 'Very little: `TypeId`, `type_name`, and `Any::downcast_ref` to test for one concrete type. No list of fields or methods.',
  },
  'rtti-v8': {
    q: 'Why does a JavaScript engine get runtime type information "for free"?',
    a: 'Every object already points to a hidden class (V8\'s map) describing its properties, because a dynamic language needs it to run at all.',
  },
};

export const examples = {
  describe: {
    title: 'A reflective printer',
    code: `// A printer for any value, written by
// asking each value what it is.
function describe(v) {
  const t = typeof v;
  if (t !== 'object' || v === null)
    return \`\${t} \${String(v)}\`;
  if (Array.isArray(v)) {
    const xs = v.map(describe);
    return \`[\${xs.join(', ')}]\`;
  }
  const cls = Object.getPrototypeOf(v)
    .constructor.name;
  const parts = Object.keys(v).map(
    (k) => \`\${k}: \${describe(v[k])}\`);
  const body = parts.join(', ');
  return \`\${cls} { \${body} }\`;
}

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}
console.log(describe(new Point(3, 4)));
console.log(describe({ tags: ['a'] }));
console.log(describe([1, 'two', null]));`,
  },
};

export const exercises = {
  rtti: {
    title: 'Type descriptors, by hand',
    prompt:
      'A compiler emits one **type descriptor** per class: `{ name, base, fields }`, where `base` is the parent\'s descriptor (or `null`) and `fields` lists the fields that class declares. Every object has a `type` property pointing at its class\'s descriptor. Write `isA(obj, T)`, which returns `true` if `obj`\'s class is `T` or inherits from it (like `dynamic_cast`), and `fieldsOf(obj)`, which returns a string such as `Ring { x: 0, r: 1, w: 2 }`: the class name, then every field from the oldest ancestor down to the class itself, with the object\'s values.',
    starter: `function isA(obj, T) {
  return obj.type === T;
}
function fieldsOf(obj) {
  return obj.type.name;
}`,
    solution: `function isA(obj, T) {
  let t = obj.type;
  while (t) {
    if (t === T) return true;
    t = t.base;
  }
  return false;
}
function fieldsOf(obj) {
  const chain = [];
  for (let t = obj.type; t; t = t.base)
    chain.unshift(t);
  const out = [];
  for (const t of chain)
    for (const f of t.fields)
      out.push(\`\${f}: \${obj[f]}\`);
  const body = out.join(', ');
  return \`\${obj.type.name} { \${body} }\`;
}`,
    tests: `const Shape = { name: 'Shape',
  base: null, fields: ['x'] };
const Circle = { name: 'Circle',
  base: Shape, fields: ['r'] };
const Ring = { name: 'Ring',
  base: Circle, fields: ['w'] };
const ring = { type: Ring, x: 0, r: 1, w: 2 };
const circ = { type: Circle, x: 5, r: 3 };
test('a class is itself', () => {
  expect(isA(ring, Ring)).toBe(true);
});
test('and every ancestor', () => {
  expect(isA(ring, Circle)).toBe(true);
  expect(isA(ring, Shape)).toBe(true);
});
test('but not a subclass', () => {
  expect(isA(circ, Ring)).toBe(false);
});
test('fields in ancestor order', () => {
  expect(fieldsOf(ring))
    .toBe('Ring { x: 0, r: 1, w: 2 }');
  expect(fieldsOf(circ))
    .toBe('Circle { x: 5, r: 3 }');
});`,
    hints: [
      'Both functions walk the same chain: start at `obj.type` and follow `.base` until it is `null`.',
      'For `isA`, compare each descriptor on the way up with `T` and return `true` on a match; if the walk ends, return `false`. For `fieldsOf`, the walk visits the class first and the oldest ancestor last, which is the wrong order for printing.',
      'Collect the descriptors with `chain.unshift(t)` (add to the front) so the oldest comes first; then loop over each one\'s `fields`, pushing `` `${f}: ${obj[f]}` ``, and join with `\', \'`.',
    ],
    walkthrough: `**How to think about it.** This is exactly the data clang emits for C++ (typeinfo records with a name and a base pointer), and the data a Java class file keeps (field names per class). Both questions are answered by walking the base pointers: \`isA\` is "is \`T\` on my chain?", and \`fieldsOf\` is "list every field on my chain, oldest first", because a subclass's object starts with its parent's fields (chapter 274's layout).

**The solution, line by line.**

- \`function isA(obj, T) {\` and \`let t = obj.type;\` start at the object's real class, which only the object knows.
- \`while (t) {\` walks until the chain ends at \`null\`.
- \`if (t === T) return true;\` compares descriptors by identity: there is one descriptor per class, so the same object means the same class (C++ compares typeinfo the same way, by address or by name).
- \`t = t.base;\` steps up to the parent.
- \`return false;\` after the loop: \`T\` was not an ancestor, so the cast fails (C++ would give \`nullptr\`).
- \`function fieldsOf(obj) {\` and \`const chain = [];\` prepare to collect the classes.
- \`for (let t = obj.type; t; t = t.base) chain.unshift(t);\` walks up and puts each descriptor at the front, so \`chain\` ends up oldest first: \`[Shape, Circle, Ring]\`.
- The nested \`for\` loops visit each class's own \`fields\` in order, and \`out.push(...)\` builds "name: value" from \`f\` and \`obj[f]\`, reading each field *by name*, which is reflection: the code never mentions \`x\`, \`r\` or \`w\`.
- \`const body = out.join(', ');\` and the \`return\` build \`Ring { x: 0, r: 1, w: 2 }\`.

**Common wrong attempts.**

- \`return obj.type === T;\` (the starter): a Ring is then not a Circle, which breaks every downcast to a parent class.
- Walking with \`push\` instead of \`unshift\`: the fields come out as \`w, r, x\`, child first.
- Reading \`Object.keys(obj)\` instead of the descriptors: the hidden \`type\` field appears in the output, and the order is the order the fields were set, not the class order.`,
    wrong: [
      {
        code: `function isA(obj, T) {
  return obj.type === T;
}
function fieldsOf(obj) {
  const out = [];
  for (let t = obj.type; t; t = t.base)
    for (const f of t.fields)
      out.push(f + ': ' + obj[f]);
  const body = out.join(', ');
  return obj.type.name +
    ' { ' + body + ' }';
}`,
        why: '`isA` ignores ancestors, and `fieldsOf` lists the child\'s fields first: `Ring { w: 2, r: 1, x: 0 }`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which of these is **introspection** rather than intercession?',
    options: [
      { t: '`Object.keys(p)` listing `p`\'s properties', correct: true, why: 'It only reads the structure.' },
      { t: 'A Proxy that logs every property read', why: 'That intercepts an operation: intercession.' },
      { t: '`Field.setInt(p, 10)` in Java', why: 'That changes a field chosen by name at run time: intercession.' },
    ],
  },
  {
    q: 'clang emits `_ZTI6Circle` with a pointer to `_ZTI5Shape`. What uses that pointer?',
    options: [
      { t: 'The virtual call `s->area()`', why: 'Virtual calls only need the vtable\'s method slots.' },
      { t: '`dynamic_cast`, walking from the object\'s real type up through its bases', correct: true, why: 'The Itanium ABI\'s `__si_class_type_info` adds exactly that base pointer for single inheritance.' },
      { t: 'The linker, to order the classes', why: 'The linker only merges identical records; the base pointer is for run-time checks.' },
    ],
  },
  {
    q: 'Go\'s `reflect.TypeOf(p).Field(0)` returns `X int x`, including the struct tag `json:"x"`. What does that tell you?',
    options: [
      { t: 'Go recompiles the struct at run time', why: 'No compiler runs; the descriptor was written into the binary.' },
      { t: 'Go\'s compiler keeps field names, types and tags in the binary as runtime type information', correct: true, why: 'Package reflect reads those descriptors, which is how encoding/json finds the tag.' },
      { t: 'Struct tags are comments and are thrown away', why: 'They are kept precisely so that reflection can read them.' },
    ],
  },
  {
    q: 'In Rust, `v.downcast_ref::<i32>()` on a `&dyn Any` can answer which question?',
    options: [
      { t: '"Which fields does this value have?"', why: 'Rust keeps no list of fields at run time.' },
      { t: '"Does this value implement `Display`?"', why: 'The `any` docs say `&dyn Any` cannot test whether a type implements a trait.' },
      { t: '"Is this value exactly an `i32`?"', correct: true, why: 'It compares `TypeId`s for one concrete type, and gives a reference if they match.' },
    ],
  },
  {
    q: 'Why is reflection cheap to offer in JavaScript but a cost in C++?',
    options: [
      { t: 'Every JavaScript object already carries a hidden class describing its properties; C++ must emit extra records that a program may never use', correct: true, why: 'Hence `-fno-rtti`, which drops them to save space.' },
      { t: 'JavaScript is interpreted, so it has no types', why: 'It has types at run time; it is precisely those that make reflection possible.' },
      { t: 'C++ forbids reflection', why: 'C++ has `typeid` and `dynamic_cast`, built on RTTI.' },
    ],
  },
];
