// Chapter 353 cards. Keys are stable ids: never rename them.

const LONGEST = `fn longest_line(src: &str) -> &str {
    let mut best = "";
    for line in src.lines() {
        if line.len() > best.len() {
            best = line;
        }
    }
    best
}`;

export const prompts = {
  'lt-what': {
    q: 'What is a **lifetime** in Rust?',
    a: 'The stretch of code during which a reference must stay valid: from where it is made to its last use. It must fit inside the life of the value it points at.',
  },
  'lt-dangle': {
    q: 'What is a **dangling** reference?',
    a: 'A reference that points at a value which has already been dropped (freed). Rust refuses to compile any program that could use one.',
  },
  'lt-e0597': {
    q: 'Error E0597 says “`text` does not live long enough”. Which three places does it point at?',
    a: 'Where the borrow was made, where the owner `text` was dropped, and where the borrow was still used after that.',
  },
  'lt-return-local': {
    q: 'A function makes a `String` in a local variable and tries to return a reference to it. What is the usual fix?',
    a: 'Return the owned `String` itself (`-> String`), moving it out to the caller, instead of a reference to a local that is about to be dropped.',
  },
  'lt-last-use': {
    q: 'Does a borrow last until the closing brace of its scope?',
    a: 'No. It lasts until the reference’s last use, so after that point the value may be borrowed mutably again.',
  },
  'lt-ts': {
    q: 'Why does TypeScript never need lifetimes?',
    a: 'Its garbage collector keeps any object alive for as long as some reference can reach it, so a reference can never outlive its object.',
  },
  'lt-c': {
    q: 'What does C do with a function that returns a pointer to its own local array?',
    a: 'It compiles (usually with a warning), and the pointer dangles: the stack frame it points into is gone after the return.',
  },
  'lt-cost': {
    q: 'What do lifetimes cost when the program runs?',
    a: 'Nothing: they are checked while compiling and then thrown away. A `&str` is still only an address and a length.',
  },
};

export const examples = {
  'lifetime-play': {
    lang: 'rust',
    title: 'An owner that lives long enough',
    code: `fn main() {
    let text = String::from("let x");
    let r;
    {
        let n = text.len();
        r = &text[0..3];
        println!("n is {n}");
    }
    // text is still alive here, so r is
    // safe to use.
    println!("r is {r}");
    // Try: move \`let text = ...\` into
    // the block, and run it again.
}`,
  },
};

export const exercises = {
  longestLine: {
    lang: 'rust',
    title: 'The longest line, without copying',
    prompt:
      'Write `longest_line`, which returns the longest line of `src` (the first one, if several tie, and `""` for an empty source). Return a **slice of `src`**, not a new `String`: the tests check that the answer points into the original text, and that it can be used for as long as the source is alive. `src.lines()` hands out each line in turn as a `&str` that borrows from `src`.',
    starter: `fn longest_line(src: &str) -> &str {
    todo!()
}`,
    solution: LONGEST,
    tests: `#[test]
fn picks_the_longest() {
    assert_eq!(longest_line("a\\nbbb\\ncc"), "bbb");
    assert_eq!(longest_line("one line"), "one line");
}

#[test]
fn first_one_wins_a_tie() {
    assert_eq!(longest_line("ab\\ncd\\ne"), "ab");
}

#[test]
fn empty_source_gives_empty_line() {
    assert_eq!(longest_line(""), "");
}

#[test]
fn points_into_the_source() {
    let src = "x\\nlet y = 2;\\nz";
    let l = longest_line(src);
    // the same bytes, not a copy
    assert_eq!(l.as_ptr(), src[2..].as_ptr());
}

#[test]
fn lives_as_long_as_the_source() {
    let src = String::from("fn\\nmain\\n{}");
    let l;
    {
        let view: &str = &src;
        l = longest_line(view);
    }
    assert_eq!(l, "main");
}`,
    hints: [
      'Keep the best line so far in a variable that starts as the empty string `""`, and look at every line in turn.',
      '`for line in src.lines()` gives each line as a `&str`. If `line.len()` is bigger than `best.len()`, make `line` the new best.',
      'Use `>` rather than `>=`, so a later line of the same length does not replace the first one. Return `best` as the last line of the function, with no semicolon.',
    ],
    walkthrough: `**How to think about it.** On paper you would read the lines one by one, keeping your finger on the longest so far, and move your finger only when you find a strictly longer one. That is the whole algorithm. The lifetime part is about *what* you keep your finger on: not a copy of the line, but a slice that points into \`src\`, so the function allocates nothing.

**Why no lifetime annotations are needed.** The signature \`fn longest_line(src: &str) -> &str\` has exactly one reference going in and one coming out, so Rust assumes the answer borrows from \`src\` (the next chapter names this as an elision rule). That assumption is true here: every \`line\` is a slice of \`src\`, and so is \`""\`, which is a string literal that lives for the whole program and can stand in for any shorter borrow.

**The solution, line by line.**

- \`fn longest_line(src: &str) -> &str {\` borrows the source and promises a slice that lives as long as that borrow.
- \`let mut best = "";\` is the best line so far, the empty string, so an empty source gives \`""\`. It needs \`mut\` because we will point it at other lines.
- \`for line in src.lines() {\` walks the lines. \`lines\` splits on \`\\n\` and gives each line, without the newline, as a \`&str\` into \`src\`.
- \`if line.len() > best.len() {\` asks "strictly longer?". With \`>\`, a tie keeps the earlier line.
- \`best = line;\` moves your finger: \`best\` now points at this line. Nothing is copied; both are just an address and a length.
- \`best\` on the last line, with no semicolon, is the value the function returns (the tail expression from *Functions and expressions*).

The last test shows the lifetime at work: \`view\` is a borrow made inside a block, but the answer borrows from \`src\` itself (through \`view\`), and \`src\` lives to the end of the test, so \`l\` may be used after the block.

**Common wrong attempts.**

- Returning \`String\` and writing \`best.to_string()\`: it gives the right text, but it copies, and the pointer test fails because the copy lives somewhere else on the heap. It also changes the signature, which is the real tell: a function that only *picks* part of its input should return a slice of it.
- Writing \`>=\`: on a tie the later line wins, so \`"ab\\ncd\\ne"\` gives \`"cd"\`.
- Making \`best\` a \`&String\` or building a \`Vec\` of lines first: more work than needed, and a \`Vec\` allocates.`,
    wrong: [
      {
        code: `fn longest_line(src: &str) -> String {
    let mut best = "";
    for line in src.lines() {
        if line.len() > best.len() {
            best = line;
        }
    }
    best.to_string()
}`,
        why: 'The text is right, but it is a copy: the pointer test fails, because the answer no longer points into `src`.',
      },
      {
        code: `fn longest_line(src: &str) -> &str {
    let mut best = "";
    for line in src.lines() {
        if line.len() >= best.len() {
            best = line;
        }
    }
    best
}`,
        why: 'With `>=` a later line of the same length replaces the first, so a tie returns the wrong line.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A slice of `text` is stored in `r`, `text` is dropped at the end of a block, and `r` is printed after the block. What happens?',
    options: [
      { t: 'It prints whatever is left in the freed memory', why: 'That is what happens in C. Rust never runs the program.' },
      { t: 'It panics at run time', why: 'There is no run-time check: the error is found while compiling.' },
      { t: 'It does not compile: E0597, `text` does not live long enough', correct: true, why: 'The borrow is still used after its owner is dropped, so its lifetime does not fit inside the owner’s.' },
      { t: 'It works, because Rust keeps `text` alive while `r` exists', why: 'Rust has no garbage collector; it never stretches a value’s life to suit a reference.' },
    ],
  },
  {
    q: 'Which is the best fix for `fn make() -> &String { let s = String::from("hi"); &s }`?',
    options: [
      { t: '`fn make() -> String { String::from("hi") }`', correct: true, why: 'Return the owned value and move it to the caller; nothing is borrowed, so nothing can dangle.' },
      { t: '`fn make() -> &\'static String`', why: 'The compiler mentions it, but `s` does not live for the whole program, so this still fails.' },
      { t: 'Declare `s` with `let mut`', why: 'Mutability has nothing to do with how long `s` lives.' },
      { t: 'Add `drop(s)` after the reference is taken', why: 'That frees `s` even sooner, which is the opposite of the fix.' },
    ],
  },
  {
    q: '`let first = &v[0]; println!("{first}"); v.push(4);` compiles. Why?',
    options: [
      { t: '`push` does not really change `v`', why: 'It does, and it may even move the elements to a new buffer.' },
      { t: 'Rust copies `v[0]` into `first`', why: '`&v[0]` is a reference, not a copy.' },
      { t: 'The borrow of `first` ends at its last use, before `push`', correct: true, why: 'Lifetimes are about uses, not braces, so the mutable borrow for `push` meets no live shared borrow.' },
    ],
  },
  {
    q: 'What is left of a lifetime in the compiled program?',
    options: [
      { t: 'A counter next to each value', why: 'That is reference counting (`Rc`), a different tool.' },
      { t: 'A check before each use of a reference', why: 'There is no run-time check.' },
      { t: 'A hidden field in every reference', why: 'A `&str` is still only an address and a length.' },
      { t: 'Nothing: lifetimes are checked while compiling and then discarded', correct: true, why: 'They cost nothing at run time.' },
    ],
  },
  {
    q: 'Why can drip-rs’s scanner hand out tokens without allocating?',
    options: [
      { t: 'Each token’s lexeme is a slice of the source, and the compiler proves no token outlives the source', correct: true, why: 'Lifetimes make pointing into the source safe, so nothing has to be copied.' },
      { t: 'It stores every token in a global array', why: 'It hands out tokens one at a time; an array would allocate.' },
      { t: 'Rust strings never allocate', why: 'A `String` allocates on the heap; a borrowed `&str` does not.' },
    ],
  },
];
