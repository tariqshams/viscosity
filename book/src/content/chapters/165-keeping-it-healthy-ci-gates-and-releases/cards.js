// Chapter 165 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from the old chapters Keeping it healthy, The gates: what each check protects, and Release engineering.

export const prompts = {
  'ci-npm-ci': {
    q: 'What does `npm ci` do when package-lock.json and package.json disagree, and how is that different from `npm install`?',
    a: '`npm ci` exits with an error and installs nothing; `npm install` updates the lockfile to match.',
  },
  'ci-def': {
    q: 'What does continuous integration add to tests that already pass on your machine?',
    a: 'It runs them on every change on a fresh machine that has only what the repository installs, so it catches what passed only because of something your machine had.',
  },
  'ci-concurrency': {
    q: 'In GitHub Actions, what does `concurrency: { group: workflow-ref, cancel-in-progress: true }` do when you push twice quickly to the same branch?',
    a: 'Both runs are in the same group, so the newer one cancels the run still in progress for the first push.',
  },
  'ci-cache': {
    q: 'A CI cache is keyed by a hash of package-lock.json (as `actions/setup-node` does). Why does a changed lockfile mean a fresh npm download on the next run?',
    a: 'setup-node’s cache key includes a hash of the lockfile, so a changed lockfile gives a new key, which misses.',
  },
  'gt-skip': {
    q: 'In GitHub Actions, a step of one job fails. What happens to that job’s later steps, and to the workflow’s other jobs?',
    a: 'The later steps of that job are skipped and the job is red; the other jobs run on, since none depends on another.',
  },
  'gt-new-kind': {
    q: 'Why can a mistake pass every gate?',
    a: 'Each gate catches only what it was written to look for. A new kind of mistake needs a new gate, as the fuzz bugs needed the fuzzer.',
  },
  'publish-permanent': {
    q: 'Why is publishing the step of a release to be most careful with, on crates.io and npm?',
    a: 'It can’t be undone: a crates.io version can never be overwritten or deleted, and an npm name and version can never be reused, even after unpublishing.',
  },
  'skip-published': {
    q: 'Why does `scripts/release.sh` ask crates.io whether each crate’s version exists before running `cargo publish`?',
    a: 'So a run that stopped partway can be repeated: what is already published is skipped (HTTP 200), and only the rest is uploaded.',
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
        ("Check site links", true),
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
  cancelledRuns: {
    lang: 'rust',
    title: 'Which runs finish?',
    prompt: 'Write `finished(pushes, d)`. Each push is `(minute, branch)`, in the order they arrived, and starts a CI run that takes `d` minutes. As in ci.yml (one concurrency group per branch, `cancel-in-progress: true`), a run is cancelled if a later push to the *same* branch arrives while it is still running, that is, before minute `t + d`. A push that arrives exactly at `t + d` is too late to cancel it. Return the indexes of the runs that finish, in order.',
    starter: `fn finished(
    pushes: &[(u32, &str)],
    d: u32,
) -> Vec<usize> {
    todo!()
}`,
    solution: `// Which runs finish? Each push is (the
// minute it arrives, its branch), and
// every run takes d minutes. A newer
// push to the same branch, arriving
// while a run is still going, cancels
// it. Returns the finished runs.
fn finished(
    pushes: &[(u32, &str)],
    d: u32,
) -> Vec<usize> {
    let mut out = Vec::new();
    for (i, &(t, r)) in
        pushes.iter().enumerate()
    {
        let later = &pushes[i + 1..];
        let cut = later
            .iter()
            .any(|&(u, q)| {
                q == r && u < t + d
            });
        if !cut {
            out.push(i);
        }
    }
    out
}`,
    tests: `#[test]
fn one_push_finishes() {
    assert_eq!(finished(&[(0, "main")], 5), [0]);
}

#[test]
fn pushes_far_apart_both_finish() {
    let p = [(0, "main"), (10, "main")];
    assert_eq!(finished(&p, 5), [0, 1]);
}

#[test]
fn a_quick_second_push_cancels_the_first() {
    let p = [(0, "main"), (2, "main")];
    assert_eq!(finished(&p, 5), [1]);
}

#[test]
fn other_branches_do_not_cancel() {
    let p = [(0, "main"), (1, "fix")];
    assert_eq!(finished(&p, 5), [0, 1]);
}

#[test]
fn only_the_last_of_a_burst_finishes() {
    let p = [(0, "m"), (1, "m"), (2, "m")];
    assert_eq!(finished(&p, 5), [2]);
}

#[test]
fn a_push_after_another_branch_still_cancels() {
    let p = [(0, "m"), (1, "f"), (2, "m")];
    assert_eq!(finished(&p, 5), [1, 2]);
}

#[test]
fn arriving_as_it_ends_is_too_late() {
    let p = [(0, "m"), (5, "m")];
    assert_eq!(finished(&p, 5), [0, 1]);
}
`,
    hints: [
      'Decide for each run on its own: what would have to happen later for it to be cancelled?',
      'Run `i`, started at `t` on branch `r`, is cancelled if some later push `(u, q)` has `q == r` and `u < t + d`. Look at every later push, not only the next one.',
      'Loop over `pushes.iter().enumerate()`, take the slice `&pushes[i + 1..]`, use `.any(...)` with that test, and push `i` when it is false.',
    ],
    walkthrough: `**How to think about it.** The rule is about each run separately: run \`i\` finishes unless something later kills it. So for every run, look at the pushes that came after it, and ask whether any of them is on the same branch and arrived before the run was done. Work one example by hand: pushes at minutes 0 (main), 1 (fix) and 2 (main), with runs of 5 minutes. The run for minute 0 is still going at minute 2, when another main push arrives, so it is cancelled; the fix run has no later fix push, so it finishes; the last main run has nothing after it. The answer is runs 1 and 2.

**The solution, line by line.**

- \`fn finished(pushes: &[(u32, &str)], d: u32) -> Vec<usize> {\` borrows the list of pushes, each a pair of an arrival minute and a branch name, and returns the indexes of the runs that finish.
- \`let mut out = Vec::new();\` collects the answer.
- \`for (i, &(t, r)) in pushes.iter().enumerate() {\` walks the pushes with their index \`i\`; the pattern \`&(t, r)\` takes the pair apart into its minute and branch.
- \`let later = &pushes[i + 1..];\` is the slice of every push after this one (it is empty for the last push, which is fine).
- \`let cut = later.iter().any(|&(u, q)| { q == r && u < t + d });\` asks whether any later push is on the same branch and arrived before minute \`t + d\`, while run \`i\` was still going. The strict \`<\` makes a push at exactly \`t + d\` too late.
- \`if !cut { out.push(i); }\` keeps the runs nothing cancelled.
- \`out\` is the answer, already in order because we walked the pushes in order.

**Common wrong attempts.**

- **Ignoring the branch.** Without \`q == r\`, a push to \`fix\` cancels a run on \`main\`; GitHub's group is the workflow and the branch, so it never does.
- **Looking only at the next push.** Comparing with \`pushes[i + 1]\` alone misses a main push that comes after a fix push, as in the example above.
- **\`<=\` instead of \`<\`.** A run that finishes at minute 5 is not cancelled by a push at minute 5; with \`<=\` it would be.`,
    wrong: [
      {
        code: `// Which runs finish? Each push is (the
// minute it arrives, its branch), and
// every run takes d minutes. A newer
// push to the same branch, arriving
// while a run is still going, cancels
// it. Returns the finished runs.
fn finished(
    pushes: &[(u32, &str)],
    d: u32,
) -> Vec<usize> {
    let mut out = Vec::new();
    for (i, &(t, r)) in
        pushes.iter().enumerate()
    {
        let later = &pushes[i + 1..];
        let cut = later
            .iter()
            .any(|&(u, q)| {
                u < t + d
            });
        if !cut {
            out.push(i);
        }
    }
    out
}`,
        why: 'It ignores the branch, so a push to `fix` cancels a run on `main`.',
      },
      {
        code: `// Which runs finish? Each push is (the
// minute it arrives, its branch), and
// every run takes d minutes. A newer
// push to the same branch, arriving
// while a run is still going, cancels
// it. Returns the finished runs.
fn finished(
    pushes: &[(u32, &str)],
    d: u32,
) -> Vec<usize> {
    let mut out = Vec::new();
    for (i, &(t, r)) in
        pushes.iter().enumerate()
    {
        let j = pushes.len().min(i + 2);
        let later = &pushes[i + 1..j];
        let cut = later
            .iter()
            .any(|&(u, q)| {
                q == r && u < t + d
            });
        if !cut {
            out.push(i);
        }
    }
    out
}`,
        why: 'It looks only at the next push, so a main push after a fix push does not cancel the earlier main run.',
      },
      {
        code: `// Which runs finish? Each push is (the
// minute it arrives, its branch), and
// every run takes d minutes. A newer
// push to the same branch, arriving
// while a run is still going, cancels
// it. Returns the finished runs.
fn finished(
    pushes: &[(u32, &str)],
    d: u32,
) -> Vec<usize> {
    let mut out = Vec::new();
    for (i, &(t, r)) in
        pushes.iter().enumerate()
    {
        let later = &pushes[i + 1..];
        let cut = later
            .iter()
            .any(|&(u, q)| {
                q == r && u <= t + d
            });
        if !cut {
            out.push(i);
        }
    }
    out
}`,
        why: 'A push that arrives exactly as the run ends is counted as cancelling it.',
      },
    ],
  },
  fixtureCheck: {
    optional: true,
    lang: 'rust',
    title: 'Missing and stale fixtures',
    prompt: 'Write `check(progs, have)`, the fixture-set gate of `parity.rs`. Each program `(name, ext)` needs four files: `name.ext`, `name.explain.txt`, `name.assume.ext` and `name.assume.explain.txt`. Return the files that are needed but not in `have` (missing), and the files in `have` that no program needs (stale), each sorted.',
    starter: `fn check(
    progs: &[(&str, &str)],
    have: &[&str],
) -> (Vec<String>, Vec<String>) {
    todo!()
}`,
    solution: `// The fixtures parity.rs expects for
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
}`,
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
        code: `// The fixtures parity.rs expects for
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
        for v in [""] {
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
}`,
        why: 'Each program is compiled in two variants. Without `.assume`, its assume fixtures are reported as stale and never required.',
      },
      {
        code: `// The fixtures parity.rs expects for
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
    (missing, stale)
}`,
        why: 'The lists come out in the order of the input, not sorted, so the message changes with the order the folder is read in.',
      },
      {
        code: `// The fixtures parity.rs expects for
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
            w.push(format!("{b}.js"));
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
}`,
        why: 'Python programs’ code fixtures end in `.py`. Use the program’s own extension.',
      },
    ],
  },
  semver: {
    optional: true,
    lang: 'rust',
    title: 'Cargo’s version arithmetic',
    prompt: 'Write `next(v, c)`: the version after `v` for a change `c`. From 1.0.0 on, `Break` bumps the major number, `Feat` the minor and `Fix` the patch, and the parts to the right reset to 0. In `0.y.z`, `Break` bumps y and resets z, and `Feat` and `Fix` bump z. In `0.0.z`, every change bumps z. Then write `accepts(req, v)`: does Cargo’s default (caret) requirement `req` accept `v`? It must have the same left-most non-zero part (for `0.0.z`, the same everything) and not be older than `req`.',
    starter: `#[derive(Clone, Copy)]
enum Change {
    Break, // breaks the public API
    Feat,  // adds, breaks nothing
    Fix,   // fixes a bug
}
use Change::*;

// "1.4.2" -> (1, 4, 2)
fn parts(v: &str) -> (u64, u64, u64) {
    let n: Vec<u64> = v
        .split('.')
        .map(|p| p.parse().unwrap())
        .collect();
    (n[0], n[1], n[2])
}

// The version after \`v\` for change \`c\`.
fn next(v: &str, c: Change) -> String {
    todo!()
}

// Does the requirement \`req\` (Cargo's
// default, a caret) accept version \`v\`?
fn accepts(req: &str, v: &str) -> bool {
    todo!()
}`,
    solution: `#[derive(Clone, Copy)]
enum Change {
    Break, // breaks the public API
    Feat,  // adds, breaks nothing
    Fix,   // fixes a bug
}
use Change::*;

// "1.4.2" -> (1, 4, 2)
fn parts(v: &str) -> (u64, u64, u64) {
    let n: Vec<u64> = v
        .split('.')
        .map(|p| p.parse().unwrap())
        .collect();
    (n[0], n[1], n[2])
}

// The version after \`v\` for change \`c\`.
fn next(v: &str, c: Change) -> String {
    let (x, y, z) = parts(v);
    let (x, y, z) = match (x, y, c) {
        (0, 0, _) => (0, 0, z + 1),
        (0, _, Break) => (0, y + 1, 0),
        (0, _, _) => (0, y, z + 1),
        (_, _, Break) => (x + 1, 0, 0),
        (_, _, Feat) => (x, y + 1, 0),
        (_, _, Fix) => (x, y, z + 1),
    };
    format!("{x}.{y}.{z}")
}

// Does the requirement \`req\` (Cargo's
// default, a caret) accept version \`v\`?
fn accepts(req: &str, v: &str) -> bool {
    let a = parts(req);
    let b = parts(v);
    let (p, q, _) = b;
    let same = match a {
        (0, 0, _) => a == b,
        (0, y, _) => p == 0 && q == y,
        (x, _, _) => p == x,
    };
    same && b >= a
}`,
    tests: `#[test]
fn from_one_point_oh_on() {
    let v = "1.4.2";
    assert_eq!(next(v, Fix), "1.4.3");
    assert_eq!(next(v, Feat), "1.5.0");
    assert_eq!(next(v, Break), "2.0.0");
}

#[test]
fn zero_point_y() {
    let v = "0.1.0";
    assert_eq!(next(v, Break), "0.2.0");
    assert_eq!(next(v, Feat), "0.1.1");
    assert_eq!(next("0.1.7", Fix), "0.1.8");
}

#[test]
fn zero_zero_is_always_major() {
    for c in [Break, Feat, Fix] {
        // Viscosity today
        assert_eq!(next("0.0.1", c), "0.0.2");
        assert_eq!(next("0.0.3", c), "0.0.4");
    }
}

#[test]
fn caret_accepts_compatible() {
    assert!(accepts("0.1.0", "0.1.9"));
    assert!(!accepts("0.1.0", "0.2.0"));
    assert!(accepts("1.2.0", "1.9.0"));
    assert!(!accepts("1.2.0", "2.0.0"));
    assert!(!accepts("0.0.3", "0.0.4"));
    assert!(!accepts("0.0.1", "0.0.2"));
}

#[test]
fn never_an_older_version() {
    assert!(!accepts("0.1.5", "0.1.4"));
    assert!(!accepts("1.2.0", "1.1.9"));
}

#[test]
fn every_bump_is_judged_right() {
    for v in ["0.0.3", "0.1.4", "2.3.4"] {
        let b = next(v, Break);
        assert!(!accepts(v, &b), "{v}");
        let ok = !v.starts_with("0.0");
        for c in [Feat, Fix] {
            let n = next(v, c);
            assert_eq!(accepts(v, &n), ok);
        }
    }
}
`,
    hints: [
      'Match on a tuple, `match (x, y, c)`, with the most specific cases first: `(0, 0, _)`, then `(0, _, Break)`, then `(0, _, _)`, then the three 1.0-and-later cases.',
      'For `accepts`, decide “same series” with a `match` on `parts(req)`: `(0, 0, _)` needs all three equal, `(0, y, _)` needs major 0 and minor y, `(x, _, _)` needs major x.',
      'Tuples compare left to right, so `parts(v) >= parts(req)` says “not older”. Without it, `0.1.4` would satisfy a requirement of `0.1.5`.',
    ],
    walkthrough: `**How to think about it.** Both functions come from one rule in the Cargo book: a caret requirement accepts versions whose *left-most non-zero part* is the same, and that are not older. So before writing code, find the left-most non-zero part of a few versions by hand. In \`1.4.2\` it is the 1 (the major number); in \`0.1.7\` it is the 1 in the middle; in \`0.0.3\` it is the 3 at the end. A breaking change must change that part (so that old requirements stop accepting it), and a compatible change must change something to its right, if there is anything to its right.

That gives three regimes, and the code is a \`match\` with one group of arms for each: from 1.0 on, the usual major/minor/patch; in \`0.y.z\`, y plays the major part and z everything else; in \`0.0.z\`, z is the only part there is, so every change bumps it.

**The solution, line by line (\`next\`).**

- \`let (x, y, z) = parts(v);\` splits \`"1.4.2"\` into the numbers \`(1, 4, 2)\`, using the helper from the preamble.
- \`let (x, y, z) = match (x, y, c) {\` matches on a tuple of the two numbers that decide the regime and the kind of change. The new numbers shadow the old ones (a new \`let\` with the same names), which keeps the last line short.
- \`(0, 0, _) => (0, 0, z + 1),\` is 0.0.z: whatever the change (\`_\` matches any), bump z.
- \`(0, _, Break) => (0, y + 1, 0),\` is a break in 0.y.z: bump y, and reset z to 0, because z counts changes since that y.
- \`(0, _, _) => (0, y, z + 1),\` is a feature or fix in 0.y.z: bump z.
- \`(_, _, Break) => (x + 1, 0, 0),\`, \`(_, _, Feat) => (x, y + 1, 0),\` and \`(_, _, Fix) => (x, y, z + 1),\` are the 1.0 rules, with everything to the right of the bumped part reset to 0.
- \`format!("{x}.{y}.{z}")\` joins them back into a string.

The order of the arms matters: \`match\` takes the first arm that fits, and \`(0, 0, _)\` would also fit \`(0, _, Break)\`, so the most specific arm comes first.

**The solution, line by line (\`accepts\`).**

- \`let a = parts(req); let b = parts(v);\` gives both versions as tuples.
- \`let (p, q, _) = b;\` names the candidate's major and minor numbers.
- \`let same = match a {\` decides whether \`v\` is in the same series as \`req\`: for \`(0, 0, _)\` all three parts must be equal (\`a == b\`), for \`(0, y, _)\` the candidate must be \`0.y.something\`, and for \`(x, _, _)\` it must have the same major number.
- \`same && b >= a\` adds the lower bound. Rust compares tuples left to right, which for numbers is exactly version order, so \`(0, 1, 4) >= (0, 1, 5)\` is false.

**Common wrong attempts.**

- Applying the 1.0 rules everywhere. A break at 0.1.0 then becomes 1.0.0 and a feature 0.2.0, which is the opposite of what Cargo's users expect: anyone on \`"0.1"\` would miss a harmless feature and could be handed a break.
- Forgetting to reset the parts on the right: 1.4.2 plus a feature becomes 1.5.2, which claims two fixes that 1.5 never had.
- Checking the series but not the lower bound, so that \`0.1.4\` satisfies a requirement of \`"0.1.5"\`; a user who asked for a fix in 0.1.5 would not get it.`,
    wrong: [
      {
        code: `#[derive(Clone, Copy)]
enum Change {
    Break, // breaks the public API
    Feat,  // adds, breaks nothing
    Fix,   // fixes a bug
}
use Change::*;

// "1.4.2" -> (1, 4, 2)
fn parts(v: &str) -> (u64, u64, u64) {
    let n: Vec<u64> = v
        .split('.')
        .map(|p| p.parse().unwrap())
        .collect();
    (n[0], n[1], n[2])
}

// The version after \`v\` for change \`c\`.
fn next(v: &str, c: Change) -> String {
    let (x, y, z) = parts(v);
    let (x, y, z) = match c {
        Break => (x + 1, 0, 0),
        Feat => (x, y + 1, 0),
        Fix => (x, y, z + 1),
    };
    format!("{x}.{y}.{z}")
}

// Does the requirement \`req\` (Cargo's
// default, a caret) accept version \`v\`?
fn accepts(req: &str, v: &str) -> bool {
    let a = parts(req);
    let b = parts(v);
    a.0 == b.0 && b >= a
}`,
        why: 'This applies the 1.0 rules to every version. For a crate at 0.1.0, a breaking change would become 1.0.0, and a feature 0.2.0, which Cargo users of `"0.1"` would never get.',
      },
      {
        code: `#[derive(Clone, Copy)]
enum Change {
    Break, // breaks the public API
    Feat,  // adds, breaks nothing
    Fix,   // fixes a bug
}
use Change::*;

// "1.4.2" -> (1, 4, 2)
fn parts(v: &str) -> (u64, u64, u64) {
    let n: Vec<u64> = v
        .split('.')
        .map(|p| p.parse().unwrap())
        .collect();
    (n[0], n[1], n[2])
}

// The version after \`v\` for change \`c\`.
fn next(v: &str, c: Change) -> String {
    let (x, y, z) = parts(v);
    let (x, y, z) = match (x, y, c) {
        (0, 0, _) => (0, 0, z + 1),
        (0, _, Break) => (0, y + 1, 0),
        (0, _, _) => (0, y, z + 1),
        (_, _, Break) => (x + 1, y, z),
        (_, _, Feat) => (x, y + 1, z),
        (_, _, Fix) => (x, y, z + 1),
    };
    format!("{x}.{y}.{z}")
}

// Does the requirement \`req\` (Cargo's
// default, a caret) accept version \`v\`?
fn accepts(req: &str, v: &str) -> bool {
    let a = parts(req);
    let b = parts(v);
    let (p, q, _) = b;
    let same = match a {
        (0, 0, _) => a == b,
        (0, y, _) => p == 0 && q == y,
        (x, _, _) => p == x,
    };
    same && b >= a
}`,
        why: 'The 0.y.z cases are right, but from 1.0 on the lower parts don’t reset: 1.4.2 plus a feature gives 1.5.2.',
      },
      {
        code: `#[derive(Clone, Copy)]
enum Change {
    Break, // breaks the public API
    Feat,  // adds, breaks nothing
    Fix,   // fixes a bug
}
use Change::*;

// "1.4.2" -> (1, 4, 2)
fn parts(v: &str) -> (u64, u64, u64) {
    let n: Vec<u64> = v
        .split('.')
        .map(|p| p.parse().unwrap())
        .collect();
    (n[0], n[1], n[2])
}

// The version after \`v\` for change \`c\`.
fn next(v: &str, c: Change) -> String {
    let (x, y, z) = parts(v);
    let (x, y, z) = match (x, y, c) {
        (0, 0, _) => (0, 0, z + 1),
        (0, _, Break) => (0, y + 1, 0),
        (0, _, _) => (0, y, z + 1),
        (_, _, Break) => (x + 1, 0, 0),
        (_, _, Feat) => (x, y + 1, 0),
        (_, _, Fix) => (x, y, z + 1),
    };
    format!("{x}.{y}.{z}")
}

// Does the requirement \`req\` (Cargo's
// default, a caret) accept version \`v\`?
fn accepts(req: &str, v: &str) -> bool {
    let a = parts(req);
    let b = parts(v);
    let (p, q, _) = b;
    match a {
        (0, 0, _) => a == b,
        (0, y, _) => p == 0 && q == y,
        (x, _, _) => p == x,
    }
}`,
        why: '`accepts` checks the series but not the lower bound, so `0.1.4` satisfies a requirement of `0.1.5`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A CI job runs `npm ci`, and the repository’s package-lock.json is out of sync with package.json. What happens?',
    options: [
      {
        t: '`npm ci` updates the lockfile and carries on',
        why: 'That is what `npm install` does; `npm ci` never writes the lockfile.',
      },
      {
        t: 'It installs whatever package.json asks for',
        why: 'An install that ignored the lock would defeat the point of `npm ci`.',
      },
      {
        t: '`npm ci` exits with an error before installing anything',
        correct: true,
        why: 'Reproduced with npm 10.9.9: EUSAGE, “Missing: @viscosity/cli@0.1.0 from lock file”.',
      },
    ],
  },
  {
    q: 'A GitHub Actions workflow has a concurrency group per branch with `cancel-in-progress: true`. You push twice to one branch a minute apart. What happens?',
    options: [
      {
        t: 'Cancels the run for the first push',
        correct: true,
        why: 'Same group (workflow and branch), and `cancel-in-progress: true`.',
      },
      {
        t: 'Runs both, one after the other',
        why: 'With cancel-in-progress, the first is cancelled.',
      },
      {
        t: 'Merges them into one run',
        why: 'Runs are never merged; the newer one replaces the older.',
      },
    ],
  },
  {
    q: 'Which statement best says what CI checks that your own test run does not?',
    options: [
      {
        t: 'That the tests are correct',
        why: 'CI runs the same tests; it cannot tell whether they test the right thing.',
      },
      {
        t: 'That the change passes starting from nothing but the repository',
        correct: true,
        why: 'Your own run also has everything your machine happens to hold.',
      },
      {
        t: 'That the code is fast',
        why: 'None of these jobs measures speed.',
      },
    ],
  },
  {
    q: 'Adding a new gate to a workflow can…',
    options: [
      {
        t: 'let through a mistake that an existing gate used to catch',
        why: 'Every old gate still runs; a mistake escapes only if every gate misses it.',
      },
      {
        t: 'only catch more mistakes (or the same ones), at the cost of a longer run',
        correct: true,
        why: 'The set of escaping mistakes can only shrink.',
      },
      {
        t: 'make the other jobs skip their steps',
        why: 'Jobs are independent; only steps after a failure in the same job are skipped.',
      },
    ],
  },
  {
    q: 'A Rust crate depends on `foo = "0.1"`, and `foo` has releases 0.1.3, 0.2.0 and 1.0.0. Which one will `cargo update` choose?',
    options: [
      {
        t: '0.2.0',
        why: 'Outside the range: `"0.1"` means `>=0.1.0, <0.2.0`.',
      },
      {
        t: '1.0.0',
        why: 'Also outside the range.',
      },
      {
        t: '0.1.3',
        correct: true,
        why: 'Same left-most non-zero part (the 1), and not older than 0.1.0.',
      },
    ],
  },
];
