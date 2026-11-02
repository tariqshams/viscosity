// Chapter 438b cards. Keys are stable ids: never rename them.

// Shared by the exercise: a cut-down JSON entry.
const SCAF = `use std::collections::HashMap;

type Profile = HashMap<String, f64>;

// What a "maxLength" can hold.
enum V {
    Num(f64),
    Str(String),
}

// One entry of the profile: an object
// (with its maxLength, if it has one),
// or anything else.
enum E {
    Obj(Option<V>),
    Other,
}

fn max_len(e: &E) -> Option<f64> {
    match e {
        E::Obj(Some(V::Num(n))) => {
            Some(*n)
        }
        _ => None,
    }
}
`;

const HEAD = `fn read(
    es: &[(&str, E)],
) -> Result<Profile, String> {`;

const ENTRY = `fn entry(
    name: &str,
    e: &E,
) -> Result<(String, f64), String> {
    let n = max_len(e).filter(|n| {
        n.is_finite() && *n >= 0.0
    });
    match n {
        Some(n) => Ok((name.into(), n)),
        None => Err(format!(
            "bad entry {name:?}"
        )),
    }
}`;

const SOL = `${SCAF}
${ENTRY}

${HEAD}
    es.iter()
        .map(|(name, e)| entry(name, e))
        .collect()
}`;

export const prompts = {
  'pg-filter-map': {
    q: 'What does `read_profile` accept from the JSON?',
    a: 'An object whose every entry is an object with a finite, non-negative `maxLength`, as `name -> f64`. Anything else is an error.',
  },
  'pg-strict': {
    q: 'A hand-edited profile says `"maxLength": "20"`. What do the two CLIs do?',
    a: 'Both stop with the same error: the entry must be an object whose maxLength is a non-negative number. (Once, Rust skipped it and TypeScript used it.)',
  },
  'pg-collect': {
    q: 'What does collecting an iterator of `Result<(String, f64), String>` into `Result<HashMap<String, f64>, String>` do?',
    a: 'It builds the map while every item is `Ok`, and stops at the first `Err`, returning that error.',
  },
  'pg-guard': {
    q: 'Which `maxLength` values does the match guard `if n.is_finite() && n >= 0.0` refuse?',
    a: 'Negative numbers, `NaN` and infinity. (A string or a missing value never reaches the guard: `as_f64` already gave `None`.)',
  },
  'pg-by-name': {
    q: 'Two functions each build an array called `ps`, of 1000 and 10 elements. What does the profile say?',
    a: 'One entry, `"ps": { "maxLength": 1000 }`, used for both collections. Profiles are keyed by name.',
  },
  'pg-cant': {
    q: 'Name two kinds of program `viscosity profile` can’t profile.',
    a: 'Any of: an ES module with `import` (run as CommonJS), a program that throws or exits non-zero, a Python file.',
  },
  'pg-after-safety': {
    q: 'Can a profile make the planner transform a collection that has a bailout?',
    a: 'No. The profile is only read by the size rung, which comes after the safety rung; it can only move a collection across the size threshold.',
  },
  'pg-tests': {
    q: 'Which tests check profiles, now that a profile-only wording bug once slipped through?',
    a: 'Four profile fixtures run through the library and `--profile` in `parity.rs`, `profile_cli.rs` checks both CLIs’ file rule and clean-up, and the fuzzer passes a random profile to every batch.',
  },
};

export const exercises = {
  readProfile: {
    lang: 'rust',
    title: 'One bad entry refuses the file',
    prompt:
      'Write `read(es)`, the checking half of `read_profile`, over a cut-down JSON entry. Each entry `(name, e)` is accepted when `max_len(e)` is a finite number of at least 0; then it goes into the `Profile` map as `name -> n`. If any entry isn’t, return `Err(format!("bad entry {name:?}"))` for the **first** bad entry. Hint: an iterator of `Result`s can be collected into one `Result`.',
    starter: `${SCAF}
${HEAD}
    todo!()
}`,
    solution: SOL,
    tests: `fn num(n: f64) -> E {
    E::Obj(Some(V::Num(n)))
}

#[test]
fn a_valid_profile() {
    let es = [("ps", num(20.0)),
        ("qs", num(0.0))];
    let p = read(&es).unwrap();
    assert_eq!(p.len(), 2);
    assert_eq!(p["ps"], 20.0);
    assert_eq!(p["qs"], 0.0);
}

#[test]
fn an_empty_profile_is_fine() {
    assert!(read(&[]).unwrap().is_empty());
}

#[test]
fn a_string_is_not_a_number() {
    let s = V::Str("20".into());
    let es = [("ps", E::Obj(Some(s)))];
    assert_eq!(read(&es),
        Err("bad entry \\"ps\\"".to_string()));
}

#[test]
fn missing_or_not_an_object() {
    let es = [("ps", E::Obj(None))];
    assert!(read(&es).is_err());
    let es = [("ps", E::Other)];
    assert!(read(&es).is_err());
}

#[test]
fn negative_nan_and_infinity() {
    for n in [-1.0, f64::NAN,
        f64::INFINITY] {
        let es = [("ps", num(n))];
        assert!(read(&es).is_err(), "{n}");
    }
}

#[test]
fn the_first_bad_entry_is_named() {
    let es = [("a", num(1.0)),
        ("b", E::Other),
        ("c", E::Other)];
    assert_eq!(read(&es),
        Err("bad entry \\"b\\"".to_string()));
}
`,
    hints: [
      'Write a helper that checks one entry: `fn entry(name: &str, e: &E) -> Result<(String, f64), String>`. It uses `max_len(e)` and then keeps only finite, non-negative values.',
      '`max_len(e).filter(|n| n.is_finite() && *n >= 0.0)` gives `Some(n)` for a good value and `None` otherwise; `match` it into `Ok((name.into(), n))` or `Err(format!("bad entry {name:?}"))`.',
      '`read` is then three lines: `es.iter().map(|(name, e)| entry(name, e)).collect()`. The return type tells `collect` to build a `Result<Profile, String>`, which stops at the first `Err`.',
    ],
    walkthrough: `**How to think about it.** This is the checking half of \`read_profile\` in \`engine/rust/crates/cli/src/main.rs\`, with \`serde_json\`'s \`Value\` cut down to the two enums of the scaffold (the checker compiles with plain \`rustc\`, so no crates). There are two jobs: decide whether one entry is good, and combine the answers so that the first bad one wins. Doing them in two functions keeps each simple, and the second job is something the standard library already does for you: collecting an iterator of \`Result\`s into one \`Result\`.

**The solution, line by line.**

- \`fn entry(name: &str, e: &E) -> Result<(String, f64), String> {\` checks one entry and returns either the pair to insert or the error.
- \`let n = max_len(e).filter(|n| n.is_finite() && *n >= 0.0);\`: \`max_len\` (given) is \`Some\` only for an object whose \`maxLength\` is a number; \`Option::filter\` keeps it only if the test holds, so \`n\` is \`None\` for a string, a missing value, a non-object, a negative number, \`NaN\` or infinity. (\`n\` is a \`&f64\` inside the closure; \`is_finite\` works through the reference, and \`*n\` compares the value.)
- \`match n { Some(n) => Ok((name.into(), n)),\` turns a good value into the pair; \`.into()\` makes a \`String\` from the \`&str\`.
- \`None => Err(format!("bad entry {name:?}")),\`: \`{name:?}\` prints the name with quotes, as the real message does with \`serde_json::to_string(name)\`.
- \`fn read(es: &[(&str, E)]) -> Result<Profile, String> {\` checks them all.
- \`es.iter().map(|(name, e)| entry(name, e))\` turns each entry into a \`Result\`; the closure's pattern \`|(name, e)|\` takes the tuple apart (both are references here, which \`entry\` accepts).
- \`.collect()\` gathers the results into the return type, \`Result<Profile, String>\`: while every item is \`Ok\` it inserts the pairs into a \`HashMap\`, and at the first \`Err\` it stops and returns that error. That is why \`the_first_bad_entry_is_named\` gets \`"b"\`, not \`"c"\`.

**Common wrong attempts.**

- \`filter_map\`, keeping the good entries and dropping the bad ones: the file is "accepted" with \`ps\` missing, which is exactly what the Rust CLI once did with \`"20"\`, while the TypeScript CLI used the value, so the two engines planned differently from one file.
- Leaving out \`is_finite()\`: \`f64::INFINITY >= 0.0\` is true, so an infinite size would pass and every collection with that name would clear any threshold.`,
    wrong: [
      {
        code: `${SCAF}
${HEAD}
    let good = es.iter().filter_map(
        |(name, e)| {
            let n = max_len(e)?;
            Some((name.to_string(), n))
        },
    );
    Ok(good.collect())
}`,
        why: 'Bad entries are silently skipped, so a hand-edited `"20"` is ignored instead of refused: the old Rust behaviour that made the engines disagree.',
      },
      {
        code: SOL.replace(`        n.is_finite() && *n >= 0.0`, `        *n >= 0.0`),
        why: '`f64::INFINITY >= 0.0` is true, so an infinite `maxLength` is accepted; the rule needs `is_finite()` too.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A profile file is `[1]`. What does `viscosity explain --profile` do?',
    options: [
      { t: 'Ignores the file and uses the estimates', why: 'A broken profile is an error, not a hint to ignore.' },
      { t: 'Stops with “the profile must be a JSON object: …”', correct: true, why: '`as_object` is `None` for an array, and `ok_or(...)?` returns the error.' },
      { t: 'Treats it as one collection of size 1', why: 'Entries are looked up by name, and an array has no names.' },
    ],
  },
  {
    q: 'A profile has `"ps"` with `maxLength` 20 and `"qs": 5`. What happens?',
    options: [
      { t: 'The whole file is refused, naming `"qs"`', correct: true, why: 'Collecting the `Result`s stops at the first `Err`.' },
      { t: '`ps` is used and `qs` skipped', why: 'Skipping was the port’s old behaviour; now one bad entry refuses the file.' },
      { t: 'Both are used, `qs` as 5', why: 'An entry must be an object with a `maxLength`, not a bare number.' },
    ],
  },
  {
    q: 'Which statement about a profile is true?',
    options: [
      { t: 'It holds per-field read counts', why: 'It holds only `maxLength` per name.' },
      { t: 'It distinguishes two arrays called `ps` in different functions', why: 'It is keyed by name, so they share an entry, the larger length.' },
      { t: 'It can make a collection unsafe to transform, or safe', why: 'It is read after every safety check: it can only change the size threshold.' },
      { t: 'Each length is read once, when the program exits', correct: true, why: 'The exit hook reads `a.length` of every tracked array and keeps the maximum per name.' },
    ],
  },
  {
    q: 'Why can’t `viscosity profile` run a program that starts with `import fs from "node:fs";`?',
    options: [
      { t: 'The analysis refuses modules', why: 'The compiler handles imports; the problem is running the instrumented file.' },
      { t: 'Node is too old', why: 'It fails on any version: the file is CommonJS.' },
      { t: 'The instrumented file is `instrumented.cjs`, run as CommonJS, where `import` is a syntax error', correct: true, why: 'Node reports “Cannot use import statement outside a module”, and the CLI reports the failed run.' },
    ],
  },
  {
    q: 'The planner’s measured-size message was once worded differently in the two engines, and every test passed. What closed that gap?',
    options: [
      { t: 'Profile fixtures run through both engines, and a random profile for every fuzzer batch', correct: true, why: 'The fixtures had never used `--profile`; now four do, through the library and the CLI.' },
      { t: 'Nothing: the engines still differ there', why: 'They print the same bytes today; the parity test checks it.' },
      { t: 'Turning off profiles in the parity test', why: 'The opposite: the test now runs them.' },
    ],
  },
];
