// Chapter 45 cards (the JSON parser, second half).
// Generated layout: edit freely; keys are stable ids, never rename them.

export const prompts = {
  'shape-code': {
    q: 'How does the shape of JSON decide the shape of the parser?',
    a: 'One function per grammar rule; wherever a rule says “value”, the code calls `parseValue`.',
  },
  'base-case-json': {
    q: 'What is the base case of the JSON parser’s recursion?',
    a: 'A value that is a single token: a number, a string, `true`, `false` or `null`. It needs no further calls.',
  },
  'next-what': {
    q: 'What does `next` in `{ value, next }` tell the caller?',
    a: 'The index of the first token after the value just read, so the caller knows where to carry on.',
  },
  'recursion-why': {
    q: 'Why must `parseArray` call `parseValue`, rather than read each element as a single token?',
    a: 'An element can be any value, including another array or an object, which takes many tokens.',
  },
  'differential-json': {
    q: 'How do the final tests know the right answer for each input?',
    a: 'They compare with `JSON.parse`, a trusted implementation: equal results for good input, both throwing for bad input.',
  },
  'proto-key': {
    q: 'Why does `out[\'__proto__\'] = 1` not create a property called `__proto__`?',
    a: 'Assigning to `__proto__` tries to change the object’s prototype instead; `Object.defineProperty` creates the property.',
  },
  'duplicate-keys': {
    q: 'What do `JSON.parse` and our parser do with `{"a": 1, "a": 2}`?',
    a: 'Both keep the last value, `{ a: 2 }`. RFC 8259 says keys should be unique and that parsers differ here.',
  },
  'end-check': {
    q: 'Why does `parse` check that the token after the value is the end token?',
    a: 'JSON text is exactly one value; without the check, `[1] 2` would be accepted and the `2` silently ignored.',
  },
};

export const examples = {
  'proto-corner': {
    title: 'The one corner: __proto__',
    code: `const text = '{"__proto__": 1}';
const ours = {};
ours['__proto__'] = 1;
console.log(Object.keys(ours));
const theirs = JSON.parse(text);
console.log(Object.keys(theirs));

const fixed = {};
const k = '__proto__';
Object.defineProperty(fixed, k, {
  value: 1, writable: true,
  enumerable: true, configurable: true,
});
console.log(Object.keys(fixed));`,
  },
};

export const exercises = {
  scalar: {
    optional: true,
    lang: 'ts',
    title: 'Warm-up: one token, one value',
    prompt: 'Write `scalar(t)`, which turns a single token into the value it stands for: a `\'num\'` or `\'str\'` token gives its `value`, and the tokens `\'true\'`, `\'false\'` and `\'null\'` give `true`, `false` and `null`. For any other token (punctuation, or the end token), **throw** a `JsonError` with the token\'s `at`. The types and `JsonError` are given.',
    starter: `type Punct =
  '[' | ']' | '{' | '}' | ':' | ',';
type Word = 'true' | 'false' | 'null';
type Token =
  | { kind: Punct; at: number }
  | { kind: Word; at: number }
  | { kind: 'num'; value: number;
      at: number }
  | { kind: 'str'; value: string;
      at: number }
  | { kind: 'end'; at: number };
type Json =
  | null | boolean | number | string
  | Json[]
  | { [key: string]: Json };
type Parsed = {
  value: Json; next: number;
};

class JsonError extends Error {
  at: number;
  constructor(msg: string, at: number) {
    super(\`\${msg} at \${at}\`);
    this.name = 'JsonError';
    this.at = at;
  }
}

function scalar(t: Token): Json {
  // your code here
  return null;
}

const t: Token = { kind: 'num',
  value: 4, at: 0 };
console.log(scalar(t));`,
    solution: `type Punct =
  '[' | ']' | '{' | '}' | ':' | ',';
type Word = 'true' | 'false' | 'null';
type Token =
  | { kind: Punct; at: number }
  | { kind: Word; at: number }
  | { kind: 'num'; value: number;
      at: number }
  | { kind: 'str'; value: string;
      at: number }
  | { kind: 'end'; at: number };
type Json =
  | null | boolean | number | string
  | Json[]
  | { [key: string]: Json };
type Parsed = {
  value: Json; next: number;
};

class JsonError extends Error {
  at: number;
  constructor(msg: string, at: number) {
    super(\`\${msg} at \${at}\`);
    this.name = 'JsonError';
    this.at = at;
  }
}

function scalar(t: Token): Json {
  if (t.kind === 'num') return t.value;
  if (t.kind === 'str') return t.value;
  if (t.kind === 'true') return true;
  if (t.kind === 'false') return false;
  if (t.kind === 'null') return null;
  throw new JsonError(
    \`unexpected \${t.kind}\`, t.at);
}`,
    tests: `const __err = (f) => { try { f(); } catch (e) { return e; } return null; };
test('a number token', () => {
  expect(scalar({ kind: 'num', value: 4, at: 0 })).toBe(4);
});
test('a string token', () => {
  expect(scalar({ kind: 'str', value: 'hi', at: 3 })).toBe('hi');
});
test('true, false and null', () => {
  expect(scalar({ kind: 'true', at: 0 })).toBe(true);
  expect(scalar({ kind: 'false', at: 0 })).toBe(false);
  expect(scalar({ kind: 'null', at: 0 })).toBe(null);
});
test('punctuation is not a value: a JsonError with its position', () => {
  const e = __err(() => scalar({ kind: ']', at: 5 }));
  expect(e instanceof JsonError).toBe(true);
  expect(e && e.at).toBe(5);
});
test('the end token is not a value either', () => {
  expect(() => scalar({ kind: 'end', at: 9 })).toThrow();
});`,
    hints: [
      'One `if` per kind of token that is a value on its own; everything else falls through to a `throw`.',
      'After `if (t.kind === \'num\')`, the checker knows `t` has a `value`, so `return t.value;` is allowed.',
      'End with `throw new JsonError(` and a message such as `` `unexpected ${t.kind}` ``, passing `t.at` as the position.',
    ],
    walkthrough: `**How to think about it.** Five kinds of token are complete values on their own: a number, a string and the three words. Everything else (punctuation and the end token) cannot start a value by itself, at least not in this function, so it is an error, and the error should say *where*: that is what the token's \`at\` is for. Because \`Token\` is a tagged union, checking \`t.kind\` narrows \`t\`, so the checker lets you read \`t.value\` only on the two kinds that have one.

**The solution, line by line.**

- The types and \`class JsonError\` are given. \`JsonError\` is a custom error class (from the error objects chapter): \`super(...)\` stores a message such as \`unexpected ] at 5\`, \`this.name\` labels the kind, and \`this.at\` keeps the position as a number, for code that wants to point at it.
- \`function scalar(t: Token): Json {\` takes one token and promises a \`Json\` value.
- \`  if (t.kind === 'num') return t.value;\`: inside this \`if\`, \`t\` is narrowed to the number variant, so \`t.value\` is a \`number\`.
- \`  if (t.kind === 'str') return t.value;\` does the same for strings.
- \`  if (t.kind === 'true') return true;\`, \`  if (t.kind === 'false') return false;\` and \`  if (t.kind === 'null') return null;\` turn the three word tokens into the values they name. (The token *kind* is the string \`'true'\`; the value is the boolean \`true\`.)
- \`  throw new JsonError(\`, with its second line building the message \`unexpected \${t.kind}\` from a template literal and passing \`t.at\`, refuses everything else with a message and the position.

**Common wrong attempts.**

- Ending with \`return t.kind === 'true';\` treats every unknown token as \`false\`, so \`]\` quietly becomes a value.
- Throwing a plain \`Error\` loses the position as a number; the next exercises (and the tests) rely on \`e.at\`.`,
    wrong: [
      {
        code: `function scalar(t) {
  if (t.kind === 'num') return t.value;
  if (t.kind === 'str') return t.value;
  if (t.kind === 'null') return null;
  return t.kind === 'true';
}`,
        why: 'Any token that is not a number, string or `null` becomes a boolean, so `]` quietly turns into `false` instead of an error.',
      },
      {
        code: `function scalar(t) {
  if (t.kind === 'num') return t.value;
  if (t.kind === 'str') return t.value;
  if (t.kind === 'true') return true;
  if (t.kind === 'false') return false;
  if (t.kind === 'null') return null;
  throw new Error('unexpected token');
}`,
        why: 'A plain `Error` has no `at`, so the caller cannot point at the problem; the tests check `e.at`.',
      },
    ],
  },
  parseArrays: {
    lang: 'ts',
    title: 'Values and arrays, recursively',
    prompt: 'Write `parseValue(toks, i)`, returning `{ value, next }`: the value that starts at token `i`, and the index of the token after it. Numbers, strings, `true`, `false` and `null` are one token each. A `[` starts an array: write `parseArray(toks, i)`, which reads elements with `parseValue` (so arrays can nest), requires a `,` between elements and a `]` at the end, and allows `[]`. Throw a `JsonError` at the offending token\'s `at` for anything else, including a `{` (objects come in the next exercise). The starter has the types, `JsonError` and a stand-in `tokenize` for trying your code.',
    starter: `type Punct =
  '[' | ']' | '{' | '}' | ':' | ',';
type Word = 'true' | 'false' | 'null';
type Token =
  | { kind: Punct; at: number }
  | { kind: Word; at: number }
  | { kind: 'num'; value: number;
      at: number }
  | { kind: 'str'; value: string;
      at: number }
  | { kind: 'end'; at: number };
type Json =
  | null | boolean | number | string
  | Json[]
  | { [key: string]: Json };
type Parsed = {
  value: Json; next: number;
};

class JsonError extends Error {
  at: number;
  constructor(msg: string, at: number) {
    super(\`\${msg} at \${at}\`);
    this.name = 'JsonError';
    this.at = at;
  }
}

// A stand-in scanner. It finds where
// each token ends, and lets JSON.parse
// work out numbers and strings.
function strEnd(s: string, i: number) {
  i++;
  while (s[i] !== '"') {
    if (i >= s.length) {
      throw new Error('unclosed');
    }
    if (s[i] === '\\\\') i++;
    i++;
  }
  return i + 1;
}

function numEnd(s: string, i: number) {
  const ok = '+-.eE0123456789';
  while (ok.includes(s[i])) i++;
  return i;
}

const WORDS: Word[] =
  ['true', 'false', 'null'];

function word(s: string, i: number) {
  for (const w of WORDS) {
    if (s.startsWith(w, i)) return w;
  }
  throw new Error(\`bad char at \${i}\`);
}

function tokenize(s: string) {
  const out: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (' \\t\\n\\r'.includes(c)) {
      i++;
    } else if ('[]{}:,'.includes(c)) {
      const p = c as Punct;
      out.push({ kind: p, at: i });
      i++;
    } else if (c === '"') {
      const end = strEnd(s, i);
      const v = JSON.parse(
        s.slice(i, end));
      out.push({ kind: 'str',
        value: v, at: i });
      i = end;
    } else if ('-0123456789'
        .includes(c)) {
      const end = numEnd(s, i);
      const v = JSON.parse(
        s.slice(i, end));
      out.push({ kind: 'num',
        value: v, at: i });
      i = end;
    } else {
      const w = word(s, i);
      out.push({ kind: w, at: i });
      i += w.length;
    }
  }
  out.push({ kind: 'end', at: i });
  return out;
}

function parseValue(
  toks: Token[], i: number,
): Parsed {
  // your code here
  return { value: null, next: i };
}

const toks = tokenize('[1, [2, 3]]');
console.log(parseValue(toks, 0));`,
    solution: `type Punct =
  '[' | ']' | '{' | '}' | ':' | ',';
type Word = 'true' | 'false' | 'null';
type Token =
  | { kind: Punct; at: number }
  | { kind: Word; at: number }
  | { kind: 'num'; value: number;
      at: number }
  | { kind: 'str'; value: string;
      at: number }
  | { kind: 'end'; at: number };
type Json =
  | null | boolean | number | string
  | Json[]
  | { [key: string]: Json };
type Parsed = {
  value: Json; next: number;
};

class JsonError extends Error {
  at: number;
  constructor(msg: string, at: number) {
    super(\`\${msg} at \${at}\`);
    this.name = 'JsonError';
    this.at = at;
  }
}

// A stand-in scanner. It finds where
// each token ends, and lets JSON.parse
// work out numbers and strings.
function strEnd(s: string, i: number) {
  i++;
  while (s[i] !== '"') {
    if (i >= s.length) {
      throw new Error('unclosed');
    }
    if (s[i] === '\\\\') i++;
    i++;
  }
  return i + 1;
}

function numEnd(s: string, i: number) {
  const ok = '+-.eE0123456789';
  while (ok.includes(s[i])) i++;
  return i;
}

const WORDS: Word[] =
  ['true', 'false', 'null'];

function word(s: string, i: number) {
  for (const w of WORDS) {
    if (s.startsWith(w, i)) return w;
  }
  throw new Error(\`bad char at \${i}\`);
}

function tokenize(s: string) {
  const out: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (' \\t\\n\\r'.includes(c)) {
      i++;
    } else if ('[]{}:,'.includes(c)) {
      const p = c as Punct;
      out.push({ kind: p, at: i });
      i++;
    } else if (c === '"') {
      const end = strEnd(s, i);
      const v = JSON.parse(
        s.slice(i, end));
      out.push({ kind: 'str',
        value: v, at: i });
      i = end;
    } else if ('-0123456789'
        .includes(c)) {
      const end = numEnd(s, i);
      const v = JSON.parse(
        s.slice(i, end));
      out.push({ kind: 'num',
        value: v, at: i });
      i = end;
    } else {
      const w = word(s, i);
      out.push({ kind: w, at: i });
      i += w.length;
    }
  }
  out.push({ kind: 'end', at: i });
  return out;
}

function parseValue(
  toks: Token[], i: number,
): Parsed {
  const t = toks[i];
  const n = i + 1;
  if (t.kind === 'num') {
    return { value: t.value, next: n };
  }
  if (t.kind === 'str') {
    return { value: t.value, next: n };
  }
  if (t.kind === 'true') {
    return { value: true, next: n };
  }
  if (t.kind === 'false') {
    return { value: false, next: n };
  }
  if (t.kind === 'null') {
    return { value: null, next: n };
  }
  if (t.kind === '[') {
    return parseArray(toks, i);
  }
  throw new JsonError(
    \`unexpected \${t.kind}\`, t.at);
}

function parseArray(
  toks: Token[], i: number,
): Parsed {
  const out: Json[] = [];
  i++;
  if (toks[i].kind === ']') {
    return { value: out, next: i + 1 };
  }
  while (true) {
    const r = parseValue(toks, i);
    out.push(r.value);
    i = r.next;
    const t = toks[i];
    if (t.kind === ']') {
      i++;
      return { value: out, next: i };
    }
    if (t.kind !== ',') {
      throw new JsonError(
        'expected , or ]', t.at);
    }
    i++;
  }
}`,
    tests: `function __lex(s) {
  const out = []; let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (' \\t\\n\\r'.includes(c)) { i++; continue; }
    if ('[]{}:,'.includes(c)) { out.push({ kind: c, at: i }); i++; continue; }
    if (c === '"') { let j = i + 1; while (s[j] !== '"') { if (j >= s.length) throw new Error('unclosed'); if (s[j] === '\\\\') j++; j++; } j++; out.push({ kind: 'str', value: JSON.parse(s.slice(i, j)), at: i }); i = j; continue; }
    if ('-0123456789'.includes(c)) { let j = i; while ('+-.eE0123456789'.includes(s[j])) j++; out.push({ kind: 'num', value: JSON.parse(s.slice(i, j)), at: i }); i = j; continue; }
    const w = ['true', 'false', 'null'].find((w) => s.startsWith(w, i));
    if (!w) throw new Error('bad char at ' + i);
    out.push({ kind: w, at: i }); i += w.length;
  }
  out.push({ kind: 'end', at: i });
  return out;
}
const __err = (f) => { try { f(); } catch (e) { return e; } return null; };
const pv = (s, i = 0) => parseValue(__lex(s), i);
test('a single number', () => {
  expect(pv('1')).toEqual({ value: 1, next: 1 });
});
test('the empty array', () => {
  expect(pv('[]')).toEqual({ value: [], next: 2 });
});
test('an array of scalars', () => {
  expect(pv('[1, "a", true, null]')).toEqual({ value: [1, 'a', true, null], next: 9 });
});
test('nested arrays', () => {
  expect(pv('[1, [2, [3]], []]').value).toEqual([1, [2, [3]], []]);
  expect(pv('[[[[[[[[1]]]]]]]]').value).toEqual([[[[[[[[1]]]]]]]]);
});
test('starts at token i, and next is the token after the value', () => {
  expect(pv('[[1], 2]', 1)).toEqual({ value: [1], next: 4 });
});
test('a missing comma: JsonError at the second value', () => {
  const e = __err(() => pv('[1 2]'));
  expect(e instanceof JsonError).toBe(true);
  expect(e && e.at).toBe(3);
});
test('a trailing comma is refused', () => {
  const e = __err(() => pv('[1,]'));
  expect(e instanceof JsonError).toBe(true);
  expect(e && e.at).toBe(3);
});
test('an unclosed array is refused at the end', () => {
  const e = __err(() => pv('[1'));
  expect(e instanceof JsonError).toBe(true);
  expect(e && e.at).toBe(2);
});
test('a value cannot start with ]', () => {
  expect(() => pv(']')).toThrow();
});`,
    hints: [
      '`parseValue` looks only at `toks[i]`. A single-token value returns at once with `next: i + 1`; a `[` returns `parseArray(toks, i)`; anything else throws.',
      'In `parseArray`: step past the `[`; if the next token is `]`, return the empty array. Otherwise loop: read an element with `parseValue`, push its value, and move `i` to its `next`.',
      'After each element, a `]` ends the array (return `next` just after it), a `,` means another element follows (`i++` and loop), and anything else is `new JsonError(\'expected , or ]\', t.at)`.',
    ],
    walkthrough: `**How to think about it.** Follow the shape of the data. A value is either a single token (a number, a string, a word) or an array, which starts with \`[\`. So \`parseValue\` looks at one token and decides; for a \`[\`, it hands over to \`parseArray\`. An array's elements can be *any* value, including arrays, so \`parseArray\` calls \`parseValue\` for each element; that is the recursion, and the base case is a single-token value, which needs no further calls. Every function returns \`{ value, next }\`: the value it read and the index of the token after it, so the caller knows where to carry on.

Inside an array, after each element there must be either \`]\` (the end) or \`,\` (another element follows). Anything else is an error, and so is \`]\` straight after a comma, which happens for free: after the comma we call \`parseValue\`, and \`parseValue\` refuses \`]\`.

**The solution, line by line.**

- \`function parseValue(\`, \`  toks: Token[], i: number,\`, \`): Parsed {\` is the signature: tokens and a position in, a value and the next position out.
- \`  const t = toks[i];\` reads the deciding token, and \`  const n = i + 1;\` is where a one-token value ends.
- \`  if (t.kind === 'num') {\` with \`    return { value: t.value, next: n };\` and the same for \`'str'\` are the base cases with a value; narrowing makes \`t.value\` safe.
- The three \`if\` blocks for \`'true'\`, \`'false'\` and \`'null'\` return the matching values with \`next: n\`.
- \`  if (t.kind === '[') {\` and \`    return parseArray(toks, i);\` hand arrays over.
- \`  throw new JsonError(\`, with its second line building the message \`unexpected \${t.kind}\` from a template literal and passing \`t.at\`, refuses anything else: a \`]\`, a \`:\`, the end token, or (for now) a \`{\`.
- \`function parseArray(\`, \`  toks: Token[], i: number,\`, \`): Parsed {\` starts at the \`[\`.
- \`  const out: Json[] = [];\` is the array being built, and \`  i++;\` steps past the \`[\`.
- \`  if (toks[i].kind === ']') {\` and \`    return { value: out, next: i + 1 };\` handle \`[]\`, the empty array, which has no elements and no commas.
- \`  while (true) {\` repeats once per element; it only ends through a \`return\` or a \`throw\`.
- \`    const r = parseValue(toks, i);\` reads one element, of any kind; this is the recursive call. \`    out.push(r.value);\` keeps it, and \`    i = r.next;\` moves past it.
- \`    const t = toks[i];\` looks at what follows the element.
- \`    if (t.kind === ']') {\`, \`      i++;\`, \`      return { value: out, next: i };\` finish the array, with \`next\` just after the \`]\`.
- \`    if (t.kind !== ',') {\` with \`      throw new JsonError(\` and \`        'expected , or ]', t.at);\` refuse anything else, such as the \`2\` in \`[1 2]\`, or the end token in \`[1\`.
- \`    i++;\` steps past the comma, and the loop reads the next element.

Watch \`next\` in the tests: for \`[[1], 2]\` starting at token 1, the inner array is tokens 1 to 3, so \`next\` is 4. The end token at the end of every list is what makes \`toks[i]\` always safe to read: an unfinished array runs into it and gets a clear error rather than reading past the end.

**Common wrong attempts.**

- Reading elements as single tokens (\`out.push(t.value)\` in a loop) handles \`[1, 2]\` but not nested arrays: there is no recursion, so a \`[\` inside has no value to push.
- Skipping a comma *if there is one* (\`if (toks[i].kind === ',') i++;\`) accepts \`[1 2]\` and \`[1,]\`: commas become optional, and JSON says they are not.
- Returning \`next: i\` instead of the index after the \`]\` makes the caller read the \`]\` again.`,
    wrong: [
      {
        code: `function parseArray(toks, i) {
  const out = [];
  i++;
  while (toks[i].kind !== ']') {
    const t = toks[i];
    if (t.kind !== ',') {
      out.push(t.value);
    }
    i++;
  }
  return { value: out, next: i + 1 };
}`,
        why: 'Elements are read as single tokens, with no call to `parseValue`, so a nested array has nothing sensible to push.',
      },
      {
        code: `function parseArray(toks, i) {
  const out = [];
  i++;
  while (toks[i].kind !== ']') {
    const r = parseValue(toks, i);
    out.push(r.value);
    i = r.next;
    if (toks[i].kind === ',') i++;
  }
  return { value: out, next: i + 1 };
}`,
        why: 'The comma is skipped only *if* it is there, so `[1 2]` and `[1,]` are both accepted.',
      },
    ],
  },
  parse: {
    lang: 'ts',
    title: 'The whole parser',
    prompt: 'Finish the program. Paste in your `parseValue` and `parseArray`, give `parseValue` a branch for `{`, and write `parseObject(toks, i)`: like `parseArray`, but each member is a string token (the key), a `:` and a value, and it ends with `}`. Then write `parse(src)`: tokenize, parse one value from token 0, and **throw** a `JsonError` at the next token unless it is the end token. Every structural mistake should be a `JsonError` at the token where it was noticed. The tests compare your `parse` with `JSON.parse` on good and bad input.',
    starter: `type Punct =
  '[' | ']' | '{' | '}' | ':' | ',';
type Word = 'true' | 'false' | 'null';
type Token =
  | { kind: Punct; at: number }
  | { kind: Word; at: number }
  | { kind: 'num'; value: number;
      at: number }
  | { kind: 'str'; value: string;
      at: number }
  | { kind: 'end'; at: number };
type Json =
  | null | boolean | number | string
  | Json[]
  | { [key: string]: Json };
type Parsed = {
  value: Json; next: number;
};

class JsonError extends Error {
  at: number;
  constructor(msg: string, at: number) {
    super(\`\${msg} at \${at}\`);
    this.name = 'JsonError';
    this.at = at;
  }
}

// A stand-in scanner. It finds where
// each token ends, and lets JSON.parse
// work out numbers and strings.
function strEnd(s: string, i: number) {
  i++;
  while (s[i] !== '"') {
    if (i >= s.length) {
      throw new Error('unclosed');
    }
    if (s[i] === '\\\\') i++;
    i++;
  }
  return i + 1;
}

function numEnd(s: string, i: number) {
  const ok = '+-.eE0123456789';
  while (ok.includes(s[i])) i++;
  return i;
}

const WORDS: Word[] =
  ['true', 'false', 'null'];

function word(s: string, i: number) {
  for (const w of WORDS) {
    if (s.startsWith(w, i)) return w;
  }
  throw new Error(\`bad char at \${i}\`);
}

function tokenize(s: string) {
  const out: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (' \\t\\n\\r'.includes(c)) {
      i++;
    } else if ('[]{}:,'.includes(c)) {
      const p = c as Punct;
      out.push({ kind: p, at: i });
      i++;
    } else if (c === '"') {
      const end = strEnd(s, i);
      const v = JSON.parse(
        s.slice(i, end));
      out.push({ kind: 'str',
        value: v, at: i });
      i = end;
    } else if ('-0123456789'
        .includes(c)) {
      const end = numEnd(s, i);
      const v = JSON.parse(
        s.slice(i, end));
      out.push({ kind: 'num',
        value: v, at: i });
      i = end;
    } else {
      const w = word(s, i);
      out.push({ kind: w, at: i });
      i += w.length;
    }
  }
  out.push({ kind: 'end', at: i });
  return out;
}

// 1. Paste your parseValue and
// parseArray here, and give parseValue
// a branch for '{'.
function parseValue(
  toks: Token[], i: number,
): Parsed {
  throw new Error('not written yet');
}

// 2. Write parseObject(toks, i).

// 3. Write parse(src).
function parse(src: string): Json {
  return null;
}

console.log(parse('{"a": [1, {}]}'));`,
    solution: `type Punct =
  '[' | ']' | '{' | '}' | ':' | ',';
type Word = 'true' | 'false' | 'null';
type Token =
  | { kind: Punct; at: number }
  | { kind: Word; at: number }
  | { kind: 'num'; value: number;
      at: number }
  | { kind: 'str'; value: string;
      at: number }
  | { kind: 'end'; at: number };
type Json =
  | null | boolean | number | string
  | Json[]
  | { [key: string]: Json };
type Parsed = {
  value: Json; next: number;
};

class JsonError extends Error {
  at: number;
  constructor(msg: string, at: number) {
    super(\`\${msg} at \${at}\`);
    this.name = 'JsonError';
    this.at = at;
  }
}

// A stand-in scanner. It finds where
// each token ends, and lets JSON.parse
// work out numbers and strings.
function strEnd(s: string, i: number) {
  i++;
  while (s[i] !== '"') {
    if (i >= s.length) {
      throw new Error('unclosed');
    }
    if (s[i] === '\\\\') i++;
    i++;
  }
  return i + 1;
}

function numEnd(s: string, i: number) {
  const ok = '+-.eE0123456789';
  while (ok.includes(s[i])) i++;
  return i;
}

const WORDS: Word[] =
  ['true', 'false', 'null'];

function word(s: string, i: number) {
  for (const w of WORDS) {
    if (s.startsWith(w, i)) return w;
  }
  throw new Error(\`bad char at \${i}\`);
}

function tokenize(s: string) {
  const out: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (' \\t\\n\\r'.includes(c)) {
      i++;
    } else if ('[]{}:,'.includes(c)) {
      const p = c as Punct;
      out.push({ kind: p, at: i });
      i++;
    } else if (c === '"') {
      const end = strEnd(s, i);
      const v = JSON.parse(
        s.slice(i, end));
      out.push({ kind: 'str',
        value: v, at: i });
      i = end;
    } else if ('-0123456789'
        .includes(c)) {
      const end = numEnd(s, i);
      const v = JSON.parse(
        s.slice(i, end));
      out.push({ kind: 'num',
        value: v, at: i });
      i = end;
    } else {
      const w = word(s, i);
      out.push({ kind: w, at: i });
      i += w.length;
    }
  }
  out.push({ kind: 'end', at: i });
  return out;
}

function parseValue(
  toks: Token[], i: number,
): Parsed {
  const t = toks[i];
  const n = i + 1;
  if (t.kind === 'num') {
    return { value: t.value, next: n };
  }
  if (t.kind === 'str') {
    return { value: t.value, next: n };
  }
  if (t.kind === 'true') {
    return { value: true, next: n };
  }
  if (t.kind === 'false') {
    return { value: false, next: n };
  }
  if (t.kind === 'null') {
    return { value: null, next: n };
  }
  if (t.kind === '[') {
    return parseArray(toks, i);
  }
  if (t.kind === '{') {
    return parseObject(toks, i);
  }
  throw new JsonError(
    \`unexpected \${t.kind}\`, t.at);
}

function parseArray(
  toks: Token[], i: number,
): Parsed {
  const out: Json[] = [];
  i++;
  if (toks[i].kind === ']') {
    return { value: out, next: i + 1 };
  }
  while (true) {
    const r = parseValue(toks, i);
    out.push(r.value);
    i = r.next;
    const t = toks[i];
    if (t.kind === ']') {
      i++;
      return { value: out, next: i };
    }
    if (t.kind !== ',') {
      throw new JsonError(
        'expected , or ]', t.at);
    }
    i++;
  }
}

function parseObject(
  toks: Token[], i: number,
): Parsed {
  const out: { [k: string]: Json } = {};
  i++;
  if (toks[i].kind === '}') {
    return { value: out, next: i + 1 };
  }
  while (true) {
    const key = toks[i];
    if (key.kind !== 'str') {
      throw new JsonError(
        'expected a key', key.at);
    }
    const colon = toks[i + 1];
    if (colon.kind !== ':') {
      throw new JsonError(
        'expected :', colon.at);
    }
    const r = parseValue(toks, i + 2);
    out[key.value] = r.value;
    i = r.next;
    const t = toks[i];
    if (t.kind === '}') {
      i++;
      return { value: out, next: i };
    }
    if (t.kind !== ',') {
      throw new JsonError(
        'expected , or }', t.at);
    }
    i++;
  }
}

function parse(src: string): Json {
  const toks = tokenize(src);
  const r = parseValue(toks, 0);
  const t = toks[r.next];
  if (t.kind !== 'end') {
    throw new JsonError(
      'extra input', t.at);
  }
  return r.value;
}`,
    tests: `const __err = (f) => { try { f(); } catch (e) { return e; } return null; };
const good = ['0', '-1.5e3', '"hi"', 'true', 'false', 'null', '[]', '{}', ' [1, 2] ',
  '{"a": 1}', '{"a": [1, {"b": null}], "c": "d"}', '[{}, [], [{}]]',
  '{"name": "drip", "tags": ["vm", "gc"], "v": 2}', '{"a": 1, "a": 2}', '\\n{\\n "x": -0.5\\n}\\n'];
test('agrees with JSON.parse on good input', () => {
  for (const s of good) expect(parse(s)).toEqual(JSON.parse(s));
});
const bad = ['', '[1, 2,]', '{"a": 1,}', '{"a" 1}', '{a: 1}', '{1: 2}', '[1] 2', '{} {}',
  '{"a"}', '{"a":}', '{', '[', '"a" "b"', ']', '}', ':', ','];
test('refuses everything JSON.parse refuses', () => {
  for (const s of bad) {
    expect(__err(() => JSON.parse(s)) !== null).toBe(true);
    expect(__err(() => parse(s)) !== null).toBe(true);
  }
});
test('a missing colon: JsonError at the value', () => {
  const e = __err(() => parse('{"a" 1}'));
  expect(e instanceof JsonError).toBe(true);
  expect(e && e.at).toBe(5);
});
test('a key must be a string: JsonError at the key', () => {
  const e = __err(() => parse('{1: 2}'));
  expect(e instanceof JsonError).toBe(true);
  expect(e && e.at).toBe(1);
});
test('a trailing comma in an object: JsonError at the }', () => {
  const e = __err(() => parse('{"a": 1,}'));
  expect(e instanceof JsonError).toBe(true);
  expect(e && e.at).toBe(8);
});
test('extra input after the value: JsonError at the extra token', () => {
  const e = __err(() => parse('[1] 2'));
  expect(e instanceof JsonError).toBe(true);
  expect(e && e.at).toBe(4);
});
test('empty text: JsonError at 0', () => {
  const e = __err(() => parse(''));
  expect(e instanceof JsonError).toBe(true);
  expect(e && e.at).toBe(0);
});`,
    hints: [
      'Copy `parseArray` and change three things: start an object `{}` instead of an array, end on `}`, and read a member (key, colon, value) where it read a value.',
      'For a member: the token at `i` must have kind `\'str\'`, the token at `i + 1` must be `\':\'`, and the value starts at `i + 2`. Store it with `out[key.value] = r.value`.',
      '`parse`: `const r = parseValue(toks, 0);`, then if `toks[r.next].kind !== \'end\'`, throw `new JsonError(\'extra input\', ...)` at that token\'s `at`.',
    ],
    walkthrough: `**How to think about it.** Two pieces are missing from your parser: objects, and the function that runs the whole thing. An object is an array with two twists: it starts with \`{\`, and each element is a *member*, three parts in a row: a string token for the key, a \`:\`, and any value. So \`parseObject\` has the same loop as \`parseArray\`, with more checks inside it. Then \`parse(src)\` scans the text, parses one value from token 0, and checks that what follows is the end token: JSON text is exactly one value, so \`[1] 2\` must be refused. Finally, test the whole program the way the edge cases and differential testing chapter taught: against a trusted implementation, \`JSON.parse\`, on good and bad input alike. The tests here do exactly that.

**The solution, line by line.** (The stand-in scanner, the types and \`parseArray\` are as before; \`parseValue\` gains one branch, \`if (t.kind === '{') { return parseObject(toks, i); }\`, just before its \`throw\`.)

- \`function parseObject(\`, \`  toks: Token[], i: number,\`, \`): Parsed {\` starts at the \`{\`.
- \`  const out: { [k: string]: Json } = {};\` is the object being built, typed with an index signature, and \`  i++;\` steps past the \`{\`.
- \`  if (toks[i].kind === '}') {\` and \`    return { value: out, next: i + 1 };\` handle \`{}\`.
- \`  while (true) {\` repeats once per member.
- \`    const key = toks[i];\` and \`    if (key.kind !== 'str') {\` with \`      throw new JsonError(\` and \`        'expected a key', key.at);\` demand a string key: \`{1: 2}\` fails here (\`{a: 1}\` never gets this far, because the scanner already refuses the \`a\`). After the check, \`key\` is narrowed to the string variant.
- \`    const colon = toks[i + 1];\` and \`    if (colon.kind !== ':') {\` with \`'expected :'\` demand the colon, which refuses \`{"a" 1}\` at the \`1\`. Reading \`toks[i + 1]\` is safe: a string token is never the last token, because the end token always follows.
- \`    const r = parseValue(toks, i + 2);\` reads the member's value, of any kind (recursion again), and \`    out[key.value] = r.value;\` stores it. If a key appears twice, this line simply overwrites it, so the last one wins, which is what \`JSON.parse\` does too.
- \`    i = r.next;\` and \`    const t = toks[i];\` look at what follows the member, and the rest of the loop is \`parseArray\`'s, with \`}\` in place of \`]\`.
- \`function parse(src: string): Json {\` is the whole program.
- \`  const toks = tokenize(src);\` scans the text (the stand-in, or your own scanner from last chapter).
- \`  const r = parseValue(toks, 0);\` parses one value from the first token. For empty text, token 0 is the end token, and \`parseValue\` throws a \`JsonError\` at 0.
- \`  const t = toks[r.next];\` and \`  if (t.kind !== 'end') {\` with \`    throw new JsonError(\` and \`      'extra input', t.at);\` refuse anything after the value, such as the \`2\` in \`[1] 2\`.
- \`  return r.value;\` is the parsed tree.

**One honest difference.** Run \`parse('{"__proto__": 1}')\`: you get \`{}\`, while \`JSON.parse\` gives an object with a key \`__proto__\`. In JavaScript, assigning to \`out['__proto__']\` does not create a property; it tries to change the object's prototype. The fix is to create the property directly, with \`Object.defineProperty\`, which is what \`JSON.parse\` does. Differential testing with a wide enough set of inputs finds exactly this kind of corner.

**Common wrong attempts.**

- Leaving out the end check: \`parse('[1] 2')\` returns \`[1]\` and silently ignores the rest.
- Calling \`JSON.parse\` inside \`parse\` agrees with itself on every input, but its errors are \`SyntaxError\`s with no \`at\`, so the position tests fail; and of course, it is not a parser you wrote.`,
    wrong: [
      {
        code: `function parse(src) {
  const toks = tokenize(src);
  return parseValue(toks, 0).value;
}`,
        why: 'Without the end check, `[1] 2` returns `[1]` and the rest of the text is silently ignored.',
      },
      {
        code: `function parse(src) {
  return JSON.parse(src);
}`,
        why: 'It agrees with `JSON.parse` because it *is* `JSON.parse`, but its errors are `SyntaxError`s with no `at`, so the position tests fail.',
      },
    ],
  },
  stringify: {
    optional: true,
    lang: 'ts',
    title: 'Backwards: from a value to text',
    prompt: 'Write `stringify(v)`, the reverse of `parse`: it turns a `Json` value into JSON text with no spaces, exactly as `JSON.stringify` does. Numbers and booleans become `String(v)`, `null` becomes `\'null\'`, arrays and objects join their parts with commas inside `[ ]` or `{ }`, and keys are quoted like strings. For a single string (a value or a key), you may call `JSON.stringify` on it, to get the quotes and escapes right.',
    starter: `type Json =
  | null | boolean | number | string
  | Json[]
  | { [key: string]: Json };

function stringify(v: Json): string {
  // your code here
  return '';
}

console.log(stringify([1, { a: 2 }]));`,
    solution: `type Json =
  | null | boolean | number | string
  | Json[]
  | { [key: string]: Json };

function stringify(v: Json): string {
  if (v === null) return 'null';
  if (typeof v === 'string') {
    return JSON.stringify(v);
  }
  if (typeof v !== 'object') {
    return String(v);
  }
  const parts: string[] = [];
  if (Array.isArray(v)) {
    for (const x of v) {
      parts.push(stringify(x));
    }
    return '[' + parts.join(',') + ']';
  }
  for (const k of Object.keys(v)) {
    const key = JSON.stringify(k);
    const val = stringify(v[k]);
    parts.push(key + ':' + val);
  }
  return '{' + parts.join(',') + '}';
}`,
    tests: `const same = (v) => expect(stringify(v)).toBe(JSON.stringify(v));
test('scalars', () => {
  same(null); same(true); same(false); same(42); same(-1.5); same('hi');
});
test('strings are quoted and escaped', () => {
  same('a "b"\\n');
});
test('arrays, empty and nested', () => {
  same([]); same([1, [2, [3]]]); same([null, 'x', false]);
});
test('objects, empty and nested', () => {
  same({}); same({ a: 1, b: { c: [true] } });
});
test('keys are quoted too', () => {
  same({ 'a b': 1, '"': 2 });
});`,
    hints: [
      'The same shape as the parser: one case per kind of value, with arrays and objects calling `stringify` for each value inside them.',
      'Check for `null` first: `typeof null` is `\'object\'`. Then strings, then everything that is not an object (numbers and booleans).',
      'For an object, loop over `Object.keys(v)` and push `JSON.stringify(k) + \':\' + stringify(v[k])`; then join with commas inside braces.',
    ],
    walkthrough: `**How to think about it.** This is the parser run backwards, and it has the same shape: one case per kind of value, and arrays and objects call the function again for every value inside them. Scalars are written directly; strings need quotes and escapes (writing the escapes is tedious and not the point here, so the exercise lets you call \`JSON.stringify\` on a single string); arrays and objects join their parts with commas.

**The solution, line by line.**

- \`function stringify(v: Json): string {\` takes any \`Json\` value.
- \`  if (v === null) return 'null';\` comes first, because \`typeof null\` is \`'object'\`, which would confuse the later checks.
- \`  if (typeof v === 'string') {\` and \`    return JSON.stringify(v);\` quote and escape a string, so \`a "b"\` becomes \`"a \\"b\\""\`.
- \`  if (typeof v !== 'object') {\` and \`    return String(v);\` handle numbers and booleans, the only kinds left that are not objects: \`String(42)\` is \`'42'\`, \`String(true)\` is \`'true'\`.
- \`  const parts: string[] = [];\` collects the pieces of an array or object.
- \`  if (Array.isArray(v)) {\` narrows \`v\` to \`Json[]\`; \`    for (const x of v) {\` and \`      parts.push(stringify(x));\` write each element (recursion), and \`    return '[' + parts.join(',') + ']';\` wraps them.
- After that \`if\`, the checker knows \`v\` is the object variant. \`  for (const k of Object.keys(v)) {\` visits each key: \`    const key = JSON.stringify(k);\` quotes it, \`    const val = stringify(v[k]);\` writes its value, and \`    parts.push(key + ':' + val);\` joins them.
- \`  return '{' + parts.join(',') + '}';\` wraps the members.

**Common wrong attempts.**

- Wrapping strings in quotes by hand, \`'"' + v + '"'\`, breaks as soon as a string contains a quote, a backslash or a line break, and keys need the same care.
- Checking \`typeof v === 'object'\` before checking for \`null\` sends \`null\` down the object path, where \`Object.keys(null)\` throws.`,
    wrong: [
      {
        code: `function stringify(v) {
  if (v === null) return 'null';
  if (typeof v === 'string') {
    return '"' + v + '"';
  }
  if (typeof v !== 'object') {
    return String(v);
  }
  const parts = [];
  if (Array.isArray(v)) {
    for (const x of v) {
      parts.push(stringify(x));
    }
    return '[' + parts.join(',') + ']';
  }
  for (const k of Object.keys(v)) {
    const val = stringify(v[k]);
    parts.push('"' + k + '":' + val);
  }
  return '{' + parts.join(',') + '}';
}`,
        why: 'Adding quotes by hand breaks for any string or key containing a quote, a backslash or a line break, which need escapes.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In `parseValue`, which tokens are base cases, needing no further calls?',
    options: [
      {
        t: '`[` and `{`',
        why: 'These start arrays and objects, which call `parseValue` again for their elements.',
      },
      {
        t: 'Numbers, strings, `true`, `false` and `null`',
        correct: true,
        why: 'Each is a whole value in one token, so it returns at once with `next: i + 1`.',
      },
      {
        t: 'Only the end token',
        why: 'The end token is not a value at all: `parseValue` throws there.',
      },
      {
        t: 'Commas',
        why: 'A comma is never a value; `parseArray` and `parseObject` consume commas between values.',
      },
    ],
  },
  {
    q: '`parseValue(toks, 0)` on the tokens of `[1, [2]]` (that is `[`, `1`, `,`, `[`, `2`, `]`, `]`, end) returns which `next`?',
    options: [
      {
        t: '`1`',
        why: 'That would be right for a one-token value; the array spans tokens 0 to 6.',
      },
      {
        t: '`6`',
        why: 'Token 6 is the final `]`, which belongs to the array; `next` is the token after it.',
      },
      {
        t: '`7`',
        correct: true,
        why: 'The array uses tokens 0 to 6, so the next token, the end token, is at index 7.',
      },
      {
        t: '`8`',
        why: 'There are only eight tokens, numbered 0 to 7.',
      },
    ],
  },
  {
    q: 'What does our `parse` do with `[1, 2,]`?',
    options: [
      {
        t: 'Returns `[1, 2]`',
        why: 'JSON has no trailing commas, and neither does our parser: a value must follow every comma.',
      },
      {
        t: 'Throws a `JsonError` at the `]`',
        correct: true,
        why: 'After the comma it calls `parseValue`, which finds `]` where a value should start.',
      },
      {
        t: 'Returns `[1, 2, undefined]`',
        why: '`undefined` is not a JSON value; nothing would ever produce it here.',
      },
    ],
  },
  {
    q: 'Why is `JSON.parse` a good reference for testing our parser?',
    options: [
      {
        t: 'It is the fastest parser',
        why: 'Speed does not matter for a reference; being right does.',
      },
      {
        t: 'It is trusted, widely used and follows the same standard, so any disagreement points at a bug (or a known corner) in ours',
        correct: true,
        why: 'That is differential testing: two implementations of one specification must agree.',
      },
      {
        t: 'It produces nicer error messages',
        why: 'Its messages are fine, but the tests compare values and whether each input is refused.',
      },
      {
        t: 'It accepts more inputs than the standard',
        why: 'It does not; and a reference that accepted non-JSON would be a poor one.',
      },
    ],
  },
  {
    q: 'Our parser stores members with `out[key] = value`. Which input does it handle differently from `JSON.parse`?',
    options: [
      {
        t: '`{"a": 1, "a": 2}`',
        why: 'Both keep the last value, `2`.',
      },
      {
        t: '`{"__proto__": 1}`',
        correct: true,
        why: 'Assigning to `__proto__` changes the prototype instead of creating a property, so ours gives `{}`; `Object.defineProperty` fixes it.',
      },
      {
        t: '`{"": 1}`',
        why: 'An empty key is an ordinary property in both.',
      },
      {
        t: '`{"constructor": 1}`',
        why: 'Assigning creates an own property called `constructor`, just as `JSON.parse` does.',
      },
    ],
  },
];
