// Chapter 257 cards. Keys are stable ids: never rename them.

export const prompts = {
  'rw-what': {
    q: 'What does access rewriting turn `ps[i].x` into?',
    a: '`ps.x[i]`: element i of the `x` column.',
  },
  'rw-edits': {
    q: 'How does Viscosity’s emitter change the program text?',
    a: 'It collects edits (a range of the original source and a replacement) and copies everything else through unchanged.',
  },
  'rw-back': {
    q: 'Why are the edits applied from the end of the file backwards?',
    a: 'Each edit only shifts text after it, which is already done, so the offsets of the remaining edits stay valid.',
  },
  'rw-compound': {
    q: 'In `ps[i].x += 1`, the member is read and written. How many edits does it get?',
    a: 'One: edits are keyed by source range, and `ps.x[i] += 1` is a valid assignment as it stands.',
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
  'rw-shift': {
    q: 'What does `i >>> 0 === i` check in `__vsc_bc`?',
    a: 'That i is a whole number from 0 up (below 2³²), which rules out -1, 1.5 and NaN.',
  },
  'rw-bc': {
    q: 'What does `__vsc_bc(c, i, f, w)` do?',
    a: 'Returns i if it is a valid index below `c.length`; otherwise throws the TypeError the original access would have thrown.',
  },
  'rw-msg': {
    q: 'Whose error messages does `__vsc_bc` copy, and why can they differ elsewhere?',
    a: 'V8’s. The specification leaves each error’s message implementation-defined, so other engines may word it differently.',
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
    walkthrough: `This is a tiny scanner, in the spirit of the one you wrote for Drip. The main loop looks at one character and decides which kind of token starts there.

A quote starts a string literal, which is copied whole: text inside a string is data, not code, and must never be rewritten. An identifier character starts a word, which is read to its end before anything is compared. That is what keeps \`ops[i].x\` safe when the name is \`ps\`: a search for the characters \`ps[\` would find it inside \`ops[\`.

For a match, the index is everything between \`[\` and its matching \`]\`. Counting depth handles nested brackets like \`ps[a[j]]\`; stopping at the first \`]\` would cut the index in half. Only if the bracket is followed by \`.\` and a field name is it an access to rewrite; \`ps[i]\` on its own is left alone (in Viscosity, that use either is an element variable, handled separately, or causes a bailout).

The recursion on the index makes \`ps[ps[0].k].x\` come out as \`ps.x[ps.k[0]]\`. Viscosity doesn't need any of this scanning, because it has the real syntax tree with exact start and end offsets for every node. But the shape of the output is the same: copy everything, and replace exactly the ranges that are accesses.`,
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
    walkthrough: `The starter has the two mistakes the real helper avoids. \`i < c.length\` alone accepts \`-1\` and \`1.5\`, which in the original program would have read \`undefined\` and thrown. And a plain \`Error\` with a different message is a different outcome: a program that catches the error and checks \`e instanceof TypeError\`, or prints \`e.message\`, would behave differently, and Viscosity’s differential tests compare errors exactly.

\`i >>> 0\` converts \`i\` to an unsigned 32-bit integer. If that conversion changes the value, \`i\` was negative, fractional, too large, or \`NaN\`, so it is not a valid array index.`,
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
      { t: 'Printing from a tree is impossible for JavaScript.', why: 'It is quite possible, and many tools do it. It just loses the original formatting and comments.' },
      { t: 'Everything it doesn’t rewrite stays byte for byte as written, comments and formatting included.', correct: true, why: 'Right. The output stays readable and diffable, and an untouched program comes back identical.' },
      { t: 'Edits run faster than the parser.', why: 'The edits still need the parsed tree for their offsets; speed isn’t the reason.' },
    ],
  },
  {
    q: 'Two edits are at offsets 11–13 and 112–119. Which is applied first, and why?',
    options: [
      { t: '11–13, because the file is read from the top.', why: 'Then the first edit would shift 112–119 by however much its text grew.' },
      { t: 'Either: edits don’t affect each other.', why: 'They do when replacements have different lengths from the text they replace.' },
      { t: '112–119, so the earlier offsets are still correct when 11–13 is applied.', correct: true, why: 'Yes: back to front, each edit only moves text that is already done.' },
    ],
  },
  {
    q: 'What does `const p = ps[i]; p.x += p.vx;` become?',
    options: [
      { t: '`const p = ps.x[i]; p += ps.vx[i];`', why: 'Then p would be a copy of one number, and writing it wouldn’t change the column.' },
      { t: '`const p = { x: ps.x[i], vx: ps.vx[i] }; p.x += p.vx;`', why: 'That rebuilds an object and loses the write. Viscosity never materializes here.' },
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
      { t: 'The value of element 99.', why: 'Nothing wraps around; slot 100 is just an unused slot.' },
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
