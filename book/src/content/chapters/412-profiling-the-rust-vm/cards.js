// Chapter 412 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

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
    let r = parse_row(
        "1,247,700,494 (22.30%)  \\
         /src/vm.rs:<drip::vm::Vm>::run \\
         [/tmp/x/drip-rs]",
    )
    .unwrap();
    assert_eq!(r.ir, 1_247_700_494);
    assert_eq!(r.pct, 22.30);
    assert_eq!(r.name,
        "/src/vm.rs:<drip::vm::Vm>::run");
}

#[test]
fn percent_with_a_space_inside() {
    let r = parse_row(
        "  211,474,680 ( 3.78%)  \\
         ???:<drip::vm::Vm>::read_string \\
         [/tmp/x/drip-rs]",
    )
    .unwrap();
    assert_eq!(r.ir, 211_474_680);
    assert_eq!(r.pct, 3.78);
    assert_eq!(r.name,
        "<drip::vm::Vm>::read_string");
}

#[test]
fn totals_and_rows_without_a_binary() {
    let t = parse_row(
        "5,593,942,673 (100.0%)  \\
         PROGRAM TOTALS",
    )
    .unwrap();
    assert_eq!(t.ir, 5_593_942_673);
    assert_eq!(t.name, "PROGRAM TOTALS");
    let r = parse_row(
        "  592,129,066 (10.59%)  \\
         /lib/vec/mod.rs:<drip::vm::Vm>::run",
    )
    .unwrap();
    assert_eq!(r.name,
        "/lib/vec/mod.rs:<drip::vm::Vm>::run");
}

#[test]
fn headers_are_not_rows() {
    assert_eq!(parse_row(
        "Ir                      file:function"),
        None);
    assert_eq!(parse_row("----------------"),
        None);
    assert_eq!(parse_row(""), None);
}

#[test]
fn sums_one_function_across_files() {
    let text = "\\
1,247,700,494 (22.30%)  /src/vm.rs:<drip::vm::Vm>::run [/b]
  592,129,066 (10.59%)  /lib/vec/mod.rs:<drip::vm::Vm>::run
  408,850,961 ( 7.31%)  /src/vm.rs:<drip::vm::Vm>::pop_numbers [/b]
  496,965,445 ( 8.88%)  /lib/slice/index.rs:<drip::vm::Vm>::run";
    let rows: Vec<Row> =
        text.lines().filter_map(parse_row).collect();
    assert_eq!(rows.len(), 4);
    assert_eq!(sum_named(&rows, "Vm>::run"),
        2_336_795_005);
    assert_eq!(sum_named(&rows, "pop_numbers"),
        408_850_961);
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
    q: 'How does a sampling profiler find where time goes, and how is callgrind different?',
    a: 'A sampling profiler records the call stack many times a second; callgrind runs the program on a simulated CPU and counts every instruction.',
  },
  'cg-not-time': {
    q: 'Why is a callgrind instruction count not a time?',
    a: 'It treats every instruction the same, ignoring cache misses, mispredicted branches and how much the CPU overlaps; two loops with very different counts can take the same time.',
  },
  'self-incl': {
    q: 'What is the difference between a function’s **self** cost and its **inclusive** cost?',
    a: 'Self counts only its own instructions. Inclusive adds everything it called, directly or indirectly.',
  },
  'call-check': {
    q: 'callgrind said `call_value` ran 7,049,155 times during fib(32). Why is that a good sign?',
    a: 'fib(32) makes exactly 2 × fib(33) − 1 = 7,049,155 calls, so the profile counted what we can work out by hand.',
  },
  'inlined': {
    q: 'Why does `Vm::run` have 65.2% self cost in fib, with no rows of their own for `push` or `read_byte`?',
    a: 'The release build (with `lto`) inlined those small functions into `run`, so their instructions count as `run`’s. Debug info lets callgrind split them out again by source line.',
  },
  'flame-what': {
    q: 'In a **flame graph**, what do a box’s width and its height above the bottom mean?',
    a: 'Width: the share of the cost spent in that function on that call path (inclusive). Height: how deep in the call stack it is.',
  },
  'flame-x': {
    q: 'Does left-to-right order mean anything in a flame graph?',
    a: 'No. It is not time order; boxes are only arranged so that identical call paths merge.',
  },
  'flame-flat': {
    q: 'fib recurses about thirty levels deep in Drip. Why is drip-rs’s flame graph for it only a few boxes tall?',
    a: 'A Drip call is a frame on the VM’s own stack, not a Rust call; the Rust stack is just run → call_value → call.',
  },
};

export const examples = {
  stopwatch: {
    lang: 'drip-vm',
    title: 'A stopwatch profiler',
    code: `let t = clock();
let s = 0;
for i in 0..20000 {
  s += i % 7;
}
let a = clock() - t;
t = clock();
let txt = "";
for i in 0..20000 {
  txt = str(i);
}
let b = clock() - t;
print b > a; # usually true: str is slow
print s;`,
  },
};

export const exercises = {
  annotate: {
    lang: 'rust',
    title: 'Read callgrind_annotate’s output',
    prompt:
      'Write `parse_row(line)`, which turns one line of `callgrind_annotate` output into a `Row`, or returns `None` for anything else (headers, rules of dashes, blank lines). A row is: the instruction count with commas, then the percentage in parentheses (there may be a space after `(`), then the name. Clean the name: drop a trailing ` [binary path]` if there is one, and a leading `???:`. Then write `sum_named(rows, needle)`, which adds up the `ir` of every row whose name contains `needle`. With debug info, one inlined function is split across many files (`vm.rs`, `vec/mod.rs`, `slice/index.rs`...), and this puts it back together, as this chapter did for `Vm::run`.',
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
      'Every row starts with a number. `line.trim().split_once(\' \')?` splits it off; remove the commas with `replace(\',\', "")` and parse it as a `u64`, with `.ok()?` turning a failure into `None`. That one step already rejects headers and rules.',
      'After the number: `trim_start`, then `strip_prefix(\'(\')?`, then `split_once("%)")?` gives the percentage text and the rest. The percentage may be `" 3.78"`, so trim it before parsing it as an `f64`.',
      'For the name, `rest.trim()`, then `if let Some(i) = name.find(" [") { name = &name[..i]; }` drops the binary, and `name.strip_prefix("???:").unwrap_or(name)` drops the unknown-file marker. `sum_named` is `rows.iter().filter(...).map(|r| r.ir).sum()`.',
    ],
    walkthrough: `**How to think about it.** A row has three parts in a fixed order: a number, a percentage in brackets, a name. Rather than recognise headers and rules one by one, parse the three parts in order and let any part that is missing reject the line. In Rust that is what \`?\` on an \`Option\` is for: each step returns \`None\` early if its piece is not there, so the function needs no list of special cases.

**The solution, line by line.**

- \`let line = line.trim();\` removes the padding callgrind_annotate puts before small numbers (\`  211,474,680\`).
- \`let (num, rest) = line.split_once(' ')?;\` splits at the first space. A blank line has no space, so it is \`None\` here.
- \`let ir: u64 = num.replace(',', "").parse().ok()?;\` drops the thousands commas and parses the number. \`Ir\` (the header) and a rule of dashes are not numbers, so they fail here.
- \`let rest = rest.trim_start();\` and \`let rest = rest.strip_prefix('(')?;\` skip the spaces and the opening bracket.
- \`let (pct, rest) = rest.split_once("%)")?;\` splits off the percentage text, and \`let pct: f64 = pct.trim().parse().ok()?;\` parses it. The \`trim\` matters: the percentage is padded to a fixed width, \`( 3.78%)\`, and \`" 3.78".parse::<f64>()\` fails.
- \`let mut name = rest.trim();\` is what is left. \`if let Some(i) = name.find(" [") { name = &name[..i]; }\` cuts off the binary's path in square brackets, if the row has one (rows for inlined code do not).
- \`let name = name.strip_prefix("???:").unwrap_or(name);\` drops the marker callgrind uses when it knows the function but not its file; \`unwrap_or(name)\` keeps names that have a real file.
- \`Some(Row { ir, pct, name })\`, with \`name\` made into an owned \`String\` first, returns the row.
- \`sum_named\` filters the rows whose name contains the needle and sums their \`ir\`: in the chapter's profile, the rows for \`Vm::run\` from \`vm.rs\`, \`vec/mod.rs\`, \`slice/index.rs\` and the rest add up to its 65.2% self cost.

**Common wrong attempts.**

- Parsing the percentage without \`trim\` loses every row under 10%, because of the padding space.
- Forgetting to strip \`???:\` and \`[binary]\` leaves names that never equal the clean function name.
- Splitting on whitespace with \`split_whitespace\` and taking the third piece breaks on names that contain spaces, such as \`PROGRAM TOTALS\`.`,
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
        why: 'The percentage is padded: `( 3.78%)` leaves `" 3.78"`, which `parse` rejects, so every row under 10% disappears. Trim it first.',
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
        why: 'The name keeps its `???:` prefix and its `[binary]` suffix, so it never equals the clean name the tests expect.',
      },
    ],
  },
  fold: {
    lang: 'rust',
    optional: true,
    title: 'Folded stacks to flame-graph widths',
    prompt:
      'flamegraph.pl reads **folded stacks**: one line per distinct call path, frames joined by `;`, then a count. Write `inclusive(folded)`, which returns the width of every box: for each path *prefix* (such as `"main;run"`), the sum of the counts of every line that starts with that prefix. The test data are fib’s self costs from this chapter’s callgrind run.',
    starter: `use std::collections::HashMap;

fn inclusive(folded: &[(&str, u64)])
    -> HashMap<String, u64> {
    HashMap::new()
}`,
    solution: FOLD,
    tests: `#[test]
fn fib_widths() {
    let f = [
        ("main;run", 3_647_937_915),
        ("main;run;call_value", 204_425_495),
        ("main;run;call_value;call", 570_981_555),
        ("main;run;pop_numbers", 578_030_669),
        ("main;run;Table::get", 338_359_440),
        ("main;run;read_string", 211_474_680),
        ("main;run;close_upvalues", 42_294_936),
    ];
    let w = inclusive(&f);
    assert_eq!(w["main;run;call_value"], 775_407_050);
    assert_eq!(w["main;run;call_value;call"], 570_981_555);
    assert_eq!(w["main"], 5_593_504_690);
    assert_eq!(w["main;run"], w["main"]);
    assert_eq!(w.len(), 8);
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
      'Each line adds its count to every box on its path, from the bottom frame up. Walk the path with `split(\';\')`.',
      'Build the prefix in a `String` as you go: push a `;` (except before the first frame), then the frame.',
      'After adding each frame, add the count to `out[prefix]` with `*out.entry(path.clone()).or_insert(0) += n;`.',
    ],
    walkthrough: `**How to think about it.** A folded line such as \`main;run;call_value 204425495\` says "this many units were spent with exactly this stack". Every box on that stack (\`main\`, \`main;run\`, \`main;run;call_value\`) was on the stack for those units, so each box's width is the sum over every line that passes through it. The key is the whole *prefix*, not the function name.

**The solution, line by line.**

- \`let mut out = HashMap::new();\` will map each prefix to its width.
- \`for &(stack, n) in folded\` takes each line: its path and its count.
- \`let mut path = String::new();\` starts the prefix empty for this line.
- \`for f in stack.split(';')\` walks the frames from the bottom up. \`if !path.is_empty() { path.push(';'); }\` adds the separator before every frame but the first, and \`path.push_str(f);\` extends the prefix.
- \`*out.entry(path.clone()).or_insert(0) += n;\` adds the count to this prefix's box, creating it at 0 the first time. \`clone\` is needed because the map keeps its own copy of the key while \`path\` keeps growing.
- \`out\` is returned.

With the fib data, \`main;run;call_value\` collects its own 204,425,495 and its child's 570,981,555, which is callgrind's inclusive 775,407,050 exactly; \`main\` collects everything, 5,593,504,690, a little under the program total because start-up and printing are left out of the test.

**Common wrong attempts.**

- Keying by the function name (\`f\`) instead of the prefix merges \`get\` reached from \`a\` with \`get\` reached through \`inv\`, and keys like \`"main;run"\` never appear: a flame graph merges identical *stacks*, not identical functions.`,
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
        why: 'This keys by function name, not by path prefix, so the two `get` boxes merge into one, and keys such as `"main;run"` never appear.',
      },
    ],
  },
};
export const quiz = [
  {
    q: 'callgrind reports `Table::get` at 6.0% of fib’s instructions. What can you conclude about time?',
    options: [
      { t: 'It took exactly 6.0% of the running time', why: 'Instruction counts ignore cache misses, mispredicted branches and overlap, so time shares can differ.' },
      { t: 'It is a good first guess at its share of time, to be checked with a timing', correct: true, why: 'Counts point you at code worth a look; only a before-and-after timing says whether changing it helps.' },
      { t: 'Nothing, because callgrind runs about seventy times slower', why: 'The slowdown does not change the counts: they are the instructions the program runs natively.' },
    ],
  },
  {
    q: '`call_value` has inclusive cost 13.9% and self cost 3.7% in fib. Where did the other 10.2% go?',
    options: [
      { t: 'Into the functions that called it', why: 'A caller’s cost is never part of a function’s inclusive cost.' },
      { t: 'Into the functions it called, here `call`', correct: true, why: 'Inclusive = self + callees, and `call` is 10.2%.' },
      { t: 'Into callgrind itself', why: 'callgrind does not count its own simulation in the program’s events.' },
    ],
  },
  {
    q: 'Why is drip-rs’s lead over the TypeScript VM so much smaller on `strings.drip` than on fib?',
    options: [
      { t: 'Its dispatch loop is slower on strings', why: 'The loop’s own share is only 17.9% there; most of the cost is elsewhere.' },
      { t: 'Its garbage collector runs constantly', why: 'Collection does not appear near the top of the profile.' },
      { t: 'Most of the program is spent formatting numbers into text and allocating strings, in library code', correct: true, why: '`format_number` alone is 48.2% of the instructions, and malloc and free are near the top.' },
    ],
  },
  {
    q: 'In a flame graph, one box sits on top of `run` and is 10% of the width. What is it?',
    options: [
      { t: 'A function that ran for 10% of the time, starting at that point of the timeline', why: 'The x axis is not time.' },
      { t: 'A function 10% of whose instructions were inlined into `run`', why: 'Inlined code has no box: it is part of `run`’s own bare top.' },
      { t: 'A function called by `run`, which, with its callees, took 10% of the cost', correct: true, why: 'Width is the inclusive cost on that call path.' },
    ],
  },
  {
    q: 'Why is a callgrind count more useful than a timing for comparing two builds on this book’s machine?',
    options: [
      { t: 'It is deterministic: other users of the shared machine cannot change how many instructions your program runs', correct: true, why: 'Timings here vary by tens of percent; counts vary by a few dozen instructions in billions.' },
      { t: 'It is always the same as the time', why: 'It is not; a change can save instructions and no time, as the next chapter shows.' },
      { t: 'It runs faster than the program', why: 'It runs about seventy times slower.' },
    ],
  },
];
