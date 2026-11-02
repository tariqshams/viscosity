// Chapter 86 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 162, 162, 162.

export const prompts = {
  'pkg-what': {
    q: 'What is an npm package?',
    a: 'A folder described by a `package.json`, packed into a tarball and published to a registry so others can install it by name.',
  },
  'pkg-identity': {
    q: 'Which two `package.json` fields together identify a published package?',
    a: '`name` and `version`.',
  },
  'pkg-scope': {
    q: 'What is the `@viscosity/` in `@viscosity/cli`?',
    a: 'A scope: a namespace owned by an npm user or organisation.',
  },
  'pkg-ts': {
    q: 'Why did the first installed CLI fail with ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING?',
    a: 'Node strips TypeScript types by default, but deliberately refuses to for files under `node_modules`. Packages must ship JavaScript.',
  },
  'pkg-deps': {
    q: 'Why did installing the CLI tarball install only one package?',
    a: 'The CLI imports the core by a relative path into the repo and declared no dependencies, so npm didn’t know it needed anything else. The bundle now inlines everything.',
  },
  'pkg-main': {
    q: 'Why did the bundled CLI print nothing when run through `npx`?',
    a: 'It only called `main()` when `import.meta.url` matched `process.argv[1]`, and through npm’s bin link `argv[1]` is the link’s path, not the file’s.',
  },
  'pkg-order': {
    q: 'Why were the six Rust crates published in a fixed order (vir, core, the front ends, cli, wasm)?',
    a: 'Each crate depends on the ones before it, and cargo will not publish a crate whose dependencies are not on crates.io yet.',
  },
  'pkg-files': {
    q: 'What does the `files` field in `package.json` do?',
    a: 'It limits the tarball to the listed files and folders (package.json is always included).',
  },
  'pkg-dryrun': {
    q: 'How do you see exactly which files a package would contain, without publishing anything?',
    a: '`npm pack --dry-run`.',
  },
  'sv-rules': {
    q: 'In semver, which part do you bump for a backward compatible new feature, and what happens to the part after it?',
    a: 'MINOR; PATCH resets to 0.',
  },
  'sv-zero': {
    q: 'What does semver promise for versions 0.y.z?',
    a: 'Nothing: major version zero is for initial development, and anything may change at any time.',
  },
  'sv-caret': {
    q: 'Which versions does the range `^0.1.0` accept?',
    a: 'Only 0.1.x (at least 0.1.0, below 0.2.0): in 0.x the minor number is treated as breaking.',
  },
  'sv-numeric': {
    q: 'Is `1.10.0` newer than `1.9.0`? What does the string comparison `\'1.10.0\' > \'1.9.0\'` say?',
    a: 'Yes, because the parts compare as numbers (10 > 9). The string comparison says `false`, because it compares characters.',
  },
  'sv-api': {
    q: 'Name two things besides the CLI options that are part of Viscosity’s public API.',
    a: 'Any two of: the plugin API, the explain report’s text, and its layout decisions.',
  },
  'sv-immutable': {
    q: 'Can a published npm version be changed or reused after a mistake?',
    a: 'No. A name and version, once published, can never be used again, even after unpublishing: a fix needs a new version.',
  },
  'sv-prerelease': {
    q: 'Which comes first in version order, `1.0.0-beta.1` or `1.0.0`?',
    a: '`1.0.0-beta.1`: a pre-release sorts before the release it leads up to.',
  },
  'sv-cargo': {
    q: 'Why did Viscosity start at 0.0.1 rather than 0.1.0 or 1.0.0?',
    a: 'Under the caret rule (npm’s and Cargo’s), 0.0.1 is compatible with no other version, so no dependent picks up a newer release without asking.',
  },
  'native-vs-wasm-what': {
    q: 'What is the choice between **native binaries and WebAssembly** when you ship Rust?',
    a: 'Native: one compiled binary per OS and CPU, fastest, chosen at install. WebAssembly: one `.wasm` for every platform, run inside a JS engine, slower and with no threads or files of its own.',
  },
  'esbuild-26': {
    q: 'How does esbuild get the right native binary onto your machine through npm?',
    a: 'It lists 26 platform packages as `optionalDependencies`. Each declares `os` and `cpu`, and npm installs only the one that matches.',
  },
  'exports-order': {
    q: 'In a conditional `"exports"` map, which entry does Node pick?',
    a: 'The first key, in object order, whose condition is active. `"default"` always matches, so it goes last.',
  },
  'exports-fallthrough': {
    q: 'A nested condition object matches nothing. What does Node do?',
    a: 'It goes back and tries the parent’s remaining keys, like a nested `if` that falls through.',
  },
  'two-copies': {
    q: 'Why does the tarball contain the 1.4 MB `.wasm` twice?',
    a: 'Each glue file loads the module next to itself, and the node and web modules differ by 64 bytes. It costs about 1.4 MB unpacked.',
  },
  'licences-67': {
    q: 'Why must `THIRD_PARTY_LICENSES.txt` ship with the `.wasm`?',
    a: 'The `.wasm` statically links 71 third-party crates, and their licences require their notices to go wherever the code goes.',
  },
  'oxc-licence': {
    q: 'What was missing from oxc’s published crates, and what does the build do about it?',
    a: 'Their licence file. The package carries copies of the files from oxc’s repositories.',
  },
  'smoke-what': {
    q: 'What does `smoke.mjs` check?',
    a: 'It packs and installs the package in an empty folder, then compiles 60 corpus programs three ways (require, import, web with bytes): all must match the TS CLI. It type-checks a consumer too.',
  },
};

export const examples = {
  'semver-compare': {
    title: 'Versions are numbers, not strings',
    code: `const a = '1.10.0';
const b = '1.9.0';
// strings: character by character
console.log(a > b);

function parse(v) {
  return v.split('.').map(Number);
}
console.log(parse(a), parse(b));
// numbers compare by value
console.log(parse(a)[1] > parse(b)[1]);`,
  },
  'pick-native': {
    lang: 'rust',
    title: 'One binary per platform',
    code: `use std::env::consts::{ARCH, OS};

fn main() {
    // esbuild 0.27.7's platform
    // packages, named "<os>-<cpu>".
    let all = [
        "aix-ppc64", "android-arm",
        "android-arm64", "android-x64",
        "darwin-arm64", "darwin-x64",
        "freebsd-arm64", "freebsd-x64",
        "linux-arm", "linux-arm64",
        "linux-ia32", "linux-loong64",
        "linux-mips64el", "linux-ppc64",
        "linux-riscv64", "linux-s390x",
        "linux-x64", "netbsd-arm64",
        "netbsd-x64", "openbsd-arm64",
        "openbsd-x64",
        "openharmony-arm64",
        "sunos-x64", "win32-arm64",
        "win32-ia32", "win32-x64",
    ];
    // Rust and Node name things apart.
    let os = match OS {
        "macos" => "darwin",
        "windows" => "win32",
        o => o,
    };
    let cpu = match ARCH {
        "x86_64" => "x64",
        "aarch64" => "arm64",
        "x86" => "ia32",
        a => a,
    };
    let want = format!("{os}-{cpu}");
    println!("this machine: {want}");
    let mine: Vec<_> = all
        .iter()
        .filter(|p| **p == want)
        .collect();
    println!(
        "npm installs {:?} of {}",
        mine,
        all.len()
    );
}
`,
  },
};

export const exercises = {
  packList: {
    title: 'What goes in the tarball?',
    prompt: 'Write `packList(paths, files)`, a simplified version of how npm decides what to pack. `paths` lists every file in the package folder, and `files` is the `files` field of `package.json` (or `undefined` if there is none). Return, sorted, the paths that are packed: `package.json` always; with no `files` field, everything; otherwise every path that equals an entry of `files` or lies inside a folder named by one (`dist` covers `dist/viscosity.mjs`, but not `distant.txt`).',
    starter: `function packList(paths, files) {
  return paths;
}`,
    solution: `function packList(paths, files) {
  const keep = (p) =>
    p === 'package.json' ||
    !files ||
    files.some((f) =>
      p === f || p.startsWith(f + '/'));
  return paths.filter(keep).sort();
}`,
    tests: `const paths = ['package.json', 'build.mjs', 'src/cli.ts', 'src/profile.ts', 'bin/viscosity.mjs', 'dist/viscosity.mjs', 'LICENSE', 'THIRD_PARTY_LICENSES.txt'];
const files = ['bin', 'dist', 'LICENSE', 'THIRD_PARTY_LICENSES.txt'];
test('the real CLI packs five files', () => {
  expect(packList(paths, files)).toEqual(['LICENSE', 'THIRD_PARTY_LICENSES.txt', 'bin/viscosity.mjs', 'dist/viscosity.mjs', 'package.json']);
});
test('a folder name is not a prefix of other names', () => {
  expect(packList(['dist/a.js', 'distant.txt', 'package.json'], ['dist'])).toEqual(['dist/a.js', 'package.json']);
});
test('package.json is always packed', () => {
  expect(packList(['package.json', 'a.js'], ['a.js'])).toEqual(['a.js', 'package.json']);
});
test('no files field packs everything', () => {
  expect(packList(['src/cli.ts', 'package.json'])).toEqual(['package.json', 'src/cli.ts']);
});`,
    hints: [
      'Write one test, `keep(p)`, that says whether a single path is packed, then `filter` and `sort`.',
      'Three reasons to keep a path: it is `package.json`; there is no `files` field at all; or some entry of `files` matches it.',
      'An entry `f` matches a path that equals `f`, or that starts with `f + \'/\'` (the slash stops `dist` from matching `distant.txt`).',
    ],
    walkthrough: `**How to think about it.** Work the first test by hand. The folder has eight files, and \`files\` names two folders and two single files. \`bin/viscosity.mjs\` is inside \`bin\`, so it is packed; \`dist/viscosity.mjs\` is inside \`dist\`; the two licence files are named directly; \`package.json\` is always packed; and \`build.mjs\` and the two \`src\` files are left out. That is five files, the same five the real \`@viscosity/cli\` tarball holds. So the job splits into a yes-or-no question about one path, asked of every path, followed by a sort.

**The solution, line by line.**

- \`function packList(paths, files) {\` takes the folder's paths and the optional \`files\` list.
- \`  const keep = (p) =>\` defines the question for one path \`p\`.
- \`    p === 'package.json' ||\` keeps the manifest no matter what.
- \`    !files ||\` keeps everything when there is no \`files\` field (\`undefined\` is falsy, so \`!files\` is \`true\`).
- \`    files.some((f) =>\` asks whether any entry matches;
- \`      p === f || p.startsWith(f + '/'));\` an entry matches the file it names exactly, or anything inside the folder it names. Adding the \`'/'\` is what stops \`dist\` from matching \`distant.txt\`.
- \`  return paths.filter(keep).sort();\` keeps the matching paths and sorts them (capital letters sort before small ones, which is why \`LICENSE\` comes first).

The real npm also always includes a README and a licence file, and ignores some folders by default; this exercise keeps only the rule that bit the CLI.

**Common wrong attempts.**

- \`p.startsWith(f)\` without the slash: \`distant.txt\` is packed because it begins with \`dist\`.
- Forgetting \`package.json\`: a tarball without its manifest cannot be installed at all.
- Forgetting the no-\`files\` case: \`files.some\` on \`undefined\` throws, although a package without a \`files\` field is perfectly normal (it packs everything, which is exactly how the first CLI tarball ended up holding raw TypeScript).`,
    wrong: [
      {
        code: `function packList(paths, files) {
  const keep = (p) =>
    p === 'package.json' ||
    !files ||
    files.some((f) =>
      p.startsWith(f));
  return paths.filter(keep).sort();
}`,
        why: 'Without the slash, `dist` matches `distant.txt` too. A folder entry should match only paths inside that folder.',
      },
      {
        code: `function packList(paths, files) {
  if (!files) return paths.sort();
  return paths.filter((p) =>
    files.some((f) => p === f ||
      p.startsWith(f + '/'))).sort();
}`,
        why: '`package.json` is left out whenever `files` does not list it, and a package without its manifest cannot be installed.',
      },
    ],
  },
  releaseOrder: {
    optional: true,
    title: 'Publish in dependency order',
    prompt: 'Write `releaseOrder(deps)`. `deps` maps each crate name to the list of crates it depends on (all of them in `deps`). Return an array of every crate in an order where each crate comes after all of its dependencies. When several crates are ready at once, take them in alphabetical order. If no crate is ready but some are left (a cycle), throw an `Error` with message `\'cycle\'`.',
    starter: `function releaseOrder(deps) {
  return Object.keys(deps).sort();
}`,
    solution: `function releaseOrder(deps) {
  const done = [];
  const names =
    Object.keys(deps).sort();
  while (done.length < names.length) {
    const next = names.find((n) =>
      !done.includes(n) &&
      deps[n].every((d) =>
        done.includes(d)));
    if (!next) throw new Error('cycle');
    done.push(next);
  }
  return done;
}`,
    tests: `const v = 'viscosity-';
const real = {
  [v + 'cli']: [v + 'core', v + 'frontend-js', v + 'frontend-python', v + 'vir'],
  [v + 'core']: [v + 'vir'],
  [v + 'frontend-js']: [v + 'core', v + 'vir'],
  [v + 'frontend-python']: [v + 'core', v + 'vir'],
  [v + 'vir']: [],
  [v + 'wasm']: [v + 'core', v + 'frontend-js', v + 'frontend-python', v + 'vir'],
};
test('the six Viscosity crates', () => {
  expect(releaseOrder(real).map((n) => n.slice(v.length))).toEqual(['vir', 'core', 'frontend-js', 'frontend-python', 'cli', 'wasm']);
});
test('a chain', () => {
  expect(releaseOrder({ a: ['b'], b: ['c', 'd'], c: [], d: [] })).toEqual(['c', 'd', 'b', 'a']);
});
test('independent crates in alphabetical order', () => {
  expect(releaseOrder({ z: [], m: [], a: [] })).toEqual(['a', 'm', 'z']);
});
test('a cycle cannot be published', () => {
  let msg = 'no error';
  try { releaseOrder({ a: ['b'], b: ['a'] }); } catch (e) { msg = e.message; }
  expect(msg).toBe('cycle');
});`,
    hints: [
      'A crate is ready when every crate it depends on has already been published.',
      'Keep a list `done`. Over and over, find the first name (in alphabetical order) that is not done and is ready, and add it.',
      'If no name is ready but some are left, they depend on each other in a circle: throw.',
    ],
    walkthrough: `**How to think about it.** This is the order \`scripts/release.sh\` follows, and the order cargo enforces: a crate can only go up once everything it depends on is already on crates.io. Do the real case by hand. At the start only \`vir\` depends on nothing, so it goes first. Then \`core\` is ready (it needs only \`vir\`). Then both front ends are ready, and alphabetical order puts \`frontend-js\` first, then \`frontend-python\`. Then \`cli\` and \`wasm\` are both ready, and \`cli\` comes first. So the method is: repeatedly pick the first ready crate, alphabetically, until none are left. (This is a *topological sort*, the same ordering a build tool uses for its targets.)

**The solution, line by line.**

- \`function releaseOrder(deps) {\` takes the dependency map.
- \`  const done = [];\` is the publishing order so far.
- \`  const names =
    Object.keys(deps).sort();\` lists every crate alphabetically, so that \`find\` below always prefers the alphabetically first ready crate.
- \`  while (done.length < names.length) {\` repeats until every crate is placed.
- \`    const next = names.find((n) =>\` looks for the first crate that is
- \`      !done.includes(n) &&\` not yet published, and
- \`      deps[n].every((d) =>\` and \`        done.includes(d)));\` whose dependencies are all published already.
- \`    if (!next) throw new Error('cycle');\` handles the case where crates remain but none is ready: they wait on each other forever.
- \`    done.push(next);\` publishes it.
- \`  return done;\` returns the order.

**Common wrong attempts.**

- Sorting the names alphabetically and stopping there: \`cli\` would go before \`core\` and \`vir\`, and cargo would refuse to publish it.
- Sorting by how many dependencies each crate has: it happens to work for the six real crates, but in the chain test \`a\` has fewer dependencies than \`b\` while depending on it, and a cycle is never detected.`,
    wrong: [
      {
        code: `function releaseOrder(deps) {
  return Object.keys(deps).sort();
}`,
        why: 'Alphabetical order ignores dependencies: cli would be published before core and vir.',
      },
      {
        code: `function releaseOrder(deps) {
  return Object.keys(deps).sort(
    (a, b) => deps[a].length -
      deps[b].length ||
      (a < b ? -1 : 1));
}`,
        why: 'Fewer dependencies does not mean earlier: in `{ a: [\'b\'], b: [\'c\', \'d\'], ... }`, `a` comes before `b`, which it needs. And a cycle is never reported.',
      },
    ],
  },
  bump: {
    title: 'Bump a version',
    prompt: 'Write `bump(v, kind)`. `v` is a version like `\'1.4.2\'` and `kind` is `\'major\'`, `\'minor\'` or `\'patch\'`. Return the next version as a string, following semver: add 1 to that part and reset every part to its right to 0.',
    starter: `function bump(v, kind) {
  return v + '.1';
}`,
    solution: `function bump(v, kind) {
  const p = v.split('.').map(Number);
  if (kind === 'major') {
    return \`\${p[0] + 1}.0.0\`;
  }
  if (kind === 'minor') {
    return \`\${p[0]}.\${p[1] + 1}.0\`;
  }
  return \`\${p[0]}.\${p[1]}.\${p[2] + 1}\`;
}`,
    tests: `test('a patch release', () => {
  expect(bump('0.1.0', 'patch')).toBe('0.1.1');
});
test('minor resets patch', () => {
  expect(bump('0.1.9', 'minor')).toBe('0.2.0');
});
test('major resets minor and patch', () => {
  expect(bump('1.4.2', 'major')).toBe('2.0.0');
});
test('9 + 1 is 10, not 91', () => {
  expect(bump('1.9.0', 'minor')).toBe('1.10.0');
});
test('leaves 0.x alone when patching', () => {
  expect(bump('0.9.9', 'patch')).toBe('0.9.10');
});`,
    hints: [
      '`v.split(\'.\')` gives three strings. Turn them into numbers before adding.',
      'Handle the three kinds separately; each one builds the result from the parts.',
      'Everything to the right of the bumped part becomes 0.',
    ],
    walkthrough: `**How to think about it.** Semver's rule is short: add 1 to the part you were asked to bump, and reset every part to its right to 0. Try the tricky test by hand first: \`bump('1.9.0', 'minor')\` must be \`'1.10.0'\`, which only happens if the parts are treated as numbers, because the string \`'9'\` plus 1 is \`'91'\`. So the plan is: split the version at the dots, turn each piece into a number, then build the answer for each of the three kinds.

**The solution, line by line.**

- \`function bump(v, kind) {\` takes the version string and which part to bump.
- \`  const p = v.split('.').map(Number);\` splits \`'1.9.0'\` into \`['1', '9', '0']\` and turns each piece into a number, giving \`[1, 9, 0]\`.
- \`  if (kind === 'major') {\` handles a breaking change;
- \`    return \\\`\${p[0] + 1}.0.0\\\`;\` adds 1 to the major part and resets the other two, so \`1.4.2\` becomes \`2.0.0\`.
- \`  if (kind === 'minor') {\` handles a new feature;
- \`    return \\\`\${p[0]}.\${p[1] + 1}.0\\\`;\` keeps the major, adds 1 to the minor and resets the patch, so \`0.1.9\` becomes \`0.2.0\` and \`1.9.0\` becomes \`1.10.0\`.
- \`  return \\\`\${p[0]}.\${p[1]}.\${p[2] + 1}\\\`;\` is the only case left, a patch: only the last part changes, so \`0.9.9\` becomes \`0.9.10\`.

Notice that nothing special happens in 0.x: bumping is the same arithmetic. What changes in 0.x is what the numbers *promise*, and how caret ranges read them.

**Common wrong attempts.**

- Forgetting \`.map(Number)\`: the parts stay strings, \`'9' + 1\` is \`'91'\`, and \`1.9.0\` becomes \`1.91.0\`.
- Incrementing the part but not resetting the others (\`p[1]++\` then \`p.join('.')\`): \`0.1.9\` bumped by minor becomes \`0.2.9\`, which claims a patch that was never released.`,
    wrong: [
      {
        code: `function bump(v, kind) {
  const p = v.split('.');
  if (kind === 'major') {
    return \`\${p[0] + 1}.0.0\`;
  }
  if (kind === 'minor') {
    return \`\${p[0]}.\${p[1] + 1}.0\`;
  }
  return \`\${p[0]}.\${p[1]}.\${p[2] + 1}\`;
}`,
        why: 'The parts are still strings, so `\'9\' + 1` is `\'91\'` and `1.9.0` becomes `1.91.0`. Convert with `Number` first.',
      },
      {
        code: `function bump(v, kind) {
  const p = v.split('.').map(Number);
  if (kind === 'major') p[0]++;
  if (kind === 'minor') p[1]++;
  if (kind === 'patch') p[2]++;
  return p.join('.');
}`,
        why: 'Nothing is reset, so `0.1.9` bumped by minor becomes `0.2.9`. Semver resets the parts to the right of the one you bump.',
      },
    ],
  },
  newer: {
    optional: true,
    title: 'Which version is newer?',
    prompt: 'Write `newer(a, b)` for plain versions like `\'1.10.0\'` (no pre-release tags). Return `true` if `a` is newer than `b`, otherwise `false`. Compare major, then minor, then patch, as numbers; the first part that differs decides.',
    starter: `function newer(a, b) {
  return a > b;
}`,
    solution: `function newer(a, b) {
  const x = a.split('.').map(Number);
  const y = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (x[i] !== y[i]) {
      return x[i] > y[i];
    }
  }
  return false;
}`,
    tests: `test('minor 10 beats minor 9', () => {
  expect(newer('1.10.0', '1.9.0')).toBe(true);
});
test('major decides first', () => {
  expect(newer('2.0.0', '1.99.99')).toBe(true);
  expect(newer('1.99.99', '2.0.0')).toBe(false);
});
test('equal is not newer', () => {
  expect(newer('1.2.3', '1.2.3')).toBe(false);
});
test('patch decides last', () => {
  expect(newer('0.1.0', '0.1.1')).toBe(false);
  expect(newer('0.1.12', '0.1.2')).toBe(true);
});`,
    hints: [
      'Split both versions and convert the parts to numbers.',
      'Walk the three positions in order. The first position where they differ decides.',
      'If all three are equal, `a` is not newer.',
    ],
    walkthrough: `**How to think about it.** Versions are ordered like words in a dictionary, except that each "letter" is a whole number: compare the majors; only if they are equal compare the minors; only if those are equal compare the patches. The first part that differs decides, and nothing after it matters (\`2.0.0\` beats \`1.99.99\` at the very first part). The trap is the same as in the chapter's runnable example: compared as strings, \`'10'\` comes before \`'9'\`, so the parts must become numbers first.

**The solution, line by line.**

- \`function newer(a, b) {\` takes two plain versions.
- \`  const x = a.split('.').map(Number);\` and \`  const y = b.split('.').map(Number);\` turn both into three numbers.
- \`  for (let i = 0; i < 3; i++) {\` walks major, minor, patch, in that order.
- \`    if (x[i] !== y[i]) {\` finds the first part that differs;
- \`      return x[i] > y[i];\` and lets it decide: \`a\` is newer exactly when its part is bigger.
- \`  return false;\` is reached only when all three parts are equal, and an equal version is not newer.

**Common wrong attempts.**

- Comparing the whole strings (\`a > b\`): \`'1.10.0' > '1.9.0'\` is \`false\`, because the character \`'1'\` sorts before \`'9'\`.
- Splitting but comparing the parts as strings: still \`'10' > '9'\` is \`false\`. Convert to numbers.
- Comparing all three parts with \`&&\` (every part at least as big): \`2.0.0\` against \`1.99.99\` fails, although the major alone decides. The full rules also order pre-releases (\`1.0.0-alpha\` comes before \`1.0.0\`), which libraries such as node-semver implement.`,
    wrong: [
      {
        code: `function newer(a, b) {
  const x = a.split('.');
  const y = b.split('.');
  for (let i = 0; i < 3; i++) {
    if (x[i] !== y[i]) {
      return x[i] > y[i];
    }
  }
  return false;
}`,
        why: 'Comparing the parts as strings still fails: `\'10\' > \'9\'` is `false`. Convert to numbers.',
      },
    ],
  },
  resolve: {
    lang: 'rust',
    title: 'Resolving conditional exports',
    prompt: 'Write `resolve`, Node’s rule for a conditional `"exports"` value. A `File` is the answer. For `Conds`, try the entries **in the map’s order**: an entry applies if its key is `"default"` or is in `conds`. If it applies, resolve its value; if that gives a file, return it, and if not, carry on with the next entry. Return `None` if nothing matches.',
    starter: `// A value in an "exports" map: a file,
// or conditions tried in this order.
enum Target {
    File(&'static str),
    Conds(Vec<(&'static str, Target)>),
}
use Target::*;

// The file \`t\` gives an importer whose
// active conditions are \`conds\`.
fn resolve(
    t: &Target,
    conds: &[&str],
) -> Option<&'static str> {
    todo!()
}`,
    solution: `// A value in an "exports" map: a file,
// or conditions tried in this order.
enum Target {
    File(&'static str),
    Conds(Vec<(&'static str, Target)>),
}
use Target::*;

// The file \`t\` gives an importer whose
// active conditions are \`conds\`.
fn resolve(
    t: &Target,
    conds: &[&str],
) -> Option<&'static str> {
    let cs = match t {
        File(f) => return Some(*f),
        Conds(cs) => cs,
    };
    for (k, v) in cs {
        let on = *k == "default"
            || conds.contains(k);
        if !on {
            continue;
        }
        let r = resolve(v, conds);
        if r.is_some() {
            return r;
        }
    }
    None
}`,
    tests: `// @viscosity/wasm's "." entry.
fn pkg() -> Target {
    let glue = |d, t| Conds(vec![
        ("types", File(t)),
        ("default", File(d)),
    ]);
    let n = glue("node.js", "node.d.ts");
    let w = glue("web.js", "web.d.ts");
    Conds(vec![
        ("node", n),
        ("browser", w),
        ("types", File("web.d.ts")),
        ("default", File("web.js")),
    ])
}

#[test]
fn node_gets_the_node_glue() {
    let c = ["node", "require"];
    let f = resolve(&pkg(), &c);
    assert_eq!(f, Some("node.js"));
}

#[test]
fn browsers_get_the_web_glue() {
    let f = resolve(&pkg(), &["browser"]);
    assert_eq!(f, Some("web.js"));
}

#[test]
fn anything_else_gets_default() {
    let f = resolve(&pkg(), &["deno"]);
    assert_eq!(f, Some("web.js"));
}

#[test]
fn map_order_wins_not_caller_order() {
    let c = ["types", "node", "import"];
    let f = resolve(&pkg(), &c);
    assert_eq!(f, Some("node.d.ts"));
}

#[test]
fn a_nested_miss_falls_through() {
    let t = Conds(vec![
        ("node", Conds(vec![
            ("import", File("a.mjs")),
        ])),
        ("default", File("b.js")),
    ]);
    let c = ["node", "require"];
    let f = resolve(&t, &c);
    assert_eq!(f, Some("b.js"));
}

#[test]
fn no_match_is_none() {
    let t = Conds(vec![("node", File("a"))]);
    assert_eq!(resolve(&t, &["browser"]), None);
}
`,
    hints: [
      'Start with a `match`: a `File(f)` returns `Some(*f)` straight away (the `*` copies the `&\'static str` out of the reference).',
      'Loop over the map’s entries, not over `conds`. The importer’s list says what is active; the map says what to try first.',
      'When an entry applies, don’t just `return resolve(v, conds)`: a nested map can match nothing, and then the next entry of the parent must get its turn.',
    ],
    walkthrough: `**How to think about it.** This is the rule in Node's documentation on conditional exports: "key order is significant … earlier entries have higher priority", ""default" … always matches", and "if a nested condition does not have any mapping it will continue checking the remaining conditions of the parent condition". Read those three sentences as three requirements on your loop. First, the loop walks *the map's* entries, in the map's order, not the importer's list of conditions. Second, \`"default"\` counts as active for everyone. Third, an entry that applies is not the end: if its value is itself a map that matches nothing, you carry on with the next entry. And because a value is either a file or another map, to any depth, the function calls itself on each nested value, the same shape as the type.

**The solution, line by line.**

- \`let cs = match t { File(f) => return Some(*f), Conds(cs) => cs, };\`: a file is its own answer, so return it at once (the \`*\` copies the \`&'static str\` out of the reference \`f\`). Otherwise keep the list of conditions in \`cs\`.
- \`for (k, v) in cs {\` walks the entries in the order they were written, which is the order that decides priority.
- \`let on = *k == "default" || conds.contains(k);\`: an entry applies if its key is \`"default"\` or one of the importer's active conditions.
- \`if !on { continue; }\` skips an entry that does not apply.
- \`let r = resolve(v, conds);\` resolves the value, which may be a file or a nested map.
- \`if r.is_some() { return r; }\`: a nested answer wins. If the nested map matched nothing, \`r\` is \`None\`, and the loop carries on with the parent's next entry, which is the fall-through rule.
- \`None\` after the loop: nothing applied.

On the tests: \`map_order_wins_not_caller_order\` is TypeScript under \`nodenext\`. Its conditions include \`"types"\`, and the top level of the map has a \`"types"\` key too, for browsers; but \`"node"\` comes first in the map, so the answer is the \`.d.ts\` *inside* \`"node"\`, the types that match the glue Node will really load. In \`a_nested_miss_falls_through\`, \`"node"\` applies but only offers an \`"import"\` file, and the importer used \`require\`, so the loop backs out of \`"node"\` and tries \`"default"\`.

**Common wrong attempts.**

- *Looping over \`conds\` instead of the map.* Then the importer's order decides, and TypeScript, which lists \`"types"\` first, would get the browser's types under Node.
- *Returning the nested result directly* (\`return resolve(v, conds);\`). A nested map that matches nothing then gives \`None\` for the whole lookup, and \`"default"\` is never tried.
- *Forgetting that \`"default"\` always matches.* An importer that sets neither \`"node"\` nor \`"browser"\` then gets nothing at all, where Node would give it the web glue.

The diagram in this chapter runs the same algorithm, in TypeScript, on the real \`package.json\`.`,
    wrong: [
      {
        code: `// A value in an "exports" map: a file,
// or conditions tried in this order.
enum Target {
    File(&'static str),
    Conds(Vec<(&'static str, Target)>),
}
use Target::*;

// The file \`t\` gives an importer whose
// active conditions are \`conds\`.
fn resolve(
    t: &Target,
    conds: &[&str],
) -> Option<&'static str> {
    let cs = match t {
        File(f) => return Some(*f),
        Conds(cs) => cs,
    };
    let want = conds
        .iter()
        .copied()
        .chain(["default"]);
    for c in want {
        for (k, v) in cs {
            if *k != c {
                continue;
            }
            let r = resolve(v, conds);
            if r.is_some() {
                return r;
            }
        }
    }
    None
}`,
        why: 'This tries the importer’s conditions in the importer’s order. TypeScript lists `"types"` first, so it takes the top-level `web.d.ts` and type-checks Node code against the browser glue.',
      },
      {
        code: `// A value in an "exports" map: a file,
// or conditions tried in this order.
enum Target {
    File(&'static str),
    Conds(Vec<(&'static str, Target)>),
}
use Target::*;

// The file \`t\` gives an importer whose
// active conditions are \`conds\`.
fn resolve(
    t: &Target,
    conds: &[&str],
) -> Option<&'static str> {
    let cs = match t {
        File(f) => return Some(*f),
        Conds(cs) => cs,
    };
    for (k, v) in cs {
        let on = *k == "default"
            || conds.contains(k);
        if on {
            return resolve(v, conds);
        }
    }
    None
}`,
        why: 'It commits to the first applicable key. When that nested map has nothing for this importer, the parent’s later keys, here `"default"`, never get a turn.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What happens today if someone runs `npm install viscosity`?',
    options: [
      {
        t: 'They get this book’s compiler, version 0.0.1',
        why: 'The name belongs to someone else; the compiler is `@viscosity/cli`.',
      },
      {
        t: 'npm refuses, because the package doesn’t exist',
        why: 'A package with that name does exist; it just isn’t this one.',
      },
      {
        t: 'They get an unrelated Sass library that owns the name',
        correct: true,
        why: '`npm view viscosity` shows version 0.3.0, “a sass library for fluid containers…”.',
      },
      {
        t: 'They get `@viscosity/cli`, because npm adds the scope',
        why: 'npm never adds a scope by itself; you have to ask for `@viscosity/cli` by name.',
      },
    ],
  },
  {
    q: 'Why couldn’t the CLI be published as it first was, with `bin` pointing at `src/cli.ts`?',
    options: [
      {
        t: 'npm doesn’t accept `.ts` files in a tarball',
        why: 'npm packs them happily; `npm pack --dry-run` listed both.',
      },
      {
        t: 'Node refuses to strip types under `node_modules`, and the core isn’t a declared dependency',
        correct: true,
        why: 'Both showed up when the packed tarball was installed in a scratch folder.',
      },
      {
        t: 'The MIT licence forbids it',
        why: 'MIT allows publishing; bundled code must keep its notices.',
      },
      {
        t: 'Scoped packages can’t have a `bin`',
        why: 'Scoped packages can install commands like any other.',
      },
    ],
  },
  {
    q: 'After bundling, `npx viscosity explain a.js` printed nothing and exited 0. Why?',
    options: [
      {
        t: 'The bundle was empty',
        why: 'It was about 1 MB of code, and the fixed entry used the same bundle.',
      },
      {
        t: 'npx swallows output',
        why: 'npx shows output; the fixed version printed the report.',
      },
      {
        t: 'The file had no `#!/usr/bin/env node` line',
        why: 'Then it wouldn’t have been run by Node at all; it was run, and exited 0.',
      },
      {
        t: 'The main check compares the module URL with `argv[1]`, which is npm’s link, not the real file',
        correct: true,
        why: 'So `main()` is never called. A bin entry that calls `main()` unconditionally fixes it.',
      },
    ],
  },
  {
    q: 'The CLI’s `files` field is `["bin", "dist", "LICENSE", "THIRD_PARTY_LICENSES.txt"]`. Which file is *not* in the published tarball?',
    options: [
      {
        t: '`package.json`',
        why: 'It is always packed, whatever `files` says.',
      },
      {
        t: '`src/cli.ts`',
        correct: true,
        why: 'The TypeScript sources are compiled into `dist/viscosity.mjs`; `src` is not listed, so it stays out.',
      },
      {
        t: '`dist/viscosity.mjs`',
        why: 'It is inside the listed folder `dist`.',
      },
      {
        t: '`THIRD_PARTY_LICENSES.txt`',
        why: 'It is listed by name: a bundle contains other people’s code, so their licences ship with it.',
      },
    ],
  },
  {
    q: 'crates.io answered the sixth crate, `viscosity-wasm`, with HTTP 429. What happened next?',
    options: [
      {
        t: 'All six crates had to be published again under 0.0.2',
        why: 'The first five were fine; and a re-run skips crates already on crates.io.',
      },
      {
        t: 'A re-run about ten minutes later skipped the five already published and published the sixth',
        correct: true,
        why: 'The limit was on creating many *new* crates in a short time, so waiting was enough.',
      },
      {
        t: 'The wasm crate was renamed',
        why: 'Nothing was wrong with its name; 429 means “too many requests”.',
      },
    ],
  },
  {
    q: 'A release fixes a bug without changing the public API. The current version is 1.9.3. What is the next?',
    options: [
      {
        t: '1.9.4',
        correct: true,
        why: 'A backward compatible bug fix bumps PATCH.',
      },
      {
        t: '1.10.0',
        why: 'That’s for a backward compatible new feature.',
      },
      {
        t: '2.0.0',
        why: 'That’s for an incompatible API change.',
      },
      {
        t: '1.9.3, re-published with the fix',
        why: 'A released version must never change, and npm forbids reusing a name and version.',
      },
    ],
  },
  {
    q: 'A project depends on `^0.1.0`. Which release will npm install for it?',
    options: [
      {
        t: '1.0.0',
        why: 'Far outside: caret never crosses the left-most non-zero part.',
      },
      {
        t: '0.2.0',
        why: 'In 0.x the minor number is the breaking one, so `^0.1.0` stops below 0.2.0.',
      },
      {
        t: '0.1.7',
        correct: true,
        why: '`^0.1.0` means at least 0.1.0 and below 0.2.0.',
      },
      {
        t: 'Only exactly 0.1.0',
        why: 'That would be the range `0.1.0` with no caret.',
      },
    ],
  },
  {
    q: 'A new Viscosity release keeps a collection it used to transform. Output is identical, but the program is slower. What does the chapter conclude?',
    options: [
      {
        t: 'It must be a major release by semver’s rules',
        why: 'Semver’s rules are about the declared API. Identical output fits a fix or a feature.',
      },
      {
        t: 'It can’t happen, because the differential tests would fail',
        why: 'Those tests check output and layouts in the corpus, not your program’s speed.',
      },
      {
        t: 'Semver says nothing until the project declares whether decisions are part of its public API',
        correct: true,
        why: 'The numbers only mean something relative to a declared API; deciding that is part of shipping.',
      },
      {
        t: 'It should be a patch, because speed never matters',
        why: 'For an optimiser, speed is the whole point; that’s why it needs deciding.',
      },
    ],
  },
  {
    q: 'Version 1.9.4 gains a new option, and nothing old changes. What is the next version?',
    options: [
      {
        t: '`1.9.5`',
        why: 'A patch is for fixes; a new feature bumps the minor.',
      },
      {
        t: '`1.10.0`',
        correct: true,
        why: 'Minor + 1 (9 + 1 = 10, as a number) and the patch resets to 0.',
      },
      {
        t: '`1.91.0`',
        why: 'That is `\'9\' + 1` as strings. The parts are numbers.',
      },
      {
        t: '`2.0.0`',
        why: 'Nothing broke, so the major stays.',
      },
    ],
  },
  {
    q: 'A project depends on `"@viscosity/cli": "^0.0.1"`, and 0.0.2 is released. What does `npm install` give it?',
    options: [
      {
        t: '0.0.2, because a caret allows newer patches',
        why: 'That is true only from 1.0.0 on. In 0.0.x the caret accepts the exact version and nothing else.',
      },
      {
        t: '0.0.1',
        correct: true,
        why: '`^0.0.1` means at least 0.0.1 and below 0.0.2.',
      },
      {
        t: 'An error: the range is invalid',
        why: 'It is a valid range; it just matches only one version.',
      },
    ],
  },
  {
    q: 'esbuild lists 26 platform packages. How many end up on a typical machine after `npm install`?',
    options: [
      {
        t: 'All 26: npm can’t know which you need',
        why: 'Each declares `os` and `cpu`, and npm compares them with `process.platform` and `process.arch`.',
      },
      {
        t: 'One: the package whose `os` and `cpu` match',
        correct: true,
        why: 'On this book’s Linux x64 machine, only `@esbuild/linux-x64` was installed.',
      },
      {
        t: 'None until the first run downloads one',
        why: 'The binary arrives at install time, as an optional dependency.',
      },
    ],
  },
  {
    q: 'The exports map lists `"node"`, then `"browser"`, then `"types"`, then `"default"`. A bundler building for the web asks with `["browser", "import"]`. What does it get?',
    options: [
      {
        t: 'The nodejs glue, because `"node"` is listed first',
        why: 'Listed first, but not active: `"node"` isn’t among the bundler’s conditions, so it is skipped.',
      },
      {
        t: 'The web glue, through the `"browser"` key',
        correct: true,
        why: 'The first active key in order is `"browser"`, and inside it `"default"` gives `dist/web/viscosity_wasm.js`.',
      },
      {
        t: 'Nothing: `"import"` is not a key in the map',
        why: 'A condition with no key is simply never asked for. Resolution doesn’t require every condition to appear.',
      },
    ],
  },
  {
    q: 'What does the `.wasm` statically linking 71 crates mean for the package?',
    options: [
      {
        t: 'It must include their licence texts',
        correct: true,
        why: 'Their code is inside the file you distribute, so their notices must ship too. `build.mjs` collects them into `THIRD_PARTY_LICENSES.txt`.',
      },
      {
        t: 'Users must install those crates with cargo',
        why: 'Nothing is installed: the crates are compiled into the `.wasm`.',
      },
      {
        t: 'npm lists them as dependencies',
        why: 'npm knows nothing about Rust crates. The package has no runtime dependencies.',
      },
    ],
  },
  {
    q: 'Why does `smoke.mjs` install the packed tarball into an empty folder instead of importing `dist/` directly?',
    options: [
      {
        t: 'To make the test faster',
        why: 'It is slower: it packs and installs first.',
      },
      {
        t: 'Because Node can’t import from `dist/`',
        why: 'It can. The point is to test what a user would get.',
      },
      {
        t: 'To test exactly what a user would get: the `files` list, the exports map and the types',
        correct: true,
        why: 'A file missing from `files` or a wrong export path works in the repository and fails only after installing (the chapter *Shipping Viscosity* found three such bugs).',
      },
    ],
  },
  {
    q: 'Which is a real cost of the WebAssembly route, compared with native binaries?',
    options: [
      {
        t: 'A separate build for each operating system',
        why: 'That is the native route’s cost.',
      },
      {
        t: 'No threads or file access from Rust: `std::thread::spawn` panics on this target',
        correct: true,
        why: 'wasm32-unknown-unknown imports nothing from the host, so the CLI’s parallel builds can’t run in the package. Files are passed in as strings.',
      },
      {
        t: 'Output that can differ from the TS CLI',
        why: 'The smoke test compares 60 programs three ways, and all 60 match once its TypeScript CLI is up to date.',
      },
    ],
  },
];
