// Chapter 306 cards. Keys are stable ids: never rename them.

export const prompts = {
  'opt-what': {
    q: 'What are the two variants of `Option<T>`?',
    a: '`Some(value)`, holding a `T`, and `None`, holding nothing.',
  },
  'opt-vs-undefined': {
    q: 'Why can’t you add 1 to an `Option<usize>`?',
    a: 'It is a different type from `usize` (E0369). You must first check whether it is `Some` and take the number out.',
  },
  'opt-minus-one': {
    q: 'What is wrong with returning `-1` for “not found”, as `indexOf` does?',
    a: '`-1` is still a number, so nothing stops the caller from using it as if it were a real answer.',
  },
  'opt-open': {
    q: 'A `match` on an `Option` has a `Some(i)` arm only. What happens?',
    a: 'It doesn’t compile: E0004, non-exhaustive patterns, `None` not covered.',
  },
  'opt-if-let': {
    q: 'What does `if let Some(i) = find(&xs, 6) { ... }` do when `find` returns `None`?',
    a: 'Nothing: the block is skipped. It runs only for `Some`, with `i` bound.',
  },
  'unwrap-panics': {
    q: 'What does `.unwrap()` do on `None`, and when is it acceptable?',
    a: 'It panics, stopping the program. Use it only where `None` would be a bug, as in a test.',
  },
  'unwrap-or': {
    q: 'What is `find(&xs, 9).unwrap_or(0)` when 9 is not in `xs`?',
    a: '`0`: the default given to `unwrap_or`, since there was no value.',
  },
  npo: {
    q: 'Why is `Option<&T>` the same size as `&T`, while `Option<i32>` is bigger than `i32`?',
    a: 'A reference is never null, so `None` can use the null pattern. Every `i32` pattern is a real number, so a tag is needed.',
  },
};

export const examples = {
  'opt-play': {
    lang: 'rust',
    title: 'Four ways to open an Option',
    code: `fn find(xs: &[i32], t: i32)
    -> Option<usize> {
    for i in 0..xs.len() {
        if xs[i] == t {
            return Some(i);
        }
    }
    None
}

fn main() {
    let xs = [4, 5, 6];
    match find(&xs, 5) {
        Some(i) => println!("at {i}"),
        None => println!("absent"),
    }
    if let Some(i) = find(&xs, 6) {
        println!("6 is at {i}");
    }
    let i = find(&xs, 9).unwrap_or(0);
    println!("{i}");
    println!("{:?}", find(&xs, 4));
    println!("{:?}", xs.get(9));
    // Try: find(&xs, 9).unwrap()
}`,
  },
};

const sig = `fn resolve(locals: &[&str], name: &str)
    -> Option<usize> {`;

export const exercises = {
  resolve: {
    lang: 'rust',
    title: 'Which slot is that local in?',
    prompt:
      'When Drip’s compiler meets a variable name inside a function, it looks for it among the locals declared so far: `locals[i]` is the name in stack slot `i`. A name can be declared twice (an inner block’s `let x` hides an outer `x`), and the **most recent** declaration wins, so search from the end. Write `resolve(locals, name)`, returning `Some(slot)` of the last local with that name, or `None` if there is none (then the name must be a global). This is `resolve_local` from `companion/rust/src/compiler.rs`, simplified. Use a `while` loop counting down.',
    starter: `${sig}
    None
}`,
    solution: `${sig}
    let mut i = locals.len();
    while i > 0 {
        i -= 1;
        if locals[i] == name {
            return Some(i);
        }
    }
    None
}`,
    tests: `#[test]
fn finds_a_single_local() {
    let ls = ["a", "b"];
    assert_eq!(resolve(&ls, "b"), Some(1));
}
#[test]
fn the_latest_declaration_wins() {
    let ls = ["x", "y", "x"];
    assert_eq!(resolve(&ls, "x"), Some(2));
}
#[test]
fn slot_zero_is_a_real_slot() {
    let ls = ["n", "m"];
    assert_eq!(resolve(&ls, "n"), Some(0));
}
#[test]
fn unknown_names_are_none() {
    assert_eq!(resolve(&["a"], "z"), None);
    assert_eq!(resolve(&[], "a"), None);
}`,
    hints: [
      'Two answers are possible: a slot number, or “not a local”. That is exactly `Option<usize>`: `Some(slot)` or `None`.',
      'Start one past the end, `let mut i = locals.len();`, and loop `while i > 0`. Take one off `i` *before* reading `locals[i]`, so the first slot you read is the last one.',
      'Inside the loop: `i -= 1; if locals[i] == name { return Some(i); }`. If the loop finishes without returning, the last line of the function is `None`.',
    ],
    walkthrough: `**How to think about it.** Picture the locals as a stack of name cards, newest on top: for \`["x", "y", "x"]\` the top card is the inner \`x\` in slot 2, and it hides the outer \`x\` in slot 0. Looking a name up means reading from the top down and stopping at the first match. There are two kinds of answer, "slot 2" and "not here at all", and the second is not a number, so the return type is \`Option<usize>\` rather than a \`usize\` with a magic value. (Using \`-1\` would not even type-check: \`usize\` cannot be negative.)

**The solution, line by line.**

- \`let mut i = locals.len();\` starts one past the last slot. With three locals, \`i\` is 3.
- \`while i > 0 {\` keeps going while there is a slot below \`i\` left to read. Counting down with \`usize\` needs care: \`i\` can never go below 0, so the test is \`i > 0\`, and the step comes first.
- \`i -= 1;\` moves to the slot to read now: 2, then 1, then 0.
- \`if locals[i] == name {\` compares two string slices; \`==\` on \`&str\` compares their text.
- \`return Some(i);\` leaves at once with the slot, wrapped in \`Some\`, so the caller has to read the slip before using it.
- \`None\` (the last line, after the loop) is reached only when no slot matched: the name is not a local.

For \`resolve(&["x", "y", "x"], "x")\`: \`i\` goes 3 to 2, \`locals[2]\` is \`"x"\`, so the answer is \`Some(2)\`, the inner declaration. For an empty list the loop never runs and the answer is \`None\`.

**How the real compiler writes it.** \`resolve_local\` in the companion does the same search in one line, with iterators (a later chapter): \`locals.iter().enumerate().rev().find(...)?\`, and that \`?\` on an \`Option\` is the subject of the next chapter.

**Common wrong attempts.**

- Searching from the start finds the *outer* \`x\`, slot 0, so an inner variable could never hide an outer one.
- \`while i > 0 { if locals[i - 1] == name { return Some(i); } i -= 1; }\` checks the right slot but returns \`i\`, one too many: the classic off-by-one, which the test for slot 0 catches.
- \`let mut i = locals.len() - 1;\` looks natural, but for an empty list \`0 - 1\` on a \`usize\` panics with "attempt to subtract with overflow".`,
    wrong: [
      {
        code: `${sig}
    let mut i = 0;
    while i < locals.len() {
        if locals[i] == name {
            return Some(i);
        }
        i += 1;
    }
    None
}`,
        why: 'Searching from the start finds the oldest declaration, so `["x", "y", "x"]` gives `Some(0)` instead of `Some(2)`.',
      },
      {
        code: `${sig}
    let mut i = locals.len();
    while i > 0 {
        if locals[i - 1] == name {
            return Some(i);
        }
        i -= 1;
    }
    None
}`,
        why: 'It compares slot `i - 1` but returns `i`, one too many.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does `[4, 5, 6].get(9)` return?',
    options: [
      { t: '`undefined`', why: 'Rust has no `undefined`.' },
      { t: '`None`', correct: true, why: '`get` asks politely and answers with an `Option`; there is no slot 9.' },
      { t: 'It panics: index out of bounds', why: 'That is what `xs[9]` does. `get` returns `None` instead.' },
    ],
  },
  {
    q: `Does this compile?
\`\`\`
match find(&xs, 5) {
    Some(i) => println!("{i}"),
}
\`\`\``,
    options: [
      { t: 'Yes, and it prints nothing when 5 is missing', why: 'A `match` with an uncovered variant does not compile.' },
      { t: 'Yes, but it panics when 5 is missing', why: 'The compiler catches it before the program runs.' },
      { t: 'No: E0004, `None` not covered', correct: true, why: '`match` must be exhaustive; add `None => ...`, or use `if let`.' },
    ],
  },
  {
    q: 'Where is `.unwrap()` on an `Option` a reasonable choice?',
    options: [
      { t: 'In a test, or where `None` would mean your own program has a bug', correct: true, why: 'A panic there points straight at the bug. For input that can really be missing, handle `None`.' },
      { t: 'On user input, to keep the code short', why: 'One bad input then stops the whole program.' },
      { t: 'Nowhere: it does not compile on `None`', why: 'It compiles; it panics at run time if the value is `None`.' },
    ],
  },
  {
    q: 'Which TypeScript type is closest to `Option<number>`?',
    options: [
      { t: '`number`, with `-1` meaning missing', why: 'That is the magic-value habit `Option` replaces: `-1` is still a number.' },
      { t: '`number | undefined`, under `strictNullChecks`', correct: true, why: 'Both make you check before use; `Option` is an ordinary enum, so the check never depends on compiler settings.' },
      { t: '`number[]`', why: 'An array can hold many values; an `Option` holds at most one.' },
    ],
  },
  {
    q: 'On this machine `&i32` is 8 bytes. How big is `Option<&i32>`?',
    options: [
      { t: '16 bytes: the reference plus a tag', why: 'No tag is needed: a reference is never null, so `None` uses the null pattern.' },
      { t: '9 bytes', why: 'Sizes are rounded up to the alignment anyway; and here no tag byte is needed at all.' },
      { t: '8 bytes, the same as `&i32`', correct: true, why: 'The null pointer optimization, which the standard library guarantees for references and `Box`.' },
    ],
  },
];
