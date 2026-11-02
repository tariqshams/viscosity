// Chapter 104 cards. Keys are stable ids: never rename them.

export const prompts = {
  'decl-no-run': {
    q: 'What does running the declaration `fn add(a, b) { ... }` do?',
    a: 'It makes a function value (the declaration plus the current environment) and defines `add` to hold it. The body does not run.',
  },
  'fn-value': {
    q: 'What does `print add;` show for a Drip function `add`?',
    a: '`fn add`. A function is an ordinary runtime value, and printing it runs nothing.',
  },
  'anon-fn': {
    q: 'How do you write a Drip function with no name, and what does `print` show for it?',
    a: '`fn (x) { ... }`, written where an expression goes. It prints as `fn`.',
  },
  'callable-what': {
    q: 'Which two kinds of Drip value can a call expression run?',
    a: 'Drip functions (made with `fn`) and native functions (like `clock` and `len`).',
  },
  'class-not-callable': {
    q: 'What happens in Drip if you write `Point(1, 2)` for a class `Point`?',
    a: "A runtime error: `cannot call a class: use 'new Point(...)'`. Instances are made with `new`.",
  },
  'call-order': {
    q: 'In a call expression, what is evaluated first: the callee or the arguments?',
    a: 'The callee, then the arguments from left to right, and only then is the callee checked and run.',
  },
  'fresh-env': {
    q: 'Why do two calls of the same Drip function never share their local variables?',
    a: 'Each call makes a brand-new environment for its parameters and locals.',
  },
  'parent-env': {
    q: 'What is the parent of the environment a Drip call makes?',
    a: 'The environment where the function was declared (its `closure`), not the caller’s environment.',
  },
};

export const examples = {
  callables: {
    title: 'What can be called',
    lang: 'drip',
    code: `fn hi() { print "hi"; }
let fs = [hi, fn () { print "yo"; }];
for f in fs {
  f();
}
print fs;
let n = 3;
n();`,
    expectError: true,
  },
};

export const exercises = {
  each: {
    lang: 'drip',
    title: 'A function that takes a function',
    prompt:
      'Declare a Drip function `each(xs, f)` that calls `f` once for every item of the list `xs`, in order, passing the item as the argument. The calls at the bottom (which use anonymous functions) must then print `10`, `20`, `30`, `a!` and `b!`.',
    starter: `# declare each here

each([1, 2, 3], fn (x) {
  print x * 10;
});
each(["a", "b"], fn (s) {
  print s + "!";
});`,
    solution: `fn each(xs, f) {
  for x in xs {
    f(x);
  }
}

each([1, 2, 3], fn (x) {
  print x * 10;
});
each(["a", "b"], fn (s) {
  print s + "!";
});`,
    tests: `10
20
30
a!
b!`,
    hints: [
      '`each` has two parameters: a list and a function. What should happen once for every item of the list?',
      'A `for x in xs { ... }` loop visits every item. Inside it, `f` is an ordinary variable holding a function, so you can call it like any function.',
      'The body is one loop: `for x in xs { f(x); }`.',
    ],
    walkthrough: `**How to think about it.** Read the calls at the bottom first: each one passes a list and an anonymous function, and expects that function to be run once per item. So \`each\` needs two parameters, the list and the function, and its job is a loop that hands each item to the function. Nothing about \`f\` is special: it is a parameter like any other, which happens to hold a function value, and a call expression accepts any variable that holds a callable.

**The solution, line by line.**

- \`fn each(xs, f) {\` declares a global function with two parameters, so its arity is 2. In the first call, \`xs\` holds the list \`[1, 2, 3]\` and \`f\` holds the anonymous function that prints \`x * 10\`.
- \`  for x in xs {\` runs its body once per item, with \`x\` holding the item.
- \`    f(x);\` is a call expression whose callee is the variable \`f\`. The interpreter looks \`f\` up (a function value), evaluates \`x\`, checks that it is a Drip function, makes a fresh environment for the anonymous function with its parameter (also called \`x\` in the first call, \`s\` in the second) holding the item, and runs its body, which prints.
- \`  }\` and \`}\` close the loop and the function.
- The two calls at the bottom then print \`10\`, \`20\`, \`30\`, and \`a!\`, \`b!\`.

**Common wrong attempts.**

- Writing \`f;\` instead of \`f(x);\` inside the loop: the name alone only *reads* the function value and throws it away, so nothing is printed. The brackets are what call it.
- Writing \`f(xs);\`: the whole list is passed instead of one item, and the first call tries \`[1, 2, 3] * 10\`, which stops with \`cannot use '*' on a list and a number\`.`,
    wrong: [
      {
        code: `fn each(xs, f) {
  for x in xs {
    f;
  }
}

each([1, 2, 3], fn (x) {
  print x * 10;
});
each(["a", "b"], fn (s) {
  print s + "!";
});`,
        why: '`f;` reads the function without calling it, so nothing is printed. Call it with the item: `f(x);`.',
      },
      {
        code: `fn each(xs, f) {
  for x in xs {
    f(xs);
  }
}

each([1, 2, 3], fn (x) {
  print x * 10;
});
each(["a", "b"], fn (s) {
  print s + "!";
});`,
        why: "This passes the whole list each time, so `x * 10` becomes `[1, 2, 3] * 10`: `cannot use '*' on a list and a number`.",
      },
    ],
  },
  squares: {
    optional: true,
    lang: 'drip',
    title: 'Your first Drip function',
    prompt:
      'The loop below calls `square`, which does not exist yet. Above it, declare a Drip function `square(n)` that prints `n * n`, so the program prints `1`, `4`, `9`, `16` and `25`.',
    starter: `# declare square here

for i in 1..6 {
  square(i);
}`,
    solution: `fn square(n) {
  print n * n;
}

for i in 1..6 {
  square(i);
}`,
    tests: `1
4
9
16
25`,
    hints: [
      'A Drip function starts with the keyword `fn`, then the name, then the parameters in brackets.',
      'The body is a block in braces, and it needs one statement: print the parameter times itself.',
      'Write `fn square(n) { print n * n; }` above the loop.',
    ],
    walkthrough: `**How to think about it.** The loop is already written and runs \`square(i)\` for \`i\` from 1 up to (but not including) 6, so all that is missing is a function called \`square\` with one parameter that prints its square. It must be declared before the loop, because Drip runs the program from top to bottom and a call looks the name up at the moment it runs.

**The solution, line by line.**

- \`fn square(n) {\` declares a global function \`square\` with one parameter, so its arity is 1. Running this line makes the function value and stores it under the name \`square\`; nothing is printed yet.
- \`  print n * n;\` is the body: it prints the parameter times itself.
- \`}\` ends the body.
- \`for i in 1..6 {\` runs its body with \`i\` set to 1, 2, 3, 4 and 5 in turn.
- \`  square(i);\` looks up \`square\` (found in the globals), evaluates \`i\`, checks that 1 argument matches arity 1, then makes a fresh environment with \`n\` holding the current \`i\` and runs the body there, printing \`1\`, then \`4\`, and so on up to \`25\`.
- \`}\` ends the loop.

**Common wrong attempts.**

- Declaring \`square\` *after* the loop: the loop runs first, and the very first call stops with \`undefined variable 'square'\`.
- Declaring \`fn square()\` with no parameter and printing \`i * i\` inside: the call \`square(i)\` fails the arity check with \`square() takes 0 arguments but got 1\` (and \`i\` belongs to the loop, which \`square\` cannot see anyway).`,
    wrong: [
      {
        code: `for i in 1..6 {
  square(i);
}

fn square(n) {
  print n * n;
}`,
        why: "The loop runs before the declaration, so the first call fails: `undefined variable 'square'`.",
      },
      {
        code: `fn square() {
  print i * i;
}

for i in 1..6 {
  square(i);
}`,
        why: '`square` takes no parameters, so `square(i)` fails the arity check: `square() takes 0 arguments but got 1`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: `What does this print?
\`\`\`
fn greet(name) {
  print "hi " + name;
}
print "start";
\`\`\``,
    options: [
      { t: '`hi none` then `start`', why: 'The body only runs when `greet` is called, and it never is.' },
      { t: '`start`', correct: true, why: 'The declaration only defines `greet` as a function value. The one `print` statement that runs prints `start`.' },
      { t: 'A runtime error: `name` is undefined', why: 'Nothing evaluates `name`, because the body never runs.' },
      { t: '`fn greet` then `start`', why: 'A declaration prints nothing. You would see `fn greet` only by printing `greet`.' },
    ],
  },
  {
    q: 'Which of these can a Drip call expression run?',
    options: [
      { t: 'A class, as in `Point(1, 2)`', why: "Classes are not callable: Drip stops with `cannot call a class: use 'new Point(...)'`." },
      { t: 'The string `"add"`', why: 'A string has no code to run: `cannot call a string`.' },
      { t: 'A list of functions', why: 'The list is not a function, even if its items are: `cannot call a list`. Call an item instead: `fs[0]()`.' },
      { t: '`len`', correct: true, why: '`len` is a native function, which is one of the two kinds of callable.' },
    ],
  },
  {
    q: 'When `add(1, 2)` is called, where are `a` and `b` defined?',
    options: [
      { t: 'In a new environment made for this call', correct: true, why: '`callFunction` makes a fresh environment, defines each parameter in it, and runs the body there.' },
      { t: 'In the globals', why: 'Then two calls, or a recursive call, would overwrite each other’s parameters.' },
      { t: 'In the caller’s environment', why: 'The caller’s variables are untouched. The new environment’s parent is the function’s own stored environment.' },
      { t: 'In the function value itself', why: 'The function value holds the declaration and an environment, not argument values; those belong to one call.' },
    ],
  },
  {
    q: `What does this print?
\`\`\`
fn show() { print x; }
let x = "global";
{
  let x = "local";
  show();
}
\`\`\``,
    options: [
      { t: '`local`', why: 'That would happen if the call’s environment hung off the caller’s. Drip uses where the function was declared.' },
      { t: 'A runtime error: `x` is undefined', why: 'By the time `show()` runs, the global `x` exists.' },
      { t: '`global`', correct: true, why: 'The call’s environment hangs off the environment `show` was declared in, the globals, so the lookup never sees the block’s `x`.' },
      { t: '`none`', why: '`x` holds a string in both places.' },
    ],
  },
  {
    q: `What does this print?
\`\`\`
let f = fn (x) { print x + 1; };
let g = f;
g(1);
print g;
\`\`\``,
    options: [
      { t: '`2` then `fn f`', why: 'The function was never given a name: `let f = ...` names the variable, not the function, so it prints as plain `fn`.' },
      { t: '`2` then `fn`', correct: true, why: '`g` holds the same anonymous function as `f`, so `g(1)` prints `2`; printing an anonymous function shows `fn`.' },
      { t: 'A runtime error: `g` is not a function', why: '`let g = f;` copies the function value, and a variable holding a function can be called like any other.' },
    ],
  },
];
