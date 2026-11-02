// Chapter 269 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'si-hash-twice': {
    q: 'Where does drip-rs store a string’s hash?',
    a: 'Twice: in the `ObjString` and in every `StrRef` handle to it, next to the `Gc<ObjString>`.',
  },
  'si-no-heap': {
    q: 'Why does it matter that `Table::set` doesn’t need the heap?',
    a: 'Tables live inside heap objects. `heap[instance].fields.set(...)` already borrows the heap mutably, so `set` couldn’t also borrow the strings arena (E0502).',
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
    q: 'Why does the VM call `intern_owned(String)` for the result of `+`?',
    a: 'It hands over the string it just built, so the heap can keep that allocation. `intern(&str)` has to copy the text.',
  },
  'si-fnv': {
    q: 'What does `hash.wrapping_mul(16_777_619)` correspond to in the TypeScript VM?',
    a: '`Math.imul(h, 16777619)`: a 32-bit multiply that keeps the low 32 bits.',
  },
  'si-tombstone': {
    q: 'How does drip-rs’s table tell an empty slot from a tombstone?',
    a: 'Both have key `None`. Empty has value `Nil`; a tombstone has value `Bool(true)`.',
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

export const examples = {};

export const exercises = {
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
      '`let mut i = h as usize & (CAP - 1);` gives the first slot. `CAP` is a power of two, so the mask is a cheap remainder.',
      'Loop with `let Some(k) = self.keys[i] else { break; };`. Compare `k.hash == h` first, and only then `self.str(k) == chars`.',
      'After the loop, slot `i` is empty. The new id is `self.strings.len()`, taken before you push.',
    ],
    walkthrough: `**This is \`Heap::intern\` plus \`find_string\`.** drip-rs splits it into two functions; here they are one loop.

**Hash first, text second.** Comparing two \`u32\`s is cheap, and two different strings rarely share a whole 32-bit hash, so \`self.str(k) == chars\` almost only runs for the real match. It still has to run: equal hashes don't prove equal strings.

**Probing.** \`k0\`…\`k99\` in 256 slots collide plenty. A version that looks only at the first slot either returns the wrong string or overwrites another string's entry, and then that string is interned twice. That is what the last test catches.

**Borrows.** \`self.keys[i]\` is an \`Option<StrRef>\`, which is \`Copy\`, so the \`let ... else\` copies it out and borrows nothing. \`self.str(k)\` borrows \`self\` immutably, and that borrow is over before the pushes at the end.

**Why not \`HashMap<String, u32>\`?** It would work. drip-rs uses its own table because the same table type serves globals, fields and methods, and because the collector must be able to delete entries for unreachable strings (chapter 274).`,
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
- A slot with key \`None\` and value \`Nil\` is empty: the probe ends there.
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
    Nil,
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
            vals: vec![Value::Nil; 8],
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
    Nil,
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
            vals: vec![Value::Nil; 8],
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
        let nil = vals[i] == Value::Nil;
        match keys[i] {
            None if nil => break,
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
    t.set(k(1, 4), Value::Nil);
    t.set(k(2, 4), Value::Nil);
    t.set(k(3, 4), Value::Num(3.0));
    t.delete(k(2, 4));
    assert_eq!(t.get(k(3, 4)),
        Some(Value::Num(3.0)));
}

#[test]
fn reuses_the_first_tombstone() {
    let mut t = Table::new();
    for id in 1..=4 {
        t.set(k(id, 4), Value::Nil);
    }
    t.delete(k(2, 4)); // slot 5
    t.delete(k(3, 4)); // slot 6
    t.set(k(9, 4), Value::Num(9.0));
    assert_eq!(t.keys[5], Some(k(9, 4)));
}

#[test]
fn wraps_around_the_end() {
    let mut t = Table::new();
    t.set(k(1, 7), Value::Nil);
    t.set(k(2, 7), Value::Num(2.0));
    assert_eq!(t.keys[0], Some(k(2, 7)));
    assert_eq!(t.get(k(2, 7)),
        Some(Value::Num(2.0)));
}`,
    hints: [
      'Keep `let mut tomb: Option<usize> = None;` outside the loop.',
      'Inside, `match keys[i]` with guards: `None if vals[i] == Value::Nil` ends the probe, plain `None` is a tombstone, and `Some(k) if k == key` is the hit.',
      '`tomb.get_or_insert(i)` sets it only the first time. After the loop, return `tomb.unwrap_or(i)`.',
    ],
    walkthrough: `**Why tombstones keep probing.** Keys that collided were placed one after another. If a deleted slot in the middle looked empty, every key after it would become unreachable. That is the \`probes_past_a_tombstone\` test.

**Why the first tombstone.** Putting a new key in the earliest free slot of its probe sequence keeps lookups for it short. Remembering the last one also "works", but it puts the key further from home, and here the test pins down drip-rs's behaviour.

**Why the mask.** The capacity is a power of two, so \`& mask\` is the remainder, and it wraps from slot 7 to slot 0. Without it, the probe runs off the end of the \`Vec\`, and Rust panics with an out-of-bounds index instead of reading past the end.

**Two slices, not \`&self\`.** In drip-rs, \`find\` takes the two columns as slices so that \`grow\` can call it on the new, empty columns while it reads entries from the old ones.`,
    wrong: [
      {
        code: `#[derive(Clone, Copy, Debug, PartialEq)]
struct StrRef {
    id: u32,
    hash: u32,
}

#[derive(Clone, Copy, Debug, PartialEq)]
enum Value {
    Nil,
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
            vals: vec![Value::Nil; 8],
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
    Nil,
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
            vals: vec![Value::Nil; 8],
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
        let nil = vals[i] == Value::Nil;
        match keys[i] {
            None if nil => break,
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
    Nil,
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
            vals: vec![Value::Nil; 8],
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
        let nil = vals[i] == Value::Nil;
        match keys[i] {
            None if nil => break,
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
    q: 'What does a drip-rs `StrRef` contain?',
    options: [
      { t: 'A `&str` borrowed from the source', why: 'That is a token’s lexeme. A runtime string lives in the heap.' },
      { t: 'A `Gc<ObjString>` handle and the string’s 32-bit hash', correct: true, why: 'Eight bytes in all, and a `Value` is 16 bytes either way.' },
      { t: 'An owned `String`', why: 'Then `Value` couldn’t be `Copy`.' },
      { t: 'The string’s length and a pointer', why: 'That is roughly what `Box<str>` is, inside the `ObjString`.' },
    ],
  },
  {
    q: 'Why doesn’t drip-rs’s `Table::get` take the heap as a parameter?',
    options: [
      { t: 'It does, through a global variable', why: 'drip-rs has no mutable globals.' },
      { t: 'Tables only hold numbers', why: 'They hold `Value`s, which may be handles to anything.' },
      { t: 'It copies every key’s text into the table', why: 'Keys are `StrRef`s; the text stays in the heap.' },
      { t: 'The key carries its hash, and interned keys compare by handle, so nothing in the heap is needed', correct: true, why: 'And since tables live inside heap objects, needing the heap would cause borrow conflicts.' },
    ],
  },
  {
    q: 'In `Heap::intern`, when does drip-rs compare characters?',
    options: [
      { t: 'Only for a key in the probe whose hash equals the new string’s hash', correct: true, why: '`find_string` checks `key.hash == hash` first, then the text.' },
      { t: 'For every key in the table', why: 'It only looks along one probe sequence.' },
      { t: 'Never: equal hashes mean equal strings', why: 'Different strings can share a hash. The text must be checked.' },
      { t: 'Every time two strings are compared with `==` at run time', why: 'Interning is what makes `==` a handle comparison.' },
    ],
  },
  {
    q: 'A drip-rs table slot has key `None` and value `Bool(true)`. What is it?',
    options: [
      { t: 'An empty slot', why: 'Empty slots have value `Nil`.' },
      { t: 'A key whose value is `true`', why: 'A live entry has `Some(key)`.' },
      { t: 'A tombstone: a deleted entry that probes must pass over', correct: true, why: 'Same encoding as the TypeScript table’s `null` key with value `true`.' },
      { t: 'A slot reserved for growing', why: 'Growing builds new columns; there is no reserved slot.' },
    ],
  },
  {
    q: 'Why does `find` keep the *first* tombstone it passes?',
    options: [
      { t: 'So `set` reuses the earliest free slot on the key’s probe path', correct: true, why: '`tombstone.get_or_insert(index)` ignores later ones.' },
      { t: 'So `get` can return the deleted value', why: 'Deleted values are gone; a tombstone holds `true`.' },
      { t: 'Because Rust can’t store more than one `Option`', why: 'It could keep a whole `Vec` of them. One is all that’s needed.' },
      { t: 'To shrink the table', why: 'Tables only grow, and growing drops tombstones.' },
    ],
  },
  {
    q: 'Why does `Heap::intern` not need to protect the new string as a temporary root, as clox and the TypeScript heap do?',
    options: [
      { t: 'Strings are never collected', why: 'They are: the interned table is weak.' },
      { t: 'Rust’s ownership frees the string automatically', why: 'Objects in the heap are freed by drip-rs’s collector, not by drop.' },
      { t: 'The `StrRef` is a root by itself', why: 'Roots are what the caller passes to `collect`. A local `StrRef` isn’t one.' },
      { t: 'Nothing in `intern` can collect: the heap never starts a collection itself', correct: true, why: 'Callers like `Vm::intern_owned` collect before calling, while they can still name their roots.' },
    ],
  },
];
