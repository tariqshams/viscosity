// Chapter 452 cards. Keys are stable ids: never rename them.

const SOL = `// Which runs finish? Each push is (the
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
}`;

export const prompts = {
  'ci-acorn': {
    q: 'Why did `fuzz.rs` pass on the machine where it was written but fail on the CI runner?',
    a: 'It loads the TypeScript engine, which imports acorn. The developer’s machine already had `engine/ts/node_modules`; the fresh runner had nothing, because the job never ran `npm ci` there.',
  },
  'ci-lockfile': {
    q: 'What does a lockfile such as `package-lock.json` record?',
    a: 'The exact version of every package to install, so that every install gets the same ones.',
  },
  'ci-npm-ci': {
    q: 'What does `npm ci` do when package-lock.json and package.json disagree, and how is that different from `npm install`?',
    a: '`npm ci` exits with an error and installs nothing; `npm install` updates the lockfile to match.',
  },
  'ci-def': {
    q: 'What does continuous integration add to tests that already pass on your machine?',
    a: 'It runs them on every change on a fresh machine that has only what the repository installs, so it catches what passed only because of something your machine had.',
  },
  'ci-concurrency': {
    q: 'What does `concurrency: { group: workflow-ref, cancel-in-progress: true }` do when you push twice quickly to the same branch?',
    a: 'Both runs are in the same group, so the newer one cancels the run still in progress for the first push.',
  },
  'ci-parallel-jobs': {
    q: 'Why do the workflow’s five jobs not depend on each other?',
    a: 'So they run side by side, and a red job never stops or hides the others: one push shows every failure.',
  },
  'ci-cache': {
    q: 'Why does a changed package-lock.json mean a fresh npm download on the next CI run?',
    a: 'setup-node’s cache key includes a hash of the lockfile, so a changed lockfile gives a new key, which misses.',
  },
  'ci-rust-cache': {
    q: 'What does `Swatinem/rust-cache` keep between runs, and what does it leave out?',
    a: 'It keeps ~/.cargo and the compiled dependencies in target/, keyed by the rustc version among other things; it leaves out the workspace’s own crates, which are rebuilt every run.',
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
  cancelledRuns: {
    lang: 'rust',
    title: 'Which runs finish?',
    prompt:
      'Write `finished(pushes, d)`. Each push is `(minute, branch)`, in the order they arrived, and starts a CI run that takes `d` minutes. As in ci.yml (one concurrency group per branch, `cancel-in-progress: true`), a run is cancelled if a later push to the *same* branch arrives while it is still running, that is, before minute `t + d`. A push that arrives exactly at `t + d` is too late to cancel it. Return the indexes of the runs that finish, in order.',
    starter: `fn finished(
    pushes: &[(u32, &str)],
    d: u32,
) -> Vec<usize> {
    todo!()
}`,
    solution: SOL,
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
        code: SOL.replace('q == r && u < t + d', 'u < t + d'),
        why: 'It ignores the branch, so a push to `fix` cancels a run on `main`.',
      },
      {
        code: SOL.replace('let later = &pushes[i + 1..];', 'let j = pushes.len().min(i + 2);\n        let later = &pushes[i + 1..j];'),
        why: 'It looks only at the next push, so a main push after a fix push does not cancel the earlier main run.',
      },
      {
        code: SOL.replace('u < t + d', 'u <= t + d'),
        why: 'A push that arrives exactly as the run ends is counted as cancelling it.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A lockfile is out of sync with package.json. What happens on the CI runner?',
    options: [
      { t: '`npm ci` updates the lockfile and carries on', why: 'That is what `npm install` does; `npm ci` never writes the lockfile.' },
      { t: 'It installs whatever package.json asks for', why: 'An install that ignored the lock would defeat the point of `npm ci`.' },
      { t: '`npm ci` exits with an error before installing anything', correct: true, why: 'Reproduced with npm 10.9.9: EUSAGE, “Missing: @viscosity/cli@0.1.0 from lock file”.' },
    ],
  },
  {
    q: 'You push twice to the same branch a minute apart. What does ci.yml’s `concurrency` setting do?',
    options: [
      { t: 'Cancels the run for the first push', correct: true, why: 'Same group (workflow and branch), and `cancel-in-progress: true`.' },
      { t: 'Runs both, one after the other', why: 'With cancel-in-progress, the first is cancelled.' },
      { t: 'Merges them into one run', why: 'Runs are never merged; the newer one replaces the older.' },
    ],
  },
  {
    q: 'Why did the `engine-rust` job fail on the first CI runs after the fuzzer was added?',
    options: [
      { t: 'The fuzzer found a bug in the engine', why: 'The log says `Cannot find package \'acorn\'`: the fuzzer never ran.' },
      { t: 'The runner had not installed the TypeScript engine’s packages, which the fuzz test loads', correct: true, why: 'The fix was one step, `npm ci` in engine/ts, before `cargo test`.' },
      { t: 'GitHub’s runner had no Rust compiler', why: 'The job installs a toolchain first, and the other Rust tests ran.' },
    ],
  },
  {
    q: 'What does `Swatinem/rust-cache` save between runs?',
    options: [
      { t: 'Everything in target/, including the workspace’s own crates', why: 'It deliberately leaves the workspace crates out.' },
      { t: 'Only the test results', why: 'It caches build inputs and outputs, not results.' },
      { t: '~/.cargo and the compiled dependencies in target/', correct: true, why: 'Keyed by the rustc version among other things.' },
    ],
  },
  {
    q: 'Which statement best says what CI checks that your own test run does not?',
    options: [
      { t: 'That the tests are correct', why: 'CI runs the same tests; it cannot tell whether they test the right thing.' },
      { t: 'That the change passes starting from nothing but the repository', correct: true, why: 'Your own run also has everything your machine happens to hold.' },
      { t: 'That the code is fast', why: 'None of these jobs measures speed.' },
    ],
  },
];
