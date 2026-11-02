// Chapter 415 cards. Keys are stable ids: never rename them.

const COUNT = `// (code lines, test lines) in a Rust
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
`;

export const prompts = {
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
  counts: {
    lang: 'rust',
    title: 'Count the lines the way this chapter did',
    prompt:
      'Write `counts(src)`, which returns `(code, test)` for a Rust source file: the number of code lines before the module’s `#[cfg(test)]`, and the number from that line on. Blank lines (only whitespace) and comment lines (starting with `//` after any indentation, which covers `///` and `//!`) count as neither. The `#[cfg(test)]` line itself counts as a test line.',
    starter: `fn counts(src: &str) -> (usize, usize) {
    let n = src.lines().count();
    (n, 0)
}`,
    solution: COUNT,
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
    q: 'Which of these designs in drip-rs exists because of Rust’s ownership rules rather than because a VM needs it?',
    options: [
      { t: 'A stack of call frames', why: 'Every VM in this book has one, including the TypeScript VM.' },
      { t: 'Objects in arenas, linked by typed `Gc<T>` handles', correct: true, why: 'Objects that point at each other in cycles cannot be plain Rust references.' },
      { t: 'Bytecode with one-byte opcodes', why: 'The TypeScript VM uses the same instruction set.' },
    ],
  },
  {
    q: 'What does `#![forbid(unsafe_code)]` guarantee about drip-rs?',
    options: [
      { t: 'That it has no bugs', why: 'A forgotten root is still a bug in safe code.' },
      { t: 'That no line of the crate can use `unsafe`, so every index stays checked and there is no undefined behaviour from drip-rs’s own code', correct: true, why: 'Safe Rust has no undefined behaviour; forbid keeps all of drip-rs in safe Rust.' },
      { t: 'That it runs as fast as C', why: 'It says nothing about speed.' },
    ],
  },
  {
    q: 'The stale-handle example prints `zoo` where it meant `fib`. What kind of bug is that?',
    options: [
      { t: 'Undefined behaviour', why: 'Every access is in bounds and well typed; the language’s rules are all kept.' },
      { t: 'A compile error that was ignored', why: 'It compiles with no errors or warnings.' },
      { t: 'A logic bug in safe code: a handle kept after its object was freed', correct: true, why: 'Only tests, such as the stress-GC suite, can find it.' },
    ],
  },
  {
    q: 'By this chapter’s count, how much longer is drip-rs than the TypeScript VM?',
    options: [
      { t: 'About the same length', why: '3,328 lines against 1,714 is nearly double.' },
      { t: 'About 1.94 times as long', correct: true, why: 'Code lines only: no blanks, no comments, no unit tests.' },
      { t: 'About four times as long', why: 'Four is roughly its speed-up, not its length.' },
    ],
  },
  {
    q: 'Where did most of drip-rs’s speed over the TypeScript VM come from, by this Part’s measurements?',
    options: [
      { t: 'From removing bounds checks', why: 'drip-rs keeps them all, and removing one saved no measurable time.' },
      { t: 'From a different instruction set', why: 'It runs the same bytecode as the TypeScript VM.' },
      { t: 'From running the same design as compiled machine code, with the hot state in fields of the `Vm`', correct: true, why: 'Same bytecode, cheaper steps; and removing the chunk register alone made fib about 2.1 times slower.' },
    ],
  },
];
