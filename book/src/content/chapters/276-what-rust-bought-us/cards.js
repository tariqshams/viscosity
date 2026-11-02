// Chapter 276 cards. Keys are stable ids: never rename them.

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
  'forced-arena': {
    q: 'What did ownership force on drip-rs’s heap, compared with the TypeScript VM?',
    a: 'Objects live in arenas owned by the heap, and everything else holds `Gc<T>` handles, typed indices, instead of references.',
  },
  'forced-roots': {
    q: 'Why does drip-rs pass its roots into `collect()` instead of letting the heap ask the VM?',
    a: 'The VM owns the heap; the heap can’t borrow the VM that owns it while being borrowed mutably itself.',
  },
  'caught-compile': {
    q: 'Name two kinds of bug the Rust compiler caught while drip-rs was written.',
    a: 'Any two of: a missing opcode arm (E0004), a handle of the wrong type (E0308), a reference into the arena kept across a mutation (E0502), two `&mut self` borrows at once (E0499).',
  },
  'missed-root': {
    q: 'What happens in drip-rs if the VM forgets to pass a root to the collector?',
    a: 'It compiles. The object is freed while still in use; the stress-GC tests make the next use panic, but in normal mode a reused slot may hand back a different object.',
  },
  'safe-not-correct': {
    q: 'A stale `Gc<T>` reads a slot that a new object now occupies. Is that undefined behaviour?',
    a: 'No: the read is in bounds and well-typed, so it is safe. It is still wrong: a logic bug, not a memory-safety bug.',
  },
  'cost-lines': {
    q: 'How many code lines are drip-rs and the TypeScript VM, by this chapter’s count?',
    a: '2,563 in Rust against 1,364 in TypeScript: 1.88× the lines, but 1.53× the non-blank characters.',
  },
  'cost-where': {
    q: 'Give one reason drip-rs has more lines than the TypeScript VM that isn’t about ownership.',
    a: 'JavaScript’s number printing had to be rewritten by hand; the opcodes need an explicit table; there is a CLI; and rustfmt wraps lines at 90 columns.',
  },
  'speed-scope': {
    q: 'What is the honest one-line summary of drip-rs’s speed?',
    a: 'On the committed run, 3.31× to 5.68× the TypeScript VM (geometric mean 4.00×) on nine programs; one run against best of three on a shared VM.',
  },
  'biggest-win': {
    q: 'Which single decision in drip-rs was worth the most speed in this Part’s measurements?',
    a: 'The registers: without them fib ran about twice as long. Removing bounds checks was within the noise.',
  },
  'rust-tradeoffs': {
    q: 'In one sentence, what did Rust give drip-rs and what did it cost?',
    a: 'Memory safety without a runtime and about 4× the speed of the TypeScript VM, paid for with nearly twice the lines and a design built around ownership.',
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
    walkthrough: `The whole job is three decisions per line, in the right order:

\`\`\`rust
let t = line.trim();
if t.starts_with("#[cfg(test)]") {
    in_test = true;
}
if t.is_empty() || t.starts_with("//") {
    continue;
}
if in_test { test += 1 } else { code += 1 }
\`\`\`

Setting the flag before skipping means the attribute line itself is a test line, and everything after it is too. That relies on drip-rs’s habit of putting its \`#[cfg(test)] mod tests\` at the bottom of each module, which holds for all six modules that have one.

Counting is full of choices like these, and each one moves the result. This chapter’s count also skipped \`/* */\` blocks and, in TypeScript, JSDoc lines that start with \`*\`. It didn’t count the integration tests in \`tests/\` at all. A different counter, such as one that counts comments or tokens, would give a different ratio. So the chapter gives two measures, lines and non-blank characters, and says how both were made.`,
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
    q: 'Which of these did Rust’s compiler *not* catch in drip-rs?',
    options: [
      { t: 'A `match` on opcodes missing an arm', why: 'That is E0004, an exhaustiveness error (chapter 258).' },
      { t: 'Keeping a reference into the heap while pushing onto the stack', why: 'That is E0502 (chapter 258), and the reason for the registers.' },
      { t: 'Forgetting to pass a root to the collector', correct: true, why: 'Handles are plain numbers to the compiler. Only the stress-GC tests find it.' },
    ],
  },
  {
    q: 'In normal mode, a stale handle reads a slot that a new object now uses. What kind of bug is that?',
    options: [
      { t: 'Undefined behaviour, like a dangling pointer in C', why: 'The read is in bounds and of the right type, so Rust’s guarantees hold.' },
      { t: 'A logic bug: safe, defined, and wrong', correct: true, why: 'Memory safety rules out corruption, not mistakes. That is why the stress and debug modes never reuse a slot, so the read panics instead.' },
      { t: 'A compile error', why: 'Nothing about it is visible in the types.' },
    ],
  },
  {
    q: 'drip-rs has 1.88× the code lines of the TypeScript VM but 1.53× the non-blank characters. What explains most of the gap?',
    options: [
      { t: 'Rust lines are shorter on average: rustfmt breaks long expressions over several lines', correct: true, why: 'Average code line: 22.6 non-blank characters in Rust, 27.8 in TypeScript, where some lines run to 152 columns.' },
      { t: 'Rust has more comments', why: 'Comments weren’t counted in either measure.' },
      { t: 'Rust’s test modules', why: 'They were excluded: 223 lines that aren’t in the 2,563.' },
    ],
  },
  {
    q: 'Which part of drip-rs has no counterpart in the TypeScript VM because JavaScript gives it for free?',
    options: [
      { t: 'The dispatch loop', why: 'Both VMs have one: `vm.ts` and `vm.rs`.' },
      { t: 'Printing numbers exactly as JavaScript’s `String(n)` does', correct: true, why: '`value.rs` reimplements JavaScript’s number format (`1e+21`, `-0`), which TypeScript simply calls.' },
      { t: 'The hash table', why: 'The TypeScript VM wrote its own too, in `table.ts`.' },
    ],
  },
  {
    q: 'What is the most defensible summary of drip-rs’s speed?',
    options: [
      { t: 'Rust is four times faster than TypeScript', why: 'One program, one port, one machine: it ranks two implementations, not two languages.' },
      { t: 'drip-rs ran 3.31×–5.68× as fast as the TypeScript VM on nine programs, in one run each against best of three, on a shared VM', correct: true, why: 'The numbers, their scope and the method, all from the committed results.' },
      { t: 'drip-rs is fast because it avoids bounds checks', why: 'It keeps every check; removing four of them saved about 8% of instructions and no measurable time.' },
    ],
  },
  {
    q: 'Which change bought the most speed in Part XII’s own measurements?',
    options: [
      { t: 'Turning off bounds checks with unsafe', why: 'Within the noise on fib, and forbidden in drip-rs anyway.' },
      { t: 'Hoisting the hash table’s bounds check by hand', why: 'The optimizer had done it already; doing it again added instructions.' },
      { t: 'Keeping ip and the chunk as registers', correct: true, why: 'Without them, fib ran 39.27 billion instructions instead of 20.19, and about twice as long.' },
    ],
  },
];
