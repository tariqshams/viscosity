// Chapter 346 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'uh-handle': {
    q: 'What does a drip-rs closure store for each captured variable?',
    a: 'A `Gc<ObjUpvalue>`, a handle into the heap’s upvalue arena. Never the value itself.',
  },
  'uh-enum': {
    q: 'What are the two variants of drip-rs’s `ObjUpvalue`, and what does each hold?',
    a: '`Open(usize)`, the stack slot of a variable still on the stack, and `Closed(Value)`, the variable itself once its scope has ended.',
  },
  'uh-two-lookups': {
    q: 'How many heap lookups does drip-rs’s `LoadUpvalue` arm make?',
    a: 'Two: `heap[closure].upvalues[index]` for the handle, then `heap[upvalue]` for the upvalue. Then a stack read if it is `Open`.',
  },
  'uh-sorted': {
    q: 'How is drip-rs’s `open_upvalues` ordered, and why that way?',
    a: 'By stack slot, lowest first, so its end matches the top of the stack: capture searches from the end and close pops from the end.',
  },
  'uh-share': {
    q: 'Why does `capture_upvalue` look for an existing upvalue before making one?',
    a: 'So that closures capturing the same variable share one upvalue and see each other’s writes.',
  },
  'uh-close': {
    q: 'What does closing an upvalue do to the heap in drip-rs?',
    a: '`self.heap[upvalue] = ObjUpvalue::Closed(self.stack[slot])`: the object in the same arena slot is overwritten, so the handle stays valid and every closure holding it sees the variable.',
  },
  'uh-order': {
    q: 'In what order does drip-rs build a closure, and how does TypeScript differ?',
    a: 'drip-rs captures every upvalue into a local `Vec`, then allocates the closure. TypeScript allocates the closure, pushes it, then fills in its upvalues.',
  },
  'uh-safe': {
    q: 'Why can the local `upvalues` Vec in `Vm::closure` go unrooted while `alloc` might collect?',
    a: 'Each handle in it is also in `open_upvalues` (a root) or in the enclosing closure, which the running frame keeps alive.',
  },
};

export const examples = {
  shared: {
    lang: 'drip-vm',
    title: 'Two closures, one handle',
    code: `fn make_pair() {
  let n = 0;
  fn inc() { n += 1; }
  fn get() { return n; }
  return [inc, get];
}
let p = make_pair();
let inc = p[0];
let get = p[1];
inc();
inc();
print get();`,
  },
};

export const exercises = {
  captureClose: {
    lang: 'rust',
    title: 'capture and close',
    prompt: `Here is drip-rs's upvalue machinery in miniature. \`ups\` is the upvalue arena, so a handle is a \`usize\` index into it. \`open\` holds the handles of the open upvalues, sorted by slot, lowest first. Write:

1. \`capture(slot)\`. Search \`open\` from the end. If an upvalue for \`slot\` exists, return its handle, so closures share it. Stop as soon as you pass below \`slot\`. Otherwise push \`Up::Open(slot)\` onto \`ups\` and insert its handle into \`open\` where it keeps the order.
2. \`close(last)\`. While the last open upvalue's slot is \`>= last\`, overwrite it in the arena with \`Up::Closed\` of the stack value, and pop it from \`open\`.`,
    starter: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Up {
    Open(usize),
    Closed(f64),
}

struct Vm {
    stack: Vec<f64>,
    // The upvalue arena: a handle is
    // an index into it.
    ups: Vec<Up>,
    // Open handles, sorted by slot,
    // lowest first.
    open: Vec<usize>,
}

impl Vm {
    fn new(stack: Vec<f64>) -> Vm {
        Vm {
            stack,
            ups: Vec::new(),
            open: Vec::new(),
        }
    }

    // The slot of an open upvalue.
    fn slot(&self, h: usize) -> usize {
        match self.ups[h] {
            Up::Open(s) => s,
            _ => unreachable!(),
        }
    }

    // The open upvalue for slot: the
    // existing one, if there is one.
    fn capture(
        &mut self,
        slot: usize,
    ) -> usize {
        todo!()
    }

    // Close every open upvalue at or
    // above stack slot last.
    fn close(&mut self, last: usize) {
        todo!()
    }
}`,
    solution: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Up {
    Open(usize),
    Closed(f64),
}

struct Vm {
    stack: Vec<f64>,
    // The upvalue arena: a handle is
    // an index into it.
    ups: Vec<Up>,
    // Open handles, sorted by slot,
    // lowest first.
    open: Vec<usize>,
}

impl Vm {
    fn new(stack: Vec<f64>) -> Vm {
        Vm {
            stack,
            ups: Vec::new(),
            open: Vec::new(),
        }
    }

    // The slot of an open upvalue.
    fn slot(&self, h: usize) -> usize {
        match self.ups[h] {
            Up::Open(s) => s,
            _ => unreachable!(),
        }
    }

    // The open upvalue for slot: the
    // existing one, if there is one.
    fn capture(
        &mut self,
        slot: usize,
    ) -> usize {
        let mut i = self.open.len();
        while i > 0 {
            let h = self.open[i - 1];
            let s = self.slot(h);
            if s == slot {
                return h;
            }
            if s < slot {
                break;
            }
            i -= 1;
        }
        self.ups.push(Up::Open(slot));
        let h = self.ups.len() - 1;
        self.open.insert(i, h);
        h
    }

    // Close every open upvalue at or
    // above stack slot last.
    fn close(&mut self, last: usize) {
        while let Some(&h) =
            self.open.last()
        {
            let s = self.slot(h);
            if s < last {
                break;
            }
            let v = self.stack[s];
            self.ups[h] = Up::Closed(v);
            self.open.pop();
        }
    }
}`,
    tests: `fn vm() -> Vm {
    let s = vec![0.0, 10.0, 20.0, 30.0];
    Vm::new(s)
}

fn slots(vm: &Vm) -> Vec<usize> {
    let hs = vm.open.iter();
    hs.map(|&h| vm.slot(h)).collect()
}

#[test]
fn capturing_a_slot_twice_shares() {
    let mut vm = vm();
    let a = vm.capture(2);
    let b = vm.capture(2);
    assert_eq!(a, b);
    assert_eq!(vm.ups.len(), 1);
}

#[test]
fn the_open_list_stays_sorted() {
    let mut vm = vm();
    for s in [3, 1, 2, 0] {
        vm.capture(s);
    }
    assert_eq!(slots(&vm), [0, 1, 2, 3]);
}

#[test]
fn sharing_works_in_the_middle() {
    let mut vm = vm();
    vm.capture(1);
    let a = vm.capture(2);
    vm.capture(3);
    assert_eq!(vm.capture(2), a);
    assert_eq!(vm.ups.len(), 3);
}

#[test]
fn close_copies_the_values() {
    let mut vm = vm();
    let low = vm.capture(1);
    let high = vm.capture(3);
    vm.close(2);
    assert_eq!(vm.ups[high], Up::Closed(30.0));
    assert_eq!(vm.ups[low], Up::Open(1));
    assert_eq!(slots(&vm), [1]);
}

#[test]
fn close_includes_the_last_slot() {
    let mut vm = vm();
    let h = vm.capture(2);
    vm.close(2);
    assert_eq!(vm.ups[h], Up::Closed(20.0));
    assert!(vm.open.is_empty());
}

#[test]
fn a_capture_after_closing_is_new() {
    let mut vm = vm();
    let a = vm.capture(2);
    vm.close(2);
    let b = vm.capture(2);
    assert_ne!(a, b);
    assert_eq!(vm.ups[b], Up::Open(2));
}`,
    hints: [
      'Start with `capture`. The list is sorted lowest first, so the upvalues nearest the top of the stack are at the end: walk an index `i` down from `self.open.len()` and look at `self.open[i - 1]`.',
      'Three cases for the handle you look at: its slot equals `slot` (return it: that is the sharing), it is below `slot` (stop: `i` is where a new handle belongs), or it is above (keep going with `i -= 1`).',
      'A new upvalue is `self.ups.push(Up::Open(slot));`, its handle `self.ups.len() - 1`, inserted with `self.open.insert(i, h)`. For `close`, loop `while let Some(&h) = self.open.last()`, break when `self.slot(h) < last`, else copy `self.stack[s]` into a local, write `self.ups[h] = Up::Closed(v)` and pop.',
    ],
    walkthrough: `**How to think about it.** Two questions decide everything here. First, *where is the variable?* An upvalue is either still pointing at a stack slot (\`Open\`) or holding the value itself (\`Closed\`). Second, *who else is looking at it?* Closures over the same variable must share one upvalue, so \`capture\` must find an existing one before it makes another. The sorted \`open\` list answers both quickly: the upvalues nearest the top of the stack are at its end, which is where both \`capture\` (new closures capture recent variables) and \`close\` (scopes end at the top) look.

**\`capture\`, line by line.**

- \`let mut i = self.open.len();\` starts just past the end of the list.
- \`while i > 0 {\` walks down while there is something to look at.
- \`let h = self.open[i - 1];\` and \`let s = self.slot(h);\` read the handle and the slot it points at.
- \`if s == slot { return h; }\` is the sharing: an upvalue for this slot exists, so hand back the same handle. In the test \`capturing_a_slot_twice_shares\`, the second call returns the first handle and the arena still has one upvalue.
- \`if s < slot { break; }\` stops as soon as we pass below the slot we want: everything further down is lower still, so there is no match, and \`i\` is exactly where a new handle keeps the order.
- \`i -= 1;\` moves on to the next one down.
- \`self.ups.push(Up::Open(slot));\` allocates the new upvalue in the arena, and \`let h = self.ups.len() - 1;\` is its handle.
- \`self.open.insert(i, h);\` puts the handle where it keeps the list sorted, and \`h\` is returned.

**\`close\`, line by line.**

- \`while let Some(&h) = self.open.last() {\` looks at the highest open upvalue, as long as there is one.
- \`let s = self.slot(h);\` and \`if s < last { break; }\` stop at the first upvalue below the scope being closed. Note \`<\`: the slot \`last\` itself is going away too, so it must be closed.
- \`let v = self.stack[s];\` copies the variable's current value out of the stack. Doing it in its own line keeps the read of \`self.stack\` apart from the write to \`self.ups\`.
- \`self.ups[h] = Up::Closed(v);\` overwrites the object in its arena slot. The handle \`h\` is unchanged, so every closure holding it now sees the closed value.
- \`self.open.pop();\` removes the handle from the open list.

**Common wrong attempts.**

- Allocating a new upvalue every time, without searching: two closures over one variable then get different upvalues, and after closing, a write through one is invisible to the other.
- Breaking on \`s <= last\` in \`close\`: the upvalue for slot \`last\` is left open, pointing at a slot that is about to be popped.
- Pushing new handles at the end instead of inserting: a lower slot captured later breaks the order, and \`close\` stops at the wrong place.`,
    wrong: [
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Up {
    Open(usize),
    Closed(f64),
}

struct Vm {
    stack: Vec<f64>,
    // The upvalue arena: a handle is
    // an index into it.
    ups: Vec<Up>,
    // Open handles, sorted by slot,
    // lowest first.
    open: Vec<usize>,
}

impl Vm {
    fn new(stack: Vec<f64>) -> Vm {
        Vm {
            stack,
            ups: Vec::new(),
            open: Vec::new(),
        }
    }

    // The slot of an open upvalue.
    fn slot(&self, h: usize) -> usize {
        match self.ups[h] {
            Up::Open(s) => s,
            _ => unreachable!(),
        }
    }

    fn capture(
        &mut self,
        slot: usize,
    ) -> usize {
        self.ups.push(Up::Open(slot));
        let h = self.ups.len() - 1;
        let mut i = self.open.len();
        while i > 0 {
            let s = self.slot(
                self.open[i - 1]);
            if s < slot {
                break;
            }
            i -= 1;
        }
        self.open.insert(i, h);
        h
    }

    // Close every open upvalue at or
    // above stack slot last.
    fn close(&mut self, last: usize) {
        while let Some(&h) =
            self.open.last()
        {
            let s = self.slot(h);
            if s < last {
                break;
            }
            let v = self.stack[s];
            self.ups[h] = Up::Closed(v);
            self.open.pop();
        }
    }
}`,
        why: 'This makes a new upvalue every time. Two closures over the same variable get different upvalues, so a write through one is invisible to the other once they close.',
      },
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Up {
    Open(usize),
    Closed(f64),
}

struct Vm {
    stack: Vec<f64>,
    // The upvalue arena: a handle is
    // an index into it.
    ups: Vec<Up>,
    // Open handles, sorted by slot,
    // lowest first.
    open: Vec<usize>,
}

impl Vm {
    fn new(stack: Vec<f64>) -> Vm {
        Vm {
            stack,
            ups: Vec::new(),
            open: Vec::new(),
        }
    }

    // The slot of an open upvalue.
    fn slot(&self, h: usize) -> usize {
        match self.ups[h] {
            Up::Open(s) => s,
            _ => unreachable!(),
        }
    }

    // The open upvalue for slot: the
    // existing one, if there is one.
    fn capture(
        &mut self,
        slot: usize,
    ) -> usize {
        let mut i = self.open.len();
        while i > 0 {
            let h = self.open[i - 1];
            let s = self.slot(h);
            if s == slot {
                return h;
            }
            if s < slot {
                break;
            }
            i -= 1;
        }
        self.ups.push(Up::Open(slot));
        let h = self.ups.len() - 1;
        self.open.insert(i, h);
        h
    }

    fn close(&mut self, last: usize) {
        while let Some(&h) =
            self.open.last()
        {
            let s = self.slot(h);
            if s <= last {
                break;
            }
            let v = self.stack[s];
            self.ups[h] = Up::Closed(v);
            self.open.pop();
        }
    }
}`,
        why: 'The slot at `last` goes away too: `Return` closes from the frame’s base, and `CloseUpvalue` from the slot being popped. Leaving it open leaves a handle pointing at a dead slot.',
      },
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Up {
    Open(usize),
    Closed(f64),
}

struct Vm {
    stack: Vec<f64>,
    // The upvalue arena: a handle is
    // an index into it.
    ups: Vec<Up>,
    // Open handles, sorted by slot,
    // lowest first.
    open: Vec<usize>,
}

impl Vm {
    fn new(stack: Vec<f64>) -> Vm {
        Vm {
            stack,
            ups: Vec::new(),
            open: Vec::new(),
        }
    }

    // The slot of an open upvalue.
    fn slot(&self, h: usize) -> usize {
        match self.ups[h] {
            Up::Open(s) => s,
            _ => unreachable!(),
        }
    }

    fn capture(
        &mut self,
        slot: usize,
    ) -> usize {
        for &h in &self.open {
            if self.slot(h) == slot {
                return h;
            }
        }
        self.ups.push(Up::Open(slot));
        let h = self.ups.len() - 1;
        self.open.push(h);
        h
    }

    // Close every open upvalue at or
    // above stack slot last.
    fn close(&mut self, last: usize) {
        while let Some(&h) =
            self.open.last()
        {
            let s = self.slot(h);
            if s < last {
                break;
            }
            let v = self.stack[s];
            self.ups[h] = Up::Closed(v);
            self.open.pop();
        }
    }
}`,
        why: 'Pushing at the end breaks the order when a lower slot is captured later, and then `close` stops at the wrong place.',
      },
    ],
  },
  readWrite: {
    lang: 'rust',
    optional: true,
    title: 'Reading and writing through a handle',
    prompt: 'Write the heart of `LoadUpvalue` and `StoreUpvalue`. `get(h)` reads the variable behind handle `h`: from the stack if the upvalue is `Open`, from the upvalue itself if it is `Closed`. `set(h, v)` writes it in the same place. An open upvalue must stay open after `set`.',
    starter: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Up {
    Open(usize),
    Closed(f64),
}

struct Vm {
    stack: Vec<f64>,
    ups: Vec<Up>,
}

impl Vm {
    // LoadUpvalue: read the variable.
    fn get(&self, h: usize) -> f64 {
        todo!()
    }

    // StoreUpvalue: write the variable.
    fn set(
        &mut self,
        h: usize,
        v: f64,
    ) {
        todo!()
    }
}`,
    solution: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Up {
    Open(usize),
    Closed(f64),
}

struct Vm {
    stack: Vec<f64>,
    ups: Vec<Up>,
}

impl Vm {
    // LoadUpvalue: read the variable.
    fn get(&self, h: usize) -> f64 {
        match self.ups[h] {
            Up::Open(s) => {
                self.stack[s]
            }
            Up::Closed(v) => v,
        }
    }

    // StoreUpvalue: write the variable.
    fn set(
        &mut self,
        h: usize,
        v: f64,
    ) {
        match &mut self.ups[h] {
            Up::Open(s) => {
                self.stack[*s] = v
            }
            Up::Closed(c) => *c = v,
        }
    }
}`,
    tests: `fn vm() -> Vm {
    Vm {
        stack: vec![0.0, 7.0],
        ups: vec![
            Up::Open(1),
            Up::Closed(3.0),
        ],
    }
}

#[test]
fn reads_an_open_upvalue_from_the_stack() {
    assert_eq!(vm().get(0), 7.0);
}

#[test]
fn reads_a_closed_upvalue_from_itself() {
    assert_eq!(vm().get(1), 3.0);
}

#[test]
fn writing_an_open_one_writes_the_stack() {
    let mut vm = vm();
    vm.set(0, 8.0);
    assert_eq!(vm.stack[1], 8.0);
    assert_eq!(vm.ups[0], Up::Open(1));
}

#[test]
fn writing_a_closed_one_stays_in_it() {
    let mut vm = vm();
    vm.set(1, 4.0);
    assert_eq!(vm.ups[1], Up::Closed(4.0));
    assert_eq!(vm.stack, [0.0, 7.0]);
}`,
    hints: [
      'Each function is one `match` on the upvalue with two arms, one per variant.',
      '`get` can `match self.ups[h]` by value, because `Up` is `Copy`: `Open(s)` gives `self.stack[s]`, `Closed(v)` gives `v`.',
      'For `set`, match on `&mut self.ups[h]`, so the `Closed` arm gets a `&mut f64` to write through (`*c = v`). Writing `self.stack[*s] = v` in the other arm is allowed: `ups` and `stack` are different fields.',
    ],
    walkthrough: `**How to think about it.** An upvalue is a signpost to a variable. Reading or writing through it means first asking which kind of signpost it is: \`Open\` points at a stack slot, so the variable is there; \`Closed\` holds the variable inside itself. Both operations are one \`match\` with two arms, and the only Rust question is how to get write access in \`set\`.

**\`get\`, line by line.**

- \`match self.ups[h] {\` copies the upvalue out (it is \`Copy\`) and looks at its variant.
- \`Up::Open(s) => { self.stack[s] }\` reads the variable from its stack slot.
- \`Up::Closed(v) => v,\` returns the value the upvalue holds.

**\`set\`, line by line.**

- \`match &mut self.ups[h] {\` matches on a mutable reference to the upvalue in the arena, so each arm's bindings are references into it.
- \`Up::Open(s) => { self.stack[*s] = v }\` writes the stack slot. \`s\` is a \`&mut usize\`, hence \`*s\`. Borrowing \`self.stack\` while \`self.ups[h]\` is borrowed is fine, because they are different fields of \`self\`; the upvalue stays \`Open\`.
- \`Up::Closed(c) => *c = v,\` writes through \`c\`, a \`&mut f64\` into the \`Closed\` variant itself.

This is exactly the shape of drip-rs's \`StoreUpvalue\` arm, which matches on \`&mut self.heap[upvalue]\`.

**Common wrong attempts.**

- \`self.ups[h] = Up::Closed(v);\` for every write: it closes an open upvalue early. The variable's own stack slot keeps the old value, so the function that owns the variable, which reads it with \`load.local\`, never sees the write.
- Matching \`self.ups[h]\` by value in \`set\`: the arms then bind copies, and writing to a copy changes nothing in the arena.`,
    wrong: [
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Up {
    Open(usize),
    Closed(f64),
}

struct Vm {
    stack: Vec<f64>,
    ups: Vec<Up>,
}

impl Vm {
    // LoadUpvalue: read the variable.
    fn get(&self, h: usize) -> f64 {
        match self.ups[h] {
            Up::Open(s) => {
                self.stack[s]
            }
            Up::Closed(v) => v,
        }
    }

    // StoreUpvalue: write the variable.
    fn set(
        &mut self,
        h: usize,
        v: f64,
    ) {
        self.ups[h] = Up::Closed(v);
    }
}`,
        why: 'This closes an open upvalue early. The local’s own stack slot keeps the old value, so the function that owns the variable doesn’t see the write.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Two closures made in the same call both capture `n`. How many `ObjUpvalue`s are there for `n`?',
    options: [
      {
        t: 'Two, one per closure',
        why: '`capture_upvalue` finds the existing open upvalue for that slot and returns its handle.',
      },
      {
        t: 'One, and both closures hold its handle',
        correct: true,
        why: 'That is why a write through one closure is seen by the other, before and after closing.',
      },
      {
        t: 'None until the frame returns',
        why: 'The upvalue is made when the first closure is created, as `Open(slot)`.',
      },
      {
        t: 'One per call of either closure',
        why: 'Calling a closure makes no upvalues; they are made when the closure is created.',
      },
    ],
  },
  {
    q: 'After `close_upvalues` closes an upvalue, what has changed for the closures that hold it?',
    options: [
      {
        t: 'Their handles are updated to point at a new object',
        why: 'The handles never change; that is the point of overwriting in place.',
      },
      {
        t: 'They must be re-created',
        why: 'Nothing is re-created: the same closures go on working.',
      },
      {
        t: 'Nothing in the closures: the object in the same arena slot is now `Closed(value)`',
        correct: true,
        why: '`self.heap[upvalue] = ObjUpvalue::Closed(self.stack[slot])` replaces the object behind the unchanged handle.',
      },
      {
        t: 'They lose access to the variable',
        why: 'They now read it from the upvalue itself instead of the stack.',
      },
    ],
  },
  {
    q: 'The open list holds upvalues for slots `[1, 4, 6]`. Which does `close_upvalues(4)` close?',
    options: [
      {
        t: 'Only 6',
        why: 'The test is `slot < last` to stop, so slot 4 itself is closed too.',
      },
      {
        t: '1, 4 and 6',
        why: 'It stops at the first slot below 4.',
      },
      {
        t: 'Only 4',
        why: 'It starts from the end of the list, at 6.',
      },
      {
        t: '4 and 6, leaving `[1]`',
        correct: true,
        why: 'Everything at or above `last` is going away, and the list is sorted, so it pops from the end until a lower slot.',
      },
    ],
  },
  {
    q: 'Why does `Vm::closure` capture every upvalue before allocating the `ObjClosure`?',
    options: [
      {
        t: 'Holding a `&mut` to a new closure while calling `capture_upvalue`, which needs `&mut self`, is error E0499',
        correct: true,
        why: 'So drip-rs builds the list in a local `Vec` first, then allocates the closure with it.',
      },
      {
        t: 'Allocating first would be slower',
        why: 'The order is forced by the borrow checker, not chosen for speed.',
      },
      {
        t: 'The TypeScript VM does it in the same order',
        why: 'TypeScript allocates the closure first and fills in its upvalues afterwards.',
      },
      {
        t: 'Upvalues must be allocated before closures in the arena',
        why: 'Each kind of object has its own arena, so there is no such rule.',
      },
    ],
  },
  {
    q: 'Why is the local `upvalues` `Vec` in `Vm::closure` safe from a collection that `alloc` might run?',
    options: [
      {
        t: 'The collector does not run during `Closure`',
        why: 'It may: `alloc` asks `should_collect()` first, and stress mode always says yes.',
      },
      {
        t: 'Local variables are always roots in Rust',
        why: 'The collector only sees what it is given; a local `Vec` is invisible to it.',
      },
      {
        t: 'Every handle in it is also in `open_upvalues` (a root) or in the enclosing closure, which the running frame keeps alive',
        correct: true,
        why: 'That is the argument in the comment in `vm.rs`.',
      },
      {
        t: 'Upvalues are never collected',
        why: 'They are, once no closure and no open list refers to them.',
      },
    ],
  },
];
