// Chapter 309 cards. Keys are stable ids: never rename them.

export const prompts = {
  'mx-what': {
    q: 'What is a macro, in one sentence?',
    a: 'A rule run inside the compiler that is handed pieces of code (not values) and returns code to put in their place.',
  },
  'mx-fn': {
    q: 'Why does `unless(xs === null, xs.length)` crash when `unless` is a function?',
    a: 'Arguments are evaluated before the call, so `xs.length` runs (on `null`) before `unless` gets a chance to skip it.',
  },
  'mx-when': {
    q: 'When does macro expansion happen, compared with type checking and code generation?',
    a: 'Before them: they only ever see the fully expanded program.',
  },
  'mx-text': {
    q: 'With `#define SQ(x) x * x`, what does `SQ(n + 1)` become, and why is it wrong?',
    a: '`n + 1 * n + 1`: the preprocessor pastes tokens, so `*` binds `1 * n` and the result is `2n + 1`, not `(n + 1)²`.',
  },
  'mx-again': {
    q: 'Why does an expander look at the code a macro produced again?',
    a: 'The expansion may contain more macro calls (from the template or from the arguments), and expansion only stops when none are left.',
  },
  'qq-what': {
    q: 'What is a quasiquote?',
    a: 'A template of code where everything stands for itself except the holes (unquotes), which are filled with computed values.',
  },
  'qq-splice': {
    q: 'In Lisp, what is the difference between `,xs` and `,@xs` inside a backquote, if `xs` is `(2 3)`?',
    a: '`,xs` inserts the list as one element, `(2 3)`; `,@xs` splices its elements in, `2 3`.',
  },
  'qq-strings': {
    q: 'A JavaScript template literal also has holes. Why is it a weaker tool for generating code than a tree quasiquote?',
    a: 'Its holes are filled with strings, so the result is text, with the same grouping problems as C macros; a tree hole keeps each argument whole.',
  },
};

export const examples = {
  expander: {
    title: 'A macro expander in ten lines',
    code: `// a program is a tree of arrays
const macros = {
  unless: (c, body) =>
    ['if', ['not', c], body],
  twice: (b) => ['do', b, b],
};
function expand(e) {
  if (!Array.isArray(e)) return e;
  const m = macros[e[0]];
  if (m) {
    return expand(m(...e.slice(1)));
  }
  return e.map(expand);
}
const prog = ['unless', ['>', 'n', 0],
  ['twice', ['log', 'n']]];
const out = expand(prog);
console.log(JSON.stringify(out));`,
  },
};

export const exercises = {
  fill: {
    title: 'Fill a quasiquote template',
    prompt:
      'Code is a tree of arrays, and anything that is not an array (a string or number) stands for itself. In a template, `[\'$\', name]` is a hole, replaced by `env[name]`; and an element `[\'$...\', name]` inside an array is a splicing hole, replaced by the *elements* of the array `env[name]`. Write `fill(tpl, env)`, which returns a new tree with every hole filled. Do not change the template (it is used again and again), and do not look for holes inside the values you put in.',
    starter: `function fill(tpl, env) {
  return tpl;
}`,
    solution: `function fill(tpl, env) {
  if (!Array.isArray(tpl)) return tpl;
  if (tpl[0] === '$') {
    return env[tpl[1]];
  }
  const out = [];
  for (const x of tpl) {
    const splice = Array.isArray(x)
      && x[0] === '$...';
    if (splice) {
      out.push(...env[x[1]]);
    } else {
      out.push(fill(x, env));
    }
  }
  return out;
}`,
    tests: `const h = (n) => ['$', n];
const sp = (n) => ['$...', n];
test('no holes: same shape', () => {
  expect(fill(['+', 'n', 1], {}))
    .toEqual(['+', 'n', 1]);
});
test('a hole on its own', () => {
  expect(fill(h('x'), { x: 7 })).toBe(7);
});
test('the unless template', () => {
  const tpl = ['if', ['not', h('c')], h('b')];
  const env = { c: ['>', 'n', 0],
    b: ['log', 'n'] };
  expect(fill(tpl, env)).toEqual(
    ['if', ['not', ['>', 'n', 0]],
      ['log', 'n']]);
});
test('splicing puts the elements in', () => {
  const tpl = ['do', sp('xs'), 'end'];
  expect(fill(tpl, { xs: ['a', 'b'] }))
    .toEqual(['do', 'a', 'b', 'end']);
  expect(fill(tpl, { xs: [] }))
    .toEqual(['do', 'end']);
});
test('a plain hole keeps a list whole', () => {
  expect(fill(['do', h('xs')], { xs: [1, 2] }))
    .toEqual(['do', [1, 2]]);
});
test('values are not filled again', () => {
  expect(fill(['q', h('a')], { a: h('b') }))
    .toEqual(['q', ['$', 'b']]);
});
test('the template is not changed', () => {
  const tpl = ['f', h('x')];
  fill(tpl, { x: 1 });
  expect(fill(tpl, { x: 2 })).toEqual(['f', 2]);
});`,
    hints: [
      'This is a tree walk: decide what to do with a leaf, with a hole, and with an ordinary array node.',
      'A non-array is returned as it is. An array whose first element is `\'$\'` is a hole: return `env[name]` without walking into it. Any other array is a node: build a new array from its elements.',
      'For each element `x` of a node: if `x` is an array starting with `\'$...\'`, push all of `env[x[1]]` with `out.push(...env[x[1]])`; otherwise push `fill(x, env)`.',
    ],
    walkthrough: `**How to think about it.** A template is a tree with three kinds of thing in it: leaves (strings and numbers), holes, and ordinary nodes (arrays). Leaves stand for themselves, holes are swapped for values, and ordinary nodes are copied with their children filled. The one subtle kind is the splicing hole: it does not replace *itself* with one value, it replaces itself with *several* elements of its parent, so it has to be handled by the parent while the parent builds its list of children. And the rules ask for two kinds of restraint: build a new tree rather than changing the template, and never look inside what you have put in (the values come from the macro's caller, and they are code to be inserted, not more template).

**The solution, line by line.**

- \`function fill(tpl, env) {\` takes a template and the values for its holes, by name.
- \`if (!Array.isArray(tpl)) return tpl;\` a leaf such as \`'if'\` or \`1\` stands for itself.
- \`if (tpl[0] === '$') { return env[tpl[1]]; }\` a hole is replaced by its value, and we return at once, so the value is never walked: that is what the test "values are not filled again" checks, since there the value is itself shaped like a hole.
- \`const out = [];\` an ordinary node: we build a new array, which leaves the template untouched for its next use.
- \`for (const x of tpl) {\` goes through the node's elements in order.
- \`const splice = Array.isArray(x) && x[0] === '$...';\` (two lines) asks whether this element is a splicing hole.
- \`if (splice) { out.push(...env[x[1]]); }\` pushes each element of the value separately, so \`['do', ['$...', 'xs'], 'end']\` with \`xs = ['a', 'b']\` becomes \`['do', 'a', 'b', 'end']\`, and an empty \`xs\` leaves nothing behind.
- \`else { out.push(fill(x, env)); }\` any other element is filled recursively: it may be a leaf, a hole, or a node with holes deeper down, such as \`['not', ['$', 'c']]\` in the \`unless\` template.
- \`return out;\` the filled copy.

This is exactly Lisp's backquote with \`,\` and \`,@\`, on arrays: \`['$', 'c']\` plays the part of \`,c\` and \`['$...', 'xs']\` the part of \`,@xs\`.

**Common wrong attempts.**

- Treating a splice like a plain hole pushes the list as one element, giving \`['do', ['a', 'b'], 'end']\`.
- Returning \`fill(env[name], env)\` for a hole walks into the inserted code and fills things the caller never meant as holes.
- Assigning into \`tpl\` (\`tpl[i] = ...\`) works once, but the second use of the template finds its holes already gone.`,
    wrong: [
      {
        code: `function fill(tpl, env) {
  if (!Array.isArray(tpl)) return tpl;
  if (tpl[0] === '$') {
    return env[tpl[1]];
  }
  return tpl.map((x) => fill(x, env));
}`,
        why: 'There is no splicing: `[\'$...\', \'xs\']` is copied as an ordinary node instead of being replaced by the elements of `xs`.',
      },
      {
        code: `function fill(tpl, env) {
  if (!Array.isArray(tpl)) return tpl;
  if (tpl[0] === '$') {
    return fill(env[tpl[1]], env);
  }
  const out = [];
  for (const x of tpl) {
    if (Array.isArray(x)
      && x[0] === '$...') {
      out.push(...env[x[1]]);
    } else {
      out.push(fill(x, env));
    }
  }
  return out;
}`,
        why: 'It fills the inserted values as if they were template, so a value shaped like a hole is replaced (here by `undefined`).',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which of these can be written as a macro but not as an ordinary function?',
    options: [
      { t: 'A function that adds two numbers', why: 'A plain function does that perfectly well.' },
      { t: 'An `assert(x > 0)` that prints the text `x > 0` when it fails', correct: true, why: 'A function only receives the value `false`; a macro receives the code itself and can turn it into a string.' },
      { t: 'A function that returns the larger of two numbers', why: 'Both arguments are needed anyway, so evaluating them first is fine.' },
    ],
  },
  {
    q: 'With `#define SQ2(x) ((x) * (x))`, why do the extra brackets matter?',
    options: [
      { t: 'They make the macro run faster', why: 'Brackets change grouping, not speed.' },
      { t: 'They are required by C’s syntax for macros', why: '`#define SQ(x) x * x` is legal; it is just wrong for `SQ(n + 1)`.' },
      { t: 'The preprocessor pastes tokens, so without them an argument such as `n + 1` can be split by the operators around it', correct: true, why: 'With them, `SQ2(n + 1)` is `((n + 1) * (n + 1))`, as gcc -E showed.' },
      { t: 'They stop the argument being evaluated twice', why: 'They do not: `SQ2(i++)` still increments twice. That is a separate pitfall.' },
    ],
  },
  {
    q: 'Rust’s `sq!(n + 1)`, with `$x:expr`, prints 9 for `n = 2`. Why does it not suffer from C’s problem?',
    options: [
      { t: 'The `expr` fragment captures the argument as one expression tree, which stays whole in each hole', correct: true, why: 'Tree macros paste trees, so the grouping cannot change.' },
      { t: 'Rust evaluates the argument before calling the macro', why: 'Then it would not be a macro; it receives code, as the expanded output shows.' },
      { t: 'Rust adds brackets to every macro argument as text', why: 'The brackets in `-Zunpretty=expanded` are only printed to show the tree’s grouping.' },
    ],
  },
  {
    q: 'An expansion contains another macro call. What does the expander do?',
    options: [
      { t: 'Leaves it for the type checker', why: 'The type checker never sees macro calls.' },
      { t: 'Reports an error: macros may not produce macros', why: 'They may; `println!` expands to code using `format_args!`.' },
      { t: 'Ignores it', why: 'Then the compiler would meet a call it cannot compile.' },
      { t: 'Expands it too, and keeps going until no macro calls are left', correct: true, why: 'Expansion repeats on its own output.' },
    ],
  },
  {
    q: 'In Lisp, with `ys` equal to `(2 3)`, what is `` `(a ,@ys b) ``?',
    options: [
      { t: '`(a (2 3) b)`', why: 'That is what `,ys` would give.' },
      { t: '`(a ys b)`', why: 'Without a comma `ys` would stand for itself; `,@` evaluates it.' },
      { t: '`(a 2 3 b)`', correct: true, why: '`,@` splices the elements of the list in place.' },
    ],
  },
];
