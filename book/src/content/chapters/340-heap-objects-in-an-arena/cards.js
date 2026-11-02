// Chapter 340 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'oh-arenas': {
    q: 'How many arenas does drip-rs’s `Heap` have, and what decides which one an object goes in?',
    a: 'Nine, one per kind of object (strings, lists, functions, natives, upvalues, closures, classes, instances, bound methods). The object’s Rust type decides.',
  },
  'oh-no-header': {
    q: 'TypeScript heap objects carry `type`, `isMarked` and `next`. Why do drip-rs objects need none of them?',
    a: 'The arena an object is in says its type, the sweep walks the arenas instead of a list, and mark bits live in a separate bitmap.',
  },
  'oh-no-null': {
    q: 'Why does a drip-rs closure’s upvalue list, `Vec<Gc<ObjUpvalue>>`, never hold an empty entry?',
    a: 'drip-rs captures the upvalues into a `Vec` first and allocates the closure afterwards, so the list is never half-filled.',
  },
  'oh-handle': {
    q: 'What is an object handle in drip-rs?',
    a: 'A `Gc<T>`: a `Copy` slot number in the arena for `T`. `heap[handle]` reads the object; the handle owns nothing.',
  },
  'oh-trait': {
    q: 'What does the `HeapObject` trait tell generic heap code?',
    a: 'Which arena (and which mark bits) belong to each object type, and the object’s size, so one generic `alloc` and one `Index` impl serve all nine.',
  },
  'oh-index-sugar': {
    q: 'What does `heap[c]` turn into?',
    a: '`*heap.index(c)`, a call to the `Index` trait’s method (`IndexMut::index_mut` when it is written through).',
  },
  'oh-chain': {
    q: 'How does drip-rs write TypeScript’s `inst.klass.name`?',
    a: '`let class = heap[inst].class;` then `heap[class].name`: one lookup per hop, copying each handle out.',
  },
  'oh-two-objects': {
    q: 'Why does `let from = &heap[a].methods; heap[b].methods.add_all(from);` fail?',
    a: '`heap[...]` borrows the whole heap, so a shared borrow (of `a`’s table) and a mutable one (for `b`) overlap: E0502. Clone the table first.',
  },
  'oh-nested': {
    q: 'Does `heap[heap[class].name].chars.push(\'!\')` compile?',
    a: 'No (E0502). The outer `index_mut` borrows the heap mutably while the inner `heap[class]` reads it. Copy `heap[class].name` into a local first.',
  },
  'oh-cost': {
    q: 'At run time, what does `heap[closure]` check?',
    a: 'Only the arena’s own work: a bounds check, and that the slot is not `None`. The arena itself was chosen at compile time from the handle’s type.',
  },
};

export const examples = {
  'mini-heap': {
    title: 'A two-arena heap with one generic alloc',
    lang: 'rust',
    code: `use std::marker::PhantomData;
use std::ops::{Index, IndexMut};

// A handle: a typed slot number.
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

struct Str {
    chars: String,
}
struct Class {
    name: Gc<Str>,
}

// One arena per kind of object.
#[derive(Default)]
struct Heap {
    strings: Vec<Str>,
    classes: Vec<Class>,
}

trait HeapObject: Sized {
    fn arena(h: &Heap) -> &Vec<Self>;
    fn arena_mut(h: &mut Heap)
        -> &mut Vec<Self>;
}
impl HeapObject for Str {
    fn arena(h: &Heap) -> &Vec<Self> {
        &h.strings
    }
    fn arena_mut(h: &mut Heap)
        -> &mut Vec<Self> {
        &mut h.strings
    }
}
impl HeapObject for Class {
    fn arena(h: &Heap) -> &Vec<Self> {
        &h.classes
    }
    fn arena_mut(h: &mut Heap)
        -> &mut Vec<Self> {
        &mut h.classes
    }
}

impl Heap {
    fn alloc<T: HeapObject>(
        &mut self,
        object: T,
    ) -> Gc<T> {
        let arena = T::arena_mut(self);
        arena.push(object);
        let i = arena.len() - 1;
        Gc {
            index: i as u32,
            marker: PhantomData,
        }
    }
}

impl<T: HeapObject> Index<Gc<T>>
    for Heap
{
    type Output = T;
    fn index(&self, h: Gc<T>) -> &T {
        let i = h.index as usize;
        &T::arena(self)[i]
    }
}
impl<T: HeapObject> IndexMut<Gc<T>>
    for Heap
{
    fn index_mut(&mut self, h: Gc<T>)
        -> &mut T {
        let i = h.index as usize;
        &mut T::arena_mut(self)[i]
    }
}

fn main() {
    let mut heap = Heap::default();
    let chars = String::from("Point");
    let s = Str { chars };
    let name = heap.alloc(s);
    let c = Class { name };
    let class = heap.alloc(c);

    // TypeScript: klass.name.chars
    let n = heap[class].name;
    println!("{}", heap[n].chars);

    // IndexMut: change it in place.
    heap[n].chars.push_str("3D");
    let n = heap[class].name;
    println!("{}", heap[n].chars);
    // Uncomment for E0502:
    // heap[heap[class].name]
    //     .chars.push('!');
}`,
  },
};

export const exercises = {
  heapIndex: {
    lang: 'rust',
    title: 'The heap’s front door',
    prompt: `Here is a two-arena heap in drip-rs's style. \`Gc<T>\` is a typed slot number, each arena is a \`Vec\`, and the \`HeapObject\` trait says which arena belongs to which type. \`Str\` already implements it.

1. Implement \`HeapObject\` for \`Class\`.
2. Write \`alloc\`: push the object onto its arena and return a handle to its slot.
3. Implement \`Index<Gc<T>>\` and \`IndexMut<Gc<T>>\` for \`Heap\`, so \`heap[c].arity\` reads a class and \`heap[c].arity += 1\` changes it.

Each kind counts its slots from 0 on its own: the first class is slot 0 even if strings came first.`,
    starter: `use std::marker::PhantomData;
use std::ops::{Index, IndexMut};

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

struct Str {
    chars: String,
}
struct Class {
    name: Gc<Str>,
    arity: u32,
}

#[derive(Default)]
struct Heap {
    strings: Vec<Str>,
    classes: Vec<Class>,
}

trait HeapObject: Sized {
    fn arena(h: &Heap) -> &Vec<Self>;
    fn arena_mut(h: &mut Heap)
        -> &mut Vec<Self>;
}

impl HeapObject for Str {
    fn arena(h: &Heap) -> &Vec<Self> {
        &h.strings
    }
    fn arena_mut(h: &mut Heap)
        -> &mut Vec<Self> {
        &mut h.strings
    }
}

impl HeapObject for Class {
    fn arena(h: &Heap) -> &Vec<Self> {
        todo!()
    }
    fn arena_mut(h: &mut Heap)
        -> &mut Vec<Self> {
        todo!()
    }
}

impl Heap {
    // Store an object in its arena.
    fn alloc<T: HeapObject>(
        &mut self,
        object: T,
    ) -> Gc<T> {
        todo!()
    }
}

impl<T: HeapObject> Index<Gc<T>>
    for Heap
{
    type Output = T;
    fn index(&self, h: Gc<T>) -> &T {
        todo!()
    }
}

impl<T: HeapObject> IndexMut<Gc<T>>
    for Heap
{
    fn index_mut(&mut self, h: Gc<T>)
        -> &mut T {
        todo!()
    }
}`,
    solution: `use std::marker::PhantomData;
use std::ops::{Index, IndexMut};

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

struct Str {
    chars: String,
}
struct Class {
    name: Gc<Str>,
    arity: u32,
}

#[derive(Default)]
struct Heap {
    strings: Vec<Str>,
    classes: Vec<Class>,
}

trait HeapObject: Sized {
    fn arena(h: &Heap) -> &Vec<Self>;
    fn arena_mut(h: &mut Heap)
        -> &mut Vec<Self>;
}

impl HeapObject for Str {
    fn arena(h: &Heap) -> &Vec<Self> {
        &h.strings
    }
    fn arena_mut(h: &mut Heap)
        -> &mut Vec<Self> {
        &mut h.strings
    }
}

impl HeapObject for Class {
    fn arena(h: &Heap) -> &Vec<Self> {
        &h.classes
    }
    fn arena_mut(h: &mut Heap)
        -> &mut Vec<Self> {
        &mut h.classes
    }
}

impl Heap {
    // Store an object in its arena.
    fn alloc<T: HeapObject>(
        &mut self,
        object: T,
    ) -> Gc<T> {
        let arena = T::arena_mut(self);
        arena.push(object);
        let i = arena.len() - 1;
        Gc {
            index: i as u32,
            marker: PhantomData,
        }
    }
}

impl<T: HeapObject> Index<Gc<T>>
    for Heap
{
    type Output = T;
    fn index(&self, h: Gc<T>) -> &T {
        let i = h.index as usize;
        &T::arena(self)[i]
    }
}

impl<T: HeapObject> IndexMut<Gc<T>>
    for Heap
{
    fn index_mut(&mut self, h: Gc<T>)
        -> &mut T {
        let i = h.index as usize;
        &mut T::arena_mut(self)[i]
    }
}`,
    tests: `fn s(text: &str) -> Str {
    Str { chars: text.to_string() }
}

#[test]
fn handles_count_up_from_zero() {
    let mut heap = Heap::default();
    let a = heap.alloc(s("a"));
    let b = heap.alloc(s("b"));
    assert_eq!((a.index, b.index), (0, 1));
}

#[test]
fn each_kind_has_its_own_arena() {
    let mut heap = Heap::default();
    let name = heap.alloc(s("Point"));
    let other = heap.alloc(s("x"));
    let c = heap.alloc(Class {
        name,
        arity: 0,
    });
    assert_eq!(c.index, 0);
    assert_eq!(other.index, 1);
    assert_eq!(heap.classes.len(), 1);
    assert_eq!(heap.strings.len(), 2);
}

#[test]
fn reads_through_two_handles() {
    let mut heap = Heap::default();
    let name = heap.alloc(s("Point"));
    let c = heap.alloc(Class {
        name,
        arity: 2,
    });
    let n = heap[c].name;
    assert_eq!(heap[n].chars, "Point");
    assert_eq!(heap[c].arity, 2);
}

#[test]
fn writes_through_a_handle() {
    let mut heap = Heap::default();
    let name = heap.alloc(s("Point"));
    let c = heap.alloc(Class {
        name,
        arity: 0,
    });
    heap[c].arity += 1;
    heap[name].chars.push_str("3D");
    assert_eq!(heap[c].arity, 1);
    assert_eq!(heap[name].chars, "Point3D");
}`,
    hints: [
      'Copy `Str`’s `impl HeapObject` and change the field: `Class`’s arena is `h.classes`.',
      'In `alloc`, `T::arena_mut(self)` is the right `Vec` for whatever `T` is. Push the object; its slot is then `len() - 1`. Wrap that in a `Gc { index: i as u32, marker: PhantomData }`.',
      '`index` is `&T::arena(self)[h.index as usize]`, and `index_mut` the same with `arena_mut` and `&mut`. Both impls start `impl<T: HeapObject> ... for Heap`.',
    ],
    walkthrough: `**How to think about it.** Three jobs, all built on one idea: the trait is the only place that knows which \`Vec\` holds which type, and everything else is generic over \`T: HeapObject\`. So write the \`Class\` impl first, by copying the one for \`Str\`; then \`alloc\` and the two index impls never mention a concrete type at all, exactly like drip-rs's \`alloc<T: HeapObject>\` and \`impl<T: HeapObject> Index<Gc<T>> for Heap\`.

**The solution, line by line.**

- \`impl HeapObject for Class {\` says which arena is a class's.
- \`fn arena(h: &Heap) -> &Vec<Self> { &h.classes }\` and \`fn arena_mut(h: &mut Heap) -> &mut Vec<Self> { &mut h.classes }\`: \`Self\` is \`Class\` here, so returning \`&h.strings\` would not even type-check.
- \`fn alloc<T: HeapObject>(&mut self, object: T) -> Gc<T> {\` works for any object type.
- \`let arena = T::arena_mut(self);\` borrows the heap mutably and returns the arena for \`T\`.
- \`arena.push(object);\` moves the object into the arena: from now on the heap owns it.
- \`let i = arena.len() - 1;\` is the slot it landed in, the last one.
- \`Gc { index: i as u32, marker: PhantomData }\` wraps the slot number in a typed handle. Because each arena counts from 0, the first class and the first string are both slot 0, and the type keeps them apart.
- \`impl<T: HeapObject> Index<Gc<T>> for Heap { type Output = T;\` is one impl for every handle type; \`Output\` says what \`heap[h]\` produces.
- \`fn index(&self, h: Gc<T>) -> &T { let i = h.index as usize; &T::arena(self)[i] }\` reads the slot. rustc compiles a copy per type, so for a \`Gc<Class>\` this is \`&self.classes[i]\`.
- \`impl<T: HeapObject> IndexMut<Gc<T>> for Heap\` with \`fn index_mut(&mut self, h: Gc<T>) -> &mut T { ... &mut T::arena_mut(self)[i] }\` is the same for writing; without it, \`heap[c].arity += 1\` is rejected, because \`Index\` only hands out shared references.

The test \`reads_through_two_handles\` is the chain from the chapter: \`let n = heap[c].name;\` copies a handle out (the borrow ends at the semicolon), and \`heap[n].chars\` is a second, separate lookup.

**Common wrong attempts.**

- Taking \`arena.len()\` after the push as the index: that is one past the new object, so the first handle is 1 and reading it goes out of bounds. Use \`len() - 1\`, or read \`len()\` before pushing.
- Returning \`&h.strings\` from \`Class::arena\`: it does not compile, since it is a \`&Vec<Str>\` and the trait promises a \`&Vec<Class>\`. The types catch a mixed-up arena.
- Writing only \`Index\`: the test that does \`heap[c].arity += 1\` fails to compile with E0594, "cannot assign to data in an index of \`Heap\`".`,
    wrong: [
      {
        code: `use std::marker::PhantomData;
use std::ops::{Index, IndexMut};

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

struct Str {
    chars: String,
}
struct Class {
    name: Gc<Str>,
    arity: u32,
}

#[derive(Default)]
struct Heap {
    strings: Vec<Str>,
    classes: Vec<Class>,
}

trait HeapObject: Sized {
    fn arena(h: &Heap) -> &Vec<Self>;
    fn arena_mut(h: &mut Heap)
        -> &mut Vec<Self>;
}

impl HeapObject for Str {
    fn arena(h: &Heap) -> &Vec<Self> {
        &h.strings
    }
    fn arena_mut(h: &mut Heap)
        -> &mut Vec<Self> {
        &mut h.strings
    }
}

impl HeapObject for Class {
    fn arena(h: &Heap) -> &Vec<Self> {
        &h.classes
    }
    fn arena_mut(h: &mut Heap)
        -> &mut Vec<Self> {
        &mut h.classes
    }
}

impl Heap {
    // Store an object in its arena.
    fn alloc<T: HeapObject>(
        &mut self,
        object: T,
    ) -> Gc<T> {
        let arena = T::arena_mut(self);
        arena.push(object);
        let i = arena.len();
        Gc {
            index: i as u32,
            marker: PhantomData,
        }
    }
}

impl<T: HeapObject> Index<Gc<T>>
    for Heap
{
    type Output = T;
    fn index(&self, h: Gc<T>) -> &T {
        let i = h.index as usize;
        &T::arena(self)[i]
    }
}

impl<T: HeapObject> IndexMut<Gc<T>>
    for Heap
{
    fn index_mut(&mut self, h: Gc<T>)
        -> &mut T {
        let i = h.index as usize;
        &mut T::arena_mut(self)[i]
    }
}`,
        why: 'After `push`, `arena.len()` is one past the new object. The first handle is 1, and reading it goes out of bounds. Use `len() - 1` (or take `len()` before pushing).',
      },
      {
        code: `use std::marker::PhantomData;
use std::ops::{Index, IndexMut};

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

struct Str {
    chars: String,
}
struct Class {
    name: Gc<Str>,
    arity: u32,
}

#[derive(Default)]
struct Heap {
    strings: Vec<Str>,
    classes: Vec<Class>,
}

trait HeapObject: Sized {
    fn arena(h: &Heap) -> &Vec<Self>;
    fn arena_mut(h: &mut Heap)
        -> &mut Vec<Self>;
}

impl HeapObject for Str {
    fn arena(h: &Heap) -> &Vec<Self> {
        &h.strings
    }
    fn arena_mut(h: &mut Heap)
        -> &mut Vec<Self> {
        &mut h.strings
    }
}

impl HeapObject for Class {
    fn arena(h: &Heap) -> &Vec<Self> {
        &h.strings
    }
    fn arena_mut(h: &mut Heap)
        -> &mut Vec<Self> {
        &mut h.classes
    }
}

impl Heap {
    // Store an object in its arena.
    fn alloc<T: HeapObject>(
        &mut self,
        object: T,
    ) -> Gc<T> {
        let arena = T::arena_mut(self);
        arena.push(object);
        let i = arena.len() - 1;
        Gc {
            index: i as u32,
            marker: PhantomData,
        }
    }
}

impl<T: HeapObject> Index<Gc<T>>
    for Heap
{
    type Output = T;
    fn index(&self, h: Gc<T>) -> &T {
        let i = h.index as usize;
        &T::arena(self)[i]
    }
}

impl<T: HeapObject> IndexMut<Gc<T>>
    for Heap
{
    fn index_mut(&mut self, h: Gc<T>)
        -> &mut T {
        let i = h.index as usize;
        &mut T::arena_mut(self)[i]
    }
}`,
        why: 'Returning `&h.strings` from `Class::arena` doesn’t compile: it is a `&Vec<Str>`, and the trait promises a `&Vec<Class>`. The types catch a mixed-up arena.',
      },
    ],
  },
  inheritCopy: {
    optional: true,
    lang: 'rust',
    title: 'Copy the methods down',
    prompt: `drip-rs's \`Inherit\` instruction copies every method of the superclass into the subclass, both of which live in the same arena. Write \`inherit\`: add \`sup\`'s methods to the end of \`sub\`'s, keeping \`sub\`'s own. Leave \`sup\` unchanged.

The obvious version, borrowing \`sup\`'s list while writing \`sub\`'s, won't compile. Copy out first.`,
    starter: `use std::ops::{Index, IndexMut};

#[derive(Clone, Copy)]
struct Gc(usize);

struct Class {
    methods: Vec<String>,
}

struct Heap {
    classes: Vec<Class>,
}

impl Index<Gc> for Heap {
    type Output = Class;
    fn index(&self, h: Gc) -> &Class {
        &self.classes[h.0]
    }
}

impl IndexMut<Gc> for Heap {
    fn index_mut(&mut self, h: Gc)
        -> &mut Class {
        &mut self.classes[h.0]
    }
}

// Add sup's methods to sub's.
fn inherit(
    heap: &mut Heap,
    sub: Gc,
    sup: Gc,
) {
    todo!()
}`,
    solution: `use std::ops::{Index, IndexMut};

#[derive(Clone, Copy)]
struct Gc(usize);

struct Class {
    methods: Vec<String>,
}

struct Heap {
    classes: Vec<Class>,
}

impl Index<Gc> for Heap {
    type Output = Class;
    fn index(&self, h: Gc) -> &Class {
        &self.classes[h.0]
    }
}

impl IndexMut<Gc> for Heap {
    fn index_mut(&mut self, h: Gc)
        -> &mut Class {
        &mut self.classes[h.0]
    }
}

// Add sup's methods to sub's.
fn inherit(
    heap: &mut Heap,
    sub: Gc,
    sup: Gc,
) {
    let methods = heap[sup]
        .methods
        .clone();
    heap[sub].methods.extend(methods);
}`,
    tests: `fn class(ms: &[&str]) -> Class {
    let methods = ms
        .iter()
        .map(|m| m.to_string())
        .collect();
    Class { methods }
}

fn shapes() -> Heap {
    Heap {
        classes: vec![
            class(&["area", "init"]),
            class(&["draw"]),
        ],
    }
}

#[test]
fn copies_the_methods_down() {
    let mut heap = shapes();
    inherit(&mut heap, Gc(1), Gc(0));
    assert!(heap[Gc(1)]
        .methods
        .contains(&"area".to_string()));
}

#[test]
fn adds_instead_of_replacing() {
    let mut heap = shapes();
    inherit(&mut heap, Gc(1), Gc(0));
    assert_eq!(heap[Gc(1)].methods,
        ["draw", "area", "init"]);
}

#[test]
fn leaves_the_superclass_alone() {
    let mut heap = shapes();
    inherit(&mut heap, Gc(1), Gc(0));
    assert_eq!(heap[Gc(0)].methods,
        ["area", "init"]);
}`,
    hints: [
      '`heap[sup]` and `heap[sub]` both borrow the whole `heap`, so a shared borrow of one cannot still be alive while you write the other.',
      'Clone the superclass’s list into a local: `let methods = heap[sup].methods.clone();`. The borrow ends at the semicolon.',
      'Then add, rather than replace: `heap[sub].methods.extend(methods);`.',
    ],
    walkthrough: `**How to think about it.** You need to read one object and write another in the same heap. Every \`heap[...]\` borrows the whole heap, so the read must be completely finished, with nothing still pointing into the heap, before the write starts. The way to finish a read is to copy (or clone) what you read into a value of your own.

**The solution, line by line.**

- \`fn inherit(heap: &mut Heap, sub: Gc, sup: Gc) {\` takes the heap mutably and two handles, which are \`Copy\`.
- \`let methods = heap[sup].methods.clone();\` reads the superclass (\`index\` borrows \`heap\` shared), clones its list into a new \`Vec<String>\` owned by \`methods\`, and the shared borrow ends at the semicolon.
- \`heap[sub].methods.extend(methods);\` now borrows \`heap\` mutably through \`index_mut\`, and moves the cloned names onto the end of the subclass's list, keeping its own.

drip-rs's \`Inherit\` instruction does the same: \`let methods = self.heap[superclass].methods.clone();\`, then \`self.heap[subclass].methods.add_all(&methods);\`. The clone is one copy of a small table, once per class declaration. (Because \`Inherit\` runs before the subclass's own methods are added, those then overwrite inherited ones with the same name; the chapter *extends and super in Rust* comes back to this.)

**Common wrong attempts.**

- \`let from = &heap[sup].methods; heap[sub].methods.extend(from.iter().cloned());\`: E0502, because \`from\` keeps \`heap\` borrowed while \`heap[sub]\` needs it mutably. The borrow checker sees two borrows of \`heap\`, not of two different slots.
- \`heap[sub].methods = heap[sup].methods.clone();\`: it compiles (the right side is evaluated first), but it throws away the subclass's own methods instead of adding to them.`,
    wrong: [
      {
        code: `use std::ops::{Index, IndexMut};

#[derive(Clone, Copy)]
struct Gc(usize);

struct Class {
    methods: Vec<String>,
}

struct Heap {
    classes: Vec<Class>,
}

impl Index<Gc> for Heap {
    type Output = Class;
    fn index(&self, h: Gc) -> &Class {
        &self.classes[h.0]
    }
}

impl IndexMut<Gc> for Heap {
    fn index_mut(&mut self, h: Gc)
        -> &mut Class {
        &mut self.classes[h.0]
    }
}

// Add sup's methods to sub's.
fn inherit(
    heap: &mut Heap,
    sub: Gc,
    sup: Gc,
) {
    let methods = &heap[sup].methods;
    heap[sub].methods.extend(
        methods.iter().cloned(),
    );
}`,
        why: 'E0502: `methods` borrows `heap` (through `heap[sup]`) while `heap[sub]` needs it mutably. Clone the list into a local first.',
      },
      {
        code: `use std::ops::{Index, IndexMut};

#[derive(Clone, Copy)]
struct Gc(usize);

struct Class {
    methods: Vec<String>,
}

struct Heap {
    classes: Vec<Class>,
}

impl Index<Gc> for Heap {
    type Output = Class;
    fn index(&self, h: Gc) -> &Class {
        &self.classes[h.0]
    }
}

impl IndexMut<Gc> for Heap {
    fn index_mut(&mut self, h: Gc)
        -> &mut Class {
        &mut self.classes[h.0]
    }
}

// Add sup's methods to sub's.
fn inherit(
    heap: &mut Heap,
    sub: Gc,
    sup: Gc,
) {
    heap[sub].methods =
        heap[sup].methods.clone();
}`,
        why: 'It compiles, because the right side is evaluated and cloned first, but it replaces the subclass’s own methods instead of adding to them.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In drip-rs, what does `heap[c]` do when `c: Gc<ObjClosure>`?',
    options: [
      { t: 'Follows an address stored in `c`', why: 'A `Gc` holds a slot number, not an address.' },
      { t: 'Calls `Index::index`, which reads slot `c.index()` of `heap.closures`', correct: true, why: 'The generic impl uses `ObjClosure::arena(heap)`, which is `&heap.closures`.' },
      { t: 'Checks the object’s `type` field to find the right kind', why: 'drip-rs objects have no `type` field. The handle’s type picks the arena at compile time.' },
      { t: 'Searches all nine arenas for the slot', why: 'Only the closures arena is ever looked at.' },
    ],
  },
  {
    q: 'Which of these does a drip-rs `ObjInstance` contain?',
    options: [
      { t: 'A `next` reference to the previously allocated object', why: 'That is the TypeScript object list. drip-rs sweeps by walking its arenas.' },
      { t: 'An `isMarked` flag', why: 'Mark bits live in a separate bitmap.' },
      { t: 'An `Rc<ObjClass>`', why: 'No object owns another. The class is reached through a handle.' },
      { t: 'A `Gc<ObjClass>` handle, a field table and the order the fields were first set', correct: true, why: '`ObjInstance { class, fields, field_order }`, and nothing else.' },
    ],
  },
  {
    q: 'Why does drip-rs’s heap have one generic `alloc<T: HeapObject>` rather than a constructor per kind, like TypeScript’s `newClass`?',
    options: [
      { t: 'The `HeapObject` trait tells generic code which arena each type uses, so one body works for all', correct: true, why: '`T::arena_mut(self).insert(object)` is the whole job.' },
      { t: 'Rust allows only one method per struct', why: 'It allows as many as you like.' },
      { t: 'Generic functions run faster than ordinary ones', why: 'A generic function compiled for one type is as fast as hand-written code, not faster.' },
      { t: 'So that `alloc` can collect garbage first', why: 'The heap’s `alloc` never collects; callers ask `should_collect` first.' },
    ],
  },
  {
    q: `Which version compiles?
\`\`\`rust
// A
let from = &heap[sup].methods;
heap[sub].methods.add_all(from);
// B
let m = heap[sup].methods.clone();
heap[sub].methods.add_all(&m);
\`\`\``,
    options: [
      { t: 'A only', why: 'A keeps `heap` borrowed through `from` while `heap[sub]` borrows it mutably: E0502.' },
      { t: 'Both, because `sup` and `sub` are different slots', why: 'The borrow checker sees two borrows of `heap`, not of slots.' },
      { t: 'B only', correct: true, why: 'The clone ends the shared borrow before the write. This is what drip-rs’s `Inherit` does.' },
    ],
  },
  {
    q: 'A collector bug frees a class that is still in use. What happens the next time drip-rs reads it in a debug or stress run?',
    options: [
      { t: 'It reads whatever object moved into that slot', why: 'In debug and stress modes freed slots are never reused, so nothing moves in.' },
      { t: 'Undefined behaviour', why: 'drip-rs forbids `unsafe`, so a stale handle cannot cause undefined behaviour.' },
      { t: 'The slot is `None`, so `use_after_free` panics with a message naming the type', correct: true, why: '“use after free: an object of type ObjClass was collected while still in use”.' },
      { t: 'The compiler rejects the program', why: 'Whether a handle is stale is only known at run time.' },
    ],
  },
];
