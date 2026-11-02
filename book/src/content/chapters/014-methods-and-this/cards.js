// Chapter 14 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'method-what': {
    q: 'What is a method?',
    a: 'A function stored on an object or a class, called with a dot, as in `p.move()`.',
  },
  'method-shared': {
    q: 'You make 1000 particles from a class with a `move` method. How many copies of `move` are there?',
    a: 'One. Methods written in a class body are stored once, on the class’s prototype object, and shared by every instance.',
  },
  'this-what': {
    q: '`move` is a method written in a class body. In the call `q.move()`, what is `this` inside `move`?',
    a: '`q`: the object before the dot.',
  },
  'this-when': {
    q: 'Lexical scope is decided by where a function is written. What decides what `this` means inside an ordinary function or method?',
    a: 'How it is called: the object it was called on, in each call. (An arrow function is the exception: it takes `this` from where it is written.)',
  },
  'lost-this': {
    q: '`move` is a class method that reads `this.x`. Why does `const m = p.move; m();` fail?',
    a: '`m()` has no object before a dot, so `this` is `undefined`, and reading `this.x` is a TypeError.',
  },
  'arrow-fix': {
    q: '`twice(f)` calls `f()` twice, and `move` is a class method that uses `this`. Why does `twice(p.move)` fail while `twice(() => p.move())` works?',
    a: '`p.move` passes only the function, which is later called with no object. The arrow function keeps the call `p.move()`, dot and all.',
  },
  'instanceof-what': {
    q: 'What does `a instanceof C` check?',
    a: 'Whether the object holding `C`’s shared methods (`C.prototype`) is on the chain of objects `a` borrows methods from: true for objects made by `new C`, or by a class that extends `C`.',
  },
  'instanceof-fake': {
    q: '`const fake = { x: 0, vx: 2 };` Why is `fake instanceof Particle` false, even though it looks like a particle?',
    a: '`instanceof` follows the object’s hidden link to where its methods come from, not its properties, and `fake` is a plain object, linked to `Object.prototype` rather than `Particle.prototype`.',
  },
};

export const examples = {
  'particles-methods': {
    title: 'Particles that move themselves',
    code: `class Particle {
  constructor(x, vx) {
    this.x = x;
    this.vx = vx;
  }
  move() {
    this.x = this.x + this.vx;
  }
}

const ps = [
  new Particle(0, 2),
  new Particle(10, -1),
];
for (let i = 0; i < ps.length; i++) {
  ps[i].move();
}
console.log(ps);
console.log(ps[0] instanceof Particle);
console.log(ps[0].move === ps[1].move);`,
  },
};

export const exercises = {
  vec: {
    title: 'A 2D vector class',
    prompt: 'Write a class `Vec`. `new Vec(x, y)` stores `x` and `y`. The method `add(o)` returns a **new** `Vec` that is the sum of this vector and the vector `o`, without changing either. The method `len()` returns the length, `Math.sqrt(x * x + y * y)` (`Math.sqrt` is the square root).',
    starter: `class Vec {
  constructor(x, y) {
    // your code here
  }
}

const v = new Vec(3, 4);
console.log(v);`,
    solution: `class Vec {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  add(o) {
    return new Vec(
      this.x + o.x,
      this.y + o.y,
    );
  }
  len() {
    const x = this.x;
    const y = this.y;
    return Math.sqrt(x * x + y * y);
  }
}`,
    tests: `test('stores x and y', () => {
  const v = new Vec(3, 4);
  expect(v.x).toBe(3);
  expect(v.y).toBe(4);
});
test('len of (3, 4) is 5', () => {
  expect(new Vec(3, 4).len()).toBe(5);
});
test('add returns a new Vec', () => {
  const s = new Vec(1, 2).add(new Vec(10, 20));
  expect(s instanceof Vec).toBe(true);
  expect(s.x).toBe(11);
  expect(s.y).toBe(22);
});
test('add changes neither vector', () => {
  const a = new Vec(1, 2);
  const b = new Vec(3, 4);
  a.add(b);
  expect(a.x).toBe(1);
  expect(b.x).toBe(3);
});`,
    hints: [
      'Start with the constructor: store the two arguments on the new object.',
      'Methods go inside the class body, after the constructor: `add(o) { ... }` and `len() { ... }`.',
      'Inside a method, this vector’s numbers are `this.x` and `this.y`; the other vector’s are `o.x` and `o.y`.',
      '`add` must *return* `new Vec(this.x + o.x, this.y + o.y)`, not change `this`.',
    ],
    walkthrough: `**How to think about it.** There are three pieces, and each uses \`this\` a little differently, so take them one at a time. In the constructor, \`this\` is the vector being built. In \`a.add(b)\`, \`this\` is \`a\` (the object before the dot) and the parameter \`o\` is \`b\`. In \`v.len()\`, \`this\` is \`v\`. Once you know what \`this\` is in each case, each body is one line of arithmetic.

**The solution, line by line.**

- \`class Vec {\` starts the class.
- \`  constructor(x, y) {\` runs for every \`new Vec(...)\`.
- \`    this.x = x;\` and \`    this.y = y;\` store the two numbers on the new vector, so every Vec has the same two properties in the same order.
- \`  }\` ends the constructor.
- \`  add(o) {\` is a method with one parameter, the other vector.
- \`    return new Vec(\` builds a brand-new vector for the answer. Calling \`new Vec\` inside the class's own method is completely normal, and it means the result is a real Vec, with \`add\` and \`len\` of its own.
- \`      this.x + o.x,\` is the new x: this vector's x plus the other's.
- \`      this.y + o.y,\` is the new y. (A comma after the last argument is allowed.)
- \`    );\` closes the call, and \`  }\` the method.
- \`  len() {\` takes no parameter: everything it needs is on \`this\`.
- \`    const x = this.x;\` and \`    const y = this.y;\` copy the two numbers into short local names, only to keep the formula readable.
- \`    return Math.sqrt(x * x + y * y);\` is Pythagoras: for \`(3, 4)\` that is the square root of \`9 + 16\`, which is \`5\`.
- \`  }\` and \`}\` close the method and the class.

Why return a new Vec rather than changing \`this\`? Because \`a\` might be shared with other code (*References*), and someone holding it would be surprised to see it move. Small value-like objects that never change are easy to reason about, and, as Part V shows, easy for an optimiser to store however it likes.

**Common wrong attempts.**

- An \`add\` that does \`this.x = this.x + o.x;\` and returns \`this\` gets the right sums, but it changes \`a\`, so the last test fails.
- Writing \`x * x\` in \`len\` without first making local \`x\` and \`y\` (and without \`this.\`) is a ReferenceError: inside a method, properties are only reachable through \`this\`.
- Returning a plain object \`{ x: ..., y: ... }\` from \`add\` gives the right numbers, but the result is not a Vec, so it has no \`len\` and \`instanceof Vec\` is false.`,
    wrong: [
      {
        code: `class Vec {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  add(o) {
    this.x = this.x + o.x;
    this.y = this.y + o.y;
    return this;
  }
  len() {
    const x = this.x;
    const y = this.y;
    return Math.sqrt(x * x + y * y);
  }
}`,
        why: 'This `add` changes `a` itself and returns it. The sums are right, but the test “add changes neither vector” fails. Return `new Vec(...)` instead.',
      },
      {
        code: `class Vec {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  add(o) {
    return {
      x: this.x + o.x,
      y: this.y + o.y,
    };
  }
  len() {
    return Math.sqrt(x * x + y * y);
  }
}`,
        why: 'Two bugs. `add` returns a plain object, so it is not a Vec and has no `len`. And `len` uses `x` and `y` with no `this.`, which are not variables in scope: a ReferenceError.',
      },
    ],
  },
  stack: {
    optional: true,
    title: 'A stack class',
    prompt: 'Write a class `Stack`. `push(v)` puts a value on top. `pop()` removes the top value and returns it (or `undefined` if the stack is empty). `peek()` returns the top value without removing it. `size()` returns how many values it holds. Arrays have a `pop()` method that removes and returns the last slot, which will help. Part IV’s virtual machine is built around exactly this.',
    starter: `class Stack {
  // your code here
}

const s = new Stack();
s.push(1);
s.push(2);
console.log(s.pop());`,
    solution: `class Stack {
  constructor() {
    this.items = [];
  }
  push(v) {
    this.items.push(v);
  }
  pop() {
    return this.items.pop();
  }
  peek() {
    const n = this.items.length;
    return this.items[n - 1];
  }
  size() {
    return this.items.length;
  }
}`,
    tests: `test('last in, first out', () => {
  const s = new Stack();
  s.push(1);
  s.push(2);
  expect(s.peek()).toBe(2);
  expect(s.size()).toBe(2);
  expect(s.pop()).toBe(2);
  expect(s.pop()).toBe(1);
  expect(s.size()).toBe(0);
});
test('empty stack', () => {
  const s = new Stack();
  expect(s.pop()).toBe(undefined);
  expect(s.peek()).toBe(undefined);
});
test('two stacks are separate', () => {
  const a = new Stack();
  const b = new Stack();
  a.push(5);
  expect(b.size()).toBe(0);
});`,
    hints: [
      'A stack is a pile of plates: you only touch the top. What should hold the values?',
      'Each stack needs its own array. Make it in the constructor: `this.items = [];`.',
      'Let the top of the stack be the end of the array; then `push` and `pop` map straight onto the array’s own `push` and `pop`.',
      'The top value is at index `this.items.length - 1`.',
    ],
    walkthrough: `**How to think about it.** A stack is a pile of plates: you add to the top and take from the top, and the last plate put on is the first taken off. An array can already do that at its end (\`push\` adds a last slot, \`pop\` removes it), so the class only needs to keep one array per stack and offer the four operations on it.

**The solution, line by line.**

- \`class Stack {\` starts the class.
- \`  constructor() {\` takes no arguments: every stack starts empty.
- \`    this.items = [];\` gives each new stack its own empty array. Because this line runs once per \`new\`, two stacks never share an array.
- \`  push(v) {\` and \`    this.items.push(v);\` put \`v\` on top, which is the end of the array.
- \`  pop() {\` and \`    return this.items.pop();\` take the top value off and hand it back. On an empty array, \`pop\` returns \`undefined\`, which is what the test wants.
- \`  peek() {\` looks without taking: \`    const n = this.items.length;\` counts the values, and \`    return this.items[n - 1];\` reads the last one. On an empty stack that is index \`-1\`, which is not a slot, so it reads \`undefined\`: the right answer for free.
- \`  size() {\` and \`    return this.items.length;\` report how many values there are.

The class wraps an array and allows only the operations a stack should have. That is a common reason to write a class: not new storage, but a smaller, safer set of things you can do with it.

**Common wrong attempts.**

- Keeping one \`items\` array *outside* the class means every Stack shares it, so pushing onto \`a\` makes \`b\` grow too.
- Reading \`this.items[0]\` reads the *bottom* of the pile, and never removing anything means \`pop\` keeps returning the same value.`,
    wrong: [
      {
        code: `const items = [];
class Stack {
  push(v) {
    items.push(v);
  }
  pop() {
    return items.pop();
  }
  peek() {
    return items[items.length - 1];
  }
  size() {
    return items.length;
  }
}`,
        why: 'Every Stack shares the one `items` array outside the class, so pushing onto `a` makes `b` grow too. Make the array in the constructor with `this.items = [];`.',
      },
      {
        code: `class Stack {
  constructor() {
    this.items = [];
  }
  push(v) {
    this.items.push(v);
  }
  pop() {
    return this.items[0];
  }
  peek() {
    return this.items[0];
  }
  size() {
    return this.items.length;
  }
}`,
        why: 'This reads the *bottom* of the stack (index 0) and never removes anything. A stack hands back the most recently pushed value first.',
      },
    ],
  },
};

export const quiz = [
  {
    q: `What does this print?
\`\`\`
const p = new Particle(0, 1);
const q = new Particle(0, 5);
q.move();
console.log(p.x, q.x);
\`\`\``,
    options: [
      {
        t: '`1 5`',
        why: 'Only `q.move()` was called, so `p` did not move.',
      },
      {
        t: '`0 5`',
        correct: true,
        why: 'In `q.move()`, `this` is `q`, so only `q.x` changes: 0 + 5.',
      },
      {
        t: '`5 5`',
        why: '`p` and `q` are separate instances; moving `q` does not touch `p`.',
      },
      {
        t: '`0 0`',
        why: '`q.move()` adds `q.vx` to `q.x`.',
      },
    ],
  },
  {
    q: '`p` is a `Particle`, and its class method `move` adds `this.vx` to `this.x`. `const m = p.move; m();` What happens?',
    options: [
      {
        t: '`p` moves as usual',
        why: '`m` is only the function. Called without a dot, it has no object to work on.',
      },
      {
        t: 'Every particle moves',
        why: 'A method never acts on all instances at once.',
      },
      {
        t: 'Nothing: `m()` is ignored',
        why: 'The function does run, and fails on its first use of `this`.',
      },
      {
        t: 'A TypeError, because `this` is `undefined` inside `move`',
        correct: true,
        why: 'With no object before the dot, `this` is `undefined` in class code, and reading `this.x` fails.',
      },
    ],
  },
  {
    q: 'Where does the `move` method of 1000 Particle instances live?',
    options: [
      {
        t: 'Once, on the class’s prototype, shared by all of them',
        correct: true,
        why: 'Methods in a class body are stored once, on `Particle.prototype`. Each call works on a different object through `this`.',
      },
      {
        t: 'A copy inside each instance',
        why: 'Instances hold their own properties (`x`, `vx`), not copies of the methods.',
      },
      {
        t: 'Only in the first instance',
        why: 'All instances share it equally.',
      },
      {
        t: 'Nowhere until it is called',
        why: 'It exists from the moment the class is defined.',
      },
    ],
  },
  {
    q: '`const o = { x: 0, vx: 2 };` What is `o instanceof Particle`?',
    options: [
      {
        t: '`true`, because it has the same properties',
        why: '`instanceof` does not compare properties.',
      },
      {
        t: 'An error, because `o` is not a class',
        why: 'Any object can be tested; the answer is `false`.',
      },
      {
        t: '`undefined`',
        why: '`instanceof` always gives `true` or `false`.',
      },
      {
        t: '`false`',
        correct: true,
        why: '`o` is a plain object, so `Particle.prototype` is not on its chain of prototypes.',
      },
    ],
  },
  {
    q: 'In Python, `f = c.inc` followed by `f()` works. Why does the same thing fail in JavaScript class code?',
    options: [
      {
        t: 'JavaScript methods cannot be stored in variables',
        why: 'They can: `const f = c.inc` is fine. The trouble comes when `f` is called.',
      },
      {
        t: 'In JavaScript `this` comes from the call, and `f()` has no object before a dot',
        correct: true,
        why: 'Python’s `c.inc` remembers `c`; a JavaScript method does not, so `this` is `undefined`.',
      },
      {
        t: 'JavaScript has no `this` outside constructors',
        why: 'Methods use `this` all the time; it is set by each call.',
      },
      {
        t: 'Python checks types and JavaScript does not',
        why: 'That is not what makes the difference here.',
      },
    ],
  },
];
