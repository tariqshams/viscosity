// Chapter 85 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'class-table': {
    q: 'In the Drip bytecode VM, what does a class object hold, and what does an instance hold?',
    a: 'A class: its name and a method table. An instance: a pointer to its class, a field table, and the order its fields were first set.',
  },
  'self-slot': {
    q: 'In the Drip bytecode VM, how does `self.x` inside a method compile, and why does that work?',
    a: '`load.local 0`, then `get.prop \'x\'`: the compiler names slot 0 of every method `self`, and the VM puts the instance there when it calls the method.',
  },
  'new-slot': {
    q: 'In the Drip bytecode VM, where does `new C(args)` put the instance it allocates, and why there?',
    a: 'Over the class, in the callee’s slot; that slot becomes `init`’s slot 0, so `self` and the arguments are already in place.',
  },
  'init-returns': {
    q: 'In Drip, what does an `init` method return, and how does the bytecode compiler make sure of it?',
    a: 'Always the instance: in an initialiser, every return (implicit or a bare `return;`) loads slot 0, `self`, instead of `none`, and `return value;` is a compile error.',
  },
  'invoke-why': {
    q: 'In a VM where reading `o.m` makes a bound method, why does the compiler emit one `invoke` instruction for `o.m(args)` instead of a property read and a call?',
    a: 'The read would allocate a bound method that the call unpacks at once; `invoke` calls the method directly, with the same result and no allocation.',
  },
  'invoke-field': {
    q: 'Why must a VM’s `invoke` instruction look in the instance’s fields before its class’s methods, in a language where fields can hold functions?',
    a: 'A field holding a function shadows a method of the same name, so `o.m()` must call the field, exactly as reading `o.m` and calling it would.',
  },
  'copy-down': {
    q: 'In copy-down inheritance, what happens to the superclass’s methods when a subclass is created?',
    a: 'The whole method table is copied into the subclass once, before the subclass’s own methods are added (so overrides overwrite the copies).',
  },
  'super-upvalue': {
    q: 'In the Drip bytecode VM, how does a method reach its superclass for `super.m()`?',
    a: 'The compiler stores the superclass in a hidden local named `super` around the class body; methods capture it as an upvalue, closed when the class declaration ends.',
  },
};

export const examples = {
  'init-calls': {
    title: 'An init that calls a method',
    lang: 'drip-vm',
    code: `class C {
  init(n) {
    self.n = n;
    self.items = [];
    self.fill();
  }
  fill() {
    for i in 0..self.n {
      push(self.items, i);
    }
  }
}
print new C(3);`,
  },
  'field-wins': {
    title: 'A field beats a method',
    lang: 'drip-vm',
    code: `class A {
  m() { print "method"; }
}
fn f() { print "field"; }
let a = new A();
a.m();
a.m = f;
a.m();`,
  },
};

export const exercises = {
  vec: {
    optional: true,
    title: 'A vector, printed properly',
    lang: 'drip-vm',
    prompt: 'Fix `Vec` so the program prints `Vec { x: 3, y: 4 }` and then `25`. `init(x, y)` stores both fields; `len2()` returns `x * x + y * y` for the instance it is called on.',
    starter: `class Vec {
  init(x, y) {
    self.y = y;
    self.x = x;
  }
  len2() {
    # x * x + y * y
  }
}
let v = new Vec(3, 4);
print v;
print v.len2();`,
    solution: `class Vec {
  init(x, y) {
    self.x = x;
    self.y = y;
  }
  len2() {
    let x = self.x;
    let y = self.y;
    return x * x + y * y;
  }
}
let v = new Vec(3, 4);
print v;
print v.len2();`,
    tests: `Vec { x: 3, y: 4 }
25`,
    hints: [
      'The first line prints wrongly even though both fields are right. What decides the order in which an instance prints its fields?',
      'Fields print in the order they were *first set*. Set `self.x` before `self.y` in `init`.',
      'In `len2`, the fields are only reachable through `self`: `let x = self.x; let y = self.y; return x * x + y * y;`.',
    ],
    walkthrough: `**How to think about it.** Run the starter in your head. \`new Vec(3, 4)\` makes an empty instance and calls \`init\` with \`self\` in slot 0, \`x\` in slot 1 and \`y\` in slot 2. The starter sets \`y\` first, so \`set.prop 'y'\` finds \`y\` new and appends it to \`fieldOrder\`, then \`x\`; \`print\` follows \`fieldOrder\`, so it shows \`Vec { y: 4, x: 3 }\`. And \`len2\` has no \`return\`, so it returns \`none\`. Two fixes, then: the order of the assignments, and a body for \`len2\`.

**The solution, line by line.**

- \`init(x, y) {\` is the initialiser; \`new Vec(3, 4)\` calls it with the instance already in slot 0.
- \`self.x = x;\` compiles to \`load.local 0\`, \`load.local 1\`, \`set.prop 'x'\`. The field is new, so \`x\` goes first in \`fieldOrder\`.
- \`self.y = y;\` adds \`y\` second. No \`return\`: the compiler ends \`init\` with \`load.local 0\` and \`return\`, so \`new\` gives back the instance.
- \`len2() {\` is an ordinary method; when called as \`v.len2()\`, \`v\` is its slot 0.
- \`let x = self.x;\` and \`let y = self.y;\` copy the fields into locals (\`get.prop\` finds them in the field table before it would look at methods). Splitting the expression keeps each line short.
- \`return x * x + y * y;\` is \`9 + 16\`, which is \`25\`.

**Common wrong attempts.**

- Adding \`return self;\` at the end of \`init\`, to be sure the instance comes back, is the compile error \`'init' cannot return a value\`: it is never needed, because the compiler already returns slot 0.
- Writing \`return x * x + y * y;\` in \`len2\` without the two \`let\` lines fails at run time with \`undefined variable 'x'\`: inside a method, fields are not variables; only \`self.x\` reaches them.
- Fixing \`len2\` but not the order prints \`Vec { y: 4, x: 3 }\`: both fields are right, but print order is first-set order.`,
    wrong: [
      {
        code: `class Vec {
  init(x, y) {
    self.x = x;
    self.y = y;
    return self;
  }
  len2() {
    let x = self.x;
    let y = self.y;
    return x * x + y * y;
  }
}
let v = new Vec(3, 4);
print v;
print v.len2();`,
        why: '`return self;` in `init` is the compile error `\'init\' cannot return a value`; the compiler already returns the instance.',
      },
      {
        code: `class Vec {
  init(x, y) {
    self.x = x;
    self.y = y;
  }
  len2() {
    return x * x + y * y;
  }
}
let v = new Vec(3, 4);
print v;
print v.len2();`,
        why: 'Inside a method, `x` is not a variable: this stops with `undefined variable \'x\'`. Read the fields through `self`.',
      },
      {
        code: `class Vec {
  init(x, y) {
    self.y = y;
    self.x = x;
  }
  len2() {
    let x = self.x;
    let y = self.y;
    return x * x + y * y;
  }
}
let v = new Vec(3, 4);
print v;
print v.len2();`,
        why: 'The fields are right, but `y` was set first, so the instance prints as `Vec { y: 4, x: 3 }`.',
      },
    ],
  },
  savings: {
    title: 'An account that earns interest',
    lang: 'drip-vm',
    prompt: 'Fill in the four method bodies so the program prints `Ada` then `18`. `Account.init(owner)` stores `owner` and a `balance` of 0. `deposit(x)` adds `x` to the balance and returns `self`, so calls can chain. `Savings.init(owner, rate)` reuses `Account`’s `init` and stores `rate`. `Savings.deposit(x)` deposits `x` plus `x * rate` by reusing `Account`’s `deposit`.',
    starter: `class Account {
  init(owner) {
    # owner, and a balance of 0
  }
  deposit(x) {
    # add x; return this
  }
}

class Savings extends Account {
  init(owner, rate) {
    # reuse Account's init
  }
  deposit(x) {
    # deposit x + x * rate
  }
}

let s = new Savings("Ada", 0.5);
s.deposit(10).deposit(2);
print s.owner;
print s.balance;`,
    solution: `class Account {
  init(owner) {
    self.owner = owner;
    self.balance = 0;
  }
  deposit(x) {
    self.balance = self.balance + x;
    return self;
  }
}

class Savings extends Account {
  init(owner, rate) {
    super.init(owner);
    self.rate = rate;
  }
  deposit(x) {
    let more = x * self.rate;
    return super.deposit(x + more);
  }
}

let s = new Savings("Ada", 0.5);
s.deposit(10).deposit(2);
print s.owner;
print s.balance;`,
    tests: `Ada
18`,
    hints: [
      'Start with `Account`: two fields in `init`, and a `deposit` that changes the balance. What must `deposit` return for `s.deposit(10).deposit(2)` to work?',
      'In `Account`, set `self.owner` and `self.balance`, and end `deposit` with `return self;` (fine in a method; only `init` may not return a value). In `Savings.init`, call `super.init(owner);` and then set `self.rate`.',
      '`Savings.deposit` must not call `self.deposit`, which is itself. Work out the extra first, `let more = x * self.rate;`, then `return super.deposit(x + more);`.',
    ],
    walkthrough: `**How to think about it.** Work from the bottom of the program up. \`print s.balance\` must show 18 after \`s.deposit(10).deposit(2)\` with a rate of 0.5: the first deposit adds 10 plus 5, the second 2 plus 1, so 15 + 3 = 18. The chain means \`deposit\` must return the account itself. And \`Savings\` should not repeat \`Account\`'s work: its \`init\` and \`deposit\` add only what is new, and hand the rest to the superclass with \`super\`.

**The solution, line by line.**

- \`self.owner = owner;\` and \`self.balance = 0;\` in \`Account.init\` create the two fields, in that order. No \`return\`: the compiler ends \`init\` by returning slot 0, the instance.
- \`self.balance = self.balance + x;\` in \`Account.deposit\` reads and writes the field through \`self\`; \`return self;\` hands the account back so the next \`.deposit\` has a receiver.
- \`class Savings extends Account\` runs \`inherit\` first, copying \`init\` and \`deposit\` down, and then \`Savings\`'s own two methods overwrite those copies.
- \`super.init(owner);\` compiles to \`load.local 0\` (self), \`load.local 1\` (owner), \`load.upvalue 0\` (the hidden \`super\` local) and \`invoke.super 'init'\`: \`Account\`'s \`init\` runs on the same instance and sets \`owner\` and \`balance\`.
- \`self.rate = rate;\` adds the third field.
- \`let more = x * self.rate;\` works out the interest.
- \`return super.deposit(x + more);\` calls \`Account\`'s \`deposit\`, starting the lookup at the superclass, and returns what it returns: the instance. Each \`.deposit(...)\` in the script is an \`invoke\`, so none of these calls allocates a bound method.

**Common wrong attempts.**

- Adding \`return self;\` to \`Savings.init\` is the compile error \`'init' cannot return a value\`; it is never needed.
- Writing \`return self.deposit(x + more);\` in \`Savings.deposit\` finds \`Savings\`'s own \`deposit\` again (the lookup starts at the instance's class), which calls itself until the VM stops with \`stack overflow\`.
- Forgetting \`return\` in \`Account.deposit\` makes it return \`none\`, and the chained \`.deposit(2)\` fails with \`cannot read 'deposit' of none\`.`,
    wrong: [
      {
        code: `class Account {
  init(owner) {
    self.owner = owner;
    self.balance = 0;
  }
  deposit(x) {
    self.balance = self.balance + x;
    return self;
  }
}

class Savings extends Account {
  init(owner, rate) {
    super.init(owner);
    self.rate = rate;
    return self;
  }
  deposit(x) {
    let more = x * self.rate;
    return super.deposit(x + more);
  }
}

let s = new Savings("Ada", 0.5);
s.deposit(10).deposit(2);
print s.owner;
print s.balance;`,
        why: '`return self;` in `init` is the compile error `\'init\' cannot return a value`. Leave it out: the compiler already returns the instance from every initialiser.',
      },
      {
        code: `class Account {
  init(owner) {
    self.owner = owner;
    self.balance = 0;
  }
  deposit(x) {
    self.balance = self.balance + x;
    return self;
  }
}

class Savings extends Account {
  init(owner, rate) {
    super.init(owner);
    self.rate = rate;
  }
  deposit(x) {
    let more = x * self.rate;
    return self.deposit(x + more);
  }
}

let s = new Savings("Ada", 0.5);
s.deposit(10).deposit(2);
print s.owner;
print s.balance;`,
        why: '`self.deposit` finds `Savings`’s own `deposit`, which calls itself until the VM reports `stack overflow`. `super.deposit` starts the lookup at `Account`.',
      },
    ],
  },
  copyDown: {
    optional: true,
    title: 'Copy-down inheritance',
    prompt: 'Model the `inherit` instruction with `Map`s. Write `makeClass(sup, own)`, where `sup` is the superclass’s method `Map` (or `null`) and `own` is a `Map` of the new class’s own methods. Return a **new** `Map` with the inherited methods copied in first and the class’s own methods on top, so overrides win. Don’t change `sup` or `own`.',
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
    walkthrough: `**How to think about it.** Copy-down inheritance happens in two moments, in this order: \`inherit\` copies everything the superclass has into the new class's empty table, and then each of the class's own \`method\` instructions stores its method, replacing any copied one with the same name. A \`Map\` does the replacing for us, because setting an existing key overwrites it; so the whole job is two loops into a fresh \`Map\`, in the right order.

**The solution, line by line.**

- \`const methods = new Map();\` makes the new class's own table. It must be new: other subclasses of the same superclass share \`sup\`.
- \`if (sup) { for (const [k, m] of sup) { methods.set(k, m); } }\` is \`inherit\` (\`Table.addAll\`): every inherited method, copied once. A class with no superclass skips it.
- \`for (const [k, m] of own) { methods.set(k, m); }\` is the class's \`method\` instructions; an override replaces the copied entry.
- \`return methods;\`

The second test shows the payoff: \`C\` inherits \`m\` from two levels up, yet finding it is one \`get\`, because \`B\`'s table already held a copy when \`C\` copied \`B\`. The price is memory (every subclass holds every inherited method) and the rule that a class's methods cannot change after it is made, which Drip guarantees.

**Common wrong attempts.**

- Copying the superclass *after* the own methods overwrites every override with the inherited version.
- Reusing \`sup\` as the new table (\`const methods = sup ?? new Map();\`) writes the subclass's methods into the superclass, so \`A\` suddenly has \`B\`'s overrides.`,
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
    q: 'In the Drip bytecode VM, during `new P(3)`, what is written into the stack slot that held the class `P`?',
    options: [
      {
        t: 'Nothing: the class stays there for the whole call',
        why: 'The class is replaced, so that `init` finds the instance in its slot 0.',
      },
      {
        t: 'The number 3',
        why: 'The argument stays in the slot above.',
      },
      {
        t: 'A bound method for `init`',
        why: 'No bound method is needed: the instance itself goes in the callee’s slot and `init` is called directly.',
      },
      {
        t: 'A fresh, empty instance of `P`, which becomes `init`’s `self`',
        correct: true,
        why: '`newInstance` writes the instance over the class; that slot is the new frame’s slot 0.',
      },
    ],
  },
  {
    q: 'In Drip, class `P` has `init(x) { if x < 0 { return; } self.x = x; }`. What does `print new P(-1);` print?',
    options: [
      {
        t: '`none`',
        why: 'A bare `return;` in `init` returns slot 0, the instance, not `none`.',
      },
      {
        t: '`P {}`',
        correct: true,
        why: 'The early return skips the field, and the instance comes back with no fields.',
      },
      {
        t: 'A compile error, because `init` contains `return`',
        why: 'Only `return value;` is an error in `init`; a bare `return;` is allowed.',
      },
      {
        t: '`P { x: -1 }`',
        why: 'The `return;` runs before `self.x = x`.',
      },
    ],
  },
  {
    q: 'What does the Drip bytecode compiler emit for `c.add(2)`?',
    options: [
      {
        t: '`get.prop \'add\'`, then `call 1`',
        why: 'That is what `(c.add)(2)` compiles to; a property read followed at once by `(` becomes one instruction.',
      },
      {
        t: 'The receiver, the argument, then `invoke \'add\' (1 args)`',
        correct: true,
        why: 'The compiler sees `(` straight after the name and emits `invoke` with the name and the argument count.',
      },
      {
        t: '`new 1`',
        why: '`new` makes instances; this is a method call.',
      },
      {
        t: '`invoke.super \'add\'`',
        why: '`invoke.super` is only for `super.add(...)`.',
      },
    ],
  },
  {
    q: 'In Drip, an instance has a field `m` holding a function, and its class has a method `m`. What does `o.m()` call?',
    options: [
      {
        t: 'The method, because `invoke` only looks at classes',
        why: '`invoke` checks the fields first, precisely so the meaning does not change.',
      },
      {
        t: 'Both, field first',
        why: 'Only one thing is called.',
      },
      {
        t: 'The field’s function',
        correct: true,
        why: 'A field shadows a method of the same name, as it would for `(o.m)()`.',
      },
      {
        t: 'Neither: it is a runtime error',
        why: 'Calling a field that holds a function is fine.',
      },
    ],
  },
  {
    q: 'A copy of a bytecode VM whose compiler never emits `invoke` (so `o.m()` is a property read and a call) runs a method-call benchmark with 48 collections, where the original runs none. Why?',
    options: [
      {
        t: 'Every `o.m()` became `get.prop` and `call`, allocating a bound method that was garbage at once',
        correct: true,
        why: 'Over a million calls, those short-lived bound methods filled the heap again and again.',
      },
      {
        t: 'The copy kept every instance alive',
        why: 'Instances were the same in both; the extra objects were bound methods.',
      },
      {
        t: '`invoke` turns the collector off',
        why: '`invoke` changes nothing about collection; it simply allocates nothing.',
      },
      {
        t: 'The copy ran in stress mode',
        why: 'Both ran normally; the difference is what each one allocated.',
      },
    ],
  },
];
