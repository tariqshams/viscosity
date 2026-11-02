// Chapter 133 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from the two old arena chapters.

export const prompts = {
  'arena-what': {
    q: 'What is an **arena**, as drip-rs uses the word?',
    a: 'One `Vec` of slots that owns every object of one kind. Objects refer to each other by slot number, not by pointer.',
  },
  'arena-cycle': {
    q: 'Why can two arena objects point at each other without leaking?',
    a: 'Neither owns the other: each holds only a number, and the arena owns both, so whoever runs the arena (the collector) decides when they go.',
  },
  stale: {
    q: 'An object is freed, its slot is reused, and an old handle to it is used. What happens?',
    a: 'It reads the new object in that slot: the wrong object, but no crash and no undefined behaviour.',
  },
  'copy-out': {
    q: 'You need data from one arena object to change another. What is the usual pattern?',
    a: 'Copy what you need (a handle, a `Value`, a number) out of the first object, let that borrow end, then borrow mutably.',
  },
  'typed-index': {
    q: 'Why wrap a slot number in a type such as `struct NodeId(u32)` instead of using a bare `usize`?',
    a: 'So the compiler rejects using one kind of index where another is expected, such as a block id for a value.',
  },
  'newtype-cost': {
    q: 'How much memory does `struct ValueId(u32)` take, compared with a `u32`?',
    a: 'Exactly the same, 4 bytes: the wrapper exists only for the type checker.',
  },
  phantom: {
    q: 'What does the `PhantomData<fn() -> T>` field in drip-rs’s `Gc<T>` do?',
    a: 'It takes no space but makes the handle’s type mention `T` (E0392 otherwise), so a `Gc<ObjClass>` and a `Gc<ObjClosure>` are different types.',
  },
  'derive-bound': {
    q: 'Why does drip-rs write `impl<T> Copy for Gc<T>` by hand instead of `#[derive(Clone, Copy)]`?',
    a: 'The derive would require `T: Clone` and `T: Copy`, but the handle is copyable whatever `T` is.',
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
    prompt: 'Finish this arena, a simplified version of drip-rs’s. `insert` stores a value and returns its `Id`, reusing a freed slot if there is one. `remove` empties a slot and remembers it as free, but only if it held something. `get` is written for you.',
    starter: `// A typed index into an Arena.
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

    fn insert(&mut self, t: T) -> Id {
        todo!()
    }

    fn remove(&mut self, id: Id)
        -> Option<T> {
        todo!()
    }

    // None if the slot has been freed.
    fn get(&self, id: Id)
        -> Option<&T> {
        let i = id.0 as usize;
        self.slots[i].as_ref()
    }
}`,
    solution: `// A typed index into an Arena.
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

    // None if the slot has been freed.
    fn get(&self, id: Id)
        -> Option<&T> {
        let i = id.0 as usize;
        self.slots[i].as_ref()
    }
}`,
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
        code: `// A typed index into an Arena.
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

    fn insert(&mut self, t: T) -> Id {
        self.slots.push(Some(t));
        Id(self.slots.len() as u32 - 1)
    }

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

    // None if the slot has been freed.
    fn get(&self, id: Id)
        -> Option<&T> {
        let i = id.0 as usize;
        self.slots[i].as_ref()
    }
}`,
        why: 'It never looks at the free list, so freed slots are never reused and the arena only grows. That is drip-rs’s poison mode by accident, not a reusing arena.',
      },
      {
        code: `// A typed index into an Arena.
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

    fn remove(&mut self, id: Id)
        -> Option<T> {
        let i = id.0 as usize;
        self.free.push(id.0);
        self.slots[i].take()
    }

    // None if the slot has been freed.
    fn get(&self, id: Id)
        -> Option<&T> {
        let i = id.0 as usize;
        self.slots[i].as_ref()
    }
}`,
        why: 'Removing an already-empty slot pushes its index a second time. Two later inserts then both get slot 0.',
      },
    ],
  },
  arenaList: {
    lang: 'rust',
    optional: true,
    title: 'A linked list in a Vec',
    prompt: 'Linked lists are awkward with `Box` and `Rc`, and easy with indices. The nodes live in a `Vec<Node>`, and `next` is an `Option<Id>`. Write `push_front`, which adds a node in front of `head` and returns the new head, and `sum`, which follows the `next` links from `head` and adds up the values.',
    starter: `#[derive(Clone, Copy, PartialEq, Debug)]
struct Id(u32);

// A linked list whose nodes live in
// one Vec: nodes[id.0] is node id.
struct Node {
    val: i32,
    next: Option<Id>,
}

fn push_front(nodes: &mut Vec<Node>,
    head: Option<Id>, val: i32) -> Id {
    todo!()
}

fn sum(nodes: &[Node],
    head: Option<Id>) -> i32 {
    todo!()
}`,
    solution: `#[derive(Clone, Copy, PartialEq, Debug)]
struct Id(u32);

// A linked list whose nodes live in
// one Vec: nodes[id.0] is node id.
struct Node {
    val: i32,
    next: Option<Id>,
}

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
        code: `#[derive(Clone, Copy, PartialEq, Debug)]
struct Id(u32);

// A linked list whose nodes live in
// one Vec: nodes[id.0] is node id.
struct Node {
    val: i32,
    next: Option<Id>,
}

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
  graphIds: {
    optional: true,
    lang: 'rust',
    title: 'Typed ids for a graph',
    prompt: 'A graph keeps node names in one `Vec` and edges (pairs of nodes) in another, and hands out typed ids, `NodeId` and `EdgeId`, so the two can never be confused. Write `add_node` and `add_edge`, which store a value and return its id (counting from 0 in each `Vec`), and the two `Index` impls, so that `g[node]` gives a node’s name and `g[edge]` gives an edge’s two ends.',
    starter: `use std::ops::Index;

#[derive(Clone, Copy, PartialEq, Debug)]
struct NodeId(u32);

#[derive(Clone, Copy, PartialEq, Debug)]
struct EdgeId(u32);

struct Graph {
    names: Vec<String>,
    edges: Vec<(NodeId, NodeId)>,
}

impl Graph {
    fn new() -> Self {
        Graph {
            names: Vec::new(),
            edges: Vec::new(),
        }
    }

    fn add_node(&mut self, name: &str)
        -> NodeId {
        todo!()
    }

    fn add_edge(&mut self, a: NodeId,
        b: NodeId) -> EdgeId {
        todo!()
    }
}

impl Index<NodeId> for Graph {
    type Output = String;
    fn index(&self, id: NodeId)
        -> &String {
        todo!()
    }
}

impl Index<EdgeId> for Graph {
    type Output = (NodeId, NodeId);
    fn index(&self, id: EdgeId)
        -> &(NodeId, NodeId) {
        todo!()
    }
}`,
    solution: `use std::ops::Index;

#[derive(Clone, Copy, PartialEq, Debug)]
struct NodeId(u32);

#[derive(Clone, Copy, PartialEq, Debug)]
struct EdgeId(u32);

struct Graph {
    names: Vec<String>,
    edges: Vec<(NodeId, NodeId)>,
}

impl Graph {
    fn new() -> Self {
        Graph {
            names: Vec::new(),
            edges: Vec::new(),
        }
    }

    fn add_node(&mut self, name: &str)
        -> NodeId {
        let s = name.to_string();
        self.names.push(s);
        let n = self.names.len();
        NodeId(n as u32 - 1)
    }

    fn add_edge(&mut self, a: NodeId,
        b: NodeId) -> EdgeId {
        self.edges.push((a, b));
        let n = self.edges.len();
        EdgeId(n as u32 - 1)
    }
}

impl Index<NodeId> for Graph {
    type Output = String;
    fn index(&self, id: NodeId)
        -> &String {
        &self.names[id.0 as usize]
    }
}

impl Index<EdgeId> for Graph {
    type Output = (NodeId, NodeId);
    fn index(&self, id: EdgeId)
        -> &(NodeId, NodeId) {
        &self.edges[id.0 as usize]
    }
}`,
    tests: `#[test]
fn ids_count_from_zero_per_kind() {
    let mut g = Graph::new();
    let a = g.add_node("start");
    let b = g.add_node("end");
    let e = g.add_edge(a, b);
    assert_eq!((a, b), (NodeId(0), NodeId(1)));
    assert_eq!(e, EdgeId(0));
}

#[test]
fn index_by_node_id() {
    let mut g = Graph::new();
    let a = g.add_node("start");
    let b = g.add_node("end");
    assert_eq!(g[a], "start");
    assert_eq!(g[b], "end");
}

#[test]
fn index_by_edge_id() {
    let mut g = Graph::new();
    let a = g.add_node("a");
    let b = g.add_node("b");
    let e1 = g.add_edge(a, b);
    let e2 = g.add_edge(b, a);
    assert_eq!(g[e1], (a, b));
    assert_eq!(g[e2], (b, a));
    let (from, _) = g[e2];
    assert_eq!(g[from], "b");
}`,
    hints: [
      'An id is the position where the value was stored. After pushing onto a `Vec`, that position is `len() - 1`; wrap it in the right id type.',
      '`add_node`: push `name.to_string()` onto `self.names`, then return `NodeId(n as u32 - 1)`, where `n` is the new length. `add_edge` is the same with `self.edges` and `EdgeId`.',
      'Each `index` unwraps the id with `.0`, turns it into a `usize`, and returns a reference into the right `Vec`: `&self.names[id.0 as usize]`.',
    ],
    walkthrough: `**How to think about it.** This is an arena twice over: \`names\` is an arena of strings and \`edges\` an arena of pairs, and an id is a position in one of them. The typed part is that each arena gets its own id type, so a \`NodeId\` can only ever index \`names\` and an \`EdgeId\` only \`edges\`. Implementing \`Index\` twice, once for each id type, is what lets \`g[id]\` pick the right \`Vec\` from the *type* of \`id\` alone.

**The solution, line by line.**

- \`let s = name.to_string(); self.names.push(s);\` stores an owned copy of the name (the graph must own it; the caller's \`&str\` may not live as long).
- \`let n = self.names.len(); NodeId(n as u32 - 1)\`: after the push, the new name sits at \`len - 1\`; \`as u32\` converts the \`usize\` length, and \`NodeId(...)\` stamps the type on it.
- \`self.edges.push((a, b));\` stores the pair in order: from \`a\` to \`b\`. \`NodeId\` is \`Copy\`, so storing it copies the number.
- \`let n = self.edges.len(); EdgeId(n as u32 - 1)\` is the same rule for edges. Node ids and edge ids count separately, so the first edge is \`EdgeId(0)\` however many nodes exist.
- \`impl Index<NodeId> for Graph { type Output = String; ... }\` says "indexing a \`Graph\` with a \`NodeId\` gives a \`String\`". \`type Output\` is the type the indexing produces.
- \`&self.names[id.0 as usize]\` unwraps the id with \`.0\`, makes it a \`usize\`, and returns a reference into the names. (A test compares \`g[a]\` with \`"start"\`, which works because a \`String\` can be compared with a \`&str\`.)
- The \`EdgeId\` impl is the same with \`Output = (NodeId, NodeId)\` and \`self.edges\`.

The last test shows the payoff: \`let (from, _) = g[e2];\` takes an edge apart into node ids, and \`g[from]\` uses one of them as a node id, which is exactly right. Writing \`g[e2]\` where a name was wanted, or \`g[from]\` where an edge was wanted, would be a type error rather than a quiet wrong answer.

**Common wrong attempts.**

- Returning \`NodeId(n as u32)\`: one too high, so \`g[a]\` reads the *next* node's slot (or panics with index out of bounds, as here).
- Storing \`(b, a)\`: the graph's edges point backwards, and \`g[e1]\` no longer equals \`(a, b)\`.
- Using one id type for both: everything still runs, but a node id could then index edges, which is the bug this chapter exists to prevent.`,
    wrong: [
      {
        code: `use std::ops::Index;

#[derive(Clone, Copy, PartialEq, Debug)]
struct NodeId(u32);

#[derive(Clone, Copy, PartialEq, Debug)]
struct EdgeId(u32);

struct Graph {
    names: Vec<String>,
    edges: Vec<(NodeId, NodeId)>,
}

impl Graph {
    fn new() -> Self {
        Graph {
            names: Vec::new(),
            edges: Vec::new(),
        }
    }

    fn add_node(&mut self, name: &str)
        -> NodeId {
        let s = name.to_string();
        self.names.push(s);
        let n = self.names.len();
        NodeId(n as u32)
    }

    fn add_edge(&mut self, a: NodeId,
        b: NodeId) -> EdgeId {
        self.edges.push((a, b));
        let n = self.edges.len();
        EdgeId(n as u32 - 1)
    }
}

impl Index<NodeId> for Graph {
    type Output = String;
    fn index(&self, id: NodeId)
        -> &String {
        &self.names[id.0 as usize]
    }
}

impl Index<EdgeId> for Graph {
    type Output = (NodeId, NodeId);
    fn index(&self, id: EdgeId)
        -> &(NodeId, NodeId) {
        &self.edges[id.0 as usize]
    }
}`,
        why: 'Off by one: the id is the length after the push, one past the new name, so indexing with it reads the wrong slot or panics.',
      },
      {
        code: `use std::ops::Index;

#[derive(Clone, Copy, PartialEq, Debug)]
struct NodeId(u32);

#[derive(Clone, Copy, PartialEq, Debug)]
struct EdgeId(u32);

struct Graph {
    names: Vec<String>,
    edges: Vec<(NodeId, NodeId)>,
}

impl Graph {
    fn new() -> Self {
        Graph {
            names: Vec::new(),
            edges: Vec::new(),
        }
    }

    fn add_node(&mut self, name: &str)
        -> NodeId {
        let s = name.to_string();
        self.names.push(s);
        let n = self.names.len();
        NodeId(n as u32 - 1)
    }

    fn add_edge(&mut self, a: NodeId,
        b: NodeId) -> EdgeId {
        self.edges.push((b, a));
        let n = self.edges.len();
        EdgeId(n as u32 - 1)
    }
}

impl Index<NodeId> for Graph {
    type Output = String;
    fn index(&self, id: NodeId)
        -> &String {
        &self.names[id.0 as usize]
    }
}

impl Index<EdgeId> for Graph {
    type Output = (NodeId, NodeId);
    fn index(&self, id: EdgeId)
        -> &(NodeId, NodeId) {
        &self.edges[id.0 as usize]
    }
}`,
        why: 'The edge is stored backwards, so `g[e1]` is `(b, a)` instead of `(a, b)`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Why does drip-rs keep its objects in arenas instead of `Rc<RefCell<..>>`?',
    options: [
      {
        t: 'Arenas are always faster',
        why: 'Speed is not the reason given; ownership and the collector are.',
      },
      {
        t: 'The heap owns every object, so cycles cannot leak and the collector decides when objects die',
        correct: true,
        why: 'Objects hold numbers, not owners; nothing is reference counted.',
      },
      {
        t: 'Rust forbids `Rc` in libraries',
        why: 'It doesn’t; drip-rs itself uses `Rc<Chunk>`.',
      },
      {
        t: 'Arenas let it use `unsafe` code',
        why: 'drip-rs forbids `unsafe` entirely.',
      },
    ],
  },
  {
    q: 'An arena has slots `[A, None, C]` and free list `[1]`. What does `insert(D)` return?',
    options: [
      {
        t: 'Slot 3, at the end',
        why: 'Only if the free list were empty.',
      },
      {
        t: 'Slot 1, the freed one',
        correct: true,
        why: '`insert` pops the free list first, so D refills the hole.',
      },
      {
        t: 'Slot 0',
        why: 'Slot 0 holds A.',
      },
    ],
  },
  {
    q: '`let src = &insts[1]; let dst = &mut insts[0]; dst.hp += src.hp;` fails with E0502. What is the usual fix?',
    options: [
      {
        t: 'Wrap each instance in a `RefCell`',
        why: 'That moves the check to run time, where it can panic.',
      },
      {
        t: 'Copy the number out first: `let hp = insts[1].hp; insts[0].hp += hp;`',
        correct: true,
        why: 'The shared borrow ends at the semicolon, so the mutable one is allowed.',
      },
      {
        t: 'Use `unsafe` to borrow both',
        why: 'Not needed, and drip-rs forbids it.',
      },
    ],
  },
  {
    q: 'A function takes a `ValueId`, and you pass a `BlockId` holding the same number. What happens?',
    options: [
      {
        t: 'It works, since both hold a `u32`',
        why: 'They are different types, even with the same insides.',
      },
      {
        t: 'It panics when the function runs',
        why: 'The mistake is caught before the program runs.',
      },
      {
        t: 'A compile error: mismatched types',
        correct: true,
        why: 'That is the point of a typed index.',
      },
    ],
  },
  {
    q: 'With `#[derive(Clone, Copy)]` on `Gc<T>`, why does `let a = h; let b = h;` fail for `h: Gc<ObjClass>`?',
    options: [
      {
        t: 'The derive adds `T: Copy`, and `ObjClass` is not `Copy`, so this handle is not `Copy`',
        correct: true,
        why: 'rustc notes that derived `Clone` adds implicit bounds; drip-rs writes the impls by hand.',
      },
      {
        t: 'Handles can never be copied',
        why: 'drip-rs’s handles are `Copy`.',
      },
      {
        t: '`PhantomData` is not `Copy`',
        why: '`PhantomData` is `Copy` whatever it marks.',
      },
    ],
  },
];
