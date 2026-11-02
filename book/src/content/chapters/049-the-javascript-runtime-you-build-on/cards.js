// Chapter 49 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'eq-copies': {
    q: 'In JavaScript, after `const b = a;` where `a` holds an object, how many objects are there?',
    a: 'One: `=` copies the reference, so `a` and `b` lead to the same object.',
  },
  'map-object-key': {
    q: 'A JavaScript `Map` has the object `a` as a key. Does `m.get(c)` find it when `c` is a different object with the same fields and values?',
    a: 'No: object keys are compared by identity, so a lookalike is a different key.',
  },
  'map-content-key': {
    q: 'How do you make a JavaScript `Map` look up a pair of numbers `(x, y)` by their values?',
    a: 'Build a key that compares by value, such as the string `` `${x},${y}` ``, since strings are compared by contents.',
  },
  'closure-keeps': {
    q: 'A JavaScript function returns an arrow function that uses its local `let n`. What happens to `n` after the outer call returns?',
    a: 'It stays alive, captured by the arrow function, for as long as that function can be reached; each call sees and changes the same `n`.',
  },
  'method-on-proto': {
    q: 'In JavaScript, where is a method defined in a `class` body stored?',
    a: 'Once, on the class’s prototype object; instances find it through the prototype chain rather than holding their own copy.',
  },
  'throw-unwinds': {
    q: 'In JavaScript, what happens to the active calls between a `throw` and the nearest enclosing `try`/`catch`?',
    a: 'They are unwound: each one stops at once, frame by frame, until a `catch` takes the error.',
  },
  'catch-rethrow': {
    q: 'Why should a `catch` that expects one custom error class test `e instanceof` that class and rethrow anything else?',
    a: 'A `catch` catches every error, including bugs; rethrowing keeps unexpected errors from being silently treated as expected ones.',
  },
  'generator-lazy': {
    q: 'When does the body of a JavaScript `function*` start running?',
    a: 'Only at the first `next()` call on the iterator it returns; calling the function itself runs none of the body.',
  },
  'microtask-order': {
    q: 'In what order do these print: `setTimeout(() => log(\'t\'))`, `Promise.resolve().then(() => log(\'m\'))`, `log(\'s\')`?',
    a: '`s`, `m`, `t`: the current job finishes first, then microtasks (promise callbacks), then the timer task.',
  },
};

export const examples = {};

export const exercises = {
  interner: {
    title: 'An interner',
    prompt: 'Engines replace names by small numbers so that comparing two names is one integer comparison. Write `makeInterner()` that returns an object with two methods: `id(name)` gives each distinct string a number, starting at `0` and counting up in order of first appearance, and gives the same number every time the same string is seen; `name(id)` gives the string back. Two interners must not share their numbering.',
    starter: `function makeInterner() {
  // your code here
}

const t = makeInterner();
console.log(t.id('x'), t.id('y'));
// 0 1`,
    solution: `function makeInterner() {
  const ids = new Map();
  const names = [];
  return {
    id(s) {
      let n = ids.get(s);
      if (n === undefined) {
        n = names.length;
        ids.set(s, n);
        names.push(s);
      }
      return n;
    },
    name(n) {
      return names[n];
    },
  };
}`,
    tests: `test('ids count from 0', () => {
  const t = makeInterner();
  expect(t.id('x')).toBe(0);
  expect(t.id('y')).toBe(1);
});
test('the same name gets the same id', () => {
  const t = makeInterner();
  t.id('x'); t.id('y');
  expect(t.id('x')).toBe(0);
  expect(t.id('y')).toBe(1);
  expect(t.id('z')).toBe(2);
});
test('equal strings built apart match', () => {
  const t = makeInterner();
  const a = 'ab';
  const b = ['a', 'b'].join('');
  expect(t.id(a)).toBe(t.id(b));
});
test('name gives the string back', () => {
  const t = makeInterner();
  t.id('let'); t.id('fn');
  expect(t.name(1)).toBe('fn');
  expect(t.name(t.id('let'))).toBe('let');
});
test('two interners are separate', () => {
  const t = makeInterner();
  const u = makeInterner();
  t.id('a'); t.id('b');
  expect(u.id('b')).toBe(0);
});`,
    hints: [
      'Keep two things inside `makeInterner`: a `Map` from name to id, and an array from id to name. The returned methods close over them.',
      'In `id`, look the name up first. If it is missing (`undefined`), its id is the current length of the array; record it in both places.',
      'Because the `Map` and array are created inside each call to `makeInterner`, every interner gets its own; `name(n)` is `names[n]`.',
    ],
    walkthrough: `**How to think about it.** Two lookups are needed, one in each direction: name to id, which a \`Map\` does by hashing the string, and id to name, which an array does by index, since the ids are exactly 0, 1, 2 and so on. Both tables are state that must survive between calls, yet must not be shared between interners; a closure gives exactly that, because each call to \`makeInterner\` creates fresh variables, and the two methods it returns keep them alive.

**The solution, line by line.**

- \`function makeInterner() {\` makes one interner per call.
- \`  const ids = new Map();\` maps each name to its id. Strings are compared by value, so two equal strings built in different ways find the same entry.
- \`  const names = [];\` maps each id back to its name; \`names[n]\` is the name with id \`n\`.
- \`  return {\` returns an object whose two methods close over \`ids\` and \`names\`.
- \`    id(s) {\` looks up one name.
- \`      let n = ids.get(s);\` is the id if the name has been seen, or \`undefined\` if not.
- \`      if (n === undefined) {\` handles a new name. (Testing \`!n\` would be wrong: id 0 is falsy.)
- \`        n = names.length;\` gives the next unused id, because the array holds one entry per id handed out so far.
- \`        ids.set(s, n);\` and \`names.push(s);\` record the name in both directions, keeping them in step.
- \`      }\` closes the \`if\`.
- \`      return n;\` returns the id, old or new.
- \`    },\` closes \`id\`.
- \`    name(n) { return names[n]; },\` reads the array by index.
- \`  };\` and \`}\` close the object and the function.

**Common wrong attempts.**

- Testing \`if (!n)\` treats id 0 as missing, so the first name gets a new id every time it is seen.
- Creating the \`Map\` and array outside \`makeInterner\` makes every interner share one numbering.
- Reading \`names.length\` after the \`push\` rather than before it numbers the names from 1 instead of 0.`,
    wrong: [
      {
        code: `function makeInterner() {
  const ids = new Map();
  const names = [];
  return {
    id(s) {
      let n = ids.get(s);
      if (!n) {
        n = names.length;
        ids.set(s, n);
        names.push(s);
      }
      return n;
    },
    name(n) { return names[n]; },
  };
}`,
        why: '`!n` is true for the id `0`, so the first name is treated as new every time and gets a fresh id. Compare with `undefined`.',
      },
      {
        code: `const ids = new Map();
const names = [];
function makeInterner() {
  return {
    id(s) {
      let n = ids.get(s);
      if (n === undefined) {
        n = names.length;
        ids.set(s, n);
        names.push(s);
      }
      return n;
    },
    name(n) { return names[n]; },
  };
}`,
        why: 'The tables are created once, outside, so every interner shares them; create them inside `makeInterner` so each call closes over its own.',
      },
    ],
  },
};

export const quiz = [
  {
    q: '`const m = new Map(); m.set({ k: 1 }, \'A\');` What does `m.get({ k: 1 })` return?',
    options: [
      { t: "'A', because the keys have the same contents", why: 'A `Map` compares object keys by identity; the argument is a new object, so it is a different key.' },
      { t: 'An error, because objects cannot be Map keys', why: 'Any value can be a `Map` key, objects included.' },
      { t: '`undefined`, because the two objects are different objects', correct: true, why: 'Each object literal makes a new object, and object keys are found by identity.' },
      { t: "'A', because Map converts keys to strings", why: 'Plain objects used as dictionaries convert keys to strings; a `Map` does not.' },
    ],
  },
  {
    q: 'A class `Tok` defines a method `is` in its body. One million instances are created. How many copies of the `is` function are there?',
    options: [
      { t: 'One, on `Tok.prototype`, shared through the prototype chain', correct: true, why: 'Methods declared in a class body are stored once on the prototype; instances hold only their own fields.' },
      { t: 'One million, one per instance', why: 'That would happen if each constructor call assigned a new function to a field, not for class-body methods.' },
      { t: 'None until the method is first called', why: 'The method is created when the class is defined, once.' },
      { t: 'Two: one on the class and one on the first instance', why: 'Instances never get their own copy of a class-body method.' },
    ],
  },
  {
    q: 'Function `f` calls `g`, which calls `h`, which throws. Only `f` has a `try`/`catch` around its call to `g`. What happens to `g` and `h`?',
    options: [
      { t: 'They finish their remaining statements first', why: 'A throw stops each active call at once; nothing after the throw point runs in `h` or `g`.' },
      { t: '`g` catches the error automatically', why: 'Only a `catch` catches; `g` has none, so the error passes through it.' },
      { t: 'The program stops, because `h` has no `catch`', why: 'The error travels outward to any enclosing `catch`, not only one in the throwing function.' },
      { t: 'Both are unwound, and `f`\'s `catch` receives the error', correct: true, why: 'The error unwinds frames until it reaches the nearest enclosing `catch`, here in `f`.' },
    ],
  },
  {
    q: '`function* g() { console.log(\'start\'); yield 1; }` What does `const it = g();` print?',
    options: [
      { t: '`start`', why: 'Calling a generator function runs none of its body; the body starts at the first `next()`.' },
      { t: 'Nothing', correct: true, why: 'It only creates the iterator; `it.next()` would print `start` and pause at `yield 1`.' },
      { t: '`1`', why: 'Nothing is printed by the `yield`, and the body has not run yet anyway.' },
      { t: '`start` then `1`', why: 'Neither: the body is lazy, and `yield` hands a value out rather than printing it.' },
    ],
  },
  {
    q: 'A synchronous interpreter loop is running a long program when a `setTimeout(fn, 0)` it scheduled earlier comes due. When does `fn` run?',
    options: [
      { t: 'At once, pausing the loop', why: 'JavaScript runs one job to completion; a timer never interrupts a running job.' },
      { t: 'After the loop returns, the current job ends and any microtasks have run', correct: true, why: 'Timers are tasks: they wait for the current job and the microtask queue to finish.' },
      { t: 'Before any promise callbacks queued by the same job', why: 'Promise callbacks are microtasks, which run before the next task such as a timer.' },
      { t: 'Never, because 0 means no delay', why: 'A delay of 0 still schedules the callback as a later task.' },
    ],
  },
];
