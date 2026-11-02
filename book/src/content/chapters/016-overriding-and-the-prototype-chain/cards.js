// Chapter 16 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'override-what': {
    q: 'What does it mean for a subclass to override a method?',
    a: 'It defines a method with the same name as one it inherited, and its own version is used for its instances.',
  },
  'override-which': {
    q: '`Node` and `Num` both define `show()`; `Num` does not define `where()`. For a Num `n`, which versions do `n.show()` and `n.where()` run?',
    a: '`Num`’s `show` (the nearer one wins) and `Node`’s `where` (the only one there is).',
  },
  'super-method': {
    q: 'Inside a method of `Call extends Node`, what does `super.where()` run, and what is `this` inside it?',
    a: '`Node`’s `where`, with `this` still the same `Call` object.',
  },
  'proto-what': {
    q: 'For `n = new Num(3, 42)`, where `Num extends Node`, what are the links of `n`’s prototype chain, in order?',
    a: '`Num.prototype`, then `Node.prototype`, then `Object.prototype`, then `null`.',
  },
  'own-property': {
    q: 'Why is `Object.hasOwn(n, \'where\')` false even though `n.where()` works?',
    a: '`where` is not stored on `n` itself; it is stored once on `Node.prototype` and found by walking the chain.',
  },
  'chain-end': {
    q: 'What does reading a property give when no link of the chain has it, and how does JavaScript know to stop?',
    a: '`undefined`. The chain ends with a link that is `null`, so the search stops there.',
  },
  shadow: {
    q: 'After `n.where = () => \'here\'`, what do `n.where()` and another Num’s `m.where()` give?',
    a: '`\'here\'` and Node’s usual answer: the own property on `n` shadows the inherited `where` for `n` only.',
  },
  'instanceof-chain': {
    q: 'What does `n instanceof Node` actually check?',
    a: 'Whether `Node.prototype` is one of the links in `n`’s prototype chain.',
  },
};

export const examples = {
  'show-nodes': {
    title: 'Pieces that show themselves',
    code: `class Node {
  constructor(line) {
    this.line = line;
  }
  show() {
    return '?';
  }
}
class Num extends Node {
  constructor(line, value) {
    super(line);
    this.value = value;
  }
  show() {
    return String(this.value);
  }
}
class Name extends Node {
  constructor(line, text) {
    super(line);
    this.text = text;
  }
  show() {
    return this.text;
  }
}
const ps = [
  new Num(1, 42),
  new Name(2, 'x'),
  new Node(3),
];
for (let i = 0; i < ps.length; i++) {
  console.log(ps[i].show());
}
const P = Object.getPrototypeOf;
console.log(P(ps[0]) === Num.prototype);
const p0 = ps[0];
console.log(Object.hasOwn(p0, 'line'));
console.log(Object.hasOwn(p0, 'show'));`,
  },
};

export const exercises = {
  add: {
    title: 'An Add node',
    prompt: 'The classes `Node` and `Num` from the chapter (with `show`) are already written above your code. Write `class Add extends Node`: `new Add(line, left, right)` stores the line (through `super`) and the two smaller pieces `left` and `right`, which are themselves nodes. Override `show()` so that it returns `\'(\'`, the left piece shown, `\' + \'`, the right piece shown, and `\')\'`; so `new Add(1, new Num(1, 2), new Num(1, 3)).show()` is `\'(2 + 3)\'`.',
    starter: `class Node {
  constructor(line) {
    this.line = line;
  }
  where() {
    return 'line ' + this.line;
  }
  show() {
    return '?';
  }
}
class Num extends Node {
  constructor(line, value) {
    super(line);
    this.value = value;
  }
  show() {
    return String(this.value);
  }
}

class Add extends Node {
  // your code here
}

const a = new Add(
  1,
  new Num(1, 2),
  new Num(1, 3),
);
console.log(a.show());`,
    solution: `class Node {
  constructor(line) {
    this.line = line;
  }
  where() {
    return 'line ' + this.line;
  }
  show() {
    return '?';
  }
}
class Num extends Node {
  constructor(line, value) {
    super(line);
    this.value = value;
  }
  show() {
    return String(this.value);
  }
}

class Add extends Node {
  constructor(line, left, right) {
    super(line);
    this.left = left;
    this.right = right;
  }
  show() {
    const l = this.left.show();
    const r = this.right.show();
    return '(' + l + ' + ' + r + ')';
  }
}`,
    tests: `const two = new Num(1, 2);
const three = new Num(1, 3);
test('stores line, left and right', () => {
  const a = new Add(4, two, three);
  expect(a.line).toBe(4);
  expect(a.left).toBe(two);
  expect(a.right).toBe(three);
});
test('shows a simple sum', () => {
  const a = new Add(1, two, three);
  expect(a.show()).toBe('(2 + 3)');
});
test('shows a sum inside a sum', () => {
  const inner = new Add(1, two, three);
  const a = new Add(1, inner, new Num(1, 4));
  expect(a.show()).toBe('((2 + 3) + 4)');
});
test('inherits where from Node', () => {
  const a = new Add(7, two, three);
  expect(a.where()).toBe('line 7');
  expect(a instanceof Node).toBe(true);
});`,
    hints: [
      'Two pieces are needed: a constructor and a `show` method. Start with the constructor, and look at how `Num`’s constructor is written.',
      'The constructor takes `(line, left, right)`. Its first line hands `line` to the parent: `super(line);`. Then store the other two with `this.left = left;` and `this.right = right;`.',
      '`show()` must ask each piece to show itself: `this.left.show()` and `this.right.show()`. Each of those is a Num’s `show` or, for a sum inside a sum, an Add’s.',
      'Join the parts: `return \'(\' + l + \' + \' + r + \')\';`, where `l` and `r` are the two shown pieces.',
    ],
    walkthrough: `**How to think about it.** An Add is a kind of Node: it has a line like every other piece, and it should answer \`where()\` the same way, so it \`extends Node\` and lets Node do that part. What is new is that an Add holds two smaller pieces, and that it shows itself differently, so it needs its own constructor (to store the pieces) and its own \`show\` (an override). The trick in \`show\` is not to work out how to show a number yourself: each piece already knows how to show itself, so ask it.

**The solution, line by line.**

- \`class Add extends Node {\` makes Add a subclass of Node, so every Add gets \`where\` and \`show\` from Node to begin with.
- \`  constructor(line, left, right) {\` takes the line and the two pieces.
- \`    super(line);\` runs Node's constructor on the new object, which stores \`this.line\`. It must come before any use of \`this\`.
- \`    this.left = left;\` and \`    this.right = right;\` store the two pieces on the object, after \`super\` has made it.
- \`  }\` ends the constructor.
- \`  show() {\` overrides Node's \`show\`: for an Add, this one is found first, so Node's \`'?'\` is never used.
- \`    const l = this.left.show();\` asks the left piece to show itself. If it is a Num, Num's \`show\` runs and gives \`'2'\`; if it is another Add, this very method runs again on that Add, which is how the nested test gives \`'((2 + 3) + 4)'\`.
- \`    const r = this.right.show();\` does the same for the right piece.
- \`    return '(' + l + ' + ' + r + ')';\` glues the parts together with brackets and a plus sign between them.
- \`  }\` and \`}\` close the method and the class.

\`where\` is not written at all, yet \`new Add(7, two, three).where()\` gives \`'line 7'\`: Add inherits it from Node, and it reads the \`line\` that Node's constructor stored.

**Common wrong attempts.**

- Leaving out \`super(line);\` (or putting it after \`this.left = left;\`) stops at \`new Add(...)\` with *ReferenceError: Must call super constructor in derived class before accessing 'this' or returning from derived constructor*.
- \`return '(' + this.left + ' + ' + this.right + ')'\` joins the objects themselves to strings, and an object turned into a string reads \`[object Object]\`, so you get \`'([object Object] + [object Object])'\`.
- Using \`this.left.value\` works for numbers but gives \`undefined\` for a sum inside a sum, because an Add has no \`value\`. Asking the piece to \`show()\` itself works for every kind.`,
    wrong: [
      {
        code: `class Node {
  constructor(line) {
    this.line = line;
  }
  where() {
    return 'line ' + this.line;
  }
  show() {
    return '?';
  }
}
class Num extends Node {
  constructor(line, value) {
    super(line);
    this.value = value;
  }
  show() {
    return String(this.value);
  }
}

class Add extends Node {
  constructor(line, left, right) {
    this.left = left;
    this.right = right;
  }
  show() {
    const l = this.left.show();
    const r = this.right.show();
    return '(' + l + ' + ' + r + ')';
  }
}`,
        why: 'No `super(line)`, so `this` is used before the parent has built the object: a ReferenceError at `new Add(...)`.',
      },
      {
        code: `class Node {
  constructor(line) {
    this.line = line;
  }
  where() {
    return 'line ' + this.line;
  }
  show() {
    return '?';
  }
}
class Num extends Node {
  constructor(line, value) {
    super(line);
    this.value = value;
  }
  show() {
    return String(this.value);
  }
}

class Add extends Node {
  constructor(line, left, right) {
    super(line);
    this.left = left;
    this.right = right;
  }
  show() {
    const l = this.left.value;
    const r = this.right.value;
    return '(' + l + ' + ' + r + ')';
  }
}`,
        why: 'Fine for two numbers, but an Add inside an Add has no `value`, so the nested test gives `\'(undefined + 4)\'`. Ask each piece to `show()` itself.',
      },
    ],
  },
  findOwner: {
    optional: true,
    title: 'Who owns this property?',
    prompt: 'Write `findOwner(o, key)` that walks `o`’s prototype chain and returns the **first object on it that has `key` as an own property**: `o` itself, or one of its prototypes. If no link has it, return `null`. Use `Object.hasOwn(x, key)` to test one link and `Object.getPrototypeOf(x)` to move to the next. The classes `Node` and `Num` are written above your code.',
    starter: `class Node {
  constructor(line) {
    this.line = line;
  }
  where() {
    return 'line ' + this.line;
  }
  show() {
    return '?';
  }
}
class Num extends Node {
  constructor(line, value) {
    super(line);
    this.value = value;
  }
  show() {
    return String(this.value);
  }
}

function findOwner(o, key) {
  // your code here
}

const n = new Num(3, 42);
console.log(findOwner(n, 'where'));`,
    solution: `class Node {
  constructor(line) {
    this.line = line;
  }
  where() {
    return 'line ' + this.line;
  }
  show() {
    return '?';
  }
}
class Num extends Node {
  constructor(line, value) {
    super(line);
    this.value = value;
  }
  show() {
    return String(this.value);
  }
}

function findOwner(o, key) {
  let x = o;
  while (x !== null) {
    if (Object.hasOwn(x, key)) {
      return x;
    }
    x = Object.getPrototypeOf(x);
  }
  return null;
}`,
    tests: `const n = new Num(3, 42);
test('an own property', () => {
  expect(findOwner(n, 'value')).toBe(n);
});
test('an overriding method', () => {
  expect(findOwner(n, 'show')).toBe(Num.prototype);
});
test('an inherited method', () => {
  expect(findOwner(n, 'where')).toBe(Node.prototype);
});
test('from Object.prototype', () => {
  expect(findOwner(n, 'toString')).toBe(Object.prototype);
});
test('nowhere on the chain', () => {
  expect(findOwner(n, 'colour')).toBe(null);
});`,
    hints: [
      'This is the lookup rule from the Formal box, written as a loop. Keep a variable for the link you are looking at, starting with `o`.',
      'Loop while that link is not `null`. Inside, if `Object.hasOwn(x, key)` is true, you have found the owner.',
      'Otherwise move up one link: `x = Object.getPrototypeOf(x);`. After the loop, nothing had it: `return null;`.',
    ],
    walkthrough: `**How to think about it.** The step-through diagram did this by eye: look at \`n\`, then its prototype, then that one's, until a link has the key or the links run out. A \`while\` loop fits, because you do not know in advance how many links there are; you only know the chain ends at \`null\`.

**The solution, line by line.**

- \`function findOwner(o, key) {\` takes the object and the name to look for.
- \`  let x = o;\` is the link being looked at, starting with the object itself (its own properties come first).
- \`  while (x !== null) {\` keeps going until the chain runs out.
- \`    if (Object.hasOwn(x, key)) {\` asks whether this link holds \`key\` itself, not through its own prototypes.
- \`      return x;\` hands back the owner, and stops: the first match wins, which is exactly why an override hides the parent's method.
- \`    x = Object.getPrototypeOf(x);\` moves one link up. After \`Object.prototype\`, this gives \`null\`, and the loop ends.
- \`  return null;\` runs only if no link had the key.

For \`findOwner(n, 'show')\` the loop checks \`n\` (no), then \`Num.prototype\` (yes), and returns it, never reaching Node's \`show\`.

**Common wrong attempts.**

- Using \`x[key] !== undefined\` as the test finds the key on the very first link every time, because reading \`x[key]\` itself walks the whole chain; so it always returns \`o\`.
- Forgetting the \`x = Object.getPrototypeOf(x);\` line loops for ever on the first link.`,
    wrong: [
      {
        code: `class Node {
  constructor(line) {
    this.line = line;
  }
  where() {
    return 'line ' + this.line;
  }
  show() {
    return '?';
  }
}
class Num extends Node {
  constructor(line, value) {
    super(line);
    this.value = value;
  }
  show() {
    return String(this.value);
  }
}

function findOwner(o, key) {
  let x = o;
  while (x !== null) {
    if (x[key] !== undefined) {
      return x;
    }
    x = Object.getPrototypeOf(x);
  }
  return null;
}`,
        why: 'Reading `x[key]` already walks the whole chain, so the test is true on the first link and `o` is always returned. Test with `Object.hasOwn(x, key)`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: '`Num extends Node`, and both define `show()`. For `n = new Num(3, 42)`, which `show` does `n.show()` run?',
    options: [
      {
        t: 'Both, Node’s first',
        why: 'Only one method runs. Node’s runs too only if Num’s calls `super.show()` itself.',
      },
      {
        t: 'Node’s, because Node was written first',
        why: 'The order the classes were written in does not decide it; the nearer link of the chain does.',
      },
      {
        t: 'Num’s: the subclass’s version overrides the inherited one',
        correct: true,
        why: 'The search reaches `Num.prototype` first, finds `show`, and stops there.',
      },
      {
        t: 'It is an error to define the same method twice',
        why: 'Defining it again in a subclass is allowed, and is exactly what overriding is.',
      },
    ],
  },
  {
    q: 'Inside `where()` of `class Call extends Node`, what does `super.where()` do?',
    options: [
      {
        t: 'Runs Node’s `where`, with `this` still the Call object',
        correct: true,
        why: 'It reaches the parent’s version, and that version works on the same object.',
      },
      {
        t: 'Runs Call’s own `where` again',
        why: 'That is what `this.where()` would do (for ever). `super` skips to the parent.',
      },
      {
        t: 'Makes a new Node and asks it',
        why: '`super.where()` makes no new object; it runs the parent’s method on this one.',
      },
      {
        t: 'Calls Node’s constructor',
        why: 'That is `super(...)` on its own, and only in a constructor; `super.where()` calls a method.',
      },
    ],
  },
  {
    q: 'Nobody wrote a `toString` method, yet `n.toString()` works. Why?',
    options: [
      {
        t: 'JavaScript adds a `toString` to every object when it is made',
        why: 'It is not copied into each object; `Object.hasOwn(n, \'toString\')` is false.',
      },
      {
        t: '`toString` is on `Object.prototype`, the last link of the chain, so the lookup finds it there',
        correct: true,
        why: 'Every ordinary chain ends with `Object.prototype` before `null`.',
      },
      {
        t: '`Node` defines it automatically',
        why: 'Node holds only the methods written in its class body.',
      },
    ],
  },
  {
    q: `What do the last two lines give?
\`\`\`
const a = new Num(1, 1);
const b = new Num(2, 2);
a.where = () => 'mine';
a.where();
b.where();
\`\`\``,
    options: [
      {
        t: '\'mine\' and \'mine\'',
        why: 'The new property is written on `a` only; `Node.prototype` is unchanged.',
      },
      {
        t: '\'line 1\' and \'line 2\'',
        why: '`a` now has an own `where`, which is found before the inherited one.',
      },
      {
        t: 'An error: methods cannot be replaced',
        why: 'Writing a property onto an object is always allowed here.',
      },
      {
        t: '\'mine\' and \'line 2\'',
        correct: true,
        why: '`a`’s own `where` shadows Node’s for `a` alone; `b` still finds Node’s.',
      },
    ],
  },
  {
    q: 'What does `Object.getPrototypeOf(Object.prototype)` give?',
    options: [
      {
        t: '`Object.prototype` itself',
        why: 'Then the chain would loop for ever; it ends instead.',
      },
      {
        t: '`null`: the end of the chain',
        correct: true,
        why: 'Object.prototype is the last real link, and its prototype is `null`, which is how a lookup knows to stop.',
      },
      {
        t: '`undefined`',
        why: 'The end of the chain is marked with `null`, not `undefined`.',
      },
      {
        t: 'A TypeError',
        why: 'Asking for any object’s prototype is fine.',
      },
    ],
  },
];
