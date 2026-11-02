// Chapter 71 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'fields-where': {
    q: 'In a Drip-style class implementation, where do an instance’s fields live, and where do its methods live?',
    a: 'Fields in the instance’s own map; methods in its class’s map, shared by every instance.',
  },
  'field-first': {
    q: 'A Drip instance has a field `size` and its class has a method `size`. What does `obj.size` give?',
    a: 'The field. A property read checks the instance’s fields before the class’s methods.',
  },
  'keeps-self': {
    q: 'Why does `let f = c.taste; f();` still use `c` as `self` in Drip, unlike `this` in JavaScript?',
    a: 'Reading `c.taste` binds the method: `f`’s captured environment holds `self = c`, so no dot is needed at the call.',
  },
  'new-each-read': {
    q: 'Why is `c.taste == c.taste` false in Drip?',
    a: 'Each read binds again and makes a new function value, and functions are equal only if they are the same value.',
  },
  'find-walk': {
    q: 'How does a class-based interpreter with single inheritance find an inherited method?',
    a: 'It looks in the class’s own methods, then asks the superclass, and so on up the chain until one has it or the chain ends.',
  },
  'why-not-self-class': {
    q: 'Why can’t `super` mean “the superclass of `self`’s class”?',
    a: 'With three levels, a method in `B` run on a `C` instance would find `B` again and call itself until the stack overflows; `super` must start above the class the method was written in.',
  },
  'super-env': {
    q: 'In Drip’s tree-walking interpreter, where does a method find `super`?',
    a: 'In an environment holding the superclass, made when the subclass was declared and captured by its methods; it is found by scope depth like any variable.',
  },
};

export const examples = {
  fields: {
    title: 'Two cakes, their own fields',
    lang: 'drip',
    code: `class Cake {
  init(f) { self.flavour = f; }
  taste() { print self.flavour; }
}

let a = new Cake("lemon");
let b = new Cake("plum");
b.taste = "a field";
print a;
print b;
a.taste();
print b.taste;`,
  },
  'bound-callback': {
    title: 'A method as a callback',
    lang: 'drip',
    code: `class Tally {
  init() { self.n = 0; }
  add() { self.n += 1; }
}

fn twice(f) {
  f();
  f();
}

let t = new Tally();
twice(t.add);
print t.n;
print t.add == t.add;`,
  },
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

export const exercises = {
  rect: {
    optional: true,
    lang: 'drip',
    title: 'A rectangle class',
    prompt: 'Finish the class `Rect`. `init(w, h)` stores the two numbers in fields `w` and `h`; `area()` returns `w * h`; and `grow(d)` adds `d` to both fields. The program below it must print `12`, `30` and `Rect { w: 5, h: 6 }`.',
    starter: `class Rect {
  # your methods here
}

let r = new Rect(3, 4);
print r.area();
r.grow(2);
print r.area();
print r;`,
    solution: `class Rect {
  init(w, h) {
    self.w = w;
    self.h = h;
  }
  area() {
    return self.w * self.h;
  }
  grow(d) {
    self.w += d;
    self.h += d;
  }
}

let r = new Rect(3, 4);
print r.area();
r.grow(2);
print r.area();
print r;`,
    tests: `12
30
Rect { w: 5, h: 6 }`,
    hints: [
      'A Drip class body is a list of methods, each written like a function but without `fn`. Which three methods does the program call (counting `new`)?',
      '`init` must create the fields by assigning to them: `self.w = w;` and `self.h = h;`.',
      '`area()` is `return self.w * self.h;`, and `grow(d)` does `self.w += d;` and `self.h += d;`.',
    ],
    walkthrough: `**How to think about it.** Read the program at the bottom first: \`new Rect(3, 4)\` needs an \`init\` with two parameters; \`r.area()\` needs a method that *returns* a number (it is printed); and \`r.grow(2)\` needs a method that changes the instance. The fields are never declared anywhere: \`init\` creates them by assigning to them, and the other methods read and change them through \`self\`. The final \`print r\` shows the fields in the order they were first set, so \`init\` must set \`w\` before \`h\`.

**The solution, line by line.**

- \`class Rect {\` opens the class body.
- \`  init(w, h) {\` is the initialiser; \`new Rect(3, 4)\` calls it with \`w\` = 3 and \`h\` = 4, on a brand-new instance with no fields.
- \`    self.w = w;\` creates the field \`w\` on that instance (the \`w\` on the right is the parameter), and \`    self.h = h;\` creates \`h\`.
- \`  }\` ends \`init\`. Whatever it returns, \`new\` gives back the instance.
- \`  area() {\` and \`    return self.w * self.h;\` read both fields and return their product: 12 at first.
- \`  grow(d) {\` with \`self.w += d;\` and \`self.h += d;\` reads each field, adds \`d\` and writes it back, so the rectangle becomes 5 by 6.
- \`}\` ends the class. The program then prints 12, then 30 after growing, then \`Rect { w: 5, h: 6 }\`.

**Common wrong attempts.**

- Writing \`w = w;\` in \`init\` instead of \`self.w = w;\`: that assigns the parameter to itself, no field is ever created, and \`area()\` stops with \`Rect has no property 'w'\`.
- Printing inside \`area()\` instead of returning: the method then gives \`none\`, so \`print r.area()\` prints the area and then \`none\`.
- Calling the class without \`new\` (\`Rect(3, 4)\`) is the runtime error \`cannot call a class: use 'new Rect(...)'\`.`,
    wrong: [
      {
        code: `class Rect {
  init(w, h) {
    w = w;
    h = h;
  }
  area() {
    return self.w * self.h;
  }
  grow(d) {
    self.w += d;
    self.h += d;
  }
}

let r = new Rect(3, 4);
print r.area();
r.grow(2);
print r.area();
print r;`,
        why: '`w = w;` assigns the parameter to itself; no field is created, so `area()` fails with `Rect has no property \'w\'`.',
      },
      {
        code: `class Rect {
  init(w, h) {
    self.w = w;
    self.h = h;
  }
  area() {
    print self.w * self.h;
  }
  grow(d) {
    self.w += d;
    self.h += d;
  }
}

let r = new Rect(3, 4);
print r.area();
r.grow(2);
print r.area();
print r;`,
        why: '`area()` prints instead of returning, so it gives `none`, and `print r.area()` prints `none` after each area.',
      },
    ],
  },
  particles: {
    optional: true,
    lang: 'drip',
    title: 'A list of particles',
    prompt: 'Write a class `Particle` with `init(x, vx)` storing fields `x` and `vx`, and `step(dt)` adding `vx * dt` to `x`. The program makes three particles, steps each one, and must print `0.5`, `2` and `3.5`.',
    starter: `# write class Particle here

let ps = [];
for i in 0..3 {
  push(ps, new Particle(i, i + 1));
}
for p in ps {
  p.step(0.5);
}
for p in ps {
  print p.x;
}`,
    solution: `class Particle {
  init(x, vx) {
    self.x = x;
    self.vx = vx;
  }
  step(dt) {
    self.x += self.vx * dt;
  }
}

let ps = [];
for i in 0..3 {
  push(ps, new Particle(i, i + 1));
}
for p in ps {
  p.step(0.5);
}
for p in ps {
  print p.x;
}`,
    tests: `0.5
2
3.5`,
    hints: [
      'The particles are made with `new Particle(i, i + 1)`, so `init` takes two parameters and stores them as fields.',
      '`step(dt)` changes the instance it is called on: read `self.vx`, multiply by `dt`, and add it to `self.x`.',
      'The body of `step` is `self.x += self.vx * dt;`.',
    ],
    walkthrough: `**How to think about it.** This is the shape the whole book is about: a list of records, each with a position and a speed, and a loop that moves every one. Each particle is an instance with its own two fields; the method \`step\` is shared by all of them, on the class, and \`self\` tells it which particle to move.

**The solution, line by line.**

- \`class Particle {\` opens the class.
- \`  init(x, vx) {\` with \`self.x = x;\` and \`self.vx = vx;\` creates the two fields on each new particle.
- \`  step(dt) {\` and \`    self.x += self.vx * dt;\` read the speed, multiply by the time step and add it to the position of whichever particle the method was called on.
- \`}\` ends the class.
- The loops make particles at positions 0, 1, 2 with speeds 1, 2, 3, step each by 0.5 (adding 0.5, 1 and 1.5), and print 0.5, 2 and 3.5.

**Common wrong attempts.**

- Writing \`x += vx * dt;\` without \`self.\`: \`x\` and \`vx\` are not variables inside \`step\`, so it stops with \`undefined variable 'x'\`.
- Forgetting \`init\` and assigning fields after \`new\`: \`new Particle(i, i + 1)\` then stops with \`Particle has no init, so it takes no arguments, but got 2\`.`,
    wrong: [
      {
        code: `class Particle {
  init(x, vx) {
    self.x = x;
    self.vx = vx;
  }
  step(dt) {
    x += vx * dt;
  }
}

let ps = [];
for i in 0..3 {
  push(ps, new Particle(i, i + 1));
}
for p in ps {
  p.step(0.5);
}
for p in ps {
  print p.x;
}`,
        why: 'Inside `step`, `x` is not a variable; the fields must be reached through `self`: `undefined variable \'x\'`.',
      },
    ],
  },
  tally: {
    optional: true,
    lang: 'drip',
    title: 'A counter class, passed around',
    prompt: 'Finish the class `Tally`: `init` sets a field `n` to `0`, `add()` adds 1 to it, and `value()` returns it. The program below must print `2`, `3` and `0`. Notice that `twice(t.add)` passes a method as a callback, without a dot at the call.',
    starter: `class Tally {
  # your methods here
}

fn twice(f) {
  f();
  f();
}

let t = new Tally();
twice(t.add);
print t.value();
let add = t.add;
add();
print t.value();
print new Tally().value();`,
    solution: `class Tally {
  init() {
    self.n = 0;
  }
  add() {
    self.n += 1;
  }
  value() {
    return self.n;
  }
}

fn twice(f) {
  f();
  f();
}

let t = new Tally();
twice(t.add);
print t.value();
let add = t.add;
add();
print t.value();
print new Tally().value();`,
    tests: `2
3
0`,
    hints: [
      'Three methods: `init` with no parameters, `add` and `value`. Each reaches the count through `self`.',
      '`init` creates the field with `self.n = 0;`. `add` is `self.n += 1;`.',
      '`value()` must *return* the count: `return self.n;`. Nothing special is needed for the callback: reading `t.add` already binds it.',
    ],
    walkthrough: `**How to think about it.** Write the class as if every call had a dot (\`t.add()\`), because that is all you need: reading \`t.add\` binds the method to \`t\` at the moment of the read, so when \`twice\` later calls \`f()\` with no dot, the bound method's captured environment still holds \`self = t\`. The same is true of \`let add = t.add; add();\`.

**The solution, line by line.**

- \`class Tally {\` opens the class.
- \`  init() {\` with \`    self.n = 0;\` creates the field \`n\` on each new tally; \`new Tally()\` takes no arguments, so \`init\` has no parameters.
- \`  add() {\` with \`    self.n += 1;\` reads \`n\` through \`self\` (found one environment out, in the bind environment), adds 1 and writes it back.
- \`  value() {\` with \`    return self.n;\` gives the count back.
- \`}\` ends the class.
- \`twice(t.add);\` reads \`t.add\` (a bound method) and passes it in; \`twice\` calls it twice, so \`t.n\` is 2, and \`print t.value()\` prints \`2\`.
- \`let add = t.add; add();\` stores another bound method and calls it with no dot: \`t.n\` becomes 3.
- \`print new Tally().value();\` makes a fresh tally, whose own \`n\` is 0.

**Common wrong attempts.**

- Keeping the count in a global (\`let n = 0;\` outside the class): every tally then shares one count, so the fresh tally prints 3, not 0.
- Writing \`n += 1;\` instead of \`self.n += 1;\` inside \`add\`: there is no variable \`n\` in scope, so it stops with \`undefined variable 'n'\`.`,
    wrong: [
      {
        code: `let n = 0;
class Tally {
  init() {}
  add() {
    n += 1;
  }
  value() {
    return n;
  }
}

fn twice(f) {
  f();
  f();
}

let t = new Tally();
twice(t.add);
print t.value();
let add = t.add;
add();
print t.value();
print new Tally().value();`,
        why: 'One global count is shared by every tally, so the fresh tally prints `3` instead of `0`. Keep the count in a field.',
      },
      {
        code: `class Tally {
  init() {
    self.n = 0;
  }
  add() {
    n += 1;
  }
  value() {
    return self.n;
  }
}

fn twice(f) {
  f();
  f();
}

let t = new Tally();
twice(t.add);
print t.value();
let add = t.add;
add();
print t.value();
print new Tally().value();`,
        why: 'Inside `add`, `n` is not a variable; the field must be reached through `self`: `undefined variable \'n\'`.',
      },
    ],
  },
  getProp: {
    optional: true,
    title: 'Fields, then methods',
    prompt: 'Model `DripInstance.get` in plain JavaScript. An instance is `{ fields: Map, klass: { name, methods: Map } }`. Each method is a JS function whose first parameter is the instance. Write `getProp(inst, name)`: return the field if there is one; otherwise return the method *bound* to `inst` (a function that calls the method with `inst` first, then the arguments); otherwise throw an `Error` whose message is Drip’s: the class’s `name` (an instance’s `klass` also has a `name`), then ` has no property ` and the name in single quotes, such as `Cake has no property \'zz\'`.',
    starter: `function getProp(inst, name) {
  // your code here
}`,
    solution: `function getProp(inst, name) {
  if (inst.fields.has(name)) {
    return inst.fields.get(name);
  }
  const ms = inst.klass.methods;
  const m = ms.get(name);
  if (m) {
    return (...xs) => m(inst, ...xs);
  }
  const k = inst.klass.name;
  throw new Error(
    \`\${k} has no property '\${name}'\`);
}`,
    tests: `const methods = new Map([
  ['hi', (self, x) => self.fields.get('n') + x],
  ['who', () => 'method'],
]);
const make = () => ({
  fields: new Map([['n', 10]]),
  klass: { name: 'Cake', methods },
});
test('reads a field', () => {
  expect(getProp(make(), 'n')).toBe(10);
});
test('a bound method keeps its instance', () => {
  const f = getProp(make(), 'hi');
  expect(f(5)).toBe(15);
});
test('fields hide methods', () => {
  const i = make();
  i.fields.set('who', 'field');
  expect(getProp(i, 'who')).toBe('field');
});
test('unknown names throw Drip’s message', () => {
  let m = 'no error';
  try { getProp(make(), 'zz'); } catch (e) { m = e.message; }
  expect(m).toBe("Cake has no property 'zz'");
});`,
    hints: [
      'Check `inst.fields.has(name)` first, then the class’s methods.',
      'Binding means returning a new function that remembers `inst`: an arrow function closes over it.',
      '`return (...xs) => m(inst, ...xs);`, and if neither was found, throw an `Error` built with a template literal from `inst.klass.name` and `name`.',
    ],
    walkthrough: `**How to think about it.** \`DripInstance.get\` asks three questions in a fixed order, and the order is the specification: is it a field of this instance; if not, is it a method of the class; if not, it is an error. The only new idea is what "a method, bound" means when there is no environment to build: a function that remembers the instance and passes it along every time it is called, which an arrow function does by closing over \`inst\`.

**The solution, line by line.**

- \`function getProp(inst, name) {\` reads one property.
- \`  if (inst.fields.has(name)) {\` and \`    return inst.fields.get(name);\` check the instance's own fields first, so a field hides a method with the same name.
- \`  const ms = inst.klass.methods;\` and \`  const m = ms.get(name);\` ask the class.
- \`  if (m) {\` and \`    return (...xs) => m(inst, ...xs);\` return a *bound* method: a new arrow function that captured \`inst\`, and calls the method with \`inst\` first and then whatever arguments it is given. This is the job Drip's bind environment does with its single \`self\` variable; the returned function can be stored or passed anywhere and still knows its instance.
- \`  const k = inst.klass.name;\` and the \`throw\` build Drip's message, \`Cake has no property 'zz'\`, when neither was found.

**Common wrong attempts.**

- Returning \`m\` itself: whoever calls it has to supply the instance, so \`f(5)\` passes \`5\` where the instance belongs; that is the "lost \`this\`" problem from JavaScript.
- Checking the methods before the fields: a field can then never hide a method.`,
    wrong: [
      {
        code: `function getProp(inst, name) {
  if (inst.fields.has(name)) {
    return inst.fields.get(name);
  }
  const ms = inst.klass.methods;
  const m = ms.get(name);
  if (m) return m;
  const k = inst.klass.name;
  throw new Error(
    \`\${k} has no property '\${name}'\`);
}`,
        why: 'This returns the method unbound. Calling it as `f(5)` passes `5` as the instance, so it can’t find the field. Wrap it so it remembers `inst`.',
      },
      {
        code: `function getProp(inst, name) {
  const ms = inst.klass.methods;
  const m = ms.get(name);
  if (m) {
    return (...xs) => m(inst, ...xs);
  }
  if (inst.fields.has(name)) {
    return inst.fields.get(name);
  }
  const k = inst.klass.name;
  throw new Error(
    \`\${k} has no property '\${name}'\`);
}`,
        why: 'Methods are checked first, so a field can never hide a method of the same name. Drip checks fields first.',
      },
    ],
  },
  square: {
    title: 'A square is a shape',
    lang: 'drip',
    prompt: '`Square` inherits from `Shape`, but `new Square(3).show()` stops with a runtime error, because no `name` field exists. Fix `Square`’s `init` so the program prints `square` and then `9`. Don’t change `Shape`.',
    starter: `class Shape {
  init(name) { self.name = name; }
  show() {
    print self.name;
    print self.area();
  }
}

class Square extends Shape {
  init(side) {
    self.side = side;
  }
  area() {
    return self.side * self.side;
  }
}
new Square(3).show();`,
    solution: `class Shape {
  init(name) { self.name = name; }
  show() {
    print self.name;
    print self.area();
  }
}

class Square extends Shape {
  init(side) {
    super.init("square");
    self.side = side;
  }
  area() {
    return self.side * self.side;
  }
}
new Square(3).show();`,
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
        code: `class Shape {
  init(name) { self.name = name; }
  show() {
    print self.name;
    print self.area();
  }
}

class Square extends Shape {
  init(side) {
    super.init(side);
    self.side = side;
  }
  area() {
    return self.side * self.side;
  }
}
new Square(3).show();`,
        why: 'This does run `Shape`’s `init`, but it hands it the side, so the name is set to `3` and the program prints `3`, then `9`. Pass the name, `"square"`.',
      },
      {
        code: `class Shape {
  init(name) { self.name = name; }
  show() {
    print self.name;
    print self.area();
  }
}

class Square extends Shape {
  init(side) {
    self.side = side;
    self.name = side;
  }
  area() {
    return self.side * self.side;
  }
}
new Square(3).show();`,
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
    q: `In Drip, what does this print?
\`\`\`
class P {
  init(x) { self.x = x; }
}
let a = new P(1);
let b = new P(2);
a.x = 5;
print b.x;
\`\`\``,
    options: [
      {
        t: '`5`',
        why: 'Fields belong to one instance. Changing `a.x` does not touch `b`.',
      },
      {
        t: '`2`',
        correct: true,
        why: 'Each instance has its own map of fields; `b.x` was set to 2 by its own `init`.',
      },
      {
        t: '`1`',
        why: 'That was `a`’s first value, and it was `a`’s, not `b`’s.',
      },
    ],
  },
  {
    q: `In Drip, what does this print?
\`\`\`
class Dog {
  init(n) { self.name = n; }
  hi() { print self.name; }
}
let d = new Dog("Rex");
let f = d.hi;
f();
\`\`\``,
    options: [
      {
        t: 'A runtime error: `self` is missing',
        why: 'That is what JavaScript’s `this` would do. Reading `d.hi` bound it to `d`.',
      },
      {
        t: '`Rex`',
        correct: true,
        why: '`f` is a bound method whose captured environment holds `self = d`.',
      },
      {
        t: '`none`',
        why: '`d.name` was set to `"Rex"` by `init`.',
      },
    ],
  },
  {
    q: `In Drip, what does this print?
\`\`\`
class A { hi() { print "A"; } }
class B extends A {
  hi() { print "B"; }
}
class C extends B {}
new C().hi();
\`\`\``,
    options: [
      {
        t: '`A`',
        why: 'The walk stops at the nearest class with `hi`, which is `B`.',
      },
      {
        t: '`B`',
        correct: true,
        why: '`C` has no `hi`, so lookup goes to `B`, which has one: overriding `A`’s.',
      },
      {
        t: '`B` then `A`',
        why: 'Nothing calls `super`, so only one `hi` runs.',
      },
    ],
  },
  {
    q: 'In `class B extends A { m() { super.m(); } }`, run on an instance of `C extends B`, where does `super.m` start looking?',
    options: [
      {
        t: 'At `C`',
        why: 'That is where an ordinary `self.m` would start.',
      },
      {
        t: 'At `B`',
        why: 'That would find `B`’s own `m` and recurse for ever.',
      },
      {
        t: 'At `A`, the superclass of the class the method was written in',
        correct: true,
        why: '`super` is fixed when `B` is declared: its super environment holds `A`.',
      },
    ],
  },
];
