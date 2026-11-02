// Chapter 160 cards. Keys are stable ids: never rename them.

export const prompts = {
  'class-table': {
    q: 'In the companion VM, what does a class object hold, and what does an instance hold?',
    a: 'A class: its name and a method table. An instance: a pointer to its class, a field table, and the order its fields were first set.',
  },
  'op-method': {
    q: 'What does the `method` instruction do?',
    a: 'It stores the closure on top of the stack in the method table of the class just below it, under the instruction’s name, and pops the closure.',
  },
  'self-slot': {
    q: 'How does `self.x` inside a method compile, and why does that work?',
    a: '`load.local 0`, then `get.prop \'x\'`: the compiler names slot 0 of every method `self`, and the VM puts the instance there when it calls the method.',
  },
  'field-order': {
    q: 'Why does `print` show an instance’s fields in the order they were first set, even after they are assigned again?',
    a: '`set.prop` appends a name to `fieldOrder` only when `Table.set` reports the key as new.',
  },
  'new-slot': {
    q: 'Where does `new` put the instance it allocates, and why there?',
    a: 'Over the class, in the callee’s slot; that slot becomes `init`’s slot 0, so `self` and the arguments are already in place.',
  },
  'init-returns': {
    q: 'What does an `init` method return, and how does the compiler make sure of it?',
    a: 'Always the instance: in an initialiser, `emitReturn` emits `load.local 0` (slot 0, `self`) instead of `none` before `return`.',
  },
  'no-init-args': {
    q: 'What happens with `new Point(1, 2)` if `Point` has no `init`?',
    a: 'A runtime error: `Point has no init, so it takes no arguments, but got 2`.',
  },
  'bare-return': {
    q: 'Inside `init`, which is allowed: `return;` or `return self;`?',
    a: 'Only `return;`, which also returns the instance; `return self;` (any value) is the compile error `\'init\' cannot return a value`.',
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
};

export const exercises = {
  vec: {
    title: 'A vector, printed properly',
    lang: 'drip-vm',
    prompt:
      'Fix `Vec` so the program prints `Vec { x: 3, y: 4 }` and then `25`. `init(x, y)` stores both fields; `len2()` returns `x * x + y * y` for the instance it is called on.',
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
};

export const quiz = [
  {
    q: 'Which instructions build `class P { get() { return 1; } }` before any instance exists?',
    options: [
      { t: '`new`, then `set.prop` for each method', why: '`new` makes instances; methods live in the class, not in instances.' },
      { t: '`class \'P\'`, `define.global`, `load.global`, then `closure` and `method \'get\'`, then `pop`', correct: true, why: 'The class is made empty, stored, pushed again, given each method in turn, and finally dropped.' },
      { t: 'One `call` per method', why: 'Methods are only called later; building the class calls nothing.' },
      { t: '`inherit`', why: '`inherit` only appears when a class extends another.' },
    ],
  },
  {
    q: 'During `new P(3)`, what does the VM write into the slot that held the class `P`?',
    options: [
      { t: 'Nothing: the class stays there for the whole call', why: 'The class is replaced, so that `init` finds the instance in its slot 0.' },
      { t: 'The number 3', why: 'The argument stays in the slot above.' },
      { t: 'A bound method for `init`', why: 'No bound method is needed: the instance itself goes in the callee’s slot and `init` is called directly.' },
      { t: 'A fresh, empty instance of `P`, which becomes `init`’s `self`', correct: true, why: '`newInstance` writes the instance over the class; that slot is the new frame’s slot 0.' },
    ],
  },
  {
    q: 'What does `new P(-1)` print with `init(x) { if x < 0 { return; } self.x = x; }` and then `print`?',
    options: [
      { t: '`none`', why: 'A bare `return;` in `init` returns slot 0, the instance, not `none`.' },
      { t: '`P {}`', correct: true, why: 'The early return skips the field, and the instance comes back with no fields.' },
      { t: 'A compile error, because `init` contains `return`', why: 'Only `return value;` is an error in `init`; a bare `return;` is allowed.' },
      { t: '`P { x: -1 }`', why: 'The `return;` runs before `self.x = x`.' },
    ],
  },
  {
    q: '`class Point {}` and then `new Point(1, 2)`. What happens?',
    options: [
      { t: 'A runtime error: `Point has no init, so it takes no arguments, but got 2`', correct: true, why: 'With no `init`, there is nothing to receive the arguments, and `newInstance` says so.' },
      { t: 'The arguments are ignored and you get `Point {}`', why: 'Drip treats extra arguments as a mistake rather than ignoring them.' },
      { t: 'Fields `0` and `1` are set to 1 and 2', why: 'Drip never invents fields; only assignments make them.' },
      { t: 'A compile error', why: 'The compiler does not know whether `Point` will have an `init` when this line runs; it is checked at run time.' },
    ],
  },
  {
    q: 'Why does `print` show `E { y: 2, x: 1 }` after `e.y = 2; e.x = 1;`, even if `e.y` is assigned again later?',
    options: [
      { t: 'Fields are sorted backwards', why: 'They are not sorted at all.' },
      { t: 'The hash table happens to store them in that order', why: 'Hash order is unrelated to set order; printing uses a separate list.' },
      { t: 'Because `print` shows the newest field first', why: 'It shows the oldest first; `y` was set first.' },
      { t: '`set.prop` appends a name to `fieldOrder` only the first time the field is set', correct: true, why: '`Table.set` returns true only for a new key, so later assignments leave the order alone.' },
    ],
  },
];
