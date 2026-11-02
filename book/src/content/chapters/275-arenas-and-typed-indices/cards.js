// Chapter 275 cards. Keys are stable ids: never rename them.

const HEAD = `// A typed index into an Arena.
#[derive(Clone, Copy, PartialEq, Debug)]
struct Id(u32);

struct Arena<T> {
    slots: Vec<Option<T>>,
    free: Vec<u32>,
}

impl<T> Arena<T> {
    fn new() -> Self {
        Arena {
            slots: Vec::new(),
            free: Vec::new(),
        }
    }
`;

const GET = `
    // None if the slot has been freed.
    fn get(&self, id: Id)
        -> Option<&T> {
        let i = id.0 as usize;
        self.slots[i].as_ref()
    }
}`;

const INSERT = `
    // Reuse a freed slot if any.
    fn insert(&mut self, t: T) -> Id {
        let f = self.free.pop();
        if let Some(i) = f {
            let i = i as usize;
            self.slots[i] = Some(t);
            return Id(i as u32);
        }
        self.slots.push(Some(t));
        Id(self.slots.len() as u32 - 1)
    }
`;

const REMOVE = `
    // Empty the slot; mark it free.
    fn remove(&mut self, id: Id)
        -> Option<T> {
        let i = id.0 as usize;
        let t = self.slots[i].take();
        if t.is_some() {
            self.free.push(id.0);
        }
        t
    }
`;

const LIST = `#[derive(Clone, Copy, PartialEq, Debug)]
struct Id(u32);

// A linked list whose nodes live in
// one Vec: nodes[id.0] is node id.
struct Node {
    val: i32,
    next: Option<Id>,
}
`;

export const prompts = {
  'arena-what': {
    q: 'What is an **arena**, as drip-rs uses the word?',
    a: 'One `Vec` of slots that owns every object of one kind. Objects refer to each other by slot number, not by pointer.',
  },
  'arena-free': {
    q: 'What does drip-rs’s `Arena::insert` do before pushing a new slot?',
    a: 'It pops the free list, and if a freed slot is there, puts the object in it and returns that slot’s handle.',
  },
  stale: {
    q: 'An object is freed, its slot is reused, and an old handle to it is used. What happens?',
    a: 'It reads the new object in that slot: the wrong object, but no crash and no undefined behaviour.',
  },
  'poison-mode': {
    q: 'Why do drip-rs’s debug and stress modes never reuse a freed slot?',
    a: 'Then a stale handle finds `None` and panics with “use after free”, so a missing GC root fails loudly at the exact use.',
  },
  'typed-index': {
    q: 'Why wrap a slot number in a type such as `struct NodeId(u32)` instead of using a bare `usize`?',
    a: 'So the compiler rejects using one kind of index where another is expected, such as a block id for a value.',
  },
  phantom: {
    q: 'What does the `PhantomData<fn() -> T>` field in drip-rs’s `Gc<T>` do?',
    a: 'It takes no space but makes the handle’s type mention `T`, so a `Gc<ObjClass>` and a `Gc<ObjClosure>` are different types.',
  },
  'gc-size': {
    q: 'How big is a drip-rs `Gc<T>`, and is it `Copy`?',
    a: '4 bytes (a `u32`), and yes: copying a handle copies a number and creates no owner.',
  },
  'derive-bound': {
    q: 'Why does drip-rs write `impl<T> Copy for Gc<T>` by hand instead of `#[derive(Clone, Copy)]`?',
    a: 'The derive would require `T: Clone` and `T: Copy`, but the handle is copyable whatever `T` is.',
  },
  'copy-out': {
    q: 'You need data from one arena object to change another. What is the usual pattern?',
    a: 'Copy what you need (a handle, a `Value`, a number) out of the first object, let that borrow end, then borrow mutably.',
  },
  'ts-vs-rs': {
    q: 'Where does the TypeScript VM keep each object’s mark bit, and where does drip-rs?',
    a: 'TypeScript: an `isMarked` field in every object. drip-rs: a separate bitmap, one `Vec<bool>` per arena, built fresh each collection.',
  },
};

export const examples = {
  'typed-handles': {
    lang: 'rust',
    title: 'Typed handles into arenas',
    code: `use std::marker::PhantomData;
use std::mem::size_of;
use std::ops::{Index, IndexMut};

// Adapted from drip-rs's object.rs.
struct Gc<T> {
    index: u32,
    marker: PhantomData<fn() -> T>,
}

impl<T> Clone for Gc<T> {
    fn clone(&self) -> Self {
        *self
    }
}
impl<T> Copy for Gc<T> {}

struct Arena<T> {
    slots: Vec<Option<T>>,
}

impl<T> Arena<T> {
    fn insert(&mut self, t: T)
        -> Gc<T> {
        self.slots.push(Some(t));
        let i = self.slots.len() - 1;
        Gc {
            index: i as u32,
            marker: PhantomData,
        }
    }
}

impl<T> Index<Gc<T>> for Arena<T> {
    type Output = T;
    fn index(&self, h: Gc<T>) -> &T {
        let i = h.index as usize;
        match &self.slots[i] {
            Some(t) => t,
            None => panic!("freed"),
        }
    }
}

impl<T> IndexMut<Gc<T>> for Arena<T> {
    fn index_mut(&mut self, h: Gc<T>)
        -> &mut T {
        let i = h.index as usize;
        match &mut self.slots[i] {
            Some(t) => t,
            None => panic!("freed"),
        }
    }
}

struct Class {
    name: String,
}
struct Instance {
    class: Gc<Class>,
    hp: f64,
}

fn main() {
    let mut classes =
        Arena { slots: Vec::new() };
    let mut insts =
        Arena { slots: Vec::new() };
    let k = classes.insert(Class {
        name: "Ship".to_string(),
    });
    let a = insts.insert(Instance {
        class: k,
        hp: 10.0,
    });
    let b = insts.insert(Instance {
        class: k,
        hp: 4.0,
    });
    // a.heal(b), then a.heal(a): copy
    // the number out, then write.
    for other in [b, a] {
        let hp = insts[other].hp;
        insts[a].hp += hp / 2.0;
    }
    let c = insts[a].class;
    println!("{} instance, hp {}",
        classes[c].name, insts[a].hp);
    println!("handle size: {} bytes",
        size_of::<Gc<Class>>());
    // Uncomment for E0308:
    // let oops = &insts[k];
}`,
  },
};

export const exercises = {
  arena: {
    lang: 'rust',
    title: 'An arena with a free list',
    prompt:
      'Finish this arena, a simplified version of drip-rs’s. `insert` stores a value and returns its `Id`, reusing a freed slot if there is one. `remove` empties a slot and remembers it as free, but only if it held something. `get` is written for you.',
    starter: `${HEAD}
    fn insert(&mut self, t: T) -> Id {
        todo!()
    }

    fn remove(&mut self, id: Id)
        -> Option<T> {
        todo!()
    }
${GET}`,
    solution: `${HEAD}${INSERT}${REMOVE}${GET}`,
    tests: `#[test]
fn handles_count_up_from_zero() {
    let mut a = Arena::new();
    assert_eq!(a.insert("x"), Id(0));
    assert_eq!(a.insert("y"), Id(1));
    assert_eq!(a.get(Id(1)), Some(&"y"));
}

#[test]
fn removed_objects_are_gone() {
    let mut a = Arena::new();
    let x = a.insert(String::from("x"));
    assert_eq!(a.remove(x), Some(String::from("x")));
    assert_eq!(a.get(x), None);
}

#[test]
fn freed_slots_are_reused() {
    let mut a = Arena::new();
    let x = a.insert(1);
    let y = a.insert(2);
    a.remove(x);
    assert_eq!(a.insert(3), x);
    assert_eq!(a.get(y), Some(&2));
    assert_eq!(a.slots.len(), 2);
}

#[test]
fn removing_twice_frees_once() {
    let mut a = Arena::new();
    let x = a.insert(1);
    a.remove(x);
    assert_eq!(a.remove(x), None);
    let p = a.insert(2);
    let q = a.insert(3);
    assert_ne!(p, q);
}`,
    hints: [
      'In `insert`, try `self.free.pop()` first, with `if let Some(i) = ...`; only push a new slot if the free list was empty.',
      'A new slot’s index is `self.slots.len() - 1` after the push.',
      'In `remove`, `self.slots[i].take()` swaps the slot’s contents for `None` and gives you what was there.',
      'Push the index onto `free` only if `take()` returned `Some`; otherwise one slot could be handed out twice.',
    ],
    walkthrough: `This is \`Arena::insert\` and \`Arena::remove\` from drip-rs’s \`object.rs\`, with a plain \`Id\` instead of \`Gc<T>\`.

- **\`insert\`** checks the free list first. \`self.free.pop()\` gives the most recently freed slot; the object goes into it and that slot’s number is the new handle. Only when nothing is free does it \`push\` a new slot, whose index is \`len - 1\`.
- **\`remove\`** uses \`Option::take\`, which leaves \`None\` behind and returns the old contents. That one call both frees the object (the arena no longer owns it; the caller does, and drops it) and marks the slot empty, so \`get\` returns \`None\`.
- **The guard** \`if t.is_some()\` matters. Without it, removing twice puts the same index on the free list twice, and two later inserts get the same slot: two live handles to one place. The last test catches exactly that.

In drip-rs, \`remove\` takes one more argument, \`reuse\`. The stress and debug modes pass \`false\`, so a freed slot is never reused and a stale handle panics.`,
    wrong: [
      {
        code: `${HEAD}
    fn insert(&mut self, t: T) -> Id {
        self.slots.push(Some(t));
        Id(self.slots.len() as u32 - 1)
    }
${REMOVE}${GET}`,
        why: 'It never looks at the free list, so freed slots are never reused and the arena only grows. That is drip-rs’s poison mode by accident, not a reusing arena.',
      },
      {
        code: `${HEAD}${INSERT}
    fn remove(&mut self, id: Id)
        -> Option<T> {
        let i = id.0 as usize;
        self.free.push(id.0);
        self.slots[i].take()
    }
${GET}`,
        why: 'Removing an already-empty slot pushes its index a second time. Two later inserts then both get slot 0.',
      },
    ],
  },
  arenaList: {
    lang: 'rust',
    optional: true,
    title: 'A linked list in a Vec',
    prompt:
      'Linked lists are awkward with `Box` and `Rc`, and easy with indices. The nodes live in a `Vec<Node>`, and `next` is an `Option<Id>`. Write `push_front`, which adds a node in front of `head` and returns the new head, and `sum`, which follows the `next` links from `head` and adds up the values.',
    starter: `${LIST}
fn push_front(nodes: &mut Vec<Node>,
    head: Option<Id>, val: i32) -> Id {
    todo!()
}

fn sum(nodes: &[Node],
    head: Option<Id>) -> i32 {
    todo!()
}`,
    solution: `${LIST}
fn push_front(nodes: &mut Vec<Node>,
    head: Option<Id>, val: i32) -> Id {
    let n = Node { val, next: head };
    nodes.push(n);
    Id(nodes.len() as u32 - 1)
}

fn sum(nodes: &[Node],
    head: Option<Id>) -> i32 {
    let mut total = 0;
    let mut at = head;
    while let Some(id) = at {
        let n = &nodes[id.0 as usize];
        total += n.val;
        at = n.next;
    }
    total
}`,
    tests: `#[test]
fn empty_list() {
    let nodes: Vec<Node> = Vec::new();
    assert_eq!(sum(&nodes, None), 0);
}

#[test]
fn three_nodes() {
    let mut nodes = Vec::new();
    let a = push_front(&mut nodes, None, 1);
    let b = push_front(&mut nodes, Some(a), 2);
    let c = push_front(&mut nodes, Some(b), 3);
    assert_eq!(nodes[c.0 as usize].next, Some(b));
    assert_eq!(sum(&nodes, Some(c)), 6);
    assert_eq!(sum(&nodes, Some(b)), 3);
}`,
    hints: [
      '`push_front` pushes `Node { val, next: head }` and returns the index of the slot it just filled.',
      'In `sum`, keep a cursor `at: Option<Id>` and loop with `while let Some(id) = at`.',
      'Inside the loop, read the node, add its value, and move the cursor to its `next`.',
    ],
    walkthrough: `\`push_front\` doesn’t move or link anything in memory: the new node just stores the old head’s number in \`next\`, and its own number becomes the new head.

\`sum\` walks the list with a cursor of type \`Option<Id>\`. \`while let Some(id) = at\` runs until a node’s \`next\` is \`None\`. Because \`Id\` is \`Copy\`, \`at = n.next\` copies a number; no borrow of the old node is kept.

This is pointer chasing (chapter 54) with numbers instead of addresses. The borrow checker is happy because only \`nodes\` is ever borrowed, never a node by itself.`,
    wrong: [
      {
        code: `${LIST}
fn push_front(nodes: &mut Vec<Node>,
    head: Option<Id>, val: i32) -> Id {
    let n = Node { val, next: None };
    nodes.push(n);
    Id(nodes.len() as u32 - 1)
}

fn sum(nodes: &[Node],
    head: Option<Id>) -> i32 {
    let mut total = 0;
    let mut at = head;
    while let Some(id) = at {
        let n = &nodes[id.0 as usize];
        total += n.val;
        at = n.next;
    }
    total
}`,
        why: 'The new node’s `next` is `None`, so every node is a list of one and `sum` from the head only sees 3.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In drip-rs, who owns an `ObjInstance`?',
    options: [
      { t: 'Every value that refers to it, through reference counting', why: 'That is `Rc`. drip-rs’s values hold `Gc` handles, which own nothing.' },
      { t: 'Its class', why: 'An instance refers to its class by handle; the class doesn’t own it.' },
      { t: 'The heap’s `instances` arena', correct: true, why: 'Each kind of object has one arena that owns all of them. The collector decides when a slot is freed.' },
    ],
  },
  {
    q: 'Why is `Gc<T>` generic instead of one `Handle(u32)` type for every object?',
    options: [
      { t: 'So that a closure handle can’t be used to index the classes arena: that is a compile error', correct: true, why: '`classes[c]` with `c: Gc<ObjClosure>` gives E0308, mismatched types.' },
      { t: 'Generic types are faster at run time', why: 'Every `Gc<T>` is the same 4 bytes and compiles to the same code; the benefit is checking, not speed.' },
      { t: 'It stores the object’s type tag inside the handle', why: '`PhantomData` takes no space. The type exists only at compile time.' },
      { t: 'Rust doesn’t allow non-generic newtypes', why: 'engine/rust’s `ValueId(u32)` and `BlockId(u32)` are non-generic newtypes.' },
    ],
  },
  {
    q: '`let src = &insts[1]; let dst = &mut insts[0]; dst.hp += src.hp;` What does Rust say?',
    options: [
      { t: 'It compiles: they are different elements', why: 'Indexing borrows the whole `Vec`, so the borrow checker sees two borrows of `insts`.' },
      { t: 'It compiles but panics at run time', why: 'There is no `RefCell` here. Plain borrows are checked at compile time.' },
      { t: 'E0502: `insts` is borrowed as mutable while also borrowed as immutable', correct: true, why: 'Copy `insts[1].hp` into a local first, then write `insts[0]`.' },
    ],
  },
  {
    q: 'A handle points at a freed slot that has since been reused. In drip-rs’s normal mode, using it…',
    options: [
      { t: '…is undefined behaviour, as in C', why: 'drip-rs has no `unsafe` code; the worst case is a wrong but valid object.' },
      { t: '…reads whichever object now lives in that slot', correct: true, why: 'Which is why the test suites turn reuse off: then the slot stays `None` and the use panics.' },
      { t: '…is caught by the borrow checker', why: 'Handles are plain numbers; the compiler can’t know which slots are live.' },
    ],
  },
  {
    q: 'How does drip-rs’s sweep find every object?',
    options: [
      { t: 'It follows a `next` pointer through a linked list of all objects', why: 'That is the TypeScript VM (and clox). drip-rs has no object list.' },
      { t: 'It walks each arena’s slots, freeing the live ones whose mark bit is false', correct: true, why: 'The arenas already list every object, so no list is needed.' },
      { t: 'It asks Rust to drop everything unreachable', why: 'Rust has no tracing collector; drip-rs is the collector.' },
    ],
  },
  {
    q: 'Why does drip-rs keep its mark bits in a separate `Marks` value instead of in each object?',
    options: [
      { t: 'Marking writes bits while tracing reads objects; keeping them apart means the two never need a borrow of the heap at the same time', correct: true, why: 'This is the reason `gc.rs` gives. It takes the bitmap out of the heap with `std::mem::take` while it fills it in.' },
      { t: 'Bits outside the objects are required by `#![forbid(unsafe_code)]`', why: 'An `is_marked` field would be perfectly safe; it would just fight the borrow checker.' },
      { t: 'To save memory', why: 'It uses a `Vec<bool>`, one byte per slot. The motive is borrowing, not space.' },
    ],
  },
];
