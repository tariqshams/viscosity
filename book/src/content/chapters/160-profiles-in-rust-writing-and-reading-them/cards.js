// Chapter 160 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from the old chapters PGO in Rust, and Reading a profile in Rust.

export const prompts = {
  'pg-reverse': {
    q: 'When several byte-range replacements are applied to one string in place, why apply them in order of start offset, last first?',
    a: 'Replacing a span changes the length of the text after it. Going last-first, every span still to do is before the change, so its offsets are still right.',
  },
  'pg-node-writes': {
    q: 'Why is the profile JSON written by Viscosity’s Rust CLI byte-identical to the TypeScript CLI’s?',
    a: 'Neither engine formats it: Node writes it, with `JSON.stringify(p, null, 2)` in a prelude that is the same in both.',
  },
  'pg-drop': {
    q: 'In Rust, how can a function make sure its temporary directory is removed on every way out, early returns through `?` included?',
    a: 'Own the directory through a guard value whose `Drop` impl calls `fs::remove_dir_all`; `drop` runs whenever the guard goes out of scope.',
  },
  'pg-exit-error': {
    q: 'Why does `viscosity profile` treat a non-zero exit of the profiled program as an error, even though its exit hook wrote the JSON?',
    a: 'A partial run’s sizes could mislead the planner, so both CLIs refuse to use them.',
  },
  'pg-collect': {
    q: 'What does collecting an iterator of `Result<(String, f64), String>` into `Result<HashMap<String, f64>, String>` do?',
    a: 'It builds the map while every item is `Ok`, and stops at the first `Err`, returning that error.',
  },
  'pg-by-name': {
    q: 'Two functions each build an array called `ps`, of 1000 and 10 elements. What does a Viscosity profile record for them?',
    a: 'One entry, `"ps": { "maxLength": 1000 }`, used for both collections. Profiles are keyed by name.',
  },
  'pg-after-safety': {
    q: 'Can a Viscosity profile make the planner transform a collection that has a bailout?',
    a: 'No. The profile is only read by the size rung, which comes after the safety rung; it can only move a collection across the size threshold.',
  },
};

export const examples = {};

export const exercises = {
  instrument: {
    lang: 'rust',
    title: 'Wrap the initialisers',
    prompt: 'Write the edit loop of `instrument`. `spans` lists `(start, end, name)` for each collection’s initialiser, as byte offsets into `src`, in no particular order (they never overlap). Return `src` with each span replaced by `__vsc_track("name", <the span’s text>)`. Quote the name with `{:?}`.',
    starter: `// Wraps each span src[start..end] (byte
// offsets) in __vsc_track("name", ...).
fn instrument(
    src: &str,
    spans: &[(usize, usize, &str)],
) -> String {
    todo!()
}`,
    solution: `// Wraps each span src[start..end] (byte
// offsets) in __vsc_track("name", ...).
fn instrument(
    src: &str,
    spans: &[(usize, usize, &str)],
) -> String {
    let mut edits = spans.to_vec();
    edits.sort_by_key(|e| {
        std::cmp::Reverse(e.0)
    });
    let mut out = src.to_string();
    for (start, end, name) in edits {
        let w = format!(
            "__vsc_track({:?}, {})",
            name,
            &out[start..end]
        );
        out.replace_range(
            start..end,
            &w,
        );
    }
    out
}`,
    tests: `#[test]
fn wraps_one_initializer() {
    let src = "const ps = [];";
    assert_eq!(
        instrument(src, &[(11, 13, "ps")]),
        "const ps = __vsc_track(\\"ps\\", []);"
    );
}

#[test]
fn two_spans_given_in_source_order() {
    let src = "let a = [];\\nlet b = [];";
    assert_eq!(
        instrument(src, &[(8, 10, "a"), (20, 22, "b")]),
        "let a = __vsc_track(\\"a\\", []);\\n\\
         let b = __vsc_track(\\"b\\", []);"
    );
}

#[test]
fn spans_in_any_order() {
    let src = "x=[1];y=[2];z=[];";
    let spans = [(8, 11, "y"), (14, 16, "z"), (2, 5, "x")];
    assert_eq!(
        instrument(src, &spans),
        "x=__vsc_track(\\"x\\", [1]);\\
         y=__vsc_track(\\"y\\", [2]);\\
         z=__vsc_track(\\"z\\", []);"
    );
}

#[test]
fn offsets_are_bytes() {
    let src = "// é🎉\\nconst qs = [];";
    let at = src.find('[').unwrap();
    assert_eq!(at, 21);
    assert_eq!(
        instrument(src, &[(at, at + 2, "qs")]),
        "// é🎉\\nconst qs = __vsc_track(\\"qs\\", []);"
    );
}

#[test]
fn no_spans_no_change() {
    let src = "console.log(1);";
    assert_eq!(instrument(src, &[]), src);
}`,
    hints: [
      'Copy the slice into a `Vec` (`spans.to_vec()`) so you can sort it, and `src` into a `String` (`src.to_string()`) so you can edit it.',
      'Sort with `sort_by_key(|e| std::cmp::Reverse(e.0))`: the edit furthest into the text goes first, so it can’t move any span that is still to do.',
      'In the loop, build the wrapper from `&out[start..end]` with `format!("__vsc_track({:?}, {})", name, ...)`, then `out.replace_range(start..end, &w)`.',
    ],
    walkthrough: `**How to think about it.** This is the edit loop of \`instrument\` in \`engine/rust/crates/cli/src/profile.rs\`. Try two spans by hand on \`const a = []; const b = [];\`: \`a\`'s \`[]\` is at bytes 10..12 and \`b\`'s at 24..26. Wrap \`a\` first and it becomes \`__vsc_track("a", [])\`, 18 bytes longer, so \`b\`'s \`[]\` is now at 42..44, and cutting at 24..26 would cut the wrong text. Wrap \`b\` first and \`a\`'s offsets haven't moved at all. So the whole exercise is "apply the edits from the end of the text backwards".

**The solution, line by line.**

- \`let mut edits = spans.to_vec();\` copies the slice into a vector we own, because a \`&[...]\` can't be sorted in place.
- \`edits.sort_by_key(|e| std::cmp::Reverse(e.0));\` sorts by start, largest first: \`Reverse\` wraps the key so that the usual ascending sort comes out descending.
- \`let mut out = src.to_string();\` makes an editable \`String\` from the \`&str\`.
- \`for (start, end, name) in edits {\` takes each edit, the last one in the text first, destructuring the tuple.
- \`let w = format!("__vsc_track({:?}, {})", name, &out[start..end]);\` builds the wrapper: \`{:?}\` prints the name with quotes (\`"ps"\`), and \`&out[start..end]\` is the span's text, sliced from \`out\` (nothing before or at this span has changed yet).
- \`out.replace_range(start..end, &w);\` swaps the span for the wrapper, in place. The offsets are bytes, which is what \`String\` is indexed by; they come from oxc, so they are always at character boundaries.
- \`out\` is returned.

The real code quotes with \`serde_json::to_string(name)\` instead of \`{:?}\`: for ordinary names they give the same text, but for some characters their escapes differ, and serde_json's are always valid JavaScript.

**Common wrong attempts.**

- Editing front to back, in the order given: the first replacement makes the text longer, so every later \`(start, end)\` points at the wrong bytes.
- Using \`insert_str(start, &w)\` instead of \`replace_range\`: the wrapper is added but the original span stays after it, so \`x=[]\` becomes \`x=__vsc_track("x", [])[]\`.`,
    wrong: [
      {
        code: `// Wraps each span src[start..end] (byte
// offsets) in __vsc_track("name", ...).
fn instrument(
    src: &str,
    spans: &[(usize, usize, &str)],
) -> String {
    let mut out = src.to_string();
    for &(start, end, name) in spans {
        let w = format!(
            "__vsc_track({:?}, {})",
            name,
            &out[start..end]
        );
        out.replace_range(
            start..end,
            &w,
        );
    }
    out
}`,
        why: 'It edits front to back. The first replacement makes the text longer, so every later `(start, end)` points at the wrong bytes.',
      },
      {
        code: `// Wraps each span src[start..end] (byte
// offsets) in __vsc_track("name", ...).
fn instrument(
    src: &str,
    spans: &[(usize, usize, &str)],
) -> String {
    let mut edits = spans.to_vec();
    edits.sort_by_key(|e| {
        std::cmp::Reverse(e.0)
    });
    let mut out = src.to_string();
    for (start, end, name) in edits {
        let w = format!(
            "__vsc_track({:?}, {})",
            name,
            &src[start..end]
        );
        out.insert_str(start, &w);
    }
    out
}`,
        why: '`insert_str` adds the wrapper but doesn’t remove the original span: `x=[]` becomes `x=__vsc_track("x", [])[]`.',
      },
    ],
  },
  readProfile: {
    optional: true,
    lang: 'rust',
    title: 'One bad entry refuses the file',
    prompt: 'Write `read(es)`, the checking half of `read_profile`, over a cut-down JSON entry. Each entry `(name, e)` is accepted when `max_len(e)` is a finite number of at least 0; then it goes into the `Profile` map as `name -> n`. If any entry isn’t, return `Err(format!("bad entry {name:?}"))` for the **first** bad entry. Hint: an iterator of `Result`s can be collected into one `Result`.',
    starter: `use std::collections::HashMap;

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

fn read(
    es: &[(&str, E)],
) -> Result<Profile, String> {
    todo!()
}`,
    solution: `use std::collections::HashMap;

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

fn entry(
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
}

fn read(
    es: &[(&str, E)],
) -> Result<Profile, String> {
    es.iter()
        .map(|(name, e)| entry(name, e))
        .collect()
}`,
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
        code: `use std::collections::HashMap;

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

fn read(
    es: &[(&str, E)],
) -> Result<Profile, String> {
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
        code: `use std::collections::HashMap;

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

fn entry(
    name: &str,
    e: &E,
) -> Result<(String, f64), String> {
    let n = max_len(e).filter(|n| {
        *n >= 0.0
    });
    match n {
        Some(n) => Ok((name.into(), n)),
        None => Err(format!(
            "bad entry {name:?}"
        )),
    }
}

fn read(
    es: &[(&str, E)],
) -> Result<Profile, String> {
    es.iter()
        .map(|(name, e)| entry(name, e))
        .collect()
}`,
        why: '`f64::INFINITY >= 0.0` is true, so an infinite `maxLength` is accepted; the rule needs `is_finite()` too.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Where is the JSON of a Viscosity profile formatted, in both engines?',
    options: [
      {
        t: 'In Rust, with `serde_json::to_string_pretty`',
        why: 'Rust never formats the profile; it prints the file node wrote.',
      },
      {
        t: 'In the instrumented program, by Node’s `JSON.stringify(p, null, 2)` in the exit hook',
        correct: true,
        why: 'The prelude is the TS CLI’s, so both CLIs produce the same bytes.',
      },
      {
        t: 'In the TypeScript engine, called from Rust',
        why: 'The Rust CLI doesn’t load the TypeScript engine.',
      },
    ],
  },
  {
    q: 'You run `viscosity profile app.js` on a machine without Node. What happens?',
    options: [
      {
        t: 'It fails with “could not run node (profiling needs Node.js on the PATH)”',
        correct: true,
        why: '`Command::status()` returns an error, mapped to that message.',
      },
      {
        t: 'It falls back to the static estimate',
        why: 'Profiling has nothing to fall back to: it fails with a message.',
      },
      {
        t: 'It runs the program in the wasm build',
        why: 'The wasm build compiles; it doesn’t run JavaScript.',
      },
    ],
  },
  {
    q: 'Why does the Rust CLI’s `profile` own its temporary directory through a `TempDir` value with a `Drop` impl?',
    options: [
      {
        t: 'Because Rust has no function to delete a directory',
        why: '`fs::remove_dir_all` is exactly that function; `Drop` decides when it runs.',
      },
      {
        t: 'So the directory is removed on every way out, including each early `?` and `return Err(...)`',
        correct: true,
        why: '`drop` runs when the guard goes out of scope, however the function ends.',
      },
      {
        t: 'So node can delete it after the run',
        why: 'Node never touches it; the Rust process removes it.',
      },
    ],
  },
  {
    q: 'A Viscosity profile file has `"ps"` with `maxLength` 20 and `"qs": 5`. What does `explain --profile` do?',
    options: [
      {
        t: 'The whole file is refused, naming `"qs"`',
        correct: true,
        why: 'Collecting the `Result`s stops at the first `Err`.',
      },
      {
        t: '`ps` is used and `qs` skipped',
        why: 'Skipping was the port’s old behaviour; now one bad entry refuses the file.',
      },
      {
        t: 'Both are used, `qs` as 5',
        why: 'An entry must be an object with a `maxLength`, not a bare number.',
      },
    ],
  },
  {
    q: 'Which statement about a Viscosity profile is true?',
    options: [
      {
        t: 'It holds per-field read counts',
        why: 'It holds only `maxLength` per name.',
      },
      {
        t: 'It distinguishes two arrays called `ps` in different functions',
        why: 'It is keyed by name, so they share an entry, the larger length.',
      },
      {
        t: 'It can make a collection unsafe to transform, or safe',
        why: 'It is read after every safety check: it can only change the size threshold.',
      },
      {
        t: 'Each length is read once, when the program exits',
        correct: true,
        why: 'The exit hook reads `a.length` of every tracked array and keeps the maximum per name.',
      },
    ],
  },
];
