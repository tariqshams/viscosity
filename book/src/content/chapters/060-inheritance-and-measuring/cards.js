// Chapter 60 cards. Keys are stable ids: never rename them.

export const prompts = {
  'find-walk': {
    q: 'How does `findMethod` find an inherited method?',
    a: 'It checks the class’s own methods, then asks its superclass, which does the same, up the chain.',
  },
  override: {
    q: 'A subclass and its superclass both define `speak`. Which one does `sub.speak()` run?',
    a: 'The subclass’s: its own methods are checked first.',
  },
  'super-must-be-class': {
    q: 'When is `class B < A {}` with `let A = "x";` caught, and with what error?',
    a: 'At runtime, when the class statement runs: `Superclass must be a class.`',
  },
  'why-not-this-class': {
    q: 'Why can’t `super` mean “the superclass of `this`’s class”?',
    a: 'With A < B < C, a B method running on a C instance would get B again and call itself forever. super must depend on where the method was written.',
  },
  'super-env': {
    q: 'Where does the interpreter keep the value of `super`?',
    a: 'In an environment created when the subclass is declared, holding only `super`. The subclass’s methods capture it.',
  },
  'super-this-distance': {
    q: 'If `super` is at distance `d`, where is `this`?',
    a: 'At `d - 1`: the bind environment sits just inside the super environment.',
  },
  'zoo-batch': {
    q: 'Why is `zoo_batch`’s time useless for comparing the two engines?',
    a: 'It runs until 10 seconds of clock time pass, so both take about 10 s. The work done (its batch count) would be the measure.',
  },
  'one-run': {
    q: 'The benchmark file records one run per program on a shared cloud VM. What does that mean for small differences?',
    a: 'They might be noise. Treat them as a first look, not a verdict.',
  },
  'overhead-what': {
    q: 'What is interpreter overhead?',
    a: 'Work the interpreter does that the program didn’t ask for: dispatch, pointer-chasing, name lookups, allocation, type checks.',
  },
  'n-minus-2': {
    q: 'Roughly what does the tree-walker do to evaluate `n - 2`, besides the subtraction?',
    a: 'Three `evaluate` calls with a `switch` each, two Map lookups to find `n`, and type checks.',
  },
  chase: {
    q: 'Why is following references between tree nodes slow, even for a CPU that is otherwise fast?',
    a: 'Each load needs the address from the previous one, so the loads can’t overlap: pointer-chasing.',
  },
};

export const examples = {
  animals: {
    title: 'Inherit, override, super',
    lang: 'drip',
    code: `class Animal {
  init(name) { this.name = name; }
  speak() {
    print this.name + " makes a sound";
  }
  hello() { print "I am " + this.name; }
}

class Dog < Animal {
  speak() {
    super.speak();
    print this.name + " barks";
  }
}

let d = Dog("Rex");
d.hello();
d.speak();`,
  },
};

const shape = `class Shape {
  init(name) { this.name = name; }
  show() {
    print this.name;
    print this.area();
  }
}`;

const tail = `
  area() {
    return this.side * this.side;
  }
}
Square(3).show();`;

export const exercises = {
  square: {
    title: 'A square is a shape',
    lang: 'drip',
    prompt:
      '`Square` inherits from `Shape`, but `Square(3).show()` fails with `Undefined property \'name\'.` Fix `Square`’s `init` so the program prints `square` and then `9`. Don’t change `Shape`.',
    starter: `${shape}

class Square < Shape {
  init(side) {
    this.side = side;
  }${tail}`,
    solution: `${shape}

class Square < Shape {
  init(side) {
    super.init("square");
    this.side = side;
  }${tail}`,
    tests: `square
9`,
    hints: [
      '`Square` defines its own `init`, which overrides `Shape`’s. So `Shape`’s `init` never runs, and `name` is never set.',
      'You want to run the superclass’s `init` on this same instance, from inside `Square`’s `init`.',
      'Add `super.init("square");` as the first line of `Square`’s `init`.',
    ],
    walkthrough: `\`Square\` has its own \`init\`, so \`findMethod("init")\` stops at \`Square\` and \`Shape\`’s \`init\` never runs. Nothing sets \`this.name\`, and \`show\` fails when it reads it.

The fix is to call the overridden initializer explicitly:

\`\`\`
init(side) {
  super.init("square");
  this.side = side;
}
\`\`\`

- **\`super.init\`** looks up \`init\` starting at \`Shape\`, the superclass of the class this method is *written in*, and binds it to the current \`this\`. So \`Shape\`’s \`init\` sets \`name\` on the square.
- **\`this.area()\`** inside \`show\` is a normal method call on a \`Square\` instance, so it finds \`Square\`’s \`area\`, even though \`show\` was written in \`Shape\`. Methods are found from the instance’s class; only \`super\` is fixed by where it is written.

\`this.init("square")\` would be a trap: it finds \`Square\`’s own \`init\` again, which calls itself until the stack overflows.`,
    wrong: [
      {
        code: `${shape}

class Square < Shape {
  init(side) {
    this.init("square");
    this.side = side;
  }${tail}`,
        why: '`this.init` finds `Square`’s own `init`, the one already running, so it calls itself forever: a stack overflow. `super.init` starts the search at `Shape`.',
      },
      {
        code: `${shape}

class Square < Shape {
  init(side) {
    Shape.init("square");
    this.side = side;
  }${tail}`,
        why: 'A class isn’t an instance, so `Shape.init` is a runtime error: `Only instances have properties.` Use `super.init(...)`.',
      },
    ],
  },
  countVisits: {
    optional: true,
    title: 'Counting the walk',
    prompt:
      'A tiny tree-walker in plain JavaScript. Nodes are `{ kind: "num", value }`, `{ kind: "add", left, right }` or `{ kind: "mul", left, right }`. Write `evaluate(node, stats)` that returns the value **and** adds 1 to `stats.visits` for every node it evaluates. Then you can see how many visits a few operations cost.',
    starter: `function evaluate(node, stats) {
  if (node.kind === 'num') {
    return node.value;
  }
  const l = evaluate(node.left, stats);
  const r = evaluate(node.right, stats);
  if (node.kind === 'add') return l + r;
  return l * r;
}`,
    solution: `function evaluate(node, stats) {
  stats.visits++;
  if (node.kind === 'num') {
    return node.value;
  }
  const l = evaluate(node.left, stats);
  const r = evaluate(node.right, stats);
  if (node.kind === 'add') return l + r;
  return l * r;
}`,
    tests: `const num = (value) => ({ kind: 'num', value });
const add = (left, right) =>
  ({ kind: 'add', left, right });
const mul = (left, right) =>
  ({ kind: 'mul', left, right });
test('a single number is one visit', () => {
  const s = { visits: 0 };
  expect(evaluate(num(7), s)).toBe(7);
  expect(s.visits).toBe(1);
});
test('(1 + 2) * 3', () => {
  const s = { visits: 0 };
  const t = mul(add(num(1), num(2)), num(3));
  expect(evaluate(t, s)).toBe(9);
  expect(s.visits).toBe(5);
});
test('visits add up across calls', () => {
  const s = { visits: 0 };
  evaluate(add(num(1), num(1)), s);
  evaluate(add(num(1), num(1)), s);
  expect(s.visits).toBe(6);
});`,
    hints: [
      'Every call of `evaluate` is one visit, whatever the node’s kind.',
      'Count at the very top of the function, before the `if`, so number nodes are counted too.',
      'Add `stats.visits++;` as the first line.',
    ],
    walkthrough: `One line, at the right place:

\`\`\`js
function evaluate(node, stats) {
  stats.visits++;
  // ...unchanged...
}
\`\`\`

Counting first means every node is counted exactly once, including the numbers, which return early.

Now look at the result: \`(1 + 2) * 3\` does **two** arithmetic operations, but takes **five** calls of \`evaluate\`, each with its own checks of \`node.kind\`. That ratio is interpreter overhead in miniature. Drip’s real \`evaluate\` adds variable lookups through Maps on top. A bytecode VM would run this as a short list of instructions, \`push 1, push 2, add, push 3, mul\`, in one loop with no recursion.`,
    wrong: [
      {
        code: `function evaluate(node, stats) {
  if (node.kind === 'num') {
    return node.value;
  }
  stats.visits++;
  const l = evaluate(node.left, stats);
  const r = evaluate(node.right, stats);
  if (node.kind === 'add') return l + r;
  return l * r;
}`,
        why: 'Number nodes return before the counter, so only operators are counted: `(1 + 2) * 3` gives 2, not 5. Count first.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In Drip, `class Dog < Animal {}` has no methods. What does `Dog("Rex")` do?',
    options: [
      { t: 'A runtime error: `Dog` has no `init`', why: '`findMethod("init")` walks on to `Animal` and finds its `init`.' },
      { t: 'Makes a `Dog` instance and runs `Animal`’s `init` on it', correct: true, why: 'Inheritance: the lookup walks the superclass chain, and the method is bound to the new `Dog` instance.' },
      { t: 'Makes an `Animal` instance', why: 'Calling `Dog` makes a `Dog` instance; only the method comes from `Animal`.' },
      { t: 'Makes a `Dog` instance without running any `init`', why: '`Animal`’s `init` is found and run.' },
    ],
  },
  {
    q: 'A method written in class `B` (with `class B < A`) runs on an instance of `C`, where `class C < B`. What does `super` mean inside it?',
    options: [
      { t: '`B`', why: 'That is `C`’s superclass. Using it would make `B`’s method call itself.' },
      { t: '`C`', why: '`C` is the instance’s class, not a superclass at all.' },
      { t: '`A`', correct: true, why: '`super` is the superclass of the class the method was written in, `B`, which is `A`.' },
      { t: 'It depends on how the method was called', why: 'It is fixed by where the method was written, stored in the environment the method captured.' },
    ],
  },
  {
    q: 'Which of these is a *resolver* error, reported before anything runs?',
    options: [
      { t: '`class A < A {}`', correct: true, why: '`A class can\'t inherit from itself.` The resolver sees both names in the source.' },
      { t: '`let A = 1; class B < A {}`', why: 'The resolver can’t know what `A` will hold. It fails at runtime: `Superclass must be a class.`' },
      { t: 'Calling a method that no class in the chain defines', why: 'That is a runtime error: `Undefined property`.' },
      { t: '`super.m()` where the superclass has no `m`', why: 'Also found at runtime, when `findMethod` comes back empty.' },
    ],
  },
  {
    q: 'Why is `zoo_batch`’s time in the benchmark not a speed measurement?',
    options: [
      { t: 'The VM failed to compile it', why: 'That was `string_equality`, which hit the 256-constant limit.' },
      { t: 'It was only run once', why: 'Every program was run once. The problem with `zoo_batch` is how it decides when to stop.' },
      { t: 'It measures compile time only', why: 'The harness times the whole run, including compiling.' },
      { t: 'It runs for a fixed 10 seconds of clock time, whatever the engine', correct: true, why: 'So both engines take about 10 s. A faster engine finishes more batches, not sooner.' },
    ],
  },
  {
    q: 'Which is NOT one of the tree-walker’s sources of overhead described in this chapter?',
    options: [
      { t: 'A `switch` on the node kind every time a node is evaluated', why: 'That dispatch is a real cost, paid on every node, every time.' },
      { t: 'Hash-map lookups to find variables', why: 'Every variable read goes through at least one Map.' },
      { t: 'Re-parsing the source text on every loop iteration', correct: true, why: 'The source is scanned and parsed once. The cost is in walking the tree that results, again and again.' },
      { t: 'Allocating an environment for every call', why: 'Every call makes a new `Environment` with a new `Map`.' },
    ],
  },
  {
    q: 'How does pointer-chasing (chapter 27) show up in the tree-walker?',
    options: [
      { t: 'Following references from node to child node, and from environment to parent', correct: true, why: 'Each step needs the address loaded by the previous one, so the loads can’t overlap.' },
      { t: 'Reading the source string character by character', why: 'That is a scan through one contiguous string, the opposite of pointer-chasing, and it happens once.' },
      { t: 'Adding two numbers', why: 'The addition itself is a single instruction on values already loaded.' },
      { t: 'Printing output', why: 'Printing is slow for other reasons, and the benchmarks print very little.' },
    ],
  },
];
