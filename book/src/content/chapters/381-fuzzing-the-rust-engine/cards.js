// Chapter 381 cards. Keys are stable ids: never rename them.

const SOL = `// AFL's edge map, one flag per index.
// \`path\` lists the blocks a run went
// through, in order. Mark every edge it
// took in \`seen\`, and return true if
// any of them was new.
fn keep(
    seen: &mut [bool],
    path: &[usize],
) -> bool {
    let mut prev = 0;
    let mut new = false;
    for &cur in path {
        let e =
            (cur ^ prev) % seen.len();
        if !seen[e] {
            seen[e] = true;
            new = true;
        }
        prev = cur >> 1;
    }
    new
}`;

export const prompts = {
  'fz-coverage': {
    q: 'Which inputs does a coverage-guided fuzzer keep?',
    a: 'Only those whose run reached coverage no earlier input reached (for AFL, a new branch edge or a new hit-count bucket). The rest are thrown away.',
  },
  'fz-generation': {
    q: 'What makes `scripts/fuzz.mjs` generation-based rather than coverage-guided?',
    a: 'It writes every program from its own model of the language, starting from a seed. Nothing measured during a run feeds back into what it writes next.',
  },
  'fz-afl-edge': {
    q: 'AFL adds `shared_mem[cur ^ prev]++` to every block. What does one counter stand for?',
    a: 'An edge: a step from the previous block to the current one, since the index mixes both block numbers.',
  },
  'fz-blocks': {
    q: 'Why does AFL count edges rather than blocks?',
    a: 'Two runs can visit the same blocks in a different order (A→B→C→D and A→C→B→D). Block counts cannot tell them apart; edge counts can.',
  },
  'fz-valid': {
    q: 'Why are mutated bytes a poor input for Viscosity?',
    a: 'Nearly all are syntax errors, refused while parsing, so the analyses never run, and there is no program for node to run as an oracle.',
  },
  'fz-seed': {
    q: 'Why does program k of a campaign get a seed mixed from (S, k), rather than continuing one random stream?',
    a: 'So any one program can be made again on its own: `--seed S --only k` rebuilds it without generating the k programs before it.',
  },
  'fz-order': {
    q: 'In `ls[1].a = (ls.push(...), 7)`, which runs first in JavaScript: finding where to store, or the right-hand side?',
    a: 'Finding where to store (the reference `ls[1].a`, or in the old compiled code the column `ls.a`); the right-hand side runs after it.',
  },
  'fz-oracle': {
    q: 'What is an oracle, in fuzzing?',
    a: 'Something that says whether a run was right, such as “the compiled program prints what the original prints” or “the program did not crash”.',
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
  keepIfNew: {
    lang: 'rust',
    title: 'The feedback step',
    prompt:
      'Write `keep(seen, path)`, the step a coverage-guided fuzzer takes after every run. `path` lists the blocks the run went through, as numbers, in order. Work out each edge as AFL does: start with `prev = 0`; for each block `cur`, the edge index is `(cur ^ prev) % seen.len()`, and then `prev = cur >> 1`. Set `seen[e] = true` for every edge of the run, and return `true` if at least one of them was not set before.',
    starter: `fn keep(
    seen: &mut [bool],
    path: &[usize],
) -> bool {
    todo!()
}`,
    solution: SOL,
    tests: `#[test]
fn the_first_run_is_new() {
    let mut seen = [false; 64];
    assert!(keep(&mut seen, &[10, 20, 30]));
}

#[test]
fn the_same_path_again_is_not_new() {
    let mut seen = [false; 64];
    keep(&mut seen, &[10, 20, 30, 40]);
    assert!(!keep(&mut seen, &[10, 20, 30, 40]));
}

#[test]
fn same_blocks_in_another_order_are_new() {
    let mut seen = [false; 64];
    keep(&mut seen, &[10, 20, 30, 40]);
    assert!(keep(&mut seen, &[10, 30, 20, 40]));
}

#[test]
fn a_prefix_of_an_old_path_is_not_new() {
    let mut seen = [false; 64];
    keep(&mut seen, &[10, 20, 30, 40]);
    assert!(!keep(&mut seen, &[10, 20]));
}

#[test]
fn every_edge_of_a_run_is_recorded() {
    let mut seen = [false; 64];
    assert!(keep(&mut seen, &[1, 2, 3]));
    assert!(!keep(&mut seen, &[1, 2, 3]));
}

#[test]
fn a_to_b_and_b_to_a_are_different_edges() {
    let mut seen = [false; 64];
    keep(&mut seen, &[9]);
    keep(&mut seen, &[6, 9]);
    assert!(keep(&mut seen, &[9, 6]));
}
`,
    hints: [
      'You need two pieces of state while walking the path: the previous (shifted) block, starting at 0, and a flag saying whether anything new turned up.',
      'For each `cur`: work out `e`, and if `seen[e]` is false, set it and remember that something was new. Do not stop early: every edge of the run must be marked.',
      'The order inside the loop matters: compute `e` from the old `prev`, then set `prev = cur >> 1`. Return the flag after the loop.',
    ],
    walkthrough: `**How to think about it.** This is the feedback arrow of the coverage-guided loop. The fuzzer ran an input and the instrumentation reported the blocks it went through; now the fuzzer must decide whether the input taught it anything. "Anything" means at least one edge, a step from one block to the next, that no earlier run took. Two jobs, then: mark every edge of this run, and report whether any was new. Do the first example by hand before you write code: for the path 10, 20, 30, the edges are \`10 ^ 0 = 10\`, then \`20 ^ (10 >> 1) = 20 ^ 5 = 17\`, then \`30 ^ (20 >> 1) = 30 ^ 10 = 20\`.

**The solution, line by line.**

- \`fn keep(seen: &mut [bool], path: &[usize]) -> bool {\` takes the map as a mutable slice (the fuzzer keeps it between runs, so we change it in place) and the path as a shared slice (we only read it).
- \`let mut prev = 0;\` is AFL's "previous location". At the start of a run nothing came before, so it is 0.
- \`let mut new = false;\` will become true the moment we meet an edge that was not marked.
- \`for &cur in path {\` walks the blocks in order; \`&cur\` copies each number out of the slice.
- \`let e = (cur ^ prev) % seen.len();\` mixes the current and previous block into one index (exclusive or), and \`%\` keeps it inside the map, as AFL's fixed 64 kB map does.
- \`if !seen[e] { seen[e] = true; new = true; }\` marks an unmarked edge and remembers that this run found something.
- \`prev = cur >> 1;\` is the shift. Without it, A→B and B→A would mix to the same index, because \`a ^ b\` equals \`b ^ a\`; and every tight loop A→A would land on index 0, because \`a ^ a\` is 0.
- \`new\` after the loop is the answer.

**Common wrong attempts.**

- **Counting blocks.** \`let e = cur % seen.len();\` records which blocks ran. The path 10, 30, 20, 40 visits the same four blocks as 10, 20, 30, 40, so it looks old, and the fuzzer throws away an input that took a new route.
- **Returning at the first new edge.** \`return true\` inside the \`if\` leaves the rest of the run's edges unmarked, so the very same input looks new again next time, and the corpus fills with copies.
- **No shift.** \`prev = cur;\` makes the edge from 6 to 9 and the edge from 9 to 6 the same index, so the run 9, 6 is wrongly reported as old.`,
    wrong: [
      {
        code: SOL.replace('        let e =\n            (cur ^ prev) % seen.len();', '        let e = cur % seen.len();'),
        why: 'That records blocks, not edges: the same blocks in another order look old, so `same_blocks_in_another_order_are_new` fails.',
      },
      {
        code: SOL.replace('            seen[e] = true;\n            new = true;', '            seen[e] = true;\n            return true;'),
        why: 'Returning at the first new edge leaves the rest of the run unmarked, so the same input looks new the second time.',
      },
      {
        code: SOL.replace('prev = cur >> 1;', 'prev = cur;'),
        why: 'Without the shift, 6 then 9 and 9 then 6 mix to the same index (`a ^ b` equals `b ^ a`), so a new edge is missed.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does a coverage-guided fuzzer do with an input whose run reached no new edge?',
    options: [
      { t: 'Keeps it, so the corpus stays varied', why: 'The opposite: inputs that add no coverage are thrown away.' },
      { t: 'Throws it away', correct: true, why: 'Only inputs that reach new coverage are kept and mutated further.' },
      { t: 'Reports it as a bug', why: 'A bug is a crash or a disagreement with an oracle, not a lack of new coverage.' },
      { t: 'Shrinks it with the reducer', why: 'Reduction is for failing inputs, not for uninteresting ones.' },
    ],
  },
  {
    q: 'Run 1 goes A→B→C→D and run 2 goes A→C→B→D. What does an edge counter see in run 2?',
    options: [
      { t: 'Nothing new, since the blocks are the same', why: 'That is what a block counter sees.' },
      { t: 'New edges: A→C, C→B and B→D', correct: true, why: 'Run 1’s edges were A→B, B→C and C→D; none of run 2’s three edges is among them.' },
      { t: 'Only one new edge, A→C', why: 'C→B and B→D were not taken in run 1 either.' },
    ],
  },
  {
    q: 'Which statement about `scripts/fuzz.mjs` is accurate?',
    options: [
      { t: 'It mutates the corpus programs byte by byte', why: 'It writes each program from a seed; it changes no files.' },
      { t: 'It is guided by V8’s coverage', why: 'Nothing measured in a run feeds back into the generator.' },
      { t: 'It writes valid programs from a seed, with no feedback from runs', correct: true, why: 'Generation-based, like Csmith.' },
    ],
  },
  {
    q: 'A run reports `FAIL program 90 (--seed 5 --only 90)`. How do you see that program again?',
    options: [
      { t: 'Run the whole campaign again and wait for program 90', why: 'Not needed: each program’s seed depends only on (S, k).' },
      { t: '`node scripts/fuzz.mjs --seed 5 --only 90 --print`', correct: true, why: 'It rebuilds just that program and prints it.' },
      { t: 'It is lost unless you passed `--keep`', why: 'The seed rebuilds it (and failing programs are written to a temporary folder anyway).' },
    ],
  },
  {
    q: 'Why did the old engine lose the `7` in `ls[1].a = (ls.push({ a: 0, b: 0 }), 7)`?',
    options: [
      { t: 'The push threw an error', why: 'The push worked; it is what caused the trouble.' },
      { t: 'JavaScript found the column `ls.a` first, then the push grew the collection into a new column, and the 7 went into the old one', correct: true, why: 'The target of an assignment is worked out before its right-hand side runs.' },
      { t: 'The bounds check rejected index 1', why: 'Index 1 was in bounds.' },
    ],
  },
];
