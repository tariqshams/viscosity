// Chapter 103 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'list-eval-order': {
    q: 'How does the interpreter evaluate the list literal `[a, b + 1, c]`?',
    a: 'It evaluates each element, left to right, and puts the values into a new `DripList` (whose `items` is a JavaScript array).',
  },
  'list-alias': {
    q: 'After `let ys = xs; push(ys, 3);`, has `xs` changed? Why?',
    a: 'Yes. A list is held by reference, so `ys` and `xs` name the same list.',
  },
  'list-equal': {
    q: 'What does `print [1] == [1];` print in Drip, and why?',
    a: '`false`: lists are compared by identity, and these are two different lists that happen to hold the same values.',
  },
  'index-errors': {
    q: 'Name the four checks `checkIndex` makes, in order.',
    a: 'The value is a list (`cannot index ...`); the index is a number (`a list index must be a number, not ...`); it is whole (`index 1.5 is not a whole number`); it is from 0 to `len - 1` (`index 3 is out of range for a list of length 3`).',
  },
  'index-no-grow': {
    q: 'Can `xs[len(xs)] = v;` add an element to the end of a Drip list?',
    a: 'No. Writing needs an existing index, so it is the runtime error `index ... is out of range`. Use `push(xs, v)` to grow a list.',
  },
  'push-returns': {
    q: 'What do `push(xs, v)` and `pop(xs)` return?',
    a: '`push` returns `none`; `pop` returns the element it removed (and is a runtime error on an empty list).',
  },
  'for-in-length': {
    q: 'In `for x in xs { ... }`, the body pushes onto `xs`. Are the new elements visited?',
    a: 'Yes. The loop reads the list’s length each time round, so pushed elements are visited (and a loop that always pushes never ends).',
  },
  'for-in-copy': {
    q: 'Why does `for x in xs { x = 0; }` leave `xs` unchanged?',
    a: '`x` is a fresh variable each time round, holding the element’s value; assigning to it changes the variable, not the list.',
  },
  'for-in-not-list': {
    q: 'What does `for x in 5 { }` do?',
    a: 'A runtime error, `cannot loop over a number`: a for-in loop needs a list (use `0..5` for a range).',
  },
};

export const examples = {
  particles: {
    title: 'Particles in two layouts',
    lang: 'drip',
    code: `# a list of records: [x, vx]
let ps = [[0, 1], [5, -1], [9, 2]];
for p in ps {
  p[0] += p[1];
}
print ps;

# one list per field
let xs = [0, 5, 9];
let vxs = [1, -1, 2];
for i in 0..len(xs) {
  xs[i] += vxs[i];
}
print xs;`,
  },
};

const ciHelpers = `class DripList {
  constructor(items) {
    this.items = items;
  }
}

function describe(v) {
  if (v === null) return 'none';
  if (v instanceof DripList) {
    return 'a list';
  }
  return 'a ' + typeof v;
}
`;

const ciTests = `const L = (...xs) => new DripList(xs);
const msg = (f) => {
  try { f(); } catch (e) { return e.message; }
  return 'no error';
};
test('reads an element', () => {
  expect(index(L(10, 20, 30), 1)).toBe(20);
  expect(index(L('a'), 0)).toBe('a');
});
test('only lists can be indexed', () => {
  expect(msg(() => index('abc', 0)))
    .toBe('cannot index a string');
  expect(msg(() => index(null, 0)))
    .toBe('cannot index none');
});
test('the index must be a number', () => {
  expect(msg(() => index(L(1), '0')))
    .toBe('a list index must be a number,'
      + ' not a string');
});
test('the index must be whole', () => {
  expect(msg(() => index(L(1, 2), 1.5)))
    .toBe('index 1.5 is not a whole number');
});
test('the index must be in range', () => {
  expect(msg(() => index(L(1, 2, 3), 3)))
    .toBe('index 3 is out of range'
      + ' for a list of length 3');
  expect(msg(() => index(L(1, 2, 3), -1)))
    .toBe('index -1 is out of range'
      + ' for a list of length 3');
  expect(msg(() => index(L(), 0)))
    .toBe('index 0 is out of range'
      + ' for a list of length 0');
});
test('the checks run in order', () => {
  expect(msg(() => index(L(), 'x')))
    .toBe('a list index must be a number,'
      + ' not a string');
});`;

const ciSolution = ciHelpers + `
function checkIndex(xs, i) {
  if (!(xs instanceof DripList)) {
    throw new Error('cannot index '
      + describe(xs));
  }
  if (typeof i !== 'number') {
    throw new Error('a list index must'
      + ' be a number, not '
      + describe(i));
  }
  if (!Number.isInteger(i)) {
    throw new Error('index ' + i
      + ' is not a whole number');
  }
  const n = xs.items.length;
  if (i < 0 || i >= n) {
    throw new Error('index ' + i
      + ' is out of range for a list'
      + ' of length ' + n);
  }
  return xs;
}

function index(xs, i) {
  return checkIndex(xs, i).items[i];
}`;

export const exercises = {
  'check-index': {
    title: 'Check an index the way Drip does',
    prompt:
      'Write `checkIndex(xs, i)` and use it in `index(xs, i)`, which reads element `i` of a Drip list. `DripList` (with its `items` array) and `describe` are given. `checkIndex` returns `xs` when everything is fine, and otherwise throws an `Error` with exactly Drip’s message, checking in this order: not a list, `cannot index a string`; index not a number, `a list index must be a number, not a string`; not whole, `index 1.5 is not a whole number`; out of range, `index 3 is out of range for a list of length 3`.',
    starter: ciHelpers + `
function checkIndex(xs, i) {
  // four checks, in order
  return xs;
}

function index(xs, i) {
  return checkIndex(xs, i).items[i];
}`,
    solution: ciSolution,
    tests: ciTests,
    hints: [
      'Write the four checks as four `if`s, each with its own `throw`, in the order the prompt gives; the order matters when two things are wrong at once.',
      '`xs instanceof DripList` tests for a list, `typeof i !== \'number\'` for a number, and `Number.isInteger(i)` for a whole number. Use `describe` for the type names.',
      'The range check is `i < 0 || i >= xs.items.length`. Build the message as `\'index \' + i + \' is out of range for a list of length \' + n`; JavaScript prints `1.5` and `-1` the same way Drip does.',
    ],
    walkthrough: `**How to think about it.** Every way \`xs[i]\` can go wrong becomes one question, asked in a fixed order, and each question needs the previous answer to be "yes" before it even makes sense: you cannot ask whether \`"x"\` is a whole number, and you cannot ask whether an index is in range for something that is not a list. So the function is four guards in a row, each throwing its own message, and if all four pass, the list is safe to read. Writing it as a separate \`checkIndex\` is what lets the companion use the same checks for reading (\`index\`) and writing (\`indexSet\`).

**The solution, line by line.**

- \`if (!(xs instanceof DripList)) { throw new Error('cannot index ' + describe(xs)); }\` refuses anything that is not a list. A JavaScript string is not a \`DripList\`, so \`"abc"[0]\` gives \`cannot index a string\`; \`describe(null)\` gives \`none\`, so the message reads \`cannot index none\`.
- \`if (typeof i !== 'number') { throw ... 'a list index must be a number, not ' + describe(i) }\` refuses \`"0"\` and \`true\`; Drip never turns a string into a number.
- \`if (!Number.isInteger(i)) { throw ... }\` refuses \`1.5\`. (It also refuses \`NaN\` and \`Infinity\`, which are numbers but not whole ones.)
- \`const n = xs.items.length;\` reads the current length.
- \`if (i < 0 || i >= n) { throw ... }\` refuses anything outside \`0\` to \`n - 1\`. The largest good index is \`n - 1\`, so \`i >= n\` (not \`i > n\`) is the right test; an empty list has no good index at all.
- \`return xs;\` hands back the checked list, so the caller can write \`checkIndex(xs, i).items[i]\` in one expression.
- \`function index(xs, i) { return checkIndex(xs, i).items[i]; }\` is the companion's \`index\` case: check, then read.

**Common wrong attempts.**

- \`i > n\` instead of \`i >= n\` lets \`index(L(1, 2, 3), 3)\` through, and JavaScript returns \`undefined\` for a missing element: a value Drip does not even have.
- Checking the range before the type: \`index(L(), 'x')\` then reports \`out of range\` instead of the real problem, that the index is a string.
- Using \`Math.floor(i) === i\` without the number check first: \`'2'\` slips through the string test if the checks are reordered, because JavaScript converts it.`,
    wrong: [
      {
        code: ciHelpers + `
function checkIndex(xs, i) {
  if (!(xs instanceof DripList)) {
    throw new Error('cannot index '
      + describe(xs));
  }
  const n = xs.items.length;
  if (i < 0 || i > n) {
    throw new Error('index ' + i
      + ' is out of range for a list'
      + ' of length ' + n);
  }
  return xs;
}

function index(xs, i) {
  return checkIndex(xs, i).items[i];
}`,
        why: '`i > n` lets the index `n` through (JavaScript then reads `undefined`), and with no number or whole-number checks, `\'0\'` and `1.5` are never reported properly.',
      },
    ],
  },
  'to-columns': {
    optional: true,
    lang: 'drip',
    title: 'From a list of records to a list per field',
    prompt:
      '`ps` is a list of records `[x, vx]`. Using a `for ... in` loop and `push`, build two new lists, `xs` with every `x` and `vxs` with every `vx`, in the same order, then print `xs`, `vxs` and `len(xs)`. Do not change `ps`.',
    starter: `let ps = [[0, 1], [5, -1], [9, 2]];
let xs = [];
let vxs = [];
# fill xs and vxs here
print xs;
print vxs;
print len(xs);`,
    solution: `let ps = [[0, 1], [5, -1], [9, 2]];
let xs = [];
let vxs = [];
for p in ps {
  push(xs, p[0]);
  push(vxs, p[1]);
}
print xs;
print vxs;
print len(xs);`,
    tests: `[0, 5, 9]
[1, -1, 2]
3`,
    hints: [
      'Each time round the loop, `p` is one record, such as `[5, -1]`. Where in `p` is the x, and where is the vx?',
      '`p[0]` is the x and `p[1]` is the vx. `push(list, value)` appends to the end of a list.',
      'Inside `for p in ps { ... }`, write `push(xs, p[0]);` and `push(vxs, p[1]);`.',
    ],
    walkthrough: `**How to think about it.** This is the change of layout from the memory chapters, done by hand: the same numbers, regrouped from "one small list per particle" into "one list per field". Walk the records in order, and for each one copy its first number onto the end of \`xs\` and its second onto the end of \`vxs\`; because both lists grow in the same order, position \`i\` in each still belongs to particle \`i\`.

**The solution, line by line.**

- \`let ps = [[0, 1], [5, -1], [9, 2]];\` is the list of records, given.
- \`let xs = []; let vxs = [];\` start two empty lists.
- \`for p in ps {\` visits each record in order; \`p\` is a fresh variable each time, holding a reference to that record (the same inner list, not a copy).
- \`push(xs, p[0]);\` reads the record's element 0, its x, and appends it to \`xs\`.
- \`push(vxs, p[1]);\` does the same with element 1, the vx.
- After the loop, \`print xs;\` shows \`[0, 5, 9]\`, \`print vxs;\` shows \`[1, -1, 2]\`, and \`print len(xs);\` shows \`3\`.

**Common wrong attempts.**

- \`xs[0] = p[0];\` (writing by index into an empty list) stops with \`index 0 is out of range for a list of length 0\`: writing cannot grow a list; \`push\` can.
- \`let xs = ps[0];\` takes the first *record*, \`[0, 1]\`, not the first field of every record.
- Writing \`for p in ps { push(xs, p); }\` copies whole records, so \`xs\` prints as \`[[0, 1], [5, -1], [9, 2]]\`.`,
    wrong: [
      {
        code: `let ps = [[0, 1], [5, -1], [9, 2]];
let xs = [];
let vxs = [];
for i in 0..len(ps) {
  xs[i] = ps[i][0];
  vxs[i] = ps[i][1];
}
print xs;
print vxs;
print len(xs);`,
        why: 'Writing `xs[i]` needs an existing element, so the first round stops with `index 0 is out of range for a list of length 0`. Grow a list with `push`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does this print?\n```\nlet xs = [1, 2];\nlet ys = xs;\nys[0] = 9;\nprint xs;\n```',
    options: [
      { t: '`[1, 2]`', why: '`ys` is not a copy: it names the same list as `xs`.' },
      { t: '`[9, 2]`', correct: true, why: 'Both names refer to one list, so writing through `ys` changes what `xs` shows.' },
      { t: '`[9, 1, 2]`', why: 'Index assignment overwrites an element; it does not insert one.' },
      { t: 'A runtime error', why: 'Index 0 exists, so the write is fine.' },
    ],
  },
  {
    q: 'Which of these is **not** a runtime error in Drip, with `let xs = [1, 2, 3];`?',
    options: [
      { t: '`xs[3]`', why: '`index 3 is out of range for a list of length 3`.' },
      { t: '`xs[1.5]`', why: '`index 1.5 is not a whole number`.' },
      { t: '`xs["0"]`', why: '`a list index must be a number, not a string`: Drip never converts a string to a number.' },
      { t: '`xs[len(xs) - 1]`', correct: true, why: 'This is index 2, the last element, so it reads `3`.' },
    ],
  },
  {
    q: 'What does this print?\n```\nlet xs = [1, 2];\nfor x in xs {\n  if x < 3 { push(xs, x + 2); }\n  print x;\n}\n```',
    options: [
      { t: '`1`, `2`', why: 'The loop reads the length each time round, so the pushed elements are visited too.' },
      { t: '`1`, `2`, `3`', why: 'The element 4 pushed while visiting 2 is visited as well.' },
      { t: '`1`, `2`, `3`, `4`', correct: true, why: 'Visiting 1 pushes 3, visiting 2 pushes 4; 3 and 4 are not below 3, so nothing more is pushed, and all four are printed.' },
      { t: 'It never ends', why: 'Only elements below 3 push, so the list stops growing at length 4.' },
    ],
  },
  {
    q: 'What does `print push(xs, 5);` print?',
    options: [
      { t: '`none`', correct: true, why: '`push` appends and returns `none`.' },
      { t: 'The new length', why: 'That is what JavaScript’s `push` returns; Drip’s returns `none`.' },
      { t: '`5`', why: 'That would be `pop` after the push.' },
      { t: 'The whole list', why: '`push` changes the list but does not return it.' },
    ],
  },
  {
    q: 'Why does the companion check the list’s length *each time round* a for-in loop, instead of once at the start?',
    options: [
      { t: 'To make the loop faster', why: 'Reading the length once would be (a little) faster; this is about behaviour.' },
      { t: 'Because Drip’s specification says pushing inside the loop extends it, as JavaScript’s for...of does for arrays', correct: true, why: 'That is the behaviour Drip promises, and checking the length before every round is what delivers it.' },
      { t: 'Because the list is copied at the start of the loop', why: 'It is not copied; the loop walks the very list it was given.' },
      { t: 'Because `len` is a native function', why: 'The loop reads `items.length` directly; it does not call `len`.' },
    ],
  },
];
