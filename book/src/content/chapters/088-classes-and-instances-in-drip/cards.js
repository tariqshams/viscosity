// Chapter 88 cards. Keys are stable ids: never rename them.

export const prompts = {
  'call-the-class': {
    q: 'How do you make an instance of a Drip class `Cake`?',
    a: 'Call the class like a function: `Cake("lemon")`. There is no `new`.',
  },
  'fields-where': {
    q: 'Where does a Drip instance keep its fields, and where are its methods?',
    a: 'Fields: in the instance’s own `Map`. Methods: in its class’s `Map`, shared by every instance.',
  },
  'field-created': {
    q: 'In Drip, how do you add a field `size` to an instance `b`?',
    a: 'Just assign it: `b.size = 3;`. Fields are never declared.',
  },
  'field-first': {
    q: 'An instance has a field and its class has a method, both called `bark`. What does `d.bark` give?',
    a: 'The field. `get` checks the instance’s fields before the class’s methods.',
  },
  'not-instance': {
    q: 'What happens in Drip if you write `n.size` where `n` is the number 3?',
    a: 'A runtime error: `Only instances have properties.`',
  },
  'this-where': {
    q: 'How does a method body find `this` at run time?',
    a: 'Like any variable: at the distance the resolver recorded, in the environment `bind` created.',
  },
  'bind-makes': {
    q: 'What does `bind(inst)` create?',
    a: 'A new environment holding only `this = inst` (parent: the method’s closure), and a new `DripFunction` that captures it.',
  },
  'keeps-this': {
    q: 'Why does `let f = c.taste; f();` still use `c` in Drip?',
    a: 'Reading `c.taste` already bound the method: `f`’s closure holds `this = c`.',
  },
  'new-each-read': {
    q: 'Why is `t.add == t.add` false in Drip?',
    a: 'Each read binds again, creating a new function value, and two different function objects aren’t equal.',
  },
  'init-returns': {
    q: 'What does calling an initializer return, even when called directly as `c.init(...)`?',
    a: 'The instance: `this`, taken from the initializer’s closure.',
  },
};

export const examples = {
  fields: {
    title: 'Fields come and go',
    lang: 'drip',
    expectError: true,
    code: `class Box {}

let b = Box();
b.size = 3;
print b.size;
b.size = b.size + 1;
print b.size;
print b;
print b.colour;`,
  },
  'bound-callback': {
    title: 'A method as a callback',
    lang: 'drip',
    code: `class Tally {
  init() { this.n = 0; }
  add() { this.n = this.n + 1; }
}

fn twice(f) {
  f();
  f();
}

let t = Tally();
twice(t.add);
print t.n;
print t.add == t.add;`,
  },
};

const program = `
fn twice(f) {
  f();
  f();
}
let t = Tally();
twice(t.add);
print t.value();
t.add();
print t.value();
print Tally().value();`;

export const exercises = {
  tally: {
    title: 'A counter class',
    lang: 'drip',
    prompt:
      'Finish the Drip class `Tally`. `init` sets a field `n` to `0`, `add()` adds 1 to it, and `value()` returns it. The program below it must print `2`, `3` and `0`. Notice that `twice(t.add)` passes a method as a callback.',
    starter: `class Tally {
  init() {}
  add() {}
  value() {}
}
${program}`,
    solution: `class Tally {
  init() { this.n = 0; }
  add() { this.n = this.n + 1; }
  value() { return this.n; }
}
${program}`,
    tests: `2
3
0`,
    hints: [
      'Every piece of per-instance data is a field, reached through `this`.',
      '`init() { this.n = 0; }` creates the field. Use `this.n` in the other two methods as well.',
      '`add() { this.n = this.n + 1; }` and `value() { return this.n; }`.',
    ],
    walkthrough: `\`n\` belongs to each tally, so it has to be a field:

\`\`\`
class Tally {
  init() { this.n = 0; }
  add() { this.n = this.n + 1; }
  value() { return this.n; }
}
\`\`\`

- **\`this.n = 0\`** in \`init\` creates the field. There is no declaration; assignment is enough.
- **\`twice(t.add)\`** works because reading \`t.add\` binds the method: its closure holds \`this = t\`. When \`twice\` calls \`f()\` with no dot, \`this\` is still \`t\`, so \`t.n\` becomes 2.
- **\`Tally().value()\`** is a brand-new instance with its own fields, so it prints \`0\`.

Writing \`n\` without \`this.\` doesn’t mean “my field”: the resolver finds no local \`n\`, treats it as a global, and the program stops with \`Undefined variable 'n'.\``,
    wrong: [
      {
        code: `class Tally {
  init() { this.n = 0; }
  add() { n = n + 1; }
  value() { return this.n; }
}
${program}`,
        why: 'Inside a method, a bare `n` is a variable, not a field. There is no such variable, so it is a runtime error. Fields are always reached through `this.`.',
      },
      {
        code: `class Tally {
  init() {
    this.n = 0;
    return this;
  }
  add() { this.n = this.n + 1; }
  value() { return this.n; }
}
${program}`,
        why: 'An initializer always returns `this` by itself, and `return` with a value inside `init` is a resolver error, so nothing runs. Remove the `return`.',
      },
    ],
  },
  getProp: {
    optional: true,
    title: 'Fields, then methods',
    prompt:
      'Model `DripInstance.get` in plain JavaScript. An instance is `{ fields: Map, klass: { methods: Map } }`. Each method is a JS function whose first parameter is the instance. Write `getProp(inst, name)`: return the field if there is one; otherwise return the method *bound* to `inst` (a function that calls the method with `inst` first, then the arguments); otherwise throw an `Error`.',
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
  throw new Error('Undefined ' + name);
}`,
    tests: `const methods = new Map([
  ['hi', (self, x) => self.fields.get('n') + x],
  ['who', () => 'method'],
]);
const make = () => ({
  fields: new Map([['n', 10]]),
  klass: { methods },
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
test('unknown names throw', () => {
  expect(() => getProp(make(), 'zz')).toThrow();
});`,
    hints: [
      'Check `inst.fields.has(name)` first, then the class’s methods.',
      'Binding means returning a new function that remembers `inst`: an arrow function closes over it.',
      '`return (...xs) => m(inst, ...xs);` then `throw` if neither was found.',
    ],
    walkthrough: `The order of the checks is the specification:

\`\`\`js
function getProp(inst, name) {
  if (inst.fields.has(name)) {
    return inst.fields.get(name);
  }
  const ms = inst.klass.methods;
  const m = ms.get(name);
  if (m) {
    return (...xs) => m(inst, ...xs);
  }
  throw new Error('Undefined ' + name);
}
\`\`\`

- **Fields first**, so a field can hide a method of the same name.
- **Binding with a closure.** The arrow function captures \`inst\`, the same job Drip’s bind environment does with its single \`this\` variable. The returned function can be stored or passed anywhere and still knows its instance.
- **Throw last**, like \`Undefined property\` in Drip.

Returning \`m\` itself would hand back an unbound method: whoever calls it would have to supply the instance, exactly the “lost \`this\`” problem from chapter 13.`,
    wrong: [
      {
        code: `function getProp(inst, name) {
  if (inst.fields.has(name)) {
    return inst.fields.get(name);
  }
  const ms = inst.klass.methods;
  const m = ms.get(name);
  if (m) return m;
  throw new Error('Undefined ' + name);
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
  throw new Error('Undefined ' + name);
}`,
        why: 'Methods are checked first, so a field can never hide a method of the same name. Drip checks fields first.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does a `DripInstance` contain?',
    options: [
      { t: 'A copy of all its class’s methods', why: 'Methods stay on the class, once, shared by every instance.' },
      { t: 'A pointer to its class and a map of fields', correct: true, why: 'That is all: `klass` and `fields`.' },
      { t: 'Only a map of fields', why: 'It also needs its class, to find methods.' },
      { t: 'An environment holding `this`', why: 'That environment is made by `bind`, when a method is read, not stored in the instance.' },
    ],
  },
  {
    q: `What does this print?
\`\`\`
class Dog {
  bark() { print "woof"; }
}
fn quiet() { print "..."; }
let d = Dog();
d.bark = quiet;
d.bark();
\`\`\``,
    options: [
      { t: '`woof`', why: 'The assignment created a field `bark`, and fields are checked before methods.' },
      { t: 'A runtime error: can’t assign a method', why: 'Assignment always just sets a field; there is no check against method names.' },
      { t: 'Both `woof` and `...`', why: 'Only one `bark` is found: the field.' },
      { t: '`...`', correct: true, why: 'The field `bark` holds `quiet`, and it hides the method.' },
    ],
  },
  {
    q: 'In `c.taste()`, when is `taste` bound to `c`?',
    options: [
      { t: 'When the `get` expression `c.taste` is evaluated', correct: true, why: '`DripInstance.get` finds the method and returns `method.bind(this)`. The call comes after.' },
      { t: 'When the class is declared', why: 'Then there is no instance yet to bind to.' },
      { t: 'When `c` is created', why: 'Creating an instance binds only `init`, to run it.' },
      { t: 'Never: `this` comes from the dot during the call', why: 'That is JavaScript’s rule. Drip binds when the method is read.' },
    ],
  },
  {
    q: 'Inside a method body (not inside a nested block or function), how many environments up is `this`?',
    options: [
      { t: '0', why: 'The current environment is the call’s, holding the parameters.' },
      { t: '2', why: 'Two up would be the environment the class was declared in.' },
      { t: '1', correct: true, why: 'The call’s environment hangs off the bind environment, which holds `this`.' },
      { t: 'It isn’t in an environment', why: 'It is: Drip treats `this` as a variable in the environment made by `bind`.' },
    ],
  },
  {
    q: `What does this print?
\`\`\`
class P {
  init(x) { this.x = x; }
}
let p = P(1);
let q = p.init(7);
print q == p;
print p.x;
\`\`\``,
    options: [
      { t: '`false`, then `1`', why: 'Calling `init` directly re-runs it on `p` and returns `p`.' },
      { t: '`true`, then `7`', correct: true, why: 'An initializer always returns its `this`, and the call set `p.x` to 7.' },
      { t: '`true`, then `1`', why: 'The re-run of `init` did assign `this.x = 7`.' },
      { t: 'A resolver error', why: 'Calling `init` directly is allowed; only returning a value from it is not.' },
    ],
  },
  {
    q: 'What does every `c.taste()` call allocate in the tree-walker, before the call itself?',
    options: [
      { t: 'Nothing: methods are shared', why: 'The method is shared, but reading it binds it, and binding allocates.' },
      { t: 'A new instance', why: 'The instance already exists. Only calling a class makes one.' },
      { t: 'A copy of the fields map', why: 'Fields are never copied; the bind environment refers to the instance.' },
      { t: 'A new environment holding `this` and a new `DripFunction`', correct: true, why: 'That is `bind`. Then the call itself allocates its own environment as well.' },
    ],
  },
];
