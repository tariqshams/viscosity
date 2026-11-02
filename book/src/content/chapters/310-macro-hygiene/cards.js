// Chapter 309b cards. Keys are stable ids: never rename them.

export const prompts = {
  'hy-capture': {
    q: 'Why does `SWAP(tmp, y)` swap nothing, with `#define SWAP(a, b) { int tmp = a; a = b; b = tmp; }`?',
    a: 'Inside the braces the macro’s `int tmp` hides the caller’s `tmp`, so every `tmp` (the argument too) means the macro’s variable.',
  },
  'hy-two-ways': {
    q: 'Name the two directions of variable capture.',
    a: 'A variable the macro declares catches a name the caller passed in; or a variable the caller declared catches a name the macro uses.',
  },
  'hy-gensym': {
    q: 'What does a `gensym` give a macro writer, and which kind of capture does it not fix?',
    a: 'A brand-new name for the macro’s own variables. It does not help with names the macro uses but does not declare, such as a helper function the caller has shadowed.',
  },
  'hy-what': {
    q: 'What does it mean for a macro system to be hygienic?',
    a: 'Expansion never causes capture: a template’s bindings only bind the template’s own names, and its other names mean what they meant where the macro was defined.',
  },
  'hy-marks': {
    q: 'How does a hygienic expander tell the macro’s `tmp` from the caller’s `tmp`?',
    a: 'Every identifier carries a mark of where it came from (rustc’s #7 and #0); names refer to each other only if both the spelling and the mark match.',
  },
  'hy-rust': {
    q: 'Rust’s `macro_rules!` has "mixed-site" hygiene. What is looked up where?',
    a: 'Local variables and labels at the macro’s definition site; other names, such as functions and types, at the place the macro is called.',
  },
  'hy-print': {
    q: 'rustc’s expanded output for the Rust swap reads `let tmp = tmp; tmp = y; y = tmp;`, yet the program works. Why?',
    a: 'The printout drops the marks: the first `tmp` and the last one are the macro’s (#7), the others the caller’s (#0), so they are different variables.',
  },
  'hy-c': {
    q: 'Is C’s preprocessor hygienic?',
    a: 'No: it pastes tokens with no record of where names came from, so capture happens silently.',
  },
};

export const examples = {
  capture: {
    title: 'Capture, caught in the act',
    code: `const h = (n) => ['$', n];
const SWAP = ['do',
  ['let', 'tmp', h('a')],
  ['set', h('a'), h('b')],
  ['set', h('b'), 'tmp']];
function fill(t, env) {
  if (!Array.isArray(t)) return t;
  if (t[0] === '$') return env[t[1]];
  return t.map((x) => fill(x, env));
}
function run(prog, vars) {
  const ev = (e) => {
    if (typeof e === 'number') return e;
    if (typeof e === 'string') {
      return vars[e];
    }
    const [k, a, b] = e;
    if (k === 'do') {
      e.slice(1).forEach(ev);
    } else {
      vars[a] = ev(b);
    }
  };
  ev(prog);
}
const call = (a, b) =>
  fill(SWAP, { a, b });
const v1 = { x: 1, y: 2 };
run(call('x', 'y'), v1);
console.log(v1);
const v2 = { tmp: 1, y: 2 };
run(call('tmp', 'y'), v2);
console.log(v2);`,
  },
};

const STARTER_FILL = `// fill from the last chapter
function fill(tpl, env) {
  if (!Array.isArray(tpl)) return tpl;
  if (tpl[0] === '$') {
    return env[tpl[1]];
  }
  return tpl.map((x) => fill(x, env));
}`;

export const exercises = {
  hygienic: {
    title: 'A hygienic template filler',
    prompt:
      'Templates are trees of arrays as in the last chapter, with holes `[\'$\', name]`. A template declares a variable with `[\'let\', name, expr]`. Write `hygienic(tpl, env, n)`: rename every variable the template itself declares (wherever it appears in the template, but not inside holes) from `name` to `name_n`, for example `tmp` to `tmp_1` when `n` is 1, and then fill the holes with `fill` (given). Names the template only uses, and everything that comes in through `env`, must not be renamed. The tests run the result in a tiny interpreter, so a swap of the caller’s `tmp` really has to swap.',
    starter: `${STARTER_FILL}
function hygienic(tpl, env, n) {
  return fill(tpl, env);
}`,
    solution: `${STARTER_FILL}
function binders(t, out = new Set()) {
  const leaf = !Array.isArray(t);
  if (leaf || t[0] === '$') return out;
  if (t[0] === 'let') out.add(t[1]);
  for (const x of t) binders(x, out);
  return out;
}
function rename(t, names, n) {
  if (typeof t === 'string') {
    if (!names.has(t)) return t;
    return t + '_' + n;
  }
  const leaf = !Array.isArray(t);
  if (leaf || t[0] === '$') return t;
  return t.map((x) =>
    rename(x, names, n));
}
function hygienic(tpl, env, n) {
  const names = binders(tpl);
  const clean = rename(tpl, names, n);
  return fill(clean, env);
}`,
    tests: `const h = (x) => ['$', x];
const SWAP = ['do',
  ['let', 'tmp', h('a')],
  ['set', h('a'), h('b')],
  ['set', h('b'), 'tmp']];
function run(prog, vars) {
  const ev = (e) => {
    if (typeof e === 'number') return e;
    if (typeof e === 'string') return vars[e];
    const [k, a, b] = e;
    if (k === 'do') e.slice(1).forEach(ev);
    else vars[a] = ev(b);
  };
  ev(prog);
  return vars;
}
test('an ordinary swap still works', () => {
  const v = run(hygienic(SWAP,
    { a: 'x', b: 'y' }, 1), { x: 1, y: 2 });
  expect([v.x, v.y]).toEqual([2, 1]);
});
test('swapping the caller\\'s tmp works', () => {
  const v = run(hygienic(SWAP,
    { a: 'tmp', b: 'y' }, 1), { tmp: 1, y: 2 });
  expect([v.tmp, v.y]).toEqual([2, 1]);
});
test('only the template\\'s own tmp is renamed', () => {
  expect(hygienic(SWAP, { a: 'tmp', b: 'y' }, 1))
    .toEqual(['do', ['let', 'tmp_1', 'tmp'],
      ['set', 'tmp', 'y'], ['set', 'y', 'tmp_1']]);
});
test('each expansion gets its own name', () => {
  const out = hygienic(SWAP, { a: 'p', b: 'q' }, 7);
  expect(out[1][1]).toBe('tmp_7');
});
test('used, undeclared names are kept', () => {
  const tpl = ['do', ['let', 't', h('a')],
    ['set', 'total', 't']];
  expect(hygienic(tpl, { a: 5 }, 2)).toEqual(
    ['do', ['let', 't_2', 5],
      ['set', 'total', 't_2']]);
});
test('declarations deep inside count', () => {
  const tpl = ['do', ['do', ['let', 'i', 0]],
    ['set', 'i', 'i']];
  expect(hygienic(tpl, {}, 3)).toEqual(
    ['do', ['do', ['let', 'i_3', 0]],
      ['set', 'i_3', 'i_3']]);
});`,
    hints: [
      'Do it in two passes over the template, before filling: first find the names it declares, then rename them. Filling comes last, so nothing from `env` can be renamed.',
      'The first pass collects `t[1]` for every node `[\'let\', name, ...]` into a `Set`, walking into every array except holes. The second pass copies the tree, replacing each string in the set with `name + \'_\' + n`, and again leaves holes alone.',
      'In the renaming pass: a string in the set becomes `t + \'_\' + n`; any other non-array, and any hole, is returned as it is; any other array is `t.map((x) => rename(x, names, n))`. Then `hygienic` is `fill(rename(tpl, binders(tpl), n), env)`.',
    ],
    walkthrough: `**How to think about it.** Capture happens because the template's \`tmp\` and the caller's \`tmp\` end up as the same string in the same scope. The cure is to make the template's own variables impossible to confuse with anything the caller could write, by renaming them, differently for each expansion, *before* the caller's code is pasted in. Order matters: if we filled first and renamed afterwards, we could no longer tell which \`tmp\` came from the template and which from the argument. So: find the template's declared names, rename them in the template, then fill.

**The solution, line by line.**

- \`function binders(t, out = new Set()) {\` collects the names a template declares, into one shared set.
- \`const leaf = !Array.isArray(t); if (leaf || t[0] === '$') return out;\` (two lines): leaves and holes declare nothing; in particular we never look inside a hole, whose contents come from the caller.
- \`if (t[0] === 'let') out.add(t[1]);\` a declaration: its second element is the name.
- \`for (const x of t) binders(x, out);\` looks for declarations deeper down (the last test hides one inside a nested \`do\`).
- \`function rename(t, names, n) {\` copies the template with declared names changed.
- \`if (typeof t === 'string') { ... }\` (four lines): a string that is not a declared name is returned as it is, and a declared one becomes \`t + '_' + n\`. This renames every occurrence of a declared name, both where it is declared and where it is used (\`['set', ['$', 'b'], 'tmp']\` becomes \`['set', ['$', 'b'], 'tmp_1']\`), and keeps every other string: \`'do'\`, \`'set'\` and \`'total'\`, a name the template uses but does not declare.
- \`const leaf = !Array.isArray(t); if (leaf || t[0] === '$') return t;\` (two lines): numbers stay, and holes stay exactly as they are, ready to be filled.
- \`return t.map((x) => rename(x, names, n));\` (two lines): any other node is copied with its parts renamed; \`map\` builds a new array, so the template is untouched for the next expansion.
- \`function hygienic(tpl, env, n) {\` finds the declared names with \`binders\`, makes the renamed copy \`clean\`, and only then calls \`fill(clean, env)\`: it renames, then fills. Because filling happens last, the caller's \`'tmp'\`, arriving through \`env.a\`, is never renamed.

For \`swap(tmp, y)\` the result is \`let tmp_1 = tmp; tmp = y; y = tmp_1;\`, the same program the diagram stepped through, and the interpreter in the tests sees the caller's \`tmp\` and \`y\` swapped. A real hygienic expander does the same thing with marks instead of new spellings, and picks names that cannot clash even with a caller who writes \`tmp_1\` (rustc's marks cannot be typed at all).

**Common wrong attempts.**

- Filling first and then renaming every \`tmp\` also renames the caller's \`tmp\`, so the swap still fails.
- Renaming only the \`let\` itself, not the later uses, leaves \`['set', 'y', 'tmp']\` reading the caller's variable.`,
    wrong: [
      {
        code: `${STARTER_FILL}
function hygienic(tpl, env, n) {
  const out = fill(tpl, env);
  const ren = (t) => t === 'tmp'
    ? 'tmp_' + n
    : Array.isArray(t) ? t.map(ren) : t;
  return ren(out);
}`,
        why: 'It renames after filling, so the caller’s `tmp` is renamed too and capture happens again.',
      },
      {
        code: `${STARTER_FILL}
function hygienic(tpl, env, n) {
  const ren = (t) => {
    if (!Array.isArray(t)) return t;
    if (t[0] === 'let') {
      return ['let', t[1] + '_' + n,
        ren(t[2])];
    }
    return t.map(ren);
  };
  return fill(ren(tpl), env);
}`,
        why: 'Only the declaration is renamed; the later use of `tmp` still names the old variable, so `y` receives the wrong value.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A macro’s template calls a helper `log(...)`. It is used inside a function where the caller has a local variable called `log`. What can go wrong, and which kind of capture is it?',
    options: [
      { t: 'Nothing: macros cannot see local variables', why: 'Pasted code is compiled in the caller’s scope, where it can see them.' },
      { t: 'The template’s variable catches the caller’s argument', why: 'That is the other direction (swap and `tmp`).' },
      { t: 'The template’s `log` now names the caller’s variable: the caller’s binding captures a name the macro uses', correct: true, why: 'A hygienic expander looks the template’s free names up where the macro was defined to prevent this.' },
    ],
  },
  {
    q: 'Why does renaming the macro’s `tmp` to a fresh name fix `SWAP(tmp, y)`?',
    options: [
      { t: 'Fresh names are faster to look up', why: 'Speed has nothing to do with it.' },
      { t: 'The caller’s `tmp` and the macro’s variable no longer have the same name, so neither hides the other', correct: true, why: 'Then `tmp = y` changes the caller’s variable, as intended.' },
      { t: 'It makes `tmp` a global variable', why: 'It stays local to the macro’s block; only its name changes.' },
    ],
  },
  {
    q: 'rustc’s hygiene view shows `let tmp /* 2354#7 */ = tmp /* 2354#0 */;`. What do `#7` and `#0` record?',
    options: [
      { t: 'The line numbers of the two names', why: 'Both are on the same line; the marks are syntax contexts.' },
      { t: 'How many times each variable is used', why: 'They record origin, not use counts.' },
      { t: 'Where each identifier came from: this expansion of the macro (#7) or the caller’s own code (#0)', correct: true, why: 'Two identifiers refer to the same variable only if spelling and mark both match.' },
      { t: 'The types of the two variables', why: 'Types come later; both are integers here anyway.' },
    ],
  },
  {
    q: 'In Rust, a macro expands to `let x = 1;` and the caller then writes `println!("{}", x)`. What happens?',
    options: [
      { t: 'It prints 1', why: 'The caller’s `x` and the macro’s `x` have different origins.' },
      { t: 'error E0425: cannot find value `x`, not accessible due to macro hygiene', correct: true, why: 'Local variables declared in an expansion are not shared with the caller.' },
      { t: 'It prints whatever `x` was before', why: 'There is no other `x`; the compiler reports an error.' },
    ],
  },
  {
    q: 'Which statement about C’s preprocessor is true?',
    options: [
      { t: 'It renames macro variables automatically', why: 'It does not; gcc -E showed `int tmp = tmp`.' },
      { t: 'It reports an error when capture happens', why: 'The swap compiled and ran silently, printing `1 2`.' },
      { t: 'It is hygienic for functions but not for variables', why: 'It has no idea of either; it pastes tokens.' },
      { t: 'It is not hygienic: programmers avoid capture with unusual names, by hand', correct: true, why: 'That is the gensym idea done manually.' },
    ],
  },
];
