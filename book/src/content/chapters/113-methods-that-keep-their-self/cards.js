// Chapter 112 (second half: bound methods) cards. Keys are stable ids.

export const prompts = {
  'self-where': {
    q: 'Where does the resolver declare `self`?',
    a: 'In one extra scope it wraps around all of a class’s methods, so inside a method `self` is one scope out.',
  },
  'self-outside': {
    q: 'What happens if a plain function (not a method) uses `self`?',
    a: "A compile error: `cannot use 'self' outside a method`.",
  },
  'bind-makes': {
    q: 'What does `bind(instance)` make?',
    a: 'A new environment holding only `self` (around the method’s captured environment), and a new function value that captures it.',
  },
  'keeps-self': {
    q: 'Why does `let f = c.taste; f();` still know about `c` in Drip?',
    a: 'Reading `c.taste` bound the method: `f`’s captured environment holds `self = c`, so no dot is needed at the call.',
  },
  'new-each-read': {
    q: 'Why is `c.taste == c.taste` false in Drip?',
    a: 'Each read binds again and makes a new function value; functions are equal only if they are the same value.',
  },
  'two-objects': {
    q: 'What does every method read, even in an immediate call like `c.taste()`, allocate?',
    a: 'Two objects: a bind environment and a new `DripFunction`.',
  },
  'init-returns': {
    q: 'What does a call of a bound `init` give back, whatever its body does?',
    a: 'The instance: `callFunction` returns the `self` from the initialiser’s bind environment.',
  },
  'init-keyword': {
    q: 'Can a Drip program call `c.init()` to run the initialiser again?',
    a: 'No: `init` is a keyword, so `c.init()` does not even parse. Only `new` and `super.init(...)` run it.',
  },
};

export const examples = {
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
};

export const exercises = {
  tally: {
    lang: 'drip',
    title: 'A counter class, passed around',
    prompt:
      'Finish the class `Tally`: `init` sets a field `n` to `0`, `add()` adds 1 to it, and `value()` returns it. The program below must print `2`, `3` and `0`. Notice that `twice(t.add)` passes a method as a callback, without a dot at the call.',
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
        why: "Inside `add`, `n` is not a variable; the field must be reached through `self`: `undefined variable 'n'`.",
      },
    ],
  },
  getProp: {
    optional: true,
    title: 'Fields, then methods',
    prompt:
      'Model `DripInstance.get` in plain JavaScript. An instance is `{ fields: Map, klass: { name, methods: Map } }`. Each method is a JS function whose first parameter is the instance. Write `getProp(inst, name)`: return the field if there is one; otherwise return the method *bound* to `inst` (a function that calls the method with `inst` first, then the arguments); otherwise throw an `Error` whose message is Drip’s: the class’s `name` (an instance’s `klass` also has a `name`), then ` has no property ` and the name in single quotes, such as `Cake has no property \'zz\'`.',
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
};

export const quiz = [
  {
    q: `What does this print?
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
      { t: 'A runtime error: `self` is missing', why: 'That is what JavaScript’s `this` would do. Reading `d.hi` bound it to `d`.' },
      { t: '`Rex`', correct: true, why: '`f` is a bound method whose captured environment holds `self = d`.' },
      { t: '`none`', why: '`d.name` was set to `"Rex"` by `init`.' },
    ],
  },
  {
    q: 'How does a method body find `self` at run time?',
    options: [
      { t: 'The interpreter passes the instance as a hidden first argument', why: 'Drip does not add an argument; `self` lives in an environment.' },
      { t: 'It looks `self` up like any variable, at the distance the resolver recorded', correct: true, why: '`self` is declared in the class scope by the resolver and defined in the bind environment by `bind`.' },
      { t: 'It searches every instance for one that owns the method', why: 'Methods are shared on the class; the instance comes from binding.' },
    ],
  },
  {
    q: 'When does binding happen?',
    options: [
      { t: 'When the class is declared', why: 'At that point there is no instance to bind to.' },
      { t: 'When the bound method is called', why: 'By then the dot is gone; Drip binds earlier.' },
      { t: 'When the method is read off an instance, as in `c.taste`', correct: true, why: '`get` returns `method.bind(this)` on every read.' },
    ],
  },
  {
    q: 'What does `new V(3)` give, if `init(x) { self.x = x; return; }`?',
    options: [
      { t: '`none`, because of the bare return', why: 'An initialiser’s call always gives back the instance.' },
      { t: 'A compile error: `init` cannot return', why: 'Only `return value;` is an error; a bare `return;` is allowed.' },
      { t: 'The instance, printed `V { x: 3 }`', correct: true, why: '`callFunction` returns the `self` of the bound `init`, whatever the body did.' },
    ],
  },
  {
    q: 'Why is `t.add == t.add` false?',
    options: [
      { t: 'Each read binds again and makes a new function value', correct: true, why: 'Two different bound methods (both for `t`) are two different values, and functions compare by identity.' },
      { t: 'Methods cannot be compared at all', why: 'They can; `let f = t.add; f == f` is true.' },
      { t: 'Because `add` changes `t`', why: 'Comparing does not call anything.' },
    ],
  },
];
