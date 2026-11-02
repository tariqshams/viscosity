// Chapter 378 cards. Keys are stable ids: never rename them.

const TYPES = `// A value in an "exports" map: a file,
// or conditions tried in this order.
enum Target {
    File(&'static str),
    Conds(Vec<(&'static str, Target)>),
}
use Target::*;

// The file \`t\` gives an importer whose
// active conditions are \`conds\`.
`;

export const prompts = {
  'native-vs-wasm-what': {
    q: 'What is the choice between **native binaries and WebAssembly** when you ship Rust?',
    a: 'Native: one compiled binary per OS and CPU, fastest, chosen at install. WebAssembly: one `.wasm` for every platform, run inside a JS engine, slower and with no threads or files of its own.',
  },
  'esbuild-26': {
    q: 'How does esbuild get the right native binary onto your machine through npm?',
    a: 'It lists 26 platform packages as `optionalDependencies`. Each declares `os` and `cpu`, and npm installs only the one that matches.',
  },
  'native-cli': {
    q: 'What does the Rust CLI from `cargo build --release` run on?',
    a: 'Only x86-64 Linux with glibc: a 2.8 MB ELF executable. Every other platform needs its own build.',
  },
  'exports-order': {
    q: 'In a conditional `"exports"` map, which entry does Node pick?',
    a: 'The first key, in object order, whose condition is active. `"default"` always matches, so it goes last.',
  },
  'exports-fallthrough': {
    q: 'A nested condition object matches nothing. What does Node do?',
    a: 'It goes back and tries the parent’s remaining keys, like a nested `if` that falls through.',
  },
  'commonjs-marker': {
    q: 'Why does `dist/node` contain a one-line `package.json`, `{ "type": "commonjs" }`?',
    a: 'The package says `"type": "module"`, but the nodejs glue is CommonJS. The nearer `package.json` tells Node how to read the files in that folder.',
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
  'no-bin': {
    q: 'Why does `@viscosity/wasm` have no `bin`, unlike `@viscosity/cli`?',
    a: 'It is a library to import, for tools, editors and browsers. The command is still the TS CLI, or the native binary built from source.',
  },
};

export const examples = {
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

const PKG_TESTS = `// @viscosity/wasm's "." entry.
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
`;

export const exercises = {
  resolve: {
    lang: 'rust',
    title: 'Resolving conditional exports',
    prompt:
      'Write `resolve`, Node’s rule for a conditional `"exports"` value. A `File` is the answer. For `Conds`, try the entries **in the map’s order**: an entry applies if its key is `"default"` or is in `conds`. If it applies, resolve its value; if that gives a file, return it, and if not, carry on with the next entry. Return `None` if nothing matches.',
    starter: `${TYPES}fn resolve(
    t: &Target,
    conds: &[&str],
) -> Option<&'static str> {
    todo!()
}`,
    solution: `${TYPES}fn resolve(
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
    tests: PKG_TESTS,
    hints: [
      'Start with a `match`: a `File(f)` returns `Some(*f)` straight away (the `*` copies the `&\'static str` out of the reference).',
      'Loop over the map’s entries, not over `conds`. The importer’s list says what is active; the map says what to try first.',
      'When an entry applies, don’t just `return resolve(v, conds)`: a nested map can match nothing, and then the next entry of the parent must get its turn.',
    ],
    walkthrough: `This is the rule in Node’s documentation on conditional exports: “key order is significant … earlier entries have higher priority”, “"default" … always matches”, and “if a nested condition does not have any mapping it will continue checking the remaining conditions of the parent condition”.

- **Why map order.** \`map_order_wins_not_caller_order\` is TypeScript under \`nodenext\`. Its conditions include \`"types"\`, and the top level of the map has a \`"types"\` key too, for browsers. But \`"node"\` comes first in the map, so the answer is the \`.d.ts\` *inside* \`"node"\`: the types that match the glue Node will really load.
- **Why fall through.** In \`a_nested_miss_falls_through\`, \`"node"\` applies but only offers an \`"import"\` file, and the importer used \`require\`. Node backs out and tries \`"default"\`. Returning the nested result directly would give \`None\`.
- **Why recursion.** A value is a file or another map, to any depth, so the function has the same shape as the type: a \`match\` and a call on each nested value.

The diagram in this chapter runs the same algorithm, in TypeScript, on the real \`package.json\`.`,
    wrong: [
      {
        code: `${TYPES}fn resolve(
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
        code: `${TYPES}fn resolve(
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
    q: 'esbuild lists 26 platform packages. How many end up on a typical machine after `npm install`?',
    options: [
      { t: 'All 26: npm can’t know which you need', why: 'Each declares `os` and `cpu`, and npm compares them with `process.platform` and `process.arch`.' },
      { t: 'One: the package whose `os` and `cpu` match', correct: true, why: 'On this book’s Linux x64 machine, only `@esbuild/linux-x64` was installed.' },
      { t: 'None until the first run downloads one', why: 'The binary arrives at install time, as an optional dependency.' },
    ],
  },
  {
    q: 'Why does `@viscosity/wasm` need no `os`, `cpu` or platform packages?',
    options: [
      { t: 'Because Rust binaries run on every OS', why: 'Native Rust binaries are per platform: the release CLI is an x86-64 Linux ELF file.' },
      { t: 'Because npm compiles the Rust code during install', why: 'npm runs no compiler; the package ships compiled files.' },
      { t: 'Because WebAssembly is the same file everywhere, and the JS engine runs it', correct: true, why: 'Node or the browser compiles the module for whatever machine it is on.' },
    ],
  },
  {
    q: 'The exports map lists `"node"`, then `"browser"`, then `"types"`, then `"default"`. A bundler building for the web asks with `["browser", "import"]`. What does it get?',
    options: [
      { t: 'The nodejs glue, because `"node"` is listed first', why: 'Listed first, but not active: `"node"` isn’t among the bundler’s conditions, so it is skipped.' },
      { t: 'The web glue, through the `"browser"` key', correct: true, why: 'The first active key in order is `"browser"`, and inside it `"default"` gives `dist/web/viscosity_wasm.js`.' },
      { t: 'Nothing: `"import"` is not a key in the map', why: 'A condition with no key is simply never asked for. Resolution doesn’t require every condition to appear.' },
    ],
  },
  {
    q: 'What does the `.wasm` statically linking 71 crates mean for the package?',
    options: [
      { t: 'It must include their licence texts', correct: true, why: 'Their code is inside the file you distribute, so their notices must ship too. `build.mjs` collects them into `THIRD_PARTY_LICENSES.txt`.' },
      { t: 'Users must install those crates with cargo', why: 'Nothing is installed: the crates are compiled into the `.wasm`.' },
      { t: 'npm lists them as dependencies', why: 'npm knows nothing about Rust crates. The package has no runtime dependencies.' },
    ],
  },
  {
    q: 'Why does `smoke.mjs` install the packed tarball into an empty folder instead of importing `dist/` directly?',
    options: [
      { t: 'To make the test faster', why: 'It is slower: it packs and installs first.' },
      { t: 'Because Node can’t import from `dist/`', why: 'It can. The point is to test what a user would get.' },
      { t: 'To test exactly what a user would get: the `files` list, the exports map and the types', correct: true, why: 'A file missing from `files` or a wrong export path works in the repository and fails only after installing (chapter 272 found three such bugs).' },
    ],
  },
  {
    q: 'Which is a real cost of the WebAssembly route, compared with native binaries?',
    options: [
      { t: 'A separate build for each operating system', why: 'That is the native route’s cost.' },
      { t: 'No threads or file access from Rust: `std::thread::spawn` panics on this target', correct: true, why: 'wasm32-unknown-unknown imports nothing from the host, so the CLI’s parallel builds can’t run in the package. Files are passed in as strings.' },
      { t: 'Output that can differ from the TS CLI', why: 'The smoke test compares 60 programs three ways, and all match.' },
    ],
  },
];
