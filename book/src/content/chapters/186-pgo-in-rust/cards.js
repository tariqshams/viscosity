// Chapter 186 cards. Keys are stable ids: never rename them.

export const prompts = {
  'pg-same-finder': {
    q: 'How does `instrument` in `profile.rs` decide which arrays to wrap?',
    a: 'The way the compiler does: `JsPlugin.lower`, then `analyze`, then each collection’s initializer span.',
  },
  'pg-reverse': {
    q: 'Why are the edits sorted with `Reverse(start)` before they are applied?',
    a: 'Replacing a span changes the length of the text after it. Going last-first, every span still to do is before the change, so its offsets are still right.',
  },
  'pg-node-writes': {
    q: 'Why is the Rust CLI’s profile JSON byte-identical to the TypeScript CLI’s?',
    a: 'Neither engine formats it: Node writes it, with `JSON.stringify(p, null, 2)` in a prelude that is the same in both.',
  },
  'pg-command': {
    q: 'What does `Command::new("node")…status()` do in `profile.rs`?',
    a: 'Starts `node` on the instrumented file as a child process, waits for it, and returns its exit status; stdin is empty and stdout discarded.',
  },
  'pg-path': {
    q: 'The TS CLI runs `process.execPath`. Which `node` does the Rust CLI run?',
    a: 'Whatever `node` is on the `PATH`. The Rust binary has no Node of its own; if none is found it says profiling needs Node.js.',
  },
  'pg-filter-map': {
    q: 'What does `read_profile` accept from the JSON?',
    a: 'An object whose every entry is an object with a finite, non-negative `maxLength`, as `name -> f64`. Anything else is an error.',
  },
  'pg-strict': {
    q: 'A hand-edited profile says `"maxLength": "20"`. What do the two CLIs do?',
    a: 'Both stop with the same error: the entry must be an object whose maxLength is a non-negative number. (Once, Rust skipped it and TypeScript used it.)',
  },
  'pg-by-name': {
    q: 'Two functions each build an array called `ps`, of 1000 and 10 elements. What does the profile say?',
    a: 'One entry, `"ps": { "maxLength": 1000 }`, used for both collections. Profiles are keyed by name.',
  },
  'pg-cant': {
    q: 'Name two kinds of program `viscosity profile` can’t profile.',
    a: 'Any of: an ES module with `import` (run as CommonJS), a program that throws or exits non-zero, a Python file.',
  },
};

export const exercises = {
  instrument: {
    lang: 'rust',
    title: 'Wrap the initializers',
    prompt:
      'Write the edit loop of `instrument`. `spans` lists `(start, end, name)` for each collection’s initializer, as byte offsets into `src`, in no particular order (they never overlap). Return `src` with each span replaced by `__vsc_track("name", <the span’s text>)`. Quote the name with `{:?}`.',
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
      'Copy the slice into a `Vec` (`spans.to_vec()`) so you can sort it, and `src` into a `String` (`to_string()`) so you can edit it.',
      'Sort with `sort_by_key(|e| std::cmp::Reverse(e.0))`: the edit furthest into the text goes first, so it can’t move any span that is still to do.',
      'In the loop, build the wrapper from `&out[start..end]`, then `out.replace_range(start..end, &w)`.',
    ],
    walkthrough: `This is the loop of \`instrument\` in \`engine/rust/crates/cli/src/profile.rs\`.

- **Why last first.** After \`a\` becomes \`__vsc_track("a", [])\`, everything behind it has moved 18 bytes. An edit at offset 20 would now cut the wrong text, which is what the first wrong attempt does. Edits from the end only change text after every span still to come.
- **Byte offsets.** oxc's spans are UTF-8 byte offsets, and a Rust \`String\` is sliced and edited by byte offsets, so \`replace_range\` cuts exactly at the span even after \`é🎉\` (six bytes). The TypeScript version slices its UTF-16 string by UTF-16 offsets, the same idea in its own units.
- **Quoting.** The real code quotes with \`serde_json::to_string(name)\`. For ASCII names, \`{:?}\` gives the same text; for some other characters their escapes differ, and serde_json's are valid JavaScript.
- \`insert_str\` instead of \`replace_range\` (the second wrong attempt) keeps the original span after the wrapper, so every array literal appears twice.`,
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
};

export const quiz = [
  {
    q: 'Where is the profile JSON formatted?',
    options: [
      { t: 'In Rust, with `serde_json::to_string_pretty`', why: 'Rust never formats the profile; it prints the file node wrote.' },
      { t: 'In the instrumented program, by Node’s `JSON.stringify(p, null, 2)` in the exit hook', correct: true, why: 'The prelude is the TS CLI’s, so both CLIs produce the same bytes.' },
      { t: 'In the TypeScript engine, called from Rust', why: 'The Rust CLI doesn’t load the TypeScript engine.' },
    ],
  },
  {
    q: 'Why does `instrument` apply its edits last-first?',
    options: [
      { t: 'Because `replace_range` only works backwards', why: 'It works anywhere in the string.' },
      { t: 'So the output lists collections in reverse', why: 'The output is the program text, in its own order.' },
      { t: 'Because the TS reference does, and parity requires it', why: 'The order is forced by the offsets, not only by parity.' },
      { t: 'Each replacement changes the length of the text after it; edits behind it keep valid offsets', correct: true, why: 'Going from the end, no edit moves a span still to be done.' },
    ],
  },
  {
    q: 'You run `viscosity profile app.js` on a machine without Node. What happens?',
    options: [
      { t: 'It fails with “could not run node (profiling needs Node.js on the PATH)”', correct: true, why: '`Command::status()` returns an error, mapped to that message.' },
      { t: 'It falls back to the static estimate', why: 'Profiling has nothing to fall back to: it fails with a message.' },
      { t: 'It runs the program in the wasm build', why: 'The wasm build compiles; it doesn’t run JavaScript.' },
    ],
  },
  {
    q: 'An instrumented program prints its results and then throws. What does `viscosity profile` produce?',
    options: [
      { t: 'The JSON, since the exit hook ran', why: 'The hook did write the file, but the CLI checks the exit status first.' },
      { t: 'An error: “the profiled program failed (exit code 1)”', correct: true, why: 'A non-zero status is a failure, in both CLIs, and the temporary directory is removed anyway.' },
      { t: 'An empty profile `{}`', why: 'Nothing is printed on failure.' },
    ],
  },
  {
    q: 'Which statement about a profile is true?',
    options: [
      { t: 'It holds per-field read counts', why: 'It holds only `maxLength` per name.' },
      { t: 'It distinguishes two arrays called `ps` in different functions', why: 'It is keyed by name, so they share an entry, the larger length.' },
      { t: 'Each length is read once, when the program exits', correct: true, why: 'The exit hook reads `a.length` of every tracked array and keeps the maximum per name.' },
      { t: 'It can make a collection unsafe to transform', why: 'It is read after every safety check: it can only change the size threshold.' },
    ],
  },
  {
    q: 'The planner’s message with a profile is worded differently in the two engines, yet every test passes. Why?',
    options: [
      { t: 'The tests ignore explain text', why: 'Parity compares explain text byte for byte.' },
      { t: 'No fixture was compiled with `--profile`, and the fuzzer didn’t pass one either', correct: true, why: 'Parity holds for the inputs and options that are tested, and only those.' },
      { t: 'The wording is chosen at random', why: 'It is a fixed `format!` string with its parts in a different order.' },
    ],
  },
];
