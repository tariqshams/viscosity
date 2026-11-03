// Chapter 323 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'playground-def': {
    q: 'What is a compiler **playground**?',
    a: 'The compiler running in a web page: the reader edits a program and sees the compiler’s output (for an optimiser, its decisions and the compiled code, and often a check that both versions behave the same).',
  },
  'lazy-wasm-why': {
    q: 'Why should a page load a large WebAssembly module with a dynamic `import()` on first use, rather than with the page?',
    a: 'So readers who never use it never pay for the download; a dynamic `import()` fetches the glue (and the glue the module) only when that line runs.',
  },
  'memo-promise': {
    q: 'In JavaScript, how do you make sure an asynchronous resource is loaded at most once, yet loaded again after a failed attempt?',
    a: 'Memoise the promise, `p ??= load()`, so every caller awaits the same one, and in its `.catch` set `p = null` before rethrowing, so the next caller starts a new load.',
  },
  ticket: {
    q: 'How can a user interface ignore the result of an asynchronous request that a newer request has overtaken?',
    a: 'Each compile takes a ticket, `++latest`. A result is shown only if its ticket still equals `latest`.',
  },
  'stale-switch': {
    q: 'A page sends a compile to a slow worker, then the reader switches to a fast engine on the page, whose result shows at once. Without a staleness check, what goes wrong?',
    a: 'The worker’s reply to the older request arrives later and overwrites the newer result on screen.',
  },
  'panic-trap': {
    q: 'In Rust compiled to `wasm32-unknown-unknown` with the default `panic=abort`, what does a panic look like from JavaScript?',
    a: 'A trap, thrown as a `WebAssembly.RuntimeError` (typically “unreachable”): the instance aborts instead of unwinding.',
  },
  'refcell-stuck': {
    q: 'A Rust function compiled to WebAssembly with `panic=abort` panics while it holds a `RefCell` borrow. Why does that `RefCell` stay borrowed if the instance is used again?',
    a: 'Nothing unwinds, so the borrow guard’s destructor never runs and the borrow flag is never reset; every later borrow of it panics, which traps again.',
  },
  'fatal-new-worker': {
    q: 'What is the safe way for a page to recover after its WebAssembly engine traps on a Rust panic?',
    a: 'Discard the instance: terminate the worker that holds it and start a new one, with a fresh instance and fresh memory, for the next request.',
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
    prompt: 'Model the playground’s Rust engine. `send` starts a worker if there is none (`worker = true`, `started += 1`), then returns a new ticket: `latest + 1`, stored in `latest`. `reply` handles an answer: a `Fatal` reply always kills the worker (`worker = false`), even a stale one. Then, only if `ticket == latest`, set `shown` to the code, or to `error: <msg>` for `Error` and `Fatal`.',
    starter: `// What the worker sends back.
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

impl Pg {
    // A new compile: a worker (start
    // one if there is none), a ticket.
    fn send(&mut self) -> u32 {
        todo!()
    }

    // A reply for \`ticket\` arrives.
    fn reply(
        &mut self,
        ticket: u32,
        r: Reply,
    ) {
        todo!()
    }
}`,
    solution: `// What the worker sends back.
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

impl Pg {
    // A new compile: a worker (start
    // one if there is none), a ticket.
    fn send(&mut self) -> u32 {
        if !self.worker {
            self.worker = true;
            self.started += 1;
        }
        self.latest += 1;
        self.latest
    }

    // A reply for \`ticket\` arrives.
    fn reply(
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
    walkthrough: `**How to think about it.** This is \`compileNow\` and \`rustCompiler\` from \`book/src/components/playground/Playground.tsx\`, reduced to their state: no messages, no download, only the four fields that decide what happens. Two rules matter, and the trick is to see that they are about different things. The ticket rule is about the *screen*: only the newest compile's answer may be shown. The fatal rule is about the *worker*: a trap means the instance is broken, whichever compile caused it. So they are two separate steps in \`reply\`, and the worker step must come first, before the ticket check can return early.

**The solution, line by line.**

- \`fn send(&mut self) -> u32 {\` takes \`&mut self\` because it changes the state, and returns the new ticket.
- \`if !self.worker { self.worker = true; self.started += 1; }\` starts a worker only when there is none. This is the lazy restart: after a crash nothing happens until the next compile, as in the real code's \`(w ?? start()).postMessage(...)\`.
- \`self.latest += 1; self.latest\` makes the ticket: one more than the newest so far, stored so later replies can be compared with it, and returned (the last expression of a block is its value).
- \`fn reply(&mut self, ticket: u32, r: Reply) {\` handles one answer.
- \`if let Reply::Fatal(_) = r { self.worker = false; }\` kills the worker on a trap, stale or not. \`if let\` is a \`match\` with one interesting arm; \`_\` ignores the message here.
- \`if ticket != self.latest { return; }\` is the ticket rule: a newer compile has started since this one, so its answer is dropped.
- \`self.shown = match r { Reply::Code(c) => c, Reply::Error(e) | Reply::Fatal(e) => { format!("error: {e}") } };\` sets the screen. The or-pattern \`Reply::Error(e) | Reply::Fatal(e)\` binds \`e\` in both cases, so one arm formats both kinds of error. \`match r\` moves \`r\`, which is fine because we are done with it.

**Common wrong attempts.**

- *No ticket check.* Then whichever reply arrives last wins, and an old edit's result, arriving late, overwrites the newest one. The TypeScript engine shares the counter in the real code, which is why switching engines also makes old Rust replies stale.
- *Checking the ticket first.* Returning early for a stale reply also skips the fatal rule, so a stale trap leaves the broken worker in use and every later compile goes to it; \`a_stale_fatal_still_kills_it\` checks that order.
- *Starting a fresh worker at once on a fatal reply.* It works, but it costs a 1.4 MB download for a reader who may have stopped typing; the real code waits for the next compile.

What the model leaves out: the messages, the fetch, and the status line ("Loading the Rust engine…" comes back after a fatal reply, because \`rustReady\` is reset).`,
    wrong: [
      {
        code: `// What the worker sends back.
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

impl Pg {
    // A new compile: a worker (start
    // one if there is none), a ticket.
    fn send(&mut self) -> u32 {
        if !self.worker {
            self.worker = true;
            self.started += 1;
        }
        self.latest += 1;
        self.latest
    }

    // A reply for \`ticket\` arrives.
    fn reply(
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
        code: `// What the worker sends back.
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

impl Pg {
    // A new compile: a worker (start
    // one if there is none), a ticket.
    fn send(&mut self) -> u32 {
        if !self.worker {
            self.worker = true;
            self.started += 1;
        }
        self.latest += 1;
        self.latest
    }

    // A reply for \`ticket\` arrives.
    fn reply(
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
    q: 'A page’s only Playground uses the default `engine="ts"`, and the Rust engine is loaded lazily in a worker. When is the `.wasm` downloaded?',
    options: [
      {
        t: 'When the page loads, so the toggle is instant',
        why: 'That would cost every reader 1.4 MB. The smoke test checks that nothing `.wasm` is fetched on TS.',
      },
      {
        t: 'When the reader presses Rust for the first time',
        correct: true,
        why: 'The worker imports the glue and calls `init` only on the first Rust compile.',
      },
      {
        t: 'Never: the Rust engine is bundled into the page’s JavaScript',
        why: 'The module is served from `public/wasm` and never bundled.',
      },
    ],
  },
  {
    q: 'The reader types “abc” quickly, making compiles 7, 8 and 9. Reply 9 arrives, then reply 8. What is on screen?',
    options: [
      {
        t: 'Reply 8, because it arrived last',
        why: 'Arrival order doesn’t matter: 8 is no longer the latest ticket.',
      },
      {
        t: 'Nothing until 7 arrives, to keep order',
        why: 'The playground never waits for old tickets.',
      },
      {
        t: 'Reply 9: 8 is stale and dropped',
        correct: true,
        why: 'Only the ticket equal to `latest` is shown.',
      },
    ],
  },
  {
    q: 'Why does a panic in the Rust engine show up as `WebAssembly.RuntimeError: unreachable` rather than as Rust’s panic message?',
    options: [
      {
        t: 'With `panic=abort`, the panic ends in a trap, and a trap is a `RuntimeError`',
        correct: true,
        why: 'wasm32-unknown-unknown aborts on panic, and the abort is a trapping instruction. No hook prints the message in this build.',
      },
      {
        t: 'wasm-bindgen converts every panic into a `JsError`',
        why: 'Only an `Err` returned from the function becomes a `JsError`. A panic never returns.',
      },
      {
        t: 'The worker hides the message for security',
        why: 'The worker passes on whatever message it caught.',
      },
    ],
  },
  {
    q: 'After a `panic=abort` trap, an unrelated exported function of the same WebAssembly instance can still work. Why replace the instance anyway?',
    options: [
      {
        t: 'Because terminated workers are faster',
        why: 'Starting a worker and instantiating the module again costs time, not saves it.',
      },
      {
        t: 'Because the trap deletes the module from memory',
        why: 'The instance and its memory are still there, which is the problem: in whatever state the trap left them.',
      },
      {
        t: 'Because no destructors ran, the state may be corrupt in ways nobody can check',
        correct: true,
        why: 'For example, a `RefCell` borrowed at the panic stays borrowed, and every call that touches it traps. A fresh instance is the only state you can trust.',
      },
    ],
  },
  {
    q: 'A loader memoises its promise with `rust ??= load()` and resets `rust = null` if loading fails. What would happen without the reset?',
    options: [
      {
        t: 'A failed download would stick: every later compile would get the same rejected promise',
        correct: true,
        why: '`??=` only assigns when the variable is null, so the rejected promise would be reused forever.',
      },
      {
        t: 'The module would be downloaded twice',
        why: 'The reset happens only on failure.',
      },
      {
        t: 'Nothing: promises retry by themselves',
        why: 'A settled promise never changes. Retrying means making a new one.',
      },
    ],
  },
];
