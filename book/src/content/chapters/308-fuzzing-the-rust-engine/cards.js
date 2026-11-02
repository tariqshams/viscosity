// Chapter 308 cards. Keys are stable ids: never rename them.

const SOL = `// Line-based delta debugging, as in
// fuzz.mjs: remove chunks of k lines
// while \`fails\` still says the program
// fails, halving k down to 1. Never
// tries an empty program.
fn reduce<'a>(
    mut ls: Vec<&'a str>,
    fails: impl Fn(&[&str]) -> bool,
) -> Vec<&'a str> {
    let mut k = (ls.len() / 2).max(1);
    loop {
        let mut changed = true;
        while changed {
            changed = false;
            let mut i = 0;
            while i + k <= ls.len() {
                let mut c = ls.clone();
                c.drain(i..i + k);
                if !c.is_empty()
                    && fails(&c)
                {
                    ls = c;
                    changed = true;
                } else {
                    i += k;
                }
            }
        }
        if k == 1 {
            return ls;
        }
        k = (k / 2).max(1);
    }
}`;

export const prompts = {
  'fz-coverage': {
    q: 'Which inputs does a coverage-guided fuzzer keep?',
    a: 'Those whose run reached coverage no earlier input reached (for AFL, a new branch edge or hit-count bucket). The rest are dropped.',
  },
  'fz-afl-edge': {
    q: 'AFL’s instrumentation does `shared_mem[cur ^ prev]++` at each branch. What does it count, and why not just blocks?',
    a: 'Edges: (previous location, current location) pairs. Edges tell A→B→C→D apart from A→C→B→D, which block counts can’t.',
  },
  'fz-generation': {
    q: 'What makes `scripts/fuzz.mjs` generation-based rather than coverage-guided?',
    a: 'It writes every program from its own model of the language, from a seed. Nothing measured during a run is fed back into what it writes next.',
  },
  'fz-valid': {
    q: 'Why would random bytes make a poor input for Viscosity’s fuzzer?',
    a: 'Nearly all are syntax errors, refused while parsing, so the analyses are never reached and there is no program for node to run as an oracle.',
  },
  'fz-seed': {
    q: 'Why does program k of a campaign get a seed mixed from (S, k) instead of continuing one random stream?',
    a: 'So any single program can be regenerated alone: `--seed S --only k` replays a failure without the k programs before it.',
  },
  'fz-batch': {
    q: 'How does fuzz.mjs keep the Rust engine’s process starts cheap?',
    a: 'It compiles a batch of 250 programs per CLI call (`viscosity build a.js b.js ... -o dir/`), so it pays a process start per batch, not per program.',
  },
  'fz-ci': {
    q: 'What does `crates/cli/tests/fuzz.rs` run on every `cargo test`?',
    a: 'fuzz.mjs with seed 1 and 200 programs against the freshly built binary; any failing program fails the test.',
  },
  'fz-reduce': {
    q: 'What does `fuzz.mjs --reduce` keep while it deletes lines?',
    a: 'The same kind of failure (for example behaviour-check or ts-crash), and a program that still parses.',
  },
  'fz-reduce-trap': {
    q: 'The reduced sequence-index program uses an undeclared `k`. Why did the reducer accept that?',
    a: 'It checks only that the same kind of failure remains. The original now throws a ReferenceError and the compiled one a SyntaxError: still a behaviour difference.',
  },
  'fz-plateau': {
    q: 'In the chapter’s measurement, what did 3,000 fuzz programs add over 300 to the TS engine’s line coverage?',
    a: 'Three lines: 2,433 of 2,614 against 2,430. The generator’s coverage had already flattened out.',
  },
  'fz-lines-not-bugs': {
    q: 'The fuzzer ran fewer engine lines than the hand-written programs, yet found five bugs they missed. How?',
    a: 'The bugs needed combinations (a push inside the right-hand side of a field write, an access inside a push). Line coverage records that a line ran, not in what combination.',
  },
};

export const examples = {
  'guided-vs-blind': {
    lang: 'rust',
    title: 'A toy coverage-guided fuzzer',
    code: `// The bug hides behind three checks.
// cov[k] records that check k passed.
fn target(b: &[u8], cov: &mut [bool])
    -> bool
{
    let want = b"FUZ";
    for k in 0..3 {
        if b[k] != want[k] {
            return false;
        }
        cov[k] = true;
    }
    true // the "crash"
}

// xorshift64: tiny and seeded
fn next(s: &mut u64) -> usize {
    *s ^= *s << 13;
    *s ^= *s >> 7;
    *s ^= *s << 17;
    *s as usize
}

fn letter(s: &mut u64) -> u8 {
    b'A' + (next(s) % 26) as u8
}

fn blind(s: &mut u64) -> usize {
    for n in 1..=1_000_000 {
        let b: Vec<u8> =
            (0..3).map(|_| letter(s))
                .collect();
        if target(&b, &mut [false; 3]) {
            return n;
        }
    }
    0
}

fn guided(s: &mut u64) -> usize {
    let mut seen = [false; 3];
    let start = b"AAA".to_vec();
    let mut kept = vec![start];
    for n in 1..=1_000_000 {
        // change a byte of a kept input
        let k = next(s) % kept.len();
        let mut b = kept[k].clone();
        b[next(s) % 3] = letter(s);
        let mut cov = [false; 3];
        if target(&b, &mut cov) {
            return n;
        }
        // true > false: a new check
        let new = (0..3)
            .any(|i| cov[i] > seen[i]);
        if new {
            for i in 0..3 {
                seen[i] |= cov[i];
            }
            let t: String = b.iter()
                .map(|&c| c as char)
                .collect();
            println!("  {n}: keep {t}");
            kept.push(b);
        }
    }
    0
}

fn main() {
    let mut s = 0x2545_f491_4f6c_dd1d;
    println!("guided:");
    let g = guided(&mut s);
    println!("guided: FUZ at try {g}");
    let b = blind(&mut s);
    println!("blind: FUZ at try {b}");
}
`,
  },
};

export const exercises = {
  reduceLines: {
    lang: 'rust',
    title: 'Shrink a failing program',
    prompt:
      'Write `reduce(lines, fails)`, the reducer of `fuzz.mjs --reduce`. Start with chunks of half the lines (at least 1). Try deleting each chunk in turn; keep a deletion if `fails` still returns true for what is left, and otherwise move on by one chunk. Repeat the pass until nothing changes, then halve the chunk size, down to 1. Never call `fails` on an empty program, and keep the lines in order.',
    starter: `fn reduce<'a>(
    mut ls: Vec<&'a str>,
    fails: impl Fn(&[&str]) -> bool,
) -> Vec<&'a str> {
    todo!()
}`,
    solution: SOL,
    tests: `fn names(n: usize) -> Vec<String> {
    (0..n).map(|i| format!("l{i}")).collect()
}

#[test]
fn keeps_only_the_lines_that_matter() {
    let ns = names(20);
    let ls: Vec<&str> =
        ns.iter().map(|s| s.as_str()).collect();
    let r = reduce(ls, |c| {
        c.contains(&"l3") && c.contains(&"l17")
    });
    assert_eq!(r, ["l3", "l17"]);
}

#[test]
fn never_returns_an_empty_program() {
    let ns = names(9);
    let ls: Vec<&str> =
        ns.iter().map(|s| s.as_str()).collect();
    let r = reduce(ls, |_| true);
    assert_eq!(r.len(), 1);
}

#[test]
fn never_asks_about_an_empty_program() {
    let ls = vec!["a", "b", "c", "d", "e"];
    let r = reduce(ls, |c| {
        assert!(!c.is_empty());
        c.contains(&"d")
    });
    assert_eq!(r, ["d"]);
}

#[test]
fn keeps_the_order_of_lines() {
    let ls = vec!["let", "x", "y", "use"];
    let r = reduce(ls, |c| {
        c.first() == Some(&"let")
            && c.last() == Some(&"use")
    });
    assert_eq!(r, ["let", "use"]);
}

#[test]
fn no_single_line_can_be_removed() {
    let ls = vec!["1", "4", "2", "5", "3", "6"];
    let sum = |c: &[&str]| -> u32 {
        c.iter().map(|s| s.parse::<u32>().unwrap()).sum()
    };
    let fails = |c: &[&str]| sum(c) >= 10;
    let r = reduce(ls, fails);
    assert!(fails(&r));
    for i in 0..r.len() {
        let mut c = r.clone();
        c.remove(i);
        assert!(!fails(&c), "{r:?} minus {i}");
    }
}

#[test]
fn a_program_that_passes_is_returned_whole() {
    let ls = vec!["a", "b", "c"];
    let r = reduce(ls.clone(), |_| false);
    assert_eq!(r, ls);
}
`,
    hints: [
      'Keep the outer structure: `let mut k = (ls.len() / 2).max(1); loop { ... if k == 1 { return ls; } k = (k / 2).max(1); }`.',
      'One pass: `let mut i = 0; while i + k <= ls.len() { ... }`. Build the candidate with `let mut c = ls.clone(); c.drain(i..i + k);`.',
      'On success, replace `ls` and do not advance `i`: the next lines have slid into place. On failure, `i += k`. Repeat passes while one changed something.',
    ],
    walkthrough: `This is \`reduce\` from \`engine/rust/scripts/fuzz.mjs\`, in Rust. There, \`fails\` writes the candidate to a file, compiles it with one or both engines, runs it under node, and asks whether the *same kind* of failure is still reported.

- **Why start with big chunks.** A 20-line program usually needs two or three of its lines. Deleting half at once gets rid of most of the noise in a few calls, and each call to \`fails\` costs a compile and two runs.
- **Why not advance after a deletion.** After \`c.drain(i..i + k)\`, the lines that followed the chunk now start at \`i\`. Advancing would skip them for the rest of the pass.
- **Why repeat passes.** Deleting one chunk can make another deletable that wasn't before (in the real reducer, a line that declared a variable only the deleted lines used).
- **Why go down to 1.** Chunks of 2 can leave a needed line paired with a useless neighbour. Only single-line deletions make the result *1-minimal*: removing any one line makes it pass. \`no_single_line_can_be_removed\` checks exactly that.
- **Why never empty.** An empty program can "fail" for silly reasons (both engines print nothing, or a crash on empty input), and the reducer would happily return it.`,
    wrong: [
      {
        code: SOL.replace('                if !c.is_empty()\n                    && fails(&c)\n                {', '                if fails(&c) {'),
        why: 'It tries the empty program. With a test that always fails it returns nothing at all, which tells you nothing about the bug.',
      },
      {
        code: SOL.replace('        if k == 1 {\n            return ls;\n        }\n        k = (k / 2).max(1);', '        k /= 2;\n        if k <= 1 {\n            return ls;\n        }'),
        why: 'It stops before trying single lines, so a needed line can stay glued to a useless neighbour: `["l3", "l17"]` comes back with extra lines.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does a coverage-guided fuzzer do with an input whose run reached no new edge?',
    options: [
      { t: 'Keeps it, so the corpus stays diverse', why: 'That is the opposite: inputs that add no coverage are dropped.' },
      { t: 'Drops it', correct: true, why: 'Only inputs that reach new coverage are kept and mutated further.' },
      { t: 'Reduces it with delta debugging', why: 'Reduction is for failing inputs, not for uninteresting ones.' },
      { t: 'Reports it as a bug', why: 'A bug is a crash or an oracle disagreement, not a lack of new coverage.' },
    ],
  },
  {
    q: 'Which statement about `scripts/fuzz.mjs` is accurate?',
    options: [
      { t: 'It mutates the corpus programs byte by byte', why: 'It generates each program from a seed; it doesn’t mutate files.' },
      { t: 'It is coverage-guided through V8’s coverage', why: 'Nothing measured in a run feeds back into the generator.' },
      { t: 'It generates valid programs from a seed, with no feedback from runs', correct: true, why: 'Generation-based, like Csmith.' },
    ],
  },
  {
    q: 'A run reports `FAIL program 90 (--seed 5 --only 90)`. How do you see that program again?',
    options: [
      { t: 'Run the whole campaign again and wait for program 90', why: 'Not needed: each program’s seed depends only on (S, k).' },
      { t: '`node scripts/fuzz.mjs --seed 5 --only 90 --print`', correct: true, why: 'It regenerates just that program and prints it.' },
      { t: 'It is lost unless you passed --keep', why: 'Failing programs are kept in a temp dir anyway, and the seed regenerates them.' },
    ],
  },
  {
    q: 'Why did the reduced sequence-index program refer to an undeclared `k`?',
    options: [
      { t: 'The generator writes programs with undeclared variables', why: 'The original program 12 declared `let k = 3;`. The reducer removed it.' },
      { t: 'The reducer keeps the kind of failure, not the program’s meaning', correct: true, why: 'Original (ReferenceError) and compiled (SyntaxError) still differ, so the deletion was accepted.' },
      { t: 'The emitter deleted the declaration', why: 'The emitter’s bug was the missing parentheses in `const p = k++, i;`.' },
    ],
  },
  {
    q: 'In the chapter’s measurement, the fuzzer ran fewer TS-engine lines than the hand-written programs. What follows?',
    options: [
      { t: 'The fuzzer is useless next to the corpus', why: 'It found five bugs the corpus missed.' },
      { t: 'Line coverage doesn’t show whether combinations of features were exercised', correct: true, why: 'All five bugs needed one construct inside another.' },
      { t: 'The corpus must contain the five bugs', why: 'It didn’t; corpus programs were added for them after they were found.' },
      { t: 'More fuzz programs would raise coverage a lot', why: '3,000 programs ran 3 more lines than 300.' },
    ],
  },
  {
    q: 'Why does the parity check alone not find any of the five fuzz finds?',
    options: [
      { t: 'They were in both engines, and parity only compares the engines', correct: true, why: 'The behaviour oracle (original vs compiled under node) or the TS crash found them.' },
      { t: 'The fuzzer doesn’t compare the engines', why: 'It does: code, explain and frames, byte for byte.' },
      { t: 'The Rust engine crashed first', why: 'Both engines crashed the same way on the overlapping rewrites.' },
    ],
  },
];
