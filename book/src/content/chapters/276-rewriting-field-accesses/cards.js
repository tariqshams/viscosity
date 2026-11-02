// Chapter 276 cards. Keys are stable ids: never rename them.

export const prompts = {
  'rw-what': {
    q: 'What does access rewriting turn `ps[i].x` into?',
    a: '`ps.x[i]`: element i of the `x` column.',
  },
  'rw-back': {
    q: 'Why are the edits applied from the end of the file backwards?',
    a: 'Each edit only shifts text after it, which is already done, so the offsets of the remaining edits stay valid.',
  },
  'rw-push': {
    q: 'What does `ps.push({ x: a, vx: b })` become?',
    a: '`ps.push(a, b)`: one argument per field, in field order, copied as source text.',
  },
  'rw-alias': {
    q: 'What does `const p = ps[i]` become, and what does `p` then hold?',
    a: '`const p = i`: p holds the index, and each `p.x` becomes `ps.x[p]`.',
  },
  'rw-forof': {
    q: 'What does `for (const p of ps)` become?',
    a: '`for (let p = 0; p < ps.length; p++)`, a counting loop over indexes.',
  },
  'rw-spare': {
    q: 'Without a bounds check, why would `ps.x[100]` on a 100-element container print 0?',
    a: 'The column has spare slots up to `cap`, and a new Float64Array is zero-filled.',
  },
  'rw-proven': {
    q: 'When does Viscosity skip the bounds check on an access?',
    a: 'When it proved the index in range: the index is the loop counter and the loop condition is `i < ps.length`.',
  },
  'rw-bc': {
    q: 'What does `__vsc_bc(c, i, f, w)` do?',
    a: 'Returns i if it is a valid index below `c.length`; otherwise throws the TypeError the original access would have thrown.',
  },
};

export const examples = {
  messages: {
    title: 'The same TypeError, before and after',
    code: `function tryIt(f) {
  try {
    f();
    console.log('no error');
  } catch (e) {
    const n = e.constructor.name;
    console.log(n + ': ' + e.message);
  }
}

// Before: an array of objects.
const ps = [{ x: 1 }];
tryIt(() => ps[5].x);
tryIt(() => { ps[5].x = 1; });

// After: a container, and the helper
// Viscosity emits.
function __vsc_bc(c, i, f, w) {
  if (i >>> 0 === i && i < c.length) {
    return i;
  }
  throw new TypeError(w
    ? 'Cannot set properties of '
      + \`undefined (setting '\${f}')\`
    : 'Cannot read properties of '
      + \`undefined (reading '\${f}')\`);
}
const c = { length: 1,
  x: new Float64Array(16) };
tryIt(() => c.x[__vsc_bc(c, 5, 'x')]);
tryIt(() => {
  c.x[__vsc_bc(c, 5, 'x', true)] = 1;
});

// And with no check at all:
tryIt(() => console.log(c.x[5]));`,
  },
};

export const exercises = {
  rewrite: {
    title: 'Rewrite a[i].f without a regex',
    prompt:
      'Write `rewrite(src, name)`. Scan `src` character by character. Read identifiers (letters, digits, `_`, `$`) whole, so `ops` is never mistaken for `ps`. When an identifier equal to `name` is followed by `[`, find the **matching** `]` (brackets may nest), and if that is followed by `.` and a field name, replace `name[index].field` with `name.field[index]`. Rewrite the index too (it may contain accesses). Copy string literals in `\'` or `"` through untouched. Everything else is copied as it is.',
    starter: `function rewrite(src, name) {
  // name[i].f should become name.f[i]
  return src;
}`,
    solution: `function isId(c) {
  return (c >= 'a' && c <= 'z')
    || (c >= 'A' && c <= 'Z')
    || (c >= '0' && c <= '9')
    || c === '_' || c === '$';
}

function rewrite(src, name) {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === "'" || c === '"') {
      let j = i + 1;
      while (j < src.length
          && src[j] !== c) j++;
      out += src.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (!isId(c)) {
      out += c;
      i++;
      continue;
    }
    let j = i;
    while (j < src.length
        && isId(src[j])) j++;
    const word = src.slice(i, j);
    i = j;
    const open = src[j] === '[';
    if (word !== name || !open) {
      out += word;
      continue;
    }
    let k = j;
    let depth = 0;
    for (; k < src.length; k++) {
      if (src[k] === '[') depth++;
      if (src[k] === ']') depth--;
      if (depth === 0) break;
    }
    let m = k + 2;
    while (m < src.length
        && isId(src[m])) m++;
    const dot = src[k + 1] === '.';
    if (!dot || m === k + 2) {
      out += word;
      continue;
    }
    const idx = src.slice(j + 1, k);
    const f = src.slice(k + 2, m);
    out += name + '.' + f + '['
      + rewrite(idx, name) + ']';
    i = m;
  }
  return out;
}`,
    tests: `test('the basic rewrite', () => {
  expect(rewrite('ps[i].x', 'ps'))
    .toBe('ps.x[i]');
});
test('both sides of +=', () => {
  expect(rewrite('ps[i].x += ps[i].vx;',
    'ps')).toBe('ps.x[i] += ps.vx[i];');
});
test('only the named array', () => {
  expect(rewrite('qs[i].x + ops[i].x',
    'ps')).toBe('qs[i].x + ops[i].x');
});
test('an expression index', () => {
  expect(rewrite('ps[i + 1].y', 'ps'))
    .toBe('ps.y[i + 1]');
});
test('nested brackets', () => {
  expect(rewrite('ps[a[j]].x', 'ps'))
    .toBe('ps.x[a[j]]');
});
test('an access inside the index', () => {
  expect(rewrite('ps[ps[0].k].x', 'ps'))
    .toBe('ps.x[ps.k[0]]');
});
test('no field: left alone', () => {
  expect(rewrite('f(ps[i]); ps.length',
    'ps')).toBe('f(ps[i]); ps.length');
});
test('strings are not code', () => {
  const s = "log('ps[i].x', ps[i].x)";
  expect(rewrite(s, 'ps'))
    .toBe("log('ps[i].x', ps.x[i])");
});`,
    hints: [
      'Keep an output string and an index `i`. Handle three cases at each position: a quote, an identifier character, or anything else.',
      'For an identifier, read up to the first non-identifier character and compare the whole word with `name`.',
      'To find the matching `]`, count depth: `[` adds one, `]` subtracts one, and stop when depth returns to 0.',
      'Call `rewrite` on the index text itself, so `ps[ps[0].k].x` works.',
    ],
    walkthrough: `**How to think about it.** A search-and-replace for \`ps[\` fails in two ways: it finds \`ps[\` inside \`ops[\`, and it finds it inside a string like \`'ps[i].x'\`, which is data, not code. The cure is the idea behind every scanner from the Drip chapters: walk the text from left to right, and at each position decide what kind of *token* (word, string, symbol) starts there, then consume the whole token before looking again. Once you can see whole words, an access is a word equal to \`name\`, then \`[\`, then an index up to the *matching* \`]\`, then \`.\` and a field name. Viscosity itself never scans like this, because it has the real syntax tree with exact offsets for every node; but the shape of the output is the same: copy everything, and replace exactly the ranges that are accesses.

**The solution, line by line.**

- \`function isId(c)\` says whether a character can be part of a name: a letter, a digit, \`_\` or \`$\`.
- \`let out = ''; let i = 0;\` start an empty result and a position at the start of \`src\`.
- \`while (i < src.length) {\` looks at one position per round, and \`const c = src[i];\` is the character there.
- \`if (c === "'" || c === '"') {\` starts a string. \`let j = i + 1;\` and the inner \`while\` move \`j\` to the matching closing quote; \`out += src.slice(i, j + 1);\` copies the whole string, quotes included, untouched; \`i = j + 1;\` and \`continue\` move past it.
- \`if (!isId(c)) { out += c; i++; continue; }\` copies any other symbol (spaces, \`+\`, \`(\`) as it is.
- Otherwise a word starts here: the \`while\` moves \`j\` to its end, \`const word = src.slice(i, j);\` is the whole word, and \`i = j;\` moves past it. Because the word is read whole, \`ops\` is never mistaken for \`ps\`.
- \`const open = src[j] === '[';\` checks for a bracket right after the word, and \`if (word !== name || !open) { out += word; continue; }\` copies every word that is not the start of an access.
- \`let k = j; let depth = 0; for (; k < src.length; k++) { … }\` finds the matching \`]\`: \`[\` adds one to \`depth\`, \`]\` takes one away, and the loop stops when \`depth\` is back to 0. That is what keeps \`ps[a[j]].x\` whole; stopping at the first \`]\` would cut the index in half.
- \`let m = k + 2; while (… isId(src[m])) m++;\` reads the field name that should follow \`].\`.
- \`const dot = src[k + 1] === '.';\` and \`if (!dot || m === k + 2) { out += word; continue; }\` give up when there is no \`.\` or no field name: \`ps[i]\` alone is not an access (in Viscosity it is an element variable or a bailout). Only the word is copied, and the scan continues at the \`[\`.
- \`const idx = src.slice(j + 1, k);\` is the index text and \`const f = src.slice(k + 2, m);\` the field.
- \`out += name + '.' + f + '[' + rewrite(idx, name) + ']';\` writes the column access. Calling \`rewrite\` on the index handles an access inside an index: \`ps[ps[0].k].x\` becomes \`ps.x[ps.k[0]]\`.
- \`i = m;\` continues after the field name, and at the end \`return out;\`.

**Common wrong attempts.**

- Searching for \`name + '['\` with \`indexOf\`: it matches inside \`ops[\` and inside string literals.
- Stopping at the first \`]\`: \`ps[a[j]].x\` is cut into \`ps[a[j]\` and \`].x\`.
- Forgetting to rewrite the index: \`ps[ps[0].k].x\` comes out as \`ps.x[ps[0].k]\`, with an inner access left in the old layout.`,
    wrong: [
      {
        code: `function rewrite(src, name) {
  const key = name + '[';
  let out = src;
  let at = out.indexOf(key);
  while (at >= 0) {
    const k = out.indexOf(']', at);
    if (out[k + 1] !== '.') break;
    let m = k + 2;
    while (out[m] >= 'a'
        && out[m] <= 'z') m++;
    const s = at + key.length;
    const idx = out.slice(s, k);
    const f = out.slice(k + 2, m);
    const rep = name + '.' + f
      + '[' + idx + ']';
    out = out.slice(0, at) + rep
      + out.slice(m);
    at = out.indexOf(key,
      at + rep.length);
  }
  return out;
}`,
        why: 'Searching for the text `ps[` also finds it inside `ops[` and inside strings, and stopping at the first `]` cuts a nested index like `a[j]` in half.',
      },
      {
        code: `function isId(c) {
  return (c >= 'a' && c <= 'z')
    || (c >= 'A' && c <= 'Z')
    || (c >= '0' && c <= '9')
    || c === '_' || c === '$';
}

function rewrite(src, name) {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (!isId(c)) {
      out += c;
      i++;
      continue;
    }
    let j = i;
    while (j < src.length
        && isId(src[j])) j++;
    const word = src.slice(i, j);
    i = j;
    const open = src[j] === '[';
    if (word !== name || !open) {
      out += word;
      continue;
    }
    let k = j;
    let depth = 0;
    for (; k < src.length; k++) {
      if (src[k] === '[') depth++;
      if (src[k] === ']') depth--;
      if (depth === 0) break;
    }
    let m = k + 2;
    while (m < src.length
        && isId(src[m])) m++;
    const dot = src[k + 1] === '.';
    if (!dot || m === k + 2) {
      out += word;
      continue;
    }
    const idx = src.slice(j + 1, k);
    const f = src.slice(k + 2, m);
    out += name + '.' + f + '['
      + rewrite(idx, name) + ']';
    i = m;
  }
  return out;
}`,
        why: 'Almost right, but string literals are scanned like code, so the text inside `\'ps[i].x\'` is rewritten too. A rewrite must never change data.',
      },
    ],
  },
  boundsCheck: {
    optional: true,
    title: 'The bounds-check helper',
    prompt:
      'Write `bc(c, i, f, w)`, Viscosity’s bounds check. If `i` is a whole number with `0 <= i < c.length`, return `i`. Otherwise throw a `TypeError` whose message is `Cannot set properties of undefined (setting \'F\')` when `w` is true, or `Cannot read properties of undefined (reading \'F\')` when it isn’t, with the field name in place of F.',
    starter: `function bc(c, i, f, w) {
  if (i < c.length) return i;
  throw new Error('out of bounds');
}`,
    solution: `function bc(c, i, f, w) {
  if (i >>> 0 === i && i < c.length) {
    return i;
  }
  const what = w
    ? \`set properties of undefined \`
      + \`(setting '\${f}')\`
    : \`read properties of undefined \`
      + \`(reading '\${f}')\`;
  throw new TypeError('Cannot ' + what);
}`,
    tests: `const c = { length: 3 };
function err(fn) {
  try { fn(); } catch (e) {
    return e.constructor.name + ': '
      + e.message;
  }
  return 'no error';
}
test('valid indexes pass through', () => {
  expect(bc(c, 0, 'x', false)).toBe(0);
  expect(bc(c, 2, 'x', true)).toBe(2);
});
test('a read past the end', () => {
  expect(err(() => bc(c, 3, 'x', false)))
    .toBe("TypeError: Cannot read properties of undefined (reading 'x')");
});
test('a write past the end', () => {
  expect(err(() => bc(c, 9, 'vx', true)))
    .toBe("TypeError: Cannot set properties of undefined (setting 'vx')");
});
test('-1, 1.5 and NaN are not indexes', () => {
  for (const i of [-1, 1.5, NaN]) {
    expect(err(() => bc(c, i, 'x', false))
      .startsWith('TypeError')).toBeTruthy();
  }
});`,
    hints: [
      '`i >>> 0 === i` is true only for whole numbers from 0 up (below 2³²).',
      'Use a template literal to put the field name in the message.',
    ],
    walkthrough: `**How to think about it.** The helper must say "yes" for exactly the indexes at which the original array held an element, and for every other index it must fail the way the original failed. In the original, \`ps[i]\` is an element only when \`i\` is a whole number from 0 up to \`length - 1\`; \`ps[-1]\`, \`ps[1.5]\`, \`ps[NaN]\` and \`ps[length]\` are all \`undefined\`, and reading or setting a field of \`undefined\` throws a \`TypeError\` with V8's wording. So two tests, and one carefully worded error.

**The solution, line by line.**

- \`if (i >>> 0 === i && i < c.length) {\` is the whole test. \`i >>> 0\` turns \`i\` into an unsigned 32-bit integer; if that changes the value, \`i\` was negative, fractional, too large or \`NaN\` (which equals nothing, not even itself). Then \`i < c.length\` compares with the number of elements in use, not with the capacity.
- \`return i;\` hands the index back, so the helper can sit inside the brackets: \`ps.x[bc(ps, 7, 'x', false)]\`.
- \`const what = w ? … : …;\` builds the message: \`w\` is true for a write (\`setting\`) and false for a read (\`reading\`), and the template literals put the field name between quotes.
- \`throw new TypeError('Cannot ' + what);\` throws the same kind of error, with the same message, as V8 throws for the original.

**Common wrong attempts.**

- \`i < c.length\` alone (the starter) accepts \`-1\` and \`1.5\`, which read \`undefined\` in the original and threw.
- \`i >= 0 && i < c.length\` still accepts \`1.5\`; the index must also be a whole number.
- Throwing a plain \`Error\`, or a different message: a program that checks \`e instanceof TypeError\` or prints \`e.message\` would behave differently, and Viscosity's differential tests compare errors exactly.`,
    wrong: [
      {
        code: `function bc(c, i, f, w) {
  if (i >= 0 && i < c.length) {
    return i;
  }
  const what = w
    ? \`set properties of undefined \`
      + \`(setting '\${f}')\`
    : \`read properties of undefined \`
      + \`(reading '\${f}')\`;
  throw new TypeError('Cannot ' + what);
}`,
        why: '`1.5` passes `i >= 0 && i < c.length`, but `ps[1.5]` is `undefined` in the original. The index must also be a whole number.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why does Viscosity edit source ranges instead of printing the program again from its syntax tree?',
    options: [
      { t: 'Printing from a tree is impossible for JavaScript.', why: 'It is quite possible, and many tools do it. It loses the original formatting and comments, though.' },
      { t: 'Everything it doesn’t rewrite stays byte for byte as written, comments and formatting included.', correct: true, why: 'Right. The output stays readable and diffable, and an untouched program comes back identical.' },
      { t: 'Edits run faster than the parser.', why: 'The edits still need the parsed tree for their offsets; speed isn’t the reason.' },
    ],
  },
  {
    q: 'What does `const p = ps[i]; p.x += p.vx;` become?',
    options: [
      { t: '`const p = ps.x[i]; p += ps.vx[i];`', why: 'Then p would be a copy of one number, and writing it wouldn’t change the column.' },
      { t: '`const p = { x: ps.x[i], vx: ps.vx[i] }; p.x += p.vx;`', why: 'That rebuilds an object and loses the write. Viscosity never materialises here.' },
      { t: '`const p = ps[i]; p.x += p.vx;` (aliases are kept)', why: 'The container has no element objects to alias; every p.x must change.' },
      { t: '`const p = i; ps.x[p] += ps.vx[p];`', correct: true, why: 'Right: the variable now holds the index.' },
    ],
  },
  {
    q: 'Which access needs `__vsc_bc` in the compiled code?',
    options: [
      { t: '`ps[7].x` printed after the loop', correct: true, why: 'Yes. A constant index isn’t proven in range by the loop pattern, so it is checked.' },
      { t: '`ps[i].x` inside `for (let i = 0; i < ps.length; i++)`', why: 'This is the proven pattern: the loop condition guarantees i is in range.' },
      { t: '`p.x` inside `for (const p of ps)`', why: 'for-of visits exactly the valid indexes, so it is proven.' },
    ],
  },
  {
    q: 'Without the bounds check, what would `console.log(ps.x[100])` print for a 100-element container with `cap` 128?',
    options: [
      { t: 'It throws a RangeError.', why: 'Typed arrays don’t throw on out-of-range reads.' },
      { t: '`undefined`', why: 'Only past the end of the Float64Array (index 128 and up). Slot 100 exists; it is a spare.' },
      { t: '`0`, a spare, zero-filled slot', correct: true, why: 'Right, and that is the danger: a plausible wrong number where the original threw a TypeError.' },
      { t: 'The value of element 99.', why: 'Nothing wraps around; slot 100 is an unused slot.' },
    ],
  },
  {
    q: 'Why does `__vsc_bc` throw “Cannot read properties of undefined (reading \'x\')” specifically?',
    options: [
      { t: 'The ECMAScript specification requires that exact message.', why: 'The specification only requires a TypeError; messages are implementation-defined.' },
      { t: 'It is the message V8 gives for the original access, so outcomes match in Node.', correct: true, why: 'Yes. Other engines may word it differently, but Viscosity’s differential tests run on V8 and compare errors exactly.' },
      { t: 'Any message would do; only the type matters.', why: 'A program can print or inspect `e.message`, and the tests compare it.' },
    ],
  },
];
