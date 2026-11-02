// Chapter 253 cards. Keys are stable ids: never rename them.

const ROW = `// A line of callgrind_annotate output.
#[derive(Debug, PartialEq)]
struct Row {
    ir: u64,
    pct: f64,
    name: String,
}
`;

const PARSE = `fn parse_row(line: &str)
    -> Option<Row> {
    let line = line.trim();
    let (num, rest) =
        line.split_once(' ')?;
    let ir: u64 = num
        .replace(',', "")
        .parse()
        .ok()?;
    let rest = rest.trim_start();
    let rest = rest.strip_prefix('(')?;
    let (pct, rest) =
        rest.split_once("%)")?;
    let pct: f64 =
        pct.trim().parse().ok()?;
    let mut name = rest.trim();
    if let Some(i) = name.find(" [") {
        name = &name[..i];
    }
    let name = name
        .strip_prefix("???:")
        .unwrap_or(name);
    let name = name.to_string();
    Some(Row { ir, pct, name })
}
`;

const SUM = `// Add up every row whose name contains
// \`needle\`: one function, many files.
fn sum_named(rows: &[Row], needle: &str)
    -> u64 {
    rows.iter()
        .filter(|r| {
            r.name.contains(needle)
        })
        .map(|r| r.ir)
        .sum()
}
`;

const TESTS = `#[test]
fn parses_a_function_row() {
    let r = parse_row("15,676,869,738 (77.66%)  ???:<drip::vm::Vm>::run [/tmp/ch165/target/release/drip-rs]").unwrap();
    assert_eq!(r.ir, 15_676_869_738);
    assert_eq!(r.pct, 77.66);
    assert_eq!(r.name, "<drip::vm::Vm>::run");
}

#[test]
fn percent_with_a_space_inside() {
    let r = parse_row(" 1,194,428,240 ( 5.92%)  ???:<drip::table::Table>::get [/tmp/x/drip-rs]").unwrap();
    assert_eq!(r.ir, 1_194_428_240);
    assert_eq!(r.pct, 5.92);
    assert_eq!(r.name, "<drip::table::Table>::get");
}

#[test]
fn totals_and_rows_without_a_binary() {
    let t = parse_row("20,186,274,402 (100.0%)  PROGRAM TOTALS").unwrap();
    assert_eq!(t.ir, 20_186_274_402);
    assert_eq!(t.name, "PROGRAM TOTALS");
    let r = parse_row("2,911,418,677 (14.42%)  /rustc/2d81/library/alloc/src/vec/mod.rs:<drip::vm::Vm>::run").unwrap();
    assert_eq!(r.name, "/rustc/2d81/library/alloc/src/vec/mod.rs:<drip::vm::Vm>::run");
}

#[test]
fn headers_are_not_rows() {
    assert_eq!(parse_row("Ir                      file:function"), None);
    assert_eq!(parse_row("--------------------------------------"), None);
    assert_eq!(parse_row(""), None);
}

#[test]
fn sums_one_function_across_files() {
    let text = "6,464,842,447 (32.03%)  /src/vm.rs:<drip::vm::Vm>::run [/b]
2,911,418,677 (14.42%)  /lib/vec/mod.rs:<drip::vm::Vm>::run
1,074,985,340 ( 5.33%)  /src/vm.rs:<drip::vm::Vm>::call [/b]
2,523,229,490 (12.50%)  /lib/slice/index.rs:<drip::vm::Vm>::run";
    let rows: Vec<Row> = text.lines().filter_map(parse_row).collect();
    assert_eq!(rows.len(), 4);
    assert_eq!(sum_named(&rows, "Vm>::run"), 11_899_490_614);
    assert_eq!(sum_named(&rows, "Vm>::call"), 1_074_985_340);
}`;

const FOLD = `use std::collections::HashMap;

// Inclusive cost of every stack prefix.
fn inclusive(folded: &[(&str, u64)])
    -> HashMap<String, u64> {
    let mut out = HashMap::new();
    for &(stack, n) in folded {
        let mut path = String::new();
        for f in stack.split(';') {
            if !path.is_empty() {
                path.push(';');
            }
            path.push_str(f);
            *out.entry(path.clone())
                .or_insert(0) += n;
        }
    }
    out
}
`;

export const prompts = {
  'prof-what': {
    q: 'What is **profiling**?',
    a: 'Measuring where a program’s time (or instructions, or memory) goes, function by function or line by line, instead of timing it as a whole.',
  },
  'prof-sample': {
    q: 'How does a sampling profiler such as `perf` find where time goes?',
    a: 'It interrupts the program many times a second and records the call stack each time. Functions that are on the stack more often took more time.',
  },
  'cg-ir': {
    q: 'What does callgrind count by default?',
    a: 'Instructions executed (the event `Ir`), attributed to functions and source lines, plus who called whom and how often.',
  },
  'cg-not-time': {
    q: 'Why is a callgrind instruction count not a time?',
    a: 'It ignores cache misses, branch mispredictions and how many instructions the CPU overlaps. Two loops with very different counts can take the same time.',
  },
  'cg-slow': {
    q: 'About how much slower did drip-rs run fib under callgrind on the book’s VM?',
    a: 'About 60×: 88.6 s instead of about 1.4 s. The program runs on a simulated CPU.',
  },
  'self-incl': {
    q: 'What is the difference between a function’s **self** cost and its **inclusive** cost?',
    a: 'Self counts only its own instructions. Inclusive adds everything it called, directly or indirectly.',
  },
  'call-check': {
    q: 'callgrind said `call_value` ran 29,860,705 times during fib(35). Why is that a good sign?',
    a: 'fib(35) makes 29,860,703 Drip calls, plus two calls to `clock()`. The profile counted exactly what we can compute by hand.',
  },
  'inlined': {
    q: 'Why does `Vm::run` have 77.7% self cost, with no boxes for `push` or `read_byte`?',
    a: 'The release build inlined those small functions into `run`, so their instructions belong to `run`. Line tables (debug info) bring the source lines back.',
  },
  'flame-what': {
    q: 'In a **flame graph**, what do a box’s width and its height above the bottom mean?',
    a: 'Width: the share of samples (or cost) in which that function was on the stack at that place. Height: how deep in the call stack it is.',
  },
  'flame-x': {
    q: 'Does left-to-right order mean anything in a flame graph?',
    a: 'No. It isn’t time order; flamegraph.pl just sorts the frames alphabetically so equal stacks merge.',
  },
  'flame-two': {
    q: 'In zoo.drip, `Table::get` has 27.0% self cost but no single box that wide. Why?',
    a: 'It is called from two places, `run` (21.7%) and `invoke_from_class` (5.3%), so it appears as two boxes on two stacks.',
  },
  'flame-flat': {
    q: 'fib is deeply recursive in Drip. Why is drip-rs’s flame graph only four boxes tall?',
    a: 'Drip calls are frames on the VM’s own stack, not Rust calls. The Rust stack is just main → run → call_value → call.',
  },
};

export const examples = {
  'count-ops': {
    lang: 'rust',
    title: 'Profiling by counting: a toy VM tallies its opcodes',
    code: `#[derive(Clone, Copy, Debug)]
enum Op {
    Push(f64),
    Add,
    Jump(usize),
    Halt,
}

fn add(st: &mut Vec<f64>) {
    let b = st.pop().expect("b");
    let a = st.pop().expect("a");
    st.push(a + b);
}

fn main() {
    // A loop that never ends by itself:
    // the counter stops it.
    let code = [
        Op::Push(1.0),
        Op::Push(2.0),
        Op::Add,
        Op::Jump(0),
        Op::Halt,
    ];
    let mut counts = [0u64; 4];
    let mut st: Vec<f64> = vec![];
    let mut ip = 0;
    for _ in 0..1000 {
        let op = code[ip];
        ip += 1;
        let k = match op {
            Op::Push(_) => 0,
            Op::Add => 1,
            Op::Jump(_) => 2,
            Op::Halt => 3,
        };
        counts[k] += 1;
        match op {
            Op::Push(v) => st.push(v),
            Op::Add => add(&mut st),
            Op::Jump(t) => {
                st.clear();
                ip = t;
            }
            Op::Halt => break,
        }
    }
    let total: u64 =
        counts.iter().sum();
    let names =
        ["Push", "Add", "Jump", "Halt"];
    for k in 0..4 {
        let n = names[k];
        let c = counts[k];
        let p = 100.0 * c as f64
            / total as f64;
        println!("{n:5}{c:5}{p:6.1}%");
    }
}`,
  },
};

export const exercises = {
  annotate: {
    lang: 'rust',
    title: 'Read callgrind_annotate’s output',
    prompt:
      'Write `parse_row(line)`, which turns one line of `callgrind_annotate` output into a `Row`, or returns `None` for anything else (headers, rules, blank lines). A row is: the instruction count with commas, then the percentage in parentheses (there may be a space after `(`), then the name. Clean the name: drop a trailing ` [binary path]` if there is one, and a leading `???:`. Then write `sum_named(rows, needle)`, which adds up the `ir` of every row whose name contains `needle`. With line tables, one function is split across many files, and this puts it back together.',
    starter: `${ROW}
fn parse_row(line: &str)
    -> Option<Row> {
    todo!()
}

fn sum_named(rows: &[Row], needle: &str)
    -> u64 {
    todo!()
}`,
    solution: `${ROW}
${PARSE}
${SUM}`,
    tests: TESTS,
    hints: [
      '`split_once(\' \')` splits off the number. Remove the commas with `replace(\',\', "")` and parse it as a `u64`; `.ok()?` turns a parse failure into `None`.',
      'After the number, trim, then `strip_prefix(\'(\')`. `split_once("%)")` gives the percentage text and the rest. Trim the percentage before parsing it: it may be `" 5.92"`.',
      'For the name, `find(" [")` locates the binary path; slice it off. `strip_prefix("???:").unwrap_or(name)` keeps names that have a real file instead.',
    ],
    walkthrough: `The format has three parts, and each \`?\` says “if this part isn’t here, it isn’t a row”:

\`\`\`rust
let (num, rest) = line.split_once(' ')?;
let ir: u64 = num.replace(',', "").parse().ok()?;
let rest = rest.trim_start().strip_prefix('(')?;
let (pct, rest) = rest.split_once("%)")?;
let pct: f64 = pct.trim().parse().ok()?;
\`\`\`

A header such as \`Ir   file:function\` fails at the first \`parse\`, because \`Ir\` isn’t a number, and a rule of dashes fails the same way. So the function rejects everything that isn’t a row without a list of special cases.

The percentage needs \`trim\` because callgrind_annotate pads it to a fixed width: \`( 5.92%)\`. That is the detail people miss.

\`sum_named\` is a filter and a sum. It matters with a line-table build: callgrind_annotate prints \`file:function\` pairs, and the instructions of \`Vec::push\` inlined into \`run\` are listed under \`vec/mod.rs:<drip::vm::Vm>::run\`. Summing every row whose name contains \`Vm>::run\` gives back the function-level view. In the chapter’s run, the rows for \`run\` add up to 77.6% of the program, the same self cost the build without line tables reported for it.`,
    wrong: [
      {
        code: `${ROW}
fn parse_row(line: &str)
    -> Option<Row> {
    let line = line.trim();
    let (num, rest) =
        line.split_once(' ')?;
    let ir: u64 = num
        .replace(',', "")
        .parse()
        .ok()?;
    let rest = rest.trim_start();
    let rest = rest.strip_prefix('(')?;
    let (pct, rest) =
        rest.split_once("%)")?;
    let pct: f64 = pct.parse().ok()?;
    let mut name = rest.trim();
    if let Some(i) = name.find(" [") {
        name = &name[..i];
    }
    let name = name
        .strip_prefix("???:")
        .unwrap_or(name);
    let name = name.to_string();
    Some(Row { ir, pct, name })
}

${SUM}`,
        why: 'The percentage is padded: `( 5.92%)` leaves `" 5.92"`, which `parse` rejects, so every row under 10% disappears. Trim it first.',
      },
      {
        code: `${ROW}
fn parse_row(line: &str)
    -> Option<Row> {
    let line = line.trim();
    let (num, rest) =
        line.split_once(' ')?;
    let ir: u64 = num
        .replace(',', "")
        .parse()
        .ok()?;
    let rest = rest.trim_start();
    let rest = rest.strip_prefix('(')?;
    let (pct, rest) =
        rest.split_once("%)")?;
    let pct: f64 =
        pct.trim().parse().ok()?;
    let name = rest.trim();
    let name = name.to_string();
    Some(Row { ir, pct, name })
}

${SUM}`,
        why: 'The name keeps its `???:` prefix and the `[binary]` suffix, so it never equals the clean function name the tests expect.',
      },
    ],
  },
  fold: {
    lang: 'rust',
    optional: true,
    title: 'Folded stacks to flame-graph widths',
    prompt:
      'flamegraph.pl reads **folded stacks**: one line per distinct stack, frames joined by `;`, then a count. Write `inclusive(folded)`, which returns the width of every box: for each stack *prefix* (such as `"main;run"`), the sum of the counts of every line that starts with that prefix. The test data are fib’s self costs from the chapter’s callgrind run.',
    starter: `use std::collections::HashMap;

fn inclusive(folded: &[(&str, u64)])
    -> HashMap<String, u64> {
    HashMap::new()
}`,
    solution: FOLD,
    tests: `#[test]
fn fib_widths() {
    let f = [
        ("main;run", 15_676_869_738),
        ("main;run;call_value", 716_657_004),
        ("main;run;call_value;call", 2_418_717_018),
        ("main;run;Table::get", 1_194_428_240),
        ("main;run;close_upvalues", 179_164_224),
    ];
    let w = inclusive(&f);
    assert_eq!(w["main;run;call_value"], 3_135_374_022);
    assert_eq!(w["main;run;call_value;call"], 2_418_717_018);
    assert_eq!(w["main"], 20_185_836_224);
    assert_eq!(w["main;run"], w["main"]);
    assert_eq!(w.len(), 6);
}

#[test]
fn same_function_two_paths_two_boxes() {
    let f = [("a;get", 5), ("a;inv;get", 2), ("a;inv", 1)];
    let w = inclusive(&f);
    assert_eq!(w["a;get"], 5);
    assert_eq!(w["a;inv;get"], 2);
    assert_eq!(w["a;inv"], 3);
    assert_eq!(w["a"], 8);
}`,
    hints: [
      'Walk each stack with `split(\';\')`, building the prefix in a `String` as you go.',
      'After adding each frame to the prefix, add the line’s count to `out[prefix]` with `entry(..).or_insert(0)`.',
    ],
    walkthrough: `Every line contributes its count to each box on its stack, from the bottom frame to the top:

\`\`\`rust
for f in stack.split(';') {
    if !path.is_empty() { path.push(';'); }
    path.push_str(f);
    *out.entry(path.clone()).or_insert(0) += n;
}
\`\`\`

The key is the whole prefix, not the function name. That is why \`get\` reached from \`a\` and \`get\` reached through \`inv\` stay two boxes: a flame graph merges identical *stacks*, not identical functions. A box’s width minus the widths of the boxes on top of it is the self count, which is exactly what each folded line recorded.

The fib totals come out a little short of callgrind’s own inclusive numbers (99 instructions for \`call_value\`, 5,368 for \`run\`), because the test leaves out tiny callees such as \`clock\` and number printing.`,
    wrong: [
      {
        code: `use std::collections::HashMap;

fn inclusive(folded: &[(&str, u64)])
    -> HashMap<String, u64> {
    let mut out = HashMap::new();
    for &(stack, n) in folded {
        for f in stack.split(';') {
            *out.entry(f.to_string())
                .or_insert(0) += n;
        }
    }
    out
}`,
        why: 'This keys by function name, not by stack prefix, so the two `get` boxes merge into one, and keys such as `"main;run"` never appear.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'callgrind reports `Table::get` at 5.92% of fib’s instructions. What can you conclude about time?',
    options: [
      { t: 'It took exactly 5.92% of the wall-clock time', why: 'Instruction counts ignore cache misses, mispredicted branches and overlap, so time shares can differ.' },
      { t: 'It is a good first guess for its share of time, to be checked against a timing', correct: true, why: 'Counts point you at code worth a look. Only a before-and-after timing says whether changing it helps.' },
      { t: 'Nothing, because callgrind is too slow to be useful', why: 'The slowdown doesn’t distort the counts: they are the same instructions the program would run natively.' },
    ],
  },
  {
    q: 'Two callgrind runs of zoo.drip reported 7,528,846,449 and 7,528,846,360 instructions. What does that show?',
    options: [
      { t: 'The machine was noisy', why: 'Wall-clock times of the same program varied by 25% on this VM; these counts differ by about one in a hundred million.' },
      { t: 'Instruction counts are nearly deterministic, so tiny differences between builds can be compared', correct: true, why: 'That is callgrind’s great strength on a shared machine: other tenants can’t change how many instructions your program runs.' },
      { t: 'The second run was faster', why: 'Fewer instructions isn’t the same as less time, and 89 out of 7.5 billion is nothing anyway.' },
    ],
  },
  {
    q: 'A function’s inclusive cost is 15.5% and its self cost is 3.6%. Where did the other 11.9% go?',
    options: [
      { t: 'Into the functions it called', correct: true, why: 'Inclusive = self + callees. For `call_value`, nearly all of it is `call`.' },
      { t: 'Into the functions that called it', why: 'Callers’ costs are never part of a function’s inclusive cost.' },
      { t: 'Into callgrind itself', why: 'callgrind doesn’t count its own simulation in the program’s events.' },
      { t: 'Into the operating system', why: 'callgrind counts user-space instructions of the program; the kernel isn’t simulated.' },
    ],
  },
  {
    q: 'In a flame graph, one box sits on top of `run` and is 6% of the width. What is it?',
    options: [
      { t: 'A function that ran for 6% of the time, starting at that point of the timeline', why: 'The x axis isn’t time. Order is alphabetical in flamegraph.pl.' },
      { t: 'A function that was called by `run` in 6% of the samples (or cost)', correct: true, why: 'Width is the share of stacks in which that function sat right on top of `run`.' },
      { t: 'A function 6% of whose instructions were inlined into `run`', why: 'Inlined code has no box at all: it is part of `run`’s own width.' },
    ],
  },
  {
    q: 'Why does the release build’s profile show only five functions for all of fib?',
    options: [
      { t: 'callgrind skips small functions', why: 'It counts every instruction; callgrind_annotate only hides rows below a threshold.' },
      { t: 'drip-rs has only five functions', why: 'vm.rs alone defines dozens: `push`, `pop`, `read_byte`, `peek` …' },
      { t: 'With `lto` and inlining, the small helpers became part of `run`, `call` and the rest', correct: true, why: 'To see them again, build with line tables (`CARGO_PROFILE_RELEASE_DEBUG=line-tables-only`) and read costs per source line.' },
    ],
  },
  {
    q: 'Which of these would show you *which Drip function* is slow, rather than which part of drip-rs?',
    options: [
      { t: 'A flame graph of drip-rs from `perf`', why: 'It would show the Rust stack, which is flat: Drip calls live on the VM’s own frame st.' },
      { t: 'Counting instructions or time per Drip function inside the VM itself', correct: true, why: 'Only the VM knows which Drip function is running. That is instrumentation, as in chapter 163, and drip-rs doesn’t do it.' },
      { t: 'Running the Drip program twice and comparing', why: 'That times the whole program, not its parts.' },
    ],
  },
];
