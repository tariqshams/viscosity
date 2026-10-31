// Chapter 7 cards. Keys are stable ids: never rename them.

export const prompts = {
  'class-what': {
    q: 'What is a class?',
    a: 'A blueprint for making objects of the same kind: same properties, shared methods.',
  },
  'new-steps': {
    q: 'What three things does `new Particle(3, 1)` do?',
    a: 'Makes a fresh empty object, runs the constructor with `this` set to it, and returns it.',
  },
  'constructor-this': {
    q: 'Inside a constructor, what does `this` refer to?',
    a: 'The new object being built.',
  },
  'instances-separate': {
    q: '`const p = new Particle(1, 1); const q = new Particle(1, 1);` What is `p === q`?',
    a: '`false`. Every `new` makes a separate object, even with the same arguments.',
  },
  'this-what': {
    q: 'In the call `q.move()`, what is `this` inside `move`?',
    a: '`q`: the object before the dot.',
  },
  'this-when': {
    q: 'Lexical scope is decided by where a function is written. What decides what `this` means?',
    a: 'How the function is called: the object it was called on, in each call.',
  },
  'method-shared': {
    q: 'You make 1000 particles from a class with a `move` method. How many copies of `move` are there?',
    a: 'One. Methods are stored with the class and shared by every instance.',
  },
  'lost-this': {
    q: 'Why does `twice(p.move)` fail, and how do you fix it?',
    a: '`p.move` passes only the function, so it is later called with no object and `this` is `undefined`. Pass `() => p.move()` instead.',
  },
  'instanceof-what': {
    q: '`const fake = { x: 0, vx: 2 };` Why is `fake instanceof Particle` false, even though it looks like a particle?',
    a: '`instanceof` checks which class made the object, not what properties it has. `fake` wasn’t made by `new Particle`.',
  },
};

export const examples = {
  'particles-class': {
    title: 'A class of particles',
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
    prompt:
      'Write a class `Vec`. `new Vec(x, y)` stores `x` and `y`. The method `add(o)` returns a **new** `Vec` that is the sum of this vector and `o`, without changing either. The method `len()` returns the length, `Math.sqrt(x * x + y * y)`.',
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
      'In the constructor, store the arguments on the new object: `this.x = x;` and the same for `y`.',
      'Methods go inside the class body, after the constructor: `add(o) { ... }` and `len() { ... }`.',
      'Inside a method, this vector’s numbers are `this.x` and `this.y`. The other vector’s are `o.x` and `o.y`.',
      '`add` must *return* `new Vec(...)` built from the sums, not change `this`.',
    ],
    walkthrough: `Three pieces, each using \`this\` a little differently.

- **Constructor.** \`this\` is the brand-new vector, so \`this.x = x; this.y = y;\` gives every Vec the same two properties, in the same order.
- **\`add(o)\`.** Called as \`a.add(b)\`, \`this\` is \`a\` and \`o\` is \`b\`. We build the answer with \`new Vec(this.x + o.x, this.y + o.y)\`. Using \`new\` inside the class's own method is completely normal, and it means the result is a real Vec, with \`add\` and \`len\` of its own.
- **\`len()\`.** Pythagoras on \`this.x\` and \`this.y\`. Copying them into local \`x\` and \`y\` first just keeps the formula short.

Why return a new Vec instead of changing \`this\`? Because \`a\` might be aliased elsewhere (chapter 4), and someone holding it would be surprised to see it move. Small value-like objects that never change are easy to reason about, and as you'll see in Part VII, they are also easy for an optimizer to store however it likes.`,
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
        why: 'Two bugs. `add` returns a plain object, so it isn’t a Vec and has no `len`. And `len` uses `x` and `y` with no `this.`, which are not variables in scope: a ReferenceError.',
      },
    ],
  },
  stack: {
    optional: true,
    title: 'A stack class',
    prompt:
      'Write a class `Stack`. `push(v)` puts a value on top. `pop()` removes the top value and returns it (or `undefined` if the stack is empty). `peek()` returns the top value without removing it. `size()` returns how many values it holds. Arrays have a `pop()` method that removes and returns the last slot, which will help. Part IV’s virtual machine is built around exactly this.',
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
      'Each stack needs its own array to hold the values. Make it in the constructor: `this.items = [];`.',
      'The top of the stack is the end of the array, so `push` and `pop` map straight onto the array’s own `push` and `pop`.',
      'The top value is at index `length - 1`.',
    ],
    walkthrough: `A stack is a pile of plates: you only touch the top one.

- **One array per stack.** \`this.items = [];\` in the constructor runs once per \`new\`, so every Stack gets its own array.
- **Top = end of the array.** Then \`push\` and \`pop\` are the array's own methods, and both are quick because nothing else has to shift.
- **\`peek\`** reads index \`length - 1\`. On an empty stack that is index \`-1\`, which isn't a slot, so it reads \`undefined\`: the right answer for free.
- **\`size\`** is just the array's length.

The class wraps an array and allows only the operations a stack should have. That's a common reason to write a class: not new storage, but a smaller, safer set of things you can do with it. Part IV's virtual machine keeps its working values on a stack just like this one.`,
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
    q: 'What is the **first** thing `new Particle(3, 1)` does?',
    options: [
      { t: 'Runs `move`', why: 'Methods only run when you call them. `new` runs the constructor.' },
      { t: 'Creates a fresh empty object', correct: true, why: 'Then it runs the constructor with `this` set to that object, and returns it.' },
      { t: 'Copies an existing particle', why: '`new` always starts from a brand-new object.' },
      { t: 'Checks `instanceof`', why: '`instanceof` is a separate operator you use later, if you want to.' },
    ],
  },
  {
    q: `What does this print?
\`\`\`
const p = new Particle(0, 1);
const q = new Particle(0, 5);
q.move();
console.log(p.x, q.x);
\`\`\``,
    options: [
      { t: '`1 5`', why: 'Only `q.move()` was called, so `p` didn’t move.' },
      { t: '`5 5`', why: '`p` and `q` are separate instances. Moving `q` doesn’t touch `p`.' },
      { t: '`0 0`', why: '`q.move()` adds `q.vx` to `q.x`.' },
      { t: '`0 5`', correct: true, why: 'In `q.move()`, `this` is `q`, so only `q.x` changes: 0 + 5.' },
    ],
  },
  {
    q: '`const m = p.move; m();` What happens?',
    options: [
      { t: '`p` moves as usual', why: '`m` is just the function. Called without a dot, it has no object to work on.' },
      { t: 'A TypeError, because `this` is `undefined` inside `move`', correct: true, why: 'With no object before the dot, `this` is `undefined` in class code, and reading `this.x` fails.' },
      { t: 'Every particle moves', why: 'A method never acts on all instances at once.' },
      { t: 'Nothing: `m()` is ignored', why: 'The function does run, and fails on its first use of `this`.' },
    ],
  },
  {
    q: '`const o = { x: 0, vx: 2 };` What is `o instanceof Particle`?',
    options: [
      { t: '`true`, because it has the same properties', why: '`instanceof` doesn’t compare properties.' },
      { t: 'An error, because `o` isn’t a class', why: 'Any object can be tested; the answer is simply `false`.' },
      { t: '`false`', correct: true, why: '`o` wasn’t made by `new Particle`, so it isn’t a Particle instance.' },
      { t: '`undefined`', why: '`instanceof` always gives `true` or `false`.' },
    ],
  },
  {
    q: 'Where does the `move` method of 1000 Particle instances live?',
    options: [
      { t: 'Once, with the class, shared by all of them', correct: true, why: 'Methods in a class body are stored once. Each call works on a different object through `this`.' },
      { t: 'A copy inside each instance', why: 'Instances hold their own properties (`x`, `vx`), not copies of the methods.' },
      { t: 'Only in the first instance', why: 'All instances share it equally.' },
      { t: 'Nowhere until it is called', why: 'It exists from the moment the class is defined.' },
    ],
  },
  {
    q: 'Why do classes help engines like V8 run property access fast?',
    options: [
      { t: 'Classes are compiled before the page loads', why: 'Classes run like any other JavaScript; that isn’t the reason.' },
      { t: 'Class instances can’t have new properties added', why: 'They can: `p.color = \'red\'` works. That is why it is a hint, not a guarantee.' },
      { t: 'Classes store numbers as typed arrays', why: 'Instances are ordinary objects.' },
      { t: 'One constructor adds the same properties in the same order, so instances tend to share one shape', correct: true, why: 'Objects with the same shape let the engine know where each property sits without searching.' },
    ],
  },
];
