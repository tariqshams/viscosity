// Chapter 231 cards. Keys are stable ids: never rename them.

export const prompts = {
  'drip-rs-what': {
    q: 'What is **drip-rs**?',
    a: 'The Rust port of Drip’s bytecode VM (book/companion/rust): a library crate `drip` and a binary `drip-rs`, tested against the same corpus as the TypeScript VM.',
  },
  'forbid-unsafe': {
    q: 'What does `#![forbid(unsafe_code)]` at the top of `lib.rs` do?',
    a: 'Makes any `unsafe` block or function anywhere in the crate a compile error.',
  },
  'why-not-rc': {
    q: 'Give one reason drip-rs doesn’t link its heap objects with `Rc<RefCell<..>>`.',
    a: 'Reference counting would decide when objects die instead of Drip’s collector; cycles of `Rc`s leak; and every `borrow_mut` is a run-time check.',
  },
  'gc-handle': {
    q: 'What is a `Gc<T>` in drip-rs?',
    a: 'A typed `u32` index into the heap’s arena for `T`. It is `Copy`, owns nothing, and `heap[handle]` reads the object.',
  },
  'cycle-free': {
    q: 'Why does a cycle of objects cost drip-rs nothing extra?',
    a: 'Handles are just indices and the heap owns every object, so there are no counts to keep; the mark-and-sweep collector frees unreachable cycles like anything else.',
  },
  'roots-in': {
    q: 'Why can’t drip-rs’s heap call back into the VM to find roots, as the TypeScript heap does?',
    a: 'The VM owns the heap. Collecting needs `&mut` to the heap while the whole VM is borrowed, which the borrow checker rejects (E0502). So the VM passes its roots in.',
  },
  disjoint: {
    q: 'How can `collect_garbage` borrow `&self.stack` and `&mut self.heap` at the same time?',
    a: 'They are different fields of the struct, and the borrow checker tracks borrows of separate fields separately.',
  },
  'one-rc': {
    q: 'Why is a compiled chunk kept in an `Rc<Chunk>`?',
    a: 'So the VM can hold the running chunk in its own field without keeping the heap borrowed. The chunk never changes once compiled, so no `RefCell` is needed.',
  },
  'corpus-check': {
    q: 'What does drip-rs’s corpus test check for each program?',
    a: 'The expected output, compile errors and their lines, the runtime error and its line, and the exit code, read from the program’s comments.',
  },
  'stress-gc': {
    q: 'What does the stress-GC test suite do differently?',
    a: 'It collects garbage before every allocation, so a forgotten root shows up immediately.',
  },
};

export const examples = {
  'arena-cycle': {
    lang: 'rust',
    title: 'A cycle through handles',
    code: `// A class and an instance that point at
// each other: a cycle, with no Rc and
// no RefCell. Each kind has an arena.
#[derive(Clone, Copy, Debug)]
struct ClassRef(u32);
#[derive(Clone, Copy, Debug)]
struct InstRef(u32);

struct Class {
    name: String,
    // a back edge: the newest instance
    newest: Option<InstRef>,
}

struct Instance {
    class: ClassRef,
}

struct Heap {
    classes: Vec<Class>,
    insts: Vec<Instance>,
}

impl Heap {
    fn class(&self, r: ClassRef)
        -> &Class {
        &self.classes[r.0 as usize]
    }
    fn inst(&self, r: InstRef)
        -> &Instance {
        &self.insts[r.0 as usize]
    }
}

fn main() {
    let mut h = Heap {
        classes: Vec::new(),
        insts: Vec::new(),
    };
    h.classes.push(Class {
        name: String::from("Point"),
        newest: None,
    });
    let c = ClassRef(0);
    h.insts.push(Instance { class: c });
    let p = InstRef(0);
    // close the loop: c -> p -> c
    h.classes[0].newest = Some(p);

    let mut at = c;
    for _ in 0..3 {
        let k = h.class(at);
        let i = k.newest.unwrap();
        println!("{} {:?}", k.name, i);
        at = h.inst(i).class;
    }
    // h.inst(c) would not compile:
    // a ClassRef is not an InstRef.
    use std::mem::size_of;
    let n = size_of::<InstRef>();
    println!("handle: {} bytes", n);
}`,
  },
};

const EXPECT_SOL = `/// The text after \`// expect:\` and one
/// optional space, if the line has one.
fn expect_output(line: &str)
    -> Option<&str> {
    let m = "// expect:";
    let at = line.find(m)?;
    let rest = &line[at + m.len()..];
    Some(rest.strip_prefix(' ')
        .unwrap_or(rest))
}

/// Every expected line, in order.
fn expected(src: &str) -> Vec<&str> {
    let mut out = Vec::new();
    for line in src.lines() {
        let e = expect_output(line);
        if let Some(e) = e {
            out.push(e);
        }
    }
    out
}`;

const EXPECTED_FN = `
/// Every expected line, in order.
fn expected(src: &str) -> Vec<&str> {
    let mut out = Vec::new();
    for line in src.lines() {
        let e = expect_output(line);
        if let Some(e) = e {
            out.push(e);
        }
    }
    out
}`;

const EXIT_HEAD = `const RT: &str =
    "// expect runtime error: ";
// Compile errors the VM expects.
const CE: [&str; 3] = [
    "// Error",
    "// [line ",
    "// [c line ",
];

/// The exit code a corpus program's
/// comments ask for.
fn expected_exit(src: &str) -> i32 {`;

export const exercises = {
  expectOutput: {
    lang: 'rust',
    title: 'Read a corpus expectation',
    prompt:
      'Corpus programs say what they should print in comments: `print 1 + 2; // expect: 3`. Write `expect_output`, adapted from drip-rs’s `tests/common/mod.rs`: return the text after `// expect:` with **one** optional space removed, or `None` if the line has no such comment. Then write `expected`, which collects the expectation of every line of a program, in order.',
    starter: `fn expect_output(line: &str)
    -> Option<&str> {
    todo!()
}

fn expected(src: &str) -> Vec<&str> {
    todo!()
}`,
    solution: EXPECT_SOL,
    tests: `#[test]
fn reads_one_expectation() {
    let l = "print 1 + 2; // expect: 3";
    assert_eq!(expect_output(l), Some("3"));
}

#[test]
fn lines_without_one_give_none() {
    assert_eq!(expect_output("print 3;"), None);
    assert_eq!(expect_output("// a note"), None);
}

#[test]
fn only_one_space_is_dropped() {
    let l = "print \\"  hi\\"; // expect:   hi";
    assert_eq!(expect_output(l), Some("  hi"));
    let l = "print \\"\\"; // expect:";
    assert_eq!(expect_output(l), Some(""));
}

#[test]
fn collects_every_line_in_order() {
    let src = "print 1; // expect: 1\\n\\
               let a = 2;\\n\\
               print a; // expect: 2\\n";
    assert_eq!(expected(src), ["1", "2"]);
}`,
    hints: [
      '`line.find("// expect:")` returns `Option<usize>`, the byte index where the marker starts. A `?` after it returns `None` from your function when it isn’t there.',
      'The text you want starts at that index plus the marker’s length: `&line[at + m.len()..]`.',
      '`rest.strip_prefix(\' \')` is `Some(shorter)` if `rest` starts with a space, or `None`. `.unwrap_or(rest)` keeps `rest` in the second case.',
      'For `expected`, loop over `src.lines()` and push each `Some` result.',
    ],
    walkthrough: `This is the first rule the corpus checker applies, and it has to match the TypeScript runner exactly, because the two VMs are judged by the same expectations.

- **Find the marker.** \`line.find(m)?\` gives the byte offset of \`// expect:\`, or makes the whole function return \`None\`.
- **Slice after it.** \`&line[at + m.len()..]\` is a \`&str\` borrowed from \`line\`: no copying. The return type \`Option<&str>\` borrows from the argument, which Rust allows here without any annotation because there is only one input reference (chapter 209).
- **Drop at most one space.** The TypeScript regex is \`// expect: ?(.*)\`: the \`?\` makes one space optional and \`(.*)\` keeps everything after it. That matters: \`print "  hi";\` must print two leading spaces, and \`trim\` would hide a VM that dropped them.
- **Collect.** \`expected\` returns \`Vec<&str>\`, every element borrowing from \`src\`.

The real function in drip-rs also stops at a \`\\r\`, because JavaScript’s \`.\` doesn’t match one.`,
    wrong: [
      {
        code: `fn expect_output(line: &str)
    -> Option<&str> {
    let m = "// expect:";
    let at = line.find(m)?;
    let rest = &line[at + m.len()..];
    Some(rest.trim_start())
}
${EXPECTED_FN}`,
        why: '`trim_start` removes every leading space, not just one. A program that prints `"  hi"` would then expect `hi`, and a VM that lost the spaces would pass.',
      },
      {
        code: `fn expect_output(line: &str)
    -> Option<&str> {
    let m = "// expect:";
    let at = line.find(m)?;
    Some(&line[at..])
}
${EXPECTED_FN}`,
        why: 'This slices from where the marker *starts*, so the result still begins with `// expect:`. Skip `m.len()` bytes as well.',
      },
    ],
  },
  exitCode: {
    lang: 'rust',
    optional: true,
    title: 'Which exit code should it be?',
    prompt:
      'The corpus checker also works out the exit code a program should end with, from its comments. Write `expected_exit`, a simplified version of what `parse_expectations` in drip-rs’s `tests/common/mod.rs` does: **70** if a line has `// expect runtime error: `, **65** if a line expects a compile error (`// Error`, `// [line `, or `// [c line `), and **0** otherwise. Two details from the real one: an `// expect:` line is an output expectation and nothing else, even if its text mentions an error; and `// [java line ` errors are for jlox only, so the VM ignores them.',
    starter: `${EXIT_HEAD}
    todo!()
}`,
    solution: `${EXIT_HEAD}
    let mut code = 0;
    for line in src.lines() {
        if line.contains("// expect:") {
            continue;
        }
        let ce = CE.iter()
            .any(|m| line.contains(m));
        if ce {
            code = 65;
        } else if line.contains(RT) {
            code = 70;
        }
    }
    code
}`,
    tests: `#[test]
fn plain_output_exits_0() {
    let src = "print 1; // expect: 1";
    assert_eq!(expected_exit(src), 0);
}

#[test]
fn a_runtime_error_is_70() {
    let src = "true.foo; // expect runtime error: Only instances have properties.";
    assert_eq!(expected_exit(src), 70);
}

#[test]
fn compile_errors_are_65() {
    let a = "print; // Error at ';': Expect expression.";
    assert_eq!(expected_exit(a), 65);
    let b = "{\n// [line 2] Error at end: Expect '}' after block.";
    assert_eq!(expected_exit(b), 65);
    let c = "x; // [c line 1] Error at 'x': Boom.";
    assert_eq!(expected_exit(c), 65);
}

#[test]
fn java_only_errors_are_ignored() {
    let src = "x; // [java line 1] Error at 'x': Boom.";
    assert_eq!(expected_exit(src), 0);
}

#[test]
fn output_that_mentions_an_error() {
    let src = "print \\"// Error\\"; // expect: // Error";
    assert_eq!(expected_exit(src), 0);
}`,
    hints: [
      'Walk `src.lines()` with a `mut code = 0`, and set it to 65 or 70 when a line matches.',
      'Test for `// expect:` first and `continue`: in the real parser an output expectation wins over every other rule on its line.',
      'For 65, check the three markers in `CE` with `CE.iter().any(|m| line.contains(m))`. Matching them exactly matters: something looser, like `line ` plus `] Error`, would also catch `// [java line `.',
    ],
    walkthrough: `drip-rs’s \`parse_expectations\` reads each line through a chain of \`if let ... else if let\`: output first, then \`// Error\`, then \`// [line N]\` errors (keeping only those with no language or the VM’s own, \`c\`), then the runtime error. Each match records something and sets \`exit_code\`: 65 for a compile error, 70 for a runtime error. Your version keeps only the exit code, but the order is the same.

\`\`\`rust
if line.contains("// expect:") {
    continue;
}
\`\`\`

That early \`continue\` is the first detail. A program may well print text that looks like an error comment, and the last test does exactly that. Because the real checker tries \`expect_output\` first, the line counts as output and the rest of the chain never runs.

The second is the language tag. The corpus comes from *Crafting Interpreters*, whose tests serve both jlox and clox, and a few errors differ between them. \`[java line 3]\` applies only to the tree-walker in Java; \`[c line 3]\` applies to the C VM, and drip-rs is the C VM’s twin. So the file header of \`tests/corpus.rs\` says \`// [c line N]\` expectations apply and \`// [java line N]\` ones don’t.

These codes are the same \`sysexits.h\` numbers clox uses, and the checker compares them with \`Outcome::exit_code\` exactly: a VM that reports a compile error as a runtime error fails, even if its message is right.`,
    wrong: [
      {
        code: `${EXIT_HEAD}
    let mut code = 0;
    for line in src.lines() {
        let ce = CE.iter()
            .any(|m| line.contains(m));
        if ce {
            code = 65;
        } else if line.contains(RT) {
            code = 70;
        }
    }
    code
}`,
        why: 'It never skips `// expect:` lines, so a program that prints `// Error` is taken for one with a compile error and gets 65. Check for an output expectation first.',
      },
      {
        code: `${EXIT_HEAD}
    let mut code = 0;
    for line in src.lines() {
        if line.contains("// expect:") {
            continue;
        }
        let lo = line.contains("line ")
            && line.contains("] Error");
        let ce = lo
            || line.contains(CE[0]);
        if ce {
            code = 65;
        } else if line.contains(RT) {
            code = 70;
        }
    }
    code
}`,
        why: 'The loose match also catches `// [java line 1] Error`, which is for jlox only. drip-rs keeps an error only if it has no language tag or the tag `c`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What is the target for drip-rs?',
    options: [
      { t: 'To be faster than the TypeScript VM, whatever it prints', why: 'Speed is measured later. The first requirement is identical behaviour.' },
      { t: 'The same output, error messages, line numbers and exit codes as the TypeScript VM on every corpus program', correct: true, why: 'That is what the corpus tests check.' },
      { t: 'Output that is close enough, ignoring spaces', why: 'The checker compares exactly. Spaces count.' },
    ],
  },
  {
    q: 'Why doesn’t drip-rs link heap objects with `Rc<RefCell<T>>`?',
    options: [
      { t: 'Because `Rc` needs `unsafe`', why: '`Rc` is safe; drip-rs could use it under `#![forbid(unsafe_code)]`.' },
      { t: 'Because `Rc` can’t point at structs', why: 'It can point at any type.' },
      { t: 'Reference counting would replace Drip’s own collector, cycles would leak, and every borrow would be checked at run time', correct: true, why: 'So objects live in arenas, and references are `Gc<T>` handles.' },
      { t: 'Because `Rc` is slower than `Box`', why: 'That isn’t the reason given; the problem is ownership, cycles and who frees objects.' },
    ],
  },
  {
    q: 'A `Gc<ObjClosure>` is…',
    options: [
      { t: 'a typed `u32` index into the heap’s closure arena', correct: true, why: 'It is `Copy`, owns nothing, and can’t be used to look up another kind of object.' },
      { t: 'a pointer that frees the closure when it is dropped', why: 'Handles own nothing. Only the collector frees objects.' },
      { t: 'a reference `&ObjClosure` with a lifetime', why: 'A reference would keep the heap borrowed. A handle is just a number.' },
    ],
  },
  {
    q: 'In drip-rs, who decides when to collect garbage?',
    options: [
      { t: 'The heap, inside every allocation, calling back into the VM for roots', why: 'That is the TypeScript design. The Rust heap can’t hold a reference to the VM that owns it.' },
      { t: 'Rust, when the last handle is dropped', why: 'Handles are plain numbers; dropping one does nothing.' },
      { t: 'The VM (or compiler): it asks `should_collect()`, then calls `collect` with its roots', correct: true, why: 'The roots are passed in as `&dyn Trace` values.' },
      { t: 'Nobody: drip-rs never frees objects', why: 'It has a mark-and-sweep collector; the tests check that it frees unreachable objects.' },
    ],
  },
  {
    q: 'Why is `Rc<Chunk>` the one `Rc` in the crate?',
    options: [
      { t: 'Chunks are shared between threads', why: 'drip-rs is single-threaded, and `Rc` isn’t thread-safe anyway.' },
      { t: 'A compiled chunk never changes, and the VM needs its own pointer to the running chunk while it mutates the heap', correct: true, why: 'An `Rc` clone doesn’t borrow the heap, and an unchanging chunk needs no `RefCell`.' },
      { t: 'Chunks form cycles', why: 'A chunk holds bytes, lines and constants; it doesn’t point back at itself.' },
    ],
  },
  {
    q: 'What does `tests/stress_gc.rs` add over the plain corpus run?',
    options: [
      { t: 'It runs the programs twice and compares', why: 'It runs them once, under different conditions.' },
      { t: 'It times them', why: 'Timing is `scripts/bench.sh`.' },
      { t: 'It turns the collector off', why: 'The opposite.' },
      { t: 'It collects before every allocation, so a missed root fails immediately', correct: true, why: 'Combined with never reusing freed slots, a stale handle panics.' },
    ],
  },
];
