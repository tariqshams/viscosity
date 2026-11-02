// Chapter 15 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'extends-what': {
    q: 'What does `class Num extends Node` give `Num`?',
    a: 'Everything `Node` has: its constructor’s setup (through `super`) and all its methods. `Num` adds what it needs on top.',
  },
  'super-call-what': {
    q: 'Inside a subclass constructor, what does `super(line)` do?',
    a: 'It runs the parent class’s constructor, passing it `line`; that constructor makes the object and sets up the parent’s part, and from then on `this` refers to it.',
  },
  'super-first': {
    q: 'What happens if a subclass constructor uses `this` before calling `super(...)`?',
    a: 'A ReferenceError: the parent has not made the object yet, so there is nothing for `this` to mean.',
  },
  'default-constructor': {
    q: 'A subclass has no constructor at all. What happens to the arguments of `new Sub(a, b)`?',
    a: 'They are all passed on to the parent’s constructor, as if the subclass had `constructor(...args) { super(...args); }`.',
  },
  'instanceof-parent': {
    q: '`Num extends Node`, and `n = new Num(3, 42)`. What are `n instanceof Num` and `n instanceof Node`?',
    a: 'Both `true`: a Num is a kind of Node.',
  },
  'subclass-adds': {
    q: '`Name extends Node` adds a method `isLong`. Can a plain `new Node(1)` use `isLong`?',
    a: 'No: inheritance goes from parent to child only, so `new Node(1).isLong` is `undefined`.',
  },
  'why-not-copy': {
    q: 'Why is `extends` better than pasting the same `where` method into every class?',
    a: 'The shared code is written once, so a change to it reaches every subclass, and no copy can be missed.',
  },
  'error-super': {
    q: 'Why does a constructor in `class RuntimeError extends Error` call `super(message)`?',
    a: 'A subclass constructor must call `super(...)` before it can use `this` (or finish), and passing `message` lets Error’s own constructor store it as the error’s `message`.',
  },
};

export const examples = {
  'node-classes': {
    title: 'Three kinds of program piece',
    code: `class Node {
  constructor(line) {
    this.line = line;
  }
  where() {
    return 'line ' + this.line;
  }
}
class Num extends Node {
  constructor(line, value) {
    super(line);
    this.value = value;
  }
}
class Name extends Node {
  constructor(line, text) {
    super(line);
    this.text = text;
  }
}
const ps = [
  new Num(1, 42),
  new Name(2, 'x'),
  new Node(3),
];
for (let i = 0; i < ps.length; i++) {
  console.log(ps[i].where(), ps[i]);
}
console.log(ps[0] instanceof Node);
console.log(ps[2] instanceof Num);`,
  },
};

export const exercises = {
  str: {
    title: 'A string piece',
    prompt: 'The class `Node` from the chapter is already written above your code. Write `class Str extends Node`, for a piece of text in quotes in a program: `new Str(line, text)` stores the line **through `super`** and stores `text` itself. Give Str one method of its own, `quoted()`, which returns the text with a double quote mark on each side; so `new Str(4, \'hi\').quoted()` is `\'"hi"\'` and `new Str(4, \'hi\').where()` is `\'line 4\'`.',
    starter: `class Node {
  constructor(line) {
    this.line = line;
  }
  where() {
    return 'line ' + this.line;
  }
}

class Str extends Node {
  // your code here
}

const s = new Str(4, 'hi');
console.log(s.where(), s.quoted());`,
    solution: `class Node {
  constructor(line) {
    this.line = line;
  }
  where() {
    return 'line ' + this.line;
  }
}

class Str extends Node {
  constructor(line, text) {
    super(line);
    this.text = text;
  }
  quoted() {
    return '"' + this.text + '"';
  }
}`,
    tests: `test('stores line and text', () => {
  const s = new Str(4, 'hi');
  expect(s.line).toBe(4);
  expect(s.text).toBe('hi');
});
test('inherits where from Node', () => {
  expect(new Str(7, 'a').where()).toBe('line 7');
});
test('quoted adds the quote marks', () => {
  expect(new Str(1, 'hi').quoted()).toBe('"hi"');
  expect(new Str(1, '').quoted()).toBe('""');
});
test('is a Str and a Node', () => {
  const s = new Str(1, 'x');
  expect(s instanceof Str).toBe(true);
  expect(s instanceof Node).toBe(true);
});
test('Node itself is unchanged', () => {
  expect(new Node(2).quoted).toBe(undefined);
});`,
    hints: [
      'Two things are needed inside the class: a constructor and a method `quoted`. Look at how `Num` is written in the chapter.',
      'The constructor takes `(line, text)`. Its first line hands `line` to the parent: `super(line);`.',
      'After `super(line);`, store the text with `this.text = text;`. Do not store `this.line` yourself: Node’s constructor already did.',
      '`quoted()` returns `\'"\' + this.text + \'"\'`: a string holding one double quote, then the text, then another.',
    ],
    walkthrough: `**How to think about it.** A Str is a kind of Node: it has a line like every other piece, and it should answer \`where()\` exactly as a Node does, so it \`extends Node\` and lets Node do that part. What is new is the text it holds and the one thing only a Str can do, \`quoted()\`. So the class needs its own constructor (to store the text, after the parent has stored the line) and one new method.

**The solution, line by line.**

- \`class Str extends Node {\` makes Str a subclass of Node, so every Str has Node's \`where\` to begin with.
- \`  constructor(line, text) {\` takes the line and the text.
- \`    super(line);\` runs Node's constructor on the new object, which makes it and stores \`this.line\`. It has to come first: before it, there is no object for \`this\` to mean.
- \`    this.text = text;\` stores the extra property, now that \`this\` exists.
- \`  }\` ends the constructor.
- \`  quoted() {\` is a method Node does not have; it belongs to Str only.
- \`    return '"' + this.text + '"';\` glues three strings together. \`'"'\` is a string, in single quotes, holding one double quote mark, so for the text \`hi\` this gives \`"hi"\`, and for the empty text it gives \`""\`.
- \`  }\` and \`}\` close the method and the class.

\`where\` is not written at all, yet \`new Str(7, 'a').where()\` gives \`'line 7'\`: Str inherits it from Node, and it reads the \`line\` that Node's constructor stored. The last test checks the other direction: Node gains nothing from Str, so \`new Node(2).quoted\` is \`undefined\`.

**Common wrong attempts.**

- Leaving out \`super(line);\` and writing \`this.line = line;\` instead looks reasonable, but it stops at \`new Str(...)\` with *ReferenceError: Must call super constructor in derived class before accessing 'this' or returning from derived constructor*: a subclass constructor may not touch \`this\` until the parent has made the object.
- Putting \`super(line);\` after \`this.text = text;\` gives the same ReferenceError.
- \`super(text)\` passes the wrong value to Node, so \`line\` ends up holding the text, and \`where()\` says \`'line hi'\`.`,
    wrong: [
      {
        code: `class Node {
  constructor(line) {
    this.line = line;
  }
  where() {
    return 'line ' + this.line;
  }
}

class Str extends Node {
  constructor(line, text) {
    this.line = line;
    this.text = text;
  }
  quoted() {
    return '"' + this.text + '"';
  }
}`,
        why: 'No `super(line)`, so `this` is used before the parent has made the object: a ReferenceError at `new Str(...)`.',
      },
      {
        code: `class Node {
  constructor(line) {
    this.line = line;
  }
  where() {
    return 'line ' + this.line;
  }
}

class Str extends Node {
  constructor(line, text) {
    super(text);
    this.text = text;
  }
  quoted() {
    return '"' + this.text + '"';
  }
}`,
        why: '`super(text)` hands the text to Node’s constructor, which stores it as `line`, so `where()` reads `\'line hi\'`. Pass `line`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: `What does this print?
\`\`\`
class A { hi() { return 'A'; } }
class B extends A {}
console.log(new B().hi());
\`\`\``,
    options: [
      {
        t: 'An error, because `B` has no `hi`',
        why: '`B` inherits `hi` from `A`; it does not need to write it again.',
      },
      {
        t: '`A`',
        correct: true,
        why: '`B` has no `hi` of its own, so the one it inherited from `A` runs.',
      },
      {
        t: '`undefined`',
        why: '`hi` is found (in `A`), and it returns `\'A\'`.',
      },
      {
        t: '`B`',
        why: 'Nothing in the code returns `\'B\'`; the inherited method returns `\'A\'`.',
      },
    ],
  },
  {
    q: `What happens here?
\`\`\`
class Num extends Node {
  constructor(line, value) {
    this.value = value;
    super(line);
  }
}
new Num(1, 2);
\`\`\``,
    options: [
      {
        t: 'It works: the order of the lines does not matter',
        why: 'It does matter: in a subclass, the object only exists once `super(...)` has run.',
      },
      {
        t: '`value` is stored, but `line` is not',
        why: 'The constructor never gets as far as storing anything; it stops at the first `this`.',
      },
      {
        t: 'A ReferenceError, because `this` is used before `super(...)`',
        correct: true,
        why: 'The parent makes the object, so `this` cannot be used until `super(line)` has run.',
      },
    ],
  },
  {
    q: '`class Name extends Node {}` has no constructor. What is `new Name(5).line`?',
    options: [
      {
        t: '`undefined`, because Name has no constructor',
        why: 'A subclass without a constructor gets one that passes its arguments to the parent’s.',
      },
      {
        t: 'An error: a subclass must have a constructor',
        why: 'Leaving it out is allowed; JavaScript supplies one.',
      },
      {
        t: '`5`',
        correct: true,
        why: 'The supplied constructor calls `super(5)`, and Node’s constructor stores `this.line = 5`.',
      },
    ],
  },
  {
    q: '`Num extends Node`. Which of these is `false`?',
    options: [
      {
        t: '`new Num(1, 2) instanceof Node`',
        why: 'This is `true`: a Num is a kind of Node.',
      },
      {
        t: '`new Num(1, 2) instanceof Num`',
        why: 'This is `true`: the object was made by `new Num`.',
      },
      {
        t: '`new Node(1) instanceof Num`',
        correct: true,
        why: 'A plain Node is not a Num: inheritance goes from parent to child, not back.',
      },
      {
        t: '`new Node(1) instanceof Node`',
        why: 'This is `true`: the object was made by `new Node`.',
      },
    ],
  },
  {
    q: 'In Python, a subclass `__init__` that never calls `super().__init__(line)` runs without an error. What happens to the object?',
    options: [
      {
        t: 'Python calls the parent’s `__init__` anyway',
        why: 'It does not: if you write your own `__init__`, the parent’s runs only if you call it.',
      },
      {
        t: 'It is the same as in JavaScript: a ReferenceError',
        why: 'JavaScript checks this; Python does not, which makes the slip quieter there.',
      },
      {
        t: 'It has no `line` attribute, because the parent’s setup never ran',
        correct: true,
        why: 'The object is made, but only what the subclass’s `__init__` stored is there. JavaScript refuses with a ReferenceError instead, and Java refuses to compile (when the parent has no constructor without arguments).',
      },
    ],
  },
];
