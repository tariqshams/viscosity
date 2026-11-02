// Chapter 372 cards. Keys are stable ids: never rename them.

const TYPES = `const BAD_MODE: &str =
    "mode must be auto or opt-in";
const BAD_BND: &str =
    "bounds must be check or assume";

#[derive(Debug, PartialEq)]
enum Mode {
    Auto,
    OptIn,
}

#[derive(Debug, PartialEq)]
enum Bounds {
    Check,
    Assume,
}
`;

const SIGS = `fn parse_mode(s: &str)
    -> Result<Mode, String> {`;
const SIGB = `fn parse_bounds(s: &str)
    -> Result<Bounds, String> {`;
const SIGO = `fn options(mode: &str, bounds: &str)
    -> Result<(Mode, Bounds), String> {`;

const MODE = `${SIGS}
    match s {
        "auto" => Ok(Mode::Auto),
        "opt-in" => Ok(Mode::OptIn),
        _ => Err(BAD_MODE.to_string()),
    }
}
`;

const BOUNDS = `${SIGB}
    match s {
        "check" => Ok(Bounds::Check),
        "assume" => Ok(Bounds::Assume),
        _ => Err(BAD_BND.to_string()),
    }
}
`;

export const prompts = {
  'numbers-only': {
    q: 'Why can’t a WebAssembly export take a `&str` directly?',
    a: 'WebAssembly functions take and return only numbers. A string has to be copied into linear memory and passed as an address and a length.',
  },
  'bindgen-what': {
    q: 'What are the two halves of wasm-bindgen?',
    a: 'A Rust attribute, `#[wasm_bindgen]`, that marks what to export, and a command-line tool that reads the `.wasm` and writes JavaScript glue and `.d.ts` types.',
  },
  'npm-package': {
    q: 'Where does engine/rust’s WebAssembly build end up?',
    a: 'On npm as `@viscosity/wasm` (0.0.1), for Node and browsers, and in this book’s Playground, which runs it in a worker when you pick the Rust engine.',
  },
  'str-copy': {
    q: 'When JavaScript passes a string to a wasm-bindgen function taking `&str`, what happens?',
    a: 'The glue reserves space with the module’s own allocator and copies the string into linear memory as UTF-8, then passes its address and length.',
  },
  surrogate: {
    q: 'A JavaScript string contains an unpaired surrogate. What does Rust receive as `&str`?',
    a: 'The string with that unit replaced by U+FFFD, so it differs from the JavaScript string.',
  },
  'result-throw': {
    q: 'An exported wasm-bindgen function returns `Err(JsError)`. What does the JavaScript caller see?',
    a: 'An exception: the glue throws a JavaScript `Error` with the message.',
  },
  'output-handle': {
    q: 'What does the JavaScript `Output` object returned by `compile` actually hold?',
    a: 'An address (`__wbg_ptr`) of the Rust `Output` in linear memory. Its `code` getter copies the string out on every read.',
  },
  free: {
    q: 'Why does the generated `Output` class have a `free()` method?',
    a: 'The Rust value lives in linear memory, which JavaScript’s collector cannot see into. `free()` drops it now; a FinalizationRegistry is only a late fallback.',
  },
  'parity-wasm': {
    q: 'What happened when this chapter compiled the 40 JavaScript corpus programs with the published `@viscosity/wasm` from Node?',
    a: 'Every `code` and `explain` text matched the TypeScript CLI’s output byte for byte.',
  },
};

export const examples = {
  'boundary-model': {
    lang: 'rust',
    title: 'A string as two numbers',
    code: `// A model of what wasm-bindgen's
// glue does with a string argument.
// mem stands in for linear memory.

// JS side: copy UTF-8 bytes in, then
// pass where they start, and how many.
fn pass_str(mem: &mut Vec<u8>, s: &str)
    -> (usize, usize) {
    // a toy malloc: the end of mem
    let ptr = mem.len();
    mem.extend_from_slice(s.as_bytes());
    (ptr, s.len())
}

// Rust side: rebuild a &str from them.
fn take_str(mem: &[u8], ptr: usize,
    len: usize) -> &str {
    let bytes = &mem[ptr..ptr + len];
    std::str::from_utf8(bytes).unwrap()
}

fn main() {
    let mut mem = vec![0u8; 16];
    let src = "ps[i].x += 1; // naïve";
    let (ptr, len) =
        pass_str(&mut mem, src);
    println!("ptr {ptr}, len {len}");
    let js = src.encode_utf16().count();
    println!("JS length {js}");
    let back = take_str(&mem, ptr, len);
    println!("{back}");
    println!("same? {}", back == src);
}`,
  },
};

export const exercises = {
  options: {
    lang: 'rust',
    title: 'compileWith’s options',
    prompt:
      'The wasm crate’s `compileWith(source, mode, bounds, minSize)` gets its options from JavaScript as strings. Write `parse_mode` (`"auto"` or `"opt-in"`), `parse_bounds` (`"check"` or `"assume"`), and `options`, which parses both, **mode first**, and passes the first error up with `?`. Use the crate’s exact messages, given as `BAD_MODE` and `BAD_BND`.',
    starter: `${TYPES}
${SIGS}
    todo!()
}

${SIGB}
    todo!()
}

${SIGO}
    todo!()
}`,
    solution: `${TYPES}
${MODE}
${BOUNDS}
${SIGO}
    let m = parse_mode(mode)?;
    let b = parse_bounds(bounds)?;
    Ok((m, b))
}`,
    tests: `#[test]
fn good_options() {
    assert_eq!(options("auto", "check"), Ok((Mode::Auto, Bounds::Check)));
    assert_eq!(options("opt-in", "assume"), Ok((Mode::OptIn, Bounds::Assume)));
}

#[test]
fn bad_mode() {
    let e = Err("mode must be auto or opt-in".to_string());
    assert_eq!(options("fast", "check"), e);
    assert_eq!(options("optin", "check"), e);
}

#[test]
fn bad_bounds() {
    let e = Err("bounds must be check or assume".to_string());
    assert_eq!(options("auto", "maybe"), e);
}

#[test]
fn mode_is_checked_first() {
    let e = Err("mode must be auto or opt-in".to_string());
    assert_eq!(options("?", "?"), e);
}`,
    hints: [
      'Each parser is one `match` on the string, with `_ =>` for everything else returning `Err(...)`.',
      '`BAD_MODE.to_string()` turns the message into the `String` the signature asks for.',
      'In `options`, `let m = parse_mode(mode)?;` returns the error at once if there is one. Do the same for bounds, then `Ok((m, b))`.',
    ],
    walkthrough: `**How to think about it.** JavaScript hands the crate's \`compileWith\` plain strings: \`"auto"\`, \`"opt-in"\`, \`"check"\`, or anything a caller mistypes. The job is to turn each string into a typed value (an enum with exactly the allowed variants) or into an error message, at the boundary, once. Each parser is a \`match\` with one arm per allowed spelling and a catch-all arm for everything else; \`options\` then runs the two parsers in a fixed order and lets \`?\` stop at the first failure.

**The solution, line by line.**

- \`fn parse_mode(s: &str) -> Result<Mode, String> {\` borrows the string and promises either a \`Mode\` or an error message.
- \`    match s {\` compares the string with each pattern in turn; string literals are allowed as patterns.
- \`        "auto" => Ok(Mode::Auto),\` and \`        "opt-in" => Ok(Mode::OptIn),\` are the two accepted spellings.
- \`        _ => Err(BAD_MODE.to_string()),\` catches everything else (\`"fast"\`, \`"optin"\`, \`""\`) and returns the crate's exact message; \`to_string()\` turns the \`&str\` constant into the owned \`String\` the signature asks for.
- \`parse_bounds\` has the same shape, with \`"check"\` and \`"assume"\`.
- \`fn options(mode: &str, bounds: &str) -> Result<(Mode, Bounds), String> {\` returns both values as a tuple, or the first error.
- \`    let m = parse_mode(mode)?;\` either unwraps the \`Ok\` into \`m\` or returns the \`Err\` from \`options\` at once, so the bounds are never looked at.
- \`    let b = parse_bounds(bounds)?;\` does the same for the bounds.
- \`    Ok((m, b))\` wraps both in \`Ok\`.

The order matters: with two bad options, the caller hears about the mode, which is what the real crate does (its \`options\` function matches the mode first and returns early with \`return Err(...)\`; the exported function then turns that \`String\` into a \`JsError\`, so JavaScript sees a thrown \`Error\` with the same message). Why parse at all, instead of passing strings into the compiler? Because past this point everything is typed: \`Mode\` has exactly two values, so no code further in can meet \`"optin"\` and do something odd with it.

**Common wrong attempts.**

- Parsing the bounds first reports the wrong error when both options are bad; the \`mode_is_checked_first\` test catches it.
- Writing \`_ => Ok(Mode::OptIn)\` (anything that is not \`"auto"\` means opt-in) silently accepts typos such as \`"optin"\` or \`"fast"\`. Reject what you do not recognise.`,
    wrong: [
      {
        code: `${TYPES}
${MODE}
${BOUNDS}
${SIGO}
    let b = parse_bounds(bounds)?;
    let m = parse_mode(mode)?;
    Ok((m, b))
}`,
        why: 'This checks bounds first, so `options("?", "?")` reports the bounds. The crate checks the mode first.',
      },
      {
        code: `${TYPES}
${SIGS}
    match s {
        "auto" => Ok(Mode::Auto),
        _ => Ok(Mode::OptIn),
    }
}

${BOUNDS}
${SIGO}
    let m = parse_mode(mode)?;
    let b = parse_bounds(bounds)?;
    Ok((m, b))
}`,
        why: 'Treating every other string as opt-in means a typo like `"optin"` or `"fast"` silently changes behaviour. Reject what you don’t recognise.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does `#[wasm_bindgen]` on `pub fn compile(source: &str) -> Result<Output, JsError>` give JavaScript?',
    options: [
      { t: 'A raw export `compile(ptr, len)` that JS must call with numbers', why: 'That export exists, but the generated glue wraps it, so JS never sees the pointers.' },
      { t: 'A `compile(source: string): Output` function that throws on errors, plus TypeScript types', correct: true, why: 'The CLI writes the glue and a `.d.ts`; the one generated here declares exactly that signature.' },
      { t: 'A Rust interpreter running in the browser', why: 'The Rust is compiled ahead of time to WebAssembly; nothing interprets it.' },
    ],
  },
  {
    q: 'You read `r.code` ten times in a loop. What happens each time?',
    options: [
      { t: 'The same JS string is returned from a cache', why: 'The getter has no cache: it calls into Rust every time.' },
      { t: 'Rust recompiles the source', why: 'The compile happened once; the getter only reads a field.' },
      { t: 'Rust clones the `String`, and the glue decodes it into a new JS string and frees the clone', correct: true, why: 'That is what `getter_with_clone` generates. Read it once and keep the JS string.' },
    ],
  },
  {
    q: 'What does JavaScript receive when Rust’s `compile` returns `Err(JsError::new("Unexpected token (1:6)"))`?',
    options: [
      { t: '`undefined`', why: 'An `Err` from an exported function becomes an exception, not a return value.' },
      { t: 'An `Output` with empty `code`', why: 'No `Output` is built on the error path.' },
      { t: 'A thrown `Error` with that message', correct: true, why: 'Running `compile("let = ;")` from Node threw exactly this: an `Error` whose message is `Unexpected token (1:6)`.' },
      { t: 'A Rust panic message on the console', why: 'Nothing panics: the `Result` is handled and turned into an exception.' },
    ],
  },
  {
    q: 'Why is calling `r.free()` the caller’s job?',
    options: [
      { t: 'It isn’t; JavaScript’s garbage collector frees Rust memory', why: 'The collector frees the small JS wrapper. The `Output` lives in linear memory, which it knows nothing about.' },
      { t: 'The `Output` lives in Rust’s linear memory, outside the JS collector; `free()` drops it, and a FinalizationRegistry is only a fallback', correct: true, why: 'Finalizers may run late or never, so long-running pages should free explicitly.' },
      { t: 'Because `Output` holds a file handle', why: 'It holds two `String`s.' },
    ],
  },
  {
    q: 'What does the WebAssembly build of Viscosity produce?',
    options: [
      { t: 'WebAssembly versions of your loops', why: '*WebAssembly as a target* discussed emitting loops as WebAssembly; Viscosity still emits JavaScript (or Python).' },
      { t: 'The same JavaScript and explain text as the TypeScript engine, from a compiler that itself runs as WebAssembly', correct: true, why: 'In this chapter’s run, the published package matched the TypeScript CLI on all 40 JavaScript corpus programs. It is what the Playground’s Rust switch runs.' },
      { t: 'Rust source code', why: 'Viscosity is JavaScript in, JavaScript out, whichever engine runs it.' },
    ],
  },
];
