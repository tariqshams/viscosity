// Chapter 246 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'uh-handle': {
    q: 'What does a drip-rs closure store for each captured variable?',
    a: 'A `Gc<ObjUpvalue>`, a handle into the heap’s upvalue arena. Never the value itself.',
  },
  'uh-enum': {
    q: 'What are the two variants of drip-rs’s `ObjUpvalue`, and what does each hold?',
    a: '`Open(usize)`, the stack slot of a variable still on the stack, and `Closed(Value)`, the variable itself after its frame returned.',
  },
  'uh-two-lookups': {
    q: 'How many heap lookups does `GetUpvalue` make in drip-rs?',
    a: 'Two: `heap[closure].upvalues[i]` for the handle, then `heap[up]` for the upvalue. Then a stack read if it’s `Open`.',
  },
  'uh-sorted': {
    q: 'How is drip-rs’s `open_upvalues` ordered, and why that way?',
    a: 'By stack slot, lowest first, so its end matches the top of the stack: closing pops from the end.',
  },
  'uh-share': {
    q: 'Why does `capture_upvalue` look for an existing upvalue before making one?',
    a: 'So that closures capturing the same variable share one upvalue and see each other’s writes.',
  },
  'uh-close': {
    q: 'What does closing an upvalue do to the heap in drip-rs?',
    a: '`heap[up] = ObjUpvalue::Closed(stack[slot])`: the object in the same arena slot is overwritten, so the handle stays valid.',
  },
  'uh-order': {
    q: 'In what order does drip-rs build a closure, and how does TypeScript differ?',
    a: 'drip-rs captures every upvalue into a local `Vec`, then allocates the closure. TypeScript allocates the closure, pushes it, then fills in its upvalues.',
  },
  'uh-safe': {
    q: 'Why can the local `upvalues` Vec in `Vm::closure` go unrooted while `alloc` might collect?',
    a: 'Each handle in it is also in `open_upvalues` (a root) or in the enclosing closure, which the running frame keeps alive.',
  },
  'uh-insert': {
    q: 'What does `Vec::insert` cost, and why is it fine for the open-upvalue list?',
    a: 'Time proportional to the elements after the index. The list only holds variables of running frames: at most 3 across the corpus.',
  },
};

export const examples = {
  'shared-upvalue': {
    title: 'Two closures, one handle',
    lang: 'rust',
    code: `#[derive(Clone, Copy, Debug)]
enum Up {
    Open(usize),
    Closed(f64),
}

struct Closure {
    name: &'static str,
    ups: Vec<usize>, // handles
}

fn main() {
    let mut stack = vec![0.0, 5.0];
    // The upvalue arena.
    let mut ups = vec![Up::Open(1)];
    // Both capture slot 1: handle 0.
    let inc = Closure {
        name: "inc",
        ups: vec![0],
    };
    let get = Closure {
        name: "get",
        ups: vec![0],
    };
    println!("{:?}", ups[get.ups[0]]);

    // The frame returns: close it.
    if let Up::Open(s) = ups[0] {
        ups[0] = Up::Closed(stack[s]);
    }
    stack.truncate(1);

    // inc writes through its handle...
    let h = inc.ups[0];
    if let Up::Closed(v) = &mut ups[h] {
        *v += 1.0;
    }
    // ...and get sees the write.
    let h = get.ups[0];
    println!("{} sees {:?}", get.name,
        ups[h]);
    println!("{} wrote it", inc.name);
}`,
  },
};

const capStarter = `#[derive(Clone, Copy, Debug, PartialEq)]
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
`;

const captureOk = `
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
`;

const closeOk = `
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
}`;

const rwStarter = `#[derive(Clone, Copy, Debug, PartialEq)]
enum Up {
    Open(usize),
    Closed(f64),
}

struct Vm {
    stack: Vec<f64>,
    ups: Vec<Up>,
}

impl Vm {
    // GetUpvalue: read the variable.
    fn get(&self, h: usize) -> f64 {
        todo!()
    }

    // SetUpvalue: write the variable.
    fn set(
        &mut self,
        h: usize,
        v: f64,
    ) {
        todo!()
    }
}`;

export const exercises = {
  captureClose: {
    lang: 'rust',
    title: 'capture and close',
    prompt: `Here is drip-rs's upvalue machinery in miniature. \`ups\` is the upvalue arena, so a handle is a \`usize\` index into it. \`open\` holds the handles of the open upvalues, sorted by slot, lowest first. Write:

1. \`capture(slot)\`. Search \`open\` from the end. If an upvalue for \`slot\` exists, return its handle, so closures share it. Stop as soon as you pass below \`slot\`. Otherwise push \`Up::Open(slot)\` onto \`ups\` and insert its handle into \`open\` where it keeps the order.
2. \`close(last)\`. While the last open upvalue's slot is \`>= last\`, overwrite it in the arena with \`Up::Closed\` of the stack value, and pop it from \`open\`.`,
    starter: capStarter + `
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
    solution: capStarter + captureOk + closeOk,
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
      'Walk `i` down from `open.len()`, looking at `open[i - 1]`. When its slot is below `slot`, `i` is where the new handle goes.',
      'The new handle is the index of the upvalue you just pushed: `ups.len() - 1`.',
      'In `close`, copy the stack value into a local before writing `self.ups[h]`.',
      '`>= last`, not `> last`: the slot at `last` itself is going away too.',
    ],
    walkthrough: `**capture.** The open list is sorted with the highest slot at the end, and most captures are of variables near the top of the stack, so the search starts at the end. Three outcomes: the slot matches, so return the existing handle (this is what makes two closures over one variable share it); the slot is lower, so stop, because everything earlier is lower still; or keep going. When the loop ends, \`i\` is the position that keeps the list sorted. Push \`Up::Open(slot)\` onto the arena; its handle is its index. \`insert(i, h)\` shifts the handles above it.

**close.** The open upvalues that point into the dying part of the stack are exactly a suffix of the list, because it's sorted. So pop from the end while the slot is \`>= last\`. Closing is one assignment: \`self.ups[h] = Up::Closed(v)\`. The arena slot keeps its index, which is the whole point: every closure holding \`h\` now reads the closed value, and none of them had to be told.

After closing, the slot is free for a new variable, so a later capture of the same slot number makes a new upvalue. That is the last test.`,
    wrong: [
      {
        code: capStarter + `
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
` + closeOk,
        why: 'This makes a new upvalue every time. Two closures over the same variable get different upvalues, so a write through one is invisible to the other once they close.',
      },
      {
        code: capStarter + captureOk + `
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
        code: capStarter + `
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
` + closeOk,
        why: 'Pushing at the end breaks the order when a lower slot is captured later, and then `close` stops at the wrong place.',
      },
    ],
  },
  readWrite: {
    lang: 'rust',
    optional: true,
    title: 'Reading and writing through a handle',
    prompt: `Write the heart of \`GetUpvalue\` and \`SetUpvalue\`. \`get(h)\` reads the variable behind handle \`h\`: from the stack if the upvalue is \`Open\`, from the upvalue itself if it is \`Closed\`. \`set(h, v)\` writes it in the same place. An open upvalue must stay open after \`set\`.`,
    starter: rwStarter,
    solution: rwStarter.replace(`    fn get(&self, h: usize) -> f64 {
        todo!()
    }`, `    fn get(&self, h: usize) -> f64 {
        match self.ups[h] {
            Up::Open(s) => {
                self.stack[s]
            }
            Up::Closed(v) => v,
        }
    }`).replace(`    fn set(
        &mut self,
        h: usize,
        v: f64,
    ) {
        todo!()
    }`, `    fn set(
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
    }`),
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
      '`get` can `match self.ups[h]` by value: `Up` is `Copy`.',
      'For `set`, match on `&mut self.ups[h]`, so the `Closed` arm gets a `&mut f64` to write through. Writing `self.stack[*s]` in the other arm is allowed: `ups` and `stack` are different fields.',
    ],
    walkthrough: `\`get\` is a two-armed \`match\`. Because \`Up\` is \`Copy\`, matching \`self.ups[h]\` copies the enum out and the borrow ends at once.

\`set\` needs to change the \`Closed\` value in place, so it matches on \`&mut self.ups[h]\`. In the \`Open\` arm, \`s\` is a \`&mut usize\` and \`*s\` is the slot. The arm writes \`self.stack[*s]\` while \`self.ups[h]\` is still mutably borrowed: two different fields, so the borrow checker allows it. drip-rs's \`SetUpvalue\` arm has the same shape, with \`self.heap[up]\` and \`self.stack\`.

The tempting shortcut, \`self.ups[h] = Up::Closed(v)\`, closes an open upvalue early. The variable's stack slot keeps the old value, and the function that owns the local would never see the write.`,
    wrong: [
      {
        code: rwStarter.replace(`    fn get(&self, h: usize) -> f64 {
        todo!()
    }`, `    fn get(&self, h: usize) -> f64 {
        match self.ups[h] {
            Up::Open(s) => {
                self.stack[s]
            }
            Up::Closed(v) => v,
        }
    }`).replace(`    fn set(
        &mut self,
        h: usize,
        v: f64,
    ) {
        todo!()
    }`, `    fn set(
        &mut self,
        h: usize,
        v: f64,
    ) {
        self.ups[h] = Up::Closed(v);
    }`),
        why: 'This closes an open upvalue early. The local’s own stack slot keeps the old value, so the function that owns the variable doesn’t see the write.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which TypeScript fields does drip-rs’s `ObjUpvalue` enum replace?',
    options: [
      { t: 'Only `nextOpen`', why: '`nextOpen` is replaced by the `open_upvalues` Vec. The enum replaces the other two.' },
      { t: '`slot` (with -1 for closed) and `closed`: the variant says which one is meaningful', correct: true, why: '`Open(slot)` or `Closed(value)`, never a stale mix.' },
      { t: '`type` and `isMarked`', why: 'Those are header fields every drip-rs object drops (chapter 241).' },
      { t: 'None: it has the same three fields', why: 'An enum variant carries only its own data.' },
    ],
  },
  {
    q: 'Two closures capture the same local, and its frame returns. What happens in the heap?',
    options: [
      { t: 'Each closure gets its own copy of the value', why: 'They share one upvalue handle, so there is one copy.' },
      { t: 'The upvalue moves to a new arena slot with a new handle', why: 'Closing overwrites the object where it is. The handle doesn’t change.' },
      { t: 'The one upvalue object is overwritten with `Closed(value)` in its slot; both closures still hold its handle', correct: true, why: 'That is why closing needs no visit to the closures.' },
      { t: 'Nothing, until a collection runs', why: '`close_upvalues` runs at `Return`, before the frame’s slots are dropped.' },
    ],
  },
  {
    q: 'drip-rs’s open list is `[Gc(4), Gc(1), Gc(7)]` with slots 2, 5 and 9. What does `close_upvalues(5)` do?',
    options: [
      { t: 'Closes all three', why: 'Slot 2 is below 5, so the loop stops there.' },
      { t: 'Closes only `Gc(7)`', why: 'Slot 5 is `>= 5`, so `Gc(1)` closes too.' },
      { t: 'Closes `Gc(4)` first, since it is first in the Vec', why: 'Closing pops from the end: the highest slots are there.' },
      { t: 'Closes `Gc(7)`, then `Gc(1)`, and stops at `Gc(4)`', correct: true, why: 'It pops from the end while the slot is at or above `last`.' },
    ],
  },
  {
    q: 'Why does drip-rs capture all upvalues before allocating the closure?',
    options: [
      { t: 'A `&mut` to the new closure couldn’t stay alive across `capture_upvalue`, which needs all of `self`', correct: true, why: 'rustc reports E0499. And the order also means the closure never holds a half-filled list.' },
      { t: 'So the collector can never run during `OP_CLOSURE`', why: 'It can: both `capture_upvalue` and `alloc` may collect. The design makes that safe.' },
      { t: 'Because closures are immutable after allocation', why: 'They aren’t: `heap[c]` is writable through `IndexMut`.' },
      { t: 'To make capturing faster', why: 'It’s about borrowing and GC safety, not speed.' },
    ],
  },
  {
    q: 'While `Vm::closure` runs, a collection happens. Why isn’t the local `upvalues` Vec’s content freed?',
    options: [
      { t: 'Local Vecs are always roots', why: 'The collector sees only what it is passed; a local Vec is invisible to it.' },
      { t: 'Upvalues are never collected', why: 'They are, once nothing reaches them.' },
      { t: 'Each handle in it is also in `open_upvalues` or in the enclosing closure, which are reachable from roots', correct: true, why: 'The comment in `vm.rs` makes exactly this argument.' },
      { t: 'Because `alloc` never collects', why: '`Vm::alloc` calls `collect_if_needed` first. Only `Heap::alloc` never collects.' },
    ],
  },
  {
    q: 'In `SetUpvalue`, why does `match &mut self.heap[up] { Open(slot) => self.stack[*slot] = value, .. }` compile?',
    options: [
      { t: 'Because `ObjUpvalue` is `Copy`', why: 'It is matched through `&mut`, not copied.' },
      { t: 'The mutable borrows are of two different fields, `self.heap` and `self.stack`', correct: true, why: 'Disjoint field borrows are allowed (chapter 203).' },
      { t: 'Because `value` was read before the match', why: 'That avoids a different conflict (with `peek`), but isn’t why the two `&mut`s coexist.' },
      { t: 'It doesn’t; drip-rs clones the upvalue first', why: 'drip-rs writes through the `&mut` directly.' },
    ],
  },
];
