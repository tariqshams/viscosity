// Chapter 384b cards. Keys are stable ids: never rename them.

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
  'gt-skip': {
    q: 'A step of a CI job fails. What happens to the job’s later steps, and to the other jobs?',
    a: 'The later steps of that job are skipped and the job is red; the other jobs run on, since none depends on another.',
  },
  'gt-new-kind': {
    q: 'Why can a mistake pass every gate?',
    a: 'Each gate catches only what it was written to look for. A new kind of mistake needs a new gate, as the fuzz bugs needed the fuzzer.',
  },
  'gt-fmt': {
    q: 'What does `cargo fmt --all --check` do, and why is it the first gate of the Rust job?',
    a: 'It exits with 1 (and prints the difference) if rustfmt would change any file, without changing it. It is the fastest gate, so a formatting slip costs seconds.',
  },
  'gt-tests': {
    q: 'What does each hold together: parity, the differential test, `multi_file`?',
    a: 'Parity: the Rust engine to the TypeScript engine’s committed output. Differential: compiled programs to the originals, under node and CPython. multi_file: the parallel CLI to one fixed output order.',
  },
  'gt-clippy': {
    q: 'What does `-- -D warnings` change about Clippy?',
    a: 'Every lint warning becomes an error, so the job fails on code that compiles but that Clippy would warn about.',
  },
  'gt-fixtures': {
    q: 'Why does the Rust half of parity need no TypeScript to run, and what is the price?',
    a: 'The TypeScript output is committed as fixtures in tests/expected. The price: after changing the reference, run gen_expected.mjs and commit the new fixtures.',
  },
  'gt-book': {
    q: 'Name three things the book job checks.',
    a: 'Any three of: the chapter rules (citations, budget, prompts, quiz, line widths, exercises), the book’s unit tests, the build, every internal link, and a phone-sized smoke test that uses the pages and both Playground engines.',
  },
  'gt-pack': {
    q: 'Why does the engine-ts job install the packed CLI in an empty folder instead of running it from the repository?',
    a: 'To test what a user would download from npm: a file missing from the package shows up only when the tarball is installed on its own.',
  },
};

export const examples = {
  'ci-job': {
    lang: 'rust',
    title: 'Steps in order, the first failure skips the rest',
    code: `// A CI job: steps run in order, and the
// first step that fails skips the rest.
fn job(steps: &[(&str, bool)]) -> bool {
    let mut ok = true;
    for &(name, passes) in steps {
        if !ok {
            println!("  - {name}");
        } else if passes {
            println!("  ✓ {name}");
        } else {
            println!("  X {name}");
            ok = false;
        }
    }
    ok
}

fn main() {
    // the book job of 2 November
    let book = [
        ("Install", true),
        ("Check chapters", false),
        ("Test", true),
        ("Merge new references", true),
        ("Build", true),
        ("Smoke test", true),
    ];
    println!("book");
    let ok = job(&book);
    if ok {
        println!("the job is green");
    } else {
        println!("the job is red");
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
    walkthrough: `**How to think about it.** This is \`fixtures_match_the_programs_exactly\` in \`engine/rust/crates/cli/tests/parity.rs\`, without the frames and profile fixtures. The question has two halves, and they are mirror images. *Missing*: files the programs need that are not in the folder. *Stale*: files in the folder that no program needs. Both are "in one list but not the other", so first build the list of needed files, then compare it with \`have\` in each direction. Do one by hand: the program \`("e2e_heat", "js")\` needs \`e2e_heat.js\`, \`e2e_heat.explain.txt\`, \`e2e_heat.assume.js\` and \`e2e_heat.assume.explain.txt\`.

**The solution, line by line.**

- \`fn check(progs: &[(&str, &str)], have: &[&str]) -> (Vec<String>, Vec<String>) {\` takes the programs as (name, extension) pairs and the file names in the folder, and returns the two lists.
- \`let mut w: Vec<String> = Vec::new();\` will hold every wanted file name.
- \`for (n, e) in progs {\` takes each program's name and extension.
- \`for v in ["", ".assume"] {\` covers the two variants every program is compiled in: default options, and \`--bounds assume\`.
- \`let b = format!("{n}{v}");\` is the base name, \`e2e_heat\` or \`e2e_heat.assume\`.
- \`w.push(format!("{b}.{e}"));\` wants the compiled code, with the program's own extension (\`.py\` for Python).
- \`w.push(b + ".explain.txt");\` wants the explain text (\`b + ...\` moves \`b\` into the new string, which is fine, since we are done with it).
- \`for x in &w { if !have.contains(&x.as_str()) { missing.push(x.clone()); } }\` collects the wanted names the folder lacks.
- \`for h in have { if !w.iter().any(|x| x == h) { stale.push(h.to_string()); } }\` collects the folder's names nobody wants.
- \`missing.sort(); stale.sort();\` puts both in a fixed order, so the failure message is the same on every machine, whatever order the folder was read in.
- \`(missing, stale)\` returns the pair. The real test uses two \`BTreeSet\`s (sets that keep their items sorted) and \`difference\`, which does the same in fewer lines.

**Common wrong attempts.**

- **One variant only.** Looping over \`[""]\` forgets the \`.assume\` fixtures: they are never required, and every one of them is reported as stale.
- **No sorting.** The lists come out in input order, so the same failure prints differently depending on the order the directory was read in.
- **A fixed extension.** \`format!("{b}.js")\` asks Python programs for \`.js\` fixtures they never had, and reports their real \`.py\` fixtures as stale.`,
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
    q: 'Which of these does the committed workflow NOT run?',
    options: [
      { t: 'Clippy with warnings denied', why: 'The engine-rust and drip jobs run it.' },
      { t: 'A long fuzzing campaign of 20,000 programs', correct: true, why: 'Only the 200-program run inside `cargo test` happens in CI; long campaigns are run by hand.' },
      { t: 'The wasm32 build of viscosity-wasm', why: 'The engine-rust job builds it.' },
      { t: '`cargo fmt --check`', why: 'It is the first gate of the engine-rust job.' },
    ],
  },
  {
    q: 'Why does the Rust parity half of CI not need the TypeScript engine to run?',
    options: [
      { t: 'The Rust job compiles the TypeScript engine to Rust', why: 'Nothing like that happens.' },
      { t: 'Parity is skipped in CI', why: 'It runs in `cargo test --workspace`.' },
      { t: 'The TypeScript output is committed as fixtures in tests/expected', correct: true, why: 'gen_expected.mjs writes them; the gate only compares bytes.' },
    ],
  },
  {
    q: 'A program was deleted from the corpus, but its four fixtures were left in tests/expected. What happens?',
    options: [
      { t: 'Nothing: no test reads them', why: 'That is why the fixture-set check exists; without it they would sit there for ever.' },
      { t: '`fixtures_match_the_programs_exactly` fails and lists them as stale', correct: true, why: 'It compares the folder with the program list in both directions.' },
      { t: 'The parity test fails on them', why: 'Parity reads the fixtures of programs that exist; it never opens these.' },
    ],
  },
  {
    q: 'On 1 November the smoke test failed with “no horizontal overflow at 440px”. What had gone wrong?',
    options: [
      { t: 'Two pages were wider than a phone’s screen', correct: true, why: 'The bibliography and one chapter scrolled sideways at 440 pixels.' },
      { t: 'The site did not build', why: 'The build step had passed; the smoke test runs on the built site.' },
      { t: 'A link pointed to a missing page', why: 'That is what Check site links looks for.' },
    ],
  },
  {
    q: 'Adding a new gate to a workflow can…',
    options: [
      { t: 'let through a mistake that an existing gate used to catch', why: 'Every old gate still runs; a mistake escapes only if every gate misses it.' },
      { t: 'only catch more mistakes (or the same ones), at the cost of a longer run', correct: true, why: 'The set of escaping mistakes can only shrink.' },
      { t: 'make the other jobs skip their steps', why: 'Jobs are independent; only steps after a failure in the same job are skipped.' },
    ],
  },
];
