//! The heap and its mark-and-sweep garbage collector (book chapter 58).
//!
//! The [`Heap`] owns one [`Arena`] per kind of object. Allocating never
//! collects by itself: it can't see the roots. Instead whoever allocates,
//! the VM or the compiler, first asks [`Heap::should_collect`] and, if so,
//! calls [`Heap::collect`] with everything it can reach.
//!
//! A collection has four steps, as in the TypeScript heap:
//! 1. mark the roots, pushing each newly marked object on a gray stack;
//! 2. trace: pop gray objects and mark what they refer to, until none
//!    are left;
//! 3. drop unmarked strings from the (weak) string table;
//! 4. sweep: free every slot that wasn't marked.
//!
//! The mark bits live outside the objects, in a [`Marks`] bitmap built
//! fresh for each collection. That keeps marking (which writes bits) apart
//! from tracing (which reads objects), so the borrow checker is happy.

use std::mem::size_of;
use std::ops::{Index, IndexMut};

use crate::object::{
    Arena, Gc, ObjBoundMethod, ObjClass, ObjClosure, ObjFunction, ObjInstance, ObjNative,
    ObjString, ObjUpvalue, StrRef, hash_string,
};
use crate::table::Table;
use crate::value::Value;

/// Collect once this many bytes are allocated, then at twice the live size.
const FIRST_GC: usize = 1024 * 1024;
const GC_HEAP_GROW_FACTOR: usize = 2;

pub struct Heap {
    pub strings: Arena<ObjString>,
    pub functions: Arena<ObjFunction>,
    pub natives: Arena<ObjNative>,
    pub upvalues: Arena<ObjUpvalue>,
    pub closures: Arena<ObjClosure>,
    pub classes: Arena<ObjClass>,
    pub instances: Arena<ObjInstance>,
    pub bound_methods: Arena<ObjBoundMethod>,
    /// Every string, so equal strings can share one object.
    interned: Table,
    marks: Marks,
    bytes_allocated: usize,
    next_gc: usize,
    /// Collect before every allocation, to flush out missing roots.
    pub stress: bool,
    /// Never reuse a freed slot, so a stale handle panics when used.
    pub poison_freed: bool,
    pub collections: usize,
    pub freed: usize,
}

impl Default for Heap {
    fn default() -> Self {
        Self::new()
    }
}

impl Heap {
    pub fn new() -> Self {
        Heap {
            strings: Arena::default(),
            functions: Arena::default(),
            natives: Arena::default(),
            upvalues: Arena::default(),
            closures: Arena::default(),
            classes: Arena::default(),
            instances: Arena::default(),
            bound_methods: Arena::default(),
            interned: Table::new(),
            marks: Marks::default(),
            bytes_allocated: 0,
            next_gc: FIRST_GC,
            stress: false,
            poison_freed: false,
            collections: 0,
            freed: 0,
        }
    }

    /// Store an object in its arena. This never collects: callers ask
    /// [`Heap::should_collect`] first, while they can still name the roots.
    pub fn alloc<T: HeapObject>(&mut self, object: T) -> Gc<T> {
        self.bytes_allocated += object.size();
        T::arena_mut(self).insert(object)
    }

    /// Whether the caller should collect before its next allocation.
    pub fn should_collect(&self) -> bool {
        self.stress || self.bytes_allocated > self.next_gc
    }

    /// The interned string with these characters, made if need be.
    pub fn intern(&mut self, chars: &str) -> StrRef {
        let hash = hash_string(chars);
        match self.interned.find_string(&self.strings, chars, hash) {
            Some(s) => s,
            None => self.add_string(chars.into(), hash),
        }
    }

    /// Like [`Heap::intern`], but takes ownership of a string just built,
    /// such as the result of `+`. `into_boxed_str` drops any spare
    /// capacity, which reallocates if there is some; `Vm::add` builds its
    /// strings with `concat`, which reserves exactly the joined length, so
    /// in practice the bytes are not copied again.
    pub fn intern_owned(&mut self, chars: String) -> StrRef {
        let hash = hash_string(&chars);
        match self.interned.find_string(&self.strings, &chars, hash) {
            Some(s) => s,
            None => self.add_string(chars.into_boxed_str(), hash),
        }
    }

    fn add_string(&mut self, chars: Box<str>, hash: u32) -> StrRef {
        let handle = self.alloc(ObjString { chars, hash });
        let s = StrRef { handle, hash };
        self.interned.set(s, Value::Nil);
        s
    }

    /// A string's characters.
    pub fn str(&self, s: StrRef) -> &str {
        &self.strings[s.handle].chars
    }

    /// How many objects are alive, of every kind.
    pub fn live_objects(&self) -> usize {
        self.strings.live_count()
            + self.functions.live_count()
            + self.natives.live_count()
            + self.upvalues.live_count()
            + self.closures.live_count()
            + self.classes.live_count()
            + self.instances.live_count()
            + self.bound_methods.live_count()
    }

    // ---- the collector ----------------------------------------------------

    /// Free every object that `roots` can't reach.
    pub fn collect(&mut self, roots: &[&dyn Trace]) {
        self.collections += 1;
        // Take the bitmap out of the heap while we fill it in, so marking
        // and reading objects don't fight over borrowing `self`.
        let mut marks = std::mem::take(&mut self.marks);
        marks.reset(self);
        // 1. Mark the roots.
        for root in roots {
            root.trace(&mut marks);
        }
        // 2. Trace: blacken gray objects until none are left.
        while let Some(object) = marks.gray.pop() {
            self.blacken(object, &mut marks);
        }
        // 3. The string table holds its strings weakly.
        self.interned.retain_keys(|s| marks.strings[s.handle.index()]);
        // 4. Sweep.
        self.sweep(&marks);
        self.marks = marks;
        self.next_gc = FIRST_GC.max(self.bytes_allocated * GC_HEAP_GROW_FACTOR);
    }

    /// Mark everything a gray object refers to, making it black.
    fn blacken(&self, object: Gray, marks: &mut Marks) {
        match object {
            Gray::Function(f) => {
                let function = &self.functions[f];
                function.name.trace(marks);
                function.chunk.constants.trace(marks);
            }
            Gray::Upvalue(u) => {
                if let ObjUpvalue::Closed(value) = &self.upvalues[u] {
                    value.trace(marks);
                }
            }
            Gray::Closure(c) => {
                let closure = &self.closures[c];
                closure.function.trace(marks);
                closure.upvalues.trace(marks);
            }
            Gray::Class(c) => {
                let class = &self.classes[c];
                class.name.trace(marks);
                class.methods.trace(marks);
            }
            Gray::Instance(i) => {
                let instance = &self.instances[i];
                instance.class.trace(marks);
                instance.fields.trace(marks);
            }
            Gray::BoundMethod(b) => {
                let bound = &self.bound_methods[b];
                bound.receiver.trace(marks);
                bound.method.trace(marks);
            }
        }
    }

    fn sweep(&mut self, marks: &Marks) {
        let mut freed_bytes = 0;
        let mut freed = 0;
        let reuse = !self.poison_freed;
        // The same loop for every arena: free each live, unmarked slot.
        macro_rules! sweep {
            ($arena:ident) => {
                for i in 0..self.$arena.capacity() {
                    if self.$arena.slot(i).is_some() && !marks.$arena[i] {
                        let object = self.$arena.remove(i, reuse).expect("slot is live");
                        freed_bytes += object.size();
                        freed += 1;
                    }
                }
            };
        }
        sweep!(strings);
        sweep!(functions);
        sweep!(natives);
        sweep!(upvalues);
        sweep!(closures);
        sweep!(classes);
        sweep!(instances);
        sweep!(bound_methods);
        self.bytes_allocated -= freed_bytes;
        self.freed += freed;
    }
}

/// `heap[handle]` reads an object, of whichever type the handle names.
impl<T: HeapObject> Index<Gc<T>> for Heap {
    type Output = T;
    fn index(&self, handle: Gc<T>) -> &T {
        &T::arena(self)[handle]
    }
}

impl<T: HeapObject> IndexMut<Gc<T>> for Heap {
    fn index_mut(&mut self, handle: Gc<T>) -> &mut T {
        &mut T::arena_mut(self)[handle]
    }
}

// ---- marking ---------------------------------------------------------------

/// An object that is marked but whose references are not yet traced.
/// Strings and natives refer to nothing, so they are never gray: marking
/// one turns it straight to black.
#[derive(Clone, Copy)]
pub enum Gray {
    Function(Gc<ObjFunction>),
    Upvalue(Gc<ObjUpvalue>),
    Closure(Gc<ObjClosure>),
    Class(Gc<ObjClass>),
    Instance(Gc<ObjInstance>),
    BoundMethod(Gc<ObjBoundMethod>),
}

/// One mark bit per arena slot, plus the gray stack.
#[derive(Default)]
pub struct Marks {
    strings: Vec<bool>,
    functions: Vec<bool>,
    natives: Vec<bool>,
    upvalues: Vec<bool>,
    closures: Vec<bool>,
    classes: Vec<bool>,
    instances: Vec<bool>,
    bound_methods: Vec<bool>,
    gray: Vec<Gray>,
}

impl Marks {
    /// Clear every bit, sized to the arenas as they are now.
    fn reset(&mut self, heap: &Heap) {
        fn clear(bits: &mut Vec<bool>, len: usize) {
            bits.clear();
            bits.resize(len, false);
        }
        clear(&mut self.strings, heap.strings.capacity());
        clear(&mut self.functions, heap.functions.capacity());
        clear(&mut self.natives, heap.natives.capacity());
        clear(&mut self.upvalues, heap.upvalues.capacity());
        clear(&mut self.closures, heap.closures.capacity());
        clear(&mut self.classes, heap.classes.capacity());
        clear(&mut self.instances, heap.instances.capacity());
        clear(&mut self.bound_methods, heap.bound_methods.capacity());
        self.gray.clear();
    }

    /// Mark an object. If it wasn't marked already and it refers to other
    /// objects, it goes on the gray stack to be traced.
    pub fn mark<T: HeapObject>(&mut self, handle: Gc<T>) {
        let bit = &mut T::marks(self)[handle.index()];
        if !*bit {
            *bit = true;
            if let Some(gray) = T::gray(handle) {
                self.gray.push(gray);
            }
        }
    }
}

/// Anything that can report the heap objects it refers to.
pub trait Trace {
    fn trace(&self, marks: &mut Marks);
}

/// No roots at all: for compiling outside a VM, as `--disassemble` does.
impl Trace for () {
    fn trace(&self, _marks: &mut Marks) {}
}

impl<T: HeapObject> Trace for Gc<T> {
    fn trace(&self, marks: &mut Marks) {
        marks.mark(*self);
    }
}

impl Trace for StrRef {
    fn trace(&self, marks: &mut Marks) {
        marks.mark(self.handle);
    }
}

impl Trace for Value {
    fn trace(&self, marks: &mut Marks) {
        match *self {
            Value::Nil | Value::Bool(_) | Value::Number(_) => {}
            Value::String(s) => s.trace(marks),
            Value::Function(f) => marks.mark(f),
            Value::Native(n) => marks.mark(n),
            Value::Closure(c) => marks.mark(c),
            Value::Class(c) => marks.mark(c),
            Value::Instance(i) => marks.mark(i),
            Value::BoundMethod(b) => marks.mark(b),
        }
    }
}

impl Trace for Table {
    fn trace(&self, marks: &mut Marks) {
        for (key, value) in self.iter() {
            key.trace(marks);
            value.trace(marks);
        }
    }
}

impl<T: Trace> Trace for Option<T> {
    fn trace(&self, marks: &mut Marks) {
        if let Some(t) = self {
            t.trace(marks);
        }
    }
}

impl<T: Trace> Trace for [T] {
    fn trace(&self, marks: &mut Marks) {
        for t in self {
            t.trace(marks);
        }
    }
}

impl<T: Trace> Trace for Vec<T> {
    fn trace(&self, marks: &mut Marks) {
        self.as_slice().trace(marks);
    }
}

// ---- the object types ------------------------------------------------------

/// What the heap needs to know about each kind of object: which arena and
/// which mark bits are its own, whether it can be gray, and its size.
pub trait HeapObject: Sized {
    fn arena(heap: &Heap) -> &Arena<Self>;
    fn arena_mut(heap: &mut Heap) -> &mut Arena<Self>;
    fn marks(marks: &mut Marks) -> &mut Vec<bool>;
    /// The gray-stack entry for this object, or `None` for leaf objects.
    fn gray(handle: Gc<Self>) -> Option<Gray>;
    /// Roughly how many bytes the object owns, to pace collections.
    fn size(&self) -> usize {
        size_of::<Self>()
    }
}

/// Implement [`HeapObject`] for a type whose arena and mark bits are the
/// heap fields named `$field`, and which goes on the gray stack as the
/// `Gray::$gray` variant.
macro_rules! heap_object {
    ($type:ty, $field:ident, $gray:ident) => {
        impl HeapObject for $type {
            fn arena(heap: &Heap) -> &Arena<Self> {
                &heap.$field
            }
            fn arena_mut(heap: &mut Heap) -> &mut Arena<Self> {
                &mut heap.$field
            }
            fn marks(marks: &mut Marks) -> &mut Vec<bool> {
                &mut marks.$field
            }
            fn gray(handle: Gc<Self>) -> Option<Gray> {
                Some(Gray::$gray(handle))
            }
        }
    };
}

heap_object!(ObjFunction, functions, Function);
heap_object!(ObjUpvalue, upvalues, Upvalue);
heap_object!(ObjClosure, closures, Closure);
heap_object!(ObjClass, classes, Class);
heap_object!(ObjInstance, instances, Instance);
heap_object!(ObjBoundMethod, bound_methods, BoundMethod);

// The two leaf types are written out by hand: they are never gray.
impl HeapObject for ObjNative {
    fn arena(heap: &Heap) -> &Arena<Self> {
        &heap.natives
    }
    fn arena_mut(heap: &mut Heap) -> &mut Arena<Self> {
        &mut heap.natives
    }
    fn marks(marks: &mut Marks) -> &mut Vec<bool> {
        &mut marks.natives
    }
    fn gray(_: Gc<Self>) -> Option<Gray> {
        None
    }
}

/// A string's size includes its characters.
impl HeapObject for ObjString {
    fn arena(heap: &Heap) -> &Arena<Self> {
        &heap.strings
    }
    fn arena_mut(heap: &mut Heap) -> &mut Arena<Self> {
        &mut heap.strings
    }
    fn marks(marks: &mut Marks) -> &mut Vec<bool> {
        &mut marks.strings
    }
    fn gray(_: Gc<Self>) -> Option<Gray> {
        None
    }
    fn size(&self) -> usize {
        size_of::<Self>() + self.chars.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn interning_gives_equal_strings_one_handle() {
        let mut heap = Heap::new();
        let a = heap.intern("hello");
        let b = heap.intern_owned(String::from("hel") + "lo");
        assert_eq!(a, b);
        assert_ne!(a, heap.intern("world"));
        assert_eq!(heap.str(a), "hello");
    }

    #[test]
    fn collects_what_the_roots_cannot_reach() {
        let mut heap = Heap::new();
        heap.poison_freed = true;
        let kept = heap.intern("kept");
        let lost = heap.intern("lost");
        let class = heap.alloc(ObjClass { name: kept, methods: Table::new() });
        heap.collect(&[&class]);
        assert_eq!(heap.freed, 1);
        assert_eq!(heap.str(heap[class].name), "kept");
        assert!(heap.strings.slot(lost.handle.index()).is_none());
        // The weak string table forgot it, so interning makes a new one.
        assert_ne!(heap.intern("lost"), lost);
    }
}
