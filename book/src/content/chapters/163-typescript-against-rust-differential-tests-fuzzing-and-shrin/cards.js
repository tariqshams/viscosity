// Chapter 163 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from the old chapters TypeScript vs Rust: differential tests, Fuzzing the Rust engine, and Shrinking a failing program.

export const prompts = {
  'ep-oracle': {
    q: 'What is a test’s **oracle**?',
    a: 'Whatever it trusts to give the right answer: here the TS engine’s output, or the original program’s behaviour.',
  },
  'ep-parity-blind': {
    q: 'What kind of bug can a byte-for-byte parity test between two compiler implementations never catch?',
    a: 'One both engines share. Parity compares Rust with TS, so if both are wrong the same way, it passes.',
  },
  'ep-diff-blind': {
    q: 'Viscosity’s node differential test (each original and compiled program run under node, output compared) passes. What can still be wrong?',
    a: 'Anything that doesn’t change behaviour (explain text, frames), anything outside its 68 programs, and anything only `--bounds assume` reaches.',
  },
  'ep-shared': {
    q: 'Why were all five bugs that Viscosity’s differential fuzzer found present in both engines?',
    a: 'The port mirrors the reference, so their bugs are shared. Parity can’t see shared bugs; the behaviour and no-crash oracles could.',
  },
  'fz-coverage': {
    q: 'Which inputs does a coverage-guided fuzzer keep?',
    a: 'Only those whose run reached coverage no earlier input reached (for AFL, a new branch edge or a new hit-count bucket). The rest are thrown away.',
  },
  'fz-blocks': {
    q: 'Why does AFL count edges rather than blocks?',
    a: 'Two runs can visit the same blocks in a different order (A→B→C→D and A→C→B→D). Block counts cannot tell them apart; edge counts can.',
  },
  'fz-valid': {
    q: 'Why are randomly mutated bytes a poor fuzzing input for Viscosity?',
    a: 'Nearly all are syntax errors, refused while parsing, so the analyses never run, and there is no program for node to run as an oracle.',
  },
  'fz-reduce': {
    q: 'When does Viscosity’s `fuzz.mjs --reduce` keep a deletion of lines?',
    a: 'When what is left still parses and still shows the same kind of failure (for example `behaviour-check` or `ts-crash`).',
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
  verdict: {
    lang: 'rust',
    title: 'Two oracles, one verdict',
    prompt: 'Write the fuzzer’s verdict for one program, as `fuzz.mjs`’s `failuresOf` decides it. `ts` and `rs` are what each engine made of `src`; `run` runs a program and returns what it printed. Return the failures in this order. Against the original: `"ts-crash"` if the TS engine failed, otherwise `"behaviour"` if the TS output prints something different from `src`. Against the TS engine: if both succeeded, `"parity-code"` and then `"parity-explain"` for each field that differs; if exactly one failed, `"parity-error"`. Two failures with different messages are not a parity failure.',
    starter: `// What an engine made of a program:
// its code and explain text, or an
// error message.
struct Out {
    code: String,
    explain: String,
}
type Res = Result<Out, String>;

fn verdict(
    src: &str,
    ts: &Res,
    rs: &Res,
    run: impl Fn(&str) -> String,
) -> Vec<&'static str> {
    todo!()
}`,
    solution: `// What an engine made of a program:
// its code and explain text, or an
// error message.
struct Out {
    code: String,
    explain: String,
}
type Res = Result<Out, String>;

fn verdict(
    src: &str,
    ts: &Res,
    rs: &Res,
    run: impl Fn(&str) -> String,
) -> Vec<&'static str> {
    let mut f = Vec::new();
    // Oracle 1: the original program.
    match ts {
        Err(_) => f.push("ts-crash"),
        Ok(t) => {
            let want = run(src);
            if run(&t.code) != want {
                f.push("behaviour");
            }
        }
    }
    // Oracle 2: the TS engine.
    if let (Ok(t), Ok(r)) = (ts, rs) {
        if t.code != r.code {
            f.push("parity-code");
        }
        if t.explain != r.explain {
            f.push("parity-explain");
        }
    } else if ts.is_ok() != rs.is_ok() {
        f.push("parity-error");
    }
    f
}`,
    tests: `fn ok(code: &str, explain: &str) -> Res {
    Ok(Out {
        code: code.to_string(),
        explain: explain.to_string(),
    })
}

// A pretend runner: a program "prints"
// the digits in its text.
fn digits(code: &str) -> String {
    code.chars().filter(|c| c.is_ascii_digit()).collect()
}

#[test]
fn agreeing_engines_and_same_behaviour() {
    let t = ok("log(1)", "ps → soa");
    let r = ok("log(1)", "ps → soa");
    assert_eq!(verdict("log(1);", &t, &r, digits), Vec::<&str>::new());
}

#[test]
fn a_shared_miscompile_is_behaviour_only() {
    let t = ok("log(2)", "ps → soa");
    let r = ok("log(2)", "ps → soa");
    assert_eq!(verdict("log(1)", &t, &r, digits), vec!["behaviour"]);
}

#[test]
fn a_rust_only_wording_is_parity_only() {
    let t = ok("log(1)", "about 20 elements (measured)");
    let r = ok("log(1)", "about 20 (measured) elements");
    assert_eq!(verdict("log(1)", &t, &r, digits), vec!["parity-explain"]);
}

#[test]
fn errors_are_compared_by_presence() {
    let t: Res = Err(
        "Identifier directly after number (1:5)".into());
    let r: Res = Err(
        "Invalid characters after number (1:5)".into());
    assert_eq!(verdict("let 1x", &t, &r, digits), vec!["ts-crash"]);
}

#[test]
fn only_one_engine_failing_is_a_parity_error() {
    let t: Res = Err("Unexpected token (2:4)".into());
    let r = ok("f(1)", "");
    assert_eq!(
        verdict("f(1", &t, &r, digits),
        vec!["ts-crash", "parity-error"]
    );
}

#[test]
fn code_and_explain_both_reported() {
    let t = ok("log(1)", "a");
    let r = ok("log(1);", "b");
    assert_eq!(
        verdict("log(1)", &t, &r, digits),
        vec!["parity-code", "parity-explain"]
    );
}

#[test]
fn behaviour_is_checked_even_if_rust_fails() {
    let t = ok("log(9)", "ps → soa");
    let r: Res = Err("internal error".into());
    assert_eq!(
        verdict("log(1)", &t, &r, digits),
        vec!["behaviour", "parity-error"]
    );
}`,
    hints: [
      'Two separate checks, one after the other: first `match ts { Err(_) => ..., Ok(t) => ... }` against the original, then the parity check.',
      'For parity, `if let (Ok(t), Ok(r)) = (ts, rs)` handles the case where both succeeded. What is left is “at least one failed”.',
      '“Exactly one failed” is `ts.is_ok() != rs.is_ok()`. That ignores the messages, which is the point.',
    ],
    walkthrough: `**How to think about it.** This is the shape of \`failuresOf\` in \`engine/rust/scripts/fuzz.mjs\`, in Rust, with the node VM replaced by a closure called \`run\`. Before writing any code, separate the two questions the fuzzer asks, because they have different oracles. First: did the TypeScript engine compile the program correctly? The oracle is the original program, so run both and compare what they print. Second: does the Rust engine agree with the TypeScript one? The oracle is the TypeScript output, so compare text. The two checks are independent: neither one's result should stop the other from running. Write them one after the other, each pushing into the same list, and the order of the list falls out of the order of the code.

**The solution, line by line.**

- \`let mut f = Vec::new();\` is the list of failures, empty to begin with. An empty list at the end means the program passed.
- \`match ts {\` starts the first check, against the original program.
- \`Err(_) => f.push("ts-crash"),\`: every generated program is valid JavaScript, so if the TypeScript engine fails on it at all, that is a bug on its own. This is how "internal error: overlapping rewrites" was found, a crash in both engines that parity could never report.
- \`Ok(t) => { let want = run(src); if run(&t.code) != want { f.push("behaviour"); } }\`: if it compiled, run the original and the compiled program and compare what they printed. Only the TypeScript output is run; the Rust output is held to it byte for byte below, so when parity passes, the Rust output has effectively been run too.
- \`if let (Ok(t), Ok(r)) = (ts, rs) {\` starts the second check. Pairing the two results in a tuple and matching both at once handles "both succeeded" in one pattern.
- \`if t.code != r.code { f.push("parity-code"); }\` and \`if t.explain != r.explain { f.push("parity-explain"); }\` compare the two texts. They are two separate \`if\`s, not an \`else if\`, so a program that differs in both reports both.
- \`} else if ts.is_ok() != rs.is_ok() { f.push("parity-error"); }\`: we get here when at least one engine failed. \`is_ok()\` turns each result into \`true\` or \`false\`, and the two differ only when exactly one failed. Two failures, whatever their messages, push nothing.
- \`f\` returns the list.

**Common wrong attempts.**

- *Comparing the error messages.* \`if ts != rs\` on two \`Err\`s, or comparing the strings, fails on every syntax error, because acorn and oxc word their messages differently ("Identifier directly after number" against "Invalid characters after number"). That is why the fuzzer compares errors by presence. The price of the rule: if both engines rejected a program for different reasons, nobody would know.
- *Returning early when Rust fails.* Writing the parity check first and returning on a Rust error silences the behaviour check, so a miscompile by the TypeScript engine goes unreported whenever the Rust engine happens to crash. One oracle failing must not hide the other; the last test checks exactly that.
- *Running the Rust output too.* It is not wrong, but it adds nothing whenever parity passes, and it costs a run per program; the real fuzzer reaches the Rust engine through its CLI, one call per batch of 250 files, and never runs its output.`,
    wrong: [
      {
        code: `// What an engine made of a program:
// its code and explain text, or an
// error message.
struct Out {
    code: String,
    explain: String,
}
type Res = Result<Out, String>;

fn verdict(
    src: &str,
    ts: &Res,
    rs: &Res,
    run: impl Fn(&str) -> String,
) -> Vec<&'static str> {
    let mut f = Vec::new();
    // Oracle 1: the original program.
    match ts {
        Err(_) => f.push("ts-crash"),
        Ok(t) => {
            let want = run(src);
            if run(&t.code) != want {
                f.push("behaviour");
            }
        }
    }
    // Oracle 2: the TS engine.
    if let (Ok(t), Ok(r)) = (ts, rs) {
        if t.code != r.code {
            f.push("parity-code");
        }
        if t.explain != r.explain {
            f.push("parity-explain");
        }
    } else if ts.as_ref().err()
        != rs.as_ref().err()
    {
        f.push("parity-error");
    }
    f
}`,
        why: 'It compares the error messages. Different wording from oxc and acorn becomes a parity failure, even when both engines rightly reject the program.',
      },
      {
        code: `// What an engine made of a program:
// its code and explain text, or an
// error message.
struct Out {
    code: String,
    explain: String,
}
type Res = Result<Out, String>;

fn verdict(
    src: &str,
    ts: &Res,
    rs: &Res,
    run: impl Fn(&str) -> String,
) -> Vec<&'static str> {
    let mut f = Vec::new();
    // Oracle 1: the original program.
    if let (Ok(t), Ok(_)) = (ts, rs) {
        let want = run(src);
        if run(&t.code) != want {
            f.push("behaviour");
        }
    }
    // Oracle 2: the TS engine.
    if let (Ok(t), Ok(r)) = (ts, rs) {
        if t.code != r.code {
            f.push("parity-code");
        }
        if t.explain != r.explain {
            f.push("parity-explain");
        }
    } else if ts.is_ok() != rs.is_ok() {
        f.push("parity-error");
    }
    f
}`,
        why: 'It skips the behaviour check unless both engines succeed, so a TS miscompile goes unreported whenever Rust fails, and a TS crash is never reported.',
      },
      {
        code: `// What an engine made of a program:
// its code and explain text, or an
// error message.
struct Out {
    code: String,
    explain: String,
}
type Res = Result<Out, String>;

fn verdict(
    src: &str,
    ts: &Res,
    rs: &Res,
    run: impl Fn(&str) -> String,
) -> Vec<&'static str> {
    let mut f = Vec::new();
    // Oracle 1: the original program.
    if ts.is_err() {
        f.push("ts-crash");
    }
    // Oracle 2: the TS engine.
    if let (Ok(t), Ok(r)) = (ts, rs) {
        if t.code != r.code {
            f.push("parity-code");
        }
        if t.explain != r.explain {
            f.push("parity-explain");
        }
    } else if ts.is_ok() != rs.is_ok() {
        f.push("parity-error");
    }
    f
}`,
        why: 'It never runs anything, so a miscompile that both engines share passes: exactly the kind of bug the fuzzer found five of.',
      },
    ],
  },
  keepIfNew: {
    optional: true,
    lang: 'rust',
    title: 'The feedback step',
    prompt: 'Write `keep(seen, path)`, the step a coverage-guided fuzzer takes after every run. `path` lists the blocks the run went through, as numbers, in order. Work out each edge as AFL does: start with `prev = 0`; for each block `cur`, the edge index is `(cur ^ prev) % seen.len()`, and then `prev = cur >> 1`. Set `seen[e] = true` for every edge of the run, and return `true` if at least one of them was not set before.',
    starter: `fn keep(
    seen: &mut [bool],
    path: &[usize],
) -> bool {
    todo!()
}`,
    solution: `// AFL's edge map, one flag per index.
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
}`,
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
        code: `// AFL's edge map, one flag per index.
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
        let e = cur % seen.len();
        if !seen[e] {
            seen[e] = true;
            new = true;
        }
        prev = cur >> 1;
    }
    new
}`,
        why: 'That records blocks, not edges: the same blocks in another order look old, so `same_blocks_in_another_order_are_new` fails.',
      },
      {
        code: `// AFL's edge map, one flag per index.
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
            return true;
        }
        prev = cur >> 1;
    }
    new
}`,
        why: 'Returning at the first new edge leaves the rest of the run unmarked, so the same input looks new the second time.',
      },
      {
        code: `// AFL's edge map, one flag per index.
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
        prev = cur;
    }
    new
}`,
        why: 'Without the shift, 6 then 9 and 9 then 6 mix to the same index (`a ^ b` equals `b ^ a`), so a new edge is missed.',
      },
    ],
  },
  reduceLines: {
    optional: true,
    lang: 'rust',
    title: 'Shrink a failing program',
    prompt: 'Write `reduce(lines, fails)`, the reducer of `fuzz.mjs --reduce`. Start with chunks of half the lines (at least 1). Try deleting each chunk in turn; keep a deletion if `fails` still returns true for what is left, and otherwise move on by one chunk. Repeat the pass until nothing changes, then halve the chunk size, down to 1. Never call `fails` on an empty program, and keep the lines in order.',
    starter: `fn reduce<'a>(
    mut ls: Vec<&'a str>,
    fails: impl Fn(&[&str]) -> bool,
) -> Vec<&'a str> {
    todo!()
}`,
    solution: `// Line-based delta debugging, as in
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
}`,
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
        code: `// Line-based delta debugging, as in
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
                if fails(&c) {
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
}`,
        why: 'It tries the empty program. With a test that always fails it returns nothing at all, which tells you nothing about the bug.',
      },
      {
        code: `// Line-based delta debugging, as in
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
        k /= 2;
        if k <= 1 {
            return ls;
        }
    }
}`,
        why: 'It stops before trying single lines, so a needed line can stay glued to a useless neighbour: `["l3", "l17"]` comes back with extra lines.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A change makes both engines emit the same wrong code for one corpus program. Which layer can catch it?',
    options: [
      {
        t: 'Parity',
        why: 'Parity compares the engines with each other; they agree.',
      },
      {
        t: 'The wasm layer',
        why: 'It compares the wasm build with the same TS fixtures, which hold the same wrong code.',
      },
      {
        t: 'The node differential, which runs the original and the compiled program',
        correct: true,
        why: 'Its oracle is the source program, outside both engines.',
      },
    ],
  },
  {
    q: 'What does a coverage-guided fuzzer do with an input whose run reached no new edge?',
    options: [
      {
        t: 'Keeps it, so the corpus stays varied',
        why: 'The opposite: inputs that add no coverage are thrown away.',
      },
      {
        t: 'Throws it away',
        correct: true,
        why: 'Only inputs that reach new coverage are kept and mutated further.',
      },
      {
        t: 'Reports it as a bug',
        why: 'A bug is a crash or a disagreement with an oracle, not a lack of new coverage.',
      },
      {
        t: 'Shrinks it with the reducer',
        why: 'Reduction is for failing inputs, not for uninteresting ones.',
      },
    ],
  },
  {
    q: 'Run 1 goes A→B→C→D and run 2 goes A→C→B→D. What does an edge counter see in run 2?',
    options: [
      {
        t: 'Nothing new, since the blocks are the same',
        why: 'That is what a block counter sees.',
      },
      {
        t: 'New edges: A→C, C→B and B→D',
        correct: true,
        why: 'Run 1’s edges were A→B, B→C and C→D; none of run 2’s three edges is among them.',
      },
      {
        t: 'Only one new edge, A→C',
        why: 'C→B and B→D were not taken in run 1 either.',
      },
    ],
  },
  {
    q: 'Which statement about Viscosity’s fuzzer, `scripts/fuzz.mjs`, is accurate?',
    options: [
      {
        t: 'It mutates the corpus programs byte by byte',
        why: 'It writes each program from a seed; it changes no files.',
      },
      {
        t: 'It is guided by V8’s coverage',
        why: 'Nothing measured in a run feeds back into the generator.',
      },
      {
        t: 'It writes valid programs from a seed, with no feedback from runs',
        correct: true,
        why: 'Generation-based, like Csmith.',
      },
    ],
  },
  {
    q: 'Before the fix, Viscosity compiled `ls[1].a = (ls.push({ a: 0, b: 0 }), 7)` to a plain column store, `ls.a[i] = (…)`, and the `7` was lost when the push grew the container. Why?',
    options: [
      {
        t: 'The push threw an error',
        why: 'The push worked; it is what caused the trouble.',
      },
      {
        t: 'JavaScript found the column `ls.a` first, then the push grew the collection into a new column, and the 7 went into the old one',
        correct: true,
        why: 'The target of an assignment is worked out before its right-hand side runs.',
      },
      {
        t: 'The bounds check rejected index 1',
        why: 'Index 1 was in bounds.',
      },
    ],
  },
];
