// Chapter 91 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'bigstep-what': {
    q: 'What does a big-step semantics define?',
    a: 'A relation `e ⇓ v`, “e evaluates to v”, relating an expression directly to its final value, with the parts’ evaluations as premises.',
  },
  'bigstep-read': {
    q: 'How is `e₁ + e₂ ⇓ 7` justified by the rule Add?',
    a: 'By derivations of `e₁ ⇓ n₁` and `e₂ ⇓ n₂` for two numbers whose sum is 7, placed above the line.',
  },
  'bigstep-agree': {
    q: 'For the chapter’s little language, how do `e ⇓ v` and the small steps relate?',
    a: 'They agree: `e ⇓ v` holds exactly when `e →* v`.',
  },
  'env-rho': {
    q: 'What does `ρ ⊢ e ⇓ v` mean?',
    a: 'In the environment ρ (a table from names to values), the expression e evaluates to the value v.',
  },
  'orl-no-e2': {
    q: 'How do the big-step rules for `||` express short-circuiting?',
    a: 'The rule for a truthy left side (OrL) has no premise about `e₂`, so `e₂` is never evaluated.',
  },
  'let-env': {
    q: 'What does the rule for `let x = e;` produce, instead of a value?',
    a: 'A new environment: the old one with x mapped to e’s value, `ρ[x ↦ v]`.',
  },
  'premise-call': {
    q: 'In the tree-walking interpreter, what does each premise of a big-step rule become?',
    a: 'A recursive call to `evaluate` on a part of the expression.',
  },
  'loop-vs-stuck': {
    q: 'Why can big-step rules not tell a program that loops for ever from one that gets stuck?',
    a: 'Neither has a derivation of `e ⇓ v`; the rules only talk about finished evaluations, not the steps in between.',
  },
  'order-matters': {
    q: 'The rule Add does not say which premise to prove first. When does that start to matter?',
    a: 'When evaluating a part can have a side effect, such as printing or failing; then the semantics must fix the order (Drip: left first).',
  },
};

export const examples = {
  'drip-or': {
    title: 'The rules for || and && in Drip',
    lang: 'drip',
    code: `let x = none;
print x || "default";
print 0 || "default";
print false && missing;
print 1 && "yes";`,
  },
};

export const exercises = {
  'big-step': {
    title: 'A big-step evaluator for a piece of Drip',
    prompt: 'Expressions are data: `lit(v)` (a number, string, boolean, or `null` for Drip’s `none`), `vr(name)`, `not(e)`, and `op(k, l, r)` with `k` one of `\'add\'`, `\'and\'`, `\'or\'`. Write `evalB(e, env)`, where `env` is a `Map` from names to values, following the big-step rules: a literal is its value; a variable is its entry in `env`, or an `Error` with the message `undefined variable \'x\'` (with the name); `not` gives the opposite of the operand’s truthiness; `add` adds two numbers or joins two strings, evaluating the left side first, and otherwise throws `cannot add ` followed by `describe` of both values, joined by ` and `; `or` and `and` follow Drip: they return one of their operands, and evaluate the right side only when they need it.',
    starter: `const lit = (v) => ({ k: 'lit', v });
const vr = (name) =>
  ({ k: 'var', name });
const op = (k, l, r) => ({ k, l, r });
const not = (e) => ({ k: 'not', e });
const isTruthy = (v) =>
  v !== null && v !== false;
function describe(v) {
  if (v === null) return 'none';
  if (typeof v === 'boolean') {
    return 'a boolean';
  }
  return 'a ' + typeof v;
}

function evalB(e, env) {
  return null;
}`,
    solution: `const lit = (v) => ({ k: 'lit', v });
const vr = (name) =>
  ({ k: 'var', name });
const op = (k, l, r) => ({ k, l, r });
const not = (e) => ({ k: 'not', e });
const isTruthy = (v) =>
  v !== null && v !== false;
function describe(v) {
  if (v === null) return 'none';
  if (typeof v === 'boolean') {
    return 'a boolean';
  }
  return 'a ' + typeof v;
}

function evalB(e, env) {
  switch (e.k) {
    case 'lit':
      return e.v;
    case 'var': {
      if (!env.has(e.name)) {
        const n = e.name;
        throw new Error(
          \`undefined variable '\${n}'\`);
      }
      return env.get(e.name);
    }
    case 'not':
      return !isTruthy(evalB(e.e, env));
    case 'add': {
      const l = evalB(e.l, env);
      const r = evalB(e.r, env);
      const t = typeof l;
      const ok = t === 'number' ||
        t === 'string';
      if (ok && t === typeof r) {
        return l + r;
      }
      const a = describe(l);
      const b = describe(r);
      throw new Error(
        \`cannot add \${a} and \${b}\`);
    }
    case 'or': {
      const l = evalB(e.l, env);
      if (isTruthy(l)) return l;
      return evalB(e.r, env);
    }
    case 'and': {
      const l = evalB(e.l, env);
      if (!isTruthy(l)) return l;
      return evalB(e.r, env);
    }
  }
}`,
    tests: `const env = new Map([['x', 2], ['s', 'hi'], ['n', null]]);
const msg = (f) => { try { f(); return 'no error'; } catch (e) { return e.message; } };
test('literals and variables', () => {
  expect(evalB(lit(3), env)).toBe(3);
  expect(evalB(lit(null), env)).toBe(null);
  expect(evalB(vr('s'), env)).toBe('hi');
});
test('an undefined variable is an error', () => {
  expect(msg(() => evalB(vr('y'), env))).toBe("undefined variable 'y'");
});
test('add: numbers and strings', () => {
  expect(evalB(op('add', vr('x'), lit(3)), env)).toBe(5);
  expect(evalB(op('add', vr('s'), lit('!')), env)).toBe('hi!');
});
test('add: anything else is an error', () => {
  expect(msg(() => evalB(op('add', lit(1), lit('a')), env))).toBe('cannot add a number and a string');
  expect(msg(() => evalB(op('add', vr('n'), lit(true)), env))).toBe('cannot add none and a boolean');
});
test('add evaluates the left side first', () => {
  expect(msg(() => evalB(op('add', vr('p'), vr('q')), env))).toBe("undefined variable 'p'");
});
test('not uses Drip truthiness', () => {
  expect(evalB(not(lit(0)), env)).toBe(false);
  expect(evalB(not(vr('n')), env)).toBe(true);
});
test('or and and return an operand', () => {
  expect(evalB(op('or', vr('n'), lit(3)), env)).toBe(3);
  expect(evalB(op('or', lit(0), lit(3)), env)).toBe(0);
  expect(evalB(op('and', lit(1), lit('yes')), env)).toBe('yes');
  expect(evalB(op('and', lit(false), lit('yes')), env)).toBe(false);
});
test('the right side is skipped when not needed', () => {
  expect(evalB(op('and', lit(false), vr('missing')), env)).toBe(false);
  expect(evalB(op('or', lit('a'), vr('missing')), env)).toBe('a');
});`,
    hints: [
      'One `case` per kind of expression, as in the interpreter; each premise of a rule is a recursive call `evalB(part, env)`.',
      'For `var`, check `env.has(e.name)` and throw if it is missing (there is no Var rule then). For `add`, evaluate the left side, then the right, then check that both are numbers or both are strings.',
      'For `or`: evaluate the left side; if it is truthy, return it (OrL), and only otherwise return `evalB(e.r, env)` (OrR). `and` is the mirror image: a falsey left side is returned as it is.',
    ],
    walkthrough: `**How to think about it.** Write the rules down first, and then turn each one into code: the conclusion’s shape tells you which \`case\` it belongs to, every premise of the form “part ⇓ value” becomes a recursive call, and every side condition (“v₁ truthy”, “both numbers”) becomes an \`if\`. Where no rule applies (a missing name, adding a number to a string), the program has no meaning, and an interpreter reports that as a runtime error. The order of the recursive calls is the one thing the rules leave open; Drip says left first, so the code calls \`e.l\` first.

**The solution, line by line.**

- \`switch (e.k) {\` picks the rule by the kind of expression, like \`evaluate\` in the companion code.
- \`case 'lit': return e.v;\` is Num and Bool (and none): a literal is its own value, no premises.
- \`case 'var':\` is Var. \`if (!env.has(e.name))\` is the missing-rule case: the name and the message are built and thrown, matching Drip’s \`undefined variable 'x'\`. Otherwise \`return env.get(e.name);\` is \`ρ(x) = v\`. (Checking \`has\` rather than the value matters: a variable holding \`null\`, Drip’s none, exists.)
- \`case 'not': return !isTruthy(evalB(e.e, env));\` evaluates the operand (the premise) and negates its truthiness.
- \`case 'add':\` evaluates \`e.l\`, then \`e.r\` (the two premises, left first), then checks the side condition: \`ok\` says the left value is a number or a string, and \`t === typeof r\` that the right has the same type. If so, \`l + r\` adds or joins. If not, there is no rule, and the error message is built with \`describe\`.
- \`case 'or':\` evaluates the left side; \`if (isTruthy(l)) return l;\` is OrL, which has no premise about \`e.r\`, so the right side is not touched; \`return evalB(e.r, env);\` is OrR.
- \`case 'and':\` is the mirror image: a falsey left side is the answer, otherwise the right side’s value is.

**Common wrong attempts.**

- Evaluating both sides of \`or\` and \`and\` first and then choosing: the answer is the same when both sides work, but \`false && missing\` then throws, because the rule that should have been used never asked for \`missing\`.
- Returning \`true\` or \`false\` from \`or\` and \`and\` (as \`isTruthy(l) || isTruthy(r)\`): Drip returns one of the operands, so \`none || 3\` is \`3\`, not \`true\`.
- Using JavaScript’s \`+\` on anything: \`1 + 'a'\` is \`'1a'\` in JavaScript, but Drip has no rule for it.`,
    wrong: [
      {
        code: `const lit = (v) => ({ k: 'lit', v });
const vr = (name) =>
  ({ k: 'var', name });
const op = (k, l, r) => ({ k, l, r });
const not = (e) => ({ k: 'not', e });
const isTruthy = (v) =>
  v !== null && v !== false;
function describe(v) {
  if (v === null) return 'none';
  if (typeof v === 'boolean') {
    return 'a boolean';
  }
  return 'a ' + typeof v;
}

function evalB(e, env) {
  switch (e.k) {
    case 'lit':
      return e.v;
    case 'var': {
      if (!env.has(e.name)) {
        const n = e.name;
        throw new Error(
          \`undefined variable '\${n}'\`);
      }
      return env.get(e.name);
    }
    case 'not':
      return !isTruthy(evalB(e.e, env));
    case 'add': {
      const l = evalB(e.l, env);
      const r = evalB(e.r, env);
      const t = typeof l;
      const ok = t === 'number' ||
        t === 'string';
      if (ok && t === typeof r) {
        return l + r;
      }
      const a = describe(l);
      const b = describe(r);
      throw new Error(
        \`cannot add \${a} and \${b}\`);
    }
    case 'or': {
      const l = evalB(e.l, env);
      const r = evalB(e.r, env);
      return isTruthy(l) ? l : r;
    }
    case 'and': {
      const l = evalB(e.l, env);
      const r = evalB(e.r, env);
      return isTruthy(l) ? r : l;
    }
  }
}`,
        why: 'Both sides are always evaluated, so `false && missing` throws `undefined variable` instead of giving `false`: no short-circuit.',
      },
      {
        code: `const lit = (v) => ({ k: 'lit', v });
const vr = (name) =>
  ({ k: 'var', name });
const op = (k, l, r) => ({ k, l, r });
const not = (e) => ({ k: 'not', e });
const isTruthy = (v) =>
  v !== null && v !== false;
function describe(v) {
  if (v === null) return 'none';
  if (typeof v === 'boolean') {
    return 'a boolean';
  }
  return 'a ' + typeof v;
}

function evalB(e, env) {
  switch (e.k) {
    case 'lit':
      return e.v;
    case 'var':
      return env.get(e.name);
    case 'not':
      return !isTruthy(evalB(e.e, env));
    case 'add':
      return evalB(e.l, env) +
        evalB(e.r, env);
    case 'or':
      return isTruthy(evalB(e.l, env))
        || isTruthy(evalB(e.r, env));
    case 'and':
      return isTruthy(evalB(e.l, env))
        && isTruthy(evalB(e.r, env));
  }
}`,
        why: 'This is JavaScript’s meaning, not Drip’s: a missing name gives `undefined`, `1 + "a"` gives `"1a"`, and `none || 3` gives `true` instead of `3`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which judgment has a derivation, in the big-step rules for the tiny language?',
    options: [
      {
        t: '`if false then 1 else 2 + 3 ⇓ 5`',
        correct: true,
        why: 'By IfF: the condition evaluates to false, and the else branch, 2 + 3, evaluates to 5.',
      },
      {
        t: '`1 + true ⇓ 2`',
        why: 'Add needs both premises to give numbers; `true` evaluates to `true`, so no rule applies.',
      },
      {
        t: '`if 1 then 2 else 3 ⇓ 2`',
        why: 'IfT needs the condition to evaluate to true, and 1 is a number.',
      },
    ],
  },
  {
    q: 'In Drip, what does `print 0 || "x";` print?',
    options: [
      {
        t: '`x`',
        why: 'In Drip only none and false are falsey; 0 is truthy, so OrL applies.',
      },
      {
        t: '`0`',
        correct: true,
        why: '0 is truthy in Drip, so the value of the left side is the answer.',
      },
      {
        t: '`true`',
        why: '`||` returns one of its operands, not a boolean.',
      },
    ],
  },
  {
    q: 'In the tree-walking interpreter, what corresponds to a premise of a big-step rule?',
    options: [
      {
        t: 'A `case` of the switch',
        why: 'A case corresponds to a rule (or a pair of rules); the premises are inside it.',
      },
      {
        t: 'A runtime error',
        why: 'A runtime error is what happens when no rule applies.',
      },
      {
        t: 'A recursive call to evaluate',
        correct: true,
        why: 'Each premise “part ⇓ value” is computed by evaluating that part.',
      },
    ],
  },
  {
    q: 'What do the big-step rules say about `while true { }`?',
    options: [
      {
        t: 'Nothing: it has no derivation, exactly like a stuck program',
        correct: true,
        why: 'Big steps only describe finished evaluations, so a loop and a stuck term look the same.',
      },
      {
        t: 'That it evaluates to none',
        why: 'There is no finished evaluation to give a value.',
      },
      {
        t: 'That it is a syntax error',
        why: 'It parses fine; the question is what it means when run.',
      },
    ],
  },
  {
    q: 'Why does a big-step rule for `+` say nothing about which side is evaluated first, while Drip has to?',
    options: [
      {
        t: 'Because Drip’s numbers are floats',
        why: 'Number representation has nothing to do with order.',
      },
      {
        t: 'Because in the tiny language evaluation has no side effects, so the order cannot be seen; in Drip, a side can print or fail',
        correct: true,
        why: 'Once evaluating can do something visible, a full semantics has to fix the order.',
      },
      {
        t: 'Because big-step rules always evaluate right to left',
        why: 'The rules leave the order open; the interpreter chooses.',
      },
    ],
  },
];
