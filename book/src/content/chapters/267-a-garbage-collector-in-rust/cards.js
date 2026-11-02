// Chapter 267 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'ag-alloc': {
    q: 'Does `Heap::alloc` in drip-rs ever start a collection?',
    a: 'No. The caller (the VM or the compiler) asks `should_collect()` first and, if so, calls `collect` with its roots.',
  },
  'ag-rule': {
    q: 'Because allocation may collect first, what must hold for the object passed to `Vm::alloc`?',
    a: 'Everything it refers to must already be reachable from a root, since the new object itself isn’t yet.',
  },
  'ag-dyn': {
    q: 'Why does `collect` take `&[&dyn Trace]` rather than a generic `&[T]`?',
    a: 'One call mixes root types, such as the compiler’s roots and its `Vec<FunctionState>`; a slice of trait objects can hold different types.',
  },
  'ag-bitmap': {
    q: 'Where are drip-rs’s mark bits, and why not in the objects?',
    a: 'In a separate `Marks` value, one `Vec<bool>` per arena. Tracing reads objects while marking writes bits; apart, the two borrows don’t overlap.',
  },
  'ag-take': {
    q: 'Why does `collect` begin with `std::mem::take(&mut self.marks)`?',
    a: 'To move the bitmap out of the heap, so `blacken(&self, .., &mut marks)` can borrow the heap shared and the marks mutably.',
  },
  'ag-gray': {
    q: 'Which drip-rs objects never go on the gray stack, and why?',
    a: 'Strings and natives. They refer to no other objects, so marking one makes it black at once.',
  },
  'ag-free': {
    q: 'What does `Arena::remove(i, true)` do with slot `i`?',
    a: 'Takes the object out (the slot becomes `None`, the object is dropped) and pushes `i` on the free list, which the next `insert` pops.',
  },
  'ag-weak': {
    q: 'Why does `collect` prune the string table before sweeping?',
    a: 'The table holds strings weakly. Its entries for unmarked strings must go, or it would keep handles to freed slots.',
  },
  'ag-stress': {
    q: 'What does drip-rs’s stress mode change?',
    a: '`should_collect()` is always true, so a collection runs before every allocation, and freed slots are never reused.',
  },
  'ag-poison': {
    q: 'Why must stress mode also stop reusing freed slots?',
    a: 'With reuse, a stale handle silently reads the new object in its slot. Without it, the slot stays `None` and the use panics.',
  },
};

export const examples = {
  'dyn-roots': {
    title: 'Roots of different types in one slice',
    lang: 'rust',
    code: `struct Marks {
    bits: Vec<bool>,
}

trait Trace {
    fn trace(&self, m: &mut Marks);
}

// A handle: an arena index.
struct Handle(usize);

impl Trace for Handle {
    fn trace(&self, m: &mut Marks) {
        m.bits[self.0] = true;
    }
}

impl<T: Trace> Trace for Vec<T> {
    fn trace(&self, m: &mut Marks) {
        for t in self {
            t.trace(m);
        }
    }
}

// No roots at all.
impl Trace for () {
    fn trace(&self, _: &mut Marks) {}
}

// Borrowed fields, as in VmRoots.
struct VmRoots<'a> {
    stack: &'a Vec<Handle>,
    globals: &'a Vec<Handle>,
}

impl Trace for VmRoots<'_> {
    fn trace(&self, m: &mut Marks) {
        self.stack.trace(m);
        self.globals.trace(m);
    }
}

fn mark(
    n: usize,
    roots: &[&dyn Trace],
) -> Vec<bool> {
    let mut m = Marks {
        bits: vec![false; n],
    };
    for r in roots {
        r.trace(&mut m);
    }
    m.bits
}

fn main() {
    let s = vec![Handle(0), Handle(2)];
    let g = vec![Handle(5)];
    let vm = VmRoots {
        stack: &s,
        globals: &g,
    };
    // The compiler's half-built work:
    let compiling = vec![Handle(3)];
    println!("{:?}",
        mark(6, &[&vm, &compiling]));
    println!("{:?}", mark(6, &[&()]));
}`,
  },
};

const msStarter = `struct Obj {
    refs: Vec<usize>,
}

struct Heap {
    objs: Vec<Option<Obj>>,
    free: Vec<usize>,
    // Never reuse a freed slot.
    poison: bool,
    freed: usize,
}

impl Heap {
    fn new(poison: bool) -> Heap {
        Heap {
            objs: Vec::new(),
            free: Vec::new(),
            poison,
            freed: 0,
        }
    }

    fn alloc(
        &mut self,
        refs: Vec<usize>,
    ) -> usize {
        let obj = Some(Obj { refs });
        let top = self.free.pop();
        if let Some(i) = top {
            self.objs[i] = obj;
            return i;
        }
        self.objs.push(obj);
        self.objs.len() - 1
    }

    fn get(&self, h: usize) -> &Obj {
        let o = self.objs[h].as_ref();
        o.expect("use after free")
    }
`;

const msTodo = `
    // Free every object the roots
    // can't reach.
    fn collect(
        &mut self,
        roots: &[usize],
    ) {
        todo!()
    }
}`;

const markOk = `
    // Free every object the roots
    // can't reach.
    fn collect(
        &mut self,
        roots: &[usize],
    ) {
        let n = self.objs.len();
        let mut marks = vec![false; n];
        let mut gray = Vec::new();
        // 1. Mark the roots.
        for &r in roots {
            if !marks[r] {
                marks[r] = true;
                gray.push(r);
            }
        }
        // 2. Trace until none are gray.
        while let Some(h) = gray.pop() {
            let o = self.get(h);
            for &r in &o.refs {
                if !marks[r] {
                    marks[r] = true;
                    gray.push(r);
                }
            }
        }
`;

const sweepOk = `        // 3. Sweep.
        for i in 0..n {
            if marks[i] {
                continue;
            }
            let o = self.objs[i].take();
            if o.is_some() {
                self.freed += 1;
                if !self.poison {
                    self.free.push(i);
                }
            }
        }
    }
}`;

export const exercises = {
  markSweep: {
    lang: 'rust',
    title: 'Mark, trace, sweep',
    prompt: `Here is a one-arena heap in drip-rs's style. A handle is an index into \`objs\`; a freed slot is \`None\`; \`alloc\` reuses an index from \`free\` before growing. Write \`collect(roots)\`:

1. Make a fresh mark bitmap, \`vec![false; n]\`, and a gray stack. Mark each root and push it gray.
2. Pop gray objects until none are left, marking and pushing each object they refer to that isn't marked yet.
3. Sweep: for every unmarked slot that holds an object, take it out (the slot becomes \`None\`), count it in \`freed\`, and push its index on \`free\`, unless \`poison\` is set.

The bitmap is a local, separate from \`self\`, so you can read \`self.get(h).refs\` while you write \`marks\`.`,
    starter: msStarter + msTodo,
    solution: msStarter + markOk + sweepOk,
    tests: `// 0 -> 1 -> 2, and 3 on its own
fn heap(poison: bool) -> Heap {
    let mut h = Heap::new(poison);
    h.alloc(vec![1]);
    h.alloc(vec![2]);
    h.alloc(vec![]);
    h.alloc(vec![]);
    h
}

fn live(h: &Heap) -> Vec<usize> {
    let n = h.objs.len();
    (0..n)
        .filter(|&i| h.objs[i].is_some())
        .collect()
}

#[test]
fn keeps_what_the_roots_reach() {
    let mut h = heap(false);
    h.collect(&[0]);
    assert_eq!(live(&h), [0, 1, 2]);
    assert_eq!(h.freed, 1);
}

#[test]
fn no_roots_frees_everything() {
    let mut h = heap(false);
    h.collect(&[]);
    assert!(live(&h).is_empty());
    assert_eq!(h.freed, 4);
}

#[test]
fn an_unreachable_cycle_is_freed() {
    let mut h = Heap::new(false);
    h.alloc(vec![1]);
    h.alloc(vec![0]);
    let keep = h.alloc(vec![]);
    h.collect(&[keep]);
    assert_eq!(live(&h), [2]);
}

#[test]
fn a_reachable_cycle_is_kept() {
    let mut h = Heap::new(false);
    h.alloc(vec![1]);
    h.alloc(vec![0]);
    h.collect(&[1]);
    assert_eq!(live(&h), [0, 1]);
}

#[test]
fn each_collection_starts_fresh() {
    let mut h = heap(false);
    h.collect(&[0]);
    h.collect(&[1]);
    assert_eq!(live(&h), [1, 2]);
    assert_eq!(h.freed, 2);
}

#[test]
fn freed_slots_are_reused() {
    let mut h = heap(false);
    h.collect(&[0]);
    assert_eq!(h.alloc(vec![]), 3);
}

#[test]
fn poison_never_reuses_a_slot() {
    let mut h = heap(true);
    h.collect(&[0]);
    assert!(h.free.is_empty());
    assert_eq!(h.alloc(vec![]), 4);
}

#[test]
#[should_panic(expected = "use after free")]
fn a_stale_handle_panics() {
    let mut h = heap(true);
    h.collect(&[0]);
    h.get(3);
}`,
    hints: [
      'Mark when you push gray, and push only if the bit was still false. That one check is what stops a cycle from looping forever.',
      '`self.get(h)` borrows `self` shared; `marks` and `gray` are locals, so changing them inside the loop is fine.',
      '`self.objs[i].take()` returns the old `Option` and leaves `None` behind. Count and free only when it was `Some`: a slot freed earlier is already `None`.',
    ],
    walkthrough: `**Mark.** The bitmap is built fresh, one \`false\` per slot. That's drip-rs's \`marks.reset(self)\`, and it is why the fifth test passes: whatever survived the first collection gets no head start in the second. Each root is marked and pushed gray.

**Trace.** Pop a gray handle and look at what it refers to. Anything unmarked gets marked and pushed. Marking at push time means each object is pushed at most once, so the loop ends even on a cycle. Notice the borrows: \`self.get(h)\` is a shared borrow of the heap, and \`marks\` is a separate local. That is exactly why drip-rs keeps its \`Marks\` outside the objects, and lifts it out of the heap with \`mem::take\` before tracing.

**Sweep.** Every slot whose bit is still \`false\` is garbage, but only if it holds an object: slots freed by an earlier collection are already \`None\`, which \`take\` reports. Freed indices go on the free list, so \`alloc\` reuses them, unless \`poison\` is on. Then the slot stays \`None\` for good, and \`get\` on a stale handle panics, as drip-rs's \`use_after_free\` does in stress mode.`,
    wrong: [
      {
        code: msStarter + `
    fn collect(
        &mut self,
        roots: &[usize],
    ) {
        let n = self.objs.len();
        let mut marks = vec![false; n];
        // Mark the roots only.
        for &r in roots {
            marks[r] = true;
        }
` + sweepOk,
        why: 'Without tracing, only the roots survive. Object 1 is reachable from root 0, yet it is freed: the next `get(1)` would be a use after free.',
      },
      {
        code: msStarter + markOk + `        for i in 0..n {
            if marks[i] {
                continue;
            }
            let o = self.objs[i].take();
            if o.is_some() {
                self.freed += 1;
                self.free.push(i);
            }
        }
    }
}`,
        why: 'This ignores `poison`. A freed slot is handed out again, so a stale handle quietly reads the new object instead of panicking.',
      },
      {
        code: msStarter + markOk + `        for i in 0..n {
            if !marks[i] {
                self.objs[i] = None;
                self.freed += 1;
                if !self.poison {
                    self.free.push(i);
                }
            }
        }
    }
}`,
        why: 'Slots freed by an earlier collection are `None` already. This counts them again and pushes their index on the free list a second time, so two allocations could get the same slot.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Who decides when drip-rs collects garbage?',
    options: [
      { t: '`Heap::alloc`, when `bytes_allocated` passes `next_gc`', why: 'That is the TypeScript design. `Heap::alloc` never collects.' },
      { t: 'Rust’s ownership system, when the last `Gc<T>` is dropped', why: '`Gc<T>` is `Copy` and owns nothing; dropping one does nothing.' },
      { t: 'The caller: the VM or compiler asks `should_collect()` and then calls `collect` with its roots', correct: true, why: 'Only the caller can name the roots it holds.' },
      { t: 'A background thread', why: 'drip-rs is single-threaded.' },
    ],
  },
  {
    q: 'Why does `collect` take roots as `&[&dyn Trace]`?',
    options: [
      { t: 'Trait objects are faster than generics', why: 'They add a virtual call. The reason is flexibility.' },
      { t: 'So one slice can hold roots of different types, such as `VmRoots` and `Vec<FunctionState>`', correct: true, why: 'The compiler passes `&[self.roots, &self.functions]`.' },
      { t: 'Because `Trace` has generic methods', why: 'It has one plain method, `trace(&self, &mut Marks)`.' },
      { t: 'So the heap can keep the roots after `collect` returns', why: 'They are borrowed for the call only.' },
    ],
  },
  {
    q: 'What would go wrong if drip-rs kept a mark bit inside each object, in the arena?',
    options: [
      { t: 'Objects would be too large for a `Gc<T>`', why: 'A handle is an index; object size doesn’t matter to it.' },
      { t: 'Nothing; it’s only a style choice', why: 'The borrow checker objects, as the E0502 example shows.' },
      { t: 'Sweep couldn’t find the objects', why: 'Sweep walks the arenas either way.' },
      { t: 'Tracing an object (a read borrow of the heap) and marking what it refers to (a write) would overlap', correct: true, why: 'With the bits in a separate `Marks`, the two borrows are of different values.' },
    ],
  },
  {
    q: 'After a sweep, why does drip-rs not unmark the survivors, as the TypeScript sweep does?',
    options: [
      { t: 'The next collection builds a cleared bitmap anyway, in `marks.reset`', correct: true, why: 'Every bit vector is resized to its arena and set to `false`.' },
      { t: 'Survivors stay marked forever', why: 'Then garbage could never be found among them.' },
      { t: 'Unmarking happens in `alloc`', why: '`alloc` doesn’t touch the marks.' },
      { t: 'Because strings are never gray', why: 'That is about the gray stack, not unmarking.' },
    ],
  },
  {
    q: 'In stress mode, why must freed slots not be reused?',
    options: [
      { t: 'Reusing slots is slow', why: 'It is fast; that isn’t the reason.' },
      { t: 'Stress mode allocates too much to keep a free list', why: 'The free list costs little.' },
      { t: 'So a stale handle hits `None` and panics, instead of reading the new object that took its slot', correct: true, why: 'Both objects have the same type, so the type system can’t tell them apart.' },
      { t: 'Because the bitmap can’t be resized', why: 'It is resized every collection.' },
    ],
  },
  {
    q: 'With `open_upvalues` removed from the VM’s roots, why did all 246 corpus programs still pass normally?',
    options: [
      { t: 'Upvalues are never collected', why: 'The stress run freed one, which is how it panicked.' },
      { t: 'A missing root only matters if a collection runs at the wrong moment, and normally collections are rare', correct: true, why: 'Stress mode makes every allocation that moment, so the bug showed on the sixth program.' },
      { t: 'The corpus has no closures', why: 'It has a whole `closure/` folder.' },
      { t: 'The compiler roots the upvalues instead', why: 'Upvalues are created at run time, by the VM.' },
    ],
  },
];
