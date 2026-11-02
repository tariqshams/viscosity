// Chapter 375 cards. Keys are stable ids: never rename them.

export const prompts = {
  'mode-amp': {
    q: 'You write `if let Some(s) = &name` where `name: Option<String>`. What is the type of `s`?',
    a: '`&String`: matching through `&` switches the binding mode to ref, so `s` borrows the string instead of taking it.',
  },
  'mode-move': {
    q: 'After `match name { Some(s) => ..., None => ... }` on an `Option<String>`, why can you no longer print `name`?',
    a: 'In move mode `s` took the `String` out of `name`, so `name` is partially moved (E0382).',
  },
  'mode-ref': {
    q: 'What does the `ref` in `Some(ref s)` match against?',
    a: 'Nothing. It only says “bind `s` as a shared borrow instead of moving”.',
  },
  'guard-or': {
    q: 'In the arm `4 | 5 | 6 if ok => ...`, which alternatives does the guard apply to?',
    a: 'All three: it reads `(4 | 5 | 6) if ok`.',
  },
  'guard-exhaust': {
    q: 'Arms `Some(x) if x > 0` and `Some(x) if x <= 0` plus `None`: why does rustc still say `Some(_)` is not covered?',
    a: 'Guarded arms never count towards exhaustiveness; rustc checks shapes, not conditions.',
  },
  'at-binding': {
    q: 'What does the pattern `n @ 0..=9` do?',
    a: 'It matches only values from 0 to 9 and also binds the matched value to `n`.',
  },
  'slice-rest': {
    q: 'Matching `xs: &[i32]` against `[x, rest @ ..]`, what are `x` and `rest`?',
    a: '`x` is a `&i32` (the first element) and `rest` is a `&[i32]` view of the remaining elements; nothing is copied.',
  },
  'slice-len': {
    q: 'What does rustc test first when it runs a slice match?',
    a: 'The slice’s length; element comparisons come after the length has picked a branch.',
  },
};

export const examples = {
  modes: {
    lang: 'rust',
    title: 'Three binding modes, one pattern',
    code: `use std::any::type_name;

// The type of whatever you pass in.
fn ty<T>(_: &T) -> &'static str {
    type_name::<T>()
}

fn main() {
    let s = String::from("hi");
    let mut v = Some(s);

    // through &: s borrows
    if let Some(s) = &v {
        println!("ref:  {}", ty(&s));
    }
    // through &mut: s borrows mutably
    if let Some(s) = &mut v {
        s.push('!');
        println!("mut:  {}", ty(&s));
    }
    // by value: s takes the String
    if let Some(s) = v {
        println!("move: {}", ty(&s));
        println!("{s}");
    }
}`,
  },
};

const SIG = 'fn shape(xs: &[i32]) -> String {';

export const exercises = {
  shape: {
    lang: 'rust',
    title: 'Describe a slice in one match',
    prompt:
      'Write `shape(xs)` with a single `match xs`. An empty slice gives `"empty"`; one element `x` gives `"one x"` (so `[7]` gives `"one 7"`); two or more elements whose first and last are equal give `"ring f"` where `f` is the first (so `[3, 1, 3]` gives `"ring 3"`); any other slice gives `"f then k"`, its first element and how many follow (so `[1, 2, 3]` gives `"1 then 2"`). Use a slice pattern, a guard and a rest pattern bound with `@`.',
    starter: `${SIG}
    String::new()
}`,
    solution: `${SIG}
    match xs {
        [] => "empty".to_string(),
        [x] => format!("one {x}"),
        [f, .., l] if f == l => {
            format!("ring {f}")
        }
        [f, rest @ ..] => {
            let k = rest.len();
            format!("{f} then {k}")
        }
    }
}`,
    tests: `#[test]
fn empty_and_single() {
    assert_eq!(shape(&[]), "empty");
    assert_eq!(shape(&[7]), "one 7");
}
#[test]
fn equal_ends_make_a_ring() {
    assert_eq!(shape(&[3, 1, 3]), "ring 3");
    assert_eq!(shape(&[5, 5]), "ring 5");
}
#[test]
fn otherwise_first_then_count() {
    assert_eq!(shape(&[1, 2, 3]), "1 then 2");
    assert_eq!(shape(&[4, 9]), "4 then 1");
}`,
    hints: [
      'There are four cases, and they are about the slice’s length and two of its elements. Each case can be one arm of a slice pattern: `[]`, `[x]`, and two arms for “two or more”.',
      'A slice of two or more with its first and last named is `[f, .., l]`; “whose ends are equal” is not a shape, so it is a guard, `if f == l`. Put that arm before the general one.',
      'The last arm is `[f, rest @ ..]`: `rest` is the slice after the first element, so `rest.len()` is how many follow. Build each answer with `format!` (and `"empty".to_string()` for the first).',
    ],
    walkthrough: `**How to think about it.** Sort the inputs by length first, because that is what a slice pattern sees most directly: length 0, length 1, and length 2 or more. The last group splits in two, and the split ("are the ends equal?") is a question about values, not about shape, so it belongs in a guard. Since arms are tried top to bottom, the more specific arm (with the guard) must come before the general one.

**The solution, line by line.**

- \`match xs {\` matches the borrowed slice. Because \`xs\` is a reference (\`&[i32]\`), the default binding mode becomes ref as soon as a slice pattern meets it, so every name below is a \`&i32\` or a \`&[i32]\`, borrowing from the caller's data.
- \`[] => "empty".to_string(),\` fits only the empty slice. \`to_string\` turns the \`&str\` literal into the \`String\` the function returns.
- \`[x] => format!("one {x}"),\` fits slices of exactly one element and names it. \`format!\` prints through the reference, so \`{x}\` shows \`7\`.
- \`[f, .., l] if f == l => { format!("ring {f}") }\` fits slices of length two or more, naming the first as \`f\` and the last as \`l\`; the \`..\` in the middle swallows zero or more elements. The guard compares the two \`&i32\`s (comparing references compares the numbers they point to). If the guard is false, matching simply moves on to the next arm.
- \`[f, rest @ ..] => { let k = rest.len(); format!("{f} then {k}") }\` fits every slice of length one or more, but lengths 0 and 1 were already taken, so in practice it sees the "two or more, ends differ" case. \`rest @ ..\` binds the remaining elements as a slice, and \`rest.len()\` counts them, kept in \`k\` so it can be printed with \`{k}\`.

rustc accepts this match as exhaustive because the unguarded arms \`[]\`, \`[x]\` and \`[f, rest @ ..]\` cover every length on their own; the guarded arm is ignored for that check, exactly as the chapter says.

**Common wrong attempts.**

- Putting \`[f, rest @ ..]\` above the guarded arm. It fits \`[3, 1, 3]\` first, so you get \`"3 then 2"\` and the ring arm is never reached. rustc does notice this one: it compiles with \`warning: unreachable pattern\`, because the arm above already fits every slice of length one or more.
- Leaving out \`[]\`. Then \`[x]\`, \`[f, .., l]\` and \`[f, rest @ ..]\` all need at least one element, and rustc stops with error E0004, naming \`&[]\` as the pattern not covered.
- Writing \`[f, .., f]\` to mean "the ends are equal". A name may only be bound once in a pattern, so rustc rejects it with error E0416, “identifier \`f\` is bound more than once in the same pattern”; a pattern cannot compare two parts with each other, which is precisely the job of a guard.`,
    wrong: [
      {
        code: `${SIG}
    match xs {
        [] => "empty".to_string(),
        [x] => format!("one {x}"),
        [f, rest @ ..] => {
            let k = rest.len();
            format!("{f} then {k}")
        }
        [f, .., l] if f == l => {
            format!("ring {f}")
        }
    }
}`,
        why: 'The general arm comes first and catches `[3, 1, 3]`, so the ring arm is unreachable and the ring tests fail.',
      },
      {
        code: `${SIG}
    match xs {
        [x] => format!("one {x}"),
        [f, .., l] if f == l => {
            format!("ring {f}")
        }
        [f, rest @ ..] => {
            let k = rest.len();
            format!("{f} then {k}")
        }
    }
}`,
        why: 'No arm fits the empty slice, so the match is not exhaustive and rustc refuses it with E0004 (`&[]` not covered).',
      },
    ],
  },
};

export const quiz = [
  {
    q: '`let v: Vec<String> = ...;` and then `for s in &v { ... }`. What is the type of `s`, and why?',
    options: [
      { t: '`String`, moved out of the vector', why: 'Looping over `&v` yields references; nothing is moved out of `v`.' },
      { t: '`&String`, because the loop goes through a shared borrow of `v`', correct: true, why: 'Iterating `&v` gives `&String` items, and the plain name `s` binds that reference as it is.' },
      { t: '`&mut String`', why: 'You would need `&mut v` for mutable references.' },
    ],
  },
  {
    q: 'Which pattern binds the matched number *and* checks that it lies between 1 and 5?',
    options: [
      { t: '`n if 1..=5`', why: 'A guard needs a boolean condition; `1..=5` there is a range value, not a test.' },
      { t: '`1..=5(n)`', why: 'That is not valid pattern syntax.' },
      { t: '`n @ 1..=5`', correct: true, why: '`@` binds the whole matched value to `n` while the sub-pattern `1..=5` tests it.' },
    ],
  },
  {
    q: 'A match has arms `Some(x) if x > 0`, `Some(x) if x <= 0` and `None`. What does rustc 1.97 say?',
    options: [
      { t: 'It compiles: the two guards cover every integer.', why: 'rustc does not reason about guard conditions.' },
      { t: 'E0004: `Some(_)` not covered, because guarded arms do not count towards exhaustivity.', correct: true, why: 'That is the exact note rustc prints.' },
      { t: 'A warning that the second guard is always true.', why: 'rustc does not analyse the guards, so it cannot know that.' },
    ],
  },
  {
    q: 'In `4 | 5 | 6 if ok => ...`, with `x = 4` and `ok = false`, what happens?',
    options: [
      { t: 'The arm runs, because 4 needs no guard.', why: 'The guard belongs to the whole or-pattern, `(4 | 5 | 6) if ok`.' },
      { t: 'rustc rejects the arm as ambiguous.', why: 'It is valid; the precedence is fixed.' },
      { t: 'The arm is skipped and matching continues with the next arm.', correct: true, why: 'The pattern fits but the guard is false, so the next pattern is tried.' },
    ],
  },
  {
    q: 'What does `rest` hold after `[first, rest @ ..]` matches the slice `&[1, 2, 3]`?',
    options: [
      { t: 'A borrowed slice `&[2, 3]` pointing into the same memory', correct: true, why: 'The rest pattern binds a view of the remaining elements; nothing is copied.' },
      { t: 'A new `Vec` containing 2 and 3', why: 'That is what TypeScript’s `...rest` does (a fresh array); Rust borrows.' },
      { t: 'The number 2', why: '`..` matches any number of elements, so `rest` is a slice, not one element.' },
    ],
  },
];
