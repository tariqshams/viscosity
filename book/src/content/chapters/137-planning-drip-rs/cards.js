// Chapter 137 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'drip-rs-what': {
    q: 'What is **drip-rs**?',
    a: 'The Rust port of Drip’s bytecode VM (book/companion/rust): a library crate `drip` and a binary `drip-rs`, tested against the same corpus as the TypeScript VM, which it must match byte for byte.',
  },
  'why-not-rc': {
    q: 'Give one reason drip-rs doesn’t link its heap objects with `Rc<RefCell<..>>`.',
    a: 'Reference counting would decide when objects die instead of Drip’s collector; cycles of `Rc`s leak; and every `borrow_mut` is a check at run time.',
  },
  'gc-handle': {
    q: 'What is a `Gc<T>` in drip-rs?',
    a: 'A typed `u32` index into the heap’s arena for `T`. It is `Copy`, 4 bytes, owns nothing, and `heap[handle]` reads the object.',
  },
  'roots-in': {
    q: 'Why can’t drip-rs’s heap call back into the VM to find roots, as the TypeScript heap does?',
    a: 'The VM owns the heap. A heap method holding the whole VM would need `&mut` to part of something already borrowed, which the borrow checker rejects (E0502). So the VM passes its roots in.',
  },
  'one-rc': {
    q: 'Why is a compiled chunk kept in an `Rc<Chunk>`?',
    a: 'So the VM can hold the running chunk in its own field without keeping the heap borrowed. The chunk never changes once compiled, so it needs no `RefCell`.',
  },
  'corpus-check': {
    q: 'What does drip-rs’s corpus test compare for each program?',
    a: 'The output, the exact list of compile errors, the runtime error and its stack trace, and the exit code, all read from the program’s `# expect` comments.',
  },
  'stress-gc': {
    q: 'What does `tests/stress_gc.rs` do differently from the plain corpus run?',
    a: 'It collects garbage before every allocation (and never reuses a freed slot), so a forgotten root fails at once.',
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

export const exercises = {
  expectOutput: {
    lang: 'rust',
    title: 'Read a corpus expectation',
    prompt: 'Corpus programs say what they should print in comments: `print 1 + 2; # expect: 3`. Write `expect_output`, which does what drip-rs’s `tests/common/mod.rs` does for these lines: return the text after `# expect:` with **one** optional space removed, or `None` if the line has no such comment. Then write `expected`, which collects the expectation of every line of a program, in order.',
    starter: `fn expect_output(line: &str)
    -> Option<&str> {
    todo!()
}

fn expected(src: &str) -> Vec<&str> {
    todo!()
}`,
    solution: `/// The text after \`# expect:\` and one
/// optional space, if the line has one.
fn expect_output(line: &str)
    -> Option<&str> {
    let m = "# expect:";
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
}`,
    tests: `#[test]
fn reads_one_expectation() {
    let l = "print 1 + 2; # expect: 3";
    assert_eq!(expect_output(l), Some("3"));
}

#[test]
fn lines_without_one_give_none() {
    assert_eq!(expect_output("print 3;"), None);
    assert_eq!(expect_output("# a note"), None);
}

#[test]
fn only_one_space_is_dropped() {
    let l = "print \\"  hi\\"; # expect:   hi";
    assert_eq!(expect_output(l), Some("  hi"));
    let l = "print \\"\\"; # expect:";
    assert_eq!(expect_output(l), Some(""));
}

#[test]
fn collects_every_line_in_order() {
    let src = "print 1; # expect: 1\\n\\
               let a = 2;\\n\\
               print a; # expect: 2\\n";
    assert_eq!(expected(src), ["1", "2"]);
}`,
    hints: [
      'Do one by hand first: in `print 1 + 2; # expect: 3`, where does the marker start, where does it end, and what is left?',
      '`line.find("# expect:")` returns `Option<usize>`, the byte index where the marker starts. A `?` after it makes your function return `None` when the marker is missing.',
      'The text you want starts at that index plus the marker’s length: `&line[at + m.len()..]`. Then `rest.strip_prefix(\' \')` gives `Some(shorter)` if `rest` starts with a space, and `.unwrap_or(rest)` keeps `rest` otherwise.',
      'For `expected`, loop over `src.lines()`, call `expect_output` on each line, and push every `Some` result into a `Vec`.',
    ],
    walkthrough: `**How to think about it.** This is the first rule the corpus checker applies, and it has to agree exactly with the TypeScript runner, because both VMs are judged by the same comments. Do one line by hand: in \`print 1 + 2; # expect: 3\` the marker \`# expect:\` starts at byte 13; it is 9 bytes long, so what follows it is \` 3\`; drop one space and you have \`3\`. That is three steps (find, slice, drop one space), and each has a ready-made method on \`&str\`.

**The solution, line by line.**

- \`fn expect_output(line: &str) -> Option<&str> {\` takes a borrowed line and may return a piece of it. The result borrows from \`line\`; with only one reference coming in, Rust works that out without a lifetime annotation (*Lifetimes* explains the rule).
- \`let m = "# expect:";\` names the marker once, so its length is never typed by hand.
- \`let at = line.find(m)?;\` is the byte offset where the marker starts. If there is no marker, \`find\` gives \`None\`, and the \`?\` returns that \`None\` from the whole function at once.
- \`let rest = &line[at + m.len()..];\` slices from just past the marker to the end of the line. Nothing is copied: \`rest\` points into \`line\`.
- \`Some(rest.strip_prefix(' ').unwrap_or(rest))\`: \`strip_prefix\` gives \`Some\` of the text without one leading space, or \`None\` if there was no space; \`unwrap_or(rest)\` falls back to \`rest\` unchanged. The answer is wrapped in \`Some\`.
- In \`expected\`, \`let mut out = Vec::new();\` starts an empty list, \`for line in src.lines()\` visits each line, and \`if let Some(e) = e { out.push(e); }\` keeps only the lines that had an expectation. \`out\` holds \`&str\`s that all borrow from \`src\`.

**Common wrong attempts.**

- \`rest.trim_start()\` removes *every* leading space. The TypeScript pattern is \`# expect: ?(.*)\`: the \`?\` makes one space optional and \`(.*)\` keeps everything after it. That matters: \`print "  hi";\` must print two leading spaces, and \`trim_start\` would let a VM that lost them pass.
- \`Some(&line[at..])\` slices from where the marker *starts*, so the answer still begins with \`# expect:\`.

The real checker also removes a \`\\r\` at the end of each line first, so a file saved with Windows line endings is read the same way.`,
    wrong: [
      {
        code: `fn expect_output(line: &str)
    -> Option<&str> {
    let m = "# expect:";
    let at = line.find(m)?;
    let rest = &line[at + m.len()..];
    Some(rest.trim_start())
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
}`,
        why: '`trim_start` removes every leading space, not just one. A program that prints `"  hi"` would then expect `hi`, and a VM that lost the spaces would pass.',
      },
      {
        code: `fn expect_output(line: &str)
    -> Option<&str> {
    let m = "# expect:";
    let at = line.find(m)?;
    Some(&line[at..])
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
}`,
        why: 'This slices from where the marker *starts*, so the result still begins with `# expect:`. Skip `m.len()` bytes as well.',
      },
    ],
  },
  exitCode: {
    lang: 'rust',
    optional: true,
    title: 'Which exit code should it be?',
    prompt: 'The corpus checker also works out the exit code a program should end with, from its comments. Write `expected_exit`, a cut-down version of `parse_expectations` in drip-rs’s `tests/common/mod.rs`: **70** if a line has `# expect runtime error: `, **65** if a line has `# expect compile error: `, and **0** otherwise. One detail from the real one: a line with `# expect:` is an output expectation and nothing else, even if the text after it mentions an error, because the real parser tries that marker first.',
    starter: `const OUT: &str = "# expect:";
const RT: &str =
    "# expect runtime error: ";
const CE: &str =
    "# expect compile error: ";

/// The exit code a corpus program's
/// comments ask for.
fn expected_exit(src: &str) -> i32 {
    todo!()
}`,
    solution: `const OUT: &str = "# expect:";
const RT: &str =
    "# expect runtime error: ";
const CE: &str =
    "# expect compile error: ";

/// The exit code a corpus program's
/// comments ask for.
fn expected_exit(src: &str) -> i32 {
    let mut code = 0;
    for line in src.lines() {
        if line.contains(OUT) {
            continue;
        }
        if line.contains(RT) {
            code = 70;
        } else if line.contains(CE) {
            code = 65;
        }
    }
    code
}`,
    tests: `#[test]
fn plain_output_exits_0() {
    let src = "print 1; # expect: 1";
    assert_eq!(expected_exit(src), 0);
}

#[test]
fn a_runtime_error_is_70() {
    let src = "print xs[3]; # expect runtime error: index 3";
    assert_eq!(expected_exit(src), 70);
}

#[test]
fn a_compile_error_is_65() {
    let src = "print 1\\n# expect compile error: line 1: expected ';'";
    assert_eq!(expected_exit(src), 65);
}

#[test]
fn output_that_mentions_an_error() {
    let src = "print \\"# expect compile error: x\\"; # expect: # expect compile error: x";
    assert_eq!(expected_exit(src), 0);
}`,
    hints: [
      'Walk `src.lines()` with `let mut code = 0;`, and set `code` to 70 or 65 when a line matches.',
      'Test for `# expect:` first and `continue`: in the real parser an output expectation wins over every other rule on its line.',
      'Match the full markers, `RT` and `CE`, with `line.contains(..)`; a looser test such as `contains("error")` also catches programs that only print the word.',
    ],
    walkthrough: `**How to think about it.** drip-rs’s \`parse_expectations\` reads each line through a chain of \`if let ... else if let\`: output first, then the runtime error, then the trace, then the compile error. Each match records something, and the two error kinds also set \`exit_code\`: 70 for a runtime error, 65 for a compile error. Your version keeps only the exit code, but it must try the markers in a safe order, and the order that matters most is "output first".

**The solution, line by line.**

- \`let mut code = 0;\` is the answer when no line asks for an error: a program that runs cleanly exits with 0.
- \`for line in src.lines() {\` visits each line of the program.
- \`if line.contains(OUT) { continue; }\` is the key detail. A program may well print text that looks like an error comment (the last test does exactly that), and because the real checker tries \`# expect:\` first, such a line counts as output and nothing else; \`continue\` skips the rest of the loop body for it.
- \`if line.contains(RT) { code = 70; }\` catches \`# expect runtime error: \`, with its trailing space, as the real marker has.
- \`else if line.contains(CE) { code = 65; }\` catches \`# expect compile error: \`.
- \`code\` at the end returns whatever the last matching line set.

**Common wrong attempts.**

- Leaving out the \`continue\`: the program that prints \`"# expect compile error: x"\` is then taken for one with a compile error, and gets 65.
- Matching loosely, for example \`line.contains("error")\`: a program whose output merely mentions an error, or whose comment says \`# a runtime error here would be bad\`, gets the wrong code.

The checker compares this number with \`Outcome::exit_code\` exactly, so a VM that reports a compile error as a runtime error fails, even if its message is right.`,
    wrong: [
      {
        code: `const OUT: &str = "# expect:";
const RT: &str =
    "# expect runtime error: ";
const CE: &str =
    "# expect compile error: ";

/// The exit code a corpus program's
/// comments ask for.
fn expected_exit(src: &str) -> i32 {
    let mut code = 0;
    for line in src.lines() {
        if line.contains(RT) {
            code = 70;
        } else if line.contains(CE) {
            code = 65;
        }
    }
    code
}`,
        why: 'It never skips `# expect:` lines, so a program that prints `# expect compile error: x` is taken for one with a compile error and gets 65. Check for an output expectation first.',
      },
      {
        code: `const OUT: &str = "# expect:";
const RT: &str =
    "# expect runtime error: ";
const CE: &str =
    "# expect compile error: ";

/// The exit code a corpus program's
/// comments ask for.
fn expected_exit(src: &str) -> i32 {
    let mut code = 0;
    for line in src.lines() {
        if line.contains(OUT) {
            continue;
        }
        if line.contains("error") {
            code = 70;
        }
    }
    code
}`,
        why: 'The loose match treats a compile error as a runtime error (70 instead of 65), and would also catch any comment that merely mentions the word.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What is the target for drip-rs?',
    options: [
      {
        t: 'To be faster than the TypeScript VM, whatever it prints',
        why: 'Speed is measured later. The first requirement is identical behaviour.',
      },
      {
        t: 'The same stdout, stderr and exit code as the TypeScript VM on every corpus program',
        correct: true,
        why: 'That is what the corpus tests and `compare_with_ts.mjs` check.',
      },
      {
        t: 'Output that is close enough, ignoring spaces',
        why: 'The checker compares exactly. Spaces count.',
      },
    ],
  },
  {
    q: 'Why doesn’t drip-rs link heap objects with `Rc<RefCell<T>>`?',
    options: [
      {
        t: 'Because `Rc` needs `unsafe`',
        why: '`Rc` is safe; drip-rs could use it under `#![forbid(unsafe_code)]`.',
      },
      {
        t: 'Because `Rc` can’t point at structs',
        why: 'It can point at any type.',
      },
      {
        t: 'Reference counting would replace Drip’s own collector, cycles would leak, and every borrow would be checked at run time',
        correct: true,
        why: 'So objects live in arenas, and references are `Gc<T>` handles.',
      },
    ],
  },
  {
    q: 'A `Gc<ObjClosure>` is…',
    options: [
      {
        t: 'a pointer that frees the closure when it is dropped',
        why: 'Handles own nothing. Only the collector frees objects.',
      },
      {
        t: 'a typed `u32` index into the heap’s closure arena',
        correct: true,
        why: 'It is `Copy`, 4 bytes, and can’t be used to look up another kind of object.',
      },
      {
        t: 'a reference `&ObjClosure` with a lifetime',
        why: 'A reference would keep the heap borrowed. A handle is only a number.',
      },
    ],
  },
  {
    q: 'In drip-rs, who decides when to collect garbage?',
    options: [
      {
        t: 'The heap, inside every allocation, calling back into the VM for roots',
        why: 'That is the TypeScript design. The Rust heap can’t hold a reference to the VM that owns it.',
      },
      {
        t: 'Rust, when the last handle is dropped',
        why: 'Handles are plain numbers; dropping one does nothing.',
      },
      {
        t: 'Nobody: drip-rs never frees objects',
        why: 'It has a mark-and-sweep collector, and the tests check that it frees unreachable objects.',
      },
      {
        t: 'The VM (or the compiler): it asks `should_collect()`, then calls `collect` with its roots',
        correct: true,
        why: 'The roots are passed in as `&dyn Trace` values.',
      },
    ],
  },
  {
    q: 'Why is `Rc<Chunk>` the one `Rc` in the crate?',
    options: [
      {
        t: 'A compiled chunk never changes, and the VM needs its own pointer to the running chunk while it changes the heap',
        correct: true,
        why: 'An `Rc` clone doesn’t borrow the heap, and a chunk that never changes needs no `RefCell`.',
      },
      {
        t: 'Chunks are shared between threads',
        why: 'drip-rs is single-threaded, and `Rc` isn’t thread-safe anyway.',
      },
      {
        t: 'Chunks form cycles',
        why: 'A chunk holds bytes, lines and constants; it doesn’t point back at itself.',
      },
    ],
  },
];
