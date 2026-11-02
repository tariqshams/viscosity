// Chapter 438 cards. Keys are stable ids: never rename them.

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
  'pg-drop': {
    q: 'How does `profile` make sure its temporary directory is removed, even when it returns early with `?`?',
    a: 'The directory is owned by a `TempDir` guard whose `Drop` calls `remove_dir_all`; `drop` runs on every way out of the function.',
  },
  'pg-exit-error': {
    q: 'Why is a non-zero exit from the profiled program an error, even though the exit hook wrote the JSON?',
    a: 'A partial run’s sizes could mislead the planner, so both CLIs refuse to use them.',
  },
  'pg-literal': {
    q: 'What does `instrument` make of `const ps = [{ x: 1 }, { x: 2 }];`?',
    a: '`const ps = __vsc_track("ps", [{ x: 1 }, { x: 2 }]);`: the whole literal is wrapped, so its elements count towards the length.',
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
      'Copy the slice into a `Vec` (`spans.to_vec()`) so you can sort it, and `src` into a `String` (`src.to_string()`) so you can edit it.',
      'Sort with `sort_by_key(|e| std::cmp::Reverse(e.0))`: the edit furthest into the text goes first, so it can’t move any span that is still to do.',
      'In the loop, build the wrapper from `&out[start..end]` with `format!("__vsc_track({:?}, {})", name, ...)`, then `out.replace_range(start..end, &w)`.',
    ],
    walkthrough: `**How to think about it.** This is the edit loop of \`instrument\` in \`engine/rust/crates/cli/src/profile.rs\`. Try two spans by hand on \`const a = []; const b = [];\`: \`a\`'s \`[]\` is at bytes 10..12 and \`b\`'s at 23..25. Wrap \`a\` first and it becomes \`__vsc_track("a", [])\`, 18 bytes longer, so \`b\`'s \`[]\` is now at 41..43, and cutting at 23..25 would cut the wrong text. Wrap \`b\` first and \`a\`'s offsets haven't moved at all. So the whole exercise is "apply the edits from the end of the text backwards".

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
    q: 'Why does `profile` own its temporary directory through a `TempDir` value with a `Drop` impl?',
    options: [
      { t: 'Because Rust has no function to delete a directory', why: '`fs::remove_dir_all` is exactly that function; `Drop` decides when it runs.' },
      { t: 'So the directory is removed on every way out, including each early `?` and `return Err(...)`', correct: true, why: '`drop` runs when the guard goes out of scope, however the function ends.' },
      { t: 'So node can delete it after the run', why: 'Node never touches it; the Rust process removes it.' },
    ],
  },
];
