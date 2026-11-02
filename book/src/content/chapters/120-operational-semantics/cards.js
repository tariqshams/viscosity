// Chapter 120 cards (operational semantics, small steps). Keys are
// stable ids.

export const prompts = {
  'os-what': {
    q: 'What is an operational semantics?',
    a: 'A definition of what programs mean, given as rules for how they run: what each expression steps to, or what value it produces.',
  },
  'why-not-interp': {
    q: 'Why not let the interpreter itself be the definition of a language?',
    a: 'Then every accident and bug of its code would be part of the language; rules are short and precise enough to say what it *should* do.',
  },
  'structural': {
    q: 'Why is Plotkin’s style called *structural* operational semantics?',
    a: 'Its rules follow the structure of the syntax: one or a few rules for each kind of expression, defined in terms of its parts.',
  },
  'premise-conclusion': {
    q: 'In a rule written with a line, what goes above the line and what below?',
    a: 'Above: the premises, which must already hold. Below: the conclusion, which the rule then lets you claim. No premises: an axiom.',
  },
  'values-dont-step': {
    q: 'Why does no small-step rule apply to `7` or `true`?',
    a: 'They are values, finished answers; a value has nothing left to compute.',
  },
  'small-step-what': {
    q: 'What does `e → e\'` mean in a small-step semantics?',
    a: 'e steps to e′ in exactly one step of computation, justified by the rules.',
  },
  'derivation-what': {
    q: 'What is a derivation, for a step deep inside a term?',
    a: 'A tree of rules: an axiom at the top (the actual change), with one rule per level of nesting below it, down to the whole term’s step.',
  },
  'stuck-what': {
    q: 'What is a stuck term, and what does it correspond to?',
    a: 'A term that is not a value but has no rule to step by, like `true + 1`: a runtime error, stated precisely.',
  },
  'deterministic': {
    q: 'What does it mean that these small-step rules are deterministic?',
    a: 'At most one rule applies to any term, so each program has exactly one way to run.',
  },
  'left-first': {
    q: 'Which rule makes the left side of `+` go before the right side?',
    a: 'AddR: it only applies when the left side is already a value, so while the left side can step, only AddL applies.',
  },
};

export const examples = {
  'steps-plus': {
    title: 'The rules for + as code, printing every step',
    code: `// e is { k: 'num', n }
//   or { k: 'add', l, r }
const num = (n) => ({ k: 'num', n });
const add = (l, r) =>
  ({ k: 'add', l, r });
const isVal = (e) => e.k === 'num';

// one small step, or null if no
// rule applies
function step(e) {
  if (e.k !== 'add') return null;
  if (isVal(e.l) && isVal(e.r)) {
    return num(e.l.n + e.r.n); // Add
  }
  if (!isVal(e.l)) { // AddL
    const l = step(e.l);
    return l && add(l, e.r);
  }
  const r = step(e.r); // AddR
  return r && add(e.l, r);
}

const show = (e) => e.k === 'num'
  ? String(e.n)
  : \`(\${show(e.l)} + \${show(e.r)})\`;

let e = add(add(num(1), num(2)),
  add(num(3), num(4)));
while (e) {
  console.log(show(e));
  e = step(e);
}`,
  },
};

const GIVEN = `const num = (n) => ({ k: 'num', n });
const bool = (b) => ({ k: 'bool', b });
const add = (l, r) =>
  ({ k: 'add', l, r });
const lt = (l, r) =>
  ({ k: 'lt', l, r });
const iff = (c, t, e) =>
  ({ k: 'if', c, t, e });
const isVal = (e) =>
  e.k === 'num' || e.k === 'bool';
function show(e) {
  if (isVal(e)) {
    return String(e.n ?? e.b);
  }
  if (e.k === 'if') {
    const [c, t, f] =
      [e.c, e.t, e.e].map(show);
    return \`if \${c} then \${t}\` +
      \` else \${f}\`;
  }
  const op = e.k === 'add' ? '+' : '<';
  const [l, r] = [e.l, e.r].map(show);
  return \`(\${l} \${op} \${r})\`;
}`;

const RUN = `function run(e) {
  let next = step(e);
  while (next !== null) {
    e = next;
    next = step(e);
  }
  return e;
}`;

export const exercises = {
  'small-step': {
    title: 'A small-step evaluator',
    prompt:
      'Expressions are data: `num(n)`, `bool(b)`, `add(l, r)`, `lt(l, r)` and `iff(c, t, e)` (for `if c then t else e`); `isVal` and `show` are given. Write `step(e)`, which applies the chapter’s rules (Add, AddL, AddR, the same three for `<`, and IfT, IfF, If) and returns the expression after **one** step, or `null` if no rule applies (a value, or a stuck term). Then write `run(e)`, which steps until no rule applies and returns the expression it stopped at.',
    starter: `${GIVEN}

function step(e) {
  return null;
}

function run(e) {
  return e;
}`,
    solution: `${GIVEN}

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

${RUN}`,
    tests: `const s = (e) => { const x = step(e); return x && show(x); };
test('Add: two numbers', () => {
  expect(s(add(num(1), num(2)))).toBe('3');
});
test('AddL: the left side goes first', () => {
  expect(s(add(add(num(1), num(2)), add(num(3), num(4))))).toBe('(3 + (3 + 4))');
});
test('AddR: then the right side', () => {
  expect(s(add(num(3), add(num(3), num(4))))).toBe('(3 + 7)');
});
test('If steps the condition and nothing else', () => {
  expect(s(iff(lt(num(1), num(2)), add(num(3), num(4)), num(0)))).toBe('if true then (3 + 4) else 0');
});
test('IfT and IfF leave the branch unevaluated', () => {
  expect(s(iff(bool(true), add(num(1), num(2)), num(9)))).toBe('(1 + 2)');
  expect(s(iff(bool(false), num(9), add(num(1), num(2))))).toBe('(1 + 2)');
});
test('values do not step', () => {
  expect(step(num(5))).toBe(null);
  expect(step(bool(false))).toBe(null);
});
test('run to a value', () => {
  expect(show(run(iff(lt(num(1), num(2)), add(num(3), num(4)), num(0))))).toBe('7');
  expect(show(run(lt(add(num(1), num(1)), num(3))))).toBe('true');
});
test('stuck terms stop where they are', () => {
  expect(step(add(bool(true), num(1)))).toBe(null);
  expect(show(run(iff(num(1), num(2), num(3))))).toBe('if 1 then 2 else 3');
  expect(show(run(add(num(1), lt(bool(true), num(2)))))).toBe('(1 + (true < 2))');
});`,
    hints: [
      'Start with the cases where nothing happens: a value has no step. Then handle `if`, and finally `+` and `<` together, since they have the same shape.',
      'For `if`: if the condition is a boolean value, return the then or the else branch (IfT, IfF); otherwise step the condition and rebuild the `if` around it (If), passing `null` on if the condition could not step. For `+` and `<`: if the left side is not a value, step it (AddL); else if the right side is not a value, step it (AddR).',
      'When both sides are values, check that both are numbers; if not, return `null` (stuck). Otherwise return `num(l.n + r.n)` or `bool(l.n < r.n)`. `run` loops: `next = step(e)` until it is `null`, then returns the last `e`.',
    ],
    walkthrough: `**How to think about it.** Each rule becomes a few lines of code, and the premises become recursive calls. A rule like AddL, “if e₁ → e₁′ then e₁ + e₂ → e₁′ + e₂”, reads as code: try to step the left side; if that worked, rebuild the sum with the new left side. The order of the checks is where the rules’ conditions live: AddR only applies when the left side is a value, so we only reach the right side after finding the left side finished. And “no rule applies” is a real answer, \`null\`, which a caller passes on.

**The solution, line by line.**

- \`if (isVal(e)) return null;\` Values never step.
- \`if (e.k === 'if') {\` handles the three if rules.
- \`if (e.c.k === 'bool') { return e.c.b ? e.t : e.e; }\` is IfT and IfF: a boolean condition picks a branch, returned as it is, unevaluated.
- \`const c = step(e.c); return c && iff(c, e.t, e.e);\` is If: step the condition, rebuild the \`if\` with the branches untouched. If the condition is a number (a value, so \`step\` gives \`null\`), the whole \`if\` is stuck and \`null\` is passed on.
- \`const make = e.k === 'add' ? add : lt;\` lets the two binary operators share their code, since their rules have the same shape.
- \`if (!isVal(e.l)) { const l = step(e.l); return l && make(l, e.r); }\` is AddL (or its \`<\` twin).
- \`if (!isVal(e.r)) { const r = step(e.r); return r && make(e.l, r); }\` is AddR: we only get here when the left side is a value.
- \`if (l.k !== 'num' || r.k !== 'num') { return null; }\` Both sides are values, but Add (and Lt) need two numbers: anything else is stuck.
- \`return e.k === 'add' ? num(l.n + r.n) : bool(l.n < r.n);\` is the axiom.
- \`run\` keeps the last expression \`e\` and the next one; when \`step\` says \`null\`, \`e\` is the value (or the stuck term) and is returned.

**Common wrong attempts.**

- Leaving out the number check: JavaScript happily computes \`true + 1\` as \`2\`, so \`step\` would invent a step that no rule allows, and a stuck term would run.
- Stepping the right side before the left (or both in one call): the result may even be the same number in the end, but the steps are not the ones the rules give, and once side effects exist (the next chapter) the order changes what a program prints.
- Stepping the branches of an \`if\` before choosing: wasted work, and wrong as soon as a branch would be stuck or loop.`,
    wrong: [
      {
        code: `${GIVEN}

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
  const a = l.n ?? l.b;
  const b = r.n ?? r.b;
  return e.k === 'add'
    ? num(a + b)
    : bool(a < b);
}

${RUN}`,
        why: 'No check that both sides are numbers, so `true + 1` steps to `2` (JavaScript’s answer) instead of being stuck.',
      },
      {
        code: `${GIVEN}

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
  if (!isVal(e.r)) {
    const r = step(e.r);
    return r && make(e.l, r);
  }
  if (!isVal(e.l)) {
    const l = step(e.l);
    return l && make(l, e.r);
  }
  const { l, r } = e;
  if (l.k !== 'num' || r.k !== 'num') {
    return null;
  }
  return e.k === 'add'
    ? num(l.n + r.n)
    : bool(l.n < r.n);
}

${RUN}`,
        why: 'This steps the right side first, so `(1 + 2) + (3 + 4)` steps to `(1 + 2) + 7`: not the step the rules allow.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does `(2 + 3) + (4 + 5)` step to, in one small step?',
    options: [
      { t: '`5 + 9`', why: 'That is two steps at once; a small step changes one thing.' },
      { t: '`5 + (4 + 5)`', correct: true, why: 'AddL steps the left side first, using Add on `2 + 3`.' },
      { t: '`(2 + 3) + 9`', why: 'AddR only applies once the left side is a value.' },
    ],
  },
  {
    q: 'Which of these is stuck?',
    options: [
      { t: '`if true then 1 else false`', why: 'IfT applies: it steps to `1`. The else branch is never looked at.' },
      { t: '`3 < 4`', why: 'Lt applies: it steps to `true`.' },
      { t: '`if 3 then 1 else 2`', correct: true, why: 'The condition is a value but not a boolean: IfT and IfF need true or false, and If needs a condition that can step.' },
    ],
  },
  {
    q: 'How many rules are used in the derivation of `(1 + 2) + 3 → 3 + 3`?',
    options: [
      { t: 'Two: Add at the top, AddL below it', correct: true, why: 'Add justifies `1 + 2 → 3`; AddL lifts that step into the outer sum.' },
      { t: 'One: Add', why: 'Add only applies to two numbers; `(1 + 2) + 3` has a sum on the left, so AddL is needed.' },
      { t: 'Three', why: 'There is one level of nesting, so one AddL below the axiom: two rules in all.' },
    ],
  },
  {
    q: 'What does a rule with nothing above its line say?',
    options: [
      { t: 'That the rule is not finished yet', why: 'No premises is deliberate: the conclusion holds with no conditions.' },
      { t: 'Its conclusion always holds: it is an axiom', correct: true, why: 'Like Add or IfT: nothing needs to be shown first.' },
      { t: 'That the term is stuck', why: 'Stuck means no rule applies, not that a rule has no premises.' },
    ],
  },
  {
    q: 'Why does `if 1 < 2 then 5 else true` run to `5` without any problem with the `true` branch?',
    options: [
      { t: 'Because `true` is converted to a number first', why: 'Nothing is converted; the rules never look at the branch.' },
      { t: 'Because IfT throws away the else branch without evaluating it', correct: true, why: 'Once the condition is `true`, the if steps straight to the then branch.' },
      { t: 'It does not: it is stuck', why: 'The condition steps to `true`, then IfT applies, then the answer is 5.' },
    ],
  },
];
