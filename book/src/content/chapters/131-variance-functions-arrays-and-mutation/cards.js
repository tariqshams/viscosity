// Chapter 130b cards (variance). Keys are stable ids.

export const prompts = {
  'variance-what': {
    q: 'What does variance describe?',
    a: 'How subtyping between parts (S <: T) carries over to types built from them: same direction, turned round, or not at all.',
  },
  'results-co': {
    q: 'Why is `() => Dog` a subtype of `() => Animal`?',
    a: 'Whoever expects an Animal back is happy to get a Dog: results are covariant.',
  },
  'params-contra': {
    q: 'Which is the subtype: `(a: Animal) => void` or `(d: Dog) => void`?',
    a: '`(a: Animal) => void`: a function that takes any animal can stand in for one that will only be given dogs. Parameters are contravariant.',
  },
  'arrow-why': {
    q: 'Why can `(d: Dog) => void` not be used as `(a: Animal) => void`?',
    a: 'Its caller may pass any animal, such as a cat, and the function would then use dog-only members on it.',
  },
  'readonly-co': {
    q: 'Why may `readonly Dog[]` be a subtype of `readonly Animal[]`?',
    a: 'A read-only array is only read, and reading a Dog where an Animal is expected is safe.',
  },
  'mutable-inv': {
    q: 'Why must mutable arrays be invariant?',
    a: 'Reading needs covariance and writing (a parameter, like push’s) needs contravariance; only equal element types satisfy both.',
  },
  'ts-arrays': {
    q: 'What does TypeScript do with `const animals: Animal[] = dogs` when `dogs: Dog[]`?',
    a: 'Accepts it (arrays are covariant in TypeScript), so a cat can be pushed in and read back out as a Dog.',
  },
  'ts-methods': {
    q: 'Under `strictFunctionTypes`, which parameters are still checked bivariantly?',
    a: 'Those of methods (and constructors); function-typed properties are checked contravariantly.',
  },
  'java-arrays': {
    q: 'Java’s arrays are covariant too. What stops a wrong store?',
    a: 'Each array remembers its element type, and a wrong store throws ArrayStoreException at run time.',
  },
};

const GIVEN = `const prim = (name) =>
  ({ k: 'prim', name });
const rec = (fields) =>
  ({ k: 'rec', fields });
const fn = (param, result) =>
  ({ k: 'fn', param, result });
const arr = (elem) =>
  ({ k: 'arr', elem }); // mutable
const ro = (elem) =>
  ({ k: 'ro', elem }); // read-only
const NUM = prim('number');
const STR = prim('string');`;

const OLD = `  if (s.k === 'prim') {
    return s.name === t.name;
  }
  if (s.k === 'rec') {
    for (const f in t.fields) {
      if (!(f in s.fields)) {
        return false;
      }
      const ok = isSubtype(s.fields[f],
        t.fields[f]);
      if (!ok) return false;
    }
    return true;
  }`;

export const exercises = {
  variance: {
    title: 'Variance in a subtype checker',
    prompt:
      'The checker from the last chapter is given, for primitives and records. Types now also include function types `fn(param, result)` (one parameter), mutable arrays `arr(elem)` and read-only arrays `ro(elem)`. Extend `isSubtype(s, t)`: function types with a contravariant parameter and a covariant result; read-only arrays covariant; mutable arrays invariant (the elements must be subtypes both ways); and a mutable array may also be used as a read-only one, covariantly (`arr(S) <: ro(T)` when `S <: T`), but never the reverse. Different kinds are otherwise unrelated.',
    starter: `${GIVEN}

function isSubtype(s, t) {
  if (s.k !== t.k) return false;
${OLD}
  return false;
}`,
    solution: `${GIVEN}

function isSubtype(s, t) {
  if (s.k === 'arr' && t.k === 'ro') {
    return isSubtype(s.elem, t.elem);
  }
  if (s.k !== t.k) return false;
${OLD}
  if (s.k === 'fn') {
    return isSubtype(t.param, s.param)
      && isSubtype(s.result, t.result);
  }
  if (s.k === 'ro') {
    return isSubtype(s.elem, t.elem);
  }
  // mutable arrays: both ways
  return isSubtype(s.elem, t.elem) &&
    isSubtype(t.elem, s.elem);
}`,
    tests: `const Animal = rec({ name: STR });
const Dog = rec({ name: STR, bark: fn(rec({}), STR) });
test('the parts: Dog <: Animal', () => {
  expect(isSubtype(Dog, Animal)).toBe(true);
  expect(isSubtype(Animal, Dog)).toBe(false);
});
test('results are covariant', () => {
  expect(isSubtype(fn(NUM, Dog), fn(NUM, Animal))).toBe(true);
  expect(isSubtype(fn(NUM, Animal), fn(NUM, Dog))).toBe(false);
});
test('parameters are contravariant', () => {
  expect(isSubtype(fn(Animal, NUM), fn(Dog, NUM))).toBe(true);
  expect(isSubtype(fn(Dog, NUM), fn(Animal, NUM))).toBe(false);
});
test('both at once', () => {
  expect(isSubtype(fn(Animal, Dog), fn(Dog, Animal))).toBe(true);
  expect(isSubtype(fn(Dog, Dog), fn(Dog, Animal))).toBe(true);
});
test('read-only arrays are covariant', () => {
  expect(isSubtype(ro(Dog), ro(Animal))).toBe(true);
  expect(isSubtype(ro(Animal), ro(Dog))).toBe(false);
});
test('mutable arrays are invariant', () => {
  expect(isSubtype(arr(Dog), arr(Animal))).toBe(false);
  expect(isSubtype(arr(Animal), arr(Dog))).toBe(false);
  expect(isSubtype(arr(NUM), arr(NUM))).toBe(true);
});
test('a mutable array can be read-only, not the reverse', () => {
  expect(isSubtype(arr(Dog), ro(Animal))).toBe(true);
  expect(isSubtype(ro(Dog), arr(Dog))).toBe(false);
});
test('different kinds are unrelated', () => {
  expect(isSubtype(fn(NUM, NUM), NUM)).toBe(false);
  expect(isSubtype(arr(NUM), rec({}))).toBe(false);
});`,
    hints: [
      'Add one case per new kind, after the existing ones. For each, ask what the code expecting `t` will do with the value: call it, read from it, or write to it.',
      'A function: code expecting `t` will pass it a `t.param`, which the stand-in must accept, so `t.param <: s.param` (note the order), and it will use the result as a `t.result`, so `s.result <: t.result`.',
      'A read-only array: `isSubtype(s.elem, t.elem)`. A mutable array: that and `isSubtype(t.elem, s.elem)`. The one cross-kind case, a mutable array used as a read-only one, must come before the `s.k !== t.k` test: `if (s.k === \'arr\' && t.k === \'ro\') return isSubtype(s.elem, t.elem);`.',
    ],
    walkthrough: `**How to think about it.** Every rule in this exercise comes from one question: what will the code that expects a \`t\` do with the value? If it *reads* something out of it (a function’s result, an array’s elements), what comes out must be usable as \`t\`’s version, so the parts go the same way (covariant). If it *puts* something in (an argument, a pushed element), the value must accept whatever \`t\` would accept, so the parts go the other way (contravariant). A mutable array is both read and written, so both must hold, which for subtyping means the element types are equivalent (invariant).

**The solution, line by line.**

- \`if (s.k === 'arr' && t.k === 'ro') { return isSubtype(s.elem, t.elem); }\` A mutable array handed to code that only reads: reading is covariant. It must come first, since the next line rejects different kinds.
- \`if (s.k !== t.k) return false;\` Otherwise, a function and an array (say) are never related.
- The primitive and record cases are unchanged from the last chapter.
- \`if (s.k === 'fn') { return isSubtype(t.param, s.param) && isSubtype(s.result, t.result); }\` The Arrow rule: the parameter check has its arguments swapped (\`t\` first), which is what contravariant means in code; the result check is the usual way round.
- \`if (s.k === 'ro') { return isSubtype(s.elem, t.elem); }\` Read-only arrays: covariant.
- \`return isSubtype(s.elem, t.elem) && isSubtype(t.elem, s.elem);\` What is left is two mutable arrays: the elements must be subtypes in both directions.

**Common wrong attempts.**

- Checking the parameter the same way round as the result (\`isSubtype(s.param, t.param)\`): that is covariant parameters, which would let \`(d: Dog) => void\` stand in for \`(a: Animal) => void\` and call \`bark\` on a cat.
- Treating mutable arrays like read-only ones (covariant): exactly TypeScript’s choice, and exactly the crash in the chapter.
- Forgetting the \`arr\` to \`ro\` case, or putting it after the kind check, where it is never reached.`,
    wrong: [
      {
        code: `${GIVEN}

function isSubtype(s, t) {
  if (s.k === 'arr' && t.k === 'ro') {
    return isSubtype(s.elem, t.elem);
  }
  if (s.k !== t.k) return false;
${OLD}
  if (s.k === 'fn') {
    return isSubtype(s.param, t.param)
      && isSubtype(s.result, t.result);
  }
  if (s.k === 'ro') {
    return isSubtype(s.elem, t.elem);
  }
  return isSubtype(s.elem, t.elem) &&
    isSubtype(t.elem, s.elem);
}`,
        why: 'Parameters are checked covariantly, so a function that only handles dogs is accepted where any animal may be passed.',
      },
      {
        code: `${GIVEN}

function isSubtype(s, t) {
  if (s.k === 'arr' && t.k === 'ro') {
    return isSubtype(s.elem, t.elem);
  }
  if (s.k !== t.k) return false;
${OLD}
  if (s.k === 'fn') {
    return isSubtype(t.param, s.param)
      && isSubtype(s.result, t.result);
  }
  return isSubtype(s.elem, t.elem);
}`,
        why: 'Mutable arrays are treated as covariant (TypeScript’s choice), so a Dog array is accepted as an Animal array and a cat can be pushed in.',
      },
      {
        code: `${GIVEN}

function isSubtype(s, t) {
  if (s.k !== t.k) return false;
${OLD}
  if (s.k === 'fn') {
    return isSubtype(t.param, s.param)
      && isSubtype(s.result, t.result);
  }
  if (s.k === 'ro') {
    return isSubtype(s.elem, t.elem);
  }
  return isSubtype(s.elem, t.elem) &&
    isSubtype(t.elem, s.elem);
}`,
        why: 'The mutable-to-read-only case is missing, so a `Dog[]` cannot be passed where a `readonly Animal[]` is expected.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'If `Dog <: Animal`, which of these holds?',
    options: [
      { t: '`(d: Dog) => void` <: `(a: Animal) => void`', why: 'Then a dog-only function could be called with a cat.' },
      { t: '`(a: Animal) => void` <: `(d: Dog) => void`', correct: true, why: 'Parameters are contravariant: the function that accepts more can stand in.' },
      { t: 'Neither: parameter types must be equal', why: 'That is invariance, stricter than needed for parameters.' },
    ],
  },
  {
    q: 'Which of these is safe in a sound type system, given `Dog <: Animal`?',
    options: [
      { t: 'Using a mutable `Dog[]` as a mutable `Animal[]`', why: 'A cat could be pushed through the Animal[] name and read out as a Dog.' },
      { t: 'Using a mutable `Animal[]` as a mutable `Dog[]`', why: 'Reading would give animals that may not be dogs.' },
      { t: 'Using a `readonly Dog[]` as a `readonly Animal[]`', correct: true, why: 'Only reading is possible, and reading a Dog as an Animal is fine.' },
    ],
  },
  {
    q: 'In TypeScript with `strict` on, which assignment is accepted even though it is unsafe?',
    options: [
      { t: 'A `(d: Dog) => void` into a property typed `handle: (a: Animal) => void`', why: 'Function-typed properties are checked contravariantly under strictFunctionTypes: error TS2322.' },
      { t: 'A `(d: Dog) => void` into a method typed `handle(a: Animal): void`', correct: true, why: 'Method parameters stay bivariant, so this is accepted, and calling it with a cat crashes.' },
      { t: 'An `Animal[]` into a variable typed `Dog[]`', why: 'tsc rejects that: an Animal is missing bark.' },
    ],
  },
  {
    q: 'What does Java do with `Object[] things = words; things[0] = 42;` when `words` is a `String[]`?',
    options: [
      { t: 'Rejects the first line at compile time', why: 'Java’s arrays are covariant, so a String[] is an Object[].' },
      { t: 'Throws ArrayStoreException at the store, at run time', correct: true, why: 'The array remembers it holds Strings and checks every store.' },
      { t: 'Stores 42 and fails later, when a String is read', why: 'Java checks at the store itself, so the bad value never gets in.' },
    ],
  },
  {
    q: 'Why is a mutable array’s element type invariant, rather than covariant or contravariant?',
    options: [
      { t: 'Because arrays have a length', why: 'The length plays no part; reading and writing do.' },
      { t: 'Because reading needs the same direction and writing needs the opposite, and only equal types satisfy both', correct: true, why: 'An element type that is both a subtype and a supertype of the other is (for our purposes) the same type.' },
      { t: 'Because of TypeScript’s design goals', why: 'TypeScript in fact chose covariance; invariance is what soundness needs.' },
    ],
  },
];
