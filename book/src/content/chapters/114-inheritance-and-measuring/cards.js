// Chapter 114 cards. Keys are stable ids: never rename them.

export const prompts = {
  'find-walk': {
    q: 'How does `findMethod` find an inherited method?',
    a: 'It looks in the class’s own methods, then asks the superclass, and so on up the chain.',
  },
  'override': {
    q: 'How does a Drip subclass override a method?',
    a: 'By defining a method with the same name: lookup checks the subclass first, so its version is found first.',
  },
  'super-must-be-class': {
    q: 'What happens with `let A = 1; class B extends A {}`?',
    a: 'A runtime error: `a class can only extend a class, not a number`.',
  },
  'extends-self': {
    q: 'Is `class A extends A {}` a runtime error or a compile error?',
    a: 'A compile error, found by the resolver: `a class cannot extend itself`.',
  },
  'init-inherited': {
    q: '`Dog` has no `init` and extends `Animal`, which has `init(name)`. What does `new Dog("Rex")` run?',
    a: '`Animal`’s `init`, found by the same walk up the chain, bound to the new `Dog` instance.',
  },
  'why-not-self-class': {
    q: 'Why can’t `super` mean “the superclass of `self`’s class”?',
    a: 'With three levels, a method in `B` run on a `C` instance would find `B` again, and call itself until `stack overflow`.',
  },
  'super-env': {
    q: 'Where does a Drip method find `super`?',
    a: 'In an environment holding the superclass, made when the subclass was declared, which its methods captured.',
  },
  'super-self-distance': {
    q: 'If the resolver records distance `d` for a `super` expression, where is `self`?',
    a: 'At distance `d - 1`: the self environment is always one closer than the super environment.',
  },
};

export const examples = {
  animals: {
    title: 'Inherit, override, super',
    lang: 'drip',
    code: `class Animal {
  init(name) { self.name = name; }
  speak() {
    print self.name + " makes a sound";
  }
}

class Dog extends Animal {
  speak() {
    super.speak();
    print self.name + " barks";
  }
}

class Puppy extends Dog {
  speak() {
    super.speak();
    print self.name + " wags";
  }
}

new Dog("Rex").speak();
new Puppy("Bit").speak();`,
  },
};

const shape = `class Shape {
  init(name) { self.name = name; }
  show() {
    print self.name;
    print self.area();
  }
}`;

const tail = `
  area() {
    return self.side * self.side;
  }
}
new Square(3).show();`;

export const exercises = {
  square: {
    title: 'A square is a shape',
    lang: 'drip',
    prompt:
      '`Square` inherits from `Shape`, but `new Square(3).show()` stops with a runtime error, because no `name` field exists. Fix `Square`’s `init` so the program prints `square` and then `9`. Don’t change `Shape`.',
    starter: `${shape}

class Square extends Shape {
  init(side) {
    self.side = side;
  }${tail}`,
    solution: `${shape}

class Square extends Shape {
  init(side) {
    super.init("square");
    self.side = side;
  }${tail}`,
    tests: `square
9`,
    hints: [
      '`Square` defines its own `init`, which overrides `Shape`’s. So `Shape`’s `init` never runs, and `name` is never set.',
      'You want to run the superclass’s `init` on this same instance, from inside `Square`’s `init`.',
      'Add `super.init("square");` as the first line of `Square`’s `init`.',
    ],
    walkthrough: `**How to think about it.** Ask which \`init\` runs for \`new Square(3)\`. \`findMethod("init")\` starts at \`Square\`, finds \`Square\`'s own \`init\`, and stops: overriding means the superclass's version is never even looked at. So nothing sets \`self.name\`, and \`show\` stops with \`Square has no property 'name'\` when it reads it. You need \`Shape\`'s \`init\` to run as well, on this same instance, and the way to reach an overridden method is \`super\`.

**The solution, line by line.**

- \`class Square extends Shape {\` is unchanged: \`Shape\` is the superclass.
- \`  init(side) {\` is \`Square\`'s own initialiser, called by \`new Square(3)\` with \`side\` = 3.
- \`    super.init("square");\` finds \`init\` starting at \`Shape\` (the superclass of the class this method is *written in*), binds it to the current \`self\` (the new square) and calls it, so \`Shape\`'s \`init\` sets \`self.name\` to \`"square"\`.
- \`    self.side = side;\` adds the square's own field.
- \`  }\` ends \`init\`; the rest of the class is unchanged.
- \`new Square(3).show();\` finds \`show\` in \`Shape\` (inherited) and runs it on the square: it prints \`square\`, then calls \`self.area()\`, which is an ordinary method call on a \`Square\` instance, so it finds \`Square\`'s \`area\` and prints \`9\`, even though \`show\` was written in \`Shape\`. Methods are found from the instance's class; only \`super\` is fixed by where it is written.

**Common wrong attempts.**

- \`super.init(side);\` does run \`Shape\`'s \`init\`, but hands it the side, so the name becomes 3 and the program prints \`3\`, then \`9\`.
- Setting \`self.name\` by hand works here, but skips anything else \`Shape\`'s \`init\` sets up; and \`self.init("square")\` cannot even be written, because \`init\` is a keyword.`,
    wrong: [
      {
        code: `${shape}

class Square extends Shape {
  init(side) {
    super.init(side);
    self.side = side;
  }${tail}`,
        why: 'This does run `Shape`’s `init`, but it hands it the side, so the name is set to `3` and the program prints `3`, then `9`. Pass the name, `"square"`.',
      },
      {
        code: `${shape}

class Square extends Shape {
  init(side) {
    self.side = side;
    self.name = side;
  }${tail}`,
        why: 'Setting the field by hand skips `Shape`’s `init` (and would miss anything else it sets up), and here it stores the side, not the name. Call `super.init("square")` instead.',
      },
    ],
  },
  findMethod: {
    optional: true,
    title: 'Walk the chain',
    prompt: `Model Drip's method lookup in plain JavaScript. A class is \`{ name, superclass, methods }\`, where \`superclass\` is another class or \`null\` and \`methods\` is a \`Map\` from names to anything.

- \`findMethod(klass, name)\` returns the method from the nearest class, starting at \`klass\` and walking up through the superclasses, or \`undefined\` if no class has it.
- \`superMethod(writtenIn, name)\` is what \`super.name\` finds inside a method written in the class \`writtenIn\`: the lookup starts at \`writtenIn\`'s **superclass**. If nothing is found, throw an \`Error\` with Drip's message, the superclass's name followed by \` has no method '...'\`, such as \`A has no method 'm'\`.`,
    starter: `function findMethod(klass, name) {
  // your code here
}

function superMethod(writtenIn, name) {
  // your code here
}`,
    solution: `function findMethod(klass, name) {
  let c = klass;
  while (c) {
    if (c.methods.has(name)) {
      return c.methods.get(name);
    }
    c = c.superclass;
  }
  return undefined;
}

function superMethod(writtenIn, name) {
  const sc = writtenIn.superclass;
  const m = findMethod(sc, name);
  if (m === undefined) {
    const n = sc.name;
    throw new Error(
      \`\${n} has no method '\${name}'\`);
  }
  return m;
}`,
    tests: `const A = { name: 'A', superclass: null, methods: new Map([['m', 'A.m'], ['k', 'A.k']]) };
const B = { name: 'B', superclass: A, methods: new Map([['m', 'B.m']]) };
const C = { name: 'C', superclass: B, methods: new Map() };
test('own methods first', () => {
  expect(findMethod(B, 'm')).toBe('B.m');
});
test('walks up the chain', () => {
  expect(findMethod(C, 'm')).toBe('B.m');
  expect(findMethod(C, 'k')).toBe('A.k');
});
test('missing everywhere', () => {
  expect(findMethod(C, 'zz')).toBe(undefined);
});
test('super starts above the class it was written in', () => {
  expect(superMethod(B, 'm')).toBe('A.m');
  expect(superMethod(C, 'm')).toBe('B.m');
});
test('super with nothing above throws', () => {
  let msg = 'no error';
  try { superMethod(B, 'zz'); } catch (e) { msg = e.message; }
  expect(msg).toBe("A has no method 'zz'");
});`,
    hints: [
      '`findMethod` is a walk: look in this class, then its superclass, and so on, until a class has the name or there are no classes left.',
      'Keep a variable `c`, starting at `klass`; while it is not `null`, return the method if `c.methods.has(name)`, otherwise move to `c.superclass`.',
      '`superMethod` is one line of thought: `findMethod(writtenIn.superclass, name)`, then throw if the result is `undefined`.',
    ],
    walkthrough: `**How to think about it.** Inheritance in the interpreter is nothing more than "look here, and if not here, look one class up". The difference between an ordinary method read and \`super\` is only *where the walk starts*: an ordinary read starts at the instance's own class, while \`super\` starts one class above the class the method was written in, which is why \`superMethod\` takes \`writtenIn\` and not the instance's class.

**The solution, line by line.**

- \`function findMethod(klass, name) {\` starts the walk at \`klass\`.
- \`  let c = klass;\` and \`  while (c) {\` visit the class, then its superclass, and so on; the loop stops when \`c\` becomes \`null\` at the top of the chain.
- \`    if (c.methods.has(name)) {\` and \`      return c.methods.get(name);\` stop at the nearest class that has the method, which is what makes overriding work.
- \`    c = c.superclass;\` moves one class up.
- \`  return undefined;\` means no class in the chain has it.
- \`function superMethod(writtenIn, name) {\` is \`super.name\`.
- \`  const sc = writtenIn.superclass;\` is the class directly above the one the method was written in (the interpreter keeps it in the super environment).
- \`  const m = findMethod(sc, name);\` walks from there.
- \`  if (m === undefined) {\` with \`const n = sc.name;\` and the \`throw\` gives Drip's message, naming the superclass where the search began.
- \`  return m;\` hands the method back (the interpreter would then bind it to \`self\`).

For a \`C\` instance running \`B\`'s method, \`superMethod(B, 'm')\` gives \`A.m\`; the tempting shortcut, \`findMethod(C.superclass, 'm')\`, would give \`B.m\` again.

**Common wrong attempts.**

- Starting \`superMethod\`'s walk at \`writtenIn\` itself: inside \`B\`'s \`m\`, \`super.m\` would find \`B\`'s own \`m\`, and call itself for ever.
- Checking only the class and its direct superclass: a method two levels up, like \`A.k\` from \`C\`, is never found.`,
    wrong: [
      {
        code: `function findMethod(klass, name) {
  let c = klass;
  while (c) {
    if (c.methods.has(name)) {
      return c.methods.get(name);
    }
    c = c.superclass;
  }
  return undefined;
}

function superMethod(writtenIn, name) {
  const m = findMethod(writtenIn, name);
  if (m === undefined) {
    const n = writtenIn.name;
    throw new Error(
      \`\${n} has no method '\${name}'\`);
  }
  return m;
}`,
        why: 'The `super` walk starts at the class the method was written in, so it finds that class’s own method again: `superMethod(B, \'m\')` gives `B.m`, not `A.m`.',
      },
      {
        code: `function findMethod(klass, name) {
  if (klass.methods.has(name)) {
    return klass.methods.get(name);
  }
  const s = klass.superclass;
  if (s && s.methods.has(name)) {
    return s.methods.get(name);
  }
  return undefined;
}

function superMethod(writtenIn, name) {
  const sc = writtenIn.superclass;
  const m = findMethod(sc, name);
  if (m === undefined) {
    const n = sc.name;
    throw new Error(
      \`\${n} has no method '\${name}'\`);
  }
  return m;
}`,
        why: 'This looks only one class up, so `findMethod(C, \'k\')` misses `A.k`. Walk the whole chain.',
      },
    ],
  },
};

export const quiz = [
  {
    q: `What does this print?
\`\`\`
class A { hi() { print "A"; } }
class B extends A {
  hi() { print "B"; }
}
class C extends B {}
new C().hi();
\`\`\``,
    options: [
      { t: '`A`', why: 'The walk stops at the nearest class with `hi`, which is `B`.' },
      { t: '`B`', correct: true, why: '`C` has no `hi`, so lookup goes to `B`, which has one: overriding `A`’s.' },
      { t: '`B` then `A`', why: 'Nothing calls `super`, so only one `hi` runs.' },
    ],
  },
  {
    q: 'In `class B extends A { m() { super.m(); } }`, run on an instance of `C extends B`, where does `super.m` start looking?',
    options: [
      { t: 'At `C`', why: 'That is where an ordinary `self.m` would start.' },
      { t: 'At `B`', why: 'That would find `B`’s own `m` and recurse for ever.' },
      { t: 'At `A`, the superclass of the class the method was written in', correct: true, why: '`super` is fixed when `B` is declared: its super environment holds `A`.' },
    ],
  },
  {
    q: 'What does `class A extends A {}` give?',
    options: [
      { t: 'A runtime error when the class statement runs', why: 'This one is caught before running.' },
      { t: 'The compile error `a class cannot extend itself`', correct: true, why: 'The resolver sees the two names are the same, so nothing runs.' },
      { t: 'An infinite loop when a method is looked up', why: 'It never gets that far; the resolver rejects it.' },
    ],
  },
  {
    q: 'Where does `super` live at run time, for the methods of `class B extends A`?',
    options: [
      { t: 'In a field of every `B` instance', why: 'Instances hold only their own fields; `super` belongs to where the methods were written.' },
      { t: 'In the globals', why: 'Then every class would share one `super`.' },
      { t: 'In an environment holding `super = A`, which `B`’s methods captured', correct: true, why: 'The class statement makes it around the methods, and the resolver records `super`’s distance to it.' },
    ],
  },
  {
    q: 'A subclass has its own `init(a, b)`. How does it run its superclass’s `init(a)` on the same instance?',
    options: [
      { t: '`super.init(a);`', correct: true, why: 'It finds the superclass’s `init`, binds it to the current `self`, and calls it.' },
      { t: '`self.init(a);`', why: '`init` is a keyword, so this does not even parse; and it would find the subclass’s own `init`.' },
      { t: '`new Super(a);`', why: 'That makes a separate instance; the fields would not go on this one.' },
    ],
  },
];
