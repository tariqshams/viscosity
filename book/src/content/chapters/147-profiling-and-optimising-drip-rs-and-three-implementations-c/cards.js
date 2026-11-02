// Chapter 78 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 147, 147, 147, 147.

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
  inlined: {
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
  'opt-measure-first': {
    q: 'What should you have in hand before changing code to make it faster?',
    a: 'A profile that says where the work is, the corpus to prove the change is still correct, and a timing method to check the change afterwards.',
  },
  'uc-what': {
    q: 'What does a bounds check do on `code[ip]`?',
    a: 'Compares `ip` with `code.len()` before reading, and panics if `ip` is too big.',
  },
  'uc-forbid': {
    q: 'What happens if you put `get_unchecked` into drip-rs as it is?',
    a: 'It does not compile: `#![forbid(unsafe_code)]` in `lib.rs` makes any `unsafe` block an error.',
  },
  'uc-promise': {
    q: 'An unchecked `read_byte` in drip-rs is safe only if what is true?',
    a: 'That the compiler never lets `ip` run past the end of a chunk: every function ends with `return` and every jump lands inside it. A promise about the compiler, which a compiler bug would break.',
  },
  'uc-worth': {
    q: 'On fib, what did an unchecked `read_byte` save, in instructions and in time?',
    a: 'About 8% of instructions (5.11 vs 5.55 billion), but no measurable time: best 406 ms against the committed 398 ms, medians 439 and 427.',
  },
  'reg-win': {
    q: 'What happened to fib when a copy of drip-rs reached the chunk through the heap on every read, instead of using the chunk register?',
    a: 'Almost twice the instructions (11.01 billion) and about 2.1 times the time (best 842 ms against 398).',
  },
  'fewer-not-faster': {
    q: 'Why can removing 8% of instructions save no time?',
    a: 'The removed instructions were a comparison and a branch that the CPU predicted correctly every time and ran alongside other work, so they were not what each byte was waiting on.',
  },
  'fast-int': {
    q: 'Why is `(n as i64).to_string()` a correct way to print a whole number below 2^53?',
    a: 'Every whole number below 2^53 is exact in an `f64` and converts exactly to `i64`, and JavaScript prints such numbers as plain digits, so the text is the same.',
  },
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
  'rt-goal': {
    q: 'What goal did Part XII set for drip-rs, and does it meet it?',
    a: 'To behave exactly like the TypeScript VM: same output, errors, lines and exit codes. It does: 334 corpus tests, 165 stress-GC programs, and no differences from the TypeScript VM on 343 corpus and 2,000 mangled programs.',
  },
  'rt-ledger': {
    q: 'Name one gain and one cost of the port to Rust.',
    a: 'Gains: about 3.94× the TypeScript VM’s speed, compile-time checks, no unsafe code, one small binary. Costs: 1.94× the lines, designs forced by ownership, a build step, bugs it cannot see.',
  },
  'forced-arena': {
    q: 'What did ownership force on drip-rs’s heap, compared with the TypeScript VM?',
    a: 'Objects live in nine arenas owned by the heap, and everything else holds `Gc<T>` handles, typed indices, instead of references.',
  },
  'forced-roots': {
    q: 'Why does drip-rs pass its roots into `collect()` instead of letting the heap ask the VM?',
    a: 'The VM owns the heap; the heap cannot borrow the VM that owns it while it is itself borrowed mutably.',
  },
  'caught-compile': {
    q: 'Name two kinds of mistake the Rust compiler caught while drip-rs was written.',
    a: 'Any two of: a missing opcode arm (E0004), a handle of the wrong type (E0308), a reference into the heap kept across a change (E0502), two `&mut self` borrows at once (E0499).',
  },
  'missed-root': {
    q: 'What happens in drip-rs if the VM forgets to pass a root to the collector?',
    a: 'It compiles. The object is freed while still in use; in stress mode the next use panics, but in normal mode a reused slot may hand back a different object.',
  },
  'safe-not-correct': {
    q: 'A stale `Gc<T>` reads a slot that a new object now occupies. Is that undefined behaviour?',
    a: 'No: the read is in bounds and well typed, so it is safe. It is still wrong: a logic bug, not a memory-safety bug.',
  },
  'cost-lines': {
    q: 'How many code lines are drip-rs and the TypeScript VM, by this chapter’s count?',
    a: '3,328 in Rust against 1,714 in TypeScript: 1.94 times as many.',
  },
  'cost-where': {
    q: 'Give one reason drip-rs has more lines than the TypeScript VM that is not about ownership.',
    a: 'JavaScript’s number printing had to be rewritten by hand, the scanner spells out each byte case, and there is a 50-line command line with no twin in `ts/src/vm`.',
  },
  'speed-scope': {
    q: 'What is the honest one-line summary of drip-rs’s speed?',
    a: 'On the committed run of 2026-11-02, 1.26× to 4.94× the TypeScript VM on ten programs, geometric mean 3.94×; best of three fresh runs on a shared machine.',
  },
  'biggest-win': {
    q: 'Which measured change in this Part mattered more: removing a bounds check, or the chunk register?',
    a: 'The chunk register: without it fib was about 2.1 times slower. The unchecked read saved 8% of instructions and no measurable time.',
  },
  'rust-tradeoffs': {
    q: 'In one sentence, what did Rust give drip-rs and what did it cost?',
    a: 'Memory safety without a runtime, compile-time checks and about four times the TypeScript VM’s speed, for nearly twice the lines and a design built around ownership.',
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
  unchecked: {
    lang: 'rust',
    title: 'Three ways to read a byte',
    code: `fn main() {
    let code = vec![7u8, 1, 2];
    // get: an Option, never a panic.
    println!("{:?}", code.get(1));
    println!("{:?}", code.get(5));
    // index: checked, panics if out
    // of range (it is in range here).
    let ip = 2;
    println!("{}", code[ip]);
    // unchecked: no test at all.
    // SAFETY: ip < code.len()
    let b = unsafe {
        *code.get_unchecked(ip)
    };
    println!("{b}");
}`,
  },
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
  'stale-handle': {
    lang: 'rust',
    title: 'Safe, and still wrong: a handle that outlived its object',
    code: `// A tiny arena that reuses freed
// slots, like drip-rs in normal mode.
struct Arena {
    slots: Vec<Option<String>>,
    free: Vec<usize>,
}

impl Arena {
    fn alloc(&mut self, s: &str)
        -> usize {
        let v = Some(s.to_string());
        if let Some(i) = self.free.pop()
        {
            self.slots[i] = v;
            return i;
        }
        self.slots.push(v);
        self.slots.len() - 1
    }
    fn free(&mut self, i: usize) {
        self.slots[i] = None;
        self.free.push(i);
    }
    fn get(&self, i: usize) -> &str {
        self.slots[i].as_deref()
            .expect("use after free")
    }
}

fn main() {
    let mut a = Arena {
        slots: vec![],
        free: vec![],
    };
    let name = a.alloc("fib");
    // The collector frees it: a root
    // was forgotten, so name lives on.
    a.free(name);
    let other = a.alloc("zoo");
    println!("{name} {other}");
    // No crash, no UB: just the wrong
    // object.
    println!("{}", a.get(name));
}`,
  },
};

export const exercises = {
  annotate: {
    lang: 'rust',
    title: 'Read callgrind_annotate’s output',
    prompt: 'Write `parse_row(line)`, which turns one line of `callgrind_annotate` output into a `Row`, or returns `None` for anything else (headers, rules of dashes, blank lines). A row is: the instruction count with commas, then the percentage in parentheses (there may be a space after `(`), then the name. Clean the name: drop a trailing ` [binary path]` if there is one, and a leading `???:`. Then write `sum_named(rows, needle)`, which adds up the `ir` of every row whose name contains `needle`. With debug info, one inlined function is split across many files (`vm.rs`, `vec/mod.rs`, `slice/index.rs`...), and this puts it back together, as this chapter did for `Vm::run`.',
    starter: `// A line of callgrind_annotate output.
#[derive(Debug, PartialEq)]
struct Row {
    ir: u64,
    pct: f64,
    name: String,
}

fn parse_row(line: &str)
    -> Option<Row> {
    todo!()
}

fn sum_named(rows: &[Row], needle: &str)
    -> u64 {
    todo!()
}`,
    solution: `// A line of callgrind_annotate output.
#[derive(Debug, PartialEq)]
struct Row {
    ir: u64,
    pct: f64,
    name: String,
}

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

// Add up every row whose name contains
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
`,
    tests: `#[test]
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
}`,
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
        code: `// A line of callgrind_annotate output.
#[derive(Debug, PartialEq)]
struct Row {
    ir: u64,
    pct: f64,
    name: String,
}

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

// Add up every row whose name contains
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
`,
        why: 'The percentage is padded: `( 3.78%)` leaves `" 3.78"`, which `parse` rejects, so every row under 10% disappears. Trim it first.',
      },
      {
        code: `// A line of callgrind_annotate output.
#[derive(Debug, PartialEq)]
struct Row {
    ir: u64,
    pct: f64,
    name: String,
}

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

// Add up every row whose name contains
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
`,
        why: 'The name keeps its `???:` prefix and its `[binary]` suffix, so it never equals the clean name the tests expect.',
      },
    ],
  },
  fold: {
    lang: 'rust',
    optional: true,
    title: 'Folded stacks to flame-graph widths',
    prompt: 'flamegraph.pl reads **folded stacks**: one line per distinct call path, frames joined by `;`, then a count. Write `inclusive(folded)`, which returns the width of every box: for each path *prefix* (such as `"main;run"`), the sum of the counts of every line that starts with that prefix. The test data are fib’s self costs from this chapter’s callgrind run.',
    starter: `use std::collections::HashMap;

fn inclusive(folded: &[(&str, u64)])
    -> HashMap<String, u64> {
    HashMap::new()
}`,
    solution: `use std::collections::HashMap;

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
`,
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
  verdict: {
    lang: 'rust',
    title: 'A speed-up calculator that respects noise',
    prompt: 'You have wall times from fresh runs, before and after a change. Write `min` and `max` of a slice, then `speedup(before, after)`: best before divided by best after. Then write `verdict(before, after)`, which only claims a result when the samples don’t overlap: `Faster` if every `after` time is below every `before` time, `Slower` if every `after` time is above every `before` time, and `Noise` otherwise. The tests use this chapter’s real fib timings.',
    starter: `#[derive(Debug, PartialEq)]
enum Verdict {
    Faster,
    Slower,
    Noise,
}

fn min(xs: &[f64]) -> f64 {
    todo!()
}

fn max(xs: &[f64]) -> f64 {
    todo!()
}

fn speedup(
    before: &[f64],
    after: &[f64],
) -> f64 {
    todo!()
}

fn verdict(
    before: &[f64],
    after: &[f64],
) -> Verdict {
    todo!()
}`,
    solution: `#[derive(Debug, PartialEq)]
enum Verdict {
    Faster,
    Slower,
    Noise,
}

fn min(xs: &[f64]) -> f64 {
    let mut m = f64::MAX;
    for &x in xs {
        m = m.min(x);
    }
    m
}

fn max(xs: &[f64]) -> f64 {
    let mut m = f64::MIN;
    for &x in xs {
        m = m.max(x);
    }
    m
}

// Best before ÷ best after.
fn speedup(
    before: &[f64],
    after: &[f64],
) -> f64 {
    min(before) / min(after)
}

// A verdict only if the ranges
// don't touch.
fn verdict(
    before: &[f64],
    after: &[f64],
) -> Verdict {
    if max(after) < min(before) {
        Verdict::Faster
    } else if min(after) > max(before) {
        Verdict::Slower
    } else {
        Verdict::Noise
    }
}
`,
    tests: `// ms, 15 fresh runs each, variants alternating.
const BASE: [f64; 15] = [402.0, 439.0, 398.0, 423.0, 423.0, 481.0, 428.0, 409.0, 414.0, 439.0, 499.0, 443.0, 427.0, 403.0, 572.0];
const WALK: [f64; 15] = [860.0, 871.0, 892.0, 870.0, 1034.0, 850.0, 881.0, 854.0, 842.0, 931.0, 995.0, 893.0, 889.0, 1006.0, 896.0];
const UNCHK: [f64; 15] = [409.0, 476.0, 434.0, 451.0, 463.0, 491.0, 410.0, 463.0, 406.0, 432.0, 492.0, 436.0, 415.0, 493.0, 439.0];
// strings.drip
const S_BASE: [f64; 15] = [402.0, 308.0, 403.0, 372.0, 437.0, 376.0, 423.0, 398.0, 338.0, 363.0, 326.0, 332.0, 335.0, 345.0, 313.0];
const S_FAST: [f64; 15] = [182.0, 202.0, 221.0, 184.0, 183.0, 180.0, 178.0, 180.0, 187.0, 178.0, 182.0, 188.0, 188.0, 176.0, 179.0];

#[test]
fn min_and_max() {
    assert_eq!(min(&BASE), 398.0);
    assert_eq!(max(&BASE), 572.0);
    assert_eq!(min(&[3.0]), 3.0);
}

#[test]
fn speedup_of_the_chunk_register() {
    let s = speedup(&WALK, &BASE);
    assert!((s - 2.1156).abs() < 0.001, "{s}");
}

#[test]
fn the_register_is_a_real_win() {
    assert_eq!(verdict(&WALK, &BASE), Verdict::Faster);
    assert_eq!(verdict(&BASE, &WALK), Verdict::Slower);
}

#[test]
fn unchecked_reads_are_noise_here() {
    assert_eq!(verdict(&BASE, &UNCHK), Verdict::Noise);
}

#[test]
fn the_fast_path_is_a_real_win() {
    let s = speedup(&S_BASE, &S_FAST);
    assert!((s - 1.75).abs() < 0.001, "{s}");
    assert_eq!(verdict(&S_BASE, &S_FAST), Verdict::Faster);
}

#[test]
fn touching_ranges_are_noise() {
    assert_eq!(verdict(&[10.0, 11.0], &[9.0, 10.0]), Verdict::Noise);
    assert_eq!(verdict(&[10.0, 11.0], &[8.0, 9.5]), Verdict::Faster);
}`,
    hints: [
      'Start `min` at `f64::MAX` and fold in each value with `m.min(x)`; `max` is the mirror image from `f64::MIN`.',
      '`speedup` is one line: `min(before) / min(after)`. Bigger than 1 means the change helped.',
      'For `Faster`, the *slowest* after must beat the *fastest* before: `max(after) < min(before)`. Equal values touch, so they are `Noise`.',
    ],
    walkthrough: `**How to think about it.** On a shared machine one run of a program can take 400 ms and the next 570 ms, with nothing changed. So a single "before" and "after" number proves nothing; the honest question is whether the two *sets* of runs overlap. If the slowest run after the change still beats the fastest run before it, no amount of noise explains the difference away. If the ranges overlap, you cannot tell, and the right answer is "noise". The speed-up itself is reported from the best runs, because the best run is the one least disturbed by other work on the machine.

**The solution, line by line.**

- \`fn min(xs: &[f64]) -> f64\` starts with \`let mut m = f64::MAX;\`, the largest \`f64\`, so the first value replaces it; \`for &x in xs { m = m.min(x); }\` keeps the smaller each time (\`&x\` copies each \`f64\` out of the slice), and \`m\` is returned. \`max\` is the mirror image, starting from \`f64::MIN\` and using \`m.max(x)\`.
- \`min(before) / min(after)\` is the speed-up: old best time divided by new best time, so 2.0 means twice as fast. For the chunk register, the copy without it is "before" (842 ms best) and the committed build "after" (398 ms): 2.1156.
- \`if max(after) < min(before)\` is the strict test for \`Faster\`: the *slowest* new run beats the *fastest* old one. For strings.drip the fast path's slowest run is 221 ms and the committed build's fastest 308 ms, so it is \`Faster\`.
- \`else if min(after) > max(before)\` is the mirror test for \`Slower\`.
- \`else\` covers every overlap, including ranges that only touch: \`Verdict::Noise\`. The unchecked build's runs (406 to 493 ms) sit inside the committed build's (398 to 572 ms), so it is noise, which matches what the chapter concluded.

**Common wrong attempts.**

- Comparing only the best runs (\`min(after) < min(before)\`) turns every lucky run into a verdict. Here it calls the unchecked build \`Slower\` (406 against 398), when the honest reading is that the two cannot be told apart.
- Dividing the wrong way round (\`min(after) / min(before)\`) reports 0.47 for a change that made fib 2.1 times faster.

The rule is blunt on purpose: a real 3% gain on this machine will usually come out as \`Noise\`. To see small effects, count instructions with callgrind, which the neighbours cannot disturb, and then time on a quiet machine.`,
    wrong: [
      {
        code: `#[derive(Debug, PartialEq)]
enum Verdict {
    Faster,
    Slower,
    Noise,
}

fn min(xs: &[f64]) -> f64 {
    let mut m = f64::MAX;
    for &x in xs {
        m = m.min(x);
    }
    m
}

fn max(xs: &[f64]) -> f64 {
    let mut m = f64::MIN;
    for &x in xs {
        m = m.max(x);
    }
    m
}

fn speedup(
    before: &[f64],
    after: &[f64],
) -> f64 {
    min(before) / min(after)
}

fn verdict(
    before: &[f64],
    after: &[f64],
) -> Verdict {
    if min(after) < min(before) {
        Verdict::Faster
    } else if min(after) > min(before) {
        Verdict::Slower
    } else {
        Verdict::Noise
    }
}`,
        why: 'Comparing best runs only calls the unchecked build “Slower” (406 against 398 ms) although its runs overlap the committed build’s. Compare the whole ranges.',
      },
      {
        code: `#[derive(Debug, PartialEq)]
enum Verdict {
    Faster,
    Slower,
    Noise,
}

fn min(xs: &[f64]) -> f64 {
    let mut m = f64::MAX;
    for &x in xs {
        m = m.min(x);
    }
    m
}

fn max(xs: &[f64]) -> f64 {
    let mut m = f64::MIN;
    for &x in xs {
        m = m.max(x);
    }
    m
}

fn speedup(
    before: &[f64],
    after: &[f64],
) -> f64 {
    min(after) / min(before)
}

fn verdict(
    before: &[f64],
    after: &[f64],
) -> Verdict {
    if max(after) < min(before) {
        Verdict::Faster
    } else if min(after) > max(before) {
        Verdict::Slower
    } else {
        Verdict::Noise
    }
}`,
        why: 'The ratio is upside down: the chunk register’s 2.1× would come out as 0.47. A speed-up is old time divided by new time.',
      },
    ],
  },
  summarize: {
    lang: 'rust',
    title: 'Speed-ups and their geometric mean',
    prompt: `Each benchmark is a \`Row\`: the program's name, the old time and the new time, in milliseconds. Write:

1. \`speedup(old, new)\`: how many times as fast the new one is.
2. \`geomean(xs)\`: the geometric mean of the values, or \`None\` if there are none. (Hint: the mean of the logarithms, then \`exp\`.)
3. \`slower(rows)\`: the names of the programs whose new time is bigger than their old time, in order.

The tests use the committed results of 2026-11-02, and check the chapter's numbers: the TypeScript VM is 1.01 times the tree-walker, drip-rs 3.94 times the TypeScript VM.`,
    starter: `// One benchmark: the program, the
// old time and the new time, in ms.
type Row = (&'static str, f64, f64);

// How many times as fast new is.
fn speedup(old: f64, new: f64) -> f64 {
    todo!()
}

fn geomean(xs: &[f64]) -> Option<f64> {
    todo!()
}

fn slower(rows: &[Row]) -> Vec<&str> {
    todo!()
}`,
    solution: `// One benchmark: the program, the
// old time and the new time, in ms.
type Row = (&'static str, f64, f64);

// How many times as fast new is.
fn speedup(old: f64, new: f64) -> f64 {
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
}`,
    tests: `// drip-bench-2026-11-02: tree, TS VM.
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
}`,
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
        code: `// One benchmark: the program, the
// old time and the new time, in ms.
type Row = (&'static str, f64, f64);

// How many times as fast new is.
fn speedup(old: f64, new: f64) -> f64 {
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
        code: `// One benchmark: the program, the
// old time and the new time, in ms.
type Row = (&'static str, f64, f64);

// How many times as fast new is.
fn speedup(old: f64, new: f64) -> f64 {
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
  counts: {
    lang: 'rust',
    title: 'Count the lines the way this chapter did',
    prompt: 'Write `counts(src)`, which returns `(code, test)` for a Rust source file: the number of code lines before the module’s `#[cfg(test)]`, and the number from that line on. Blank lines (only whitespace) and comment lines (starting with `//` after any indentation, which covers `///` and `//!`) count as neither. The `#[cfg(test)]` line itself counts as a test line.',
    starter: `fn counts(src: &str) -> (usize, usize) {
    let n = src.lines().count();
    (n, 0)
}`,
    solution: `// (code lines, test lines) in a Rust
// source file. Blank lines and //
// comments are neither. Everything from
// #[cfg(test)] on is test code.
const MARK: &str = "#[cfg(test)]";

fn counts(src: &str) -> (usize, usize) {
    let mut code = 0;
    let mut test = 0;
    let mut in_test = false;
    for line in src.lines() {
        let t = line.trim();
        if t.starts_with(MARK) {
            in_test = true;
        }
        let skip = t.is_empty()
            || t.starts_with("//");
        if skip {
            continue;
        }
        if in_test {
            test += 1;
        } else {
            code += 1;
        }
    }
    (code, test)
}
`,
    tests: `#[test]
fn blank_and_comment_lines_dont_count() {
    let src = "//! A module.\\n\\n/// Doc.\\nfn f() {\\n    // inside\\n    1;\\n}\\n";
    assert_eq!(counts(src), (3, 0));
}

#[test]
fn test_module_is_counted_apart() {
    let src = "fn f() -> i32 {\\n    1\\n}\\n\\n#[cfg(test)]\\nmod tests {\\n    #[test]\\n    fn t() {}\\n}\\n";
    assert_eq!(counts(src), (3, 5));
}

#[test]
fn indentation_and_trailing_spaces() {
    let src = "   \\n\\t// tab comment\\n    let x = 1;   \\n";
    assert_eq!(counts(src), (1, 0));
}

#[test]
fn a_comment_with_code_after_is_code() {
    let src = "let a = 1; // one\\n";
    assert_eq!(counts(src), (1, 0));
}`,
    hints: [
      'Loop over `src.lines()` and `trim()` each line before looking at it.',
      'Check for `#[cfg(test)]` first and set a flag; it stays set for the rest of the file.',
      'Skip a line if `t.is_empty() || t.starts_with("//")`; otherwise add one to `code` or `test` depending on the flag.',
    ],
    walkthrough: `**How to think about it.** A line count sounds like \`src.lines().count()\`, but a fair comparison between two codebases needs rules about what a "line of code" is, applied the same way to both. This chapter's rules are: blank lines and comment lines are not code, and a module's unit tests (everything from \`#[cfg(test)]\` on, where drip-rs keeps them) are counted apart. So each line needs three decisions, in order: has the test part started, is this line blank or a comment, and which counter does it go to.

**The solution, line by line.**

- \`const MARK: &str = "#[cfg(test)]";\` names the attribute that starts a test module, so the check below reads clearly.
- \`let mut code = 0; let mut test = 0; let mut in_test = false;\` are the two counters and a flag saying whether we have reached the tests.
- \`for line in src.lines()\` visits each line without its line ending.
- \`let t = line.trim();\` removes leading and trailing whitespace, so an indented comment or a line of spaces looks the same as an unindented one.
- \`if t.starts_with(MARK) { in_test = true; }\` sets the flag *before* the skip test, so the attribute line itself counts as a test line, and the flag stays set for the rest of the file. (That relies on drip-rs's habit of putting \`#[cfg(test)] mod tests\` at the bottom of each module, which holds for all six modules that have one.)
- \`let skip = t.is_empty() || t.starts_with("//");\` is true for blank lines and for comment lines, including \`///\` and \`//!\` doc comments; \`if skip { continue; }\` moves on without counting.
- \`if in_test { test += 1; } else { code += 1; }\` counts the line on the right side.
- \`(code, test)\` returns both counts.

A line such as \`let a = 1; // one\` starts with code, so it counts as code; only lines that *start* with \`//\` are comments.

**Common wrong attempts.**

- Never looking for \`#[cfg(test)]\` counts the unit tests as code, which would make drip-rs look longer than it is.
- Testing \`line\` instead of the trimmed \`t\` counts indented comments and lines of spaces as code.

Counting is full of choices like these, and each one moves the result: this chapter's script also skipped \`/* */\` blocks and, in TypeScript, JSDoc lines starting with \`*\`, and it did not count the integration tests in \`tests/\` at all. A different counter would give a different ratio, which is why the chapter says exactly how it counted.`,
    wrong: [
      {
        code: `fn counts(src: &str) -> (usize, usize) {
    let mut code = 0;
    for line in src.lines() {
        let t = line.trim();
        let skip = t.is_empty()
            || t.starts_with("//");
        if skip {
            continue;
        }
        code += 1;
    }
    (code, 0)
}`,
        why: 'This never splits off the test module, so test lines are counted as code: `test_module_is_counted_apart` gets `(8, 0)`.',
      },
      {
        code: `const MARK: &str = "#[cfg(test)]";

fn counts(src: &str) -> (usize, usize) {
    let mut code = 0;
    let mut test = 0;
    let mut in_test = false;
    for line in src.lines() {
        if line.starts_with(MARK) {
            in_test = true;
        }
        if line.is_empty()
            || line.starts_with("//")
        {
            continue;
        }
        if in_test {
            test += 1;
        } else {
            code += 1;
        }
    }
    (code, test)
}`,
        why: 'Without `trim`, an indented comment or a line of spaces counts as code.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'callgrind reports `Table::get` at 6.0% of fib’s instructions. What can you conclude about time?',
    options: [
      {
        t: 'It took exactly 6.0% of the running time',
        why: 'Instruction counts ignore cache misses, mispredicted branches and overlap, so time shares can differ.',
      },
      {
        t: 'It is a good first guess at its share of time, to be checked with a timing',
        correct: true,
        why: 'Counts point you at code worth a look; only a before-and-after timing says whether changing it helps.',
      },
      {
        t: 'Nothing, because callgrind runs about seventy times slower',
        why: 'The slowdown does not change the counts: they are the instructions the program runs natively.',
      },
    ],
  },
  {
    q: '`call_value` has inclusive cost 13.9% and self cost 3.7% in fib. Where did the other 10.2% go?',
    options: [
      {
        t: 'Into the functions that called it',
        why: 'A caller’s cost is never part of a function’s inclusive cost.',
      },
      {
        t: 'Into the functions it called, here `call`',
        correct: true,
        why: 'Inclusive = self + callees, and `call` is 10.2%.',
      },
      {
        t: 'Into callgrind itself',
        why: 'callgrind does not count its own simulation in the program’s events.',
      },
    ],
  },
  {
    q: 'Why is drip-rs’s lead over the TypeScript VM so much smaller on `strings.drip` than on fib?',
    options: [
      {
        t: 'Its dispatch loop is slower on strings',
        why: 'The loop’s own share is only 17.9% there; most of the cost is elsewhere.',
      },
      {
        t: 'Its garbage collector runs constantly',
        why: 'Collection does not appear near the top of the profile.',
      },
      {
        t: 'Most of the program is spent formatting numbers into text and allocating strings, in library code',
        correct: true,
        why: '`format_number` alone is 48.2% of the instructions, and malloc and free are near the top.',
      },
    ],
  },
  {
    q: 'In a flame graph, one box sits on top of `run` and is 10% of the width. What is it?',
    options: [
      {
        t: 'A function that ran for 10% of the time, starting at that point of the timeline',
        why: 'The x axis is not time.',
      },
      {
        t: 'A function 10% of whose instructions were inlined into `run`',
        why: 'Inlined code has no box: it is part of `run`’s own bare top.',
      },
      {
        t: 'A function called by `run`, which, with its callees, took 10% of the cost',
        correct: true,
        why: 'Width is the inclusive cost on that call path.',
      },
    ],
  },
  {
    q: 'Why is a callgrind count more useful than a timing for comparing two builds on this book’s machine?',
    options: [
      {
        t: 'It is deterministic: other users of the shared machine cannot change how many instructions your program runs',
        correct: true,
        why: 'Timings here vary by tens of percent; counts vary by a few dozen instructions in billions.',
      },
      {
        t: 'It is always the same as the time',
        why: 'It is not; a change can save instructions and no time, as the next chapter shows.',
      },
      {
        t: 'It runs faster than the program',
        why: 'It runs about seventy times slower.',
      },
    ],
  },
  {
    q: 'An unchecked `read_byte` removed 8% of fib’s instructions. What happened to its time?',
    options: [
      {
        t: 'It fell by 8%',
        why: 'Instructions are not time: the best run was 406 ms against the committed 398 ms.',
      },
      {
        t: 'No measurable change: the runs overlapped the committed build’s',
        correct: true,
        why: 'The removed compare and branch were predicted perfectly and ran alongside other work.',
      },
      {
        t: 'It doubled',
        why: 'That was the copy without the chunk register, a different experiment.',
      },
    ],
  },
  {
    q: 'What does `#![forbid(unsafe_code)]` in drip-rs’s `lib.rs` do?',
    options: [
      {
        t: 'Makes every `unsafe` block in the crate a compile error, which no inner attribute can switch back on',
        correct: true,
        why: '`forbid` is stronger than `deny`: it cannot be overridden lower down.',
      },
      {
        t: 'Makes `unsafe` blocks panic at run time',
        why: 'It is a compile-time lint; the code never builds.',
      },
      {
        t: 'Turns off bounds checks',
        why: 'It does the opposite: it keeps you from turning them off.',
      },
    ],
  },
  {
    q: 'What does `unsafe { *v.get_unchecked(9) }` do when `v` has three elements?',
    options: [
      {
        t: 'Panics with “index out of bounds”',
        why: 'That is `v[9]`, the checked form.',
      },
      {
        t: 'Returns `None`',
        why: 'That is `v.get(9)`.',
      },
      {
        t: 'Undefined behaviour: the language promises nothing about what happens',
        correct: true,
        why: 'The caller broke the promise `i < len`; the program may crash, read garbage or appear to work.',
      },
    ],
  },
  {
    q: 'Which change made strings.drip about 1.75 times faster in this chapter’s measurements?',
    options: [
      {
        t: 'Reading bytes with `get_unchecked`',
        why: 'That was tried on fib and saved no time.',
      },
      {
        t: 'A fast path in `format_number` that prints whole numbers below 2^53 with `(n as i64).to_string()`',
        correct: true,
        why: 'The profile put 48.2% of strings.drip in `format_number`; the fast path cut its instructions by 44%.',
      },
      {
        t: 'Removing the garbage collector',
        why: 'Nobody removed it, and the corpus would fail without it.',
      },
    ],
  },
  {
    q: 'Why is the whole-number fast path in this chapter not in the benchmark tables of the next chapter?',
    options: [
      {
        t: 'It made the output different',
        why: 'It passed the corpus and every benchmark’s output byte for byte.',
      },
      {
        t: 'It was measured in a scratch copy; the committed drip-rs, which the tables measure, does not have it yet',
        correct: true,
        why: 'The chapter says what it measured and changes no companion code.',
      },
      {
        t: 'It only helps the TypeScript VM',
        why: 'It is a change to drip-rs’s `format_number`.',
      },
    ],
  },
  {
    q: 'What is the geometric mean of the TypeScript VM’s speed-ups over the tree-walker on the ten programs of 2026-11-02?',
    options: [
      {
        t: 'About 1.24',
        why: 'That is fib’s and closures’ speed-up, not the mean over all ten.',
      },
      {
        t: 'About 1.01',
        correct: true,
        why: 'Six wins of at most 1.30× and four losses down to 0.69× cancel out almost exactly.',
      },
      {
        t: 'About 3.94',
        why: 'That is drip-rs against the TypeScript VM.',
      },
    ],
  },
  {
    q: 'On `fields`, the TypeScript VM is 0.74 times the tree-walker but drip-rs is 3.69 times the TypeScript VM. What does that suggest?',
    options: [
      {
        t: 'The bytecode for `fields` is badly compiled',
        why: 'drip-rs runs exactly the same bytecode and is fast.',
      },
      {
        t: 'The cost is in how each instruction is carried out in TypeScript, not in the instructions themselves',
        correct: true,
        why: 'Same bytecode, very different cost per instruction.',
      },
      {
        t: 'The tree-walker cheats by skipping work',
        why: 'All three pass the same corpus and print the same output.',
      },
    ],
  },
  {
    q: 'According to the profiles in this chapter, which work does the TypeScript VM do itself that the tree-walker leaves to V8?',
    options: [
      {
        t: 'Parsing the program',
        why: 'Both parse in TypeScript; compiling was under 1% of samples.',
      },
      {
        t: 'Printing the output',
        why: 'Both print the same way.',
      },
      {
        t: 'Hash-table lookups for fields and globals, and garbage collection',
        correct: true,
        why: 'Its own `table.ts` and `heap.ts`, against the tree-walker’s `Map` and V8’s collector.',
      },
    ],
  },
  {
    q: 'Why is a single run never used as a benchmark result in this book?',
    options: [
      {
        t: 'On a shared cloud machine one run can vary from the next by tens of percent',
        correct: true,
        why: 'So the tables report the best of three fresh runs, and close results are read as “about the same”.',
      },
      {
        t: 'The first run is always slower because of the disk',
        why: 'Each run is a fresh process anyway; the variation is mostly other work on the machine.',
      },
      {
        t: 'Rust programs need warming up',
        why: 'drip-rs is compiled ahead of time; there is nothing to warm up.',
      },
    ],
  },
  {
    q: 'What makes a comparison between implementations meaningful at all?',
    options: [
      {
        t: 'That they are written in different languages',
        why: 'Two implementations in the same language can be compared too.',
      },
      {
        t: 'That they pass the same tests, so they are doing the same work, measured the same way on the same machine',
        correct: true,
        why: 'A faster implementation that prints a different answer has not won anything.',
      },
      {
        t: 'That the newest one is fastest',
        why: 'The TypeScript VM is newer than the tree-walker, and not faster on average.',
      },
    ],
  },
  {
    q: 'Which of these designs in drip-rs exists because of Rust’s ownership rules rather than because a VM needs it?',
    options: [
      {
        t: 'A stack of call frames',
        why: 'Every VM in this book has one, including the TypeScript VM.',
      },
      {
        t: 'Objects in arenas, linked by typed `Gc<T>` handles',
        correct: true,
        why: 'Objects that point at each other in cycles cannot be plain Rust references.',
      },
      {
        t: 'Bytecode with one-byte opcodes',
        why: 'The TypeScript VM uses the same instruction set.',
      },
    ],
  },
  {
    q: 'What does `#![forbid(unsafe_code)]` guarantee about drip-rs?',
    options: [
      {
        t: 'That it has no bugs',
        why: 'A forgotten root is still a bug in safe code.',
      },
      {
        t: 'That no line of the crate can use `unsafe`, so every index stays checked and there is no undefined behaviour from drip-rs’s own code',
        correct: true,
        why: 'Safe Rust has no undefined behaviour; forbid keeps all of drip-rs in safe Rust.',
      },
      {
        t: 'That it runs as fast as C',
        why: 'It says nothing about speed.',
      },
    ],
  },
  {
    q: 'The stale-handle example prints `zoo` where it meant `fib`. What kind of bug is that?',
    options: [
      {
        t: 'Undefined behaviour',
        why: 'Every access is in bounds and well typed; the language’s rules are all kept.',
      },
      {
        t: 'A compile error that was ignored',
        why: 'It compiles with no errors or warnings.',
      },
      {
        t: 'A logic bug in safe code: a handle kept after its object was freed',
        correct: true,
        why: 'Only tests, such as the stress-GC suite, can find it.',
      },
    ],
  },
  {
    q: 'By this chapter’s count, how much longer is drip-rs than the TypeScript VM?',
    options: [
      {
        t: 'About the same length',
        why: '3,328 lines against 1,714 is nearly double.',
      },
      {
        t: 'About 1.94 times as long',
        correct: true,
        why: 'Code lines only: no blanks, no comments, no unit tests.',
      },
      {
        t: 'About four times as long',
        why: 'Four is roughly its speed-up, not its length.',
      },
    ],
  },
  {
    q: 'Where did most of drip-rs’s speed over the TypeScript VM come from, by this Part’s measurements?',
    options: [
      {
        t: 'From removing bounds checks',
        why: 'drip-rs keeps them all, and removing one saved no measurable time.',
      },
      {
        t: 'From a different instruction set',
        why: 'It runs the same bytecode as the TypeScript VM.',
      },
      {
        t: 'From running the same design as compiled machine code, with the hot state in fields of the `Vm`',
        correct: true,
        why: 'Same bytecode, cheaper steps; and removing the chunk register alone made fib about 2.1 times slower.',
      },
    ],
  },
];
