// Chapter 111 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'rw-what': {
    q: 'When an array of objects `ps` is turned into a struct of arrays, what does access rewriting turn `ps[i].x` into?',
    a: '`ps.x[i]`: element i of the `x` column.',
  },
  'rw-back': {
    q: 'Why does a compiler that rewrites source as a list of range edits apply them from the end of the file backwards?',
    a: 'Each edit only shifts text after it, which is already done, so the offsets of the remaining edits stay valid.',
  },
  'rw-alias': {
    q: 'In Viscosity’s SoA rewrite, what does the element variable `const p = ps[i]` become, and what does `p` then hold?',
    a: '`const p = i`: p holds the index, and each `p.x` becomes `ps.x[p]`.',
  },
  'rw-bc': {
    q: 'What does Viscosity’s bounds-check helper `__vsc_bc(c, i, f, w)` do?',
    a: 'Returns i if it is a valid index below `c.length`; otherwise throws the TypeError the original access would have thrown.',
  },
  'gc-cap-len': {
    q: 'What is the difference between a collection’s capacity and its length?',
    a: 'Capacity is how many slots are allocated; length is how many hold real elements.',
  },
  'gc-spare-zero': {
    q: 'What does a spare slot of a freshly allocated `Float64Array` column contain?',
    a: '0. New typed arrays are zero-filled.',
  },
  'gc-amortized': {
    q: 'When a growable array doubles its capacity each time it is full, at most how many values do n pushes copy in total?',
    a: 'Fewer than 2n, so a constant amount per push on average.',
  },
  'gc-add16': {
    q: 'What happens to the total copying for n pushes if a growable array adds 16 slots each time it is full, instead of doubling?',
    a: 'It grows with the square of the length (quadratic), because each grow copies everything so far.',
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
  policies: {
    title: 'Doubling vs adding 16',
    code: `function copies(n, next) {
  let cap = 16, c = 0;
  for (let len = 0; len < n; len++) {
    if (len === cap) {
      c += len;
      cap = next(cap);
    }
  }
  return c;
}
const dbl = (c) => c * 2;
const add = (c) => c + 16;
for (const n of [1000, 10000, 100000])
  console.log(n, copies(n, dbl),
    copies(n, add));`,
  },
  count5000: {
    title: 'growth.js, counted',
    code: `let cap = 16, len = 0;
let grows = 0, copies = 0;
for (let k = 0; k < 5000; k++) {
  if (len === cap) {
    copies += len; // t.set(old)
    cap *= 2;
    grows++;
  }
  len++;
}
console.log(grows, copies, cap);
console.log((copies / len).toFixed(2));`,
  },
};

export const exercises = {
  rewrite: {
    title: 'Rewrite a[i].f without a regex',
    prompt: 'Write `rewrite(src, name)`. Scan `src` character by character. Read identifiers (letters, digits, `_`, `$`) whole, so `ops` is never mistaken for `ps`. When an identifier equal to `name` is followed by `[`, find the **matching** `]` (brackets may nest), and if that is followed by `.` and a field name, replace `name[index].field` with `name.field[index]`. Rewrite the index too (it may contain accesses). Copy string literals in `\'` or `"` through untouched. Everything else is copied as it is.',
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
    prompt: 'Write `bc(c, i, f, w)`, Viscosity’s bounds check. If `i` is a whole number with `0 <= i < c.length`, return `i`. Otherwise throw a `TypeError` whose message is `Cannot set properties of undefined (setting \'F\')` when `w` is true, or `Cannot read properties of undefined (reading \'F\')` when it isn’t, with the field name in place of F.',
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
  doublingCol: {
    optional: true,
    title: 'A column that grows',
    prompt: 'Finish `push(v)` for a one-column container. It starts with capacity 4. When the column is full, grow it the way Viscosity does: a new `Float64Array` of twice the capacity, the old values copied in with `set`, and `copies` increased by the number of values copied. Then store `v` at index `len` and return the new length.',
    starter: `function makeCol() {
  return {
    len: 0, cap: 4, copies: 0,
    data: new Float64Array(4),
    push(v) {
      // your code here
    },
  };
}

const c = makeCol();
for (let i = 0; i < 5; i++) c.push(i);
console.log(c.len, c.cap, c.copies);`,
    solution: `function makeCol() {
  return {
    len: 0, cap: 4, copies: 0,
    data: new Float64Array(4),
    push(v) {
      if (this.len === this.cap) {
        const t = new Float64Array(
          this.cap * 2);
        t.set(this.data);
        this.copies += this.len;
        this.data = t;
        this.cap *= 2;
      }
      this.data[this.len] = v;
      return ++this.len;
    },
  };
}`,
    tests: `test('no grow while there is room', () => {
  const c = makeCol();
  for (let i = 0; i < 4; i++) c.push(i);
  expect([c.len, c.cap, c.copies]).toEqual([4, 4, 0]);
});
test('the fifth push doubles and copies 4', () => {
  const c = makeCol();
  for (let i = 0; i < 5; i++) c.push(i);
  expect([c.len, c.cap, c.copies]).toEqual([5, 8, 4]);
});
test('push returns the new length', () => {
  const c = makeCol();
  c.push(7);
  expect(c.push(8)).toBe(2);
});
test('100 pushes: capacity 128, 124 copies', () => {
  const c = makeCol();
  for (let i = 0; i < 100; i++) c.push(i);
  expect([c.cap, c.copies]).toEqual([128, 124]);
});
test('every value survives the grows', () => {
  const c = makeCol();
  for (let i = 0; i < 100; i++) c.push(i * 3);
  let ok = true;
  for (let i = 0; i < 100; i++) if (c.data[i] !== i * 3) ok = false;
  expect(ok).toBe(true);
});`,
    hints: [
      'Check `this.len === this.cap` at the start of `push`, before writing anything.',
      'To grow: `const t = new Float64Array(this.cap * 2); t.set(this.data);` then replace `this.data` and double `this.cap`.',
      'Count the copy before you forget it: `this.copies += this.len`. Then write `this.data[this.len] = v` and return `++this.len`.',
    ],
    walkthrough: `**How to think about it.** This is the generated \`push\` and \`grow\` from *Generating SoA storage*, folded into one method for one column. Before writing, decide the order of the three things a push does: make room if needed, write the value, update the length. Making room has to come first, because a write past the end of a typed array is silently ignored, so writing first would lose the value with no error. Making room means what Viscosity's \`grow()\` does: a new array twice the size, the old values copied in, and the new array swapped in.

**The solution, line by line.**

- \`push(v) {\` is a method on the object, so \`this\` is the column object.
- \`if (this.len === this.cap) {\` asks whether every slot is in use.
- \`const t = new Float64Array(this.cap * 2);\` makes a new, zero-filled column twice as big.
- \`t.set(this.data);\` copies every old value into the start of \`t\`.
- \`this.copies += this.len;\` counts the copy: the column was full, so exactly \`len\` values moved.
- \`this.data = t;\` swaps the new column in (the old one is now garbage), and \`this.cap *= 2;\` records the new size.
- \`this.data[this.len] = v;\` writes the value into the first unused slot, which now certainly exists.
- \`return ++this.len;\` adds one to the length and returns the new value (\`++\` before the name gives the value after adding), like \`Array.prototype.push\`.

Why the totals stay small: starting at 4, the copies are 4, 8, 16, 32 and 64, each grow copying 4 more than all the earlier ones together, so after 100 pushes the total is 124, less than the final capacity of 128. That is the amortised argument in miniature.

**Common wrong attempts.**

- Growing by a constant (\`this.cap + 4\`): it works, but after 100 pushes it has copied 1,200 values instead of 124, and the gap grows with the square of the length.
- Making the new array without \`set\`: every grow throws the earlier values away, and they read back as zeros.
- Writing before checking: when the column is full, \`data[len]\` is past the end, and the write is silently dropped.`,
    wrong: [
      {
        code: `function makeCol() {
  return {
    len: 0, cap: 4, copies: 0,
    data: new Float64Array(4),
    push(v) {
      if (this.len === this.cap) {
        const t = new Float64Array(
          this.cap + 4);
        t.set(this.data);
        this.copies += this.len;
        this.data = t;
        this.cap += 4;
      }
      this.data[this.len] = v;
      return ++this.len;
    },
  };
}`,
        why: 'This grows by a constant (4) instead of doubling. It works, but the copies add up quadratically: after 100 pushes it has copied 1,200 values instead of 124.',
      },
      {
        code: `function makeCol() {
  return {
    len: 0, cap: 4, copies: 0,
    data: new Float64Array(4),
    push(v) {
      if (this.len === this.cap) {
        this.data = new Float64Array(
          this.cap * 2);
        this.copies += this.len;
        this.cap *= 2;
      }
      this.data[this.len] = v;
      return ++this.len;
    },
  };
}`,
        why: 'The new array is never filled from the old one, so every grow throws the earlier values away (they become zeros). Copy with `set` before replacing `data`.',
      },
      {
        code: `function makeCol() {
  return {
    len: 0, cap: 4, copies: 0,
    data: new Float64Array(4),
    push(v) {
      this.data[this.len] = v;
      if (this.len === this.cap) {
        const t = new Float64Array(
          this.cap * 2);
        t.set(this.data);
        this.copies += this.len;
        this.data = t;
        this.cap *= 2;
      }
      return ++this.len;
    },
  };
}`,
        why: 'The write happens before the check. When the column is full, `data[len]` is past the end of the typed array, and the write is silently dropped.',
      },
    ],
  },
  copiesFor: {
    optional: true,
    title: 'Count the copies of any policy',
    prompt: 'Write `copiesFor(n, next)`: start with capacity 16 and length 0, push `n` times, and whenever a push finds the collection full, add the current length to a copy count and set the capacity to `next(capacity)`. Return the total copies.',
    starter: `function copiesFor(n, next) {
  // your code here
  return 0;
}

const dbl = (c) => c * 2;
console.log(copiesFor(5000, dbl));`,
    solution: `function copiesFor(n, next) {
  let cap = 16, copies = 0;
  for (let len = 0; len < n; len++) {
    if (len === cap) {
      copies += len;
      cap = next(cap);
    }
  }
  return copies;
}`,
    tests: `test('growth.js: 5000 elements, doubling', () => {
  expect(copiesFor(5000, (c) => c * 2)).toBe(8176);
});
test('adding 16 each time', () => {
  expect(copiesFor(1000, (c) => c + 16)).toBe(31248);
});
test('no grows when it fits', () => {
  expect(copiesFor(16, (c) => c * 2)).toBe(0);
});
test('growing by half', () => {
  expect(copiesFor(100, (c) => c + c / 2)).toBe(211);
});`,
    hints: [
      'Loop `len` from 0 to `n - 1`; each iteration is one push.',
      'Before the push, `if (len === cap)`: add `len` to the count and set `cap = next(cap)`.',
    ],
    walkthrough: `**How to think about it.** You do not need any real storage to count copies: only the capacity, the length and the running total matter. So simulate the pushes with a loop, and at each one ask the container's question, "is it full?". Passing the growth rule in as a function, \`next\`, lets one simulator compare every policy.

**The solution, line by line.**

- \`let cap = 16, copies = 0;\` starts like Viscosity's container: room for 16, nothing copied.
- \`for (let len = 0; len < n; len++) {\` is one round per push; \`len\` is the length before this push.
- \`if (len === cap) {\` is the full check.
- \`copies += len;\` counts the old elements moved into the bigger storage (the new, empty slots are allocated, not copied).
- \`cap = next(cap);\` applies the policy: \`c * 2\` doubles, \`c + 16\` adds a fixed amount.
- \`return copies;\` after the loop.

Try a few policies. Doubling stays under 2 copies per element. Growing by half (\`c + c / 2\`) also stays linear, copying a little more but leaving less spare memory after each grow. Adding a constant is quadratic. Any policy that multiplies the capacity by a factor above 1 is amortised constant; the factor trades copying against wasted space.

**Common wrong attempts.**

- Counting the new capacity as copied: a grow copies the old elements only.
- Checking \`len > cap\` instead of \`===\`: the push that fills the last slot is fine, but the next one must grow; with \`>\`, it writes one past the end first.`,
    wrong: [
      {
        code: `function copiesFor(n, next) {
  let cap = 16, copies = 0;
  for (let len = 0; len < n; len++) {
    if (len === cap) {
      copies += cap;
      cap = next(cap);
      copies += cap;
    }
  }
  return copies;
}`,
        why: 'A grow copies the old elements only. The new, empty slots are allocated, not copied.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why does Viscosity edit source ranges instead of printing the program again from its syntax tree?',
    options: [
      {
        t: 'Printing from a tree is impossible for JavaScript.',
        why: 'It is quite possible, and many tools do it. It loses the original formatting and comments, though.',
      },
      {
        t: 'Everything it doesn’t rewrite stays byte for byte as written, comments and formatting included.',
        correct: true,
        why: 'Right. The output stays readable and diffable, and an untouched program comes back identical.',
      },
      {
        t: 'Edits run faster than the parser.',
        why: 'The edits still need the parsed tree for their offsets; speed isn’t the reason.',
      },
    ],
  },
  {
    q: 'Viscosity transforms `ps` to a struct of arrays. What does `const p = ps[i]; p.x += p.vx;` become?',
    options: [
      {
        t: '`const p = ps.x[i]; p += ps.vx[i];`',
        why: 'Then p would be a copy of one number, and writing it wouldn’t change the column.',
      },
      {
        t: '`const p = { x: ps.x[i], vx: ps.vx[i] }; p.x += p.vx;`',
        why: 'That rebuilds an object and loses the write. Viscosity never materialises here.',
      },
      {
        t: '`const p = ps[i]; p.x += p.vx;` (aliases are kept)',
        why: 'The container has no element objects to alias; every p.x must change.',
      },
      {
        t: '`const p = i; ps.x[p] += ps.vx[p];`',
        correct: true,
        why: 'Right: the variable now holds the index.',
      },
    ],
  },
  {
    q: 'Viscosity transforms `ps` to a struct of arrays with bounds checks on. Which access keeps a `__vsc_bc` check in the compiled code?',
    options: [
      {
        t: '`ps[7].x` printed after the loop',
        correct: true,
        why: 'Yes. A constant index isn’t proven in range by the loop pattern, so it is checked.',
      },
      {
        t: '`ps[i].x` inside `for (let i = 0; i < ps.length; i++)`',
        why: 'This is the proven pattern: the loop condition guarantees i is in range.',
      },
      {
        t: '`p.x` inside `for (const p of ps)`',
        why: 'for-of visits exactly the valid indexes, so it is proven.',
      },
    ],
  },
  {
    q: 'Which statement about amortised growth of an array that doubles its capacity is true?',
    options: [
      {
        t: 'Every push is cheap.',
        why: 'A push that triggers a grow copies every element. It is the average that is cheap.',
      },
      {
        t: 'Growing by a constant is better because it wastes less memory.',
        why: 'It wastes less space, but its total copying grows with n², which is far worse for large n.',
      },
      {
        t: 'With doubling, n pushes copy fewer than 2n values in total.',
        correct: true,
        why: 'Each grow copies a little more than all earlier grows together, so the sum stays below the final capacity.',
      },
      {
        t: 'It only works for typed arrays.',
        why: 'The argument is about counting copies; it applies to any growable storage.',
      },
    ],
  },
];
