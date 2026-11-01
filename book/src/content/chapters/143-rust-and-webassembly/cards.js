// Chapter 143 cards. Keys are stable ids: never rename them.

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
  'wasm-target': {
    q: 'Which target does Rust compile to for the browser, without an operating system?',
    a: '`wasm32-unknown-unknown`.',
  },
  'numbers-only': {
    q: 'Why can’t a WebAssembly export take a `&str` directly?',
    a: 'WebAssembly functions take and return only numbers. A string has to be copied into linear memory and passed as a pointer and a length.',
  },
  'bindgen-what': {
    q: 'What are the two halves of wasm-bindgen?',
    a: 'A Rust attribute, `#[wasm_bindgen]`, that marks what to export, and a CLI that reads the `.wasm` and writes JavaScript glue and `.d.ts` types.',
  },
  'str-copy': {
    q: 'When JS passes a string to a wasm-bindgen function taking `&str`, what happens?',
    a: 'The glue allocates space in linear memory and copies the string in as UTF-8 with `TextEncoder`.',
  },
  'surrogate': {
    q: 'A JS string contains an unpaired surrogate. What does Rust receive as `&str`?',
    a: 'The string with that unit replaced by U+FFFD, so it differs from the JS string.',
  },
  'output-handle': {
    q: 'What does the JS `Output` object returned by `compile` actually hold?',
    a: 'A pointer (`__wbg_ptr`) to the Rust `Output` in linear memory. Its `code` getter copies the string out on each read.',
  },
  'free': {
    q: 'Why does the generated `Output` class have a `free()` method?',
    a: 'The Rust value lives in linear memory, which JavaScript’s collector doesn’t manage. `free()` drops it; a FinalizationRegistry is only a fallback.',
  },
  'result-throw': {
    q: 'An exported wasm-bindgen function returns `Err(JsError)`. What does the JS caller see?',
    a: 'An exception: the glue throws a JavaScript `Error` with the message.',
  },
  'parity-wasm': {
    q: 'How many of engine/rust’s fixtures did the WebAssembly build reproduce when this chapter ran it from Node?',
    a: 'All 122: code and explain text byte-identical to the TypeScript engine’s.',
  },
  'refresh-view': {
    q: 'Why does the glue re-create its `Uint8Array` view of memory when its `byteLength` is 0?',
    a: 'Growing the memory detaches the old `ArrayBuffer`, so old views become empty (chapter 117).',
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
    walkthrough: `This is the part of \`compile_with\` in \`engine/rust/crates/wasm/src/lib.rs\` that runs before the compiler does, with \`String\` in place of \`JsError\` so it can run outside a browser.

\`\`\`rust
let m = parse_mode(mode)?;
let b = parse_bounds(bounds)?;
Ok((m, b))
\`\`\`

The order matters: with two bad options, the caller hears about the mode, because \`?\` returns at the first \`Err\`. The real crate does the same with two \`match\`es and an early \`return Err(JsError::new(...))\`.

Why parse at all, instead of passing strings into the compiler? Because past this point everything is typed. \`Mode\` has exactly two values, so no code further in can meet \`"optin"\` and do something odd with it. The boundary is where the loosely typed world of JavaScript strings gets checked, once. In JavaScript, the \`Err\` turns into a thrown \`Error\` with this message.`,
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
    q: 'Each call to `compile` copies the source into linear memory. Why doesn’t the glue just hand Rust the JS string?',
    options: [
      { t: 'WebAssembly can only exchange numbers, and Rust needs UTF-8 bytes in its own memory', correct: true, why: 'So the glue encodes the string into memory the module owns and passes a pointer and a length.' },
      { t: 'To make the call faster', why: 'Copying costs time. It is needed, not an optimization.' },
      { t: 'Because JS strings are immutable', why: 'Rust only reads a `&str`, so immutability isn’t the issue; where the bytes live, and their encoding, is.' },
      { t: 'It does hand over the JS string; the copy is a debug feature', why: 'The generated `passStringToWasm0` always copies, through `TextEncoder`.' },
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
      { t: 'WebAssembly versions of your loops', why: 'Chapter 117: emitting loops as WebAssembly is a design, not code.' },
      { t: 'The same JavaScript and explain text as the TypeScript engine, from a compiler that itself runs as WebAssembly', correct: true, why: 'Its output matched all 122 fixtures in this chapter’s run.' },
      { t: 'Rust source code', why: 'Viscosity is JavaScript in, JavaScript out, whichever engine runs it.' },
    ],
  },
];
