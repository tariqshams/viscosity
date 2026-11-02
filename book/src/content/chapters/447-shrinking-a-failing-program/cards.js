// Chapter 447 cards. Keys are stable ids: never rename them.

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
  'fz-three-oracles': {
    q: 'What are the three oracles of `fuzz.mjs`?',
    a: 'Behaviour (original and compiled program print and throw the same under node), parity (the two engines give the same code, explain text and frames) and early errors (both reject the programs given one).',
  },
  'fz-batch': {
    q: 'How does fuzz.mjs keep the Rust engine’s process starts cheap?',
    a: 'It compiles a batch of 250 programs per CLI call (`viscosity build a.js b.js ... -o dir/`), so it pays one process start per batch, not per program.',
  },
  'fz-ci': {
    q: 'What does `crates/cli/tests/fuzz.rs` run on every `cargo test`?',
    a: 'fuzz.mjs with seed 1 and 200 programs, against the freshly built binary; any failing program fails the test.',
  },
  'fz-reduce': {
    q: 'When does `fuzz.mjs --reduce` keep a deletion?',
    a: 'When what is left still parses and still shows the same kind of failure (for example `behaviour-check` or `ts-crash`).',
  },
  'fz-minimal': {
    q: 'What does it mean that a reduced program is 1-minimal?',
    a: 'It still fails, and deleting any single one of its lines makes the failure go away.',
  },
  'fz-reduce-trap': {
    q: 'The reduced program 12 uses an undeclared `k`. Why did the reducer accept that?',
    a: 'It checks only that the same kind of failure remains. The original now threw a ReferenceError and the compiled one a SyntaxError: still a behaviour difference.',
  },
  'fz-parity-blind': {
    q: 'Why could the parity oracle not find any of the five bugs?',
    a: 'All five were in both engines (the port mirrors the reference), and parity only compares the engines with each other.',
  },
  'fz-plateau': {
    q: 'In the chapter’s measurement, what did 3,000 fuzz programs add over 300 to the engine’s line coverage?',
    a: 'Three lines: 2,433 of 2,614 against 2,430. The generator’s coverage had already flattened out.',
  },
  'fz-lines-not-bugs': {
    q: 'The fuzzer ran fewer engine lines than the hand-written programs, yet found five bugs they missed. How?',
    a: 'The bugs needed combinations (a push inside the right-hand side of a field write, an access inside a push). Line coverage records that a line ran, not with what.',
  },
};

export const examples = {
  'program-seeds': {
    title: 'One seed per program',
    code: `// fuzz.mjs: the seed of program k in
// campaign s (splitmix-style mixing)
function programSeed(s, k) {
  let x = (Math.imul(s, 0x9e3779b1) ^
    Math.imul(k + 1, 0x85ebca77)) >>> 0;
  x = Math.imul(x ^ (x >>> 16),
    0x7feb352d) >>> 0;
  x = Math.imul(x ^ (x >>> 15),
    0x846ca68b) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
}
for (const k of [0, 1, 2, 3])
  console.log(k, programSeed(5, k));
// program 3 again, on its own:
console.log(3, programSeed(5, 3));
// another campaign, same k:
console.log(3, programSeed(6, 3));`,
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
    walkthrough: `**How to think about it.** This is \`reduce\` from \`engine/rust/scripts/fuzz.mjs\`, in Rust. There, \`fails\` writes the candidate to a file, compiles it, runs it under node, and asks whether the same kind of failure is still there; here it is any closure. Before coding, play it by hand on six lines, a to f, where only b and e matter. Chunks of 3: deleting a b c removes b, and deleting d e f removes e, so both are undone. Chunks of 2: a b holds b (undo), c d goes (keep), and now e f sits where c d was, so the next try is at that same position (e is needed: undo). Chunks of 1 then remove a and f, one at a time. Two rules fall out of doing it by hand. After a kept deletion, the next lines have slid into the gap, so you must try the *same* position again. And one pass is not enough, because a deletion can make an earlier chunk deletable.

**The solution, line by line.**

- \`fn reduce<'a>(mut ls: Vec<&'a str>, fails: impl Fn(&[&str]) -> bool) -> Vec<&'a str>\` takes the lines by value (we will replace the vector as we go, hence \`mut\`), and the test as any closure that looks at a slice of lines. The lifetime \`'a\` says the lines we return borrow from the same text as the lines we were given.
- \`let mut k = (ls.len() / 2).max(1);\` is the first chunk size: half the lines, but never 0 (a one-line program gives \`1 / 2 = 0\`).
- \`loop {\` runs once per chunk size.
- \`let mut changed = true; while changed { changed = false; ... }\` repeats passes at this chunk size until a whole pass deletes nothing.
- \`let mut i = 0; while i + k <= ls.len() {\` walks the chunk positions; the condition stops before a chunk would run off the end.
- \`let mut c = ls.clone(); c.drain(i..i + k);\` builds the candidate: a copy with lines \`i\` to \`i + k - 1\` removed (\`drain\` removes a range).
- \`if !c.is_empty() && fails(&c) {\` asks the test, but never about an empty program; the \`&&\` stops before calling \`fails\` when \`c\` is empty.
- \`ls = c; changed = true;\` keeps the deletion, and leaves \`i\` where it is.
- \`} else { i += k; }\` puts nothing back (we only ever changed the copy) and moves to the next chunk.
- \`if k == 1 { return ls; }\` ends after the single-line passes, which are what make the result 1-minimal.
- \`k = (k / 2).max(1);\` halves the chunk, and \`max(1)\` makes sure a chunk of 1 is tried even when halving 3 gives 1 or halving 1 would give 0.

**Common wrong attempts.**

- **Asking about the empty program.** Without \`!c.is_empty()\`, a test that always says "fails" (or a crash on empty input) lets the reducer return nothing, which tells you nothing about the bug.
- **Stopping before chunks of 1.** Halving with \`k /= 2\` and stopping when \`k <= 1\` never tries single lines, so a needed line can stay glued to a useless neighbour.
- **Advancing after a deletion.** \`i += k\` in both branches skips the lines that slid into the gap; one pass then misses deletions, and without repeated passes the result is not 1-minimal.`,
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
    q: 'The reducer has 20 lines and the failure needs 2 of them. Why does it start by deleting chunks of 10?',
    options: [
      { t: 'Because single lines cannot be deleted', why: 'They can, and are, at the end.' },
      { t: 'Because each try costs a compile and two runs, and big chunks remove most of the noise in a few tries', correct: true, why: 'Halving first, single lines last.' },
      { t: 'Because acorn only parses even numbers of lines', why: 'Nothing like that; tries that do not parse are rejected.' },
    ],
  },
  {
    q: 'Why did the reduced program 12 refer to an undeclared `k`?',
    options: [
      { t: 'The generator writes programs with undeclared variables', why: 'The original program 12 declared `k` on its second line; the reducer removed it.' },
      { t: 'The emitter deleted the declaration', why: 'The emitter’s bug was the missing brackets in `const p = k++, i;`.' },
      { t: 'The reducer keeps the kind of failure, not the program’s meaning', correct: true, why: 'Original (ReferenceError) and compiled (SyntaxError) still differed, so the deletion was accepted.' },
    ],
  },
  {
    q: 'A reduced program is 1-minimal. Which statement must be true?',
    options: [
      { t: 'No smaller program shows the same failure', why: '1-minimal only says no single line can go; a different, smaller program might still fail.' },
      { t: 'Deleting any one of its lines makes the failure go away', correct: true, why: 'That is the definition.' },
      { t: 'Deleting any two of its lines keeps the failure', why: 'It says nothing about pairs, and deleting lines it needs removes the failure.' },
    ],
  },
  {
    q: 'Why did the parity oracle miss all five fuzz finds?',
    options: [
      { t: 'The fuzzer does not compare the engines', why: 'It does: code, explain text and frames, byte for byte.' },
      { t: 'They were in both engines, and parity only compares the engines', correct: true, why: 'The behaviour oracle and the TypeScript crash found them.' },
      { t: 'The Rust engine crashed first', why: 'In the reproduction the Rust engine was not even run (`--no-rust`).' },
    ],
  },
  {
    q: 'The fuzzer ran fewer TypeScript-engine lines than the hand-written programs. What follows?',
    options: [
      { t: 'The fuzzer is useless next to the corpus', why: 'It found five bugs the corpus missed.' },
      { t: 'More fuzz programs would raise coverage a lot', why: '3,000 programs ran 3 more lines than 300.' },
      { t: 'The corpus must already have contained the five bugs', why: 'It did not; programs for them were added after they were found.' },
      { t: 'Line coverage does not show which combinations of features were exercised', correct: true, why: 'All five bugs needed one construct inside another.' },
    ],
  },
];
