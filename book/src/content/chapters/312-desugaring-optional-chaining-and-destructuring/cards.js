// Chapter 311b cards. Keys are stable ids: never rename them.

export const prompts = {
  'oc-what': {
    q: 'What does `a?.b` give when `a` is `null` or `undefined`, and otherwise?',
    a: '`undefined` (without throwing) when `a` is nullish; otherwise the same as `a.b`.',
  },
  'oc-and': {
    q: 'Why is `user && user.score` not a correct lowering of `user?.score`?',
    a: '`&&` stops at any falsy value (`0`, `\'\'`, `false`), not only at `null` and `undefined`; it also repeats `user`.',
  },
  'oc-temp': {
    q: 'Why does the lowering of `e?.p` store `e` in a temporary?',
    a: 'So `e` is evaluated once: if `e` were a call such as `getUser()`, testing it and then reading from it would call it twice.',
  },
  'oc-chain': {
    q: 'If `a` is `null`, does `a?.b.c` throw when it reaches `.c`?',
    a: 'No: when the test succeeds the whole rest of the chain is skipped, so the result is `undefined`.',
  },
  'oc-call': {
    q: 'Why does TypeScript lower `a.b?.()` to `_a.call(a)` rather than `_a()`?',
    a: 'A method call must keep `a` as `this`; calling the function on its own from a temporary would lose it.',
  },
  'ds-what': {
    q: 'What does `const { x, y } = o` lower to?',
    a: 'Two plain reads: `const x = o.x; const y = o.y;` (V8 compiles it to two `GetNamedProperty` instructions).',
  },
  'ds-default': {
    q: 'In `const { y = 1 } = o`, when is the default `1` used?',
    a: 'Only when `o.y` is `undefined` (not when it is `null`); the default expression is evaluated only then.',
  },
  'ds-nested': {
    q: 'Why does `const { pos: { lat } } = {}` throw a `TypeError`?',
    a: 'The nested pattern lowers to `o.pos.lat`, and `o.pos` is `undefined`, so it reads a property of `undefined`.',
  },
  'ds-array': {
    q: 'Why is lowering `const [p, q] = xs` to `xs[0]`, `xs[1]` only right for arrays?',
    a: 'Array destructuring uses the iterator protocol, so it works on any iterable (a `Set`, a generator); indexing does not.',
  },
};

export const examples = {
  'lower-pattern': {
    title: 'Lowering a destructuring pattern',
    code: `// parts: 'name', [name, default]
// or [key, [nested pattern]]
const out = [];
function read(name, e) {
  out.push(\`const \${name} = \${e};\`);
}
function lower(pat, src) {
  for (const p of pat) {
    if (typeof p === 'string') {
      read(p, \`\${src}.\${p}\`);
    } else if (Array.isArray(p[1])) {
      lower(p[1], \`\${src}.\${p[0]}\`);
    } else {
      const [k, d] = p;
      read('_' + k, \`\${src}.\${k}\`);
      read(k, \`_\${k} === undefined\`
        + \` ? \${d} : _\${k}\`);
    }
  }
}
lower(['x', ['y', 1],
  ['pos', ['lat']]], 'o');
console.log(out.join('\\n'));
const run = new Function('o',
  out.join('\\n')
    + ';return [x, y, lat];');
const o = { x: 3, pos: { lat: 51.5 } };
console.log(run(o));`,
  },
};

export const exercises = {
  'lower-chain': {
    title: 'Lower an optional chain',
    prompt:
      'Write `lowerChain(base, links)`, which returns JavaScript source for a chain without `?.`. `base` is the source of the starting expression (such as `\'a\'` or `\'f()\'`), and `links` is an array of strings, each `\'.name\'` or `\'?.name\'`. A `.name` link is appended as it is. A `?.name` link uses the next temporary, `_t0`, `_t1`, … in order, and produces `(_tN = X) == null ? undefined : REST`, where `X` is the code so far and `REST` is the rest of the chain lowered starting from `_tN.name`. For example `lowerChain(\'a\', [\'?.b\', \'.c\'])` is `(_t0 = a) == null ? undefined : _t0.b.c`. The tests also run your code, with the temporaries declared.',
    starter: `function lowerChain(base, links) {
  return base + links.join('');
}`,
    solution: `function lowerChain(base, links) {
  let n = 0;
  function go(cur, i) {
    if (i === links.length) return cur;
    const l = links[i];
    if (l.startsWith('?.')) {
      const t = '_t' + n++;
      const rest = go(t + l.slice(1),
        i + 1);
      return \`(\${t} = \${cur}) == null\`
        + \` ? undefined : \${rest}\`;
    }
    return go(cur + l, i + 1);
  }
  return go(base, 0);
}`,
    tests: `const ev = (code, env) => new Function(
  ...Object.keys(env),
  'let _t0, _t1, _t2;\\nreturn ' + code + ';',
)(...Object.values(env));
test('no ?. at all', () => {
  expect(lowerChain('a', ['.b', '.c']))
    .toBe('a.b.c');
});
test('one ?., then the rest inside', () => {
  expect(lowerChain('a', ['?.b', '.c']))
    .toBe('(_t0 = a) == null ? undefined : _t0.b.c');
});
test('two ?. use two temporaries', () => {
  expect(lowerChain('a', ['?.b', '?.c'])).toBe(
    '(_t0 = a) == null ? undefined : '
    + '(_t1 = _t0.b) == null ? undefined : _t1.c');
});
test('a whole chain gives the value', () => {
  const code = lowerChain('a', ['?.b', '.c']);
  expect(ev(code, { a: { b: { c: 1 } } })).toBe(1);
});
test('null and undefined stop the chain', () => {
  const code = lowerChain('a', ['?.b', '.c']);
  expect(ev(code, { a: null })).toBe(undefined);
  expect(ev(code, { a: undefined })).toBe(undefined);
});
test('an empty string is not nullish', () => {
  const code = lowerChain('s', ['?.length']);
  expect(ev(code, { s: '' })).toBe(0);
});
test('the base is evaluated once', () => {
  let calls = 0;
  const f = () => { calls++; return { x: 5 }; };
  const code = lowerChain('f()', ['?.x']);
  expect(ev(code, { f })).toBe(5);
  expect(calls).toBe(1);
});`,
    hints: [
      'Work through the links from left to right, carrying the code for "the value so far". A `.name` link only appends to it.',
      'A `?.` link needs a new temporary name and needs to know the code for *everything after it*, which goes in the "else" branch. Recursion gives you that: lower the rest first, starting from `_tN.name`, then wrap it.',
      'Write `go(cur, i)`: if `i === links.length` return `cur`; for a plain link return `go(cur + l, i + 1)`; for `?.name` make `t = \'_t\' + n++`, compute `rest = go(t + l.slice(1), i + 1)` and return `` `(${t} = ${cur}) == null ? undefined : ${rest}` ``.',
    ],
    walkthrough: `**How to think about it.** The lowering of \`X?.name REST\` has a fixed shape, \`(t = X) == null ? undefined : …\`, and what goes in the gap is "the rest of the chain, continuing from \`t.name\`". So the natural way to build it is recursive: walk the links with the code built so far; a plain link just extends that code; a \`?.\` link stops, picks a temporary, builds the rest of the chain (starting from the temporary), and wraps it in the test. The temporary is what makes the base run once: \`X\` appears exactly one time in the output, inside the assignment.

**The solution, line by line.**

- \`function lowerChain(base, links) {\` takes the starting code and the list of links.
- \`let n = 0;\` counts temporaries, so the first \`?.\` gets \`_t0\`, the next \`_t1\`.
- \`function go(cur, i) {\` lowers the links from index \`i\` onward, given the code \`cur\` for the value so far.
- \`if (i === links.length) return cur;\` no links left: the code so far is the answer.
- \`const l = links[i];\` the next link, such as \`'.c'\` or \`'?.b'\`.
- \`if (l.startsWith('?.')) {\` an optional link.
- \`const t = '_t' + n++;\` takes the next temporary name; \`n++\` gives the old value and then adds one.
- \`const rest = go(t + l.slice(1), i + 1);\` (two lines): \`l.slice(1)\` turns \`'?.b'\` into \`'.b'\`, so the rest of the chain continues from \`_t0.b\`, and every later link, plain or optional, ends up inside \`rest\`. That is why \`a?.b.c\` skips \`.c\` as well when \`a\` is \`null\`.
- The \`return\` that follows (two lines) builds the text \`(_t0 = a) == null ? undefined : \` followed by the rest: it stores the value so far in the temporary, tests it for \`null\` or \`undefined\` (\`== null\` is true for exactly those two), and puts the rest in the other branch. The assignment is in brackets because \`=\` binds more loosely than \`==\`.
- \`return go(cur + l, i + 1);\` a plain link is appended and the walk goes on.
- \`return go(base, 0);\` starts with the base and the first link.

For \`['?.b', '?.c']\` the inner call returns \`(_t1 = _t0.b) == null ? undefined : _t1.c\`, and the outer call wraps it, giving the nested conditional in the test; because \`? :\` groups to the right, no extra brackets are needed.

**Common wrong attempts.**

- Testing with \`&&\` (\`a && a.b\`) gives \`''\` instead of \`0\` for \`s?.length\` when \`s\` is \`''\`: \`&&\` stops at every falsy value.
- Writing \`X == null ? undefined : X.name\` repeats \`X\`, so a base such as \`f()\` is called twice.
- Wrapping only the next link, \`(a == null ? undefined : a.b).c\`, throws when \`a\` is \`null\`: the rest of the chain must go inside the branch.`,
    wrong: [
      {
        code: `function lowerChain(base, links) {
  let code = base;
  for (const l of links) {
    if (l.startsWith('?.')) {
      code = \`\${code} && \${code}\`
        + l.slice(1);
    } else {
      code += l;
    }
  }
  return code;
}`,
        why: 'It uses `&&`, which stops at `0` and `\'\'` as well as at `null`, and it repeats the code on its left, so a call in the base runs twice.',
      },
      {
        code: `function lowerChain(base, links) {
  function go(cur, i) {
    if (i === links.length) return cur;
    const l = links[i];
    if (l.startsWith('?.')) {
      const rest = go(cur + l.slice(1),
        i + 1);
      return \`\${cur} == null\`
        + \` ? undefined : \${rest}\`;
    }
    return go(cur + l, i + 1);
  }
  return go(base, 0);
}`,
        why: 'No temporary: the code so far appears twice in the output, so `f()?.x` calls `f` twice (and the exact forms in the tests use `_t0`).',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'With `const user = { score: 0 }`, what do `user && user.score && user.score.toFixed(1)` and `user?.score?.toFixed(1)` give?',
    options: [
      { t: 'Both give `\'0.0\'`', why: '`&&` stops at the falsy `0` and gives `0`.' },
      { t: '`0` and `\'0.0\'`', correct: true, why: '`&&` treats `0` as a reason to stop; `?.` stops only at `null` and `undefined`.' },
      { t: 'Both throw a TypeError', why: 'Nothing nullish is read from, so neither throws.' },
    ],
  },
  {
    q: 'Why does a lowering of `getUser()?.name` need a temporary?',
    options: [
      { t: 'To make the code shorter', why: 'The temporary makes it longer; it is there for correctness.' },
      { t: 'Because `?.` only works on variables', why: '`?.` works on any expression; the lowering is what needs care.' },
      { t: 'So that `getUser()` is called once, for both the test and the read', correct: true, why: 'Testing the call and then reading from a second call would run it twice, and might even see a different value.' },
    ],
  },
  {
    q: 'What does V8’s instruction `JumpIfUndefinedOrNull` do in the bytecode for `a?.b`?',
    options: [
      { t: 'Jumps to the code that loads `undefined` when `a` is nullish, skipping the property read', correct: true, why: 'It is the whole nullish test of the lowering, in one instruction.' },
      { t: 'Throws a TypeError when `a` is null', why: 'Avoiding that error is the point of `?.`.' },
      { t: 'Converts `a` to an object', why: 'It only tests and jumps.' },
      { t: 'Calls `a.b` as a function', why: 'This is a property read; calls use different instructions.' },
    ],
  },
  {
    q: 'In `const { y = 1 } = o`, what is `y` when `o.y` is `null`?',
    options: [
      { t: '`1`', why: 'The default is used only for `undefined`.' },
      { t: '`undefined`', why: 'The property is present with the value `null`.' },
      { t: '`null`', correct: true, why: 'The lowering tests `v === undefined`, which is false for `null`, so the value read is kept.' },
    ],
  },
  {
    q: 'tsc with `--target ES5` lowers `const [p, , q] = xs` to `p = xs[0], q = xs[2]`. When is that wrong?',
    options: [
      { t: 'When `xs` is an array of numbers', why: 'For an array, indexing gives the same elements.' },
      { t: 'When `xs` is a `Set` or a generator, which have no indexes but can be iterated', correct: true, why: 'Array destructuring uses the iterator protocol; `downlevelIteration` makes tsc emit the iterating `__read` helper instead.' },
      { t: 'Never: destructuring is defined as indexing', why: 'It is defined with the iterator protocol, as MDN and the specification say.' },
      { t: 'When `xs` has more than three elements', why: 'Extra elements are simply not read, in both versions.' },
    ],
  },
];
