// Chapter 108 cards. Keys are stable ids: never rename them.

export const prompts = {
  'call-parent-question': {
    q: 'A call makes a fresh environment. What is the key design question about it, for closures?',
    a: 'Which environment should be its parent: the globals, the caller’s, or the one where the function was made.',
  },
  'parent-globals': {
    q: 'If every call’s environment had the globals as its parent, what would `count` inside `makeCounter` see?',
    a: 'Not `n`: the lookup would go from the call straight to the globals, giving `undefined variable \'n\'`.',
  },
  'parent-caller': {
    q: 'What is the rule called where a call’s parent is the *caller’s* environment, and does Drip use it?',
    a: 'Dynamic scope. Drip does not use it; it uses lexical scope.',
  },
  'closure-field': {
    q: 'What does the `closure` field of a `DripFunction` hold?',
    a: 'The environment that was current when the function value was made.',
  },
  'which-env': {
    q: 'When `count` is declared inside a call of `makeCounter`, which environment does it capture?',
    a: 'That call’s environment (holding `n`), because it is the current one when the declaration runs.',
  },
  'variable-not-value': {
    q: '`let x = 1; let f = fn () { print x; }; x = 2; f();` What is printed, and why?',
    a: '`2`. A closure captures the variable itself, so it reads its current value.',
  },
  'loop-fresh': {
    q: 'Why do functions made in a Drip `for` loop remember different values of the loop variable?',
    a: 'Each pass makes a brand-new environment holding that pass’s value, and each function captures its own pass’s.',
  },
  'while-shared': {
    q: 'Why do functions made in a `while` loop all see the same counter?',
    a: 'The counter is one variable declared outside the loop, so every function’s chain leads to it.',
  },
};

export const examples = {
  'two-counters': {
    title: 'Two counters, two n’s',
    lang: 'drip',
    code: `fn makeCounter() {
  let n = 0;
  return fn () {
    n += 1;
    return n;
  };
}

let a = makeCounter();
let b = makeCounter();
print a();
print a();
print b();
print a;`,
  },
};

export const exercises = {
  fixLoop: {
    lang: 'drip',
    title: 'One value each',
    prompt:
      'This program saves three functions from a `while` loop, but every one prints `4`. Change the loop so that the three calls at the end print `1`, `2` and `3`. Keep the three calls at the end as they are.',
    starter: `let fs = [];
let i = 1;
while i < 4 {
  push(fs, fn () { print i; });
  i += 1;
}

fs[0]();
fs[1]();
fs[2]();`,
    solution: `let fs = [];
for i in 1..4 {
  push(fs, fn () { print i; });
}

fs[0]();
fs[1]();
fs[2]();`,
    tests: `1
2
3`,
    hints: [
      'All three functions capture environments that lead to the same `i`. What value has it reached when they are finally called?',
      'You need a fresh variable for every pass. Which Drip loop makes one for you?',
      'Replace the `while` (and the `let i` and `i += 1`) with `for i in 1..4 { push(fs, fn () { print i; }); }`.',
    ],
    walkthrough: `**How to think about it.** Ask what each saved function will look up when it finally runs. All three were made in the loop body, whose environments all have the same parent chain out to the one global \`i\`. The functions do not run until the loop is over, and by then \`i\` is 4, so each looks up \`i\` and finds 4. To get 1, 2 and 3, each function needs its *own* variable, made fresh on each pass, and a Drip \`for\` loop does exactly that.

**The solution, line by line.**

- \`let fs = [];\` makes the list that will hold the functions.
- \`for i in 1..4 {\` runs the body with \`i\` set to 1, 2 and 3. On each pass \`forLoop\` makes a new environment holding that pass's \`i\`, and a fresh body environment inside it.
- \`  push(fs, fn () { print i; });\` makes an anonymous function, which captures the current body environment (whose parent holds this pass's \`i\`), and pushes it onto the list.
- \`}\` ends the loop. Three function values now exist, each with a different captured chain.
- \`fs[0]();\`, \`fs[1]();\` and \`fs[2]();\` call them in turn. Each lookup of \`i\` goes from the call's environment to the captured body environment and then to its own pass's loop environment, finding 1, then 2, then 3.

(Another correct fix keeps the \`while\` and adds \`let mine = i;\` at the top of the body, capturing \`mine\` instead: the body gets a fresh environment on every pass, so each \`mine\` is a different variable.)

**Common wrong attempts.**

- Adding \`let mine = i;\` *before* the loop instead of inside its body: that is still one variable, shared by all three, and it holds 1, so all three print 1.
- Moving the \`i += 1;\` above the \`push\`: every function still shares the one \`i\`, which still ends at 4.`,
    wrong: [
      {
        code: `let fs = [];
let i = 1;
let mine = i;
while i < 4 {
  push(fs, fn () { print mine; });
  i += 1;
}

fs[0]();
fs[1]();
fs[2]();`,
        why: '`mine` is declared once, outside the loop, so all three share it, and it is 1: they print `1`, `1`, `1`.',
      },
      {
        code: `let fs = [];
let i = 1;
while i < 4 {
  i += 1;
  push(fs, fn () { print i; });
}

fs[0]();
fs[1]();
fs[2]();`,
        why: 'Still one shared `i`, which ends at 4 before any function runs, so all three print `4`.',
      },
    ],
  },
  accumulator: {
    optional: true,
    lang: 'drip',
    title: 'A running total',
    prompt:
      'Write `fn makeTotal()` that returns an anonymous function taking one number, adding it to a running total kept in the closure, and returning the new total. Two totals made by separate calls must not share. The program must print `5`, `8`, `10` and `13`.',
    starter: `fn makeTotal() {
  # your code here
}

let t = makeTotal();
let u = makeTotal();
print t(5);
print t(3);
print u(10);
print t(5);`,
    solution: `fn makeTotal() {
  let sum = 0;
  return fn (x) {
    sum += x;
    return sum;
  };
}

let t = makeTotal();
let u = makeTotal();
print t(5);
print t(3);
print u(10);
print t(5);`,
    tests: `5
8
10
13`,
    hints: [
      'The total has to survive between calls of the returned function, so it cannot be a local of that function. Where else can it live?',
      'Declare `let sum = 0;` in `makeTotal`, then return an anonymous function that changes `sum`.',
      'The returned function is `fn (x) { sum += x; return sum; }`.',
    ],
    walkthrough: `**How to think about it.** A variable declared inside the returned function would be made fresh on every call and start from 0 each time. The total must live one level out, in the environment of the call of \`makeTotal\`, which the returned function captures. Each call of \`makeTotal\` makes a separate environment, so \`t\` and \`u\` get separate totals.

**The solution, line by line.**

- \`fn makeTotal() {\` declares the maker.
- \`  let sum = 0;\` makes the total in this call's environment.
- \`  return fn (x) {\` makes an anonymous function, which captures this call's environment, and returns it.
- \`    sum += x;\` finds \`sum\` one step out (in the captured environment) and adds the argument.
- \`    return sum;\` returns the new total.
- \`  };\` ends the anonymous function and the \`return\` statement, and \`}\` ends \`makeTotal\`.
- \`t(5)\` gives 5 and \`t(3)\` gives 8, because both change \`t\`'s \`sum\`; \`u(10)\` gives 10 from its own \`sum\`; and \`t(5)\` gives 13.

**Common wrong attempts.**

- Declaring \`let sum = 0;\` inside the anonymous function: every call starts again from 0, so the program prints 5, 3, 10, 5.
- Declaring \`sum\` as a global, outside \`makeTotal\`: then \`t\` and \`u\` share it, and \`u(10)\` prints 18.`,
    wrong: [
      {
        code: `fn makeTotal() {
  return fn (x) {
    let sum = 0;
    sum += x;
    return sum;
  };
}

let t = makeTotal();
let u = makeTotal();
print t(5);
print t(3);
print u(10);
print t(5);`,
        why: '`sum` is made fresh on every call, so nothing adds up: it prints `5`, `3`, `10`, `5`.',
      },
      {
        code: `let sum = 0;
fn makeTotal() {
  return fn (x) {
    sum += x;
    return sum;
  };
}

let t = makeTotal();
let u = makeTotal();
print t(5);
print t(3);
print u(10);
print t(5);`,
        why: 'One global `sum` is shared by `t` and `u`, so `u(10)` prints `18`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: `What does this print?
\`\`\`
fn outer() {
  let x = "outer";
  return fn () { print x; };
}
let x = "global";
let f = outer();
f();
\`\`\``,
    options: [
      { t: '`global`', why: 'That would be the caller’s view (dynamic scope). Drip looks in the environment where the function was made.' },
      { t: '`outer`', correct: true, why: 'The anonymous function captured the call of `outer`’s environment, where `x` is `"outer"`.' },
      { t: 'A runtime error, because `outer` has returned', why: 'The captured environment is still there, because the function refers to it.' },
    ],
  },
  {
    q: 'Which environment becomes the parent of the environment a Drip call makes?',
    options: [
      { t: 'The globals, always', why: 'Then nested functions could never see their maker’s locals.' },
      { t: 'The caller’s current environment', why: 'That is dynamic scope, which Drip does not use.' },
      { t: 'The function’s captured environment (its `closure` field)', correct: true, why: '`callFunction` does `new Environment(f.closure)`.' },
    ],
  },
  {
    q: `What does this print?
\`\`\`
let n = 1;
let show = fn () { print n; };
n = 5;
show();
\`\`\``,
    options: [
      { t: '`5`', correct: true, why: 'The closure captured the variable `n`, not the value 1, so it reads the current value.' },
      { t: '`1`', why: 'That would be true if closures copied values when they were made. They capture variables.' },
      { t: '`none`', why: '`n` holds a number the whole time.' },
    ],
  },
  {
    q: `What does this print?
\`\`\`
let fs = [];
for i in 0..3 {
  push(fs, fn () { print i; });
}
fs[1]();
\`\`\``,
    options: [
      { t: '`3`', why: 'That would happen if all passes shared one `i`. Each pass of a Drip `for` gets its own.' },
      { t: '`2`', why: '`fs[1]` is the second function, made when `i` was 1.' },
      { t: '`1`', correct: true, why: 'Each pass makes a fresh environment for `i`, and `fs[1]` captured the pass where `i` was 1.' },
    ],
  },
  {
    q: 'Where does the anonymous function in `fn () { print i; }` store the environment it captures?',
    options: [
      { t: 'In the `closure` field of the `DripFunction` made when the expression is evaluated', correct: true, why: 'The `function` case of `evaluate` does `new DripFunction(e.fn, this.env, false)`.' },
      { t: 'In the syntax tree node for the expression', why: 'The node is shared by every evaluation; each evaluation makes its own function value with its own environment.' },
      { t: 'Nowhere: anonymous functions cannot be closures', why: 'They are closures exactly like named ones.' },
    ],
  },
];
