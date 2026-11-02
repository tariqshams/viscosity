// Chapter 355 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'bm-how': {
    q: 'How was each time in the 2026-11-02 benchmark tables measured?',
    a: 'Best of three runs, each in a fresh process, on the same shared cloud VM, for all three implementations.',
  },
  'bm-compile': {
    q: 'Do the benchmark times include compiling the Drip program?',
    a: 'Yes: each time is the whole run of a fresh process, start-up and compiling included.',
  },
  'bm-geo': {
    q: 'Why summarise speed-ups with a geometric mean rather than an ordinary average?',
    a: 'It treats 2× and 0.5× as equal and opposite (their geometric mean is 1); the ordinary average of 2 and 0.5 is 1.25, which would call a wash a win.',
  },
  'bm-vm-loses': {
    q: 'On which four benchmark programs is the TypeScript VM slower than the tree-walker?',
    a: '`fields`, `instantiation`, `strings` and `trees`.',
  },
  'bm-spread': {
    q: 'Why does drip-rs’s speed-up over the TypeScript VM vary so little from program to program?',
    a: 'The two VMs run the same bytecode with the same instructions, so they do the same work per step; only the cost of a step differs.',
  },
  'bm-map': {
    q: 'Where does the tree-walker keep an instance’s fields, and why does that help it?',
    a: 'In a JavaScript `Map`, so the hash table is V8’s own code, written in C++, rather than a table written in TypeScript.',
  },
  'bm-two-gcs': {
    q: 'Why does the TypeScript VM pay for garbage collection twice?',
    a: 'It runs its own mark-and-sweep collector over its heap, and V8’s collector still has to free the JavaScript objects underneath.',
  },
  'bm-design': {
    q: 'In one sentence: why does the same VM design win in Rust but not in TypeScript?',
    a: 'Its hand-built hash table, collector and dispatch only pay off once compiled to machine code; in TypeScript they compete with V8’s built-in versions.',
  },
};

export const examples = {
  bench: {
    lang: 'drip-vm',
    title: 'A small fields benchmark',
    code: `class Body {
  init(x, vx) {
    self.x = x;
    self.vx = vx;
  }
}
let a = new Body(0, 1);
let t = clock();
for i in 0..20000 {
  a.x += a.vx;
  if a.x > 100 { a.vx = -a.vx; }
  if a.x < -100 { a.vx = -a.vx; }
}
print a.x;
print clock() - t >= 0;`,
  },
};

const head = `// One benchmark: the program, the
// old time and the new time, in ms.
type Row = (&'static str, f64, f64);

// How many times as fast new is.
fn speedup(old: f64, new: f64) -> f64 {`;

const solution = `${head}
    old / new
}

// The n-th root of the product, or
// None for no values.
fn geomean(xs: &[f64]) -> Option<f64> {
    if xs.is_empty() {
        return None;
    }
    let logs: f64 =
        xs.iter().map(|x| x.ln()).sum();
    let n = xs.len() as f64;
    Some((logs / n).exp())
}

// The programs that got slower.
fn slower(rows: &[Row]) -> Vec<&str> {
    rows.iter()
        .filter(|r| r.2 > r.1)
        .map(|r| r.0)
        .collect()
}`;

const tests = `// drip-bench-2026-11-02: tree, TS VM.
const TREE_VM: [Row; 10] = [
    ("closures", 811.0, 655.0),
    ("fib", 2365.0, 1906.0),
    ("fields", 530.0, 712.0),
    ("instantiation", 428.0, 623.0),
    ("method_calls", 918.0, 704.0),
    ("particles", 446.0, 380.0),
    ("sieve", 1317.0, 1216.0),
    ("sort", 1394.0, 1224.0),
    ("strings", 365.0, 383.0),
    ("trees", 597.0, 749.0),
];
// drip-rs-bench-2026-11-02: TS VM, drip-rs.
const VM_RS: [Row; 10] = [
    ("closures", 655.0, 139.0),
    ("fib", 1906.0, 406.0),
    ("fields", 712.0, 193.0),
    ("instantiation", 623.0, 140.0),
    ("method_calls", 704.0, 167.0),
    ("particles", 380.0, 83.0),
    ("sieve", 1216.0, 283.0),
    ("sort", 1224.0, 248.0),
    ("strings", 383.0, 305.0),
    ("trees", 749.0, 156.0),
];

fn ratios(rows: &[Row]) -> Vec<f64> {
    rows.iter().map(|r| speedup(r.1, r.2)).collect()
}

fn close(a: f64, b: f64) -> bool {
    (a - b).abs() < 0.005
}

#[test]
fn a_speedup_is_old_over_new() {
    assert!(close(speedup(1906.0, 406.0), 4.69));
    assert!(close(speedup(530.0, 712.0), 0.74));
}

#[test]
fn geomean_basics() {
    assert_eq!(geomean(&[]), None);
    assert!(close(geomean(&[2.0, 0.5]).unwrap(), 1.0));
    assert!(close(geomean(&[4.0]).unwrap(), 4.0));
}

#[test]
fn the_ts_vm_is_about_even_with_the_tree_walker() {
    let g = geomean(&ratios(&TREE_VM)).unwrap();
    assert!(close(g, 1.01), "{g}");
}

#[test]
fn drip_rs_against_the_ts_vm() {
    let g = geomean(&ratios(&VM_RS)).unwrap();
    assert!(close(g, 3.94), "{g}");
}

#[test]
fn four_programs_got_slower() {
    assert_eq!(slower(&TREE_VM), [
        "fields", "instantiation", "strings", "trees",
    ]);
    assert!(slower(&VM_RS).is_empty());
}`;

export const exercises = {
  summarize: {
    lang: 'rust',
    title: 'Speed-ups and their geometric mean',
    prompt: `Each benchmark is a \`Row\`: the program's name, the old time and the new time, in milliseconds. Write:

1. \`speedup(old, new)\`: how many times as fast the new one is.
2. \`geomean(xs)\`: the geometric mean of the values, or \`None\` if there are none. (Hint: the mean of the logarithms, then \`exp\`.)
3. \`slower(rows)\`: the names of the programs whose new time is bigger than their old time, in order.

The tests use the committed results of 2026-11-02, and check the chapter's numbers: the TypeScript VM is 1.01 times the tree-walker, drip-rs 3.94 times the TypeScript VM.`,
    starter: `${head}
    todo!()
}

fn geomean(xs: &[f64]) -> Option<f64> {
    todo!()
}

fn slower(rows: &[Row]) -> Vec<&str> {
    todo!()
}`,
    solution,
    tests,
    hints: [
      'A speed-up is old time divided by new time, so a program that took 1906 ms and now takes 406 ms is 4.69 times as fast.',
      'The geometric mean of n values is the n-th root of their product. Multiplying ten numbers is fine here, but adding logarithms is safer: `exp(sum of ln(x) / n)`. Return `None` first if the slice is empty.',
      '`slower` is a filter and a map: `rows.iter().filter(|r| r.2 > r.1).map(|r| r.0).collect()`. `r.1` is the old time and `r.2` the new.',
    ],
    walkthrough: `**How to think about it.** There are three small questions here: how much faster is one run than another (a ratio), what is the typical ratio over many programs (a mean that suits ratios), and which programs went the wrong way (a filter). The only subtle one is the mean. Speed-ups multiply: if one change makes a program 2× faster and the next 3× faster, the total is 6×, not 5×. So the natural summary is the value that, multiplied by itself n times, gives the product of all n speed-ups: the geometric mean. It also makes 2× and 0.5× cancel, which is the fair reading of "one program got twice as fast and another twice as slow".

**The solution, line by line.**

- \`old / new\` is the speed-up. Bigger than 1 means the new one is faster; \`speedup(530.0, 712.0)\` is 0.74, slower.
- \`if xs.is_empty() { return None; }\` handles the case with no values, where there is no mean to give (and dividing by zero would give \`NaN\`).
- \`let logs: f64 = xs.iter().map(|x| x.ln()).sum();\` adds the natural logarithms. A product of many ratios could overflow or lose precision; a sum of logarithms does not, and \`ln(a × b) = ln a + ln b\`.
- \`let n = xs.len() as f64;\` is the count, as an \`f64\` so it can divide.
- \`Some((logs / n).exp())\`: the mean of the logarithms, turned back into a ratio with \`exp\`. For \`[2.0, 0.5]\` the logarithms are +0.693 and −0.693, their mean 0, and \`exp(0)\` is 1.
- \`rows.iter().filter(|r| r.2 > r.1).map(|r| r.0).collect()\` keeps the rows whose new time is larger than the old one and collects their names; the order of the input is kept.

On the committed results this gives 1.01 for the TypeScript VM against the tree-walker, with \`fields\`, \`instantiation\`, \`strings\` and \`trees\` slower, and 3.94 for drip-rs against the TypeScript VM, with none slower.

**Common wrong attempts.**

- The ordinary average of the ratios reports the TypeScript VM as 1.04 times the tree-walker, a win that is not there: the big ratios pull an ordinary average up more than the small ones pull it down.
- Dividing new by old reports every number upside down.`,
    wrong: [
      {
        code: `${head}
    old / new
}

fn geomean(xs: &[f64]) -> Option<f64> {
    if xs.is_empty() {
        return None;
    }
    let sum: f64 = xs.iter().sum();
    Some(sum / xs.len() as f64)
}

fn slower(rows: &[Row]) -> Vec<&str> {
    rows.iter()
        .filter(|r| r.2 > r.1)
        .map(|r| r.0)
        .collect()
}`,
        why: 'This is the ordinary average, not the geometric mean: 2× and 0.5× average to 1.25, and the TypeScript VM would come out 1.04× the tree-walker.',
      },
      {
        code: `${head}
    new / old
}

fn geomean(xs: &[f64]) -> Option<f64> {
    if xs.is_empty() {
        return None;
    }
    let logs: f64 =
        xs.iter().map(|x| x.ln()).sum();
    let n = xs.len() as f64;
    Some((logs / n).exp())
}

fn slower(rows: &[Row]) -> Vec<&str> {
    rows.iter()
        .filter(|r| r.2 > r.1)
        .map(|r| r.0)
        .collect()
}`,
        why: 'The ratio is upside down: fib’s 4.69× comes out as 0.21. A speed-up is old time divided by new time.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What is the geometric mean of the TypeScript VM’s speed-ups over the tree-walker on the ten programs of 2026-11-02?',
    options: [
      { t: 'About 1.24', why: 'That is fib’s and closures’ speed-up, not the mean over all ten.' },
      { t: 'About 1.01', correct: true, why: 'Six wins of at most 1.30× and four losses down to 0.69× cancel out almost exactly.' },
      { t: 'About 3.94', why: 'That is drip-rs against the TypeScript VM.' },
    ],
  },
  {
    q: 'On `fields`, the TypeScript VM is 0.74 times the tree-walker but drip-rs is 3.69 times the TypeScript VM. What does that suggest?',
    options: [
      { t: 'The bytecode for `fields` is badly compiled', why: 'drip-rs runs exactly the same bytecode and is fast.' },
      { t: 'The cost is in how each instruction is carried out in TypeScript, not in the instructions themselves', correct: true, why: 'Same bytecode, very different cost per instruction.' },
      { t: 'The tree-walker cheats by skipping work', why: 'All three pass the same corpus and print the same output.' },
    ],
  },
  {
    q: 'According to the profiles in this chapter, which work does the TypeScript VM do itself that the tree-walker leaves to V8?',
    options: [
      { t: 'Parsing the program', why: 'Both parse in TypeScript; compiling was under 1% of samples.' },
      { t: 'Printing the output', why: 'Both print the same way.' },
      { t: 'Hash-table lookups for fields and globals, and garbage collection', correct: true, why: 'Its own `table.ts` and `heap.ts`, against the tree-walker’s `Map` and V8’s collector.' },
    ],
  },
  {
    q: 'Why is a single run never used as a benchmark result in this book?',
    options: [
      { t: 'On a shared cloud machine one run can vary from the next by tens of percent', correct: true, why: 'So the tables report the best of three fresh runs, and close results are read as “about the same”.' },
      { t: 'The first run is always slower because of the disk', why: 'Each run is a fresh process anyway; the variation is mostly other work on the machine.' },
      { t: 'Rust programs need warming up', why: 'drip-rs is compiled ahead of time; there is nothing to warm up.' },
    ],
  },
  {
    q: 'What makes a comparison between implementations meaningful at all?',
    options: [
      { t: 'That they are written in different languages', why: 'Two implementations in the same language can be compared too.' },
      { t: 'That they pass the same tests, so they are doing the same work, measured the same way on the same machine', correct: true, why: 'A faster implementation that prints a different answer has not won anything.' },
      { t: 'That the newest one is fastest', why: 'The TypeScript VM is newer than the tree-walker, and not faster on average.' },
    ],
  },
];
