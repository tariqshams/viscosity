//! A hash table with open addressing and linear probing (book chapter 51).
//!
//! Keys are interned strings, so two keys are equal exactly when their
//! handles are. Like the TypeScript table, storage is a struct of arrays,
//! one `Vec` of keys and one of values, and a deleted entry leaves a
//! *tombstone* (no key, value `true`) so probe sequences stay unbroken.

use crate::object::{Arena, ObjString, StrRef};
use crate::value::Value;

/// Grow when more than three quarters of the slots are in use.
const MAX_LOAD: f64 = 0.75;
/// The value in an empty slot whose key was deleted.
const TOMBSTONE: Value = Value::Bool(true);

#[derive(Clone, Default)]
pub struct Table {
    /// Live entries plus tombstones: both lengthen probe sequences.
    count: usize,
    keys: Vec<Option<StrRef>>,
    values: Vec<Value>,
}

impl Table {
    pub fn new() -> Self {
        Table::default()
    }

    pub fn get(&self, key: StrRef) -> Option<Value> {
        if self.count == 0 {
            return None;
        }
        let i = find(&self.keys, &self.values, key);
        self.keys[i].map(|_| self.values[i])
    }

    /// Insert or overwrite. Returns true if the key was new.
    pub fn set(&mut self, key: StrRef, value: Value) -> bool {
        if (self.count + 1) as f64 > self.keys.len() as f64 * MAX_LOAD {
            let capacity = if self.keys.len() < 8 { 8 } else { self.keys.len() * 2 };
            self.grow(capacity);
        }
        let i = find(&self.keys, &self.values, key);
        let is_new = self.keys[i].is_none();
        // Reusing a tombstone doesn't change the count: it was counted.
        if is_new && self.values[i] == Value::None {
            self.count += 1;
        }
        self.keys[i] = Some(key);
        self.values[i] = value;
        is_new
    }

    /// Remove a key, leaving a tombstone. Returns true if it was there.
    pub fn delete(&mut self, key: StrRef) -> bool {
        if self.count == 0 {
            return false;
        }
        let i = find(&self.keys, &self.values, key);
        if self.keys[i].is_none() {
            return false;
        }
        self.keys[i] = None;
        self.values[i] = TOMBSTONE;
        true
    }

    /// Copy every entry of `from` into this table (used for inheritance).
    pub fn add_all(&mut self, from: &Table) {
        for (key, value) in from.iter() {
            self.set(key, value);
        }
    }

    /// Look a string up by its characters: the heart of interning.
    pub fn find_string(
        &self,
        strings: &Arena<ObjString>,
        chars: &str,
        hash: u32,
    ) -> Option<StrRef> {
        if self.count == 0 {
            return None;
        }
        let mask = self.keys.len() - 1;
        let mut index = hash as usize & mask;
        loop {
            match self.keys[index] {
                None if self.values[index] == Value::None => return None,
                None => {} // a tombstone: keep probing
                Some(key) if key.hash == hash && &*strings[key.handle].chars == chars => {
                    return Some(key);
                }
                Some(_) => {}
            }
            index = (index + 1) & mask;
        }
    }

    /// Delete every entry whose key fails `keep`. The collector uses this
    /// to drop unmarked strings, because the string table is weak.
    pub fn retain_keys(&mut self, mut keep: impl FnMut(StrRef) -> bool) {
        for i in 0..self.keys.len() {
            if let Some(key) = self.keys[i]
                && !keep(key)
            {
                self.keys[i] = None;
                self.values[i] = TOMBSTONE;
            }
        }
    }

    /// Every live entry.
    pub fn iter(&self) -> impl Iterator<Item = (StrRef, Value)> + '_ {
        self.keys
            .iter()
            .zip(&self.values)
            .filter_map(|(key, value)| key.map(|k| (k, *value)))
    }

    fn grow(&mut self, capacity: usize) {
        let mut keys = vec![None; capacity];
        let mut values = vec![Value::None; capacity];
        // Tombstones are not copied, so recount from zero.
        let mut count = 0;
        for (key, value) in self.iter() {
            let i = find(&keys, &values, key);
            keys[i] = Some(key);
            values[i] = value;
            count += 1;
        }
        self.count = count;
        self.keys = keys;
        self.values = values;
    }
}

/// The index of `key`'s slot, or of the slot where it should go: the first
/// tombstone passed on the way, else the empty slot that ended the probe.
fn find(keys: &[Option<StrRef>], values: &[Value], key: StrRef) -> usize {
    // The capacity is a power of two, so `& mask` is a cheap `% capacity`.
    let mask = keys.len() - 1;
    let mut index = key.hash as usize & mask;
    let mut tombstone = None;
    loop {
        match keys[index] {
            None if values[index] == Value::None => return tombstone.unwrap_or(index),
            None => {
                tombstone.get_or_insert(index);
            }
            Some(k) if k == key => return index,
            Some(_) => {}
        }
        index = (index + 1) & mask;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::gc::Heap;

    #[test]
    fn sets_gets_and_deletes_across_growth() {
        let mut heap = Heap::new();
        let keys: Vec<StrRef> = (0..100).map(|i| heap.intern(&format!("k{i}"))).collect();
        let mut table = Table::new();
        for (i, &k) in keys.iter().enumerate() {
            assert!(table.set(k, Value::Number(i as f64)));
        }
        assert!(!table.set(keys[3], Value::None));
        for &k in keys.iter().step_by(2) {
            assert!(table.delete(k));
        }
        assert!(!table.delete(keys[0]));
        for (i, &k) in keys.iter().enumerate() {
            let expected = match i {
                3 => Some(Value::None),
                _ if i % 2 == 0 => None,
                _ => Some(Value::Number(i as f64)),
            };
            assert_eq!(table.get(k), expected);
        }
        assert_eq!(table.iter().count(), 50);
    }
}
