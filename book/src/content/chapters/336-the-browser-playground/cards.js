// Chapter 336 cards. Keys are stable ids: never rename them.

const TYPES = `// What the worker sends back.
enum Reply {
    Code(String),
    Error(String),
    // A trap: the instance is broken.
    Fatal(String),
}

struct Pg {
    latest: u32,   // newest ticket
    shown: String, // on screen
    worker: bool,  // a live worker?
    started: u32,  // workers started
}
`;

const DOCS = `
    // A new compile: a worker (start
    // one if there is none), a ticket.
`;
const DOCR = `
    // A reply for \`ticket\` arrives.
`;

export const prompts = {
  'playground-what': {
    q: 'What does the book’s **playground** run, and where?',
    a: 'The real compiler, in the reader’s browser: the TS engine on the page, or the Rust engine as WebAssembly in a worker. It shows decisions and code, and runs both versions.',
  },
  'lazy-wasm': {
    q: 'When does the playground download the Rust engine’s `.wasm`?',
    a: 'Only the first time a reader picks Rust (or a page sets `engine="rust"`). TS-only pages never fetch it.',
  },
  'public-not-bundled': {
    q: 'Why does `build.mjs --book` rewrite the default module URL in the glue?',
    a: 'The default points next to the glue file, which the bundler would try to bundle. The rewrite points it at `/wasm/viscosity_wasm_bg.wasm`, served as a plain file from `public/`.',
  },
  'memo-promise': {
    q: 'How does `play.worker.ts` make sure the module is loaded only once?',
    a: '`rust ??= import(...).then(init)`: every request awaits the same promise. On failure it resets `rust` to `null`, so a later request can try again.',
  },
  'why-worker': {
    q: 'Why does the Rust engine compile in a worker?',
    a: 'Loading and compiling then happen on a background thread, and a broken instance can be thrown away whole with `terminate()`.',
  },
  'ticket': {
    q: 'How does the playground ignore a stale compile result?',
    a: 'Each compile takes a ticket, `++latest`. A result is shown only if its ticket still equals `latest`.',
  },
  'stale-switch': {
    q: 'Without tickets, what could go wrong when a reader switches from Rust to TS while the `.wasm` loads?',
    a: 'The TS result appears first; then the Rust reply to an older edit arrives and replaces it.',
  },
  'panic-trap': {
    q: 'What does a Rust panic look like from JavaScript, in this build?',
    a: 'A `WebAssembly.RuntimeError` (here, “unreachable”): `panic=abort`, so the instance traps instead of unwinding.',
  },
  'refcell-stuck': {
    q: 'After a trap, why can’t you just keep using the instance?',
    a: 'Nothing unwound, so no destructors ran. In the author’s test a `RefCell` stayed borrowed forever, and every later call trapped.',
  },
  'fatal-new-worker': {
    q: 'What does the playground do with a reply marked `fatal`?',
    a: 'Terminates the worker and forgets it. The next compile starts a fresh worker, which loads a fresh instance.',
  },
  'smoke-playground': {
    q: 'Name three things `scripts/smoke.mjs` checks about the Rust engine in the playground.',
    a: 'No `.wasm` is fetched on TS; one fetch of `/wasm/viscosity_wasm_bg.wasm` after the toggle; identical code and decisions on both engines (also: Run both agrees, switching back works).',
  },
};

export const examples = {
  unwind: {
    lang: 'rust',
    title: 'Native Rust unwinds',
    code: `use std::cell::RefCell;
use std::panic;

fn main() {
    let seen = RefCell::new(vec![1]);
    let r = panic::catch_unwind(
        panic::AssertUnwindSafe(|| {
            let mut v =
                seen.borrow_mut();
            v.push(2);
            panic!("no booms");
        }),
    );
    println!("caught: {}", r.is_err());
    // Unwinding dropped the borrow
    // guard on its way out.
    let ok =
        seen.try_borrow_mut().is_ok();
    println!("free again: {ok}");
    println!("{:?}", seen.borrow());
}
`,
  },
};

export const exercises = {
  tickets: {
    lang: 'rust',
    title: 'Tickets and a fresh worker',
    prompt:
      'Model the playground’s Rust engine. `send` starts a worker if there is none (`worker = true`, `started += 1`), then returns a new ticket: `latest + 1`, stored in `latest`. `reply` handles an answer: a `Fatal` reply always kills the worker (`worker = false`), even a stale one. Then, only if `ticket == latest`, set `shown` to the code, or to `error: <msg>` for `Error` and `Fatal`.',
    starter: `${TYPES}
impl Pg {${DOCS}    fn send(&mut self) -> u32 {
        todo!()
    }
${DOCR}    fn reply(
        &mut self,
        ticket: u32,
        r: Reply,
    ) {
        todo!()
    }
}`,
    solution: `${TYPES}
impl Pg {${DOCS}    fn send(&mut self) -> u32 {
        if !self.worker {
            self.worker = true;
            self.started += 1;
        }
        self.latest += 1;
        self.latest
    }
${DOCR}    fn reply(
        &mut self,
        ticket: u32,
        r: Reply,
    ) {
        if let Reply::Fatal(_) = r {
            self.worker = false;
        }
        if ticket != self.latest {
            return; // a newer one won
        }
        self.shown = match r {
            Reply::Code(c) => c,
            Reply::Error(e)
            | Reply::Fatal(e) => {
                format!("error: {e}")
            }
        };
    }
}`,
    tests: `fn pg() -> Pg {
    Pg {
        latest: 0,
        shown: String::new(),
        worker: false,
        started: 0,
    }
}
fn code(s: &str) -> Reply {
    Reply::Code(s.to_string())
}

#[test]
fn only_the_latest_is_shown() {
    let mut p = pg();
    let a = p.send();
    let b = p.send();
    p.reply(b, code("new"));
    p.reply(a, code("old"));
    assert_eq!(p.shown, "new");
    assert_eq!(p.started, 1);
}

#[test]
fn errors_are_shown_too() {
    let mut p = pg();
    let t = p.send();
    let e = Reply::Error("bad".into());
    p.reply(t, e);
    assert_eq!(p.shown, "error: bad");
    assert!(p.worker);
}

#[test]
fn a_fatal_reply_replaces_the_worker() {
    let mut p = pg();
    let t = p.send();
    let e = Reply::Fatal("trap".into());
    p.reply(t, e);
    assert_eq!(p.shown, "error: trap");
    assert!(!p.worker);
    let u = p.send();
    p.reply(u, code("ok"));
    assert_eq!(p.started, 2);
    assert_eq!(p.shown, "ok");
}

#[test]
fn a_stale_fatal_still_kills_it() {
    let mut p = pg();
    let a = p.send();
    let b = p.send();
    p.reply(b, code("fine"));
    let e = Reply::Fatal("trap".into());
    p.reply(a, e);
    assert_eq!(p.shown, "fine");
    assert!(!p.worker);
}
`,
    hints: [
      '`send` is three lines of state: start a worker only when `!self.worker`, then bump `latest` and return it.',
      'In `reply`, deal with `Fatal` *before* the ticket check: a broken instance is broken whichever edit broke it.',
      'A `match` with an or-pattern, `Reply::Error(e) | Reply::Fatal(e) => …`, formats both kinds of error in one arm.',
    ],
    walkthrough: `This is \`compileNow\` and \`rustCompiler\` from \`book/src/components/playground/Playground.tsx\`, reduced to their state.

- **The ticket.** \`compileNow\` begins with \`const ticket = ++latest.current\`, and its \`show\` helper returns early when \`ticket !== latest.current\`. Your \`reply\` does the same. The TypeScript engine shares the counter, which is why switching engines also makes old Rust replies stale.
- **Fatal first.** In \`rustCompiler\`, the callback for each request runs \`if (r.fatal) { w?.terminate(); w = null; }\` before anything is shown. A stale reply can still report a trap, and the instance it came from is just as broken. \`a_stale_fatal_still_kills_it\` checks that order.
- **Lazy restart.** Nothing starts a new worker at the moment of the crash. \`(w ?? start()).postMessage(...)\` starts one when the next compile needs it, so a reader who stops typing costs nothing.
- **What the model leaves out.** Messages, the 1.4 MB fetch, and the status line (“Loading the Rust engine…” comes back after a fatal reply, because \`rustReady\` is reset).`,
    wrong: [
      {
        code: `${TYPES}
impl Pg {${DOCS}    fn send(&mut self) -> u32 {
        if !self.worker {
            self.worker = true;
            self.started += 1;
        }
        self.latest += 1;
        self.latest
    }
${DOCR}    fn reply(
        &mut self,
        ticket: u32,
        r: Reply,
    ) {
        if let Reply::Fatal(_) = r {
            self.worker = false;
        }
        self.shown = match r {
            Reply::Code(c) => c,
            Reply::Error(e)
            | Reply::Fatal(e) => {
                format!("error: {e}")
            }
        };
    }
}`,
        why: 'Without the ticket check, whichever reply arrives last wins. An old edit’s result can overwrite the newest one.',
      },
      {
        code: `${TYPES}
impl Pg {${DOCS}    fn send(&mut self) -> u32 {
        if !self.worker {
            self.worker = true;
            self.started += 1;
        }
        self.latest += 1;
        self.latest
    }
${DOCR}    fn reply(
        &mut self,
        ticket: u32,
        r: Reply,
    ) {
        if ticket != self.latest {
            return; // a newer one won
        }
        if let Reply::Fatal(_) = r {
            self.worker = false;
        }
        self.shown = match r {
            Reply::Code(c) => c,
            Reply::Error(e)
            | Reply::Fatal(e) => {
                format!("error: {e}")
            }
        };
    }
}`,
        why: 'This drops a stale fatal reply entirely, so the broken worker stays in use and every later compile goes to it.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A chapter page has one Playground with the default `engine="ts"`. When is the `.wasm` downloaded?',
    options: [
      { t: 'When the page loads, so the toggle is instant', why: 'That would cost every reader 1.4 MB. The smoke test checks that nothing `.wasm` is fetched on TS.' },
      { t: 'When the reader presses Rust for the first time', correct: true, why: 'The worker imports the glue and calls `init` only on the first Rust compile.' },
      { t: 'Never: the Rust engine is bundled into the page’s JavaScript', why: 'The module is served from `public/wasm` and never bundled.' },
    ],
  },
  {
    q: 'The reader types “abc” quickly, making compiles 7, 8 and 9. Reply 9 arrives, then reply 8. What is on screen?',
    options: [
      { t: 'Reply 8, because it arrived last', why: 'Arrival order doesn’t matter: 8 is no longer the latest ticket.' },
      { t: 'Nothing until 7 arrives, to keep order', why: 'The playground never waits for old tickets.' },
      { t: 'Reply 9: 8 is stale and dropped', correct: true, why: 'Only the ticket equal to `latest` is shown.' },
    ],
  },
  {
    q: 'Why does a panic in the Rust engine show up as `WebAssembly.RuntimeError: unreachable` rather than as Rust’s panic message?',
    options: [
      { t: 'With `panic=abort`, the panic ends in a trap, and a trap is a `RuntimeError`', correct: true, why: 'wasm32-unknown-unknown aborts on panic, and the abort is a trapping instruction. No hook prints the message in this build.' },
      { t: 'wasm-bindgen converts every panic into a `JsError`', why: 'Only an `Err` returned from the function becomes a `JsError`. A panic never returns.' },
      { t: 'The worker hides the message for security', why: 'The worker passes on whatever message it caught.' },
    ],
  },
  {
    q: 'In the author’s test, after a trap, an unrelated exported function still worked. Why does the playground replace the worker anyway?',
    options: [
      { t: 'Because terminated workers are faster', why: 'Starting a worker and instantiating the module again costs time, not saves it.' },
      { t: 'Because the trap deletes the module from memory', why: 'The instance and its memory are still there, which is the problem: in whatever state the trap left them.' },
      { t: 'Because no destructors ran, the state may be corrupt in ways nobody can check', correct: true, why: 'In the test a `RefCell` stayed borrowed and every call that touched it trapped. A fresh instance is the only state you can trust.' },
    ],
  },
  {
    q: 'In `play.worker.ts`, `loadRust` resets `rust = null` if loading fails. What would happen without that?',
    options: [
      { t: 'A failed download would stick: every later compile would get the same rejected promise', correct: true, why: '`??=` only assigns when the variable is null, so the rejected promise would be reused forever.' },
      { t: 'The module would be downloaded twice', why: 'The reset happens only on failure.' },
      { t: 'Nothing: promises retry by themselves', why: 'A settled promise never changes. Retrying means making a new one.' },
    ],
  },
  {
    q: 'What does `scripts/smoke.mjs` compare after pressing the Rust toggle on chapter 205’s Playground?',
    options: [
      { t: 'That the Rust engine is faster than the TS one', why: 'It doesn’t time anything; speed is chapter 337’s question.' },
      { t: 'That the code and the decisions text are identical to the TS engine’s', correct: true, why: 'The parity guarantee, checked in a real browser. It also runs both versions and switches back.' },
      { t: 'That the syntax errors are worded the same', why: 'They aren’t: oxc and acorn word them differently, and the AUTHORING guide says so.' },
    ],
  },
];
