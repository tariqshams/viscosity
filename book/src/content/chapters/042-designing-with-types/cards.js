// Chapter 42 cards. Keys are stable ids: never rename them.

export const prompts = {
  'flag-count': {
    q: 'How many states does `{ loading: boolean; text?: string; error?: string }` allow, if any text counts as one state?',
    a: '8: two for `loading`, times two (there or missing) for `text`, times two for `error`. Only 3 make sense.',
  },
  'illegal-what': {
    q: 'What does “making illegal states unrepresentable” mean?',
    a: 'Choosing types so that nonsense data cannot be built at all: the checker refuses it, so no function has to handle it.',
  },
  'fields-multiply': {
    q: 'Why does adding a field to an object type tend to add nonsense states, while adding a variant to a union does not?',
    a: 'Field counts multiply (every old state combines with every value of the new field); union variants add exactly one state each.',
  },
  'engine-tradeoff': {
    q: 'Viscosity’s `CollectionPlan` allows `{ layout: \'soa\', blockSize: 8 }`. Why does that do no harm there?',
    a: 'One function builds every plan, and the code that writes columns only reads `blockSize` for `\'aosoa\'`. A union would make it impossible instead.',
  },
  'types-first': {
    q: 'In type-driven design, what do you write before the function bodies?',
    a: 'The data types (allowing only sensible states), then the signatures: each function’s parameter and return types.',
  },
  'literal-not-boolean': {
    q: 'Why is `mode: \'auto\' | \'opt-in\'` better than `optIn: boolean`?',
    a: 'Call sites say what they mean (`\'opt-in\'` rather than a bare `true`), and a third mode can be added later.',
  },
  'change-type-first': {
    q: 'A new requirement adds a fourth kind of light. What do you change first, and why?',
    a: 'The type. The checker then points at every function (ending in `unreachable`) that has not caught up.',
  },
  'signature-what': {
    q: 'What is a function’s signature?',
    a: 'Its parameter types and return type, without the body: `next(l: Light): Light`, read “Light to Light”.',
  },
};

export const examples = {
  'result-type': {
    lang: 'ts',
    title: 'The type first: parsing can fail',
    code: `type Result =
  | { ok: true; value: number }
  | { ok: false; error: string };

function seconds(s: string): Result {
  if (s[s.length - 1] !== 's') {
    return { ok: false, error: 'no s' };
  }
  const n = Number(s.slice(0, -1));
  if (Number.isNaN(n)) {
    return { ok: false, error: 'bad' };
  }
  return { ok: true, value: n };
}

for (const t of ['90s', '90', 'abs']) {
  const r = seconds(t);
  if (r.ok) console.log(t, r.value);
  else console.log(t, r.error);
}`,
  },
};

export const exercises = {
  fromFlags: {
    lang: 'ts',
    title: 'From flags to a status',
    prompt:
      'Old code still produces `Flags` objects: `{ loading: boolean; text?: string; error?: string }`. Write `fromFlags(f)` that turns one into the chapter’s `Status` union. Only three flag states make sense: loading with no text and no error gives `{ kind: \'loading\' }`; not loading with text and no error gives `{ kind: \'loaded\', text }`; not loading with an error and no text gives `{ kind: \'failed\', error }`. Every other combination is nonsense: **throw** an `Error`. A field counts as there when it is not `undefined`, so an empty string `\'\'` is real text. (The runner erases types, so the tests check behaviour; the walkthrough explains how the checker reads your version.)',
    starter: `type Flags = {
  loading: boolean;
  text?: string;
  error?: string;
};
type Status =
  | { kind: 'loading' }
  | { kind: 'loaded'; text: string }
  | { kind: 'failed'; error: string };

function fromFlags(f: Flags): Status {
  // your code here
}

const s = fromFlags({ loading: true });
console.log(s);`,
    solution: `type Flags = {
  loading: boolean;
  text?: string;
  error?: string;
};
type Status =
  | { kind: 'loading' }
  | { kind: 'loaded'; text: string }
  | { kind: 'failed'; error: string };

function fromFlags(f: Flags): Status {
  const t = f.text;
  const e = f.error;
  if (f.loading) {
    if (t === undefined
        && e === undefined) {
      return { kind: 'loading' };
    }
  } else if (e === undefined) {
    if (t !== undefined) {
      return {
        kind: 'loaded', text: t,
      };
    }
  } else if (t === undefined) {
    return { kind: 'failed', error: e };
  }
  throw new Error('impossible flags');
}`,
    tests: `test('loading', () => {
  expect(fromFlags({ loading: true })).toEqual({ kind: 'loading' });
});
test('loaded', () => {
  expect(fromFlags({ loading: false, text: 'hi' })).toEqual({ kind: 'loaded', text: 'hi' });
});
test('empty text is still text', () => {
  expect(fromFlags({ loading: false, text: '' })).toEqual({ kind: 'loaded', text: '' });
});
test('failed', () => {
  expect(fromFlags({ loading: false, error: 'x' })).toEqual({ kind: 'failed', error: 'x' });
});
test('loading with text is nonsense', () => {
  expect(() => fromFlags({ loading: true, text: 'hi' })).toThrow();
});
test('loading with an error is nonsense', () => {
  expect(() => fromFlags({ loading: true, error: 'x' })).toThrow();
});
test('done with nothing is nonsense', () => {
  expect(() => fromFlags({ loading: false })).toThrow();
});
test('text and error is nonsense', () => {
  expect(() => fromFlags({ loading: false, text: 'a', error: 'b' })).toThrow();
});`,
    hints: [
      'There are eight combinations and only three good ones. Handle the three, and let everything else fall through to one `throw` at the end.',
      'Split on `f.loading` first. When it is true, the only good case is “no text and no error”. When it is false, you need exactly one of the two.',
      'Compare with `undefined`, not truthiness: `\'\'` is real text. Copy `f.text` and `f.error` into `const t` and `const e`, then check `t !== undefined` before returning `{ kind: \'loaded\', text: t }`.',
    ],
    walkthrough: `**How to think about it.** This function is the border between the old design and the new one. Everywhere else in the program a \`Status\` can only be one of three sensible things, so all the nonsense has to be caught here, once. List the eight combinations (the figure in the chapter has them), mark the three good ones, and notice that each good one is described by \`loading\` plus "which of text and error is there". So the plan is: check for each good case in turn, return the right variant, and if none matched, throw.

Two details matter. First, "there" means "not \`undefined\`": an empty string is real (if odd) text, so \`if (f.text)\` would be wrong, because \`''\` is falsy. Second, the checker has to be convinced that \`text\` really is a string before it lets you put it in a \`loaded\` variant, whose \`text\` is not optional.

**The solution, line by line.**

- The two \`type\` declarations are given: the old \`Flags\` with two optional fields, and the new \`Status\` union.
- \`function fromFlags(f: Flags): Status {\` is the signature: the type-driven part. It promises a \`Status\` back, so every path must either return one or throw.
- \`  const t = f.text;\` and \`  const e = f.error;\` copy the two optional fields into constants. Their types are \`string | undefined\`. Working with plain constants keeps the checks short, and the checker narrows a constant reliably.
- \`  if (f.loading) {\`: the download is still running.
- \`    if (t === undefined\` and \`        && e === undefined) {\` (one condition split over two lines) check that nothing else is set, and \`      return { kind: 'loading' };\` returns the only sensible loading state. If either is set, we fall out of this \`if\` and reach the \`throw\` at the end.
- \`  } else if (e === undefined) {\`: not loading, and no error, so the only good case left is "has text".
- \`    if (t !== undefined) {\` checks the text is there. Inside, the checker has narrowed \`t\` from \`string | undefined\` to \`string\`, so \`      return {\`, \`        kind: 'loaded', text: t,\`, \`      };\` (one object, spread over three lines) is accepted. (If \`t\` is missing too, that is "done with nothing", which falls through to the \`throw\`.)
- \`  } else if (t === undefined) {\`: not loading and there *is* an error (otherwise the previous branch would have run); this checks there is no text as well, and \`    return { kind: 'failed', error: e };\` returns the failure. Here \`e\` is narrowed to \`string\` because the earlier \`e === undefined\` test failed.
- \`  throw new Error('impossible flags');\` catches every remaining combination: loading with text or an error, done with neither, and done with both.

**How the checker reads it.** Try writing \`text: f.text\` in the loaded branch, after testing \`f.text !== undefined\` through a separate \`const hasText = ...\` variable: \`tsc\` reports "Type 'string | undefined' is not assignable to type 'string'". Narrowing works on the value you tested, so test \`t\` itself, right where you use it. Notice also that you never had to think about "loaded and failed" anywhere after this function: the type has no way to say it.

**Common wrong attempts.**

- Testing truthiness, \`if (f.text)\`, treats the empty string as missing, so \`{ loading: false, text: '' }\` throws instead of returning a loaded status.
- Returning a status for every input, for example "if there is text, it is loaded", accepts nonsense such as "loading with text"; the point of the border is to refuse it loudly.
- Forgetting the \`loading\` flag entirely (looking only at text and error) lets "still loading, but with text" through as loaded.`,
    wrong: [
      {
        code: `function fromFlags(f) {
  const t = f.text;
  const e = f.error;
  if (f.loading && !t && !e) {
    return { kind: 'loading' };
  }
  if (!f.loading && t && !e) {
    return { kind: 'loaded', text: t };
  }
  if (!f.loading && e && !t) {
    return { kind: 'failed', error: e };
  }
  throw new Error('impossible flags');
}`,
        why: 'Truthiness treats the empty string as missing, so `{ loading: false, text: \'\' }` throws instead of giving a loaded status.',
      },
      {
        code: `function fromFlags(f) {
  const t = f.text;
  const e = f.error;
  if (t !== undefined) {
    return { kind: 'loaded', text: t };
  }
  if (e !== undefined) {
    return { kind: 'failed', error: e };
  }
  return { kind: 'loading' };
}`,
        why: 'It never refuses anything: loading with text becomes “loaded”, and done with nothing becomes “loading”. The nonsense gets through.',
      },
    ],
  },
  verdict: {
    optional: true,
    lang: 'ts',
    title: 'The engine’s verdict, from a union',
    prompt:
      'Here is `CollectionPlan` redesigned as a union, so that only `\'aosoa\'` has a block size: `{ layout: \'aos\' } | { layout: \'soa\' } | { layout: \'aosoa\'; blockSize: number }`. Write `verdict(p)` returning the same words Viscosity’s `explain` prints: `\'kept as array of objects\'` for aos, `\'struct of arrays\'` for soa, and `` `AoSoA, blocks of ${n}` `` for aosoa with block size `n`. End with `unreachable(p)`, so that a layout arriving from bad data throws.',
    starter: `type Plan =
  | { layout: 'aos' }
  | { layout: 'soa' }
  | { layout: 'aosoa';
      blockSize: number };

function unreachable(x: never): never {
  throw new Error('unhandled layout');
}

function verdict(p: Plan): string {
  return '';
}`,
    solution: `type Plan =
  | { layout: 'aos' }
  | { layout: 'soa' }
  | { layout: 'aosoa';
      blockSize: number };

function unreachable(x: never): never {
  throw new Error('unhandled layout');
}

function verdict(p: Plan): string {
  if (p.layout === 'aos') {
    return 'kept as array of objects';
  }
  if (p.layout === 'soa') {
    return 'struct of arrays';
  }
  if (p.layout === 'aosoa') {
    const n = p.blockSize;
    return \`AoSoA, blocks of \${n}\`;
  }
  return unreachable(p);
}`,
    tests: `test('aos', () => {
  expect(verdict({ layout: 'aos' })).toBe('kept as array of objects');
});
test('soa', () => {
  expect(verdict({ layout: 'soa' })).toBe('struct of arrays');
});
test('aosoa with its block size', () => {
  expect(verdict({ layout: 'aosoa', blockSize: 16 })).toBe('AoSoA, blocks of 16');
});
test('a layout from bad data throws', () => {
  expect(() => verdict({ layout: 'columns' })).toThrow();
});`,
    hints: [
      'One check per variant of the union, in any order, then `unreachable(p)`.',
      'Only inside the `\'aosoa\'` branch may you read `p.blockSize`: the other variants do not have it.',
      'Use a template literal for the last one: `` `AoSoA, blocks of ${p.blockSize}` ``.',
    ],
    walkthrough: `**How to think about it.** The type has three variants, so the body has three branches; that is type-driven design doing the planning for you. The redesign also means you cannot make the engine's old mistake: there is no \`blockSize\` on an \`'soa'\` plan to read by accident.

**The solution, line by line.**

- The \`type Plan\` union is given; only the \`'aosoa'\` variant has \`blockSize\`.
- \`function unreachable(x: never): never {\` is the exhaustiveness helper from the tagged unions chapter: the checker only lets you call it where nothing is left, and at run time it throws for bad data.
- \`  if (p.layout === 'aos') {\` and its \`return 'kept as array of objects';\` handle the first variant, with the exact words the engine prints.
- \`  if (p.layout === 'soa') {\` returns \`'struct of arrays'\`.
- \`  if (p.layout === 'aosoa') {\`: here the checker has narrowed \`p\` to the variant with \`blockSize\`, so \`    const n = p.blockSize;\` is allowed (it is copied into \`n\` only to keep the next line short), and the template literal on the \`return\` line builds \`'AoSoA, blocks of 16'\` for a block size of 16.
- \`  return unreachable(p);\`: after three checks, \`p\` has the type \`never\` for the checker. A plan such as \`{ layout: 'columns' }\` can still arrive from outside (types are erased), and then this line throws.

**Common wrong attempts.**

- Reading \`p.blockSize\` before checking the layout: \`tsc\` reports that \`blockSize\` does not exist on the \`'aos'\` variant.
- Ending with \`return 'struct of arrays';\` for "anything else" quietly gives a wrong verdict for bad data, where the test expects a throw.`,
    wrong: [
      {
        code: `function verdict(p) {
  if (p.layout === 'aos') {
    return 'kept as array of objects';
  }
  if (p.layout === 'aosoa') {
    const n = p.blockSize;
    return \`AoSoA, blocks of \${n}\`;
  }
  return 'struct of arrays';
}`,
        why: 'Anything that is not aos or aosoa becomes “struct of arrays”, so a layout from bad data gets a wrong verdict instead of an error.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'How many states does `{ on: boolean; level?: number }` allow, counting any number as one state, and how many does `{ kind: \'off\' } | { kind: \'on\'; level: number }` allow?',
    options: [
      { t: '4 and 2', correct: true, why: 'Two for `on` times two for `level` (there or missing) is 4; the union adds 1 + 1. “Off with a level” and “on with no level” are gone.' },
      { t: '3 and 2', why: 'Fields multiply: 2 × 2 is 4, not 2 + 1.' },
      { t: '4 and 4', why: 'A union adds one state per variant, so it has 2.' },
      { t: '2 and 2', why: 'The optional `level` doubles the states of the object type.' },
    ],
  },
  {
    q: 'Which design makes “loaded but with no text” impossible to build?',
    options: [
      { t: '`{ loaded: boolean; text?: string }`', why: '`{ loaded: true }` with no text is accepted.' },
      { t: '`{ loaded: boolean; text: string | undefined }`', why: '`text` may still be `undefined` when `loaded` is true.' },
      { t: '`{ kind: \'loading\' } | { kind: \'loaded\'; text: string }`', correct: true, why: 'The loaded variant requires `text`, and the checker refuses one without it.' },
      { t: 'A comment saying “text is always set when loaded”', why: 'A comment is not checked by anything.' },
    ],
  },
  {
    q: 'In type-driven design, what is the usual order of work?',
    options: [
      { t: 'Bodies, then tests, then types at the end', why: 'That is writing code first and adding labels afterwards; the types then describe whatever happened, nonsense included.' },
      { t: 'Data types, then signatures, then bodies', correct: true, why: 'The types decide which states exist; the signatures what each function promises; the bodies follow them.' },
      { t: 'Signatures, then bodies, then data types', why: 'The signatures need the data types to talk about.' },
    ],
  },
  {
    q: '`type Light = \'red\' | \'amber\' | \'green\'` gains `\'flashing\'`, and `next(l)` ends with `return unreachable(l);`. What happens when you run `tsc`?',
    options: [
      { t: 'Nothing: the program has to run to find out', why: 'The checker finds it without running anything.' },
      { t: 'An error at every use of `Light` in the program', why: 'Only places that no longer cover every variant are reported.' },
      { t: 'An error on the `unreachable(l)` line: `"flashing"` is not assignable to `never`', correct: true, why: 'l can still be flashing there, so the checker points at exactly the function that has to catch up.' },
      { t: 'tsc adds the missing branch for you', why: 'The checker reports; you write the branch.' },
    ],
  },
  {
    q: 'Viscosity’s printer writes `m.bindings[i.binding!]`. What does the `!` do?',
    options: [
      { t: 'It tells the checker that `i.binding` is not `undefined`, without checking anything', correct: true, why: 'It is an assertion, erased like every type; if the value were missing, nothing would stop it at run time.' },
      { t: 'It throws if `i.binding` is `undefined`', why: 'No check happens at run time: `!` is removed with the types.' },
      { t: 'It negates the value, like `!x`', why: 'A `!` *after* an expression is a different thing from the `!` before one.' },
      { t: 'It makes the field required in the `Inst` type', why: 'It changes nothing about the type `Inst`; it only silences the checker at this one place.' },
    ],
  },
];
