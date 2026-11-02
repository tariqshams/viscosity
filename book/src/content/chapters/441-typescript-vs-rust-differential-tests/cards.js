// Chapter 441 cards. Keys are stable ids: never rename them.

export const prompts = {
  'ep-oracle': {
    q: 'What is a test’s **oracle**?',
    a: 'Whatever it trusts to give the right answer: here the TS engine’s output, or the original program’s behaviour.',
  },
  'ep-parity-blind': {
    q: 'What kind of bug can byte-for-byte parity never catch?',
    a: 'One both engines share. Parity compares Rust with TS, so if both are wrong the same way, it passes.',
  },
  'ep-diff-blind': {
    q: 'The node differential passes. What can still be wrong?',
    a: 'Anything that doesn’t change behaviour (explain text, frames), anything outside its 68 programs, and anything only `--bounds assume` reaches.',
  },
  'ep-wasm': {
    q: 'What can the wasm layer catch that native parity can’t, and what can’t it check?',
    a: 'Differences that depend on the target (the same code built for wasm32). Its API takes no profile and returns no frames.',
  },
  'ep-shared': {
    q: 'Why were all five of the fuzzer’s finds bugs in both engines?',
    a: 'The port mirrors the reference, so their bugs are shared. Parity can’t see shared bugs; the behaviour and no-crash oracles could.',
  },
  'ep-option': {
    q: 'Why did the “about 20 (measured) elements” wording pass every test?',
    a: 'No layer compiled with `--profile`: no fixture variant, no fuzzer option, no wasm parameter.',
  },
  'ep-input': {
    q: 'Why did no test notice that the two CLIs read `"maxLength": "20"` differently?',
    a: 'Every profile a test could use came from `viscosity profile`, which writes numbers. No layer’s inputs could produce that file.',
  },
  'ep-equal': {
    q: 'When both engines fail on a program, why does the fuzzer not compare their messages?',
    a: 'oxc and acorn word errors differently, so it compares errors by presence only: “one failed and the other didn’t” is the failure.',
  },
};

export const exercises = {
  verdict: {
    lang: 'rust',
    title: 'Two oracles, one verdict',
    prompt:
      'Write the fuzzer’s verdict for one program, as `fuzz.mjs`’s `failuresOf` decides it. `ts` and `rs` are what each engine made of `src`; `run` runs a program and returns what it printed. Return the failures in this order. Against the original: `"ts-crash"` if the TS engine failed, otherwise `"behaviour"` if the TS output prints something different from `src`. Against the TS engine: if both succeeded, `"parity-code"` and then `"parity-explain"` for each field that differs; if exactly one failed, `"parity-error"`. Two failures with different messages are not a parity failure.',
    starter: `// What an engine made of a program:
// its code and explain text, or an
// error message.
struct Out {
    code: String,
    explain: String,
}
type Res = Result<Out, String>;

fn verdict(
    src: &str,
    ts: &Res,
    rs: &Res,
    run: impl Fn(&str) -> String,
) -> Vec<&'static str> {
    todo!()
}`,
    solution: `// What an engine made of a program:
// its code and explain text, or an
// error message.
struct Out {
    code: String,
    explain: String,
}
type Res = Result<Out, String>;

fn verdict(
    src: &str,
    ts: &Res,
    rs: &Res,
    run: impl Fn(&str) -> String,
) -> Vec<&'static str> {
    let mut f = Vec::new();
    // Oracle 1: the original program.
    match ts {
        Err(_) => f.push("ts-crash"),
        Ok(t) => {
            let want = run(src);
            if run(&t.code) != want {
                f.push("behaviour");
            }
        }
    }
    // Oracle 2: the TS engine.
    if let (Ok(t), Ok(r)) = (ts, rs) {
        if t.code != r.code {
            f.push("parity-code");
        }
        if t.explain != r.explain {
            f.push("parity-explain");
        }
    } else if ts.is_ok() != rs.is_ok() {
        f.push("parity-error");
    }
    f
}`,
    tests: `fn ok(code: &str, explain: &str) -> Res {
    Ok(Out {
        code: code.to_string(),
        explain: explain.to_string(),
    })
}

// A pretend runner: a program "prints"
// the digits in its text.
fn digits(code: &str) -> String {
    code.chars().filter(|c| c.is_ascii_digit()).collect()
}

#[test]
fn agreeing_engines_and_same_behaviour() {
    let t = ok("log(1)", "ps → soa");
    let r = ok("log(1)", "ps → soa");
    assert_eq!(verdict("log(1);", &t, &r, digits), Vec::<&str>::new());
}

#[test]
fn a_shared_miscompile_is_behaviour_only() {
    let t = ok("log(2)", "ps → soa");
    let r = ok("log(2)", "ps → soa");
    assert_eq!(verdict("log(1)", &t, &r, digits), vec!["behaviour"]);
}

#[test]
fn a_rust_only_wording_is_parity_only() {
    let t = ok("log(1)", "about 20 elements (measured)");
    let r = ok("log(1)", "about 20 (measured) elements");
    assert_eq!(verdict("log(1)", &t, &r, digits), vec!["parity-explain"]);
}

#[test]
fn errors_are_compared_by_presence() {
    let t: Res = Err(
        "Identifier directly after number (1:5)".into());
    let r: Res = Err(
        "Invalid characters after number (1:5)".into());
    assert_eq!(verdict("let 1x", &t, &r, digits), vec!["ts-crash"]);
}

#[test]
fn only_one_engine_failing_is_a_parity_error() {
    let t: Res = Err("Unexpected token (2:4)".into());
    let r = ok("f(1)", "");
    assert_eq!(
        verdict("f(1", &t, &r, digits),
        vec!["ts-crash", "parity-error"]
    );
}

#[test]
fn code_and_explain_both_reported() {
    let t = ok("log(1)", "a");
    let r = ok("log(1);", "b");
    assert_eq!(
        verdict("log(1)", &t, &r, digits),
        vec!["parity-code", "parity-explain"]
    );
}

#[test]
fn behaviour_is_checked_even_if_rust_fails() {
    let t = ok("log(9)", "ps → soa");
    let r: Res = Err("internal error".into());
    assert_eq!(
        verdict("log(1)", &t, &r, digits),
        vec!["behaviour", "parity-error"]
    );
}`,
    hints: [
      'Two separate checks, one after the other: first `match ts { Err(_) => ..., Ok(t) => ... }` against the original, then the parity check.',
      'For parity, `if let (Ok(t), Ok(r)) = (ts, rs)` handles the case where both succeeded. What is left is “at least one failed”.',
      '“Exactly one failed” is `ts.is_ok() != rs.is_ok()`. That ignores the messages, which is the point.',
    ],
    walkthrough: `**How to think about it.** This is the shape of \`failuresOf\` in \`engine/rust/scripts/fuzz.mjs\`, in Rust, with the node VM replaced by a closure called \`run\`. Before writing any code, separate the two questions the fuzzer asks, because they have different oracles. First: did the TypeScript engine compile the program correctly? The oracle is the original program, so run both and compare what they print. Second: does the Rust engine agree with the TypeScript one? The oracle is the TypeScript output, so compare text. The two checks are independent: neither one's result should stop the other from running. Write them one after the other, each pushing into the same list, and the order of the list falls out of the order of the code.

**The solution, line by line.**

- \`let mut f = Vec::new();\` is the list of failures, empty to begin with. An empty list at the end means the program passed.
- \`match ts {\` starts the first check, against the original program.
- \`Err(_) => f.push("ts-crash"),\`: every generated program is valid JavaScript, so if the TypeScript engine fails on it at all, that is a bug on its own. This is how "internal error: overlapping rewrites" was found, a crash in both engines that parity could never report.
- \`Ok(t) => { let want = run(src); if run(&t.code) != want { f.push("behaviour"); } }\`: if it compiled, run the original and the compiled program and compare what they printed. Only the TypeScript output is run; the Rust output is held to it byte for byte below, so when parity passes, the Rust output has effectively been run too.
- \`if let (Ok(t), Ok(r)) = (ts, rs) {\` starts the second check. Pairing the two results in a tuple and matching both at once handles "both succeeded" in one pattern.
- \`if t.code != r.code { f.push("parity-code"); }\` and \`if t.explain != r.explain { f.push("parity-explain"); }\` compare the two texts. They are two separate \`if\`s, not an \`else if\`, so a program that differs in both reports both.
- \`} else if ts.is_ok() != rs.is_ok() { f.push("parity-error"); }\`: we get here when at least one engine failed. \`is_ok()\` turns each result into \`true\` or \`false\`, and the two differ only when exactly one failed. Two failures, whatever their messages, push nothing.
- \`f\` returns the list.

**Common wrong attempts.**

- *Comparing the error messages.* \`if ts != rs\` on two \`Err\`s, or comparing the strings, fails on every syntax error, because oxc and acorn word their messages differently ("Identifier directly after number" against "Invalid characters after number"). That is why the fuzzer compares errors by presence. The price of the rule: if both engines rejected a program for different reasons, nobody would know.
- *Returning early when Rust fails.* Writing the parity check first and returning on a Rust error silences the behaviour check, so a miscompile by the TypeScript engine goes unreported whenever the Rust engine happens to crash. One oracle failing must not hide the other; the last test checks exactly that.
- *Running the Rust output too.* It is not wrong, but it adds nothing whenever parity passes, and it costs a run per program; the real fuzzer reaches the Rust engine through its CLI, one call per batch of 250 files, and never runs its output.`,
    wrong: [
      {
        code: `// What an engine made of a program:
// its code and explain text, or an
// error message.
struct Out {
    code: String,
    explain: String,
}
type Res = Result<Out, String>;

fn verdict(
    src: &str,
    ts: &Res,
    rs: &Res,
    run: impl Fn(&str) -> String,
) -> Vec<&'static str> {
    let mut f = Vec::new();
    // Oracle 1: the original program.
    match ts {
        Err(_) => f.push("ts-crash"),
        Ok(t) => {
            let want = run(src);
            if run(&t.code) != want {
                f.push("behaviour");
            }
        }
    }
    // Oracle 2: the TS engine.
    if let (Ok(t), Ok(r)) = (ts, rs) {
        if t.code != r.code {
            f.push("parity-code");
        }
        if t.explain != r.explain {
            f.push("parity-explain");
        }
    } else if ts.as_ref().err()
        != rs.as_ref().err()
    {
        f.push("parity-error");
    }
    f
}`,
        why: 'It compares the error messages. Different wording from oxc and acorn becomes a parity failure, even when both engines rightly reject the program.',
      },
      {
        code: `// What an engine made of a program:
// its code and explain text, or an
// error message.
struct Out {
    code: String,
    explain: String,
}
type Res = Result<Out, String>;

fn verdict(
    src: &str,
    ts: &Res,
    rs: &Res,
    run: impl Fn(&str) -> String,
) -> Vec<&'static str> {
    let mut f = Vec::new();
    // Oracle 1: the original program.
    if let (Ok(t), Ok(_)) = (ts, rs) {
        let want = run(src);
        if run(&t.code) != want {
            f.push("behaviour");
        }
    }
    // Oracle 2: the TS engine.
    if let (Ok(t), Ok(r)) = (ts, rs) {
        if t.code != r.code {
            f.push("parity-code");
        }
        if t.explain != r.explain {
            f.push("parity-explain");
        }
    } else if ts.is_ok() != rs.is_ok() {
        f.push("parity-error");
    }
    f
}`,
        why: 'It skips the behaviour check unless both engines succeed, so a TS miscompile goes unreported whenever Rust fails, and a TS crash is never reported.',
      },
      {
        code: `// What an engine made of a program:
// its code and explain text, or an
// error message.
struct Out {
    code: String,
    explain: String,
}
type Res = Result<Out, String>;

fn verdict(
    src: &str,
    ts: &Res,
    rs: &Res,
    run: impl Fn(&str) -> String,
) -> Vec<&'static str> {
    let mut f = Vec::new();
    // Oracle 1: the original program.
    if ts.is_err() {
        f.push("ts-crash");
    }
    // Oracle 2: the TS engine.
    if let (Ok(t), Ok(r)) = (ts, rs) {
        if t.code != r.code {
            f.push("parity-code");
        }
        if t.explain != r.explain {
            f.push("parity-explain");
        }
    } else if ts.is_ok() != rs.is_ok() {
        f.push("parity-error");
    }
    f
}`,
        why: 'It never runs anything, so a miscompile that both engines share passes: exactly the kind of bug the fuzzer found five of.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A change makes both engines emit the same wrong code for one corpus program. Which layer can catch it?',
    options: [
      { t: 'Parity', why: 'Parity compares the engines with each other; they agree.' },
      { t: 'The wasm layer', why: 'It compares the wasm build with the same TS fixtures, which hold the same wrong code.' },
      { t: 'The node differential, which runs the original and the compiled program', correct: true, why: 'Its oracle is the source program, outside both engines.' },
    ],
  },
  {
    q: 'Which layer would notice a difference that appears only in the WebAssembly build?',
    options: [
      { t: 'Parity, since it uses the same fixtures', why: 'Parity runs the native build.' },
      { t: 'The wasm layer, which runs the wasm build against the fixtures', correct: true, why: 'Same oracle, different target: that is what it is for.' },
      { t: 'The fuzzer', why: 'It calls the native `viscosity` binary.' },
      { t: 'None of them', why: 'One of them builds and loads the wasm.' },
    ],
  },
  {
    q: 'Why does the fuzzer run only the TypeScript engine’s output, and not the Rust engine’s?',
    options: [
      { t: 'The Rust output is compared with it byte for byte, so when parity passes it has effectively been run too', correct: true, why: 'Two checks compose: Rust = TS (parity), TS ≡ original (behaviour).' },
      { t: 'Rust output can’t be run in node', why: 'It is JavaScript like any other.' },
      { t: 'To save time, at the cost of missing Rust miscompiles', why: 'A Rust miscompile would also be a parity difference.' },
    ],
  },
  {
    q: 'Rust skips `"maxLength": "20"` in a profile; TypeScript uses it. Which change would most directly have caught that?',
    options: [
      { t: 'More corpus programs', why: 'The difference is in the profile, not the program.' },
      { t: 'Comparing error messages exactly', why: 'Neither CLI reports an error here; they make different decisions.' },
      { t: 'Running the fuzzer longer', why: 'It never passes a profile, however long it runs.' },
      { t: 'Feeding both CLIs odd profiles (strings, arrays, negative numbers) and comparing their output', correct: true, why: 'A layer finds only what its inputs can produce; `viscosity profile` only ever writes numbers.' },
    ],
  },
  {
    q: 'The python3 differential compares stdout and the last line of stderr. What could it miss?',
    options: [
      { t: 'A different exception type', why: 'The last line of a traceback names the exception type and message.' },
      { t: 'A warning printed earlier on stderr by only one of the programs', correct: true, why: 'Only the last line is compared.' },
      { t: 'A different printed number', why: 'All of stdout is compared.' },
    ],
  },
];
