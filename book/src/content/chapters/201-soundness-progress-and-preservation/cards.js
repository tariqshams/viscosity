// Chapter 92 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'sound-what': {
    q: 'What does it mean for a type system to be sound?',
    a: 'Every term that has a type either runs forever or reaches a value: it never gets stuck.',
  },
  'progress-what': {
    q: 'State the progress lemma.',
    a: 'If ⊢ e : T, then e is a value, or e → e′ for some e′.',
  },
  'preservation-what': {
    q: 'State the preservation lemma.',
    a: 'If ⊢ e : T and e → e′, then ⊢ e′ : T.',
  },
  canonical: {
    q: 'What does the canonical forms lemma say, and which proof needs it?',
    a: 'A value of type number is a numeral, and a value of type bool is true or false. Progress needs it, to know that Add or IfT/IfF applies.',
  },
  conservative: {
    q: 'Why does a sound type system reject `if true then 1 else false`, which runs fine?',
    a: 'T-If needs both branches to have the same type; the checker cannot know which branch will run, so it rejects every program that could go wrong, and some that would not.',
  },
  'ts-non-goal': {
    q: 'What do TypeScript’s design goals say about soundness?',
    a: 'A sound or provably correct type system is a non-goal: it aims for a balance between correctness and productivity.',
  },
  'any-unsound': {
    q: 'Why does `const a: any = 5; a.toUpperCase();` pass tsc?',
    a: 'A value of type any may be used as anything, so the checker does not check the call; it throws at run time.',
  },
  'cast-unsound': {
    q: 'Why is `5 as unknown as string` unsound?',
    a: 'Type assertions are removed when compiling and never checked at run time, so the value is still the number 5 while its type says string.',
  },
  'index-unsound': {
    q: 'What type does `xs[5]` have when `xs: number[]` has three elements, and what is its value?',
    a: 'Its type is number (unless noUncheckedIndexedAccess is on); its value is undefined.',
  },
};

export const examples = {};

export const exercises = {
  sound: {
    title: 'A type checker, tested for soundness',
    prompt: 'Chapter 188’s language and its `step` function are given. Write `typeOf(e)`, which applies the chapter’s typing rules and returns `\'number\'`, `\'bool\'`, or `null` when the term has no type. The tests then check soundness for you: on about fifty thousand terms, every term your `typeOf` gives a type to must keep stepping (progress) with the same type after every step (preservation) until it reaches a value.',
    starter: `// the language of chapter 188
const num = (n) => ({ k: 'num', n });
const bool = (b) => ({ k: 'bool', b });
const add = (l, r) =>
  ({ k: 'add', l, r });
const lt = (l, r) =>
  ({ k: 'lt', l, r });
const iff = (c, t, e) =>
  ({ k: 'if', c, t, e });
const isVal = (e) =>
  e.k === 'num' || e.k === 'bool';

// one small step, or null (stuck or
// a value): chapter 188's rules
function step(e) {
  if (isVal(e)) return null;
  if (e.k === 'if') {
    if (e.c.k === 'bool') {
      return e.c.b ? e.t : e.e;
    }
    const c = step(e.c);
    return c && iff(c, e.t, e.e);
  }
  const make = e.k === 'add' ? add : lt;
  if (!isVal(e.l)) {
    const l = step(e.l);
    return l && make(l, e.r);
  }
  if (!isVal(e.r)) {
    const r = step(e.r);
    return r && make(e.l, r);
  }
  const { l, r } = e;
  if (l.k !== 'num' || r.k !== 'num') {
    return null;
  }
  return e.k === 'add'
    ? num(l.n + r.n)
    : bool(l.n < r.n);
}

function typeOf(e) {
  return null;
}`,
    solution: `// the language of chapter 188
const num = (n) => ({ k: 'num', n });
const bool = (b) => ({ k: 'bool', b });
const add = (l, r) =>
  ({ k: 'add', l, r });
const lt = (l, r) =>
  ({ k: 'lt', l, r });
const iff = (c, t, e) =>
  ({ k: 'if', c, t, e });
const isVal = (e) =>
  e.k === 'num' || e.k === 'bool';

// one small step, or null (stuck or
// a value): chapter 188's rules
function step(e) {
  if (isVal(e)) return null;
  if (e.k === 'if') {
    if (e.c.k === 'bool') {
      return e.c.b ? e.t : e.e;
    }
    const c = step(e.c);
    return c && iff(c, e.t, e.e);
  }
  const make = e.k === 'add' ? add : lt;
  if (!isVal(e.l)) {
    const l = step(e.l);
    return l && make(l, e.r);
  }
  if (!isVal(e.r)) {
    const r = step(e.r);
    return r && make(e.l, r);
  }
  const { l, r } = e;
  if (l.k !== 'num' || r.k !== 'num') {
    return null;
  }
  return e.k === 'add'
    ? num(l.n + r.n)
    : bool(l.n < r.n);
}

function typeOf(e) {
  if (e.k === 'num') return 'number';
  if (e.k === 'bool') return 'bool';
  if (e.k === 'add' || e.k === 'lt') {
    const l = typeOf(e.l);
    const r = typeOf(e.r);
    if (l !== 'number') return null;
    if (r !== 'number') return null;
    return e.k === 'add'
      ? 'number' : 'bool';
  }
  // what is left is an if
  if (typeOf(e.c) !== 'bool') {
    return null;
  }
  const t = typeOf(e.t);
  if (t === null) return null;
  return t === typeOf(e.e) ? t : null;
}`,
    tests: `test('literals', () => {
  expect(typeOf(num(3))).toBe('number');
  expect(typeOf(bool(false))).toBe('bool');
});
test('+ and < need numbers', () => {
  expect(typeOf(add(num(1), num(2)))).toBe('number');
  expect(typeOf(lt(num(1), num(2)))).toBe('bool');
  expect(typeOf(add(bool(true), num(1)))).toBe(null);
  expect(typeOf(add(num(1), lt(bool(true), num(2))))).toBe(null);
});
test('if needs a bool and two equal branches', () => {
  expect(typeOf(iff(lt(num(1), num(2)), add(num(3), num(4)), num(0)))).toBe('number');
  expect(typeOf(iff(num(1), num(2), num(3)))).toBe(null);
  expect(typeOf(iff(bool(true), num(1), bool(false)))).toBe(null);
  expect(typeOf(iff(bool(true), iff(bool(true), num(1), bool(false)), num(2)))).toBe(null);
});
const atoms = [num(0), num(1), bool(true), bool(false)];
const one = [];
for (const a of atoms) for (const b of atoms) one.push(add(a, b), lt(a, b));
for (const a of atoms) for (const b of atoms) for (const c of atoms) one.push(iff(a, b, c));
const all = [...atoms, ...one];
for (const a of one) for (const b of one) all.push(add(a, b), lt(a, b));
for (const c of one) for (const a of atoms) for (const b of one.slice(0, 40)) all.push(iff(c, a, b), iff(c, b, a));
test('progress and preservation on every typed term', () => {
  let typed = 0;
  let bad = null;
  for (const e of all) {
    const T = typeOf(e);
    if (T === null) continue;
    typed++;
    let cur = e;
    while (!isVal(cur) && !bad) {
      const next = step(cur);
      if (next === null) bad = 'stuck';
      else if (typeOf(next) !== T) bad = 'type changed';
      cur = next ?? cur;
    }
    if (bad) break;
  }
  expect(bad).toBe(null);
  expect(typed > 500).toBe(true);
});`,
    hints: [
      'One case per rule: literals, then `+` and `<` together (same premises, different conclusions), then `if`. Each premise becomes a recursive call to `typeOf` on a part.',
      'For `+` and `<`: both parts must have type `\'number\'`; if either does not (including `null`), return `null`. Then `+` gives `\'number\'` and `<` gives `\'bool\'`.',
      'For `if`: the condition must be `\'bool\'`; then type both branches, and return the type only if the then branch has one and the two are equal (`t === typeOf(e.e)`); otherwise `null`. Note the else branch is `e.e`, because `e.k` is taken.',
    ],
    walkthrough: `**How to think about it.** A type checker for this language is the typing rules read from bottom to top: to find the type of a term, find which rule’s conclusion matches its shape, and check that rule’s premises by typing the parts. \`null\` stands for “no rule applies”, and it must spread: a sum with an ill-typed part is ill-typed. The tests then do what the chapter’s proof does by hand, but by brute force: they take every typed term in a large pool and run it, checking at each step that some rule applies and that the type has not changed. A checker that is too generous (gives a type to a term that can get stuck, or whose type changes) is caught by that sweep.

**The solution, line by line.**

- \`if (e.k === 'num') return 'number';\` and \`if (e.k === 'bool') return 'bool';\` The axioms: literals have their types with no premises.
- \`if (e.k === 'add' || e.k === 'lt') {\` T-Add and T-Lt have the same premises.
- \`const l = typeOf(e.l); const r = typeOf(e.r);\` Type both parts.
- \`if (l !== 'number') return null; if (r !== 'number') return null;\` Both premises say \`number\`; a \`bool\` or a \`null\` part fails them.
- \`return e.k === 'add' ? 'number' : 'bool';\` The two conclusions differ: a sum is a number, a comparison a bool.
- \`if (typeOf(e.c) !== 'bool') { return null; }\` T-If’s first premise.
- \`const t = typeOf(e.t); if (t === null) return null;\` The then branch must have a type.
- \`return t === typeOf(e.e) ? t : null;\` and the else branch the same type, which is then the type of the whole if.

**Common wrong attempts.**

- Typing an if by its then branch alone: \`if false then 1 else true\` gets \`number\`, steps to \`true\`, and preservation fails; the sweep reports “type changed”.
- Letting \`+\` accept anything and return \`number\`: \`true + 1\` gets a type, but it is stuck, and the sweep reports “stuck”: progress fails.
- Checking only the branches of an if, not its condition: \`if 1 then 2 else 3\` would be typed \`number\`, yet it is stuck at once, since no rule steps an if whose condition is a number.`,
    wrong: [
      {
        code: `// the language of chapter 188
const num = (n) => ({ k: 'num', n });
const bool = (b) => ({ k: 'bool', b });
const add = (l, r) =>
  ({ k: 'add', l, r });
const lt = (l, r) =>
  ({ k: 'lt', l, r });
const iff = (c, t, e) =>
  ({ k: 'if', c, t, e });
const isVal = (e) =>
  e.k === 'num' || e.k === 'bool';

// one small step, or null (stuck or
// a value): chapter 188's rules
function step(e) {
  if (isVal(e)) return null;
  if (e.k === 'if') {
    if (e.c.k === 'bool') {
      return e.c.b ? e.t : e.e;
    }
    const c = step(e.c);
    return c && iff(c, e.t, e.e);
  }
  const make = e.k === 'add' ? add : lt;
  if (!isVal(e.l)) {
    const l = step(e.l);
    return l && make(l, e.r);
  }
  if (!isVal(e.r)) {
    const r = step(e.r);
    return r && make(e.l, r);
  }
  const { l, r } = e;
  if (l.k !== 'num' || r.k !== 'num') {
    return null;
  }
  return e.k === 'add'
    ? num(l.n + r.n)
    : bool(l.n < r.n);
}

function typeOf(e) {
  if (e.k === 'num') return 'number';
  if (e.k === 'bool') return 'bool';
  if (e.k === 'add' || e.k === 'lt') {
    const l = typeOf(e.l);
    const r = typeOf(e.r);
    if (l !== 'number') return null;
    if (r !== 'number') return null;
    return e.k === 'add'
      ? 'number' : 'bool';
  }
  // what is left is an if
  if (typeOf(e.c) !== 'bool') {
    return null;
  }
  const t = typeOf(e.t);
  if (t === null) return null;
  return t;
}`,
        why: 'The else branch is never checked, so `if false then 1 else true` is typed number and steps to a bool: preservation fails.',
      },
      {
        code: `// the language of chapter 188
const num = (n) => ({ k: 'num', n });
const bool = (b) => ({ k: 'bool', b });
const add = (l, r) =>
  ({ k: 'add', l, r });
const lt = (l, r) =>
  ({ k: 'lt', l, r });
const iff = (c, t, e) =>
  ({ k: 'if', c, t, e });
const isVal = (e) =>
  e.k === 'num' || e.k === 'bool';

// one small step, or null (stuck or
// a value): chapter 188's rules
function step(e) {
  if (isVal(e)) return null;
  if (e.k === 'if') {
    if (e.c.k === 'bool') {
      return e.c.b ? e.t : e.e;
    }
    const c = step(e.c);
    return c && iff(c, e.t, e.e);
  }
  const make = e.k === 'add' ? add : lt;
  if (!isVal(e.l)) {
    const l = step(e.l);
    return l && make(l, e.r);
  }
  if (!isVal(e.r)) {
    const r = step(e.r);
    return r && make(e.l, r);
  }
  const { l, r } = e;
  if (l.k !== 'num' || r.k !== 'num') {
    return null;
  }
  return e.k === 'add'
    ? num(l.n + r.n)
    : bool(l.n < r.n);
}

function typeOf(e) {
  if (e.k === 'num') return 'number';
  if (e.k === 'bool') return 'bool';
  if (e.k === 'add' || e.k === 'lt') {
    const l = typeOf(e.l);
    const r = typeOf(e.r);
    if (!l || !r) return null;
    return e.k === 'add'
      ? 'number' : 'bool';
  }
  // what is left is an if
  if (typeOf(e.c) !== 'bool') {
    return null;
  }
  const t = typeOf(e.t);
  if (t === null) return null;
  return t === typeOf(e.e) ? t : null;
}`,
        why: 'A sum of a bool and a number is given type number, but it is stuck: progress fails.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which pair of lemmas is the standard way to prove soundness for a small-step semantics?',
    options: [
      {
        t: 'Progress and preservation',
        correct: true,
        why: 'A typed term is a value or steps, and a step keeps its type; together, a typed term never gets stuck.',
      },
      {
        t: 'Generalisation and instantiation',
        why: 'Those are steps of Hindley–Milner inference, not a soundness proof.',
      },
      {
        t: 'Covariance and contravariance',
        why: 'Those describe how subtyping carries over to bigger types.',
      },
    ],
  },
  {
    q: 'What does preservation say about `if true then 3 + 4 else 0 → 3 + 4`?',
    options: [
      {
        t: 'That `3 + 4` is a value',
        why: 'It is not; progress says it can step, by Add.',
      },
      {
        t: 'Nothing: preservation only applies to values',
        why: 'Preservation is about every step a typed term takes.',
      },
      {
        t: 'That `3 + 4` has the same type as the if, number',
        correct: true,
        why: 'T-If required the then branch to have the if’s type.',
      },
    ],
  },
  {
    q: 'Why is `if true then 1 else false` rejected, though it never gets stuck?',
    options: [
      {
        t: 'Because the checker evaluates the condition and finds it true',
        why: 'A type checker does not run the program.',
      },
      {
        t: 'Because T-If needs both branches to have the same type, and a sound checker is conservative',
        correct: true,
        why: 'It cannot know which branch runs, so it demands what is safe for both.',
      },
      {
        t: 'It is not rejected',
        why: 'T-If’s premises fail: number and bool differ.',
      },
    ],
  },
  {
    q: 'Which TypeScript program passes `tsc --strict` and then throws a TypeError?',
    options: [
      {
        t: '`const t = 5 as string; t.toUpperCase();`',
        why: 'A direct cast between unrelated types is error TS2352.',
      },
      {
        t: '`const s = 5 as unknown as string; s.toUpperCase();`',
        correct: true,
        why: 'Going through unknown is allowed, and the assertion is never checked at run time.',
      },
      {
        t: '`const f = (x) => x + 1;`',
        why: 'Under strict, x is an implicit any: error TS7006.',
      },
    ],
  },
  {
    q: 'In this chapter’s terms, what goes wrong in TypeScript’s unsound spots?',
    options: [
      {
        t: 'Progress: the program has no next step',
        why: 'JavaScript always has a next step (it throws); the problem is the types.',
      },
      {
        t: 'Nothing: they are compile-time errors',
        why: 'They pass the checker; that is what makes them unsound.',
      },
      {
        t: 'Preservation: a value’s static type no longer matches the value',
        correct: true,
        why: 'A number typed string, or undefined typed number, then reaches an operation its type said was safe.',
      },
    ],
  },
];
