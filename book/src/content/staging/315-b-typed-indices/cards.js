// Chapter 315-b cards. Keys are stable ids: never rename them.

const DEFS = `use std::ops::Index;

#[derive(Clone, Copy, PartialEq, Debug)]
struct NodeId(u32);

#[derive(Clone, Copy, PartialEq, Debug)]
struct EdgeId(u32);

struct Graph {
    names: Vec<String>,
    edges: Vec<(NodeId, NodeId)>,
}
`;

const ADD = (n = 'NodeId(n as u32 - 1)', pair = '(a, b)') => `impl Graph {
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
        ${n}
    }

    fn add_edge(&mut self, a: NodeId,
        b: NodeId) -> EdgeId {
        self.edges.push(${pair});
        let n = self.edges.len();
        EdgeId(n as u32 - 1)
    }
}
`;

const IDX = `impl Index<NodeId> for Graph {
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
}`;

export const prompts = {
  'typed-index': {
    q: 'Why wrap a slot number in a type such as `struct NodeId(u32)` instead of using a bare `usize`?',
    a: 'So the compiler rejects using one kind of index where another is expected, such as a block id for a value.',
  },
  'newtype-cost': {
    q: 'How much memory does `struct ValueId(u32)` take, compared with a `u32`?',
    a: 'Exactly the same, 4 bytes: the wrapper exists only for the type checker.',
  },
  'vir-ids': {
    q: 'Name engine/rust’s four VIR id types.',
    a: '`ValueId`, `BlockId`, `FuncId` and `BindingId`, each a `u32` in its own newtype, made by the `id_type!` macro.',
  },
  phantom: {
    q: 'What does the `PhantomData<fn() -> T>` field in drip-rs’s `Gc<T>` do?',
    a: 'It takes no space but makes the handle’s type mention `T` (E0392 otherwise), so a `Gc<ObjClass>` and a `Gc<ObjClosure>` are different types.',
  },
  'gc-size': {
    q: 'How big is a drip-rs `Gc<T>`, and is it `Copy`?',
    a: '4 bytes (a `u32`), and yes: copying a handle copies a number and creates no owner.',
  },
  'derive-bound': {
    q: 'Why does drip-rs write `impl<T> Copy for Gc<T>` by hand instead of `#[derive(Clone, Copy)]`?',
    a: 'The derive would require `T: Clone` and `T: Copy`, but the handle is copyable whatever `T` is.',
  },
  'index-trait': {
    q: 'What makes `arena[handle]` call drip-rs’s own code?',
    a: 'The arena implements the standard `Index` trait for `Gc<T>`, and `x[i]` is a call to `Index::index`.',
  },
  'ts-brand': {
    q: 'How does TypeScript get the effect of a newtype index?',
    a: 'With a branded type such as `number & { readonly __brand: \'NodeId\' }`, since its types are structural and plain aliases would mix.',
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
  graphIds: {
    lang: 'rust',
    title: 'Typed ids for a graph',
    prompt:
      'A graph keeps node names in one `Vec` and edges (pairs of nodes) in another, and hands out typed ids, `NodeId` and `EdgeId`, so the two can never be confused. Write `add_node` and `add_edge`, which store a value and return its id (counting from 0 in each `Vec`), and the two `Index` impls, so that `g[node]` gives a node’s name and `g[edge]` gives an edge’s two ends.',
    starter: `${DEFS}
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
    solution: `${DEFS}
${ADD()}
${IDX}`,
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
        code: `${DEFS}
${ADD('NodeId(n as u32)')}
${IDX}`,
        why: 'Off by one: the id is the length after the push, one past the new name, so indexing with it reads the wrong slot or panics.',
      },
      {
        code: `${DEFS}
${ADD(undefined, '(b, a)')}
${IDX}`,
        why: 'The edge is stored backwards, so `g[e1]` is `(b, a)` instead of `(a, b)`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does `struct BlockId(u32)` cost at run time compared with a bare `u32`?',
    options: [
      { t: 'Nothing: same size, same layout; only the type checker sees the difference', correct: true, why: '`size_of` gives 4 bytes for both.' },
      { t: 'An extra word for the type tag', why: 'Rust stores no type tags in plain structs.' },
      { t: 'A heap allocation', why: 'A newtype is stored inline, like the number inside it.' },
    ],
  },
  {
    q: 'A function takes a `ValueId`, and you pass a `BlockId` holding the same number. What happens?',
    options: [
      { t: 'It works, since both hold a `u32`', why: 'They are different types, even with the same insides.' },
      { t: 'It panics when the function runs', why: 'The mistake is caught before the program runs.' },
      { t: 'A compile error: mismatched types', correct: true, why: 'That is the point of a typed index.' },
    ],
  },
  {
    q: 'Why does `struct Gc<T> { index: u32 }` fail to compile?',
    options: [
      { t: '`u32` cannot be an index', why: 'It can; drip-rs uses one.' },
      { t: 'Generic structs need `#[derive]`', why: 'No derive is required.' },
      { t: 'Structs cannot be generic', why: 'They can, as `Vec<T>` shows.' },
      { t: 'E0392: `T` is never used; a `PhantomData` field fixes it', correct: true, why: 'The marker mentions `T` without taking any space.' },
    ],
  },
  {
    q: 'With `#[derive(Clone, Copy)]` on `Gc<T>`, why does `let a = h; let b = h;` fail for `h: Gc<ObjClass>`?',
    options: [
      { t: 'The derive adds `T: Copy`, and `ObjClass` is not `Copy`, so this handle is not `Copy`', correct: true, why: 'rustc notes that derived `Clone` adds implicit bounds; drip-rs writes the impls by hand.' },
      { t: 'Handles can never be copied', why: 'drip-rs’s handles are `Copy`.' },
      { t: '`PhantomData` is not `Copy`', why: '`PhantomData` is `Copy` whatever it marks.' },
    ],
  },
  {
    q: 'How does TypeScript usually stop a `NodeId` and a plain `number` being mixed?',
    options: [
      { t: 'It can’t; every number is interchangeable', why: 'A branded type does it.' },
      { t: 'A branded type: `number & { readonly __brand: \'NodeId\' }`', correct: true, why: 'Structural types need a made-up property to tell aliases apart.' },
      { t: 'A class with a private constructor is the only way', why: 'That works too, but costs an object per id; brands cost nothing.' },
      { t: 'By declaring `type NodeId = number`', why: 'A plain alias is the same type as `number`.' },
    ],
  },
];
