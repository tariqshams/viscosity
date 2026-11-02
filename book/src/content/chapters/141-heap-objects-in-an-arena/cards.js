// Chapter 74 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.
// Merged from old chapters 141, 141, 141.

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
  'rvl-objlist': {
    q: 'What is a Drip list in drip-rs, in Rust types?',
    a: 'An `ObjList { items: Vec<Value> }` in the heap’s `lists` arena; a list value is `Value::List(Gc<ObjList>)`.',
  },
  'rvl-same-list': {
    q: 'After `let ys = xs; push(ys, 1);`, why is `xs` longer too?',
    a: 'The assignment copies the `Gc<ObjList>` handle, not the list: both names hold the same slot number, so they share one `Vec`.',
  },
  'rvl-build-order': {
    q: 'In `OpCode::List`, in what order do `to_vec`, `alloc` and `truncate` happen?',
    a: '`to_vec` copies the top `n` values, `alloc` stores the new list, and only then does `truncate` drop the elements from the stack.',
  },
  'rvl-on-stack': {
    q: 'Why must the elements still be on the stack while `alloc` runs?',
    a: '`alloc` may collect first, and the new `Vec` is only a local the collector cannot see; the stack is a root, so the elements’ objects survive.',
  },
  'rvl-check-order': {
    q: 'In what order does `check_index` check, and what does `"abc"[1.5]` report?',
    a: 'A list, then a number, then a whole number, then in range. `"abc"[1.5]` fails the first: `cannot index a string`.',
  },
  'rvl-cast': {
    q: 'Why must `check_index` reject `-1` and `1.5` before it writes `i as usize`?',
    a: 'A float-to-integer `as` never fails: it rounds towards zero and saturates, so `-1.0 as usize` is 0 and `1.5 as usize` is 1, silently.',
  },
  'rvl-trace': {
    q: 'How does the collector keep a list’s elements alive?',
    a: '`Gray::List(l) => self.lists[l].items.trace(marks)`: tracing the `Vec` marks the object each element’s handle names.',
  },
  'rvl-size': {
    q: 'How many bytes does drip-rs’s heap count for a list of a million elements?',
    a: '24, `size_of::<ObjList>()`: the `Vec`’s header only. The elements’ block is not counted when pacing collections.',
  },
  'si-hash-twice': {
    q: 'Where does drip-rs store a string’s hash?',
    a: 'Twice: in the `ObjString`, and in every `StrRef` handle to it, beside the `Gc<ObjString>`.',
  },
  'si-no-heap': {
    q: 'Why does it matter that `Table::set` doesn’t need the heap?',
    a: 'Tables live inside heap objects. `heap[instance].fields.set(...)` already borrows the heap mutably, so `set` could not also borrow the strings arena (E0502).',
  },
  'si-box-str': {
    q: 'Why is `ObjString::chars` a `Box<str>` rather than a `String`?',
    a: 'An interned string never grows, so it needs no capacity field: `Box<str>` is 16 bytes, `String` 24.',
  },
  'si-interner': {
    q: 'What does `Heap::intern(chars)` do?',
    a: 'Hashes the text, probes the `interned` table for a string with that hash and those characters, and returns it; if there is none, allocates one and adds it.',
  },
  'si-disjoint': {
    q: 'Why may `intern` call `self.interned.find_string(&self.strings, ...)`?',
    a: 'Inside the heap’s own method, rustc sees two different fields, `interned` and `strings`, and lets them be borrowed separately.',
  },
  'si-owned': {
    q: 'Why does `Vm::add` call `intern_owned(String)` for the result of `+`?',
    a: 'It hands over the string it just built, so the heap can keep that allocation. `intern(&str)` has to copy the text.',
  },
  'si-fnv': {
    q: 'What does `hash.wrapping_mul(16_777_619)` correspond to in the TypeScript VM?',
    a: '`Math.imul(h, 16777619)`: a 32-bit multiply that keeps the low 32 bits.',
  },
  'si-tombstone': {
    q: 'How does drip-rs’s table tell an empty slot from a tombstone?',
    a: 'Both have key `None`. An empty slot has value `Value::None`; a tombstone has `Value::Bool(true)`.',
  },
  'si-first-tomb': {
    q: 'Why does `find` use `tombstone.get_or_insert(index)`?',
    a: 'To remember the first tombstone passed. If the key turns out to be absent, `set` reuses that slot.',
  },
  'si-columns': {
    q: 'Measured on rustc 1.97 here, how big is a table slot as two columns, and as one pair?',
    a: '28 bytes as columns (12 for `Option<StrRef>` plus 16 for `Value`); 32 as `(Option<StrRef>, Value)`, because of padding.',
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
  'lists-rs': {
    lang: 'drip-vm',
    title: 'One list, two names',
    code: `let xs = [10, 20];
push(xs, 30);
xs[0] = 7;
let ys = xs;
push(ys, 40);
print len(xs);
print pop(xs);
print xs;`,
  },
  'interning-drip': {
    lang: 'drip-vm',
    title: 'Equal text, one string',
    code: `let a = "drip";
let b = "dr" + "ip";
print a == b;
print str(4) + str(2) == "42";
print len("héllo");
let words = [a, b];
print words;`,
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
  checkIndex: {
    lang: 'rust',
    title: 'check_index',
    prompt: `Write drip-rs’s \`check_index\` for this small VM, as a free function. A list value is \`Value::List(h)\`, where \`h\` is the list’s slot in \`lists\`. Return \`Ok((h, i))\` with the element index as a \`usize\`, or \`Err\` with Drip’s exact message, checking in this order:

1. not a list: \`cannot index a string\` (use \`describe\`);
2. not a number: \`a list index must be a number, not a string\`;
3. not a whole number: \`index 1.5 is not a whole number\`;
4. out of range: \`index 3 is out of range for a list of length 3\`.

Format numbers with \`{i}\`: Rust prints \`3.0\` as \`3\` and \`-1.0\` as \`-1\`, as Drip does.`,
    starter: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    None,
    Number(f64),
    Str,
    // A handle: the list's slot number.
    List(usize),
}

fn describe(v: Value) -> &'static str {
    match v {
        Value::None => "none",
        Value::Number(_) => "a number",
        Value::Str => "a string",
        Value::List(_) => "a list",
    }
}

// The list's slot and the element's
// index, or Drip's error message.
type R = Result<(usize, usize), String>;

fn check_index(
    lists: &[Vec<Value>],
    list: Value,
    index: Value,
) -> R {
    todo!()
}`,
    solution: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    None,
    Number(f64),
    Str,
    // A handle: the list's slot number.
    List(usize),
}

fn describe(v: Value) -> &'static str {
    match v {
        Value::None => "none",
        Value::Number(_) => "a number",
        Value::Str => "a string",
        Value::List(_) => "a list",
    }
}

// The list's slot and the element's
// index, or Drip's error message.
type R = Result<(usize, usize), String>;

fn check_index(
    lists: &[Vec<Value>],
    list: Value,
    index: Value,
) -> R {
    let Value::List(h) = list else {
        let d = describe(list);
        return Err(format!(
            "cannot index {d}"));
    };
    let Value::Number(i) = index else {
        let d = describe(index);
        return Err(format!(
            "a list index must be a \\
             number, not {d}"));
    };
    if i.fract() != 0.0
        || !i.is_finite()
    {
        return Err(format!(
            "index {i} is not a \\
             whole number"));
    }
    let len = lists[h].len();
    if i < 0.0 || i >= len as f64 {
        return Err(format!(
            "index {i} is out of \\
             range for a list of \\
             length {len}"));
    }
    Ok((h, i as usize))
}`,
    tests: `fn lists() -> Vec<Vec<Value>> {
    let xs = vec![
        Value::Number(10.0),
        Value::Number(20.0),
        Value::Number(30.0),
    ];
    vec![xs]
}

fn check(list: Value, index: Value) -> R {
    check_index(&lists(), list, index)
}

fn num(n: f64) -> Value {
    Value::Number(n)
}

#[test]
fn a_good_index() {
    let r = check(Value::List(0), num(2.0));
    assert_eq!(r, Ok((0, 2)));
}

#[test]
fn only_lists_can_be_indexed() {
    let r = check(Value::Str, num(0.0));
    assert_eq!(r.unwrap_err(),
        "cannot index a string");
}

#[test]
fn the_index_must_be_a_number() {
    let r = check(Value::List(0), Value::Str);
    assert_eq!(r.unwrap_err(),
        "a list index must be a number, \\
         not a string");
    let r = check(Value::List(0), Value::None);
    assert_eq!(r.unwrap_err(),
        "a list index must be a number, \\
         not none");
}

#[test]
fn the_index_must_be_whole() {
    let r = check(Value::List(0), num(1.5));
    assert_eq!(r.unwrap_err(),
        "index 1.5 is not a whole number");
}

#[test]
fn past_the_end() {
    let r = check(Value::List(0), num(3.0));
    assert_eq!(r.unwrap_err(),
        "index 3 is out of range for a \\
         list of length 3");
}

#[test]
fn below_zero() {
    let r = check(Value::List(0), num(-1.0));
    assert_eq!(r.unwrap_err(),
        "index -1 is out of range for a \\
         list of length 3");
}

#[test]
fn checks_run_in_order() {
    let r = check(Value::Str, num(1.5));
    assert_eq!(r.unwrap_err(),
        "cannot index a string");
    let r = check(Value::List(0), num(7.5));
    assert_eq!(r.unwrap_err(),
        "index 7.5 is not a whole number");
}`,
    hints: [
      'Use `let ... else` twice to pull the slot out of `Value::List(h)` and the number out of `Value::Number(i)`, returning an `Err` from each `else`.',
      'A whole number has no fractional part: `i.fract() != 0.0` catches 1.5, and `!i.is_finite()` catches the infinities. Do this before the range check, or 7.5 on a list of 3 reports the wrong error.',
      'Compare as floats, `i < 0.0 || i >= len as f64`, and only after that convert with `i as usize`.',
    ],
    walkthrough: `**How to think about it.** Four checks, each turning a "maybe" into a "definitely", and each one relying on the ones before: you can only ask whether something is whole once you know it is a number, and only ask a list's length once you know you have a list. So the order is forced by the types as much as by the messages, and the last line can convert with \`as\` because by then nothing can go wrong. Write it as a straight line of early returns.

**The solution, line by line.**

- \`let Value::List(h) = list else {\` keeps going only if \`list\` is a list, binding its slot to \`h\`.
- \`let d = describe(list); return Err(format!("cannot index {d}"));\` otherwise reports what it got, with its article: "a string".
- \`let Value::Number(i) = index else {\` does the same for the index, binding the float to \`i\`.
- \`return Err(format!("a list index must be a number, not {d}"));\` (the \`\\\\\` at the end of a line inside a string continues it on the next line, skipping the leading spaces).
- \`if i.fract() != 0.0 || !i.is_finite() {\`: \`fract\` is the part after the point, so 1.5 gives 0.5; an infinity is not whole either.
- \`return Err(format!("index {i} is not a whole number"));\` and Rust's \`{i}\` prints 1.5 as \`1.5\`.
- \`let len = lists[h].len();\` reads the length, a \`usize\`.
- \`if i < 0.0 || i >= len as f64 {\` compares as floats, so \`-1\` is caught here rather than turned into 0.
- \`return Err(format!("index {i} is out of range for a list of length {len}"));\`
- \`Ok((h, i as usize))\`: \`i\` is now a whole number from 0 to \`len - 1\`, so the cast is exact.

**Common wrong attempts.**

- Checking the range before wholeness: \`[10, 20, 30][7.5]\` then says "out of range" when Drip says "index 7.5 is not a whole number".
- Converting first, \`if i as usize >= len\`: \`-1.0 as usize\` is 0, because a float-to-integer \`as\` saturates, so \`xs[-1]\` silently reads the first element.
- Writing \`{:?}\` instead of \`{}\`: Debug prints \`3.0\`, not \`3\`.`,
    wrong: [
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    None,
    Number(f64),
    Str,
    // A handle: the list's slot number.
    List(usize),
}

fn describe(v: Value) -> &'static str {
    match v {
        Value::None => "none",
        Value::Number(_) => "a number",
        Value::Str => "a string",
        Value::List(_) => "a list",
    }
}

// The list's slot and the element's
// index, or Drip's error message.
type R = Result<(usize, usize), String>;

fn check_index(
    lists: &[Vec<Value>],
    list: Value,
    index: Value,
) -> R {
    let Value::List(h) = list else {
        let d = describe(list);
        return Err(format!(
            "cannot index {d}"));
    };
    let Value::Number(i) = index else {
        let d = describe(index);
        return Err(format!(
            "a list index must be a \\
             number, not {d}"));
    };
    let len = lists[h].len();
    if i < 0.0 || i >= len as f64 {
        return Err(format!(
            "index {i} is out of \\
             range for a list of \\
             length {len}"));
    }
    if i.fract() != 0.0
        || !i.is_finite()
    {
        return Err(format!(
            "index {i} is not a \\
             whole number"));
    }
    Ok((h, i as usize))
}`,
        why: 'The range check runs first, so `xs[7.5]` on a list of 3 reports “out of range” rather than “not a whole number”.',
      },
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    None,
    Number(f64),
    Str,
    // A handle: the list's slot number.
    List(usize),
}

fn describe(v: Value) -> &'static str {
    match v {
        Value::None => "none",
        Value::Number(_) => "a number",
        Value::Str => "a string",
        Value::List(_) => "a list",
    }
}

// The list's slot and the element's
// index, or Drip's error message.
type R = Result<(usize, usize), String>;

fn check_index(
    lists: &[Vec<Value>],
    list: Value,
    index: Value,
) -> R {
    let Value::List(h) = list else {
        let d = describe(list);
        return Err(format!(
            "cannot index {d}"));
    };
    let Value::Number(i) = index else {
        let d = describe(index);
        return Err(format!(
            "a list index must be a \\
             number, not {d}"));
    };
    if i.fract() != 0.0
        || !i.is_finite()
    {
        return Err(format!(
            "index {i} is not a \\
             whole number"));
    }
    let len = lists[h].len();
    if i as usize >= len {
        return Err(format!(
            "index {i} is out of \\
             range for a list of \\
             length {len}"));
    }
    Ok((h, i as usize))
}`,
        why: '`-1.0 as usize` saturates to 0, so `xs[-1]` returns `Ok((0, 0))` instead of an error.',
      },
    ],
  },
  makeList: {
    optional: true,
    lang: 'rust',
    title: 'Take the top n values',
    prompt: 'The `list n` instruction takes the top `n` values off the stack, in the order they were pushed. Write `take_top(stack, n)`, which returns them as a new `Vec` (bottom one first) and removes them from the stack. With `n = 0` it returns an empty `Vec` and leaves the stack alone.',
    starter: `fn take_top(
    stack: &mut Vec<f64>,
    n: usize,
) -> Vec<f64> {
    todo!()
}`,
    solution: `fn take_top(
    stack: &mut Vec<f64>,
    n: usize,
) -> Vec<f64> {
    let start = stack.len() - n;
    let items = stack[start..].to_vec();
    stack.truncate(start);
    items
}`,
    tests: `#[test]
fn keeps_the_order() {
    let mut s = vec![1.0, 2.0, 3.0];
    assert_eq!(take_top(&mut s, 2),
        vec![2.0, 3.0]);
}

#[test]
fn shortens_the_stack() {
    let mut s = vec![1.0, 2.0, 3.0];
    take_top(&mut s, 2);
    assert_eq!(s, vec![1.0]);
}

#[test]
fn zero_takes_nothing() {
    let mut s = vec![1.0];
    assert!(take_top(&mut s, 0).is_empty());
    assert_eq!(s, vec![1.0]);
}

#[test]
fn can_take_everything() {
    let mut s = vec![4.0, 5.0];
    assert_eq!(take_top(&mut s, 2),
        vec![4.0, 5.0]);
    assert!(s.is_empty());
}`,
    hints: [
      'Work out where the top `n` values start: `stack.len() - n`.',
      '`stack[start..]` is a slice of exactly those values, in order, and `.to_vec()` copies it into a new `Vec`.',
      'Then `stack.truncate(start)` drops them from the stack. (`stack.split_off(start)` does both steps at once.)',
    ],
    walkthrough: `**How to think about it.** The values you want are already in the right order, at the end of the stack, so there is nothing to reverse: find where they start, copy that slice, then cut the stack back. drip-rs splits it in two steps because, between the copy and the cut, it allocates the list, and the values must still be on the stack then.

**The solution, line by line.**

- \`let start = stack.len() - n;\` is the index of the lowest value to take; for a stack of 3 and \`n = 2\`, that is 1.
- \`let items = stack[start..].to_vec();\` slices from \`start\` to the end and copies it into a new \`Vec\`, bottom value first.
- \`stack.truncate(start);\` shortens the stack to \`start\` values, dropping the ones just copied.
- \`items\` is returned.

With \`n = 0\`, \`start\` is the length, the slice is empty, and \`truncate\` changes nothing.

**Common wrong attempts.**

- Popping \`n\` times into a new \`Vec\`: \`pop\` takes the *top* value first, so the list comes out reversed, \`[3, 2]\` instead of \`[2, 3]\`.
- Forgetting \`truncate\`: the list is right, but the stack still holds the values, so every later instruction sees two extra values.`,
    wrong: [
      {
        code: `fn take_top(
    stack: &mut Vec<f64>,
    n: usize,
) -> Vec<f64> {
    let mut items = Vec::new();
    for _ in 0..n {
        let v = stack.pop().unwrap();
        items.push(v);
    }
    items
}`,
        why: '`pop` takes the top value first, so the elements come out reversed.',
      },
      {
        code: `fn take_top(
    stack: &mut Vec<f64>,
    n: usize,
) -> Vec<f64> {
    let start = stack.len() - n;
    stack[start..].to_vec()
}`,
        why: 'The values are copied but never removed from the stack.',
      },
    ],
  },
  interner: {
    lang: 'rust',
    title: 'An interner',
    prompt: `Write \`intern\` for this small interner. It keeps each string's text in \`strings\` (the string's id is its index there) and finds strings again through \`keys\`, an open-addressing table of \`CAP\` slots.

1. Hash the characters with \`fnv\`.
2. Start at slot \`hash & (CAP - 1)\`. While the slot holds a \`StrRef\`, return it if it has the same hash *and* the same text. Otherwise step to the next slot, wrapping around.
3. At an empty slot the string is new: push its text, make a \`StrRef\` with the new id and the hash, store it in that slot, and return it.

Equal strings must get equal handles, and each string's text is stored once.`,
    starter: `#[derive(Clone, Copy, Debug, PartialEq)]
struct StrRef {
    id: u32,
    hash: u32,
}

// FNV-1a, as in drip-rs.
fn fnv(s: &str) -> u32 {
    let mut h: u32 = 2_166_136_261;
    for b in s.bytes() {
        h ^= u32::from(b);
        h = h.wrapping_mul(16_777_619);
    }
    h
}

const CAP: usize = 256; // a power of 2

struct Interner {
    // The text of string \`id\`.
    strings: Vec<Box<str>>,
    // Open addressing: CAP slots.
    keys: Vec<Option<StrRef>>,
}

impl Interner {
    fn new() -> Self {
        Interner {
            strings: Vec::new(),
            keys: vec![None; CAP],
        }
    }

    fn str(&self, s: StrRef) -> &str {
        &self.strings[s.id as usize]
    }

    // The handle for these characters,
    // made if need be.
    fn intern(
        &mut self,
        chars: &str,
    ) -> StrRef {
        todo!()
    }
}`,
    solution: `#[derive(Clone, Copy, Debug, PartialEq)]
struct StrRef {
    id: u32,
    hash: u32,
}

// FNV-1a, as in drip-rs.
fn fnv(s: &str) -> u32 {
    let mut h: u32 = 2_166_136_261;
    for b in s.bytes() {
        h ^= u32::from(b);
        h = h.wrapping_mul(16_777_619);
    }
    h
}

const CAP: usize = 256; // a power of 2

struct Interner {
    // The text of string \`id\`.
    strings: Vec<Box<str>>,
    // Open addressing: CAP slots.
    keys: Vec<Option<StrRef>>,
}

impl Interner {
    fn new() -> Self {
        Interner {
            strings: Vec::new(),
            keys: vec![None; CAP],
        }
    }

    fn str(&self, s: StrRef) -> &str {
        &self.strings[s.id as usize]
    }

    // The handle for these characters,
    // made if need be.
    fn intern(
        &mut self,
        chars: &str,
    ) -> StrRef {
        let h = fnv(chars);
        let mask = CAP - 1;
        let mut i = h as usize & mask;
        loop {
            let Some(k) = self.keys[i]
            else {
                break; // an empty slot
            };
            if k.hash == h
                && self.str(k) == chars
            {
                return k;
            }
            i = (i + 1) & mask;
        }
        // Not found: slot i is empty.
        let id = self.strings.len();
        self.strings.push(chars.into());
        let s = StrRef {
            id: id as u32,
            hash: h,
        };
        self.keys[i] = Some(s);
        s
    }
}`,
    tests: `#[test]
fn equal_text_gives_one_handle() {
    let mut t = Interner::new();
    let a = t.intern("hello");
    let built = String::from("hel") + "lo";
    let b = t.intern(&built);
    assert_eq!(a, b);
}

#[test]
fn different_text_different_handles() {
    let mut t = Interner::new();
    let a = t.intern("x");
    let b = t.intern("y");
    assert_ne!(a, b);
}

#[test]
fn the_text_comes_back() {
    let mut t = Interner::new();
    let s = t.intern("drip");
    assert_eq!(t.str(s), "drip");
}

#[test]
fn the_handle_carries_the_hash() {
    let mut t = Interner::new();
    assert_eq!(t.intern("a").hash,
        0xe40c292c);
}

#[test]
fn each_string_is_stored_once() {
    let mut t = Interner::new();
    t.intern("x");
    t.intern("x");
    t.intern("x");
    assert_eq!(t.strings.len(), 1);
}

#[test]
fn survives_collisions() {
    let mut t = Interner::new();
    let names: Vec<String> = (0..100)
        .map(|i| format!("k{i}"))
        .collect();
    let first: Vec<StrRef> = names
        .iter()
        .map(|n| t.intern(n))
        .collect();
    for (n, s) in names.iter().zip(&first) {
        assert_eq!(t.intern(n), *s);
        assert_eq!(t.str(*s), n);
    }
    assert_eq!(t.strings.len(), 100);
}`,
    hints: [
      'The first slot is `h as usize & (CAP - 1)`. `CAP` is a power of two, so the mask is a cheap remainder that also wraps around the end.',
      'Loop with `let Some(k) = self.keys[i] else { break; };`. Compare `k.hash == h` first, and only then `self.str(k) == chars`; if either differs, step to `(i + 1) & mask`.',
      'After the loop, slot `i` is empty. The new id is `self.strings.len()`, taken before you push the text; store `Some(s)` in `self.keys[i]` and return `s`.',
    ],
    walkthrough: `**How to think about it.** This is \`Heap::intern\` and \`find_string\` folded into one loop. There are two outcomes: the string is already in the table (return its handle, store nothing), or it is not (store it once and hand out a new handle). An open-addressing table answers "is it here?" by walking from the hash's home slot until it either finds the string or reaches an empty slot; the empty slot is then exactly where the new string belongs. So write the probe loop first, and put the "new string" code after it.

**The solution, line by line.**

- \`let h = fnv(chars);\` hashes the text once.
- \`let mask = CAP - 1;\` and \`let mut i = h as usize & mask;\` give the home slot; with \`CAP\` = 256, \`& 255\` keeps the low 8 bits.
- \`loop {\` probes one slot per turn.
- \`let Some(k) = self.keys[i] else { break; };\` copies the slot out (\`Option<StrRef>\` is \`Copy\`, so this borrows nothing); an empty slot ends the probe.
- \`if k.hash == h && self.str(k) == chars { return k; }\` compares the cheap \`u32\` first, and the text only when the hashes match. Equal hashes do not prove equal strings, so the text check must stay.
- \`i = (i + 1) & mask;\` steps on, wrapping from slot 255 to 0.
- \`let id = self.strings.len();\` is the new string's id: the index it is about to get.
- \`self.strings.push(chars.into());\` stores the text once, as a \`Box<str>\`.
- \`let s = StrRef { id: id as u32, hash: h };\` makes the handle, carrying the hash as drip-rs's does.
- \`self.keys[i] = Some(s);\` records it in the empty slot the probe stopped at, and \`s\` is returned.

**Common wrong attempts.**

- Returning whatever is in the home slot when it is taken, without comparing: two different strings that share a slot then share a handle.
- On a collision, overwriting the slot instead of probing on: the string that was there can no longer be found, so interning it again makes a second copy, which the last test catches.
- Comparing only hashes: it passes small tests, but two different strings with equal hashes would become one.`,
    wrong: [
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
struct StrRef {
    id: u32,
    hash: u32,
}

// FNV-1a, as in drip-rs.
fn fnv(s: &str) -> u32 {
    let mut h: u32 = 2_166_136_261;
    for b in s.bytes() {
        h ^= u32::from(b);
        h = h.wrapping_mul(16_777_619);
    }
    h
}

const CAP: usize = 256; // a power of 2

struct Interner {
    // The text of string \`id\`.
    strings: Vec<Box<str>>,
    // Open addressing: CAP slots.
    keys: Vec<Option<StrRef>>,
}

impl Interner {
    fn new() -> Self {
        Interner {
            strings: Vec::new(),
            keys: vec![None; CAP],
        }
    }

    fn str(&self, s: StrRef) -> &str {
        &self.strings[s.id as usize]
    }

    // The handle for these characters,
    // made if need be.
    fn intern(
        &mut self,
        chars: &str,
    ) -> StrRef {
        let h = fnv(chars);
        let mask = CAP - 1;
        let i = h as usize & mask;
        if let Some(k) = self.keys[i] {
            // Assume it is our string.
            return k;
        }
        let id = self.strings.len();
        self.strings.push(chars.into());
        let s = StrRef {
            id: id as u32,
            hash: h,
        };
        self.keys[i] = Some(s);
        s
    }
}`,
        why: 'A string whose slot is taken gets back whoever is there. Two different strings that share a slot then share a handle. Check the hash and the text, and probe on.',
      },
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
struct StrRef {
    id: u32,
    hash: u32,
}

// FNV-1a, as in drip-rs.
fn fnv(s: &str) -> u32 {
    let mut h: u32 = 2_166_136_261;
    for b in s.bytes() {
        h ^= u32::from(b);
        h = h.wrapping_mul(16_777_619);
    }
    h
}

const CAP: usize = 256; // a power of 2

struct Interner {
    // The text of string \`id\`.
    strings: Vec<Box<str>>,
    // Open addressing: CAP slots.
    keys: Vec<Option<StrRef>>,
}

impl Interner {
    fn new() -> Self {
        Interner {
            strings: Vec::new(),
            keys: vec![None; CAP],
        }
    }

    fn str(&self, s: StrRef) -> &str {
        &self.strings[s.id as usize]
    }

    // The handle for these characters,
    // made if need be.
    fn intern(
        &mut self,
        chars: &str,
    ) -> StrRef {
        let h = fnv(chars);
        let mask = CAP - 1;
        let i = h as usize & mask;
        if let Some(k) = self.keys[i] {
            if self.str(k) == chars {
                return k;
            }
        }
        // Take the slot anyway.
        let id = self.strings.len();
        self.strings.push(chars.into());
        let s = StrRef {
            id: id as u32,
            hash: h,
        };
        self.keys[i] = Some(s);
        s
    }
}`,
        why: 'On a collision it overwrites the slot instead of probing, so the string that was there can no longer be found, and interning it again makes a second copy.',
      },
    ],
  },
  tableFind: {
    optional: true,
    lang: 'rust',
    title: 'Find, with tombstones',
    prompt: `Write drip-rs's \`find\` for this fixed-size, two-column table. It returns the slot holding \`key\`, or, if \`key\` isn't there, the slot where \`set\` should put it.

- Start at \`key.hash & mask\`, and step \`(i + 1) & mask\`.
- A slot with key \`None\` and value \`Value::None\` is empty: the probe ends there.
- A slot with key \`None\` and value \`Bool(true)\` is a tombstone: keep probing, but remember the *first* one.
- If the probe ends without finding \`key\`, return the first tombstone, or the empty slot if there was none.

Keys are equal when the whole \`StrRef\` is equal, as with interned strings.`,
    starter: `#[derive(Clone, Copy, Debug, PartialEq)]
struct StrRef {
    id: u32,
    hash: u32,
}

#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    None,
    Bool(bool),
    Num(f64),
}

const TOMBSTONE: Value =
    Value::Bool(true);

// Fixed at 8 slots: no growing here.
struct Table {
    keys: Vec<Option<StrRef>>,
    vals: Vec<Value>,
}

impl Table {
    fn new() -> Self {
        Table {
            keys: vec![None; 8],
            vals: vec![Value::None; 8],
        }
    }

    fn slot(&self, k: StrRef) -> usize {
        find(&self.keys, &self.vals, k)
    }

    fn get(&self, k: StrRef)
        -> Option<Value> {
        let i = self.slot(k);
        let v = self.vals[i];
        self.keys[i].map(|_| v)
    }

    fn set(
        &mut self,
        k: StrRef,
        v: Value,
    ) {
        let i = self.slot(k);
        self.keys[i] = Some(k);
        self.vals[i] = v;
    }

    fn delete(&mut self, k: StrRef) {
        let i = self.slot(k);
        if self.keys[i].is_some() {
            self.keys[i] = None;
            self.vals[i] = TOMBSTONE;
        }
    }
}

// The slot holding \`key\`, or else where
// it should go: the first tombstone
// passed, or the empty slot that ended
// the probe.
fn find(
    keys: &[Option<StrRef>],
    vals: &[Value],
    key: StrRef,
) -> usize {
    todo!()
}`,
    solution: `#[derive(Clone, Copy, Debug, PartialEq)]
struct StrRef {
    id: u32,
    hash: u32,
}

#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    None,
    Bool(bool),
    Num(f64),
}

const TOMBSTONE: Value =
    Value::Bool(true);

// Fixed at 8 slots: no growing here.
struct Table {
    keys: Vec<Option<StrRef>>,
    vals: Vec<Value>,
}

impl Table {
    fn new() -> Self {
        Table {
            keys: vec![None; 8],
            vals: vec![Value::None; 8],
        }
    }

    fn slot(&self, k: StrRef) -> usize {
        find(&self.keys, &self.vals, k)
    }

    fn get(&self, k: StrRef)
        -> Option<Value> {
        let i = self.slot(k);
        let v = self.vals[i];
        self.keys[i].map(|_| v)
    }

    fn set(
        &mut self,
        k: StrRef,
        v: Value,
    ) {
        let i = self.slot(k);
        self.keys[i] = Some(k);
        self.vals[i] = v;
    }

    fn delete(&mut self, k: StrRef) {
        let i = self.slot(k);
        if self.keys[i].is_some() {
            self.keys[i] = None;
            self.vals[i] = TOMBSTONE;
        }
    }
}

// The slot holding \`key\`, or else where
// it should go: the first tombstone
// passed, or the empty slot that ended
// the probe.
fn find(
    keys: &[Option<StrRef>],
    vals: &[Value],
    key: StrRef,
) -> usize {
    let mask = keys.len() - 1;
    let mut i = key.hash as usize;
    i &= mask;
    let mut tomb = None;
    loop {
        let e = vals[i] == Value::None;
        match keys[i] {
            None if e => break,
            None => {
                tomb.get_or_insert(i);
            }
            Some(k) if k == key => {
                return i;
            }
            Some(_) => {}
        }
        i = (i + 1) & mask;
    }
    // Absent: reuse a tombstone if any.
    tomb.unwrap_or(i)
}`,
    tests: `// Keys with hand-picked hashes, so they
// collide on purpose.
fn k(id: u32, hash: u32) -> StrRef {
    StrRef { id, hash }
}

#[test]
fn colliding_keys_are_all_found() {
    let mut t = Table::new();
    t.set(k(1, 4), Value::Num(1.0));
    t.set(k(2, 4), Value::Num(2.0));
    t.set(k(3, 12), Value::Num(3.0));
    assert_eq!(t.get(k(1, 4)),
        Some(Value::Num(1.0)));
    assert_eq!(t.get(k(2, 4)),
        Some(Value::Num(2.0)));
    assert_eq!(t.get(k(3, 12)),
        Some(Value::Num(3.0)));
}

#[test]
fn a_missing_key_is_none() {
    let mut t = Table::new();
    t.set(k(1, 4), Value::Num(1.0));
    assert_eq!(t.get(k(9, 4)), None);
}

#[test]
fn probes_past_a_tombstone() {
    let mut t = Table::new();
    t.set(k(1, 4), Value::None);
    t.set(k(2, 4), Value::None);
    t.set(k(3, 4), Value::Num(3.0));
    t.delete(k(2, 4));
    assert_eq!(t.get(k(3, 4)),
        Some(Value::Num(3.0)));
}

#[test]
fn reuses_the_first_tombstone() {
    let mut t = Table::new();
    for id in 1..=4 {
        t.set(k(id, 4), Value::None);
    }
    t.delete(k(2, 4)); // slot 5
    t.delete(k(3, 4)); // slot 6
    t.set(k(9, 4), Value::Num(9.0));
    assert_eq!(t.keys[5], Some(k(9, 4)));
}

#[test]
fn wraps_around_the_end() {
    let mut t = Table::new();
    t.set(k(1, 7), Value::None);
    t.set(k(2, 7), Value::Num(2.0));
    assert_eq!(t.keys[0], Some(k(2, 7)));
    assert_eq!(t.get(k(2, 7)),
        Some(Value::Num(2.0)));
}`,
    hints: [
      'Keep `let mut tomb: Option<usize> = None;` outside the loop, and start at `key.hash as usize & mask`.',
      'Inside, `match keys[i]` with guards: `None if vals[i] == Value::None` ends the probe, a plain `None` is a tombstone, and `Some(k) if k == key` is the hit.',
      '`tomb.get_or_insert(i)` sets it only the first time. After the loop, return `tomb.unwrap_or(i)`.',
    ],
    walkthrough: `**How to think about it.** A probe has to tell three kinds of slot apart: a live key (is it ours?), an empty slot (the key is not here, stop), and a tombstone (someone was deleted here; the key might still be further on). Both empty slots and tombstones have key \`None\`, so the value column decides. And when the key is absent, \`set\` wants the best place to put it, which is the first reusable slot on the way.

**The solution, line by line.**

- \`let mask = keys.len() - 1;\` relies on the length being a power of two (8 here).
- \`let mut i = key.hash as usize; i &= mask;\` is the home slot.
- \`let mut tomb = None;\` will hold the first tombstone's index, if any.
- \`let e = vals[i] == Value::None;\` reads the value column once per slot: \`e\` says whether the value is \`none\`, as an empty slot's is.
- \`None if e => break,\` a truly empty slot: the key is absent.
- \`None => { tomb.get_or_insert(i); }\` a tombstone: remember it if it is the first, and keep probing.
- \`Some(k) if k == key => { return i; }\` found it; keys compare as whole \`StrRef\`s, as interned strings do.
- \`Some(_) => {}\` another key: keep probing.
- \`i = (i + 1) & mask;\` steps on, wrapping from 7 to 0.
- \`tomb.unwrap_or(i)\` after the loop returns the first tombstone if there was one, or the empty slot that ended the probe.

drip-rs's real \`find\` has exactly this shape, and takes the two columns as slices so that \`grow\` can call it on the new, empty columns while it reads entries from the old ones.

**Common wrong attempts.**

- Treating every \`None\` key as empty: a lookup stops at the first tombstone and misses keys placed after it (the \`probes_past_a_tombstone\` test).
- \`tomb = Some(i)\` at every tombstone: it remembers the last one passed, not the first, so \`set\` puts the key further from home.
- \`i += 1\` with no mask: a probe that starts near the end runs off the \`Vec\`, and indexing it panics.`,
    wrong: [
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
struct StrRef {
    id: u32,
    hash: u32,
}

#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    None,
    Bool(bool),
    Num(f64),
}

const TOMBSTONE: Value =
    Value::Bool(true);

// Fixed at 8 slots: no growing here.
struct Table {
    keys: Vec<Option<StrRef>>,
    vals: Vec<Value>,
}

impl Table {
    fn new() -> Self {
        Table {
            keys: vec![None; 8],
            vals: vec![Value::None; 8],
        }
    }

    fn slot(&self, k: StrRef) -> usize {
        find(&self.keys, &self.vals, k)
    }

    fn get(&self, k: StrRef)
        -> Option<Value> {
        let i = self.slot(k);
        let v = self.vals[i];
        self.keys[i].map(|_| v)
    }

    fn set(
        &mut self,
        k: StrRef,
        v: Value,
    ) {
        let i = self.slot(k);
        self.keys[i] = Some(k);
        self.vals[i] = v;
    }

    fn delete(&mut self, k: StrRef) {
        let i = self.slot(k);
        if self.keys[i].is_some() {
            self.keys[i] = None;
            self.vals[i] = TOMBSTONE;
        }
    }
}

// The slot holding \`key\`, or else where
// it should go: the first tombstone
// passed, or the empty slot that ended
// the probe.
fn find(
    keys: &[Option<StrRef>],
    vals: &[Value],
    key: StrRef,
) -> usize {
    let mask = keys.len() - 1;
    let mut i = key.hash as usize;
    i &= mask;
    loop {
        match keys[i] {
            None => return i,
            Some(k) if k == key => {
                return i;
            }
            Some(_) => {}
        }
        i = (i + 1) & mask;
    }
}`,
        why: 'It treats every `None` key as empty, so a lookup stops at the first tombstone and misses keys placed after it.',
      },
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
struct StrRef {
    id: u32,
    hash: u32,
}

#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    None,
    Bool(bool),
    Num(f64),
}

const TOMBSTONE: Value =
    Value::Bool(true);

// Fixed at 8 slots: no growing here.
struct Table {
    keys: Vec<Option<StrRef>>,
    vals: Vec<Value>,
}

impl Table {
    fn new() -> Self {
        Table {
            keys: vec![None; 8],
            vals: vec![Value::None; 8],
        }
    }

    fn slot(&self, k: StrRef) -> usize {
        find(&self.keys, &self.vals, k)
    }

    fn get(&self, k: StrRef)
        -> Option<Value> {
        let i = self.slot(k);
        let v = self.vals[i];
        self.keys[i].map(|_| v)
    }

    fn set(
        &mut self,
        k: StrRef,
        v: Value,
    ) {
        let i = self.slot(k);
        self.keys[i] = Some(k);
        self.vals[i] = v;
    }

    fn delete(&mut self, k: StrRef) {
        let i = self.slot(k);
        if self.keys[i].is_some() {
            self.keys[i] = None;
            self.vals[i] = TOMBSTONE;
        }
    }
}

// The slot holding \`key\`, or else where
// it should go: the first tombstone
// passed, or the empty slot that ended
// the probe.
fn find(
    keys: &[Option<StrRef>],
    vals: &[Value],
    key: StrRef,
) -> usize {
    let mask = keys.len() - 1;
    let mut i = key.hash as usize;
    i &= mask;
    let mut tomb = None;
    loop {
        let e = vals[i] == Value::None;
        match keys[i] {
            None if e => break,
            None => tomb = Some(i),
            Some(k) if k == key => {
                return i;
            }
            Some(_) => {}
        }
        i = (i + 1) & mask;
    }
    // Absent: reuse a tombstone if any.
    tomb.unwrap_or(i)
}`,
        why: '`tomb = Some(i)` overwrites the remembered slot at every tombstone, so `set` uses the last one passed, not the first.',
      },
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
struct StrRef {
    id: u32,
    hash: u32,
}

#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    None,
    Bool(bool),
    Num(f64),
}

const TOMBSTONE: Value =
    Value::Bool(true);

// Fixed at 8 slots: no growing here.
struct Table {
    keys: Vec<Option<StrRef>>,
    vals: Vec<Value>,
}

impl Table {
    fn new() -> Self {
        Table {
            keys: vec![None; 8],
            vals: vec![Value::None; 8],
        }
    }

    fn slot(&self, k: StrRef) -> usize {
        find(&self.keys, &self.vals, k)
    }

    fn get(&self, k: StrRef)
        -> Option<Value> {
        let i = self.slot(k);
        let v = self.vals[i];
        self.keys[i].map(|_| v)
    }

    fn set(
        &mut self,
        k: StrRef,
        v: Value,
    ) {
        let i = self.slot(k);
        self.keys[i] = Some(k);
        self.vals[i] = v;
    }

    fn delete(&mut self, k: StrRef) {
        let i = self.slot(k);
        if self.keys[i].is_some() {
            self.keys[i] = None;
            self.vals[i] = TOMBSTONE;
        }
    }
}

// The slot holding \`key\`, or else where
// it should go: the first tombstone
// passed, or the empty slot that ended
// the probe.
fn find(
    keys: &[Option<StrRef>],
    vals: &[Value],
    key: StrRef,
) -> usize {
    let mask = keys.len() - 1;
    let mut i = key.hash as usize;
    i &= mask;
    let mut tomb = None;
    loop {
        let e = vals[i] == Value::None;
        match keys[i] {
            None if e => break,
            None => {
                tomb.get_or_insert(i);
            }
            Some(k) if k == key => {
                return i;
            }
            Some(_) => {}
        }
        i += 1;
    }
    // Absent: reuse a tombstone if any.
    tomb.unwrap_or(i)
}`,
        why: '`i += 1` never wraps. A probe that starts near the end runs off the `Vec`, and indexing it panics.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'In drip-rs, what does `heap[c]` do when `c: Gc<ObjClosure>`?',
    options: [
      {
        t: 'Follows an address stored in `c`',
        why: 'A `Gc` holds a slot number, not an address.',
      },
      {
        t: 'Calls `Index::index`, which reads slot `c.index()` of `heap.closures`',
        correct: true,
        why: 'The generic impl uses `ObjClosure::arena(heap)`, which is `&heap.closures`.',
      },
      {
        t: 'Checks the object’s `type` field to find the right kind',
        why: 'drip-rs objects have no `type` field. The handle’s type picks the arena at compile time.',
      },
      {
        t: 'Searches all nine arenas for the slot',
        why: 'Only the closures arena is ever looked at.',
      },
    ],
  },
  {
    q: 'Which of these does a drip-rs `ObjInstance` contain?',
    options: [
      {
        t: 'A `next` reference to the previously allocated object',
        why: 'That is the TypeScript object list. drip-rs sweeps by walking its arenas.',
      },
      {
        t: 'An `isMarked` flag',
        why: 'Mark bits live in a separate bitmap.',
      },
      {
        t: 'An `Rc<ObjClass>`',
        why: 'No object owns another. The class is reached through a handle.',
      },
      {
        t: 'A `Gc<ObjClass>` handle, a field table and the order the fields were first set',
        correct: true,
        why: '`ObjInstance { class, fields, field_order }`, and nothing else.',
      },
    ],
  },
  {
    q: 'Why does drip-rs’s heap have one generic `alloc<T: HeapObject>` rather than a constructor per kind, like TypeScript’s `newClass`?',
    options: [
      {
        t: 'The `HeapObject` trait tells generic code which arena each type uses, so one body works for all',
        correct: true,
        why: '`T::arena_mut(self).insert(object)` is the whole job.',
      },
      {
        t: 'Rust allows only one method per struct',
        why: 'It allows as many as you like.',
      },
      {
        t: 'Generic functions run faster than ordinary ones',
        why: 'A generic function compiled for one type is as fast as hand-written code, not faster.',
      },
      {
        t: 'So that `alloc` can collect garbage first',
        why: 'The heap’s `alloc` never collects; callers ask `should_collect` first.',
      },
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
      {
        t: 'A only',
        why: 'A keeps `heap` borrowed through `from` while `heap[sub]` borrows it mutably: E0502.',
      },
      {
        t: 'Both, because `sup` and `sub` are different slots',
        why: 'The borrow checker sees two borrows of `heap`, not of slots.',
      },
      {
        t: 'B only',
        correct: true,
        why: 'The clone ends the shared borrow before the write. This is what drip-rs’s `Inherit` does.',
      },
    ],
  },
  {
    q: 'A collector bug frees a class that is still in use. What happens the next time drip-rs reads it in a debug or stress run?',
    options: [
      {
        t: 'It reads whatever object moved into that slot',
        why: 'In debug and stress modes freed slots are never reused, so nothing moves in.',
      },
      {
        t: 'Undefined behaviour',
        why: 'drip-rs forbids `unsafe`, so a stale handle cannot cause undefined behaviour.',
      },
      {
        t: 'The slot is `None`, so `use_after_free` panics with a message naming the type',
        correct: true,
        why: '“use after free: an object of type ObjClass was collected while still in use”.',
      },
      {
        t: 'The compiler rejects the program',
        why: 'Whether a handle is stale is only known at run time.',
      },
    ],
  },
  {
    q: 'After `let ys = xs;`, what do `xs` and `ys` hold in drip-rs?',
    options: [
      {
        t: 'Two copies of the list’s elements',
        why: 'Assignment copies a 16-byte `Value`, and for a list that is only a handle.',
      },
      {
        t: 'The same `Gc<ObjList>` handle, naming one slot of the lists arena',
        correct: true,
        why: 'So a `push` through either name changes the one list.',
      },
      {
        t: 'An `Rc<Vec<Value>>` each',
        why: 'drip-rs has no `Rc` for objects; the heap owns the list.',
      },
    ],
  },
  {
    q: 'In `OpCode::List`, what could go wrong if `truncate` ran before `alloc`?',
    options: [
      {
        t: 'Nothing: the values were already copied by `to_vec`',
        why: 'The copy is a local `Vec` the collector cannot see, so a string in it could be freed.',
      },
      {
        t: 'The list would come out reversed',
        why: 'Order comes from the slice, not from when the stack is cut.',
      },
      {
        t: 'A collection inside `alloc` could free an element’s object, because nothing it can see still refers to it',
        correct: true,
        why: 'The stack is a root; the local `items` is not. That is why the elements stay on the stack until the list exists.',
      },
      {
        t: 'A compile error from the borrow checker',
        why: 'It would compile; the bug would show at run time, under the stress collector.',
      },
    ],
  },
  {
    q: 'What does drip-rs print for `print [1, 2, 3][3.5];`?',
    options: [
      {
        t: '`runtime error: index 3.5 is out of range for a list of length 3`',
        why: 'Wholeness is checked before range.',
      },
      {
        t: '`runtime error: index 3.5 is not a whole number`',
        correct: true,
        why: 'The third check fails first, followed by the trace line `at line 1 in script`.',
      },
      {
        t: '`3`',
        why: 'drip-rs never rounds an index.',
      },
      {
        t: '`none`',
        why: 'Reading out of range is an error in Drip, not `none`.',
      },
    ],
  },
  {
    q: 'Why can `check_index` end with `i as usize` without any further check?',
    options: [
      {
        t: 'Because `as` panics on a bad value',
        why: 'A float-to-integer `as` never panics; it saturates and rounds towards zero.',
      },
      {
        t: 'Because Drip numbers are integers',
        why: 'Drip numbers are 64-bit floats.',
      },
      {
        t: 'Because the earlier checks proved `i` is a whole number from 0 to `len - 1`',
        correct: true,
        why: 'For such a number the cast is exact.',
      },
    ],
  },
  {
    q: 'What does the collector do when it reaches a list?',
    options: [
      {
        t: 'Marks the list only; its elements are roots already',
        why: 'Elements are only reachable through the list.',
      },
      {
        t: 'Copies the list to a new arena slot',
        why: 'drip-rs’s collector never moves objects.',
      },
      {
        t: 'Frees any element that is a number',
        why: 'Numbers live inside the `Value`; there is nothing to free.',
      },
      {
        t: 'Traces `items`, marking the object each element’s handle names',
        correct: true,
        why: '`Gray::List(l) => self.lists[l].items.trace(marks)`.',
      },
    ],
  },
  {
    q: 'What does a drip-rs `StrRef` contain?',
    options: [
      {
        t: 'The string’s characters',
        why: 'The characters live in the `ObjString`, in the strings arena.',
      },
      {
        t: 'A `Gc<ObjString>` handle and the string’s 32-bit hash',
        correct: true,
        why: 'The hash rides along for free inside the 16-byte `Value`.',
      },
      {
        t: 'A `&str` borrowed from the source',
        why: 'That is a token’s lexeme. A Drip string value must outlive the source text.',
      },
      {
        t: 'An `Rc<str>`',
        why: 'drip-rs’s heap owns every object; values hold handles.',
      },
    ],
  },
  {
    q: 'Why doesn’t drip-rs’s `Table::get` take the heap as a parameter?',
    options: [
      {
        t: 'Tables are only used for globals',
        why: 'They are also every instance’s fields and every class’s methods, which is why it matters.',
      },
      {
        t: 'The key’s hash is in the `StrRef`, and interned keys compare by handle, so nothing in the heap is needed',
        correct: true,
        why: 'And so a table inside a heap object can be used while the heap is borrowed.',
      },
      {
        t: 'Rust forbids passing the heap to a method',
        why: 'It doesn’t, but it would conflict with `heap[instance]` borrowing the heap mutably.',
      },
    ],
  },
  {
    q: 'In `Heap::intern`, when does drip-rs compare characters?',
    options: [
      {
        t: 'For every slot it probes',
        why: 'Only slots whose stored hash equals the new string’s hash.',
      },
      {
        t: 'Never: equal hashes mean equal strings',
        why: 'Different strings can share a hash, so the text must be checked.',
      },
      {
        t: 'Only when a probed key’s hash matches, to rule out a collision',
        correct: true,
        why: '`key.hash == hash && &*strings[key.handle].chars == chars`.',
      },
      {
        t: 'Only when the table grows',
        why: 'Growing rehashes by the stored hashes, without reading text.',
      },
    ],
  },
  {
    q: 'A drip-rs table slot has key `None` and value `Value::Bool(true)`. What is it?',
    options: [
      {
        t: 'An empty slot',
        why: 'An empty slot has value `Value::None`.',
      },
      {
        t: 'A key whose value is `true`',
        why: 'A live entry always has `Some(key)`.',
      },
      {
        t: 'A tombstone: a deleted entry that probes must step past',
        correct: true,
        why: 'Lookups keep going; `set` may reuse it.',
      },
    ],
  },
  {
    q: 'After a collection whose roots never reach the string `"lost"`, what does `heap.intern("lost")` return?',
    options: [
      {
        t: 'The old `StrRef`, because the interned table keeps every string',
        why: 'The table holds its strings weakly: the collector deleted the entry.',
      },
      {
        t: 'A new `StrRef`, since the old string was freed and the table forgot it',
        correct: true,
        why: 'That is `gc.rs`’s own test: `assert_ne!(heap.intern("lost"), lost)`.',
      },
      {
        t: 'A panic: use after free',
        why: 'The table forgot the string before the sweep, so no stale handle is read.',
      },
      {
        t: '`None`',
        why: '`intern` always returns a `StrRef`; it makes one if need be.',
      },
    ],
  },
];
