//! Heap objects, the arenas that hold them, and the typed handles that
//! point into the arenas (book chapters 49, 50 and 56 to 59).
//!
//! clox links its objects together with raw pointers. Safe Rust can't do
//! that without reference counting, and `Rc<RefCell<..>>` would hand
//! memory management to Rust instead of to our own garbage collector. So
//! each kind of object lives in an [`Arena`], a `Vec` of slots, and a
//! reference to an object is a [`Gc`]: the index of its slot, typed so a
//! closure handle can never be used to look up a class.

use std::fmt;
use std::marker::PhantomData;
use std::rc::Rc;

use crate::chunk::Chunk;
use crate::table::Table;
use crate::value::Value;

/// A handle to an object of type `T` in the heap: in effect a pointer.
pub struct Gc<T> {
    index: u32,
    // `fn() -> T` makes the handle Copy, Send and Sync whatever `T` is.
    marker: PhantomData<fn() -> T>,
}

impl<T> Gc<T> {
    fn new(index: usize) -> Self {
        let index = u32::try_from(index).expect("heap has over 4 billion objects");
        Gc { index, marker: PhantomData }
    }

    /// The index of the object's slot in its arena.
    pub fn index(self) -> usize {
        self.index as usize
    }
}

// Written by hand: `#[derive]` would demand `T: Clone`, `T: PartialEq`...
impl<T> Clone for Gc<T> {
    fn clone(&self) -> Self {
        *self
    }
}
impl<T> Copy for Gc<T> {}
impl<T> PartialEq for Gc<T> {
    fn eq(&self, other: &Self) -> bool {
        self.index == other.index
    }
}
impl<T> Eq for Gc<T> {}
impl<T> fmt::Debug for Gc<T> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Gc({})", self.index)
    }
}

/// A handle to an interned string, which carries the string's hash too.
///
/// A [`Value`] takes 16 bytes whatever it holds, so the hash rides along
/// for free, and the hash table never visits the heap to hash a key.
/// Strings are interned, so two equal strings have the same handle.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct StrRef {
    pub handle: Gc<ObjString>,
    pub hash: u32,
}

/// A growable array of slots, one per object. Freed slots are reused.
pub struct Arena<T> {
    slots: Vec<Option<T>>,
    free: Vec<u32>,
}

impl<T> Default for Arena<T> {
    fn default() -> Self {
        Arena { slots: Vec::new(), free: Vec::new() }
    }
}

impl<T> Arena<T> {
    /// Store an object and return its handle.
    pub fn insert(&mut self, object: T) -> Gc<T> {
        if let Some(index) = self.free.pop() {
            self.slots[index as usize] = Some(object);
            return Gc::new(index as usize);
        }
        self.slots.push(Some(object));
        Gc::new(self.slots.len() - 1)
    }

    /// Free a slot. With `reuse` false the slot is never handed out again,
    /// so any later use of the stale handle panics instead of quietly
    /// reading whatever object moved in: the debug and stress modes do
    /// this, like the TypeScript heap's poisoning.
    pub fn remove(&mut self, index: usize, reuse: bool) -> Option<T> {
        let object = self.slots[index].take();
        if reuse && object.is_some() {
            self.free.push(index as u32);
        }
        object
    }

    /// How many slots there are, live or free.
    pub fn capacity(&self) -> usize {
        self.slots.len()
    }

    /// The object in slot `index`, if it is live.
    pub fn slot(&self, index: usize) -> Option<&T> {
        self.slots[index].as_ref()
    }

    pub fn live_count(&self) -> usize {
        self.slots.iter().filter(|s| s.is_some()).count()
    }
}

impl<T> std::ops::Index<Gc<T>> for Arena<T> {
    type Output = T;
    fn index(&self, handle: Gc<T>) -> &T {
        match &self.slots[handle.index()] {
            Some(object) => object,
            None => use_after_free::<T>(),
        }
    }
}

impl<T> std::ops::IndexMut<Gc<T>> for Arena<T> {
    fn index_mut(&mut self, handle: Gc<T>) -> &mut T {
        match &mut self.slots[handle.index()] {
            Some(object) => object,
            None => use_after_free::<T>(),
        }
    }
}

/// A freed object was used: the collector missed a root. This is the
/// classic garbage collector bug, so it fails loudly.
#[cold]
fn use_after_free<T>() -> ! {
    let kind = std::any::type_name::<T>().rsplit("::").next().unwrap_or("");
    panic!("use after free: a {kind} was collected while still in use")
}

// ---- the objects ---------------------------------------------------------

pub struct ObjString {
    pub chars: Box<str>,
    pub hash: u32,
}

pub struct ObjFunction {
    pub arity: usize,
    pub upvalue_count: usize,
    /// Frozen once compiled. The `Rc` lets the VM hold the running
    /// function's chunk in a register of its own, so reading a byte
    /// doesn't go through the heap (see `Vm::chunk`).
    pub chunk: Rc<Chunk>,
    /// `None` for the top-level script.
    pub name: Option<StrRef>,
}

/// A function written in Rust, such as `clock`.
pub type NativeFn = fn(&[Value]) -> Value;

pub struct ObjNative {
    pub arity: usize,
    pub function: NativeFn,
}

/// A variable captured by a closure (chapter 56).
pub enum ObjUpvalue {
    /// The variable is still on the stack, in this slot.
    Open(usize),
    /// The variable's frame has returned, so the upvalue holds it.
    Closed(Value),
}

pub struct ObjClosure {
    pub function: Gc<ObjFunction>,
    pub upvalues: Vec<Gc<ObjUpvalue>>,
}

pub struct ObjClass {
    pub name: StrRef,
    pub methods: Table,
}

pub struct ObjInstance {
    pub class: Gc<ObjClass>,
    pub fields: Table,
}

/// A method together with the instance it was looked up on.
pub struct ObjBoundMethod {
    pub receiver: Value,
    pub method: Gc<ObjClosure>,
}

/// FNV-1a: a simple, decent hash for strings (chapter 51). The TypeScript
/// VM hashes UTF-16 code units and we hash UTF-8 bytes, so the two agree
/// on ASCII strings; nothing a program can observe depends on the hash.
pub fn hash_string(s: &str) -> u32 {
    let mut hash: u32 = 2_166_136_261;
    for byte in s.bytes() {
        hash ^= u32::from(byte);
        hash = hash.wrapping_mul(16_777_619);
    }
    hash
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn arenas_reuse_freed_slots_only_when_asked() {
        let mut arena = Arena::default();
        let a = arena.insert(1);
        let b = arena.insert(2);
        assert_eq!(arena[b], 2);
        arena.remove(a.index(), true);
        assert_eq!(arena.insert(3), a);
        arena.remove(b.index(), false);
        assert_ne!(arena.insert(4), b);
    }

    #[test]
    #[should_panic(expected = "use after free")]
    fn using_a_freed_handle_panics() {
        let mut arena = Arena::default();
        let a = arena.insert("x");
        arena.remove(a.index(), false);
        let _ = arena[a];
    }

    #[test]
    fn hashes_with_fnv_1a() {
        assert_eq!(hash_string(""), 2_166_136_261);
        assert_eq!(hash_string("a"), 0xe40c292c);
    }
}
