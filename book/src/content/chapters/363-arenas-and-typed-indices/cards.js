// Chapter 363 cards. Keys are stable ids: never rename them.

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
  'arena-cycle': {
    q: 'Why can two arena objects point at each other without leaking?',
    a: 'Neither owns the other: each holds only a number, and the arena owns both, so whoever runs the arena (the collector) decides when they go.',
  },
  stale: {
    q: 'An object is freed, its slot is reused, and an old handle to it is used. What happens?',
    a: 'It reads the new object in that slot: the wrong object, but no crash and no undefined behaviour.',
  },
  'poison-mode': {
    q: 'Why do drip-rs’s debug and stress modes never reuse a freed slot?',
    a: 'Then a stale handle finds `None` and panics with “use after free”, so a missing GC root fails loudly at the exact use.',
  },
  'copy-out': {
    q: 'You need data from one arena object to change another. What is the usual pattern?',
    a: 'Copy what you need (a handle, a `Value`, a number) out of the first object, let that borrow end, then borrow mutably.',
  },
  'ts-vs-rs': {
    q: 'Where does the TypeScript VM keep each object’s mark bit, and where does drip-rs?',
    a: 'TypeScript: an `isMarked` field in every object. drip-rs: a separate bitmap, one `Vec<bool>` per arena, built fresh each collection.',
  },
  'arena-sweep': {
    q: 'How does drip-rs’s sweep find every object, without a linked list of them?',
    a: 'It walks each arena’s slots, since an arena already holds every object of its kind, and frees the live ones that are not marked.',
  },
};

export const examples = {
  'arena-cycle': {
    lang: 'rust',
    title: 'A cycle that is only numbers',
    code: `// Objects refer to each other by slot
// number, so a cycle is two numbers.
struct Node {
    name: &'static str,
    other: Option<usize>,
}

type Arena = Vec<Option<Node>>;

fn get(arena: &Arena, i: usize)
    -> &Node {
    arena[i].as_ref().expect("freed")
}

fn main() {
    let mut arena: Arena = Vec::new();
    let mut free = Vec::new();
    // a (slot 0) and b (slot 1) point
    // at each other.
    arena.push(Some(Node {
        name: "a",
        other: Some(1),
    }));
    arena.push(Some(Node {
        name: "b",
        other: Some(0),
    }));
    // Follow a's link: copy a number.
    let j = get(&arena, 0)
        .other
        .unwrap();
    let n = get(&arena, j).name;
    println!("a -> {n}");
    // Free both: no counts, no leak.
    for i in [0, 1] {
        arena[i] = None;
        free.push(i);
    }
    // A new object reuses a freed slot.
    let s = free.pop().unwrap();
    arena[s] = Some(Node {
        name: "c",
        other: None,
    });
    let n = get(&arena, s).name;
    println!("slot {s}: {n}");
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
    walkthrough: `**How to think about it.** An arena has two jobs: hand out a slot for a new object, and take an object back. The free list is a stack of slot numbers that are empty right now. So \`insert\` should ask "is there an empty slot I can reuse?" before growing the \`Vec\`, and \`remove\` should empty the slot and remember its number, but only if there was something in it.

**The solution, line by line.**

- \`let f = self.free.pop();\` takes the most recently freed slot number, if there is one; \`pop\` returns an \`Option<u32>\`.
- \`if let Some(i) = f {\` runs its block only when there was a free slot.
- \`let i = i as usize;\` turns the stored \`u32\` into a \`usize\`, the type \`Vec\` indexes with.
- \`self.slots[i] = Some(t);\` puts the new object into the empty slot (the arena now owns it), and \`return Id(i as u32);\` hands back that slot's number.
- \`self.slots.push(Some(t));\` is reached only when nothing was free: a new slot at the end.
- \`Id(self.slots.len() as u32 - 1)\`: after the push, the new slot's index is the length minus one.
- In \`remove\`, \`let t = self.slots[i].take();\`: \`Option::take\` leaves \`None\` in the slot and returns what was there. That one call both frees the object from the arena (the caller now owns it, and drops it) and marks the slot empty, so \`get\` returns \`None\`.
- \`if t.is_some() { self.free.push(id.0); }\` remembers the slot as free, but only if it really held something.
- \`t\` returns the removed object, or \`None\` if the slot was already empty.

**Why the guard matters.** Without \`if t.is_some()\`, removing the same id twice puts its number on the free list twice, and two later inserts both get that slot: two live ids for one place, with the second object silently replacing the first. The last test catches exactly that.

**Common wrong attempts.**

- Never looking at the free list in \`insert\`: freed slots are never reused and the arena only grows. (That is drip-rs's "poison" test mode by accident, not a reusing arena.)
- Pushing onto \`free\` before checking what \`take\` returned: the double-free bug above.
- Returning \`Id(self.slots.len() as u32)\` after the push: one too high, so the id points past the end.

In drip-rs, \`remove\` takes one more argument, \`reuse\`. The debug and stress modes pass \`false\`, so a freed slot is never reused and a stale handle panics with "use after free" at the exact place it is used.`,
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
    walkthrough: `**How to think about it.** A linked list with \`Box\` makes each node own the next one, which makes inserting and walking awkward in Rust. With an arena, every node lives in one \`Vec\`, and "next" is just the *number* of the next node. Adding to the front means: make a node whose \`next\` is the old head's number, and the new node's own number is the new head. Walking means: start at the head's number and keep reading the node at that number until there is no next.

**The solution, line by line.**

- \`let n = Node { val, next: head };\` makes the new node; \`val\` is shorthand for \`val: val\`, and \`next\` holds the old head's id (or \`None\` for an empty list).
- \`nodes.push(n);\` moves it into the arena.
- \`Id(nodes.len() as u32 - 1)\` returns the new node's slot number: it is the new head.
- In \`sum\`, \`let mut total = 0;\` and \`let mut at = head;\` start a running total and a cursor of type \`Option<Id>\`.
- \`while let Some(id) = at {\` keeps going while the cursor points at a node.
- \`let n = &nodes[id.0 as usize];\` borrows the node at that slot; \`total += n.val;\` adds its value.
- \`at = n.next;\` moves the cursor. \`Id\` is \`Copy\`, so this copies a number; no borrow of the old node is kept, and the borrow checker is happy because only \`nodes\` is ever borrowed.
- \`total\` is returned at the end.

This is the pointer chasing of a linked list, with numbers instead of addresses.

**Common wrong attempts.**

- Setting \`next: None\` in \`push_front\`: every node becomes a list of one, and \`sum\` from the head only sees the last value pushed.
- Returning \`Id(nodes.len() as u32)\`: one past the new node.
- Looping with \`loop\` and \`unwrap()\` on \`at\`: the last node's \`next\` is \`None\`, so \`unwrap\` panics instead of stopping.`,
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
    q: 'Why does drip-rs keep its objects in arenas instead of `Rc<RefCell<..>>`?',
    options: [
      { t: 'Arenas are always faster', why: 'Speed is not the reason given; ownership and the collector are.' },
      { t: 'The heap owns every object, so cycles cannot leak and the collector decides when objects die', correct: true, why: 'Objects hold numbers, not owners; nothing is reference counted.' },
      { t: 'Rust forbids `Rc` in libraries', why: 'It doesn’t; drip-rs itself uses `Rc<Chunk>`.' },
      { t: 'Arenas let it use `unsafe` code', why: 'drip-rs forbids `unsafe` entirely.' },
    ],
  },
  {
    q: 'An arena has slots `[A, None, C]` and free list `[1]`. What does `insert(D)` return?',
    options: [
      { t: 'Slot 3, at the end', why: 'Only if the free list were empty.' },
      { t: 'Slot 1, the freed one', correct: true, why: '`insert` pops the free list first, so D refills the hole.' },
      { t: 'Slot 0', why: 'Slot 0 holds A.' },
    ],
  },
  {
    q: 'An old handle points at a slot that was freed and then reused. In a release run with reuse on, what does reading it give?',
    options: [
      { t: 'A crash', why: 'The slot holds a valid object, just not the one you meant.' },
      { t: 'Undefined behaviour, as with a dangling pointer in C', why: 'Safe Rust: the Vec index is checked, the memory is valid.' },
      { t: 'A compile error', why: 'Handles are numbers; the compiler can’t know one is stale.' },
      { t: 'The new object that moved into the slot', correct: true, why: 'Wrong but safe, which is why test modes turn reuse off.' },
    ],
  },
  {
    q: '`let src = &insts[1]; let dst = &mut insts[0]; dst.hp += src.hp;` fails with E0502. What is the usual fix?',
    options: [
      { t: 'Wrap each instance in a `RefCell`', why: 'That moves the check to run time, where it can panic.' },
      { t: 'Copy the number out first: `let hp = insts[1].hp; insts[0].hp += hp;`', correct: true, why: 'The shared borrow ends at the semicolon, so the mutable one is allowed.' },
      { t: 'Use `unsafe` to borrow both', why: 'Not needed, and drip-rs forbids it.' },
    ],
  },
  {
    q: 'How does drip-rs’s sweep visit every object?',
    options: [
      { t: 'By walking each arena’s slots', correct: true, why: 'An arena already holds every object of its kind, so no `next` list is needed.' },
      { t: 'By following a `next` pointer stored in every object', why: 'That is the TypeScript VM’s object list.' },
      { t: 'By asking each `Rc` for its count', why: 'There are no counts; the objects are not reference counted.' },
    ],
  },
];
