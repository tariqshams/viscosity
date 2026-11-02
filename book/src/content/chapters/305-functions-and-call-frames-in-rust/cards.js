// Chapter 305 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'fs-what': {
    q: 'What four fields does a drip-rs `CallFrame` have?',
    a: '`closure: Gc<ObjClosure>`, `chunk: Rc<Chunk>`, `ip: usize` and `slots: usize` (the stack index of the frame’s slot 0).',
  },
  'fs-rc': {
    q: 'Why does each drip-rs frame hold an `Rc<Chunk>` rather than a `&Chunk`?',
    a: 'A `&Chunk` would borrow the heap for as long as the frame lives. An `Rc` clone is the frame’s own pointer to the frozen chunk, and costs a count bump.',
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
    q: 'In `call`, why is `slots` `stack.len() - argc - 1`?',
    a: 'The frame’s slot 0 is the callee itself, just below its `argc` arguments.',
  },
  'fs-overflow': {
    q: 'What does drip-rs do when a call would make a 65th frame?',
    a: '`call` returns `Err(runtime_error("Stack overflow."))`, because `frames.len() == FRAMES_MAX` (64).',
  },
  'fs-pop-frame': {
    q: 'What does `pop_frame` return when the script’s own frame returns?',
    a: '`None`: there is no caller to load. The `Return` arm then pops the script’s closure and `run` returns `Ok(())`.',
  },
  'fs-native': {
    q: 'How does a drip-rs native function receive its arguments?',
    a: 'As a borrowed slice of the value stack, `&self.stack[start..]`. TypeScript copies them with `slice`.',
  },
  'fs-trace': {
    q: 'In `runtime_error`, why does the top frame use `self.ip` instead of `frame.ip`?',
    a: 'The running frame’s `ip` field is stale; only the register has its current position.',
  },
  'fs-roots': {
    q: 'What does the collector trace in each call frame?',
    a: 'Its closure handle. The `Rc<Chunk>` is Rust-owned memory and needs no tracing; the function reached through the closure keeps the chunk’s constants alive.',
  },
};

export const examples = {
  'rc-frames': {
    title: 'Frames sharing one chunk',
    lang: 'rust',
    code: `use std::rc::Rc;

struct Chunk {
    code: Vec<u8>,
}

struct Frame {
    chunk: Rc<Chunk>,
    ip: usize,
}

fn main() {
    // The function owns its chunk.
    let fib = Rc::new(Chunk {
        code: vec![7, 8, 9],
    });
    let mut frames: Vec<Frame> =
        Vec::with_capacity(64);
    // fib calls itself, three deep.
    for depth in 0..3 {
        frames.push(Frame {
            chunk: Rc::clone(&fib),
            ip: depth * 4,
        });
        println!(
            "{} frames, count {}",
            frames.len(),
            Rc::strong_count(&fib)
        );
    }
    // The register: one more owner.
    let top = &frames[2].chunk;
    let reg = Rc::clone(top);
    println!("byte {}", reg.code[1]);
    println!(
        "count {}",
        Rc::strong_count(&fib)
    );
    // Return: the frame moves out...
    let done = frames.pop().unwrap();
    println!("its ip was {}", done.ip);
    drop(done);
    // ...and its clone goes with it.
    println!(
        "count {}",
        Rc::strong_count(&fib)
    );
}`,
  },
};

const callStarter = `#[derive(Debug, PartialEq)]
struct Frame {
    func: usize,
    ip: usize,
    slots: usize,
}

struct Func {
    arity: usize,
}

const FRAMES_MAX: usize = 64;

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

const callTodo = `
    // Call funcs[func]. The callee and
    // its argc arguments are on top of
    // the stack.
    fn call(
        &mut self,
        func: usize,
        argc: usize,
    ) -> Result<(), String> {
        todo!()
    }

    // Return from the running frame.
    // false: there was no caller.
    fn ret(&mut self) -> bool {
        todo!()
    }
}`;

const callOk = `
    // Call funcs[func]. The callee and
    // its argc arguments are on top of
    // the stack.
    fn call(
        &mut self,
        func: usize,
        argc: usize,
    ) -> Result<(), String> {
        let f = &self.funcs[func];
        let arity = f.arity;
        if argc != arity {
            return Err(format!(
                "Expected {} arguments \\
                 but got {}.",
                arity, argc
            ));
        }
        let depth = self.frames.len();
        if depth == FRAMES_MAX {
            let m = "Stack overflow.";
            return Err(m.to_string());
        }
        // Save the caller's ip.
        let c = self.frames.last_mut();
        if let Some(c) = c {
            c.ip = self.ip;
        }
        let n = self.stack.len();
        let slots = n - argc - 1;
        self.frames.push(Frame {
            func,
            ip: 0,
            slots,
        });
        // Load the callee.
        self.ip = 0;
        self.slots = slots;
        Ok(())
    }
`;

const retOk = `
    // Return from the running frame.
    // false: there was no caller.
    fn ret(&mut self) -> bool {
        let r = self.pop();
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
        }
    }
}`;

const traceStarter = `use std::rc::Rc;

struct Frame {
    // "" for the top-level script
    name: &'static str,
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
    // "[line 2] in f()" or
    // "[line 5] in script".
    fn trace(&self, msg: &str)
        -> Vec<String> {
        todo!()
    }
}`;

export const exercises = {
  callReturn: {
    lang: 'rust',
    title: 'call and return',
    prompt: `This VM is a frame stack shaped like drip-rs's. \`frames\` is a \`Vec<Frame>\`, and the running frame's \`ip\` and \`slots\` are registers, fields of the \`Vm\`. Write:

1. \`call(func, argc)\`. The callee and its \`argc\` arguments are already on the stack. Check the arity (\`"Expected 2 arguments but got 1."\`) and the depth (\`"Stack overflow."\` when 64 frames already exist). Then save the register \`ip\` into the caller's frame, if there is a caller, push the new frame with \`ip: 0\` and \`slots\` at the callee's own slot, and load the registers.
2. \`ret()\`. Pop the result and the frame. Drop the frame's slots from the stack. If a caller is left, load its \`ip\` and \`slots\` into the registers, push the result and return \`true\`. If not, return \`false\`.

Don't change \`frames.last()\`'s \`ip\` while it runs: only \`call\` writes it.`,
    starter: callStarter + callTodo,
    solution: callStarter + callOk + retOk,
    tests: `fn vm() -> Vm {
    // 0: script, 1: add(a, b), 2: f()
    let fs = vec![
        Func { arity: 0 },
        Func { arity: 2 },
        Func { arity: 0 },
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
    vm.ip = 12;
    call_add(&mut vm);
    assert_eq!(vm.frames[0].ip, 12);
    let f = Frame { func: 1, ip: 0, slots: 1 };
    assert_eq!(vm.frames[1], f);
    assert_eq!((vm.ip, vm.slots), (0, 1));
}

#[test]
fn ret_restores_the_caller() {
    let mut vm = vm();
    vm.ip = 12;
    call_add(&mut vm);
    vm.ip = 6;
    vm.push(3.0); // the result
    assert!(vm.ret());
    assert_eq!(vm.stack, [0.0, 3.0]);
    assert_eq!((vm.ip, vm.slots), (12, 0));
    assert_eq!(vm.frames.len(), 1);
}

#[test]
fn the_last_return_ends_the_script() {
    let mut vm = vm();
    vm.push(0.0); // nil
    assert!(!vm.ret());
    assert!(vm.frames.is_empty());
    assert!(vm.stack.is_empty());
}

#[test]
fn the_arity_is_checked() {
    let mut vm = vm();
    vm.push(1.0);
    vm.push(5.0);
    let m = "Expected 2 arguments but got 1.";
    assert_eq!(vm.call(1, 1), Err(m.into()));
    assert_eq!(vm.frames.len(), 1);
}

#[test]
fn deep_recursion_overflows() {
    let mut vm = vm();
    for _ in 0..63 {
        vm.push(2.0);
        vm.call(2, 0).unwrap();
    }
    assert_eq!(vm.frames.len(), 64);
    vm.push(2.0);
    let m = "Stack overflow.";
    assert_eq!(vm.call(2, 0), Err(m.into()));
    assert_eq!(vm.frames.len(), 64);
}`,
    hints: [
      'In `call`, check arity, then depth, before changing anything, so a failed call leaves the frames as they were.',
      '`let c = self.frames.last_mut(); if let Some(c) = c { c.ip = self.ip; }` borrows `self.frames` and reads `self.ip`: two different fields, so it compiles.',
      'The callee sits just below its arguments, so its slot is `stack.len() - argc - 1`.',
      'In `ret`, truncate the stack to the popped frame’s `slots` before pushing the result, or the result is cut off with the callee’s slots.',
    ],
    walkthrough: `\`call\` does drip-rs's three steps in order.

**Check.** Arity first, then depth, and return before touching anything. In drip-rs these become runtime errors with a stack trace; here they are strings.

**Save.** \`self.frames.last_mut()\` is the caller, if there is one. Its \`ip\` field has been stale the whole time it ran, because the loop advanced the register instead. Now it is about to pause, so the register is written into it. The borrow checker allows \`c.ip = self.ip\` because \`c\` borrows only \`self.frames\`.

**Push and load.** The new frame starts at \`ip: 0\`. Its \`slots\` is the index of the callee, \`len - argc - 1\`, so argument 1 is at \`slots + 1\`, as \`GetLocal 1\` expects. Then the registers get the callee's values. That is why drip-rs's \`Call\` arm needs no \`reload()\`.

\`ret\` is the mirror image. Pop the result, then pop the frame by value. \`truncate(f.slots)\` drops the callee, its arguments and its locals at once. Then \`self.frames.last()\` is the caller: copy its saved \`ip\` and \`slots\` into the registers and push the result where the callee used to be. With no caller, the script has ended, which drip-rs's \`pop_frame\` reports as \`None\`.`,
    wrong: [
      {
        code: callStarter + `
    fn call(
        &mut self,
        func: usize,
        argc: usize,
    ) -> Result<(), String> {
        let f = &self.funcs[func];
        let arity = f.arity;
        if argc != arity {
            return Err(format!(
                "Expected {} arguments \\
                 but got {}.",
                arity, argc
            ));
        }
        let depth = self.frames.len();
        if depth == FRAMES_MAX {
            let m = "Stack overflow.";
            return Err(m.to_string());
        }
        let n = self.stack.len();
        let slots = n - argc - 1;
        self.frames.push(Frame {
            func,
            ip: 0,
            slots,
        });
        self.ip = 0;
        self.slots = slots;
        Ok(())
    }
` + retOk,
        why: 'This is the TypeScript habit: there, the frame object is updated as the loop runs. Here the caller’s `ip` lives only in the register, which `call` overwrites, so returning jumps to a stale position.',
      },
      {
        code: callStarter + callOk.replace('let slots = n - argc - 1;', 'let slots = n - argc;') + retOk,
        why: '`slots` must point at the callee, one below the first argument. Off by one, every `GetLocal` reads the wrong slot and `ret` leaves the callee on the stack.',
      },
      {
        code: callStarter + callOk + `
    fn ret(&mut self) -> bool {
        let r = self.pop();
        let top = self.frames.pop();
        let f = top.expect("a frame");
        match self.frames.last() {
            None => false,
            Some(c) => {
                self.ip = c.ip;
                self.slots = c.slots;
                self.stack.push(r);
                let s = f.slots;
                self.stack.truncate(s);
                true
            }
        }
    }
}`,
        why: 'Truncating after pushing cuts the result off too, and on the last return the script’s slots are never dropped.',
      },
    ],
  },
  stackTrace: {
    lang: 'rust',
    optional: true,
    title: 'A stack trace from stale frames',
    prompt: `Write \`trace\`, the stack-trace half of drip-rs's \`runtime_error\`. Return the message, then one line per frame, innermost first: \`"[line N] in name()"\`, or \`"[line N] in script"\` when the name is empty.

The line is \`lines[ip - 1]\`, because \`ip\` is already past the failing instruction. For every paused frame, \`ip\` is the frame's own field. For the top frame, that field is stale: use the register \`self.ip\`.`,
    starter: traceStarter,
    solution: traceStarter.replace('        todo!()', `        let mut out = Vec::new();
        out.push(msg.to_string());
        let top = self.frames.len()
            .saturating_sub(1);
        let fs = self.frames.iter();
        let fs = fs.enumerate().rev();
        for (d, f) in fs {
            let ip = if d == top {
                self.ip
            } else {
                f.ip
            };
            let line = f.lines[ip - 1];
            let p = if f.name == "" {
                "script".to_string()
            } else {
                format!("{}()", f.name)
            };
            out.push(format!(
                "[line {}] in {}",
                line, p
            ));
        }
        out`),
    tests: `// fn f() {
//   return -nil;
// }
// fn g() { f(); }
// g();
fn vm() -> Vm {
    let script = Rc::new(vec![5, 5, 5]);
    let g = Rc::new(vec![4, 4, 4, 4]);
    let f = Rc::new(vec![2, 2, 2]);
    Vm {
        frames: vec![
            Frame { name: "", lines: script,
                ip: 3 },
            Frame { name: "g", lines: g,
                ip: 4 },
            // stale: never written yet
            Frame { name: "f", lines: f,
                ip: 0 },
        ],
        ip: 3,
    }
}

#[test]
fn innermost_frame_first() {
    let m = "Operand must be a number.";
    let t = vm().trace(m);
    assert_eq!(t, [
        "Operand must be a number.",
        "[line 2] in f()",
        "[line 4] in g()",
        "[line 5] in script",
    ]);
}

#[test]
fn the_top_frame_uses_the_register() {
    let mut vm = vm();
    vm.frames[2].lines =
        Rc::new(vec![1, 2, 9]);
    let t = vm.trace("x");
    assert_eq!(t[1], "[line 9] in f()");
}

#[test]
fn a_lone_script() {
    let lines = Rc::new(vec![1, 7]);
    let vm = Vm {
        frames: vec![Frame {
            name: "", lines, ip: 0,
        }],
        ip: 2,
    };
    assert_eq!(vm.trace("boom"),
        ["boom", "[line 7] in script"]);
}`,
    hints: [
      '`self.frames.iter().enumerate().rev()` gives `(depth, frame)` pairs, innermost first.',
      'The top frame is at depth `frames.len() - 1`. Compare each depth with it to choose between `self.ip` and `f.ip`.',
    ],
    walkthrough: `The order comes from \`.rev()\`: frames are stored outermost first, but a trace reads from the error outwards.

The interesting line is the choice of \`ip\`. Every paused frame had its \`ip\` written by \`call\` at the moment it called the next frame, so that field is exact. The top frame has never called anything since it started (or since its last call returned), so its field is out of date. In the test, the stale \`f\` frame says \`ip: 0\`, and \`lines[0 - 1]\` would even underflow. The register says 3, the position just past \`NEGATE\`, which is on line 2.

drip-rs writes \`saturating_sub(1)\` for the top index so that an empty frame list doesn't underflow. In drip-rs that can't happen during a run, but the guard costs nothing.`,
    wrong: [
      {
        code: traceStarter.replace('        todo!()', `        let mut out = Vec::new();
        out.push(msg.to_string());
        let fs = self.frames.iter();
        for f in fs.rev() {
            let ip = f.ip;
            let line = f.lines[ip - 1];
            let p = if f.name == "" {
                "script".to_string()
            } else {
                format!("{}()", f.name)
            };
            out.push(format!(
                "[line {}] in {}",
                line, p
            ));
        }
        out`),
        why: 'The top frame’s `ip` field is stale. Here it is 0, so `f.ip - 1` underflows and the test panics; in general it names the wrong line.',
      },
      {
        code: traceStarter.replace('        todo!()', `        let mut out = Vec::new();
        out.push(msg.to_string());
        let top = self.frames.len() - 1;
        let fs = self.frames.iter();
        for (d, f) in fs.enumerate() {
            let ip = if d == top {
                self.ip
            } else {
                f.ip
            };
            let line = f.lines[ip - 1];
            let p = if f.name == "" {
                "script".to_string()
            } else {
                format!("{}()", f.name)
            };
            out.push(format!(
                "[line {}] in {}",
                line, p
            ));
        }
        out`),
        why: 'Without `.rev()` the script comes first. drip-rs, clox and the TypeScript VM all print the innermost call first.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why can’t drip-rs’s loop keep `let frame = self.frames.last_mut().unwrap();` across a call, as the TypeScript loop keeps `frame`?',
    options: [
      { t: 'Because `CallFrame` isn’t `Copy`', why: '`last_mut` returns a reference; nothing is copied or moved.' },
      { t: 'Because `call` needs `&mut self`, and `frame` is still a live mutable borrow into `self.frames`: E0499', correct: true, why: 'And the check is not fussiness: pushing a frame can reallocate the `Vec` and move the frame `frame` points to.' },
      { t: 'Because frames live in the heap’s arena', why: 'Frames are in the VM’s own `Vec`, not the object heap.' },
      { t: 'It can; drip-rs just chose registers for speed', why: 'rustc rejects it. Registers are also faster (chapter 297), but the borrow error comes first.' },
    ],
  },
  {
    q: 'The script runs `add(1, 2)` with its register `ip` at 12. Right after `call` returns `Ok`, what is true?',
    options: [
      { t: 'The script frame’s `ip` is 12, and the register `ip` is 0', correct: true, why: '`call` saved 12 into the caller, then loaded the callee’s `ip`.' },
      { t: 'Both are 12', why: 'The register now belongs to `add`, which starts at byte 0.' },
      { t: 'The script frame’s `ip` is still 0', why: 'That was true while the script ran. `call` writes it before pushing the callee.' },
      { t: 'The script frame was removed from `frames` while `add` runs', why: 'Frames stay in the `Vec` until they return; `add` is pushed on top.' },
    ],
  },
  {
    q: 'What does `pop_frame` returning `None` mean?',
    options: [
      { t: 'A runtime error happened', why: 'Errors travel as `Err(RuntimeError)`, not through `pop_frame`.' },
      { t: 'The frame `Vec` was already empty', why: 'It pops a frame first, with `expect`. `None` is about what is left after.' },
      { t: 'The frame that returned was a native', why: 'Natives never get a frame: `call_value` runs them directly.' },
      { t: 'The frame that just returned had no caller, so the script is finished', correct: true, why: 'The `Return` arm then pops the script’s closure and leaves `run` with `Ok(())`.' },
    ],
  },
  {
    q: 'How many `Rc` clones of `fib`’s chunk exist while `fib` is three calls deep and running?',
    options: [
      { t: 'One: an `Rc` is shared, not cloned', why: '`Rc::clone` makes another owner each time and increments the count.' },
      { t: 'Three: one per frame', why: 'Close, but the running frame’s chunk is also in the VM’s `chunk` register.' },
      { t: 'Five: one in the function object, three in the frames, one in the register', correct: true, why: 'The function owns the original; each frame and the register hold clones. The bytes exist once.' },
      { t: 'None: frames hold a `Gc<ObjFunction>`', why: 'They hold the closure’s handle and an `Rc<Chunk>`.' },
    ],
  },
  {
    q: 'A native function gets its arguments how?',
    options: [
      { t: 'As `&self.stack[start..]`, a borrowed slice of the value stack', correct: true, why: '`NativeFn` is `fn(&[Value]) -> Value`. Nothing is copied.' },
      { t: 'As a new `Vec<Value>` copied from the stack', why: 'That is what the TypeScript VM’s `slice` does. drip-rs borrows.' },
      { t: 'In a new call frame, like a closure', why: 'Natives don’t get frames.' },
      { t: 'Through the `globals` table', why: 'Globals hold the native itself, not its arguments.' },
    ],
  },
  {
    q: 'Why does `runtime_error` use `self.ip` for the innermost frame?',
    options: [
      { t: 'The innermost frame has no `ip` field', why: 'Every `CallFrame` has one.' },
      { t: 'Because that frame’s `ip` field is stale: only `call` writes it, and the running frame hasn’t called anything', correct: true, why: 'Paused frames have exact saved values; the running one is only in the register.' },
      { t: 'To skip a bounds check', why: 'It’s about correctness, not speed.' },
      { t: 'Because frames are stored innermost first', why: 'They are stored outermost first; the loop uses `.rev()`.' },
    ],
  },
];
