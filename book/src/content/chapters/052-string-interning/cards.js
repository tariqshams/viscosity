// Chapter 52 cards. Keys are stable ids: never rename them.

export const prompts = {
  'intern-what': {
    q: 'What is string interning?',
    a: 'Keeping exactly one object for each distinct string, shared by everyone who needs it.',
  },
  'copy-lookup-first': {
    q: 'What does `copyString` do before it allocates?',
    a: 'Hashes the characters and looks them up in the intern table. If the string exists, it returns that object.',
  },
  'concat-no-alloc': {
    q: 'The string `"hi"` already exists. Does `"h" + "i"` allocate a new string object?',
    a: 'No. The joined characters are hashed and found in the intern table, and the existing `"hi"` is returned.',
  },
  'equal-identity': {
    q: 'With interning, how does `OP_EQUAL` compare two strings?',
    a: 'With `===` on the references: one comparison, however long the strings are.',
  },
  'findstring-chars': {
    q: 'Where does the companion VM compare a string’s characters?',
    a: 'Only in `findString`, when interning, and only after the hashes match.',
  },
  'hash-first': {
    q: 'Why does `findString` compare `k.hash === hash` before `k.chars === chars`?',
    a: 'Comparing two numbers is cheap, and different hashes rule out almost every wrong string without touching characters.',
  },
  'table-as-set': {
    q: 'What values does the intern table `heap.strings` store?',
    a: 'Only `null`. The table is used as a set of strings: the keys are what matter.',
  },
  'intern-cost': {
    q: 'What does interning cost?',
    a: 'Every new string, including every concatenation, is hashed and looked up when it is made.',
  },
  'weak-table': {
    q: 'Why must the intern table hold strings weakly?',
    a: 'Otherwise every string would stay reachable through it and none could ever be freed.',
  },
  'constants-dup': {
    q: 'All mentions of a global name are one interned object. Why did `string_equality` still run out of constants?',
    a: 'The compiler adds a new constant-pool entry for every mention, even when it holds the same object.',
  },
};

export const examples = {
  'intern-vm': {
    title: 'Built strings meet literals',
    lang: 'drip-vm',
    code: `let a = "ab";
let b = "a" + "b";
print a == b;

let s = "";
for (let i = 0; i < 3; i = i + 1) {
  s = s + "na";
}
print s;
print s == "nanana";
print "na" + "na" == "nana";`,
  },
};

const ctor = `class Interner {
  constructor() {
    this.table = new Map();
    this.made = 0;
  }`;

export const exercises = {
  interner: {
    title: 'An interner',
    prompt:
      'Write `intern(chars)`. It returns a string object `{ chars }`, and it must return **the same object** every time it is asked for the same characters. Count each object you actually create in `this.made`. Use `this.table`, a `Map` from characters to the object.',
    starter: `${ctor}
  intern(chars) {
    this.made++;
    return { chars };
  }
}`,
    solution: `${ctor}
  intern(chars) {
    const old = this.table.get(chars);
    if (old !== undefined) return old;
    const s = { chars };
    this.made++;
    this.table.set(chars, s);
    return s;
  }
}`,
    tests: `test('an object with the characters', () => {
  const it = new Interner();
  expect(it.intern('hi').chars).toBe('hi');
});
test('same characters, same object', () => {
  const it = new Interner();
  const a = it.intern('hi');
  const b = it.intern('h' + 'i');
  expect(a === b).toBe(true);
});
test('different characters, different objects', () => {
  const it = new Interner();
  expect(it.intern('x') === it.intern('y'))
    .toBe(false);
});
test('only new strings are made', () => {
  const it = new Interner();
  for (const c of ['a', 'b', 'a', 'a', 'b']) {
    it.intern(c);
  }
  expect(it.made).toBe(2);
});`,
    hints: [
      'Before making an object, look the characters up in `this.table`.',
      'If you find one, return it straight away, without counting.',
      'Otherwise make `{ chars }`, count it, store it in the table under `chars`, and return it.',
    ],
    walkthrough: `\`\`\`js
intern(chars) {
  const old = this.table.get(chars);
  if (old !== undefined) return old;
  const s = { chars };
  this.made++;
  this.table.set(chars, s);
  return s;
}
\`\`\`

- **Look up first.** That is the whole of interning: never make a second object for characters you have seen.
- **Store what you make.** Forget \`this.table.set\` and every call makes a new object, because the table never learns about the first one.
- **Identity follows.** Since each distinct string has one object, \`intern(a) === intern(b)\` exactly when \`a\` and \`b\` have the same characters.

The JavaScript \`Map\` is doing the hard part here: it hashes \`chars\` and compares characters for you. The companion VM can’t key a table by raw characters, since its \`Table\` compares by identity, so it uses \`findString\`, which hashes and compares characters itself. The extra exercise builds that.`,
    wrong: [
      {
        code: `${ctor}
  intern(chars) {
    const old = this.table.get(chars);
    if (old !== undefined) return old;
    this.made++;
    return { chars };
  }
}`,
        why: 'Nothing is ever stored in the table, so the lookup always misses and every call makes a new object.',
      },
      {
        code: `${ctor}
  intern(chars) {
    const s = { chars };
    this.made++;
    this.table.set(chars, s);
    return this.table.get(chars);
  }
}`,
        why: 'This replaces the stored object on every call, so two requests for `"hi"` get two different objects. Look up before you make anything.',
      },
    ],
  },
  findStr: {
    optional: true,
    title: 'findString: hash first, then characters',
    prompt:
      'An 8-slot intern table is two arrays: `ks` holds string objects `{ chars, hash }` or `null`, and `vs` holds `null`, or `TOMB` for a tombstone. Write `findString(ks, vs, chars, h)`: probe from `h & 7`, step over tombstones, stop with `null` at a truly empty slot, and return the object whose `hash` equals `h` **and** whose `chars` equal `chars`.',
    starter: `const TOMB = true;

function findString(ks, vs, chars, h) {
  return null;
}`,
    solution: `const TOMB = true;

function findString(ks, vs, chars, h) {
  const mask = ks.length - 1;
  let i = h & mask;
  for (;;) {
    const k = ks[i];
    if (k === null) {
      if (vs[i] === null) return null;
    } else if (k.hash === h &&
        k.chars === chars) {
      return k;
    }
    i = (i + 1) & mask;
  }
}`,
    tests: `const str = (chars, hash) => ({ chars, hash });
const empty = () => [
  new Array(8).fill(null),
  new Array(8).fill(null),
];
test('finds the object itself', () => {
  const [ks, vs] = empty();
  const hi = str('hi', 10);
  ks[2] = hi;
  expect(findString(ks, vs, 'hi', 10)).toBe(hi);
});
test('a missing string gives null', () => {
  const [ks, vs] = empty();
  ks[2] = str('hi', 10);
  expect(findString(ks, vs, 'ho', 11)).toBe(null);
});
test('probes past collisions, wrapping', () => {
  const [ks, vs] = empty();
  ks[7] = str('x', 7);
  const h = str('health', 15);
  ks[0] = h;
  expect(findString(ks, vs, 'health', 15))
    .toBe(h);
});
test('steps over a tombstone', () => {
  const [ks, vs] = empty();
  vs[3] = TOMB;
  const s = str('vx', 3);
  ks[4] = s;
  expect(findString(ks, vs, 'vx', 3)).toBe(s);
});
test('same hash, other chars: keep going', () => {
  const [ks, vs] = empty();
  ks[5] = str('imposter', 5);
  const s = str('real', 5);
  ks[6] = s;
  expect(findString(ks, vs, 'real', 5)).toBe(s);
});`,
    hints: [
      'The probe loop is chapter 51’s: start at `h & mask`, step with `i = (i + 1) & mask`.',
      'A `null` key with a `null` value means “not here”: return `null`. A `null` key with `TOMB` means keep going.',
      'A matching hash isn’t enough: two different strings can share a hash. Check `k.chars === chars` too.',
    ],
    walkthrough: `\`\`\`js
function findString(ks, vs, chars, h) {
  const mask = ks.length - 1;
  let i = h & mask;
  for (;;) {
    const k = ks[i];
    if (k === null) {
      if (vs[i] === null) return null;
    } else if (k.hash === h &&
        k.chars === chars) {
      return k;
    }
    i = (i + 1) & mask;
  }
}
\`\`\`

- **Hash, then characters.** \`k.hash === h\` is a number comparison, so it throws out almost every wrong key for almost nothing. But hashes can collide, as the “imposter” test shows, so the characters get the final say.
- **Tombstones** are stepped over: a key you are looking for may have been placed beyond a slot that has since been deleted.
- **Return the object**, not \`true\`: the caller wants *the* existing string, so it can use it instead of allocating.

This is the companion VM’s \`findString\` line for line, apart from the names.`,
    wrong: [
      {
        code: `const TOMB = true;

function findString(ks, vs, chars, h) {
  const mask = ks.length - 1;
  let i = h & mask;
  for (;;) {
    const k = ks[i];
    if (k === null) {
      if (vs[i] === null) return null;
    } else if (k.hash === h) {
      return k;
    }
    i = (i + 1) & mask;
  }
}`,
        why: 'Matching on the hash alone returns the imposter: a different string that happens to share the hash. Compare the characters too.',
      },
      {
        code: `const TOMB = true;

function findString(ks, vs, chars, h) {
  const mask = ks.length - 1;
  let i = h & mask;
  for (;;) {
    const k = ks[i];
    if (k === null) return null;
    if (k.hash === h &&
      k.chars === chars) return k;
    i = (i + 1) & mask;
  }
}`,
        why: 'This stops at a tombstone as if it were empty, so a string stored beyond a deleted slot is never found.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why does `print "ab" == "a" + "b";` print `true` on the VM, when `OP_EQUAL` is just `===`?',
    options: [
      { t: 'OP_EQUAL secretly compares characters for strings', why: 'It doesn’t: it is `a === b`, nothing more.' },
      { t: 'The compiler folds `"a" + "b"` into `"ab"` before running', why: 'This compiler emits `OP_ADD`; the join happens at runtime.' },
      { t: '`copyString` finds the existing `"ab"` in the intern table and returns it, so both sides are the same object', correct: true, why: 'Interning makes equal strings identical, so `===` is enough.' },
      { t: 'JavaScript strings are always compared by value', why: 'The operands are `ObjString` objects, compared by reference.' },
    ],
  },
  {
    q: 'When does `copyString` allocate a new string object?',
    options: [
      { t: 'Every time it is called', why: 'That was the pre-interning story. It now looks first.' },
      { t: 'Only when no string with those characters is in the intern table', correct: true, why: 'Otherwise it returns the existing object.' },
      { t: 'Only for string literals', why: 'Literals that already exist are found too, and new concatenations are allocated.' },
      { t: 'Only during garbage collection', why: 'The collector frees strings; it never makes them.' },
    ],
  },
  {
    q: 'In `findString`, why is `k.hash === hash` checked before `k.chars === chars`?',
    options: [
      { t: 'Because characters can’t be compared in JavaScript', why: 'They can; `===` on two JS strings compares characters.' },
      { t: 'Because the hash is unique to each string', why: 'It isn’t: different strings can share a hash, which is why characters are still checked.' },
      { t: 'It is required by the FNV-1a algorithm', why: 'FNV-1a only computes hashes; it says nothing about lookups.' },
      { t: 'A number comparison is cheap and rules out almost every wrong string without reading characters', correct: true, why: 'The characters are compared only when the hashes match.' },
    ],
  },
  {
    q: 'What does interning make more expensive?',
    options: [
      { t: 'Creating strings: each new one is hashed and looked up first', correct: true, why: 'That includes every concatenation in a loop.' },
      { t: 'Comparing strings with `==`', why: 'That gets cheaper: a single `===`.' },
      { t: 'Looking up global variables by name', why: 'That gets cheaper too: keys compare by identity.' },
      { t: 'Printing strings', why: 'Printing just reads `chars`.' },
    ],
  },
  {
    q: 'What would go wrong if the intern table held its strings strongly?',
    options: [
      { t: 'Equal strings would stop being identical', why: 'Interning would still work; memory is the problem.' },
      { t: 'Lookups would become slower', why: 'Lookup speed isn’t affected by how strings are held.' },
      { t: 'No string could ever be freed, because the table itself would keep every one reachable', correct: true, why: 'So `removeWhite` drops unmarked strings before the sweep.' },
      { t: 'The table could no longer use tombstones', why: '`removeWhite` relies on tombstones; strength is a separate question.' },
    ],
  },
  {
    q: 'A program mentions the global `a1` 300 times. With interning, how many `ObjString` objects for `"a1"` exist, and how many constant-pool entries hold it?',
    options: [
      { t: '300 objects and 300 entries', why: 'Interning means only one object.' },
      { t: 'One object, and 300 entries all pointing at it', correct: true, why: 'Interning shares objects; this compiler doesn’t share constant slots.' },
      { t: 'One object and one entry', why: 'That would need a compiler that reuses constants, which this one doesn’t.' },
      { t: '300 objects and one entry', why: 'That is backwards: objects are shared, entries aren’t.' },
    ],
  },
];
