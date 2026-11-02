// Chapter 207 cards. Keys are stable ids: never rename them.

export const prompts = {
  'codegen-what': {
    q: 'What is code generation?',
    a: 'The compiler step that turns its internal form back into output text: machine code, bytecode, or (for Viscosity) source code.',
  },
  'pretty-what': {
    q: 'What does a pretty-printer do, and what does it lose?',
    a: 'It prints code from a tree in a chosen, consistent style. It loses the original layout: spacing, line breaks, and comments unless they were attached to nodes.',
  },
  'splice-why': {
    q: 'Why does Viscosity splice edits into the source instead of printing the tree?',
    a: 'Everything it doesn’t change, comments and formatting included, is copied byte for byte.',
  },
  'src-ref': {
    q: 'How does the emitter find the source text for a VIR instruction?',
    a: 'Each instruction’s `src` holds its ESTree node with `start` and `end` offsets, recorded during lowering.',
  },
  'push-flatten': {
    q: 'What does `ps.push({ x: a, vx: b })` become for an SoA collection?',
    a: '`ps.push(a, b)`: the field values in column order, which the generated push writes into the columns.',
  },
  'forof-rewrite': {
    q: 'After `for (const p of ps)` is rewritten, what does `p` hold, and what does `p.x` become?',
    a: 'An index: the header becomes `let p = 0; p < ps.length; p++`, and `p.x` becomes `ps.x[p]`.',
  },
  'back-to-front': {
    q: 'Why are edits applied from the highest start offset down?',
    a: 'An edit changes the length of the text after it. Going backwards, every edit still to apply lies before the change, so its offsets stay valid.',
  },
  'overlap-bug': {
    q: 'Why does the emitter throw on overlapping edits instead of picking one?',
    a: 'Two edits for the same characters means two parts of the emitter disagree: no order is right, so it refuses rather than emit broken code.',
  },
  'dedupe-why': {
    q: 'Why does `p.x += p.vx` need the field-edit dedupe?',
    a: 'Its `p.x` is both a field.get and a field.set with the same source range. Two edits for one range would overlap; the map keeps one, preferring the read.',
  },
  'prelude-strict': {
    q: 'Why is the prelude inserted after a `"use strict"` line, not at offset 0?',
    a: 'A directive only takes effect at the very start of a script. Code above it would turn strict mode off.',
  },
  'nothing-to-do': {
    q: 'What does `emitJs` return when no collection is transformed?',
    a: 'The original source, unchanged: with no prelude, it returns before applying any edits.',
  },
};

export const examples = {};

export const exercises = {
  applyEdits: {
    title: 'Apply range edits back to front',
    prompt:
      'Write `applyEdits(src, edits)`. Each edit is `{ start, end, text }`: replace `src.slice(start, end)` with `text`. All offsets refer to the **original** `src`, and the edits arrive in any order. Apply them so the result is right, and **throw an `Error`** if two edits overlap (edits that only touch, like `[2, 4)` and `[4, 6)`, are fine). Don’t change the `edits` array you were given.',
    starter: `function applyEdits(src, edits) {
  let out = src;
  for (const e of edits) {
    out = out.slice(0, e.start)
      + e.text + out.slice(e.end);
  }
  return out;
}

const es = [
  { start: 4, end: 5, text: 'xs' },
  { start: 8, end: 10, text: 'C' },
];
const src = 'let a = [];';
console.log(applyEdits(src, es));`,
    solution: `function applyEdits(src, edits) {
  const es = [...edits].sort(
    (a, b) => b.start - a.start);
  let out = src;
  let last = Infinity;
  for (const e of es) {
    if (e.end > last) {
      throw new Error('overlap');
    }
    out = out.slice(0, e.start)
      + e.text + out.slice(e.end);
    last = e.start;
  }
  return out;
}`,
    tests: `test('edits in source order', () => {
  expect(applyEdits('let a = [];', [
    { start: 4, end: 5, text: 'xs' },
    { start: 8, end: 10, text: 'new C()' },
  ])).toBe('let xs = new C();');
});
test('edits in any order', () => {
  expect(applyEdits('p.x + p.y', [
    { start: 0, end: 3, text: 'ps.x[p]' },
    { start: 6, end: 9, text: 'ps.y[p]' },
  ].reverse())).toBe('ps.x[p] + ps.y[p]');
});
test('touching edits are fine', () => {
  expect(applyEdits('abcdef', [
    { start: 2, end: 4, text: 'X' },
    { start: 4, end: 6, text: 'Y' },
  ])).toBe('abXY');
});
test('overlaps throw', () => {
  expect(() => applyEdits('abcdef', [
    { start: 1, end: 4, text: 'X' },
    { start: 3, end: 5, text: 'Y' },
  ])).toThrow();
  expect(() => applyEdits('p.x += 1', [
    { start: 0, end: 3, text: 'a' },
    { start: 0, end: 3, text: 'b' },
  ])).toThrow();
});
test('the input array is untouched', () => {
  const es = [{ start: 0, end: 1, text: 'A' }, { start: 2, end: 3, text: 'C' }];
  applyEdits('abc', es);
  expect(es[0].start).toBe(0);
});`,
    hints: [
      'Applying front to back breaks as soon as one replacement has a different length. Sort a copy, highest `start` first.',
      'Remember the `start` of the edit you just applied. The next edit (further left) must end at or before it.',
      'Use `[...edits].sort(...)` so the caller’s array keeps its order.',
    ],
    walkthrough: `This is the loop at the end of Viscosity’s \`emitJs\`.

- **Why backwards.** The starter applies the first edit, \`a\` → \`xs\`, which makes the string one character longer. The second edit’s offsets (8–10) now point one character too early. Sorting by \`start\`, descending, means each edit only shifts text you have already finished with.
- **Overlap detection is one comparison.** After sorting, the edits you’ve applied all start at or after \`last\`. A new edit overlaps one of them exactly when its \`end\` is past \`last\`. Touching (\`end === last\`) is fine: the two ranges share no character.
- **Identical ranges overlap too.** Two edits for \`p.x\` (one from a read, one from a write) are the case the field-edit dedupe exists to prevent.
- **Copy before sorting.** \`sort\` works in place; sorting the caller’s array would be a surprising side effect.`,
    wrong: [
      {
        code: `function applyEdits(src, edits) {
  const es = [...edits].sort(
    (a, b) => a.start - b.start);
  let out = src;
  let last = -1;
  for (const e of es) {
    if (e.start < last) {
      throw new Error('overlap');
    }
    out = out.slice(0, e.start)
      + e.text + out.slice(e.end);
    last = e.end;
  }
  return out;
}`,
        why: 'Sorted front to back, the overlap check is right, but each replacement that changes length shifts the text under every later edit, so later offsets hit the wrong characters.',
      },
      {
        code: `function applyEdits(src, edits) {
  const es = [...edits].sort(
    (a, b) => b.start - a.start);
  let out = src;
  for (const e of es) {
    out = out.slice(0, e.start)
      + e.text + out.slice(e.end);
  }
  return out;
}`,
        why: 'The result is right for good input, but overlapping edits are applied silently, producing garbage instead of an error.',
      },
    ],
  },
  dedupe: {
    optional: true,
    title: 'One edit per range',
    prompt:
      'Field edits come with a flag: `{ start, end, text, write }`. Write `dedupe(edits)`, returning a list with **one edit per `start`/`end` range**: the first one seen for that range, unless the kept one has `write: true` and a later one for the same range doesn’t, in which case the read replaces it. Keep ranges in the order they first appear.',
    starter: `function dedupe(edits) {
  return edits;
}`,
    solution: `function dedupe(edits) {
  const m = new Map();
  for (const e of edits) {
    const k = e.start + ':' + e.end;
    const prev = m.get(k);
    if (!prev
      || (!e.write && prev.write)) {
      m.set(k, e);
    }
  }
  return [...m.values()];
}`,
    tests: `const r = (start, end, text, write) => ({ start, end, text, write });
test('different ranges all kept', () => {
  const es = [r(0, 3, 'a', false), r(5, 8, 'b', true)];
  expect(dedupe(es).map((e) => e.text)).toEqual(['a', 'b']);
});
test('the read wins', () => {
  const es = [r(0, 3, 'write', true), r(0, 3, 'read', false)];
  expect(dedupe(es).map((e) => e.text)).toEqual(['read']);
});
test('a later write does not replace a read', () => {
  const es = [r(0, 3, 'read', false), r(0, 3, 'write', true)];
  expect(dedupe(es).map((e) => e.text)).toEqual(['read']);
});
test('order of first appearance', () => {
  const es = [r(9, 12, 'z', true), r(0, 3, 'a', false), r(9, 12, 'Z', false)];
  expect(dedupe(es).map((e) => e.text)).toEqual(['Z', 'a']);
});`,
    hints: [
      'Key a `Map` by `start + \':\' + end`.',
      'Replace the stored edit only if there is none yet, or the old one writes and the new one doesn’t.',
      'A `Map` keeps keys in insertion order, and `set` on an existing key keeps its position.',
    ],
    walkthrough: `This is \`fieldEdit\` from \`emit.ts\`.

- **Why ranges collide.** In \`p.x += 1\`, lowering emits a \`field.get\` and a \`field.set\` whose source ranges both cover \`p.x\`. Each produces an edit to the same characters.
- **Why one must go.** Two edits on one range are an overlap, and \`applyEdits\` would (rightly) throw.
- **Which one to keep.** Both rewrite \`p.x\` to the same column slot, so either works when the access is proven in bounds. They differ only in the bounds-check call, where the flag picks the error message. Viscosity keeps the read’s, because JavaScript evaluates \`p.x += 1\` by reading \`p.x\` first: out of bounds, V8 says “Cannot read properties of undefined (reading 'x')”, and so must the compiled code. (An earlier version kept the write’s and said “Cannot set”; a corpus test caught it.)
- **Order.** Re-setting an existing \`Map\` key keeps its original position, so the output follows first appearance. The emitter then sorts everything anyway.`,
    wrong: [
      {
        code: `function dedupe(edits) {
  const m = new Map();
  for (const e of edits) {
    m.set(e.start + ':' + e.end, e);
  }
  return [...m.values()];
}`,
        why: 'Last one wins, so a write that comes after the read replaces it.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does Viscosity do with a comment on a line it rewrites, such as `ps.push({ x: i }); // spawn`?',
    options: [
      { t: 'Drops it, because comments are not in the AST', why: 'Viscosity never reprints from the AST, so nothing it doesn’t edit can be lost.' },
      { t: 'Moves it to the top of the file', why: 'Only the prelude goes at the top.' },
      { t: 'Keeps it exactly where it was: only the object literal’s range is replaced', correct: true, why: 'The push edit covers `{ x: i }` alone; everything else is copied.' },
      { t: 'Reformats it with the rest of the line', why: 'There is no formatter: untouched text is copied byte for byte.' },
    ],
  },
  {
    q: 'Edits at offsets 11–13 (2 chars → 14 chars) and 55–70. In which order are they applied, and why?',
    options: [
      { t: '11–13 first, because it comes first in the file', why: 'That would shift 55–70 by 12 characters, breaking its offsets.' },
      { t: 'In any order: offsets are recomputed after each edit', why: 'They are not recomputed; that is why the order matters.' },
      { t: 'Both at once, with a regular expression', why: 'Each is a separate slice-and-join.' },
      { t: '55–70 first: applying later edits first leaves earlier offsets valid', correct: true, why: 'Sorted by start, descending.' },
    ],
  },
  {
    q: 'Without the field-edit dedupe, what would compiling `for (const p of ps) p.x += p.vx;` do?',
    options: [
      { t: 'Throw “internal error: overlapping rewrites at 93-96”', correct: true, why: 'The read and the write of p.x produce two edits for the same range.' },
      { t: 'Write `ps.x[p]` twice, as `ps.x[p]ps.x[p]`', why: 'The overlap check stops before anything is applied twice.' },
      { t: 'Nothing different', why: 'Two edits for one range is exactly what the check catches.' },
      { t: 'Leave `p.x` unchanged', why: 'Both edits would try to change it.' },
    ],
  },
  {
    q: 'A file starts with `#!/usr/bin/env node` and then `\'use strict\';`. Where does the generated class go?',
    options: [
      { t: 'At offset 0, before the shebang', why: 'A shebang must be the first line, and the directive must come before other code.' },
      { t: 'After both lines', correct: true, why: 'The emitter matches an optional shebang and directive and inserts the prelude after them.' },
      { t: 'At the end of the file', why: 'Class declarations are not hoisted like functions; the class must come before its uses.' },
      { t: 'Between the shebang and the directive', why: 'Then the directive would no longer be first and strict mode would be off.' },
    ],
  },
  {
    q: 'Which statement about pretty-printing is true?',
    options: [
      { t: 'Viscosity pretty-prints the whole output', why: 'It only splices edits; even the prelude is template text.' },
      { t: 'It needs only the tree, so it keeps the original layout', why: 'The tree doesn’t record the original layout; that is what gets lost.' },
      { t: 'It is the same as splicing', why: 'Splicing copies the original text; printing regenerates it.' },
      { t: 'It prints code from a tree in a chosen style, discarding the original formatting', correct: true, why: 'Which is why Viscosity avoids it.' },
    ],
  },
  {
    q: 'After `const p = ps[i];` is rewritten to `const p = i;`, what must happen to `p.x`?',
    options: [
      { t: 'Nothing: `p.x` still works', why: 'p is a number now; `p.x` would be undefined.' },
      { t: 'It becomes `ps.x[p]`, possibly with a bounds check around `p`', correct: true, why: 'p holds the index, so every field access through it is rewritten too.' },
      { t: 'It becomes `ps[p].x`', why: 'There are no element objects any more; the data is in columns.' },
      { t: 'It becomes a call to `ps.get(p)`', why: 'No element object is created for an access through an index.' },
    ],
  },
];
