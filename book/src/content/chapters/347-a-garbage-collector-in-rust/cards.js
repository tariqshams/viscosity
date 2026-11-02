// Chapter 347 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'ag-alloc': {
    q: 'Does `Heap::alloc` in drip-rs ever start a collection?',
    a: 'No. The caller (the VM or the compiler) asks `should_collect()` first and, if so, calls `collect` with its roots.',
  },
  'ag-dyn': {
    q: 'Why does `collect` take `&[&dyn Trace]` rather than a generic `&[T]`?',
    a: 'One call mixes root types: the compiler passes whatever roots the VM gave it together with its own `Vec<FunctionState>`, and a slice of trait objects can hold values of different types.',
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
    a: 'Strings and natives. They refer to no other objects, so `Gray` has no variant for them and marking one makes it black at once.',
  },
  'ag-free': {
    q: 'What does `Arena::remove(i, true)` do with slot `i`?',
    a: 'Takes the object out with `take` (the slot becomes `None` and the object is dropped) and, because `reuse` is true, pushes `i` on the free list, which the next `insert` pops.',
  },
  'ag-weak': {
    q: 'Why does `collect` prune the string table before sweeping?',
    a: 'The table holds strings weakly. Its entries for unmarked strings must go, or it would keep handles to freed slots.',
  },
  'ag-stress': {
    q: 'What does drip-rs’s stress mode change?',
    a: '`should_collect()` is always true, so a collection runs before every allocation, and `poison_freed` is set, so freed slots are never reused.',
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

export const exercises = {
  markSweep: {
    lang: 'rust',
    title: 'Mark, trace, sweep',
    prompt: `Here is a one-arena heap in drip-rs's style. A handle is an index into \`objs\`; a freed slot is \`None\`; \`alloc\` reuses an index from \`free\` before growing. Write \`collect(roots)\`:

1. Make a fresh mark bitmap, \`vec![false; n]\`, and a gray stack. Mark each root and push it gray.
2. Pop gray objects until none are left, marking and pushing each object they refer to that isn't marked yet.
3. Sweep: for every unmarked slot that holds an object, take it out (the slot becomes \`None\`), count it in \`freed\`, and push its index on \`free\`, unless \`poison\` is set.

The bitmap is a local, separate from \`self\`, so you can read \`self.get(h).refs\` while you write \`marks\`.`,
    starter: `struct Obj {
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

    // Free every object the roots
    // can't reach.
    fn collect(
        &mut self,
        roots: &[usize],
    ) {
        todo!()
    }
}`,
    solution: `struct Obj {
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
        // 3. Sweep.
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
}`,
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
      'Do it in the three steps of `Heap::collect`: mark the roots, trace until nothing is gray, sweep. Start with a local bitmap, `let mut marks = vec![false; n];`, and a local `let mut gray = Vec::new();`.',
      'Mark an object at the moment you push it gray, and push it only if its bit was still false: that one check is what stops a cycle from looping for ever. `self.get(h)` borrows `self` shared while `marks` and `gray` are locals, so changing them inside the loop is fine.',
      'For the sweep, loop over every index; skip marked ones; `self.objs[i].take()` returns the old `Option` and leaves `None`. Count and free only when it was `Some` (a slot freed earlier is already `None`), and push `i` on `self.free` unless `self.poison` is set.',
    ],
    walkthrough: `**How to think about it.** A collection answers one question, "which objects can the program still reach?", and frees the rest. Reaching is following references, starting from the roots, and the only danger is going round a cycle for ever; marking each object the first time it is seen, and never pushing a marked one again, removes that danger. Keep the three phases of drip-rs's \`Heap::collect\` in mind (mark, trace, sweep), and keep the bitmap in a local, apart from \`self\`, just as drip-rs lifts its \`Marks\` out of the heap.

**The solution, line by line.**

- \`let n = self.objs.len();\` is the number of slots, live or free.
- \`let mut marks = vec![false; n];\` is a fresh bitmap, one \`false\` per slot. That is drip-rs's \`marks.reset(self)\`, and it is why the test \`each_collection_starts_fresh\` passes: what survived the first collection gets no head start in the second.
- \`let mut gray = Vec::new();\` is the gray stack: marked, but not yet looked inside.
- \`for &r in roots { if !marks[r] { marks[r] = true; gray.push(r); } }\` marks each root and makes it gray.
- \`while let Some(h) = gray.pop() {\` takes the next gray object until none are left.
- \`let o = self.get(h);\` borrows the object shared. \`marks\` and \`gray\` are locals, not part of \`self\`, so writing them below does not clash with this borrow.
- \`for &r in &o.refs { if !marks[r] { marks[r] = true; gray.push(r); } }\` marks and pushes everything it refers to that is not marked yet. In the cycle tests, object 0 refers to 1 and 1 to 0; the second time round, 0 is already marked, so nothing is pushed and the loop ends.
- \`for i in 0..n { if marks[i] { continue; }\` visits every slot and skips the survivors.
- \`let o = self.objs[i].take();\` takes the object out, leaving \`None\`.
- \`if o.is_some() { self.freed += 1; if !self.poison { self.free.push(i); } }\` counts and frees only slots that held an object, and puts the index on the free list only when slots may be reused. With \`poison\`, the slot stays \`None\` for good, so \`get\` on a stale handle panics with "use after free", as drip-rs's arenas do in stress mode.

**Common wrong attempts.**

- Marking the roots but never tracing: only the roots survive, so object 1, reachable from root 0, is freed while still in use.
- Ignoring \`poison\`: a freed slot is handed out again, so a stale handle quietly reads the new object instead of panicking.
- Freeing every unmarked slot without checking \`is_some()\`: slots freed by an earlier collection are counted again and pushed on the free list a second time, so two allocations could be given the same slot.`,
    wrong: [
      {
        code: `struct Obj {
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
        // 3. Sweep.
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
}`,
        why: 'Without tracing, only the roots survive. Object 1 is reachable from root 0, yet it is freed: the next `get(1)` would be a use after free.',
      },
      {
        code: `struct Obj {
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
        for i in 0..n {
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
        code: `struct Obj {
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
        for i in 0..n {
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
    q: 'Which part of drip-rs decides that a collection should run?',
    options: [
      {
        t: '`Heap::alloc`, whenever the heap is too big',
        why: '`Heap::alloc` never collects: it cannot see the roots.',
      },
      {
        t: 'The allocating caller (the VM or the compiler), which asks `should_collect()` and then calls `collect` with its roots',
        correct: true,
        why: '`Vm::alloc` calls `collect_if_needed` first; the compiler has its own version that adds its half-built functions.',
      },
      {
        t: 'A background thread',
        why: 'drip-rs collects on the same thread, between instructions, only when asked.',
      },
      {
        t: 'Rust’s ownership system, when a `Gc` handle is dropped',
        why: 'A `Gc` is a `Copy` index; dropping one frees nothing.',
      },
    ],
  },
  {
    q: 'Why are drip-rs’s mark bits kept in a separate `Marks` value instead of in each object?',
    options: [
      {
        t: 'To save memory',
        why: 'A `Vec<bool>` per arena uses about as much as a flag per object; the reason is borrowing.',
      },
      {
        t: 'Rust objects cannot have `bool` fields',
        why: 'They can; the problem is reading and writing the same struct at once.',
      },
      {
        t: 'So that `blacken` can read the heap through `&self` while it writes the bits through `&mut Marks`',
        correct: true,
        why: 'With the bits inside the objects, the read borrow and the write borrow overlap (error E0502).',
      },
      {
        t: 'So that the TypeScript VM can share them',
        why: 'The two VMs share nothing at run time.',
      },
    ],
  },
  {
    q: 'What does `std::mem::take(&mut self.marks)` do at the start of `collect`?',
    options: [
      {
        t: 'Moves the bitmap out of the heap, leaving an empty `Marks` in its place, so it can be borrowed apart from the heap',
        correct: true,
        why: 'At the end, `self.marks = marks;` puts it back, so its memory is reused next time.',
      },
      {
        t: 'Clears every mark bit',
        why: 'That is `marks.reset(self)`, the next line.',
      },
      {
        t: 'Copies the bitmap',
        why: 'It moves it; nothing is copied.',
      },
      {
        t: 'Frees the bitmap’s memory',
        why: 'The bitmap is kept and put back afterwards.',
      },
    ],
  },
  {
    q: 'In stress mode, why must freed slots never be reused?',
    options: [
      {
        t: 'Reusing them would be too slow under stress',
        why: 'Speed is not the point of stress mode.',
      },
      {
        t: 'So that a stale handle finds `None` and panics with “use after free”, instead of quietly reading whatever object moved into its slot',
        correct: true,
        why: 'That turns a missing root into a loud, immediate failure.',
      },
      {
        t: 'The free list is not allowed to grow during a collection',
        why: 'It may grow; stress mode simply never adds to it.',
      },
      {
        t: 'Strings must stay interned for ever',
        why: 'Unmarked strings are still freed; only their slots are not handed out again.',
      },
    ],
  },
  {
    q: 'A scratch copy of drip-rs stops tracing `open_upvalues` in `VmRoots`. What happens?',
    options: [
      {
        t: 'It no longer compiles',
        why: 'It compiles, with a warning that the field is never read.',
      },
      {
        t: 'Every corpus program fails',
        why: 'The normal suite still passed, 334 of 334: collections rarely run at the wrong moment.',
      },
      {
        t: 'Nothing: open upvalues are also reachable from closures',
        why: 'A new upvalue is reachable only from the open list until its closure exists, and allocating that closure may collect.',
      },
      {
        t: 'The stress suite fails, starting with `closures/assign_after_capture.drip`, with “use after free” on an `ObjUpvalue`',
        correct: true,
        why: '25 of the 165 stress programs failed: the collection before the closure’s allocation freed the new upvalue.',
      },
    ],
  },
];
