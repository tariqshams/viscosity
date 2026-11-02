// Chapter 286 cards. Keys are stable ids: never rename them.

export const prompts = {
  'sc-what': {
    q: 'What is separate compilation?',
    a: 'Compiling each source file into an object file on its own, against only the declarations of the other files, and joining the object files later with a linker.',
  },
  'sc-decl': {
    q: 'What does `main.c` need to know about `sq` to be compiled, if `sq` lives in another file?',
    a: 'Only its declaration, `int sq(int x);`: enough to check the call and to pass the argument the right way. The body can be anywhere.',
  },
  'sc-u': {
    q: 'In `nm main.o`, what does the line `U sq` mean?',
    a: '`sq` is used in this object file but not defined here (U for undefined); the linker must find it in another one.',
  },
  'sc-rebuild': {
    q: 'You edit only the body of `sq` in `sq.c`. Which files must be compiled again?',
    a: 'Only `sq.c`. `main.o` is reused, because the declaration it was compiled against did not change; then the program is linked again.',
  },
  'sc-lie': {
    q: 'In C, what happens if `main.c` declares `double sq(double)` but `sq.c` defines `int sq(int)`?',
    a: 'Nothing catches it: both compile, the link succeeds because only the name `sq` is recorded, and the program computes garbage.',
  },
  'mg-why': {
    q: 'Why can a C++ compiler not use a function\'s plain name as its symbol?',
    a: 'Overloads (two `add`s) and namespaces would give several functions the same name, and the symbol table is a flat list of strings the linker compares exactly.',
  },
  'mg-read': {
    q: 'Read the Itanium mangled name `_Z3addii`.',
    a: 'A C++ name (`_Z`), the 3-letter name `add`, and two parameters of type `int` (`i`, `i`): `add(int, int)`.',
  },
  'mg-externc': {
    q: 'What does `extern "C"` do to a C++ function\'s symbol, and why would you want that?',
    a: 'It turns mangling off, so the symbol is the plain name (`sq`) and C code, which does not mangle, can call it.',
  },
  'mg-catch': {
    q: 'How does mangling turn a mismatched declaration across files into an error?',
    a: 'The parameter types are part of the symbol, so the caller asks for `_Z3addll` while the file defines `_Z3addii`; the linker finds no match and reports an undefined reference.',
  },
};

export const examples = {
  'link-mangled': {
    title: 'A linker that only compares strings',
    code: `// each object file: what it defines,
// and what it needs from elsewhere
const lib = {
  defs: ['_Z3addii', '_Z3adddd'],
  needs: [],
};
const ok = { defs: ['main'],
  needs: ['_Z3addii'] };
const bad = { defs: ['main'],
  needs: ['_Z3addll'] };
function link(...objs) {
  const have = new Set(
    objs.flatMap((o) => o.defs));
  for (const o of objs) {
    for (const n of o.needs) {
      if (!have.has(n)) {
        return 'undefined: ' + n;
      }
    }
  }
  return 'linked ' + have.size;
}
console.log(link(lib, ok));
console.log(link(lib, bad));`,
  },
};

export const exercises = {
  mangle: {
    title: 'A small Itanium mangler',
    prompt:
      'Write `mangle(fn)` for a small part of the Itanium C++ ABI. `fn` is `{ ns, name, params }`: `ns` is an array of namespace names (maybe empty), `name` the function name and `params` an array of type names from `int`, `long`, `char`, `bool` and `double`. The result is `_Z`, then the name, then one letter per parameter (`i`, `l`, `c`, `b`, `d`), or `v` if there are none. A plain name is written as its length and its letters (`add` is `3add`); if `ns` is not empty, the namespaces and the name are wrapped as `N` … `E`. For example `geo::area(double)` is `_ZN3geo4areaEd`. Every expected answer in the tests is real clang output.',
    starter: `function mangle(fn) {
  return '_Z' + fn.name;
}`,
    solution: `const CODE = { int: 'i', long: 'l',
  char: 'c', bool: 'b', double: 'd' };
function src(id) {
  return id.length + id;
}
function mangle({ ns, name, params }) {
  let s = '_Z';
  if (ns.length === 0) {
    s += src(name);
  } else {
    s += 'N' + ns.map(src).join('')
      + src(name) + 'E';
  }
  if (params.length === 0) {
    return s + 'v';
  }
  return s + params
    .map((t) => CODE[t]).join('');
}`,
    tests: `const f = (ns, name, params) =>
  mangle({ ns, name, params });
test('add(int, int)', () => {
  expect(f([], 'add', ['int', 'int']))
    .toBe('_Z3addii');
});
test('add(double, double)', () => {
  expect(f([], 'add', ['double', 'double']))
    .toBe('_Z3adddd');
});
test('no parameters is v', () => {
  expect(f([], 'f', [])).toBe('_Z1fv');
});
test('lengths can have two digits', () => {
  expect(f([], 'main_loop', ['int']))
    .toBe('_Z9main_loopi');
});
test('one namespace', () => {
  expect(f(['geo'], 'area', ['double']))
    .toBe('_ZN3geo4areaEd');
});
test('nested namespaces', () => {
  expect(f(['a', 'b'], 'run', ['long', 'char']))
    .toBe('_ZN1a1b3runElc');
  expect(f(['geometry'], 'area',
    ['double', 'bool']))
    .toBe('_ZN8geometry4areaEdb');
});`,
    hints: [
      'Build the string in three parts: the `_Z` prefix, the name part, and the parameter part.',
      'Write a helper that turns one identifier into its "source name": its length followed by its letters. Use it for the function name and for each namespace.',
      'If `ns` is empty the name part is `src(name)`; otherwise it is `N`, every namespace through `src`, `src(name)`, then `E`. The parameter part is one letter per type from a lookup table, or `v` when the list is empty.',
    ],
    walkthrough: `**How to think about it.** Work one example by hand before writing code. For \`geo::area(double)\`: the prefix is \`_Z\`; the name lives in a namespace, so it is nested: \`N\`, then \`geo\` written as \`3geo\`, then \`area\` written as \`4area\`, then \`E\`; and the one parameter is a \`double\`, written \`d\`. Gluing them gives \`_ZN3geo4areaEd\`, which is what clang wrote. So the function is three small jobs, and the one that repeats (length, then letters) deserves its own helper.

**The solution, line by line.**

- \`const CODE = { int: 'i', long: 'l', char: 'c', bool: 'b', double: 'd' };\` (two lines) is the ABI's table of builtin types, the few we need. A lookup table keeps the rule in one place, rather than a chain of \`if\`s.
- \`function src(id) { return id.length + id; }\` (three lines) writes a "source name". \`id.length\` is a number and \`id\` a string, so \`+\` joins them: \`src('area')\` is \`'4area'\`, and \`src('main_loop')\` is \`'9main_loop'\`. Lengths of ten or more are written in full (\`10\`), which is why the ABI puts the length first: a reader knows exactly how many letters to take.
- \`function mangle({ ns, name, params }) {\` takes the object apart into its three fields.
- \`let s = '_Z';\` starts every C++ symbol.
- \`if (ns.length === 0) { s += src(name); }\`: a function at the top level is a plain source name, so \`add\` gives \`_Z3add\`.
- \`else { s += 'N' + ns.map(src).join('') + src(name) + 'E'; }\`: a nested name. \`ns.map(src)\` turns \`['a', 'b']\` into \`['1a', '1b']\`, \`join('')\` glues them, the function name comes after, and \`N\` … \`E\` mark where the nested name starts and stops, so a reader knows where the parameter types begin.
- \`if (params.length === 0) return s + 'v';\`: an empty parameter list is written as one \`void\`, so \`f()\` is \`_Z1fv\`.
- \`return s + params.map((t) => CODE[t]).join('');\` (three lines) adds one letter per parameter in order: \`['long', 'char']\` becomes \`lc\`.

Notice what is *not* in the symbol: the return type. C++ cannot overload on the return type alone, so the ABI leaves it out for ordinary functions.

**Common wrong attempts.**

- Writing the name without its length (\`_Zaddii\`) makes the symbol ambiguous: a reader could not tell where \`add\` stops and the types begin.
- Forgetting \`v\` for an empty list gives \`_Z1f\`, which clang never writes.
- Putting the \`E\` after the parameter letters (\`_ZN3geo4areadE\`): the \`E\` closes the *name*, and the types follow it.`,
    wrong: [
      {
        code: `function mangle({ ns, name, params }) {
  const all = [...ns, name].join('');
  return '_Z' + all.length + all
    + params.map((t) => t[0]).join('');
}`,
        why: 'It writes the namespaces and name as one source name, with no `N`…`E`, and forgets `v` for an empty parameter list. (Taking the first letter of each type happens to work for these five types.)',
      },
      {
        code: `const CODE = { int: 'i', long: 'l',
  char: 'c', bool: 'b', double: 'd' };
function mangle({ ns, name, params }) {
  const n = [...ns, name]
    .map((x) => x.length + x).join('');
  const t = params.length
    ? params.map((x) => CODE[x])
      .join('')
    : 'v';
  return '_Z' + n + t;
}`,
        why: 'Nested names are not wrapped in `N`…`E`, so `geo::area(double)` comes out as `_Z3geo4aread`, which is a different (and wrong) symbol.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'You change one line inside the body of a function in one file of a large C program. With separate compilation, what is redone?',
    options: [
      { t: 'Every file is compiled again, then linked', why: 'That is what separate compilation avoids; the other object files did not change.' },
      { t: 'That file is compiled again, then the program is linked again', correct: true, why: 'The other object files were compiled against declarations that have not changed, so they are reused.' },
      { t: 'Nothing: the linker patches the old machine code', why: 'The linker only fills holes for addresses; it cannot compile new code.' },
    ],
  },
  {
    q: '`nm main.o` prints `U sq`. What does that tell you?',
    options: [
      { t: '`main.o` defines `sq` in its code section', why: 'That would be `T sq`.' },
      { t: '`sq` is unused and can be removed', why: 'U means the opposite: it is used here.' },
      { t: '`sq` is used by `main.o` but defined somewhere else, so the linker must supply it', correct: true, why: 'U is undefined: a hole the linker fills from another object file or library.' },
      { t: '`sq` has the wrong type', why: 'A C symbol carries no type at all, which is exactly the problem mangling solves in C++.' },
    ],
  },
  {
    q: 'Why does a C program whose two files disagree about `sq`’s parameter type still link?',
    options: [
      { t: 'The C linker converts the argument to the right type', why: 'Linkers never convert values; they only patch addresses.' },
      { t: 'C symbols are plain names, so the linker only checks that a `sq` exists', correct: true, why: 'Nothing about types is in the symbol, so the mismatch goes unseen and the program computes garbage.' },
      { t: 'It does not link: C reports an undefined reference', why: 'That is what C++ does, because its symbols include the parameter types.' },
    ],
  },
  {
    q: 'What is `_ZN3geo4areaEd`, demangled?',
    options: [
      { t: '`double geo(area)`', why: '`3geo` is a namespace inside `N`…`E`, not a function name.' },
      { t: '`area::geo(double)`', why: 'The namespace comes first: `geo` encloses `area`.' },
      { t: '`geo::area(double, double)`', why: 'There is one `d` after the `E`, so one parameter.' },
      { t: '`geo::area(double)`', correct: true, why: '`N3geo4areaE` is the nested name `geo::area`, and the one `d` is a `double` parameter.' },
    ],
  },
  {
    q: 'A C++ library must be callable from C. What does its author write, and what does it change?',
    options: [
      { t: '`extern "C"`, which keeps the plain, unmangled symbol', correct: true, why: 'C does not mangle, so it can only find a function by its plain name; the price is that such functions cannot be overloaded.' },
      { t: '`static`, which exports the symbol', why: '`static` does the opposite: it hides the symbol inside its file.' },
      { t: 'Nothing: C understands mangled names', why: 'A C compiler looks for the plain name `sq`, never `_Z2sqi`.' },
    ],
  },
  {
    q: 'How does the JVM keep two overloads of `add` apart, without mangling?',
    options: [
      { t: 'It renames the second one `add2`', why: 'javap shows both methods are still called `add`.' },
      { t: 'It does not: Java forbids overloading', why: 'Java allows overloading; `Calc` had two `add`s.' },
      { t: 'The class file stores each method’s name next to a descriptor of its types, such as `(II)I`', correct: true, why: 'A call names both, `Method add:(II)I`, so the types are part of what is matched.' },
    ],
  },
];
