// Chapter 13 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'class-what': {
    q: 'What is a class?',
    a: 'A blueprint for making objects of one kind: every object made from it is set up the same way.',
  },
  'new-steps': {
    q: 'What three things does `new Particle(3, 1)` do?',
    a: 'Makes a fresh empty object, runs the constructor with `this` set to it, and gives that object back.',
  },
  'constructor-this': {
    q: 'Inside a constructor, what does `this` refer to?',
    a: 'The new object being built by this `new`.',
  },
  'instances-separate': {
    q: '`const p = new Particle(1, 1); const q = new Particle(1, 1);` What is `p === q`, and why?',
    a: '`false`. Every `new` makes a separate object, even with the same arguments, and `===` on objects asks whether they are the very same object.',
  },
  'define-makes-none': {
    q: 'You write `class Particle { ... }` and nothing else. How many particles exist?',
    a: 'None. Defining a class only writes the blueprint; objects are made by `new`.',
  },
  'forgot-new': {
    q: 'What happens if you write `Particle(3, 1)` without `new`?',
    a: 'A `TypeError`: a class constructor cannot be called without `new`.',
  },
  'forgot-this': {
    q: 'A constructor says `x = x;` instead of `this.x = x;`. What is `new Bad(3).x`, and why?',
    a: '`undefined`. `x = x` only copies the parameter into itself, so nothing is stored on the new object.',
  },
  'class-shape': {
    q: 'Why do objects made by one class usually share one hidden shape in the engine?',
    a: 'The same constructor adds the same properties in the same order to every one of them.',
  },
};

export const examples = {
  'particles-class': {
    title: 'Many particles from one class',
    code: `class Particle {
  constructor(x, vx) {
    this.x = x;
    this.vx = vx;
  }
}

const ps = [];
for (let i = 0; i < 3; i++) {
  ps.push(new Particle(i * 10, 1));
}
console.log(ps);
console.log(ps.length);
console.log(ps[0] === ps[1]);`,
  },
};

export const exercises = {
  token: {
    title: 'A token class',
    prompt: 'Write a class `Token`. `new Token(kind, text)` stores `kind` and `text` on the new object, and also a third property, `length`, holding the number of characters in `text` (a string has a `length`, just like an array). For example `new Token(\'name\', \'width\')` has `kind` `\'name\'`, `text` `\'width\'` and `length` `5`.',
    starter: `class Token {
  constructor(kind, text) {
    // your code here
  }
}

const t = new Token('name', 'width');
console.log(t);`,
    solution: `class Token {
  constructor(kind, text) {
    this.kind = kind;
    this.text = text;
    this.length = text.length;
  }
}`,
    tests: `test('stores kind and text', () => {
  const t = new Token('name', 'width');
  expect(t.kind).toBe('name');
  expect(t.text).toBe('width');
});
test('works out the length', () => {
  expect(new Token('num', '42').length).toBe(2);
  expect(new Token('op', '+').length).toBe(1);
});
test('two tokens are separate', () => {
  const a = new Token('num', '1');
  const b = new Token('num', '1');
  expect(a === b).toBe(false);
  a.text = '9';
  expect(b.text).toBe('1');
});`,
    hints: [
      'The constructor already has the two values in its parameters `kind` and `text`. Where do they need to end up?',
      'Store each one on the new object with `this.`: `this.kind = kind;` and the same for `text`.',
      'The third property is worked out from `text`: `this.length = text.length;`.',
    ],
    walkthrough: `**How to think about it.** A constructor has one job: take the values it is handed and leave them on the new object, so that whoever wrote \`new Token(...)\` gets a finished token back. Inside the constructor the new object is called \`this\`, and the values are in the parameters. So for each property the test wants, ask "where does its value come from?": \`kind\` and \`text\` come straight from the parameters, and \`length\` is worked out from \`text\`.

**The solution, line by line.**

- \`class Token {\` starts the blueprint for tokens.
- \`  constructor(kind, text) {\` is the function \`new\` runs for every token; in \`new Token('name', 'width')\`, \`kind\` holds \`'name'\` and \`text\` holds \`'width'\`, matched by position.
- \`    this.kind = kind;\` gives the new object a property called \`kind\` holding the argument. The name on the left (after \`this.\`) is the property; the name on the right is the parameter. They happen to be spelled the same, which is the usual habit.
- \`    this.text = text;\` does the same for the text.
- \`    this.length = text.length;\` asks the string how many characters it has (\`'width'.length\` is \`5\`) and stores that number as a third property.
- \`  }\` and \`}\` close the constructor and the class. There is no \`return\`: \`new\` hands back the object for us.

The last test makes two tokens from the same arguments and checks they are different objects: each \`new\` builds its own, so changing \`a.text\` leaves \`b\` alone. You get that for free; it is how \`new\` works.

**Common wrong attempts.**

- Writing \`kind = kind;\` without \`this.\` copies each parameter into itself and stores nothing, so every property reads as \`undefined\`.
- Working out the length first, as \`this.length = this.text.length;\` on the first line: at that moment the new object has no \`text\` yet, so \`this.text\` is \`undefined\`, and asking \`undefined\` for its \`length\` is a \`TypeError\`. Either set \`this.text\` first or use the parameter \`text\`, as the solution does.`,
    wrong: [
      {
        code: `class Token {
  constructor(kind, text) {
    kind = kind;
    text = text;
  }
}`,
        why: 'Without `this.`, nothing is stored on the new object, so `kind`, `text` and `length` are all `undefined`.',
      },
      {
        code: `class Token {
  constructor(kind, text) {
    this.length = this.text.length;
    this.kind = kind;
    this.text = text;
  }
}`,
        why: 'On the first line `this.text` does not exist yet (it is `undefined`), so reading its `length` throws a TypeError. Use the parameter `text`, or set `this.text` first.',
      },
    ],
  },
  row: {
    optional: true,
    title: 'A row of particles',
    prompt: 'The class `Particle` is given. Write `makeRow(n)` that **returns an array** of `n` separate Particle instances, where the one at index `i` has `x` equal to `i` and `vx` equal to `1`. For example `makeRow(3)` holds particles at `x` 0, 1 and 2, and `makeRow(0)` is `[]`.',
    starter: `class Particle {
  constructor(x, vx) {
    this.x = x;
    this.vx = vx;
  }
}

function makeRow(n) {
  // your code here
}

console.log(makeRow(3));`,
    solution: `class Particle {
  constructor(x, vx) {
    this.x = x;
    this.vx = vx;
  }
}

function makeRow(n) {
  const ps = [];
  for (let i = 0; i < n; i++) {
    ps.push(new Particle(i, 1));
  }
  return ps;
}`,
    tests: `test('makes n particles', () => {
  expect(makeRow(3).length).toBe(3);
  expect(makeRow(0)).toEqual([]);
});
test('each x is its index', () => {
  const ps = makeRow(4);
  expect(ps[0].x).toBe(0);
  expect(ps[3].x).toBe(3);
  expect(ps[2].vx).toBe(1);
});
test('they are real Particles', () => {
  expect(makeRow(1)[0] instanceof Particle).toBe(true);
});
test('each one is a separate object', () => {
  const ps = makeRow(2);
  expect(ps[0] === ps[1]).toBe(false);
});`,
    hints: [
      'Start from an empty array and add one particle per pass of a loop.',
      'A `for` loop with `i` from `0` up to (but not including) `n` gives exactly the indexes you need.',
      'Inside the loop, `ps.push(new Particle(i, 1));`. After the loop, `return ps;`.',
    ],
    walkthrough: `**How to think about it.** You do not know \`n\` in advance, so you cannot write the particles out by hand; build the array one slot at a time, the way chapter 3's countdown did. The particle at index \`i\` needs \`x = i\`, which is a strong hint that the loop counter itself should be the \`x\`.

**The solution, line by line.**

- \`function makeRow(n) {\` takes how many particles to make.
- \`  const ps = [];\` starts with an empty array.
- \`  for (let i = 0; i < n; i++) {\` runs once for each index from \`0\` to \`n - 1\`, so exactly \`n\` times (and not at all for \`n = 0\`).
- \`    ps.push(new Particle(i, 1));\` builds a brand-new particle on every pass, with \`x\` equal to the counter and \`vx\` equal to \`1\`, and adds it at the end. Because the \`new\` is inside the loop, each pass makes a different object.
- \`  }\` ends the loop.
- \`  return ps;\` hands the filled array back.

**Common wrong attempts.**

- Making one particle before the loop and pushing it \`n\` times: the array then holds \`n\` arrows to the *same* object (chapter 7), so every slot shows the same \`x\`, and changing one changes them all. Put the \`new\` inside the loop.
- Looping with \`i <= n\` makes one particle too many.`,
    wrong: [
      {
        code: `class Particle {
  constructor(x, vx) {
    this.x = x;
    this.vx = vx;
  }
}

function makeRow(n) {
  const ps = [];
  const p = new Particle(0, 1);
  for (let i = 0; i < n; i++) {
    ps.push(p);
  }
  return ps;
}`,
        why: 'Only one `new` runs, so every slot holds the same object, with `x` 0. Each particle needs its own `new`, inside the loop.',
      },
      {
        code: `class Particle {
  constructor(x, vx) {
    this.x = x;
    this.vx = vx;
  }
}

function makeRow(n) {
  const ps = [];
  for (let i = 0; i <= n; i++) {
    ps.push(new Particle(i, 1));
  }
  return ps;
}`,
        why: '`i <= n` runs one extra time, so `makeRow(3)` has 4 particles. Use `i < n`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What is the **first** thing `new Particle(3, 1)` does?',
    options: [
      {
        t: 'Runs the constructor on the class itself',
        why: 'The constructor runs on a new object, which has to exist first.',
      },
      {
        t: 'Creates a fresh empty object',
        correct: true,
        why: 'Then it runs the constructor with `this` set to that object, and gives it back.',
      },
      {
        t: 'Copies an existing particle',
        why: '`new` always starts from a brand-new object.',
      },
      {
        t: 'Prints the new particle',
        why: 'Nothing is printed unless you call `console.log`.',
      },
    ],
  },
  {
    q: `What does this print?
\`\`\`
const p = new Particle(0, 1);
const q = new Particle(0, 5);
q.x = 7;
console.log(p.x, q.x);
\`\`\``,
    options: [
      {
        t: '`7 7`',
        why: '`p` and `q` are separate instances. Changing `q` does not touch `p`.',
      },
      {
        t: '`0 0`',
        why: '`q.x = 7` does change `q`.',
      },
      {
        t: '`0 7`',
        correct: true,
        why: 'Each `new` made its own object; only `q.x` was changed.',
      },
      {
        t: '`1 5`',
        why: 'Those are the `vx` values; `x` started at 0 for both.',
      },
    ],
  },
  {
    q: '`const p = Particle(3, 1);` (no `new`). What happens?',
    options: [
      {
        t: '`p` is a particle as usual',
        why: 'A class cannot be called like an ordinary function.',
      },
      {
        t: '`p` is `undefined`',
        why: 'It never gets that far: JavaScript stops with an error first.',
      },
      {
        t: 'A TypeError: a class constructor cannot be invoked without `new`',
        correct: true,
        why: 'Only `new` makes the fresh object, so JavaScript refuses the call.',
      },
      {
        t: 'A new particle with no properties',
        why: 'No object is made at all.',
      },
    ],
  },
  {
    q: `What is \`new Bad(3).x\`?
\`\`\`
class Bad {
  constructor(x) {
    x = x;
  }
}
\`\`\``,
    options: [
      {
        t: '`undefined`',
        correct: true,
        why: '`x = x` only reassigns the parameter; `this.x` was never set, so the object has no `x`.',
      },
      {
        t: '`3`',
        why: 'That would need `this.x = x`.',
      },
      {
        t: 'A TypeError',
        why: 'Nothing here is an error: the slip is silent, which is why it is easy to miss.',
      },
      {
        t: '`NaN`',
        why: 'No arithmetic happens.',
      },
    ],
  },
  {
    q: 'Why do classes help engines like V8 run property access fast?',
    options: [
      {
        t: 'Classes are compiled before the page loads',
        why: 'Classes run like any other JavaScript; that is not the reason.',
      },
      {
        t: 'Instances of a class cannot gain new properties',
        why: 'They can: `p.colour = \'red\'` works. That is why it is a hint, not a guarantee.',
      },
      {
        t: 'One constructor adds the same properties in the same order, so instances tend to share one shape',
        correct: true,
        why: 'Objects with the same shape let the engine know where each property sits without searching.',
      },
      {
        t: 'Classes store numbers as typed arrays',
        why: 'Instances are ordinary objects.',
      },
    ],
  },
];
