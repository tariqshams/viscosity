// Chapter 112 cards. Keys are stable ids: never rename them.

export const prompts = {
  'class-holds': {
    q: 'What does a `DripClass` hold?',
    a: 'A name, an optional superclass, and a map from method names to `DripFunction`s.',
  },
  'new-steps': {
    q: 'In order, what does `new Point(1, 2)` do?',
    a: 'Looks up `Point`, evaluates the arguments, checks it is a class, makes an empty instance, and calls `init` on it with the arguments.',
  },
  'new-returns': {
    q: 'What is the value of a `new` expression?',
    a: 'The new instance, whatever `init` does.',
  },
  'call-the-class': {
    q: 'What happens if you write `Point(1, 2)` without `new`?',
    a: "A runtime error: `cannot call a class: use 'new Point(...)'`.",
  },
  'fields-where': {
    q: 'Where do an instance’s fields live, and where do its methods live?',
    a: 'Fields in the instance’s own `Map`; methods in its class’s map, shared by every instance.',
  },
  'field-created': {
    q: 'How is a new field created in Drip?',
    a: 'By assigning to it: `obj.name = value` creates the field if it does not exist yet.',
  },
  'field-first': {
    q: 'An instance has a field `size` and its class has a method `size`. What does `obj.size` give?',
    a: 'The field. A property read checks the fields before the class’s methods.',
  },
  'not-instance': {
    q: 'What happens in Drip if you write `n.x = 1` where `n` holds a number?',
    a: "A runtime error: `cannot set 'x' on a number`. Only instances have properties.",
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
};

export const exercises = {
  rect: {
    lang: 'drip',
    title: 'A rectangle class',
    prompt:
      'Finish the class `Rect`. `init(w, h)` stores the two numbers in fields `w` and `h`; `area()` returns `w * h`; and `grow(d)` adds `d` to both fields. The program below it must print `12`, `30` and `Rect { w: 5, h: 6 }`.',
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
        why: "`w = w;` assigns the parameter to itself; no field is created, so `area()` fails with `Rect has no property 'w'`.",
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
    prompt:
      'Write a class `Particle` with `init(x, vx)` storing fields `x` and `vx`, and `step(dt)` adding `vx * dt` to `x`. The program makes three particles, steps each one, and must print `0.5`, `2` and `3.5`.',
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
        why: "Inside `step`, `x` is not a variable; the fields must be reached through `self`: `undefined variable 'x'`.",
      },
    ],
  },
};

export const quiz = [
  {
    q: `What does this print?
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
      { t: '`5`', why: 'Fields belong to one instance. Changing `a.x` does not touch `b`.' },
      { t: '`2`', correct: true, why: 'Each instance has its own map of fields; `b.x` was set to 2 by its own `init`.' },
      { t: '`1`', why: 'That was `a`’s first value, and it was `a`’s, not `b`’s.' },
    ],
  },
  {
    q: 'What does `print new Box();` show, for `class Box {}`?',
    options: [
      { t: '`Box {}`', correct: true, why: 'An instance with no fields prints as its class name and empty braces.' },
      { t: '`class Box`', why: 'That is how the class itself prints. `new Box()` is an instance.' },
      { t: 'A runtime error: Box has no init', why: 'A class with no `init` can be made with no arguments; it is only an error to pass some.' },
    ],
  },
  {
    q: 'An instance `c` has no field `taste`, and its class has a method `taste`. What does `c.taste` give?',
    options: [
      { t: 'A runtime error: no property', why: 'After the fields, the read asks the class for a method of that name, and finds one.' },
      { t: '`none`', why: 'Missing properties are errors in Drip, never `none`; and here there is a method.' },
      { t: 'The method, bound to `c`', correct: true, why: '`get` checks the fields first, then returns the class’s method bound to the instance.' },
    ],
  },
  {
    q: 'Which line is a runtime error in Drip?',
    options: [
      { t: '`b.colour = "red";` on an instance with no `colour` field yet', why: 'Assigning creates the field.' },
      { t: '`print b.colour;` on an instance with no `colour` field or method', correct: true, why: "Reading a missing property stops with `Box has no property 'colour'`." },
      { t: '`let b = new Box();` for `class Box {}`', why: 'That makes an instance with no fields.' },
    ],
  },
  {
    q: 'Why does `new` give back the instance rather than what `init` returns?',
    options: [
      { t: 'Because `init` cannot contain a `return` at all', why: 'A bare `return;` is allowed in `init`; only `return value;` is not.' },
      { t: 'Because the job of `new` is to make an instance; `init` only fills it in', correct: true, why: 'The `new` case calls `init` for its effects and then returns `inst`.' },
      { t: 'Because `init` is a native function', why: '`init` is an ordinary Drip method, run with `callFunction`.' },
    ],
  },
];
