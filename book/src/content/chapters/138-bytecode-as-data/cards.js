// Chapter 138 cards. Keys are stable ids: never rename them.

export const prompts = {
  'chunk-three': {
    q: 'What three arrays make up a Drip `Chunk`?',
    a: '`code` (the bytes), `lines` (the source line of each byte) and `constants` (the constant pool).',
  },
  'lines-parallel': {
    q: 'Why do `code` and `lines` always have the same length?',
    a: '`write` pushes onto both at once: one line number for every byte.',
  },
  'chunk-per-fn': {
    q: 'A Drip program defines two functions. How many chunks does it compile to?',
    a: 'Three: one for each function and one for the script, which is compiled as a function too.',
  },
  'pool-why': {
    q: 'Why does `1.5` go in the constant pool rather than straight into `code`?',
    a: 'A byte holds only 0 to 255, but `1.5` is an 8-byte float. The code holds its small index instead.',
  },
  'pool-limit': {
    q: 'Where does the limit of 65,536 constants per function come from?',
    a: 'The constant’s index is a two-byte operand, and two bytes can hold the numbers 0 to 65,535.',
  },
  'hex-ffff': {
    q: 'What number is `0xffff`, and why does `makeConstant` compare with it?',
    a: '65,535, the largest number two bytes can hold: an index above it cannot be written as a `const` operand.',
  },
  'no-dedupe': {
    q: 'How many constants does `print 7; print 7;` add to the pool, and why?',
    a: 'Two. `addConstant` always appends; it never looks for an existing copy.',
  },
  'closure-constant': {
    q: 'What does the script’s constant pool hold for a function `fn add(a, b) { ... }` defined in it?',
    a: 'The compiled function itself (its own chunk inside), which the `closure` instruction turns into a value.',
  },
};

export const examples = {
  'tiny-chunk': {
    title: 'A chunk of your own',
    code: `class Chunk {
  code = [];
  lines = [];
  constants = [];
  write(byte, line) {
    this.code.push(byte);
    this.lines.push(line);
  }
  addConstant(v) {
    this.constants.push(v);
    return this.constants.length - 1;
  }
}

// print 1.5 + 2; on line 1
const c = new Chunk();
const k = c.addConstant(1.5);
c.write(0, 1); // const
c.write(k >> 8, 1);
c.write(k & 255, 1);
const k2 = c.addConstant(2);
c.write(0, 1);
c.write(k2 >> 8, 1);
c.write(k2 & 255, 1);
c.write(20, 1); // add
c.write(33, 1); // print
console.log(c.code.join(', '));
console.log(c.lines.join(', '));
console.log(c.constants);`,
  },
};

export const exercises = {
  dedupe: {
    title: 'A pool without duplicates',
    prompt:
      'Write `addConstant(chunk, v)`, which returns the index of `v` in `chunk.constants`. If an equal value (`===`) is already there, return its index instead of adding a copy. If adding a new value would need an index above 65,535 (`0xffff`), throw an `Error` with the message `too many constants in one function`.',
    starter: `function addConstant(chunk, v) {
  chunk.constants.push(v);
  return chunk.constants.length - 1;
}`,
    solution: `function addConstant(chunk, v) {
  const i = chunk.constants.indexOf(v);
  if (i !== -1) return i;
  const n = chunk.constants.length;
  if (n > 0xffff) throw new Error(
    'too many constants in one ' +
    'function');
  chunk.constants.push(v);
  return n;
}`,
    tests: `test('new values get new indexes', () => {
  const c = { constants: [] };
  expect(addConstant(c, 7)).toBe(0);
  expect(addConstant(c, 'hi')).toBe(1);
});
test('a repeated value reuses its index', () => {
  const c = { constants: [] };
  addConstant(c, 7);
  addConstant(c, 8);
  expect(addConstant(c, 7)).toBe(0);
  expect(c.constants.length).toBe(2);
});
test('repeated names do not grow the pool', () => {
  const c = { constants: [] };
  for (let i = 0; i < 1000; i++) {
    addConstant(c, 'x' + (i % 8));
  }
  expect(c.constants.length).toBe(8);
});
test('index 65535 is fine, 65536 throws', () => {
  const c = { constants: [] };
  c.constants.length = 65535;
  c.constants.fill(null);
  expect(addConstant(c, 'last')).toBe(65535);
  expect(() => addConstant(c, 'one more'))
    .toThrow();
});`,
    hints: [
      'There are three situations: the value is already in the pool, the pool is full, or the value is new. Which must you check first?',
      'Check for an existing copy first: a repeat never grows the pool, so it can never hit the limit. `array.indexOf(v)` finds the first index holding a value `===` to `v`, or gives -1.',
      'A new value’s index will be `chunk.constants.length`. If that is above `0xffff`, throw before pushing; otherwise push and return it.',
    ],
    walkthrough: `**How to think about it.** Picture the pool as the cloakroom from the chapter. When someone arrives with a coat that is already hanging there (the same value), you could hand them the old ticket rather than use up a new hook. Only a genuinely new value needs a new hook, and only then can the cloakroom be full. So the order of the checks is: is it already here? If not, is there room? If so, add it.

**The solution, line by line.**

- \`const i = chunk.constants.indexOf(v);\` searches the pool for a value \`===\` to \`v\`. \`indexOf\` gives the first matching index, or -1 if there is none.
- \`if (i !== -1) return i;\` reuses the existing entry: the caller gets the old index and the pool does not grow.
- \`const n = chunk.constants.length;\` is the index the new value will get, because \`push\` adds at the end.
- \`if (n > 0xffff) throw new Error(...)\` refuses an index that two bytes cannot hold. Index 65,535 is the last one allowed, so the 65,537th distinct value (index 65,536) is the first to fail, which the last test checks.
- \`chunk.constants.push(v);\` adds the value, and \`return n;\` hands back its index.

**Why it is not the default.** \`indexOf\` scans the whole pool on every call, so compiling a function with many constants gets slower and slower; a \`Map\` from value to index would fix that. And \`===\` is right for numbers and plain JavaScript strings, but in Drip’s VM a string is an object on the VM’s heap, where \`===\` asks “the same object?”. The chapter *String interning* makes equal strings the same object, which is what would make this kind of reuse safe there.

**Common wrong attempts.**

- Checking the limit first and the reuse second gives the wrong answer for a full pool: a value that is already there should still get its index back, not an error.
- Adding the limit but no reuse (the first wrong attempt below) still grows the pool on every repeat, so a name used a thousand times takes a thousand entries.`,
    wrong: [
      {
        code: `function addConstant(chunk, v) {
  const n = chunk.constants.length;
  if (n > 0xffff) throw new Error(
    'too many constants in one ' +
    'function');
  chunk.constants.push(v);
  return n;
}`,
        why: 'This adds the limit but not the reuse: every repeated value still takes a new entry.',
      },
      {
        code: `function addConstant(chunk, v) {
  const i = chunk.constants.indexOf(v);
  if (i !== -1) return i;
  chunk.constants.push(v);
  return chunk.constants.length - 1;
}`,
        why: 'This reuses entries but has no limit, so it happily returns 65,536, an index that two operand bytes cannot hold.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why can one Drip function hold at most 65,536 constants?',
    options: [
      { t: 'The VM’s memory runs out after that', why: 'Memory is not the limit; the size of the operand is.' },
      { t: 'A constant’s index is written in two bytes, which hold 0 to 65,535', correct: true, why: '`makeConstant` reports “too many constants in one function” when an index goes above `0xffff`.' },
      { t: 'JavaScript arrays cannot be longer than that', why: 'They can be far longer. The limit comes from the bytecode format.' },
      { t: 'Each constant takes one byte of code', why: 'A constant takes one entry in the pool; the code holds a two-byte index to it.' },
    ],
  },
  {
    q: 'In a Drip chunk, `lines[5]` is 2. What does that tell you?',
    options: [
      { t: 'The fifth instruction is on line 2', why: '`lines` has one entry per byte, not per instruction, and instructions can be up to several bytes long.' },
      { t: 'Constant number 5 is the value 2', why: 'Constants live in `constants`, not `lines`.' },
      { t: 'The byte at `code[5]` was compiled from source line 2', correct: true, why: '`code` and `lines` are parallel arrays, written together by `write`.' },
      { t: 'Line 2 has 5 bytes of code', why: 'Each entry is a line number for one byte, not a count.' },
    ],
  },
  {
    q: 'Why does `const` carry an index into the pool, rather than the value itself?',
    options: [
      { t: 'Values like `1.5` or `"hi"` do not fit in a byte or two; an index does', correct: true, why: 'A float is 8 bytes and a string can be any length, so the code stays small and every instruction stays simple.' },
      { t: 'So that values can be changed while the program runs', why: 'Constants do not change. The reason is size.' },
      { t: 'Because the VM can only add small whole numbers', why: 'The VM handles any Drip value. The constraint is the size of an operand.' },
      { t: 'To make the disassembler’s job easier', why: 'It is the other way round: the disassembler has to look the value up because of the pool.' },
    ],
  },
  {
    q: 'A Drip function reads the global `count` three hundred times. How many pool entries does the name `count` take in that function’s chunk?',
    options: [
      { t: 'One: the compiler reuses it', why: '`addConstant` never looks for an existing copy, so every mention adds a new entry.' },
      { t: 'None: globals are not constants', why: 'A global is looked up by its name, and the name is a string constant in the pool.' },
      { t: 'Three hundred, and it compiles fine', correct: true, why: 'One entry per mention; with room for 65,536 constants per function, that is wasteful but harmless.' },
      { t: 'It fails with “too many constants in one function”', why: 'Three hundred is far below the limit of 65,536.' },
    ],
  },
  {
    q: 'A script defines `fn area(w, h) { ... }`. Where are `area`’s instructions?',
    options: [
      { t: 'In the script’s chunk, right after the `closure` instruction', why: 'The script’s chunk only holds the compiled function as a constant; `closure` makes a value from it.' },
      { t: 'In `area`’s own chunk, held as a constant in the script’s pool', correct: true, why: 'Every function has its own chunk, with its own code, lines and constants, starting at offset 0.' },
      { t: 'Nowhere until the function is called', why: 'Drip compiles every function once, before the program runs.' },
      { t: 'In a separate chunk shared by all functions', why: 'Each function gets a chunk of its own.' },
    ],
  },
];
