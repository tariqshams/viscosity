// Chapter 144 cards: recall prompts, examples, exercises and quiz.

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
    q: 'With interning, how does the VM’s `eq` instruction compare two strings?',
    a: 'With `===` on the references: one comparison, however long the strings are.',
  },
  'name-literal-same': {
    q: 'A program has a variable `a` and the string literal `"a"`. How many string objects hold `a`?',
    a: 'One. The compiler asks `copyString` for both, and the second request finds the first.',
  },
  'findstring-chars': {
    q: 'Where does the companion VM compare a string’s characters?',
    a: 'Only in `findString`, while interning, and only after the hashes match.',
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
    a: 'Every new string, including every concatenation and every `str(...)`, is hashed and looked up when it is made.',
  },
  'weak-table': {
    q: 'Why must the intern table hold strings weakly?',
    a: 'Otherwise every string would stay reachable through it and none could ever be freed.',
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
for i in 0..3 {
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
    walkthrough: `**How to think about it.** Interning is a promise: "for the same characters, you always get the same object". The only way to keep it is to remember every object you have handed out, keyed by its characters, and to look there *before* making anything. So the method has two paths: a found path (return what you made before, and make nothing) and a new path (make it, remember it, return it). \`this.made\` only goes up on the new path, which is how the tests check you are not making extra objects.

**The solution, line by line.**

\`\`\`js
intern(chars) {
  const old = this.table.get(chars);
  if (old !== undefined) return old;
  const s = { chars };
  this.made++;
  this.table.set(chars, s);
  return s;
}
\`\`\`

- \`const old = this.table.get(chars);\` asks the \`Map\` whether these characters have been interned before. A \`Map\` gives \`undefined\` for a key it does not have.
- \`if (old !== undefined) return old;\` is the found path: hand back the very object made earlier, so two calls with \`"hi"\` and \`"h" + "i"\` give the same object.
- \`const s = { chars };\` is the new path: make the one and only object for these characters (\`{ chars }\` is short for \`{ chars: chars }\`).
- \`this.made++;\` counts it.
- \`this.table.set(chars, s);\` remembers it, so the next request takes the found path.
- \`return s;\` hands it out.

The JavaScript \`Map\` does the hard part here: it hashes \`chars\` and compares characters for you. The companion VM cannot key a table by raw characters, since its \`Table\` compares keys by identity, so it uses \`findString\`, which hashes and compares characters itself; the extra exercise builds that.

**Common wrong attempts.**

- Looking up but never storing: the lookup always misses, so every call makes a new object, and \`made\` keeps growing.
- Making the object first and storing it every time: the table is overwritten on each call, so two requests for \`"hi"\` return two different objects. The look-up must come before anything is made.`,
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
      'The probe loop is the one in `Table.find`: start at `h & mask`, step with `i = (i + 1) & mask`.',
      'A `null` key with a `null` value means “not here”: return `null`. A `null` key with `TOMB` means keep going.',
      'A matching hash isn’t enough: two different strings can share a hash. Check `k.chars === chars` too.',
    ],
    walkthrough: `**How to think about it.** This is the probe loop of \`Table.find\` with a different question at each slot. \`find\` holds a key object and asks "is this the same object?"; \`findString\` holds only characters and a hash, so it asks "is this a string with my hash *and* my characters?". Everything else stays: start at \`h & mask\`, step with wrap-around, stop with "absent" at a truly empty slot, and step over tombstones.

**The solution, line by line.**

\`\`\`js
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

- \`const mask = ks.length - 1;\` is 7 for the 8-slot tables in the tests.
- \`let i = h & mask;\` starts where a string with this hash would have been put.
- \`for (;;) {\` loops until a \`return\`; it always ends because the table always has an empty slot.
- \`const k = ks[i];\` reads the string object in this slot, or \`null\`.
- \`if (k === null) {\` means no string here. \`if (vs[i] === null) return null;\` is a truly empty slot: no string with these characters exists. If the value is \`TOMB\`, the \`if\` does nothing and the loop steps on.
- \`} else if (k.hash === h &&\` compares two numbers first; for a different string this is almost always false, and the characters are never read.
- \`k.chars === chars) {\` only runs when the hashes agree, and settles it, because different strings can share a hash.
- \`return k;\` returns the existing object itself, so the caller can use it instead of making a new one.
- \`i = (i + 1) & mask;\` steps on, wrapping from 7 to 0.

**Common wrong attempts.**

- Matching on the hash alone: the "imposter" test has a different string with the same hash, and it is returned by mistake. Hashes narrow the search; characters decide.
- Returning \`null\` at any slot with no key: a tombstone then looks like the end of the path, and a string stored beyond a deleted slot is never found.`,
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
    q: 'Why does `print "ab" == "a" + "b";` print `true` on the VM, when `eq` is just `===`?',
    options: [
      { t: '`eq` secretly compares characters for strings', why: 'It does not: `valuesEqual` is `a === b`, nothing more.' },
      { t: 'The compiler joins `"a" + "b"` into `"ab"` before running', why: 'This compiler emits `add`; the join happens while the program runs.' },
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
    q: 'In the book’s benchmark run, the `strings` program took 383 ms on the VM and 365 ms on the tree-walker. Which explanation fits?',
    options: [
      { t: 'The VM compares strings character by character', why: 'The opposite: interning makes the VM’s comparisons one `===`.' },
      { t: 'The program does little but build strings, and on the VM every one of them is hashed and looked up in the intern table', correct: true, why: 'About 1.4 million strings are made; interning’s cost is paid on each, and its savings have little to work on.' },
      { t: 'The VM has no garbage collector for strings', why: 'It has one; the intern table even lets unused strings go.' },
      { t: 'The tree-walker interns strings more cleverly', why: 'The tree-walker does not intern at all; it uses plain JavaScript strings.' },
    ],
  },
];
