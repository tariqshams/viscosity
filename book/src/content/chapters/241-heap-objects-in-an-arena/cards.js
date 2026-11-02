// Chapter 241 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'oh-arenas': {
    q: 'How many arenas does drip-rs’s `Heap` have, and what decides which one an object goes in?',
    a: 'Eight, one per object type (strings, functions, natives, upvalues, closures, classes, instances, bound methods). The object’s Rust type decides.',
  },
  'oh-no-header': {
    q: 'TypeScript heap objects carry `type`, `isMarked` and `next`. Why do drip-rs objects need none of them?',
    a: 'The arena an object is in says its type, sweep walks the arenas instead of a list, and mark bits live in a separate bitmap.',
  },
  'oh-no-null': {
    q: 'Why is a drip-rs closure’s upvalue list `Vec<Gc<ObjUpvalue>>` with no null entries?',
    a: 'drip-rs captures the upvalues into a `Vec` first and allocates the closure afterwards, so the list is never half-filled.',
  },
  'oh-handle': {
    q: 'What is an object handle in drip-rs?',
    a: 'A `Gc<T>`: a `Copy` slot number in the arena for `T`. `heap[handle]` reads the object; the handle owns nothing.',
  },
  'oh-trait': {
    q: 'What does the `HeapObject` trait tell generic heap code?',
    a: 'Which arena (and which mark bits) belong to each object type, plus the object’s size, so one generic `alloc` and `Index` serve all eight types.',
  },
  'oh-index-sugar': {
    q: 'What does `heap[c]` turn into?',
    a: '`*heap.index(c)`, a call to the `Index` trait’s method. (`IndexMut::index_mut` when it’s written through.)',
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
    a: 'No. The outer `index_mut` borrows the heap mutably while the inner `heap[class]` reads it. Copy `heap[class].name` into a local first.',
  },
  'oh-cost': {
    q: 'At run time, what does `heap[closure]` check?',
    a: 'Only the arena’s work: a bounds check and that the slot isn’t `None`. The arena itself was chosen at compile time from the handle’s type.',
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
      '`Class`’s `arena` returns `&h.classes`, and `arena_mut` returns `&mut h.classes`.',
      'In `alloc`, `T::arena_mut(self)` is the right `Vec` for whatever `T` is. Push, then the new slot is `len() - 1`.',
      '`index` is `&T::arena(self)[h.index as usize]`, and `index_mut` the same with `arena_mut` and `&mut`.',
    ],
    walkthrough: `**Which arena.** \`HeapObject\` is the only place that knows \`Class\` lives in \`classes\`. Everything else is generic over \`T: HeapObject\`, exactly like drip-rs's \`alloc<T: HeapObject>\`.

**alloc.** \`T::arena_mut(self)\` borrows the heap mutably and returns the arena for \`T\`. After \`push\`, the object is at \`len() - 1\`. That number, wrapped in a \`Gc<T>\`, is the handle. Because the arenas are separate, a class and a string can both be slot 0, and the type keeps them apart.

**Index.** \`impl<T: HeapObject> Index<Gc<T>> for Heap\` is one impl for every object type. rustc compiles a copy per type it is used with, so \`heap[c]\` for a \`Gc<Class>\` becomes \`&heap.classes[i]\`, chosen at compile time.

**IndexMut.** Writing \`heap[c].arity += 1\` calls \`index_mut\`. Without it, Rust would reject the assignment: \`Index\` only hands out shared references.

**Reading through two handles.** \`let n = heap[c].name;\` copies a handle out, and the borrow ends at the semicolon. Then \`heap[n].chars\` is a second, separate lookup.`,
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
      '`heap[sup]` and `heap[sub]` both borrow the whole `heap`, so a shared borrow of one can’t be alive while you write the other.',
      'Clone the superclass’s list into a local: `let methods = heap[sup].methods.clone();`. The borrow ends at the semicolon.',
      'Then `heap[sub].methods.extend(methods);`.',
    ],
    walkthrough: `**Why the clone.** \`heap[sup]\` calls \`index(&heap, sup)\`, and the reference it returns keeps \`heap\` borrowed. \`heap[sub]\` for writing calls \`index_mut(&mut heap, sub)\`. The borrow checker sees two borrows of \`heap\`, one mutable, and doesn't know they reach different slots.

**What drip-rs does.** The same thing: \`let methods = self.heap[superclass].methods.clone();\`, then \`self.heap[subclass].methods.add_all(&methods);\`. The clone costs one copy of a small table, once per class declaration.

**Add, don't replace.** Assigning \`heap[sub].methods = ...\` would throw away the subclass's own entries. In drip-rs, \`Inherit\` runs before the subclass's methods are compiled, so they then overwrite inherited ones with the same name (chapter 250).`,
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
      { t: 'Follows a pointer stored in `c`', why: 'A `Gc` holds a slot number, not an address.' },
      { t: 'Checks the object’s `type` field to find the right kind', why: 'Rust objects have no `type` field. The handle’s type picks the arena at compile time.' },
      { t: 'Calls `Index::index`, which reads slot `c.index()` of `heap.closures`', correct: true, why: 'The generic impl uses `ObjClosure::arena(heap)`, which is `&heap.closures`.' },
      { t: 'Searches all eight arenas for the slot', why: 'Only the closure arena is ever looked at.' },
    ],
  },
  {
    q: 'Which of these does a drip-rs `ObjInstance` contain?',
    options: [
      { t: 'A `next` pointer to the previously allocated object', why: 'That is the TypeScript object list. drip-rs sweeps by walking its arenas.' },
      { t: 'An `isMarked` flag', why: 'Mark bits live in a separate `Marks` bitmap.' },
      { t: 'A `Gc<ObjClass>` handle and a field table', correct: true, why: '`ObjInstance { class: Gc<ObjClass>, fields: Table }`, and nothing else.' },
      { t: 'An `Rc<ObjClass>`', why: 'No object owns another. The class is reached through a handle.' },
    ],
  },
  {
    q: 'Why does drip-rs’s heap have one generic `alloc<T: HeapObject>` rather than eight functions like TypeScript’s `newClass`?',
    options: [
      { t: 'Rust doesn’t allow more than one method per struct', why: 'It allows as many as you like.' },
      { t: 'The `HeapObject` trait tells generic code which arena each type uses, so one body works for all', correct: true, why: '`T::arena_mut(self).insert(object)` is the whole job.' },
      { t: 'Generic functions are faster than ordinary ones', why: 'Monomorphized code is as fast as hand-written code, not faster.' },
      { t: 'So that `alloc` can collect garbage first', why: 'The heap’s `alloc` never collects. Callers check `should_collect` first.' },
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
      { t: 'Neither', why: 'B works: the clone ends the shared borrow before the write.' },
      { t: 'B only', correct: true, why: 'This is what drip-rs’s `Inherit` does.' },
    ],
  },
  {
    q: 'What is the run-time cost of choosing the arena in `heap[h]`?',
    options: [
      { t: 'None: rustc compiles a copy of the generic code for each object type, with the arena fixed', correct: true, why: 'What remains is the arena’s own bounds check and `None` check.' },
      { t: 'A virtual call through a trait object', why: 'The trait is used as a generic bound, not as `dyn HeapObject`.' },
      { t: 'A hash lookup by type name', why: 'Nothing is looked up by name. `type_name` is only used in the panic message.' },
      { t: 'A match on a type tag stored in the handle', why: 'A `Gc<T>` is just a `u32`; its type exists only at compile time.' },
    ],
  },
  {
    q: 'A collector bug frees a class that is still in use. What happens the next time drip-rs reads it in a debug or stress run?',
    options: [
      { t: 'It reads whatever object moved into that slot', why: 'In debug and stress modes freed slots are never reused, so nothing moves in.' },
      { t: 'Undefined behaviour', why: 'drip-rs forbids `unsafe`, so a stale handle can’t cause undefined behaviour.' },
      { t: 'The slot is `None`, so `use_after_free` panics with a message naming the type', correct: true, why: 'Something like “use after free: an object of type ObjClass was collected while still in use”.' },
      { t: 'The compiler rejects the program', why: 'Whether a handle is stale is only known at run time.' },
    ],
  },
];
