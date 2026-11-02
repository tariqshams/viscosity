// Chapter 404 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'fs-what': {
    q: 'What four fields does a drip-rs `CallFrame` have?',
    a: '`closure: Gc<ObjClosure>`, `chunk: Rc<Chunk>`, `ip: usize` and `slots: usize` (the stack index of the frame’s slot 0).',
  },
  'fs-rc': {
    q: 'Why does each drip-rs frame hold an `Rc<Chunk>` rather than a `&Chunk`?',
    a: 'A `&Chunk` would borrow the heap for as long as the frame lives. An `Rc` clone is the frame’s own pointer to the finished chunk, and costs one count bump.',
  },
  'fs-stale': {
    q: 'When is the `ip` field of a drip-rs `CallFrame` up to date?',
    a: 'Only while the frame is paused under a call. While it runs, the live value is the VM’s `ip` register.',
  },
  'fs-no-reload': {
    q: 'Why does drip-rs’s `Call` arm need no `reload()`, unlike the TypeScript loop?',
    a: '`call` itself saves the caller’s `ip` and loads the callee’s `ip`, chunk and slots into the registers.',
  },
  'fs-slots': {
    q: 'In `call`, why is `slots` equal to `stack.len() - arg_count - 1`?',
    a: 'The frame’s slot 0 is the callee itself (or `self` in a method), just below its `arg_count` arguments.',
  },
  'fs-overflow': {
    q: 'What does drip-rs do when a call would make a 257th frame?',
    a: '`call` returns `Err(self.runtime_error("stack overflow"))`, because `frames.len() == FRAMES_MAX` (256).',
  },
  'fs-pop-frame': {
    q: 'What does `pop_frame` return when the script’s own frame returns, and what does the `Return` arm do then?',
    a: '`None`, because there is no caller to load. The `Return` arm clears the stack and `run` returns `Ok(())`.',
  },
  'fs-trace': {
    q: 'In `runtime_error`, why does the top frame use `self.ip` instead of `frame.ip`?',
    a: 'The running frame’s `ip` field is out of date (it is only written when that frame makes a call); only the register has its current position.',
  },
};

export const examples = {
  fact: {
    lang: 'drip-vm',
    title: 'One frame per call',
    code: `fn fact(n) {
  if n <= 1 { return 1; }
  return n * fact(n - 1);
}
print fact(5);
print fact(20);`,
  },
};

const crHead = `#[derive(Debug, PartialEq)]
struct Frame {
    func: usize,
    ip: usize,
    slots: usize,
}

struct Func {
    name: &'static str,
    arity: usize,
}

const FRAMES_MAX: usize = 256;

fn plural(n: usize) -> String {
    if n == 1 {
        "1 argument".to_string()
    } else {
        format!("{n} arguments")
    }
}

struct Vm {
    funcs: Vec<Func>,
    stack: Vec<f64>,
    frames: Vec<Frame>,
    // The registers:
    ip: usize,
    slots: usize,
}

impl Vm {
    fn new(funcs: Vec<Func>) -> Vm {
        Vm {
            funcs,
            stack: Vec::new(),
            frames: Vec::new(),
            ip: 0,
            slots: 0,
        }
    }

    fn push(&mut self, v: f64) {
        self.stack.push(v);
    }

    fn pop(&mut self) -> f64 {
        self.stack.pop().unwrap()
    }
`;

const cr = (callBody, retBody) => `${crHead}
    // Call funcs[func]. The callee and
    // its argc arguments are on top of
    // the stack.
    fn call(
        &mut self,
        func: usize,
        argc: usize,
    ) -> Result<(), String> {
${callBody}
    }

    // Return from the running frame.
    // false: there was no caller.
    fn ret(&mut self) -> bool {
${retBody}
    }
}`;

const CHECKS = `        let f = &self.funcs[func];
        if argc != f.arity {
            let n = f.name;
            let a = plural(f.arity);
            let m = format!(
                "{n}() takes {a}");
            return Err(format!(
                "{m} but got {argc}"
            ));
        }
        let depth = self.frames.len();
        if depth == FRAMES_MAX {
            let m = "stack overflow";
            return Err(m.to_string());
        }`;

const SAVE = `        // Save the caller's ip.
        let c = self.frames.last_mut();
        if let Some(c) = c {
            c.ip = self.ip;
        }`;

const PUSH = (slots) => `        let n = self.stack.len();
        let slots = ${slots};
        self.frames.push(Frame {
            func,
            ip: 0,
            slots,
        });
        // Load the callee.
        self.ip = 0;
        self.slots = slots;
        Ok(())`;

const RET = `        let r = self.pop();
        let top = self.frames.pop();
        let f = top.expect("a frame");
        self.stack.truncate(f.slots);
        match self.frames.last() {
            None => false,
            Some(c) => {
                self.ip = c.ip;
                self.slots = c.slots;
                self.stack.push(r);
                true
            }
        }`;

const stHead = `use std::rc::Rc;

struct Frame {
    // None for the top-level script
    name: Option<&'static str>,
    // the chunk's line table
    lines: Rc<Vec<u32>>,
    ip: usize,
}

struct Vm {
    frames: Vec<Frame>,
    // The running frame's ip.
    ip: usize,
}

impl Vm {
    // The message, then one line per
    // frame, innermost first:
    // "  at line 2 in fn f" or
    // "  at line 5 in script".
    fn trace(&self, msg: &str)
        -> Vec<String> {
`;

const st = (body) => `${stHead}${body}
    }
}`;

const PICK = `if d == top {
                self.ip
            } else {
                f.ip
            }`;

const traceBody = (pick, rev) => `        let mut out = Vec::new();
        out.push(format!(
            "runtime error: {msg}"));
        let top = self.frames.len()
            .saturating_sub(1);
        let fs = self.frames.iter();
        let fs = fs.enumerate()${rev};
        for (d, f) in fs {
            let ip = ${pick};
            let line = f.lines[ip - 1];
            let place = match f.name {
                Some(n) => {
                    format!("fn {n}")
                }
                None => "script".into(),
            };
            let at = "  at line";
            out.push(format!(
                "{at} {line} in {place}"
            ));
        }
        out`;

export const exercises = {
  callReturn: {
    lang: 'rust',
    title: 'call and return',
    prompt: `This VM is a frame stack shaped like drip-rs's. \`frames\` is a \`Vec<Frame>\`, and the running frame's \`ip\` and \`slots\` are registers, fields of the \`Vm\`. Write:

1. \`call(func, argc)\`. The callee and its \`argc\` arguments are already on the stack. Check the arity, with drip-rs's message (\`"add() takes 2 arguments but got 1"\`; the helper \`plural\` makes "1 argument" or "2 arguments"), then the depth (\`"stack overflow"\` when \`FRAMES_MAX\` frames already exist). Then save the register \`ip\` into the caller's frame, if there is a caller, push the new frame with \`ip: 0\` and \`slots\` at the callee's own slot, and load the registers.
2. \`ret()\`. Pop the result and the frame. Drop the frame's slots from the stack. If a caller is left, load its \`ip\` and \`slots\` into the registers, push the result and return \`true\`. If not, return \`false\`.

Don't change the running frame's \`ip\` field while it runs: only \`call\` writes it.`,
    starter: cr('        todo!()', '        todo!()'),
    solution: cr(`${CHECKS}
${SAVE}
${PUSH('n - argc - 1')}`, RET),
    tests: `fn vm() -> Vm {
    // 0: the script, 1: add(a, b), 2: f()
    let fs = vec![
        Func { name: "", arity: 0 },
        Func { name: "add", arity: 2 },
        Func { name: "f", arity: 0 },
    ];
    let mut vm = Vm::new(fs);
    vm.push(0.0); // the script itself
    vm.call(0, 0).unwrap();
    vm
}

fn call_add(vm: &mut Vm) {
    vm.push(1.0); // add
    vm.push(1.0);
    vm.push(2.0);
    vm.call(1, 2).unwrap();
}

#[test]
fn the_script_gets_the_first_frame() {
    let vm = vm();
    let f = Frame { func: 0, ip: 0, slots: 0 };
    assert_eq!(vm.frames, [f]);
    assert_eq!((vm.ip, vm.slots), (0, 0));
}

#[test]
fn call_saves_the_callers_ip() {
    let mut vm = vm();
    vm.ip = 17;
    call_add(&mut vm);
    assert_eq!(vm.frames[0].ip, 17);
    let f = Frame { func: 1, ip: 0, slots: 1 };
    assert_eq!(vm.frames[1], f);
    assert_eq!((vm.ip, vm.slots), (0, 1));
}

#[test]
fn ret_restores_the_caller() {
    let mut vm = vm();
    vm.ip = 17;
    call_add(&mut vm);
    vm.ip = 6;
    vm.push(3.0); // the result
    assert!(vm.ret());
    assert_eq!(vm.stack, [0.0, 3.0]);
    assert_eq!((vm.ip, vm.slots), (17, 0));
    assert_eq!(vm.frames.len(), 1);
}

#[test]
fn the_last_return_ends_the_script() {
    let mut vm = vm();
    vm.push(0.0); // none
    assert!(!vm.ret());
    assert!(vm.frames.is_empty());
    assert!(vm.stack.is_empty());
}

#[test]
fn the_arity_is_checked() {
    let mut vm = vm();
    vm.push(1.0);
    vm.push(5.0);
    let m = "add() takes 2 arguments but got 1";
    assert_eq!(vm.call(1, 1), Err(m.into()));
    assert_eq!(vm.frames.len(), 1);
}

#[test]
fn deep_recursion_overflows() {
    let mut vm = vm();
    for _ in 0..255 {
        vm.push(2.0);
        vm.call(2, 0).unwrap();
    }
    assert_eq!(vm.frames.len(), 256);
    vm.push(2.0);
    let m = "stack overflow";
    assert_eq!(vm.call(2, 0), Err(m.into()));
    assert_eq!(vm.frames.len(), 256);
}`,
    hints: [
      'Write `call` as four steps in order: check, save, push, load. Which of them can fail, and so must come first?',
      'The callee sits just below its arguments, so its slot is `self.stack.len() - argc - 1`. Save the caller’s `ip` with `if let Some(c) = self.frames.last_mut() { c.ip = self.ip; }` before pushing.',
      'For `ret`: `let r = self.pop();`, pop the frame, `self.stack.truncate(f.slots)`, then `match self.frames.last()`: `None => false`, `Some(c) =>` load `c.ip` and `c.slots`, push `r`, `true`.',
    ],
    walkthrough: `**How to think about it.** There are two places a running function's position could live: in its frame, or in the VM's registers. This VM, like drip-rs, keeps it in the registers, which means a frame's \`ip\` field is a *note for later*, written only at the moment the frame is paused. So \`call\` has to do four things in order: refuse the call if it is wrong (before anything changes), write the caller's note, push the callee's frame, and point the registers at the callee. \`ret\` undoes it: throw the finished frame away and read the caller's note back into the registers.

**\`call\`, line by line.**

- \`let f = &self.funcs[func];\` borrows the function's description. The borrow ends before anything below needs \`&mut self\`, because \`f\` is not used after the checks.
- \`if argc != f.arity { return Err(format!(...)); }\` builds drip-rs's wording, \`add() takes 2 arguments but got 1\`, with \`plural\` choosing "argument" or "arguments".
- \`let depth = self.frames.len();\` and \`if depth == FRAMES_MAX { ... }\` refuse a 257th frame with \`stack overflow\`. Both checks come before any change, so a refused call leaves the VM exactly as it was (the test checks \`frames.len()\` afterwards).
- \`let c = self.frames.last_mut();\` and \`if let Some(c) = c { c.ip = self.ip; }\` save the register into the caller's frame. For the script's own call there is no caller, so nothing is saved.
- \`let n = self.stack.len();\` and \`let slots = n - argc - 1;\` find the callee's own slot, one below its first argument. In \`call_add\` the stack is \`[script, add, 1, 2]\`, so \`slots\` is \`4 - 2 - 1 = 1\`.
- \`self.frames.push(Frame { func, ip: 0, slots });\` pushes the new frame. Its \`ip\` is 0 and will not be written again until it makes a call of its own.
- \`self.ip = 0;\` and \`self.slots = slots;\` load the registers, and \`Ok(())\` reports success.

**\`ret\`, line by line.**

- \`let r = self.pop();\` takes the result off the top.
- \`let top = self.frames.pop();\` and \`let f = top.expect("a frame");\` take the finished frame out by value.
- \`self.stack.truncate(f.slots);\` drops the callee and every argument and local in one step. In the test, \`[script, add, 1, 2]\` becomes \`[script]\`.
- \`match self.frames.last() {\`: with no caller left (\`None\`), the script has finished, so return \`false\`. With a caller (\`Some(c)\`), load \`c.ip\` and \`c.slots\` into the registers, push the result where the callee used to be, and return \`true\`.

**Common wrong attempts.**

- Advancing \`self.frames.last_mut().ip\` as the code runs, the TypeScript habit, instead of saving the register in \`call\`: the caller's note then holds an old position, and returning jumps back to the wrong place.
- \`let slots = n - argc;\` points one slot too high, at the first argument: every \`load.local\` reads the wrong slot, and \`ret\` leaves the callee on the stack.
- Pushing the result before truncating cuts the result off with the slots.`,
    wrong: [
      {
        code: cr(`${CHECKS}
${PUSH('n - argc - 1')}`, RET),
        why: 'It never saves the caller’s `ip`, the TypeScript habit of updating the frame as the loop runs. Here the caller’s position lives only in the register, which `call` overwrites, so returning jumps back to a stale position.',
      },
      {
        code: cr(`${CHECKS}
${SAVE}
${PUSH('n - argc')}`, RET),
        why: '`slots` must point at the callee, one below the first argument. Off by one, every `load.local` reads the wrong slot and `ret` leaves the callee on the stack.',
      },
    ],
  },
  stackTrace: {
    optional: true,
    lang: 'rust',
    title: 'A stack trace from out-of-date frames',
    prompt: `Write \`trace\`, the stack-trace half of drip-rs's \`runtime_error\`. Return \`"runtime error: "\` plus the message, then one line per frame, innermost first: \`"  at line N in fn name"\`, or \`"  at line N in script"\` when the name is \`None\`.

The line is \`lines[ip - 1]\`, because \`ip\` is already past the failing instruction. For every paused frame, \`ip\` is the frame's own field. For the top frame, that field is out of date: use the register \`self.ip\`.`,
    starter: st('        todo!()'),
    solution: st(traceBody(PICK, '.rev()')),
    tests: `// fn f(x) { return -x; }   (line 2)
// fn g() { return f("hi"); } (line 5)
// print g();                 (line 7)
fn vm() -> Vm {
    let script = Rc::new(vec![7, 7, 7]);
    let g = Rc::new(vec![5, 5, 5, 5]);
    let f = Rc::new(vec![2, 2, 2]);
    Vm {
        frames: vec![
            Frame { name: None,
                lines: script, ip: 3 },
            Frame { name: Some("g"),
                lines: g, ip: 4 },
            // out of date: never written
            Frame { name: Some("f"),
                lines: f, ip: 0 },
        ],
        ip: 3,
    }
}

#[test]
fn innermost_frame_first() {
    let m = "cannot negate a string";
    let t = vm().trace(m);
    assert_eq!(t, [
        "runtime error: cannot negate a string",
        "  at line 2 in fn f",
        "  at line 5 in fn g",
        "  at line 7 in script",
    ]);
}

#[test]
fn the_top_frame_uses_the_register() {
    let mut vm = vm();
    vm.frames[2].lines =
        Rc::new(vec![1, 2, 9]);
    let t = vm.trace("x");
    assert_eq!(t[1], "  at line 9 in fn f");
}

#[test]
fn a_lone_script() {
    let lines = Rc::new(vec![1, 7]);
    let vm = Vm {
        frames: vec![Frame {
            name: None, lines, ip: 0,
        }],
        ip: 2,
    };
    assert_eq!(vm.trace("boom"), [
        "runtime error: boom",
        "  at line 7 in script",
    ]);
}`,
    hints: [
      'Walk the frames from the last (innermost) to the first: `self.frames.iter().enumerate().rev()` gives each frame with its index.',
      'The top frame is index `self.frames.len() - 1` (use `saturating_sub(1)` so an empty list cannot underflow). For it, use `self.ip`; for the others, `f.ip`.',
      'The line is `f.lines[ip - 1]`. Name the place with `match f.name { Some(n) => format!("fn {n}"), None => "script".into() }`.',
    ],
    walkthrough: `**How to think about it.** A stack trace answers "which line was each call on?", innermost first. For a paused frame the answer is in its saved \`ip\`; for the running frame it is in the register, because its own field is only a note written when it pauses. And \`ip\` always points one past the instruction that was running, so the line is that of \`ip - 1\`.

**The solution, line by line.**

- \`let mut out = Vec::new();\` and \`out.push(format!("runtime error: {msg}"));\` start with the message.
- \`let top = self.frames.len().saturating_sub(1);\` is the index of the running frame. \`saturating_sub\` stops at 0 instead of underflowing, as drip-rs's \`runtime_error\` does.
- \`let fs = fs.enumerate().rev();\` walks the frames from the innermost out, with their indices.
- \`let ip = if d == top { self.ip } else { f.ip };\` is the whole point of the exercise: the register for the top frame, the saved note for the rest.
- \`let line = f.lines[ip - 1];\` looks the line up in that frame's own line table.
- \`let place = match f.name { ... };\` names the place, \`fn f\` or \`script\`, as drip-rs does (it also has \`anonymous fn\`, left out here).
- \`out.push(format!("  at line {line} in {place}"));\` adds the line, with its two-space indent.

**Common wrong attempts.**

- Using \`f.ip\` for every frame: the top frame's field is 0, so \`ip - 1\` underflows and the program panics (in general it would name the wrong line).
- Forgetting \`.rev()\`: the script comes first, but drip-rs and the TypeScript VM both print the innermost call first.`,
    wrong: [
      {
        code: st(traceBody('f.ip', '.rev()')),
        why: 'The top frame’s `ip` field is out of date. Here it is 0, so `ip - 1` underflows and the test panics; in general it names the wrong line.',
      },
      {
        code: st(traceBody(PICK, '')),
        why: 'Without `.rev()` the script comes first. drip-rs and the TypeScript VM both print the innermost call first.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why can’t drip-rs’s loop keep `let frame = self.frames.last_mut().unwrap();` across a call, as the TypeScript loop keeps `frame`?',
    options: [
      { t: '`last_mut` is slower than indexing', why: 'Speed is not the issue: the code does not compile at all.' },
      { t: '`call` pushes onto `self.frames`, which needs `&mut self` while `frame` still borrows it, and a push may move the frames', correct: true, why: 'That is E0499. drip-rs keeps the running frame’s state in registers instead.' },
      { t: 'A `CallFrame` cannot be mutated', why: '`call` writes `caller.ip = self.ip` through `last_mut()`; it just doesn’t hold that borrow across the push.' },
      { t: 'Frames are stored in the heap’s arenas', why: 'They are a plain `Vec<CallFrame>` on the `Vm`.' },
    ],
  },
  {
    q: 'The script runs `add(1, 2)` with its register `ip` at 17. Right after `call` returns `Ok`, what is true?',
    options: [
      { t: 'The script’s frame says `ip: 17`, and the register `ip` is 0', correct: true, why: '`call` saved the register into the caller’s frame, then loaded the callee’s `ip`.' },
      { t: 'The script’s frame still says `ip: 0`', why: 'That was true while the script ran. `call` writes the field just before pushing.' },
      { t: 'The register `ip` is still 17 until the loop reloads', why: 'drip-rs has no reload: `call` loads the registers itself.' },
      { t: '`add`’s frame says `ip: 17`', why: 'The new frame starts at `ip: 0`; 17 is the caller’s position.' },
    ],
  },
  {
    q: 'What does `pop_frame` returning `None` mean?',
    options: [
      { t: 'The frame stack was already empty', why: '`pop_frame` expects a running frame; an empty stack would panic at its `expect`.' },
      { t: 'A runtime error happened', why: 'Errors travel as `Err(RuntimeError)`, not through `pop_frame`.' },
      { t: 'The returning frame was the script’s, so there is no caller: the program has finished', correct: true, why: '`self.frames.last()?` returns early. The `Return` arm clears the stack and `run` returns `Ok(())`.' },
      { t: 'The callee returned `none`', why: 'The return value is popped before `pop_frame`; it has nothing to do with the `Option`.' },
    ],
  },
  {
    q: 'A trace reads `at line 2 in fn f`, then `at line 5 in fn g`, then `at line 7 in script`. Where did the 2 come from?',
    options: [
      { t: 'From `f`’s frame’s `ip` field', why: 'That field is out of date while `f` runs (it is still 0). The trace uses the register for the top frame.' },
      { t: 'From the VM’s `ip` register, looked up in `f`’s chunk as `lines[ip - 1]`', correct: true, why: '`f` is the running frame, so only the register knows where it is.' },
      { t: 'From the line of the call `f("hi")`', why: 'That is line 5, the one shown for `g`.' },
      { t: 'From the compiler, which stores each function’s first line', why: 'Each byte has its own line in `chunk.lines`; the trace looks up the running byte.' },
    ],
  },
  {
    q: 'How does a drip-rs native such as `len` get its arguments?',
    options: [
      { t: 'They are copied into a new `Vec` with `to_vec`', why: 'Nothing is copied: `call_native` reads them where they are.' },
      { t: 'It is pushed a `CallFrame` of its own', why: 'Natives run without a frame, straight from `call_value`.' },
      { t: 'Through a function pointer `fn(&[Value]) -> Value`', why: 'drip-rs uses an enum, `Native`, and matches on it in `call_native`.' },
      { t: '`call_native` reads them from the top of the stack, where they stay until it finishes', correct: true, why: 'So a collection the native causes cannot free them; one `truncate` drops them with the callee afterwards.' },
    ],
  },
];
