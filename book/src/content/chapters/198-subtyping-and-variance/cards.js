// Chapter 198 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'subtype-what': {
    q: 'What does `S <: T` mean?',
    a: 'S is a subtype of T: a value of type S can be used safely anywhere a value of type T is expected.',
  },
  subsumption: {
    q: 'What does the subsumption rule say?',
    a: 'If e has type S and S <: T, then e also has type T.',
  },
  width: {
    q: 'In structural subtyping, what does width subtyping allow for records?',
    a: 'Extra fields: a record with more fields is a subtype of one with fewer (the same ones).',
  },
  depth: {
    q: 'What does depth subtyping allow for records whose fields are read-only?',
    a: 'A field whose type is a subtype: if S <: T then { f: S } <: { f: T }.',
  },
  direction: {
    q: 'In structural record subtyping, why is `{ x, y }` not a subtype of `{ x, y, colour }`?',
    a: 'Code expecting the second may read colour, which the first does not have.',
  },
  'structural-what': {
    q: 'In structural subtyping, what decides whether S <: T?',
    a: 'The types’ structure: S must have every member T has, with compatible types.',
  },
  'nominal-what': {
    q: 'In nominal subtyping, what decides whether S <: T?',
    a: 'Declared names: S must be T, or be declared (with extends or implements) to be a subtype of it.',
  },
  'ts-structural': {
    q: 'Is TypeScript’s subtyping structural or nominal? And Java’s?',
    a: 'TypeScript: structural. Java: nominal.',
  },
  'excess-check': {
    q: 'Why does TypeScript reject `norm({ x: 1, y: 2, colour: \'red\' })` but accept the same object passed through a variable?',
    a: 'An object literal written straight into a typed place gets an excess property check (error TS2353), since an extra field there is likely a typo.',
  },
};

export const examples = {
  structural: {
    title: 'A Pixel where a Point is expected',
    lang: 'ts',
    code: `interface Point { x: number; y: number }
class Pixel {
  x = 1;
  y = 2;
  colour = 'red';
}
function norm(p: Point): number {
  return p.x + p.y;
}
console.log(norm(new Pixel()));
const px = { x: 3, y: 4, colour: 'b' };
console.log(norm(px));`,
  },
};

export const exercises = {
  subtype: {
    title: 'A subtype checker for records',
    prompt: 'Types are data: a primitive `prim(name)` (`NUM`, `STR` and `BOOL` are given), or a record `rec({ x: NUM, ... })`. Write `isSubtype(s, t)`, which returns `true` when `s <: t` and `false` otherwise. Primitives are subtypes only of themselves; a primitive and a record are never related; and for records use width and depth: every field of `t` must be in `s`, with a type that is a subtype of `t`’s.',
    starter: `// types: { k: 'prim', name }
// or { k: 'rec', fields: { f: type } }
const prim = (name) =>
  ({ k: 'prim', name });
const rec = (fields) =>
  ({ k: 'rec', fields });
const NUM = prim('number');
const STR = prim('string');
const BOOL = prim('bool');

function isSubtype(s, t) {
  return s === t;
}`,
    solution: `// types: { k: 'prim', name }
// or { k: 'rec', fields: { f: type } }
const prim = (name) =>
  ({ k: 'prim', name });
const rec = (fields) =>
  ({ k: 'rec', fields });
const NUM = prim('number');
const STR = prim('string');
const BOOL = prim('bool');

function isSubtype(s, t) {
  if (s.k !== 'rec' || t.k !== 'rec') {
    return s.k === t.k &&
      s.name === t.name;
  }
  for (const f in t.fields) {
    if (!(f in s.fields)) return false;
    const ok = isSubtype(s.fields[f],
      t.fields[f]);
    if (!ok) return false;
  }
  return true;
}`,
    tests: `const P = rec({ x: NUM, y: NUM });
const PC = rec({ x: NUM, y: NUM, colour: STR });
test('primitives are subtypes only of themselves', () => {
  expect(isSubtype(NUM, NUM)).toBe(true);
  expect(isSubtype(NUM, prim('number'))).toBe(true);
  expect(isSubtype(NUM, STR)).toBe(false);
});
test('width: extra fields are allowed', () => {
  expect(isSubtype(PC, P)).toBe(true);
  expect(isSubtype(P, rec({}))).toBe(true);
});
test('width has a direction', () => {
  expect(isSubtype(P, PC)).toBe(false);
});
test('a field of the wrong type fails', () => {
  expect(isSubtype(rec({ x: STR, y: NUM }), P)).toBe(false);
});
test('depth: nested records', () => {
  const a = rec({ pos: rec({ x: NUM, y: NUM, z: NUM }) });
  const b = rec({ pos: P });
  expect(isSubtype(a, b)).toBe(true);
  expect(isSubtype(b, a)).toBe(false);
});
test('records and primitives are not related', () => {
  expect(isSubtype(P, NUM)).toBe(false);
  expect(isSubtype(NUM, rec({}))).toBe(false);
});
test('field order does not matter', () => {
  expect(isSubtype(rec({ y: NUM, x: NUM }), P)).toBe(true);
});`,
    hints: [
      'Two cases: either side is a primitive, or both are records. For the first, the answer is “same kind and same name”.',
      'For two records, think about who reads what: code expecting `t` reads only `t`’s fields. So loop over the fields of `t`, not of `s`.',
      'For each field `f` of `t`: if `!(f in s.fields)` return `false`; otherwise call `isSubtype(s.fields[f], t.fields[f])` (that recursive call is depth) and return `false` if it fails. After the loop, return `true`; extra fields of `s` are never visited (that is width).',
    ],
    walkthrough: `**How to think about it.** The question “can an S stand in for a T?” is answered from the point of view of the code that expects a T: what can it do with the value? With a primitive, it can only use it as that primitive, so nothing but the same primitive will do. With a record, it reads the fields T lists, and nothing else, so S must have each of those, and each must be usable as T’s field: which is the same question again, one level down. That is why the function is recursive, and why the loop runs over T’s fields.

**The solution, line by line.**

- \`if (s.k !== 'rec' || t.k !== 'rec') {\` handles every case where at least one side is not a record, that is, is a primitive.
- \`return s.k === t.k && s.name === t.name;\` Both must be primitives with the same name. A record against a primitive gives \`false\` here, because the kinds differ.
- \`for (const f in t.fields) {\` From here on both are records. \`for ... in\` visits the field names of T, the expected type.
- \`if (!(f in s.fields)) return false;\` A field T asks for is missing from S: code expecting a T could read it and find nothing.
- \`const ok = isSubtype(s.fields[f], t.fields[f]);\` The field is there; is its type usable as T’s field type? This is the depth rule.
- \`if (!ok) return false;\` One bad field is enough to fail.
- \`return true;\` Every field T asks for is present and compatible. Fields of S that T does not mention were never looked at: the width rule, for free.

**Common wrong attempts.**

- Looping over S’s fields instead of T’s: \`{ x, y, colour } <: { x, y }\` then fails at \`colour\`, which is backwards: the extra field is exactly what width allows, and the missing field (the real danger) is never noticed.
- Comparing field types with \`===\` instead of a recursive call: this happens to work for primitives created once, but nested records are new objects, so depth fails.
- Requiring the same number of fields: that is type equality, the strict rule we started with.`,
    wrong: [
      {
        code: `// types: { k: 'prim', name }
// or { k: 'rec', fields: { f: type } }
const prim = (name) =>
  ({ k: 'prim', name });
const rec = (fields) =>
  ({ k: 'rec', fields });
const NUM = prim('number');
const STR = prim('string');
const BOOL = prim('bool');

function isSubtype(s, t) {
  if (s.k !== 'rec' || t.k !== 'rec') {
    return s.k === t.k &&
      s.name === t.name;
  }
  for (const f in s.fields) {
    if (!(f in t.fields)) return false;
    const ok = isSubtype(s.fields[f],
      t.fields[f]);
    if (!ok) return false;
  }
  return true;
}`,
        why: 'This loops over S’s fields, so it rejects extra fields (width) and accepts a record with missing ones: the direction is backwards.',
      },
      {
        code: `// types: { k: 'prim', name }
// or { k: 'rec', fields: { f: type } }
const prim = (name) =>
  ({ k: 'prim', name });
const rec = (fields) =>
  ({ k: 'rec', fields });
const NUM = prim('number');
const STR = prim('string');
const BOOL = prim('bool');

function isSubtype(s, t) {
  if (s.k !== 'rec' || t.k !== 'rec') {
    return s.k === t.k &&
      s.name === t.name;
  }
  for (const f in t.fields) {
    if (!(f in s.fields)) return false;
    if (s.fields[f] !== t.fields[f]) {
      return false;
    }
  }
  return true;
}`,
        why: 'Field types are compared by identity, not by subtyping, so nested records (depth) never match.',
      },
      {
        code: `// types: { k: 'prim', name }
// or { k: 'rec', fields: { f: type } }
const prim = (name) =>
  ({ k: 'prim', name });
const rec = (fields) =>
  ({ k: 'rec', fields });
const NUM = prim('number');
const STR = prim('string');
const BOOL = prim('bool');

function isSubtype(s, t) {
  if (s.k !== 'rec' || t.k !== 'rec') {
    return s.k === t.k &&
      s.name === t.name;
  }
  const a = Object.keys(s.fields);
  const b = Object.keys(t.fields);
  if (a.length !== b.length) {
    return false;
  }
  for (const f of b) {
    if (!(f in s.fields)) return false;
    const ok = isSubtype(s.fields[f],
      t.fields[f]);
    if (!ok) return false;
  }
  return true;
}`,
        why: 'Requiring the same number of fields forbids width subtyping, so a Pixel is no longer a Point.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In structural record subtyping, which of these is true?',
    options: [
      {
        t: '`{ x: number }` <: `{ x: number, y: number }`',
        why: 'Code expecting the right-hand type may read y, which is missing.',
      },
      {
        t: '`{ x: number, y: number }` <: `{ x: number }`',
        correct: true,
        why: 'Width subtyping: the extra field y does no harm to code that only reads x.',
      },
      {
        t: 'Neither: record types must match exactly',
        why: 'That is type equality; subtyping exists to relax it.',
      },
    ],
  },
  {
    q: 'With structural subtyping and read-only fields, is `{ a: { x: number, y: number } }` a subtype of `{ a: { x: number } }`?',
    options: [
      {
        t: 'No: the field a has a different type',
        why: 'The types differ, but by subtyping, which depth allows.',
      },
      {
        t: 'Only in a nominal language',
        why: 'Nominal languages relate declared names, not record shapes.',
      },
      {
        t: 'Yes, by depth: the type of a is itself a subtype by width',
        correct: true,
        why: 'Depth lets a field’s type be a subtype of the expected field’s type.',
      },
    ],
  },
  {
    q: 'In Java, two classes `Point` and `Pixel` have exactly the same fields, and neither extends the other. What does `Point p = new Pixel();` do?',
    options: [
      {
        t: 'Compiles: the fields match',
        why: 'That is structural subtyping, which Java does not use for classes.',
      },
      {
        t: 'Fails to compile: Pixel cannot be converted to Point',
        correct: true,
        why: 'Java is nominal: Pixel is not declared to be a Point.',
      },
      {
        t: 'Compiles, and fails at run time',
        why: 'javac reports “incompatible types” before the program runs.',
      },
    ],
  },
  {
    q: 'What does the subsumption rule let a type checker do?',
    options: [
      {
        t: 'Use an expression of type S where a T is expected, whenever S <: T',
        correct: true,
        why: 'If e : S and S <: T, then e : T.',
      },
      {
        t: 'Guess the type of an expression with no annotation',
        why: 'That is type inference, a different job.',
      },
      {
        t: 'Convert a value from one type to another at run time',
        why: 'Subsumption changes nothing at run time; the same value is viewed at a more general type.',
      },
    ],
  },
  {
    q: 'Why does TypeScript report TS2353 for `norm({ x: 1, y: 2, colour: \'red\' })`, when `Point` is `{ x: number; y: number }`?',
    options: [
      {
        t: 'Because TypeScript’s subtyping is nominal',
        why: 'It is structural; the same object through a variable is accepted.',
      },
      {
        t: 'Because width subtyping is unsafe',
        why: 'Width is safe; this check is about likely mistakes, not safety.',
      },
      {
        t: 'Because an object literal written directly where a type is expected gets an excess property check',
        correct: true,
        why: 'An unexpected field in a fresh literal is probably a typo, so tsc reports it.',
      },
    ],
  },
];
