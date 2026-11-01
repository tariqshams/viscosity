// Chapter 196 cards. Keys are stable ids: never rename them.

const SOL = `// The fixtures parity.rs expects for
// each program (name, ext): its code
// and explain text, with and without
// \`.assume\`. Returns (missing, stale),
// each sorted.
fn check(
    progs: &[(&str, &str)],
    have: &[&str],
) -> (Vec<String>, Vec<String>) {
    // every file the programs need
    let mut w: Vec<String> = Vec::new();
    for (n, e) in progs {
        for v in ["", ".assume"] {
            let b = format!("{n}{v}");
            w.push(format!("{b}.{e}"));
            w.push(b + ".explain.txt");
        }
    }
    let mut missing = Vec::new();
    for x in &w {
        if !have.contains(&x.as_str()) {
            missing.push(x.clone());
        }
    }
    let mut stale = Vec::new();
    for h in have {
        if !w.iter().any(|x| x == h) {
            stale.push(h.to_string());
        }
    }
    missing.sort();
    stale.sort();
    (missing, stale)
}`;

export const prompts = {
  'ci-def': {
    q: 'What does continuous integration add to tests that already pass on your machine?',
    a: 'It runs every check on every change on a fresh machine that has only what the repository installs, so it catches what passes only because of your machine’s state.',
  },
  'ci-npm-ci': {
    q: 'What does `npm ci` do when package-lock.json doesn’t match package.json, and what would `npm install` do?',
    a: '`npm ci` exits with an error (EUSAGE, “not in sync”). `npm install` updates the lockfile instead, which is how the mismatch went unnoticed.',
  },
  'ci-concurrency': {
    q: 'What does `concurrency: { group: workflow-ref, cancel-in-progress: true }` do in ci.yml?',
    a: 'A newer run in the same group (same workflow and branch) cancels the one in progress, so only the latest push is tested.',
  },
  'ci-cache': {
    q: 'What do the two CI caches key on, and what does rust-cache deliberately not cache?',
    a: 'npm’s cache on the hash of each package-lock.json; rust-cache on the rustc version (and more). It doesn’t cache the workspace’s own crates, which are rebuilt each run.',
  },
  'ci-gates': {
    q: 'Name four test binaries that `cargo test --workspace` runs as gates in the engine-rust job.',
    a: 'parity (fixtures, frames, the CLI), differential (node and python3), multi_file (several files, any --jobs), and fuzz (200 programs, seed 1).',
  },
  'ci-clippy': {
    q: 'What does `-- -D warnings` do to `cargo clippy`?',
    a: 'It denies every warning, so any lint makes the job fail. Clippy now suggests `CARGO_BUILD_WARNINGS=deny` instead, which doesn’t invalidate build caches.',
  },
  'ci-fmt': {
    q: 'Is the Rust engine’s formatting checked in CI?',
    a: 'Yes, now: the engine-rust job runs `cargo fmt --all --check` before the tests. At first it had no fmt step, so nothing kept the code formatted.',
  },
  'ci-fixtures': {
    q: 'You changed the TypeScript reference. What must you run before committing, and which test reminds you?',
    a: '`node scripts/gen_expected.mjs`, then `cargo test`. `fixtures_match_the_programs_exactly` fails with “missing …, stale …” if the fixtures don’t match the programs.',
  },
  'ci-runner-state': {
    q: 'Why would the engine-rust job, as first committed, most likely have failed its first real run?',
    a: 'It never ran `npm ci` in engine/ts, but fuzz.rs and multi_file.rs load the TS engine, which needs acorn from engine/ts/node_modules (reproduced locally: Cannot find package ’acorn’). The job runs it now.',
  },
  'ci-honest': {
    q: 'What does this chapter claim about CI runs on GitHub?',
    a: 'Nothing observed: it describes the workflow as committed. Both failures it shows were reproduced locally.',
  },
};

export const examples = {
  'cache-key': {
    lang: 'rust',
    title: 'A cache keyed by the lockfile',
    code: `use std::collections::hash_map::{
    DefaultHasher,
};
use std::collections::HashSet;
use std::hash::{Hash, Hasher};

// A cache key from a lockfile's text,
// as setup-node hashes the lockfile
fn key(lock: &str) -> u64 {
    let mut h = DefaultHasher::new();
    lock.hash(&mut h);
    h.finish()
}

fn main() {
    let old = "acorn 8.19.0\\n\\
        vitest 3.2.4";
    let new = "acorn 8.19.0\\n\\
        esbuild 0.28.2\\nvitest 3.2.4";
    let runs = [
        ("push 1", old),
        ("push 2", old),
        ("push 3, new lock", new),
        ("push 4", new),
    ];
    let mut saved = HashSet::new();
    for (run, lock) in runs {
        let k = key(lock);
        if saved.contains(&k) {
            println!("{run}: hit");
        } else {
            println!("{run}: miss");
            saved.insert(k);
        }
    }
}
`,
  },
};

export const exercises = {
  fixtureCheck: {
    lang: 'rust',
    title: 'Missing and stale fixtures',
    prompt:
      'Write `check(progs, have)`, the fixture-set gate of `parity.rs`. Each program `(name, ext)` needs four files: `name.ext`, `name.explain.txt`, `name.assume.ext` and `name.assume.explain.txt`. Return the files that are needed but not in `have` (missing), and the files in `have` that no program needs (stale), each sorted.',
    starter: `fn check(
    progs: &[(&str, &str)],
    have: &[&str],
) -> (Vec<String>, Vec<String>) {
    todo!()
}`,
    solution: SOL,
    tests: `fn all(name: &str, ext: &str) -> Vec<String> {
    vec![
        format!("{name}.{ext}"),
        format!("{name}.explain.txt"),
        format!("{name}.assume.{ext}"),
        format!("{name}.assume.explain.txt"),
    ]
}

#[test]
fn a_complete_set_is_clean() {
    let fs = all("corpus_basic_soa", "js");
    let have: Vec<&str> =
        fs.iter().map(|s| s.as_str()).collect();
    let r = check(&[("corpus_basic_soa", "js")], &have);
    assert_eq!(r, (vec![], vec![]));
}

#[test]
fn a_forgotten_variant_is_missing() {
    let have = [
        "e2e_heat.js",
        "e2e_heat.explain.txt",
        "e2e_heat.assume.js",
    ];
    let (missing, stale) =
        check(&[("e2e_heat", "js")], &have);
    assert_eq!(missing, ["e2e_heat.assume.explain.txt"]);
    assert!(stale.is_empty());
}

#[test]
fn a_deleted_program_leaves_stale_files() {
    let mut fs = all("corpus_a", "js");
    fs.extend(all("corpus_gone", "js"));
    let have: Vec<&str> =
        fs.iter().map(|s| s.as_str()).collect();
    let (missing, stale) =
        check(&[("corpus_a", "js")], &have);
    assert!(missing.is_empty());
    assert_eq!(
        stale,
        [
            "corpus_gone.assume.explain.txt",
            "corpus_gone.assume.js",
            "corpus_gone.explain.txt",
            "corpus_gone.js",
        ]
    );
}

#[test]
fn python_programs_use_py() {
    let (missing, _) =
        check(&[("pycorpus_x", "py")], &[]);
    assert_eq!(
        missing,
        [
            "pycorpus_x.assume.explain.txt",
            "pycorpus_x.assume.py",
            "pycorpus_x.explain.txt",
            "pycorpus_x.py",
        ]
    );
}

#[test]
fn both_lists_are_sorted() {
    let have = ["z_old.js", "a_old.js"];
    let (missing, stale) = check(
        &[("b", "js"), ("a", "js")],
        &have,
    );
    let mut m = missing.clone();
    m.sort();
    assert_eq!(missing, m);
    assert_eq!(stale, ["a_old.js", "z_old.js"]);
}
`,
    hints: [
      'First build the list of wanted names: for each program and each variant `""` and `".assume"`, a code file and an explain file.',
      'Missing: wanted names not in `have` (`have.contains(&x.as_str())`). Stale: names in `have` that no wanted name equals.',
      'Sort both lists before returning them, so the message is the same on every machine.',
    ],
    walkthrough: `\`fixtures_match_the_programs_exactly\` in \`engine/rust/crates/cli/tests/parity.rs\` does this with two \`BTreeSet\`s (sets that keep their items sorted) and \`difference\`, plus the \`.frames.txt\` files of the programs gen_expected.mjs lists.

- **Why check the folder at all.** The parity test reads the fixture of every program it knows. A fixture whose program was deleted is never read, so without this check it would sit there, stale, forever. A program added without running gen_expected.mjs fails in the parity test anyway, but this gate says *which command* fixes it.
- **Why both variants.** Every program is compiled with default options and with \`--bounds assume\`, so it has four files. Forgetting \`.assume\` makes every assume fixture look stale.
- **Why the extension.** Python programs’ code fixtures end in \`.py\`; the explain fixtures are \`.explain.txt\` for both languages.
- **Why sort.** A CI failure message should be the same on every run and every machine, so the lists are sorted rather than left in directory order.`,
    wrong: [
      {
        code: SOL.replace('for v in ["", ".assume"] {', 'for v in [""] {'),
        why: 'Each program is compiled in two variants. Without `.assume`, its assume fixtures are reported as stale and never required.',
      },
      {
        code: SOL.replace('    missing.sort();\n    stale.sort();\n', ''),
        why: 'The lists come out in the order of the input, not sorted, so the message changes with the order the folder is read in.',
      },
      {
        code: SOL.replace('w.push(format!("{b}.{e}"));', 'w.push(format!("{b}.js"));'),
        why: 'Python programs’ code fixtures end in `.py`. Use the program’s own extension.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A lockfile is out of sync with package.json. What happens on the CI runner?',
    options: [
      { t: '`npm ci` updates the lockfile and continues', why: 'That is what `npm install` does; `npm ci` never writes the lockfile.' },
      { t: '`npm ci` exits with an error before installing anything', correct: true, why: 'Reproduced with npm 10.9.9: EUSAGE, “Missing: @viscosity/cli@0.1.0 from lock file”.' },
      { t: 'It installs whatever package.json asks for', why: 'An install that ignores the lock would defeat the point of `npm ci`.' },
    ],
  },
  {
    q: 'You push twice to the same branch a minute apart. What does ci.yml’s `concurrency` setting do?',
    options: [
      { t: 'Runs both, one after the other', why: 'With cancel-in-progress, the first is cancelled.' },
      { t: 'Cancels the run for the first push', correct: true, why: 'Same group (workflow and ref), and `cancel-in-progress: true`.' },
      { t: 'Merges them into one run', why: 'Runs are never merged; the newer one replaces the older.' },
    ],
  },
  {
    q: 'Which of these does the committed workflow NOT run?',
    options: [
      { t: 'Clippy with warnings denied', why: 'The engine-rust and drip jobs run it.' },
      { t: 'The wasm32 build of viscosity-wasm', why: 'The engine-rust job builds it.' },
      { t: 'A long fuzzing campaign (20,000 programs)', correct: true, why: 'Only the 200-program run inside `cargo test` happens in CI; long campaigns are run by hand.' },
      { t: '`cargo fmt --check`', why: 'The engine-rust job runs `cargo fmt --all --check` (it was added after this chapter was first written).' },
    ],
  },
  {
    q: 'Why does the Rust parity half of CI not need the TypeScript engine installed?',
    options: [
      { t: 'The TypeScript output is committed as fixtures in tests/expected', correct: true, why: 'gen_expected.mjs writes them; the gate only compares bytes.' },
      { t: 'The Rust job compiles the TypeScript engine to Rust', why: 'Nothing like that happens.' },
      { t: 'Parity is skipped in CI', why: 'It runs in `cargo test --workspace`.' },
    ],
  },
  {
    q: 'With engine/ts/node_modules removed, which tests fail in `cargo test -p viscosity-cli`?',
    options: [
      { t: 'The parity tests', why: 'They read committed fixtures and need no node packages.' },
      { t: 'The node differential test', why: 'It uses its own copy of the runner, tests/run_isolated.cjs, with no dependencies.' },
      { t: 'The fuzz test and the TypeScript half of multi_file', correct: true, why: 'Both load the TS engine, which imports acorn.' },
    ],
  },
  {
    q: 'What does `Swatinem/rust-cache` save between runs?',
    options: [
      { t: 'Everything in target/, including the workspace’s own crates', why: 'It deliberately leaves the workspace crates out.' },
      { t: '~/.cargo and the compiled dependencies in target/', correct: true, why: 'Keyed by the rustc version among other things.' },
      { t: 'Only the test results', why: 'It caches build inputs and outputs, not results.' },
    ],
  },
];
