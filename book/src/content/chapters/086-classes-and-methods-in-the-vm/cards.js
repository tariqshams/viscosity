// Chapter 86 cards. Keys are stable ids: never rename them.

export const prompts = {
  'class-table': {
    q: 'Where does a VM class keep its methods, and what are the keys?',
    a: 'In a hash table (`methods`), keyed by the interned strings of the method names.',
  },
  'op-method': {
    q: 'What does `OP_METHOD name` do with the stack?',
    a: 'Stores the closure on top into the class just below it, under `name`, then pops the closure. The class stays.',
  },
  'this-slot': {
    q: 'How does `this` compile inside a method?',
    a: 'As `OP_GET_LOCAL 0`: the compiler reserves slot 0 of every method for the receiver.',
  },
  'fields-first': {
    q: 'An instance has a field `m`, and its class has a method `m`. What does `a.m` give?',
    a: 'The field. `OP_GET_PROPERTY` checks the fields before the class’s methods.',
  },
  'class-call': {
    q: 'What does the VM do when a Drip program calls a class?',
    a: 'Allocates an instance, writes it into the callee’s stack slot, and calls `init` with the arguments if the class has one.',
  },
  'init-returns': {
    q: 'An `init` ends with a bare `return;`. What does calling the class produce, and why?',
    a: 'The instance. In an initializer every return is compiled as `GET_LOCAL 0` then `RETURN`, so it returns `this`.',
  },
  'invoke-why': {
    q: 'What does `OP_INVOKE` save compared with `OP_GET_PROPERTY` followed by `OP_CALL`?',
    a: 'Allocating a bound-method object that would become garbage at once (and one extra dispatch).',
  },
  'invoke-field': {
    q: 'Why does `invoke` look in the receiver’s fields before its class?',
    a: 'A field can hold a function, and `a.m()` must mean the same as reading `a.m` and calling it, which finds the field first.',
  },
  'copy-down': {
    q: 'When, and how, does a VM subclass get its inherited methods?',
    a: 'Once, at `OP_INHERIT`: the superclass’s whole method table is copied into the subclass’s.',
  },
  'super-upvalue': {
    q: 'How does a method’s `super.m()` find the superclass?',
    a: '`super` is a local of a scope around the class body; methods capture it as an upvalue and push it with `OP_GET_UPVALUE`.',
  },
};

export const examples = {
  'field-wins': {
    title: 'A field beats a method',
    lang: 'drip-vm',
    code: `class A {
  m() { print "method"; }
}
fn f() { print "field"; }
let a = A();
a.m();
a.m = f;
a.m();`,
  },
};

export const exercises = {
  savings: {
    title: 'An account that earns interest',
    lang: 'drip-vm',
    prompt:
      'Fill in the four method bodies so the program prints `Ada` then `18`. `Account.init(owner)` stores `owner` and a `balance` of 0. `deposit(x)` adds `x` to the balance and returns `this`, so calls can chain. `Savings.init(owner, rate)` reuses `Account`’s `init` and stores `rate`. `Savings.deposit(x)` deposits `x` plus `x * rate` by reusing `Account`’s `deposit`.',
    starter: `class Account {
  init(owner) {
    // owner, and a balance of 0
  }
  deposit(x) {
    // add x; return this
  }
}

class Savings < Account {
  init(owner, rate) {
    // reuse Account's init
  }
  deposit(x) {
    // deposit x + x * rate
  }
}

let s = Savings("Ada", 0.5);
s.deposit(10).deposit(2);
print s.owner;
print s.balance;`,
    solution: `class Account {
  init(owner) {
    this.owner = owner;
    this.balance = 0;
  }
  deposit(x) {
    this.balance = this.balance + x;
    return this;
  }
}

class Savings < Account {
  init(owner, rate) {
    super.init(owner);
    this.rate = rate;
  }
  deposit(x) {
    let more = x * this.rate;
    return super.deposit(x + more);
  }
}

let s = Savings("Ada", 0.5);
s.deposit(10).deposit(2);
print s.owner;
print s.balance;`,
    tests: `Ada
18`,
    hints: [
      'In `Account`, set `this.owner` and `this.balance`, and have `deposit` end with `return this;`. That is fine in a method; only `init` may not return a value.',
      'In `Savings.init`, call `super.init(owner);` and then set `this.rate`. The fields land on the same instance.',
      '`Savings.deposit` must not call `this.deposit`: that is itself. Use `return super.deposit(x + x * this.rate);`.',
    ],
    walkthrough: `Calling \`Savings("Ada", 0.5)\` allocates an instance, puts it in the callee's slot, and finds \`init\` in \`Savings\`'s table. That \`init\` is \`Savings\`'s own: it overwrote the one \`OP_INHERIT\` copied down from \`Account\`.

\`\`\`
init(owner, rate) {
  super.init(owner);
  this.rate = rate;
}
\`\`\`

\`super.init(owner)\` compiles to \`OP_GET_LOCAL 0\` (this), \`owner\`, \`OP_GET_UPVALUE\` (the superclass) and \`OP_SUPER_INVOKE 'init'\`, which calls \`Account\`'s \`init\` on the same instance. No \`return\`: the compiler already makes \`init\` return \`this\`.

\`\`\`
deposit(x) {
  let more = x * this.rate;
  return super.deposit(x + more);
}
\`\`\`

\`super.deposit\` starts the lookup at \`Account\`, so it reaches the original method, which adds to the balance and returns \`this\`. Returning that result lets \`s.deposit(10).deposit(2)\` chain: 10 + 5 = 15, then 2 + 1 = 3, for 18. Each \`.deposit(...)\` is an \`OP_INVOKE\`, so none of these calls allocates a bound method.`,
    wrong: [
      {
        code: `class Account {
  init(owner) {
    this.owner = owner;
    this.balance = 0;
  }
  deposit(x) {
    this.balance = this.balance + x;
    return this;
  }
}

class Savings < Account {
  init(owner, rate) {
    super.init(owner);
    this.rate = rate;
    return this;
  }
  deposit(x) {
    let more = x * this.rate;
    return super.deposit(x + more);
  }
}

let s = Savings("Ada", 0.5);
s.deposit(10).deposit(2);
print s.owner;
print s.balance;`,
        why: '`return this;` in `init` is a compile error, `Can\'t return a value from an initializer.` Leave it out: the compiler already returns `this` from every initializer.',
      },
      {
        code: `class Account {
  init(owner) {
    this.owner = owner;
    this.balance = 0;
  }
  deposit(x) {
    this.balance = this.balance + x;
    return this;
  }
}

class Savings < Account {
  init(owner, rate) {
    super.init(owner);
    this.rate = rate;
  }
  deposit(x) {
    let more = x * this.rate;
    return this.deposit(x + more);
  }
}

let s = Savings("Ada", 0.5);
s.deposit(10).deposit(2);
print s.owner;
print s.balance;`,
        why: '`this.deposit` finds `Savings`’s own `deposit`, which calls itself forever: `Stack overflow.` `super.deposit` starts the lookup at `Account`.',
      },
    ],
  },
  copyDown: {
    optional: true,
    title: 'Copy-down inheritance',
    prompt:
      'Model `OP_INHERIT` with `Map`s. Write `makeClass(sup, own)`, where `sup` is the superclass’s method `Map` (or `null`) and `own` is a `Map` of the new class’s own methods. Return a **new** `Map` with the inherited methods copied in first and the class’s own methods on top, so overrides win. Don’t change `sup` or `own`.',
    starter: `function makeClass(sup, own) {
  const methods = new Map();
  // copy down, then add own methods
  return methods;
}`,
    solution: `function makeClass(sup, own) {
  const methods = new Map();
  if (sup) {
    for (const [k, m] of sup) {
      methods.set(k, m);
    }
  }
  for (const [k, m] of own) {
    methods.set(k, m);
  }
  return methods;
}`,
    tests: `test('inherits and overrides', () => {
  const A = makeClass(null, new Map([
    ['speak', 'A.speak'],
    ['init', 'A.init'],
  ]));
  const B = makeClass(A, new Map([
    ['speak', 'B.speak'],
  ]));
  expect(B.get('speak')).toBe('B.speak');
  expect(B.get('init')).toBe('A.init');
});
test('three levels, one lookup', () => {
  const A = makeClass(null,
    new Map([['m', 'A.m']]));
  const B = makeClass(A, new Map());
  const C = makeClass(B,
    new Map([['n', 'C.n']]));
  expect(C.get('m')).toBe('A.m');
  expect(C.size).toBe(2);
});
test('the superclass is unchanged', () => {
  const A = makeClass(null,
    new Map([['m', 'A.m']]));
  makeClass(A, new Map([['m', 'B.m']]));
  expect(A.get('m')).toBe('A.m');
  expect(A.size).toBe(1);
});`,
    hints: [
      'Two loops into the same new `Map`: first over `sup` (if it isn’t `null`), then over `own`.',
      'Order matters: a later `set` with the same key replaces the earlier one, and the class’s own method must be the one that stays.',
      'Write into `methods`, never into `sup`: other subclasses of the same superclass share it.',
    ],
    walkthrough: `\`\`\`js
function makeClass(sup, own) {
  const methods = new Map();
  if (sup) {
    for (const [k, m] of sup) {
      methods.set(k, m);
    }
  }
  for (const [k, m] of own) {
    methods.set(k, m);
  }
  return methods;
}
\`\`\`

This is the VM's order of events. \`OP_INHERIT\` runs \`addAll\` on the new, empty subclass table, and only then do the subclass's \`OP_METHOD\`s run, each overwriting any inherited entry with the same name.

The second test shows the payoff: \`C\` inherits \`m\` from two levels up, yet finding it is one \`get\`, because \`B\`'s table already held a copy when \`C\` copied \`B\`. The price is memory (every subclass holds every inherited method) and the rule that a class's methods can't change after it is created, which Drip guarantees.`,
    wrong: [
      {
        code: `function makeClass(sup, own) {
  const methods = new Map();
  for (const [k, m] of own) {
    methods.set(k, m);
  }
  if (sup) {
    for (const [k, m] of sup) {
      methods.set(k, m);
    }
  }
  return methods;
}`,
        why: 'Copying the superclass *after* the own methods overwrites every override, so `B.get(\'speak\')` is `A.speak`. Inherit first, then add your own.',
      },
      {
        code: `function makeClass(sup, own) {
  const methods = sup ?? new Map();
  for (const [k, m] of own) {
    methods.set(k, m);
  }
  return methods;
}`,
        why: 'This writes the subclass’s methods into the superclass’s own table, so `A` suddenly has `B`’s overrides. Copy into a new `Map`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does `c.taste()` compile to?',
    options: [
      { t: '`OP_GET_PROPERTY taste` then `OP_CALL 0`', why: 'That is what `let t = c.taste; t();` compiles to. A property immediately called becomes one instruction.' },
      { t: '`OP_INVOKE taste (0 args)`', correct: true, why: 'The compiler sees `(` right after `.taste` and emits a single `OP_INVOKE`.' },
      { t: '`OP_GET_GLOBAL taste` then `OP_CALL 0`', why: 'Methods aren’t globals; they are found through the receiver’s class.' },
      { t: '`OP_METHOD taste`', why: '`OP_METHOD` adds a method to a class while the class is being built.' },
    ],
  },
  {
    q: 'When a class is called, where does the VM put the new instance?',
    options: [
      { t: 'In a global named `this`', why: '`this` is a local, slot 0, not a global.' },
      { t: 'On top of the stack, above the arguments', why: 'Then it wouldn’t be slot 0 of `init`’s frame. It goes below the arguments.' },
      { t: 'In the stack slot that held the class, which becomes `init`’s slot 0', correct: true, why: 'So `this` and the parameters are already in place when `init` starts.' },
      { t: 'Inside the class’s field table', why: 'Classes don’t store their instances. Each instance points at its class.' },
    ],
  },
  {
    q: '`class P { init(x) { this.x = x; } }` What does `print P(1).init(2);` print?',
    options: [
      { t: '`nil`', why: 'An initializer’s implicit return pushes slot 0, not `nil`.' },
      { t: '`2`', why: '`init` doesn’t return its argument. It returns `this`.' },
      { t: 'A compile error', why: 'Calling `init` directly is allowed. Only returning a value *from* `init` is an error.' },
      { t: '`P instance`', correct: true, why: 'Every return from `init` compiles to `GET_LOCAL 0` + `RETURN`, so even a direct call returns the instance.' },
    ],
  },
  {
    q: 'Why does `OP_INVOKE` check the receiver’s fields before its class’s methods?',
    options: [
      { t: 'To keep the same meaning as reading the property and then calling it', correct: true, why: 'A field can hold a function, and a property read finds fields first. `OP_INVOKE` is a shortcut, so it must agree.' },
      { t: 'Because field lookups are faster', why: 'Both are one hash-table probe. The order is about meaning, not speed.' },
      { t: 'Because methods are stored in the fields table', why: 'Methods live in the class’s table; fields in the instance’s.' },
      { t: 'To allocate the bound method early', why: '`OP_INVOKE` exists precisely to avoid allocating one.' },
    ],
  },
  {
    q: 'How does a subclass find an inherited method at run time?',
    options: [
      { t: 'It walks up the superclass chain on every call', why: 'That is the tree-walker. The VM did the walk once, at class creation.' },
      { t: 'With one lookup in its own method table', correct: true, why: '`OP_INHERIT` copied the superclass’s methods into the subclass when the class was created.' },
      { t: 'Through the `super` upvalue on every call', why: '`super` is only used by `super.m()` calls. Ordinary calls look in the receiver’s own class.' },
      { t: 'Through a global table of all methods', why: 'There is no such table. Each class has its own.' },
    ],
  },
  {
    q: 'Inside a `Dog` method, how is `super` reached?',
    options: [
      { t: 'From `this`’s class’s superclass', why: 'That breaks with three levels (chapter 60). `super` must depend on where the method is written.' },
      { t: 'From a global named `super`', why: 'Then two classes with different superclasses would collide.' },
      { t: 'It is copied into every instance', why: 'Instances hold fields, not their class’s superclass.' },
      { t: 'As an upvalue capturing a local declared around the class body', correct: true, why: 'The compiler declares a `super` local in a scope around the class, and methods that use it capture it.' },
    ],
  },
];
