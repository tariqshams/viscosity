// Chapter 171 cards. Keys are stable ids: never rename them.

export const prompts = {
  'poly-what': {
    q: 'What does **polymorphic** mean, and what was its limit in the V8 inside Node 22?',
    a: 'Several shapes have been seen at one site; up to four (max_valid_polymorphic_map_count defaults to 4).',
  },
  'mega-what': {
    q: 'What does a **megamorphic** access do instead of keeping its own entries?',
    a: 'It uses the stub cache, a table shared by all megamorphic loads that maps a shape and a name to a handler.',
  },
  'log-letters': {
    q: 'In `--log-ic` output, what do `0`, `1`, `P` and `N` mean?',
    a: 'Uninitialised, monomorphic, polymorphic and megamorphic.',
  },
  'count-shapes': {
    q: 'A site sees shape A a thousand times, then shape B once. What state is it in?',
    a: 'Polymorphic: the states count different shapes (two here), not accesses.',
  },
  'eight-calls': {
    q: 'Why did the experiments call `getX` ten times per shape rather than five?',
    a: 'In Node 22 a function gets its feedback vector only after about eight calls; shapes seen before that are never recorded.',
  },
  'stub-shared': {
    q: 'Why does a megamorphic site give Maglev or TurboFan nothing to specialise on?',
    a: 'It keeps no shapes of its own; the stub cache is shared by every megamorphic load, so it says nothing about what this site sees.',
  },
  'mixin-mega': {
    q: 'Why can a `super.m()` call inside a mixin become megamorphic?',
    a: 'Each use of the mixin creates a new class, so the one call site meets a new shape every time.',
  },
  'poly-ok': {
    q: 'Should you worry about a site that sees two or three shapes?',
    a: 'Usually not: it is polymorphic, not megamorphic. Worry about the hot loops, and keep those monomorphic.',
  },
};

export const examples = {
  'mono-vs-mega': {
    title: 'One shape against twenty',
    code: `function sumA(xs) {
  let s = 0;
  for (const o of xs) s += o.x;
  return s;
}
function sumB(xs) {
  let s = 0;
  for (const o of xs) s += o.x;
  return s;
}
const one = [], many = [];
for (let i = 0; i < 1000; i++) {
  one.push({ x: i, k: 0 });
  const o = { x: i };
  o['k' + (i % 20)] = 0; // 20 shapes
  many.push(o);
}
function time(sum, xs) {
  const t = performance.now();
  for (let r = 0; r < 3000; r++) {
    sum(xs);
  }
  const ms = performance.now() - t;
  return ms.toFixed(1) + ' ms';
}
for (let k = 0; k < 2; k++) {
  console.log('1 shape: ',
    time(sumA, one));
  console.log('20 shapes:',
    time(sumB, many));
}
// The numbers are your device's.`,
  },
};

export const exercises = {
  icStates: {
    title: 'From monomorphic to megamorphic',
    prompt:
      'Simulate V8’s IC states. `icStates(seq)` gets the shapes reaching one access site, in order (for example `["A", "A", "B"]`). Return the state after each access: `"1"` if one shape has been seen, `"P"` for two to four, and `"N"` once a fifth different shape arrives. Once `"N"`, it stays `"N"`.',
    starter: `function icStates(seq) {
  const seen = new Set();
  return seq.map((s) => {
    seen.add(s);
    return seen.size === 1 ? '1' : 'P';
  });
}`,
    solution: `function icStates(seq) {
  const seen = new Set();
  let mega = false;
  return seq.map((s) => {
    if (mega) return 'N';
    const fresh = !seen.has(s);
    if (fresh && seen.size === 4) {
      mega = true;
      return 'N';
    }
    seen.add(s);
    return seen.size === 1 ? '1' : 'P';
  });
}`,
    tests: `test('one shape stays monomorphic', () => {
  expect(icStates(['A', 'A', 'A']))
    .toEqual(['1', '1', '1']);
});
test('the chapter run: five shapes', () => {
  const out = icStates(['A', 'B', 'C', 'D', 'E']);
  expect(out).toEqual(['1', 'P', 'P', 'P', 'N']);
});
test('old shapes do not count twice', () => {
  const seq = ['A', 'B', 'A', 'C', 'B', 'D', 'A'];
  expect(icStates(seq)).toEqual(
    ['1', 'P', 'P', 'P', 'P', 'P', 'P']);
});
test('megamorphic is for good', () => {
  const seq = ['A', 'B', 'C', 'D', 'E', 'A', 'A'];
  expect(icStates(seq).slice(4))
    .toEqual(['N', 'N', 'N']);
});`,
    hints: [
      'Keep a `Set` of the shapes seen so far, and a flag for “gone megamorphic”.',
      'A shape already in the set changes nothing. A *new* shape when the set already holds four is the fifth: go megamorphic.',
      'Once the flag is set, return `"N"` straight away for every later access.',
    ],
    walkthrough: `**How to think about it.** The chapter's Formal box is the whole specification: the state depends on how many *different* shapes have arrived, and once a fifth arrives the site is megamorphic for good. So you need to remember two things between accesses: the set of shapes seen so far, and whether the site has already given up. Then each access is a short series of questions, asked in the right order.

**The solution, line by line.**

- \`const seen = new Set();\` holds the different shapes seen; a \`Set\` ignores repeats, which is exactly "different shapes".
- \`let mega = false;\` records whether the site has given up.
- \`return seq.map((s) => {\` turns each arriving shape into the state after it.
- \`if (mega) return 'N';\` comes first: once megamorphic, nothing else matters.
- \`const fresh = !seen.has(s);\` asks whether this shape is new to the site.
- \`if (fresh && seen.size === 4) {\` catches the fifth different shape: four are already listed, and this is a new one.
- \`mega = true;\` and \`return 'N';\` give up, for good. Notice the fifth shape is never added to \`seen\`: a megamorphic site keeps no list at all.
- \`}\` ends that case.
- \`seen.add(s);\` records the shape (adding one already there changes nothing).
- \`return seen.size === 1 ? '1' : 'P';\` gives monomorphic for one shape, polymorphic for two to four.
- \`});\` ends the \`map\`.

Trace the second test: A gives \`1\`; B, C and D each give \`P\` (two, three, four shapes); E finds four already listed and is new, so \`N\`, which is the real \`--log-ic\` run's \`1, P, P, P, N\`.

**Common wrong attempts.**

- Counting accesses instead of different shapes: a site that sees shape A a hundred times would wrongly turn megamorphic, which the first and third tests catch.
- Checking \`seen.size > 4\` *after* adding: that works for the fifth shape, but forgetting the \`mega\` flag means a later access with an old shape (A again) drops back to \`P\`, which the last test catches.`,
    wrong: [
      {
        code: `function icStates(seq) {
  let n = 0;
  return seq.map(() => {
    n++;
    if (n === 1) return '1';
    return n <= 4 ? 'P' : 'N';
  });
}`,
        why: 'This counts accesses, not different shapes. A site that sees shape A a hundred times is still monomorphic.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In the five-shape `--log-ic` run, which line shows the access becoming megamorphic?',
    options: [
      { t: '`LoadIC 1:29 0 1 x`', why: 'That is the first shape: uninitialised to monomorphic.' },
      { t: '`LoadIC 1:29 1 P x`', why: 'That is the second shape: monomorphic to polymorphic.' },
      { t: '`LoadIC 1:29 P N x`', correct: true, why: 'The fifth shape exceeded the limit of four, so the state went from P to N.' },
      { t: '`LoadIC 1:29 P P x`', why: 'Still polymorphic: a third or fourth shape was added to the list.' },
    ],
  },
  {
    q: 'What does a megamorphic access use instead of its own list of shapes?',
    options: [
      { t: 'The object’s dictionary', why: 'The object is still a fast object; it is the access site that gave up.' },
      { t: 'The stub cache, shared by all megamorphic loads, keyed by shape and name', correct: true, why: 'V8’s source describes the stub cache as mapping a map and a name to a handler.' },
      { t: 'The constant pool', why: 'The constant pool holds the name `"x"`, not shapes or handlers.' },
    ],
  },
  {
    q: 'Five AST node classes all set `this.type` first. Why is `n.type` in `kindOf` megamorphic?',
    options: [
      { t: 'Because `type` is at a different offset in each class', why: 'It is field 0 in all of them; the offset is not the issue.' },
      { t: 'Because objects of different classes have different maps, so the site sees five shapes', correct: true, why: 'And five is more than the limit of four.' },
      { t: 'Because `kindOf` is an arrow function', why: 'Arrow functions get inline caches like any other function.' },
      { t: 'Because strings are slow to read', why: 'The value being a string has nothing to do with the state of the load.' },
    ],
  },
  {
    q: 'A site sees shapes A, B, A, C, B, D, A, in that order. What state is it in at the end?',
    options: [
      { t: 'Megamorphic: seven accesses', why: 'The states count different shapes, not accesses.' },
      { t: 'Monomorphic: A came most often', why: 'Any second shape makes it polymorphic.' },
      { t: 'Polymorphic: four different shapes', correct: true, why: 'A, B, C and D: exactly the limit, not past it.' },
    ],
  },
  {
    q: 'Which change is most worth making for speed?',
    options: [
      { t: 'A helper used in three places, seeing three shapes, rewritten into three copies', why: 'Three shapes is polymorphic, which is fine unless it is very hot.' },
      { t: 'A hot particle loop whose objects are built in two places in two key orders, changed to build them one way', correct: true, why: 'The loop is hot, and one way of building gives every access in it one shape.' },
      { t: 'Every object in the program given the same keys', why: 'Unnecessary and unreadable; only the hot code’s sites matter.' },
    ],
  },
];
