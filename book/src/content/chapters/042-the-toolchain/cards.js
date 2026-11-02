// Chapter 42 cards. Keys are stable ids: never rename them.
//
// The book's runner strips TypeScript types without checking them, so the
// exercises test behaviour; the type errors they mirror are explained in
// the prompts and walkthroughs (each was checked with tsc 5.9.3 --strict).

export const prompts = {
  'tsconfig-what': {
    q: 'What does a `tsconfig.json` hold?',
    a: 'A project’s compiler settings (`compilerOptions`) and which files belong to it (`include` or `files`). Its folder is the project’s root.',
  },
  'tsc-finds': {
    q: 'You type `npx tsc` with no file names. Where does it look for its settings?',
    a: 'For a `tsconfig.json` in the current folder, then in each parent folder in turn.',
  },
  'files-ignore': {
    q: 'Your `tsconfig.json` says `"strict": true`. Is `npx tsc main.ts` checked strictly?',
    a: 'No. Naming files on the command line makes tsc ignore `tsconfig.json` (TypeScript 6.0 refuses instead, with error TS5112). Run `npx tsc` alone.',
  },
  'nodenext-js': {
    q: 'With `"module": "nodenext"`, why do you import `./scanner.js` when the file is `scanner.ts`?',
    a: 'Node needs the exact file to load at run time, and after compiling that file is `scanner.js`; tsc finds the `.ts` behind it.',
  },
  'implicit-any': {
    q: 'What does `noImplicitAny` report?',
    a: 'Every place where tsc cannot work out a type and would silently use `any`, such as a parameter with no label.',
  },
  'any-spreads': {
    q: 'Why is one unlabelled parameter with type `any` worse than it looks?',
    a: '`any` switches checking off, and anything worked out from it (`s.length`, `s.foo()`) is `any` too, so the hole spreads.',
  },
  'strict-null': {
    q: 'What changes when `strictNullChecks` is on?',
    a: '`null` and `undefined` get types of their own, so a value that may be missing (`string | undefined`) must be checked before it is used.',
  },
  'strict-default': {
    q: 'Is strict mode on if your `tsconfig.json` does not mention it?',
    a: 'In TypeScript 5.9, no; from TypeScript 6.0, yes. So write `"strict": true` explicitly.',
  },
};

export const examples = {
  narrowed: {
    title: 'Check before you use it',
    lang: 'ts',
    code: `const xs: string[] = ['ada', 'alan'];

function shout(s: string): string {
  return s.toUpperCase() + '!';
}

const k = 'z';
const m = xs.find((s) => s[0] === k);
// m: string | undefined
if (m !== undefined) {
  console.log(shout(m));
} else {
  console.log('none start with', k);
}`,
  },
};

export const exercises = {
  resolveStrict: {
    title: 'What does strict really turn on?',
    lang: 'ts',
    prompt: `tsc works out each strict check from the config like this: if the check is named in the config, its own value wins; otherwise it follows \`strict\`; and if \`strict\` is missing too, the check is off.

Write \`resolve(o)\`, which takes compiler options (any of \`strict\`, \`noImplicitAny\` and \`strictNullChecks\` may be missing; \`strict?: boolean\` means "a boolean, or missing") and returns \`{ noImplicitAny, strictNullChecks }\`, both booleans. For example \`resolve({ strict: true, strictNullChecks: false })\` is \`{ noImplicitAny: true, strictNullChecks: false }\`.`,
    starter: `type Opts = {
  strict?: boolean;
  noImplicitAny?: boolean;
  strictNullChecks?: boolean;
};

function resolve(o: Opts) {
  return {
    noImplicitAny:
      o.noImplicitAny === true,
    strictNullChecks:
      o.strictNullChecks === true,
  };
}`,
    solution: `type Opts = {
  strict?: boolean;
  noImplicitAny?: boolean;
  strictNullChecks?: boolean;
};

function pick(
  own: boolean | undefined,
  base: boolean,
): boolean {
  if (own === undefined) return base;
  return own;
}

function resolve(o: Opts) {
  const s = o.strict === true;
  return {
    noImplicitAny:
      pick(o.noImplicitAny, s),
    strictNullChecks:
      pick(o.strictNullChecks, s),
  };
}`,
    tests: `test('nothing set: both off', () => {
  expect(resolve({})).toEqual({
    noImplicitAny: false, strictNullChecks: false,
  });
});
test('strict alone turns both on', () => {
  expect(resolve({ strict: true })).toEqual({
    noImplicitAny: true, strictNullChecks: true,
  });
});
test('a named check overrides strict', () => {
  const o = { strict: true, strictNullChecks: false };
  expect(resolve(o)).toEqual({
    noImplicitAny: true, strictNullChecks: false,
  });
});
test('a named check works without strict', () => {
  expect(resolve({ noImplicitAny: true })).toEqual({
    noImplicitAny: true, strictNullChecks: false,
  });
});
test('strict: false is the same as missing', () => {
  const o = { strict: false, strictNullChecks: true };
  expect(resolve(o)).toEqual({
    noImplicitAny: false, strictNullChecks: true,
  });
});`,
    hints: [
      'Each check has three cases: named as true, named as false, or not named at all. Only the last case looks at `strict`.',
      'Write a small helper `pick(own, base)` that returns `base` when `own` is `undefined`, and `own` otherwise. Work out `base` once, from `strict`.',
      '`const s = o.strict === true;` is `true` only when strict is really `true` (missing gives `false`). Then return `{ noImplicitAny: pick(o.noImplicitAny, s), strictNullChecks: pick(o.strictNullChecks, s) }`.',
    ],
    walkthrough: `**How to think about it.** This is the rule from the chapter's definition, "strict turns the family on, and any one can be turned off by name", made exact. For one check there are three cases: the config says \`true\` (on), says \`false\` (off, whatever \`strict\` says), or does not mention it (then follow \`strict\`, and if that is missing too, off). The same rule applies to both checks, so write it once as a helper and call it twice.

**The solution, line by line.**

- \`type Opts = { ... };\` describes the options. \`strict?: boolean\` means the property may be missing, so reading \`o.strict\` gives \`boolean | undefined\`.
- \`function pick(own: boolean | undefined, base: boolean): boolean {\` takes a check's own setting (perhaps missing) and the value to fall back on, and promises a plain boolean back.
- \`if (own === undefined) return base;\` is the "not named" case: follow \`strict\`. After this line, TypeScript has narrowed \`own\` to \`boolean\`.
- \`return own;\` is the "named" case: its own value wins, even \`false\`.
- \`const s = o.strict === true;\` turns \`strict\` into a plain boolean: \`true\` only if it is really \`true\`, so both \`false\` and missing give \`false\`.
- \`noImplicitAny: pick(o.noImplicitAny, s),\` and \`strictNullChecks: pick(o.strictNullChecks, s),\` apply the rule to each check.

For \`{ strict: true, strictNullChecks: false }\`: \`s\` is \`true\`; \`noImplicitAny\` is missing, so it follows \`s\` and is \`true\`; \`strictNullChecks\` is named as \`false\`, so it is \`false\`.

**Common wrong attempts.**

- \`o.noImplicitAny || s\`: this treats \`false\` the same as missing, so \`strictNullChecks: false\` beside \`strict: true\` comes out \`true\`, and you could never turn one check off. The difference between "said no" and "said nothing" is exactly what \`=== undefined\` captures.
- Letting \`strict\` win over a named check (\`if (o.strict) return true;\`): it is the other way round; the named check is the more specific setting, so it wins.
- Returning \`o.strict\` itself as the fallback: when \`strict\` is missing that gives \`undefined\`, not \`false\`, and \`toEqual\` tells them apart.`,
    wrong: [
      {
        code: `type Opts = {
  strict?: boolean;
  noImplicitAny?: boolean;
  strictNullChecks?: boolean;
};

function resolve(o: Opts) {
  const s = o.strict === true;
  return {
    noImplicitAny: o.noImplicitAny || s,
    strictNullChecks:
      o.strictNullChecks || s,
  };
}`,
        why: '`false || true` is `true`, so a check named as `false` is turned back on by `strict`. Only a *missing* check should follow `strict`.',
      },
      {
        code: `type Opts = {
  strict?: boolean;
  noImplicitAny?: boolean;
  strictNullChecks?: boolean;
};

function pick(
  own: boolean | undefined,
  base: boolean | undefined,
) {
  if (own === undefined) return base;
  return own;
}

function resolve(o: Opts) {
  const st = o.strict;
  return {
    noImplicitAny:
      pick(o.noImplicitAny, st),
    strictNullChecks:
      pick(o.strictNullChecks, st),
  };
}`,
        why: 'When `strict` is missing too, this returns `undefined` rather than `false`. Writing `: boolean` as `pick`’s return type would have made tsc point at the problem (error TS2322).',
      },
    ],
  },
  firstShout: {
    optional: true,
    title: 'Strict-safe: the first match, shouted',
    lang: 'ts',
    prompt: 'Write `firstShout(names: string[], letter: string): string`. It returns the first name that starts with `letter`, in capitals, or `\'\'` (an empty string) if there is none. With strict mode on, tsc rejects the obvious one-liner `return names.find(...).toUpperCase();`; write a version strict mode accepts.',
    starter: `function firstShout(
  names: string[],
  letter: string,
): string {
  const n = names.find(
    (s) => s[0] === letter,
  );
  return n.toUpperCase();
}`,
    solution: `function firstShout(
  names: string[],
  letter: string,
): string {
  const n = names.find(
    (s) => s[0] === letter,
  );
  if (n === undefined) return '';
  return n.toUpperCase();
}`,
    tests: `test('finds and shouts the first match', () => {
  const xs = ['ada', 'alan', 'bob'];
  expect(firstShout(xs, 'a')).toBe('ADA');
});
test('no match gives an empty string', () => {
  expect(firstShout(['ada'], 'z')).toBe('');
});
test('an empty list gives an empty string', () => {
  expect(firstShout([], 'a')).toBe('');
});`,
    hints: [
      '`find` returns the first match, or `undefined` when nothing matches. What should happen in that second case?',
      'Check for `undefined` before calling `toUpperCase`: after the check, TypeScript knows `n` is a `string`.',
      'Add `if (n === undefined) return \'\';` just before `return n.toUpperCase();`.',
    ],
    walkthrough: `**How to think about it.** Strict mode's complaint about the one-liner, \`'n' is possibly 'undefined'\` (error TS18048), is not fussiness: it is a real bug, and the tests show it, because \`firstShout(['ada'], 'z')\` makes \`find\` return \`undefined\`, and calling \`undefined.toUpperCase()\` throws a \`TypeError\`. So the job is to decide what the "nothing found" case should return (the prompt says \`''\`) and to handle it before using \`n\`.

**The solution, line by line.**

- \`function firstShout(names: string[], letter: string): string {\` promises a \`string\` back, always, which is why the missing case must produce one.
- \`const n = names.find((s) => s[0] === letter);\` finds the first name whose first character is \`letter\`. Its type is \`string | undefined\`.
- \`if (n === undefined) return '';\` handles "nothing found", and also narrows \`n\`: on the lines below, TypeScript knows \`n\` is a \`string\`.
- \`return n.toUpperCase();\` is now safe, and strict mode accepts it.

For an empty list, \`find\` has nothing to look at and returns \`undefined\`, so the answer is \`''\` too.

**Common wrong attempts.**

- The starter's one-liner: it works when a name matches and throws when none does. Loose mode lets it through; strict mode refuses it, which is the point of strict mode.
- \`return n!.toUpperCase();\`: the \`!\` tells TypeScript "trust me, it is not undefined", which silences strict mode without fixing anything; it still throws on \`'z'\`.`,
    wrong: [
      {
        code: `function firstShout(
  names: string[],
  letter: string,
): string {
  const n = names.find(
    (s) => s[0] === letter,
  );
  return n!.toUpperCase();
}`,
        why: 'The `!` only silences the checker; when nothing matches, `n` is still `undefined` and the call throws a TypeError.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Your `tsconfig.json` has `"strict": true`. You run `npx tsc src/main.ts`. How is `main.ts` checked (TypeScript 5.9)?',
    options: [
      { t: 'With default settings: naming a file makes tsc ignore `tsconfig.json`', correct: true, why: 'Settings come from tsconfig.json only when you run tsc with no file names. (TypeScript 6.0 refuses with TS5112 instead.)' },
      { t: 'Strictly, using the `tsconfig.json` in the folder', why: 'That is what `npx tsc` alone would do. With a file name, the config is ignored.' },
      { t: 'Not at all: tsc needs a config to run', why: 'tsc runs fine without one, using its defaults.' },
    ],
  },
  {
    q: 'With `"module": "nodenext"`, which import of the file `scanner.ts` does tsc accept?',
    options: [
      { t: "`import { scan } from './scanner';`", why: 'Error TS2835: relative imports need an explicit file extension under nodenext.' },
      { t: "`import { scan } from './scanner.ts';`", why: 'Not by default: tsc wants the name the file will have when it runs, `scanner.js`. (A setting, allowImportingTsExtensions, allows `.ts` when tsc writes no files.)' },
      { t: "`import { scan } from './scanner.js';`", correct: true, why: 'The import names the file Node will load after compiling; tsc finds `scanner.ts` behind it.' },
    ],
  },
  {
    q: "With strict mode on, what does tsc say about this?\n```\nconst xs = ['ada'];\nconst z = xs.find((s) => s === 'z');\nconsole.log(z.length);\n```",
    options: [
      { t: 'Nothing: `z` is a string', why: '`find` may find nothing, so `z` is `string | undefined`.' },
      { t: "error TS18048: 'z' is possibly 'undefined'", correct: true, why: 'strictNullChecks makes you rule out `undefined` (for example with an `if`) before using `z`.' },
      { t: 'It crashes while checking', why: 'tsc never runs your code; it reports the problem and carries on.' },
    ],
  },
  {
    q: 'What does `{ "strict": true, "strictNullChecks": false }` give you?',
    options: [
      { t: 'No strict checks at all', why: 'Only the one named check is turned off; the rest of the family stays on.' },
      { t: 'An error: the two settings contradict each other', why: 'This is allowed, and is how you turn off one check at a time.' },
      { t: 'Every strict check except the null checks', correct: true, why: 'strict turns on the family, and a check named on its own wins over strict.' },
    ],
  },
  {
    q: 'Which of these catches “this value may be missing” before the program runs?',
    options: [
      { t: '`javac` with every warning on', why: 'javac does not track whether a reference may be null; the code fails at run time with a NullPointerException.' },
      { t: 'TypeScript with strictNullChecks', correct: true, why: 'It gives `undefined` a type of its own, so `string | undefined` must be checked before use.' },
      { t: '`gcc -Wall -Wextra`', why: 'gcc says nothing; reading through the NULL pointer crashes the program when it runs.' },
    ],
  },
];
