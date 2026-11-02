// Chapter 161 cards (the second half of a split chapter). Keys are stable ids: never rename them.

export const prompts = {
  'invoke-why': {
    q: 'Why does the compiler emit `invoke` for `o.m(args)` instead of `get.prop` and `call`?',
    a: '`get.prop` would allocate a bound method that `call` unpacks at once; `invoke` calls the method directly, with no allocation and the same result.',
  },
  'invoke-field': {
    q: 'Why does `invoke` look in the instance’s fields before the class’s methods?',
    a: 'A field holding a function shadows a method of the same name, so `o.m()` must call the field, exactly as reading `o.m` and calling it would.',
  },
  'invoke-receiver': {
    q: 'Where is the receiver when `invoke m n` runs, and why does that matter?',
    a: 'Just below the n arguments, in the slot that becomes the method’s slot 0, so `self` is already in place and nothing has to move.',
  },
  'bound-still': {
    q: 'Name two ways of writing a method call that still make a bound method in the VM.',
    a: '`(o.m)(args)`, and `let f = o.m;` followed by `f(args)`: the property is read without an immediate call, so `get.prop` runs.',
  },
  'copy-down': {
    q: 'What does the `inherit` instruction do?',
    a: 'It copies the superclass’s whole method table into the new subclass, once, when the class is made.',
  },
  'override-order': {
    q: 'Why do a subclass’s overriding methods win over the copied ones?',
    a: '`inherit` runs before the subclass’s own `method` instructions, which overwrite any copied entry with the same name.',
  },
  'super-upvalue': {
    q: 'How does a method reach its superclass for `super.m()`?',
    a: 'The compiler stores the superclass in a hidden local named `super` around the class body; methods capture it as an upvalue, closed when the class declaration ends.',
  },
  'super-invoke': {
    q: 'What does `super.m(args)` compile to?',
    a: '`load.local 0` (self), the arguments, `load.upvalue` for the superclass, then `invoke.super m n`, which looks `m` up in the superclass and calls it on `self`.',
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
let a = new A();
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
      'Fill in the four method bodies so the program prints `Ada` then `18`. `Account.init(owner)` stores `owner` and a `balance` of 0. `deposit(x)` adds `x` to the balance and returns `self`, so calls can chain. `Savings.init(owner, rate)` reuses `Account`’s `init` and stores `rate`. `Savings.deposit(x)` deposits `x` plus `x * rate` by reusing `Account`’s `deposit`.',
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
    prompt:
      'Model the `inherit` instruction with `Map`s. Write `makeClass(sup, own)`, where `sup` is the superclass’s method `Map` (or `null`) and `own` is a `Map` of the new class’s own methods. Return a **new** `Map` with the inherited methods copied in first and the class’s own methods on top, so overrides win. Don’t change `sup` or `own`.',
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
    q: 'What does the compiler emit for `c.add(2)`?',
    options: [
      { t: '`get.prop \'add\'`, then `call 1`', why: 'That is what `(c.add)(2)` compiles to; a property read followed at once by `(` becomes one instruction.' },
      { t: 'The receiver, the argument, then `invoke \'add\' (1 args)`', correct: true, why: '`dot` sees `(` after the name and emits `invoke` with the name and the argument count.' },
      { t: '`new 1`', why: '`new` makes instances; this is a method call.' },
      { t: '`invoke.super \'add\'`', why: '`invoke.super` is only for `super.add(...)`.' },
    ],
  },
  {
    q: 'An instance has a field `m` holding a function, and its class has a method `m`. What does `o.m()` call?',
    options: [
      { t: 'The method, because `invoke` only looks at classes', why: '`invoke` checks the fields first, precisely so the meaning does not change.' },
      { t: 'Both, field first', why: 'Only one thing is called.' },
      { t: 'The field’s function', correct: true, why: 'A field shadows a method of the same name, as it would for `(o.m)()`.' },
      { t: 'Neither: it is a runtime error', why: 'Calling a field that holds a function is fine.' },
    ],
  },
  {
    q: 'In runs for this book, a copy of the VM without `invoke` ran the `method_calls` benchmark with 48 collections; the real VM ran none. Why?',
    options: [
      { t: 'Every `o.m()` became `get.prop` and `call`, allocating a bound method that was garbage at once', correct: true, why: 'Over a million calls, those short-lived bound methods filled the heap again and again.' },
      { t: 'The copy kept every instance alive', why: 'Instances were the same in both; the extra objects were bound methods.' },
      { t: '`invoke` turns the collector off', why: '`invoke` changes nothing about collection; it simply allocates nothing.' },
      { t: 'The copy ran in stress mode', why: 'Both ran normally; the difference is what each one allocated.' },
    ],
  },
  {
    q: '`class B extends A`, and B overrides `m`. In what order are B’s table entries written?',
    options: [
      { t: 'B’s own methods, then A’s copied over them', why: 'That would make every override lose to the inherited version.' },
      { t: 'Only B’s own; A’s are looked up at call time', why: 'That is how the tree-walker did it; the VM copies down once.' },
      { t: 'A’s methods are linked, not copied', why: '`addAll` copies the entries into B’s own table.' },
      { t: 'A’s methods are copied in by `inherit`, then B’s `method` instructions overwrite them', correct: true, why: 'So B’s `m` replaces the copied `A.m`, and every lookup is one probe.' },
    ],
  },
  {
    q: 'After `class B extends A { ... }`, the disassembly shows `pop` and then `close.upvalue`. What is being closed?',
    options: [
      { t: 'The hidden `super` local, holding A, which B’s methods captured', correct: true, why: 'The class body’s scope ends, and since methods captured `super`, it is closed into their upvalue.' },
      { t: 'The class B', why: 'B is dropped by the `pop`; it is a global, not a captured local.' },
      { t: 'Every method’s `self`', why: '`self` is slot 0 of each method’s own frame, not a local of the script.' },
      { t: 'Nothing: `close.upvalue` is always emitted after a class', why: 'It appears only because a method used `super`; a class without `extends` has no hidden local.' },
    ],
  },
];
